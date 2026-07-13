# Tables, lists, and virtualized views

## Ownership

Decide which sorting, filtering, grouping, pagination, and column state is
shareable in the URL, executed by the server, cached remotely, or local to the
view. Large data sets normally keep filtering/sorting/pagination server-owned;
the table library owns presentation state, not database semantics.

Use stable domain row identity. Array index is not a durable selection key across
sort, pagination, refresh, insertion, or virtualization.

## Selection

Define whether selection applies only to loaded rows, the current query, or an
explicit all-matching set with exclusions. Keep selection policy separate from
checkbox rendering and verify organization/tenant boundaries on bulk actions.

## Virtualization

Virtualization changes DOM presence, measurement, focus, screen-reader, and SSR
behavior. Use it only after measuring the need. Define estimated/dynamic size,
overscan, scroll restoration, sticky headers, resize handling, and hydration.

Do not make keyboard focus disappear when a row leaves the rendered window.
Provide accessible row/column relationships and a non-virtualized or paginated
fallback where the product requires it.

## Verification

Test stable sorting and pagination, row reordering, selection across refresh and
pages, empty/loading/error states, bulk authorization, keyboard navigation,
screen-reader structure, resize, zoom, large data, scroll restoration, SSR, and
memory/DOM bounds.
