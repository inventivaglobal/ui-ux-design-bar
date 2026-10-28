import test from 'node:test';
import assert from 'node:assert/strict';
import { repair } from '../engine/repair.mjs';
import { audit } from '../engine/audit.mjs';

test('explicit decorative image gets one reversible edit and a clean static audit', () => {
  const input = '<img data-bar-decorative="true" src="spark.svg" />';
  const result = repair(input);
  assert.equal(audit(input).findings[0].fixable, true);
  assert.equal(result.source, '<img alt="" data-bar-decorative="true" src="spark.svg" />');
  assert.equal(result.changes.length, 1);
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.verification.browserVerified, false);
  assert.equal(repair(result.source).changes.length, 0);
  const edit = result.changes[0];
  assert.equal(result.source.slice(0, edit.start) + result.source.slice(edit.start + edit.after.length), input);
});

test('refuses unknown intent, dynamic marker, spreads, semantic overrides and existing alt', () => {
  for (const input of [
    '<img src="x" />', '<img data-bar-decorative={true} />',
    '<img data-bar-decorative="false" />', '<img data-bar-decorative="true" {...props} />',
    '<img data-bar-decorative="true" role="img" />', '<img data-bar-decorative="true" aria-label="Chart" />',
    '<img data-bar-decorative="true" aria-labelledby="caption" />',
    '<img data-bar-decorative="true" alt="Meaningful" />', '<img data-bar-decorative="true" alt={label} />',
    '<img data-bar-decorative="true" data-bar-decorative="true" />',
    '<Image data-bar-decorative="true" />', '<img data-bar-decorative="true"',
  ]) assert.equal(repair(input).source, input, input);
});

test('does not change comments, strings or template text', () => {
  for (const input of [
    '// <img data-bar-decorative="true" />',
    'const sample = \'<img data-bar-decorative="true" />\';',
    'const sample = `<img data-bar-decorative="true" />`;',
    'const App = () => <div>{/* <img data-bar-decorative="true" /> */}</div>;',
  ]) assert.equal(repair(input).source, input);
});

test('handles quoted >, multiline modules, multiple edits and unresolved findings', () => {
  const input = 'import React from "react";\nexport default () => <><img title="a > b"\n data-bar-decorative="true" /><img data-bar-decorative="true"/><img src="meaningful.png" /></>;';
  const result = repair(input);
  assert.equal(result.changes.length, 2);
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.unresolved[0].fixable, false);
  assert.equal(repair(result.source).source, result.source);
});


test('malformed JavaScript is never reinterpreted as JSX text', () => {
  for (const input of [
    `const = '<img data-bar-decorative="true" />';`,
    `<div /> const = '<img data-bar-decorative="true" />' <span />`,
    `<div />{/* incomplete`,
    `</>; const sample = <img data-bar-decorative="true" />; <>`,
  ]) {
    assert.equal(repair(input).source, input);
    assert.equal(audit(input).analysis.imageSyntaxParsed, false);
  }
});
