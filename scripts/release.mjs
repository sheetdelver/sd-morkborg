#!/usr/bin/env node
// Standalone module tooling. Keep this file identical in the module:init scaffold.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const usage = 'npm run release:tag -- [VERSION] [--dry-run | --no-push] [--resume]';
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const releaseFiles = ['info.json', 'CHANGELOG.md'];
const print = line => process.stdout.write(`${line}\n`);
const printError = line => process.stderr.write(`${line}\n`);
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function parseOptions(args) {
    const result = { dryRun: false, noPush: false, resume: false };
    for (const arg of args) {
        if (arg === '--dry-run') result.dryRun = true;
        else if (arg === '--no-push') result.noPush = true;
        else if (arg === '--resume') result.resume = true;
        else if (!arg.startsWith('-') && !result.version) result.version = arg.replace(/^v/, '');
        else throw new Error(`Unknown argument: ${arg}. ${usage}`);
    }
    if (result.version && !versionPattern.test(result.version)) throw new Error('Use a stable MAJOR.MINOR.PATCH version.');
    return result;
}

export function releaseSection(text, requested) {
    const sections = [...text.replace(/\r\n/g, '\n').matchAll(/^##\s+(.+)\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)];
    const unreleased = sections.find(section => section[1].trim().toLowerCase() === 'unreleased');
    if (unreleased?.[2].trim()) throw new Error('Move Unreleased notes into a numbered release section before releasing.');
    const releases = sections.filter(section => versionPattern.test(section[1].trim()));
    const latest = releases[0];
    if (!latest) throw new Error('CHANGELOG.md needs a numbered ## MAJOR.MINOR.PATCH section.');
    const version = latest[1].trim();
    if (requested && requested !== version) throw new Error(`Requested version must match the latest changelog release (${version}).`);
    if (releases.filter(section => section[1].trim() === version).length !== 1) throw new Error(`Duplicate changelog heading for ${version}.`);
    const notes = latest[2].trim();
    if (!/^\s*-\s+\S/m.test(notes)) throw new Error(`Release ${version} requires nonempty changelog bullets.`);
    return { version, tag: `v${version}`, notes };
}

function triggers(source) {
    return /^on:\s*\n([\s\S]*?)(?=^\S|(?![\s\S]))/m.exec(source)?.[1] ?? '';
}

function readMetadata(root, requested) {
    const infoText = fs.readFileSync(path.join(root, 'info.json'), 'utf8');
    const info = JSON.parse(infoText);
    if (typeof info.id !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(info.id)) throw new Error('info.json needs a canonical module id.');
    if (typeof info.version !== 'string' || !versionPattern.test(info.version)) throw new Error('info.json needs a stable MAJOR.MINOR.PATCH version.');
    const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
    const release = releaseSection(changelog, requested);
    const ci = `ci-${info.id}.yaml`, workflow = `release-${info.id}.yaml`;
    const releaseTrigger = triggers(fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8'));
    // Reject old tag-publishes-release wrappers before any local or remote mutation.
    if (releaseTrigger.trim() !== 'workflow_dispatch:') throw new Error(`${workflow} must use only workflow_dispatch; tag pushes must not publish releases.`);
    const ciTrigger = triggers(fs.readFileSync(path.join(root, '.github/workflows', ci), 'utf8'));
    if (!/^  push:\s*$/m.test(ciTrigger) || !/^    tags:\s*\n      - ['"]v\*['"]\s*$/m.test(ciTrigger)) {
        throw new Error(`${ci} must validate pushed v* tags.`);
    }
    return { ...release, id: info.id, info, infoText, changelog, ci, workflow };
}

function assertRepository(root) {
    if (fs.realpathSync(git(root, 'rev-parse', '--show-toplevel')) !== fs.realpathSync(root)) throw new Error('Run from an independent module Git repository, not a directory inside Core.');
    if (git(root, 'branch', '--show-current') !== 'main') throw new Error('Merge the module work and check out main first; this helper never switches branches.');
    for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
        if (fs.existsSync(path.resolve(root, git(root, 'rev-parse', '--git-path', marker)))) throw new Error(`Finish the active Git operation (${marker}) first.`);
    }
}

export function planRelease(root, options = {}) {
    assertRepository(root);
    const data = readMetadata(root, options.version);
    const current = data.info.version.split('.').map(BigInt), next = data.version.split('.').map(BigInt);
    const firstDifference = next.findIndex((value, index) => value !== current[index]);
    if (firstDifference >= 0 && next[firstDifference] < current[firstDifference]) throw new Error('Release version cannot be older than info.json.');
    const tagOnly = data.info.version === data.version;
    if (options.resume && !tagOnly) throw new Error('Resume requires already-prepared info.json metadata.');
    // Preserve status columns and NUL-separated paths, including rename entries.
    const entries = execFileSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    if ((tagOnly && entries.length) || entries.some(entry => !/^( M|M |MM) CHANGELOG\.md$/.test(entry))) {
        throw new Error(tagOnly ? 'Already-prepared metadata requires a clean worktree.' : 'Commit implementation first; only CHANGELOG.md may have pending edits.');
    }
    for (const file of [...releaseFiles, 'package.json', 'scripts/release.mjs', `.github/workflows/${data.ci}`, `.github/workflows/${data.workflow}`]) {
        if (!git(root, 'ls-files', '--', file)) throw new Error(`${file} must be committed before releasing.`);
    }
    const commit = git(root, 'rev-parse', 'HEAD');
    const existingTag = git(root, 'tag', '--list', data.tag);
    if (existingTag) {
        if (!options.resume) throw new Error(`${data.tag} already exists locally; use --resume to continue without replacing it.`);
        if (git(root, 'cat-file', '-t', `refs/tags/${data.tag}`) !== 'tag'
            || git(root, 'rev-parse', `refs/tags/${data.tag}^{commit}`) !== commit) {
            throw new Error('Resume requires the existing annotated tag at current main; tags are never moved or replaced.');
        }
    }
    return { ...data, commit, tagOnly, existingTag: Boolean(existingTag) };
}

export function prepareLocal(root, options, output = print) {
    const plan = planRelease(root, options);
    output(`${options.dryRun ? 'DRY RUN' : 'Release plan'}: ${plan.id} ${plan.tag} on main`);
    output(`info.json: ${plan.info.version} -> ${plan.version}\n${plan.notes}`);
    output(plan.tagOnly ? 'Use the existing release commit.' : 'Commit info.json and the numbered changelog section.');
    output(`Annotated tag ${plan.tag}; tag push runs validation only. Publication requires a later confirmation.`);
    if (options.dryRun) return plan;
    const fresh = planRelease(root, options);
    if (fresh.commit !== plan.commit || fresh.infoText !== plan.infoText || fresh.changelog !== plan.changelog) throw new Error('Release state changed; inspect and retry.');
    if (!plan.tagOnly) {
        const indent = /^([ \t]+)"/m.exec(plan.infoText)?.[1] ?? '  ';
        const eol = plan.infoText.includes('\r\n') ? '\r\n' : '\n';
        const updated = JSON.stringify({ ...plan.info, version: plan.version }, null, indent).replace(/\n/g, eol) + eol;
        fs.writeFileSync(path.join(root, 'info.json'), updated);
        git(root, 'add', '--', ...releaseFiles);
        git(root, 'commit', '-m', `chore(release): prepare ${plan.tag}`);
        const committed = JSON.parse(git(root, 'show', 'HEAD:info.json'));
        if (JSON.stringify(committed) !== JSON.stringify({ ...plan.info, version: plan.version })) throw new Error('Commit changed planned metadata; no tag created.');
        // Commit hooks must not alter the reviewed notes or leave unrelated work.
        if (fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8') !== plan.changelog) throw new Error('Changelog changed during commit; no tag created.');
        if (git(root, 'rev-parse', 'HEAD^') !== plan.commit
            || git(root, 'diff', '--name-only', plan.commit, 'HEAD').split('\n').some(file => !releaseFiles.includes(file))) {
            throw new Error('Commit included unreviewed changes; no tag created.');
        }
    }
    const final = planRelease(root, { ...options, resume: plan.existingTag });
    if (!final.tagOnly || (plan.tagOnly && final.commit !== plan.commit)) throw new Error('Release state changed during preparation; no tag created.');
    if (!final.existingTag) git(root, 'tag', '-a', plan.tag, '-m', `${plan.id} ${plan.tag}`, final.commit);
    output(`Prepared ${plan.tag} at ${final.commit}.`);
    return { ...final, existingTag: true, tagObject: git(root, 'rev-parse', `refs/tags/${plan.tag}`) };
}

export function repositoryName(url) {
    const match = /^(?:git@github\.com:|https:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(url);
    if (!match) throw new Error('origin must have one GitHub SSH or HTTPS push URL without embedded credentials.');
    return match[1];
}

function remoteRefs(io, url, tag) {
    const lines = io.command('git', ['ls-remote', url, 'refs/heads/main', `refs/tags/${tag}`, `refs/tags/${tag}^{}`]).trim().split(/\r?\n/).filter(Boolean);
    const refs = new Map();
    for (const line of lines) {
        const match = /^([a-f0-9]{40})\t(.+)$/.exec(line);
        if (!match || refs.has(match[2])) throw new Error('Unexpected remote refs; inspect origin.');
        refs.set(match[2], match[1]);
    }
    return { main: refs.get('refs/heads/main'), tag: refs.get(`refs/tags/${tag}`), commit: refs.get(`refs/tags/${tag}^{}`) };
}

function publishedRelease(io, repo, tag) {
    // --paginate avoids interpreting an older existing release as absent.
    const pages = JSON.parse(io.command('gh', ['api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`]));
    if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page))) throw new Error('Invalid GitHub release response.');
    return pages.flat().find(release => release.tag_name === tag);
}

export function latestRun(io, repo, workflow, tag, commit, event, afterId = 0) {
    const runs = JSON.parse(io.command('gh', ['run', 'list', '--repo', repo, '--workflow', workflow, '--branch', tag, '--commit', commit, '--event', event, '--limit', '100', '--json', 'databaseId,headSha,headBranch,event,status,conclusion,url']));
    if (!Array.isArray(runs)) throw new Error('Invalid GitHub workflow response.');
    return runs.filter(run => run.headSha === commit && run.headBranch === tag && run.event === event
        && Number.isSafeInteger(run.databaseId) && run.databaseId > afterId).sort((a, b) => b.databaseId - a.databaseId)[0];
}

export async function waitForWorkflow(io, repo, workflow, tag, commit, event, output = print, afterId = 0) {
    const deadline = io.now() + 30 * 60_000;
    while (io.now() < deadline) {
        const run = latestRun(io, repo, workflow, tag, commit, event, afterId);
        output(run ? `${workflow}: ${run.status} ${run.url}` : `${workflow}: waiting for GitHub to register ${tag}`);
        if (run?.status === 'completed') {
            if (run.conclusion !== 'success') throw new Error(`${workflow} ended with ${run.conclusion}: ${run.url}. Fix/review it before resuming.`);
            return run;
        }
        await io.sleep(10_000);
    }
    throw new Error(`Timed out waiting for ${workflow}; resume after checking GitHub. No release was inferred.`);
}

export async function publishRelease(root, release, io, output = print) {
    const url = io.command('git', ['remote', 'get-url', '--push', '--all', 'origin']).trim();
    const repo = repositoryName(url);
    const assertLocal = () => {
        const now = planRelease(root, { version: release.version, resume: true });
        if (now.commit !== release.commit || io.command('git', ['rev-parse', `refs/tags/${release.tag}`]).trim() !== release.tagObject
            || io.command('git', ['remote', 'get-url', '--push', '--all', 'origin']).trim() !== url) throw new Error('Local release or origin changed; nothing further will be published.');
    };
    const assertRemoteTag = () => {
        const remote = remoteRefs(io, url, release.tag);
        if (remote.tag !== release.tagObject || remote.commit !== release.commit) throw new Error('Remote tag does not match the reviewed annotated tag; never overwrite it.');
        return remote;
    };
    assertLocal();
    let remote = remoteRefs(io, url, release.tag);
    if (!remote.main) throw new Error('origin/main must exist before releasing.');
    if (remote.tag && (remote.tag !== release.tagObject || remote.commit !== release.commit)) throw new Error('Remote tag conflicts with the local release; never overwrite it.');
    const existingRelease = publishedRelease(io, repo, release.tag);
    if (existingRelease) {
        assertRemoteTag();
        if (existingRelease.draft) throw new Error(`${release.tag} is reserved by a draft Release; review it in GitHub before continuing.`);
        output(`${release.tag} already has a GitHub Release; nothing changed.`);
        return;
    }
    if (remote.main !== release.commit) io.command('git', ['merge-base', '--is-ancestor', remote.main, release.commit]);
    if (!remote.tag || remote.main !== release.commit) {
        if (!await io.confirm(`Push main and ${release.tag} to ${repo} for validation?`)) {
            output(`Kept the tag local. Continue with: npm run release:tag -- ${release.version} --resume`);
            return;
        }
        assertLocal();
        remote = remoteRefs(io, url, release.tag);
        if (remote.tag && (remote.tag !== release.tagObject || remote.commit !== release.commit)) throw new Error('Remote tag changed before push.');
        // Atomic, non-forced publication; never push other local tags.
        io.command('git', ['push', '--atomic', '--no-follow-tags', 'origin', 'refs/heads/main:refs/heads/main', `refs/tags/${release.tag}:refs/tags/${release.tag}`]);
    }
    assertRemoteTag();
    await waitForWorkflow(io, repo, release.ci, release.tag, release.commit, 'push', output);
    assertLocal();
    assertRemoteTag();
    let previous = latestRun(io, repo, release.workflow, release.tag, release.commit, 'workflow_dispatch');
    if (previous && previous.status !== 'completed') {
        output('Release workflow already running; waiting without dispatching another.');
        await waitForWorkflow(io, repo, release.workflow, release.tag, release.commit, 'workflow_dispatch', output);
    } else if (!publishedRelease(io, repo, release.tag)) {
        if (!await io.confirm(`Validation passed. Publish ${release.tag} by starting ${release.workflow}?`)) {
            output(`Validated tag retained; no release started. Continue with: npm run release:tag -- ${release.version} --resume`);
            return;
        }
        assertLocal();
        assertRemoteTag();
        const ci = latestRun(io, repo, release.ci, release.tag, release.commit, 'push');
        if (ci?.status !== 'completed' || ci.conclusion !== 'success') throw new Error('Tag validation changed; release not dispatched.');
        if (publishedRelease(io, repo, release.tag)) throw new Error('Release appeared while confirming; inspect it before continuing.');
        previous = latestRun(io, repo, release.workflow, release.tag, release.commit, 'workflow_dispatch');
        if (previous && previous.status !== 'completed') throw new Error('Another release workflow started; resume to observe it.');
        io.command('gh', ['workflow', 'run', release.workflow, '--repo', repo, '--ref', release.tag]);
        await waitForWorkflow(io, repo, release.workflow, release.tag, release.commit, 'workflow_dispatch', output, previous?.databaseId ?? 0);
    }
    const published = publishedRelease(io, repo, release.tag);
    if (!published || published.draft) throw new Error('Release workflow finished without a published GitHub Release; inspect GitHub.');
    assertRemoteTag();
    output(`Published ${release.tag}: ${published.html_url}`);
}

/** Read-only gate used by the manual release workflow, including runs started in GitHub's UI. */
export function verifyTagCI(root, io, env = process.env) {
    const data = readMetadata(root);
    if (env.GITHUB_REF !== `refs/tags/${data.tag}` || data.info.version !== data.version) throw new Error('Run release workflow at the prepared version tag, not a branch.');
    const commit = git(root, 'rev-parse', 'HEAD');
    if (env.GITHUB_SHA !== commit || !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? '')) throw new Error('Workflow checkout/repository identity does not match the release event.');
    const repo = env.GITHUB_REPOSITORY;
    const remote = remoteRefs(io, `https://github.com/${repo}.git`, data.tag);
    if (!remote.tag || remote.commit !== commit) throw new Error('Remote annotated tag no longer matches this workflow.');
    const run = latestRun(io, repo, data.ci, data.tag, commit, 'push');
    if (run?.status !== 'completed' || run.conclusion !== 'success') throw new Error('Exact tag push validation must pass before release.');
    return run;
}

function consoleIO(root) {
    return {
        command: (program, args) => execFileSync(program, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
        confirm: async question => {
            if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
            const rl = createInterface({ input: process.stdin, output: process.stdout });
            try { return /^y(?:es)?$/i.test((await rl.question(`${question} [y/N] `)).trim()); }
            finally { rl.close(); }
        },
        now: Date.now,
        sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    try {
        const args = process.argv.slice(2);
        if (args.length === 1 && args[0] === '--help') print(usage);
        else if (args.length === 1 && args[0] === '--verify-tag-ci') {
            const run = verifyTagCI(root, consoleIO(root));
            print(`Tag validation passed: ${run.url}`);
        } else {
            const options = parseOptions(args);
            if (!options.dryRun && !options.noPush && (!process.stdin.isTTY || !process.stdout.isTTY)) throw new Error('Use --dry-run or --no-push in a noninteractive terminal. Publication requires interactive confirmation.');
            const release = prepareLocal(root, options);
            if (!options.dryRun && !options.noPush) await publishRelease(root, release, consoleIO(root));
            else if (!options.dryRun) print(`No remote operations. Continue with: npm run release:tag -- ${release.version} --resume`);
        }
    } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        printError('Stopped without automatic reset, tag replacement or retry. Inspect the state before resuming.');
        process.exitCode = 1;
    }
}
