# 顶尖架构师技术方案工作流 → spec-plan 缺口诊断与方案 001 增补建议

> 生成时间:2026-06-26 03:05
> 作者:leokuang(Spec-First Evolution Architect 视角)
> 调研对象:业界技术方案/设计文档最佳实践(一手:Google "Design Docs at Google" / Malte Ubl;旁证:IETF/Rust/React RFC、ADR、arc42、C4、AWS Well-Architected、Stripe/Uber RFC)
> 关联:`skills/spec-plan/`(现状)、`docs/plans/2026-06-26-001-feat-spec-plan-enterprise-readiness-plan.md`(已有方案)
> 定位:调研 + 诊断 + 对方案 001 的差异化增补建议;作为后续 deepen 方案 001 的 origin 证据。**不改 skill source(plan-only)。**

---

## 维护者决策摘要(TL;DR,一屏可拍板)

**一句话**:对照一手 Google design doc 标准与顶尖架构师工作流,`spec-plan` 的核心架构已业界顶尖;经 6 轮逐项核实,真正该做的改进 = 方案 001 内的 **3 句 enterprise rubric 提示,零新增能力 / 零新 agent / 零破 core template**。

**要不要做(4 项裁决)**:

| 项 | 裁决 | 落点 |
|---|---|---|
| A 高风险 KTD 显式 trade-off | ✅ 做 | 001 R10 + U1 rubric;deepening `:41/:201` 已部分兜底,不破 core template |
| B privacy 显式声明(含非 DB 个人数据流) | ✅ 做 | 001 R10;复用 `spec-data-integrity-guardian`(已含 GDPR/CCPA)+ `spec-security-sentinel`,**不新建 privacy specialist** |
| C greenfield/brownfield 定形维度 | ❌ 不做 | 已被 3.4b Output Structure + Direct Evidence 覆盖 |
| D 数据/ML 触发检查 | ⚠️ 做数据侧,ML 特有 opt-in | 001 R10;复用 `data-migration-expert`+`data-integrity-guardian`;ML 特有(特征/模型版本)低频,列 explicit opt-in,**不新建 data/ML specialist** |

**关键认知纠正(过程透明)**:第 1 轮的"4 个新方向"被第 2/3/4 轮核实逐步证伪/降级——G1 其实 deepening 已覆盖、privacy 能力其实已部分存在、数据侧其实已被两个 specialist 覆盖。**结论从"加能力"翻转为"把已有能力在高风险场景显式触发"。**

**对"不同研发端格式"的回答**:不需要"研发端"作为新分类轴。`spec-plan` 现行的"按 work-nature 选 medium(HLD 3.4)+ 按 risk/surface 触发 specialist(deepening)"轴更优,研发端只是 work-nature 的相关变量。

**仍待维护者定的唯一开放项**:ML 特有 specialist(特征/模型版本/训练-服务偏斜)是否值得未来 explicit opt-in——取决于 ML 方案在真实用户中的频次(本分析判为低频,默认不做)。

> 详细推导见下文 §0-§9;可执行落点已回写进 `docs/plans/2026-06-26-001-...-plan.md` 的 R10 / U1 / §9。

---

## 0. 结论先行

`spec-plan` 在**问题重构、goals/non-goals、right-sizing、alternatives、handoff 边界**上已达业界顶尖,部分维度(origin A/F/AE trace、U-ID 稳定性、plan-only 安全契约)甚至强于通用 design doc 实践。方案 001 用"条件触发 + 附录 + deepening 加权 + 不破坏 right-size"框架吸收企业风险能力,方向正确。

但对照 Google design doc 一手标准与顶尖架构师工作流,仍有 **4 点差异化缺口**,且都未被方案 001 显式吃掉:

| # | 缺口 | 严重度 | 是否在方案 001 内 |
|---|---|---|---|
| G1 | **KTD 生成期缺 trade-off 提示**(deepening 阶段已覆盖,但 plan-template 生成提示弱) | ~~高~~ → **中低**(见 §6 第 2 轮纠正) | 否,但 deepening 已部分兜底 |
| G2 | **Cross-cutting concerns(尤其 privacy)未作为显式 lens**,而是散落在 risk/deepening;且 **无 privacy 专门 specialist** | 中高 | 部分(security/observability 作触发器,privacy 几乎空白) |
| G3 | **degree-of-constraint / greenfield-vs-brownfield 未作为定形维度** | 中 | 否 |
| G4 | **"研发端"维度未并入统一 lens selection**(用户特别关注) | 中 | 否 |

核心判断:**这 4 点不推翻方案 001,而是它的增补**。四者都能以"lens/触发器"形态挂进方案 001 的同一框架(enterprise reference 的 Trigger Matrix / Review Rubric + deepening 评分 + HLD medium 选择),无需新机制。

> **第 2 轮(loop 2/20)核实更新**:G1 严重度从"高"下调到"中低",G2 暴露真实 specialist 缺口。详见 §6.1「第 2 轮事实核实与自我纠正」。本表已反映纠正后口径。

---

## 1. 顶尖架构师由需求输出技术方案的工作流(7 动作,非"填模板")

综合 Google design doc 一手材料与业界实践,顶尖架构师的输出过程是 **7 个思维动作**,而不是按章节填空:

1. **重构问题(Problem framing)**:不接受需求表面。把 context(客观事实)与 requirements 分离;明确 goals 和 **non-goals**——non-goals 不是负向目标("不崩溃"),而是"本可成为目标但显式排除"(Google 例:设计数据库时 ACID compliance 是 goal 还是 non-goal 必须表态)。

2. **解空间定界(Degree of constraint)**:Google 的关键洞察——**设计文档的形态由"解空间受约束程度"决定**。greenfield 要先立规则把解空间收敛到可管理集合;legacy/受限场景要在已知拼图里创造性组合、聚焦"在所有 trade-off 下选最不坏"。

3. **方案选择以 trade-off 为中心(The actual design)**:设计文档的核心价值不是"描述选中方案",而是"给定 context+goals,**为什么这个方案在 trade-off 上最优**"。overview→detail;用 system-context-diagram 把系统放进更大技术景观;API/data 只写与 trade-off 相关部分(不贴完整 schema——冗长且易过期);几乎不写代码,除非新算法。

4. **Alternatives considered(最有价值章节之一)**:列其他合理方案,聚焦各自 trade-off 与为何被否。这是"资深判断"的直接体现——证明探索过解空间,而非选了第一个想法。

5. **Cross-cutting concerns(横切关注点)**:security、privacy、observability 是**组织强制项**。Google 要求项目有独立 privacy design doc + 专门 security/privacy review,且最佳实践是"**尽早 engage** 安全/隐私团队,从地基就纳入设计"。

6. **Right-sizing + 何时不写**:10-20 页是大项目甜点,1-3 页 mini doc 步骤相同只是更聚焦。关键反模式:design doc 退化成 **implementation manual**(只说"怎么实现"不讲 trade-off/alternatives)——这种情况不该写文档,直接写代码。"**解的歧义度**(problem/solution ambiguity)"是要不要写文档的核心判据。

7. **Lifecycle(文档是活的)**:创建+快速迭代 → review(轻量评论或重量评审会,**尽早 senior review**)→ 实现迭代 → 维护与学习。文档同时是:组织记忆、senior 知识规模化、设计者技术档案。

---

## 2. 逐动作对齐 spec-plan 现状

| 架构师动作 | spec-plan 现状 | 评级 |
|---|---|---|
| 1 问题重构 | Problem Frame + Goals/Non-goals(Scope Boundaries 三段式)+ requirements trace(含 origin A/F/AE) | ✓ 强(强于通用实践) |
| 2 解空间定界 | 有 plan-depth(按复杂度/风险),有 Output Structure(greenfield 树);但**未把"受约束程度/greenfield-vs-brownfield"作为显式定形维度** | △ G3 |
| 3 trade-off 为中心 | 有 KTD(decision: rationale)+ HLD;但 **KTD 模板是一行"决策+理由",不强制表达"牺牲了什么/为何可接受"** | △ G1 |
| 4 Alternatives | Alternative Approaches Considered,明确"必须在 how 上不同,tiny variant 归 KTD,product-shape 归 brainstorm" | ✓ 强 |
| 5 横切关注点 | System-Wide Impact + Risks + deepening specialist;但 **security/privacy/observability 非显式横切 lens,privacy 几乎空白** | △→✗ G2 |
| 6 right-sizing/何时不写 | Lightweight/Standard/Deep + "well-patterned 跳过 HLD" + plan-only 不退化执行脚本 | ✓✓ 极强(系统化超过 Google 口头约定) |
| 7 lifecycle | deepening + status frontmatter + handoff + doc-review;组织记忆靠 docs/solutions + compound | ✓ 充分 |

**结论**:6 项里 4 项已顶尖,真实缺口集中在 G1/G2/G3,外加用户关注的 G4。

---

## 3. 用户问题专项:不同研发端 / 不同场景的输出格式(G4)

### 3.1 各研发端方案的关注点差异(业界事实)

| 研发端 | 方案重心 | spec-plan 对应能力 |
|---|---|---|
| 前端/客户端 | UI 状态、交互流、组件层级、响应式/无障碍、Figma 对齐、跨端 parity(App/H5/PC) | spec-design-lens-reviewer(仅 deepening 触发) |
| 后端/服务 | API 契约、数据模型、事务一致性、幂等、并发 | 方案 001 企业附录主战场 |
| 数据/ML | 数据 pipeline、schema 演化、回填、特征/模型版本、离线在线一致性 | **几乎无专门引导** |
| 基础设施/平台 | IaC、容量、灰度、回滚、SLO、多区域 | 方案 001 部分(rollout/capacity) |
| 库/SDK/CLI | 公共契约、版本兼容、弃用策略、consumer-driven contract | spec-api-contract-reviewer |

### 3.2 关键洞察:不是模板分叉,而是 lens/medium selection

Google 的明确立场:design doc **"no strict guideline, write in whatever form makes the most sense"**。所以"不同端格式"的正确吸收方式**不是为每个端做一套模板**(那会制造 N 个模板、违反 Light contract + right-size),而是强化已有的两条线:

- spec-plan **HLD 3.4 节的"medium 选择表"**(DSL→grammar、multi-component→sequence diagram、data pipeline→data flow、state→state diagram、mode 组合→decision matrix)就是"**按问题性质选表达媒介**"的雏形——可扩展为也覆盖前端交互态/数据 pipeline/契约。
- 方案 001 的**企业触发矩阵**是"按风险维度触发关注点"——可统一为 "**风险维度 + 研发端维度**" 的单一 lens selection。

即:**G4 的最佳实践 = 把"研发端"并入方案 001 已有的"条件触发 + medium 选择"统一机制,而非新增端模板。** 这与 Google "by trade-off, choose the medium" 和本仓 right-size/Light contract 完全一致。

---

## 4. 一份技术方案文档应包含什么(完整清单 + spec-plan 覆盖度)

### 4.1 恒定核心(任何方案都要)

| 内容 | spec-plan 覆盖 |
|---|---|
| 元信息(标题/类型/状态/日期/作者/spec_id) | ✓ |
| Summary(一段可 skim) | ✓ |
| Context & Scope(客观背景,不含方案) | ✓ Problem Frame |
| Goals & Non-goals(显式排除) | ✓ |
| 当前状态/约束(brownfield current-state) | △ Direct Evidence 部分承载,无显式 current-state map(关联 G3) |
| 提议方案 overview→detail | ✓ HLD + Implementation Units |
| 关键决策 + **trade-off** | △ G1(缺强制 trade-off) |
| Alternatives considered | ✓ |
| 验证/测试策略 | ✓ test scenarios |
| 风险 + 缓解 | ✓ |
| Open questions | ✓ |
| Sources/references | ✓ |

### 4.2 条件章节(按问题性质/风险/研发端触发)

| 内容 | spec-plan / 方案 001 覆盖 |
|---|---|
| System-context diagram | △ HLD 可选,未显式提示"系统在更大景观中的位置" |
| API 契约(语义/错误码/幂等/版本) | 方案 001 附录 ✓ |
| 数据模型/存储/迁移/回滚 | 方案 001 附录 ✓ |
| 事务/一致性/MQ 补偿 | 方案 001 部分 |
| 性能/容量 | 方案 001 触发 ✓ |
| **Security 横切** | △ 散落(G2) |
| **Privacy 横切** | ✗ 几乎空白(Google 强制独立 doc!)(G2) |
| **Observability 横切** | △ Operational Notes(G2) |
| 灰度/回滚/feature flag | 方案 001 触发 ✓ |
| 定时任务专项 | 方案 001 附录 ✓ |
| 前端:交互状态/响应式/无障碍 | △ design-lens deepening(G4) |
| 迁移/rollout plan | ✓ Deep 扩展 |
| Success metrics | ✓ Deep 扩展 |

---

## 5. 对方案 001 的差异化增补建议(4 点,均挂进 001 现有框架)

> 这些是 **deepen 方案 001 时的候选增补**,不是新方案。每条都标注挂载点与边界守护。

### 增补 A(对应 G1)— KTD 强制 trade-off 表达

- **挂载点**:方案 001 不直接管 KTD 模板,但可在 enterprise reference 的 Review Rubric 加一条"高风险决策的 KTD 必须显式表达 trade-off(选了什么 / 牺牲了什么 / 为何在 goals 下可接受)";更彻底的做法是单独小改 `plan-template.md` 的 KTD 行格式提示(非本 001 范围,可另开)。
- **边界**:不强制所有 KTD 都写满 trade-off(违反 right-size),只在 Standard+/高风险决策上要求;轻量计划不变。
- **依据**:Google——design doc 核心价值就是 trade-off;这是当前 spec-plan 最弱、收益最高的一点。

### 增补 B(对应 G2)— Cross-cutting concerns 作为显式 lens(尤其 privacy)

- **挂载点**:方案 001 的 enterprise Trigger Matrix 已有 security/权限;补 **privacy(个人数据/合规/数据保留)** 和 **observability** 作为显式横切触发器,deepening 已映射的 spec-security-sentinel 可承载 security;privacy 可复用 data-integrity-guardian 或在 rubric 里要求"个人数据处理必须显式声明保留/最小化/合规边界"。
- **边界**:不学 Google 强制"每个项目独立 privacy doc"(对 AI coding 场景过重),而是"**触及个人数据/合规时**才作为硬触发,要求 plan-time 显式声明或显式 Deferred";不触及则静默。调和了 Google 强制 vs spec-plan right-size 的张力。
- **依据**:Google 把 privacy/security 设为强制横切;spec-plan 目前 privacy 几乎空白,是真实合规风险敞口。

### 增补 C(对应 G3)— degree-of-constraint 作为定形维度

- **挂载点**:`planning-flow.md` 0.6 Assess Plan Depth(方案 001 的 U6 已要在此加企业风险联动)——可顺带加一句 advisory:"判定 greenfield(解空间开放,需先立规则收敛)还是 brownfield(受限,需 current-state map + 在约束内组合)",并据此提示是否需要 **Output Structure(greenfield)** 或 **current-state map(brownfield)**。
- **边界**:advisory 一句,LLM 决定;不新增脚本字段,不新增强制章节。
- **依据**:Google 把"degree of constraint"列为决定文档形态的首要因素;spec-plan 有 Output Structure 但没把这个判断显式化。

### 增补 D(对应 G4)— 研发端并入统一 lens selection

- **挂载点**:把"研发端维度"并入方案 001 enterprise reference 的 Trigger Matrix 与 spec-plan HLD 3.4 的 medium 选择表——例如"前端→交互态/响应式/无障碍 lens(spec-design-lens-reviewer)""数据/ML→pipeline/schema 演化/回填 lens""库/SDK→consumer-driven contract lens"。
- **边界**:**绝不做端模板分叉**;只在 lens selection 表里多列几行触发器 + 对应已有 specialist/medium。数据/ML lens 若无对应 specialist 则只给 rubric 提示,不新建 agent(沿用方案 001 KTD2/KTD5 的"复用不新建"纪律)。
- **依据**:Google "whatever form makes sense" + 本仓 Light contract;回应用户对"不同端格式"的关注而不破坏架构。

---

## 6. 与方案 001 的关系与下一步

### 6.1 第 2 轮(loop 2/20)事实核实与自我纠正

第 2 轮针对 §7 列出的 3 个未验证项做了源码核实,纠正了第 1 轮的两处过度判断(保持事实诚实):

- **纠正一 — G1 严重度从"高"下调到"中低"。** 第 1 轮断言"KTD 缺强制 trade-off 表达、Google 视为核心价值、当前最弱"。核实 `deepening-workflow.md` 后发现 trade-off **在 deepening 阶段已被覆盖**:
  - `:41` 已有检查项 `Rationale does not explain tradeoffs or rejected alternatives`
  - `:201` 已要求 `If a real tradeoff remains, record it explicitly in the plan`
  - `:113` 已映射 `spec-architecture-strategist` 做 `design integrity, boundaries, and architectural tradeoffs`
  - 真实缺口仅是 `plan-template.md:141` 的 KTD 行格式 `[Decision]: [Rationale]` 在**生成期**没提示 trade-off 列。所以这是"模板生成提示弱",不是"机制缺失"。**结论:增补 A 不需要破"core template 零改动"边界——只在 enterprise reference 的 Review Rubric 加一句"高风险 KTD 显式表达 trade-off",deepening 已能兜底。开放问题 1 解决。**

- **纠正二 — G2 暴露真实 specialist 缺口。** 第 1 轮说"privacy 可复用 data-integrity-guardian"。核实 `agents/` 后发现:存在 `spec-security-sentinel` / `spec-security-reviewer` / `spec-security-lens-reviewer`(security)与 `spec-data-integrity-guardian`(数据一致性/事务),**无独立命名的 privacy specialist**。⚠️ **第 4 轮再核实修正**:`spec-data-integrity-guardian` 的 description 明确含 `privacy compliance`,正文含 `data privacy regulations (GDPR, CCPA)` + `data governance`——即 **privacy 能力实际已部分存在**,只是绑定在 persistent-data/DB 语境,不覆盖"非 DB 个人数据流(日志/埋点/第三方传输/客户端采集)"。故第 2 轮"data-integrity≠privacy、无 privacy specialist"过于绝对,准确表述见 §6.5。**结论(经第4轮修正):privacy 短期落 rubric+显式声明,DB 侧复用 data-integrity-guardian、传输/访问侧复用 security-sentinel,不新建 privacy specialist。开放问题 2 解决。**

- **附带确认**:`spec-architecture-strategist` 存在且已被 deepening `Key Technical Decisions` 段映射(`:113`),增补 A 的执行者已就位,无需新建。

> 第 2 轮净结论:G1 降级 + 不破边界,G2 确认 privacy 是真实空白且无现成 specialist。方案 001 的"复用不新建 + 不破 core template"框架因此更稳——A 落 rubric、B 落 rubric+显式声明,均在 001 现有改动面内,无新机制、无新 agent。

### 6.2 增补候选与开放问题(滚动更新)

- 本文档是**对方案 001 的外部对标补强**,不替代、不推翻。方案 001 的 P0/P1(enterprise reference + deepening + 测试)仍是落地主干。
- 增补 A–D 是**可选 deepen 候选**:建议在方案 001 进入实现前,由维护者决定是否把 A(KTD trade-off 提示)、B(privacy/security 显式 lens)纳入 P1,把 C(degree-of-constraint)、D(研发端 lens)纳入 P2 或 Deferred。
- A **不再需要破** `plan-template.md` "core template 零改动"边界(§6.1 纠正一):只在 enterprise rubric 加 trade-off 提示即可,deepening 已兜底。

### 待维护者确认的开放问题(第 2/3 轮更新状态)

1. ~~增补 A 是否值得破 core-template 零改动边界?~~ **[第2轮已解决]** 不需要破边界,落 enterprise rubric 提示,deepening 已兜底。
2. ~~增补 B 复用 data-integrity 还是需要 privacy specialist?~~ **[第2轮已解决]** 无现成 privacy specialist,data-integrity 不可替代 privacy;短期落 rubric+显式声明,是否新建 privacy specialist 默认不做、标记待决策。
3. ~~增补 C/D 是否值得做,还是会侵蚀 right-size?~~ **[第3轮已解决]** C 基本已被 3.4b Output Structure + Direct Evidence 覆盖,降级为可选微调(最多 HLD 3.4 一句 greenfield 提示);D 的前端/后端/基础设施/库SDK 端全已被现有 medium 表 + deepening 映射 + 方案001 覆盖,**不需要"研发端"作为新分类轴**,唯一真空白是数据/ML 特有关注点。详见 §6.3。

### 6.3 第 3 轮(loop 3/20):增补 C/D 评估与最终收敛

第 3 轮精读 `SKILL.md` HLD 3.4(medium 选择表)+ 3.4b(Output Structure)+ `planning-flow.md` 0.6(plan-depth),评估增补 C/D 的边际增益,结论是**两者大部分已被现有机制覆盖,应大幅降级**:

- **增补 C(greenfield-vs-brownfield 定形维度)→ 降级为可选微调,不作独立增补。**
  - greenfield 已被 `SKILL.md:219` **3.4b Output Structure** 覆盖(新结构给文件树,且 when-to-include/skip 已按 greenfield/brownfield 分流)。
  - brownfield current-state 已被 **Direct Evidence / Direct Evidence Readiness** 强制披露(读了哪些源码=现状事实基础)。
  - 真实增量仅 Google 说的"greenfield 先立规则收敛解空间"这一**设计思维提示**,优先级低,最多在 HLD 3.4 补一句,不值得作为方案 001 增补项。

- **增补 D(研发端 lens)→ 降级为"仅数据/ML 端的 rubric 提示",不作"研发端维度"新轴。** 逐端核实覆盖度:
  | 研发端 | 现有覆盖 | 结论 |
  |---|---|---|
  | 前端/客户端 | deepening 已映射 `spec-design-lens-reviewer`(信息架构/交互态/响应式/无障碍/AI-slop) | 已覆盖 |
  | 后端/服务 | 方案001 enterprise Trigger Matrix + HLD `multi-component→sequence diagram` | 已覆盖 |
  | 基础设施/平台 | deepening `spec-deployment-verification-agent` + `spec-performance-oracle`;方案001 rollout/capacity | 已覆盖 |
  | 库/SDK/CLI | deepening `spec-api-contract-reviewer` + 方案001 API 附录 | 已覆盖 |
  | **数据/ML** | HLD `data pipeline→data flow` 有 medium;但 **schema 演化/回填/离在线一致性/特征+模型版本** 无专门 lens/specialist(`data-migration-expert` 偏迁移、`data-integrity-guardian` 偏一致性) | **真空白** |

  - **关键洞察(直接回应用户"不同研发端格式"):** `spec-plan` 不需要"研发端维度"作为新分类轴。现行设计用更优的轴解决了同一问题——"**按 work nature 选 medium + 按风险/surface 触发 specialist lens**"。研发端只是 work nature 的相关变量,不是独立轴;强加会与 medium 表/specialist 映射重叠制造冗余。这与 Google "whatever form makes the most sense" 一致。
  - 唯一真空白(数据/ML 特有关注点)与第2轮 G2 privacy 缺口**同构**:短期落 enterprise rubric 一行提示,是否新建 data/ML specialist 默认不做、标记待决策。

#### 最终收敛:方案 001 实际只需 3 行 enterprise rubric 增量 + 2 个待决策 specialist 缺口

经三轮核实,第 1 轮看似"4 个新方向(A/B/C/D)"收敛为**方案 001 enterprise reference 的极小增量**,完全守住 right-size / Light contract / 复用不新建:

| 增补 | 最终落地形态 | 待决策项 |
|---|---|---|
| A(trade-off) | enterprise rubric 加一句"高风险 KTD 显式表达 trade-off(选了什么/牺牲什么/为何可接受)",deepening 已兜底,不破 core template | 无 |
| B(privacy) | enterprise rubric 加一句"个人数据/合规触发 privacy 显式声明(保留/最小化/合规边界)",security 复用 `spec-security-sentinel` | privacy specialist 是否新建 |
| C(greenfield/brownfield) | 基本已覆盖;可选 HLD 3.4 加一句 greenfield"先立规则收敛解空间",优先级最低,**可不做** | 无 |
| D(数据/ML) | enterprise rubric 加一句"数据/ML 改动触发 schema 演化/回填/离在线一致性检查",其余端不动 | data/ML specialist 是否新建 |

> 第 3 轮净结论:**正确的事不是给 spec-plan 加分类轴或加章节,而是确认它的轴(work-nature medium + risk/surface specialist)已经对,只需在方案 001 的 enterprise reference 补 3 行 rubric 提示。** 两个真实领域空白(privacy、数据/ML specialist)留作维护者决策,默认复用不新建。

### 6.4 第 4 轮(loop 4/20):两个 specialist 缺口的建/不建决策

第 4 轮直读 `agents/spec-data-integrity-guardian`、`spec-data-migration-expert`、`spec-security-sentinel` 的能力边界,对 §6.3 留下的两个"待决策 specialist 缺口"给出明确建议——**结论:两者都不新建。**

**privacy specialist — 不新建。**
- 能力已约 80% 存在:`data-integrity-guardian` 含 `privacy compliance` / GDPR / CCPA / data governance(DB 侧);`security-sentinel` 含 auth/authz/secrets/OWASP(访问/传输侧)。
- 真空白仅"非 DB 个人数据流"(日志/埋点/第三方传输/客户端采集),频次中低。
- 新建成本高(新 agent profile + deepening 映射 + 双宿主投影 + 测试 + 会话缓存验证),与收益不匹配。
- **落点**:方案 001 enterprise rubric 的 privacy 提示显式纳入"个人数据流(含非 DB)",deepening 时 DB 侧复用 `data-integrity-guardian`、访问/传输侧复用 `security-sentinel`。rubric 兜底,不新建。

**data/ML specialist — 不新建(现在),列为未来 explicit opt-in 候选。**
- 数据侧已被覆盖:`data-migration-expert`(schema changes / backfill / rename / enum / rollback)+ `data-integrity-guardian`(data model / constraint / governance)。
- 真空白仅 ML 特有(特征/模型版本、离在线一致性、训练-服务偏斜),**低频、高度专门**,符合本仓 80/20——低频边缘能力应放 optional / explicit opt-in,不进 durable 默认机制。
- 当前 spec-first 用户画像无证据表明 ML 方案是高频场景,新建收益存疑。
- **落点**:方案 001 enterprise rubric 加"数据/ML 改动触发 schema 演化/回填/一致性检查(复用现有两个 specialist);ML 特有的特征/模型版本与离在线一致性若适用则 plan-time 显式声明或 Deferred"。ML specialist 列为未来 explicit opt-in,不进本轮。

#### 净结论(三轮+本轮累积):方案 001 最终增量 = 纯 rubric 提示,零新 agent / 零新机制 / 零破 core template

| 项 | 最终落地 | 是否新建 specialist |
|---|---|---|
| A trade-off | enterprise rubric 一句(deepening 已兜底) | 否 |
| B privacy(含非 DB 个人数据流) | enterprise rubric 一句 + 复用 data-integrity-guardian + security-sentinel | **否** |
| C greenfield/brownfield | 已被 3.4b + Direct Evidence 覆盖,可不做 | 否 |
| D 数据/ML | enterprise rubric 一句 + 复用 migration-expert + integrity-guardian;ML 特有列 explicit opt-in | **否** |

> 第 4 轮净结论(直接回答用户问题2"spec-first 要改进哪些点"):**改进点极小且全在方案 001 的 enterprise rubric 内——spec-plan 的架构轴与 agent 生态已足够。真正要做的是把已有能力在高风险场景下"显式触发"出来,而不是新增能力或新建 specialist。** 这是最符合 Light contract + 80/20 + 复用不新建的落点。

### 6.5 与方案 001 的关系

---

## 7. 调研边界与未验证项(诚实声明)

- **联网受限**:本会话 WebSearch / 部分 WebFetch 被网络策略阻断;Google design doc 内容经 MCP fetch 抓取一手原文(`industrialempathy.com/posts/design-docs-at-google`),其余业界实践(RFC/ADR/arc42/C4/AWS Well-Architected/Stripe/Uber RFC)来自助手内部知识,**未逐一抓取一手页面核实**,作为旁证而非硬引用。
- **已核实(第 2 轮)**:~~增补 B 的 privacy specialist 是否已存在;增补 A 破边界成本~~ → 已核实:无 privacy 专门 specialist;增补 A 不需破边界(deepening 已覆盖 trade-off)。详见 §6.1。
- **仍未验证**:ML 特有 specialist(特征/模型版本)真实需求频次(第 4 轮判为低频,列 explicit opt-in);未读各 specialist agent profile 全文(已读 data-integrity-guardian / data-migration-expert / security-sentinel 关键段,其余仅核实存在性与 deepening 映射)。
- **未执行**:未实跑修改后行为(plan-only);本文档是诊断与建议,非已落地变更。
- **source 真相源**:spec-plan 现状结论基于 SKILL.md + references 全文直读;第 2 轮新增对 `deepening-workflow.md`(trade-off 检查项 :41/:113/:201)与 `agents/`(privacy specialist 缺位)的直接核实。

---

## 8. 引用

- 一手:Malte Ubl, "Design Docs at Google", https://www.industrialempathy.com/posts/design-docs-at-google/(context/scope、goals/non-goals、actual design with trade-offs、alternatives considered、cross-cutting concerns、length/right-sizing、when not to write、lifecycle 均引自此文)
- 旁证(内部知识,未逐一抓取):IETF RFC、Rust RFC、React RFC、ADR(Michael Nygard)、arc42、C4 model、AWS Well-Architected Framework、"Scaling Engineering Teams via RFCs"(Pragmatic Engineer)
- 本仓:`skills/spec-plan/SKILL.md`、`skills/spec-plan/references/{plan-template,deepening-workflow,planning-flow}.md`、`docs/plans/2026-06-26-001-feat-spec-plan-enterprise-readiness-plan.md`

---

## 9. 第 6 轮(loop 6/20):方案 001 U7 的 8 类高风险 eval 可执行通过判据

> 目的:把方案 001 U7「`output-quality-cases.json` 增量 8 类高风险场景」从"列了场景"推进到"有可判定的通过/不通过判据",供 U7 实现期直接转写为 `objective_assertions`。沿用现有 eval schema(`with_skill_expectations` / `objective_assertions` / `missing_evidence`),**仅为 plan-time 设计依据,非已写入的 eval JSON**。
> 统一通过总纲(报告 7.4):高风险场景的 plan 不能只给泛泛 `handle errors / add monitoring / consider rollback`,**必须出现具体 plan-time 决策或显式待确认问题**。每条判据下"通过"=出现具体决策/参数/显式 Deferred;"不通过"=泛泛带过或静默省略。

| # | 场景 | 通过(具体 plan-time 决策或显式待确认) | 不通过(应被判失败) |
|---|---|---|---|
| 1 | 权限接口 | 命名 authz 模型(角色/资源/动作)、越权防护点、审计落点;或显式 Deferred 并说明依赖 | 仅"加权限校验"无主体/资源/动作 |
| 2 | 高 QPS 列表 | 给出分页策略、索引/缓存键与失效、限流阈值或显式容量假设;复用 `spec-performance-oracle` | 仅"注意性能/加缓存"无参数与失效策略 |
| 3 | 跨服务 MQ 写 | 明确消费幂等键、重试次数/退避、最终失败处理(DLQ/告警/人工)、补偿;复用 data-integrity | 仅"用 MQ 异步"无幂等与失败兜底 |
| 4 | 数据迁移 | DDL 是否锁表+数据量+预估耗时、回填策略(一次性/分批/懒)、回滚路径、不可逆则备份;复用 `spec-data-migration-expert` | 仅"做数据迁移"无回滚/备份 |
| 5 | 定时任务 | 触发方式、批次/峰值/耗时、幂等依据、并发控制(分片/锁/TTL)、失败重试、监控项 | 仅"加定时任务"无幂等与并发控制 |
| 6 | 高风险灰度上线 | feature flag、灰度维度、观察周期、全量准出条件、回滚阈值(错误率/TP99/核心指标)、回滚步骤 | 仅"灰度上线/可回滚"无阈值与准出 |
| 7 | PRD 覆盖缺口 | 未覆盖功能点进 Open Questions 或显式阻断 handoff(对应 R4 Coverage Matrix) | 静默不覆盖、或声称 ready 却有未覆盖项 |
| 8 | API 契约变更 | 调用方/路径/语义/副作用、入参校验、出参空值与分页、错误码、幂等键、向前兼容;复用 `spec-api-contract-reviewer` | 仅"改接口"无兼容性与错误码 |
| 反例 | 轻量 CRUD | **不出现任何企业附录/横切提示**,plan 保持精简(证明 R8 不膨胀) | 轻量计划被塞入企业附录或横切章节 |

**R10 三句的 eval 锚点(第 5 轮回写的增量,同样需可判定)**:
- A trade-off:高风险 KTD 出现"牺牲了什么 / 为何在 goals 下可接受";不通过=只有"决策+理由"无 trade-off。
- B privacy:触及个人数据(含非 DB:日志/埋点/第三方传输)时出现保留/最小化/合规边界声明;不通过=处理个人数据却无 privacy 声明也无 Deferred。
- D 数据/ML:数据改动出现 schema 演化/回填/一致性具体决策;ML 特有(特征/模型版本)若适用则显式声明或 Deferred,不通过=ML 方案静默省略离在线一致性。

> 边界:以上判据是 `with_skill_expectations` / `objective_assertions` 的设计素材,每个 eval case 落地时仍须按 `evals/README.md` 标注 `missing_evidence`(model execution / human adjudication),不得声称 fixture 已证明真实模型输出质量提升。判据由 LLM/reviewer 做语义判定,**不脚本化语义判决**(沿用方案 001 KTD3)。
