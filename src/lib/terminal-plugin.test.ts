import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));

describe("TerminalPlugin contracts", () => {
  it("registers Open Terminal, New Terminal, and a bottom-panel seed", () => {
    const source = readFileSync(resolve(sourceRoot, "terminal-plugin.ts"), "utf8");
    const manifest = readFileSync(
      resolve(sourceRoot, "../../package.json"),
      "utf8",
    );
    expect(source).toContain('id: "open-terminal"');
    expect(source).toContain('name: "Open Terminal"');
    expect(source).toContain('name: "New Terminal"');
    expect(source).toContain("getBottomLeaf");
    expect(source).toContain("seedDefaultTerminal");
    expect(source).toContain("registerTerminalSettings");
    expect(manifest).toContain('"ghostty-web"');
    expect(manifest).toContain('"@xterm/xterm"');
    expect(manifest).toContain('"./ghostty-vt.wasm"');
    expect(manifest).not.toContain("@lapismd/terminal-host");
    expect(manifest).not.toMatch(/"(?:workspace|link|file):/u);
  });
});
