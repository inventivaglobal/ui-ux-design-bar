# UI/UX Design B.A.R

**BUILD + AUDIT + REPAIR** — a unified design intelligence, component library, and quality-assurance system for AI coding agents.

> **Status: experimental / pre-alpha.** A small CLI and runnable MUI browser example are implemented. General-purpose audits, source integrations and automatic repairs remain unfinished; nothing is certified. See [implementation status](docs/IMPLEMENTATION-STATUS.md) for commands and verification limits.

## Mission

- **BUILD:** choose coherent design tokens, accessible components, icons, patterns, and layouts.
- **AUDIT:** inspect code and rendered interfaces for accessibility, responsiveness, consistency, interactions, and visual quality.
- **REPAIR:** propose safe fixes or component replacements, preserve application behaviour, and verify results.

## Architecture

1. **Foundation:** Material UI as an upstream dependency, extended through our own curated component registry and semantic token layer. Prefer an adapter over maintaining a permanent full fork.
2. **Icon intelligence:** Google's Material Symbols / Material Design Icons with semantic aliases, consistency checks, and accessibility guidance.
3. **Design intelligence:** consolidate overlapping guidance from six projects into provenance-tracked, context-aware QA rules.
4. **Execution:** agent-facing skill and optional tool/MCP interface for retrieval, browser checks, source transformations, and regression verification.

## Research sources

- [oil-ui](https://github.com/oil-oil/oil-ui) — design exploration and visual comparison.
- [daisyUI Skill](https://daisyui.com/docs/skill/?lang=en) — component and framework knowledge.
- [Hallmark](https://github.com/Nutlope/hallmark) — anti-pattern detection and independent review.
- [Impeccable](https://impeccable.style/) — critique, polish, and hardening operations.
- [Make Interfaces Feel Better](https://github.com/jakubkrehel/make-interfaces-feel-better) — micro-interactions and visual details.
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — design references and platform-aware guidance.
- [Material UI](https://github.com/mui/material-ui) — component foundation.
- [Material Design Icons](https://github.com/google/material-design-icons) — icon source.

These are **research references, not imported source or bundled skill rules**. The browser example installs Material UI, React and Emotion as external npm dependencies; it does not copy their source into this repository. Their respective licences and asset terms must be reviewed before copying or redistributing material.

## Initial delivery milestones

1. Curated token schema, MUI adapter, component and icon manifests.
2. Deduplicated QA rule catalogue with source attribution and severity.
3. Browser, accessibility, interaction, responsive and screenshot audit runner.
4. Safe replacement pipeline with test gates, rollback and evidence-based reports.

## Quality policy

Do not claim a component is verified without passing tests. Do not silently rewrite business logic. Distinguish deterministic failures from heuristic design suggestions. Prefer small, reversible changes.

## Repository

Public home: https://github.com/inventivaglobal/ui-ux-design-bar
