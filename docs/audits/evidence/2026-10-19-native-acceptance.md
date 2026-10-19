# ADR-0001 selected native acceptance and closeout review

The selected pair is **Foundry14.367 / native Mörk Borg6.0.1**, world `morkborg`,
on released **Core0.19.3 /90c13e5**. The reference remains tag6.0.1 /`d850c094`,
whose checkout manifest reports **6.0.0 /Foundry14**. All43 served rule/schema files
match that reference. This does not establish another runtime6.0.0 or v13 pairing.

Verified implementation checkpoint: `006019b563b7edf1946da240290a7c057d021d6a`.
The final module remains **0.8.3**, archive SHA-256
**1b7e1d48ab878fbaa080f5642d94f9d8b934136cde775410d8bc77967070822b**.
[Portable execution metadata](2026-10-19-native-acceptance.json) records identities,
case results, exact fixture identities, cleanup and qualifications without native
pack prose or credentials. Earlier checkpoints remain historical evidence;
this report supersedes their pending-account/service/acceptance snapshots.

## Verification and artifact identity

- **16 maintained source suites** and explicit source/UI/hooks/test typing pass.
- Released-Core module check and isolated packaging pass; version unchanged.
- **14 production Core integration cases** pass with the final archive:
  `/tmp/morkborg-installed-sVJrKw`. These use actual Core Stores/request contracts
  with a deterministic transport, separate from native acceptance.
- **26 installed browser cases** pass, zero runtime exceptions, using the actual
  released import rewriter, SDK globals, confirmation/editor/UI provider/HUD and
  Core shared-content host. Latest output `/tmp/morkborg-browser-wpCNNM`.
  Session/config/network are fixtures in this runner.
- A separate exact Core archive successfully built a **production Next frontend**
  with generated managed configuration and webpack. `next start` and the existing
  production API served the actual installed archive against native Foundry.
  No production `.env` or original Core files were changed.
- The actual production app executed eight width/appearance combinations
  (360/768/1280/1920 × light/dark through Settings), plus long rich content and
  editor persistence. The final presentation fix separately passed actual native
  pointer/Tab/Escape/focus acceptance on this production app.

The final server/logic bundles are byte-identical to the archive used for the live
rest/combat/resource slice (`3a7a0bc…`), and later UI slices:

| Entry | SHA-256 |
| --- | --- |
| `dist/server.js` | `e9973c8aba0fcb4f5ce592d8c88dbe9fc4899f65b3aa05929e6259103470d2eb` |
| `dist/logic.js` | `27de822f365dd21871616b97de91e70a21a0f32edaa2333f6ec1cc25b79794f1` |

The JSON ledger records final UI/style hashes too. Native action qualification
therefore does not depend on an assumed equivalence between changed server builds.
This is incremental acceptance, not a claim that every random outcome was replayed
on every intermediate UI archive.

## Native matrix

| Case | Executed result and boundary |
| --- | --- |
| MB-A01 | Native carrying/container/equipment source round trips pass. Native weight14/capacity5 gives +2 DR; disabling tracking removes the penalty and retires the dialog. Prepared cards/tabs/resources agree; original Actor source unchanged. |
| MB-A02 | All four settings changed/restored. Actual ammo/automation booleans and class restriction behave correctly. Mounted pack denial403 clears warmed content, preserves search, exposes retry; restoration refetches. `additionalAbilities` is client-scoped, not a world/service preference. Unsupported-version handling remains isolated contract evidence. |
| MB-A03 | Natural melee crit/fumble, ranged Presence and canonical ammo3→2, armored current1d2/max-tier2 DR, unarmored defense, complete composite multiplication, no HP/armor writes pass. Automation-off attack/defense roll once with no preference/ammo writes when tracking is off; separate damage action passes. Actual HUD final−2.5 persists without Agility addition or encounter start. RAW/native-code deviations remain explicit. |
| MB-A04 | All12 module rest combinations, independent12 native rest executions, negative HP, retained nonzero Omens, daily powers/Omens/spending pass. Module22/native16 real advancement trials observe equality at maxHP33 and bounds−3/+6, preserving currentHP−3 and inventory. No RNG substitution. |
| MB-A05 | Presence preview/result, uses, failure/fumble/critical instructions, exact Catastrophes root, all Broken totals/multiple/nested rows, formula/passive/reviewed macro feats and resources pass. Macro draws twice and presents one doses total, granting no Items. Native Broken inline instructions survive SDK chat without implicit dice/HP/Item effects. |
| MB-A06 | All12 baseline previews exercised;11 selected successful plans, Pale409. Exact classless and renamed native template, valid-empty200/generation400, denied class pack503 and required Table403 pass. Native complete creation persists private character/companion Items; a follower with a real embedded weapon is verified field-by-field. Actual factory cancel writes nothing, confirmation/create/status pass. Actual partial2/4 creation survives API restart; status200 returns both IDs, resubmission409 creates nothing. Pale and bad Forlorn branch remain unavailable by the decisions below. |
| MB-A07 | Single ammo/category identity, distinct same-name data, carrying/move/equip/tier/stale/delete source round trips pass. Last selected ammo1→delete clears container membership first. No name consolidation or guessed restoration. |
| MB-A08 | Real GM and passwordless player owner/observer/hidden boundaries pass; all four visibility modes retain exact author/speaker/recipients/blind flag. Warm GM concealed-Actor dependency cannot produce a player candidate. Held actual200 picker response cannot revive denied content. Held player action admitted after native hidden revocation returns404 with no chat/HP effects; owner restoration refetches. Source/production suites separately assert dice preflight order. |
| MB-A09 | Actual production modal/select/Tab/Escape/trigger focus, eight viewport/theme cases, HP1234/5678, expanded navigation/host Settings clearance, long safe content and SDK editor persistence pass. Actual API disconnect clears picker content; reconnect refetches and preserves `Knife` and session. Actual native shared image now retires the module top layer, accepts pointer/Tab/Escape and restores Rest focus. |
| MB-A10 | N/A: no persisted repair selected. Original disposable world has1 Actor/10 Items, zero legacy1h/2h values (native handedness string1 observed). Lossless read normalization covers known legacy module shapes; this does not prove other worlds are unaffected. No migration catalog or historical recovery guess added. |

Native output paths and per-case names are preserved in the JSON ledger. Selected
plans and trials are sampling, not exhaustive class-table outcome coverage. The
first five inventory/unsupported fixtures were already removed at the earlier
[runtime checkpoint](2026-10-18-native-runtime-checkpoint.md).

## Final defects exposed and corrected

`aadde52` fixed actual installed portal loading, native resource `min` merge
conflicts and missing combat preferences; `1b38ff4` fixed mounted observer editing
when Core's absent-isOwner fallback returned true. Their before/after evidence is
[recorded separately](2026-10-18-live-corrections.md).

The final slice corrects two additional presentation issues:

1. Native hidden revocation was mislabeled “Character Deleted.” The same production
   queued-action case now shows **Character unavailable**, without implying deletion.
2. Actual native sharing to the authorized GM test account exposed an HTML top-layer
   form blocking Core's shared-image controls. Before: form open, pointer misses Core
   close control, focus stays in Rest. The form now consumes public `content:shared`
   and retires so Core owns presentation. Layout-phase dialog cleanup closes before
   DOM removal, allowing Core to capture the real return trigger. After: form closed,
   Core close receives pointer; Tab/Escape and Rest focus return pass.

Before archive `bf8ded…`, actual `/tmp/morkborg-native-presentation-before.json` and
focused failed runner `/tmp/morkborg-native-host-shared-before.log` are distinct
from final `/tmp/morkborg-native-presentation-final.log` and the passing26-case runner.
An intermediate passive-cleanup version exposed lost return focus; it is not
credited as a passing fix. Its preserved installed UI entry hash was verified before
reconstructing `/tmp/morkborg-native-passive-cleanup-before.tgz`; the actual-Core
focused test fails return focus at `/tmp/morkborg-native-focus-before.log`. The lasting runner uses Core's **actual** shared overlay
and focus helper, not only a mocked close signal. No private Core import entered
runtime module code.

Two earlier production360 Settings attempts timed out and remain in the ledger.
They were rerun with a fresh production session, actual native Combat HUD,
continuous world/Actor readiness, real pointer hit-target diagnostics and settled
footer/tool transitions. Both light/dark cases pass actual Settings/radio/Done,
HP1234/5678 bounds, expanded More clearance and Rest Tab/Escape/return focus.
The six other production viewport cases and two content/editor cases had already
passed. These rechecks replace the two incomplete attempts, not their history.
The additional marked Actor/Combat were deleted; original Actor, all world-setting
sources and original message IDs compare exactly to the recheck baseline.

Initial driver mistakes (native ack envelope, `min`, exact Broken ID/nested rows,
CSS-capitalized labels, input focus, resize animation and DOM serialization) were
corrected against actual contracts. They are not claimed as product regressions or
Core blockers. No demonstrated Core blocker remains.

## Cleanup and retained state

The final journals contain **13 marked Actors,166 fixture messages,2 pack entries
and2 unstarted Combats**. Every exact ID is absent. The earlier five Actors were
already absent. Native world returns to **1 original Actor,2 original messages,
0 Combats,218 Items/46 tables**. The complete original Actor source compares equal.
Pack configuration, setting identities/values/other fields and originally absent
setting records are restored. Native Setting `modifiedTime`/`lastModifiedBy` audit
changes are deliberately retained; historical audit metadata was not fabricated.

Core test sessions logged out200; native browser returned to `/join`; public native
status reports **users0**. Task API3972, frontend3971, Chrome9420 and maintained
runner listeners are stopped. Supplied Foundry remains running. Core/native tracked
trees are clean at their pinned commits. Temporary artifacts/recovery reports remain
under `/tmp`; task cookie files were deleted. No task service is retained.

## Open decisions and support qualification

Pale One's duplicate Intuitive Power identities remain pinned per the user.
Historical21 readable tagged snapshots do not provide a canonical bridge for the
Forlorn Owl row; three copies are unreadable and were not repaired. No name-based
substitution is selected. These native data branches return truthful unavailable
states; MB-N09 remains qualified rather than claiming12 fully successful classes.
The ADR/audit remain open for those decisions and any separately selected runtime
qualification. Full NPC sheets, Misery, party encounter ordering/turn hooks,
arbitrary macros and browser-only add-on execution remain deferred.
