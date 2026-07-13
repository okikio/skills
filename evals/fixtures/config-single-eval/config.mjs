let evaluations = 0;

export function loadConfig() {
  evaluations += 1;
  return { project: "fixture", evaluations };
}

export function evaluationCount() {
  return evaluations;
}
