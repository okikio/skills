# Deno decision cases

## Evidence before classification

Classification describes durable ownership, not which executable happens to run a command. Inspect both manifests, lockfiles, workspace declarations, framework configuration, CI, publication metadata, deployment targets, and consumer contracts. Record ownership of dependencies, locks, tasks, exports, permissions, publication, artifacts, and deployment. Do not classify from deno.json alone.

## Package ownership

For Astro or Vite applications whose tooling discovers package.json, preserve package.json as the ecosystem contract. Deno may own tasks, permissions, lint, formatting, and testing without owning dependencies. Verify real development and production builds.

Workspace star, caret, and tilde protocols belong in package.json dependency fields, not deno.json import-map values. Verify with the pinned Deno version and a clean cache.

## Workspaces

Root configuration owns consistent policies. Members own exports, publication identity, and unique tasks. Confirm inheritance and root-only fields before moving settings. If members work directly but fail from the root, inspect working directories, root imports, and workspace discovery.

## Node compatibility

Treat native addons, postinstall scripts, filesystem-layout assumptions, subprocesses, loader hooks, and package-manager internals as high risk. Inspect source and run the exact workflow on supported platforms. Types do not prove runtime compatibility.

## Publication

Choose JSR for Deno-native source distribution and npm for npm-centered consumers. Dual publication requires synchronized versions, exports, generated files, and clean downstream consumer tests.

## Permissions

Derive permissions from actual operations. Separate reads from writes, environment names from values, hosts from arbitrary network access, and specific subprocesses from unrestricted execution. Test an allowed and a denied operation.

