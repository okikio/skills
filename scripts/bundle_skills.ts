import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectedArguments, stringArgument } from "../src/args.ts";
import { materializePack } from "../src/bundle.ts";

/** The authored collection remains the source for local bundles. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = stringArgument("out");
if (!output) {
  throw new Error("Pass --out <directory> for the generated skill pack");
}
const selected = collectedArguments("skill");
const results = await materializePack(
  root,
  resolve(output),
  selected.length > 0 ? selected : undefined,
  { sourceRef: stringArgument("ref", "main") },
);
console.log(
  `Bundled ${results.length} independent skills in ${resolve(output)}`,
);
for (const result of results) console.log(`${result.skill} ${result.revision}`);
