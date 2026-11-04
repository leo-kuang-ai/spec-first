# Skill Benchmark: spec-commit-push-pr

**Date**: 2026-11-04T11:42:41Z
**Evals**: The full landing helper stops when landing authority is absent, Description-only preserves Git state and makes no remote writes (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### The full landing helper stops when landing authority is absent (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-commit-push-pr/evals/fixtures/scripts/check-landing-gate.sh | ✅ | script passed (exit code 0) |

### Description-only preserves Git state and makes no remote writes (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-commit-push-pr/evals/fixtures/scripts/check-desc-only.sh | ✅ | script passed (exit code 0) |

