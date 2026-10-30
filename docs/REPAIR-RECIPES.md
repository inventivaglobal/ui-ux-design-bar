# Explicit-intent repair recipes

All recipes use parsed JSX/TSX and refuse ambiguous syntax, spreads and conflicting existing semantics. They add attributes only; they do not remove handlers, rename state, change routes, or invent user-facing copy.

| Marker | Eligible element | Added attribute |
|---|---|---|
| `data-bar-decorative="true"` | unlabelled nonsemantic `img` | `alt=""` |
| `data-bar-type="button"`, `"submit"` or `"reset"` | native `button` without type | exact `type` |
| `data-bar-label="Exact author wording"` | `button` or `IconButton` without label/title | escaped exact `aria-label` |
| `data-bar-decorative="true"` | static noninteractive shape-only `svg` subtree | `aria-hidden="true" focusable="false"` |

SVG descendants containing expressions, event handlers, titles, foreign objects or interactive elements are refused. Author markers remain in source. Duplicate/dynamic markers are not authorization. Existing meaningful semantics take precedence. These are broader bounded repairs, not general-purpose autonomous redesign or component replacement.

Use `repair` for returned source text, or folder `preview → inspect → apply --yes → project tests → undo --yes` for disk changes. Static `verified` means relevant static findings cleared, not browser/accessibility certification. Plans are not automatically applied by the browser runner or MCP adapter.
