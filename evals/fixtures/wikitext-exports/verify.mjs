import { readFile } from "node:fs/promises";

const source = await readFile("consumer.ts", "utf8").catch(() => "");
if (/stringify/.test(source)) throw new Error("consumer invented missing stringify export");
