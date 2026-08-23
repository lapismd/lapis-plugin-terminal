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
    expect(source).toContain('addRibbonIcon("square-terminal"');
    expect(manifest).toContain('"ghostty-web"');
    expect(manifest).not.toContain('"@xterm/xterm"');
    expect(manifest).not.toContain('"@xterm/addon-fit"');
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

  it("subscribes to session output before create and follows the host theme", () => {
    const panel = readFileSync(resolve(sourceRoot, "terminal-panel.svelte"), "utf8");
    const wrap = readFileSync(resolve(sourceRoot, "renderers/wrap-ghostty.ts"), "utf8");
    const ghostty = readFileSync(resolve(sourceRoot, "renderers/ghostty-engine.ts"), "utf8");
    expect(panel.indexOf("plugin.sessions.onOutput(writeBound)")).toBeLessThan(
      panel.indexOf("plugin.sessions.create"),
    );
    expect(panel).toContain("caret-color: transparent");
    expect(panel).toContain("resolveTerminalCreateOptions");
    expect(panel).toContain("createSession");
    expect(panel).toContain("onSessionExit");
    expect(panel).toContain("keepAlive");
    expect(panel).toContain("closeBoundSession");
    expect(panel).toContain("isUnavailableSession");
    expect(panel).not.toContain("process exited");
    expect(panel).toContain(
      "padding: var(--ui-workspace-explorer-content-padding, 0.5rem)",
    );
    expect(panel).toContain(".terminal-panel--empty");
    expect(panel).toContain("square-terminal");
    expect(wrap).toContain("resolveTerminalHostTheme");
    expect(wrap).toContain('kind: "ghostty"');
    expect(wrap).toContain("FIT_RESIZE_DEBOUNCE_MS");
    expect(wrap).toContain("writeChunked");
    expect(wrap).toContain("isRangeError");
    expect(wrap).toContain("lastSize");
    expect(panel).toContain("sendResize");
    expect(panel).toContain("lastSent");
    expect(panel).toContain("fitted");
    expect(panel).not.toContain("resize(boundSessionId, 80, 24)");
    expect(ghostty).toContain("resolveTerminalHostTheme");
    expect(ghostty).not.toContain("theme: {}");
    expect(panel).toContain("plugin.createRenderer()");
    expect(panel).not.toContain("fallbackStatus");
  });

  it("closes the owning leaf when the bound session exits", () => {
    const view = readFileSync(resolve(sourceRoot, "terminal-view.ts"), "utf8");
    expect(view).toContain("onSessionExit");
    expect(view).toContain("this.leaf.detach()");
    expect(view).toContain("requestSaveLayout");
    expect(view).toContain("close-terminal-session");
    expect(view).toContain("square-terminal");
  });
});
