import {
  TERMINAL_SESSION_OWNER,
  TerminalSessionOwner,
} from "./terminal-session-owner";
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { TerminalPlugin } from "./terminal-plugin";
import TerminalPanel from "./terminal-panel.svelte";
import { TERMINAL_VIEW_TYPE } from "./terminal-view-type";

export class TerminalView extends View {
  private component: Record<string, unknown> | null = null;
  #sessionId: string | null = null;
  readonly #sessionOwner: TerminalSessionOwner;
  #stopExit: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: TerminalPlugin,
  ) {
    super(leaf);
    this.#sessionOwner = new TerminalSessionOwner(plugin.sessions, (id) => {
      this.#sessionId = id;
    });
  }

  getViewType(): string {
    return TERMINAL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Terminal";
  }

  getIcon(): string {
    return "square-terminal";
  }

  getState(): Record<string, unknown> {
    return { sessionId: this.#sessionId };
  }

  async setState(
    state: Record<string, unknown>,
    result?: Parameters<View["setState"]>[1],
  ): Promise<void> {
    if (!this.#sessionId && typeof state.sessionId === "string") {
      this.#sessionId = state.sessionId;
      this.#sessionOwner.restore(state.sessionId);
    }
    await super.setState(state, result);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return this.#sessionOwner.close();
  }

  onload(): void {
    if (this.component) return;
    this.#stopExit = this.plugin.sessions.onExit((sessionId) => {
      if (sessionId === this.#sessionId) this.closeOwningLeaf();
    });
    this.component = mount(TerminalPanel, {
      target: this.containerEl,
      context: new Map([[TERMINAL_SESSION_OWNER, this.#sessionOwner]]),
      props: {
        app: this.app,
        plugin: this.plugin,
        sessionId: this.#sessionId,
        onSessionId: (sessionId: string | null) => {
          this.#sessionId = sessionId;
        },
        onSessionExit: () => {
          this.closeOwningLeaf();
        },
      },
    }) as Record<string, unknown>;
  }

  private closeOwningLeaf(): void {
    if (!this.leaf.parent) return;
    const panel = this.app.workspace.bottomPanel;
    const wasBottom = this.leaf.parent === panel;
    this.leaf.detach();
    if (wasBottom && panel.children.length === 0) {
      this.app.workspace.setBottomPanelOpen(false);
      return;
    }
    this.app.workspace.requestSaveLayout({
      source: "api",
      operation: "close-terminal-session",
    });
  }

  async onunload(): Promise<void> {
    this.#stopExit?.();
    this.#stopExit = null;
    const component = this.component;
    this.component = null;
    try {
      if (component) await unmount(component);
    } finally {
      await this.#sessionOwner.close();
    }
  }
}
