# `@lapis-notes/lapis-plugin-terminal`

First-party Lapis plugin for interactive shell sessions. The default leaf lives
in the workspace bottom panel. Process execution is provided by sibling
`@lapismd/terminal-host`; this package must not depend on it at runtime.

The plugin owns one VT renderer: Ghostty WASM (`ghostty-web`). The packaged
`ghostty-vt.wasm` asset is exported from `dist`. Host output stays as raw bytes
until it reaches Ghostty; renderer selection and xterm.js are intentionally not
part of the plugin contract.
