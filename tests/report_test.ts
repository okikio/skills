import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { EvalCaseSchema } from "../src/corpus.ts";
import { EvalResultSchema, type EvalResultType } from "../src/evaluation.ts";
import * as report from "../src/report.ts";
import { SkillOptWorkspaceSchema } from "../src/workspace.ts";

/** Stable fixture digest used by the pure aggregate-report tests. */
const DIGEST = "a".repeat(64);
/** Stable installed target revision used by candidate report fixtures. */
const REVISION = "b".repeat(64);

/** Create one compact source case with explicit routing expectations. */
function caseItem(
  id: string,
  split: "valid-unseen" | "adversarial" | "test-frozen",
) {
  return EvalCaseSchema.parse({
    id,
    title: id,
    skill: "build-clis",
    kind: split === "adversarial" ? "safety" : "trajectory",
    split,
    prompt: "Review the CLI behavior and report the verified result.",
    expectedSkills: ["build-clis"],
    forbiddenSkills: ["build-web"],
    requiredReferences: ["build-clis/references/integration.md"],
    forbiddenReferences: ["build-clis/references/optique.md"],
    assertions: [{ kind: "not-contains", value: "fabricated" }],
    rubric: ["Uses verified evidence."],
    oracleStrength: "trajectory-rubric",
    tags: ["anti-hallucination", "verification"],
    rationale: "Exercises exact aggregate metric derivation.",
  });
}

/** Create one normalized rollout for a supplied case/run identity. */
function result(
  caseId: string,
  seed: number,
  repetition: number,
  overrides: Partial<EvalResultType> = {},
): EvalResultType {
  return EvalResultSchema.parse({
    schemaVersion: 2,
    runId: `${caseId}-${seed}-${repetition}`,
    caseId,
    caseDigest: DIGEST,
    corpusDigest: "c".repeat(64),
    modelId: "codex-default",
    host: "codex",
    model: "model-a",
    modelVersion: "1",
    adapterVersion: "2",
    judgeModelId: "judge-default",
    judgeHost: "claude",
    judgeModel: "judge-a",
    judgeModelVersion: "1",
    judgeAdapterVersion: "2",
    judgeDurationMs: 20,
    variantId: "candidate",
    targetSkill: "build-clis",
    installedSkills: ["build-clis"],
    activatedSkills: ["build-clis"],
    skillRevisions: { "build-clis": REVISION },
    seed,
    repetition,
    passed: true,
    score: 1,
    durationMs: 100,
    outputCharacters: 200,
    inputTokens: 50,
    outputTokens: 25,
    judgeInputTokens: 20,
    judgeOutputTokens: 10,
    toolCalls: 2,
    commands: 1,
    referencesRead: ["build-clis/references/integration.md"],
    changedFiles: [],
    addedLines: 0,
    deletedLines: 0,
    assertionResults: [{ label: "not-contains:fabricated", passed: true }],
    rubricResults: [{ index: 0, passed: true, evidence: "Verified." }],
    ...overrides,
  });
}


/** Create one compact immutable workspace used by report-topology tests. */
function workspace(overrides: Record<string, unknown> = {}) {
  return SkillOptWorkspaceSchema.parse({
    schemaVersion: 2,
    mode: "evaluate",
    optimizationUnit: "reference",
    targetSkill: "build-clis",
    targetReference: "build-clis/references/integration.md",
    companionSkills: [],
    mutablePaths: [],
    immutablePaths: [],
    immutableDigests: {},
    skillRevisions: { "build-clis": REVISION },
    cases: [{ id: "case-valid", digest: DIGEST }],
    caseSetDigest: "d".repeat(64),
    ...overrides,
  });
}

/** Create a source-case map using one workspace corpus identity. */
function cases(...items: ReturnType<typeof caseItem>[]) {
  return new Map(items.map((item) => [item.id, {
    item,
    digest: DIGEST,
    corpusDigest: "c".repeat(64),
  }]));
}

describe("SkillOpt aggregate report", () => {
  it("derives scores, routing metrics, run keys, and costs from exact results", () => {
    const sourceCases = cases(
      caseItem("case-valid", "valid-unseen"),
      caseItem("case-adversarial", "adversarial"),
    );
    const results = [
      result("case-valid", 1, 0),
      result("case-valid", 2, 1),
      result("case-adversarial", 1, 0),
      result("case-adversarial", 2, 1),
    ];
    const aggregate = report.create({
      phase: "evaluate",
      reportId: "report-a",
      createdAt: "2026-08-19T12:00:00.000Z",
      gitRevision: "git-a",
      benchmarkId: "benchmark-a",
      optimizationUnit: "root-router",
      variantRole: "candidate",
      targetSkill: "build-clis",
      targetSkillBytes: 4096,
      caseSetDigest: "d".repeat(64),
      cases: sourceCases,
      results,
    });

    expect(aggregate.metrics.taskSuccess).toEqual({ value: 1, samples: 4 });
    expect(aggregate.metrics.validUnseen).toEqual({ value: 1, samples: 2 });
    expect(aggregate.metrics.adversarial).toEqual({ value: 1, samples: 2 });
    expect(aggregate.metrics.activation.precision).toBe(1);
    expect(aggregate.metrics.activation.recall).toBe(1);
    expect(aggregate.metrics.references.precision).toBe(1);
    expect(aggregate.metrics.prohibitedOutcome?.value).toBe(0);
    expect(aggregate.runKeys).toEqual([
      { seed: 1, repetition: 0 },
      { seed: 2, repetition: 1 },
    ]);
    expect(aggregate.cost.targetSkillBytes).toBe(4096);
  });

  it("represents a no-skill baseline with a null revision and zero bytes", () => {
    const sourceCases = cases(caseItem("case-valid", "valid-unseen"));
    const noSkill = result("case-valid", 1, 0, {
      variantId: "baseline",
      installedSkills: [],
      activatedSkills: [],
      skillRevisions: {},
      referencesRead: [],
    });
    const aggregate = report.create({
      phase: "evaluate",
      reportId: "baseline-a",
      createdAt: "2026-08-19T12:00:00.000Z",
      gitRevision: "git-a",
      benchmarkId: "benchmark-a",
      optimizationUnit: "root-router",
      variantRole: "baseline",
      targetSkill: "build-clis",
      targetSkillBytes: 0,
      caseSetDigest: "d".repeat(64),
      cases: sourceCases,
      results: [noSkill],
    });

    expect(aggregate.targetSkillRevision).toBeNull();
    expect(aggregate.cost.targetSkillBytes).toBe(0);
    expect(aggregate.metrics.activation.recall).toBe(0);
  });

  it("rejects an incomplete or inconsistent run matrix", () => {
    const sourceCases = cases(
      caseItem("case-valid", "valid-unseen"),
      caseItem("case-adversarial", "adversarial"),
    );
    expect(() => report.create({
      phase: "evaluate",
      reportId: "report-a",
      createdAt: "2026-08-19T12:00:00.000Z",
      gitRevision: "git-a",
      benchmarkId: "benchmark-a",
      optimizationUnit: "root-router",
      variantRole: "candidate",
      targetSkill: "build-clis",
      targetSkillBytes: 4096,
      caseSetDigest: "d".repeat(64),
      cases: sourceCases,
      results: [
        result("case-valid", 1, 0),
        result("case-valid", 2, 1),
        result("case-adversarial", 1, 0),
      ],
    })).toThrow(/run matrix differs/);
  });

  it("rejects release workspaces with different optimization targets", () => {
    const evaluate = workspace();
    const frozen = workspace({
      mode: "release",
      targetReference: "build-clis/references/testing.md",
    });

    expect(() => report.checkWorkspaces([evaluate, frozen])).toThrow(
      /different target references/,
    );
  });

  it("requires held-out and frozen evidence in a release report", () => {
    const sourceCases = cases(caseItem("case-frozen", "test-frozen"));
    expect(() => report.create({
      phase: "release",
      reportId: "release-a",
      createdAt: "2026-08-19T12:00:00.000Z",
      gitRevision: "git-a",
      benchmarkId: "benchmark-a",
      optimizationUnit: "root-router",
      variantRole: "candidate",
      targetSkill: "build-clis",
      targetSkillBytes: 4096,
      caseSetDigest: "d".repeat(64),
      cases: sourceCases,
      results: [result("case-frozen", 1, 0)],
    })).toThrow(/valid-unseen/);
  });
});
