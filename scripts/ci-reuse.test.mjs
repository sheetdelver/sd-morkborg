import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { metadataDifference, selectValidation, writeSelection } from './ci-reuse.mjs';
import { artifactName, digest, expectedFiles, recordBundle, restoreBundle, validateBundle } from './ci-artifacts.mjs';

const execute = (root, program, ...args) => execFileSync(program, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
function repository(t, product = 'core') {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-metadata-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const git = (...args) => execute(root, 'git', ...args);
    git('init', '-q', '-b', 'main'); git('config', 'user.name', 'CI fixture'); git('config', 'user.email', 'ci@example.invalid');
    const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : `${JSON.stringify(value)}\n`); };
    const commit = () => { git('add', '.'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD').trim(); };
    const version = value => {
        if (product === 'core') {
            write('package.json', { name: 'fixture', version: value, dependencies: { library: '1.0.0' } });
            write('package-lock.json', { name: 'fixture', version: value, lockfileVersion: 3, packages: { '': { name: 'fixture', version: value, dependencies: { library: '1.0.0' } }, 'node_modules/library': { version: '1.0.0', integrity: 'unchanged' } } });
        } else write('info.json', { id: product, version: value, compatibility: { core: '>=0.19.3' }, manifest: { ui: 'module/ui.tsx' } });
    };
    version('1.0.0'); write('CHANGELOG.md', '## 1.0.0\n- Initial\n'); write('src/code.js', 'export const value = 1;\n');
    const base = commit();
    const identity = (sha = git('rev-parse', 'HEAD').trim(), v = '1.0.1') => ({ schema: 1, product, version: v, commit: sha, repository: 'example/project', workflow: product === 'core' ? 'ci.yml' : `ci-${product}.yaml`, nodeMajor: 22, toolchainRef: product === 'core' ? undefined : 'v0.19.3', toolchainCommit: product === 'core' ? sha : 'b'.repeat(40) });
    return { root, git, write, commit, version, base, identity };
}
function run(id, overrides = {}) {
    return { id: 11, run_attempt: 1, head_sha: id.commit, repository: { full_name: id.repository }, head_repository: { full_name: id.repository }, event: 'push', head_branch: 'main', path: `.github/workflows/${id.workflow}`, status: 'completed', conclusion: 'success', html_url: 'https://example.invalid/11', ...overrides };
}
function bundleFixture(repo, t, { includeChangelog = false } = {}) {
    const { root, base, identity } = repo;
    const id = identity(base, '1.0.0'); const baseline = run(id);
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-base-bundle-'));
    t.after(() => fs.rmSync(source, { recursive: true, force: true }));
    for (const name of expectedFiles(id)) fs.writeFileSync(path.join(source, name), `bytes ${name}`);
    if (id.product !== 'core') {
        const contents = path.join(source, 'contents'); fs.mkdirSync(contents);
        fs.writeFileSync(path.join(contents, 'info.json'), '{"version":"1.0.0"}');
        fs.writeFileSync(path.join(contents, 'ui.js'), 'export const version="1.0.0";');
        if (includeChangelog) fs.copyFileSync(path.join(root, 'CHANGELOG.md'), path.join(contents, 'CHANGELOG.md'));
        execute(contents, 'tar', '-czf', path.join(source, `${id.product}-1.0.0.tgz`), '.');
        fs.rmSync(contents, { recursive: true });
    }
    recordBundle(id, source, { GITHUB_RUN_ID: '11', GITHUB_RUN_ATTEMPT: '1' });
    const zip = path.join(source, 'bundle.zip');
    execute(source, 'zip', '-q', zip, ...fs.readdirSync(source));
    const bytes = fs.readFileSync(zip);
    const artifact = { id: 51, name: artifactName(id, baseline), digest: `sha256:${digest(bytes)}`, workflow_run: { id: 11, head_sha: base } };
    const restore = (candidate, directory, options) => restoreBundle(candidate, directory, { ...options,
        api: endpoint => endpoint.includes('/artifacts?') ? [{ artifacts: [artifact] }] : [{ workflow_runs: [baseline] }], download: () => bytes });
    return { baseline, restore, bytes, source };
}
const env = { GITHUB_EVENT_NAME: 'push', GITHUB_RUN_ID: '99' };

test('Core accepts only aligned root versions and changelog across multiple commits', t => {
    const r = repository(t); r.write('CHANGELOG.md', '## 1.0.1\n- Release\n'); r.commit(); r.version('1.0.1'); const current = r.commit();
    assert.deepEqual(metadataDifference(r.root, r.base, current, 'core'), { baseVersion: '1.0.0', version: '1.0.1', changed: ['CHANGELOG.md', 'package-lock.json', 'package.json'] });
    const lock = JSON.parse(fs.readFileSync(path.join(r.root, 'package-lock.json'))); lock.packages[''].version = '1.0.0'; r.write('package-lock.json', lock);
    assert.equal(metadataDifference(r.root, r.base, r.commit(), 'core'), null);
});

test('dependency, lock integrity, scripts, workflow, config, assets and unknown changes require full validation', t => {
    for (const file of ['src/code.js', 'package.json', 'package-lock.json', '.github/workflows/ci.yml', 'tsconfig.json', 'assets/icon.svg', 'new-input', 'unusual\nfilename']) {
        const r = repository(t); r.version('1.0.1');
        if (file === 'package.json') { const doc = JSON.parse(fs.readFileSync(path.join(r.root, file))); doc.scripts = { build: 'unreviewed' }; r.write(file, doc); }
        else if (file === 'package-lock.json') { const doc = JSON.parse(fs.readFileSync(path.join(r.root, file))); doc.packages['node_modules/library'].integrity = 'changed'; r.write(file, doc); }
        else r.write(file, 'changed');
        assert.equal(metadataDifference(r.root, r.base, r.commit(), 'core'), null, file);
    }
});

test('module compatibility/pins and dependency changes are significant, only info.version is exempt', t => {
    const r = repository(t, 'fixture'); r.version('1.0.1'); const next = r.commit();
    assert.ok(metadataDifference(r.root, r.base, next, 'fixture'));
    const info = JSON.parse(fs.readFileSync(path.join(r.root, 'info.json'))); info.compatibility.core = '>=99.0.0'; r.write('info.json', info);
    assert.equal(metadataDifference(r.root, next, r.commit(), 'fixture'), null);
    r.write('package-lock.json', '{}');
    assert.equal(metadataDifference(r.root, r.base, r.commit(), 'fixture'), null);
});

test('mode changes, deletion, symlinks, invalid/missing history and non-ancestors do not grant reuse', t => {
    for (const mutation of ['mode', 'delete', 'symlink']) {
        const r = repository(t); const file = path.join(r.root, 'CHANGELOG.md');
        if (mutation === 'mode') fs.chmodSync(file, 0o755);
        else { fs.unlinkSync(file); if (mutation === 'symlink') fs.symlinkSync('src/code.js', file); }
        assert.equal(metadataDifference(r.root, r.base, r.commit(), 'core'), null, mutation);
    }
    const r = repository(t); r.version('1.0.1'); const current = r.commit();
    assert.equal(metadataDifference(r.root, current, r.base, 'core'), null);
    assert.equal(metadataDifference(r.root, 'f'.repeat(40), current, 'core'), null);
    assert.equal(metadataDifference(r.root, '--help', current, 'core'), null);
});

test('successful main baseline ZIP authorizes metadata checks reuse and binds final commit/attempt', async t => {
    const r = repository(t); const fixture = bundleFixture(r, t); r.version('1.0.1'); const current = r.commit(); const id = r.identity(current);
    const directory = path.join(r.root, 'output');
    const selected = await selectValidation(id, directory, { root: r.root, env, api: () => ({ workflow_runs: [fixture.baseline] }), restore: fixture.restore });
    assert.equal(selected.reused, true); assert.equal(selected.exact, false); assert.equal(selected.package, false);
    assert.equal(selected.basis.commit, r.base);
    const envFile = path.join(r.root, 'env'); writeSelection(selected, directory, { GITHUB_ENV: envFile });
    fs.mkdirSync(directory); for (const name of expectedFiles(id)) fs.writeFileSync(path.join(directory, name), 'final version files');
    recordBundle(id, directory, { GITHUB_RUN_ID: '99', GITHUB_RUN_ATTEMPT: '2', CI_VALIDATION_BASIS: `${directory}.basis.json` });
    const bundle = JSON.parse(fs.readFileSync(path.join(directory, 'validation.json')));
    assert.equal(bundle.commit, current); assert.equal(bundle.version, '1.0.1'); assert.equal(bundle.validationBasis.runId, 11);
    validateBundle(bundle, id, { id: 99, run_attempt: 2 }, file => fs.readFileSync(path.join(directory, file)));
    assert.throws(() => validateBundle({ ...bundle, validationBasis: { ...bundle.validationBasis, changed: ['source.ts'] } }, id, { id: 99, run_attempt: 2 }, () => Buffer.from('')), /basis/);
});

test('module version changes require packaging: stale embedded JS is never relabeled', async t => {
    const r = repository(t, 'fixture'); const fixture = bundleFixture(r, t); r.version('1.0.1'); const current = r.commit();
    const directory = path.join(r.root, 'output');
    const selected = await selectValidation(r.identity(current), directory, { root: r.root, env, api: () => ({ workflow_runs: [fixture.baseline] }), restore: fixture.restore });
    assert.equal(selected.reused, true); assert.equal(selected.package, true); assert.equal(fs.existsSync(directory), false);
});

test('changelog-only module changes copy compiled bytes; packaged changelogs require packaging', async t => {
    for (const includeChangelog of [false, true]) {
        const r = repository(t, 'fixture'); const fixture = bundleFixture(r, t, { includeChangelog }); r.write('CHANGELOG.md', '## 1.0.0\n- Correct notes\n'); const current = r.commit();
        const directory = path.join(r.root, 'output');
        const selected = await selectValidation(r.identity(current, '1.0.0'), directory, { root: r.root, env, api: () => ({ workflow_runs: [fixture.baseline] }), restore: fixture.restore });
        assert.equal(selected.reused, true); assert.equal(selected.package, includeChangelog);
        if (!includeChangelog) for (const name of expectedFiles(r.identity(current, '1.0.0'))) assert.deepEqual(fs.readFileSync(path.join(directory, name)), fs.readFileSync(path.join(fixture.source, name)));
    }
});

test('failed/cancelled/PR/fork/wrong workflow runs cannot provide a main baseline', async t => {
    const r = repository(t); r.version('1.0.1'); const id = r.identity(r.commit());
    for (const overrides of [{ conclusion: 'failure' }, { conclusion: 'cancelled' }, { status: 'in_progress' }, { event: 'pull_request' }, { head_branch: 'feature' }, { head_repository: { full_name: 'fork/project' } }, { path: '.github/workflows/other.yml' }]) {
        let restores = 0;
        const result = await selectValidation(id, 'unused', { root: r.root, env, api: () => ({ workflow_runs: [run(r.identity(r.base, '1.0.0'), overrides)] }), restore: async () => { restores++; return false; } });
        assert.equal(result.reused, false); assert.equal(restores, 1, JSON.stringify(overrides));
    }
});

test('manual and fork PR runs remain full; same-repository metadata PR can use main without publishing PR artifacts', async t => {
    const r = repository(t); const fixture = bundleFixture(r, t); r.version('1.0.1'); const id = r.identity(r.commit());
    for (const event of [{ GITHUB_EVENT_NAME: 'workflow_dispatch' }, { GITHUB_EVENT_NAME: 'pull_request', CI_PR_HEAD_REPOSITORY: 'fork/project' }]) {
        assert.equal((await selectValidation(id, 'unused', { root: r.root, env: event, api: () => { throw new Error('should not query'); }, restore: async () => { throw new Error('should not restore'); } })).reused, false);
    }
    const result = await selectValidation(id, path.join(r.root, 'out'), { root: r.root, env: { ...env, GITHUB_EVENT_NAME: 'pull_request', CI_PR_HEAD_REPOSITORY: id.repository }, api: () => ({ workflow_runs: [fixture.baseline] }), restore: fixture.restore });
    assert.equal(result.reused, true);
});

test('missing baseline bundle and changed resolved toolchain use full CI; source differences never restore baseline', async t => {
    const r = repository(t, 'fixture'); const fixture = bundleFixture(r, t); r.version('1.0.1'); const id = r.identity(r.commit());
    const opts = { root: r.root, env, api: () => ({ workflow_runs: [fixture.baseline] }) };
    assert.equal((await selectValidation(id, 'unused', { ...opts, restore: async () => false })).reused, false);
    assert.equal((await selectValidation({ ...id, toolchainCommit: 'c'.repeat(40) }, 'unused', { ...opts, restore: fixture.restore })).reused, false);
    r.write('src/code.js', 'changed'); const changed = r.identity(r.commit()); let restores = 0;
    assert.equal((await selectValidation(changed, 'unused', { ...opts, restore: async () => { restores++; return false; } })).reused, false);
    assert.equal(restores, 1);
});

test('exact-commit reuse skips all checks/packaging; API and corrupt artifact errors are not converted to reuse', async t => {
    const r = repository(t); const id = r.identity();
    const result = await selectValidation(id, 'unused', { root: r.root, env, restore: async () => true, api: () => { throw new Error('no baseline query'); } });
    assert.deepEqual([result.reused, result.exact, result.package], [true, true, false]);
    await assert.rejects(selectValidation(id, 'unused', { root: r.root, env, restore: async () => false, api: () => { throw new Error('403'); } }), /403/);
    await assert.rejects(selectValidation(id, 'unused', { root: r.root, env, restore: async () => { throw new Error('checksum mismatch'); } }), /checksum/);
});
