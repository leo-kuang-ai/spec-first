# `00-first` 技能文档总结

本文档对 `/Users/kuang/Downloads/spec-first-1.2.4/skills/00-first` 目录做结构化总结，重点回答三件事：

1. 这套 `first` 技能解决什么问题
2. 它的主流程、产物和约束是什么
3. 各份 reference 文档分别负责什么

结论先行：

```text
`first` 是项目级认知重建技能
它负责把代码库事实收敛成 runtime 真源 + docs 阅读产物
CLI 只提供最小支撑，不负责多 Agent 编排和长篇分析
```

---

## 1. 目录总览

| 文件 / 子目录 | 角色 | 核心结论 |
|---|---|---|
| `SKILL.md` | 总入口 | 定义 `first` 的职责、适用场景、正式 contract 和读取规则 |
| `agents/openai.yaml` | 平台适配 | 给 OpenAI/相关宿主一个简化入口，强调遵循 `SKILL.md` 与执行架构 |
| `references/` | 正式规则库 | 规定执行流程、证据契约、识别规则、产物消费、质量门禁 |
| `autoresearch-first/` | 实验与回归记录 | 记录 `first` 技能的实验评估，不是主 contract 的组成部分 |

---

## 2. 一句话总结

| 主题 | 总结 |
|---|---|
| 技能定位 | `first` 是项目级认知重建 skill |
| 输入 | 同一份 evidence pack、项目代码、配置、依赖、入口、Serena 可用性 |
| 输出 | `.spec-first/runtime/first/*.json` + `docs/first/*.md` |
| 运行原则 | runtime 是机器真源，docs 是人类阅读产物 |
| 主线程职责 | 协调、裁决、验收，不携带长证据正文 |

---

## 3. 主流程摘要

| 阶段 | 做什么 | 主要产物 | 关键约束 |
|---|---|---|---|
| 启动 | 执行 `spec-first first` | 进入 first 工作流 | 不要把 `catchup` 和 `first` 混用 |
| 主线程初始化 | 读取主线程契约、激活项目、收集 L0 证据 | `shared/summary.json`、`shared/context.json` | 主线程只保留最小上下文 |
| runtime 波次 | 派发结构化 runtime agents | `summary.json`、`api-contracts.json`、`domain-model.json` 等 | 总并发上限 3 |
| docs 波次 | 派发 docs agents | `README.md`、`architecture.md`、`call-graph.md` 等 | 只能基于已确认 runtime 结果 |
| 落盘 | 直接写最终文件 | `.spec-first/runtime/first/*`、`docs/first/*` | 不保留中转认知目录 |

ASCII 关系图：

```text
spec-first first
   │
   ├─ 主线程契约
   ├─ evidence pack
   ├─ runtime agents
   │   └─ 产出 .spec-first/runtime/first/*.json
   ├─ docs agents
   │   └─ 产出 docs/first/*.md
   └─ CLI 只做校验与宿主集成
```

---

## 4. 正式产物契约

### 4.1 runtime 资产

| 资产 | 作用 | 说明 |
|---|---|---|
| `index.json` | 索引 | 判断上下文是否存在 |
| `summary.json` | 总摘要 | 项目类型、入口、缺口、共享事实 |
| `steering.json` | 导航 / 侧重点 | 决定分析关注点 |
| `conventions.json` | 规范约定 | 编码与环境规范 |
| `critical-flows.json` | 关键流程 | 高扩散调用链与关键路径 |
| `entry-guide.json` | 入口指南 | 快速进入项目 |
| `api-contracts.json` | 接口契约 | API / CLI / RPC 等正式入口 |
| `structure-overview.json` | 结构概览 | 模块边界、架构关系 |
| `domain-model.json` | 领域模型 | 概念、状态、业务规则 |
| `database-schema.json` | 数据库结构 | 仅在数据库能力健康时产出 |

### 4.2 docs 产物

| 文档 | 作用 | 读者 |
|---|---|---|
| `README.md` | 项目认知总览 | 新成员、通用阅读者 |
| `summary.md` | 概览摘要 | 快速了解项目 |
| `steering.md` | 认知导向 | 影响后续阅读重点 |
| `conventions.md` | 规范摘要 | 开发者 |
| `critical-flows.md` | 关键链路 | 排障、架构理解 |
| `entry-guide.md` | 入口指南 | 快速上手 |
| `api-docs.md` | API 文档 | 接口开发者 |
| `external-deps.md` | 外部依赖 | 集成与风险评估 |
| `codebase-overview.md` | 代码库概览 | 结构理解 |
| `architecture.md` | 架构图文说明 | 架构理解 |
| `domain-model.md` | 领域模型 | 业务理解 |
| `database-er.md` | ER 图说明 | 数据库相关开发 |
| `development-guidelines.md` | 开发规范 | 开发者 |
| `call-graph.md` | 调用图 | 调试与链路分析 |

### 4.3 关键边界

| 边界 | 规则 |
|---|---|
| runtime vs docs | runtime 是真源，docs 只是阅读产物 |
| docs vs truth | `docs/first/*.md` 不能反向修正 runtime |
| 条件型文档 | `database-er.md` 只在 `databaseSchema.status === healthy` 时产出 |
| 索引作用 | `docs-index.json` 只用于阅读路由，不参与真源判定 |

---

## 5. 文档分工

| reference 文件 | 负责什么 | 关键点 |
|---|---|---|
| `execution-and-agent-architecture.md` | 执行流与 Agent 架构 | 3 并发上限、波次、runtime/docs 分层 |
| `main-thread-and-evidence-contract.md` | 主线程与证据包契约 | 主线程只保留最小上下文，输出必须可追溯 |
| `output-consumption-guide.md` | 产物消费方式 | 后续 skill 如何按需读取 runtime/docs |
| `detection-rules.md` | 项目类型识别规则 | `backend/frontend/mobile/...` 与子类型识别 |
| `platform-document-mapping.md` | 端类型如何影响文档侧重点 | 端类型影响内容重点，不裁剪正式文档全集 |
| `quality-assurance-rules.md` | 质量门禁 | 中文输出、证据标注、ASCII 图、抽样验证 |
| `testing-strategy.md` | 测试策略 | runtime/docs contract、条件产物、治理回归 |
| `code-structure-analysis.md` | 代码结构分析 | 模块、入口、调用链、架构关系 |
| `api-and-dependencies-analysis.md` | API 与依赖分析 | 接口契约、外部依赖边界 |
| `conventions-and-setup-analysis.md` | 规范与环境 | 本地环境、约定、设置 |
| `database-analysis.md` | 数据库分析 | schema、ER、条件产物 |
| `domain-model-analysis.md` | 领域模型分析 | 实体、状态、规则 |

---

## 6. 识别与路由

`first` 不只是“扫描代码”，它还会先识别项目形态，再决定后续文档侧重点。

| 识别项 | 输出 | 影响 |
|---|---|---|
| 主类型 | `backend` / `frontend` / `mobile` / `cross-platform` / `desktop` / `monorepo` / `mixed` | 影响 `summary.json` 与文档侧重点 |
| 子类型 | `admin` / `h5` / `cli-tool` / `library` / `service` / `desktop-shell` | 进一步细化输出内容 |
| 失败降级 | `unknown` 或最小可信主类型 | 仍保留标准模式正式产物集 |

识别优先级：

```text
manifest/config > 框架配置 > 目录结构 > 依赖声明 > 脚本命令
```

---

## 7. 质量门禁

| 门禁 | 规则 |
|---|---|
| 语言 | 默认中文，术语与标识符保留英文 |
| 证据 | 每个技术结论必须可追溯到 evidence path |
| 图示 | 统一使用 ASCII 文本图，不用 Mermaid |
| 主线程 | 不携带长证据正文，不输出完整推理链 |
| 缺口 | 必须标记 `[待确认]`，不能伪造事实 |
| 并发 | 总并发上限 3 个 Agent |
| 缓存 | 证据读取应先查 shared cache，避免重复读取 |

---

## 8. `autoresearch-first` 的定位

| 子目录 / 文件 | 定位 | 是否属于正式 contract |
|---|---|---|
| `SKILL.md.baseline` | 基线实验输入 | 否 |
| `changelog.md` | 实验迭代记录 | 否 |
| `dashboard.html` | 结果展示 | 否 |
| `results.json` / `results.tsv` | 实验结果 | 否 |

结论：

```text
`autoresearch-first` 是实验与回归记录，不是 first 主链的正式契约
```

---

## 9. 如何集成到 spec

如果你想把这套 `00-first` 文档的内容纳入项目 spec，建议不要整包搬运，而是按“可执行契约”拆分集成。

### 9.1 集成原则

| 原则 | 含义 |
|---|---|
| 先拆分，再入 spec | 先判断是工作流契约、质量门禁、路由规则，还是项目事实分析 |
| 工作流和业务规范分开 | `first` 主要是认知工作流，不应直接混进业务 code-spec |
| 稳定规则进 `guides/` | 能跨任务复用的规则优先放进 `guides/` |
| 目录导航靠 `index.md` | 只有被 `index.md` / 任务清单引用的内容才会被自动消费 |
| 分析文档留在 `docs/` | 过程分析、总结、评估记录更适合保留在 `docs/` |

### 9.2 推荐映射

| 来源文档 | 是否直接进入 spec | 推荐落点 | 说明 |
|---|---|---|---|
| `SKILL.md` | 否 | `docs/` 保留原文；如需复用，抽成 `spec/guides/first-workflow-guide.md` | 这是总入口，不是业务规范正文 |
| `execution-and-agent-architecture.md` | 否 | `spec/guides/first-execution-guide.md` | 适合沉淀执行流程、波次、并发上限等规则 |
| `main-thread-and-evidence-contract.md` | 否 | `spec/guides/evidence-contract.md` | 适合沉淀证据包、输出 Schema、主线程边界 |
| `output-consumption-guide.md` | 否 | `spec/guides/spec-consumption-guide.md` | 适合沉淀后续命令如何消费产物 |
| `detection-rules.md` | 视项目而定 | `spec/guides/platform-routing.md` 或 package `index.md` | 只有项目也需要同类识别时才值得进入 spec |
| `platform-document-mapping.md` | 视项目而定 | `spec/guides/platform-routing.md` | 多端项目可复用；单端项目通常不需要 |
| `quality-assurance-rules.md` | 是 | `spec/guides/quality-checklist.md` | 适合直接变成可执行门禁 |
| `testing-strategy.md` | 是 | `spec/guides/testing-checklist.md` 或各层 `quality-guidelines.md` | 适合沉淀检查清单与回归策略 |
| `code-structure-analysis.md` | 否 | 保留在 `docs/`，必要时提炼到 `index.md` | 属于分析方法，不是项目事实本身 |
| `api-and-dependencies-analysis.md` | 否 | 保留在 `docs/`，必要时提炼到 `api-docs.md` / `external-deps.md` | 只有在已有项目事实时才进 spec |
| `database-analysis.md` | 否 | 保留在 `docs/`，必要时提炼到 `database-guidelines.md` | 依赖具体项目数据库事实 |
| `domain-model-analysis.md` | 否 | 保留在 `docs/`，必要时提炼到 `domain-model.md` | 依赖具体项目领域事实 |

### 9.3 推荐集成步骤

```text
1. 不直接把 00-first 整包复制到 spec/
2. 先提炼出可复用、可执行的规则
3. 把规则分别放入 guides/ 或各层 index.md
4. 让 index.md 只保留导航和 checklist
5. 让具体规范文件承载真正可执行的规则
```

### 9.4 一个可行的落地结构

如果项目确实要吸收 `first` 体系的思想，建议这样落：

```text
.spec-first/spec/
├─ guides/
│  ├─ index.md
│  ├─ first-execution-guide.md
│  ├─ evidence-contract.md
│  ├─ quality-checklist.md
│  └─ testing-checklist.md
├─ backend/
│  └─ index.md
├─ frontend/
│  └─ index.md
└─ <package>/
   └─ ...
```

这样做的好处是：

- `before-dev` 仍然只读 `index.md` + 被引用的具体文件
- 工作流契约和业务 code-spec 不会混在一起
- 后续扩展时只要补 `guides/index.md` 和相关 checklist 即可

---

## 10. 适用建议

| 场景 | 推荐动作 |
|---|---|
| 首次接入陌生项目 | 运行 `spec-first first` |
| runtime 资产过期 | 运行 `catchup` 恢复上下文 |
| 需要理解结构 | 先看 `structure-overview.json` 和 `codebase-overview.md` |
| 需要接口信息 | 先看 `api-contracts.json` 和 `api-docs.md` |
| 需要数据库信息 | 先看 `database-schema.json` 和 `database-er.md` |
| 需要规约与入口 | 先看 `conventions.json`、`entry-guide.json`、`README.md` |

---

## 11. 最终结论

`00-first` 的本质可以概括为三句话：

```text
1. 先用 evidence pack 把项目事实收敛为 runtime 真源
2. 再把 runtime 真源投影成 docs 阅读产物
3. 所有流程都受证据、波次、并发和质量门禁约束
```

如果要把这套技能说得更短一点：

```text
它是一个把“代码事实”变成“可消费认知资产”的标准化工作流
```
