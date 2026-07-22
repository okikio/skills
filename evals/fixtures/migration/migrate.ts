export function migrate(): Promise<void> {
  throw new Error("fixture migration must not target ambient production");
}
