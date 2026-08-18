import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { TerminalPlugin } from "./terminal-plugin";
import {
  DEFAULT_TERMINAL_RENDERER,
  TERMINAL_CWD_SETTING_ID,
  TERMINAL_RENDERER_SETTING_ID,
  TERMINAL_SHELL_SETTING_ID,
  parseTerminalRendererId,
} from "./terminal-settings";

const SETTING_IDS = new Set([
  TERMINAL_RENDERER_SETTING_ID,
  TERMINAL_SHELL_SETTING_ID,
  TERMINAL_CWD_SETTING_ID,
]);

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
      description: "Interactive shell renderer, start directory, and shell binary.",
      icon: "square-terminal",
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
        {
          id: TERMINAL_SHELL_SETTING_ID,
          type: "string" as const,
          title: "Shell path",
          description:
            "Absolute shell binary. Leave empty to use $SHELL or the Windows command processor.",
          default: "",
          placeholder: "/bin/zsh",
        },
        {
          id: TERMINAL_CWD_SETTING_ID,
          type: "string" as const,
          title: "Start directory",
          description:
            "Directory for new sessions. Leave empty to use the vault on desktop or the terminal-host workspace on web.",
          default: "",
          placeholder: "notes",
        },
      ],
    }),
  );
  controller.settings.update(TERMINAL_RENDERER_SETTING_ID, settings.renderer);
  controller.settings.update(TERMINAL_SHELL_SETTING_ID, settings.shell);
  controller.settings.update(TERMINAL_CWD_SETTING_ID, settings.cwd);

  const changeRef = controller.settings.on("change", (event) => {
    if (typeof event.id !== "string" || !SETTING_IDS.has(event.id)) return;
    const values = controller.settings.getSnapshot().values;
    void plugin.updateSettings({
      renderer: parseTerminalRendererId(values[TERMINAL_RENDERER_SETTING_ID]),
      shell: String(values[TERMINAL_SHELL_SETTING_ID] ?? ""),
      cwd: String(values[TERMINAL_CWD_SETTING_ID] ?? ""),
    });
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
