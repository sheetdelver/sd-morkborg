# ADR-0005: Minimum native system versions

**Status:** Implemented — offline verification passed; operator acceptance pending
**Date:** 2026-11-26

---

## Decision

User selected minimum-only native system admission after Shadowdark 4.1.2 was
blocked by a tested-version ceiling. Replace the current <=6.0.1 restriction with
>=6.0.0. A test baseline remains evidence, not an upper admission bound.

Settings/defaults and the two reviewed content decisions admit native versions >=6.0.0. Foundry 14, exact content identities, source equivalence, permissions and request retirement remain required.

Do not infer that all future native behavior has been verified. Actual data,
identity, access and operation checks continue to decide whether a request can
proceed. Core/SDK API ranges, module release version and declared minimum Core
requirements are unchanged. Historical acceptance records remain dated evidence;
this decision supersedes their native-version exclusion policy only.

## Verification and remaining work

Targeted minimum/newer-version and retained failure regressions are required.
Core ADR-0077 owns recovery messaging; this module uses public SDK contracts only.
No production probes, world writes or runtime service changes are authorized by
these tests. Broader feature qualification and operator acceptance are separate.

## Automated evidence (November 26)

Core’s actual world-setting/default resolver reproduced the original ceiling
using the unchanged manifest from Git, then admitted the updated declaration
at the baseline and newer versions while rejecting below-minimum versions.
Module boundary validation, packaging and explicit module TypeScript checks pass.
These are isolated offline checks, not operator/native runtime acceptance.

Both reviewed content-decision suites pass at 6.0.2, 6.1.0 and 7.0.0 with unchanged native-shaped fixtures. Exact source identities, missing/diverged data, permission loss and request retirement still fail their existing guards. This does not constitute native qualification of those future releases.
