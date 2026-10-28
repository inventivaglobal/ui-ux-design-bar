import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditFolder, previewFolder, applyPlan, undoPlan } from '../engine/workspace.mjs';
const original = 'export default () => <img data-bar-decorative="true" src="x" />;\n';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bar-folder-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'nested'));
  fs.writeFileSync(path.join(root, 'nested/Card.tsx'), original);
  return root;
}
const read = root => fs.readFileSync(path.join(root, 'nested/Card.tsx'), 'utf8');
test('folder report has paths, locations, severity, repairability and syntax failures', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'Other.jsx'), '<img src="meaningful" />');
  fs.writeFileSync(path.join(root, 'Invalid.tsx'), 'const = ;');
  fs.mkdirSync(path.join(root, 'node_modules'));
  fs.writeFileSync(path.join(root, 'node_modules/Ignored.jsx'), '<img />');
  fs.symlinkSync(path.join(root, 'nested/Card.tsx'), path.join(root, 'link.jsx'));
  const report = auditFolder(root);
  assert.equal(report.summary.files, 3);
  assert.equal(report.summary.fixable, 1);
  assert.equal(report.errors.length, 1);
  assert.equal(report.skipped.length, 1);
  const finding = report.findings.find(f => f.file === 'nested/Card.tsx');
  assert.equal(finding.line, 1); assert.equal(finding.column, 22);
  assert.equal(finding.severity, 'high'); assert.equal(finding.repairability, 'safe-opt-in');
});
test('preview does not write; apply and idempotent undo preserve exact bytes', t => {
  const root = fixture(t);
  const plan = previewFolder(root);
  assert.equal(read(root), original); assert.equal(fs.existsSync(path.join(root, '.bar')), false);
  assert.equal(plan.changes.length, 1); assert.ok(plan.changes[0].diff.length);
  const applied = applyPlan(root, plan);
  assert.equal(read(root), plan.changes[0].after);
  assert.equal(previewFolder(root).changes.length, 0);
  assert.equal(undoPlan(root, applied.journal).restored.length, 1);
  assert.equal(read(root), original);
  assert.equal(undoPlan(root, applied.journal).restored.length, 0);
});
test('stale apply and undo refuse all writes on preflight conflict', t => {
  const root = fixture(t), file = path.join(root, 'nested/Card.tsx');
  fs.writeFileSync(path.join(root, 'Second.jsx'), original);
  const plan = previewFolder(root);
  fs.writeFileSync(file, original + '// later\n');
  assert.throws(() => applyPlan(root, plan), /Stale file/);
  assert.equal(fs.readFileSync(path.join(root, 'Second.jsx'), 'utf8'), original);
  fs.writeFileSync(file, original);
  const applied = applyPlan(root, plan);
  const later = read(root) + '// keep me\n';
  fs.writeFileSync(file, later);
  assert.throws(() => undoPlan(root, applied.journal), /later edits/);
  assert.equal(read(root), later);
  assert.equal(fs.readFileSync(path.join(root, 'Second.jsx'), 'utf8'), plan.changes.find(c => c.file === 'Second.jsx').after);
});
test('rejects tampered plans, mismatched roots, traversal and duplicate targets', t => {
  const root = fixture(t), plan = previewFolder(root);
  for (const mutate of [
    p => p.root += '/nested', p => p.changes[0].file = '../Outside.jsx',
    p => p.changes[0].file = '/tmp/Outside.jsx', p => p.changes[0].file = 'nested/../nested/Card.tsx',
    p => p.changes[0].after += 'bad', p => p.changes.push(p.changes[0]),
  ]) { const p = structuredClone(plan); mutate(p); assert.throws(() => applyPlan(root, p)); }
  assert.equal(read(root), original);
  assert.throws(() => undoPlan(root, '../outside'), /Invalid journal/);
});
test('refuses symlink ancestors, replaced source symlinks, hardlinks and symlink state directories', t => {
  const root = fixture(t), plan = previewFolder(root), file = path.join(root, 'nested/Card.tsx');
  fs.renameSync(file, path.join(root, 'saved'));
  fs.symlinkSync(path.join(root, 'saved'), file);
  assert.throws(() => applyPlan(root, plan), /Unsafe/);
  fs.unlinkSync(file); fs.linkSync(path.join(root, 'saved'), file);
  assert.throws(() => applyPlan(root, plan), /Unsafe/);
  fs.unlinkSync(file); fs.renameSync(path.join(root, 'saved'), file);
  fs.symlinkSync(path.join(root, 'nested'), path.join(root, '.bar'));
  assert.throws(() => applyPlan(root, plan), /Unsafe/);
});
test('preserves UTF-8 BOM, CRLF and permission mode; rejects invalid UTF-8', t => {
  const root = fixture(t), file = path.join(root, 'nested/Card.tsx');
  const source = '\uFEFF' + original.replaceAll('\n', '\r\n');
  fs.writeFileSync(file, source); fs.chmodSync(file, 0o666);
  const plan = previewFolder(root), applied = applyPlan(root, plan);
  assert.equal(fs.statSync(file).mode & 0o777, 0o666);
  undoPlan(root, applied.journal); assert.equal(read(root), source);
  fs.writeFileSync(file, Buffer.from([0xff]));
  assert.equal(auditFolder(root).errors.length, 1);
});
test('CLI requires explicit --yes; folder audit exit codes and complete apply/undo roundtrip', t => {
  const root = fixture(t);
  const cli = (...args) => spawnSync(process.execPath, ['engine/cli.mjs', ...args], { encoding: 'utf8' });
  assert.equal(cli('audit', root).status, 1);
  const preview = cli('preview', root); assert.equal(preview.status, 0);
  const planFile = path.join(root, 'plan.json'); fs.writeFileSync(planFile, preview.stdout);
  assert.equal(cli('apply', root, planFile).status, 2);
  assert.equal(read(root), original);
  const applied = cli('apply', root, planFile, '--yes'); assert.equal(applied.status, 0, applied.stderr);
  assert.equal(cli('audit', root).status, 0);
  assert.equal(cli('undo', root, JSON.parse(applied.stdout).journal, '--yes').status, 0);
  assert.equal(read(root), original);
  fs.writeFileSync(path.join(root, 'bad.tsx'), 'const =');
  assert.equal(cli('audit', root).status, 2);
});
test('active write lock refuses concurrent BAR operations', t => {
  const root = fixture(t), plan = previewFolder(root);
  fs.mkdirSync(path.join(root, '.bar'));
  fs.writeFileSync(path.join(root, '.bar/write.lock'), '');
  assert.throws(() => applyPlan(root, plan), /EEXIST/);
  assert.equal(read(root), original);
});

 test('forged journal content cannot undo arbitrary source', t => {
  const root = fixture(t), applied = applyPlan(root, previewFolder(root));
  const filename = path.join(root, '.bar', applied.journal + '.json');
  const plan = JSON.parse(fs.readFileSync(filename, 'utf8'));
  plan.changes[0].before += '// malicious';
  fs.writeFileSync(filename, JSON.stringify(plan));
  assert.throws(() => undoPlan(root, applied.journal), /Invalid plan/);
  assert.ok(read(root).includes('alt=""'));
});

test('temporary files and write lock are cleaned up on source write failure', t => {
  const root = fixture(t), plan = previewFolder(root);
  const realSync = fs.fsyncSync;
  let calls = 0;
  const mocked = t.mock.method(fs, 'fsyncSync', fd => {
    if (++calls === 2) throw new Error('simulated disk failure');
    return realSync(fd);
  });
  assert.throws(() => applyPlan(root, plan), /Recovery journal/);
  mocked.mock.restore();
  assert.equal(read(root), original);
  assert.equal(fs.existsSync(path.join(root, '.bar/write.lock')), false);
  assert.deepEqual(fs.readdirSync(path.join(root, 'nested')), ['Card.tsx']);
  const id = fs.readdirSync(path.join(root, '.bar'))[0].replace('.json', '');
  assert.deepEqual(undoPlan(root, id).restored, []);
});
