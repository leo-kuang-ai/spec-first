# WP4：未覆盖维度补充计划

**版本**：v1.2
**创建日期**：2026-11-04
**更新日期**：2026-11-04 v1.1（维度改源重标：原D05/D07/D08系误标，见注）；v1.2（新增任务4.4超大需求适配质量审查，core/10/11关注面）
**目标**：补齐四个未覆盖维度的审查空白——错误恢复（v2 B05面）/ 审查视角（v2 B06面）/ 经验效用自演化与知识沉淀（core/05 D07）/ 超大需求适配质量（core/10/11关注面）
**投入**：10-15小时
**主计划**：[OPTION-B-FULL-COMPLIANCE-PLAN.md](../planning/OPTION-B-FULL-COMPLIANCE-PLAN.md)
**产出路径**：`wp-results/wp4-results/`

---

## 🎯 目标

### 主要目标
1. **错误恢复（v2 B05面）**：查清各Skill的失败处理、Retry、Fallback、Human escalation机制是否存在且完整
2. **审查视角（v2 B06面）**：查清spec-code-review是否按变更类型调整审查策略
3. **经验效用自演化/知识沉淀（core/05 D07）**：查清各Skill的问题→修订→复验链与知识积累复用机制
4. **超大需求适配质量（core/10/11关注面）**：查清6个主链路Skill对超大需求的适配机制——分解/任务包、上下文规模、跨会话续作、协作交接——是否存在且够用

> v1.1改源注：原标签「D05/D07/D08」误用core/05编号（core/05原文D05=紧凑性、D07=经验效用自演化、D08=上下文利用）。经REVIEW-EXECUTION-WORKFLOW v2.1映射：错误恢复→B05、审查视角→B06；知识沉淀即core/05 D07的组成。审查内容不变，只改来源标注。

### 背景
这四个维度在CORE-REVIEW-DIMENSIONS-COVERAGE.md中标记为"完全未覆盖"（v1.4口径：13项未覆盖中归属WP4的4项；其中超大需求适配为v1.3新增——core/10/11的实施方案未执行（原文已归档archive/），但其关注面「当前Skill对超大需求的适配质量」从未被主动审查，X01-X04仅为WP3场景触发时的被动登记，owner 2026-11-04裁定纳入）。与WP1的Skill级深读互补：WP1按Skill纵向深读，WP4按维度横向扫描。

### 执行顺序建议
任务4.2（D07）与WP1任务1.2（spec-code-review深读）涉及同一Skill，建议紧随其后执行，复用已建立的源码理解，节省重复阅读时间。

---

## 📋 任务清单

### 任务4.1：错误恢复机制审查（B05面，3-4h）

**审查范围**：5个主链路Skill（spec-prd / spec-plan / spec-work / spec-code-review / spec-commit-push-pr）

**审查内容**：
- [ ] 各Skill是否有错误处理逻辑
- [ ] 是否有Retry机制
- [ ] 是否有Fallback策略
- [ ] 是否有Human escalation路径

**执行步骤**：
1. 逐Skill搜索"error"/"failure"/"retry"/"fallback"/"escalate"等关键词（2h）
2. 评估错误恢复机制的完整性（1h）
3. 识别缺失的错误恢复能力（0.5h）

**评估口径**（对应CLAUDE.md degradation原则）：
- 机制存在且有明确触发条件 → 完整
- 机制存在但条件模糊 → 部分完整
- 机制缺失但属"响亮约定"降级 → 记录为诚实降级，不算缺陷但标注
- 机制缺失且无说明 → 缺口

**产出**：error-recovery-mechanism-review.md（含逐Skill×逐机制矩阵表）

---

### 任务4.2：审查视角调整审查（B06面，3-4h）

**审查对象**：spec-code-review

**审查内容**：
- [ ] spec-code-review是否按变更类型调整审查策略（新功能开发 vs 缺陷修复 vs 重构）
- [ ] 不同变更类型的审查重点是否不同
- [ ] 是否有明确的审查清单或指引

**执行步骤**：
1. 阅读spec-code-review源码（若WP1任务1.2已完成，复用阅读笔记，仅补视角维度）（1.5h）
2. 搜索"feature"/"bug"/"refactor"/"change type"等关键词（0.5h）
3. 评估审查视角的灵活性（1h）
4. 提出改进建议（0.5h）

**产出**：review-perspective-adjustment-check.md

---

### 任务4.3：经验效用自演化/知识沉淀机制审查（core/05 D07，2-4h）

**审查范围**：5个主链路Skill + docs/solutions/ 机制

**审查内容**：
- [ ] 各Skill是否有知识积累能力
- [ ] 是否利用docs/solutions/
- [ ] 是否有模式识别和复用机制
- [ ] 知识如何被后续任务利用

**执行步骤**：
1. 搜索"docs/solutions"/"knowledge"/"pattern"/"compound"（1h）
2. 评估知识沉淀机制的存在性（1h）
3. 识别缺失的知识沉淀能力（0.5h）

**产出**：knowledge-accumulation-mechanism-review.md

---

### 任务4.4：超大需求适配质量审查（core/10/11关注面，2-3h）

**背景**：core/10（超大需求五阶段方案）与 core/11（业界对标）的**实施方案**未执行（已归档 `archive/`），但其**关注面**——当前 Skill 对超大需求的适配质量——是独立审查维度，此前无任何工作包覆盖；WP3 的 X01-X04 仅在场景触发时被动登记，不构成主动审查（owner 2026-11-04 裁定纳入）。v2 §2 边界：不继承其「新增6个Skill」「182h升级」方案，只审现有机制。

**审查范围**：6个主链路Skill（spec-prd / spec-plan / spec-tasks / spec-work / spec-code-review / spec-commit-push-pr）+ spec-handoff

**审查内容**（对照 core/10 五阶段关注面）：
- [ ] 需求分解：spec-prd/spec-plan 能否支撑超大需求的多阶段分解（多任务包、依赖顺序、接口边界）
- [ ] 上下文规模：长PRD/长Plan的裁剪保护机制（衔接WP3 ML-03结论）；跨Skill交接对超大范围的对账义务
- [ ] 任务包机制：spec-tasks 的 task pack 对多包并行/串行的支撑与 readiness 约束
- [ ] 跨会话续作：spec-handoff 对超长任务的落盘/恢复/知识交接支撑
- [ ] 协作面：X04（协作/跨会话/知识交接）在超大需求场景的机制登记
- [ ] 业界对照：core/11 的12缺口清单中仍适用项逐条核对（行业引用先核实，v2边界）

**执行步骤**：
1. 从 skills/ 与 templates/ 提取与分解/任务包/交接/续作相关的机制清单（1h）
2. 逐关注面核对机制存在性与边界说明（0.5h）
3. 结论区分：机制存在且够用 / 诚实降级 / 真实缺口；若WP3已登记X面触发案例，作为实证输入（0.5h）

**产出**：large-requirement-adaptation-review.md（含关注面×机制矩阵表）

---

## 📊 时间线（建议第4周执行）

| 日 | 任务 | 投入 |
|---|---|---|
| Day 1上午 | 任务4.1 错误恢复（B05面） | 3-4h |
| Day 1下午 | 任务4.2 审查视角（B06面） | 3-4h |
| Day 2上午 | 任务4.3 经验效用自演化/知识沉淀（core/05 D07） | 2-4h |
| Day 2下午 | 任务4.4 超大需求适配质量（core/10/11关注面） | 2-3h |
| Day 3上午 | WP4总结报告 | 1-2h |

---

## 📋 汇总产出（5个）

1. error-recovery-mechanism-review.md
2. review-perspective-adjustment-check.md
3. knowledge-accumulation-mechanism-review.md
4. large-requirement-adaptation-review.md
5. WP4-uncovered-dimensions-summary.md

---

## ✅ 完成标准

- [ ] 错误恢复（B05）：5个Skill × 4类机制（错误处理/Retry/Fallback/Escalation）的矩阵表完整，每格有结论与证据
- [ ] 审查视角（B06）：spec-code-review按变更类型调整能力的结论明确（有/无/部分），有源码证据
- [ ] 经验效用自演化（core/05 D07）：问题→修订→复验链与知识沉淀链路（捕获→存储→复用）每环节有结论
- [ ] 超大需求适配（core/10/11关注面）：关注面×机制矩阵完整，每格有结论与证据；与WP3 X01-X04登记结论互引
- [ ] 诚实降级项与真实缺口区分标注
- [ ] 每个发现的改进建议有具体落点（哪个Skill哪个位置）
- [ ] 4个文档归位到 wp-results/wp4-results/

---

## 🚨 风险与缓解

| 风险 | 概率 | 缓解 |
|---|---|---|
| 关键词搜索漏掉非标准命名的机制 | 中 | 搜索结果为空时，改读references/目录索引确认，不只依赖grep |
| D07与WP1任务1.2重复阅读 | 低 | WP4排在WP1之后，复用阅读笔记 |
| 任务4.3/4.4发现机制"存在但从未被使用" | 中 | 如实记录机制存在性与实际使用率两个维度，不混为一谈 |
| core/11缺口清单引用过时 | 中 | 行业引用先核实（v2边界）；仅核对仍适用项，不照单全收 |

---

## 📝 执行准备清单

- [ ] 确认WP1任务1.2的spec-code-review阅读笔记已完成（复用）
- [ ] 准备搜索关键词清单（见各任务步骤）
- [ ] 创建 wp-results/wp4-results/ 目录
- [ ] 打开 skills/spec-compound/ 与 docs/solutions/ 作为D07参照
- [ ] 打开 archive/10-large-requirement-strategy.md 与 archive/11-large-scale-skill-upgrade.md（任务4.4关注面来源；实施方案不继承，只审现有机制）

---

**WP4计划版本**：v1.2
**创建日期**：2026-11-04
**预计执行**：Week 4
**投入**：10-15小时
