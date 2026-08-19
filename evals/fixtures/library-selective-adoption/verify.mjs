import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

/** Fail the fixture verifier with a concrete invariant. */
function check(condition, message) {
  if (!condition) throw new Error(message);
}

/** Run one clean Node consumer and return its trimmed stdout. */
function run(source) {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  check(result.status === 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

const manifest = JSON.parse(await readFile("package.json", "utf8"));
check(manifest.type === "module", "package must be ESM");
check(manifest.sideEffects === false, "package must declare sideEffects=false");
check(typeof manifest.exports === "object", "package must expose exports");
check(Boolean(manifest.exports["."]), "package root export is missing");
check(Boolean(manifest.exports["./core.js"]), "core export is missing");
check(Boolean(manifest.exports["./browser.js"]), "browser export is missing");

check(
  run(`
    import { analyze } from "@fixture/selective-library/core.js";
    if (globalThis.__fixtureBrowserAdapterLoaded) {
      throw new Error("browser adapter loaded from core");
    }
    console.log(analyze([1, 2, 3]));
  `) === "6",
  "core consumer returned the wrong result",
);

check(
  run(`
    import { analyze } from "@fixture/selective-library";
    if (globalThis.__fixtureBrowserAdapterLoaded) {
      throw new Error("browser adapter loaded from root");
    }
    console.log(analyze([2, 3]));
  `) === "5",
  "root consumer returned the wrong result",
);

check(
  run(`
    import { createBrowserAdapter } from "@fixture/selective-library/browser.js";
    if (globalThis.__fixtureBrowserAdapterLoaded) {
      throw new Error("browser import mutated globals");
    }
    console.log(createBrowserAdapter().kind);
  `) === "browser",
  "browser consumer returned the wrong result",
);

const rootSource = await readFile("src/index.mjs", "utf8");
check(!/browser\.mjs/.test(rootSource), "root source imports the browser adapter");
console.log("selective adoption verified");
