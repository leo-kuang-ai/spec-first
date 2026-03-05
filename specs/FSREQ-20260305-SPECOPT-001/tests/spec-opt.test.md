# Test Cases: spec-first:spec 命令优化

## TC-UT-SPECOPT-001: 复杂度判定 - Complex

**映射**: FR-SPECOPT-001, AC-SPECOPT-001-01
**级别**: UT
**优先级**: P0

**步骤**: 输入文件数=11, 歧义=0, 分支=1, 依赖=0

**预期**: 返回 "Complex"

---

## TC-UT-SPECOPT-002: Question Gate - 可推导检查

**映射**: FR-SPECOPT-002, AC-SPECOPT-002-02
**级别**: UT
**优先级**: P0

**步骤**: 检查问题是否可从仓库推导

**预期**: 可推导问题返回 true

---

## TC-UT-SPECOPT-003: 收敛阶段单问限制

**映射**: FR-SPECOPT-003, AC-SPECOPT-003-01
**级别**: UT
**优先级**: P0

**步骤**: Step 6 收敛阶段生成问题

**预期**: 最多 1 个问题

---

## TC-UT-SPECOPT-004: PRD 章节完整性检查

**映射**: FR-SPECOPT-011, AC-SPECOPT-011-02
**级别**: UT
**优先级**: P0

**步骤**: 检查 prd.md 必需章节

**预期**: 缺失章节返回错误

---

## TC-UT-SPECOPT-005: C-PRD 评分计算

**映射**: FR-SPECOPT-014, AC-SPECOPT-014-01, AC-SPECOPT-014-02
**级别**: UT
**优先级**: P0

**步骤**: 计算 PRD 清晰度评分

**预期**: 返回 0-100 分数

## TC-UT-SPECOPT-006: Expansion Sweep 三类检查

**映射**: FR-SPECOPT-005, AC-SPECOPT-005-01
**级别**: UT
**优先级**: P0

**步骤**: 执行发散扫描

**预期**: 返回未来演进/相关场景/失败边界三类结果

---

## TC-UT-SPECOPT-007: 最终确认包字段完整性

**映射**: FR-SPECOPT-006, AC-SPECOPT-006-01
**级别**: UT
**优先级**: P0

**步骤**: 检查确认包结构

**预期**: 包含 Goal/Requirements/AC/DoD/Out of Scope/Implementation Plan

---

## TC-UT-SPECOPT-008: G-SPEC-03 门禁保持

**映射**: FR-SPECOPT-007, AC-SPECOPT-007-01
**级别**: UT
**优先级**: P0

**步骤**: 检查 C10 阈值

**预期**: C10 >= 80% 才通过

---

## TC-UT-SPECOPT-009: 反模式检测 - 可推导信息

**映射**: FR-SPECOPT-008, AC-SPECOPT-008-01
**级别**: UT
**优先级**: P0

**步骤**: 检测向用户提问可推导信息

**预期**: 返回违规警告

---

## TC-UT-SPECOPT-010: 阶段衔接包结构

**映射**: FR-SPECOPT-009, AC-SPECOPT-009-01
**级别**: UT
**优先级**: P0

**步骤**: 生成衔接包

**预期**: 包含需求摘要/关键决策/实施计划/Out of Scope

---

## TC-UT-SPECOPT-011: 交互模式唯一化检查

**映射**: FR-SPECOPT-010, AC-SPECOPT-010-01
**级别**: UT
**优先级**: P0

**步骤**: 检查关键决策确认流程

**预期**: 必须经用户确认

---

## TC-UT-SPECOPT-012: PRD 场景判定 - greenfield

**映射**: FR-SPECOPT-012, AC-SPECOPT-012-01
**级别**: UT
**优先级**: P0

**步骤**: 判定为 greenfield 场景

**预期**: 包含问题定义/目标用户/MVP 范围

---

## TC-UT-SPECOPT-013: PRD 场景判定 - iteration

**映射**: FR-SPECOPT-012, AC-SPECOPT-012-06
**级别**: UT
**优先级**: P0

**步骤**: 判定为 iteration 场景

**预期**: 包含 As-Is/To-Be/影响范围

---

## TC-UT-SPECOPT-014: G-SPEC-00 门禁检查

**映射**: FR-SPECOPT-013, AC-SPECOPT-013-01
**级别**: UT
**优先级**: P0

**步骤**: 执行 PRD 门禁

**预期**: PRD 不完整返回 FAIL

---

## TC-UT-SPECOPT-015: PRD→FR 追溯映射

**映射**: FR-SPECOPT-015, AC-SPECOPT-015-01
**级别**: UT
**优先级**: P0

**步骤**: 检查 FR upstream 字段

**预期**: 每个 FR 至少 1 条 REQ-PRD-* 引用

---

## TC-UT-SPECOPT-016: Research-first 触发检测

**映射**: FR-SPECOPT-004, AC-SPECOPT-004-01
**级别**: UT
**优先级**: P1

**步骤**: 检测技术选型需求并触发调研

**预期**: 输出至少 2 个方案对比
