import { readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile("source.json", "utf8"));
const output = `${JSON.stringify(source)}\n`;
await writeFile("generated.json", output);
