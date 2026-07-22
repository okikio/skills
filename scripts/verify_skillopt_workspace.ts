import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringArgument } from "../src/args.ts";
import { SkillOptWorkspaceSchema } from "../src/eval_schema.ts";
import { walkFiles } from "../src/files.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = stringArgument("workspace");
if (!input) throw new Error("Pass --workspace <workspace.json>");
const manifestPath = resolve(root, input);
const relativeManifest = relative(root, manifestPath);
if (isAbsolute(relativeManifest) || relativeManifest.startsWith("..")) {
  throw new Error("Workspace manifest must remain inside the repository");
}
const workspaceRoot = dirname(manifestPath);
const workspace = SkillOptWorkspaceSchema.parse(
  JSON.parse(await Deno.readTextFile(manifestPath)),
);

const encoder = new TextEncoder();
async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const failures: string[] = [];
const immutable = new Set(workspace.immutablePaths);
const mutable = new Set(workspace.mutablePaths);
if (immutable.size !== workspace.immutablePaths.length) {
  failures.push("immutablePaths contains duplicates");
}
for (const path of mutable) {
  if (immutable.has(path)) failures.push(`${path}: both mutable and immutable`);
  try {
    await Deno.stat(join(workspaceRoot, path));
  } catch {
    failures.push(`${path}: mutable path is missing`);
  }
}
for (const path of immutable) {
  const expected = workspace.immutableDigests[path];
  if (!expected) {
    failures.push(`${path}: immutable digest is missing`);
    continue;
  }
  try {
    const actual = await digest(
      await Deno.readTextFile(join(workspaceRoot, path)),
    );
    if (actual !== expected) {
      failures.push(`${path}: immutable content changed`);
    }
  } catch (error) {
    failures.push(`${path}: cannot verify immutable content: ${error}`);
  }
}
for (const path of Object.keys(workspace.immutableDigests)) {
  if (!immutable.has(path)) failures.push(`${path}: unowned immutable digest`);
}

for (const tree of ["candidate/skills", "companions/skills"]) {
  const path = join(workspaceRoot, tree);
  try {
    for await (const file of walkFiles(path)) {
      const workspacePath = relative(workspaceRoot, file);
      if (!immutable.has(workspacePath) && !mutable.has(workspacePath)) {
        failures.push(`${workspacePath}: unregistered skill file`);
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  Deno.exit(1);
}
console.log(
  `Verified ${immutable.size} immutable and ${mutable.size} mutable skill paths.`,
);
