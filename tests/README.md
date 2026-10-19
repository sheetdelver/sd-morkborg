# Isolated acceptance tooling

These development tools require the configured released Core 0.19.3 dependencies.
They do not start the Core application, use its `.env`, or contact a native world.
Runtime module code never imports these fixtures or host internals.

```sh
node tests/browser/run.mjs --core /path/to/core-0.19.3 --archive /tmp/morkborg-0.8.3.tgz
node tests/integration/run.mjs --core /path/to/core-0.19.3 --archive /tmp/morkborg-0.8.3.tgz --native-fixtures /tmp/copied-native-records
```

The browser runner extracts the archive, composes its actual UI with the released
SDK/Core confirmation, rich editor, UI provider and FloatingHUD, and drives Chrome
pointer/keyboard input. Session/chat/router and requests are fixtures. It checks
port availability (4181/9418 by default), uses a fresh temporary browser profile,
and stops its server/browser. `--port`, `--cdp-port`, and `--chrome` override defaults.
`--before-archive` optionally reproduces the old unsafe description behavior; an
already working predecessor Escape case is recorded separately from new passes.
Core-only global CSS prevents accidentally supplying module styles from the host.

The integration runner archives the exact reviewed Core commit into a new `/tmp`
directory, symlinks read-only toolchain dependencies, installs the module archive,
and generates isolated managed configuration. It exercises the production registry,
Stores, world context and caller-bound request services with a deterministic
transport boundary. The fixture directory must contain `native-documents.json`
and `native-pack-rows.json` decoded from **copies** of the pinned native databases
(root records plus embedded rows). Native pack prose is not committed here.
Companion Items are reconstructed from embedded rows before validation.
`--system-version 6.0.1` also qualifies that explicitly verified native version
(the isolated default run uses checkout manifest 6.0.0).

Both runners retain their output directory and report the archive SHA-256 and
qualifications in JSON. They establish neither full Core HTTP/session acceptance
nor native document-hook, cross-session or disposable-world permission acceptance.
ADR-0001 G8 remains the separate operator matrix.
