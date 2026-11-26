# Deliver a Rust capability on its required hosts

Use this prompt for Rust implementation, reviews, host support, ownership, performance, FFI or builds.

Skills: `rust-software`, `plan-changes`, `verify-behavior`.

Read the [applicable procedure](../rust/README.md) and [prompt instructions](README.md). Copy the complete prompt and replace the bracketed fields with the task's actual scope.

```text
Task: Deliver a Rust capability on its required hosts.
Source or repository: [identify the actual source].
Mode and outcome: [review, plan, implement or verify; useful result].
Scope and allowed effects: [use the existing task authorization].

Read current repository instructions and the installed rust-software, plan-changes, verify-behavior
skills. Use their shared software-quality and product guides. Preserve the
project's runtime, supported environments and native task interface. Verify
the starting branch, revision and local changes.

State the user or maintainer outcome, consequential question and existing
evidence. Trace the real owner and consumer. Use a small direct probe early
when its result can change the next decision.

Inventory Cargo packages and targets, pinned tools, features, consumers and
supported hosts. Declare useful behavior, inputs, outputs, errors, limits,
ownership and cleanup. Preserve native-only scope when selected; verify
Wasm execution when Wasm is required.

Probe uncertain dependencies, host APIs or acceleration before building
around them. Prove correctness independently before measuring speed. Test
meaningful chunk splits, tails, malformed input, cancellation and foreign
ownership. Keep compile, artifact, host-execution and integrated evidence
distinct. Preserve required gates while measuring build reuse. Deliver the
supported artifact, docs, checks and recoverable next action for open needs.

Keep observations, hypotheses and blocked checks distinct. Preserve relevant
failed attempts and cleanup state. Report the evidence-backed result, its
scope, remaining checks and next concrete action. Do only the work authorized
by the selected mode and current task.
```
