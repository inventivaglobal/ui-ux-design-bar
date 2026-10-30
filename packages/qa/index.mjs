/** Original BAR review orchestration; does not execute upstream code or certify conformance. */
import { readFileSync } from 'node:fs';
const readJson = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const catalog = readJson('./rules.json');
const provenance = readJson('./sources.json');
const clone = (value) => structuredClone(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const modes = ['build', 'audit', 'repair'];

export function listSources() { return clone(provenance.sources); }
export function listRules({ source, kind, category } = {}) {
  if (source && !provenance.sources.some(s => s.id === source)) throw new Error(`Unknown QA source: ${source}`);
  if (kind && !['heuristic', 'browser'].includes(kind)) throw new Error(`Unknown QA kind: ${kind}`);
  if (category && !catalog.rules.some(r => r.category === category)) throw new Error(`Unknown QA category: ${category}`);
  return clone(catalog.rules.filter(r => (!source || r.sources.includes(source)) && (!kind || r.kind === kind) && (!category || r.category === category)));
}

/** Unrun checks stay pending; context accepts tags such as forms, charts, daisyui. */
export function createAuditPlan({ mode = 'audit', context = [], source } = {}) {
  if (!modes.includes(mode)) throw new Error(`Unknown QA mode: ${mode}`);
  if (!Array.isArray(context) || context.some(c => !text(c))) throw new Error('context must be an array of nonempty tags');
  const rules = listRules({ source }).filter(r => r.modes.includes(mode) && (r.contexts.includes('all') || r.contexts.some(c => context.includes(c))));
  return {
    schemaVersion: 1, mode, context: [...new Set(context)],
    scope: 'Curated six-source concept integration; not full upstream skill execution or accessibility certification.',
    rules: rules.map(r => ({ ...r, status: 'pending' })),
    sourceIds: [...new Set(rules.flatMap(r => r.sources))],
    nextSteps: mode === 'build'
      ? ['Record product constraints and installed stack.', 'Choose tokens and components before implementing.', 'Capture rendered states and complete the scoped review.']
      : mode === 'repair'
        ? ['Reproduce the finding and preserve baseline evidence.', 'Preview a minimal change; obtain approval where required.', 'Retest the affected flow and compare rendered output.']
        : ['Record scope, routes, states, themes and viewports.', 'Collect browser evidence and separately perform heuristic review.', 'Report unresolved and unrun checks without treating them as passes.'],
  };
}

/** Validate submitted observations. Evidence is supplied by caller, not independently verified here. */
export function recordReview({ ruleId, status, evidence = [], target, reason } = {}) {
  const rule = catalog.rules.find(r => r.id === ruleId);
  if (!rule) throw new Error(`Unknown QA rule: ${ruleId}`);
  if (!text(target)) throw new Error('A scoped target is required');
  const allowed = rule.kind === 'heuristic'
    ? ['accepted', 'recommendation', 'skipped'] : ['passed', 'failed', 'skipped'];
  if (!allowed.includes(status)) throw new Error(`Invalid status for ${rule.kind}: ${status}`);
  if (!Array.isArray(evidence) || evidence.some(e => !text(e))) throw new Error('Evidence must be nonempty strings');
  if (status !== 'skipped' && !evidence.length) throw new Error('Observed reviews require evidence references');
  if (!text(reason)) throw new Error('A rationale or skip reason is required');
  return { ruleId, status, target, evidence: [...evidence], reason,
    kind: rule.kind, severity: rule.severity, sources: [...rule.sources],
    advisory: rule.kind === 'heuristic', evidenceVerified: false,
    certification: false, automaticRepair: false };
}

/** Schema/provenance validation; accepts overrides to support integrity tests and tooling. */
export function validateCatalog({ rules = catalog.rules, sources = provenance.sources } = {}) {
  const errors = [];
  if (!Array.isArray(rules) || !Array.isArray(sources)) return { valid: false, errors: ['rules and sources must be arrays'] };
  const sourceIds = new Set();
  for (const s of sources) {
    if (!s || !text(s.id)) { errors.push('Source requires id'); continue; }
    if (sourceIds.has(s.id)) errors.push(`Duplicate source: ${s.id}`);
    sourceIds.add(s.id);
    if (!/^[a-f0-9]{40}$/.test(s.revision ?? '')) errors.push(`Unpinned source: ${s.id}`);
    if (!['MIT','Apache-2.0'].includes(s.license)) errors.push(`Unreviewed license: ${s.id}`);
    if (!text(s.repository) || !text(s.url) || !s.url.startsWith(`${s.repository}/blob/${s.revision}/`)) errors.push(`Invalid source URL: ${s.id}`);
    if (s.integration !== 'original-concept-mapping' || s.upstreamCodeExecuted !== false) errors.push(`Unsupported integration: ${s.id}`);
  }
  const ids = new Set(), checks = new Set(), referenced = new Set();
  for (const r of rules) {
    if (!r || !text(r.id)) { errors.push('Rule requires id'); continue; }
    if (ids.has(r.id)) errors.push(`Duplicate rule: ${r.id}`);
    ids.add(r.id);
    for (const key of ['category','check','evidence','remediation']) if (!text(r[key])) errors.push(`${r.id} missing ${key}`);
    if (checks.has(r.check)) errors.push(`Duplicate check: ${r.id}`);
    checks.add(r.check);
    if (!['high','medium','low'].includes(r.severity)) errors.push(`Invalid severity: ${r.id}`);
    if (!['heuristic','browser'].includes(r.kind)) errors.push(`Invalid kind: ${r.id}`);
    if (r.automaticRepair !== false) errors.push(`Unsafe automatic repair: ${r.id}`);
    if (r.execution !== (r.kind === 'heuristic' ? 'review-required' : 'browser-evidence-required')) errors.push(`Invalid execution: ${r.id}`);
    if (!Array.isArray(r.contexts) || !r.contexts.length || r.contexts.some(c => !text(c))) errors.push(`Missing contexts: ${r.id}`);
    if (!Array.isArray(r.modes) || !r.modes.length || r.modes.some(m => !modes.includes(m))) errors.push(`Invalid modes: ${r.id}`);
    if (!Array.isArray(r.sources) || !r.sources.length) errors.push(`Missing provenance: ${r.id}`);
    else for (const s of r.sources) { referenced.add(s); if (!sourceIds.has(s)) errors.push(`Unknown provenance ${s}: ${r.id}`); }
  }
  for (const id of sourceIds) if (!referenced.has(id)) errors.push(`Unused source: ${id}`);
  return { valid: errors.length === 0, errors };
}
