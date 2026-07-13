---
date: "2026-07-13"
topic: per-requirement-workspace-multi-repo-graph
spec_id: 2026-07-13-001-per-requirement-workspace-multi-repo-graph
artifact_kind: scenario-clarification
status: implemented
write_mode: draft
can_enter_spec_plan: yes
implementation_plan: docs/plans/2026-07-13-001-feat-per-requirement-workspace-multi-repo-graph-plan.md
implementation_status: completed
author: leokuang
related:
  - docs/plans/2026-07-13-001-feat-per-requirement-workspace-multi-repo-graph-plan.md
  - docs/validation/2026-07-13-per-requirement-workspace-graph-e2e-receipt.md
  - docs/plans/2026-07-12-005-feat-spec-code-review-code-graph-advisory-integration-plan.md
  - docs/plans/2026-07-12-006-feat-multi-repo-workspace-graph-lifecycle-query-plan.md
  - skills/spec-mcp-setup/scripts/lib/project-target.cjs
  - skills/spec-mcp-setup/scripts/providers/codegraph.cjs
  - skills/spec-mcp-setup/scripts/providers/graphify.cjs
---

# 按需求建 workspace 的多仓代码图谱 —— 背景 / 场景 / 需求梳理

> 本文目的:在进入方案(plan)之前,把 owner 的真实使用场景、痛点和需求基线梳理清楚,作为后续独立 `spec-plan` 的输入。场景与范围已 owner 验证并进入 plan；**实现已完成**，见 `docs/plans/2026-07-13-001-feat-per-requirement-workspace-multi-repo-graph-plan.md`（`status: completed`）与 `docs/validation/2026-07-13-per-requirement-workspace-graph-e2e-receipt.md`。

---

## 1. 背景

当前 AI 辅助研发的主流形态,越来越多是 **workspace 工作模式**:开发者在一个父目录(workspace)下同时打开前端、后端、工具、文档等**多套独立 Git 仓库**,然后从 workspace 命令行进入 codex / claude 等工具做需求开发。

spec-first 已有的相关能力:

- `spec-mcp-setup` 能处理显式 non-Git folder,也能发现并批量处理父目录下的 child Git repo。
- CodeGraph(战术 code graph)与 Graphify(宏观 project graph)已能分别对**单个 project root** 建图、查询、刷新。
- 已有两份在途 plan:
  - **005**:`spec-code-review` 作为**下游消费者**,消费可用的 workspace/child 图做影响链路审查(不拥有 Provider lifecycle)。
  - **006**:多仓 workspace 图谱**生产者 / lifecycle owner**,负责 registry、per-project 图、workspace serving graph、freshness、refresh。

但 006 的设计默认的是**长期存在的稳定 workspace**(一次发现、一次确认、之后主要增量刷新),这与 owner 的真实形态不完全吻合。本文即用于澄清真实形态。

---

## 2. 真实使用场景(owner 确认)

**一个需求 = 一个以需求命名的文件夹 = 一个 workspace。**

- 需求 A → 文件夹 `需求A/` → 把 Git 工程 `{1, 2, 3, 4}` 各自 clone 进该文件夹。
- 需求 B → 文件夹 `需求B/` → 把 Git 工程 `{3, 4, 5, 6}` 各自 clone 进该文件夹。
- 每个 workspace(需求文件夹)都需要初始化 `spec-mcp-setup`,并初始化代码知识图谱(CodeGraph / Graphify)。
- **开发时直接 `cd` 进入 `需求A/` 或 `需求B/` 目录,再从该目录启动 codex / claude 等工具。**

### 2.1 物理布局(owner 确认)

```text
需求A/                      ← workspace 根(非 Git 父目录);工具从这里启动
├── 工程1/  (独立 clone,.git)
├── 工程2/  (独立 clone,.git)
├── 工程3/  (独立 clone,.git)   ┐ 与 需求B/工程3 是两份物理独立的 checkout
└── 工程4/  (独立 clone,.git)   ┘

需求B/                      ← 另一个 workspace 根
├── 工程3/  (独立 clone,.git)   ← 与 需求A/工程3 同源、物理不同份
├── 工程4/  (独立 clone,.git)
├── 工程5/  (独立 clone,.git)
└── 工程6/  (独立 clone,.git)
```

这坐实了几点:

- **workspace 根 = 需求文件夹,是一个非 Git 父目录**,内含多个 child Git repo —— 结构上正是 006 处理的 "non-Git parent workspace",但叠加了短命 + 重叠维度;owner 已决定 per-需求 隔离、当前版本不做跨 workspace 复用。
- **图 artifact 按需求 workspace 隔离**:CodeGraph 产物位于各 clone 内的 `.codegraph/`;Graphify 子图与合并图统一 out-of-tree 写入需求根 `.graphify/`。因此 `需求A/工程3` 与 `需求B/工程3` 仍各自生成独立图谱,不做缓存 / 软链 / 内容寻址复用。
- **会话默认 cwd = 需求文件夹根(多仓父目录)**,而不是某个具体工程——路由(注入指令 + `projectPath`,非自建 resolver;见 A2)须把"cwd 在 workspace 根、尚未指向具体工程"当作常见起始态,再按后续 `cd` 或显式 target 尽量路由。
- 需求文件夹名可能是中文/非 ASCII(`需求A`)——路径处理需 unicode-safe。

关键特征:

1. **workspace 是短命的、按需求抛弃的**——需求 A 做完,`需求A/` 基本失去价值。
2. **项目跨 workspace 高度重叠**——工程 3、4 同时出现在 `需求A/` 和 `需求B/`(现实中往往是同一批核心仓在不同需求里反复出现)。
3. **每开一个新需求就要重来一遍 init + 建图**——这是重复劳动 + 重复建图成本的来源。

### 2.2 已确认的关键事实

| 问题 | owner 确认 | 影响 |
|---|---|---|
| 各 workspace 里的仓在磁盘上怎么摆? | **各 workspace 独立 clone**——工程 3 在 workspace A、B 各有一份独立 checkout,物理重复 | 各 clone 各自持图;**owner 决策:当前版本 per-需求 隔离、不做跨 workspace 复用**,无需内容寻址缓存 / 软链,各 workspace 独立生成 |
| 一个 workspace 包含哪几个仓,怎么确定? | **两者都要**——通常显式给清单(需求 A = 仓 1234),也希望能自动发现父目录下漏掉的仓 | init 入口要同时支持"照清单批量建"和"扫父目录补发现";清单是主路径,自动发现是补充 |

---

## 3. 目标与真实诉求(修正原“核心痛点”)

> owner 指出原 §3 痛点框错了。经本轮澄清,真实模型如下(owner 确认)。

**要做的事:** 在每个"需求文件夹"(非 Git 多仓父 workspace)内,一键为工作准备两层代码图,并保持自动新鲜:

- **每个子仓的战术图**(符号 / 调用 / 影响面):由 CodeGraph 承担。
- **workspace 级的跨仓宏观图**(跨服务 / 前后端的结构、社区、路径):由 Graphify 承担。
- 两层图都要**自动刷新**:代码改动或子仓提交后无需手动重建。

**明确边界(owner 决策):**

- **per-需求 隔离**:每个需求文件夹自成一体,不与其它需求共享图或身份。
- **当前版本不考虑复用**:各 workspace 独立生成;同一工程在 `需求A/`、`需求B/` 各建各的,不做缓存 / 软链 / 内容寻址复用。
- 从需求文件夹根进工具后,按 cwd **尽量(best-effort)**路由到对应子仓的战术图(A2 靠注入指令引导 agent 传 `projectPath`,非确定性 resolver);需要跨仓时用 workspace 宏观图。

**真实 gap(要解决的):** 今天 `spec-mcp-setup` 以**单一 project root** 为中心,没有一等的方式从一个**非 Git 多仓父目录**一键建立"每仓战术图 + workspace 跨仓宏观图"并让两者自动保持新鲜;开发者要么逐仓手动配置,要么把父目录误当单仓。

---

## 4. Provider 建图 / 刷新能力与端到端验证

> 基于本机已安装 `codegraph`(homebrew)与 `graphify 0.9.12` 的真实 CLI 能力核对;确定性事实,不随后续取舍改变。

> **claim 1 / claim 2** = owner 在澄清中提出、本节据实核对的两条机制表述:**claim 1** = Graphify git / 非 git 都能建,git 下 commit 刷新、非 git 下由子 git 工程 commit 触发 hook 刷新 workspace 图;**claim 2** = CodeGraph 无需 Git、任何代码改动后延迟自动刷新。

### 4.1 已确认的端到端基线

owner 已在真实 per-需求多仓 workspace 中验证双图谱全量自动化链路可用:

- init 可 eager 建立全部子仓 CodeGraph 战术图、Graphify 子图与 workspace 合并图;
- 从 workspace 会话可通过 `projectPath` 命中不同子仓的 CodeGraph 图;
- CodeGraph watcher 可在代码变化后自动同步对应子仓图;
- Graphify 子仓刷新与 workspace `merge-graphs` 收敛链路可自动完成;
- 单仓与跨仓查询均可路由到对应 scope,图谱候选仍需回到正确子仓源码确认。

该验证解除方案可行性 blocker。plan 需把已验证链路固化为可重复的回归验收,记录 Provider / 宿主版本、workspace 拓扑、执行命令、耗时、产物大小、查询结果、刷新收敛结果与已知限制;在回归回执落盘前,本文只声明 owner-verified outcome,不伪造尚未记录的命令或日志。

### 4.2 Provider 能力事实

**CodeGraph**

- `init` / `index` / `sync` / `status [path]` 只认路径,**不依赖 Git**;建图走文件系统遍历 + `.gitignore`。产物是 per-project 的 `.codegraph/codegraph.db`(写在建图根)。
- `serve --mcp` 作为 MCP server 运行,**默认开启 file watcher**(`--no-watch` 才关),代码变更后延迟 auto-sync。MCP 模式下建图 / watch 路径来自 **client 的 rootUri**(宿主从需求文件夹启动时传入)。
- ⇒ **claim 2 成立**:无 Git、代码变更后延迟自动刷新。
- **多仓最佳实践(官方 README 推荐)= per-project 索引 + `projectPath` 跨项目查询。** 每个 project 各建 `.codegraph/`;MCP server **一次性全局 install**(不逐仓装,README:451);同一 session 里给工具传 `projectPath` 即可查询任意已索引子仓 / 第二个仓,server root 自身没索引也行(README:499、607)。⇒ **per-child 是 CodeGraph 原生多仓形态,且不丢跨仓能力**(跨仓 = 一个 session 按 projectPath 查多个子图)。
- **产物只能在仓内(无 out-of-tree)。** `init` 无 `--out`/`--db`;仅 `CODEGRAPH_DIR` env 可改**目录名**(文档示例是同树 sibling 如 `.codegraph-win`;能否指到仓外绝对路径**未验证,仅列为 optional exploration,不阻塞主路径**)。⇒ 没有像 Graphify `--out` 那样把产物写进 workspace 的原生途径;CodeGraph 的"不侵入"惯用做法是把 `.codegraph/` 放进 `.gitignore` 或 `.git/info/exclude`(git 不显示 / 不 track / 不改 committed 文件,但目录物理仍在子仓工作树内)。
- **父目录一张(在 `需求A/` init)可行但非惯用**:能一图覆盖全部子仓、产物落 workspace,但是单体图、索引整棵树,且脱离 `projectPath` per-project 模型,属 workaround。
- **对比 Graphify**:`--out`/`GRAPHIFY_OUT` 可自由重定向到仓外(代码 metadata `requirement_workspace_path`:Graphify 已接线、CodeGraph 为 `null`,正因 CodeGraph 做不到 out-of-tree)。
- `.gitignore` 被 CodeGraph 尊重(root + nested,非 git 项目也读),额外排除写 `codegraph.json` 的 `exclude`(README:668-711)。

**Graphify**

- `extract <path>` 建图(spec-first 通过 `GRAPHIFY_OUT=.graphify` 把产物落到 `.graphify/`),**git / 非 git 都能建**。
- 刷新有两条原生途径:
  - **git hook**:`hook install` 装 post-commit / post-checkout,刷新的是**该仓自己的图**;
  - **`watch <path>`**:文件夹 watcher,**非 git 也能用**。
- 跨仓 / workspace 图有原生能力:
  - `merge-graphs g1 g2 …` → 把多张图合并成一张 cross-repo 图(`--out` 指定输出),适合 **per-需求 隔离**;
  - `extract --global --as <tag>` + `global add/remove/list` → 机器级单例 **`~/.graphify/global-graph.json`**(按 tag 键控)。**因 owner 选 per-需求 隔离,本方案不用 `--global`,改用 per-workspace `merge-graphs`。**

**对 claim 1 的修正:** workspace 图**不是**被"父目录 hook"直接刷新的。已验证链路为:**子仓变化 / commit → Provider 刷新对应子仓图 → workspace 自动化编排重新执行 per-需求 `merge-graphs` → 合并图收敛**。具体触发与等待机制属于 plan 的实现合同和回归验收内容,不再作为可行性 spike。

---

## 5. 关键设计取舍(已确认)

- **per-需求 隔离 ⇒ 用 per-workspace `merge-graphs`,不用机器级 `--global`。** 每个需求文件夹的 workspace 跨仓图落在该文件夹内,互不干扰。
- **不复用 ⇒ 删掉一整类复杂度。** 无需跨 workspace 稳定 repo identity、无需内容寻址缓存 / 软链、无"同工程不同 commit 并存"冲突处理。之前担心的"缓存图填进新 clone 是否安全"硬门槛**随之消失**。
- **分工:CodeGraph 做每仓战术图,Graphify 做 workspace 宏观图。** 契合两者本性(CodeGraph 符号 / 影响面;Graphify 结构 / 社区 / 路径),避免重复造图。Graphify 合并图相对"CodeGraph 多查 projectPath"的差异化:它是**一张**跨全部子仓的结构 / 路径整图,能答"跨服务谁依赖 X、跨仓调用路径"这类需要单张全局图的问题;projectPath 是分别查 N 张子图、不组装成一张。
- **产物放置(已确认:owner 选“git 干净即可”)**:
  - CodeGraph 走**官方推荐 per-child**:每子仓 `工程N/.codegraph/`(物理在子仓内)+ 把 `.codegraph/` 写入该子仓 `.git/info/exclude` 保持 git 干净;**MCP server 全局 install 一次**;跨仓查询靠传 `projectPath`,**不建 CodeGraph 父目录单体图**。
  - Graphify 走 **out-of-tree**:`--out`/`GRAPHIFY_OUT` 把子图与合并图都写到 `需求A/.graphify/` 下,**子仓物理零侵入**。
- **保留:** cwd-aware 路由(进哪个仓 → 对应 `projectPath`/子图)、诚实降级(stale/partial 回源)、advisory 边界(图是候选,不是结论)。

**跨切面决策(A1-A4,owner 确认):**

- **A1 Graphify = code-only**:宏观图用 `extract --code-only`(纯 AST、零 LLM key、可离线),合并图 = 各子仓 AST 图 union;**不含社区归纳/命名**(semantic 层 defer)。
- **A2 路由 = 注入宿主指令 + `projectPath`**:向宿主注入一段路由指令(按 cwd/子仓传 CodeGraph `projectPath`,跨仓用 Graphify 合并图),复用 CodeGraph 原生 projectPath,不自建 resolver。
- **A3 消费者 = 仅交互式 agent**:v1 只保证"图建好 + MCP/指令就位,交互式 agent 自动用",**不改 005 及其它 spec-first workflow**(留作后续 consumer)。
- **A4 宿主 = 全五宿主**(claude/codex/cursor/kiro/qoder,以 `getSupportedPlatforms()` 为准)。⚠️ **已知落差**:CodeGraph 原生 `install` 只覆盖 Claude/Cursor/Codex(+opencode/Hermes),**不含 Kiro/Qoder**;Graphify `install` 覆盖含 kiro。**owner 决策**:五宿主为基线(符合 `getSupportedPlatforms()` 不变量),routing 注入覆盖五宿主;但 **Kiro/Qoder 的 CodeGraph 默认走诚实降级**(Graphify 仍覆盖),**v1 不为无确认消费者建 spec-first CodeGraph adapter**,该 adapter 显式 defer / opt-in。

---

## 6. 已确认需求基线

> CR1-CR13 作为当前版本需求基线进入 plan;已按 owner 决策移除复用类需求。manifest schema、宿主 adapter / degraded 表达和自动化触发实现仍由 plan 阶段决定,不得反向扩大产品范围。

**A. 低摩擦批量 init(清单 + 自动发现)**

- CR1. "照清单批量 init":owner 给出需求文件夹内仓清单(命令参数或 manifest),一条命令为全部子仓备齐 MCP + 图,免逐仓。
- CR2. "自动发现补齐":扫需求文件夹发现清单外的子 Git 仓作为候选,保留一层轻确认防误收(vendor / build / 无关目录)。发现必须 **symlink-contained**:realpath 逃逸出 workspace 根的候选一律拒绝 / 标记,不随 symlink 收录仓外目录。
- CR3. init 对两种来源给出一致的批量结果与 per-repo 状态(ready / partial / failed + 原因)。

**B. workspace 双层图建立(per-需求 隔离)**

- CR4. 每个子仓建 CodeGraph 战术图 `工程N/.codegraph/`;`.codegraph/` 加入该子仓 `.git/info/exclude` 保持 git 干净;MCP server **全局 install 一次**,跨仓查询通过传 `projectPath` 命中对应子图(**不建 CodeGraph 父目录单体图**)。
- CR5. Graphify 每子仓子图 + 需求文件夹一张 `merge-graphs` 合并图,全部用 `--out`/`GRAPHIFY_OUT` 写到 `需求A/.graphify/` 下(**子仓物理零侵入**,不写机器级 global)。建图用 `extract --code-only`(纯 AST、零 LLM key);合并图 = 各子仓 AST 图 union,不含社区归纳/命名(A1)。
- CR6. 两层图与产物严格 scope 在当前需求文件夹内,不跨需求共享或串味。执行点:`projectPath` 解析须校验落在当前 workspace 根内(拒绝 / 告警指向他需求的 projectPath);跨 workspace query 为非目标。

**C. 自动刷新**

- CR7. CodeGraph:`serve --mcp` 默认 watcher,代码变更延迟 auto-sync,无需手动重建。
- CR8. Graphify:每个子 Git 仓装 git hook,commit 后刷新子图;自动化编排在子图变化后重新执行 `merge-graphs`,使 workspace 跨仓图收敛。plan 必须把实际触发、等待完成、失败报告与恢复方式写入实现合同和回归验收。
- CR9. 非 Git 变更或无 hook 的场景,用 Graphify `watch` 或显式 refresh 兜底,并如实标注 freshness。

**D. cwd-aware 查询路由**

- CR10. 从需求文件夹根进工具后,按 cwd / 显式 path 路由到对应子仓的战术图;跨仓问题用 workspace 宏观图。路由通过**向宿主注入指令 + CodeGraph `projectPath`** 实现,不自建 resolver(A2);是 **best-effort 指令引导、非确定性**:从子仓内启动或漏传 `projectPath` 时,兜底默认用所在子仓的 projectPath,doctor 应能检查 server root 有可用默认。
- CR11. 解析歧义(同名仓 / 嵌套 root)时询问 owner,不静默选仓。

**E. 诚实边界(继承 005/006/角色契约)**

- CR12. 图输出始终 advisory;partial / stale / unmapped 空结果无否定权,重要结论回源。
- CR13. workspace / parent 只拥有编排与图 artifact 权威,不获得子仓 Git / source mutation / finding / verification 权威。**唯一授权例外**:向子仓 `.git/info/exclude` 写入 `.codegraph/` 忽略行、及 `graphify hook install`——保持 git 干净 / 刷新所需的最小 Git-metadata 写入;写目标须经 realpath + containment 校验(拒 symlink 逃逸,复用 `assertContainedPath`),`clean` 只幂等移除 spec-first 自写的行 / 块,不碰用户内容。此例外不构成对子仓 source / finding / verification 的权威。

**当前版本明确不做(deferred):** 跨 workspace 图复用、内容寻址缓存、软链挂载、机器级 global graph。

---

## 7. 与 005 / 006 的关系(修订)

| | 005(consumer) | 006(producer / lifecycle) | 本场景调整 |
|---|---|---|---|
| 角色 | 消费图 | 生产 / 刷新图 | 不变 |
| workspace 形态 | 稳定 workspace | 稳定 workspace | **短命、按需求抛弃、per-需求 隔离** |
| 跨仓 workspace 图 | 假设可用 | 单独扫描源码建 serving graph + 重型 refresh 生命周期 | **改用 Graphify 原生 `merge-graphs`(per-需求),不自建 serving graph / ledger / journal** |
| 复用 | 未处理 | workspace-scoped 每次重建 | **当前版本不做复用,明确 deferred** |
| registry 确认仪式 | —— | 发现→确认(治理导向) | **减负为清单优先 + 自动发现轻确认** |

**结论已定:** 006 的重型生命周期(serving graph 扫描、freshness ledger、refresh journal、机器级图)对本场景过重;本场景使用已验证的轻量组合(CodeGraph per-child watcher + Graphify per-workspace `merge-graphs` + git hook / 自动化编排),复用整体 defer。006 保留为 vision 参考,不就地改写。

---

## 8. 明确不做 / 边界

- **不做跨 workspace 复用**(内容寻址缓存、软链、机器级 global graph)——owner 决策,明确 deferred。
- 不建 006 那套单独扫描源码的 serving graph 及 freshness ledger / refresh journal 重型生命周期;首版靠 Provider 原生 watcher + git hook + 轻量 `merge-graphs` 自动化编排。
- 不共享机器级 global graph;每个需求文件夹的图互相隔离。
- 不让 workspace 编排获得子仓 source / finding / merge 权威。
- 不做跨机器 / 远程托管图服务。
- **v1 消费者仅交互式 agent**:不改 005 / spec-work / spec-debug 等 workflow(A3),它们作为后续 consumer。
- **v1 不建 Graphify semantic/社区层**(code-only,A1);social/community 归纳 defer。

---

## 9. Plan 阶段关键技术决策

> 双图谱建立、查询和自动刷新链路已经 owner 验证,进入 plan 前不存在方案可行性 blocker。以下内容是 plan 需要固化的决策与回归合同。

1. ~~workspace 跨仓图产物形态 / 位置~~ **(已定)**:每子仓子图 + 需求根一张 `merge-graphs` 合并图,均 `--out` 写到 `需求A/.graphify/`(合并图如 `需求A/.graphify/merged-graph.json`),子仓零侵入。
2. ~~CodeGraph 战术图粒度~~ **(已定)**:per-child `工程N/.codegraph/` + `.git/info/exclude`(git 干净即可)+ 全局 MCP install + 跨仓 `projectPath`;不建父目录单体图。此即官方 README 推荐形态。
3. ~~建图时机~~ **(已定)**:init 时一次性 eager 建全部子仓 CodeGraph/Graphify 子图 + Graphify 合并图(非 lazy)。
4. ~~Graphify 子仓刷新到 workspace 合并图的自动收敛是否可行~~ **(已验证)**:子仓图变化后由自动化编排重新执行 `merge-graphs`;plan 负责明确触发、完成信号、失败隔离、恢复与回归证据,不再做 go/no-go spike。
5. **清单(manifest)格式?** 复用现有还是新增;是否值得 checkin 以复现需求环境。
6. ~~006 处置~~ **(已定)**:本文另起一份**独立 plan**;006 保留为 vision 参考,不就地改写。

**剩余产品 / 实现决策:** #5(manifest 格式与是否 checkin)、Kiro/Qoder 的 CodeGraph adapter / degraded 表达、A2 路由指令 writer。`CODEGRAPH_DIR` out-of-tree 仅为可选探索,不阻塞主路径。

---

## 10. 实现影响面(供 plan 参考,基于当前 source 盘点)

> advisory:进入 `spec-plan` 前对受影响面的盘点。**多为扩展而非从零**——多仓父 workspace 的 child 发现、非 git folder、per-project readiness 均已存在。注入点等细节需 plan 内核实到具体 writer。

### 10.1 Skills

| Skill | 改动程度 | 说明 |
|---|---|---|
| **`spec-mcp-setup`** | 主战场,大改 | `SKILL.md`、`scripts/setup.cjs`、`scripts/lib/project-target.cjs`(已有 child 发现,需扩展)、`scripts/lib/workspace-executor.cjs`、`scripts/providers/{codegraph,graphify,registry}.cjs`、`scripts/lib/facts.cjs`、`setup-registry.json` |
| **`using-spec-first`** | 可能轻改(可选) | 入口治理;补"从需求文件夹进来先 setup、按 `projectPath` 用图"的路由指引 |
| `spec-code-review`(005)/`spec-work`/`spec-debug` | **v1 不改**(A3) | 留作后续 consumer |

### 10.2 安装 / CLI 命令

| 命令 | 改动 |
|---|---|
| **`spec-mcp-setup`**(workflow 入口) | 从 `需求A/` 根批量建各子仓 CodeGraph + Graphify 子图 + Graphify 合并图、全局 `codegraph install`、写各子仓 `.git/info/exclude`、注入 A2 路由指令 |
| **`spec-first init`** | `commands/init.js` + `init-workspace.js`(**已有** `discoverChildGitRepos(maxDepth)` + `PARENT_ARTIFACT_AUTHORITY`);扩展为"建双层图 + 五宿主注入路由指令" |
| **`spec-first doctor`** | `commands/doctor.js`:分 child / workspace 报 readiness / freshness |
| **`spec-first clean`** | `commands/clean.js`:删 workspace 图产物 + CodeGraph daemon 清理 + 移除注入的 `.git/info/exclude` 条目 |
| **`spec-first update`** | `commands/update.js`:五宿主 projection 一致(`getSupportedPlatforms()`) |
| 原生被编排 | `codegraph install`(全局 MCP,**不覆盖 Kiro/Qoder** → adapter/降级)、`graphify extract/merge-graphs/hook install/watch` |

### 10.3 宿主注入面(A2 + A4 全五宿主)

- `src/cli/adapters/{claude,codex,cursor,kiro,qoder}.js` + `index.js`(`getSupportedPlatforms`)+ `platform-registry.js`:注入路由指令到各宿主 runtime;**Kiro/Qoder 的 CodeGraph 降级在此体现**。
- `src/cli/gitignore-policy.js`:`.codegraph/` / `.graphify/` 的 ignore/exclude 策略(已集中于此)。

### 10.4 已存在、可复用(降工作量)

- `project-target.cjs`:已有 `--all-repos` / `discoverChildRepos` / `non-git-folder` / `workspace-no-git-candidates`。
- `init-workspace.js`:已有 child git 发现 + parent authority 边界(`child_repo_canonical:false` 等)。
- `codegraph.cjs` / `graphify.cjs`:已有 per-project readiness/build/hook/refresh,metadata 已有 `requirement_workspace_path`(**Graphify 已接线**,CodeGraph 为 null)。

### 10.5 待 plan 核实

- **A2 路由指令的具体 writer / 位置**:复用现有 graph 消费指令管理块(可能由 `graphify`/`codegraph` 原生 installer 写宿主入口),还是 spec-first adapter 新增 managed block?grep 显示 graphify/codegraph 提及集中在 `gitignore-policy.js` 与 `adapters/codex.js`,需核实到具体 writer。

---

## 11. 下一步

1. **形态已收敛**(见 §3-§6,owner 决策全部落定):
   - CodeGraph:per-child `工程N/.codegraph/` + `.git/info/exclude` + 全局 MCP install 一次 + 跨仓 `projectPath`;
   - Graphify:per-child 子图 + `需求A/.graphify/` 合并图(out-of-tree,子仓零侵入);
   - init 一次性 eager 建全部子仓图 + 合并图;
   - 刷新:CodeGraph watcher + Graphify 子仓 git hook + workspace `merge-graphs` 自动化编排 + 非 git `watch`/显式;
   - per-需求 隔离、当前版本不复用。
2. **走 `spec-plan` 另起独立 plan**(006 留作 vision,不改写),plan 内承载:
   - 把已验证的全量 eager 建图、`projectPath` 路由、CodeGraph watcher、Graphify 子图刷新与 workspace `merge-graphs` 收敛固化为可重复回归验收;
   - 确定 manifest schema、写入位置、是否 checkin 及其 freshness / drift 语义;
   - 明确批量 init、doctor、clean、失败隔离和恢复合同;
   - 明确五宿主 projection,以及 Kiro/Qoder 的 adapter / degraded 行为;
   - 可选评估 `CODEGRAPH_DIR` out-of-tree,但不得阻塞已验证主路径;
   - 新 plan 定稿后给 006 打 `superseded-for-this-scenario` / vision-only 标记,避免两套生命周期心智模型并存。
3. 复杂度已因 per-需求 隔离 + 不复用大幅下降,plan 规模应远小于 006。
