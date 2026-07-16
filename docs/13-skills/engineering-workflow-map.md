# Engineering Skills 研发流程映射（当前源码快照）

> **文档类型：外部项目对比参考。** 本文描述 `/Users/kuang/xiaobu/skills` 当前工作树中的 `skills/engineering/`；它不是 `spec-first` 的运行时契约，也不授权在本仓调用或安装任何外部 skill。结论应在使用前回读对应 `SKILL.md`。

> **核对依据：** 外部项目根 [`README.md`](../../../skills/README.md)、各 `skills/engineering/*/SKILL.md`，以及 `skills/productivity/*/SKILL.md`。本次快照有 **17 个 engineering skill**：9 个仅用户显式调用、8 个模型或用户可调用。

> **快照边界：** 计数和调用面来自 2026-07-16 的 source skill package；commit、脏工作树前提和刷新方法见 [README.md](./README.md)。README 的暂时遗漏不改变这里的调用面结论。

## 它解决的是什么问题

这不是一个统一的流程引擎，而是一组小而可组合的研发纪律。它的主张是：用 `CONTEXT.md`/ADR 保存共同语言和难以逆转的决定，用 issue tracker 保存可恢复的执行状态，用短反馈环驱动实现与诊断。流程是推荐拓扑，不是强制状态机。

```text
首次配置
  setup-matt-pocock-skills

idea → grill-with-docs ──┬── prototype（纸面无法回答的状态或 UI 问题）
                         └── to-spec → to-tickets → implement
                                                   ├── tdd
                                                   └── code-review

on-ramps: triage（外部 issue/PR） | diagnosing-bugs（难 bug） | wayfinder（巨大且未知的工作）
underlay: domain-modeling | codebase-design
```

`research`、`handoff` 和 `resolving-merge-conflicts` 是支撑性路径，而非这个主干的固定阶段。

## 当前 skill 清单

| 入口/纪律 | 调用面 | 当前职责 | 典型产物或下一步 |
| --- | --- | --- | --- |
| `setup-matt-pocock-skills` | 用户 | 一次性建立 tracker、triage 标签和领域文档布局 | `docs/agents/*`、`CONTEXT.md`/ADR 约定 |
| `ask-matt` | 用户 | 在不记得流程时进行路由 | 推荐一个合适 flow |
| `grill-with-docs` | 用户 | 用逐题访谈打磨计划或设计，并驱动领域建模 | 更新 glossary/ADR；必要时进入原型或 spec |
| `to-spec` | 用户 | 只综合已有对话与代码理解，发布 spec；不再访谈 | 带测试 seam 的 tracker spec |
| `to-tickets` | 用户 | 将 plan/spec 拆成带 blocking edge 的 tracer-bullet 垂直切片 | tracker issue 或 `.scratch/<feature>/issues/*.md` |
| `implement` | 用户 | 按 spec/ticket 实现，持续 typecheck/测试，收尾 review 并提交 | 一个完成的实现 commit |
| `triage` | 用户 | 分类、验证和补全外部 issue/PR，形成可执行 brief | `ready-for-agent`/`needs-info`/`wontfix` 等状态 |
| `wayfinder` | 用户 | 为超过单个会话、路径仍在 fog 中的工作建立调查地图 | map issue、决策记录和后续 `to-spec`/`implement` |
| `improve-codebase-architecture` | 用户 | 找浅模块和坏 seam，生成临时 HTML 候选报告，再一起设计 | deepening 候选和领域/架构决定 |
| `prototype` | 模型/用户 | 用可丢弃终端程序验证逻辑，或在单路由上比较多种 UI | 一次性原型与已验证决定 |
| `research` | 模型/用户 | 委托后台 agent 查一手资料并保存带引用的 Markdown | 可回读的研究笔记 |
| `diagnosing-bugs` | 模型/用户 | 先获得快速、确定、能复现用户症状的 red loop，再诊断 | 最小复现、回归测试、必要时架构改进建议 |
| `tdd` | 模型/用户 | 在预先确认的 seam 上逐个 vertical slice 做 red → green | 行为导向测试和最小实现 |
| `code-review` | 模型/用户 | 以固定基点的 diff 为输入，分开审查 Standards 与 Spec | 两轴独立 findings |
| `domain-modeling` | 模型/用户 | 主动挑战模糊/重载术语，实时更新 glossary 与少量 ADR | `CONTEXT.md`、ADR |
| `codebase-design` | 模型/用户 | 提供 deep module、interface、seam、adapter、leverage、locality 词汇 | 更小、更可测的接口设计 |
| `resolving-merge-conflicts` | 模型/用户 | 通过双方变更的原始意图解决 merge/rebase 冲突，跑检查并完成操作 | 完成的 merge/rebase |

调用面以 `SKILL.md` 的 `disable-model-invocation: true` 与同包 `agents/openai.yaml` 为准；前者表示仅用户显式入口，后者在 Codex 中把隐式调用关掉。不要从旧 README 的遗漏反推可调用性。

## 关键分支与边界

### 主流程：先共同理解，再交付

`grill-with-docs` 通过 productivity 的 `grilling` 循环一次只问一个决策问题；能从代码查到的事实应先查证，真正的决定必须交给用户，并在用户确认已形成共同理解前不执行计划。`domain-modeling` 同步把稳定术语写入 `CONTEXT.md`，仅在难以逆转、未来读者会困惑且存在真实取舍时写 ADR。若需要可运行答案，使用 `prototype`，而不是把猜测提前写成生产设计。

小工作可直接从完整上下文进入 `implement`；跨会话的构建先用 `to-spec` 再用 `to-tickets`。每张 ticket 是可独立验证的垂直切片，而不是“数据库层/接口层/UI 层”式横向分工。实施会按确认 seam 使用 `tdd`，并在提交前运行 `code-review`。

### 三条 on-ramp

- **外部需求或 PR：** `triage` 是入站整理，不应用于 `to-tickets` 已生成的 agent-ready ticket。它会先查重、查已拒绝请求、验证 claim，再由维护者决定标签和评论等副作用。
- **难 bug 或回退：** `diagnosing-bugs` 禁止先凭直觉读代码；必须先构建已经运行过、能捕捉用户症状的反馈命令。没有正确测试 seam 本身是架构发现。
- **巨大且未知的努力：** `wayfinder` 的 ticket 是调查/决策 ticket，不是实现 ticket。每会话只解决一张；地图清晰后才进入 `to-spec`，若问题实际变小才可直接交给 `implement`。

### 横切纪律

- `codebase-design` 用“深模块、小 interface、干净 seam”衡量设计；它不等同于 TypeScript 的 `interface` 关键字。
- `tdd` 只测试跨公共 seam 的行为，不测试内部协作者或通过旁路观察实现细节。
- `code-review` 不把“符合规范”和“实现了原始需求”合并排序；前者还带有可被仓库规范覆盖的 Fowler smell baseline。
- `handoff` 用于换一个全新会话并保留上下文；`compact` 则在同一对话内压缩。二者不可混同。

## 与本仓的使用边界

这套 skills 对 `spec-first` 的启发是可组合流程、清晰的制品交接和显式的上下文卫生；不能据此假定两边的入口、权限或 runtime 行为相同。`spec-first` 当前入口与外部 skills 的对比见 [spec-first-workflow-map.md](./spec-first-workflow-map.md)，执行场景见 [skills-execution-chain.md](./skills-execution-chain.md)。
