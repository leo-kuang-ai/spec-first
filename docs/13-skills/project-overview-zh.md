# Skills 项目介绍（以当前源码为准）

> **文档类型：外部项目说明与调研结论。** 本文的对象是 [`mattpocock/skills`](../../../skills/README.md) 的本地工作树，不是 `spec-first` 的功能清单。源项目有未提交改动时，当前磁盘上的 `SKILL.md` 优先于本文与其目录 README。

> **快照与维护：** 本页按 2026-07-16 的外部 source 快照校对；基准 commit、工作树前提与刷新规则见本目录的 [README.md](./README.md)。设计原则的推导见 [skills-first-principles.md](./skills-first-principles.md)。

## 一句话定位

Skills 是一套面向真实工程工作的、**小而可组合**的 agent skill。它刻意不把研发过程封装为不可见的“大框架”：人或模型按情境选用 skill，工作状态主要留在项目的 issue tracker、`CONTEXT.md`、ADR、spec、ticket 和测试中。

它围绕三种常见失败模式组织：

1. **意图没有对齐：** 以 `grilling`/`grill-with-docs` 把猜测变成用户确认的决定。
2. **代码缺乏可靠反馈：** 以确认 seam 的 TDD、可重放的诊断反馈环和 diff review 约束实现。
3. **长期熵增：** 以领域语言、ADR、deep module 词汇和架构健康扫描维持可理解性。

这三点与 `spec-first` 的“可信变更”目标相近，但两者的产品边界不同：Skills 是一组可移植的工作方式；`spec-first` 是把 intent、evidence、handoff 与 knowledge 连接起来的项目级 harness。

## 读源码时的证据层级

本项目同时有行为 source 与发布索引，二者的用途不同：

1. `SKILL.md` 定义 skill 的当前行为、输入、输出与副作用边界；同目录 `agents/openai.yaml` 进一步声明 Codex 的隐式调用策略。
2. `ask-matt` 是用户可达 flow 的路由说明；它帮助选路，但不能替代被路由 skill 的约束。
3. 根 README、bucket README、plugin manifest 与 docs page 说明推广和发布集合。它们应与 source 同步，但在脏工作树中不能反过来覆盖 `SKILL.md`。

因此，本文把“可调用”与“已安装/已授权”严格分开：前者只描述 source 的调用面，后两者仍要由当前 host、权限和项目配置证明。

## 安装与仓库组织

源项目给出两种安装方式：

- `npx skills@latest add mattpocock/skills`：将选择的 skills 复制到可自行修改的项目中；适用于 Codex 及遵循 Agent Skills 标准的宿主。
- Claude Code plugin：安装 `mattpocock-skills` marketplace 插件，获得托管的只读更新包。

首次在工程项目使用前，应显式运行 `setup-matt-pocock-skills`。它只在确认后写入 tracker、triage label 与领域文档约定；后续 `triage`、`to-spec`、`to-tickets`、`wayfinder` 才知道从哪里读写制品。

源仓库按发布状态分桶：

| Bucket | 当前目录数 | 含义 | 是否随 Claude plugin 发布 |
| --- | ---: | --- | --- |
| `skills/engineering/` | 17 | 日常代码工作 | 是 |
| `skills/productivity/` | 5 | 非代码的通用工作流 | 是 |
| `skills/in-progress/` | 8 | 草稿 | 否 |
| `skills/misc/`、`personal/`、`deprecated/` | 4 / 2 / 4 | 低优先级、个人或废弃材料 | 否 |

推广 bucket 中的每个 skill 都应同时出现在根 README、对应 bucket README、plugin manifest 和 `docs/<bucket>/`；这是一项源项目维护约束，而不是运行时能力声明。

## 调用模型

源项目把 skill 分成两类：

- **用户调用型：** `SKILL.md` 有 `disable-model-invocation: true`。它们多为流程编排、需要人做决策或会产生外部制品的入口，例如 `to-spec`、`triage`、`wayfinder`、`implement`。
- **模型调用型：** 既可由用户调用，也可因描述匹配而被模型选用。它们多为可复用的技术纪律，例如 `tdd`、`diagnosing-bugs`、`codebase-design`、`code-review`。

这是“谁能抵达入口”的约束，不是“哪一个更重要”的排序。比如 `prototype` 当前属于模型调用型，而 `implement` 属于用户调用型；旧文档把前者列为用户专用是错误的。

## 当前核心工作流

```text
准备：setup-matt-pocock-skills

常规 idea → ship：
grill-with-docs → [prototype?] → [to-spec → to-tickets]? → implement
                                                           ↘ tdd + code-review

独立/汇入路径：
triage → implement
diagnosing-bugs → 修复 → [improve-codebase-architecture?]
wayfinder → to-spec 或（工作实际很小时）implement
research / handoff / resolving-merge-conflicts → 为上述路径提供支持
```

这里的方括号是条件分支，而非每次都执行的阶段：

- **`prototype`** 仅在状态模型、业务逻辑或 UI 仅靠讨论无法裁决时使用，且从一开始就是 throwaway code。
- **`to-spec` + `to-tickets`** 用于跨会话或多人可并行的构建；短小且上下文仍完整的工作直接进 `implement`。
- **`wayfinder`** 管理的是“还不知道该做什么”的调查地图，直到路径清楚；它不是把巨大 feature 直接拆成实现 backlog。
- **`triage`** 只处理外部原始 issue/PR；由 `to-tickets` 产生的 ticket 已经就绪，不能再走一次 triage。

## 方法论的可迁移价值

### 共同语言是低成本的上下文压缩

`domain-modeling` 把术语定义、冲突与 edge case 当作开发过程的一部分，要求及时更新 `CONTEXT.md`。它不把该文件当作 spec 或实现笔记。这样做的目标是让人、模型、代码和测试采用同一套词，而不是增加一份长文档。

### 反馈环先于推理自信

`diagnosing-bugs` 的强约束尤其值得借鉴：在形成根因理论前，先有一个已运行、可重复、足够快、能够捕捉**用户原始症状**的 command。`tdd` 也要求预先确认测试 seam，并按一个垂直切片一个循环推进。二者都拒绝用“看起来合理”代替可观察证据。

### 制品交接应轻，但应明确

spec、ticket、研究笔记、wayfinder map 和 handoff 文档分别解决不同的上下文边界。`to-tickets` 明确记录 blocking edge，`wayfinder` 让已做决定只存在于对应 ticket 而非重复铺在地图中，`handoff` 则在换会话时保存上下文。这些模式与本仓的 artifact/handoff 纪律相容，但必须保留本仓的 source/runtime 与 evidence 边界。

### 设计评价看 interface 的杠杆，而非文件数量

`codebase-design` 将 module 定义为任何“有 interface 与 implementation 的东西”，以调用方得到的 leverage 和维护者得到的 locality 衡量深度。它强调“一个 adapter 是假想 seam，两个 adapter 才是实际 seam”，从而避免为了测试或未来想象而过早抽象。

## 已验证的边界与不应误读之处

- 源项目的 README/skill 文案是流程建议；它不证明某个宿主已安装、可调用或拥有 tracker 权限。
- `implement` 的“最后提交”是该外部 skill 的行为，不能被映射为本仓任何 `spec-*` skill 自动拥有相同授权。
- `code-review` 的 Standards/Spec 双轴是外部项目的 review 模型；`spec-code-review` 有自己的当前 contract，不能只因名称相近就混写。
- `resolving-merge-conflicts` 处理已经开始的 merge/rebase；它与 worktree 隔离不是同一能力。
- `research` 的“后台 agent”要求宿主具备委托能力；不可用时应诚实降级，而非伪称已完成研究。

## 推荐阅读顺序

1. [README.md](./README.md)：本次 source 快照、证据边界与刷新规则。
2. [skills-first-principles.md](./skills-first-principles.md)：从第一性原理理解调用治理、状态归属和反馈环。
3. [engineering-workflow-map.md](./engineering-workflow-map.md)：外部 Engineering 17 个 skill 的精确职责与边界。
4. [skills-execution-chain.md](./skills-execution-chain.md)：按实际情境选择路径。
5. [spec-first-workflow-map.md](./spec-first-workflow-map.md)：只比较当前存在的两侧入口。
6. [spec-first-refactor-plan.md](./spec-first-refactor-plan.md)：区分历史 `spec-intake` 提案与当前实现的差距。

交互式浏览版本见 [skill-flows-overview.html](./skill-flows-overview.html)。
