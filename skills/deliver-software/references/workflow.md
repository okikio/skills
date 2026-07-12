---
description: Shared delivery workflow rules for delivery agents, research cache notes, and repo-local automation scripts
applyTo: ".github/agents/*.agent.md,.agents/research/**/*.md,.agents/scripts/**/*.{ts,tsx,js,mjs,mts,md}"
---

# Delivery Workflow

Use these rules for delivery agents, reusable research notes, and repo-local automation scripts.

## Search and research order

When researching or searching, prefer this order unless the task clearly requires something else:
1. `.agents/research/`
2. applicable instruction files, especially `.github/instructions/`
3. the rest of the codebase

Search local code and reusable notes before inventing new code or repeating external research.

Store a reviewable note under `.agents/research/` whenever you consult external documentation, third-party APIs, or perform non-trivial codebase investigation that produced a non-obvious conclusion.

Keep research notes reusable, but do not compress away the details that motivated the search.

Research notes should preserve exact details when they matter, such as:
- specific API names or method names
- deprecated symbols and their replacements
- exact commands, flags, or invocation shapes
- version-sensitive behavior
- subtle caveats, exceptions, or migration notes
- the source that established the conclusion

Prefer compact notes over raw transcripts, but do not shrink away the evidence a later agent would need to act correctly.

## Reuse before invention

Before introducing custom implementation work:
- search the codebase for existing patterns, helpers, and abstractions
- check whether a maintained package already solves the problem
- use current documentation when library or framework APIs may already cover the need

Prefer evidence of reuse checks before approving hand-rolled solutions.

## Tool priority

Prefer workspace read, search, symbol, and edit tools first.

Use the terminal mainly for:
- verification
- tests
- benchmarks
- typechecks
- lint
- running scripts

Do not default to terminal-driven exploration when workspace tools can do the job more directly.

## Script policy

For repetitive bulk edits or other writing-oriented automation, prefer reviewable Deno + TypeScript scripts under `.agents/scripts/`.

Feel free to use `jsr:` and `npm:` packages when they improve clarity, safety, or reviewability.

Prefer `jsr:@std/*` modules when they fit the task, especially for:
- filesystem work
- encodings
- buffers
- collections
- paths
- related standard utilities

Keep scripts narrow and task-specific.

## Validation and verification bar

Validation is about the changed surface being internally sound.
Verification is about the real deliverable actually working.

Plan completion is separate from deliverable completion.

A task is not fully done unless you complete both checklists in order.

1. Deliverable checklist
- zero TypeScript issues in the changed surface
- no deprecated APIs left behind
- no stale Zod usage when current APIs should be used
- schemas treated as the source of truth when they define the contract
- the real deliverable is complete and verified

2. Plan checklist
- all intended deliverables were identified, tracked, and reviewed against the original goals, requirements, and intent
- the full plan coverage is complete and reviewed

Do not stop at tests, benchmarks, or lint when the real deliverable can be run directly.

For runnable deliverables such as CLIs, jobs, migrations, generators, servers, or user-facing workflows, run the actual capability whenever possible.

Verification is binary at the end: either the capability works and is proven, or the task is blocked.

If the capability cannot be run due to missing environment, credentials, or infrastructure, document the exact blocker in a progress note under `.agents/progress/`, list the verification steps that would be needed, and surface the block explicitly to the requester rather than marking the task done.

Plan completion is also binary at the end: either the plan coverage is complete and reviewed, or the task is blocked.

## Progress notes

You may write progress notes under `.agents/progress/` for long-running work, but progress notes are bookkeeping only. They never replace finishing the work.
