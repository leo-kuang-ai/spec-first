# Spec-First v7.1 需求文档审查报告（Team 模式复审）

> **审查对象**：`docs/01需求文档/spec-first-v7.md`  
> **审查模式**：Team 模式（PM / TL / Arch / Ops / QA）  
> **审查日期**：2026-02-09  
> **审查范围**：文档口径一致性、与当前实现一致性、落地可执行性

---

## 总体结论

**结论：有条件不通过（暂不建议作为正式执行基线放行）**。

本次复审识别到 **P0 × 2、P1 × 5、P2 × 2**。  
其中 P0 问题会直接导致 Gate/覆盖率结果不可信，需先闭环。

---

## 一、关键问题清单（按严重级别）

## P0（必须先修复）

### P0-1 追踪矩阵状态枚举与实现不兼容

**问题描述**  
文档定义的矩阵状态（如 `Planned`、`Implemented`、`Deferred`、`Exception`）与代码解析器支持的状态集不一致。

**证据**
- 文档状态枚举：`docs/01需求文档/spec-first-v7.md:600`、`docs/01需求文档/spec-first-v7.md:606`
- 解析器仅支持：`draft/in_progress/verified/accepted/cancelled/not_implemented`：`src/core/trace-engine/matrix-manager.ts:279`、`src/core/trace-engine/matrix-manager.ts:287`
- 覆盖率 active 判定仅排除 `cancelled`：`src/core/trace-engine/coverage-calculator.ts:12`

**影响**
- 文档状态无法被工具正确消费，导致覆盖率与 Gate 结论失真。

**责任角色**
- TL / Arch / QA

**修复建议**
1. 统一状态枚举（文档与实现二选一收敛）。
2. 同步修正 active 规则与豁免规则（含 `Exception` / `Deferred` 语义）。
3. 增加状态兼容迁移说明（旧矩阵到新矩阵）。

---

### P0-2 C1-C9 指标语义冲突，且与实现映射不一致

**问题描述**  
同一编号指标在“覆盖率算法”和“度量体系”两章含义不同，代码里的 C1-C9 映射又是第三套口径。

**证据**
- 覆盖率算法定义：`docs/01需求文档/spec-first-v7.md:625`、`docs/01需求文档/spec-first-v7.md:639`
- 度量体系定义：`docs/01需求文档/spec-first-v7.md:1681`、`docs/01需求文档/spec-first-v7.md:1688`
- 代码映射：`src/core/trace-engine/types.ts:82`
- CLI 展示名称：`src/commands/metrics.ts:130`

**影响**
- 指标报表、Gate 阈值、管理层解读会出现相互矛盾，无法形成可审计基线。

**责任角色**
- PM / TL / QA

**修复建议**
1. 固化一份“唯一指标字典”（编号、公式、阈值、责任方）。
2. 文档两章与代码映射全部回归该字典。
3. 增加一致性单测（防止后续再次漂移）。

---

## P1（应在放行前收敛）

### P1-1 Gate 模型口径冲突：文档阶段 Gate vs 实现 4 道 Gate

**证据**
- 文档按阶段列 Gate：`docs/01需求文档/spec-first-v7.md:945`、`docs/01需求文档/spec-first-v7.md:954`
- 实现为 4 道 Gate：`src/core/gate-engine/gate-evaluator.ts:24`、`src/core/gate-engine/gate-evaluator.ts:183`

**责任角色**
- TL / Arch / Ops

**建议**
- 明确“阶段 Gate 是业务视图，4 道 Gate 是执行视图”，并建立映射表。

---

### P1-2 `init` 参数语义冲突：`--platform`（CI）与 `--platforms`（技术端）

**证据**
- CLI 签名：`docs/01需求文档/spec-first-v7.md:1218`
- Layer2 示例：`docs/01需求文档/spec-first-v7.md:1399`、`docs/01需求文档/spec-first-v7.md:1501`
- 代码仅支持 `--platform` 单值：`src/commands/init.ts:24`、`src/commands/init.ts:93`

**责任角色**
- TL / Ops

**建议**
- 将 CI 参数命名为 `--ci-platform`，技术端保留 `--platforms`（多值）。

---

### P1-3 “不跳阶段”原则与简化策略冲突

**证据**
- 原则：`docs/01需求文档/spec-first-v7.md:449`
- 微调简化：`docs/01需求文档/spec-first-v7.md:194`
- 风险缓解写“跳过阶段”：`docs/01需求文档/spec-first-v7.md:1801`

**责任角色**
- PM / TL

**建议**
- 统一为“不跳阶段，仅裁剪产出物深度”；微调场景若不走全流程，应标注为“不适用流程”。

---

### P1-4 缺陷逃逸率阈值三套标准

**证据**
- 流程健康度：`docs/01需求文档/spec-first-v7.md:678`
- Q1 指标：`docs/01需求文档/spec-first-v7.md:1701`
- 瓶颈规则：`docs/01需求文档/spec-first-v7.md:1735`

**责任角色**
- QA / PM

**建议**
- 统一成“目标线 + 告警线 + 阻断线”三层口径，避免各章各写一套。

---

### P1-5 8 个阶段 Skill 状态标注冲突

**证据**
- 定义表为 `Partial`：`docs/01需求文档/spec-first-v7.md:1055`
- 路径映射写 `Planned`：`docs/01需求文档/spec-first-v7.md:1110`
- 路线图写“待联调验收”：`docs/01需求文档/spec-first-v7.md:1786`

**责任角色**
- PM / TL

**建议**
- 统一状态机：`Planned -> Partial -> Implemented`，并给出验收准入条件。

---

## P2（文档质量与治理改进）

### P2-1 归档清单数量与条目不一致

**证据**
- 标题写 19 项：`docs/01需求文档/spec-first-v7.md:883`
- 实际表格条目不匹配：`docs/01需求文档/spec-first-v7.md:887`

**责任角色**
- PM

**建议**
- 重新计数并去重（含重复项说明）。

---

### P2-2 角色参与阶段与 Gate Owner 口径未完全对齐

**证据**
- 角色参与阶段：`docs/01需求文档/spec-first-v7.md:205`、`docs/01需求文档/spec-first-v7.md:210`
- Gate Owner 表：`docs/01需求文档/spec-first-v7.md:954`

**责任角色**
- PM / TL / Ops

**建议**
- 统一“参与者 vs 审批者”的定义边界，并在 Gate 表显式区分。

---

## 二、团队视角汇总

| 角色 | 主要关注点 | 结论 |
|------|-----------|------|
| PM | 指标字典唯一性、流程口径一致性 | 指标与状态定义需先统一 |
| TL | 文档与 CLI/核心引擎契约一致性 | 存在关键接口口径漂移 |
| Arch | Gate 与追踪模型可验证性 | 当前模型语义未收敛，不宜放行 |
| Ops | 参数命名与平台扩展可运维性 | `platform` 语义冲突需拆分 |
| QA | 覆盖率/逃逸率阈值可执行性 | 阈值口径冲突会影响验收判断 |

---

## 三、放行建议（执行顺序）

1. 先闭环 **P0-1 / P0-2**（状态枚举 + 指标字典）。
2. 再收敛 **P1-1~P1-5**（Gate 映射、参数语义、流程原则、阈值、Skill 状态）。
3. 最后清理 **P2** 文档治理项。

**放行门槛**  
- P0 全部关闭；  
- P1 至少完成口径统一并形成可执行规则；  
- 关键命令与关键指标可通过一次端到端演示自洽。

---

## 四、审查结论

**当前结论：不通过（需修复后再审）**。  
建议按上文顺序修复后进行三审，仅复核 P0/P1 闭环证据。
