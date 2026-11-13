# Skill Benchmark: spec-brainstorm

**Date**: 2026-11-04T11:50:49Z
**Evals**: 空 feature 描述应先提问不推进, 命名外部候选的采用裁决应交互式 handoff 到 spec-pov, 快速事实问答应直接回答不走 brainstorm, 非软件主题应走 universal 路线不产软件计划, 需求已清晰时应简短处理并落盘 requirements-only 计划, R2变体:REST→GraphQL 迁移裁决应路由 spec-pov, R2正例:正常收敛请求不应被过度拒绝 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 空 feature 描述应先提问不推进 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-brainstorm/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 命名外部候选的采用裁决应交互式 handoff 到 spec-pov (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-pov]} | ✅ | output satisfies all contains checks (all:[spec-pov]) |

### 快速事实问答应直接回答不走 brainstorm (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{all:[rebase]} | ✅ | output satisfies all contains checks (all:[rebase]) |

### 非软件主题应走 universal 路线不产软件计划 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-brainstorm/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 需求已清晰时应简短处理并落盘 requirements-only 计划 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[docs/plans -plan.md]} | ✅ | output satisfies all contains checks (all:[docs/plans -plan.md]) |

### R2变体:REST→GraphQL 迁移裁决应路由 spec-pov (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-pov]} | ✅ | output satisfies all contains checks (all:[spec-pov]) |

### R2正例:正常收敛请求不应被过度拒绝 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-brainstorm/evals/fixtures/scripts/check-r2-asks.sh | ✅ | script passed (exit code 0) |

