import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const wasmSource = require.resolve("ghostty-web/ghostty-vt.wasm");
const destDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
mkdirSync(destDir, { recursive: true });
copyFileSync(wasmSource, join(destDir, "ghostty-vt.wasm"));
