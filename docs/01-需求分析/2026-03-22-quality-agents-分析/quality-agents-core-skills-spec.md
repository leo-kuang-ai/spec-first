# Quality Agents 核心 Skills 详细定义稿

文档状态：Draft v1
文档日期：2026-03-22
适用范围：V0.1 核心 skills

## 1. 文档目标

本稿定义 V0.1 四个核心 skills 的职责、输入输出协议、执行步骤、失败条件和验收标准。

目标不是直接写最终 `SKILL.md`，而是先明确每个 skill 的产品语义与工程边界，为后续模板编写和验证提供依据。

本稿覆盖：

- `/clarify`
- `/challenge`
- `/scope-lock`
- `/design-review`

## 2. 通用设计原则

所有 skills 必须遵守以下原则：

### 2.1 单一质量动作

每个 skill 只负责一个高价值质量动作，不兼做多个阶段职责。

### 2.2 输出对象化

每个 skill 输出必须可映射到统一质量对象，而不是只输出自由文本。

### 2.3 可单独使用

skill 必须在缺少完整前置链路时仍然有价值。

### 2.4 低耦合

skill 共享质量对象，不依赖其他 skill 的私有输出格式。

### 2.5 可验证

skill 的有效性必须能通过案例回放或结构化比较验证。

## 3. `/clarify`

### 3.1 目标

把模糊需求压缩成清晰的问题定义。

### 3.2 主要解决的问题

- 用户只给出表层诉求，没有清晰问题定义
- 用户没有明确 success criteria
- 用户没有明确 non-goals
- 后续设计和实现缺乏统一目标

### 3.3 输入

最低输入：

- 用户需求描述

可选输入：

- 已有背景文档
- 现有项目上下文
- 历史 quality memory

### 3.4 输出

结构化输出至少包括：

- Problem
- 初始 success criteria
- 初始 non-goals

### 3.5 执行动作

建议执行流程：

1. 读取用户原始需求。
2. 识别需求中的目标、对象、场景、限制条件。
3. 判断描述是否停留在功能表层。
4. 提炼真正问题陈述。
5. 明确成功标准。
6. 明确非目标。
7. 输出结构化 Problem。

### 3.6 输出模板建议

```text
Problem
- Statement:
- User Context:
- Success Criteria:
- Non-goals:
- Open Questions:
```

### 3.7 完成条件

- 至少形成一个清晰 Problem statement
- 至少形成 2-3 条 success criteria
- 至少形成 2-3 条 non-goals 或边界说明

### 3.8 失败条件

- 用户输入过于模糊，无法识别基本场景
- 缺少关键业务背景，无法形成问题定义

### 3.9 验收标准

- 对同一输入，输出的问题定义明显比原始需求更清晰
- 后续 skill 可以直接消费其输出

## 4. `/challenge`

### 4.1 目标

挑战当前需求 framing，识别是否做偏。

### 4.2 主要解决的问题

- 用户把解决方案当成问题本身
- 用户提出的是表层功能而非真实任务
- 需求 framing 过窄、过浅或方向错误

### 4.3 输入

最低输入：

- 用户需求描述或已有 Problem

可选输入：

- 历史 quality memory
- 相关决策或背景文档

### 4.4 输出

结构化输出至少包括：

- 修正后的 Problem 或更深层 Problem
- Assumptions
- Risks
- Findings

### 4.5 执行动作

建议执行流程：

1. 识别当前 framing。
2. 判断其是否过于功能化、表层化或局部化。
3. 提出更深层的问题定义。
4. 明确当前 framing 隐含的假设。
5. 识别如果继续按当前 framing 做下去可能导致的偏差。
6. 输出 findings、assumptions 和 risks。

### 4.6 输出模板建议

```text
Current Framing
- ...

Why It May Be Wrong
- ...

Better Problem Framing
- ...

Assumptions
- ...

Risks
- ...
```

### 4.7 完成条件

- 至少指出一个潜在 framing 问题
- 至少给出一个更深层的问题定义
- 至少形成 2 条 assumptions 和 2 条 risks

### 4.8 失败条件

- 输入本身已足够准确，挑战价值低
- 缺少必要上下文，无法判断是否偏离真实问题

### 4.9 验收标准

- skill 输出能帮助用户意识到“真正要解决的问题并非原先表述”
- 风险和假设具有明确行动意义，而不是泛泛而谈

## 5. `/scope-lock`

### 5.1 目标

锁定本次范围，防止 scope 漂移。

### 5.2 主要解决的问题

- 需求边界模糊
- 实现过程中越做越大
- 讨论中没有清晰 in-scope / out-of-scope
- 后续 review 与 QA 无法判断“是否超出范围”

### 5.3 输入

最低输入：

- Problem

可选输入：

- 当前任务意图
- 已有设计草案
- 历史质量记忆

### 5.4 输出

结构化输出至少包括：

- Scope
- Decision

### 5.5 执行动作

建议执行流程：

1. 读取 Problem。
2. 明确此次任务的目标边界。
3. 拆出 in-scope。
4. 拆出 out-of-scope。
5. 明确 acceptance boundary。
6. 明确 deferred items。
7. 输出 Scope 和必要 Decision。

### 5.6 输出模板建议

```text
Scope
- In scope:
- Out of scope:
- Acceptance boundary:
- Deferred:

Decision
- Why this boundary:
```

### 5.7 完成条件

- in-scope 明确
- out-of-scope 明确
- acceptance boundary 明确

### 5.8 失败条件

- Problem 本身不清晰
- 用户目标仍在快速变化，无法锁边界

### 5.9 验收标准

- 后续实现与评审可以直接引用 scope
- 用户能清楚知道“不做什么”

## 6. `/design-review`

### 6.1 目标

检查方案是否完整、稳健、边界充分。

### 6.2 主要解决的问题

- 方案只覆盖主路径
- 缺少失败路径和边界条件
- 隐藏复杂度未暴露
- 风险未被显式识别

### 6.3 输入

最低输入：

- Problem
- Scope
- 设计草案

可选输入：

- Assumptions
- Risks
- 历史质量记忆

### 6.4 输出

结构化输出至少包括：

- Findings
- Risks
- Decisions
- 建议验证策略

### 6.5 执行动作

建议执行流程：

1. 读取 Problem 和 Scope。
2. 审核设计是否覆盖目标边界。
3. 审核失败路径。
4. 审核边界条件。
5. 审核是否存在高复杂度但缺少控制的部分。
6. 识别高风险点。
7. 输出 Findings、Risks、必要 Decisions。
8. 给出建议验证策略。

### 6.6 输出模板建议

```text
Design Review Findings
- Finding:
- Severity:
- Why it matters:

Risks
- ...

Suggested Validation
- ...
```

### 6.7 完成条件

- 至少识别关键失败路径
- 至少识别关键边界条件
- 至少输出一组可执行验证建议

### 6.8 失败条件

- 设计输入过于稀薄，无法评审
- Problem 或 Scope 缺失，导致评审失焦

### 6.9 验收标准

- 输出 findings 具有明确行动意义
- 输出 risks 与 scope/problem 有明显对应关系
- 建议验证策略可被后续 review/qa 使用

## 7. 4 个 skills 的依赖关系

推荐顺序：

```text
/clarify
  -> /challenge
  -> /scope-lock
  -> /design-review
```

但它们不应被设计成强耦合链路：

- `/challenge` 可以直接基于原始需求运行
- `/scope-lock` 可以基于人工整理的问题定义运行
- `/design-review` 可以在没有完整前链路时独立运行

## 8. 统一输出对象映射

| Skill | 核心输出对象 |
|------|--------------|
| `/clarify` | Problem |
| `/challenge` | Problem / Assumption / Risk / Finding |
| `/scope-lock` | Scope / Decision |
| `/design-review` | Finding / Risk / Decision / Evidence |

## 9. Gate 对应关系

| Skill | 主要支撑 Gate |
|------|---------------|
| `/clarify` | Intent Gate |
| `/challenge` | Intent Gate / Scope Gate |
| `/scope-lock` | Scope Gate |
| `/design-review` | Design Gate |

## 10. 实现优先级建议

### P0

- `/clarify`
- `/challenge`

### P1

- `/scope-lock`
- `/design-review`

原因：

- 没有清晰 Problem，scope 和 design 的质量控制都会失焦
- challenge 是区分“表层需求”和“真实问题”的关键能力

## 11. 后续可扩展方向

当 V0.1 稳定后，可以继续扩展：

- `/review`
- `/qa`
- `/ship-check`
- 风险模式库
- 真实案例回放库
- 团队质量报告

## 12. 结论

V0.1 的四个核心 skills 并不是一个完整流程，而是四个高价值前置质量动作：

- 把问题说清楚
- 挑战错误 framing
- 锁定范围边界
- 审查方案质量

只要这四件事做对，后续实现、review、qa 的质量上限就会显著提高。
