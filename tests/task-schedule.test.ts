import { describe,it,expect,vi,afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildServer } from '../src/server.js';
const cfg={token:'t'.repeat(24),baseUrl:'https://api.weeek.net/public/v1',timeoutMs:1000};
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function harness(fetchImpl:any){
 vi.stubGlobal('fetch',fetchImpl);const h=new Map<string,Function>();
 vi.spyOn(McpServer.prototype,'registerTool').mockImplementation(((n:string,c:any,f:Function)=>{h.set(n,(a:any)=>f(z.object(c.inputSchema??{}).parse(a)));return undefined as any;}) as any);
 buildServer(cfg);return h;
}
describe('Native task schedule',()=>{
 it('preserves a scheduling limit reason and the created ID',async()=>{
  const f=vi.fn(async(_url:any,init:any)=>new Response(JSON.stringify(init.method==='POST'?{success:true,task:{id:42,title:'T'}}:{success:false,reason:'limit'})));
  const h=harness(f);const r=await h.get('weeek_create_task')!({title:'T',project:2,startDate:'2026-10-06',dueDate:'2026-10-09'});
  expect(r.isError).toBe(true);expect(r.content[0].text).toContain('ID 42');expect(r.content[0].text).toContain('limit');
 });
 it('rejects an inverted date interval before creation',async()=>{
  const f=vi.fn();const h=harness(f);const r=await h.get('weeek_create_task')!({title:'T',project:2,startDate:'2026-10-09',dueDate:'2026-10-06'});
  expect(r.isError).toBe(true);expect(f).not.toHaveBeenCalled();
 });
 it('updates the native dueDate field rather than the ignored legacy dayFrom',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,dueDate:'2026-10-09'}})));
  const h=harness(f);await h.get('weeek_update_task')!({id:42,dueDate:'2026-10-09'});
  expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({dueDate:'2026-10-09'});
 });
 it('reports an already-created ID if WEEEK ignores scheduling without duplicate creation',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,task:{id:42,title:'T',startDate:null,dueDate:null}})));
  const h=harness(f);const r=await h.get('weeek_create_task')!({title:'T',project:2,dueDate:'2026-10-09'});
  expect(r.isError).toBe(true);expect(r.content[0].text).toContain('ID 42');
  expect(f.mock.calls.filter(c=>c[1].method==='POST')).toHaveLength(1);
 });
 it('rejects impossible native dates before issuing any API request',async()=>{
  const f=vi.fn();const h=harness(f);
  await expect(async()=>h.get('weeek_create_task')!({title:'План',project:2,dueDate:'2026-02-30'})).rejects.toThrow();
  expect(f).not.toHaveBeenCalled();
 });
 it('creates with native dates using PUT then verifies GET and preserves locations',async()=>{
  let task:any={id:42,title:'План',description:'Описание',locations:[{projectId:2,boardId:4,boardColumnId:10}],assignees:[],isCompleted:false,startDate:null,dueDate:null};
  const f=vi.fn(async(url:any,init:any)=>{
   if(init.method==='PUT')task={...task,...JSON.parse(init.body)};
   return new Response(JSON.stringify({success:true,task}),{status:200});
  });
  const h=harness(f);
  const res=await h.get('weeek_create_task')!({title:'План',project:2,column:10,description:'Описание',startDate:'2026-10-06',dueDate:'2026-10-09'});
  expect(res.isError).not.toBe(true);
  const result=JSON.parse(res.content[0].text);
  expect(result.startDate).toBe('2026-10-06');expect(result.dueDate).toBe('2026-10-09');
  expect(result.locations).toEqual(task.locations);expect(result.projectId).toBe(2);
  expect(f.mock.calls.map(c=>c[1].method)).toEqual(['POST','PUT','GET']);
  expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({startDate:'2026-10-06',dueDate:'2026-10-09'});
 });
});
