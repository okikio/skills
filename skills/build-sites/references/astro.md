# Astro sites

## Rendering decision

- Use static output when routes can be produced at build time.
- Use server output when request-time identity, live data, or uncached dynamic
  behavior requires it.
- Use per-route prerendering in a server project where a route remains static.
- Add a deployment adapter only when the selected output and host require it.

## Page ownership

Astro owns routes, layouts, metadata, content, and static structure. Prefer
native disclosure, dialog, form, image, and navigation behavior. Use an inline
script or custom element for narrow DOM behavior; use a framework island for
reactive ownership that cannot remain local.

Choose `client:load`, `client:idle`, `client:visible`, media conditions, or
`client:only` from urgency and rendering constraints. An above-the-fold pointer
interaction and a below-fold visualization should not automatically share the
same directive.

## Navigation lifecycle

View transitions and `astro:page-load` can execute initialization repeatedly.
Make handlers idempotent, delegate where possible, or remove prior listeners.
Respect hash navigation, focus, browser history, and reduced motion. Do not
globally force smooth scrolling without preference and accessibility handling.

## Renderer alignment

Verify each island's framework integration, JSX settings, icon compiler, client
directive, and test environment. A bare `client:only` may require an explicit
renderer hint because Astro skips server rendering.

For example, a React component that must never server-render uses
`client:only="react"`, and the matching Astro React integration must be installed
and configured. Use the actual renderer name and verify it with Astro check and
the production build.

## Build proof

Run Astro check and the actual production build. Verify generated routes,
prerendered pages, adapter output, assets, redirects, headers, and one deployed or
adapter-equivalent request flow.
