# Skill 1 深度分析报告：spec-plan

**Skill 名称**：spec-plan（skills/spec-plan/）
**分析者**：Skill 优化项目执行者（AI agent，zcode）
**分析日期**：2026-11-03
**耗时**：约 1.5 小时（agent 口径；人工口径约 8h 等价阅读量：SKILL.md 124 行 + 核心 references 950+ 行 + eval 资产 + 合同测试面）
**方法**：core/12-phase05-skill-deep-dive.md 四步法
**分析时点源码状态**：含 S04 修复（28b19305，2026-11-02）；Phase 0 案例时点（10-08~10-27）不含 S04，已标注

---

## Step 1: 源码全面阅读（结构、流程、验证门）

### 1.1 文件结构

| 层 | 文件 | 行数 | 职责 |
|---|---|---|---|
| 入口 | SKILL.md | 124 | 工作流契约、Planning-Only 安全契约、Phase 0-5 路由 |
| 核心合同 | references/plan-sections.md | 481 | 统一 plan artifact 合同、Section ID Registry、implementation-ready 硬底线、prose economy |
| 核心合同 | references/final-review.md | 157 | 5.1 写前自审（35+ 项）、5.1.5 范围综合门、5.2 写盘、5.3 置信检查与加深 |
| 交接 | references/plan-handoff.md | 126 | 5.3.8 文档审查、5.3.9 终检、5.4 交付/handoff |
| 输入侧 | references/intake.md / resume.md / settled-decisions.md / research.md | 474 | 来源选择、Product Contract 字节保持、研究意图分类 |
| 结构 | references/structure.md / synthesis-summary.md / universal-planning.md | 783 | 单元构成、范围综合、非软件/答案寻求分支 |
| 条件镜头 | high-risk / interface-and-evolution / frontend / approach-altitude | ~300 | 按触发条件加载的专项合同 |
| 证据 | planning-evidence-boundaries.md / output-contracts.md / output-mode.md | 160 | provider 不可信、Direct/Chat/Durable 门 |
| 派发 | references/agents/（16 个） | — | 研究型 subagent prompt 资产 |
| 评测 | evals/（9 行为案例 + 26+ output-quality 案例 + consumer-replay） | — | intake/路由行为与输出质量合同 |

### 1.2 主流程与验证门（流程图）

```text
Phase 0 复用/来源/范围 ── output-mode/resume/intake/settled-decisions
   │  (0.2 Product Contract 字节保持；0.5 产品阻塞门)
Phase 1 研究 ── research.md（意图分类；dispatch 需授权，缺授权=inline+记录）
Phase 2-4 问题/结构/组装 ── structure.md + plan-sections.md（U-ID 稳定；单元含
   │   Goal/Requirements/Files/Approach/Test Scenarios/Verification）
Phase 5 终审写盘交接
   ├─ 5.1  写前自审【门1：35+ 项内容质量清单】final-review.md
   ├─ 5.1.5 范围综合门（brainstorm-sourced 必发）【门2】
   ├─ 5.2  写盘（implementation-ready 元数据；status 保全）
   ├─ 5.3  置信检查（Lightweight/Standard/Deep + 2 个 override）【门3】→ 可选加深
   ├─ 5.3.8 文档审查【门4：强制，两格式都不可跳】spec-doc-review；Markdown=apply-fixes
   ├─ 5.3.9 终检清理
   └─ 5.4  按 scope 交付/handoff（plan-handoff.md）
```

**四道门是设计核心**：门1 生产者自审 → 门3 置信分级 → 门4 独立 doc-review。SKILL.md L106 与 final-review.md L153 均明示："Document review is mandatory for both formats — do not skip it because the confidence check passed. The two tools catch different classes of issues."

### 1.3 与 Phase 0 问题的关联定位（grep 证据）

| 检索 | 结果 | 含义 |
|---|---|---|
| 「Implementation Commands ↔ 单元覆盖对账」in final-review.md + plan-sections.md | **0 命中** | 门1 无跨集合一致性检查（units ↔ 计划级命令） |
| 「既有合同测试发现义务」（全 references） | **1 处且条件触发**（interface-and-evolution-lens.md:33） | 仅接口镜头要求找 repo 合同测试；无通用义务 |
| 「盲区/blind spot/不能确认」(references) | **0 命中** | Verification Contract 无「聚焦验证盲区类型」表述义务 |
| 「不重复扩大测试」（T01 计划中的原句） | **0 命中（skill 文本中不存在）** | 该句为模型自拟，非 skill 模板文本 |
| evals 9 行为案例 | 全部 intake/路由类 | 无验证合同对账类案例 |
| evals output-quality 26+ 案例 | goal-capsule/high-risk/interface/frontend/composition | 仅 1 例涉证据限制（unsupported-plan），无对账类 |

---

## Step 2: 设计意图理解

### 2.1 这个 Skill 要解决什么问题

把「HOW 未定」的工作变成 implementation-ready 统一 plan artifact（spec-unified-plan/v1）：Product Contract 字节保持（WHAT 归上游）、Planning Contract/KTD（技术决策单一 owner）、U-ID 单元（可独立执行）、Verification Contract（repo 具体命令，禁泛化 "run tests"）、DoD。

### 2.2 关键设计决策与理由

1. **三层质量系统而非单轮完美产出**——门1 自审 + 门3 置信 + 门4 强制独立 doc-review，明示"两工具捕获不同问题类别"。设计目标不是"一轮即过"，是"分层捕获"。
2. **单元 Verification 用结果表述、命令集中计划级**（structure.md:104,199）——单元描述 outcome，Verification Contract 承载 repo 命令。**代价：两层之间无对账义务**（见根因）。
3. **字节保持 Product Contract**——WHAT 归属上游，planning 不越权重写产品决策。
4. **条件触发镜头（high-risk/interface/frontend）**——重 ceremony 只在风险触发时加载（80/20）。
5. **planning-only 安全契约**——规划不执行代码/测试/提交。

### 2.3 Contract vs 实现（观测面）

- 合同测试齐全：spec-plan-{contracts,quality-contracts,reference-contracts,consumer-replay-contracts}.test.js 锁 reference 文本与输出合同（改动需同步更新——这是本仓库 source-first 纪律的正常成本）。
- eval 资产两层（行为路由 + 输出质量）与 references 一致。
- **未发现「合同写了但实现缺失」类问题**；发现的是「合同未覆盖的对账义务」（见 Step 3）。

---

## Step 3: 问题根因深挖（逐项验证 Phase 0 归因）

### 问题 1：首轮产出遗漏（T01：Implementation Commands 漏 U1 测试文件；4 轮审查修订）

- 出现频率：T01（4/9 任务属 M2 模式，本问题为其具体实例之一）
- 源码定位：`references/final-review.md` 5.1 清单（L11-35）——35+ 项全部是**内容质量**检查（形状/覆盖/粒度/触发镜头），**无跨集合对账项**；`references/plan-sections.md` L227-236 Verification Contract 段亦无
- 根因链：
  1. 直接原因：生产者组装命令清单时漏了一个单元的验证命令
  2. 更深层：门1 清单检查「每项内容好不好」，不检查「单元集合 ↔ 命令集合是否互相覆盖」——集合对账是**机械可判定**的不变量，恰是本仓「scripts enforce deterministic invariants」哲学应由合同显式强制的部分
  3. 最根本：清单范式 vs 对账范式的设计盲区——35+ 项内容检查无法通过累加捕获"两个集合不一致"
- **归因验证：⚠️ 部分准确，根因精确定位**。类别 skill_issue 维持；但「首轮质量不稳定」的模糊表述修正为「自审清单缺 2 条对账检查」这一可修复结构缺口

### 问题 2：聚焦验证盲区（T01：2 个断言回归未被方案命令覆盖，字节预算 4800→5600）

- 源码定位：plan-sections.md Verification Contract 要求「largest unproven risk / proof-intent / evidence authority / required-proof reconciliation」；final-review 5.1 无「触碰面 ↔ 既有合同测试」检查；grep「盲区」0 命中
- 事实核正：T01 方案**履行了**既有义务——V0-V4 表写了「能确认/不能确认」，也写了 largest unproven risk（指向宿主加载，而非断言回归）。即模型按合同行事，但命名的风险与实际最大盲区不同
- 根因链：合同有「风险陈述」义务但无「盲区枚举」义务；且无义务要求**发现管辖本计划触碰文件/字节的既有合同测试**（using-spec-first-contracts 的字节预算测试正是被触碰面——若方案命令含它，2 个回归在实施时即被捕获）
- **归因验证：⚠️ 部分准确**。原判 skill+model 各半维持，但 skill 侧缺口从「聚焦优先策略误导」修正为「缺两条结构义务」：①盲区类型表述；②触碰面合同测试发现。模型侧（未想到枚举盲区）为次因——结构修复后此判断负担被机械化

### 问题 3：「doc-review 兜底成常态」（T06：方案 v2 需 spec-doc-review 加固一轮）

- 源码定位：SKILL.md L106、final-review.md L153、plan-handoff.md——5.3.8 文档审查是**强制内建步骤**，Markdown 走 `mutation:apply-fixes`（发现即修）
- **归因验证：❌ 归因错误，修正**。审查轮不是缺陷信号，是设计的分层质量系统在工作（"The two tools catch different classes of issues"）。「一轮即过率」从来不是该 skill 的设计目标。修正后归因：**none（by-design 流程成本）**；摩擦点本身（多一轮时间成本）作为观察事实保留，但从 skill 缺陷清单移除

### 问题 4：方案缺语义筛查与准入合同（T10：CE 同步方案 CHANGES_REQUESTED，H1/H2 两个 High）

- 源码定位：plan-sections.md Verification Contract 已要求 required-proof reconciliation/evidence authority；但「机械聚合收口（count/hash）必须配语义筛查步骤」「分窗/部分准入必须有 admission contract + validator」无通用触发器；high-risk 镜头（认证/支付/迁移等）不覆盖 mass-sync 类触发
- **归因验证：⚠️ 需修正**。原判 skill_issue 主 + model 轻 → 修正为 **model_capability 主 + skill_issue 辅**：H1/H2 本质是领域设计深度（CE 同步特有的收口模型），强规划者可自行设计；skill 侧的可改进面是「机械收口/批量变更类触发器」缺失（可仿 high-risk lens 模式泛化），属次要增强非缺陷
- 修正依据：三 reviewer 的 findings 锚点全部指向方案内容设计（L75-136, 288-346），无一指向 skill 合同缺失；且该方案类（万行级上游同步）在 9 任务样本中仅 1 例

### 问题 5（范围外核验）：T04 审查 over-claim 归因

Phase 0 已判 model 主 + skill 轻（审查方法论侧），非 spec-plan 载体——本深读不修正，维持原判。

---

## Step 4: 优化方案设计

### 根因综合：首轮产出不稳定的机制性解释

> spec-plan 的质量系统是**三层四门**设计：自审清单（门1）→ 范围综合门（门2）→ 置信分级（门3）→ 强制独立 doc-review（门4）。Phase 0 观察到的「首轮修订多」中，**doc-review 轮是设计内成本**（问题 3 修正）；真正超出设计预期的首轮缺陷集中于**对账类缺口**：门1 清单是「内容质量」范式，缺「跨集合一致性」范式——(a) 单元集合 ↔ 计划级命令集合；(b) 触碰面集合 ↔ 仓库既有合同测试集合。两类对账机械可判定、可合同化，当前留给模型自觉，故呈现「不稳定」：模型状态好则想到、状态差则漏，由兜底层（doc-review/专家轮/CI）以更高成本捕获。

### 方案 A：门1 增补对账检查组（推荐 ⭐）

**改动**（3 个文件，prose ~12 行 + 合同测试同步）：
1. `references/final-review.md` 5.1 清单末尾增一组对账检查：
   - 「Plan-level verification commands cover every unit's Verification outcomes — reconcile the unit set against the command set; a unit whose verification has no plan-level command is a producer gap.」
   - 「Files and surfaces touched by this plan are checked against existing repo contract tests that assert on them (entry governance, byte budgets, ordering, projection contracts); affected contract tests join the Verification Contract commands.」
2. `references/plan-sections.md` Verification Contract 段（L227-236）补一句：verification commands 声明「覆盖本计划触碰面的既有合同测试」并各配一句盲区陈述（chosen commands 不能确认什么）
3. 同步更新 `tests/unit/spec-plan-{reference,quality}-contracts.test.js` 锁新文本

**预期效果**：问题 1、2 类缺陷（M2 模式中可上游预防的部分）在新任务中出现率显著下降；盲区陈述使「largest unproven risk」从单点判断变为枚举式
**投入**：4h（prose 1h + 合同测试 1.5h + eval 1.5h 含方案 B）
**风险**：低——对账是机械表述，无语义裁量扩大；清单膨胀风险以「单组两条」控制（不拆多项）

### 方案 B：补 eval 案例（与 A 组合）

`evals/output-quality-cases.json` 增 2 例：
- 正例：`verification-contract-reconciles-commands-and-contract-tests`（units↔commands 全覆盖 + 触碰面合同测试入命令 + 盲区句存在）
- 反例：`verification-contract-drops-unit-command-fails-reconciliation`（漏一个单元命令 → 不通过）
**投入**：含在 A 的 4h 内

### 方案 C：不修改（不推荐）

依赖门4 doc-review 兜底。违背「最小 durable mechanism」：集合对账可确定性表述却留给 LLM 自觉，等于把确定性不变量退化回「全凭自觉」——正是 AGENTS.md 明令禁止的反模式。

### 验证方法（对应 Phase 0 报告的有界试点③验收）

1. 合同测试：spec-plan 三套件更新后全绿（现有 3024 项无回归）
2. eval：新旧案例配置加载通过（evals 的 fixture 模式）
3. 增量追踪：试点后 5 个新任务，M2 模式「可上游预防缺陷」出现率较基线（本分析问题 1/2 实例）下降 ≥50%
4. 不做 A/B 双模型对照（成本 > 单人 ROI；以增量追踪替代）

### 对 Phase 0 统计的归因修正（amendment，不改原始 trace）

| 修正项 | 原 | 新 | Δskill_issue |
|---|---|---|---|
| FP-T06-1（T06） | skill 1.0 | none/by-design 1.0 | −1.0 |
| FP-T10-1（T10） | skill 1.0 + model 0.5 | skill 0.5 + model 1.0 | −0.5 |
| FP-VAL-2 / FP-PLAN-1（T01） | 维持 | 维持（缺口实证成立） | 0 |
| **合计** | skill 10.5/28 = 37.5% | **skill 9.0/28 = 32.1%**；model 2.5/28 = 8.9% | −1.5 |

**对 Phase 0 决策的影响**：skill 归因占比进一步下降（37.5%→32.1%），**退出条件 3 决策强化不变**；但本次深读把「模糊的不稳定」收敛为**2 条可机械对账的结构义务**，为有界试点③提供了精确落点（方案 A+B，4h）——修复的是确定性缺口而非语义判断，符合 80/20。

---

**完成签字**：AI 执行者（zcode）- 2026-11-03
**源码证据**：skills/spec-plan/{SKILL.md, references/final-review.md, references/plan-sections.md, references/structure.md, evals/}；grep 记录见 1.3；git 28b19305（S04，不与本分析重叠）
**限制**：单执行者分析，无第二方复核；未派发 fresh-source 独立审查（分析对象为合同文本而非 agent 行为，文本证据可直接回源）
