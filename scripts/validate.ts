import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapabilityRegistrySchema,
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
const casesById = new Map<string, EvalCase>();
const sourceIds = new Set<string>();
const sourceClaimPaths = new Map<string, Set<string>>();
const skillDocuments = new Map<string, string>();

for await (const path of walkFiles(join(root, "skills"))) {
  if (!path.endsWith("SKILL.md")) continue;
  const source = await Deno.readTextFile(path);
  const directory = path.split("/").at(-2);
  if (!directory) continue;
  skills.add(directory);
  skillDocuments.set(directory, source);
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
    casesById.set(item.id, item);
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

let capabilityCount = 0;
let mappedEvalCount = 0;
let mappedSourceCount = 0;
let capabilitiesJson: unknown;
try {
  capabilitiesJson = JSON.parse(
    await Deno.readTextFile(join(root, "evals/capabilities.json")),
  );
} catch (error) {
  errors.push(`evals/capabilities.json: invalid JSON: ${error}`);
}
if (capabilitiesJson !== undefined) {
  const capabilities = CapabilityRegistrySchema.safeParse(capabilitiesJson);
  if (!capabilities.success) {
    errors.push(`evals/capabilities.json: ${capabilities.error.message}`);
  } else {
    const capabilityIds = new Set<string>();
    const capabilityReferences = new Set<string>();
    const mappedEvals = new Set<string>();
    const mappedSources = new Set<string>();
    for (const capability of capabilities.data.capabilities) {
      capabilityCount++;
      if (capabilityIds.has(capability.id)) {
        errors.push(`duplicate capability id: ${capability.id}`);
      }
      capabilityIds.add(capability.id);
      if (!skills.has(capability.skill)) {
        errors.push(`${capability.id}: unknown skill ${capability.skill}`);
      }
      const reference = join(
        root,
        "skills",
        capability.skill,
        capability.reference,
      );
      const routedReference = `${capability.skill}/${capability.reference}`;
      capabilityReferences.add(routedReference);
      try {
        await Deno.stat(reference);
      } catch {
        errors.push(
          `${capability.id}: unknown reference ${capability.reference}`,
        );
      }
      if (
        !skillDocuments.get(capability.skill)?.includes(capability.reference)
      ) {
        errors.push(
          `${capability.id}: ${capability.reference} is not routed from ` +
            `${capability.skill}/SKILL.md`,
        );
      }
      for (const evalId of capability.evalIds) {
        mappedEvals.add(evalId);
        const mappedCase = casesById.get(evalId);
        if (!mappedCase) {
          errors.push(`${capability.id}: unknown eval ${evalId}`);
        } else if (!mappedCase.requiredReferences.includes(routedReference)) {
          errors.push(
            `${capability.id}: eval ${evalId} does not require ${routedReference}`,
          );
        }
      }
      for (const sourceId of capability.sourceIds) {
        mappedSources.add(sourceId);
        const [base, ...fragmentParts] = sourceId.split(":");
        const fragment = fragmentParts.join(":");
        if (!sourceIds.has(base)) {
          errors.push(`${capability.id}: unknown source ${sourceId}`);
        } else if (fragment && !sourceClaimPaths.get(base)?.has(fragment)) {
          errors.push(
            `${capability.id}: unknown source claim path ${sourceId}`,
          );
        }
      }
    }
    for (const routedReference of capabilityReferences) {
      const referenceCases = cases.filter((item) =>
        item.requiredReferences.includes(routedReference)
      );
      for (const requiredSplit of ["train", "valid-seen"] as const) {
        if (!referenceCases.some((item) => item.split === requiredSplit)) {
          errors.push(`${routedReference}: missing ${requiredSplit} coverage`);
        }
      }
      if (
        !referenceCases.some((item) =>
          ["valid-unseen", "transfer", "adversarial", "test-frozen"].includes(
            item.split,
          )
        )
      ) {
        errors.push(`${routedReference}: missing held-out coverage`);
      }
    }
    mappedEvalCount = mappedEvals.size;
    mappedSourceCount = mappedSources.size;
  }
}

const executableAssertionKinds = new Set([
  "file-exists",
  "file-not-exists",
  "file-unchanged",
  "file-changed",
  "command",
]);
const executableCases = cases.filter((item) =>
  item.assertions.some((assertion) =>
    executableAssertionKinds.has(assertion.kind)
  )
);
const rubricCases = cases.filter((item) =>
  item.oracleStrength === "trajectory-rubric" ||
  item.oracleStrength === "mixed"
);
const smokeCases = cases.filter((item) =>
  item.oracleStrength === "routing-smoke"
);
const frozenCases = cases.filter((item) => item.split === "test-frozen");
if (executableCases.length < 10) {
  errors.push("evaluation corpus requires at least 10 executable cases");
}
if (frozenCases.length < 10) {
  errors.push("evaluation corpus requires at least 10 frozen cases");
}
for (const skill of skills) {
  const skillFrozen = frozenCases.filter((item) => item.skill === skill).length;
  if (skillFrozen < 2) {
    errors.push(`${skill}: requires at least two skill-owned frozen cases`);
  }
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
    `(${executableCases.length} executable, ${rubricCases.length} rubric-defined, ` +
    `${smokeCases.length} smoke, ${frozenCases.length} frozen), plus ` +
    `${capabilityCount} capabilities mapped to ${mappedEvalCount} evals and ` +
    `${mappedSourceCount} source claims across ${sourceIds.size} sources.`,
);
