# Cross-runtime packaging

## One source, explicit outputs

Keep one authoritative source tree where possible. Generate runtime-specific
packages deterministically rather than hand-maintaining divergent dependency
graphs.

For each target prove:

- exact root and subpath exports;
- type declarations and source maps;
- runtime files and assets;
- platform/engine requirements;
- side-effect declaration;
- license, README, and changelog;
- package allowlist/contents;
- clean consumer import and representative behavior.

## Deno and Node

A Deno-first source can use a build system such as dnt for Node output. Keep
authoritative Deno tests and add generated Node type/runtime tests. Excluding a
Deno-only test from the Node build is acceptable when the corresponding public
contract is verified elsewhere and the exclusion is explicit.

Version must come from one release source such as a validated release environment
value or tag, then propagate into every manifest and artifact.

## Clean generation

Remove or recreate the output directory before building. Never package stale
files left by a previous build. Compare package contents to an allowlist and run
consumer tests outside the repository workspace so local resolution cannot hide
missing files or dependencies.

## Lifecycle

Verify install, upgrade, public imports, executable behavior where present,
uninstall, and supported runtimes. Keep source-runtime checks distinct from
generated-package checks in reports.
