# B.A.R 1.0.0 release candidate

Standalone BUILD + AUDIT + REPAIR toolkit: nine curated MUI patterns, semantic tokens, local licensed Material Symbols, six-source operational QA workflows, JSX/TSX and CSS audits, guarded explicit-intent repairs, manual-review replacement proposals, configured-route browser audits, CLI/library and read-only stdio MCP.

This is a **release candidate**, not user signoff or accessibility certification. Read RELEASE-ACCEPTANCE.md, IMPLEMENTATION-STATUS.md and the exact commit's CI for evidence and limits.

Install the attached tarball with `npm install ./ui-ux-design-bar-1.0.0-rc.1.tgz`; use Node 22 LTS 22.18+ or Node 24.11+. Verify SHA256SUMS before installing. `bar --help` lists commands. Browser audits require a separately installed supported Chromium (`npx playwright install chromium`). This GitHub release does not publish to npm.

Six-source integration is original curated guidance/workflows, not complete upstream engines/datasets. Source repairs require explicit author intent and inspected plans; arbitrary component substitution is not automatic. Browser checks cover only configured routes/states/viewports; manual review remains required. Byte-transfer measurement is unavailable under request interception and never counted as a pass. Keep screenshot/source reports private when auditing sensitive applications.

License: GPL-3.0-only; retain bundled third-party notices and license texts.
