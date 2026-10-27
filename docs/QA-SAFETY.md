# QA and repair safety policy

B.A.R must not claim full accessibility or design quality from static checks alone.

## Severity and evidence
Every finding should include rule ID, severity, file, location, evidence and an explanation. Heuristic recommendations must not be described as deterministic failures.

## Safe changes
Repairs must preserve handlers, state, form behaviour, analytics, keyboard semantics and existing API contracts. Unknown intent (for example, the correct label for an icon-only control) requires user input or contextual evidence; do not invent labels.

## Verification
Run static tests, browser interaction checks, accessibility checks, responsive screenshots and regression tests where available. An unexecuted test is not a passing test.

## Licensing
Keep third-party dependencies external where practical, and audit licence terms and notices before copying source assets or skill instructions.
