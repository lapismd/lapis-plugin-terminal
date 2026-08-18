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
    expect(source).toContain("refreshHostSessions");
    expect(manifest).toContain('"ghostty-web"');
    expect(manifest).toContain('"@xterm/xterm"');
    expect(manifest).toContain('"./ghostty-vt.wasm"');
    expect(manifest).not.toContain("@lapismd/terminal-host");
    expect(manifest).not.toMatch(/"(?:workspace|link|file):/u);
  });

  it("renders unavailable and error states with design-core Empty", () => {
    const panel = readFileSync(resolve(sourceRoot, "terminal-panel.svelte"), "utf8");
    expect(panel).toContain('@lapismd/design-core/shadcn/empty');
    expect(panel).toContain("@lapismd/design-core/workspace/icon");
    expect(panel).toContain("Empty.Root");
    expect(panel).toContain("Empty.Title");
    expect(panel).toContain("Empty.Description");
    expect(panel).toContain("terminal-unavailable");
    expect(panel).toContain("terminal-error");
    expect(panel).toContain("data-testid={testId}");
  });

  it("subscribes to session output before create and keeps a Ghostty contrast theme", () => {
    const panel = readFileSync(resolve(sourceRoot, "terminal-panel.svelte"), "utf8");
    const ghostty = readFileSync(resolve(sourceRoot, "renderers/ghostty-engine.ts"), "utf8");
    expect(panel.indexOf("plugin.sessions.onOutput(writeBound)")).toBeLessThan(
      panel.indexOf("plugin.sessions.create"),
    );
    expect(ghostty).toContain('background: "#1e1e1e"');
    expect(ghostty).toContain('foreground: "#d4d4d4"');
  });
});
