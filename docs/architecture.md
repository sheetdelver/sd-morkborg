# Mörk Borg module architecture

`info.json` is the compatibility authority. The module requires Core 0.19.3,
module API 1.5 and UI API 3.2; roll API remains 1.0. World snapshots/settings and
context lifecycle signals justify the newer API floors; no relation/migration
catalog is used, so module API 1.6 is not required merely because Core offers it.

The active [native alignment audit](audits/2026-10-18-native-alignment.md) and
[ADR-0001](adr/0001-native-data-and-behavior-alignment.md) record the current
remediation plan. The earlier Core 0.19.3 compatibility review passed build checks,
but does not establish native parity. Implementation evidence and outstanding
installed/native acceptance are recorded separately in the ADR and active audit.

## Current implementation and known boundaries

The adapter prepares Actor clones through `BaseSystemAdapter`; it does not write
derived values back to Foundry. Its resource/card preparation and item categorizer
feed `MorkBorgSheet`, while the custom ActorPage uses Core's `useActorSheet` for
loading, updates and realtime. The current sheet has Background, Equipment,
Violence and Special tabs. There is no independent simplified-sheet projector or
type-specific creature/follower/container/misery sheet.

Module routes drive shared action plans through caller-bound public document,
dice, table and chat services. Generic Item CRUD uses platform routes. NativeContent
resolves exact references per request; Generation uses class metadata and the same
service to produce complete Actor/Item/companion plans. Server-held candidates are
reviewed and revalidated before creation; partial outcomes require inspection.

Native inventory preparation now uses `carryWeight`, `containerSpace`, carried
state and canonical owned IDs. The shared inventory model rounds individual stacks,
counts container members once, retains first-equipped armor, and derives current
tier reduction separately from maximum-tier penalties. Source fields remain
unchanged. Invalid or overlapping membership produces a typed validation error.
The destructive name-based Organize action was removed. Shared action plans and
sequenced inventory writes validate prerequisites and stop on failed operations.

Core owns authorization, world/session lifecycle, roll execution and shared
chat/media/dice presentation. The module supplies its own sheet and roll styling
through the public SDK. Its mobile section bar registers measured footer space
so Core controls remain accessible above it.

System info/edit/rest/roll forms share a bounded composition for raw dice and
native fields. Confirmations and rich-text editing use public SDK components;
descriptions use SDK sanitization and URL handling. Scoped catalogs retire stale
responses on lifecycle/access changes. Full native/browser acceptance stays open.

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

Four proven native world settings are declared for exact versions 6.0.0 and 6.0.1:
carrying, ammo, hit automation and allowed class policy. Core provides registered
default provenance and immutable snapshots; unavailable carrying rules yield an
unknown encumbrance state, never an invented false/default. Runtime 6.0.1 on Foundry 14.367 serves the same 43 rule/schema files as the pinned
checkout (whose manifest says6.0.0); that comparison establishes the additional
exact default provenance. Other manifest versions remain unavailable until verified. Client preferences are not service-account rules.
`additionalAbilities` has no explicit native scope. Served Foundry 14.367
`ClientSettings.register` defaults omitted scope to client, as recorded in the
native runtime evidence. It is not adopted as a world rule or read from the service
account. Browser-only additional-ability configuration remains outside the supported
world configuration; the standard four abilities remain the supported controls.
Native color/font, last-class and delete-zero client preferences are not read from
the service connection. Ordinary quantity edits retain a zero stack until explicit
deletion; native tracked-ammo exhaustion remains an action-specific deletion.

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
Those features remain separately scoped. Sheet party preview/execution both use
native 1d6; the HUD's final-total contract is unchanged.

## Responsive resources

Core ADR-0063 moved sheet/generator navigation into page flow below Core's combat HUD.
Current/maximum resources use the available card width and centered values.
HP spans the phone grid row so two four-digit values remain readable.
HP may remain negative as native resource actions require. Footer-space registration lets the
host reserve space for the module's mobile section bar.
Expanded More content stays in the registered footer flow so measured clearance
includes it. Its Escape control restores focus without hardcoded host offsets.

## Distribution and verification

`info.json` declares the module version and API compatibility. CI/release
checkout, reusable release workflow and core_ref consistently pin released Core
`v0.19.3`. Explicit module typing includes source, UI, hooks and tests; root Core
TypeScript alone excludes these files. CI runs every maintained module suite. Release assets
include the package archive, checksum, catalog manifest and release history.
A module release tag identifies the matching manifest version.

Repository workflow and verification commands live in [AGENTS.md](../AGENTS.md).
ADR-0001 tracks qualification against the pinned released host separately from
native operator acceptance. The selected Foundry14.367/native6.0.1 pair has executed
[native acceptance](audits/evidence/2026-10-19-native-acceptance.md), including an
actual production frontend/API. Other runtime pairs are unqualified; the reference
manifest6.0.0 remains source/default provenance, not a separate running acceptance.
No module release version bump accompanies these pins.
The [audit index](audits/README.md) selects one active report and preserves earlier
evidence. Pale One/Forlorn source identity decisions remain open; selected native
role/privacy, lifecycle and browser qualifications are recorded per case. Static
render tests are insufficient to establish those qualifications.
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
The installed archive also passes real released Core Store/runtime boundaries
with a deterministic transport fixture; native caller acceptance remains open.

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
Exact table/feat/generation services are described below. Native acceptance remains open.

### Exact table and reviewed feat services

Action tables use request-local `NativeContent`: SDK dice evaluate the actual
formula and SDK tables select with a numeric override. Required formula absence,
uncovered totals and missing/denied documents fail explicitly. Every matched row
is retained, including text, nested tables and Actor results. Canonical references
win over names; legacy CSV resolution requires exactly one match in its declared
pack except the exact reviewed Pale One policy below. Cycles and exhausted result sets are errors. Non-replacement selection is
request-local only; no native document depletion is promised. Class unique-total
policy supports proven single-die table formulas; unsupported uniqueness domains
fail rather than inventing a distribution or returning incomplete success.

Broken and power catastrophes use their exact native root UUIDs. Chat preserves
evaluated dice and selected table/row/document identities under the caller's
visibility. Native macro precedence is macro before formula. The decoction adapter
requires the reviewed canonical Macro and command digest; it draws twice and
presents one doses total without granting inventory. Other macros are unsupported.
Character generation now uses this same content service. `Generation` reads a
caller-scoped Class catalog and native starting metadata, honors weapon/armor
formula overrides and scroll rules, retains full Item effects/flags and every
companion Actor, and builds traits/notes into the created description. New owned
Items receive fresh IDs; template UUID provenance is retained. Source templates
remain unchanged. Creation drops collection metadata/old ownership and gives the
caller private OWNER access. Generation supplies native actor-link/disposition
defaults without translating the native legacy `vision` field into modern token sight. Absent sight is left to
native creation; explicit companion token data is preserved. The operator's
Foundry14.367/native6.0.1 Brevel export independently exposes this distinction.

### Generation review and recovery

The server stores candidates under caller identity and a random candidate ID.
Creation checks world/runtime/context identity, allowed class policy, every exact
source dependency and the bound write subject before native creation. All proposed
Actor writes are reviewed together; native create authorization remains authoritative.
Confirmed writes are journaled. A failed/in-progress candidate is never blindly
replayed; a caller-authorized status route rechecks access to confirmed Actors.
There is no atomic multi-Actor or exactly-once guarantee, especially across an
acknowledgement/persistence gap. Recovery requires inspection of the actual world.

The factory retires catalog/previews/pending responses on public context, access,
connection and world signals, including ownership-only notifications. Errors have
retry, and creation uses the server candidate ID rather than client Actor data.
ADR-0001 records two operator-approved content exceptions for native6.0.0/6.0.1
on Foundry14. Pale One's exact class/starting CSV reference selects between
`BtoSeh36zY8IqOQJ` and `YcKA0JHLezBYt3fz` with SDK `1d2`. This is a provisional
module selector, not a native rule die or generic same-name fallback. Both exact
sources must be readable and have identical authored data (excluding document
identity, audit metadata, folder/sort and ownership). Both are creation dependencies;
the selected UUID is retained in the candidate and owned Item provenance, without
rerolling at creation. Diverged, missing or denied alternatives fail explicitly.

Forlorn Philosopher table `DfILdvixuR0LyIcT`, row `RaRYtTXoANahK7PP`, maps only
its exact stale reference to Actor `HLu7lgwoNPlhfx3W` in `morkborg.mork-borg-actors`.
SDK table selection and caller-bound target reads still apply. The original table
and Actor templates remain unchanged; the candidate records the reviewed mapping,
original table dependency and exact target dependency. This is an explicit module
override, not an upstream canonical-identity claim or persisted migration.
Other ambiguous/missing references retain their existing errors. Companion templates
must have fully hydrated embedded Items; ID-only payloads cannot become successful plans.

### Presentation and mounted catalogs

System forms share `MorkBorgRollFrame` using HTML `dialog.showModal` for browser
top-layer containment, labels, cancellation and trigger restoration, plus bounded
Tab cycling. Released Core's installed import rewriter does not expose
react-dom.createPortal; forms do not depend on that unavailable export.
Incoming public `content:shared` retires the module top layer so Core owns the
shared image/journal presentation. Layout-phase cleanup closes the native dialog
before DOM removal, letting Core capture the real return trigger. Module cleanup
does not subsequently steal focus from Core's overlay. Actual native sharing and
the maintained runner with Core's real shared overlay verify this interaction.
Public Core `ConfirmationModal` supplies confirmations;
the wrapper adds only keyboard/focus semantics absent from the released shell.
Item/class descriptions pass through SDK rich-content sanitization and URL handling.
Item/edit forms use the public rich-text editor. Removed alternate roll/resolver
implementations are not supported entry points. Observer sheets disable writes.
The UI additionally checks native `ownership` against the SDK caller, retaining
explicit NONE/default semantics and GM access. Released Core0.19.3's sheet hook
defaults an absent `isOwner` field to true; this conservative presentation gate
prevents observer editing despite that fallback. Host denial still wins, and
caller-bound Core services remain authoritative for all writes. Ownership changes
retire editors and pending feedback without a second document cache.
Text/number fields retain a local draft until blur, committing one changed native
field through the public update contract. Source changes retire old drafts;
Actor/ownership changes close editors. Saved rich-editor focus falling to body
is recovered within the active form's bounded Escape/Tab handling.

`useScopedCatalog` owns only consumer requests, never a second world cache. It
retires response generations and refetches on public context/access, connection,
world and invalidation signals, including changes with no setting keys. Failed,
empty and loading states differ; retry preserves harmless search/tab state. Browse
selection sends canonical source UUID for server revalidation.
Actor action/Item feedback and factory status use a consumer request fence as well;
retirement discards stale presentation without cancelling or replaying native writes.
Factory recovery disables repeating a submitted candidate and shows confirmed
write counts without cached document details when access no longer permits them.

### Released Core request retirement

Core 0.19.3's public request services can propagate plain world-context errors
before the first module document read. An installed reproduction establishes the
exact changed/retired/unavailable messages. The module narrowly translates those
known errors to conflict/not-ready, including partial-effect reports. It preserves
SDK typed failures and sanitizes every other unexpected error. This compatibility
bridge does not invent an SDK field or require a Core modification.

Combat plans include native remembered DR/target-armor/incoming-damage defaults.
UI and execution share DR calculation, validate selected formula variables before
attack/defense dice, and reject malformed or irrelevant manual controls. The SDK
remains responsible for dice syntax/evaluation; no duplicate evaluator is added.
Successful automated combat remembers the selected native base DR/formula flags
through guarded dotted-field writes, preserving unrelated flags and applying no
HP/armor changes. Automation-off forms hide unused damage formula inputs.
Daily resource resets update only native value/max fields, preserving min and
other source attributes under Foundry's object merge behavior.
