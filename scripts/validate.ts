import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type EvalCase,
  EvalCaseFileSchema,
  ModelRegistrySchema,
  SourceRegistrySchema,
} from "../src/eval_schema.ts";
import { walkFiles } from "../src/files.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
const skills = new Set<string>();
const cases: EvalCase[] = [];
const sourceIds = new Set<string>();
const sourceClaimPaths = new Map<string, Set<string>>();

for await (const path of walkFiles(join(root, "skills"))) {
  if (!path.endsWith("SKILL.md")) continue;
  const source = await Deno.readTextFile(path);
  const directory = path.split("/").at(-2);
  if (!directory) continue;
  skills.add(directory);
  const name = source.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = source.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== directory) {
    errors.push(`${path}: name must match directory`);
  }
  if (!description || description.length > 1024) {
    errors.push(`${path}: invalid description`);
  }
  try {
    await Deno.stat(join(dirname(path), "agents", "openai.yaml"));
  } catch {
    errors.push(`${path}: missing agents/openai.yaml`);
  }
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|#)/.test(target)) continue;
    try {
      await Deno.stat(join(dirname(path), target));
    } catch {
      errors.push(`${path}: broken reference ${target}`);
    }
  }
}

for await (const path of walkFiles(join(root, "evals", "cases"))) {
  if (!path.endsWith(".json")) continue;
  let json: unknown;
  try {
    json = JSON.parse(await Deno.readTextFile(path));
  } catch (error) {
    errors.push(`${path}: invalid JSON: ${error}`);
    continue;
  }
  const parsed = EvalCaseFileSchema.safeParse(json);
  if (!parsed.success) {
    errors.push(`${path}: ${parsed.error.message}`);
    continue;
  }
  for (const item of parsed.data.cases) {
    if (ids.has(item.id)) errors.push(`duplicate eval id: ${item.id}`);
    ids.add(item.id);
    cases.push(item);
    if (item.skill !== "composition" && !skills.has(item.skill)) {
      errors.push(`${item.id}: unknown target skill ${item.skill}`);
    }
    for (const skill of [...item.expectedSkills, ...item.forbiddenSkills]) {
      if (!skills.has(skill)) errors.push(`${item.id}: unknown skill ${skill}`);
    }
    for (
      const reference of [
        ...item.requiredReferences,
        ...item.forbiddenReferences,
      ]
    ) {
      const [skill, ...parts] = reference.split("/");
      if (!skills.has(skill) || parts.length === 0) continue;
      try {
        await Deno.stat(join(root, "skills", skill, ...parts));
      } catch {
        errors.push(`${item.id}: unknown reference ${reference}`);
      }
    }
    if (item.activation && item.expectedSkills.length === 0) {
      warnings.push(`${item.id}: uses legacy two-skill activation telemetry`);
    }
    if (
      item.skill === "composition" &&
      item.expectedSkills.length === 0 &&
      !item.tags.some((tag) => skills.has(tag))
    ) {
      warnings.push(
        `${item.id}: composition case is not selectable by a skill exporter`,
      );
    }
    if (
      item.oracleStrength === "routing-smoke" &&
      item.kind !== "routing" &&
      !item.tags.includes("smoke")
    ) {
      warnings.push(
        `${item.id}: non-routing case still uses routing-smoke oracle`,
      );
    }
  }
}

const models = ModelRegistrySchema.safeParse(
  JSON.parse(await Deno.readTextFile(join(root, "evals/models.json"))),
);
if (!models.success) {
  errors.push(`evals/models.json: ${models.error.message}`);
} else {
  const modelIds = new Set<string>();
  for (const model of models.data.models) {
    if (modelIds.has(model.id)) errors.push(`duplicate model id: ${model.id}`);
    modelIds.add(model.id);
  }
}

const sources = SourceRegistrySchema.safeParse(
  JSON.parse(await Deno.readTextFile(join(root, "evals/sources.json"))),
);
if (!sources.success) {
  errors.push(`evals/sources.json: ${sources.error.message}`);
} else {
  for (const source of sources.data.sources) {
    if (sourceIds.has(source.id)) {
      errors.push(`duplicate source id: ${source.id}`);
    }
    sourceIds.add(source.id);
    sourceClaimPaths.set(source.id, new Set(source.claimPaths));
  }
  for (const source of sources.data.sources) {
    if (source.duplicateOf && !sourceIds.has(source.duplicateOf)) {
      errors.push(`${source.id}: unknown duplicateOf ${source.duplicateOf}`);
    }
  }
  for (const item of cases) {
    for (const sourceId of item.sourceIds) {
      const [base, ...fragmentParts] = sourceId.split(":");
      const fragment = fragmentParts.join(":");
      if (!sourceIds.has(base)) {
        errors.push(`${item.id}: unknown source ${sourceId}`);
      } else if (
        fragment && !sourceClaimPaths.get(base)?.has(fragment)
      ) {
        errors.push(`${item.id}: unknown source claim path ${sourceId}`);
      }
    }
  }
}

const strongCases = cases.filter((item) =>
  item.oracleStrength === "fixture-behavior" || item.oracleStrength === "mixed"
);
const frozenCases = cases.filter((item) => item.split === "test-frozen");
if (strongCases.length < 10) {
  errors.push("evaluation corpus requires at least 10 strong behavioral cases");
}
if (frozenCases.length < 10) {
  errors.push("evaluation corpus requires at least 10 frozen cases");
}

if (warnings.length > 0) {
  console.warn(`${warnings.length} migration warnings; see evals/README.md.`);
}
if (errors.length > 0) {
  console.error(errors.join("\n"));
  Deno.exit(1);
}
console.log(
  `Validated ${skills.size} skills and ${ids.size} evaluation cases ` +
    `(${strongCases.length} strong, ${frozenCases.length} frozen).`,
);
