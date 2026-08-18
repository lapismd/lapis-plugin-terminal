import { resolveTerminalHostTheme, type TerminalHostTheme } from "./host-theme";
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
  cols?: number;
  rows?: number;
  options?: { theme?: Partial<TerminalHostTheme> };
  renderer?: { setTheme?(theme: TerminalHostTheme): void };
};

export type FitLikeAddon = {
  fit(): void;
  observeResize?: () => void;
  dispose(): void;
};

export const FIT_RESIZE_DEBOUNCE_MS = 100;
const GHOSTTY_WRITE_CHUNK = 4096;

type EventSubscription = { dispose(): void } | (() => void) | void;

export function wrapXtermLikeRenderer(
  kind: Exclude<TerminalRendererKind, "plain">,
  terminal: XtermLikeTerminal,
  fit: FitLikeAddon,
): TerminalRenderer {
  const dataListeners = new Set<(data: string) => void>();
  const resizeListeners = new Set<(size: TerminalRendererSize) => void>();
  let lastSize: TerminalRendererSize | null = null;
  let opened = false;
  let disposed = false;
  const subscriptions: Array<() => void> = [];

  return {
    kind,
    mount(element) {
      if (disposed) {
        throw new Error(`${kind} renderer is disposed`);
      }
      applyHostTheme(kind, element, terminal, false);
      terminal.loadAddon(fit as never);
      terminal.open(element);
      opened = true;
      applyHostTheme(kind, element, terminal, true);
      subscriptions.push(
        subscribe(terminal.onData, (data) => {
          for (const listener of dataListeners) listener(data);
        }),
        subscribe(terminal.onResize, (size) => {
          lastSize = size;
          for (const listener of resizeListeners) listener(size);
        }),
        observeHostResize(element, () => {
          if (!disposed) fit.fit();
        }),
        observeHostTheme(kind, element, terminal),
      );
      fit.fit();
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
      if (disposed || !opened) return;
      try {
        writeChunked(terminal, bytes);
      } catch (error) {
        if (!isRangeError(error)) throw error;
      }
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
      if (lastSize) listener(lastSize);
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

function writeChunked(
  terminal: XtermLikeTerminal,
  bytes: string | Uint8Array,
): void {
  if (typeof bytes === "string") {
    if (bytes.length <= GHOSTTY_WRITE_CHUNK) {
      terminal.write(bytes);
      return;
    }
    for (let index = 0; index < bytes.length; index += GHOSTTY_WRITE_CHUNK) {
      terminal.write(bytes.slice(index, index + GHOSTTY_WRITE_CHUNK));
    }
    return;
  }
  if (bytes.byteLength <= GHOSTTY_WRITE_CHUNK) {
    terminal.write(bytes);
    return;
  }
  for (let index = 0; index < bytes.byteLength; index += GHOSTTY_WRITE_CHUNK) {
    terminal.write(bytes.subarray(index, index + GHOSTTY_WRITE_CHUNK));
  }
}

function isRangeError(error: unknown): boolean {
  return error instanceof RangeError ||
    (error instanceof Error && /offset is out of bounds/i.test(error.message));
}

function observeHostResize(element: HTMLElement, onResize: () => void): () => void {
  if (typeof ResizeObserver === "undefined") {
    return () => {};
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new ResizeObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onResize, FIT_RESIZE_DEBOUNCE_MS);
  });
  observer.observe(element);
  return () => {
    if (timer) clearTimeout(timer);
    observer.disconnect();
  };
}

function observeHostTheme(
  kind: Exclude<TerminalRendererKind, "plain">,
  element: HTMLElement,
  terminal: XtermLikeTerminal,
): () => void {
  if (typeof MutationObserver === "undefined" || !element.ownerDocument) {
    return () => {};
  }
  let lastKey = themeKey(resolveTerminalHostTheme(element));
  const apply = () => {
    const next = themeKey(resolveTerminalHostTheme(element));
    if (next === lastKey) return;
    lastKey = next;
    applyHostTheme(kind, element, terminal, true);
  };
  const observer = new MutationObserver(apply);
  observer.observe(element.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });
  return () => observer.disconnect();
}

function applyHostTheme(
  kind: Exclude<TerminalRendererKind, "plain">,
  element: HTMLElement,
  terminal: XtermLikeTerminal,
  opened: boolean,
): void {
  const theme = resolveTerminalHostTheme(element);
  if (!opened || kind !== "ghostty") {
    terminal.options ??= {};
    terminal.options.theme = {
      ...terminal.options.theme,
      ...theme,
    };
  }
  if (opened) terminal.renderer?.setTheme?.(theme);
}

function themeKey(theme: TerminalHostTheme): string {
  return `${theme.background}:${theme.foreground}`;
}
