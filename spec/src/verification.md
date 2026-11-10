# Verification

| ID           | Status      | Evidence                                                                                                                                          |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| LPT-001      | Implemented | manifest.json and package.json                                                                                                                    |
| LPT-002      | Implemented | TerminalPlugin Open Terminal command and view registration                                                                                        |
| LPT-003      | Implemented | New Terminal command creates a bottom leaf                                                                                                        |
| LPT-004      | Implemented | layout-ready seed when no terminal leaf exists                                                                                                    |
| LPT-005      | Implemented | application-ownership test and package.json peers                                                                                                 |
| LPT-006      | Implemented | unavailable empty state in TerminalPanel                                                                                                          |
| LPT-007      | Planned     | Package Storybook placements                                                                                                                      |
| LPT-008      | Implemented | Ghostty-only renderer contract, raw-byte session client tests, and dependency audit                                                               |
| LPT-009      | Implemented | settings tests ignore legacy renderer values and retain shell plus cwd                                                                            |
| LPT-010      | Implemented | TerminalPanel routes Ghostty construction failures to terminal-error without fallback imports                                                     |
| LPT-011      | Implemented | live session client and refreshHostSessions remount tests                                                                                         |
| LPT-012      | Implemented | TerminalPanel Empty composition and contract test                                                                                                 |
| LPT-013      | Implemented | panel attaches listeners before create                                                                                                            |
| LPT-014      | Implemented | Ghostty gets workspace theme before open; wrap does not assign options.theme after Ghostty open                                                   |
| LPT-017      | Implemented | panel createSession runs when persisted resize/attach throws                                                                                      |
| LPT-015      | Implemented | settings persist shell and cwd; panel create sends them; live panel uses workspace content padding; empty states stay flush; square-terminal icon |
| LPT-016      | Implemented | TerminalView detaches its leaf and requestSaveLayout on bound session exit or a later unavailable write/resize                                    |
| LPT-018      | Implemented | Ghostty adapter debounce and chunked write; panel uses fitted size and skips unchanged host resize                                                |
| LPT-SPEC-001 | Implemented | spec/book.toml                                                                                                                                    |
| LPT-SPEC-002 | Implemented | spec-validator mapped spec-first rules with the shared validator resolved from npm                                                                |
| LPT-SPEC-003 | Implemented | one verification row per ID                                                                                                                       |
| LPT-SPEC-004 | Implemented | package manifest uses semver ranges and root validation tooling resolves `@lapismd/spec-validator` from npm                                       |

View-owned creation is covered by the session-owner concurrency and close-during-create regressions, with real hosted Ghostty acceptance qualified by Server.
