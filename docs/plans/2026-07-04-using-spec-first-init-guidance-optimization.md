# using-spec-first Skill 与 spec-first init 引导内容优化方案（第五修订版 · doc-review 修正）

> 生成时间：2026-07-04 22:22
> 初次纠正：2026-07-04
> 二次修订：2026-07-04 23:44
> 压缩复审：2026-07-04 23:58
> 钢板复审：2026-07-04
> 评审修正：2026-07-05（基于 `/spec:doc-review` 五 persona 评审，逐条落地）
> 主题：`using-spec-first` skill 的路由边界，以及 `spec-first init` 写入 `CLAUDE.md` / `AGENTS.md` 的常驻引导内容
> 目标项目：`spec-first`
> 外部参考：https://mp.weixin.qq.com/s/H8cggLR2TbQ_gkyJ2xSR7Q
> 公开原文参考：https://research.perplexity.ai/articles/designing-refining-and-maintaining-agent-skills-at-perplexity
> 真相源：`skills/using-spec-first/SKILL.md`、`skills/using-spec-first/references/*.md`、`src/cli/commands/init.js`、`src/cli/instruction-bootstrap.js`、`tests/unit/instruction-bootstrap.test.js`、`tests/unit/using-spec-first-contracts.test.js`

---

## 评审修正摘要（第五版做了什么）

第四版（钢板复审）的方向成立，但一次 doc-review 发现它建立在**错误的当前状态基线**上，并因此系统性低估了改动破坏面。第五版逐条修正：

- **P0 基线更正**：当前 bootstrap 不是「5 条」，`buildZhBootstrapBody` 实际产出 **14 条 bullet**（Codex 16 条、Qoder 14 条；均已用本节实测命令确认）。「压到 4 条」实为 **~14→4 删除**，而非修剪 1 条。全文以 14 条为基线。
- **P0 保留准则**：新增「不路由那一轮也要生效」判定，对 14 条逐条做 keep / sink / drop，得出候选 L0 keep 集约 **10–11 条**（待 Step 0 baseline 验证），而非硬定 4 条。
- **P0 测试迁移**：完整枚举 `instruction-bootstrap.test.js` 断言（含行数下界、byte-exact 生成器耦合、codex 专测），不再只点名 `CURATED_CORE`。
- **P1 度量前置**：增加压缩前后 routing/governance baseline 作为 Step 0 硬验收 gate。
- **P1 性质更正**：`CLAUDE.md` / `AGENTS.md` 是 checked-in host 入口文档 / 受生成规则管理的 source slice，**不是** `.claude/` 那类 runtime mirror；补「同提交必须重生成」硬 gate。
- **P2 精度修正**：description 改写会破坏逐字契约测试；Codex `spawn_agent` 是「幻影删除」（本就不在 Claude block）；references/evals 已存在（应「扩展」而非「新增」）。

---

## 0. 第五次结论

这份优化方案的核心方向依然成立：区分 `using-spec-first` 的入口治理职责与 `spec-first init` 的 runtime 投射职责，并按 progressive disclosure 维护 L0/L1/L2/L3 分层、防止常驻块退化。

但方向成立不等于可以按原落地顺序直接实施。评审确证的三点必须先修：

1. **基线错误使整份风险评估失真。** 方案把改动描述为「从上一版 5 条继续压到 4 条」（修剪 1 条），但常驻块实际是 14 条。真实动作是删除约 10 条各自被测试断言、被 SKILL contract 覆盖、有真实行为权重的治理条目。以错误基线推导出的「最小可维护路径」不可信。

2. **「4 条」目标不可达，且部分下沉会造成静默回归。** 常驻块存在的意义正是防止「某一轮模型判为轻量、不触发 `using-spec-first`」这一失败模式。被下沉到 SKILL/references 的治理，恰恰在「不路由的那一轮」整轮缺席——而那正是它要挡的场景。按「不路由那轮是否复现失败」逐条判定后，候选 L0 keep 集约 10–11 条，最终数字需由 Step 0 baseline 验证。

3. **压缩是改默认 agent 行为，必须有成功度量。** 方案全部验收只检查「内容被删除」，无一度量压缩后路由/治理是否仍成立。没有 before/after 信号，无法区分「成功压缩」与「静默回归」。

一句话判断（修正版）：

> 最值得做的仍是把已有分层压实，但顺序要倒过来：**先用 baseline 验证当前 bootstrap 的问题、收益和可删边界，再按「不路由那轮是否失效」准则逐条判定 14 条的去留，把可安全下沉的（入口枚举、长路径列表）下沉，同时同步重写全套测试守护**；不要以错误基线追求一个不可达的「4 条」数字。

---

## 1. 原始心智模型的纠正

原始文档把 skill 名写成 `use-spec-first`，正确名称是 **`using-spec-first`**。更重要的是，原始文档把两个职责混在一起：

| 角色 | 真实身份 | 职责 | 是否写文件 |
|---|---|---|---|
| `using-spec-first` | 独立 meta skill / 入口治理器 | 判断当前请求是否进入公开 `/spec:*` / `$spec-*` workflow，或给出 next-step 建议 | 否，不产 artifact |
| `spec-first init` | CLI 命令 | 从 source 生成 host runtime assets，并写入 / 更新 `CLAUDE.md` / `AGENTS.md` managed block | 是 |

所以：

- 讨论「路由触发、何时不触发、workflow admission」时，对象是 `using-spec-first`。
- 讨论「init 阶段写入常驻文件、生成 runtime mirror、修复 host 指引」时，对象是 `spec-first init`。
- 不存在也不应存在 `using-spec-first init` / `using-spec-first audit` / `using-spec-first upgrade`。

这一点与 `skills/using-spec-first/SKILL.md` 的 contract 一致：它是 entry governor，不是 command-backed workflow，也不创建 plan、task、review、setup、runtime 或 durable knowledge artifact。

---

## 2. 微信文章给这次优化的真实启发（含前提适用性修正）

微信文章解读的 Perplexity skill 设计经验，三个底层判断：

1. **Every Skill is a Tax**：每个 skill 的索引信息都会征收上下文税。
2. **description 是路由器，不是说明书**：它只应帮助模型判断何时加载 skill，不应解释完整功能。
3. **按需加载比继续压缩更重要**：规模上来后，关键不是让每个 skill 更小，而是减少同时可见的 skill 与规则。

**前提适用性修正（评审 P1-3）。** 这三条原语境是 500+ skill：其「税」指**大量 skill description 同时争夺路由注意力**，减负手段是**减少同时可见的 skill 数量**。而 bootstrap 是**单一、设计上就要每轮在场**的 host instruction，不是众多竞争 skill 之一。把「减少同时可见项」的结论直接迁移成「缩短单一常驻块」，是前提错配。因此：

- 「description 是路由器」→ 适用，指导 §4.2 的 description 收紧。
- 「减少同时可见的 skill/规则」→ 适用于 skill 层，**不直接等价于**「删 bootstrap 条目」。
- bootstrap 该保留哪些条目，判据不是「文章说要短」，而是下面这条更严的准入准则。

判断一行是否应常驻 L0（准入准则）：

> 没有这一行、且当前这一轮模型**没有触发 `using-spec-first`**（判为轻量、直接答）时，模型是否会高概率做错路由、越过写入边界、误改 / 误读 generated runtime、越过语言策略，或把 CLI runtime 维护当成 workflow？

关键在于后半句「没有触发 SKILL 的那一轮」：下沉到 SKILL/references 的规则只有在 SKILL 被加载时才在场；而最危险的恰恰是模型**判为不需要路由**的那一轮——SKILL 不会加载，被下沉的治理整轮缺席。凡「失败可在不路由轮静默发生」的条目，必须留在 L0。

**度量前置（评审 P1-1）。** 方案反复称当前结构「已经天然接近文章里的分层」「已符合 progressive disclosure」「已实现短锚点」，同时又称它膨胀到需要 14→4——这两个判断不能同时为真而无证据。在压缩前，应先有一组固定 case 的 routing/governance baseline（见 §6 Step 0），验证当前块是否确实造成误路由或可测的 token 压力；否则本次压缩收益只是理论上的，而删除治理的风险是真实且难逆转的。

映射到 `spec-first` 的分层（方向不变）：

```text
L0：CLAUDE.md / AGENTS.md bootstrap block
  - 入口治理的不可丢边界（按上面的准入准则筛选）
  - 只保留「不路由那一轮也必须在场」的 admission / boundary
  - 可下沉：完整入口枚举、generated mirror 全路径长列表、dispatch 细则、guide mode 细则

L1：skills/using-spec-first/SKILL.md
  - 完整 Route Map、routing priority、host / dispatch / source-runtime 边界

L2：skills/using-spec-first/references/*.md
  - scope guards、dispatch boundaries、guide mode、routing red flags、maintenance / fresh-source eval

L3：evals / docs / solutions
  - 回归样例、历史经验、durable knowledge
```

正确优化方向是维护这个分层，而不是把规则迁到 `.spec-first/`，也不是给 `using-spec-first` 增加伪 CLI 子命令，更不是以错误基线硬凑「4 条」。

---

## 3. 现状核对（已用源码实测更正）

### 3.1 已实现：managed block

`CLAUDE.md` / `AGENTS.md` 已使用 managed block：

```md
<!-- spec-first:lang:start -->
... 语言与治理策略 ...
<!-- spec-first:lang:end -->

<!-- spec-first:bootstrap:start -->
... 入口治理 block ...
<!-- spec-first:bootstrap:end -->
```

`spec-first init` 通过 `src/cli/commands/init.js` 的 init plan 写入 instruction file，并由 `src/cli/instruction-bootstrap.js` 的 `buildBootstrapBlock` 生成 bootstrap block。常驻引导是 CLI init 的 runtime 投射职责，不是 `using-spec-first` skill 的职责。

### 3.2 当前实际规模：14 条，不是「短锚点」也不是「5 条」（评审 P0-1 / P2-3）

第四版称「已实现：短锚点」，与 §4「仍偏长需钢板压缩」自相矛盾。用源码实测消除这个矛盾——`buildBootstrapBlock` 当前实际产出：

| host | 语言 | bullet 数 | 总行数 |
|---|---|---:|---:|
| claude | zh | 14 | 19 |
| codex | zh | 16 | 20 |
| qoder | zh | 14 | 19 |

en 变体同构。实测命令如下：

```bash
node - <<'NODE'
const { buildBootstrapBlock } = require('./src/cli/instruction-bootstrap');
for (const host of ['claude', 'codex', 'qoder']) {
  for (const lang of ['zh', 'en']) {
    const block = buildBootstrapBlock(host, lang);
    const lines = block.split('\n');
    const bullets = lines.filter((line) => line.startsWith('- ')).length;
    console.log(`${host} ${lang}: bullets=${bullets} lines=${lines.length}`);
  }
}
NODE
```

Claude zh 的 14 条依次是：①最小锚点 / 指向 SKILL ②何时进入 workflow ③何时直接做 ④何时不重新分流 ⑤如何路由 ⑥常见入口锚点（枚举 12 个 `/spec:` 入口）⑦外部 issue/PR 输入 ⑧语言策略指针 ⑨父级多仓 `target_repo` ⑩Runtime-context 排除（generated mirror 长路径列表）⑪角色契约读取指针 ⑫反合理化红旗 ⑬host 入口行 ⑭surface / internal-only 行。Codex 在此基础上多 2 条（startup-reminder、spawn_agent 授权）。

结论：当前既不是「短锚点」，也不是「5 条」。§4 的「压缩」必须以 14 条为基线，且要逐条决定去留。

### 3.3 当前测试守护范围（远超「三类」，评审 P0-3 前置）

`tests/unit/instruction-bootstrap.test.js` 的守护远不止「三类」。逐项枚举见 §4.4。此处先确立一个事实：现有守护同时**强制多条治理在场**、**逐字断言长路径列表**、**断言行数上下界**、并做 **checked-in 文件与生成器逐字节比对**。任何压缩都必须同步重写这一整套，而不是只改 `CURATED_CORE`。

### 3.4 不应做：`.spec-first/` 规范目录

`.spec-first/` 是 runtime / workspace / workflow artifact 目录，不是用户可读规范目录，且默认被 context governance 排除。

不要在 `.spec-first/` 下创建 `INDEX.md`、`runbooks/`、`templates/`、`progress.md` 或入口治理说明。source 应继续放在 `skills/`、`agents/`、`templates/`、`src/cli/`、`docs/`。

---

## 4. 修订后的开放优化点

### 4.1 P0：以 14 条为基线，按准入准则逐条判定（取代原「压到 4 条」）

原「从 5 条压到 4 条」作废。正确做法是对当前 14 条逐条应用 §2 的准入准则（「不路由那一轮是否失效」），得出 keep / sink / drop：

| # | 当前条目 | 判定 | 依据 |
|---|---|---|---|
| ① | 最小锚点 / 指向 SKILL | **keep** | L0 索引指针本身 |
| ② | 何时进入 workflow | **keep** | 入口治理核心，不路由轮即失效 |
| ③ | 何时直接做（轻量 / 小改动纪律） | **keep** | 防过度路由（R2 哲学），且承载 CHANGELOG / 最窄验证 / source-runtime 小改动纪律 |
| ④ | 何时不重新分流 | **keep** | 防 nested workflow / 重复 brainstorm（方案自己认定必留） |
| ⑤ | 如何路由（意图优先 / 不默认 brainstorm / 不串联） | **keep** | 方案自己认定必留 |
| ⑥ | 常见入口锚点（12 入口枚举） | **sink** | 可下沉为「完整 map 查 SKILL」指针（需同步改 `CURATED_CORE` 测试，见 §4.4） |
| ⑦ | 外部 issue/PR 输入 | **keep** | 不路由轮会造专用 workflow / tracker mutation；近期专门加入，有 SKILL contract + R-08 测试 |
| ⑧ | 语言策略指针 | **keep（precedence reminder）** | 完整策略在独立 `spec-first:lang` block；此处保留的是「会话惯性不得覆盖语言策略」这一 precedence，不路由轮语言易越界 |
| ⑨ | 父级多仓 `target_repo` | **keep** | mutation 边界，不路由轮误写子仓 |
| ⑩ | Runtime-context 排除 | **keep 读排除语义 / sink 长路径列表** | 「默认不读 generated mirror」必留（否则整轮扫 mirror，反增 per-session 上下文，违背压缩目标）；具体路径长列表可下沉到 context-governance |
| ⑪ | 角色契约读取指针 | **sink（可选）** | 「架构判断前读角色契约」本身是按需触发，可下沉；保留与否列为作者裁决点 |
| ⑫ | 反合理化红旗 | **keep（语义）** | 作用是在 SKILL 加载前阻止 agent 合理化掉路由；下沉即自毁（product-lens 强调） |
| ⑬ | host 入口行 | **keep** | host-specific 语法（`/spec:*` vs `$spec-*`） |
| ⑭ | surface / internal-only 行 | **keep** | 防暴露 internal-only skill（如 `git-worktree`） |

净结果：真正可安全 sink 的是 ⑥（入口枚举→指针）、⑩ 的长路径列表、⑪（可选）。**候选 L0 keep 集约 10–11 条，待 Step 0 baseline 验证**，不是 4 条。方案的核心洞察（把入口枚举与长路径列表移出常驻块）仍成立，只是「4 条」这个数字是错的。

下沉关系（更正版）：

| 从 bootstrap 下沉的内容 | 推荐位置 |
|---|---|
| 完整入口枚举（⑥ 保留指针） | `skills/using-spec-first/SKILL.md` Route Map |
| generated mirrors 全路径列表（⑩ 保留读排除语义） | context-governance contract、source/runtime boundary 文档 |
| 角色契约读取指针（⑪，若下沉） | 架构 / prompt / contract 判断时按需读取 |
| CLI 维护命令细节 | CLI help、setup/update 文档、`spec-mcp-setup` |

**Codex `spawn_agent` 的准确处理（评审 P2-2）。** 原文称「这一版刻意不写 Codex spawn_agent 边界」，暗示从当前讨论的 Claude block 删除它。事实：`spawn_agent` 授权 prose 只在 `hostId==='codex'` 分支内联（`instruction-bootstrap.js:147-151`），**从未出现在 Claude block**。这不是「删除」，而是本就不在。正确表述应是：Codex 变体的 spawn_agent / startup-reminder 两条是 codex-only；若要将其移出 codex bootstrap，需同步改 codex 专测（见 §4.4），而不是把它当作 Claude block 的删除项。

**多变体处理（评审 P1-4）。** 生成器实际产出 zh+en × claude/codex/qoder 共 6 变体。任何 L0 判定都必须对 6 变体给出一致决定，而不是只提供一个 zh-claude 草稿。dual-host alignment 测试（`instruction-bootstrap.test.js:604-619`）会强制三端核心语义对齐。

### 4.2 P1：微调 `using-spec-first` description（含契约测试耦合，评审 P2-1）

当前 description（`SKILL.md:3`，与第四版引用逐字一致）：

```text
Use before substantial work in a spec-first project, and when users ask what spec-first workflow or command to run next. Decide whether to route into a public spec-first workflow before non-trivial or risky edits, running state-changing commands, debugging, reviewing, planning, setup, update, or architecture/prompt/workflow decisions.
```

问题是排除信号弱。建议方向：

```text
Use before substantial work in a spec-first repo or when the user asks which spec-first workflow/command to run next. Route non-trivial edits, state-changing commands, debugging, review, planning, setup/update, optimization, and architecture/prompt/workflow/contract decisions. Do not use for lightweight factual answers, current-context explanations, narrow lookups, user-supplied single-document summaries, or clearly scoped low-risk small edits.
```

**落地硬耦合（必须同步，否则测试失败）：**

- `tests/unit/using-spec-first-contracts.test.js:74` **逐字**断言子串 `what spec-first workflow or command to run next`。建议描述把它改成 `which spec-first workflow/command to run next`，会使该子串消失、测试失败。
- 该子串在 skill 包内仅出现在 frontmatter description；`SKILL.md:19` 的「When to use」表行含反引号版本（`what \`spec-first\` workflow or command to run next`），不构成连续匹配，但它是 description 的**并行副本**，改 description 时应同步。

二选一：**(a)** 保留 `what spec-first workflow or command to run next` 原措辞（只补强排除句，不动这半句），不破坏 `:74` 断言；**(b)** 改写的同时同步更新 `:74` 断言与 `SKILL.md:19` 表行。推荐 (a)：排除信号补强即可达成目标，无需触碰逐字契约。

边界仍是「不排除具体 review」：

| 场景 | 是否应触发 |
|---|---:|
| "review 这个 PR diff 的风险和测试缺口" | 是，路由到 code review |
| "review 这份 plan 是否可执行" | 是，路由到 doc review |
| "看一下当前对话里的文字有没有错别字" | 否，直接答 |
| "总结我刚贴的单篇文章" | 否，直接答 |
| "这个函数在哪里被用到" | 否，bounded read / 直接定位 |
| "改一个明确低风险错别字" | 通常否，直接小改但遵守 changelog / verification |

### 4.3 P1：扩展（不是新增）guide / lightweight eval（评审 P2-4）

`User Next-Step Guide Mode` 已存在（`references/user-next-step-guide-mode.md`），相关 eval 文件也已存在：`evals/routing-cases.json`、`evals/routing-discipline-cases.json`。因此本节是**扩展现有 eval**，不是新增文件。

建议加强的 case（写入已存在的 `routing-cases.json` / `routing-discipline-cases.json`）：

| 用户表达 | 期望 |
|---|---|
| "我不知道下一步该跑哪个 spec workflow" | 输出一个推荐入口、一个理由、一个动作 |
| "init 完了，接下来做什么？" | 根据 setup / first-task 场景给单一下一步 |
| "这个需求还没想清，应该 plan 还是 brainstorm？" | 推荐 definition route，不直接进入 work |
| "我只是想知道这个文档该怎么处理" | guide-only，不创建 review artifact |
| 当前上下文解释 / 用户单文档摘要 | 不触发 workflow（lightweight skip 回归） |

这能提高可发现性，同时不增加常驻上下文税。

### 4.4 P0：完整枚举并重写 bootstrap 测试守护（取代原「只迁移 CURATED_CORE」）

按 §4.1 压缩后，`tests/unit/instruction-bootstrap.test.js` 会**大面积失败**。必须先完整枚举现有断言，再逐条决定，而不是只改 `CURATED_CORE`。现有守护清单（源码行号）：

| 断言 | 位置 | 压缩后处理 |
|---|---|---|
| `CURATED_CORE` 12 identifier 必须在 block | 559-561, 584-587 | ⑥ 下沉后需**删除/重写**：改为「入口枚举不常驻，identifier 集合可为 0」 |
| 四段核心语义在场 | 59-63, 482-505 | keep（②③⑤保留） |
| 外部 issue/PR 段在场 | 64-67, 488, 611 | keep（⑦保留） |
| 反合理化红旗在场 | 68, 489, 611 | keep（⑫保留语义） |
| 语言策略行 | 75-76 | keep（⑧保留 precedence） |
| Runtime-context 长路径列表**逐字** | 80-82, 133-135 | ⑩ 长路径下沉后需**改**为「读排除语义在场、路径列表不再逐字断言」 |
| 角色契约路径 | 83 | 若 ⑪ 下沉则**删**，否则 keep |
| 行数上下界 `>8 且 <26`（codex `>10 且 <28`） | 56-57, 436-437, 448-449 | **必须重设下界**：纯 4-bullet 约 6–8 行会跌破下界；即使压到 10–11 条也需复核 |
| dual-host alignment segmentProbes | 604-619 | keep（6 变体核心语义对齐） |
| R-10 load-bearing red flags | 627-648 | keep（vague→brainstorm/plan、run-init→route first 语义必留） |
| checked-in CLAUDE.md/AGENTS.md 与生成器**逐字节相等** | 401-415 | keep，且触发 §6 Step 0 的同提交重生成硬 gate |
| codex 专测：codex 必须含 spawn_agent/startup-reminder，claude/qoder 必须不含 | 417-456 | 若移出 codex spawn_agent 则需**改** codex 专测 |

**依赖倒置更正（评审 scope S4）。** 压缩（原 §4.1/Step 0）一旦落地，`CURATED_CORE` 与行数下界测试**立即变红**。因此原被标为 P2/Step 3 的「drift 分类重写」实际是 Step 0 变绿的**前置依赖**，不是可延后项。测试重写必须与生成器改动在同一步、同一提交完成。

新守护目标（压缩后）：

- bootstrap 不承载完整入口枚举（⑥ identifier 集合为 0 或仅剩指针）；
- 保留的 L0 语义（②③④⑤⑦⑧⑨⑩读排除⑫⑬⑭）逐条仍在；
- 行数下界按新常驻集重设，仍有上界防再膨胀；
- checked-in 文件与生成器逐字节一致仍守护；
- Route Map / non-core workflow command 的 drift 守护保留在 SKILL / governance registry / routing eval 层。

不建议新增独立 audit 子命令，这个风险仍由 contract/unit tests 处理。

### 4.5 P3：轻量 prose/token 审查清单（并入现有文档，评审 scope S5）

文章的 token 经济学可沉淀为一个审查清单，但方案目标是「压实已有分层、不新增结构」，因此该清单应**并入现有 skill-authoring 文档**（如 `docs/` 下的 skill 编写指引或 `references/maintenance-and-fresh-source-eval.md`），而不是单独设立一套新流程。

新增或审查 skill 时问四个问题：

1. frontmatter description 是否只负责触发与排除？
2. SKILL.md 主体是否只保留运行时高频 invariant？
3. 低频细则是否下沉到 `references/`？
4. eval 是否覆盖误触发、漏触发、轻量请求不触发？

### 4.6 P1：定义成功（新增，评审 P1-1）

压缩改的是默认 agent 路由/治理行为，必须能区分「成功」与「静默回归」。在 Step 0 之前建立一组固定 case 的 routing/governance baseline：

- route vs direct 判定正确率（含轻量请求不误触发）；
- correct-repo（多仓 target_repo）不误写；
- generated mirror 读排除是否仍生效；
- 语言 precedence（会话惯性不覆盖语言策略）是否仍生效；
- 外部 issue/PR 不造专用 workflow。

最小 baseline 契约：

| 项 | 要求 |
|---|---|
| case 来源 | 复用 `skills/using-spec-first/evals/routing-cases.json`、`routing-discipline-cases.json`，并补 5 类 governance case：多仓写入、generated mirror 路径误读、语言策略覆盖、外部 issue/PR、轻量请求 direct |
| 运行方式 | fresh-source eval：把当前 `CLAUDE.md` / `AGENTS.md` bootstrap、`skills/using-spec-first/SKILL.md` 和相关 eval case 注入全新评估上下文，逐 case 输出 expected / actual / evidence |
| 产物 | 建议写入 `docs/validation/2026-07-05-using-spec-first-bootstrap-baseline.md`，至少包含输入版本、case 表、通过/失败、压缩前后 bullet/line/char 统计和最终 go/no-go |
| 通过阈值 | P0/P1 governance case 必须 100% 符合预期；P2 lightweight/guide case 不得新增误触发；不得出现 generated mirror 默认读取、缺 `target_repo` 写入、语言策略越界或 issue/PR 专用 workflow |
| token/体积口径 | 不声称精确 token 省幅；用 bullet/line/char 作为 deterministic proxy，记录压缩收益是否足以抵消治理风险 |

以 fresh-source eval 跑压缩前 baseline，压缩后必须保持该 baseline——作为 Step 0 硬验收 gate。

---

## 5. 明确不做

- 不给 `using-spec-first` 增加 `init` / `audit` / `upgrade` 子命令；
- 不在 `.spec-first/` 下创建用户规范目录；
- 不把完整 Route Map、guide mode 细则、dispatch 细则、CLI 维护命令枚举写进 `CLAUDE.md` / `AGENTS.md`；
- 不引入新的 `project-rules.md` / `progress.md` 常驻状态体系；
- 不把文章里的 `exclude_intents` 字段机械照搬到 frontmatter，除非当前 host/runtime 明确消费该字段；
- 不做 500+ skill 规模才需要的语义向量路由引擎；
- **（新增）不以错误基线追求「4 条」这类数字目标**；条目去留由「不路由那轮是否失效」准则推导。
- **（新增）不在没有 routing/governance baseline 的情况下改默认 agent 行为**；无度量的压缩无法证伪。

---

## 6. 推荐落地顺序（评审修正）

> 顺序调整：度量与测试重写前置，压缩与测试重写同提交，不再把测试迁移拆到最后。

### Step 0：建立 baseline 并验证当前块的问题（新前置）

目标：在改任何 source 前，先验证当前 bootstrap 是否确有需要压缩的问题，并锁定成功判据。

范围：

- 按 §4.6 的最小 baseline 契约产出可复跑 artifact；
- 记录当前 bootstrap 的 bullet/line/char 体积和候选压缩后的 proxy 体积；
- 若 baseline 不能支持安全删除、或压缩收益不足以抵消治理风险，则**暂缓压缩**，只做 §4.2 description 与 §4.3 eval 扩展。

验收：

- 有一份可复跑的 baseline artifact；
- 每个 P0/P1 governance case 有 expected / actual / evidence；
- 有压缩前后 bullet/line/char proxy；
- 有明确 go/no-go 结论和「压缩后必须保持」的成功判据。

### Step 1：逐条判定 + 压缩 + 测试重写（同提交）

目标：按 §4.1 的 keep/sink/drop 表压缩，同时重写 §4.4 全套测试守护。

范围：

- `src/cli/instruction-bootstrap.js`（6 变体一致处理）；
- `tests/unit/instruction-bootstrap.test.js`（完整重写，含行数下界、identifier、路径列表、codex 专测）；
- 通过 `spec-first init` 重生成 checked-in `CLAUDE.md` / `AGENTS.md`。

**硬 gate（评审 P1-2）：** `CLAUDE.md` / `AGENTS.md` 是 checked-in host 入口文档 / 受生成规则管理的 source slice，**不是** `.claude/` 那类 runtime mirror。生成器改动后**必须在同一提交**用 `spec-first init` 重生成这两个文件，否则 `instruction-bootstrap.test.js:401-415` 的逐字节比对失败。

验收：

- bootstrap 保留经 Step 0 baseline 确认的 keep 集（候选约 10–11 条），入口枚举与长路径列表已下沉；
- 全套测试守护重写通过，行数下界已按新常驻集重设；
- checked-in 文件与生成器逐字节一致；
- Step 0 baseline 保持不回归。

### Step 2：改 description（同步契约测试）

目标：降低误触发，不破坏逐字契约。

范围：

- `skills/using-spec-first/SKILL.md` frontmatter；
- 若采用改写而非补强，则同步 `using-spec-first-contracts.test.js:74` 与 `SKILL.md:19` 表行。

验收：

- 补强 lightweight/narrow-lookup/single-document 排除；
- 不排除具体 code/doc/PR review；
- `using-spec-first-contracts.test.js` 通过。

### Step 3：扩展 lightweight 与 guide mode eval

目标：让误触发/漏触发可回归。

范围：

- `skills/using-spec-first/evals/routing-cases.json`（已存在，扩展）；
- `skills/using-spec-first/evals/routing-discipline-cases.json`（已存在，扩展）。

验收：

- 当前上下文解释 / 用户单文档摘要不触发 workflow；
- "不知道下一步" 触发 guide mode；
- 具体 review 仍路由到 code/doc review；
- `$spec-doc-review` 在 Codex 中仍不自动授权 `spawn_agent`。

---

## 7. 最终定位（修正）

```text
using-spec-first skill
  = 纯入口治理器
  = 判断是否进入公开 spec-first workflow，或给出 next-step 建议
  = 不写文件、不产 artifact、无子命令

spec-first init
  = CLI runtime 投射命令
  = 从 source 生成 host runtime assets
  = 写入 / 更新 CLAUDE.md / AGENTS.md 的 managed block

CLAUDE.md / AGENTS.md bootstrap
  = L0 入口治理不变量（当前实测 14 条；候选 keep 集约 10–11 条，待 Step 0 baseline 验证，非 4 条）
  = 只放「不路由那一轮也必须在场」的边界
  = 可下沉：完整入口枚举、generated mirror 全路径列表、dispatch/guide 细则
  = CLAUDE.md/AGENTS.md 是 checked-in source slice，改生成器须同提交重生成

skills/using-spec-first/SKILL.md
  = L1 完整路由表

references/*.md
  = L2 按需细则

evals/*.json
  = 路由回归与误触发防线
```

最终建议（修正版）：

> 这份优化不应变成「给入口治理器再造一个入口治理系统」，也不应以错误基线追求一个不可达的数字。最小可维护路径是：**先用 baseline 验证当前块的问题、收益和可删边界并锁定成功判据；再按「不路由那轮是否失效」逐条判定 14 条，把可安全下沉的（入口枚举、长路径列表）下沉；压缩与全套测试重写同提交完成，并同提交重生成 checked-in 文件；最后补强 description 与 guide/lightweight eval。** 保留的是治理，不是数字。

---

## 附录：评审 provenance（证据锚点）

本第五版的修正来自会话内 `/spec:doc-review` 评审，**非独立持久化 review artifact**。诚实标注如下，供后续核验：

- **评审方式**：`/spec:doc-review` 交互模式，Claude Code host，五 persona 有界并行 dispatch（会话内 subagent，无独立 artifact 文件）。
- **persona 名单**：`spec-coherence-reviewer`、`spec-feasibility-reviewer`、`spec-scope-guardian-reviewer`、`spec-adversarial-document-reviewer`、`spec-product-lens-reviewer`。其中 feasibility 与 scope-guardian 首次因模型访问错误失败，经 `model: opus` 重试成功，5/5 覆盖完成。
- **findings 计数**：合并去重后 P0×3、P1×4、P2×4、FYI×3；剔除 false positive×2（「缺 4-bullet 文本」实已提供、「description 已匹配」误读引用）。
- **codebase 证据**：所有源码声明（14/16/14 条 bullet、测试断言范围、byte-exact 生成器耦合、`spawn_agent` codex-only、references/evals 已存在、`tests/unit/using-spec-first-contracts.test.js:74` 逐字断言 `what spec-first workflow or command to run next`）均直读 `spec-first` 源码确证（confirmed tier）。
- **第二轮复审**：本附录、§4.6 baseline 契约、§4.1/§7 候选数字降级、根目录 `CHANGELOG.md` 同步，以及本目录与文件从 `use-spec-first-init*` 更名为 `using-spec-first-init-guidance-optimization`（修正被 §1 纠正过的错误名 use→using），来自对第五版初稿的再一次复审（2026-07-05）。
- **限制**：评审为会话内产物，findings 的持久锚点是本文档的「评审修正摘要」与 §4 各节 `评审 Px` 标注；如需独立 artifact，应在实施时运行 `/spec:compound` 或将 findings 导出到 `docs/validation/`。

> 说明：本节将「五 persona 评审」这一 provenance claim 落到可核验锚点（persona 名单、findings 计数、源码证据、限制），而非不可验证的权威背书。
