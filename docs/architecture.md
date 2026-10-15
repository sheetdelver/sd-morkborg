# Mörk Borg module architecture

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

## Responsive resources

Core ADR-0063 moved sheet/generator navigation into page flow below Core's combat HUD.
Current/maximum resources use the available card width and centered values.
HP spans the phone grid row so two four-digit values remain readable; update,
minimum and maximum semantics are unchanged. Footer-space registration lets the
host reserve space for the module's mobile section bar.

## Distribution and verification

`info.json` declares the module version and API compatibility. CI/release
workflows currently use the released Core `v0.18.0` toolchain. Release assets
include the package archive, checksum, catalog manifest and release history.
A module release tag identifies the matching manifest version.

Repository workflow and verification commands live in [AGENTS.md](../AGENTS.md).
The shared contracts are described in Core's
[module authoring guide](https://github.com/sheetdelver/sheetdelver/blob/v0.18.0/docs/MODULE_AUTHORING.md)
and [release process](https://github.com/sheetdelver/sheetdelver/blob/v0.18.0/docs/RELEASING.md).
