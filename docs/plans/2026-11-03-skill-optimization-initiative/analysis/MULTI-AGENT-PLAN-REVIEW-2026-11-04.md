# 多Agent方案审查结论沉淀（2026-11-04）

**审查对象**：Option B 全合规方案 v3.2（主计划 + 4份WP计划 + DIRECTORY-STRUCTURE v1.2 + 覆盖分析 v1.0）
**审查方式**：4个并行agent，分别从测量有效性、可执行性、完整性/账目、治理与偏见风险四个软件工程视角独立审查。agent未获知主持者既有结论（无锚定），仅提供文件路径与ground-truth证据指针。
**处置**：结论经owner三项裁决后，已全部落位到 v3.3（主计划）/ v1.1（WP1/WP3/WP5）/ v1.1（覆盖分析）。本文是决策证据记录，不是新的行动项来源。

---

## 各视角结论

| 视角 | 结论 | 要点 |
|---|---|---|
| 测量有效性 | 需修补（4×P0） | 覆盖率口径不稳定；预写结论（基线报告模板）；WP5量表与数据可得性错配；跨阶段百分比在n=9/5下不可靠 |
| 可执行性 | 需修补（1×P0） | WP5阶段2触发的「返工率>10%」在n=5粒度下不可操作；若干数据指针失效 |
| 完整性/账目 | 账目不成立（2×P0） | 45项账目与WP分配数不一致（31≠35）；条目重复/双计；5项维度无WP归属 |
| 治理与偏见 | 结构性偏见风险（3×P0） | 评估者与优化者同血统；改善声明由作者自评复核；模板预填「有效/真实」结论引导确认偏差 |

## 收敛发现（≥2个agent独立提出）

1. **账目不一致**：覆盖清单总数、部分/未覆盖计数与WP分配矩阵对不上；同一差距双列、ML场景双计。
2. **预写结论**：WP5基线报告模板在数据产生前已写好「显著改善」「改善真实」标题与结论。
3. **WP5规模不可操作**：量表依赖的用户介入数据在Phase 0标unknown，触发阈值「>10%」在n=5下无判别力。
4. **spec-plan矛盾**：主计划称spec-plan「Phase 0.5已有深度分析」，WP1又未列入其任务范围，归属悬空。

## 事实性纠错（agent对照ground-truth发现）

| 原文声称 | 实测事实 | 修正落位 |
|---|---|---|
| ML-02复用 consumer-replay-cases.json 既有案例 | 12案例中 `can_enter_spec_plan` 出现0次；真实fixture为 `skills/spec-plan/evals/fixtures/repos/admin-export-blocker/docs/plans/2026-07-31-001-feat-admin-export-plan.md:8` | WP3 v1.1 |
| core/08「未明确定义」spec-commit-push-pr Contract | core/08:256-289 实际定义了其Input/Output Contract（含review approved输入门、PR必含项） | WP1 v1.1 |
| WP1称四Skill「❌未做」深度分析 | `phase0-results/phase05-analysis/` 已有四份分析（浅层） | WP1 v1.1（改为diff后增量深读） |
| 5865e27b列入WP1 diff复核清单 | 该提交是spec-plan优化（SP-1），WP1范围外 | WP1 v1.1（标注仅供VT-02对照） |

## Owner三项裁决（AskUserQuestion，2026-11-04）

1. **5项无归属覆盖维度** → 并入WP5轻量量化：新增任务1.7（Layer 2量化，数据源为既有trace的 friction_summary.by_type 等结构化字段），+1.5-2.5h，保住45项100%闭环口径。
2. **WP5决策点1** → 改为owner阻断确认：阈值满足仅产出proposal，owner明确确认后才进入阶段2；未确认走路径A收尾。
3. **复核独立性** → 独立reviewer+provenance：评分与复核由fresh-source独立reviewer执行（引用 `docs/contracts/workflows/fresh-source-eval-checklist.md`），产出头部标provenance；推翻Phase 1结论≥2项即升级owner仲裁。

## 未采纳/降级项

- **重写覆盖分类体系**（agent建议）：未采纳。改为固定计数规则（清单条目=唯一计数单位，组条目计1，同一差距只允许一列），45项/47%基线可追溯到清单本身，重写taxonomy收益不抵扰动。
- **WP5扩样到更多任务**：暂不采纳，按风险1标注样本局限性，聚焦定性趋势。

## 修复清单与落位

- 主计划 v3.3：~27处（账目对齐、任务1.7、owner阻断、独立reviewer、返工率advisory口径、预算58-83/68-99h、42/47文档等）
- 覆盖分析 v1.1：计数规则+勘误+24行「差距项→WP分配矩阵」（WP1×12/WP3×4/WP4×3/WP5×5=24；21+24=45）
- WP1 v1.1：11处；WP3 v1.1：6处；WP5 v1.1：30处（含任务1.7、Phase 0介入unknown档、预写结论删除、触发阈值改述、provenance）
- DIRECTORY-STRUCTURE v1.3：版本引用与覆盖率口径同步

## 局限

- 4个agent均为同一模型（GLM-5.3）同日运行，独立于主持者但非异构；「独立确认」指无锚定交叉验证，不等于外部效度。
- 审查基于文档与ground-truth文件抽查，未运行任何任务实测；行为层结论仍待WP3/WP5产出。
