# Core 0.19.3 compatibility review

**Date:** October 18, 2026

**Status:** Review complete; module adoption corrections recommended, not implemented.

**Successor:** The broader [native alignment audit](2026-10-18-native-alignment.md)
is now the active report. [Module ADR-0001](../adr/0001-native-data-and-behavior-alignment.md)
carries MB-C01–04 forward alongside native data/action findings. This report
retains the earlier bounded evidence and conclusions; its lack of a native-setting
finding is superseded by the successor's actual native-source inspection. It is
not a second implementation queue, and its findings have not been marked fixed.

## Conclusion

Mörk Borg 0.8.3 is accepted by Core 0.19.3's manifest validator and builds against
its SDK. It does not need a migration catalog or arbitrary SDK version bump merely
because Core added migration support. It **does need a bounded adoption pass**:
typed errors are erased, unavailable/filtered catalogs can produce invalid
characters, and mounted content consumers lack explicit context invalidation and
failure recovery. Existing CI still tests Core 0.18.0.

These findings concern the module's use of released Core contracts. This was not
a complete audit of native Mörk Borg rules, nor a new native/UI acceptance run.
No Core regression was established. Do not import Shadowdark's migration steps
or remediation queue into this module.

## Baseline and method

| Component | Verified state |
| --- | --- |
| Module | `main`, initially clean at `d9d250c`; `info.json` version 0.8.3 |
| Declared compatibility | Core `>=0.18.0`; module API `>=1.1.0 <2.0.0`; UI API `>=3.1.0 <4.0.0`; roll API `>=1.0.0 <2.0.0` |
| Core checkout | 0.19.3, commit `90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1`; read-only |
| Provided contracts | SDK 3.4.0; module API 1.6.0; UI API 3.2.0; roll API 1.0.0 |
| Toolchain pins | CI checkout, reusable release workflow and `core_ref` all select `v0.18.0` |
| Runtime operations | Existing offline suites; controlled route calls with in-memory dependencies; explicit typing; isolated module check/packaging |
| Excluded | Live Core/Foundry connections, actor/pack/settings writes, services, browser interaction, native version/rule parity, remote release inspection |

The user requested verification, not implementation or Git operations. Source,
tests, manifests, versions and workflows were not modified. Documentation records
the findings for a later module-owned task.

## Findings

### MB-C01 — route handlers erase typed SDK errors (required correction)

[server.ts](../../src/server/server.ts) catches all failures in the roll,
generation and item routes and returns `error('internal', getErrorMessage(e))`.
Core 0.19.2 corrected packaged SDK error recognition, and 0.19.3 retains it, but
the module converts the error before Core can apply its typed handling.

Controlled calls to the actual `actors/[id]/roll` route injected SDK errors at
the actor read boundary:

| SDK code | Required HTTP status | Current result |
| --- | --- | --- |
| `permission_denied` | 403 | 500, `code: internal` |
| `conflict` | 409 | 500, `code: internal` |
| `not_ready` | 503 | 500, `code: internal` |

The item route also returns 500 for an injected compendium permission denial.
No real actor was read, rolled or changed by these probes.

**Action:** preserve public SDK errors using `isSdkError` and their code/status,
or propagate them to the host's typed boundary. Preserve recovery semantics when
scope/context changes during an awaited operation. Do not use class identity
alone across bundled SDK evaluations or expose internal unexpected-error details.

**Acceptance:** source and installed-package routes preserve 403/404/409/503;
unexpected failures remain safe 500s. Test actual callers and OWNER denial/success
before claiming authorization acceptance. Typed responses are not permission
enforcement themselves; caller-bound document writes remain authoritative.

### MB-C02 — missing caller-visible catalogs return an invalid character (required correction)

[createMorkBorgData](../../src/data/DataManager.ts) loads Items and RollTables from
the supplied request compendium. This is the correct caller-bound direction.
Current Core `createModuleRequestRuntime` filters bulk reads by effective native
pack visibility after awaiting the read. A denied pack can therefore yield an
empty visible set; it is not necessarily a thrown error.

The actual `generate-character` route, with both visible sets empty, returns:

- HTTP 200, `success: true`;
- character name `Unknown`, no Class document;
- an undefined Item slot, which becomes `null` on JSON serialization;
- fallback generated resources despite absent required content.

The generator accesses `character.items[].type` during rendering and
`character.class.img/system` during creation without accepting that shape.
The route response is executed evidence; the resulting UI failure is source
tracing, not a rendered observation.

**Action:** validate each workflow's real content dependencies and use effective
pack capability/readiness information to distinguish denied, unavailable, invalid
and valid-empty data. A missing Class is not an authoritative classless template.
Refuse generation with an actionable response before fabricating a result. Keep
ordinary stat rolls independent of unrelated generator tables. Item browsing
should distinguish legitimate no matches from unavailable required content.

**Acceptance:** visible/denied/missing/empty Item and Table packs independently;
partial catalog; real classless template; zero invalid/null owned items; UI can
explain and retry. No unauthorized content is returned from a warmed cache.

### MB-C03 — mounted content consumers lack explicit invalidation/recovery (required adoption work)

[MorkBorgAddItemModal](../../src/ui/components/MorkBorgAddItemModal.tsx) loads on
`allowedTypes`/`fetchWithAuth` changes only. It has an unmount/dependency `active`
flag but no world/user/context generation or explicit world-context subscription.
It does not check `res.ok`; failures become an empty collection without retry.

[MorkBorgCharacterGenerator](../../src/ui/dashboard/MorkBorgCharacterGenerator.tsx)
requests its initial candidate on mount, stores it in local state, and has no
explicit context retirement. Failed requests become null without an explicit
recoverable state. Existing candidates can outlive the content/access scope used
to generate them. Incidental parent rerenders may refetch some picker data; they
are not proof that revocation, late responses and reconnect are handled.

Core 0.19.2 emits `world:contextChanged` for ownership-only changes too. The module
must consume relevant public lifecycle signals for its own mounted data. Its
actor page already uses `useActorSheet`; this finding does not justify replacing
that host actor lifecycle or creating another world cache.

**Action:** retire/refetch scoped item data and generator candidates when context,
user/access or world changes. Fence old responses, use explicit loading/ready/
failed states and retry, and gate dependent creation actions until current data
is valid. Preserve appropriate manual preferences on harmless refreshes. Define
how changed source assumptions are checked before actor creation, rather than
relying solely on an old client candidate.

**Acceptance:** mounted ownership-only revoke/restore, pack update, world/session
change, disconnect/reconnect and late response; invalidated content cannot remain
actionable. Browser and actual-host checks are still pending.

### MB-C04 — release/CI qualification still targets Core 0.18.0

[CI](../../.github/workflows/ci-morkborg.yaml) and
[release workflow](../../.github/workflows/release-morkborg.yaml) both use 0.18.0.
The [presentation test](../../src/tests/presentation.test.ts) also asserts current
compatibility strings. None of these has been updated during this review.

**Action:** during adoption, qualify the released target host (currently 0.19.3)
and update all toolchain pins coherently. Set the Core/API floors from the
capabilities and fixes actually used, with tests on the claimed floor. If older
hosts remain supported, test them explicitly. Do not copy Shadowdark's API 1.6
migration-relations minimum when Mörk Borg does not use those relations. Do not
add an aggregate `sdkVersion` field to `info.json`.

The existing ranges accept current contracts; the review found behavioral gaps,
not a manifest rejection. No release metadata bump is authorized by this review.

## Optional contracts and retained qualifications

| Area | Assessment |
| --- | --- |
| Caller-safe `/api/system/data` | Adapter has no `getSystemDataForUser`; inherited `getSystemData` returns `{}`. Current Core returns 403 for a non-full-GM without the caller-safe hook. No current module consumer of `/api/system/data` was found, so this is a dormant endpoint qualification, not proof that current sheets are broken. Add a safe projection if the endpoint is intended to be supported; do not expose an unrestricted cache. |
| World settings | No `worldSettings` declarations or consumed native setting inputs were found. Declaration is required when rules depend on such settings, not as a ceremonial checklist. Native setting/rule requirements need a separate evidenced comparison. |
| Migration catalog | No `migration.json`, identified schema transformation or historical repair requirement established. No catalog or migration hooks are required merely to run on Core 0.19.3. Introduce a catalog only for a proven data change and use the existing admin migration contract. |
| Adapter context hook | No `onWorldContextChanged`, but the adapter has no warmed content registry; server data managers are created per request. Do not add a no-op hook by rote. Mounted UI data still needs MB-C03. |
| Compendium privacy | Core's caller runtime filters `findAll/findOne/getById`; this module uses it per request and has no shared privileged content cache. No new content disclosure established. Handling filtered/empty results is MB-C02. |
| Canonical references | Class presentation reads the owned Class Item, not rewritten class-UUID strings. No direct dependency on Core's former name-substitution behavior was found. This is source review, not every reference shape tested. |
| Maintenance/admin | Core gates module requests and owns maintenance UI. The module does not need its own maintenance page, login form or migration coordinator. |
| Shared roller fixes | Mörk Borg uses its own `MorkBorgRollFrame` for sheet/initiative UI. Passing static markup checks does not establish adoption of Core's corrected focus/nested-dialog behavior. Rendered keyboard/mobile acceptance is needed; no live clipping defect was established here. |
| Full-GM service identity | A Core administrator/configuration requirement. Do not implement role escalation or a second service-account check in the module. |

## Validation evidence

- Existing prepared-actor, presentation and roll-visibility suites: **pass** on
  Core 0.19.3. They do not cover the newly reproduced route/generator failures.
- Explicit TypeScript check including all **35** module/source/UI/test files:
  **pass**, independently of Core's root exclusions.
- Core `module:check`: **pass**, including compatibility, public imports, UI/world
  boundaries, stylesheet compilation and all three entry bundles.
- Isolated packaging: **pass**; archive `morkborg-0.8.3.tgz`, SHA-256
  `e10ea1c7506d4c3cbf36e901f086a87da62d20587638356093b1fa73a080cde0`.
- Controlled probes reproduce MB-C01 and MB-C02 on unchanged product source.
- No rendered, installed-host or native Foundry acceptance performed.

The first isolated packaging attempt could not resolve Tailwind because the
temporary directory lacked toolchain dependency resolution. Adding a link to
the existing Core dependencies in that temporary workspace resolved it. This
was test setup, not a module defect; no application dependency was changed.

Local supplemental outputs are under
`/tmp/morkborg-core0193-review-oegpj2d_/` (`contract-probes.mjs/json`,
`typing.log`, `package-resolved.log`, isolated `data/dist/modules/`). The report
contains the reproductions and conclusions without requiring those temporary
files. No task service was started or remains running.

## Next implementation slice

On a separately authorized module branch: establish failing-before regressions
for MB-C01/02, implement truthful errors/content readiness, then MB-C03 lifecycle
and retry handling. Prove caller boundaries on an isolated released Core and
qualify MB-C04 metadata/toolchain choices. Update architecture, tests, terse
changelog and handoff at validated checkpoints. Native acceptance and local
commits/publication need their applicable user authorization. The existing
Shadowdark implementation branch and Core remain untouched.
