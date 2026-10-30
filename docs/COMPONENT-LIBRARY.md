# Curated component library

BAR provides **nine curated patterns**, not the whole MUI catalog. All use the
installed MUI foundation rather than an independent widget implementation:

| Registry ID | React export | Caller responsibilities |
| --- | --- | --- |
| action-button | BarButton | label; real action handler; explicit submit type when needed |
| icon-button | BarIconButton | label and semantic icon; real action handler |
| text-field | BarTextField | visible label; name/state/validation as appropriate |
| select-field | BarSelect | visible label; options; controlled state or defaultValue |
| status-alert | BarAlert | meaningful message and appropriate severity |
| modal-dialog | BarDialog | title, open, onClose; content and action buttons |
| content-card | BarCard | title; appropriate headingLevel (h2 default) |
| tabs | BarTabs | label, items, controlled numeric value, onChange |
| data-table | BarTable | caption, unique column keys/labels, rows |

`packages/components/index.mjs` exports these components and `BarIcon`.
Import them directly from source or through the package's components export when
packaged. Standard MUI props/events pass through, except accessibility attributes
owned by the wrapper (e.g. dialog title association and icon-button name).
Components do not invent navigation, business actions, or form behavior. Buttons
are `type="button"` by default; callers can explicitly request `submit`. State
remains caller-owned. Empty required labels and invalid structural inputs throw.
Tabs render the active panel content only; applications needing persistent panel
state should use their own MUI composition. Tables intentionally have no sorting,
pagination, row selection or virtualisation. They are semantic static tables.

## Theme

`createBarTheme(overrides)` and `tokens` are exported from
`packages/tokens/mui-theme.mjs`. Wrap your app in MUI `ThemeProvider` and include
`CssBaseline` to activate the baseline reduced-motion rule. The adapter maps
semantic action/surface/text colors, 4px spacing, radius, focus outline and motion
values into a real MUI theme. Explicit caller theme overrides are supported;
custom palettes and overrides require their own contrast and focus verification.

## Generation and registry API

- `listComponents()` returns validated manifests with mandatory checks and
  replacement approval requirements.
- `validateManifest(manifest)` returns `{ valid, errors }`.
- `generateComponent(id, options)` from `packages/components/generate.mjs` returns
  `{ id, component, import, code, requiredBindings, replacementRequiresApproval }`.
  Generated props are JSON expressions, not raw JSX fragments. Event-handler and
  raw-HTML props are rejected. Dialog and tabs require real `onClose` / `onChange`
  bindings, listed in `requiredBindings`; these are deliberately not fabricated.
  The result is a starter snippet, not a complete app or safe automatic replacement.
  Supplied prop values still must satisfy the component's documented contract.

Existing application replacement always requires review of preserved handlers,
state, form semantics, ARIA/data attributes and behavior. A manifest is a checklist,
not evidence that every possible application use is accessible.

## Material Symbols

Six actual Material Symbols Outlined SVGs are bundled: home, close, delete,
warning, check_circle and search. Semantic aliases are in
`packages/registry/icons/semantic-icons.json`. `BarIcon` accepts either an alias
(e.g. `action.close`) or one of the bundled symbol names. It uses local SVG path
data, never a network font, remote fetch or text ligature. Icons default to
`aria-hidden`; standalone informative icons require a `label`. Interactive icons
belong in a named control such as `BarIconButton`. Unknown symbols fail explicitly.

Pinned source URLs, asset hashes, Apache-2.0 license and attribution are shipped
beside the assets. See `packages/registry/icons/NOTICE.md`. No claim is made that
all Material Symbols are bundled. Adding symbols requires the same provenance,
license and accessibility checks.

## Verification

`node --test tests/registry.test.mjs` checks all manifests, generated JSX parsing
(including hostile label text), real theme mapping, pinned asset integrity,
SSR labeling and semantic table/panel structure. Browser keyboard/focus and axe
checks must additionally run in the release suite; SSR does not prove focus trap,
keyboard behavior, contrast or correct application integration.

## Replacement proposals (report-only)

`suggestReplacements(report)` from `packages/registry/suggest.mjs` consumes a
static file/folder audit report's top-level `findings` array. It returns
`bar-replacement-suggestions-1` with `suggestions`, `unmapped`, `sourceComplete`
and counts. CLI integrations can present this as a review queue; it is **not**
an apply plan and cannot be passed to repair/apply.

Current mappings cover missing icon-button names, author-explicit control names,
explicit button types and redundant disabled semantics. These suggest the curated
button/icon-button manifest, not universal substitutions. Image-alt, CSS, unknown
rules and other unsupported findings remain explicitly unmapped. Existing
components may need only an attribute fix, not replacement.

Each proposal retains the supplied evidence/location, states candidate relevance
confidence (never safety confidence), unresolved intent, limitations, manifest
reference, mandatory checks and behavior-preservation checklist. All proposals
require manual review and approval; no names, handlers, patches or source changes
are invented. Incomplete/errored audit reports block proposal applicability.
`sourceComplete` means the supplied report did not declare a failure/truncation;
it does not independently verify that the report is authentic, current or complete.
The API never opens paths named in findings. It reads only BAR's packaged manifests.

Before accepting a proposal, inspect the current source, confirm the actual user
intent and behavior, retain event/state/form/ARIA contracts, then run browser
keyboard, visual and accessibility checks on the chosen implementation. The
suggestion API does not perform those checks or imply their success.
