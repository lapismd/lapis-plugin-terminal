import type {
  TerminalSessionClient,
  TerminalSessionSummary,
} from "./terminal-session-client";

export const TERMINAL_SESSION_OWNER = Symbol("terminal-view-session-owner");
type Options = Parameters<TerminalSessionClient["create"]>[0];

/** One View owns creation; transient renderer mounts only attach to its PTY. */
export class TerminalSessionOwner {
  #id: string | null = null;
  #pending: Promise<TerminalSessionSummary> | null = null;
  #closed = false;
  constructor(
    private readonly sessions: TerminalSessionClient,
    private readonly changed: (id: string | null) => void = () => {},
  ) {}
  get sessionId(): string | null {
    return this.#id;
  }
  get closed(): boolean {
    return this.#closed;
  }
  restore(id: string): void {
    if (!this.#id && !this.#pending) this.#id = id;
  }
  forget(id: string | null): void {
    if (this.#id === id) {
      this.#id = null;
      this.changed(null);
    }
  }
  acquire(options: Options): Promise<TerminalSessionSummary> {
    if (this.#closed) return Promise.reject(Error("Terminal view is closed"));
    if (this.#pending) return this.#pending;
    if (this.#id) return Promise.resolve({ sessionId: this.#id });
    const pending = this.sessions
      .create(options)
      .then(async (session) => {
        this.#id = session.sessionId;
        if (this.#closed) throw Error("Terminal view is closed");
        this.changed(this.#id);
        return session;
      })
      .finally(() => {
        if (this.#pending === pending) this.#pending = null;
      });
    this.#pending = pending;
    return pending;
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.#pending?.catch(() => {});
    const id = this.#id;
    this.#id = null;
    this.changed(null);
    if (id) await this.sessions.stop(id);
  }
}
