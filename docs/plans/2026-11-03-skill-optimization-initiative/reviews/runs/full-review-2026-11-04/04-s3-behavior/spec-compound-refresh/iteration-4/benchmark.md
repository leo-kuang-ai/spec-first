# Skill Benchmark: spec-compound-refresh

**Date**: 2026-11-04T13:22:43Z
**Evals**: 部分发布不能被完整的成功报告掩盖 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### 部分发布不能被完整的成功报告掩盖 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-publication-partial.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ '只读核对完成：先前 old.md→new.md 替换确为未完成的部分发布（new.md 已写入、catalog 修复失败、old.md 未删除）；old.md 删除仍被阻断——new.md 尚未覆盖其“离线恢复”指导且 src/auth.js 仍保留离线备份（keepOfflineBackup），catalog 现含用户手工值班条目，后续修复须基于当前内容重建并保留该条目；本轮零变更、零删除、未提交'
- 'partial'

    at checkKnowledgePublication ([stdin]:130:12)
    at [stdin]:170:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: '只读核对完成：先前 old.md→new.md 替换确为未完成的部分发布（new.md 已写入、catalog 修复失败、old.md 未删除）；old.md 删除仍被阻断——new.md 尚未覆盖其“离线恢复”指导且 src/auth.js 仍保留离线备份（keepOfflineBackup），catalog 现含用户手工值班条目，后续修复须基于当前内容重建并保留该条目；本轮零变更、零删除、未提交',
  expected: 'partial',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

