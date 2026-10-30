import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runBrowserAudit } from '../../engine/browser-audit.mjs';
const fixture = fs.readFileSync(new URL('../fixtures/browser-audit/page.html', import.meta.url),'utf8');
test('arbitrary independent fixture: axe, responsive, performance and explicit baselines', async ({browser},testInfo) => {
  test.setTimeout(90000);
  let html = fixture;
  const server = http.createServer((req,res) => {res.writeHead(200,{'content-type':'text/html'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bar-runner-'));
  const config={acknowledgeApplicationEffects:true,urls:[`http://127.0.0.1:${server.address().port}/fixture?private=do-not-log`], viewports:[{width:390,height:844}], outputDir:path.join(tmp,'output'),baselineDir:path.join(tmp,'baseline'),budgets:{loadMs:0},focusSamples:2,settleMs:0};
  try {
    const first=await runBrowserAudit({...config,baselineMode:'capture'},{browser});
    expect(first.summary.errors).toBe(0);
    await testInfo.attach('independent-fixture-report',{body:JSON.stringify(first,null,2),contentType:'application/json'});
    await testInfo.attach('independent-fixture-screenshot',{body:fs.readFileSync(path.join(first.outputDir,first.results[0].screenshot)),contentType:'image/png'});
    expect(first.results[0].findings.map(f=>f.ruleId)).toEqual(expect.arrayContaining(['axe.image-alt','layout.horizontal-overflow','performance.loadMs','motion.reduced-motion-review']));
    expect(first.results[0].baseline.status).toBe('captured');
    expect(first.results[0].performance.transferredBytes).toBeNull();
    expect(first.results[0].performance.transferredBytesStatus).toContain('unavailable');
    expect(JSON.stringify(first)).not.toContain('do-not-log');
    const second=await runBrowserAudit(config,{browser});
    expect(second.results[0].baseline.status).toBe('match');
    const unavailable=await runBrowserAudit({...config,baselineDir:path.join(tmp,'unavailable-baseline'),baselineMode:'capture',budgets:{transferredBytes:1000000}},{browser});
    expect(unavailable.results[0].findings).toEqual(expect.arrayContaining([expect.objectContaining({ruleId:'performance.transferredBytes.unavailable',kind:'incomplete'})]));
    expect(unavailable.results[0].baseline.status).toBe('withheld-incomplete');
    expect(fs.readdirSync(path.join(tmp,'unavailable-baseline'))).toEqual([]);
    html=fixture.replace('Independent fixture</h1>','Changed fixture</h1>');
    const changed=await runBrowserAudit(config,{browser});
    expect(changed.results[0].baseline.status).toBe('changed');
    const refused=await runBrowserAudit({...config,baselineMode:'capture'},{browser});
    expect(refused.summary.errors).toBeGreaterThan(0);
    const updated=await runBrowserAudit({...config,baselineMode:'update'},{browser});
    expect(updated.results[0].baseline.status).toBe('updated');
  } finally { await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true}); }
});
test('network policy blocks mutations and unapproved origins without logging request secrets', async({browser})=>{
  let posts=0;
  const server=http.createServer((req,res)=>{ if(req.method==='POST') posts++;res.writeHead(200,{'content-type':'text/html'});res.end('<html lang="en"><title>Policy</title><main><h1>Policy</h1></main><script>fetch("/write?secret=hidden",{method:"POST"}).catch(()=>{});fetch("https://unapproved.invalid/private?secret=hidden").catch(()=>{});</script>'); });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bar-policy-'));
  try{
    const report=await runBrowserAudit({acknowledgeApplicationEffects:true,urls:[`http://127.0.0.1:${server.address().port}/`],viewports:[{width:800,height:600}],outputDir:tmp,baselineDir:path.join(tmp,'baselines'),baselineMode:'capture',focusSamples:0},{browser});
    expect(report.results[0].baseline.status).toBe('withheld-incomplete');expect(fs.readdirSync(path.join(tmp,'baselines'))).toEqual([]);
    expect(posts).toBe(0);expect(report.results[0].blockedRequests).toBeGreaterThanOrEqual(2);
    expect(report.results[0].blockedOrigins).toContain('https://unapproved.invalid');
    expect(JSON.stringify(report)).not.toContain('hidden');
  }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true});}
});
test('redirected navigations and subresources never contact unapproved origin', async({browser})=>{
  let forbiddenHits=0;
  const forbidden=http.createServer((req,res)=>{forbiddenHits++;res.end('forbidden');});
  await new Promise(resolve=>forbidden.listen(0,'127.0.0.1',resolve));
  const destination=`http://127.0.0.1:${forbidden.address().port}/private`;
  const allowed=http.createServer((req,res)=>{
    if(req.url.startsWith('/redirect')) {res.writeHead(302,{location:destination});res.end();}
    else {res.writeHead(200,{'content-type':'text/html'});res.end('<html lang="en"><title>Redirect test</title><main><h1>Redirect test</h1><img alt="" src="/redirect-image"></main><script>fetch("/redirect-fetch").catch(()=>{})</script>');}
  });
  await new Promise(resolve=>allowed.listen(0,'127.0.0.1',resolve));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bar-redirect-'));
  try {
    const origin=`http://127.0.0.1:${allowed.address().port}`;
    const report=await runBrowserAudit({acknowledgeApplicationEffects:true,urls:[origin+'/redirect-navigation',origin+'/page'],viewports:[{width:800,height:600}],outputDir:tmp,baselineMode:'off',timeoutMs:2000},{browser});
    expect(forbiddenHits).toBe(0);
    expect(report.results.every(r=>r.blockedRequests>0)).toBe(true);
    expect(report.summary.errors).toBeGreaterThan(0);
  } finally { await new Promise(resolve=>allowed.close(resolve));await new Promise(resolve=>forbidden.close(resolve));fs.rmSync(tmp,{recursive:true,force:true}); }
});
