# Phase -1 试点任务选择

**选择日期**：2026-11-03
**选择者**：Skill 优化项目执行者（AI agent，受 GOALS-COMMANDS.md 目标授权）

## 选择的任务

- 任务描述：首次上手（onboarding）与 workflow 路由体验优化——为首次任务提供 init/doctor 恢复建议、任务路由与快速开始文档，并落盘隔离验证记录
- PR 链接：无独立 PR（本仓库远端 PR 仅为 main→master 同步）；以分支 `feat/onboarding-workflow-routing-ux` 与 3 个提交为准
- 提交范围：
  - `78b2a3a9` docs: 落盘首次上手路由方案（含三角色审查修复）与 Prompt 适配证据修订
  - `a250a7d7` feat(onboarding): 明确首次任务路径与 workflow 路由
  - `1bb558e0` fix(release): 校验实际宿主展示并修正变更记录格式（后续返工/修正信号）
- 完成日期：2026-10-09（方案文档起于 2026-10-08）
- 关键 artifact：
  - `docs/plans/2026-10-08-001-feat-onboarding-workflow-routing-ux-plan.md`（U1–U4、Verification Contract、DoD、三角色审查 6 项修复记录）
  - `docs/validation/first-task-routing/`（quickstart、timeout-history、v2/v3 重试记录）
  - `docs/validation/skill-prompt-adaptation/spec-plan-baseline/`（基线测评资产）
  - `skills/using-spec-first/SKILL.md` 与 `references/public-route-map.md` 变更
  - `src/cli/commands/doctor.js`、`init-output.js`、`init.js`、`init-i18n.js` 变更
  - CHANGELOG.md 三条对应条目

## 选择理由

1. **完整边界**：有明确开始（2026-10-08 plan 文档）与结束（2026-10-09 三连提交），任务可闭合。
2. **中等复杂度**：横跨 docs/plans、skills、src/cli、tests 四类面，但需求单一（onboarding 路由），符合试点"不要太简单或太复杂"标准。
3. **证据类型齐全**：git 历史 + plan 文档（含 DoD 与验收条件）+ 隔离验证记录（含 timeout-history.json、v3-real-task-retry.json 等真实执行摩擦证据）+ 后续 fix 提交（可检验返工识别方法）。
4. **覆盖链路阶段**：需求 → 方案（plan）→ 实施（skills + CLI 代码）→ 验证（隔离验证记录）→ review（三角色审查修复记录）→ commit，可检验跨阶段追踪方法。

## 预期验证点

1. 能否从 Git 历史重建任务流程？
2. 能否识别 Skill 使用情况？
3. 能否记录阻力点？
4. 追踪耗时是否在 4 小时内（agent 计时口径单独记录）？

## 数据源边界声明

- 使用：本仓库 git 历史、仓库内 docs/validation 与 docs/plans artifact、CHANGELOG、分支结构。
- 不使用（未经用户单独确认）：私有 AI 会话 transcript、Slack、外部 PR 讨论。会话内证据（如用户介入次数）若无法从仓库证据推断，记为 `unknown`，不虚构。
