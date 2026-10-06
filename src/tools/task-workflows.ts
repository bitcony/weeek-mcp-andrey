import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekClient } from "../client.js";
import { Resolver } from "../resolver.js";
import { jsonReply, errorReply } from "./reply.js";
const nameOrId=z.union([z.string().trim().min(1),z.number().int().positive()]);
function pick(kind:string,value:string|number,items:Array<{id:number;name:string}>):number {
  const direct=items.find(x=>String(x.id)===String(value));
  if(direct)return direct.id;
  if(typeof value==='number'||/^\d+$/.test(value))throw new Error(`${kind} ID ${value} is outside the selected scope`);
  return Resolver.pickUnique(kind,value,items);
}

export function registerTaskWorkflowTools(server: McpServer, client: WeeekClient, resolver: Resolver): void {
  const wrap=(fn:(a:any)=>Promise<unknown>)=>async(a:any)=>{try{return jsonReply(await fn(a));}catch(e){return errorReply(e);}};
  server.registerTool('weeek_set_task_parent',{
    description:'Turn an existing task into a subtask, or detach it with parentId:null. Checks parent existence and prevents hierarchy cycles, then reads parentId back.',
    inputSchema:{id:z.number().int().positive(),parentId:z.number().int().positive().nullable()},annotations:{readOnlyHint:false,idempotentHint:false},
  },wrap(async a=>{
    if(a.parentId===a.id)throw new Error('A task cannot be its own parent');
    await client.getTask(a.id);
    if(a.parentId!==null){
      const seen=new Set<number>([a.id]);let current:number|null=a.parentId;
      for(let depth=0;current!==null;depth++){
        if(depth>=100||seen.has(current))throw new Error('Parent hierarchy is cyclic or exceeds 100 levels');
        seen.add(current);const parent=await client.getTask(current);if(parent.id!==current)throw new Error('Parent ID readback differs');current=parent.parentId;
      }
    }
    await client.request('POST',`/tm/tasks/${a.id}/parent`,{body:{parentId:a.parentId}});
    try {
      const task=await client.getTask(a.id);
      return task.id===a.id&&task.parentId===a.parentId?{verified:true,task}:{verified:false,updatedId:a.id,task,error:'Parent readback differs; inspect before retrying'};
    }catch(e){return {verified:false,updatedId:a.id,error:`Parent readback failed: ${e instanceof Error?e.message:String(e)}`};}
  }));
  server.registerTool('weeek_change_task_assignees',{
    description:'Add or remove existing workspace members from a task by exact name or member ID. Verifies assignees by GET; never repeats an uncertain mutation.',
    inputSchema:{id:z.number().int().positive(),action:z.enum(['add','remove']),assignees:z.array(z.string().trim().min(1)).min(1).max(100)},annotations:{readOnlyHint:false,idempotentHint:false},
  },wrap(async a=>{
    const before=await client.getTask(a.id);const members=await client.listMembers();
    const ids=[...new Set<string>(a.assignees.map((name:string)=>members.find(m=>m.id===name)?.id??Resolver.pickUnique('assignee',name,members)))];
    await client.request(a.action==='add'?'POST':'DELETE',`/tm/tasks/${a.id}/assignees`,{body:{assignees:ids}});
    try {
      const task=await client.getTask(a.id);
      const expected=a.action==='add'?[...new Set([...before.assignees,...ids])]:before.assignees.filter(id=>!ids.includes(id));
      const verified=task.id===a.id&&JSON.stringify([...task.assignees].sort())===JSON.stringify(expected.sort());
      return verified?{verified:true,task}:{verified:false,updatedId:a.id,task,error:'Assignee readback differs; inspect before retrying'};
    }catch(e){return {verified:false,updatedId:a.id,error:`Assignee readback failed: ${e instanceof Error?e.message:String(e)}`};}
  }));
  const comments=async(id:number,limit:number,offset:number)=>{
    const page=await client.request<{comments:any[];hasMore:boolean}>('GET',`/tm/tasks/${id}/comments`,{query:{limit,offset}});
    if(!Array.isArray(page.comments)||typeof page.hasMore!=='boolean')throw new Error('Invalid comments page; completeness is unknown');
    return {comments:page.comments,hasMore:page.hasMore};
  };
  const findComment=async(id:number,commentId:number)=>{
    for(let pageNo=0;pageNo<100;pageNo++){
      const page=await comments(id,100,pageNo*100);
      const found=page.comments.find(c=>c.id===commentId);if(found)return found;
      if(!page.hasMore)return undefined;
    }
    throw new Error('Comment pagination exceeded 100 pages; result is uncertain');
  };
  server.registerTool('weeek_add_task_comment',{
    description:'Append task content as a Markdown comment (or reply to parentId). Reads the exact created comment back. Never repeats POST on uncertainty; use createdId to reconcile.',
    inputSchema:{id:z.number().int().positive(),markdown:z.string().min(1).refine(v=>v.trim().length>0,'Comment must not be blank'),parentId:z.number().int().positive().optional()},annotations:{readOnlyHint:false,idempotentHint:false},
  },wrap(async a=>{
    await client.getTask(a.id);
    if(a.parentId!==undefined&&!await findComment(a.id,a.parentId))throw new Error('Parent comment does not belong to this task');
    const body={markdown:a.markdown,...(a.parentId===undefined?{}:{parentId:a.parentId})};
    const result=await client.request<{comment:{id:number}}>('POST',`/tm/tasks/${a.id}/comments`,{body});
    const createdId=result.comment?.id;
    if(!Number.isInteger(createdId)||createdId<=0)throw new Error('Comment creation returned no valid ID; do not automatically repeat POST');
    try {
      const comment=await findComment(a.id,createdId);
      return comment&&comment.markdown===a.markdown&&(comment.parentId??null)===(a.parentId??null)?{verified:true,comment}:{verified:false,createdId,error:'Comment readback differs; inspect this ID before retrying'};
    }catch(e){return {verified:false,createdId,error:`Comment readback failed: ${e instanceof Error?e.message:String(e)}`};}
  }));
  server.registerTool('weeek_list_task_comments',{
    description:'Read Markdown comments with explicit pagination; hasMore must be checked before treating the page as complete.',
    inputSchema:{id:z.number().int().positive(),limit:z.number().int().min(1).max(100).default(50),offset:z.number().int().nonnegative().default(0)},annotations:{readOnlyHint:true},
  },wrap(a=>comments(a.id,a.limit,a.offset)));
  server.registerTool('weeek_set_task_status',{
    description:'Move a task to an EXISTING column by name or ID, scoped to its project and optional board. Rejects ambiguous or foreign statuses. Reads the exact task back; never retries partial moves.',
    inputSchema:{id:z.number().int().positive(),project:nameOrId,status:nameOrId,board:nameOrId.optional()},
    annotations:{readOnlyHint:false,idempotentHint:false},
  },wrap(async a=>{
    const projects=await client.listProjects();const projectId=pick('project',a.project,projects);
    const task=await client.getTask(a.id);
    if(!task.locations.some(l=>l.projectId===projectId)&&task.projectId!==projectId)throw new Error('Task does not belong to selected project');
    const boards=await client.listBoards(projectId);
    const selected=a.board===undefined?boards:boards.filter(b=>b.id===pick('board',a.board,boards));
    const columns:Array<{id:number;name:string;boardId:number}>=[];
    for(const board of selected)for(const column of await client.listColumns(board.id))columns.push({...column,boardId:board.id});
    const columnId=pick('status',a.status,columns);const target=columns.find(c=>c.id===columnId)!;
    let wrote=false;
    try {
      wrote=true;if(!task.locations.some(l=>l.projectId===projectId&&l.boardId===target.boardId))await client.request('POST',`/tm/tasks/${a.id}/board`,{body:{boardId:target.boardId}});
      await client.request('POST',`/tm/tasks/${a.id}/board-column`,{body:{boardColumnId:target.id}});
      const updated=await client.getTask(a.id);
      const verified=updated.id===a.id&&updated.locations.some(l=>l.projectId===projectId&&l.boardId===target.boardId&&l.boardColumnId===target.id);
      return verified?{verified:true,task:updated}:{verified:false,updatedId:a.id,task:updated,error:'Move readback differs; inspect task before retrying'};
    }catch(e){if(wrote)return {verified:false,updatedId:a.id,error:`Move may be partial: ${e instanceof Error?e.message:String(e)}`};throw e;}
  }));
  server.registerTool("weeek_list_task_statuses", {
    description: "List existing boards and columns for a project.",
    inputSchema: { project: z.union([z.string(), z.number()]), board: z.union([z.string(), z.number()]).optional() },
    annotations: { readOnlyHint: true },
  }, async (args) => {
    try {
      const projectId = await resolver.resolveProject(args.project);
      const boards = await client.listBoards(projectId);
      const selectedId=args.board===undefined?undefined:(boards.find(b=>String(b.id)===String(args.board))?.id??Resolver.pickUnique('board',String(args.board),boards));
      const selected = selectedId===undefined?boards:boards.filter(b=>b.id===selectedId);
      const result = [];
      for (const board of selected) result.push({ boardId: board.id, board: board.name, columns: await client.listColumns(board.id) });
      return jsonReply(result);
    } catch (err) { return errorReply(err); }
  });
}
