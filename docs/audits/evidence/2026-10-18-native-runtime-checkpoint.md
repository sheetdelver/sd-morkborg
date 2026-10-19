# Native runtime checkpoint — partial acceptance

October 18, 2026. Native acceptance has started; this is not completion of G8.

## Verified runtime and artifact

The operator supplied `localhost:30000`, Foundry 14 and the passwordless GM in
response to the bundled disposable-world request. Read-only inspection found:

- World **morkborg**, Foundry **14 build367**, installed native **6.0.1**.
- Served native `system.json`: version 6.0.1, minimum/maximum/verified14.
- Pinned reference remains tag 6.0.1 / `d850c094a9452d752307221f42245a73b66bdfbb`,
  whose checkout manifest says **6.0.0**. This distinction remains intentional.
- **43/43 served module JS/schema files exactly match** that pinned checkout.
  [Metadata/hash evidence](2026-10-18-runtime-source.json) contains no pack prose.
- The served Foundry `ClientSettings.register` maps omitted/invalid scope to client.
  Native `additionalAbilities` omits scope: it is a client preference on this build,
  rather than a world rule. A native browser registration-object check remains
  available as a corroborating UI check; no service-account client value is adopted.

Released Core 0.19.3 (`90c13e5`) was archived into
`/tmp/morkborg-native-acceptance-host`; config/cache/modules are separate under
`/tmp/morkborg-native-acceptance-data`. Original Core/native checkouts were read-only.
The production API uses the installed archive, not module source. Its setup cache
was populated from verified public status/caller-visible user metadata through
released Core's setup helper. No production `.env` or settings were copied.

The runtime revealed a real version gate: archive `c5676bc…` returned **503
unsupported-version** for the native class catalog, because declarations covered
only checkout manifest 6.0.0. The same endpoint returns **200 /12 classes** after
declaring the directly verified 6.0.1 provenance as well. The SDK comparator range
is `>=6.0.0 <=6.0.1`; future/unverified patches still fail unavailable before effects.

Corrected archive SHA-256:
**fc7dc6d7e41d30cefad0797ca96be3401705e584ee5279c379a62db8e0d97b7b**,
`/tmp/morkborg-adr0001-host/data/dist/modules/morkborg-0.8.3.tgz`.
Module release version stays **0.8.3**. Previous archive retained separately as
`/tmp/morkborg-native-setting-before.tgz`. Server/logic binaries are identical;
UI embeds manifest metadata and therefore has a new hash. The 24 earlier browser
cases are evidence for the previous archive; new-archive full-host UI is pending.

All 13 maintained source suites and explicit source/UI/hook typing pass. Isolated
module checking/packaging passes. The maintained production integration runner
with `--system-version 6.0.1` passes **14 cases**, including future 6.0.2 rejection.
Before: `/tmp/morkborg-runtime-version-before.log`.
After: `/tmp/morkborg-installed-0zZApK/installed-results.json`.
The failed-before run is not included in the passing case count.

## Executed native evidence

Actual Core HTTP requests authenticated as **Gamemaster (role 4)** used native
documents and caller services. GM service/request sessions were separate; account
names were obtained from the live join data, not assumed from “gm”. Other available
accounts are assistant-GM `doratheexplorer` and player `ptest`; access credentials
and authorization to use those identities remain requested.

Five inventory cases passed on clearly named `[ADR-0001]` fixture Actor
`eYmxaktIoIJ4z8S8`:

1. Unique canonical IDs, single ammo category and distinct same-name data.
2. Persisted container membership, uncarried/carried totals 8→7→9, independent
   container space 2, and unchanged unrelated Items/flags.
3. Equip exclusivity, maximum tier rejection, and nested-container rejection.
4. Stale-source command409 with no write.
5. Deletion removes container membership while retaining both same-name Items.

The fixture was deleted by exact ID; subsequent caller-gated read 404 verified
absence. Output `/tmp/morkborg-native-inventory-results.json`; local driver
`temp/native-acceptance/inventory.mjs` (ignored). These compare persisted source
and module projection; native browser getter/card/tab comparison is not inferred.

All 12 class preview requests ran against actual hydrated native packs and real
random dice. **11 succeeded with 6 complete companion plans in the selected
outcomes**; Pale One returned409 for its two exact feat identities. All-unchecked
returned400. Actor IDs before/after were identical. These were previews only;
no character/companion creation, cancellation or partial-write recovery is credited.
This run selected a valid Forlorn outcome; the broken total2 branch was not drawn.
Output `/tmp/morkborg-native-generation-results.json`. Earlier deterministic
11-plan/14-companion evidence is separate from these random outcomes.

Read-only exact native document checks confirmed both Pale feat IDs, their equal
system hashes, actual Owl `HLu7lgwoNPlhfx3W`, and the stale Forlorn row referencing
`morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf`. The generic caller resolver denies that
nonexistent/out-of-scope pack403; no fallback document is returned. The module's
known invalid-row guard separately returns unavailable503 in maintained installed
tests. Exact Broken/root Catastrophes tables were readable. Output
`/tmp/morkborg-native-identities-live.json`. No new canonical choice was established.

Four native non-character fixtures (`container`, `creature`, `follower`,
`misery-tracker`) received unsupported character-command 400 with unchanged source.
Exact created Actor IDs were `mUsBnMPY1n5hMycI`, `43ymfF5I5pHGqvHk`,
`aA6JQCMAIRxLxiAZ`, `C3S0eqYQn6boda6f`. All were deleted and 404 verified.
Output `/tmp/morkborg-native-unsupported-results.json`.

Pre-existing world Actor count returned to **1**. Its identities, names, types,
system fields and flags, including all embedded Items, equal the pre-test baseline.
GM-visible chat contains 2 prior messages, with no timestamp since acceptance
started. No native setting or permission write was performed in this slice.

## Native matrix disposition

| Case | State at this checkpoint |
| --- | --- |
| MB-A01 | Partial: persisted source/module inventory comparisons pass; native browser getter/cards/tabs pending. |
| MB-A02 | Partial: runtime/default/version availability and class catalog recovered; four native settings change/restore and stale dialogs pending. |
| MB-A03 | Pending live attack/defense/manual/no-automation matrix. Source/isolated Core proof retained separately. |
| MB-A04 | Pending live rest/advancement resource snapshots. |
| MB-A05 | Partial: exact native content identities verified; power/feat/Broken/resource execution pending. |
| MB-A06 | Partial: all12 previews/empty selection tested,11 successful selected plans; native create/cancel/custom/access/partial recovery pending. Pale/Forlorn identities unresolved. |
| MB-A07 | Partial: five native persisted inventory cases pass and clean up; native UI/source round trips and denied prerequisite acceptance pending. |
| MB-A08 | Pending non-GM account access, owner/observer/hidden boundaries, native visibility/revoke/reconnect. |
| MB-A09 | Pending full-host/native browser. Computer Use inventory reports no apps/browsers; browser connection or explicit isolated CDP automation authorization requested. |
| MB-A10 | N/A: no persisted repair selected, lossless handedness read normalization retained; affected historical worlds are unknown. |

No full NPC sheets, Misery, party ordering or arbitrary scripts were added.
No Core capability blocker was established. The current constraints are available
browser control and missing non-GM account access. Complete the full relevant
matrix on this runtime before requesting another version. Do not close the ADR or
archive the audit from this partial execution.

Cleanup completion: player GM session logout succeeded; local cookie removed.
The task-owned isolated API3972 and frontend3971 were stopped; their processes
and listeners are absent. The supplied Foundry world remains running, with active
users restored to0 (its initial count). No task-owned service is retained; unrelated
pre-existing processes were left untouched.
