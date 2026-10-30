# Publishing a versioned GitHub release

Publication requires explicit authorization and the final acceptance gates. A normal push, draft PR, or passing PR check does **not** publish a release.

The CI release job runs only for a push to this repository's `main` branch whose head commit message contains `[release]`, and only after both Node/package matrix jobs and the browser job succeed on that exact commit. A maintainer deliberately includes that marker in the authorized merge commit title/message after reviewing the acceptance report. Never include it accidentally.

The job uses only the short-lived repository `GITHUB_TOKEN`, with `contents:write` scoped to the release job. Checkout credentials are not persisted. No personal access token, external account or npm credential is configured. PR and other-branch jobs retain read-only permissions and cannot enter the release job.

It packs the tested checkout (lifecycle scripts disabled), computes SHA256SUMS and creates `v<package version>` targeting the exact tested main commit, attaching tarball, pack manifest, checksum and the exact run’s browser report/evidence ZIP. `-rc.N` versions are marked prerelease. The lightweight tag is atomically created and checked against the tested SHA; a pre-existing conflicting or annotated tag refuses publication. Existing release assets are never overwritten; a rerun with the same already-published version refuses. Increment the version for a genuinely new release. GitHub's source archive identifies the full corresponding source.

Before publishing: inspect `npm pack --json` contents, compare repository/tree and lockfile to the tested candidate, verify no private app files, record CI and manual evidence, and leave final user signoff explicitly pending until given. Promotion from RC to stable is a separate reviewed version change and gated publication, not a retroactive claim that candidate signoff occurred.

“No overwrite” is this workflow’s policy, not a claim that GitHub immutable-release protection is enabled. A failed publication may leave a tag or partial draft release. Inspect its target SHA, state and uploaded assets before taking a separately authorized recovery action; do not blindly retry, delete or replace it. A matching lightweight tag with no release can be reused only after the exact-SHA checks; a conflicting tag is always refused.
