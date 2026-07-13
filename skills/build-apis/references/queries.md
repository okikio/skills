# Query contracts and pagination

## Normalize sources

Query, JSON, and form inputs may use different source syntax but should normalize
into one validated query request. Keep filters, sorts, selected fields,
pagination, and count policy explicit.

Disabled features should normalize to `null` or a rejected input according to
the public contract. Do not silently accept an ignored filter or sort.

## Server-owned policy

Apply tenant, organization, soft-delete, visibility, and other server-owned base
constraints before user-controlled filters. Validate allowed fields/operators and
map public names to storage expressions rather than interpolating arbitrary input.

## Pagination

Treat cursor and offset pagination as distinct discriminated contracts. Define
stable ordering and tie-breakers before cursors. Specify behavior for invalid,
expired, or cross-filter cursors and for inserts/deletes between pages.

## Count strategy

| Strategy | Use when | Limitation |
|---|---|---|
| Exact | Correct total is required and affordable | Can dominate query cost |
| Planned | Approximation should reflect the filtered query | Planner estimate, not exact |
| Estimated | Coarse relation-level UI hint is enough | May ignore active filters |
| None | Current page/continuation is sufficient | No total pages |

Do not label a relation estimate as the exact filtered total.

## Verification

Test server base filters, allowed/forbidden fields, compound sort stability,
cursor round trips, empty pages, duplicates, concurrent writes, each count mode,
database errors, and the actual generated query or protocol request.
