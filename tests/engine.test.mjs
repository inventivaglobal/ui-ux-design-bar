import test from 'node:test';
import assert from 'node:assert/strict';
import {audit} from '../engine/audit.mjs';
import {repair} from '../engine/repair.mjs';
import {buildButton} from '../engine/build.mjs';
test('flags unnamed icon button and missing image alt',()=>{
 const r=audit('<IconButton><Delete /></IconButton>\n<img src="x" />');
 assert.deepEqual(r.findings.map(x=>x.ruleId),['a11y.icon-button-name','a11y.image-alt']);
});
test('does not flag labelled icon button',()=>assert.equal(audit('<IconButton aria-label="Delete"><Delete /></IconButton>').summary.total,0));
test('builder rejects empty accessible labels',()=>assert.throws(()=>buildButton({label:' '})));
test('builder emits MUI button',()=>assert.match(buildButton({label:'Save'}).jsx,/type="button"/));
test('repair never invents labels',()=>{const s='<IconButton><Delete /></IconButton>';assert.equal(repair(s).source,s)});
