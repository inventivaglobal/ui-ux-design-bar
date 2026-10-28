import { writeFile } from 'node:fs/promises';
import { buildButton } from '../engine/build.mjs';

// Render the actual engine output, rather than maintaining a lookalike fixture.
const button = buildButton({ label: 'Generated action' });
await writeFile(new URL('../examples/mui-browser/src/GeneratedButton.jsx', import.meta.url),
  `${button.imports.join('\n')}\nimport React from 'react';\nexport default function GeneratedButton() { return (${button.jsx}); }\n`);

// Produce both browser fixtures from the same source and the actual REPAIR API.
const { readFile } = await import('node:fs/promises');
const { audit } = await import('../engine/audit.mjs');
const { repair } = await import('../engine/repair.mjs');
const source = await readFile(new URL('../tests/fixtures/repair/decorative-card.jsx', import.meta.url), 'utf8');
const before = audit(source, 'decorative-card.jsx');
const result = repair(source, 'decorative-card.jsx');
if (before.summary.high !== 1 || result.changes.length !== 1 || result.verified.summary.total !== 0) {
  throw new Error('Repair demo contract failed: expected one explicit decorative-image repair.');
}
for (const [filename, content] of [['BrokenCard.jsx', source], ['RepairedCard.jsx', result.source]]) {
  await writeFile(new URL(`../examples/mui-browser/src/${filename}`, import.meta.url), content);
}
await writeFile(new URL('../examples/mui-browser/src/repair-evidence.json', import.meta.url), JSON.stringify({ before, ...result, originalSource: source }, null, 2));
