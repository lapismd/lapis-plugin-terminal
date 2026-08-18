import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
} from "@lapis-notes/api";
import type { TerminalSessionClient, TerminalSessionSummary } from "./terminal-session-fake";

export type { TerminalSessionClient, TerminalSessionSummary };
export { createFakeTerminalSessionClient } from "./terminal-session-fake";

const UNAVAILABLE_REASON =
  "Start lapis-terminal-host and set the Terminal server URL and token, or use the desktop host.";

export function createHostTerminalSessionClient(): TerminalSessionClient {
  return {
    get available() {
      return resolveHostBridge() !== null;
    },
    get reason() {
      return resolveHostBridge() ? null : UNAVAILABLE_REASON;
    },
    create(options) {
      return resolveRequiredBridge().invoke<TerminalSessionSummary>(
        "desktop_terminal_session_create",
        options ?? {},
      );
    },
    async write(sessionId, data) {
      requireLiveSession(
        await resolveRequiredBridge().invoke("desktop_terminal_session_write", {
          sessionId,
          data: bytesToBase64(data),
        }),
      );
    },
    async resize(sessionId, cols, rows) {
      requireLiveSession(
        await resolveRequiredBridge().invoke("desktop_terminal_session_resize", {
          sessionId,
          cols,
          rows,
        }),
      );
    },
    async stop(sessionId) {
      await resolveRequiredBridge().invoke("desktop_terminal_session_stop", {
        sessionId,
      });
    },
    onOutput(listener) {
      return subscribeTerminalEvent("onTerminalOutput", (event) => {
        listener(event.sessionId, base64ToText(event.data));
      });
    },
    onExit(listener) {
      return subscribeTerminalEvent("onTerminalExit", (event) => {
        listener(event.sessionId, event.code);
      });
    },
  };
}

function subscribeTerminalEvent<K extends "onTerminalOutput" | "onTerminalExit">(
  method: K,
  listener: (event: { sessionId: string; data: string; code: number | null }) => void,
): () => void {
  const subscribe = resolveHostBridge()?.[method];
  if (typeof subscribe !== "function") return () => {};
  return subscribe((event) => listener(event as { sessionId: string; data: string; code: number | null }));
}

function resolveHostBridge() {
  if (!hasNativeDesktopCapability("terminal-runtime")) return null;
  return getNativeDesktopBridge();
}

function requireLiveSession(result: unknown): void {
  if (result === false) {
    throw new Error("Terminal session is unavailable");
  }
  if (
    result &&
    typeof result === "object" &&
    "ok" in result &&
    (result as { ok?: unknown }).ok === false
  ) {
    throw new Error("Terminal session is unavailable");
  }
}

function resolveRequiredBridge() {
  const bridge = resolveHostBridge();
  if (!bridge) {
    throw new Error("Terminal host is unavailable");
  }
  return bridge;
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
