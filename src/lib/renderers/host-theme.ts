export type TerminalHostTheme = {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  selectionForeground: string;
};

const VIEW_BACKGROUND = "--ui-workspace-view-background";
const VIEW_FOREGROUND = "--ui-workspace-view-foreground";

export function resolveTerminalHostTheme(
  element: HTMLElement,
): TerminalHostTheme | null {
  if (typeof getComputedStyle !== "function") return null;
  const styles = getComputedStyle(element);
  const parentStyles = element.parentElement
    ? getComputedStyle(element.parentElement)
    : styles;
  const background =
    cssColorToHex(styles.getPropertyValue(VIEW_BACKGROUND)) ??
    cssColorToHex(parentStyles.getPropertyValue(VIEW_BACKGROUND)) ??
    cssColorToHex(styles.backgroundColor) ??
    cssColorToHex(parentStyles.backgroundColor);
  const foreground =
    cssColorToHex(styles.getPropertyValue(VIEW_FOREGROUND)) ??
    cssColorToHex(parentStyles.getPropertyValue(VIEW_FOREGROUND)) ??
    cssColorToHex(styles.color) ??
    cssColorToHex(parentStyles.color);
  if (!background || !foreground || background === foreground) return null;
  return {
    background,
    foreground,
    cursor: foreground,
    cursorAccent: background,
    selectionBackground: foreground,
    selectionForeground: background,
  };
}

export function cssColorToHex(value: string): string | null {
  const text = value.trim();
  if (!text || text === "transparent") return null;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(text)) {
    if (text.length === 4) {
      return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
    }
    return text;
  }
  const rgb = text.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/u,
  );
  if (rgb) {
    if (isTransparentAlpha(rgb[4])) return null;
    return toHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  }
  const modern = text.match(
    /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/u,
  );
  if (modern) {
    if (isTransparentAlpha(modern[4])) return null;
    return toHex(Number(modern[1]), Number(modern[2]), Number(modern[3]));
  }
  return canvasColorToHex(text);
}

function isTransparentAlpha(value: string | undefined): boolean {
  if (value === undefined) return false;
  const alpha = value.endsWith("%")
    ? Number(value.slice(0, -1)) / 100
    : Number(value);
  return Number.isFinite(alpha) && alpha === 0;
}

function toHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((part) => Math.round(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function canvasColorToHex(value: string): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = "#000000";
  context.fillStyle = value;
  const normalized = context.fillStyle;
  if (typeof normalized === "string" && normalized !== value) {
    const parsed = cssColorToHex(normalized);
    if (parsed) return parsed;
  }
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  if (alpha === 0) return null;
  return toHex(red, green, blue);
}
