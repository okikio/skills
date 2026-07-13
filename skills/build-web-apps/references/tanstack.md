# TanStack application state

## Route and URL contract

Use a schema for search params. Strip defaults from canonical URLs where the
router supports it, preserve deep-linkable state, and reset pagination or other
dependent values when filters change. Pathless layouts can own authenticated
shells and route context without changing the URL.

## Query contract

Centralize query keys and option factories. The route loader and rendered
component must reuse the same identity. Define stale time, garbage collection,
retry, placeholder/previous data, cancellation, and invalidation from product
semantics.

Do not store server-cache data in ad hoc signals. Do not store local row selection
or dialog state in Query. A search draft can remain local until debounced and
committed to validated URL state.

## Server functions

Treat client validation as ergonomics, not trust. Validate again at the server
boundary, authenticate, authorize tenant/organization scope, apply server-owned
filters, and return a stable safe result contract.

Align server-function input, route search schema, query key, and persistence
query semantics. One field should not mean different things at these layers.

## Ecosystem selection

Map TanStack Start, Router, Query, Form, Table, and Virtual by responsibility.
Install only the packages required by the application surface and renderer.
Verify Solid-specific APIs rather than copying React examples.
