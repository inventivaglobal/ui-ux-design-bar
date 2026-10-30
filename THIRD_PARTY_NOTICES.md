# Third-party notices

B.A.R code is GPL-3.0-only (LICENSE). Runtime dependencies are consumed as npm packages; their licenses remain in installed distributions. Exact dependency versions are recorded in package-lock.json.

- React, Emotion, MUI, Babel, PostCSS, selector/value parsers and the MCP SDK retain their upstream package licenses.
- Playwright and axe-core tooling retain their upstream package licenses; browser binaries are separately installed for tests.
- Six Google Material Symbols SVG assets are bundled under Apache-2.0 with pinned commit, individual hashes, upstream LICENSE and NOTICE under `packages/registry/icons/`. They do not imply Google endorsement.
- Six design-QA source snapshots and pinned commit references are listed in `packages/qa/sources.json` and `docs/QA-SOURCES.md`; original license texts are preserved under `packages/qa/licenses/`. B.A.R rules are original curated concept mappings, not complete upstream code/skill/dataset imports.

When redistributing the tarball, retain LICENSE, this notice, bundled asset/source notices and license files. No private downstream application code or configuration is included.
