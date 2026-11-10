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
  readonly #sessionOwner: TerminalSessionOwner;
  #transferred = false;
  #stopExit: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: TerminalPlugin,
  ) {
    const previous =
      leaf.view instanceof TerminalView &&
      leaf.view.plugin === plugin &&
      !leaf.view.#sessionOwner.closed
        ? leaf.view
        : null;
    super(leaf);
    this.#sessionOwner = previous
      ? previous.#sessionOwner
      : new TerminalSessionOwner(plugin.sessions);
    if (previous) previous.#transferred = true;
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
    return { sessionId: this.#sessionOwner.sessionId };
  }

  async setState(
    state: Record<string, unknown>,
    result?: Parameters<View["setState"]>[1],
  ): Promise<void> {
    if (typeof state.sessionId === "string") {
      this.#sessionOwner.restore(state.sessionId);
    }
    await super.setState(state, result);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return this.#transferred ? Promise.resolve() : this.#sessionOwner.close();
  }

  onload(): void {
    if (this.component) return;
    this.#stopExit = this.plugin.sessions.onExit((sessionId) => {
      if (sessionId === this.#sessionOwner.sessionId) this.closeOwningLeaf();
    });
    this.component = mount(TerminalPanel, {
      target: this.containerEl,
      context: new Map([[TERMINAL_SESSION_OWNER, this.#sessionOwner]]),
      props: {
        app: this.app,
        plugin: this.plugin,
        sessionId: this.#sessionOwner.sessionId,
        onSessionId: (sessionId: string | null) => {
          if (sessionId) this.#sessionOwner.restore(sessionId);
          else this.#sessionOwner.forget(this.#sessionOwner.sessionId);
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
      // WorkspaceLeaf replaces its View synchronously. Give the replacement
      // constructor a turn to claim this owner before retiring its shell.
      await Promise.resolve();
      if (!this.#transferred) await this.#sessionOwner.close();
    }
  }
}
