import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function validateLiveOptions(args,env){
 const value=flag=>args.includes(flag)?args[args.indexOf(flag)+1]:undefined;
 const write=args.includes('--write');const project=value('--project')===undefined?undefined:Number(value('--project'));const funnel=value('--funnel');
 if(project!==undefined&&(!Number.isInteger(project)||project<=0))throw Error('Invalid --project');
 if(write&&(env.WEEEK_LIVE_WRITE!=='YES'||!project||!funnel))throw Error('Writes require WEEEK_LIVE_WRITE=YES, --write, --project ID and --funnel ID');
 return {write,project,funnel};
}
async function main(){
 const opts=validateLiveOptions(process.argv.slice(2),process.env);
 if(!process.env.WEEEK_API_TOKEN)throw Error('Load WEEEK_API_TOKEN locally via node --env-file; never paste it into chat');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');const report={startedAt:new Date().toISOString(),mode:opts.write?'write':'read-only',scope:opts,checks:[],createdTaskIds:[],createdDealIds:[]};
 const dir=path.join(root,'reports/live');fs.mkdirSync(dir,{recursive:true});const filename=path.join(dir,stamp+'.json');const save=()=>fs.writeFileSync(filename,JSON.stringify(report,null,2),{mode:0o600});save();
 const childEnv={PATH:process.env.PATH??'/usr/bin:/bin',HOME:process.env.HOME??root,WEEEK_API_TOKEN:process.env.WEEEK_API_TOKEN};
 for(const k of ['WEEEK_API_BASE_URL','WEEEK_TIMEOUT_MS'])if(process.env[k])childEnv[k]=process.env[k];
 const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'dist/index.js')],env:childEnv,stderr:'pipe'});
 const client=new Client({name:'weeek-fork-acceptance',version:'1'});
 async function call(name,args={}){
  const r=await client.callTool({name,arguments:args});let v;try{v=JSON.parse(r.content[0].text);}catch{throw Error(name+' returned non-JSON or validation failure');}
  report.checks.push({tool:name,args,result:v,isError:!!r.isError});
  if(name==='weeek_create_task'){const id=v.createdId??v.task?.id??v.id;if(id)report.createdTaskIds.push(id);}
  if(name==='weeek_create_deal'){const id=v.createdId??v.deal?.id??v.id;if(id)report.createdDealIds.push(id);}
  save();assert(!r.isError,name+' failed');assert(v.verified!==false,name+' readback uncertain; inspect report, never repeat blindly');return v;
 }
 try{
  await client.connect(transport);const tools=(await client.listTools()).tools;report.toolNames=tools.map(t=>t.name);save();
  for(const n of ['weeek_create_task','weeek_set_task_status','weeek_add_task_comment','weeek_set_deal_status','weeek_crm_summary'])assert(report.toolNames.includes(n),'Missing registered tool '+n);
  await call('weeek_version');const projects=await call('weeek_list_projects');await call('weeek_list_funnels');
  if(opts.project){assert(projects.some(p=>p.id===opts.project),'Project not found');await call('weeek_list_task_statuses',{project:opts.project});}
  if(opts.funnel)await call('weeek_crm_summary',{funnel:opts.funnel});
  if(opts.write){
   const boards=await call('weeek_list_task_statuses',{project:opts.project});const board=boards.find(b=>b.columns.length>=2);assert(board,'Test needs a board with at least two columns');
   const title='ТЕСТ MCP — '+stamp;
   const task=await call('weeek_create_task',{project:opts.project,column:board.columns[0].id,title,description:'Изолированная проверка MCP. Не бизнес-задача.'});const id=task.id;assert(Number.isInteger(id));
   for(const status of board.columns.slice(0,3))await call('weeek_set_task_status',{id,project:opts.project,board:board.boardId,status:status.id});
   const dueDate=new Date(Date.now()+86400000).toISOString().slice(0,10);await call('weeek_update_task',{id,title:title+' — проверено',priority:2,dueDate});
   const markdown='Тест содержания '+stamp;const comment=await call('weeek_add_task_comment',{id,markdown});assert.equal(comment.comment.markdown,markdown);const page=await call('weeek_list_task_comments',{id});assert(page.comments.some(c=>c.id===comment.comment.id));
   const members=await call('weeek_list_members');assert(members.length);await call('weeek_change_task_assignees',{id,action:'add',assignees:[members[0].id]});
   const child=await call('weeek_create_task',{project:opts.project,column:board.columns[0].id,title:title+' — подзадача'});
   await call('weeek_set_task_parent',{id:child.id,parentId:id});await call('weeek_set_task_parent',{id:child.id,parentId:null});
   for(const taskId of [child.id,id]){await call('weeek_complete_task',{id:taskId,completed:true});assert.equal((await call('weeek_get_task',{id:taskId})).completed,true);}
   const statuses=await call('weeek_list_funnel_statuses',{funnel:opts.funnel});assert(statuses.length>=2,'CRM needs two existing stages');
   const created=await call('weeek_create_deal',{funnel:opts.funnel,status:statuses[0].id,title,amount:0,confirm:true});const dealId=created.deal.id;
   await call('weeek_update_deal',{id:dealId,amount:1});await call('weeek_set_deal_status',{id:dealId,status:statuses[1].id});
   for(const winStatus of ['won','lost','archived'])await call('weeek_update_deal',{id:dealId,winStatus,amount:0});
   const final=await call('weeek_get_deal',{id:dealId});assert.equal(final.winStatus,'archived');assert.equal(final.amount,0);
   await call('weeek_crm_summary',{funnel:opts.funnel});
  }
  report.passed=true;
 }catch(e){report.passed=false;report.error=e.message;process.exitCode=1;
  // Reconcile known IDs only; do not create again or touch any pre-existing business record.
  for(const id of report.createdTaskIds)try{await call('weeek_complete_task',{id,completed:true});assert.equal((await call('weeek_get_task',{id})).completed,true);}catch{report.cleanupIncomplete=true;}
  for(const id of report.createdDealIds)try{await call('weeek_update_deal',{id,winStatus:'archived',amount:0});}catch{report.cleanupIncomplete=true;}
 }finally{report.completedAt=new Date().toISOString();save();await client.close();console.log(JSON.stringify({passed:report.passed,mode:report.mode,checks:report.checks.length,report:filename,createdTaskIds:report.createdTaskIds,createdDealIds:report.createdDealIds,error:report.error},null,2));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
