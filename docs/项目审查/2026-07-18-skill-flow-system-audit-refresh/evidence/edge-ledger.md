---
title: Skill 跨包关联边当前快照总账
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 3e07fb20cd790eeabe10e409170f202ae195e78b
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-source-repair
baseline_ledger: docs/项目审查/2026-07-17-skill-flow-system-audit/evidence/edge-ledger.md
expected_pairs: 165
actual_pairs: 165
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

## 3. 变更支撑文件所触及的既有 edge

原刷新批次的 30 个 source file delta 触及 46 个 pair；后续 SF-01 overlay 重裁决 commit-helper caller edges，本轮 SF-02 overlay 重裁决 knowledge-promotion exit。下表只列 role/status 发生改变、仍为 drift 或对 P1/P2 有实质影响的行；另有 9 条新增 pair 已在上一节逐条登记。未列出的既有 pair 维持 07-17 role/status，因为改动只增补同一 handoff 的 precision、reviewer lens、provider wording 或 test/evidence posture，未改变 route owner、artifact authority、failure/stop semantics。

| Baseline ID | Current edge | Current verdict | 说明 |
| --- | --- | --- | --- |
| M-008 | `spec-brainstorm -> spec-doc-review` | drift retained (P2) | handoff 仍称 HTML review unavailable，与 doc-review HTML report-only contract 冲突 |
| M-010 | `spec-brainstorm -> spec-plan` | confirmed | requirements-only path remains the unique product-to-planning carrier |
| M-012 | `spec-brainstorm -> spec-proof` | drift retained (P2) | runtime delivery/source-file precondition 未由本次变更解决 |
| M-013 | `spec-brainstorm -> spec-work` | drift retained (P2) | shared renderer 的 direct-work wording 未被本次变更移除 |
| M-036 | `spec-dogfood -> spec-commit` | **confirmed (SF-01 closed)** | target 已作为 internal-only package 五宿主投射；caller 仍须先持有独立 commit authority |
| M-057 | `spec-lfg -> spec-code-review` | drift retained (P2) | JSON-only report consumption 已修复，但 tracker-defer 仍把 interactive code review 视为 filing owner |
| M-058 | `spec-lfg -> spec-commit-push-pr` | **confirmed (SF-01 closed)** | target 已作为 internal-only package 五宿主投射；LFG 从明确 entry admission 派生并传递 commit/landing facts，`mode:pipeline` 不授权 |
| M-061 | `spec-lfg -> spec-simplify-code` | drift retained (P3) | source 仍泛称 simplify “runs the test suite”，实际 evidence scope 不能由该语句提升 |
| M-062 | `spec-lfg -> spec-test-browser` | **confirmed (SF-09 closed)** | applicable/not_applicable、exact origin、effect authorization、cleanup/result blockers 已闭合 |
| M-069 | `spec-plan -> spec-doc-review` | drift retained (P2) | `references/html-rendering.md` 仍称 doc-review non-HTML consumer |
| M-072 | `spec-plan -> spec-proof` | drift retained (P2) | Proof runtime/source precondition 未解决 |
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
| task pack -> doc review | high-risk review intent is legitimate | target lacks task-pack classification/schema lens | no unique consumer/terminal result | drift, SF-04 |
| work/debug/review -> compound | durable knowledge can be reusable | new/materially rewritten learning 必须有 grounded `source_refs` 与 concrete `invalidation_condition`；validator 只强制机械形态，LLM/human 判断语义充分性 | Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 缺任一字段、空值、错误类型或重复字段时不得完成；legacy default mode 保持兼容 | confirmed at `source-contract-confirmed`, SF-02 closed；未验证真实 host field run |
| public caller -> internal helper | helper reuse can be necessary；直接例为 LFG -> commit-push-pr、commit-authorized dogfood -> commit | 两个 load-bearing target 与 browser/worktree 共 4 个 internal package 已投射；其余 3 个 record 保持 governance-only | caller-target package 在五宿主 projection plan 与 sandbox init 可解析；真实 host loader/invocation 尚未验证 | confirmed at `projection_confirmed`, SF-01 closed；不把 spec-work 的条件式命名参考算作强制 caller edge |

## 5. Dispatch authority matrix continuity

当前 working-tree matrix 为 18 个 generic-dispatch package、18 个合格、0 个 package-local gap。原 6 个合格 precedent（`spec-code-review`、`spec-debug`、`spec-doc-review`、`spec-plan`、`spec-prd`、`spec-work`）继续保留 explicit authorization + missing-auth/capability fallback；原 12 个缺口 package 已逐包补齐 `worker_dispatch_authorization`、`worker_dispatch_capability`、`dispatch_authorization_missing` / `subagent_capability_missing` 与 inline/serial fallback。`spec-optimize` 的 judge/Codex cascade、`spec-sweep` 的 scheduled/sensitive input、`spec-resolve-pr-feedback` 的 mutating worker、`spec-compound-refresh` 的 tracked successor 等高风险路径均不能再从 workflow invocation、mode、approved spec、permission 或“用户未禁止”推导 dispatch/write authority。该结论由 18-package focused matrix 约束；本次审查自身仍因 `dispatch_authorization_missing` 使用 inline analysis，不声称 independent persona coverage。

## 6. Set checks

| Check | Result |
| --- | ---: |
| governed packages | 35 |
| canonical source files | 278 |
| file-target support hits | 265 |
| baseline identities retained | 156 |
| removed identities | 1 |
| new identities | 9 |
| actual current pairs | 165 |
| duplicate canonical pairs | 0 |

The ledger proves declared current-source relationships and named consumer/projection facts only. `source_head` is the original frozen snapshot; `current_head_at_calibration` does not contain the uncommitted SF-02 overlay. It does not prove host discovery or helper invocation, actual generic dispatch, real compound promotion behavior, browser navigation, CI/merge/release, or field outcome.
