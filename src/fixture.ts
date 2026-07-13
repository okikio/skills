import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { copyDirectory } from "./files.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = join(root, "evals", "fixtures");

function resolveFixture(name: string): string {
  const source = resolve(fixtureRoot, name);
  const relation = relative(resolve(fixtureRoot), source);
  if (relation === ".." || relation.startsWith("../") || isAbsolute(relation)) {
    throw new Error("Fixture name escapes fixture root");
  }
  return source;
}

/**
 * Copies a pinned fixture into a disposable directory.
 *
 * Evaluation must never let one rollout observe changes from another. The
 * caller owns the returned directory and must remove it in a finally block.
 */
export async function prepareFixture(name: string): Promise<string> {
  const source = resolveFixture(name);
  const target = await Deno.makeTempDir({
    prefix: `skills-${basename(name)}-`,
  });
  await copyDirectory(source, target);
  return target;
}
