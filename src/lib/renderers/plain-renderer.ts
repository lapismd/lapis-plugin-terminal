import type { TerminalRenderer, TerminalRendererSize } from "./terminal-renderer";

export function createPlainRenderer(): TerminalRenderer {
  const dataListeners = new Set<(data: string) => void>();
  const resizeListeners = new Set<(size: TerminalRendererSize) => void>();
  let host: HTMLElement | null = null;
  let output = "";

  const writeText = (bytes: string | Uint8Array): string =>
    typeof bytes === "string" ? bytes : new TextDecoder().decode(bytes);

  return {
    kind: "plain",
    mount(element) {
      host = element;
      element.textContent = output;
    },
    dispose() {
      host = null;
      dataListeners.clear();
      resizeListeners.clear();
    },
    write(bytes) {
      output += writeText(bytes);
      if (host) host.textContent = output;
    },
    resize(cols, rows) {
      for (const listener of resizeListeners) listener({ cols, rows });
    },
    onData(listener) {
      dataListeners.add(listener);
      return () => {
        dataListeners.delete(listener);
      };
    },
    onResize(listener) {
      resizeListeners.add(listener);
      return () => {
        resizeListeners.delete(listener);
      };
    },
  };
}
