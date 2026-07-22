import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapabilityRegistrySchema,
  type EvalCase,
  EvalCaseFileSchema,
} from "../src/eval_schema.ts";
import { walkFiles } from "../src/files.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();

async function runScript(
  script: string,
  permissions: string[],
  args: string[],
): Promise<void> {
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=manual",
      ...permissions,
      join(root, "scripts", script),
      ...args,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (output.success) return;
  const stdout = decoder.decode(output.stdout).trim();
  const stderr = decoder.decode(output.stderr).trim();
  throw new Error(
    [
      `${script} ${args.join(" ")} exited ${output.code}`,
      stdout,
      stderr,
    ].filter(Boolean).join("\n"),
  );
}

async function exportAndVerify(
  skill: string,
  mode: "optimize" | "evaluate" | "release",
  reference?: string,
  companions: string[] = [],
): Promise<void> {
  const args = ["--skill", skill, "--mode", mode];
  if (reference) args.push("--reference", reference);
  for (const companion of companions) args.push("--with", companion);
  await runScript(
    "export_skillopt.ts",
    ["--allow-read", "--allow-write"],
    args,
  );
  await runScript("verify_skillopt_workspace.ts", ["--allow-read"], [
    "--workspace",
    `.skillopt/${skill}/${mode}/workspace.json`,
  ]);
}

const capabilities = CapabilityRegistrySchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, "evals", "capabilities.json"))),
);
const references = [
  ...new Set(
    capabilities.capabilities.map((item) => `${item.skill}\0${item.reference}`),
  ),
].map((item) => item.split("\0") as [string, string]).sort((a, b) =>
  a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])
);
const referencesBySkill = Map.groupBy(references, ([skill]) => skill);

await Promise.all(
  [...referencesBySkill.entries()].map(async ([skill, items]) => {
    for (const [, reference] of items) {
      await exportAndVerify(skill, "optimize", reference);
      await exportAndVerify(skill, "evaluate", reference);
    }
  }),
);

const skills: string[] = [];
for await (const entry of Deno.readDir(join(root, "skills"))) {
  if (entry.isDirectory) skills.push(entry.name);
}
skills.sort();
await Promise.all(skills.map(async (skill) => {
  await exportAndVerify(skill, "optimize");
  await exportAndVerify(skill, "evaluate");
  await exportAndVerify(skill, "release");
}));

const cases: EvalCase[] = [];
for await (const path of walkFiles(join(root, "evals", "cases"))) {
  if (!path.endsWith(".json")) continue;
  cases.push(
    ...EvalCaseFileSchema.parse(
      JSON.parse(await Deno.readTextFile(path)),
    ).cases,
  );
}
const topologies = [
  ...new Set(
    cases.filter((item) =>
      item.skill === "composition" && item.split === "test-frozen"
    ).map((item) =>
      [...new Set([...item.expectedSkills, ...item.forbiddenSkills])].sort()
        .join("\0")
    ),
  ),
].filter(Boolean).map((item) => item.split("\0"));
for (const topology of topologies) {
  const [target, ...companions] = topology;
  await exportAndVerify(target, "release", undefined, companions);
}

console.log(
  `Validated ${references.length} capability references, ${skills.length} root routers, and ${topologies.length} frozen composition topologies.`,
);
