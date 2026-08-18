import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { TerminalPlugin } from "./terminal-plugin";
import TerminalPanel from "./terminal-panel.svelte";
import { TERMINAL_VIEW_TYPE } from "./terminal-view-type";

export class TerminalView extends View {
  private component: Record<string, unknown> | null = null;
  #sessionId: string | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: TerminalPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return TERMINAL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Terminal";
  }

  getIcon(): string {
    return "terminal";
  }

  getState(): Record<string, unknown> {
    return { sessionId: this.#sessionId };
  }

  async setState(
    state: Record<string, unknown>,
    result?: Parameters<View["setState"]>[1],
  ): Promise<void> {
    this.#sessionId = typeof state.sessionId === "string" ? state.sessionId : null;
    await super.setState(state, result);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.component = mount(TerminalPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        plugin: this.plugin,
        sessionId: this.#sessionId,
        onSessionId: (sessionId: string | null) => {
          this.#sessionId = sessionId;
        },
      },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}
