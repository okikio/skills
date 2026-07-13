import { evaluationCount, loadConfig } from "./config.mjs";

export function run() {
  const sourceContext = loadConfig();
  const handlerConfig = loadConfig();
  return { sourceContext, handlerConfig, evaluations: evaluationCount() };
}
