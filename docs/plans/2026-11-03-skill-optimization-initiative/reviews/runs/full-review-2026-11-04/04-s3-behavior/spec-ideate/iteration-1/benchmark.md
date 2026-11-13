# Skill Benchmark: spec-ideate

**Date**: 2026-11-04T11:52:41Z
**Evals**: 无主题的模糊请求应触发 scope 提问而非直接生成, 打磨用户既有想法应停止并指向 spec-brainstorm, 非软件主题的情境宣告不得泄漏内部模式标签, 仓库内主题应走完整流程并落盘 ideation artifact, 无仓库时的 Surprise me 必须先索要材料并干净结束, R2变体:换措辞的 refine 请求仍应路由 spec-brainstorm (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 83% ± 37% |

## Per-Case Results

### 无主题的模糊请求应触发 scope 提问而非直接生成 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-ideate/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 打磨用户既有想法应停止并指向 spec-brainstorm (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-brainstorm]} | ✅ | output satisfies all contains checks (all:[spec-brainstorm]) |

### 非软件主题的情境宣告不得泄漏内部模式标签 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-ideate/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 仓库内主题应走完整流程并落盘 ideation artifact (with_skill)

- **Pass Rate**: 0% (0/0)

### 无仓库时的 Surprise me 必须先索要材料并干净结束 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-ideate/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### R2变体:换措辞的 refine 请求仍应路由 spec-brainstorm (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-brainstorm]} | ✅ | output satisfies all contains checks (all:[spec-brainstorm]) |

