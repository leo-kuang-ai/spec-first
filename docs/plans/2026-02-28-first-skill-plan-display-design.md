# First Skill 任务计划展示设计

> **日期**: 2026-02-28 | **方案**: 简化版计划展示 | **状态**: 已确认

---

## 概述

在 `spec-first:first` skill 中增加任务计划展示功能，在执行前让用户了解即将生成的文档和执行策略。

## 核心原则

**展示计划 → 执行 → 汇总结果**，无需复杂的状态追踪。

## 设计方案

### 展示时机

在 **P1 技术栈识别开始时**展示计划，让用户最早了解即将发生什么。

### 展示格式

```
📋 First Skill 执行计划

项目: spec-first
语言: JavaScript/Node.js, TypeScript

📦 将生成 8 个文档:
  1. tech-stack.md            技术栈摘要
  2. external-deps.md         外部依赖
  3. codebase-overview.md     代码库概览
  4. architecture.md          架构图
  5. api-docs.md              API 文档
  6. development-guidelines.md 研发规范
  7. local-setup.md           本地环境
  8. README.md                索引导航

⚙️ 并发策略: 4 个子 agent 并发分析
⏱️ 预估时间: ~30 秒

开始生成...
```

### P5 汇总（保持不变）

```
✅ 生成完成！8/8 文档已生成到 docs/first/

📊 生成结果:
  ✅ README.md (新建)
  ✅ tech-stack.md (已存在，未变化)
  ✅ external-deps.md (已存在，未变化)
  ✅ codebase-overview.md (已存在，未变化)
  ✅ architecture.md (已存在，未变化)
  ✅ api-docs.md (已存在，未变化)
  ✅ development-guidelines.md (新建)
  ✅ local-setup.md (已存在，未变化)
```

## SKILL.md 更新位置

在 `### P1: 技术栈识别 + 外部依赖扫描` 章节**开头**插入：

```markdown
**输出执行计划**：

在 P1 开始时，先输出执行计划：

\`\`\`
📋 First Skill 执行计划

项目: [项目名称]
语言: [检测到的主要语言]

📦 将生成 [N] 个文档:
  1. [文档名称]    [简要说明]
  ...

⚙️ 并发策略: 4 个子 agent 并发分析
⏱️ 预估时间: ~30 秒

开始生成...
\`\`\`

然后继续执行技术栈识别。
```

## 文件更新清单

| 文件 | 变更说明 |
|------|----------|
| `skills/spec-first/00-first/SKILL.md` | P1 章节开头增加执行计划输出逻辑 |
| `CHANGELOG.md` | 增加 v0.5.73 条目 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.2.0 | 2026-02-28 | 新增任务计划展示功能 |
| 1.1.0 | 2026-02-28 | 新增 development-guidelines.md 和 README.md |
| 1.0.0 | 2026-02-28 | 初始版本，7 个产物 |
