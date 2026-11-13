# Skill Benchmark: spec-app-consistency-audit

**Date**: 2026-11-04T12:17:42Z
**Evals**: 无 PRD/Figma/源码输入应被 gate, 只要跑测试/lint 应指出不属本审计, 普通 diff 代码审查应点名 spec-code-review, R2变体:实现/修复请求应路由 spec-work (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 无 PRD/Figma/源码输入应被 gate (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-app-consistency-audit/evals/skillup/fixtures/scripts/check-no-input-gate.sh | ✅ | script passed (exit code 0) |

### 只要跑测试/lint 应指出不属本审计 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-app-consistency-audit/evals/skillup/fixtures/scripts/check-no-input-gate.sh | ✅ | script passed (exit code 0) |

### 普通 diff 代码审查应点名 spec-code-review (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-code-review]} | ✅ | output satisfies all contains checks (all:[spec-code-review]) |

### R2变体:实现/修复请求应路由 spec-work (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-work]} | ✅ | output satisfies all contains checks (all:[spec-work]) |

