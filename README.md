# `@lapis-notes/lapis-plugin-terminal`

First-party Lapis plugin for interactive shell sessions. The default leaf lives
in the workspace bottom panel. Process execution is provided by sibling
`@lapismd/terminal-host`; this package must not depend on it at runtime.

The plugin owns two VT renderers: Ghostty WASM (`ghostty-web`) is the default,
and xterm.js is the explicit and fallback engine. Persist `terminal.renderer`
as `ghostty` or `xterm`. The packaged `ghostty-vt.wasm` asset is exported from
`dist`.
