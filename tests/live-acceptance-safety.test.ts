import {describe,it,expect} from 'vitest';
import {validateLiveOptions} from '../scripts/live-acceptance.mjs';
describe('live acceptance safety',()=>{
 it('is read-only by default',()=>expect(validateLiveOptions([],{}).write).toBe(false));
 it('rejects writes without an explicit environment gate',()=>expect(()=>validateLiveOptions(['--write','--project','2','--funnel','f'],{})).toThrow());
 it('requires project and funnel before any writes',()=>expect(()=>validateLiveOptions(['--write'],{WEEEK_LIVE_WRITE:'YES'})).toThrow());
 it('allows explicit scoped test writes',()=>expect(validateLiveOptions(['--write','--project','2','--funnel','f'],{WEEEK_LIVE_WRITE:'YES'})).toMatchObject({write:true,project:2,funnel:'f'}));
});
