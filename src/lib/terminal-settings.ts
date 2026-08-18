import type { TerminalRendererId } from "./renderers/terminal-renderer";

export const TERMINAL_RENDERER_SETTING_ID = "terminal.renderer";
export const DEFAULT_TERMINAL_RENDERER: TerminalRendererId = "ghostty";

export type TerminalPluginSettings = {
  renderer: TerminalRendererId;
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalPluginSettings = {
  renderer: DEFAULT_TERMINAL_RENDERER,
};

export function parseTerminalRendererId(value: unknown): TerminalRendererId {
  return value === "xterm" ? "xterm" : DEFAULT_TERMINAL_RENDERER;
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
  };
}

export type TerminalRendererStore = {
  readonly settings: TerminalPluginSettings;
  readonly generation: number;
  hydrate(stored: unknown): void;
  replace(next: TerminalPluginSettings): boolean;
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
      const parsed = parseTerminalPluginSettings(next);
      if (parsed.renderer === settings.renderer) {
        settings = parsed;
        return false;
      }
      settings = parsed;
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
