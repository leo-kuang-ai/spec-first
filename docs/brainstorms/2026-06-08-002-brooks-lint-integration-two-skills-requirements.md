# brooks-lint 借鉴集成:spec-doc-review + spec-code-review — Requirements

> 日期:2026-06-08
> 类型:Standard requirements(brainstorm 产出,两轮探讨合并)
> 节点:`Codebase -> Spec -> Plan -> ... -> Review` 中的 Review 节点(doc-review + code-review)
> 上游探讨:本会话对 `hyhmrright/brooks-lint`(本地 `../brooks-lint`,v1.3.0)6 模式 + `_shared` 框架的深度理解
> 结构:**一条主线(两 skill 通吃)+ 一个 doc-review 专属补充 + 统一否决项**

---

## 1. 背景与问题

用户希望把 brooks-lint 的方法论借鉴进 spec-first 的两个评审 skill。经两轮逐模式分析(先 doc-review 后 code-review),结论收敛为一条主线加一个专属补充,而非"两个 skill 各搬一套框架"。

关键事实张力:

- **brooks-lint 6 模式审查对象全是代码**(PR diff、模块依赖、测试套件、技术债、代码健康)。
- **doc-review 审文档**(requirements/plan/task-pack)→ 逐模式找对应物,结果 **6 选 1**。
- **code-review 审代码**,与 brooks-lint 同类 → 找缺口,结果大部分模式**已有等价物**,真正缺口是横跨所有模式的一层纪律。

## 2. 逐模式分析(两轮汇总)

### 2.1 doc-review(6 选 1)

| brooks-lint 模式 | doc-review 对应物 | 判决 |
|---|---|---|
| brooks-review | 多 persona 审查本身 | 已存在,不借 |
| brooks-audit(依赖图) | 文档无模块依赖图 | 无对应物,排除 |
| brooks-debt(技术债+Pain×Spread) | **文档债** | ✅ 唯一缺口(专属补充) |
| brooks-test(T1-T6) | 文档无测试代码 | 无对应物,排除 |
| brooks-health(健康分) | LLM 心算就绪度分 | 违反边界,排除 |
| brooks-sweep | 已有 safe_auto fix + 四选项路由 | 已存在,不借 |

### 2.2 code-review(找缺口,大部分已有等价物)

| brooks-lint 模式 | code-review 现状 | 判决 |
|---|---|---|
| brooks-review(6维) | = code-review 本身 | 已存在,不借 |
| brooks-sweep(扫+autofix) | = autofix mode + safe_auto | 已存在,不借 |
| brooks-health(健康分) | 无,但违反边界 | 排除 |
| brooks-test(T1-T6) | `spec-testing-reviewer` 覆盖领域,无 T1-T6 细分 | 维度可细化但与 testing 重叠,不新增 agent |
| brooks-audit(R5/R6) | `spec-maintainability-reviewer` / `spec-adversarial-reviewer` 可覆盖部分结构风险;`spec-architecture-strategist` 目前只是 standalone agent,未接入 `spec-code-review` persona catalog | 不新增 agent;守卫/识别提示优先并入实际会派发的 reviewers。**strategist 接入 catalog 是独立于本切片的决策,本切片默认不接入**(它是已存在 agent,但接入会新增一个派发 persona 并可能与 maintainability/adversarial 产生重叠发现) |
| brooks-debt(Pain×Spread) | `maintainability` 审复杂度,无"未偿债+排序" | 与 maintainability 重叠高,不单列 |

**code-review "最干净"的借鉴(边界最清晰、重叠最少、价值最实):over-flag 守卫纪律 + 出处引用,融入现有 reviewer。** 实测守卫密度严重不足(见 §4)。

## 3. 主线 Goal(两 skill 通吃)

把 brooks-lint 最值钱、spec-first 最没做透的一层——`source-coverage.md` 的 **over-flag 守卫纪律 + 经典出处引用**——融入 code-review 与 doc-review 的现有 personas:

- **守卫纪律核心:** "A threshold crossing is a hint, not a verdict. Check context, intent, and blast radius." 每个判断维度配"Do not over-flag"清单(例:组合根依赖具体实现不算 DIP 违规;不同 bounded context 的相似代码不算 DRY 违规;稳定公共 API 不是 Hyrum 债务;CRUD 工作流用事务脚本不算贫血模型)。
- **出处引用(advisory):** 发现匹配经典原则时,可在 `why_it_matters` 带出处,格式 `<原则名> (<作者>, <书>)`,**不得编造**。

目标产出:降低两个 skill 的误报率;让 reviewer 把"阈值越界但有正当理由"的情况正确识别为现有 confidence 体系里的低分(0=误报/25=存疑),而非误报为发现。

## 4. 主线证据(本会话实测)

两个 skill 已有 brooks-lint Iron Law 的等价物——findings-schema 的 `why_it_matters` 字段(code-review 描述为 "Impact and failure mode -- not 'what is wrong' but 'what breaks'",doc-review 描述为 "Impact statement -- not 'what is wrong' but 'what goes wrong if not addressed'")= Consequence,`suggested_fix` = Remedy,confidence anchor(0/25/50/75/100)已是诚实自评机制。**所以不重造 Iron Law,只补缺口。**

缺口证据(本轮可复核):

- 当前 `skills/spec-code-review/references/persona-catalog.md` 的实际 code-review core reviewers 为 correctness / testing / maintainability / project-standards,conditional 列表不包含 `spec-architecture-strategist`。
- `rg -n "spec-architecture-strategist" skills/spec-code-review agents/spec-architecture-strategist.agent.md` 只命中 standalone agent 文件本身;因此它的 0 守卫只能说明 standalone agent 自身薄弱,不能当作当前 code-review 已覆盖面。
- session-local spot-check(计划阶段需对最终目标 reviewer 集重跑并落证据):`spec-maintainability-reviewer` 约 1 处、`spec-correctness-reviewer` 约 1 处、`spec-testing-reviewer` 约 2 处显式 over-flag 守卫;密度不足。
- **doc-review 侧守卫密度尚未对称实测**:主线声称两 skill 通吃,但 doc-review 各 persona(coherence/feasibility/scope-guardian 等)的 over-flag 守卫现状待 plan 阶段一并实测落证据,避免主线在 doc-review 侧悬空。

代码审查误报代价高于文档审查,故 code-review 比 doc-review 更需要这层。

## 5. doc-review 专属补充:文档债子镜头

仅 doc-review 需要(code-review 的等价缺口与 maintainability 重叠过高,不单列)。

给 `spec-scope-guardian-reviewer` 增加一个与其现有"是否过度设计"**同源**的子镜头:

- 现有镜头:文档**当前**是否过度设计?
- 新增子镜头:文档**累积了多少未偿债**(已承诺、被下游继承、但本文档未关闭——推测性范围、未解 open question、"先这样以后再说"),按 **Pain × Spread** 排偿还优先级?

刻意复用同一 agent 以避免重叠发现;映射到现有 severity/confidence 体系,不平移 brooks-debt 的 Critical/Scheduled/Monitored 命名。

## 6. 成功标准

- **主线:** 对一份"阈值越界但有正当理由"的 diff/文档(如组合根依赖具体实现、CRUD 用事务脚本),对应 reviewer 不再误报为发现,或正确打 0/25 confidence;关键发现可带经典出处。守卫改写后,实际纳入本切片的 reviewer 都应有明确 "Do not over-flag" 守卫;若计划选择接入 `spec-architecture-strategist`,必须先单独说明其 code-review catalog 接入边界。
- **doc-review 专属:** 对含推测性范围/未解 open question 的 plan,scope-guardian 能明确标出"文档债"项并给偿还优先级,且不与其"过度设计"发现重复。
- **全局:** 不新增 agent 文件、不改 findings-schema、不引入新配置/状态文件。

## 7. 非目标(Non-Goals,统一否决项)

- ❌ 不新增任何独立 agent(`spec-doc-debt-reviewer` / `spec-test-decay-reviewer` / `spec-architecture-decay-reviewer` / `spec-decay-tagger` / `spec-health-calculator` 等均否)——与现有 18+ personas 重叠,违反抗膨胀。
- ❌ 不引入 Health Score / 就绪度心算分 / 门禁(LLM 心算分违反 Scripts-prepare-LLM-decides,且与现有 verdict/就绪度成两套真相源)。
- ❌ 不引入文档/代码依赖图(Mermaid,LLM 脑补 import 不可靠)、`.yaml` 配置文件、history.json 跨分支状态、CI Action。
- ❌ 不细化引入 T1-T6/R1-R6 作为强制维度框架或新 schema 枚举——至多作为 reviewer 的识别提示,不作硬结构。
- ❌ 不照抄 brooks-lint 文本——借鉴判断纪律,改写融入各 reviewer 自身语言与 confidence 锚点(brooks-lint MIT,但需融入而非 import)。

## 8. Key Decisions(决策账)

| question | recommended | chosen | source | consequence |
|---|---|---|---|---|
| doc-review 6 模式借鉴角度 | 逐模式找对应物 | 同 | user | 6 选 1 |
| 文档债形态 | 子镜头 | 子镜头 | user | 不增 agent |
| code-review 借鉴重心 | 最干净者 | over-flag 守卫+出处(代判) | user 授权"哪种最干净" | 否掉新 agent/维度框架 |
| 文档结构 | 主线+专属 | 同 | user | 本文件改名覆盖两 skill |
| **是否新增独立 agent** | 否 | **否** | user | **连续两轮命令标题均隐含"增加 Agent",最终结论都是不增**;若坚持要独立 agent,需重新评估与现有 personas 的重叠成本与重复发现风险 |

## 9. Planning Handoff

范围中等、边界清晰,可直接进 `spec-plan`。plan 需覆盖:

- **主线(两 skill):** 对当前实际会派发的 code-review/doc-review reviewer agent prose 增补结构化 "What Not to Flag" 守卫 + 可选出处引用指引;两 skill 的 `subagent-template.md` 增补 advisory 出处说明;可考虑共享一份 `decay-risk-field-guide.md` 速查表(两 skill 引用,避免各写一份)。**该速查表仅作 advisory 出处参考用途,不得作为维度分类结构或 schema 枚举**(与 §7 否决"维度框架"一致)。`spec-architecture-strategist` 若要纳入,先做 catalog 接入决策,不要在本 requirements 中把 standalone agent 当作既有 code-review 覆盖面。
- **doc-review 专属:** `agents/spec-scope-guardian-reviewer.agent.md` 增文档债子镜头 + Pain×Spread 如何映射现有 severity/confidence。
- **验证:** agent prose 变更受会话缓存影响,须用 fresh-source eval(见 CLAUDE.md "Agent 与 Skill 变更验证";checklist 见 `docs/contracts/workflows/fresh-source-eval-checklist.md`);改后 `spec-first init` 同步 runtime mirror;补/更新 contract 或 unit test。
- **CHANGELOG:** 按仓库格式更新;两 skill reviewer 行为变化属用户可见,标 `(user-visible)`。
- **双宿主:** Claude 与 Codex 均消费这些 agent,runtime 同步需双宿主验证。

## 10. 关联记录(brooks-lint 被高估部分,供 plan 警惕)

brooks-lint 的 benchmark(94% vs 16%)是自证模板符合度,非独立质量评测;Health Score 是 LLM 心算主观分披精确外衣;依赖图靠 LLM 脑补。这些正是 §7 否决项的依据——借鉴其纪律内核(守卫+出处+诊断链),不借其被高估的量化外壳。
