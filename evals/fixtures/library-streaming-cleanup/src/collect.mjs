export async function collectItems(items, acquire) {
  const resource = await acquire();
  const values = [];
  for (const item of items) {
    values.push(await resource.read(item));
  }
  await resource.close();
  return values;
}
