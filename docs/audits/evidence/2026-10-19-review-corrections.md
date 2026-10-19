# MB-R01–05 correction evidence

Scope: module-only correction after independent review at `f48332e`. Review docs
are checkpointed in `49ceea6`; module stays 0.8.3, released Core stays 0.19.3
(`90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`). No Foundry contact in this work.
The reference stays tag6.0.1 / `d850c094a9452d752307221f42245a73b66bdfbb`,
whose manifest reports6.0.0 / Foundry14. Approved Pale/Owl policies are unchanged.

## Failing-before

Reviewed archive SHA256 `cc37b205138785c812ce7a193ea059ef165922cee4efe97cd6041c4668ef01cf`.
Maintained pointer/keyboard tests reproduce missing shield Equip, absent ammo in
browse requests and custom types. The same-input action cases reproduce stale
Violence description/damage, deletion/unequip/Actor/ownership retirement failures,
and enabled passive Use; Equipment details and Special editor refresh pass.
The real executor plus chat renderer fails all four expected ability card names,
with equal modifiers/formulas deliberately preventing formula-based inference.

Local receipts: `temp/review-corrections-2026-10-19/` (`inventory-before.log`,
`browser-before.log`, `ability-before.log`); isolated browser outputs
`/tmp/morkborg-browser-3gF1HK` (inventory) and `/tmp/morkborg-browser-o9JyLm`
(actions and passing refresh control). The initial full probe had a test selector
error in the browse case; the dedicated inventory rerun establishes its real
missing-ammo failure. A fixture missing world identity was corrected before the
recorded four card failures. These setup errors are not product findings.

## Inventory checkpoint

Checkpoint `33d3291` verified archive SHA256
`e1bc466ad2008e47aa6e91641b269b9ed6700932400c019bb3109243c605e692`.
The passing browser receipt is `/tmp/morkborg-browser-gmtMzJ/browser-results.json`.
The temporary packaging path was later reused for an action trial; the installed
checkpoint extraction and receipt below retain that original identity. The final
archive is kept at a separate path and checksum below.

- Three maintained rendered-control cases pass (`inventory-regressions.mjs`):
  shield cycle, replacement, reduction, source fields and Observer disabling;
  exact browse payload, ammo once in inventory and weapon selector; custom ammo
  with native empty system shape, keyboard submission, denied and empty catalog.
- 18 installed Core cases pass (`/tmp/morkborg-installed-SRounV/installed-results.json`):
  actual archive registry, caller/runtime/Store boundaries and lifecycle; compiled
  shield route; exact copied-native Sling stone `4wvSoapM7f0FczOH` provenance and
  fields, weapon binding, depletion, fresh-ID replenishment, denied/empty catalog;
  existing full generation/recovery and approved content policies remain passing.
- `inventory-actions.test.ts`, `native-inventory.test.ts`, explicit source/UI/hook
  typing and isolated validated packaging pass. Core's root type check alone is
  not counted as module typing. Browser fixture/hydration setup issues were fixed
  before counting the final passing receipts.

MB-R01/02 were corrected with isolated execution evidence at this checkpoint;
MB-R03–05 were still pending then. Native reruns for corrected paths and independent G9 closeout
remain pending. Prior native qualification is retained only for its original
artifacts (including content-policy archive `9927b43a3e882dcac3bd3379d1d5ab4802e1c68ff290dd2ed5920208b00f631f`).


## Lifecycle/action/card checkpoint and final verification

Review docs: `49ceea6`; inventory corrections: `33d3291`. The next focused commit
contains MB-R03–05 and this final ledger; its full identity is recorded in Git and
the local handoff. ADR closeout remains pending independent review.

Final archive: `/tmp/morkborg-review-final-p8sne56q/dist/modules/morkborg-0.8.3.tgz`
(module0.8.3), SHA256
`fe891efa674ced7e12ed1dcaf293c5fed6c1c0849d5010167d18f50e6c90a338`.
All final installed/browser receipts below identify that exact archive.

| Verification | Result | Retained receipt |
| --- | --- | --- |
| All maintained module suites | 19 suites pass, including real ability cards and shared feat capability | `temp/review-corrections-2026-10-19/suites-final.log` |
| Explicit source/UI/hook/test typing | Pass with `scripts/typecheck.mjs` against released Core toolchain | `types-final.log` in the same local evidence directory |
| Module validation and isolated packaging | Both pass, no metadata/dependency/version change | `/tmp/morkborg-review-final-check.log`, `/tmp/morkborg-review-final-package.log` |
| Installed Core0.19.3, identity6.0.0 | 20 cases pass | `/tmp/morkborg-installed-aJzQ5V/installed-results.json` |
| Installed Core0.19.3, identity6.0.1 | 20 cases pass | `/tmp/morkborg-installed-TPjRlx/installed-results.json` |
| Existing compiled browser suite | 26 cases pass; no runtime exceptions | `/tmp/morkborg-browser-muouSc/browser-results.json` |
| Compiled inventory regressions | 3 cases pass; no runtime exceptions | `/tmp/morkborg-browser-iXBsoH/browser-results.json` |
| Compiled action regressions | 7 cases pass; no runtime exceptions | `/tmp/morkborg-browser-zC0R5f/browser-results.json` |
| Retained release-helper tooling | 26 tests pass; no release operation invoked | `release-final.log` in local evidence |

Final JSON receipts are also copied to the module's ignored local evidence
directory. No receipt was relabeled as native acceptance.

MB-R03: Violence resolves a selected owned ID against its current equipped
weapons/armor/shields projection. Already-open details update their authoritative
description and damage. Deletion, unequip, Actor replacement and ownership loss
retire the selection at mobile width, release modal/inert/scroll containment and
permit keyboard focus on current controls. Re-equipping does not reopen it.
Escape restores a surviving trigger. Equipment details and Special editor refresh
remain passing. Shared modal and host overlay behavior pass the original suite.

MB-R04: Special uses the same plan as execution against the Actor's original
Item array. Passive feats retain details without an executable Use action; missing
formula/macro capability shows its reason. Pointer/keyboard cases cover passive
details, formula confirmation and macro dispatch. Installed cases use exact native
Intuitive Power `BtoSeh36zY8IqOQJ`, Lizard Regeneration `fuFjGnyyrGg0RRbb`,
Create Decoctions `SeZNKnkTTZ3oi4ln` and reviewed macro `l6vx8Dy5iSzh7OEh`.
An explicit test override gives the reviewed feat an unavailable formula to prove
macro precedence; it still draws the native table and presents manual allocation.
An existing different native macro returns typed validation/400 before dice/chat.
Passive and unsupported cases perform zero effects; no path adds HP/inventory
writes. The test transport's dice-mode state was restored after this new case to
preserve the existing generation cases; the transient fixture failure is not a
product regression or external blocker.

MB-R05: shared plans validate `statKey` and supply the capitalized label. Execution
retains both; the actual renderer consumes the plan label. All four named cards
are verified with equal formulas/modifiers to prevent inference from dice text.
The compiled route cases additionally preserve carrying DR modifiers, original
roll data, four visibility recipient modes, Actor identity and zero document writes.

MB-R01–05 are corrected with source and isolated compiled execution evidence.
Fresh native reruns of the corrected shield/ammo/detail/feat/chat paths remain
pending current scoped authorization. Previous native acceptance and its cleanup
remain unchanged at their original artifact identities; neither isolated native
version parameter establishes another native-world qualification. No Core blocker,
new dependency, migration or deferred feature is introduced. All task-owned
HTTP/CDP/Chrome services are stopped; operator Foundry30000 was untouched.
