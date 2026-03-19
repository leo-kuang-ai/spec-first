# Spec-First 流程审查整改优先级清单

> 基于 [Spec-First 全链路 Skill Gate 审查](./2026-03-19-spec-first-skill-gate-flow-audit.md) 的结论整理。  
> 目标：把“必须修 / 建议修 / 可保留”分开，避免再把记录、门禁、产物三种职责混在一起。  
> 定位：这是进入同目录实施计划前的前置整改清单，不是终局方案；真正的落地执行以 [Spec-First Skill Consolidation Implementation Plan](./2026-03-19-spec-first-skill-consolidation-implementation-plan.md) 为准。

## 1. 必须修

### 1.1 明确 `gate` 的唯一落盘边界

- `stage-state.json` 只记录阶段状态，不承载审计文本。
- `gate-history.jsonl` 只记录门禁决策历史，不承载业务结论。
- `findings.md` 只能做证据与结论记录，不得再作为门禁条件本身。
- `task_plan.md` 只记录任务进度，不记录审批状态。
- `docs/first/*` 只做人类阅读输出，不回流为门禁真源。

### 1.2 继续保持 `07-code` 的最小门槛

- 保留：`stage + design.md + task_plan.md`。
- 删除：`TDD 预检`、`findings.md` 作为进入门禁、`in_progress TASK` 作为硬前置。
- 所有 TDD 证据只能保留为过程记录，不得回到 `code` 的硬门槛里。

### 1.3 统一 `first` 的职责边界

- `spec-first first` 应继续保持为校验/验收入口，而不是 CLI 生成器。
- 如果最终产物缺失，应该明确由 Skill / 外部执行流负责重建，不要让 `src` 再回到自愈生成逻辑。
- `docs-index.json` 只能是辅助索引，不得升级为正式 gate 资产。

### 1.4 修正文档中的 stage-bounded 节点归类 ✅ DONE

> 已在 `gate-flow-audit.md` 中完成，以下条目均已落实：

- ✅ `05-research`、`20-spec-review`、`08-review`、`12-verify` 已归类为 stage-bounded quality / validation node
- ✅ `03-spec` 的 `C-PRD` / `C10` 标注为 warning，strict profile 下升级为 blocking
- ✅ `04-design` 的 `C2` / `C11` 标注为后置验收指标，不是进入门禁
- ✅ `gate-history.jsonl` 已明确为已存在的门禁历史落盘点
- ✅ `soft-gate-accessibility-plan.md` 中 `05-research` 的错误归类已修正

## 2. 建议修

### 2.1 收敛 `findings.md` 的职责压力

- 保留它作为“过程证据与结论”的统一落点。
- 减少“每 2 个动作必须写 findings”的过度频率描述，避免把记录要求变成流程阻力。
- 对 `02-catchup`、`11-plan`、`12-verify`、`08-review` 中的记录要求，统一成“必要时记录关键结论”，不要再写成强制高频写盘。

### 2.2 收紧 `docs-index.json` 的语义

- 它应该是 runtime 的阅读路由，而不是第二套健康门禁。
- `context-resolver` 若要使用它，也应只作为“建议阅读索引”，不应替代 runtime 真源判定。
- 文档里不要再出现“辅助索引兼门禁”的双重说法。

### 2.3 压平历史语义残留

- 将 `refresh / generate / builder / projection truth` 等旧叙事继续压成历史说明。
- 对外只保留“Skill 负责交付，CLI 负责校验与宿主集成”的主叙事。

## 3. 可保留

### 3.1 现有主链与阶段伴生门禁

- `01-init`
- `03-spec`
- `04-design`
- `05-research`
- `06-task`
- `07-code`
- `08-review`
- `12-verify`
- `20-spec-review`
- `10-archive`
- `13-orchestrate`

这些节点的存在是合理的，属于阶段治理的主骨架；其中 `05-research / 08-review / 20-spec-review` 是 stage-bounded quality nodes，不应再被写成“无门禁辅助节点”。

### 3.2 现有记录节点

- `findings.md`
- `task_plan.md`
- `traceability-matrix.md`
- `gate-history.jsonl`
- `retro.md`

这些文件本身都合理，问题不是“文件多”，而是“用途边界要清楚”。

### 3.3 现有辅助节点

- `02-catchup`
- `14-status`
- `15-doctor`
- `16-sync`
- `21-analyze`

它们适合继续保留为恢复、诊断、分析、同步与状态查询入口。

### 3.4 现有路由 / 控制节点

- `11-plan`
- `17-feature`

这两个节点不属于 stage 硬门，但也不是纯辅助节点：`11-plan` 负责计划与风险视图收敛，`17-feature` 负责 Feature 切换控制。文档中应持续与纯辅助节点分开表述。

## 4. 推荐执行顺序

1. 先修正文档中的 stage-bounded 节点归类，统一 `05-research / 08-review / 20-spec-review / 12-verify` 的定位，并同步多份 `SKILL.md`。
2. 再修记录边界，避免 gate 和 record 混用。
3. 再压 `07-code` 的残余重门槛。
4. 然后统一 `first` 的职责边界和辅助索引语义。
5. 最后再做文档术语收口与历史语义清理。

完成以上步骤后，进入同目录的实施计划，按任务级别继续落地：

- [Spec-First Skill Consolidation Implementation Plan](./2026-03-19-spec-first-skill-consolidation-implementation-plan.md)

## 5. 结论

当前流程的主骨架是成立的，最优先要修的是：

- `gate` 数据只落到该落的文件
- `findings.md` 退回纯记录
- `task_plan.md` 只管进度
- `docs/first` 不再反向进入门禁
- `first` 保持校验器定位，不回到生成器

这份清单的作用止于“把现状修正到可进入实施计划的状态”。如果目标是最终产品形态、skill 分层、mode 化和最小修复路径，应以同目录实施计划和 `final-optimization-plan.md` 的目标态约束共同判断。
