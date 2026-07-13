# Repository hygiene

## Classify before deleting

Classify suspicious files as authored source, generated source, fixture, vendored
dependency, cache/download, build output, release artifact, or unknown. Check
repository instructions and consumers before removal.

Common local-only artifacts include editor-managed tool binaries, package caches,
coverage, temporary databases, generated preview images, and framework build
directories. Intentional vendoring requires version, source, license, integrity,
update, and platform policy.

## Dirty worktrees

Preserve user changes. Inspect status and diffs before generation, formatting,
or cleanup. Never overwrite a modified generated file without determining
whether it is an intentional source change or stale output.

## Reviewability

Do not run repository-wide formatters over Markdown. Scope code formatters by
extension/path or configure a Markdown exclusion. After changes, inspect
Markdown numstat and diffs for unrelated wrapping, table, or code-block churn.

## Hygiene checks

- ignored and untracked large files;
- secrets and environment files;
- executable/binary provenance;
- generated files without owners;
- stale tasks and permission sets;
- duplicate dependency versions;
- workspace globs pointing to missing directories;
- docs claiming scripts or artifacts that do not exist;
- clean-clone setup and clean-tree regeneration.
