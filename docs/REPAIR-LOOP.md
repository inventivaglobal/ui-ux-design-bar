# First complete repair loop (experimental)

This is deliberately **one proven local transformation**, not a general automatic designer.

## What runs

1. BUILD generates the MUI button used in the card.
2. A checked-in JSX fixture adds a decorative circle with explicit author intent, but deliberately omits `alt`.
3. AUDIT reports `a11y.image-alt` with source position and `fixable: true`.
4. REPAIR parses the JSX and inserts ` alt=""` after the intrinsic `img` tag name. The result includes the source, exact edits, line evidence, remaining findings and a static re-audit.
5. Build-time generation renders both the original and the actual repaired source in the lab. The UI is a preview toggle, not an in-browser source editor.
6. Playwright/axe checks the broken and repaired rendered states in desktop and mobile Chromium. The test expects exactly the known image-alt violation before, and none of the scanned violations after.

## Explicit contract

The only eligible marker is a single literal `data-bar-decorative="true"` on an intrinsic lowercase JSX `img`. This is an author declaration, **not an inference** from the picture. Do not add the marker to meaningful images to silence an audit.

The engine refuses to change an image with any existing `alt`, JSX spread, `role`, `aria-label` or `aria-labelledby`. Dynamic markers, component images and invalid/unsupported syntax are not repaired. `analysis.imageSyntaxParsed` reports whether image syntax analysis succeeded; false must not be treated as a clean audit. Other unresolved findings are preserved. Comments, string literals and template text are not image elements.

An existing label is never overwritten. Informative images require a human-written description. The parser handles JSX and TSX modules or standalone JSX fragments; this is not a general HTML parser. Other existing rules remain regex heuristics.

## Preview, review and reversal

```sh
npm ci
node engine/cli.mjs audit tests/fixtures/repair/decorative-card.jsx
# Expected exit code 1: this is intentionally broken.
node engine/cli.mjs repair tests/fixtures/repair/decorative-card.jsx
# JSON preview only; the input file is not modified.
npm run dev:example
# Open /?demo=repair at the printed local URL.
```

Each edit uses offsets in the **original** source. Apply multiple edits from the end to avoid shifting offsets. The returned repaired source is the easiest review artifact. Keep the original source or use version control to revert; repeated REPAIR is idempotent. The lab's restore control only changes its local rendered preview.

## Combined verification

```sh
npx playwright install --with-deps chromium
npm run check
```

Node tests cover refusal conditions, non-code text, multiple edits, idempotence and reversal. Browser tests cover the real generated output, before/after axe evidence, keyboard toggle, repeated repair and navigation. Existing form tests remain in the same run. GitHub CI uploads the HTML report, axe JSON, screenshots and failure traces.

The API's `verified` field is a **static** re-audit; `verification.browserVerified` is always false because calling REPAIR does not launch a browser. Only a passing browser run for the exact generated source adds that evidence. No lint/type-check pipeline, full accessibility certification, screen-reader evaluation or arbitrary-site repair is claimed.
