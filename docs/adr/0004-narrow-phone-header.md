# ADR-0004: Phone and tablet character header

**Status:** Completed — phone and tablet fixes verified by the user
**Date:** 2026-11-08

---

Observation 29 was only partially resolved by 1.0.2. Below 379px, stack the name
below the portrait and retain the 30px font, portrait and class badge. The user
confirmed this phone fix at 320–414px. ADR-0003 remains historical evidence.

Observation 32 exposed a second transition: at 768px the heading grew to 72px
while the stats moved beside it. ActorPage's real max-width/padding further
restricted the profile. The previous test mounted Sheet directly, omitting that
wrapper; its passing 820px check did not establish actual page coverage.

Move both transitions to the 1024px desktop breakpoint. Tablets keep the 60px
heading and stats below the profile; desktop retains the large heading and
side-by-side stats. Long names wrap naturally without page overflow. No actor
data, artwork, Core contract or generation behavior changes.

The installed regression now mounts the module's actual ActorPage with isolated
SDK documents and the host surface classes. It retains the real font/portrait,
records name-box width and covers phone, tablet and desktop breakpoint edges at
DPR 2. The preceding phone-only package fails at 768/810/820/834, reproducing the
reported tablet split. See [the audit](../audits/2026-11-08-narrow-phone-and-artwork-review.md).

The user confirmed the corrected layout on 2026-11-08, including 20 viewport
widths and iPad portrait/desktop screenshots, and authorized patch release 1.0.3.
