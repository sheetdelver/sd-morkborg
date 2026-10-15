# Mörk Borg module development

## Contracts and ownership

`info.json` is the compatibility authority. The module requires Core 0.18.0
and UI API 3.1; the remaining API ranges are declared there.

The adapter prepares Actors deterministically without writing derived values
back to Foundry. Sheets, cards and rolls use that shared prepared model.
Keep module-specific resource shapes and system rules inside the module.

Core owns authorization, world/session lifecycle, roll execution and shared
chat/media/dice presentation. The module supplies its own sheet and roll styling
through the public SDK. Its mobile section bar registers measured footer space
so Core controls remain accessible above it.

## Initiative

Core resolves a saved GM override first, then the module formula, then its
generic fallback. The HUD adapter displays the resolved formula and audience
read-only and returns only a roll choice or a final manual total. Omitting an
advantage mode preserves the formula. Sheet Auto/Manual raw-die rules are
separate from the HUD's final-total entry.

The managed HUD uses individual initiative; this is not an implementation of
Mörk Borg party initiative or native Foundry turn-hook automation.

## Validation

ADR-0063 puts sheet/generator navigation in page flow below Core's combat HUD.
The current/max resource group uses the card's available width and centered
values at phone widths. HP spans the phone grid row so two four-digit values
remain readable; update, minimum and maximum semantics are unchanged.
Validate multi-digit HP at 320/390/820/1440 together with the footer/Tools bar.

From the Core checkout with this module in `data/local/modules/morkborg`:

```sh
npx tsx data/local/modules/morkborg/src/tests/prepared-actor.test.ts
npx tsx data/local/modules/morkborg/src/tests/presentation.test.ts
npx tsx data/local/modules/morkborg/src/tests/roll-visibility.test.ts
npm run module:check -- morkborg
```

Core's root TypeScript check excludes module source. Include module sources
explicitly when validating interface changes; a passing root check is not enough.
Keep package output in an isolated data directory when testing distribution.

## Distribution

CI and release workflows pin Core `v0.18.0`. Keep their toolchain references
aligned with the tested minimum and update compatibility before publication.
The module tag must match `info.json.version`; published tags are immutable.
Release CI publishes the archive, checksum, catalog manifest and release history.
Keep user-facing notes concise in [CHANGELOG.md](../CHANGELOG.md).

See Core's [module authoring guide](https://github.com/sheetdelver/sheetdelver/blob/v0.18.0/docs/MODULE_AUTHORING.md)
and [release process](https://github.com/sheetdelver/sheetdelver/blob/v0.18.0/docs/RELEASING.md)
for the shared workflow. Verification history belongs in audits/ADRs, not the
module overview.
