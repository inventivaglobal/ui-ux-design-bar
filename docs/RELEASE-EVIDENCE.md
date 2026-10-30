# Standalone release evidence — 1.0.0

## Exact tested implementation

- Commit: `6b5ac383644e4dfb62b8c282c7de90c278b1b684`
- Tree: `4d290d40ed71a6c76b917af8fd33b21ea7ba450e`
- [CI run 41021829289](https://github.com/inventivaglobal/ui-ux-design-bar/actions/runs/41021829289): Node 22/24 engine and fresh package install/CLI/export checks passed; production build passed; **78 Node tests and 16 desktop/mobile Chromium cases passed**.
- [Browser artifact 12961971789](https://github.com/inventivaglobal/ui-ux-design-bar/actions/runs/41021829289/artifacts/12961971789), downloaded and checksum verified: `f28be033b0dc2f225f40fba89e588e023ee89122b88b8a742fb9e80b3b5df7c1`.
- Artifact contains the Playwright report, attached axe/contrast JSON and rendered PNGs. CI artifacts expire after 14days; the explicit release job additionally attaches the same release-run browser report ZIP durably to the GitHub release.

Subsequent documentation-only commits must still pass exact-commit CI. This record does not pretend a later commit was tested before its checks completed. The owner approved publication and final stable signoff on 2026-10-30. Promotion to 1.0.0 changes version/docs only; publication remains gated by exact main-commit CI.

## Actual rendered review and fixes

Desktop and mobile home, repair, gallery and dialog images were inspected, not inferred from green checks. Review found and fixed: transitional dialog screenshots, ambiguous bare clear icon, small practical targets and a persistent focus ripple reducing white-label contrast. Final repair screenshots are ripple-free with a visible focus outline; dialogs are opaque/readable and layouts remain unclipped at captured widths. Gallery clear-name action has adjacent visible wording. Browser assertions cover 44px gallery button targets, keyboard tabs, dialog forward/backward focus cycling, Escape/Cancel, focus restoration, repeated repair and reversal.

Final captured evidence in report `data/`:

- Repair desktop: `5fff284a9152050df0e5b255ad215f0ee34ba5b8.png`
- Repair mobile: `5e5f2dea6f8c6385bce9dde6c45c5b56c06ade18.png`
- Gallery dialog desktop: `3f56e959bd70d2aa0a59fc34fcba21eba1452bb3.png`
- Gallery dialog mobile: `8c7043c285de62f43ba683ffda682130168ebd6a.png`
- Gallery desktop/mobile: `d53c2e1196513a916c35c45b07b7119c4072f903.png`, `541b15b7488548a9b669256554b1921a386beb96.png`

Solid-color evidence (both viewports): saved/filled input and select text `#101828` on white **17.75:1**; dialog/focused repair button white on `#155EEF` **5.41:1**. Independent image/source review of field label `#475467` on white gives **7.69:1**. Computed-color checks fail unsupported opacity/gradient cases rather than silently certifying them. These are scoped color pairs, not a pixel-level or whole-product certification.

Axe reports zero detected violations in normal tested states; the deliberately broken repair fixture reports the expected image-alt violation, which clears after the actual repair. Axe incomplete records are retained: outlined-field/background-overlap uncertainty is reconciled only for the inspected solid-color pairs; modal background focus uncertainty is supplemented by explicit forward/backward focus-trap and restore tests. Empty fields do not establish contrast for all possible user text. No incomplete record is silently renamed an automated pass.

## Six-source operational/manual outcomes

| Integrated source | Applied workflow and observed outcome | Explicit limit |
|---|---|---|
| oil-ui | Hierarchy/content/optical review: home and repair make task and synthetic-data boundary clear; gallery controls and table readable on both widths. Accepted for demonstration scope. | No customer brand brief or live-product fitness claim. |
| daisyUI | Semantic foreground/background pair and rendered-contrast workflow applied to shared principles; measured pairs above accepted. | daisyUI component/theme-specific rules not applicable to this MUI fixture; no daisyUI runtime claimed. |
| Hallmark | Independent anti-pattern review caught ambiguous bare X and weak focus-state contrast; both corrected and final images reinspected. | Subjective critique remains advisory, not an automated taste score. |
| Impeccable | Hardening review exercised form errors, repeat actions, reset/cancel, keyboard trap/restore, repair reversal and evidence-backed minimal fixes. | Only recorded fixture journeys/states; no arbitrary business-flow certification. |
| Make Interfaces Feel Better | Wrapping, icon context, practical target size, focus visibility and animation interruption reviewed; settled captures and ripple-free focus verified. | No blanket animation/perceptual-quality guarantee. |
| UI UX Pro Max | Platform-fit/form/table/contrast workflow applied; desktop/mobile hierarchy and table semantics accepted for this example. | Charts absent, chart encoding checks not applicable; no full upstream search dataset or engine bundled. |

Each source is a pinned, licensed original concept integration with actionable rule/query/plan/review APIs, not merely attribution links. Manual outcomes are scoped observations; `recordReview` still marks caller-provided evidence unverified and does not issue certification.

## Safety and publication review

Independent code review found and verified fixes for semantic decorative-image/SVG conflicts (including lowercase/namespaced attribute variants), redirect-origin bypass, wrong CLI nested status, baseline writes on incomplete runs, unbounded folder output, and unavailable transfer-byte false passes. These have regressions. CSS remains report-only; component substitution remains a manual proposal.

Release workflow review verified read-only PR jobs, explicit main/[release] gating after tests, exact commit checkout/tag identity, no-overwrite policy, scoped ephemeral token and partial-failure documentation. The release job was correctly skipped on the PR. An actual release is not claimed until the main job and published assets are verified.

## Stable promotion authorization

After reviewing the tested candidate and its limits, the project owner explicitly approved publishing it and provided final signoff on 2026-10-30. Stable version 1.0.0 changes only package version/lock metadata and release documentation. The final PR and main CI must still run; the release tag and downloadable assets must be verified before reporting publication complete. No downstream application deployment or npm registry publication is implied.
