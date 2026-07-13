import { access, readFile } from "node:fs/promises";
try {
  await access("legacy.ts");
  throw new Error("legacy module remains");
} catch (error) {
  if (error?.message === "legacy module remains") throw error;
}
const registry = await readFile("registry.ts", "utf8");
const generator = await readFile("generate.mjs", "utf8");
if (/legacy/.test(registry + generator)) {
  throw new Error("generator still emits legacy path");
}
if (!/modern/.test(registry + generator)) {
  throw new Error("modern registration missing");
}
