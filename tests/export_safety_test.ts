import { expect } from "@std/expect";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { copyDirectory } from "../src/files.ts";
import * as tree from "../src/tree.ts";

/** Use the repository dependency config while testing a disposable collection. */
const repository = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal cases keep candidate-path tests independent from corpus ownership. */
const cases = ["train", "valid-seen", "valid-unseen"].map((split) => ({
  id: `alpha-${split}`,
  title: `Alpha ${split}`,
  skill: "alpha",
  kind: "routing",
  split,
  prompt: "Review the alpha change and report the result.",
  expectedSkills: ["alpha"],
  assertions: [{ kind: "contains", value: "alpha" }],
  tags: ["test"],
  rationale: "Observe alpha routing in an isolated collection.",
}));

/** Export through the real CLI in a disposable source collection. */
async function exportWorkspace(
  root: string,
  mode: string,
  candidate?: string,
  companions: readonly string[] = [],
  reference?: string,
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
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
      "alpha",
      "--mode",
      mode,
      ...(candidate ? ["--candidate-workspace", candidate] : []),
      ...companions.flatMap((skill) => ["--with", skill]),
      ...(reference ? ["--reference", reference] : []),
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
}

/** Installable fixture companion with a reference owned by that skill. */
async function addCompanion(root: string): Promise<void> {
  await Deno.mkdir(join(root, "skills/beta/references"), { recursive: true });
  await Deno.writeTextFile(
    join(root, "skills/beta/SKILL.md"),
    "---\nname: beta\ndescription: Apply beta guidance when reviewing alpha changes.\n---\n# Beta\n\n[Review](references/review.md)\n",
  );
  await Deno.writeTextFile(
    join(root, "skills/beta/references/review.md"),
    "# Review\n\nCheck the requested behavior.\n",
  );
}

/** Give every test a real optimize input with unique uncommitted candidate work. */
async function collection(
  action: (root: string, temporary: string, optimize: string) => Promise<void>,
): Promise<void> {
  const temporary = await Deno.realPath(
    await Deno.makeTempDir({ prefix: "export-safety-" }),
  );
  const root = join(temporary, "source");
  try {
    await copyDirectory(join(repository, "src"), join(root, "src"));
    await Deno.mkdir(join(root, "scripts"));
    await Deno.copyFile(
      join(repository, "scripts/export_skillopt.ts"),
      join(root, "scripts/export_skillopt.ts"),
    );
    await Deno.mkdir(join(root, "skills/alpha"), { recursive: true });
    await Deno.writeTextFile(
      join(root, "skills/alpha/SKILL.md"),
      "---\nname: alpha\ndescription: Apply alpha guidance to review a change.\n---\n# Alpha\n",
    );
    await Deno.mkdir(join(root, "evals/cases"), { recursive: true });
    await Deno.writeTextFile(
      join(root, "evals/cases/core.json"),
      JSON.stringify({ schemaVersion: 2, cases }),
    );
    const output = await exportWorkspace(root, "optimize");
    expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
    const optimize = join(root, ".skillopt/alpha/optimize");
    const document = join(optimize, "candidate/skills/alpha/SKILL.md");
    await Deno.writeTextFile(
      document,
      await Deno.readTextFile(document) +
        "\nUnique optimizer work absent from source.\n",
    );
    await action(root, temporary, optimize);
  } finally {
    await Deno.remove(temporary, { recursive: true });
  }
}

describe("candidate input and output ownership", () => {
  it("rejects a symlinked ancestor before deleting an aliased candidate", async () => {
    await collection(async (root, temporary, optimize) => {
      const evaluate = join(root, ".skillopt/alpha/evaluate");
      await Deno.rename(optimize, evaluate);
      const before = await tree.getDigest(evaluate);
      const alias = join(temporary, "candidate-parent");
      await Deno.symlink(join(root, ".skillopt"), alias, { type: "dir" });
      const output = await exportWorkspace(
        root,
        "evaluate",
        join(alias, "alpha/evaluate/workspace.json"),
      );
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toContain(
        "Input ancestor is not an ordinary directory",
      );
      expect(await tree.getDigest(evaluate)).toBe(before);
    });
  });

  it("recognizes a ..checkpoint directory as an output descendant", async () => {
    await collection(async (root, _temporary, optimize) => {
      const evaluate = join(root, ".skillopt/alpha/evaluate");
      await Deno.mkdir(evaluate);
      const checkpoint = join(evaluate, "..checkpoint");
      await Deno.rename(optimize, checkpoint);
      const before = await tree.getDigest(checkpoint);
      const output = await exportWorkspace(
        root,
        "evaluate",
        join(checkpoint, "workspace.json"),
      );
      expect(output.code).not.toBe(0);
      expect(new TextDecoder().decode(output.stderr)).toContain(
        "must be separate trees",
      );
      expect(await tree.getDigest(checkpoint)).toBe(before);
    });
  });

  it("accepts an ordinary external candidate and preserves its input bytes", async () => {
    await collection(async (root, temporary, optimize) => {
      const external = join(temporary, "external-candidate");
      await Deno.rename(optimize, external);
      const before = await tree.getDigest(external);
      const output = await exportWorkspace(
        root,
        "evaluate",
        join(external, "workspace.json"),
      );
      expect(output.code, new TextDecoder().decode(output.stderr)).toBe(0);
      expect(await tree.getDigest(external)).toBe(before);
      expect(
        await Deno.readTextFile(
          join(
            root,
            ".skillopt/alpha/evaluate/candidate/skills/alpha/SKILL.md",
          ),
        ),
      )
        .toContain("Unique optimizer work absent from source.");
    });
  });
});

describe("exported case eligibility", () => {
  it("requires positive companion skills and reference owners while retaining solo cases", async () => {
    await collection(async (root) => {
      await addCompanion(root);
      const base = cases[0];
      const selected = [
        ...cases,
        {
          ...base,
          id: "primary-needs-skill",
          expectedSkills: ["alpha", "beta"],
        },
        {
          ...base,
          id: "primary-needs-reference",
          requiredReferences: ["beta/references/review.md"],
        },
        { ...base, id: "primary-forbids-beta", forbiddenSkills: ["beta"] },
        {
          ...base,
          id: "composition-needs-reference",
          skill: "composition",
          requiredReferences: ["beta/references/review.md"],
        },
        {
          ...base,
          id: "composition-forbids-beta",
          skill: "composition",
          forbiddenSkills: ["beta"],
        },
      ];
      await Deno.writeTextFile(
        join(root, "evals/cases/core.json"),
        JSON.stringify({ schemaVersion: 2, cases: selected }),
      );
      const trainIds = async () =>
        (await Deno.readTextFile(
          join(root, ".skillopt/alpha/optimize/data/train.jsonl"),
        ))
          .trim().split("\n").map((line) => JSON.parse(line).id).sort();
      const solo = await exportWorkspace(root, "optimize");
      expect(solo.code, new TextDecoder().decode(solo.stderr)).toBe(0);
      expect(await trainIds()).toEqual(["alpha-train", "primary-forbids-beta"]);
      const composed = await exportWorkspace(root, "optimize", undefined, [
        "beta",
      ]);
      expect(composed.code, new TextDecoder().decode(composed.stderr)).toBe(0);
      expect(await trainIds()).toEqual([
        "alpha-train",
        "composition-forbids-beta",
        "composition-needs-reference",
        "primary-forbids-beta",
        "primary-needs-reference",
        "primary-needs-skill",
      ]);
    });
  });

  it("rejects an empty eligible evaluation before replacing previous output", async () => {
    await collection(async (root) => {
      await addCompanion(root);
      const selected = cases.map((item) =>
        item.split === "valid-unseen"
          ? { ...item, expectedSkills: ["alpha", "beta"] }
          : item
      );
      await Deno.writeTextFile(
        join(root, "evals/cases/core.json"),
        JSON.stringify({ schemaVersion: 2, cases: selected }),
      );
      const destination = join(root, ".skillopt/alpha/evaluate");
      await Deno.mkdir(destination);
      await Deno.writeTextFile(
        join(destination, "previous.txt"),
        "Previous evaluation work.\n",
      );
      const solo = await exportWorkspace(root, "evaluate");
      expect(solo.code).not.toBe(0);
      expect(new TextDecoder().decode(solo.stderr)).toContain(
        "no eligible held-out cases",
      );
      expect(await Deno.readTextFile(join(destination, "previous.txt"))).toBe(
        "Previous evaluation work.\n",
      );
      const composed = await exportWorkspace(root, "evaluate", undefined, [
        "beta",
      ]);
      expect(composed.code, new TextDecoder().decode(composed.stderr)).toBe(0);
      const data = await Deno.readTextFile(
        join(destination, "data/valid-unseen.jsonl"),
      );
      expect(JSON.parse(data.trim()).id).toBe("alpha-valid-unseen");
      const before = await tree.getDigest(destination);
      await Deno.mkdir(join(root, "skills/alpha/references"));
      await Deno.writeTextFile(
        join(root, "skills/alpha/references/choice.md"),
        "# Choice\n",
      );
      const referenceOnly = await exportWorkspace(root, "evaluate", undefined, [
        "beta",
      ], "references/choice.md");
      expect(referenceOnly.code).not.toBe(0);
      expect(new TextDecoder().decode(referenceOnly.stderr)).toContain(
        "no eligible held-out cases",
      );
      expect(await tree.getDigest(destination)).toBe(before);
    });
  });

  it("requires train and seen evidence for root optimization after topology filtering", async () => {
    await collection(async (root) => {
      await addCompanion(root);
      const selected = cases.map((item) =>
        item.split === "valid-seen"
          ? { ...item, expectedSkills: ["alpha", "beta"] }
          : item
      );
      await Deno.writeTextFile(
        join(root, "evals/cases/core.json"),
        JSON.stringify({ schemaVersion: 2, cases: selected }),
      );
      const solo = await exportWorkspace(root, "optimize");
      expect(solo.code).not.toBe(0);
      expect(new TextDecoder().decode(solo.stderr)).toContain(
        "alpha/SKILL.md requires at least one valid-seen case",
      );
      const composed = await exportWorkspace(root, "optimize", undefined, [
        "beta",
      ]);
      expect(composed.code, new TextDecoder().decode(composed.stderr)).toBe(0);
    });
  });
});
