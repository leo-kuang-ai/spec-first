---
title: First Skill MD 文件重构改造清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./2026-03-16-first-runtime-first-global-design.md
---

# First Skill MD 文件重构改造清单

> 目标：细化 `skills/spec-first/00-first/` 下 `SKILL.md + references/*.md` 与 `docs/first/*.md` 的逐文件改造方案，使其全部收口到 runtime-first 单一契约。

---

## 一、改造原则

所有 MD 文件改造必须遵循以下原则：

1. `docs/first/*.md` 全部视为 runtime projection，不允许旁路真相。
2. `skills/spec-first/00-first/*.md` 全部视为流程与契约文档，不允许继续描述已废弃的 quick/deep 双模式和旧 Agent 文档承诺。
3. 对仍有认知价值的旧专题文档，不删除其价值，但必须改成 runtime-first 下的专题投影视图。
4. 对没有稳定生成路径、且缺少持续消费价值的旧内容，应删除或并入其他文档。
5. 所有文件都要明确：
   - 是否保留
   - 改造动作
   - 新定位
   - 依赖的 runtime 来源
   - 主要消费方

---

## 二、动作定义

本清单统一使用以下动作类型：

- **保留重写**：文件保留，但内容契约大幅重写
- **改为投影**：文件继续存在，但完全由 runtime 投影生成
- **改为专题投影**：文件保留为专题文档，由多个 runtime assets 派生生成
- **改为条件投影**：仅在满足条件时生成
- **合并吸收**：文件能力并入其他文档，本文件删除
- **删除停用**：文件不再属于正式体系

---

## 三、Skill 层文档改造

### 3.1 主文件

| 文件 | 当前问题 | 改造动作 | 新定位 | 关键改造点 |
|------|----------|----------|--------|------------|
| `skills/spec-first/00-first/SKILL.md` | 仍描述 quick/deep、Agent 派发、旧产物清单 | 保留重写 | first 的正式产品契约入口 | 删除 quick/deep；改成单一标准模式；将“生成 markdown”改成“生成 runtime assets + 投影 docs”；补充条件型资产、专题型文档、消费契约、质量门禁 |

### 3.2 references 文档逐项改造

| 文件 | 当前问题 | 改造动作 | 新定位 | 关键改造点 |
|------|----------|----------|--------|------------|
| `references/execution-flow.md` | 仍按旧模式描述执行流与 runtime 规模 | 保留重写 | first 的正式执行流程 | 改为“证据抽取 -> schema 固化 -> runtime 写入 -> docs projection -> health/check”；删除 quick/deep 分叉；加入条件型资产与专题投影分支 |
| `references/subagent-architecture.md` | 仍围绕旧 Agent 并行产物设计 | 保留重写 | 生成流水线与并发策略 | 从“Agent A/B/C”改为“抽取器 / 识别器 / 归纳器 / 投影器”；定义脚本与 LLM 的职责边界；并发单位改为资产生成任务而非 markdown 文档 |
| `references/detection-rules.md` | 可能更偏旧端类型和产物映射 | 保留重写 | 项目类型/端类型/系统边界识别规则 | 增加 LLM 自动识别 + schema 固化口径；明确 backend/admin/h5/app/cli/library/monorepo/mixed 的识别输出字段 |
| `references/端类型产物映射.md` | 旧映射按 quick/deep 文档组合组织 | 保留重写 | 项目类型到资产/专题文档生成策略映射 | 不再映射 quick/deep 文档集合；改为“必选资产、条件型资产、专题型投影视图”的生成策略表 |
| `references/quality-assurance-rules.md` | 旧 QA 规则以 markdown 文档和 Agent 输出为中心 | 保留重写 | first 的统一质量规则 | 改为 runtime truth 质量、schema 质量、投影一致性质量、LLM 受约束归纳质量四类规则 |
| `references/testing-strategy.md` | 旧测试矩阵与旧产物承诺绑定 | 保留重写 | first 的测试策略 | 按 runtime assets / docs projections / conditional assets / derived projections / gates 五层重写测试矩阵 |
| `references/database-config.md` | 若只支持旧数据库分析链，范围偏窄 | 保留重写 | 条件型数据库能力规范 | 改成 `database-schema.json` / `database-er.md` 的输入证据、适用条件、输出约束与不适用项目判定 |
| `references/agents-code-analysis.md` | 仍按 A1/A2/A3 生成 `codebase-overview/architecture/call-graph` | 保留重写 | 代码结构与关系分析规范 | 改为 `structure-overview.json` 的抽取规范，以及 `architecture.md`、`call-graph.md` 的专题投影规则 |
| `references/agents-api-deps.md` | 仍按 B/C1 生成 `api-docs/external-deps` | 保留重写 | API 与外部依赖抽取规范 | 改为 `api-contracts.json` 抽取规则 + `external-deps.md` 专题投影规则 |
| `references/agent-guidelines-setup.md` | 仍按 C2 生成 `development-guidelines/local-setup` | 保留重写 | 规范与环境专题生成规范 | 改为 `conventions.json` / `entry-guide.json` 的来源规则，以及 `development-guidelines.md` / `local-setup.md` 的投影章节规范 |
| `references/agent-domain-model.md` | 仍按旧 Agent D/A4 生成 `domain-model.md` | 保留重写 | 领域模型资产生成规范 | 改为 `domain-model.json` 的证据抽取 + LLM 受约束归纳规范，`domain-model.md` 只作为投影 |
| `references/agent-database.md` | 仍按旧 Agent D/E 逻辑生成 `database-er.md` | 保留重写 | 条件型数据库认知规范 | 改为 `database-schema.json` 的抽取、关系识别、条件生成、ER 投影规范 |

---

## 四、Docs 投影视图改造

### 4.1 基础 canonical docs

| 文件 | 当前状态 | 改造动作 | 新定位 | Runtime 来源 |
|------|----------|----------|--------|--------------|
| `docs/first/README.md` | 已是 projection，但需要扩成统一入口 | 改为投影 | first 总入口与导航索引 | 多源投影 |
| `docs/first/summary.md` | canonical | 改为投影 | 项目摘要视图 | `summary.json` |
| `docs/first/role-views.md` | canonical | 改为投影 | 角色导航文档 | `role-views.json` |
| `docs/first/stage-views.md` | canonical | 改为投影 | 阶段导航文档 | `stage-views.json` |
| `docs/first/steering.md` | canonical | 改为投影 | 项目导向与边界说明 | `steering.json` |
| `docs/first/conventions.md` | canonical | 改为投影 | 项目规范集中视图 | `conventions.json` |
| `docs/first/critical-flows.md` | canonical | 改为投影 | 关键链路说明 | `critical-flows.json` |
| `docs/first/change-map.md` | canonical | 改为投影 | 变更导航文档 | `change-map.json` |
| `docs/first/entry-guide.md` | canonical | 改为投影 | 新手进入路径文档 | `entry-guide.json` |
| `docs/first/reboot-guide.md` | canonical | 改为投影 | 会话恢复文档 | `reboot-guide.json` |
| `docs/first/common-playbooks.md` | canonical 派生 | 改为投影 | 常见任务套路汇总 | `conventions.json` + `change-map.json` + `entry-guide.json` |
| `docs/first/known-risks-and-traps.md` | canonical 派生 | 改为投影 | 已知风险与陷阱汇总 | `critical-flows.json` + `change-map.json` + `reboot-guide.json` |

### 4.2 旧 legacy docs 升级为正式投影

| 文件 | 当前状态 | 改造动作 | 新定位 | Runtime 来源 | 备注 |
|------|----------|----------|--------|--------------|------|
| `docs/first/tech-stack.md` | legacy | 改为投影 | 技术栈专题视图 | `steering.json` | 保留文件名，删除 legacy 语义 |
| `docs/first/api-docs.md` | legacy | 改为投影 | API 契约专题视图 | `api-contracts.json` | 升级为正式 docs |
| `docs/first/codebase-overview.md` | legacy | 改为投影 | 代码结构专题视图 | `structure-overview.json` | 不再允许直接生成 |
| `docs/first/domain-model.md` | legacy | 改为投影 | 领域模型专题视图 | `domain-model.json` | 升级为正式 docs |

### 4.3 旧专题文档加入新体系

这些文件当前可能尚未稳定存在于 `docs/first/`，但应纳入新流程中的正式专题投影策略。

| 文件 | 改造动作 | 新定位 | Runtime 来源 | 生成策略 |
|------|----------|--------|--------------|----------|
| `docs/first/architecture.md` | 改为专题投影 | 架构视图 | `structure-overview.json` + `steering.json` + `critical-flows.json` | 默认生成 |
| `docs/first/call-graph.md` | 改为专题投影 | 调用链视图 | `critical-flows.json` + `change-map.json` + `structure-overview.json` | 条件生成 |
| `docs/first/external-deps.md` | 改为专题投影 | 外部依赖视图 | `summary.json` + `steering.json` + `conventions.json` | 默认生成 |
| `docs/first/local-setup.md` | 改为专题投影 | 本地环境与启动视图 | `entry-guide.json` + `conventions.json` + `steering.json` | 默认生成 |
| `docs/first/development-guidelines.md` | 改为专题投影 | 开发规范视图 | `conventions.json` | 默认生成 |
| `docs/first/database-er.md` | 改为条件投影 | 数据 ER 视图 | `database-schema.json` | 条件生成 |

---

## 五、逐文件细化改造说明

### 5.1 `SKILL.md`

应重写为以下结构：

1. 产品定位
   - `first` 是项目认知编译器
2. 单一标准模式
   - 不再区分 quick/deep
3. 输出 contract
   - 基础 canonical assets
   - 条件型资产
   - 专题型投影视图
4. 生成分层
   - 脚本确定性生成
   - LLM 自动识别 + schema 固化
   - 脚本抽取 + LLM 受约束归纳
   - 投影生成
5. 消费契约
   - 下游 skill 读取哪些资产
6. 质量门禁
   - orphan / ghost / projection / roundtrip / consumption

### 5.2 `execution-flow.md`

应改为以下主流程：

1. 证据收集
2. 项目识别与 schema 固化
3. 结构化资产生成
4. 条件型资产判定
5. docs projection
6. health/index 写入
7. context slices 输出

### 5.3 `subagent-architecture.md`

应从“按文档派发 Agent”改成“按资产生成任务编排”：

1. 脚本抽取任务
2. LLM 识别任务
3. LLM 受约束归纳任务
4. 投影任务
5. 校验任务

### 5.4 `agents-code-analysis.md`

拆成两部分能力：

1. `structure-overview.json` 抽取规范
2. `architecture.md` / `call-graph.md` 投影规则

不再直接承诺生成 markdown 真源。

### 5.5 `agents-api-deps.md`

拆成两部分能力：

1. `api-contracts.json` 抽取规范
2. `external-deps.md` 投影规则

### 5.6 `agent-guidelines-setup.md`

改为：

1. `conventions.json` 的证据提炼
2. `local-setup.md` 的环境步骤投影
3. `development-guidelines.md` 的规范投影

### 5.7 `agent-domain-model.md`

改为：

1. 领域证据抽取标准
2. LLM 归纳约束
3. `domain-model.json` schema
4. `domain-model.md` 投影模板

### 5.8 `agent-database.md`

改为：

1. 数据库适用性检测
2. schema / migration / ORM 定义抽取
3. `database-schema.json` schema
4. `database-er.md` 条件投影规则

---

## 六、文件级实施顺序

建议按以下顺序改造：

1. `SKILL.md`
2. `execution-flow.md`
3. `subagent-architecture.md`
4. `detection-rules.md`
5. `端类型产物映射.md`
6. `quality-assurance-rules.md`
7. `testing-strategy.md`
8. `agents-code-analysis.md`
9. `agents-api-deps.md`
10. `agent-guidelines-setup.md`
11. `agent-domain-model.md`
12. `agent-database.md`
13. `database-config.md`
14. `docs/first` 基础 canonical docs
15. `docs/first` legacy 升级 docs
16. `docs/first` 专题型 docs

---

## 七、终验收标准

本清单完成后，应满足：

1. `skills/spec-first/00-first/*.md` 中不再出现 quick/deep 双模式口径。
2. `skills/spec-first/00-first/*.md` 中不再出现“Agent 直接生成 markdown 真源”的描述。
3. `docs/first/*.md` 全部具备明确 runtime 来源。
4. `tech-stack/api-docs/codebase-overview/domain-model` 全部从 legacy 升级为正式投影。
5. `architecture/call-graph/external-deps/local-setup/development-guidelines/database-er` 全部纳入新流程中的专题或条件型投影机制。
6. 所有文档文件的角色都与 runtime-first 全局方案一致。

---

## 八、结论

本次改造的核心，不是简单修改若干 md 文件措辞，而是让：

- Skill 层文档负责描述**统一产品契约与生成流程**
- Docs 层文档负责作为**runtime 投影视图与专题阅读材料**

最终收口为：

> 所有有价值的文档都可以保留，但必须脱离“LLM 直接生成 markdown 真相”的旧模式，进入 runtime-first 的统一生成与消费体系。
