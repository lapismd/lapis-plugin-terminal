import {
  Plugin,
  type App,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { registerTerminalSettings } from "./register-terminal-settings";
import { createGhosttyRenderer } from "./renderers/ghostty-engine";
import type { TerminalRenderer, TerminalRendererFactory } from "./renderers/terminal-renderer";
import {
  createFakeTerminalSessionClient,
  createHostTerminalSessionClient,
  type TerminalSessionClient,
} from "./terminal-session-client";
import {
  createTerminalSettingsStore,
  type TerminalPluginSettings,
} from "./terminal-settings";
import { TerminalView } from "./terminal-view";
import { TERMINAL_PLUGIN_ID, TERMINAL_VIEW_TYPE } from "./terminal-view-type";

const MANIFEST: PluginManifest = {
  id: TERMINAL_PLUGIN_ID,
  name: "Terminal",
  version: "0.1.0",
  minAppVersion: "0.0.1",
  description: "Interactive shell sessions in the workspace bottom panel.",
  author: "Lapis Notes",
};

export class TerminalPlugin extends Plugin {
  #sessions: TerminalSessionClient;
  #settingsStore = createTerminalSettingsStore();
  #rendererFactory: TerminalRendererFactory = createGhosttyRenderer;
  #hostListeners = new Set<() => void>();
  #hostGeneration = 0;

  constructor(
    app: App,
    pluginManifest: PluginManifest = MANIFEST,
    sessions?: TerminalSessionClient,
  ) {
    super(app, pluginManifest);
    this.#sessions = sessions ?? createHostTerminalSessionClient();
  }

  get sessions(): TerminalSessionClient {
    return this.#sessions;
  }

  get hostGeneration(): number {
    return this.#hostGeneration;
  }

  getSettings(): TerminalPluginSettings {
    return { ...this.#settingsStore.settings };
  }

  onHostChange(listener: () => void): () => void {
    this.#hostListeners.add(listener);
    return () => {
      this.#hostListeners.delete(listener);
    };
  }

  refreshHostSessions(): void {
    this.#hostGeneration += 1;
    for (const listener of this.#hostListeners) listener();
  }

  async updateSettings(patch: Partial<TerminalPluginSettings>): Promise<void> {
    this.#settingsStore.replace({
      ...this.#settingsStore.settings,
      ...patch,
    });
    await this.saveData(this.#settingsStore.settings);
  }

  createRenderer(): Promise<TerminalRenderer> {
    return this.#rendererFactory();
  }

  useFakeSessions(): void {
    this.#sessions = createFakeTerminalSessionClient();
  }

  useTestRenderer(factory: TerminalRendererFactory): void {
    this.#rendererFactory = factory;
  }

  async onload(): Promise<void> {
    this.#settingsStore.hydrate(await this.loadData());
    registerTerminalSettings(this);
    this.registerView(
      TERMINAL_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TerminalView(leaf, this),
      {
        kind: "command",
        command: {
          id: "open-terminal",
          name: "Open Terminal",
          callback: () => void this.openTerminal(),
        },
      },
    );
    this.addCommand({
      id: "new",
      name: "New Terminal",
      callback: () => void this.createTerminal(),
    });
    this.addRibbonIcon("square-terminal", "Open Terminal", () => {
      void this.openTerminal();
    });
    this.app.workspace.onLayoutReady(() => {
      void this.seedDefaultTerminal();
    });
  }

  async openTerminal(): Promise<WorkspaceLeaf> {
    const existing = this.app.workspace.getLeavesOfType(TERMINAL_VIEW_TYPE)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      this.app.workspace.setBottomPanelOpen(true);
      return existing;
    }
    return this.createTerminal();
  }

  async createTerminal(): Promise<WorkspaceLeaf> {
    const leaf = this.app.workspace.getBottomLeaf();
    await leaf.setViewState({ type: TERMINAL_VIEW_TYPE, state: {} });
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  private async seedDefaultTerminal(): Promise<void> {
    if (this.app.workspace.getLeavesOfType(TERMINAL_VIEW_TYPE).length > 0) {
      return;
    }
    await this.createTerminal();
  }
}

export default TerminalPlugin;
