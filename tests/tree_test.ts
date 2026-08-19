import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { join } from "node:path";
import * as tree from "../src/tree.ts";

describe("tree snapshots", () => {
  it("hashes text and binary files deterministically", async () => {
    const root = await Deno.makeTempDir({ prefix: "skills-tree-" });
    try {
      await Deno.writeTextFile(join(root, "a.txt"), "alpha\n");
      await Deno.writeFile(join(root, "b.bin"), new Uint8Array([0, 255, 1]));

      const first = await tree.snapshot(root);
      const second = await tree.snapshot(root);
      expect(await tree.digest(first)).toBe(await tree.digest(second));
      expect(await tree.getDigest(root)).toBe(await tree.digest(first));
      expect(first.get("b.bin")?.text).toBeUndefined();
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it("reports changed paths and bounded text line deltas", async () => {
    const root = await Deno.makeTempDir({ prefix: "skills-tree-" });
    try {
      await Deno.writeTextFile(join(root, "a.txt"), "one\ntwo\n");
      const before = await tree.snapshot(root);

      await Deno.writeTextFile(join(root, "a.txt"), "one\nthree\n");
      await Deno.writeTextFile(join(root, "new.txt"), "new\n");
      const after = await tree.snapshot(root);
      const changes = tree.compare(before, after);

      expect(changes.changedFiles).toEqual(["a.txt", "new.txt"]);
      expect(changes.addedLines).toBeGreaterThan(0);
      expect(changes.deletedLines).toBeGreaterThan(0);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
