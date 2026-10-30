import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WORKSPACE_LIMITS, auditFolder, previewFolder, applyPlan, undoPlan } from '../engine/workspace.mjs';
const source = 'export default () => <img data-bar-decorative="true" src="x" />;\n';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bar-limits-'));
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));
  return root;
}
function write(root, file, content = source) {
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
  fs.writeFileSync(path.join(root,file),content);
}
function limited(root, limits, cap) {
  const report = auditFolder(root,{limits});
  assert.equal(report.complete,false);
  assert.equal(report.truncated,true);
  assert.ok(report.errors.some(e=>e.code==='WORKSPACE_LIMIT' && e.message.includes(cap)));
  assert.ok(report.summary.errors > 0);
  assert.throws(()=>previewFolder(root,{limits}), /refusing repair preview from incomplete audit/);
  assert.equal(fs.existsSync(path.join(root,'.bar')),false);
  return report;
}
test('hard ceilings cannot be raised and configuration is immutable', t => {
  const root=fixture(t);
  assert.ok(Object.isFrozen(WORKSPACE_LIMITS));
  for (const limits of [{files:1001},{depth:0},{visited:-1},{findings:1.5},{unknown:1},[]]) assert.throws(()=>auditFolder(root,{limits}), /Invalid workspace limit/);
});
test('visited entries include irrelevant and ignored paths; traversal is bounded before readdir allocation', t => {
  const root=fixture(t);
  write(root,'a.txt','ignored'); write(root,'b.txt','ignored'); write(root,'c.jsx');
  const report=limited(root,{visited:2},'visited');
  assert.equal(report.usage.visited,2);
  assert.equal(report.files.length,0);
});
test('source file cap prevents apparently complete partial audits', t => {
  const root=fixture(t); write(root,'a.jsx'); write(root,'b.tsx');
  const report=limited(root,{files:1},'files');
  assert.equal(report.files.length,1);
  assert.equal(report.usage.files,1);
});
test('directory depth is bounded and ignored output trees are not descended', t => {
  const root=fixture(t); write(root,'a/b/deep.jsx');
  limited(root,{depth:1},'depth');
  const other=fixture(t); write(other,'node_modules/a/b/deep.jsx');
  const report=auditFolder(other,{limits:{depth:1}});
  assert.equal(report.complete,true); assert.equal(report.files.length,0);
});
test('aggregate source bytes cap applies across individually small files', t => {
  const root=fixture(t); write(root,'a.jsx'); write(root,'b.tsx');
  const bytes=Buffer.byteLength(source);
  const report=limited(root,{sourceBytes:bytes+1},'sourceBytes');
  assert.equal(report.usage.sourceBytes,bytes);
  assert.equal(report.files.length,1);
});
test('aggregate findings and output payload have independent ceilings', t => {
  const root=fixture(t); write(root,'a.jsx'); write(root,'b.tsx');
  const report=limited(root,{findings:1},'findings');
  assert.equal(report.findings.length,1);
  assert.equal(report.usage.findings,1);
  const output=limited(root,{outputBytes:32},'outputBytes');
  assert.equal(output.files.length,0);
  assert.ok(output.usage.outputBytes<=32);
});
test('preview refuses oversized serialized plan before writes', t => {
  const root=fixture(t);write(root,'a.jsx');
  assert.throws(()=>previewFolder(root,{limits:{planBytes:100}}), /plan-size limit/);
  const normal=previewFolder(root);
  const initial=Buffer.byteLength(JSON.stringify({...normal,changes:[]}));
  assert.throws(()=>previewFolder(root,{limits:{planBytes:initial+1}}), /plan-size limit/);
  assert.equal(fs.readFileSync(path.join(root,'a.jsx'),'utf8'),source);
  assert.equal(fs.existsSync(path.join(root,'.bar')),false);
});
test('ordinary complete report and repair/apply/undo API remain intact', t => {
  const root=fixture(t);write(root,'a.jsx');
  const report=auditFolder(root); assert.equal(report.complete,true);assert.equal(report.truncated,false);
  const plan=previewFolder(root);const applied=applyPlan(root,plan);
  assert.deepEqual(applied.applied,['a.jsx']);
  assert.deepEqual(undoPlan(root,applied.journal).restored,['a.jsx']);
  assert.equal(fs.readFileSync(path.join(root,'a.jsx'),'utf8'),source);
});
