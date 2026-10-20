# Isolated acceptance tooling

`--test-script factory-corrections.mjs` checks automatic generation, unchanged
healthy heartbeats, real reconnect/context retirement, all four desktop tabs
on one row, delayed catalog geometry and an open editor retaining unsaved input.
It initially failed both heartbeat cases before `useScopedCatalog` was corrected.
It also compares all seven Factory palettes against colors transcribed from
SCVMBIRTHER and checks that every new result changes all nine tilts without
movement during class selection, healthy heartbeats or confirmation.

The module runner disables HTTP caching and supplies fixture requests. It does
not verify the host's asset cache or cold-session startup. Those are separately
exercised with ordinary browser caching, real Socket.IO and actual player
providers/asset routes by Core's `player-startup-assets.mjs` (Core ADR-0065).
Module layout results do not establish operator acceptance.

Presentation repair uses the same runner with `--test-script
presentation-regressions.mjs`: all sheet tabs, dialogs and Factory at
360/768/1280/1920 in both appearances, declared stylesheet loading, visible
mobile controls, palette states, no page overflow and screenshots.
The manifest stylesheet and compiled utilities are loaded together, matching
the host contract. See the [current review](../docs/audits/2026-10-20-presentation-regressions.md).

These development tools require a configured supported Core toolchain (0.19.3
minimum; this presentation pass uses 0.19.5).
They do not start the Core application, use its `.env`, or contact a native world.
Runtime module code never imports these fixtures or host internals.

```sh
node tests/browser/run.mjs --core /path/to/core-0.19.3 --archive /tmp/morkborg-0.8.3.tgz
node tests/integration/run.mjs --core /path/to/core-0.19.3 --archive /tmp/morkborg-0.8.3.tgz --native-fixtures /tmp/copied-native-records
```

The browser runner extracts the archive, composes its actual UI with the released
SDK/Core confirmation, rich editor, UI provider and FloatingHUD, and drives Chrome
pointer/keyboard input. Session/chat/router and requests are fixtures.
Core's actual shared-content host and focus helper are included too: a module form
must yield and preserve the return trigger when an image is shared. The fixture
Foundry/config/session values supply that host component's context inputs.
The runner checks port availability (4181/9418 by default), uses a fresh temporary browser profile,
and stops its server/browser. `--port`, `--cdp-port`, and `--chrome` override defaults.
`--before-archive` optionally reproduces the old unsafe description behavior; an
already working predecessor Escape case is recorded separately from new passes.
Core-only global CSS prevents accidentally supplying module styles from the host.
The actual released installed import rewriter is applied before loading, with the
same shared React/SDK globals. This matters: resolving external react-dom normally
would conceal Core0.19.3's unavailable createPortal export. `--test-script
installed-smoke.mjs` runs the focused form-opening regression. `MB_CDP_TARGET` can
select an exact page when using the helper for authorized separate role contexts;
the helper brings that page forward before native input.
`ownership-smoke.mjs` isolates native observer ownership with the host's owner
fallback; the full suite includes that same editor-retirement case.

The integration runner archives the exact reviewed Core commit into a new `/tmp`
directory, symlinks read-only toolchain dependencies, installs the module archive,
and generates isolated managed configuration. It exercises the production registry,
Stores, world context and caller-bound request services with a deterministic
transport boundary. The fixture directory must contain `native-documents.json`
and `native-pack-rows.json` decoded from **copies** of the pinned native databases
(root records plus embedded rows). Native pack prose is not committed here.
Companion Items are reconstructed from embedded rows before validation.
`--system-version 6.0.1` also qualifies that explicitly verified native version
(the isolated default run uses checkout manifest 6.0.0).

Both runners retain their output directory and report the archive SHA-256 and
qualifications in JSON. They establish neither full Core HTTP/session acceptance
nor native document-hook, cross-session or disposable-world permission acceptance.
The completed ADR-0001 native matrix remains separate historical acceptance.
These tools do not reopen its closed gates.

The [selected native matrix](../docs/audits/evidence/2026-10-19-native-acceptance.md)
and [content-policy follow-up](../docs/audits/evidence/2026-10-19-content-decisions.md)
record the already-executed pair; these isolated runners do not replace it.
The [independent review](../docs/audits/evidence/2026-10-19-independent-review.md)
identified missing regression coverage MB-R01–05 at its recorded revision.
The completed corrections exercise rendered shield/ammo controls, refreshed open Violence
details, passive capability presentation and actual ability chat rendering. Include
the existing passing Special editor refresh as a control and retain the public
Core overlay/permission cases. Do not present new archive checks as fresh native
execution of that archive.


Review correction controls (compiled archive, isolated Core/Chrome, no Foundry):

```sh
node tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.8.3.tgz --test-script inventory-regressions.mjs
```

The installed Core harness additionally exercises shields and exact copied-native
ammo through the real request runtime, including permission, source preservation,
depletion and replenishment. Browser fixtures render the archive UI; their
in-memory Item callbacks are not a native backend acceptance claim.

Action/lifecycle correction cases use the same runner:

```sh
node tests/browser/run.mjs --core /path/to/Core --archive /tmp/morkborg-0.8.3.tgz --test-script action-regressions.mjs
```

The seven cases cover current Violence details and retirement on Item/Actor/
authority changes, mobile keyboard cleanup, Equipment/Special refresh controls,
and passive/formula/macro presentation. `ability-cards.test.ts` invokes the real
executor and chat renderer for all four abilities in all four visibility modes;
`feat-actions.test.ts` verifies shared capability and macro precedence/denial.
Installed Core cases additionally verify actual persisted chat content/recipients
and exact copied-native passive/formula/reviewed/unsupported macro execution.
