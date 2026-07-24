import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const manifest = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(manifest.type, "module");
assert.equal(manifest.sideEffects, false);
assert.equal(typeof manifest.exports, "object");
assert.ok(manifest.exports["."]);
assert.ok(manifest.exports["./core.js"]);
assert.ok(manifest.exports["./browser.js"]);

function run(source) {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

assert.equal(
  run(`
    import { analyze } from "@fixture/selective-library/core.js";
    if (globalThis.__fixtureBrowserAdapterLoaded) throw new Error("browser adapter loaded from core");
    console.log(analyze([1, 2, 3]));
  `),
  "6",
);

assert.equal(
  run(`
    import { analyze } from "@fixture/selective-library";
    if (globalThis.__fixtureBrowserAdapterLoaded) throw new Error("browser adapter loaded from root");
    console.log(analyze([2, 3]));
  `),
  "5",
);

assert.equal(
  run(`
    import { createBrowserAdapter } from "@fixture/selective-library/browser.js";
    if (globalThis.__fixtureBrowserAdapterLoaded) throw new Error("browser import mutated globals");
    console.log(createBrowserAdapter().kind);
  `),
  "browser",
);

const rootSource = await readFile("src/index.mjs", "utf8");
assert.doesNotMatch(rootSource, /browser\.mjs/);
console.log("selective adoption verified");
