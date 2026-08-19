import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringArgument } from "../src/args.ts";
import { verifyWorkspace } from "../src/workspace.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = stringArgument("workspace");
if (!input) throw new Error("Pass --workspace <workspace.json>");
const manifestPath = resolve(root, input);
const relativeManifest = relative(root, manifestPath);
if (isAbsolute(relativeManifest) || relativeManifest.startsWith("..")) {
  throw new Error("Workspace manifest must remain inside the repository");
}

const { workspace, failures } = await verifyWorkspace(manifestPath);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  Deno.exit(1);
}
console.log(
  `Verified ${workspace.immutablePaths.length} immutable and ` +
    `${workspace.mutablePaths.length} mutable skill paths.`,
);
