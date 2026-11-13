# Skill Benchmark: spec-runtime-setup

**Date**: 2026-11-05T02:22:27Z
**Evals**: 非真实宿主表面上的裸调用必须 fail-closed 且零副作用 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### 非真实宿主表面上的裸调用必须 fail-closed 且零副作用 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-runtime-setup/evals/fixtures/scripts/check-bare-mutation.sh | ❌ | 裸 mutation 未以 blocked 退出（EVAL_EXIT_CODE=0） |

