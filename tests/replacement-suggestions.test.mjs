import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { suggestReplacements } from '../packages/registry/suggest.mjs';
import { audit } from '../engine/audit.mjs';
test('maps actual static findings to manifest-backed review candidates', () => {
 const report = audit('<form><button onClick={save}>Save</button><IconButton onClick={close} /></form>', 'Example.jsx');
 const result = suggestReplacements(report);
 assert.deepEqual(result.suggestions.map(s => s.candidate.id), ['action-button','icon-button']);
 for (const item of result.suggestions) { assert.equal(item.confidence, 'medium'); assert.equal(item.automaticReplacement, false); assert.equal(item.manualReviewRequired, true); assert.equal(item.approvalRequired, true); assert.ok(item.requiredChecks.length); assert.ok(item.unresolvedIntent.length); assert.ok(item.preserve.length); assert.equal(item.applicability,'conditional-manual-review'); }
 assert.equal(result.mode,'suggestion-only');
});
test('covers explicit names and disabled review without guessing labels or handlers', () => {
 const result = suggestReplacements({ findings: [{ruleId:'a11y.explicit-control-label', evidence:'<IconButton data-bar-label="Save" />'}, {ruleId:'interaction.disabled-redundancy'}] });
 assert.equal(result.suggestions[0].candidate.id,'icon-button');
 assert.equal(result.suggestions[1].confidence,'low');
 for (const item of result.suggestions) { assert.equal(item.code,undefined); assert.equal(item.patch,undefined); assert.equal(item.label,undefined); assert.equal(item.onClick,undefined); }
});
test('unknown and image findings stay unmapped; incomplete audits block applicability', () => {
 const result = suggestReplacements({complete:false, findings:[{ruleId:'a11y.image-alt'},{ruleId:'unknown.rule'},{ruleId:'form.explicit-button-type'}]});
 assert.equal(result.unmapped.length,2); assert.equal(result.sourceComplete,false); assert.equal(result.suggestions[0].applicability,'blocked-until-audit-complete');
 assert.equal(suggestReplacements({findings:[]}).suggestions.length,0);
});
test('rejects malformed inputs and browser observations', () => {
 for (const report of [null,[],{}, {findings:{}}, {findings:[null]}, {findings:[{ruleId:3}]}, {findings:[{ruleId:'x',line:-1}]}, {findings:[{ruleId:'x',evidence:{}}]}, {schemaVersion:'bar-browser-1',findings:[]}, {findings:Array(10001).fill({ruleId:'x'})}]) assert.throws(() => suggestReplacements(report));
});
test('does not mutate input or read/write source paths', () => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(),'bar-suggest-'));
 try { const file = path.join(dir,'source.jsx'); const source = '<IconButton />'; fs.writeFileSync(file,source); const report = audit(source,file); const before = JSON.stringify(report); Object.freeze(report.findings[0]); Object.freeze(report.findings); Object.freeze(report); suggestReplacements(report); assert.equal(JSON.stringify(report),before); assert.equal(fs.readFileSync(file,'utf8'),source); assert.deepEqual(fs.readdirSync(dir),['source.jsx']);
 const absent = suggestReplacements({findings:[{ruleId:'a11y.icon-button-name',file:'/does/not/exist.jsx',line:1}]}); assert.equal(absent.suggestions.length,1);
 } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
