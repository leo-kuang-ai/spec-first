# Skill Benchmark: spec-test-browser

**Date**: 2026-11-05T02:26:34Z
**Evals**: 非法 origin token 应 fail-closed 拒绝 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 非法 origin token 应 fail-closed 拒绝 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[target-origin-invalid]} | ✅ | output satisfies all contains checks (all:[target-origin-invalid]) |

