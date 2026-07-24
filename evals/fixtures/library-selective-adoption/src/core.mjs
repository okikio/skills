export function analyze(values) {
  return values.reduce((sum, value) => sum + value, 0);
}
