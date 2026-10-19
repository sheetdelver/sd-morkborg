# SheetDelver — Mörk Borg

Character sheets and tools for playing Mörk Borg with SheetDelver.

## Features

- Character sheets with Mörk Borg’s yellow, black and pink aesthetic.
- Ability tests, attacks, defense, feats, scrolls and styled roll cards.
- Inventory management, rest, Omens and Get Better.
- SCVM Factory character generation.
- Mobile-friendly navigation and Combat HUD initiative rolling.

<img src="https://github.com/sheetdelver/sheetdelver/blob/main/images/sheets/morkborg/mb-character-sheet.png" alt="Mörk Borg character sheet" width="25%">

Requires **SheetDelver Core 0.19.3 or later**. The current module targets native
**Mörk Borg 6.0.x on Foundry v14**, following upstream system support. Foundry v13 /
native Mörk Borg 5.1.2 is outside the supported scope. The selected native test
pair is Foundry14.367 / Mörk Borg6.0.1; see the audit for exact qualification.

See the [releases](https://github.com/sheetdelver/sd-morkborg/releases),
[changelog](CHANGELOG.md), [module architecture](docs/architecture.md) and
[working guidance](AGENTS.md).

Native data/behavior corrections and current qualification limits are tracked in
[ADR-0001](docs/adr/0001-native-data-and-behavior-alignment.md) and the
[completed audit](docs/audits/completed/2026-10-18-native-alignment.md). The agreed
scope is verified and closed, including the
[focused native correction run](docs/audits/evidence/2026-10-19-correction-native.md).
Publication remains separate; the audit preserves feature deferrals and content policies.

## Third-party license

Mörk Borg is copyright Ockult Örtmästare Games and Stockholm Kartell. This product is an independent production by SheetDelver and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the [MÖRK BORG THIRD PARTY LICENSE](https://morkborg.com/license/).

## Release tooling

Use this repository’s independent `npm run release:tag` command. It prepares the
numbered changelog release, pushes its tag for validation, and asks separately
before publication. See [module release instructions](docs/RELEASING.md).
