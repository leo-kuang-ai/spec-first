# Skill Benchmark: spec-code-review

**Date**: 2026-11-05T02:15:47Z
**Evals**: 冲突 scope 参数必须在审查前失败 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 0% |

## Per-Case Results

### 冲突 scope 参数必须在审查前失败 (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-code-review/evals/fixtures/scripts/check-conflicting-scope.sh | ❌ | script exited with code 1 [stderr: 冲突参数输出不是单个裸 JSON：Expected ',' or '}' after property value in JSON at position 1715 (line 1 column 1716)] |

