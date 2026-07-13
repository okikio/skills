const executions = [];

export async function start(key) {
  const existing = executions.find((item) => item.key === key);
  await Promise.resolve();
  if (existing) return existing;
  const execution = { id: crypto.randomUUID(), key };
  executions.push(execution);
  return execution;
}

export function all() {
  return executions;
}
