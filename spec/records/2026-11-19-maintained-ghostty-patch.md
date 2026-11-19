# Maintained Ghostty Web patch

The user explicitly requested a maintained local Ghostty patch, overriding the
workspace's default dependency-patch restriction for this defect. The source
remains fixed in the upstream owning project (coder/ghostty-web PR #232).

The patch backports only default-colour and viewport/scrollbar fixes to the exact
v0.4.0 source, preserving its pinned native Ghostty revision. Its reviewable
source patch, generated pnpm patch and artifact hashes are tracked under patches.
The source tag declares package version 0.3.0; upstream's release workflow stamps
npm 0.4.0 from the tag. Regeneration verifies both facts independently. The first
regeneration attempt rejected this version difference before mutation; the
explicit sourcePackageVersion now matches the immutable tag.

Ordinary frozen installs apply the pnpm patch. Packaging checks source/package
patch hashes, ESM/UMD/type hashes and embedded WASM hash, then bundles Ghostty as a
private module with no external imports. The matching sidecar WASM, types, MIT
licence and provenance ship in dist. Ghostty is build-only; no install hook or
consumer patch is required. Source and tagged-release CI install Chromium and
run the packaged runtime lane. Regeneration/removal are documented in
patches/ghostty-web-0.4.0/README.md.

Regression evidence:

- Registry baseline: `pnpm exec vitest run --config vitest.browser.config.ts -t
'updates default cell backgrounds|fills fractional-cell'`: two failed,
  four skipped. After normal pnpm patch installation: two passed, four skipped.
- Frozen registry install succeeds with no ignored Ghostty archive hook.
- Source check and 38 unit tests pass; all six source browser cases pass.
- `pnpm test:package`: eight source/package browser cases pass, including both
  embedded and sidecar WASM, existing VT cells, explicit colour retention,
  fractional viewport pixels and Retina width. Build rejects external imports
  and checksum/version drift.
- Build, spec and publint pass. Regeneration through patch:ghostty reproduces
  the patch from the verified source checkout and updates provenance.
- Owning 0.4.0 source backport: all 324 tests, format, lint, typecheck and normal
  library/WASM build pass. The disposable Zig build container was removed.

Server consumes the packed Terminal public output with its Ghostty override
removed. Its focused 16 cases, 92 complete catalog cases and two cold real-keyboard
reload cases pass; broader consumer evidence is maintained in Server. The one
removed optimizer-resolution unit case addressed a dependency that is now bundled,
not a suppressed product regression. Upstream release is now a patch-removal
milestone rather than a delivery prerequisite; Terminal publication remains a
separate consumer gate. No npm release, deployment or baseline update occurred.
