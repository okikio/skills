import { access, readFile } from "node:fs/promises";
try {
  await access("src/legacy.ts");
  throw new Error("legacy implementation remains");
} catch (error) {
  if (error?.message === "legacy implementation remains") throw error;
}
const source = await readFile("src/index.ts", "utf8");
const docs = await readFile("docs.md", "utf8");
if (/legacy/.test(source + docs)) {
  throw new Error("legacy mental model remains");
}
if (!/modern/.test(source + docs)) {
  throw new Error("modern replacement missing");
}
