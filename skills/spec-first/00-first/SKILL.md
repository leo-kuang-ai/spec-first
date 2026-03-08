---
name: "spec-first:first"
description: "快速认知项目：分析技术栈、代码结构、业务流程、API、数据模型等，quick 模式生成 4-5 份核心文档，deep 模式生成 10-11 份完整文档"
version: 2.1.0
last_updated: {{DATE}}
confirm_policy: assisted
changelog: |
  2.1.0: Agent B 优化 — api-docs.md 从"端点列表"改为"接口规范提取"（统一响应格式/错误码/认证/分页/时间格式/命名规范），参考 dev-planner 模板，deep 模式追加接口示例/数据字典/cURL 示例
  2.0.0: quick/deep 双模式重构 — Layer 0 (quick: tech-stack/api-docs/codebase-overview/domain-model/database-er), Layer 1 (deep追加: call-graph/architecture/external-deps/local-setup/development-guidelines/README), 移除 Q3 交互式选项, frontmatter 标记 mode
---

# Skill: first

快速认知一个项目：自动分析目标项目的技术栈、代码结构、业务流程、API、数据模型等。

- **quick 模式**（默认）：生成 4-5 个核心文档，聚焦"快速了解项目 + 承载的业务流程 + 数据模型"
- **deep 模式**（完整分析）：生成 10-11 个文档，包含调用链、架构、外部依赖、环境搭建、研发规范等

运行时真源维护在 `.spec-first/runtime/first/`，其中 `.spec-first/runtime/first/index.json` 是正式真索引；`docs/first/` 保留为长期维护的人类可读投影视图层。

---


## Runtime 分层模型

- **机器真源层**：`.spec-first/runtime/first/`
  - `.spec-first/runtime/first/index.json`
  - `.spec-first/runtime/first/summary.json`
  - `.spec-first/runtime/first/role-views.json`
  - `.spec-first/runtime/first/stage-views.json`
- **文档投影视图层**：`docs/first/`
- 不存在额外 YAML 真索引；runtime 真源仅为上述 4 个 JSON 文件
- 默认采用**增量更新**，而不是每次全量重生成


## 刷新模式

- `refresh-runtime-only`：只刷新 `.spec-first/runtime/first/` 真源层
- `refresh-docs-from-runtime`：不重建真源，只从 runtime 刷新 `docs/first/`
- `refresh-all`：同时刷新 runtime 真源与 docs 投影视图

## 核心约束

- **以代码为准，禁止捏造**：所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- **注意语言特性**：不同语言/框架有不同惯例，不可用 A 语言的惯例推断 B 语言的行为
- **不确定标注**：未在代码中找到明确证据的内容，标注 `[待确认]`，不得裸写
- **quick 模式豁免**：quick 模式不强制要求证据标注，以提升执行速度
- **deep 模式强制**：deep 模式每条技术结论必须附带证据源，格式：

  ```
  - <结论> (`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)
  ```

  **证据类型**：`[显式]`（代码明确声明）、`[推断]`（从行为分析）、`[待确认]`（无法确定）

  **证据抽检**：deep 模式汇总前至少抽检 3 条跨文档证据，确保结论与引用文件一致。

---

## 触发条件

- 阶段: 任意（通常在接手项目时首次运行）
- Command: `/spec-first:first`

---

## 产物清单

```
docs/
└── first/
    ├── tech-stack.md            # 技术栈摘要 [quick]
    ├── api-docs.md              # API 接口规范 [quick]
    ├── codebase-overview.md     # 代码结构概览 + 开发入口 [quick]
    ├── domain-model.md          # 业务领域模型 [quick]
    ├── database-er.md           # ER 图 + 字段详情 [quick, 如有 DB]
    ├── call-graph.md            # 调用链分析 [deep]
    ├── architecture.md          # 架构图 [deep]
    ├── external-deps.md         # 外部依赖 [deep]
    ├── local-setup.md           # 本地环境搭建 [deep]
    ├── development-guidelines.md # 研发规范 [deep]
    └── README.md                # 索引导航 [deep]
```

**按模式分组**：

| 模式 | 产物数量 | 产物列表 |
|------|----------|----------|
| **quick** | 4-5 个 | tech-stack, api-docs, codebase-overview, domain-model, database-er（如有 DB） |
| **deep** | 10-11 个 | quick 全部 + call-graph, architecture, external-deps, local-setup, development-guidelines, README |

---

## Agent 分配

### quick 模式（4-5 个 Agent）

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A | tech-stack.md | 主线程直接生成 |
| B | api-docs.md（接口规范） | `references/agents-api-deps.md` |
| C | codebase-overview.md（简化版） | `references/agents-code-analysis.md` |
| D | domain-model.md | `references/agent-domain-model.md` |
| E | database-er.md（条件派发） | `references/agent-database.md` |

### deep 模式（8 个逻辑 Agent）

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A1 | codebase-overview.md + 模块清单 JSON | `references/agents-code-analysis.md` |
| A2 | architecture.md（等待 A1） | `references/agents-code-analysis.md` |
| A3 | call-graph.md | `references/agents-code-analysis.md` |
| B | api-docs.md | `references/agents-api-deps.md` |
| C1 | external-deps.md | `references/agents-api-deps.md` |
| C2 | development-guidelines.md → local-setup.md | `references/agent-guidelines-setup.md` |
| D | database-er.md（如有 DB） | `references/agent-database.md` |
| A4 | domain-model.md（等待 A2+B+D） | `references/agent-domain-model.md` |

**第三波（A2 + B + D 完成后）**：
- A4 必须在 architecture、api-docs、database-er 三类输入稳定后再启动
- 若 D 未派发，则 A4 退化为等待 A2 + B 完成，并在输出中标记 DB 证据缺失

---

## 执行流程

详细执行流程见 `references/execution-flow.md`，包括：
- P0: 定位与校验（项目检测、Greenfield/Brownfield 判断、Serena 激活）
- P1a: 技术栈识别（语言/框架/端类型检测）
- P1b: Context7 映射收集（deep 模式）
- P2: Agent 并行执行（quick/deep 模式分波派发）
- P3: 汇总输出（README 生成、交叉验证）

**核心策略**：
- Agent 独立并行，降低总时间
- 超时控制：单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s
- 降级机制：Serena 不可用时降级到静态分析

详细并发/超时规则见 `references/subagent-architecture.md`。

## 模式选择与交互策略

### 智能模式推荐（Phase 3）

- 默认优先 `quick`
- 当仓库规模大、语言/端类型复杂、或用户明确要求完整审查时，升级到 `deep`
- 推荐理由必须落到可观测信号：目录规模、依赖数量、端类型数量、外部系统数量

### 渐进式升级（Phase 3）

- 允许先跑 `quick` 形成项目骨架认知
- 当用户需要架构、调用链、外部依赖、研发规范时，再升级到 `deep`
- 升级时必须复用已生成产物，避免重复分析

---

## 成功标准

### quick 模式
- ✅ 必须生成：tech-stack.md、api-docs.md、codebase-overview.md、domain-model.md
- ✅ 如检测到 DB，database-er.md 存在
- ✅ 所有文档头部包含 `mode: quick`

### deep 模式
- ✅ quick 模式全部产物
- ✅ 追加产物：call-graph.md、architecture.md、external-deps.md、local-setup.md、development-guidelines.md、README.md
- ✅ 所有文档头部包含 `mode: deep`
- ✅ 证据标注覆盖率 ≥ 90%
- ✅ 交叉验证通过率 100%

---

## 参考清单

| 文件 | 内容 | 消费者 |
|------|------|--------|
| `references/execution-flow.md` | 详细执行流程（P0-P3） | 主线程编排 |
| `references/subagent-architecture.md` | 并行波次、依赖链、超时策略 | 主线程编排 |
| `references/detection-rules.md` | 语言/框架/端类型检测表 | P1a 主线程 |
| `references/testing-strategy.md` | 最小测试矩阵与 Phase 2/3 回归清单 | 文档治理 |
| `references/agents-code-analysis.md` | A1/A2/A3 规格（代码分析链） | Agent A1、A2、A3 |
| `references/agents-api-deps.md` | B/C1 规格（API 与外部依赖） | Agent B、C1 |
| `references/agent-guidelines-setup.md` | C2 规格（研发规范 + 本地环境） | Agent C2 |
| `references/agent-database.md` | D/E 规格（DB 检测 + ER 生成） | Agent D、E |
| `references/agent-domain-model.md` | A4/D 规格（领域模型分析） | Agent A4、D |
| `references/quality-assurance-rules.md` | 统一 QA 规则 | 全部 Agent |
| `references/database-config.md` | 数据库配置指南 | Agent D、E |
| `references/端类型产物映射.md` | 端类型→产物组合映射 | P1a 端类型检测 |

---

## 确认策略

- 推荐: assisted
- P0 幂等检测发现已有产物时，展示变更摘要后须用户确认再更新
- Agent D/E 数据库连接前须用户确认（涉及外部服务访问）
