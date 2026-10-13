# Sheet Delver - Mörk Borg sheets module

Core owns the single shared-image overlay on player pages. The module keeps its
SCVM palette on sheets in both Core themes; on phones its opaque section bar
sits above Core's floating tools and weapon/armor details wrap. A 390×844
browser check is still required before release.

The sheet retains its SDK `SharedContentModal` mount for Core versions admitted
by the existing `>=0.14.2` minimum. On Core with ADR-0062's persistent media host,
that compatibility component is inert and produces no duplicate overlay.

### About

Provides dedicated support for the Mörk Borg RPG system in Sheet Delver:
- **Character Sheets**: Full character sheet with the signature Mörk Borg aesthetic — yellow, black, and pink brutalist design.
- **Ability Rolls**: Click any ability (STR/AGI/PRE/TOU) to open a roll confirmation modal showing the resolved formula before dispatching.
- **Roll Modal**: Generic confirmation dialog for all rollable actions — shows formula, optional DR, and roll mode selector (Public/GM Only/Blind/Self).
- **Feats & Scrolls**: Formula feats roll via the modal with resolved `@ability` values; macro feats (e.g. Brew Decoctions) trigger immediately; passive feats display only.
- **Violence Tab**: Equipped weapons and armor only — with Attack/Defend roll buttons using the full automated sequence.
- **Custom Chat Cards**: Styled Mörk Borg chat cards for all roll outcomes (ability tests, feat rolls, attacks, defense, initiative, broken, get better, decoctions).
- **Get Better**: Automated sequence rolling HP, all four abilities, and debris — including auto-creating found scrolls in the actor's inventory.
- **Equipment Management**: Full inventory with quantity controls, equip/carry toggles, and an **Organize Inventory** button that merges duplicate items.
- **Rest System**: Rest modal with food/drink condition tracking, infection handling, and HP recovery rolls.
- **Spend Omen**: Omen spending with outcome reminder card.
- **Broken & Initiative**: Broken condition rolls and individual/party initiative.
<img src="https://github.com/sheetdelver/sheetdelver/blob/main/images/sheets/morkborg/mb-character-sheet.png" width="25%">

### Prepared Actor Lifecycle

This module requires Sheet Delver `module-api >=1.1.0`. Its adapter prepares
each source Actor once per source revision; the dashboard, sheet, card, roll,
and initiative paths consume that shared prepared model. The hook remains
deterministic and does not write derived values back to Foundry.
Card resource shapes are typed inside the module, not added to the generic
Core SDK. Silver accepts a numeric/text scalar and falls back to zero for an
invalid non-scalar value; the prepared-Actor fixture covers all three cases.

From this module's local checkout inside the Sheet Delver repository, run the
behavior-preserving contract check with `npx tsx src/tests/prepared-actor.test.ts`.

### Distribution

Pull requests and changes to `main` validate the module contract and build its
distribution package using the pinned Sheet Delver toolchain. To publish a
release, first set the workflow's Sheet Delver reference to a stable core
release tag, update `info.json`, and push the matching module tag (for example,
module version `0.6` uses tag `v0.6`). The release workflow publishes the
archive, checksum, and `sheet-delver-manifest.json` consumed by the module
catalog.

### Third-Party Licenses 

**Mörk Borg RPG**
Mörk Borg is copyright Ockult Örtmästare Games and Stockholm Kartell. This product is an independent production by SheetDelver and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the [MÖRK BORG THIRD PARTY LICENSE](https://morkborg.com/license/).

## SDK Feedback Compatibility

The module requires SheetDelver Core `>=0.14.2` and
`ui-extension-api >=2.0.0 <3.0.0` (SDK 2.0.0). Core renders the SCVM Factory
dashboard card; this module retains its generator page, sheets, and shared
chat-card styling. CI and release packaging use Core `v0.14.2`.
Notification progress/lifecycle adoption is not required.

The dice tray and its frame use Core defaults. No Shadowdark-derived tray
theme is applied; a distinct Mork Borg tray design can be added separately.

Roll sequences and decoctions post one chat card with the caller's public, self,
GM or blind visibility and the original evaluated rolls. Run the offline
regression from the Core checkout:

```sh
npx tsx data/local/modules/morkborg/src/tests/roll-visibility.test.ts
```
