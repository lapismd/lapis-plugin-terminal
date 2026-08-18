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
export { selectTerminalRenderer } from "./renderers/select-renderer";
export type {
  SelectedTerminalRenderer,
  TerminalRenderer,
  TerminalRendererId,
  TerminalRendererKind,
} from "./renderers/terminal-renderer";
export {
  DEFAULT_TERMINAL_RENDERER,
  TERMINAL_RENDERER_SETTING_ID,
  parseTerminalPluginSettings,
} from "./terminal-settings";
export type { TerminalPluginSettings } from "./terminal-settings";
