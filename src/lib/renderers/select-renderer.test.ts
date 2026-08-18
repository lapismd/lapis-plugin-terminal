import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createPlainRenderer } from "./plain-renderer";
import { selectTerminalRenderer } from "./select-renderer";

describe("selectTerminalRenderer", () => {
  it("defaults to the Ghostty factory when preferred", async () => {
    const ghostty = createPlainRenderer();
    const selected = await selectTerminalRenderer({
      preferred: "ghostty",
      createGhostty: async () => ghostty,
      createXterm: async () => {
        throw new Error("xterm should not load");
      },
    });
    expect(selected.active).toBe("plain");
    expect(selected.renderer).toBe(ghostty);
    expect(selected.fallbackReason).toBeNull();
  });

  it("uses xterm when the setting is explicit", async () => {
    const xterm = createPlainRenderer();
    const selected = await selectTerminalRenderer({
      preferred: "xterm",
      createGhostty: async () => {
        throw new Error("ghostty should not load");
      },
      createXterm: async () => xterm,
    });
    expect(selected.renderer).toBe(xterm);
    expect(selected.fallbackReason).toBeNull();
  });

  it("falls back to xterm when Ghostty WASM fails", async () => {
    const xterm = createPlainRenderer();
    const selected = await selectTerminalRenderer({
      preferred: "ghostty",
      createGhostty: async () => {
        throw new Error("wasm instantiate failed");
      },
      createXterm: async () => xterm,
    });
    expect(selected.renderer).toBe(xterm);
    expect(selected.fallbackReason).toContain("wasm instantiate failed");
    expect(selected.fallbackReason).toContain("using xterm");
  });

  it("loads production engines only through dynamic import", () => {
    const source = readFileSync(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "select-renderer.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/^import .*ghostty-web/mu);
    expect(source).not.toMatch(/^import .*@xterm\/xterm/mu);
    expect(source).toContain('import("./ghostty-engine")');
    expect(source).toContain('import("./xterm-engine")');
  });
});
