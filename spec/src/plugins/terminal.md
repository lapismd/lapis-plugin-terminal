# Terminal plugin

The plugin registers a movable `terminal` view whose default surface is the
workspace bottom panel.

## Requirements

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LPT-001 | `@lapis-notes/lapis-plugin-terminal` MUST ship runtime id `terminal`, distribution `first-party-external`, provenance `official`, and `enabledByDefault: true`.                                                                                                                                                                                                                                                                                                               |
| LPT-002 | The plugin MUST register view type `terminal` with `ViewAccess.command` opener Open Terminal. That command MUST reveal a retained terminal when none is visible, and create a new bottom-panel terminal when a terminal is already visible or none exists.                                                                                                                                                                                                                    |
| LPT-003 | New Terminal, including the accessible plus button in the live panel, MUST always create a new bottom-panel leaf and a new host session. Terminal tabs MUST have stable numbered labels.                                                                                                                                                                                                                                                                                      |
| LPT-004 | After layout restore, if no `terminal` leaf exists, the plugin MUST seed one bottom-panel leaf and open the dock. Persisted terminal leaves MUST win.                                                                                                                                                                                                                                                                                                                         |
| LPT-005 | Production source MUST receive `App` explicitly or from API context and MUST NOT read `globalThis.app`. The plugin MUST NOT depend on `@lapismd/terminal-host` at runtime.                                                                                                                                                                                                                                                                                                    |
| LPT-006 | When `terminal-runtime` is unavailable the panel MUST stay usable and explain that Terminal sessions require a supported native host with terminal access enabled.                                                                                                                                                                                                                                                                                                            |
| LPT-007 | Package Storybook MUST cover `Plugins/Terminal/*` placements. Changed visual stories MUST remain `visual-pending`.                                                                                                                                                                                                                                                                                                                                                            |
| LPT-008 | The plugin MUST own one VT renderer: packaged Ghostty WASM through a privately bundled, version-pinned `ghostty-web` build. It MUST NOT ship or load xterm.js, and MUST NOT import `@lapismd/terminal-host`. Host output MUST remain raw `Uint8Array` bytes until Ghostty receives it.                                                                                                                                                                                        |
| LPT-009 | The plugin MUST NOT register or persist a renderer setting. Legacy `renderer` and `terminal.renderer` values MUST be ignored while shell and cwd settings remain readable.                                                                                                                                                                                                                                                                                                    |
| LPT-010 | When Ghostty WASM fails to load or construct, the panel MUST show its existing terminal error empty state. Plugin load MUST NOT fail and MUST NOT load a fallback VT renderer.                                                                                                                                                                                                                                                                                                |
| LPT-011 | The session client MUST read the current `terminal-runtime` capability on each use. When that capability becomes available, live panels MUST remount.                                                                                                                                                                                                                                                                                                                         |
| LPT-012 | Unavailable and error Terminal panels MUST compose `@lapismd/design-core/shadcn/empty` with a title, description, and icon. They MUST keep the existing unavailable and error test ids.                                                                                                                                                                                                                                                                                       |
| LPT-013 | The panel MUST subscribe to session output before create or reuse so restore and early echoes remain visible.                                                                                                                                                                                                                                                                                                                                                                 |
| LPT-014 | Ghostty MUST receive workspace view colors before `open()`. Theme writes after open MUST NOT assign Ghostty `options.theme`. Ghostty MUST NOT keep a hardcoded dark canvas when the theme is light, and MUST hide helper and contenteditable carets.                                                                                                                                                                                                                          |
| LPT-015 | The plugin MUST persist optional `terminal.shell` and `terminal.cwd`. Empty shell MUST use the host default. Empty cwd MUST use the desktop vault path when available, otherwise the host workspace. Live sessions MUST send those values on create. The live panel MUST fill its available width without outer content padding; the overlay scrollbar MUST reach the right viewport edge. Empty states MUST remain flush. Plugin chrome MUST use the `square-terminal` icon. |
| LPT-016 | When the bound host session exits, or a later write or resize reports that session unavailable, the owning `terminal` leaf MUST close and the workspace MUST commit that layout so the dock tab is removed. The panel MUST NOT keep an in-place process-exited banner.                                                                                                                                                                                                        |
| LPT-017 | When a persisted session cannot be resized or attached, the panel MUST create a replacement session instead of keeping a dead leaf.                                                                                                                                                                                                                                                                                                                                           |
| LPT-018 | The Ghostty adapter MUST debounce container fit, chunk writes, and swallow a Ghostty write RangeError. Create and reuse MUST use the fitted size and MUST NOT send a host resize when cols and rows are unchanged.                                                                                                                                                                                                                                                            |

| LPT-019 | Embedding hosts MAY supply optional font family and size through the TerminalPlugin constructor. Omitted options MUST preserve the existing appearance. Custom regular and bold fonts MUST finish loading or fail before Ghostty constructs and fits the viewport; a font-load failure MUST retain a usable fallback. Fonts and shell policy remain host-owned. |

Native hosted consumers inject the public `TerminalSessionClient` through the
existing `TerminalPlugin` constructor. The plugin keeps Ghostty, views and
settings; authenticated transport, admitted cwd policy and PTY process lifetime
remain host-owned. Peer ranges retain the qualified API 0.2 and Design Core
0.12 contracts while admitting the published API 0.4/0.6 and Design Core 0.13
host cohorts. Release validation builds against API 0.6.5 and Design Core
0.13.4 before the exact tagged package is published to npm with provenance.

## Leaf-owned creation

A Terminal leaf retains one pending PTY creation across renderer remounts and same-plugin View replacements. A replacement claims the session before the previous View retires; empty layout state does not replace that owned session. Closing the leaf or replacing Terminal with another view retires a late creation. Panel mounting continues to fit the actual renderer size before attachment.

The panel reports busy until a fitted session is bound, and retains bounded input typed during creation rather than silently dropping it.

Default seeding opens the bottom panel without activating its command host. A late Ghostty mount preserves focus held by another control, including a command palette or editor. Explicit terminal commands still reveal their leaf.

A layout-ready seed belongs to one plugin activation; disable fences old callbacks and drains pending seed work before retry or host cleanup.

View unload retires its PTY unless a same-plugin replacement on the same leaf
claims ownership. Renderer-only remounts continue to reuse that PTY.

Package source and issues are hosted at `lapismd/lapis-plugin-terminal`.
Repository creation and source merging do not publish the npm package.

The fourth `TerminalPlugin` constructor argument is `TerminalAppearanceOptions`.
Server may select a bundled font without changing other hosts' defaults or shell
selection. Development acceptance resolves published API and Design Core exports
from npm, including the supported Core 0.12/0.13 cohort.

Live theme changes update both Ghostty's VT default colours and canvas renderer,
so empty/default cells continue matching the owning workspace background.
Changing brand or colour mode must retain input, scrollback and the same session.

If renderer startup is cancelled while host creation is pending, the panel must
stop that newly created session instead of leaving an unbound PTY. Hiding the
bottom panel retains its terminal sessions and numbered tabs.

Layout snapshots omit an unbound session ID so richer bound live state survives projection.

## Maintained renderer patch

While upstream PR #232 awaits release, Terminal maintains the explicitly
user-authorized Ghostty Web 0.4.0 pnpm patch and its reviewable source backport.
Ordinary frozen installs apply it. Packaging bundles the verified JavaScript,
matching embedded and fallback WASM, types, licence and provenance so consumers
need no patch or installation hook. Ghostty is a pinned build dependency, not a
runtime dependency. Hash drift fails packaging. Regeneration/removal instructions
live in patches/ghostty-web-0.4.0/README.md; existing browser regressions remain gates.

Release 0.1.1 carries the reviewed host font configuration, terminal controls and
self-contained patched Ghostty runtime. npm, runtime and manifest versions must
match; the native Server shell profile remains outside this release.
