---
name: build-web
description: Classify and coordinate web work that spans or is ambiguous between content sites, documentation, stateful applications, server rendering, interactive islands, design systems, accessibility, motion, and browser behavior. Use for hybrid or cross-surface web architecture and for shared renderer, component, styling, security, and verification decisions. Prefer build-sites for a clearly content-first site and build-web-apps for a clearly stateful product application.
---

# Build web systems

This is the shared router for web work. `build-sites` owns content, marketing,
documentation, and CMS surfaces. `build-web-apps` owns stateful product
applications. Do not infer browser-extension behavior from a repository name;
extension work needs its own manifest/runtime evidence.

## Classify every surface

For each application or route group, identify:

- purpose: marketing, content, documentation, product application, admin, or
  hybrid;
- output: static, server-rendered, client-rendered, or mixed;
- state owners: URL, server cache, local interaction, session, and durable data;
- renderer: Astro template, Solid, React, native HTML, or another binding;
- deployment adapter and connected API/auth/data systems;
- accessibility, performance, security, and failure requirements.

A monorepo may contain several classifications. Do not force one framework
policy over an Astro docs app, runtime CMS, and TanStack product app together.

## Shared rules

1. Use native HTML and CSS before hydration when browser semantics suffice.
2. Keep renderer-specific APIs, icon compilers, auth plugins, and component
   bindings aligned. Similar component names do not prove compatibility.
3. Give URL state, remote cache, local interaction, session, and durable records
   distinct owners.
4. Preserve framework reactivity and lifetime semantics. Never translate React
   lifecycle patterns mechanically into Solid.
5. Inspect component registry files, generated styles, primitives, tokens, and
   import graphs before copying generated UI.
6. Treat motion as progressive enhancement with deterministic first paint,
   reduced-motion policy, visibility budgeting, cleanup, and a visual fallback.
7. Inspect endpoints, cookies, CORS, auth bindings, secrets, PII, and server
   adapters as part of the web system, not unrelated backend details.
8. Verify static/server builds, SSR and hydration, keyboard/focus behavior,
   responsive states, browser failures, cleanup, and performance budgets.

## Reference routing

- [surfaces.md](references/surfaces.md): classification and ownership.
- [renderers.md](references/renderers.md): Astro, Solid, React, native HTML,
  islands, SSR, and hydration boundaries.
- [components.md](references/components.md): Zaidan, shadcn, Kobalte, Corvu,
  styles, tokens, icons, and fonts.
- [motion.md](references/motion.md): Solid lifetimes, presence, Motion, SSR,
  cleanup, visibility, reduced motion, and fallbacks.
- [security.md](references/security.md): forms, webhooks, auth, cookies, CORS,
  secrets, and PII.
- [verification.md](references/verification.md): build, browser,
  accessibility, performance, and connected-system checks.
- [failures.md](references/failures.md): evidence-grounded failure signatures.

When composed, discover routes and manifests once, then let the site or app
skill own its domain decisions. `deliver-software` owns the completion verdict.
