# Folder auditing and explicit repairs (experimental)

This CLI workflow scans **local `.jsx` and `.tsx` files**, not running applications. It uses the existing bounded rules; it is not a complete accessibility audit, type checker, or general-purpose fixer.

## Review, apply, verify, undo

```sh
npm ci
node engine/cli.mjs audit ./src
node engine/cli.mjs preview ./src > /tmp/bar-plan.json
# Review the JSON plan: relative file, before/after source, hashes and edit diff.
node engine/cli.mjs apply ./src /tmp/bar-plan.json --yes
# Run your project's tests and inspect the actual rendered UI.
node engine/cli.mjs undo ./src JOURNAL_ID_FROM_APPLY --yes
```

`audit <file>` and `repair <file>` retain their earlier interfaces. `repair` is still preview-only. Folder `preview` also performs no writes. `apply` and `undo` require the literal `--yes`; the program does not infer approval. Never apply a plan you have not reviewed.

The consolidated JSON report includes relative paths, 1-based line/column, severity, evidence, `safe-opt-in` or `suggestion-only` repairability, parse/read errors and skipped symlinks. Findings remain machine-readable for an agent or future UI. Invalid JSX/TSX is explicitly reported as an analysis error rather than a clean result. Folder audit exits 0 when there are no high-severity findings/errors, 1 for high findings, and 2 for analysis/operation errors. Low/medium findings can still exist at exit 0. Preview exits 0 on successful generation even if its embedded report has unresolved findings: inspect that report. Analysis errors or resource-limit truncation refuse preview generation (exit 2).

Only the existing author-marked decorative-image transformation is applied. No new image intent or accessible labels are invented. Unknown intent and other rules remain suggestions. This stage adds a CLI/file workflow, not a folder-picker UI. The browser repair lab remains a non-writing preview.

## Boundaries and preservation

- Root must be an existing real directory without symlink ancestors. Paths are relative JSX/TSX files; absolute paths, traversal, symlink components, non-regular files and hardlinked files are refused for changes.
- Recursion skips `node_modules`, `.git`, `.bar`, `dist`, `build`, `coverage`, `playwright-report` and `test-results`. Symlinks are reported as skipped. This is not `.gitignore` support; choose a narrow source root. No imports or application code are executed.
- Sources must be valid UTF-8 and at most 2 MiB; BOM/CRLF and existing permission mode are preserved. Plans are tied to their canonical root. Content and expected repair are recomputed rather than trusting submitted replacement text or hashes.
- All target content is preflighted before the first change. Each file is rechecked immediately before same-directory atomic replacement. Apply refuses stale inputs; undo refuses later edits rather than discarding them. Undo is repeatable and accepts already-original files, including a partially applied batch.
- A private recovery journal is saved under `<root>/.bar/<id>.json` **before source changes**. It contains original and repaired source. Keep it private, do not commit it, and retain it until you no longer need undo. The journal is limited to 64 MiB; no source writes occur if the recovery record exceeds the limit. Apply also caps plans at 1000 files.
- This is not a multi-file atomic transaction. A filesystem error or interruption can leave a partial batch. The error includes the journal ID; inspect the files, then undo with that journal. Do not delete recovery evidence until resolved.
- `.bar/write.lock` prevents overlapping B.A.R writers, but not other editors. **Pause editors/watchers that modify source and use a trusted local workspace.** There is no hostile concurrent-process/TOCTOU security guarantee and no power-loss durability guarantee. Keep version control/backups. File ownership, ACLs and extended attributes are not preserved by replacement; do not use on files requiring those metadata guarantees.

## Crash recovery

A crash may leave `.bar/write.lock`. B.A.R never removes it automatically: a PID can be reused and another writer may still be active. Inspect the lock's PID/time and verify that no B.A.R write operation is running. Only then remove that one lock file manually. Inspect `.bar/*.json` for the relevant recovery journal and run `undo` with its ID. A crash during a temporary write can leave a `.bar-*.tmp` file next to a source file; inspect and remove that temporary file only after recovery. If the journal is damaged or a source has later edits, stop and recover with version control/manual review rather than forcing undo.

## Verification

`npm run check` runs the Node engine/filesystem/CLI suite, production example build and existing desktop/mobile browser suite together. Workspace tests cover traversal, symlinks/hardlinks, tampered plans, stale apply/undo, exact-byte round trips, syntax errors, write locks and explicit CLI confirmation. Browser tests verify the existing narrow repair, not arbitrary files supplied by a user. No lint/type-check pipeline or accessibility certification is claimed.

## Resource ceilings

Folder scans stop with `complete:false`, `truncated:true` and a `WORKSPACE_LIMIT` error at 10,000 visited entries, 1,000 source files, depth 32, 16 MiB aggregate source, 10,000 findings or 8 MiB report payload. Individual sources remain limited to 2 MiB. Preview refuses incomplete scans and plans exceeding 32 MiB; recovery journals remain limited to 64 MiB. Split large workspaces into smaller explicit roots. Limits are safeguards, not evidence that excluded or unvisited files passed.
