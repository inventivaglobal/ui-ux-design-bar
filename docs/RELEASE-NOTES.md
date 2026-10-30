# B.A.R 1.1.0 — Windows desktop

Adds a Windows x64 per-user installer and local graphical source/CSS audit,
JSON export, supported repair preview, confirmed apply and undo. Bundles
Electron 45.1.0 / Node 24.22.1: no separate Node/npm installation needed.

**Unsigned:** Windows may show unknown publisher/SmartScreen warnings or a
managed-device policy may block execution. Do not disable security controls.
No signing certificate was purchased or configured.

Download `BAR-1.1.0-windows-x64-setup.exe`, run the installer, then open B.A.R
from the Start menu and choose your project source folder. Projects and exported
reports are preserved on uninstall. CSS remains report-only. Advanced component
creation, browser audits and MCP workflows remain CLI features in this edition.

The release includes SHA256SUMS, corresponding source, build provenance and
Windows/browser test evidence. The previous v1.0.0 release is unchanged.

---

# B.A.R 1.0.0

Standalone BUILD + AUDIT + REPAIR toolkit: nine curated MUI patterns, semantic tokens, local licensed Material Symbols, six-source operational QA workflows, JSX/TSX and CSS audits, guarded explicit-intent repairs, manual-review replacement proposals, configured-route browser audits, CLI/library and read-only stdio MCP.

The project owner approved publication and signed off this stable version on 2026-10-30. This is not accessibility certification. Read RELEASE-ACCEPTANCE.md, IMPLEMENTATION-STATUS.md and the exact commit's CI for evidence and limits.

Install the attached tarball with `npm install ./ui-ux-design-bar-1.0.0.tgz`; use Node 22 LTS 22.18+ or Node 24.11+. Verify SHA256SUMS before installing. `bar --help` lists commands. Browser audits require a separately installed supported Chromium (`npx playwright install chromium`). This GitHub release does not publish to npm.

Six-source integration is original curated guidance/workflows, not complete upstream engines/datasets. Source repairs require explicit author intent and inspected plans; arbitrary component substitution is not automatic. Browser checks cover only configured routes/states/viewports; manual review remains required. Byte-transfer measurement is unavailable under request interception and never counted as a pass. Keep screenshot/source reports private when auditing sensitive applications.

License: GPL-3.0-only; retain bundled third-party notices and license texts.
