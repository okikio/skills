# Provider adapter contract

`skillopt:rollout` owns repository evaluation mechanics. A provider adapter owns
provider-specific model invocation and translates provider telemetry into one
versioned file protocol.

Adapter protocol version 2 supports two request kinds:

```text
rollout   target model receives the task + installed skills
judge     qualitative judge receives rubric + redacted target evidence
```

The same adapter command can support either request kind. It reads `kind` from
the request document and writes the matching normalized response. A raw provider
CLI is not sufficient when it cannot report actual skill activation, reference
reads, or trajectory evidence. The repository does not infer that telemetry from
terminal prose.

## Invocation

Each model entry in `evals/models.json` declares:

- the provider host;
- an `adapterVersion`;
- supported `requests` (`rollout`, `judge`, or both);
- one command containing `{request}` and `{response}` placeholders;
- an explicit environment allowlist;
- the subset of allowed environment values that are secrets;
- a bounded timeout.

For example:

```json
{
  "id": "provider-default",
  "host": "generic",
  "adapterVersion": "2",
  "requests": ["rollout", "judge"],
  "command": [
    "skillopt-provider-adapter",
    "--request",
    "{request}",
    "--response",
    "{response}"
  ],
  "env": ["PATH", "PROVIDER_API_KEY"],
  "secretEnv": ["PROVIDER_API_KEY"]
}
```

The runner clears the child environment and passes only names in `env` that are
present. A name in `secretEnv` must also appear in `env`. Secret values are
redacted from persisted structured traces and from target evidence before it is
sent to a judge. Do not place credentials in command arguments, request files,
fixtures, skills, or normalized provider responses.

## Target rollout request

`RolloutRequestSchema` is the only request sent to the target model adapter.

```json
{
  "schemaVersion": 1,
  "kind": "rollout",
  "runId": "...",
  "caseId": "...",
  "prompt": "...",
  "cwd": "/tmp/skillopt-fixture-...",
  "skillsRoot": "/tmp/skillopt-skills-...",
  "targetSkill": "deno-software",
  "installedSkills": [
    {
      "id": "deno-software",
      "path": "/tmp/skillopt-skills-.../skills/deno-software",
      "revision": "<sha256>",
      "role": "target"
    }
  ],
  "seed": 0,
  "repetition": 0
}
```

`cwd` is the disposable task repository. `skillsRoot` is a separate disposable
copy of the exact candidate and companion skills. The adapter must expose these
directories through the provider's real skill mechanism. It must not concatenate
all references into the prompt.

Assertions and rubrics are deliberately absent. The target model never receives
the evaluator answer key.

## Target rollout response

The adapter writes one `RolloutResponseSchema` document:

```json
{
  "schemaVersion": 1,
  "kind": "rollout",
  "model": "provider-model-name",
  "modelVersion": "provider-model-version",
  "adapterVersion": "2",
  "output": "final model response",
  "activatedSkills": ["deno-software"],
  "referencesRead": [
    "deno-software/references/07-quality.md"
  ],
  "messages": [],
  "toolCalls": [],
  "commands": []
}
```

Token counts are optional. Omit data the provider does not expose rather than
fabricating it. `activatedSkills` can contain only supplied skills.
`referencesRead` uses `<skill>/references/<path>.md`; the repository verifies
that every reported path names a real file in the disposable installed tree.

## Qualitative judge request

Cases with `oracleStrength: "trajectory-rubric"` or `"mixed"` require an
explicit `--judge <model-id>`. The target rollout completes first. Repository
assertions and fixture comparisons run before the judge is invoked.

The judge receives `JudgeRequestSchema`:

```json
{
  "schemaVersion": 1,
  "kind": "judge",
  "runId": "...",
  "caseId": "...",
  "prompt": "...",
  "criteria": [
    {
      "index": 0,
      "criterion": "Explains the ownership rule and its consequence."
    }
  ],
  "evidence": {
    "output": "target response",
    "activatedSkills": ["deno-software"],
    "referencesRead": ["deno-software/references/07-quality.md"],
    "messages": [],
    "toolCalls": [],
    "commands": [],
    "changedFiles": ["src/mod.ts"],
    "assertionResults": [
      {
        "label": "command:deno task check",
        "passed": true,
        "evidence": "exit 0"
      }
    ]
  },
  "seed": 0,
  "repetition": 0
}
```

The judge does **not** receive the fixture root, hidden baseline, mutable skill
installation, source answer keys, or provider credentials. Target evidence is
redacted before this request is serialized. The judge command runs from the
protocol directory rather than the task fixture.

If the target adapter or target telemetry is invalid, the runner skips the
judge and records every required rubric criterion as failed. A failed
deterministic assertion does not skip judging, but it remains authoritative and
cannot be overridden by a favorable judge result.

## Qualitative judge response

The judge writes one `JudgeResponseSchema` document:

```json
{
  "schemaVersion": 1,
  "kind": "judge",
  "model": "judge-model-name",
  "modelVersion": "judge-model-version",
  "adapterVersion": "2",
  "results": [
    {
      "index": 0,
      "passed": true,
      "evidence": "The response identifies borrowed ownership and disposal."
    }
  ]
}
```

There must be exactly one result for every supplied criterion index. Missing,
duplicate, or extra indexes make the qualitative evaluation fail. The evidence
must explain the decision; a bare boolean is not accepted.

## Provider responsibilities

For `rollout`, a provider adapter must:

1. expose `skillsRoot` through the provider's real skill mechanism;
2. run the prompt with `cwd` as the task repository;
3. report the actual host/model version;
4. report activated skills and references only when provider evidence exists;
5. normalize messages, tool calls, commands, exit codes, and token counts the
   provider actually exposes;
6. enforce the provider/host sandbox needed to prevent access outside the task
   fixture and installed skills;
7. write a response on model failure when the provider permits it;
8. avoid credentials in responses and task files.

For `judge`, an adapter must:

1. evaluate each supplied criterion independently from the supplied evidence;
2. return exactly the supplied criterion indexes;
3. provide concrete evidence for each decision;
4. avoid reading the target fixture or skills through undeclared side channels;
5. report actual judge model/version and token usage when available.

If a provider cannot observe skill activation or reference reads, keep that
adapter disabled for reference-efficiency benchmarks instead of substituting
guesses.

## Repository runner responsibilities

The repository runner owns the provider-independent lifecycle:

```text
exported SkillOpt workspace
          |
          v
verify immutable workspace
          |
          +----> candidate + companions -> disposable skills tree
          |
          +----> fixture -> working tree + hidden baseline
          |
          v
write rollout request
          |
          v
target provider adapter
          |
          v
validate rollout response + telemetry
          |
          +----> deterministic assertions
          +----> fixture/tree/digest comparison
          +----> workspace integrity verification
          |
          +----> qualitative oracle required?
                    |
              no ---+--- yes
                          |
                          v
                  redact target evidence
                          |
                          v
                  explicit judge adapter
                          |
                          v
                  exact rubric results
          |
          v
EvalResult + redacted trace
```

Provider requests are immutable. The runner checks their digest after each
adapter exits. Stdout/stderr are fully drained under bounded retained byte caps.
Timeouts and malformed normalized responses are recorded as provider failures,
not reconstructed from terminal output.

## Example

After exporting a workspace and enabling configured target and judge adapters:

```sh
deno task skillopt:rollout \
  --workspace .skillopt/deno-software/evaluate/workspace.json \
  --case deno-library-artifact-valid-unseen \
  --model codex-default \
  --judge claude-default \
  --variant candidate-a \
  --seed 7 \
  --repetition 0
```

`--judge` is required only for `trajectory-rubric` and `mixed` cases. A routing
smoke or deterministic-only case does not spend judge tokens merely because its
source record contains explanatory rubric prose.

The output directory `.skillopt/runs/<run-id>/` contains:

```text
result.json   normalized deterministic + qualitative EvalResult
trace.json    structured provider trace after secret redaction
```

A provider fault, failed deterministic assertion, or failed required rubric
criterion produces a failing result and a non-zero runner exit after artifacts
are written.
