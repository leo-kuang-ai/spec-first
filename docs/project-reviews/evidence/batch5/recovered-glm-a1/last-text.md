全部收尾完成。以下为 Return-to-Caller 结构化交接信封。

## 执行结果：`status: complete`

**plan_path**: `docs/plans/cancel-invoice.md`（legacy active 代码计划，`mode:return-to-caller`）
**task_pack_path**: `null`（非 task-pack 输入）

### 已完成范围（对照计划 4 个步骤）

1. **语义确认**：`withTx` 延迟写并在提交时 `audit.flush`；`refund.js` 模式为 tx 外 guard → tx 内 `update` + `audit.record`；`m17.isSettled` 仅认 `paid`；CSV/日报只读 `payments` 表。
2. **实现**：
   - `src/invoices/cancel.js`（新）：`cancelInvoice(id)` — 不存在抛 `code:'not_found'`；paid/refunded 抛 `code:'invalid_state'`；已 cancelled 幂等直接返回（不写审计）；open 经 `withTx` 置 `cancelled` 并记 `invoice.cancel`。返回 `{id, status:'cancelled'}`。
   - `src/http/routes.js`（+9 行）：`POST /invoices/:id/cancel` → 200+body；局部 `code→status` 映射（404/409），无 code 错误仍走 500，既有 201/404 路径未动。
3. **测试**：`test/cancel.test.js`（新，6 个用例）：首次取消（金额/客户/明细不变、审计恰一次）、重复取消幂等（审计仍恰一次）、paid/refunded 拒绝且状态不变、404、真实 HTTP 入口全状态码、既有路由+m17 回归。
4. **diff 检查**：仅上述 3 个文件；`.claude/`（预先存在，未触碰）；`.spec-first/` 为收尾证据目录。

### 真实测试结果（本 run 实际执行）

| 命令 | 结果 | 退出码 |
|---|---|---|
| `node --test test/cancel.test.js` | 6/6 通过（实现前观察到 RED：模块缺失整文件失败） | 0 |
| `npm run test`（全量） | 11/11 通过，含 5 个既有测试文件，零回归 | 0 |

**verification_run_summary_ref**: `.spec-first/workflows/spec-work/skill-up-1683835751/run-20261102-091653-cancel-13004/verification-run-summary.json`
**honest_closeout_verdict**: `verified`（`all-claims-consistent`，两项 validation claim 一致）
**verified_worktree_fingerprint**: `sha256:9de703285b51c16217244c2dafd78ba9b2a6fd300bc96063352e2e47669b1187`（HEAD `bb7a5fa`，dirty）
**run_artifact_path**: `null`（`no-trigger-matched`：非 task-pack、无 not-run、无 deferred、无实质上下文损失成本）

### verification_evidence（唯一行为承载单元：取消领域函数 + 路由）

`behavior_changed: true`；现有测试已查（`test/invoices.test.js`、`test/form.test.js`）；新增 `test/cancel.test.js`；RED 在生产代码写入前实际观察；无异常豁免。

### 未完成项 / 边界（如实报告）

- **独立 code review 未运行**（`spec-code-review`）——本模式归调用者所有；已做内联人工 diff 扫描替代，无遗留可执行发现。
- **lint 未运行**——仓库无 lint script（`package.json` 仅 `test`），非计划必需项。
- **覆盖边界**——HTTP 验证经 `handle()` 单元级分派；仓库无真实 HTTP server，无更上层集成可跑。
- **u_ids/task_ids**：计划未定义 U-ID/Task Card，按计划 4 步骤记账，未发明 ID。

**commit_authorization: missing / landing_authorization: missing** —— 遵你要求未提交、未推送；变更保留在工作树（逻辑提交候选：上述 3 文件）。未访问真实项目/用户配置，未调用外部服务（仅本地 `spec-first` CLI 与 node）。
**plan_status_completion_candidate**: `null`（`legacy-plan-lifecycle-degraded`：计划自declared 无 unified contract 的未托管 legacy 格式）；计划 `status: active` 未动。
**blockers**: 无。**standalone_shipping_skipped: true** —— simplify/审查/lifecycle/landing 由你持有。
