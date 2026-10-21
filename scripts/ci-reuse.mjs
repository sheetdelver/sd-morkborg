#!/usr/bin/env node
// Dependency-free validation selection; identical in modules and module:init.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { identity, expectedFiles, restoreBundle, trustedRun } from './ci-artifacts.mjs';

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const shaPattern = /^[a-f0-9]{40}$/;
const command = (program, args, cwd) => execFileSync(program, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const git = (root, ...args) => command('git', args, root);
const full = reason => ({ reused: false, exact: false, package: true, reason });

function tree(root, revision) {
    return new Map(git(root, 'ls-tree', '-rz', revision).split('\0').filter(Boolean).map(entry => {
        const tab = entry.indexOf('\t');
        return [entry.slice(tab + 1), entry.slice(0, tab)];
    }));
}
function document(root, revision, file) {
    return JSON.parse(git(root, 'show', `${revision}:${file}`));
}
function normalizedMetadata(root, revision, product) {
    const files = product === 'core' ? ['package.json', 'package-lock.json'] : ['info.json'];
    const documents = files.map(file => document(root, revision, file));
    const version = documents[0].version;
    if (!versionPattern.test(version ?? '')) throw new Error('Invalid release version.');
    if (product === 'core') {
        const lock = documents[1];
        if (lock.version !== version || lock.packages?.['']?.version !== version) throw new Error('Root package and lock versions differ.');
        delete lock.packages[''].version;
    } else if (documents[0].id !== product) throw new Error('Module identity changed.');
    for (const doc of documents) delete doc.version;
    return { version, documents };
}

/** Compare the entire committed tree. Only the named root version fields and
 * CHANGELOG.md may differ. File modes, dependencies, pins, config and unknown
 * files are significant. Shallow/missing/non-ancestor history is a cache miss. */
export function metadataDifference(root, base, current, product) {
    if (!shaPattern.test(base) || !shaPattern.test(current) || base === current) return null;
    try {
        git(root, 'merge-base', '--is-ancestor', base, current);
        const before = tree(root, base), after = tree(root, current);
        const allowed = new Set(product === 'core' ? ['CHANGELOG.md', 'package.json', 'package-lock.json'] : ['CHANGELOG.md', 'info.json']);
        const changed = [...new Set([...before.keys(), ...after.keys()])].filter(file => before.get(file) !== after.get(file));
        for (const file of changed) {
            if (!allowed.has(file) || !before.get(file)?.startsWith('100644 blob ') || !after.get(file)?.startsWith('100644 blob ')) return null;
        }
        const oldMetadata = normalizedMetadata(root, base, product);
        const newMetadata = normalizedMetadata(root, current, product);
        if (!isDeepStrictEqual(oldMetadata.documents, newMetadata.documents)) return null;
        return { baseVersion: oldMetadata.version, version: newMetadata.version, changed };
    } catch { return null; }
}

/** Look at at most 100 recent main runs; no unbounded history or network scan.
 * A cache miss is ordinary full CI. Publication still requires exact-tag CI. */
export async function selectValidation(id, directory, { root = process.cwd(), env = process.env,
    api = endpoint => JSON.parse(command('gh', ['api', endpoint])),
    restore = restoreBundle } = {}) {
    if (!['push', 'pull_request'].includes(env.GITHUB_EVENT_NAME)) return full('Manual validation runs the complete suite.');
    if (env.GITHUB_EVENT_NAME === 'pull_request' && env.CI_PR_HEAD_REPOSITORY !== id.repository) return full('Fork pull requests run independently.');
    if (await restore(id, directory, { env })) return { reused: true, exact: true, package: false, reason: 'Exact-commit validation reused.' };
    const response = api(`repos/${id.repository}/actions/workflows/${id.workflow}/runs?branch=main&per_page=100`);
    if (!Array.isArray(response.workflow_runs)) throw new Error('Invalid baseline workflow response.');
    const runs = response.workflow_runs.filter(run => run.id !== Number(env.GITHUB_RUN_ID)
        && run.head_branch === 'main' && run.status === 'completed' && run.conclusion === 'success'
        && shaPattern.test(run.head_sha ?? '') && trustedRun(run, { ...id, commit: run.head_sha }))
        .sort((a, b) => b.id - a.id);
    for (const run of runs) {
        const difference = metadataDifference(root, run.head_sha, id.commit, id.product);
        if (!difference || difference.version !== id.version) continue;
        const baseId = { ...id, commit: run.head_sha, version: difference.baseVersion,
            toolchainCommit: id.product === 'core' ? run.head_sha : id.toolchainCommit };
        const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-baseline-'));
        try {
            const source = path.join(temporary, 'bundle');
            if (!await restore(baseId, source, { env })) continue;
            const bundle = JSON.parse(fs.readFileSync(path.join(source, 'validation.json'), 'utf8'));
            const basis = { commit: baseId.commit, runId: bundle.runId, runAttempt: bundle.runAttempt,
                changed: difference.changed };
            // info.json is compiled into module JS. Refresh the package when it
            // changes; never relabel stale compiled bytes with a new version.
            // Changelog-only edits can retain a package unless it includes that file.
            let packaging = id.product !== 'core' && difference.changed.includes('info.json');
            if (id.product !== 'core' && !packaging) {
                const archive = path.join(source, `${id.product}-${id.version}.tgz`);
                const entries = command('tar', ['-tzf', archive]).split('\n').map(entry => entry.replace(/^\.\//, ''));
                packaging = entries.includes('CHANGELOG.md');
                if (!packaging) {
                    fs.mkdirSync(directory, { recursive: true });
                    if (fs.readdirSync(directory).length) throw new Error('Artifact destination must be empty.');
                    for (const file of expectedFiles(id)) fs.copyFileSync(path.join(source, file), path.join(directory, file), fs.constants.COPYFILE_EXCL);
                }
            }
            return { reused: true, exact: false, package: packaging, basis,
                reason: `Reused checks from ${baseId.commit} (run ${bundle.runId}, attempt ${bundle.runAttempt}); only release metadata differs.${packaging ? ' Refreshing version-bearing package.' : ''}` };
        } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    }
    return full('No retained successful main validation with identical non-release inputs.');
}

export function writeSelection(result, directory, env = process.env) {
    if (result.basis) {
        const basisPath = `${path.resolve(directory)}.basis.json`;
        fs.mkdirSync(path.dirname(basisPath), { recursive: true });
        fs.writeFileSync(basisPath, JSON.stringify(result.basis), { flag: 'wx' });
        if (env.GITHUB_ENV) fs.appendFileSync(env.GITHUB_ENV, `CI_VALIDATION_BASIS=${basisPath}\n`);
    }
    const output = ['reused', 'exact', 'package'].map(key => `${key}=${result[key]}\n`).join('');
    if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, output);
    if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `### Validation selection\n\n${result.reason}\n`);
    process.stdout.write(`${result.reason}\n${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try {
        const [directory, ...extra] = process.argv.slice(2);
        if (!directory || extra.length) throw new Error('Usage: ci-reuse.mjs DIRECTORY');
        const result = await selectValidation(identity(), directory);
        writeSelection(result, directory);
    } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
