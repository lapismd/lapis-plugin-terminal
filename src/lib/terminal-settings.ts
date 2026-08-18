import type { TerminalRendererId } from "./renderers/terminal-renderer";

export const TERMINAL_RENDERER_SETTING_ID = "terminal.renderer";
export const TERMINAL_SHELL_SETTING_ID = "terminal.shell";
export const TERMINAL_CWD_SETTING_ID = "terminal.cwd";
export const DEFAULT_TERMINAL_RENDERER: TerminalRendererId = "ghostty";

export type TerminalPluginSettings = {
  renderer: TerminalRendererId;
  shell: string;
  cwd: string;
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalPluginSettings = {
  renderer: DEFAULT_TERMINAL_RENDERER,
  shell: "",
  cwd: "",
};

export function parseTerminalRendererId(value: unknown): TerminalRendererId {
  return value === "xterm" ? "xterm" : DEFAULT_TERMINAL_RENDERER;
}

function trimSetting(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseTerminalPluginSettings(
  stored: unknown,
): TerminalPluginSettings {
  const record =
    stored && typeof stored === "object"
      ? (stored as Record<string, unknown>)
      : {};
  return {
    renderer: parseTerminalRendererId(record.renderer ?? record[TERMINAL_RENDERER_SETTING_ID]),
    shell: trimSetting(record.shell ?? record[TERMINAL_SHELL_SETTING_ID]),
    cwd: trimSetting(record.cwd ?? record[TERMINAL_CWD_SETTING_ID]),
  };
}

export type TerminalRendererStore = {
  readonly settings: TerminalPluginSettings;
  readonly generation: number;
  hydrate(stored: unknown): void;
  replace(next: Partial<TerminalPluginSettings>): boolean;
  subscribe(listener: () => void): () => void;
};

export function createTerminalRendererStore(
  initial?: unknown,
): TerminalRendererStore {
  let settings = parseTerminalPluginSettings(initial);
  let generation = 0;
  const listeners = new Set<() => void>();

  return {
    get settings() {
      return settings;
    },
    get generation() {
      return generation;
    },
    hydrate(stored) {
      settings = parseTerminalPluginSettings(stored);
    },
    replace(next) {
      const parsed = parseTerminalPluginSettings({ ...settings, ...next });
      const rendererChanged = parsed.renderer !== settings.renderer;
      settings = parsed;
      if (!rendererChanged) return false;
      generation += 1;
      for (const listener of listeners) listener();
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
