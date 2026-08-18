import type {
  TerminalRenderer,
  TerminalRendererKind,
  TerminalRendererSize,
} from "./terminal-renderer";

export type XtermLikeTerminal = {
  open(parent: HTMLElement): void;
  write(data: string | Uint8Array, callback?: () => void): void;
  resize(cols: number, rows: number): void;
  dispose(): void;
  loadAddon(addon: { activate(terminal: never): void; dispose(): void }): void;
  onData: (listener: (data: string) => void) => EventSubscription;
  onResize: (listener: (size: TerminalRendererSize) => void) => EventSubscription;
  focus?: () => void;
};

export type FitLikeAddon = {
  fit(): void;
  observeResize?: () => void;
  dispose(): void;
};

type EventSubscription = { dispose(): void } | (() => void) | void;

export function wrapXtermLikeRenderer(
  kind: Exclude<TerminalRendererKind, "plain">,
  terminal: XtermLikeTerminal,
  fit: FitLikeAddon,
): TerminalRenderer {
  const dataListeners = new Set<(data: string) => void>();
  const resizeListeners = new Set<(size: TerminalRendererSize) => void>();
  let opened = false;
  let disposed = false;
  const subscriptions: Array<() => void> = [];

  return {
    kind,
    mount(element) {
      if (disposed) {
        throw new Error(`${kind} renderer is disposed`);
      }
      applyHostTheme(element, terminal);
      terminal.loadAddon(fit as never);
      terminal.open(element);
      opened = true;
      fit.fit();
      fit.observeResize?.();
      subscriptions.push(
        subscribe(terminal.onData, (data) => {
          for (const listener of dataListeners) listener(data);
        }),
        subscribe(terminal.onResize, (size) => {
          for (const listener of resizeListeners) listener(size);
        }),
        observeHostResize(element, () => {
          if (!disposed) fit.fit();
        }),
      );
      terminal.focus?.();
    },
    dispose() {
      disposed = true;
      for (const unsubscribe of subscriptions.splice(0)) unsubscribe();
      dataListeners.clear();
      resizeListeners.clear();
      if (opened) terminal.dispose();
      opened = false;
    },
    write(bytes) {
      if (!disposed && opened) terminal.write(bytes);
    },
    resize(cols, rows) {
      if (!disposed && opened) terminal.resize(cols, rows);
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

function subscribe<T>(
  event: (listener: (value: T) => void) => EventSubscription,
  listener: (value: T) => void,
): () => void {
  const subscription = event(listener);
  if (typeof subscription === "function") return subscription;
  if (subscription) return () => subscription.dispose();
  return () => {};
}

function observeHostResize(element: HTMLElement, onResize: () => void): () => void {
  if (typeof ResizeObserver === "undefined") {
    return () => {};
  }
  const observer = new ResizeObserver(() => onResize());
  observer.observe(element);
  return () => observer.disconnect();
}

function applyHostTheme(
  element: HTMLElement,
  terminal: XtermLikeTerminal,
): void {
  if (typeof getComputedStyle !== "function") return;
  const styles = getComputedStyle(element);
  const options = (
    terminal as XtermLikeTerminal & {
      options?: { theme?: { background?: string; foreground?: string } };
    }
  ).options;
  if (!options) return;
  options.theme = {
    ...options.theme,
    background: styles.backgroundColor || options.theme?.background,
    foreground: styles.color || options.theme?.foreground,
  };
}
