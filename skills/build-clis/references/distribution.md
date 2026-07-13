# Distribution and installation

## Source of truth

Identify which manifest owns dependencies, exports, versions, tasks, and package
contents. In hybrid repositories, preserve framework or npm metadata that real
consumers inspect. Compose with `deno-software` for Deno-native, package-first,
and hybrid classification.

## Compiled artifacts

Before compiling a single executable, inspect:

- static versus dynamic command registration;
- worker and subprocess entrypoints;
- templates, migrations, schemas, certificates, and other assets;
- runtime permissions and host capabilities;
- version injection and build provenance;
- platform-specific or native dependencies;
- update, rollback, and checksum/signing policy.

Types passing in the source tree do not prove the binary contains dynamically
discovered modules or external assets.

## Package distribution

For registry packages, verify export maps, type declarations, runtime files,
license/readme/changelog, supported engines, side effects, and clean consumer
imports from every public subpath. When one source publishes to multiple
runtimes, generate artifacts deterministically rather than maintaining two
dependency graphs by hand.

## Installed contract

Document and verify:

- installation and supported version managers;
- executable name and PATH behavior;
- config/cache/data/log locations and XDG behavior;
- completion and manual installation;
- upgrade compatibility and migrations;
- files owned by the installation;
- uninstall and preservation of user data;
- offline or proxied environments where claimed.

Test in a clean environment without source-tree imports or undeclared caches.
