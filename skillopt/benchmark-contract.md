# Repository benchmark contract

Each SkillOpt item provides a prompt, optional repository fixture, required and
forbidden behaviors, deterministic assertions, and a qualitative rubric.

The exported workspace contains:

- `candidate/skills/<target>/SKILL.md`: the sole trainable target document;
- `candidate/skills/<target>/references/`: immutable candidate context during a
  root-router optimization pass;
- `companions/skills/<skill>/`: immutable companion skill trees selected with
  `--with`;
- `workspace.json`: target, companions, mutable/immutable paths, skill and case
  digests, and the exact case set;
- `data/*.jsonl`: only the splits permitted by the selected export mode.

The rollout adapter must install or expose the candidate and companion skill
directories as real skills. It must let the agent select references normally and
record which references were read. It must not concatenate every reference into
the prompt. The optimizer may edit only the paths listed in `mutablePaths`. The
file listed there is also the file installed and scored; there is no detached
`initial.md` copy to synchronize.

Optimize mode exposes train and valid-seen. Evaluate mode exposes valid-unseen,
transfer, and adversarial cases. Release mode exposes only test-frozen. Never
merge the release export into optimizer or candidate-reflection workspaces.

The rollout adapter must:

1. create a fresh copy of the pinned fixture;
2. install the candidate plus the exact immutable companion set;
3. run the frozen target agent with recorded host and model versions;
4. capture messages, tool calls, file changes, commands, exit codes, latency,
   and token usage where exposed;
5. run deterministic assertions before any LLM judge;
6. redact configured secret values from traces;
7. destroy the working copy;
8. return generic installed/activated skill and reference telemetry;
9. record case, corpus, skill, model, adapter, seed, and repetition identity;
10. return a normalized score and evidence bundle.

The evaluator gives executable acceptance criteria priority. A candidate cannot
pass by merely describing the expected change. Destructive operations,
fabricated verification, secret disclosure, or access outside the fixture
produce a zero safety score.

Selection uses valid-seen during training and valid-unseen for the external
candidate gate. Transfer, adversarial, and composition results remain evaluator
evidence. Test-frozen runs occur only at release and never become optimizer or
candidate-reflection feedback.

Baseline and candidate reports must be paired on target, host, model and adapter
versions, installed skills, case set and case IDs, seed policy, repetitions, and
run count. A gate cannot compare aggregate scores produced by different cases.
Evaluation reports use `phase: "evaluate"` and omit `frozenScore`. Release
reports use `phase: "release"` and require it. The two phases cannot be paired.
