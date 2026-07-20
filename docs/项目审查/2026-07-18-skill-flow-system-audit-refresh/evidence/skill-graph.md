---
title: Skill 关系图当前快照
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: e395f10f92cb6e55875da74aa01927a66e53797b
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf01-proof-delivery-and-sf27-pregate-dispatch-repair
governed_nodes: 35
canonical_pairs: 165
---

# Skill Graph — 当前 source snapshot

## 1. Node inventory

| Entry surface | 节点 | 数量 |
| --- | --- | ---: |
| workflow command | `spec-app-consistency-audit`, `spec-brainstorm`, `spec-code-review`, `spec-compound`, `spec-compound-refresh`, `spec-debug`, `spec-dogfood`, `spec-doc-review`, `spec-ideate`, `spec-runtime-setup`, `spec-optimize`, `spec-plan`, `spec-polish`, `spec-prd`, `spec-work`, `spec-write-skill`, `spec-write-tasks` | 17 |
| standalone skill | `spec-explain`, `spec-lfg`, `spec-pov`, `spec-product-pulse`, `spec-promote`, `spec-riffrec-feedback-analysis`, `spec-rule-miner`, `spec-simplify-code`, `spec-sweep`, `spec-strategy`, `using-spec-first` | 11 |
| internal only | `spec-commit`, `spec-commit-push-pr`, `spec-proof`, `spec-resolve-pr-feedback`, `spec-test-browser`, `spec-test-xcode`, `spec-worktree` | 7 |

Roster authority 是 `src/cli/contracts/dual-host-governance/skills-governance.json`；所有 package source 是 `skills/<skill>/SKILL.md + references/**`。Generated runtime 不进入本 inventory。

## 2. Internal delivery reality

`src/cli/plugin-governance.js` 的 current allowlist 交付 `spec-commit`、`spec-commit-push-pr`、`spec-proof`、`spec-test-browser` 与 `spec-worktree`。这是 deterministic projection fact；其余 2 个 internal record 继续保持 governance-only，不因本次 SF-01 修复被顺带交付。`internal_only` 表示不进入公共 route/menu；严格内部 helper 另以 `user-invocable:false` 禁止直接调用，`spec-proof` 保留 source 声明的显式点名入口。

| Helper | 当前 projection | caller relationship posture |
| --- | --- | --- |
| `spec-commit` | delivered | commit-authorized dogfood direct caller 可解析；helper invocation 不授予 commit authority |
| `spec-commit-push-pr` | delivered | authorized LFG landing caller 可解析；LFG 传递 entry-derived authority facts，helper invocation/`mode:pipeline` 不授予 commit/landing authority |
| `spec-test-browser` | delivered | `spec-lfg` browser pipeline 已有 structured applicability/origin/cleanup contract |
| `spec-worktree` | delivered | `spec-dogfood` 的 existing-ref caller 可闭合 |
| `spec-proof` | delivered | plan/brainstorm/ideate/explain/pov 的 Proof handoff 可解析；只允许显式点名，不进入 public route |
| `spec-resolve-pr-feedback` | governance-only | 无 current public caller；package-local dispatch gate 已闭合，delivery/caller posture 不因此改变 |
| `spec-test-xcode` | governance-only | reverse-only caller 仍是 orphan candidate |

## 3. Canonical relationship delta

基线是 07-17 的 157 pair ledger。本次重新从 current source 以 skill-name token boundary 提取；结果为 265 file-target hits、165 unique pairs。文本共现仅是 declared candidate，关系角色和 authority 见 edge ledger。

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

每条箭头都只表示所述 source-level handoff；它不授予 dispatch、mutation、commit、landing 或 knowledge promotion。Current HEAD 已包含 package-local mutation/dispatch gate、两个 load-bearing commit helper 的首轮五宿主投射，以及 SF-02 provenance/invalidation、SF-03 local rendering consumer、SF-04 task-pack derived/report-only consumer、source-plan authority、terminal owner、SF-10 artifact-map 与 SF-06 maintainability precedence 修复；working-tree overlay 再补齐 `spec-proof` delivery、code-review pre-gate dispatch 与相应 governance/test/docs 校准，不新增 Skill 节点或 pair。`source_head` 只保留原始冻结快照，`current_head_at_calibration` 尚未包含本轮未提交修复。顶部 278/165 与 manifest hash 仍绑定冻结 calibration inventory；本轮不重算关系分母。
