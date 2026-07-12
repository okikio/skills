import { parseArgs } from "@std/cli";
import { copy, ensureDir } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";
import { EvalCaseFileSchema } from "../src/eval_schema.ts";

const args = parseArgs(Deno.args, { string: ["skill"], default: { skill: "deno-software" } });
if (!["deno-software", "deliver-software"].includes(args.skill)) throw new Error("Unknown skill");
const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const destination = join(root, ".skillopt", args.skill);
await ensureDir(join(destination, "data"));
await copy(join(root, "skills", args.skill, "SKILL.md"), join(destination, "initial.md"), { overwrite: true });
const parsed = EvalCaseFileSchema.parse(JSON.parse(await Deno.readTextFile(join(root, "evals/cases/core.json"))));
for (const split of ["train", "valid-seen", "valid-unseen", "transfer", "adversarial", "test-frozen"] as const) {
  const items = parsed.cases.filter((item) => item.skill === args.skill && item.split === split);
  await Deno.writeTextFile(join(destination, "data", split + ".jsonl"), items.map((item) => JSON.stringify(item)).join("\n") + "\n");
}
console.log("Exported SkillOpt workspace: " + destination);

