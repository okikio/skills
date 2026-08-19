import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root used to invoke the real SkillOpt gate script. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Build one normalized score/rate metric. */
function metric(value = 0.8, samples = 3) {
  return { value, samples };
}

/** Build one normalized aggregate report fixture for gate tests. */
function report(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 4,
    phase: "release",
    reportId: "report-baseline",
    createdAt: "2026-07-13T00:00:00.000Z",
    gitRevision: "git-a",
    benchmarkId: "benchmark-a",
    optimizationUnit: "root-router",
    targetSkill: "build-clis",
    targetSkillRevision: "a".repeat(64),
    modelId: "codex-default",
    host: "codex",
    model: "test-model",
    modelVersion: "1",
    adapterVersion: "2",
    judgeModelId: "judge-default",
    judgeHost: "claude",
    judgeModel: "judge-model",
    judgeModelVersion: "1",
    judgeAdapterVersion: "2",
    variantRole: "baseline",
    variantId: "baseline",
    installedSkills: ["build-clis"],
    installedSkillRevisions: { "build-clis": "a".repeat(64) },
    caseSetDigest: "c".repeat(64),
    caseIds: ["case-a"],
    runKeys: [
      { seed: 1, repetition: 0 },
      { seed: 2, repetition: 1 },
      { seed: 3, repetition: 2 },
    ],
    runCount: 3,
    metrics: {
      taskSuccess: metric(),
      invalidRun: metric(0),
      validUnseen: metric(),
      adversarial: metric(),
      composition: metric(),
      safety: metric(),
      frozen: metric(),
      artifact: metric(),
      fixture: metric(),
      activation: {
        precision: 0.8,
        recall: 0.8,
        truePositive: 8,
        falsePositive: 2,
        falseNegative: 2,
      },
      references: {
        precision: 0.8,
        recall: 0.8,
        truePositive: 8,
        falsePositive: 2,
        falseNegative: 2,
      },
      prohibitedOutcome: metric(0.1),
      hallucination: metric(0.1),
      markdownPreservation: metric(1),
      verification: metric(),
    },
    cost: {
      targetDurationMs: { value: 100, samples: 3 },
      toolCalls: { value: 5, samples: 3 },
      commands: { value: 1, samples: 3 },
      outputCharacters: { value: 1000, samples: 3 },
      changedFiles: { value: 1, samples: 3 },
      addedLines: { value: 2, samples: 3 },
      deletedLines: { value: 1, samples: 3 },
      targetSkillBytes: 1000,
    },
    ...overrides,
  };
}

/** Build the candidate side of a paired aggregate comparison. */
function candidateReport(overrides: Record<string, unknown> = {}) {
  return report({
    reportId: "report-candidate",
    variantRole: "candidate",
    variantId: "candidate",
    targetSkillRevision: "b".repeat(64),
    installedSkillRevisions: { "build-clis": "b".repeat(64) },
    ...overrides,
  });
}

/** Run the repository's real gate against a baseline and candidate report. */
async function runGate(
  directory: string,
  candidate: Record<string, unknown>,
  baseline: Record<string, unknown> = report(),
): Promise<Deno.CommandOutput> {
  const baselinePath = join(directory, "baseline.json");
  const candidatePath = join(directory, "candidate.json");
  await Deno.writeTextFile(baselinePath, JSON.stringify(baseline));
  await Deno.writeTextFile(candidatePath, JSON.stringify(candidate));
  return await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=manual",
      "--allow-read",
      "scripts/gate_skillopt.ts",
      "--baseline",
      relative(root, baselinePath),
      "--candidate",
      relative(root, candidatePath),
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
}

describe("SkillOpt aggregate gate", () => {
  it("rejects a task regression despite unseen improvement", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const output = await runGate(
        directory,
        candidateReport({
          metrics: {
            ...(report().metrics as Record<string, unknown>),
            taskSuccess: metric(0.79),
            validUnseen: metric(0.9),
          },
        }),
      );
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toMatch(/primaryDelta/);
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  it("accepts a paired non-regressing strict improvement", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const output = await runGate(
        directory,
        candidateReport({
          metrics: {
            ...(report().metrics as Record<string, unknown>),
            taskSuccess: metric(0.81),
          },
        }),
      );
      expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  it("rejects reports built for different optimization targets", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const baseline = report({
        optimizationUnit: "reference",
        targetReference: "build-clis/references/integration.md",
      });
      const candidate = candidateReport({
        optimizationUnit: "reference",
        targetReference: "build-clis/references/testing.md",
      });
      const output = await runGate(directory, candidate, baseline);
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toMatch(/targetReference/);
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  it("rejects reports graded by different judge versions", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const output = await runGate(
        directory,
        candidateReport({ judgeModelVersion: "2" }),
      );
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toMatch(/judgeModelVersion/);
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  it("rejects self-labelled variant comparisons", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const output = await runGate(
        directory,
        candidateReport({ variantId: "baseline" }),
      );
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toMatch(/distinct variantId/);
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  it("accepts a no-skill baseline without pretending skill size is comparable", async () => {
    const directory = await Deno.makeTempDir({ dir: root, prefix: ".gate-test-" });
    try {
      const baseline = report({
        targetSkillRevision: null,
        installedSkills: [],
        installedSkillRevisions: {},
        cost: {
          ...(report().cost as Record<string, unknown>),
          targetSkillBytes: 0,
        },
      });
      const output = await runGate(
        directory,
        candidateReport({
          metrics: {
            ...(report().metrics as Record<string, unknown>),
            taskSuccess: metric(0.81),
          },
          cost: {
            ...(report().cost as Record<string, unknown>),
            targetSkillBytes: 10_000,
          },
        }),
        baseline,
      );
      expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
      expect(new TextDecoder().decode(output.stdout)).toMatch(
        /"sizeComparable": false/,
      );
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });
});
