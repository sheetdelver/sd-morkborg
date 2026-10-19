// Test tooling only. Never reads production settings or starts a Core application.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const option = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const core = option('--core'), archive = option('--archive'), fixtures = option('--native-fixtures');
if (!core || !archive || !fixtures) throw Error('Usage: node tests/integration/run.mjs --core <Core checkout> --archive <module.tgz> --native-fixtures <copied native records directory>');
for (const name of ['native-documents.json', 'native-pack-rows.json']) {
    if (!fs.existsSync(path.join(fixtures, name))) throw Error('Missing isolated native fixture: ' + name);
}
function run(command, args, options = {}) {
    const result = spawnSync(command, args, { stdio: 'inherit', ...options });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error(command + ' failed: ' + result.status);
    return result.stdout;
}
const commit = '90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1';
const tag = run('git', ['-C', core, 'rev-parse', 'v0.19.3^{commit}'], { stdio: 'pipe' }).toString().trim();
if (tag !== commit) throw Error('Core v0.19.3 does not match the reviewed release');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'morkborg-installed-'));
const snapshot = path.join(output, 'core.tar');
run('git', ['-C', core, 'archive', '--format=tar', '--output=' + snapshot, commit]);
run('tar', ['-xf', snapshot, '-C', output]); fs.unlinkSync(snapshot);
fs.symlinkSync(path.resolve(core, 'node_modules'), path.join(output, 'node_modules'));
const data = path.join(output, 'data'), installed = path.join(data, 'modules/morkborg');
fs.mkdirSync(installed, { recursive: true });
run('tar', ['-xzf', path.resolve(archive), '-C', installed]);
const env = { ...process.env, SHEET_DELVER_DATA: data, NODE_ENV: 'production',
    MB_NATIVE_FIXTURES: path.resolve(fixtures), MB_INSTALLED_RESULTS: path.join(output, 'installed-results.json'),
    MB_ARCHIVE_HASH: createHash('sha256').update(fs.readFileSync(archive)).digest('hex') };
// Generated files and registry state exist only in this fresh /tmp checkout.
run('npm', ['run', 'managed:generate'], { cwd: output, env });
const probe = path.join(output, 'temp/adr0001/installed-core.ts');
fs.mkdirSync(path.dirname(probe), { recursive: true });
fs.copyFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'installed-core.ts'), probe);
try {
    run(path.join(output, 'node_modules/.bin/tsx'), [probe], { cwd: output, env });
} finally {
    console.log('Installed Core evidence: ' + output);
}
