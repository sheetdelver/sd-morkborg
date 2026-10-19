# Focused native acceptance of MB-R01–05

**Result:** All five corrected paths pass on Foundry **14.367**, native Mörk Borg
**6.0.1**, world `morkborg`, with released Core **0.19.3**. Cleanup passed.
This completes the bounded follow-up selected by the
[independent correction review](2026-10-19-correction-review.md). No new module
defect or Core dependency was found. The [portable evidence](2026-10-19-correction-native.json)
contains nine result groups, sixteen ability/visibility receipts, installed-file
hashes and cleanup metadata; it contains no credentials or original world content.

## Identity and execution boundary

- Module branch `fix/adr-0001-native-alignment`, commit
  `ae69c76cc9119833bfabfc6efc3e8297cd91db80`, unchanged version **0.8.3**.
- Tested archive SHA-256:
  `adb3001ef1eb4dd526982297df8e31dfc63dc5ce1106fbf513827cac9c32ab2c`.
  Installed server, logic, UI, CSS and manifest bytes match that archive.
- Core commit `90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`, production frontend/API
  in an isolated `/tmp` checkout/data directory, ports 3971/3972. No root `.env`
  or production settings were used. The managed module was the reviewed archive.
- Native reference tag **6.0.1**, commit
  `d850c094a9452d752307221f42245a73b66bdfbb`, has manifest **6.0.0**.
  The running native system reported **6.0.1**; these identities remain distinct.
- User authorized this local v14 run and scoped fixtures/cleanup. Native GM
  `Gamemaster`, role 4, was used for setup, independent readback and cleanup;
  module actions used a separate temporary role-1 OWNER through Core.

Core and native browser sessions ran in a task-owned Chrome profile. Native
browser access was a test oracle, not a dependency added to normal operation.
Two marked disposable Actors and one temporary user confined writes. Test inputs
used exact native compendium Items; class prose was never converted into rules.

## Executed cases

| Finding / acceptance | Fresh native result |
| --- | --- |
| MB-R01 / MB-A03/07/08/09 | Actual Equipment pointer and Space controls equip, unequip and re-equip a shield, disable the previous shield and match native reduction. Independent source comparison preserves unrelated fields. Downgrading only the fixture ownership to Observer disables controls; the direct caller route returns concealed 404 with unchanged source. Restoring OWNER works in the same session. |
| MB-R02 / MB-A03/07/08/09 | Browse exact `Compendium.morkborg.mork-borg-items.Item.4wvSoapM7f0FczOH` (Sling stone); owned fields equal the native template and retain its UUID. The native Item editor selects the owned ammo ID. Actual Core ranged execution depletes that stack; browsing replenishes it under a new owned ID. Each stack appears once. Custom ammo creation works with keyboard controls. |
| MB-R03 / MB-A01/08/09 | At 360 CSS px, a mounted Violence modal updates description and damage after native source changes. Unequip, permission loss, Actor navigation and deletion retire it. Escape restores the trigger; retirement releases scroll/focus containment, and restoring access/equipment does not reopen the modal. At 1280px, Equipment details and Special editing reflect current source changes. |
| MB-R04 / MB-A05/08/09 | Passive feat details open without a Use button; direct execution returns 400 without chat or document changes. Actual formula action rolls native `1d4`; reviewed decoction action rolls `1d8`, `1d8`, `1d4` and leaves allocation manual. Unsupported native macro explains its boundary without dice/chat/document effects. |
| MB-R05 / MB-A03/08/09 | Strength, Agility, Presence and Toughness each execute in public/GM/blind/self mode: sixteen primary ChatMessage readbacks have the correct label, author, speaker and recipients. Equal manual inputs produce `10+1 = 11` without losing ability identity. Actor/Item source remains unchanged. Actual Core chat was visually inspected; named cards render and the caller sees only concealed content for blind rolls. |

The unchanged denied/empty catalog boundary retains the prior native matrix and
current isolated compiled-route evidence. This session did not alter global pack
permissions to repeat it. Likewise, the original full native matrix, reconnect,
generation/recovery and Pale/Owl follow-up retain their recorded artifact identities:
[full matrix](2026-10-19-native-acceptance.md),
[content policies](2026-10-19-content-decisions.md). This is focused qualification
of the changed paths, not a claim to have rerun every original case on this archive.

Temporary driver repairs corrected isolated-host setup, hidden desktop navigation
selection at phone width, tool-menu selectors and asynchronous overlay timing.
They did not change application source and are not failing-before product evidence.
Two preliminary ranged attempts produced extra fixture messages, included in cleanup.

## Cleanup and closeout

Independent native readback verified removal of **2 Actors, 1 user and 21 messages**.
The remaining **2 original Actors, 14 Settings, 2 ChatMessages and 0 Combats** match
their complete pre-run source, including audit fields. Original **3 users** match
their captured ID/name/role values. World Items and compendium packs were not
mutated. Both test sessions logged out, and task ports 3971/3972/9420 are stopped.
The operator's Foundry process on port 30000 remains running.

Local supplemental drivers/readbacks are under
`temp/correction-native-2026-10-19/` and
`/tmp/morkborg-corrections-native-5f0gr0k6`; tracked evidence above is sufficient
to understand the results without those ignored files. Original world snapshots
and copied native content remain outside tracked documentation.

G3/G6/G8/G9 are reconciled in ADR-0001. Its agreed correction/qualification scope
is complete; the audit is archived. MB-F01–06 remain separately scoped features,
and the exact Pale One/Owl policies remain provisional module decisions. v13 /
native 5.1.2 support was declined by the user; no v13 pass is claimed. Other native
versions need their own qualification. No persistent repair, new SDK/Core
dependency or compatibility/version edit is introduced.

Module release preparation is next, subject to its own Git/release authorization.
This verification changed documentation only; it did not stage, commit, push,
merge, tag or publish. Core's existing release-scaffold changes and both sibling
module/native-reference checkouts were preserved.
