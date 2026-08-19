import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { join } from "node:path";
import { ModelAdapterSchema } from "../src/model.ts";
import { JudgeRequestSchema, RolloutRequestSchema } from "../src/protocol.ts";
import * as provider from "../src/provider.ts";

/** Write one deterministic adapter that implements both protocol request kinds. */
async function createAdapter(root: string): Promise<string> {
  const path = join(root, "adapter.ts");
  await Deno.writeTextFile(path, `
    const [requestPath, responsePath] = Deno.args;
    const request = JSON.parse(await Deno.readTextFile(requestPath));
    if (request.kind === "rollout") {
      await Deno.writeTextFile(responsePath, JSON.stringify({
        schemaVersion: 1,
        kind: "rollout",
        model: "fixture-target",
        modelVersion: "1",
        adapterVersion: "2",
        output: "Verified target output.",
        activatedSkills: ["deliver-software"],
        referencesRead: [],
        messages: [],
        toolCalls: [],
        commands: [],
      }));
    } else if (request.kind === "judge") {
      await Deno.writeTextFile(responsePath, JSON.stringify({
        schemaVersion: 1,
        kind: "judge",
        model: "fixture-judge",
        modelVersion: "1",
        adapterVersion: "2",
        results: request.criteria.map((criterion) => ({
          index: criterion.index,
          passed: true,
          evidence: "Criterion satisfied by fixture evidence.",
        })),
      }));
    } else {
      throw new Error("Unexpected request kind");
    }
  `);
  return path;
}

/** Build one test adapter that invokes the current Deno executable. */
function model(adapter: string) {
  return ModelAdapterSchema.parse({
    id: "fixture-provider",
    host: "generic",
    command: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-write",
      adapter,
      "{request}",
      "{response}",
    ],
    requests: ["rollout", "judge"],
    adapterVersion: "2",
    enabled: true,
    env: [],
    secretEnv: [],
    timeoutMs: 5_000,
  });
}

describe("provider adapter invocation", () => {
  it("invokes rollout and judge requests through the same normalized protocol", async () => {
    const root = await Deno.makeTempDir({ prefix: "skills-provider-" });
    try {
      const adapter = await createAdapter(root);
      const configured = model(adapter);
      const rolloutRequest = RolloutRequestSchema.parse({
        schemaVersion: 1,
        kind: "rollout",
        runId: "run",
        caseId: "case",
        prompt: "Inspect the supplied fixture and report the verified result.",
        cwd: root,
        skillsRoot: root,
        targetSkill: "deliver-software",
        installedSkills: [],
        seed: 0,
        repetition: 0,
      });
      const rolloutResult = await provider.call(
        configured,
        rolloutRequest,
        root,
        root,
      );

      expect(rolloutResult.error).toBeUndefined();
      expect(rolloutResult.response?.kind).toBe("rollout");
      expect(rolloutResult.response?.output).toContain("Verified");

      const judgeRequest = JudgeRequestSchema.parse({
        schemaVersion: 1,
        kind: "judge",
        runId: "run",
        caseId: "case",
        prompt: "Inspect the supplied fixture and report the verified result.",
        criteria: [{ index: 0, criterion: "Explains the verified result." }],
        evidence: {
          output: "Verified target output.",
          activatedSkills: ["deliver-software"],
          referencesRead: [],
          messages: [],
          toolCalls: [],
          commands: [],
          changedFiles: [],
          assertionResults: [{ label: "contains:verified", passed: true }],
        },
        seed: 0,
        repetition: 0,
      });
      const judgeResult = await provider.call(
        configured,
        judgeRequest,
        root,
        root,
      );

      expect(judgeResult.error).toBeUndefined();
      expect(judgeResult.response?.kind).toBe("judge");
      expect(judgeResult.response?.results).toEqual([{
        index: 0,
        passed: true,
        evidence: "Criterion satisfied by fixture evidence.",
      }]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it("rejects an adapter that mutates its immutable request", async () => {
    const root = await Deno.makeTempDir({ prefix: "skills-provider-" });
    try {
      const adapter = join(root, "mutating-adapter.ts");
      await Deno.writeTextFile(adapter, `
        const [requestPath, responsePath] = Deno.args;
        const request = JSON.parse(await Deno.readTextFile(requestPath));
        await Deno.writeTextFile(requestPath, JSON.stringify({ ...request, seed: 99 }));
        await Deno.writeTextFile(responsePath, JSON.stringify({
          schemaVersion: 1,
          kind: "rollout",
          model: "fixture-target",
          modelVersion: "1",
          adapterVersion: "2",
          output: "Result",
          activatedSkills: [],
          referencesRead: [],
          messages: [],
          toolCalls: [],
          commands: [],
        }));
      `);
      const request = RolloutRequestSchema.parse({
        schemaVersion: 1,
        kind: "rollout",
        runId: "run",
        caseId: "case",
        prompt: "Inspect the fixture and report the requested result.",
        cwd: root,
        skillsRoot: root,
        installedSkills: [],
        seed: 0,
        repetition: 0,
      });
      const result = await provider.call(model(adapter), request, root, root);

      expect(result.error).toMatch(/modified its immutable request/);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
