# Implementation status

## Implemented (experimental)

- Dependency-free CLI for generating an MUI button template.
- Conservative static checks for unnamed MUI IconButton and images without alt text.
- Structured JSON findings with source line and severity.
- Repair operation that intentionally makes no unsafe changes and reports unresolved findings.
- Node test cases covering these operations.

## Not implemented

- Full AST analysis, browser checks, accessibility tree evaluation, screenshot regression, responsive QA, performance testing, automatic repairs, full component registry integration, actual Material Symbols asset integration, all six upstream skill rule imports, plugin packaging, CI, and verified production releases.

## Run

```sh
node --test tests/engine.test.mjs
node engine/cli.mjs build "Save"
node engine/cli.mjs audit path/to/Component.jsx
node engine/cli.mjs repair path/to/Component.jsx
```

Static regex-based checks are intentionally limited and may produce false positives. Do not claim an interface is accessible based on these checks alone.
