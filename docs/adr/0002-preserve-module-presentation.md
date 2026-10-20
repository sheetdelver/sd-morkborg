# ADR-0002: Preserve Mörk Borg presentation through behavior changes

Status: Open — presentation checkpoint accepted; external dice follow-up recorded
Date: 2026-10-20

## Context

The user reported that 0.9.0 lost the SCVM Factory's design and the module's
skewed, textured modal treatment. The review was explicitly expanded to **all**
UI changes since 0.8.3, not only these examples. See the
[complete audit](../audits/2026-10-20-presentation-regressions.md).
ADR-0001's native behavior decisions remain closed and authoritative.

The user rejected the first restoration: its tabbed Factory and manual preview
step did not match the original. Passing layout/interaction tests did not
establish visual fidelity. The source at `8cde351` is the restoration baseline.
The user additionally identified wrapped desktop navigation and intermittent
Item-modal flicker/reloading. Those are part of this correction.

## Decision

Restore the yellow/black/pink palettes, cut-paper borders and shadows, tilted
panels, serif headings, textured forms and skull dismissal control. Restore
Factory class-selection controls, dashboard return, dice preview control and
readable character/Item/companion review. The Factory automatically generates on
opening after its authorized class catalog arrives. Keep classes, the
Name/Class/HP/Omens blocks, background/Class/Abilities/Equipment panels and the
full-width “SAVE THIS ONE” control together on one page. Reroll uses the original
d20 control. Do not insert a separate Preview step or Classes/Preview tabs.
Generate automatically once per mounted world/user scope. Repeated healthy
connection status does not invalidate catalogs or regenerate a character.
Actual context/access/content changes still retire the candidate; the user
explicitly rerolls after those changes instead of losing their work silently.
Native Item descriptions are presented
through the SDK sanitizer; they do not execute content or add guessed rules.

Keep the current server-reviewed candidates, exact identities, write receipts,
caller authorization, refresh fences and recovery. Palette and panel-tilt
selection are cosmetic and occur only after a successful current generation.
Every new result selects a different palette and reverses the tilt direction of
the four stat cards, four detail panels and save control. Both remain stable
during class selection, healthy heartbeats, confirmation and recovery.

`module/ui.tsx` declares `assets/presentation.css` using the existing public
stylesheet contract. Scope every selector to `.sdk-module--morkborg`; use explicit
palette variables rather than interpolated utility names which a static compiler
cannot discover. Load the same asset for local and packaged surfaces. Keep
module fonts backed by the host font variable with a serif fallback.

Keep the native dialog top layer, keyboard containment, shared-content yielding
and Core confirmation component. Style those working shells. Small screens
remove form rotation where it would clip controls; desktop/tablet navigation
keeps all four controls on one row, sizing them to the available width.
Keep the Add Item catalog grouped and its scrolling results area bounded, so
asynchronous content arrival does not resize the entire centered modal.
Core retains shared chat, dice, notifications and
footer clearance.

## Acceptance

- Every changed UI path has an explicit disposition in the audit.
- Factory class selection, all palettes, complete preview, confirmation,
  cancellation and creation recovery remain usable.
- All four sheet tabs, forms, cards, confirmation and manual roll controls retain
  module styling at 360/768/1280/1920 in both host appearances.
- Keyboard, owner revocation, refresh, exact inventory actions and shared overlays
  retain the maintained browser regression coverage.
- Explicit module typing and isolated package/check pass. Production logic/server
  output remains unchanged from the released baseline.
- No release version, SDK requirement, native support range or migration changes.
- Ordinary healthy status heartbeats preserve the candidate and open Item
  catalog; real reconnect/context invalidation still refreshes or retires them.

## October 20 operator findings

The initial isolated tests missed the real heartbeat cadence and browser CSS
caching. The first restoration was also rejected for visual differences.
Those results remain historical, not acceptance of the corrected Factory.
The module heartbeat correction now passes the same two previously failing
mounted cases. Core separately owns stale stylesheet caching and slow session
restoration in Core ADR-0065. No Core fix is claimed as part of this module.
The current archive and precise test limits are recorded in the audit.

### Palette and rotation refinement

The user accepted the restored single-page layout and confirmed that the
separate Core fixes resolved the loading problems. Their remaining Factory
request is to reshuffle tilts for each new result and use
[SCVMBIRTHER's](https://scvmbirther.makedatanotlore.dev/) actual color combinations.
This supersedes the earlier five-palette approximation and fixed CSS angles.

The live reference's `static/js/main.23471cfb.js`, inspected October 20, defines
seven palettes: classic, doom, flesh, pig, gold, ink and sarkash. They use black,
white, yellow `#ffe82c` and pink `#f142af`; no gray palette. The module maps those
body, heading, border, button and equipment-description combinations onto the
restored layout. Shadows use solid palette ink, and toolbar/dice controls use
the same palette. Button hover keeps contrasting foreground/background colors
rather than copying the reference's black-on-black doom active-button value.
No reference artwork or fonts are redistributed.

Angles alternate left/right, with a random magnitude of 1–2 degrees selected
once per accepted result. This includes “SAVE THIS ONE”: merely changing -2 to
-1 degrees did not satisfy the user's direction-switching requirement. Do not restore
randomness during rendering: that would move panels while the user operates
unrelated controls. The straight class-selection box and the page layout remain
unchanged. Focused packaged-browser checks cover all seven color mappings,
all nine changing tilts and stability between generations; responsive checks
continue at four widths in both host appearances.

## Boundaries

This is a module presentation repair. No live Foundry acceptance is claimed by
the isolated browser run. On October 20, the user accepted the current Mörk Borg
presentation and authorized a local checkpoint, including the final palette/tilt
refinement. This is scoped operator feedback, not a claim that every native
workflow was rerun. Publication still requires separate authority.
Attack/defense follow-up dice timing is recorded as external Core work in
MB-UI13; this checkpoint does not implement it. The ADR remains open to track
that disposition while the user reviews Shadowdark separately.
Release-workflow reuse and D&D presentation are separate tasks.
