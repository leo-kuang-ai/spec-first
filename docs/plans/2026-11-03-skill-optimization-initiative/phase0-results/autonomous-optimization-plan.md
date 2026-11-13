# 自主优化执行计划（阶段 2 产出）

**生成**：2026-11-04，全量自主优化执行（AUTONOMOUS-EXECUTION-INSTRUCTIONS.md 授权）
**输入**：5 个 Skill 深度分析（spec-plan[Phase 0.5] + spec-prd/spec-work/spec-code-review/spec-commit-push-pr[本轮]）
**评分公式**：score = frequency×30% + severity×30% + fixability×20% + roi×20%（频段/分值按指令定义）

## 所有问题清单（含评分）

| ID | Skill | 问题 | freq | sev | fix | roi | score | 级别 |
|---|---|---|---|---|---|---|---|---|
| SP-1 | spec-plan | 门1 自审缺两条跨集合对账（单元↔计划命令；触碰面↔既有合同测试）+ Verification Contract 缺盲区句义务；含 2 个 eval 案例 | 5 | 10 | 10 | 8 | **8.1** | **P0** |
| P-WORK-1 | spec-work | Test Discovery 缺「按断言目标反查管辖测试」类别（touched paths → tests/ 反查） | 5 | 10 | 10 | 6.8 | **7.8** | P1 |
| P-WORK-2 | spec-work | shipping check 选择缺「release 面文件 → release-governance 套件」类别 | 5 | 10 | 10 | 6 | **7.7** | P1 |
| P-CPPR-1 | spec-commit-push-pr | 提交前无 staged 文件触碰 release 面时的治理状态披露（advisory） | 5 | 10 | 10 | 6 | **7.7** | P1 |
| P-CR-1 | spec-code-review | Coverage 缺「管辖触碰文件的合同套件是否已跑」披露行 | 5 | 7 | 10 | 6 | **6.8** | P1 |
| P-WORK-3 | spec-work | 无关 dirty 工作区无 spec-worktree 隔离选项提示（advisory） | 5 | 5 | 10 | 6 | **6.2** | P1 |
| P-WORK-4 | spec-work | inline loop 无逐项 DoD 对账 | 3 | 7 | 7 | <1 | —— | P3 跳过（Rule 1: ROI<1） |
| P-CR-2 | spec-code-review | test-scenario↔测试代码对账缺失 | 3 | 5 | 7 | <1 | —— | P3 跳过 |
| P-CR-3 | spec-code-review | DoD 逐项对账缺失（R/U 级已覆盖） | 3 | 5 | 7 | <1 | —— | P3 跳过 |
| P-PRD-1 | spec-prd | 窗口内零使用，行为效果无数据 | —— | —— | —— | —— | —— | 不修改（数据缺口，入观察名单） |

**去重说明**：SP-1 / P-WORK-1 / P-WORK-2 / P-CPPR-1 / P-CR-1 处理同一实例类（T01 FP-CICD-1 + 双字节回归 + T04 S20 回归 = 3 个已证实例）在生命周期五个时点（plan 生成→work 执行→review 披露→landing 披露）的纵深，非重复修复；各层 ROI 已按边际折算。

## 执行顺序（score 降序）

1. **SP-1**（P0，~4h）：`skills/spec-plan/references/final-review.md` 5.1 增对账检查组 + `plan-sections.md` Verification Contract 补触碰面合同测试与盲区句义务 + 同步 `tests/unit/spec-plan-{reference,quality}-contracts.test.js` + `evals/output-quality-cases.json` 增 2 例
2. **P-WORK-1**（P1，~2h）：`skills/spec-work/references/feedback-and-tests.md` Test Discovery 增反查步 + `shipping-workflow.md` check 选择补类别
3. **P-WORK-2**（P1，~1h）：`shipping-workflow.md` check 选择补 release 类别（与 2 同文件不同段，独立提交）
4. **P-CPPR-1**（P1，~2h）：`skills/spec-commit-push-pr/references/commit-and-push.md` 增 `release_governance_status` 披露
5. **P-CR-1**（P1，~1.5h）：`skills/spec-code-review/references/finish-review.md` Coverage 段增披露行
6. **P-WORK-3**（P1，~1.5h）：`execution-strategy.md`/`workspace-setup.md` 增 worktree 选项 advisory

## 预算与收益

- 执行总投入：~12h（AI 口径）；累计（阶段1 32h + 阶段2 4h + 阶段3 12h）= 48h ≤ 80h 触发线，无需暂停
- 预期收益：3 个已证返工实例类在新任务中出现率下降 ≥50%（阶段 4 以 5 任务增量追踪验收）；T01 类 CI 往返与专家全量兜底前移
- 预期总 ROI：≈ (7 预防事件/30 任务 × 1.5h) / 12h ≈ 0.9–1.3（含纵深重叠的保守折算）；SP-1 单项 ROI ≈ 2.5
- 风险：合同测试联动面 5 处（每项独立验证+提交；失败回滚重试上限 3 次）

## 验证方案（阶段 4 前置声明）

每项修改后运行：锁该 reference 的合同测试套件 + `npm run lint:skill-entrypoints`；SP-1 加跑 spec-plan 全套件。阶段 4：5 个新任务增量追踪，对比 Phase 0 基线（返工任务率 66.7%）。
