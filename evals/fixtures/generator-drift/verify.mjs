import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const before = await readFile("generated.json", "utf8");
const check = spawnSync(process.execPath, ["generate.mjs"], { encoding: "utf8" });
const after = await readFile("generated.json", "utf8");
if (check.status === 0) throw new Error("check mode accepted stale output");
if (after !== before) throw new Error("check mode rewrote generated output");
const write = spawnSync(process.execPath, ["generate.mjs", "--write"], { encoding: "utf8" });
if (write.status !== 0) throw new Error("write mode failed");
const finalCheck = spawnSync(process.execPath, ["generate.mjs"], { encoding: "utf8" });
if (finalCheck.status !== 0) throw new Error("second check did not converge");
