# Module releases

Run the release helper **inside this module repository**. It requires Node.js22,
Git and an authenticated GitHub CLI (`gh`); it needs no npm installation or local
Core checkout. `info.json` remains the only module version authority. The small
`package.json` supplies commands and deliberately has no version/dependencies.

Finish implementation and merge it to `main`. Update your local `main` and fetch
tags before releasing. Write a numbered `## MAJOR.MINOR.PATCH` section in
`CHANGELOG.md` with the release bullets; keep `Unreleased` empty. The first
numbered section is the proposed release. An optional version argument must match
it. Historical entries are retained, and no version is invented from Unreleased.

```sh
npm run release:tag -- --dry-run
npm run release:tag
```

Or select the same changelog version explicitly:

```sh
npm run release:tag -- 0.9.6 --dry-run
npm run release:tag -- 0.9.6
```

The version above is illustrative for this shared guide; use your module's actual
numbered release. The helper:

1. Checks the independent Git repository, `main`, clean implementation, numbered
   notes and the two-stage workflows. Only `CHANGELOG.md` may have pending edits
   when preparing a newer version. Matching, already-prepared metadata requires
   a completely clean worktree.
2. Updates only `info.json.version`, commits it with the changelog, and creates an
   annotated tag. If the version is already committed, it creates the missing tag
   at that commit without rewriting files or creating another commit. It never
   changes compatibility, SDK/API ranges, dependencies or workflow pins.
3. Asks before pushing `main` and that one tag atomically. The tag push runs
   `ci-<moduleId>.yaml`, which validates and packages the exact tagged commit.
4. Waits for that tag's successful push validation, then asks separately before
   dispatching `release-<moduleId>.yaml` at the tag. Declining retains the validated
   tag without starting publication.
5. Waits for the release workflow and confirms the GitHub Release exists. The
   pinned reusable build publishes the archive, checksum, manifest and history;
   its existing GitHub-generated release notes policy remains unchanged.

Both prompts default to No. The release workflow also checks exact tag validation
when started manually through GitHub; dispatching it at a branch fails. Neither
tag creation nor tag push publishes a release by itself under these wrappers.

## Local preparation and recovery

`--dry-run` performs local validation without files, commits, tags, prompts or
network access. `--no-push` creates the local release commit/tag only. A
noninteractive invocation must choose one of those modes; it cannot approve remote
operations automatically. Dry-run still reports unfinished/dirty work as a blocker.

After declining a push/publication or losing a connection, rerun on the same clean
`main` with the same tag and release commit:

```sh
npm run release:tag -- --resume
```

Resume checks the actual remote refs and workflow state before continuing. A push
or dispatch that succeeded despite a lost acknowledgement is observed rather than
repeated. A running release is observed; a failed one needs a new confirmation to
dispatch again. CI failures, unavailable GitHub responses and a 30-minute polling
timeout stop the helper without declaring success. Rerun failed validation from
GitHub after investigation, then resume. Source corrections require a new release
version/tag; this helper never moves, deletes or overwrites a tag. If local `main`
advanced beyond the tagged commit, inspect the existing release separately.

There is no automatic rollback/reset if a Git hook, commit, signing or network
operation fails. Inspect `git status`, commits, tags and GitHub before resuming.
Local-only preparation cannot prove the absence of an unfetched remote tag;
publication checks it and refuses conflicts. A published release or draft is not
overwritten.

## First adoption and maintenance

Commit and push the helper, npm commands and **both** workflow changes together
before releasing. The manual release workflow must exist on GitHub's default
branch. Old wrappers publish immediately on a tag push and are rejected by the
helper. Existing release tags are immutable and keep their original workflows.

The helper and tests are identical across the three maintained modules and the
`module:init` scaffold. Workflow filenames use the module ID; tested Core refs
remain module-specific. Run the dependency-free release-tool regressions with:

```sh
npm run test:release
```

Tests use temporary Git repositories/local remotes and simulated GitHub responses;
they never contact Foundry, publish real releases or mutate the module repository.
See GitHub's [manual workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
for the default-branch requirement and dispatch operation.
