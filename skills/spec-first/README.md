---
version: 1.0.0
last_updated: 2026-02-27
description: Spec-First AI Agent Skills 目录索引
---

# Spec-First Skills 目录

> Spec-First 全链路研发闭环工具链 — AI Agent 技能定义与共享上下文

## 目录导航

### 核心工作流 Skills

| Skill | 阶段 | 说明 | 确认策略 |
|-------|------|------|----------|
| [01-init](./01-init/SKILL.md) | 00_init | 初始化 Feature 工作区 | strict |
| [03-spec](./03-spec/SKILL.md) | 01_specify | 定义需求规格（FR + AC）| strict/auto |
| [04-design](./04-design/SKILL.md) | 02_design | 技术设计与 API 契约 | strict |
| [05-research](./05-research/SKILL.md) | 02_design | 技术调研（可选）| assisted |
| [06-task](./06-task/SKILL.md) | 03_plan | 任务拆解与验收标准 | strict |
| [07-code](./07-code/SKILL.md) | 04_implement | 按 TASK 实现代码 | strict/assisted |
| [08-code-review](./08-code-review/SKILL.md) | 04_implement | 代码审查 | assisted |
| [09-test](./09-test/SKILL.md) | 05_verify | 测试用例定义 | strict |
| [10-archive](./10-archive/SKILL.md) | 06_wrap_up | 归档复盘 | assisted |

### 编排与验证 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [11-plan](./11-plan/SKILL.md) | 生成阶段执行计划 | assisted |
| [12-verify](./12-verify/SKILL.md) | 阶段验收校验 | auto |
| [13-orchestrate](./13-orchestrate/SKILL.md) | 编排调度器（主编排）| strict |

### 会话管理 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [02-catchup](./02-catchup/SKILL.md) | 会话恢复与上下文摘要 | auto |
| [14-status](./14-status/SKILL.md) | 查看当前状态 | auto |
| [15-doctor](./15-doctor/SKILL.md) | 环境诊断与修复 | auto |
| [16-sync](./16-sync/SKILL.md) | 同步追踪矩阵 | auto |

### Feature 管理 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [17-feature-list](./17-feature-list/SKILL.md) | 列出全部 Feature | auto |
| [18-feature-switch](./18-feature-switch/SKILL.md) | 切换当前 Feature | auto |
| [19-feature-current](./19-feature-current/SKILL.md) | 查看当前 Feature | auto |

### 扩展 Skills

| Skill | 说明 | 确认策略 |
|-------|------|----------|
| [20-spec-review](./20-spec-review/SKILL.md) | 需求规格质量审查 | assisted |
| [21-analyze](./21-analyze/SKILL.md) | 跨产物一致性分析 | auto |

## 共享上下文

- **[AGENTS.md](./AGENTS.md)** — 全局 Agent 指令与 CLI 命令参考
- **[SHARED.md](./SHARED.md)** — 跨 Skill 共享约束与规则（消除重复）

## 快速开始

### 按工作流程查找

1. **新建 Feature** → [01-init](./01-init/SKILL.md)
2. **定义需求** → [03-spec](./03-spec/SKILL.md)
3. **技术设计** → [04-design](./04-design/SKILL.md)
4. **任务拆解** → [06-task](./06-task/SKILL.md)
5. **实现代码** → [07-code](./07-code/SKILL.md)
6. **编写测试** → [09-test](./09-test/SKILL.md)
7. **自动编排** → [13-orchestrate](./13-orchestrate/SKILL.md)

### 按阶段查找

| 阶段 | 推荐 Skill |
|------|-----------|
| 00_init | 01-init |
| 01_specify | 03-spec, 20-spec-review |
| 02_design | 04-design, 05-research |
| 03_plan | 06-task, 21-analyze |
| 04_implement | 07-code, 08-code-review |
| 05_verify | 09-test, 12-verify |
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
- **最后更新**: 2026-02-27
- **维护者**: Spec-First Team
