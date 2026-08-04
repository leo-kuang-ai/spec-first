# Autoresearch 优化总结：Claude Code 宿主质量

## 目标
提升 Claude Code 宿主的 doctor 检查通过率到 90%+

## 结果
✅ **目标达成：100% 通过率**

## 迭代历史

| Iteration | Commit | Metric | Delta | Status | Description |
|-----------|--------|--------|-------|--------|-------------|
| 0 | b72a6234 | 0% | - | baseline | 初始状态：spec-plan-workspace 导致 manifest 验证失败 |
| 1 | 605352b2 | 84% | +84% | keep | 移除无效的 spec-plan-workspace 工作目录 |
| 2 | 8d559887 | 100% | +16% | keep | 同步 Claude runtime assets (hooks, commands, skills) |

## 关键修复

### Iteration #1: 移除无效 spec-plan-workspace (+84%)
**问题**：`skills/spec-plan-workspace/` 不是有效的 skill，而是测试/评估迭代数据目录。它被 `listBundledSkills()` 识别为 skill，但 `skills-governance.json` 中没有对应条目，导致 manifest 验证失败。

**修复**：将 `spec-plan-workspace` 移动到 `.archive/` 目录保留历史数据。

**影响**：
- 消除所有 ERROR 级别的检查失败
- 修复 4 个检查项：commands、skills、agents、agent support assets

### Iteration #2: 同步 runtime assets (+16%)
**问题**：CLI 路径变更和 source 更新导致 3 个 runtime assets drift:
- `.claude/hooks/session-start`: CLI 路径指向旧的全局安装路径
- `.claude/commands`: spec-plan.md 和 spec-runtime-setup.md 内容不匹配
- `.claude/skills`: spec-plan 和 spec-runtime-setup skill 内容不匹配

**修复**：运行 `spec-first init --claude --yes` 执行 managed hard reset 并重新同步所有 assets。

**影响**：
- 消除所有 WARNING 级别的检查失败
- 修复 3 个检查项，达到 100% 通过率

## 验证

### Doctor 最终状态
```
诊断结果：可用
宿主状态：CLAUDE：正常
待处理项：无
```

所有 17 个检查项全部 PASS：
- ✅ 通用环境：Node.js, Git, runtime asset manifest, developer profile
- ✅ Claude 宿主：CLI, state, hooks (4), commands, settings (4), skills, agents

### Guard 测试
```bash
npm run test:smoke
```
✅ 5/5 tests passed

## 总结

通过 2 次迭代，成功将 Claude Code 宿主的 doctor 检查通过率从 0% 提升到 100%：
1. **识别并移除无效 skill 目录** - 解决了 governance 验证失败的根本原因
2. **同步 runtime assets** - 确保 source 与 runtime 一致

所有变更都通过了 smoke tests，没有破坏现有功能。

## 适用性

这个优化流程可以应用到其他宿主（Codex、Cursor、Kiro、Qoder、OpenCode）来提升整体多宿主安装质量。
