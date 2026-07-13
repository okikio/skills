# Personal packages, releases, and unknowns

## Packaging patterns

The reviewed undent build demonstrates clean-output generation, root plus
`./unicode` entrypoints, Deno and generated Node checks, explicit exclusions for
Deno-only tests, `sideEffects: false`, a Node engine floor, semver validation
from one release version, and deterministic license/README/changelog copying.

Verify source-runtime tests, generated package type/runtime behavior, every
export, package contents, version propagation, and clean consumers separately.

## Generated data

The reviewed Unicode data synchronizer uses check/write modes, explicit Deno
permissions, an immutable upstream version behind a mutable latest URL, SHA-256
comparison, AST-based update, and no rewrite in check mode. Preserve those
properties and avoid unrelated formatting.

## Performance experiments

The wikitext event-shape study keeps baseline/candidate source and harness
snapshots, runs timing and retained-memory in fresh processes, preserves raw
samples, uses deterministic ordering, applies statistical/effect-size gates, and
protects parse/session workflows from microbenchmark regressions.

## Unverified package protocol

For remembered observables, backend helpers, custom adapters, or misspelled
package names:

1. search consuming manifests, lockfiles, imports, registries, and owner repos;
2. establish exact identity and status;
3. inspect public exports and tests;
4. state what remains unavailable;
5. define the needed interface without assigning invented exports;
6. request or locate source before implementation.

Names from memory are useful discovery leads, never API contracts.
