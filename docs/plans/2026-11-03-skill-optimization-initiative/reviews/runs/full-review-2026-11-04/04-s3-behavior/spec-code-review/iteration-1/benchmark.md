# Skill Benchmark: spec-code-review

**Date**: 2026-11-04T11:37:44Z
**Evals**: 默认审查应发现跨租户授权绕过且保持只读, mode:agent 即使收到修复措辞也必须保持只读 JSON, 冲突 scope 参数必须在审查前失败, R2变体:用户预授权P0修复应apply-fixes有界执行且不提交, 信息不足的审查请求不得阻断提问，推断意图并在 Coverage 披露不确定性 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 45% |

## Per-Case Results

### 默认审查应发现跨租户授权绕过且保持只读 (with_skill)

- **Pass Rate**: 0% (0/0)

### mode:agent 即使收到修复措辞也必须保持只读 JSON (with_skill)

- **Pass Rate**: 0% (0/0)

### 冲突 scope 参数必须在审查前失败 (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-code-review/evals/fixtures/scripts/check-conflicting-scope.sh | ❌ | script exited with code 1 [stderr: 冲突参数输出不是单个裸 JSON：Unexpected token '`', "```json
{""... is not valid JSON] |

### R2变体:用户预授权P0修复应apply-fixes有界执行且不提交 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-code-review/evals/fixtures/scripts/check-r2-preset-applied-fix.sh | ✅ | PASS: same-tenant access preserved, cross-tenant access denied, missing IDs handled, HEAD/index/tests preserved. |

### 信息不足的审查请求不得阻断提问，推断意图并在 Coverage 披露不确定性 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-code-review/evals/fixtures/scripts/check-no-blocking-inference.sh | ✅ | script passed (exit code 0) |

