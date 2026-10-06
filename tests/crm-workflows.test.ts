import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WeeekClient } from '../src/client.js';
import { registerCrmWorkflowTools } from '../src/tools/crm-workflows.js';
const reply=(j:any)=>new Response(JSON.stringify(j));
function fixture(){
 const state:any={deal:{id:'d1',title:'Old',funnelId:'f1',statusId:'s1',amount:3,winStatus:null},statuses:[{id:'s1',name:'New'},{id:'s2',name:'Doing'}],ignored:false,pages:{},badSummary:false};
 const f=vi.fn(async(input:any,init:any={})=>{
  const u=new URL(String(input)),p=u.pathname,m=init.method,b=init.body?JSON.parse(init.body):{};
  if(p==='/crm/deals/d1'&&m==='PATCH'){if(!state.ignored)Object.assign(state.deal,b);return reply({success:true});}
  if(p==='/crm/deals/d1/status'&&m==='PUT'){if(!state.ignored)state.deal.statusId=b.statusId;return reply({success:true});}
  if(p==='/crm/deals/d1'&&m==='GET')return reply({success:true,deal:(state.deal.statusId==='s2'?state.readbackAfter:undefined)??state.readback??state.deal});
  if(p==='/crm/funnels')return reply({success:true,funnels:[{id:'f1',name:'Sales'}]});
  if(p==='/crm/funnels/f1/statuses')return reply({success:true,statuses:state.statuses});
  if(/^\/crm\/statuses\/[^/]+\/deals$/.test(p)){if(state.badSummary)return reply({success:false,reason:'denied'});const key=p.split('/')[3]+':'+(u.searchParams.get('offset')??'0');return reply(state.pages[key]??{success:true,deals:[],hasMoreDeals:false});}
  throw Error('Unexpected '+m+' '+p);
 });
 const client=new WeeekClient({token:'controlled',baseUrl:'https://api.test',timeoutMs:1000},f as any);const server=new McpServer({name:'test',version:'0'});const h=new Map<string,Function>();
 vi.spyOn(server,'registerTool').mockImplementation(((n:string,c:any,cb:Function)=>{h.set(n,(a:any)=>cb(z.object(c.inputSchema).parse(a)));return undefined as any;}) as any);registerCrmWorkflowTools(server,client);return {state,f,h};
}

describe('CRM workflows',()=>{
 it('updates a string deal id and verifies changed fields through real client fetch',async()=>{
  const deal:any={id:'z8IrHzfKaUTKu2BI',title:'Old',amount:3,winStatus:null,customFields:{}};
  const calls:any[]=[];
  const fetcher=vi.fn(async(input:any,init:any={})=>{
   const url=new URL(String(input)); calls.push([url.pathname,init.method,init.body]);
   if(init.method==='PATCH'){Object.assign(deal,JSON.parse(init.body));return new Response(JSON.stringify({success:true,deal}),{status:200});}
   if(url.pathname.endsWith('/crm/deals/'+deal.id))return new Response(JSON.stringify({success:true,deal}),{status:200});
   return new Response(JSON.stringify({success:true}),{status:200});
  });
  const client=new WeeekClient({token:'controlled',baseUrl:'https://api.test',timeoutMs:1000} as any,fetcher as any);
  const server=new McpServer({name:'test',version:'0'}); const handlers=new Map<string,Function>();
  vi.spyOn(server,'registerTool').mockImplementation(((n:string,c:any,cb:Function)=>{handlers.set(n,(a:any)=>cb(z.object(c.inputSchema).parse(a)));return undefined as any;}) as any);
  registerCrmWorkflowTools(server,client); const result=await handlers.get('weeek_update_deal')!({id:deal.id,title:'New',amount:0});
  expect(JSON.parse(result.content[0].text)).toEqual({verified:true,deal}); expect(calls.filter(c=>c[1]==='PATCH')).toHaveLength(1);
 });
 it('does not verify a readback from the wrong deal ID',async()=>{
  const {state,h}=fixture();state.readback={id:'other',amount:7};const r=await h.get('weeek_update_deal')!({id:'d1',amount:7});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,updatedId:'d1'});
 });
 it('rejects a summary when pagination completeness is unknown',async()=>{const {state,h}=fixture();state.pages['s1:0']={deals:[]};const r=await h.get('weeek_crm_summary')!({funnel:'Sales'});expect(r.isError).toBe(true);});
 it('moves a deal by exact stage name in its existing funnel',async()=>{const {h}=fixture();const r=await h.get('weeek_set_deal_status')!({id:'d1',status:'Doing'});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true,deal:{id:'d1',statusId:'s2',funnelId:'f1'}});});
 it.each(['foreign','Do'])('rejects invalid or partial stage %s without writes',async status=>{const {f,h}=fixture();const r=await h.get('weeek_set_deal_status')!({id:'d1',status});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='PUT')).toHaveLength(0);});
 it('rejects duplicate stage names',async()=>{const {state,f,h}=fixture();state.statuses=[{id:'s1',name:'Same'},{id:'s2',name:'Same'}];const r=await h.get('weeek_set_deal_status')!({id:'d1',status:'Same'});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='PUT')).toHaveLength(0);});
 it.each(['weeek_update_deal','weeek_set_deal_status'])('preserves ID on ignored mutation %s',async name=>{const {state,f,h}=fixture();state.ignored=true;const r=await h.get(name)!(name==='weeek_update_deal'?{id:'d1',amount:7}:{id:'d1',status:'Doing'});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,updatedId:'d1'});expect(f.mock.calls.filter(x=>['PUT','PATCH'].includes(x[1]?.method))).toHaveLength(1);});
 it('refuses empty deal updates before requests',async()=>{const {f,h}=fixture();const r=await h.get('weeek_update_deal')!({id:'d1'});expect(r.isError).toBe(true);expect(f).not.toHaveBeenCalled();});
 it('summarizes all pages, deduplicates and excludes archives by default',async()=>{
  const {state,h}=fixture();const a={id:'a',amount:10,winStatus:null},b={id:'b',amount:5,winStatus:'won'},c={id:'c',amount:50,winStatus:'archived'};
  state.pages={'s1:0':{deals:[a,c],hasMoreDeals:true},'s1:50':{deals:[a,b],hasMoreDeals:false},'s2:0':{deals:[],hasMoreDeals:false}};
  const parse=(r:any)=>JSON.parse(r.content[0].text);expect(parse(await h.get('weeek_crm_summary')!({funnel:'Sales'}))).toMatchObject({total:2,totalAmount:15,deals:[a,b]});
  expect(parse(await h.get('weeek_crm_summary')!({funnel:'Sales',includeArchived:true}))).toMatchObject({total:3,totalAmount:65});
 });
 it('never returns a partial summary after an API error',async()=>{const {state,h}=fixture();state.badSummary=true;const r=await h.get('weeek_crm_summary')!({funnel:'Sales'});expect(r.isError).toBe(true);expect(r.content[0].text).toContain('denied');});
 it('requires exact identity and funnel on status readback',async()=>{const {state,h}=fixture();state.readbackAfter={id:'other',funnelId:'f1',statusId:'s2'};const r=await h.get('weeek_set_deal_status')!({id:'d1',status:'Doing'});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,updatedId:'d1'});});
 it('verifies requested custom field values in the API array response',async()=>{const {state,h}=fixture();state.readback={id:'d1',customFields:[{id:'f',value:'v'},{id:'other',value:2}]};const r=await h.get('weeek_update_deal')!({id:'d1',customFields:{f:'v'}});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true});});
});
