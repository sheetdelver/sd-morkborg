import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseOptions, releaseSection, planRelease, prepareLocal, publishRelease, verifyTagCI, latestRun, repositoryName, waitForWorkflow } from './release.mjs';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quiet = () => {};
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const notes = '# Releases\n\n## Unreleased\n\n## 1.2.3\n\n- Preserve native behavior\n\n## 1.2.2\n\n- Earlier release\n';
function fixture(t, version = '1.2.2') {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'module-release-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    git(root, 'init', '-b', 'main');
    git(root, 'config', 'user.name', 'Release fixture');
    git(root, 'config', 'user.email', 'release-fixture@example.invalid');
    git(root, 'config', 'commit.gpgsign', 'false');
    git(root, 'config', 'tag.gpgsign', 'false');
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
    fs.copyFileSync(path.join(source, 'scripts/release.mjs'), path.join(root, 'scripts/release.mjs'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ private: true, scripts: { 'release:tag': 'node scripts/release.mjs' } }));
    fs.writeFileSync(path.join(root, 'info.json'), JSON.stringify({ id: 'fixture', version, compatibility: { coreVersion: '>=9.8.7' }, custom: { keep: ['a', 'b'] } }, null, 4) + '\n');
    fs.writeFileSync(path.join(root, 'CHANGELOG.md'), notes);
    fs.writeFileSync(path.join(root, '.github/workflows/ci-fixture.yaml'), "on:\n  push:\n    tags:\n      - 'v*'\n");
    fs.writeFileSync(path.join(root, '.github/workflows/release-fixture.yaml'), 'on:\n  workflow_dispatch:\n');
    git(root, 'add', '.'); git(root, 'commit', '-m', 'fixture');
    return root;
}
function ioFor(root, release, options = {}) {
    const sha = release.commit, tag = release.tag;
    const url = 'git@github.com:example/module.git';
    const success = (workflow, id, event) => ({ databaseId: id, headSha: sha, headBranch: tag, event, status: 'completed', conclusion: 'success', url: `https://example.invalid/${workflow}/${id}` });
    const state = {
        remote: options.pushed ? `\n${release.tagObject}\trefs/tags/${tag}\n${sha}\trefs/tags/${tag}^{}` : '',
        ci: options.ci ?? success('ci', 10, 'push'),
        runs: [], releases: [], calls: [], questions: [], clock: 0,
    };
    const io = {
        now: () => state.clock,
        sleep: async ms => { state.clock += ms; },
        confirm: async question => { state.questions.push(question); options.onConfirm?.(question, state); return options.confirm?.(question) ?? true; },
        command(program, args) {
            state.calls.push([program, ...args]);
            if (program === 'git') {
                if (args[0] === 'remote') return url;
                if (args[0] === 'ls-remote') return `${sha}\trefs/heads/main${state.remote}`;
                if (args[0] === 'push') {
                    state.remote = `\n${release.tagObject}\trefs/tags/${tag}\n${sha}\trefs/tags/${tag}^{}`;
                    if (options.losePushReceipt) throw Error('lost push receipt');
                    return '';
                }
                return git(root, ...args);
            }
            if (args[0] === 'api') {
                if (options.apiFailure) throw Error('GitHub unavailable');
                return JSON.stringify([state.releases]);
            }
            if (args[0] === 'run') return JSON.stringify(args.includes(release.ci) ? [state.ci].filter(Boolean) : state.runs);
            if (args[0] === 'workflow') {
                const run = success('release', (state.runs[0]?.databaseId ?? 19) + 1, 'workflow_dispatch');
                state.runs.unshift(run);
                state.releases = [{ tag_name: tag, draft: false, html_url: `https://example.invalid/release/${tag}` }];
                if (options.loseDispatchReceipt) throw Error('lost dispatch receipt');
                return '';
            }
            throw Error(`Unexpected command ${program} ${args.join(' ')}`);
        },
    };
    return { io, state };
}

test('version comes from numbered notes; optional version must match', () => {
    assert.deepEqual(releaseSection(notes), { version: '1.2.3', tag: 'v1.2.3', notes: '- Preserve native behavior' });
    assert.equal(parseOptions(['v1.2.3', '--dry-run']).version, '1.2.3');
    assert.throws(() => parseOptions(['--yes']), /Unknown argument/);
    assert.throws(() => releaseSection(notes, '1.2.4'), /latest changelog/);
    assert.throws(() => releaseSection(notes + '\n## 1.2.3\n- Duplicate\n'), /Duplicate/);
    assert.throws(() => releaseSection(notes.replace('## Unreleased\n', '## Unreleased\n- Still pending\n')), /Unreleased/);
    assert.throws(() => releaseSection(notes.replace('- Preserve native behavior', '')), /nonempty/);
});

test('dry-run has no mutations and works without Core or dependencies', t => {
    const root = fixture(t), before = git(root, 'rev-parse', 'HEAD');
    const output = execFileSync(process.execPath, ['scripts/release.mjs', '--dry-run'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /DRY RUN: fixture v1.2.3/);
    assert.equal(git(root, 'rev-parse', 'HEAD'), before);
    assert.equal(git(root, 'status', '--porcelain'), '');
    assert.equal(git(root, 'tag', '--list'), '');
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'info.json'))).version, '1.2.2');
});

test('noninteractive invocation requires an explicit local-only mode', t => {
    const root = fixture(t);
    assert.throws(() => execFileSync(process.execPath, ['scripts/release.mjs'], { cwd: root, stdio: 'pipe' }), /noninteractive/);
    assert.equal(git(root, 'tag', '--list'), '');
});

test('preparation commits only version/notes and creates an annotated tag', t => {
    const root = fixture(t), before = JSON.parse(fs.readFileSync(path.join(root, 'info.json')));
    fs.appendFileSync(path.join(root, 'CHANGELOG.md'), '\n');
    const release = prepareLocal(root, { noPush: true }, quiet);
    const info = JSON.parse(fs.readFileSync(path.join(root, 'info.json')));
    assert.deepEqual(info, { ...before, version: '1.2.3' });
    assert.equal(git(root, 'cat-file', '-t', release.tag), 'tag');
    assert.equal(git(root, 'rev-parse', `${release.tag}^{commit}`), release.commit);
    assert.deepEqual(git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n').sort(), ['CHANGELOG.md', 'info.json']);
    assert.equal(git(root, 'status', '--porcelain'), '');
});

test('already-prepared metadata tags the same commit; resume never retags', t => {
    const root = fixture(t, '1.2.3'), before = git(root, 'rev-parse', 'HEAD');
    const first = prepareLocal(root, {}, quiet);
    assert.equal(first.commit, before);
    assert.throws(() => planRelease(root), /use --resume/);
    const second = prepareLocal(root, { resume: true }, quiet);
    assert.equal(first.tagObject, second.tagObject);
    git(root, 'commit', '--allow-empty', '-m', 'later work');
    assert.throws(() => planRelease(root, { resume: true }), /never moved/);
});

test('dirty sources, non-main, pending Git operations and downgrades stop before tagging', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'other.txt'), 'unrelated');
    assert.throws(() => planRelease(root), /only CHANGELOG/);
    fs.unlinkSync(path.join(root, 'other.txt'));
    git(root, 'switch', '-c', 'feature');
    assert.throws(() => planRelease(root), /main first/);
    git(root, 'switch', 'main');
    const marker = path.join(root, '.git/CHERRY_PICK_HEAD'); fs.writeFileSync(marker, git(root, 'rev-parse', 'HEAD'));
    assert.throws(() => planRelease(root), /Git operation/); fs.unlinkSync(marker);
    const other = fixture(t, '1.3.0'); assert.throws(() => planRelease(other), /older/);
    assert.equal(git(root, 'tag', '--list'), '');
});

test('a directory nested inside another repository is not a module release root', t => {
    const root = fixture(t), nested = path.join(root, 'nested'); fs.mkdirSync(nested);
    assert.throws(() => planRelease(nested), /independent module/);
});

test('old tag-publishes-release workflow is rejected before any mutation', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, '.github/workflows/release-fixture.yaml'), "on:\n  push:\n    tags:\n      - 'v*'\n");
    git(root, 'add', '.'); git(root, 'commit', '-m', 'old workflow');
    assert.throws(() => prepareLocal(root, {}, quiet), /must use only workflow_dispatch/);
    assert.equal(git(root, 'tag', '--list'), '');
});

test('refusing the push keeps the prepared tag local', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { confirm: () => false });
    await publishRelease(root, release, io, quiet);
    assert.equal(state.calls.some(call => call[1] === 'push' || call[1] === 'workflow'), false);
});

test('successful tag CI precedes a separate publish confirmation and exact-tag dispatch', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release);
    await publishRelease(root, release, io, quiet);
    assert.equal(state.questions.length, 2);
    const push = state.calls.find(call => call[1] === 'push');
    assert.ok(push.includes('--atomic')); assert.ok(push.includes('--no-follow-tags'));
    assert.equal(push.some(arg => arg === '--force' || arg === '--tags'), false);
    assert.deepEqual(state.calls.find(call => call[1] === 'workflow'), ['gh', 'workflow', 'run', 'release-fixture.yaml', '--repo', 'example/module', '--ref', 'v1.2.3']);
    assert.ok(state.calls.findIndex(call => call[1] === 'run' && call.includes(release.ci)) < state.calls.findIndex(call => call[1] === 'workflow'));
});

test('declining publication leaves a validated tag and resume continues without another push', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { confirm: question => !question.startsWith('Validation passed') });
    await publishRelease(root, release, io, quiet);
    assert.equal(state.calls.filter(call => call[1] === 'workflow').length, 0);
    state.calls.length = 0; io.confirm = async () => true;
    await publishRelease(root, release, io, quiet);
    assert.equal(state.calls.filter(call => call[1] === 'push').length, 0);
    assert.equal(state.calls.filter(call => call[1] === 'workflow').length, 1);
});

test('failed, cancelled or skipped CI cannot dispatch a release', async t => {
    for (const conclusion of ['failure', 'cancelled', 'skipped', 'timed_out']) {
        const root = fixture(t), release = prepareLocal(root, {}, quiet);
        const { io, state } = ioFor(root, release);
        state.ci.conclusion = conclusion;
        await assert.rejects(publishRelease(root, release, io, quiet), /ended with/);
        assert.equal(state.calls.some(call => call[1] === 'workflow'), false);
    }
});

test('only exact tag, commit and push-event validation counts', t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release);
    for (const change of [{ headSha: 'f'.repeat(40) }, { headBranch: 'main' }, { event: 'pull_request' }]) {
        const original = { ...state.ci }; Object.assign(state.ci, change);
        assert.equal(latestRun(io, 'example/module', release.ci, release.tag, release.commit, 'push'), undefined);
        state.ci = original;
    }
});

test('missing CI times out without publishing', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release); state.ci = undefined;
    await assert.rejects(waitForWorkflow(io, 'example/module', release.ci, release.tag, release.commit, 'push', quiet), /Timed out/);
    assert.equal(state.calls.some(call => call[1] === 'workflow'), false);
});

test('conflicting remote tags and unavailable GitHub fail closed', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release);
    state.remote = `\n${'f'.repeat(40)}\trefs/tags/${release.tag}\n${release.commit}\trefs/tags/${release.tag}^{}`;
    await assert.rejects(publishRelease(root, release, io, quiet), /conflicts/);
    const unavailable = ioFor(root, release, { apiFailure: true });
    await assert.rejects(publishRelease(root, release, unavailable.io, quiet), /unavailable/);
    assert.equal(unavailable.state.calls.some(call => call[1] === 'push' || call[1] === 'workflow'), false);
});

test('lost push acknowledgement is observable on resume, without duplicate push', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { losePushReceipt: true });
    await assert.rejects(publishRelease(root, release, io, quiet), /lost push/);
    await publishRelease(root, release, io, quiet);
    assert.equal(state.calls.filter(call => call[1] === 'push').length, 1);
    assert.equal(state.calls.filter(call => call[1] === 'workflow').length, 1);
});

test('lost dispatch acknowledgement resumes a completed release without another dispatch', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { pushed: true, loseDispatchReceipt: true });
    await assert.rejects(publishRelease(root, release, io, quiet), /lost dispatch/);
    await publishRelease(root, release, io, quiet);
    assert.equal(state.calls.filter(call => call[1] === 'workflow').length, 1);
});

test('changing tag CI during the publish prompt stops dispatch', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { onConfirm: (question, state) => { if (question.startsWith('Validation passed')) state.ci.conclusion = 'failure'; } });
    await assert.rejects(publishRelease(root, release, io, quiet), /validation changed/);
    assert.equal(state.calls.some(call => call[1] === 'workflow'), false);
});

test('workflow-side gate rejects branch dispatch and checks exact successful tag CI', t => {
    const root = fixture(t, '1.2.3'), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { pushed: true });
    const env = { GITHUB_REF: `refs/tags/${release.tag}`, GITHUB_SHA: release.commit, GITHUB_REPOSITORY: 'example/module' };
    assert.equal(verifyTagCI(root, io, env).conclusion, 'success');
    assert.throws(() => verifyTagCI(root, io, { ...env, GITHUB_REF: 'refs/heads/main' }), /not a branch/);
    state.ci.conclusion = 'failure';
    assert.throws(() => verifyTagCI(root, io, env), /must pass/);
    assert.equal(state.calls.some(call => call[1] === 'push' || call[1] === 'workflow'), false);
});

test('GitHub origin parsing rejects ambiguous remotes and credentials', () => {
    for (const url of ['git@github.com:example/module.git', 'https://github.com/example/module.git', 'ssh://git@github.com/example/module']) assert.equal(repositoryName(url), 'example/module');
    for (const url of ['https://token@github.com/example/module', 'git@github.com:example/module.git\ngit@github.com:other/module.git', 'https://elsewhere.invalid/example/module']) assert.throws(() => repositoryName(url));
});

test('a real local bare remote receives only main and the reviewed tag', async t => {
    const root = fixture(t), remote = fs.mkdtempSync(path.join(os.tmpdir(), 'module-release-remote-'));
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    git(remote, 'init', '--bare');
    git(root, 'remote', 'add', 'origin', remote);
    git(root, 'push', 'origin', 'main');
    const release = prepareLocal(root, {}, quiet);
    git(root, 'tag', '-a', 'v8.8.8', '-m', 'unrelated local tag');
    const { io } = ioFor(root, release);
    const original = io.command;
    io.command = (program, args) => {
        if (program === 'git' && args[0] === 'ls-remote') return git(root, 'ls-remote', remote, ...args.slice(2));
        if (program === 'git' && args[0] === 'push') return git(root, ...args);
        return original(program, args);
    };
    await publishRelease(root, release, io, quiet);
    assert.equal(git(remote, 'rev-parse', 'refs/heads/main'), release.commit);
    assert.equal(git(remote, 'rev-parse', `refs/tags/${release.tag}`), release.tagObject);
    assert.equal(git(remote, 'tag', '--list'), release.tag);
});

test('an existing failed release requires a fresh confirmation and new run', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { pushed: true });
    state.runs = [{ databaseId: 20, headSha: release.commit, headBranch: release.tag, event: 'workflow_dispatch', status: 'completed', conclusion: 'failure' }];
    await publishRelease(root, release, io, quiet);
    assert.equal(state.questions.length, 1);
    assert.equal(state.calls.filter(call => call[1] === 'workflow').length, 1);
    assert.equal(state.runs[0].databaseId, 21);
});

test('a running release is observed without another dispatch', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { pushed: true });
    state.runs = [{ databaseId: 20, headSha: release.commit, headBranch: release.tag, event: 'workflow_dispatch', status: 'in_progress', conclusion: null }];
    io.sleep = async ms => {
        state.clock += ms; state.runs[0].status = 'completed'; state.runs[0].conclusion = 'success';
        state.releases = [{ tag_name: release.tag, draft: false, html_url: 'https://example.invalid/release' }];
    };
    await publishRelease(root, release, io, quiet);
    assert.equal(state.questions.length, 0);
    assert.equal(state.calls.some(call => call[1] === 'workflow' || call[1] === 'push'), false);
});

test('changing the local worktree during confirmation stops all remote writes', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { onConfirm: () => fs.writeFileSync(path.join(root, 'new-work.txt'), 'keep') });
    await assert.rejects(publishRelease(root, release, io, quiet), /clean worktree/);
    assert.equal(state.calls.some(call => call[1] === 'workflow' || call[1] === 'push'), false);
    assert.equal(fs.readFileSync(path.join(root, 'new-work.txt'), 'utf8'), 'keep');
});

test('a draft release blocks rather than being reported as published', async t => {
    const root = fixture(t), release = prepareLocal(root, {}, quiet);
    const { io, state } = ioFor(root, release, { pushed: true });
    state.releases = [{ tag_name: release.tag, draft: true }];
    await assert.rejects(publishRelease(root, release, io, quiet), /draft Release/);
    assert.equal(state.calls.some(call => call[1] === 'workflow' || call[1] === 'push'), false);
});

test('failed commit hooks leave inspectable work without a misleading tag', t => {
    const root = fixture(t), before = git(root, 'rev-parse', 'HEAD');
    const hook = path.join(root, '.git/hooks/pre-commit');
    fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    assert.throws(() => prepareLocal(root, {}, quiet));
    assert.equal(git(root, 'rev-parse', 'HEAD'), before);
    assert.equal(git(root, 'tag', '--list'), '');
    assert.match(git(root, 'status', '--porcelain'), /info.json/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'info.json'))).version, '1.2.3');
});
