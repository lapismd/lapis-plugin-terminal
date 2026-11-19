import type { Workspace, WorkspaceLeaf } from "@lapis-notes/api";
import { TERMINAL_VIEW_TYPE } from "./terminal-view-type";

export function terminalToReveal(
  workspace: Workspace,
): WorkspaceLeaf | undefined {
  const leaves = workspace.getLeavesOfType(TERMINAL_VIEW_TYPE);
  const panel = workspace.bottomPanel;
  const selected = panel.selectedLeaf;
  const visible = leaves.some((leaf) =>
    leaf.parent === panel
      ? !panel.collapsed && selected === leaf
      : leaf.containerEl.getClientRects().length > 0,
  );
  if (visible) return undefined;
  return leaves.find((leaf) => leaf === selected) ?? leaves.at(-1);
}
