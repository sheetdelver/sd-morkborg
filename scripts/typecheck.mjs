// Root Core TypeScript excludes data/: explicitly check this module's source/UI/hooks/tests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let coreRoot = path.resolve(process.env.SHEET_DELVER_CORE_ROOT ?? process.cwd());
while (!fs.existsSync(path.join(coreRoot, 'src/shared/sdk/entry-react.ts'))) {
    const parent = path.dirname(coreRoot);
    if (parent === coreRoot) throw new Error('Run from the released Core checkout or set SHEET_DELVER_CORE_ROOT.');
    coreRoot = parent;
}
const files = [];
function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const name = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(name);
        else if (/\.tsx?$/.test(name)) files.push(name);
    }
}
for (const dir of ['src', 'module']) collect(path.join(moduleRoot, dir));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'morkborg-types-'));
try {
    const config = path.join(temporary, 'tsconfig.json');
    fs.writeFileSync(config, JSON.stringify({ extends: path.join(coreRoot, 'tsconfig.json'),
        compilerOptions: { noEmit: true, incremental: false, typeRoots: [path.join(coreRoot, 'node_modules/@types')] },
        files, include: [], exclude: [] }));
    const result = spawnSync(process.execPath, [path.join(coreRoot, 'node_modules/typescript/bin/tsc'), '-p', config], { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
