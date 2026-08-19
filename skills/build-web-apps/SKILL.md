---
name: build-web-apps
description: Design, implement, refactor, review, diagnose, or verify stateful web applications with routing, URL state, server functions, remote query caches, sessions, authorization, local interaction state, complex forms, tables, virtualization, product UI, accessibility, and browser lifecycles. Use especially when SolidJS, TanStack Start/Router/Query/Form/Table/Virtual, Better Auth, Zod, Zaidan, Kobalte, Corvu, shadcn-style generation, or Solid Primitives are installed or under review. Do not use as the primary skill for a content-only marketing or documentation site.
---

# Build stateful web applications

This skill owns state placement and product interaction across routes, server
calls, remote caches, sessions, forms, tables, local UI, and browser lifetimes.
When `build-web` is active, consume its shared renderer, component, motion,
security, and browser map. `deliver-software` owns repository completion.

## Outcome

A stateful application should have one understandable owner for each state class:

| State | Typical owner |
|---|---|
| Shareable filters, sorting, page, selected view | Validated URL/router state |
| Remote records, freshness, loading, invalidation | Selected query/cache owner |
| Server input and response contract | Server function or API schema |
| Draft input before commit | Framework-local form/interaction state |
| Dialogs, row selection, ephemeral controls | Framework-local state |
| Derived local values | Framework-native derivation/memo |
| Session and organization scope | Auth/session owner plus server authorization |
| Durable business records | Service/database owner |

Do not put all state in signals, all state in Query, or all state in the URL.
Choose by authority, lifetime, shareability, invalidation, and persistence.

## Evidence preflight

Trace:

- route tree, layouts/shells, search-param schemas, redirects, and deep links;
- loaders, server functions/actions, API clients, and validation;
- query-key factories, cache defaults, mutations, invalidation, retries, and
  optimistic state;
- forms, field schemas, async validation, submissions, and error mapping;
- session/auth plugins, organization selection, cookies, and server guards;
- tables, sorting/filtering, selection, pagination, virtualization, and stable
  identity;
- component primitives, generated UI, tokens, icons, fonts, and motion;
- owners/effects/listeners/observers/workers and their cleanup;
- SSR/hydration, client navigation, browser storage, offline/network failures;
- tests that exercise real navigation and authenticated state changes.

A hook, loader, or query definition existing in source is not proof that the
reachable route uses it.

## Procedure

1. **Map state authority before coding.** Write down the owner and lifetime of
   URL, remote, session, local, and durable state. Remove accidental mirrors.
2. **Validate URL state.** Search params are user input. Parse them through a
   schema, canonicalize defaults, and reset dependent state such as page when a
   filter changes.
3. **Keep remote identity stable.** When TanStack Query is selected, loaders and
   components should share query-key/options factories. Define stale time,
   retry, invalidation, cancellation, placeholder/loading/error distinctions,
   and mutation reconciliation.
4. **Preserve framework lifetimes.** In Solid, component functions establish a
   reactive graph; updates do not rerun the component like React. Keep reactive
   reads tracked and dispose subscriptions/resources with the owning reactive
   owner.
5. **Treat forms as state machines.** Distinguish client validation, server
   validation, pending submission, provider errors, duplicate submits, async
   race cancellation, success, and reset/navigation behavior.
6. **Authenticate then authorize.** A session proves identity, not permission to
   an organization or record. Apply server-owned organization/resource policy to
   every read/write path.
7. **Keep table/virtual identities deterministic.** Sorting, filtering,
   selection, pagination, and virtual rows must use stable IDs and explicitly
   defined server/client ownership.
8. **Compose generated UI without losing semantics.** Preserve primitive
   behavior, CSS/tokens, accessible names, focus, keyboard behavior, and
   renderer-specific imports.
9. **Document internal state rules.** Query-key composition, URL canonicalization,
   auth transitions, optimistic rollback, selection identity, and async race
   handling often deserve comments/TSDoc even when private.

## Failure and concurrency review

Test the cases that commonly escape happy-path demos:

- back/forward navigation after filters or pagination change;
- malformed/unknown URL values;
- query response arriving after route/session/organization changes;
- stale cache crossing account or tenant scope;
- optimistic mutation rejection and rollback;
- double submit or stale async form validator;
- expired session during a mutation;
- unauthorized deep link;
- SSR request data leaking into another request;
- ownerless Solid subscription or timer surviving navigation;
- virtualized row selection changing when rows reorder;
- offline/retry loops and server failures;
- modal/drawer focus and reduced-motion behavior.

## Verification ladder

1. schema and state-transition tests;
2. server-function/API tests with malformed and unauthorized input;
3. query/form/table focused tests;
4. SSR/hydration and deep-link tests;
5. real browser navigation, back/forward, session switch, and organization
   switch;
6. keyboard, focus, responsive, reduced-motion, and touch behavior;
7. cleanup after navigation/unmount;
8. representative-data performance for large tables or virtualized views.

Mocked component success is supporting evidence. It is not a substitute for a
browser flow when the claim is about navigation, hydration, focus, or lifecycle.

## Reference routing

- [tanstack.md](references/tanstack.md): TanStack Start, Router, Query, Form,
  Table, Virtual, SSR, cache ownership, and ecosystem integration.
- [solid.md](references/solid.md): Solid reactivity, owners, cleanup, SSR,
  primitives, resources, and renderer-specific behavior.
- [auth.md](references/auth.md): Better Auth, server/client plugin symmetry,
  sessions, organizations, cookies, authorization, and failure states.
- [forms.md](references/forms.md): validated form state, async races, mutations,
  errors, accessibility, and server trust.
- [data-views.md](references/data-views.md): URL/query ownership, tables,
  virtualization, selection, pagination, and representative-data behavior.
- [verification.md](references/verification.md): end-to-end route, auth,
  navigation, state, browser, accessibility, and cleanup checks.

## Completion gate

Do not call application work complete until deep links and navigation preserve
the intended state model, server authorization is proven, remote cache identity
and invalidation behave correctly, failure states are usable, SSR/hydration are
verified where claimed, browser resources clean up, and the key product flow has
run in a real browser with representative state.
