# Refactors and migrations

## When to load

Use this reference for structural replacement, ownership changes, migrations,
cutovers, compatibility windows, and requests whose success requires old paths
to stop being authoritative.

## 1. Establish the controlling path

Trace the current entrypoint through registration, configuration, runtime
dispatch, persistence, and downstream consumers. Search symbols and runtime
identifiers, not only filenames. Include generated registries, code generation,
public exports, package entrypoints, dependencies, file & folder names, folder structure, framework discovery, CI, deployment, and
documentation.

Produce two inventories:

- required end state: capabilities, public contracts, and supported consumers;
- removal state: obsolete code, exports, flags, configuration, dependencies,
  tests, docs, aliases, shims, generated output, and old terminology.

## 2. Baseline behavior

Record observable inputs, outputs, errors, side effects, ordering, concurrency,
persistence, performance constraints, permissions, and compatibility promises.
Use existing tests plus characterization tests where behavior matters but is not
specified.

List intentional behavior changes separately. A structural refactor does not
silently authorize product changes.

## 3. Design the cutover

Choose one:

- atomic replacement when all consumers can move together;
- expand, migrate, verify, contract for data or distributed-system changes;
- an explicitly approved compatibility window with an owner, deadline, removal
  condition, and tests for both paths.

A compatibility layer is not completion unless it is part of the accepted end
state. Generated files must be changed through their generator unless the
repository explicitly treats generated output as authored source.

## 4. Implement and close

Change the controlling path, migrate every consumer, regenerate outputs, update
tests and docs, and remove newly obsolete dependencies and configuration.
Search the entire repository for old names and behavior. Confirm that the old
path is unreachable, not merely unused by one test or some older files.

For monorepos, verify downstream packages and external consumer fixtures. For
data migrations, prove idempotency, mixed-version compatibility, rollback or
forward recovery, and the authority for destructive contraction.

## 5. Verify

Run focused validation, repository-wide affected gates, the actual capability,
and at least one clean consumer or clean environment when public contracts
changed. Compare the implemented result with both inventories. Report any
approved compatibility residue explicitly rather than hiding it as cleanup.

