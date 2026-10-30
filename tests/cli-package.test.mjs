import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const cli=(...args)=>spawnSync(process.execPath,['engine/cli.mjs',...args],{encoding:'utf8'});
test('CLI help/version/registry/QA and generator are usable independently',()=>{
 assert.equal(cli('--help').status,0);assert.match(JSON.parse(cli('--version').stdout),/^1\./);
 assert.equal(JSON.parse(cli('registry').stdout).length,9);assert.ok(JSON.parse(cli('qa-plan').stdout).rules.length);
 assert.equal(JSON.parse(cli('qa-rules').stdout).length,24);
 assert.equal(cli('invalid-command').status,2);
});
test('single-file audit and repair refuse oversize input before parsing',()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'bar-cli-'));try{
 const file=path.join(root,'large.jsx');writeFileSync(file,' '.repeat(2*1024*1024+1));
 for(const command of ['audit','repair']){const r=cli(command,file);assert.equal(r.status,2);assert.match(r.stderr,/2 MiB/);}
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('replacement and QA-review CLI return non-mutating review records',()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'bar-suggest-'));try{
 const report=path.join(root,'report.json');writeFileSync(report,JSON.stringify({findings:[{ruleId:'a11y.icon-button-name',file:'Button.jsx',line:1,evidence:'<IconButton />'}]}));
 const proposed=JSON.parse(cli('suggest-replacements',report).stdout);assert.equal(proposed.suggestions[0].automaticReplacement,false);
 const review=path.join(root,'review.json');writeFileSync(review,JSON.stringify({ruleId:'design.task-hierarchy',status:'accepted',target:'synthetic unit fixture',evidence:['fixture.png'],reason:'Synthetic test only, not a real review'}));
 assert.equal(JSON.parse(cli('qa-review',review).stdout).evidenceVerified,false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
