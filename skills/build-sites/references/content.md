# Content and CMS boundaries

## Stable view models

Use this boundary:

```text
content collection or CMS record
  -> source-specific validation and mapping
  -> project-owned page model
  -> route, layout, and components
```

Pages should not spread raw provider records through the component tree. Map
slugs, authors, taxonomies, media, body, dates, draft state, and cache hints once.
Keep provider-specific rich-text rendering at an explicit boundary.

## Source modes

Distinguish:

- build-time content collections;
- request-time/live collections;
- local legacy content used only for migration;
- generated OpenAPI or service catalogs;
- drafts and previews;
- retained raw evidence for reproducible migration.

One repository may contain more than one mode, but each route needs one runtime
source of truth.

## Failure states

Test missing media, incomplete author/taxonomy records, drafts, deleted content,
provider outage, stale cache, invalid rich text, redirect/canonical changes, and
feed generation. Define whether build should fail, skip, retain stale content, or
render a safe fallback.

## Discoverability

Keep canonical URLs, titles, descriptions, social cards, structured data,
sitemap, robots policy, redirects, and RSS/Atom aligned with the route/content
model. Validate absolute URLs and environment-specific origins.
