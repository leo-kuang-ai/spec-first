---
title: "fix: spec-first 精准修补 D1/D3/D6(parent quarantine + repo label + dirty paths)"
type: fix
status: completed
date: 2026-05-28
spec_id: 2026-05-28-003-fix-spec-first-precision-fix-d1-d3-d6
origin: docs/03-实施方案/2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md
---

# fix: spec-first 精准修补 D1/D3/D6

## Summary

针对 kaz-mvp 实测暴露的 8 个缺陷(D1–D8),只挑出 3 个最高优先级且**纯 additive、不引入新抽象层**的精准修补:D1 parent 顶层产物 quarantine、D3 GitNexus repo label 冲突暴露、D6 dirty 路径采样。3 个 PR 各自独立可发布,3–5 天总工期,不引入 fingerprint schema、capability matrix、entry router 升级等更大抽象。

---

## Scope Expansion Note(实际交付范围)

本 plan 在 spec-work 实施期间,实际交付范围**超出**原 Scope Boundaries 三项:

- **D5** graph-bootstrap final-response 强制 host_instruction drift handoff 行(见 `skills/spec-graph-bootstrap/SKILL.md`)
- **D8** Evaluation Harness `quality_signals.{child_count, process_results_rate, command_failed_rate, dirty_advisory_child_rate}` 4 字段
- **spec-optimize** 接入 P5-min 指标基线(SKILL.md 加入 `process_results_rate < 0.5` 时建议 bounded fallback 的指引)

这三项是原 plan `2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md` 的 U6/P3+P5-min/PD-min 内容。实施时与本 plan U2/U3 共享 `bootstrap-providers.{sh,ps1}` 改动,顺手同提交合并入(commit `60d02ac6`),节省了独立 PR 成本。

owner 决策:**不回滚扩展内容**(代码已 working,测试 1116 全绿,zero regression)。但保留此 Note 作为审计追溯——后续若发生类似 scope 扩展,应先评估是否值得作为独立 PR,而非默认合入当前 plan。

完整 plan 002 milestone 仍 status: active 备查,实践中遇到痛点时反应式决策是否进一步推进 D2/D4/D7 等剩余 deliverable。

---

## Problem Frame

2026-05-28 在 `/Users/kuang/xiaobu/kaz-mvp` 实测暴露 8 个缺陷。原 plan(`docs/plans/2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md`)以 10–13 周 milestone 形式覆盖全部 D1–D8 + 引入两层 fingerprint + capability matrix + entry router 升级。

经过多轮顶层反思后判断:
- 完整 milestone 方案有过度设计风险:fingerprint schema 与 spec-first "Light contract / Let the LLM decide" 哲学相悖,且面临 LLM 上下文/能力快速演化下的贬值风险
- D1 / D3 / D6 是 8 个缺陷中**最痛、最具体、最能被纯 additive 字段直接解决**的三项
- 其他 5 项(D2 / D4 / D5 / D7 / D8)要么需要更大的抽象设计,要么 ROI 偏低,实践中遇到具体痛点时再决策

本 plan 是 Tier 1 精准修补,作为完整 milestone 方案的最小可发布前置。

### 直接修复的 3 个缺陷

- **D1** parent 顶层 stale `.spec-first/{graph,config,providers}/**` 在 multi-repo workspace 模式下无 invalidation/quarantine 机制,LLM 误读概率非零
- **D3** GitNexus repo label 来自 `meta.json.remoteUrl basename` / `git remote` / `directory basename` 三源,冲突时静默选一个,kaz-mvp 顶层因此 6/6 query_probe 全失败(`Repository "kaz-mvp" not found. Available: kaz-app`)
- **D6** `dirty_paths_breakdown.sample_paths[]` 已能给出少量路径,但缺少 per-path classification / `graph_affecting` bool,LLM 无法判断 bounded direct read 优先级,也无法把 setup-owned/non-graph metadata 与真正 graph-affecting dirty path 区分开

---

## Requirements

- R1. **D1 修复**:multi-repo workspace 模式下,`mcp-setup` 的 verify 阶段在识别到顶层 stale 产物时写入 `.spec-first/workspace/parent-artifact-quarantine.json`(新 artifact schema `parent-artifact-quarantine.v1`),并在 `.spec-first/workspace/mcp-verify-summary.json` 增加 `parent_workspace_pollution_count`
- R2. **D1 配套**:`spec-first clean --workspace-orphans` read-only 子命令,基于 quarantine 文件列出待清理路径,**不自动删除**(实际删除留待后续 PR)
- R3. **D3 修复**:`provider-status.json.gitnexus` 增加 `repo_label_resolution` 字段(`selected` + `selected_source` + `conflict` bool;`candidates[]` 三源候选**仅在 conflict=true 时**列出,conflict=false 时省略以减少 token 噪音——选择性暴露原则,参考 Aider repo map 设计);不写 `next_action`,由 LLM 基于 facts 判断修复建议
- R4. **D6 修复**:`graph-facts.json` 增加 `dirty_paths_sample[]`(上限 ≤30 条,优先 `graph_affecting=true`,每条含 `path` + `graph_affecting` bool),并保留既有 `dirty_paths_breakdown.sample_paths[]` 兼容字段
- R5. 所有新增字段都是 **additive**,不破坏既有 schema 版本号(`graph-providers.v1` / `runtime-capabilities.v1` / `graph-facts.v1` / `provider-status.v1` / `workspace-graph-targets.v1` 全部不 bump)
- R6. **Cross-platform Invariants**:Bash + PowerShell 双宿主输出 fingerprint-equivalent 字段集 + 取值集一致;path 字段 POSIX 风格;PowerShell 写文件 `-Encoding utf8NoBOM`
- R7. 每个 U-unit 独立可发布、独立可回滚、独立 PR

---

## Scope Boundaries

- **不实现** developer-scenario-fingerprint(setup-time / bootstrap-time 两层 schema)
- **不实现** Scenario Capability Matrix(default + high-risk override)
- **不升级** `using-spec-first` entry router(6 优先级维度路由)
- **不实现** D2 build-target awareness(Gradle / npm 解析器,以及 `non_git_build_modules[]` / `coverage_summary` / `graph_coverage_class`)
- **不实现** D4 host_ledger_pointer 自动刷新
- **不实现** D5 graph-bootstrap final-response 强制 drift handoff 行
- **不实现** D7 query_probe candidate 多样性算法
- **不实现** D8 Evaluation Harness `quality_signals.*`
- **不实现** spec-optimize 接入指标基线(PD-min / PD-full)
- **不删除** parent 污染产物(`spec-first clean --workspace-orphans` 本 plan 仅 read-only 列举;实际删除留待后续)
- **不引入新 provider**;**不破坏既有 schema 版本号**;**不升级既有 workflow SKILL.md 的 capability 节**
- `dirty_paths_sample[]` 本期不包含 `build_module`;build-target scan 已 scope out,后续 D2 如需模块归属可通过 additive 字段另行补充

### Deferred to Follow-Up Work

- D2 / D4 / D5 / D7 / D8 修复:见原 plan `docs/plans/2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md` 的 U6–U12,实践中遇到痛点时反应式决策是否实施
- `parent-artifact-quarantine.json` preview-first 实际删除升级:本 plan 完成后独立 PR
- `dirty_paths_sample[].build_module` 字段是否需要:依赖 build-target scan 与 Tier 1 观察结果,本 plan 不预占位
- `developer-scenario-fingerprint` / `scenario-capability-matrix.md` / `using-spec-first` router 升级:基于 Tier 1 实测数据评估是否仍需要

---

## Graph Readiness

- target_repo: spec-first
- status: stale
- source_revision: fc3d0ca649ee6739d16302608858e1ef4165fc9f
- current_revision: fc3d0ca6 + dirty (本会话产生若干文档变更)
- stale: true (dirty-advisory)
- primary_providers: gitnexus
- fallback_capabilities: bounded direct repo reads
- runtime_mcp_evidence: not-probed (planning session)
- confidence: advisory(本 plan 不依赖 graph 作为主证据,主要证据来自 origin 文档 A 实测产物分析 + bounded direct file reads)
- limitations: snapshot_mismatch; dirty worktree blocks fresh process-graph

---

## Graph / GitNexus Evidence

- provider: GitNexus
- capability_status: partial
- evidence_grade: stale
- evidence_posture: fallback
- freshness_state: dirty-advisory
- source_tags: [checked-in-baseline, setup-projection]
- source_reads_required:
  - `skills/spec-mcp-setup/scripts/verify-tools.sh`
  - `skills/spec-mcp-setup/scripts/verify-tools.ps1`
  - `skills/spec-mcp-setup/scripts/resolve-project-target.{sh,ps1}`
  - `skills/spec-graph-bootstrap/scripts/bootstrap-providers.{sh,ps1}`
  - `src/cli/commands/clean.js`
  - `src/cli/commands/internal.js`(prior art reference)
  - `src/cli/helpers/compile-workspace-gitnexus-readiness.js`(prior art reference)
- impact_on_plan: 主要事实来自 origin 文档 A 的 kaz-mvp 实测数据 + 直接 source reads
- key_findings: prior art `compile-workspace-gitnexus-readiness.sh` → `node "$SPEC_FIRST_CLI" internal workspace-gitnexus-readiness` 验证了 Node helper + shell wrapper 模式可行,quarantine 计算逻辑可复用同一架构
- limitations: process-graph unavailable; impact evidence unavailable

---

## Context & Research

### Relevant Code and Patterns

- **[关键 prior art]** `skills/spec-graph-bootstrap/scripts/compile-workspace-gitnexus-readiness.sh` — Bash 调 `exec node "$SPEC_FIRST_CLI" internal workspace-gitnexus-readiness "$@"`,三级 fallback;PowerShell 侧 `Invoke-SpecFirstCliCaptured @('internal', 'workspace-gitnexus-readiness', ...)`。本 plan 的 quarantine 计算可选择复用此模式,也可选择纯 shell + jq(更轻)
- `src/cli/commands/internal.js` — 已有 5 个 subcommand 注册;若 quarantine 选择 Node helper 路径,需新增 `compute-parent-quarantine` subcommand
- `src/cli/helpers/compile-workspace-gitnexus-readiness.js` — Node helper 模式参考
- `src/cli/commands/clean.js` — `spec-first clean` 命令入口,当前强制 `--claude` / `--codex`;`--workspace-orphans` 需要成为独立 read-only mode,不要求 host 参数
- `skills/spec-mcp-setup/scripts/verify-tools.sh` / `.ps1` — D1 quarantine 写入位置(verify-tools 阶段或 install-mcp 阶段,U1 实施时拍板)
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` / `.ps1` — D3 `repo_label_resolution` 与 D6 `dirty_paths_sample[]` 写入位置
- `tests/unit/bootstrap-providers-powershell-contracts.test.js` — dual-host contract test prior art,新测试沿用平展命名

### Institutional Learnings

- `docs/contracts/dual-host-governance/` — Bash + PowerShell 对称规则
- `docs/03-实施方案/2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md` §1.2 / §1.4 — D1 / D3 / D6 详细产物证据(repo_root mismatch、kaz-app vs kaz-mvp label 冲突、dirty_paths_breakdown 计数)

---

## Key Technical Decisions

- **路径 1(优先,推荐):quarantine 计算用纯 Bash + jq / PowerShell + ConvertFrom-Json,不引入新 Node helper**。理由:逻辑简单(读 3 个 artifact 文件 + stat 检查 + 写 JSON),用 prior art `compile-workspace-gitnexus-readiness` 的复杂度不匹配。U1 实施时若发现 stat 跨平台行为差异大,降级到 Node helper 路径(路径 2)
- **路径 2(降级):若路径 1 跨平台对称困难,新增 `src/cli/helpers/parent-artifact-quarantine.js` + `internal compute-parent-quarantine` subcommand,沿用 `compile-workspace-gitnexus-readiness` prior art**
- **`foreign_residual_indicators` 双重判断**:`stat 失败` **AND** `路径前缀与当前用户 home mismatch`——两条都满足才标 foreign-residual。避免 WSL/Docker/NFS 误判正常路径为 foreign
- **`repo_label_resolution.candidates[]` 三源固定枚举**:`gitnexus_meta_remote_url_basename` / `git_remote_url_basename` / `directory_basename`(与 origin 文档 A §2.1 一致),三个值都为同一字符串则 `conflict=false`
- **`dirty_paths_sample[]` 上限 30**:基于 origin 文档 A T1.3 决议;超过 30 时按 `graph_affecting=true` 优先保留,其他截断;不预占 `build_module`,避免把已 scope-out 的 D2 提前写进 schema
- **`advisory: true` 永远固定**:quarantine 文件不是 hard gate,LLM 仍可越级
- **`additive=true` contract test 强制**:每个新增字段必须有"未知字段被忽略不报错"的 schema 校验
- **本 plan 不动 SKILL.md prose**:让 LLM 直接读新字段,不预先写"该怎么用"的 prose——验证 LLM 自主消费 additive 字段的能力

---

## Open Questions

### Resolved During Planning

- **Q: D1 quarantine 计算是放 Node helper 还是纯 shell?** 优先纯 shell;只有跨平台 stat 行为差异大时才降级 Node helper(U1 实施时拍板)
- **Q: U1 quarantine 写入时机是 verify-tools 还是 install-mcp?** verify-tools 阶段。理由:install-mcp 仍可能修改顶层产物,quarantine 应在所有 setup 写入完成后产出,这是 verify-tools 的语义边界;因此 `parent_workspace_pollution_count` 首版写入 `mcp-verify-summary.json`,不写 `mcp-setup-summary.json`
- **Q: D6 dirty_paths_sample 是否需要 build_module 字段?** 本 plan 不预占字段。后续 build-target scan 出现后,再以 additive 方式增加 `build_module`
- **Q: clean --workspace-orphans 是否本期就支持实际删除?** 不,只 read-only 列举。实际删除是 destructive 行为,UX 设计需要更慎重(preview + confirm),独立 PR
- **Q: 是否同时升级 SKILL.md 让 LLM 知道这些新字段?** 不。Anthropic Claude Code 最佳实践明文倡导 "Let Claude fetch what it needs"——LLM 自主消费 raw artifact 是更接近趋势的设计;runtime 输出层 hint 已确保 LLM 在调用结果中看到字段存在。实践中真出现 LLM 反复忽略字段时再加最小 prose

### Deferred to Implementation

- 跨平台 stat 行为差异在 macOS / Linux / Windows / WSL / NFS 下的具体表现:U1 实施时跨平台测试
- `mcp-verify-summary.json.parent_workspace_pollution_count` 是 quarantine_paths 数组长度,还是按 reason_code 分组计数:U1 实施时按最简实现

---

## Implementation Units

### U1. P0 Parent Artifact Quarantine + Clean read-only

**Goal:** 在 multi-repo workspace 模式下,mcp-setup 识别顶层 stale 产物后写入 `.spec-first/workspace/parent-artifact-quarantine.json`(新 schema `parent-artifact-quarantine.v1`),并提供 `spec-first clean --workspace-orphans` read-only 子命令列举待清理路径。

**Requirements:** R1, R2, R5, R6, R7

**Dependencies:** 无

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.sh`(verify-tools 阶段末尾,multi-repo 检测后写 quarantine)
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.ps1`(同上)
- Modify: `src/cli/commands/clean.js`(新增独立 `--workspace-orphans` read-only mode,不要求 `--claude` / `--codex`)
- Create: `docs/contracts/parent-artifact-quarantine.md`(轻量 artifact contract: producer/freshness/authority/consumer/reason_code)
- Modify: `docs/05-用户手册/04-workflows-artifacts-map.md`(补充 parent quarantine artifact 与 read-only clean consumer)
- Create: `tests/unit/parent-artifact-quarantine-contracts.test.js`(schema 校验 + 各拓扑 input/output)
- Modify: `tests/unit/bootstrap-providers-powershell-contracts.test.js` 或新增 `tests/unit/parent-artifact-quarantine-powershell-contracts.test.js`(双宿主对称)
- Modify: `CHANGELOG.md`(user-visible 行)

**Approach:**
- Quarantine 文件 schema(`parent-artifact-quarantine.v1`):
  ```
  schema_version: "parent-artifact-quarantine.v1"
  topology: "multi-repo-workspace"
  advisory: true
  authority_level: "advisory"
  freshness: "generated"
  generated_at: <RFC3339 UTC>
  generated_by: "spec-mcp-setup"
  consumers: ["spec-first clean --workspace-orphans", "LLM workflow degraded-evidence judgment"]
  quarantined_paths: [
    {
      path: ".spec-first/graph/graph-facts.json",   // POSIX
      reason_code: "parent-workspace-must-not-have-repo-local-graph",
      stale_indicator: "repo_root mismatches workspace_root" | "foreign-absolute-path-stat-failed" | ...,
      last_generated_at: <RFC3339 from artifact>,
      fingerprint_origin: "/Users/lynwang/..."   // 不存在则 null
    },
    ...
  ]
  ```
- Artifact contract 边界:
  - producer: `spec-mcp-setup` verify 阶段
  - authority: advisory evidence,不是 confirmed deletion truth
  - consumer: `spec-first clean --workspace-orphans` read-only 列举 + LLM workflow 判断 degraded evidence
  - freshness: 依赖 `generated_at`;清理或外部修改后需重跑 verify 重新生成
- 检测路径(扫描列表固定):
  - `.spec-first/graph/`(读 `graph-facts.json.repo_root`,与 workspace_root 不一致 → quarantine)
  - `.spec-first/config/graph-providers.json`(读 `repo_root`,同上)
  - `.spec-first/config/runtime-capabilities.json`(读 `host_ledger_pointer.path` + `repo_root`,与当前用户 home prefix mismatch + stat 失败 → quarantine)
  - `.spec-first/providers/code-review-graph/`(已 retired provider,存在即 quarantine)
  - `.gitnexus/`(读 `meta.json.repoPath`,stat 失败 + 路径前缀 mismatch → quarantine)
- reason_code 枚举(首版固定):
  - `parent-workspace-must-not-have-repo-local-graph`
  - `parent-workspace-must-not-have-graph-index`
  - `foreign-absolute-path-stat-failed`
  - `retired-provider-residue`
  - `repo_root-mismatches-workspace-root`
- `mcp-verify-summary.json.parent_workspace_pollution_count = quarantined_paths.length`(最简实现)
- `clean --workspace-orphans`:
  - 与 `spec-first clean --claude|--codex` 的 runtime removal mode 分离;`--workspace-orphans` 不要求 host 参数
  - 与 `--claude` / `--codex` 同时出现时 fail closed,避免把 read-only workspace orphan 列举混入 runtime clean apply 路径
  - 无 `parent-artifact-quarantine.json` 时提示 "先跑 mcp-setup"
  - quarantine JSON 不可读或 schema_version 不匹配时退出 non-zero,提示重跑 `spec-mcp-setup`
  - 有 quarantine 文件时打印路径列表 + 每条 reason_code,固定输出 "Deletion is not implemented in this release"
  - 不实际删除(本期 read-only)
- 双宿主对称:Bash 用 jq + stat;PowerShell 用 ConvertFrom-Json + Test-Path;path 字段 PowerShell 侧调 `$_.Replace('\','/')` 转 POSIX;JSON 写文件 PowerShell 侧 `Out-File -Encoding utf8NoBOM`
- **mcp-setup final-response 输出层(runtime 层提示)**:当 `quarantined_paths.length > 0` 时,在 final response 末尾输出固定一行
  `- Workspace pollution detected: wrote .spec-first/workspace/parent-artifact-quarantine.json (N paths quarantined). Run `spec-first clean --workspace-orphans` for read-only inspection.`
  这是 runtime 输出而非 SKILL.md prose,让 LLM 在调用 mcp-setup 时即看到 artifact 存在,避免"LLM 不知道文件存在"的失败模式;参考 Anthropic Skills 的"按需告知" runtime 模式

**Patterns to follow:**
- `skills/spec-mcp-setup/scripts/verify-tools.sh` 现有 jq + stat 调用风格
- `tests/unit/bootstrap-providers-powershell-contracts.test.js` dual-host contract test 命名与断言风格
- `src/cli/commands/clean.js` 现有 `--claude` / `--codex` parse/help/error 模式,但 `--workspace-orphans` 走独立 read-only 分支

**Test scenarios:**
- Happy path: single-repo workspace → 不写 quarantine 文件
- Happy path: multi-repo workspace + 顶层 graph-facts.json `repo_root=/Users/lynwang/...`(stat 失败 + 前缀 mismatch) → quarantine 文件含该条,reason_code=`foreign-absolute-path-stat-failed`
- Happy path: multi-repo + 顶层 `.spec-first/providers/code-review-graph/` 存在 → quarantine 含该条,reason_code=`retired-provider-residue`
- Edge case: multi-repo + 顶层 `.spec-first/graph/graph-facts.json.repo_root` stat 成功但与 workspace_root 不同 → reason_code=`repo_root-mismatches-workspace-root`,**不**标为 foreign-residual
- Edge case: WSL `/mnt/c/Users/<windows-user>/...` 路径前缀 mismatch 但 stat 成功 → 不 quarantine(因为 stat 成功)
- Edge case: parent-artifact-quarantine.json 已存在 → 幂等更新,不报错
- CLI: `spec-first clean --workspace-orphans` 无 quarantine 文件 → 提示先跑 mcp-setup
- CLI: `spec-first clean --workspace-orphans` 有 quarantine 文件 → 打印路径 + reason_code + "Deletion is not implemented in this release" 提示
- CLI: `spec-first clean --workspace-orphans --claude` 或 `--codex` → fail closed,提示 workspace orphan listing 与 runtime clean mode 不能混用
- Runtime 提示: kaz-mvp 跑 mcp-setup 后,final response 包含 "Workspace pollution detected: wrote .spec-first/workspace/parent-artifact-quarantine.json (N paths quarantined)" 一行(N 与 quarantined_paths.length 一致)
- Runtime 提示: single-repo 跑 mcp-setup 后,final response **不包含**该行(因为没有污染)
- CLI: quarantine 文件 schema_version 不匹配或 JSON 不可读 → non-zero + 提示重跑 setup/verify
- Cross-platform: PowerShell 产出的 quarantined_paths[].path 无反斜杠
- additive: 旧 mcp-verify-summary.json reader 看到新增 `parent_workspace_pollution_count` 字段不报错(schema additive)

**Verification:**
- `npm run test:unit` 通过 `parent-artifact-quarantine-contracts.test.js`
- 在 spec-first 本仓跑 `spec-first init && spec-mcp-setup` → 不产生 quarantine 文件(single-repo)
- 在 kaz-mvp 跑 `spec-first init && spec-mcp-setup` → `.spec-first/workspace/parent-artifact-quarantine.json` 包含 graph-facts.json + .gitnexus/ + (如存在)code-review-graph 残留
- `spec-first clean --workspace-orphans` 在 kaz-mvp 输出污染路径列表

---

### U2. P1 Repo Label Resolution

**Goal:** `provider-status.json.gitnexus` 增加 `repo_label_resolution` 字段,暴露三源 label 候选 + 选中来源 + 冲突标记,治 D3。

**Requirements:** R3, R5, R6, R7

**Dependencies:** 无

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`(写 provider-status 时增字段)
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`(同上)
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`(扩展断言)
- Modify: `CHANGELOG.md`(user-visible 行)

**Approach:**
- `provider-status.json.gitnexus.repo_label_resolution`(选择性暴露):
  ```
  // conflict=false(常态):仅暴露 selected + selected_source + conflict,不列 candidates
  repo_label_resolution: {
    selected: <string>,
    selected_source: "gitnexus_meta_remote_url_basename" | "git_remote_url_basename" | "directory_basename",
    conflict: false
  }

  // conflict=true(异常):额外列出三源 candidates,供 LLM 诊断哪两源冲突
  repo_label_resolution: {
    selected: <string>,
    selected_source: <enum>,
    conflict: true,
    candidates: [
      {source: "gitnexus_meta_remote_url_basename", value: <string|null>},
      {source: "git_remote_url_basename",           value: <string|null>},
      {source: "directory_basename",                value: <string>}
    ]
  }
  ```
- **conflict 判定**:三源(`gitnexus_meta_remote_url_basename` / `git_remote_url_basename` / `directory_basename`)中,**非 null 值** ≥2 个且彼此不相等 → conflict=true
- **不写 next_action 字段**:LLM 看到 `conflict=true` + 三源 candidates 自己判断该建议什么(具体修法依赖于哪两源不一致——`.gitnexus/meta` 与 `git remote` 不一致是一种修法,`git remote` 与 `directory` 不一致是另一种)。把建议预写死在 artifact 里既越界又可能误导,违反 Tier 1 "Let the LLM decide" 原则
- **graph-bootstrap final-response 输出层(runtime 层提示)**:当 conflict=true 时,在 final response 末尾输出一行
  `- Repo label conflict detected for <repo>: see provider-status.json.gitnexus.repo_label_resolution.candidates`
  这是 runtime 输出而非 SKILL.md prose,让 LLM 在调用结果中即看到字段存在,排除"LLM 不知道字段位置"的失败模式;参考 Anthropic Skills 的"按需告知" runtime 模式
- 三源采集:
  - `gitnexus_meta_remote_url_basename`:读 `<repo>/.gitnexus/meta.json.remoteUrl`,取 basename(去 `.git` 后缀)。文件不存在或字段缺 → null
  - `git_remote_url_basename`:`git -C <repo> remote get-url origin` 取 basename。无 origin → null
  - `directory_basename`:`<repo>` 路径的最后一段。永远非 null
- 冲突判定:三个非 null 值中有 ≥2 个不相等 → conflict=true
- 双宿主对称:Bash 用 `basename` + `git remote`;PowerShell 用 `Split-Path -Leaf` + `git remote`;字符串比较跨平台一致

**Patterns to follow:**
- `bootstrap-providers.{sh,ps1}` 现有 provider-status 写入逻辑
- 现有 jq / ConvertFrom-Json 风格

**Test scenarios:**
- Happy path: `.gitnexus/meta.json.remoteUrl=https://gitlab.example.com/group/web.git` + `git remote get-url origin=https://gitlab.example.com/group/web.git` + dir basename=`web` → conflict=false,selected_source=`gitnexus_meta_remote_url_basename`,**candidates 字段不出现**
- Error path: `.gitnexus/meta.json.remoteUrl=...kaz-app.git` + git remote `kaz-mvp.git` + dir=`kaz-mvp` → conflict=true,**candidates 字段出现**且含 `kaz-app` 与 `kaz-mvp` 两个不同值;final response 包含 "Repo label conflict detected" 一行
- Edge case: `.gitnexus/meta.json` 不存在 + git remote=`web.git` + dir=`web` → conflict=false,candidates 不出现
- Edge case: 无 `.gitnexus/` + 无 git remote → 仅 directory_basename 可用,conflict=false(单一非 null 值无冲突),candidates 不出现
- Schema additive: 旧 reader 看到 conflict=false 时无 candidates 字段不报错;看到 conflict=true 时新 candidates 字段不报错
- additive: 旧 provider-status reader 看到新字段不报错

**Verification:**
- `npm run test:graph-bootstrap` 通过新增断言
- 在 spec-first 本仓跑 graph-bootstrap → provider-status.json.gitnexus.repo_label_resolution.conflict=false
- 模拟 kaz-mvp 顶层场景(手动构造 `.gitnexus/meta.json.remoteUrl` 含 `kaz-app`)→ conflict=true,candidates 含两个不同值

---

### U3. P2 Dirty Paths Sample

**Goal:** `graph-facts.json` 增加 `dirty_paths_sample[]` 字段(上限 ≤30 条,优先 graph_affecting),治 D6。

**Requirements:** R4, R5, R6, R7

**Dependencies:** 无

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`(写 graph-facts.json 时增字段)
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`(同上)
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`(扩展断言)
- Modify: `CHANGELOG.md`(user-visible 行)

**Approach:**
- `graph-facts.v1.dirty_paths_sample[]`(additive,不 bump 版本号):
  ```
  dirty_paths_sample: [
    {
      path: <string POSIX>,
      graph_affecting: <bool>
    },
    ...
  ],
  dirty_paths_sample_truncated: <bool>   // 实际 dirty 文件数 > 30 → true
  ```
- 取样规则:
  - 上限 30 条
  - 优先级:`graph_affecting=true` 排在 `false` 前面
  - 同优先级内按字典序稳定排序(避免随机性,便于测试)
  - 实际 dirty 文件数 > 30 时截断,`dirty_paths_sample_truncated=true`
- `graph_affecting` 判定:沿用现有 `dirty_paths_breakdown` 的分类逻辑(setup_owned / non_graph_metadata / graph_affecting),只取 graph_affecting 的路径标 true,其他标 false
- 现有 `dirty_paths_breakdown` 三计数字段与 `sample_paths[]` 保留(additive,不替换)
- 不写 `build_module` 字段。理由:推导 build_module 需要 build-target scan(已 scope out),后续需要时再 additive 增加
- 双宿主对称:Bash 用 `git status --porcelain` + sort;PowerShell 同样,但需保证排序结果跨平台一致(LC_COLLATE / 显式 ASCII 排序)

**Patterns to follow:**
- `bootstrap-providers.{sh,ps1}` 现有 dirty_paths_breakdown 写入逻辑
- 现有 graph-facts.v1 字段命名风格(snake_case)

**Test scenarios:**
- Happy path: 0 dirty 文件 → `dirty_paths_sample=[]`, `dirty_paths_sample_truncated=false`
- Happy path: 2 dirty graph-affecting + 1 dirty non-graph → 3 条,graph-affecting 在前
- Edge case: 50 dirty 文件 → 30 条,truncated=true
- Edge case: dirty 路径含中文字符或空格 → 正确出现在 sample 中,POSIX 路径
- Cross-platform: 同样的 dirty 集合在 Bash 与 PowerShell 下产出顺序一致(显式排序)
- additive: 旧 graph-facts reader 看到新字段不报错

**Verification:**
- `npm run test:graph-bootstrap` 通过
- 在 spec-first 本仓 dirty 状态下跑 graph-bootstrap → graph-facts.json.dirty_paths_sample 含本 plan 修改的文档路径
- 在 kaz-mvp 6 个 dirty child 场景下跑 graph-bootstrap → 每个 child 的 graph-facts.json 含其各自 dirty 文件采样

---

## System-Wide Impact

- **Interaction graph:** mcp-setup verify-tools → 写 quarantine.json + mcp-verify-summary.parent_workspace_pollution_count → `spec-first clean --workspace-orphans` 读 quarantine 列举;graph-bootstrap bootstrap-providers → 写 provider-status.repo_label_resolution + graph-facts.dirty_paths_sample
- **Error propagation:** quarantine 写入失败 → warn-and-continue,不阻断 verify-tools 主流程;repo_label 三源任一采集失败 → 该候选 value=null,不阻断;dirty_paths_sample 截断 → truncated=true,不报错
- **State lifecycle risks:** quarantine.json 可能 stale(用户清理后未重跑 setup)→ 通过 generated_at 字段暴露,LLM 可见;不主动 invalidate
- **API surface parity:** 三个新字段全部 path 字段 POSIX 风格;Bash + PowerShell 输出等价
- **Integration coverage:** mcp-setup → quarantine.json + summary;graph-bootstrap → provider-status + graph-facts;`spec-first clean --workspace-orphans` 端到端 smoke
- **Unchanged invariants:** 所有既有 schema 版本号不变;所有现有 downstream workflow(`spec-plan` / `spec-work` / `spec-code-review` / `spec-debug` 等)在不读新字段时行为不变

---

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 跨平台 stat 行为差异(WSL / Docker / NFS / Windows symlink) | Medium | Medium | U1 双重判断(stat 失败 + 路径前缀 mismatch);测试场景显式覆盖 WSL 路径 |
| `repo_label_resolution.candidates[]` 三源采集在某些环境(无 git remote / 无 .gitnexus/)产出全 null | Low | Low | directory_basename 永远非 null,保证 selected 总有值;conflict 判定基于非 null 值 |
| `dirty_paths_sample[]` 与既有 `dirty_paths_breakdown.sample_paths[]` 口径漂移 | Medium | Medium | 复用同一 classification input 生成 count、sample_paths 和 dirty_paths_sample;新增一致性测试 |
| LLM 不消费新字段(本 plan 不改 SKILL.md prose) | Medium | Low | 实践中遇到时按需加最小 prose 引导即可;不预设观察期 / 评估窗口 |
| Tier 1 完成后发现仍需要 fingerprint 抽象 | Medium | Medium | 原 plan(2026-05-28-002)保留作为完整 roadmap;基于 Tier 1 实测证据再决策 |
| `parent-artifact-quarantine.json` 字段 schema 后续需要 bump | Low | Low | 引入 `schema_version` 字段;`additive=true` 设计允许加字段 |

---

## Documentation / Operational Notes

- **CHANGELOG.md** 为本 plan 添加 3 条 user-visible 行(每个 U-unit 一条 PR 一条),格式按仓库现行惯例:
  - `feat(mcp-setup): write parent-artifact-quarantine.json in multi-repo workspace; spec-first clean --workspace-orphans (read-only)` (user-visible)
  - `feat(graph-bootstrap): expose repo_label_resolution in provider-status.json.gitnexus` (user-visible)
  - `feat(graph-bootstrap): add dirty_paths_sample[] to graph-facts.json` (user-visible)
- **README** / **README.zh-CN** 不更新(本 plan 是缺陷修补,不引入新概念)
- **docs/05-用户手册/** 不新增章节,只更新 artifact map 中 `.spec-first/workspace/parent-artifact-quarantine.json` 与 `clean --workspace-orphans` read-only consumer
- **docs/contracts/** 新增 `docs/contracts/parent-artifact-quarantine.md`,只描述新 quarantine artifact 的轻量 contract;`provider-status` / `graph-facts` 的 additive 字段在脚本 source 与测试中固定
- **CLAUDE.md / AGENTS.md** 不更新(workflow 入口治理不变)
- **docs/solutions/** 不预先承诺 learning;实施后若出现非显然问题再按项目惯例沉淀

### 老用户兼容性

- 既有用户在升级 spec-first 后,旧的 `.spec-first/workspace/`、`.spec-first/graph/`、`.spec-first/providers/` 产物 **仍然可用**(三个新字段全部 additive)
- single-repo 用户场景:**完全无感**——不会产出 quarantine.json,provider-status / graph-facts 多 2 个字段不影响现有解读
- multi-repo 用户场景:首次重跑 mcp-setup 后看到 quarantine.json,可选 `clean --workspace-orphans` 列举(read-only,不实际删除)

### 后续演化(反应式,非预设)

Tier 1 落地即结束。**不预设观察期、不预设升级判断框架、不预设回头评估时机**——这些都是 meta 治理层的过度设计,与 Tier 1 "做更少 + 信任 LLM" 精神相悖。

实施后如果在真实使用中出现非显然问题:
- LLM 反复忽略某字段 → 那时候按需加最小 prose 引导
- 字段信号不够 → 那时候改字段或加新字段
- 反复同类痛点 → 那时候才考虑原 plan(2026-05-28-002)的 fingerprint 方向

任何时候都能修。问题真正出现时再处理,不预设回头时机。

---

## Sources & References

- **Origin 文档(主证据):** `docs/03-实施方案/2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md` §1.2 / §1.4 / §3.1(D1 / D3 / D6 详细产物证据 + T1.1 / T1.3 / T1.4 方案)
- **完整 roadmap 备查:** `docs/plans/2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md`(原 milestone plan,实践中出现痛点时反应式决策是否推进)
- 角色契约: `docs/10-prompt/结构化项目角色契约.md`(Light contract / Scripts prepare LLM decides / 80/20)
- Prior art shell wrapper: `skills/spec-graph-bootstrap/scripts/compile-workspace-gitnexus-readiness.sh`
- Prior art dual-host contract test: `tests/unit/bootstrap-providers-powershell-contracts.test.js`
- Cross-platform 规则: `docs/contracts/dual-host-governance/`
