# Stage 4 — spec-code-review（report-only，mode:agent）

- 会话：独立 `claude -p`，模型 `glm-5.3`；临时仓库根 `/tmp/sup-phase5-20261112-101028/repo`
- 调用参数：`mode:agent base:9a29966 plan:docs/plans/2026-11-12-001-feat-entry-by-id-plan.md`
- prompt：`stage-4-prompt.txt`；原始流：`stage-4.jsonl.gz`；stderr：`stage-4.stderr`
- 退出码：0；`subtype: success`；`is_error: false`；turns 28；成本 `$0.02746592`；时长 511.1s
- 工具使用（27 次）：`Read`、`Bash`、`Glob`、`Write`

## 结果（机器可读）

| 字段 | 值 |
| --- | --- |
| `status` | `degraded` |
| `verdict` | `Not ready` |
| `mutation_policy` | `report-only` |
| `commit_authorization` | `missing` |
| `findings` / `actionable_findings` | `[]` / `[]` |
| `reviewers` | `["inline-fallback"]` |
| `coverage.dispatch_reason_code` | `dispatch_authorization_missing` |
| `coverage.scenario_capability` | `fallback-only` |
| `run_id` | `scr-20261112-0300-8c4f2e` |
| artifact | 会话写入 `/tmp/spec-first/spec-code-review/scr-20261112-0300-8c4f2e/review.json`，已归档到 `artifacts/spec-code-review/scr-20261112-0300-8c4f2e/` |

- 需求桩核对：R1-R4 与 U1-U3 全部 `met`，逐条附 `src/server.js` / `test/server.test.js` 行号证据；`reverse_requirement_check` 未发现计划外新增可观察行为。
- 残留风险（`residual_risks`）：
  1. `src/server.js` POST 分支 `JSON.parse` 未捕获异常为**基线既有**问题，本 diff 未扩大暴露；
  2. 测试实际要求 Node `>= 18.2`（`closeAllConnections`），计划 A4 写 `>= 18`，比实际下限宽；
  3. `package.json` 仍为 `0.1.0`，而 CHANGELOG 记 `v0.2.0`（CHANGELOG 为 untracked，超出冻结 tracked diff）。
- `testing_gaps`：10 个用例共享同一 server 与内存 entries，依赖文件内顺序执行；`--test-name-pattern` 选择性运行或并发时会失败。
- `verification_evidence.status: degraded`，`reason_code: verification-summary-record-unavailable`：spec-first verification CLI 探测被权限拒绝；CLI 冒烟未在本阶段执行。
- 自述限制：无 persona / validator / cross-model 独立覆盖；inline 降级合同规定即使零发现也判 `degraded`，不得声明可合并。

## 本阶段观测到的偏差

1. **外部写入（临时仓库外）**：`spec-code-review` 按技能默认把运行产物写到 `${TMPDIR}/spec-first/spec-code-review/<run-id>/`，本次落在 `/tmp/spec-first/…`。该路径是宿主临时目录下的技能自带 artifact sink，不是 spec-first managed 配置面，也不在用户持久化目录；按 U17 中“临时根之外出现本任务写入”的字面停止条件属于触发项，处置见 `report.md` 的停止条件说明。
2. **权限拒绝**：`Bash` 复合命令（含 `mktemp`/`jot` 等未列入 allowlist 的片段）被拒，导致 `run-scope`/`mutation-guard` 确定性脚本未运行，技能据此判 `degraded` 并显式声明。这是 allowlist 与技能默认命令面不匹配造成的能力缺口，不是被测合同缺陷。
3. 审查以 `git add -N test/server.test.js` 为前提（仅索引标记，不落库），否则新增测试文件会被“只审 tracked 变更”规则排除；该步骤在会话前由操作者执行，已记入 setup 侧条件。
