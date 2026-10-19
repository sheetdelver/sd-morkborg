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

Archive SHA256 `e1bc466ad2008e47aa6e91641b269b9ed6700932400c019bb3109243c605e692`,
`/tmp/morkborg-review-inventory-plz5zonn/dist/modules/morkborg-0.8.3.tgz`.

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

MB-R01/02 are corrected with isolated execution evidence. MB-R03–05 are pending
this checkpoint. Native reruns for corrected paths and independent G9 closeout
remain pending. Prior native qualification is retained only for its original
artifacts (including content-policy archive `9927b43a3e882dcac3bd3379d1d5ab4802e1c68ff290dd2ed5920208b00f631f`).
