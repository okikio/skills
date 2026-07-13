# Ecosystem topology

## Discovery surfaces

Inspect more than the package landing page:

- workspace declarations and package directories;
- root and nearest package manifests;
- export maps and registry metadata;
- organization repositories and pinned projects;
- documentation navigation and integration indexes;
- examples, starters, templates, presets, and test fixtures;
- source imports and peer/optional dependencies;
- release workflows, changelogs, and deprecation notices;
- protocol or specification implementations outside the owner organization.

## Relationship classes

Use one of these labels for each related project:

| Label | Required evidence |
|---|---|
| First-party workspace sibling | Same verified workspace and owner |
| First-party repository sibling | Same verified owner with an explicit relationship |
| Official adapter or plugin | Listed and maintained through official project surfaces |
| Specification peer | Implements the same documented interoperability contract |
| Community integration | Third-party project with no first-party guarantee |
| Alternative | Overlaps ownership and normally replaces rather than complements |
| Incidental adjacency | Similar domain or organization, no task-relevant contract |
| Unresolved | Identity or relationship could not be established |

Never turn adjacency into compatibility. Similar names, shared maintainers,
organization membership, mirrored APIs, or an ecosystem directory are leads,
not guarantees.

## Ecosystem patterns

- Monorepos often split core, adapters, integrations, testing, configuration,
  and presentation across packages. Search exports and package manifests before
  assuming the core package is the entire product.
- Multi-repository ecosystems such as UnJS can be cohesive without one
  monorepo. Select packages by capability ownership, not by brand membership.
- Specification ecosystems such as Standard Schema or unified connect projects
  through contracts. Confirm conformance and version boundaries independently.
- Framework ecosystems may offer renderer-specific bindings. A React example
  does not prove a Solid, Vue, server, or native binding exists.
- Private and personal ecosystems may only be observable through consuming
  repositories. Treat remembered names as discovery hints until source is found.
