# Skill Benchmark: spec-compound-refresh

**Date**: 2026-11-04T13:03:14Z
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
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-publication-partial.sh | ❌ | script exited with code 1 [stderr: <anonymous_script>:1
核对完成。所有证据齐备：README 所述与现场一致 —— new.md 为已写入但未覆盖离线恢复的后继候选；catalog 同时含指向 `old.md#离线恢复` 的旧条目（锚点在 old.md:15 仍解析，但属指向待删路径的必修链接）和必须保留的用户人工条目；`src/auth.js` 仍保留离线备份（`keepOfflineBackup: true`），old.md 的离线恢复内容仍是有效且被实质性引用的知识，其后继覆盖缺口阻断删除。本轮零写入、零删除；基线提交已使旧内容具备 Git 可恢复性。
^

SyntaxError: Unexpected token '核', "核对完成。所有证据齐"... is not valid JSON
    at JSON.parse (<anonymous>)
    at parseFinalMessage ([stdin]:20:15)
    at checkKnowledgePublication ([stdin]:116:18)
    at [stdin]:165:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)

Node.js v22.22.3] |

