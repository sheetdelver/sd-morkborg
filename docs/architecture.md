# Mörk Borg module architecture

`info.json` is the compatibility authority. The module requires Core 0.18.0
and UI API 3.1; the remaining API ranges are declared there.

The active [native alignment audit](audits/2026-10-18-native-alignment.md) and
[proposed ADR-0001](adr/0001-native-data-and-behavior-alignment.md) record the current
remediation plan. The earlier Core 0.19.3 compatibility review passed build checks,
but neither it nor the existing tests establish native parity. Manifest ranges,
CI/release pins and product source remain unchanged during documentation discovery.

## Current implementation and known boundaries

The adapter prepares Actor clones through `BaseSystemAdapter`; it does not write
derived values back to Foundry. Its resource/card preparation and item categorizer
feed `MorkBorgSheet`, while the custom ActorPage uses Core's `useActorSheet` for
loading, updates and realtime. The current sheet has Background, Equipment,
Violence and Special tabs. There is no independent simplified-sheet projector or
type-specific creature/follower/container/misery sheet.

Module routes drive a system-specific action engine through a shim over caller-bound
documents, rolls and chat. Generic Item CRUD uses platform routes. The data manager
reads declared Item/RollTable compendia per request, but still implements private
dice/table selection and SCVM generation. The generator posts its client-held
candidate to platform Actor creation. It currently omits generated companion Actors.

Native inventory preparation now uses `carryWeight`, `containerSpace`, carried
state and canonical owned IDs. The shared inventory model rounds individual stacks,
counts container members once, retains first-equipped armor, and derives current
tier reduction separately from maximum-tier penalties. Source fields remain
unchanged. Invalid or overlapping membership produces a typed validation error.
The destructive name-based Organize action was removed. Action planning and
sequenced inventory writes are still being aligned under ADR-0001.

Core owns authorization, world/session lifecycle, roll execution and shared
chat/media/dice presentation. The module supplies its own sheet and roll styling
through the public SDK. Its mobile section bar registers measured footer space
so Core controls remain accessible above it.

Custom info/edit/rest/confirmation/roll overlays still exist; they do not inherit
all shared-dialog corrections automatically. Raw description HTML, keyboard/focus
behavior and lifecycle retirement require the audit's G6 work. Retain module design
while adopting shared components/helpers where their contracts fit.

## Native authority and settings

The inspected native reference is tag 6.0.1 at
`d850c094a9452d752307221f42245a73b66bdfbb`; its manifest reports 6.0.0 and Foundry 14.
The audit distinguishes schema/stored documents, native derived methods, module
preparation and controlled execution. Native browser methods and add-on CONFIG
mutations are not automatically available over the public SDK. No v13 support claim
is established by this reference alone.

Native equipment uses `carryWeight`, `containerSpace`, `carried`, `quantity`,
`system.items` container membership, `tier.value/max`, and `handed` 1/2 (stored
strings also occur). Class-owned Items supply starting formulas/rolls and the Omen
die. Scrolls are Item type `scroll`; tablets use `system.scrollType`, not a separate
native Item type. Preserve canonical UUIDs when resolving class/table documents.

Four proven native world settings are declared for manifest version 6.0.0 only:
carrying, ammo, hit automation and allowed class policy. Core provides registered
default provenance and immutable snapshots; unavailable carrying rules yield an
unknown encumbrance state, never an invented false/default. Other manifest versions
remain unavailable until verified. Client preferences are not service-account rules.
`additionalAbilities` has no explicit native scope; the public v14 type documentation
does not specify an omitted-scope default. Its actual registered scope must still
be checked in disposable native acceptance before adoption as a world rule.

Handedness is normalized for reads (native numeric/string 1/2 and the module's
legacy 1h/2h shapes) without changing source. The editor now writes numeric 1/2
and displays missing damage as unavailable. No affected persisted world data was
provided. No mass repair is selected: read normalization is deterministic and
lossless; a future persistent repair requires actual affected scopes and Core's
reviewed maintenance mechanism. Lost items and historical outcomes are unrecoverable
without operator evidence.

## Initiative

Core resolves a saved GM override first, then the module formula, then its
generic fallback. The HUD adapter displays the resolved formula and audience
read-only and returns only a roll choice or a final manual total. Omitting an
advantage mode preserves the formula. Sheet Auto/Manual raw-die rules are
separate from the HUD's final-total entry.

The managed HUD uses individual initiative. A separate sheet party action currently
posts a roll result; it does not implement native encounter reordering or turn hooks.
Those features remain separately scoped. Correct the sheet preview/execution
inconsistency without changing the HUD's final-total contract.

## Responsive resources

Core ADR-0063 moved sheet/generator navigation into page flow below Core's combat HUD.
Current/maximum resources use the available card width and centered values.
HP spans the phone grid row so two four-digit values remain readable; update,
minimum and maximum semantics are unchanged. Footer-space registration lets the
host reserve space for the module's mobile section bar.

## Distribution and verification

`info.json` declares the module version and API compatibility. CI/release
workflows currently use the released Core `v0.18.0` toolchain. Release assets
include the package archive, checksum, catalog manifest and release history.
A module release tag identifies the matching manifest version.

Repository workflow and verification commands live in [AGENTS.md](../AGENTS.md).
ADR-0001 proposes qualification and coherent pins against released Core 0.19.3;
the current 0.18.0 pins remain the actual implementation until that gate is done.
The [audit index](audits/README.md) selects one active report and preserves earlier
evidence. Native acceptance, role/privacy cases and installed browser flows remain
open; static render tests are insufficient to close those gates.
The shared contracts are described in Core's
[module authoring guide](https://github.com/sheetdelver/sheetdelver/blob/v0.19.3/docs/MODULE_AUTHORING.md),
[world/maintenance contract](https://github.com/sheetdelver/sheetdelver/blob/v0.19.3/docs/MODULE_MIGRATIONS.md)
and [release process](https://github.com/sheetdelver/sheetdelver/blob/v0.19.3/docs/RELEASING.md).

## ADR-0001 implementation checkpoints

Command routes preserve SDK typed failures and sanitize unexpected errors. Character
actions preflight OWNER reads, validate command/visibility/manual shapes and bind
speaker attribution to the selected actor before dice or chat. Ordinary ability
and initiative rolls no longer load unrelated generation packs. Empty generation
catalogs return not-ready; an explicitly empty class selection is invalid.
These source/offline boundaries still require installed caller/native acceptance.

### Shared action and inventory execution

`logic/rules.ts` plans formulas, native DR contributions and availability for both
sheets and server. Request execution re-reads OWNER authority, actor/item source
and world revision before effects; stale inputs require refresh. Native source
and prepared projections remain separate. Native attack/defense total quirks are
corrected to the published natural-die/whole-damage rules recorded in ADR-0001.
Single-die manual input preserves modifiers; composite/multiple-die manual entry
is explicitly unavailable. The HUD retains its independent final-total input.

Inventory equip/move/tier/delete operations validate canonical IDs and membership
then await prerequisite updates. A failure stops later steps; no atomic transaction
or automatic rollback is claimed. Partial completion requires inspection before
retry. Armor/shield exclusivity and maximum-tier sheet controls are enforced.
Ammo uses the selected owned ammo ID and world rule; depleted ammo deletion cleans
container references first. Ordinary item edits remain public platform CRUD.

Short rest never resets powers; long-rest starvation and infection both apply
without clamping negative HP. Qualifying fed long rest restores powers and zero
Omens using the owned class die. Advancement handles equality and preserves current
HP. Casting uses Presence and remaining uses, with no invented equipment denial or
automatic failure HP write. Damage/armor/catastrophe instructions remain manual.
Daily powers, roll Omens and actual Omen spending are distinct controls.
Table/feat/generation services and installed/browser/native acceptance remain open.
