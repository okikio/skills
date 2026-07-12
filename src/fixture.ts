import { copy, ensureDir } from "@std/fs";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  relative,
  resolve,
} from "@std/path";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const fixtureRoot = join(root, "evals", "fixtures");

function resolveFixture(name: string): string {
  const source = resolve(fixtureRoot, name);
  const relation = relative(resolve(fixtureRoot), source);
  if (relation.startsWith("..")) {
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
  await ensureDir(target);
  await copy(source, target, { overwrite: false });
  return target;
}
