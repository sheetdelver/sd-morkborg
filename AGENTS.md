# Mörk Borg module working agreement

Read this file, then `temp/AGENT-HANDOFF.md` when present and its active task
references. Read [module architecture](docs/architecture.md) for technical context.
Do not adopt Shadowdark's audit or the Core handoff as this module's work queue.

[Module ADR-0001](docs/adr/0001-native-data-and-behavior-alignment.md) is closed
for its agreed scope; the [audit index](docs/audits/README.md) links completed
evidence and separately scoped follow-ups. The current presentation repair is
[ADR-0002](docs/adr/0002-preserve-module-presentation.md), with the
[whole-UI audit](docs/audits/2026-10-20-presentation-regressions.md).
Do not reopen historical checklists by inference. Release publication still needs
its own authority. For new work, follow the current task and record verified
progress/checkpoints in its owning plan. Core findings MB-C01–04 were resolved
within ADR-0001; they are not a separate queue.

## Scope and repository ownership

This is an independent SheetDelver system-module repository. Keep its code,
tests, documentation, audits and handoff here. Core and sibling modules are
read-only unless the current user explicitly selects work in those repositories.
An unavailable host contract is an external dependency to report, not permission
to edit Core, import private host code or add a direct Foundry transport.

Use public `@sheet-delver/sdk` entry points. Core owns source/prepared stores,
authorization, world/session lifecycle and shared chat, notifications and dice
presentation. The module owns system rules and its UI. Keep browser UI,
server-only orchestration and environment-neutral rules separated. Do not add a
second world cache/lifecycle or treat module-prepared data as native browser data.

## Git and release boundaries

- Check this repository's branch, status and version before work. Preserve
  unrelated changes, stashes, parked research and native reference checkouts.
- Feature implementation belongs on a user-authorized module branch, not main.
  A task that explicitly authorizes a branch needs no repeated permission.
- Other Git mutations and remote writes need their own scoped user authority.
  Do not infer commit/push/merge/tag/release permission from implementation work
  or an earlier release. Do not reset, discard or rewrite unrelated history.
- When a PR merge is authorized, use squash merge with branch deletion after
  required checks pass; verify merge and removal of that feature branch.
- `info.json` owns module version/compatibility. During implementation, prepare
  terse changelog notes without version bumps. Do not change Core versions,
  compatibility minima or CI toolchain pins as incidental housekeeping.
- Follow this module's CI/release workflows and the host's documented packaging
  contract. Release publication is a separate authorized operation.
- Record any Core/SDK/API requirement changes with explicit old → new versions
  in CHANGELOG.md and the current handoff, alongside manifest/toolchain updates.
  Keep this guidance current when a new required floor is adopted. Use the previous
  release baseline, not intermediate branch bumps; identify the supporting Core
  publication and whether it must precede the module release. Optional adoption
  must name its introduction versions without implying an increased minimum.

## Standalone release tooling

Use the module-local `npm run release:tag -- [version] --dry-run` and
`npm run test:release`; see [release instructions](docs/RELEASING.md).
`info.json` remains the only version authority. The npm manifest has no version
or dependencies. Tag pushes validate; a separately confirmed workflow dispatch
publishes only after exact-tag validation. Keep the helper, tests and workflow
changes together. Do not run a real release or push merely to verify tooling;
use temporary Git fixtures. No Core checkout is needed to run the helper.

## Data and verification discipline

- Native source fields, prepared results and caller-visible projections are
  distinct. Preserve canonical identities and original source data.
- Use native rules for the selected release. Record version/source provenance.
  Missing data must produce a clear unavailable/unsupported state, not invented
  formulas, dice, defaults or same-name document substitutions.
- Share preparation/action logic across sheets, cards, dialog defaults and
  server execution. UI may format/filter/select; it must not duplicate rules.
- Route caller operations through the public request runtime. Keep permission,
  privacy, source-preservation and failure behavior in regression coverage.
- Use SDK rich-text/URL handling and shared roll/confirmation components.
  Never use native browser alert/confirm/prompt for application flows.
- Exercise module forms with Core's actual shared-content overlay. Top-layer forms
  must yield through the public presentation signal and preserve return focus;
  a mocked dismissal signal alone does not verify nested host behavior.
- Treat host .env/settings as production-connected. Do not start Core or connect
  to live Foundry for a test without task-specific authority. Prefer offline
  fixtures and isolated outputs; never copy credentials into documentation.
- Browser tests are isolated development tools, not runtime/backend dependencies.
  Inspect listeners before starting/stopping a needed service and record any
  retained test process in the local handoff.
- Match tests to changed behavior. For confirmed defects, establish a meaningful
  failing case, then prove the fix with the same input and an independent oracle.
  Passing mocks/prepared fixtures do not establish native/operator acceptance.

## Documentation ownership

- `AGENTS.md`: durable working rules and verification entry points.
- `CLAUDE.md`: imports this module's AGENTS.md; do not maintain a second rules copy.
- `temp/AGENT-HANDOFF.md`: one replaceable local task snapshot, when present.
  Keep verified facts, user reports, unknowns, permissions and next steps distinct.
  `temp/` is ignored; a missing local handoff is not an error in a clean clone.
- `docs/architecture.md`: technical behavior and supported boundaries.
- `docs/adr/`: module decisions/plans; `docs/audits/`: durable findings/evidence.
  Number ADRs independently in each module, starting at 0001; identify Core
  decision references explicitly as Core ADRs.
  A handoff names one active module audit. Preserve historical reports and
  deferrals; old unchecked research does not become active work by itself.
- Keep tracked decisions understandable without ignored reports. Do not use
  architecture/ADR/audit files as repeated agent startup or permission notices.
  Record scope decisions once in the decision record and current authority in
  the handoff. Update documentation and tests with the implementation.

## Mörk Borg rules and UI boundaries

Preserve Mörk Borg resource shapes, roll visibility and its yellow/black/pink
presentation. Sheet Auto/Manual raw-die inputs and the HUD's final manual total
have different semantics; do not merge them by convenience.
Behavior refactoring does not authorize redesign. Compare all affected surfaces
with their prior design, including Factory palettes, tilted/textured forms,
typography and navigation. Preserve working accessibility and shared overlays.
Verify declared module CSS in an isolated packaged browser, not only development
utilities. Keep cosmetic state separate from generation and persistence.
Factory entry automatically generates once after the allowed class catalog
arrives. Do not replace this with a separate Preview step. A repeated healthy
connection status is not an invalidation; verify both catalogs and in-flight
action feedback across the host's actual heartbeat semantics.

Use native `carryWeight`/`containerSpace`/`carried` and canonical owned Item IDs.
Never consolidate destructive inventory operations by name, count overlapping
categories twice, or infer a missing weapon die. The existing `weight` test
fixture and repeated UI calculations are known gaps, not authoritative examples.
Test native-shaped data and independently expected resource changes. Native chat
instructions are not permission to add automatic HP or inventory mutations.

Follow the upstream system's Foundry support boundary. The user selected the
native6.0.x / Foundry14 line and declined retaining native5.1.2 / Foundry13 support.
MB-V13-01 is a recorded out-of-scope decision, not an implementation or closeout
blocker. Do not resume its compatibility proposal without a new user decision.
Future native versions still need source and acceptance evidence before support
claims; following upstream does not authorize unreviewed version-range expansion.

Record the selected native revision and reported system/Foundry versions. The
current local reference's 6.0.1 tag and 6.0.0 manifest differ; do not hide that
distinction or extend support to another native release without evidence. Read
copied compendium databases for offline audits, leaving the reference untouched.

The mobile section bar uses the public footer-space registration. Verify its
interaction with host controls and multi-digit current/maximum HP at narrow
widths. Do not introduce hardcoded Core offsets or duplicate host overlays.

The current HUD integration uses individual initiative. Party initiative and
native Foundry turn-hook automation need separately selected scope and native
evidence. Do not infer authorization from their absence.

## Verification commands

Run from a configured Core/toolchain checkout with this repository available at
`data/local/modules/morkborg` (or adapt that path to the isolated CI data root):

```sh
node data/local/modules/morkborg/scripts/typecheck.mjs
for test in data/local/modules/morkborg/src/tests/*.test.ts; do npx tsx "$test" || exit 1; done
npm run module:check -- morkborg
```

For installed-package and actual browser interaction regressions, use the isolated
runners in [tests/README.md](tests/README.md). They keep runtime test dependencies,
copied native records and temporary Core/browser state outside the product and
do not establish native-world acceptance by themselves.

Root TypeScript excludes module source; explicitly include the module when
checking types. Use isolated package output when validating distribution.
The current workflow is `.github/workflows/ci-morkborg.yaml`; inspect its pinned
host version before running compatibility checks. Tools may run from Core,
but module work does not authorize changing Core files or generated settings.
