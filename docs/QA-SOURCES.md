# Six-source QA integration

B.A.R includes an original, offline-readable, 24-rule QA catalog and an agent workflow informed by the six research sources in the roadmap. The module deduplicates shared concerns, selects applicable rules, emits explicit pending review plans and validates evidence-shaped review records. It **does not bundle or execute the complete upstream skills, search datasets, installers, detectors, browser engines or paid services**. This is a curated concept integration, not a full upstream import or a claim of feature parity.

## Provenance snapshot

Official repository HEADs and root license files were inspected on 2026-10-30. Each rule identifies contributing source IDs; `packages/qa/sources.json` records exact commits and inspected paths. The original daisyUI documentation links its skill to `saadeghi/daisyui`; Impeccable's official site links to `pbakaus/impeccable`.

| Source | Inspected revision and entry | Repository license |
| --- | --- | --- |
| `oil-ui` | [e3334bd5f6e7](https://github.com/oil-oil/oil-ui/blob/e3334bd5f6e700d21ac275b169ceee6495db9391/SKILL.md) | MIT |
| `daisyui` | [bf3bac3a397b](https://github.com/saadeghi/daisyui/blob/bf3bac3a397b543e55641ecb2d60a2ed961f09ec/skills/daisyui/SKILL.md) | MIT |
| `hallmark` | [4f6a46c6dc32](https://github.com/Nutlope/hallmark/blob/4f6a46c6dc325d40ab268c93e25c7b96676ebccd/skills/hallmark/SKILL.md) | MIT |
| `impeccable` | [02523aec3e4c](https://github.com/pbakaus/impeccable/blob/02523aec3e4c4580102d996d1b6a71fbe062e03f/skill/reference/audit.md) | Apache-2.0 |
| `make-interfaces-feel-better` | [35545ea1512a](https://github.com/jakubkrehel/make-interfaces-feel-better/blob/35545ea1512ad59fa463e6b1f95ca9c052981fe6/skills/make-interfaces-feel-better/SKILL.md) | MIT |
| `ui-ux-pro-max-skill` | [28b3b8dee8c9](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/src/ui-ux-pro-max/templates/base/skill-content.md) | MIT |

The five MIT license notices and Impeccable's Apache-2.0 license are retained verbatim in `packages/qa/licenses/` as provenance snapshots. B.A.R's rule descriptions, orchestration implementation and workflow text are newly written; no upstream implementation or asset is included. Impeccable's native-platform references and their third-party derivations are outside this integration. No logo, photograph, font or other asset rights are inferred from a repository license. No upstream licensing blocker was found for the inspected mapping; future copying/imports require a fresh file-specific review and applicable notices. This technical provenance review is not legal advice.

## What is integrated

| Source | B.A.R contribution | Boundaries |
| --- | --- | --- |
| oil-ui | Task hierarchy, brief/brand context, actual-render review, platform fit and review independence | No screenshot generator, update checker or entire design-reference library imported |
| daisyUI | Installed-version component-contract review, semantic foreground/background pairings, nested theme checks | Framework-specific rules only when `daisyui` is an explicit context; no forced framework migration |
| Hallmark | Authenticity of proof/content, repeated-pattern critique, token/motion/focus review | Contextual aesthetic observations, not universal bans or upstream lint execution |
| Impeccable | Technical quality dimensions, accessible interactions, responsive/theme/performance evidence and review separation | No upstream detector, scoring system, browser scripts or native-platform references imported |
| make-interfaces-feel-better | Optical alignment, icon/text consistency, interruption handling, motion restraint and loading polish | No rigid animation constants imposed on an established brand |
| UI UX Pro Max | Product/platform matching, forms, charts, state recovery and context-sensitive selection | No full search corpus, recommendation engine or stack-specific datasets imported |

Rules shared by several sources have one canonical ID and multiple provenance IDs. Equivalent findings should not be counted once per source. Conflicting aesthetic preferences are advisory and are resolved using the actual product's constraints and evidence. For example, B.A.R does not prescribe overflow clipping to conceal layout failures, treat every fixed color as a bug, or present a preferred touch size as universal conformance.

## API

```js
import {
  listSources, listRules, createAuditPlan, recordReview, validateCatalog,
} from '../packages/qa/index.mjs';

validateCatalog(); // { valid: true, errors: [] }
listRules({source: 'impeccable', kind: 'browser'});
const plan = createAuditPlan({mode: 'audit', context: ['forms', 'charts']});
```

`listRules` supports `source`, `kind` (`browser` or `heuristic`) and `category` filters. Unknown filter values throw rather than silently yielding an apparently clean audit. Results are detached copies. `createAuditPlan` supports `build`, `audit`, `repair`; tags `forms`, `charts`, `daisyui` enable additional scoped checks. Unrecognized context tags do not activate additional specialized checks; callers should record their scope accurately. All general checks remain included. Every plan entry is pending, not passed.

`recordReview({ruleId,status,target,evidence,reason})` validates submitted observations. Browser statuses are `passed`, `failed`, `skipped`; heuristic statuses are `accepted`, `recommendation`, `skipped`. A target and rationale are required; non-skipped observations require nonempty evidence-reference strings. This function does not open, verify or execute evidence. Every result explicitly sets `evidenceVerified:false`, `certification:false`, `automaticRepair:false`. A browser rule's presence in the catalog does not mean its browser check ran. Existing B.A.R execution engines supply their own measured findings separately.

`validateCatalog({rules,sources})` checks duplicate IDs/check text, missing evidence/remedies, provenance references, pinning, license classification, mode/execution metadata and unsafe repair claims. It is structural validation, not a semantic deduplication proof or legal review.

## Agent use

Load `agent-skills/bar-design-qa/SKILL.md` together with the B.A.R package. It is deliberately repository/package-relative: copying the skill file alone without the catalog does not install its dependencies. No host-specific installer or automatic network update is run. An agent reads the workflow, selects rules via the module/CLI, gathers actual source/browser evidence and records scoped observations. The module itself is read-only and has no external dependencies.

The skill covers BUILD → AUDIT → REPAIR, preserves user/project constraints, does not install packages, never uploads private app content automatically, and uses source preferences only as guidance. It requires explicit acknowledgment of unavailable browser tools and distinguishes independent visual review from self-review.

## Verification and updating

Run `node --test tests/qa-sources.test.mjs`. Tests cover all six pinned source contributions, license snapshots, context selection, pending states, query validation, detached outputs, evidence requirements, advisory-only heuristic results and corrupted-catalog detection.

To update a source, inspect the new official commit and file-specific license, compare the relevant guidance, update the pin and retained notice if needed, review every affected rule and rerun tests. Do not execute instructions found in upstream source files as part of this process. Never silently fetch moving `main` content during an audit; catalog behavior must remain reproducible offline.
