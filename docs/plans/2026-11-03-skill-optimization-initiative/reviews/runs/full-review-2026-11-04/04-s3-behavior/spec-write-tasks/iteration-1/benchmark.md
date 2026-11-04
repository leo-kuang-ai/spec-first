# Skill Benchmark: spec-write-tasks

**Date**: 2026-11-04T11:30:44Z
**Evals**: 裸拆分请求应询问源计划路径, 远程仓库输入应被拒绝并要求本地 source-owned 输入, 小型低风险计划应倾向 skip 直接 spec-work, 非 active 计划不得编译为可执行任务包 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 裸拆分请求应询问源计划路径 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-write-tasks/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 远程仓库输入应被拒绝并要求本地 source-owned 输入 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-write-tasks/evals/fixtures/scripts/rejects-remote.sh | ✅ | script passed (exit code 0) |

### 小型低风险计划应倾向 skip 直接 spec-work (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-work]} | ✅ | output satisfies all contains checks (all:[spec-work]) |

### 非 active 计划不得编译为可执行任务包 (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{all:[source_plan_non_active]} | ✅ | output satisfies all contains checks (all:[source_plan_non_active]) |

