import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bounded = (n, min, max, label) => { if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be ${min}–${max}`); return n; };
const publicUrl = input => { const url = new URL(input); return `${url.origin}${url.pathname}`; };
function urlValue(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only HTTP(S) URLs without credentials are allowed');
  if (url.hash) throw new Error('URL fragments are not supported');
  return url;
}
export function validateBrowserConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Browser config must be an object');
  const known = new Set(['baseURL','routes','urls','allowedOrigins','viewports','timeoutMs','settleMs','maxRequests','maxObservedHeaderBytes','focusSamples','budgets','outputDir','baselineDir','baselineMode','executablePath','acknowledgeApplicationEffects']);
  if (input.acknowledgeApplicationEffects !== true) throw new Error('Explicit acknowledgeApplicationEffects: true required for authorized test applications');
  for (const key of Object.keys(input)) if (!known.has(key)) throw new Error(`Unknown browser config key: ${key}`);
  if (input.urls && input.routes) throw new Error('Use urls or baseURL/routes, not both');
  if (input.routes && (!input.baseURL || !Array.isArray(input.routes))) throw new Error('routes require baseURL');
  for (const key of ['maxRequests', 'focusSamples']) if (input[key] !== undefined && !Number.isInteger(input[key])) throw new Error(`${key} must be an integer`);
  if (input.executablePath !== undefined && typeof input.executablePath !== 'string') throw new Error('executablePath must be a string');
  const urls = input.urls || (input.routes || ['/']).map(route => {
    if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) throw new Error('Routes must be origin-relative paths');
    return new URL(route, urlValue(input.baseURL)).href;
  });
  if (!Array.isArray(urls) || urls.length < 1 || urls.length > 16) throw new Error('Supply 1–16 explicit URLs');
  const parsed = urls.map(urlValue);
  if (new Set(parsed.map(url => url.href)).size !== parsed.length) throw new Error('Duplicate URLs are not allowed');
  const allowedOrigins = input.allowedOrigins || [...new Set(parsed.map(url => url.origin))];
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length || allowedOrigins.length > 32) throw new Error('Supply 1–32 allowed origins');
  for (const origin of allowedOrigins) if (urlValue(origin).origin !== origin) throw new Error('allowedOrigins must contain exact origins');
  if (parsed.some(url => !allowedOrigins.includes(url.origin))) throw new Error('Every target origin must be explicitly allowed');
  const viewports = input.viewports || [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
  if (!Array.isArray(viewports) || viewports.length < 1 || viewports.length > 8) throw new Error('Supply 1–8 viewports');
  for (const viewport of viewports) { bounded(viewport.width, 240, 3840, 'width'); bounded(viewport.height, 240, 2160, 'height'); if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) throw new Error('Viewport dimensions must be integers'); }
  const budgets = input.budgets || { domContentLoadedMs: 5000, loadMs: 10000 };
  if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) throw new Error('Invalid budgets');
  for (const [key, value] of Object.entries(budgets)) { if (!['domContentLoadedMs','loadMs','transferredBytes'].includes(key)) throw new Error(`Unknown budget: ${key}`); bounded(value, 0, 1024 * 1024 * 1024, key); }
  const baselineMode = input.baselineMode || 'compare';
  if (!['compare','capture','update','off'].includes(baselineMode)) throw new Error('Invalid baselineMode');
  if (['capture','update'].includes(baselineMode) && !input.baselineDir) throw new Error('Explicit baselineDir required for capture/update');
  return { urls: parsed.map(url => url.href), allowedOrigins, viewports: viewports.map(({width,height}) => ({width,height})), budgets,
    timeoutMs: bounded(input.timeoutMs ?? 15000, 100, 60000, 'timeoutMs'), settleMs: bounded(input.settleMs ?? 100, 0, 3000, 'settleMs'),
    maxRequests: bounded(input.maxRequests ?? 150, 1, 1000, 'maxRequests'), maxObservedHeaderBytes: bounded(input.maxObservedHeaderBytes ?? 20 * 1024 * 1024, 1024, 100 * 1024 * 1024, 'maxObservedHeaderBytes'),
    focusSamples: bounded(input.focusSamples ?? 0, 0, 30, 'focusSamples'), outputDir: input.outputDir || 'bar-browser-report', baselineDir: input.baselineDir, baselineMode, executablePath: input.executablePath };
}
function safeDirectory(input) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Invalid artifact directory');
  const absolute = path.resolve(input);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { fs.mkdirSync(current); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    if (!fs.lstatSync(current).isDirectory() || fs.lstatSync(current).isSymbolicLink()) throw new Error('Artifact directories must not contain symlinks');
  }
  return absolute;
}
export function evaluatePerformance(metrics, budgets) {
  return Object.entries(budgets).flatMap(([key, limit]) => !Number.isFinite(metrics[key]) ? [{ ruleId: `performance.${key}.unavailable`, severity: 'medium', kind: 'incomplete', message: `${key} measurement unavailable; configured budget could not be evaluated`, actual: null, limit }] : metrics[key] > limit ? [{ ruleId: `performance.${key}`, severity: 'medium', kind: 'measurement', message: `${key} exceeded configured budget`, actual: metrics[key], limit }] : []);
}
function saveBaseline(directory, key, bytes, mode) {
  if (!directory || mode === 'off') return { status: 'not-configured', algorithm: 'exact-png-sha256' };
  const file = path.join(directory, key + '.png');
  let existing;
  try { const stat = fs.lstatSync(file); if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 50 * 1024 * 1024) throw new Error('Unsafe baseline file'); existing = fs.readFileSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const actualHash = sha(bytes), expectedHash = existing ? sha(existing) : null;
  if (mode === 'compare') return { status: !existing ? 'missing' : actualHash === expectedHash ? 'match' : 'changed', expectedHash, actualHash, algorithm: 'exact-png-sha256' };
  if (mode === 'capture' && existing) throw new Error('Baseline already exists; use explicit update mode after reviewing the diff');
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 }); if (mode === 'capture') fs.linkSync(temporary, file); else fs.renameSync(temporary, file); } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return { status: existing ? 'updated' : 'captured', previousHash: expectedHash, actualHash, algorithm: 'exact-png-sha256' };
}
export async function runBrowserAudit(input, runtime = {}) {
  const config = validateBrowserConfig(input);
  const outputRoot = safeDirectory(config.outputDir);
  const outputDir = fs.mkdtempSync(path.join(outputRoot, 'run-'));
  const baselineDir = config.baselineDir ? safeDirectory(config.baselineDir) : undefined;
  const [{ chromium }, { default: AxeBuilder }] = await Promise.all([import('@playwright/test'), import('@axe-core/playwright')]);
  const browser = runtime.browser || await chromium.launch(config.executablePath ? { executablePath: config.executablePath } : {});
  const results = [];
  try {
    for (const url of config.urls) for (const viewport of config.viewports) {
      const key = `${sha(url).slice(0,20)}-${viewport.width}x${viewport.height}`;
      const result = { url: publicUrl(url), viewport, findings: [], errors: [], blockedRequests: 0, blockedOrigins: [], baseline: { status: 'not-run' } };
      const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', serviceWorkers: 'block', acceptDownloads: false });
      let requests = 0, responseBytes = 0, screenshotBytes;
      const blockedOrigins = new Set();
      await context.route('**/*', async route => {
        let target;
        try { target = new URL(route.request().url()); } catch { result.blockedRequests++; return route.abort(); }
        requests++;
        if (!['http:','https:'].includes(target.protocol) || !config.allowedOrigins.includes(target.origin) || requests > config.maxRequests || responseBytes > config.maxObservedHeaderBytes) {
          result.blockedRequests++; if (['http:','https:'].includes(target.protocol)) blockedOrigins.add(target.origin); return route.abort();
        }
        // Block non-GET/HEAD traffic; authorized page scripts and GET handlers may still have effects.
        if (!['GET','HEAD'].includes(route.request().method())) { result.blockedRequests++; return route.abort(); }
        // Fetch without redirect following: Playwright routing alone does not reliably
        // re-intercept every redirect hop. Refuse all redirects rather than leak a request.
        try {
          const response = await route.fetch({ maxRedirects: 0, maxRetries: 0, timeout: config.timeoutMs });
          if (response.status() >= 300 && response.status() < 400) {
            result.blockedRequests++; await response.dispose(); return route.abort();
          }
          await route.fulfill({ response });
          await response.dispose();
        } catch { result.blockedRequests++; await route.abort().catch(() => {}); }
      });
      // Block WebSocket traffic rather than permitting an uninspected mutation channel.
      await context.routeWebSocket('**/*', socket => { result.blockedRequests++; socket.close(); });
      const page = await context.newPage();
      const watchdog = setTimeout(() => { context.close().catch(() => {}); }, config.timeoutMs * 4 + config.settleMs);
      watchdog.unref();
      page.setDefaultTimeout(config.timeoutMs);
      page.on('response', response => { const size = Number(response.headers()['content-length']); if (Number.isFinite(size) && size > 0) responseBytes += size; });
      let pageErrors = 0;
      page.on('pageerror', () => { pageErrors++; });
      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: config.timeoutMs });
        if (!response || response.status() >= 400) result.errors.push({ code: 'http', message: `Target response ${response?.status() ?? 'missing'}` });
        if (!config.allowedOrigins.includes(new URL(page.url()).origin)) throw new Error('Navigation left allowed origins');
        await page.waitForTimeout(config.settleMs);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
        for (const violation of axe.violations) result.findings.push({ ruleId: `axe.${violation.id}`, severity: ['critical','serious'].includes(violation.impact) ? 'high' : 'medium', kind: 'automated-accessibility', message: violation.description, helpUrl: violation.helpUrl, count: violation.nodes.length });
        result.accessibility = { violations: axe.violations.length, incomplete: axe.incomplete.length, passes: axe.passes.length, engine: axe.testEngine };
        const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
        result.layout = layout;
        if (layout.scrollWidth > layout.width + 1) result.findings.push({ ruleId: 'layout.horizontal-overflow', severity: 'high', kind: 'measurement', message: 'Document exceeds viewport width', ...layout });
        const metrics = await page.evaluate(() => { const navigation = performance.getEntriesByType('navigation')[0]; return { domContentLoadedMs: navigation?.domContentLoadedEventEnd || 0, loadMs: navigation?.loadEventEnd || 0, transferredBytes: null }; });
        result.performance = { ...metrics, measurementMode: 'intercepted-response-lab', transferredBytesStatus: 'unavailable: fetch/fulfill interception does not preserve origin wire-transfer timing' };
        result.findings.push(...evaluatePerformance(metrics, config.budgets));
        // Capture viewport only: bounded dimensions, before keyboard focus alters page appearance.
        const screenshot = await page.screenshot({ animations: 'disabled', caret: 'hide', timeout: config.timeoutMs });
        fs.writeFileSync(path.join(outputDir, key + '.png'), screenshot, { flag: 'wx', mode: 0o600 });
        result.screenshot = key + '.png';
        screenshotBytes = screenshot;
        result.baseline = ['capture','update'].includes(config.baselineMode) ? { status: 'pending-review-capture' } : saveBaseline(baselineDir, key, screenshot, config.baselineMode);
        if (result.baseline.status === 'changed') result.findings.push({ ruleId: 'visual.baseline-change', severity: 'medium', kind: 'visual-regression', message: 'Viewport PNG differs from reviewed baseline; inspect before accepting' });
        if (result.baseline.status === 'missing') result.findings.push({ ruleId: 'visual.baseline-missing', severity: 'medium', kind: 'incomplete', message: 'No reviewed baseline; capture explicitly after inspection' });
        const focus = [];
        for (let i = 0; i < config.focusSamples; i++) {
          await page.keyboard.press('Tab');
          const sample = await page.evaluate(() => { const element = document.activeElement; if (!element || element === document.body) return { focused: false }; const s = getComputedStyle(element); const r = element.getBoundingClientRect(); return { focused: true, tag: element.tagName.toLowerCase(), visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden', indicator: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && s.outlineColor !== 'rgba(0, 0, 0, 0)') || s.boxShadow !== 'none' }; });
          focus.push(sample);
        }
        result.focus = { samples: focus, verification: 'heuristic: outline/box-shadow only; not keyboard-flow or contrast certification' };
        if (focus.some(sample => sample.focused && (!sample.visible || !sample.indicator))) result.findings.push({ ruleId: 'interaction.focus-review', severity: 'low', kind: 'heuristic', message: 'Sampled keyboard focus lacks a detectable outline/shadow or visible box; inspect manually' });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const motion = await page.evaluate(() => [...document.querySelectorAll('*')].slice(0,10000).reduce((count, element) => { const s = getComputedStyle(element); const seconds = value => value.split(',').map(v => parseFloat(v) * (v.trim().endsWith('ms') ? 0.001 : 1)); return count + (seconds(s.animationDuration).some(n => n > 0.1) || seconds(s.transitionDuration).some(n => n > 0.1) ? 1 : 0); },0));
        result.reducedMotion = { candidates: motion, verification: 'heuristic: CSS durations over 100 ms in first 10000 elements, not animation necessity' };
        if (motion) result.findings.push({ ruleId: 'motion.reduced-motion-review', severity: 'low', kind: 'heuristic', message: 'Nontrivial CSS motion remains under prefers-reduced-motion; review necessity', count: motion });
        if (pageErrors) result.errors.push({ code: 'runtime', message: `${pageErrors} JavaScript runtime error(s); content omitted for privacy` });
      } catch (error) { result.errors.push({ code: 'audit', message: error.name === 'TimeoutError' ? 'Audit timed out' : 'Audit could not complete; inspect target and configuration (exception content omitted for privacy)' }); }
      finally { clearTimeout(watchdog); result.blockedOrigins = [...blockedOrigins]; await context.close(); }
      if (result.blockedRequests) result.errors.push({ code: 'network-policy', message: `${result.blockedRequests} request(s) blocked; rendering may be incomplete` });
      if (screenshotBytes && ['capture','update'].includes(config.baselineMode)) {
        if (result.errors.length || result.findings.some(f => f.kind === 'incomplete')) result.baseline = { status: 'withheld-incomplete' };
        else { try { result.baseline = saveBaseline(baselineDir, key, screenshotBytes, config.baselineMode); } catch { result.baseline = { status: 'write-refused' }; result.errors.push({ code: 'baseline', message: 'Baseline write refused; capture cannot replace existing baselines and unsafe paths are rejected' }); } }
      }
      results.push(result);
    }
  } finally { if (!runtime.browser) await browser.close(); }
  const report = { schemaVersion: 'bar-browser-1', verification: 'rendered automated observations; manual review remains required', outputDir, results, summary: { pages: results.length, findings: results.reduce((n,r) => n+r.findings.length,0), high: results.reduce((n,r) => n+r.findings.filter(f=>f.severity==='high').length,0), errors: results.reduce((n,r)=>n+r.errors.length,0) } };
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
  return report;
}
