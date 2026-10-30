import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from '@babel/parser';
import { componentIds, listComponents, validateManifest } from '../packages/registry/index.mjs';
import { generateComponent } from '../packages/components/generate.mjs';
import { BarButton, BarIconButton, BarIcon, BarTextField, BarSelect, BarAlert, BarCard, BarTabs, BarTable, BarDialog } from '../packages/components/index.mjs';
import { createBarTheme, tokens } from '../packages/tokens/mui-theme.mjs';
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
test('all nine curated manifests validate and require replacement approval', () => {
 assert.equal(listComponents().length, 9);
 for (const manifest of listComponents()) assert.equal(validateManifest(manifest).valid, true);
 assert.equal(validateManifest({ id: 'made-up' }).valid, false);
});
test('generators emit parseable JSX and treat hostile text as data', () => {
 for (const id of componentIds) { const result = generateComponent(id); parse(result.code, { plugins: ['jsx'] }); assert.equal(result.replacementRequiresApproval, true); }
 const code = generateComponent('action-button', { label: 'Save {alert(1)} </Button> " & <script>' }).code;
 const ast = parse(code, { plugins: ['jsx'] });
 assert.equal(ast.program.body[0].expression.openingElement.attributes[0].value.expression.type, 'StringLiteral');
 assert.throws(() => generateComponent('action-button', { onClick: 'evil()' }));
 assert.throws(() => generateComponent('action-button', { dangerouslySetInnerHTML: {} }));
 assert.throws(() => generateComponent('constructor'));
 assert.throws(() => generateComponent('action-button', { nested: { callback() {} } }));
 assert.throws(() => generateComponent('action-button', { value: NaN }));
 assert.throws(() => generateComponent('action-button', { get label() { throw new Error('Must not execute'); } }), /accessors/);
});
test('tokens map into a real MUI theme with explicit override support', () => {
 const theme = createBarTheme(); assert.equal(theme.palette.primary.main, tokens.color.action.primary); assert.equal(theme.spacing(2), '8px'); assert.equal(theme.shape.borderRadius, 8);
 assert.equal(createBarTheme({ palette: { primary: { main: '#123456' } } }).palette.primary.main, '#123456');
});
test('bundled symbols match pinned upstream asset hashes', () => {
 const data = JSON.parse(readFileSync(new URL('../packages/registry/icons/material-symbols.json', import.meta.url)));
 assert.equal(Object.keys(data.icons).length, 6);
 for (const [name, info] of Object.entries(data.icons)) { const bytes = readFileSync(new URL(`../packages/registry/icons/assets/${name}.svg`, import.meta.url)); assert.equal(createHash('sha256').update(bytes).digest('hex'), info.sha256); assert.ok(bytes.toString().includes(info.path)); }
 assert.match(readFileSync(new URL('../packages/registry/icons/LICENSE.Apache-2.0.txt', import.meta.url), 'utf8'), /Apache License/);
});
test('icons are decorative by default and named only explicitly', () => {
 assert.match(render(BarIcon, { name: 'action.close' }), /aria-hidden="true"/);
 assert.match(render(BarIcon, { name: 'status.warning', label: 'Warning' }), /role="img".*aria-label="Warning"/);
 assert.throws(() => render(BarIcon, { name: 'unknown' }));
 assert.throws(() => render(BarIconButton, { label: '', icon: 'close' }));
 assert.match(render(BarIconButton, { label: 'Dismiss', icon: 'close' }), /aria-label="Dismiss"/);
});
test('curated controls render labels and table semantics with safe text', () => {
 assert.match(render(BarButton, { label: '<save>', type: 'submit' }), /type="submit".*&lt;save&gt;/s);
 assert.match(render(BarTextField, { label: 'Name', id: 'name' }), /for="name"/);
 assert.match(render(BarSelect, { label: 'Status', value: 'a', options: [{ value: 'a', label: 'Active' }] }), /Status/);
 assert.match(render(BarAlert, { message: 'Saved' }), /role="alert"/);
 assert.match(render(BarCard, { title: 'Overview' }), /<h2/);
 assert.match(render(BarTabs, { label: 'Sections', value: 0, onChange() {}, items: [{ label: 'First', content: 'Panel' }] }), /role="tabpanel"/);
 const table = render(BarTable, { caption: 'Records', columns: [{ key: 'name', label: 'Name' }], rows: [{ name: 'Ada' }] });
 assert.match(table, /<caption>Records<\/caption>/); assert.match(table, /scope="col"/);
 assert.throws(() => render(BarDialog, { title: 'Confirm', open: false }));
});
