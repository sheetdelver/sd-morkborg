# ADR-0001 isolated installed checkpoint

October 18, 2026. This is module implementation evidence, **not native-world
acceptance**. ADR-0001 and the active audit remain open.

## Identities and scope

- Module branch `fix/adr-0001-native-alignment`; version **0.8.3**, unchanged.
- Released Core **0.19.3**, `90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`,
  exact `v0.19.3`. Original checkout stayed clean/read-only.
- Native tag **6.0.1**, `d850c094a9452d752307221f42245a73b66bdfbb`;
  manifest **6.0.0 / Foundry 14**. Original checkout stayed clean/read-only.
  No v13 compatibility claim.
- G7 installed archive (retained as `/tmp/morkborg-native-setting-before.tgz`),
  SHA-256 **c5676bc0d2c9144c3cf6b4f3bf0854cd799395b1eea6081003408021ee3481c4**.
  Only this archive was installed in the final production integration run.
- Core >=0.19.3, module-api >=1.5.0 <2, UI >=3.2.0 <4, roll >=1.0.0 <2.
  World settings/context justify module API 1.5; public UI context signals justify
  UI 3.2. No relation/migration catalog dependency requires API 1.6. CI checkout,
  reusable release workflow and `core_ref` all select `v0.19.3`.

## Executed checks

All **13 maintained `src/tests/*.test.ts` suites** pass, including the original
**21/21 native-alignment cases**, previously 20 fail / 1 pass. Explicit module
source/UI/hooks/tests typing passes via `scripts/typecheck.mjs`. Released-Core
module checking and isolated packaging pass. Root TypeScript alone is not counted
as module typing.

The actual released-Core development registry loads the final source adapter and
server routes with isolated data (`/tmp/morkborg-adr0001-dev-loader.log`).
The maintained `tests/integration/run.mjs` archives the reviewed Core commit into
a new directory, installs the archive, enables it through Core's registry and runs
**13 passing production integration cases**. Final output:
`/tmp/morkborg-installed-gC3XrH/installed-results.json`.

These use real Core Stores, world context, managed production loader, caller-bound
documents/compendium/dice/chat services and visibility handling. Only the transport
boundary is a fixture; no privileged replacement document projection is used.
Cases cover defaults/source preservation, OWNER/GM vs OBSERVER/hidden access,
all four roll modes, pack denial/empty/restore, setting false/stale revision,
ownership revocation during a roll, disconnect/recovery, request retirement before
the first module await, sheet raw combat fields with real Core dice, copied-native
generation, the broken Forlorn result, and partial create/status/no replay.
This is not a running Core HTTP/session application or native permission-hook test.

The maintained `tests/browser/run.mjs` runs actual packaged UI and SDK/Core
confirmation, rich editor, UIProvider and FloatingHUD in isolated Chrome.
**24 cases pass**, with **zero runtime errors**. Final output:
`/tmp/morkborg-browser-VGPvnP/browser-results.json`. Pointer/keyboard input checks
safe content; select/Tab/Escape/focus restoration; confirmation border/shadow;
picker loading/denied/empty/retry/search/reconnect; ownership-only context changes;
late action/generation/status retirement; partial creation review/no replay;
buffered text/resource editing; native handedness and tier limits; shared rich
editor save then Escape; permission-revoked editor closure; raw manual ability,
attack and defense fields; all 360/768/1280/1920 width and both appearance pairs;
HP 1234/5678; expanded mobile navigation and operable real Core tools.
Session/chat/router/requests are fixtures. Core-only global CSS prevents the host
from accidentally supplying the module's missing portal-root styles.

Two optional predecessor results are separate from those 24 passes: the same G5
Item description reproduces unsafe `onerror`; predecessor Escape already passes.
No screenshot-only result or already-working behavior is counted as a new fix.
See [tooling instructions](../../../tests/README.md).

## Failing-before versus passed-after

| Input / independent expectation | Before | After / maintained proof |
| --- | --- | --- |
| Original native resource/preparation/route cases | 20 fail / 1 pass, unchanged product baseline | 21 pass, `native-alignment.test.ts` |
| Native container/carrying fixture | `ccaf20f`: total 0 vs expected 3 | `native-inventory.test.ts` |
| Natural 20, Strength -3, raw damage 4 in `1d6+1` | `540d3bc`: damage `4` | `(4+1) * 2`, `manual-damage.test.ts` |
| Released request retires before document read | Actual installed response 500 | 409; `command-boundaries` and actual production probe |
| Hydrated Core raw rows queried using synthetic `pack` | Installed generation 503 | Exact scoped identity projection; `content-identity` and actual production probe |
| Companion with embedded Item ID strings only | Accepted incomplete source | Explicit unavailable; reconstructed full Items accepted, `content-identity` |
| Unique 1d2 draw after both attainable totals used, table has higher rows | Attempted another RNG call | Exhaustion before RNG; `table-contract` |
| Same Item HTML with event handler | G5 Chrome executes once | Zero; `content-safety` and Chrome |
| Expanded mobile More with real HUD | 1792 px² overlap | Zero overlap, pointer tools remain usable |
| Delayed response after ownership-only context change | Old Actor feedback/status disclosed | Retired; Chrome action and factory cases |
| Separate text keystrokes before source refresh | Resource/name reset; revoked editor remained open | Draft retained/one field committed; editors close on revoke |
| Public confirmation portal root with Core-only CSS | Border 0 px | Border 4 px, shadow 8 px; actual browser style/focus case |
| Save shared editor then Escape | Focus falls to body and Escape does nothing | Bounded body-focus recovery closes/restores trigger |
| Manual attack 20/4 and defense 1/4 | Browser sent cached `manualData`, rejected by discriminated server | Only appropriate raw fields; Chrome plus real Core dice request cases |

Local before logs remain under `/tmp/morkborg-adr0001-*before*`; current and
predecessor browser JSON/payloads are separate (`/tmp/morkborg-browser-P3TA9J`,
`/tmp/morkborg-browser-jEFyYq`, and the earlier isolated browser directory).
Driver corrections for Ctrl+A virtual keys, native select commit and CSS uppercase
text lookup are not product regressions or external blockers.

## Native identity investigation and generation qualifications

All **24 local tags from 3.0.0 through 6.0.1** were archived into isolated copies.
All **21 readable** snapshots contain Owl Actor `HLu7lgwoNPlhfx3W` and the same
Forlorn Items row `RaRYtTXoANahK7PP` in table `DfILdvixuR0LyIcT`, referencing
missing `morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf`. No canonical identity bridge
was found. This is longstanding in the readable history, rather than an evidenced
recent identity change. The module returns unavailable before creation; it never
substitutes an Actor by name. Correcting the actual source UUID removes this guard.

The same readable snapshots contain both Intuitive Power IDs
`BtoSeh36zY8IqOQJ` / `YcKA0JHLezBYt3fz`. The native first-name-match lookup does
not establish a canonical choice. Per user direction, Pale One remains pinned
unresolved/unavailable in the ADR.

Tagged database copies for **4.0.3, 5.0.0, 5.0.1** point at missing MANIFEST files.
No repair was attempted; these are unknown snapshots, not evidence about missing
content or the health of published release ZIPs. Older sampled NeDB snapshots
1.15.0/2.0.0/2.7.3 contained neither matching feature; not every older tag was read.
The portable [identity ledger](2026-10-18-native-identities.json) records revisions,
manifest/compatibility metadata, IDs and read failures without native pack prose.

The earlier G5 copied-content probe reconstructed companion roots but initially
left embedded Item IDs unhydrated. Its “complete companions” claim was too broad.
The corrected probe reconstructs all **13 native embedded Item rows** before
generation. It now proves **11 selected class plans / 14 complete companions**,
unique owned IDs, unchanged sources and Herbmaster weapon <=6 / armor <=2.
Local output `/tmp/morkborg-adr0001-native-generation.json`; maintained production
integration separately uses real hydrated Core packs. These are selected outcomes,
not every random branch: Pale One is unavailable; Forlorn total 2 is unavailable.
Other Forlorn outcomes can generate. No incomplete candidate is called success.

## Native acceptance and migration decision

**MB-A01–09: pending**, no native endpoint contacted. Offline source/installed/UI
evidence above does not satisfy native hooks, cross-session permissions, inline
reference authorization, full nested-host-modal behavior or disposable-world
cleanup. **MB-A10: N/A for this implementation**: legacy handedness is losslessly
read-normalized; no affected persisted-world inventory was supplied and no
persistent repair is selected. This does not assert no affected worlds exist.
Any future repair uses Core's reviewed maintenance mechanism and complete scope
diagnostics. No historical Item/resource/random-outcome reconstruction is attempted.

A bundled request for a disposable Foundry 14 endpoint/world/build, installed
Mörk Borg identity, GM/owner/observer/hidden test accounts and secure access, plus
scoped fixture/settings/permission writes and cleanup authorization is pending.
Complete the relevant matrix there before requesting any version switch.
`additionalAbilities` omitted native registration scope remains a runtime check.
There is no demonstrated Core blocker. Full NPC sheets, Misery, encounter ordering,
arbitrary scripts and browser-only add-ons remain deferred as recorded in the ADR.

The task-owned scratch server (4178) and Chrome (9417) were stopped after checking
their process identities. Maintained runners clean up their own server/browser.
No production-connected Core or native service was started; no test service retained.

Operator update after isolated qualification: the user supplied `localhost:30000`,
Foundry 14, passwordless GM, in response to the bundled disposable-world request.
Verify the active world, exact build/native identity and available roles before
fixtures; native results have not yet been credited at this checkpoint.
