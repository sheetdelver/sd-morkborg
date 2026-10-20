import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { artifactName, digest, expectedFiles, findBundle, recordBundle, restoreBundle, trustedRun, unpackBundle, validateBundle } from './ci-artifacts.mjs';

const id = { schema: 1, product: 'fixture', version: '1.2.3', commit: 'a'.repeat(40), repository: 'example/module', workflow: 'ci-fixture.yaml', nodeMajor: 22, toolchainRef: 'v0.19.3', toolchainCommit: 'b'.repeat(40) };
const run = { id: 41, run_attempt: 2, head_sha: id.commit, repository: { full_name: id.repository }, head_repository: { full_name: id.repository }, event: 'push', head_branch: 'main', path: `.github/workflows/${id.workflow}`, status: 'completed', conclusion: 'success', html_url: 'https://example.invalid/runs/41' };
const artifact = { id: 81, name: artifactName(id, run), expired: false, digest: `sha256:${'c'.repeat(64)}`, workflow_run: { id: run.id, head_sha: id.commit } };
const api = (runs = [run], artifacts = [artifact]) => endpoint => endpoint.includes('/artifacts?') ? [{ artifacts }] : [{ workflow_runs: runs }];
function fixture(t, identity = id) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-artifact-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source'); fs.mkdirSync(source);
    for (const name of expectedFiles(identity)) fs.writeFileSync(path.join(source, name), `validated bytes: ${name}\n`);
    recordBundle(identity, source, { GITHUB_RUN_ID: String(run.id), GITHUB_RUN_ATTEMPT: String(run.run_attempt) });
    const bundle = JSON.parse(fs.readFileSync(path.join(source, 'validation.json'), 'utf8'));
    const read = name => fs.readFileSync(path.join(source, name));
    return { root, source, bundle, read };
}

test('same commit main and tag validation reuse one original artifact; lightweight runs need no duplicate upload', () => {
    const reused = { ...run, id: 42, head_branch: 'v1.2.3' };
    assert.equal(findBundle(id, 43, api([reused, run])).run.id, 41);
    assert.equal(findBundle(id, 41, api()).artifact, undefined);
});

test('reject other commits, PR/fork runs, other workflows/ref names, failed/cancelled/in-progress validation', () => {
    for (const change of [{ head_sha: 'd'.repeat(40) }, { event: 'pull_request' }, { head_repository: { full_name: 'fork/module' } },
        { repository: { full_name: 'fork/module' } }, { path: '.github/workflows/other.yml' }, { head_branch: 'feature' },
        { conclusion: 'failure' }, { conclusion: 'cancelled' }, { status: 'in_progress' }]) {
        assert.equal(findBundle(id, 99, api([{ ...run, ...change }])).artifact, undefined, JSON.stringify(change));
    }
    assert.equal(trustedRun({ ...run, event: 'workflow_dispatch', head_branch: 'v1.2.3' }, id), true);
});

test('expired, missing and previous-attempt artifacts cannot grant reuse', () => {
    for (const artifacts of [[], [{ ...artifact, expired: true }], [{ ...artifact, name: artifactName(id, { ...run, run_attempt: 1 }) }]]) {
        assert.equal(findBundle(id, 99, api([run], artifacts)).artifact, undefined);
    }
});

test('malformed origin, duplicate artifact names and API denials fail rather than claim validation', () => {
    assert.throws(() => findBundle(id, 99, api([run], [artifact, artifact])), /Ambiguous/);
    for (const change of [{ digest: undefined }, { workflow_run: { id: 4, head_sha: id.commit } }]) {
        assert.throws(() => findBundle(id, 99, api([run], [{ ...artifact, ...change }])), /origin\/digest/);
    }
    assert.throws(() => findBundle(id, 99, () => { throw new Error('HTTP 403'); }), /403/);
});

test('bundle binds all publication bytes, product, version, repo, commit, workflow, toolchain and attempt', t => {
    const { bundle, read } = fixture(t);
    assert.equal(validateBundle(bundle, id, run, read), bundle);
    for (const change of [{ repository: 'another/repo' }, { commit: 'f'.repeat(40) }, { version: '1.2.4' }, { product: 'wrong' },
        { workflow: 'other.yaml' }, { toolchainCommit: 'd'.repeat(40) }, { toolchainRef: 'main' }, { runAttempt: 1 }, { runId: 42 }, { nodeMajor: 24 }]) {
        assert.throws(() => validateBundle({ ...bundle, ...change }, id, run, read));
    }
    assert.throws(() => validateBundle(bundle, id, run, () => Buffer.from('corrupted')), /checksum/);
    assert.throws(() => validateBundle({ ...bundle, files: { ...bundle.files, 'extra.js': {} } }, id, run, read), /inventory/);
});

test('actual ZIP download retains exact validated bytes; digest is checked before unpacking', async t => {
    const { root, source, read } = fixture(t);
    const zipPath = path.join(root, 'bundle.zip');
    execFileSync('zip', ['-q', zipPath, ...fs.readdirSync(source)], { cwd: source });
    const bytes = fs.readFileSync(zipPath);
    const bound = { ...artifact, digest: `sha256:${digest(bytes)}` };
    const destination = path.join(root, 'restored');
    assert.equal(await restoreBundle(id, destination, { api: api([run], [bound]), env: { GITHUB_RUN_ID: '99' }, download: () => bytes }), true);
    for (const name of expectedFiles(id)) assert.deepEqual(fs.readFileSync(path.join(destination, name)), read(name));
    let unpacked = false;
    await assert.rejects(restoreBundle(id, destination, { api: api(), download: () => bytes, unpack: () => { unpacked = true; } }), /digest mismatch/);
    assert.equal(unpacked, false);
});

test('unexpected paths/files in a ZIP are rejected before destination writes', t => {
    const { root, source } = fixture(t);
    fs.mkdirSync(path.join(source, 'nested'));
    fs.writeFileSync(path.join(source, 'nested', 'extra'), 'extra');
    const zipPath = path.join(root, 'bundle.zip');
    execFileSync('zip', ['-qr', zipPath, '.'], { cwd: source });
    const destination = path.join(root, 'restored');
    assert.throws(() => unpackBundle(zipPath, destination, id, run), /Unexpected files/);
    assert.equal(fs.existsSync(destination), false);
});

test('a changed resolved toolchain rebuilds in validation but cannot publish the old bytes', async t => {
    const { root, source } = fixture(t);
    const zipPath = path.join(root, 'bundle.zip');
    execFileSync('zip', ['-q', zipPath, ...fs.readdirSync(source)], { cwd: source });
    const bytes = fs.readFileSync(zipPath);
    const options = { api: api([run], [{ ...artifact, digest: `sha256:${digest(bytes)}` }]), download: () => bytes, env: {} };
    const changed = { ...id, toolchainCommit: 'd'.repeat(40) };
    assert.equal(await restoreBundle(changed, path.join(root, 'out'), options), false);
    assert.equal(fs.existsSync(path.join(root, 'out')), false);
    await assert.rejects(restoreBundle(changed, path.join(root, 'out'), { ...options, required: true }), /toolchain differs/);
});

test('publication waits for in-flight exact validation, but a missing artifact requires validation, not a rebuild in publish', async t => {
    const { root } = fixture(t);
    let polls = 0;
    await assert.rejects(restoreBundle(id, path.join(root, 'out'), { required: true, env: {},
        api: endpoint => api([{ ...run, status: polls++ === 0 ? 'in_progress' : 'completed' }], [])(endpoint), sleep: async () => {} }), /No retained successful validation/);
    assert.ok(polls >= 2);
    assert.equal(await restoreBundle(id, path.join(root, 'out'), { api: api([], []), env: {} }), false);
});

test('Core bundle has only the CI-produced notes and SBOM', t => {
    const core = { ...id, product: 'core', workflow: 'ci.yml', toolchainRef: undefined, toolchainCommit: id.commit };
    const { bundle, read } = fixture(t, core);
    assert.deepEqual(Object.keys(bundle.files), ['release-notes.md', 'sheet-delver.cdx.json']);
    assert.equal(validateBundle(bundle, core, run, read), bundle);
});
