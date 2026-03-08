# 2026-03-08 stage-views 全流程实施计划

## 1. 实施目标

把 `stage-views` 从架构结论推进成当前仓库可执行的实施顺序。

实施目标：

1. 完成 `00-first` producer 分层维护能力
2. 让入口 / 编排节点开始感知背景输入状态
3. 让主链节点开始读取各自 stage view
4. 让治理节点能够展示、诊断、分析背景状态

---

## 2. 总体顺序

推荐顺序不是“先改所有消费节点”，而是四波推进。

### Wave 0：producer 分层能力建立

由 `first-skill` 方案承担：

- `00-first` 建立 runtime 真源层
- `00-first` 保留 docs 投影视图层
- `summary`、`role-views`、`stage-views` 成型
- `first-context` 读取能力可用
- `dispatcher` / `resume` / `init readiness` / `change-detector` 同步切到 runtime 真源
- 增量维护与刷新模式可用

### Wave 1：入口 / 编排接入

先接入：

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`

理由：

- 先让流程入口知道“背景是否存在”
- 先让编排器理解降级与依赖强度
- 再去改主链节点，接入成本更低

### Wave 2：主链节点接入

再接入：

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

理由：

- 主链节点直接决定需求、设计、实现、验证质量
- stage views 的价值主要在这一波体现

### Wave 3：治理节点接入

最后接入：

- `skills/spec-first/14-status/SKILL.md`
- `skills/spec-first/15-doctor/SKILL.md`
- `skills/spec-first/21-analyze/SKILL.md`

理由：

- 治理依赖于前面已经存在明确状态
- 否则 status / doctor / analyze 只能做空转输出

---

## 3. P0 / P1 / P2 清单

## P0：以 producer 分层维护为前置依赖

P0 不在本目录实施，但必须先完成。

依赖项：

- `docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-一次切换实施清单.md`

P0 完成标志：

- runtime 真源层已建立
- `docs/first/` 已被明确为投影视图层
- `loadStageView(projectRoot, stage)` 已可用
- `dispatcher` / `resume` / `init readiness` / `change-detector` 已不再直连 `docs/first`
- 默认支持增量更新

## P1：入口 / 编排节点接入

### P1-1 `00-onboarding`

建议修改：

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/00-onboarding/references/scenario-mapping.md`

建议新增测试：

- `tests/unit/onboarding-skill-docs.test.ts`

接入内容：

- 若存在 `role-views`，优先做角色化入口建议
- 若不存在 `first` 资产，明确告知将进入降级模式

### P1-2 `01-init`

建议修改：

- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/01-init/references/output-format.md`
- `skills/spec-first/01-init/references/interaction-guide.md`
- `tests/unit/init.test.ts`

接入内容：

- 初始化时检测 runtime `first` 资产存在性
- 输出 `background_input_status`
- 为当前 feature 记录背景起点信息

### P1-3 `13-orchestrate`

建议修改：

- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/13-orchestrate/references/orchestration-rules.md`
- `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- `tests/unit/orchestrate-args-parser.test.ts`

接入内容：

- 根据阶段、角色、背景状态决定推荐路径
- 引入 `L1 / L2 / L3` 依赖强度口径
- 对 `blind` 状态给出统一警告

## P2：主链节点接入

### P2-1 `03-spec`

建议修改：

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/03-spec/references/question-gate-rules.md`
- `skills/spec-first/03-spec/references/final-confirmation-template.md`
- 新增 `tests/unit/spec-skill-docs.test.ts`

接入内容：

- 读取 `spec-view`
- 无 `spec-view` 时允许降级，但明确状态

### P2-2 `04-design`

建议修改：

- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/04-design/references/gate-rules.md`
- `skills/spec-first/04-design/references/design-constraints.md`
- 新增 `tests/unit/design-skill-docs.test.ts`

接入内容：

- 读取 `design-view`
- 正式设计前明确最小背景要求

### P2-3 `07-code`

建议修改：

- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/07-code/references/code-standards.md`
- `tests/unit/code-skill-docs.test.ts`

接入内容：

- 读取 `code-view`
- 使用 `entry_points`、`likely_change_areas`、`change_hazards`
- 在实现前显示背景状态

### P2-4 `12-verify`

建议修改：

- `skills/spec-first/12-verify/SKILL.md`
- `skills/spec-first/12-verify/references/gate-conditions.md`
- `skills/spec-first/12-verify/references/coverage-metrics.md`
- `skills/spec-first/12-verify/references/verify-report-template.md`
- 新增 `tests/unit/verify-skill-docs.test.ts`

接入内容：

- 读取 `verify-view`
- 使用 `critical_flows`、`validation_focus`、`recommended_checks`
- 高风险验证场景可提升背景依赖强度

## P3：治理节点接入

### P3-1 `14-status`

建议修改：

- `skills/spec-first/14-status/SKILL.md`
- `skills/spec-first/14-status/references/status-dashboard-template.md`
- 新增 `tests/unit/status-skill-docs.test.ts`

接入内容：

- 展示各阶段的 `background_input_status`
- 展示是否存在匹配的 stage view
- 展示 docs 投影视图与 runtime 是否同步

### P3-2 `15-doctor`

建议修改：

- `skills/spec-first/15-doctor/SKILL.md`
- `skills/spec-first/15-doctor/references/diagnostic-rules.md`
- `src/cli/commands/doctor.ts`
- `tests/unit/cli-metrics-doctor.test.ts`
- 新增 `tests/unit/doctor-skill-docs.test.ts`

接入内容：

- 诊断 `summary`
- 诊断 `stage-views`
- 诊断 docs 投影视图是否失同步
- 识别 `blind` 状态和不完整 stage view

### P3-3 `21-analyze`

建议修改：

- `skills/spec-first/21-analyze/SKILL.md`
- `skills/spec-first/21-analyze/references/analysis-rules.md`
- `src/cli/commands/analyze.ts`
- 新增 `tests/unit/analyze-skill-docs.test.ts`

接入内容：

- 把背景输入状态纳入分析报告
- 识别“背景不足导致产物质量下降”的问题
- 识别 runtime 真源与 docs 投影视图的漂移问题

---

## 4. 推荐开发顺序

建议按下面顺序推进：

1. 完成 producer 分层维护能力
2. 确认主链 truth-source 入口已全部切换
3. 接入 `00-onboarding`
3. 接入 `01-init`
4. 接入 `13-orchestrate`
5. 接入 `03-spec`
6. 接入 `04-design`
7. 接入 `07-code`
8. 接入 `12-verify`
9. 接入 `14-status`
10. 接入 `15-doctor`
11. 接入 `21-analyze`

这样安排的原因：

- 先让入口与编排理解“有没有背景底座”
- 再让主链稳定消费 stage views
- 最后再让治理节点读取这些状态

---

## 5. 完成定义

当以下条件全部满足时，全流程方案视为进入稳定状态：

1. `00-first` 已能稳定维护 runtime 真源与 docs 投影视图
2. `dispatcher` / `resume` / `init readiness` / `change-detector` 已统一基于 runtime 真源
3. `00-onboarding / 01-init / 13-orchestrate` 已理解背景状态
4. `03-spec / 04-design / 07-code / 12-verify` 已读取对应 stage view
5. `14-status / 15-doctor / 21-analyze` 已把背景质量纳入治理
6. 降级不是隐式发生，而是通过 `background_input_status` 被显式记录
