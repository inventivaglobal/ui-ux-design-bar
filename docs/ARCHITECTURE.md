# Architecture — v0.2 draft

The hybrid approach consumes MUI as a dependency and layers curated design tokens, manifests, framework adapters, and QA tools on top. The six research skills are treated as attributed knowledge sources, not copied wholesale. Material Symbols are referenced by semantic aliases; assets are not bundled yet.

## Planned pipeline

`discover → retrieve → build/inspect → audit → match → repair → verify → report`

## Verification contract

A finding includes rule ID, target, evidence, severity, confidence, and suggested fix. Repairs must preserve business logic, require approval for risky changes, and pass relevant regression checks before being called verified.

## Status

These JSON files are initial schemas and example data, not a functioning component package or QA runner. Licence review, upstream version pinning, runtime implementation and tests are outstanding.
