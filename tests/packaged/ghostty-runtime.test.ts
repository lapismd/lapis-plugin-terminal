import { expect, it } from "vitest";
import {
  FitAddon,
  Ghostty,
  Terminal,
} from "../../dist/renderers/ghostty-runtime.js";

for (const mode of ["embedded", "sidecar"] as const) {
  it(`ships working ${mode} WASM and viewport fixes in the packaged runtime`, async () => {
    const ghostty = await Ghostty.load(
      mode === "sidecar"
        ? new URL("../../dist/ghostty-vt.wasm", import.meta.url).href
        : undefined,
    );
    const terminal = new Terminal({
      ghostty,
      fontSize: 14,
      theme: { background: "#ffffff", foreground: "#222222" },
    });
    const element = document.createElement("div");
    element.style.cssText = "width: 493px; height: 223px";
    document.body.append(element);
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    try {
      terminal.open(element);
      fit.fit();
      const bitmap = element.querySelector("canvas")!;
      expect(bitmap.getBoundingClientRect().right).toBe(
        element.getBoundingClientRect().right,
      );
      expect(bitmap.width).toBe(Math.round(493 * devicePixelRatio));
      terminal.write("plain\x1b[48;2;255;0;0mR\x1b[0m");
      terminal.write("\x1b]10;#d4d4d4\x1b\\\x1b]11;#1e1e1e\x1b\\");
      terminal.renderer!.setTheme({
        background: "#1e1e1e",
        foreground: "#d4d4d4",
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const pixel = (x: number, y: number) => [
        ...bitmap.getContext("2d")!.getImageData(x, y, 1, 1).data,
      ];
      // Existing VT default cells and the fractional-cell viewport remainder agree.
      expect(pixel(1, 1)).toEqual([30, 30, 30, 255]);
      expect(pixel(bitmap.width - 1, bitmap.height - 1)).toEqual([
        30, 30, 30, 255,
      ]);
      const explicitCell = Math.round(
        (5 * terminal.renderer!.getMetrics().width + 1) * devicePixelRatio,
      );
      expect(pixel(explicitCell, 1)).toEqual([255, 0, 0, 255]);
    } finally {
      terminal.dispose();
      element.remove();
    }
  });
}
