import type { EvalCaseType } from "./corpus.ts";
import type { EvalResultType } from "./evaluation.ts";
import type { SkillOptWorkspaceType } from "./workspace.ts";
import * as measure from "./measure.ts";
import {
  AggregateReportSchema,
  type AggregateReportType,
  type RunKeyType,
} from "./aggregate.ts";

/** Case metadata retained with the digest exported into a SkillOpt workspace. */
export interface ReportCaseType {
  readonly item: EvalCaseType;
  readonly digest: string;
  /** Workspace case-set digest that this exact case was rolled out from. */
  readonly corpusDigest: string;
}

/** Metadata and exact rollout evidence required to create one aggregate report. */
export interface CreateOptionsType {
  readonly phase: "evaluate" | "release";
  readonly reportId: string;
  readonly createdAt: string;
  readonly gitRevision: string;
  readonly benchmarkId: string;
  readonly optimizationUnit: "root-router" | "reference";
  readonly targetReference?: string;
  readonly variantRole: "baseline" | "candidate";
  readonly targetSkill: string;
  readonly targetSkillBytes: number;
  /** SHA-256 identity of the exact case-id/case-digest set. */
  readonly caseSetDigest: string;
  readonly cases: ReadonlyMap<string, ReportCaseType>;
  readonly results: readonly EvalResultType[];
}

/** Stable ordering for one seed/repetition identity. */
function compareRunKey(left: RunKeyType, right: RunKeyType): number {
  return left.seed - right.seed || left.repetition - right.repetition;
}

/** Stable string identity for one seed/repetition pair. */
function getRunId(value: RunKeyType): string {
  return `${value.seed}:${value.repetition}`;
}

/** Require every rollout in the report to preserve one identity field. */
function getOne<T>(
  values: readonly T[],
  label: string,
  equal: (left: T, right: T) => boolean = Object.is,
): T {
  const [first, ...rest] = values;
  if (first === undefined) throw new Error(`Report has no ${label}`);
  if (rest.some((value) => !equal(first, value))) {
    throw new Error(`Report mixes different ${label} values`);
  }
  return first;
}

/** Compare sorted string arrays as one installed-skill topology. */
function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

/**
 * Prove that workspaces can contribute to one aggregate benchmark report.
 *
 * A release report combines an evaluate workspace with one frozen release
 * workspace. They must describe the same optimization target, companions, and
 * immutable skill revisions. Otherwise one report would silently aggregate
 * different candidate artifacts or optimization scopes.
 */
export function checkWorkspaces(
  workspaces: readonly SkillOptWorkspaceType[],
): void {
  const first = workspaces[0];
  if (!first) throw new Error("Report requires at least one workspace");
  const companions = [...first.companionSkills].sort();

  for (const workspace of workspaces.slice(1)) {
    if (workspace.targetSkill !== first.targetSkill) {
      throw new Error("Report workspaces target different skills");
    }
    if (!sameStrings([...workspace.companionSkills].sort(), companions)) {
      throw new Error("Report workspaces use different companion-skill topologies");
    }
    if (workspace.optimizationUnit !== first.optimizationUnit) {
      throw new Error("Report workspaces use different optimization units");
    }
    if (workspace.targetReference !== first.targetReference) {
      throw new Error("Report workspaces use different target references");
    }
    for (const skill of [first.targetSkill, ...companions]) {
      if (workspace.skillRevisions[skill] !== first.skillRevisions[skill]) {
        throw new Error(`Report workspaces use different ${skill} revisions`);
      }
    }
  }
}

/** Compare revision maps after their keys have been normalized by the caller. */
function sameRevisions(
  left: Readonly<Record<string, string>>,
  right: Readonly<Record<string, string>>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return sameStrings(leftKeys, rightKeys) &&
    leftKeys.every((key) => left[key] === right[key]);
}

/** Ensure every exported case has the same exact run matrix. */
function getRunKeys(
  results: readonly EvalResultType[],
  caseIds: readonly string[],
): RunKeyType[] {
  let expected: RunKeyType[] | undefined;
  for (const caseId of caseIds) {
    const seen = new Set<string>();
    const keys = results
      .filter((result) => result.caseId === caseId)
      .map((result) => ({ seed: result.seed, repetition: result.repetition }))
      .sort(compareRunKey);
    for (const key of keys) {
      const id = getRunId(key);
      if (seen.has(id)) throw new Error(`${caseId}: duplicate run key ${id}`);
      seen.add(id);
    }
    if (keys.length === 0) throw new Error(`${caseId}: no rollout results`);
    if (!expected) {
      expected = keys;
      continue;
    }
    if (
      expected.length !== keys.length ||
      expected.some((key, index) => getRunId(key) !== getRunId(keys[index]!))
    ) {
      throw new Error(`${caseId}: run matrix differs from other report cases`);
    }
  }
  if (!expected) throw new Error("Report has no case run matrix");
  return expected;
}

/** Return complete observed judge identity only when every judged run supplied it. */
function getJudgeIdentity(results: readonly EvalResultType[]) {
  const judged = results.filter((result) => result.judgeModelId !== undefined);
  if (judged.length === 0) return {};

  const judgeModelId = getOne(
    judged.map((result) => result.judgeModelId!),
    "judgeModelId",
  );
  const judgeHost = getOne(
    judged.map((result) => result.judgeHost!),
    "judgeHost",
  );
  const judgeAdapterVersion = getOne(
    judged.map((result) => result.judgeAdapterVersion!),
    "judgeAdapterVersion",
  );
  const observedModels = judged.flatMap((result) =>
    result.judgeModel === undefined ? [] : [result.judgeModel]
  );
  const observedVersions = judged.flatMap((result) =>
    result.judgeModelVersion === undefined ? [] : [result.judgeModelVersion]
  );
  return {
    judgeModelId,
    judgeHost,
    judgeAdapterVersion,
    judgeModel: observedModels.length === judged.length
      ? getOne(observedModels, "judgeModel")
      : undefined,
    judgeModelVersion: observedVersions.length === judged.length
      ? getOne(observedVersions, "judgeModelVersion")
      : undefined,
  };
}

/**
 * Create one paired-comparison report from exact exported cases and rollouts.
 *
 * Every source case must be present and every case must use the same seed and
 * repetition matrix. Model identity, installed topology, skill revisions, and
 * variant identity are also required to remain constant across all rollouts.
 */
export function create(options: CreateOptionsType): AggregateReportType {
  if (options.results.length === 0) throw new Error("Report has no rollout results");
  if (options.cases.size === 0) throw new Error("Report has no exported cases");
  if (!Number.isInteger(options.targetSkillBytes) || options.targetSkillBytes < 0) {
    throw new Error("targetSkillBytes must be a non-negative integer");
  }

  const caseIds = [...options.cases.keys()].sort();
  const actualCaseIds = [...new Set(options.results.map((result) => result.caseId))]
    .sort();
  if (!sameStrings(caseIds, actualCaseIds)) {
    throw new Error("Report results do not cover the exact exported case set");
  }
  for (const result of options.results) {
    const record = options.cases.get(result.caseId)!;
    if (result.caseDigest !== record.digest) {
      throw new Error(`${result.caseId}: result case digest does not match export`);
    }
    if (result.corpusDigest !== record.corpusDigest) {
      throw new Error(`${result.caseId}: result corpus digest does not match export`);
    }
    if (result.targetSkill !== options.targetSkill) {
      throw new Error(`${result.caseId}: result target skill does not match report`);
    }
  }

  const installedSkills = getOne(
    options.results.map((result) => [...result.installedSkills].sort()),
    "installed skill topology",
    sameStrings,
  );
  const installedSkillRevisions = getOne(
    options.results.map((result) => Object.fromEntries(
      Object.entries(result.skillRevisions).sort(([left], [right]) =>
        left.localeCompare(right)
      ),
    )),
    "installed skill revisions",
    sameRevisions,
  );
  if (
    Object.keys(installedSkillRevisions).sort().join("\n") !==
      installedSkills.join("\n")
  ) {
    throw new Error("Installed skill revisions do not match installed skill topology");
  }
  const targetInstalled = installedSkills.includes(options.targetSkill);
  const targetSkillRevision = targetInstalled
    ? installedSkillRevisions[options.targetSkill] ?? null
    : null;
  if (targetInstalled && !targetSkillRevision) {
    throw new Error("Installed target skill has no revision");
  }
  if (!targetInstalled && options.targetSkillBytes !== 0) {
    throw new Error("No-skill variants must report zero target-skill bytes");
  }
  if (targetInstalled && options.targetSkillBytes === 0) {
    throw new Error("Installed target skill cannot have zero target-skill bytes");
  }

  const metrics = measure.getMetrics(options.results, options.cases);
  if (options.phase === "release" && !metrics.frozen) {
    throw new Error("Release report requires at least one frozen case");
  }
  if (options.phase === "evaluate" && metrics.frozen) {
    throw new Error("Evaluate report cannot include frozen cases");
  }

  return AggregateReportSchema.parse({
    schemaVersion: 4,
    phase: options.phase,
    reportId: options.reportId,
    createdAt: options.createdAt,
    gitRevision: options.gitRevision,
    benchmarkId: options.benchmarkId,
    optimizationUnit: options.optimizationUnit,
    targetSkill: options.targetSkill,
    targetReference: options.targetReference,
    targetSkillRevision,
    modelId: getOne(options.results.map((result) => result.modelId), "modelId"),
    host: getOne(options.results.map((result) => result.host), "host"),
    model: getOne(options.results.map((result) => result.model), "model"),
    modelVersion: getOne(
      options.results.map((result) => result.modelVersion),
      "modelVersion",
    ),
    adapterVersion: getOne(
      options.results.map((result) => result.adapterVersion),
      "adapterVersion",
    ),
    ...getJudgeIdentity(options.results),
    variantRole: options.variantRole,
    variantId: getOne(
      options.results.map((result) => result.variantId),
      "variantId",
    ),
    installedSkills,
    installedSkillRevisions,
    caseSetDigest: options.caseSetDigest,
    caseIds,
    runKeys: getRunKeys(options.results, caseIds),
    runCount: options.results.length,
    metrics,
    cost: measure.getCost(options.results, options.targetSkillBytes),
  });
}
