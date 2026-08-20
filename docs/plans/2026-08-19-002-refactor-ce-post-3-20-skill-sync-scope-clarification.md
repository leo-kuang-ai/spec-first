---
title: "CE post-3.20 Skill 同步范围校准与执行方案"
type: refactor
status: superseded
date: 2026-08-19
sequence: 002
topic: ce-post-3-20-skill-sync-scope-clarification
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
supersedes: docs/plans/2026-08-18-001-refactor-sync-ce-post-3-20-head-calibration-plan.md
superseded_by: docs/plans/2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md
source_plan: docs/plans/2026-08-18-001-refactor-sync-ce-post-3-20-head-calibration-plan.md
upstream_filelist: /Users/kuang/xiaobu/compound-engineering-plugin/filelist_1fac0442_to_head.txt
---

# CE post-3.20 Skill 同步范围校准与执行方案

## 0. 背景与证据原则

本方案以 CE `1fac0442..bbf995a4` 的真实 Git 增量为唯一上游事实来源，基于 Git 对象、`diff --name-status --find-renames`、文件内容和可回溯的 patch 逐文件判断：

1. 哪些变化应进入当前 `spec-first` canonical source；
2. 哪些变化应由已有 `spec-*` owner 通过扩展或组合吸收；
3. 哪些变化只能保留为 evidence-only、参考优化或明确延后/排除。

提交标题、上游文档、上游测试、provider 自述和模型输出不能替代真实 Git diff。它们只能解释变更意图或提供验证线索，进入当前裁决前必须回到 Git patch、当前 `spec-first` source、当前测试和 owner 边界确认。

本方案使用 `/Users/kuang/xiaobu/compound-engineering-plugin/filelist_1fac0442_to_head.txt` 作为用户冻结的185条逐文件选择集合。完整 Git 增量的其余187条只作集合边界和反向遗漏校验，不自动进入同步。CE 文档和测试代码不复制到 `spec-first`，但可以作为只读证据；当前行为必须由 `spec-first` 自己的 canonical source 和验证产物确认。

## 1. Product Contract

本文件已由 `2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md` 替代，仅作为旧 185 条选择集的历史决策和证据保留，不再承担当前范围裁决、实施单元、验证合同或生命周期 owner。其 U0-U9 状态不得继续推进；当前执行与开发进展统一以 003 的完整 517-path 窗口为准。

### Goals

- 以 CE `1fac0442..bbf995a4` 的真实内容 diff 为唯一上游事实，完成185条选择路径的逐项裁决、owner吸收和本仓验证。
- 保留当前 `spec-first` 的source/runtime、宿主授权、provider和产品边界，通过现有owner吸收上游能力，而不是复制CE形态。
- 形成可逐单元执行、可逐项验证、不会把evidence-only或provider输出提升为完成事实的同步方案。

### Requirements

- **R1**：用户指定的185条文件清单是唯一逐文件同步范围。
- **R2**：`ce-babysit-pr`、`ce-proof`、`ce-retune` 对应的16条记录保持产品排除。
- **R3**：`ce-setup` 不复制为新入口，但F144-F146中被当前Skill、CLI、配置合同或Runtime Setup实际依赖的语义由现有owner选择性吸收。
- **R4**：40条 `defer` 必须逐项转为 `implement-in-current-owner` 或有直接source/test证据的 `compose`。`compose` 是唯一机器枚举，其语义是“当前owner以不同结构实现同等或更强能力”，不再引入同义的第二枚举。
- **R5**：同步吸收能力、安全不变量和用户可见行为，不复制CE目录、文件名、中心运行器、provider topology或宿主专属实现。
- **R6**：CE文档与测试代码不复制；它们只作只读证据，实际行为由当前 `spec-first` canonical source和本仓验证确认。

### Non-goals

- 不恢复三个已排除产品表面，不新增同名Skill或中心陪跑、Proof外发、Retune实验运行器。
- 不自动增加OMP、Agent Plugins或其他supported platform，不复制CE插件清单、配置路径和release拓扑。
- 不复制CE测试文件、文档或generated runtime，也不手改当前仓库的runtime mirror。
- 不在本方案中授权commit、push、PR、外部provider调用或数据外发。

### Readiness Gate

当前方案已完成 U0.1-U0.2 的语义裁决冻结并升级为 `implementation-ready`；U0.3-U0.4 仍需一次收尾 `--refresh`+复验来清理账本 legacy `verdict` 列并把 F185 `category` 校正为 `cli-runtime`（见 §2.8 收尾残留）。`evidence_status: planned` 只表示实施输入已冻结，不表示源码或测试已经完成；169条非排除记录仍需在U1-U9中逐项推进到`confirmed`。

## 2. 范围账本

| 类别 | 数量 | 最终处理 |
| --- | ---: | --- |
| 用户指定清单 | 185 | 唯一逐文件同步集合 |
| 原产品决策排除 | 16 | 保持 `out-of-scope-by-product-decision` |
| 非排除对账范围 | 169 | 均有 `target_action` 裁决（117 compose + 52 implement）；其中 5 条为根元数据/支持记录（`category: evidence-only`/`support`，见 §2.2） |
| 当前 `compose` | 117 | 已完成范围归类；U1-U9逐项补齐source/test证据 |
| 当前 `implement-in-current-owner` | 52 | 包含原12条目标和40条原`defer`的保守重分类；`planned`项仍需完成当前 owner 实现、本仓验证和必要投射 |
| 当前 `defer` | 0 | U0已清零；不得重新引入笼统延后 |
| 完整窗口中清单外路径 | 187 | 保持 `out-of-scope-by-user-selection` |

这里的 52 条是U0重分类后的实施候选；账本中的169条非排除记录当前均为`evidence_status: planned`，不能视为源码已完成。账本的唯一 canonical 决策字段是 `target_action`（机器枚举，禁止 `defer`），唯一完成度字段是 `evidence_status`；`defer=0` 只在 `target_action` 轴成立。当前 `2026-08-19-ce-post-3-20-reconciliation.json` 仍残留历史 `verdict` 列（其中 40 条为 `defer`、`ce-setup` F144-F146 仍标 `out-of-scope`）。该列是首轮草稿信号、非权威，不代表存在未决 `defer` 或 `ce-setup` 被排除；U0.1 的最小记录合同不包含 `verdict`，因此账本尚未完全落到新 schema，必须在下一次 `--refresh` 将 `verdict` 对齐到 `target_action` 或移除后，才能作为完全一致的 confirmed ledger 引用。

### 2.1 185 条清单的覆盖结论

对完整 372 条 Git 增量与 185 条清单做集合差后：

| 清单外类别 | 数量 | 本轮处理 |
| --- | ---: | --- |
| `docs/**` | 87 | 不同步；只读证据 |
| `tests/**` | 82 | 不同步；只读验证意图证据 |
| generated/host runtime | 13 | 不作为 source 同步；必要时从验证后的当前源码重新投射 |
| release/CI 配置 | 3 | 参考优化；不复制 CE 配置 |
| 其他非目标 | 2 | 不同步 |
| `skills/**` canonical source | 0 条遗漏 | 185 条清单已覆盖全部变化 |
| `src/**` | 0 条遗漏 | 185 条清单已覆盖全部变化 |

因此，在“CE 文档和测试代码不需要同步”的约束下，185 条清单可以覆盖本轮所需的 canonical Skill/CLI 源码升级内容。这里的“覆盖”只表示上游源码输入集合完整，不表示语义吸收、当前项目验证或运行时投射已经完成。清单外的 release/CI 配置不进入源码同步，但按第2.3节作为参考优化输入。

## 2.2 根元数据与支持文件映射

`category` 表示CE路径在本轮中的证据角色，`target action` 表示当前项目需要执行的动作；两者不得混为一谈。这五条根记录为 4 条 `evidence-only`（F001/F002/F003/F005）加 1 条 `support`（F004）；§2 账本里的“5 条 evidence-only”是对这五条根元数据/支持记录的统称，不是 `category` 的精确计数。注意当前 ledger 的 `category: evidence-only` 之所以也等于 5，是因为把 `src/utils/detect-tools.ts`（F185）计了进来，而 §2.6 将 F185 按 CLI/runtime 处理——两处口径冲突，U8 的 refresh 必须把 F185 的 `category` 校正为 `cli-runtime`。五条记录必须分别关闭：

| 审计ID | CE路径 | category | 当前owner | 目标动作 | 边界与验证 |
| --- | --- | --- | --- | --- | --- |
| F001 | `AGENTS.md` | evidence-only | `CLAUDE.md`、`AGENTS.md` managed source | `implement-in-current-owner` | 只吸收当前治理需要的原则；运行 `npm run sync:instructions` 和对应instruction contract tests |
| F002 | `CONCEPTS.md` | evidence-only | `docs/10-prompt/结构化项目角色契约.md`、当前概念文档 | `compose` | 不复制CE概念文档；逐条引用当前source并记录差异与限制 |
| F003 | `README.md` | evidence-only | `README.md`、`README.en.md`、`README.zh-CN.md` | `implement-in-current-owner` | 只在用户可见行为变化后更新，不把CE文案当产品事实 |
| F004 | `package.json` | support | `package.json` | `implement-in-current-owner` | 不机械同步CE版本号或依赖；只吸收当前scripts、files或metadata确有需要的变化，并用build/CLI tests验证 |
| F005 | `plugin.json` | evidence-only | `src/cli/plugin-manifest.js`、生成合同 | `implement-in-current-owner` | author、license、schema、keywords、宿主路由逐字段裁决；未经产品决策不新增OMP/Agent Plugins |

## 2.3 Release/CI 参考优化

完整 Git 增量中的以下3个文件不复制到当前项目，也不改变185条源码同步集合：

| CE 文件 | 参考优化方向 | 当前 owner | 处理边界 |
| --- | --- | --- | --- |
| `.github/.release-please-manifest.json` | 检查多包/版本清单是否与当前发布包边界一致 | release owner / `package.json` | 只吸收版本一致性和可复核性做法，不复制 CE manifest |
| `.github/release-please-config.json` | 检查 release PR、版本计算、changelog 生成规则 | release owner / `CHANGELOG.md` | 只形成当前仓库的配置建议，需独立授权后才修改 |
| `.github/workflows/ci.yml` | 检查 CI 分层、缓存、跨平台和发布前门禁 | CI owner / `package.json` scripts | 只参考验证顺序和门禁，不把 CE workflow 当作当前运行时合同 |

参考优化的确认结果只能是：

- `adopted-as-local-improvement`：当前仓库已有 owner，形成最小本地改进并有验证；
- `reference-only`：当前没有明确收益或授权，保留证据不改文件；
- `not-applicable`：CE 的发布/CI拓扑不适用于当前仓库。

不得把参考优化写成 CE 配置已同步，也不得用它扩大 Skill/CLI 源码范围、引入新的发布系统或改变提交/落地授权。

## 2.4 Skill 完整映射表

185 条清单涉及 **29 个 `ce-*` Skill 入口、1 个 `lfg` 入口和 2 个 supporting-only CE surfaces**，合计 32 个 Skill/Skill-related surfaces。`ce-riffrec-feedback-analysis` 在本清单中只有 reference 文件，`ce-resolve-pr-feedback` 只有 reference/script 文件，两者都没有发生 `SKILL.md` 入口变化。调整排除决策后，进入同步的是 26 个 `ce-*` Skill 入口、1 个 `lfg` 入口和 2 个 supporting-only surfaces；三个产品排除表面不新增 owner。

| CE Skill / surface | 账本条目 | 当前 `spec-first` owner | 当前裁决 | 开发进展 | 同步状态与边界 |
| --- | ---: | --- | --- | --- | --- |
| `ce-babysit-pr` | 12 | 无（旧产品排除） | `out-of-scope-by-product-decision` | 不适用（已排除） | 不新增 `spec-babysit-pr`，不修改 LFG/PR 尾部 owner |
| `ce-brainstorm` | 13 | `spec-brainstorm` | `compose` + `defer` | 待开发 | 现有 owner 已吸收部分语义；6 条需重分类 |
| `ce-code-review` | 8 | `spec-code-review` | `compose` + `defer` | 待开发 | 评审回执和 provider/model 边界；2 条需重分类 |
| `ce-commit` | 1 | `spec-commit` | `compose` | 待开发 | 复用现有提交授权与验证边界 |
| `ce-commit-push-pr` | 4 | `spec-commit-push-pr` | `compose` + `defer` | 待开发 | PR 描述已组合；stack 相关2条需重分类 |
| `ce-compound` | 11 | `spec-compound` | `compose` + `defer` | 待开发 | 当前源码 grounding 已组合；context 脚本需重分类 |
| `ce-compound-refresh` | 6 | `spec-compound-refresh` | `compose` + `defer` | 待开发 | 当前源码刷新已组合；context 脚本需重分类 |
| `ce-debug` | 4 | `spec-debug` | `compose` + `defer` | 待开发 | pipeline、post-fix handoff、context 需重分类 |
| `ce-doc-review` | 20 | `spec-doc-review` | `compose` + `defer` | 待开发 | review schema/runner 已组合；decision/context 需重分类 |
| `ce-dogfood` | 3 | `spec-dogfood` | `compose` | 待开发 | 复用浏览器 QA 与 diff-scoped 边界 |
| `ce-explain` | 2 | `spec-explain` | `compose` + `defer` | 待开发 | 教学入口已组合；context 需重分类 |
| `ce-handoff` | 1 | `spec-handoff` | `compose` | 待开发 | 连续性产物、摘要、新鲜度和限制由现有 owner 承担 |
| `ce-ideate` | 9 | `spec-ideate` | `compose` + `defer` | 待开发 | 外部研究和 user-research 边界；3 条需重分类 |
| `ce-optimize` | 4 | `spec-optimize` | `compose` + `defer` | 待开发 | measurement-only owner 保留；context 需重分类，不吸收 `ce-retune` |
| `ce-plan` | 13 | `spec-plan` | `compose` + `defer` | 待开发 | 计划契约已组合；reasoning/context/peer 需重分类 |
| `ce-pov` | 7 | `spec-pov` | `compose` + `defer` | 待开发 | POV schema/panel 已组合；context 需重分类 |
| `ce-product-pulse` | 2 | `spec-product-pulse` | `compose` | 待开发 | 保留信号证据边界，不新增信号源 |
| `ce-promote` | 2 | `spec-promote` | `compose` | 待开发 | 只同步文案/格式证据，不提升为发布结果 |
| `ce-proof` | 1 | 无（旧产品排除） | `out-of-scope-by-product-decision` | 不适用（已排除） | 不创建 `spec-proof`，不外发、不读写 Proof 凭据 |
| `ce-prototype` | 5 | `spec-prototype` | `implement-in-current-owner` | 待开发 | 本地 throwaway、有人体验、决策胶囊；不外发 |
| `ce-resolve-pr-feedback` | 6 | `spec-resolve-pr-feedback` | `compose` | 待开发 | 反馈范围、评论读取和 targeted/full mode 由现有 owner 承担 |
| `ce-retune` | 3 | 无（旧产品排除） | `out-of-scope-by-product-decision` | 不适用（已排除） | 不新增 `spec-retune`，不修改 `spec-optimize` |
| `ce-riffrec-feedback-analysis` | 1 | `spec-riffrec-feedback-analysis` | `compose` | 待开发 | reference-only surface；无独立 CE `SKILL.md` 入口 |
| `ce-setup` | 3 | `spec-runtime-setup`、CLI/config consumers | `implement-in-current-owner` | 待开发 | 不新增 `spec-setup`；选择性吸收配置级联、`docs_root` 例外、health/readiness 和必要探测语义 |
| `ce-simplify-code` | 5 | `spec-simplify-code` | `compose` | 待开发 | 复用代码质量、复用和效率评审 owner |
| `ce-strategy` | 3 | `spec-strategy` | `compose` | 待开发 | 复用方向、路线图和指标 owner |
| `ce-sweep` | 5 | `spec-sweep` | `compose` + `defer` | 待开发 | sweep state 已组合；context 需重分类 |
| `ce-test-browser` | 1 | `spec-test-browser` | `compose` | 待开发 | 复用浏览器测试 owner，不把 provider 事实提升为现场结果 |
| `ce-test-xcode` | 1 | `spec-test-xcode` | `compose` | 待开发 | 复用 Xcode 验证 owner，现场证据单独计量 |
| `ce-work` | 16 | `spec-work` | `compose` + `planned` | 待开发 | execution/shipping/tracker 已组合；12 条 worker/context/workspace 进入实施候选 |
| `ce-worktree` | 1 | `spec-worktree` | `compose` | 待开发 | 保持 caller-owned isolation 和共享 Git index 禁止写入 |
| `lfg` | 2 | `spec-lfg` | `compose` | 待开发 | 仅吸收非 `ce-babysit-pr` 所属的 tracker/执行边界，不恢复已排除的陪跑状态机 |

“当前裁决”列中仍标注的 `compose + defer` 与“N 条需重分类”是 U0 前 CE 首轮的原始拆分；U0 已把这些 `defer` 逐条改判为 `implement-in-current-owner` 或 `compose` 并标记 `evidence_status: planned`，因此 §2 账本口径为 `defer=0`。该列的 `defer` 字样不代表存在未决延后，应读作“已转 `planned` 的实施候选”。表中 `compose + planned` 不是完成状态；其中的`planned`必须在U1-U9中补齐实现和证据。只有 `ce-babysit-pr`、`ce-proof`、`ce-retune` 的 owner 列为“无”。`ce-setup` 的三条记录已转由当前 Runtime Setup、CLI 和配置消费者承担，但不因此恢复同名入口。2.4的`开发进展`与2.5 package表使用同一枚举和完成门禁；每完成一个Skill/surface package，必须同步更新本列及对应 `evidence_status`、源码引用和测试证据。2.4只表达Skill/surface级视图，2.5仍是package级完成裁决的唯一来源。

## 2.5 推荐升级顺序与逐一确认表

以下顺序按共享基础、执行恢复、交付尾部、规划研究、知识沉淀、评审和辅助Skill排列。每一行代表一个完整CE package/surface闭环，必须同步处理入口、references、assets、Skill-local scripts、当前owner源码和本仓测试。不能只确认 `SKILL.md` 后把同package脚本留到后续批次。

| 顺序 | CE package / surface | F-ID与同批闭环资产 | 当前owner | 当前状态 | 开发进展 | 确认重点 |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `ce-work` | F162-F177；入口、references、`context.mjs`、cross-model、peer runner、workspace脚本族 | `spec-work` | `compose + defer` | 待开发 | worker context、workspace、事务、恢复、跨模型执行 |
| 2 | `ce-worktree` | F178；入口 | `spec-worktree` | `compose` | 待开发 | linked worktree、共享Git index、caller-owned isolation |
| 3 | `ce-commit` | F043；入口 | `spec-commit` | `compose` | 待开发 | commit subject、Plan unit ID、提交授权 |
| 4 | `ce-commit-push-pr` | F039-F042；入口与PR/stack references | `spec-commit-push-pr` | `compose + defer` | 待开发 | PR描述、stack CLI、stack submit、push/landing授权 |
| 5 | `ce-handoff` | F090；入口 | `spec-handoff` | `compose` | 待开发 | 摘要、新鲜度、限制、恢复权限 |
| 6 | `ce-debug` | F061-F064；入口、pipeline/handoff references、`context.mjs` | `spec-debug` | `compose + defer` | 待开发 | pipeline、post-fix handoff、context |
| 7 | `ce-brainstorm` | F018-F030；入口、全部references、context/elevation/preview/peer脚本 | `spec-brainstorm` | `compose + defer` | 待开发 | reasoning elevation、visual probe、prototype路由和脚本边界 |
| 8 | `ce-plan` | F104-F116；入口、全部references、context/elevation/peer脚本 | `spec-plan` | `compose + defer` | 待开发 | Product Contract、reasoning elevation、handoff和脚本边界 |
| 9 | `ce-ideate` | F091-F099；入口、全部references、`context.mjs` | `spec-ideate` | `compose + defer` | 待开发 | issue intelligence、research artifact、context |
| 10 | `ce-strategy` | F152-F154；入口与references | `spec-strategy` | `compose` | 待开发 | 当前仓库grounding、interview、strategy template |
| 11 | `ce-explain` | F088-F089；入口、`context.mjs` | `spec-explain` | `compose + defer` | 待开发 | scout failure outcome、context |
| 12 | `ce-compound` | F050-F060；入口、assets/references、context与session-history脚本族 | `spec-compound` | `compose + defer` | 待开发 | current-source grounding、session history、context |
| 13 | `ce-compound-refresh` | F044-F049；入口、assets/references、`context.mjs` | `spec-compound-refresh` | `compose + defer` | 待开发 | current-source refresh、guidance contradiction、context |
| 14 | `ce-sweep` | F155-F159；入口/references、`context.mjs`、`sweep-state.py` | `spec-sweep` | `compose + defer` | 待开发 | state encoding、UTF-8、context和状态脚本 |
| 15 | `ce-code-review` | F031-F038；入口/references、context/cross-model/peer脚本 | `spec-code-review` | `compose + defer` | 待开发 | reviewer dispatch、provider/model receipt、peer runner |
| 16 | `ce-doc-review` | F065-F084；入口、全部review references、context/cross-model/peer脚本 | `spec-doc-review` | `compose + defer` | 待开发 | decision primer、rendering floor、schema和peer runner |
| 17 | `ce-pov` | F117-F123；入口/references、context/cross-model/peer脚本 | `spec-pov` | `compose + defer` | 待开发 | panel、非最终立场、schema和peer runner |
| 18 | `ce-resolve-pr-feedback` | F134-F139；references、comment/thread脚本 | `spec-resolve-pr-feedback` | `compose` | 待开发 | comments、targeted/full mode、thread读取 |
| 19 | `ce-dogfood` | F085-F087；入口与references | `spec-dogfood` | `compose` | 待开发 | diff-scoped browser QA |
| 20 | `ce-simplify-code` | F147-F151；入口/personas、`context.mjs` | `spec-simplify-code` | `compose` | 待开发 | cleanup、复用、效率、context |
| 21 | `ce-optimize` | F100-F103；入口/references、`context.mjs` | `spec-optimize` | `compose + defer` | 待开发 | measurement-only、context；不吸收 `ce-retune` |
| 22 | `ce-test-browser` | F160；入口 | `spec-test-browser` | `compose` | 待开发 | browser test owner、现场证据上限 |
| 23 | `ce-test-xcode` | F161；入口 | `spec-test-xcode` | `compose` | 待开发 | Xcode test owner、现场证据上限 |
| 24 | `ce-product-pulse` | F124-F125；入口与interview | `spec-product-pulse` | `compose` | 待开发 | signal evidence，不新增signal source |
| 25 | `ce-promote` | F126-F127；入口与Spiral reference | `spec-promote` | `compose` | 待开发 | 文案/格式，不声称功能发布 |
| 26 | `ce-riffrec-feedback-analysis` | F143；reference-only | `spec-riffrec-feedback-analysis` | `compose` | 待开发 | 无入口变化，关闭quick bug report reference |
| 27 | `ce-prototype` | F129-F133；入口/references、`light-webserver.js` | `spec-prototype` | `implement-in-current-owner` | 待开发 | throwaway、有人体验、preview安全、决策胶囊、不外发 |
| 28 | `ce-setup` | F144-F146；入口语义、config template、`check-health` | `spec-runtime-setup`、CLI/config consumers | `implement-in-current-owner` | 待开发 | 配置级联、`docs_root`、health/readiness；不新增同名入口 |
| 29 | `lfg` | F179-F180；入口与tracker reference | `spec-lfg` | `compose` | 待开发 | 只吸收非陪跑状态机所属的tracker/执行边界 |
| 30 | `ce-babysit-pr` | F006-F017；完整package含 `pr-snapshot` | 无 | `out-of-scope-by-product-decision` | 不适用（已排除） | package整体排除，不新增owner |
| 31 | `ce-proof` | F128；入口 | 无 | `out-of-scope-by-product-decision` | 不适用（已排除） | 排除，不创建 `spec-proof` |
| 32 | `ce-retune` | F140-F142；入口/reference、`context.mjs` | 无 | `out-of-scope-by-product-decision` | 不适用（已排除） | package整体排除，不新增 `spec-retune` |

每个package确认记录必须同时包含package结论和逐文件结论；U0已冻结范围，U1-U9负责把`planned`推进到`confirmed`：

`开发进展`是本表唯一的 package 进度字段。允许值为`待开发`、`开发中`、`已完成`、`阻塞`、`不适用（已排除）`。只有该 package 的全部 F-ID 完成实现或等价裁决、`evidence_status` 全部为`confirmed`、focused tests 通过且 limitations 已记录，才能更新为`已完成`；单独完成入口、单个脚本或局部测试不得更新为`已完成`。开发过程中每完成一个 package，必须在同一变更中同步更新本字段和对应验证证据。

```text
package / F-ID range / 升级|等价|排除 / owner / source refs / test refs / limitations
Fxxx / CE full path / current owner path / final action / source ref / test ref / limitation
```

package只有在其全部F-ID完成最终裁决、必要源码实现和本仓验证后才能确认完成。`compose + planned` 仅表示当前package内部存在待实施文件；确认完成后，非排除文件不得保留`planned`，也不得出现“入口等价但脚本未处理”的状态。

## 2.6 共享脚本家族与 CLI/runtime 横切映射

44个Skill-local脚本全部随2.5对应package同步闭环。2.6不构成第二批脚本实施计划，只处理跨package共同不变量、唯一owner和parity策略。

### 共享脚本家族

| 共享家族 | CE F-ID | 当前唯一owner/策略 | 闭环要求 |
| --- | --- | --- | --- |
| `context.mjs` 15份 | F027、F036、F049、F056、F064、F082、F089、F099、F103、F114、F121、F142、F151、F158、F169 | `skills/spec-write-skill/scripts/inspect-context.cjs` + 各Skill声明式输入合同 | 14份非排除记录随package关闭，F142保持排除；不得复制15份helper；验证context payload与prompt预算 |
| `peer-job-runner.py` 6份 | F030、F038、F084、F116、F123、F171 | 现有review/POV runner及caller-owned执行合同 | 使用 `tests/unit/peer-job-runner-parity.test.js` 验证共同不变量；不得创建第二套中心runner |
| cross-model shell 4份 | F037、F083、F122、F170 | 各Skill adapter + 共享身份/timeout/cleanup合同 | 每个package验证路由差异，共享requested/actual、payload hash和process lifecycle不变量 |
| elevation dispatch 2份 | F028、F115 | brainstorm/plan各自owner，共享最小payload和fallback合同 | 配置、宿主能力或授权缺失时降级到当前模型并披露，不静默替换目标模型 |
| local preview server 2份 | F029、F133 | `spec-prototype`提供preview安全底线，brainstorm只作调用方 | loopback、containment、traversal/symlink拒绝、idle timeout和stop行为保持一致 |

脚本只负责确定性事实、边界检查、传输和回执；不得承担owner选择、产品优先级或语义充分性判断。唯一文件身份仍以F-ID和185条账本中的完整CE路径为准。

### CLI/runtime 源文件（5个）

| 横切项 | CE文件 | 当前owner | 处理 |
| --- | --- | --- | --- |
| CLI-1 | `src/commands/convert.ts` | CLI content conversion | 评估并吸收转换行为；由U8统一验证 |
| CLI-2 | `src/commands/install.ts` | CLI install | 评估并吸收安装目标边界；不新增未批准宿主 |
| CLI-3 | `src/release/metadata.ts` | release metadata | 评估发布元数据；不复制CE release拓扑 |
| CLI-4 | `src/utils/codex-content.ts` | Codex adapter | 评估URL/mention/content transform和prompt预算 |
| CLI-5 | `src/utils/detect-tools.ts` | Runtime Setup facts | 吸收当前支持宿主和工作流需要的工具探测事实；新增宿主仍需独立产品决策 |

以上 CLI/runtime 文件按 owner 选择性吸收 `ce-setup` 依赖：配置读取、路径安全、health/readiness 和工具探测必须落到当前合同中；CE 的目录名、交互流程、配置文件名和宿主列表不自动成为 `spec-first` 合同。任何新增支持宿主、public CLI 或 generated runtime surface 仍需独立产品决策。

## 2.7 横切主题追踪矩阵

以下矩阵防止逐Skill对账遗漏跨文件合同。每个主题都必须在U0绑定准确F-ID；表中的F-ID是已知主路径，不替代完整patch复核。

| 横切主题 | CE主证据/F-ID | 当前owner | 目标处理 | 当前验证owner |
| --- | --- | --- | --- | --- |
| unattended mode命名与写权限 | F018、F031、F061、F065、F091、F104、F117、F155、F162 | 各public Skill入口 | 统一判断 `mode:non-interactive` 与当前 `mode:headless`/`mode:agent` 合同；保留兼容别名时明确canonical token | 对应Skill contract tests、`tests/unit/dispatch-authorization-matrix-contracts.test.js` |
| 配置级联与 `docs_root` 例外 | F144-F146及所有配置消费者 | `spec-runtime-setup`、planning/review/work consumers | 普通键按明确优先级解析；团队布局键不得被local override；无效路径fail-closed | `tests/unit/mcp-setup-project-config.test.js`、config consumer tests |
| context装配与prompt预算 | F027、F036、F049、F056、F064、F082、F089、F099、F103、F114、F121、F151、F158、F169 | `spec-write-skill` context inspector、各Skillowner | 使用一个当前source inspector或声明式合同；不得复制15份helper；Codex入口必须守住当前prompt预算 | `tests/unit/inspect-context-payload-smoke.test.js`、`tests/unit/spec-write-skill-context-inspector.test.js` |
| Product Contract与产品锚点 | F018-F030、F091-F116、F152-F154 | `spec-brainstorm`、`spec-plan`、`spec-strategy` | 保持Product Contract完整性；`STRATEGY.md`为当前主锚点，`PRODUCT.md`、`VISION.md`、`CONCEPTS.md`只按现有owner和存在性消费 | plan/brainstorm/strategy contract tests、`tests/unit/spec-plan-quality-contracts.test.js` |
| private scratch与平台shell | F027-F030、F036-F038、F082-F084、F114-F123、F163-F177 | context/peer/work owners | OS-native temp优先，`TMPDIR`/`TEMP`降级；Windows优先Git Bash且保留显式shell；scratch必须私有、owned、non-symlink | `tests/unit/private-scratch-migration-contracts.test.js`、peer/work contracts |
| 跨模型身份、timeout与回执 | F032-F038、F067-F084、F111-F123、F163-F171 | review/plan/work peer owners | 记录requested/actual provider/model/effort、source/payload hash、idle/hard timeout、exit/cleanup receipt；无回执不声称独立覆盖 | peer runner、review peer expansion、work execution tests |
| checkout、worktree与Git index | F163-F178 | `spec-work`、`spec-worktree` | warm checkout必须验证实际tree；linked-worktree worker不得写共享Git index；owner保留commit权 | `tests/unit/spec-worktree-contracts.test.js`、work execution/recovery tests |
| shipping review receipt | F039-F043、F162-F180 | `spec-commit-push-pr`、`spec-lfg`、`spec-work` | shipping前必须有与当前tree绑定的review/verification receipt；commit、push、PR和landing授权独立 | commit/LFG/work contracts；真实PR/CI另报未执行 |
| Codex内容转换和入口预算 | F181、F184 | `src/cli/plugin-sync.js`、`src/cli/adapters/codex.js` | URL、mention、command内容转换按当前adapter吸收；避免CE的greedy transform和超预算schema | plugin sync/modules、Codex adapter focused tests；缺失时U8补测试 |
| OMP与Agent Plugins | F004、F005、F182、F183、F185及清单外manifest | release/plugin/runtime owners | 默认为 `reference-only` 或 `not-applicable`；需要加入supported platform时另立产品决策 | plugin manifest/build/runtime asset tests |
| prototype体验与本地preview | F026、F029、F129-F133 | `spec-prototype`、brainstorm/plan handoff | craft floor、loopback preview、有人体验和durable decision由当前owner吸收；Proof保持零外发 | prototype unit和human-journey integration tests |

## 2.8 Implementation Units 与依赖

| U-ID | F-ID/范围 | 主要当前owner | 实施方式与测试场景 | 最窄验证 | 开发进展 | 依赖/退出条件 |
| --- | --- | --- | --- | --- | --- | --- |
| U0 范围冻结 | F001-F185 | 对账器、逐文件Markdown/JSON、inventory | 先升级逐文件审计和ledger schema，使每条记录可机械保留`target_action`、`evidence_status`、`source_refs`、`test_refs`和`limitations`；再将F144-F146改为当前owner实现、消除40条 `defer`。缺owner、证据状态、引用或限制说明时停止 | `npx jest tests/unit/ce-upstream-reconciliation-v2.test.js tests/unit/ce-upstream-3-20-reconciliation.test.js tests/unit/ce-post-3-20-calibration-contracts.test.js --runInBand`；使用固定commit、filelist和SHA执行对账器 `--refresh`，随后无`--refresh`复验字节一致性 | 待收尾（verdict/F185） | 语义裁决已冻结：185/185唯一裁决、16条排除、169条非排除、target_action 0条`defer`、planned记录不计为实施完成。收尾残留见下方注记：须再跑一次 `--refresh`+复验，移除/对齐 legacy `verdict` 列并把 F185 `category` 校正为 `cli-runtime`，字节一致后 U0 方可闭合 |
| U1 执行基础 | F027-F030、F033-F038、F082-F084、F111-F123、F163-F178 | `spec-work`、`spec-worktree`、context inspector、peer runner owners | 统一context装配、dispatch授权、最小payload、private scratch、requested/actual identity、timeout/cleanup、warm checkout、workspace transaction；nil/empty/error均返回结构化降级或阻断 | `npx jest tests/unit/inspect-context-payload-smoke.test.js tests/unit/peer-job-runner-parity.test.js tests/unit/private-scratch-migration-contracts.test.js tests/unit/spec-worktree-contracts.test.js tests/unit/spec-work-execution-strategy-contracts.test.js --runInBand` | 待开发 | U0；不得复制15份context或创建第二套中心runner，worker不得写共享Git index |
| U2 交付与连续性 | F039-F043、F061-F064、F090、F162-F180 | `spec-commit`、`spec-commit-push-pr`、`spec-debug`、`spec-handoff`、`spec-lfg` | 保持commit/push/PR/landing分别授权；shipping receipt绑定当前tree；handoff带source refs、freshness和limitations；缺review/verification receipt时不得声称可交付 | `npx jest tests/unit/spec-debug-contracts.test.js tests/unit/spec-handoff-contracts.test.js tests/unit/spec-lfg-contracts.test.js tests/unit/spec-work-lfg-recovery-contracts.test.js --runInBand`，并补/运行commit-push-pr focused tests | 待开发 | U1；交付和恢复均不能从artifact推导mutation authority |
| U3 规划与研究 | F018-F030、F088-F116、F152-F154 | `spec-brainstorm`、`spec-plan`、`spec-ideate`、`spec-strategy`、`spec-explain` | 保持完整Product Contract、当前source grounding、研究来源和handoff；reasoning elevation只发送最小授权payload；visual probe路由到本地prototype；缺产品锚点时显式记录推断 | `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-plan-quality-contracts.test.js tests/unit/spec-ideate-clarification-handoff-contracts.test.js --runInBand` | 待开发 | U1；不能把 `PRODUCT.md`/`VISION.md`/`CONCEPTS.md` 假定为必有或新source-of-truth |
| U4 知识与信号 | F044-F060、F155-F159 | `spec-compound`、`spec-compound-refresh`、`spec-sweep` | current-source grounding、session history、state encoding、freshness和guidance contradiction由当前owner吸收；空历史、无信号或来源失败均产生诚实degraded结果 | `npx jest tests/unit/compound-promotion-contracts.test.js tests/unit/session-history-scripts.test.js tests/unit/sweep-state-legacy-import.test.js --runInBand` | 待开发 | U1、U3；未经verified、可复用和invalidation condition不得promotion |
| U5 评审与反馈 | F031-F038、F065-F084、F117-F123、F134-F139 | `spec-code-review`、`spec-doc-review`、`spec-pov`、`spec-resolve-pr-feedback` | reviewer dispatch、schema、decision primer、requested/actual peer identity和comment范围由当前owner吸收；无独立回执不声称独立覆盖，provider输出保持untrusted | `npx jest tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/review-peer-expansion-contracts.test.js tests/unit/spec-resolve-pr-feedback-contracts.test.js --runInBand` | 待开发 | U1、U2；鉴权、配额、timeout或malformed output必须降级且不执行provider文本 |
| U6 辅助验证Skill | F085-F089、F100-F103、F124-F127、F143、F147-F151、F160-F161 | dogfood、simplify、optimize、browser、Xcode、pulse、promote、riffrec owners | 逐项证明compose parity；优化保持measurement-only；provider/setup ready、fixture result和field outcome分开报告 | `npx jest tests/unit/spec-optimize-contracts.test.js tests/unit/spec-product-pulse-contracts.test.js tests/unit/spec-test-browser-contracts.test.js tests/unit/spec-test-xcode-contracts.test.js tests/unit/spec-riffrec-feedback-analysis-contracts.test.js --runInBand` | 待开发 | U3-U5；不存在对应test时先补当前仓库focused contract，不复制CE tests |
| U7 本地原型 | F026、F029、F129-F133 | `skills/spec-prototype/**`、brainstorm/plan handoff | preview仅绑定loopback；root必须owned、private、non-symlink且contained；拒绝traversal/symlink；idle timeout和stop清理；只有真实体验后写durable decision，Proof零外发 | `npx jest tests/unit/spec-prototype-contracts.test.js tests/integration/spec-prototype-human-journey.integration.test.js --runInBand` | 待开发 | U3；无人体验返回blocked，不把server/test green提升为用户决定 |
| U8 Setup、CLI与元数据 | F001-F005、F144-F146、F181-F185、3项release/CI参考 | Runtime Setup、config、plugin manifest、CLI adapters、release/CI owners | 按2.2、2.3和3.4逐字段吸收；配置级联、`docs_root`例外和health facts落到当前owner；Codex transform守预算；OMP/Agent Plugins默认reference-only/not-applicable | `npx jest tests/unit/mcp-setup-project-config.test.js tests/unit/mcp-setup-config-consumers.test.js tests/unit/mcp-setup-contracts.test.js tests/unit/plugin-modules.test.js tests/unit/doctor-runtime-assets.test.js --runInBand`；`npm run build` | 待开发 | U1-U7；未获新产品决策不得新增supported platform、public CLI或runtime surface |
| U9 文档、投射与终验 | 全部已批准记录 | README/CHANGELOG/contracts/inventory、`spec-first init`、doctor | 只根据验证后的行为更新文档；先canonical source和tests，再验证六平台投射，其中OpenCode保持`generated-runtime preview`；记录真实provider/PR/browser/Xcode/user体验未执行项 | 第7节全量命令；获投射授权后运行 `node bin/spec-first.js init`、doctor和六平台projection integration tests；OpenCode只验证生成、inventory和已声明限制，不提升为loader/field支持 | 待开发 | U0-U8；source/runtime一致且所有限制可回溯后，才将计划状态标记为completed |

`U0` 是负责人逐一确认门，不是LLM或脚本自动替代的语义裁决。发现新的public contract、owner、provider或runtime source-of-truth时必须停止并回到本方案修订，不得在U1-U9中临场扩scope。U0完成后，本表是唯一canonical执行分解。

计算关系：

```text
185 selected paths
- 16 out-of-scope-by-product-decision
= 169 required reconciliation and synchronization paths

169 in-scope paths
= 117 compose + 52 implement-in-current-owner + 0 defer
```

U0更新逐文件裁决后使用以下固定输入重新生成账本；不得只手改JSON或Markdown结果：

U0必须按以下顺序关闭，后一步不得替代前一步：

1. **U0.1 schema gate**：升级逐文件Markdown表和`ce-upstream-reconciliation/v1`兼容读取逻辑，使新窗口ledger每条记录显式包含`target_action`、`evidence_status`、`source_refs[]`、`test_refs[]`和`limitations[]`。兼容读取旧窗口不代表新窗口可以继续使用旧字段集合，也不得另造同义动作字段。
2. **U0.2 semantic adjudication**：负责人逐项把40条`defer`裁决为`implement-in-current-owner`或`compose`。U0 只冻结裁决、owner 与引用：两类记录均提供当前 owner 的 `source_refs`、给出计划验证的 `test_refs`，并标记 `evidence_status: planned`，不得借字段存在声称已实现或已确认。`compose` 的等价性与 `implement-in-current-owner` 的实现都在 U1-U9 跑通对应 focused tests 后，才按第9节 DoD 转为 `evidence_status: confirmed`（U0 阶段不要求任何非排除记录达到 `confirmed`）。F144-F146改为`implement-in-current-owner / planned`。
3. **U0.3 deterministic refresh**：对账器校验枚举、字段类型、非空证据、F-ID连续性、路径集合、filelist SHA和状态计数后生成Markdown/JSON/inventory；169条非排除记录缺任一必填字段均fail-closed。
4. **U0.4 verify-only replay**：使用相同固定输入、不带`--refresh`再次执行，确认生成物字节一致且没有读取旧ledger来补全新窗口缺失字段，然后才允许升级readiness。

> **U0 收尾残留（阻断真正闭合）**：当前磁盘 `docs/validation/2026-08-19-ce-post-3-20-reconciliation.json` 仍含 legacy `verdict` 列（40 条 `defer`、F144-F146 仍标 `out-of-scope`），且 F185 `src/utils/detect-tools.ts` 的 `category` 仍为 `evidence-only`。这两项与 U0.1 最小记录合同、§2 的 `defer=0`/16 排除口径、§2.6 的 CLI/runtime 归类都不一致。U0 收尾必须再跑一次 U0.3+U0.4（`--refresh` 后无 `--refresh` 复验），移除或把 `verdict` 对齐到 `target_action`、把 F185 `category` 校正为 `cli-runtime`，字节一致后 U0 才算真正闭合。在此之前 `开发进展: 已完成` 与 frontmatter `implementation-ready` 应视为“待收尾”，不得据此声称 U0 已无残留。

新窗口逐文件ledger的最小记录合同为：

```json
{
  "audit_id": "F001",
  "path": "upstream/full/path",
  "target_action": "implement-in-current-owner|compose|out-of-scope-by-product-decision",
  "evidence_status": "planned|confirmed|not-applicable",
  "spec_first_owner": "canonical/source/path",
  "source_refs": ["canonical/source/path#symbol-or-section"],
  "test_refs": ["tests/unit/example.test.js"],
  "limitations": ["claim or runtime boundary"]
}
```

产品排除项使用`evidence_status: not-applicable`，不要求伪造source/test等价证据，但必须保留排除owner、产品决策来源和边界说明。非排除项的`source_refs`、`test_refs`和`limitations`不得为空；对账器不得再以`spec_first_owner`自动填充`test_refs`。U0完成时允许全部非排除项（`compose` 与 `implement-in-current-owner`）保持`planned`；第9节DoD要求它们在 U1-U9 跑通 focused tests 后最终转为`confirmed`。

```bash
node scripts/check-ce-upstream-reconciliation.cjs --refresh \
  --ce-repo /Users/kuang/xiaobu/compound-engineering-plugin \
  --base 1fac0442ee16996913dd0843a063ac279d2c32f4 \
  --head bbf995a444de9c7f8294fcd15ffa7332cd5f6418 \
  --filelist /Users/kuang/xiaobu/compound-engineering-plugin/filelist_1fac0442_to_head.txt \
  --filelist-sha256 b99edefc1e0a71b743e44638b3e02e198e19106f539696cf3e8cc2b8534a0ece \
  --audit docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md \
  --name-status docs/validation/2026-08-18-ce-post-3-20-name-status.md \
  --ledger docs/validation/2026-08-19-ce-post-3-20-reconciliation.json \
  --summary docs/validation/2026-08-19-ce-post-3-20-reconciliation.md \
  --inventory docs/validation/2026-08-19-current-skill-package-inventory.json
```

## 2.9 Security 与外部信任边界

### 跨模型、外部provider与数据外发

- `restricted-read`、数据外发、凭证使用、外部通信和mutation分别授权；宿主权限、`mode:headless`、配置偏好或上游脚本存在均不构成授权。
- 发送前生成最小payload，只包含当前任务必要片段；执行secret-like path拒绝、内容redaction，并记录source hash与payload hash。无法证明redaction和精确payload时不启动外部进程。
- 回执至少包含requested/actual provider、model、effort、source/payload identity、start/end、idle/hard timeout、exit status和cleanup/reap结果。缺回执、身份不符或peer不独立时只能报告本地coverage。
- provider输出是 `provider_untrusted` advisory input。不得把返回文本当命令执行，不得据此修改文件、扩大scope、声明测试通过或promotion durable knowledge。
- scratch必须current-user-owned、private、non-symlink、run-scoped；异常、timeout和取消都必须停止子进程并清理临时payload，durable evidence只能写入当前owner批准的artifact位置。

### Prototype preview

- preview只绑定loopback，不监听外部网卡，不创建公网隧道，也不把本地文件发送到外部服务。
- preview root必须contained、owned、private和non-symlink；对parent traversal、encoded traversal、symlink和special file fail-closed。
- server具有明确start/status/stop生命周期和idle timeout。状态文件与进程身份绑定，不能通过过期PID或URL声明服务可用。
- 自动测试只证明本地server和安全不变量；只有用户实际体验并作出决定后，才能写durable decision或声称原型回答了产品问题。

## 3. 产品边界与调整后的排除决策

### 3.1 `ce-babysit-pr`

- 账本范围：F006-F017，共 12 条。
- 不新增 `spec-babysit-pr`。
- 不复制 CE 的 branch currency、envelope、pipeline、stack、tick、watch loop、settle 或 `pr-snapshot` 状态机。
- 不因此修改 `spec-lfg`、`spec-commit-push-pr` 或 `spec-resolve-pr-feedback` 的产品边界。
- 继续禁止未经请求的基线合并、自动合并、强制推送或中心陪跑状态机。

### 3.2 `ce-proof`

- 账本范围：F128，共 1 条。
- 不创建 `spec-proof`。
- 不上传本地文档，不读取或保存 Proof token、`ownerSecret` 或类似凭据。
- 不创建 Proof 网络/API 路径，不把 `spec-prototype` 转为外发能力。

### 3.3 `ce-retune`

- 账本范围：F140-F142，共 3 条。
- 不新增 `spec-retune`。
- 不因该表面修改 `spec-optimize`。
- 不复制 CE corpus audit、context runner 或中心实验运行器。

### 3.4 `ce-setup`

- 账本范围：F144-F146，共 3 条。
- 不新增 `spec-setup`。
- 三条记录转为 `implement-in-current-owner`，分别映射当前 `spec-runtime-setup` 入口、配置合同/模板和 health/readiness 脚本 owner。
- 必须吸收当前工作流实际使用的普通配置级联、`docs_root` 仅允许团队级配置且无效时 fail-closed、repo/path containment、配置来源回执、optional capability 与健康检查事实。
- F145 的"当前 Skill 实际消费的配置键"必须是一份可核对的清单，而非泛指：U8 先用 grep 枚举当前 `skills/**` 与 `scripts/lib/project-config.cjs` 实际读取的配置键，产出键清单作为选择性吸收与 fail-closed 判定基准，并绑定 `tests/unit/mcp-setup-project-config.test.js` 验证；未被任何当前 consumer 使用的 CE 配置键不吸收。
- CLI install/tool detection 只吸收当前已支持宿主和工作流需要的事实；OMP、Agent Plugins 或其他新增宿主必须单独裁决，不因 CE 已支持而自动进入 `getSupportedPlatforms()`。
- 不复制 `.compound-engineering/**` 路径、CE 配置键全集、CE 交互问答流程或 `check-health` 文件形态。当前 owner 可以采用不同结构，但必须提供 source/test evidence。
- generated runtime 仅在 canonical source 和生成合同确实变化且验证通过后投射，不手改 runtime mirror。

| 审计 ID | CE source | 当前吸收 owner | 必须判断和吸收的内容 | 明确不吸收 |
| --- | --- | --- | --- | --- |
| F144 | `skills/ce-setup/SKILL.md` | `skills/spec-runtime-setup/SKILL.md` | setup/readiness职责、阻塞式用户确认降级、optional capability与配置来源说明 | `ce-setup`入口、CE专属命令和完整交互流程 |
| F145 | `skills/ce-setup/references/config-template.yaml` | `skills/spec-runtime-setup/references/config-template.yaml`、`scripts/lib/project-config.cjs`、`scripts/lib/path-safety.cjs` | 当前Skill实际消费的配置键、普通键级联、团队级`docs_root`例外、无效值fail-closed和路径containment | `.compound-engineering`文件名、未被当前consumer使用的CE配置键、CE默认值照搬 |
| F146 | `skills/ce-setup/scripts/check-health` | `skills/spec-runtime-setup/scripts/check-health`、`scripts/lib/facts.cjs`、`scripts/lib/project-config.cjs`、`src/cli/helpers/setup-facts.js` | 配置层来源、废弃键、example/template drift、scratch ignore、工具与provider readiness的确定性事实及reason code | Bash脚本逐行复制、把可选能力缺失统一判为setup失败、把advisory提升为confirmed outcome |

## 4. 非排除项的裁决规则

169 条非排除记录只能采用以下终态：

### 4.1 `implement-in-current-owner`

当前 canonical owner 缺少上游新增的不变量或行为，需要修改源码并补充验证。记录必须包含：

- 当前 `spec-*` owner；
- 需要吸收的上游行为或安全不变量；
- 实际修改路径；
- 当前 `spec-first` 测试 owner 和验证命令；
- source/runtime、provider、授权和现场结果限制。

### 4.2 `compose`

当前项目已经通过不同结构实现相同或更强的能力，不创建同名文件。记录必须包含：

- 当前等价 owner；
- 直接源码引用；
- 当前 `spec-first` 对应测试引用；
- 与 CE 实现形态不同的原因；
- 等价范围和未覆盖限制。

`compose`同时是计划术语和对账器机器枚举。文案中可以解释为“等价组合”，但不得再写入同义的第二枚举，避免方案、审计表和对账器产生不可执行的状态分叉。

### 4.3 不再接受的处理方式

- 因没有同名文件直接标记 `defer`；
- 因上游使用不同 provider、CLI、runner 或目录结构而跳过语义同步；
- 只写“已有类似能力”，不提供 source/test 证据；
- 机械复制 CE 包树或宿主专属路径；
- 复制 CE 的 `docs/**` 或 `tests/**` 文件来代替当前项目 owner 判断和本仓验证；
- 把 provider 输出、上游文档或测试通过提升为真实现场结果；
- 修改 generated runtime mirror 代替 canonical source 修复。

## 5. 原40条 `defer` 的重分类记录

| CE 表面 | 条数 | 审计 ID | 需要重新裁决的主题 |
| --- | ---: | --- | --- |
| `ce-brainstorm` | 6 | F023、F026-F030 | reasoning elevation、visual probes、context、同行执行、预览服务 |
| `ce-code-review` | 2 | F033、F036 | reviewer dispatch、上下文装配 |
| `ce-commit-push-pr` | 2 | F040、F042 | stack CLI、stack submit 与授权边界 |
| `ce-compound` | 1 | F056 | 当前源码上下文装配 |
| `ce-compound-refresh` | 1 | F049 | 当前源码上下文装配 |
| `ce-debug` | 3 | F062-F064 | pipeline mode、修复后交接、上下文装配 |
| `ce-doc-review` | 2 | F069、F082 | decision primer、上下文装配 |
| `ce-explain` | 1 | F089 | 上下文装配 |
| `ce-ideate` | 3 | F094、F098-F099 | issue intelligence、研究产物、上下文装配 |
| `ce-optimize` | 1 | F103 | 上下文装配；不包含已排除的 `ce-retune` |
| `ce-plan` | 4 | F111、F114-F116 | reasoning elevation、context、同行执行 |
| `ce-pov` | 1 | F121 | 上下文装配 |
| `ce-sweep` | 1 | F158 | 上下文装配 |
| `ce-work` | 12 | F163-F177 | worker、跨模型执行、workspace 生命周期、状态与事务 |

原40条记录已在U0全部转为`implement-in-current-owner / planned`。精确文件形态可以不复制，但每条上游变化都必须在U1-U9落到当前 owner 的实现或等价证据上；不得把这批记录重新标回`defer`。

## 6. 执行顺序与停止条件

第2.8节的U0-U9是唯一canonical执行分解。本节只定义波次，不重新分配Skill或文件owner：

| 波次 | 单元 | 开始条件 | 开发进展 | 完成条件 |
| --- | --- | --- | --- | --- |
| W0 范围 | U0 | 已完成 | 已完成 | 新账本满足schema gate、185/185、16排除、169非排除和0条 `defer`；每条记录有合法`evidence_status`，方案已升级为implementation-ready但不声明实施完成 |
| W1 公共底座 | U1 | W0完成 | 待开发 | context、peer、scratch、workspace和授权边界的focused tests通过 |
| W2 业务owner | U2-U6 | W1完成 | 待开发 | 每个F-ID由唯一owner关闭，compose项具备source/test证据，新增行为有正向和负向测试 |
| W3 Prototype与Setup/CLI | U7-U8 | 依赖owner已稳定 | 待开发 | 本地preview安全合同、F144-F146、元数据和CLI变化完成；OMP/Agent Plugins有明确reference-only/not-applicable结论 |
| W4 收尾 | U9 | U0-U8完成 | 待开发 | 文档、账本、inventory和source一致；全量验证完成；获授权时才执行runtime投射 |

波次和U单元的`开发进展`必须与2.5 package字段同步维护：U/W只有在所覆盖package全部达到`已完成`后才能更新为`已完成`；任何一个package出现`阻塞`，对应U/W不得继续标记为完成。

以下情况必须停止受影响单元并修订本方案，不能由实施者临场扩scope：

- 发现185条清单外的canonical source是实现必需依赖；
- 需要新增public Skill、CLI、supported platform、provider或runtime source-of-truth；
- 当前owner无法表达上游语义，必须创建新的共享抽象或改变产品边界；
- 需要数据外发、凭证、真实PR/CI、浏览器/Xcode或用户体验，但当前没有对应授权或环境；
- focused verification暴露跨单元contract冲突，无法在当前owner内修复。

## 7. 验证方案

### 7.1 逐项账本验证

- 185 条审计 ID 唯一；
- 选择集合状态保持 `M=148/A=36/R074=1`；
- 16 条产品排除保持不变；
- 原40条 `defer` 全部重分类为`implement-in-current-owner / planned`；
- 169 条非排除项均有 current owner、`target_action`、`evidence_status`、非空`source_refs`、`test_refs`和`limitations`；planned引用只证明实施输入完整，不证明行为完成；
- 清单外 187 条没有进入实现。

### 7.2 聚焦验证

不复制CE测试代码。第2.8节给出每个U-ID的最窄命令；执行者必须先运行对应单元命令并保存command、exit code和失败限制，再决定是否扩大到全量。能力簇至少覆盖：

- reconciliation 与 inventory；
- dispatch/context/peer runner；
- plan/brainstorm/ideate；
- code review/doc review/POV；
- work/worktree/debug/handoff；
- commit-push-pr 与 stack 边界；
- prototype 有人体验、无人值守阻断、目录安全和 Proof 零外发；
- Runtime Setup 配置级联、`docs_root` 例外、配置来源回执、health/readiness 和当前宿主工具探测；
- 六平台 runtime asset inventory；其中OpenCode必须保持`generated-runtime preview`和loader未验证限制，不能与已验证宿主合并表述为field支持。

每个单元必须同时包含正向、nil/empty和error/blocked场景。真实provider、PR/CI、浏览器、Xcode或用户体验未运行时，应记录 `not-run` 或 `blocked` 及原因，不能由fixture、静态合同或上游测试替代。

### 7.3 全量验证

```bash
npm run typecheck
npm run lint:skill-entrypoints
npm run test:unit
npm run test:smoke
npm run test:integration
npm run build
git diff --check
```

源码完成并获运行时投射授权后，再执行：

```bash
node bin/spec-first.js init
node bin/spec-first.js doctor --claude
node bin/spec-first.js doctor --codex
```

真实 provider、真实 PR/CI、真实浏览器/Xcode 和真实用户体验必须分别报告，不得由 fixture 或 contract tests 代替。

## 8. 当前状态

当前工作树已经包含：

- 新窗口对账脚本和验证产物；
- `spec-prototype` 源码、契约测试和有人体验集成测试；
- worker Git index、私有 scratch、provider/model identity、current-source grounding 等部分边界增强；
- runtime catalog、治理清单、Changelog 和六平台投射预期调整；OpenCode仍是`generated-runtime preview`。

这些改动证明U0范围冻结已经推进，但不代表169条同步完成。当前169条非排除记录仍为`planned`，U1-U9尚未完成逐项源码实现、测试验证和必要runtime投射；F144-F146也仍需在U8完成选择性吸收验证。

## 9. Definition of Done

只有同时满足以下条件，才能声明本轮 Skill 同步升级完成：

1. 185/185 条路径均有独立、唯一、可回源的最终裁决。
2. `ce-babysit-pr`、`ce-proof`、`ce-retune` 对应的 16 条产品排除保持不变；`ce-setup` F144-F146 已按当前 owner 完成必要语义吸收。
3. 其余 169 条不存在 `defer`、未映射 owner 或无证据的“已有能力”声明。
4. 每条记录都能回指 canonical source、测试或明确的等价实现证据；完成态下169条非排除记录的`evidence_status`全部为`confirmed`，不得残留`planned`。
5. 所有新增或变化的 Skill 行为均由当前 `spec-first` 测试或替代证据验证；不要求同步 CE 测试文件，缺失现场能力时明确限制声明。
6. README、catalog、contracts、inventory、reconciliation 和 CHANGELOG 与源码一致。
7. canonical source 通过 typecheck、Skill lint、unit、smoke、integration、build 和 diff check。
8. 六平台 runtime 只从验证后的源码投射，且doctor/source-runtime drift检查通过；OpenCode只声明`generated-runtime preview`，除非另有版本匹配的loader/field证据，不得提升为完整宿主支持。
9. 不把 fixture green、provider 自述、artifact 存在或模型声明提升为 field outcome。
10. 未获得独立授权前，不 commit、不 push、不创建 PR、不发送外部数据、不调用外部 provider。
11. 15份context和6份peer runner均通过唯一owner/parity证据关闭，没有新增重复中心helper。
12. F001-F005逐条关闭，3项release/CI参考分别记录 `adopted-as-local-improvement`、`reference-only` 或 `not-applicable`。
13. 跨模型和prototype满足第2.9节安全合同；无完整回执时不声称独立coverage或真实体验结果。
14. 账本已落到 U0.1 最小记录合同：不残留 legacy `verdict` 列，F185 `category` 为 `cli-runtime`，且 `--refresh`+无`--refresh`复验字节一致（§2.8 U0 收尾残留已闭合）。
