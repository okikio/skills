# Performance experiments

## Protocol before result

Write the hypothesis, target workflow, protected workflows, metrics, dataset,
runtime/tool versions, warmup, process isolation, ordering, sample count,
statistics, acceptance threshold, and rollback before measuring.

Baseline and candidate should carry their own source and harness snapshot. Run
timing and retained-memory measurements in fresh processes where cross-run state
would bias results. Preserve raw samples and use deterministic round-robin order.

## Decision gates

Use effect size and uncertainty, not only the fastest sample. The attached
wikitext experiment protocol uses a useful example policy: require a meaningful
median target improvement, reject statistically supported critical regressions,
and adjust multiple comparisons. Adopt thresholds appropriate to the project and
write them before seeing results.

## Protected workflows

A tokenizer microbenchmark win does not justify slower parse, session, memory,
or real consumer behavior. Test representative end-to-end workloads, correctness,
allocation/retention, and cold/warm behavior.

## Reporting

Separate hypothesis, methodology, observations, limitations, and conclusion.
Report environment and raw result location. Do not claim a universal speedup from
one fixture or an unexecuted benchmark.
