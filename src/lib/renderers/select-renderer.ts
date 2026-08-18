import type {
  SelectedTerminalRenderer,
  TerminalRendererFactories,
  TerminalRendererId,
} from "./terminal-renderer";

export type SelectTerminalRendererOptions = TerminalRendererFactories & {
  preferred: TerminalRendererId;
};

export async function selectTerminalRenderer(
  options: SelectTerminalRendererOptions,
): Promise<SelectedTerminalRenderer> {
  if (options.preferred === "xterm") {
    const renderer = await options.createXterm();
    return { renderer, active: renderer.kind, fallbackReason: null };
  }

  try {
    const renderer = await options.createGhostty();
    return { renderer, active: renderer.kind, fallbackReason: null };
  } catch (caught) {
    const renderer = await options.createXterm();
    const detail = caught instanceof Error ? caught.message : String(caught);
    return {
      renderer,
      active: renderer.kind,
      fallbackReason: `Ghostty WASM unavailable; using xterm. ${detail}`,
    };
  }
}

export async function createDefaultGhosttyRenderer() {
  const { createGhosttyRenderer } = await import("./ghostty-engine");
  return createGhosttyRenderer();
}

export async function createDefaultXtermRenderer() {
  const { createXtermRenderer } = await import("./xterm-engine");
  return createXtermRenderer();
}

export const defaultTerminalRendererFactories: TerminalRendererFactories = {
  createGhostty: createDefaultGhosttyRenderer,
  createXterm: createDefaultXtermRenderer,
};
