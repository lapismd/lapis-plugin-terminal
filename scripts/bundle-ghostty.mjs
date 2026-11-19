import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const provenance = JSON.parse(
  await readFile(
    join(root, "patches/ghostty-web-0.4.0/provenance.json"),
    "utf8",
  ),
);
const entry = fileURLToPath(import.meta.resolve("ghostty-web"));
const packageRoot = dirname(dirname(entry));
const manifest = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
);
if (manifest.version !== provenance.version)
  throw Error(
    "Ghostty patch version changed; regenerate or remove the maintained patch",
  );
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [name, expected] of [
  ["ghostty-web-0.4.0/source.patch", provenance.sourcePatchSha256],
  ["ghostty-web@0.4.0.patch", provenance.packagePatchSha256],
]) {
  if (hash(await readFile(join(root, "patches", name))) !== expected)
    throw Error(`Maintained Ghostty patch drifted: ${name}`);
}
const esm = await readFile(entry, "utf8");
for (const name of ["ghostty-web.js", "ghostty-web.umd.cjs", "index.d.ts"]) {
  if (
    hash(await readFile(join(packageRoot, "dist", name))) !==
    provenance.artifacts[name]
  )
    throw Error(`Ghostty patch not applied or artifact drifted: ${name}`);
}
// The npm patch is textual, including the bundle's embedded WASM. Extract that
// exact verified binary rather than copying the registry's unpatched sidecar.
const embedded = [
  ...esm.matchAll(/data:application\/wasm;base64,([A-Za-z0-9+/=]+)/g),
];
if (embedded.length !== 1)
  throw Error("Expected one embedded Ghostty WASM payload");
const wasm = Buffer.from(embedded[0][1], "base64");
if (hash(wasm) !== provenance.artifacts["ghostty-vt.wasm"])
  throw Error("Ghostty JS and WASM patch provenance differ");
await mkdir(join(root, "dist/vendor"), { recursive: true });
const bundled = await build({
  entryPoints: [join(root, "src/lib/renderers/ghostty-runtime.ts")],
  outfile: join(root, "dist/renderers/ghostty-runtime.js"),
  bundle: true,
  metafile: true,
  format: "esm",
  platform: "browser",
  target: "esnext",
  banner: {
    js: "// ghostty-web 0.4.0 (MIT), maintained patch: see vendor/ghostty-web.provenance.json and vendor/ghostty-web.LICENSE",
  },
});
for (const output of Object.values(bundled.metafile.outputs)) {
  if (output.imports.length)
    throw Error("Packaged Ghostty must be self-contained");
}
await copyFile(
  join(packageRoot, "dist/index.d.ts"),
  join(root, "dist/renderers/ghostty-runtime.d.ts"),
);
await writeFile(join(root, "dist/ghostty-vt.wasm"), wasm);
await copyFile(
  join(packageRoot, "LICENSE"),
  join(root, "dist/vendor/ghostty-web.LICENSE"),
);
await writeFile(
  join(root, "dist/vendor/ghostty-web.provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
