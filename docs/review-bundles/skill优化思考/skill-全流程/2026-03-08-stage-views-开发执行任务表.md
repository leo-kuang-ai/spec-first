# Stage Views 全流程接入 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `00-first` producer 分层能力完成后，让入口节点、主链节点、治理节点按顺序接入 `role-views`、`stage-views` 与 `background_input_status`，形成完整的全流程背景输入机制。

**Architecture:** `00-first` 负责维护 runtime 真源层与 docs 投影视图层；`00-onboarding / 01-init / 13-orchestrate` 负责识别与路由；`03-spec / 04-design / 07-code / 12-verify` 负责消费对应 stage view；`14-status / 15-doctor / 21-analyze` 负责治理背景质量与真源 / 投影视图同步状态。

**Tech Stack:** TypeScript、Node.js、Vitest、Spec-First Skill Docs、CLI Commands

**Repo Facts:** 当前仓库存在 `skills/spec-first/00-onboarding`、`01-init`、`03-spec`、`04-design`、`07-code`、`12-verify`、`13-orchestrate`、`14-status`、`15-doctor`、`21-analyze`；不存在独立的 `09-test` skill。当前已存在 `tests/unit/code-skill-docs.test.ts` 与 `tests/unit/init.test.ts`、`tests/unit/orchestrate-args-parser.test.ts`、`tests/unit/cli-metrics-doctor.test.ts` 等可复用测试入口。

---

### Task 1: `00-onboarding` 接入 `role-views`

**Files:**
- Modify: `skills/spec-first/00-onboarding/SKILL.md`
- Modify: `skills/spec-first/00-onboarding/references/scenario-mapping.md`
- Test: `tests/unit/onboarding-skill-docs.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/onboarding-skill-docs.test.ts` 中断言：
- `00-onboarding` 明确优先读取 `role-views`
- 无 `first` 资产时明确进入降级入口

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/onboarding-skill-docs.test.ts`
Expected: FAIL with outdated onboarding docs

**Step 3: Update docs**

- 在 `SKILL.md` 中增加 role-view 优先规则
- 在 `scenario-mapping.md` 中增加“有资产 / 无资产”入口分支

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/onboarding-skill-docs.test.ts`
Expected: PASS

---

### Task 2: `01-init` 接入 `background_input_status`

**Files:**
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/01-init/references/output-format.md`
- Modify: `skills/spec-first/01-init/references/interaction-guide.md`
- Test: `tests/unit/init.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/init.test.ts` 中断言：
- `init` 会检测 runtime `first` 资产
- `init` 输出 `background_input_status`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/init.test.ts`
Expected: FAIL with outdated init behavior or docs

**Step 3: Update docs and implementation**

- 在 `SKILL.md` 中加入背景状态判断
- 在输出格式中加入 `background_input_status`
- 在交互说明中加入降级提示

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/init.test.ts`
Expected: PASS

---

### Task 3: `13-orchestrate` 接入依赖强度与降级编排

**Files:**
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/references/orchestration-rules.md`
- Modify: `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- Test: `tests/unit/orchestrate-args-parser.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/orchestrate-args-parser.test.ts` 中断言：
- orchestrate 理解 `full / degraded / blind`
- orchestrate 理解 `L1 / L2 / L3`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: FAIL with missing stage-view governance rules

**Step 3: Update docs and implementation**

- 在 `SKILL.md` 中加入背景依赖强度说明
- 在 `orchestration-rules.md` 中加入降级路径规则
- 在 `skill-mapping.md` 中加入 stage-view 驱动的推荐逻辑

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: PASS

---

### Task 4: `03-spec` 接入 `spec-view`

**Files:**
- Modify: `skills/spec-first/03-spec/SKILL.md`
- Modify: `skills/spec-first/03-spec/references/question-gate-rules.md`
- Modify: `skills/spec-first/03-spec/references/final-confirmation-template.md`
- Test: `tests/unit/spec-skill-docs.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/spec-skill-docs.test.ts` 中断言：
- `03-spec` 明确读取 `spec-view`
- 无 `spec-view` 时显式标注降级状态

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/spec-skill-docs.test.ts`
Expected: FAIL with outdated spec docs

**Step 3: Update docs**

- 在 `SKILL.md` 中加入 `spec-view` 输入说明
- 在规则模板中加入背景状态字段

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/spec-skill-docs.test.ts`
Expected: PASS

---

### Task 5: `04-design` 接入 `design-view`

**Files:**
- Modify: `skills/spec-first/04-design/SKILL.md`
- Modify: `skills/spec-first/04-design/references/gate-rules.md`
- Modify: `skills/spec-first/04-design/references/design-constraints.md`
- Test: `tests/unit/design-skill-docs.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/design-skill-docs.test.ts` 中断言：
- `04-design` 明确读取 `design-view`
- 正式设计前声明最小背景要求

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/design-skill-docs.test.ts`
Expected: FAIL with outdated design docs

**Step 3: Update docs**

- 在 `SKILL.md` 中加入 `design-view` 输入说明
- 在 gate 与约束文档中加入背景依赖口径

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/design-skill-docs.test.ts`
Expected: PASS

---

### Task 6: `07-code` 接入 `code-view`

**Files:**
- Modify: `skills/spec-first/07-code/SKILL.md`
- Modify: `skills/spec-first/07-code/references/code-standards.md`
- Modify: `tests/unit/code-skill-docs.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/code-skill-docs.test.ts` 中新增断言：
- `07-code` 明确读取 `code-view`
- 文档中出现 `entry_points`、`likely_change_areas`、`change_hazards`
- 文档中显示 `background_input_status`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/code-skill-docs.test.ts`
Expected: FAIL with outdated code docs

**Step 3: Update docs**

- 在 `SKILL.md` 中加入 `code-view` 输入说明
- 在 `code-standards.md` 中补充与 `code-view` 配合的要求

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/code-skill-docs.test.ts`
Expected: PASS

---

### Task 7: `12-verify` 接入 `verify-view`

**Files:**
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/12-verify/references/gate-conditions.md`
- Modify: `skills/spec-first/12-verify/references/coverage-metrics.md`
- Modify: `skills/spec-first/12-verify/references/verify-report-template.md`
- Test: `tests/unit/verify-skill-docs.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/verify-skill-docs.test.ts` 中断言：
- `12-verify` 明确读取 `verify-view`
- 文档中出现 `critical_flows`、`validation_focus`、`recommended_checks`
- 高风险验证可提升背景依赖强度

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/verify-skill-docs.test.ts`
Expected: FAIL with outdated verify docs

**Step 3: Update docs**

- 在 `SKILL.md` 中加入 `verify-view` 输入说明
- 在 3 个 reference 文件中补充验证重点字段

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/verify-skill-docs.test.ts`
Expected: PASS

---

### Task 8: 治理节点接入背景状态

**Files:**
- Modify: `skills/spec-first/14-status/SKILL.md`
- Modify: `skills/spec-first/14-status/references/status-dashboard-template.md`
- Modify: `skills/spec-first/15-doctor/SKILL.md`
- Modify: `skills/spec-first/15-doctor/references/diagnostic-rules.md`
- Modify: `skills/spec-first/21-analyze/SKILL.md`
- Modify: `skills/spec-first/21-analyze/references/analysis-rules.md`
- Modify: `src/cli/commands/doctor.ts`
- Modify: `src/cli/commands/analyze.ts`
- Modify: `tests/unit/cli-metrics-doctor.test.ts`
- Test: `tests/unit/status-skill-docs.test.ts`
- Test: `tests/unit/doctor-skill-docs.test.ts`
- Test: `tests/unit/analyze-skill-docs.test.ts`

**Step 1: Write the failing tests**

在测试中覆盖：
- `14-status` 展示 `background_input_status`
- `15-doctor` 诊断 `stage-views`
- `15-doctor` 诊断 docs 投影视图与 runtime 是否失同步
- `21-analyze` 将背景输入状态纳入分析
- doctor CLI 输出理解新的 background checks

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/status-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/cli-metrics-doctor.test.ts`
Expected: FAIL with missing docs or stale CLI expectations

**Step 3: Update docs and implementations**

- 在 `14-status` 中增加背景状态展示说明
- 在 `15-doctor` 中增加 runtime 背景诊断规则
- 在 `21-analyze` 中增加背景质量分析口径
- 更新 `doctor.ts` 与 `analyze.ts`

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/status-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/cli-metrics-doctor.test.ts`
Expected: PASS

---

### Task 9: 文档总览与口径收口

**Files:**
- Modify: `docs/review-bundles/skill优化思考/README.md`
- Modify: `docs/review-bundles/skill优化思考/2026-03-08-first-stage-views-全流程最佳实践方案.md`
- Modify: `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-结构设计.md`
- Modify: `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-全流程实施计划.md`

**Step 1: Update wording**

确保总览文档统一表达：
- `00-first` 维护 runtime 真源层
- `docs/first` 作为投影视图层长期保留
- 入口 / 编排节点识别背景状态与依赖强度
- 主链节点读取 stage views
- 治理节点诊断背景质量与真源 / 投影视图同步状态

**Step 2: Run targeted doc tests**

Run: `pnpm vitest run tests/unit/onboarding-skill-docs.test.ts tests/unit/init.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts tests/unit/status-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts`
Expected: PASS

**Step 3: Run broader regression**

Run: `pnpm test`
Expected: PASS

---

## Suggested Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9

## Definition of Done

- `00-onboarding / 01-init / 13-orchestrate` 已接入背景机制
- `03-spec / 04-design / 07-code / 12-verify` 已消费对应 stage view
- `14-status / 15-doctor / 21-analyze` 已把背景输入质量纳入治理
- 角色降级、阶段依赖强度、背景状态三者口径一致
- 真源层与投影视图层的边界清晰且可诊断
