# Failure signatures and counterexamples

| Signature | Likely cause | Next evidence |
|---|---|---|
| Core package appears too small for documented features | Capability lives in siblings or adapters | Workspace packages, exports, integration index |
| Example imports a package absent from the repository | Version drift, unpublished example, or separate repo | Example revision, registry metadata, release notes |
| Types pass but runtime fails | Host, native, bundler, or lifecycle incompatibility | Exact runtime matrix and executable reproduction |
| Two tools both configure the same concern | Duplicate ownership | Composition root and configuration provenance |
| Adapter API resembles another dialect | Unsupported inferred behavior | Adapter source, tests, generated SQL or protocol trace |
| Documentation promises an export that source lacks | Aspirational or stale contract | Export map, publish include list, registry artifact |
| Same organization contains many packages | Brand adjacency mistaken for required stack | Capability map and deliberate exclusions |
| Community integration is called official | Provenance collapsed | Maintainer and canonical documentation evidence |
| Upgrade changes behavior despite matching names | Version or prerelease boundary | Changelog, exact imports, lockfile, migration tests |
| Agent researches every incidental dependency | Trigger is too broad | Restate the decision and materiality threshold |

## Counterexamples

- A standalone package may have no meaningful siblings. Classify it as
  standalone after checking; do not manufacture an ecosystem.
- Two archives named “old” and “new” may contain identical source. Compare
  content hashes before inventing an evolution narrative.
- A repository named for a product scope may not implement every surface implied
  by the name. Search entrypoints and manifests before deriving guidance.
- A guidebook is normative evidence, not proof that its companion codebase
  implements the contract.
- A private package remembered by the user may be misspelled, unpublished, or
  only present in another workspace. Find source before writing imports.

Stop and report uncertainty when identity, ownership, or compatibility would
otherwise be guessed. State the exact source or executable check needed next.
