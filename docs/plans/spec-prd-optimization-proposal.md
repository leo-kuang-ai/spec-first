# spec-prd Skill 重构优化方案

**状态：** superseded（历史实施证据；不再作为当前 implementation contract）
**目标 surface：** `skills/spec-prd/` source（含 npm 内置 PRD 模板资产）、按激活单元新增的最小定向测试、五宿主 runtime projection
**历史分析：** 重构前的完整候选机制与五视角审查轨迹保留在 Git 历史 `5b8d8637^..5b8d8637`，不再作为当前实施合同
**当前权威：** `docs/plans/2026-07-11-002-refactor-spec-prd-product-decision-synthesis-plan.md`；当前 source 与测试事实仍优先于历史描述

> Supersession note（2026-07-11）：当前重构由上述 unified plan 接管。本文保留 M1 模板资产迁移、U1 Decision Card consistency 与 U4 Handoff Context Slice 的已完成历史，以及当时的 subtraction-first 取舍；未完成或待激活内容不得再被当作当前 runtime contract、rollout authority 或 Gate A outcome evidence。

## 一、结论

`spec-prd` 已经具备较完整的 brownfield PRD 能力：Decision Card、Requirement Analysis Gate、Product Expert Lens、relentless Requirements Grill、Planning Recheck、checker/finalize 和 Handoff Context Slice 都已存在。

当前问题不是“缺少更多机制”，而是：

1. 某些确定性跨字段矛盾仍需用失败 fixture 验证 checker 是否覆盖。
2. 现有 grill 排序和 WHAT/HOW 边界可能需要更清晰的反例，但不应新增第二套枚举或 schema。
3. 下游消费视图存在，但需要验证其是否足以让开发和 `spec-plan` 快速定位核心信息。
4. 任何新 prose 都必须证明改善了真实行为，而不是只证明文字被写入。
5. 当前 human-facing PRD 模板主要位于仓库 `docs/需求文档模版/标准模版/`，但该目录不随 npm 包分发；如果这些模板被定义为 `spec-prd` 产品内置能力，安装用户无法稳定获得，且会与 `prd-output-template.md` 的 embedded skeleton 形成 ownership 冲突。

因此，本轮采用：

> **subtraction-first + evidence-activated**：先对当前 source 做改前基线；只有失败样本证明现有合同不足时才激活对应实现单元和该单元所需的最小测试。

模板分发边界不属于待验证假设，而是已确认的产品定位：spec-first 是 npm 分发的 workflow harness，产品正常运行依赖、供安装用户使用的 PRD 模板必须进入 `skills/spec-prd/**` 的可打包 source；消费方项目自己的术语、合规与行业规则仍属于 project-local overlay。本文以 **M1 模板资产迁移** 单独承载该确定性迁移，不混入 H1-H4 的 evidence-activated 行为优化。

## 二、目标用户与产品结果

### 2.1 单一问答权威

所有需要人类补充、确认、裁决、接受假设或 hard-cap 的问题，只询问**当前执行对话的用户**。`spec-prd` 不做外部 Product Owner 识别、联系人路由或最终用户访谈。

| 参与方 | 主要职责 | 边界 |
| --- | --- | --- |
| 当前执行对话的用户 | 回答产品 WHAT、范围、默认行为、验收、风险接受和无法从 source 确认的事实；可以确认、否定、选择假设、hard-cap、defer 或回答“不知道” | 是唯一人类问答入口；回答“不知道”时保留 checkpoint/OQ，不再路由给第二个人 |
| Agent / tools | 优先读取 source、docs、tests、contracts 和已有证据；只把剩余 gap 问当前用户 | 不把 source 可解问题转给用户，不伪造用户回答 |
| Downstream Consumer | `spec-plan`、开发、测试消费已确定 WHAT 与可复核 HOW | 不在 planning 中自行发明产品决策 |
| Workflow Maintainer | 维护 skill、checker、runtime projection 与验证证据 | 不用更多 prompt 机制替代缺失的实测证据 |

为兼容当前 source，`ask-owner`、`owner_question`、`Owner Decision Trace`、`owner-capped` 等既有字段继续保留，但其中的 `owner` 统一映射为“当前执行对话的用户”，不是独立外部角色。当前用户的明确回答可关闭对应 gap；若回答与 confirmed source 冲突，agent 先展示冲突，再由当前用户选择产品口径或要求继续核实。

### 2.2 Primary outcome

- 当前执行对话的用户以尽可能低的重复交互成本关闭 load-bearing WHAT gap。
- source 可以回答的问题不再询问当前执行对话的用户。
- 纯 HOW 选型不被错误升级为产品决策。
- 下游能快速识别 confirmed WHAT、核心 R/AE、must-preserve behavior、阻塞项和 Planning Recheck。
- `ready-for-planning` 不携带仍需 planning 发明的产品 WHAT。

## 三、Goals 与 Non-Goals

### 3.1 Goals

- 降低矛盾 Decision Card 或虚假 ready 状态逸出。
- 让最高传播风险的 PRD-owned WHAT gap 优先被 source-resolve 或询问当前执行对话的用户。
- 保持 relentless 只作用于 load-bearing WHAT branch。
- 复用现有 Handoff Context Slice 改善开发与 `spec-plan` 的消费效率。
- 形成改前/改后、可复查、可说明限制的验证证据。
- 保持 Claude、Codex、Cursor、Kiro、Qoder 的 source/runtime 投射一致。
- 让 npm 安装用户稳定获得 `spec-prd` 产品承诺的通用及 surface-specific PRD 模板，不依赖 spec-first 源码仓库的维护者 `docs/` 路径。
- 建立“产品内置模板 + 可选内置行业 overlay + 用户项目本地 overlay”的单一 ownership 与按需组合机制。

### 3.2 Non-Goals

- 不新增中心化 workflow engine、persistent progress schema 或第二 PRD artifact。
- 不新增 P0 Architecture / P1 Behavior / P2 Experience 风险枚举。
- 不新增 `non_what_tech_recheck`、`what_affecting_tech_decision` 等同义持久字段。
- 不把 semantic adequacy、问题优先级或 PRD 质量变成脚本评分。
- 不重排现有 Phase spine；当前 Phase 1 已包含 Pre-PRD Clarification。
- 不单方实现 `PRD Revision Signal`；跨 workflow 反馈需独立提案和下游 consumer buy-in。
- 不引入未经实测的 token/context 阈值、System State Cache 或 Acceptance Pattern Library。
- 不因为旧测试曾锁定 9 个 references 就把文件数量当产品合同。
- 不恢复已删除的历史 `spec-prd` 聚焦测试，也不把清理失效的 `test:eval-fixtures` npm script 纳入本重构方案；该命令若需维护，作为独立仓库测试脚本清理处理。
- 不引入外部 Product Owner / 最终用户 / 技术负责人路由；当前执行对话的用户是唯一问题接收者。
- 本轮默认不新增 reference 文件；只有出现不可由现有文件承载的独立责任和明确 consumer 时才重评。
- 不让安装后的 workflow 读取 spec-first 源码仓库 `docs/需求文档模版/**` 作为 runtime 依赖。
- 不把证券或其他行业 overlay 默认应用到所有 PRD；内置行业资产只能按明确行业信号懒加载，并继续作为 advisory input。
- 不在用户项目中静默生成或覆盖本地 PRD 模板；用户项目 overlay 由消费方项目自行维护。
- 不同时保留 embedded skeleton 与独立正文模板作为两套规范性 source。

## 四、当前 Source 事实与 Ownership

当前 source 基线：`SKILL.md` 293 行、9 个 reference 文档共 1,960 行、5 个脚本文件（含 `scripts/lib/reason-codes.js`）共 2,590 行、`evals/examples.json` 2,693 行。

| 关注点 | 当前权威 source | 当前事实 | 重构规则 |
| --- | --- | --- | --- |
| Decision Card 语义 | `skills/spec-prd/SKILL.md` | 已定义字段、final/checkpoint 语义和四类 legal stop points | 跨字段语义只在此维护；template 只持久化必要字段 |
| Decision Card 确定性事实 | `check-prd-artifact.js` + `reason-codes.js` | 已报告缺字段、checkpoint 自称 ready 等事实 | 可机械判定的冲突进入 checker，不新增 advisory 状态表 |
| Grill 排序 | `product-expert-lens.md` + `domain-language-and-decision-ledger.md` | 已有 `downstream_confirmation_risk` 与 Load-Bearing Gap Triage | 保持一个排序接口，只补反例或边界 |
| WHAT/HOW 交接 | SKILL Closure-disposition razor + readiness/output references | 已有 `implementation-only-how-pushdown`、`planning_would_invent_what`、Planning Recheck | 复用既有术语；WHAT-affecting gap 不得 pushdown |
| 下游快速消费 | `handoff_context_slice` | 已能承载 confirmed WHAT、决策、recheck 与 blocker | 只增强现有 slice，不新增 Developer Quick-Start section |
| npm 内置 PRD 模板 | `prd-output-template.md` embedded skeleton + `docs/需求文档模版/标准模版/00-70` human-facing mirror | `package.json#files` 打包整个 `skills/`，但不打包该普通 `docs/` 目录；`plugin-sync.js` 会递归投射 skill 支持文件 | 将产品内置模板迁入 `skills/spec-prd/assets/templates/`，并删除重复 embedded 正文 ownership |
| 可选行业 overlay | `docs/需求文档模版/标准模版/90-证券行业需求关注点与参考附录.md` | 当前是维护者仓库示例，不是安装用户稳定可用的产品资产，也不是 confirmed 合规事实 | 作为可选内置能力迁入 `skills/spec-prd/assets/overlays/securities.md` 并仅按行业触发；消费方仍可叠加自己的项目本地 overlay |
| 模板选择与组合 | `SKILL.md` + `prd-output-template.md` | 已有 surface lens 与 project-local overlay 语义，但没有独立 packaged template asset routing | `SKILL.md` 保留唯一选择语义；contract 只定义机器安全字段、组合规则和 lazy-load trigger |
| Eval fixture | `evals/examples.json` + `run-evals.js` | 当前 111 个 case 的结构与 coverage contract 可通过 | 不是模型语义质量证明 |
| 历史聚焦测试 | 已删除 tests / `package.json#test:eval-fixtures` | 旧测试不恢复；失效 npm script 不属于本方案前置条件 | 每个激活单元只添加证明自身行为的最小定向测试 |
| Runtime projection | `getSupportedPlatforms()` | 当前平台为 Claude、Codex、Cursor、Kiro、Qoder | 所有行为变更按五宿主验证 |

### 4.1 Scripts 与 LLM 边界

| 归属 | 负责 | 禁止 |
| --- | --- | --- |
| Scripts / tests | 字段组合、结构、section identity、ref、hash、receipt、reason_code、runtime projection | 判断哪个需求更重要、产品 WHAT 是否充分、PRD 语义质量分数 |
| LLM / reviewer | 风险排序、WHAT/HOW 边界、当前用户回答的应用、语义充分性、用户价值判断 | 编造测试结果、把 advisory 当 confirmed、绕过 finalize receipt |

### 4.2 npm 产品定位与目标模板拓扑

`spec-first` 源码仓库不是安装用户的业务项目。仓库 `docs/` 主要服务维护、设计说明、计划、验证和知识沉淀；只有明确进入 npm 发布清单并被 runtime generator 投射的资产，才能成为安装后 workflow 的稳定依赖。

目标 topology：

```text
skills/spec-prd/
├── SKILL.md
├── references/
│   └── prd-output-template.md       # 机器安全合同、组合规则、template routing
└── assets/
    ├── templates/
    │   ├── 00-generic.md
    │   ├── 10-app.md
    │   ├── 20-admin.md
    │   ├── 30-backend.md
    │   ├── 40-h5-pc.md
    │   ├── 50-cli-devtool.md
    │   ├── 60-mixed.md
    │   └── 70-large-requirement-index.md
    └── overlays/
        └── securities.md            # 可选内置行业 overlay，不默认加载
```

目标组合顺序：

```text
machine-safe output contract
  + 00 generic template
  + one primary surface template（mixed 时可增加必要 secondary lens）
  + optional built-in industry overlay
  + consumer-project local overlay
  + confirmed source / 当前执行对话用户裁决
```

Ownership 规则：

1. `references/prd-output-template.md` 负责 frontmatter、machine section identity、readiness、trace、finalize 以及模板组合合同，不再重复维护完整 human-facing 正文骨架。
2. `assets/templates/` 是通用和 surface-specific 正文模板的唯一 product source。
3. `assets/overlays/` 只放 spec-first 明确承诺内置支持的可选行业增强包；overlay 只能提出问题和触发 conditional section，不能成为 confirmed 业务或合规事实。
4. 消费方项目自己的模板、术语、监管辖区和团队标准留在该项目，由 `spec-prd` 按需读取为 project-local overlay。
5. `docs/需求文档模版/标准模版/` 在迁移完成后删除规范性副本，或只保留维护者说明与 skill source pointer，不再承担 runtime authoring contract。

## 五、假设、指标与激活条件

每个候选改动必须先回答：当前合同是什么、失败样本是什么、现有合同为什么没有覆盖、最小改动是什么。无法回答则不实施。

M1 不使用失败样本激活：用户已明确产品内置 PRD 模板应供 npm 安装用户使用，而当前发布清单不会分发 `docs/需求文档模版/**`。M1 的验证对象是 package/runtime 可达性、单一 source、lazy loading 和 overlay 隔离，不是“是否需要模板”这一产品决策。

| 假设 | 改前失败样本 | 主要指标 | 激活条件 | 未激活时处置 |
| --- | --- | --- | --- | --- |
| H1 Decision Card 组合仍会自相矛盾 | `final-prd + can_enter_spec_plan=no`、`checkpoint-prd + can_enter_spec_plan=yes` 等 | 矛盾组合逸出率 | 当前 checker 未报告可机械确认的冲突 | 保持现有 source，不增加状态表 |
| H2 Grill 会先问低传播风险问题 | 高影响 Acceptance/Scope gap 与低影响架构 HOW 同时存在 | 最高风险 PRD-owned WHAT gap 首问命中率 | 当前 source 稳定把纯 HOW 或低风险项排在前面 | 保留现有排序，不补 prose |
| H3 Tech feasibility gap 会被错误放行或错误阻断 | 一组会改变 WHAT，一组仅影响 HOW | WHAT gap 错误放行率；HOW recheck 误阻断率 | 当前 source 无法稳定应用既有 pushdown/Planning Recheck 边界 | 保持现有术语 |
| H4 长/高风险 PRD 的消费成本过高 | 下游需要从长 PRD 找核心 R/AE、preserved behavior、blocker | 关键信息定位完整性；重复内容数 | 现有 Handoff Context Slice 缺少核心消费信息 | 不扩展输出模板 |

共同 guardrails：

- 向当前用户提出的问题总量不得因“排序优化”无界增加。
- 重复问题数不得高于改前基线。
- source 可回答的问题不得继续转成当前用户问题。
- 改动不得增加第二套 enum、artifact、progress ledger 或 runtime source。
- 行为改善必须由同一 fixture 的改前/改后证据支撑，不能只以字符串存在断言完成。

## 六、实施单元

### M1：npm 内置 PRD 模板资产迁移（已确认，必须实施）

**原则**：产品运行依赖跟随 npm/skill 分发；用户项目知识留在消费方项目；同一模板规则只有一个规范性 source。

**迁移范围**：

1. 将 `00-通用`、`10-App`、`20-Admin`、`30-Backend`、`40-H5-PC`、`50-CLI-DevTool`、`60-Mixed`、`70-大需求总索引` 迁入 `skills/spec-prd/assets/templates/`，统一使用稳定的 ASCII 文件名，中文标题和内容保留在文件内。
2. 将 `90-证券行业需求关注点与参考附录` 作为可选内置证券 overlay 迁入 `skills/spec-prd/assets/overlays/securities.md`；只有检测到证券/交易行业上下文或当前用户明确选择时才读取。
3. 收敛 `prd-output-template.md`：保留 machine-safe output contract、section identity、readiness、trace、组合顺序和 trigger map；删除与新模板重复的 embedded human-facing skeleton。
4. 在 `SKILL.md` 增加轻量 Template Trigger Map：默认读取通用模板，只读取一个 primary surface 模板；mixed surface 仅加载真实命中的 secondary lens；行业 overlay 与大需求索引按触发条件读取。
5. 迁移完成后退役 `docs/需求文档模版/标准模版/` 的规范性副本；如保留 README，只说明历史来源、维护方式和 canonical skill path。
6. 保持 machine-owned 字段由 finalize/checker 产生或确认，不能让 human-facing 模板预填 `ready-for-planning`、`readiness_verified_*` 等 receipt 字段。
7. 将模板中的“产品 owner”统一解释为当前执行对话的用户；兼容字段可保留，但不得重新引入外部联系人路由。

**禁止**：

- 同时维护 embedded skeleton、skill template 和 docs mirror 三份正文。
- 每次运行全量读取全部模板。
- 因证券 overlay 被打包就默认断言监管规则适用。
- 把根目录 `templates/` 当作 PRD 内容模板目录；该目录继续服务 host runtime generation。
- 手改 `.claude/`、`.codex/`、`.agents/skills/` 等 generated runtime mirror 完成迁移。

**M1 完成证据**：

- `npm pack --dry-run` 包含所有预期 `skills/spec-prd/assets/**` 文件，不包含已退役的规范性 docs mirror。
- `spec-first init` 的五宿主临时目录均投射模板及 overlay，且 doctor/integrity 检查不报告 skill support file drift。
- 聚焦测试证明 `prd-output-template.md` 不再复制完整正文模板，并且 `SKILL.md` 能定位所有模板资产。
- 行为 fixture 证明 App/Admin/Backend/CLI/Mixed 只加载相关模板，证券 overlay 在无行业信号时不进入上下文。
- 现有 checker/finalize good fixture 继续通过，machine section 与 ready receipt 合同未被 human-facing 模板削弱。

### U1：Decision Card 确定性一致性（按 H1 激活）

**原则**：字段组合是否自相矛盾是 script-owned deterministic fact；需求是否充分仍是 LLM-owned judgment。

**最小方案**：

1. 先增加能在当前 source 上失败的 checker fixture。
2. 若冲突可机械确认，在 `check-prd-artifact.js` 报告单一一致性 finding，并在 `reason-codes.js` 归类。
3. ready/final 出口的确定性矛盾应阻断完成。
4. `SKILL.md` 保留唯一组合语义；`prd-output-template.md` 只保留持久字段和 canonical 指针。
5. 不新增完整合法状态矩阵，不要求 LLM 维护第二张表。

**至少覆盖**：

- `final-prd + can_enter_spec_plan=no`。
- `final-prd + clarification_evidence=skipped`。
- `checkpoint-prd + can_enter_spec_plan=yes`。
- `decision_card_next_action` 与 `write_mode` 明确冲突。

### U2：Grill 风险排序收敛（按 H2 激活）

**原则**：只排序 PRD-owned、load-bearing WHAT gap；纯实现 HOW 不进入 owner grill 优先级队列。

继续使用唯一接口 `downstream_confirmation_risk`，综合判断：

1. 是否会让 planning 发明 WHAT。
2. 对 Requirements、AE、Scope、默认行为、数据权威、fallback、analytics acceptance 的影响。
3. 影响面、不可逆性与跨 section 传播范围。
4. source/user/glossary/contract contradiction。
5. 是否必须由 owner 裁决，或可先由源码解决。

Architecture、Behavior、Experience 只作为案例标签，不带固定优先级。必须加入反例：高验收影响的行为 gap 应排在低影响的存储/协议 HOW 之前。

**Owner 成本边界**：relentless 适用于 load-bearing WHAT branch；非 load-bearing 项可以通过 source-resolved、evidence-backed accepted assumption、owner-capped 或合法 HOW pushdown 闭合。LLM 生成问题成本低，不代表 owner 判断成本为零。

### U3：WHAT/HOW 与 tech-input 交接收敛（按 H3 激活）

不新增字段，补强既有 `implementation-only-how-pushdown` 与 Planning Recheck 的决策测试：

> 技术复核的不同结论是否会改变 Requirement、AE、Scope、source-of-truth、默认行为、interface availability、fallback 或 analytics acceptance？

- **会改变**：它仍是 PRD-owned WHAT gap，必须继续 source-read / ask-owner / checkpoint / revise-prd，不得标为非阻塞 Planning Recheck。
- **不会改变**：使用现有 `implementation-only-how-pushdown` 或 Planning Recheck，并声明 `planning_would_invent_what=no`。

本单元只改善 `spec-prd` producer 边界，不宣称 `spec-plan` 已消费新的协议。若需要 planning 在技术不可行时自动返回 `spec-prd refine`，另立跨 workflow 提案，并同步修改生产者、消费者和 consumer tests。

### U4：下游消费视图（按 H4 激活）

不新增 `Developer Quick-Start` section；增强现有 `handoff_context_slice`，在 long / mixed / high-risk PRD closeout 中包含：

- confirmed WHAT；
- top-3 load-bearing Requirements 及对应 AE；
- must-preserve behaviors；
- unresolved WHAT blockers；
- Planning Recheck / source refs；
- degraded facts 与 downstream sync impact。

该 slice 是已有 PRD 内容的聚合视图，不创造新需求、不复制完整 Requirements、不包含文件级 HOW 或任务顺序。

## 七、Source 分配、Consumer 与顺序

### 7.1 Source / Consumer Map

| 变更类型 | Source 落点 | Producer | Consumer | 禁止 |
| --- | --- | --- | --- | --- |
| 确定性 Decision Card 冲突 | checker + reason-code taxonomy | `spec-prd` finalize/checker | finalize、hooks、contract tests | 仅靠 prose 自查 |
| Grill 排序语义 | 现有 Product Expert Lens / Domain Ledger 段 | `spec-prd` LLM | Requirements Grill | 新建风险 enum/reference |
| WHAT/HOW 判定 | SKILL closure razor + readiness/output references | `spec-prd` | readiness、handoff、`spec-plan` 现有 PRD 消费 | 新字段或未承诺 consumer 的协议 |
| 消费视图 | 现有 Handoff Context Slice | `spec-prd` closeout | 人类开发、测试、`spec-plan` | 第二 PRD section/topology |
| 产品内置模板正文 | `skills/spec-prd/assets/templates/**` | `spec-prd` authoring | npm 安装用户、五宿主 runtime | 依赖维护者 docs 路径或复制 embedded skeleton |
| 可选行业 overlay | `skills/spec-prd/assets/overlays/**` + 消费方项目本地 docs | `spec-prd` template routing | 命中行业上下文的 PRD authoring | 默认加载、当作 confirmed 行业事实 |
| 模板机器合同与 routing | `prd-output-template.md` + `SKILL.md` | `spec-prd` | template assets、checker/finalize、runtime projection | 第二套选择表或完整正文副本 |
| Runtime | source 经 `spec-first init` 生成 | CLI adapters | Claude/Codex/Cursor/Kiro/Qoder | 手改 runtime mirror |

### 7.2 实施顺序

```text
当前 source/package/runtime 基线
  -> M1 模板 ownership 迁移与定向验证
  -> 行为基线（H1/H2/H3/H4）
  -> 逐项 Activation Decision
     -> 未复现：删除该候选实现
     -> 已复现：激活对应 U1/U2/U3/U4
  -> 为激活单元新增最小定向测试
  -> 同 fixture 改后重跑 + fresh-source eval
  -> 五宿主 source/runtime projection
  -> closeout evidence
```

实施单元彼此独立，不得因为 U1 激活就默认 U2/U3/U4 也需要实施。若 U2 与 U3 同时激活，先完成 U3 的 WHAT/HOW 边界，再调整 U2 排序，避免把纯 HOW 错误列为最高优先级当前用户问题。

## 八、风险与失败模式

| 风险 | 触发信号 | 缓解 |
| --- | --- | --- |
| 重复合同继续增加 | 出现第二套风险 enum、tech-input 字段或 Decision Card 表 | subtraction review；删除同义机制，保留唯一权威 |
| 测试只证明字符串存在 | contract test 通过但行为 fixture 不改善 | 强制改前/改后同场景比较 |
| 脚本越权判断语义 | checker 开始判断哪个 gap 更重要或是否充分 | 脚本只报告组合、结构、ref、receipt 等事实 |
| 当前用户被迫裁决 HOW | 面向当前用户的问题要求选择存储/协议且不会改变 WHAT | 先走 U3 判定，HOW pushdown |
| false-ready 未下降 | WHAT-affecting tech gap 仍被放行 | 保持 checkpoint/revise；补 fresh-source fixture |
| owner 负担上升 | 问题数、重复问题数显著增加 | 保持 load-bearing 边界和 source-first guardrail |
| runtime drift | source 变化未投射某宿主 | 五宿主临时目录矩阵；不手改 mirror |
| npm 用户拿不到模板 | 模板仍只存在于普通 `docs/` 路径 | M1 将产品模板迁入 skill assets，并用 pack/init 证据验证 |
| 三套模板真相源 | embedded skeleton、skill assets、docs mirror 同时规范化 | M1 迁移时删除重复正文 ownership，docs 只留 pointer 或退役 |
| 行业规则污染默认上下文 | 无证券信号也加载证券 checklist | overlay 独立目录、trigger fixture、无信号负向断言 |
| 模板迁移破坏 ready 合同 | human template 预填 receipt 或缺 machine section | machine-safe contract 留在 reference；checker/finalize fixture 回归 |
| 上下文膨胀 | 每次加载 00-90 全量模板 | Template Trigger Map + primary surface 默认单选 + 按需 overlay |

## 九、明确不纳入本轮的方向

| 方向 | 处置 | 重新激活条件 |
| --- | --- | --- |
| Phase Checkpoint Protocol / spine 重排 | 不实施；现有 Failure-Mode Blacklist、Pre-Write Gate 与 Phase 1 clarification 已覆盖 | 真实运行证据证明时序而非执行遵从是根因 |
| T0 / Session Recovery / Context Budget | 不实施 | 有真实跨会话分布和 token 消耗数据，且现有 handoff 无法满足 |
| PRD Revision Signal / Inbound Revision Request | 独立跨 workflow 提案 | 至少一个 `spec-plan` / `spec-work` / review consumer 明确承诺消费并同步测试 |
| System State Cache / Acceptance Pattern Library | 不实施 | 出现多个可指名消费者及 freshness/invalidation contract |
| 多模态预处理新管道 | 不实施 | 现有 design-source/large-input/resume 能力出现已验证覆盖缺口 |
| Per-Question Quality Layer 新机制 | 不实施；复用现有 scenario grill | 当前 scenario discipline 在可重放样本中稳定失效 |
| 三受众 Handoff Views / optional `resolution_requires` 列 | 不实施 | 有真实 consumer 要求且现有 Handoff Context Slice 无法表达 |
| `CONTEXT.md` / `CONCEPTS.md` / domain glossary 统一 | 独立术语 ownership 决策 | 先确定三者 authority、alias、migration、consumer 和 invalidation 条件 |
| 新建 reference 文件 | 默认不实施 | 出现不可由现有文件承载的独立责任和至少一个明确 consumer |

## 十、验证合同

### 10.1 改前/改后对照 Eval

每个激活假设至少准备一个可重放 fixture，并在相同模型/宿主条件下执行：

1. 当前 source 改前运行，证明失败可复现。
2. 修改后至少运行 3 个 fresh session，避免把单次偶然命中当稳定改善。
3. 脚本记录字段、reason_code、receipt、首问和输出路径等确定性事实。
4. 独立 reviewer 盲审“是否为最高风险 WHAT gap”“是否错误放行 WHAT”等语义结果。
5. 任一指标无改善或 guardrail 回归，撤销对应增量；不以“prose 已写入”宣布完成。

| Fixture | 预期 |
| --- | --- |
| Decision Card 冲突 | checker 稳定报告确定性冲突，finalize 不产生 ready receipt |
| 高影响行为 gap + 低影响架构 HOW | 先 source-resolve / 询问当前用户高影响 WHAT gap，纯 HOW 不询问当前用户 |
| WHAT-affecting tech feasibility | 不得 ready；进入 source-read / ask-owner / checkpoint / revise |
| non-WHAT tech recheck | 可进入 Planning Recheck，不误阻断 ready |
| source 可解 + 当前用户 gap 并存 | source 可解项不问当前用户，当前用户问题绑定 write target |
| 长/高风险 PRD handoff | slice 可定位核心 R/AE、preserved behavior、blocker 与 recheck，不复制完整 PRD |

### 10.2 确定性验证

- M1：`npm run build` 或等价 `npm pack --dry-run`，核对 `skills/spec-prd/assets/templates/**` 与 `assets/overlays/**` 均进入发布包。
- M1：增加模板资产可达性、唯一 source、lazy-load trigger、无行业信号不加载证券 overlay 的最小定向测试。
- M1：增加五宿主 init/integrity 聚焦验证，确认 skill 支持文件被递归投射且无 runtime drift。
- `node skills/spec-prd/scripts/run-evals.js --json`。
- U1 激活时增加 Decision Card 冲突的 checker/finalize 定向测试。
- U2/U3/U4 激活时，只增加对应 source contract、行为 fixture 或输出 shape 的最小测试。
- `npm run lint:skill-entrypoints`。
- `npm run typecheck`。
- 影响面需要时运行 `npm run test:unit`；不得用不相关绿灯替代激活单元的定向证据。

### 10.3 五宿主 Source/Runtime Matrix

在临时项目目录通过 source CLI 执行显式五宿主初始化：

```text
spec-first init --claude --codex --cursor --kiro --qoder -y -u <name> --lang zh
```

| Host | 重点验证 |
| --- | --- |
| Claude | workflow references、prewrite/readiness hooks、checker/finalize projection |
| Codex | `.agents/skills/spec-prd` source projection 与 degraded hook 声明 |
| Cursor | `.cursor/skills/spec-prd` generated-runtime preview；保留 loader 未验证限制 |
| Kiro | `.kiro/skills/spec-prd` 与 steering/runtime projection |
| Qoder | `.qoder/skills/spec-prd`、prewrite/readiness hooks 与 lifecycle tests |

只修改 `skills/spec-prd/**`、必要的 CLI generator 或 tests 等 source-of-truth；根 `templates/` 继续属于 host runtime generation，不承载 PRD 正文模板；`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只通过 `spec-first init` 再生成。

## 十一、Definition of Done

- 已删除的历史聚焦测试未恢复，失效 `test:eval-fixtures` 脚本未被误纳入本方案范围。
- npm 内置 PRD 模板已迁入 `skills/spec-prd/assets/templates/**`，可选证券 overlay 已进入独立按需资产；安装用户不再依赖维护者 `docs/需求文档模版/**`。
- `prd-output-template.md`、template assets 与 docs mirror 不存在重复规范性正文；每层 source、producer、consumer 和 conflict rule 明确。
- 五宿主 runtime projection 和 npm pack 均证明模板资产可达；未命中行业信号时不会加载证券 overlay。
- 每个实际实现的 U1/U2/U3/U4 都有改前失败证据、激活决策、最小定向测试、改后结果和限制说明。
- 未复现的候选项已从实施范围删除，而不是以“顺手补 prose”落地。
- 没有新增第二套状态表、风险 enum、tech-input schema、progress artifact 或 PRD topology。
- 确定性事实与 LLM 语义判断的 ownership 清晰，checker 不越权做产品质量评分。
- Handoff Context Slice 的增量不创造新需求，不包含任务级 HOW。
- 五宿主 projection 已验证或逐宿主记录未验证原因；不得以单宿主绿灯宣称全平台完成。
- CHANGELOG 记录实际 source surface、用户可见影响、验证命令与未执行项。
- fresh-source eval 使用当前磁盘 source；若 dispatch primitive 不可用，明确记录未执行原因，不声称通过。
