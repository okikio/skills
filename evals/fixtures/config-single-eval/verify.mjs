import { run } from "./program.mjs";

const result = run();
if (result.evaluations !== 1) {
  throw new Error(`config evaluated ${result.evaluations} times`);
}
if (result.sourceContext !== result.handlerConfig) {
  throw new Error("parser and handler do not share the resolved config");
}
