# Renderers, islands, SSR, and hydration

## Native before island

Use semantic HTML such as disclosure, dialog, form, navigation, and media
features when it meets the behavior. Hydrate only when reactive component
ownership materially helps.

In an Astro site:

- Astro owns route, layout, content, metadata, and static structure;
- a narrow script or custom element can own isolated DOM behavior;
- a Solid or React island owns a renderer-specific interactive subtree;
- the client directive should match urgency and visibility;
- `client:only` requires enough renderer information because Astro cannot infer
  a renderer from skipped server output.

## Renderer contract

Align:

- integration/plugin;
- JSX compiler and types;
- icon compiler;
- component registry and generated code;
- client directive;
- server adapter;
- auth client/server binding;
- test environment.

Do not copy a React shadcn example into Solid or assume a generic auth client is
the correct TanStack Start binding.

## Solid semantics

Solid component props are live access paths. Do not destructure reactive props
into stale values. Use signals for mutable local state, memos for derived state,
and effects only for synchronization with external systems.

Every listener, observer, frame, timer, subscription, animation, singleton root,
and retained owner needs explicit lifetime and cleanup. Browser work starts after
mount. Server output and initial client state must be deterministic to avoid
hydration mismatch and first-paint flashes.

Solid version differences belong behind an adapter until tests prove the new
runtime behavior. A type-compatible prototype is not production parity.
