# Web surface classification

| Surface | Primary owner | Typical rendering | State emphasis |
|---|---|---|---|
| Marketing/content | `build-sites` | Static or selective server rendering | Content and minimal interaction |
| Documentation/API reference | `build-sites` | Static generation where possible | Source-owned documents |
| Runtime CMS | `build-sites` | Server rendering with cache policy | CMS mapped to stable view models |
| Product application | `build-web-apps` | SSR plus client reactivity | URL, query cache, local, session |
| Hybrid route group | Both, with route-level ownership | Mixed | Explicit boundaries |
| Browser extension | Separate evidence required | Extension runtime-specific | Manifest, contexts, permissions |

## Classification questions

- Must the page reflect request-time identity or live data?
- Can content be built ahead of time?
- Which interactions need long-lived reactive ownership?
- Which state must be shareable in the URL?
- Which data is cached remote state rather than UI state?
- Which component renderer owns the DOM?
- Does the deployment host require an adapter?
- What happens without JavaScript, WebGL, network, auth, or a third-party CMS?

Global server output does not mean every page must render at request time. A
project may prerender its homepage while serving other routes dynamically.
Static output can still generate rich API documentation from build-time OpenAPI
factories.

## Import-graph rule

Inspect reachable entrypoints. Unused components, migration inputs, abandoned
experiments, and installed dependencies are evidence of exploration, not
endorsed architecture.
