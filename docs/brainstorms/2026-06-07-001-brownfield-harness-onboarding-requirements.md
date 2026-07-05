---
date: 2026-06-07
topic: brownfield-harness-onboarding
spec_id: 2026-06-07-001-brownfield-harness-onboarding
---

# Brownfield Harness Onboarding(存量库渐进引入流程)

## Summary

为陌生的存量代码库提供渐进式 onboarding,核心是 **agent 默认不会自发做、又是 spec-first 边界强项的三件事**:影响面规模分档决策(R7)、技术债增量基线(R9)、证据与人审治理。薄全局骨架按需 just-in-time 生成、不预建持久化文档(R2);影响面追踪只保留"分档决策 + 嫌疑点治理",纯定位 grep 让给模型(R3)。成功标准是"第一个真实任务可安全开始",而非建成完整项目地图。

> 2026-06 趋势裁决(基于两轮 deep-research,见 `docs/09` 报告第八节):长窗 + agent 原生探索 + harness 显学三趋势,**强化**抗膨胀与治理价值、**弱化**"造持久化导航文档"与"教 agent grep"。需求据此瘦身——做方法论/治理,缓做造文档。

---

## Problem Frame

**战略定位(竞品全景校准,见 `docs/09` 竞品分析报告)**:存量库的真问题不是"AI 读不懂代码"——repo 理解是红海,aider/Claude Code/Cursor 都已覆盖,且三轮研究证明 agent 原生探索正在吃掉这块。spec-first 在 57 项目竞品全景中的独特定位是"**规格驱动的开发编排层**",壁垒在"编码之前和之后"。因此存量库的真问题是:**它从来没有规格,无法进入 spec-first 的 Codebase→Spec→Plan→Work→Review→Knowledge 闭环**。brownfield onboarding 的本质是**存量库接入规格驱动闭环的"入口适配器"**——其产出(规模分档 R7、技术债 baseline R9、影响面/约束 R3)是**喂给下游 Spec/Plan 的规格化事实**,不是给 agent 看的导航文档。这是 spec-first 独有、竞品普遍缺失的链路位置(竞品在"双向追溯/规格化"维度普遍为基本缺失)。

把 AI agent 放进十万行级存量库时,直觉上的矛盾是 cold start(隐性知识无机器可读形式);但按上述定位,真正要解决的是"无规格→无法进入闭环",而非"读不懂"。

**痛点前提诚实基线(三轮 deep-research 后,见 `docs/09` 报告第八/九节)**:本需求的痛点量级目前 **unverified**。两个看似支撑它的强命题在对抗核验中均被 **refuted**——"agent naive 探索不足、需结构化项目表示"(LocAgent 论文相关论断 0-3)、"缺项目级约束是 agent 主要失败源"(GitHub Spec Kit 博客论断 0-3);同时公布的 agent benchmark 分数被证大幅夸大(SWE-Agent+GPT-4 过滤泄漏/弱测试实例后 12.47%→3.97%,arxiv 2410.06992),"agent 已足够好"同样站不住。因此本需求**不把"agent 探索不够好"当作既定前提**,改以 **dogfood-first** 为顶层原则:先在真实存量库实测 v1 核心三件事的增益,用 Evaluation Harness 度量痛点量级,再决定是否扩展。这条原则前置于所有 R,而非藏在 Outstanding 末尾。

约束前提(已核验):仓库 2026-06-03 收敛决策明确"不恢复 graph-bootstrap",此能力必须走 workflow/方法论层,默认不碰 provider 核心路径。详见 `docs/09-业界借鉴/2026-06-07-Harness-Engineering对照-spec-first架构分析.md` 第七节。

> 编号说明:正文 ①–⑤ 沿用 `docs/09` 报告第七节的待优化点清单——① 导航地图、② 知识 cold-start、③ 影响面、④ 技术债 baseline、⑤ 渐进 adoption。本 doc 聚焦 ①⑤ 合流的 onboarding 流程,衔接 ②③④。

---

## Actors

- A1. 开发者:接手存量库,发起 onboarding,审阅并确认产物(尤其入口文件改动)。
- A2. AI agent:消费最小定向上下文 + 切片上下文,在库内安全执行第一个及后续真实任务。
- A3. onboarding 流程:编排 script-owned 确定性事实(文件树/语言/模块边界/git 热点)与 LLM 语义判断(关键链路、约束识别),产出最小定向与切片上下文。

---

## Key Flows

- F1. 首次 onboarding(最小定向 + 基线)
  - **Trigger:** 开发者对一个尚无 spec-first 上下文的存量库发起 onboarding。
  - **Actors:** A1, A3
  - **Steps:** 采集确定性事实(模块边界/技术栈/入口/git 热点)→ 记录现有告警/技术债 baseline 快照 → 标出未覆盖区 → 提供最小全局定向(形态优先 just-in-time,不默认预建持久化文档,见 R2);若需持久化则入口改动以 preview 请 A1 确认。
  - **Outcome:** 存在一个 debt baseline + 最小定向,A2 据此具备定向感;无新增需长期维护的持久化文档负担。
  - **Covered by:** R1, R2, R6, R9

- F2. 首任务切片深化(治理 + 按需约束召回)
  - **Trigger:** A1 给出第一个真实任务。
  - **Actors:** A1, A2, A3
  - **Steps:** 按规模分档选影响面深度(R7:方法论默认 / 大库 opt-in graph advisory)→ agent 原生探索做静态定位,onboarding 只补**动态调用/配置驱动嫌疑点的标记与人审提示**(R3)→ 按需从 git history/docs/PR 抽候选约束(低置信 advisory,请人审,R8)→ 产出该切片可信上下文。
  - **Outcome:** 第一个任务在已分档的影响面 + 已审嫌疑点/约束下安全开始。
  - **Covered by:** R3, R7, R8

- F3. 后续模块增量
  - **Trigger:** 后续任务首次进入某未覆盖模块。
  - **Actors:** A2, A3
  - **Steps:** 仅增量补该模块定向与切片,刷新未覆盖区标记;不回头预先全建。
  - **Outcome:** 定向随真实工作渐进生长,始终"够用且不过量"。
  - **Covered by:** R4

---

## Requirements

> 分期(2026-06 趋势裁决后重排):
> - **v1 核心(agent 不会自发做 + spec-first 强项)** = R7 规模分档决策 + R9 技术债增量基线 + R3(收窄后的影响面治理)+ R1/R6 框架。
> - **降级为 open question(形态待重审)** = R2/R5/R10 的"持久化导航文档"——趋势①② 提示改 just-in-time 生成或并入既有被动上下文(AGENTS/CLAUDE),而非新建持久化 docs。
> - **待依赖** = R8(依赖 v1.15 producer,本期只定契约)。

**Onboarding 流程主体**
- R1. 提供 brownfield onboarding 能力(① 与 ⑤ 合流),让陌生存量库渐进成为 AI 可工作环境;成功标准为"最小可工作上下文够第一个真实任务安全开始",非完整地图。
- R4. 渐进式:首次只产最小骨架 + 未覆盖区标记;后续在某模块首次工作时增量补该模块,而非预先全建。
- R6. onboarding 是 **opt-in 增强**,零 harness 也能正常使用 spec-first;不设为强制 gate。

**v1 核心:治理与分档(agent 默认不自发做)**
- R3. (收窄)影响面深化只承担 **agent 默认不会做的治理部分**:规模分档决策(何时升级深度)、动态调用/配置驱动**嫌疑点的显式标记与人审提示**,并以 **AI 主动提问**方式向开发者确认存量库的隐性约束。*注:AI 主动提问范式已被 AWS AI-DLC(2025)与 oh-my-claudecode Deep Interview 验证、非 spec-first 独有差异化,故作为内置交互质量项、不作差异化卖点宣传。* 纯定义→引用→测试的静态定位 grep **交给 agent 原生探索**,不包装为本能力的 deliverable。*外部证据(docs/09 第九节):图/结构化定位已达高水位(LocAgent file-level 92.7%),"naive 探索不足需结构化表示"的论断被 3-0 refuted——静态定位正被模型/工具能力吞掉,收窄方向有据。*
- R7. 影响面深度**按项目工程规模分档**(衔接报告 7.5):方法论是所有规模的默认底座;大型/跨仓库才 opt-in graph 作 advisory 托底。规模判断为 script-owned 确定性 facts(**可挂既有 `ln-signals.v1` / task-governance-signals 产线——该产线已落 `src/cli`,R7 为纯增量、地基就绪**),LLM 决定深度,graph 不自动装、不成 impact 真相源。*注:"按规模分档"无直接外部成熟先例,是 **spec-first 原创机制**;分档阈值(LOC/文件数/语言数/多仓)**不在 plan 期固化,待 dogfood 校准**。*
- R9. onboarding 时记录一次**全库现有告警/技术债快照**作为 baseline 数据;"审查只对增量"的判定**复用 `spec-code-review` 既有 `pre_existing` 分离 + diff-scope 机制**,R9 只提供 baseline 数据、**不重造**审查机制,也**不自建质量引擎**。*外部格局(docs/09 第九/十节):质量基线层已被老牌厂商商品化——SonarQube New Code / "Clean as You Code"(产品化 baseline-only review),Sonar AC/DC 框架(Guide→Generate→Verify→Solve)2026 已进 AI coding 治理空间。故 R9 的正确形态是**编排/引用外部成熟增量基线(如 SonarQube New Code)或复用内部 `pre_existing`,而非自建**。* baseline 是 advisory 快照,不设强制 gate。

**衔接契约(待依赖)**
- R8. 定义 onboarding 在 F2 调用 **②(知识 cold-start 召回)的衔接契约**:输入 = 当前切片范围,输出 = 低置信 advisory 候选约束(强制人审、走 candidate→review→promote 落 `docs/solutions`、不预先批量)。**本期只定义契约与调用点;召回管道的实现依赖 v1.15 producer 落地**(见 Dependencies)。

**降级:导航产物形态(open question,见 Outstanding)**
- R2. (降级)onboarding 需让 agent 获得最小全局定向(模块边界/技术栈/入口/约束来源指针)+ 未覆盖区标记;**产出形态与生命周期待重审**——优先 just-in-time,但 just-in-time 的具体生命周期(单会话瞬态 / run-scoped 缓存 / 持久化)决定下游 `spec-plan`/`spec-work` 能否消费同一份定向,这一点与下方 R5/R10 是同一个产品决策(见 Outstanding)。
- R5. (降级)若决定持久化,产物落点(独立 docs vs 并入 AGENTS/CLAUDE 被动上下文)在 plan 阶段重审,避免新建一套与 AGENTS.md 红海重叠、需用户额外维护的文档。
- R10. (降级,条件性)若选独立 docs 形态,须定位为 Knowledge Harness L1 结构地图成员、只做索引不复制既有载体内容(去重规则防多真相源);若并入既有被动上下文则此约束由该载体承接。

---

## Acceptance Examples

- AE1. **Covers R2.** Given 一个无 spec-first 上下文的存量库,when 首次 onboarding 完成,then agent 获得最小全局定向(模块边界/技术栈/入口/约束来源指针)+ 未覆盖区标记,而非逐文件完整索引;定向优先以 just-in-time 形态提供,不强制产出需长期维护的持久化文档。
- AE2. **Covers R7, R3.** Given 项目规模为小/中,when 做影响面深化,then 由 agent 原生探索做静态定位、onboarding 只补嫌疑点治理;given 大型或跨仓库且用户已 opt-in,when 深化,then 才叠加 graph advisory,且 graph 输出不直接成为结论。
- AE3. **Covers R8.** When 切片深化触及某模块,then 从历史材料抽出的约束以低置信 advisory 候选呈现并提请人审,绝不直接当 confirmed 写入 durable 知识。
- AE4. **Covers R4.** When 后续任务首次进入某未覆盖模块,then 仅增量补该模块,不触发全库重建。
- AE5. **Covers R5, R10.** If plan 阶段决定需要持久化导航产物,then 入口文件(AGENTS/CLAUDE)的任何改动先以 preview 呈现并经开发者确认,且不与既有载体重复维护同一事实。
- AE6. **Covers R9.** Given onboarding 已记录 debt baseline,when 后续审查运行,then 仅报告相对 baseline 新增的问题,历史既存告警不重复阻塞本次改动。
- AE7. **Covers R6.** Given 一个未运行 onboarding 的项目,when 正常使用 spec-first workflow,then 不被阻塞、不报 onboarding 缺失类 gate(onboarding 是 opt-in 增强,非前置条件)。

---

## Success Criteria

- 人类:开发者接手陌生大库后,**无需通读全库**即可让 AI 安全开始第一个真实任务;后续审查不被历史技术债告警淹没。
- 可观测代理(R3):第一个任务的切片影响面已被追踪序列覆盖、候选约束经人审;agent 的改动未触及未 onboarding 的"未覆盖区"(若触及则触发增量 onboarding,而非在零上下文下盲改)。
- 可观测代理(R9):对一个已知含历史告警的模块,onboarding 后的审查只报相对 baseline 的增量、不重复报 baseline 内既存项(呼应 AE6)。
- 可观测代理(R7):规模分档决策可由 script-owned facts 复现(同一库同样规模 → 同样的默认深度建议);graph 仅在大型/跨仓 opt-in 时出现且不直接成结论。
- 下游:`spec-plan` / `spec-work` 能消费最小定向 + 切片上下文 + debt baseline 状态,**无需自行发明**项目结构、模块边界或关键约束。**前提**:定向的生命周期形态(见 Outstanding 产物形态决策)支持跨 workflow 消费;若选瞬态形态,下游各自重新生成而非消费同一份。

---

## Scope Boundaries

- 不一次性扫全库建 Wiki/百科式完整地图。
- **不新建一套与 AGENTS.md 红海重叠、需用户长期维护的持久化导航文档**(趋势裁决);若需持久化,优先并入既有被动上下文。
- 不把"教 agent 做静态 grep 定位"包装为本能力 deliverable——交给 agent 原生探索。
- 不自动改 `AGENTS.md`/`CLAUDE.md` source;任何入口改动 preview-first。
- 不把 graph 作为默认影响面手段;仅大型/跨仓库 opt-in advisory。
- **不自建质量引擎**:质量基线层已被 Sonar(AC/DC + New Code)等老牌厂商商品化,R9 做编排/引用而非重造。
- **不原生接入 A2A / 企业级多 agent 互操作**:spec-first 是单宿主工作流编排层,A2A 保持 awareness 而非原生采纳(超出当前定位)。
- **不把 eval harness / 多 agent observability 当核心 roadmap 项**:其"多 agent 必备/observability 排第一"论断在四轮研究中被证伪(0-3),属单厂商框架自述,仅作 awareness/optional/degraded-mode。
- 不重启被否决的 graph-bootstrap / provider 核心路径。
- 不把 onboarding 设为强制 gate。
- 本 doc 不完整实现 ②(知识 cold-start 抽取),仅定义其在 F2 的衔接点;② 的结构化管道依赖 v1.15。

---

## Key Decisions

- **战略定位 = 存量库接入规格闭环的入口适配器(竞品全景校准)**:在 57 项目竞品全景中,repo 理解是红海、spec-first 独特定位是"规格驱动编排层"。故 onboarding 不自证为"帮 AI 读懂代码",而是"把无规格的存量库接入 Codebase→Spec→Plan→Work→Review→Knowledge 闭环",产出规格化事实喂下游。证据见 `docs/09` 竞品分析报告。
- **Roadmap 排位 = 持平偏高(第四轮研究,docs/09 第十节)**:相对知识 Harness(v1.15)/ provider pack(v1.16)/ 治理成熟度(v1.17),onboarding 是"采纳入口"(真实仓库多为存量库;Spec Kit 自称 N-to-N+1 是 SDD 最强场景),且能对冲 spec-first 自身的规划阻力(69% 开发者不打算用 AI 做 project planning)。落地有利事实:R7 地基 `ln-signals.v1` 已落 src/cli、可先行;R9 复用/引用既有机制;**仅 R8 反向依赖 v1.15 producer,应 defer**。niche(R7+R9+R3 专门适配器)经核验未被任何主流竞品占据。
- onboarding 终点 = 最小可工作上下文(非完整地图):克制、反百科,匹配渐进哲学。
- **价值重心 = 治理而非文档(2026-06 趋势裁决)**:v1 核心是 R7 规模分档 + R9 技术债增量基线 + R3 嫌疑点治理——agent 默认不自发做、又是 spec-first 边界强项;纯 grep 定位与造持久化文档正被模型能力和 AGENTS.md 红海吃掉,故收窄/降级。证据见 `docs/09` 报告第八节。
- **产物落点 = 待重审(逆转原决策)**:原定"独立 docs + 入口轻指针";趋势证据(长窗下塞太多反降成功率、持久化文档易腐化、AGENTS.md 已 12 万+文件红海)使其降为 open question——优先 just-in-time 生成或并入既有被动上下文,而非新建持久化 docs。
- ④ 技术债 baseline **纳入**且提为 v1 核心:agent 不会自发建 baseline,与"审查不被历史债淹没"强相关。
- ③ 影响面 = 规模分档(R7 保留)+ 治理收窄(R3);② 知识 cold-start = 方向 3:见报告 7.5 / 7.6 决策记录。
- **抗膨胀 = 多源一手证据支撑的 durable need(非仅内部假设)**:context rot 是 n² 注意力的架构属性、跨所有模型、加一个 distractor 即损性能(Anthropic context-engineering + Chroma context-rot 18 模型实验 + RULER/NoLiMa);长上下文/1M 窗口**强化而非淡化**最小上下文治理,直接支撑 R2 降级 just-in-time 与"够用且不过量"。
- **方法论顺风 + 治理不被模型吞掉(宏观背书)**:SDD 在 2026 强势上升(GitHub Spec Kit 110k stars、2026-06 仍活跃),支撑 brownfield onboarding 作为"把存量库接入 SDD 链路入口"的定位;DORA 2024 提示"AI 采纳不自动改善交付稳定性/吞吐、工程基本功仍必需"(相关性非因果,作"提示"而非"证明"),为 harness 治理价值提供宏观背书。证据见 `docs/09` 报告第九节。
- **入口分流落点 = `using-spec-first` 既有 governor,形态已达成、不新建(2026-06-07 核实裁决)**:核实 `skills/using-spec-first/SKILL.md` 后确认,R6/R7 钦定的形态——**按意图分流 + init/setup opt-in**——已实现约 70%:意图优先于关键词(`Do not route by keyword alone`)、不因 governor 匹配就跑 init/clean/update(Hard Rule 10)、init 后只在用户问 setup/readiness 时才推。故 onboarding 入口**不新建 public workflow、不新建独立路由分支**;brownfield 分流是同一 governor 在既定形态内的**特例,非新节点**。
  - **分流的"时机"不是会话时钟上的固定点,而是 substantial-work 边界上的懒触发 `governor-before-chain`**:意图首次结晶为 substantial work 时点火(选一个入口进链);已在 workflow 内 / 作为 subagent / 轻量事实问答时**不点火**(对应 SKILL.md Scope Guards 与 substantial-work 清单)。重触发仅限三种:用户改目标、活跃 workflow 显式 handoff、当前请求明显越出活跃 workflow 范围。
  - **区分注入 ≠ 分流**:SessionStart 注入(把路由策略搬进上下文,被动可用)与分流判定(意图清晰时才选入口)是两个节点;注入只让策略"在场",不等于点火(SKILL.md `Injection Behavior`:已注入则不重载 governor)。Codex 端注入即便 hook 未生效,分流仍靠 AGENTS.md 被动读兜底。
  - **仅剩两个有条件小缺口**:(1) "rg/ast 直读为陌生库默认底座"姿态散在 `spec-mcp-setup` 自述(`does not provide code-understanding authority`)、未在入口层显式点明——低成本可固化,**待真实 drift 证据再做**;(2) R7 规模分档影响面深度完全缺——依赖未落地的 `codebase-scale` signal + 待 dogfood 阈值,**等正式 plan 随 signal 一起做,现在做属 speculative**。

---

## Dependencies / Assumptions

- 依赖 v1.15 Knowledge Harness 的 `learning-candidate` / candidate→review→promote producer 落 `src/cli`(R8;当前 contract 已定义、producer 未落地)。
- 依赖 ③ 的 `codebase-scale` advisory signal 确定性口径(R7;待 plan 细化)。
- 条件依赖:若 R5 选持久化/入口指针形态,则复用现有 `spec-compound` discoverability 模式;若选 just-in-time 形态则不依赖。
- 可复用:首次接入陌生库的探索性操作可走现有 `git-worktree` skill 做隔离(竞品把 worktree 隔离列为 Spec-First 工程化基础设施),避免污染主工作区;非强依赖。
- 假设:薄骨架的"够用"由 LLM 按任务判断,不由脚本设固定完整度阈值。

---

## Outstanding Questions

### Resolve Before Planning

- [Affects R2/R5/R10][产品决策] 最小定向的**产物形态与生命周期**(单一决策,三轮研究后已收敛候选):**优先 (b) just-in-time 生成 + run-scoped 缓存** 或 **(c) 增量并入既有 AGENTS.md/CLAUDE.md 被动上下文**;(a) 纯单会话瞬态**仅作退化态**,(d) 独立持久化 docs 需额外理由克服红海/腐化/多真相源风险。*收敛依据(docs/09 第九节):多 agent/长程编排证据显示跨会话须 durable state(Anthropic 200k 截断须 external Memory、Cognition 须共享完整 trace),纯瞬态 (a) 与 Success Criteria"下游 `spec-plan`/`spec-work` 消费同一份定向"直接冲突,故 (a) 被排除出默认候选。* 此决策仍需用户在 plan 前最终拍板 (b) 还是 (c)。

### Deferred to Planning

- [Affects R1][形态/Technical] ~~onboarding 实现为新 public workflow(如 `spec-onboard`)、`using-spec-first` 路由分支,还是扩现有 workflow 的 brownfield 模式?~~ **已收敛(2026-06-07,见 Key Decisions"入口分流落点")**:入口分流复用 `using-spec-first` 既有 governor,不新建 workflow / 不新建独立路由分支;形态已达成约 70%,仅剩两个有条件小缺口(rg/ast 底座姿态待 drift、R7 规模分档随 signal)。onboarding 其余产出(R7/R9/R3 deliverable)仍走各自 workflow,不改本结论。
- [Affects R7][Technical] `codebase-scale` signal 的确定性字段与分档阈值(LOC/文件数/语言数/多仓)。
- [Affects R3][Technical] agent 原生探索与 onboarding 嫌疑点治理的职责切分点(哪些定位让给 agent、哪些必须显式治理)。
- [Affects R8][Needs research] 从 git history/PR 抽候选约束的可行抽取信号与误报控制。
- [Affects R9][Technical] R9 baseline 与现有 `spec-code-review` diff-scope 的边界与复用关系(避免重复机制;本轮 review 未核验该 skill 的 scope 行为)。
- [Affects R9][差异化方向] R9 的 debt baseline 是否同时记录"**规格覆盖空洞**"(哪些模块完全无 spec/test),作为 Spec↔Code↔Test 双向追溯链路的种子?竞品分析把双向追溯列为 P0 差异化壁垒且竞品普遍缺失,brownfield 是其天然切入点;但需评估是否超出 v1 dogfood 范围,可能 defer 为独立演化线。
- [Affects v1 整体][Needs validation] 先 dogfood R7/R9/R3 于真实存量库,用 Evaluation Harness 度量痛点量级与 bounded 探索成本,再决定是否扩 R2 持久化形态。
- [Affects 战略/时效][竞争窗口] GitHub Spec Kit 已有 105 社区扩展(60+ 作者)且已把 brownfield 列为三大阶段之一——其生态可能延伸进"存量库专门适配器"(影响面规模分档/技术债增量基线)空间,在 spec-first 落地前关闭差异化窗口。需评估落地时效性:若 niche 价值确认,宜尽早交付窄 v1 占位,而非长期停留在 dogfood。
