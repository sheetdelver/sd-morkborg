# Mörk Borg audit index

## Current status

**No active remediation audit.** [ADR-0001](../adr/0001-native-data-and-behavior-alignment.md)
is closed for the agreed native-alignment/Core-contract scope as of October 19,
2026. Release preparation/publication remains separate and requires its own
Git/release authorization. Module version remains 0.8.3, Core floor 0.19.3.

## Completed evidence

[Native data and behavior alignment](completed/2026-10-18-native-alignment.md)
resolves MB-N01–13, MB-C01–04 and MB-R01–05. Its historical checkpoint statuses
are superseded by the final reconciliation, not new work queues.

- [Native matrix and cleanup](evidence/2026-10-19-native-acceptance.md): selected
  Foundry 14.367/native 6.0.1, actual production frontend/API, MB-A01–09; MB-A10 N/A.
- [Reviewed content policies](evidence/2026-10-19-content-decisions.md): both Pale
  choices and the complete mapped Hegelian Owl, source preservation and cleanup.
- [Independent implementation review](evidence/2026-10-19-independent-review.md):
  five residual findings at `f48332e`.
- [Corrective implementation](evidence/2026-10-19-review-corrections.md) and
  [independent review](evidence/2026-10-19-correction-review.md): all five fixed at
  `ae69c76`, 19 suites, 40 installed Core cases and 36 browser cases.
- [Final focused native acceptance](evidence/2026-10-19-correction-native.md) and
  [portable ledger](evidence/2026-10-19-correction-native.json): all five changed
  paths on the reviewed archive; nine result groups, 16 ability/visibility cases,
  exact baseline comparison and cleanup. Earlier full-matrix cases retain their
  original artifact identities and are not counted as newly rerun cases.
- [v13 preflight](evidence/2026-10-19-v13-preflight.md): unsupported 5.1.2 boundary,
  no native writes or pass. **MB-V13-01 is out of scope by user decision**; current
  support follows upstream native 6.0.x/Foundry 14. Other versions require evidence.

[Core 0.19.3 compatibility review](2026-10-18-core-0193-compatibility.md) remains
predecessor evidence. Its findings were carried into and resolved by ADR-0001;
its earlier pending statements do not create a second active queue.

## Preserved follow-ups and policies

These are explicit boundaries, not unfinished release gates. Select new scope
before implementation; do not reopen the completed ADR by inference.

| ID | Disposition and reconsideration boundary |
| --- | --- |
| MB-F01 | Full creature/follower sheets and morale/reaction controls deferred. Truthful type-aware unsupported handling is complete. Select dedicated actor workflows before extending. |
| MB-F02 | Dedicated container-Actor management deferred. Complete generated companion/container plans remain implemented and qualified. Select a management UX separately. |
| MB-F03 | Misery tracking/apocalypse presentation deferred; no migration or maintenance obligation. |
| MB-F04 | Native encounter party ordering/turn hooks deferred. Current sheet party action posts a roll; HUD uses individual initiative. Revisit with an explicit encounter/Core contract. |
| MB-F05 | Journal DRAW/CREATE automation, hotbar and arbitrary scripts deferred. Safe descriptions/exact references are complete; no implicit script authority. |
| MB-F06 | Browser-only third-party CONFIG execution deferred. Four standard abilities supported; omitted native additionalAbilities scope is proven client-local. New configuration support requires an authoritative non-browser contract. |
| Pale One policy | Approved exact two-source selection remains provisional. Revisit only with authoritative content identity evidence; preserve canonical provenance and dependency validation. |
| Hegelian Owl policy | Approved exact stale-row-to-Actor mapping remains provisional. Revisit with authoritative upstream identity correction, not generic same-name substitution. |
| MB-V13-01 | v13/native5.1.2 support declined. Reconsider only if the user selects legacy support; prior preflight is not native parity acceptance. |

No demonstrated external Core blocker, selected persistent migration or new SDK
minimum remains for this release scope. Absence of a migration catalog is the
recorded N/A decision, not a claim that every historical world is repaired.
