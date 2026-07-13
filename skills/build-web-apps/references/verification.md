# Web application verification

## State oracles

- A copied deep link reconstructs filters, sort, page, and view.
- Changing a filter resets dependent pagination predictably.
- Loader and component reuse one query key/options factory.
- Selection and dialog state do not pollute URL or remote cache without reason.
- Invalid URL and direct server-function input fail through the intended schema.
- Stale, loading, empty, partial, and error states remain distinguishable.

## Identity and security

- Importing auth modules does not require production environment values.
- Server/client plugin IDs and framework bindings align.
- Issuer, discovery, handler mount, cookies, and trusted origins agree.
- A user authenticated in one organization cannot query another organization's
  data.
- Public errors contain no database/provider secrets while diagnostics preserve
  a redacted cause.

## Browser and lifetime

Server-render and hydrate representative routes while capturing diagnostics.
Navigate repeatedly, mount/unmount interactive components, and assert listener,
observer, timer, frame, subscription, and retained-root cleanup. Verify keyboard,
focus, accessible names, responsive overflow, touch, reduced motion, and failure
fallbacks.

## Build and deployment

Run typecheck, unit/integration tests, production SSR build, server-function/API
tests, and an adapter-equivalent browser flow. Verify environment separation,
assets, source maps, headers, cookies, and clean deployment startup.
