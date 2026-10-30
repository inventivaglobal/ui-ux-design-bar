import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const task=data=>new Promise((resolve,reject)=>{const w=new Worker(new URL('../desktop/worker.mjs',import.meta.url),{workerData:data});w.once('message',resolve);w.once('error',reject);});
test('desktop worker performs read-only source/CSS audit and reversible supported repair',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'bar-desktop-unit-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file=path.join(root,'Card.tsx'),before='export default () => <img data-bar-decorative="true" src="x" />;';
 fs.writeFileSync(file,before);fs.writeFileSync(path.join(root,'style.css'),'.card { color: red; color: red; }');
 const audited=await task({action:'audit',root});assert.equal(audited.result.source.summary.fixable,1);assert.ok(audited.result.css.findings.length);assert.equal(fs.readFileSync(file,'utf8'),before);
 const preview=await task({action:'preview',root});assert.equal(preview.result.changes.length,1);assert.equal(fs.existsSync(path.join(root,'.bar')),false);
 const applied=await task({action:'apply',root,plan:preview.result});assert.equal(applied.result.applied.length,1);assert.notEqual(fs.readFileSync(file,'utf8'),before);
 const restored=await task({action:'undo',root,journal:applied.result.journal});assert.equal(restored.result.restored.length,1);assert.equal(fs.readFileSync(file,'utf8'),before);
 const unsupported=await task({action:'exec',root});assert.match(unsupported.error,/Unsupported/);
});
