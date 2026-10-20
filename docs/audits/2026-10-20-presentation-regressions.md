# Mörk Borg presentation regression review

Date: 2026-10-20. Active scope: [ADR-0002](../adr/0002-preserve-module-presentation.md).

## Provenance and scope

- Reviewed release: `84a2cc0`, module 0.9.0; alignment merge `48d0f16`.
- Visual reference: `8cde351`, module 0.8.3. Compare executable UI and styles,
  not the old ADR's passing test totals.
- Repair branch: `fix/restore-module-presentation`, authorized by the user.
- Isolated host/toolchain: Core 0.19.5 at `f195246a`. The module checks use that released host; Core subsequently received a separately authorized repair branch for stylesheet caching and player startup. D&D remains untouched.
- Inventory: all 21 changed/added/deleted paths under `src/ui`, `module/ui.tsx`,
  styles and assets since the reference. Unchanged Background, theme and chat
  components were inspected as context; all sheet tabs are rendered.

The user reported an unusable/unstyled Factory. Source comparison confirms
removal of its palettes, tilted panels, preview layout and controls. The first packaged fixture disabled browser caching and did not emit repeated
healthy connection heartbeats. It therefore missed the subsequent operator
failures. Those limitations are corrected explicitly below; the first passing
fixture results were not acceptance of the operator experience.

## Findings and corrections

| ID | Finding | Correction / retained behavior |
| --- | --- | --- |
| MB-UI01 | The Factory was replaced by a plain page; five palettes, cut-paper cards, dice control and selection controls disappeared. | Restore module-owned presentation, responsive preview/stat panels, Select All/Clear All, dashboard return and cosmetic palette changes. Preserve current server candidate/recovery calls. |
| MB-UI02 | Forms were flattened during consolidation into `MorkBorgRollFrame`. | Restore tilt, texture, heavy border, shadow, headings and skull close icon in the shared frame; retain top-layer/focus/shared-content behavior. Restore tabs and action styling in Item, Add Item, SCVM, rest and roll forms. |
| MB-UI03 | `font-morkborg` had no definition; sheet labels contained literal `$"font-imfell"` / `$"font-inter"` class names. | Define the module font and repair class tokens. The malformed sheet classes predate the alignment merge; this is a discovered pre-existing defect, not attributed to that release. |
| MB-UI04 | Desktop navigation exceeded the 768px viewport. | Keep all four controls on one row with four equal grid columns and responsive typography. The first wrapping repair was rejected; the corrected check covers 640/768/1024/1280/1920px. |
| MB-UI05 | Newly added Omens/powers/defense/damage actions lacked consistent button treatment. | Shared module action style, focus indicator and usable touch height. Rules and action arguments unchanged. |
| MB-UI06 | Factory preview no longer exposed Item/feature instructions available before creation. | Expandable sanitized descriptions from the actual generated Items; no added reads, guessed grants or writes. |
| MB-UI07 | Isolated browser harness only loaded compiled utilities and ignored the manifest's optional stylesheet. | Load the manifest-declared stylesheet as well as compiled utilities. Fix test selection to use visible mobile/desktop controls and use DOM text for semantic assertions unaffected by CSS uppercase. |
| MB-UI08 | Equipment heading/Add control exceeded a phone's content width, changing the mobile visual viewport and putting the footer controls outside usable coordinates. | Wrap the heading/action row, use responsive heading size and allow Item names to wrap. Verify actual layout viewport width, not the expanded mobile `innerWidth`. This is another existing layout defect exposed by the full pass. |

## Whole-UI disposition

The table below records every changed path, including deleted and non-rendering
helpers. “Retained” means the current behavior remains deliberately in place;
it does not assert equivalence of every historical rule.

| Path | Review disposition |
| --- | --- |
| `src/ui/EquipmentTab.tsx` (M) | Retain canonical stacks, shield/ammo controls, exact Item actions and existing row design; retired automatic consolidation remains retired. Render all widths plus inventory regressions. |
| `src/ui/MorkBorgSheet.tsx` (M) | Restore font tokens and new action styles; keep all four tablet/desktop tabs on one row. Preserve HP/resource input, permissions, confirmation and Core footer integration. |
| `src/ui/SpecialTab.tsx` (M) | Retain passive/formula/macro capability distinctions, current Item detail and purple/pink cards; render Special and existing action regressions. |
| `src/ui/ViolenceTab.tsx` (M) | Retain native attacks, armor and shields; style new Defend/damage buttons consistently. Render and preserve inventory/action regressions. |
| `src/ui/components/BufferedInput.tsx` (A) | Behavior-only helper; preserve delayed-source edit handling. Existing mounted typing regression retained. |
| `src/ui/components/ItemInfoModal.tsx` (M) | Use restored common frame, sanitized details and styled action. Keep current Item refresh and permission retirement. |
| `src/ui/components/ItemModal.tsx` (M) | Restore framed tabs/actions; keep native fields and SDK rich editor. Render Details/Description and test editing/permission transitions. |
| `src/ui/components/MobileSectionNavigation.tsx` (M) | Retain responsive active/secondary/More navigation and public footer-space registration. Verify visible controls and actual HUD clearance. |
| `src/ui/components/MorkBorgAddItemModal.tsx` (M) | Restore catalog/custom tabs, grouped results and a bounded scrolling list; preserve dialog geometry during delayed loading. Keep current caller catalog, denial, retry, exact source selection and custom fields. |
| `src/ui/components/MorkBorgConfirmModal.tsx` (M) | Retain SDK confirmation and existing module theme; restore desktop tilt through the declared stylesheet. Test keyboard and cancellation. |
| `src/ui/components/MorkBorgEditScvmModal.tsx` (M) | Restore common frame and action treatment; retain buffered inputs/permission retirement. Render edit form at every width. |
| `src/ui/components/MorkBorgRollFrame.tsx` (M) | Restore themed shell/close icon. Preserve native top-layer, focus and shared-content yielding. |
| `src/ui/components/MorkBorgRollModal.tsx` (M) | Restore themed frame/actions; retain Auto/Manual raw-die and visibility semantics. Render manual form and run maintained payload checks. |
| `src/ui/components/RestModal.tsx` (M) | Restore textured hierarchy and action style around current native options; keep keyboard-select flow and native rule text. |
| `src/ui/components/RollModal.tsx` (D) | Deleted duplicate roller stays deleted; shared rule/action path and current MorkBorgRollModal retain presentation responsibility. |
| `src/ui/components/utils.ts` (D) | Deleted randomRotation helper stays deleted; Factory tilt is selected once per new result and stays stable between generations. Form tilt remains fixed. |
| `src/ui/dashboard/MorkBorgCharacterGenerator.tsx` (M) | Restore Factory palette/layout/controls and Item instructions; retain dynamic allowed classes, complete reviewed candidates and partial-write recovery. |
| `src/ui/hooks/useRequestFence.ts` (A) | Retain stale request/notice retirement for real scope changes; repeated healthy heartbeats must not discard current action feedback. |
| `src/ui/hooks/useScopedCatalog.ts` (A) | Preserve scoped state, retry and authority refresh; ignore identical healthy connection heartbeats so consumers do not flicker or regenerate. |
| `src/ui/pages/ActorPage.tsx` (M) | Retain truthful unavailable/unsupported states and owner-gated sheet. Existing dark/yellow presentation stays; no new Actor-type support. |
| `src/ui/utils/formulaResolver.ts` (D) | Deleted UI rule duplication stays deleted; current shared rules remain authoritative. |

## Verification

Maintained commands, from the configured Core root (use fresh isolated output):

```sh
node data/local/modules/morkborg/scripts/typecheck.mjs
node data/local/modules/morkborg/tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.9.0.tgz --test-script presentation-regressions.mjs
node data/local/modules/morkborg/tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.9.0.tgz
node data/local/modules/morkborg/tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.9.0.tgz --test-script inventory-regressions.mjs
node data/local/modules/morkborg/tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.9.0.tgz --test-script action-regressions.mjs
```

Package with `SHEET_DELVER_DATA` set to a fresh isolated directory containing a
local source copy, using Core's `package-module.ts`. The runner checks listeners,
creates its own browser/profile and stops them. It never contacts Foundry.

The pre-repair archive failed the Factory border and restored-frame assertions.
The broader run also exposed tablet overflow. Initial semantic-casing and hidden
desktop-selector failures were harness defects, not generation failures.
No no-op test was counted as a new product fix.

Final verification results and archive identity are recorded below.
Rendered fixtures use Core components/SDK and in-memory requests; they are not a
real production session or native source acceptance. Existing native behavioral
evidence retains its original archive identity.

## Review and remaining scope

The user must still review the restored look. No changes to source rules, server
routes, migrations, release workflows, compatibility or version metadata belong
to this repair. Previously deferred non-character sheets and native automation
remain deferred; restoring presentation does not reopen them.

## Superseded first isolated result

Archive SHA-256: `439ca8c8f4042c80f5160c3e396f9699a56ede590f91bcfee07da64c45f93447`. Version remains 0.9.0.
All 19 source suites and explicit module typing pass. Browser checks pass:
17 presentation groups, 26 maintained interaction cases, 3 inventory cases and
7 action cases. All four widths and both appearances are included.
Module checking, isolated packaging, whitespace and documentation links pass.
Compiled logic/server output is byte-identical to the before archive; Shadowdark
migration definitions/hooks also match. No compatibility/version/workflow change.

The [portable validation record](evidence/2026-10-20-presentation.json) records
checks and qualifications without native content or temporary paths. Representative
screenshots were visually inspected in addition to geometry/keyboard assertions.
All task-owned services stopped. No operator Foundry connection occurred. Changes
remain uncommitted, with user visual review pending.

## Operator-driven correction and current result

The user rejected the first tabbed/manual-preview Factory. The corrected layout
was compared with the executable Factory at `8cde351` and the character-first
layout at [SCVMBIRTHER](https://scvmbirther.makedatanotlore.dev/) and the typography
and book examples at [MÖRK BORG](https://morkborg.com/) on October 20. No external
art or font was copied. Restore automatic generation on entry, compact allowed
classes, Name/Class/HP/Omens, the four detail panels, original d20 reroll control
and full-width SAVE THIS ONE button. Native data, reviewed candidates and
confirmation/recovery remain current.

| ID | Reproduction | Correction / ownership |
| --- | --- | --- |
| MB-UI09 | Every unchanged `connection:changed {connected:true}` signal refetched classes and caused another generation POST/candidate datastore save. Factory, Item-catalog and delayed action-feedback checks failed before their corrections. | `useScopedCatalog` and `useRequestFence` compare connection/world identity. Twenty healthy heartbeats preserve the existing catalog/candidate. Real reconnect/context changes still invalidate. Factory automatic generation is once per mounted identity scope; real invalidation requires explicit reroll. Candidate storage is server review state, not an Actor creation. |
| MB-UI10 | Delayed 80-Item results changed the centered Add Item frame from about 335px to 6538px tall. | Grouped results and a bounded inner scroll area keep the dialog in place. Existing Item editor input/node identity survives unchanged-source updates. |
| MB-UI11 | Operator page displayed new JSX against old CSS; actual Core asset headers allowed one hour of browser caching. | External Core ADR-0065 corrects mutable-asset revalidation and stylesheet URL source identity. Core also corrects redundant cold-session sockets/reads and heartbeat-delayed readiness. These are not module-owned fixes or native migration issues. |

Archive before the palette refinement below:
`e97db37f9d670f529f150f21fbcc89b1ba26474967f872270b63f1d8b1776b38`.
Version remains 0.9.0. Explicit module typing, check/package pass. The corrected
archive passes 12 Factory/navigation/catalog/action lifecycle groups and all 26
maintained mounted cases. The unchanged presentation passed 17 groups on the
preceding archive (12-class fixtures, four widths and both appearances). The earlier 19 source suites, 3 inventory and 7 action
cases passed; the final additional changes affect catalog connection handling, action feedback
and automatic generation retirement, not rules/server code. Compiled logic and
server files remain unchanged. The portable record distinguishes retained checks
from the current archive runs.

Run the additional checks with `--test-script factory-corrections.mjs` using the
same installed browser runner above. Representative corrected screenshots were
visually inspected, including the full-width character review and compact header.
The runner's cache-disabled fixture remains a module interaction check; Core's
separate real Socket.IO/asset-route browser reproduction keeps caching enabled.
No native Foundry connection or Actor writes were performed. At this checkpoint
operator review, commit and publication remained pending.

## MB-UI12 — Reference palettes and per-result tilt

The user subsequently confirmed that the Core fixes resolved the loading issues
and accepted the restored Factory layout. They requested that rerolling change
the panel angles and that the colors match SCVMBIRTHER instead of the gray and
other approximate combinations.

Inspected the live reference on October 20, including its
[`static/js/main.23471cfb.js`](https://scvmbirther.makedatanotlore.dev/static/js/main.23471cfb.js)
theme definitions and a rendered page. This gives the following independent
color reference. Black is `#000000`, white `#ffffff`, yellow `#ffe82c`, pink
`#f142af`; no artwork or fonts were copied.

| Palette | Page / text and border | Heading / text | Button / text | Equipment description |
| --- | --- | --- | --- | --- |
| classic | white / black | yellow / black | black / white | black |
| doom | black / white | yellow / black | white / black | yellow |
| flesh | black / white | pink / black | white / black | pink |
| pig | pink / white | white / black | black / white | black |
| gold | yellow / black | white / black | white / black | black |
| ink | white / black | black / white | black / white | black |
| sarkash | black / white | white / black | white / black | white |

`MorkBorgCharacterGenerator` now selects a different palette and new angles for
all four stat cards, all four detail panels and the save control after a
successful current generation. After further user clarification, each element
must switch left/right direction, choosing a magnitude of 1–2 degrees. This
explicitly includes the save control: switching -2 to -1 degrees was too subtle.
Selection, healthy status, confirmation and
recovery do not rerandomize. `presentation.css` supplies the seven reference
combinations, solid ink shadows and matching toolbar/dice colors. Button hover
inverts its contrasting colors; the reference's black-on-black doom active state
is deliberately not copied. Existing geometry and creation behavior are retained.

Before correction, the two new mounted checks failed against archive
`e97db37f9d670f529f150f21fbcc89b1ba26474967f872270b63f1d8b1776b38`:
an unsupported palette was selected, and reroll left all panel angles unchanged.
The other 12 Factory groups passed. A later direction-specific regression failed
against the first palette correction (13/14 groups passed): a changed angle
could stay on the same side. The final implementation flips every element left/
right, and that same regression passes, including the save control.

Current archive:
`0aacc7f2ef550b55eab73a68d7985ddc83819a0394e28b6160e1e1604d7181c7`.
All 14 Factory correction groups and all 17 presentation groups pass on this
archive. The latter covers 360/768/1280/1920 widths in both host appearances.
Seven full-page palette captures and responsive captures were visually reviewed.
Explicit module typing, package validation, isolated packaging and whitespace
checks pass. Compiled logic/server files match the preceding archive byte for
byte. Prior rule, inventory, action and general consumer checks remain retained
with their earlier archive identities; this cosmetic change did not rerun native
or Core startup acceptance.

The user accepted the current presentation, including the final refinement,
and authorized a local checkpoint on October 20. ADR-0002 remains open with the
external MB-UI13 follow-up below. No remote writes, version changes or live
Foundry requests occurred in this repair pass. Task-owned browser services are
stopped. This operator feedback does not replace native acceptance evidence.

## MB-UI13 — Attack/defense follow-up dice animate together

User report: attack or defense and the resulting damage appear simultaneously.
Requested immediate behavior: launch the next roll once the preceding dice
settle. Configurable delay and a module-owned HUD settings tab are follow-up
work after the current repairs.

Source trace:

- `src/server/actions.ts:executeAction` already awaits the attack/defense roll,
  then conditional damage, then armor reduction. It retains those serialized
  rolls in order and sends one final authorized chat message.
- Core `src/client/ui/components/Dice/presentation.ts:toDicePresentation`
  flattens every top-level recorded Roll in that message into one notation.
  `SharedDiceAnimation` consequently starts them as one physical group.
- There is no public module callback for animation settlement. Delaying the
  module request, splitting persistence across browser callbacks, or adding
  another module dice renderer would not fix the owning presentation path.

The proposed Core correction preserves each top-level Roll boundary and starts
its next visual group at settlement, without waiting for the previous group's
linger. Dice belonging to one Roll (including advantage, critical-expression
children and percentile pairs) stay together. Independent chat messages retain
their concurrent presentation from Core ADR-0050. Rules, recorded faces, chat
authorization and persistence must remain unchanged. Final-result visibility,
skipped/malformed rolls, renderer failures, revocation, disconnect and teardown
need the existing Core lifecycle treatment.

SDK `ModuleSettingDeclaration` and `useModuleSettings` already support
world/module-namespaced browser preferences. `UIModuleManifest` has no settings
panel extension, and Core `PlayerSettingsDialog` currently owns its fixed tabs.
A public module-tab extension and a documented way to apply optional timing
preferences remain future Core/SDK work; they are not available merely by
declaring a setting. Track this with DW-19 in Core's deferred-work ledger.
No module-private Core imports or invented event names are proposed.

Status: source cause verified; separate Core implementation scope requested.
The module's server action code is unchanged.
