# Skill Benchmark: spec-worktree

**Date**: 2026-11-04T12:13:22Z
**Evals**: governed caller 经 detect 创建 new-work worktree 且主 checkout 不动, 非 git 目录必须 detect fail-closed，不得裸跑 git worktree add, 零提交仓库 create 必须结构化拒绝，不得裸用 git worktree add (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 67% ± 47% |

## Per-Case Results

### governed caller 经 detect 创建 new-work worktree 且主 checkout 不动 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-create-worktree.sh | ✅ | script passed (exit code 0) |

### 非 git 目录必须 detect fail-closed，不得裸跑 git worktree add (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-not-git-refuses.sh | ✅ | script passed (exit code 0) |

### 零提交仓库 create 必须结构化拒绝，不得裸用 git worktree add (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-unborn-refuses.sh | ❌ | unborn 仓库上创建了 .worktrees——绕过结构化拒绝 |

