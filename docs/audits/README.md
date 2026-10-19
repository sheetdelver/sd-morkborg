# Mörk Borg audit index

## Active

[2026-10-18 native data and behavior alignment](2026-10-18-native-alignment.md)
is the single active module report. It owns MB-N01–13, carries MB-C01–04 forward,
and records feature follow-ups MB-F01–06. Implementation and qualified execution are tracked in
[module ADR-0001](../adr/0001-native-data-and-behavior-alignment.md), with G0–G9
checkpoints and native acceptance cases MB-A01–10. G0/G7 have offline/isolated evidence; G8 native acceptance and G9 closeout remain open.

## Predecessor evidence

[Core 0.19.3 compatibility review](2026-10-18-core-0193-compatibility.md) records
build/typing/package checks and actual-route error/empty-catalog probes. Its scope
was narrower; its open findings are carried into the active report. Retained here
as predecessor evidence, not archived as completed remediation.

The native report separates required corrections from deferred features. Keep
those dispositions visible during closeout; move an audit to completed only after
required scope is verified and unresolved work is explicitly carried forward.
