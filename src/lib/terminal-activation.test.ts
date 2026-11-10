import { expect, it, vi } from "vitest";
import { TerminalActivation } from "./terminal-activation";
it("ignores an old layout callback after retry and seeds once per activation", async () => {
  const owner = new TerminalActivation();
  const seed = vi.fn(async () => {});
  const report = vi.fn();
  const old = owner.begin(seed, report);
  owner.fence();
  const current = owner.begin(seed, report);
  old();
  current();
  current();
  await owner.drain();
  expect(seed).toHaveBeenCalledOnce();
  expect(report).not.toHaveBeenCalled();
});
it("fences a pending seed before waiting for its cleanup", async () => {
  const owner = new TerminalActivation();
  let release!: () => void;
  const waiting = new Promise<void>((done) => {
    release = done;
  });
  let retired = false;
  const seed = owner.begin(async (current) => {
    await waiting;
    retired = !current();
  }, vi.fn());
  seed();
  await Promise.resolve();
  owner.fence();
  let drained = false;
  const closing = owner.drain().then(() => {
    drained = true;
  });
  await Promise.resolve();
  expect(drained).toBe(false);
  release();
  await closing;
  expect(retired).toBe(true);
});
