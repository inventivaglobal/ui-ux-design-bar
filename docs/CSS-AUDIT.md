# CSS source audit (experimental, report-only)

`node engine/cli.mjs audit-css ./project --config css-profile.json`

This separate audit profile adds source-level CSS and class-reference analysis without changing the existing image repair engine. It never applies CSS fixes. Exit status is 0 for no warnings, 1 for review warnings, and 2 for input/parse/discovery errors. JSON includes each issue's file, line, column, severity, evidence and `repairable: false`.

## Configuration version 1

```json
{
  "version": 1,
  "roots": ["src", "styles"],
  "exclude": ["src/generated", "historical"],
  "tokenNamespaces": ["--brand-", "--space-"]
}
```

Run against a trusted, stable local checkout. Roots are relative to the supplied directory. Exclusions are literal paths (prefix matches) or directory basenames, not globs. Built-in exclusions: node_modules, .git, .next, dist, build, coverage and .bar. Symlinks are skipped with an error; roots cannot traverse symlinks. Files over 2 MiB, over 32 MiB total source, scans beyond 5,000 source files or 20,000 filesystem entries, and more than 10,000 findings produce errors. This is not a sandbox for concurrently hostile filesystem mutations.

Files: .css, .js, .jsx, .ts, .tsx. CSS is parsed with PostCSS, selectors and values with their respective parsers, and JS/TS with Babel. No project configuration, plugins or source code is executed. Sass/Less, framework compilation and generated CSS are not interpreted. Tailwind directives are parsed as source at-rules, not expanded. Namespace prefixes are optional policy checks, not proof a token exists; specify framework/vendor prefixes or omit the policy if not known. Scope configurations per app when token contracts differ.

## Findings

- Exact declaration repetition within a rule and exact repeated selectors/declaration blocks in matching ancestor contexts. These are review candidates: cascade order, fallbacks and intentional duplication can make removal unsafe. Nested blocks are not flattened. No cross-file deduplication claim is made.
- CSS custom-property definitions and `var()` references outside configured namespace prefixes.
- Static object-literal inline styles versus dynamic inline styles. Dynamic values may be legitimate (e.g. data-driven dimensions) and are informational. No inline style is automatically extracted.
- Static CSS Module member references, including bracket string keys, against relative imported modules present in the scan. Lexical scope distinguishes local variables from imports. Unavailable aliases, dynamic keys and composition/unsupported selectors remain uncertain. Global utility classes and dynamically assembled className strings are not declared unused or invalid. Generated module export naming transformations require human review. Destructured module exports and named imports are not analyzed.

The parser cannot infer application-wide standards from source alone. Configure authoritative standards after the source cleanup lands. No default client rules or private application source are included.

## Baseline comparison

Save a prior JSON report, then use `--baseline prior-report.json` with identical configuration. Fingerprints include path, rule, semantic evidence and repeated occurrence ordinal, excluding source line positions. Reports classify findings as new, persisting or not observed; “not observed” is not proof of a fix. Any source/discovery error makes the comparison incomplete. A baseline with a different profile is rejected. Moving files or changing evidence creates new findings.

## Handoff and verification

1. Confirm the finished source commit, scan roots, app boundaries and token policies.
2. Run the source-only report in a separate Node 22 LTS (22.18+) or Node 24.11+ runner; keep reports containing private source evidence private.
3. Review unknowns, exceptions and duplicate candidates with the maintainers.
4. Independently test rendered pages in an approved isolated environment, including runtime/published CSS overrides, responsive breakpoints, keyboard flows and reduced-motion preferences.

Existing demo browser tests do not validate arbitrary target applications. This feature does not alter CSS, extend apply/undo to CSS, certify accessibility, assess visual equivalence or authorize deployments.
