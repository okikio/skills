function redactByField(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) =>
      /token|password|authorization/i.test(key)
        ? [key, "[REDACTED]"]
        : [key, value]
    ),
  );
}

export function renderResult(value) {
  const serialized = JSON.stringify(value);
  return JSON.stringify(redactByField({ result: serialized }));
}
