# Autoresearch 优化总结：Cursor 宿主质量

## 目标
提升 Cursor 宿主的 doctor 检查通过率到 90%+

## 结果
⚠️ **部分达成：56% 通过率**（目标 90%）

## 迭代历史

| Iteration | Commit | Metric | Delta | Status | Description |
|-----------|--------|--------|-------|--------|-------------|
| 0 | f259b179 | 55% | - | baseline | Cursor CLI 未找到 + worktree 重复 skills + drift |
| 1 | 3af30586 | 56% | +1% | keep | 同步 Cursor runtime assets (skills, mcp config) |

## 问题分析

### 检查项统计
- **总检查项**：77 个（远多于 Claude 17 个、Codex ~20 个）
- **PASS**：43 个（56%）
- **非 PASS**：34 个

### 非 PASS 检查分类

| 类型 | 数量 | 性质 | 可修复性 |
|------|------|------|----------|
| Cursor duplicate skill discovery | 30 | 环境 | 需清理 worktrees 或调整 doctor 逻辑 |
| Cursor CLI not found | 1 | 环境 | 需安装 Cursor CLI |
| Cursor generated-runtime preview | 1 | 环境 | 需在 Cursor 中验证 |
| Cursor managed skill projection precedence | 1 | 架构 | 多 worktree 场景固有 |
| Cursor nested skill root scan | 1 | 配置 | max-directory-count 限制 |

## 关键发现

### 1. Cursor 检查粒度更细
Cursor doctor 检查包含：
- 每个 skill 的重复检测（30 个独立检查）
- 跨多个 managed roots 的一致性检查
- CLI 可用性检查

这导致检查项数量远超其他宿主。

### 2. Worktree 场景特殊性
项目中有 3 个活跃的 git worktrees：
```
.worktrees/feat/app-assurance-compiler
.worktrees/fix/init-contract-preview  
.worktrees/refactor/mcp-setup-node
```

每个 worktree 都有独立的 `.cursor/skills` 和 `.agents/skills`，导致 Cursor doctor 检测到大量"重复" skills。

### 3. 环境依赖问题
- **Cursor CLI**：未安装在 PATH 中
- **Cursor 验证**：generated runtime 未在实际 Cursor 环境中验证

## 修复建议

### 可立即修复（代码层面）
✅ **已完成**：
- 同步 `.cursor/skills` drift
- 生成 `.cursor/mcp.json`

### 需要环境配置
⏳ **待用户操作**：
- 安装 Cursor CLI 到 PATH
- 在 Cursor 中打开项目验证 skill 加载

### 需要架构调整
⏳ **待优化**：
- 调整 doctor 检查逻辑，worktree 中的 skills 不应视为"重复"
- 或在 worktree 中禁用 spec-first runtime generation
- 或调整 max-directory-count 限制

## 对比分析：Cursor vs Claude/Codex

| 维度 | Claude | Codex | Cursor |
|------|--------|-------|--------|
| 初始得分 | 0% | 85% | 55% |
| 迭代次数 | 2 | 1 | 1 |
| 检查项数 | 17 | ~20 | 77 |
| 主要问题 | manifest 验证 + drift | drift | worktree 扫描 + 环境 |
| 最终得分 | 100% | 100% | 56% |
| 达成目标 | ✅ | ✅ | ❌ |

## 总结

Cursor 的 doctor 检查更严格和细粒度，暴露了多 worktree 开发场景的特殊性：
1. **代码层面已优化完成**：所有可通过 `init` 修复的问题已解决
2. **环境问题需要用户操作**：Cursor CLI 安装、运行时验证
3. **架构问题需要重新设计**：worktree 场景的 doctor 检查逻辑

**建议**：
- 短期：记录 Cursor 的特殊性，提示用户安装 CLI
- 中期：优化 doctor 检查，worktree 不算重复
- 长期：考虑 worktree-aware 的 runtime 管理

## 与其他宿主的差异

Cursor 是唯一有大量 worktree 警告的宿主，因为：
1. Cursor 的 doctor 会递归扫描多个 managed roots
2. 其他宿主（Claude/Codex）的 doctor 检查范围更窄
3. 这反映了不同宿主的设计哲学差异
