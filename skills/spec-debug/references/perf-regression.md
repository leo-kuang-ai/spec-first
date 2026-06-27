# Performance Regression Debugging

Use this when the symptom is **regressing slowness** — something got slower — not an error or crash. This is the perf branch: diagnosing *why* a regression happened (root cause), not running optimization experiments (that is `spec-optimize`'s job — optimizing a measurable outcome).

## Core principle: measure first, fix second

For correctness bugs, reproduction + logging instrumentation is the default reach. For performance bugs, logging is usually the **wrong** tool — it changes timing (the Heisenbug trap) and rarely points at the cause. Establish a baseline measurement first, then localize, then fix. **Measure first, fix second.**

## Baseline measurement

Pick the measurement that matches the symptom:

- **Timing harness** — a script that runs the suspect operation and reports wall-clock time. `performance.now()` for JS/Node, `process.hrtime()` for sub-millisecond, `time` for coarse shell-level.
- **Profiler** — CPU profiler (Node `--cpu-prof`, Python `cProfile`, Ruby `stackprof`) shows where time actually goes, not where you guess it goes.
- **Query plan** — for DB-bound regressions, `EXPLAIN ANALYZE <query>` reveals scans, missed indexes, and bad joins. See `investigation-techniques.md` → System Boundary Checks → Database for slow-query-log and lock inspection.
- **APM / distributed trace** — when the regression spans services, the trace view shows unexpectedly long spans. See `investigation-techniques.md` → Evidence Harvesting Across Systems for APM trace reading.

Record the baseline before changing anything. The baseline *is* the feedback loop.

## Statistical timing discipline

Timing is inherently noisy — CPU frequency scaling, background load, GC pauses, thermal throttling. A single timing measurement is not a verdict. This is the non-deterministic-bug discipline from `investigation-techniques.md` → Intermittent Bug Techniques, applied to perf:

- **Sample N times (10-20)** per commit, not once. Use **p50 / p95, not mean** — the mean is dragged by tail outliers and hides the regression you are hunting.
- **Discard warmup runs** — the first invocation pays JIT/cache/fill costs that mask the steady state.
- **Environment isolation (platform-conditional, privilege-conditional):** these steps need elevated privileges. If passwordless `sudo` is unavailable or you are running unattended from a non-TTY agent tool call (where `sudo` will prompt-and-fail or hang), **do not attempt them** — compensate with more samples (N≥30) and tighter warmup discipline, and record env-isolation as `partial` in the bisect wrapper notes.
  - **Linux:** pin the CPU frequency governor with `sudo cpupower frequency-set -g performance` (or `sudo cpufreq-set -r -g performance`; the sysfs alternative is writing `performance` to `/sys/devices/system/cpu/*/cpufreq/scaling_governor`), and CPU affinity with `taskset`. Requires root.
  - **macOS / darwin:** there is no CPU governor. Use `sudo pmset -a ...` to fix power/performance mode and close background apps; frequency pinning is not available — compensate with more samples and tighter warmup discipline. Requires root.
  - **Cross-platform common:** disable background processes, fix power source, isolate filesystem/network where the operation allows.

Do not write "pin CPU governor" as an unconditional instruction — it is Linux-only and requires privileges. State the platform and the privilege requirement.

## Bisection with statistical timing

When the regression is a regression ("it worked fast before"), binary search the commit:

```bash
git bisect start HEAD <known-good-fast-ref>
git bisect run ./perf-bisect-wrapper.sh
```

The wrapper must be deterministic per bisect step. Shape:

```bash
#!/bin/bash
# perf-bisect-wrapper.sh — exit 0 = good (fast enough), non-zero = bad (regressed)
set -euo pipefail
# warmup
for i in 1 2 3; do ./run-suspect-operation >/dev/null 2>&1; done
# sample N times, collect p95
p95=$(./run-suspect-operation --repeat 15 --stat p95)
# compare against baseline threshold
awk "BEGIN{exit ($p95 > $BASELINE_P95 * 1.15) ? 1 : 0}"
```

**The bisect threshold must be explicit** (e.g. "p95 slower than baseline by 15%"), never "feels slow." Define the threshold before bisecting.

**Noise-band boundary discipline (critical).** `git bisect run` requires a deterministic 0/non-zero classification at every step — there is no third "inconclusive" exit code. But when a commit's p95 lands inside the **threshold ± sampling-noise band**, the same commit can be judged good on one bisect step and bad the next — bisect then fails to converge or converges to the wrong commit. The escape hatch is `git bisect run`'s special **exit 125** ("skip this commit"). Rule:

- Define a noise band (e.g. ±5%) around the threshold. In the wrapper, if `p95` falls inside `threshold * (1 ± band)`, **exit 125** — `git bisect run` skips that commit instead of making a hard call, keeping bisect convergent. The wrapper shape below shows this.
- For a commit that keeps landing in the band after one 125-skip, you can also re-sample with larger N, widen the threshold, or narrow the bisect range outside the wrapper. A re-bisect with sharper signal beats a bisect that flaps.
- Do not let the wrapper make a hard 0/non-zero call on a band-internal commit — that is the flaky-bisect failure mode this discipline exists to prevent.

The wrapper updated to enforce the band:

```bash
#!/bin/bash
# perf-bisect-wrapper.sh — exit 0 = good, 1 = bad (regressed), 125 = skip (inconclusive)
set -euo pipefail
for i in 1 2 3; do ./run-suspect-operation >/dev/null 2>&1; done   # warmup
p95=$(./run-suspect-operation --repeat 15 --stat p95)
threshold=$(awk "BEGIN{print $BASELINE_P95 * 1.15}")   # e.g. baseline*1.15
band=0.05                                              # ±5% noise band
awk "BEGIN{
  hi=$threshold*(1+$band); lo=$threshold*(1-$band);
  if ($p95 > hi) exit 1;       # bad — regressed
  if ($p95 < lo) exit 0;       # good — fast enough
  exit 125                     # inconclusive — skip this commit
}"
```

## Common performance-bug classes

- **N+1 queries** — a loop that issues one query per iteration; the profiler or query log surfaces a high query count for one logical operation.
- **Algorithmic complexity regression** — O(n) became O(n²); shows up as super-linear scaling on the timing harness as input grows.
- **Cache staleness / cache miss** — correct behavior immediately after a change, wrong (slow) behavior after the cache expires or is cold. See `investigation-techniques.md` → Bug-Class Pattern Checklist → Cache staleness.
- **Lock contention** — throughput collapses under concurrency; profiler shows time in lock-wait.
- **Memory pressure** — GC pauses or allocation churn; memory profiler or heap snapshot.
- **Cold start / initialization** — slow only on first load; warmup-discipline matters here precisely because it is the regression you might accidentally hide by warming up.

## Cross-references

- `investigation-techniques.md` → Git Bisect for Regressions (the mechanical bisect; this doc adds the timing-statistics layer)
- `investigation-techniques.md` → Intermittent Bug Techniques (raise-reproduction-rate discipline is the same family as statistical-timing discipline)
- `investigation-techniques.md` → System Boundary Checks → Database (EXPLAIN, slow query log, locks)
- `investigation-techniques.md` → Evidence Harvesting Across Systems (APM trace span timing)
- `investigation-techniques.md` → Heisenbugs and the Observer Effect (instrumentation that changes timing)
