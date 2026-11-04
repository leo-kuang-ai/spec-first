# Skill Benchmark: spec-sweep

**Date**: 2026-11-04T12:17:21Z
**Evals**: headless 首跑应报 requires interactive setup 并停止 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### headless 首跑应报 requires interactive setup 并停止 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[first run requires interactive setup]} | ✅ | output satisfies all contains checks (all:[first run requires interactive setup]) |

