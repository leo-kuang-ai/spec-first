---
name: "spec-first:first"
description: "项目快速认知：quick 模式生成 5-6 份核心文档（含 README），deep 模式生成 10-11 份完整文档（支持 --deep/--type/--force 参数）"
version: 2.2.0
last_updated: {{DATE}}
confirm_policy: assisted
changelog: |
  2.2.0: 方案 A 优化 — 精简 SKILL.md（删除重复内容、优化 description、添加 reference 导航、放宽证据覆盖率要求）+ quick 模式生成 README.md
  2.1.0: Agent B 优化 — api-docs.md 从"端点列表"改为"接口规范提取"
  2.0.0: quick/deep 双模式重构 — 移除 Q3 交互式选项, frontmatter 标记 mode
---

# Skill: first

快速认知一个项目：自动分析目标项目的技术栈、代码结构、业务流程、API、数据模型等。

- **quick 模式**（默认）：生成 5-6 个核心文档（含 README 索引），聚焦"快速了解项目 + 承载的业务流程 + 数据模型"
- **deep 模式**（完整分析）：生成 10-11 个文档，包含调用链、架构、外部依赖、环境搭建、研发规范等

运行时真源维护在 `.spec-first/runtime/first/`，其中 `.spec-first/runtime/first/index.json` 是正式真索引；`docs/first/` 保留为长期维护的人类可读投影视图层。

---

## 📚 Reference 文件导航

**执行流程**：
- `references/execution-flow.md` - P0-P3 详细流程
- `references/subagent-architecture.md` - 并行策略与超时控制

**Agent 规格**（派发时加载对应文件）：
- `references/agents-code-analysis.md` - A1/A2/A3（代码分析链）
- `references/agents-api-deps.md` - B/C1（API 与外部依赖）
- `references/agent-guidelines-setup.md` - C2（研发规范 + 环境搭建）
- `references/agent-database.md` - D/E（数据库分析）
- `references/agent-domain-model.md` - A4/D（领域模型）

**质量保障**：
- `references/quality-assurance-rules.md` - 统一 QA 规则（所有 Agent 必读）

**检测规则**：
- `references/detection-rules.md` - 语言/框架/端类型检测
- `references/端类型产物映射.md` - 端类型 → 产物映射表

---

## Runtime 分层模型

- **机器真源层**：`.spec-first/runtime/first/` （index.json、summary.json、role-views.json、stage-views.json）
- **文档投影视图层**：`docs/first/`
- 默认采用**增量更新**，而不是每次全量重生成

## 核心约束

- **输出语言：中文**：所有生成的文档必须使用中文撰写，技术术语（TypeScript、Vitest、Feature、Gate）和代码标识符保留英文原文
- **以代码为准，禁止捏造**：所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- **注意语言特性**：不同语言/框架有不同惯例，不可用 A 语言的惯例推断 B 语言的行为
- **不确定标注**：未在代码中找到明确证据的内容，标注 `[待确认]`，不得裸写
- **quick 模式豁免**：quick 模式不强制要求证据标注，以提升执行速度
- **deep 模式证据要求**：
  - **核心结论**（技术栈、API 端点、数据库表）必须有证据，格式：`- <结论> (\`<file_path>:<line>\` — \`<关键代码片段>\` — \`[证据类型]\`)`
  - **推断性结论**（模块职责、业务流程）可标注 `[推断]`
  - **证据类型**：`[显式]`（代码明确声明）、`[推断]`（从行为分析）、`[待确认]`（无法确定）
  - **覆盖率目标**：核心结论 100%，推断性结论 ≥60%
  - **证据抽检**：每个 Agent 抽检 2 条核心结论即可

---

## 触发条件

- 阶段: 任意（通常在接手项目时首次运行）
- Command: `/spec-first:first`

---

## 产物清单

```
docs/
└── first/
    ├── README.md                # 索引导航 [quick + deep]
    ├── tech-stack.md            # 技术栈摘要 [quick]
    ├── api-docs.md              # API 接口规范 [quick]
    ├── codebase-overview.md     # 代码结构概览 + 开发入口 [quick]
    ├── domain-model.md          # 业务领域模型 [quick]
    ├── database-er.md           # ER 图 + 字段详情 [quick, 如有 DB]
    ├── call-graph.md            # 调用链分析 [deep]
    ├── architecture.md          # 架构图 [deep]
    ├── external-deps.md         # 外部依赖 [deep]
    ├── local-setup.md           # 本地环境搭建 [deep]
    └── development-guidelines.md # 研发规范 [deep]
```

**按模式分组**：

| 模式 | 产物数量 | 产物列表 |
|------|----------|----------|
| **quick** | 5-6 个 | README, tech-stack, api-docs, codebase-overview, domain-model, database-er（如有 DB） |
| **deep** | 10-11 个 | quick 全部 + call-graph, architecture, external-deps, local-setup, development-guidelines |

---

## Agent 分配

派发 Agent 时，在 prompt 中明确指示读取对应规格文件。

### quick 模式（4-5 个 Agent）

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A | tech-stack.md | 主线程直接生成 |
| B | api-docs.md | `references/agents-api-deps.md` |
| C | codebase-overview.md（简化版） | `references/agents-code-analysis.md` |
| D | domain-model.md | `references/agent-domain-model.md` |
| E | database-er.md（条件派发） | `references/agent-database.md` |

### deep 模式（8 个逻辑 Agent）

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A1 | codebase-overview.md + 模块清单 | `references/agents-code-analysis.md` |
| A2 | architecture.md（等待 A1） | `references/agents-code-analysis.md` |
| A3 | call-graph.md | `references/agents-code-analysis.md` |
| B | api-docs.md | `references/agents-api-deps.md` |
| C1 | external-deps.md | `references/agents-api-deps.md` |
| C2 | development-guidelines.md + local-setup.md | `references/agent-guidelines-setup.md` |
| D | database-er.md（如有 DB） | `references/agent-database.md` |
| A4 | domain-model.md（等待 A2+B+D） | `references/agent-domain-model.md` |

所有 Agent 必须读取 `references/quality-assurance-rules.md`。

---

## 执行流程

详细流程见 `references/execution-flow.md`：
- P0: 定位与校验（项目检测、Greenfield/Brownfield 判断、Serena 激活）
- P1: 技术栈识别（语言/框架/端类型检测）
- P2: Agent 并行执行（quick/deep 模式分波派发）
- P3: 汇总输出（README 生成、交叉验证）

详细并发/超时规则见 `references/subagent-architecture.md`。

---

## 成功标准

### quick 模式
- ✅ 必须生成：README.md、tech-stack.md、api-docs.md、codebase-overview.md、domain-model.md
- ✅ 如检测到 DB，database-er.md 存在
- ✅ 所有文档头部包含 `mode: quick`

### deep 模式
- ✅ quick 模式全部产物
- ✅ 追加产物：call-graph.md、architecture.md、external-deps.md、local-setup.md、development-guidelines.md、README.md
- ✅ 所有文档头部包含 `mode: deep`
- ✅ 核心结论证据覆盖率 100%，推断性结论 ≥60%
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
