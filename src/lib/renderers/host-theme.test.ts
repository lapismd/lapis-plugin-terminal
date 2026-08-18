import { describe, expect, it } from "vitest";
import { cssColorToHex, fallbackTerminalHostTheme } from "./host-theme";

describe("cssColorToHex", () => {
  it("keeps hex colors and expands short hex", () => {
    expect(cssColorToHex("#ffffff")).toBe("#ffffff");
    expect(cssColorToHex("#222")).toBe("#222222");
  });

  it("converts rgb colors and rejects transparent backgrounds", () => {
    expect(cssColorToHex("rgb(34, 34, 34)")).toBe("#222222");
    expect(cssColorToHex("rgba(0, 0, 0, 0)")).toBeNull();
    expect(cssColorToHex("transparent")).toBeNull();
  });
});

describe("fallbackTerminalHostTheme", () => {
  it("uses the light pair unless the root is marked dark", () => {
    expect(fallbackTerminalHostTheme()).toEqual({
      background: "#ffffff",
      foreground: "#222222",
      cursor: "#222222",
      cursorAccent: "#ffffff",
      selectionBackground: "#222222",
      selectionForeground: "#ffffff",
    });
    const dark = { className: "theme-dark", getAttribute: () => "dark" } as never;
    expect(fallbackTerminalHostTheme(dark).background).toBe("#1e1e1e");
  });
});
