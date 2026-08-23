export { TerminalPlugin, default } from "./terminal-plugin";
export { TerminalView } from "./terminal-view";
export { TERMINAL_PLUGIN_ID, TERMINAL_VIEW_TYPE } from "./terminal-view-type";
export { createHostTerminalSessionClient } from "./terminal-session-client";
export { createFakeTerminalSessionClient } from "./terminal-session-fake";
export type {
  TerminalSessionClient,
  TerminalSessionSummary,
} from "./terminal-session-fake";
export { default as TerminalPanel } from "./terminal-panel.svelte";
export { createPlainRenderer } from "./renderers/plain-renderer";
export type {
  TerminalRenderer,
  TerminalRendererFactory,
  TerminalRendererKind,
} from "./renderers/terminal-renderer";
export {
  parseTerminalPluginSettings,
} from "./terminal-settings";
export type { TerminalPluginSettings } from "./terminal-settings";
