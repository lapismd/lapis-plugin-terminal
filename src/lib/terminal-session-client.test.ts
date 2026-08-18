import { describe, expect, it } from "vitest";
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
});
