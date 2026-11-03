# Phase 0 任务选择记录

**选择日期**：2026-11-03
**时间范围**：2026-09-12 至 2026-11-02（最近 ~7 周，符合"最近 1-2 个月"）
**选择原则**：证据优先（试点调整 #3）——只选有 artifact 证据（plan/validation 文档、多提交链、任务 ID 链）的真实任务；配额不足时如实降配并记录。

## 选择的任务（9 个全量追踪 + 1 个嵌入事件）

| ID | 类型 | 任务 | 时间 | 主证据 |
|---|---|---|---|---|
| T01 | 小功能开发 | onboarding 与 workflow 路由体验 | 10-08→10-26 | plan 文档 + validation 目录 + PR #57 + 4 提交（复用试点追踪） |
| T02 | 小功能开发 | runtime-setup 八宿主隔离初始化验证 + SIGINT 重入探针 | 09-12 | bb4f0219/1502a75c + validation 记录 |
| T03 | 小功能开发 | evals S1 fail-closed 用例落地（含 HOME-redirect 技术） | 09-22 | 13386f02/09677f4e + evals 方案文档 |
| T04 | 跨模块需求 | 研发链路 Skill 专业能力审查（22 对象）与 21 项修复 | 11-01→11-02 | 需求 556 行/调研 R1-R30/方案/报告/repair-workflow + ~28 提交 |
| T05 | 跨模块需求 | runtime-setup P123 收口（八宿主） | 09-12 | 3c04708c 链 + docs/validation/runtime-setup-p123/ |
| T06 | 缺陷修复 | audit FSA2/FSA3 修复与证据链 | 09-14→09-18 | 876b5c22/66b0e0c6/36d19d95 + full-system-audit 文档 |
| T07 | 缺陷修复 | routing S5 入口归属裁决与三专家复核收尾 | 10-09→10-26 | 59cb4cb1 + v2-routing-zcode-followup.json（与 T01 收口关联，边界见各自追踪） |
| T10 | 跨会话续做 | CE upstream sync（方案冻结→跨 5 天执行→批量提交） | 10-27→11-01 | fe81bae9 + .agents/tasks/ 两份 + 049e5274 |
| T11 | 跨会话续做 | TASK-CE-FSA3-001→003 证据链收口 | 09-21→09-24 | 5 个带任务 ID 提交 + validation 证据 |

## 配额缺口（如实记录）

- **PR 反馈处理 0/2**：窗口内无独立 PR 反馈处理任务。本仓库审查回路发生在会话内（三角色/独立 reviewer），先审后提；GitHub PR 仅 main→master 同步与 dependabot。唯一 PR 反馈事件 = PR #57 首次 CI 阻断（嵌入 T01 追踪的 FP-CICD-1，含本地复现+正负例修复）。
- **影响**：`spec-resolve-pr-feedback` skill 在窗口内零真实使用证据；该场景的 Layer 1 结论将标"无数据"，不做推断。

## 类型覆盖说明

- 窗口内工作负载本身偏向 docs/plan/review/validation 型任务（harness 项目性质），"小功能开发"以验证能力/eval 用例落地等真实小交付填充，不虚构产品功能任务。
- 跨会话判断依据：方案冻结与执行提交跨日（≥1 天间隔）且有续做记录（.agents/tasks/、任务 ID 链）。

## 与执行台账（38 项）的关系

本选择服务 Layer 3/Layer 2 取证；执行台账的 38 项源码清点是 Layer 1 范围输入，两者在 Phase 0 报告中合并归因，不混用计数。
