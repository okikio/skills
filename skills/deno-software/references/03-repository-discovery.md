# Repository discovery

## Initial commands

Run non-destructive discovery first:

```bash
pwd
git status --short
git branch --show-current
find . -maxdepth 3 -type f \
  \( -name 'deno.json' -o -name 'deno.jsonc' -o -name 'package.json' \
  -o -name 'deno.lock' -o -name 'package-lock.json' -o -name 'pnpm-lock.yaml' \
  -o -name 'yarn.lock' -o -name 'bun.lock' -o -name 'bun.lockb' \) -print
```

Then inspect repository-specific instructions, README files, contributing docs,
CI, and deployment configuration.

## What to extract from manifests

### deno.json / deno.jsonc

- `name`, `version`, `exports`;
- `workspace` members and shared settings;
- `imports` and scopes;
- tasks;
- lock and nodeModulesDir behavior;
- compiler, lint, fmt, test, coverage, and unstable settings;
- permission sets;
- publish include/exclude rules;
- package.json preference or compatibility settings.

### package.json

- package manager and engines;
- type/module mode;
- scripts;
- dependencies by class;
- exports, imports, bin, files, sideEffects;
- workspaces, catalogs, overrides, resolutions;
- lifecycle scripts and native/build dependencies.

## Source graph

Find:

- application and package entrypoints;
- `mod.ts`, `main.ts`, `cli.ts`, server entrypoints, route roots;
- public exports and deep imports;
- tests and fixtures;
- generated sources;
- build, publish, release, and migration scripts;
- dynamic imports and subprocess invocations;
- environment and secret access;
- network, filesystem, FFI, and system access.

## Connected contracts

Deno work often crosses adjacent systems. Inspect the contracts that can
invalidate a local change:

- framework adapters and build output;
- database drivers and migration tools;
- npm lifecycle scripts;
- native addons;
- deployment runtime restrictions;
- Docker base images and entrypoints;
- GitHub Actions setup and cache keys;
- package consumer resolution;
- browser bundlers and SSR loaders.

## Repository model template

```text
Objective:
Project mode:
Deno version policy:
Workspace members:
Dependency ownership:
Entrypoints:
Public exports:
Tasks/scripts:
Permissions:
Tests and quality gates:
Artifacts:
Deployment targets:
Compatibility commitments:
Connected contracts:
Current risks:
```

Do not start structural edits until this model is sufficiently complete for the
requested scope.
