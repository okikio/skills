import { join } from "node:path";

export async function* walkFiles(root: string): AsyncGenerator<string> {
  const entries = [...Deno.readDirSync(root)].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory) yield* walkFiles(path);
    else if (entry.isFile) yield path;
  }
}

export async function copyDirectory(
  source: string,
  destination: string,
): Promise<void> {
  await Deno.mkdir(destination, { recursive: true });
  const entries = [...Deno.readDirSync(source)].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  for (const entry of entries) {
    const input = join(source, entry.name);
    const output = join(destination, entry.name);
    if (entry.isDirectory) await copyDirectory(input, output);
    else if (entry.isFile) await Deno.copyFile(input, output);
    else throw new Error(`Refusing to copy non-file entry: ${input}`);
  }
}
