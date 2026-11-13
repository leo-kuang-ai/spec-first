---
artifact_type: execution-evidence
artifact_version: 1
updated_at: 2026-09-21
source_head: 36d19d95c3a79df2d1278083c959bb34eadbde8c
worktree_state: dirty
plan: docs/plans/2026-09-18-001-project-lead-cycle-1-plan.md
status: partial
claim_ceiling: C1（源码、合同、CLI/GUI安装事实与只读评审）；不支持真实宿主 workflow、真实模型或 field outcome
---

# 项目负责人周期 1 执行证据

本文件记录周期 1 的文档处置、宿主边界、U9 有界逻辑审查、benchmark 复算及评测闭环安排。它是计划执行证据，不是完整系统审查报告，也不把 GUI 安装、runtime 投射或本地静态检查升级为真实 workflow 成功。

## 1. B2.1 八宿主调用边界

### 1.1 三层口径

每个宿主分开记录：

1. **适配投射层**：由 source adapter/registry 确认 `source-supported`，由实际 generated assets 确认 `projected`；两者分别记录；
2. **loader 层**：该宿主是否实际发现并加载投射的 Skill/入口；
3. **workflow invocation 层**：在该宿主中真实调用并留下与当前 source、版本和请求绑定的 receipt。

CLI/GUI 安装与版本另记为环境事实，不能证明 spec-first 适配或投射。source-supported/projected 只证明各自已核查范围；没有 loader 或 invocation receipt 时，第二、三层保持 `degraded`、`not-run` 或 `unknown`。

### 1.2 当前机器观察

源码动态宿主全集来自 `src/cli/adapters/index.js#getSupportedPlatforms()`：

`claude`、`codex`、`cursor`、`kiro`、`qoder`、`opencode`、`zcode`、`pi`。

2026-09-20 PATH 与 GUI 安装版本观察（doctor 结论为 9 月 18 日历史摘要）：

| 宿主 | CLI / GUI 观察 | 适配投射层 | loader 层 | workflow invocation 层 | 当前 reason / 证据 |
|---|---|---|---|---|---|
| Claude | `claude` CLI 可见；版本 `2.1.278` | `source-supported`；历史投射可见，本轮未重验 | 未由本轮 receipt 证明 | `not-run` | `doctor --json --claude`：`loader_evidence=false`；执行证据缺失 |
| Codex | `codex` CLI 可见；版本 `0.155.1` | `source-supported`；历史投射可见，本轮未重验 | 未由本轮 receipt 证明 | `not-run` | `doctor --json --codex`：`loader_evidence=false`；执行证据缺失 |
| Cursor | 无 `cursor` CLI；GUI `/Applications/Cursor.app`，`3.19.7` | `source-supported`（`preview`）；历史 projected，本轮未重验 | `degraded` / unverified | `not-run` | reason: `cursor_cli_not_found`、`cursor_generated_runtime_loader_unverified`；GUI 适配不等于 loader/invocation |
| Kiro | 无 `kiro` CLI；GUI `/Applications/Kiro.app`，`1.1.14` | `source-supported`（`active`）；历史 projected，本轮未重验 | `degraded` / unverified | `not-run` | reason: `kiro_cli_not_found`、`kiro_generated_runtime_loader_unverified` |
| Qoder | `qodercli` 可见，版本 `1.0.41`；GUI `/Applications/Qoder.app` `1.20.1`、`Qoder CN.app` `1.6.0` | `source-supported`；历史 projected，本轮未重验；hooks 受限 | 本轮 loader 未测；hook activation 独立未验证 | `not-run` | `qoder_hook_activation_unverified` 仅约束 hook；settings entries 有意省略，不能据此推断 Skill loader 失败 |
| OpenCode | `opencode` CLI 可见；版本 `1.18.9` | `source-supported`（`preview`）；历史 projected，本轮未重验 | `degraded` / unverified | `not-run` | reason: `opencode_generated_runtime_loader_unverified` |
| ZCode | 无 `zcode` CLI；GUI `/Applications/ZCode.app`，`3.11.2` | `source-supported`（`preview`）；历史共享 Skill/SessionStart 投射，本轮未重验 | 未由本轮 GUI receipt 证明 | `not-run` | doctor：`zcode_cli_not_found`；adapter evidence claim 不能替代当前 GUI invocation |
| Pi | `pi` CLI 可见；本轮版本 `0.85.0` | `source-supported`（`preview`）；投射新鲜度本轮未重验 | 历史 discovery/trust 证据可回源；本轮未重新绑定 | `not-run` | doctor 当前 workflow evidence 缺失；不把历史 loader claim升级为本轮 workflow通过 |

CLI/GUI 安装观察命令：

```text
command -v claude codex opencode pi
command -v qodercli
/Applications/Cursor.app  3.19.7
/Applications/Kiro.app    1.1.14
/Applications/Qoder.app   1.20.1
/Applications/Qoder CN.app 1.6.0
/Applications/ZCode.app   3.11.2
```

本次脱敏后的版本事实保存在 [`host-installation-facts.json`](host-installation-facts.json)：仅包含 `PATH` 可见性、`--version` exit/version 和 `.app` Info.plist 版本，不包含配置、凭据或会话内容。

9 月 18 日八次 doctor 观察均为 `workflow_runnability: not_verified`、`runtime_asset_health: warn`。`doctor` 是 readiness consumer，不是 host-invocation receipt producer；不能把它不产 receipt 当故障。`host-invocation-receipt/v1` 由已加载 Runtime Setup 入口的 `host-authority.cjs` 产生，绑定 `host`、`loaded_host`、`surface_id`、`skill_root`、`canonical_entry_name`、`target_identity`、时间/freshness、`enforcement_status` 与 `receipt_sha256`；schema 没有 source identity 字段。审计 source hash 需另行绑定，receipt 本身也不证明任意 workflow 成功。历史 doctor 这里只保留会话摘要，不补造 raw log。

### 1.3 结论

- 四个 GUI 适配宿主 **Cursor、Kiro、Qoder、ZCode 均已纳入适配能力盘点**；Qoder 另有 companion CLI，不应统称四者 GUI-only。“无 CLI”只影响当前 shell invocation，不代表“未适配”。
- GUI 适配能力属于第一层。本轮尚未执行 GUI journey，第二、三层按本轮未验证记录；ZCode adapter 的历史 `skills_discovery_and_session_start_live_verified` 与 Pi 历史 discovery/trust 证据保留其原范围。没有核验 GUI 自动化能力不等于 GUI 无法验证。
- `--check`/doctor readiness facts 只能说明当前诊断范围内的本地事实；本轮 CodeGraph/Graphify 为 `unknown` / `first_generation: not-run`，与宿主 workflow 证据分开。

## 2. B2.2 Fresh-source 独立评审

初次 B2.2 评审状态：`concerns`；该次已读 16 文件内未报告 P1。这不覆盖后续 U9 新发现（见 §7）。

评审者为 fresh generic read-only reviewer，直接读取当前磁盘 canonical source；此前未采集 source hash，不能声称 hash-bound receipt。实际读取的核心路径包括：

- `skills/using-spec-first/SKILL.md` 及其 route/boundary references；
- `skills/spec-work/SKILL.md` 及 input/workspace/execution/shipping/return references；
- `skills/spec-doc-review/SKILL.md` 及 modes/intake/dispatch/synthesis references；
- `skills/spec-runtime-setup/SKILL.md` 及 `references/project-config.md`。

检查结果：reviewer 在已读 16 个文件内未报告上述边界的 P1；这不构成整个依赖闭包或运行行为通过。

候选意见（经 owner 回源裁决后再决定是否修复）：

| 严重度 | Finding | 证据 | 最小建议 |
|---|---|---|---|
| P2 | Runtime Setup 的 bare baseline mutation 与 `using-spec-first` 对 init/clean/update/deletion 不由路由授权的表述容易被误读为可执行任意 runtime maintenance | `skills/spec-runtime-setup/SKILL.md` bare/explicit mode 段；`skills/using-spec-first/references/conditional-routing-boundaries.md` Runtime Maintenance 段 | 明确 bare 仅覆盖 registry baseline install/init/setup facts 的 workflow-owned scope；不授权 `spec-first init/clean/update/deletion`、自动追加 `--repair-host-config` 或 `--project-config` |
| P3 | `spec-work` 的“shipping complete features”措辞可能把本地完成误读成已 commit/push/PR/发布 | `skills/spec-work/SKILL.md` 开头及 local-only closeout 边界 | 将 implemented、verified、local commit、pushed、PR、field outcome 明确拆开 |

主 owner 裁决：P2 是潜在误读，不是已证实的权限冲突；Runtime Setup 已有 baseline/显式 repair 边界。P3 的 opening 文案宽泛，但后文已有本地完成、commit 和 landing 分离。两项保留为 advisory 文案候选，本周期不作为 confirmed bug 修改 source。

限制：未验证真实宿主 loader、真实模型、provider invocation、field outcome；当前结果只支持源码语义审查。

## 3. B2.3 审查证据可复核性

一条审查证据可以被下一次独立执行者复放的最小字段：

1. `artifact_type`、`schema_version`、producer、consumer；
2. `captured_at`、source snapshot（commit 或 worktree digest）、dirty paths/排除项、运行环境与宿主/模型版本；
3. exact command / invocation、cwd、参数、授权来源、目标 scope 与 isolation；
4. 原始 exit code、状态枚举、redacted log/artifact path 与对应 hash；
5. 结论对应的 claim ceiling、limitations、freshness、invalidation condition 与 reason code；
6. 对外部 provider 或模型，记录 serving identity 的真实可验证级别，不能把 self-asserted receipt 写成 confirmed；
7. 对 mutation/host invocation，保留 pre/post state、surface、loaded host、skill root、target identity 和 receipt hash；
8. `not-run` / `blocked` / `degraded` 必须写明未执行原因、阻塞条件和重估触发器；
9. finding 必须有 direct evidence、owner、minimal fix、validation 与 re-evaluate 条件。

与现有合同对照：

- `docs/contracts/verification/verification-run-summary.md` 已覆盖 check status、ran/exit/log/reason code/redaction 与 `not-run` 边界；
- `docs/contracts/verification/worker-dispatch-host-journey.md` 已覆盖 exact host、source identity、授权、live invocation、mutation pre/post state 和 degraded journey；
- `docs/contracts/verification/provider-serving-receipt.md` 约束 v2 跨模型 subprocess 前普通自报 receipt 为 `unverified`，该路径退回 inline；不能推广成所有 provider 均不可认证；
- `docs/contracts/workflows/fresh-source-eval-checklist.md` 已规定 current disk source、reviewer context、status、limitations、source paths 与 claim limit。

差距：

| 差距 | 现状 | 影响 |
|---|---|---|
| FSA2 原始 receipt/raw log 删除 | 报告保留摘要，但无法逐项重放 55 artifacts、逐包 receipt 和完整 snapshot | 只能降级为 `record_validity: incomplete` / `degraded` |
| FSA3 fresh-source 证据 | 修复阶段 `fresh-source-review.json` 已有 source hashes、路径、结论与限制；原审 not-run 与修复复核须分开，均不等于真实宿主/模型证据 | 语义审查可复核范围有限，不能升级 C2/C3 |
| 旧 field validation | protocol/task-pairs/results 仍冻结但 `task_pairs: 0`、`results: []`、`overall_status: not-run` | 不能外推真实 actor、真实项目或 field outcome |
| 当前周期 fresh-source | U9 reviewer receipts 绑定冻结 source manifest；B/C1 原机械占位已撤销并逐包补审 | 逐包 source hashes、读取范围和缺口已进入 U9 receipts |

## 4. B3.1 既有 benchmark 适用性

基准：`benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`。

原报告计数不能复核一致：其正文称 45 次有效，20+10+14 实为 44。对附录四个现存结果文件复算：

| run | attempted | valid（correct 非 null） | excluded |
|---|---:|---:|---:|
| 20260820-173746 | 12 | 11 | 1 |
| 20260820-174459 | 12 | 12 | 0 |
| 20260820-185556 | 18 | 16 | 2 |
| 20260820-190610 | 18 | 16 | 2 |
| 合计 | 60 | 55 | 5 |

当前文件聚合为 baseline 21/21、spec-work 12/12、spec-debug 19/22。文件 SHA256、排除口径与各 arm 分母见 [benchmark-reconciliation.json](benchmark-reconciliation.json)。前两文件有 `rescored: true`，pilot/confirm 不能无条件混成最终样本；该复算确认报告与现存数据漂移，没有恢复原最终选集，也没有重跑模型。

方法边界来自 `benchmarks/agentic/run.py:35-43,319-335`：两个 spec arm 只追加各自 SKILL.md，并未加载全仓 36166 行；baseline 仍有共享 NO_RUN 提示；禁 Bash、限制 MCP 与设置来源，测的是受限代码输出，不能代表完整 workflow。模型请求字符串不能证明实际服务身份，safe-path judge 也不是完整安全验证。

**可支持的判断：** 现存有限样本的 baseline 正确性已饱和，未证明追加这两份入口文本带来准确率增益。未做统计显著性检验，不使用“无显著差异”或“收益已被证伪”。成本差异需先恢复配对分母再作效应推断。后续应复用已存在的 9 月 8 日 GLM-5.3 受限维护任务对照，与本 fixture benchmark 分开，不声称全仓没有真实任务证据。

已在历史报告开头补勘误；根指令仍引用旧结论，登记为后续治理 source 修订候选。本周期 B4 冻结，不以历史实验扩大默认指令删减。

## 5. 周期状态

| 批次 | 状态 | 已交付与边界 |
|---|---|---|
| B0/B1 | executed with limitations | 索引/历史快照/计划前提/001–002范围已纠正；8个active计划完成metadata与定向triage，未做每个单元的验收 |
| B2.1 | executed with limitations | 八宿主适配与安装盘点；四个GUI面单独记账，实际loader/invocation未运行 |
| B2.2 | executed with concerns | 初次有界源码意见可回源；后续U9独立reviewer另有hash范围；均不等于宿主或模型评测 |
| B2.3 | executed with limitations | 最小证据字段、FSA2缺失与FSA3修复证据边界已整理 |
| B2.4 | partial | 原B/C1机械占位已撤销；真实补审后的包级结果见§7和U9 summary；依赖闭包与运行验证仍未完成 |
| B3.1 | executed with limitations | 四run复算与历史报告勘误；未恢复原筛选集、未重跑模型 |
| B3.2/B3.3 | executed with limitations | field结构校验及执行参数/外部条件已区分；真实cohort未启动 |
| B3.4（P2/P8） | 文档交付完成 | 矩阵立项、来源纪律、评测触发/汇总/反指标/处置见§8；不代表外部矩阵调研或持续运行完成 |
| B4 | frozen | 不改被审产品源码或runtime；问题输出后续修复输入 |

**整体保持 `partial`，计划保持 `active`。** 当前授权内的文档处置与有界审查可以交付；未闭合依赖、真实宿主/模型/field与源码修复不由该交付替代。

## 6. B3.2/B3.3 协议可执行性与外部条件

### 6.1 仓内可执行的准备性检查

以下检查不改变冻结协议，也不产生 field outcome：

| 检查 | 当前结果 | 证据边界 |
|---|---|---|
| protocol schema 校验 | `valid` | `field-validation-protocol.schema.json` 对 `protocol.json` 通过；只证明结构合法 |
| task-pairs schema 校验 | `valid` | `field-validation-results.schema.json` 对 `task-pairs.json` 通过；空数组仍是 `not-run` |
| results schema 校验 | `valid` | `field-validation-results.schema.json` 对 `results.json` 通过；空数组仍是 `not-run` |
| 冻结协议完整性 | 可读取 | protocol id、cohort、配对规则、复杂度、actor profiles、metrics、decision rule 均已声明 |
| 当前 source/inventory 绑定 | 需刷新后再执行 | `node scripts/check-ce-localization-review.cjs --verify-only` 报 `skill-inventory.json is stale`；本轮不使用 `--refresh`，避免把当前文档执行变成无关 closeout 重生成 |

以上只证明 schema 合法，不能证明不同执行者会得到可比样本。协议绑定旧 HEAD `66b0e0c6…` 及 dirty snapshot；重跑必须保留旧冻结证据，通过执行实例与显式 amendment 绑定当前 source。

### 6.2 必须外部条件的环节

| 环节 | 是否可由仓内替代 | 结论与停止条件 |
|---|---|---|
| 代表性 A1 企业研发人员任务 | 不可替代 | 必须真实 actor；repo-local fixture 只能做 harness calibration，不能写入 field results |
| A2 项目 owner 采用/治理判断 | 不可替代 | 必须真实 owner；没有授权只记录 `not-run` |
| 真实项目与复杂度配对 | 不可替代 | 必须真实项目上下文；不得以本仓库任务外推组织收益 |
| baseline/candidate 同类任务配对 | 可在执行前准备模板，不能凭空生成结果 | 任务、角色、宿主、provider readiness 和顺序控制须由 field owner 冻结并记录 |
| provider/model identity | 不可由普通 receipt 证明 | v2 普通自报 receipt 无法认证实际身份，其跨模型 peer 路径必须 fallback；其他渠道记录可认证层级。身份不足时限制模型特定/跨模型 claim，不伪造 verified，也不把所有本地准备一律停止 |
| GUI/CLI 宿主 loader 与 invocation | 不可由 adapter/projection 替代 | 每次执行须有版本绑定 host receipt；GUI 面必须走独立 GUI journey，companion CLI 不能替代 |
| 指标计算与复现 | 仓内可提供 schema/validator，不能替代样本 | `time-to-trusted-change`、`quality-adjusted-throughput`、返工和审查负担须从真实 paired evidence 计算 |

### 6.3 当前判定

`B3.2/B3.3 = executed with limitations`，交付的是可执行性判定。当前判定为 **结构可用、执行设计尚未充分实例化**，撤销先前草稿“没有设计缺口”的结论。

| 必补执行参数 | 最小验收 | owner / 恢复条件 |
|---|---|---|
| actor 与配对任务 | 每类至少 3 对 exploratory；列真实角色、复杂度、顺序/交叉控制、baseline/candidate/source 身份 | field owner；取得代表性任务与使用授权 |
| 指标定义 | trusted-change 起止事件、验收人、吞吐分母与观测窗口、返工归属/审查工时、缺失/中断/超时处理 | measurement owner；先用合成事件校准计算，不计现场样本 |
| 判定与反指标 | 预声明最小有意义效应、不确定性/噪声、质量/安全非回归、成本与审查负担上限 | field owner；首个样本前冻结 amendment |
| 数据与证据 | 每个事件有时间、task/pair/run ID、source refs、结果/失败与成本；schema 合法之外还应能独立重算 | measurement owner；证据脱敏与存放边界确定 |
| 真实执行面 | GUI 与 CLI 分层记录安装、loader、调用；渠道身份按实际认证能力分级 | host/field owner；隔离目录、账号与数据范围明确 |

`task_pairs=[]`、`results=[]`、`overall_status=not-run` 保持原状，不向旧协议写伪样本或静默改冻结口径。repo-local 任务只做 calibration 或明确的内部任务研究，不冒充 A1/A2 现场证据。

## 7. U9 逐 Skill 逻辑审查

产物见 [`u9/skill-receipts.json`](u9/skill-receipts.json) 与 [`u9/finding-ledger.json`](u9/finding-ledger.json)。冻结 HEAD 为 `36d19d95c3a79df2d1278083c959bb34eadbde8c`；source manifest覆盖1654个文件。包内文件分母不等于跨包递归依赖闭包。

**记录纠错：** 原B/C1的19条receipt曾由机械读文件与关键词匹配生成，内容没有完整进入模型，不能支持原“已逐包语义审查”结论。已撤销旧范围与五分支占位，改为真实reviewer读取、判断与限制。hash只证明所引用字节，不证明已经阅读。branch的 `source-covered` 只表示已读范围的逻辑可追踪，不能读作workflow运行通过。

| 批次 | 包数 | 本轮覆盖 | 整包结果 |
|---|---:|---|---|
| A | 5 | 入口、近邻负例、consumer、停止、恢复/交接；compound为主owner自审 | 2 failed、3 degraded |
| B | 11 | 逐包实际读取与五分支判断；plan/prd另有主owner补读，原始返回独立保存 | 1 failed、10 degraded |
| C1 | 8 | 逐包实际读取与五分支判断；Git暂存探针另计，未执行真实PR/宿主副作用 | 1 failed、7 degraded |
| C2 | 14 | 原计划明确未运行，保留恢复点 | 14 not-run |

合计 **4 failed、20 degraded、14 not-run、0 passed、0 blocked**。24 是承诺审查包数，不是 Git 提交数或完整通过数。确认问题去重后为 **1 P1、7 P2**。

本次是 U9 有界子集：没有完整 U1 整树指纹/闭包冻结/脱敏canary，不宣称完整FSA运行。A/B/C1仍有未读references、script/consumer、tests与host projection；各包receipt列范围与恢复点。reviewer不是被审源码作者，但部分使用持续上下文，不称每包盲评或独立field复现。暂停/429等待无法可靠分离为主动审查时间，不用于校准单包预算。

### 7.1 已确认问题与后续顺序

以下为 2026-09-20 冻结审查的 8 项 confirmed 问题。用户后续明确要求逐项修复；截至 2026-09-21，8 项均已完成源码/合同修复和定向回归，账本已逐项标记 `fixed`。最终验证与限制见[修复报告](repairs/2026-09-21-repair-report.md)。`confirmed` 仍表示原问题证据，不冒充真实宿主验证。两个旧 `A-EXIT-CR-*` ID已合并为 `C1-CR-*`，不重复计数。

| 顺序/级别 | ID与问题 | 确认方式 | 最小修复与验收方向 |
|---|---|---|---|
| 1 / P1 | C1-PRFEEDBACK-001：未改文件的失败被直接当作pre-existing放行 | 源码语义反例，未执行真实PR流程 | 先有同环境基线/因果证据再归因；未改consumer因共享模块变更而失败时，阻断commit/push完成出口 |
| 2 / P2 | C1-PRFEEDBACK-002：blocked强制空files_changed可漏掉已写修改 | producer/consumer合同分歧 | 无论verdict均报告剩余diff；父owner检查实际树，不能以空清单跳过验证 |
| 3 / P2 | C1-COMMITPR-001：checkout collision的stash/pop改变用户暂存选择 | [隔离Git探针](u9/commit-pr-stash-probe.json)：pop成功但staged变空，内容保留 | 不自动吸纳无关dirty/index；保留scope、index与冲突恢复证据 |
| 4 / P2 | C1-CR-01：fork PR同名head分支混源 | [隔离Git探针](u9/review-fork-ref-probe.json)：fetched SHA与headRefOid不同 | 固定真实PR head SHA；不匹配停止，不回退origin同名分支 |
| 5 / P2 | C1-CR-02：untracked修改漏过snapshot检查 | [隔离脚本探针](u9/review-untracked-probe.json)：untracked=false，tracked对照=true | 绑定task-owned untracked的存在性/字节；覆盖增改删及范围外控制 |
| 6 / P2 | C1-U9-RUNTIME-001：bare漏projection preflight | [纯函数探针](u9/runtime-setup-preflight-probe.json)与执行顺序源码 | bare与相同写能力遵守同一写前gate；missing/stale/current负例和只读对照 |
| 7 / P2 | C1-U9-RUNTIME-002：父目录bare承诺all-repos却执行diagnostic | source + test源码分歧，测试未运行 | 先统一父目录范围，再同步实现/说明/子仓隔离测试 |
| 8 / P2 | C1-U9-RUNTIME-003：默认graph范围及plan执行建议冲突 | SKILL/mode源码与纯函数scope结果 | 唯一模式矩阵，plan建议到execution保持同一选择范围 |

完整原始触发、审查 source hash、owner 与验收保存在问题账本；修复前账本另存 [原快照](repairs/finding-ledger-before-repairs.json)。后续修复按 `spec-debug` 执行，修复 source hashes 与回归单列在 repairs 中，不回写原审查 receipt 为 passed。

## 8. P2/P8 本周期交付

见 [竞品矩阵立项与持续评测闭环](2026-09-20-evaluation-and-market-follow-through.md)。已明确同场景比较对象、八个维度、官方来源与版本要求，以及周期/版本/反例/推广触发、四轴汇总、反指标和能力处置。已将本轮benchmark勘误、field实例缺口和U9反例接到处置清单；当前没有最新竞品完整矩阵、自动调度或新增field样本。

## 9. 验证与产物边界

本轮此前已执行 `npm run typecheck`（265 files）、`npm run lint:skill-entrypoints`（491 files）；这些历史结果不替代最终文档检查。最终校验的命令、时间、exit、产物 hash 与实际范围见 [`final-checks.json`](final-checks.json)。最终已通过两套 CHANGELOG 合同测试（5 tests）、`git diff --check`、13 份 Markdown 的 89 个相对链接目标检查、38 包 receipt 一致性检查、交付副本字节校验及 59 个证据文件的常见凭据模式扫描。

[`u9/source-stability.json`](u9/source-stability.json) 记录冻结工作树的 1654 个 source 文件无缺失、增加或字节变化。主仓对齐时 `templates/codex/hooks/session-start.cmd` 为 LF，临时 checkout 按 `.gitattributes` 为 CRLF，规范化后内容相同；该差异不被写成严格字节一致。主仓 4593 个忽略的既有评测输出/cache 不属于 manifest 分母。本轮只清理已复制并校验过的临时审查工作树，不动其他工作树或用户改动。

`node scripts/check-ce-localization-review.cjs --verify-only` 此前exit 1：`skill-inventory.json is stale`。本轮未刷新CE全套输出，避免扩大成无关regeneration；此失败不被JSON或链接通过覆盖。

未运行真实宿主workflow、付费模型、GUI journey、field cohort或完整新一轮U1–U10；未提交、推送或发布。源码修复与完整审计生命周期保持开放。


## 10. 后续获授权修复（2026-09-21）

用户在审查交付后明确要求逐项修复与验证，授权覆盖本轮 8 项问题及复核发现的同范围出口/输入校验缺口；原 B4 冻结仍描述审查阶段，不限制这次后续实现。

8 项问题现已标记 `fixed`。另两个 fresh-source 复核缺口（无关暂存内容被提交、非法 snapshot 未结构化拒绝）随本轮修复并回归。参见[修复报告](repairs/2026-09-21-repair-report.md)、[命令证据](repairs/checks.jsonl)及[当前账本](u9/finding-ledger.json)。

第 7、9 节的 4 failed / 20 degraded / 14 not-run、source stability、copy-integrity、receipt-consistency 与 final-checks 均为修复前冻结审查快照。当前 ledger 字节已变，不能将历史 hash 校验当作修复后证据，也不应为了恢复旧 hash 而覆盖真实修复状态。修复阶段单独绑定新 source hashes 与验证结果。

整体周期仍为 `partial`：剩余审查覆盖、真实宿主/GUI 调用、模型与 field/comparator 证据未由本轮本地源码修复补齐。尚未刷新真实宿主 runtime，未提交或推送。

修复后验证结论：8 项定向修复通过；全套 unit 2996 通过 / 2 失败（CE 当前清单与旧快照不一致），smoke 5 通过，integration 84 通过 / 2 条件跳过。全仓 TSV whitespace 另有失败，structured closeout 为 `degraded`，不声称全套回归通过或发布就绪。

### 2026-09-21 后续回归收口

用户继续授权后，CE unit 历史/live职责耦合与 TSV 拆行均已修复。全套 `npm test` exit0：2999 unit + 5 smoke + 84 integration 通过，2 条件跳过；全仓 whitespace 通过。原失败日志/回执保留，最新结果见[剩余回归修复报告](repairs/2026-09-21-residual-regression-report.md)。历史 CE current binding 仍 stale，未重写既有审查记录；周期的真实宿主/模型/field缺口仍保持原状态。
