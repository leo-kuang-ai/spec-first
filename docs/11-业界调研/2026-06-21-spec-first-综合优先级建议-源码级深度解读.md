# spec-first 综合优先级建议：源码级深度解读

日期：2026-06-21
作者：leokuang
角色视角：Spec-First Evolution Architect
输入范围：`docs/11-业界调研/` 全部 8 篇调研文档 + 当前 worktree（分支 `leo-2026-06-20-yao-gate`）source 复核
判断基线：`docs/10-prompt/结构化项目角色契约.md` v1.0

## 0. 结论先行

把 7 篇调研（4 篇业界对标 + ponytail-YAGNI + ECH skill-mapping + 6/20 STORM 采纳缺口）的优先级建议，逐条对照**当前磁盘 source** 复核后，结论有三层：

1. **方向**：spec-first 下一阶段的稀缺杠杆是"兑现 + 提升外部可验证性"，把高成本结构赌注（活契约 + Delta）后置。诚实表述：本轮的 P1（MIC、preflight、recall、security lens、compound）是**低成本净增轻能力 + 收紧**，不是零成本——把它们称作"纯收紧/不加能力"会掩盖真实取舍；准确说法是"本轮押低成本净增 + 兑现，后置高成本结构赌注"。落地时应据高频度砍到真正必要的 2-3 个 P1，其余进 backlog（聚合成本见 §1 末提示）。

2. **两处研究建议须按 source 现状改写其落地形态**（注意：二者证据独立性不同，下文分别标注，不并列为等强"纠正"）：
   - **`config-protection` exit-2 hook 在 spec-first source 中不存在**（证据：全仓 grep 仅命中 `CHANGELOG.md` 与 ECH 研究文档自身——这是与作者无关的**机械事实**，证据独立性强）。需说明的是：ECH 原报告本就**已自标** config-protection 为外部、未独立复核、"不直接复制、须改写为 source-owned policy"的引用（ECH 第 246、339 行），并未声称它存在于 spec-first。所以这里不是"纠正 ECH 失实"，而是**确认并继承 ECH 自己的 host-binding caveat**：落到 spec-first 应表达为"复用既有 `secret-deny-patterns` + mutation gate"，而非移植一个不存在的 hook。
   - **"PRD live semantic 自动化 scorecard"已被记录为 settled out-of-scope**（CHANGELOG v1.11.4 2026-06-21 15:20，source-of-truth 在 `skills/spec-prd/references/evaluation-governance.md` Promotion Boundary）。**证据强度须如实标注**：该决策的对抗评审结论写在治理文件内部，CHANGELOG 与本判断文档为同作者（leokuang）同批次（yao-gate）同日产物，无独立留存的对抗评审 artifact 可回溯——即它是**同批次单方治理决策**，不是经第三方独立对抗复核的终局结论。因此：6/20 STORM 的 P0「build PRD live semantic eval v1」的*自动化打分器*形态**本轮不照搬**（live/semantic 判断改走 dispatched fresh-source eval + 两脚本 + contract tests）；但若 6/20 该 P0 的提出者带来新证据，此 out-of-scope **可重开**，不应被武断终局化。

3. **多处缺口已部分闭合**（相比 6/19–6/20 研究快照）：`spec-debug` 已默认直接扫 `docs/solutions/` frontmatter（`skills/spec-debug` 第 84 行）；`spec-plan` 已有 PRD handoff entropy check（`spec-plan/SKILL.md:177`）；`spec-brainstorm` 已完成入口边界收窄与 routing fixture（CHANGELOG 6/21 多条）。这些把对应建议从"新增"降级为"扩既有表面"。

下面逐项深度解读。每项给出：研究建议 → 当前 source 真相 → 判断 → 最小落地顺序。

---

## 1. 优先级总表（源码复核后修订版）

> **排序口径说明**：下表"优先级"按**杠杆 × 证据可见性**排，不按"改动确定性"排。P0-A 改动确定性最高，但它是纯内部 pipeline 整洁度，外部 adopter 看不到；replay corpus（P0-D）改动成本最高，却是角色契约 §1「可外部验证性」唯一的直接证据。确定性 ≠ 优先级——must-have 由"去掉则目标失败"定义。执行序见 §12。

| 优先级 | 主题 | 性质 | 前置阻塞 | source 复核状态 |
| --- | --- | --- | --- | --- |
| P0-A | code-simplicity reviewer 接 JSON findings + 条件化调度 | 扩既有表面 | 无（JSON 化部分） | 确认缺口：reviewer 仍输 Markdown，persona-catalog 未列 |
| P0-B | PRD / closeout / eval 证据闭环兑现（report-friendly，不升语义 gate） | 兑现既有机制 | 无 | 部分超越：自动 scorecard 已 settled，改走 fresh-source eval + 脚本 |
| P0-C | P-friction 样本审计 | 净新增证据采集 | 无 | gap：无样本，无超越 |
| P0-D | 端到端 replay corpus（3-5 篇 PRD→plan→work→review report） | 净新增外部可验证证据 | 无 | gap：仅 1 篇模板设想，最缺 |
| P1-A | plan 轻量 Minimal Implementation Contract（Markdown，include-when-material） | 净增轻能力 | 无 | 确认缺口：plan-template 无此段 |
| P1-B | work Minimality Preflight（补 Phase，不新增 artifact） | 净增轻能力 | P1-A（引用其 Reuse First） | 确认缺口：仅有 "Simplify as You Go" 隐性原则 |
| P1-C | work 默认接入 docs/solutions recall 候选 | 对齐 debug 已有能力 | **P0-C（须先证 missed-recall 痛点）** | 确认缺口：work 仍是信任边界，非默认扫描 |
| P1-D | review 条件门（spec-compliance first）+ task handoff 完整性 | prose 加固 | **P0-C（须先证失败交接实例）** | 部分已存在：review_gate 机制已在，顺序门未显式化 |
| P1-E | agent/tool/MCP security 交叉 lens | 净增 persona 触发 + 威胁 prose | 无 | 确认缺口：无该交叉 lens；config-protection 建议须改写 |
| P1-F | compound 沉淀 minimal-implementation learning | 用现有 enum | 无 | 确认可行：invalidation_condition/best_practice 已在 schema |
| P2 | behavior contract + Delta / adoption proof / workflow 平台化 | 高杠杆但后置 | P0-C + P0-D 证据 | 维持后置 |

**净增成本聚合提示**：P1-A/B/C/E 与 P1-F 合计向 `spec-plan` / `spec-work` / `spec-code-review` / `spec-compound` 各加一段 prose，对内部工具（用户无法 opt-out 的认知负荷）是核心 workflow prose 面的一次显著加厚。其中 MIC（include-when-material）、Minimality Preflight（提醒非 gate）是**弱强制 prose**，恰是角色契约 §4 点名"响亮约定在缺机器约束时最易被静默放行"的脆弱形态。因此 §0 第 1 点"不是加能力"的准确表述应是：**本轮优先低成本净增 + 兑现，后置高成本结构赌注（behavior contract）**——这些 P1 是 net additions，不是零成本"收紧"。落地时应据高频度砍到真正必要的 2-3 个，其余进 backlog 或 explicit opt-in（见各项非目标）。

---

## 2. P0-A：code-simplicity reviewer 接 JSON findings + 条件化调度

### 研究建议（ponytail）
`spec-code-simplicity-reviewer` 已存在但输出 Markdown，进不了 `spec-code-review` 的 JSON findings pipeline，且 reviewer selector 不含它、缺条件化调度。升级为 JSON 输出 + 接入条件化 selector。

### 当前 source 真相（已复核）
- `agents/spec-code-simplicity-reviewer.agent.md`：输出格式确实是 Markdown（`## Simplification Analysis` / `### Code to Remove` / `### YAGNI Violations` / `### Final Assessment`，第 63-93 行）。它已经有相当成熟的 "What you don't flag" 边界（current-consumer 抽象、framework-required structure、test doubles、readability-preserving expansion、spec-first workflow artifacts），这部分质量高，可直接保留。
- `skills/spec-code-review/references/findings-schema.json`：要求结构化 JSON findings（title/severity/file/line/why_it_matters/confidence/autofix_class/owner/requires_verification/pre_existing/suggested_fix）。Markdown 输出无法进入 Stage 5 merge/dedup/confidence-gate pipeline。
- `skills/spec-code-review/references/persona-catalog.md`：18 personas，**不含 code-simplicity**。`spec-code-review/SKILL.md` 的 reviewer 选择表（默认核心 + cross-cutting conditional + stack-specific）也未列它。
- 关键：CHANGELOG v1.11.4（2026-06-19 条）已经**记录了这是计划项**——"`spec-code-simplicity-reviewer` 被计划 JSON 化并接入 `spec-code-review`"。所以这是已识别、未落地的缺口，不是新发现。

### 判断
**P0，确认有效，扩既有表面**。这是 7 篇里唯一一个"源码缺口确认 + 已在 CHANGELOG 立项 + 改动面清晰"的项，确定性最高。
- 它直接服务角色契约 §4「review finding 是否成立」轻判断的质量，并让 simplicity 信号进入可 dedup/confidence-gate 的统一证据面。
- 严重度/置信度校准必须用 ponytail 给的矩阵思路：未支撑抽象=P1/75、单消费者=P2/75、可安全删=P2-P3/100、纯风格偏好=suppress/≤25。这与 findings-schema 的 5 档 anchor（0/25/50/75/100）天然对齐。
- **条件化调度是重点，不是默认全量**。触发判据分两组：**(组1，不依赖 P1-A)** diff 类型（有无新增抽象/新文件/复杂度上升）+ Stage 3 scale-aware preflight 已有的 `non_test_non_generated_non_lock_line_count` 等事实 + 用户显式要求；**(组2，依赖 P1-A)** plan 的 Minimal Implementation Contract（见 P1-A）。组1 是真正独立可先做的 fallback 触发；组2 是 P1-A 落地后的增量。避免在 docs-only / 小 diff 上无意义 fan-out。

### 最小落地顺序
1. 改 `agents/spec-code-simplicity-reviewer.agent.md`：输出切换到 findings-schema JSON（保留现有 "What you don't flag" 边界作为 suppress 规则），加入校准矩阵。
2. `persona-catalog.md` + `spec-code-review/SKILL.md` 的 reviewer 选择表 prose（Stage 3 cross-cutting conditional 段）：把 code-simplicity 列为 **cross-cutting conditional** persona，写明组1 触发条件（不是默认核心）。条件化 selector 逻辑只扩写该 prose，不引入新脚本或新字段。
3. `spec-code-review/evals/examples.json` 补 false-positive guard 用例（Phase 0 eval）——遵循文件已有 `spec-first.workflow-eval-fixtures.v1` envelope（`input`/`coverage_tags`/`expected_outcome`），不新建文件。
4. focused contract test：锁定 persona-catalog 与 SKILL.md selector 一致、JSON schema 合规。
5. （P1-A 落地后）补组2 MIC 触发判据。
6. 验证：`npx jest tests/unit/<spec-code-review 相关>`、`npm run lint:skill-entrypoints`。

### 非目标
不新建 public skill；不把 LOC 当唯一指标；不让 simplicity reviewer 默认对每个 diff 跑；条件化 selector 仅扩写 `spec-code-review/SKILL.md` 已有 reviewer 选择表 prose，不引入新脚本/新字段。

---

## 3. P0-B：证据闭环兑现（PRD / closeout / eval）—— 但要按 source 现状改写

### 研究建议（6/19 综合 + 6/20 STORM）
建 PRD live semantic eval v1（10-20 brownfield fixtures 跑 live 输出，对比 baseline，多维打分）；扩 PRD checker 到 report-friendly closeout；产 replay corpus 证明需求开发质量提升。

### 当前 source 真相（已复核）
- `skills/spec-prd/scripts/check-prd-artifact.js`（297 行）确实存在：检查 core sections、evidence tags、requirement/acceptance/nfr IDs、uncovered_requirements、feature_slice_trace_gap、placeholder_line_count。**确定性 checker 已就位**。
- `docs/validation/spec-prd/output-eval-2026-06-20-checker-delta.md`：5 个 recorded_fixture，`model_executed: false`，`authority_level: advisory`。它自己声明"不证明 live LLM 调用会稳定产出 with-skill 变体"。
- **自动 scorecard 已 settled out-of-scope（须区分证据强度）**：`skills/spec-prd/references/evaluation-governance.md` Promotion Boundary（source-of-truth）把**"自动化 output-eval scorecard（live brownfield / with-skill vs baseline / blind A/B）"记录为 over-engineering、settled out-of-scope**，CHANGELOG v1.11.4（2026-06-21 15:20）是该决策落地后的辅助记录。理由对齐角色契约「Scripts prepare, LLM decides」「可信证据 > 自动化便利」。输出质量改由 **dispatched fresh-source eval + 两个确定性脚本（check-prd-artifact / check-glossary-drift）+ contract tests** 验证。
  - **证据强度限定（doc-review 修正）**：该 out-of-scope 结论与其落地批次（yao-gate）同作者同日，"经对抗验证否决"的评审结论写在被论证的 artifact 内部，**无独立留存的对抗评审产物可回溯**。因此本文档不把它当"终局不可重开"，而是：当前依据下不照搬自动 scorecard；若 6/20 P0 的提出者拿出新证据（如自评 eval 长期不足以支撑外部 claim），此 out-of-scope 可按 §11 修订纪律重开。
  - 因此 6/20 的 P0「build 自动化 PRD live semantic eval v1」**当前不照搬**。正确的兑现形态是：(a) 把 checker scorecard 做成 **report-friendly closeout**（不升级为语义 gate）；(b) 用 `docs/contracts/workflows/fresh-source-eval-checklist.md` 的 dispatched fresh-source eval 承载 live/semantic 判断，并把结论按 supersede 约定归档到 `docs/validation/spec-prd/`（已有先例：6/21 的 fresh-source-eval 归档）。
- `skills/spec-plan/SKILL.md:177` 已有 PRD handoff entropy check（canonical term / source-of-truth / domain ownership / hard decision / missing slice acceptance·source·scope → route to PRD refine 或 emit inline PRD feedback candidate）。这条 6/20 列的"PRD miss feedback 只在 plan 边界"**已部分实现**。
- `docs/contracts/workflows/honest-closeout.schema.json`（honest-closeout.v1）+ `verification-run-summary.schema.json`（verification-run-summary.v1）+ `src/cli/helpers/{honest-closeout,verification-run-summary,verification-profile}.js` 实现齐全，被 `spec-work` Phase 4 closeout 消费。**closeout 机制就位**。
- eval 语料：22 个 fixture 文件分布在 13 个 skill。但都是 recorded / examples-as-context，无 live model-executed corpus。

### 判断
**P0，但形态要改写**。角色契约 §10「aspirational 推进义务」明确：机制就位不等于效果证明，但"诚实降级不等于无限期搁置"。P0-B 收两件**改动面小、可独立验收**的事（端到端 replay corpus 成本最高，已拆为独立 P0-D，见下节）：
- **report-friendly closeout（P0-B-1，做）**：把 check-prd-artifact 的 scorecard 接进 PRD readiness 的 closeout summary（`spec-prd/SKILL.md` Phase 4 已 close with a PRD summary，可扩字段），保持 advisory，不卡 gate。
- **fresh-source eval（P0-B-2，做，替代自动 scorecard）**：把 6/20 想要的"live/semantic 质量证明"实现为 dispatched fresh-source eval 的周期性运行 + 归档，符合已 settled 的治理决策。须设可证伪退出判据，否则 P0-B 会塌缩成"维护者自评维护者技能"的自指循环——这正是它否决自动 scorecard 时的同一条理由（自评不是 provider-backed 证据，见 §3b 自指风险）。
- **自动化 live scorecard（不做）**：当前依据下 settled out-of-scope（重开条件见上）。

### 最小落地顺序
1. 扩 `spec-prd` PRD summary closeout 字段，复用 check-prd-artifact 已产的确定性事实（advisory）。主引用 `evaluation-governance.md` Promotion Boundary，CHANGELOG 为辅。
2. 按 `fresh-source-eval-checklist.md` 跑一轮 PRD live fresh-source eval，归档到 `docs/validation/spec-prd/`，并设退出判据（如"连续 N 轮无 concern"或"≥1 篇经非作者/blind 评审"才算效果已兑现）。
3. README / docs 对外表达强调 evidence loop，不宣传"自动提效"。

### 非目标
不建自动化 live scorecard；不把 checker/eval/report 写成业务 ROI 证明；不把 PRD checker 升级成语义 gate；完成 P0-B-1/B-2 不等于完成证据闭环（replay corpus 是 P0-D 的独立验收）。

---

## 3b. P0-B 与自指证据风险（doc-review 新增）

P0-B/P0-D 的整条"证据闭环"目前都由**维护者自评、自跑、自归档**：`docs/validation/spec-prd/` 下 9 份 eval 全部单作者，最新一份是 `passed-with-concerns`；`evaluation-governance.md` 自承"not public-claim-ready...until blind output review and reviewer-scored output evidence exists"。replay corpus 同样由维护者自产。

风险：若 fresh-source eval 与 replay 长期停在 `passed-with-concerns` 且无 blind/外部评审介入，"证据闭环"会塌缩成"维护者自评维护者技能"——它能证明结构/行为不退化，但永远证明不了角色契约 §1 真正要的"外部可试、可评估、用户真实研发增益"。这与本文档否决自动 scorecard 的理由（自评不算 provider-backed 证据）前后一致地适用于 P0-B 自身。

落地约束：P0-B-2 与 P0-D 必须各带一个**可证伪的外部性退出判据**（至少 1 篇/1 轮经非作者或 blind 评审），否则只是把自评换了个名字。

---

## 4. P0-C：P-friction 样本审计

### 研究建议（6/20 STORM，gap 级）
选 10+ 真实 run/session 样本，分类入口摩擦、上下文重复、PRD 过重、task-pack 成本、review 等待、verification not-run、final response 不清。这是判断"该减流程还是加默认"的前置证据。

### 当前 source 真相
- 这是纯 gap：仓库无 friction 审计样本，无超越，也无已实现机制。
- 相关 raw 证据面已存在但**覆盖面有限**：`.spec-first/workflows/spec-work/spec-first/<run-id>/run.json` 实存 31 份，但**全部在 `spec-work/spec-first/` 下，是 spec-first 团队对自身仓库的 dogfood run，零外部/多样用户 session**。
- **样本类型错位（doc-review 修正）**：run.json 是 closeout artifact，不是 session transcript。7 类摩擦里只有 **task-pack 成本、verification not-run** 能从 run.json 读出；**入口摩擦、上下文重复、PRD 过重、review 等待、final response 不清**需要会话级 trace，run.json 覆盖不到。P1-C/P1-D 依赖的"docs/solutions 存在但 work 未召回"的 missed-recall trace **也不在 run.json schema 内**。

### 判断
**P0，净新增证据采集，但低成本**。它不新增 source-of-truth 表面，只是采集 + 归档分析，回退成本几乎为零。它是消解"该减流程还是加默认"这个最大分歧的唯一前置证据，价值高。建议作为一次性 audit 文档（`docs/项目审查/` 或 `docs/validation/`），不固化成 runtime 机制。
- **方向中立性限定**：当前全部 P1 都是"加"（MIC、preflight、recall、security lens、compound、review 门），无一交付"减流程"。若 P0-C 结论是"流程过重、该减"，现有 P1 清单无一能兑现。因此 P0-C 不应被当成已焊死方向的装饰——它必须有能否决一批"加默认"类 P1（P1-A/B/C）的权力，否则就明确标注"本轮方向已定为收紧，P0-C 仅用于排序"。

### 最小落地顺序
1. 定义 friction 分类（7 类），并按证据来源分两组：**run.json 可支撑类**（task-pack 成本、verification not-run）与**需会话 transcript 类**（入口、上下文重复、PRD 过重、review 等待、final response 不清）。
2. 采集 ≥10 样本，**含非自托管来源**（否则结论仅对 spec-first 自身 dogfood 有效，须如此标注）；missed-recall trace 单列证据来源，不挂 run.json。
3. 用结论校准 P1 排序，并明确 P0-C 是否否决任何"加默认"类 P1。

### 非目标
不建 runtime friction tracker；不把 audit 当 adoption ROI 证明；不把自托管 dogfood 结论当作普适用户摩擦证据。

---

## 4b. P0-D：端到端 replay corpus（doc-review 从 P0-B 提升为独立 P0）

### 来源与提升理由
原列为 P0-B 的第三子项、目标仅"1 篇模板"。doc-review（scope + product reviewer 一致）指出：replay corpus 是**唯一直接服务角色契约 §1「可外部验证性」**的产物，且成本高于其余 P0 项之和，埋成子项会导致"完成低成本子项即宣告 P0-B 完成"。因此提为独立 P0-D，给真实目标。

### 内容
3-5 个端到端 PRD→plan→work→review replay report，覆盖不同场景（至少含一个 brownfield 增量、一个 bugfix），归档到 `docs/validation/`。每篇记录：输入、各 workflow 节点产出、最终 closeout、与 no-spec-first baseline 的对比观察。

### 判断
**P0，净新增证据，成本最高**。它是 §1「能力强但不可见、不可试、不可评估是真实失败模式」的直接对治。但受 §3b 自指风险约束：至少 1 篇须经非作者/blind 评审，否则与被否决的自动 scorecard 同属"自评不算 provider-backed 证据"。

### 最小落地顺序
1. 先产 1 篇模板 replay report，验证可行。
2. 补 2-4 篇覆盖不同场景。
3. 至少 1 篇挂 blind/非作者评审作为外部性退出判据。

### 非目标
不把 replay report 写成 adoption ROI 证明；不把单作者自评当外部验证。

---

## 5. P1-A：plan 轻量 Minimal Implementation Contract

### 研究建议（ponytail）
`spec-plan` 引入轻量 Minimal Implementation Contract markdown section（Required Now / Reuse First / Not Yet / Smallest Verification Loop / Escalation Trigger），include-when-material，非硬必填。

### 当前 source 真相（已复核）
- `skills/spec-plan/SKILL.md` + `references/plan-template.md`：**无** "Minimal Implementation"/"Reuse First"/"decision ladder" 章节。plan 的 Core Principle 4 是 "Right-size the artifact"，但没有显式的"复用优先 / 写前最小必要性"合约。
- plan 已有大量结构（Implementation Units、Test scenarios、Direct Evidence block、Plan Quality Bar），新增 section 必须轻量，不能再加重 plan 体量。
- CHANGELOG v1.11.4（2026-06-19 条）已记录"`spec-plan`/`spec-work` 最小实现边界已限定为轻量 Markdown 语义合同"——说明方向已被项目接受为 Markdown 而非 schema。

### 判断
**P1，确认缺口，扩既有表面**。关键纪律来自角色契约 §3「Light contract」与 §10「简单机制 > 完整框架」：
- 必须是 **Markdown section，不是 schema 字段**（不碰 plan frontmatter，不碰 task-pack）。
- **include-when-material**：只在工作有真实过度设计风险时出现，不是每个 plan 都生成大段模板。Lightweight plan 默认不带。
- 决策梯子（存在性 → stdlib → native platform → installed dependency → one-line → minimum works）作为 plan 的写前指导，而非脚本判定。
- 安全边界硬约束：永不把"最小化"做成删 validation / error handling / security / accessibility。

### 最小落地顺序
1. `references/plan-template.md` + `plan-sections.md`：加 optional `## Minimal Implementation Contract` section（Required Now / Reuse First / Not Yet / Smallest Verification Loop / Escalation Trigger），标注 Include When Material。
2. `spec-plan/SKILL.md`：在 Phase 3/4 加一句触发指引，不展开模板正文。
3. 补 evals + focused test。

### 非目标
不加 frontmatter / task-pack 字段；不让每个 plan 生成；不让 script 判断"是否过度设计"。

---

## 6. P1-B：work Minimality Preflight

### 研究建议（ponytail）
`spec-work` 增加 Minimality Preflight 紧凑检查（5 条 before-editing 问题，补进 Phase 1/2，不新增 artifact）。

### 当前 source 真相（已复核）
- `skills/spec-work/SKILL.md`：有 "Simplify as You Go"（第 479-485 行，每 2-3 unit 后复审简化），有 "Feedback Loop And Vertical Slices"，有 Anti-Rationalization Red Flags 表。但**没有显式的写前最小必要性 preflight**——simplify 是事后的，preflight 是事前的。
- work 已有 "If a simplify skill or equivalent capability is available, use it"（第 485 行）——已经预留了 simplify 能力挂点。

### 判断
**P1，确认缺口，扩既有表面**。这是 P1-A 的执行侧对偶：plan 定 contract，work 在动手前做轻量自检。
- 复用现有 Anti-Rationalization Red Flags 表的形态（已是表格 + "这是注意力提醒,不是 gate"声明），把 Minimality Preflight 作为同类 attention hardening 补进 Phase 1/2，**不新增 artifact、不新增 gate**。
- 与决策梯子呼应：动手前问"是否已有可复用能力 / stdlib / 现成依赖 / 最小可行实现"。

### 最小落地顺序
1. `spec-work/SKILL.md` Phase 1 或 Phase 2 加紧凑 Minimality Preflight（≤5 条，表格或清单），明确"提醒非 gate"。
2. 若 plan 带了 Minimal Implementation Contract（P1-A），preflight 引用它的 Reuse First / Escalation Trigger。
3. 补 evals。

### 非目标
不新增 artifact；不变成硬 gate；不强制对 trivial / 纯配置任务跑。

---

## 7. P1-C：work 默认接入 docs/solutions recall 候选

### 研究建议（6/19 + 6/20）
debug 已默认扫 `docs/solutions/`，但 work 仍只是"召回信任边界"，没有同等默认扫描入口步骤——这是 work 最容易重犯历史经验的地方。

### 当前 source 真相（已复核）
- `skills/spec-debug`（第 84 行）：**已确认** debug 默认直接扫 `docs/solutions/` frontmatter（flat scan，不 spawn subagent），skip 仅限 Trivial-bug fast-path。
- `spec-work/SKILL.md`："Recall Trust Boundary"（第 110-112 行）把 docs/solutions 召回定义为 advisory candidate，要回源确认——但这是**信任边界，不是默认召回入口**。work 的 docs/solutions 召回主要靠从 `spec-plan` Phase 1.1 带入（`spec-learnings-researcher` / `docs/solutions/` 在 plan 阶段扫）。
- 即 work 自身缺一个 debug 那样的"default-on orientation scan"步骤。

### 判断
**P1，确认缺口，对齐 debug 已有能力**。这是用 debug 已验证的 default-on / skip-on-fast-path 形态，平移到 work 的 Context Orientation。
- 必须保持 advisory + 回源（work 已有 Recall Trust Boundary，直接复用）。
- 形态对齐 debug：corpus 小则 flat 扫，不 spawn recall subagent；corpus 增长后再升级到 `spec-learnings-researcher`（与 debug 的 knowledge-harness OQ-2 信号一致）。
- 注意 P0-C 的前置价值：先有 missed-recall trace 样本（6/20 待核验清单第 4 项：找 2-3 个 docs/solutions 存在但 work 未召回的真实案例）更能证明这条值得做。

### 最小落地顺序
1. 先做 P0-C 里的 work missed-recall trace 取样（2-3 例），确认痛点真实。
2. `spec-work/SKILL.md` Context Orientation Anchor（第 63 行）加 default-on docs/solutions 候选扫描步骤，复用 Recall Trust Boundary；**须明确新增 default-on scan 与既有"从 `spec-plan` 带入召回"路径的关系**（避免 work 与 plan 双重召回或冲突）。
3. 补 evals。

### 非目标
不把召回命中当 confirmed truth；不在 work 默认 spawn recall subagent。

---

## 8. P1-D：review 条件门 + task handoff 完整性

### 研究建议（ECH + 6/19）
当存在 derived task / plan spec 时，review 应先查 origin faithfulness / spec compliance，再查一般代码质量；spec-less 走风险优先 fallback。task handoff 须含完整任务文本、源路径、验收、验证命令。

### 当前 source 真相（已复核）
- task handoff **已相当完整**：`src/cli/task-pack.js` 共 20 个字段——8 个 `REQUIRED_TASK_FIELDS`（task_id/dependencies/files/goal/test_focus/done_signal/wave/stop_if）+ 12 个 optional（source_unit/requirement_refs/context_refs/entry_hint/parallelizable/expected_side_effects/risk_note/notes/review_gate/review_focus/handoff_owner/target_repo）。ECH 担心的"完整任务文本/源路径/验收/验证命令"字段**基本都在**。（注：CHANGELOG 某条曾述"22 字段"为口径偏差，以源码 8+12=20 为准；落地 contract test 须按实际字段列表写。）
- review 条件门**部分已存在**：`spec-work/SKILL.md` 的 `review_gate: required` 机制（第 211-216 行）已要求 task 完成前跑 `spec-code-review mode:report-only base:<pre_task_base> plan:<source_plan>`，并携带 review_focus。`spec-code-review` Stage 2b 已有 plan discovery + requirements 验证，Stage 6 验证 requirements completeness。
- 但 review 内部**未把"spec-compliance first 再 code-quality"显式排序**为一个条件门——目前是并行 persona，requirements 验证是 Stage 6 additive。

### 判断
**P1，prose 加固，部分已存在**。改动面比研究文档预估的小，因为字段和 review_gate 机制都在。真正缺的是：
- 在 `spec-code-review` 显式化"当 plan_explicit / derived-task 时，origin faithfulness & spec compliance 先于一般代码质量"的顺序。
- ECH 的 `spec-task-handoff-reviewer` 新 agent 建议：**不新增**。task-pack 字段已足，handoff 质量可由现有 `spec-project-standards-reviewer` + work 的 context_refs 质量边界（第 199 行已有"低质量 handoff 标记"）覆盖。新增 agent 违反角色契约 §7「是否在重建宿主即将免费提供的能力 / 是否有更小方案」。
- 前提（ECH 自己也说）：须先验证 spec-first 侧真有失败交接实例，否则只是 prose 加固。这一点并入 P0-C 审计。

### 最小落地顺序
1. P0-C 审计确认是否有真实失败交接 / spec 漂移案例。
2. 若有，`spec-code-review` Stage 6 或 Stage 3 加一句条件门排序（spec-compliance first when plan_explicit）。
3. 不新增 agent。

### 非目标
不新增 `spec-task-handoff-reviewer`；不扩 task-pack 字段。

---

## 9. P1-E：agent/tool/MCP security 交叉 lens（config-protection 建议须改写）

### 研究建议（ECH）
新增 `spec-agent-tool-security-reviewer` 作为 native-reviewer + security-reviewer 交叉 lens（不新增 agent），威胁清单补 prompt injection / tool abuse / MCP-output-as-instruction / 供应链 / runtime-mirror 篡改 / 数据外发，硬约束"check-secrets 无告警≠通过"。把 config-protection（exit 2）重排为 P1 确定性 gate。

### 当前 source 真相（已复核，含纠正）
- `spec-code-review` 已有 `spec-security-reviewer`（cross-cutting conditional）和 `spec-agent-native-reviewer`（默认核心）。两者**未交叉**成一个 agent-tool-security lens。
- **纠正 2（关键）**：`config-protection` 在 spec-first source 里**不存在**。grep 全仓只在 `CHANGELOG.md` 和 ECH 研究文档自身出现。spec-first 的安全 deterministic 面是 `src/cli/helpers/secret-deny-patterns.js` + `src/cli/contracts/security/secret-deny-patterns.{schema.json,json}`，以及角色契约 §4 的 mutation gate / source-runtime gate（由 hook/script 机械强制）。
  - 所以 ECH"把 config-protection 重排为 P1 gate"**无法照搬**——那是 ponytail/ECH 外部 hook。落到 spec-first 应改写为："强化既有 mutation gate / secret-deny-patterns 的覆盖与文档化"，而不是引入新 hook。

### 判断
**P1，扩 persona 选择，但 config-protection 建议必须改写**。
- 交叉 lens 部分（做）：把 agent-tool-security 作为 `spec-code-review` 的 cross-cutting conditional 触发条件（diff 触碰 MCP/provider 调用、tool 定义、runtime mirror、外发网络、依赖新增时选中），由现有 security + agent-native persona 协同，**不新增 agent**。威胁清单补齐 ECH 列的六类。
- 硬约束（做）：findings 里写明"check-secrets / secret-deny-patterns 无告警 ≠ 安全通过"，与角色契约「advisory 不当 confirmed」一致。
- config-protection（改写）：不引入新 hook。把"allowlist/override 须 source-controlled + 人类可写 + AI 不可写"的精神，对照已有 mutation gate / source-runtime gate 表达，若确有 override 配置面缺口再单独立项。

### 最小落地顺序
1. `persona-catalog.md` + `spec-code-review/SKILL.md`：加 agent-tool-security 交叉 lens 触发条件（复用 security + agent-native，不新增 agent）。
2. 补六类威胁清单 + "无告警≠通过"硬约束 prose。
3. config-protection：先核查 secret-deny-patterns / mutation gate 是否已覆盖 override 场景，再决定是否单独立项；**不移植外部 hook**。

### 非目标
不新增 security agent；不移植 ponytail/ECH 的 config-protection hook；不让 script 做安全语义裁决。

---

## 10. P1-F：compound 沉淀 minimal-implementation learning

### 研究建议（ponytail）
`spec-compound` 沉淀 minimal-implementation learning，用现有 best_practice/convention + pattern + invalidation_condition 映射"可追踪债务"（ponytail comment → spec-compound pattern + invalidation_condition + source_refs）。

### 当前 source 真相（已复核）
- `skills/spec-compound/references/schema.yaml`：双 track（bug / knowledge）；knowledge track 含 `best_practice` / `convention` 等 problem_type；`invalidation_condition` 字段已定义（第 221 行）且在 required 中（第 232 行）；"New promoted solution docs must include invalidation_condition and source_refs"（第 253 行）。**所需 enum 与字段全部已在 schema**。

### 判断
**P1，确认可行，零 schema 改动**。完全用现有 enum + 字段即可，符合角色契约 §10「最小机制」。
- 不新增 compound problem_type enum（ponytail 自己也说 knowledge 是 track 名非 enum）。
- 这是把"最小必要性"经验沉淀回知识层，闭合 Codebase→...→Knowledge 链路的最后一环，但价值低于 P0/前几个 P1，排在 P1 末位。

### 最小落地顺序
1. `spec-compound/SKILL.md` + `resolution-template.md`：加一段指引，把 minimal-implementation learning 映射到 best_practice/convention + invalidation_condition + source_refs。
2. 补 evals。

### 非目标
不新增 problem_type enum；不改 schema。

---

## 11. P2：明确后置，不要先做

- **Behavior contract + Delta（活契约 + delta）**：4 篇都承认最高长期杠杆。**诚实表述后置理由**：它后置的首要理由是**成本与回退风险**——净新增 source-of-truth 表面、一旦加错回退成本高（角色契约 §7「是否导致多真相源」+ §10「更小可维护方案优先」），不是"痛点未证"。痛点未证这一点对本轮多个 P1（P1-C/P1-D）同样成立，那些项靠 P0-C 解锁而非压到 P2；用更高举证标准单独压制最高杠杆项是非对称证据门，应避免。**进入条件**：P0-C friction 审计 + P0-D replay corpus 暴露纵向行为真相缺失为高频痛点，**且**有迹象表明轻量 prose 增项（本轮 P1）无法覆盖该痛点——即结构性新机制的成本此时才被证据正当化。
- **身份定位赌注（显式记录）**：本轮 deliberately 选择 **prove-and-tighten** 定位（兑现既有机制 + 轻量收紧），把 spec-first 这一周期定位为"证明并收紧型 harness"而非"行为真相平台"。behavior-truth 平台化是**下一周期的显式重估项**，不是被永久搁置（对齐 §10 aspirational 推进义务）。
- **adoption proof（demo/playbook）**：核心 contract 稳定后再做。
- **workflow profile / extension 平台化**：等核心 contracts 稳定，避免先做平台化（角色契约 §7「是否在重建宿主即将免费提供的能力」）。
- **graph evidence primary upgrade**：维持 advisory 定位。

---

## 12. 落地依赖图（建议执行序）

```text
P0-C friction 审计 ──┬──> 校准/可能否决 P1-C（work recall 痛点确认）
                     ├──> 校准/可能否决 P1-D（失败交接实例确认）
                     └──> 与 P0-D 共同 gating P2

P0-D replay corpus ──> §1 可外部验证性的直接证据（含 ≥1 篇 blind/非作者评审退出判据）

P0-A1 simplicity JSON 化 + 组1 触发（diff 类型 / Stage 3 facts）──> 真独立，可先做
P0-A2 simplicity 组2 触发（消费 P1-A MIC）──> 排在 P1-A 之后

P0-B 证据闭环 ──┬──> P0-B-1 report-friendly closeout（扩 spec-prd summary）
               └──> P0-B-2 fresh-source eval 归档（替代自动 scorecard，带退出判据）

P1-A plan MIC ──┬──> P1-B work preflight（执行侧对偶）
               └──> 供 P0-A2 simplicity 组2 触发判据

P1-E security 交叉 lens ──> 复用 P0-A 的 persona-catalog 改动批次（可并行 P0-A）

P1-F compound ──> 末位，零 schema 改动

P2 behavior contract + Delta ──> 阻塞于 P0-C + P0-D 证据；后置首因是成本/回退风险
```

执行建议（按**杠杆 × 可见性**，非确定性）：
1. **先并行起步**：P0-D 的第 1 篇 replay report（§1 可见性最直接证据）+ P0-C friction 审计（解锁并可能否决多个 P1）。
2. **暖场可同期**：P0-A1（确定性最高、纯内部接线，作为低风险暖场而非高优先级）+ P0-B-1/B-2。
3. **据 P0-C 结论**再决定 P1-A/B/C/E/F 中真正必要的 2-3 个（其余进 backlog）；P0-A2 待 P1-A 落地。
4. **P2** 待 P0-C + P0-D 证据稳定后按成本重估。

> 注：P0-A 标"可先做"仅指 P0-A1（JSON 化 + 组1 触发）；P0-A2 的 MIC 触发依赖 P1-A，不在"可先做"范围内——避免把整个 P0-A 误当作全部独立而提前做成半残或返工。

---

## 13. 验证状态声明

本文档的所有 source 判断均来自当前 worktree（分支 `leo-2026-06-20-yao-gate`）直接读取，已核验文件：

- `docs/10-prompt/结构化项目角色契约.md`（完整读）
- `skills/spec-prd/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-work/SKILL.md`（完整读）
- `skills/spec-code-review/SKILL.md`（前 824 行）、`references/persona-catalog.md`（完整读）
- `agents/spec-code-simplicity-reviewer.agent.md`（完整读）
- `src/cli/task-pack.js`（字段定义段）、`skills/spec-compound/references/schema.yaml`（grep 确认）
- `skills/spec-debug`（grep 确认 docs/solutions 默认扫描）
- `agents/` 计数（51）、`config-protection` 全仓 grep（确认 source 中不存在）、`CHANGELOG.md` head（确认 settled 决策与立项记录）
- `.spec-first/workflows/spec-work/spec-first/` run.json 计数（31 份，全为自托管 dogfood）、`docs/validation/spec-prd/` eval 计数（9 份，均单作者）、`src/cli/task-pack.js` 字段（8 REQUIRED + 12 optional = 20）、ECH 报告 config-protection 措辞（第 246、339 行自标外部+未复核）

**两处研究建议改写的证据独立性差异已在 §0 第 2 点如实标注**：config-protection 有一条与作者无关的机械证据（全仓 grep），且本质是继承 ECH 自己的 caveat 而非纠错；scorecard out-of-scope 是同作者同批次单方治理决策，无独立对抗评审 artifact，已保留"带新证据可重开"的口子，未武断终局化。

**本文档经一轮 `spec-doc-review` 多 persona 审查**（coherence / feasibility / product-lens / scope-guardian / adversarial），feasibility reviewer 独立回源逐条复核 7 条 source 声明为真（置信 100）；产品/对抗/范围 reviewer 的高一致发现（replay corpus 应独立为 P0、执行序应按杠杆而非确定性、证据门对称化、净增成本聚合、P0-C 样本来源限定、依赖阻塞可见化、P0-A 拆分）已在本轮修订采纳。

**两处对研究文档的纠正**（config-protection 不存在、自动 PRD scorecard 已 settled out-of-scope）均有 source / CHANGELOG / 治理 reference 三重依据。

**未执行**：未运行 fresh-source eval 验证 skill 行为语义（本文档是判断综合，非 skill 行为改动）；本文档为 docs-only，结论待各 P0/P1 实施时按 source 改动逐项验证。

## 14. 变更说明

新增本文档属 docs-only 研究综合产物，按仓库规则同步更新 `CHANGELOG.md`。本文档不改任何 source/skill/agent/runtime，无 schema/consumer 影响，不触双宿主 runtime 生成。
