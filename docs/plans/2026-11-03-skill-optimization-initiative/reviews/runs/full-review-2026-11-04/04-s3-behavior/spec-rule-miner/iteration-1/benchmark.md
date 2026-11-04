# Skill Benchmark: spec-rule-miner

**Date**: 2026-11-04T12:16:35Z
**Evals**: 交互场景未经 preview 确认不得写规则文件, 审查请求应路由 spec-code-review, R2变体:调试请求应路由 spec-debug (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 交互场景未经 preview 确认不得写规则文件 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-rule-miner/evals/fixtures/scripts/check-preview-first.sh | ✅ | script passed (exit code 0) |

### 审查请求应路由 spec-code-review (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-code-review]} | ✅ | output satisfies all contains checks (all:[spec-code-review]) |

### R2变体:调试请求应路由 spec-debug (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

