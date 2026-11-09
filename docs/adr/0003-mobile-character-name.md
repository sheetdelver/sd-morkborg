# ADR-0003: Mobile character name width

**Status:** Completed — isolated checks and operator verification accepted
**Date:** 2026-11-08

---

## Decision

The production review reports Shpeelg wrapping as SHPEEL / G at 390px. Keep the
existing IM Fell heading, portrait, palette, responsive profile layout and
long-name wrapping. Reduce the phone heading from text-4xl to text-3xl and allow
both containing flex children to shrink with `min-w-0`. Larger breakpoint sizes
remain unchanged. No Core/SDK behavior or runtime data changes.

## Evidence

The installed-archive browser harness tests Shpeelg and a long multiword name at
390, 414, 820 and 1280px with a visible 96px portrait. The isolated run supplies
the same locally available IM Fell webfont as Core. All four widths pass after
the fix; screenshots were inspected at phone and desktop sizes.

The exact reported short-name wrap was not reproduced in the baseline harness.
It did reproduce long-name horizontal overflow at 820px, which the same test now
rejects successfully. Earlier fixtures without the font or with a hidden failed
portrait gave extra room and are not acceptance evidence. The final fixture uses
a served SVG portrait and checks its natural width.

The user confirmed verification on 2026-11-08 and authorized patch release
1.0.2. This operator acceptance does not imply an agent-run live Foundry probe
or redefine the existing presentation design.
See [the audit](../audits/2026-11-08-mobile-character-name.md).
