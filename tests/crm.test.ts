import { describe, it, expect, vi, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildServer } from '../src/server.js';

const cfg={token:'t'.repeat(24),baseUrl:'https://api.weeek.net/public/v1',timeoutMs:1000};
function harness(fetchImpl: any) {
 vi.stubGlobal('fetch',fetchImpl);
 const handlers=new Map<string,Function>();
 vi.spyOn(McpServer.prototype,'registerTool').mockImplementation(((name:string,config:any,cb:Function)=>{
  handlers.set(name,(args:any)=>cb(z.object(config.inputSchema??{}).parse(args)));return undefined as any;
 }) as any);
 buildServer(cfg);
 return handlers;
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('CRM workflow',()=>{
 it('requires explicit confirmation before any API request',async()=>{
  const f=vi.fn();const h=harness(f);
  await expect(async()=>h.get('weeek_create_deal')!({funnel:'x',status:'y',title:'z',confirm:false})).rejects.toThrow();
  expect(f).not.toHaveBeenCalled();
 });
 it('rejects duplicate funnel names without creating a deal',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:true,funnels:[{id:'1',name:'x'},{id:'2',name:'x'}]})));
  const h=harness(f);const r=await h.get('weeek_create_deal')!({funnel:'x',status:'y',title:'z',confirm:true});
  expect(r.isError).toBe(true);expect(f).toHaveBeenCalledTimes(1);
 });
 it('rejects a status ID outside the selected funnel',async()=>{
  const f=vi.fn(async(url:any)=>new Response(JSON.stringify(String(url).endsWith('/crm/funnels')?{success:true,funnels:[{id:'1',name:'x'}]}:{success:true,statuses:[{id:'a',name:'New'}]})));
  const h=harness(f);const r=await h.get('weeek_create_deal')!({funnel:'1',status:'outside',title:'z',confirm:true});
  expect(r.isError).toBe(true);expect(f).toHaveBeenCalledTimes(2);
 });
 it('returns the created ID on failed readback without repeating POST',async()=>{
  const f=vi.fn(async(url:any,init:any)=>{
   if(String(url).endsWith('/crm/funnels'))return new Response(JSON.stringify({success:true,funnels:[{id:'1',name:'x'}]}));
   if(String(url).endsWith('/statuses'))return new Response(JSON.stringify({success:true,statuses:[{id:'a',name:'New'}]}));
   if(init.method==='POST')return new Response(JSON.stringify({success:true,deal:{id:'known-id'}}));
   throw new Error('network failure');
  });
  const h=harness(f);const r=await h.get('weeek_create_deal')!({funnel:'1',status:'a',title:'z',confirm:true});
  expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,createdId:'known-id'});
  expect(f.mock.calls.filter(c=>c[1].method==='POST')).toHaveLength(1);
 });
 it('treats HTTP 200 success:false as an API error',async()=>{
  const f=vi.fn(async()=>new Response(JSON.stringify({success:false,message:'denied'}),{status:200}));
  const h=harness(f); const r=await h.get('weeek_list_funnels')!({});
  expect(r.isError).toBe(true);expect(r.content[0].text).toContain('denied');
 });
 it('lists CRM records and creates a confirmed deal by names with exact readback',async()=>{
  const deal={id:'deal-1',funnelId:'f-1',statusId:'s-1',title:'Обучение',amount:25000};
  const f=vi.fn(async (url:any,init:any)=>{
   const path=new URL(String(url)).pathname.replace('/public/v1','');
   const body=path==='/crm/funnels'?{success:true,funnels:[{id:'f-1',name:'Продажи'}]}:
     path==='/crm/funnels/f-1/statuses'?{success:true,statuses:[{id:'s-1',name:'Новый'}]}:
     path==='/crm/statuses/s-1/deals'&&init.method==='GET'?{success:true,deals:[deal],hasMoreDeals:true}:
     path==='/crm/statuses/s-1/deals'&&init.method==='POST'?{success:true,deal}:
     path==='/crm/deals/deal-1'?{success:true,deal}:null;
   if(!body)throw new Error('Unexpected path '+path);
   return new Response(JSON.stringify(body),{status:200});
  });
  const h=harness(f);
  for(const name of ['weeek_list_funnels','weeek_list_funnel_statuses','weeek_list_deals','weeek_get_deal','weeek_create_deal'])expect(h.has(name)).toBe(true);
  const parse=(r:any)=>JSON.parse(r.content[0].text);
  expect(parse(await h.get('weeek_list_funnels')!({}))[0].id).toBe('f-1');
  expect(parse(await h.get('weeek_list_funnel_statuses')!({funnel:'Продажи'}))[0].id).toBe('s-1');
  const page=parse(await h.get('weeek_list_deals')!({funnel:'Продажи',status:'Новый',search:'Обучение',limit:10,offset:0}));
  expect(page.hasMoreDeals).toBe(true);expect(page.deals).toEqual([deal]);
  expect(parse(await h.get('weeek_get_deal')!({id:'deal-1'}))).toEqual(deal);
  expect(parse(await h.get('weeek_create_deal')!({funnel:'Продажи',status:'Новый',title:'Обучение',amount:25000,confirm:true}))).toMatchObject({verified:true,deal});
  const post=f.mock.calls.find(c=>c[1].method==='POST');
  expect(JSON.parse(post![1].body)).toEqual({title:'Обучение',amount:25000});
  expect(f.mock.calls.at(-1)![1].method).toBe('GET');
 });
});
