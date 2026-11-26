import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as tree from "../src/tree.ts";

/** Repository root used by subprocess-backed SkillOpt fixtures. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Return whether a path exists while preserving non-not-found failures. */
async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

/** Export one SkillOpt workspace through the repository's real CLI script. */
async function exportWorkspace(
  mode: string,
  reference?: string,
  extra: string[] = [],
  expectedSuccess = true,
): Promise<Deno.CommandOutput> {
  const referenceArgs = reference === undefined
    ? []
    : ["--reference", reference];
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=none",
      "--config",
      join(root, "deno.json"),
      "--allow-read",
      "--allow-write",
      "--allow-env=LOG_TOKENS,LOG_STREAM",
      "scripts/export_skillopt.ts",
      "--skill",
      "build-clis",
      "--mode",
      mode,
      "--with",
      "verify-behavior",
      "--with",
      "explore-ecosystems",
      ...referenceArgs,
      ...extra,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (expectedSuccess) {
    expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
  } else {
    expect(output.code).not.toBe(0);
  }
  return output;
}

/** Verify one exported workspace through the repository's digest verifier. */
async function verifyWorkspace(mode: string): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=none",
      "--config",
      join(root, "deno.json"),
      "--allow-read",
      "scripts/verify_skillopt_workspace.ts",
      "--workspace",
      `.skillopt/build-clis/${mode}/workspace.json`,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
}

describe("SkillOpt workspace export", () => {
  it("keeps references selective and frozen cases isolated", async () => {
    const target = join(root, ".skillopt", "build-clis");
    try {
      await exportWorkspace("optimize");
      await exportWorkspace("release");
      expect(await exists(join(target, "optimize", "context.md"))).toBe(false);
      expect(await exists(join(target, "optimize", "initial.md"))).toBe(false);
      expect(
        await exists(
          join(
            target,
            "optimize",
            "candidate",
            "skills",
            "build-clis",
            "references",
            "config.md",
          ),
        ),
      ).toBe(true);
      expect(
        await exists(
          join(
            target,
            "optimize",
            "companions",
            "skills",
            "explore-ecosystems",
            "references",
            "topology.md",
          ),
        ),
      ).toBe(true);

      const optimize = await Deno.readTextFile(
        join(target, "optimize", "data", "train.jsonl"),
      ) + await Deno.readTextFile(
        join(target, "optimize", "data", "valid-seen.jsonl"),
      );
      const release = await Deno.readTextFile(
        join(target, "release", "data", "test-frozen.jsonl"),
      );
      expect(optimize).not.toMatch(/test-frozen/);
      expect(release).toMatch(/test-frozen/);

      const workspace = JSON.parse(
        await Deno.readTextFile(join(target, "optimize", "workspace.json")),
      );
      expect(workspace.mutablePaths).toEqual([
        "candidate/skills/build-clis/SKILL.md",
      ]);
      expect(workspace.optimizationUnit).toBe("root-router");
      expect(workspace.immutablePaths).toContain(
        "candidate/skills/build-clis/references/config.md",
      );
      expect(workspace.immutablePaths).toContain(
        "candidate/skills/build-clis/references/shared/guides/engineering-standards.md",
      );

      const releaseWorkspace = JSON.parse(
        await Deno.readTextFile(join(target, "release", "workspace.json")),
      );
      expect(releaseWorkspace.mutablePaths).toEqual([]);
      expect(Object.keys(releaseWorkspace.immutableDigests).length)
        .toBeGreaterThan(0);

      const verified = await verifyWorkspace("optimize");
      expect(
        verified.code,
        new TextDecoder().decode(verified.stderr),
      ).toBe(0);

      const installedTarget = join(
        target,
        "optimize",
        workspace.mutablePaths[0],
      );
      const source = await Deno.readTextFile(installedTarget);
      await Deno.writeTextFile(
        installedTarget,
        `${source}\noptimization probe\n`,
      );
      expect(await Deno.readTextFile(installedTarget)).toMatch(
        /optimization probe/,
      );
      const mutableVerified = await verifyWorkspace("optimize");
      expect(
        mutableVerified.code,
        new TextDecoder().decode(mutableVerified.stderr),
      ).toBe(0);

      const immutablePath = workspace.immutablePaths.find((path: string) =>
        path.endsWith("references/config.md")
      );
      expect(typeof immutablePath).toBe("string");
      await Deno.writeTextFile(
        join(target, "optimize", immutablePath),
        "tampered immutable reference\n",
      );
      const rejected = await verifyWorkspace("optimize");
      expect(rejected.code).not.toBe(0);
      expect(new TextDecoder().decode(rejected.stderr)).toMatch(
        /immutable content changed/,
      );
    } finally {
      await Deno.remove(target, { recursive: true }).catch((error) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  });

  it("isolates one mutable reference", async () => {
    const target = join(root, ".skillopt", "build-clis");
    try {
      await exportWorkspace("optimize", "references/optique.md");
      const workspace = JSON.parse(
        await Deno.readTextFile(join(target, "optimize", "workspace.json")),
      );
      expect(workspace.optimizationUnit).toBe("reference");
      expect(workspace.targetReference).toBe("references/optique.md");
      expect(workspace.mutablePaths).toEqual([
        "candidate/skills/build-clis/references/optique.md",
      ]);
      expect(workspace.cases.length).toBeGreaterThan(0);
      expect(workspace.immutablePaths).toContain(
        "candidate/skills/build-clis/SKILL.md",
      );
      expect(workspace.immutablePaths).toContain(
        "candidate/skills/build-clis/references/output.md",
      );
    } finally {
      await Deno.remove(target, { recursive: true }).catch((error) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  });

  it("rejects changed exported evaluation data", async () => {
    const target = join(root, ".skillopt", "build-clis");
    try {
      await exportWorkspace("optimize");
      const train = join(target, "optimize", "data", "train.jsonl");
      const source = await Deno.readTextFile(train);
      const lines = source.trimEnd().split("\n");
      expect(lines.length).toBeGreaterThan(0);
      const first = JSON.parse(lines[0]);
      first.prompt = `${first.prompt} tampered`;
      lines[0] = JSON.stringify(first);
      await Deno.writeTextFile(train, `${lines.join("\n")}\n`);

      const rejected = await verifyWorkspace("optimize");
      expect(rejected.code).not.toBe(0);
      expect(new TextDecoder().decode(rejected.stderr)).toMatch(
        /exported case digest changed|caseSetDigest/,
      );
    } finally {
      await Deno.remove(target, { recursive: true }).catch((error) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  });

  it("pins an edited candidate for held-out evaluation and rejects identity or dependency changes", async () => {
    const target = join(root, ".skillopt", "build-clis");
    try {
      await exportWorkspace("optimize");
      const sourceManifest = join(target, "optimize", "workspace.json");
      const original = JSON.parse(await Deno.readTextFile(sourceManifest));
      const selected = join(target, "optimize", original.mutablePaths[0]);
      await Deno.writeTextFile(
        selected,
        await Deno.readTextFile(selected) +
          "\nCandidate evidence: check the final command output.\n",
      );
      const allowed = await verifyWorkspace("optimize");
      expect(allowed.code, new TextDecoder().decode(allowed.stderr)).toBe(0);

      await exportWorkspace("evaluate", undefined, [
        "--candidate-workspace",
        sourceManifest,
      ]);
      const evaluated = JSON.parse(
        await Deno.readTextFile(join(target, "evaluate", "workspace.json")),
      );
      expect(evaluated.mutablePaths).toEqual([]);
      expect(evaluated.skillRevisions["build-clis"]).not.toBe(
        original.skillRevisions["build-clis"],
      );
      const installed = join(target, "evaluate", "candidate/skills/build-clis");
      expect(evaluated.skillRevisions["build-clis"]).toBe(
        await tree.getDigest(installed),
      );
      expect(await Deno.readTextFile(join(installed, "SKILL.md"))).toContain(
        "Candidate evidence:",
      );
      const verified = await verifyWorkspace("evaluate");
      expect(verified.code, new TextDecoder().decode(verified.stderr)).toBe(0);
      expect(await exists(join(target, "evaluate", "data/test-frozen.jsonl")))
        .toBe(false);

      await Deno.writeTextFile(
        join(installed, "SKILL.md"),
        "Unpinned evaluation mutation\n",
      );
      expect((await verifyWorkspace("evaluate")).code).not.toBe(0);

      const mismatch = await exportWorkspace(
        "evaluate",
        "references/optique.md",
        ["--candidate-workspace", sourceManifest],
        false,
      );
      expect(new TextDecoder().decode(mismatch.stderr)).toContain(
        "identity differs",
      );
      const evaluationInput = await exportWorkspace("release", undefined, [
        "--candidate-workspace",
        join(target, "evaluate", "workspace.json"),
      ], false);
      expect(new TextDecoder().decode(evaluationInput.stderr)).toContain(
        "must use optimize mode",
      );

      const dependency =
        "candidate/skills/build-clis/references/shared/guides/engineering-standards.md";
      await Deno.writeTextFile(
        join(target, "optimize", dependency),
        "Changed shared dependency\n",
      );
      const rejected = await exportWorkspace("evaluate", undefined, [
        "--candidate-workspace",
        sourceManifest,
      ], false);
      expect(new TextDecoder().decode(rejected.stderr)).toContain(
        "immutable content changed",
      );
    } finally {
      await Deno.remove(target, { recursive: true }).catch((error) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    }
  });
});
