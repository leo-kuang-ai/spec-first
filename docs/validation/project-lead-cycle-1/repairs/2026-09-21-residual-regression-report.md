---
artifact_type: repair-report
updated_at: 2026-09-21
status: completed-local-regression
claim_ceiling: local-regression-and-historical-integrity
---

# 剩余回归问题修复

本报告续接 [8 项修复报告](2026-09-21-repair-report.md)。用户继续授权处理上轮 CE 两项 unit 失败与 TSV 格式失败；原 8 项源码修复保持不变。本轮修改两份测试、一份运行手册及 TSV 三条拆行，不改 CE producer/current gate，不重签历史语义审查或裁决记录，不修改 generated runtime。

## CE 根因与修复

历史 inventory 有 1129 包路径，当前数量持续随其他任务新增评测资产变化。旧 unit 要求实时数量等于历史数字，因此合法新增也失败；计数本身又不能检测同数量换路径或内容漂移。

只读复核证实：历史 closeout 对其 recorded inventory/coverage 为 valid，对当前 source 为 invalid。这是证据适用范围不同，不应通过不断替换历史计数或批量重绑 verdict 消除。

本轮将验证责任分开：

- 当前 producer：独立 Git 源枚举精确比对 package 文件集合，核验 owner、SHA-256、字节、关系去重/计数，并反向核对 governance、命令模板、测试显式引用、Markdown 中现存的源码 root 引用。保留具体跨 owner 关系样例。后续复核补上整条关系丢失的负例敏感度。
- 历史证据：在 recorded binding 下验证闭环；防篡改负例从该有效基线开始，新增数量不变但 source hash 漂移仍拒绝的场景。共享路径未审关系、缺 semantic delta、旧 upstream 裁决及无 field 的 knowledge promotion 仍拒绝。
- 当前 CE 完成声明：继续由 `node scripts/check-ce-localization-review.cjs --verify-closeout` 严格校验。实际执行仍 exit 1/stale；不是本轮普通回归的通过结果，也未宣称当前源码已完成 CE 语义审查。

[运行手册](../../../contracts/workflows/ce-localization-regeneration-sequence.md) 同步明确以上分层；显式刷新批次仍要求真实 source-bound delta 与 owner adjudication。

## TSV 修复

三条 `full_test` 被换行拆出了 `eval_mode` 列。仅还原到各自前行，不修改已有评分、结论或随后追加记录。修复时 79 行均为 9 列，全仓 `git diff --check` 通过，见 [校验](tsv-repair-verification.json)。

## 验证与复核

命令及原始日志见 [checks.jsonl](checks.jsonl)。本轮修改前 CE 为 2 failed / 14 passed；职责修复后两份合同为 17 passed。显式 current gate 持续拒绝 stale。补强后的 17 项合同仍全部通过。reviewer 内存删除 explicit-source-ref、template-owner、非同名测试显式引用三类关系，当前测试均能检出；不声称覆盖每种 parser 语法或语义完整性。`23-current-gate-negative` 验证实际 CLI exit 1/stale 且历史证据逐字节未变；该负例通过不意味着 current CE closeout 通过。全套 `npm test` exit 0：239 个 unit suites / 2999 tests，smoke 5 tests，integration 17 suites / 84 tests 通过；1 suite / 2 tests 为显式 opt-in 的真实 Graphify dogfood，按既有条件跳过。全套执行期间追加的关系断言另由 `22-ce-strengthened` 针对最终文件重跑通过，不用早期读入的测试内容冒充最终断言验证。

[只读复核与增量结果](ce-residual-review.md) 给出方法、source hashes、历史/current 对照及防漂移反例。它是源码/测试审查，不是独立模型行为评测。修复前内容见 [residual-baseline.json](residual-baseline.json)，当前文件 hashes 见 [residual-source-manifest.json](residual-source-manifest.json)。

## 仍然不支持的声明

本轮可以证明普通回归机制与历史证据内部完整性，不能证明历史 CE 审查覆盖当前源码。`--verify-closeout` 的 stale 仍是真实状态，后续若要声明当前 CE 完成，必须实际复核新增、变更和退役关系并形成新批次证据。真实宿主/GUI invocation、模型、Graphify dogfood、field/comparator 未在本轮执行。未提交、推送或刷新真实宿主 runtime。


## 最终收口

- 全套回归：`20-full-regression`，exit 0；累计 3088 项通过、2 项条件跳过。后续关系补强最终聚焦回归 17/17 通过。
- `typecheck` 270 文件、entrypoint lint 497 文件、CHANGELOG 5 项和全仓 `git diff --check` 通过。
- 原 8 项修复文件哈希无漂移；本轮 CE 测试/手册/TSV 哈希另记。124 份历史 CE 文件不变；既有清单与语义记录未被“刷新为通过”。
- `broader-regression-residuals.json` 两项均 `fixed`；当前 CE 适用性仍 `stale-not-refreshed`，两种状态不混同。
- 质量尾：仅本轮四文件窄改；修改主要为合同测试与文档，不进行无关 simplify。fresh-source 复核发现的支撑关系漏检已修正并用三类删关系反例验证。
- 尚未提交、推送或刷新真实宿主 runtime。


结构化验证：`verification_run_summary_ref=.spec-first/workflows/spec-debug/spec-first/cycle1-residual-regression-20260921/verification-run-summary.json`，归档副本见 [residual-verification-summary.json](residual-verification-summary.json)。[honest-closeout 实际结果](residual-closeout-result.json) 为 `verified / all-claims-consistent`，仅覆盖本次本地回归与 stale 拒绝负例。它不声称 `--verify-closeout` 对当前源码通过；原命令 exit 1 保留在 `19-ce-current-gate` 日志，且 Graphify dogfood 的 2 个条件跳过不被升级为实测。上一阶段 `degraded` 回执原样保存。
