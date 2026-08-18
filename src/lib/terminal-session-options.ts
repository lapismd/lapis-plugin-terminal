import type { App } from "@lapis-notes/api";
import type { TerminalPluginSettings } from "./terminal-settings";

export type TerminalSessionCreateOptions = {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
  workspace?: string;
};

export function resolveVaultWorkspace(app?: App): string | undefined {
  const adapter = app?.vault?.adapter as { rootPath?: unknown } | undefined;
  const rootPath = typeof adapter?.rootPath === "string" ? adapter.rootPath.trim() : "";
  return rootPath || undefined;
}

export function resolveTerminalCreateOptions(
  settings: TerminalPluginSettings,
  app?: App,
  size: { cols: number; rows: number } = { cols: 80, rows: 24 },
): TerminalSessionCreateOptions {
  const workspace = resolveVaultWorkspace(app);
  return {
    cols: size.cols,
    rows: size.rows,
    cwd: settings.cwd || undefined,
    shell: settings.shell || undefined,
    workspace,
  };
}
