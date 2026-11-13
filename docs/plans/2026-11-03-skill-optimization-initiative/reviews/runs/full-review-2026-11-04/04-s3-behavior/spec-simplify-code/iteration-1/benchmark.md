# Skill Benchmark: spec-simplify-code

**Date**: 2026-11-04T12:14:38Z
**Evals**: Simplification preserves invalid-input and valid-entry behavior, A docs-only scope has no code simplification yield, bug 请求应路由 spec-debug, An elegance request preserves the safety baseline (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### Simplification preserves invalid-input and valid-entry behavior (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh | ✅ | PASS: invalid JSON rejected, process survives, valid entries preserved, no new reachable commit |

### A docs-only scope has no code simplification yield (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-simplify-code/evals/fixtures/scripts/check-no-yield-scope.sh | ✅ | script passed (exit code 0) |

### bug 请求应路由 spec-debug (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

### An elegance request preserves the safety baseline (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-simplify-code/evals/fixtures/scripts/check-r2-safety-stays.sh | ✅ | PASS: invalid JSON rejected, process survives, valid entries preserved, no new reachable commit |

