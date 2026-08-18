import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import type { TerminalRenderer } from "./terminal-renderer";
import { wrapXtermLikeRenderer, type XtermLikeTerminal } from "./wrap-xterm-like";

// Keep this module in its own chunk. esbuild minify of xterm's parser breaks DECRQM.
export async function createXtermRenderer(): Promise<TerminalRenderer> {
  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    convertEol: false,
  });
  return wrapXtermLikeRenderer(
    "xterm",
    terminal as unknown as XtermLikeTerminal,
    new FitAddon(),
  );
}
