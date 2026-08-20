# CE 本地化与全量 Skill 第三轮审查报告

> 本报告绑定当前 target source snapshot：`source_tree_hash=20cd90fe19cce704960e3ee3df95022aa0cb9e6690500a2980e611212867712e`、`dirty_path_manifest_sha256=d6f3c6b1ae0e309ffb32d97268bfc761454488874921918d84fca1114023312c`。当前 closeout 以 deterministic validator 为准；provider、runtime adoption 和 field outcome 仍受本报告 Claim Ceiling 限制。

## 结论

当前不能进入“全部 Skill 已改善”或“CE 集成已完成”的声明。第三轮已完成当前工作树的全量 source packet coverage：36 个 canonical Skill、571 个 package path、5,848,328 bytes，文件缺失 0、inventory hash/byte mismatch 0；另有 392 条 direct-support relations、186 个 unique direct-support paths。两个角色 lane 均为内部模拟视角，`role-simulated/provider_unverified/degraded_inherited`，不是 OpenAI 或 Anthropic 公司审查，也没有真实跨模型独立性证明。

语义审查产物显示：当前聚合包含 13 个已完成 source-contract closure 的 P1/P2 历史 finding，以及 2 个 OpenAI lane 的 P3 `defer-pending-measurement`。`spec-ideate` 与 `spec-sweep` 的本轮 source 修复已由 Anthropic lane 回源确认并关闭；P3 只在取得 paired token/latency/quality 数据后重评。Round 3 的最高 claim 是“当前源码合同与审查范围可追溯”，不是现场价值或真实 provider 结果。

## 冻结范围与证据

| 维度 | 结果 |
|---|---|
| target HEAD | `741175a23615e37382ce65ec1e0448abfa214e95` |
| canonical Skill | 36/36 |
| package path | 571/571 |
| package bytes | 5,848,328 |
| package missing/hash mismatch | 0/0 |
| direct-support relations | 392 |
| unique direct-support paths | 186 |
| source-tree hash | `20cd90fe19cce704960e3ee3df95022aa0cb9e6690500a2980e611212867712e`，见 inventory/coverage artifact |
| inventory hash | `9d4241fec4cdf655e0912a3b55905520c04fc6000be5f8c2c7aec5e9eab432de`，见 inventory snapshot |
| dirty manifest | `d6f3c6b1ae0e309ffb32d97268bfc761454488874921918d84fca1114023312c`，计算时排除 `docs/validation/ce-localization/**` derived artifacts |
| excluded | `skills/autoresearch` tracked symlink，host-owned/local-only，不计入 36 |

确定性产物：[round-3-source-coverage.json](/Users/kuang/xiaobu/spec-first/docs/validation/ce-localization/review/round-3-source-coverage.json)。该产物明确禁止 blanket 纳入整个 `src/**` 或 `tests/**`；当前 `unresolved_non_semantic_boundary` 为 `null`，`spec-write-tasks` 的 Claude command template 已纳入当前 source inventory。

## 两条角色 Lane

| Lane | 覆盖 | 结果 | 可信边界 |
|---|---:|---|---|
| OpenAI skill-engineering lens | 36 Skill / 571 package / 186 direct-support / 392 relations | 2 个 P3 deferred；无 P1/P2 source defect | 无 provider receipt，context isolation degraded/inherited |
| Anthropic skill-craft/safety lens | 36 Skill / 571 package / 186 direct-support / 392 relations | 历史 P1/P2 均已 source-contract closure | 完整静态 source coverage，不等于 fixture/runtime execution；无 provider receipt |

两个 lane 都重新读取当前 source；其中 OpenAI artifact 的 receipt 是结构化 packet coverage，Anthropic artifact 的 package status 是 `complete-static`。两者均没有把 hash receipt 当作“每行得到等强度语义注意”的证明。

## Findings 与对抗校准

完整机器可读聚合见 [round-3-findings.json](/Users/kuang/xiaobu/spec-first/docs/validation/ce-localization/review/round-3-findings.json)。结论如下：

| 范围 | 主要问题 | 当前裁决 |
|---|---|---|
| `spec-code-review` / `spec-plan` | 常驻入口较大，但没有 paired runtime-cost 与 behavior-quality 数据 | OpenAI-only，P3，`defer-pending-measurement` |
| `spec-ideate` | 历史 non-software web research default 与 opt-in gate 冲突 | 已统一为 explicit opt-in，并由 current source + focused test 回源关闭 |
| `spec-sweep` | 历史默认 state owner/topology 冲突 | 已统一 repo-local durable 默认、committed explicit opt-in，并由 current source + focused test 回源关闭 |
| 其余 Round 1/2/3 P1/P2 | 授权、外发、状态、工具边界等历史反例 | 已有 owner source fix、focused verification 和 current snapshot closure evidence；不外推 runtime/field |

“一方未发现”只表示该 lane 没有提出同一 finding，不等于反证。聚合 owner 没有用多数票关闭任何单方 finding。

## `ce-setup` 前置依赖

本轮没有实现 `ce-setup` 新入口，也没有复制 `spec-setup`、`spec-mcp-setup`、CE config namespace 或 host entry。当前方案要求这些语义由 `spec-runtime-setup`、CLI、doctor、配置 consumer 和下游 Skill 既有 owner 选择性吸收；无真实 consumer 的语义保持 `evidence-only/defer/reject`。

当前 prerequisite preflight 为 `confirmed`，dependency matrix 已由 canonical producer 生成并通过 schema/source-snapshot 校验：S1-S11 中 9 项 `confirmed`、S4 为 `degraded`、S9 为 `evidence-only`，矩阵整体仍为 `degraded`。因此 setup 相关 Skill 仍不能被全局标为 `mechanism-improved` 或 `implementation-ready`；CE upstream artifact 也不能绕过当前 target snapshot/dirty manifest 绑定。

## Round 状态

- Round 3 source coverage：已完成，机器产物可复核。
- Round 3 两条语义 lane：已完成静态读取和 per-Skill 结论，但 provider/isolation 降级。
- Round 3 cross-lens calibration：已完成 serialized aggregation；P1/P2 source-contract findings 已关闭，2 个 P3 保持 deferred。
- Round 1/2 machine artifacts：`round-1-findings.json` 与 `round-2-findings.json` 已存在，均绑定当前 source snapshot，各有 18 条 terminal disposition 且无 open finding；它们证明 source-bound review closure，不外推 runtime/field outcome。
- Owner fix/reverify：`spec-ideate`、`spec-sweep` 已执行 source-first 修复和 focused verification；其余历史 closure 依赖此前 owner evidence；未刷新 generated runtime。

## Claim Ceiling

本轮支持的 claim：当前 working-tree canonical Skill source 在冻结 HEAD 下被完整枚举、哈希对账，并由两个内部角色视角进行 source-bound 静态审查；P1/P2 历史合同问题已有 source-bound closure，另有 2 个 P3 仅作测量待办。

本轮不支持的 claim：真实 OpenAI/Anthropic 公司或员工参与、跨模型独立审查、宿主缓存后的行为、generated runtime 已同步、provider/浏览器/Xcode/数据库现场结果、time-to-trusted-change、返工率、人工审查负担、用户采纳或真实研发价值已提升。

## 最终验证

| 验证 | 结果 | Claim ceiling |
|---|---|---|
| CE v2 full-window report-only freshness | 通过，517 records / 33 packages / 9 serialized patches | 只证明当前 target snapshot 下的上游路径账本新鲜 |
| CE/localization focused Jest | 5/5 suites，82/82 tests 通过 | 只证明本地化、setup、reconciliation 与本轮 closeout 合同 |
| `npm run typecheck` | 218 files 通过 | 语法检查 |
| `npm run lint:skill-entrypoints` | 327 files 通过 | Skill 入口结构治理 |
| `npm run test:unit` | 177/179 suites，2081/2083 tests 通过；2 个失败均为并发 dirty overlap（`CHANGELOG.md` 格式、`AGENTS.md` 生成同步） | 本轮 CE 相关 unit 均通过；仓库 unit aggregate 未完全通过 |
| `npm run test:smoke` | 1/1 suite，5/5 tests 通过 | CLI/打包初始化 smoke |
| `npm run test:mcp-setup` | 33/33 suites，658/658 tests 通过 | Runtime Setup/MCP 聚合合同；不证明真实 provider serving |
| `npm run build` | `npm pack --dry-run` 通过，785 files | 发布包内容可生成 |
| `npm run test:integration` | 13 suites、60/62 tests 通过，1 suite/2 tests 按既有条件跳过；其中 six-host lifecycle、workspace graph projection/refresh 均通过 | 只证明当前 integration fixtures；不证明真实 provider serving 或 field outcome |
| `git diff --check` | 通过 | 只证明 diff whitespace 合同 |

### 隔离 pack/init/doctor 验证（此前快照证据）

以下记录来自此前 source snapshot 的隔离验证；本轮没有把它们重新执行后的结果冒充当前 source 的新鲜现场证据。当前轮只新增 `npm run test:smoke` 中的 packed-tarball smoke，并继续把真实宿主现场与 runtime adoption 置为未验证。

在临时 consumer 与临时 `HOME` 中使用当前源码生成 tarball，并通过 tarball 安装后执行六宿主初始化：

| 检查 | 结果 | 证明边界 |
|---|---|---|
| `npm pack` + consumer install | 通过，`spec-first-1.15.1.tgz` | 发布包可安装；不证明外部 registry/provider |
| `init --claude --codex --cursor --kiro --qoder --opencode -y` | 6/6 rc=0 | 六宿主 managed projection 可生成 |
| 六宿主 `doctor --json` | 6/6 `install_health=pass`、ERROR=0、drift=0 | 只证明临时投影与 doctor 合同 |
| 第二次 init | 513 files snapshot 完全相同 | 幂等性 |
| `clean --codex --dry-run` | rc=0，78 managed paths | 预览语义；未执行删除 |
| canonical `setup.cjs` / `setup-registry.json` hash | 与 tarball source 分别为 `5ed8fcbb...` / `747679c4...` | source/projection 保真；不证明宿主 loader/event |

宿主 claim ceiling：Claude/Codex 为 runtime projection confirmed，但 fresh session invocation 未运行；Cursor/OpenCode 为 `generated-runtime-preview`；Qoder 的 hook activation/authenticated event execution 未验证。临时 sandbox 路径与一次性安装结果不构成真实企业宿主现场或 runtime adoption 证据。

本轮新增验证记录：`npm run lint:skill-entrypoints` 扫描 327 files 通过；`npm run test:mcp-setup` 33/33 suites、658/658 tests 通过；`npm run test:integration` 13 suites、60/62 tests 通过（1 suite/2 tests 按既有条件跳过）；`npm run test:smoke` 5/5 tests 通过（包含 packed tarball 六宿主 smoke）；`npm run typecheck` 218 files 通过；CE closeout `--verify-closeout` 返回 `valid`；`npm run check:shared-references` 无漂移。`npm run test:unit` 的两个失败属于并发 dirty overlap，未归因于本轮 CE 改动。这些结果证明 source/contract/build/integration fixture 层行为，没有把 provider serving、runtime adoption 或 field outcome 当作已完成。

### 独立对抗式验证

| 场景 | 结果 | 证明边界 |
|---|---|---|
| 内存篡改 `source_snapshot.source_tree_hash` 后运行 closeout validator | fail-closed，返回 source snapshot/inventory mismatch | validator 不接受漂移 artifact |
| 普通 public setup 使用与 loaded Skill root 不一致的 host pin | fail-closed，3 个 host-authority tests 通过 | surface binding 未被内部 refresh 例外放宽 |
| lifecycle lease + async refresh 底层单测 | 2 suites、63 tests 通过 | token/PID/start-marker、抢占、释放与 pending 合并合同 |
| workspace graph focused integration | 4/4 tests 通过 | 连续 commit、provider partial、explicit build/clean 并发边界 |
| CE localization closeout contract tests | 5 suites、82/82 tests 通过；源码快照漂移时先 fail-closed，显式更新 adjudication/review delta 后恢复 `valid` | closeout freshness、schema、join key、promotion gate 的确定性边界 |

上述对抗式验证仍属于 deterministic/fixture evidence；没有 provider-authenticated receipt、真实宿主现场或代表性研发任务 cohort，因此不提升 `runtime_cost` 或 `field_outcome` claim。

此前 workspace graph integration residual 已在 canonical `spec-runtime-setup` source 修复：detached refresh 在完整 lifecycle credential + pinned launcher 下不再被 public surface gate 误阻断，同时不完整内部上下文仍 fail closed。方案仍保持 `active`，因为 provider/field/runtime/knowledge 证据尚未闭合，不生成 completed、runtime adoption、commit 或 landing 声明。

## 下一步

1. 为 `spec-code-review` 与 `spec-plan` 建立 paired token/latency/correction-burden/behavior-quality measurement，再决定是否拆分入口。
2. 运行 fresh generated-runtime/provider/field validation；本报告不把 source-contract closure 外推为现场完成。
3. 关闭 `ce-setup` S4 的 degraded 边界，并确认 S9 `evidence-only` 的 terminal disposition；在此之前不升级 setup-related downstream claim。
4. 继续补齐 provider serving、field validation、generated runtime adoption 与 knowledge promotion 的真实证据；workspace graph integration 修复已完成并通过 focused/full integration 回归。

验证边界：本轮已完成 JSON 自洽、source hash/line anchor、inventory coverage、聚焦测试、workspace graph integration 回归、packed-tarball smoke、`npm run check:shared-references` 和 `git diff --check`；完整 unit aggregate 受两处并发 dirty overlap 影响未全绿。此前隔离 tarball 六宿主 pack/init/doctor 记录保留为历史证据；当前仓库未执行 generated runtime refresh，仍未执行 field validation、provider serving、fresh host session invocation、commit/push/PR。
