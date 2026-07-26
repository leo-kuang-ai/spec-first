---
title: 验证记录（确定性命令、语义场景、反证与 claim ceiling）
doc_role: audit-evidence
review_date: 2026-07-26
status: review-evidence-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/README.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# 验证记录

## 快照

- **HEAD：** `d939ee3c`（branch `leo-2026-07-16-plan-update`，package v1.13.2，提交日期 2026-07-22）。
- **上一校准点：** `27baf79f`（07-18 批次，P0-P3 全零，无 overlay）。
- **本轮未裁决增量：** `af53aacb` + `d939ee3c` 两个提交（30 个 skills/contracts/CLI source 文件 +745/-165、3 个新 CI workflow、5 个 source-command runtime mirror 删除、约 22 个测试文件新增/同步）。`af53aacb` 的 CHANGELOG 条目自述为「分支 full review 的 10 P1 + 5 P2 + 3 validator residual 整改」。
- **工作树 overlay：** 6 个 docs-only 路径（2 份 2026-07-26 审查报告、审查 README、CHANGELOG staged；docs/03、docs/12 两处未暂存编辑），与 skills/、src/、templates/ 零重叠。skill-flow 事实全部锚定 HEAD 提交内容。
- **Active plans：** docs/plans/ 最新 8 份均为 completed/superseded；无与本审查并行的 active 代码计划。

## 确定性验证（全部在 HEAD 工作树实际执行）

| 命令 | 结果 |
| --- | --- |
| `npm run lint:skill-entrypoints` | 通过（313 files scanned）——public roster 与入口治理一致，internal helper 未入用户路由面 |
| `npm run typecheck` | 通过（187 files checked） |
| `npm run test:eval-fixtures` | 通过（6 suites / 78 tests） |
| focused Jest：delta 涉及的全部 22 个 unit 契约套件（ci-required-producers、npm-cli-resolver、skill-flow-audit-provenance、spec-riffrec-analyzer-safety、spec-work-working-tree-fingerprint、gitignore-policy、mcp-setup-providers、mcp-setup-workspace-async-refresh/child-hook/git-exclude、mutation-authority、plugin-modules、run-test-suite、runtime-untrack、spec-code-review、spec-doc-review、spec-lfg、spec-riffrec-feedback-analysis、spec-work、spec-work-shipping、spec-write-skill、using-spec-first） | 通过（22 suites / 236 tests） |
| `npx jest tests/integration/doc-review-five-host-projection… init-five-host-lifecycle…` | 通过（2 suites / 21 tests）——五宿主投射与 fresh init 生命周期 |
| `diff -q` riffrec vs sweep 分析器 | byte-identical（SF-22 parity 保持） |
| `git ls-remote --symref github HEAD` | `refs/heads/master`——用于反证 badge 候选 |

未升级到 `npm test` 全量 / smoke / build：本轮存活 finding（SF-28 等）均为 prose/projection 合同问题，全量套件不增加对应证据；`af53aacb` 提交时的完整验证记录见其 CHANGELOG 条目。

## 语义场景（6 类，fresh-source evaluation）

执行方式：6 个全新隔离上下文 subagent，各自只读点名的当前磁盘 source 文件（禁读 runtime mirror 与历史审查），对受控输入回答「按字面合同接下来发生什么」。会话已由用户显式开启多 agent 编排（ultracode），dispatch 授权在位；证据等级为 **fresh-source semantic scenario**（受控输入下的 source 级语义行为），不证明宿主 loader 或 field outcome。

| # | 场景 | 结果 | 关键观测 |
| --- | --- | --- | --- |
| S1 | 相邻入口判别（模糊想法 / brownfield PRD / HOW 未定 / 单文件低风险修复） | 符合预期 | 四例分别路由 `spec-ideate`、`spec-prd`、`spec-plan`、Direct Lane，均给出「为何不是相邻入口」与 route-not-exit 边界；确认不自动串联 |
| S2 | Product blocker 回流（验收 AE2 需新增子系统） | 符合预期 | 停在首次 durable mutation 前；WHAT 归 Product Contract/用户、HOW 归 spec-plan；return-to-caller 变体返回 `status: blocked` envelope；观测到 4 处 wording 两读（见下） |
| S3 | Artifact readiness 分诊（requirements-only / knowledge-work / task-pack / implementation-ready / active） | 符合预期 + 1 缺口 | 五例分诊正确；**发现 progress-like guard 只嵌在 unified-contract 分支内**（SF-35） |
| S4 | LFG 6.5 gate 在目标仓（无 skills/ 源码） | **确认 SF-28** | 字面路径解析为不存在文件；无替代解析规则；不允许 git status 手工估算；helper failure → `final-verification-stale` 硬停且**无书面恢复/重入路径**；阻断 residual/lifecycle/commit/push/PR/CI |
| S5 | compound-refresh headless 授权（默认分支、无上游授权） | 符合预期 | mutation authorized / commit missing / landing missing 三元事实；Phase 5 输出 `commit_status: not-created` + reason + 路径 + 候选 message；不建 branch/PR；clean tree/可写权限/headless 不构成授权；destructive delete 仍后置 |
| S6 | doc-review mutation 默认权威（4 种调用组合） | 符合预期 | 无 token → `default-review-report-only` 零写；`apply-fixes` → `caller-requested-apply-fixes`；task-pack mandatory reason 压过 apply token；双 token fail closed `flag-conflict-or-unsupported`；delivery/json/可写性/宿主权限均不能供给授权 |

场景类映射说明：origin plan 默认第 6 类（knowledge promotion）的 promotion gate 本轮无 delta（SF-02 复核 INTACT），其授权面已由 S5 覆盖；空出的场景预算用于本轮最大的 authority delta（S6 review mutation 默认）。这是对默认场景清单的显式替换，不是遗漏。

**场景暴露的 wording 两读（记录为 observations，未达 finding 门槛）：**

- S2：scope-changing discovery 在标准模式下的 handoff 具体形态（结构化 blocker vs 口头报告）未定型；「plan owner」指代含糊；ask-once 与回流 spec-plan 的优先关系可两读；发现 blocker 后其余无依赖 unit 是否继续未明说。
- S3：requirements-only + 缺 `execution` 字段时 :64 repair 与 :67 enrichment 的先后可两读（终点同为 spec-plan）。
- S4：`final-verification-stale` 是终态还是修复后可重入未说明（并入 SF-30 处置）；fingerprint 对象字段清单不在两份 SKILL prose 中（schema 由脚本拥有，可接受）。
- S6：headless + markdown-write 下 walkthrough 之外写路径（Open Questions append）的可用性两读；Phase 0 token 校验与 run-local 变量设定的先后未写死（run 终止结果确定）。

## Pass 4 反证记录

- **badge branch=master 候选（推翻）**：远端默认分支实为 `master`，badge 与查询串正确；本地分支快照的「main 为主」推断错误。
- **dual-host README 第二事实源候选（推翻）**：变更为 4→5 宿主口径补齐，未枚举 per-skill 名单，机器可读落位仍唯一指向 governance JSON。
- **spec-plan 菜单「fixes were already applied」候选（推翻）**：该措辞仅出现在 producer 已显式传 `mutation:apply-fixes` 的流程语境内，为真。
- **SF-28 的反证尝试（未能推翻）**：查证 cursor rewriteSharedPaths 仅改写 SKILL.md 引用，不改写脚本路径；五宿主投射均保留字面 `skills/spec-work/...`；LFG 包内无脚本副本；宿主无跨 skill 路径注入规则；S4 独立复证。唯一可推翻条件（宿主 loader 级重写）无证据。

## Claim ceiling 与限制

- **current source + named consumer**：可确认 `d939ee3c` 的 declared route/consumer/authority 与 drift；docs-only overlay 不影响 skill-flow 事实。
- **focused deterministic tests**：只确认被覆盖的机械合同；全量 `npm test`/smoke/build 本轮未跑。
- **fresh-source semantic scenario**：6 场景 + 3 个隔离上下文 delta 事实采集 agent 证明受控输入下的 source 级语义行为；**planning-side delta（brainstorm/ideate/plan/doc-review/write-skill/using-spec-first 的 diff 分析）因一个采集 agent 遭遇 API 额度 403 失败，由主线程 current-source inline review 补齐**——该部分为 inline 级证据，但其结论面（token 权威模型、路由、readiness 分诊）已由 S1/S3/S6 的 fresh-source 场景独立覆盖。
- **loader_unverified**：未执行 clean-session host loader、真实宿主 menu/invocation、sandbox init 复证、field outcome；SF-28 的「目标仓不可解析」结论基于本仓五宿主投射文件的磁盘核对 + 投射机制源码阅读，未在真实目标仓实测（这是 A2 行动项的目的）。
- **CI gate 的 consumer 侧**（GitHub branch protection 是否已把三个 workflow 设为 required checks）不在仓库可见范围，producer 侧稳定性有测试锁定。
- 07-18 冻结的 165 pair 未重扫；非 delta 关系沿用其裁决。
- 本目录是 review evidence，不授权修复、commit、push、PR、plan lifecycle 或 knowledge promotion。
