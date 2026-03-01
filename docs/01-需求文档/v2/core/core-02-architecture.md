# Spec-First v7.1 — 核心架构

> **模块**: 核心研发流程 #2 | **拆分自**: spec-first-v7.md L318-512
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 双层架构（v7.1 核心升级）

v7.1 将 Spec-First 的工具实现分为两个协作层：**Skill 驱动整个流程，CLI 提供底层能力**。

```text
┌────────────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                         │
│  决策、确认、签核                                               │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│                Skill 层（流程编排与触发）                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  16 个 Skill（统一 /spec-first:xxxx 命名空间）              │   │
│  │  阶段 Skill ×9 + 编排 Skill ×3 + 工具 Skill ×4            │   │
│  │  宿主：Claude Code / Codex CLI / 其他 Agent                │   │
│  │  职责：流程编排、阶段流转触发、交互引导、内容生成         │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │ 调用 CLI 命令                    │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  CLI 层（确定性原子能力）                                │   │
│  │  13 个命令组 × 7 个核心模块（M1-M7）                     │   │
│  │  职责：ID 生成、Gate 校验、状态变更执行、度量计算         │   │
│  │  ⚠️ CLI 不主动编排流程，仅响应 Skill 或人的调用          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**分层原则**：

| 维度 | Skill 指令层（驱动层） | CLI 确定性层（能力层） |
|------|----------------------|---------------------|
| **定位** | 流程的"指挥官"，决定何时做什么 | 流程的"执行者"，保证操作确定性 |
| **实现形式** | `.md` 文件（YAML frontmatter + Markdown 指令） | TypeScript ESM 模块 |
| **执行主体** | AI Agent（Claude / GPT / Codex） | Node.js 运行时 |
| **职责边界** | 编排流程、触发阶段流转、推理生成、交互引导 | 执行状态变更、ID 注册、Gate 校验、度量计算 |
| **确定性** | 非确定性（AI 推理结果可能不同） | 确定性（相同输入 = 相同输出） |
| **可测试性** | 通过场景验证 | 通过单元测试 + 集成测试 |
| **跨平台** | Claude Code + Codex CLI 双平台兼容 | 任何 Node.js 20+ 环境 |

---

## 三层规范体系

```text
┌─────────────────────────────────────────────────┐
│  Layer 0: 通用流程框架（8+2）                      │
│  所有团队、所有模式、所有规模共享                    │
│  定义：流程骨架、阶段定义、横切机制、追踪体系        │
├─────────────────────────────────────────────────┤
│  Layer 1: 模式 × 规模 规则                         │
│  Mode N (New Feature) / Mode I (Iteration)       │
│  Size S / M / L                                  │
│  定义：每种组合下的阶段行为和产出物深度              │
├─────────────────────────────────────────────────┤
│  Layer 2: 端特有规范                               │
│  APP / PC / H5 / Java Backend / ...              │
│  定义：各端的技术约束、质量标准、检查清单            │
│  各端独立维护，按需补录                             │
└─────────────────────────────────────────────────┘
```

- Layer 0 定义"做什么"（流程骨架 + 追踪规则）
- Layer 1 定义"怎么做"（模式差异、产出物深度）
- Layer 2 定义"做到什么标准"（端特有质量标准）

**执行时合并**：Feature 启动时，确定 Mode + Size + 涉及端 → 读取 Layer 0 + 应用 Layer 1 规则 + 合并 Layer 2 规则 = 该 Feature 的定制化流程实例。

> Layer 2 合并机制详见 [aux-03-multi-platform.md](../auxiliary/aux-03-multi-platform.md)。

---

## 双模式定义

| 维度 | Mode N（New Feature） | Mode I（Iteration） |
|------|----------------------|---------------------|
| **定义** | 全新功能开发，无历史产物 | 基于已有功能的变更 |
| **起点** | 从空白开始 | 从历史产物开始 |
| **产出物** | 全新创建 | 增量更新（diff 模式） |
| **子类型** | — | Enhancement / Optimization / Bug Fix / Refactoring |

Mode I 相比 Mode N 多出 3 个必须处理的环节：

| 增量 | 说明 | 嵌入位置 |
|------|------|---------|
| **历史产物定位** | 找到并理解已有的 spec/plan/contracts/code | 00. Init |
| **Impact Analysis** | 评估变更影响哪些产物和模块 | 01. Specify |
| **回归验证** | 确保变更不破坏现有功能 | 05. Verify |

---

## 规模分级：S / M / L

**核心原则**：不跳过阶段，而是调节每个阶段的产出物深度。

| 维度 | S（Small） | M（Medium） | L（Large） |
|------|-----------|------------|-----------|
| 涉及模块数 | 1-2 个 | 3-5 个 | 6+ 个 |
| AC 数量 | ≤ 5 | 6-15 | 16+ |
| API 变更 | 无或 1 个接口 | 2-5 个接口 | 6+ 个接口或新增服务 |
| 数据模型变更 | 无 | 字段级变更 | 表级变更或新增实体 |
| 跨团队依赖 | 无 | 1 个团队 | 2+ 个团队 |

**判定规则**：5 个维度取最高级别。

---

## 流程总览

```text
00. Init (Feature Kickoff + Constitution 读取)
     │
     ▼
01. Specify (Analysis + PRD + Clarify + ID 分配)  ← /spec-first:spec
     │                    ← Exit Gate: DoR Sign-off
     │                    ← SCA（内部一致性）
     ▼
02. Design (Research + Tech + API + Data Model)    ← /spec-first:design, /spec-first:research
     │                    ← Exit Gate: Design Review
     │                    ← SCA（spec ↔ design）
     ▼
03. Plan (Tasks + Dependencies + Checklist)        ← /spec-first:task
     │                    ← Exit Gate: Task Review + 追踪覆盖率校验
     │                    ← SCA（spec ↔ tasks）
     ▼
04. Implement (Spec-Driven Dev + TDD + CR)         ← /spec-first:code → /spec-first:code-review
     │                    ← Exit Gate: Code CR + 追踪合规率校验
     │                    ← SCA（spec ↔ code）
     ▼
05. Verify (Integration Test + Security + UAT)     ← /spec-first:test
     │                    ← Exit Gate: UAT Sign-off + 测试覆盖率校验
     │                    ← SCA（spec ↔ test results）
     ▼
06. Wrap-up (Retrospective + Docs + 矩阵归档)     ← /spec-first:archive
     │
     ▼
07. Release (Build + Smoke Test + Submit to DevOps)

横切机制（贯穿全流程）:
├── A. Quality Gate — 每个阶段的准出条件（含追踪覆盖率）
├── B. SCA — 跨产物一致性校验（5 个触发时机）
└── C. Change-Management — 变更管理（分级处理，任何阶段可触发）

会话恢复（任意阶段）: ← /spec-first:catchup
```

> 各阶段详述参见 [core-04-process.md](core-04-process.md)。
> 横切机制详述参见 [core-05-cross-cutting.md](core-05-cross-cutting.md)。

---

## 流程速查表

| 阶段 | 活动 | 产出物 | Exit Gate | 追踪校验项 | Skill / CLI |
|------|------|--------|-----------|-----------|-------------|
| 00. Init | Feature 启动 + Constitution 读取 | Feature 目录、元数据 | 目录就绪，Mode/Size/端已确认 | — | `/spec-first:init` + CLI: `spec-first init` |
| 01. Specify | 需求分析 → PRD → ID 分配 → Clarify | `spec.md`, 矩阵初始化 | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | `/spec-first:spec` |
| 02. Design | Research → 技术选型 → API 契约 → 数据建模 | `design.md`, `contracts/`, ADR | Design Review + API 覆盖率 = 100% | API 覆盖率 = 100% | `/spec-first:design`, `/spec-first:research` |
| 03. Plan | 任务拆解 → 依赖分析 → Checklist | `task_plan.md`, `checklist.md` | Task Review | Task 覆盖率 = 100%，Task 合规率 = 100% | `/spec-first:task` |
| 04. Implement | 按 TASK 开发 → TDD → Code Review | 代码、单元测试、`reports/code-review-report.md` | Code CR + 代码覆盖率 ≥ 80% | PR 合规率 = 100% | `/spec-first:code`, `/spec-first:code-review` |
| 05. Verify | 测试设计 → 执行 → 安全扫描 → UAT | Test Report, UAT Sign-off | UAT Sign-off + 安全无高危（高危定义见 `core-05-cross-cutting.md`） | Test 覆盖率 = 100%，TC 合规率 = 100% | `/spec-first:test` |
| 06. Wrap-up | 复盘 → 归档 → 矩阵校验 | `retro.md`, 完整矩阵 | 文档完整性 + 归档清单 | 实现覆盖率 = 100%，矩阵全 Accepted/Cancelled/Exception（Exception 须有效豁免） | `/spec-first:archive` |
| 07. Release | 构建 → Smoke Test → 提交 DevOps 平台 | Release Note, Smoke Test 报告 | Smoke Test + 核心指标无异常 | — | — |

---

*core-02-architecture.md 完成 — 下一篇：[core-03-traceability.md](core-03-traceability.md)*
