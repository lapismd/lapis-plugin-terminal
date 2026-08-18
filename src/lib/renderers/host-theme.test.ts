import { describe, expect, it } from "vitest";
import { cssColorToHex } from "./host-theme";

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
