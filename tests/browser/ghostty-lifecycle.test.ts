import { afterEach, expect, it, vi } from "vitest";
import { Terminal } from "ghostty-web";
import { createGhosttyRenderer } from "../../src/lib/renderers/ghostty-engine";
import type { TerminalRenderer } from "../../src/lib/renderers/terminal-renderer";

const renderers: TerminalRenderer[] = [];
const elements: HTMLElement[] = [];
afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
  for (const element of elements.splice(0)) element.remove();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

async function settle() {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

async function mount(background: string, foreground: string) {
  const element = document.createElement("div");
  element.style.cssText = "width: 480px; height: 220px";
  element.style.setProperty("--ui-workspace-view-background", background);
  element.style.setProperty("--ui-workspace-view-foreground", foreground);
  document.body.append(element);
  elements.push(element);
  const renderer = await createGhosttyRenderer({ fontSize: 14 });
  renderers.push(renderer);
  await renderer.mount(element);
  renderer.write("SERVER_OK\r\nready> ");
  await settle();
  return { element, renderer };
}

for (const [mode, background, foreground, rgb] of [
  ["light", "#ffffff", "#222222", [255, 255, 255]],
  ["dark", "#1e1e1e", "#d4d4d4", [30, 30, 30]],
] as const) {
  it(`paints the ${mode} workspace background in empty terminal cells`, async () => {
    const { element } = await mount(background, foreground);
    const canvas = element.querySelector("canvas")!;
    const pixel = canvas
      .getContext("2d")!
      .getImageData(2, canvas.height - 4, 1, 1).data;
    expect([...pixel]).toEqual([...rgb, 255]);
  });
}

it("keeps text and empty cells valid across story-style dispose and remount", async () => {
  const terminals: Terminal[] = [];
  const open = Terminal.prototype.open;
  vi.spyOn(Terminal.prototype, "open").mockImplementation(function (
    this: Terminal,
    element: HTMLElement,
  ) {
    terminals.push(this);
    open.call(this, element);
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    const { element, renderer } = await mount("#ffffff", "#222222");
    const terminal = terminals.at(-1)!;
    const lines = Array.from(
      { length: terminal.rows },
      (_, row) =>
        terminal.buffer.active.getLine(row)?.translateToString(true) ?? "",
    );
    expect(lines.join("\n")).toContain("SERVER_OK");
    for (const line of lines) expect(line).toMatch(/^[\x20-\x7e]*$/u);
    expect(lines.slice(2).every((line) => !line.trim())).toBe(true);
    renderer.dispose();
    renderers.splice(renderers.indexOf(renderer), 1);
    element.remove();
  }
});

it("keeps narrow resized transcripts clean across repeated renderer replacement", async () => {
  const terminals: Terminal[] = [];
  const open = Terminal.prototype.open;
  vi.spyOn(Terminal.prototype, "open").mockImplementation(function (
    this: Terminal,
    element: HTMLElement,
  ) {
    terminals.push(this);
    open.call(this, element);
  });
  for (let attempt = 0; attempt < 20; attempt++) {
    const { element, renderer } = await mount("#ffffff", "#222222");
    element.style.width = "394px";
    element.style.height = "184px";
    renderer.resize(44, 10);
    renderer.write(
      "\x1b[2J\x1b[HLapis Server\r\n\r\n\x1b[36m~/vaults/92b3bbf0/content\x1b[0m > ls\r\nattachments/ notes/ scripts/\r\nbackup.sh index.md Welcome.md\r\n\r\n~/vaults/92b3bbf0/content > cat missing.md\r\ncat: missing.md: No such file or directory\r\n\r\nready> ",
    );
    await settle();
    const terminal = terminals.at(-1)!;
    for (let row = 0; row < terminal.buffer.active.length; row++) {
      const line =
        terminal.buffer.active.getLine(row)?.translateToString(true) ?? "";
      expect(line).toMatch(/^[\x20-\x7e]*$/u);
    }
    renderer.dispose();
    renderers.splice(renderers.indexOf(renderer), 1);
    element.remove();
  }
});

it("updates default cell backgrounds when the owning workspace theme changes", async () => {
  const { element } = await mount("#ffffff", "#222222");
  element.style.setProperty("--ui-workspace-view-background", "#1e1e1e");
  element.style.setProperty("--ui-workspace-view-foreground", "#d4d4d4");
  document.documentElement.classList.toggle("dark");
  await settle();
  const canvas = element.querySelector("canvas")!;
  const pixel = canvas
    .getContext("2d")!
    .getImageData(2, canvas.height - 4, 1, 1).data;
  expect([...pixel]).toEqual([30, 30, 30, 255]);
});

it("fills fractional-cell space and keeps the scrollbar drawing and hit target at the right edge", async () => {
  let terminal: Terminal | undefined;
  const open = Terminal.prototype.open;
  vi.spyOn(Terminal.prototype, "open").mockImplementation(function (
    this: Terminal,
    element: HTMLElement,
  ) {
    terminal = this;
    open.call(this, element);
  });
  const { element, renderer } = await mount("#ffffff", "#222222");
  element.style.width = "493px";
  element.style.height = "223px";
  await vi.waitFor(() =>
    expect(element.querySelector("canvas")!.getBoundingClientRect().width).toBe(
      493,
    ),
  );
  const canvas = element.querySelector("canvas")!;
  expect(canvas.getBoundingClientRect().right).toBe(
    element.getBoundingClientRect().right,
  );
  expect(canvas.height).toBe(Math.round(223 * devicePixelRatio));
  expect(canvas.width).toBe(Math.round(493 * devicePixelRatio));
  const pixel = (x: number, y: number) => [
    ...canvas.getContext("2d")!.getImageData(x, y, 1, 1).data,
  ];
  expect(pixel(canvas.width - 1, canvas.height - 1)).toEqual([
    255, 255, 255, 255,
  ]);
  renderer.write(
    Array.from({ length: 60 }, (_, i) => `line ${i}\r\n`).join(""),
  );
  await settle();
  // A press at the viewport's rightmost CSS pixel belongs to the scrollbar.
  const rect = canvas.getBoundingClientRect();
  canvas.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      clientX: rect.right - 1,
      clientY: rect.top + 5,
    }),
  );
  document.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, button: 0 }),
  );
  await settle();
  expect(terminal!.getScrollbackLength()).toBeGreaterThan(0);
  expect(terminal!.getViewportY()).toBeGreaterThan(0);
  element.style.setProperty("--ui-workspace-view-background", "#1e1e1e");
  document.documentElement.classList.add("dark");
  await settle();
  expect(pixel(canvas.width - 1, canvas.height - 1)).toEqual([30, 30, 30, 255]);
});
