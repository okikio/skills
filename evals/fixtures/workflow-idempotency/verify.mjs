import { all, start } from "./store.mjs";

const results = await Promise.all(
  Array.from({ length: 20 }, () => start("same")),
);
if (all().length !== 1) throw new Error("concurrent starts created duplicates");
if (new Set(results.map((item) => item.id)).size !== 1) {
  throw new Error("idempotent starts returned different executions");
}
