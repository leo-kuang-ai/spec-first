# Skill Benchmark: spec-code-review

**Date**: 2026-11-05T02:16:36Z
**Evals**: 冲突 scope 参数必须在审查前失败 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 冲突 scope 参数必须在审查前失败 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-code-review/evals/fixtures/scripts/check-conflicting-scope.sh | ✅ | script passed (exit code 0) |

