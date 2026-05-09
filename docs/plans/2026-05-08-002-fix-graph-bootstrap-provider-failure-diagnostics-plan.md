---
title: "fix: 强化 graph-bootstrap provider failure 诊断与恢复指引"
type: fix
status: active
date: 2026-05-08
spec_id: 2026-05-08-002-graph-bootstrap-provider-failure-diagnostics
target_repo: spec-first
origin: "用户现场：父级多仓 workspace 重跑 spec-graph-bootstrap 后 GitNexus 全仓 bootstrap failed，code-review-graph 单仓 PyPI TLS failed"
---

# fix: 强化 graph-bootstrap provider failure 诊断与恢复指引

## 概览

父级多仓 workspace 重跑 `spec-graph-bootstrap` 后，父级 advisory summary 仍为 `partial / all-repos-degraded-fallback`。本次现场证据显示这不是单一 graph readiness 问题，而是两个 provider failure mode：

- GitNexus 在 `analyze --force` bootstrap 阶段失败，日志反复出现 `.gitnexus/lbug` 无法打开、`VECTOR extension load failed`、`COPY failed for File`、`Error 3: The system cannot find the path specified`。这说明 GitNexus 还没有进入 `status` 或 `query_probe`，失败点是 repo-local `.gitnexus` index / vector extension storage 初始化。
- code-review-graph 在 `hs-kaz-crm-money-service` 上因 `pypi.org` / `tls handshake eof` 下载失败，属于 provider package registry / network 层失败，而不是该业务仓图谱必然损坏。

当前 `spec-graph-bootstrap` 的父 workspace 行为是正确的：不传 `--repo` / `-Repo` 时默认 all-child-repos maintenance，只写父级 `.spec-first/workspace/graph-bootstrap-summary.json` advisory summary，并把 canonical artifacts 写回 child repos。缺口在于 failure classification 还不够精确，导致 GitNexus storage/index 问题和 PyPI/TLS 网络问题都可能落到泛化的 `provider-command-failed`。

本计划把这类泛化失败升级为结构化 `reason_code`、`failure_class`、`recommended_action`，并补充现场恢复 runbook。它遵循角色契约：脚本只准备确定性 facts，LLM 负责解释影响、选择 fallback 和决定是否执行破坏性清理。

## 目标

- 为 GitNexus bootstrap 阶段的 repo-local index / vector extension storage failure 增加结构化分类。
- 为 provider package registry / TLS / PyPI 下载失败扩展网络分类。
- 保持 Bash 与 PowerShell graph-bootstrap parity。
- 保持 setup 与 bootstrap 边界：`spec-mcp-setup` 投影 provider command facts，`spec-graph-bootstrap` 只验证和执行已投影 argv，不反写 setup-owned config。
- 在 `spec-mcp-setup` 之后、GitNexus `analyze` 之前提供显式 repair/preflight 清理路径。
- 保持父级多仓 workspace 边界：父目录只写 advisory workspace summary，child repos 拥有 canonical graph artifacts。
- 明确删除 `.gitnexus` 是用户显式恢复动作，不由 graph-bootstrap 自动执行。
- 让最终报告能从“9 个 degraded”升级为“GitNexus 全仓 index storage 故障；CRG 单仓 network/TLS 故障”。

## 非目标

- 不修复或 fork GitNexus 内部 DuckDB / vector extension bug。
- 不让 `spec-graph-bootstrap` 自动删除 `.gitnexus` 或任何 provider index。
- 不把 live MCP probe 结果写回 compiled readiness。
- 不把 provider failure 变成 workflow hard state machine；`reason_code` 是证据，不是语义裁决。
- 不新增 persistent install 行为，不修改 shell profile，不全局安装 provider。
- 不把父 workspace 变成 repo-local graph artifact owner。

## 现场证据

GitNexus analyze raw log 关键片段：

```text
Schema creation warning: IO exception: Cannot open file. path: <child-repo>/.gitnexus/lbug - Error 3
GitNexus: VECTOR extension load failed: IO exception: Cannot open file. path: <child-repo>/.gitnexus/lbug - Error 3: The system cannot find the path specified.
Analysis failed: COPY failed for File: IO exception: Cannot open file. path: <child-repo>/.gitnexus/lbug - Error 3: The system cannot find the path specified.
```

判断：

- 失败阶段是 GitNexus `bootstrap` / `analyze`，不是 `query_probe`。
- `graph_ready=false` 与 `query_ready=false` 是合理输出，因为 status/query proof 尚无可信前置。
- `gitnexus.list_repos({})=[]` 只能作为 current-session empty/unavailable 佐证，不能替代 compiled readiness。
- code-review-graph 的 `pypi.org` / `tls handshake eof` 失败应归为 provider network/environment failure。

## 需求追踪

- **R1**. GitNexus bootstrap 阶段出现 `.gitnexus` / `lbug` / vector extension / `Error 3` / cannot open file / COPY failed 诊断时，输出稳定结构化分类。
- **R2**. PyPI、npm registry、TLS、SSL、certificate、connection reset/timeout 等 provider package download failure 统一归入 network/environment 分类。
- **R3**. Bash 与 PowerShell 脚本分类结果一致。
- **R4**. Provider status、normalized envelope、bootstrap report 和 parent workspace summary 继续保留 raw log pointer。
- **R5**. `query_ready=true` 仍必须满足 build/analyze、status、query-surface proof 三层证据，不能从 live MCP 成功或 definitions-only 推导。
- **R6**. `spec-graph-bootstrap/SKILL.md` Failure Modes 明确区分 GitNexus bootstrap storage failure 与 query FTS/read-only failure。
- **R7**. 现场恢复 runbook 明确：GitNexus 版本升级或 provider pin 切换后，显式清理 `.gitnexus` 并重建是推荐恢复路径；清理发生在 `spec-mcp-setup` 刷新 projection 之后、`spec-graph-bootstrap` analyze 之前。
- **R8**. 交互式 workflow 由 agent/workflow 层确认破坏性清理；脚本层不弹交互提示，只提供 preview-first 和显式 confirm 参数。
- **R9**. 所有 source 变更按项目规则同步 `CHANGELOG.md`。

## 关键决策

### D1. 新增 GitNexus bootstrap storage failure 分类

新增输出：

```text
reason_code=gitnexus-index-storage-unavailable
failure_class=provider-storage-unavailable
failed_phase=bootstrap
```

匹配信号：

- `.gitnexus`
- `lbug`
- `VECTOR extension load failed`
- `COPY failed for File`
- `Cannot open file`
- `IO exception`
- `The system cannot find the path specified`
- `Error 3`
- `Access is denied`
- `Permission denied`
- `EACCES`
- `EPERM`

推荐动作：

- 清理该 repo 的 `.gitnexus` 后单仓重跑。
- 检查 `.gitnexus` 写权限。
- 避免并发 `analyze` 同一 repo。
- 需要时用短英文路径做对照实验。
- 升级或回退 GitNexus provider 版本。
- 恢复前使用 code-review-graph 或 bounded direct reads。

### D2. 扩展 provider network classification

保留现有 `provider-network-unavailable` / `provider-environment`，扩展匹配：

- `pypi.org`
- `Failed to fetch`
- `tls handshake eof`
- `TLS`
- `SSL`
- `certificate`
- `CERT`
- `Connection reset`
- `Connection timed out`
- `ETIMEDOUT`
- `ECONNRESET`
- `EAI_AGAIN`

这覆盖 code-review-graph 通过 `uvx --upgrade code-review-graph build` 首次下载包时的 PyPI/TLS failure，也覆盖 npm/npx provider package network failure。

### D3. 升级后推荐显式清理 provider index，但不自动删除

GitNexus 版本升级、provider pin 切换、或 bootstrap storage failure 已确认后，推荐把 `.gitnexus` 删除重建作为标准恢复路径。原因是旧 provider 版本留下的 repo-local index / extension staging state 可能与新版本不兼容，继续复用会让同一错误反复出现。

但这个动作必须发生在 `spec-mcp-setup` 刷新 provider projection 之后、`spec-graph-bootstrap` 执行 GitNexus `analyze` 之前。这样可以确保清理后重建使用的是新 GitNexus package/version 和新 command projection。

这个动作必须是用户显式执行的 runbook 或显式 repair/preflight 参数，不能由 `spec-graph-bootstrap` 在普通 bootstrap 中自动执行。脚本只能输出 `recommended_action` 和 raw log pointer，不能直接删除 `.gitnexus`，因为：

- `.gitnexus` 是 provider-local generated/index state，但删除仍是破坏性动作。
- provider bug、权限、路径、并发问题需要用户或 operator 决策。
- 自动清理会模糊“脚本准备 facts、LLM 决策”的职责边界。

交互边界：

- 交互式 `$spec-graph-bootstrap` / agent workflow：先运行 repair preview，展示将删除的 child repo 与路径；用户确认后再执行 confirm repair。
- 脚本/headless/CI：不弹交互式问题；没有显式 confirm 时只输出 preview/action-required，不删除。
- `--all-repos` / `-AllRepos` repair preview 必须列出每个 child repo 的删除范围。

### D4. Parent summary 增强只做 advisory

父 workspace summary 可增加 reason bucket 统计或更清楚的 per-provider 聚合，但不得替代 child repo canonical artifacts。

建议聚合展示：

```text
gitnexus-index-storage-unavailable: 9
provider-network-unavailable: 1
ready_by_provider.code-review-graph: 8/9
ready_by_provider.gitnexus: 0/9
```

该聚合只用于 handoff 与诊断，不成为新的 graph readiness source of truth。

## 实施单元

### U1. Bash failure classifier 增强

文件：

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`
- `tests/unit/spec-graph-bootstrap.sh`

变更：

- 在 `classify_provider_failure` 中，于泛化 `provider-command-failed` 之前增加 GitNexus bootstrap storage failure 分支。
- 扩展 network classifier，覆盖 PyPI/TLS/SSL/certificate/connection failure。
- 确保 `recommended_action` 针对 storage failure 不建议盲目重跑，而是提示：版本升级后显式清理 `.gitnexus`，检查权限，先单仓验证，再批量重建。

测试场景：

- fake `npx gitnexus analyze` 输出 `.gitnexus/lbug - Error 3`，断言：
  `failed:gitnexus-index-storage-unavailable:provider-storage-unavailable:bootstrap:<exit_code>`
- fake `uvx code-review-graph build` 输出 `Failed to fetch: https://pypi.org/simple/code-review-graph/` 与 `tls handshake eof`，断言：
  `failed:provider-network-unavailable:provider-environment:bootstrap:<exit_code>`

### U2. PowerShell failure classifier parity

文件：

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`
- `tests/unit/mcp-setup-powershell-contracts.test.js`

变更：

- 在 `Get-ProviderFailureInfo` 中加入与 Bash 同等的 GitNexus storage failure 和 PyPI/TLS network failure 分类。
- 使用 PowerShell regex 覆盖 Windows 路径分隔符和错误文本大小写。
- 保持 `failed_phase`、`failure_class`、`reason_code`、`recommended_action` 字段与 Bash 一致。

测试场景：

- contract test 断言 `.ps1` 包含 `gitnexus-index-storage-unavailable`、`provider-storage-unavailable`、`VECTOR extension load failed`、`tls handshake eof`、`pypi.org` 等关键分类词。
- 如已有 PowerShell script-level fixture runner，可补可执行 parity；没有 Windows runner 时先保持 source-contract parity。

### U3. Workflow 文档与 failure modes 更新

文件：

- `skills/spec-graph-bootstrap/SKILL.md`
- `README.md`
- `README.zh-CN.md`

变更：

- 在 Failure Modes 中新增 GitNexus bootstrap storage/index failure。
- 明确 GitNexus query FTS/read-only failure 与 bootstrap storage failure 是两类不同问题。
- 在 Final Response Contract 中强调：bootstrap failed 时不要做 query readiness 推断；live MCP empty result 是 session-local evidence。
- README 只保留用户可见 runbook 摘要，不复制完整脚本分类逻辑。

### U4. Parent workspace summary 聚合增强

文件：

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`
- `tests/unit/spec-graph-bootstrap.sh`

变更：

- 在 all-repos summary 中增加可选 advisory 聚合，例如 `reason_buckets` / `provider_ready_counts`。
- 保持现有 `results[]` per-child 结构不破坏。
- 不把 parent summary 变成 canonical graph facts。

测试场景：

- all-repos fixture 中 2 个 child 出现不同 provider reason，断言 parent summary 保留 child row 且 reason bucket 正确。
- 确认 parent workspace 仍不写 `.spec-first/graph/*`、`.spec-first/impact/*`、`.spec-first/providers/*`。

### U5. 显式 repair/preflight 参数与确认模型

文件：

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`
- `tests/unit/spec-graph-bootstrap.sh`
- `tests/unit/mcp-setup-powershell-contracts.test.js`

建议参数：

Bash:

```bash
bash .agents/skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh \
  --repo hs-kaz-crm-service \
  --repair-gitnexus-index \
  --preview-repair

bash .agents/skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh \
  --repo hs-kaz-crm-service \
  --repair-gitnexus-index \
  --confirm-repair
```

PowerShell:

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -Repo hs-kaz-crm-service `
  -RepairGitNexusIndex `
  -PreviewRepair

pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -Repo hs-kaz-crm-service `
  -RepairGitNexusIndex `
  -ConfirmRepair
```

行为规则：

- `RepairGitNexusIndex` / `--repair-gitnexus-index` 只允许删除 `.gitnexus` 与 `.spec-first/providers/gitnexus`。
- 没有 `ConfirmRepair` / `--confirm-repair` 时，默认只 preview，输出 `workflow_mode=action-required` 或等价 machine-readable preview，不删除。
- `ConfirmRepair` 必须和 repair flag 一起出现；单独 confirm 直接 fail closed。
- `PreviewRepair` 与 `ConfirmRepair` 不能同时出现。
- repair preview 必须列出 repo label、repo path、将删除路径、缺失路径、是否在 child repo root 内。
- confirm repair 删除完成后再继续执行原本 provider bootstrap flow。
- all-repos 模式逐 child repo 执行同一规则，父 workspace 仍只写 advisory summary。

测试场景：

- 单仓 preview 不删除文件，输出将删除 `.gitnexus` 与 `.spec-first/providers/gitnexus`。
- 单仓 confirm 删除上述两类路径后继续 bootstrap。
- confirm without repair flag fail closed。
- preview 与 confirm 同时出现 fail closed。
- all-repos preview 列出每个 child repo 删除范围，且父 workspace 不写 repo-local artifacts。
- 路径 containment 防护：repair 不允许删除 child repo root 外路径。

### U6. 现场恢复 runbook 文档化

文件：

- `skills/spec-graph-bootstrap/SKILL.md`
- `README.zh-CN.md`

内容：

1. 先刷新 runtime 与 setup projection，确保 provider pin / command projection 已升级。
2. 升级后先运行 repair preview，展示将删除的 `.gitnexus` 和 `.spec-first/providers/gitnexus`。
3. 验证 `.gitnexus` 目录可写。
4. 交互式 workflow 向用户确认；确认后运行 repair confirm，并在删除后继续单仓 bootstrap。
5. 如果仍失败，用短英文路径对照。
6. 单仓成功后再对全仓运行 repair preview/confirm，并重建。

边界：

- 不建议删除 `.spec-first/config/graph-providers.json` 或 `runtime-capabilities.json`；刷新这些 setup-owned facts 应运行 `spec-mcp-setup`。
- 不建议在未升级或未确认 failure mode 前清理所有 provider artifacts；但 GitNexus 版本升级后，清理 `.gitnexus` 再重建应作为推荐恢复动作。

## 现场恢复建议

前提：先完成 spec-first runtime / GitNexus provider pin 升级与 `spec-mcp-setup` 投影刷新。升级后不要继续复用旧 `.gitnexus` index 作为主要验证路径，直接清理重建更稳定。

先用一个子仓 preview：

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -Repo hs-kaz-crm-service `
  -RepairGitNexusIndex `
  -PreviewRepair
```

交互式 workflow 展示将删除路径并取得用户确认后执行：

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -Repo hs-kaz-crm-service `
  -RepairGitNexusIndex `
  -ConfirmRepair
```

如果单仓成功，再批量 preview：

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -AllRepos `
  -RepairGitNexusIndex `
  -PreviewRepair
```

确认后全仓执行：

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 `
  -AllRepos `
  -RepairGitNexusIndex `
  -ConfirmRepair
```

短英文路径对照实验：

```powershell
# 复制或 clone 一个子仓到短英文路径后再单仓运行 GitNexus analyze / graph bootstrap
# 若短路径成功，优先怀疑 Windows + 中文路径/长路径/provider extension 组合问题
# 若短路径失败，优先怀疑 GitNexus 版本、vector extension、包缓存或运行环境问题
```

## 验证计划

最窄验证：

```bash
bash tests/unit/spec-graph-bootstrap.sh
npm run test:unit -- --runTestsByPath tests/unit/spec-graph-bootstrap-contracts.test.js tests/unit/mcp-setup-powershell-contracts.test.js
npm run typecheck
```

现场验证：

```powershell
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 -Repo hs-kaz-crm-service
pwsh -File .agents\skills\spec-graph-bootstrap\scripts\bootstrap-providers.ps1 -AllRepos
```

验收断言：

- GitNexus `.gitnexus/lbug - Error 3` 不再输出泛化 `provider-command-failed`。
- code-review-graph PyPI/TLS failure 不再输出泛化 `provider-command-failed`。
- 父级 `.spec-first/workspace/graph-bootstrap-summary.json` 仍是 advisory。
- child repos 继续写 canonical `.spec-first/providers/*`、`.spec-first/graph/*`、`.spec-first/impact/*`。
- live MCP probe 不会改变 compiled `query_ready`。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 过度匹配 `Cannot open file` | 非 GitNexus storage failure 被误分类 | 仅在 `provider=gitnexus` 且 `phase=bootstrap` 且日志包含 `.gitnexus` 或 vector/COPY/lbug 相关信号时命中 |
| PyPI/TLS 分类误伤业务命令失败 | 泛化 network reason 过宽 | 要求出现 provider package/network 关键词，如 `pypi.org`、`Failed to fetch`、`TLS`、`SSL`、`certificate` |
| PowerShell 与 Bash 分类漂移 | Windows 用户看到不同 reason_code | contract test 锁定关键 reason_code 与匹配词；后续有 Windows runner 时补 executable parity |
| 自动清理诱惑 | provider index 被脚本误删 | 默认 bootstrap 不清理；repair 必须显式 preview/confirm；交互确认在 workflow/agent 层 |
| 脚本交互提示阻塞 headless | CI 或自动化卡住 | 脚本不弹问题；没有 confirm 只输出 preview/action-required |
| all-repos repair 影响面过大 | 多个 child repo index 被误删 | all-repos preview 必须逐 child 列出删除范围，confirm 才执行 |
| Parent summary 变重 | advisory summary 被误当 canonical truth | 字段命名和文档明确 advisory；canonical artifacts 仍只在 child repos |

## 执行顺序

1. 落 U1/U2 failure classifier，先解决 evidence quality。
2. 落 U3 文档与 failure mode 说明。
3. 视需要落 U4 parent summary advisory 聚合。
4. 落 U5 repair/preflight 参数与确认模型。
5. 落 U6 runbook。
6. 运行最窄验证命令。
7. 在目标父 workspace 完成版本升级和 setup projection 刷新。
8. 升级后对一个子仓运行 repair preview，交互确认后 confirm repair 并单仓验证。
9. 单仓成功后对 all-repos 运行 repair preview，交互确认后 confirm repair 并全仓重跑。

## 完成标准

- `spec-graph-bootstrap` 能把 GitNexus bootstrap storage failure 明确分类为 `gitnexus-index-storage-unavailable`。
- `spec-graph-bootstrap` 能把 PyPI/TLS provider package failure 明确分类为 `provider-network-unavailable`。
- Bash 与 PowerShell source-contract parity 通过。
- README / SKILL 文档明确恢复动作和边界。
- Repair/preflight 默认 preview，不删除；显式 confirm 后才删除 `.gitnexus` 与 `.spec-first/providers/gitnexus`。
- `CHANGELOG.md` 记录本计划和后续实施变更。
