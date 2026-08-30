# Maintaining this fork

This fork exists to run DSH Desktop on Linux. Upstream ships macOS and Windows and has not taken the platform on, so the Linux work lives here and upstream changes are pulled in as they land.

The `linux` branch is the default and the one releases are cut from. It is upstream's `main` plus the commits listed below.

## Pulling in upstream changes

Merge, do not rebase.

```bash
git fetch upstream
git merge upstream/main
```

Rebasing rewrites the commits a published tag points at. `v0.6.3-linux.1` was cut before this fork switched to merging, and the rebase that followed left it reachable from nothing anyone develops on. A merge keeps every tag's ancestry intact, and records each conflict resolution in history rather than replaying it.

`git rerere` is enabled in this clone (`rerere.enabled`, `rerere.autoupdate`). It remembers how a conflict was resolved and reapplies that resolution when the same one reappears, which matters here because the deletions below re-conflict every time upstream touches those files. A fresh clone needs it turned on again:

```bash
git config rerere.enabled true
git config rerere.autoupdate true
```

After a merge, revalidate before tagging anything. Upstream changes dependencies and the vendored Harness, so a green suite on the previous baseline says nothing:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run package:linux
```

Then launch the packaged build. `npm run dev` exercises a different path than the artifact people install.

## What diverges, and why

Each entry is a rebase or merge conflict waiting to happen. Keep the list short.

| Area | Change | Conflict risk |
| --- | --- | --- |
| `package.json` | `build.linux`, `desktopName`, `extraFiles`, `package:linux` scripts, a `katex/src` exclusion | High — upstream edits this file constantly, though the Linux additions sit in their own regions |
| `build/licenses/` | LGPL text and third-party notices, absent upstream | Low — new files |
| `packaging/arch/` | The pacman recipe | None — new directory |
| `docs/development.md` | Linux prerequisites, packaging, and notes | Low |
| `README*.md` | Platform table and badge, six files | Medium — upstream edits these, and `readme-parity.test.ts` moves all six together |
| `.github/`, `test/feishu-release-notes.test.ts` | Deleted | **Highest** — deletions conflict whenever upstream modifies the file, and upstream maintains its release pipeline actively |
| `test/release.test.ts` | Linux and licence assertions added, workflow assertions removed | Medium |

The deletions are the expensive ones. If merges start costing more than they are worth, restoring `.github/workflows/release.yml` and disabling it through GitHub's settings instead removes the conflict without bringing the trigger back.

## Cutting a release

There is no release workflow here; upstream's was removed because it fires on `v*` tags and would fail without their signing secrets. Releases are manual.

The tag *is* the version. Upstream's workflow ran `npm version` from the tag name, so the `0.1.1` committed in `package.json` is a placeholder that no release bumps, and building without that step bakes the placeholder into the artifact.

1. Pick a tag: upstream's base version plus `-linux.N`, for example `v0.7.1-linux.1`. It must sort above the previous one and below the next upstream release — check with `vercmp`.
2. Build at that version, then put the working tree back:
   ```bash
   npm version --no-git-tag-version --allow-same-version 0.7.1-linux.1
   npm run build
   npx electron-builder --linux AppImage tar.gz --x64 --publish never
   git checkout -- package.json package-lock.json
   ```
   The `pacman` target needs `libxcrypt-compat`; without it, scope the targets as above.
3. Confirm the version reached the artifact: `node -p "require('./dist/linux-unpacked/resources/app/package.json').version"`.
4. Tag, push, and create the release with both artifacts attached.
5. Update `packaging/arch/` — `pkgver`, `_tag`, checksums, then `makepkg --printsrcinfo > .SRCINFO`.
6. Build the package, check it with `namcap`, and attach it to the release.

Cross-check every checksum against GitHub's recorded asset digest rather than trusting the local file:

```bash
gh api repos/sbmthakur/dsh-desktop/releases/tags/<tag> --jq '.assets[] | "\(.name) \(.digest)"'
```

## Worth sending upstream

The licence fixes are not Linux-specific. `sharp` bundles a prebuilt libvips under the LGPL with no licence text, and the project's own MIT notice was missing from packaged builds — both apply to the macOS and Windows artifacts upstream distributes today. They are carried here as `build/licenses/` and the `extraFiles` entries, and would transplant cleanly.
