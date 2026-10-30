# Implementation status

**Candidate only; not signed off or published as a stable release.** See the [acceptance matrix](RELEASE-ACCEPTANCE.md) for gates. Version `1.0.0-rc.1` identifies the full-scope implementation candidate, not proof of readiness.

Implemented: nine MUI wrappers/manifests and generator; manifest-backed replacement proposal workflow; semantic tokens/theme; six pinned local Material Symbols; six-source original QA rule/plan/review integration; JSX/TSX folder audits; parser-based CSS/modules report-only audits and baselines; four explicit-intent repair recipes; guarded preview/apply/undo journals; authorized configured-route browser runner with axe/responsive/performance/visual comparisons and heuristic focus/motion checks; CLI/library tarball and read-only stdio MCP; independent fixture and MUI gallery test suites.

Not claimed: complete upstream engines/datasets imported, automatic whole-app redesign, safe automatic component substitution, all frameworks/browsers/routes/states supported, subjective design decisions automated, full accessibility certification, browser results for code not actually run, npm registry publication or user signoff.

## Verification

`npm test`: Node contracts, parsing, escaping, safety, source provenance, registry rendering, MCP SDK client handshake. `npm run test:package`: pack → fresh install → CLI and exports. `npm run check`: Node tests → generated demo production build → desktop/mobile Chromium tests. CI additionally runs package smoke. Browser tests cover the MUI form/repair/gallery and separately served non-MUI fixtures; they do not test a downstream customer application.

Local Node/package/build checks have run; final counts and exact-commit browser CI evidence belong in the release acceptance record. Local Chromium launch was blocked by sandbox socket permissions before any browser assertions; do not count these cases as passes. CI must execute them before release.

## Limits

Some non-image legacy static checks remain regex heuristics. Unsupported/malformed JSX/TSX is not a clean audit. CSS duplicates are context-scoped review candidates, not removal instructions. Dynamic/generated styles and module exports remain uncertain. Folder source budgets refuse oversized work rather than claiming exhaustive success.

Browser audits only observe configured URLs/viewports in clean contexts, no authenticated sessions or arbitrary business-journey scripts. Every redirect is refused. GET/page/keyboard handlers can have effects despite request restrictions; authorization acknowledgment is mandatory. Performance measurements are lab observations, not field Core Web Vitals certification. Transfer-byte measurement is unavailable under request interception; an explicitly configured byte budget reports incomplete, never a zero-byte pass. Observed header budgets are advisory, not hard bandwidth caps. Visual comparison is strict PNG hashing, sensitive to platform/fonts/content and requiring reviewed baselines. No configured baseline means no visual regression verdict. Focus and motion checks are review hints, not full keyboard or reduced-motion certification. Manual screen-reader, content and product-fit review remain explicit.
