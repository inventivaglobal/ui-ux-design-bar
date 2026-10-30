import { readFileSync } from 'node:fs';
export const componentIds = Object.freeze(['action-button', 'icon-button', 'text-field', 'select-field', 'status-alert', 'modal-dialog', 'content-card', 'tabs', 'data-table']);
export function validateManifest(manifest) {
  const errors = [];
  if (!componentIds.includes(manifest?.id)) errors.push('Unknown component id');
  if (!manifest?.foundation?.startsWith('@mui/material/')) errors.push('MUI foundation required');
  if (!Array.isArray(manifest?.requiredChecks) || !manifest.requiredChecks.length || manifest.requiredChecks.some(x => typeof x !== 'string' || !x.trim())) errors.push('Nonempty required checks required');
  if (manifest?.replacement?.requiresApproval !== true) errors.push('Replacement approval required');
  return { valid: errors.length === 0, errors };
}
export function listComponents() {
  return componentIds.map(id => {
    const manifest = JSON.parse(readFileSync(new URL(`./components/${id}.json`, import.meta.url), 'utf8'));
    const validation = validateManifest(manifest);
    if (!validation.valid) throw new Error(`${id}: ${validation.errors.join(', ')}`);
    return manifest;
  });
}
