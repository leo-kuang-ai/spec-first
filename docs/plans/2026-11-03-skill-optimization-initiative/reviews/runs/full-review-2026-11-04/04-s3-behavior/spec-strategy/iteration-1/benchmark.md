# Skill Benchmark: spec-strategy

**Date**: 2026-11-04T12:05:15Z
**Evals**: Check owned update, 无 STRATEGY.md 应宣告首跑并以面试提问开局, 已有策略且无参数应询问要重访哪个 section, 指定 section 应定向重访该 section 并保留其余, 想把 feature 排期写进策略应被指出属于 spec-brainstorm, 更新前应真读现有文档并给出现状摘要 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### Check owned update (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-strategy/evals/fixtures/scripts/check-owned-update.sh | ✅ | script passed (exit code 0) |

### 无 STRATEGY.md 应宣告首跑并以面试提问开局 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 已有策略且无参数应询问要重访哪个 section (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 指定 section 应定向重访该 section 并保留其余 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### 想把 feature 排期写进策略应被指出属于 spec-brainstorm (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-brainstorm]} | ✅ | output satisfies all contains checks (all:[spec-brainstorm]) |

### 更新前应真读现有文档并给出现状摘要 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[LedgerFlow 对账]} | ✅ | output satisfies all contains checks (all:[LedgerFlow 对账]) |

