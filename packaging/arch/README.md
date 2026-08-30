# Arch Linux packaging

A `pacman` package for DSH Desktop, built from the Linux tarball attached to this fork's releases.

Upstream ships macOS and Windows only. These files are specific to this fork and are not part of the upstream project.

## Installing

The quickest route is the prebuilt package attached to the [latest Linux release](https://github.com/sbmthakur/dsh-desktop/releases):

```bash
sudo pacman -U dsh-desktop-bin-0.6.3.linux.1-1-x86_64.pkg.tar.zst
```

To build it yourself instead, from this directory:

```bash
makepkg -si
```

`makepkg` downloads the release tarball, verifies it against the `sha256sums` recorded in `PKGBUILD`, and installs the result. Building from the recipe is the option that does not require trusting a binary someone else produced.

Either route installs to `/opt/dsh-desktop`, links `/usr/bin/dsh-desktop`, and registers a desktop entry and icon. Uninstall with `sudo pacman -R dsh-desktop-bin`.

## What the recipe does that the tarball does not

- Sets `chrome-sandbox` to mode 4755, root-owned. Electron finds the helper, checks the mode, and refuses to start if it is not setuid, so an ordinary copy is worse than no helper at all.
- Supplies the desktop entry and a 512x512 icon. The tarball carries neither, and its own icon is 1024x1024, which is larger than any size `hicolor` defines.
- Surfaces the bundled licence texts under `/usr/share/licenses/dsh-desktop-bin`.

Dependencies are the `DT_NEEDED` entries of the shipped binaries minus what `gtk3` already pulls in. The `deb`/`rpm`/`pacman` targets in `package.json` declare a longer list inherited from electron-builder's defaults; most of it does not apply, because this build bundles its own copies rather than linking the system ones.

## The AUR

This is not on the AUR. Registration for new accounts has been closed since a series of supply-chain attacks in mid-2026, and no reopening date has been announced. `PKGBUILD` and `.SRCINFO` are kept in the layout an AUR repository expects, so submitting is a matter of pushing them once an account is available.

## Updating for a new release

1. Tag and publish a new Linux release, so a tarball exists at a stable URL.
2. Set `pkgver` and `_tag` in `PKGBUILD`. A `pkgver` cannot contain a hyphen, so a `v0.6.3-linux.1` tag becomes `0.6.3.linux.1`.
3. Refresh the checksums — `updpkgsums` from `pacman-contrib`, or `sha256sum` by hand.
4. Regenerate the metadata: `makepkg --printsrcinfo > .SRCINFO`.
5. Check the result with `namcap PKGBUILD` and `namcap *.pkg.tar.zst`.
