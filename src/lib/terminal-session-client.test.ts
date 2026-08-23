import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { decodeTerminalOutput } from "./terminal-bytes";
import { createFakeTerminalSessionClient } from "./terminal-session-fake";

describe("createFakeTerminalSessionClient", () => {
  it("echoes writes to output listeners", async () => {
    const client = createFakeTerminalSessionClient();
    const chunks: Uint8Array[] = [];
    const created = await client.create();
    const detach = client.onOutput((sessionId, bytes) => {
      if (sessionId === created.sessionId) chunks.push(bytes);
    });
    await client.write(created.sessionId, "pwd\n");
    expect(chunks).toHaveLength(1);
    expect(new TextDecoder().decode(chunks[0])).toBe("pwd\n");
    detach();
  });

  it("preserves arbitrary host output bytes", () => {
    const encoded = btoa(String.fromCharCode(0, 255, 195, 40));
    expect([...decodeTerminalOutput(encoded)]).toEqual([0, 255, 195, 40]);
  });

  it("re-reads the current terminal-runtime capability instead of snapshotting it", () => {
    const source = readFileSync(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "terminal-session-client.ts"),
      "utf8",
    );
    expect(source).toContain("get available()");
    expect(source).toContain("resolveHostBridge()");
    expect(source).toContain("requireLiveSession");
    expect(source).toContain("subscribeTerminalEvent");
    expect(source).toContain("onTerminalExit");
    expect(source).not.toMatch(
      /const available = hasNativeDesktopCapability\("terminal-runtime"\)/u,
    );
  });
});
