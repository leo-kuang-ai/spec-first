# spec-plan 仲裁（L1 · gpt-6-astra）

本次终裁仅针对 **structure_contract 静态层**，不代表运行行为、成本或完整 Skill 验收通过。三方报告均已读取，关键论据已回源核实；未修改文件，未运行测试或行为评测。私有全局指引 `/Users/kuang/.codex/AGENTS.md` 读取未获许可，不对其内容作推断。

## D05：pass | 理由 | 三方评注

**理由：** 三方争议中的“读纪律自相矛盾”不成立：`skills/spec-plan/SKILL.md:98` 只要求进入 Phase 5 时读 `final-review.md`，没有要求随后立即读 `plan-handoff.md`；真正的 handoff 加载点在 `skills/spec-plan/SKILL.md:104-106`，而 `skills/spec-plan/references/plan-handoff.md:7` 明确限定为写入及置信度检查之后。交付前重新读取则由 `skills/spec-plan/SKILL.md:108` 和 `skills/spec-plan/references/plan-handoff.md:90` 一致规定，属于明确的重复读取要求，而非时机冲突。范围确认规则确有重复，但 `skills/spec-plan/references/intake.md:171` 与 `skills/spec-plan/references/final-review.md:50` 将其分配给互斥的无上游来源／有上游来源路径，两处阻塞判断文字一致（分别见 `:177`、`:56`）。这些证据支持关键规则可定位、相关路径内部一致。仍保留维护瑕疵：`skills/spec-plan/references/synthesis-summary.md:274` 引用不存在的编号规则，而入口实际只有 `Interaction Method`（`skills/spec-plan/SKILL.md:48-52`）；这需要修正，但尚不足以证明关键行为无法确定或整个维度失败。

**三方评注：**
- **R1：** 终裁成立，但“无系统性矛盾”应限于已核对路径；此外，“至多三问”限制总量、“一次一问”限制节奏，不能仅凭二者并存就认定冲突。
- **R2：** 未读完整相关 references 时保留 `not-verified` 是诚实的覆盖声明，但这是本轮评审未完成核查，不是对象必须依赖运行证据才能判断。
- **R3：** 将 `SKILL.md:98` 误读成立即加载 handoff，并把一致的重读要求、不同阶段的重复规则上升为 P1 矛盾，未证明同一条件下存在不可同时满足的指令。

## D08：pass | 理由 | 三方评注

**理由：** 当前源码明确承诺必要原文、既有事实复用和条件加载，而非单纯追求少读：`skills/spec-plan/references/planning-evidence-boundaries.md:16` 规定摘要／元数据优先，但精确措辞、新鲜度、兼容性或完成声明依赖原文时必须回读；`skills/spec-plan/references/research.md:11` 禁止因采用 inline fallback 就预载全部 worker prompt，`:59` 又要求重要结论回读支撑细节，成本无收据时记未知。对上游信息保全，`skills/spec-plan/references/intake.md:59-64` 要求读取关键章节、字节保留 Product Contract 并引用稳定 ID，`skills/spec-plan/references/final-review.md:38-43` 补上来源逐节对账；对加载预算，该文件 `:70` 禁止初始写入前预载 deepening 和 handoff。终端重读确实增加规定的读取工作，但触发点清楚，不能仅凭重复就推断无效浪费；其实际成本及净收益仍未验证。

**三方评注：**
- **R1：** 静态层 `pass` 成立，但“实际常驻成本远低于语料规模”及重读“方向正确”超过现有证据，前者需要读取轨迹，后者需要匹配风险的效果比较。
- **R2：** 将“尚无实际读取轨迹及成本”作为整个静态维度未验证的理由，混淆了结构承诺与运行成本两层证据。
- **R3：** `partial` 不在允许值域内，且其扣分依赖未成立的读取时机矛盾；重复读取的存在不能直接证明效率下降。

## B05：pass | 理由 | 三方评注

**理由：** 相关失败与恢复机制在源码中确实存在，不能因未运行而判为机制缺失：`skills/spec-plan/SKILL.md:68` 对必需 reference 读取失败规定保留产物、阻断依赖动作，并返回包含阶段、阻塞原因及恢复路径的结果；`skills/spec-plan/references/research.md:3` 区分启动前参数拒绝、容量不足和启动后未决工作，明确仅纠正一次参数、不得重复启动未决任务；`:13` 区分缺授权、能力缺失和能力未证实，并提供 inline／串行降级。审查不可用时的一次有界自审、HTML 至多两轮重组及不完整审查的就绪降级，分别见 `skills/spec-plan/references/plan-handoff.md:20-24`。写入隔离要求独占创建、碰撞换路径和更新前核对身份（`skills/spec-plan/references/final-review.md:83`），并禁止恢复 Product Contract 时覆盖并发外部修改（`skills/spec-plan/references/plan-handoff.md:47`）；已有计划续跑须先检查元数据、章节与阻塞状态（`skills/spec-plan/references/resume.md:18-25`）。这些足以支持本次争议所涉及的静态合同成立；**不证明超时、部分成功及并发争用场景已经实际恢复成功，也不代表所有边缘路径均无缺口。**

**三方评注：**
- **R1：** 静态层终裁成立，但“覆盖系统化”不能外推为所有中断、超时或隔离路径均已验证，应保留其已识别的窄边缘及运行证据限制。
- **R2：** 未读失败／恢复 owner 时给出 `not-verified` 合理，但相关文件已补读后，不能继续把当时的阅读缺口作为最终对象结论。
- **R3：** 已明确承认机制存在，却因失败降级案例未纳入冻结运行集判 `fail`，把测试覆盖缺口当成静态合同缺陷；`eval.yaml:15-23` 的运行清单本身也不能证明机制“从未被触发”。

## 仲裁者一句话总结

**D05、D08、B05 均终裁为 `pass`，仅限本次静态合同仲裁：保留真实维护瑕疵与行为验证缺口，但不将重复约束误判为矛盾，也不将缺少运行证据误判为机制缺失。**
