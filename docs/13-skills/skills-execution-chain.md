# Skills 执行链路（基于当前 `SKILL.md`）

> **文档类型：外部项目的场景化运行说明。** 它只解释 `/Users/kuang/xiaobu/skills` 的当前 source skill；不替代任何宿主的权限、安装状态或 tracker 配置。调用前仍以对应 `SKILL.md` 为准。

> **快照边界：** 本页的外部行为源与刷新规则见 [README.md](./README.md)；这里的路径是条件性建议，不能替代 host 的安装、权限或项目级 tracker 配置。

## 先判断：这是哪一种工作？

| 现状 | 首选入口 | 不应误走到 |
| --- | --- | --- |
| 第一次把这套 skills 用进一个仓库 | `setup-matt-pocock-skills` | 直接 `triage`/`to-spec`，因为 tracker 与领域文档位置尚未配置 |
| 有一个可在本会话说明白的想法 | `grill-with-docs` | 一上来就写 ticket 或代码 |
| 一直讨论仍无法判断状态模型或 UI | `prototype` | 把未验证假设写入正式设计 |
| 讨论已经形成、要跨会话推进 | `to-spec` → `to-tickets` | 重新 grill 已经确认的内容 |
| 已有清晰 ticket 或 spec | `implement` | 把实现工作再送入 triage |
| 外部 issue/PR 刚进入维护队列 | `triage` | 默认认为它已经可由 agent 实现 |
| 难复现 bug / flake / 性能回退 | `diagnosing-bugs` | 未有 red loop 就从代码猜根因 |
| 超过一个会话、路径在 fog 中的努力 | `wayfinder` | 预先把未知工作伪装成实现 ticket |
| 想系统改善代码库形状 | `improve-codebase-architecture` | 直接按猜测重构 |
| 已开始的 merge/rebase 冲突 | `resolving-merge-conflicts` | `--abort` 或只删一侧改动 |

`ask-matt` 是不知道该选哪条时的显式路由器；`domain-modeling` 与 `codebase-design` 是贯穿过程的词汇和判断纪律。

## 场景 1：首次接入

```text
setup-matt-pocock-skills
  ├─ 探索 git remote、既有说明、CONTEXT/ADR、docs/agents、.scratch
  ├─ 与用户确认 issue tracker
  ├─（安装 triage 时）确认 label 映射
  └─ 写入/更新 AGENTS.md 或 CLAUDE.md 的 Agent skills 块及 docs/agents/*
```

它优先复用现有项目约定：GitHub、GitLab、local markdown 或用户描述的 tracker 都可被记录。单上下文仓库默认使用根 `CONTEXT.md` 和 `docs/adr/`；只有真实 monorepo 信号才讨论 `CONTEXT-MAP.md`。该技能在写前要求展示草稿并确认。

## 场景 2：idea → ship

```text
grill-with-docs
  └─ grilling（一次一个问题） + domain-modeling（术语/ADR 即时落盘）
       ├─ 需运行答案：handoff → prototype → handoff 回来
       ├─ 小且仍在同一上下文：implement
       └─ 多会话：to-spec → to-tickets → implement（每 ticket 一个新上下文）
```

### 形成共同理解

`grill-with-docs` 只是组合 `grilling` 和 `domain-modeling` 的用户入口。`grilling` 发现可通过探索代码库得到的事实时应自行查证；真正的决定才逐个交给用户，并在用户确认共同理解之前不执行该计划。`domain-modeling` 则要求：

- 发现与 `CONTEXT.md` 冲突的用词立即指出；
- 用具体边界场景逼出精确定义；
- 代码与说法矛盾时把矛盾暴露给用户；
- 仅在不可逆、需要解释、且有真实取舍时建议 ADR。

### 纸面不能回答的问题

`prototype` 先选问题形状：逻辑/状态模型做可运行的交互式终端程序；“应该长什么样”做同一路由、用 URL 参数切换的多种 UI。原型默认内存态、一个运行命令、无测试和多余抽象；结束时把验证过的决定带回主线，把原型本身提交到 throwaway branch，并从 implementation issue 留下该 branch 的 context pointer。

### 固化并实施

`to-spec` 只综合当前对话和已有代码知识。它会先约定最高可行的测试 seam，再把 problem、solution、user stories、implementation/testing decisions 与 out-of-scope 发布到 tracker，并加 `ready-for-agent` 标签。

`to-tickets` 再把它拆成可独立验证的 tracer bullet，每张卡写 end-to-end 行为、验收条件与真实 blocking edge。正常情况是垂直切片；无法保持 CI 绿色的大范围机械改动才走 expand → migrate batches → contract 的例外序列。

`implement` 的要求很短但很硬：按已有 spec/ticket 做，尽可能在已确认 seam 使用 TDD，频繁 typecheck 和单测，最后跑完整测试、`code-review` 并提交。它不定义发布、部署或远程 PR 合并。

## 场景 3：入站 issue/PR 的 triage

```text
外部 issue/PR
  → Gather（全量上下文、领域/ADR、查重、历史拒绝）
  → Recommend（category + state，等待维护者方向）
  → Verify claim（复现 bug 或确认 PR diff/检查）
  → [Grill enhancement?]
  → Apply outcome
```

category 只有 `bug` / `enhancement`；state 是 `needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。每个被分诊项应各有一个 category 与 state，冲突时先请维护者裁决。所有写到 tracker 的 triage 评论/issue 以 AI 免责声明开头。

重要边界：

- `ready-for-agent` 需要 durable brief；`needs-info` 需要可行动的问题；
- 已实现的请求可 `wontfix`，但不能写入“被拒绝知识库”；
- 被拒绝的 enhancement 才沉淀到 `.out-of-scope/`；
- “把 #42 改成 ready-for-agent”可走快速状态覆盖，但仍要先复述副作用，并询问是否需要 brief；
- `to-tickets` 产生的卡已经是 agent-ready，不走 triage。

## 场景 4：Bug 诊断与修复

```text
反馈环（先） → 复现并最小化 → 3–5 个可证伪假设 → 定向插桩 → 修复/回归测试 → 清理与复盘
```

`diagnosing-bugs` 的完成门槛不是“我看懂了代码”，而是已经运行过一个 command，它应当快速、确定、可无人值守，并对用户所说的**准确症状**具备变红能力。若没有反馈环，必须列出尝试过的方法并要求环境、捕获物或临时生产插桩授权，不能继续猜测。

修复前先把最小 repro 写成处于正确 seam 的失败测试；没有正确 seam 时要明确记录，并把架构不足交给 `improve-codebase-architecture`。所有带 `[DEBUG-…]` 前缀的插桩必须在结束前移除。

## 场景 5：大而未知的 Wayfinder

```text
模糊目标
  → 明确 Destination
  → 广度优先发现 frontier 与 fog
  → 创建 map issue + 已可表述的 child tickets
  → 每会话 claim 并只解决一个未阻塞 ticket
  → 记录决策、毕业新的 fog、直到路径清楚
  → to-spec（或问题已缩小则 implement）
```

map 是索引：关闭 ticket 的结论在 ticket 自身，map 的 `Decisions so far` 只存链接和一句 gist。已能清楚表述的问题创建 ticket；还不能准确表述的 in-scope 事项留在 `Not yet specified`。超出 Destination 的事项进入 `Out of scope` 并关闭，而不是被误称为 fog。

ticket 类型可以是 Research（AFK）、Prototype（HITL）、Grilling（HITL）或 Task（视情况）；每张都围绕一个**决定/调查**，不是交付切片。并发会话靠“先 assign 自己”认领；frontier 是未关闭、无 blocker、未认领的 child ticket。

## 场景 6：代码形状、测试与评审

`codebase-design` 提供共同语言：module、interface、implementation、depth、seam、adapter、leverage、locality。它要的不是更多抽象，而是小 interface 后的高行为密度；测试与调用者应跨同一 seam。

`tdd` 把这个原则落在实现时：先与用户确认公共 seam，再每次一个行为测试、一个最小实现。它显式反对 implementation-coupled test、tautological assertion 和先写一大批测试再实现的 horizontal slicing。

`code-review` 以用户指定的 commit/branch/tag/merge-base 为固定点，先检查 diff 不为空，再分别派生：

1. **Standards：** 本仓规则 + Fowler smell baseline（后者始终只是判断性启发）；
2. **Spec：** 原始 issue/PRD 的要求、遗漏、scope creep 与实现错误。

两个报告不合并、不统一排序；没有 spec 时第二轴应诚实说明“no spec available”。

## 场景 7：架构健康、研究与会话连续性

`improve-codebase-architecture` 先读领域 glossary 和相关 ADR，再探查代码的理解摩擦、浅模块、泄漏 seam 和不可测试区域，临时生成带 before/after 图的 HTML 候选报告。选中候选后才进入 grilling；报告阶段不应抢先设计 interface。

`research` 要求一手资料并生成带引用的 Markdown；它依赖后台委托能力。`handoff` 将当前会话写到操作系统临时目录并要求下一个会话读取该文件；它不是在同一会话中调用的摘要功能。需要保留同一对话但容忍历史被压缩时，才使用宿主的 `compact`。

## 场景 8：正在进行的 merge/rebase

`resolving-merge-conflicts` 不允许随意舍弃一侧，步骤是：查看当前 merge/rebase 状态 → 找到两侧改动的 commit/PR/issue 原始意图 → 逐 hunk 尽量保留两种意图，必要时明确取舍 → 跑项目的 typecheck/test/format → stage 并完成 merge 或继续 rebase。它与创建隔离 worktree、代码 review 或发布无关。

## 与 spec-first 的边界

这些是外部流程的精确语义；本仓当前的 `spec-*` 入口、artifact contract、权限门与验证要求要回读本仓 source。两者的当前对应关系见 [spec-first-workflow-map.md](./spec-first-workflow-map.md)，候选而未实现的迁移设计见 [spec-first-refactor-plan.md](./spec-first-refactor-plan.md)。
