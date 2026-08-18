import { describe, expect, it } from "vitest";
import { resolveTerminalCreateOptions, resolveVaultWorkspace } from "./terminal-session-options";

describe("resolveTerminalCreateOptions", () => {
  it("sends settings and the desktop vault path", () => {
    const app = {
      vault: { adapter: { rootPath: "/Users/ada/vault" } },
    } as never;
    expect(resolveVaultWorkspace(app)).toBe("/Users/ada/vault");
    expect(
      resolveTerminalCreateOptions(
        { renderer: "ghostty", shell: "/bin/zsh", cwd: "notes" },
        app,
      ),
    ).toEqual({
      cols: 80,
      rows: 24,
      cwd: "notes",
      shell: "/bin/zsh",
      workspace: "/Users/ada/vault",
    });
  });

  it("omits empty optional paths", () => {
    expect(
      resolveTerminalCreateOptions({ renderer: "ghostty", shell: "", cwd: "" }),
    ).toEqual({
      cols: 80,
      rows: 24,
      cwd: undefined,
      shell: undefined,
      workspace: undefined,
    });
  });
});
