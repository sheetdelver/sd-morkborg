import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishModule, verifyModuleAssets } from './publish-release.mjs';
import { digest } from './ci-artifacts.mjs';

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'module-publish-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const id = { product: 'fixture', version: '1.2.3', repository: 'example/module' };
    const bytes = Buffer.from('the exact CI archive');
    fs.writeFileSync(path.join(root, 'fixture-1.2.3.tgz'), bytes);
    fs.writeFileSync(path.join(root, 'fixture-1.2.3.sha256'), `${digest(bytes)}  fixture-1.2.3.tgz\n`);
    fs.writeFileSync(path.join(root, 'sheet-delver-manifest.json'), JSON.stringify({ module: { id: 'fixture', version: '1.2.3' }, artifact: { url: 'fixture-1.2.3.tgz', size: bytes.length, integrity: `sha256:${digest(bytes)}` } }));
    return { root, id, bytes };
}
test('publishes exact archive/manifest/checksum and runs only the already-bundled history generator', t => {
    const { root, id, bytes } = fixture(t), calls = [];
    publishModule(id, root, { GITHUB_REF: 'refs/tags/v1.2.3' }, (program, args) => {
        calls.push([program, ...args]);
        if (args[0] === 'api') return JSON.stringify([[{ tag_name: 'v1.0.0', assets: [{ name: 'sheet-delver-manifest.json' }] }, { tag_name: 'v0.1.0', assets: [] }]]);
        return '';
    });
    assert.equal(calls.filter(call => call[1] === 'release' && call[2] === 'create').length, 1);
    assert.equal(calls.filter(call => call[1] === 'release' && call[2] === 'download').length, 1);
    assert.ok(calls.some(call => call[1] === path.join(root, 'generate-release-history.mjs')));
    assert.equal(calls.some(call => ['npm', 'npx'].includes(call[0])), false);
    assert.deepEqual(fs.readFileSync(path.join(root, 'fixture-1.2.3.tgz')), bytes);
});
test('branch dispatch, identity/checksum mismatch and an existing release stop publication', t => {
    const { root, id } = fixture(t);
    assert.throws(() => publishModule(id, root, { GITHUB_REF: 'refs/heads/main' }), /version tag/);
    const calls = [];
    assert.throws(() => publishModule(id, root, { GITHUB_REF: 'refs/tags/v1.2.3' }, (program, args) => {
        calls.push(args); return JSON.stringify([[{ tag_name: 'v1.2.3', draft: true }]]);
    }), /already exists/);
    assert.equal(calls.some(call => call[0] === 'release'), false);
    fs.appendFileSync(path.join(root, 'fixture-1.2.3.tgz'), 'corruption');
    assert.throws(() => verifyModuleAssets(id, root), /checksum/);
});
