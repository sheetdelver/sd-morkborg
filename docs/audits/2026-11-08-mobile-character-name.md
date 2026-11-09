# Mobile character name review

Decision: [ADR-0003](../adr/0003-mobile-character-name.md).
Production observation 29: Core 0.22.3, Mörk Borg module 1.0.1, Shpeelg at
390×844 splits mid-word; 414px fits. This is a user report, not a live probe.

Implemented on `fix/mobile-character-name` from `9762a96`: phone name size30px
(previously36px), shrinkable profile/name flex children. Existing larger sizes,
font, colors, portrait and long-name wrapping are retained.

`tests/browser/name-regressions.mjs` runs through `tests/browser/run.mjs` with an
installed package and real module CSS. Set optional `MB_TEST_FONT` to an existing
local IM Fell woff2 file for the font-specific check; no downloaded font or
runtime dependency is bundled. A served fixture portrait must load successfully.

| Width | Short name | Long-name horizontal overflow |
|---|---|---|
| 390 | One line | None |
| 414 | One line | None |
| 820 | One line | None |
| 1280 | One line | None |

The before test failed for long-name overflow at820, not the exact short-name
split. Earlier hidden-portrait/fallback-font runs were insufficient and discarded
as acceptance evidence. Final screenshots were visually inspected. Source typing
and isolated packaging pass. No retained test server, Core change, version bump,
compatibility change or production document write.

- [x] User confirmed verification on 2026-11-08.
- [x] Patch release 1.0.2 authorized.

Existing closed work and deferred dice sequencing remain outside this task.
Operator acceptance is separate from the isolated reproduction limits above.
