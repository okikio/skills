import { state } from "./state.mjs";

for (const name of ["filters", "page"]) {
  if (!state.url.includes(name)) throw new Error(`${name} is not URL state`);
}
if (!state.query.includes("results")) {
  throw new Error("results are not query state");
}
for (const name of ["selection", "dialog"]) {
  if (!state.signals.includes(name)) {
    throw new Error(`${name} is not local state`);
  }
}
if (
  state.signals.some((name) => ["filters", "page", "results"].includes(name))
) {
  throw new Error("shareable or remote state remains in local signals");
}
