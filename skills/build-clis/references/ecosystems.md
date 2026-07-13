# CLI ecosystem map

Use `explore-ecosystems` to verify versions and relationships. This map assigns
capabilities; it is not an instruction to install every package.

## Command language

Optique can own typed grammar, source binding, help, discovery, completion, and
manual generation through separate packages. Inspect official integrations for
environment/config sources, Zod, Valibot, Standard Schema, prompts, Git,
LogTape, and Temporal. Select the packages the command model actually needs.

Citty is generally an alternative command owner, not an extra layer to add on
top of Optique.

## Configuration

c12 owns discovery and authored config loading. defu owns default-style merging,
but application policy must define arrays, atomic unions, and operations. Related
UnJS projects such as jiti, rc9, std-env, pathe, confbox, pkg-types, nypm,
unstorage, ohash, ofetch, hookable, ufo, unbuild, automd, and changelogen may own
focused adjacent capabilities. Choose them by task, not brand.

## Schemas

Zod or Valibot can own application validation. Standard Schema is useful at a
validator-neutral library boundary. Do not add a second schema system when no
interoperability boundary exists.

## Output and interaction

When LogTape is selected or already installed, it can own observable result and
diagnostic transport. Inspect pretty, file, redaction, testing, lint maturity,
and official adapters. Otherwise preserve the verified output owner unless a
migration is requested and justified. Consola is normally an alternative
logging owner. Clack or Inquirer can own prompt presentation when their host and
automation contracts fit; parser integration does not remove the need for
`--no-input`, TTY, cancellation, and secret policies.

## Durable work

Temporal integrations can expose workflow start, status, signals, and results in
the CLI. Temporal still owns durable history and workers; the parser adapter does
not make an in-process command durable.

## Project-local tools

`@okikio/undent` can own readable generated help, manuals, templates, and
diagnostics. Use `use-okikio` to select `undent`, `align`, `embed`, or Unicode
column measurement from actual exports rather than memory.
