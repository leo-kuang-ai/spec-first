# 创建新斜杠命令

在 `.cursor/commands/`（带 `spec-` 前缀）和 `.claude/commands/spec/` 目录中基于用户需求创建新的斜杠命令。

## 用法

```
/spec:create-command <command-name> <description>
```

**示例**：
```
/spec:create-command review-pr Check PR code changes against project guidelines
```

## 执行步骤

### 1. 解析输入

从用户输入中提取：
- **命令名称**：使用 kebab-case（例如 `review-pr`）
- **描述**：命令应该完成什么

### 2. 分析需求

根据描述确定命令类型：
- **初始化**：读取文档、建立上下文
- **开发前**：读取规范、检查依赖
- **代码检查**：验证代码质量和规范合规性
- **记录**：记录进度、问题、结构变更
- **生成**：生成文档、代码模板

### 3. 生成命令内容

根据命令类型，生成适当的内容：

**简单命令**（1-3 行）：
```markdown
描述要做什么的简洁指令
```

**复杂命令**（带步骤）：
```markdown
# Command Title

命令描述

## Steps

### 1. First Step
具体操作

### 2. Second Step
具体操作

## Output Format (if needed)

模板
```

### 4. 创建文件

在两个目录中创建：
- `.cursor/commands/spec-<command-name>.md`
- `.claude/commands/spec/<command-name>.md`

### 5. 确认创建

输出结果：
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

## 命令内容指南

### [OK] 好的命令内容

1. **清晰简洁**：立即可以理解
2. **可执行**：AI 可以直接遵循步骤
3. **范围明确**：做什么和不做什么的清晰边界
4. **有输出**：指定期望的输出格式（如果需要）

### [X] 避免

1. **太模糊**：例如，"优化代码"
2. **太复杂**：单个命令不应超过 100 行
3. **重复功能**：先检查是否存在类似命令

## 命名约定

| Command Type | Prefix | Example |
|--------------|--------|---------|
| Session Start | `start` | `start` |
| Pre-development | `before-` | `before-dev` |
| Check | `check-` | `check` |
| Record | `record-` | `record-session` |
| Generate | `generate-` | `generate-api-doc` |
| Update | `update-` | `update-changelog` |
| Other | Verb-first | `review-code`, `sync-data` |

## 示例

### 输入
```
/spec:create-command review-pr Check PR code changes against project guidelines
```

### 生成的命令内容
```markdown
# PR Code Review

检查当前 PR 代码变更是否符合项目规范。

## Steps

### 1. Get Changed Files
```bash
git diff main...HEAD --name-only
```

### 2. 分类审查

**Frontend files** (`apps/web/`):
- 参考 `.spec-first/spec/frontend/index.md`

**Backend files** (`packages/api/`):
- 参考 `.spec-first/spec/backend/index.md`

### 3. 输出审查报告

格式：

## PR Review Report

### Changed Files
- [file list]

### Check Results
- [OK] Passed items
- [X] Issues found

### Suggestions
- [improvement suggestions]
```
