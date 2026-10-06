import {describe,it,expect,vi,afterEach} from 'vitest';
import {WeeekClient} from '../src/client.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {registerWriteTools} from '../src/tools/writes.js';
import {Resolver} from '../src/resolver.js';
import {NameCache} from '../src/cache.js';
const cfg={token:'t'.repeat(24),baseUrl:'https://api.weeek.net/public/v1',timeoutMs:1000};
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function harness(fetchImpl:any){
 const c=new WeeekClient(cfg,fetchImpl);const server=new McpServer({name:'t',version:'0'});const h=new Map<string,Function>();
 vi.spyOn(server,'registerTool').mockImplementation(((n:string,s:any,f:Function)=>{h.set(n,(a:any)=>f(z.object(s.inputSchema).parse(a)));return undefined as any;}) as any);
 registerWriteTools(server,c,new Resolver(c,new NameCache(1000)),{attachDir:'/allowed',maxBytes:1000});return h;
}
describe('Rich task fields',()=>{
 it('preserves planning fields and hierarchy returned by GET',async()=>{
  const raw={id:42,title:'Тест',parentId:41,subTasks:[43],priority:2,type:'call',tags:[7],duration:30,customFields:[{id:'f',value:'v'}],timeEntries:[{id:'e',duration:10}],dueDateTime:'2026-10-09T10:00:00Z',startDateTime:null};
  const c=new WeeekClient(cfg,vi.fn(async()=>new Response(JSON.stringify({success:true,task:raw}))) as any);
  expect(await c.getTask(42)).toMatchObject(raw);
 });
 it('updates rich planning fields without silently dropping them',async()=>{
  let task:any={id:42,title:'Тест'};
  const f=vi.fn(async(_u:any,init:any)=>{if(init.method==='PUT')task={...task,...JSON.parse(init.body)};return new Response(JSON.stringify({success:true,task}));});
  const h=harness(f);const fields={type:'meet',duration:45,tags:[7],dueDateTime:'2026-10-09T10:00:00Z'};
  const r=await h.get('weeek_update_task')!({id:42,...fields});
  expect(JSON.parse(f.mock.calls[0][1].body)).toEqual(fields);
  expect(JSON.parse(r.content[0].text)).toMatchObject(fields);
 });
 it('rejects ignored updates after GET without repeating PUT',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,title:'Old',priority:0}})));
  const c=new WeeekClient(cfg,f as any);
  await expect(c.updateTask(42,{priority:2})).rejects.toThrow(/ID 42.*readback/);
  expect(f.mock.calls.map(x=>x[1].method)).toEqual(['PUT','GET']);
 });
 it('verifies normalized datetime and custom field array responses',async()=>{
  const raw={id:42,title:'Тест',dueDateTime:'2026-10-09T10:00:00+00:00',customFields:[{id:'f',value:'v'},{id:'other',value:2}]};
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:raw})));
  const c=new WeeekClient(cfg,f as any);
  expect(await c.updateTask(42,{dueDateTime:'2026-10-09T10:00:00Z',customFields:{f:'v'}})).toMatchObject({id:42});
 });
 it('creates task type and custom fields while keeping description',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,title:'Созвон',type:'call',description:'Повестка',customFields:[{id:'f',value:'v'}]}})));
  const h=harness(f);await h.get('weeek_create_task')!({title:'Созвон',project:2,type:'call',description:'Повестка',customFields:{f:'v'}});
  expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({title:'Созвон',type:'call',description:'Повестка',customFields:{f:'v'}});
 });
 it('rejects incompatible date and datetime fields before writing',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42}})));const h=harness(f);
  const r=await h.get('weeek_update_task')!({id:42,dueDate:'2026-10-09',dueDateTime:'2026-10-09T10:00:00Z'});
  expect(r.isError).toBe(true);expect(f).not.toHaveBeenCalled();
 });
 it('reads an unscheduled created task back before returning success',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,title:'Тест',projectId:2}})));
  const c=new WeeekClient(cfg,f as any);expect((await c.createTask({title:'Тест',projectId:2})).id).toBe(42);
  expect(f.mock.calls.map(x=>x[1].method)).toEqual(['POST','GET']);
 });
 it('preserves created ID when creation fields differ on readback',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,title:'Other'}})));
  const c=new WeeekClient(cfg,f as any);
  await expect(c.createTask({title:'Тест',projectId:2})).rejects.toThrow(/ID 42.*readback/);
  expect(f.mock.calls.map(x=>x[1].method)).toEqual(['POST','GET']);
 });
 it('rejects an empty task update before writing',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42}})));const h=harness(f);
  const r=await h.get('weeek_update_task')!({id:42});expect(r.isError).toBe(true);expect(f).not.toHaveBeenCalled();
 });
});
