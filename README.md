# UI/UX Design B.A.R

**BUILD + AUDIT + REPAIR** — a standalone toolkit for AI-assisted interface work.

**Release candidate in development, not signed off.** Implemented capabilities are listed below; final browser CI and release acceptance must pass before publication. No interface is certified by an empty report. [Acceptance matrix](docs/RELEASE-ACCEPTANCE.md) · [Status](docs/IMPLEMENTATION-STATUS.md)

## Build

Nine curated React/MUI patterns, semantic tokens/theme adapter, six locally bundled Material Symbols, validated component manifests and safe JSX starter generation. Components preserve explicit application callbacks rather than inventing business logic. [Library](docs/COMPONENT-LIBRARY.md)

## Audit

- Recursive JSX/TSX source findings; parser-backed image/repair selection.
- CSS/modules parsing, token namespaces, scoped duplicate candidates, static/dynamic inline styles, imported class references and comparable report baselines. Report-only: no CSS is rewritten.
- Configured HTTP(S) route browser audits with axe, viewport overflow, navigation-time performance budgets (byte measurements explicitly unavailable under request interception), exact-PNG visual baseline comparison, optional focus sampling and reduced-motion heuristics. Requires explicit target authorization acknowledgment. [Browser safety/config](docs/BROWSER-AUDIT.md)
- Six pinned, licensed research-source integrations consolidated into 24 actionable rules, context-aware BUILD/AUDIT/REPAIR plans and evidence-bearing review records. These are original curated workflows, **not wholesale upstream engines or search datasets**. Heuristic judgments stay advisory. [Source integration](docs/QA-SOURCES.md)

## Repair

Author-opted-in decorative image alt, exact control labels, native button types and noninteractive decorative SVG semantics. Unknown intent remains a suggestion. JSON preview, approved-transform validation, stale-file checks, journaled apply and undo. Manifest-backed replacement suggestions include evidence, confidence, preservation checks and mandatory manual approval; they do not emit executable substitutions. No automatic wholesale component substitution or business-logic changes. [Workflow](docs/FOLDER-WORKFLOW.md) · [Recipes](docs/REPAIR-RECIPES.md)

## Run

Node 22 LTS (22.18+) or Node 24.11+:

```sh
npm ci
node engine/cli.mjs --help
node engine/cli.mjs registry
node engine/cli.mjs qa-plan
node engine/cli.mjs qa-rules
node engine/cli.mjs audit ./src
node engine/cli.mjs audit-css ./src
node engine/cli.mjs preview ./src > plan.json
# Inspect the entire plan before an explicit apply:
node engine/cli.mjs apply ./src plan.json --yes
npm run dev:example
```

Example routes: `/`, `/?demo=repair`, `/?demo=gallery`. They use local in-memory state, not a production service.

`npm pack` creates an installable local tarball exposing `bar`, `bar-mcp`, and library exports. npm registry publication is separate and is **not claimed**. The optional stdio MCP adapter exposes only read/preview/source-generation tools within one configured workspace. [MCP](docs/MCP.md)

## Verify

```sh
npm test
npm run test:package
npx playwright install --with-deps chromium
npm run check
```

See exact-commit CI and [release checklist](docs/RELEASE-ACCEPTANCE.md). Browser tests include both the MUI demo and a separately hosted non-MUI fixture. No downstream application is a launch dependency.

## Licensing and safety

GPL-3.0-only; upstream notices and pinned provenance are included in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Never run browser audits against apps you are not authorized to exercise: even GET navigation, page scripts, screenshot lifecycle and keyboard/focus handlers can have side effects. Reports/screenshots may contain sensitive UI content. Keep artifacts private and review before sharing.
