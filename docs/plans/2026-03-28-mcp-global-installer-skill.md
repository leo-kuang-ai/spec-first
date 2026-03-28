# MCP 全局安装 Skill 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个 marketplace skill，用来检测本机已安装的 AI 编程平台，让用户选择目标平台，并以全局方式安装或更新必装 MCP，同时保证可回滚。

**架构：** 这个 skill 只以文档形式存在，放在 `marketplace/skills/mcp-global-installer/`。它使用从 `docs/01-需求分析/MCP工具/mcp工具.md` 提取的固定 MCP 注册表，结合现有模板/平台矩阵做平台检测，并采用按平台拆分的适配器模型，保证每个宿主运行时都能独立、安全地更新。

**技术栈：** Markdown skill 文档、marketplace skill 打包约定、现有 spec-first 平台文档、适合 shell 验证的检查命令。

---

### 任务 1：创建 skill 包骨架

**Files:**
- Create: `marketplace/skills/mcp-global-installer/SKILL.md`

**步骤 1：编写 skill 元数据和范围**

补充 frontmatter，说明这个 skill 的名称、它会全局安装必装 MCP，以及它的触发条件。

**步骤 2：写出顶层流程**

描述用户流程：检测已安装的平台、展示多选项、只对选中的平台执行安装/更新，并汇总结果。

**步骤 3：提交**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md
git commit -m "feat(skill): add MCP global installer skill scaffold"
```

### 任务 2：编码平台检测和选择规则

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/platform-matrix.md`

**步骤 1：写平台矩阵**

添加一个参考表，把现有 `packages/cli/src/templates` 的文件夹名映射成对应的宿主工具，并排除 `markdown`、`spec-first` 这类内部模板目录。

**步骤 2：定义检测规则**

说明 skill 如何判断某个平台是否已安装、是否可写，只有满足条件才出现在选择界面里。

**步骤 3：提交**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/platform-matrix.md
git commit -m "docs(skill): add platform detection matrix"
```

### 任务 3：加入安装、更新和回滚行为

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/install-recovery.md`

**步骤 1：写安装/更新规则**

描述幂等合并行为：不存在就安装，已存在就更新，没有变化就跳过。

**步骤 2：写恢复规则**

补充每个平台独立执行时的备份、临时文件、原子写入、校验和回滚步骤。

**步骤 3：提交**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/install-recovery.md
git commit -m "docs(skill): add safe update and rollback flow"
```

### 任务 4：补充验证指引和示例

**Files:**
- Modify: `marketplace/skills/mcp-global-installer/SKILL.md`
- Create: `marketplace/skills/mcp-global-installer/references/validation.md`

**步骤 1：增加验证清单**

列出每个平台写入后必须通过的检查：解析成功、目标 MCP 存在、未破坏其他条目、结果摘要可读。

**步骤 2：补充示例输出**

展示成功、更新、跳过、失败回滚四种输出，保证 skill 行为可预期。

**步骤 3：提交**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/validation.md
git commit -m "docs(skill): add validation guidance"
```

### 任务 5：做 skill 包结构冒烟检查

**Files:**
- Read: `marketplace/README.md`
- Read: `marketplace/skills/mcp-global-installer/SKILL.md`

**步骤 1：验证 marketplace 位置**

确认这个新 skill 的目录结构和现有 marketplace skill 一致，并且不需要改 CLI 源码。

**步骤 2：验证可发现性**

检查目录名、skill 名称和引用是否一致，并确保文档里没有把不支持的平台目录写成安装目标。

**步骤 3：提交**

```bash
git add marketplace/skills/mcp-global-installer/SKILL.md marketplace/skills/mcp-global-installer/references/*.md
git commit -m "docs(skill): finalize MCP global installer package"
```
