import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { audit } from './audit.mjs';
import { repair } from './repair.mjs';

const ignored = new Set(['node_modules', '.git', '.bar', 'dist', 'build', 'coverage', 'playwright-report', 'test-results']);
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const isSource = name => /\.(jsx|tsx)$/.test(name);
const maxBytes = 2 * 1024 * 1024;
const maxPlanBytes = 64 * 1024 * 1024;
function rootPath(root) {
  const absolute = path.resolve(root);
  if (fs.realpathSync(absolute) !== absolute || !fs.lstatSync(absolute).isDirectory()) throw new Error('Root must be a real directory without symlink ancestors');
  return absolute;
}
function sourcePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').some(x => !x || x === '.' || x === '..' || ignored.has(x)) || !isSource(relative)) throw new Error('Unsafe source path');
  let current = root;
  const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile() || stat.nlink !== 1)) throw new Error(`Unsafe file: ${relative}`);
  }
  return current;
}
function readSource(filename) {
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > maxBytes) throw new Error('Source must be a single-link regular file under 2 MiB');
    const bytes = fs.readFileSync(fd);
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // TextDecoder removes BOM; preserve exact source bytes for hashes and undo.
    return { source: bytes.subarray(0, 3).equals(Buffer.from([239,187,191])) ? '\uFEFF' + source : source, mode: stat.mode & 0o777 };
  } finally { fs.closeSync(fd); }
}
export function auditFolder(root) {
  root = rootPath(root);
  const files = [], skipped = [], errors = [];
  function visit(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) { skipped.push({ file: relative, reason: 'symlink' }); continue; }
      if (entry.isDirectory()) { if (!ignored.has(entry.name)) visit(path.join(directory, entry.name), relative + '/'); continue; }
      if (!entry.isFile() || !isSource(entry.name)) continue;
      try {
        const { source } = readSource(sourcePath(root, relative));
        const report = audit(source, relative);
        if (!report.analysis.imageSyntaxParsed) errors.push({ file: relative, message: 'Unsupported or invalid JSX/TSX syntax; not a clean audit' });
        report.findings = report.findings.map(f => ({ ...f, column: f.index - source.lastIndexOf('\n', f.index - 1), repairability: f.fixable ? 'safe-opt-in' : 'suggestion-only' }));
        files.push(report);
      } catch (error) { errors.push({ file: relative, message: error.message }); }
    }
  }
  visit(root);
  const findings = files.flatMap(f => f.findings);
  return { schemaVersion: '0.2', root, files, findings, skipped, errors, summary: { files: files.length, total: findings.length, high: findings.filter(f => f.severity === 'high').length, fixable: findings.filter(f => f.fixable).length, errors: errors.length }, verification: 'static-only' };
}
export function previewFolder(root) {
  const report = auditFolder(root);
  const changes = [];
  for (const file of report.files) {
    if (!file.analysis.imageSyntaxParsed) continue;
    const { source } = readSource(sourcePath(report.root, file.file));
    const result = repair(source, file.file);
    if (result.changes.length) changes.push({ file: file.file, before: source, after: result.source, beforeHash: hash(source), afterHash: hash(result.source), diff: result.diff });
  }
  return { schemaVersion: 'bar-plan-1', root: report.root, changes, report };
}
function validatePlan(root, plan) {
  if (!plan || plan.schemaVersion !== 'bar-plan-1' || plan.root !== root || !Array.isArray(plan.changes) || plan.changes.length > 1000) throw new Error('Invalid plan or root mismatch');
  const seen = new Set();
  for (const change of plan.changes) {
    sourcePath(root, change.file);
    if (seen.has(change.file)) throw new Error('Duplicate plan path');
    seen.add(change.file);
    if (typeof change.before !== 'string' || typeof change.after !== 'string' || Buffer.byteLength(change.before) > maxBytes || Buffer.byteLength(change.after) > maxBytes || change.beforeHash !== hash(change.before) || change.afterHash !== hash(change.after)) throw new Error('Invalid plan content/hash');
    const result = repair(change.before, change.file);
    if (!result.changes.length || result.source !== change.after) throw new Error('Plan is not an approved repair transformation');
  }
}
function stateDirectory(root) {
  const dir = path.join(root, '.bar');
  try { fs.mkdirSync(dir, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  if (!fs.lstatSync(dir).isDirectory() || fs.realpathSync(dir) !== dir) throw new Error('Unsafe .bar directory');
  return dir;
}
function locked(root, callback) {
  const dir = stateDirectory(root), lock = path.join(dir, 'write.lock');
  let fd;
  try { fd = fs.openSync(lock, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('EEXIST: BAR write lock exists. Do not remove it while another BAR process runs; see docs/FOLDER-WORKFLOW.md for crash recovery.'); throw error; }
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    return callback(dir);
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
function atomicSource(root, change, expected, replacement) {
  const filename = sourcePath(root, change.file);
  const current = readSource(filename);
  if (current.source !== expected) throw new Error(`Stale file: ${change.file}`);
  const temporary = path.join(path.dirname(filename), `.bar-${crypto.randomUUID()}.tmp`);
  const fd = fs.openSync(temporary, 'wx', current.mode);
  try {
    try { fs.writeFileSync(fd, replacement); fs.fchmodSync(fd, current.mode); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    // Recheck immediately before replacing; no claim of safety against a hostile concurrent process.
    if (readSource(sourcePath(root, change.file)).source !== expected) throw new Error(`Stale file: ${change.file}`);
    fs.renameSync(temporary, filename);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
export function applyPlan(root, plan) {
  root = rootPath(root);
  validatePlan(root, plan);
  // Store only the recovery contract, not redundant report/diff payloads.
  const recovery = JSON.stringify({ schemaVersion: plan.schemaVersion, root, changes: plan.changes.map(({ file, before, after, beforeHash, afterHash }) => ({ file, before, after, beforeHash, afterHash })) });
  if (Buffer.byteLength(recovery) > maxPlanBytes) throw new Error('Recovery journal exceeds 64 MiB; split this plan into smaller batches');
  return locked(root, dir => {
    for (const c of plan.changes) if (readSource(sourcePath(root, c.file)).source !== c.before) throw new Error(`Stale file: ${c.file}`);
    const id = crypto.randomUUID();
    const journal = path.join(dir, id + '.json');
    const fd = fs.openSync(journal, 'wx', 0o600);
    try { fs.writeFileSync(fd, recovery); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    const applied = [];
    try { for (const c of plan.changes) { atomicSource(root, c, c.before, c.after); applied.push(c.file); } }
    catch (error) { throw new Error(`${error.message}; partial apply possible. Recovery journal: ${id}; applied: ${applied.join(', ')}`); }
    return { applied, journal: id, undoCommand: { executable: 'node', args: ['engine/cli.mjs', 'undo', root, id, '--yes'] }, verification: 'static-only; run project tests' };
  });
}
export function undoPlan(root, id) {
  root = rootPath(root);
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) throw new Error('Invalid journal ID');
  return locked(root, dir => {
    const journal = path.join(dir, id + '.json');
    const stat = fs.lstatSync(journal);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 64 * 1024 * 1024) throw new Error('Unsafe journal');
    const plan = JSON.parse(fs.readFileSync(journal, 'utf8'));
    validatePlan(root, plan);
    const pending = [];
    for (const c of plan.changes) {
      const current = readSource(sourcePath(root, c.file)).source;
      if (current === c.after) pending.push(c);
      else if (current !== c.before) throw new Error(`Stale file: ${c.file}; undo refuses to overwrite later edits`);
    }
    const restored = [];
    try { for (const c of pending) { atomicSource(root, c, c.after, c.before); restored.push(c.file); } }
    catch (error) { throw new Error(`${error.message}; partial undo possible. Keep journal ${id}; restored: ${restored.join(', ')}`); }
    return { restored, journal: id, verification: 'original bytes restored; run project tests' };
  });
}
