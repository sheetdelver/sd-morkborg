# SheetDelver — Mörk Borg

Character sheets and tools for playing Mörk Borg with SheetDelver.

## Features

- Character sheets with Mörk Borg’s yellow, black and pink aesthetic.
- Ability tests, attacks, defense, feats, scrolls and styled roll cards.
- Inventory management, rest, Omens and Get Better.
- SCVM Factory character generation.
- Mobile-friendly navigation and Combat HUD initiative rolling.

<img src="https://github.com/sheetdelver/sheetdelver/blob/main/images/sheets/morkborg/mb-character-sheet.png" alt="Mörk Borg character sheet" width="25%">

Requires **SheetDelver Core 0.19.3 or later**.

See the [releases](https://github.com/sheetdelver/sd-morkborg/releases),
[changelog](CHANGELOG.md), [module architecture](docs/architecture.md) and
[working guidance](AGENTS.md).

Native data/behavior corrections and current qualification limits are tracked in
[ADR-0001](docs/adr/0001-native-data-and-behavior-alignment.md) and the
[active audit](docs/audits/2026-10-18-native-alignment.md). Remediation is in progress on a module branch. The audit records which checks
have passed and which installed/native acceptance remains outstanding.

## Third-party license

Mörk Borg is copyright Ockult Örtmästare Games and Stockholm Kartell. This product is an independent production by SheetDelver and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the [MÖRK BORG THIRD PARTY LICENSE](https://morkborg.com/license/).

## Release tooling

Use this repository’s independent `npm run release:tag` command. It prepares the
numbered changelog release, pushes its tag for validation, and asks separately
before publication. See [module release instructions](docs/RELEASING.md).
