import type { TerminalRenderer } from "./terminal-renderer";
import { wrapXtermLikeRenderer, type XtermLikeTerminal } from "./wrap-xterm-like";

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
    theme: {},
  });
  return wrapXtermLikeRenderer(
    "ghostty",
    terminal as unknown as XtermLikeTerminal,
    new FitAddon(),
  );
}
