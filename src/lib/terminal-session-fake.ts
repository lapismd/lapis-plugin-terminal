export type TerminalSessionSummary = {
  sessionId: string;
  status?: string;
};

export type TerminalSessionClient = {
  available: boolean;
  reason: string | null;
  create(options?: {
    cols?: number;
    rows?: number;
    cwd?: string;
    shell?: string;
    workspace?: string;
  }): Promise<TerminalSessionSummary>;
  write(sessionId: string, data: string): Promise<void>;
  resize(sessionId: string, cols: number, rows: number): Promise<void>;
  stop(sessionId: string): Promise<void>;
  onOutput(listener: (sessionId: string, text: string) => void): () => void;
  onExit(listener: (sessionId: string, code: number | null) => void): () => void;
};

export function createFakeTerminalSessionClient(): TerminalSessionClient {
  const outputListeners = new Set<(sessionId: string, text: string) => void>();
  let nextId = 1;
  return {
    available: true,
    reason: null,
    async create() {
      return { sessionId: `fake-${nextId++}`, status: "running" };
    },
    async write(sessionId, data) {
      for (const listener of outputListeners) listener(sessionId, data);
    },
    async resize() {},
    async stop() {},
    onOutput(listener) {
      outputListeners.add(listener);
      return () => outputListeners.delete(listener);
    },
    onExit() {
      return () => {};
    },
  };
}
