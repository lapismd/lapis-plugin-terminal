import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
} from "@lapis-notes/api";
import type { TerminalSessionClient, TerminalSessionSummary } from "./terminal-session-fake";

export type { TerminalSessionClient, TerminalSessionSummary };
export { createFakeTerminalSessionClient } from "./terminal-session-fake";

export function createHostTerminalSessionClient(): TerminalSessionClient {
  const available = hasNativeDesktopCapability("terminal-runtime");
  const bridge = getNativeDesktopBridge();
  if (!available || !bridge) {
    return {
      available: false,
      reason:
        "Start lapis-terminal-host and set the Terminal server URL and token, or use the desktop host.",
      async create() {
        throw new Error("Terminal host is unavailable");
      },
      async write() {},
      async resize() {},
      async stop() {},
      onOutput() {
        return () => {};
      },
      onExit() {
        return () => {};
      },
    };
  }

  return {
    available: true,
    reason: null,
    create(options) {
      return bridge.invoke<TerminalSessionSummary>(
        "desktop_terminal_session_create",
        options ?? {},
      );
    },
    async write(sessionId, data) {
      await bridge.invoke("desktop_terminal_session_write", {
        sessionId,
        data: bytesToBase64(data),
      });
    },
    async resize(sessionId, cols, rows) {
      await bridge.invoke("desktop_terminal_session_resize", { sessionId, cols, rows });
    },
    async stop(sessionId) {
      await bridge.invoke("desktop_terminal_session_stop", { sessionId });
    },
    onOutput(listener) {
      const subscribe = bridge.onTerminalOutput;
      if (!subscribe) return () => {};
      return subscribe((event) => {
        listener(event.sessionId, base64ToText(event.data));
      });
    },
    onExit(listener) {
      const subscribe = bridge.onTerminalExit;
      if (!subscribe) return () => {};
      return subscribe((event) => listener(event.sessionId, event.code));
    },
  };
}

function bytesToBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function base64ToText(value: string): string {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
}
