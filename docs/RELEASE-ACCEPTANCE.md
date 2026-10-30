# Full standalone release acceptance

Version: **1.0.0-rc.1**. Implementation and scoped review gates have evidence; merge/versioned publication and final user signoff are separate decisions. No downstream application is a launch dependency. [Exact evidence and limitations](RELEASE-EVIDENCE.md).

| Roadmap capability | Functional acceptance | Status |
|---|---|---|
| Curated component/token library | Nine manifests/wrappers, theme adapter, safe generator and manual replacement proposals; SSR/escaping and rendered gallery | Passed for shipped patterns |
| Material Symbols | Six pinned local SVGs, semantic aliases, hashes, retained license and rendered icon evidence | Passed |
| Six integrated QA sources | 24 operational deduplicated rules; context plans and evidence-bearing reviews; six-source applied manual outcomes | Passed as original curated integration, not entire upstream engines/datasets |
| Source/CSS audit | JSX/TSX folders; parsed CSS/modules; tokens, scoped duplicates, inline distinctions, static references, baselines | Passed source tests; runtime uncertainties explicit |
| Broader guarded repairs | Four explicit-intent recipes; preview/apply/undo; tamper/stale/symlink/lock/limit/partial recovery | Passed tests and independent safety review |
| Configured app browser audits | Separate non-MUI fixture; axe/responsive/focus/motion; HTTP/origin/redirect policy | Passed real Chromium CI; not arbitrary business-journey certification |
| Visual/performance checks | PNG capture/compare/change/update; incomplete baseline withholding; overflow; navigation-time thresholds | Passed; byte metric explicitly unavailable, no fabricated pass |
| Agent/package interfaces | CLI, pack/fresh install/exports, official-SDK stdio MCP and root confinement | Passed Node 22/24 CI |
| Publication | Exact-main-commit CI-gated tag/tarball/checksum/browser-evidence release | Staged; not yet executed |
| User signoff | Review delivered scope, evidence, limits and published artifact | Pending user decision |

## Remaining release decision

After final exact-commit CI, an authorized maintainer may mark PR 4 ready and merge with a deliberate `[release]` message to publish this candidate. That does not constitute a formal PR approval or user signoff. RC-to-stable promotion requires a separately reviewed version change; the candidate label is not silently removed. No npm registry account/credentials are configured.

## Signoff checklist

- [x] Node tests, production build and fresh package install checks pass on recorded implementation commit.
- [x] Real desktop/mobile browser CI passes and artifacts were downloaded, checksum-verified and visually inspected.
- [x] Independent safety and rendered-review defects resolved with regression/evidence.
- [x] Applicable six-source manual outcomes recorded; not-applicable framework/brand/chart scope explicit.
- [x] Source/docs/notices/install behavior reviewed; no private downstream code/configuration included.
- [ ] Final metadata/documentation commit CI passes.
- [ ] Authorized merge and versioned artifact publication verified.
- [ ] User reviews the result and gives final signoff.

Automated findings, advisory review, scoped manual acceptance, publication and user signoff are different states. Nothing here certifies all interfaces, routes, frameworks, screen readers, browsers or users.
