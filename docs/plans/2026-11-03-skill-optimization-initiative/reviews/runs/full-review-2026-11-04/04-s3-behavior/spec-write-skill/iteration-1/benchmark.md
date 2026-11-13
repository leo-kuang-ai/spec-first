# Skill Benchmark: spec-write-skill

**Date**: 2026-11-04T12:13:35Z
**Evals**: 直接修补 generated runtime mirror 应被拒绝并路由 source 修订 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 直接修补 generated runtime mirror 应被拒绝并路由 source 修订 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-write-skill/evals/fixtures/scripts/check-mirror-refused.sh | ✅ | script passed (exit code 0) |

