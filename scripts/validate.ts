import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapabilityRegistrySchema,
  EvalCaseFileSchema,
  type EvalCaseType,
  SourceRegistrySchema,
} from "../src/corpus.ts";
import { ModelRegistrySchema } from "../src/model.ts";
import { walkFiles } from "../src/files.ts";
import { skillNames } from "../src/bundle.ts";
import {
  type GuidanceGraph,
  guidanceGraph,
  operationalSources,
  resolveReference,
  unroutedDocuments,
} from "../src/guidance.ts";
import { isOperationalDocument, referenceSource } from "../src/paths.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
const skills = new Set<string>();
const cases: EvalCaseType[] = [];
const casesById = new Map<string, EvalCaseType>();
const sourceIds = new Set<string>();
const sourceClaimPaths = new Map<string, Set<string>>();
const graphs = new Map<string, GuidanceGraph>();

for (const skill of await skillNames(root)) skills.add(skill);
for (const skill of skills) {
  try {
    const graph = await guidanceGraph(root, skill);
    graphs.set(skill, graph);
    for (const source of unroutedDocuments(graph)) {
      errors.push(`${source}: not reachable from ${skill}/SKILL.md`);
    }
  } catch (error) {
    errors.push(`${skill}: ${error}`);
  }
}
const operational = await operationalSources(root);

/** Validate a routed installed identity against its canonical source owner. */
async function checkReference(reference: string, label: string): Promise<void> {
  const skill = reference.split("/")[0];
  if (!skills.has(skill)) {
    errors.push(`${label}: unknown reference skill ${skill}`);
    return;
  }
  try {
    const source = referenceSource(reference);
    await resolveReference(root, reference);
    const graph = graphs.get(skill);
    if (graph && !graph.reachable.has(source)) {
      errors.push(
        `${label}: ${reference} is not reachable from ${skill}/SKILL.md`,
      );
    }
  } catch (error) {
    errors.push(`${label}: invalid reference ${reference}: ${error}`);
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
      await checkReference(reference, item.id);
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
    const capabilitySources = new Set<string>();
    const sourceOwners = new Map<string, string>();
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
      const routedReference = `${capability.skill}/${capability.reference}`;
      const source = referenceSource(routedReference);
      capabilitySources.add(source);
      if (!isOperationalDocument(source)) {
        errors.push(
          `${capability.id}: ${source} is supporting material, not an operational capability`,
        );
      }
      const owner = sourceOwners.get(source);
      if (owner && owner !== capability.skill) {
        errors.push(
          `${source}: capability owners disagree: ${owner}, ${capability.skill}`,
        );
      }
      sourceOwners.set(source, capability.skill);
      await checkReference(routedReference, capability.id);
      const evidence = capability.evalIds.map((id) => casesById.get(id));
      for (const split of ["train", "valid-seen"] as const) {
        if (!evidence.some((item) => item?.split === split)) {
          errors.push(`${capability.id}: missing ${split} evidence in evalIds`);
        }
      }
      if (
        !evidence.some((item) =>
          item &&
          ["valid-unseen", "transfer", "adversarial", "test-frozen"].includes(
            item.split,
          )
        )
      ) {
        errors.push(`${capability.id}: missing held-out evidence in evalIds`);
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
    const capabilitiesBySkill = new Map<string, number>();
    for (const capability of capabilities.data.capabilities) {
      capabilitiesBySkill.set(
        capability.skill,
        (capabilitiesBySkill.get(capability.skill) ?? 0) + 1,
      );
    }
    for (const skill of skills) {
      const skillCapabilities = capabilitiesBySkill.get(skill) ?? 0;
      if (skillCapabilities === 0) {
        errors.push(`${skill}: requires at least one capability record`);
      }
    }
    for (const source of operational) {
      if (!capabilitySources.has(source)) {
        errors.push(`${source}: missing capability mapping`);
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
  `Validated ${skills.size} skills, ${operational.length} operational sources, ` +
    `and ${ids.size} evaluation cases ` +
    `(${executableCases.length} executable, ${rubricCases.length} rubric-defined, ` +
    `${smokeCases.length} smoke, ${frozenCases.length} frozen), plus ` +
    `${capabilityCount} capabilities mapped to ${mappedEvalCount} evals and ` +
    `${mappedSourceCount} source claims across ${sourceIds.size} sources.`,
);
