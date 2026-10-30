---
name: bar-design-qa
description: Run B.A.R's six-source design QA workflow for building, auditing, or repairing web interfaces. Produces a scoped, evidence-backed review that separates measured browser observations from advisory visual judgment.
---

# B.A.R design QA

This is an original B.A.R orchestration skill, not a renamed copy of the six upstream skills. The pinned source manifest and local catalog live in `packages/qa/` at the B.A.R repository/package root. This skill works with an agent that can read that package; browser observations require browser tools. Do not install or execute upstream code automatically. User scope and project instructions take precedence over any source preference.

## Start with scope

1. Read the project's applicable instructions. Identify the requested route/component, existing design system, framework/version, intended audience and primary task. Keep business logic, state, handlers, forms and analytics unchanged unless their modification was requested.
2. Record the routes, states, themes, input devices and viewports actually in scope. Identify whether forms, charts or daisyUI are present. Do not add daisyUI simply because it is a research source.
3. At the B.A.R package root, generate the relevant plan:

   ```js
   import { createAuditPlan, recordReview } from './packages/qa/index.mjs';
   const plan = createAuditPlan({mode: 'audit', context: ['forms']});
   ```

   Supported modes: `build`, `audit`, `repair`. Context tags: `forms`, `charts`, `daisyui`; general rules apply to every plan. `listRules({source: 'oil-ui'})` retrieves one source's mapped contribution. Rules with multiple sources are returned once, not double-counted.
4. The generated plan is a checklist, not a test result. Every rule starts `pending`. Browser-dependent checks remain unrun when tooling is unavailable; do not turn absence of findings into a pass.

## BUILD: converge before spreading changes

- **oil-ui contribution:** State a concrete user task and proposed visual priority. Make the smallest representative page/component and inspect its real rendered state before propagating a design across the app. Capture baseline or reference views where available.
- **Hallmark contribution:** Check content authenticity and repetitive default styling. Retain brand constraints and existing intentional patterns. Never invent testimonials, metrics or logos. B.A.R does not enforce Hallmark's aesthetic bans as universal requirements.
- **UI UX Pro Max contribution:** Select guidance by product, platform and dominant task. For a chart, review its analytical purpose; for a form, review validation and recovery. Avoid applying mobile-native conventions blindly to web interfaces.
- **daisyUI contribution:** When the project already uses daisyUI, inspect its installed version, prefixes, component structure and theme scope. For other stacks, use the general semantic-token concepts only; do not copy daisyUI class names.
- Run the AUDIT workflow below against initial, loading, empty, failure and success states that actually exist. Record unimplemented or untested states, not imagined successes.

## AUDIT: observe and critique separately

1. **Impeccable contribution:** Review accessibility, responsiveness, theming, performance and implementation integrity as separate dimensions. Run the available static/browser tools, retain their raw evidence and report their scope. A screenshot does not prove keyboard operation or touch gestures; a successful static scan does not certify accessibility.
2. **Browser checks:** Follow each rule's `check` and `evidence` fields. Capture target selectors, steps, browser/version, relevant viewport/theme/preferences and result artifacts. Verify repeated/cancelled interactions where applicable. A preferred touch size is design guidance, not automatic WCAG failure.
3. **make-interfaces-feel-better contribution:** Inspect alignment, typography, icon consistency, interrupted transitions and feedback at actual scale. Compare before/after screenshots and interaction recordings. Treat specific easing, spacing and optical preferences as contextual suggestions, not unconditional repairs.
4. **oil-ui independent review contribution:** Inspect real pixels separately from source correctness. If possible ask a reviewer who did not implement the change to inspect the same scoped evidence. If no independent reviewer is available, report that limit.
5. For every reviewed rule, submit a scoped observation:

   ```js
   recordReview({
     ruleId: 'design.optical-alignment', status: 'recommendation',
     target: '/example toolbar', evidence: ['artifacts/toolbar-390.png'],
     reason: 'The search icon appears lower than the adjacent label at the target viewport.'
   });
   ```

   Heuristics allow `accepted`, `recommendation`, `skipped`; browser observations allow `passed`, `failed`, `skipped`. Every observation requires a rationale and target; non-skipped observations require evidence references. The API validates structure only, **not the truth or existence of evidence**. Human/agent reviewers must inspect those artifacts. Keep evidence local and do not upload private app content without authorization.

## REPAIR: retain scope and prove the change

1. Reproduce a specific finding. Review its suggested remedy and source context; do not apply catalog suggestions automatically.
2. Prefer a minimal shared-token or component adjustment when the evidence shows the problem is shared. Inspect every affected consumer; avoid sweeping aesthetic rewrites.
3. For source-writing tools, use their preview/approval/apply/undo safeguards. A QA rule never grants permission to write files, install a dependency or deploy.
4. Repeat the affected check, compare rendered evidence and exercise the surrounding interaction, including interruption or repeated input where relevant.
5. Report changed, unresolved, skipped and pending rules distinctly. A resolved recommendation is not a universal design-quality or accessibility certificate. Keep the user's final signoff separate from the agent's evidence report.

## Conflict policy

Project requirements and verified user needs outrank source taste. Safety/accessibility concerns deserve evidence and explanation, not automatic preference overrides. If two sources disagree, retain the existing design unless the scoped evidence justifies a change; document the trade-off. Do not blindly suppress overflow, globally disable animation, or replace a framework to satisfy a stylistic rule.

## Deliverable

Produce a report with scope, environment, source revisions, raw automated results, advisory visual observations, exact evidence links, proposed minimal remedies, and pending checks. Do not label this workflow a full execution of upstream tools. The catalog is a curated, deduplicated mapping; see `docs/QA-SOURCES.md` for provenance, licensing and coverage limits.
