---
version: 1.0.0
last_updated: 2026-03-23
description: Spec-First AI Agent Skills 目录索引
---

# Spec-First Skills 目录

> Spec-First 全链路研发闭环工具链 — AI Agent 技能定义与共享上下文

## 第一性原则

Spec-First 首先是一个 **Skill 主导系统**，不是一个 CLI 主导的脚本集合。

- Skill 负责定义工作流、多 Agent 编排、约束和成功标准
- CLI 只负责最小支撑层：启动、持久化、校验和宿主集成
- 对于 `first` 这类项目认知任务，目标方向应当是：Skill 主导的多 Agent 编排优先，本地脚本退回支撑层

边界保持清晰：

- runtime 资产是机器输入，必须保持合同稳定
- docs 是人类阅读输出，不能反向成为后续 Skill 的隐藏真源

## 文档图示约定

- 在 `skills/spec-first` 的 Skill 与共享文档中，流程图、调用链图、架构图、时序图、ER 图统一使用 ASCII 文本图或表格，不使用 Mermaid
- 如需表达复杂关系，优先拆成列表、矩阵和 ASCII 树形结构，保证宿主可直接复制和审查

## 目录导航

### 项目认知 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [00-first](./00-first/SKILL.md) | 项目快速认知：默认以 deep 规格生成 runtime 真源与 docs 输出（含条件产物） | assisted |

### 核心工作流 Skills

| Skill | 阶段 | 说明 | 确认策略 |
|-------|------|------|----------|
| [01-init](./01-init/SKILL.md) | 00_init | 初始化 Feature 工作区 | strict |
| [03-spec](./03-spec/SKILL.md) | 01_specify | 定义需求规格（FR + AC）| strict/auto |
| [04-design](./04-design/SKILL.md) | 02_design | 技术设计与 API 契约 | strict |
| [05-research](./05-research/SKILL.md) | 02_design | 技术调研（可选）| assisted |
| [06-task](./06-task/SKILL.md) | 03_plan | 任务拆解与验收标准 | strict |
| [07-code](./07-code/SKILL.md) | 04_implement | 代码实现 | strict/assisted |
| [08-review](./08-review/SKILL.md) | 04_implement | 代码审查 | assisted |
| [10-archive](./10-archive/SKILL.md) | 06_wrap_up | 归档复盘 | assisted |

### 编排与验证 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [11-plan](./11-plan/SKILL.md) | 生成阶段执行计划 | assisted |
| [12-verify](./12-verify/SKILL.md) | 阶段验收校验 | auto |
| [13-orchestrate](./13-orchestrate/SKILL.md) | 编排调度器（含背景治理 / L3 风险分级） | strict |

### 会话管理 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [02-catchup](./02-catchup/SKILL.md) | 会话恢复与上下文摘要 | auto |
| [14-status](./14-status/SKILL.md) | 输出当前状态概览 | auto |
| [15-doctor](./15-doctor/SKILL.md) | 环境诊断与修复（MCP/skills 清单由 manifest 驱动） | auto |
| [16-sync](./16-sync/SKILL.md) | 同步文档关联索引 | auto |

### Feature 管理 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [17-feature](./17-feature/SKILL.md) | 统一 Feature 管理入口（list/current/switch） | auto |

### 需求聚焦 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [focus-requirements](./focus-requirements/SKILL.md) | 已审需求的 owner 边界收敛，生成 PRD 与交接摘要 | assisted |

### 扩展 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [20-spec-review](./20-spec-review/SKILL.md) | 需求规格质量审查 | assisted |
| [21-analyze](./21-analyze/SKILL.md) | 跨产物一致性分析 | auto |

## 共享上下文

- **[AGENTS.md](./AGENTS.md)** — 全局 Agent 指令与 CLI 命令参考
- **[SHARED.md](./SHARED.md)** — 跨 Skill 共享约束与规则（消除重复）

## Discovery Governance

- 正式 skill 的 `name` 统一使用 `spec-first:*` 命名空间
- `description` 只描述触发条件，统一以 `Use when...` 开头
- frontmatter 禁止总结完整流程、能力边界或实现细节，避免宿主在 discovery 阶段跳过正文
- 项目扩展字段（如 `version`、`last_updated`、`changelog`、`user-invocable`、`allowed-tools`、`hooks`、`argument-hint`）只能补充治理信息，不能替代 `name` 与 `description`
- 新增或修改 skill 时，必须同时通过 skill catalog / governance / 对应 `*-skill-docs` 测试

## 快速开始

### 按工作流程查找

1. **认知项目** → [00-first](./00-first/SKILL.md)
2. **需求聚焦** → [focus-requirements](./focus-requirements/SKILL.md)
3. **新建 Feature** → [01-init](./01-init/SKILL.md)
4. **定义需求** → [03-spec](./03-spec/SKILL.md)
5. **技术设计** → [04-design](./04-design/SKILL.md)
6. **任务拆解** → [06-task](./06-task/SKILL.md)
7. **实现代码** → [07-code](./07-code/SKILL.md)
8. **阶段验收** → [12-verify](./12-verify/SKILL.md)
9. **自动编排** → [13-orchestrate](./13-orchestrate/SKILL.md)

### 按阶段查找

| 阶段 | 推荐 Skill |
|------|-----------|
| 00_init | 01-init |
| 01_specify | 03-spec, 20-spec-review |
| 02_design | 04-design, 05-research |
| 03_plan | 06-task, 21-analyze |
| 04_implement | 07-code, 08-review |
| 05_verify | 12-verify |
| 06_wrap_up | 10-archive |

## 技术栈

- Node.js 20 + TypeScript 5.x + ESM
- CLI: Commander.js
- 测试: Vitest
- 构建: tsup

## 参考文档

- [Spec-Kit 规范](https://spec-kit.dev)
- [项目主目录](../../)
- [CLI 命令参考](./AGENTS.md#cli-命令参考)

## 维护信息

- **版本**: 1.0.0
- **最后更新**: 2026-03-23
- **维护者**: Spec-First Team

## Canonical Flow

- 阶段流：`05_verify → 06_wrap_up → 07_release → 08_done`
- 命令流：`verify → archive → golive → done`
