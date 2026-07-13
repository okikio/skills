# Solid application ownership

## Reactive values

- Signals own mutable local state.
- Memos own derived values.
- Effects synchronize with external systems; they are not a default derivation
  mechanism.
- Props are live access paths and should not be destructured casually.
- Control-flow components preserve Solid's ownership semantics better than
  React-shaped list and conditional translations.

## Solid Primitives

Before writing browser, scheduling, event, media, observer, root, props, or
transition utilities, inspect the relevant Solid Primitives package. Check its
maturity stage, server behavior, sibling dependencies, `make*` versus `create*`
API, owner cleanup, and tests.

Examples of distinct concerns include event listeners, scheduled debounce and
throttle, media queries, rootless subroots/singletons, ref composition, prop
merging, and transition groups. Do not install the whole ecosystem by default.

## SSR and cleanup

Gate DOM and layout behavior behind mount. Keep initial server/client output
deterministic. Dispose listeners, observers, frames, timers, subscriptions,
workers, animation values, and retained roots on owner cleanup.

Test mount/unmount counts and repeated route navigation. Type signatures alone
do not prove cancellation or cleanup is wired to the active owner.
