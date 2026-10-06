import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WeeekClient } from '../client.js';
import { Resolver } from '../resolver.js';
import { jsonReply, errorReply } from './reply.js';

const identity = z.string().trim().min(1).max(255);
const scope = {funnel:identity.describe('Exact funnel name or ID'),status:identity.describe('Exact status name or ID in the selected funnel')};
const bodyShape = {
 title:z.string().min(1).max(255), description:z.string().optional(), amount:z.number().finite().nonnegative().optional(),
 assignees:z.array(z.string().uuid()).optional(), organizations:z.array(z.string().uuid()).optional(),
 contacts:z.array(z.string().uuid()).optional(),tags:z.array(z.number().int()).optional(),
 customFields:z.record(z.unknown()).optional(),
};
async function resolve(value:string,kind:string,records:Array<{id:string;name:string}>):Promise<string> {
 const byId=records.find(x=>x.id===value);
 return byId?.id??Resolver.pickUnique(kind,value,records);
}
export function registerCrmTools(server:McpServer,client:WeeekClient):void {
 const wrap=(fn:(args:any)=>Promise<unknown>)=>async(args:any)=>{try{return jsonReply(await fn(args));}catch(e){return errorReply(e);}};
 async function resolveScope(args:{funnel:string;status?:string}) {
  const funnelId=await resolve(args.funnel,'funnel',await client.listFunnels());
  const statuses=await client.listFunnelStatuses(funnelId);
  const statusId=args.status===undefined?undefined:await resolve(args.status,'funnel status',statuses);
  return {funnelId,statusId,statuses};
 }
 server.registerTool('weeek_list_funnels',{description:'Read CRM funnels. Does not create funnels.',inputSchema:{},annotations:{readOnlyHint:true}},wrap(()=>client.listFunnels()));
 server.registerTool('weeek_list_funnel_statuses',{description:'Read statuses of a CRM funnel by exact name or ID.',inputSchema:{funnel:identity},annotations:{readOnlyHint:true}},wrap(async(args)=>(await resolveScope(args)).statuses));
 server.registerTool('weeek_list_deals',{description:'Read deals in a chosen funnel status. Preserves hasMoreDeals; use offset to paginate. Never interprets a partial page as the full CRM.',inputSchema:{...scope,search:z.string().optional(),limit:z.number().int().min(1).max(50).default(50),offset:z.number().int().nonnegative().default(0)},annotations:{readOnlyHint:true}},wrap(async(args)=>{
  const {statusId}=await resolveScope(args);
  return client.listDeals(statusId!,{search:args.search,limit:args.limit,offset:args.offset});
 }));
 server.registerTool('weeek_get_deal',{description:'Read a CRM deal by ID.',inputSchema:{id:identity},annotations:{readOnlyHint:true}},wrap(args=>client.getDeal(args.id)));
 server.registerTool('weeek_create_deal',{description:'Create a CRM deal only with explicit confirm:true. Validate funnel/status membership, then read the created deal back. Never retries an uncertain creation. CRM deals have no native deadline field in the documented API; put next actions in tasks.',inputSchema:{...scope,...bodyShape,confirm:z.literal(true)},annotations:{readOnlyHint:false,idempotentHint:false}},wrap(async(args)=>{
  const {funnelId,statusId}=await resolveScope(args);
  const body=z.object(bodyShape).parse(args);
  const created=await client.createDeal(statusId!,body);
  const id=String(created.id??'');
  if(!id)throw new Error('Creation response has no deal ID; outcome uncertain. Do not retry automatically.');
  let deal:Record<string,unknown>;
  try {deal=await client.getDeal(id);}catch {return {verified:false,createdId:id,error:'Deal creation returned an ID but readback failed. Check this ID before any retry.'};}
  const matches=deal.id===created.id&&deal.funnelId===funnelId&&deal.statusId===statusId&&Object.entries(body).every(([key,value])=>JSON.stringify(deal[key])===JSON.stringify(value));
  if(!matches)return {verified:false,createdId:id,deal,error:'Created deal differs from the requested fields; inspect before retrying.'};
  return {verified:true,deal};
 }));
}
