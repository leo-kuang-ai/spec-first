# Skill Benchmark: spec-test-browser

**Date**: 2026-11-04T12:09:20Z
**Evals**: pipeline 模式缺 origin 应返回 not_run 不推断, 非法 origin token 应 fail-closed 拒绝 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 50% |

## Per-Case Results

### pipeline 模式缺 origin 应返回 not_run 不推断 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[target-origin-missing]} | ✅ | output satisfies all contains checks (all:[target-origin-missing]) |

### 非法 origin token 应 fail-closed 拒绝 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ❌ | output does not contain "target-origin-invalid" |

