import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CapabilityRecordType,
  CapabilityRegistrySchema,
  type EvalCaseType,
  EvalCaseFileSchema,
} from "../src/corpus.ts";
import { walkFiles } from "../src/files.ts";
import * as command from "../src/command.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Run one repository script with bounded diagnostics and fail on any invalid exit. */
async function callScript(
  script: string,
  permissions: string[],
  args: string[],
): Promise<void> {
  const result = await command.call(
    Deno.execPath(),
    [
      "run",
      "--node-modules-dir=manual",
      ...permissions,
      join(root, "scripts", script),
      ...args,
    ],
    {
      cwd: root,
      timeoutMs: 120_000,
      outputBytes: 256 * 1024,
    },
  );
  if (result.success && !result.timedOut &&
    !result.stdoutTruncated && !result.stderrTruncated) return;
  const reason = result.timedOut
    ? "timed out"
    : result.stdoutTruncated || result.stderrTruncated
    ? "diagnostics exceeded 256 KiB"
    : `exited ${result.code}`;
  throw new Error(
    [
      `${script} ${args.join(" ")} ${reason}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join("\n"),
  );
}

/** Export one SkillOpt workspace and immediately verify its immutable contract. */
async function exportAndVerify(
  skill: string,
  mode: "optimize" | "evaluate" | "release",
  reference?: string,
  companions: string[] = [],
): Promise<void> {
  const args = ["--skill", skill, "--mode", mode];
  if (reference) args.push("--reference", reference);
  for (const companion of companions) args.push("--with", companion);
  await callScript(
    "export_skillopt.ts",
    ["--allow-read", "--allow-write"],
    args,
  );
  await callScript("verify_skillopt_workspace.ts", ["--allow-read"], [
    "--workspace",
    `.skillopt/${skill}/${mode}/workspace.json`,
  ]);
}

const capabilities = CapabilityRegistrySchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, "evals", "capabilities.json"))),
);
const references = [
  ...new Set<string>(
    capabilities.capabilities.map((item: CapabilityRecordType) =>
      `${item.skill}\0${item.reference}`
    ),
  ),
].map((item: string) => item.split("\0") as [string, string]).sort((a, b) =>
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

const cases: EvalCaseType[] = [];
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
