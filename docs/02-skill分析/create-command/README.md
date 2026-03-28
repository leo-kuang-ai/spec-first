# Create-Command 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/create-command.md`

---

## 1. Skill 概述

### 1.1 核心定位

**create-command** 是一个命令生成器，用于创建新的斜杠命令并同步到多个平台目录。

| 维度 | 描述 |
|------|------|
| **目标** | 创建新的斜杠命令 |
| **输出** | `.cursor/commands/` + `.claude/commands/spec/` |
| **特点** | 双平台同步 |

### 1.2 命令格式

```bash
/spec:create-command <command-name> <description>
```

**示例**:
```bash
/spec:create-command review-pr Check PR code changes against project guidelines
```

---

## 2. 执行流程

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                 create-command 执行流程                      │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ 1. 解析输入     │
  │ name + desc     │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 2. 分析需求     │
  │ 确定命令类型   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 3. 生成命令内容 │
  │ 简单/复杂格式   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 4. 创建文件     │
  │ 双平台同步      │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ 5. 确认创建     │
  │ 输出结果        │
  └─────────────────┘
```

### 2.2 步骤详解

#### Step 1: 解析输入

提取：
- **命令名称**: 使用 kebab-case（如 `review-pr`）
- **描述**: 命令应完成什么

#### Step 2: 分析需求

根据描述确定命令类型：

| 类型 | 描述 | 示例 |
|------|------|------|
| **Initialization** | 读取文档，建立上下文 | `start` |
| **Pre-development** | 读取指南，检查依赖 | `before-dev` |
| **Code check** | 验证代码质量和规范合规 | `check` |
| **Recording** | 记录进度、问题、结构变化 | `record-session` |
| **Generation** | 生成文档、代码模板 | `generate-api-doc` |

#### Step 3: 生成命令内容

**简单命令** (1-3 行):
```markdown
Concise instruction describing what to do
```

**复杂命令** (带步骤):
```markdown
# Command Title

Command description

## Steps

### 1. First Step
Specific action

### 2. Second Step
Specific action

## Output Format (if needed)

Template
```

#### Step 4: 创建文件

**双平台同步**:
- `.cursor/commands/spec-<command-name>.md`
- `.claude/commands/spec/<command-name>.md`

#### Step 5: 确认创建

```
[OK] Created Slash Command: /<command-name>

File paths:
- .cursor/commands/spec-<command-name>.md
- .claude/commands/spec/<command-name>.md

Usage:
/spec:<command-name>

Description:
<description>
```

---

## 3. 命令内容指南

### 3.1 好的命令特征

| 特征 | 描述 |
|------|------|
| **清晰简洁** | 立即可理解 |
| **可执行** | AI 可直接遵循步骤 |
| **范围明确** | 清晰的边界 |
| **有输出** | 指定预期输出格式（如需要） |

### 3.2 避免的模式

| 错误 | 示例 |
|------|------|
| **太模糊** | "optimize code" |
| **太复杂** | 单个命令超过 100 行 |
| **重复功能** | 不检查是否已存在类似命令 |

---

## 4. 命名约定

| 命令类型 | 前缀 | 示例 |
|----------|------|------|
| Session Start | `start` | `start` |
| Pre-development | `before-` | `before-dev` |
| Check | `check-` | `check` |
| Record | `record-` | `record-session` |
| Generate | `generate-` | `generate-api-doc` |
| Update | `update-` | `update-changelog` |
| Other | 动词优先 | `review-code`, `sync-data` |

---

## 5. 完整示例

### 输入
```bash
/spec:create-command review-pr Check PR code changes against project guidelines
```

### 生成的命令内容
```markdown
# PR Code Review

Check current PR code changes against project guidelines.

## Steps

### 1. Get Changed Files
```bash
git diff main...HEAD --name-only
```

### 2. Categorized Review

**Frontend files** (`apps/web/`):
- Reference `.spec-first/spec/frontend/index.md`

**Backend files** (`packages/api/`):
- Reference `.spec-first/spec/backend/index.md`

### 3. Output Review Report

Format:

## PR Review Report

### Changed Files
- [file list]

### Check Results
- [OK] Passed items
- [X] Issues found

### Suggestions
- [improvement suggestions]
```

---

## 6. 设计分析

### 6.1 双平台策略

```
┌─────────────────────────────────────────────────────────────┐
│                    双平台同步                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   .cursor/commands/spec-<name>.md                           │
│          ↕ 同步                                             │
│   .claude/commands/spec/<name>.md                           │
│                                                             │
│   目的: 支持 Cursor 和 Claude Code 两个 AI 工具             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 命令复杂度分层

| 复杂度 | 行数 | 适用场景 |
|--------|------|---------|
| **简单** | 1-3 | 单一动作 |
| **中等** | 10-50 | 多步骤流程 |
| **复杂** | 50-100 | 完整工作流 |

**限制**: 单个命令不超过 100 行

---

## 7. 最佳实践

### 7.1 创建前检查

- [ ] 检查是否已存在类似命令
- [ ] 确定命令类型和命名
- [ ] 规划命令结构

### 7.2 创建后验证

- [ ] 文件已创建在两个目录
- [ ] 命令格式正确
- [ ] 描述准确

---

## 8. 总结

**create-command** 是命令扩展工具：

```
需求描述 → create-command → 双平台命令文件
                │
                ├── 解析需求
                ├── 确定类型
                ├── 生成内容
                └── 同步创建
```

**核心价值**:
- 快速创建新命令
- 双平台自动同步
- 规范化命令格式
- 遵循命名约定
