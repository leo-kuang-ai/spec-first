---
title: Skill 流转系统审查整改闭环记录（SF-28～SF-35）
doc_role: remediation-execution-record
date: 2026-07-26
status: current-worktree-verified
origin_report: docs/项目审查/2026-07-26-skill-flow-system-audit-refresh/review-report.md
origin_issue_list: docs/项目审查/2026-07-26-skill-flow-system-audit-refresh/optimization-issues.md
baseline_head: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
evidence_status: verified-with-limitations
---

# Skill 流转系统审查整改闭环记录（SF-28～SF-35）

## 结论

本记录不改写原审查快照：`review-report.md`、`optimization-issues.md` 与 `evidence/edge-ledger.md` 仍描述 `d939ee3c` 校准点发现问题时的事实。本记录只声明当前工作树中的 source-first 整改状态。

SF-28～SF-35 的机制与对应 source consumer 已逐项闭环；五宿主 sandbox `init` 已验证 LFG package-local fingerprint helper 的路径、执行与 `.spec-first/workflows/` ignore 依赖。真实宿主 clean-session loader、真实 LFG 全流程和 field outcome 未执行，因此不得把当前证据扩张为现场采用或真实交付结果。

## Finding disposition

| Finding | 当前处置 | Source owner / 关闭证据 |
| --- | --- | --- |
| SF-28 | closed-current-worktree | `skills/spec-lfg/SKILL.md` 改用当前 skill 的 `SKILL_DIR/scripts/working-tree-fingerprint.cjs`；`skills/spec-lfg/scripts/working-tree-fingerprint.cjs` 与 canonical spec-work helper byte-identical；unit projection contract 与五宿主 sandbox init integration 通过。 |
| SF-29 | closed-current-worktree | `skills/spec-work/SKILL.md` 明确 non-behavior return 在 helper 可运行时仍返回 fingerprint；`skills/spec-lfg/SKILL.md` 只接受带文档记录的 deliberate non-behavior exception，两侧期待一致。 |
| SF-30 | closed-current-worktree | producer 使用 `fingerprint-helper-unavailable` blocker 并携带具体原因；`shipping-workflow.md` 明确在 A-D closeout 后、return envelope 前捕获 fingerprint；LFG 写明修复后从 fresh pre-capture 重入 6.5。 |
| SF-31 | closed-current-worktree | LFG failure branch 明确区分 managed `.gitignore` 缺失与真实 verification staleness；sandbox integration 实际写入 ignored verification summary，并证明五宿主 helper fingerprint 均保持不变。 |
| SF-32 | closed-current-worktree | `docs/contracts/source-runtime-customization-boundary.md` 明确 `.agents/skills/source-command-spec-*/` 是 host-generated legacy migration output，spec-first 没有该 namespace generator，只做 managed ignore/runtime-untrack 防护。 |
| SF-33 | closed-current-worktree | `scripts/run-test-suite.cjs` 在 `tests/integration` 缺失时 load-safe 返回空 inventory，只有实际请求 integration suite 时结构化失败；packaged-style require test 与 npm pack 内容检查通过。 |
| SF-34 | closed-current-worktree | README 双语均改为 token-driven mutation：普通 review 默认 report-only，只有 producer 显式 `mutation:apply-fixes` 才授权 Markdown 有界写入，HTML 始终 report-only。 |
| SF-35 | closed-current-worktree | `skills/spec-work/SKILL.md` 将无 unified contract 但携带 `active` / `in_progress` / `completed` / `done` 的 artifact 也判为 invalid readiness，停止并要求 plan repair，不再进入 legacy code lifecycle。 |

## SF-35 补充 finding contract

原 `edge-ledger.md` 在 fresh-source 场景 S3 后只把 SF-35 写入 review/issue summary，没有追加完整 finding contract。本记录补齐关闭验收所需合同，但不回写历史 evidence：

```text
finding_id: SF-35
scope: spec-work Phase 0 artifact readiness intake
claim: progress-like artifact_readiness guard 仅位于 spec-unified-plan/v1 分支时，无 contract 声明但携带 artifact_readiness: active/in_progress/completed/done 的计划会被 legacy fallback 放入 code lifecycle。
severity: P3
source_owner: skills/spec-work/SKILL.md
closure_condition: progress-like readiness 在是否声明 unified contract 两种输入形态下均 fail closed，并有 source contract test 锁定。
invalidation_condition: 明确裁决 legacy artifact 可以使用 progress state 充当 implementation readiness，且所有 consumer 同步采用该语义。
current_status: closed-current-worktree
```

## 验证证据

- `cmp -s skills/spec-work/scripts/working-tree-fingerprint.cjs skills/spec-lfg/scripts/working-tree-fingerprint.cjs`：通过。
- SF 聚焦回归：7 suites / 53 tests 通过，包含五宿主 sandbox init、helper 执行、managed workflow summary ignore 与 fingerprint 稳定性。
- 多 Agent fresh-source eval：最终状态 `passed`，当前磁盘 source 的 SF-28～SF-35 mechanism、历史快照/当前闭环分离、SF-35 合同、active queue 指针、CHANGELOG 与未 landing 边界均通过；首次 reviewer 提出的关闭记录缺失和队列漂移 concern 已由本记录及索引更新关闭。
- `npm test`：145 个 unit suites / 1457 tests、smoke 5/5、integration 11 suites / 37 tests 通过；另 1 个 conditional suite / 2 tests 按既有条件跳过。
- `npm run typecheck`：188 files；`npm run lint:skill-entrypoints`：313 files；`npm run build`：688 files；`git diff --check HEAD`：通过。

## 边界与 landing 提醒

- Source-of-truth 修改只位于 `skills/`、`src/`、`scripts/`、`docs/`、README 与 tests；未手改 generated runtime mirrors。
- `tests/integration/spec-lfg-fingerprint-projection.integration.test.js` 当前是工作树中的新增 source test，最终 landing 必须与 package-local helper 和 workflow contract 一起纳入；本记录不把未授权 commit/push/PR 伪装为已 landing。
- 五宿主证据来自临时 sandbox `spec-first init` 和 helper 直接执行，不证明真实宿主 loader 会在 clean session 中正确执行 prose，也不证明真实 LFG pipeline、commit、push、PR 或 field outcome。
