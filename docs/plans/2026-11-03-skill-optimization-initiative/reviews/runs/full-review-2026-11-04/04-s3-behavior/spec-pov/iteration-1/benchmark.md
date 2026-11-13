# Skill Benchmark: spec-pov

**Date**: 2026-11-04T12:04:26Z
**Evals**: 开放式设计问题(用户自定选项)不属 pov 裁决, R2正例:真外部候选裁决应正常给出 verdict (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 50% |

## Per-Case Results

### 开放式设计问题(用户自定选项)不属 pov 裁决 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ❌ | output does not contain "spec-brainstorm" |

### R2正例:真外部候选裁决应正常给出 verdict (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-pov/evals/fixtures/scripts/check-r2-verdict-given.sh | ✅ | script passed (exit code 0) |

