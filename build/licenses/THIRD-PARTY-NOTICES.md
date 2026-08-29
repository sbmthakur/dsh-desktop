# Third-party notices

DSH Desktop is distributed under the [MIT License](https://github.com/dataelement/dsh-desktop/blob/main/LICENSE). A packaged build additionally contains third-party components under their own terms. Most are permissive (MIT, Apache-2.0, ISC, BSD); this file covers the ones that carry obligations beyond attribution.

## Components under the GNU Lesser General Public License

### libvips, via `@img/sharp-libvips-*`

A packaged build bundles a prebuilt libvips and its dependencies, reached through the `sharp` image library. The package is selected by platform and architecture, so exactly one of `@img/sharp-libvips-darwin-arm64`, `@img/sharp-libvips-darwin-x64`, `@img/sharp-libvips-linux-x64`, and the other targets listed in `sharp`'s optional dependencies is present in any one build.

- **License:** LGPL-3.0-or-later. The full text, including the GNU General Public License version 3 that it incorporates by reference, is in `LICENSE.lgpl-3.0.txt` beside this file.
- **Corresponding source:** https://github.com/lovell/sharp-libvips — the build recipes for the prebuilt binaries, including the exact upstream revision of libvips and of every library compiled into it.
- **Versions in this build:** `resources/app/node_modules/@img/sharp-libvips-*/versions.json` records the exact version of libvips and of each bundled dependency.
- **Relinking:** the library is loaded dynamically from `resources/app/node_modules/@img/`, not statically linked into the application binary. Replacing it there with a modified build of the same version is sufficient to relink; nothing else in the packaged application has to be rebuilt.

### FFmpeg, via Electron

Electron bundles FFmpeg as `libffmpeg.so` (`libffmpeg.dylib` on macOS, `ffmpeg.dll` on Windows), which is also under the LGPL. Electron's own notices cover it: see `LICENSE.electron.txt` and `LICENSES.chromium.html` in the same directory as the application binary.

## Notes for redistributors

Whoever hosts a packaged build — rather than the person who runs it — carries the LGPL's source-availability obligation for the components above. This file and `LICENSE.lgpl-3.0.txt` ship inside the build so that obligation travels with the artifact.
