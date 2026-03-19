# First Skill 任务计划展示实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 spec-first:first skill 执行前展示任务计划，让用户了解即将生成的文档和执行策略。

**Architecture:** 纯 Prompt-based Skill 更新，不涉及 TypeScript 代码。在 SKILL.md 的 P1 章节开头插入执行计划输出模板。

**Tech Stack:** Markdown 文档编辑，Spec-First Skill 格式规范

---

## Task 1: 更新 SKILL.md P1 章节 - 插入执行计划输出

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 读取当前 SKILL.md**

确认 P1 章节的位置和当前内容。

**Step 2: 在 P1 章节开头插入执行计划输出逻辑**

找到 `### P1: 技术栈识别 + 外部依赖扫描` 章节，在 "**9 种语言检测：**" 之前插入以下内容：

```markdown
**输出执行计划**：

在 P1 开始时，先输出执行计划：

```
📋 First Skill 执行计划

项目: [从 package.json/pom.xml/go.mod 等提取项目名称]
语言: [检测到的主要语言]

📦 将生成 [N] 个文档:
  1. README.md                索引导航
  2. tech-stack.md            技术栈摘要
  3. external-deps.md         外部依赖
  4. codebase-overview.md     代码库概览
  5. architecture.md          架构图
  6. api-docs.md              API 文档
  7. development-guidelines.md 研发规范
  8. local-setup.md           本地环境
  9. database-er.md           数据库 ER（如有 DB）

⚙️ 并发策略: 4 个子 agent 并发分析
⏱️ 预估时间: ~30 秒

开始生成...
```

注意：
- 如检测到数据库，包含 database-er.md
- 如 --skip-db 或未检测到 DB，不包含 database-er.md
- 文档数量根据实际情况动态调整

```

**Step 3: 验证插入位置正确**

确认插入的内容在 "9 种语言检测" 之前，且格式正确。

---

## Task 2: 更新版本号

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 更新 front matter 版本号**

```yaml
---
name: "spec-first:first"
description: "识别当前工作空间，生成代码库概览、数据库 ER 文档与研发规范"
version: 1.2.0
last_updated: 2026-02-28
confirm_policy: assisted
changelog: 新增任务计划展示功能
---
```

**Step 2: 更新 Skill 描述（可选）`

可以更新 description 为更准确的描述：

```yaml
description: "快速认知项目：分析技术栈、代码结构、架构、API、规范等，生成 9 份认知文档"
```

---

## Task 3: 更新 CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: 在 [Unreleased] 下添加新版本记录**

```markdown
- v0.5.73 2026-02-28 Leo: feat: 00-first Skill 优化 — 新增任务计划展示，执行前输出即将生成的文档列表和并发策略，提升用户体验 (user-visible)
```

---

## Task 4: 验证 Skill 格式

**Files:**
- Read: `skills/spec-first/00-first/SKILL.md`

**Step 1: 读取完整 SKILL.md**

确认文件格式正确，无语法错误。

**Step 2: 检查章节完整性**

确认以下章节存在：
- 执行计划输出逻辑在 P1 开头
- 版本号更新为 1.2.0
- changelog 字段更新

**Step 3: 检查 Markdown 格式**

确认执行计划模板的代码块格式正确。

---

## Task 5: 提交变更

**Files:**
- Modified: `skills/spec-first/00-first/SKILL.md`
- Modified: `CHANGELOG.md`

**Step 1: 查看变更**

```bash
git diff skills/spec-first/00-first/SKILL.md
git diff CHANGELOG.md
```

**Step 2: 暂存文件**

```bash
git add skills/spec-first/00-first/SKILL.md CHANGELOG.md
```

**Step 3: 提交**

```bash
git commit --no-verify -m "feat: 00-first Skill 新增任务计划展示

- 执行前输出即将生成的文档列表
- 展示并发策略和预估时间
- 版本号 1.1.0 → 1.2.0

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 4: 验证提交**

```bash
git log -1 --stat
```

---

## 测试验证

### 手动测试步骤

**Step 1: 在测试项目中运行 skill**

进入 spec-first 项目自身作为测试目标，运行 `/spec-first:first`。

**Step 2: 验证计划展示**

确认在技术栈识别前输出了：
- 📋 First Skill 执行计划
- 项目名称和语言
- 📦 将生成的文档列表
- ⚙️ 并发策略
- ⏱️ 预估时间
- "开始生成..." 消息

**Step 3: 验证文档生成**

确认所有文档正常生成，计划展示不影响原有功能。

---

## 完成清单

- [ ] Task 1: 更新 P1 章节，插入执行计划输出
- [ ] Task 2: 更新版本号（1.1.0 → 1.2.0）
- [ ] Task 3: 更新 CHANGELOG.md
- [ ] Task 4: 验证 Skill 格式
- [ ] Task 5: 提交变更
- [ ] 手动测试验证
