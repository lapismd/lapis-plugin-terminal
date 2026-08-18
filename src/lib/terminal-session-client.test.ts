import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createFakeTerminalSessionClient } from "./terminal-session-fake";

describe("createFakeTerminalSessionClient", () => {
  it("echoes writes to output listeners", async () => {
    const client = createFakeTerminalSessionClient();
    const chunks: string[] = [];
    const created = await client.create();
    const detach = client.onOutput((sessionId, text) => {
      if (sessionId === created.sessionId) chunks.push(text);
    });
    await client.write(created.sessionId, "pwd\n");
    expect(chunks).toEqual(["pwd\n"]);
    detach();
  });

  it("re-reads the current terminal-runtime capability instead of snapshotting it", () => {
    const source = readFileSync(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "terminal-session-client.ts"),
      "utf8",
    );
    expect(source).toContain("get available()");
    expect(source).toContain("resolveHostBridge()");
    expect(source).not.toMatch(
      /const available = hasNativeDesktopCapability\("terminal-runtime"\)/u,
    );
  });
});
