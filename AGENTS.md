# Terminal plugin repository guidance

This repository owns the first-party external Lapis plugin whose runtime ID is
`terminal` and whose package is `@lapis-notes/lapis-plugin-terminal`.

## Ownership and compatibility

- Keep terminal views, commands, Ghostty WASM presentation, and Fake sessions
  here. Ghostty is the only supported VT renderer.
- Consume host facilities only through published `@lapis-notes/api` and
  `@lapismd/design-core` exports.
- Do not depend on `@lapismd/terminal-host` at runtime.
- Preserve runtime IDs, command IDs, and view types.
- Keep production host registration in Lapis. Package Storybook owns Terminal
  catalog acceptance under `Plugins/Terminal/*`.

## Application ownership

- First-party runtime and package Storybook code must receive `App` explicitly
  or derive it from the API component context. Plugin views pass `this.app`.
- Do not read or assign `globalThis.app`.
- Run `pnpm check:app-ownership` for App-related changes.

## Specification and validation

- Canonical requirements live in `spec/src`.
- Run `pnpm spec:check`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm
  publint` for relevant changes.
- Consume published LapisMD dependencies through normal npm semver ranges.
  Unpublished first-party Lapis host packages remain development-only until
  their own publication plan is complete.

## Version control

- Use Jujutsu for status, diffs, commits, bookmarks, and history work.
- After each verified slice, commit with a PR-quality message. This is a
  standing request; do not wait for the user to ask.
