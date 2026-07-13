---
name: build-sites
description: Design, implement, migrate, review, or verify content-first websites, marketing sites, documentation, blogs, and CMS-backed publishing. Use for Astro routes, layouts, content collections, live CMS adapters, islands, SEO, feeds, fonts, icons, deployment adapters, and static or server rendering. Do not use as the primary skill for a stateful product application with substantial URL, query-cache, session, and local interaction state.
---

# Build content-first sites

When `build-web` is active, use its shared renderer, component, motion, security,
and browser contracts. Otherwise apply those contracts locally as needed. This
skill owns content models, page composition, rendering choice, CMS boundaries,
discoverability, feeds, and site deployment.

## Procedure

1. Inventory routes, layouts, content sources, collections, feeds, redirects,
   interactive islands, API endpoints, and deployment target.
2. Classify each route as static, prerendered inside a server project,
   request-rendered, or client-only. Choose from data and identity needs.
3. Keep the selected site framework responsible for page structure and content.
   In Astro, keep those surfaces in Astro and use native HTML before scripts and
   scripts before framework islands when the behavior permits it.
4. Map external content into project-owned validated view models before pages
   consume it. Distinguish migration inputs from runtime sources.
5. Define drafts, previews, missing content/media, cache, invalidation, redirects,
   canonical URLs, metadata, structured data, sitemap, and feed behavior.
6. Align renderer-specific islands, client directives, icons, styles, fonts, and
   component registries.
7. Verify static/server builds, broken links, content variants, hydration,
   accessibility, performance, endpoint security, and deployed adapter behavior.

## Reference routing

- [astro.md](references/astro.md): load when Astro is installed, selected, or
  under review for output, adapters, routes, layouts, islands, scripts, and
  navigation lifecycle.
- [content.md](references/content.md): collections, live CMS, view models,
  drafts, media, cache, feeds, and migration.
- [site-quality.md](references/site-quality.md): SEO, accessibility,
  performance, assets, and verification.
- [casebook.md](references/casebook.md): Kaiju and ThunderStrike patterns and
  counterexamples.

Do not claim browser-extension support from the attached site-scope repository;
it contains Astro and TanStack applications but no extension implementation.

When `build-web` has produced a surface map, consume it and inspect only
unresolved site evidence. Do not repeat repository-wide discovery.
