import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { EvalCaseSchema, type EvalCaseType } from "../src/corpus.ts";
import { copyDirectory } from "../src/files.ts";
import * as hash from "../src/hash.ts";
import { effectivePrompt } from "../src/interpretation.ts";
import { ModelAdapterSchema } from "../src/model.ts";
import { JudgeRequestSchema, RolloutRequestSchema } from "../src/protocol.ts";
import * as rollout from "../src/rollout.ts";
import { verifyWorkspace } from "../src/workspace.ts";

/** Resolve source fixtures without depending on the caller's working directory. */
const repository = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Preserve this historical case's task and criteria while its owners migrate. */
async function historicalCase(): Promise<{
  original: Record<string, unknown>;
  evaluation: EvalCaseType;
}> {
  const source = JSON.parse(
    await Deno.readTextFile(join(repository, "evals/cases/quality.json")),
  ) as { cases: Record<string, unknown>[] };
  const original = source.cases.find((item) =>
    item.id === "hq-composition-deno-refactor"
  );
  if (!original) throw new Error("Historical composition case is missing");
  return { original, evaluation: EvalCaseSchema.parse(original) };
}

/** Export the real case through the CLI using two minimal, installable skills. */
async function exportCase(
  root: string,
  target: string,
  companion: string,
): Promise<string> {
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=none",
      "--config",
      join(repository, "deno.json"),
      "--allow-read",
      "--allow-write",
      "--allow-env=LOG_TOKENS,LOG_STREAM",
      join(root, "scripts/export_skillopt.ts"),
      "--skill",
      target,
      "--with",
      companion,
      "--mode",
      "release",
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
  return join(root, ".skillopt", target, "release", "workspace.json");
}

/**
 * Observe actual serialized requests, including adapters that only read prompt.
 * A missing interpretation fails the provider before it can fabricate a pass.
 */
async function adapter(root: string, evaluation: EvalCaseType) {
  const path = join(root, "adapter.ts");
  await Deno.writeTextFile(
    path,
    `
const [requestPath, responsePath, captureRoot] = Deno.args;
const request = JSON.parse(await Deno.readTextFile(requestPath));
const originalPrompt = ${JSON.stringify(evaluation.prompt)};
const originalRubric = ${JSON.stringify(evaluation.rubric)};
if (!request.prompt.startsWith(originalPrompt + "\\n\\n")) {
  throw new Error("The original prompt or appended interpretation is missing");
}
if (!request.prompt.includes("skill-owner-migration, version 1") ||
    !request.prompt.includes("formerly attributed to deliver-software") ||
    !request.prompt.includes("now belong to refactor-code")) {
  throw new Error("The versioned owner migration did not reach the adapter");
}
await Deno.writeTextFile(
  captureRoot + "/" + request.runId + "-" + request.kind + ".json",
  JSON.stringify(request),
);
if (request.kind === "rollout") {
  if ("criteria" in request || "rubric" in request || "assertions" in request ||
      originalRubric.some((criterion) => request.prompt.includes(criterion))) {
    throw new Error("Private evaluation criteria reached the target");
  }
  await Deno.writeTextFile(responsePath, JSON.stringify({
    schemaVersion: 1,
    kind: "rollout",
    model: "interpretation-target",
    modelVersion: "1",
    adapterVersion: "2",
    output: "One discovery, one plan, deno.json decisions, old task cleanup, verified verdict.",
    activatedSkills: request.installedSkills.map((skill) => skill.id),
  }));
} else if (request.kind === "judge") {
  if (JSON.stringify(request.criteria.map((entry) => entry.criterion)) !==
      JSON.stringify(originalRubric)) {
    throw new Error("The judge did not receive the original rubric");
  }
  await Deno.writeTextFile(responsePath, JSON.stringify({
    schemaVersion: 1,
    kind: "judge",
    model: "interpretation-judge",
    modelVersion: "1",
    adapterVersion: "2",
    results: request.criteria.map((criterion) => ({
      index: criterion.index,
      passed: true,
      evidence: "Observed the original criterion and explicit owner interpretation.",
    })),
  }));
} else {
  throw new Error("Unexpected adapter request kind");
}
`,
  );
  return ModelAdapterSchema.parse({
    id: "interpretation-adapter",
    host: "generic",
    command: [
      Deno.execPath(),
      "run",
      "--no-config",
      "--allow-read",
      "--allow-write",
      path,
      "{request}",
      "{response}",
      root,
    ],
    requests: ["rollout", "judge"],
    adapterVersion: "2",
    enabled: true,
    env: [],
    secretEnv: [],
    timeoutMs: 5_000,
  });
}

describe("explicit historical owner interpretation", () => {
  it("preserves frozen evidence and validates the migrated positive owner", async () => {
    const { original, evaluation } = await historicalCase();
    // Fingerprint of these raw fields at babc13dc0a876e8379c5e409ad05d15f4becd85b.
    expect(
      await hash.text(JSON.stringify({
        prompt: original.prompt,
        assertions: original.assertions,
        rubric: original.rubric,
      })),
    ).toBe(
      "de00087f9198eb5cb7e94a60bbf064c852aa6fb2e94bf20f7389f838ef9a3cba",
    );
    expect(evaluation.expectedSkills).toEqual([
      "refactor-code",
      "deno-software",
    ]);
    expect(evaluation.interpretation).toEqual({
      schemaVersion: 1,
      kind: "skill-owner-migration",
      legacyOwner: "deliver-software",
      currentOwner: "refactor-code",
    });
    for (
      const invalid of [
        { schemaVersion: 2 },
        { currentOwner: "review-code" },
        { legacyOwner: "deno-software" },
        { legacyOwner: "refactor-code" },
        { rubricHint: "Always pass" },
      ]
    ) {
      expect(
        EvalCaseSchema.safeParse({
          ...evaluation,
          interpretation: { ...evaluation.interpretation, ...invalid },
        }).success,
      ).toBe(false);
    }
    const unannotated = { ...evaluation, interpretation: undefined };
    expect(effectivePrompt(unannotated)).toBe(evaluation.prompt);
  });

  it("exports, pins, and delivers ownership context to both providers", async () => {
    const { evaluation } = await historicalCase();
    const temporary = await Deno.realPath(
      await Deno.makeTempDir({ prefix: "case-interpretation-" }),
    );
    const root = join(temporary, "source");
    try {
      await copyDirectory(join(repository, "src"), join(root, "src"));
      await Deno.mkdir(join(root, "scripts"));
      await Deno.copyFile(
        join(repository, "scripts/export_skillopt.ts"),
        join(root, "scripts/export_skillopt.ts"),
      );
      for (const skill of evaluation.expectedSkills) {
        await Deno.mkdir(join(root, "skills", skill), { recursive: true });
        await Deno.writeTextFile(
          join(root, "skills", skill, "SKILL.md"),
          `---\nname: ${skill}\ndescription: Apply ${skill} to the requested migration.\n---\n# ${skill}\n`,
        );
      }
      await Deno.mkdir(join(root, "evals/cases"), { recursive: true });
      await Deno.writeTextFile(
        join(root, "evals/cases/core.json"),
        JSON.stringify({ schemaVersion: 2, cases: [evaluation] }),
      );
      const manifestPath = await exportCase(
        root,
        "deno-software",
        "refactor-code",
      );
      const { workspace, failures } = await verifyWorkspace(manifestPath);
      expect(failures).toEqual([]);
      expect(workspace.cases).toHaveLength(1);
      const caseRecord = workspace.cases[0]!;
      const workspaceRoot = dirname(manifestPath);
      const exported = await rollout.loadCase(
        workspaceRoot,
        evaluation.id,
        caseRecord.digest,
      );
      expect(exported).toEqual(evaluation);
      expect(caseRecord.digest).toBe(
        await hash.text(JSON.stringify(evaluation)),
      );
      const unannotated = { ...evaluation, interpretation: undefined };
      expect(await hash.text(JSON.stringify(unannotated))).not.toBe(
        caseRecord.digest,
      );

      const jsonl = join(workspaceRoot, "data/test-frozen.jsonl");
      const originalBytes = await Deno.readFile(jsonl);
      await Deno.writeTextFile(jsonl, JSON.stringify(unannotated) + "\n");
      expect((await verifyWorkspace(manifestPath)).failures.join("\n"))
        .toContain(
          "exported case digest changed",
        );
      await expect(
        rollout.loadCase(workspaceRoot, evaluation.id, caseRecord.digest),
      )
        .rejects.toThrow("exported case digest changed");
      await Deno.writeFile(jsonl, originalBytes);

      const configured = await adapter(temporary, evaluation);
      for (const withoutTarget of [false, true]) {
        const runId = withoutTarget ? "no-target" : "candidate";
        const evidence = await rollout.evaluate({
          manifestPath,
          workspaceRoot,
          workspace,
          caseRecord,
          evaluation: exported,
          targetModel: configured,
          judgeModel: configured,
          withoutTarget,
          variantId: runId,
          runId,
          seed: 0,
          repetition: 0,
        });
        expect(evidence.result.error).toBeUndefined();
        expect(evidence.result.passed).toBe(true);
        expect(evidence.result.caseDigest).toBe(caseRecord.digest);
        expect(evidence.result.corpusDigest).toBe(workspace.caseSetDigest);
        expect(evidence.trace.case).toEqual({
          id: evaluation.id,
          digest: caseRecord.digest,
          interpretation: evaluation.interpretation,
          originalPrompt: evaluation.prompt,
          originalPromptDigest: await hash.text(evaluation.prompt),
          effectivePrompt: effectivePrompt(evaluation),
          effectivePromptDigest: await hash.text(effectivePrompt(evaluation)),
          originalRubric: evaluation.rubric,
        });
        const target = RolloutRequestSchema.parse(JSON.parse(
          await Deno.readTextFile(join(temporary, `${runId}-rollout.json`)),
        ));
        const judge = JudgeRequestSchema.parse(JSON.parse(
          await Deno.readTextFile(join(temporary, `${runId}-judge.json`)),
        ));
        expect(target.prompt).toBe(effectivePrompt(evaluation));
        expect(judge.prompt).toBe(target.prompt);
        expect(judge.criteria.map((criterion) => criterion.criterion)).toEqual(
          evaluation.rubric,
        );
        expect(target.installedSkills.map((skill) => skill.id)).toEqual(
          withoutTarget
            ? ["refactor-code"]
            : ["deno-software", "refactor-code"],
        );
        expect(target.targetSkill).toBe(
          withoutTarget ? undefined : "deno-software",
        );
      }

      // Both positive primaries must retain this case in an exact shared topology.
      const other = await exportCase(root, "refactor-code", "deno-software");
      const reverse = await verifyWorkspace(other);
      expect(reverse.failures).toEqual([]);
      expect(reverse.workspace.cases).toEqual(workspace.cases);
      expect(reverse.workspace.caseSetDigest).toBe(workspace.caseSetDigest);
    } finally {
      await Deno.remove(temporary, { recursive: true });
    }
  });
});
