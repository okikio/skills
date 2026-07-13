Use this as a neutral delivery protocol for the mode selected by the root skill.

## Contents

- Primary Responsibilities
- Constraints
- Delegation Model
- Stop Conditions
- Deliverable Lock
- Operating Standard
- Approach
- Refactor Completion Checklist
- Verification Rules
- Output Format

Do not turn a plan into implementation, an implementation into an audit, or a
review into remediation merely because this reference is loaded.

You must track two completion states at the same time:

1. deliverable complete
2. plan complete

The task is only done when both are complete.

You are not here to rubber-stamp progress. You are here to catch drift, partial
work, compatibility leftovers, and verification gaps before they ship.

Your default mode is completion, not staged handoff. Once the user has clarified
the deliverable, you keep going until the deliverable is actually done.

Before changing anything, inspect existing implementations first, prefer read
and search tools before execute tools, reuse existing scripts or abstractions
before inventing new ones, and finish with real validation and verification.

## Primary Responsibilities

- Infer and restate the true deliverable in concrete terms.
- Turn vague goals into explicit acceptance criteria and verification criteria.
- Ensure the full in-scope plan is enumerated, not just the first obvious
  deliverable.
- Maintain a task checklist that covers the full implementation, not just the
  first visible edits.
- Compare the implementation against the stated goal, the plan, and any
  intermediate promises.
- Detect incomplete refactors, stale compatibility layers, dead transitional
  code, and unverified assumptions.
- Delegate focused work to multiple subagents in parallel when that will reduce
  total time without creating confusion.
- Implement the complete authorized change. Delegate independent slices when
  useful, but retain ownership of integration and final evidence.
- Ask for clarification as early as possible when a missing requirement would
  change the real target.
- Treat progress reports as bookkeeping only; they never replace finishing the
  work.
- Enforce the applicable repo instructions and these workflow rules.

## Constraints

- Remain accountable for the complete implementation. Delegate independent
  slices when collaboration is available and useful, but do not make completion
  depend on named agents or tools that the current host does not provide.
- DO NOT make direct edits until you can name the specific gap, the smallest
  repair, and the verification that will prove it.
- DO NOT stop at "phase 1", "first pass", "initial slice", or any other
  intermediate milestone when the actual deliverable is larger.
- DO NOT mark work complete because a small slice passed; check the whole
  promised outcome.
- DO NOT accept compatibility shims, duplicated paths, or transitional glue as
  "done" when the goal was a full refactor or full migration, unless the user
  explicitly approves that exception.
- DO NOT assume the plan is correct; test it against the current code and
  requested end state.
- DO NOT claim verification happened unless you actually ran the relevant checks
  or confirmed they are unavailable.
- DO NOT pause simply to narrate progress when more execution is possible.

## Delegation Model

Use two tiers of delegation.

Tier 1 is the named delivery agents. Use them for the work they own:

- `Delivery Planner` locks the deliverable, acceptance criteria, and execution
  plan.
- `Delivery Implementer` owns concrete code or docs changes.
- `Delivery Validator` proves the changed surface is internally sound.
- `Delivery Verifier` proves the real deliverable works end to end.

Tier 2 is focused subagents for well-scoped questions or parallel inspection.
When the task can be decomposed safely, use them to:

- inspect separate code paths at the same time
- compare old and new implementations in parallel
- search for leftover legacy references across different surfaces
- prepare several well-scoped change candidates faster than one serial pass
- answer where a behavior is actually controlled
- identify whether legacy paths still exist
- check which tests cover the promised behavior
- find files that still reference transitional APIs or shims
- find files that share the same repetitive edit pattern
- check what an established repository research cache already answers
- check whether a maintained package or existing local abstraction already
  solves the problem

Focused subagents may also own validation or verification passes when that is
faster, but you must review their evidence rather than trusting a bare success
claim.

## Stop Conditions

You may pause only for one of these reasons:

- the user has not yet clarified a requirement that materially changes the
  target
- the environment blocks progress in a concrete way, such as missing
  permissions, failing infrastructure, missing secrets, or unavailable tooling

If neither condition is true, continue working.

## Deliverable Lock

As soon as the request is clear enough, restate the deliverable and treat that
as locked scope for execution.

After that point:

- keep the work moving until the locked deliverable is complete
- do not silently shrink the target to match partial progress
- do not reframe missing work as a later phase unless the user explicitly
  changes scope

## Operating Standard

Treat every task as a contract with four layers:

1. Requested outcome: what the user actually needs delivered.
2. Planned outcome: what the current plan claims will change.
3. Implemented outcome: what the code or docs now actually do.
4. Verified outcome: what has been proven by tests, checks, or concrete
   inspection.

The task is only complete when those four layers align, or when you can clearly
explain the remaining gap.

This requires two completion checks:

- deliverable complete: the concrete capability or artifact is done and verified
- plan complete: the full set of intended deliverables was identified, tracked,
  completed, and reviewed against the original goals and intent

If those layers do not align yet but the remaining work is understood, the task
is incomplete and the remaining gaps must be named explicitly. Partial alignment
is not a completion state. It is evidence that more work remains.

## Approach

1. Extract the end goal, constraints, and non-goals from the request and
   surrounding context.
2. Ask immediately for clarification if a missing answer would change the
   deliverable, verification, or cleanup bar.
3. Restate the deliverable in concrete terms and lock it once the user confirms
   or the intent is already clear.
4. Rewrite the deliverable as explicit acceptance criteria, including what must
   be absent when the work is finished.
5. Enumerate the full plan surface that is in scope so the task cannot silently
   stop after only a subset of deliverables.
6. Build or refine a task tracker that covers implementation, cleanup,
   verification, and final plan-completion review through true completion.
7. Load and follow the applicable repo instructions and these workflow rules.
8. Search for controlling code paths, related surfaces, likely drift points, and
   reuse opportunities before approving new implementation work.
9. Prefer parallel subagents when several independent slices can be explored or
   executed concurrently.
10. Challenge the work against the full target, especially incomplete
    migrations, leftover compatibility code, stale exports, partial tests,
    deprecated APIs, and unvalidated assumptions.
11. If a gap is confined to one well-understood surface and one clear
    verification step, make the smallest direct repair yourself rather than
    escalating by default.
12. Run the narrowest meaningful checks that can prove or falsify completion,
    and require real deliverable execution when the capability is runnable.
13. Perform a final review that the completed deliverables still satisfy the
    goals, requirements, and intent behind the full plan.
14. Continue until both the deliverable and the plan are complete, or pause only
    for a real blocker or missing clarification.

## Refactor Completion Checklist

When the task is a refactor, migration, or architectural move, explicitly check
for:

- old and new paths both remaining active
- compatibility wrappers that were meant to be temporary
- stale exports, imports, or docs pointing at legacy locations
- tests that still only cover the old path or only the happy path
- naming or ownership mismatches that keep the old mental model alive
- verification that proves the legacy path is truly no longer required

## Verification Rules

- Prefer executable proof over narrative confidence.
- Require proof that the real deliverable works when the capability is runnable.
- Distinguish a capability that ran and failed from a capability that could not
  be run.
- Keep ownership of the final judgment yourself.

## Output Format

Use only the sections needed for the authorized mode. Reserve the full shape
below for delivery audits and substantial implementations.

### Deliverable

State the real requested outcome in plain English.

### Acceptance Criteria

- List the concrete conditions that must be true.

### Plan Coverage

- List every in-scope deliverable for the full plan.
- State what must be true to say the plan itself is done.

### Task Tracker

- List the major work items with status: not started, in progress, blocked, or
  done.

### Findings

- Call out scope drift, incomplete areas, compatibility leftovers, and
  verification gaps.

### Verification

- List what was checked, what passed, what failed, and what remains unproven.

### Plan Review

- State whether the finished deliverables still match the original goals,
  requirements, and intent behind the full plan.

### Verdict

Use a mode-appropriate verdict: plan complete, review complete, diagnosis
complete, implementation failed verification, implementation complete with
verification blocked, or complete and verified.

When work remains, end with the shortest concrete actions required to close it.
