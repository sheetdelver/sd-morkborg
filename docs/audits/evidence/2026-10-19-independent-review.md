# ADR-0001 independent implementation review

Reviewed `fix/adr-0001-native-alignment` at `f48332e` on October 19, 2026.
The module started clean. Runtime version remains **0.8.3**, requiring Core
**0.19.3**, module API **1.5**, UI API **3.2** and roll API **1.0**. No migration
catalog or additional Core dependency is established by this review.

**Disposition: corrective work remains before closeout/release.** Existing checks
pass, but independent execution confirms MB-R01–05 below. These are residual
implementation gaps, not new findings about Core migration infrastructure.
No application source was changed, native endpoint contacted, world written,
Git state mutated or release prepared during this review.

## Evidence and scope

The local native oracle is tag **6.0.1**, commit
`d850c094a9452d752307221f42245a73b66bdfbb`; its checkout manifest says **6.0.0**.
Native source paths below are relative to that independent checkout. Source review
covered preparation, inventory operations, action plans/execution, world rules,
content resolution, generation/recovery, mounted consumers and the package contract.

The prior [native matrix](2026-10-19-native-acceptance.md) and
[content-policy follow-up](2026-10-19-content-decisions.md) retain their evidence
for Foundry **14.367 / native 6.0.1**. `git diff d28727d..f48332e -- src module info.json`
is empty. The later commit adds release tooling/documentation and an ESM npm manifest;
it does not change module runtime source. This review does not claim a fresh native
run or support for Foundry 13. A new package has a distinct checksum/build context;
it is not described as byte-identical to the previously accepted archive.

| Fresh check | Result |
| --- | --- |
| Maintained source suites | 17/17 pass |
| Explicit source/UI/hook/test typing | Pass |
| Released-Core module validation | Pass |
| Isolated package | Pass |
| Actual Core 0.19.3 production-loader/request-runtime harness, native identity 6.0.0 | 16/16 pass; deterministic transport with copied native records |
| Same harness, native identity 6.0.1 | 16/16 pass; not a native world run |
| Installed browser suite | 26/26 pass, zero runtime exceptions; four widths and both appearances |
| Standalone release-helper tests | 26/26 pass in temporary fixtures; no real tag/push/release |
| Independent mounted review probes | Four expected-behavior failures, one passing control; zero runtime exceptions |
| Independent actual action/chat rendering | All four ability titles fail the native naming expectation |

The phone footer/HP capture was visually inspected. The first isolated package
attempt lacked dependency resolution in its copied directory and failed to find
Tailwind/Lucide. Adding a read-only reference to the installed Core dependencies
resolved that test setup issue. One initial browser probe contained a selector
quoting error; its corrected rerun confirms MB-R02. Neither setup error is a
product defect or failing-before implementation evidence.

Fresh review archive:
`/tmp/morkborg-independent-review-c90i0y3s/dist/modules/morkborg-0.8.3.tgz`

SHA-256: `cc37b205138785c812ce7a193ea059ef165922cee4efe97cd6041c4668ef01cf`.

Local reproduction scripts, logs, receipts and the prior ADR snapshot are in
`temp/independent-review-2026-10-19/`. Installed runs are
`/tmp/morkborg-installed-a3B9xU` (6.0.0) and `/tmp/morkborg-installed-AQ2DvP` (6.0.1).
The maintained browser run is `/tmp/morkborg-browser-6tnLVh`; the independent
review run is `/tmp/morkborg-browser-SJ8P18`. The procedures and observed outcomes
below are sufficient to reconstruct the cases without these ignored artifacts.

## MB-R01 — an unequipped shield cannot be equipped from the sheet (P2)

**Owner:** module UI; G3/G6, MB-N02/03/13, MB-A03/07/09.

`src/ui/EquipmentTab.tsx:205` renders an equip toggle only for `weapon` and `armor`.
The Violence tab filters shields to already-equipped ones; its Unequip control
therefore cannot restore a shield after it is taken off. Item editing has no
alternate Equipped field. Native `module/config.js` includes shields in
`equippableItemTypes`; `templates/actor/common/equipment-list.hbs` renders the
corresponding control. The module's shared inventory command already supports
shield equip and exclusivity; no host change is required.

**Reproduction:** supply an owned character with a shield whose
`system.equipped` is false. Open Equipment in the compiled package. The shield
row exposes details, edit and delete, but no Equip control. It is absent from
the equipped Violence list. An initially equipped shield becomes stranded after
Unequip until edited outside this sheet.

**Correction/checkpoint:** expose the canonical shield equip action through the
existing inventory route. Verify false → true → false → true via actual pointer
and keyboard controls, shield replacement/exclusivity, the derived reduction and
Observer denial. Assert the owned Item ID and preserved unrelated fields; do not
add a separate defense calculation or bypass the sequenced inventory handler.

## MB-R02 — ammunition cannot be added through the picker (P2)

**Owner:** module UI; G3/G6, MB-N02/03/13, MB-A03/07/09.

`src/ui/EquipmentTab.tsx:357` supplies
`['armor', 'container', 'misc', 'scroll', 'shield', 'weapon']` to Add Item. Special
adds only feats. Those allowed types determine both the browse request and custom
type selector, so ammunition is excluded from every addition path. Native ammo
is an equipment type, and the module route/editor/categorizer already support it.

**Reproduction:** on a character with a ranged weapon, open Equipment → Add.
The `/items?types=` request excludes `ammo`; Custom Item also has no ammo option.
Existing ammo can be decremented/deleted, but a player cannot replenish a deleted
stack from the module's own picker. The independent installed probe records both
the exact request types and rendered options.

**Correction/checkpoint:** include native ammunition in browse/custom selection
using the existing Item flow. Verify a caller-visible ammo template retains its
source UUID/native fields, can be selected by the weapon, and is shown once.
Exercise depletion then replenishment, denied/empty catalogs and safe custom
creation. Do not reinstate name consolidation or fabricate ammo properties.

## MB-R03 — open Violence item details retain obsolete data (P2)

**Owner:** module mounted UI; G6, MB-C03/N13, MB-A01/09.

`src/ui/ViolenceTab.tsx:212` passes the object captured when the modal opened.
Equipment and Special already resolve their open item by owned ID against the
current categorized projection. Updating the source refreshes the Violence row
but leaves its open details showing the old description and damage.

**Reproduction:** open the details for an equipped weapon with `1d6+1` and an
initial description. Deliver a new prepared Actor for that same owned ID with
`1d12+2` and a different description. The installed Violence modal still shows
the initial values. The same authoritative description-update probe in the
Special editor passes; this is a localized consumer defect, not missing Core
invalidation or a general Item-editor failure.

**Correction/checkpoint:** retain selection identity and resolve the current Item
from the shared projection. Retire the modal when the Item disappears or its
scope/access retires. Test changes, deletion, Actor/ownership changes and trigger
focus cleanup without adding a second cache or extra world fetch.

## MB-R04 — passive feats expose an enabled action that does nothing (P2)

**Owner:** module action presentation; G1/G4/G6, MB-N04/12/13, MB-A05/09.

`src/ui/SpecialTab.tsx:121` substitutes “Use” when a feat has no `rollLabel`, and
the row always renders an enabled action. The shared rules correctly return null
for that passive feat, so `MorkBorgSheet` returns without opening details, showing
an explanation, or executing anything. Native
`templates/actor/character/feats-tab.hbs` renders its roll action only when
`system.rollLabel` exists.

**Reproduction:** open Special with an owned passive feat (description present,
empty rollLabel/formula/macro). Click Use. No request, dialog or feedback occurs.
This is not authorization to turn passive instructions into automatic mutations.

**Correction/checkpoint:** use the shared capability decision to omit the action
or clearly mark the feat passive; keep details accessible. Test passive, formula,
reviewed macro and unsupported macro cases. Preserve macro-before-formula
precedence and ensure unsupported behavior has a truthful explanation.

## MB-R05 — ability chat cards lose the ability name (P3)

**Owner:** module action/card contract; G3/G6, MB-N03/13, MB-A03/09.

`src/logic/rules.ts:80` records ability identity as `statKey`, while the executor
copies `plan.subType` and `MorkBorgAdapter.generateRollCard` reads `subType`.
The identity is therefore lost between the shared plan and the actual chat card.
Native `module/actor/test-abilities.js` explicitly names the selected ability.

**Reproduction:** run each of the four real shared ability plans through the
actual executor and chat renderer with a deterministic SDK dice result. All four
produce `<div class="card-title">Test </div>`. The math is correct; chat cannot
distinguish which ability was tested, especially when modifiers are equal.
Existing action tests commonly replace the renderer, so they miss this seam.

**Correction/checkpoint:** carry the validated plan identity/label through to the
renderer using one consistent field. Assert all four actual chat titles plus
modifiers, visibility and absence of extra document writes. Avoid duplicating
ability inference from formulas in the card component.

## Closeout boundary

All five findings should be resolved and rechecked before G9 closes. The fixes
fit the existing module branch/contracts; no new Core work, SDK bump, migration
catalog or native-version expansion is indicated. Preserve the approved Pale One
and Owl policies and prior acceptance receipts. After correction, rerun the
affected installed controls and chat paths, the maintained suite, typing and
package checks. Any new native acceptance should target the corrected paths on
the previously qualified pair and retain its own archive identity, rather than
claiming that prior evidence executed newly changed code.

All review-owned browser/listener processes were stopped. The existing Foundry
process on port 30000 was untouched. No commit, tag, push or publication occurred.
