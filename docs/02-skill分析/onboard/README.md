# Onboard 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/onboard.md`

---

## 1. Skill 概述

### 1.1 核心定位

**onboard** 是新成员入门命令，作为资深开发者引导新团队成员了解项目的 AI 辅助工作流系统。

| 维度 | 描述 |
|------|------|
| **角色** | 导师和教师 |
| **目标** | 解释原则、命令、工作流和定制指南 |
| **特点** | 三个同等重要的部分 |

### 1.2 核心角色定义

```
┌─────────────────────────────────────────────────────────────┐
│                    角色定义                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   YOUR ROLE: Be a mentor and teacher.                      │
│                                                             │
│   Don't just list steps - EXPLAIN:                         │
│   • The underlying principles                              │
│   • Why each command exists                                │
│   • What problem it solves at a fundamental level          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 三个关键部分

```
┌─────────────────────────────────────────────────────────────┐
│                   三个同等重要的部分                         │
└─────────────────────────────────────────────────────────────┘

  Part 1: Core Concepts
  ├── Core Philosophy（为什么这个工作流存在）
  ├── System Structure（系统结构）
  └── Command Deep Dive（命令深入解析）

  Part 2: Real-World Examples
  └── 5 个详细工作流示例

  Part 3: Customize Guidelines
  └── 检查并填写开发指南

  [!] 不要跳过任何部分 - 三部分都是必需的
```

---

## 3. Part 1: 核心哲学

### 3.1 AI 辅助开发的三个根本挑战

#### Challenge 1: AI Has No Memory

**问题**: 每次 AI 会话从空白开始。不像人类工程师积累项目知识，AI 在会话结束时忘记一切。

**解决方案**: `.spec-first/workspace/` 系统捕获每个会话中发生的事情。`/spec:start` 命令在会话开始时读取此历史，给 AI "人工记忆"。

#### Challenge 2: AI Has Generic Knowledge, Not Project-Specific Knowledge

**问题**: AI 模型在数百万代码库上训练 - 它们知道 React、TypeScript、数据库的通用模式。但它们不知道 YOUR 项目的约定。

**解决方案**: `.spec-first/spec/` 目录包含项目特定指南。`/before-*-dev` 命令在编码开始前将此专业知识注入 AI 上下文。

#### Challenge 3: AI Context Window Is Limited

**问题**: 即使注入指南后，AI 上下文窗口也有限。随着对话增长，早期上下文（包括指南）被推出或变得不那么有影响力。

**解决方案**: `/check-*` 命令在编写后根据指南重新验证代码，捕获开发过程中发生的漂移。`/spec:finish-work` 命令进行最终的整体审查。

---

## 4. 系统结构

```
.spec-first/
|-- .developer              # 你的身份（gitignored）
|-- workflow.md             # 完整工作流文档
|-- workspace/              # "AI Memory" - 会话历史
|   |-- index.md            # 所有开发者的进度
|   +-- {developer}/        # 每个开发者的目录
|       |-- index.md        # 个人进度索引
|       +-- journal-N.md    # 会话记录（最多 2000 行）
|-- tasks/                  # 任务跟踪（统一）
|   +-- {MM}-{DD}-{slug}/   # 任务目录
|       |-- task.json       # 任务元数据
|       +-- prd.md          # 需求文档
|-- spec/                   # "AI Training Data" - 项目知识
|   |-- frontend/           # Frontend 约定
|   |-- backend/            # Backend 约定
|   +-- guides/             # 思考模式
+-- scripts/                # 自动化工具
```

### 4.1 spec/ 子目录理解

| 目录 | 内容类型 |
|------|---------|
| **frontend/** | 单层前端知识：组件模式、状态管理规则、样式约定、Hook 模式 |
| **backend/** | 单层后端知识：API 设计模式、数据库约定、错误处理标准、日志规则 |
| **guides/** | 跨层思考指南：代码复用、跨层思考、实现前检查清单 |

---

## 5. 命令深入解析

### 5.1 /spec:start - 恢复 AI 记忆

**为什么存在**: 人类工程师加入项目时，花费数天/数周学习：这是什么项目？已构建什么？正在进行什么？AI 需要同样的入门 - 但压缩到会话开始的几秒钟。

**实际做什么**:
1. 读取开发者身份（我在这个项目中是谁？）
2. 检查 git 状态（什么分支？未提交的变更？）
3. 从 `workspace/` 读取最近会话历史（之前发生了什么？）
4. 识别活跃功能（正在进行什么？）
5. 在做任何更改前理解当前项目状态

### 5.2 /spec:before-dev - 注入专业知识

**为什么存在**: AI 模型有"预训练知识" - 来自数百万代码库的通用模式。但 YOUR 项目有不同于通用模式的具体约定。

**实际做什么**:
1. 通过 `get_context.py --mode packages` 发现 spec 层并读取相关指南
2. 将项目特定模式加载到 AI 工作上下文

### 5.3 /spec:check - 对抗上下文漂移

**为什么存在**: AI 上下文窗口容量有限。随着对话进行，会话开始时注入的指南变得不那么有影响力。这导致"上下文漂移"。

**实际做什么**:
1. 重新读取之前注入的指南
2. 将编写的代码与这些指南比较
3. 运行类型检查器和 linter
4. 识别违规并建议修复

### 5.4 /spec:check-cross-layer - 多维验证

**为什么存在**: 大多数 Bug 不是来自缺乏技术技能 - 它们来自"没想到"：
- 在一处更改常量，漏了其他 5 处
- 修改数据库 schema，忘记更新 API 层
- 创建工具函数，但类似的已存在

**实际做什么**:
1. 识别变更涉及的维度
2. 对每个维度运行针对性检查

### 5.5 /spec:finish-work - 整体预提交审查

**为什么存在**: `/check-*` 命令专注于单层内的代码质量。但真正的变更通常有跨切面关注点。

**实际做什么**:
1. 整体审查所有变更
2. 检查跨层一致性
3. 识别更广泛的影响
4. 检查新模式是否应该被记录

### 5.6 /spec:record-session - 为未来持久化记忆

**为什么存在**: AI 在此会话中构建的所有上下文将在会话结束时丢失。下一个会话的 `/spec:start` 需要此信息。

**实际做什么**:
1. 将会话摘要记录到 `workspace/{developer}/journal-N.md`
2. 捕获做了什么、学到了什么、还剩什么
3. 更新索引文件以便快速查找

---

## 6. Part 2: 真实世界工作流示例

### 6.1 Example 1: Bug Fix Session

```
[1/8] /spec:start              - AI 需要项目上下文
[2/8] task.py create "Fix bug" - 跟踪工作
[3/8] /spec:before-dev         - 注入开发指南
[4/8] 调查并修复 bug           - 实际开发工作
[5/8] /spec:check              - 重新验证代码
[6/8] /spec:finish-work        - 整体跨层审查
[7/8] Human tests and commits  - 人工验证
[8/8] /spec:record-session     - 为未来会话持久化记忆
```

### 6.2 Example 2: Planning Session (No Code)

```
[1/4] /spec:start                    - 非编码工作也需要上下文
[2/4] task.py create "Planning task" - 规划是有价值的工作
[3/4] 审查文档，创建子任务列表       - 实际规划工作
[4/4] /spec:record-session           - 规划决策必须被记录
```

### 6.3 Example 3: Code Review Fixes

```
[1/6] /spec:start          - 从上一会话恢复上下文
[2/6] /spec:before-dev     - 修复前重新注入指南
[3/6] 修复每个 CR 问题     - 在上下文中处理反馈
[4/6] /spec:check          - 验证修复没有引入新问题
[5/6] /spec:finish-work    - 记录 CR 的教训
[6/6] Human commits, /spec:record-session - 保留 CR 教训
```

### 6.4 Example 4: Large Refactoring

```
[1/5] /spec:start                    - 重大变更前清晰基线
[2/5] Plan phases                    - 分解为可验证的块
[3/5] Execute phase by phase with /spec:check after each - 增量验证
[4/5] /spec:finish-work              - 检查新模式是否应被记录
[5/5] Record with multiple commits   - 将所有提交链接到一个功能
```

### 6.5 Example 5: Debug Session

```
[1/6] /spec:start          - 查看此 bug 是否之前被调查过
[2/6] /spec:before-dev     - 指南可能记录已知陷阱
[3/6] 调查                 - 实际调试工作
[4/6] /spec:check          - 验证调试变更不会破坏其他东西
[5/6] /spec:finish-work    - 调试发现可能需要记录
[6/6] Human commits, /spec:record-session - 调试知识有价值
```

---

## 7. 关键规则

| 规则 | 描述 |
|------|------|
| **AI NEVER commits** | 人工测试和批准。AI 准备，人工验证。 |
| **Guidelines before code** | /before-dev 命令注入项目知识。 |
| **Check after code** | /check-* 命令捕获上下文漂移。 |
| **Record everything** | /spec:record-session 持久化记忆。 |

---

## 8. Part 3: 定制开发指南

### 8.1 Step 1: 检查当前指南状态

```bash
# 检查文件是否仍是空模板（查找占位符文本）
grep -l "To be filled by the team" .spec-first/spec/backend/*.md 2>/dev/null | wc -l
grep -l "To be filled by the team" .spec-first/spec/frontend/*.md 2>/dev/null | wc -l
```

### 8.2 Step 2: 确定情况

**Situation A: 首次设置（空模板）**

如果指南是空模板（包含 "To be filled by the team"），这是首次使用 spec-first。

解释给开发者：
- 模板包含需要用 YOUR 项目实际约定替换的占位符文本
- 没有这个，`/before-*-dev` 命令不会提供有用的指导
- 第一个任务应该是填写这些指南

**Situation B: 指南已定制**

如果指南有真实内容（无 "To be filled" 占位符），这是现有设置。

解释给开发者：
- 可以立即开始使用 `/before-*-dev` 命令
- 建议阅读 `.spec-first/spec/` 熟悉团队的编码标准

### 8.3 Step 3: 帮助填写指南（如为空）

如果开发者想要帮助填写指南：

1. **分析代码库** - 查看现有代码模式
2. **记录约定** - 写你观察到的，而非理想
3. **包含示例** - 引用项目中的实际文件
4. **列出禁止模式** - 记录团队避免的反模式

---

## 9. 完成入门会话

覆盖所有三部分后，总结：

```
You're now onboarded to the spec-first workflow system!

我们覆盖了：
- Part 1: 核心概念（为什么这个工作流存在）
- Part 2: 真实世界示例（如何应用工作流）
- Part 3: 指南状态（空模板需要填写 / 已定制）

下一步：
1. 运行 /spec:record-session 记录此入门会话
2. [如果指南为空] 开始填写 .spec-first/spec/ 指南
3. [如果指南准备好] 开始第一个开发任务

您想先做什么？
```

---

## 10. 总结

**onboard** 是知识传递工具：

```
新成员 → onboard → 理解工作流
              │
              ├── Part 1: 核心概念
              │      ├── 为什么存在（3 个挑战）
              │      ├── 系统结构
              │      └── 命令深入解析
              │
              ├── Part 2: 真实示例
              │      └── 5 个详细工作流
              │
              └── Part 3: 定制指南
                     └── 检查并填写
```

**核心价值**:
- 导师式教学体验
- 原则解释，不只是步骤
- 真实世界示例
- 指南定制引导
