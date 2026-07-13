import { parseArgs } from "@std/cli";
import { copy, ensureDir, walk } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";
import { EvalCaseFileSchema } from "../src/eval_schema.ts";

const args = parseArgs(Deno.args, {
  string: ["skill"],
  default: { skill: "deno-software" },
});
const skills = args.skill === "composition"
  ? ["deliver-software", "deno-software"]
  : [args.skill];
const root = join(dirname(fromFileUrl(import.meta.url)), "..");
for (const skill of skills) {
  try {
    await Deno.stat(join(root, "skills", skill, "SKILL.md"));
  } catch {
    throw new Error("Unknown skill: " + skill);
  }
}
const destination = join(root, ".skillopt", args.skill);
await ensureDir(join(destination, "data"));

const skillSources = await Promise.all(
  skills.map((skill) =>
    Deno.readTextFile(join(root, "skills", skill, "SKILL.md"))
  ),
);
await Deno.writeTextFile(
  join(destination, "initial.md"),
  skillSources.join("\n\n---\n\n"),
);

for (const skill of skills) {
  await copy(
    join(root, "skills", skill),
    join(destination, "skills", skill),
    { overwrite: true },
  );
}

const context: string[] = [];
for (const skill of skills) {
  for await (
    const entry of walk(join(root, "skills", skill, "references"), {
      includeDirs: false,
      match: [/\.md$/],
    })
  ) {
    context.push(
      `<!-- ${skill}/references/${entry.name} -->\n` +
        await Deno.readTextFile(entry.path),
    );
  }
}
await Deno.writeTextFile(
  join(destination, "context.md"),
  context.join("\n\n---\n\n"),
);

const caseFiles: string[] = [];
for await (
  const entry of walk(join(root, "evals", "cases"), {
    includeDirs: false,
    match: [/\.json$/],
  })
) caseFiles.push(entry.name);
const cases = (
  await Promise.all(
    caseFiles.map(async (file) =>
      EvalCaseFileSchema.parse(
        JSON.parse(
          await Deno.readTextFile(join(root, "evals/cases", file)),
        ),
      ).cases
    ),
  )
).flat();
for (
  const split of [
    "train",
    "valid-seen",
    "valid-unseen",
    "transfer",
    "adversarial",
  ] as const
) {
  const items = cases.filter((item) =>
    item.skill === args.skill && item.split === split
  );
  await Deno.writeTextFile(
    join(destination, "data", split + ".jsonl"),
    items.map((item) => JSON.stringify(item)).join("\n") + "\n",
  );
}
console.log("Exported SkillOpt workspace: " + destination);
