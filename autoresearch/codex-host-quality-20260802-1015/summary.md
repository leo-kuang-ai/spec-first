# Autoresearch 优化总结：Codex 宿主质量

## 目标
提升 Codex 宿主的 doctor 检查通过率到 90%+

## 结果
✅ **目标达成：100% 通过率**

## 迭代历史

| Iteration | Commit | Metric | Delta | Status | Description |
|-----------|--------|--------|-------|--------|-------------|
| 0 | 94a8d5a1 | 85% | - | baseline | 初始状态：session-start hook 和 2 个 skills drift |
| 1 | 4fa056bb | 100% | +15% | keep | 同步 Codex runtime assets (hooks, skills) |

## 关键修复

### Iteration #1: 同步 runtime assets (+15%)
**问题**：CLI 路径变更和 source 更新导致 2 个 runtime assets drift:
- `.codex/hooks/session-start`: CLI 路径指向旧的全局安装路径
- `.agents/skills`: spec-plan 和 spec-runtime-setup skill 内容不匹配

**修复**：运行 `spec-first init --codex --yes` 执行 managed hard reset 并重新同步所有 assets。

**影响**：
- 消除所有 WARNING 级别的检查失败
- 修复 2 个检查项，达到 100% 通过率

## 验证

### Doctor 最终状态
```
诊断结果：可用
宿主状态：CODEX：正常
待处理项：无
```

所有检查项全部 PASS

### Guard 测试
✅ 所有 smoke tests 通过（已在 Claude 优化时验证）

## 总结

通过 1 次迭代，成功将 Codex 宿主的 doctor 检查通过率从 85% 提升到 100%。

**关键发现**：
- Codex 的问题与 Claude 类似，都是 runtime drift
- 由于之前已经移除了 spec-plan-workspace，Codex 没有遇到 manifest 验证失败
- 修复速度更快（1 次迭代 vs Claude 的 2 次）

## 对比分析：Claude vs Codex

| 维度 | Claude | Codex |
|------|--------|-------|
| 初始得分 | 0% | 85% |
| 迭代次数 | 2 | 1 |
| 主要问题 | manifest 验证失败 + drift | 仅 drift |
| 最终得分 | 100% | 100% |

Codex 优化更快的原因：
1. 受益于 Claude 优化时移除的 spec-plan-workspace
2. 初始状态更健康（85% vs 0%）
3. 只需处理 drift 问题
