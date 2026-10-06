import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WeeekClient } from '../client.js';
import { Resolver } from '../resolver.js';
import { jsonReply, errorReply } from './reply.js';

const identity=z.string().trim().min(1).max(255);
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const matches=(key:string,actual:unknown,expected:unknown)=>{
 if(key!=='customFields')return same(actual,expected);
 const values=Array.isArray(actual)?Object.fromEntries(actual.map((f:any)=>[f.id,f.value])):actual as Record<string,unknown>;
 return values!=null&&Object.entries(expected as Record<string,unknown>).every(([k,v])=>same(values[k],v));
};
async function unique(value:string,kind:string,items:Array<{id:string;name:string}>):Promise<string>{
 const direct=items.find(x=>String(x.id)===value); return direct?direct.id:Resolver.pickUnique(kind,value,items);
}
export function registerCrmWorkflowTools(server:McpServer,client:WeeekClient):void{
 const wrap=(fn:(args:any)=>Promise<unknown>)=>async(args:any)=>{try{return jsonReply(await fn(args));}catch(e){return errorReply(e);}};
 server.registerTool('weeek_update_deal',{description:'Update deal fields and verify by reading the deal back.',inputSchema:{id:identity,title:z.string().min(1).max(255).optional(),amount:z.number().finite().nonnegative().optional(),winStatus:z.enum(['won','lost','archived']).nullable().optional(),customFields:z.record(z.unknown()).optional()},annotations:{readOnlyHint:false,idempotentHint:false}},wrap(async a=>{
  const patch:Record<string,unknown>={}; for(const k of ['title','amount','winStatus','customFields'])if(a[k]!==undefined)patch[k]=a[k];
  if(!Object.keys(patch).length)throw new Error('At least one deal field must be supplied.');
  await client.request('PATCH',`/crm/deals/${encodeURIComponent(a.id)}`,{body:patch});
  try{const deal=await client.getDeal(a.id);return deal.id===a.id&&Object.entries(patch).every(([k,v])=>matches(k,deal[k],v))?{verified:true,deal}:{verified:false,updatedId:a.id,deal,error:'Updated deal readback differs from requested fields.'};}
  catch(e){return {verified:false,updatedId:a.id,error:`Update may have succeeded; readback failed: ${e instanceof Error?e.message:String(e)}`};}
 }));
 server.registerTool('weeek_set_deal_status',{description:'Move a deal to a status in its existing funnel; verifies the result.',inputSchema:{id:identity,status:identity},annotations:{readOnlyHint:false,idempotentHint:false}},wrap(async a=>{
  const deal=await client.getDeal(a.id); if(deal.id!==a.id)throw new Error('Deal ID readback differs before mutation'); const funnelId=String(deal.funnelId??''); if(!funnelId)throw new Error('Deal has no funnelId.');
  const statuses=await client.listFunnelStatuses(funnelId); const statusId=await unique(a.status,'funnel status',statuses);
  if(!statuses.some(s=>String(s.id)===statusId))throw new Error('Status is not part of the deal funnel.');
  await client.request('PUT',`/crm/deals/${encodeURIComponent(a.id)}/status`,{body:{statusId}});
  try{const updated=await client.getDeal(a.id);return updated.id===a.id&&String(updated.funnelId)===funnelId&&String(updated.statusId)===statusId?{verified:true,deal:updated}:{verified:false,updatedId:a.id,deal:updated,error:'Status readback differs from requested status.'};}
  catch(e){return {verified:false,updatedId:a.id,error:`Status may have changed; readback failed: ${e instanceof Error?e.message:String(e)}`};}
 }));
 server.registerTool('weeek_crm_summary',{description:'Read a complete CRM funnel summary. Never returns partial results.',inputSchema:{funnel:identity,includeArchived:z.boolean().default(false)},annotations:{readOnlyHint:true}},wrap(async a=>{
  const funnelId=await unique(a.funnel,'funnel',await client.listFunnels()); const statuses=await client.listFunnelStatuses(funnelId);
  const all:Record<string,unknown>[]=[]; const seen=new Set<string>(); const groups:Record<string,{count:number;amount:number}>={};
  for(const status of statuses){let offset=0;let pages=0;let more=true;
   while(more){if(pages>=100)throw new Error(`CRM summary pagination exceeded 100 pages for status ${status.id}.`);pages++;
    const page=await client.listDeals(status.id,{limit:50,offset});
    if(!Array.isArray(page.deals)||typeof page.hasMoreDeals!=='boolean')throw new Error('Invalid deal page; summary completeness is unknown');
    for(const deal of page.deals){const id=String(deal.id??'');if(!id||seen.has(id))continue;seen.add(id);
     const win=String(deal.winStatus??'null');if(!a.includeArchived&&win==='archived')continue;
     all.push(deal);const key=`${status.name} / ${win}`;const g=groups[key]??={count:0,amount:0};g.count++;g.amount+=Number(deal.amount??0);
    }
    more=page.hasMoreDeals;offset+=50;
   }
  }
  return {funnelId,funnel: (await client.listFunnels()).find(f=>f.id===funnelId)?.name??funnelId,total:all.length,totalAmount:all.reduce((n,d)=>n+Number(d.amount??0),0),groups,deals:all};
 }));
}
