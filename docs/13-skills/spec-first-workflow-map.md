# Skills 与 Spec-First 的工作流映射（当前源码对比）

> **文档类型：比较分析。** 左侧是当前 `/Users/kuang/xiaobu/skills` 的 source skill，右侧是当前 `spec-first/skills/*/SKILL.md`。映射只说明目标或输入/输出相邻，**不**表示可以替换、自动串联、共享权限，或拥有同样的验证强度。

> **快照边界：** 本页基于 2026-07-16 的两边 source；外部 source 的 commit/脏工作树前提和刷新规则见 [README.md](./README.md)。`using-spec-first` 的当前 route map 与项目 authority 仍优先于本页。

## 结论

两者共享“先理解、再小步验证、再保存可复用上下文”的工程取向，但产品形状不同：

- **Skills** 是一套可组合的工程动作与共同语言，依赖项目配置的 tracker、`CONTEXT.md` 和 ADR。
- **spec-first** 是项目级可信变更 harness：通过 public route、source/runtime 边界、artifact、evidence、handoff 和 knowledge 约束可以声称什么。

因此最准确的关系不是“后者完整复刻前者”，而是：部分阶段目标相似，部分能力互补，另一些外部 skill 没有本仓的当前等价物。

```text
外部 Skills：      grill → [prototype] → to-spec → to-tickets → implement → review
spec-first： using-spec-first → brainstorm/prd → plan → [write-tasks] → work → code-review

两边共同需要：明确输入、细粒度反馈、明确交接
两边不可直接合并：入口名、artifact 格式、权限、副作用与完成证据
```

## 当前主链的相邻关系

| 工程目的 | Skills（当前） | spec-first（当前） | 关系与边界 |
| --- | --- | --- | --- |
| 决定下一步 | `ask-matt` | `using-spec-first` | 都是路由器；前者展示 skills flow，后者只选一个 public entrypoint/standalone skill/Direct Lane 并退出，不持有状态。 |
| 项目初始配置 | `setup-matt-pocock-skills` | `spec-runtime-setup`、`spec-first doctor`/`init`（按场景） | 都涉及准备，但前者配置 tracker/领域文档，后者管理宿主 runtime readiness；不能互换。 |
| 创意与需求探索 | `grill-with-docs` + `domain-modeling` | `spec-ideate`、`spec-brainstorm`、`spec-prd` | 目标相邻。spec-first 把 0–1 方向、模糊需求、brownfield PRD 分开；Skills 强调逐题 grilling 与 glossary/ADR。 |
| 用运行物减少不确定性 | `prototype` | 无一对一入口 | **Skills 独有。** spec-first 有 UI polish、browser QA 等相邻能力，但不是 throwaway design prototype。 |
| 写需求/spec | `to-spec` | `spec-prd`（或 `spec-brainstorm` 生成 requirements-only unified plan） | 均把讨论固化为下游输入；两边输出结构、readiness 和 owner/evidence contract 不同。 |
| 形成 HOW plan | 无独立同名步骤；`to-spec` 含实现决定 | `spec-plan` | **spec-first 更明确。** 计划在本仓是单一 canonical source，并可补强已有计划。 |
| 拆执行单元 | `to-tickets` | `spec-write-tasks`（可选派生层） | 都强调可执行切分；前者发布 tracker ticket 并明确 blocker，后者从 settled local plan 生成或验证 task pack，plan 仍是 canonical。 |
| 实施 | `implement` | `spec-work` | 都面向已明确的输入；Skills 要求 TDD、`code-review` 与 commit，本仓 `spec-work` 的 engine、verification 和 tail 以自己的 contract 为准。 |
| 代码评审 | `code-review` | `spec-code-review` | 都评审 diff；外部 skill 固定 Standards/Spec 双轴，本仓用自己的人格、finding 和 action contract。不能混为同一 gate。 |
| 调试 | `diagnosing-bugs` | `spec-debug` | 都强调复现、最小化和证据；以各自 source skill 的边界为准。 |
| 架构/性能改善 | `improve-codebase-architecture`、`codebase-design` | `spec-optimize`、`spec-simplify-code`、`spec-pov`（视问题） | 只有部分重叠：外部侧是 deepening 报告与模块词汇；本仓优化以可测目标为前提。 |
| 知识沉淀 | `domain-modeling`、ADR、`research` | `spec-compound`、`spec-compound-refresh` | 都保留长期知识；本仓要求知识 promotion 具备可回源、验证、适用范围与失效条件。 |

## 当前 spec-first 能力按层归类

下表只列当前源目录存在的入口，不把历史名字、宿主 generated mirror 或愿景文档写作现有功能。

| 层 | 当前 skill | 用途 |
| --- | --- | --- |
| 入口与运行时 | `using-spec-first`、`spec-runtime-setup` | 选择一个合适入口；检查或配置支持工作流的运行时事实。 |
| 意图与产品 | `spec-ideate`、`spec-brainstorm`、`spec-prd`、`spec-strategy`、`spec-pov` | 分别处理方向发散、需求探索、brownfield PRD、策略和对外部方案的项目化判断。 |
| 计划与执行 | `spec-plan`、`spec-write-tasks`、`spec-work`、`spec-lfg` | 形成 plan、可选派生 task pack、执行明确工作；`spec-lfg` 仅在用户明确要求全自动 green-PR 路径时使用。browser applicable 时调用方提供 exact origin，browser cleanup、缺 origin 与缺少持久/外部 UI effect 授权会在 tracker、commit、push、PR、CI 副作用前阻断。 |
| 质量与验证 | `spec-doc-review`、`spec-code-review`、`spec-debug`、`spec-test-browser`、`spec-test-xcode`、`spec-dogfood`、`spec-polish`、`spec-simplify-code`、`spec-optimize` | 分别处理文档/代码审查、bug、平台测试、分支 QA、协作式 UI 打磨、保行为简化和指标优化；`spec-test-browser` 在调用方已启动的 loopback exact origin 上执行有界 browser verification，聚合 route/step、私有证据与 browser cleanup，不管理项目 server。 |
| 交付与协作 | `spec-commit`、`spec-commit-push-pr`、`spec-resolve-pr-feedback`、`spec-proof`、`spec-worktree` | commit/PR、处理 review thread、协作文档、内部隔离 worktree。`spec-worktree` 是 internal helper，不是公开路由菜单。 |
| 项目理解与知识 | `spec-compound`、`spec-compound-refresh`、`spec-explain`、`spec-rule-miner` | 沉淀/刷新知识、个人化解释、从代码证据提炼项目规则。 |
| 专项与反馈 | `spec-app-consistency-audit`、`spec-product-pulse`、`spec-sweep`、`spec-riffrec-feedback-analysis`、`spec-promote` | App 跨源审计、产品信号/反馈、录音分析和已交付功能的对外文案。 |
| 自身治理 | `spec-write-skill` | 创建、改造或只读审计 source skill package；不用于普通工程工作。 |

## 不能把 spec-first 独有入口降格为外部 Skills 的别名

比较也必须从右向左成立：外部 Skills 的相邻目标不能覆盖本仓已有的 contract。

| spec-first 当前入口 | 外部 Skills 的最近邻 | 为什么不能合并 |
| --- | --- | --- |
| `spec-doc-review` | `to-spec`、`code-review` | 前者专门审阅 requirements、plan 或 task 文档；`to-spec` 是写作/综合，`code-review` 的输入则是固定基点的代码 diff。 |
| `spec-runtime-setup` 与 `doctor`/`init` | `setup-matt-pocock-skills` | 两侧都叫“setup”，但前者管理 host/runtime readiness 与 source projection，后者配置目标项目的 tracker、triage label 和领域文档。 |
| `spec-proof` | `handoff` | 两者都帮助协作，却不消费同一制品：`handoff` 压缩会话给下一位 agent；`spec-proof` 的证据/协作文档 contract 必须以本仓 source 为准。 |

## 不能错误填平的缺口

| 外部 Skills 能力 | spec-first 当前状态 | 原因 |
| --- | --- | --- |
| `prototype` 的 throwaway 逻辑/UI 决策实验 | 无一对一 skill | `spec-polish`、`spec-test-browser` 面向现有功能质量，不等价于用临时代码回答设计问题。 |
| `triage` 的外部 issue/PR category/state 状态机 | 无当前公开 `spec-intake` | 当前 `using-spec-first` 对外部 issue/PR 按即时意图路由：failure → `spec-debug`，未定 WHAT → `spec-prd`/`spec-brainstorm`，diff 风险 → `spec-code-review`，已获授权的工作 → `spec-work`。 |
| `resolving-merge-conflicts` 的意图驱动 merge/rebase 收尾 | 无一对一 skill | `spec-worktree` 仅提供隔离 worktree，不解决冲突；`spec-resolve-pr-feedback` 处理 review feedback，也不同。 |
| `wayfinder` 的 tracker 调查地图 | 无一对一 skill | `spec-plan` 可规划，`spec-write-tasks` 可派生任务，但当前没有以 fog/frontier/map issue 为中心的长周期决策工作流。 |
| `codebase-design` 的固定深模块词汇 | 部分由现有设计/优化 skill 覆盖 | 本仓没有把该外部词汇设为全局 contract；引用时应注明其来源，而非假装是本仓已采纳术语。 |

## 当前 source 证据与维护规则

- `using-spec-first` 的权威 route map 是 [`skills/using-spec-first/references/public-route-map.md`](../../skills/using-spec-first/references/public-route-map.md)，不是本页。
- `spec-first` 的原则、authority 与 source/runtime 边界以 [`docs/10-prompt/结构化项目角色契约.md`](../10-prompt/结构化项目角色契约.md) 为准。
- 外部 project 的最新行为以其每个 `SKILL.md` 为准；特别是 `to-spec`、`to-tickets`、`code-review`、`prototype` 和 `wayfinder` 的名字/调用面不可从旧材料推断。
- 比较结果只是 advisory research；它不能支持“已安装”“已运行”“已验证”或“两边语义等价”的 claim。
- `spec-first` 公开入口变动后，先更新 `using-spec-first` 与其 route map；只有 source 对齐后再刷新本页的相邻关系，不能反过来用本页设计当前 runtime。

历史 `spec-intake` 设计与当前空缺的关系见 [spec-first-refactor-plan.md](./spec-first-refactor-plan.md)。
