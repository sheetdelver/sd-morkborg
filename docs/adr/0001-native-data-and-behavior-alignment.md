# ADR-0001: Native data, behavior and Core contract alignment

**Status:** In progress — selected native runtime qualified; pinned data decisions open
**Date:** October 18, 2026  
**Owner:** SheetDelver Mörk Borg module  
**Evidence:** [Native alignment audit](../audits/2026-10-18-native-alignment.md)

## Context

Mörk Borg 0.8.3 builds on released Core 0.19.3, but its supported character workflows
do not consistently match the local native reference. Independent inventory,
formula, table, generation and UI paths produce different answers. Some operations
mutate more than the native action; others silently substitute content or succeed
without completing their advertised behavior. Passing existing fixtures establish
neither native parity nor safe installed behavior.

The source baseline is native tag **6.0.1**, commit
`d850c094a9452d752307221f42245a73b66bdfbb`, in the host workspace's `temp/morkborg`.
Its manifest says **6.0.0 / Foundry 14**. Preserve that discrepancy in evidence and
record the actual running version at acceptance. No v13/5.x or newer-version parity
claim follows from this checkout. Module baseline is `d9d250c`, version 0.8.3;
the Core target inspected is 0.19.3 (`90c13e5`).

This ADR starts the module's own numbering. It references released Core contracts;
it does not reopen Core ADR-0064 or adopt Shadowdark's implementation queue.

## Decision proposed

### 1. Native documents and proven rules are the authority

Keep native source documents immutable during preparation. Use actual Item/class
fields, canonical UUIDs, stored resources, declared world settings and selected
native-version rule semantics. Missing content, unsupported macros and unknown
formulas produce actionable unavailable/unsupported results. Do not invent a die,
class, item, successful empty result, permission or formula variable.

Native prepared properties and browser methods are not present merely because a
source document has arrived. The module may implement the pure native computation
that is needed to prepare source data; it must implement it **once**, with source
provenance and independent expected outcomes. Runtime native JS/CONFIG extensions
and descriptive class prose are not executable capabilities by default.

Native defects/ambiguities must be identified separately. In particular, attack
total-vs-natural 1/20 behavior, composite defense-fumble multiplication and old
pack utility fields require an explicit compatibility decision with evidence.
Do not reproduce a broken UUID lookup to achieve nominal source parity, or silently
change tabletop rules while describing the result as native parity.

### 2. One preparation and action model serves every consumer

Create typed module structures for native source inputs, prepared inventory and
action plans. The adapter prepares carrying/container/equipment state, categories,
resources and action availability. Sheets, cards, dialogs and server action planning
consume these structures. UI may format/filter/select and gather manual inputs;
it must not calculate a second DR, damage expression, inventory total or result.

Server commands receive actor/item identities and reviewed user choices. Before
side effects, re-read authorized source, validate command/caller/context and derive
rules again. Preserve natural-die identity for manual results. Sheet raw-die entry
and the Core HUD's final manual total remain separate contracts. Current HUD
individual initiative and public footer-space registration are retained.

### 3. Reuse public host services; keep system orchestration in the module

Use caller-bound documents, compendium, `rolls.roll`, `tables.draw`, chat and existing
actor lifecycle. For class formula overrides, evaluate the declared formula through
`rolls.roll`, then pass the resulting numeric `rollOverride` to `tables.draw`.
Validate the source formula first: the table helper's fallback is not permission
to draw from missing/invalid data.

Table orchestration must preserve all selected results and exact identities,
including text, nested tables, Items and Actors. Track visited table paths and
valid result sets; handle cycles/exhaustion with a reason. Implement the selected
native workflow's replacement/uniqueness policy without arbitrary retry ceilings
that silently return duplicates or incomplete results. Do not promise native
document depletion/atomic transactions from a read/draw primitive.

Use SDK confirmations and safe rich content. Compose system-specific roll bodies
only where the shared dialog cannot represent the required raw-die flow. Preserve
module styling while avoiding parallel modal focus/stacking machinery where an
existing contract fits. No private Core imports, sockets, native browser automation
or arbitrary macro evaluation in production.

### 4. Adopt proven native world settings and caller lifecycle

Declare `morkborg.trackCarryingCapacity`, `morkborg.trackAmmo`,
`morkborg.hitAutomation`, and `morkborg.allowedScvmClasses` with proven types,
versioned defaults and minimum exposure. Consume immutable snapshots via
preparation `context.world` and request `runtime.world`; use authorized projections
or `useWorldSetting` for UI. Preserve unavailable, stored and registered-default
states. Refresh prepared/consumer state when the host publishes a new revision.

`additionalAbilities` requires registration-scope verification first. Native
client preferences (including delete-zero-quantity) need a documented user policy;
never read the service account's client preferences as the player's world rules.
Do not add a generic settings write surface to imitate Foundry administration.

Picker/generator consumers retire loaded values and pending responses on relevant
world/context/access/session changes, including ownership-only events with no
setting keys. Refetch mounted consumers; expose loading/ready/failed and retry.
Preserve harmless search/tab/preferences, but invalidate generated candidates and
queued actions whose rule/content assumptions changed. Use `getSystemDataForUser`
only if choosing `/system/data`; caller-bound module routes are also available.

### 5. Restore existing behavior before adding automation

Correct the supported character creation, equipment, rolls, powers, rest and
advancement workflows. Return full generation results, including required companion
Actors, or explain unmet prerequisites before creating anything. Validate a complete
candidate on the server before creation and recheck changed context; do not trust
an old client-held template. Successful writes and failures must be reported
truthfully, including partial multi-document completion. No unproved exactly-once
or rollback guarantee may appear in UI/docs.

Remove invented armor-based cast denial, generic damage substitution, automatic
power-failure HP subtraction and implicit debris/decoction inventory grants from
the parity path. If retained as additions, give them explicit opt-in behavior,
reviewed semantics and separate tests. A native instructional chat result does
not authorize an extra document mutation.

Disable or replace unsafe inventory consolidation until it can preserve identity,
data and container references. Keep only safe, demonstrably equivalent stack merges;
otherwise allow ordinary editing. Native constraints apply to equip exclusivity,
tier limits and container membership. Do not silently delete or repair ambiguities.

### 6. Migrations are conditional on persisted defects, not SDK ceremony

Most findings need correct reads/actions, not world-wide data migration. Inventory
the module-produced `handed: "1h"/"2h"` shape if real affected data is provided.
Determine whether deterministic read normalization suffices or persistent repair
is necessary. If repair is selected, use a separate module migration catalog and
pure hooks consumed by Core's existing reviewed maintenance path.

A selected repair must cover every declared document scope that can contain the
defect, preserve unrelated data, report locked/unreadable/ambiguous scopes, and be
idempotent after external restore. Do not downgrade required completeness to an
advisory success. Test on an installed released Core before native approval.
Do not migrate correct native `carryWeight` into invented `weight` or persist
derived projections. Lost items, historic HP changes and previous random generation
outcomes cannot be reconstructed by guesses; provide diagnostics/manual recovery.

### 7. Compatibility follows delivered dependencies

Qualify implementation on released Core **0.19.3**, including production packaging.
The proposed supported floor is Core >=0.19.3 so the recent maintenance, pack,
ownership and typed-error fixes are present. Pin CI checkout, reusable release
workflow and `core_ref` coherently. The implementation must record which public
contracts it uses and set their minima accordingly; module-api 1.6.0 is available
for the selected modern host. Preserve UI/roll ranges unless an actual dependency
requires a change. Do not add an `sdkVersion` field or bump Core/SDK versions.

Native read ranges/default provenance must be based on the supported runtime
versions verified in G0/G8, not copied from another module. No release version
changes during remediation; prepare terse Unreleased notes only. Release remains
separate from implementation and closeout authorization.

## Implementation gates and commit checkpoints

Implementation is authorized on `fix/adr-0001-native-alignment`. Gates remain
open until their required evidence is recorded. Work belongs on a user-approved module branch,
for example `fix/adr-0001-native-alignment`. Git commits/checkpoints require their
applicable task authorization. At each authorized checkpoint, commit a coherent
passing slice with its tests, ADR/audit evidence, architecture notes and updated
local handoff. Record actual commit IDs; never mark work done from an agent summary
alone. Core and sibling repositories remain read-only.

### G0 — pin the oracle and add meaningful failing regressions

1. Recheck branch/worktree/Core/native hashes; preserve current documentation.
2. Record the native tag/manifest discrepancy and choose supported Foundry/native
   version pairs. To support v13, inspect its matching native release separately;
   do not run a Foundry-14-only native package on v13 as a parity test.
3. Establish typed minimal fixtures from the schema and representative actual
   records. Record provenance; do not bundle copyrighted pack prose wholesale.
4. Add failing-before cases for MB-N01–12 and MB-C01/02, prioritizing duplicate-ID
   consolidation, resource writes and data identity. Derive expected results from
   native methods/documents, not from a copied module implementation.
5. Record decisions for upstream ambiguities and new-vs-native automation. Explicitly
   select safety-preserving unsupported behavior for unimplemented Actor types.

**Checkpoint:** baseline inventory, failing evidence and support/behavior decisions.

### G1 — command boundaries and truthful availability

Addresses **MB-C01/02, MB-N04**, and authorizes no extra document access.

1. Preserve typed SDK errors with public `isSdkError` or the host boundary; safe
   unexpected 500s; retain 403/404/409/503 meanings in packaged code.
2. Validate discriminated command payloads, item IDs/types, manual values and formula
   variables. Require operation-appropriate actor authority before any dice/chat/
   mutation; validate speaker attribution. Reject unsupported commands explicitly.
3. Resolve only the dependencies needed by that command. Ability tests cannot fail
   because the generator's class pack is unavailable. Distinguish access denial,
   unready/invalid content, and valid empty selections.
4. Ensure all-classes-unchecked/missing templates cannot return a generated character.

**Checkpoint:** source and packaged route regressions; observer/owner/privacy
expectations documented. Passing a typed-error mock is not native authorization proof.

### G2 — world rules and canonical preparation

Addresses **MB-N01/10/11** and the preparation part of **MB-N03**.

1. Add proven settings declarations, versioned defaults/exposure and context reads.
   Verify additionalAbilities scope and client preference policy explicitly.
2. Replace invented field reads with typed source normalization; preserve originals.
   Prepare inventory/categories/equipped selection/container totals and action
   inputs once. Validate native handedness and armor tier values.
3. Share these values between cards, tabs, item details, dialog defaults and server.
   Remove UI arithmetic/fallbacks that contradict the preparation model.
4. Test true/false/default/unavailable settings and changed revisions. Inspect
   malformed persisted shapes; record the migration decision for G7.

**Checkpoint:** deterministic preparation, unchanged sources, same values across
consumers, native shape tests replacing the false `weight` fixture assumption.

### G3 — inventory writes and action parity

Addresses **MB-N02/03/05/06/07**.

1. Prevent duplicate canonical IDs and keeper deletion; resolve consolidation scope
   conservatively. Sequence container/equipment operations, validate references and
   report failures. Prove no deletion follows a failed prerequisite update.
2. Correct action plans: armor max/current tiers, encumbrance/ranged distinction,
   ammo tracking, native hitAutomation modes, defense crit/fumble and unarmored
   defense. The nonautomated mode needs its truthful follow-up damage action.
3. Preserve natural/manual results through execution; handle composite/multiple dice
   or explicitly disallow unsupported manual entry. Remove ignored advantage choices.
4. Correct the full rest matrix, Get Better equality/bounds, power display/execution,
   native resource rolls and side-effect scope. No short-rest power refill.
5. On changed source/context or denied writes, retire/review the command rather than
   applying cached numeric answers. Define retry behavior for partial actions so
   refresh/retry cannot blindly repeat confirmed mutations.

**Checkpoint:** independent expected roll/result/write lists for auto/manual actions,
source preservation and meaningful failure cases. Every extra mutation has an
explicit selected addition or is removed from the parity path.

### G4 — authoritative draws and feat dispatch

Addresses **MB-N08/12**, plus Broken and power catastrophe selection.

1. Replace private formula/table evaluators with SDK calls and exact document
   identity. Support formula overrides, multiple results, nested references, missing/
   denied content, cycles and uniqueness/exhaustion without silently substituting.
2. Draw Broken and root Arcane Catastrophes content rather than copied outcomes or
   the secondary cube table. Preserve roll visibility and returned roll evidence.
3. Implement formula/macro/passive feat precedence. Known reviewed macro adapters
   use owned canonical identity and metadata; unsupported macros remain explicit.
4. Match native decoction draws/dose presentation. Any chosen inventory addition
   uses correct single-document calls, full source preservation and reviewed total
   dose semantics; missing documents cannot become generic items.

**Checkpoint:** UUID collision, nested/multiple/Actor results, complex dice,
replacement policy, errors and private-chat tests on the actual service boundaries.

### G5 — complete, reviewable character generation

Addresses **MB-N09, MB-C02**, and required generated Actors in **MB-F02**.

1. Replace hardcoded UI class data with a caller-scoped catalog. Honor world allowed
   class policy and user choices. Keep native descriptions/starting metadata generic.
2. Pass actual class weapon/armor overrides, including scroll rules, to G4. Respect
   declared pack/name scope for legacy CSV references; reject ambiguities rather than
   searching all packs by name. Retain canonical UUIDs after resolution.
3. Preserve all required starting Items, traits and Actor companions. Deduplicate
   only where native workflow requires it; repeated legitimate templates must survive.
4. Present a complete candidate with provenance/context; validate again before
   creation. Use caller permissions, appropriate actor/token defaults and an explicit
   outcome for partially completed multi-document creation. Never silently reroll.
5. Prove source templates unchanged and no writes on cancellation, invalid selection,
   missing dependencies or denied preflight. Avoid an unexplained timing delay as
   the correctness mechanism for post-create navigation.

**Checkpoint:** all 12 baseline classes under deterministic choices, custom/renamed
content, classless, restricted catalogs, Actor results and partial-write recovery.

### G6 — mounted UI lifecycle, accessible presentation and consolidation

Addresses **MB-C03, MB-N13** plus UI manifestations of G2–G5.

1. Retire/refetch open picker/generator data on context/access/world/session changes;
   discard late results and gate actions until current. Include ownership-only change,
   reconnect and same-user recovery. Preserve manual preferences where appropriate.
2. Render descriptions via SDK-safe content/URLs and test references/inline content
   under caller permissions. Reuse confirmations; unify module-specific dialog
   composition only where the public shared components cannot fit.
3. Remove unused resolver/categorization/alternate roll paths after verifying callers.
   Fix keyboard controls, focus return, nested Escape, background containment, labels,
   narrow layouts and footer tool clearance. Keep the module's visual design.
4. Show truthful unsupported handling for non-character Actor types. Do not expose
   character writes/resources on container or misery-tracker documents.

**Checkpoint:** installed UI cases at 360/768/1280/1920 widths and both host themes,
including actual keyboard/mouse operations; screenshots alone are insufficient.

### G7 — migration decision and released-host integration

Addresses **MB-C04** and any selected persistent repair from **MB-N11**.

1. Write the explicit migration decision: no repair needed with evidence, or exact
   defective shape/affected scopes and a deterministic repair catalog. Do not create
   an empty catalog merely to appear compliant.
2. If needed, prove full required scope completeness, lossless/idempotent hooks,
   unchanged correct/custom data, locked/unavailable scope diagnostics, restore and
   restart/recovery through Core's real admin maintenance path. No new Core code.
3. Qualify public actions, settings refresh and privacy on isolated released Core
   0.19.3 in development and installed production packaging. Test all permission/error
   boundaries without privileged replacement projections.
4. Update justified manifest minima, all host pins, tests and author documentation
   together. Application/module version remains unchanged until release preparation.

**Checkpoint:** checksummed package identity, observed Core identity, actual-host
evidence and a resolved migration decision. A new Core limitation requires a minimal
reproduction and separate proposal, not a module-side privilege workaround.

### G8 — native acceptance for each supported version pair

Arrange one complete run per available disposable world before asking the operator
to switch versions. Record Foundry build, native reported version, selected module
source/archive hash, Core version, world and role identities without credentials.
Native writes require their applicable task authorization; use dedicated fixtures
and confirm cleanup/baseline restoration. Do not treat historical Shadowdark/Core
acceptance as Mörk Borg evidence.

| Case | Required evidence |
| --- | --- |
| MB-A01 | Native source vs prepared Actor/item values, weight/container/equipment changes and same values on cards/tabs/details |
| MB-A02 | Native setting changes in-session, carrying/ammo/automation/class restrictions, unavailable values and stale-dialog retirement |
| MB-A03 | Melee/ranged, armored/unarmored defense, crit/fumble, manual raw dice/composite damage, chosen no-automation behavior and no ignored controls |
| MB-A04 | Every short/long rest food/infection combination, negative HP, depleted/current powers/Omens, Get Better equality and bounds |
| MB-A05 | Power uses, Presence preview/result, correct catastrophe content, macro/formula/passive feats, Broken and resource controls |
| MB-A06 | All baseline classes, classless, starting dice/results/companions, empty/denied/custom catalogs; create/cancel and partial failure |
| MB-A07 | Single ammo rendering/consolidation safety, distinct same-name Items, container movement/deletion/equip exclusivity and source round trips |
| MB-A08 | GM/OWNER/OBSERVER/hidden actor boundaries, all roll visibility modes, concealed references, ownership-only revoke/restore and late responses |
| MB-A09 | Actual packaged UI: open modals, keyboard/focus/nesting, long rich content, phone tool clearance, reconnect and retry |
| MB-A10 | Selected migration through admin preview/approval/recovery and all affected scopes, or documented evidence-backed not-applicable decision |

If both v13 and v14 are claimed, complete this matrix on each **appropriate native
release**. Unsupported versions receive a documented boundary, not a false pass.
Record source snapshots and independent post-write comparisons rather than relying
solely on returned success envelopes or roll chat text.

**Checkpoint:** native ledger with per-case pass/fail/qualified/N/A, exact cleanup
evidence and explicit unresolved defects. No unsupported claim of failure-free execution.

### G9 — independent review and closeout

Reconcile every MB-N01–13 and MB-C01–04 to commits/tests/evidence and any explicit
deferral. Confirm selected native acceptance, privacy/race behavior and retained
source data. Review the final installed artifact; verify Core/sibling trees remain
unchanged. Update architecture, guidance, audit, terse changelog and handoff.
Archive the report only when all required scope is satisfied; carry follow-ups
forward by ID. Mark Core compatibility and native support precisely. Commit/push/
merge/release only under the relevant current authorization.

## Feature backlog and explicit boundaries

The audit's MB-F01–06 remain visible follow-ups. Type-aware unsupported handling,
safe references, additionalAbilities scope determination and complete generated
companions are part of this ADR. Full creature/follower/container sheets, Misery
automation, native party encounter ordering/turn hooks, journal/hotbar scripting
and browser-only add-on CONFIG execution require separately selected scope.
Their absence does not justify blocking normal bootstrap or manufacturing a
migration catalog. Each future feature needs an authoritative data/action contract
and a module-vs-Core ownership decision before implementation.

## Consequences

The module retains system-specific orchestration and design while removing
competing rule engines and fabricated defaults. Some previously permissive controls
become unavailable when required data is missing; existing corrupt data is reported
rather than guessed. No new Core extension is presumed necessary. The initial work
is larger than a compatibility bump because it repairs demonstrated behavior in
currently advertised functionality.

## Progress ledger

Selected native qualification is recorded in the [final matrix and cleanup review](../audits/evidence/2026-10-19-native-acceptance.md)
and its [portable metadata ledger](../audits/evidence/2026-10-19-native-acceptance.json).
Prior full-host fixes were committed at `aadde52` and `1b38ff4`. Final implementation
checkpoint: `006019b563b7edf1946da240290a7c057d021d6a`. The final slice
also yields module forms to Core shared presentation with correct focus return,
and labels hidden/unavailable Actors truthfully. Actual native execution exposed
these defects; meaningful old-archive failures remain separate from final passes.

Final module0.8.3 archive SHA-256:
`1b7e1d48ab878fbaa080f5642d94f9d8b934136cde775410d8bc77967070822b`.
16 source suites, explicit module/UI/hooks typing, check/package,14 production
integration cases and26 actual-Core-overlay browser cases pass. A separately built
production frontend/API ran the native matrix. All task fixtures and services are
removed; original Actor source and setting identities/values/absence are verified.
Native Setting audit timestamps/authorship retain the legitimate test history.

| Gate | State | Evidence / commit |
| --- | --- | --- |
| Discovery | Complete for pinned source/data | Active audit; original defects and source identities retained. |
| G0 | Complete | `7429db2` existing docs; `7a794ea` meaningful20 fail/1 pass; subsequent same-input regressions and explicit RAW/native decisions. |
| G1 | Qualified on released Core and native callers | `ccaf20f`; typed errors/OWNER preflight; production and real owner/observer/hidden execution. |
| G2 | Qualified for selected native pair | `540d3bc`; immutable inventory/rules; actual carrying/ammo/automation/class changes and restoration, client-only additionalAbilities verified. |
| G3 | Qualified with explicit RAW deviations | `b3ee21a`, `aadde52`; native inventory/rest/advancement/power/combat/resources, merge-safe fields and remembered preferences. |
| G4 | Qualified | `aadbc9d`; SDK exact tables, multiple/nested results, canonical feats; actual native Broken/Catastrophes/macro and concealed dependency cases. |
| G5 | Qualified with pinned unavailable branches; token follow-up | `21e7b18`; full selected plans/companions, native creation/cancel/custom catalogs, actual partial recovery/no replay. Pale and stale Forlorn branch remain unavailable. Brevel token-default follow-up has source/installed regressions; amended native creation not rerun. |
| G6 | Qualified | `18bc9ce`, `1b38ff4`, `006019b`; native permissions, production UI, actual shared-image nesting/focus, mobile clearance and reconnect. |
| G7 | Released-host qualification complete; repair N/A | `007aca9`; coherent Core/API/workflow pins, explicit typing,14 production integrations; no deterministic persisted repair selected. |
| G8 | Selected pair executed and qualified | Native6.0.1/Foundry14.367 MB-A01–09 matrix and cleanup recorded; MB-A10 N/A. Other runtime pairs unqualified. |
| G9 | Review/cleanup recorded; ADR remains open | Findings reconciled below and in audit. Pale/Owl canonical identity decisions remain pinned; no unsupported12-class or other-runtime claim, no audit archive. |

### Implementation baseline (2026-10-18)

Reverified module `d9d250c` / 0.8.3, released Core `90c13e5` / 0.19.3
and clean native `d850c094` / exact tag 6.0.1 (manifest 6.0.0, Foundry 14).
The selected qualification pair is Foundry 14 with this native revision. v13
is not claimed. Existing documentation was inspected and committed at `7429db2`.

The first maintained regression run used native schema and independently expected
results from `actor/rest.js`, `get-better.js`, `powers.js`, `actor.js` and
`item.js`: 20 of 21 cases failed on unchanged product code. Evidence is retained
in the active audit. This is an intentional failing-before checkpoint, not a
passing implementation gate. Attack/defense upstream quirk selection was pending at this baseline; the later
RAW decision below supersedes it. Non-character sheets/actions
will expose unsupported status; generation must still preserve companion Actors.

Command-boundary checkpoint: `command-boundaries.test.ts` passes; original
MB-C01/02 and MB-N04 cases now pass on the same inputs (16 other baseline
failures remain). Explicit module typing passes. Released-Core isolated module
check/package passes, SHA-256
`5ea07fd832086b09854b9f5d26ba1f96fdc898ed6e589f44cbd48d64aa07557f`.
No installed/native authorization acceptance is inferred.

Canonical preparation checkpoint (after `ccaf20f`): native inventory tests pass
for fractional rounding, containerSpace, zero/legacy carried behavior, first
equipped armor, native/legacy handedness, malformed membership, changed setting
revisions and source preservation. Original MB-N01/02 cases pass. All three
existing suites, explicit module typing and isolated module check pass.

Rules-as-written comparison requested by the user: publisher-linked Bare Bones
PDF SHA-256 `f09678dc12030728c78a9e04ceb3d5d2d805735b55f56c9fd0e1a41959581ad1`,
printed pp. 30–31 (visually inspected), defines natural crit/fumble and double
defense-fumble damage. Select natural-die hit/miss overrides and parenthesize the
complete incoming expression before native-ordered reduction. This deliberately
corrects the pinned native attack total test and composite multiplication quirks.
Keep armor/HP effects instructional. Source: [author's free edition](https://jnohr.itch.io/mrk-borg-free),
linked from [official content](https://morkborg.com/content/).

No persistent migration is selected: deterministic read normalization preserves
legacy handedness and there is no provided world inventory establishing a needed
persisted repair. Do not infer that no affected worlds exist.

Native action/inventory checkpoint (after `540d3bc`): all **21/21** original
regressions now pass. Added action-parity, manual-damage and inventory-actions
suites pass; existing preparation/presentation/visibility suites and command
boundaries pass. The same manual input on `540d3bc` produces `4` damage formula
vs required `(4+1) * 2`; corrected execution passes with natural 20 and Strength -3.
Explicit module/UI/hook typing and isolated Core check/package pass. Archive
SHA-256 `b3c0925fe46f0cc12d6dd4bd3c42224dc1dac8cf14fae252d4bdab17ef76b85e`.
Resource writes and preflight are verified with offline effect traces, not native
operator acceptance. Table service integration, full feat identity and generation
remain G4/G5 work. Source/context checks are optimistic preflight, not atomic CAS.

Table checkpoint (after `b3ee21a`): table-contract tests pass for 2d6 via SDK,
explicit overrides, same-name exact ID, multiple/text/Actor results, missing
documents, cycles, repeated totals, exhaustion, invalid formulas and typed denial.
All module source/UI/hooks/tests explicitly type-check; isolated Core module check
passes. Actions now use the SDK service; old private generation is isolated pending
G5 replacement. Macro adapter identity/digest comes from the copied native pack;
no arbitrary script is executed. Broader complex-dice draws use SDK evaluation,
while custom complex uniqueness is explicitly unavailable without a proven domain.

Generation checkpoint (after `aadbc9d`): private DataManager dice/name logic removed.
Maintained generation tests pass for custom/renamed classes, exact scoped references,
weapon/armor overrides, full traits/effects, legitimate repeated Items with unique
owned IDs, companion Actors, class restrictions, stale candidates, typed partial
creation failures and replay prevention. All maintained suites and explicit module
typing pass; released-Core isolated check/package passes, SHA-256
`5a4b371d71e62859eb7c1a11d41ec89b6fad9b6b799eca576d2e383bb0bc4877`.

The original copied native run produced **11 plans / 14 companion roots**, source
templates unchanged and Herbmaster weapon <=6 / armor <=2 proven. Its initial
embedded-Item hydration was incomplete; full-companion proof is corrected at G7 below. Deterministic dice substitute
and actual SDK table helper were used; this is not installed/native acceptance.
Pale One (`wLJV0VJT5I234obT`) is truthfully unavailable because its legacy starting
reference `morkborg.mork-borg-items,Intuitive Power` matches distinct IDs
`BtoSeh36zY8IqOQJ` and `YcKA0JHLezBYt3fz` in the same native pack. The user was asked
which canonical identity to select or whether to retain unavailable behavior. The user
subsequently directed that this issue stay pinned in the ADR for later review.
Native `documentFromPack` chooses the first name match; the two copied root records
differ only by `_id`, and no other copied reference selects either ID. Therefore
retain explicit unavailable behavior; neither identity is pinned without evidence.
No name-only tie break was introduced. Local evidence: module ignored
`temp/adr0001/native-generation.ts`, `/tmp/morkborg-adr0001-native-generation.json`.

Public `world.assertRevision` in the released implementation can throw a plain
Error. Module guards compare the public snapshot and translate revision retirement
to typed conflict/not-ready, preserving unexpected-error sanitization. No Core
change or external blocker is inferred. Native permission for Actor creation is
enforced on create; public zero-op commit preflights bound subject/store only.

### Packaged presentation checkpoint

After `21e7b18`, form dialogs share one composition, using SDK confirmation and
rich-content/URL services. Removed unused alternate roll/formula paths. Item
pickers consume scoped loading/ready/failed catalogs, retire on access/context/
connection signals and expose retry. Observer controls are read-only.

Actual Chrome CDP pointer and keyboard input against the G5 archive reproduces
unsafe Item `onerror` execution (count 1); the same description on the G6 archive
executes none. Maintained `content-safety.test.ts` also checks retained safe prose,
missing-die truthfulness and source preservation. Escape worked in the predecessor
Item dialog too: it is retained behavior, not a failing-before claim.

Fifteen browser cases pass: safe content; Rest select/Tab wrap/Escape/focus return;
actual Core confirmation shell; picker loading, ownership-only context refresh,
stale response rejection, denial, retry, valid empty, disconnect/reconnect and
search preservation; custom select; raw manual 20 with Strength -3 and GM visibility;
observer controls; HP 1234/5678 at 360/768/1280/1920 in both host appearances.
Module yellow/black/pink remains intact. Mobile More/Escape works and the public
footer element registers. This harness uses actual packaged UI/public SDK/Core
confirmation/editor with in-memory requests: full host tool clearance, nesting,
native authority, cross-session recovery and native inline-reference acceptance
remain pending. No screenshot-only acceptance is credited.

G6 archive SHA-256 `545b074d924b1222e9139426fe2f361265911c1e41de4d27b61363bc6fd1c2bd`;
local driver/results `/tmp/morkborg-adr0001-browser/{browser-tests.mjs,browser-results.json}`.
All maintained suites, explicit source/UI/hook typing and isolated package/check
pass. G6 remains qualified until required installed/native acceptance.


### Released-host and installed UI checkpoint

G6 commit: `18bc9ceee9a965b877b23d69cf0b5d2d85ccf1fa`. The subsequent G7 slice
sets Core >=0.19.3, module API >=1.5.0 and UI API >=3.2.0 with matching CI/release
pins. These are delivered public dependencies, not a blanket API 1.6 bump.
Module version remains 0.8.3; no release action was performed.

All **13 maintained suites**, explicit source/UI/hook typing, module check and
isolated packaging pass. Final archive SHA-256:
`c5676bc0d2c9144c3cf6b4f3bf0854cd799395b1eea6081003408021ee3481c4`.
Actual released Core development source loading and production archive-only loading
pass. **13 installed integration cases / 24 actual-pointer/keyboard browser cases**
pass, zero browser runtime errors. The real Core FloatingHUD clears expanded More;
styles are checked with Core-only CSS. Resource/name drafts survive asynchronous
source updates; permission changes close editors. Manual combat sends only the
appropriate raw fields, and real Core dice execution verifies the same inputs.
Late feedback/status retires even on ownership-only context events.

Installed execution exposed two assumptions that mocks had missed: compendium
queries operate on raw fields before synthetic pack/UUID decoration, and hydrated
UUID reads can return raw source without UUID. Exact request identity is added to
a clone, validated and fenced consistently. Plain released world-retirement errors
are narrowly mapped to typed conflict/unavailable; unexpected errors stay sanitized.
These have actual-host failing-before evidence and maintained regressions.

The [installed evidence ledger](../audits/evidence/2026-10-18-installed-checkpoint.md)
records case inputs, predecessor failures, package/output identities, qualifications
and reproducible runners. It also corrects the earlier companion evidence: full
embedded Item rows are now reconstructed and incomplete companions are rejected.
The 11 selected native plans retain 14 complete companions and unchanged sources;
this is not a claim that every class/outcome succeeds.

User-requested version-history verification inspected every local tag 3.0.0–6.0.1
in isolated copies: all 21 readable snapshots retain Forlorn Philosopher's broken Hegelian Owl result
and both Pale One feat IDs; 3 snapshots are unreadable, not repaired. See the
[portable identity ledger](../audits/evidence/2026-10-18-native-identities.json).
Forlorn table `DfILdvixuR0LyIcT`, row `RaRYtTXoANahK7PP`, references missing
`Compendium.morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf`; matching Owl name at
`HLu7lgwoNPlhfx3W` is insufficient canonical evidence. Retain unavailable for that
branch, without substituting or changing the reference checkout. Pale One remains
pinned unresolved per user direction. These are native data issues, not Core blockers.

G8 awaits the pending bundled disposable Foundry 14 endpoint/world/build/account
and scoped fixture/settings/permission-write/cleanup authorization request.
No native endpoint or production Core was contacted. AdditionalAbilities scope,
native hooks and the full MB-A01–09 matrix remain open; MB-A10 is N/A for this
implementation's evidence-backed no-persisted-repair decision. All test services
were stopped. G9 does not authorize closeout while this acceptance remains pending.

Operator update after isolated qualification: the user supplied `localhost:30000`,
Foundry 14, passwordless GM, in response to the bundled disposable-world request.
Verify the active world, exact build/native identity and available roles before
fixtures; native results have not yet been credited at this checkpoint.

### Native runtime version and first acceptance slice

Prior installed checkpoint commit: `007aca9` (G7). The operator supplied world
`morkborg` at localhost:30000, Foundry 14.367, native 6.0.1. All 43 served rule/schema
files match the pinned tag, whose checkout manifest still says6.0.0. Preserve both
identities. The actual native 503 unsupported-version class-catalog failure justified
extending world setting/default provenance through exact patch 6.0.1, without
claiming other versions. Same endpoint now200/12 classes; future 6.0.2 remains503
before effects in maintained actual-Core integration (14 passing cases).

Archive `fc7dc6d7e41d30cefad0797ca96be3401705e584ee5279c379a62db8e0d97b7b`,
module 0.8.3 unchanged, installed in a fresh Core 0.19.3 API with separate data.
The [native runtime checkpoint](../audits/evidence/2026-10-18-native-runtime-checkpoint.md)
records exact fixture cleanup, previous-world source preservation and qualifications:
five native persisted inventory cases, four unsupported-type cases,12 class
previews (11 success/6 selected companions; Pale 409), and live exact identity reads.
No settings/permission/chat artifacts were introduced by these probes.

Served Foundry registration code confirms additionalAbilities defaults to client
scope on14.367; it is not a world setting/service-account rule. Live pack reads
retain both Pale IDs and the stale Owl reference. No canonical replacement is
selected. G8 is partial: native UI/settings/actions/resources/full role and recovery
acceptance remains pending. Computer Use has no available browser; connected
browser or explicit isolated CDP authorization and non-GM account access have been
requested. No Core limitation is inferred from that tooling/access gap.

### G5 follow-up: operator-generated Pale One evidence

The operator supplied Brevel, a native-generated Pale One on Foundry14.367/native
6.0.1. The [comparison and regression evidence](../audits/evidence/2026-10-19-brevel-generation.md)
confirms compatible resource formulas, the starting feat and rolled blessing.
The new owned feat has no source provenance; it cannot select either duplicate
Intuitive Power source ID. The pinned identity decision remains open. Pale One
and Forlorn Philosopher exist; the stale Hegelian Owl result is a companion branch,
not a class named "Forlorn Owl".

The comparison exposed a module defect: generation translated native legacy
`vision` defaults into modern token sight. Brevel's stored native sight is false.
Generation now leaves absent sight to native creation and preserves explicit
companion token source. Same-input source and installed-route regressions reproduce
the old forced setting and verify its removal. This is a post-qualification change;
the previous native matrix remains evidence for its recorded artifact. Fresh native
creation with the amended payload has not been rerun. No world writes or new native
acceptance are claimed by the operator-export comparison.
