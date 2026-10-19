# Corrections exposed by full installed/native execution

This extends the [first runtime checkpoint](2026-10-18-native-runtime-checkpoint.md).
G8 remains in progress. Same world/version: **morkborg / Foundry14.367 / native6.0.1**.
The operator authorized isolated Chrome CDP and passwordless player `ptest`;
`doratheexplorer` is reserved for the service account and was not used interactively.
The temporary isolated Core connection remains the authorized Gamemaster account;
no account role or credential was changed.

## Installed form loading

The actual Core app loaded the archive and Actor page, but opening a roll failed
with **createPortal is not a function**. Released Core0.19.3's installed import
rewriter maps `react-dom` to its shared React namespace, which has no createPortal.
The previous composed harness resolved real react-dom and missed this boundary.
Core remains read-only; no unsupported host import or invented SDK prop was added.

The maintained browser runner now executes the **actual released import rewriter**
and initializes the same shared SDK/React globals before loading the archive.
`installed-smoke.mjs` reproduces the old crash on archive `fc7dc6…`:
`/tmp/morkborg-native-portal-before.log`, `/tmp/morkborg-browser-v2Uigr`.

System-specific forms now use standard HTML `dialog.showModal`, escaping ancestor
transforms through the browser top layer. Browser containment and cancellation
replace the unsupported portal and manual background-inert handling. Bounded
first/last Tab cycling retains the required form keyboard behavior; native browser
Tab otherwise reaches browser chrome. SDK confirmation/rich editor remain reused.
Actual full-host Rest focus progression was measured before/after the Tab change.
Rich editor save/Escape, focus restoration and all24 maintained browser cases pass
through the real import rewriter, with zero runtime errors.

A live owner-sheet pointer/keyboard roll entered raw Strength20 with modifier−3,
then GM visibility. Native ChatMessage `PPYDX5xe7M3u56fR` records formula `20-3`,
total17, author `ptest`, the exact fixture Actor speaker, and both GMs plus author
as recipients. This proves live behavior, rather than only a request-shaped mock.
The native acknowledgement is an envelope containing `result[0]`; driver assertions
were corrected to inspect that actual ChatMessage without changing product behavior.

## Native resource fields

Live source includes `powerUses.min` and `omens.min` equal0. Foundry merges object
updates and retains those native fields. The module's expected-state model had
replaced whole reset objects, causing a **409 after one confirmed write** on daily
powers/Omens and fed long rest. The conflict report was truthful, but the valid
operation should have completed. Expected native resource shapes now appear in
the shared fixture and `resource-shapes.test.ts`.

The same three regression inputs fail409 before and pass200 after. Resets now
patch only `value` and `max`, preserving native minimum/other resource data and
strict post-write source fencing. Live driver expectations initially omitted min;
those shape-assertion corrections are not counted as product failures. The actual
partial-write409 responses and maintained route regression are separate evidence.

- Before: `/tmp/morkborg-native-resource-actions-before.json`,
  `/tmp/morkborg-native-resource-shapes-before.log`.
- After: `/tmp/morkborg-native-resource-shapes-after.log`,
  `/tmp/morkborg-native-resource-actions.json`.

**16 live installed cases pass**: all12 rest combinations, negative HP under
combined starvation/infection, retained nonzero Omens, Presence-based power
failure/fumble/critical with no HP/inventory addition, and explicit daily powers,
Omens and spending. Dice/formulas and persisted resources were compared directly.
Independently, the actual native rest function executed all12 combinations and
medium-armor casting on a separate native Actor; **13 cases pass**. Its real Roll
evaluation was observed, without changing RNG or manufacturing outcomes.
Output `/tmp/morkborg-native-resource-oracle.json`.

Live advancement was checked until an actual `6d10 == maxHP33` and both ability
bounds were observed: **22 module trials /16 independent native trials**. Every
trial checks native-derived HP/ability/silver expectations, unchanged current
HP−3 and no inventory grant. This is not a substituted successful random result.
Outputs `/tmp/morkborg-native-advancement.json` and `…-advancement-oracle.json`.

## Remembered combat choices

Actual native attack UI submission of base DR14 and target armor1d2 persists
`flags.morkborg.attackDR=14`, `targetArmor="1d2"`. Native defense submission of
base DR10 and incoming1d6+1 persists `defendDR=10`, `incomingAttack="1d6+1"`;
maximum armor tier2 produces final DR12. HP remains unchanged.

The module read those fields but did not write selected choices. Live same-input
attack succeeded yet left the flags undefined; `combat-memory.test.ts` reproduces
the defect. An isolated copy using prior action source and the same final fixture
also fails, preserving a meaningful before/after comparison.

Guarded dotted-field preference writes now retain native selections and unrelated
flags. They occur after successful evaluation of executed dice and before ammo;
this deliberately avoids remembering a failed evaluated action's inputs. No HP or
armor mutation is added. Automation-off actions do not persist these preferences;
their unused armor/incoming formula controls are removed. DR comparison remains
meaningful and follow-up weapon damage stays a separate action.

Before: `/tmp/morkborg-combat-memory-before.json`,
`/tmp/morkborg-combat-memory-exact-before.log`.
After: `/tmp/morkborg-module-combat-memory.json`,
`/tmp/morkborg-combat-memory-unit-after.log`.

## Current qualification and recovery

Archive **3a7a0bc2f1dd7c4cb0775d4c9657a089e92c07b79ba914058f4237c324232a9e**,
module0.8.3 unchanged. All **15 source suites**, explicit source/UI/hook typing,
isolated check/package, **14 production Core integration cases** and **24 actual
installed-rewriter browser cases** pass. Integration output
`/tmp/morkborg-installed-2dcwhp`; browser output `/tmp/morkborg-browser-fnCmAj`.
The isolated transport now acknowledges Actor preference patches with updated
native-shaped documents, rather than an empty fake acknowledgement. Its former
incomplete mock is not evidence of a Core limitation.

Live role checks pass: owner detail200, observer detail200, hidden404; OWNER-only
commands reject observer/hidden404 before effects, and malformed/cross-Actor
commands400. Native carrying/capacity5 and resource cards match the module view.
`additionalAbilities` actual browser registration confirms **client** scope.

Acceptance is ongoing with four clearly marked Actors and journaled fixture chat.
The local native browser journal and owner-only disk baseline preserve exact IDs,
original Actor source, original chat IDs and setting records (including absence).
Full cleanup and the remaining settings/access/generation/full-host cases must
finish before G8/ADR closeout. No version switch or Core change is authorized by
these observations.

## Native ownership follow-up

The previous three fixes were committed at `aadde52`. Actual native owner3→observer2
left the Edit SCVM dialog and controls writable, while the identical caller's server
command returned404. Raw caller-prepared Actor ownership was2, with no `isOwner`
field. Released public `useActorSheet` uses `Boolean(actor?.isOwner ?? true)`;
this actual reproduction is independent of mocks and does not require a Core edit.

Module sheet/page now combine the host gate with native explicit/default ownership
and public SDK caller identity. Unknown ownership is read-only; explicit user0 wins
over default3; GM semantics and host denial are retained. Server authorization still
owns every effect. The maintained fixture changes only native ownership while
leaving host isOwner true: old archive times out waiting for editor retirement
(`/tmp/morkborg-native-ownership-before.log`, `/tmp/morkborg-browser-UsBLEb`).
The same case passes in the complete **25-case** current browser suite, zero errors,
`/tmp/morkborg-browser-DfZ8kn`. Eight native authority cases pass in the source suite.

Current archive **947a6f41a30a231eeb21969f6b7711a162b57cbeb46ee355d3d29a5878d7f988**
passes16 source suites, explicit source/UI/hooks typing, isolated module check/package,
14 production integration cases (`/tmp/morkborg-installed-uEVf2P`) and25 browser cases.
The actual installed native app passes6 mounted cases after the fix:
carrying14/capacity5 adds native +2 DR then disabling tracking removes the penalty
and stale form; automation-off form has no ignored damage control; warmed pack
content disappears on native denial with explicit403/retry and preserved search;
pack restoration refetches; ownership-only observer downgrade retires editing and
OWNER command404; restoring owner re-enables the sheet without reload.
`/tmp/morkborg-native-lifecycle.json`, `…-lifecycle-after.log`.

Actual native/installed combat results (`…-combat-actions.json`) pass12 cases:
natural melee crit/fumble, complete composite damage multiplication, armored defense
crit/fumble using current1d2 reduction/max-tier2 DR, ranged Presence + selected ammo
3→2, every Broken total including total2's multiple/nested rows, owned formula feat,
reviewed macro two draws/one doses roll with no inventory grant, and every player
visibility mode with exact author/speaker/recipient/blind data. Native Broken metadata
is root `ncXwgtRMqoiREban` (1d4); feat HVtEy2VmsOh5aBOE uses
`1d20+@abilities.presence.value`, resolving the modifier in parentheses. Initial
wrong driver identity/formula and an out-of-scope ammo search were corrected against
actual native records; they are not product regressions. Three further live cases
pass with real hitAutomation/trackAmmo false: one roll per attack/defense, unchanged
preferences/HP/Items/ammo, separate weapon-damage action. Settings values and pack
configuration were restored after this slice; created Setting-document absence still
requires final baseline cleanup. Four marked Actors/journaled chat remain active.
