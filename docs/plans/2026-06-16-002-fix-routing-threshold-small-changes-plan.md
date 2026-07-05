---
spec_id: 2026-06-16-002-fix-routing-threshold-small-changes
title: "fix: 给入口治理 substantial 阈值加规模下限，让明确的小改动留在直接执行侧"
status: completed
plan_depth: standard
plan_type: fix
created: 2026-06-16
target_repo: spec-first (current repo)
---

# fix: 给入口治理 substantial 阈值加规模下限，让明确的小改动留在直接执行侧

## Summary

用户反馈两点：(1) 一个"加两行代码"的明确小改动会被路由进 `spec-work`，跑一大堆东西；(2) 整体侵入性比以前高，简单修改也烧大量 token，1M 上下文很快被压缩。

经源码核对，真因是**入口治理的 substantial 阈值无规模下限**：多处治理措辞把"modifying code, docs, config"无条件列为 substantial，而对应的"非 substantial"清单全是"回答/解释/查询"类——**"明确的、低风险的小代码改动"在分类里无家可归，只能被归入 substantial → 触发公开 workflow（`/work` 等）→ token 暴涨**。

**关键（经第二轮多视角审查纠正）：这套措辞分布在两类注入面，权威与时机不同，必须都改，否则计划对用户的真实场景失效：**

- **Always-present（每会话全文加载，权威最高，是默认决策的实际驱动）**：
  - `CLAUDE.md:145-149` / `AGENTS.md` 对应段——**手写、非 managed** 的 `## Workflow 入口治理`，§149 明写"本仓库的具体实现或 prose 修改通常走 work workflow"。`spec-first init` **不碰**此段。
  - `CLAUDE.md:151-159` 任务分级——定义"小任务=单文件局部修复"却**未给直接执行出口**，与本计划诊断的 SKILL gap 同形。
  - bootstrap managed block（`instruction-bootstrap.js` 生成）的"进入 workflow"触发句。
  - SessionStart hook 注入的指针文案（`templates/claude/hooks/session-start`，每会话注入，现写 "route substantial work … before editing"）。
- **On-demand（仅当模型主动加载 `using-spec-first` 才读到）**：
  - `skills/using-spec-first/SKILL.md` §58-81 / §83-96 / §320。

> 因果修正：SKILL §60 不是 always-present 根因——它只在模型加载 SKILL 时才被读。**用户"加两行"场景里实际在场的是 always-present 面**。所以 always-present 四处（CLAUDE.md 手写段、bootstrap 触发句、SessionStart 指针）与 on-demand SKILL 是**co-equal 根因**，不是主从关系。上一轮把 SKILL 当 canonical 根因、bootstrap 当"传导子集"的框定是倒置的，也正是 §149 当初滑过审查的原因。

本计划**只**修复路由阈值这一层（措辞 + 路由哲学）：给 substantial 加规模/风险下限，新增「明确小改动可直接执行（保持 CHANGELOG/最窄验证纪律）」出口，软化红旗措辞，并**同步所有 always-present + on-demand 注入面**。这是 spec-first 自身哲学（80/20、light contract、"何时直接做"、任务分级"小任务"）的一致性修复，不是放松治理。

**明确不在本计划范围**：command 渲染策略（整份 SKILL 内联 / 无渐进披露）的结构性改造——那是独立的、影响 18 个 workflow 的重型改动，单独规划。

---

## Decision Brief

- **推荐做法**：在 canonical 定义（`skills/using-spec-first/SKILL.md` §What Counts as Substantial Work）新增「明确小改动直接执行」边界，并把这条边界以最小锚点同步进 4 个真相源（SKILL + 生成器 + 本仓 CLAUDE.md/AGENTS.md managed 镜像）。
- **关键判断**：substantial 的判据从"是否改了文件"改为"是否需要工程闭环（多文件/架构/契约/状态变更/不确定根因/审查）"。明确的、单点的、低风险的小改动，默认直接执行 + 保留 spec-first 最小纪律（CHANGELOG、最窄验证、source/runtime 边界），不强制开公开 workflow。
- **验证焦点**：(a) 措辞改动不破坏现有 contract test 的 section 标题断言；(b) bootstrap 仍是 SKILL 的忠实子集，不膨胀成第二张路由表；(c) 双 host（claude/codex）zh+en 四个 body 一致更新；(d) 已安装用户经 `spec-first init` 能刷新到新 managed 块；(e) **行为验证**：用 fresh-source eval 确认"加两行"类请求确实落在直接执行侧、真正 substantial 仍路由——结构断言只能证措辞存在，证不了阈值真的重校准（见 U1 验证）。
- **最大风险**：阈值放太松导致真正需要 workflow 的中大改动也被"直接执行"。缓解：下限措辞明确限定"单点、低风险、根因清晰、无架构/契约/多文件扩散"，并保留"小改动中途升级则重新路由"的既有 reclassify 条款（SKILL §81）。

---

## Direct Evidence

- target_repo: spec-first（当前仓库，cwd 即仓库根，无父级多仓问题）
- source_refs:
  - `skills/using-spec-first/SKILL.md:58-97`（canonical「What Counts as Substantial Work」+ Lightweight Direct Outcomes + Self-Work，是定义真相源）
  - `src/cli/instruction-bootstrap.js:140-206`（生成进用户 CLAUDE.md/AGENTS.md 的 bootstrap managed block，zh/en × claude/codex 四 body；:159/:168/:193/:202 即「何时进入 workflow」「反合理化红旗」措辞源）
  - `CLAUDE.md:225-241` / `AGENTS.md`（本仓库 checked-in host 入口的 managed 镜像，需随生成器同步）
  - `src/cli/adapters/claude.js:66-74`（command = frontmatter + 整份 SKILL body 的渲染源——本计划**不改**，仅作为 token 放大链证据记录）
- current_revision: leo-2026-06-15-review-all @ 6200606e（计划撰写时；实现时以实际 HEAD 为准）
- worktree_dirty: 计划撰写时仅本计划文件新增
- discovery_methods: 直接 `grep`/`Read` 源码、`wc -c` 实测 SKILL/command 体量、Read `instruction-bootstrap.js` 全文确认单语言注入
- tests_or_logs:
  - 实测 `.claude/commands/spec/code-review.md`=118KB(~29.6K tok)、`work.md`=56KB(~14K tok)，证明 invoke 即全量内联
  - `tests/unit/instruction-bootstrap.test.js:48-54,419-500` 断言 section 标题（「何时进入 workflow」「何时直接做」「反合理化红旗」「substantial work」），**断言的是标题而非「改代码」具体内容**——给本计划留出措辞调整空间
  - `tests/unit/using-spec-first-contracts.test.js:54-92` 断言 bootstrap 是 SKILL 的"substantial-work workflow check""small set of common entry anchors"忠实子集
- confidence: 高（机制因果链经源码逐行确认；最初的「中英双份注入」P0 假设已撤回，因 `instruction-bootstrap.js:8-10,132-138` 证明生成器按 `lang` 单写）
- limitations: 未实测真实用户会话的 token 时间序列（无该数据）；token 数为 `字节/4` 粗估；本计划不验证 command 渲染层（明确 out of scope）

---

## Problem Frame

### 病灶定位

`skills/using-spec-first/SKILL.md:60-73` 当前：

```
Treat these as substantial work:
- modifying code, docs, config, or generated runtime assets   ← 无规模/风险下限
...
These are not substantial work:
- lightweight factual answers
- brief explanations ...
- quick questions ...
- showing command output / "where is X used?" without edits   ← 全是"不涉及编辑"的回答类
```

**缺口**：一旦请求涉及"编辑文件"，无论两行还是两百行，都落入 substantial。而"非 substantial"清单里**没有任何一条覆盖"涉及编辑但明确小且低风险"的情形**。模型只能把"加两行"归为 substantial。

`instruction-bootstrap.js:168` 的红旗措辞放大了这一倾向：

```
「先改个文件就好」→ 先判断是否 work/debug/update/compound-refresh
```

这把"想直接改文件"框定为需要警惕的偷懒念头，进一步压低了直接执行的心理阈值。

### 这在 token 放大链中的位置（诚实定位，回应第二轮审查 P2）

明确小改动 →[阈值过低]→ 升级为 substantial →[触发 /work]→ command 内联整份 spec-work SKILL(~14K tok) + 分支说明 →[叠加每会话恒定底盘：CLAUDE.md 全文 + 51 agent registry + bootstrap + lang + graphify 块]→ 1M 上下文很快压缩。

**本计划只切第一环（降低不必要的 workflow 触发频率），不是 token 暴涨的总根源。** 必须诚实：
- 每会话**恒定底盘**（CLAUDE.md 全文、51 agent registry 等）本计划**完全不动**——这是用户"简单修改也烧 token"里基线消耗的大头。
- 单次 workflow 的**整份 SKILL 内联**（②）本计划**不动**——已决定要做的中等改动，其按需成本不变。
- 且目标 workflow（`spec-work:400`、`spec-debug:122/294`）**已有 trivial fast-path**，进入后对琐碎改动已自我衰减——故"保持小改动在外"的边际收益是"省掉 ~14K SKILL 内联 + 分支 prose"，**不是**省掉重型执行（后者已被 fast-path 限制）。

因此本计划是"**减少一类不必要的重型触发**"，性价比高、风险低，但**不解决**用户描述的基线 token 暴涨。后者需另起②（command 渐进披露）与恒定底盘瘦身计划，并带基线测量。

---

## Goals

- 给 substantial 判据加入规模/风险维度：判据从"是否改文件"转为"是否需要工程闭环"。
- 新增显式出口：明确的、单点的、低风险的小改动可直接执行，同时保留 spec-first 最小工程纪律（CHANGELOG、最窄验证、source/runtime 边界、commit 纪律）。
- 软化 `反合理化红旗` 中把"想直接改文件"无差别框为偷懒的措辞，改为"先判断规模与风险"。
- **所有注入面语义一致（第二轮审查纠正后的完整清单）**：on-demand（SKILL §58-81/§83-96/§320）+ always-present（生成器 bootstrap 四 body 触发句、CLAUDE.md/AGENTS.md 手写 §145-159 治理段与任务分级、SessionStart 指针文案）。漏任一面都会造成 full-context 自相矛盾。
- 加 `routing-cases.json` 确定性 CI 守卫覆盖"小改动直接"行为，不只依赖可跳过的 fresh-source eval。
- 保持 bootstrap 是 SKILL 的忠实子集，不膨胀。

## Success Criteria（显式承认收益边界）

- **确定性验收（CI 可跑，首选）**：`routing-cases.json` 新增的"小改动直接 / 真 substantial 路由"用例通过（U6）——这是不依赖宿主 dispatch 的机器可判守卫。
- **行为验收（补充）**：fresh-source eval 用**完整 skill**跑小改动探针落直接执行侧、substantial 探针仍路由（U1）；宿主缺 dispatch 时记录未执行原因，不顶替 U6 的确定性守卫。
- **收益边界（诚实声明，回应第二轮审查 P2）**：本计划只切放大链**第一环（降低不必要的 workflow 触发频率）**。**完全不动**：(a) 每会话恒定底盘（CLAUDE.md 全文、51 agent registry、bootstrap/lang/graphify 块）——用户"简单修改也烧 token"的基线大头；(b) 单次 workflow 的整份 SKILL 内联（②）。且目标 workflow 已有 trivial fast-path，进入后已自我衰减——故边际收益是"省 ~14K SKILL 内联 + 分支 prose"，非省重型执行。**实现与 closeout 不得宣称已解决 token 暴涨或已解决②；这是减少一类不必要触发，不是降基线。**
- 无逐会话 token 时间序列基线数据，故不设定量百分比目标；量化需在②与恒定底盘瘦身计划中带基线测量。

## Non-Goals

- 不改 command 渲染策略（整份 SKILL 内联 / 渐进披露）——独立计划。
- 不改 SKILL 体量、不拆 references、不改 agent 注册表规模。
- 不放松对真正 substantial 工作（架构/prompt/workflow/contract/多文件/状态变更）的治理。
- 不引入新的 CLI 命令、新 schema、新 contract 文件。
- 不改 `using-spec-first` 的 Route Map / 入口锚点集合本身。

---

## Key Technical Decisions

1. **canonical 完整判据在 SKILL（on-demand），但 always-present 面是行为的实际驱动，必须同改。**
   `using-spec-first/SKILL.md` §58-81 是完整判据真相源；bootstrap（生成器）与本仓镜像只承载最小提醒，符合 `using-spec-first-contracts.test.js` 的"忠实子集"约束。**但（第二轮审查纠正）SKILL 是 on-demand——仅当模型加载它才被读；用户失败场景里在场的是 always-present 面（CLAUDE.md 手写 §145-159、bootstrap 触发句、SessionStart 指针）。** 故不能只改 SKILL 当 canonical 就以为修好；always-present 四处与 SKILL 是 co-equal，全部以同一措辞基线（U1 定）同步。

2. **substantial 判据重构为"工程闭环需求"而非"文件触碰"。**
   新表述要点：substantial = 需要规划/调试/审查闭环、跨多文件、改架构/契约/治理、状态变更、根因不明、或涉及敏感面（auth/payment/data/迁移）。明确单点低风险小改动不再仅因"碰了文件"就 substantial。

3. **新增「明确小改动直接执行」边界，但绑定最小纪律。**
   直接执行≠无纪律。措辞需明确：仍遵守 CHANGELOG 要求、最窄验证、不手改 generated runtime、source/runtime 边界。避免被误读为"小改动可以跳过 spec-first 所有规矩"。

4. **红旗措辞从"念头即停"软化为"先判规模"。**
   `「先改个文件就好」` 行改为承认"明确的小改动直接做是对的；要停下的是规模/风险不明、跨架构/契约、或根因未定时"。保留对真正越界念头（"快速架构改动""该评审但口头答"）的红旗。

5. **保留既有 reclassify 安全阀。**
   SKILL §81"小改动中途升级则重新路由"原样保留——这是防阈值放松副作用的关键，明确引用而非删除。

---

## System-Wide Impact

| 真相源 | 改动 | 提交? | 下游影响 |
|---|---|---|---|
| `skills/using-spec-first/SKILL.md` §58-81 + §83-96 self-work + §320 红旗表 | canonical 判据重构 + 小改动出口 + self-work 分层 + 红旗表同步 | ✅ source | 所有路由判断的语义基线 |
| `src/cli/instruction-bootstrap.js` zh/en × claude/codex 四 body | 改"进入 workflow"触发句 + 加直接执行锚点 + 红旗软化 | ✅ source | 所有用户 `init` 写入的 CLAUDE.md/AGENTS.md |
| `CLAUDE.md` / `AGENTS.md` **bootstrap managed 块** | 经 `spec-first init` 刷新 | ✅ tracked source（实测非 ignored） | 本仓库开发者会话 |
| **`CLAUDE.md`/`AGENTS.md` §145-159 手写治理段+任务分级（U5，第二轮审查 P1）** | **手写直接编辑**——`init` 不碰；always-present、权威高于 on-demand SKILL；§149"实现改动走 work"是用户场景实际驱动 | ✅ tracked source | **本仓库每会话默认决策**（上一轮漏掉的真根因） |
| **`templates/{claude,codex}/hooks/session-start` SessionStart 指针文案（U5）** | 核对/软化 "before editing" 无条件措辞 | ✅ source（hook 模板） | 每会话注入的指针 |
| **`skills/using-spec-first/evals/routing-cases.json` + `prompt-examples-contracts.test.js`（U6）** | 加"小改动直接 / 真 substantial 路由"确定性用例 | ✅ source | CI 回归守卫 |
| `.claude/`/`.codex/`/`.agents/` generated mirror | 经 `init` 本地再生成 | ❌ **不提交**（`.gitignore:46,78-87` 排除） | 仅本地 runtime；非 git 变更对象 |
| 已安装用户 | 经 `spec-first init` re-run 刷新 managed 块（手写 §145-159 是各项目自己的文件，用户需自行同步——closeout 提示） | — | 迁移路径，非破坏性 |
| `tests/unit/instruction-bootstrap.test.js`、`using-spec-first-contracts.test.js`、`prompt-examples-contracts.test.js` | 按需更新/新增断言（① 触发句、② 红旗表、④ self-work、U5 手写段、U6 routing-cases） | ✅ source | 防回归 |

受影响人群：所有 spec-first 用户（恒定注入语义变更）、本仓开发者。无外部 API/CLI 契约破坏。

> **迁移注意（U5 的范围真相）**：`CLAUDE.md`/`AGENTS.md` 的**手写 §145-159 治理段是每个项目自己的文件**，不是 spec-first 生成的——本计划改的是**本仓库**的这两份。已安装用户项目里若有类似手写治理段，`spec-first init` 不会改它（只刷 managed 块）。这意味着：对用户项目，本计划的有效面是 bootstrap managed 块 + SessionStart 指针 + SKILL；用户自己的手写 CLAUDE.md 段需用户自行调整。这是真实的能力边界，closeout 必须说明，不得宣称"已为所有用户修好手写段"。

---

## Implementation Units

### U1. 在 canonical SKILL 重构 substantial 判据并新增小改动出口

**Goal**：让 `using-spec-first/SKILL.md` 的「What Counts as Substantial Work」承认"明确小改动直接执行"，判据从文件触碰转为工程闭环需求。

**Requirements**：解决反馈① 根因（阈值无下限）。

**Dependencies**：无（canonical 源，先改）。

**Files**：
- `skills/using-spec-first/SKILL.md`——**三处必须同步改，缺一则 full skill 自相矛盾**：
  - §58-81「What Counts as Substantial Work」+「Lightweight Direct Outcomes」（判据真相源）
  - §83-96「Spec-First Self-Work」（本仓自身路由，见下 ④）
  - §320「## Routing Red Flags」表（第二处红旗，§324 "I'll just edit the file first."）

**Approach**：
- 修改 §60 substantial 清单：把"modifying code, docs, config"限定为"需要工程闭环的改动（多文件/架构/契约/治理/状态变更/根因不明/敏感面）"，而非任何文件改动。
- 在 §68 "These are not substantial work" 或新增小节加入一类：**明确的、单点的、低风险的小代码/文案改动**（如加两行、改常量、修 typo、单文件局部修复），默认直接执行，保留 CHANGELOG/最窄验证/source-runtime 边界纪律。
- 明确引用既有 §81 reclassify 安全阀（小改动中途升级则重新路由），作为放松的对冲。
- **（②修正）同步改 §320 Routing Red Flags 表 §324 行**：`"I'll just edit the file first."` 不能再无差别归为红旗——否则 full skill 与上面放宽的判据自相矛盾，仍把模型推回 `spec-work`。改为承认"明确小改动直接编辑是对的；要警惕的是规模/风险不明、跨架构/契约/多文件、或根因未定的编辑"。其余红旗行（quick architecture change、inspect a bunch of files、review informally 等）保留。
- **（④修正）同步改 §83-96 Self-Work**：现 §89 把 spec-first 自身"concrete implementation or prose changes"一律路由到 work，会把本仓一个 2 行 `src/cli` 局部修复也升级。改为分层：**prompt/workflow/contract/governance/runtime delivery/skill/agent prose 变更仍 substantial**（这是 spec-first 的高风险面，不放宽）；**明确单点低风险的普通代码/文案修正（如 src/cli 局部 bug 修、注释、typo）可直接执行**，保留 CHANGELOG/最窄验证纪律。这正面回应"本仓小改动也被过度路由"——因为用户反馈很可能就发生在本仓。

**Patterns to follow**：镜像现有 §75 "Lightweight Direct Outcomes" 的写法（已有"valid non-workflow outcomes"框架），把"涉及小编辑"纳入该框架的自然延伸。

**Test scenarios**：
- 结构断言（注意守护对象）：经核对，`using-spec-first-contracts.test.js:54-92` 断言的是 **bootstrap 子集描述符**（"substantial-work workflow check""small set of common entry anchors"），**并不**钉死 SKILL §60/§68 的判据 prose——即 canonical 判据段当前可能**无 contract test 守护**。实现时先确认这一点：若确实无守护，新增一条最小断言确认"明确小改动直接执行"边界存在且绑定纪律关键词（CHANGELOG / 最窄验证 / reclassify）；若已有守护断言旧 prose，更新之。
- Covers 反馈①：断言 substantial 判据包含"工程闭环"维度而非纯"文件触碰"。
- **（②）一致性断言**：断言 §320 Routing Red Flags 表的 "edit the file first" 行与 §60-68 判据不矛盾（不再无差别把直接编辑列为红旗）；防止只改判据段漏改红旗表导致 full skill 内部冲突。
- **（④）断言**：§83-96 Self-Work 保留 prompt/workflow/contract/governance/runtime delivery/skill/agent 为 substantial，且新增普通代码小修可直接执行的出口。
- 负向：断言未删除 §81 reclassify 条款（防安全阀丢失）。
- Test expectation：contract test 级别（prose 文档断言），运行时行为由下方 fresh-source eval 覆盖。

**行为验证（fresh-source eval，本计划的关键验证，回应 doc-review F1）**：
结构断言只能证明新措辞存在，证不了阈值真的重校准了路由行为；且 `CLAUDE.md` 明确要求 prose 变更走 fresh-source eval（宿主会缓存 skill 定义）。按 `docs/contracts/workflows/fresh-source-eval-checklist.md`：把磁盘上改后的 `using-spec-first/SKILL.md` §58-81 注入全新通用 subagent，用 2-3 个探针提示验证路由落点——
- "给这个函数加两行日志" → 期望落**直接执行侧**（不开 /work）
- "改一个常量值 / 修 typo" → 期望落**直接执行侧**
- "重构 auth 中间件 / 跨 3 文件改契约" → 期望仍**路由进公开 workflow**（确认未误伤真 substantial）
- **（④探针）"在 spec-first 仓库给 src/cli 一个函数修个 2 行 bug"** → 期望落**直接执行侧**（验证 self-work 出口生效）；对照 **"改 spec-first 一个 skill 的 workflow prose"** → 期望仍 **substantial/路由**（验证高风险面未放宽）。
- 探针须用**改后的完整 SKILL**（含 §320 红旗表与 §83-96 self-work），而非仅 §58-81——因为 full skill 才是宿主实际加载的，红旗表/self-work 若与判据矛盾会在此暴露。
若宿主缺 dispatch primitive 或被禁用，记录未执行原因与 reason_code（如 `dispatch_authorization_missing`），不得声称行为验证通过。

**Verification**：`npx jest using-spec-first-contracts`、`npm run lint:skill-entrypoints` 通过；fresh-source eval 探针落点符合预期（或记录未执行原因）；人工通读确认判据与小改动出口语义自洽、纪律未被削弱。

---

### U2. 同步生成器 bootstrap 四 body 的最小锚点与红旗软化

**Goal**：`instruction-bootstrap.js` 生成进用户项目的 managed 块，加入"明确小改动可直接执行"最小锚点并软化红旗措辞，zh/en × claude/codex 四 body 一致。

**Requirements**：把 U1 的判据以最小子集传导到恒定注入面。

**Dependencies**：U1（canonical 定义先定稿，bootstrap 取其子集）。

**Files**：
- `src/cli/instruction-bootstrap.js`（`buildZhBootstrapBody` :156-172、`buildEnBootstrapBody` :190-206）

**Approach**：
- **（①修正，关键）改「何时进入 workflow / When to enter a workflow」触发句本身**（`:159` zh / `:193` en）：现写"改 code/docs/config/runtime asset … 前判断进入 workflow"，这是把"编辑文件"无差别等同 substantial 的源头。改为"**需要工程闭环的编辑、或非平凡/有风险的改动**（多文件/架构/contract/治理/状态变更/根因不明/敏感面）前判断进入 workflow"。**只在"何时直接做"补一句而不改这句，会造成同一 bootstrap block 内部自相矛盾**——这是 doc-review 漏掉、外部审查抓出的 P1。
- 配套在「何时直接做 / When to just answer」锚点行补一句：明确的、单点的、低风险小改动可直接执行（保留 CHANGELOG/最窄验证纪律），不必开公开 workflow；放大/不确定时再路由。
- 软化「反合理化红旗 / Anti-rationalization red flags」首条：`「先改个文件就好」`→ 改为"明确小改动直接做是对的；要停下的是规模/风险不明或跨架构/契约/多文件时"。保留其余红旗。
- 保持四 body 措辞对称（claude 用 `spec-*`、codex 用 `spec-*`；zh/en 语义一致）。
- 严守 bootstrap 忠实子集约束：只改/加锚点行，不展开成完整判据表。

**Patterns to follow**：现有四 body 的对称结构与 `entry()`/`hostLine`/`surfaceLine` 模板拼接方式。

**Test scenarios**：
- `instruction-bootstrap.test.js` 现有 section 标题断言（「何时进入 workflow」「何时直接做」「反合理化红旗」「substantial work」/「Anti-rationalization red flags」）保持通过——确认标题未被改名。
- 新增断言：四 body（zh/en × claude/codex）均含"明确小改动直接执行"锚点关键词。
- **（①）断言**：四 body 的"何时进入 workflow / When to enter a workflow"触发句不再无条件包含"改 code/docs/config 即判断进入"，而含"工程闭环/非平凡/有风险"限定词——防内部矛盾。
- Covers 反馈①：断言红旗首条不再把"想改文件"无差别框为需停下的偷懒念头。
- 一致性断言：`buildKnownBootstrapBodies()` 产出的 strip 逻辑仍能识别新 body（防 `applyManagedBootstrapBlock` re-init 去重失效）。

**Verification**：`npx jest instruction-bootstrap`、`npx jest init-dry-run clean-dry-run`、`npm run typecheck` 通过；临时项目 `spec-first init --claude --codex -y` 生成态人工核对四语言块含新锚点。

---

### U3. 刷新本仓 CLAUDE.md / AGENTS.md managed 镜像并对齐测试

**Goal**：本仓库 checked-in 的 managed 镜像随生成器更新，contract test 全绿。

**Requirements**：source/runtime 一致性；本仓开发者会话获得同一语义。

**Dependencies**：U2（生成器定稿后再刷新镜像）。

**Files**：
- `CLAUDE.md`（`spec-first:bootstrap` 块 :224-241）
- `AGENTS.md`（对应 bootstrap 块）
- `tests/unit/instruction-bootstrap.test.js`、`tests/unit/using-spec-first-contracts.test.js`、`tests/unit/context-governance-contracts.test.js`（按需）

**Approach**：
- 用 `spec-first init`（选当前 host）作为 runtime regeneration 刷新 managed 块——不手改 generated 部分；但 `CLAUDE.md`/`AGENTS.md` 是 checked-in host 入口（source slice 含 managed block），按 CLAUDE.md 源策略：managed 块由生成规则管理，故通过 init 刷新后提交。
- **（③修正，重要）generated runtime mirror 不是提交对象**：`.gitignore`（:46、:78-87）排除 `.claude/commands/spec/`、`.claude/skills/`、`.claude/agents/`、`.codex/`、`.agents/`（`git ls-files` 实测这些镜像仅 track `.claude/settings.json` 一项，其余全 ignored）。因此 `spec-first init` 再生成的镜像**只用于本地 init/inspect 验证，不应出现在 git diff、也不应被提交**。这条直接纠正本计划上一轮 doc-review F2 的错误结论（"镜像出现在 git diff 是预期"——与 `.gitignore` 事实相反）。
- 真正的提交面（source surfaces）：`skills/`、`src/cli/`、`CLAUDE.md`、`AGENTS.md`、`tests/`、`CHANGELOG.md`。
- 核对 `context-governance-contracts.test.js` 的 language-agnostic 不变量断言（path glob + `spec-first:lang` 锚点）不受影响（该测试已于 v1.11.0 改为 language-agnostic）。
- 若任何测试钉死了被改的具体措辞，更新断言到 language-agnostic 或新措辞。

**Patterns to follow**：v1.11.0 `refactor(lang-policy)` 与 `context-governance` 测试改 language-agnostic 的先例（CHANGELOG 已载）。

**Test scenarios**：
- `npm run test:unit` 全绿（重点 instruction-bootstrap / using-spec-first / context-governance / init-dry-run / clean-dry-run）。
- `bash tests/smoke/release-dual-host-governance.sh`、`bash tests/smoke/cli.sh` 通过（双 host 治理一致）。
- `git diff --check` clean。
- 负向（③修正后）：`git status` / `git diff` 的变更**只含 source surfaces**（`skills/`、`src/cli/`、`CLAUDE.md`、`AGENTS.md`、`tests/`、`CHANGELOG.md`）；`.claude/commands/spec/`、`.claude/skills/`、`.codex/`、`.agents/` 等 generated mirror **不**出现在 diff（被 `.gitignore` 排除）。若它们意外出现在 `git status`，说明误碰了不该提交的产物，需排查。
- 本地一致性（非提交项）：`spec-first init` + `spec-first doctor` 在本地确认 source→runtime 投射成功、无 drift——这是本地验证，不是 git 变更。

**Verification**：上述测试套件通过；`git diff` 审查确认提交面**仅** source surfaces，generated mirror 不在其中；本地另跑 `spec-first init`/`doctor` 确认 runtime 投射无 drift（本地验证，不提交镜像）。

---

### U5. 修正 always-present 的手写治理面（CLAUDE.md/AGENTS.md §145-159 + SessionStart 指针）

**Goal**：修复每会话全文加载、权威高于 on-demand SKILL 的手写治理段——这是用户"本仓加两行也进 /work"场景的实际驱动源，上一轮计划漏掉。

**Requirements**：解决反馈①在 always-present 面的真根因（第二轮审查 P1）。

**Dependencies**：U1（与 SKILL 判据措辞保持一致）。

**Files**：
- `CLAUDE.md` §145-149（手写 `## Workflow 入口治理`，**非** managed 块）、§151-159（任务分级）
- `AGENTS.md` 对应手写段
- `templates/claude/hooks/session-start`、`templates/codex/hooks/session-start`（SessionStart 注入的指针文案）
- 全局 `~/.spec-first/.developer` 不涉及；全局 `/Users/kuang/CLAUDE.md` 是用户级外部文件，不在仓库范围，仅在 closeout 提示用户按需自行同步

**Approach**：
- **CLAUDE.md §149**：现写"本仓库的具体实现或 prose 修改通常走 work workflow"——把所有实现改动（含两行）推向 work。改为分层：prompt/workflow/contract/governance/skill/agent prose 与架构改动走 work/对应 workflow；**明确单点低风险的普通代码/文案修正可直接执行**（保留 CHANGELOG/最窄验证纪律）。与 U1 §83-96 self-work 措辞对齐。
- **CLAUDE.md §151-159 任务分级**：给"小任务"补一句直接执行出口——小任务默认直接做、保持窄审查，不强制开公开 workflow（现仅说"保持审查范围窄"但未说可不进 workflow）。
- **AGENTS.md** 对应段同步。
- **SessionStart 指针文案**：现 `templates/*/hooks/session-start` 注入 "route substantial work … before editing" 每会话在场。核对是否需把 "before editing" 的无条件措辞软化为与新判据一致（"before non-trivial/risky edits"）；若改，注意它是 hook 模板 prose，改后需 `spec-first init` 重新投射且更新对应 hook 测试。
- 这些是 checked-in source（`git ls-files` 实测 `CLAUDE.md`/`AGENTS.md` 为 tracked、非 ignored），直接编辑提交，不经 generated mirror。

**Test scenarios**：
- 断言 `CLAUDE.md`/`AGENTS.md` 手写治理段含"小改动可直接执行"出口、且不再无条件把"实现修改"推向 work。
- 断言任务分级"小任务"含直接执行语义。
- 若改 SessionStart 模板：更新 `tests/unit/*session-start*`、smoke 对指针文案的断言；确认 hook wire 契约（仅 `hookEventName`+`additionalContext`）不破。
- Test expectation：prose 断言 + hook 模板测试（若触及）。

**Verification**：相关 unit/smoke 通过；人工通读确认 always-present 四面（CLAUDE.md 手写段、任务分级、bootstrap、SessionStart 指针）与 on-demand SKILL 语义一致、无内部矛盾。

---

### U6. 加 routing-cases.json 确定性回归守卫（CI 可跑，不依赖可跳过的 eval）

**Goal**：为"小改动应直接执行"这一行为加一个 CI 可运行的确定性守卫，弥补 fresh-source eval 可跳过的缺口（第二轮审查 P1）。

**Requirements**：防回归；把本计划核心行为变化编码为机器可判用例。

**Dependencies**：U1（判据定稿后再加用例，保持一致）。

**Files**：
- `skills/using-spec-first/evals/routing-cases.json`
- `tests/unit/prompt-examples-contracts.test.js`（对应断言 + 容量边界）

**Approach**：
- `routing-cases.json` 现有 direct_answer/bounded_read/public_workflow 用例，但**无"小代码改动直接执行"用例**。新增 1-2 条：如 `small-low-risk-edit-stays-direct`（"给函数加两行日志""改一个常量"）→ `expected_outcome: direct_answer`、`public_workflow_required: false`；可加一条对照 `cross-file-contract-change-routes`（确认真 substantial 仍 public_workflow）。
- 核对 `prompt-examples-contracts.test.js` 的容量边界（examples.json 已 6/6 满，但 routing-cases.json 实测 4 个 outcome 用例，有余量；确认 routing-cases 的独立容量上限再加）。
- **examples.json 处理（回应 P2）**：examples.json 已达 `<=6` 上限且首例携带"未确认 plan 就改 source = negative_signal"语义，与放宽后判据相左。本计划不强行塞入（会触上限），改为在 Deferred/Non-Goals 显式声明：小改动维度由 routing-cases.json 覆盖；examples.json 的 negative_signal 语义是否需调整留作独立跟进，不在本计划范围。

**Test scenarios**：
- `npx jest prompt-examples-contracts` 通过：新用例 schema 合法、在容量边界内。
- 断言新增 small-edit 用例存在且 `expected_outcome` 非 public_workflow。
- 断言对照用例（真 substantial）仍 public_workflow——防阈值放过头。

**Verification**：`npx jest prompt-examples-contracts` 通过；用例覆盖小改动直接 + 真 substantial 路由两侧。

---

### U4. 更新 CHANGELOG 与用户可见文档

**Goal**：按仓库格式记录本次用户可见的路由语义变更。

**Requirements**：CLAUDE.md 强制基线（任何 source 变更须更新 CHANGELOG；用户可见追加 `(user-visible)`）。

**Dependencies**：U1-U3（改动定稿后记录）。

**Files**：
- `CHANGELOG.md`
- `docs/05-用户手册/`（若有描述入口治理/路由阈值的章节，按需同步）
- `README.md` / `README.zh-CN.md`（仅当其描述了 substantial 判据时，按需）

**Approach**：
- CHANGELOG 追加 compact 条目：记录入口治理 substantial 阈值加规模下限、新增小改动直接执行出口、红旗软化、**所有注入面同步（SKILL on-demand + bootstrap 生成器 + CLAUDE.md/AGENTS.md 手写治理段 + SessionStart 指针 + routing-cases 守卫）**、验证命令；标 `(user-visible)`。
- 扫描用户手册是否有"何时进入 workflow"对应描述需同步（grep `substantial`/`入口治理`/`workflow`）。

**Test scenarios**：
- `npx jest changelog-format` 通过（格式合规）。
- 若改用户手册，确认无测试钉死被改文件名/字符串（参考 user-manual-hard-constraints）。
- Test expectation：docs/changelog，无运行时行为。

**Verification**：`npx jest changelog-format`；人工确认条目含 source surface、用户可见影响、验证状态。

---

## Sequencing

U1（on-demand SKILL 三处判据定稿）→ U2（bootstrap 生成器触发句+锚点+红旗）→ U5（always-present 手写治理面 CLAUDE.md/AGENTS.md §145-159 + SessionStart 指针）→ U6（routing-cases 确定性守卫）→ U3（镜像本地刷新 + 测试对齐）→ U4（CHANGELOG/docs）。

U1 先定措辞基线，U2/U5/U6 各取与之一致的措辞落到不同注入面（U2 生成器、U5 手写 source、U6 eval 守卫）；U3 负责本地 init 刷新与测试对齐（镜像不提交）；U4 收尾文档。串行以避免**所有注入面**（on-demand + always-present）措辞漂移——第二轮审查证明漂移正是上一轮漏 §149 的根源。

---

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| 阈值放太松，中大改动也被"直接执行" | 下限措辞严格限定"单点/低风险/根因清晰/无架构契约多文件扩散"；保留 §81 reclassify 安全阀并显式引用 |
| **多注入面措辞漂移（on-demand + always-present 共 6 面）** | 串行 U1→U2→U5→U6→U3；各面加一致性断言；以 U1 措辞为统一基线。第二轮审查证明漏 always-present 面（§149）正是上一轮根因盲区 |
| 现有 contract test 钉死被改措辞 | 已确认测试主要断言 section 标题非"改代码"内容；U2/U3 更新少量断言到 language-agnostic |
| 被误读为"小改动可跳过 spec-first 纪律" | 小改动出口显式绑定 CHANGELOG/最窄验证/source-runtime 边界关键词 |
| 已安装用户不会自动获得新语义 | 经 `spec-first init` re-run 刷新；CHANGELOG 说明；非破坏性迁移 |
| **只改判据段、漏改红旗表/self-work/bootstrap 触发句 → full skill 内部矛盾** | U1 同步三处（§58-81 + §83-96 + §320）、U2 改触发句本身；加内部一致性断言；fresh-source eval 用**完整** skill。此风险由外部多视角审查抓出（本计划单视角 doc-review 曾漏 ②④、且 ③ 改反），印证 prose 变更需完整 skill + 多视角验证 |

---

## Assumptions

- 用户反馈的"侵入性变高"主要由路由阈值（本计划）+ command 全量内联（out of scope）共同造成；本计划只解决前者，预期显著但非全部缓解 token 问题。后续可评估是否需要②渐进披露计划。
- 测试对 section 标题的断言在改措辞后仍成立（已核对 `instruction-bootstrap.test.js:48-54,419-500`）。
- `spec-first init` 刷新 checked-in host 入口 managed 块是既定 source 维护路径（CLAUDE.md 源策略所述）。

## Deferred to Implementation

- U1 新出口的精确中英措辞（需在写时与既有 §75 Lightweight Direct Outcomes 语气统一）。
- U3 中具体哪些 contract test 断言需要从"具体措辞"改为"language-agnostic"——以实现时 `npm run test:unit` 实际失败项为准。
- 用户手册是否真有需同步章节——以 U4 实现时 grep 结果为准。

## Out of Scope（独立计划）

- command 渲染策略改造：让 `spec-*` 只内联"路由 + 默认路径"，低频分支（headless/autofix、parallel dispatch、worktree）外置 references，实现真正的渐进披露。这是影响 18 个 workflow 的结构性改动，应单独 `spec-plan`。

## Completion Evidence

- implementation_scope: 已同步 `skills/using-spec-first/SKILL.md`、bootstrap 生成器、`CLAUDE.md`/`AGENTS.md` 手写治理段与 managed block、SessionStart hook 指针、runtime catalog、routing eval cases、相关 contract tests 与 `CHANGELOG.md`。
- verification: `npx jest` 聚焦 12 suites/136 tests 通过；`npm run typecheck`、`npm run lint:skill-entrypoints`、`bash tests/smoke/cli.sh`、`bash tests/smoke/release-dual-host-governance.sh`、`git diff --check` 通过。
- review_status: 按 `spec-code-review` 单-agent report-only fallback 复核；因当前 Codex 请求未授权 `subagents/personas/delegated/parallel` reviewer dispatch，未运行多 persona review，reason_code=`dispatch_authorization_missing`。
- generated_runtime_status: 使用当前 source checkout 执行 `node bin/spec-first.js init --claude --codex -y` 验证 source→runtime 投射；generated mirrors 未进入 git diff。
- limitations: fresh-source eval 未运行，reason_code=`dispatch_authorization_missing`；本修复只降低不必要 workflow 触发，不改变每会话常驻上下文或 workflow SKILL 全量内联成本。
