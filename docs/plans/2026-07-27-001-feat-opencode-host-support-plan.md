---
title: OpenCode Host Support - Plan v3
type: feat
date: 2026-07-27
revised: 2026-07-29
topic: opencode-host-support
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-brainstorm
execution: code
status: active
supersedes: docs/plans/2026-07-27-001-feat-opencode-host-support-plan.md@v2
host_neutral_baseline: docs/plans/2026-07-28-001-refactor-host-neutral-worker-dispatch-plan.md (claim closed 2026-07-29, DoD 25/25 [x])
preview_pattern_reference: src/cli/adapters/cursor.js (supportsAgents=false, degradedByDesign=true)
---

# OpenCode Host Support - Plan v3

## Goal Capsule

- **Objective:** 将 OpenCode 接入 spec-first 作为第 6 个 supported host，按 Cursor 已有的 preview 模式交付。host-neutral worker dispatch（07-28 plan）已关闭——OpenCode 不维护任何 worker-dispatch 文案。
- **Recommended approach:** `extend`。preview 诊断照抄 Cursor（`supportsAgents=false`、`degradedByDesign=true`、`<host>_generated_runtime_loader_unverified` reason code），命令入口照抄 Qoder（`hasCommands=true`、`/spec-*` command + skill 双入口）。OpenCode 是 CLI agent → `extends PlatformAdapter`（不从 PointerBasedAdapter 继承）。worker dispatch 由 07-28 plan 单一 owner，OpenCode adapter 只做 `transformSkillContent` path rewrite。
- **Decision focus:** 以最小增量新增第 6 个 host——adapter、CLI lifecycle、governance schema、setup-registry、docs/package。不新建 evidence contract、不新建状态机、不新建 cross-plan validator。preview→loader-confirmed 两级晋升完全够用。
- **Verification focus:** U0（共享 AGENTS.md 三态判定，不依赖 OpenCode）→ U1 adapter → U2 CLI lifecycle → U3 governance → U4 setup-registry → U5 docs/package → U6 real-runtime evidence（需 OpenCode CLI）。
- **Largest risk / boundary:** 当前机器无 OpenCode CLI——最高交付 `generated_runtime_preview`。compatibility skill collision（OpenCode 同时发现 `.opencode/skills`、`.agents/skills`、`.claude/skills`）、OpenCode 默认 permission `allow` 地板、`opencode.jsonc` 注释保真——均属外部 advisory evidence，loader 实证前不晋升。
- **Stop conditions:** U0 未交付；compatibility collision 无法在不破坏用户已加载 `.agents`/`.claude` skills 的前提下隔离；setup-registry 升级破坏现有 5 host；缺 CLI 时用 fixture 伪装 real-runtime evidence。
- **Execution profile:** Medium。6th host adapter extension，无新 contract schema。
- **Tail ownership:** `spec-work` 负责实现、review、验证、closeout。

---

## Product Contract

### Summary

按 Cursor preview host 模式新增 OpenCode。worker dispatch 完全由 `docs/plans/2026-07-28-001-refactor-host-neutral-worker-dispatch-plan.md`（claim 已关闭，DoD 25/25）承接——OpenCode adapter 不持有 dispatch、binding、primitive mapping 或 worker-dispatch 文案。

### Problem Frame

spec-first 当前注册 Claude Code、Codex、Cursor、Kiro、Qoder 五个宿主。OpenCode 社区用户无受治理的安装/检查/升级/清理体验。手抄 runtime 无独立 ownership、无 collision guard、无版本化支持状态。

### Key Decisions

- **Preview 诊断照抄 Cursor，命令入口照抄 Qoder。** `supportsAgents=false`（只抑制 bundled agent profile 投射）、`degradedByDesign=true`、`opencode_generated_runtime_loader_unverified` reason code。`hasCommands=true`，`/spec-*` command + skill 双入口。OpenCode 是 CLI agent，`extends PlatformAdapter`。worker dispatch 由 07-28 plan 单一 owner——`transformSkillContent` 只做 path rewrite。
- **预览即交付。** 缺 OpenCode CLI 时，最高交付状态为 `generated_runtime_preview`。真实 loader 证据到达后，按 Cursor 两级晋升（preview → loader-confirmed），不新建状态机。
- **6th host 增量。** `getSupportedPlatformsWithState()` 新增函数，返回 `[{id, support_state}]`，5 host 默认 `active`，OpenCode 为 `preview`。`getSupportedPlatforms()` 5 host 行为不变。

### Actors

- A1. **OpenCode 社区用户：** 选择 OpenCode 安装 spec-first workflow；需 `OPENCODE_DISABLE_EXTERNAL_SKILLS=1` 解决 collision。
- A2. **Project maintainer：** 维护跨宿主 source、preview 状态与 U6 evidence。
- A3. **OpenCode runtime：** 发现命令/skills、执行 agent、MCP、权限。当前不可用。

### Requirements（保留 v2 核心，删除 worker 相关）

**Installation and lifecycle**

- R1. 交互式 `spec-first init` 展示 OpenCode，标注 `support_state=preview`。
- R2. CLI 支持 `--opencode` 显式选择。
- R3. 首版 opt-in，不进入 `init -y` 默认集合。
- R4. 与 Codex 等宿主独立共存，clean 不破坏共享 `AGENTS.md`（依赖 U0）。
- R5. 进入 init/doctor/update/clean/help 生命周期；auto-detection 只接受 valid managed state 或 registry 声明的精确 managed asset。

**Workflow and agent experience**

- R6. 双入口：`/spec-*` 原生命令 + Agent Skills 发现。
- R7. 全部 governed workflow/standalone/internal skills 按治理分类投射，无 partial delivery。
- R8. worker dispatch 由 07-28 plan 承接。OpenCode adapter 的 `supportsAgents=false` 不是 worker capability 声明；primitive identity/arguments 只来自当前会话 provider-owned tool schema。

**MCP, permissions, and configuration**

- R9. MCP 默认 project 级配置，`--user-scope` opt-in user 级（XDG 解析）。
- R10. 增量维护 spec-first entries，保留用户已有配置；ownership 由 `managed_config_receipts` 证明。
- R11. 权限最小化：exact skill `allow` + 危险工具 `ask` baseline，不写 wildcard/global allow。
- R12. Hooks/plugins 不进入首版。

**Evidence and release**

- R13. deterministic projection 通过后，缺 CLI 可交付 `generated_runtime_preview`。
- R14. 高于 preview 的支持需版本化 real-runtime evidence（command/skill/MCP/permission 旅程）。
- R15. `doctor` 展示 `support_state` 与 `tested_versions`，缺失时返回 `opencode_version_unverified`。
- R16. OpenCode runtime 是 generated runtime，修复应改 source 再 `spec-first init`。

### Key Flows

- F1. **安装：** 交互选择 → preview 写入 → 输出 `support_state=preview`。
- F2. **多宿主：** `--opencode` 与其他 host 组合，独立 runtime/state，共享 `AGENTS.md`（U0）。
- F3. **运行 workflow：** 双入口加载 source-owned body；worker dispatch 走 07-28 plan。
- F4. **配置：** Runtime Setup 增量维护 MCP/permission，`managed_config_receipts` 证明 ownership。
- F5. **晋升：** CLI 可用时，U6 real-runtime evidence → loader-confirmed preview。

### Acceptance Examples

- AE1. 交互选择 OpenCode → 只生成 OpenCode runtime，标注 `preview`。
- AE2. Codex+OpenCode 共存 → collision action-required（未启用 guard）；启用 guard 后 journey 通过 → loader-confirmed preview，标注 `guarded` qualifier（非独立状态；需 U0 已 land）。
- AE3. `init -y` 不安装 OpenCode；`--opencode -y` 安装。
- AE4. 双入口加载同一 source-owned body；worker 由 07-28 plan 验证。
- AE5. 已有 MCP/permission 配置不被覆盖；managed entries 有 receipt 证明。
- AE6. 无 CLI 时 doctor 报告 `generated_runtime_preview`，`tested_versions=[]`。
- AE7. 真实 CLI 旅程覆盖 command/skill/MCP/permission/worker → 晋升。

### Success Criteria

- OpenCode 作为 6th preview host 在 `platform-registry` + `getSupportedPlatformsWithState()` 注册。
- 全部 governed workflow/skills 投射到 `.opencode/`。
- 与 5 host 共存，共享 `AGENTS.md` 不受 single-host clean 破坏（U0）。
- 缺 CLI 时 `generated_runtime_preview` 交付；真实 evidence 到达后晋升。

---

## Planning Contract

### Architecture Posture

- **`extend`**。`OpenCodeAdapter extends PlatformAdapter`（CLI agent，不需 pointer file）。preview 诊断照抄 Cursor（`degradedByDesign=true`），命令入口照抄 Qoder（`hasCommands=true`）。worker dispatch、primitive mapping、evidence state machine 均不进入本 plan。
- KTD1-KTD10 是标准 6th host extension。无新 contract schema、无新 validator、无新状态机。

### Key Technical Decisions

- KTD1. **Compatibility skill collision guard + runtime paths。** Runtime paths：`runtimeRoot=.opencode`、`commandRoot=.opencode/commands/spec`、`skillsRoot=.opencode/skills`、`workflowsRoot=.opencode/skills`、`stateFile=.opencode/spec-first/state.json`、`instructionFile=AGENTS.md`。OpenCode 同时发现 `.agents/skills` 和 `.claude/skills`——adapter/doctor 检测同名 collision，未启用 `OPENCODE_DISABLE_EXTERNAL_SKILLS=1` 时返回 `opencode_external_skill_collision` action-required。启用 guard 后晋升 loader-confirmed preview，标注 `guarded` qualifier。**若目标 OpenCode 版本不支持该 env var**（当前基于 `dev` 分支观察，未在 stable `1.18.7` 验证），降级为 doctor warning + 文档提示，不阻断安装。

- KTD2. **双入口共享 source。** `workflow_command` = `command`，standalone = `skill`，internal = `internal`。两个入口同一 body。与 worker dispatch 正交——双入口走本地 loader 的 command/skill 发现，worker 走 07-28 plan。

- KTD3. **Worker dispatch 由 07-28 plan 单一 owner。** `supportsAgents=false`（与 Cursor 完全一致）。OpenCode adapter 不持有 dispatch、binding、selection 或 worker-dispatch 文案。primitive identity/arguments 只来自 provider-owned current-session tool schema。详见 `docs/plans/2026-07-28-001-refactor-host-neutral-worker-dispatch-plan.md`（claim 已关闭）。

- KTD4. **共享 `AGENTS.md` 三态判定（U0）。** 存量缺陷，先于 OpenCode 存在。`clean --opencode` 只有在其他共享 `instructionFile` 的 consumer 全部 `confirmed_absent` 时才移除 managed block。由独立 U0 交付。

- KTD5. **配置 ownership 由 file hash 比对证明（首版简化）。** `spec-first clean --opencode` 删 runtime；`--uninstall-host-config` 删 config。首版使用简单 file hash 比对验证 config ownership——写入前存 `opencode.json` SHA-256，uninstall 时比对当前 hash 与写入时 hash，匹配才删除 managed entries。不新增 `managed_config_receipts.v1` schema 或 receipt-ledger lock。receipt collection 留待 setup-registry 跨宿主统一升级时一并设计。hash 不匹配 → fail closed，保留用户内容。

- KTD6. **MCP project-first，user-scope 显式授权。** project target `opencode.json`；user target 经 XDG 解析。`MCP_SETUP_HOST=opencode` 是 mutation authority。`opencode debug config` 仅在可信绝对 realpath + 无 shell + 超时/输出上限下执行，否则保持 `opencode_effective_config_unverified`。

- KTD7. **权限最小化。** 从 governed asset set 派生 exact skill `allow`（含 `using-spec-first`），危险工具 `bash`/`edit`/`task`/`webfetch`/`websearch`=`ask`（仅当无匹配用户规则时）。按 OpenCode last-match 语义校验顺序——冲突时 action-required，零 mutation。`--auto` 不用于安全晋升。

- KTD8. **严格 JSON writer，JSONC 只读。** 只写 `opencode.json`，永不写 `opencode.jsonc`。JSONC 是唯一有效配置/higher-precedence target 时阻断 mutation。

- KTD9. **治理与 registry 原子升级。** `skills-governance` 升 schemaVersion，新增 `host_delivery.opencode`。`setup-registry` 升版本，新增 host `opencode` + JSON container/server shape + permission contract。

- KTD10. **Preview 诊断照抄 Cursor，命令入口照抄 Qoder，继承链独立决策。** `supportsAgents=false`、`degradedByDesign=true`、`opencode_generated_runtime_loader_unverified` reason code。`hasCommands=true`。`extends PlatformAdapter`（不从 PointerBasedAdapter 继承——OpenCode 是 CLI agent，不需要 `.cursor/rules/spec-first.mdc` 式的 pointer file）。preview → loader-confirmed 两级晋升。U6 real-runtime summary 引用 07-28 plan 的 journey evidence 格式（`observed_primitive`、`schema_excerpt_sha256`、`live outcome`），存于 `docs/validation/<date>-opencode-host-support/`。

### Interface Contracts（核心 5 个）

| Interface | Consumer | Summary |
|---|---|---|
| `OpenCodeAdapter` | plugin sync, lifecycle | `hasCommands=true`、`supportsAgents=false`、`.opencode/` paths。`transformSkillContent` 只做 path rewrite |
| `getSupportedPlatformsWithState()` | doctor, update, catalog | 返回 `[{id, support_state}]`，5 host = `active`，OpenCode = `preview` |
| `skills-governance` schema vNext | plugin manifest, filtered asset set | 每条 record 需 `host_delivery.opencode` |
| `setup-registry` vNext | Runtime Setup | 新增 host `opencode`，JSON container `mcp`，permission entries |
| `opencode.json` managed slice | OpenCode runtime | 增量 MCP/permission entries，`managed_config_receipts` 证明 ownership |

---

## Implementation Units

### U0. 共享 AGENTS.md Consumer 三态判定（存量缺陷修复）

- **Goal:** single-host clean 不再误删其他宿主消费的 `AGENTS.md` managed block。**先于 OpenCode 存在，可独立 land。**
- **Files:** `src/cli/commands/clean.js`、`tests/unit/managed-removal-ownership.test.js`、`tests/integration/init-five-host-lifecycle.integration.test.js`
- **Approach:** `buildRuntimeCleanupPreview()` 改为三态判定（`present`/`confirmed_absent`/`uncertain`）。只有其他 consumer 全部 `confirmed_absent` 才移除 managed block。
- **Test:** Codex+Cursor 双宿主 `clean --codex` → managed block 保留；4 宿主全部 absent → 移除。

### U1. OpenCodeAdapter + Runtime Ownership

- **Goal:** 新增 `OpenCodeAdapter`，照抄 Cursor 模式。
- **Files:** Create `src/cli/adapters/opencode.js`；Modify `index.js`（+`getSupportedPlatformsWithState()`）、`platform-registry.js`、projection/plugin tests。
- **Key behavior:** `supportsAgents=false`、`degradedByDesign=true`。`inspectRuntimeFiles` 返回 3 个 check：① `opencode_generated_runtime_loader_unverified`（loader 未验证），② `opencode_external_skill_collision`（`.agents`/`.claude` 同名 skill 未隔离），③ `opencode_command_or_skill_root_partial`（command/skill 文件缺失）。`transformSkillContent` 只做 path rewrite，不注入 primitive mapping。

### U2. CLI Lifecycle（--opencode flag）

- **Goal:** `--opencode` 接入 init/doctor/update/clean/help。
- **Files:** `init-args.js`、`init.js`、`doctor.js`、`clean.js`、`update.js`、`index.js` + 相关 tests。
- **Key behavior:** `init -y` 默认集合不变（5 host）。`doctor --opencode` 输出 `support_state=preview`。`clean --opencode` 依赖 U0 三态判定——U0 未 land 时，`present`/`uncertain` 路径用 conditional skip 标记并阻塞 D2，不得用 conditional skip 代替 gate pass。

### U3. Governance Schema + Catalog 原子扩展

- **Goal:** `host_delivery.opencode` 加入 governance schema/data，catalog 同步。
- **Files:** `skills-governance.schema.json`、`.json`、`plugin-manifest.js`、`plugin-governance.js`、`generate-runtime-capability-catalog.js`、`check-release-continuity.cjs` + tests。

### U4. Runtime Setup — MCP + Permission

- **Goal:** `spec-runtime-setup` 支持 OpenCode MCP/permission 配置。
- **Files:** `setup-registry.json`/`.schema.json`、`host-config.cjs`、`host-authority.cjs`、`facts.cjs`、`runtime-executor.cjs` + 14 个脚本/tests。
- **Key behavior:** `MCP_SETUP_HOST=opencode`、project `opencode.json` target、XDG user target、`managed_config_receipts`、permission last-match 校验。

### U5. Docs + Package + Release Surface

- **Goal:** README/CHANGELOG/source-runtime boundary/context-governance 同步 OpenCode 为 6th preview host。
- **Files:** `README.md`、`README.zh-CN.md`、`CHANGELOG.md`、`CLAUDE.md`、`AGENTS.md`、`gitignore-policy.js`、`docs/contracts/context-governance.md`、`docs/contracts/source-runtime-customization-boundary.md`、`src/cli/adapters/host-comparative-config-paths.js`、`package.json` + tests。

### U6. Real OpenCode Evidence（需 CLI）

- **Goal:** 真实 OpenCode CLI 旅程验证——command/skill/MCP/permission/worker。
- **Files:** `docs/validation/<date>-opencode-host-support/` 下的 journey evidence。worker journey 引用 07-28 plan 的 semantic request + output contract。
- **Fallback:** 缺 CLI 时 `tested_versions=[]`，状态保持 `generated_runtime_preview`，不伪造。

---

## Verification Contract

| Gate | Applies to | Expected |
|---|---|---|
| U0-U5 focused tests | Each unit | 新增 scenarios pass；5 host back-compat 不破 |
| `npm run typecheck` | CLI/scripts | 190 files |
| `npm run lint:skill-entrypoints` | Skill/governance | 313 files |
| `npm run test:unit` | All source owners | 1560 tests |
| `npm run test:smoke` | CLI/package | 5 tests |
| `npm run test:integration` | Lifecycle | 37 tests（+ U0/OpenCode integration） |
| `npm run build` | Package | Tarball 含 adapter/registry/contracts，不含 `.opencode/` runtime |
| `git diff --check` | Final diff | 无 whitespace error；无手改 generated runtime |
| Fresh-source eval | U1-U5 | 状态 traceable；缺授权时记录 `not_run` |
| U6 real-runtime | Promotion | 需 OpenCode CLI；缺 CLI 时保持 preview |

---

## Definition of Done

- [x] **D1.** v3 重写完成——v2 的 KTD13 三层 evidence contract、7 状态机、cross_plan_refs validator、Appendix A reason code 表全部删除。worker dispatch 由 07-28 plan（claim closed）单一 owner。
- [ ] **D2.** U0 三态判定 land（OpenCode R4 硬前置）。
- [ ] **D3.** `OpenCodeAdapter` 按 Cursor 模式实现：`supportsAgents=false`、`degradedByDesign=true`、`opencode_generated_runtime_loader_unverified`；`transformSkillContent` 只做 path rewrite。
- [ ] **D4.** `getSupportedPlatformsWithState()` 返回 6 entries，OpenCode = `preview`。`getSupportedPlatforms()` 5 host 不变。
- [ ] **D5.** Governance schema + setup-registry 原子升级，5 host back-compat。
- [ ] **D6.** CLI lifecycle（`--opencode` init/doctor/update/clean）通过。
- [ ] **D7.** U0-U5 tests + typecheck + lint + build 全过。
- [ ] **D8.** U6 real-runtime evidence 或诚实 `not_run: opencode_cli_unavailable`。
- [ ] **D9.** Generated runtime 未手改。
