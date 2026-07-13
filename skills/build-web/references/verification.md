# Web verification

## Build matrix

Run the repository-owned static and server builds separately. Verify the selected
deployment adapter, renderer integrations, generated routes, source maps, assets,
and environment contract. Typecheck does not replace a production build.

## SSR and hydration

Capture server HTML and hydrate it while collecting mismatch diagnostics. Cover
initial styles, media queries, local persistence, random/time values, client-only
components, and failure fallbacks.

## Browser behavior

Test keyboard navigation, focus order/return, accessible names, validation and
errors, loading/empty/partial/stale states, responsive overflow, zoom, touch,
reduced motion, forced colors, and disabled JavaScript where the surface promises
progressive enhancement.

Dispatch navigation lifecycle events more than once. Assert handlers remain
idempotent and listener effects do not multiply.

## Resource and performance checks

Count listener add/remove, observers, frame requests/cancellations, timers,
subscriptions, workers, WebGL contexts, and retained owners across mount/unmount
and navigation. Measure bundle composition, island hydration, icon inclusion,
font loading, long tasks, layout shift, and continuous background work.

## Connected systems

Exercise real route loaders, server functions, session cookies, auth guards,
query identity/invalidation, CMS adapters, webhooks, CORS, and OpenAPI generation.
Use safe fixtures and never require production targets without authorization.
