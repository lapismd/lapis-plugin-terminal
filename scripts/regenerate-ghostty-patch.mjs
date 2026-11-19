import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, copyFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
if (args.length !== 1)
  throw Error("Usage: pnpm patch:ghostty /path/to/built/ghostty-web-checkout");
const source = resolve(args[0]);
const provenancePath = join(root, "patches/ghostty-web-0.4.0/provenance.json");
const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
const patch = await readFile(
  join(root, "patches/ghostty-web-0.4.0/source.patch"),
  "utf8",
);
const diff = execFileSync(
  "jj",
  [
    "--no-pager",
    "diff",
    "--git",
    "--from",
    provenance.baseRevision,
    "--to",
    "@",
    "--",
    "lib",
    "patches",
  ],
  { cwd: source, encoding: "utf8" },
);
if (diff !== patch)
  throw Error(
    "Built checkout differs from the maintained 0.4.0 source backport",
  );
const manifest = JSON.parse(
  await readFile(join(source, "package.json"), "utf8"),
);
if (manifest.version !== provenance.sourcePackageVersion)
  throw Error("Ghostty source package version differs");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const directory = await mkdtemp(join(tmpdir(), "lapis-ghostty-patch-"));
try {
  execFileSync(
    "pnpm",
    [
      "patch",
      "ghostty-web@0.4.0",
      "--edit-dir",
      directory,
      "--ignore-existing",
    ],
    { cwd: root, stdio: "inherit" },
  );
  for (const name of ["ghostty-web.js", "ghostty-web.umd.cjs", "index.d.ts"]) {
    await copyFile(join(source, "dist", name), join(directory, "dist", name));
    provenance.artifacts[name] = hash(
      await readFile(join(source, "dist", name)),
    );
  }
  provenance.artifacts["ghostty-vt.wasm"] = hash(
    await readFile(join(source, "dist/ghostty-vt.wasm")),
  );
  execFileSync(
    "pnpm",
    ["patch-commit", directory, "--patches-dir", "patches"],
    { cwd: root, stdio: "inherit" },
  );
  provenance.sourcePatchSha256 = hash(Buffer.from(patch));
  provenance.packagePatchSha256 = hash(
    await readFile(join(root, "patches/ghostty-web@0.4.0.patch")),
  );
  await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + "\n");
} finally {
  await rm(directory, { recursive: true, force: true });
}
