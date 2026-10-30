# Architecture

`discover → retrieve → build/inspect → audit → propose → preview → approve → apply → verify → report/undo`

MUI remains an external dependency, not a fork. `packages/components` provides nine curated wrappers and safe starter generation; `packages/registry` provides validated manifests and pinned local icon assets; `packages/tokens` adapts semantic tokens to MUI.

`packages/qa` consolidates six upstream knowledge sources into original, deduplicated rules and executable plan/review APIs. It does not run upstream installers, copy entire engines, or convert subjective design review into automatic passes.

`engine` owns JSX/TSX and CSS source analysis, guarded transformations and workspace journals. `browser-audit.mjs` audits explicit authorized routes, keeps network policy failures visible, and compares screenshots only against explicitly managed baselines. CLI and read-only stdio MCP adapt these APIs. Browser artifacts are separate from source mutation.

Repairs preserve source bytes outside exact approved edits; apply verifies source hashes and the expected transformation. Per-file atomic writes do not imply an all-files transaction. The journal supports interrupted recovery. Runtime behavior is not proven by static repair; project tests and manual review remain required.
