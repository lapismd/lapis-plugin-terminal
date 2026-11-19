import { resolveTerminalHostTheme } from "./host-theme";
import type { TerminalRenderer } from "./terminal-renderer";
import { wrapGhosttyRenderer, type GhosttyTerminal } from "./wrap-ghostty";

export const GHOSTTY_VT_WASM_URL = new URL(
  "../ghostty-vt.wasm",
  import.meta.url,
);

/** Presentation supplied by the embedding host; defaults retain the existing appearance. */
export type TerminalAppearanceOptions = {
  fontFamily?: string;
  fontSize?: number;
};

export async function createGhosttyRenderer(
  appearance: TerminalAppearanceOptions = {},
): Promise<TerminalRenderer> {
  const fontSize = appearance.fontSize ?? 13;
  const fontFamily =
    appearance.fontFamily ??
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  if (
    appearance.fontFamily &&
    typeof document !== "undefined" &&
    document.fonts
  ) {
    await Promise.allSettled(
      [400, 700].map((weight) =>
        document.fonts.load(`${weight} ${fontSize}px ${fontFamily}`),
      ),
    );
  }
  const { FitAddon, Ghostty, Terminal } = await import("ghostty-web");
  let ghostty;
  try {
    ghostty = await Ghostty.load();
  } catch {
    ghostty = await Ghostty.load(GHOSTTY_VT_WASM_URL.href);
  }
  const terminal = new Terminal({
    ghostty,
    cursorBlink: true,
    fontSize,
    fontFamily,
    theme: resolveTerminalHostTheme(
      typeof document !== "undefined" ? document.documentElement : null,
    ),
  });
  return wrapGhosttyRenderer(
    terminal as unknown as GhosttyTerminal,
    new FitAddon(),
  );
}
