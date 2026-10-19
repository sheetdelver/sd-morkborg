# Independent review of MB-R01–05 corrections

Reviewed October 19, 2026 at `ae69c76cc9119833bfabfc6efc3e8297cd91db80`,
branch `fix/adr-0001-native-alignment`, starting with a clean tracked worktree.
The corrective commits are `33d3291` (inventory) and `ae69c76` (details,
capabilities and cards), following review-document checkpoint `49ceea6`.

**Result: MB-R01–05 pass independent offline review. No additional implementation
blocker was found in these corrections. ADR-0001 remains open only for the focused
native follow-up below and final reconciliation.** This review does not replace
native execution, extend supported versions, or authorize release operations.

**Subsequent result:** the [focused native run](2026-10-19-correction-native.md)
passed all five rows with cleanup on the selected pair. ADR-0001 is now closed;
the offline-only statements below describe this earlier review, not final status.

## Provenance and method

Module version remains **0.8.3**; Core floor **0.19.3**, module API **1.5**, UI API
**3.2**, roll API **1.0**. Reviewed Core is
`90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`. Native reference is clean tag **6.0.1**,
`d850c094a9452d752307221f42245a73b66bdfbb`, whose manifest reports **6.0.0**.
No endpoint was contacted. The earlier native evidence qualifies Foundry
**14.367 / system 6.0.1**, not a new run of either identity in this review.

Review compared executable changes with the [original findings](2026-10-19-independent-review.md),
the [implementer's before/after evidence](2026-10-19-review-corrections.md), native
`module/config.js`, `templates/actor/character/feats-tab.hbs` and
`module/actor/test-abilities.js`. It traced UI input through the current shared
planner, caller-bound inventory/action routes and actual chat renderer. Expected
results came from native fields and behavior, not newly captured module snapshots.
Existing failing-before receipts were inspected; those predecessor runs were not
repeated. All passing results below were independently executed on current code.

## Findings resolved

| Finding | Independent conclusion and source trace |
| --- | --- |
| MB-R01 | `src/ui/EquipmentTab.tsx` renders the shield toggle. `src/ui/pages/ActorPage.tsx:updateNative` routes it through `inventoryAction`, `src/server/actorEffects.ts` and the existing inventory planner. Native `equippableItemTypes` includes shields. Equip/unequip/re-equip, replacement, reduction, source preservation and Observer denial pass. |
| MB-R02 | The Equipment picker includes `ammo` in browse/custom types. Exact native Sling stone `4wvSoapM7f0FczOH` passes the compiled catalog/add route, retains native fields and provenance, binds by owned ID, depletes and replenishes without duplicate categorization. Empty and denied catalogs remain distinct; custom creation preserves the empty native system payload. |
| MB-R03 | `src/ui/ViolenceTab.tsx` stores only `selectedItemId`, resolves current equipped Items and retires an absent selection. `MorkBorgSheet` keys the tab by Actor/authority. Current description/damage, deletion, unequip, Actor replacement and ownership loss pass, including phone keyboard/focus cleanup and no automatic reopening. Equipment and Special refresh controls still pass. |
| MB-R04 | `SpecialTab` obtains capability from `getRollData` using the original Actor Item array, rather than the categorized presentation object. Passive details remain accessible without Use. Formula and reviewed macro paths pass; macro precedence and unsupported-macro rejection preserve zero invented document writes. |
| MB-R05 | `getRollData` validates the ability and supplies its label; `executeAction` retains `statKey`/`label`; `MorkBorgAdapter.generateRollCard` consumes that label. Actual cards distinguish all four abilities even with equal modifiers, preserve visibility and DR modifiers, and do not write Actor/Item data. |

The documentation had one remaining inconsistency: the ADR headline and current
G3/G6/G9 rows still described unimplemented corrections after its later addendum
recorded them as fixed. This review reconciles those current summaries while
retaining historical checkpoints. This is a documentation correction, not another
runtime finding or Core dependency.

## Fresh execution

A new isolated package was built from `git archive HEAD`; no development checkout,
managed installation or production configuration was overwritten. Package command
validation also runs `module:check`. Source suites and explicit typing used the
module's maintained entry points against the reviewed Core toolchain.

Archive: `/tmp/morkborg-correction-package-u8jig0od/dist/modules/morkborg-0.8.3.tgz`

SHA-256: `adb3001ef1eb4dd526982297df8e31dfc63dc5ce1106fbf513827cac9c32ab2c`.

| Check | Fresh result | Supplemental receipt |
| --- | --- | --- |
| All source suites | 19/19 pass | `/tmp/morkborg-correction-review-6e9ky8h7/source-results.json` |
| Explicit module/UI/hook/test typing | Pass, `node scripts/typecheck.mjs` | Process exit 0 |
| Module validation and isolated package | Pass | `/tmp/morkborg-correction-package-u8jig0od/package.log` |
| Actual released-Core production registry/request runtime, identity 6.0.0 | 20/20 pass | `/tmp/morkborg-installed-nrBSTs/installed-results.json` |
| Same isolated runtime, identity 6.0.1 | 20/20 pass | `/tmp/morkborg-installed-1Foyyl/installed-results.json` |
| Compiled inventory interactions | 3/3 pass, no browser exceptions | `/tmp/morkborg-browser-7mhSqM/browser-results.json` |
| Compiled action/lifecycle interactions | 7/7 pass, no browser exceptions | `/tmp/morkborg-browser-FRYlmp/browser-results.json` |
| Existing browser suite | 26/26 pass, no browser exceptions | `/tmp/morkborg-browser-7kF9AH/browser-results.json` |

All five installed/browser receipts identify the new archive above. The existing
browser suite covers four widths and both appearances. Its 360px dark footer/HP
capture was visually inspected; health values and navigation remain legible, and
the shared floating control clears the footer. The installed suite uses real
Core stores, registry, authorization and chat generation with a deterministic
transport boundary and copied native records. Browser session/transport callbacks
remain fixtures. Neither is a live Foundry acceptance result.

Reproduce with the commands in [tests/README.md](../../../tests/README.md): run
all `src/tests/*.test.ts`, `scripts/typecheck.mjs`, isolated package validation,
both installed identities, and the browser runner with `inventory-regressions.mjs`,
`action-regressions.mjs`, then its default script. Copy/parse native databases into
a separate fixture directory; never open or mutate the reference databases as an
acceptance world. Local Node was **24.21.0**; the CI Node22 environment was not
independently rerun. The unchanged release helper's prior 26-test receipt is retained,
not counted as a fresh run here.

## Bounded native follow-up and closeout

Retain the [prior complete native matrix](2026-10-19-native-acceptance.md) and
[approved Pale/Owl follow-up](2026-10-19-content-decisions.md) at their original
artifact identities. Run the following changed paths in one scoped session on
the previously qualified **Foundry14.367 / Mörk Borg6.0.1 / Core0.19.3** pair,
using a freshly identified final package. A different pair needs its own explicit
scope decision. This review does not require repeating the entire original matrix,
unrelated generation scenarios or adding v13 support.

| Follow-up | Linked acceptance | Observable completion |
| --- | --- | --- |
| Shield controls | MB-A03/07/08/09 | OWNER performs equip → unequip → re-equip and replacement through the actual sheet; native source/readback, reduction and unrelated fields agree. Observer cannot write. |
| Ammo lifecycle | MB-A03/07/08/09 | Browse exact authorized native ammo and create custom ammo; bind the owned stack, deplete and replenish; one inventory representation, correct quantity and retained identity/provenance. Denied catalog remains unavailable. |
| Current details | MB-A01/08/09 | In a mounted Violence modal, a source update changes description/damage; deletion, unequip, Actor switch and authority loss retire it. Verify keyboard return/cleanup and the Equipment/Special controls. |
| Feat capabilities | MB-A05/08/09 | Passive details work without Use; actual formula and reviewed macro produce their expected results. Unsupported macro reports its reason without dice/chat/document effects. No automatic grants from passive prose. |
| Named ability chat | MB-A03/08/09 | All four actual ability cards identify the ability and retain modifiers; public/GM/blind/self recipients agree with native readback. No Actor/Item changes. |

Record the endpoint/world/build/account identity and current fixture-write/cleanup
authorization before live work. Use disposable fixtures, snapshot the baseline,
verify primary-source outcomes independently, and remove fixtures/chat/accounts
created for this session. The present review authorizes no live writes.

After those cases pass and cleanup is verified: reconcile G8/G9, close ADR-0001,
archive the active audit with valid links, retain MB-F01–06 and provisional content
policies as explicit follow-ups, and prepare the release under separate authority.
There is no new module migration, SDK floor change or Core corrective task here.

Review-owned HTTP4181/CDP9418/browser processes stopped. The existing process on
30000 was only observed in the listener inventory and was untouched. Core's
pre-existing release-scaffold edits and the clean native reference were preserved.
No source, compatibility or version edits, Git mutations or remote operations were
performed; review documentation and the module handoff are the only new changes.
