import { readFile } from "node:fs/promises";
import process from "node:process";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
for (const name of ["browser:detect", "warc:detect", "commoncrawl:detect"]) {
  const script = pkg.scripts?.[name];
  if (!script) throw new Error(`missing documented task ${name}`);
  const path = script.replace(/^node\s+/, "");
  await import(new URL(path, `file://${process.cwd()}/`));
}
