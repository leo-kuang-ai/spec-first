---
artifact_type: repair-report
updated_at: 2026-09-21
source_head: 36d19d95c3a79df2d1278083c959bb34eadbde8c
worktree_state: dirty
status: repairs-complete-regression-degraded
claim_ceiling: source-contract-and-local-fixture
---

# 周期 1：8 项问题修复报告

> 后续更新：用户继续授权处理回归残留后，两项 CE unit 失败与 TSV 格式问题已修复，完整 `npm test` exit 0（3088 通过 / 2 条件跳过）。以下原阶段的 failed/degraded 与回执保留为历史，最新状态见 [剩余回归修复报告](2026-09-21-residual-regression-report.md)。历史 CE current binding 仍 stale，未重签语义证据。

8 项原问题已逐项完成源码或合同修复并更新为 `fixed`。fresh-source 复核发现的 2 项相关缺口也已修复；最终本地回归仍有 2 项 CE 清单/旧快照一致性失败，未达到全仓全绿；本轮 8 项定向验证与 fresh-source 复核已完成。当前周期整体仍为 `partial`，不能从源码与 fixture 推导真实宿主、模型、GUI workflow、远端 PR 或 field/comparator 通过。

## 范围与授权

用户在问题列表后明确要求逐项修复、验证并持续完成。本阶段由 `spec-debug` 承接，覆盖本轮 8 项及相关复核缺口。原审查 B4 冻结记录保留；不倒写原始审查时点已包含修复授权。仅修改 canonical source、tests 与证据文档，不手改 generated runtime。没有执行宿主投射刷新、付费模型、远端 PR 写入、commit 或 push。

开始时工作树已 dirty，包括入口路由、eval 与暂存迁移；本轮保留其他任务的 index/内容。baseline 和 source hashes 见 [baseline.json](baseline.json)。当前修复字节绑定 [final-source-manifest.json](final-source-manifest.json)，它覆盖 22 个 source/test 文件，不等于全仓冻结。

## 逐项结果

| ID | 修复结果 | 主要验证 |
| --- | --- | --- |
| C1-PRFEEDBACK-001 | 已修复：取消按失败文件是否修改推断历史失败；要求同命令可比基线/因果证据，required red 阻断 commit/push | 旧合同 1 红；归因合同回归通过，fresh-source 跨 consumer 场景复核 |
| C1-PRFEEDBACK-002 | 已修复：blocked 仍报告实际残留修改，父级独立对账 tracked/index/task-owned untracked，不依赖空清单跳过验证 | 旧合同 1 红；full/targeted/pipeline producer-consumer 回归通过 |
| C1-COMMITPR-001 | 已修复：移除 checkout collision 自动全仓 stash/pop；保留现场并返回有界恢复选项 | 真实临时 Git 验证部分暂存、无关 staged、untracked、branch 与 stash 保持，3 项通过 |
| C1-CR-01 | 已修复：从真实 PR base repo 获取 refs/pull/N/head 并核对 headRefOid；传递不可变 SHA，混合快照阻断 | 本地同名 fork/同仓正例/SHA mismatch，3 项通过 |
| C1-CR-02 | 已修复：snapshot v2 绑定显式 included 集合、存在性、字节摘要与 mode，verify 复用冻结集合，v1 拒绝 | 增/改/删/转 staged/范围外对照/软链/目录；追加 malformed/count/UTF8 拒绝 |
| C1-U9-RUNTIME-001 | 已修复：bare 纳入 projection 写前 gate；父目录诊断提前分流，仍保留 target 与 host authority | missing/stale 两反例红→绿，零字节副作用；current 进入既有 baseline mutation 路径 |
| C1-U9-RUNTIME-002 | 已修复：保留父目录 bare/check 只诊断；明确显式安装/图 mode 才对子仓 batch | bare、bare --all-repos、check 均缺 child projection 仍诊断，workspace/home 无写入、无 provider 调用 |
| C1-U9-RUNTIME-003 | 已修复：单仓与多仓计划共用建议，installation 显式 installation-only，artifact 显式 only selected_ids | 多仓建议旧 3 红→绿；8 组 plan/apply selection、target、requirement、repair、refresh 等价 |

第 7 项原 acceptance 预想验证逐仓 mutation。本次产品裁决选择纠正文案并保留既有安全默认，不扩大父目录 bare 权限；通过显式 batch 现有回归覆盖有写入路径。第 8 项不反转单项目 bare 完整 artifact baseline，也不把普通 plan/verify 的 installation 成功写成图验证完成。

## fresh-source 复核与补强

[出口复核](fresh-source-exit-review.md) 与 [Runtime 复核](fresh-source-runtime-review.md) 直接读取当时磁盘 source，记录 SHA-256。它们由已有上下文的通用 reviewer 完成，不是盲评、exact-host invocation 或真实模型端到端 eval。

出口复核发现并随后关闭：

- FSR-EXIT-001：仅限定 git add 范围仍会让裸 git commit 夹带无关 index。现在完整检查暂存区，非本轮或未知 hunk 阻断提交；不自动 unstage/stash/reset；commit 后复核实际 diff 再允许 push。
- FSR-EXIT-002：snapshot v2 非法字段可能崩溃或伪造无修改。现在校验固定 SHA、字段类型、文件计数、included facts，解码/格式错误返回结构化 unknown。

两项回归先获得 2 failed / 30 passed，再修复至 32 passed；reviewer 增量回读源码、日志及纯内存探针后关闭。它们属于原修复边界的补强，原审查 8 项计数不变，不把新发现偷偷混入原冻结分母。

## 验证与证据边界

所有命令、时间、退出码及原始日志见 [checks.jsonl](checks.jsonl)。红色日志为修复前反例，不是最终通过；第 6 项保留初版夹具断言不适用的失败，并以 refined 旧实现两红/正例通过及修复后检查作为证据。

- `npm run test:mcp-setup`：33 suites / 761 tests 通过。
- `npm run typecheck`：268 文件通过；`npm run lint:skill-entrypoints`：495 文件通过。
- instruction sync、shared references 和 CHANGELOG 合同均通过。
- 全仓 `git diff --check` 检出并行任务 `docs/validation/skill-evals/results.tsv` 的三条空 TSV 行尾 tab；该文件不属于本轮 source manifest，本轮未修改。不能将全仓 whitespace 检查声称为通过。
- `npm test`：unit 为 237 suites / 2996 tests 通过，2 suites / 2 tests 失败；主链在 unit 失败处终止。
- 随后独立执行 `npm run test:smoke`：1 suite / 5 tests 通过；`npm run test:integration`：17 suites / 84 tests 通过，1 suite / 2 tests 跳过。跳过项属于需显式 `SPEC_FIRST_REAL_GRAPHIFY_DOGFOOD=1` 的真实 Graphify dogfood，本轮未启用。
- 最终四个出口 owner 聚焦回归：4 suites / 38 tests 通过；本轮 22 个 source/test hashes 稳定、8 项账本状态与全部 repair evidence 可解析；15 份 Markdown 的 58 个相对链接文件目标通过，未校验锚点。

两个 unit 失败为 `ce-localization-review-contracts.test.js` 与 `ce-localization-closeout-contracts.test.js`。只读 [CE 清单差异](ce-topology-delta.json) 确认包文件由 1129 变为 1147（67 增 / 49 删；主要是其他任务的 eval 迁移与新增），这些增删不在本轮 22 个 source/test 文件集合。本轮新增 PR-head 回归另使 direct-support 从 228 paths / 446 relations 变为 229 / 447；这是本轮对全仓审查快照的真实影响，不能称所有差异均为历史失败。

完整回归和全仓 whitespace 仍为 failed，不豁免 required check，不建议 commit/push。最小后续动作是由 CE 证据 owner 按 `ce-topology-delta.json` 对齐当前 inventory、support 与审查覆盖链，实际复核新增/迁移路径后更新合同，再重跑失败套件；不能只替换数字或伪造原审查已覆盖。TSV 由该评测记录 owner 修正拆行。未在本轮范围内重写历史 CE 审查结论或其他任务日志。

[质量复核](post-fix-quality.md) 限本轮 source/test 与窄 patch，未为简化删除安全检查。snapshot 是前后采样，不承诺对抗性文件系统的原子一致；planExecutionAdvice 是供调用方消费的文本建议，不是自动 apply gate；PR/commit prose 约定不等于宿主强制执行。

## 历史快照与恢复

[原账本](finding-ledger-before-repairs.json) 与 U9 receipts、source-stability、copy-integrity、receipt-consistency、final-checks 均保留原审查时点。当前 [问题账本](../u9/finding-ledger.json) 的 status/repair 反映修复，原 source_hashes 仍是问题确认时点。修复后新哈希单列，不回写旧 receipt 为 passed。

snapshot schema 从 v1 到 v2；旧快照必须在 reviewer 执行前重新生成，不可将修复后的 hash 当作旧基线。真实宿主若仍加载旧投射，这些源码修复尚未生效；后续投射维护需按 source-first 使用 `spec-first init`，不能手改镜像。本轮不刷新用户宿主环境。


## 结构化关闭结果

- `verification_run_summary_ref`：`.spec-first/workflows/spec-debug/spec-first/cycle1-eight-fixes-20260921/verification-run-summary.json`，可归档副本见 [verification-run-summary.json](verification-run-summary.json)，执行入口回执见 [verification-record-result.json](verification-record-result.json)。原反例、regression 与 broader 的分类见 [check-categories.json](check-categories.json)。
- `honest_closeout_verdict`：`degraded`，`overall_reason_code=degraded-claim`，由 [实际 validator 回执](honest-closeout-result.json) 确认。通过子集因全摘要包含失败/未运行项而返回 `run-summary-checks-uncovered`；失败/未运行 claim 为 `validation-not-verified`。这不是全仓 verified-fix 或发布准入。
- 诊断与修复：8 项根因分别落在 failure attribution、delta consumer、index recovery、PR identity、snapshot、projection gate 与 mode/scope 边界；对应修复与反例见上表。原报告状态 `fixed` 仅表示本轮问题定向修复，不提升整个周期状态。
- 防回归：Git 临时仓、实际 Python/Node CLI、完整 runtime suite、unit/smoke/integration 加 fresh-source 复核。字符串合同与只读语义 review 不替代真实模型执行效果。
- Post-fix quality：仅本轮 fix-owned scope；重叠入口跳过全文件自动 simplify，三视角 inline 审视无额外重构，出口与 runtime fresh-source 复核完成；两个复核 finding 已修，广域回归残留见 [residuals](broader-regression-residuals.json)。
- 交付：源码与证据保留在当前 dirty 工作树；未提交、推送、发布或刷新真实宿主 runtime。本轮临时采集器已持久化为 [check-command.py](check-command.py)；修复前本轮文件备份已压缩保留为 `before-fix-owned-source.tar.gz` 并逐字节校验，临时目录已清理。
