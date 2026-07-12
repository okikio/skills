---
description: "Cross-project Markdown and long-form documentation style"
applyTo: "**/*.md"
---

# Documentation Writing

## Core priority

Lead with user or maintainer benefit before internal mechanics.
When introducing a concept, prefer this narrative order:
1. what it is
2. what problem it solves
3. what the reader gets from it
4. how it works at a high level
5. examples, assumptions, edge cases, limitations, and deeper detail

^ Use this as a default shape, not a rigid template. Steps 1 to 3 should
almost always appear. Steps 4 and 5 may be condensed, merged, or reordered
when the document type makes them redundant, such as changelogs or commit
messages.

Before writing, choose the documents job:

- Tutorial
- How-to
- Reference
- Conceptual
- Troubleshooting
- Design note
- Changelog
- Review
- Commit message

A document should do one primary job. If it needs to teach, specify, and troubleshoot, split it or create clear sections with different reader paths.

For commit messages, use imperative mood in the subject line, separate the subject from the body with a blank
line, and keep the body focused on why the change was made rather than
repeating the diff.

## Writing style

- Use plain English.
- Define technical terms the first time they matter.
- Ground abstract ideas in something concrete before or while naming them.
- Tie explanations to a real behavior, cost, failure mode, example, or downstream benefit.
- Keep a smooth narrative flow.
- Ensure each paragraph leads into the next with a sentence that either previews the next idea or closes the current one.
- Avoid switching abruptly between procedural steps and conceptual explanation within the same paragraph.
- Prefer transition sentences over unnecessary headers.
- Use active voice.
- Use present tense where practical.
- Expand acronyms on first use.
- Avoid em dashes.
- Avoid `easy`, `simple`, and `quick` when describing reader actions, as this can create pressure on the reader.
- Use direct address (`you`, `your`) in Tutorials, How-tos, and
	Troubleshooting docs. Use neutral, precise language in Reference,
	Changelog, Commit message, and Design note docs.
- Avoid burying important information in code example comments.

The goal is not just to swap jargon for simpler jargon.
The goal is to help the reader build a working mental model.

## Diagram depth and lifecycle walkthroughs

Use diagrams as structured walkthroughs when a system is easier to understand
by following time, ownership, state, and handoffs. Do not overcompress a
complex workflow into a tiny pipeline if the omitted detail is what makes the
system hard to reason about.

Choose diagram depth in this order:

1. If understanding depends on ordering, ownership, stored state, retries,
   storage, concurrency, or cleanup, use one walkthrough that preserves that
   lifecycle.
2. If different sub-flows have distinct jobs, such as component ownership,
   data flow, or failure recovery, split them into separate diagrams.
3. If a diagram would only repeat obvious prose, skip it.

For architecture-heavy docs, use this sequence when it helps the reader:

1. State the goal or contract of the flow.
2. Survey the major moving parts.
3. Draw the lifecycle in named chapters.
4. Define the terms introduced by the diagram.
5. Use the diagram to identify risks, tradeoffs, and implementation steps.

A long diagram is acceptable when it is easier to follow because it is
chaptered. For long lifecycle diagrams, prefer top-to-bottom time flow, named
chapters, ownership labels at handoff points, compact data shapes where
contracts matter, visible branches or fallback paths, and a short glossary when
project vocabulary is introduced. Always explain what the reader is looking at
and why it matters.

## Grounding abstract concepts

Before using a specialized term, or immediately after introducing it, connect it to at least one of these:
- a concrete input or output
- a real user or caller problem
- a visible behavior in the system
- a cost such as allocation, latency, or complexity
- a failure mode or edge case
- a downstream benefit for maintainers or consumers

If the reader would reasonably ask `So what does that mean here?`, answer that question in the prose.

## Header rules

Add a header only when it improves navigation more than a transition sentence would.
A useful header must mark a real subject shift, be specific about what follows, and still make sense in a document outline.

## Examples and visual aids

Add an example when the concept involves non-obvious behavior, a parameter with surprising defaults, or a failure mode a reader is likely to encounter. Skip examples for straightforward operations that follow predictable common conventions.
For code blocks, place a prose sentence immediately before the block stating what the code demonstrates and what the reader should notice. Do not use the code block itself or its comments as the primary explanation.
Use ASCII diagrams when they clarify structure, flow, hierarchy, state
transitions, ownership, or algorithm steps. Apply the diagram depth rules from
the previous section when deciding whether to use one walkthrough, several
diagrams, or none.
Do not add diagrams just to decorate the prose.

## Specs and design notes

For specs, proposals, and design notes, prefer RFC-style structure:
- Problem
- Goals
- Non-goals
- Constraints
- Proposal
- Alternatives
- Risks
- Rollout
- Open questions

Keep decisions concrete. Make tradeoffs explicit. State assumptions plainly.

## Anti-patterns

- Do not bury the lede under prerequisites or implementation detail.
- Do not list features before explaining the problem they solve.
- Do not create many tiny headers that simply label the next paragraph.
- Do not replace one abstract phrase with another abstract phrase and call it clarity.
- Do not use diagrams or examples that overstate certainty beyond what the implementation actually guarantees.
- Do not use generic setup lines that could fit any page.
