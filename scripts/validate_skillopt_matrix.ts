import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CapabilityRecordType,
  CapabilityRegistrySchema,
  EvalCaseFileSchema,
  type EvalCaseType,
} from "../src/corpus.ts";
import { walkFiles } from "../src/files.ts";
import * as command from "../src/command.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Bound simultaneous Deno processes while each skill owns its export paths. */
const MAX_SKILL_LANES = 4;

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
      "--node-modules-dir=none",
      "--config",
      join(root, "deno.json"),
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
  if (
    result.success && !result.timedOut &&
    !result.stdoutTruncated && !result.stderrTruncated
  ) return;
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
    ["--allow-read", "--allow-write", "--allow-env=LOG_TOKENS,LOG_STREAM"],
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

const referenceLanes = [...referencesBySkill.entries()];
for (
  let offset = 0;
  offset < referenceLanes.length;
  offset += MAX_SKILL_LANES
) {
  await Promise.all(
    referenceLanes.slice(offset, offset + MAX_SKILL_LANES).map(
      async ([skill, items]) => {
        for (const [, reference] of items) {
          await exportAndVerify(skill, "optimize", reference);
          await exportAndVerify(skill, "evaluate", reference);
        }
      },
    ),
  );
}

const skills: string[] = [];
for await (const entry of Deno.readDir(join(root, "skills"))) {
  if (entry.isDirectory) skills.push(entry.name);
}
skills.sort();
for (let offset = 0; offset < skills.length; offset += MAX_SKILL_LANES) {
  await Promise.all(
    skills.slice(offset, offset + MAX_SKILL_LANES).map(async (skill) => {
      await exportAndVerify(skill, "optimize");
      await exportAndVerify(skill, "evaluate");
      await exportAndVerify(skill, "release");
    }),
  );
}

const cases: EvalCaseType[] = [];
for await (const path of walkFiles(join(root, "evals", "cases"))) {
  if (!path.endsWith(".json")) continue;
  cases.push(
    ...EvalCaseFileSchema.parse(
      JSON.parse(await Deno.readTextFile(path)),
    ).cases,
  );
}
const frozenCompositions = cases.filter((item) =>
  item.skill === "composition" && item.split === "test-frozen"
);
const topologies = [
  ...Map.groupBy(
    frozenCompositions,
    (item) =>
      [...new Set([...item.expectedSkills, ...item.forbiddenSkills])].sort()
        .join(
          "\0",
        ),
  ).entries(),
].sort(([left], [right]) => left.localeCompare(right));
let primaryCount = 0;
for (const [key, items] of topologies) {
  // Each positive primary is needed when cases share a topology but route differently.
  const targets = [...new Set(items.flatMap((item) => item.expectedSkills))]
    .sort();
  for (const target of targets) {
    const companions = key.split("\0").filter((skill) => skill !== target);
    await exportAndVerify(target, "release", undefined, companions);
    primaryCount++;
  }
}

console.log(
  `Validated ${references.length} capability references, ${skills.length} root routers, and ${topologies.length} frozen composition topologies across ${primaryCount} positive primaries.`,
);
