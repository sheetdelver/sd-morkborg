# Brevel: operator-supplied native generation evidence

Later [reviewed-content acceptance](2026-10-19-content-decisions.md) exercises the
token correction in actual native creation and records the operator-approved
Pale/Owl policies. Pending statements below describe checkpoint `20fda1a`.

The operator supplied a generated Actor export, `EgsapFTnEhKsQlcj` (Brevel), in
this task on October 19, 2026. Its statistics identify Foundry 14.367 and native
Mörk Borg 6.0.1. This is user-supplied output, not a new module execution or an
independently fetched Actor. No native world was contacted for this comparison.
The pinned source remains tag 6.0.1, commit
`d850c094a9452d752307221f42245a73b66bdfbb`, whose manifest reports 6.0.0 / Foundry 14.

## Resource and content comparison

| Exported value | Independent native source interpretation |
| --- | --- |
| Agility −1, Presence −1 | Each class formula is `3d6+1`; modified totals 7–8 map to −1. Do not add the class prose modifier to the final bonus a second time. |
| Strength 0 | Class formula `3d6`; totals 9–12 map to 0. |
| Toughness −3 | Class formula `3d6-2`; modified totals at most 4 map to −3. |
| HP 3/3 | `max(1, 1d6 + Toughness)` implies a base roll of 6 for this result. |
| Powers 1/1 | `max(0, 1d4 + Presence)` implies a base roll of 2. Native casting reads `powerUses.value`, not the schema's unused `powerUsesRemaining: 0`. |
| Omens 2/2; silver 40 | Consistent with class `1d4` and `1d6*10`, respectively. |
| Staff | Matches native `1d4` damage and stored `handed: "2"`. |
| Intuitive Power; Uncommon Clay | Starting feat and rolled blessing are present. No separate randomly chosen Power document is included; native generation does not automate the feat's daily instruction. |

The final values do not record the complete original dice sequence. Inferred base
rolls above explain the output; they are not a replay or new measured roll.

## Identity limits

Pale One and Forlorn Philosopher are existing classes. There is no class named
"Forlorn Owl": earlier shorthand refers to Forlorn Philosopher's stale Hegelian
Owl companion result, not a missing class.

Brevel's embedded Intuitive Power has new owned ID `vO5FyvgqDGnbhVs3`, empty flags,
and null compendium/duplicate provenance. Native `packutils.simpleData` copies
only image, name, system and type before embedding. The export therefore cannot
distinguish source feat `BtoSeh36zY8IqOQJ` from `YcKA0JHLezBYt3fz`, whose copied
root records differ only by `_id`. Native `documentFromPack` takes the first name
match. The user-pinned canonical identity decision remains open; the module's
explicit conflict does not imply that native generation cannot create Pale One.

## Token sight correction

Brevel's stored prototype token has `actorLink: true`, `disposition: 1` and
`sight.enabled: false`. Native `MBActor.create` supplies legacy `vision: true`,
which must not be translated into modern `sight.enabled: true` by the module.
The module previously forced modern sight on for characters and inferred a sight
value for companions. Generation now leaves absent sight to native creation and
preserves explicit companion prototype-token source data.

The same generation regression fails before the change (`true !== false` for
the presence of an invented sight field) and passes after it. Additional coverage
checks absent companion sight and preservation of an explicit enabled/range value.
The installed-route regression checks this omission on every successful copied
native class plan. This does not change the pinned Pale One conflict or stale
Forlorn result, and does not extend qualification to another runtime version.

## Verified checkpoint

- Module branch `fix/adr-0001-native-alignment`; version remains 0.8.3.
- Source failing-before: `generation.test.ts` fails with `true !== false` at the
  new token-default assertion. Local log: `/tmp/morkborg-brevel-before.log`.
  The same test passes after; all 16 source suites and explicit source/UI/hooks/tests
  TypeScript checking pass. Logs: `/tmp/morkborg-brevel-{after,suites,types}.log`.
- Installed failing-before: previous qualified archive SHA-256
  `1b7e1d48ab878fbaa080f5642d94f9d8b934136cde775410d8bc77967070822b` fails the new
  assertion in the copied-native class-plan case. The dependent partial-creation
  case also fails because no candidate was produced; the other 12 cases pass.
  Results: `/tmp/morkborg-installed-5kTrJn/installed-results.json`.
- Module check and isolated packaging pass against released Core0.19.3
  `90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`. Amended archive:
  `/tmp/morkborg-brevel-data-hv_s1rq6/dist/modules/morkborg-0.8.3.tgz`, SHA-256
  `89bf785188263d1de344d58299bb960448bd0a0460dcdd1cd01805b1ff018c2f`.
- Installed passing-after: all 14 production-loader/Core runtime integration cases
  pass with that archive and copied native data under runtime identity6.0.1.
  Results: `/tmp/morkborg-installed-Xb9FmQ/installed-results.json`.
- All 26 installed-package browser interactions pass with that archive, including
  the actual released-Core shared-content overlay. Results:
  `/tmp/morkborg-browser-kNUXjl/browser-results.json`. These isolated contexts do
  not contact a native world or establish a new native creation result.

No native world writes, migration, release/version change or Core/reference edits
were made. Test services stopped after verification. Prior native acceptance and
cleanup remain attributed to checkpoint `006019b` and its recorded package; the
amended creation payload has not been executed in the native world during this
follow-up. ADR-0001 and the active audit remain open with that qualification and
the user-pinned identity decisions.
