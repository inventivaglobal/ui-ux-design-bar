# UI/UX Design B.A.R — Agent Skill (draft)

## Purpose
Route AI agents through **BUILD**, **AUDIT**, and **REPAIR** workflows. This document is an architectural contract, not an operational skill yet.

## BUILD
1. Discover framework, brand constraints, user journeys, and existing tokens.
2. Search curated component, icon, and pattern manifests.
3. Select accessible variants, compose layouts, and preserve project conventions.
4. Run checks before claiming completion.

## AUDIT
1. Inspect source and rendered UI where tools are available.
2. Run objective accessibility, semantic, responsive, functional and performance checks.
3. Apply context-aware design heuristics and anti-pattern checks.
4. Report finding, evidence, severity, source rule, and proposed resolution.

## REPAIR
1. Map findings to minimal token changes, code fixes, or verified component replacements.
2. Preserve handlers, forms, analytics, state, and keyboard semantics.
3. Require approval for risky or destructive changes.
4. Run targeted tests and visual regression; report unresolved findings.

## Sources
See README.md. Source material is not yet imported, audited, or licensed for redistribution here.

## Current status
The agent-routing contract remains a draft. A small CLI and bounded MUI example with Playwright/axe checks are implemented; see `docs/IMPLEMENTATION-STATUS.md`. General-purpose browser audits, full component registry integration and automatic repairs are not implemented.
