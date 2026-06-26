# 多专家角色反思纪要:spec-plan 升级方案(001 / gap-analysis / 002)

> 生成时间:2026-06-26 04:35
> 方法:并行派发 4 个独立 read-only 专家角色 subagent(实现者 / 反过度设计 / 资深架构师 / 对抗性怀疑者),各自基于真实 source 核实后挑刺,主控综合。
> 评审对象:`docs/plans/2026-06-26-002-...-plan.md`、`docs/plans/2026-06-26-001-...-plan.md`、`docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md`
> 定位:诚实记录反思结论与处置建议。**本纪要本身不新增方案内容**——因为反思的首要结论就是"停止增产文档"。

---

## 0. 综合结论(四角色收敛)

四个独立视角**高度收敛到两个根本问题**,且对抗性评审戳出了主控自评未发现的真实硬伤。诚实接受如下:

| 严重度 | 结论 | 提出角色(独立收敛) |
|---|---|---|
| **P0-A** | **三份文档讲同一件事,002 无独立交付价值**;应收敛为单一 source(留 001),其余降级归档 | 简洁 + 架构师 + 对抗(3/4) |
| **P0-B** | **整个升级的 problem statement 没有一个真实证据**——"高风险 plan 蒙混过关"是从外部材料反推的假想缺陷,无真实劣质 plan 样本 | 对抗(致命) |
| **P0-C** | **触发机制挂在 deepening gate(5.3.2)之后**,高风险但被判 Lightweight 的 plan 会直接 exit,rubric 对最需要它的盲区静默失效 | 架构师(机制硬伤) |
| **P0-D** | **001/002 同名 U1/U2/U7 + 跨文档 Dependencies** 会让 spec-work 依赖悬空,无法判断改哪份 | 实现者(执行死锁) |
| **P1-A** | **"3 句 rubric / 零新增能力" 系统性缩小了真实体量**——实际新增一个含 8 类触发矩阵+5 条硬闸+评分改造的条件触发子系统;标题"顶尖架构师级升级"与"零新增能力"自相矛盾 | 简洁 + 架构师 + 对抗(3/4) |
| **P1-B** | **核心收益全部 self-declared "未经模型验证"**(eval 全是 fixture + missing_evidence),G-1"杜绝泛泛"用确定语气陈述未验证假设 | 架构师 + 对抗 |
| **P1-C** | **"privacy 能力 80% 已存在"是 grep 命中推出的伪量化**;data-integrity-guardian 的 privacy 绑定 DB 语境,非 DB 个人数据流是真空白 | 对抗 |
| **P1-D** | **enterprise reference 单点过载**:trade-off(通用质量)+privacy(横切)+数据ML(work-nature lens)被"enterprise"强行收编;且其 trigger→specialist 映射与 deepening 5.3.4 重复,造第二份同步负担 | 架构师 |

四角色一致给足 credit 的扎实处:**底层事实无编造**——行号锚点(deepening :41/:113/:201)、6 个 specialist 存在且已映射、现有 4 个 eval case、data-integrity 的 GDPR/CCPA 描述,均经独立核实属实。问题不在事实层,而在**事实之上的推断层**。

---

## 1. 最该接受的三条(主控判断)

1. **P0-B 是最根本的**。我此前 7+ 轮迭代,从未质疑过"高风险 plan 蒙混过关"这个前提本身有没有真实证据。对抗视角对:这是用"业界模板有硬闸 → spec-plan 缺 → 所以会蒙混"的理论倒推,不是观察到的真实失败。**没有 baseline,就无法证明升级解决了真问题,也无法证明升级有效。**

2. **P0-A / P1-A 是同一病根**:为一个"加几句高风险提示 + 配 eval"的中型(甚至 Lightweight)改动,堆了 001+gap-analysis+002 三层文档 + Google anatomy 全套 + 多轮 loop 日志。**这份要求别人 right-size 的方案,自己是 over-sized 的**——治理层自相矛盾。简洁视角的处置最干净:留 001 一份可执行 plan,gap-analysis 瘦成"裁决+§9判据"归档,002 删除(其唯一独立资产 §9 eval 草样并入 001 U7)。

3. **P0-C 是真机制 bug**:我画的 Overview 图把企业触发器只接到 5.3.3 risk-bonus,但 deepening 的开关 gate 在 5.3.2 之前,Lightweight 直接 exit。这意味着"高风险却被判轻量"的 plan——正是最危险的那类——根本走不到 rubric。这个洞我之前完全没看到。

---

## 2. 处置建议(不立即执行,待维护者拍板)

> 反思的结论是"减法",不是"加法"。以下建议**需要维护者确认**再执行,因为涉及删除/降级已产出文档。

- **D-1(对应 P0-A/P1-A)**:以 001 为唯一可执行 source。gap-analysis 删除所有"第 N 轮"loop 日志与删除线开放项,瘦成"TL;DR 4 项裁决 + §9 判据表 + §7 诚实边界",作为 origin 证据归档。**002 删除或移出 plans/**(其 §9 eval 草样 2 个并入 001 U7)。
- **D-2(对应 P0-B)**:在 001 补一个诚实的前提声明——problem statement 来自外部对标的"理论缺口",**未经真实 spec-plan 劣质样本验证**;建议落地前先跑一个 baseline(让现状 spec-plan 对 1-2 个高风险场景出 plan,看是否真的泛泛),用真实样本替换假想缺陷。
- **D-3(对应 P0-C)**:把高风险触发从"deepening 5.3.3 加分项"前移,显式接入 5.3.1 风险分类 / 5.3.2 deepen gate,使"高风险即使被判 Lightweight 也强制走 rubric",否则机制对目标场景免疫。
- **D-4(对应 P0-D)**:声明 001 为唯一执行入口,移除 002 带 U-ID 的并行执行单元;跨文档引用一律加文档前缀。
- **D-5(对应 P1-A)**:诚实计量与降级措辞——"新增含触发矩阵+硬闸的条件 reference + deepening 评分扩展 + 9 eval case"是**中型机制新增**,非"3 句话";标题去掉"顶尖架构师级升级"的夸大,改为"为 spec-plan 高风险场景补生成期提示与 eval"。
- **D-6(对应 P1-B)**:G-1/G-2 从断言改为假设;把 fresh-source eval / 模型实测从 Deferred 提为准出条件,否则"升级有效"在本体系内不可证。
- **D-7(对应 P1-C)**:删掉"privacy 80% 已存在"的伪量化,诚实写"DB 侧有覆盖,非 DB 个人数据流是真空白,本方案仅 rubric 提示不解决"。
- **D-8(对应 P1-D)**:enterprise reference 只保留"高风险下额外要 plan-time 显式声明什么"(纯 quality criteria),trigger→specialist 一律复用并指向 deepening 5.3.4,不重写映射;trade-off 句因属通用质量,考虑放 Plan Quality Bar 而非 enterprise 文件。

---

## 3. 反思的元结论(对本次 loop 工作方式)

对抗视角点破了一个我该正视的模式:**多轮 loop 的"自我纠正"被我当成了可信度背书,但同一作者无外部新证据的自我迭代,无论多少轮都不增加外部验证强度**。第 1 轮提 4 方向,2/3/4 轮把它们逐个降级回近乎 0——这是消解初始噪声,不是核实外部世界。

教训:loop 适合"持续推进有外部反馈的工作",不适合"反复打磨一个缺乏外部验证基底的推断"。本次最有价值的一步,恰恰是这次**引入了 4 个独立视角(外部反馈)**,而非又一轮自我迭代。

---

## 4. 未验证项(诚实声明)

- 4 个 subagent 均为 read-only 反思,基于真实 source 核实,但**未实跑修改后的 spec-plan 行为**(plan-only)。
- P0-C 的机制洞是基于 SKILL.md 5.3.2 文本推断,未实测 deepening 在 Lightweight+高风险下的真实分支。
- 处置建议 D-1~D-8 **尚未执行**,待维护者拍板是否做减法。
- 本纪要是反思记录,非方案变更;若采纳 D-1,本纪要与 gap-analysis 可一并归档。

---

## 5. 引用

- 评审对象三文档(见顶部路径)
- 现状 source:`skills/spec-plan/SKILL.md`(5.3.1/5.3.2 gate)、`skills/spec-plan/references/deepening-workflow.md`(:41/:113/:201 映射)、`agents/spec-data-integrity-guardian.agent.md`、`tests/unit/spec-plan-contracts.test.js`
- 方法:4 角色并行 read-only subagent 反思(general-purpose),各自独立核实后返回分级 findings
