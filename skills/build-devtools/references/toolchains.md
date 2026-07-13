# Toolchain ownership

## Mise

Inspect version files, config layering, backends, registries, plugins, tasks,
environment activation, lock behavior, shims, CI installation, trust policy, and
editor integration at the installed version. Decide whether Mise owns only tool
versions or also tasks/environment; do not duplicate canonical tasks invisibly.

Downloaded editor helper executables and Mise tool caches are not source by
default. Keep them ignored unless the repository deliberately vendors a pinned,
licensed, verified binary.

## Aube and unfamiliar tools

Resolve canonical repository, package identity, version, config schema, generated
files, and task behavior first. If source cannot be found, record the name as an
unverified discovery hint and do not invent configuration keys.

## Task parity

Compare root and package tasks, package-manager scripts, Mise tasks, CI commands,
permissions, working directories, environment values, and generated prerequisites.
One task name should mean the same operation everywhere or point clearly to the
canonical owner.

## Cold setup

Verify from a clean clone with documented prerequisites. Test version activation,
dependency install, generation, check/test/build, and one routine developer flow.
Do not rely on global tools, editor downloads, hidden caches, or unpublished local
packages unless documented.
