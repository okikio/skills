import { dirname, join, relative } from "node:path";
import { z } from "zod";
import { EvalCaseSchema, SkillIdSchema } from "./corpus.ts";
import { walkFiles } from "./files.ts";
import * as hash from "./hash.ts";
import * as tree from "./tree.ts";


/** Manifest contract for one exported SkillOpt optimization/evaluation tree. */
export const SkillOptWorkspaceSchema = z.strictObject({
  schemaVersion: z.literal(2),
  mode: z.enum(["optimize", "evaluate", "release"]),
  optimizationUnit: z.enum(["root-router", "reference"]),
  targetSkill: SkillIdSchema,
  targetReference: z.string().optional(),
  companionSkills: z.array(SkillIdSchema),
  mutablePaths: z.array(z.string()),
  immutablePaths: z.array(z.string()),
  immutableDigests: z.record(
    z.string(),
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  skillRevisions: z.record(
    SkillIdSchema,
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  cases: z.array(z.strictObject({
    id: z.string(),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
  })),
  caseSetDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).superRefine((value, context) => {
  if (new Set(value.companionSkills).size !== value.companionSkills.length) {
    context.addIssue({
      code: "custom",
      message: "companionSkills must be unique",
      path: ["companionSkills"],
    });
  }
  if (value.companionSkills.includes(value.targetSkill)) {
    context.addIssue({
      code: "custom",
      message: "targetSkill cannot also be a companion skill",
      path: ["companionSkills"],
    });
  }
  if (new Set(value.mutablePaths).size !== value.mutablePaths.length) {
    context.addIssue({
      code: "custom",
      message: "mutablePaths must be unique",
      path: ["mutablePaths"],
    });
  }
  if (new Set(value.immutablePaths).size !== value.immutablePaths.length) {
    context.addIssue({
      code: "custom",
      message: "immutablePaths must be unique",
      path: ["immutablePaths"],
    });
  }
  const caseIds = value.cases.map((record) => record.id);
  if (new Set(caseIds).size !== caseIds.length) {
    context.addIssue({
      code: "custom",
      message: "workspace case IDs must be unique",
      path: ["cases"],
    });
  }
  const ownedSkills = [value.targetSkill, ...value.companionSkills].sort();
  const revisionSkills = Object.keys(value.skillRevisions).sort();
  if (ownedSkills.length !== revisionSkills.length ||
    ownedSkills.some((skill, index) => skill !== revisionSkills[index])) {
    context.addIssue({
      code: "custom",
      message: "skillRevisions must describe exactly targetSkill and companionSkills",
      path: ["skillRevisions"],
    });
  }
  if (value.mode === "optimize" && value.mutablePaths.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "optimize workspaces require exactly one mutable path",
      path: ["mutablePaths"],
    });
  }
  if (value.mode !== "optimize" && value.mutablePaths.length !== 0) {
    context.addIssue({
      code: "custom",
      message: "evaluation and release workspaces must be immutable",
      path: ["mutablePaths"],
    });
  }
  if (value.optimizationUnit === "reference" && !value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "reference optimization requires targetReference",
      path: ["targetReference"],
    });
  }
  if (value.optimizationUnit === "root-router" && value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "root-router optimization cannot set targetReference",
      path: ["targetReference"],
    });
  }
});
export type SkillOptWorkspaceType = z.infer<typeof SkillOptWorkspaceSchema>;

/** Verify mutable/immutable ownership and file-level digests for skill files. */
async function verifyFiles(
  workspaceRoot: string,
  workspace: SkillOptWorkspaceType,
): Promise<string[]> {
  const failures: string[] = [];
  const immutable = new Set(workspace.immutablePaths);
  const mutable = new Set(workspace.mutablePaths);

  for (const path of mutable) {
    if (immutable.has(path)) failures.push(`${path}: both mutable and immutable`);
    try {
      await Deno.stat(join(workspaceRoot, path));
    } catch {
      failures.push(`${path}: mutable path is missing`);
    }
  }

  for (const path of immutable) {
    const expected = workspace.immutableDigests[path];
    if (!expected) {
      failures.push(`${path}: immutable digest is missing`);
      continue;
    }
    try {
      if (await hash.file(join(workspaceRoot, path)) !== expected) {
        failures.push(`${path}: immutable content changed`);
      }
    } catch (error) {
      failures.push(`${path}: cannot verify immutable content: ${error}`);
    }
  }

  for (const path of Object.keys(workspace.immutableDigests)) {
    if (!immutable.has(path)) failures.push(`${path}: unowned immutable digest`);
  }
  for (const treePath of ["candidate/skills", "companions/skills"]) {
    const path = join(workspaceRoot, treePath);
    try {
      for await (const file of walkFiles(path)) {
        const workspacePath = relative(workspaceRoot, file);
        if (!immutable.has(workspacePath) && !mutable.has(workspacePath)) {
          failures.push(`${workspacePath}: unregistered skill file`);
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return failures;
}

/** Recompute each logical skill-tree revision recorded by the export manifest. */
async function verifySkills(
  workspaceRoot: string,
  workspace: SkillOptWorkspaceType,
): Promise<string[]> {
  const failures: string[] = [];
  for (const skill of [workspace.targetSkill, ...workspace.companionSkills]) {
    const relativeRoot = skill === workspace.targetSkill
      ? join("candidate", "skills", skill)
      : join("companions", "skills", skill);
    try {
      const actual = await tree.getDigest(join(workspaceRoot, relativeRoot));
      const expected = workspace.skillRevisions[skill];
      if (!expected) failures.push(`${skill}: skill revision is missing`);
      else if (actual !== expected) failures.push(`${skill}: skill revision changed`);
    } catch (error) {
      failures.push(`${skill}: cannot verify skill revision: ${error}`);
    }
  }
  return failures;
}

/**
 * Verify that exported JSONL data contains exactly the manifest case identities.
 *
 * Case text, per-case digests, duplicate IDs, extra IDs, missing IDs, and the
 * complete set digest are all checked. This prevents an optimizer or provider
 * from changing held-out evidence while leaving the skill trees untouched.
 */
async function verifyCases(
  workspaceRoot: string,
  workspace: SkillOptWorkspaceType,
): Promise<string[]> {
  const failures: string[] = [];
  const expected = new Map(
    workspace.cases.map((record) => [record.id, record.digest]),
  );
  const observed = new Map<string, string>();
  const dataRoot = join(workspaceRoot, "data");

  try {
    for await (const path of walkFiles(dataRoot)) {
      if (!path.endsWith(".jsonl")) continue;
      for (const line of (await Deno.readTextFile(path)).split("\n")) {
        if (!line.trim()) continue;
        try {
          const item = EvalCaseSchema.parse(JSON.parse(line));
          if (observed.has(item.id)) {
            failures.push(`${item.id}: exported case appears more than once`);
            continue;
          }
          const digest = await hash.text(JSON.stringify(item));
          observed.set(item.id, digest);
          const expectedDigest = expected.get(item.id);
          if (!expectedDigest) failures.push(`${item.id}: unregistered exported case`);
          else if (digest !== expectedDigest) {
            failures.push(`${item.id}: exported case digest changed`);
          }
        } catch (error) {
          failures.push(
            `${relative(workspaceRoot, path)}: invalid exported case: ${error}`,
          );
        }
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    failures.push("data: exported case directory is missing");
  }

  for (const record of workspace.cases) {
    if (!observed.has(record.id)) failures.push(`${record.id}: exported case is missing`);
  }
  const actualSetDigest = await hash.text(
    [...observed.entries()]
      .map(([id, digest]) => `${id}:${digest}`)
      .sort()
      .join("\n"),
  );
  if (actualSetDigest !== workspace.caseSetDigest) {
    failures.push("caseSetDigest does not match exported case data");
  }
  return failures;
}

/**
 * Verifies that one SkillOpt workspace still matches its exported manifest.
 *
 * File ownership, immutable bytes, logical skill revisions, JSONL case data,
 * and the complete case-set identity are independent checks. The provider never
 * receives the workspace path, so this verifier remains outside model control.
 */
export async function verifyWorkspace(
  manifestPath: string,
): Promise<{ workspace: SkillOptWorkspaceType; failures: string[] }> {
  const workspaceRoot = dirname(manifestPath);
  const workspace = SkillOptWorkspaceSchema.parse(
    JSON.parse(await Deno.readTextFile(manifestPath)),
  );
  const groups = await Promise.all([
    verifyFiles(workspaceRoot, workspace),
    verifySkills(workspaceRoot, workspace),
    verifyCases(workspaceRoot, workspace),
  ]);
  return { workspace, failures: groups.flat() };
}
