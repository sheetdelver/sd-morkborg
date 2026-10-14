# Sheet Delver - Mörk Borg sheets module

Core owns the single shared-image overlay on player pages. The module keeps its
SCVM palette on sheets in both Core themes. On phones its opaque section bar
sits at the viewport bottom: active tab left, one other tab, then More.
The public SDK footer contract reserves Core Tools/Chat/Players/feedback space
above it; desktop navigation and other modules' default placement stay unchanged.
Weapon/armor details wrap. The user accepted the mobile corrections on
October 13, 2026. The footer requires the published Core 0.17.1 contract below.

The sheet retains its SDK `SharedContentModal` mount for Core versions admitted
by its declared minimum. On Core with ADR-0062's persistent media host,
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

The development checkout requires SheetDelver Core `>=0.17.1` and
`ui-extension-api >=3.0.0 <4.0.0` (SDK 3.x). The UI API gate keeps it
incompatible with released Core 0.17.x. Before module release, raise the
Core minimum to `>=0.18.0` after Core 0.18.0 is published. Core renders the
SCVM Factory dashboard card; this module retains its generator page, sheets,
and shared chat-card styling. Its typed combat-HUD initiative adapter reuses
the sheet roller's module-owned frame and Auto/Manual control, not a Core-skinned
replacement. It displays Core's read-only formula/audience and returns only
a roll choice or **final** manual total (zero/fractions permitted); sheet raw-die
math, modifiers and audience selection do not run in the HUD. Sheet rolls
retain their existing rules. CI and release packaging target Core
`v0.18.0`; publish Core first. The retained development version `0.8.1`
has already shipped from main; choose an unused module version before releasing
this HUD branch. This merge does not authorize another release of `0.8.1`.
The optional SDK footer reservation introduced in Core 0.17.1 is retained
in this HUD checkout; it keeps Core controls above the module's bottom tabs.
Notification progress/lifecycle adoption is not required.
ADR-0061 hardening verification (October 14): offline module tests, explicit
source typing and isolated packaging pass on the integrated SDK/UI 3.1 host.
The rendered native HUD adapter preserves a supplied d6 formula and omits d20
overrides. Its dark/pink frame is checked at320/375/1280 in both Core appearances;
native Mörk participation still needs operator acceptance. This
does not certify party initiative or compatibility with the future release.

The dice tray and its frame use Core defaults. No Shadowdark-derived tray
theme is applied; a distinct Mork Borg tray design can be added separately.

Roll sequences and decoctions post one chat card with the caller's public, self,
GM or blind visibility and the original evaluated rolls. Run the offline
regression from the Core checkout:

```sh
npx tsx data/local/modules/morkborg/src/tests/roll-visibility.test.ts
```
