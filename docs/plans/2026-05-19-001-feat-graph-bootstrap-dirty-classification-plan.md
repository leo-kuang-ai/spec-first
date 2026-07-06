---
title: "feat: spec-graph-bootstrap dirty 分类与 setup-owned gate"
type: feat
status: completed
date: 2026-05-19
spec_id: 2026-05-19-001-graph-bootstrap-dirty-classification
---

# feat: spec-graph-bootstrap dirty 分类与 setup-owned gate

## Summary

把 `spec-graph-bootstrap` 当前"任何 `git status --porcelain` 非空就 `dirty-refresh-non-canonical` 阻断"的一刀切 dirty gate，升级为按路径来源分类的 dirty gate：脚本只在**graph-affecting dirty**（用户源码、构建配置、provider setup 输入、host instruction 非 managed block 修改）时阻断；当 dirty 仅命中**setup-owned 治理路径**（spec-first 自己 own 或受角色契约要求频繁更新的路径，如 `.spec-first/`、`.gitnexus/`、`.code-review-graph/`、`CHANGELOG.md`、`.gitignore` 的 spec-first managed block、`AGENTS.md` / `CLAUDE.md` 的 spec-first managed blocks 等）时，bootstrap 继续运行 provider 命令并写出 canonical artifacts，仅把 dirty 状态如实写进 `worktree_dirty` / `worktree_status_hash` / 新增 `dirty_classification`，由下游 consumer 自行用 hash 判 freshness。真源码 dirty 仍 fail-closed；本轮不提供 `--allow-dirty` / `-AllowDirty` escape hatch。预期效果：用户在 `spec-mcp-setup` 之后第一时间跑 `spec-graph-bootstrap`，不再因为 setup 自己刚写的 governance 文件被阻断；KAZ workspace 8 child 全部命中 `dirty-refresh-non-canonical` 的现场被根治。

## Origin

无独立 brainstorm 文档；本 plan 由当前会话产生，源于用户在 `/Users/kuang/ops/code/9627_KAZ展业项目-MVP版本-CRM需求_中台开发` workspace 跑 `spec-graph-bootstrap` 时 8 个 child repo 全部以 `reason_code=dirty-refresh-non-canonical` 阻断的现场观察。现场 dirty 内容集中在 `.gitignore` managed block、`AGENTS.md` managed block、`CHANGELOG.md`、`.codex/spec-first/.developer` 删除等 setup-owned 路径，无源码改动；若 host entry 文档在 managed block 外也有 dirty，仍按 graph-affecting 处理。本 plan 与 `2026-05-18-003-init-untrack-managed-runtime` 正交但互补：003 解决"历史索引被跟踪"，本 plan 解决"setup 后立即 bootstrap 被自己刚写的 governance 文件拦住"。

## Graph Readiness

- target_repo: spec-first（当前 cwd 所在仓库）
- status: stale
- source_revision: 08e1e2aaaf2135ed88d78b4189e4261b5fab2d61
- current_revision: same
- stale: true
- primary_providers: code-review-graph, gitnexus（设置上 ready，但 fingerprint 已不匹配当前 HEAD）
- degraded_providers: 无
- fallback_capabilities: bounded direct repo reads
- runtime_mcp_evidence: not-attempted（plan 阶段不需要语义图证据，只读 bootstrap script 与 contract source）
- confidence: medium-high
- limitations: 改动面集中在 `skills/spec-graph-bootstrap/scripts/*` + `docs/contracts/graph-provider-consumption.md` + `tests/unit/spec-graph-bootstrap.sh` + `tests/unit/spec-graph-bootstrap-contracts.test.js` 几条已完整阅读过的链路；不依赖 graph evidence 做 impact 判断。spec-work 阶段如需做大范围影响分析，需要先 commit 本 plan 后重跑 `spec-graph-bootstrap`。

## Goals

- G1：脚本对 dirty worktree 的 gate 按路径来源分类。命中 setup-owned 治理路径列表的 dirty 不阻断 provider 命令；命中其他路径（视为 graph-affecting）才阻断。`AGENTS.md` / `CLAUDE.md` 只有 spec-first managed block 内 diff 可豁免，managed block 外 diff 一律 graph-affecting。
- G2：把 setup-owned ignore 规则提升为 source-of-truth，由 contract（`docs/contracts/graph-provider-consumption.md`）显式列出条目；Bash 与 PowerShell 保留各自脚本常量，但由同一份 contract 列表治理，并通过合同测试锁住集合等价，避免双源漂移。本能力**不复用** `external_actor_fingerprint` / `Get-ExternalActorFingerprint` 的现有窄列表；那条 fingerprint 服务于 concurrent-write-detected 检测，语义不同，保持独立常量。
- G3：本轮不新增 `--allow-dirty` / `-AllowDirty` escape hatch。graph-affecting dirty 继续 fail-closed；override 需求作为 Future Work，只有出现明确 CI / 运维 / 历史回放 caller 后再单独设计 provenance、confidence 与 consumer contract。
- G4：成功刷新后的 `graph-facts.v1` 顶层增加 `dirty_classification` 字段（取值 `clean` / `setup-owned-only`）以及 `dirty_paths_breakdown: { setup_owned_count, graph_affecting_count, sample_paths }`。`graph-affecting-blocked` 只出现在本轮 `graph-bootstrap-result.v1` / stdout blocked result 中，不写入 preserved canonical `graph-facts.v1`。`graph-provider-status.v1` **不重复写**这些字段（避免双源漂移）；该 schema 仍只描述 provider 维度。`worktree_dirty` 与 `worktree_status_hash` 字段语义保持兼容。
- G5：reason_code 集合扩展 `dirty-source-blocked`（默认真源码 dirty 路径）。原 `dirty-refresh-non-canonical` 在 setup-owned-only 路径上不再触发；保留为兼容名称只在历史 artifacts 出现，新逻辑不再写出。
- G6：`.gitignore` 的 dirty 仅当变更**全部落在 spec-first managed block 内部**时才豁免；用户在 managed block 之外的修改仍按 graph-affecting 处理。
- G7：能力对 Bash 与 PowerShell 两个脚本完全等价；测试同时覆盖。

## Non-Goals

- 不让脚本枚举"什么算源码"：路径分类只列**豁免名单**（短、稳定、可维护），剩下一律按 graph-affecting 处理。多语言扩展不进入脚本。
- 不为用户提供"自定义豁免列表"配置：豁免名单是 spec-first 治理事实，不是项目可配置项；要扩展只能改 source。
- 不修改 `worktree_dirty` 与 `worktree_status_hash` 已有语义；`graph-facts.v1` 仍把 raw `worktree_dirty` 写出，consumer 已有的 dirty-aware 判断保持不变。
- 不引入 `--ignore-dirty` 或 `--allow-dirty` 这种 override 开关。本轮只解决 setup-owned dirty 被误阻断的问题；真源码 dirty 仍 fail-closed，不提供"假装干净"或人工放行路径。
- 不接管 `concurrent-write-detected` 检测语义；那条仍按既有 critical-write-window 逻辑工作。本 plan 不复用同一份豁免列表：保留 `EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX`（concurrent-write 专用，与现状一致的窄列表）与新增 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES`（dirty gate 专用，本 plan 的宽列表）为两个独立常量，避免新加 `CHANGELOG.md` / `.gitignore` / `.codex/spec-first/` 等条目静默放过 critical-write-window 内的外部 actor 写入。
- 不增删 `--incremental` / `--full` 已有行为；本 plan 只动 dirty gate。

## Requirements Traceability

| ID | 需求 | 来源 | 验收锚点 |
|----|------|------|----------|
| R1 | dirty 仅命中 setup-owned 路径时不阻断 | 用户现场（KAZ workspace） | unit test：临时 git 仓库 commit 一份源码后改 `AGENTS.md` managed block / `CHANGELOG.md` / `.gitignore` managed block，跑 bootstrap，断言 provider commands 已运行、canonical artifacts 写出、`dirty_classification=setup-owned-only` |
| R2 | dirty 命中 graph-affecting 路径时阻断，reason_code=`dirty-source-blocked` | spec-first 角色契约：源码 dirty 必须 fail-closed | unit test：临时仓库改 `src/Foo.java` 后跑 bootstrap，断言 `workflow_mode=blocked` / `reason_code=dirty-source-blocked` / `canonical_artifacts_preserved=true` / stdout `dirty_classification=graph-affecting-blocked`，且 preserved `graph-facts.v1` 不被写成 blocked |
| R3 | blocked classification 不写入 preserved canonical artifacts | source/runtime 与 canonical artifact 边界 | unit test：先生成 clean `graph-facts.json`，再制造源码 dirty 后跑 bootstrap，断言 command result 有 `dirty_classification=graph-affecting-blocked`，但既有 `graph-facts.json` 内容保持不变；consumer contract 定义旧 v1 artifact 缺失 `dirty_classification` 的 fallback |
| R4 | `.gitignore` / `AGENTS.md` / `CLAUDE.md` 仅 spec-first managed block 内 dirty 才豁免 | 现场：init 写 managed block 后立刻跑 bootstrap | unit test：分别只改 managed block 与只改 user 区域，断言前者 `setup-owned-only`、后者 `graph-affecting-blocked` |
| R5 | Bash 与 PowerShell 行为等价 | spec-first 双平台治理 | smoke：两个脚本对相同 setup-owned-only 输入产出相同的 `dirty_classification` 与 `workflow_mode` |
| R6 | 历史 reason_code `dirty-refresh-non-canonical` 不再被新逻辑写出，但 graph-bootstrap / consumer contract 兼容历史 artifacts | spec-first contract evolution | contract test：graph-bootstrap 与 consumer contract 同时承认 `dirty-source-blocked` 与 legacy `dirty-refresh-non-canonical` |
| R7 | consumer contract 记录 `dirty_classification` freshness 消费规则 | `docs/contracts/graph-provider-consumption.md` | contract test：消费契约表格列出新字段及新写 / 本轮更新 consumer 的消费规则 |
| R8 | CHANGELOG 必填，行为变更 user-visible | CLAUDE.md 强制基线 | CHANGELOG.md 新增 `(user-visible)` 条目 |

## Architecture & Boundaries

- **Source-of-truth 边界**：豁免路径列表的 source-of-truth 是 `docs/contracts/graph-provider-consumption.md` 新增的 `setup-owned-dirty-ignore.v1` 小节，以**path 前缀列表（语言无关）**形式给出（不再要求两脚本"逐字一致"的正则）；`AGENTS.md` / `CLAUDE.md` 作为 checked-in host entry source 只能按 spec-first managed block 二级判断豁免，不能整文件豁免。Bash 与 PowerShell 各自把 path 前缀编译成本地匹配实现。合同测试断言"两脚本与契约的 path 前缀集合完全一致"，而非字节级正则一致。
- **Porcelain 解析**：dirty 检测改用 `git status --porcelain=v2 -z`（NUL 分隔、显式字段、无引号、rename 用 `2` 记录同时携带 old/new path），脚本按字段提取 path，再前缀匹配契约列表。这能正确处理含空格/中文/非 ASCII 的路径，并对 rename 行同时检查 old 与 new path——任一未命中豁免即归为 graph-affecting。
- **职责分工**：
  - 脚本职责（确定性）：算 raw / filtered status，分类 `clean | setup-owned-only | graph-affecting-blocked`，按分类决定阻断/继续；成功刷新时写 canonical `dirty_classification`，阻断时只在 command result 写 blocked classification。
  - LLM 职责（语义）：本能力是确定性步骤，不需要 LLM 判断。dirty 分类的语义是"这条 dirty 是否会改变 graph 输入"，由路径列表静态决定，不交给 LLM。
- **escape hatch 边界**：本轮不实现 `--allow-dirty` / `-AllowDirty`，也不实现 parent fan-out override。父级 all-repos 只汇总每个 child 的真实结果；graph-affecting child 仍阻断，setup-owned-only child 可继续刷新。未来如确有 override 需求，必须使用独立 plan 定义 caller、provenance、confidence、child fan-out 语义与 consumer contract。
- **managed block 边界判断**：仅当 `.gitignore`、`AGENTS.md` 或 `CLAUDE.md` 出现在 dirty 列表里时才需要这条二级判断。脚本调用 `git diff --unified=0 HEAD -- <path>`（覆盖 staged + unstaged 全部 hunk，避免只看 worktree-vs-index 漏 staged）输出，按对应 marker 切片：`.gitignore` 使用 `# spec-first:start` / `# spec-first:end`，host entry docs 使用 `<!-- spec-first:<name>:start -->` / `<!-- spec-first:<name>:end -->`。若所有 `+`/`-` 行都落在成对完整的 managed blocks 内，归为 setup-owned-only；否则保守归为 graph-affecting。三条边界规则：
  - **untracked managed file**（status `??`）：`git diff HEAD` 没有可用基线，脚本改为直接读全文按 marker 切片；若文件缺失任一 marker 或 marker 不成对，一律保守归为 graph-affecting。
  - **marker-creation 与 marker-deletion**：creation 使用 worktree 侧 marker 判断，deletion 使用 HEAD 侧 marker 判断；成对完整的 `+start ... +end` 或 `-start ... -end` 整块创建/删除视为 inside。任何只增/只删单个 marker 行而对端缺失的情况一律 graph-affecting。
  - **marker 真实性校验（防伪造）**：切片前分别校验参与判断的 before/after 内容中同一 marker pair 不重复且成对存在；任何 `start` / `end` 出现 ≥ 2 次（用户在 user 区域伪造 marker 包住任意规则）即拒绝豁免，归为 graph-affecting。`.gitignore` / host entry docs 是 commit-tracked 的 user-editable source，不能假定 marker 唯一。
  这是确定性判断，由脚本完成。
- **写入顺序**：dirty 检测从 `git status --porcelain` 切换为 `git status --porcelain=v2 -z`，按字段提取 path 再前缀匹配；分类后才决定阻断/继续。现有 `if [ "$WORKTREE_DIRTY" = "true" ]; then emit_blocked ... ` 行替换为按 `dirty_classification` 分支处理。`external_actor_fingerprint` / `Get-ExternalActorFingerprint` 各自的窄列表保持现状（仅提升为脚本级常量），与 dirty gate 的宽列表是两个独立常量，concurrent-write-detected 行为不变。
- **canonical artifacts 写入**：dirty 仅 setup-owned-only 时，bootstrap 走完正常 provider commands，写 `provider-status.json` / `graph-facts.json` / `bootstrap-impact-capabilities.json`；新增 `dirty_classification` / `dirty_paths_breakdown` 仅挂在 `graph-facts.v1` 顶层（`provider-status.v1` 不重复写）。dirty 为 graph-affecting 时只在本轮 `graph-bootstrap-result.v1` 输出中写 `dirty_classification=graph-affecting-blocked` / breakdown，并保留 `canonical_artifacts_preserved=true`。
- **all-repos summary 数据流**：child 的最终 `graph-bootstrap-result.v1` stdout 必须携带 `dirty_classification` 与 `dirty_paths_breakdown`；父级 summary 从 child JSON 复制到 `results[]` row，不读取 child `graph-facts.json` 再推断，避免 blocked preserved artifacts 与本轮结果混淆。
- **跨 schema 影响**：`graph-facts.v1` 新增字段是 backward-compatible 添加；不 bump major。`graph-provider-status.v1` 形态不变。consumer contract 新增"消费规则"行；`workspace-graph-targets.v1` 不需要直接改，因为它通过比较 `worktree_status_hash` 工作，本能力对该字段语义无影响。
- **Rejected alternatives**（reviewer 反复提出的替代方案，记录为何未选）：
  - **让 `spec-mcp-setup` / `spec-first init` 自己 commit governance 写出物**：能让 bootstrap 永远看到 clean worktree。未选：用户在常规 workflow 中（特别是 `spec-work` / `spec-doc-review`）会持续修改 `AGENTS.md` / `CHANGELOG.md` / `.gitignore`，dirty 不只来自 setup；分类机制对常规 workflow 也必要。auto-commit 还会污染用户自己的 commit 节律，与 CLAUDE.md "Only create commits when requested by the user" 冲突。
  - **首版引入 `--allow-dirty`**：能给真源码 dirty 的紧急诊断留出口。未选：当前现场痛点是 setup-owned dirty 被误阻断，没有已发生的 override caller；把永久 escape hatch、provenance、confidence 与 fan-out 语义放进首版会扩大用户心智和 consumer 责任。本轮收窄为分类 gate，override 进入 Future Work。
  - **把 dirty gate 与 concurrent-write fingerprint 合并为同一份豁免列表**：能减少双源治理。未选：见 Non-Goals 与 Risks 表关于 silent broadening 的论证，两个 gate 关心不同语义，必须分开。

## Implementation Units

### IU-1：契约层定义豁免名单

- 文件：`docs/contracts/graph-provider-consumption.md`（更新）
- 新增小节 `## setup-owned-dirty-ignore.v1`：
  - 列出豁免**path 前缀**（不再是正则文本）的精确条目，逐条注明动机与所属治理域：
    - `.spec-first/`（spec-first 自己 own 的 runtime / readiness artifacts）
    - `.gitnexus/`、`.code-review-graph/`（provider 索引存储）
    - `AGENTS.md`、`CLAUDE.md`（仅 spec-first managed blocks；GitNexus instruction normalizer 可能消费 host entry 文档，managed block 外 dirty 一律 graph-affecting）
    - `CHANGELOG.md`（CLAUDE.md 强制基线，每次 source 变更必更新）
    - `.gitignore`（仅当 diff 全部落在 spec-first managed block 内时豁免，由脚本二级判断）
    - `.codex/spec-first/`、`.claude/spec-first/`、`.agents/skills/`（runtime mirror，spec-first init 写出）
  - 路径解析规则：**消费 `git status --porcelain=v2 -z` 输出**，按字段提取 path，前缀匹配（不依赖正则）。rename 行（`2 ` 记录）同时检查 old 与 new path，任一未命中即归为 graph-affecting。
  - 显式声明：此 ignore 列表**只**对 dirty gate 生效；外部 actor 可见性、provider 命令本身的 input、git history 都不受此影响。
  - 显式声明：不接受用户/项目自定义；扩展条目必须改本契约。
- 在原 "dirty worktree refresh request" 行下方拆为两条：
  - dirty (graph-affecting) → `reason_code=dirty-source-blocked`、provider commands 不运行、`canonical_artifacts_preserved=true`。
  - dirty (setup-owned-only) → `reason_code=null`、provider commands 正常运行、artifacts 内 `dirty_classification=setup-owned-only`、`worktree_dirty=true` + `worktree_status_hash` 用于下游 freshness 判断。
- 在消费规则段落新增一行：新写或本轮更新的 consumer 在比较 `worktree_status_hash` 之前应先读 `graph-facts.v1.dirty_classification`。`setup-owned-only` 视为 fresh 但 hash 与上一次可能不等价（AGENTS.md / CHANGELOG.md 改动会让 hash 漂移）；`graph-affecting-blocked` 只能来自本轮 command result，表示本次没有更新 canonical artifacts。本计划只更新 consumer contract 与合同测试，不改造既有 consumer；若 spec-work 阶段决定触碰既有 consumer，必须先列出具体 consumer 文件与对应测试。
- 旧 `graph-facts.v1` 兼容：缺失 `dirty_classification` 时，consumer 回退到既有 `worktree_dirty` + `worktree_status_hash` 逻辑，并把 dirty 情况标为 `dirty-uncertain` / advisory；不得从缺失字段推断 clean。
- legacy reason_code 处理：`dirty-refresh-non-canonical` 仅出现在 `<release-version>` 之前的历史 artifacts 中；本 plan 落地后新写入永不出现。consumer 在 freshness 比较时**把它视同 `dirty-source-blocked`**。Sunset：可在下一次 `graph-facts.v2` major schema bump 时从契约删除，或当所有 live workspace 已滚动到新写入（以两者中先到达者为准）。

### IU-2：Bash 脚本接入分类 gate

- 文件：`skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`（更新）
- 改动点：
  - 头部新增脚本级常量 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES`（数组，集合与 IU-1 契约 path 前缀对齐，由合同测试锁住）；并新增帮助函数 `managed_block_diff_outside_owned_block()` 用于 `.gitignore` / `AGENTS.md` / `CLAUDE.md` 二级判断。
  - 把 dirty 检测从 `git status --porcelain` 切换为 `git status --porcelain=v2 -z`：新增 `parse_porcelain_v2_paths()`（按字段提取 path，rename 同时输出 old 与 new），返回 `(path, hint)` 元组列表，再用 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 前缀匹配；rename 行任一 path 未命中即归为 graph-affecting。`WORKTREE_STATUS_HASH` 仍按原 `git status --porcelain` 文本计算（保持 `worktree_status_hash` 字段语义兼容）。
  - 既有 `if [ "$WORKTREE_DIRTY" = "true" ]; then emit_blocked ...` 替换为：
    - `clean` 与 `setup-owned-only`：直接通过；
    - `graph-affecting-blocked`：`emit_blocked blocked dirty-source-blocked "Source-affecting worktree changes detected; commit, stash, or clean worktree changes before graph bootstrap refresh." 1 true`；stdout result 写 `dirty_classification=graph-affecting-blocked` 与 `dirty_paths_breakdown`，但不改写 preserved canonical artifacts。
  - 把 `external_actor_fingerprint()` 内部正则**保持为现状的窄列表**，并提升为脚本级常量 `EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX`（与 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 是两个独立常量，不复用，不合并）；本 plan 仅用 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 驱动 dirty gate，concurrent-write-detected 路径完全不变。
  - 在 `graph-facts.json` 写入处的 jq 模板里新增 `dirty_classification: $dirty_classification` 顶层字段、`dirty_paths_breakdown: { setup_owned_count, graph_affecting_count, sample_paths }`。`provider-status.json` 不写这些字段。
  - 最终 `graph-bootstrap-result.v1` stdout 同步输出 `dirty_classification` 与 `dirty_paths_breakdown`；父级 all-repos summary 从 child JSON 复制到 `results[]` row。
- 不修改 `concurrent-write-detected` 路径；它继续只使用 `EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX`，与 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 独立。

### IU-3：PowerShell 脚本接入分类 gate

- 文件：`skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`（更新）
- 改动点：
  - 不新增 `-AllowDirty` 参数；PowerShell 版本同样保持 graph-affecting dirty fail-closed。
  - 新增 `$script:SetupOwnedDirtyIgnorePrefixes`（数组，集合与 Bash 和 IU-1 契约 path 前缀列表等价，由合同测试锁住）；新增 `Test-ManagedBlockDiffOutsideOwnedBlock` 函数。
  - 把 dirty 检测从 `git status --porcelain` 切换为 `git status --porcelain=v2 -z`，新增 `Parse-PorcelainV2Paths` 按字段提取 path（rename 同时输出 old 与 new），再用前缀匹配；rename 任一 path 未命中即归为 graph-affecting。`worktree_status_hash` 仍按原 v1 status 文本计算。
  - 第 2200-2210 `if ($worktreeDirty)` 阻断分支替换为按 `$dirtyClassification` 分支处理；`graph-affecting-blocked` 走 `Write-ResultAndExit -ReasonCode 'dirty-source-blocked' -NextAction '...同上...'`。
  - `Get-ExternalActorFingerprint` 内部正则**保持为现状的窄列表**，并提升为脚本级常量 `$script:ExternalActorFingerprintIgnorePattern`（与 `$script:SetupOwnedDirtyIgnorePrefixes` 是两个独立常量，不合并）。
  - `graph-facts.json` 写入处 hashtable 中新增 `dirty_classification = $dirtyClassification`、`dirty_paths_breakdown`（与 Bash 等价）；`provider-status.json` 不写这些字段；最终 command result 同步输出 dirty classification / breakdown 给父级 all-repos summary。

### IU-4：测试

- 文件：`tests/unit/spec-graph-bootstrap.sh`（更新）
  - 修订原 `dirty $dirty_refresh_label refresh is provider-non-mutating` 用例：保留语义但断言改为 `blocked:dirty-source-blocked:true`，并断言 stdout result 有 `dirty_classification=graph-affecting-blocked`，同时 preserved `graph-facts.json` 未被改写为 blocked。
  - 同步修订 PowerShell 等价用例。
  - 新增用例 `dirty setup-owned only is not blocking`：临时 git 仓库 commit 一份 `src/foo.txt` 作为 source baseline，再仅修改 `AGENTS.md` managed block / `CHANGELOG.md`、追加 `.gitignore` 的 spec-first managed block，跑 bootstrap，断言 `workflow_mode != blocked`、stdout 与 canonical `graph-facts.json` 均有 `dirty_classification=setup-owned-only`、`canonical artifacts` 已写出、`worktree_dirty=true` 仍为真。
  - 新增用例 `host entry outside managed block is graph-affecting`：在 `AGENTS.md` 或 `CLAUDE.md` managed block 外改一行，断言 `dirty_classification=graph-affecting-blocked` 且 provider commands 不运行。
  - 新增用例 `path with spaces / non-ASCII is correctly classified`：临时仓库新增 `带 空格 / 中文.md` 等含空格与 UTF-8 字符的 setup-owned 路径（如 `.spec-first/notes/带 空格.md`），断言归类为 `setup-owned-only`，验证 porcelain v2 -z 解析对引号 / 非 ASCII 路径的鲁棒性。
  - 新增用例 `rename across boundary is graph-affecting`：在临时仓库内做三种 rename，分别为 `.spec-first/foo -> src/foo.java`（setup→源码）、`src/foo.java -> .spec-first/foo`（源码→setup）、`.spec-first/a -> .spec-first/b`（setup→setup），断言前两种 `graph-affecting-blocked`、第三种 `setup-owned-only`，覆盖 rename 行任一 path 未命中即升级的规则。
  - 新增用例 `dirty .gitignore outside managed block is graph-affecting`：在 `.gitignore` user 区域新加一行，断言归类为 `graph-affecting-blocked`。
  - 新增用例 `untracked .gitignore with managed block only is setup-owned`：在临时仓库 `git rm --cached .gitignore && fs write` 模拟 untracked 状态，文件只含成对完整的 managed block，断言 `setup-owned-only`；同一用例的 user-region 变体（含 marker 之外的内容）断言 `graph-affecting-blocked`；marker 不成对的变体断言 `graph-affecting-blocked`。
  - 新增用例 `MM .gitignore staged+unstaged crosses boundary`：staged 落在 managed block + unstaged 落在 user 区域，断言归类为 `graph-affecting-blocked`，验证 baseline 用 `git diff HEAD --` 而非 `git diff --` 才能覆盖 staged 改动。
  - 新增用例 `marker-creation block on first init`：临时仓库无 `.gitignore`，模拟 init 首次写出成对 `# spec-first:start` ... `# spec-first:end`（diff 全为 `+` 行包含 marker 自身），断言归类为 `setup-owned-only`，锁住 marker 行成对完整 → inside 的判定。
  - 新增用例 `marker-deletion block stays setup-owned`：临时仓库已有完整 spec-first managed block，删除整块 marker + 内容，断言归类为 `setup-owned-only`，锁住 deletion 使用 HEAD 侧 marker 的判定。
  - 新增用例 `forged duplicate markers in .gitignore is graph-affecting`：在 `.gitignore` user 区域人工再加一对 `# spec-first:start` ... `# spec-first:end` 包住任意 ignore 规则，断言归类为 `graph-affecting-blocked`，锁住 marker 唯一性校验。
  - 新增用例 `all-repos result carries dirty classification`：父级 workspace 下一个 child 真源码 dirty、一个 child setup-owned-only，断言 parent summary `results[]` 直接包含 child stdout 的 `dirty_classification` 与 `dirty_paths_breakdown`，不从 child preserved `graph-facts.json` 推断。
- 文件：`tests/unit/spec-graph-bootstrap-contracts.test.js`（更新）
  - 把现有锁住 `dirty-refresh-non-canonical` 的两处断言扩展为同时承认 `dirty-source-blocked` 为新默认 reason_code；保留 legacy 名称在 contract（向后兼容历史 artifacts）。
  - 新增断言：`external_actor_fingerprint` / `Get-ExternalActorFingerprint` 不豁免 `CHANGELOG.md` / `.gitignore` / `.codex/spec-first/` / `.claude/spec-first/` / `.agents/skills/`（保护 concurrent-write-detected 检测窗口不被本能力静默放宽）；与 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 两条常量分开断言。
  - 新增断言：脚本里的 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 与契约文档列出的 path 前缀**集合等价**（行级比较，不依赖正则），Bash 与 PS1 各一条。
- 文件：`tests/unit/graph-provider-consumption-contracts.test.js`（更新）
  - 新增断言：消费契约表含 `dirty_classification` 行；含 `setup-owned-only` 与 command-result-only `graph-affecting-blocked` 的消费规则；明确旧 `graph-facts.v1` 缺失字段时回退为 dirty-aware legacy 判断。

### IU-5：文档与 CHANGELOG

- `CHANGELOG.md`：新增一行 `(user-visible)`，作者按当前 host developer profile 解析。
- `README.md` / `README.zh-CN.md`：在 `spec-graph-bootstrap` / `spec-graph-bootstrap` 段落补一句"setup-owned dirty 不再阻断 bootstrap；真源码 dirty 仍 fail-closed"。
- `docs/00-版本路线/版本规划.md`：补一行 changelog 引用。
- `skills/spec-graph-bootstrap/SKILL.md`：把 `## Refresh Modes` 段第 268 行 "dirty worktree" 那条更新为分类描述；新增 `## Dirty Classification` 小节链接到契约 `setup-owned-dirty-ignore.v1`；说明真源码 dirty 保持 fail-closed，override 留待 Future Work。

## Test Scenarios

| 场景 | 前置 | 操作 | 期望 |
|------|------|------|------|
| clean worktree | 临时 git 仓库 commit 一份源码，无任何 dirty | bootstrap | `dirty_classification=clean`，行为与现状一致 |
| setup-owned-only：AGENTS.md managed block | 同上 + 改 `AGENTS.md` spec-first managed block | bootstrap | `dirty_classification=setup-owned-only`，provider commands 已运行，canonical artifacts 写出，`worktree_dirty=true` |
| graph-affecting：AGENTS.md user 区 | 在 `AGENTS.md` managed block 外改一行 | bootstrap | `graph-affecting-blocked`，reason_code=`dirty-source-blocked`，canonical artifacts preserved |
| setup-owned-only：CHANGELOG.md | 改 `CHANGELOG.md` | bootstrap | 同上 |
| setup-owned-only：.gitignore managed block 内 | 在 `# spec-first:start`/`:end` 之间加一行 | bootstrap | `setup-owned-only` |
| graph-affecting：.gitignore user 区 | 在 marker 之外加一行 | bootstrap | `graph-affecting-blocked`，reason_code=`dirty-source-blocked` |
| graph-affecting：源码 dirty | 改 `src/foo.java` | bootstrap | `graph-affecting-blocked`，reason_code=`dirty-source-blocked`，canonical_artifacts_preserved=true |
| 混合：源码 + AGENTS.md | 改 `src/foo.java` 与 `AGENTS.md` | bootstrap | `graph-affecting-blocked`（任一 graph-affecting 即归类） |
| concurrent-write-detected 不受影响 | 在 critical write window 内由外部 actor 写源码 | bootstrap | 仍 `concurrent-write-detected`，与本能力正交 |
| PowerShell 等价 | 同上每条 | `bootstrap-providers.ps1` | 与 Bash 完全等价的 `dirty_classification` 与 `workflow_mode` |

## Sequencing & Dependencies

- 依赖：仅 `git`、`grep`、`jq`（已用）、PowerShell `-notmatch`（已用）。
- 顺序：IU-1（契约 source-of-truth）→ IU-2/IU-3（脚本同步实现，可并行）→ IU-4（测试）→ IU-5（文档/CHANGELOG）。
- 与 in-flight plan 的关系：与 `2026-05-18-003`（init untrack managed runtime）正交。003 落地后部分 KAZ child 的 `.codex/spec-first/.developer` dirty 会自动消失；剩余 setup-owned dirty 由本 plan 兜底。两者建议先合 003 再合本 plan，但顺序不强依赖（路径互不重合）。

## Risks & Mitigations

| 风险 | 影响 | 缓解 |
|------|------|------|
| 豁免列表与脚本前缀数组漂移 | 实际放行/阻断与契约不一致 | IU-4 加合同测试断言契约文本与脚本 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 集合等价（行级比较，不依赖正则）；扩展只改契约 |
| `.gitignore` managed block 判断误报/漏报 | 用户改 user 区域被误豁免，或反之 | 用 `git diff --unified=0` + marker 切片做确定性判断；IU-4 两个边界用例锁住行为 |
| graph-affecting blocked result 与 preserved canonical artifacts 混淆 | 下游 freshness 判断读到旧 `graph-facts.json` 后误以为本轮 blocked 分类已写入 canonical | `graph-affecting-blocked` 只存在于本轮 command result；contract 规定 canonical `graph-facts.v1` 成功刷新才写 `clean` / `setup-owned-only` |
| Bash / PowerShell 行为不等价 | 双平台输出差异，下游 consumer 难判断 | IU-4 PowerShell 等价用例对每条 Bash 用例同步覆盖；CI 矩阵已含 ps |
| 历史 artifacts 仍带 `dirty-refresh-non-canonical` reason_code | 下游 contract 解析失败 | contract 同时承认 legacy 与新 reason_code；schema 不 bump major |
| setup-owned dirty ignore contract 与脚本常量漂移 | 实际分类与 contract 描述不一致 | IU-4 合同测试只断言 IU-1 contract 与 Bash/PowerShell `SETUP_OWNED_DIRTY_IGNORE_PREFIXES` 集合等价；不耦合其他 plan 的 git ignore helper |
| 父 workspace 模式下 child fan-out 误把 setup-owned-only 视为 ready | 父级 summary 错估 | 父级 summary 直接复制 child command result 的 `dirty_classification` 与 `workflow_mode`，不重算、不读 preserved artifact；setup-owned-only 仍正常计入 ready |

## Assumptions

- 用户期望默认行为是"setup-owned dirty 不阻断"，但真源码 dirty 仍严格 fail-closed；本轮没有 override 开关。
- 当 dirty 既含 setup-owned 又含 graph-affecting 时，归类为 graph-affecting：宁可阻断也不放行错误的 graph 状态。
- 豁免名单短小且静态：扩展条目通过修改契约+脚本+测试三处同步实现，不开放运行时配置。
- 下游 consumer 已经按 `worktree_dirty` + `worktree_status_hash` 判断 freshness（已在契约里要求）；新增 `dirty_classification` 是增量信号，不要求所有 consumer 立刻消费，但所有新写 consumer 必须读。

## Open Questions（暂存 spec-work 时复核）

1. CHANGELOG 行的版本号占位：建议 spec-work 阶段读取 `package.json` 当时的版本，本 plan 保留 `<release-version>` 字符串待替换。
2. `dirty_paths_breakdown.sample_paths` 的最大条目数与脱敏策略（路径前缀截断 / 路径数量上限）由 spec-work 现场实现时按用户实际路径长度决定；contract 留有"上限不超过 20 条、超过截断并标注 `truncated=true`"的非强制建议。
3. Future Work：若后续出现明确 CI、运维诊断或历史 graph 回放 caller，再单独设计 `--allow-dirty` / `-AllowDirty`，并重新审查 provenance、confidence、parent fan-out 与 consumer contract；不纳入本轮 MVP。

## Verification Plan

- 必跑（spec-work 完成后）：`npm run typecheck`、`npm run test:unit`、`npm run test:graph-bootstrap`、`npm run test:smoke`。
- 选跑：`npm run test:integration`（若 workspace fan-out 改动较大）。
- 手验：在 spec-first 自身仓库（当前已是 dirty setup-owned-only 状态）跑 `node bin/spec-first.js ...` 等价路径或直接 `bash skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`，断言不再阻断；`graph-facts.json` 顶层有 `dirty_classification=setup-owned-only`。
- 现场验证（用户授权后）：在 `/Users/kuang/ops/code/9627_KAZ展业项目-MVP版本-CRM需求_中台开发` 跑 `spec-graph-bootstrap`，断言 8 个 child 中 dirty 全部为 setup-owned 路径的 child 不再被阻断；含真源码 dirty 的 child 仍 `dirty-source-blocked`。
- 回归：跑既有 `spec-graph-bootstrap.sh` 全套用例，确认 `concurrent-write-detected`、`incremental-and-full-failed`、`provider-projection-stale` 等路径不受影响。

## Handoff

下一步建议（按优先级）：

1. **首选**：本 plan 已完成本轮 `spec-doc-review` auto-resolve 收口：MVP 收窄为 setup-owned dirty 分类 gate，移除首版 `--allow-dirty`，补 canonical blocked/result 边界与 parent summary 数据流。直接 `spec-write-tasks` 拆 ≤6 个原子任务（IU-1～IU-5），便于 spec-work 控制 commit 粒度。
2. **次选**：直接 `spec-work --plan docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md`。
3. **不推荐**：合并到任意 in-flight plan，本能力是独立 source 行为。

## Deferred / Open Questions

### From 2026-05-18 review

- **保留 legacy `dirty-refresh-non-canonical` 的 sunset 时机**（adversarial FYI，anchor 50）：plan 已写明可在 `graph-facts.v2` major schema bump 或所有 live workspace 已滚动到新写入时删除。spec-work 阶段不需处理；下次 schema bump 评审时复核是否真的可以删。
- **`dirty_paths_breakdown.sample_paths` 的脱敏与上限**（feasibility / security 残余）：plan 留有非强制建议（≤20 条、超出截断）。spec-work 阶段按用户实际路径长度与隐私偏好实现。
- **未直接采样 KAZ 8 child 实际 dirty 路径**（scope-guardian 残余）：plan 阶段无法保证全部命中豁免；现场验证步骤已在 Verification Plan 列出。若有 child 命中豁免名单外路径，仍只能 commit/stash 后重跑。
