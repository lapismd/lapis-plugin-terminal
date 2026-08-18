import { describe, expect, it } from "vitest";
import {
  DEFAULT_TERMINAL_RENDERER,
  TERMINAL_RENDERER_SETTING_ID,
  createTerminalRendererStore,
  parseTerminalPluginSettings,
} from "./terminal-settings";

describe("terminal renderer settings", () => {
  it("defaults to ghostty", () => {
    expect(parseTerminalPluginSettings(null).renderer).toBe(DEFAULT_TERMINAL_RENDERER);
    expect(parseTerminalPluginSettings({}).renderer).toBe("ghostty");
    expect(parseTerminalPluginSettings({ renderer: "unknown" }).renderer).toBe(
      "ghostty",
    );
  });

  it("accepts an explicit xterm value", () => {
    expect(parseTerminalPluginSettings({ renderer: "xterm" }).renderer).toBe("xterm");
    expect(
      parseTerminalPluginSettings({ [TERMINAL_RENDERER_SETTING_ID]: "xterm" }).renderer,
    ).toBe("xterm");
  });

  it("notifies subscribers so live panels can remount", () => {
    const store = createTerminalRendererStore();
    const generations: number[] = [];
    const detach = store.subscribe(() => {
      generations.push(store.generation);
    });
    expect(store.replace({ renderer: "ghostty" })).toBe(false);
    expect(store.generation).toBe(0);
    expect(store.replace({ renderer: "xterm" })).toBe(true);
    expect(store.settings.renderer).toBe("xterm");
    expect(store.generation).toBe(1);
    expect(generations).toEqual([1]);
    detach();
  });
});
