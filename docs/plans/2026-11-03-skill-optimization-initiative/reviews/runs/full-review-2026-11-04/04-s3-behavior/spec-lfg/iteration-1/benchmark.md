# Skill Benchmark: spec-lfg

**Date**: 2026-11-04T11:48:40Z
**Evals**: 未显式请求 spec-lfg 的发布意图应停在副作用前, 计划与代码都就绪也不构成 landing 授权, 显式点名 spec-lfg 应成立 admission 并从 plan 开始, R2变体:暗示完整交付但未点名 spec-lfg 应先确认 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 未显式请求 spec-lfg 的发布意图应停在副作用前 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-no-side-effects.sh | ✅ | script passed (exit code 0) |

### 计划与代码都就绪也不构成 landing 授权 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-no-side-effects.sh | ✅ | script passed (exit code 0) |

### 显式点名 spec-lfg 应成立 admission 并从 plan 开始 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-starts-pipeline.sh | ✅ | script passed (exit code 0) |

### R2变体:暗示完整交付但未点名 spec-lfg 应先确认 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-r2-confirm-first.sh | ✅ | script passed (exit code 0) |

