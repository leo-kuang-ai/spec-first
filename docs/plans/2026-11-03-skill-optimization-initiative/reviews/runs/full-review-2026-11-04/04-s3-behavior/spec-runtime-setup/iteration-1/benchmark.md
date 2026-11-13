# Skill Benchmark: spec-runtime-setup

**Date**: 2026-11-04T11:54:21Z
**Evals**: check 保持夹具与配置只读, 代码理解类问题应指出不属于 setup 职责, 非真实宿主表面上的裸调用必须 fail-closed 且零副作用 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 33% ± 47% |

## Per-Case Results

### check 保持夹具与配置只读 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-runtime-setup/evals/fixtures/scripts/check-readonly-verify.sh | ✅ | PASS: 夹具字节与配置哨兵保持，setup facts 未产生；不证明全局无副作用 |

### 代码理解类问题应指出不属于 setup 职责 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh | ❌ | script exited with code 127 [stderr: bash: /tmp/skill-up-judge-1793793123995791000/check-readonly-verify.sh: No such file or directory] |

### 非真实宿主表面上的裸调用必须 fail-closed 且零副作用 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-runtime-setup/evals/fixtures/scripts/check-bare-mutation.sh | ❌ | script exited with code 1 [stderr: /tmp/skill-up-judge-1793793260815725000/script: line 8: exit_code�: unbound variable] |

