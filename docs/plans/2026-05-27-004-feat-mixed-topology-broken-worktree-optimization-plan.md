---
title: "feat: 混合拓扑 + broken worktree 诊断诚实性优化"
type: feat
status: completed
date: 2026-05-27
spec_id: 2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal
origin: docs/brainstorms/2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal.md
---

# feat: 混合拓扑 + broken worktree 诊断诚实性优化

## Summary

本计划分 P0/P1/Spike/Deferred P2 四阶段消除 spec-first 在「父级 git worktree 失效 + 混合拓扑工作区」场景下的诊断盲区：P0 让 `resolve-project-target` 区分 broken-worktree / corrupted-gitdir / not-git 三类 git 失败并暴露未覆盖目录计数；P1 新增 `spec-first repair-worktree --dry-run` preview-first 诊断子命令，只输出 unlink preview 与手动修复建议，不删除 `.git`；Spike 改为 P2 contract + provider 双 gate，先验证 parent workspace 配置事实源、artifact authority、consumer 边界，再验证 GitNexus multi-target label / exclude / fingerprint / 耗时。P2 配置驱动自动覆盖不在本计划内开发，必须另开 follow-up plan。核心判断是 `--folder` non-git-folder 模式已是 first-class 能力，当前最小高价值改动是诊断诚实性与显式 workaround 可见性，而不是把低频 mixed topology 推进默认 all-repos 路径。

## Completion Notes

Completed on 2026-05-28 for P0/P1 scope only.

Implemented:

- `project-target.v2` git diagnostics in Bash and PowerShell resolvers.
- `git_health`, workspace-only `coverage_gap`, and `candidates_diagnostics` propagation through `detect-tools` into readiness ledger v2 `parent_workspace_advisory`.
- `spec-first repair-worktree --dry-run` CLI and Bash/PowerShell scripts with preview-only behavior; `--apply` / `--unlink` fail closed.
- Focused tests for resolver diagnostics, readiness advisory, PowerShell contract parity, CLI help/smoke, and repair-worktree dry-run behavior.
- `skills/spec-mcp-setup/SKILL.md`, user manual, architecture note, and changelog documentation.

Still deferred:

- P2 mixed topology automatic folder coverage.
- Parent mixed topology config authority and artifact contract.
- `workspace-mixed-topology` mode.
- `repair-worktree --apply` / automatic `.git` deletion.

Verification run:

- `rg "project-target\\.v1" skills src tests`
- `bash -n skills/spec-mcp-setup/scripts/lib-git-health.sh skills/spec-mcp-setup/scripts/resolve-project-target.sh skills/spec-mcp-setup/scripts/detect-tools.sh skills/spec-mcp-setup/scripts/verify-tools.sh skills/spec-mcp-setup/scripts/repair-worktree.sh`
- `node --check src/cli/index.js && node --check src/cli/commands/repair-worktree.js`
- `npm run typecheck`
- `bash tests/unit/mcp-setup.sh`
- `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand`
- `bash tests/smoke/cli.sh`

---

## Problem Frame

工作区 `kaz-mvp` 拓扑：父级 `.git` 是指向已失效路径的 worktree pointer（82 字节文件），根目录下同时存在 6 个独立 child git repo 和 30+ 个非独立 git 业务模块。用户跑完 `spec-mcp-setup` + `spec-graph-bootstrap --all-repos` 后只看到"跑了 6 个"，不知道 30+ 个业务模块被完全跳过。

根本原因：`resolve-project-target.sh:114` 用 `2>/dev/null || true` 静默吞掉所有 git 失败，broken worktree、损坏 gitdir、真正非 git 三类情况无法区分；`discover_candidates` 的忽略列表与 `coverage_gap` 字段缺失；schema `project-target.v1` 没有 `git_health`、`coverage_gap`、`candidates_diagnostics` 诊断字段。`--folder` 路径存在但用户无从得知。

参考 origin: `docs/brainstorms/2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal.md`

---

## Requirements

<!-- 注：mode 枚举中 workspace-no-git-candidates 是 resolve-project-target 的 output mode（workspace 发现到 0 child git repo）；non-git-folder 是 target_kind（用户显式 --folder 指定）；两者是不同层次的枚举值，不互相替换。 -->

**诊断诚实性（R1-R3）**

- R1. `resolve-project-target.{sh,ps1}` 在父级入口和 `discover_candidates` 内部区分 broken-worktree / corrupted-gitdir / not-git / ok 四态，输出 `git_health` 字段（schema `project-target.v2`）。
- R2. 仅在当前 workspace 类 `mode` 属于 `workspace-multi-repo / workspace-single-candidate / workspace-no-git-candidates` 时 emit `coverage_gap`（含 `uncovered_top_level_dirs` 计数、`sample[]`、`ignored_dir_patterns`、`advisory` 文案）。`git-repo / non-git-folder / invalid-target` 模式不 emit；future P2 若通过 contract gate 新增 mode，必须显式补入此列表和所有 positive enum consumers。
- R3. `reason_code="workspace-target-required"` 的 `next_action` 按 `git_health.status` 分支：`broken-worktree` 推荐 `spec-first repair-worktree`，`corrupted-gitdir` 推荐 `git fsck`，`not-git` 保留现有文案。

**修复子命令（R4）**

- R4. 新增 `spec-first repair-worktree --dry-run`（默认 dry-run，可省略显式参数）；P1 只提供诊断与 unlink preview，不执行删除。dry-run 输出含时间戳 advisory、当前 `.git` pointer 摘要、unlink preview、手动修复命令建议、`--folder .` workaround 提示。`--apply` / `--unlink` 执行态不在本计划实现范围，必须作为独立 follow-up 设计并要求 dry-run fingerprint/token 绑定。

**Readiness 集成（R5）**

- R5. `verify-tools.{sh,ps1}` 把 `git_health` / `coverage_gap` 写入 readiness ledger v2 的 `parent_workspace_advisory` 节点，不进入 `baseline_ready` 计算；`broken-worktree` 暴露 `repair_command`，`corrupted-gitdir` 暴露 `diagnostic_command`，两者不共用 `repair_action_available`。

**P2 contract gate（R6-R8，设计待决，不在本计划实现）**

- R6. P2 启动前必须先确定 mixed-topology 配置事实源。默认禁止复用 parent `.spec-first/config.local.yaml`；候选方案是 parent advisory artifact（例如 `.spec-first/workspace/mixed-topology-targets.json|yaml`）或显式 CLI manifest。任何方案都必须保留 parent workspace advisory-only 边界，不能让 parent 拥有 repo-local `.spec-first/config/*`、`.spec-first/graph/*`、`.spec-first/providers/*`、`.spec-first/impact/*` truth。
- R7. P2 启动前必须先确定 artifact / consumer contract。默认不新增 `workspace-mixed-topology` mode；优先评估在现有 `mode="workspace-multi-repo"` / `git_root_topology="multi-repo-workspace"` 上附加 advisory `additional_folder_targets[]`。只有至少两个 downstream consumers 需要不同控制流时，才通过 contract update 引入新 mode。
- R8. P2 启动前必须先验证 provider-facing 接口：GitNexus 是否支持 exclude / label 参数、`computed_exclude` 如何进入 provider command allowlist、folder content fingerprint 是否使用同一 exclude 集合、folder target 是否仍只是 orientation evidence。未验证前，`bootstrap-providers --all-repos` 不自动追加 `--folder` 调用；只在 docs/SKILL 中提示显式手动 `--folder <path>` workaround。

**Origin actors:** A1 (Developer), A2 (spec-mcp-setup), A3 (spec-graph-bootstrap), A4 (using-spec-first — 已在 Deferred 段排除，不影响本计划实现范围), A5 (spec-first 维护者)

**Origin flows:** F1 (broken worktree 诊断暴露), F2 (coverage gap 可见性), F3 (修复指引 preview-first), F4 (显式拓扑配置覆盖), F5 (当前可用 workaround)

**Origin acceptance examples:**
- AE1: kaz-mvp broken-worktree → 诊断报告含 `git_health.status="broken-worktree"` + `coverage_gap.uncovered_top_level_dirs=35` + next_action repair-worktree 文案（covers R1, R2, R3）
- AE2: `spec-first repair-worktree --dry-run` 输出 unlink preview + 手动 git 修复建议两段（covers R4）
- AE3: `spec-first repair-worktree --dry-run` 在非 broken-worktree 状态下拒绝给出 unlink preview，并输出对应 reason_code（covers R4）
- AE4: P2 gate 文档明确 parent config authority、artifact authority、consumer list、provider exclude/label/fingerprint 结论；gate 未通过时只推荐显式 `--folder .` workaround，不承诺自动 all-repos 覆盖（covers R6, R7, R8）

---

## Assumptions

- A1. schema v2 是 v1 的超集，已有消费者（`write-provider-config`、`verify-tools`、`bootstrap-providers`）按字段存在与否做降级，不对 `schema_version` 字面值做精确比较；可执行 source/test grep 确认 4 处硬编码：`resolve-project-target.sh:346`、`.sh:378`、`.ps1:99`，以及 `tests/unit/mcp-setup-powershell-contracts.test.js:134`（对 `.ps1` 源码的字面值断言）——均须更新到 `v2`。历史 docs 中对 `project-target.v1` 的旧 contract 引用不计入执行残留。
- A2. P2 不默认实现 YAML parser。若后续 contract gate 选择 YAML 配置，不能在 shell 中硬编码 `node bin/spec-first.js internal ...`；必须使用 source checkout / `$SPEC_FIRST_CLI` / installed `spec-first` 三段定位模式，或引入 direct production YAML dependency 并用 schema 校验限制字段。若只是单个 advanced opt-in 配置，优先考虑 deterministic JSON advisory artifact。
- A3. `workspace-mixed-topology` 不是当前默认决策。当前更小方案是在 `workspace-multi-repo` 上附加 advisory `additional_folder_targets[]`；新增 mode 需要 contract-first 证明和完整 consumer list。
- A4. `resolve-workspace-graph-targets.{sh,ps1}` 对 mode 做正向枚举（L528 / L545 处），因此任何新增 mode 都必须先列出并更新所有正向枚举 consumers；在 gate 通过前不修改这些 consumers。
- A5. P2 开发依赖 U12 contract + provider spike 同时通过；任一 gate fail / inconclusive 时，P2 保持 deferred，只提供显式 `--folder` workaround 文档。

---

## Scope Boundaries

- P2 配置驱动 mixed topology 自动覆盖：改为 follow-up gate，不在本计划实现。原因是 parent workspace config authority、artifact owner、consumer contract、provider exclude/fingerprint 接口尚未成立。
- P3 混合拓扑 first-class（graph-providers.json multi-target 数组、单次调用统一 child + folder）：改动面过大，等 ≥2 个组织再次报告同类痛点再启动。
- P3 `parent_role` 枚举扩展（monorepo / multi-repo-workspace / advisory-only）：仅在有真实需求时立项。
- P3 高级修复（`--convert-to-repo`、`--retarget-worktree`、`repair-worktree --apply`）：故障面超出 spec-first 诊断/引导职责，P1 只实现 dry-run 诊断与手动命令建议；执行删除必须另开 follow-up。
- GitNexus 1.6.5 native crash 兜底（hscomponents / userinfo Napi::Error）：上游 GitNexus 问题，本计划只在 P0 readiness ledger 多记录 `provider_runtime_advisory.crash_frequency` advisory 字段。
- 自动 broken worktree 修复：`repair-worktree` 永远 preview-first，spec-mcp-setup 不自动调用；本计划不实现删除 `.git` 的 apply path。
- A4 (`using-spec-first` guide-mode broken-worktree 推荐，actor A4）：已在 Deferred 段排除，不影响本计划实现范围；触发条件：P1 落地后有用户反馈 broken-worktree 导航困难，由维护者发起独立 plan。

### Deferred to Follow-Up Work

- `using-spec-first` guide-mode 在 broken-worktree 状态下推荐 `spec-first repair-worktree`（A4）：P1 落地后再根据用户反馈决策，独立 plan。
- `spec-first init` 交互式向导识别 broken worktree 并打印 advisory（OQ3）：折中方案（只检测打印，不自动调）待 P1 落地后决策。
- mixed topology 配置事实源、schema 与数组上限（OQ6/OQ7）：移入 P2 contract gate。默认不使用 parent `.spec-first/config.local.yaml`。
- `repair-worktree --apply` 是否需要实现：移入独立 follow-up。若实现，dry-run 必须输出 `.git` 文件 hash / pointer / canonical path 等 fingerprint，apply 必须绑定该 fingerprint。

---

## Graph Readiness

- target_repo: spec-first
- status: stale
- source_revision: HEAD (leo-2026-05-27-gitnexus-update)
- current_revision: stale — dirty-advisory (graph-affecting-blocked)
- stale: true
- primary_providers: gitnexus
- degraded_providers: none
- fallback_capabilities: grep, Read
- runtime_mcp_evidence: graph-facts.json query_global_graph=true; freshness=stale; dirty_classification=graph-affecting-blocked
- confidence: medium — snapshot 可用于 definition 查找，但 process graph / impact / related tests 不可信
- limitations: snapshot_mismatch, definitions_only_no_process_graph, definitions_only_no_impact_evidence, definitions_only_no_related_tests

---

## Graph / GitNexus Evidence

- provider: GitNexus
- native_tool_or_resource: graph-facts.json (`.spec-first/graph/graph-facts.json`)
- repo_scope: spec-first
- capability_status: partial
- evidence_grade: stale
- evidence_posture: fallback
- freshness_state: stale
- source_tags: [checked-in-baseline, session-local-inference]
- source_contract_fields: query_global_graph, freshness, dirty_classification, primary_providers
- source_reads_required: `skills/spec-mcp-setup/scripts/resolve-project-target.sh`, `skills/spec-mcp-setup/scripts/verify-tools.sh`, `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`, `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh`
- impact_on_plan: 研究阶段已通过直接 Read + grep 确认所有关键 line number；GitNexus impact graph 不可信，未用于 impact 分析
- capabilities_used: definition lookup (partial)
- key_findings: graph snapshot stale + dirty；所有关键触点已通过源码读取直接确认
- limitations: definitions_only_no_process_graph, definitions_only_no_impact_evidence, definitions_only_no_related_tests

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-mcp-setup/scripts/resolve-project-target.sh:114` — `CWD_GIT_ROOT` 判断，当前静默吞掉所有 git 失败
- `skills/spec-mcp-setup/scripts/resolve-project-target.sh:148-191` — `discover_candidates()`，只列独立 git repo，忽略列表 L163-167 缺 `build`
- `skills/spec-mcp-setup/scripts/resolve-project-target.sh:230-239` — 已有 `non-git-folder` mode first-class 分支
- `skills/spec-mcp-setup/scripts/resolve-project-target.sh:346, 378` — `project-target.v1` 硬编码（.sh 两处）
- `skills/spec-mcp-setup/scripts/resolve-project-target.ps1:99` — `project-target.v1` 硬编码（.ps1 一处）
- `skills/spec-mcp-setup/scripts/verify-tools.sh:360` — `($tools_ready and $helper_ready) as $baseline_ready` — `parent_workspace_advisory` 必须绕过此处
- `skills/spec-mcp-setup/scripts/verify-tools.sh:362-407` — readiness ledger v2 emit 位置
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:632-657` — all-repos child loop；本计划保持不变，future P2 只有在 U12 provider gate 通过后才评估是否追加 folder loop
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:810/1310/1322/2009` — 已有 `TARGET_KIND="non-git-folder"` first-class 分支
- `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh:528` — mode 正向枚举 `workspace-multi-repo`（.ps1:545）；future P2 只有在 contract gate 决定新增 mode 时才修改，否则保持现有 mode 并附加 advisory 字段
- `skills/spec-mcp-setup/scripts/detect-tools.sh` — 已调用 `resolve-project-target --format json`，是 `git_health / coverage_gap` 进入 preflight JSON 的透传路径
- `skills/spec-mcp-setup/scripts/check-health` — 无 `.sh` 后缀（brainstorm typo），独立 preflight health 检查；不作为 `git_health` 字段传递路径
- `skills/spec-mcp-setup/references/config-template.yaml` — repo-local config 模板；本计划不新增 mixed topology 字段，future P2 也默认不选择 parent `.spec-first/config.local.yaml`
- `src/cli/index.js` — CLI if-cascade 路由，`repair-worktree` 分支模式
- `src/cli/commands/` — 现有 `clean.js / doctor.js / init.js / internal.js / session.js / tasks.js`，`repair-worktree.js` 新增
- `tests/unit/spec-graph-bootstrap.sh:446` — broken-worktree fixture 模式，可复用

### Institutional Learnings

- `docs/solutions/` — spec-first source-only 原则：不手改 generated runtime mirror；source 变更后用 `spec-first init` 修复 runtime drift
- preview-first 原则：任何未来写操作必须先给用户 dry-run 预览；本计划 P1 只提供 dry-run 与手动修复指引，不实现 apply path

### External References

- GitNexus `analyze --skip-git` 支持 non-git folder 索引（已在 2026-05-25-001 gitnexus-only-graph-provider 需求文档确认）
- `docs/brainstorms/2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal.md` — 源 brainstorm v0.2（R-ID、F-ID、A-ID 来源）

---

## Key Technical Decisions

- **schema v2 是 v1 的超集，backward-compat**：已有消费者按字段存在/缺失降级，不校验 `schema_version` 字面值；全仓 4 处硬编码需更新（含 `tests/unit/mcp-setup-powershell-contracts.test.js:134` 字面值断言）。
- **共享忽略列表变量**：`discover_candidates` 的 case 模式和 `coverage_gap.ignored_dir_patterns` 引用同一 shell 变量（加入 `build`），避免未来分叉。
- **P2 配置事实源后置到 contract gate**：本计划不实现 YAML parser，也不把 parent `.spec-first/config.local.yaml` 当作权威配置源。future P2 优先评估 parent advisory artifact 或显式 CLI manifest；若选择 YAML，必须使用安装态可定位的 helper wrapper 或 direct production dependency + schema 校验。
- **默认不新增 `workspace-mixed-topology` mode**：当前最小方案是在既有 `workspace-multi-repo` / `multi-repo-workspace` 上附加 advisory fields。只有 U12 证明至少两个 downstream consumers 需要不同控制流时，才引入新 mode 并同步所有 positive enum consumers。
- **U12 是 P2 硬前置**：U12 不只是 GitNexus label/perf spike，还必须回答 parent config authority、artifact write boundary、consumer list、mode decision、provider exclude/label/fingerprint/perf。任一 gate fail / inconclusive 时，P2 不开发。
- **repair-worktree 本计划 dry-run only**：P1 不实现 `--apply` / `--unlink` 删除路径；未来若另开 apply follow-up，必须使用 dry-run fingerprint/token 绑定并重新设计并发修改防护。
- **`parent_workspace_advisory` 不进 `baseline_ready`**：`verify-tools.sh:360` 的 `$baseline_ready` 只由 `$tools_ready and $helper_ready` 决定，advisory 节点不阻塞下游 workflow。

---

## Open Questions

### Resolved During Planning

- **GitNexus non-git folder 在 multi-target 场景下的 label 唯一性**：升级为 P2 provider gate（U12）；provider gate 失败则 R8 降级为显式 `--folder` workaround。
- **broken-worktree 检测在 Windows PowerShell 下的实现**：已下沉到 R1 + U2；`.git` 文件解析须 CRLF 规范化 + 反斜杠路径处理，fixture case 已列入 U7。
- **P2 exclude pattern 形式**：不在本计划固定。`computed_exclude` 必须等 U12 定义 provider command allowlist、folder fingerprint 与 exclude 集合对齐语义后，才能进入 future P2。
- **混合拓扑 GitNexus 索引时间预估**：已升级为 P2 前置实测（U12）；>5 分钟触发耗时 advisory，>15 分钟触发二次设计讨论。

### Resolved During Follow-Up Review (2026-05-27)

- **U6 数据流路径选择（低边际成本，高确定性）**：选择路径 A。`detect-tools.{sh,ps1}` 已调用 `resolve-project-target`，P0 只需透传新增字段给 `verify-tools.{sh,ps1}`；不让 `verify-tools` 额外再跑一次 resolver，避免重复诊断和竞态窗口。
- **`repair_action_available` 语义收窄（低边际成本，高确定性）**：仅 `broken-worktree` 为 true 并暴露 `repair_command="spec-first repair-worktree --dry-run"`；`corrupted-gitdir` 改走 `diagnostic_action_available` / `diagnostic_command="git fsck"`，避免把不能由 `repair-worktree` 处理的状态标成可修复。
- **U12 spike 命令形状修正（低边际成本，高确定性）**：当前 `bootstrap-providers.sh` 禁止 `--repo` 与 `--folder` 同次调用；U12 provider gate 改为同一 workspace 下多次顺序调用 child repo 与 parent folder target，并比较 `.gitnexus/meta.json` / canonical artifacts 是否互相覆盖。
- **U13 parser 依赖决策（已被 2026-05-28 review 改写）**：本计划不实现 parser；future P2 若选择 YAML，不能硬编码 `node bin/spec-first.js`，必须走 source helper / `$SPEC_FIRST_CLI` / installed `spec-first` wrapper 或 direct dependency。
- **P1 状态写入风险口径修正（已被 2026-05-28 review 改写）**：P0 只读；P1 只做 dry-run preview，不实现删除 `.git` 的 apply path。
- **`project-target.v1` grep 范围收窄（低边际成本，高确定性）**：执行验证只要求 `skills/`、`src/`、`tests/` 中无旧 schema emit / 字面值消费者残留；历史计划、brainstorm 和本计划中的旧 contract 引用允许保留或加说明。

### Deferred to Implementation

- **`spec-first init` 向导是否检测 broken worktree 并打印 advisory（OQ3）**：折中方案（只检测打印，不自动调 repair-worktree）可行，但具体文案需 P1 落地后结合用户反馈决定。
- **`additional_folder_targets[]` 数组上限（OQ6）**：移入 U12 contract gate。future P2 只有在 artifact authority、consumer status 与输出预算明确后才定义上限。
- **parent 配置版本字段（OQ7）**：移入 U12 contract gate。默认不使用 parent `.spec-first/config.local.yaml`；若 future P2 选择新 advisory artifact，再按 artifact schema 决定版本字段。

### Deferred from doc-review (2026-05-27)

- **P2 Spike gate 过窄（subagent doc-review 2026-05-28）**：原 U12 只验证 GitNexus label/perf，漏掉 parent config authority、artifact write boundary、mode decision、consumer list。已改为 U12 contract + provider 双 gate；P2 gate 未通过前不开发 U13-U16。
- **U15 --label + computed_exclude 接口设计（doc-review P2-1）**：`bootstrap-providers.sh` 当前无 `--label` 参数，`computed_exclude` 传递机制未定义。U12 必须包含 provider-facing exclude/label/fingerprint contract；没有该 contract 时，P2 只能文档引导手动 `--folder`。
- **U15 CANDIDATE_COUNT=0 gate bypass（doc-review P2-2）**：`bootstrap-providers.sh:L593` 在 0 child git repo 时 exit 1，阻塞 folder-only 拓扑。该问题保留为 P2 follow-up 的测试要求，不再纳入本计划 active scope。
- **workspace-mixed-topology 是否需要独立 mode（doc-review P2-3）**：当前唯一消费者 `resolve-workspace-graph-targets.sh` 对新 mode 与 `workspace-multi-repo` 走同一处理路径。默认不新增 mode；只有 contract gate 证明至少两个 consumer 需要不同控制流时才引入。
- **parent `.spec-first/config.local.yaml` authority 冲突（subagent doc-review 2026-05-28）**：parent workspace 当前 advisory-only，不拥有 repo-local config/graph/provider/impact truth。P2 默认不得使用 parent `.spec-first/config.local.yaml`，必须选择 parent advisory artifact 或显式 CLI manifest。
- **`repair-worktree --apply` 安全承诺过强（subagent doc-review 2026-05-28）**：无 dry-run fingerprint 时，apply 只能判断当前仍是 broken-worktree，不能证明它是 dry-run 时同一个 `.git` pointer。本计划移除 apply path。

---

## High-Level Technical Design

> *方向性引导，不是实现规范。实现者按需调整。*

### P0/P1/P2 依赖关系

```
P0 ─────────────────────────────────────────► P1
 │  (R1 broken-worktree detection)              │  (R4 repair-worktree cmd)
 │  (R2 coverage_gap)                           │  (depends on P0 detect_git_health)
 │  (R5 readiness ledger advisory)              │
 └─────────────────────────────────────────────►│
                                                 │
P0 + P1 done ──────────────────────────────► Spike / Gate (U12)
                                                 │
                                      ┌──────────┘
                                      │  (contract authority decided)
                                      │  (provider exclude/label/fingerprint verified)
                                      ▼
                                  Deferred P2
                       (new follow-up plan only after gates pass)
```

### detect_git_health() 四态状态机

```
input: <dir>
  │
  ├─ has no .git entry?              → status: "not-git"
  │
  ├─ .git is file?
  │   ├─ read first line → "gitdir: <ptr>"
  │   │   ├─ <ptr> exists?           → status: "ok" (healthy worktree)
  │   │   └─ <ptr> missing?          → status: "broken-worktree"
  │   │                                 emit worktree_pointer.exists=false
  │   └─ cannot parse as gitdir:     → status: "corrupted-gitdir"
  │
  └─ .git is directory?
      ├─ git rev-parse succeeds?     → status: "ok"
      └─ git rev-parse fails?        → status: "corrupted-gitdir"
```

### Deferred P2 target declaration sketch（非当前实现规范）

P2 若重新立项，目标声明必须是 parent advisory artifact 或显式 CLI manifest，不得默认写入 parent `.spec-first/config.local.yaml`。候选字段：

- `path`: workspace 内目录；必须存在、是目录、不上溯、不 symlink escape、且不得位于任何 Git repo 内。
- `label`: 显式指定，避免和 child git repo label 冲突。
- `extra_exclude`: optional；具体语法取决于 provider-facing exclude contract，不在本计划决定。
- `status`: `configured | validated | bootstrap-deferred | bootstrap-written | spike-failed`；只有 `bootstrap-written` 可作为覆盖完成事实，其余都是 advisory。

computed_exclude（脚本确定性工作）：
```
final_exclude = discovered_child_git_roots
              ∪ IGNORE_LIST (含 build)
              ∪ user_extra_exclude
```

该计算只有在 U12 provider contract 证明 GitNexus command、command allowlist 和 folder fingerprint 都能消费同一 exclude 集合后，才能进入实现。

---

## Implementation Units

### U1. detect_git_health() — resolve-project-target.sh

**Goal:** 在 `.sh` 中提取 `detect_git_health()` 函数，识别 broken-worktree / corrupted-gitdir / not-git / ok 四态；替换 L114 的静默 `2>/dev/null || true`；`discover_candidates` 内部对 broken child 记录 `candidates_diagnostics[]`，不进 `candidate_roots`。

**Requirements:** R1

**Dependencies:** None

**Files:**
- Create: `skills/spec-mcp-setup/scripts/lib-git-health.sh`（提取为可 source 的纯函数库，仅含 `detect_git_health()` 及相关辅助函数，无顶层副作用）
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.sh`

**Approach:**
- 将 `detect_git_health()` 函数提取到新建 `lib-git-health.sh`（纯函数库，无参数解析循环和 exit 调用），供 resolve-project-target.sh 和 repair-worktree.sh 双方 source
- `resolve-project-target.sh` 顶部 `source "$SCRIPT_DIR/lib-git-health.sh"`
- 替换 L114 使用 `detect_git_health "$INVOCATION_CWD"`
- 在 `discover_candidates` 循环（L148-191）内，对有 `.git` 但 `git rev-parse` 失败的 child 调用 `detect_git_health`，将诊断结果追加到 `candidates_diagnostics[]` 数组变量，不进 `candidate_roots`
- `candidates_diagnostics` 只在非空时输出

**Patterns to follow:**
- `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh:528` — mode 分支模式
- `tests/unit/spec-graph-bootstrap.sh:446` — broken-worktree fixture 模式

**Test scenarios:**
- Happy path: `.git` 目录 + `git rev-parse` 成功 → `git_health.status="ok"`
- Edge case: `.git` 是文件，内容 `gitdir: /missing/path` → `status="broken-worktree"`, `worktree_pointer.exists=false`
- Edge case: `.git` 是目录但 HEAD 缺失 → `status="corrupted-gitdir"`
- Edge case: 无 `.git` → `status="not-git"`
- Error path: child 子目录有 broken `.git` → 不进 `candidate_roots`，出现在 `candidates_diagnostics[]`

**Verification:**
- 现有 workspace-multi-repo 和 git-repo 用例全部通过
- 新增 broken-worktree fixture 验证 `git_health.status="broken-worktree"` 和 `worktree_pointer.exists=false`
- `candidates_diagnostics` 仅在有 broken/corrupted child 时出现

---

### U2. detect_git_health() — resolve-project-target.ps1

**Goal:** 与 U1 同步实现 `.ps1` 版 `detect_git_health`，处理 CRLF 规范化和 Windows 反斜杠路径。

**Requirements:** R1

**Dependencies:** U1（逻辑已在 U1 明确，.ps1 同步实现）

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.ps1`

**Approach:**
- 读取 `.git` 文件时 trim CRLF（`[System.IO.File]::ReadAllText` + `.TrimEnd(['\r','\n'])`）
- 路径解析时将 `\` 规范化为 `/`，对 `gitdir: C:\Users\...` 格式验证目标路径
- `schema_version` 硬编码处（L99）更新为 `project-target.v2`

**Test scenarios:**
- Edge case: `.git` 文件内容 `gitdir: C:\Users\foo\.git\worktrees\bar\r\n` → `status="broken-worktree"` + 路径规范化后 exists=false

**Verification:**
- Windows 路径解析 fixture 通过
- CRLF fixture 通过

---

### U3. 共享忽略列表 + compute_coverage_gap() — resolve-project-target.sh

**Goal:** 把 `discover_candidates` 的 case 模式（L163-167）提取为共享 shell 变量，加入 `build`；新增 `compute_coverage_gap()` 函数，在 workspace 模式下扫描顶级未覆盖目录并输出 `coverage_gap` 字段。

**Requirements:** R2

**Dependencies:** U1（`discover_candidates` 完成后才能计算 coverage_gap）

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.sh`

**Approach:**
- 提取 `IGNORE_DIR_PATTERN`（或等价 shell 数组）覆盖 L163-167 的 case 模式
- `IGNORE_DIR_PATTERN` 包含 `.git node_modules vendor .claude .codex .agents .spec-first build .cache .direnv .venv`
- `compute_coverage_gap()` 在 `discover_candidates` 之后运行，遍历顶级目录，排除 child git roots + IGNORE_DIR_PATTERN，计数 + 取前 7 个字典序 sample
- 按 R2 emit 条件决定是否将 coverage_gap 写入输出；`git-repo / non-git-folder / invalid-target` 模式不 emit

**Test scenarios:**
- Happy path: 父级有 35 个非 git 顶级目录 + 6 child git repo → `uncovered_top_level_dirs=35`，sample 前 7 个，child git roots 不出现在 sample
- Edge case: `build` 目录在父级 → 不出现在 uncovered_top_level_dirs（被 IGNORE_DIR_PATTERN 过滤）
- Integration: `discover_candidates` 的 case 语句和 `coverage_gap.ignored_dir_patterns` 引用同一变量，两者对 `build` 行为一致

**Verification:**
- `IGNORE_DIR_PATTERN` 被 `discover_candidates` 和 `compute_coverage_gap` 两处引用（可 grep 验证）
- git-repo / non-git-folder 模式下 `coverage_gap` 不出现在输出

---

### U4. 共享忽略列表 + coverage_gap — resolve-project-target.ps1

**Goal:** 与 U3 同步实现 `.ps1` 版共享忽略列表和 `coverage_gap` 计算。

**Requirements:** R2

**Dependencies:** U3（逻辑已明确）

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.ps1`

**Verification:**
- .ps1 与 .sh 的 `ignored_dir_patterns` 输出一致

---

### U5. schema v2 emit + next_action 分支 — resolve-project-target.sh/.ps1

**Goal:** `schema_version` 硬编码由 `v1` 更新为 `v2`；emit `git_health` / `coverage_gap` / `candidates_diagnostics`；`next_action` 按 `git_health.status` 分支输出文案；前置可执行 source/test schema_version 影响面 grep 并输出到 plan 注释。

**Requirements:** R1, R2, R3

**Dependencies:** U1, U2, U3, U4

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.sh` (L346, L378)
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.ps1` (L99)
- Modify: `tests/unit/mcp-setup-powershell-contracts.test.js` (L134：将字面值断言从 `project-target.v1` 更新为 `project-target.v2`)

**Approach:**
- 在 `skills/`、`src/`、`tests/` 下 grep `"project-target\.v1"` 确认执行影响面（已知 4 处；如发现其他消费者做字面值比较，按"接受 v2 超集"或"显式版本判断"二选一处理）
- 更新 4 处硬编码（含 contract test）
- 在 emit 函数中按 R2 emit 条件条件性输出 `coverage_gap`；始终 emit `git_health`（含 status）
- `next_action` 按 git_health.status 三分支：broken-worktree / corrupted-gitdir / not-git（不变）

**Test scenarios:**
- Happy path: output JSON 含 `schema_version="project-target.v2"` 和 `git_health.status`
- Edge case: broken-worktree → next_action 含 `spec-first repair-worktree`
- Edge case: corrupted-gitdir → next_action 含 `git fsck`

**Verification:**
- `rg "project-target\.v1" skills src tests` 无旧 schema emit / 字面值消费者残留；历史 docs 中对旧 contract 的引用允许保留

---

### U6. readiness ledger v2 parent_workspace_advisory — detect-tools + verify-tools

**Goal:** `detect-tools.{sh,ps1}` 将 `resolve-project-target` 的 `git_health / coverage_gap / candidates_diagnostics` 透传进 preflight JSON；`verify-tools.{sh,ps1}` 在 readiness ledger v2 中新增 `parent_workspace_advisory` 节点（含 `git_health / coverage_gap / candidates_diagnostics / repair_action_available / repair_command / diagnostic_action_available / diagnostic_command`），不进入 `baseline_ready` 计算。

**Requirements:** R5

**Dependencies:** U5

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/detect-tools.sh`
- Modify: `skills/spec-mcp-setup/scripts/detect-tools.ps1`
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.sh`
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.ps1`

**Approach:**
- 采用路径 A：`detect-tools.{sh,ps1}` 已调用 `resolve-project-target --format json`，在 `$FACTS_JSON` 中仅透传 P0 字段：`git_health / coverage_gap / candidates_diagnostics`
- `check-health` 仍保留独立 preflight health 检查，不作为 git_health 字段传递路径，本计划不修改它
- `verify-tools.{sh,ps1}` 在 readiness ledger emit 段从 `$facts` 读取新增字段并构建 `parent_workspace_advisory` 对象；L360 的 `$baseline_ready` 计算不改动
- `repair_action_available=true` 当且仅当 `git_health.status == "broken-worktree"`；对应 `repair_command="spec-first repair-worktree --dry-run"`
- `diagnostic_action_available=true` 当且仅当 `git_health.status == "corrupted-gitdir"`；对应 `diagnostic_command="git fsck"` 或平台等价建议

**Test scenarios:**
- Integration: broken-worktree workspace → readiness ledger 含 `parent_workspace_advisory.git_health.status="broken-worktree"`，`baseline_ready` 仍为 `true`（tools 就绪时）
- Integration: corrupted-gitdir workspace → `repair_action_available=false`，`diagnostic_action_available=true`，next action 指向 `git fsck`
- Edge case: healthy workspace → `parent_workspace_advisory` 出现但 `git_health.status="ok"`，`coverage_gap` 仅在 workspace 模式下出现

**Verification:**
- `baseline_ready` 计算路径（L360）无改动，现有 setup 验证用例全通过
- `detect-tools` 输出的 preflight JSON 含 `git_health / coverage_gap`；`verify-tools` 输出的 readiness ledger 含 `parent_workspace_advisory` 节点

---

### U7. P0 contract tests + SKILL.md + docs

**Goal:** P0 所有新行为的 contract / integration 测试；`skills/spec-mcp-setup/SKILL.md` 补充 git_health / coverage_gap / candidates_diagnostics / 扩展 next_action 语义说明；用户手册和架构文档同步。

**Requirements:** R1, R2, R3, R5

**Dependencies:** U1–U6

**Files:**
- Create / Modify: `tests/integration/spec-mcp-setup/broken-worktree-*.sh`（父级和 child 两种场景 fixture）
- Create / Modify: `tests/integration/spec-mcp-setup/coverage-gap-*.sh`
- Create / Modify: `tests/integration/spec-mcp-setup/crlf-windows-path-*.sh`（CRLF + Windows 路径 fixture）
- Modify: `skills/spec-mcp-setup/SKILL.md`
- Modify: `docs/02-架构设计/`（v2 schema 描述）
- Modify: `docs/05-用户手册/`（broken-worktree 章节）

**Test scenarios:**
- Integration: broken-worktree fixture（父级）→ `git_health.status="broken-worktree"` + `worktree_pointer.exists=false` + next_action 含 repair-worktree
- Integration: broken-worktree fixture（child）→ 不进 `candidate_roots`，出现在 `candidates_diagnostics[]`
- Integration: corrupted-gitdir fixture → `git_health.status="corrupted-gitdir"` + next_action 含 `git fsck`
- Integration: coverage-gap fixture → `uncovered_top_level_dirs` 计数正确，sample 不含 child git roots
- Integration: CRLF + Windows 路径 fixture → `detect_git_health()` 正确解析
- Integration: ignore list 共享变量 → `discover_candidates` 和 `coverage_gap` 对 `build` 目录行为一致
- Integration: 现有 not-git workspace + single git repo 用例全通过

**Verification:**
- `npm run test:integration` P0 相关用例全绿
- SKILL.md 含 git_health / coverage_gap / candidates_diagnostics 词条

---

### U8. repair-worktree.sh

**Goal:** 新增 `skills/spec-mcp-setup/scripts/repair-worktree.sh`，只实现 `--dry-run`（默认，可省略显式参数）；输出时间戳 advisory + `.git` pointer 摘要 + unlink preview + 手动 git 修复建议文案两段 + `--folder .` workaround。P1 不实现 `--apply` / `--unlink` 执行态。

**Requirements:** R4

**Dependencies:** U1（`lib-git-health.sh` 在 U1 中提取，repair-worktree.sh source 该文件复用 `detect_git_health()`）

**Files:**
- Create: `skills/spec-mcp-setup/scripts/repair-worktree.sh`

**Approach:**
- 脚本顶部 `source "$SCRIPT_DIR/lib-git-health.sh"` 复用 `detect_git_health()`；不 source `resolve-project-target.sh`（该脚本有顶层参数解析循环和 `exit` 调用，source 会立即触发副作用）
- dry-run：调用 `detect_git_health`；确认 `broken-worktree` 后输出 ISO8601 时间戳 advisory + `.git` 文件路径 + pointer target + unlink preview（列出用户可手动删除的 `.git` 文件路径）+ 手动 git 修复建议文案（两段固定文案）+ `spec-first ... --folder .` workaround 提示
- `--apply` / `--unlink`：显式拒绝，输出 reason_code `repair-worktree-apply-deferred`，说明执行删除已拆到 follow-up，当前命令只做 preview
- 非 broken-worktree 状态（健康 repo、corrupted-gitdir）下拒绝操作并说明原因
- 不引入外部锁文件

**Approach / detect → unlink 顺序：**
```
dry-run: detect_git_health() → print preview → exit 0
--apply/--unlink: print deferred reason → exit 1
```

**Test scenarios:**
- Happy path dry-run: broken-worktree fixture → preview 含 ISO8601 时间戳 advisory + unlink preview + 手动 git 修复建议两段
- Error path: 非 broken-worktree 状态（健康 repo）→ 拒绝操作，exit 1
- Error path: `--apply` 或 `--unlink` → `repair-worktree-apply-deferred`，exit 1，不删除任何文件

**Verification:**
- dry-run 输出包含时间戳 advisory、unlink preview、手动修复建议文案两段
- `--apply` / `--unlink` 不删除 `.git`
- 健康 repo 和 corrupted-gitdir 均被拒绝

---

### U9. repair-worktree.ps1

**Goal:** 与 U8 同步实现 `.ps1` 版 `repair-worktree --dry-run`，处理 Windows CRLF 和路径展示；不执行文件删除。

**Requirements:** R4

**Dependencies:** U8（逻辑已明确）

**Files:**
- Create: `skills/spec-mcp-setup/scripts/repair-worktree.ps1`

**Verification:**
- .ps1 与 .sh 的 dry-run 输出结构一致
- `--apply` / `--unlink` 在 Windows 上同样拒绝执行删除

---

### U10. CLI 路由 — repair-worktree 子命令

**Goal:** 在 `src/cli/index.js` 新增 `repair-worktree` 分支，新增 `src/cli/commands/repair-worktree.js` 路由到对应 shell / ps1 dry-run 脚本；`bin/spec-first.js` 无需改动（thin wrapper）。

**Requirements:** R4

**Dependencies:** U8, U9

**Files:**
- Modify: `src/cli/index.js`
- Create: `src/cli/commands/repair-worktree.js`

**Approach:**
- `src/cli/commands/` 目录无现有 shell 子进程 dispatch 模式（init.js 是纯 JS，无 bash/pwsh 调用）；本 unit 需新建 dispatch pattern
- 使用 `child_process.execFileSync` 或 `spawnSyncWithTimeout`（参考 `src/cli/external-command.js` 的 git 调用模式），按平台（macOS/Linux → `bash`，Windows → `pwsh`）分发到对应脚本
- 脚本路径通过 `REPO_ROOT + 'skills/spec-mcp-setup/scripts/repair-worktree.{sh,ps1}'` 解析
- 传递 `--dry-run` 参数到脚本；`--apply` / `--unlink` 也透传给脚本并由脚本 fail closed
- 不改动 `bin/spec-first.js`（thin wrapper 不感知命令列表）
- 在 `repair-worktree.js` 和 U10 PR 中文档化此 pattern 作为未来 shell-dispatch 命令的参考

**Patterns to follow:**
- `src/cli/external-command.js` — shell 子进程调用方式（spawnSyncWithTimeout）
- `src/cli/index.js` — if-cascade 路由模式

**Test scenarios:**
- Happy path: `spec-first repair-worktree --dry-run` 在 broken-worktree workspace → 打印 preview 并 exit 0
- Error path: `spec-first repair-worktree --apply` → exit 1 + `repair-worktree-apply-deferred`，不删除 `.git`
- Error path: `spec-first repair-worktree --dry-run` 在健康 repo → exit 1 + 拒绝文案

**Verification:**
- `npm run test:smoke` 含 `repair-worktree` 子命令可调用验证
- CLI help 包含 repair-worktree 条目

---

### U11. P1 tests + docs

**Goal:** repair-worktree dry-run 的 integration tests + 用户手册更新。

**Requirements:** R4

**Dependencies:** U8–U10

**Files:**
- Create: `tests/integration/spec-mcp-setup/repair-worktree-dry-run.sh`
- Create: `tests/integration/spec-mcp-setup/repair-worktree-apply-deferred.sh`
- Modify: `docs/05-用户手册/`（repair-worktree 使用文档）

**Test scenarios:**
- Integration: dry-run 输出文案结构（时间戳 advisory + unlink preview + 手动修复建议）
- Integration: 非 broken-worktree fixture → dry-run 和 apply 都拒绝
- Integration: apply/unlink 不删除 `.git`，输出 `repair-worktree-apply-deferred`

**Verification:**
- `npm run test:integration` P1 用例全绿
- 用户手册含 repair-worktree dry-run 章节，并明确删除 `.git` 仍由用户手动执行或另行 follow-up

---

### U12. P2 contract + provider spike（Deferred P2 前置）

**Goal:** 在 P2 重新立项前，先验证两个 gate：一是 parent workspace 配置事实源、artifact authority、consumer 边界是否能保持 advisory-only；二是 GitNexus 多 target label / exclude / folder fingerprint / 耗时是否支持自动 folder bootstrap。记录结论作为 follow-up P2 plan 的输入；本计划不据此直接开发 U13-U16。

**Requirements:** R6, R7, R8（P2 前置 gate）

**Dependencies:** U1–U11 done（P0 + P1 稳定后 spike）

**Files:**
- Create: `docs/plans/spike/2026-05-27-spike-mixed-topology-contract-provider.md`（spike / gate 结论文档）

**Approach:**
- Contract gate 先回答：
  - parent mixed topology 配置事实源在哪里：parent advisory artifact、显式 CLI manifest，还是其它；默认禁止 parent `.spec-first/config.local.yaml`
  - folder target artifact 写在哪里、authority_level 是什么、哪些 consumers 可读取
  - `workspace-graph-targets.v1` / `workspace-gitnexus-readiness.v1` 是否需要版本化；若不版本化，folder targets 如何作为 advisory orientation 而不进入 group/readiness fan-out
  - 是否需要新增 `workspace-mixed-topology` mode；默认答案为否，除非列出至少两个需要不同控制流的 consumers
  - `additional_folder_targets[].status` 闭集和 consumer 规则，确保 `configured` / `validated` / `bootstrap-deferred` / `spike-failed` 不被误判为覆盖完成
- 在 kaz-mvp 工作区按当前 CLI 支持的形状做多次顺序调用：先对 1-2 个 child repo 分别运行 `bootstrap-providers.sh --repo <child>`，再运行 `bootstrap-providers.sh --folder .`；不得使用当前被 `bootstrap-providers.sh` 禁止的 `--folder . --repo <child>` 同次参数组合
- 观察 `.gitnexus/meta.json`、`.spec-first/graph/*`、`.spec-first/providers/*`、`.spec-first/impact/*` 在多 target 顺序写入后的 label / target identity 行为
- 记录：label 是否全局唯一、同一 workspace 多次调用是否互相覆盖、是否存在需要显式 label 参数的约束，以及现有 CLI 是否需要新增 `--label` 或等价参数
- 验证 GitNexus 是否有 provider-facing exclude 参数；若有，记录参数名、command allowlist 更新方式、Bash/PowerShell parity 和 folder_content_fingerprint 是否应用同一 exclude 集合；若无，自动 folder bootstrap 默认不可进入实现
- 实测 `bootstrap-providers --folder .` 在 kaz-mvp（~30 个非 git 顶级目录）的端到端耗时
- 按耗时区间（≤5 分钟 / 5-15 分钟 / >15 分钟）决定 P2 的 advisory 策略

**Spike P2 闸门：**
- Contract gate 和 provider gate 均通过 → 另开 P2 follow-up plan；不得在本计划内直接实现
- 任一 gate fail / inconclusive → P2 延迟，只保留显式 `--folder <path>` workaround 文档

**Gate 未通过时的降级行为（需在 spike 文档中明确）：**
- 不新增 parent `.spec-first/config.local.yaml` 字段
- 不新增 `workspace-mixed-topology` mode
- 不让 `bootstrap-providers --all-repos` 追加 `--folder` 调用
- SKILL.md / 用户手册仅引导用户显式分次调用 `bootstrap-providers --folder <path>` 或宿主 workflow 等价入口

**Spike 文档 `docs/plans/spike/2026-05-27-spike-mixed-topology-contract-provider.md` 最小 schema：**
- `parent_config_authority_decision: advisory-artifact | explicit-cli-manifest | defer`
- `artifact_write_boundary_decision: folder-local-canonical | advisory-only | defer`
- `mode_decision: reuse-workspace-multi-repo | introduce-new-mode | defer`
- `consumer_update_list`: 需要更新的 docs/contracts/scripts/tests
- `label_uniqueness_conclusion: pass | fail | inconclusive`
- `exclude_interface_conclusion: pass | fail | inconclusive`
- `fingerprint_alignment_conclusion: pass | fail | inconclusive`
- `evidence`: 具体 label 冲突场景或一致性证明
- `perf_measurement_seconds`: 端到端耗时（kaz-mvp 实测值）
- `p2_gate_decision: proceed-to-follow-up-plan | defer`
- `u15_interface_proposal` (所有 provider gate pass 时): computed_exclude / label / fingerprint 传递接口设计

**Verification:**
- spike 结论文档存在，含以上必填字段
- 基于 spike 结论另开或不另开 P2 follow-up plan；不直接修改本计划进入 implementation

---

### U13. Deferred P2 sketch — config parser / manifest reader

**Status:** Deferred. 本 unit 是 P2 follow-up 的设计草图，不属于本计划 active implementation。

**Goal:** 在 U12 contract gate 通过后，读取 mixed topology target declaration。默认优先 deterministic JSON advisory artifact 或显式 CLI manifest；若选择 YAML，必须使用安装态可定位的 CLI/helper wrapper，不能在 resolver 中硬编码 `node bin/spec-first.js`。

**Requirements:** R6, R7

**Dependencies:** U12 contract gate pass + new P2 follow-up plan

**Files:**
- Deferred candidate: `src/cli/commands/internal.js`
- Deferred candidate: `skills/spec-mcp-setup/scripts/parse-workspace-config.{sh,ps1}` 或等价 wrapper

**Approach:**
- 不默认手写 YAML 子集解析器；若必须支持 YAML，优先加入 direct production dependency 并做 schema 校验
- wrapper 定位顺序参考 `compile-workspace-gitnexus-readiness.sh`：source helper → `$SPEC_FIRST_CLI internal ...` → `spec-first internal ...`
- 支持字段由 U12 contract gate 决定，至少包含 `path / label / extra_exclude / status`
- 输出标准 JSON 到 stdout；解析失败时 exit 1 + stderr 说明

**Test scenarios:**
- Happy path: source checkout wrapper 可读 target declaration → 正确 JSON
- Happy path: installed runtime 通过 `$SPEC_FIRST_CLI` / `spec-first` 可读 target declaration → 正确 JSON
- Edge case: 无 declaration → 输出 `{}`
- Error path: 无效 declaration → exit 1 + stderr

**Verification:**
- source checkout 与 installed runtime 两种调用形态均通过

---

### U14. Deferred P2 sketch — target validation and advisory fields

**Status:** Deferred. 本 unit 是 P2 follow-up 的设计草图，不属于本计划 active implementation。

**Goal:** 在 U12 gate 决定配置事实源和 mode 策略后，`resolve-project-target.{sh,ps1}` 读取 target declaration 并输出 advisory fields。默认不新增 `workspace-mixed-topology` mode；优先保留 `workspace-multi-repo`，附加 `additional_folder_targets[]` advisory。

**Requirements:** R6, R7

**Dependencies:** U12 contract gate pass + U13 selected reader + new P2 follow-up plan

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.sh`
- Modify: `skills/spec-mcp-setup/scripts/resolve-project-target.ps1`
- Modify: `skills/spec-mcp-setup/scripts/write-provider-config.sh`（输出 `computed_exclude` 用于审计）
- Modify: `skills/spec-mcp-setup/scripts/write-provider-config.ps1`

**Approach:**
- 优先级判断按 R7 修订版：CLI --folder > CLI --repo > CWD_GIT_ROOT 非空 > parent advisory target declaration > 现有 workspace 模式
- 通过 U13 wrapper 获取 JSON，不硬编码 source checkout CLI 路径
- 对每个 `additional_folder_targets[]` 条目执行路径校验：workspace 内、存在、是目录、拒绝 `..`、拒绝 workspace 外、拒绝 symlink escape、拒绝位于任何 Git repo 内
- 计算 `computed_exclude = discovered_child_git_roots ∪ IGNORE_LIST ∪ user_extra_exclude`
- 默认 `mode` 保持 `workspace-multi-repo`；如 U12 决定新增 mode，必须同步更新所有 positive enum consumers

**Test scenarios:**
- Happy path: target declaration 含 `path: "."` + `label: "parent"` → `mode="workspace-multi-repo"` + advisory `additional_folder_targets[]` + `computed_exclude` 含所有 child git roots
- Edge case: `path: "../sibling"` → reason_code `additional-folder-target-uses-parent-ref`
- Edge case: `path: "/outside/workspace"` → reason_code `additional-folder-target-outside-workspace`
- Edge case: path 不存在 → reason_code `additional-folder-target-not-found`
- Edge case: path 位于 child Git repo root 或 child Git repo 子目录 → reason_code `additional-folder-target-inside-git-repo`
- Edge case: 无 target declaration → 行为完全不变（现有 mode 保持）
- Edge case: CLI `--folder <path>` → 忽略 workspace 配置，mode=`non-git-folder`
- Edge case: CWD_GIT_ROOT 非空（修复 broken worktree 后）且 target declaration 存在 → mode=`git-repo`（优先级 3），`parent_workspace_advisory` 输出 advisory 说明 target declaration 在 git-repo 模式下被忽略及原因

**Verification:**
- 无 target declaration 时行为与旧版 100% 一致（regression test）
- path 校验 reason_code 均可触发
- broken-worktree 修复后（CWD_GIT_ROOT 非空）的行为有明确 advisory 输出

---

### U15. Deferred P2 sketch — bootstrap folder loop and workspace targets

**Status:** Deferred. 本 unit 是 P2 follow-up 的设计草图，不属于本计划 active implementation。

**Goal:** 仅在 U12 contract + provider gate 通过后，评估 `bootstrap-providers.{sh,ps1}` 是否可在 all-repos maintenance 中追加 folder target。默认不自动追加 `--folder`；默认不把 folder target 纳入 GitNexus group/readiness fan-out。

**Requirements:** R8

**Dependencies:** U12 provider gate pass + U14 advisory fields + new P2 follow-up plan

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` (L632-657)
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`
- Modify: `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh` (L528)
- Modify: `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.ps1` (L545)

**Approach:**
- 注意：bootstrap-providers.sh 当前不支持 `--label` 参数（L103-131 只有 --repo / --folder / --all-repos / --incremental / --full / --force）；computed_exclude 传递形式亦未定义。**U15 开发前须先完成 U12 gate，spike 文档须包含 `u15_interface_proposal` 字段（computed_exclude / label / fingerprint 传递接口设计）。**
- 在 child loop 结束后读取 `additional_folder_targets[]`，只有当 target status 为 `validated` 且 U12 provider gate pass 时，才允许进入 folder loop
- 若 `CANDIDATE_COUNT=0`（无 child git repo）但存在 validated folder target，zero-candidate gate 是否 bypass 必须由 P2 follow-up 明确；本计划不改变 L593 gate
- 默认 `resolve-workspace-graph-targets` 不新增 mode，只在现有 `workspace-multi-repo` 输出中携带 advisory folder targets；如 U12 mode gate 决定新增 mode，则同步修改 sh/ps1 和 all consumers
- parent advisory summary `.spec-first/workspace/graph-bootstrap-summary.json` 可增 `additional_folder_targets[]` 节点，记录每个 folder target 的状态；只有 `bootstrap-written` 可被 closeout 计为覆盖完成

**Test scenarios:**
- Integration: U12 gate pass fixture → child loop 后可追加 1 次 folder target，summary 标记 `bootstrap-written`
- Integration: `computed_exclude` 自动包含 6 child git roots，且 provider command allowlist / folder fingerprint 使用同一集合
- Integration: U12 gate fail / inconclusive → 不追加 folder 调用，summary 标记 `bootstrap-deferred` 或 `spike-failed`
- Edge case: 无 target declaration → all-repos loop 行为不变

**Verification:**
- target declaration 缺失或 gate 未通过时无 folder bootstrap 副作用
- folder bootstrap 写入路径、authority_level、consumer status 与 contract 一致

---

### U16. Deferred P2 sketch — tests + contracts + docs

**Status:** Deferred. 本 unit 是 P2 follow-up 的设计草图，不属于本计划 active implementation。

**Goal:** P2 若重新立项，必须先更新 contracts / README / SKILL.md / tests，再实现脚本行为。禁止只改 `docs/contracts/graph-provider-consumption.md` 而不更新 parent workspace consumption contract。

**Requirements:** R6, R7, R8

**Dependencies:** U12 gate pass + new P2 follow-up plan + U13–U15 selected implementation

**Files:**
- Modify: `docs/contracts/workspace-gitnexus-consumption.md`（parent advisory target declaration、folder target authority、consumer status、mode decision）
- Modify: `docs/contracts/graph-provider-consumption.md`（provider exclude/label/fingerprint contract）
- Modify: `README.md` / `README.zh-CN.md`（parent workspace 边界）
- Modify: `skills/spec-mcp-setup/SKILL.md`（parent config authority 与 dry-run/manual handoff）
- Optional Modify: `skills/spec-mcp-setup/references/config-template.yaml`（仅当 contract gate 选择 repo-local config；默认不选 parent config.local）
- Create / Modify: `tests/integration/spec-graph-bootstrap/mixed-topology-*.sh`
- Optional Modify: `docs/02-架构设计/`（仅当 U12 mode gate 决定新增 mode 时补 workspace-mixed-topology；默认不改）
- Modify: `docs/05-用户手册/`（future P2 若通过 gate，再补 target declaration / explicit `--folder` handoff 说明）

**Test scenarios:**
- Integration: mixed-topology fixture → child + folder 行为符合 contract gate 选定边界
- Integration: `extra_exclude` 缺失时 computed_exclude 仍自动包含 child git roots，且 fingerprint 与 provider command 一致
- Integration: `path` 校验 reason_code 各路径（outside-workspace / parent-ref / not-found / not-directory / symlink-escape / inside-git-repo）
- Integration: 无 target declaration 时行为等同旧版
- Contract: parent workspace 不因 target declaration 自动拥有 repo-local truth，除非 contract gate 显式扩展并同步 tests

**Verification:**
- `npm run test:integration` P2 用例全绿
- workspace + graph provider contracts、README、SKILL.md 和 tests 同步

---

## System-Wide Impact

- **Interaction graph:** `resolve-project-target` → `detect-tools` → `verify-tools` 链路全部受 P0 影响；`check-health` 保持独立 preflight，不承载 `git_health` 字段传递；`bootstrap-providers` → `resolve-workspace-graph-targets` 仅在 future P2 follow-up 受影响；新 `repair-worktree --dry-run` 命令是独立链路，不被任何现有命令自动调用。
- **Error propagation:** `detect_git_health()` 产出的 reason_code 通过 JSON 字段从 `resolve-project-target` 冒泡到 `detect-tools`，再由 `verify-tools` 写入 readiness ledger；`repair-worktree` 的 reason_code 直接 exit 1 + stderr。
- **State lifecycle risks:** P0 只读；P1 只做 dry-run preview，不删除 `.git`。删除 broken `.git` pointer 的 apply path 是独立 follow-up，必须有 dry-run fingerprint/token 绑定。
- **API surface parity:** `project-target.v2` 是 v1 的超集，不破坏 write-provider-config / verify-tools / bootstrap-providers 的现有字段读取；新增字段只在消费者按字段存在与否处理时安全。
- **Integration coverage:** broken-worktree fixture 需要能在 CI 中构造（无需真实 git worktree）；future P2 mixed-topology fixture 需要先有 contract gate，不在本计划执行。
- **Unchanged invariants:** `baseline_ready` 语义不变；`git-repo / non-git-folder` mode 的现有行为不变；`discover_candidates` 的现有 candidate 过滤逻辑不变（仅添加诊断，不改变输出的 candidate_roots）；`bootstrap-providers` 现有 child loop 不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| schema v2 有未发现的消费者做字面值比较 | P0 开发前在 `skills/`、`src/`、`tests/` 下 grep `project-target.v1` 审计执行影响面；U5 前置 grep 步骤强制执行，历史 docs 引用不计入残留 |
| P2 误把 parent workspace 当 repo-local truth owner | P2 改为 Deferred；U12 先做 contract gate，默认禁止 parent `.spec-first/config.local.yaml` 和 parent repo-local graph/provider truth |
| GitNexus multi-target label / exclude / fingerprint 接口不成立 | U12 provider gate 是 P2 硬前置；任一 fail / inconclusive 时只保留显式 `--folder` workaround |
| 父级 folder target 索引耗时 >15 分钟（P2 延迟触发） | U12 实测结果决定 advisory 策略；>15 分钟触发二次设计讨论，不强制 commit background mode |
| `--apply` 并发修改导致误删 `.git` | 本计划不实现 `--apply`；future follow-up 必须使用 dry-run fingerprint/token 绑定 |
| YAML 解析失败导致 resolve-project-target 静默降级 | 本计划不实现 YAML parser；future P2 若需要配置读取，必须使用安装态可定位 wrapper 或 direct dependency + schema 校验 |
| `build` 加入忽略列表误过滤非 build 产物目录 | 加 `build` 到共享 `IGNORE_DIR_PATTERN` 同时影响 `discover_candidates` 候选发现和 `coverage_gap` 计数（两者共享同一变量）；`build` 通常不含独立 git repo，若有则通过 explicit `--repo` 指定。`--folder` 显式调用范围不受影响。 |
| `.ps1` CRLF / Windows 路径解析与 `.sh` 行为分叉 | U2/U4/U9 明确 CRLF 规范化 + 反斜杠处理；fixture 测试覆盖 Windows 路径场景 |

---

## Phased Delivery

### Phase P0（诊断诚实性）

**目标：** 用户运行 `spec-mcp-setup` 时，setup 报告中能看到 broken worktree 状态、coverage gap 计数、扩展的 next_action 文案。`baseline_ready` 语义不变。

**单元：** U1 → U2 → U3 → U4 → U5 → U6 → U7（P0 tests + docs）

**Definition of done：** 在 broken-worktree + coverage-gap fixture 下，setup 报告含 `git_health.status="broken-worktree"` + `worktree_pointer.exists=false` + `coverage_gap.uncovered_top_level_dirs` + next_action repair-worktree 文案；`discover_candidates` 和 `coverage_gap` 的忽略列表来自同一变量（含 `build`）；`skills/`、`src/`、`tests/` 中无旧 `project-target.v1` emit / 字面值消费者残留。

---

### Phase P1（dry-run 修复指引）

**目标：** `spec-first repair-worktree --dry-run` 子命令可用，提供 preview-first unlink 诊断与手动修复指引。

**单元：** U8 → U9 → U10 → U11（P1 tests + docs）

**Definition of done：** `spec-first repair-worktree --dry-run` 在 broken-worktree fixture 下输出时间戳 advisory + `.git` pointer 摘要 + unlink preview + 手动 git 修复建议文案 + `--folder .` workaround；`--apply` / `--unlink` 输出 `repair-worktree-apply-deferred` 并且不删除 `.git`；健康 repo 被拒绝。

---

### Phase Spike / Gate（Deferred P2 前置，强依赖）

**目标：** 验证 P2 contract authority + GitNexus provider 接口 + 父级 folder 索引耗时，产出是否另开 P2 follow-up 的决策依据。

**单元：** U12

**Gate：** spike 文档存在 + contract/provider 结论明确。全部 pass → 另开 P2 follow-up plan；任一 fail / inconclusive → P2 延迟，只保留显式 `--folder` workaround。

---

### Phase P2（Deferred：配置驱动拓扑）

**目标：** 不在本计划开发。若 U12 gate 全部通过，另开 follow-up plan 设计配置驱动 mixed topology；默认不使用 parent `.spec-first/config.local.yaml`，默认不新增 `workspace-mixed-topology` mode，默认不让 all-repos 自动写 parent canonical artifacts。

**单元：** U13 → U14 → U15 → U16 仅作为 deferred design sketches，不进入本计划 implementation。

**Definition of done：** U12 gate 文档明确是否另开 follow-up；本计划完成时不应出现新的 mixed-topology runtime behavior。

---

## Documentation Plan

- `CHANGELOG.md`：P0/P1/Spike 各阶段落地时追加 changelog 条目（user-visible），记录 schema v2 bump、dry-run 子命令、P2 gate 结论。
- `skills/spec-mcp-setup/SKILL.md`：P0 完成后补 git_health / coverage_gap / candidates_diagnostics / next_action 分支语义说明；P1 完成后补 repair-worktree dry-run 使用说明。
- `docs/02-架构设计/`：P0 schema v2 字段描述；P2 若另开 follow-up，再补 mixed topology 架构说明。
- `docs/05-用户手册/`：P0 broken-worktree 诊断章节；P1 repair-worktree dry-run 使用文档；P2 未通过 gate 前只记录显式 `--folder` workaround。
- `docs/contracts/workspace-gitnexus-consumption.md`：只有 P2 follow-up 启动时才更新 parent advisory target declaration、artifact authority、consumer status 和 mode decision。
- `docs/contracts/graph-provider-consumption.md`：只有 P2 follow-up 启动时才更新 provider exclude/label/fingerprint contract。

---

## Operational / Rollout Notes

- **无 breaking change：** P0 schema v2 是 v1 超集；P1 是新增 dry-run 子命令；P2 不在本计划引入 runtime behavior。
- **P0 deploy 后验证：** 在 kaz-mvp 工作区跑一次 `spec-mcp-setup`，确认 setup 报告含 git_health + coverage_gap 字段。
- **P1 deploy 后验证：** `spec-first repair-worktree --dry-run` 在 kaz-mvp 输出正确 preview 文案；`--apply` / `--unlink` 输出 deferred reason 且不删除 `.git`。
- **Spike 结论必须记录到独立 spike 文档：** U12 完成后将 parent config authority、artifact boundary、mode decision、consumer list、provider exclude/label/fingerprint、耗时数据写入 spike 文档，作为是否另开 P2 follow-up 的依据。
- **P2 deploy 后验证：** 不适用于本计划。P2 若另开 follow-up，必须先有 contract gate pass。
- **source-only 原则：** 所有改动只改 source（`skills/`, `src/cli/`, `docs/`），不手改 generated runtime mirror（`.claude/`, `.codex/`, `.agents/skills/`）；改动落地后如需刷新 runtime，运行 `spec-first init`。

---

## Sources & References

- **Origin document:** [`docs/brainstorms/2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal.md`](../brainstorms/2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal.md)
- Related code: `skills/spec-mcp-setup/scripts/resolve-project-target.sh:114` (broken worktree 静默点)
- Related code: `skills/spec-mcp-setup/scripts/resolve-project-target.sh:148-191` (`discover_candidates` + 忽略列表)
- Related code: `skills/spec-mcp-setup/scripts/verify-tools.sh:360-407` (readiness ledger v2 emit)
- Related code: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:632-657` (all-repos child loop, unchanged in this plan)
- Related code: `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh:528` (mode 正向枚举)
- Related plans: `docs/plans/2026-04-28-005-feat-workspace-target-readiness-plan.md` (workspace target 已有结构)
- Related plans: `docs/plans/2026-04-26-003-feat-crg-workspace-topology-plan.md` (早期 workspace 拓扑探索)
- Related brainstorm: `docs/brainstorms/2026-05-25-001-gitnexus-only-graph-provider-requirements.md` (`analyze --skip-git` non-git 索引能力)
