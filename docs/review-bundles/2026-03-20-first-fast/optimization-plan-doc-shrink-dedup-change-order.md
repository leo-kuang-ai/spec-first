# 00-first 文档瘦身与去重可执行改动订单

> 适用范围：`skills/spec-first/00-first` 的 `SKILL.md` 与 `references/` 文档。
> 目标：在**不改变当前执行口径**的前提下，收敛重复语义、明确 canonical owner、降低后续 drift。
> 前提：先保留质量门禁，再处理去重；任何会削弱主线程边界、并发上限、证据规则的改动都不得执行。
> 关系说明：本文件是**执行指令**；逐文件判断基线见 `optimization-plan-doc-shrink-dedup-file-audit.md`；行号级执行细节见 `optimization-plan-doc-shrink-dedup-execution-checklist.md`。

## 1. 执行原则

1. **不改运行时语义**：不改 `first` runtime、CLI、wave 编排、产物定义。
2. **不删唯一权威**：凡是唯一调度入口、并发上限、证据门禁、条件产出规则，必须保留至少一个 canonical owner。
3. **先收口，再下沉**：入口文件只保留索引和导航，专题文档只保留增量规则。
4. **删除重复，不删除约束**：仅删除跨文件逐字重复或同义重复内容，不删约束本身。

## 2. 执行顺序

### Order 1: 固定 `SKILL.md` 的最小入口结构

**目标**
- 把 `SKILL.md` 保持为入口页，而不是第二份总说明书。

**允许做的事**
- 删除与 `execution-flow.md`、`main-thread-contract.md` 完全重复的段落。
- 保留：
  - 默认模式 `deep`
  - 正式边界
  - `Reference` 读取规则表
  - 主合同索引
  - Common Mistakes

**禁止做的事**
- 删除 `Reference` 读取规则表。
- 删除 `deep` 默认模式。
- 删除主合同索引。

**当前 live 文件的精确边界**
- 必须保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L17) 的 `默认模式`
- 必须保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L28) 的 `正式边界`
- 必须保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L49) 的 `主线程契约`
- 必须保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L57) 的 `Reference 读取规则`
- 必须保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L70) 的 `核心硬约束`
- 仅可审查性删除 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L36) 的 `正式 contract` 解释句和 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L45) 的 `最小执行流` 解释句中与主合同逐字重复的部分；不得整段删除

**验收**
- `SKILL.md` 仍能单独说明：去哪里读正式规则、默认如何执行、哪些是主合同。

---

### Order 2: 统一 `execution-flow.md` 为执行流 canonical owner

**目标**
- 让步骤化调度、证据收集、最终落盘只在一个地方讲完整。

**允许做的事**
- 删除逐字重复的总原则表述。
- 删除和 `SKILL.md` 重复的导航性描述。
- 保留：
  - Step 0 到 Step 4 的完整执行顺序
  - Serena 激活
  - evidence pack 收集
  - runtime/docs 分发
  - 最终文件落盘

**禁止做的事**
- 删除步骤序列。
- 删除 CLI 最小支撑边界。
- 删除 `shared/summary.json` / `shared/context.json` 的职责说明。

**当前 live 文件的精确边界**
- 只允许清理 [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L3) `总原则` 中与 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L3) 完全同义的 3 条：
  - `Skill 负责多 Agent 编排`
  - `CLI 只负责最小支撑层`
  - `runtime 是机器真源`
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L11) 之后的步骤主体一律保留

**验收**
- 读完 `execution-flow.md` 就能知道 `first` 从启动到落盘的顺序。

---

### Order 3: 保持 `subagent-architecture.md` 为并发与分工 canonical owner

**目标**
- 让 wave、agent 分组、并发上限、失败重试策略只在这里定权威。

**允许做的事**
- 删除与 `execution-flow.md` 完全重复的执行流描述。
- 删除与 `main-thread-contract.md` 重复的主线程概述。

**必须保留**
- `总并发上限为 3`
- Wave 1-5 分组
- runtime/docs agent 的职责边界
- `database-er.md` 受 `databaseSchema.status` 约束
- 失败与重试策略

**禁止做的事**
- 删除并发上限定义。
- 删除 wave 前置条件。
- 让 `main-thread-contract.md` 自己重写并发定义。

**当前 live 文件的精确边界**
- 必须保留 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L9) 的总并发上限
- 必须保留 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L63) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L108) 的波次与前置条件
- 只允许审查性删除 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L3) `总原则` 中与 `execution-flow.md`、`main-thread-contract.md` 重复的说明句；不得动并发条目

**验收**
- 并发规则、波次规则、失败策略在这份文档里仍然完整可追溯。

---

### Order 4: 收敛 `database-config.md`、`database-conditional-projection.md`、`platform-document-mapping.md`

**目标**
- 数据库条件产出语义只保留一个主来源。

**执行方式**
- `database-config.md` 作为数据库规则 canonical owner。
- `database-conditional-projection.md` 只保留：
  - 数据库是条件型能力
  - `database-er.md` 的存在条件
  - 简版状态表（`healthy / degraded / not_applicable` 三行）
  - 跳转到 `database-config.md`
- `platform-document-mapping.md` 只保留：
  - 正式文档全集
  - 端类型对应内容侧重点
  - `database-er.md` 是否适用的简表

**禁止做的事**
- 不要把数据库状态语义在三处重复写死。
- 不要让 `platform-document-mapping.md` 反过来承载数据库规则正文。

**验收**
- `database-er.md` 的条件产出只需要读 `database-config.md` 就能判断。

---

### Order 5: 收缩 `quality-assurance-rules.md`，但不削弱门禁

**目标**
- 让 QA 规则成为质量门禁主文件，而不是压住所有专题文档的“大模板”。

**允许做的事**
- 删除与专题文档重复的规则正文。
- 保留：
  - 证据标注格式
  - 抽样验证
  - runtime/docs 最低证据要求
  - 主线程消费边界

**禁止做的事**
- 不要把“专题可以轻量”误解成“证据可以轻量”。
- 不要降低 `[待确认]` 的标注门槛。

**验收**
- 质量门禁仍然完整，但专题文档不再被统一模板压垮。

---

## 3. 文件级执行清单

### 3.1 `skills/spec-first/00-first/SKILL.md`

可做：
- 保留入口、边界、索引和默认模式。
- 删除与主合同逐字重复的段落。

不可做：
- 删除 `Reference` 读取规则表。
- 删除并发上限的引用指向。

### 3.2 `skills/spec-first/00-first/references/execution-flow.md`

可做：
- 去掉重复总原则和导航性重复句。

不可做：
- 去掉 Step 0-4。
- 去掉 `shared/summary.json` / `shared/context.json` 的职责说明。

### 3.3 `skills/spec-first/00-first/references/subagent-architecture.md`

可做：
- 去掉与执行流重复的说明。

不可做：
- 去掉总并发上限 `3`。
- 去掉 wave 前置条件。

### 3.4 `skills/spec-first/00-first/references/database-config.md`

可做：
- 作为数据库规则总源，吸收其他文件的重复语义。

不可做：
- 降级为单纯示例文档。

### 3.5 `skills/spec-first/00-first/references/quality-assurance-rules.md`

可做：
- 收缩泛化说明。
- 保留证据格式和抽样验证。

不可做：
- 降低质量门禁。
- 放松主线程消费边界。

## 4. 不执行清单

以下事项不属于本次改动订单，执行时应直接跳过：

- 不改 runtime 资产定义。
- 不改 CLI 语义。
- 不改 `first` wave 编排。
- 不把 Path Y 合同变更提前写入本次去重。
- 不把性能优化写入去重方案。
- 不创建新的正式 docs 分类。

## 5. 交付验收标准

完成后，必须同时满足：

- `SKILL.md` 仍然是入口页，而不是第二份总合同。
- `execution-flow.md` 仍然是执行流唯一权威。
- `subagent-architecture.md` 仍然保留并发上限 `3`。
- `database-config.md` 仍然是数据库条件产出的主文件。
- `quality-assurance-rules.md` 仍然保留证据与抽样门禁。
- 没有任何 runtime / CLI / wave 语义变化。

## 6. 风险提示

1. **风险：入口被削薄**
   - 处理：保留 `Reference` 读取规则表和主合同索引。

2. **风险：门禁被误删**
   - 处理：`[待确认]`、证据标注、抽样验证不许降级。

3. **风险：canonical owner 悬空**
   - 处理：并发上限、数据库规则、执行流必须各自保留唯一权威来源。

4. **风险：专题文档被压成模板**
   - 处理：专题文档只保留增量，不强制统一长模板。

## 7. 结论

这份改动订单的核心不是“缩短文档”，而是“把重复内容从错误层级移走”。
只要按上述顺序执行，`00-first` 文档体系会更清晰，但不会损失质量门禁和可追溯性。
