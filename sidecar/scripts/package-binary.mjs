// Compiles the bundled sidecar into a standalone executable and names it with the
// Rust target triple, which is what Tauri's `externalBin` mechanism requires:
//   src-tauri/binaries/steam-sidecar-<target-triple>[.exe]
//
// Run `pnpm run bundle` first (this script assumes dist/index.cjs exists).
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const sidecarRoot = resolve(here, "..");
const outDir = resolve(sidecarRoot, "..", "src-tauri", "binaries");

// steam-crypto reads `system.pem` at load time via a __dirname-relative path.
// esbuild rewrites that __dirname to the bundle's dir, so the file must sit next
// to dist/index.cjs and be declared in package.json#pkg.assets.
function stageAssets() {
  // steam-crypto is a transitive dep of steam-user; under pnpm's strict layout it
  // is only resolvable from steam-user's own directory, not the sidecar root.
  const cryptoPkg = require.resolve("@doctormckay/steam-crypto/package.json", {
    paths: [dirname(require.resolve("steam-user/package.json"))],
  });
  copyFileSync(
    resolve(dirname(cryptoPkg), "system.pem"),
    resolve(sidecarRoot, "dist", "system.pem"),
  );
}

// Derive the Rust host target triple from `rustc`, matching how Tauri resolves it.
function targetTriple() {
  const out = execFileSync("rustc", ["-Vv"], { encoding: "utf8" });
  const host = out.split("\n").find((l) => l.startsWith("host:"));
  if (!host) throw new Error("could not read `host:` from `rustc -Vv`");
  return host.replace("host:", "").trim();
}

// Map the target triple to a @yao-pkg/pkg node target token.
function pkgTarget(triple) {
  const platform = triple.includes("windows")
    ? "win"
    : triple.includes("darwin")
      ? "macos"
      : "linux";
  const arch = triple.startsWith("aarch64") || triple.startsWith("arm64") ? "arm64" : "x64";
  return `node22-${platform}-${arch}`;
}

const triple = targetTriple();
const isWin = triple.includes("windows");
const outFile = resolve(outDir, `steam-sidecar-${triple}${isWin ? ".exe" : ""}`);

mkdirSync(outDir, { recursive: true });
stageAssets();

console.log(`[package] triple=${triple} -> ${outFile}`);
// Run pkg against the package dir (not the file) so it reads `bin` as the entry
// and `pkg.assets` for the staged system.pem.
execFileSync(
  "pnpm",
  ["exec", "pkg", ".", "--target", pkgTarget(triple), "--output", outFile],
  { stdio: "inherit", cwd: sidecarRoot },
);
console.log(`[package] done: ${outFile}`);
