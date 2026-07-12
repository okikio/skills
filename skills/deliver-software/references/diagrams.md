---
description: ASCII diagram guidance for docs, TSDoc, and explanatory comments
applyTo: "**/*.md,**/*.{js,ts},**/*.{jsx,tsx},**/*.astro"
---

# ASCII Diagrams

Use ASCII diagrams when prose alone would make structure, flow, hierarchy,
ownership, state, or time harder to understand.

Good uses:
- parser pipelines
- tree and hierarchy layouts
- state transitions
- binary or memory layouts
- algorithm walkthroughs
- edit or event flow
- long lifecycle walkthroughs
- cross-owner handoffs
- stored-state or revision flows
- retry, fallback, cleanup, and recovery paths

Do not add diagrams for simple one-step logic or tiny APIs.

Do not overcompress a diagram when the missing detail is what makes the system
hard to understand. A compact diagram is useful only when it preserves the real
sequence, ownership, state changes, and important branches. Prefer a larger,
chaptered diagram over a tiny pipeline when the tiny pipeline hides why the
system behaves the way it does.

Always pair a diagram with prose that explains:
- what the reader is looking at
- why it matters
- how to read it
- which details are intentionally omitted

A useful diagram is a reasoning tool, not decoration. It should help the reader
answer questions such as:
- what starts this flow?
- what happens next?
- who owns this step?
- what data or state crosses this handoff?
- what can branch, race, fail, retry, or be cleaned up?
- what stored state prevents stale or out-of-order work from winning?

## Choose the right diagram job

Choose one primary job before drawing:

| Diagram job | Use when the reader needs to understand |
| --- | --- |
| Concept map | The important nouns and how they relate. |
| Component map | Which modules, services, runtimes, or UI regions own behavior. |
| Data flow | How a shape changes as it moves through stages. |
| Lifecycle walkthrough | What happens over time from trigger to cleanup. |
| State machine | Which states exist and which transitions are legal. |
| Failure path | How retries, fallbacks, cancellation, and recovery work. |
| Storage or revision flow | How persisted state is written, compared, invalidated, or read. |

Do not use a component map when the real question is lifecycle order. Do not use
a one-line data pipeline when the real question is ownership, concurrency,
storage, or cleanup.

## Start simple, then show the operational detail

For architecture explanations, start with a short plain-English story before the
full diagram. The short story gives the reader a mental model. The detailed
diagram then shows the operational truth.

```text
Plain story:
  user action
    -> request validated
    -> work scheduled
    -> worker produces result
    -> state stored
    -> client updates
```

Then show enough detail to preserve the behavior that matters. Do not stop at
the plain story when the system's correctness depends on ownership, revisions,
retries, fallback paths, or cleanup.

## Long lifecycle walkthroughs

Use lifecycle walkthroughs when a system is hard to understand because several
steps happen over time, across owners, or through stored state. These diagrams
are especially useful for workflows with retries, queues, background work,
streaming updates, cleanup, persistence, cross-context handoffs, or user-visible
state changes.

Prefer top-to-bottom time flow. For long diagrams, split the flow into named
chapters instead of drawing one dense box. Each chapter should make the local
story clear before the next chapter starts.

Good chapter labels describe the stage in plain language:

```text
REQUEST RECEIVED
INPUT VALIDATION
QUEUE DISPATCH
WORKER EXECUTION
PARTIAL RESULT STORAGE
CLIENT UPDATE
RETRY OR FALLBACK
FINALIZATION
CLEANUP
```

A useful chapter answers:
- what starts this stage
- who owns this stage
- what data enters
- what data leaves
- what can branch, race, fail, or be retried
- what state is stored, invalidated, or cleaned up

Label ownership contexts at handoff points. Examples include frontend component,
server handler, background job, queue worker, database, cache, browser context,
external service, storage layer, and test harness.

When the handoff contract matters, include a compact representative data shape.
Prefer a small shape that explains the contract over a full interface dump.

After diagrams that introduce project vocabulary, add a short glossary or term
table. Define what each term means in the current system and why it matters for
the flow.

### Detailed lifecycle example

This example is intentionally more detailed than a minimal pipeline. The extra
structure is useful because ownership, stored revisions, partial updates, and
cleanup affect correctness.

```text
USER SUBMITS WORK
===============================================================================

Browser UI
  |
  | submit form with user input
  v
Server handler
  |
  | validate request, assign request id, choose workflow type
  v
JobRequest
  id
  requested_by
  workflow_type
  created_at
  payload_summary
  |
  +-- invalid input --------------------------------------+
  |                                                       |
  |                                                       v
  |                                             ValidationError response
  |
  +-- valid input ----------------------------------------+
                                                          |
                                                          v
QUEUE DISPATCH
===============================================================================

Server handler
  |
  | enqueue job and persist initial status
  v
Queue
  |
  | delivers job at least once
  v
Worker

StoredJobStatus revision 1
  state: queued
  request_id
  job_id
  updated_at

WORKER EXECUTION
===============================================================================

Worker
  |
  | load job input
  | run step 1
  | write partial progress
  v
StoredJobStatus revision 2
  state: running
  completed_steps: 1
  latest_message: "Loaded input"
  |
  | run step 2
  | external service call
  |
  +-- transient failure ----------------------------------+
  |                                                       |
  |                                                       v
  |                                             RetryPolicy schedules retry
  |
  +-- success --------------------------------------------+
                                                          |
                                                          v
ResultRecord
  job_id
  result_kind
  output_summary
  completed_at

CLIENT UPDATE
===============================================================================

Storage or subscription layer
  |
  | emits status revision
  v
Browser UI
  |
  | apply only if incoming revision is newer
  v
Rendered state
  queued -> running -> partial result -> complete

CLEANUP
===============================================================================

Worker
  |
  | final status saved, temporary resources released
  v
StoredJobStatus revision 3
  state: complete
  result_id
  cleaned_up_at
```

The diagram keeps the lifecycle readable by separating chapters, labeling the
owner of each stage, showing the shapes that cross important handoffs, and
including failure and cleanup paths where they affect the result.

## Common diagram shapes

### Pipeline or flow

Use pipeline diagrams when each stage produces a meaningful new shape or
lifecycle state. Do not draw a separate box for every helper function, but do
not collapse away the stage that explains the behavior.

```text
TextSource -> Tokenizer -> Event Stream -> Tree Builder -> Syntax Tree
```

### Tree or hierarchy

```text
root/
├── core/
│   ├── tokenizer.ts
│   └── events.ts
└── ast/
    └── builder.ts
```

### Binary or field layout

```text
Byte:    0       1       2       3
       ┌───────┬───────┬───────────────┐
       │ Flags │ Type  │    Length     │
       └───────┴───────┴───────────────┘
```

### Step-by-step algorithm view

```text
Step 1: tokenize input
Step 2: group tokens into block structure
Step 3: resolve inline structure
Step 4: emit enter/exit/text events
```

### Cross-owner handoff

```text
Client component
  |
  | sends command
  v
Server handler
  |
  | stores durable job
  v
Queue worker
  |
  | writes result
  v
Storage
  |
  | notifies subscriber
  v
Client component
```

## Readability rules

Prefer diagrams that stay readable in plain text editors and code review diffs.
Use Unicode box drawing only when the target project and review surface render it
clearly. Plain `|`, `+`, `-`, and `->` are safer when portability matters.

For large diagrams:
- keep one dominant reading direction
- use chapter dividers for major lifecycle changes
- keep labels short but specific
- align branches so the merge point is visible
- show representative shapes only at important handoffs
- explain omitted detail in prose instead of squeezing everything into the diagram
- split into multiple diagrams only when each diagram has a distinct job
