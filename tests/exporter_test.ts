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

async function exportWorkspace(mode: string): Promise<void> {
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
    const installedTarget = join(
      target,
      "optimize",
      workspace.mutablePaths[0],
    );
    const source = await Deno.readTextFile(installedTarget);
    await Deno.writeTextFile(installedTarget, `${source}\noptimization probe\n`);
    assert.match(await Deno.readTextFile(installedTarget), /optimization probe/);
  } finally {
    await Deno.remove(target, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
});
