import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { listSources, listRules, createAuditPlan, recordReview, validateCatalog } from '../packages/qa/index.mjs';

test('all six inspected upstreams are pinned and covered by actionable deduplicated rules', () => {
  assert.deepEqual(validateCatalog(), { valid: true, errors: [] });
  assert.equal(listSources().length, 6);
  assert.ok(listRules().length >= 20);
  for (const source of listSources()) {
    assert.ok(listRules({ source: source.id }).length >= 2);
    assert.ok(existsSync(new URL(`../packages/qa/${source.licenseFile}`, import.meta.url)));
    assert.match(readFileSync(new URL(`../packages/qa/${source.licenseFile}`, import.meta.url), 'utf8'), /License/);
  }
});
test('plan is context-sensitive and every unexecuted check remains pending', () => {
  const base = createAuditPlan();
  assert.ok(!base.rules.some(r => r.id.startsWith('daisyui.')));
  assert.ok(!base.rules.some(r => r.id === 'a11y.form-errors'));
  const scoped = createAuditPlan({ mode: 'repair', context: ['daisyui', 'forms', 'charts', 'forms'] });
  assert.ok(scoped.rules.some(r => r.id === 'daisyui.component-contract'));
  assert.ok(scoped.rules.some(r => r.id === 'a11y.form-errors'));
  assert.ok(scoped.rules.some(r => r.id === 'design.data-encoding'));
  assert.ok(scoped.rules.every(r => r.status === 'pending' && r.automaticRepair === false));
  assert.deepEqual(scoped.context, ['daisyui', 'forms', 'charts']);
  assert.throws(() => createAuditPlan({ mode: 'deploy' }));
  assert.throws(() => createAuditPlan({ context: 'daisyui' }));
});
test('query is strict and result mutation cannot alter the catalog', () => {
  assert.throws(() => listRules({ source: 'invented' }));
  assert.throws(() => listRules({ kind: 'automatic' }));
  assert.throws(() => listRules({ category: 'invented' }));
  const rules = listRules(); rules[0].sources.push('invented');
  const sources = listSources(); sources[0].revision = 'changed';
  assert.equal(validateCatalog().valid, true);
  assert.ok(listRules({ kind: 'browser' }).every(r => r.kind === 'browser'));
});
test('heuristics cannot become deterministic passes; submitted evidence is not certified', () => {
  const args = { ruleId: 'design.task-hierarchy', target: '/fixture', evidence: ['artifacts/home.png'], reason: 'Primary action dominates the scoped viewport.' };
  assert.throws(() => recordReview({ ...args, status: 'passed' }));
  const result = recordReview({ ...args, status: 'accepted' });
  assert.equal(result.advisory, true);
  assert.equal(result.certification, false);
  assert.equal(result.evidenceVerified, false);
  assert.throws(() => recordReview({ ...args, status: 'recommendation', evidence: [] }));
});
test('browser review requires evidence, target, rationale and valid status', () => {
  const args = { ruleId: 'a11y.focus-visible', status: 'failed', target: '/fixture button', evidence: ['keyboard-run.json'], reason: 'Focus indicator absent on second button.' };
  assert.equal(recordReview(args).advisory, false);
  for (const override of [{ruleId:'unknown'}, {evidence:[]}, {evidence:[null]}, {target:''}, {reason:''}, {status:'accepted'}]) assert.throws(() => recordReview({...args,...override}));
  assert.equal(recordReview({...args,status:'skipped',evidence:[],reason:'Browser unavailable'}).status, 'skipped');
});
test('validator detects missing provenance, duplicate semantics, unsafe repairs and unpinned upstreams', () => {
  const rules = listRules(); const sources = listSources();
  rules.push({...rules[0]}); rules[1].check = rules[0].check; rules[2].sources = ['missing']; rules[3].automaticRepair = true; sources[0].revision = 'main';
  const result = validateCatalog({rules,sources});
  assert.equal(result.valid,false);
  for (const fragment of ['Duplicate rule','Duplicate check','Unknown provenance','Unsafe automatic repair','Unpinned source']) assert.ok(result.errors.some(e=>e.includes(fragment)));
  assert.equal(validateCatalog({rules:null}).valid,false);
});
