import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { TerminalPlugin } from "./terminal-plugin";
import {
  DEFAULT_TERMINAL_RENDERER,
  TERMINAL_RENDERER_SETTING_ID,
  parseTerminalRendererId,
} from "./terminal-settings";

export function registerTerminalSettings(plugin: TerminalPlugin & Plugin): void {
  let binding: ReturnType<typeof getWorkspaceHostBinding>;
  try {
    binding = getWorkspaceHostBinding(plugin.app.workspace);
  } catch {
    return;
  }
  if (!binding) return;

  const controller = binding.controller;
  const settings = plugin.getSettings();

  plugin.register(
    controller.registerSettingsSection({
      id: "terminal",
      title: "Terminal",
      description: "Interactive shell renderer.",
      icon: "terminal",
      order: 45,
      navigationGroupId: "core-plugins",
      sourcePluginId: plugin.id,
      fields: [
        {
          id: TERMINAL_RENDERER_SETTING_ID,
          type: "enum" as const,
          title: "Renderer",
          description:
            "Ghostty WASM is the default. xterm.js is the explicit and fallback engine.",
          default: DEFAULT_TERMINAL_RENDERER,
          options: [
            { value: "ghostty", label: "Ghostty" },
            { value: "xterm", label: "xterm.js" },
          ],
        },
      ],
    }),
  );
  controller.settings.update(TERMINAL_RENDERER_SETTING_ID, settings.renderer);

  const changeRef = controller.settings.on("change", (event) => {
    if (event.id !== TERMINAL_RENDERER_SETTING_ID) return;
    const value = parseTerminalRendererId(
      controller.settings.getSnapshot().values[TERMINAL_RENDERER_SETTING_ID],
    );
    void plugin.updateSettings({ renderer: value });
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
