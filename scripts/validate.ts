import { walk } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";
import { EvalCaseFileSchema, ModelRegistrySchema } from "../src/eval_schema.ts";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const errors: string[] = [];
const ids = new Set<string>();
for await (const entry of walk(join(root, "skills"), { includeDirs: false, match: [/SKILL\.md$/] })) {
  const source = await Deno.readTextFile(entry.path);
  const directory = entry.path.split("/").at(-2);
  const name = source.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = source.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== directory) errors.push(entry.path + ": name must match directory");
  if (!description || description.length > 1024) errors.push(entry.path + ": invalid description");
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|#)/.test(target)) continue;
    try { await Deno.stat(join(dirname(entry.path), target)); }
    catch { errors.push(entry.path + ": broken reference " + target); }
  }
}
for await (const entry of walk(join(root, "evals", "cases"), { includeDirs: false, match: [/\.json$/] })) {
  const parsed = EvalCaseFileSchema.safeParse(JSON.parse(await Deno.readTextFile(entry.path)));
  if (!parsed.success) { errors.push(entry.path + ": " + parsed.error.message); continue; }
  for (const item of parsed.data.cases) {
    if (ids.has(item.id)) errors.push("duplicate eval id: " + item.id);
    ids.add(item.id);
  }
}
const models = ModelRegistrySchema.safeParse(JSON.parse(await Deno.readTextFile(join(root, "evals/models.json"))));
if (!models.success) errors.push("evals/models.json: " + models.error.message);
if (errors.length) { console.error(errors.join("\n")); Deno.exit(1); }
console.log("Validated 2 skills and " + ids.size + " evaluation cases.");

