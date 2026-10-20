#!/usr/bin/env node
// Publication only: use the package and history tool produced by successful CI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { identity, restoreBundle, digest } from './ci-artifacts.mjs';

export function verifyModuleAssets(id, directory) {
    if (id.product === 'core') throw new Error('Expected a module repository.');
    const name = `${id.product}-${id.version}`;
    const archive = fs.readFileSync(path.join(directory, `${name}.tgz`));
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'sheet-delver-manifest.json'), 'utf8'));
    const checksum = fs.readFileSync(path.join(directory, `${name}.sha256`), 'utf8');
    if (manifest.module?.id !== id.product || manifest.module?.version !== id.version
        || manifest.artifact?.size !== archive.length || manifest.artifact?.integrity !== `sha256:${digest(archive)}`
        || manifest.artifact?.url !== `${name}.tgz` || checksum !== `${digest(archive)}  ${name}.tgz\n`) {
        throw new Error('Validated module assets disagree on identity or archive checksum.');
    }
    return [`${name}.tgz`, 'sheet-delver-manifest.json', `${name}.sha256`].map(file => path.join(directory, file));
}

export function publishModule(id, directory, env = process.env, run = (program, args) => execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) {
    const tag = `v${id.version}`;
    if (env.GITHUB_REF !== `refs/tags/${tag}`) throw new Error('Publish at the prepared version tag.');
    const assets = verifyModuleAssets(id, directory);
    const pages = JSON.parse(run('gh', ['api', '--paginate', '--slurp', `repos/${id.repository}/releases?per_page=100`]));
    if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page))) throw new Error('Invalid release history response.');
    const releases = pages.flat();
    if (releases.some(release => release.tag_name === tag)) throw new Error(`Release ${tag} already exists; refusing to overwrite it.`);
    const historyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'module-release-history-'));
    try {
        for (const release of releases.filter(release => !release.draft && !release.prerelease)) {
            if (!/^v[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(release.tag_name) || release.tag_name.includes('..')) continue;
            if (!release.assets?.some(asset => asset.name === 'sheet-delver-manifest.json')) continue;
            const target = path.join(historyRoot, release.tag_name);
            fs.mkdirSync(target);
            run('gh', ['release', 'download', release.tag_name, '--repo', id.repository, '--pattern', 'sheet-delver-manifest.json', '--dir', target]);
        }
        const history = path.join(directory, 'sheet-delver-releases.json');
        // This is the existing generator bundled from CI's pinned Core checkout,
        // not a second implementation of the release-history contract.
        run(process.execPath, [path.join(directory, 'generate-release-history.mjs'), '--module-id', id.product,
            '--repository', `https://github.com/${id.repository}`, '--current-manifest', assets[1], '--current-tag', tag,
            '--previous-directory', historyRoot, '--output', history]);
        run('gh', ['release', 'create', tag, ...assets, history, '--repo', id.repository,
            '--title', `${id.product} ${tag}`, '--generate-notes', '--verify-tag']);
    } finally { fs.rmSync(historyRoot, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try {
        const id = identity();
        if (process.env.GITHUB_REF !== `refs/tags/v${id.version}`) throw new Error('Publish at the prepared version tag.');
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'module-publication-'));
        try {
            await restoreBundle(id, directory, { required: true });
            // Recheck the current tag and latest validation immediately before publication.
            execFileSync(process.execPath, ['scripts/release.mjs', '--verify-tag-ci'], { stdio: 'inherit' });
            publishModule(id, directory);
        } finally { fs.rmSync(directory, { recursive: true, force: true }); }
    } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
