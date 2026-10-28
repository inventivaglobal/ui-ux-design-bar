# Implementation status

## Implemented (experimental)

- CLI for generating an MUI button template.
- Conservative static checks for unnamed MUI IconButton and images without alt text.
- Structured JSON findings with source line and severity.
- One AST-selected repair: add empty alt text only to an image explicitly marked `data-bar-decorative="true"`, without spreads, semantic overrides or existing alt. Returns edit evidence and unresolved findings; the repair API remains preview-only; the explicit folder CLI apply/undo workflow writes only reviewed bounded changes.
- Node tests and CI for the engine and JSON manifests.
- A runnable, client-only MUI example using the repository's semantic tokens and actual BUILD output.
- Playwright browser checks for desktop and mobile Chromium, with axe WCAG A/AA scans, keyboard interactions, validation, duplicate-save disabling, reset confirmation, cancellation and focus restoration.
- Browser CI configuration and downloadable HTML report, axe evidence, screenshots and failure traces. Added tests are not proof of a passing run; inspect the CI result for the exact commit.

## Not implemented

- General-purpose browser audit of arbitrary applications, full AST analysis, full accessibility tree evaluation, screenshot baseline regression, broad responsive QA, performance testing, general-purpose automatic repairs, full component registry integration, actual Material Symbols asset integration, all six upstream skill rule imports, plugin packaging, and verified production releases.

The example is a bounded integration test, not a finished B.A.R audit engine. It uses in-memory state only; no backend, account or persistence is involved.

## Run the engine

```sh
npm ci
npm test
node engine/cli.mjs build "Save"
node engine/cli.mjs audit path/to/Component.jsx
node engine/cli.mjs repair path/to/Component.jsx
```

## Run the MUI browser example

Node 22.12+ and npm are required. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev:example
```

To build and verify the production example:

```sh
npx playwright install --with-deps chromium
npm run check
npx playwright show-report
```

`npm run check` runs the engine tests, generates the example button and before/after repair fixtures, builds the app, then runs browser tests against the production preview. Playwright starts and stops its own server at `127.0.0.1:4173`; that port must be free. For an existing compatible Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its absolute path. Otherwise Playwright uses its managed Chromium.

Reports are written to `playwright-report/` and `test-results/` (ignored by git). Screenshots are inspection evidence, not visual regression baselines. The CI job uploads these reports even on failure.

## Verification limits

Non-image static checks still use regex and may produce false positives. Image detection uses a JSX/TSX parser, not runtime component resolution; invalid or unsupported source is not repaired and may have no static image findings. An empty audit result is not a clean bill of health. Automated axe checks cover only detectable issues in the tested states. Manual screen-reader testing, additional browsers, zoom, reduced motion and broader user journeys remain outside this example's coverage. Do not claim an interface is accessible or certified based on these checks alone.

No lint or type-check pipeline is configured yet; the example uses JavaScript/JSX, not TypeScript.

## First repair loop

The repair lab (`/?demo=repair`) uses the real BUILD output and REPAIR output. Browser tests require the broken fixture to produce exactly one `image-alt` axe violation, and the repaired state to have none of the scanned violations. They cover desktop/mobile layout, keyboard toggling, repeated repair, reversal and Back navigation. Run results are commit-specific; see CI, not this document, for pass/fail evidence. Details: [repair contract](REPAIR-LOOP.md).

## Folder workflow

Recursive JSX/TSX audit reports, JSON repair previews, explicit apply/undo and recovery journals are implemented. See [folder workflow](FOLDER-WORKFLOW.md) for boundaries, stale-file safeguards, partial-failure recovery and metadata limitations. This does not add new repair rules or an arbitrary-app browser audit.
