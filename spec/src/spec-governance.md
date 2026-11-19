# Specification governance

## Requirements

| ID           | Requirement                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LPT-SPEC-001 | `spec/src` MUST remain the canonical standalone specification and MUST build with mdBook.                                                              |
| LPT-SPEC-002 | Protected package, manifest, source, agent-guidance, and validation changes MUST update an owning canonical chapter in the same Jujutsu change.        |
| LPT-SPEC-003 | Every normative requirement ID MUST be unique and MUST have exactly one verification row.                                                              |
| LPT-SPEC-004 | Published package manifests MUST use portable semver ranges and MUST NOT contain `workspace:`, `link:`, `file:`, or machine-specific dependency paths. |

The shared `@lapismd/spec-validator` package is repository validation tooling,
not a runtime package. It MUST resolve from npm through the root development
dependency. This exception does not weaken source-first validation for runtime
Lapis or Design Core dependencies.

Validation uses the Deno-free spec-validator 0.2.1 release from npm. The
qualified hosted UI uses released API/Design Core peers, never local source
aliases in the publishable manifest, workspace configuration or lockfile.
The committed lockfile resolves API 0.6.5, UI 0.2.5 and Design Core 0.13.4 from
npm; clean registry installation passes all 27 tests plus check, build,
specification and package validation.

The canonical GitHub repository is `lapismd/lapis-plugin-terminal`. Pull requests
and main pushes run the source, test, build, specification and package checks
on Node 24 with locked registry dependencies. A source-matching `v*` tag runs
the same locked qualification before immutable public npm publication, verifies
the packaged Ghostty WASM and runtime manifest in a clean consumer, checks npm
signatures and provenance, and only then creates the GitHub release. Initial
publication may use the protected bootstrap token; later releases use the npm
trusted publisher through GitHub OIDC.

Renderer lifecycle, theme and viewport checks run in real Chromium at Retina pixel density alongside units. Unpublished upstream renderer qualification uses ignored archives and explicit pnpm hooks without lockfile writes; portable registry ranges remain authoritative for publication.

The maintained Ghostty patch is an explicit user-authorized exception to the
workspace dependency-patch restriction. It backports the owning upstream source
fix to the exact registry version, records source/artifact hashes, and is bundled
into the public Terminal package. Local archive overrides are not required for
Ghostty acceptance. CI and tagged release qualification verify both normal source and packaged runtime lanes.

The 0.1.1 release uses the existing immutable v-tag workflow after source and
packaged-runtime qualification, retaining the pnpm patch and its checksums.
