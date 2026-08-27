# Specification governance

## Requirements

| ID          | Requirement |
| ----------- | ----------- |
| LPT-SPEC-001 | `spec/src` MUST remain the canonical standalone specification and MUST build with mdBook. |
| LPT-SPEC-002 | Protected package, manifest, source, agent-guidance, and validation changes MUST update an owning canonical chapter in the same Jujutsu change. |
| LPT-SPEC-003 | Every normative requirement ID MUST be unique and MUST have exactly one verification row. |
| LPT-SPEC-004 | Published package manifests MUST use portable semver ranges and MUST NOT contain `workspace:`, `link:`, `file:`, or machine-specific dependency paths. |

The shared `@lapismd/spec-validator` package is repository validation tooling,
not a runtime package. It MUST resolve from npm through the root development
dependency. This exception does not weaken source-first validation for runtime
Lapis or Design Core dependencies.
