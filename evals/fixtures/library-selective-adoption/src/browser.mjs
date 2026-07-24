globalThis.__fixtureBrowserAdapterLoaded = true;

export function createBrowserAdapter() {
  return { kind: "browser" };
}
