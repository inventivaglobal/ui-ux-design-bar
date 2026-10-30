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
// Hard safety ceilings. Optional overrides only LOWER these limits (useful for
// constrained hosts/tests). Directory entries include ignored/non-source paths;
// depth counts directory edges below root. Output accounting is conservative
// because findings appear both per-file and in the flattened report. The
// outputBytes ceiling covers accumulated payload; fixed report metadata and one
// bounded limit diagnostic are additional. Preview planBytes covers full JSON.
// Limit exhaustion is never a clean result: audit returns complete:false plus
// WORKSPACE_LIMIT, and preview refuses without creating write state.
export const WORKSPACE_LIMITS = Object.freeze({
  visited: 10000, files: 1000, depth: 32, sourceBytes: 16 * 1024 * 1024,
  findings: 10000, outputBytes: 8 * 1024 * 1024, planBytes: 32 * 1024 * 1024,
});
function workspaceLimits(options = {}) {
  const overrides = options.limits ?? {};
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Invalid workspace limits');
  const limits = { ...WORKSPACE_LIMITS };
  for (const [name, value] of Object.entries(overrides)) {
    if (!(name in WORKSPACE_LIMITS) || !Number.isSafeInteger(value) || value < 1 || value > WORKSPACE_LIMITS[name]) throw new Error(`Invalid workspace limit: ${name}`);
    limits[name] = value;
  }
  return limits;
}
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
    // Bound the read even if a concurrent process grows the file after fstat.
    const buffer = Buffer.alloc(stat.size + 1);
    let length = 0, count;
    while (length < buffer.length && (count = fs.readSync(fd, buffer, length, buffer.length - length, null)) > 0) length += count;
    if (length > stat.size) throw new Error('Source changed size while reading; retry with stable files');
    const bytes = buffer.subarray(0, length);
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // TextDecoder removes BOM; preserve exact source bytes for hashes and undo.
    return { source: bytes.subarray(0, 3).equals(Buffer.from([239,187,191])) ? '\uFEFF' + source : source, mode: stat.mode & 0o777 };
  } finally { fs.closeSync(fd); }
}
export function auditFolder(root, options = {}) {
  root = rootPath(root);
  const limits = workspaceLimits(options);
  const files = [], skipped = [], errors = [];
  const usage = { visited: 0, files: 0, sourceBytes: 0, findings: 0, outputBytes: 0 };
  let truncated = false, stopped = false;
  function limit(name, file) {
    if (!truncated) errors.push({ file: file.slice(0, 512), code: 'WORKSPACE_LIMIT', message: `Workspace ${name} limit reached (${limits[name]}); audit incomplete. Narrow the root or split the audit.` });
    truncated = true; stopped = true;
  }
  function append(target, value, multiplier = 1) {
    const size = Buffer.byteLength(JSON.stringify(value)) * multiplier;
    if (usage.outputBytes + size > limits.outputBytes) { limit('outputBytes', value.file ?? ''); return false; }
    usage.outputBytes += size; target.push(value); return true;
  }
  function visit(directory, prefix = '', depth = 0) {
    if (stopped) return;
    // opendir avoids allocating an unbounded readdir result before the cap.
    let dir;
    try { dir = fs.opendirSync(directory); }
    catch (error) { append(errors, { file: prefix, message: error.message }); return; }
    const entries = [];
    try {
      let entry;
      while ((entry = dir.readSync())) {
        if (usage.visited >= limits.visited) { limit('visited', prefix); break; }
        usage.visited++; entries.push(entry);
      }
    } finally { dir.closeSync(); }
    if (stopped) return;
    entries.sort((a,b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (stopped) break;
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) { append(skipped, { file: relative, reason: 'symlink' }); continue; }
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) {
          if (depth >= limits.depth) { limit('depth', relative); break; }
          visit(path.join(directory, entry.name), relative + '/', depth + 1);
        }
        continue;
      }
      if (!entry.isFile() || !isSource(entry.name)) continue;
      if (usage.files >= limits.files) { limit('files', relative); break; }
      usage.files++;
      try {
        const filename = sourcePath(root, relative);
        if (fs.lstatSync(filename).size > limits.sourceBytes - usage.sourceBytes) { limit('sourceBytes', relative); break; }
        const { source } = readSource(filename);
        const bytes = Buffer.byteLength(source);
        if (bytes > limits.sourceBytes - usage.sourceBytes) { limit('sourceBytes', relative); break; }
        usage.sourceBytes += bytes;
        const report = audit(source, relative);
        if (report.findings.length > limits.findings - usage.findings) { limit('findings', relative); break; }
        usage.findings += report.findings.length;
        if (!report.analysis.imageSyntaxParsed) append(errors, { file: relative, message: 'Unsupported or invalid JSX/TSX syntax; not a clean audit' });
        report.findings = report.findings.map(f => ({ ...f, column: f.index - source.lastIndexOf('\n', f.index - 1), repairability: f.fixable ? 'safe-opt-in' : 'suggestion-only' }));
        if (!stopped) append(files, report, 2);
      } catch (error) { append(errors, { file: relative, message: error.message }); }
    }
  }
  visit(root);
  const findings = files.flatMap(f => f.findings);
  return { schemaVersion: '0.2', root, files, findings, skipped, errors,
    complete: !truncated && errors.length === 0, truncated, limits, usage,
    summary: { files: files.length, total: findings.length, high: findings.filter(f => f.severity === 'high').length, fixable: findings.filter(f => f.fixable).length, errors: errors.length }, verification: 'static-only' };
}
export function previewFolder(root, options = {}) {
  const limits = workspaceLimits(options);
  const report = auditFolder(root, options);
  if (report.truncated) throw new Error('Workspace limit reached; refusing repair preview from incomplete audit. Narrow the root or split the audit.');
  if (report.errors.length) throw new Error('Audit has source errors; refusing repair preview. Fix errors or select a smaller valid root.');
  const changes = [];
  let sourceBytes = 0;
  let planBytes = Buffer.byteLength(JSON.stringify({ schemaVersion: 'bar-plan-1', root: report.root, changes, report }));
  if (planBytes > limits.planBytes) throw new Error('Repair preview plan-size limit reached; split the audit');
  for (const file of report.files) {
    if (!file.analysis.imageSyntaxParsed) continue;
    const { source } = readSource(sourcePath(report.root, file.file));
    sourceBytes += Buffer.byteLength(source);
    if (sourceBytes > limits.sourceBytes) throw new Error('Repair preview sourceBytes limit reached; files may have changed');
    const result = repair(source, file.file);
    if (result.changes.length) {
      const change = { file: file.file, before: source, after: result.source, beforeHash: hash(source), afterHash: hash(result.source), diff: result.diff };
      planBytes += Buffer.byteLength(JSON.stringify(change)) + 1;
      if (planBytes > limits.planBytes) throw new Error('Repair preview plan-size limit reached; split the audit');
      changes.push(change);
    }
  }
  return { schemaVersion: 'bar-plan-1', root: report.root, changes, report };
}
function validatePlan(root, plan) {
  if (!plan || plan.schemaVersion !== 'bar-plan-1' || plan.root !== root || !Array.isArray(plan.changes) || plan.changes.length > 1000) throw new Error('Invalid plan or root mismatch');
  const seen = new Set();
  let recoveryBytes = Buffer.byteLength(JSON.stringify({ schemaVersion: plan.schemaVersion, root, changes: [] }));
  for (const change of plan.changes) {
    sourcePath(root, change.file);
    if (seen.has(change.file)) throw new Error('Duplicate plan path');
    seen.add(change.file);
    if (typeof change.before !== 'string' || typeof change.after !== 'string' || Buffer.byteLength(change.before) > maxBytes || Buffer.byteLength(change.after) > maxBytes || change.beforeHash !== hash(change.before) || change.afterHash !== hash(change.after)) throw new Error('Invalid plan content/hash');
    recoveryBytes += Buffer.byteLength(JSON.stringify({ file: change.file, before: change.before, after: change.after, beforeHash: change.beforeHash, afterHash: change.afterHash })) + 1;
    if (recoveryBytes > maxPlanBytes) throw new Error('Recovery journal exceeds 64 MiB; split this plan into smaller batches');
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
