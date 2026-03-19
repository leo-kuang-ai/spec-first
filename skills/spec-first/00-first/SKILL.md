---
name: "spec-first:first"
description: "Use when validating project cognition outputs, coordinating Skill-driven runtime/docs delivery through external execution, onboarding to an unknown codebase, or when project context is stale, missing, or needs to be rebuilt after major changes."
---

# Skill: first

`first` 是项目级认知 Skill。  
它的职责是定义工作流、多 Agent 编排、约束和成功标准；Skill 工作流直接产出最终 runtime/docs 文件，CLI 只负责最小支撑层：启动、校验和宿主集成。

## 默认模式

- 唯一模式：`deep`
- 默认就是 `deep`

## 默认入口

```bash
spec-first first
```

## 正式边界

- Skill 负责：
  - 定义项目认知任务的工作流
  - 定义 runtime agents 与 docs agents 的分工
  - 定义证据来源、禁止猜测边界、成功标准与重试原则
  - 定义总并发上限：单轮最多 3 个 Agent 并发
  - 定义“事实检测”与“工作流决策”的分界
- CLI 负责：
  - 启动 `first`
  - 准备最小输入
  - 校验 runtime 结构
  - 检查 docs 是否存在

## 正式 contract

- `.spec-first/runtime/first/` 是机器真源
- `.spec-first/runtime/first/index.json` 是正式索引
- `docs/first/*.md` 是人类阅读产物，不参与上下文注入
- `docs/first/*.md` 不再承载文档真源语义
- 所有输出默认使用中文；术语、路径、命令、代码标识符保留英文

## 正式 runtime 资产

正式 runtime 资产共 `9` 个：

- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

## 辅助 runtime 产物

辅助 runtime 产物仅服务阅读路由与上下文引导，不属于正式真源资产。

- `docs-index.json`

约束：

- 只服务 docs 阅读建议与快速索引
- 不参与 runtime 真源判定
- 不覆盖正式 runtime 资产
- 不作为正式 contract 的一部分

## 正式 docs 集合

正式 docs 共 `14` 个：

- `README.md`
- `summary.md`
- `steering.md`
- `conventions.md`
- `critical-flows.md`
- `entry-guide.md`
- `api-docs.md`
- `codebase-overview.md`
- `domain-model.md`
- `architecture.md`
- `call-graph.md`
- `development-guidelines.md`
- `external-deps.md`
- `database-er.md`

## 最小执行流

详细执行流见 `references/execution-flow.md`。Agent 层完成认知产出后直接写入最终 `.spec-first/runtime/first/*` 与 `docs/first/*`，CLI 层负责校验与宿主集成。

## 主线程契约

以下文档是 `first` 主线程的 canonical 约束，要求优先读取：

- `references/main-thread-contract.md`
- `references/evidence-pack-spec.md`
- `references/agent-output-schema.md`

## Reference 读取规则

### 默认

- `references/execution-flow.md`
- `references/subagent-architecture.md`
- `references/detection-rules.md`
- `references/quality-assurance-rules.md`
- `references/main-thread-contract.md`
- `references/evidence-pack-spec.md`
- `references/agent-output-schema.md`

### 按需 Agent 规格

- `references/agents-code-analysis.md`
- `references/agents-api-deps.md`
- `references/agent-guidelines-setup.md`
- `references/agent-database.md`
- `references/agent-domain-model.md`

### 分析专题补充（Agent 证据不足时按需加载）

- `references/structure-analysis.md` — 代码结构 / 架构 / 调用链补强规则（A1-A3）
- `references/api-and-dependencies.md` — API 接口与外部依赖补强规则（B/C1）
- `references/conventions-and-setup.md` — 规范与环境配置补强规则（C2）
- `references/domain-model-analysis.md` — 领域模型资产产出规范
- `references/database-conditional-projection.md` — 条件型数据库处理规则（healthy/not_applicable/degraded）

### 低频专项

- `references/database-config.md`
- `references/platform-document-mapping.md`

### 测试与验收

- `references/testing-strategy.md` — runtime 资产与 docs 输出稳定性验证策略（验收阶段加载）

## 核心硬约束

- 以代码、配置、依赖声明和 runtime 真源为准，禁止捏造
- Skill 定义编排，CLI 不实现多 Agent 调度器
- Skill 可以强制工作流决策、模板选择、产物顺序与成功标准；脚本只允许提供原始事实与最小执行能力
- 先有 runtime 结果，再允许写入 runtime 真源
- Skill 工作流直接写入最终 runtime/docs 文件，CLI 不承担文件交付职责
- docs 不得回灌为真源
- 无法确认的结论必须标记 `[待确认]`
- `database-er.md` 只有在 `databaseSchema.status === healthy` 时才允许产出
- `api-docs.md` 只服务项目 API 接口规范，不承载外部依赖综述

## Common Mistakes

- 把 CLI 当成项目认知主控，而不是最小支撑层
- 把 `docs/first/*.md` 当成事实真源使用
- 在 `databaseSchema.status !== healthy` 时强行消费 `database-er.md`
- 在 projection/renderer 层补充 runtime 中不存在的新事实
- 把 Agent 编排逻辑继续下沉到 `src` 代码里
