#!/usr/bin/env node
// Dependency-free CI tooling. Kept identical in module repositories and module:init.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const print = message => process.stdout.write(`${message}\n`);
const shaPattern = /^[a-f0-9]{40}$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const maxBytes = 256 * 1024 * 1024;
export const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const command = (program, args, options = {}) => execFileSync(program, args, { maxBuffer: maxBytes, stdio: ['ignore', 'pipe', 'pipe'], ...options });
const jsonAPI = endpoint => JSON.parse(command('gh', ['api', '--paginate', '--slurp', endpoint]).toString());
export const artifactName = (identity, run) => `validated-${identity.product}-${identity.commit}-${run.id}-${run.run_attempt}`;

export function identity(root = process.cwd(), env = process.env) {
    const isModule = fs.existsSync(path.join(root, 'info.json'));
    const info = JSON.parse(fs.readFileSync(path.join(root, isModule ? 'info.json' : 'package.json'), 'utf8'));
    const product = isModule ? info.id : 'core';
    const commit = command('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(product) || !versionPattern.test(info.version)
        || !shaPattern.test(commit) || commit !== env.GITHUB_SHA
        || !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? '')) throw new Error('Invalid CI checkout/product identity.');
    if (env.CI_TOOLCHAIN_SHA && !shaPattern.test(env.CI_TOOLCHAIN_SHA)) throw new Error('Invalid toolchain commit.');
    return { schema: 1, product, version: info.version, commit, repository: env.GITHUB_REPOSITORY,
        workflow: isModule ? `ci-${product}.yaml` : 'ci.yml',
        toolchainRef: isModule ? env.CI_CORE_REF : undefined,
        toolchainCommit: isModule ? env.CI_TOOLCHAIN_SHA : commit,
        nodeMajor: Number(process.versions.node.split('.')[0]) };
}

export function expectedFiles(id) {
    return id.product === 'core' ? ['release-notes.md', 'sheet-delver.cdx.json']
        : [`${id.product}-${id.version}.tgz`, 'sheet-delver-manifest.json', `${id.product}-${id.version}.sha256`, 'generate-release-history.mjs'];
}

export function trustedRun(run, id) {
    return Number.isSafeInteger(run.id) && run.id > 0 && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0
        && run.head_sha === id.commit && run.repository?.full_name === id.repository
        && run.head_repository?.full_name === id.repository
        && ['push', 'workflow_dispatch'].includes(run.event)
        && ['main', `v${id.version}`].includes(run.head_branch)
        && run.path?.split('@')[0] === `.github/workflows/${id.workflow}`;
}

function validateBasis(basis, id) {
    if (basis === undefined) return;
    const allowed = id.product === 'core' ? ['CHANGELOG.md', 'package.json', 'package-lock.json'] : ['CHANGELOG.md', 'info.json'];
    if (!basis || !shaPattern.test(basis.commit ?? '') || basis.commit === id.commit
        || !Number.isSafeInteger(basis.runId) || basis.runId < 1
        || !Number.isSafeInteger(basis.runAttempt) || basis.runAttempt < 1
        || !Array.isArray(basis.changed) || basis.changed.some(file => !allowed.includes(file))) {
        throw new Error('Invalid metadata-only validation basis.');
    }
}

export function validateBundle(bundle, id, run, read) {
    validateBasis(bundle.validationBasis, id);
    for (const key of ['schema', 'product', 'version', 'commit', 'repository', 'workflow', 'nodeMajor']) {
        if (bundle[key] !== id[key]) throw new Error(`Validated artifact ${key} differs from requested release.`);
    }
    if (bundle.runId !== run.id || bundle.runAttempt !== run.run_attempt) throw new Error('Artifact belongs to another validation attempt.');
    if (!shaPattern.test(bundle.toolchainCommit ?? '') || (id.product !== 'core' && !bundle.toolchainRef)) throw new Error('Missing validated toolchain identity.');
    const files = expectedFiles(id);
    if (!bundle.files || Object.keys(bundle.files).sort().join('\n') !== [...files].sort().join('\n')) throw new Error('Unexpected artifact file inventory.');
    for (const name of files) {
        const bytes = read(name);
        if (bytes.length !== bundle.files[name].size || digest(bytes) !== bundle.files[name].sha256) throw new Error(`Artifact checksum mismatch: ${name}`);
    }
    if ((id.toolchainCommit && bundle.toolchainCommit !== id.toolchainCommit)
        || (id.product !== 'core' && bundle.toolchainRef !== id.toolchainRef)) {
        const error = new Error('Validated artifact toolchain differs from requested toolchain.');
        error.code = 'TOOLCHAIN_CHANGED';
        throw error;
    }
    return bundle;
}

export function recordBundle(id, directory, env = process.env) {
    const run = { id: Number(env.GITHUB_RUN_ID), run_attempt: Number(env.GITHUB_RUN_ATTEMPT) };
    if (!Number.isSafeInteger(run.id) || run.id < 1 || !Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1
        || !shaPattern.test(id.toolchainCommit ?? '') || (id.product !== 'core' && !id.toolchainRef)) throw new Error('Missing validation run/toolchain identity.');
    const files = Object.fromEntries(expectedFiles(id).map(name => {
        const file = path.join(directory, name);
        if (!fs.lstatSync(file).isFile()) throw new Error(`Not a regular release file: ${name}`);
        const bytes = fs.readFileSync(file);
        return [name, { size: bytes.length, sha256: digest(bytes) }];
    }));
    const validationBasis = env.CI_VALIDATION_BASIS ? JSON.parse(fs.readFileSync(env.CI_VALIDATION_BASIS, 'utf8')) : undefined;
    validateBasis(validationBasis, id);
    const bundle = { ...id, runId: run.id, runAttempt: run.run_attempt, validationBasis, files };
    fs.writeFileSync(path.join(directory, 'validation.json'), `${JSON.stringify(bundle, null, 2)}\n`);
    return artifactName(id, run);
}

/** Only completed, same-repository push/manual validation can supply publication bytes. */
export function findBundle(id, currentRunId, api = jsonAPI) {
    const pages = api(`repos/${id.repository}/actions/workflows/${id.workflow}/runs?head_sha=${id.commit}&per_page=100`);
    if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page.workflow_runs))) throw new Error('Invalid workflow response.');
    const runs = pages.flatMap(page => page.workflow_runs).filter(run => run.id !== currentRunId && trustedRun(run, id))
        .sort((a, b) => b.id - a.id);
    for (const run of runs) {
        if (run.status !== 'completed' || run.conclusion !== 'success') continue;
        const artifactPages = api(`repos/${id.repository}/actions/runs/${run.id}/artifacts?per_page=100`);
        if (!Array.isArray(artifactPages) || artifactPages.some(page => !Array.isArray(page.artifacts))) throw new Error('Invalid artifact response.');
        const matches = artifactPages.flatMap(page => page.artifacts).filter(a => a.name === artifactName(id, run) && !a.expired);
        if (matches.length > 1) throw new Error('Ambiguous validation artifact.');
        const artifact = matches[0];
        if (!artifact) continue; // A lightweight reuse run has no new artifact of its own.
        if (!Number.isSafeInteger(artifact.id) || artifact.id < 1 || !/^sha256:[a-f0-9]{64}$/.test(artifact.digest ?? '')
            || artifact.workflow_run?.id !== run.id || artifact.workflow_run?.head_sha !== id.commit) throw new Error('Invalid artifact origin/digest.');
        return { run, artifact };
    }
    return { pending: runs.some(run => run.status !== 'completed') };
}

export function unpackBundle(zipPath, directory, id, run) {
    const entries = command('unzip', ['-Z1', zipPath]).toString().trim().split('\n');
    const expected = [...expectedFiles(id), 'validation.json'].sort();
    if ([...entries].sort().join('\n') !== expected.join('\n')) throw new Error('Unexpected files or paths in validation archive.');
    const read = name => command('unzip', ['-p', zipPath, name]);
    const bundle = JSON.parse(read('validation.json').toString());
    validateBundle(bundle, id, run, read);
    fs.mkdirSync(directory, { recursive: true });
    if (fs.readdirSync(directory).length) throw new Error('Artifact destination must be empty.');
    for (const name of expected) fs.writeFileSync(path.join(directory, name), read(name), { flag: 'wx' });
    return bundle;
}

export async function restoreBundle(id, directory, { required = false, env = process.env, api = jsonAPI,
    sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
    download = artifact => command('gh', ['api', `repos/${id.repository}/actions/artifacts/${artifact.id}/zip`]),
    unpack = unpackBundle } = {}) {
    const deadline = now() + 30 * 60_000;
    let found;
    do {
        found = findBundle(id, Number(env.GITHUB_RUN_ID), api);
        if (found.artifact || !required || !found.pending) break;
        if (now() >= deadline) throw new Error('Validation still running; retry publication after it completes.');
        print('Waiting for validation of this exact commit.');
        await sleep(10_000);
    } while (true);
    if (!found.artifact) {
        if (required) throw new Error(`No retained successful validation for ${id.commit}. Run ${id.workflow} at v${id.version}, then retry publication.`);
        return false;
    }
    const zip = download(found.artifact);
    if (`sha256:${digest(zip)}` !== found.artifact.digest) throw new Error('GitHub artifact download digest mismatch.');
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'validated-artifact-'));
    try {
        const zipPath = path.join(temporary, 'bundle.zip');
        fs.writeFileSync(zipPath, zip);
        try { unpack(zipPath, directory, id, found.run); }
        catch (error) {
            if (!required && error.code === 'TOOLCHAIN_CHANGED') {
                print('Toolchain changed; running validation and packaging again.');
                return false;
            }
            throw error;
        }
    } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    print(`Reusing ${found.run.html_url} (attempt ${found.run.run_attempt}); no rebuild.`);
    return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try {
        const [operation, directory, flag] = process.argv.slice(2);
        if (!directory || !['record', 'restore'].includes(operation) || (flag && flag !== '--required')) throw new Error('Usage: ci-artifacts.mjs record|restore DIRECTORY [--required]');
        const id = identity();
        const output = operation === 'record'
            ? `artifact_name=${recordBundle(id, directory)}\n`
            : `reused=${await restoreBundle(id, directory, { required: flag === '--required' })}\n`;
        if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
        process.stdout.write(output);
    } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
