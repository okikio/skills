---
name: build-devtools
description: Design, integrate, migrate, review, diagnose, or verify developer tooling, repository automation, environment and version managers, task systems, generators, codemods, package builds, release workflows, and performance experiments. Use for Mise, Aube, Deno or package-manager tasks, CI parity, generated data, cross-runtime packages, source provenance, version propagation, clean regeneration, benchmarks, and repository hygiene.
---

# Build developer tools

Map the repository's toolchain before changing it. When active, `deno-software`
owns Deno configuration and publication and `build-clis` owns CLI product
behavior. Otherwise preserve those checks locally. This skill owns developer
workflow, generation, packaging automation, and release evidence.

## Toolchain ownership map

Record owners for runtime versions, package manager, manifests, lockfiles,
environment activation, tasks, permissions, generators, builds, CI, editor
integration, releases, and published artifacts. Avoid divergent wrappers and
mirrored tasks with different semantics.

## Procedure

1. Inspect nearest manifests, lockfiles, Mise/Aube/project config, CI, release
   workflows, generated files, and editor artifacts.
2. Classify files as authored source, generated source, cache/download, build
   output, vendored dependency, fixture, or release artifact.
3. Make generation deterministic with check and write modes, provenance,
   semantic validation, stale-output detection, and no unrelated formatting.
4. Prove source-runtime tests, generated package checks, every public export,
   package contents, version propagation, and clean-consumer use separately.
5. Design releases from an immutable revision with reproducible artifacts,
   checksums/provenance, rollback, and clean-tree gates.
6. Evaluate performance changes through isolated, repeatable experiments that
   protect real workflows from microbenchmark regressions.
7. Test cold setup, routine development, CI parity, upgrades, offline/proxy
   behavior where claimed, failure recovery, and clean uninstall/removal.

## Reference routing

- [toolchains.md](references/toolchains.md): Mise, Aube, tasks, manifests,
  lockfiles, CI, editors, and ownership.
- [generated-artifacts.md](references/generated-artifacts.md): check/write,
  provenance, deterministic generation, drift, and safe formatting.
- [packaging.md](references/packaging.md): cross-runtime builds, exports,
  package contents, consumers, and lifecycle.
- [releases.md](references/releases.md): versions, immutable revisions,
  provenance, publication, and rollback.
- [performance.md](references/performance.md): experiment protocol,
  statistical gates, and protected workflows.
- [hygiene.md](references/hygiene.md): source versus caches/binaries and review
  checks.

For an unfamiliar or private tool such as Aube, establish exact identity and
source before writing configuration. Never borrow APIs from a similarly named
project.
