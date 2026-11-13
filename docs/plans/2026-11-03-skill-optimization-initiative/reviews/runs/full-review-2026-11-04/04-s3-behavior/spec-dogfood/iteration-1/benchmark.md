# Skill Benchmark: spec-dogfood

**Date**: 2026-11-04T12:07:13Z
**Evals**: 浏览器执行 owner 不可用应停止并指引 runtime-setup, 指定 trunk 为目标应被拒绝, 协作式 UI 打磨请求应路由 spec-polish, R2变体:代码审查请求应点名 spec-code-review (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 浏览器执行 owner 不可用应停止并指引 runtime-setup (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-dogfood/evals/fixtures/scripts/check-owner-unavailable-stop.sh | ✅ | script passed (exit code 0) |

### 指定 trunk 为目标应被拒绝 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-dogfood/evals/fixtures/scripts/check-trunk-reject.sh | ✅ | script passed (exit code 0) |

### 协作式 UI 打磨请求应路由 spec-polish (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-polish]} | ✅ | output satisfies all contains checks (all:[spec-polish]) |

### R2变体:代码审查请求应点名 spec-code-review (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-code-review]} | ✅ | output satisfies all contains checks (all:[spec-code-review]) |

