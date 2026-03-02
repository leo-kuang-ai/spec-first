---
name: "spec-first:verify"
description: "定位 Feature 并执行阶段验收校验"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: verify

执行阶段验收校验，评估 Gate 条件与覆盖率缺口。

## 字面即精神原则

**Violating the letter of these rules is violating the spirit of these rules.**

### 字面即精神反合理化表

| AI 的借口 | 封堵 |
|-----------|------|
| "我理解核心思想，可以灵活执行" | 字面规则的违反就是精神的违反，不存在灵活变通 |
| "这是精神而非仪式" | 仪式（字面规则）是精神的体现，跳过仪式就是违背精神 |
| "实质重于形式" | 在流程守卫上，形式（字面规则）= 实质（精神） |
| "具体情况具体分析" | 规则已考虑常见情况，例外需明确讨论而非自行变通 |

## 证据铁律

铁律：声称任何阶段通过前，必须提供新鲜的验证证据。

五步 Gate Function：
1. IDENTIFY — 什么命令能证明这个声明？
2. RUN — 执行完整命令（新鲜的、完整的）
3. READ — 完整输出，检查退出码，计数失败项
4. VERIFY — 输出是否确认了声明？
5. ONLY THEN — 发出声明

禁止使用的表述：
- "should pass" / "looks good" / "已完成" / "我检查过了"
- "应该没问题" / "上一轮通过了" / "差不多了"

## 文件系统即外部记忆（统一约束）

- 每连续 2 个关键动作（执行验证命令、读取输出、形成结论）后，必须更新 `findings.md`。
- 每条通过/失败结论必须落盘到文件证据，不得仅停留在会话上下文。
- 中断前至少写入：已执行命令、退出码、阻塞项和下一步验证命令。

## Common Failures 表

| 声明 | 需要的证据 | 不充分的证据 |
|------|-----------|-------------|
| Gate 通过 | `spec-first gate check <featureId>` 输出: `PASS` 或 `PASS_WITH_WAIVER` | "我检查过了"、"应该没问题" |
| 覆盖率达标 | `spec-first metrics coverage <featureId>` 输出: C1-C9 >= 阈值 | "所有 FR 都有对应 TASK" |
| 阶段可推进 | `gate check` 退出码 0（`PASS/PASS_WITH_WAIVER`）+ `matrix check` 满足当前阶段策略 | "上一轮通过了" |
| TASK 完成 | 测试命令输出 + code-review 通过 | "代码写完了" |
| Feature 可归档 | `spec-first gate check <featureId>` + `spec-first matrix check <featureId>` + 归档产物证据 | "所有 TASK 都标记完成了" |

## 量化通过条件

- Gate 通过：`spec-first gate check <featureId>` 退出码为 0，且状态为 `PASS` 或 `PASS_WITH_WAIVER`
- 阶段可推进：`gate check` 通过；`matrix check` 按阶段策略执行（`01_specify` 可仅诊断，`03_plan` 起建议收敛到退出码 0）
- 覆盖率可接受：`metrics coverage` 结果满足当前阶段阈值（由 stage-state/mergedRules 定义）
- 结论可宣告：以上证据均为本次会话新鲜执行结果（非历史缓存）

## 判定证据链要求

- 失败条目必须映射到具体 ID（FR/DS/TASK/TC）
- 每个失败条目必须附带至少 1 条可执行修复建议

## 触发条件
- 阶段: 任意（编排层 Skill）
- Command: `/spec-first:verify`

## 执行阶段
- P0: 定位 Feature，加载当前阶段
- P1: 加载矩阵、覆盖率指标、Gate 条件
- P2: 生成校验报告（Gate 评估、SCA、覆盖率缺口）
- P3: 向用户展示校验结果（附命令输出与退出码）
- P4: 将校验结果写入 findings.md
- P5: 若所有条件满足，建议执行 stage advance

## CLI 依赖
- `spec-first gate check`
- `spec-first matrix check`
- `spec-first metrics coverage`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: auto（只读校验）

## 成功标准
- 校验报告已生成，包含 Gate 评估、矩阵完整性、覆盖率缺口
- 校验结果已写入 `findings.md`
- 声称通过时必须附带本次执行命令输出与退出码
- 若所有条件满足，已建议执行 `stage advance`

## 编排规则
- 可被 orchestrate Skill 调用，作为阶段推进前的预检
