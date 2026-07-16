# Skills 项目的第一性原理架构解读

> **文档类型：架构/设计分析。** 本文从 `/Users/kuang/xiaobu/skills/skills` 的当前 source 推导设计模型；它不是外部项目的官方规范，也不把推导结果写成 `spec-first` 的运行时合同。来源快照、适用范围和刷新规则见 [README.md](./README.md)。

## 直接依据

- 外部项目的[根 README](../../../skills/README.md)：反对由框架接管过程，说明两种安装模型与四类主要工程失败模式。
- [调用治理说明](../../../skills/.agents/invocation.md) 与 [`writing-great-skills`](../../../skills/skills/productivity/writing-great-skills/SKILL.md)：调用权、context/cognitive load、router、信息层级、single source of truth 与 leading words。
- [`ask-matt`](../../../skills/skills/engineering/ask-matt/SKILL.md)、[`setup-matt-pocock-skills`](../../../skills/skills/engineering/setup-matt-pocock-skills/SKILL.md) 与各 flow skill：主线、on-ramp、项目状态面和交接关系。
- [发布 ADR](../../../skills/.agents/adr/0002-ship-as-a-claude-code-plugin.md)：bucket、Claude plugin 与 Codex installer 的刻意分界。

## 结论先行

Skills 的核心设计不是“由一个框架接管研发流程”，而是把 agent engineering 拆成四个相互独立、可替换的面：

```text
调用治理          可复用纪律             项目拥有的状态            发布与安装
谁能启动什么  →   每次如何思考/行动   →  决定、任务、证据放哪里  →  哪些 skill 被分发
metadata/router    SKILL.md + references     tracker/CONTEXT/ADR/tests   bucket/docs/plugin/link
```

这是一种**分布式工作流协议**，不是中央状态机：skill 提供行为约束和共同语言；项目自己的 tracker、代码、`CONTEXT.md`、ADR、spec、ticket、测试和 handoff 承担可恢复状态。其价值在于把 agent 的随机输出约束为更稳定的**过程**，而非承诺每次生成相同结果。

## 1. 起点：解决的是失控的过程，不是“缺更多 agent”

根 README 对 GSD、BMAD、Spec-Kit 的反对点是“由框架拥有过程”会降低人的控制并让过程中的 bug 难以修复；`writing-great-skills` 则把 skill 的根本价值定义为：在随机系统中争取过程可预测性。

因此这里的可预测性不是“答案永远一样”，而是同类任务会：

- 进入相同的思考/验证顺序；
- 在该由人决定处停下；
- 把决定放到项目可读的位置；
- 遇到不确定性时走明确 on-ramp，而不是硬猜或静默扩大工作。

这解释了为什么仓库偏好小 skill、显式 router 和 project artifact，而不建设隐藏的全局 workflow runtime。

## 2. 调用面是成本与权力的分配，不是技能重要性的排名

`writing-great-skills` 给出两个互换成本：

| 调用面 | 获得什么 | 付出什么 | 适合的职责 |
| --- | --- | --- | --- |
| **模型或用户可调用** | agent 可按 description 的 trigger 自主抵达，也能被其他 skill 复用 | 每轮都有 description 的 context load | TDD、诊断、领域建模、深模块设计、研究等可复用纪律 |
| **仅用户显式调用** | 人保留进入流程、创建外部制品或开始高认知路径的权力 | 人需要记住入口，产生 cognitive load | grilling、triage、setup、spec/ticket、implement、wayfinder 等流程入口 |

router `ask-matt` 是这种取舍的补偿机制：当显式入口太多、人的记忆成本上升时，用一个显式入口展示拓扑，而不是让每个流程都常驻 agent 上下文。用户调用的 skill 不能互相隐式调用，因而 router 也不会演化成隐藏编排器；它只帮助用户选择下一条路径。

## 3. Skill package 的内部层级服务于“决策充分度/上下文 token”

一个 skill 的 source 不是只有正文。它由 metadata、`SKILL.md`、按需 reference、模板或脚本组成：

```text
description / invocation metadata  →  何时抵达
SKILL.md 的步骤与完成标准          →  这一次如何做
同包 reference / template          →  某个分支才需要的细节
```

`writing-great-skills` 的信息层级与 progressive disclosure 说明：每句都要位于 agent 当下完成决定所需的最低层。普遍需要的行动/完成标准放在 `SKILL.md`；只在特定 branch 才需要的规则放进有明确 context pointer 的 reference。这样不是为了“文档变短”，而是避免无关内容抢占注意力、诱发 premature completion。

其中三个设计约束尤为关键：

- **单一真相源：** 同一行为只在一个权威位置定义，减少维护和 prompt 漂移。
- **leading words：** 用 `tight loop`、`tracer bullet`、`fog of war`、`seam` 等已有概念压缩一整片行为区域。
- **完成标准：** 每个步骤要有可检查的结束条件，避免 agent 因为“想完成”而跳过 legwork。

## 4. 状态属于项目，而不是 skill 或聊天窗口

这是外部项目最重要的架构选择之一。下列制品各自承载不同时间尺度的状态：

| 状态 | 所属位置 | 为什么不放在 router/聊天里 |
| --- | --- | --- |
| 领域术语与少量不可逆决定 | `CONTEXT.md`、ADR | 让代码、人和后续 agent 使用同一语言，而不是重复解释。 |
| 可恢复的工作与依赖 | issue tracker、`to-tickets` 生成的本地文件、wayfinder map | ticket 的 blocking edge、assignee 和 frontier 能在跨会话/多人时继续存在。 |
| 当前需求与实现意图 | spec、ticket、prototype context pointer | 下一个实现会话读输入制品，而非从旧聊天猜测。 |
| 可观察反馈 | tests、repro command、diff、review finding | 允许验证而不是以“看起来合理”替代证据。 |
| 会话迁移摘要 | OS 临时目录中的 handoff | 只在需要新上下文时压缩对话，不复制已存在的项目制品。 |

`setup-matt-pocock-skills` 只把这些状态面的位置与词汇配置到一个目标项目；它不是新建一个中心数据库。`wayfinder` 的 map 也刻意只是索引：决定留在对应 ticket，map 仅提供链接与 gist，避免同一决定在两处失效。

## 5. 流程拓扑是“主线 + on-ramp + underlay”，不是必经状态图

当前 Engineering 组合可从职责而非目录名理解：

```text
主线：      grill-with-docs → [prototype] → [to-spec → to-tickets] → implement
on-ramp：   triage | diagnosing-bugs | wayfinder | architecture survey
underlay：  grilling | domain-modeling | codebase-design | tdd | code-review
support：   research | handoff | resolving-merge-conflicts
```

- **主线**中，短小工作可直接进入 `implement`；只有需要跨会话或并行的工作才经过 spec/ticket。原型是为了消除纸面无法裁决的状态/UI 不确定性，并从第一天就保持 throwaway。
- **on-ramp**按问题形状切入：原始外部输入先 triage，难 bug 先建立 red-capable loop，巨大未知工作先画决策地图，架构健康先调查再形成可讨论的改进 idea。
- **underlay**不是阶段，而是任何路径可调用的思维纪律：共同语言、设计 seam、垂直切片、测试/诊断反馈、双轴 diff review。

这也解释了 `ask-matt` 不应自动跑完整链：选择路径与执行路径是两件事，当前问题的清晰度、风险和 session 边界决定是否需要下一环。

## 6. 人的权威与反馈环是两种不同的 hard boundary

Skills 没有把“更多自动化”当作默认正确答案，而是区分两种不可替代的边界：

1. **语义权威在用户。** `grilling` 先自行查证代码事实，但把产品/设计决定逐个交给用户，并在用户确认共同理解前不执行计划。Triage 的 label、评论、关闭等外部副作用同样要经过维护者方向。
2. **行为证据在反馈环。** `diagnosing-bugs` 在提出根因前要求已运行过、能捕捉用户准确症状的 tight red loop；`tdd` 在预先确认的 seam 上一片一片推进；`code-review` 将 Standards 与 Spec 两条证据轴分开，防止一条掩盖另一条。

前者防止 agent 自己决定 WHAT，后者防止 agent 仅凭叙述相信 HOW 已正确。二者结合才让“实现很快”不等于“误解更快”。

## 7. 结构质量被视为长期吞吐量，而不是实现后的清洁工作

`codebase-design` 将模块深度定义为调用者得到的 leverage 与维护者得到的 locality，而非文件数或 TypeScript `interface` 数。`improve-codebase-architecture` 把这种词汇用于周期性发现：先生成临时 HTML 候选报告，再由人选择并 grilling；它不在扫描阶段擅自定接口。

这个设计把架构活动放回日常开发闭环：没有正确 test seam 不是“测试没写好”，而是可回流到架构健康的发现；重复出现的模糊概念也不是“多写点注释”，而是 domain model 的输入。

## 8. 仓库架构把生命周期与发布治理显式化

`skills/` 的 bucket 不是装饰：`engineering/` 与 `productivity/` 是 promoted set，必须同步根/桶 README、Claude plugin manifest 和人类文档；`in-progress/`、`misc/`、`personal/`、`deprecated/` 不应被当作发行能力。`scripts/link-skills.sh` 只供维护者把 source skill 建立成宿主本地 symlink；它不等同于面向用户的 installer。Claude plugin 与 `skills.sh` 则代表两种交付模型：可修改的复制与托管的只读更新包。

这一层与每个 skill 的行为解耦：一个目录存在不等于已发布，一个 plugin entry 也不等于当前 host 已安装或被授权。研究和比较文档必须保留这层差异。

## 9. 对 spec-first 的可迁移结论

可以借鉴的是：薄 router、由项目拥有的持久状态、共享语言、条件式 flow、短反馈环和显式 handoff。不能照搬的是 skill 名称、tracker schema、user/model 调用模型或“外部项目要求提交”的副作用。

`spec-first` 还额外承担 source/runtime 边界、claim/evidence、handoff 和 knowledge promotion 的合同；因此最合适的关系是把 Skills 当作**行为设计参考**，而不是把它变成 `spec-first` 的另一个 runtime 或把本仓 route map 改写成外部项目的状态机。
