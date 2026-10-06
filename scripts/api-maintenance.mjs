import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const verbs=['get','post','put','patch','delete','head','options'];
export function inventory(schema){
 if(!schema.paths||typeof schema.paths!=='object')throw Error('No OpenAPI paths');
 return Object.entries(schema.paths).flatMap(([p,item])=>verbs.filter(m=>item[m]).map(m=>({method:m.toUpperCase(),path:p,summary:item[m].summary??'',operationId:item[m].operationId??'',tags:item[m].tags??[]}))).sort((a,b)=>(a.method+' '+a.path).localeCompare(b.method+' '+b.path));
}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function expand(value,schema,seen=new Set()){
 if(Array.isArray(value))return value.map(v=>expand(v,schema,seen));
 if(!value||typeof value!=='object')return value;
 if(value.$ref?.startsWith('#/')&&!seen.has(value.$ref)){
  const next=new Set(seen);next.add(value.$ref);
  const target=value.$ref.slice(2).split('/').reduce((x,k)=>x?.[k.replace(/~1/g,'/').replace(/~0/g,'~')],schema);
  return {...value,__resolved:expand(target,schema,next)};
 }
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,expand(v,schema,seen)]));
}
function contracts(schema){return Object.fromEntries(inventory(schema).map(x=>[x.method+' '+x.path,JSON.stringify(canonical(expand({operation:schema.paths[x.path][x.method.toLowerCase()],parameters:schema.paths[x.path].parameters,security:schema.security,servers:schema.servers},schema)))]));}
export function diffContracts(before,after){const a=contracts(before),b=contracts(after);return {added:Object.keys(b).filter(k=>!(k in a)),removed:Object.keys(a).filter(k=>!(k in b)),changed:Object.keys(b).filter(k=>k in a&&a[k]!==b[k])};}
export function parseBundle(text){
 if(/\bimport\s*(?:\(|[{"'*\w])/.test(text))throw Error('Schema module imports are not accepted');
 const match=text.match(/export\s*\{[^}]*\b([A-Za-z_$][\w$]*)\s+as\s+schema\b[^}]*\}\s*;?/);
 if(!match)throw Error('Unrecognized official schema bundle; manual review required');
 const code=text.replace(match[0],'')+'\n;JSON.stringify('+match[1]+');';
 const raw=vm.runInNewContext(code,Object.create(null),{timeout:3000,contextCodeGeneration:{strings:false,wasm:false}});
 const schema=JSON.parse(raw);inventory(schema);return schema;
}
export function renderMatrix(rows){const esc=v=>String(v??'').replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ');return '# Соответствие API WEEEK и нашего MCP\n\nСнимок контракта и карта реализации. implemented не означает полную поддержку всех полей или живую проверку. partial включает внутренние вызовы для разрешения имён.\n\n| Метод | Путь | API-сценарий | MCP | Покрытие | Тесты | Live | Ограничения |\n|---|---|---|---|---|---|---|---|\n'+rows.map(r=>[r.method,r.path,r.summary,r.tools.join(', ')||'—',r.coverage,r.tests.join(', ')||'—',r.liveVerified?'да':'нет',r.notes].map(esc).join(' | ')).map(r=>'| '+r+' |').join('\n')+'\n';}
async function getText(url){const u=new URL(url);if(u.origin!=='https://developers.weeek.net')throw Error('Only official documentation origin allowed');const r=await fetch(u,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status+' '+u.pathname);if(new URL(r.url).origin!==u.origin)throw Error('Cross-origin redirect');const text=await r.text();if(text.length>5000000)throw Error('Oversized documentation');return text;}
async function fetchOfficial(){
 const base='https://developers.weeek.net/';const html=await getText(base);
 const entry=html.match(/src=["']([^"']*entry[^"']*\.js)["']/)?.[1];if(!entry)throw Error('Entry script not found');
 const queue=[new URL(entry,base).href],seen=new Set();let bundle;
 while(queue.length&&seen.size<15&&!bundle){const url=queue.shift();if(seen.has(url))continue;seen.add(url);const text=await getText(url);const names=[...text.matchAll(/["']([^"']*weeek\.yaml-[\w-]+\.js)["']/g)];if(names.length){bundle=new URL(names[0][1],url).href;break;}
 for(const m of text.matchAll(/(?:from\s*|import\s*)["']([^"']+\.js)["']/g)){if(/(?:route|index|api|entry)/i.test(m[1]))queue.push(new URL(m[1],url).href);}
 }
 if(!bundle)throw Error('Schema URL not found; download reviewed OpenAPI JSON and use --candidate');
 const raw=await getText(bundle);return {schema:parseBundle(raw),source:bundle,sha256:crypto.createHash('sha256').update(raw).digest('hex')};
}
async function main(){
 const [action,...args]=process.argv.slice(2);
 if(action==='matrix'){
  const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/api/openapi-baseline.json'))),data=JSON.parse(fs.readFileSync(path.join(root,'docs/api-mapping.json')));const rows=Array.isArray(data)?data:data.operations;
  if(!rows)throw Error('Missing operations');const keys=rows.map(x=>x.method+' '+x.path),actual=inventory(schema).map(x=>x.method+' '+x.path);
  if(new Set(keys).size!==keys.length||keys.length!==actual.length||actual.some(k=>!keys.includes(k)))throw Error('Matrix does not match complete API baseline');
  fs.writeFileSync(path.join(root,'docs/API-MATRIX.md'),renderMatrix(rows));console.log('Verified matrix rows:',rows.length);return;
 }
 if(action==='check'){
  const old=JSON.parse(fs.readFileSync(path.join(root,'docs/api/openapi-baseline.json')));let candidate,meta;
  if(args[0]==='--candidate'&&args[1]){candidate=JSON.parse(fs.readFileSync(args[1]));meta={source:args[1]};}else {const fresh=await fetchOfficial();candidate=fresh.schema;meta={source:fresh.source,sha256:fresh.sha256};}
  const diff=diffContracts(old,candidate);const report={checkedAt:new Date().toISOString(),...meta,operationCount:inventory(candidate).length,...diff};
  const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'api-candidate.json'),JSON.stringify(candidate,null,2));fs.writeFileSync(path.join(dir,'api-diff.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(diff.added.length||diff.removed.length||diff.changed.length)process.exitCode=2;return;
 }
 throw Error('Use: node scripts/api-maintenance.mjs matrix | check [--candidate reviewed.json]');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
