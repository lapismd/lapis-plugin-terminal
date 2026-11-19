# Host-supplied Terminal appearance review

Date: 2026-11-19. Requirement: LPT-019.

TerminalPlugin accepts optional host font family/size. Omitted options preserve
the existing 13px system monospace. Regular/bold loading settles before Ghostty
construction and fitting; font failures keep the renderer usable. Server selects
JetBrains Mono; Desktop is unchanged. Existing peer ranges remain accepted while
adding the current Server API/Core cohort. Development uses registry packages
without the previous sibling API override and the Deno-free validator 0.2.1.

## Validation

- Original boundary: `pnpm exec vitest run --project unit src/lib/renderers/wrap-ghostty.test.ts src/lib/terminal-plugin.test.ts`: 6 passed, 0 failed.
- New regression: `pnpm exec vitest run --project unit src/lib/renderers/ghostty-engine.test.ts`: initially 1 failed / 2 passed; after implementation 3 passed / 0 failed.
- `pnpm check`: spec validation, App ownership, Svelte and TypeScript pass; 0 Svelte errors/warnings.
- `pnpm test`: 22 passed / 0 failed across 8 files.
- `pnpm build`, `pnpm publint`, and `pnpm spec:check`: pass.
- The initial formatter invocation found no local Prettier binary; the Server checkout's Prettier 3.6.2 formatted the changed source/spec files.
- `spec-validator doctor --json` passes; semantic search reports QMD disabled and uses the documented fallback.
- Server consumes a built public pnpm archive through an ignored validation hook. Its 6 new stories pass 12 interaction/axe cases; full catalog passes 58 cases, Server unit tests pass 110 cases, checks and application/static catalog builds pass.

## Qualification limits

This is a verified presentation extension and catalog review slice. No PTY,
startup, shell-selection or teardown implementation changes here. The compact
coloured prompt is Server catalog fixture output; native Bash implementation and
cold image/PTY acceptance remain pending. No publication, PR or visual baseline
update occurred. API 0.2.4 reports its pre-existing Core peer-range mismatch in
the 0.12.3 development cohort; source checks and Server acceptance pass.
