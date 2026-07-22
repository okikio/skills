import assert from "node:assert/strict";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function report(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 3,
    phase: "release",
    runId: "run",
    createdAt: "2026-07-13T00:00:00.000Z",
    gitRevision: "baseline",
    benchmarkId: "benchmark-a",
    skillRevision: "baseline-skill",
    targetSkill: "build-clis",
    host: "codex",
    model: "test-model",
    modelVersion: "1",
    adapterVersion: "1",
    variantRole: "baseline",
    variantId: "baseline",
    installedSkills: ["build-clis"],
    caseSetDigest: "cases",
    caseIds: ["case-a"],
    seedPolicy: "fixed",
    repetitions: 3,
    runCount: 3,
    taskSuccessRate: 0.8,
    validUnseenScore: 0.8,
    adversarialScore: 0.8,
    compositionScore: 0.8,
    safetyScore: 0.8,
    frozenScore: 0.8,
    artifactScore: 0.8,
    fixturePassRate: 0.8,
    activationPrecision: 0.8,
    activationRecall: 0.8,
    referencePrecision: 0.8,
    referenceRecall: 0.8,
    forbiddenActionRate: 0.1,
    hallucinationRate: 0.1,
    markdownPreservationRate: 1,
    verificationRate: 0.8,
    meanDurationMs: 100,
    meanToolCalls: 5,
    skillTokens: 1000,
    ...overrides,
  };
}

function candidateReport(overrides: Record<string, unknown> = {}) {
  return report({
    variantRole: "candidate",
    variantId: "candidate",
    skillRevision: "candidate-skill",
    ...overrides,
  });
}

async function runGate(
  directory: string,
  candidate: Record<string, unknown>,
): Promise<Deno.CommandOutput> {
  const baselinePath = join(directory, "baseline.json");
  const candidatePath = join(directory, "candidate.json");
  await Deno.writeTextFile(baselinePath, JSON.stringify(report()));
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

Deno.test("SkillOpt gate rejects primary task regression despite unseen improvement", async () => {
  const directory = await Deno.makeTempDir({
    dir: root,
    prefix: ".gate-test-",
  });
  try {
    const output = await runGate(
      directory,
      candidateReport({ taskSuccessRate: 0.79, validUnseenScore: 0.9 }),
    );
    assert.notEqual(output.code, 0);
    assert.match(
      new TextDecoder().decode(output.stderr),
      /taskSuccessRate:lower/,
    );
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test("SkillOpt gate accepts a paired non-regressing strict improvement", async () => {
  const directory = await Deno.makeTempDir({
    dir: root,
    prefix: ".gate-test-",
  });
  try {
    const output = await runGate(
      directory,
      candidateReport({ taskSuccessRate: 0.81, validUnseenScore: 0.8 }),
    );
    assert.equal(output.code, 0, new TextDecoder().decode(output.stderr));
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test("SkillOpt gate rejects self-labelled variant comparisons", async () => {
  const directory = await Deno.makeTempDir({
    dir: root,
    prefix: ".gate-test-",
  });
  try {
    const output = await runGate(
      directory,
      candidateReport({ variantId: "baseline" }),
    );
    assert.notEqual(output.code, 0);
    assert.match(
      new TextDecoder().decode(output.stderr),
      /distinct variantId/,
    );
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
