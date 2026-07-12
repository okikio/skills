import { readFile } from "node:fs/promises";
const deno = JSON.parse(await readFile("deno.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (deno.imports?.["@acme/core"] === "workspace:*") {
  throw new Error("workspace protocol remains in deno imports");
}
if (pkg.dependencies?.["@acme/core"] !== "workspace:*") {
  throw new Error("package dependency does not own workspace protocol");
}

