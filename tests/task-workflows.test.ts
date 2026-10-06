import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WeeekClient } from "../src/client.js";
import { Resolver } from "../src/resolver.js";
import { NameCache } from "../src/cache.js";
import { registerTaskWorkflowTools } from "../src/tools/task-workflows.js";
function harness(fetcher: typeof fetch) {
  const client = new WeeekClient({ token: "controlled", baseUrl: "https://api.test", timeoutMs: 1000 } as any, fetcher);
  const resolver = new Resolver(client, new NameCache(1000, () => 0));
  const server = new McpServer({ name: "test", version: "0" });
  const handlers = new Map<string, Function>();
  vi.spyOn(server, "registerTool").mockImplementation(((name: string, cfg: any, cb: Function) => {
    handlers.set(name, (args: unknown) => cb(z.object(cfg.inputSchema).parse(args)));
    return undefined as any;
  }) as any);
  registerTaskWorkflowTools(server, client, resolver); return handlers;
}
const response = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status });
function fixture(){
 const state:any={task:{id:42,title:'Test',parentId:null,assignees:[],locations:[{projectId:2,boardId:4,boardColumnId:10}]},comments:[],ignored:false};
 const f=vi.fn(async(input:any,init:any={})=>{
  const u=new URL(String(input)),p=u.pathname,m=init.method,b=init.body?JSON.parse(init.body):{};
  if(p==='/tm/projects')return response({success:true,projects:[{id:2,name:'Business'}]});
  if(p==='/tm/boards')return response({success:true,boards:[{id:4,name:'Main',projectId:2}]});
  if(p==='/tm/board-columns')return response({success:true,boardColumns:state.columns??[{id:10,name:'New'},{id:11,name:'Doing'},{id:12,name:'Done'}]});
  if(p==='/tm/tasks/42/comments'&&m==='GET'){const off=Number(u.searchParams.get('offset')??0),limit=Number(u.searchParams.get('limit')??50);return response({comments:state.comments.slice(off,off+limit),hasMore:state.comments.length>off+limit});}
  if(p==='/tm/tasks/42/comments'&&m==='POST'){const comment={id:100+state.comments.length,parentId:b.parentId??null,markdown:b.markdown};if(!state.ignored)state.comments.push(comment);return response({comment});}
  if(p==='/ws/members')return response({success:true,members:[{id:'11111111-1111-1111-1111-111111111111',firstName:'Alex',lastName:'Doe'}]});
  if(p==='/tm/tasks/42/assignees'&&(m==='POST'||m==='DELETE')){if(!state.ignored)state.task.assignees=m==='POST'?[...new Set([...state.task.assignees,...b.assignees])]:state.task.assignees.filter((x:string)=>!b.assignees.includes(x));return response({success:true});}
  if(p==='/tm/tasks/43'&&m==='GET')return response({success:true,task:state.parent??{id:43,parentId:null,locations:[{projectId:2}]}});
  if(p==='/tm/tasks/42/parent'&&m==='POST'){if(!state.ignored)state.task.parentId=b.parentId;return response({success:true});}
  if(p==='/tm/tasks/42/board'&&m==='POST'){if(!state.ignored)state.task.locations[0].boardId=b.boardId;return response({success:true});}
  if(p==='/tm/tasks/42/board-column'&&m==='POST'){if(!state.ignored)state.task.locations[0].boardColumnId=b.boardColumnId;return response({success:true});}
  if(p==='/tm/tasks/42'&&m==='GET')return response({success:true,task:state.task});
  throw new Error('Unexpected '+m+' '+p);
 });return {state,f,h:harness(f as any)};
}
describe("task workflow tools", () => {
  it("lists existing boards and columns for a project", async () => {
    const fetcher = vi.fn(async (input: any) => new URL(String(input)).pathname.endsWith("/tm/boards") ? response({ boards: [{ id: 4, name: "Main" }] }) : response({ boardColumns: [{ id: 8, name: "Done" }] }));
    const result = await harness(fetcher as any).get("weeek_list_task_statuses")!({ project: 2 });
    expect(JSON.parse(result.content[0].text)).toEqual([{ boardId: 4, board: "Main", columns: [{ id: 8, name: "Done" }] }]);
  });
  it("selects a board by numeric ID", async () => {
    const fetcher = vi.fn(async (input: any) => { const u = new URL(String(input)); return u.pathname.endsWith("/tm/boards") ? response({ boards: [{ id: 4, name: "Main" }, { id: 5, name: "Other" }] }) : response({ boardColumns: [{ id: Number(u.searchParams.get("boardId")), name: "column" }] }); });
    const result = await harness(fetcher as any).get("weeek_list_task_statuses")!({ project: 2, board: 5 });
    expect(JSON.parse(result.content[0].text)).toEqual([{ boardId: 5, board: "Other", columns: [{ id: 5, name: "column" }] }]);
  });
  it('selects the exact named board rather than the first board',async()=>{
    const f=vi.fn(async(input:any)=>{const u=new URL(String(input));return u.pathname.endsWith('/tm/boards')?response({boards:[{id:4,name:'Main'},{id:5,name:'Other'}]}):response({boardColumns:[{id:Number(u.searchParams.get('boardId')),name:'column'}]});});
    const r=await harness(f as any).get('weeek_list_task_statuses')!({project:2,board:'Other'});
    expect(JSON.parse(r.content[0].text)[0].boardId).toBe(5);
  });
  it('moves a task within the selected project and verifies its location',async()=>{
    const {f,h}=fixture();expect(h.has('weeek_set_task_status')).toBe(true);
    const r=await h.get('weeek_set_task_status')!({id:42,project:'Business',status:'Doing'});
    expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true,task:{id:42,locations:[{projectId:2,boardId:4,boardColumnId:11}]}});
    expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(1);
  });
  it.each([{status:999},{status:'Done',board:99}])('refuses foreign numeric status/board before mutation: %j',async args=>{
    const {f,h}=fixture();const r=await h.get('weeek_set_task_status')!({id:42,project:2,...args});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);
  });
  it('rejects task outside project',async()=>{const {state,f,h}=fixture();state.task.locations[0].projectId=9;const r=await h.get('weeek_set_task_status')!({id:42,project:2,status:'Done'});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);});
  it('reports ambiguous status candidates without writes',async()=>{const {state,f,h}=fixture();state.columns=[{id:11,name:'Doing'},{id:12,name:'Doing'}];const r=await h.get('weeek_set_task_status')!({id:42,project:2,status:'Doing'});expect(r.isError).toBe(true);expect(JSON.parse(r.content[0].text).candidates).toHaveLength(2);expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);});
  it('returns updatedId on silently ignored moves without retrying',async()=>{const {state,f,h}=fixture();state.ignored=true;const r=await h.get('weeek_set_task_status')!({id:42,project:2,status:'Done'});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,updatedId:42});expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(1);});
  it('lists comment pages and preserves hasMore',async()=>{
    const {state,h}=fixture();state.comments=[{id:1,markdown:'First'},{id:2,markdown:'Second'}];expect(h.has('weeek_list_task_comments')).toBe(true);
    const r=await h.get('weeek_list_task_comments')!({id:42,limit:1,offset:0});expect(JSON.parse(r.content[0].text)).toEqual({comments:[state.comments[0]],hasMore:true});
  });
  it('adds Markdown content and verifies the exact new comment ID',async()=>{
    const {state,f,h}=fixture();state.comments=Array.from({length:101},(_,i)=>({id:i,markdown:'old'}));expect(h.has('weeek_add_task_comment')).toBe(true);
    const r=await h.get('weeek_add_task_comment')!({id:42,markdown:'## План\n- Проверить API'});
    expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true,comment:{id:201,markdown:'## План\n- Проверить API'}});
    expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(1);
  });
  it('adds and removes known assignees by name with readback',async()=>{
    const {h}=fixture();expect(h.has('weeek_change_task_assignees')).toBe(true);
    const added = await h.get("weeek_change_task_assignees")!({ id: 42, action: "add", assignees: ["Alex Doe"] });
    expect(JSON.parse(added.content[0].text)).toMatchObject({ verified: true, task: { assignees: ["11111111-1111-1111-1111-111111111111"] } });
    const removed=await h.get('weeek_change_task_assignees')!({id:42,action:'remove',assignees:['Alex Doe']});expect(JSON.parse(removed.content[0].text)).toMatchObject({verified:true,task:{assignees:[]}});
  });
  it('attaches a subtask to its parent and can make it top-level again',async()=>{
    const {h}=fixture();expect(h.has('weeek_set_task_parent')).toBe(true);
    for(const parentId of [43,null]){const r=await h.get('weeek_set_task_parent')!({id:42,parentId});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true,task:{id:42,parentId}});}
  });
  it('rejects an unknown member before mutation',async()=>{const {f,h}=fixture();const r=await h.get('weeek_change_task_assignees')!({id:42,action:'add',assignees:['00000000-0000-0000-0000-000000000000']});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);});
  it('preserves comment ID after ignored comment creation',async()=>{const {state,f,h}=fixture();state.ignored=true;const r=await h.get('weeek_add_task_comment')!({id:42,markdown:'Content'});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,createdId:100});expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(1);});
  it('adds a reply only to a comment on the same task',async()=>{const {state,h}=fixture();state.comments=[{id:9,markdown:'Parent'}];const r=await h.get('weeek_add_task_comment')!({id:42,markdown:'Reply',parentId:9});expect(JSON.parse(r.content[0].text)).toMatchObject({verified:true,comment:{parentId:9}});});
  it('rejects a foreign parent comment without writing',async()=>{const {f,h}=fixture();const r=await h.get('weeek_add_task_comment')!({id:42,markdown:'Reply',parentId:99});expect(r.isError).toBe(true);expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);});
  it('rejects a self-parent and a hierarchy cycle before writing',async()=>{const {state,f,h}=fixture();state.parent={id:43,parentId:42};for(const parentId of [42,43]){const r=await h.get('weeek_set_task_parent')!({id:42,parentId});expect(r.isError).toBe(true);}expect(f.mock.calls.filter(x=>x[1]?.method==='POST')).toHaveLength(0);});
  it.each(['weeek_change_task_assignees','weeek_set_task_parent'])('reports ignored mutation for %s',async name=>{const {state,h}=fixture();state.ignored=true;const args=name==='weeek_set_task_parent'?{id:42,parentId:43}:{id:42,action:'add',assignees:['Alex Doe']};const r=await h.get(name)!(args);expect(JSON.parse(r.content[0].text)).toMatchObject({verified:false,updatedId:42});});
  it('treats HTTP200 success:false comments as an API error',async()=>{const f=vi.fn(async()=>response({success:false,reason:'denied'}));const r=await harness(f as any).get('weeek_list_task_comments')!({id:42});expect(r.isError).toBe(true);expect(r.content[0].text).toContain('denied');});
});
