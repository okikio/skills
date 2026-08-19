import { join } from "node:path";

/**
 * Yields ordinary files below `root` in deterministic lexical order.
 *
 * Directories are traversed recursively. Symbolic links and other filesystem
 * entry kinds are not yielded, which keeps exported workspace digests tied to
 * the ordinary files the repository explicitly copies and verifies.
 */
export async function* walkFiles(root: string): AsyncGenerator<string> {
  const entries = [];
  for await (const entry of Deno.readDir(root)) entries.push(entry);
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory) yield* walkFiles(path);
    else if (entry.isFile) yield path;
  }
}

/**
 * Copies one directory tree without following symbolic links.
 *
 * The destination can already exist. Callers that require an atomic snapshot
 * must create an isolated destination first and own cleanup when this function
 * fails after copying only part of the tree.
 */
export async function copyDirectory(
  source: string,
  destination: string,
): Promise<void> {
  await Deno.mkdir(destination, { recursive: true });
  const entries = [];
  for await (const entry of Deno.readDir(source)) entries.push(entry);
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const input = join(source, entry.name);
    const output = join(destination, entry.name);
    if (entry.isDirectory) await copyDirectory(input, output);
    else if (entry.isFile) await Deno.copyFile(input, output);
    else throw new Error(`Refusing to copy non-file entry: ${input}`);
  }
}
