# DSH Desktop development guide

This guide covers local development, validation, patch maintenance, and target-native packaging. For the runtime design, see [Architecture](architecture.md). For formal releases, see the [release runbook](release-runbook.md).

This is the Linux fork. For pulling in upstream changes, what diverges from upstream and why, and how releases are cut here, see [Maintaining this fork](fork.md).

## Prerequisites

- Node.js 22 or later
- npm
- macOS on Apple Silicon or Intel, Windows x64, or Linux x64

DSH Desktop currently pins `@deepseek-ai/dsh@0.1.1-rc.2`. Windows and Linux packages bundle a target-native Node.js runtime for Harness, while macOS uses an Electron UtilityProcess. Both are independent of the Node.js version used to run development commands.

## Local setup

```bash
git clone https://github.com/dataelement/dsh-desktop.git
cd dsh-desktop
npm ci
npm run dev
```

`npm ci` runs the repository's `postinstall` hook. It reapplies the tracked `patch-package` patches, installs DSH brand assets into the pinned Harness frontend, and installs Electron.

Development builds use the separate application name `DSH Desktop Dev` and the separate user-data directory `dsh-desktop-dev`, so they do not reuse production DSH Desktop data. Multiple development worktrees still share that development profile by default; avoid running them at the same time when testing profile, plugin, migration, or recovery changes.

## Validation

Run the core checks before submitting a change:

```bash
npm test
npm run typecheck
npm run build
```

Static checks are not a substitute for runtime verification. Changes that affect startup, profiles, plugins, native dialogs, updates, mobile access, or packaging should also be exercised through the corresponding real application flow.

To exercise the Cloudflare-to-Pinggy fallback without disrupting the machine's network, start the development app with Cloudflare failure simulation enabled:

```bash
DSH_TUNNEL_FORCE_PINGGY=1 npm run dev
```

Then enable the temporary public tunnel from the phone connection screen. The tunnel status should report `pinggy`, and the generated URL should use a Pinggy hostname. This variable affects only the process started from that command; omit it on the next launch to restore the normal Cloudflare-first behavior.

## Project map

```text
src/main/                 Electron main process and application orchestration
src/main/runtime/         Harness process lifecycle and diagnostics
src/main/state/           Profile consistency, repair, recovery, and Safe Mode
src/main/mobile/          Paired phone bridge and optional Cloudflare tunnel
src/main/update/          Installed-build update state and lifecycle
src/preload/              Narrow renderer-to-main IPC and desktop UI seams
src/shared/               Shared contracts and desktop menu definitions
packages/                 Bundled desktop support packages
patches/                  Reproducible patches for the pinned Harness packages
build/                    Packaged HTML, icons, loaders, and Harness entry files
scripts/                  Build, signing, metadata, and target verification tools
test/                     Unit and source-contract regression coverage
```

## Maintaining upstream patches

The desktop product intentionally reuses the upstream Harness UI. Desktop-specific provider onboarding, preset transfer, model selection, workspace, branding, and layout changes are captured under `patches/` rather than stored as untracked edits in `node_modules`.

When upgrading Harness:

1. Install the intended upstream version.
2. Verify the current Settings, Credentials, Provider Directory, workspace, and preset contracts.
3. Reapply or rewrite each desktop customization.
4. Regenerate the relevant `patch-package` patches.
5. Run the full automated suite.
6. Start the real app and exercise every affected user flow.

## Packaging

Harness includes architecture-specific native dependencies. Build each installer on the operating system and architecture where it will run.

```bash
# macOS Apple Silicon, on an Apple Silicon Mac or runner
npm run package:mac:arm64

# macOS Intel, on an Intel Mac or runner
npm run package:mac:x64

# Windows x64 NSIS installer, on a Windows x64 machine or runner
npm run package:win

# Linux x64 AppImage, pacman package, and tarball, on a Linux x64 machine or runner
npm run package:linux
```

Do not invoke `electron-builder --win` from macOS or Linux for a distributable Windows package. The target verification scripts intentionally reject host/target mismatches.

## Linux notes

Linux packaging produces three artifacts from one run: `dsh-desktop-linux-x86_64.AppImage`, which runs on any distribution without installation, `dsh-desktop-linux-x64.pacman` for Arch-family systems, and `dsh-desktop-linux-x64.tar.gz` for manual installation.

The pacman target is built by `fpm`, which electron-builder downloads on first use, and which refuses to build without a maintainer contact address. `author` in `package.json` carries no email, so `linux.maintainer` supplies one as `"Name <email>"`. Adding `deb` or `rpm` needs nothing further; dropping `linux.maintainer` breaks all three.

That bundled `fpm` ships its own Ruby, which is linked against `libcrypt.so.1`. Arch has moved to `libcrypt.so.2`, so on an Arch host the pacman target aborts with `ruby: error while loading shared libraries: libcrypt.so.1` until the compatibility library is installed:

```bash
sudo pacman -S --needed libxcrypt-compat
```

The AppImage and tarball targets do not go through `fpm` and build without it.

Linux runs Harness the way Windows does — as an ordinary child process of the bundled Node.js runtime rather than an Electron UtilityProcess, which is a macOS-only path taken for TCC disclaiming. The tray, the custom title bar, and the close-to-tray behavior stay Windows-only; a Linux window uses the native frame and the native application menu, and closing it quits the app.

Automatic updates are off on Linux: `supportsAutoUpdates` covers only packaged macOS and Windows builds, and there is no Linux update feed behind the configured `publish` URL. Check for Updates reports that rather than failing, and a Linux build is upgraded by installing the next artifact.

Every packaged build carries `LICENSE.lgpl-3.0.txt` and `THIRD-PARTY-NOTICES.md` beside the application binary, next to Electron's own `LICENSE.electron.txt`. They cover the prebuilt libvips that `sharp` bundles, which is LGPL and ships no license text of its own, and they are what lets the build be redistributed without the host taking on an unmet obligation. Revisit `build/licenses/THIRD-PARTY-NOTICES.md` when a dependency upgrade adds or drops a component under a copyleft license.

For local unsigned development packages, use the corresponding `package:dev:*` command. Before handing off a Windows installer, verify that `resources/app/node_modules/node/bin/node.exe` exists in `win-unpacked` and require the packaged Windows Harness smoke test to pass.

This fork carries no release workflow. Upstream's built, signed, and published macOS and Windows artifacts on every `v*` tag; here it would fire on each Linux tag, find none of the signing secrets, and fail. Linux releases are cut by hand: build with `npm run package:linux`, then attach the artifacts to a tag. `packaging/arch/README.md` covers refreshing the pacman recipe afterwards.

## Contribution hygiene

- Never include real API keys in issues, logs, screenshots, fixtures, or test data.
- Preserve unrelated worktree changes.
- Keep temporary research, local reports, and internal working documents under the ignored `doc/` directory.
- Update all localized README files when changing user-visible facts.
