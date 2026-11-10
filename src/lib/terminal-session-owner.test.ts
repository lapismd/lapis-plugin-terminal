import { expect, it, vi } from "vitest";
import { TerminalSessionOwner } from "./terminal-session-owner";
import type { TerminalSessionClient } from "./terminal-session-client";
it("reuses one pending PTY across panel remounts", async () => {
  let resolve!: (value: { sessionId: string }) => void;
  const create = vi.fn(
    () =>
      new Promise<{ sessionId: string }>((done) => {
        resolve = done;
      }),
  );
  const sessions = {
    create,
    stop: vi.fn(async () => {}),
  } as unknown as TerminalSessionClient;
  const changed = vi.fn();
  const owner = new TerminalSessionOwner(sessions, changed);
  const first = owner.acquire({ cols: 80, rows: 24 });
  const second = owner.acquire({ cols: 100, rows: 30 });
  expect(create).toHaveBeenCalledTimes(1);
  resolve({ sessionId: "owned" });
  expect(await first).toEqual(await second);
  expect(changed).toHaveBeenCalledWith("owned");
  await owner.close();
  expect(sessions.stop).toHaveBeenCalledWith("owned");
});
it("retires a PTY whose creation completes after its view closes", async () => {
  let resolve!: (value: { sessionId: string }) => void;
  const stop = vi.fn(async () => {});
  const sessions = {
    create: () =>
      new Promise<{ sessionId: string }>((done) => {
        resolve = done;
      }),
    stop,
  } as unknown as TerminalSessionClient;
  const owner = new TerminalSessionOwner(sessions, vi.fn());
  const creating = owner.acquire({});
  const closing = owner.close();
  resolve({ sessionId: "late" });
  await expect(creating).rejects.toThrow(/closed/);
  await closing;
  expect(stop).toHaveBeenCalledWith("late");
  await expect(owner.acquire({})).rejects.toThrow(/closed/);
});
