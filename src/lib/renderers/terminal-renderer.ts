export type TerminalRendererId = "ghostty" | "xterm";

export type TerminalRendererKind = TerminalRendererId | "plain";

export type TerminalRendererSize = {
  cols: number;
  rows: number;
};

export type TerminalRenderer = {
  readonly kind: TerminalRendererKind;
  mount(element: HTMLElement): Promise<void> | void;
  dispose(): void;
  write(bytes: string | Uint8Array): void;
  resize(cols: number, rows: number): void;
  onData(listener: (data: string) => void): () => void;
  onResize(listener: (size: TerminalRendererSize) => void): () => void;
};

export type TerminalRendererFactories = {
  createGhostty: () => Promise<TerminalRenderer>;
  createXterm: () => Promise<TerminalRenderer>;
};

export type SelectedTerminalRenderer = {
  renderer: TerminalRenderer;
  active: TerminalRendererKind;
  fallbackReason: string | null;
};
