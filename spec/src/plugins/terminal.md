# Terminal plugin

The plugin registers a movable `terminal` view whose default surface is the
workspace bottom panel.

## Requirements

| ID      | Requirement |
| ------- | ----------- |
| LPT-001 | `@lapis-notes/lapis-plugin-terminal` MUST ship runtime id `terminal`, distribution `first-party-external`, provenance `official`, and `enabledByDefault: true`. |
| LPT-002 | The plugin MUST register view type `terminal` with `ViewAccess.command` opener Open Terminal. That command MUST reveal an existing leaf or create one in the bottom panel. |
| LPT-003 | New Terminal MUST always create a new bottom-panel leaf and a new host session. |
| LPT-004 | After layout restore, if no `terminal` leaf exists, the plugin MUST seed one bottom-panel leaf and open the dock. Persisted terminal leaves MUST win. |
| LPT-005 | Production source MUST receive `App` explicitly or from API context and MUST NOT read `globalThis.app`. The plugin MUST NOT depend on `@lapismd/terminal-host` at runtime. |
| LPT-006 | When `terminal-runtime` is unavailable the panel MUST stay usable and explain that the user should start `lapis-terminal-host` and set URL plus token. |
| LPT-007 | Package Storybook MUST cover `Plugins/Terminal/*` placements. Changed visual stories MUST remain `visual-pending`. |
| LPT-008 | The plugin MUST own Ghostty WASM and xterm.js renderers. It MUST NOT import `@lapismd/terminal-host`. Both renderers MUST share the session client and host byte stream. |
| LPT-009 | The plugin MUST persist `terminal.renderer` as `ghostty` or `xterm`. The default MUST be `ghostty`. A change MUST remount live panels. |
| LPT-010 | When Ghostty WASM fails to load or construct, the panel MUST fall back to xterm for that session and show a non-fatal status. Plugin load MUST NOT fail. |
| LPT-011 | The session client MUST read the current `terminal-runtime` capability on each use. When that capability becomes available, live panels MUST remount. |
| LPT-012 | Unavailable and error Terminal panels MUST compose `@lapismd/design-core/shadcn/empty` with a title, description, and icon. They MUST keep the existing unavailable and error test ids. |
| LPT-013 | The panel MUST subscribe to session output before create or reuse, and Ghostty MUST use an explicit high-contrast theme so typed input remains visible. |
