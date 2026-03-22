# Quality Agents Gate Evaluator 规格

文档状态：Draft v1
文档日期：2026-03-22
适用范围：Quality Agents V0.1

## 1. 文档目标

本稿定义 Gate Evaluator 的职责、输入、判断逻辑、输出格式和 V0.1 实现边界。

Gate Evaluator 的作用不是做复杂流程编排，而是回答一个更直接的问题：

当前质量状态是否允许继续。

## 2. 设计目标

- 用少量 gate 提前暴露重大偏差
- 不构建复杂状态机
- 支持 skill 输出对象驱动 gate 判断
- 输出结果足够清晰，能直接指导下一步动作

## 3. 非目标

V0.1 Gate Evaluator 不做：

- 多角色审批引擎
- 跨团队权限流转
- 复杂状态迁移图
- 持续化 orchestration

## 4. Gate Evaluator 定位

Gate Evaluator 位于 Quality Core 中，输入统一质量对象，输出标准化 gate verdict。

```text
Problem / Scope / Risk / Decision / Finding / Evidence
           |
           v
     Gate Evaluator
           |
           v
Gate Verdict: CLEAR / CLEAR_WITH_CONCERNS / BLOCKED
```

## 5. Gate 类型

V0.1 只定义 3 个核心 gates：

- Intent Gate
- Scope Gate
- Design Gate

Evidence Gate 可以在 V0.2 再加强，但 V0.1 允许先作为辅助判断维度存在。

## 6. 输出等级

统一输出以下三档：

### 6.1 CLEAR

含义：

- 当前质量状态允许继续推进

### 6.2 CLEAR_WITH_CONCERNS

含义：

- 可以继续推进，但有需要显式注意的问题

### 6.3 BLOCKED

含义：

- 当前状态不应继续推进
- 应先补足缺失信息或修复关键问题

## 7. 通用输出结构

建议格式：

```yaml
gate: scope_gate
status: CLEAR_WITH_CONCERNS
summary: Scope 基本明确，但仍有一个 out-of-scope 项目表达模糊。
blocking_reasons: []
concerns:
  - Out-of-scope definition for CRM-like contact enrichment is still vague
recommended_actions:
  - refine out-of-scope wording
related_ids:
  - problem-20260322-001
  - scope-20260322-001
timestamp: 2026-03-22T11:30:00Z
```

## 8. Intent Gate

### 8.1 目标

判断“当前是否已经把真正问题说清楚”。

### 8.2 输入对象

- Problem
- Assumption
- Evidence

### 8.3 通过条件

至少满足：

- Problem 存在
- statement 明确
- success criteria 存在
- non-goals 存在或边界明确

### 8.4 CLEAR 条件

满足以下全部：

- Problem statement 清晰
- user context 清晰
- success criteria 至少 2 条
- non-goals 至少 2 条
- 没有高严重性 framing risk 未处理

### 8.5 CLEAR_WITH_CONCERNS 条件

满足以下条件之一：

- Problem 基本清晰，但 success criteria 不够具体
- non-goals 不够明确
- 存在中等级别 framing 风险

### 8.6 BLOCKED 条件

满足以下任一：

- 没有 Problem
- statement 仍是功能表层描述
- 完全没有 success criteria
- 完全没有 non-goals
- 存在高严重性 framing 风险且未处理

## 9. Scope Gate

### 9.1 目标

判断“本次范围是否明确且可控”。

### 9.2 输入对象

- Problem
- Scope
- Decision
- Risk

### 9.3 通过条件

至少满足：

- Scope 存在
- in-scope 明确
- out-of-scope 明确
- acceptance boundary 存在

### 9.4 CLEAR 条件

满足以下全部：

- in-scope 列表清晰
- out-of-scope 列表清晰
- acceptance boundary 明确
- 没有高严重性 scope drift risk

### 9.5 CLEAR_WITH_CONCERNS 条件

满足以下条件之一：

- out-of-scope 存在轻微模糊
- acceptance boundary 不够可验证
- deferred items 列得不清晰
- 存在中等级别 scope 风险

### 9.6 BLOCKED 条件

满足以下任一：

- 没有 Scope
- 没有 out-of-scope
- 没有 acceptance boundary
- 存在高严重性 scope drift risk 且无 mitigation

## 10. Design Gate

### 10.1 目标

判断“当前方案是否足够完整，可以进入实现或继续推进”。

### 10.2 输入对象

- Problem
- Scope
- Finding
- Risk
- Decision

### 10.3 通过条件

至少满足：

- 存在设计输入
- 关键失败路径被识别
- 关键边界条件被识别
- 高严重性 design finding 数量可接受

### 10.4 CLEAR 条件

满足以下全部：

- 有清晰设计主路径
- 已明确关键失败路径
- 已明确关键边界条件
- 没有高严重性未解决 finding

### 10.5 CLEAR_WITH_CONCERNS 条件

满足以下条件之一：

- 已有主路径，但部分失败路径仍薄弱
- 边界条件覆盖不够完整
- 存在中等级别设计风险

### 10.6 BLOCKED 条件

满足以下任一：

- 没有设计输入
- 没有失败路径分析
- 没有边界条件分析
- 存在高严重性未解决设计 finding

## 11. Evidence 维度

虽然 V0.1 不单独强做 Evidence Gate，但所有 gate 都应读取 evidence 强度。

建议 evidence 影响方式：

- 若对象关键字段存在高置信 evidence，提升 gate 判断可信度
- 若结论完全无 evidence，可将 CLEAR 降为 CLEAR_WITH_CONCERNS

## 12. Gate 输入解析

Gate Evaluator 不直接读取原始文档，而是消费 Context Resolver 整理后的对象集合。

示意：

```text
files / memory / skill outputs
        |
        v
  Context Resolver
        |
        v
structured objects
        |
        v
  Gate Evaluator
```

这保证：

- gate 层不与具体文件路径耦合
- skill 输出格式变化不会直接拖垮 gate 层

## 13. Gate 执行时机

V0.1 推荐以下触发点：

- `/clarify` 后触发 Intent Gate
- `/challenge` 后再次触发 Intent Gate
- `/scope-lock` 后触发 Scope Gate
- `/design-review` 后触发 Design Gate

## 14. Gate 与 Skill 的关系

关系不是一一绑定，但有默认对应：

| Skill | 默认触发 Gate |
|------|---------------|
| `/clarify` | Intent Gate |
| `/challenge` | Intent Gate |
| `/scope-lock` | Scope Gate |
| `/design-review` | Design Gate |

## 15. 实现建议

V0.1 推荐实现方式：

- 规则驱动
- 轻量逻辑判断
- 基于对象字段缺失和风险严重度

不建议 V0.1 就做：

- 复杂评分模型
- 大量模糊加权
- 多轮自动流转

## 16. 示例输出

### 16.1 Intent Gate CLEAR

```text
Gate: Intent Gate
Status: CLEAR
Summary: Problem、Success Criteria 和 Non-goals 已明确，当前可以进入范围定义。
```

### 16.2 Scope Gate BLOCKED

```text
Gate: Scope Gate
Status: BLOCKED
Blocking Reasons:
- out-of-scope missing
- acceptance boundary missing
Recommended Actions:
- define explicit out-of-scope list
- define what counts as done for this scope
```

### 16.3 Design Gate CLEAR_WITH_CONCERNS

```text
Gate: Design Gate
Status: CLEAR_WITH_CONCERNS
Concerns:
- failure path for stale data is still shallow
- retry behavior remains undefined
Recommended Actions:
- refine failure path design before implementation
```

## 17. 验证建议

Gate Evaluator 至少需要验证：

- 对字段缺失是否能稳定 BLOCK
- 对中度问题是否能稳定给出 CLEAR_WITH_CONCERNS
- 对高质量输入是否能稳定 CLEAR

建议准备至少 3 套对象 fixture：

- 高质量输入
- 中质量输入
- 缺陷明显输入

## 18. 风险

### 18.1 规则太松

风险：

- gate 失去拦截意义

应对：

- 优先让 gate 保守一点

### 18.2 规则太死

风险：

- 用户被格式束缚

应对：

- 允许 CLEAR_WITH_CONCERNS 成为主要缓冲区

### 18.3 与 skill 耦合过深

风险：

- skill 一改，gate 全坏

应对：

- gate 只读统一对象，不读 skill 文本

## 19. 结论

Gate Evaluator 的价值不在于取代人做复杂判断，而在于：

- 让明显问题尽早暴露
- 让继续推进有最基本质量门槛
- 让平台从一开始就具备“可阻断跑偏”的能力

V0.1 只要把 Intent、Scope、Design 三个 gates 做稳，就已经足够证明方向成立。
