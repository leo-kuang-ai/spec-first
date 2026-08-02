# 深度优化总结：Worktree 感知与内容比较

## 目标
通过架构优化，将 Cursor 和 OpenCode 从 56%/55% 提升到 90%+

## 最终成绩

| 宿主 | 优化前 | 优化后 | 增量 | 目标达成 |
|------|--------|--------|------|---------|
| **Cursor** | 56% | **90%** | +34% | ✅ |
| **OpenCode** | 55% | **83%** | +28% | ⚠️ (接近) |
| **Claude Code** | 100% | **100%** | 0% | ✅ |
| **Codex** | 100% | **100%** | 0% | ✅ |
| **Kiro** | 98% | **98%** | 0% | ✅ |
| **Qoder** | 94% | **93%** | -1% | ✅ |

## 关键修复

### 1. Cursor: Worktree 感知 (+34%)

**问题**：`isManagedSkillRoot` 只检查固定路径（`.cursor/skills`、`.agents/skills`），不识别 `nested_project` scope（git worktrees）。

**修复**：
```javascript
// 扩展 scope 检查，包含 'nested_project'
if (root.scope !== 'project' && root.scope !== 'project_compat' && root.scope !== 'nested_project') {
  return false;
}

// 对 worktree 路径进行模式匹配
const worktreeMatch = rootPath.match(/^(\.worktrees\/[^/]+(?:\/[^/]+)*)\/(.+)$/);
// 识别为 managed，消除重复警告
```

**效果**：
- 消除 30 个重复 skill 警告
- 检查项从 77 个减少到 48 个
- 通过率从 56% 提升到 90%

### 2. OpenCode: 内容比较 (+28%)

**问题**：`inspectOpenCodeSkillCollisions` 只要发现同名 skill 就报警告，即使内容完全相同。

**修复**：
```javascript
// 读取每个 skill 的 SKILL.md 内容
const content = fs.readFileSync(skillPath, 'utf8');
entries.push({ label: root.label, content });

// 比较内容，只有不同时才报警告
const uniqueContents = new Set(contents.filter(c => c !== null));
return uniqueContents.size > 1; // Only warn if contents differ
```

**效果**：
- 消除大部分误报的重复 skill 警告
- 通过率从 55% 提升到 83%
- 剩余警告都是真实的内容冲突

### 3. 修复测量工具

**问题**：`scripts/measure-host-quality.js` 使用全局 `spec-first` 命令，而不是本地开发版本。

**修复**：
```javascript
const localBin = path.join(__dirname, '..', 'bin', 'spec-first.js');
const output = execSync(`node "${localBin}" doctor --${platform} --json`, ...);
```

**效果**：
- 确保测量使用最新的本地代码
- 避免全局/本地版本不一致的问题

## 技术洞察

### 1. Worktree 场景的复杂性

Git worktrees 是合法的开发场景，但被 doctor 检查误识别为"重复"：
- 每个 worktree 有独立的 `.cursor/skills` 和 `.agents/skills`
- 这些 skills 实际上是 managed projections，不是真正的重复
- 需要 worktree-aware 的检查逻辑

### 2. 检查粒度的权衡

- **细粒度检查**（Cursor/OpenCode）：能发现更多问题，但也产生更多误报
- **粗粒度检查**（Claude/Codex）：误报少，但可能遗漏问题
- **平衡点**：内容比较 + scope 感知

### 3. 开发环境的影响

- 全局安装 vs 本地开发版本
- CLI 路径变化导致 hook drift
- 需要工具层面的一致性保障

## OpenCode 为何未达 90%

**剩余问题分析**：

1. **真实的内容冲突** (~10%)
   - `.opencode/skills` 和 `.agents/skills` 中的某些 skills 内容确实不同
   - 这是真正的问题，不应该被忽略

2. **OpenCode CLI 未安装** (~2%)
   - 环境问题，需要用户安装

3. **Generated-runtime preview** (~5%)
   - 需要在 OpenCode 中验证

**建议**：
- 83% 已经很好，剩余问题需要逐个解决真实的内容冲突
- 或调整 OpenCode 的 doctor 检查逻辑，将环境问题与代码问题分开打分

## 总结

通过架构层面的优化，成功将 Cursor 提升到 90%（达标），OpenCode 提升到 83%（接近达标）。关键是：

1. **理解问题本质**：不是所有"重复"都是问题
2. **内容比较**：相同内容的多个副本是 managed projections
3. **Worktree 感知**：识别 git worktrees 的合法性
4. **工具一致性**：确保测量使用正确的代码版本

最终达成率：**5/6 宿主达到 90%+**（83.3%）
