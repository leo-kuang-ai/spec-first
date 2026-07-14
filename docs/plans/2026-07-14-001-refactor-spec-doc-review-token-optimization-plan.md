---
title: "refactor: spec-doc-review Token Consumption Optimization"
type: refactor
created_at: 2026-07-14
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# refactor: spec-doc-review Token Consumption Optimization

## Goal Capsule

- **Objective:** 将 `spec-doc-review` 每次审查的指令体积（注入上下文的 prompt 行数与估算 token）相对当前基线降低 40-55%（以 Wave 1a 实测为基线；当前 ~22,500 → 目标约 ~12,000 冷路径不触发 / ~14,000 冷路径部分触发为**待测假设**，验收以实测降幅为准），并通过 fresh-source eval 验证 finding 质量不出现约定阈值内的退化。Token 降低通常与执行加速正相关，但 wall-clock 耗时不在本计划度量范围内——标题与验收仅覆盖指令体积优化。
- **Authority:** `spec-plan` 已验证的 "spine + STOP 锚点 + 惰性 reference + contract test 守护" 渐进式披露模式。本计划不发明新机制；热路径步骤语义与现网合成顺序对齐（含 always-on `3.5b`）。**语义边界：** 不改变 finding schema、角色独立性与交互遍历/批量预览流程；冷路径中 **presentation-only** 步骤（3.9、R29/R30）不改变 finding 集合，**outcome-affecting** 步骤（3.3b、3.5、3.5c）会改变呈现集合、推荐动作合并或决策级联，不得笼统写成「不改变行为语义」。
- **Stop conditions:** 不合并或删除角色（独立角色是跨角色提升信号的前提）；不改变 finding schema；不新增 CLI 能力；不修改交互式遍历/批量预览流程；不在本轮收紧对抗性角色激活条件。

---

## Product Contract

### Summary

`spec-doc-review` 是 spec-first 核心链路中的文档审查 workflow，通过 2-7 个独立角色子代理对需求文档和技术方案做多视角结构化审查。当前每次审查的 token 消耗过高（~22,500），主要瓶颈在于：

1. **子代理模板 183 行全量注入**每个子代理，其中 ~55% 是参考材料而非执行指令
2. **合成管道 416 行全量加载**，其中 ~40% 是仅在特定条件触发时才需要的冷路径
3. **SKILL.md 入口 248 行**包含文档分类信号清单和角色激活矩阵等细节参考材料

本计划将 `spec-plan` 已验证的渐进式披露模式原样搬到 `spec-doc-review`，拆分为三层：L1 入口脊柱（~160 行，始终注入）、L2 执行指令（子代理模板 spine ~80 行 + 合成热路径 ~250 行，仅在执行时注入）、L3 按需参考（角色文件 + 冷路径 reference + 交互流程，仅触发时加载）。

### Delivery Waves

| Wave | 单元 | 交付价值 | 可独立验收 |
| --- | --- | --- | --- |
| **Wave 1a（必做）** | U1 子代理模板 spine + **最小结构契约** + **token/指令体积基线测量** | 子代理侧主收益；建立可引用基线 | **有条件是**（见脚注） |
| **Wave 1b（必做，可按测量结果调整顺序）** | U2 合成热路径冷热分离 | 合成侧指令体积下降；与 1a 合计目标 ~40% | **有条件是**（依赖 1a 基线与最小契约） |
| **Wave 2（必做）** | U3 SKILL.md 脊柱瘦身 + U4 contract test 全量补齐 | 入口更轻；多 host runtime 与结构漂移有 CI 守护 | 是 |
| **Wave 3（可延后）** | U5 决策引物增长控制 | 多轮审查不膨胀 | 是；可 defer |

**Wave 1 脚注（独立验收条件）：**
- Wave 1a 可独立验收，当且仅当交付物含：**U1 spine/reference 拆分**、**最小结构契约**（spine 硬约束标记 + 可选 detail 指引；U2 STOP 锚点在 1b 补齐）、**token/指令体积基线测量报告**（优化前行数/估算 token 与 U1 后对比）。
- Wave 1b 在 1a 之后执行；若 1a 后合成侧成本仍阻挡 Objective 目标降幅，则 1b 必做。若 1a 已达 Objective 降幅且 FSE 通过，可将 1b 提前验收或与 Wave 2 并行，但不得跳过 STOP 锚点与热路径顺序正确性。
- 若实施时把「最小结构契约」全部推迟到 Wave 2 的 U4，则 **Wave 1 不得标为可独立验收**。

Wave 1a/1b 关闭核心 token 消耗问题。Wave 2 关闭入口重量和结构守护问题。Wave 3 解决多轮审查的边际成本增长。

### Problem Frame

`spec-doc-review` 执行一次典型 5 角色审查消耗 ~22,500 token，执行时间受最慢子代理（通常为 adversarial，108 行 + 5 技术协议）和串行合成管道（416 行全量加载）制约。项目已有的 `2026-07-06-skill-prompt-精简优化方案.md` 明确诊断：38 个 skill 合计 10,628 行，每次 workflow 调用 skill prompt 全量注入 LLM context。`spec-doc-review` 虽非最重（`spec-code-review` 1,241 行），但其子代理模板 × N 的乘法效应使 token 消耗尤为突出。

核心矛盾：子代理需要足够的规则和约束来产生高质量 finding，但这些规则的详细解释和示例不必每次都注入——它们是培训材料，不是执行时对照清单。

### Requirements

- **R1:** 子代理模板拆分为 spine（~80 行，始终注入）和惰性 reference（~100 行，子代理按需读取），spine 保留所有硬约束（schema enums、autofix_class 定义、置信度锚点速查表、误报目录），reference 承载置信度锚点行为详解、why_it_matters 强弱对比示例、suggested_fix 进阶规则。
- **R2:** 合成管道拆分为热路径（~250 行，始终加载）和惰性 reference（~160 行，仅条件触发时读取）。热路径必须对齐现网 always-on 顺序：`3.1 → 3.2 → 3.3 → 3.4 → [STOP→3.5 若对立 recommended actions 未合并] → 3.5b（always-on，写 recommended_action） → [STOP→3.5c 若 post-3.5b 前提信号] → 3.6 → 3.7 → 3.8 → [STOP→3.9] → Phase 4 → [STOP→R29/R30 if round≥2]`。冷路径分两类：**outcome-affecting**（3.3b 同角色冗余折叠、3.5 矛盾解决、3.5c 前提-依赖链关联——改变呈现集合/推荐动作/决策级联）与 **presentation-only**（3.9 残余剔除、R29/R30 多轮抑制——主要影响报告噪音）。`3.3b` 仍为冷路径（`≥3` same-persona post-dedup）。walkthrough/bulk-preview 不重算 `recommended_action`（由 3.5b 写入）。
- **R3:** SKILL.md 文档分类信号清单和角色激活矩阵移到惰性 reference，入口保留核心判断规则和激活决策速查表。
- **R4:** 每个被拆分的文件必须有 contract test 守护 spine/reference 结构。**结构契约**（`tests/unit/spec-doc-review-contracts.test.js`，复用 `spec-plan-contracts.test.js` 的字符串包含断言模式）验证 source 文件含 STOP 锚点、硬约束标记与 reference 文件名。**集成测试**（`tests/integration/doc-review-five-host-projection.integration.test.js`，复用 `init-five-host-lifecycle.integration.test.js` 的 sandbox + `getSupportedPlatforms()` 遍历模式）验证 `spec-first init --<platform>` 后每个新增 reference 文件在所有 host runtime 路径的物理投射。两种测试互补，不互相替代。
- **R5:** 精简后必须通过 fresh-source eval 验证 finding 质量不退化。方法、fixture、注入方式与评分责任见 Verification Contract：将磁盘上当前 skill/reference 源文件内容注入**全新通用 subagent**（或等价 fresh read-only reviewer；禁止依赖会话已缓存的 typed-agent），对同一 fixture 文档分别跑 before/after，对比 finding 数量、严重级别分布、置信度分布和 why_it_matters 质量。
- **R6:** 7 个角色文件保持不变——角色文件承载审查方法论（分析协议、领域知识、抑制条件），是 finding 质量的核心保证，不在本轮优化范围内。
- **R7:** 交互式遍历（walkthrough.md, 284 行）和批量预览（bulk-preview.md, 128 行）保持不变——交互模式的核心流程已按状态机方式组织，收缩空间有限。

### Scope Boundaries

- **In scope:**
  - Source 拆分与惰性加载：`skills/spec-doc-review/SKILL.md`、`skills/spec-doc-review/references/subagent-template.md`、`skills/spec-doc-review/references/synthesis-and-presentation.md`
  - **新增 inert references**（U1–U3 列出的全部 `references/*.md`）
  - **Contract tests 扩展**：`tests/unit/spec-doc-review-contracts.test.js`（及必要时对 `spec-plan-contracts.test.js` 模式的对齐）
  - **集成测试新增**：`tests/integration/doc-review-five-host-projection.integration.test.js`（复用 `init-five-host-lifecycle.integration.test.js` 的 sandbox + `getSupportedPlatforms()` 遍历 + `spec-first init --<platform>` 模式）
  - **多 host runtime 投射验证**：结构契约（source 字符串包含）+ 集成测试（物理文件存在），两者互补
  - Wave 1a 的 **token/指令体积基线测量** 与报告条目
- **Out of scope:** 角色文件修改、finding schema 变更、交互式遍历/批量预览流程修改、新增 CLI 能力、对抗性角色激活条件收紧（本轮不做——对抗性角色在 plan-with-origin 上的决策压力测试是独特信号，收紧可能损失质量，留待数据积累后单独评估）。
- **Deferred:** 决策引物增长控制（U5，Wave 3）——依赖多轮审查的实际使用数据来校准上限。

---

## Planning Contract

### Implementation Units

#### U1: 子代理模板 spine + 惰性 reference 拆分

**Goal:** 将 `subagent-template.md` (183 行) 拆分为 spine (~80 行) + 3 个惰性 reference

**Files:**
- `skills/spec-doc-review/references/subagent-template.md` → 重写为 spine
- `skills/spec-doc-review/references/subagent-confidence-rubric-detail.md` → 新增
- `skills/spec-doc-review/references/subagent-why-it-matters-guide.md` → 新增
- `skills/spec-doc-review/references/subagent-suggested-fix-advanced.md` → 新增

**Approach:**

spine 保留内容（~80 行）：
1. 输出契约 + schema 硬约束（enum 值、required 字段、evidence 必须是数组）— 不可省略
2. 置信度锚点速查表（5 行表格，每行保留关键行为短语）— 替代 20 行详解
3. autofix_class 三档定义 + 稻草人规则（safe_auto/gated_auto/manual 的区分逻辑）— 不可省略
4. 误报目录（14 项精简为紧凑列表，每项一行）— 不可省略
5. why_it_matters 核心规则（observable consequence first, 2-4 sentences）+ 反模式一行警示
6. suggested_fix 核心规则（一项推荐、禁止备选菜单）+ strawman safeguard
7. 上下文槽规则 + 决策引物规则 + 禁止项 + 文档类型适配说明
8. 一行指向 detail reference 的**可选**指引："If unsure about anchor selection, read `references/subagent-confidence-rubric-detail.md` before emitting."（默认不强制 always-read）

惰性 reference 承载：
- `subagent-confidence-rubric-detail.md`: 每个锚点的完整行为标准描述 + 为什么 0 和 25 存在于 enum 但 persona 不产出
- `subagent-why-it-matters-guide.md`: 弱 vs 强对比完整示例 + observable consequence first 的详细说明
- `subagent-suggested-fix-advanced.md`: single/multi-facet/composite 分类法 + 完整 positive/negative examples + strawman 分析详解

**选定负载策略（置信度 detail）：默认 spine-only；eval 失败再恢复。**
- **默认：** 子代理始终只注入 spine（含 5 行速查表 + 可选 detail 指引）；**不**要求每个 finding 前 always-read detail。
- **失败恢复：** 若 fresh-source eval 中置信度分布偏移超过 Verification Contract 阈值（`75/100` 比例下降 >25%，或 `50` 比例显著上升），将通用锚点详解（或其压缩版）**恢复进 spine**，或把 detail 改为 always-read 指引；不得在无 eval 证据时默认 always-read 抵消 token 收益。
- **why_it_matters / suggested_fix detail** 同策略：默认惰性；仅在对应 FSE 维度失败时强化 spine 或强制加载。

**关键设计决策 — 风险边界（非「零降智」保证）：**

spine 保留了所有硬约束——这些是防止错误 finding 的机制（错误的 enum 值被 schema 拒绝、稻草人备选方案被 autofix_class 规则阻止、误报被 FP 目录过滤）。被移到 L3 的是解释性/示例性材料——它们说明"为什么"和"好与坏的对比"，但不直接约束输出。

角色文件提供了**第二层校准**：7 个角色各自包含领域特定的置信度校准指南（如 coherence 的 "100 — Provable from text: can quote two passages that contradict each other"），这些角色级校准比通用模板的锚点描述更具体、更领域锚定。即使子代理不加载通用锚点详解，角色自身的校准信号通常仍有效——**但这是假设，须 FSE 验证，不是计划阶段保证**。

`why_it_matters` 质量由核心规则（observable consequence first）+ 反模式警示（"Anti-pattern: leading with document structure instead of consequence"）保证，这是强弱对比示例的压缩等价物——保留了操作性指导，去掉了说明性示例。

**Verification:**
- Contract test 断言 spine 含可选 detail 指引行与硬约束标记（schema enums、autofix_class、置信度速查表、FP catalog 关键条目），reference 含被移出段落的关键标识；STOP 锚点断言保留给 U2 合成热路径
- Wave 1a：记录优化前/后 spine 行数与估算 token（或同等指令体积度量），写入验收证据
- Fresh-source eval: 同 fixture 分别用 spine-only（默认策略）与 full-template（对照）审查，对比 finding 质量；失败则按负载策略恢复

#### U2: 合成管道冷热分离

**Goal:** 将 `synthesis-and-presentation.md` (416 行) 拆分为热路径 (~250 行) + 5 个惰性 reference (~160 行)

**Files:**
- `skills/spec-doc-review/references/synthesis-and-presentation.md` → 重写为热路径
- `skills/spec-doc-review/references/synthesis-premise-collapse.md` → 新增（3.3b）
- `skills/spec-doc-review/references/synthesis-contradictions.md` → 新增（3.5）
- `skills/spec-doc-review/references/synthesis-chain-linking.md` → 新增（3.5c）
- `skills/spec-doc-review/references/synthesis-restatement-suppression.md` → 新增（3.9）
- `skills/spec-doc-review/references/synthesis-multi-round.md` → 新增（R29/R30）

**Approach:**

热路径（始终加载，对齐现网 `synthesis-and-presentation.md`）：
- `3.1 校验 → 3.2 置信度门控 → 3.3 去重 → 3.4 跨角色提升 → [STOP→3.5 若对立 recommended actions] → 3.5b always-on（写 recommended_action：Skip > Defer > Apply；walkthrough/bulk-preview 不重算） → [STOP→3.5c 若 post-3.5b 前提信号] → 3.6 提升自动合格 → 3.7 路由 → 3.8 排序 → [STOP→3.9] → Phase 4 静默应用 safe_auto → Phase 4 渲染报告 → Phase 5 终端问题 → [STOP→R29/R30 if round≥2]`
- **硬约束：** `3.5b` 必须在热路径 always-on，不得标为冷路径；`3.5c` 必须在 `3.6` 之前；`3.3b` 不在热路径（仍为冷路径）。

冷路径 → 惰性 reference（触发条件精确到可判定）：

| 冷路径 | 类别 | 触发条件 | STOP 锚点（位置） |
|--------|------|---------|-------------------|
| 3.3b 同角色冗余折叠 | outcome-affecting | `any persona has ≥3 findings in the post-dedup set` | "STOP. Before finalizing dedup, if any persona contributed 3 or more findings, read `references/synthesis-premise-collapse.md`."（在 3.3 完成、进入 3.4 前） |
| 3.5 矛盾解决 | outcome-affecting | `after 3.3/3.4, the unmerged set still contains findings with opposing recommended actions from different personas`（对齐现网 3.3：对立 recommended actions **故意不合并**，留给 3.5） | "STOP. After cross-persona promotion (3.4), if any findings still carry opposing recommendations from different personas (not yet resolved), read `references/synthesis-contradictions.md` before 3.5b."（**不得**写成「merged finding 已带 opposing」——那会与 3.3 不合并策略矛盾） |
| 3.5c 前提-依赖链 | outcome-affecting | `any P0 or P1 manual finding in the **post-3.5b** set has a framing-level section AND premise-challenge signal in title or why_it_matters`（**不是** post-routing / post-3.7）。Signal 采用 **shape-match（子串/包含），非精确字符串**，覆盖以下形状及等价变体：`premise unsupported`、`justification missing`、`do-nothing baseline not evaluated`、`is X justified`、`unsupported by evidence`、`is the proposed solution the right approach`，**或** finding 显式质疑某个具名组件是否应该存在（"questions whether a named component should exist"）。匹配规则写入 `synthesis-chain-linking.md` 参考文件，STOP 锚点引用该文件为权威来源 | "STOP. After 3.5b and before 3.6, if any P0/P1 finding challenges a foundational premise (section is Problem Frame/Summary/Overview/Motivation/Goals AND title/why_it_matters contains a premise-challenge signal — see `references/synthesis-chain-linking.md` for the full shape-match rule and signal phrase list), read `references/synthesis-chain-linking.md`." |
| 3.9 残余剔除 | presentation-only | `any persona output carries non-empty residual_risks or deferred_questions` | "STOP. Before final rendering, if any persona submitted residual risks or deferred questions, read `references/synthesis-restatement-suppression.md`." |
| R29/R30 多轮 | presentation-only | `current round ≥ 2 (decision primer is non-empty)` | "STOP. Before Phase 4 presentation in round 2+, read `references/synthesis-multi-round.md`." |

**失败模式（不得再写「冷路径只伤 UX」）：**

| 冷路径缺失时 | 后果类别 | 说明 |
|-------------|---------|------|
| 3.3b | **outcome-affecting** | 同角色 N 条全量呈现 → 视角加权扭曲、用户决策负担上升；finding 原文仍在，但**决策集合与优先级体验已变** |
| 3.5 | **outcome-affecting** | 对立 recommended actions 不经 3.5 解决就进入 3.5b → **可能写出错误/冲突的 recommended_action**，不仅是「两个条目分开显示」 |
| 3.5c | **outcome-affecting** | 前提级 finding 不建依赖链 → 用户对 N 条独立决策，**可能接受与前提冲突的下游项**；非纯 UX |
| 3.9 / R29/R30 | **presentation-only** | 报告噪音或重复 residual/已拒绝项再现 → 主要伤呈现，finding 核心建议不变 |

触发条件的精确性（可判定信号短语、section 名称、数量阈值、**post-3.5b** 集合、**unmerged opposing actions**）是可靠性保证。presentation-only 的最坏情况接近「体验稍差」；outcome-affecting 的最坏情况是**决策结果偏离**，须靠 STOP + FSE 场景覆盖，不能用「不会降智」一笔带过。

**Verification:**
- Contract test 断言热路径含 **3.5b always-on**、含 3.3b/3.5/3.5c/3.9/R29 STOP 锚点文案、且 3.5 STOP 语义为 unmerged opposing（非 merged opposing）、3.5c STOP 锚定 post-3.5b / before 3.6；每个冷路径 reference 含对应步骤关键逻辑
- 指令体积：对比优化前后 `synthesis-and-presentation.md` 热路径行数/估算 token
- Fresh-source eval: 构造触发冷路径的 fixture 场景（≥3 同角色 post-dedup；跨角色对立 recommended actions；post-3.5b 前提挑战 P0/P1；residual 非空；round≥2），验证冷路径正确加载和执行

#### U3: SKILL.md 入口脊柱瘦身

**Goal:** SKILL.md 从 248 行降至 ~160 行

**Files:**
- `skills/spec-doc-review/SKILL.md` → 重写
- `skills/spec-doc-review/references/document-classification-signals.md` → 新增
- `skills/spec-doc-review/references/persona-activation-matrix.md` → 新增

**Approach:**
- 文档类型分类信号清单（~18 行 requirements/plan signals）→ `references/document-classification-signals.md`，入口保留 ~5 行核心判断规则
- 条件角色激活信号（~48 行 5 角色的详细触发矩阵）→ `references/persona-activation-matrix.md`，入口保留 ~10 行激活决策速查表
- 子代理模型分层（~8 行嵌入 prose）→ ~3 行表格
- 子代理调度逻辑、Phase 0-2 流程保持不变

**加载契约（Phase 1 必读 / STOP / fallback）：**

分类和角色激活是每次审查必经步骤。入口脊柱的核心规则和速查表覆盖常见情况；惰性 reference 仅在边缘情况触发——不总是读取，否则净 token 不降。

- **文档分类（Phase 1）：** 编排器先用脊柱核心规则（"content shape over path, tie-breaker defaults to requirements" + unified artifact contract 检查）分类。若分类结果明确，不读 reference。STOP 锚点：**"If classification is genuinely ambiguous after applying the core rules above, read `references/document-classification-signals.md` before proceeding to persona selection."**
- **角色激活（Phase 1）：** 编排器先用脊柱速查表判断条件角色是否激活。速查表覆盖典型触发信号（product-lens: 可质疑前提或战略权重；design-lens: UI/UX/前端/交互；security-lens: auth/API/PII；scope-guardian: 多优先级/>8 单元/stretch goals；adversarial: 高风险领域/新抽象/无上游验证）。若速查表不能裁决，STOP 锚点：**"If the quick-reference table does not resolve whether to activate a conditional persona for this document, read `references/persona-activation-matrix.md` before finalizing the reviewer list."**
- **Fallback：** 若编排器跳过了两个 reference 但分类或角色选择在后续执行中被证明错误（如 feasibility-reviewer 报告大量 "this should have been classified as plan" 信号），不视为方案缺陷——这是 spine 覆盖率的验证数据，用于后续收紧核心规则或速查表。

**Verification（分类/激活 fixture）：**
- 选取 3 份文档（明确 requirements、明确 plan、ambiguous/mixed），仅凭脊柱核心规则 + 速查表做分类和角色激活
- 通过标准：分类 100% 正确（与现网全信号清单结果一致）；角色激活不出现漏派（应激活未激活）或严重误派（激活了明确不应激活的角色）

**Verification:**
- Contract test 断言主文件含 STOP 锚点、reference 含对应内容
- `spec-first init` 后 runtime 投射正确

#### U4: Contract Test 补齐

**Goal:** 为 U1-U3 的所有结构变更建立 contract test 守护

**Files:**
- `tests/unit/spec-doc-review-contracts.test.js` → 扩展

**Approach:**
- 复用 `spec-plan-contracts.test.js` 的断言模式
- 断言 U2 热路径 spine 含 STOP 锚点（含 3.5b always-on 与 3.5/3.5c 位置语义）；U1 spine 断言硬约束 + 可选 detail 指引（非强制 always-read STOP）
- 断言 reference 含被移出段落的关键标识字符串
- 断言 runtime 投射后 reference 路径正确：覆盖 generator 实际写出的 **多 host** 路径（至少 workflow references 与 skill mirror，例如 `.claude/spec-first/workflows/spec-doc-review/references/`、`.agents/skills/spec-doc-review/references/`、`.claude/skills/spec-doc-review/references/` 等——以 `getSupportedPlatforms()` / init 输出为准，禁止只测单一 `.claude/` 路径）
- 断言子代理模板 spine 含所有硬约束（autofix_class enum、confidence anchors、FP catalog 关键条目）
- Wave 1a 最小契约可先覆盖 U1 + 测量；U2 STOP 全量断言在 1b 补齐，U3/全量 runtime 在 Wave 2

#### U5: 决策引物增长控制（Wave 3, 可延后）

**Goal:** 多轮审查时限制 `{decision_primer}` 的历史记录规模

**Files:**
- `skills/spec-doc-review/SKILL.md` → Decision primer 段落修改

**Approach:**
- applied 决策仅保留最近一轮
- rejected 决策按指纹去重——连续两轮被拒绝的只留一条带 `suppressed (N prior rounds rejected)` 标记
- 硬上限：单轮 primer 不超过 20 条记录
- 超出上限时保留最近 N 条 + 一行 `... (M earlier decisions omitted)`

### Key Technical Decisions

**KTD1: 复用 spec-plan 的 spine + STOP 锚点模式，不发明新机制**

- spec-plan 已有 460 行主文件 + 13 个惰性 reference 的验证实现，contract test 断言了 spine/reference 结构和 runtime 投射
- `tests/unit/spec-plan-contracts.test.js` 已证明 "spine 含 STOP 锚点 → reference 含被移出段落 → runtime 投射正确" 的断言模式可行
- 风险：spec-plan 的 STOP 锚点用于 "治理边界"（governance boundaries），doc-review 的锚点用于 "执行步骤"（synthesis steps），触发条件的精确性要求不同
- 缓解：U2 中每个冷路径的触发条件都精确到可判定的信号（数量阈值、字符串匹配、section 名称列表、post-3.5b 集合、unmerged opposing actions），不依赖 LLM 自行判断"是否需要"
- **语义边界声明：** 本 KTD 保证的是「机制形态可复用」，不是「冷路径失败零后果」。outcome-affecting 冷路径（3.3b/3.5/3.5c）失败会改变决策结果空间；presentation-only（3.9/R29/R30）更接近 UX 噪音

**KTD1b: 置信度 detail 负载策略 = 默认 spine-only，FSE 失败再恢复**

- 选定：默认不 always-read `subagent-confidence-rubric-detail.md`；spine 保留速查表 + 可选指引
- 恢复条件：FSE 置信度分布超阈值 → 详解回 spine 或 always-read
- 反对默认 always-read：会抵消 U1 的 token 目标，且与「解释材料惰性」原则冲突

**KTD2: 角色文件保持不变**

- 角色文件包含审查方法论（分析协议、领域知识、抑制条件），是 finding 质量的核心保证
- 7 个角色之间的独立性是 3.4 跨角色提升信号的前提——合并角色会损失 "2+ 独立角色同时发现问题" 的信号强度
- 角色文件的总行数（479 行）不参与乘法效应（每个子代理只加载自己的一份角色文件），不是 token 消耗的主要来源

**KTD3: 不在本轮收紧对抗性角色激活条件**

- 对抗性角色在 plan-with-origin 上运行的 "决策压力测试"（falsification test, reversal cost, load-bearing decisions）是其他角色不覆盖的独特信号
- 收紧激活条件可能损失质量，需要先积累 "哪些 plan review 中对抗性角色产出了 unique finding" 的数据
- 如果后续数据证明对抗性角色在 routine plan 上边际贡献低，再单独评估收紧

### Risks & Dependencies

| 风险 | 严重级别 | 缓解措施 |
|------|---------|---------|
| 置信度锚点校准漂移：spine 的 5 行速查表不如完整行为描述精确，子代理可能锚点膨胀（更多 75/100）或保守化（更多 50） | P1 | 角色文件第二层防护；默认 spine-only；FSE 超阈值则恢复详解到 spine |
| 冷路径 STOP 锚点不触发：触发条件过严或位置写错（如 3.5c 写成 post-routing、3.5 写成 merged opposing），导致 outcome-affecting 步骤被跳过 | P1 | 触发条件绑可判定信号 + 正确集合（post-dedup / unmerged opposing / **post-3.5b**）；FSE 构造触发场景 |
| 3.5b 被误移出热路径或 3.5c 移到 3.6 之后 | P0 | contract test 断言 always-on 3.5b 与 3.5c-before-3.6；与现网顺序 diff 检查 |
| why_it_matters 质量下降：缺少强弱对比示例后，子代理可能产出更多 "Section X says Y" 式弱 framing | P2 | spine 保留反模式警示 + 核心规则；FSE 人工审查；失败则压缩示例回 spine |
| Runtime 投射漂移：新增 reference 未投射到全部相关 host skill/workflow 路径 | P2 | 多路径 contract test + `spec-first init` 后验证 |
| 子代理不主动加载惰性 reference（符合默认 spine-only） | P2 | 预期行为；靠 FSE 决定是否升级为 always-read 或回填 spine；不加载≠实现 bug |
| ~12k/~14k 目标为未测假设，验收时无法证明 40-55% 降幅 | P1 | Wave 1a 强制基线测量；Objective 以实测降幅为准 |

---

## 降智风险专项分析

本节是计划的核心——逐一切割点分析是否会降低 finding 质量，区分"硬约束"（阻止错误 finding 的规则）和"软指导"（提升 finding 质量的说明），并明确真实风险与假想风险的边界。

### 分析框架

对每个被精简的部分，问三个问题：

1. **这部分是硬约束还是软指导？** 硬约束阻止错误——enum 值校验、required 字段、误报目录。软指导提升质量——示例、行为描述、写作指南。删除硬约束会直接产生错误 finding；删除软指导只会让 finding 不那么好。
2. **是否有第二层防护？** 如果同一信息在另一处（如角色文件）也有表达，精简的风险更低。
3. **如果最坏情况发生，结果是什么？** 是 finding 错误、finding 缺失、finding 质量下降、还是仅仅 UX 略差？

### 逐一切割点分析

#### 切割点 1：子代理模板 → spine (~80 行) + 惰性 reference

**移出内容：置信度锚点完整行为描述（~20 行）**

- 硬约束 or 软指导：**软指导**。锚点值由 enum `[0, 25, 50, 75, 100]` 强制执行——子代理不能产出 `72` 或 `"high"`。行为描述（"you double-checked and verified..."）解释如何选择锚点，但不阻止选择。
- 第二层防护：**有，且更强**。7 个角色文件各自包含领域特定的置信度校准指南。角色级校准比通用模板描述更具体——它告诉审查者在其特定领域内 `100`、`75`、`50` 分别意味着什么。例如 coherence 说 `100` = "Provable from text — can quote two passages that contradict each other"，product-lens 说 `75` = "Likely misalignment, full confirmation depends on business context. This is product-lens's normal working ceiling." 这些领域锚定的描述比通用模板的 "you double-checked and confirmed" 更有操作性。
- 最坏情况：锚点向保守方向漂移（更多 `50`）。这意味着更多 finding 进入 FYI 区而非可操作区——用户看到的信息更完整，但需要手动操作的 finding 更少。这不是错误，是降级为更保守的呈现。
- **判断：低风险。**

**移出内容：why_it_matters 强弱对比完整示例（~15 行）**

- 硬约束 or 软指导：**软指导**。Schema 要求 `why_it_matters` 为非空字符串，但不检查语义质量。
- 第二层防护：**压缩等价物保留在 spine**。spine 中保留核心规则（"Lead with observable consequence. Describe what goes wrong from the reader's perspective"）+ 一行反模式警示（"Anti-pattern: 'Section X says Y. Section Z says W. Reconcile.' → Instead: 'Implementers will disagree on which tier applies because...'"）。这是示例的压缩等价物——保留了操作性指导（how to do it + what not to do），去掉了说明性展示（here's a full parallel comparison）。
- 最坏情况：少数 finding 的 `why_it_matters` 以文档结构开头而非以可观察后果开头。这类 finding 仍然正确，仍然可操作，只是 prose 质量略差——用户仍能理解问题，只是需要多读一行。
- **判断：低风险。** 如果 fresh-source eval 发现 ≥20% 的 finding 出现 document-structure-first framing，需要强化反模式警示或恢复完整示例。

**移出内容：suggested_fix 进阶规则（single/multi-facet/composite 分类法，~15 行）**

- 硬约束 or 软指导：**软指导**。核心约束（"一项推荐、禁止备选菜单"）保留在 spine，稻草人 safeguard 保留在 spine。分类法是解释性材料。
- 第二层防护：**核心约束本身已足够**。禁止备选菜单（"no (a)/(b)/(c) lists"）直接阻止了最需要分类法的场景。子代理不需要理解 single vs multi-facet vs composite 的术语——他们只需要知道"写一项推荐，不要列菜单"。分类法是为了解释为什么，而为什么在操作层面不重要。
- 最坏情况：出现边缘案例——子代理写了一项 multi-facet 修复但没有明确说明它是一个组合推荐（"做 A+C"而不是"做 A 或 C"）。用户可能误读为两个独立选项。但稻草人 safeguard（"如果存在任何非稻草人的替代方案，降级为 gated_auto"）确保这种 finding 会进入遍历而非静默应用——用户有机会审视。
- **判断：极低风险。**

**移出内容：完整 JSON 输出示例（~10 行）**

- 硬约束 or 软指导：**非约束**。Schema conformance 由结构化输出机制强制执行——JSON 必须匹配 schema，否则被拒绝。示例只是展示形状，schema 本身已定义形状。
- 第二层防护：**结构化输出机制是比示例更强的保证**。如果子代理产出 `confidence: 72`，schema 校验会拒绝它——不需要示例来防止。
- 最坏情况：子代理产出 JSON 但字段顺序不同或缩进不一致。不影响解析。
- **判断：零风险。**

#### 切割点 2：合成管道冷热分离

**关键认知：冷路径不产生新的 persona finding 原文；但 outcome-affecting 冷路径会改变 finding 集合的呈现、推荐动作与决策级联。**

**Always-on 热路径（不可惰性化）：** `3.5b` 写入 `recommended_action`（Skip > Defer > Apply），walkthrough/bulk-preview 不重算——必须留在热路径。

| 步骤 | 类别 | 缺失时后果 |
|------|------|-----------|
| 3.3b 同角色冗余折叠 | outcome-affecting | 同角色 N 条全量呈现 → 视角加权扭曲、决策负担上升 |
| 3.5 矛盾解决 | outcome-affecting | 对立 recommended actions 进入 3.5b → **可能写出冲突/错误 recommended_action** |
| 3.5c 前提-依赖链 | outcome-affecting | 无级联 → 用户可能接受与被挑战前提冲突的下游项 |
| 3.9 残余剔除 | presentation-only | Residual/Deferred 区重复，报告嘈杂 |
| R29/R30 多轮抑制 | presentation-only | 第 2+ 轮重复已拒绝 finding，需再次跳过 |

**不得再写「所有冷路径最坏情况只是 UX 略降」。** presentation-only 接近该描述；outcome-affecting 会影响用户最终 Apply/Skip 结果空间。Persona 是否「发现真问题」仍主要依赖角色文件 + 热路径校验/门控；但**合成后的可操作集合**依赖 3.3b/3.5/3.5c 的 STOP 可靠性。

**冷路径触发条件的可靠性：** 数量阈值（≥3）、信号短语、framing section 名、**post-3.5b**（3.5c）、**unmerged opposing after 3.4**（3.5）、round≥2。可机械判定；须用 FSE 场景验证 STOP 被执行。

**判断：presentation-only 低风险；outcome-affecting 中风险，靠 STOP 位置正确性 + FSE 场景覆盖，不是零风险。**

#### 切割点 3：SKILL.md 入口脊柱瘦身

**移出内容：文档分类信号清单和角色激活矩阵（~70 行）**

- 这些内容仅由编排器在 Phase 1 使用一次——不是重复注入的指令。将它们移到惰性 reference 不产生乘法效应（不随子代理数量放大），token 收益相对小。
- 核心判断规则保留在 spine（"content shape over path, tie-breaker defaults to requirements"），reference 提供完整信号清单供分类决策时查阅。
- 最坏情况：编排器不看 reference，凭核心规则分类。由于核心规则（"content shape is authoritative, path is tie-breaker"）已经覆盖了 90% 的情况，误分类概率低。
- **判断：极低风险。**

### 一个不动的部分：角色文件

7 个角色文件（479 行合计）不在本轮优化范围内。这是有意为之：

1. 角色文件包含审查方法论——**分析协议**（检查什么、如何检查）、**领域知识**（什么是矛盾、什么是安全缺口、什么是范围漂移）、**抑制条件**（什么不属于本角色的领域）。这些是 finding 质量的核心保证。
2. 每个子代理只加载自己的一份角色文件——没有乘法效应。token 消耗的核心来源是子代理模板 × N（所有子代理都加载同一份 183 行模板），而非角色文件。
3. 角色之间的独立性是 3.4 跨角色提升信号的前提。合并或精简角色会损失"2+ 独立角色同时发现同一问题"的信号强度——这是整个多角色审查架构的基础价值。

### spec-plan 前例

`spec-plan` 已将 13 个惰性 reference 从主文件中移出（包括 29 KB 的 `planning-flow.md`、20 KB 的 `deepening-workflow.md`），contract test 和 fresh-source eval 均确认行为等价。这不是猜测——是已跑通的同模式。

`spec-doc-review` 的情况比 `spec-plan` 更有利：`spec-plan` 的惰性 reference 中包含执行流程步骤（需要 LLM 在正确的时机主动读取），而 `spec-doc-review` 的冷路径只在编排器已经拿到子代理输出的情况下触发——编排器能直接检查触发条件（"有没有 ≥3 个同角色 finding？""有没有 P0/P1 前提级 finding？"），不需要推测。

### 真实风险 vs 假想风险

| 假想风险 | 为什么是假想 |
|---------|------------|
| "子代理会产出更多错误 finding" | 硬约束全部保留在 spine——schema enums、required 字段、autofix_class 定义、误报目录。错误 finding 被这些机制阻止，不依赖示例和详解 |
| "合成逻辑会出错 / 全部冷路径只伤 UX" | **半真半假。** 热路径保留校验→门控→去重→提升→**3.5b**→路由→排序→应用；presentation-only 冷路径接近呈现优化。但 3.3b/3.5/3.5c 是 outcome-affecting，STOP 失灵会改变决策结果空间——不能当成假想风险一笔勾销 |
| "角色之间的独立性会被破坏" | 角色文件不动，7 个角色保持完整方法论和独立调度 |

| 真实风险 | 为什么是真实的 | 如何应对 |
|---------|-------------|---------|
| 锚点校准保守化（更多 `50`） | 角色文件的领域校准指南是第二层防护，但它们的措辞假设子代理已经读过通用模板的锚点定义（"Use the shared anchored rubric"）。缺少通用模板的完整行为描述后，角色级校准是否能独立维持锚点分布？不确定 | fresh-source eval 对比锚点分布。如果 `75/100` 比例下降 >25%，恢复通用锚点详解到 spine 中 |
| 冷路径 STOP 锚点失灵（含位置写错） | 执行步骤 STOP 比治理边界更易漏；3.5/3.5c 写错触发集合会静默跳过 outcome-affecting 逻辑 | 可判定信号 + post-3.5b / unmerged opposing；FSE 构造 ≥3 同角色、对立 action、前提挑战等场景验证加载 |
| why_it_matters framing 质量轻微下降 | 压缩的反模式警示不如完整的强弱对比示例有教育力。子代理可能理解规则但执行不到位 | 如果 fresh-source eval 的 why_it_matters 人工审查发现质量下降，可以考虑将强弱对比示例精简为 3 行（去掉解释性文字，只保留正例 + 反例 + 一行对比说明）并放回 spine |

### 结论

**本轮优化在硬约束与角色方法论上具备「不易变笨」的结构条件，但不保证零退化；验收以 FSE 阈值为准。** 依据：

1. **硬约束在 spine 中保留**——schema enums、autofix_class、FP catalog 等阻止错误 finding 的机制未删
2. **角色文件不动**——审查方法论的完整 fidelity 保留
3. **冷路径分两类**——presentation-only（3.9/R29/R30）最坏接近 UX 噪音；outcome-affecting（3.3b/3.5/3.5c）可能改变决策结果空间，须 STOP + 场景 FSE
4. **spec-plan 前例**——同模式惰性 reference 已有行为等价证据，但是治理边界场景，不能直接外推为 doc-review 合成步骤零风险
5. **fresh-source eval 作为安全网**——具名 fixture × 明确注入/评分责任 × 阈值；失败则按负载策略恢复 detail 或回退拆分

**真实不确定性（计划阶段不可断定）：**
1. 锚点校准是否仅靠角色级指南维持（默认 spine-only）
2. outcome-affecting STOP 是否在真实编排中被可靠触发
3. ~12k/~14k 与 40-55% 降幅是否被 Wave 1a 实测支持

以上均已写入 Verification Contract / DoD，不得在无证据时声称「不会降智」或「已证明 40-55%」。

---

## Verification Contract

### Token / 指令体积基线（Wave 1a 必做）

**度量对象（确定性，脚本可算）：**
- `subagent-template.md` 行数与估算 token（优化前 full vs 优化后 spine；× 典型角色数 N 的乘法上界）
- `synthesis-and-presentation.md` 行数与估算 token（优化前 full vs 优化后热路径）
- `SKILL.md` 入口行数与估算 token（Wave 2）

**度量对象（半确定性，典型审查）：**
- 一次代表性 interactive 审查的上下文注入体积（记录角色数、是否触发各冷路径、host）

**验收绑定：** Objective 中的 ~12k/~14k 与 40-55% 为待测假设；DoD 要求附上 before/after 数字。未完成基线测量不得关闭 Wave 1a。

### Fresh-Source Eval

**前置锁定（实施前完成，写入报告）：**

- **Before revision：** `git rev-parse HEAD` 在当前分支的最新 commit SHA，作为优化前源快照。Before 评测使用该 revision 的 `skills/spec-doc-review/**` 源文件。
- **After source：** 当前工作树（含 U1-U3 修改）的 `skills/spec-doc-review/**` 源文件。
- **Host / 模型：** 固定 Claude Code 作为评测宿主；记录实际使用的模型 ID（从会话元数据或 API 响应获取）。若评测期间模型版本变更，记入报告。
- **重复运行：** 每个 fixture × before/after 至少运行 **3 次**，报告中同时报告中位数与 min/max 范围。单次运行不得作为通过/失败证据。

**方法：** 将磁盘上当前 skill/reference **源文件内容**注入**全新通用 subagent**（或等价 fresh read-only reviewer）。禁止依赖本会话已缓存的 typed-agent / skill 定义。对比 before（优化前源，固定 revision）与 after（优化后源，默认 spine-only 负载策略）。

**注入方式（固定模板）：**
- 对于 persona 级 FSE（U1）：读取 `skills/spec-doc-review/references/subagent-template.md`（before: full 183 行；after: spine ~80 行）+ 固定角色文件 + fixture 文档正文，注入到新 subagent system/user prompt。固定 user prompt 文本（实施时写入报告）："Review the following document as {persona_name}. Return findings per the attached schema."
- 对于合成级 FSE（U2）：运行完整 doc-review workflow（含子代理调度 + 合成管道），但固定角色集合与 fixture 文档，记录冷路径触发情况。
- After 侧允许 subagent 按 STOP 规则读取 inert reference；记录是否实际读取。

**具名 fixture（实施时锁定仓库内路径与文档 SHA；不得写"建议选择"）：**

1. **requirements fixture：** `docs/项目审查/2026-07-06-真实状态与提升优先级.md`（中等复杂度需求/审查类文档，约 237 行）
2. **plan-with-origin fixture：** `docs/plans/2026-07-13-002-feat-workspace-readiness-guidance-plan.md`（`artifact_readiness: implementation-ready` + `product_contract_source: spec-plan-bootstrap`，带上游引用）
3. **greenfield plan fixture：** 本计划自身 `docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md`（`product_contract_source: spec-plan-bootstrap`，greenfield 语义）
4. **冷路径场景夹具（合成级 FSE，至少覆盖）：**
   - **3.3b 同角色冗余折叠：** 构造或选用已知会触发同一角色 ≥3 同前提 finding 的文档（如一篇结构松散、重复论述同一前提的 PRD）
   - **3.5 矛盾解决：** 构造或选用已知会触发跨角色对立建议的文档（如一篇同时被 coherence 建议保留、scope-guardian 建议删除的段落）
   - **3.5c 前提-依赖链：** fixture 2（plan-with-origin）— 其 Problem Frame 本身包含前提级主张，验证 post-3.5b 前提信号检测与级联
   - **3.9 残余剔除 + R29/R30：** 运行 round 2 审查（同一 fixture 先跑 round 1 并记录 finding，再跑 round 2），验证残余剔除与多轮抑制

  冷路径夹具不使用"合成 persona JSON"——合成 JSON 绕过子代理调度与文档读取，测试的是合成逻辑而非端到端行为。使用真实文档 + 完整 workflow 运行。

**评分责任：**
- **定量维度**（finding 数、P0/P1 比、置信度分布）：实施者用表格记录 3 次运行的分布，报告中同时报告中位数与 min/max 范围
- **why_it_matters / 误报**：实施者或指定 reviewer **人工抽样**（每 fixture × 每 run ≥5 条或全部若更少）；原始输出全文保存供审计
- **通过/失败裁定：** 实施者对照下表；任一条在**中位数**上超阈值 → 失败并触发 U1 负载策略恢复或 U2 STOP 修复；"3 次中 2 次通过"不算通过——中位数超阈值即为失败

**原始输出留存：**
- Before/after 各 run 的子代理原始 JSON 输出保存到 `.spec-first/audits/fse-doc-review-optimization/{before,after}/run-{N}/{fixture-name}/`
- 人工评分记录（why_it_matters 逐条判定 + 误报逐条判定）与评分人身份保存到同目录 `scoring.json`
- DoD 验收时引用这些路径，不得以"实施者记忆中通过了"代替

| 对比维度 | 退化判定标准 | 通过标准 |
|---------|-------------|---------|
| Finding 数量 | 数量骤降 >30% 且无合理解释（如去重改进） | 数量变化 ≤30% 或差异可解释 |
| 严重级别分布 | P0/P1 比例显著下降（暗示锚点保守化） | P0/P1 比例变化 ≤20% |
| 置信度分布 | 75/100 比例显著上升（膨胀）或 50 比例显著上升（保守化） | 分布偏移 ≤25% 或方向一致；**`75/100` 比例下降 >25% → 触发 detail 回填 spine** |
| why_it_matters 质量 | document-structure-first framing（"Section X says Y"） | 抽样人工审查，≥80% 保持 observable-consequence-first |
| 误报率 | FP 目录已知反模式 | 无误报 finding |
| 冷路径 STOP | 应触发场景未读 reference / 未执行步骤 | 场景夹具 100% 触发对应 STOP 行为（人工或日志证据） |

### Contract Tests

```bash
# 结构契约（Wave 1a 最小 + 1b/2 全量）
npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand
```

**结构契约覆盖范围：** 复用现有 `spec-doc-review-contracts.test.js` 的字符串包含断言模式（与 `spec-plan-contracts.test.js` 一致），扩展到：
- U1 spine 含硬约束标记（schema enums、autofix_class 值、置信度速查表 5 锚点、FP catalog 关键条目词）、含可选 detail 指引行（非 always-read STOP）
- U2 热路径含 `3.5b` always-on 文本、含 3.5 STOP 锚点文案且语义为 `unmerged` opposing（非 `merged`）、含 3.5c STOP 锚点且位置在 3.6 之前、含 `post-3.5b` 锚定文本
- U3 主文件含分类与激活 STOP 锚点文案与对应 reference 文件名
- 各惰性 reference 文件物理存在且含被移出段落的关键标识字符串

### 多 Host Runtime 投射验证（集成测试）

**不依赖裸 `spec-first init`（交互式，不保证覆盖五个 host）。** 使用项目已有的 `init-five-host-lifecycle.integration.test.js` 模式：`getSupportedPlatforms()` 遍历 + 临时 sandbox + `spec-first init --<platform>` 非交互式执行，断言每个新增 reference 文件在对应 host runtime 路径的物理存在。

**新增或扩展集成测试文件** `tests/integration/doc-review-five-host-projection.integration.test.js`：

```javascript
// 模式复用 init-five-host-lifecycle.integration.test.js:
// tempSandbox(platform) → runSpecFirst(['init', `--${platform}`], sandbox) → fs.existsSync(...)
```

**断言矩阵（每个 host 至少断言以下路径存在）：**

| Host | 应存在的 reference 文件（示意；以 generator 实际输出路径为准） |
|------|-----------------------------------------------------------|
| Claude | `.claude/spec-first/workflows/spec-doc-review/references/subagent-confidence-rubric-detail.md` 等 U1-U3 全部惰性 reference |
| Codex | `.codex/spec-first/workflows/spec-doc-review/references/...` |
| Cursor | `.cursor/spec-first/workflows/spec-doc-review/references/...` 或 skill mirror（视 generator 策略） |
| Kiro | `.kiro/spec-first/workflows/spec-doc-review/references/...` 或 skill mirror |
| Qoder | `.qoder/spec-first/workflows/spec-doc-review/references/...` 或 skill mirror |

此外断言 **skill mirror 路径**（如 `.claude/skills/spec-doc-review/references/`、`.agents/skills/spec-doc-review/references/`）中 reference 文件也投射正确——不仅 workflow references 路径。具体路径以 `getSupportedPlatforms()` + `getAdapter(platform)` 的 `pointerPath` / skill mirror 约定为准，不硬编码单一 host。

**不与结构契约重复：** 结构契约测试 source 字符串包含（快速，无 CLI 依赖）；集成测试验证 runtime 物理投射（慢，依赖 `spec-first init`）。两者互补，结构契约在 `npm test` 中运行，集成测试在 `npm run test:integration` 中运行。

```bash
# 多 host 投射集成验证
npx jest tests/integration/doc-review-five-host-projection.integration.test.js --runInBand
```

### 验证命令

```bash
# 语法检查
npm run typecheck

# 聚焦测试
npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand
```

---

## Definition of Done

- [ ] **Wave 1a 基线测量：** 优化前/后指令体积（行数与估算 token）已记录；Objective 降幅用实测数字表述（~12k/~14k 仅作假设对照）
- [ ] U1: 子代理模板 spine (~80 行) + 3 个惰性 reference 完成；**默认 spine-only** 负载策略落地；最小结构契约通过
- [ ] U2: 合成热路径含 **always-on 3.5b**、3.5c-before-3.6、正确 STOP 表（含 3.5c shape-match 触发规则）；5 个惰性 reference 完成；contract test 通过
- [ ] U3: SKILL.md 降至 ~160 行，2 个惰性 reference 完成；分类/激活 fixture 验证通过（3 份文档 × spine-only 分类和角色激活 100%/无漏派）
- [ ] U4: 结构契约（`tests/unit/spec-doc-review-contracts.test.js`）覆盖 spine/reference 结构断言
- [ ] U4: 集成测试（`tests/integration/doc-review-five-host-projection.integration.test.js`）覆盖 `getSupportedPlatforms()` 全部 host 的 runtime reference 物理投射 + skill mirror 路径
- [ ] Fresh-source eval 通过——fixture 路径与 before revision 已锁定；每个 fixture × 3 runs × before/after；原始输出 + 评分记录留存 `.spec-first/audits/fse-doc-review-optimization/`；中位数超阈值已触发恢复策略
- [ ] `spec-first init` 后全部 host 的 workflow references 与 skill mirror 中 reference 文件就位（集成测试验证）
- [ ] CHANGELOG 更新

---

## Open Questions

1. **~~子代理是否应被告知惰性 reference 的存在和位置？~~（已选定默认策略）**  
   **决议：** 默认 **spine-only**——spine 保留一行可选 detail 指引，**不** always-read。若 FSE 显示置信度/`why_it_matters` 超阈值退化，再升级为更强措辞（"Before assigning confidence anchors, read..."）或把压缩详解回填 spine；若从不加载且质量无退化，可删除 detail 文件。实施期不再把「是否告知」当作未决阻塞项。

2. **3.5c 前提-依赖链的触发条件"framing-level section"的精确列表是否需要扩展？** 当前枚举：Problem Frame, Summary, Overview, Why, Motivation, Goals。如果实际文档使用其他标题（如 "Background", "Context", "Rationale"），需要补充。等待 fresh-source eval 中构造的触发场景验证。**触发集合已固定为 post-3.5b（非 post-routing）。**

3. **决策引物上限（20 条）是否合理？** 当前无多轮审查的实际数据。Wave 3 实施前需要收集至少 3 次真实多轮审查的 primer 规模数据来校准。
