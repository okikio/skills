import { expect } from "@std/expect";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { describe, it } from "node:test";
import { materializePack, materializeSkill } from "../src/bundle.ts";
import { walkFiles } from "../src/files.ts";
import {
  guidanceGraph,
  markdownLinks,
  operationalSources,
  resolveReference,
  rewriteMarkdown,
  skillMetadata,
  unroutedDocuments,
  validateInstalledSkill,
} from "../src/guidance.ts";
import { DocumentPathSchema, referenceSource } from "../src/paths.ts";
import { RolloutResponseSchema } from "../src/protocol.ts";
import { createSkills } from "../src/rollout.ts";
import * as target from "../src/target.ts";
import * as tree from "../src/tree.ts";

/** Small source collection exercises local, shared and companion ownership. */
const files: Readonly<Record<string, string>> = {
  "LICENSE": "Test collection license.\n",
  "skills/alpha/SKILL.md": `---
name: alpha
description: Apply alpha guidance when implementing a test feature.
---
# Alpha

[Resources](references/resources.md), [CLI](cli.md),
[shared guide](../../guides/start.md#step), and [beta](../beta/SKILL.md).
`,
  "skills/alpha/cli.md": "# CLI\n\nUse explicit arguments.\n",
  "skills/alpha/references/resources.md": "# Resources\n\n[Local](local.md)\n",
  "skills/alpha/references/local.md": `# Local

[Guide](../../../guides/start.md#step)

\`[Literal](../../../../missing.md)\`

\`\`\`md
[Example](../../../../missing.md)
\`\`\`
`,
  "skills/beta/SKILL.md": `---
name: beta
description: Apply beta guidance when reviewing a test feature.
---
# Beta

Review the result.
`,
  "guides/start.md": `# Guide

## Step

Read [details][quality] and [adoption](../handbook/adoption.md).

[quality]: ../references/quality.md "Quality"

[![Overview](../references/assets/chart.svg)](../references/quality.md)
`,
  "references/quality.md": "# Quality\n\n[Start](../guides/start.md#step)\n",
  "references/assets/chart.svg": '<svg xmlns="http://www.w3.org/2000/svg"/>\n',
  "handbook/adoption.md":
    "# Adoption\n\n[Guidance](../GUIDANCE.md) and [beta](../skills/beta/SKILL.md).\n",
  "GUIDANCE.md": "# Guidance\n\n[Guide](guides/start.md)\n",
};

/** Create disposable ordinary files without touching the repository corpus. */
async function collection(
  action: (root: string, temporary: string) => Promise<void>,
): Promise<void> {
  const temporary = await Deno.makeTempDir({ prefix: "guidance-test-" });
  const root = join(temporary, "source");
  try {
    for (const [path, content] of Object.entries(files)) {
      await Deno.mkdir(dirname(join(root, path)), { recursive: true });
      await Deno.writeTextFile(join(root, path), content);
    }
    await action(root, temporary);
  } finally {
    await Deno.remove(temporary, { recursive: true });
  }
}

/** Prove every real local link stays inside a copied install and names a file. */
async function assertClosure(root: string): Promise<void> {
  for await (const path of walkFiles(root)) {
    if (!path.endsWith(".md")) continue;
    for (const { url } of markdownLinks(await Deno.readTextFile(path))) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("#")) continue;
      const destination = resolve(
        dirname(path),
        decodeURIComponent(url.split(/[?#]/)[0]),
      );
      const inside = relative(root, destination);
      expect(isAbsolute(inside) || inside.startsWith(".."), url).toBe(false);
      expect((await Deno.lstat(destination)).isFile, url).toBe(true);
    }
  }
}

describe("portable guidance bundles", () => {
  it("retains required links between two Markdown thematic rules", async () => {
    await collection(async (root, temporary) => {
      const guide =
        "---\n\n[Required](../references/only.md)\n\n---\n\n# End\n";
      await Deno.writeTextFile(join(root, "guides/start.md"), guide);
      await Deno.writeTextFile(
        join(root, "references/only.md"),
        "# Required rule\n",
      );
      expect(markdownLinks(guide).map((link) => link.url)).toEqual([
        "../references/only.md",
      ]);
      expect(
        (await guidanceGraph(root, "alpha")).reachable.has(
          "references/only.md",
        ),
      ).toBe(true);
      const destination = join(temporary, "installed");
      const result = await materializeSkill(root, "alpha", destination);
      expect(
        result.manifest.files.some((file) =>
          file.source === "references/only.md"
        ),
      ).toBe(true);
      await validateInstalledSkill(destination, "alpha");
      await Deno.remove(
        join(destination, "references/shared/references/only.md"),
      );
      await expect(validateInstalledSkill(destination, "alpha")).rejects
        .toThrow();
    });
  });

  it("survives an independent install with shared closure and optional companions", async () => {
    await collection(async (root, temporary) => {
      const destination = join(temporary, "installed", "alpha");
      const result = await materializeSkill(root, "alpha", destination, {
        sourceRef: "branch/test",
      });
      expect(result.manifest.companions).toEqual(["beta"]);
      expect(
        result.manifest.files.some((file) =>
          file.source.startsWith("skills/beta/")
        ),
      ).toBe(false);
      expect(
        result.manifest.files.find((file) =>
          file.source === "references/quality.md"
        )?.path,
      )
        .toBe("references/shared/references/quality.md");
      const entrypoint = await Deno.readTextFile(join(destination, "SKILL.md"));
      expect(entrypoint).toContain("references/shared/guides/start.md#step");
      expect(entrypoint).toContain(
        "https://github.com/okikio/skills/blob/branch/test/skills/beta/SKILL.md",
      );
      expect(entrypoint).toContain("only when it is installed and relevant");
      expect(await Deno.readTextFile(join(destination, "references/local.md")))
        .toContain("[Example](../../../../missing.md)");
      expect(
        await Deno.readTextFile(
          join(destination, "references/shared/references/assets/chart.svg"),
        ),
      )
        .toBe(files["references/assets/chart.svg"]);
      await Deno.rename(root, join(temporary, "source-unavailable"));
      await assertClosure(destination);
      expect(await tree.getDigest(destination)).toBe(result.revision);
    });
  });

  it("uses one source owner and routes operational documents through an index", async () => {
    await collection(async (root) => {
      const graph = await guidanceGraph(root, "alpha");
      expect(unroutedDocuments(graph)).toEqual([]);
      expect(graph.reachable.has("skills/alpha/references/local.md")).toBe(
        true,
      );
      expect(referenceSource("alpha/references/shared/guides/start.md")).toBe(
        "guides/start.md",
      );
      expect(referenceSource("beta/references/shared/guides/start.md")).toBe(
        "guides/start.md",
      );
      expect(
        await resolveReference(root, "alpha/references/shared/guides/start.md"),
      )
        .toBe(join(root, "guides/start.md"));
      const sources = await operationalSources(root);
      expect(sources.filter((source) => source === "guides/start.md"))
        .toHaveLength(1);
      expect(sources).not.toContain("skills/alpha/references/resources.md");
      await Deno.writeTextFile(
        join(root, "skills/alpha/references/unrouted.md"),
        "# Unrouted\n",
      );
      expect(unroutedDocuments(await guidanceGraph(root, "alpha")))
        .toEqual(["skills/alpha/references/unrouted.md"]);
    });
  });

  it("keeps source identity separate from rewritten bytes and changes with a dependency", async () => {
    await collection(async (root, temporary) => {
      const before = await tree.getDigest(root);
      const first = await materializeSkill(
        root,
        "alpha",
        join(temporary, "first"),
      );
      const second = await materializeSkill(
        root,
        "alpha",
        join(temporary, "second"),
      );
      expect(first.revision).toBe(second.revision);
      expect(await tree.getDigest(root)).toBe(before);
      const entrypoint = first.manifest.files.find((file) =>
        file.path === "SKILL.md"
      )!;
      expect(entrypoint.sourceDigest).not.toBe(entrypoint.digest);
      await Deno.writeTextFile(
        join(root, "references/quality.md"),
        "# Quality\n\nVerify actual output.\n",
      );
      const third = await materializeSkill(
        root,
        "alpha",
        join(temporary, "third"),
      );
      expect(third.revision).not.toBe(first.revision);
      expect(
        third.manifest.files.find((file) =>
          file.source === "references/quality.md"
        )?.sourceDigest,
      )
        .not.toBe(
          first.manifest.files.find((file) =>
            file.source === "references/quality.md"
          )?.sourceDigest,
        );
    });
  });

  it("builds whole and selected packs and preserves previous output after a failed build", async () => {
    await collection(async (root, temporary) => {
      const destination = join(temporary, "pack");
      const pack = await materializePack(root, destination);
      expect(pack.map((skill) => skill.skill)).toEqual(["alpha", "beta"]);
      for (const skill of pack) {
        await assertClosure(join(destination, skill.skill));
      }
      const digest = await tree.getDigest(destination);
      await Deno.writeTextFile(
        join(root, "guides/start.md"),
        "# Broken\n\n[Missing](missing.md)\n",
      );
      await expect(materializePack(root, destination)).rejects.toThrow();
      expect(await tree.getDigest(destination)).toBe(digest);
      await Deno.writeTextFile(
        join(root, "guides/start.md"),
        files["guides/start.md"],
      );
      const selected = await materializePack(root, destination, ["alpha"]);
      expect(selected.map((skill) => skill.skill)).toEqual(["alpha"]);
      await expect(Deno.stat(join(destination, "beta"))).rejects.toThrow();
      await Deno.writeTextFile(
        join(destination, "alpha", "extra.txt"),
        "User content\n",
      );
      await expect(materializePack(root, destination)).rejects.toThrow(
        /unowned or modified/,
      );
      expect(await Deno.readTextFile(join(destination, "alpha", "extra.txt")))
        .toBe("User content\n");
    });
  });

  it("restores edits made to previous output when staging starts", async () => {
    await collection(async (root, temporary) => {
      const destination = join(temporary, "pack");
      await materializePack(root, destination);
      const note = join(destination, "alpha/user-note.md");
      const makeTempDir = Deno.makeTempDir;
      let staged = false;
      Deno.makeTempDir = async (options) => {
        const path = await makeTempDir(options);
        if (options?.prefix === ".skill-bundle-") {
          staged = true;
          await Deno.writeTextFile(
            note,
            "Work added while the pack was staged.\n",
          );
        }
        return path;
      };
      try {
        await expect(materializePack(root, destination)).rejects.toThrow(
          /restored/,
        );
      } finally {
        Deno.makeTempDir = makeTempDir;
      }
      expect(staged).toBe(true);
      expect(await Deno.readTextFile(note)).toBe(
        "Work added while the pack was staged.\n",
      );
      const entries = [];
      for await (const entry of Deno.readDir(temporary)) {
        entries.push(entry.name);
      }
      expect(entries.some((name) => name.startsWith(".skill-bundle-"))).toBe(
        false,
      );
    });
  });

  it("preserves a new destination and retains edited previous output for recovery", async () => {
    await collection(async (root, temporary) => {
      const destination = join(temporary, "pack");
      await materializePack(root, destination);
      const makeTempDir = Deno.makeTempDir;
      const rename = Deno.rename;
      Deno.makeTempDir = async (options) => {
        const path = await makeTempDir(options);
        if (options?.prefix === ".skill-bundle-") {
          await Deno.writeTextFile(
            join(destination, "alpha/user-note.md"),
            "Preserve old work.\n",
          );
        }
        return path;
      };
      Deno.rename = async (oldPath, newPath) => {
        await rename(oldPath, newPath);
        if (oldPath === destination && String(newPath).endsWith(".previous")) {
          await Deno.mkdir(destination);
          await Deno.writeTextFile(
            join(destination, "new-owner.md"),
            "Preserve new work.\n",
          );
        }
      };
      try {
        await expect(materializePack(root, destination)).rejects.toThrow(
          /preserved at/,
        );
      } finally {
        Deno.makeTempDir = makeTempDir;
        Deno.rename = rename;
      }
      expect(await Deno.readTextFile(join(destination, "new-owner.md"))).toBe(
        "Preserve new work.\n",
      );
      const backups = [];
      for await (const entry of Deno.readDir(temporary)) {
        if (entry.name.endsWith(".previous")) {
          backups.push(join(temporary, entry.name));
        }
      }
      expect(backups).toHaveLength(1);
      expect(await Deno.readTextFile(join(backups[0], "alpha/user-note.md")))
        .toBe("Preserve old work.\n");
    });
  });

  it("rejects missing, escaping, reserved and symbolic dependencies", async () => {
    await collection(async (root, temporary) => {
      const entry = join(root, "skills/alpha/SKILL.md");
      for (
        const url of [
          "references/missing.md",
          "../../../../outside.md",
          "%2e%2e/%2e%2e/%2e%2e/outside.md",
          "/etc/passwd",
          "file:///etc/passwd",
          "C:private.md",
        ]
      ) {
        await Deno.writeTextFile(
          entry,
          files["skills/alpha/SKILL.md"] + `\n[Bad](${url})\n`,
        );
        await expect(materializeSkill(root, "alpha", join(temporary, "failed")))
          .rejects.toThrow();
      }
      await Deno.writeTextFile(entry, files["skills/alpha/SKILL.md"]);
      await Deno.symlink(
        join(root, "guides/start.md"),
        join(root, "skills/alpha/references/link.md"),
      );
      await expect(materializeSkill(root, "alpha", join(temporary, "failed")))
        .rejects.toThrow(/Symbolic/);
      await Deno.remove(join(root, "skills/alpha/references/link.md"));
      await Deno.mkdir(join(root, "skills/alpha/references/shared"));
      await Deno.writeTextFile(
        join(root, "skills/alpha/references/shared/duplicate.md"),
        "# Duplicate\n",
      );
      await expect(materializeSkill(root, "alpha", join(temporary, "failed")))
        .rejects.toThrow(/reserved/);
    });
  });

  it("refuses source outputs, redirected output ancestors and unowned directories", async () => {
    await collection(async (root, temporary) => {
      await expect(materializePack(root, root)).rejects.toThrow(
        /source collection/,
      );
      await expect(materializePack(root, join(root, "guides/output"))).rejects
        .toThrow(/authored/);
      await Deno.symlink(join(root, "guides"), join(temporary, "redirect"), {
        type: "dir",
      });
      await expect(materializePack(root, join(temporary, "redirect/output")))
        .rejects.toThrow(/ancestor/);
      const unrelated = join(temporary, "unrelated");
      await Deno.mkdir(unrelated);
      await Deno.writeTextFile(join(unrelated, "keep.md"), "Keep\n");
      await expect(materializePack(root, unrelated)).rejects.toThrow(
        /unowned or modified/,
      );
      expect(await Deno.readTextFile(join(unrelated, "keep.md"))).toBe(
        "Keep\n",
      );
    });
  });

  it("validates installed shared and root-document telemetry without target leakage", async () => {
    await collection(async (root, temporary) => {
      const workspace = join(temporary, "workspace");
      const candidate = join(workspace, "candidate/skills/alpha");
      const bundled = await materializeSkill(root, "alpha", candidate);
      const installed = await createSkills(workspace, "alpha", []);
      const baseline = join(temporary, "baseline");
      await Deno.mkdir(baseline);
      const response = RolloutResponseSchema.parse({
        schemaVersion: 1,
        kind: "rollout",
        model: "test",
        adapterVersion: "test",
        output: "Verified",
        activatedSkills: ["alpha"],
        referencesRead: [
          "alpha/cli.md",
          "alpha/references/shared/guides/start.md",
        ],
      });
      const options = {
        response,
        installedSkills: ["alpha"],
        skillsRoot: installed,
        skillRevisions: { alpha: bundled.revision },
        baselineRoot: baseline,
        baselineDigest: await tree.getDigest(baseline),
      };
      let withoutTarget: string | undefined;
      try {
        expect(await target.check(options)).toEqual([]);
        for (
          const reference of [
            "alpha/../GUIDANCE.md",
            "alpha/references/missing.md",
            "beta/cli.md",
            "alpha/SKILL.md",
          ]
        ) {
          expect(
            (await target.check({
              ...options,
              response: { ...response, referencesRead: [reference] },
            })).join("\n"),
          )
            .toContain("invalid references");
        }
        withoutTarget = await createSkills(workspace, undefined, []);
        expect(
          (await target.check({
            ...options,
            installedSkills: [],
            skillRevisions: {},
            skillsRoot: withoutTarget,
          })).join("\n"),
        )
          .toContain("uninstalled skills: alpha");
        const shared = join(
          installed,
          "skills/alpha/references/shared/guides/start.md",
        );
        await Deno.writeTextFile(shared, "Tampered\n");
        expect((await target.check(options)).join("\n")).toContain(
          "modified installed skill alpha",
        );
        expect(await tree.getDigest(candidate)).toBe(bundled.revision);
        await Deno.symlink(
          join(root, "guides/start.md"),
          join(installed, "skills/alpha/references/extra.md"),
        );
        expect((await target.check(options)).join("\n")).toContain(
          "Cannot verify installed skill alpha",
        );
      } finally {
        await Deno.remove(installed, { recursive: true });
        if (withoutTarget) {
          await Deno.remove(withoutTarget, { recursive: true });
        }
      }
    });
  });
});

describe("guidance syntax contracts", () => {
  it("rewrites parsed links and definitions while leaving example code untouched", () => {
    const source =
      '[a\\[b\\]](old.md) [![image](old.svg)](old.md)\n\n[key]: old.md "Title"\n\n`[code](old.md)`\n\n```md\n[code](old.md)\n```\n';
    const changed = rewriteMarkdown(source, (url) => `nested/${url}`);
    expect(markdownLinks(changed).map((link) => link.url))
      .toEqual([
        "nested/old.md",
        "nested/old.md",
        "nested/old.svg",
        "nested/old.md",
      ]);
    expect(changed).toContain("`[code](old.md)`");
    expect(changed).toContain("```md\n[code](old.md)\n```");
    expect(rewriteMarkdown(source, (url) => url)).toBe(source);
    expect(
      markdownLinks("---\n\n[Rule](reference.md)\n").map((link) => link.url),
    ).toEqual(["reference.md"]);
  });

  it("parses YAML metadata and admits safe shared and root document paths", () => {
    const vendor =
      "---\ntitle: Rule title\ntags: [docs, tests]\nsummary: '[Metadata example](missing.md)'\n---\n\n[Body](body.md)\n";
    expect(markdownLinks(vendor).map((link) => link.url)).toEqual(["body.md"]);
    expect(
      skillMetadata(
        "---\nname: sample\ndescription: >-\n  Read the local context.\n  Verify the result.\nmetadata:\n  revision: '1'\n---\n# Sample\n",
        "sample",
      ).description,
    )
      .toBe("Read the local context. Verify the result.");
    expect(() =>
      skillMetadata(
        "---\nname: sample\nname: sample\ndescription: Example\n---\n",
        "sample",
      )
    ).toThrow();
    expect(() =>
      skillMetadata(
        "---\nname: sample\ndescription: Example\nmetadata:\n  revision: 1\n---\n",
        "sample",
      )
    ).toThrow();
    for (
      const path of [
        "cli.md",
        "guides/style.md",
        "references/shared/handbook/adoption.md",
      ]
    ) {
      expect(DocumentPathSchema.safeParse(path).success).toBe(true);
    }
    for (
      const path of [
        "SKILL.md",
        "../guide.md",
        "references/../guide.md",
        "/guide.md",
        "C:\\guide.md",
      ]
    ) {
      expect(DocumentPathSchema.safeParse(path).success).toBe(false);
    }
  });
});
