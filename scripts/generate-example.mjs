import { writeFile } from 'node:fs/promises';
import { buildButton } from '../engine/build.mjs';

// Render the actual engine output, rather than maintaining a lookalike fixture.
const button = buildButton({ label: 'Generated action' });
await writeFile(new URL('../examples/mui-browser/src/GeneratedButton.jsx', import.meta.url),
  `${button.imports.join('\n')}\nimport React from 'react';\nexport default function GeneratedButton() { return (${button.jsx}); }\n`);
