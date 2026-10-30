import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBrowserConfig, evaluatePerformance } from '../engine/browser-audit.mjs';
const basic = { acknowledgeApplicationEffects:true, urls: ['http://127.0.0.1:4173/example'] };
test('browser config resolves explicit routes and defaults without crawling', () => {
  const config = validateBrowserConfig({ acknowledgeApplicationEffects:true, baseURL: 'https://example.test', routes: ['/a','/b'] });
  assert.deepEqual(config.urls, ['https://example.test/a','https://example.test/b']);
  assert.deepEqual(config.allowedOrigins, ['https://example.test']);
  assert.equal(config.baselineMode, 'compare');
  assert.equal(config.viewports.length, 2);
});
test('browser config rejects credentials, schemes, off-origin routes and unexpected code', () => {
  for (const input of [{ urls:['file:///etc/passwd'] }, {urls:['https://user:secret@example.test']}, {baseURL:'https://example.test',routes:['//elsewhere.test']}, {...basic,allowedOrigins:['https://different.test']}, {...basic, evaluate:'alert(1)'}, {...basic, baselineMode:'capture'}, {...basic, maxRequests:1.5}, {...basic,viewports:[{width:100000,height:800}]}, {...basic, budgets:{unknown:10}}, {...basic,timeoutMs:Infinity}]) assert.throws(() => validateBrowserConfig({acknowledgeApplicationEffects:true,...input}));
});
test('performance budget compares boundaries and only configured measurements', () => {
  assert.deepEqual(evaluatePerformance({loadMs:100}, {loadMs:100}), []);
  const findings = evaluatePerformance({loadMs:101,transferredBytes:500}, {loadMs:100});
  assert.equal(findings.length,1); assert.equal(findings[0].ruleId,'performance.loadMs'); assert.equal(findings[0].actual,101);
});

test('requires explicit application-effects acknowledgment and disables focus by default', () => { assert.throws(() => validateBrowserConfig({urls:basic.urls}), /acknowledgeApplicationEffects/); assert.equal(validateBrowserConfig(basic).focusSamples,0); });
test('artifact directories reject symlink components before launching a browser', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const {runBrowserAudit} = await import('../engine/browser-audit.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'bar-artifact-path-'));
  try {
    fs.mkdirSync(path.join(tmp,'real'));fs.symlinkSync(path.join(tmp,'real'),path.join(tmp,'link'));
    await assert.rejects(runBrowserAudit({...basic,outputDir:path.join(tmp,'link','output')}), /symlinks/);
    assert.deepEqual(fs.readdirSync(path.join(tmp,'real')), []);
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});

test('unavailable transfer measurement cannot pass a configured byte budget', () => {
  const config = validateBrowserConfig(basic);
  assert.equal(Object.hasOwn(config.budgets, 'transferredBytes'), false);
  const findings = evaluatePerformance({loadMs:50,transferredBytes:null}, {loadMs:100,transferredBytes:1000000});
  assert.equal(findings.length,1); assert.equal(findings[0].kind,'incomplete');
  assert.equal(findings[0].ruleId,'performance.transferredBytes.unavailable');
  assert.equal(findings[0].actual,null);
  assert.equal(evaluatePerformance({}, {transferredBytes:100})[0].kind,'incomplete');
});
