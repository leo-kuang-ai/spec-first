---
title: Skill 跨包关联边当前快照总账
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 247f86aeb2225641f93eb3d42f86a192e15a6d2e
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: uncommitted-sf24-sf26-p3-contract-repair
baseline_ledger: docs/项目审查/2026-07-17-skill-flow-system-audit/evidence/edge-ledger.md
expected_pairs: 165
actual_pairs: 165
overlay_pair_delta_added: 2
overlay_pair_delta_removed: 3
---

# Edge Ledger — 基线加增量的当前关系账本

## 1. 联合账本规则

07-17 ledger 对其 157 条关系记录了 trigger、payload、authority、failure、stop condition、source ref 和 provenance。本次没有复制那份 342 行的历史快照；而是用 current manifest 确认 248 个 source 文件字节未变、对 27 个修改和 3 个新增 source 文件重新提取关系候选，并把关系集合更新为 165 条。

因此，当前完整账本是：

1. [07-17 full ledger](../../2026-07-17-skill-flow-system-audit/evidence/edge-ledger.md) 中仍存在的 156 条 identity；
2. 本文件的 9 条新增 identity；
3. 本文件对触及变更 source 的 existing pair 的状态重裁决；
4. 旧 M-113 的明确 removal record。

这不是把旧 finding 当作当前事实：未变 source 的内容 hash 继承旧 source-level evidence；变更 source 的 material relationship、consumer、authority 或 failure text 必须在本页重裁决。Graph/provider output 未参与裁决。

## 2. 新增与移除 edge record

| ID | Edge / trigger | Payload / authority | Failure / stop | Provenance / verdict |
| --- | --- | --- | --- | --- |
| R-001 | `spec-brainstorm -> spec-lfg`；用户选择 disclosed autonomous path | 同一 absolute requirements-only artifact；LFG owns pipeline，不授权 arbitrary worker dispatch | 无 skill invocation primitive 时显式 degraded；LFG 自身高风险 exit gate 继续适用 | declared + focused contract；confirmed |
| R-002 | `spec-code-review -> spec-polish`；frontend diff owner boundary | 无 payload；reviewer 只报告 source risk | 不得把 visual iteration 说成已通过 | INFO/BND；confirmed |
| R-003 | `spec-code-review -> spec-test-browser`；runtime evidence boundary | 无 payload；browser owner 单独持有 runtime claim | 无 browser evidence 只限缩 review claim | INFO/BND；confirmed |
| R-004 | `spec-lfg -> spec-brainstorm`；LFG receives brainstorm artifact | reverse caller declaration；plan remains Product/Planning owner | non-software/invalid readiness stop LFG | REV；confirmed |
| R-005 | `spec-plan -> spec-dogfood`；frontend lens owner boundary | 无 automatic handoff | planning 不执行 QA/fix | BND；confirmed |
| R-006 | `spec-plan -> spec-lfg`；pipeline caller mention | reverse declaration only；plan does not gain shipping authority | invalid readiness blocks LFG | REV；confirmed |
| R-007 | `spec-plan -> spec-polish`；frontend lens owner boundary | 无 automatic handoff | planning 不执行 visual iteration | BND；confirmed |
| R-008 | `spec-plan -> spec-test-browser`；verification owner boundary | plan records verification owner，origin/server remain caller-owned | unavailable browser limits claim，非 plan completion authority | BND；confirmed |
| R-009 | `spec-work -> spec-doc-review`；shipping semantic plan check | source-plan path + before/after full-file hash; JSON report-only envelope | hash drift、invalid/incomplete envelope 或 unresolved P0/P1 block final validation | FWD; declared consumer + focused contracts；confirmed |
| R-010 | removal of old M-113 `spec-test-browser -> spec-runtime-setup` | 无 setup route；browser returns structured unsupported reason to its caller | `not_supported` is caller-visible terminal, not readiness proof | removed from current source; no inferred replacement edge |
| R-011 | `using-spec-first -> spec-resolve-pr-feedback`；用户明确要求处理 PR feedback | public route 只选择 user-only standalone skill；local-fix/commit/push/reply/thread-resolve 五类 authority 分离 | 任一 exit 缺 authority 时停在对应出口；不得借 workflow invocation 补造 | declared + governance/projection contracts；confirmed at source/projection level |
| R-012 | `using-spec-first -> spec-test-xcode`；用户明确要求 iOS Simulator 验证 | public route 选择 user-only standalone skill；XcodeBuildMCP readiness 由 skill 检查 | MCP unavailable 时停止；不回退成 Code Review 静态 lens | declared + governance/projection contracts；confirmed at source/projection level |
| R-013 | removal of `spec-optimize -> spec-work` | Optimize 不再列没有 artifact intake 的 Work consumer | 后续由真实 code-review/benchmark/release/human consumer 消费 | removed from current source；SF-15 closed |
| R-014 | removal of `spec-worktree -> spec-code-review` | helper description/integration 不再反向声明 Code Review caller | future caller 必须先在 public owner 建 forward invocation/intake | removed from current source；SF-17 closed |
| R-015 | removal of `spec-worktree -> spec-work` | helper description/integration 不再反向声明 Work caller | current confirmed caller 仅 Dogfood | removed from current source；SF-17 closed |

## 3. 变更支撑文件所触及的既有 edge

原刷新批次的 30 个 source file delta 触及 46 个 pair；后续修复依次重裁决此前 P0/P1/P2。`current_head_at_calibration` 已包含 `+2/-3` 的 P2 pair delta；当前 P3 overlay 只校准 existing prompt/consumer wording，不新增或删除 canonical pair。顶部 165 仍是冻结 calibration manifest，不冒充本轮完整重算。

| Baseline ID | Current edge | Current verdict | 说明 |
| --- | --- | --- | --- |
| M-008 | `spec-brainstorm -> spec-doc-review` | **confirmed (SF-11 closed)** | Markdown/HTML 均可进入审查；HTML 固定 report-only、byte-preserving 且 producer-owned mutation |
| M-001 | `spec-app-consistency-audit -> spec-code-review` | **BND / legacy compatibility only（SF-14 closed）** | Ordinary code review 与 follow-up owner mention 保留；`from:code-review` / `code_review_handoff` 明确休眠，当前无 governed caller/intake/consumer |
| M-010 | `spec-brainstorm -> spec-plan` | **confirmed (SF-13 closed)** | software requirements-only artifact 仍是产品到实现规划的 carrier；universal route 只在用户 wrap-up 显式选择后进入 knowledge-work Plan |
| M-012 | `spec-brainstorm -> spec-proof` | **confirmed (SF-01/SF-12 closed)** | target 完整 package 已五宿主投射；Universal Proof-only 先物化并验证现有 Markdown source path，真实 host/API invocation 尚未验证 |
| M-013 | `spec-brainstorm -> spec-work` | **BND / artifact-kind conditional（SF-11 closed）** | shared renderer 明确 requirements-only brainstorm/ideation HTML 不由 Work 消费；只有 producer contract 已确认 implementation-ready software plan 时 `spec-work` 才是 HTML consumer，不建立 Brainstorm direct-work edge |
| M-036 | `spec-dogfood -> spec-commit` | **confirmed (SF-01 closed)** | target 已作为 internal-only package 五宿主投射；caller 仍须先持有独立 commit authority |
| M-057 | `spec-lfg -> spec-code-review` | **confirmed (SF-18 closed)** | JSON-only report consumption 保持；tracker filing 由 caller-owned Work/LFG residual flow 处理，`spec-code-review` 只 report；LFG/Work tracker reference source 与五宿主投射均保持 parity |
| M-058 | `spec-lfg -> spec-commit-push-pr` | **confirmed (SF-01 closed)** | target 已作为 internal-only package 五宿主投射；LFG 从明确 entry admission 派生并传递 commit/landing facts，`mode:pipeline` 不授权 |
| M-061 | `spec-lfg -> spec-simplify-code` | **confirmed（SF-26 closed）** | LFG 现如实声明 full-project typecheck/lint、默认 changed-path scoped tests 与 risk/runner-based broadening；final verification gate 仍持有完整 closeout truth |
| M-062 | `spec-lfg -> spec-test-browser` | **confirmed (SF-09 closed)** | applicable/not_applicable、exact origin、effect authorization、cleanup/result blockers 已闭合 |
| M-069 | `spec-plan -> spec-doc-review` | **confirmed (SF-11 closed)** | Plan HTML renderer 现声明 report-only consumer，锁定 `html-artifact` 与 zero-write boundary |
| M-072 | `spec-plan -> spec-proof` | **confirmed (SF-01/SF-12 closed)** | target 完整 package 已五宿主投射；Universal Proof-only 先物化 source，Save+Proof 发布 exact saved Markdown，真实 host/API invocation 尚未验证 |
| M-112 | `spec-test-browser -> spec-lfg` | **confirmed (SF-09 closed)** | reverse caller now consumes structured pipeline contract，helper is delivered internal asset |
| M-117 | `spec-work -> spec-commit` | INFO / conditional named path；不再作为 SF-01 carrier | residual-sink 说明称“no-PR `spec-commit` path”，但 Phase 4 只要求 separately authorized repo commit workflow；没有 exact-helper invocation 或缺失 target blocker |
| M-118 | `spec-work -> spec-commit-push-pr` | INFO / conditional named landing reference；不再作为 SF-01 carrier | residual-sink 说明描述“when calling `spec-commit-push-pr`”，但 Phase 4 只要求 requested landing workflow；没有 mandatory exact-helper edge |

## 4. High-risk family seven-question result

| Family | necessity / route / owner | handoff / authority | failure / convergence | verdict |
| --- | --- | --- | --- | --- |
| `using-spec-first -> selected entry` | one entry then yield；route map remains public source | route is never exit authority | 18 个 dispatching target 均拥有 package-local missing-auth/capability fallback | confirmed governor；SF-27 source-contract gap closed |
| brainstorm -> LFG -> plan/work | corrected canonical entry and preserved artifact path | brainstorm/plan/LFG each retain product/planning/shipping boundary | invalid/non-software/readiness stops | confirmed for SF-08 |
| LFG -> browser helper | user-visible flow requires runtime verification only when applicable | caller owns origin/server; helper owns wrapper/session cleanup | missing/invalid origin or cleanup failure blocks; not_applicable has reason | confirmed for SF-09 |
| work -> doc review -> work | semantic review prevents stale plan handoff | doc-review is byte-preserving report producer; work owns disposition/verification | hash drift/incomplete/P0/P1 stop final validation | confirmed |
| task pack -> doc review | high-risk review intent is legitimate | `spec-doc-review` 唯一分类 task pack 并强制 report-only；validator owns deterministic floor，source plan owns scope/architecture，write-tasks owns regeneration | invalid/stale intake 不 dispatch personas；pack gap 回 `spec-write-tasks`，plan decision gap 回 `spec-plan`；只有完整 zero-write JSON envelope、source-plan 对齐及 passed+valid+deterministic outcome 同时成立才进入 `spec-work-task-pack` | confirmed at `source-contract-confirmed`, SF-04 closed；`Review complete`/`roster:full` 不提升 handoff/dispatch authority |
| code-review shared spine -> maintainability persona | maintainability owns concrete structural/mechanical findings；shared template owns cross-persona false-positive/advisory normalization | 1000-line crossing 在 before/after line-count + added-diff evidence 成立时保持 P1/anchor-100；thin wrapper/duplicate helper 保持 persona owner；无 threshold/failure mode 的 subjective long-file opinion 仍 suppress | shared template 先保留 proven persona severity/confidence，避免旧 suppress 或 generic advisory anchor-50 降级，再对剩余 shape 执行 FP-over-advisory precedence；四个 planted cases 防止 broad override | confirmed at `source-contract-confirmed`, SF-06 closed；未执行 fresh-session persona dispatch |
| code-review orchestrator -> deployment/validator prompt | orchestrator owns conditional activation 与 available detail context；worker/template 不拥有 self-activation 或 producer-requiredness | Deployment 只在 risky migration/schema artifact gate 下调用；`why_it_matters` 存在时加载，缺失时 validator 继续依据 diff/cited code | 普通 data-processing、model/query/serializer/migration-test 不触发 deployment worker；optional detail 缺失不使 finding 自动失效 | confirmed at `source-contract-confirmed`, SF-24/SF-25 closed；未执行真实 deployment 或 validator precision/recall eval |
| artifact map -> spec-work run artifact | 用户需要知道 closeout evidence 的真实生命周期与读取边界 | map 复述 schema/producer 的 conditional `workflow_integrated`、v2 `direct_evidence_used`、v1 `graph_evidence_used` read/prune compatibility；source-owned reader 仍是唯一确定性 read/prune owner | 不再把 false-only 写成 current contract，不把旧 graph-shaped fields 当 v2 字段，不把 spec-code-review 自动 discovery 当事实；显式 reader 仍需 target repo/workspace/run，artifact 不获得 source scope authority | confirmed at `source/docs-contract-confirmed`, SF-10 closed；未验证真实用户阅读/跨宿主渲染 |
| runtime setup -> local rendering config -> plan/brainstorm/ideate | setup 暴露并保护三个 active local preferences | 三个 workflow 分别拥有格式解析、默认值与 pipeline override；setup 不调用 workflow | 注释、缺失或无效值保持 consumer 默认，不能被 setup 提升为 runtime authority | confirmed at `source-contract-confirmed`, SF-03 closed；未验证真实 host/local config field run |
| work/debug/review -> compound | durable knowledge can be reusable | new/materially rewritten learning 必须有 grounded `source_refs` 与 concrete `invalidation_condition`；validator 只强制机械形态，LLM/human 判断语义充分性 | Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 缺任一字段、空值、错误类型或重复字段时不得完成；legacy default mode 保持兼容 | confirmed at `source-contract-confirmed`, SF-02 closed；未验证真实 host field run |
| public caller -> internal/standalone helper | helper reuse can be necessary；internal 例为 LFG -> commit-push-pr、dogfood -> commit/worktree、五个 Proof handoff；user-only 例为 PR feedback 与 Xcode | 5 个 load-bearing internal package 保持投射；原 2 个 governance-only orphan 现按 explicit public route 作为 standalone skill 投射，PR feedback 同时补齐五类 exit authority | 五宿主 projection plan/init 可解析；Cursor 按宿主 allowlist 移除不支持的 `allowed-tools` frontmatter，但保留 user-only entry、authority body 与 `disable-model-invocation`，其他四宿主保留 source tool list；真实 host loader、GitHub/Xcode invocation 尚未验证 | confirmed at `projection_confirmed`；SF-01/SF-23 closed |

## 5. Dispatch authority matrix continuity

当前 working-tree matrix 为 18 个 generic-dispatch package、18 个合格、0 个 package-local gap。原 6 个合格 precedent（`spec-code-review`、`spec-debug`、`spec-doc-review`、`spec-plan`、`spec-prd`、`spec-work`）继续保留 explicit authorization + missing-auth/capability fallback；原 12 个缺口 package 已逐包补齐 `worker_dispatch_authorization`、`worker_dispatch_capability`、`dispatch_authorization_missing` / `subagent_capability_missing` 与 inline/serial fallback。对抗性首个-dispatch 顺序复核发现 `spec-code-review` 的 trivial-PR pre-check 曾位于 Stage 1c 前且直接要求 subagent；当前已改为 orchestrator inline conservative judgment，并以聚焦合同锁定 repo-profile dispatch 位于 gate 之后。`spec-optimize` 的 judge/Codex cascade、`spec-sweep` 的 scheduled/sensitive input、`spec-resolve-pr-feedback` 的 mutating worker、`spec-compound-refresh` 的 tracked successor 等高风险路径均不能再从 workflow invocation、mode、approved spec、permission 或“用户未禁止”推导 dispatch/write authority。该结论由 18-package focused matrix + current-source inline order audit 约束；本次审查自身仍因 `dispatch_authorization_missing` 使用 inline analysis，不声称 independent persona coverage。

## 6. Set checks

| Check | Result |
| --- | ---: |
| governed packages | 35 |
| canonical source files | 278 |
| file-target support hits | 265 |
| baseline identities retained | 156 |
| removed identities | 1 |
| new identities | 9 |
| frozen calibration pairs | 165 |
| current overlay pair delta | +2 / -3（bounded current-vs-HEAD token scan） |
| duplicate canonical pairs | 0 |

The ledger proves declared current-source relationships and named consumer/projection facts only. `source_head` 是原始冻结快照；`current_head_at_calibration` 不包含当前未提交的最后 9 项 P2 overlay。它不证明 host discovery/helper invocation、actual generic dispatch、fresh-session persona behavior、真实 GitHub/Xcode/Figma/browser、CI/merge/release 或 field outcome。
