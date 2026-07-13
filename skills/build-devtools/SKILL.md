---
name: build-devtools
description: Design or integrate developer tooling, repository automation, task runners, environment managers, generators, codemods, release tooling, and local or CI workflows. Use with Mise, Aube, Deno tasks, package managers, editors, and related ecosystems.
---

# Build Developer Tools

Use `explore-ecosystems` for plugins, backends, registries, and companion tools.

1. Map versions, environment, tasks, manifests, lockfiles, CI, editors, and
   releases.
2. Give each concern one canonical owner; avoid divergent mirrored tasks.
3. Keep generated files deterministic and clearly owned. Verify clean-tree
   regeneration and stale-output detection.
4. Treat local binaries/editor caches as non-source unless intentionally
   vendored.
5. Test cold setup, routine tasks, CI parity, upgrades, and failures.

Read [tools.md](references/tools.md).
