import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
): Promise<void> {
  const referenceArgs = reference === undefined
    ? []
    : ["--reference", reference];
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=manual",
      "--allow-read",
      "--allow-write",
      "scripts/export_skillopt.ts",
      "--skill",
      "build-clis",
      "--mode",
      mode,
      "--with",
      "deliver-software",
      "--with",
      "explore-ecosystems",
      ...referenceArgs,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  expect(
    output.code,
    new TextDecoder().decode(output.stderr),
  ).toBe(0);
}

/** Verify one exported workspace through the repository's digest verifier. */
async function verifyWorkspace(mode: string): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      "run",
      "--node-modules-dir=manual",
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
      expect(await exists(
        join(
          target,
          "optimize",
          "candidate",
          "skills",
          "build-clis",
          "references",
          "config.md",
        ),
      )).toBe(true);
      expect(await exists(
        join(
          target,
          "optimize",
          "companions",
          "skills",
          "explore-ecosystems",
          "references",
          "topology.md",
        ),
      )).toBe(true);

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

});
