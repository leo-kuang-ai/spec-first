# 00-First Reference Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `skills/spec-first/00-first` 的核心 reference 收敛为单一、可执行、可验证的主链契约，消除并发、波次、输出 schema 与证据包规则中的歧义。

**Architecture:** 先修复会影响执行正确性的硬约束：并发真源、wave 前置依赖、agent 输出 schema、evidence pack 最小标准。随后收敛 `SKILL.md` 的读取规则与执行流表述，最后清理 detection / QA / testing 中的边缘一致性问题。所有改动仅限 `skills/spec-first/00-first`，并在每一阶段后做只读一致性复核。

**Tech Stack:** Markdown reference docs, Spec-First skills, shell-based consistency checks

---

### Task 1: 固化主链执行正确性

**Files:**
- Modify: `skills/spec-first/00-first/references/main-thread-contract.md`
- Modify: `skills/spec-first/00-first/references/subagent-architecture.md`
- Modify: `skills/spec-first/00-first/references/agent-output-schema.md`
- Modify: `skills/spec-first/00-first/references/evidence-pack-spec.md`
- Modify: `skills/spec-first/00-first/references/execution-flow.md`

**Step 1: 写最小一致性检查项**

- 确认并发上限只有一个权威表达
- 确认 wave 依赖和失败策略可直接执行
- 确认 `artifacts`、`evidence_paths`、`gaps`、`next_action` 的含义足够明确
- 确认 evidence pack 具备最小证据集与充分性判断

**Step 2: 执行文档修订**

- 统一并发真源
- 补充 wave 前置依赖与部分失败策略
- 定义 `artifacts` 的结构与落盘判断方式
- 补充 evidence pack 最小标准和主线程交接边界

**Step 3: 复核**

- 重新阅读五份 reference，确认不存在多重真源或模糊表述

---

### Task 2: 收敛 `SKILL.md` 的主线程入口与读取规则

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`
- Modify: `skills/spec-first/00-first/references/execution-flow.md`

**Step 1: 写一致性检查项**

- `SKILL.md` 只保留 canonical contract 的索引，不重复执行细节
- 读取规则表能清晰区分必须加载和按需加载
- `execution-flow.md` 能和 `SKILL.md` 互相对齐

**Step 2: 执行文档修订**

- 收紧 `SKILL.md` 的主线程职责描述
- 简化重复的执行流语句
- 保持引用关系单向清晰

**Step 3: 复核**

- 检查引用文档名和职责分类是否一致

---

### Task 3: 清理边缘一致性问题

**Files:**
- Modify: `skills/spec-first/00-first/references/detection-rules.md`
- Modify: `skills/spec-first/00-first/references/quality-assurance-rules.md`
- Modify: `skills/spec-first/00-first/references/agents-code-analysis.md`
- Modify: `skills/spec-first/00-first/references/structure-analysis.md`
- Modify: `skills/spec-first/00-first/references/testing-strategy.md`

**Step 1: 写一致性检查项**

- detection 规则对多子类型、失败降级和标准模式边界表述清楚
- QA 规则与 `SKILL.md` 的重复最小化，但保留证据标注和抽样矩阵
- code analysis 执行提示与主题规范不再互相抢权威
- 测试 ID 和测试文件命名的映射更容易追踪

**Step 2: 执行文档修订**

- 补充 detection 的冲突处理与降级规则
- 收敛 QA 重复内容
- 压薄执行提示，保留输入证据和缺口标记
- 增加测试文件与用例的对应关系

**Step 3: 复核**

- 重新检查 00-first 的 reference 分类是否更清晰

---

### Task 4: 做最终一致性验证

**Files:**
- Modify: `skills/spec-first/00-first/references/*.md` as needed

**Step 1: 逐文件复查**

- 重点确认：并发、wave、schema、evidence pack、读取规则、重复定义

**Step 2: 输出修订结论**

- 总结已修复项
- 标记仍可接受的重复或保留项

**Step 3: 提交前检查**

- 确认仅改动 `skills/spec-first/00-first`
- 确认未波及 `01-init`

