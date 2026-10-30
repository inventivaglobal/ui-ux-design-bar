import { listComponents } from './index.mjs';
const mappings = {
  'a11y.icon-button-name': { id: 'icon-button', reason: 'A named icon-button pattern can make the accessible-name requirement explicit.', unknowns: ['The action name and icon meaning must be confirmed by the application owner.'] },
  'form.explicit-button-type': { id: 'action-button', reason: 'The button pattern supports an explicit button, submit or reset type.', unknowns: ['The intended form behavior must be confirmed; the pattern default is not evidence of intent.'] },
  'interaction.disabled-redundancy': { id: 'action-button', reason: 'The button pattern exposes native disabled behavior for comparison.', unknowns: ['Disabled, focusable-disabled and loading behavior may differ; retain the application contract.'] },
  'a11y.explicit-control-label': { id: 'action-button', reason: 'The button pattern requires an explicit user-facing label.', unknowns: ['Confirm whether the existing control is icon-only or text-labeled and preserve its exact intended name.'] },
};
const preserve = ['Existing event handlers and side effects', 'Controlled state and loading/disabled behavior', 'Form association, name, value and submit/reset behavior', 'Navigation destination and interaction semantics', 'ARIA relationships, data attributes and test hooks', 'Focus order, keyboard behavior and visible content'];
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value, field, max = 4096) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError(`${field} must be a nonempty string of at most ${max} characters`);
  return value;
}
/** Report-only: never opens source paths, writes files, or constructs a replacement patch. */
export function suggestReplacements(report) {
  if (!object(report) || !Array.isArray(report.findings) || report.findings.length > 10000) throw new TypeError('Expected a static audit report with at most 10000 findings');
  if (report.schemaVersion === 'bar-browser-1' || report.results) throw new TypeError('Replacement suggestions require static findings, not browser observations');
  const manifests = new Map(listComponents().map(manifest => [manifest.id, manifest]));
  const suggestions = [], unmapped = [];
  const sourceComplete = report.complete !== false && report.truncated !== true && report.analysis?.imageSyntaxParsed !== false && !(Array.isArray(report.errors) && report.errors.length);
  for (const [index, finding] of report.findings.entries()) {
    if (!object(finding)) throw new TypeError(`Finding ${index} must be an object`);
    const ruleId = text(finding.ruleId, `Finding ${index} ruleId`, 256);
    for (const field of ['file', 'evidence', 'message']) if (finding[field] !== undefined) text(finding[field], `Finding ${index} ${field}`);
    for (const field of ['line', 'column', 'index']) if (finding[field] !== undefined && (!Number.isSafeInteger(finding[field]) || finding[field] < (field === 'index' ? 0 : 1))) throw new TypeError(`Invalid finding ${field}`);
    const location = { ...(finding.file ? { file: finding.file } : {}), ...(finding.line ? { line: finding.line } : {}), ...(finding.column ? { column: finding.column } : {}) };
    const mapping = Object.hasOwn(mappings, ruleId) ? mappings[ruleId] : null;
    if (!mapping) { unmapped.push({ findingIndex: index, ruleId, ...location, reason: 'No curated replacement mapping; resolve this finding directly or obtain a manual design review.' }); continue; }
    const evidence = finding.evidence || null;
    // Static findings can be heuristic or stale; never infer an executable substitution.
    let id = mapping.id;
    if (ruleId === 'a11y.explicit-control-label' && evidence && /<IconButton\b/.test(evidence)) id = 'icon-button';
    const manifest = manifests.get(id);
    suggestions.push({
      findingIndex: index, ruleId, location, evidence,
      candidate: { id, manifest: `packages/registry/components/${id}.json`, foundation: manifest.foundation },
      reason: mapping.reason,
      confidence: evidence && location.file && location.line ? 'medium' : 'low',
      confidenceMeaning: 'Confidence in candidate relevance only, not replacement safety or detected application intent.',
      applicability: sourceComplete ? 'conditional-manual-review' : 'blocked-until-audit-complete',
      limitations: ['Static report may be heuristic or stale; inspect the current source before deciding.', 'An in-place attribute fix may be safer than replacing an existing component.', 'No visual, behavioral or accessibility equivalence is established.'],
      unresolvedIntent: [...mapping.unknowns],
      requiredChecks: [...manifest.requiredChecks],
      preserve: [...preserve],
      manualReviewRequired: true, approvalRequired: true, automaticReplacement: false,
    });
  }
  return { schemaVersion: 'bar-replacement-suggestions-1', mode: 'suggestion-only', sourceComplete, suggestions, unmapped, summary: { findings: report.findings.length, suggestions: suggestions.length, unmapped: unmapped.length }, verification: 'Manifest-backed static candidates only; no source changes or generated replacement code.' };
}
