---
name: build-web-apps
description: Design, implement, refactor, review, or verify stateful web applications with routing, URL state, server functions, query caches, sessions, authorization, local interaction state, complex forms, tables, and product UI. Use especially for SolidJS, TanStack Start, Router, Query, Form, Table, Virtual, Zod, Better Auth, Zaidan, Kobalte, Corvu, shadcn, and Solid Primitives. Do not use as the primary skill for a content-only marketing or documentation site.
---

# Build stateful web applications

When `build-web` is active, use its shared renderer, component, motion, security,
and browser contracts. Otherwise apply those contracts locally as needed. This
skill owns application state placement, route/server boundaries, query identity,
sessions, authorization, and product interaction.

## State ownership model

| State | Default owner |
|---|---|
| Shareable filters, sorting, page, selected view | Validated URL/router state |
| Remote records, freshness, loading, invalidation | Selected remote-cache owner |
| Server input and response boundary | Validated server function/API |
| Draft input before commit/debounce | Framework-local interaction state |
| Open dialogs, row selection, transient interaction | Framework-local interaction state |
| Derived local values | Framework-native derivation |
| Session and organization scope | Selected session owner plus server guard |
| Durable business records | Service/database owner |

Do not put every state in signals, the URL, or Query. Choose by lifetime,
shareability, authority, and invalidation.

## Procedure

1. Inventory route tree, shells, auth boundaries, search schemas, loaders, server
   functions, query keys, forms, tables, local state, and connected services.
2. Validate URL state and server inputs with shared schema semantics. Canonicalize
   defaults and reset dependent state such as page when filters change.
3. When TanStack Query is selected, keep loader preloads and component queries on the same query-key and option
   factory. Define stale time, invalidation, retries, and error states.
4. Preserve the selected framework's reactivity and lifetimes. For Solid, keep
   reactive access, owner cleanup, and SSR determinism.
5. When Better Auth is selected, align server/client/framework plugins, cookies, issuer/mount,
   organization selection, and server-side authorization.
6. Compose generated components with their primitive, CSS, token, icon, and
   accessibility contracts intact.
7. Verify deep links, navigation, SSR/hydration, malformed URL and server input,
   cache behavior, session/org isolation, keyboard/focus, responsive states, and
   resource cleanup.

## Reference routing

- [tanstack.md](references/tanstack.md): load when TanStack Start, Router, Query,
  Form, Table, or Virtual is installed, selected, or under review.
- [solid.md](references/solid.md): load when Solid is installed, selected, or
  under review for reactivity, owners, cleanup, SSR, and component boundaries.
- [auth.md](references/auth.md): load when Better Auth is installed, selected,
  or under review for bindings, sessions, organization authorization,
  issuer/mount, and import-safe construction.
- [forms.md](references/forms.md): draft and committed state, validation,
  submission races, mutations, optimistic behavior, and rollback.
- [data-views.md](references/data-views.md): table state, row identity,
  selection, server ownership, virtualization, keyboard access, and SSR.
- [verification.md](references/verification.md): state, browser, security, and
  failure oracles.

When `build-web` has produced a surface map, consume it and inspect only
unresolved application evidence. Do not repeat repository-wide discovery.
