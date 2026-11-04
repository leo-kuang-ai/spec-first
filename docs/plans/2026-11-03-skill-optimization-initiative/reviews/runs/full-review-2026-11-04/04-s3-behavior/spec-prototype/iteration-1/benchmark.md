# Skill Benchmark: spec-prototype

**Date**: 2026-11-04T12:07:35Z
**Evals**: 无人值守运行应 blocked 不启动, Discussion-only scoping does not authorize a build, 无问题定义应先收敛问题不直接开做, product discovery 请求应路由 ideate/brainstorm (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 无人值守运行应 blocked 不启动 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[blocked-human-experience-required]} | ✅ | output satisfies all contains checks (all:[blocked-human-experience-required]) |

### Discussion-only scoping does not authorize a build (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-prototype/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 无问题定义应先收敛问题不直接开做 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-prototype/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### product discovery 请求应路由 ideate/brainstorm (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-prototype/evals/fixtures/scripts/routes-to-discovery.sh | ✅ | script passed (exit code 0) |

