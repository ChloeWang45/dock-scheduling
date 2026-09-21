import { existsSync, lstatSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// OneDrive syncing node_modules causes locked-file errors during npm install
// (ENOTEMPTY, corrupted packages). This moves the real contents to a store
// outside the OneDrive-synced tree and leaves a directory junction behind,
// which npm/node treat transparently as node_modules.
if (process.platform !== "win32") {
  process.exit(0);
}

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const localNodeModules = path.join(projectRoot, "node_modules");
const externalNodeModules = path.join(
  process.env.USERPROFILE ?? "C:\\Users\\Default",
  "node_modules_store",
  "dock-scheduling",
  "node_modules",
);

if (!existsSync(localNodeModules)) {
  process.exit(0);
}

if (lstatSync(localNodeModules).isSymbolicLink()) {
  // Already a junction pointing outside OneDrive; nothing to do.
  process.exit(0);
}

console.log("Relocating node_modules out of OneDrive sync...");
rmSync(externalNodeModules, { recursive: true, force: true });
mkdirSync(path.dirname(externalNodeModules), { recursive: true });
renameSync(localNodeModules, externalNodeModules);
execSync(`cmd /c mklink /J "${localNodeModules}" "${externalNodeModules}"`, {
  stdio: "inherit",
});
console.log("node_modules now lives at " + externalNodeModules);
