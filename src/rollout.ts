import { join } from "node:path";
import { evaluateAssertion } from "./assert.ts";
import { type EvalCaseType, EvalCaseSchema } from "./corpus.ts";
import {
  type AssertionResultType,
  type EvalResultType,
  EvalResultSchema,
} from "./evaluation.ts";
import { copyDirectory, walkFiles } from "./files.ts";
import { prepareFixture } from "./fixture.ts";
import * as hash from "./hash.ts";
import * as qualitative from "./judge.ts";
import type { ModelAdapterType } from "./model.ts";
import * as provider from "./provider.ts";
import {
  RolloutRequestSchema,
  RolloutResponseSchema,
  type RolloutResponseType,
} from "./protocol.ts";
import * as target from "./target.ts";
import * as tree from "./tree.ts";
import {
  type SkillOptWorkspaceType,
  verifyWorkspace,
} from "./workspace.ts";

/** One exported case identity stored in a SkillOpt workspace manifest. */
export interface CaseRecordType {
  readonly id: string;
  readonly digest: string;
}

/** Inputs required to evaluate one exported case against one target adapter. */
export interface EvaluateOptionsType {
  /** Manifest re-verified after the target finishes to detect repository edits. */
  readonly manifestPath: string;
  readonly workspaceRoot: string;
  readonly workspace: SkillOptWorkspaceType;
  readonly caseRecord: CaseRecordType;
  readonly evaluation: EvalCaseType;
  readonly targetModel: ModelAdapterType;
  /** Required only for rubric/mixed cases. */
  readonly judgeModel?: ModelAdapterType;
  /** Omit the target skill while retaining exported companions. */
  readonly withoutTarget: boolean;
  readonly variantId: string;
  readonly runId: string;
  readonly seed: number;
  readonly repetition: number;
}

/** Redaction-sensitive evidence returned to the CLI persistence layer. */
export interface EvidenceType {
  readonly result: EvalResultType;
  readonly trace: Record<string, unknown>;
  readonly secrets: Readonly<Record<string, string | undefined>>;
}

/** Disposable resources and immutable baseline state for one case evaluation. */
interface ResourcesType {
  readonly protocol: string;
  readonly skills: string;
  readonly fixture: string;
  readonly baseline: string;
  readonly baselineSnapshot: tree.SnapshotType;
  readonly fixtureDigestBefore: string;
  readonly installedIds: string[];
  readonly revisions: Record<string, string>;
}

/** Target-provider evidence after deterministic checks and fixture inspection. */
interface TargetEvidenceType {
  readonly call: provider.CallType<RolloutResponseType>;
  readonly response: RolloutResponseType;
  readonly assertionResults: AssertionResultType[];
  readonly changes: tree.ChangeType;
  readonly fixtureDigestAfter?: string;
  readonly errors: string[];
  readonly secrets: Readonly<Record<string, string | undefined>>;
}

/** Merge provider secret maps for structured trace redaction. */
function mergeSecrets(
  current: Readonly<Record<string, string | undefined>>,
  added: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined> {
  return { ...current, ...added };
}

/** Load one exported case and prove it still matches the workspace digest. */
export async function loadCase(
  workspaceRoot: string,
  caseId: string,
  expectedDigest: string,
): Promise<EvalCaseType> {
  for await (const path of walkFiles(join(workspaceRoot, "data"))) {
    if (!path.endsWith(".jsonl")) continue;
    for (const line of (await Deno.readTextFile(path)).split("\n")) {
      if (!line.trim()) continue;
      const item = EvalCaseSchema.parse(JSON.parse(line));
      if (item.id !== caseId) continue;
      const actual = await hash.text(JSON.stringify(item));
      if (actual !== expectedDigest) {
        throw new Error(`${caseId}: exported case digest changed`);
      }
      return item;
    }
  }
  throw new Error(`Case ${caseId} is not exported in this workspace`);
}

/**
 * Copies one candidate and its companion skills into a disposable install root.
 *
 * The caller owns the returned directory. A failed copy removes the partial
 * install before the error escapes so a provider adapter never observes residue
 * from an incomplete preparation attempt.
 */
export async function createSkills(
  workspaceRoot: string,
  targetSkill: string | undefined,
  companions: readonly string[],
): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: "skillopt-skills-" });
  try {
    await Deno.mkdir(join(root, "skills"), { recursive: true });
    if (targetSkill) {
      await copyDirectory(
        join(workspaceRoot, "candidate", "skills", targetSkill),
        join(root, "skills", targetSkill),
      );
    }
    for (const skill of companions) {
      await copyDirectory(
        join(workspaceRoot, "companions", "skills", skill),
        join(root, "skills", skill),
      );
    }
    return root;
  } catch (error) {
    try {
      await Deno.remove(root, { recursive: true });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Cannot prepare or clean skill install for ${
          targetSkill ?? "no-skill baseline"
        }`,
      );
    }
    throw error;
  }
}

/** Return a cleanup error instead of replacing an earlier rollout failure. */
export async function removeTemp(path: string): Promise<Error | undefined> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    return new Error(`Cannot remove ${path}`, { cause: error });
  }
}

/** Remove all acquired temporary paths and retain every cleanup failure. */
async function release(paths: readonly (string | undefined)[]): Promise<Error[]> {
  const errors: Error[] = [];
  for (const path of paths) {
    if (!path) continue;
    const error = await removeTemp(path);
    if (error) errors.push(error);
  }
  return errors;
}

/**
 * Acquire all temporary resources for one case or unwind every partial acquire.
 *
 * The hidden baseline is independent from the provider-visible fixture. Skill
 * revisions come from the disposable install tree, not mutable repository files.
 */
async function acquire(options: EvaluateOptionsType): Promise<ResourcesType> {
  let protocol: string | undefined;
  let skills: string | undefined;
  let fixture: string | undefined;
  let baseline: string | undefined;

  try {
    protocol = await Deno.makeTempDir({ prefix: "skillopt-protocol-" });
    skills = await createSkills(
      options.workspaceRoot,
      options.withoutTarget ? undefined : options.workspace.targetSkill,
      options.workspace.companionSkills,
    );
    fixture = options.evaluation.fixture
      ? await prepareFixture(options.evaluation.fixture)
      : await Deno.makeTempDir({ prefix: "skillopt-fixture-" });
    baseline = options.evaluation.fixture
      ? await prepareFixture(options.evaluation.fixture)
      : await Deno.makeTempDir({ prefix: "skillopt-baseline-" });

    const baselineSnapshot = await tree.snapshot(baseline);
    const fixtureDigestBefore = await tree.digest(baselineSnapshot);
    const installedIds = options.withoutTarget
      ? [...options.workspace.companionSkills]
      : [options.workspace.targetSkill, ...options.workspace.companionSkills];
    const revisions = Object.fromEntries(
      await Promise.all(installedIds.map(async (skill) => [
        skill,
        await tree.getDigest(join(skills!, "skills", skill)),
      ])),
    );
    return {
      protocol,
      skills,
      fixture,
      baseline,
      baselineSnapshot,
      fixtureDigestBefore,
      installedIds,
      revisions,
    };
  } catch (error) {
    const cleanupErrors = await release([protocol, skills, fixture, baseline]);
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "SkillOpt resource acquisition failed and cleanup also failed",
      );
    }
    throw error;
  }
}

/**
 * Invoke and validate the target before any qualitative judge can influence it.
 *
 * Deterministic assertions, fixture changes, target telemetry, and post-run
 * workspace integrity are all computed before the qualitative stage begins.
 */
async function callTarget(
  options: EvaluateOptionsType,
  resources: ResourcesType,
): Promise<TargetEvidenceType> {
  const request = RolloutRequestSchema.parse({
    schemaVersion: 1,
    kind: "rollout",
    runId: options.runId,
    caseId: options.caseRecord.id,
    prompt: options.evaluation.prompt,
    cwd: resources.fixture,
    skillsRoot: resources.skills,
    targetSkill: options.withoutTarget ? undefined : options.workspace.targetSkill,
    installedSkills: resources.installedIds.map((skill) => ({
      id: skill,
      path: join(resources.skills, "skills", skill),
      revision: resources.revisions[skill],
      role: skill === options.workspace.targetSkill ? "target" : "companion",
    })),
    seed: options.seed,
    repetition: options.repetition,
  });
  const call = await provider.call(
    options.targetModel,
    request,
    resources.protocol,
    resources.fixture,
  );
  const errors = call.error ? [call.error] : [];
  const response = call.response ?? RolloutResponseSchema.parse({
    schemaVersion: 1,
    kind: "rollout",
    model: options.targetModel.id,
    modelVersion: "unreported",
    adapterVersion: options.targetModel.adapterVersion,
    output: [call.stdout, call.stderr].filter(Boolean).join("\n"),
    error: call.error,
  });

  errors.push(...await target.check({
    response,
    installedSkills: resources.installedIds,
    skillsRoot: resources.skills,
    skillRevisions: resources.revisions,
    baselineRoot: resources.baseline,
    baselineDigest: resources.fixtureDigestBefore,
  }));

  try {
    await Deno.stat(resources.fixture);
  } catch {
    errors.push("Rollout removed the fixture root");
    await Deno.mkdir(resources.fixture, { recursive: true });
  }

  const assertionResults = await Promise.all(
    options.evaluation.assertions.map((assertion) =>
      evaluateAssertion(
        assertion,
        response.output,
        resources.fixture,
        resources.baseline,
      )
    ),
  );

  let snapshot: tree.SnapshotType;
  let fixtureDigestAfter: string | undefined;
  try {
    snapshot = await tree.snapshot(resources.fixture);
    fixtureDigestAfter = await tree.digest(snapshot);
  } catch (error) {
    snapshot = new Map();
    errors.push(`Cannot inspect rollout fixture: ${error}`);
  }
  const changes = tree.compare(resources.baselineSnapshot, snapshot);

  const postRunWorkspace = await verifyWorkspace(options.manifestPath);
  if (postRunWorkspace.failures.length > 0) {
    errors.push(
      `Workspace integrity failed: ${postRunWorkspace.failures.join("; ")}`,
    );
  }

  return {
    call,
    response,
    assertionResults,
    changes,
    fixtureDigestAfter,
    errors,
    secrets: call.secrets,
  };
}

/** Run the optional judge and assemble one normalized persisted result/trace. */
async function scoreTarget(
  options: EvaluateOptionsType,
  resources: ResourcesType,
  targetEvidence: TargetEvidenceType,
): Promise<EvidenceType> {
  const requiresJudge = options.evaluation.oracleStrength === "trajectory-rubric" ||
    options.evaluation.oracleStrength === "mixed";
  const errors = [...targetEvidence.errors];
  let secrets = { ...targetEvidence.secrets };
  const targetError = errors.length > 0 ? errors.join("; ") : undefined;
  const judgeEvaluation = requiresJudge && options.judgeModel
    ? await qualitative.evaluate({
      model: options.judgeModel,
      runId: options.runId,
      caseId: options.caseRecord.id,
      prompt: options.evaluation.prompt,
      rubric: options.evaluation.rubric,
      response: targetEvidence.response,
      changedFiles: targetEvidence.changes.changedFiles,
      assertionResults: targetEvidence.assertionResults,
      secrets,
      protocolRoot: resources.protocol,
      seed: options.seed,
      repetition: options.repetition,
      targetError,
    })
    : undefined;
  if (judgeEvaluation) {
    secrets = mergeSecrets(secrets, judgeEvaluation.secrets);
    if (judgeEvaluation.error) errors.push(judgeEvaluation.error);
  }

  const rubricResults = judgeEvaluation?.results ?? [];
  const passedAssertions = targetEvidence.assertionResults.filter((item) =>
    item.passed
  ).length;
  const passedRubrics = rubricResults.filter((item) => item.passed).length;
  const scoredChecks = targetEvidence.assertionResults.length +
    (requiresJudge ? rubricResults.length : 0);
  const passedChecks = passedAssertions + (requiresJudge ? passedRubrics : 0);
  const error = errors.length > 0 ? errors.join("; ") : undefined;
  const passed = !error &&
    passedAssertions === targetEvidence.assertionResults.length &&
    (!requiresJudge ||
      (rubricResults.length === options.evaluation.rubric.length &&
        passedRubrics === rubricResults.length));
  const judgeResponse = judgeEvaluation?.call?.response;

  const result = EvalResultSchema.parse({
    schemaVersion: 2,
    runId: options.runId,
    caseId: options.caseRecord.id,
    caseDigest: options.caseRecord.digest,
    corpusDigest: options.workspace.caseSetDigest,
    modelId: options.targetModel.id,
    host: options.targetModel.host,
    model: targetEvidence.response.model,
    modelVersion: targetEvidence.response.modelVersion,
    adapterVersion: targetEvidence.response.adapterVersion,
    judgeModelId: requiresJudge ? options.judgeModel?.id : undefined,
    judgeHost: requiresJudge ? options.judgeModel?.host : undefined,
    judgeModel: judgeResponse?.model,
    judgeModelVersion: judgeResponse?.modelVersion,
    judgeAdapterVersion: requiresJudge ? options.judgeModel?.adapterVersion : undefined,
    judgeDurationMs: judgeEvaluation?.call?.durationMs,
    variantId: options.variantId,
    targetSkill: options.workspace.targetSkill,
    installedSkills: resources.installedIds,
    activatedSkills: targetEvidence.response.activatedSkills,
    skillRevisions: resources.revisions,
    seed: options.seed,
    repetition: options.repetition,
    passed,
    score: scoredChecks === 0 ? Number(passed) : passedChecks / scoredChecks,
    durationMs: targetEvidence.call.durationMs,
    outputCharacters: targetEvidence.response.output.length,
    inputTokens: targetEvidence.response.inputTokens,
    outputTokens: targetEvidence.response.outputTokens,
    judgeInputTokens: judgeResponse?.inputTokens,
    judgeOutputTokens: judgeResponse?.outputTokens,
    toolCalls: targetEvidence.response.toolCalls.length,
    commands: targetEvidence.response.commands.length,
    referencesRead: targetEvidence.response.referencesRead,
    changedFiles: targetEvidence.changes.changedFiles,
    addedLines: targetEvidence.changes.addedLines,
    deletedLines: targetEvidence.changes.deletedLines,
    fixtureDigestBefore: resources.fixtureDigestBefore,
    fixtureDigestAfter: targetEvidence.fixtureDigestAfter,
    assertionResults: targetEvidence.assertionResults,
    rubricResults,
    error,
  });
  const trace = {
    schemaVersion: 2,
    runId: options.runId,
    target: {
      modelId: options.targetModel.id,
      stdout: targetEvidence.call.stdout,
      stderr: targetEvidence.call.stderr,
      response: targetEvidence.response,
    },
    judge: judgeEvaluation?.call
      ? {
        modelId: options.judgeModel?.id,
        stdout: judgeEvaluation.call.stdout,
        stderr: judgeEvaluation.call.stderr,
        response: judgeEvaluation.call.response,
      }
      : undefined,
  };
  return { result, trace, secrets };
}

/**
 * Evaluate one exported case and release all temporary resources it acquires.
 *
 * A primary provider/evaluator fault remains primary. Cleanup faults are added
 * through `AggregateError`; successful evaluation with cleanup failure becomes
 * an explicit invalid run instead of a silent pass.
 */
export async function evaluate(
  options: EvaluateOptionsType,
): Promise<EvidenceType> {
  const resources = await acquire(options);
  let evidence: EvidenceType | undefined;
  let primaryError: unknown;
  try {
    evidence = await scoreTarget(options, resources, await callTarget(options, resources));
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = await release([
    resources.protocol,
    resources.skills,
    resources.fixture,
    resources.baseline,
  ]);
  if (primaryError !== undefined) {
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [primaryError, ...cleanupErrors],
        "SkillOpt rollout failed and cleanup also failed",
      );
    }
    throw primaryError;
  }
  if (!evidence) throw new Error("SkillOpt rollout ended without normalized evidence");
  if (cleanupErrors.length === 0) return evidence;

  const cleanupMessages = cleanupErrors.map((error) => error.message);
  return {
    ...evidence,
    result: EvalResultSchema.parse({
      ...evidence.result,
      passed: false,
      error: [
        evidence.result.error,
        `Cleanup failed: ${cleanupMessages.join("; ")}`,
      ].filter(Boolean).join("; "),
    }),
    trace: { ...evidence.trace, cleanupErrors: cleanupMessages },
  };
}
