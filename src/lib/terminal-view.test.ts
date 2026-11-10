import { expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { WorkspaceLeaf } from "@lapis-notes/api";
import { TerminalView } from "./terminal-view";
import type { TerminalPlugin } from "./terminal-plugin";
import {
  TERMINAL_SESSION_OWNER,
  type TerminalSessionOwner,
} from "./terminal-session-owner";

vi.mock("@lapis-notes/api", () => ({
  View: class {
    constructor(public leaf: WorkspaceLeaf) {}
    get app() {
      return this.leaf.app;
    }
    get containerEl() {
      return this.leaf.containerEl;
    }
  },
}));
vi.mock("svelte", () => ({
  mount: vi.fn(() => ({})),
  unmount: vi.fn(async () => {}),
}));
vi.mock("./terminal-panel.svelte", () => ({ default: {} }));

it("retires the view's PTY when layout replacement unloads it", async () => {
  const stop = vi.fn(async () => {});
  const plugin = {
    sessions: {
      create: vi.fn(async () => ({ sessionId: "owned" })),
      stop,
      onExit: vi.fn(() => vi.fn()),
    },
  } as unknown as TerminalPlugin;
  const leaf = { app: {}, containerEl: {} } as WorkspaceLeaf;
  const view = new TerminalView(leaf, plugin);
  view.onload();
  const options = vi.mocked(mount).mock.calls[0][1]!;
  const owner = options.context!.get(
    TERMINAL_SESSION_OWNER,
  ) as TerminalSessionOwner;
  await owner.acquire({});
  await view.onunload();
  expect(unmount).toHaveBeenCalledOnce();
  expect(stop).toHaveBeenCalledExactlyOnceWith("owned");
  await expect(owner.acquire({})).rejects.toThrow(/closed/);
});

it("hands a pending PTY to a replacement view on the same leaf", async () => {
  vi.mocked(mount).mockClear();
  let resolve!: (session: { sessionId: string }) => void;
  const create = vi.fn(
    () =>
      new Promise<{ sessionId: string }>((done) => {
        resolve = done;
      }),
  );
  const stop = vi.fn(async () => {});
  const plugin = {
    sessions: { create, stop, onExit: vi.fn(() => vi.fn()) },
  } as unknown as TerminalPlugin;
  const leaf = { app: {}, containerEl: {} } as WorkspaceLeaf;
  const first = new TerminalView(leaf, plugin);
  leaf.view = first;
  first.onload();
  const owner = vi
    .mocked(mount)
    .mock.calls[0][1]!.context!.get(
      TERMINAL_SESSION_OWNER,
    ) as TerminalSessionOwner;
  const pending = owner.acquire({});
  const retiring = first.onunload();
  const replacement = new TerminalView(leaf, plugin);
  leaf.view = replacement;
  replacement.onload();
  const next = vi
    .mocked(mount)
    .mock.calls[1][1]!.context!.get(
      TERMINAL_SESSION_OWNER,
    ) as TerminalSessionOwner;
  expect(next).toBe(owner);
  const attaching = next.acquire({});
  resolve({ sessionId: "retained" });
  await Promise.all([pending, attaching, retiring]);
  expect(create).toHaveBeenCalledOnce();
  expect(stop).not.toHaveBeenCalled();
  expect(replacement.getState()).toEqual({ sessionId: "retained" });
  await replacement.onunload();
  expect(stop).toHaveBeenCalledExactlyOnceWith("retained");
});
