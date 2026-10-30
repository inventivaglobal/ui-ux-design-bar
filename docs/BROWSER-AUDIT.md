# Standalone browser audits

`runBrowserAudit(config, { browser? })` from `engine/browser-audit.mjs` audits explicitly supplied pages. An existing Playwright Browser can be injected for tests; otherwise it launches Chromium. It returns a `bar-browser-1` JSON report and writes that report plus viewport PNGs to a unique `outputDir/run-*` directory. It never crawls links, signs in, fills forms, clicks controls, or starts application servers. Start your authorized fixture/application separately.

```js
import { runBrowserAudit } from './engine/browser-audit.mjs';
const report = await runBrowserAudit({
  acknowledgeApplicationEffects: true, // authorized synthetic test application
  baseURL: 'http://127.0.0.1:4173', routes: ['/', '/settings'],
  viewports: [{ width: 1440, height: 900 }, { width: 390, height: 844 }],
  budgets: { loadMs: 3000, domContentLoadedMs: 1500 },
  outputDir: './bar-browser-report', baselineDir: './bar-baselines',
  baselineMode: 'compare'
});
```

Alternatively use `urls: ['https://your-authorized-host/path']`. Origins default to the explicit targets only. Additional asset origins require exact `allowedOrigins` entries, including every target origin. Requests to other origins, non-GET/HEAD requests, WebSockets and service workers are blocked. A blocked request makes the run incomplete, not a pass. A GET can still have server-side effects: only audit applications you are authorized to visit. This is not a browser security sandbox or an authorization mechanism. HTTP redirects are refused entirely (including same-origin redirects); supply the final authorized URL explicitly. Browser pages can execute their own application scripts; configuration cannot supply scripts.

## Measurements and limits

- Axe WCAG 2 A/AA and 2.1 A/AA checks produce rule IDs, severity and node counts without copying DOM contents. Automated accessibility checks are not WCAG certification; axe incomplete checks and manual checks remain.
- Root horizontal overflow is measured at every configured viewport. This does not establish all responsive layout correctness.
- Keyboard Tab sampling checks computed outline/box-shadow and visible boxes. It does not prove focus contrast, order, traps, overlays, or usable task completion. The report identifies this heuristic.
- Reduced-motion sampling counts CSS durations over 100 ms on the first 10,000 elements while emulating `prefers-reduced-motion: reduce`. It cannot determine necessity or detect all JS/canvas/video motion.
- Navigation Timing load/DCL are compared against explicitly configured budgets under intercepted-response lab conditions. These are not direct-origin timings, Lighthouse, Core Web Vitals, or field performance. Fetch/fulfill interception does not preserve origin wire-transfer measurements, so `performance.transferredBytes` is explicitly `null` with an unavailable status. The default budgets omit transfer bytes. If you explicitly configure a `transferredBytes` budget, the report emits an incomplete finding, never a zero-byte pass, and withholds baseline capture/update. No transfer measurement or performance score is fabricated.
- Limits: 16 URLs, 8 viewports, 32 allowed origins, at most 1,000 requests per page, bounded viewport screenshots, 30 focus samples. Default navigation timeout 15 seconds, with a per-page watchdog of four times that timeout plus settling time. `maxObservedHeaderBytes` (default 20 MiB) is an **advisory cumulative Content-Length threshold**: subsequent requests are blocked after crossing it. Missing headers, active downloads and in-flight responses mean it is not a hard byte/memory cap. Use trusted local fixtures and an externally isolated browser for untrusted applications.

Configuration requires `acknowledgeApplicationEffects: true`: page scripts, GET handlers, focus and animation events may cause application/server changes. The runner is not guaranteed read-only. Use authorized synthetic test applications, not production customer pages. Keyboard focus sampling defaults to 0 (opt in explicitly). Incomplete runs never capture/update baseline files.

Config options: `timeoutMs` (100–60000), `settleMs` (0–3000), `maxRequests` (1–1000), `maxObservedHeaderBytes` (1024–104857600), `focusSamples` (0–30), optional `executablePath`. Unknown keys are rejected. No cookies/storage state or arbitrary scripts are accepted.

## Visual baseline workflow

Default `compare` never creates or updates a baseline. Missing baselines are explicitly reported. With no `baselineDir`, visual checking is `not-configured`, never a passing comparison. `off` disables comparison but still captures the viewport.

1. Run against a deterministic fixture and inspect the captured images.
2. Explicitly run `baselineMode: 'capture'` with a dedicated `baselineDir`. Existing baseline files are refused.
3. Review/version the baseline PNGs. Run `compare` for subsequent checks.
4. For an intentional change, inspect old/new PNGs, then explicitly use `update`. Review the baseline diff before committing.

Comparison is strict SHA-256 equality of viewport PNG bytes, not perceptual/tolerant pixel diff. Pin Chromium/Playwright, OS, fonts and viewport; freeze time and dynamic fixture content. Matching PNG bytes are evidence only for that rendered viewport. Existing baseline symlinks/hardlinks and symlinked artifact directories are refused. Do not use concurrently writable/untrusted artifact directories. Capture/update are explicit disk writes; all other audit behavior leaves source files unchanged.

Reports omit query strings, credentials, DOM snippets and page exception contents. Screenshots **can contain sensitive visible application data**; paths can also identify application routes. Use synthetic fixtures, keep artifacts private, and never commit customer screenshots or authenticated state. Each page error or blocked request must be investigated before signoff. Findings of every severity, missing/incomplete checks, and manual review must be considered; a zero high-severity count alone is not a release signoff.

## Independent verification

`node --test tests/browser-audit.test.mjs` checks schema and performance budgets. `npx playwright test tests/browser/runner-audit.spec.mjs` runs a separate HTTP fixture (not the MUI example), exercising axe, overflow, performance, strict capture/compare/change/update, privacy filtering and blocked mutations/origins. Browser execution requires installed Chromium and permission to bind localhost sockets. Fixture tests do not visit any live customer application.
