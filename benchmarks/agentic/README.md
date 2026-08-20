# Agentic Behavior Gate for spec-first

Copied from [ponytail/benchmarks/agentic](https://github.com/DietrichGebert/ponytail/tree/main/benchmarks/agentic) to measure behavior quality of spec-first skills.

## Origin

- Source: ponytail commit `2ed6c52` (2026-08-03)
- Harness design: paired headless Claude Code sessions, per-arm isolation, git diff LOC + deterministic scorers
- Evidence: `ponytail/benchmarks/results/2026-06-18-agentic.md` (12 feature tasks), `2026-06-22-issue-245-217-comprehension.md` (root-cause fix rate)

## Current Gate: spec-debug root-cause

**Fixture:** `trace-transfer` — bug report names `transfer()`, but `transfer()` and `withdraw()` both debit through shared `_debit()`. Lazy fix guards only `transfer()`; root-cause fix guards `_debit()` once. Scorer exercises **withdraw** (never named in report), so only root-cause fix passes.

**Arms:**
- `baseline`: no skill
- `spec-debug`: current canonical `skills/spec-debug/SKILL.md`

**Run:**
```bash
# Selftest first (must pass before running model)
python3 benchmarks/agentic/run.py --selftest

# n=6, Sonnet 4.6 or Opus 4.8 (NOT Haiku — both arms 0/6 on Haiku)
python3 benchmarks/agentic/run.py \
  --task trace-transfer \
  --baseline-dir /tmp/spec-first-baseline \
  --spec-debug-dir /tmp/spec-first-spec-debug \
  --model claude-sonnet-4-6 \
  --n 6

# Read results
cat /tmp/spec-first-baseline/trace-transfer-*.json
cat /tmp/spec-first-spec-debug/trace-transfer-*.json
```

**Expected outcome:**
- If spec-debug's root-cause instruction is **operational** (grep every caller, fix shared function): Y > X
- If it's **aspirational** (trace the flow end to end): Y ≈ X and both low
- Ponytail evidence: baseline 1/6 → ponytail 6/6 on Sonnet 4.6 & Opus 4.8

## Files

- `run.py` — harness entry, per-arm isolation, workspace setup
- `tasks.py` — `score_trace_transfer` + seed + lazy-wrong reference
- `judge.py` — correctness scorer
- `complete.py` — session driver

## Governance

This gate belongs to the P0 step of `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md` § 7. It is the **precondition** for P1-P3 text edits. No behavior evidence → any edit must be downgraded per § 8.
