import {describe,it,expect} from 'vitest';
import { inventory, diffContracts, parseBundle, renderMatrix } from '../scripts/api-maintenance.mjs';
describe('API maintenance',()=>{
 it('enumerates unique HTTP operations, not path metadata',()=>{expect(inventory({paths:{'/a':{parameters:[],get:{summary:'Read'},post:{summary:'Write'}}}}).map(x=>x.method)).toEqual(['GET','POST']);});
 it('detects additions, removals and changed body or responses',()=>{const a={paths:{'/a':{get:{responses:{200:{}}}},'/b':{post:{}}}};const b={paths:{'/a':{get:{responses:{400:{}}}},'/c':{put:{}}}};expect(diffContracts(a,b)).toEqual({added:['PUT /c'],removed:['POST /b'],changed:['GET /a']});});
 it('ignores object key ordering',()=>{expect(diffContracts({paths:{'/a':{get:{x:1,y:2}}}},{paths:{'/a':{get:{y:2,x:1}}}}).changed).toEqual([]);});
 it('detects changed referenced component schemas',()=>{const make=(type:string)=>({paths:{'/a':{get:{responses:{$ref:'#/components/schemas/A'}}}},components:{schemas:{A:{type}}}});expect(diffContracts(make('string'),make('number')).changed).toEqual(['GET /a']);});
 it('extracts a data bundle and rejects imports',()=>{expect(parseBundle('const s={paths:{}};export{s as schema};').paths).toEqual({});expect(()=>parseBundle('import x from "evil";export{x as schema};')).toThrow();});
 it('renders one row per operation including absent MCP support',()=>{const result=renderMatrix([{method:'GET',path:'/a',summary:'a|b',tools:[],coverage:'not_implemented',tests:[],liveVerified:false,notes:'None'}]);expect(result).toContain('GET');expect(result).toContain('not_implemented');expect(result).toContain('a\\|b');});
});
