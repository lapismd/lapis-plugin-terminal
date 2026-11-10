import { describe, expect, it } from "vitest";
import { wrapGhosttyRenderer, type GhosttyTerminal } from "./wrap-ghostty";

function createTerminal(writes: Array<string | Uint8Array>): GhosttyTerminal {
  return {
    open() {},
    write(data) {
      writes.push(data);
    },
    resize() {},
    dispose() {},
    loadAddon() {},
    onData: () => undefined,
    onResize: () => undefined,
  };
}

describe("wrapGhosttyRenderer", () => {
  it("keeps arbitrary bytes intact while chunking large writes", async () => {
    const writes: Array<string | Uint8Array> = [];
    const terminal = createTerminal(writes);
    const renderer = wrapGhosttyRenderer(terminal, { fit() {}, dispose() {} });
    await renderer.mount({} as HTMLElement);
    const bytes = Uint8Array.from({ length: 5_000 }, (_, index) => index % 256);
    renderer.write(bytes);
    expect(writes.map((chunk) => chunk.length)).toEqual([4_096, 904]);
    expect([...(writes[0] as Uint8Array)]).toEqual([
      ...bytes.subarray(0, 4_096),
    ]);
    expect([...(writes[1] as Uint8Array)]).toEqual([...bytes.subarray(4_096)]);
  });

  it("contains Ghostty RangeError writes", async () => {
    const terminal = createTerminal([]);
    terminal.write = () => {
      throw new RangeError("offset is out of bounds");
    };
    const renderer = wrapGhosttyRenderer(terminal, { fit() {}, dispose() {} });
    await renderer.mount({} as HTMLElement);
    expect(() => renderer.write(new Uint8Array([1]))).not.toThrow();
  });
});

describe("terminal mount focus ownership", () => {
  it("does not steal focus from another active control", async () => {
    let focused = false;
    const terminal = createTerminal([]);
    terminal.focus = () => {
      focused = true;
    };
    const control = { contains: () => false };
    const element = {
      ownerDocument: { activeElement: control, body: {} },
      contains: () => false,
    } as unknown as HTMLElement;
    await wrapGhosttyRenderer(terminal, { fit() {}, dispose() {} }).mount(
      element,
    );
    expect(focused).toBe(false);
  });
  it("focuses a terminal when the host has no competing active control", async () => {
    let focused = false;
    const terminal = createTerminal([]);
    terminal.focus = () => {
      focused = true;
    };
    const body = {};
    const element = {
      ownerDocument: { activeElement: body, body },
      contains: () => false,
    } as unknown as HTMLElement;
    await wrapGhosttyRenderer(terminal, { fit() {}, dispose() {} }).mount(
      element,
    );
    expect(focused).toBe(true);
  });
});
