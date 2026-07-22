import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

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
  assert.equal(
    output.code,
    0,
    new TextDecoder().decode(output.stderr),
  );
}

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

Deno.test("SkillOpt exports keep references selective and frozen cases isolated", async () => {
  const target = join(root, ".skillopt", "build-clis");
  try {
    await exportWorkspace("optimize");
    await exportWorkspace("release");
    assert.equal(
      await exists(join(target, "optimize", "context.md")),
      false,
    );
    assert.equal(
      await exists(join(target, "optimize", "initial.md")),
      false,
    );
    assert.equal(
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
      true,
    );
    assert.equal(
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
      true,
    );
    const optimize = await Deno.readTextFile(
      join(target, "optimize", "data", "train.jsonl"),
    ) + await Deno.readTextFile(
      join(target, "optimize", "data", "valid-seen.jsonl"),
    );
    const release = await Deno.readTextFile(
      join(target, "release", "data", "test-frozen.jsonl"),
    );
    assert.doesNotMatch(optimize, /test-frozen/);
    assert.match(release, /test-frozen/);
    const workspace = JSON.parse(
      await Deno.readTextFile(join(target, "optimize", "workspace.json")),
    );
    assert.deepEqual(workspace.mutablePaths, [
      "candidate/skills/build-clis/SKILL.md",
    ]);
    assert.equal(workspace.optimizationUnit, "root-router");
    assert.equal(
      workspace.immutablePaths.includes(
        "candidate/skills/build-clis/references/config.md",
      ),
      true,
    );
    const releaseWorkspace = JSON.parse(
      await Deno.readTextFile(join(target, "release", "workspace.json")),
    );
    assert.deepEqual(releaseWorkspace.mutablePaths, []);
    assert.equal(
      Object.keys(releaseWorkspace.immutableDigests).length > 0,
      true,
    );
    const verified = await verifyWorkspace("optimize");
    assert.equal(
      verified.code,
      0,
      new TextDecoder().decode(verified.stderr),
    );
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
    assert.match(
      await Deno.readTextFile(installedTarget),
      /optimization probe/,
    );
    const immutablePath = workspace.immutablePaths.find((path: string) =>
      path.endsWith("references/config.md")
    );
    assert.equal(typeof immutablePath, "string");
    await Deno.writeTextFile(
      join(target, "optimize", immutablePath),
      "tampered immutable reference\n",
    );
    const rejected = await verifyWorkspace("optimize");
    assert.notEqual(rejected.code, 0);
    assert.match(
      new TextDecoder().decode(rejected.stderr),
      /immutable content changed/,
    );
  } finally {
    await Deno.remove(target, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
});

Deno.test("SkillOpt can isolate one mutable reference", async () => {
  const target = join(root, ".skillopt", "build-clis");
  try {
    await exportWorkspace("optimize", "references/optique.md");
    const workspace = JSON.parse(
      await Deno.readTextFile(join(target, "optimize", "workspace.json")),
    );
    assert.equal(workspace.optimizationUnit, "reference");
    assert.equal(workspace.targetReference, "references/optique.md");
    assert.deepEqual(workspace.mutablePaths, [
      "candidate/skills/build-clis/references/optique.md",
    ]);
    assert.equal(workspace.cases.length > 0, true);
    assert.equal(
      workspace.immutablePaths.includes(
        "candidate/skills/build-clis/SKILL.md",
      ),
      true,
    );
    assert.equal(
      workspace.immutablePaths.includes(
        "candidate/skills/build-clis/references/output.md",
      ),
      true,
    );
  } finally {
    await Deno.remove(target, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
});
