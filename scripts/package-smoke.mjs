import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=mkdtempSync(path.join(os.tmpdir(),'bar-package-'));
try {
 const [pack]=JSON.parse(execFileSync('npm',['pack','--json','--pack-destination',root],{encoding:'utf8'}));
 assert.ok(pack.files.some(f=>f.path==='engine/mcp.mjs'));
 assert.ok(pack.files.some(f=>f.path.endsWith('material-symbols.json')));
 assert.ok(!pack.files.some(f=>/node_modules|test-results|\.bar\//.test(f.path)));
 writeFileSync(path.join(root,'package.json'),JSON.stringify({private:true,type:'module'}));
 execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',path.join(root,pack.filename)],{cwd:root,stdio:'pipe'});
 const cli=path.join(root,'node_modules/.bin/bar');
 assert.equal(JSON.parse(execFileSync(cli,['--version'],{encoding:'utf8'})),JSON.parse(readFileSync('package.json','utf8')).version);
 assert.equal(JSON.parse(execFileSync(cli,['registry'],{encoding:'utf8'})).length,9);
 assert.ok(JSON.parse(execFileSync(cli,['qa-plan'],{encoding:'utf8'})));
 writeFileSync(path.join(root,'options.json'),JSON.stringify({label:'Safe <text> {value}'}));
 assert.ok(JSON.parse(execFileSync(cli,['build-component','action-button',path.join(root,'options.json')],{encoding:'utf8'})).code);
 execFileSync(process.execPath,['--input-type=module','-e',"import {audit} from 'ui-ux-design-bar';import {BarButton} from 'ui-ux-design-bar/components';import {createBarTheme} from 'ui-ux-design-bar/tokens';if(!audit('<img/>').findings.length||!BarButton||!createBarTheme())process.exit(1)"],{cwd:root,stdio:'pipe'});
 assert.ok(existsSync(path.join(root,'node_modules/.bin/bar-mcp')));
 execFileSync(process.execPath,['--input-type=module','-e',"await import('@playwright/test');await import('@axe-core/playwright');await import('ui-ux-design-bar/browser');await import('ui-ux-design-bar/generate')"],{cwd:root,stdio:'pipe'});
 console.log(JSON.stringify({packed:pack.filename,files:pack.files.length,install:'passed',cli:'passed',exports:'passed'}));
}finally{rmSync(root,{recursive:true,force:true});}
