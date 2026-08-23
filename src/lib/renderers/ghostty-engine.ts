import { resolveTerminalHostTheme } from "./host-theme";
import type { TerminalRenderer } from "./terminal-renderer";
import { wrapGhosttyRenderer, type GhosttyTerminal } from "./wrap-ghostty";

export const GHOSTTY_VT_WASM_URL = new URL("../ghostty-vt.wasm", import.meta.url);

export async function createGhosttyRenderer(): Promise<TerminalRenderer> {
  const { FitAddon, Ghostty, Terminal, init } = await import("ghostty-web");
  try {
    await init();
  } catch {
    await Ghostty.load(GHOSTTY_VT_WASM_URL.href);
  }
  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    theme: resolveTerminalHostTheme(
      typeof document !== "undefined" ? document.documentElement : null,
    ),
  });
  return wrapGhosttyRenderer(terminal as unknown as GhosttyTerminal, new FitAddon());
}
