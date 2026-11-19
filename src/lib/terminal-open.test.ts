import { describe, expect, it } from "vitest";
import type { Workspace } from "@lapis-notes/api";
import { terminalToReveal } from "./terminal-open";

function fixture(collapsed: boolean, selectedTerminal = true, count = 2) {
  const panel = { collapsed, selectedLeaf: undefined as unknown };
  const leaves = Array.from({ length: count }, () => ({ parent: panel }));
  panel.selectedLeaf = selectedTerminal ? leaves.at(-1) : {};
  const workspace = {
    bottomPanel: panel,
    getLeavesOfType: () => leaves,
  } as unknown as Workspace;
  return { workspace, leaves };
}

describe("Open Terminal destination", () => {
  it("returns to the selected terminal when the bottom panel was closed", () => {
    const f = fixture(true);
    expect(terminalToReveal(f.workspace)).toBe(f.leaves.at(-1));
  });
  it("creates a fresh terminal when a terminal is already visible", () => {
    const f = fixture(false);
    expect(terminalToReveal(f.workspace)).toBeUndefined();
  });
  it("returns to a retained terminal when another panel view is selected", () => {
    const f = fixture(false, false);
    expect(terminalToReveal(f.workspace)).toBe(f.leaves.at(-1));
  });
  it("creates a terminal when no retained terminal exists", () => {
    const f = fixture(true, false, 0);
    expect(terminalToReveal(f.workspace)).toBeUndefined();
  });
});
