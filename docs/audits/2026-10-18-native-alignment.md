# Mörk Borg native data and behavior alignment audit

**Date:** October 18, 2026  
**Status:** Active; remediation in progress. Execution qualifications are recorded below.
**Implementation plan:** [Module ADR-0001](../adr/0001-native-data-and-behavior-alignment.md)

## Conclusion and evidence boundary

The audited baseline built against Core 0.19.3 but had substantive native parity
defects. Current implementation dispositions and executed qualifications are recorded
in the implementation ledger below. These include incorrect carrying weight, inventory consolidation that
can delete the item it intends to retain, resource/action differences, discarded
class equipment dice, and table resolution by name rather than document identity.
Existing passing tests do not cover these behaviors with native-shaped data.

This is a source, stored-document and controlled execution audit, not just a UI
observation report. Native Actor/Item preparation, character generation, settings,
attacks, defense, abilities, powers, rest, advancement, Omens, Broken, feats,
initiative, morale/reaction, sheets, macros and content references were examined.
The module's adapter, routes, data manager, sheet/tabs, generator, item dialogs,
roll dialogs and tests were traced against them. Core contracts were inspected
read-only to distinguish module work from possible external limitations.

At discovery, no live Core/Foundry connection, native browser acceptance, world
write or rendered interaction was performed. Subsequent isolated installed/browser
execution is recorded separately below; no native-world acceptance has occurred. Controlled native functions ran with
mocked dice/presentation and in-memory actors. UI risks below are source findings
unless explicitly identified otherwise. This audit does not claim every native
feature is supported or every possible input has been tested.

## Baseline

| Component | Observed state |
| --- | --- |
| SheetDelver module | 0.8.3, `main`, `d9d250ca96c31d978f902850e51a8c7a9300c7a6` |
| Core | Released 0.19.3 checkout, `90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1` |
| Public contracts | SDK 3.4.0; module-api 1.6.0; UI 3.2.0; roll 1.0.0 |
| Baseline module requirements | Core >=0.18.0; module-api >=1.1.0 <2.0.0; UI >=3.1.0 <4.0.0; roll >=1.0.0 <2.0.0 |
| Baseline CI/release host | v0.18.0 |
| Local native reference | Core workspace `temp/morkborg`, clean at `d850c094a9452d752307221f42245a73b66bdfbb`, exact lightweight tag `6.0.1` |
| Native version qualification | `system.json` still says **6.0.0**, compatibility minimum/maximum/verified **14**; changelog/tag say 6.0.1. Record both; neither proves a running world's reported version. No claim about the latest online release. |
| Native pack contents inspected | 218 Items (12 classes), 46 RollTables / 601 embedded results, 26 Actors, 5 Macros, excluding folder records |

Native source citations in this report refer to that pinned checkout. The portable
[native source tree](https://github.com/fvtt-fria-ligan/morkborg-foundry-vtt/tree/d850c094a9452d752307221f42245a73b66bdfbb)
identifies the same revision. Pack databases were copied to an isolated directory
before opening them; the original reference was not opened for writes. Modern
stored table results include `documentUuid`; weapons store `handed` as `"1"`/`"2"`.
No ActiveEffect entries were found in the inspected Item records. That observation
does not prove arbitrary world effects or add-ons are supported.

The earlier [Core compatibility review](2026-10-18-core-0193-compatibility.md)
is retained as predecessor evidence. MB-C01–04 remain open and are incorporated
below; its statement that native rules/settings had not been audited describes
that earlier review, not this expanded one.

## Behavior and architecture to retain

- Native and module individual initiative use d6 plus Agility; the HUD's final-total
  input is a deliberate host contract, separate from sheet raw dice.
- Melee Strength/ranged Presence selection, basic ability bonus bands, starting HP
  minimum 1, and starting powers minimum 0 match the inspected native algorithms.
- The controlled fed short-rest case healed by the same amount; the defect is its
  additional power write. Get Better preserves current HP in both implementations.
- The module already reads compendia through the caller-bound request runtime and
  uses Core Actor lifecycle/document operations. No privileged cache disclosure or
  need for a replacement transport was established.
- Existing roll-visibility tests and responsive/HUD contracts remain regression
  obligations. Consolidation must preserve these working boundaries.

## Findings requiring correction

Priority P1 means incorrect results, unsafe mutation or an essential existing
workflow; P2 means a user-visible gap or supporting qualification. IDs are stable.

### MB-N01 — native inventory fields and preparation diverge (P1)

Native `module/actor/actor.js` and `module/item/item.js` calculate equipment weight
using `carryWeight`, `carried`, quantity rounding and container membership.
Container space uses **containerSpace**, a different measure; uncarried containers
and their contents are excluded from the character's carrying total.
[rules.ts](../../src/logic/rules.ts) instead sums `system.weight * quantity` across
all items. An actual native-method probe with `carryWeight: 2, quantity: 2` returns
**4**, while the module returns **0**. The prepared-actor test currently supplies
the invented `weight` field, masking the discrepancy.

[EquipmentTab](../../src/ui/EquipmentTab.tsx) independently calculates container
usage from carrying weight, while the adapter computes another total. Armor DR is
also repeated in the Violence tab and server. Zero quantity becomes one through
several `|| 1` conversions. The native getter has its own zero-quantity quirk:
record it rather than silently deciding that every zero means one.

**Required outcome:** one source-preserving preparation model for native carrying
weight, capacity, carried/equipped state, container membership/space, armor tiers,
and item categories. Distinguish source fields from derived properties. Cover
fractional weights, missing legacy `carried`, uncarried/zero-weight containers,
membership changes and malformed references. Respect the world carrying setting.

### MB-N02 — duplicate inventory views can trigger destructive consolidation (P1)

`categorizeItems` includes ammo in both `equipment` and `ammo`. EquipmentTab
concatenates both groups for rendering and **Organize Inventory**, groups by
lowercased name, sums quantities, then updates the first item and deletes the rest
without awaiting successful completion. A single ammo item of quantity 3 becomes
two entries with the same ID; its proposed operations are quantity **6**, then
**delete that same ID**. The probe executed the real categorizer and reproduced
the caller's transformation; it did not execute a browser click or document write.

Distinct items with the same name may also have different damage, effects, flags
or container references. Name equality is not sufficient for destructive merging.
Container moves issue independent unawaited membership writes; nested containers
are not rejected even though native `allowedContainerItemTypes` excludes them.
Equipping armor/shields patches only that item; native `equipItem` first unequips
others of the same type. Tier controls offer 0–3 regardless of the armor's maximum.

**Required outcome:** render each canonical owned ID once; retain the keeper;
never merge by name alone. Until a demonstrably lossless consolidation operation
exists, remove/disable the destructive convenience action with an explanation.
Sequence validated module-owned operations over the public document runtime;
handle failure without claiming an atomic transaction that the SDK does not offer.
Keep references intact and enforce native equip/tier/container constraints.

### MB-N03 — attacks, defense and manual rolls have split authorities (P1)

Native `actor/attack.js`, `defend.js`, `test-abilities.js` and `config.js` establish:
melee uses Strength; ranged uses Presence; encumbrance adds DR only to appropriate
Strength/Agility tests; armor **maximum** tier contributes defense/agility penalties,
while **current** tier determines reduction. Native defense distinguishes natural
critical/fumble results and doubles incoming damage on a failed fumble. Native
attack decrements the selected `ammoId` when `usesAmmo` and `trackAmmo` apply.

[MorkBorgAdapter](../../src/server/MorkBorgAdapter.ts) omits ammo consumption and
defense critical/fumble handling, chooses the highest equipped armor tier instead
of the native first equipped armor, and accepts client `modifiedDR` as final.
[MorkBorgRollModal](../../src/ui/components/MorkBorgRollModal.tsx) adds encumbrance
to ranged attacks too and omits armor penalties. No unarmored Defend control exists
in [ViolenceTab](../../src/ui/ViolenceTab.tsx); its controls are attached to equipped
armor/shields. Native defense is actor-level and works without armor.

Manual raw d20 values are converted to numeric formulas, losing the natural-die
term used to detect crits. Manual damage replaces the entire expression, bypassing
weapon modifiers/critical multiplication; manual incoming damage is collected but
the server rerolls `incomingAttack`. Multi-die damage inputs are capped using a
single die's faces. Advantage controls send `rollAdvantageMode`, but the engine
never consumes it. The dialog displays a power's default `1d20` while execution
adds Presence; party initiative displays the individual formula but rolls `1d6`.

**Required outcome:** a shared action plan describes formula, natural dice, DR
contributions, resources and supported choices. Server execution recomputes from
current authorized source/context; client formatting cannot change rules. Preserve
the deliberate distinction between sheet raw-die entry and HUD final-total entry.
Remove unsupported advantage choices or implement an explicitly documented
addition; never present a control that silently does nothing.

**Native qualification:** native attack's `isHit` checks **total** 1/20 despite its
comment saying natural 1/20. Its defense fumble expression appends ` * 2` without
parenthesizing composite damage. These are upstream ambiguities, not proof of
module-only bugs. Record/test the selected native behavior and proposed deviations
explicitly; do not silently replace the oracle with remembered tabletop rules.

### MB-N04 — missing data creates plausible dice and successful no-ops (P1)

Unknown/missing item IDs are normalized to `{}`. An attack without a damage die
receives **1d4** in rules, server, display and editor. The native schema default
for a newly created weapon is 1d1; this does not license substituting either value
for an unreadable existing weapon. Unknown actions fall back to a default roll
description; the sequence engine has no general `dice`/`default` execution branch,
so it can post a success response/card without the requested roll.

Feat routing also splits between ID and name. The generic feat path falls back to
1d20 when a roll-label feat has only a macro. Formula handling is duplicated in
rules, adapter and an unreferenced UI resolver, with missing variables replaced
by zero. Macro execution is not a public arbitrary-script SDK capability.

**Required outcome:** validate action, item ownership/type, formula inputs and
supported feat capability before dice/chat/writes. Preserve native formula
metadata; expose unavailable/unsupported states. Support known reviewed macro
behaviors by stable identity, not magic names or arbitrary code evaluation.

### MB-N05 — rest updates differ substantially from native behavior (P1)

Native `actor/rest.js` heals on a fed, uninfected short rest only; infection and
starvation damage occur on long rest and both can apply. Negative HP is retained.
Powers and zero Omens reset only on a qualifying fed long rest.

Executed native/module comparison (starting HP 5/10, powers 1/4):

| Input / controlled dice | Native result | Module result |
| --- | --- | --- |
| Fed short rest, heal 2 | HP 7, powers 1/4 | HP 7, powers **4/4** |
| Infected short rest | HP 5; no roll; powers 1/4 | Infection d6, HP 0 with a 6; powers **4/4** |
| Long rest, starving and infected; damage 4 then 6 | Both rolls, HP **-5**, powers 1/4 | Only infection roll; HP **0**; powers **4/4** |

The engine always writes power value from maximum, even when recovery is skipped.
It also invents an Omen die when no class is present; native `rollOmens` returns
without a class. Correct all rest combinations and avoid unrelated resource writes.

### MB-N06 — advancement equality and extra inventory mutations differ (P1)

Native `actor/get-better.js` improves HP on `6d10 >= maxHP`; the module uses `>`.
Native ability results equal to the old value increase it, except the special
roll-of-one decrease rule; the module leaves equality unchanged. With max HP 10,
HP check 10/increase 2 and ability values/rolls 2, native produces max HP **12** and
abilities **3**; module leaves max HP **10** and abilities **2**.

Native scroll debris draws/presents a table; the module also creates an owned Item.
Separate that convenience from native parity and keep it opt-in if retained.
Verify limits -3/+6, unchanged current HP, silver and source preservation.

### MB-N07 — power restrictions, failure mutations and resource controls diverge (P1)

Native `actor/powers.js` gates on remaining uses, rolls Presence vs DR12, presents
failure damage, and decrements uses. It does **not** automatically patch HP or
reject medium/heavy armor. The module rejects armor tier >=2, checks a nonexistent
`twoHanded` field and consumes a use without rolling. A native-shaped medium-armored
actor rolls successfully in the native function; the module reports a restriction.
On a controlled failed cast with damage 2, native HP stays 5; module writes 3.
This is especially misleading for native Heretical Priest content, whose Armored
Caster feature explicitly permits medium armor, but the native routine does not
encode either the general restriction or that exception.

The module selects `Arcane Catastrophes - To Leave Cube-Violet` for every fumble;
native config selects the root `Arcane Catastrophes` table. Both tables really exist,
so this is a wrong-table result, not just an unavailable-table case. Native stored
content includes nested table references; the module's name lookup cannot expand
them correctly. Omens currently opens static advice labeled “Spend Omen” without
spending or offering native roll-Omens; daily power rolling exists only inside rest.

**Required outcome:** align with native implemented behavior, display descriptive
limitations without inventing executable restrictions, and document any separately
selected automation. Share power previews/execution; use the correct table; provide
truthful resource controls. Do not infer formulas or class gates from prose/names.

### MB-N08 — private table/dice engine discards authoritative content (P1)

The former `DataManager` (baseline `d9d250c`) parses a table's formula as a single
die size, uses Math.random, chooses only one result, falls back to the last result,
ignores replacement/uniqueness semantics and resolves documents by name. A `2d6`
table with random .99 yields its 2–6 band instead of 12's band. A result targeting
document B returns same-name document A if A occurs first. Modern `documentUuid`
is ignored; Actors/nested RollTables are treated as item-name misses. The native
packs contain **9 Actor references and 4 RollTable references** in table results.

The data manager's separate formula evaluator supports a limited grammar and
silently converts other expressions to partial numbers/zero. Broken rolls a d4,
also makes an unused random table draw, then uses hardcoded English outcomes
instead of the actual selected content. These are replaceable duplicate services.

**Required outcome:** use SDK `rolls.roll` for formula evaluation and caller-bound
`tables.draw(uuid, { rollOverride: total })` for exact selection; resolve canonical
documents. Module orchestration must handle returned multiple/text/Item/Actor/table
results, recursion/cycles and the native workflow's uniqueness requirements.
The SDK draw primitive does not itself promise recursive draws or native table
depletion; test and supply this orchestration without creating another dice parser.
Never fabricate content when access or a reference is unavailable.

### MB-N09 — SCVM Factory ignores class choices and loses generated content (P1)

Native `scvm/scvmfactory.js` consumes class starting fields, formula overrides,
declared pack/name pairs, configured UUIDs, multiple results and separate Actors.
The module calculates `weaponDie`/`armorDie` but never passes them to its draw;
class-specific equipment and scroll restrictions are lost. Using the copied native
packs and random .99, Occult Herbmaster (`1d6` / `1d2`) receives a **Zweihänder /
Heavy Armor** from full-range tables. All classes unchecked still selects a class
at the server (Pale One in the controlled input), despite the UI disabling its
reroll button. An empty catalog generates an invalid “successful” character (MB-C02).

The UI duplicates 12 class IDs/names; the server ignores `allowedScvmClasses`, drops
the pack portion of class starting lines and uses unqualified names. Class starting
rolls repeat freely, whereas native class-roll workflow avoids repeated totals.
Name-specific prose branches duplicate metadata and do not match some current
native names. Actor results (wagon, donkey, followers) cannot be returned/created;
only Item/Table packs are declared. A client-held preview is posted later directly
to generic actor creation without validating its generation assumptions again.
The generated `traits` string is also omitted from the creation payload: description
contains only class description and classNotes, while notes repeats classNotes.

**Required outcome:** a caller-scoped server catalog and generation plan driven by
native fields/identities. Honor effective class choices and declared settings;
preserve classless as a real template. Carry every required result or stop before
creation with an actionable explanation. Validate all planned documents and current
permissions/context before writes; surface any partial creation accurately. Preserve
source templates and references; avoid rerolling silently when a candidate expires.

### MB-N10 — world rules/settings are not consumed (P1)

Native `module/settings.js` registers world `trackCarryingCapacity` (true),
`trackAmmo` (true), `hitAutomation` (true), and `allowedScvmClasses` ({}). The module
declares no world settings and applies fixed policies instead. Native
`additionalAbilities` has **no explicit scope** in this source: resolve the selected
Foundry registration default before declaring it world-scoped. Client preferences
include `deleteZeroQuantity`, color/font schemes and last SCVM selection; they
cannot be treated as service-account world settings.

**Required outcome:** versioned, proven declarations and public immutable world
context reads for applicable world rules, with context refresh and stale-action
fencing. No default for unavailable/unsupported values. Distinguish a stored world
value from a proven registered default. Track client preference policy explicitly.
No module-owned socket, settings database or privileged lookup is needed for the
four proven world settings; current Core already provides the contract.

### MB-N11 — item editor writes unsupported handedness values (P1)

Native schema/config/editor and all inspected weapon records use numeric/string
1/2 for `system.handed`. [ItemModal](../../src/ui/components/ItemModal.tsx) offers
`1h`/`2h`. The power engine checks a different `twoHanded` field. Missing weapon
damage is also displayed as a real 1d4 value. Sheet tier buttons do not follow the
native character sheet's disabled-above-max controls. The native standalone Item
editor itself allows independent max/current selection; stronger validation there
would be a deliberate improvement, not a proven native enforcement rule.

**Required outcome:** native-shaped controls, explicit unavailable values and common
validators. Determine whether malformed handedness was persisted in real documents
before planning a repair. Reading native fields correctly needs no migration;
persisted, unambiguous `1h`/`2h` corrections may need an explicitly scoped Core-owned
maintenance migration. Never guess how to restore lost consolidated items, HP,
random starting gear or unsupported custom data.

### MB-N12 — feat/decoction behavior invents additional mutations (P1)

The native Create Decoctions Macro in the inspected pack performs `table.drawMany(2)`
and posts a d4 doses roll. It does not create inventory Items. The module bypasses
macro identity with a name check, forces unique names with a five-retry loop, assigns
the dose total to **each** created item, strips effects from resolved templates and
invents generic misc Items if resolution fails. Its client shim passes an array to
the single-document `runtime.documents.items.create` contract. Actual-host outcome
of that payload remains untested; the contract mismatch is source-confirmed.

The separate Brew button checks `categorizedItems.classes`, which the categorizer
does not produce, although the actual Create Decoctions feat can still reach a brew
path. Native formula/macro/passive feat precedence is not modeled consistently.

**Required outcome:** reviewed feat capability dispatch from owned identity and
native metadata. Preserve the native draw/roll workflow; any inventory-grant addition
needs explicit semantics and document operations. Unsupported macros explain the
limitation; they never become a fallback d20 or fabricated item.

### MB-N13 — custom presentation bypasses shared safety/lifecycle behavior (P2)

ItemInfoModal and generator descriptions use raw `dangerouslySetInnerHTML`; native
UUID/inline-roll content is not deliberately routed through the public safe rich
content pipeline. This is a sanitization/link-behavior concern, not an executed
security exploit. Custom info/edit/rest/confirmation overlays duplicate Escape,
backdrop and stacking logic. The custom roll frame has partial focus handling but
does not inherit Core's corrected nested-dialog behavior automatically. Ability
blocks are clickable divs; controls need keyboard and accessible-label review.

The old RollModal is imported/rendered conditionally by EquipmentTab, but its
`openRollModal` function has no callers. The UI formulaResolver exports have no
callers. The sheet calculates an unused local categorization and supplies fallback
derived data alongside the actual prepared model. These are concrete consolidation
candidates, not instructions to replace `useActorSheet` or delete files blindly.

**Required outcome:** SDK confirmation/rich-content/shared roller where the contract
fits; one accessible module composition for system-specific flows that do not fit.
Keep native raw-die semantics and the distinctive palette. Use public layout
clearance; validate keyboard, nested dismissal, focus return, mobile tools and long
content. Remove proven-unreachable parallel paths after tests protect live paths.

### MB-C01–04 — carry-forward Core adoption work (required)

| ID | Established evidence | Work in ADR-0001 |
| --- | --- | --- |
| MB-C01 | Actual routes turn typed 403/409/503 SDK errors into 500/internal | Preserve SDK errors across source and packaged loaders; sanitize unexpected errors; test concealed 404 and owner authorization. |
| MB-C02 | Empty visible packs return 200/success with missing Class and null/undefined Item | Per-workflow dependency/readiness validation, fail before generation, truthful empty/error UI. |
| MB-C03 | Picker/generator lack explicit context retirement and actionable retry | Retire/refetch on context, ownership, session/world/reconnect; reject late responses and stale candidates. Mounted behavior needs verification. |
| MB-C04 | Toolchain still pins Core 0.18.0 | Qualify released Core 0.19.3 and set justified Core/API minima and coherent workflow pins during implementation. |

An additional route boundary check belongs with MB-C01: actor reads currently use
the default visible-detail access rather than OWNER preflight, and the request can
supply a speaker. Later mutations remain caller-authorized by Core, but effects
such as rolls/chat can precede denial. Test operation-specific caller authority and
validate attribution before side effects. This is not proof that Core permits
unauthorized document writes. Ordinary stat rolls also load unrelated generator
packs; remove that accidental dependency.

## Features present natively but not fully represented here

These are scoped follow-ups, not permission to implement every native application.
The current module presents a character-oriented sheet for all Actor routes.

| ID | Native source / data | Gap and disposition |
| --- | --- | --- |
| MB-F01 | `template.json`, creature/follower sheets, morale/reaction functions | No type-specific creature/follower view or morale/reaction actions. ADR requires truthful unsupported/type-aware handling; full sheets are a follow-on feature. |
| MB-F02 | Container Actor schema/sheet; generation returns separate Actors | Generated companions/containers are part of generation completeness in N09. A dedicated container management UI is a follow-on. |
| MB-F03 | `miseries.js`, misery-tracker sheet | Misery tracking, animations and apocalypse presentation absent. Deferred feature; no maintenance or migration requirement inferred. |
| MB-F04 | `combat.js`, native initiative methods | Sheet party roll posts a result without native encounter reordering. HUD individual initiative already follows Core. Native turn-hook/party ordering remains separately scoped; label current behavior accurately. |
| MB-F05 | Enrichers, journal DRAW/CREATE tags, macro/hotbar hooks | Safe description rendering/reference resolution is required now. Native journal automation/hotbar and arbitrary script execution are not selected. |
| MB-F06 | Native additional abilities and `morkborgReady` / mutable CONFIG extensions | Four hardcoded ability controls; browser-only extension configuration cannot be inferred from packs. Resolve additionalAbilities scope and document supported configuration; dynamic third-party CONFIG execution is deferred. |

## Reuse and external capability assessment

| Need | Existing public capability / bounded module responsibility |
| --- | --- |
| Actor source, updates, realtime | Keep `useActorSheet`, prepared adapter, caller-bound document/item runtime; consolidate module rules above them. |
| Dice and tables | `rolls.roll`, `tables.draw` with numeric override, canonical `documents.fetchByUuid` / compendium reads. Module orders draws and enforces workflow-specific completeness/uniqueness. |
| Native world rules | `info.json.worldSettings`, `context.world`, `runtime.world`, `useWorldSetting`, context-revision checks. Client settings and runtime CONFIG are separate. |
| Context and privacy | Existing `world:contextChanged` includes ownership-only changes; do not require nonempty changed keys. Per-request compendium filtering already exists. |
| UI/chat | SDK confirmations, content/URL helpers, shared presentation and caller-bound chat; theme/custom body where needed. No copied host transport or modal shell without demonstrated need. |
| Persisted corrections | Existing Core migration catalog/hooks/maintenance only if a real repair is selected. No ad hoc actor mass-update on initialize or UI mount. |

No confirmed new Core blocker was established. The SDK table helper returns matched
rows/documents, not a full native recursive draw transaction; Item creation accepts
one document; client preferences and browser-only native methods are not remote
procedures. Reproduce a concrete unmet contract on released Core before proposing
external work. Do not import native browser classes into production or require a
Foundry browser to keep SheetDelver functional.

## Verification ledger

The preceding compatibility slice passed all three existing module suites,
explicit typing of all 35 module TS/TSX files, module checking and isolated
packaging on Core 0.19.3. Those results remain valid for unchanged product source;
they do not prove native rules acceptance. This audit added controlled probes,
not maintained product tests or source fixes.

| Probe | Observed evidence |
| --- | --- |
| P01 | Actual native Item/Actor weight methods 4 vs module 0 |
| P02 (three cases) | Actual native rest function vs module sequence: short-power refill, short infection and combined long-rest damage differences |
| P03 | Actual native Get Better vs module equality differences |
| P04/P05 | Actual native wieldPower vs module armor denial and HP mutation |
| P06 | Actual categorizer plus caller transformation duplicates one ammo ID and schedules its deletion; no browser/write |
| P07 | Actual getRollData invents missing 1d4 damage |
| P08/P09 | Actual table manager uses wrong 2d6 range and same-name document |
| P10 | Actual action engine replaces manual damage with numeric `4`, bypassing critical expression; synthetic roll terms are not native manual-die evidence |
| Copied-pack generation | Herbmaster gets out-of-range equipment; all-unchecked chooses a class; wrong catastrophe alias selects the real secondary table |

Supplemental local output: `/tmp/morkborg-native-audit-b3MnfJ/` contains copied pack
databases, decoded/reconstructed records, `probes.mjs`, `probe-results.json` and
`pack-probes.json`. The tracked report records the inputs/outcomes independently;
do not redistribute native pack prose as module test fixtures. Use minimal typed
fixtures with provenance or approved extraction during local acceptance.
The small probe script/results are also retained in this module's ignored
`temp/native-alignment-audit/` for the next implementation task.

Open verification: actual installed development/production archive behavior,
caller roles/ownership and context races, browser flows, native document hooks,
and every supported Foundry/native version pair. No source changes, services,
Git writes, release changes, or native-world changes were made for this audit.

Documentation validation: seven tracked/new Markdown files, 34 local links and
whitespace checks passed. Core and native-reference Git status remained clean;
module changes are documentation only and uncommitted.

## Implementation evidence — ADR-0001

Branch: `fix/adr-0001-native-alignment`. Existing docs checkpoint: `7429db2`.
Reverified clean native and Core references at the recorded hashes; no connections
or services started. Native qualification selected: Foundry 14, tag 6.0.1 /
manifest 6.0.0. v13 remains outside the evidenced claim.

Failing-before regression: `src/tests/native-alignment.test.ts`, executed with
released Core's tsx on unchanged product source: **20 fail / 1 pass**. Cases cover
native carryWeight, duplicate ammo IDs, absent weapon die, unsupported action,
all 12 rest combinations, advancement equality, medium-armor casting, power
failure HP scope, typed route status and empty generation. Expected resources
and writes derive from pinned native methods, not the module outputs. Local
full log: `/tmp/morkborg-adr0001-failing-before.log`. Tables/generation/settings,
manual actions and installed/browser acceptance remain open. No finding closed.

### Command boundary checkpoint

MB-C01/02 and MB-N04: corrected portions pass same-input source regressions;
20 baseline failures reduced to 16. `command-boundaries.test.ts` additionally
proves OWNER preflight options, stat rolls independent of unavailable packs,
invalid commands without dice/chat, concealed missing actors and sanitized 500s.
Explicit module typing passes. Core 0.19.3 module check and isolated package pass
(`/tmp/morkborg-adr0001-g1/`), archive SHA-256
`5ea07fd832086b09854b9f5d26ba1f96fdc898ed6e589f44cbd48d64aa07557f`.
Installed/native role checks and remaining command/formula validation stay open.

### Canonical preparation checkpoint

MB-N01/02/10/11: corrected native field preparation and disjoint ammo display
categories; name-based consolidation removed; numeric handedness editor and
lossless legacy read normalization. MB-N03 preparation now supplies first armor,
current reduction and maximum-tier penalties. Tests: native-inventory and corrected
prepared-actor fixtures pass; source round trips, invalid references, true/false/
registered-default/unavailable settings and revisions covered. Same-input baseline
MB-N01/02 passes; the expanded inventory test fails at carrying total 0 vs 3 on
`ccaf20f` and passes with the new model. Logs under /tmp/morkborg-adr0001-*.
All existing suites, explicit typing and isolated module check pass. Native setting
reads/changes and sequenced inventory operations still require execution.

MB-N03 upstream decision: official Bare Bones pp. 30–31 visually verified from
the publisher-linked PDF (hash and URL in ADR). Rules use natural crit/fumble and
double damage. Implement natural hit overrides and parenthesize complete fumble
damage before reduction, documenting deliberate native-code deviations.

`additionalAbilities`: v14 [public SettingConfig](https://foundryvtt.com/api/v14/interfaces/foundry.types.SettingConfig.html)
requires scope but gives no omitted-scope default. Registered native scope remains
a disposable-runtime check; do not declare it world-scoped by assumption.
Handedness read normalization needs no persisted mutation; actual affected worlds
are unknown. No migration catalog or historical recovery guess introduced.

### Native actions and inventory checkpoint

MB-N03/04/05/06/07 and inventory part of MB-N02: all 21 original regressions
pass. New native/RAW action tests cover negative-modifier natural critical,
modified-total fumble, whole composite damage, manual bounds, unavailable multi-die
manual, ranged/encumbrance and armor max-vs-current DR; no-automation rolls once
and offers a separate damage action. The standalone manual-damage case fails on
`540d3bc` (`4` vs `(4+1) * 2`) and passes unchanged after correction.
`inventory-actions.test.ts` proves same-name data preservation, exclusivity, tier
limits, nested-container rejection, source conflicts and no delete after a failed
container prerequisite. Native resource effect scope is corrected; table content
selection still awaits G4. Macro dispatch is explicit rather than fallback d20.

All maintained suites and explicit module typing pass. Isolated released-Core
check/package passes: SHA-256
`b3c0925fe46f0cc12d6dd4bd3c42224dc1dac8cf14fae252d4bdab17ef76b85e`.
No installed/native role, concurrent-write, resource-hook or browser acceptance
is credited from these in-memory traces. G3/finding dispositions stay qualified.

### Exact table and feat checkpoint

MB-N08 and table portions of MB-N07/12: action draws now use public SDK dice/table/
UUID document services. Exact Broken/root Catastrophes IDs replace copied/wrong
content. All selected rows and evaluated dice survive into caller-visible chat
evidence. Multiple/text/Actor references, cycles, missing/denied documents,
formula overrides, repeated unique totals and exhaustion pass maintained contract
tests. These correct the P08/P09 inputs (2d6 and same-name identity) recorded above.
Native macro precedence and reviewed canonical decoction Macro digest are enforced;
no name-only feat execution, generic item grants or per-item dose multiplication.

Explicit typing and isolated module check pass. G4 remains qualified pending
actual installed/native service/privacy execution; generator private services
remain MB-N09/G5 work. Nonreplacement is local orchestration, not native depletion.

### Authoritative generation checkpoint

MB-N09/C02: factory catalog now honors exact allowed class identities, uses Class
metadata and SDK dice/table services, preserves complete traits/starting content
and Actor companions, and refuses invalid/empty/stale selections. No hardcoded
class-name branches or discarded overrides remain. Source templates survive
unchanged; repeated legitimate Item templates receive distinct owned IDs.
Server candidates revalidate content/context before create; creation outcomes
retain confirmed writes and never automatically replay a partial/uncertain attempt.
Caller-authorized status reads preserve recovery without cached content disclosure.

Maintained generation and all preceding suites pass; explicit module typing and
isolated released-Core package/check pass. Archive SHA-256
`5a4b371d71e62859eb7c1a11d41ec89b6fad9b6b799eca576d2e383bb0bc4877`.
The original copied-content probe produced **11 class plans, 14 companion roots**,
all sources unchanged and Herbmaster bounds correct. Its initial embedded Item
hydration was incomplete; see the corrected G7 evidence below before claiming
complete companions. Dice were substituted; SDK table
helper was real. Installed/native permissions and lifecycle execution still pending.

**New native ambiguity:** Pale One's pack/name Intuitive Power reference matches
`BtoSeh36zY8IqOQJ` and `YcKA0JHLezBYt3fz`. Both descriptions match; identities differ.
Generation stops with conflict, never selects by name/order. The user directed that this identity question remain pinned in ADR-0001
for later review. Native first-name-match lookup supplies no canonical choice;
the two copied root records differ only by `_id`. Retain unavailable behavior. This is an upstream data ambiguity, not a Core blocker or a completed
12-class acceptance claim. MB-N09/G5 stays open until the selected disposition and
required installed/native verification are recorded.

### Packaged presentation and mounted-consumer checkpoint

MB-N13/C03: SDK-safe Item/class descriptions, shared form composition and public
confirmation shell replace competing presentation paths. Removed unreachable
alternate roll/resolver files. Picker current-state/retry/search behavior is
verified with actual Chrome pointer/keyboard input against the installed archive.
The G5 Item description executes `onerror` once; identical G6 input executes none.
New maintained content-safety regression passes. Predecessor Escape already worked
and is not counted as a new correction.

15 browser cases pass, including 8 width/appearance combinations, raw manual input
and visibility, select/Tab/Escape/focus return, observer controls, denied/empty
retry, ownership-only refresh, late response rejection and reconnect. HP 1234/5678
fits at 360/768/1280/1920, module colors retained; mobile More keyboard handling
and public footer registration verified. Actual SDK and Core confirmation/editor
are used; requests/documents are in-memory. Full host tool clearance, nesting and
native reference/permissions/lifecycle matrix remain open. MB-N13/C03 are corrected
offline with qualified browser evidence, not resolved native acceptance.

G6 package SHA-256 `545b074d924b1222e9139426fe2f361265911c1e41de4d27b61363bc6fd1c2bd`.
Driver/results `/tmp/morkborg-adr0001-browser/`; all maintained suites, explicit
module typing and isolated released-Core check/package pass.


### Released-host qualification and current finding dispositions

G6 was committed as `18bc9ce`. The following installed G7 slice is supported by the
[checksummed execution ledger](evidence/2026-10-18-installed-checkpoint.md):
13 maintained suites (original 21/21), explicit module/UI/hooks typing, module
check/package, actual released-Core development loading, **13 production integration
cases**, and **24 packaged browser pointer/keyboard cases**, all passing. Requests
use real Core Stores/world context/public caller services with a transport fixture;
browser session/requests are fixtures. No full Core HTTP/native-world acceptance
is inferred. Before and after evidence are identified separately in that ledger.

| Finding | Implemented correction and executed proof | Remaining acceptance / disposition |
| --- | --- | --- |
| MB-N01 | Native carrying/container/carried fields, immutable shared projection; native-inventory, preparation, source round trips | Corrected offline; MB-A01 native comparison pending |
| MB-N02 | Unique owned IDs, destructive organize removed, sequenced membership/equip/delete, stop on prerequisite failure; inventory-actions | Corrected offline; MB-A07 native write/hooks pending |
| MB-N03 | Shared DR/current-vs-max armor/native flags; natural crit and full-damage RAW decision; sheet raw combat vs HUD total; action/manual suites and real Core dice; Chrome raw payloads | Corrected with explicit native-code deviations; MB-A03/08 pending |
| MB-N04 | Missing formula/identity/variables unavailable, unsupported actions explicit, invalid inputs before effects; baseline/command/content tests | Corrected offline; native unsupported/permission handling pending |
| MB-N05 | All 12 rest combinations, negative HP, powers/Omens scope; native-alignment/action-parity | Corrected offline; MB-A04 native snapshots pending |
| MB-N06 | Advancement equality/bounds/current HP; removed extra debris inventory; action-parity | Corrected offline; MB-A04 native execution pending |
| MB-N07 | Presence/remaining powers, no invented armor gate or HP write, exact catastrophe root, separate resource actions; native/actions/table tests | Corrected offline; MB-A05 native execution pending |
| MB-N08 | Removed private evaluator/name resolution; SDK exact multiple/nested/Actor draws, valid-domain exhaustion, hydrated source identity; table/content suites and actual production generation | Corrected offline; MB-A05/06 references/permissions pending |
| MB-N09 | Metadata classes/overrides/full traits/embedded companions, source preservation, server-held candidate/recovery; generation suite, copied-native and real Core production routes | 11 selected plans/14 complete companions proven; Pale One and broken Forlorn branch explicitly unavailable; MB-A06 pending |
| MB-N10 | Four versioned native world settings, immutable context/default distinctions; real Core settings/access refresh and Chrome stale retirement | Corrected for declared settings; additionalAbilities registered scope and MB-A02 pending |
| MB-N11 | Native numeric handedness, max-tier controls, missing damage unavailable; Chrome Item edit, source tests | Read normalization selected; no persisted repair/catalog. Affected-world inventory unknown; MB-A10 N/A for this slice |
| MB-N12 | Owned feat capability/precedence, reviewed macro UUID+digest; SDK two draws/one dose result, no invented grants | Corrected offline; native macro presentation MB-A05 pending |
| MB-N13 | SDK safe rich content/confirmation/editor, one bounded form, labels/focus/keyboard, buffered edits, real footer/HUD clearance; 24 Chrome cases | Executed isolated UI correction; native/full-host nesting/inline reference MB-A09 pending |
| MB-C01 | Preserve SDK/known world-retirement status, OWNER/hidden boundary, sanitized 500; actual production Core roles/visibility/revocation | Isolated qualification passes; native/session boundary MB-A08 pending |
| MB-C02 | Denied/unavailable/empty catalog distinctions, no invalid candidate success; actual Core packs and maintained suites | Isolated qualification passes; native catalog MB-A06 pending |
| MB-C03 | Mounted refetch and late picker/action/generation/status retirement on keys-empty/access/reconnect; no replay; actual Chrome and Core context cases | Isolated qualification passes; native cross-session MB-A08/09 pending |
| MB-C04 | Core >=0.19.3, module API1.5/UI3.2 justified, coherent v0.19.3 workflow pins, explicit CI module typing | Corrected and executed against released Core; no version/release bump |

**Identity disposition:** user requested historical verification for the Forlorn Owl
reference. All 24 local tags 3.0.0–6.0.1 were copied/read where possible; the 21
readable snapshots contain the same stale reference and two Pale feat identities.
Three tagged DB snapshots are unreadable and were not repaired. The
[metadata-only history](evidence/2026-10-18-native-identities.json) preserves exact
IDs/revisions/failures. No same-name Owl substitution or Pale tie break is selected.
This is not proof about published ZIPs or additional supported runtime versions.

The G5 “complete companions” statement is qualified above: only G7 reconstructed
all 13 embedded Item rows and rejected ID-only companion payloads. The current
copied-native run proves 11 selected plans/14 full companions, source preservation
and equipment bounds; Forlorn total 2 and Pale One are explicitly unavailable.
The native record defects remain pinned; do not close MB-N09 from selected successes.

No demonstrated Core blocker or selected persistent migration exists. G8 awaits
one bundled disposable Foundry14 environment/account + fixture/settings/access
write/cleanup authorization request; no production/native contact has occurred.
MB-A01–09 remain pending, MB-A10 N/A for this implementation. The active audit is
not resolved or archived. Full NPC sheets, Misery, encounter ordering, arbitrary
macros and browser-only add-ons remain deferred; generated companions stay in scope.
Task-owned browser services have been stopped; no service retained.

Operator update after isolated qualification: the user supplied `localhost:30000`,
Foundry 14, passwordless GM, in response to the bundled disposable-world request.
Verify the active world, exact build/native identity and available roles before
fixtures; native results have not yet been credited at this checkpoint.
