# Node and npm compatibility

## Principle

Deno compatibility is a migration tool and a valid long-term operating mode. The
goal is lower complexity and correct software, not maximum replacement of Node
conventions.

## Compatibility-first sequence

1. record the current Node/package-manager workflow;
2. preserve package.json and its lockfile;
3. install with the targeted Deno version;
4. run existing scripts through Deno;
5. run tests, build, development server, and production start;
6. classify failures precisely;
7. make the smallest compatible correction;
8. only then evaluate manifest or tooling consolidation.

## Failure classes

### Module resolution

Check conditional exports, package type, file extensions, CJS/ESM edges, deep
imports, aliases, and generated files.

### Lifecycle scripts

Determine whether install/build scripts are required, trusted, and supported.
Avoid enabling all scripts blindly.

### Native addons

Confirm OS/architecture binaries, node_modules layout, ABI expectations, and
fallback behavior. Test in CI and production-like images.

### Subprocess assumptions

Some tools invoke a `node` executable or assume npm-specific environment
variables. Confirm current Deno shim behavior and opt-out controls from official
docs before relying on it.

### Filesystem layout

Node tools may expect package assets, `import.meta.dirname`, local `.bin`,
hoisted dependencies, or writable package directories. Test actual package
behavior.

### Globals and process behavior

Inspect use of `process`, `Buffer`, timers, signals, TTY, worker threads, and
exit semantics. Prefer direct compatibility over hand-written polyfills.

## Migration decisions

Keep package.json authoritative when:

- publishing to npm;
- frameworks generate or require package metadata;
- external contributors and tools depend on scripts;
- Node remains a supported runtime;
- ecosystem plugins inspect package.json.

Move ownership to deno.json when:

- Deno is the sole runtime and package manager;
- external npm tooling no longer requires the declarations;
- the move removes duplication;
- clean install, CI, packaging, and deployment pass.

## Exit criteria

A migration is complete when:

- clean installation is deterministic;
- development, test, build, and production workflows pass;
- native and lifecycle dependencies are understood;
- CI and deployment use the intended runtime;
- manifests have explicit ownership;
- obsolete Node-only glue is removed;
- rollback and runtime version policy are documented.
