---
title: Skill 关系图当前快照
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: none
governed_nodes: 35
canonical_pairs: 165
committed_p2_pair_delta: +2/-3
p3_pair_delta: 0/0
---

# Skill Graph — 当前 source snapshot

## 1. Node inventory

| Entry surface | 节点 | 数量 |
| --- | --- | ---: |
| workflow command | `spec-app-consistency-audit`, `spec-brainstorm`, `spec-code-review`, `spec-compound`, `spec-compound-refresh`, `spec-debug`, `spec-dogfood`, `spec-doc-review`, `spec-ideate`, `spec-runtime-setup`, `spec-optimize`, `spec-plan`, `spec-polish`, `spec-prd`, `spec-work`, `spec-write-skill`, `spec-write-tasks` | 17 |
| standalone skill | `spec-explain`, `spec-lfg`, `spec-pov`, `spec-product-pulse`, `spec-promote`, `spec-resolve-pr-feedback`, `spec-riffrec-feedback-analysis`, `spec-rule-miner`, `spec-simplify-code`, `spec-sweep`, `spec-strategy`, `spec-test-xcode`, `using-spec-first` | 13 |
| internal only | `spec-commit`, `spec-commit-push-pr`, `spec-proof`, `spec-test-browser`, `spec-worktree` | 5 |

Roster authority 是 `src/cli/contracts/dual-host-governance/skills-governance.json`；所有 package source 是 `skills/<skill>/SKILL.md + references/**`。Generated runtime 不进入本 inventory。

## 2. Internal delivery reality

`src/cli/contracts/dual-host-governance/skills-governance.json` 的 `entry_surface + host_delivery` 是 internal delivery 唯一真源；`src/cli/plugin-governance.js` 直接消费该治理记录，交付 `spec-commit`、`spec-commit-push-pr`、`spec-proof`、`spec-test-browser` 与 `spec-worktree`，不维护第二份 helper 名单。`spec-resolve-pr-feedback`、`spec-test-xcode` 不再是 internal record：它们由 governance 作为 `standalone_skill` 在五宿主投射，并且只接受用户显式入口。严格内部 helper 的边界保持不变。

| Helper | 当前 projection | caller relationship posture |
| --- | --- | --- |
| `spec-commit` | delivered | commit-authorized dogfood direct caller 可解析；helper invocation 不授予 commit authority |
| `spec-commit-push-pr` | delivered | authorized LFG landing caller 可解析；LFG 传递 entry-derived authority facts，helper invocation/`mode:pipeline` 不授予 commit/landing authority |
| `spec-test-browser` | delivered | `spec-lfg` browser pipeline 已有 structured applicability/origin/cleanup contract |
| `spec-worktree` | delivered | `spec-dogfood` 的 existing-ref caller 可闭合 |
| `spec-proof` | delivered | plan/brainstorm/ideate/explain/pov 的 Proof handoff 可解析；只允许显式点名，不进入 public route |
| `spec-resolve-pr-feedback` | standalone / delivered | `using-spec-first` 只在用户明确要求处理 PR feedback 时选择；local-fix/commit/push/reply/thread-resolve 分别授权 |
| `spec-test-xcode` | standalone / delivered | 用户明确要求 iOS Simulator 验证时选择；当前没有 Code Review auto-caller |

## 3. Canonical relationship delta

基线是 07-17 的 157 pair ledger。下方 265 hits / 165 pairs 是冻结 calibration manifest；`current_head_at_calibration` 已包含 P2 的 `+2/-3` pair delta。已提交 P3 修复只校准 existing edge 的 activation/evidence wording，pair delta 为 `0/0`；文本共现仍只是 declared candidate，语义角色与 authority 见 edge ledger。

```text
157 baseline pairs
- 1 removed (`spec-test-browser -> spec-runtime-setup`)
+ 9 canonical pairs
= 165 current pairs
```

### 新增 pair

| Pair | Role | 当前裁决 |
| --- | --- | --- |
| `spec-brainstorm -> spec-lfg` | FWD | confirmed：用户选择后传同一绝对 requirements artifact；target 由 host catalog 精确解析 |
| `spec-code-review -> spec-polish` | INFO/BND | confirmed：frontend persona 明确 visual iteration owner，不形成 review 内调用 |
| `spec-code-review -> spec-test-browser` | INFO/BND | confirmed：browser runtime evidence 是相邻 owner，不形成 review 内调用 |
| `spec-lfg -> spec-brainstorm` | REV | confirmed：LFG 识别 brainstorm caller 的 requirements-only artifact |
| `spec-plan -> spec-dogfood` | BND | confirmed：planning lens 只说明 branch/PR QA owner |
| `spec-plan -> spec-lfg` | REV | confirmed：plan 识别 pipeline caller，不夺 shipping authority |
| `spec-plan -> spec-polish` | BND | confirmed：planning lens 不执行 visual polish |
| `spec-plan -> spec-test-browser` | BND | confirmed：planning 只记录 runtime verification owner |
| `spec-work -> spec-doc-review` | FWD | confirmed：shipping caller 对 Markdown source plan 进行 hash-bound report-only JSON review |

### 移除 pair

`spec-test-browser -> spec-runtime-setup`（旧 M-113）已从 current source 删除。browser helper 现在返回 caller-consumable `not_supported` / reason code，不再把 setup repair 写成 declared handoff；这只改变关系分母，不证明 exact-origin capability 已就绪。

### 已提交 P2 pair delta 与 P3 zero-delta 修复

- 新增：`using-spec-first -> spec-resolve-pr-feedback`、`using-spec-first -> spec-test-xcode`，均为 user-explicit standalone route。
- 删除：`spec-optimize -> spec-work`、`spec-worktree -> spec-code-review`、`spec-worktree -> spec-work`，分别移除纸面 consumer 与 reverse-only caller。
- App audit 与 Xcode 对 Code Review 的文本 mention 只保留 near-neighbor/negative boundary 或 legacy compatibility，不构成 active invocation edge。
- Shared HTML renderer 中的 `spec-work` 只在 artifact 已由 producer contract 确认为 implementation-ready software plan 时成立；requirements-only Brainstorm/Ideate HTML 不形成 `spec-brainstorm -> spec-work` direct edge。
- P3 pair delta 为 `0/0`：SF-24/SF-25 校准 Code Review 内部 activation/detail-context contract；SF-26 只修正既有 `spec-lfg -> spec-simplify-code` edge 的 verification 语义。

## 4. 关系形态

```text
using-spec-first --select one--> public workflow / standalone / Direct Lane
spec-brainstorm --requirements path--> spec-plan --implementation-ready--> spec-work
spec-work --hash-bound report-only plan review--> spec-doc-review --envelope--> spec-work caller
spec-write-tasks --high-risk derived task pack--> spec-doc-review --task_pack_outcome--> spec-work-task-pack / spec-write-tasks / spec-plan
spec-work/spec-debug/spec-code-review --verified learning--> spec-compound --promotion gate--> docs/solutions/**
spec-lfg --caller-owned exact origin--> spec-test-browser --structured result--> spec-lfg
spec-lfg --authorized landing--> spec-commit-push-pr
spec-dogfood --authorized checkpoint--> spec-commit
```

每条箭头都只表示所述 source-level handoff；它不授予 dispatch、mutation、commit、landing 或 knowledge promotion。`current_head_at_calibration` 已包含 P0-P3 修复：P2 pair delta 为 `+2/-3`，P3 pair delta 为 `0/0`，且校准时没有 working-tree overlay。`source_head` 只保留原始冻结快照，顶部 frozen manifest 的文件/pair/hash 不冒充后续 source 全量重算。
