import { describe, expect, it } from "vitest";
import {
  createTerminalSettingsStore,
  parseTerminalPluginSettings,
} from "./terminal-settings";

describe("terminal settings", () => {
  it("defaults optional shell and cwd to empty values", () => {
    expect(parseTerminalPluginSettings(null)).toEqual({ shell: "", cwd: "" });
    expect(parseTerminalPluginSettings({})).toEqual({ shell: "", cwd: "" });
  });

  it("ignores legacy renderer values while retaining shell and cwd", () => {
    expect(parseTerminalPluginSettings({
      renderer: "xterm",
      "terminal.renderer": "xterm",
      shell: " /bin/zsh ",
      cwd: " notes ",
    })).toEqual({ shell: "/bin/zsh", cwd: "notes" });
  });

  it("replaces the settings used by new sessions", () => {
    const store = createTerminalSettingsStore();
    store.replace({ shell: "/bin/bash", cwd: "vault" });
    expect(store.settings).toEqual({ shell: "/bin/bash", cwd: "vault" });
  });
});
