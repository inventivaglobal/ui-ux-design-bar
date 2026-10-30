# Full standalone release acceptance

Candidate: **1.0.0-rc.1**. Stable release/tag and user signoff remain pending. Downstream application work is excluded from pre-launch dependencies. This matrix defines implemented roadmap coverage, not universal automatic UI quality.

| Roadmap capability | Functional evidence | Acceptance state |
|---|---|---|
| Curated component/token library | Nine manifests/wrappers, theme adapter, safe generator, evidence-bearing non-mutating replacement suggestions, SSR/escaping tests; interactive gallery | Node passed; browser CI pending |
| Material Symbols | Six pinned SVG assets, semantic aliases, hashes and licenses | Node passed; rendered gallery pending |
| Six integrated QA sources | 24 deduplicated operational rules, context plans, strict evidence records, skill workflow | API tests passed; scoped manual application below remains pending |
| Source/CSS audit | JSX/TSX folder scans; parsed CSS/modules; tokens/duplicates/inline distinctions/static refs; baseline comparison | Node passed, final combined rerun required |
| Broader safe repair pipeline | Four author-opt-in recipes; preview/apply/undo; tamper/stale/symlink/lock/partial-recovery tests | Node passed; final safety review and browser repair case required |
| Arbitrary configured app audits | Separately hosted non-MUI fixture; HTTP/origin policy, redirect zero-arrival regression | Browser CI pending |
| Visual/responsive/performance | PNG capture/compare/change/update tests; overflow + viewport checks; configured budget violations | Browser CI pending; not screenshot-only |
| Agent/package interfaces | CLI, pack/install/export smoke, SDK stdio MCP/root-confinement tests | Passed locally; final CI required |
| Publication/signoff | Exact remote commit CI, notices, release artifact/checksum, final review | Pending; npm registry not authorized/configured |

## Six-source operational acceptance

All sources have pinned official revisions and retained license texts (see QA-SOURCES). `listRules({source})` selects executable review requirements; `createAuditPlan` maps BUILD/AUDIT/REPAIR plus context; `recordReview` validates scoped observations without pretending caller evidence was verified. These are actual integrated workflows, not link collections. No entire upstream engine/search dataset is shipped.

| Source | Operational rules/workflow examples | Automated contract evidence | Manual rendered review outcome |
|---|---|---|---|
| oil-ui | task hierarchy, authentic content, optical alignment, independent visual review | Source-specific queries and context plans | Pending gallery screenshots + product-context critique |
| daisyUI | semantic foreground/background pairs, rendered contrast, daisyUI component/theme contract | Context filtering includes daisyui only when relevant | Framework-specific contract not applicable to MUI fixture; paired-token contrast review pending |
| Hallmark | repeated-pattern critique, focus/motion, hierarchy and authenticity | Deduplication/provenance and advisory-only statuses | Pending independent gallery critique |
| Impeccable | hardening/repair plan, form errors, control names, motion interruption, empty/error states | Repair-mode plans and evidence requirements | Pending rendered gallery/form states |
| Make Interfaces Feel Better | optical alignment, wrapping, icon consistency, touch targets and interruption | Actionable rule/evidence/remediation fields | Pending mobile/desktop screenshots and interaction results |
| UI UX Pro Max | platform fit, data encoding, contrast, loading stability and component semantics | Context-sensitive charts/forms rules | Chart-specific checks not applicable to gallery; table/control review pending |

No pending row is a pass. Manual judgments remain advisory and require scoped rationale/evidence. Publishing requires completing applicable rows, retaining legitimate not-applicable reasons, and describing omissions precisely; it does not require testing a downstream application.

## Release gate checklist

- [ ] All final Node, package and build checks pass on exact candidate commit.
- [ ] Browser CI executes successfully; artifacts retained and inspected (not merely configured).
- [ ] Independent safety review issues resolved with regressions.
- [ ] Six-source applicable manual review outcomes recorded against actual rendered evidence.
- [ ] README/status/notices/install instructions match shipped behavior.
- [ ] Public branch/PR contents contain no private application code or configs.
- [ ] Authorized merge/release actions completed with verified remote commit and versioned artifact.
- [ ] User receives evidence and makes final signoff decision.
