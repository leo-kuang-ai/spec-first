# Quality Agents 分析包总览

文档日期：2026-03-22
主题：Quality Agents AI 研发质量平台
目录定位：需求分析与产品定义

## 1. 背景

本分析包围绕一个独立于 spec-first 的新方向展开：

构建一个以 Quality Agents 为核心的 AI 研发质量平台，优先解决“需求/方案跑偏”问题。

该方向参考 gstack 的交付形态，但不复制其完整流程系统设计，而是收敛为：

- Quality Agents
- Quality Memory
- Evidence Store
- Quality Verdict

## 2. 文档结构

### 2.1 产品定义

- `quality-agents-ai-rd-quality-platform-prd.md`

作用：

- 定义产品边界
- 明确目标、非目标、用户、核心价值

### 2.2 系统架构

- `quality-agents-ai-rd-quality-platform-architecture.md`

作用：

- 定义总体分层
- 定义核心模块
- 定义对象模型、协议、runtime 和验证层

### 2.3 MVP 实施计划

- `quality-agents-v0.1-mvp-implementation-plan.md`

作用：

- 定义 V0.1 范围
- 定义分阶段交付
- 定义优先级、里程碑和风险控制

### 2.4 核心 Skills 规格

- `quality-agents-core-skills-spec.md`

作用：

- 定义 `/clarify`
- 定义 `/challenge`
- 定义 `/scope-lock`
- 定义 `/design-review`

### 2.5 对象层与门禁层

- `quality-agents-object-schema-spec.md`
- `quality-agents-gate-evaluator-spec.md`

作用：

- 定义统一质量对象 schema
- 定义 gate evaluator 的判断逻辑与输出格式

## 3. 推荐阅读顺序

建议按以下顺序阅读：

1. PRD
2. Architecture
3. MVP 实施计划
4. 核心 Skills 规格
5. Object Schema Spec
6. Gate Evaluator Spec

## 4. 当前设计结论

目前这组文档已经收敛出以下核心判断：

- 这不是一个完整流程平台，而是一个质量平台。
- 第一阶段只聚焦“需求/方案跑偏”。
- 平台核心不是编排器，而是 Quality Agents。
- 平台长期价值首先来自 Quality Memory，其次来自可复用的 Evidence。
- 技能之间共享统一质量对象，而不是共享彼此私有格式。
- `Quality Repository` 是核心资产层，不再单独暴露 `Object Store`。
- `Verdict Engine` 是轻量裁决层，不是重型 gatekeeper。
- `Context Selector` 只做选择与暴露缺口，不做真相合并。
- 当前产品边界不包含“多人协作 AI 研发控制系统”。

## 5. 下一步建议

若进入下一阶段，推荐按以下顺序推进：

1. 固化对象 schema 与 gate spec
2. 将 `Quality Repository / Verdict Engine / Context Selector` 固化为最小代码骨架
3. 落 4 个核心 skills 模板
4. 实现 memory/evidence 最小读写工具
5. 做真实案例回放评估

## 6. 一句话总结

Quality Agents 的方向，不是把研发流程做得更复杂，而是把研发质量控制做得更早、更硬、更可复用。
