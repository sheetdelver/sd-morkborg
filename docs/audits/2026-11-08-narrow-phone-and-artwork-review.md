# Observations 29, 32 and 16 follow-up

Baseline: Mörk Borg1.0.2, commit750e975. Branch:fix/narrow-phone-name.
Decision: [ADR-0004](../adr/0004-narrow-phone-header.md). No live world probes.

## 29 — narrow names

- [x] Record partial1.0.2 resolution;390px-and-wider acceptance is retained.
- [x] Reproduce the320px split in the published archive. The exact360px report
  is not reproduced by the isolated fixture.
- [x] Stack portrait/name on very narrow viewports; preserve larger layouts.
- [x] Installed browser8/8, explicit module typing and package checks pass.
- [x] User confirmed phone widths 320–414px; tablet follow-up is observation 32.

## 32 — tablet breakpoint and test gap

The earlier 8-width test rendered Sheet directly. It omitted ActorPage's
`w-full max-w-5xl mx-auto p-4` wrapper, giving the name extra room. That result
is isolated sheet evidence only; it did not validate actual page sizing.

The runner now renders the installed module's ActorPage and its real wrapper,
using isolated SDK document snapshots and host surface classes/styles. The
phone-only package reproduces the split at 768, 810, 820 and 834px (name boxes
257, 299, 309 and 323px here). Its 15px scrollbar accounts for the corresponding
difference from the reported box widths. No production connection is used.

The fix moves the large heading and side-by-side stats together to 1024px.
Tests cover 320, 360, 375, 378, 379, 384, 390, 414, 640, 767, 768, 810, 820, 834,
885, 900, 1023, 1024 and 1280px at DPR 2. Long multiword and unbroken names must
not overflow. Final package result and operator acceptance are recorded below.

- [x] Real-page baseline reproduces all four reported iPad widths.
- [x] Coordinated tablet/desktop breakpoint change implemented.
- [x] Installed ActorPage test passes all 19 widths with the real font and
  portrait; explicit module typing and packaging pass. Tablet/desktop
  screenshots visually inspected.
- [x] User confirmed 20 widths from 320–1440px, including iPad portrait and
  1024px desktop transition; screenshots accepted on 2026-11-08.

## 16 — native artwork, investigation complete

`src/data/Generation.ts` assigns the exact Class image to Actor.img and
prototypeToken.texture.src. `newDocument` retains source Item images while
removing document identity/ownership. The module references the installed
Foundry system paths; it does not bundle those class-token/weapon-image files.

Native reference commitd850c094a9452d752307221f42245a73b66bdfbb, README Credits,
attributes class-token artwork to Johan Nohr/Chris Betancourt and weapon icons
to @vil, both described as used with permission. This audit establishes the
technical source of the images, not permission for separate marketing reuse.

Edit SCVM currently exposes name, abilities and resources, with no portrait or
token-image editor. Replacing only the Actor portrait would leave token and Item
art visible elsewhere. The isolated browser runner already supplies fixture
artwork without changing live documents.

Technically fixable if a separate artwork policy is selected: use controlled
demo fixtures with project-owned/licensed artwork for documentation/screenshots,
or add an opt-in artwork override covering portrait, token and Items. Recommend
the fixture approach for the reported marketing concern. Preserve native images
for ordinary play. No production data or generator-art behavior was changed;
no new runtime feature is selected by this investigation.
