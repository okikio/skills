# Command reference

Confirm current syntax with `deno help <command>` and official docs before
relying on version-sensitive flags.

| Command               | Intent                                                                                |
| --------------------- | ------------------------------------------------------------------------------------- |
| `deno run`            | Execute a module with explicit permissions                                            |
| `deno task`           | Run configured Deno or package scripts                                                |
| `deno add` / `remove` | Change declared dependencies                                                          |
| `deno install`        | Materialize project dependencies / install executable depending on mode and arguments |
| `deno ci`             | Recreate dependencies strictly from a current lockfile for CI                         |
| `deno update`         | Update project dependencies                                                           |
| `deno upgrade`        | Upgrade the Deno runtime                                                              |
| `deno list`           | Inspect declared/resolved dependencies                                                |
| `deno info`           | Inspect module graph and cache information                                            |
| `deno audit`          | Audit npm dependency vulnerabilities                                                  |
| `deno fmt`            | Format or verify formatting                                                           |
| `deno lint`           | Run built-in and configured lint rules/plugins                                        |
| `deno check`          | Type-check modules without running them                                               |
| `deno test`           | Discover and execute tests                                                            |
| `deno coverage`       | Report captured coverage and enforce thresholds                                       |
| `deno bench`          | Run benchmarks                                                                        |
| `deno doc`            | Generate or validate API documentation                                                |
| `deno x` / `dx`       | Run package executables ephemerally                                                   |
| `deno bundle`         | Produce bundled JavaScript/assets                                                     |
| `deno compile`        | Produce standalone executables                                                        |
| `deno desktop`        | Produce desktop applications; experimental in 2.9                                     |
| `deno publish`        | Publish a package to JSR                                                              |
| `deno pack`           | Create an npm-compatible tarball from a Deno project                                  |
| `deno deploy`         | Interact with Deno Deploy where applicable                                            |

## Common distinctions

- `deno update` changes project dependencies; `deno upgrade` changes the
  runtime.
- `deno ci` requires a current lockfile, removes existing node_modules, and
  installs reproducibly.
- `deno publish` targets JSR; `deno pack` creates an npm-compatible tarball that
  still requires clean npm and Deno consumer tests.
- `deno list` answers declared/resolved package dependencies; `deno info` is
  oriented around module graph/cache information.
- source execution, bundling, compilation, and desktop packaging produce
  different contracts and require different tests.
- a task is not automatically safe because it is in configuration; review its
  permissions and shell/subprocess behavior.
