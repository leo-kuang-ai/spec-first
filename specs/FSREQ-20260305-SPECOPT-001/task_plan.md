# /spec-first:spec 命令优化 Task 文档（v1.0）

> 来源需求文档：`spec-first-spec-命令优化需求文档-v1.0.md`
> 日期：2026-03-05
> 状态：Planned

---

## 1. 任务范围

将 `/spec-first:spec` 从当前 P0-P5 基线升级为“Phase 0 + Step 0-8 + 四档复杂度分流”的可执行流程，并打通 PRD 门禁、追溯矩阵、Gate 与 Analyze 一致性检查。

---

## 2. 里程碑与任务清单

## Phase 0: 执行前置（M0）

- [ ] TASK-SPECOPT-000 [US0] 初始化 Feature 工作区并落盘正式任务文档到 `specs/{featureId}/task_plan.md`

## Phase 1: 规则与模板重构（M1）

- [ ] TASK-SPECOPT-001 [US1] 重构 `03-spec/SKILL.md` 为 Phase 0 + Step 0-8 流程
- [ ] TASK-SPECOPT-002 [P] [US1] 增加四档复杂度分流与节点裁剪规则（含 SKIPPED 记录约束）
- [ ] TASK-SPECOPT-003 [P] [US1] 增加 Question Gate / Expansion Sweep / 一问一答收敛规则
- [ ] TASK-SPECOPT-004 [US1] 增加 Step 7 ADR-lite 与 Step 8 最终确认包模板
- [ ] TASK-SPECOPT-005 [US2] 增加 Phase 0 PRD 双模板（greenfield / iteration）与元信息规则
- [ ] TASK-SPECOPT-014 [US1] 增加 findings.md 结构化状态头规范与 Step 级恢复约束

## Phase 2: 引擎与门禁实现（M2）

- [ ] TASK-SPECOPT-006 [US2] 初始化流程预置 `prd.md` 骨架（可选预置，不替代 Phase 0 完整产出）
- [ ] TASK-SPECOPT-007 [US2] 新增 `prd-validator.ts`（PRD 章节校验、场景校验、C-PRD 评分）
- [ ] TASK-SPECOPT-008 [US2] `artifact-checker` 纳入 `prd.md` 为 `01_specify` 必需产物
- [ ] TASK-SPECOPT-009 [US3] `gate-evaluator` 新增 `G-SPEC-00` 与 `C-PRD>=85%` 阻断
- [ ] TASK-SPECOPT-010 [US3] `sca/analyze` 纳入 PRD 产物检查与 PRD→FR 映射检查
- [ ] TASK-SPECOPT-011 [US2] 追踪矩阵补齐 PRD→FR 映射约束（FR upstream 至少 1 条 `REQ-PRD-*`）
- [ ] TASK-SPECOPT-015 [US1] catchup 接入 Step 级恢复读取（`current_step/completed_steps/next_step`）

## Phase 3: 回归验证与抽样（M3）

- [ ] TASK-SPECOPT-012 [US4] 单元/集成测试补齐（validator、gate、artifact、sca、analyze）
- [ ] TASK-SPECOPT-013 [US4] 端到端抽样验证（4 档复杂度 + 场景 A/B）并记录结果

---

## 3. 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---|---|---|---|---|---|---|---|
| TASK-SPECOPT-000 | 初始化 Feature 工作区并落盘正式任务文档 | PM | 0.25d | FR-SPEC-OPT-009 | - | 存在 `specs/{featureId}/task_plan.md` 与 `specs/{featureId}/traceability-matrix.md` | complete |
| TASK-SPECOPT-001 | 重构 spec Skill 主流程（Phase0 + Step0-8） | SPEC | 0.5d | FR-SPEC-OPT-001, FR-SPEC-OPT-003, FR-SPEC-OPT-008, FR-SPEC-OPT-010 | TASK-SPECOPT-000 | `03-spec/SKILL.md` 明确节点、输入输出、跳过规则与阻断条件 | complete |
| TASK-SPECOPT-002 | 四档复杂度分流与执行深度映射 | SPEC | 0.5d | FR-SPEC-OPT-001 | TASK-SPECOPT-001 | 输出 Trivial/Simple/Moderate/Complex 判定规则及节点覆盖矩阵 | complete |
| TASK-SPECOPT-003 | Question Gate + Expansion Sweep + 收敛问答规则 | SPEC | 0.5d | FR-SPEC-OPT-002, FR-SPEC-OPT-003, FR-SPEC-OPT-005 | TASK-SPECOPT-001 | 明确 Blocking/Preference 分类、Step6 单问、Step1-5 最多3问 | complete |
| TASK-SPECOPT-004 | Step7 ADR-lite 与 Step8 确认包模板 | SPEC | 0.5d | FR-SPEC-OPT-004, FR-SPEC-OPT-006, FR-SPEC-OPT-009 | TASK-SPECOPT-001 | 模板落地并可被后续 design/task 阶段直接引用 | complete |
| TASK-SPECOPT-005 | Phase0 PRD 双模板与元信息规范 | SPEC | 0.5d | FR-SPEC-OPT-011, FR-SPEC-OPT-012 | TASK-SPECOPT-001 | `prd.md` 模板覆盖两场景且包含 `scenario/scenario_reason/evidence_paths/complexity` | complete |
| TASK-SPECOPT-014 | findings 状态头规范与 Step 级恢复协议 | SPEC | 0.5d | FR-SPEC-OPT-001, FR-SPEC-OPT-009 | TASK-SPECOPT-001 | `findings.md` 包含 `current_step/completed_steps/skipped_steps/next_step` 结构头并定义更新时机 | complete |
| TASK-SPECOPT-006 | init 预置 prd 骨架 | CORE | 0.5d | FR-SPEC-OPT-011 | TASK-SPECOPT-002,TASK-SPECOPT-003,TASK-SPECOPT-004,TASK-SPECOPT-005,TASK-SPECOPT-014 | 新建 feature 时可选产出 PRD 骨架，不与 Phase0 冲突 | complete |
| TASK-SPECOPT-007 | 新增 PRD 校验与评分组件 | CORE | 1d | FR-SPEC-OPT-012, FR-SPEC-OPT-013, FR-SPEC-OPT-014 | TASK-SPECOPT-002,TASK-SPECOPT-003,TASK-SPECOPT-004,TASK-SPECOPT-005,TASK-SPECOPT-014 | `prd-validator.ts` 可输出完整性/场景/C-PRD 结果 | complete |
| TASK-SPECOPT-008 | artifact-checker 纳入 prd 必需检查 | CORE | 0.5d | FR-SPEC-OPT-011, FR-SPEC-OPT-013 | TASK-SPECOPT-006,TASK-SPECOPT-007 | `01_specify` 缺 `prd.md` 时返回 missing | complete |
| TASK-SPECOPT-009 | gate 新增 G-SPEC-00 与 C-PRD 阈值校验 | CORE | 1d | FR-SPEC-OPT-007, FR-SPEC-OPT-013, FR-SPEC-OPT-014 | TASK-SPECOPT-006,TASK-SPECOPT-007,TASK-SPECOPT-008 | `gate check` 可阻断 PRD 不完整或 C-PRD < 85% | complete |
| TASK-SPECOPT-010 | sca/analyze 纳入 PRD 与承接链检查 | CORE | 0.5d | FR-SPEC-OPT-007, FR-SPEC-OPT-015 | TASK-SPECOPT-006,TASK-SPECOPT-007 | 分析报告可识别 PRD 缺失与 PRD→FR 追溯缺口 | complete |
| TASK-SPECOPT-011 | 矩阵 PRD→FR 映射规则落地 | CORE | 0.5d | FR-SPEC-OPT-015 | TASK-SPECOPT-006,TASK-SPECOPT-007 | 每个 FR 至少 1 条 `REQ-PRD-*` upstream 引用 | complete |
| TASK-SPECOPT-015 | catchup 接入 Step 级状态恢复 | CORE | 0.5d | FR-SPEC-OPT-009 | TASK-SPECOPT-006,TASK-SPECOPT-007,TASK-SPECOPT-014 | 会话恢复可读写 `findings` 状态头并给出下一 Step | complete |
| TASK-SPECOPT-012 | 测试补齐（UT/IT/ST） | QA | 1d | FR-SPEC-OPT-009, FR-SPEC-OPT-013, FR-SPEC-OPT-014, FR-SPEC-OPT-015 | TASK-SPECOPT-009,TASK-SPECOPT-010,TASK-SPECOPT-011,TASK-SPECOPT-015 | 新增/更新 UT/IT/ST 覆盖主路径与阻断路径，含衔接包可复用验证 | complete |
| TASK-SPECOPT-013 | 抽样验收（E2E）与回归记录 | QA | 1d | FR-SPEC-OPT-001, FR-SPEC-OPT-002, FR-SPEC-OPT-003, FR-SPEC-OPT-004, FR-SPEC-OPT-005, FR-SPEC-OPT-006, FR-SPEC-OPT-007, FR-SPEC-OPT-008, FR-SPEC-OPT-009, FR-SPEC-OPT-010, FR-SPEC-OPT-011, FR-SPEC-OPT-012, FR-SPEC-OPT-013, FR-SPEC-OPT-014, FR-SPEC-OPT-015 | TASK-SPECOPT-012 | 四档复杂度 + 场景A/B 抽样通过并形成验收记录 | complete |

---

## 4. 依赖关系

1. 里程碑严格串行：`M0 -> M1 -> M2 -> M3`
2. M0：`000`
3. M1：`001,002,003,004,005,014`（其中 `002/003/004` 可并行，均依赖 `001`）
4. M2：`006,007,008,009,010,011,015`（统一依赖 M1 完成）
5. M3：`012,013`（统一依赖 M2 完成）

## 4.1 工期口径

1. 单人总工时估算：约 10.25 人日。
2. 里程碑历时口径：按 2-3 人并行配置，目标与需求文档保持一致为 M1 1-2 天、M2 1 天、M3 1 天。
3. 若实际为单人执行，预期总历时按单人总工时顺延。

---

## 5. 验收基线

1. `G-SPEC-03 (C10>=80%)` 不弱化
2. 新增 `G-SPEC-00` 与 `C-PRD>=85%` 生效并阻断不合格输入
3. `prd.md`、`spec.md`、`traceability-matrix.md`、`analysis-report.md` 之间追溯链闭环
4. 抽样覆盖四档复杂度与两类场景，且无反模式违规

---

## 6. 当前阻塞与待确认

1. `[NEEDS CLARIFICATION][CONTEXT]` 执行前需确认 `featureId`；确认后以 `TASK-SPECOPT-000` 将任务文档与矩阵落盘到 `specs/{featureId}/`，再进入 M1。
