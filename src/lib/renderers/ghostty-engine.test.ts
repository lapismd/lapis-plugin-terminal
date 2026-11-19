import { afterEach, describe, expect, it, vi } from "vitest";
import { createGhosttyRenderer } from "./ghostty-engine";

const ghostty = vi.hoisted(() => ({
  init: vi.fn(async () => {}),
  load: vi.fn(async () => ({})),
  options: [] as unknown[],
}));
vi.mock("ghostty-web", () => ({
  init: ghostty.init,
  Ghostty: { load: ghostty.load },
  Terminal: class {
    constructor(options: unknown) {
      ghostty.options.push(options);
    }
  },
  FitAddon: class {},
}));
afterEach(() => {
  ghostty.options.length = 0;
  vi.unstubAllGlobals();
});

describe("host terminal appearance", () => {
  it("owns a separate Ghostty engine for each renderer", async () => {
    await createGhosttyRenderer();
    await createGhosttyRenderer();
    const options = ghostty.options as Array<{ ghostty: object }>;
    expect(options[0].ghostty).toBeDefined();
    expect(options[1].ghostty).toBeDefined();
    expect(options[0].ghostty).not.toBe(options[1].ghostty);
  });
  it("preserves the existing appearance when no host options are supplied", async () => {
    await createGhosttyRenderer();
    expect(ghostty.options[0]).toMatchObject({
      fontSize: 13,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    });
  });

  it("uses the host font and waits for regular and bold faces before fitting", async () => {
    let release!: () => void;
    const loaded = new Promise<void>((resolve) => {
      release = resolve;
    });
    const load = vi.fn(() => loaded);
    vi.stubGlobal("document", { fonts: { load }, documentElement: null });
    const creating = createGhosttyRenderer({
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
    });
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(ghostty.options).toHaveLength(0);
    release();
    await creating;
    expect(load).toHaveBeenCalledWith('400 14px "JetBrains Mono", monospace');
    expect(load).toHaveBeenCalledWith('700 14px "JetBrains Mono", monospace');
    expect(ghostty.options[0]).toMatchObject({
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
    });
  });

  it("keeps the renderer usable when a custom font cannot load", async () => {
    vi.stubGlobal("document", {
      fonts: {
        load: vi.fn(async () => {
          throw Error("Offline");
        }),
      },
      documentElement: null,
    });
    await expect(
      createGhosttyRenderer({ fontFamily: '"JetBrains Mono", monospace' }),
    ).resolves.toMatchObject({ kind: "ghostty" });
    expect(ghostty.options).toHaveLength(1);
  });
});
