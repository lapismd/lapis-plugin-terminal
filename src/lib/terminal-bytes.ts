export function decodeTerminalOutput(value: string): Uint8Array {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return new TextEncoder().encode(value);
  }
}
