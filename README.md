# `@lapis-notes/lapis-plugin-terminal`

First-party Lapis plugin for interactive shell sessions. The default leaf lives
in the workspace bottom panel. Process execution is provided by the host through
the public `terminal-runtime` native bridge. The standalone
`@lapismd/terminal-host` package is not a runtime dependency.

The plugin owns one VT renderer: Ghostty WASM (`ghostty-web`). The packaged
`ghostty-vt.wasm` asset is exported from `dist`. Host output stays as raw bytes
until it reaches Ghostty; renderer selection and xterm.js are intentionally not
part of the plugin contract.
