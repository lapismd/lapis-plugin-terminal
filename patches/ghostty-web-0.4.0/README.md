# Maintained Ghostty Web 0.4.0 patch

This temporary patch backports [upstream PR #232](https://github.com/coder/ghostty-web/pull/232): OSC 10/11 update resolved VT default colours, the canvas fills its viewport without stretching cells, and scrollbar drawing/hit testing reach the right edge. It is based on the exact v0.4.0 source, not later upstream features.

`../ghostty-web@0.4.0.patch` is the generated pnpm package patch. `source.patch` is the reviewable source backport, including its regressions. `provenance.json` pins the source and native revisions, Zig version and generated artifact checksums. The user explicitly authorized maintaining this dependency patch while upstream delivery is pending.

## How it reaches consumers

Source development and CI apply pnpm `patchedDependencies` during an ordinary frozen install. Ghostty is pinned to 0.4.0 as a build dependency. Packaging bundles that verified ESM runtime privately into Terminal and copies its self-contained types and MIT licence. It extracts the matching WASM from the patched embedded payload, rather than copying the registry's unpatched binary sidecar. Hash mismatches fail the build.

The published Terminal archive therefore needs no Ghostty dependency, consumer patch, installation script, sibling checkout or pnpm hook. Existing renderer lifecycle, theme and geometry tests remain enabled. A future change must be accepted through the public packaged Terminal in Server as well as the source browser suite.

## Regenerate

1. Check out `coder/ghostty-web` v0.4.0 (`9e4e126d89ac`) in an isolated Jujutsu checkout, with the pinned Ghostty submodule `5714ed07a1012573261b7b7e3ed2add9c1504496`.
   The tag declares source package version 0.3.0; upstream stamps npm version 0.4.0 from the release tag. Both facts are recorded separately.
2. Apply `source.patch` to that clean source. Keep all other `lib` and `patches` source unchanged.
3. With Bun and Zig 0.15.2, run the upstream `bun run fmt`, `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` lanes. The source backport passes 324 tests; its WASM and JavaScript must be rebuilt together. A Linux build environment can be used when the host SDK cannot link Zig's native build runner.
4. From this Terminal repository, run `pnpm patch:ghostty /absolute/path/to/built/ghostty-web`. It verifies the checkout diff against `source.patch`, regenerates the pnpm patch and checksums, and updates the registry lockfile through pnpm.
5. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm spec:check`, `pnpm publint`, then pack and run Server's terminal/catalog/reload acceptance without a Ghostty archive override. Review the source diff and artifact hashes together.

## Remove

When a registry release includes both fixes, first validate that release with the existing browser and packaged-consumer regressions. Remove the pnpm patch entry/files and fixed-hash provenance check, update the pinned build dependency and lockfile, and keep packaging the renderer so applications retain a self-contained Terminal. Do not disable the regression tests to remove the patch.
