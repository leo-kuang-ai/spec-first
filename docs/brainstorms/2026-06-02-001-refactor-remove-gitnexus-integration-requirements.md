---
spec_id: 2026-06-02-001-refactor-remove-gitnexus-integration
artifact_kind: prd-requirements
target_surface: mixed
status: ready-for-planning
evidence_grade: mixed
author: test
created: 2026-06-02
---

# 彻底删除 GitNexus 集成需求文档

## PRD 元数据

| 项 | 内容 |
| --- | --- |
| 需求名称 | 彻底删除 GitNexus 集成 |
| 需求编号 / spec_id | `2026-06-02-001-refactor-remove-gitnexus-integration` |
| 业务域 | spec-first workflow harness / CLI / runtime setup / developer documentation |
| 目标 surface | Mixed: CLI、MCP setup、workflow skills、host entry docs、generated runtime、contracts、tests、user docs、package contents |
| 目标用户 / 角色 | spec-first 维护者、安装 spec-first 的 Claude/Codex 用户、后续 plan/work/review/debug workflow |
| 是否触及权限、敏感数据、资金、审计或合规 | 否 |
| 相关文档 | `docs/plans/2026-06-02-001-refactor-remove-gitnexus-integration-plan.md` 是已有实施计划参考，不是 PRD source-of-truth |

## Summary

spec-first 必须从 active product surface 中彻底移除 GitNexus：不再安装、配置、注入、推荐、调用、生成、打包或消费任何 GitNexus 专属能力与产物；代码理解和审查上下文回到 bounded direct source reads、`rg`、ast-grep、测试、日志和用户提供证据。

## Problem Frame

用户明确要求“彻底删除 GitNexus，从安装流程、使用流程、产物等全部删除”。当前仓库中 GitNexus 已从一个外部 graph provider 演化成横跨安装、host 指令注入、workflow 入口、readiness artifacts、review pre-facts、contracts、README、用户手册、测试 fixtures 和 package contents 的 active integration。继续保留任一 active 入口都会让用户安装 spec-first 后仍遇到 GitNexus 配置、图谱证据、graph-bootstrap 或残留产物语义。

关键边界判断：`skills/spec-graph-bootstrap/` 不是一个可保留的 provider-neutral workflow shell。它当前的 source、scripts、evals、tests 和产物 contract 都围绕 GitNexus graph-provider readiness 展开；如果只删除 GitNexus 文案而保留该 skill，会制造空壳入口和旧产物消费链。因此本 PRD 将其定义为 source 整目录删除，并要求所有消费 graph-bootstrap / review-pre-facts / GitNexus readiness 产物的 skills 同步更新。

本需求只定义删除后的产品行为和验收边界，不定义实施步骤。已有计划 `docs/plans/2026-06-02-001-refactor-remove-gitnexus-integration-plan.md` 可作为后续 plan 修订参考，但执行时必须以本文的 WHAT / scope boundaries 为准。

## Current System Snapshot

| 现状项 | 当前行为 | 证据 tag |
| --- | --- | --- |
| MCP setup registry | `skills/spec-mcp-setup/mcp-tools.json` 含 `id: "gitnexus"`，标记 `required: true`、`category: "graph-provider"`，并 pin `gitnexus@1.6.6-rc.76` 作为 host MCP server / graph provider | confirmed-source |
| Setup projection | `skills/spec-mcp-setup/scripts/write-provider-config.sh` 和 `.ps1` 读取 GitNexus registry entry，生成 `graph-providers.json.providers.gitnexus.native_capabilities`、`runtime-capabilities.json.gitnexus_capability_discovery`、provider command arrays 和 GitNexus raw/normalized artifact paths | confirmed-source |
| Setup verification | `skills/spec-mcp-setup/scripts/verify-tools.sh` 和 `.ps1` 检查 `.gitnexus/` quarantine、输出 GitNexus / graph-bootstrap next action，并把 GitNexus 描述为全局代码知识图谱与影响分析 | confirmed-source |
| Host instruction injection | `src/cli/gitnexus-instruction-block.js` 定义 `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->` block，并渲染中英 single-repo / multi-repo GitNexus 使用指引 | confirmed-source |
| `init` source path | `src/cli/commands/init.js` require `normalizeGitNexusInstructionBlock`，并在生成 AGENTS/CLAUDE instruction 后 normalize GitNexus block | confirmed-source |
| Public CLI | `src/cli/index.js` 注册 `gitnexus-instruction` command；`src/cli/commands/internal.js` 注册 `workspace-gitnexus-readiness` 与 `review-pre-facts` hidden internal commands | confirmed-source |
| Runtime entry docs | checked-in `AGENTS.md` 与 `CLAUDE.md` 末尾都有 GitNexus managed block，要求代码查询、影响分析、代码理解先读 `.spec-first/graph/graph-facts.json` 并优先用 GitNexus | confirmed-source |
| Graph bootstrap workflow | `skills/spec-graph-bootstrap/` 与 `templates/claude/commands/spec/graph-bootstrap.md` 提供 public graph readiness workflow；该 skill 目录当前包含 `SKILL.md`、4 个 eval files 和 7 个 scripts；其 scripts 运行 GitNexus analyze/status/query/impact，并写 `.spec-first/graph/*`、`.spec-first/providers/gitnexus/*`、`.spec-first/impact/*` 和 workspace summaries | confirmed-source |
| Review pre-facts helper | `src/cli/helpers/review-pre-facts/` 固定使用 `gitnexus.query`、`gitnexus.context`、`gitnexus.impact`、`gitnexus.detect_changes` operation names，读取 `.spec-first/graph/provider-status.json` 和 `.spec-first/graph/graph-facts.json` | confirmed-source |
| Workflow consumption | `skills/spec-mcp-setup`、`using-spec-first`、`spec-plan`、`spec-code-review`、`spec-doc-review`、`spec-work`、`spec-debug`、`spec-brainstorm`、`spec-write-tasks` 等 active workflow prose 仍消费 GitNexus evidence、workspace-gitnexus readiness、graph-bootstrap handoff、`.spec-first/graph/*`、`.spec-first/impact/bootstrap-impact-capabilities.json` 或 review-pre-facts | confirmed-source |
| Contracts | `docs/contracts/graph-evidence-policy.md`、`graph-provider-consumption.md`、`gitnexus-capability-catalog.md`、`workspace-gitnexus-consumption.md`、`downstream-graph-evidence-consumption.md` 和 `workflows/review-pre-facts-extraction.md` 定义 GitNexus evidence / capability / readiness / mutation boundary | confirmed-source |
| README / 用户手册 | `README.md`、`README.zh-CN.md` 和 `docs/05-用户手册/**` 把 graph-bootstrap、GitNexus readiness、GitNexus evidence posture 和 GitNexus 生命周期作为当前用户路径说明 | confirmed-source |
| Tests / fixtures | `tests/unit/**`、`tests/smoke/**`、`tests/fixtures/gitnexus-workspace/**`、`tests/fixtures/review-pre-facts/**`、`tests/benchmark/extract-graph-anchors.sh` 中存在 GitNexus package、graph-bootstrap、review-pre-facts、workspace readiness 和 provider fixture 断言 | confirmed-source |
| Package contents | `package.json.files` 显式打包 GitNexus contract docs；`package.json.scripts` 含 `test:graph-bootstrap` | confirmed-source |
| Current graph facts | 当前 checkout 下 `.spec-first/graph/graph-facts.json` 不存在；本 PRD 未使用 GitNexus 图谱证据，只使用 direct source reads / `rg` | confirmed-source |

## Change Delta

| 变化类型 | 内容 | 涉及现有能力 | 风险/权限/数据影响 | 证据 tag |
| --- | --- | --- | --- | --- |
| remove | 从 setup registry、host config、warmup、projection 和 verification output 中移除 GitNexus | `spec-mcp-setup`、`mcp-tools.json`、provider config scripts | 用户不再获得 GitNexus MCP config；这是 owner-requested breaking change | user-stated + confirmed-source |
| remove | 移除 GitNexus host instruction block、`gitnexus-instruction` CLI 和 init 自动注入 | `spec-first init`、`AGENTS.md`、`CLAUDE.md`、generated runtime mirrors | 若已有 runtime mirror 含旧 block，需通过 source-first regeneration / cleanup 收口 | confirmed-source |
| remove | 整目录删除当前 GitNexus-only `spec-graph-bootstrap` source skill，并删除 Claude command template | `skills/spec-graph-bootstrap/`、`templates/claude/commands/spec/graph-bootstrap.md` | graph-heavy workflow 不再有 GitNexus readiness path；保留空壳 skill 会误导 routing 和 runtime generation | confirmed-source |
| remove | 移除 GitNexus-only readiness artifacts 与 workspace advisory artifacts 的生产和消费 | `.spec-first/graph/*`、`.spec-first/providers/gitnexus/*`、`.spec-first/workspace/gitnexus-readiness.json` | 旧 artifacts 不能继续作为 current evidence；clean/doctor/setup 输出需避免误导 | confirmed-source |
| remove | 移除 review-pre-facts 的 GitNexus evidence helper 或将其从 active workflow 中完全断开 | `src/cli/helpers/review-pre-facts/`、doc-review/code-review/work/write-tasks prose | reviewer dispatch 不能再期待 GitNexus pre-facts；Coverage 需表达 direct-read evidence | confirmed-source |
| replace | active workflow 的“GitNexus-first / graph evidence / graph-bootstrap artifacts”上下文路径替换为 bounded direct source reads、`rg`、ast-grep、tests/logs 和用户提供 evidence | spec-mcp-setup / using-spec-first / plan / work / review / debug / doc-review / brainstorm / write-tasks | 影响面判断更依赖人工选择和源码确认，不引入替代 provider | user-stated |
| keep | spec-first 的核心链路 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 保持不变 | PRD、plan、work、review、compound workflows | 删除 provider 不等于删除 workflow harness | confirmed-source |
| keep | 历史审计记录可保留，但不得作为 active 用户指引、install path、current contract 或 package evidence 暴露 | `CHANGELOG.md`、历史 PRD/plan/analysis docs | 保留可追溯性；active docs 必须去当前化 | assumption |
| remove | 发布包、README、用户手册、tests/fixtures 中的 active GitNexus 教程、断言、fixtures 和 package allowlist | package contents、smoke/unit/manual tests | 需要同步测试期望，否则删除后测试会失败 | confirmed-source |

## Requirements

| 编号 | 触发条件 | 角色 | 系统行为 | 用户可见结果 | 对应关注点 |
| --- | --- | --- | --- | --- | --- |
| R-01 | 当用户运行 `spec-mcp-setup` 或安装后验证 MCP 工具时 | spec-first setup workflow | 系统不得把 GitNexus 列为 required tool、graph-provider、host MCP server、warmup dependency、provider pin 或 next action | setup 输出不再要求安装、重启或探测 GitNexus | install removal |
| R-02 | 当 setup 生成 `.spec-first/config/*` 事实时 | setup scripts | 系统不得写入 `graph-providers.json.providers.gitnexus`、`runtime-capabilities.json.gitnexus_capability_discovery` 或 GitNexus command arrays / artifact path projections | downstream workflows 不再看到 setup-inferred GitNexus availability | setup artifacts |
| R-03 | 当用户运行 `spec-first init` 或 init plan/apply 生成 host entry docs 时 | CLI / host runtime generator | 系统不得创建或更新 `<!-- gitnexus:start -->` managed block；若 source-owned checked-in entry docs 含该 block，本期应移除 source block | 新生成的 Claude/Codex runtime 不再包含 GitNexus 指令 | runtime generation |
| R-04 | 当用户查看 CLI help 或调用 internal command | CLI | 系统不得暴露 `gitnexus-instruction`、`workspace-gitnexus-readiness` 或 GitNexus-only `review-pre-facts` active command | 用户无法通过 spec-first CLI 进入 GitNexus 指令或 readiness helper | CLI surface |
| R-05 | 当用户通过 workflow entry router 选择下一步时 | `using-spec-first` / host bootstrap | 系统不得推荐 `spec-graph-bootstrap`、workspace-gitnexus readiness 或 GitNexus refresh；graph readiness 不再是公共入口锚点 | next-step guidance 只指向仍存在的 workflows | workflow routing |
| R-06 | 当用户查找 public workflows、source skills 或 runtime command files 时 | Claude/Codex host runtime | 当前 `spec-graph-bootstrap` public workflow 必须整目录删除 source skill；除非另有独立 PRD 定义 provider-free graph capability，否则不得保留同名入口、空壳 skill、scripts、evals 或 command template | `skills/spec-graph-bootstrap/`、`.claude/commands/spec/graph-bootstrap.md` 和 `.agents/skills/spec-graph-bootstrap/` 不再由 source 生成 | public workflow removal |
| R-07 | 当 plan/work/review/debug/doc-review/brainstorm/write-tasks 需要代码上下文时 | LLM workflow | workflow prose 必须把 bounded direct source reads、`rg`、ast-grep、tests/logs、用户 evidence 作为上下文来源；不得写 GitNexus-first、Graph / GitNexus Evidence、workspace-gitnexus、graph-bootstrap artifact 或 review-pre-facts 依赖 | agent 不会等待 GitNexus readiness 才继续普通工作 | usage removal |
| R-08 | 当 workflow closeout、Coverage、debug ledger 或 task pack 记录 evidence 时 | LLM workflow | 输出不得包含 GitNexus-specific evidence envelope、capability tags、workspace group status 或 provider limitation schema；如无外部 graph provider，应写 direct-read evidence 或 graph not applicable | 用户看到的证据口径不再引用 GitNexus | evidence semantics |
| R-09 | 当 clean/doctor/setup 发现旧 `.gitnexus/`、`.spec-first/providers/gitnexus/` 或 `.spec-first/workspace/gitnexus-readiness.json` 时 | CLI / setup scripts | 系统应将这些视为 retired spec-first managed residue 或 user-owned external residue，并以 preview-first / safe cleanup 方式处理；不得把它们当 current readiness | 旧产物不会继续影响 routing 或 readiness | artifact retirement |
| R-10 | 当维护者读取 active contracts 时 | docs/contracts consumer | active contracts 不得继续定义 GitNexus capability catalog、workspace-gitnexus readiness、Graph / GitNexus Evidence 或 GitNexus mutation boundary；若保留历史文档，必须标为 archived / retired 且不被 active docs 链接为 current contract | plan/work/review 不会消费旧 GitNexus contract | contract removal |
| R-11 | 当用户阅读 README、用户手册、Quickstart、FAQ 或 runtime capability catalog 时 | spec-first 用户 | 文档不得把 GitNexus、graph-bootstrap、GitNexus readiness 或 GitNexus artifacts 描述为当前安装、使用、验证或最佳实践路径 | onboarding 不再出现 GitNexus 使用流程 | docs removal |
| R-12 | 当维护者运行 tests 或 package build 时 | test/build system | GitNexus-specific unit/smoke/fixture/benchmark/package assertions 必须删除或改为断言 GitNexus absence；发布包不得包含 GitNexus-only skills、templates、contracts、fixtures 或 helper scripts | test suite 保护删除后的 product contract | verification |
| R-13 | 当执行 active-source residual scan 时 | 维护者 / reviewer | 除本 PRD、对应实施计划、CHANGELOG 历史记录、明确 archived 历史档案外，active source-of-truth 与 generated runtime source 不得出现 GitNexus / gitnexus / git-nexus 字样 | 残留不再能重新进入 active runtime | residual guard |
| R-14 | 当后续需求想引入其他 graph provider 或 provider-neutral graph workflow 时 | 产品 owner / spec-first maintainer | 本期不得顺手新增替代 provider、provider-neutral graph abstraction 或新的 graph readiness schema；后续能力必须另起 PRD | 删除不被替换方案稀释 | non-goal guard |
| R-15 | 当发布包含本删除时 | release owner | CHANGELOG / release notes 必须标记为 user-visible breaking change，并说明 GitNexus setup、graph-bootstrap、GitNexus artifacts 和 GitNexus evidence path 已退役 | 用户知道升级后的行为变化 | release communication |
| R-16 | 当删除 `skills/spec-graph-bootstrap/` 后 | workflow owner | 所有消费 graph-bootstrap 产物或 handoff 的 active skills 必须同步更新，至少包括 `spec-mcp-setup`、`using-spec-first`、`spec-plan`、`spec-code-review`、`spec-doc-review`、`spec-work`、`spec-debug`、`spec-brainstorm`、`spec-write-tasks`；不得继续引用 `.spec-first/graph/provider-status.json`、`.spec-first/graph/graph-facts.json`、`.spec-first/impact/bootstrap-impact-capabilities.json`、`.spec-first/workspace/gitnexus-readiness.json`、`Graph / GitNexus Evidence` 或 review-pre-facts 作为 active dependency | 删除 source skill 后没有悬空消费链 | skill consumer cleanup |

### 优先级

| 编号 | 优先级 | 可降级方案 | 是否阻塞上线 |
| --- | --- | --- | --- |
| R-01 | P0 | 无；继续安装 GitNexus 即违反用户目标 | 是 |
| R-02 | P0 | 无；setup projection 残留会继续污染 downstream | 是 |
| R-03 | P0 | 无；host instruction 残留会继续强制 agent 使用 GitNexus | 是 |
| R-04 | P0 | 无；CLI 入口残留等同继续支持 | 是 |
| R-05 | P0 | 无；routing 残留会继续引导用户进入已删除 workflow | 是 |
| R-06 | P0 | 无；当前 graph-bootstrap 是 GitNexus-only surface，保留空壳会误导用户和 runtime generation | 是 |
| R-07 | P0 | 无；workflow prose 是用户实际使用路径 | 是 |
| R-08 | P1 | 可先移除 GitNexus-specific 字段，再用通用 direct-read evidence 口径补齐 | 否 |
| R-09 | P1 | 可先停止读取旧 artifacts，再提供 cleanup 文案 | 否 |
| R-10 | P0 | 无；active contract 残留会让 plan/review 继续消费 | 是 |
| R-11 | P1 | 可先删 active onboarding，再整理历史分析页 | 否 |
| R-12 | P0 | 无；测试和 package 仍断言 GitNexus 会阻断删除 | 是 |
| R-13 | P1 | 可先建立 allowlist，再逐步清理历史档案 | 否 |
| R-14 | P0 | 无；本期目标是删除，不做替代建设 | 是 |
| R-15 | P0 | 无；用户可见 breaking change 必须说明 | 是 |
| R-16 | P0 | 无；删除 source skill 但保留 consumer prose 会形成悬空 contract | 是 |

## Acceptance Examples

```text
AE-01（对应 R-01, R-02）
Given 一个新 checkout
When 用户运行 `spec-mcp-setup`
Then setup registry、host config preview、warmup 和最终 summary 均不出现 GitNexus
And `.spec-first/config/graph-providers.json` 与 `runtime-capabilities.json` 不含 `gitnexus` key
```

```text
AE-02（对应 R-03）
Given source 中的 `AGENTS.md` / `CLAUDE.md` 和 templates 已更新
When 用户运行 `spec-first init`
Then checked-in host entry docs 与 generated runtime mirrors 均不包含 `<!-- gitnexus:start -->`
And 不包含“使用 GitNexus 作为首选工具”或 “use GitNexus as the preferred tool”
```

```text
AE-03（对应 R-04, R-06）
Given 用户查看 `spec-first --help`、Claude command list 或 Codex skill discovery
When GitNexus 删除已完成
Then 不存在 `gitnexus-instruction`、`workspace-gitnexus-readiness`、`review-pre-facts` GitNexus helper 或 `spec-graph-bootstrap` public entry
```

```text
AE-04（对应 R-05, R-07）
Given 用户问“这个改动影响哪些文件”或“帮我 review 这个 diff”
When workflow 需要代码上下文
Then agent 使用 bounded direct source reads、`rg`、ast-grep、git diff、tests/logs 和用户证据
And 不要求先运行 GitNexus、graph-bootstrap 或读取 workspace-gitnexus readiness
```

```text
AE-05（对应 R-08）
Given `spec-plan` 产出实施计划
When 计划需要说明代码证据
Then 它不输出 `## Graph / GitNexus Evidence`
And 如果没有外部 graph provider，它只记录 direct-read evidence、limitations 和 source refs
```

```text
AE-06（对应 R-09）
Given 旧项目目录中存在 `.gitnexus/`、`.spec-first/providers/gitnexus/` 或 `.spec-first/workspace/gitnexus-readiness.json`
When 用户运行清理或 setup/doctor 检查
Then spec-first 不把这些路径当 current readiness
And 只通过 preview-first cleanup 或明确 retired residue 提示处理
```

```text
AE-07（对应 R-10）
Given 维护者读取 active `docs/contracts/**`
When 搜索 current contract 入口
Then 不存在 GitNexus capability catalog、workspace-gitnexus consumption、Graph / GitNexus Evidence 或 review-pre-facts extraction 作为 active source-of-truth
```

```text
AE-08（对应 R-11）
Given 新用户阅读 README、快速开始、FAQ、首次工作流走查或最佳实践
When 用户寻找安装和使用路径
Then 文档不会要求安装 GitNexus、运行 graph-bootstrap、等待 GitNexus readiness 或查看 GitNexus artifacts
```

```text
AE-09（对应 R-12）
Given 维护者运行 `npm run build`
When package dry-run 输出文件列表
Then tarball 不包含 `skills/spec-graph-bootstrap/`、`templates/claude/commands/spec/graph-bootstrap.md`、GitNexus-only contracts、GitNexus fixtures 或 GitNexus benchmark helper
```

```text
AE-10（对应 R-12, R-13）
Given 维护者运行 GitNexus residual scan
When 扫描 active source roots、tests、templates、skills、agents、README 和 package files
Then GitNexus 字样只允许出现在本 removal PRD、对应 plan、CHANGELOG 历史记录或明确 archived historical docs 中
And active workflow/test/runtime/package surface 无残留
```

```text
AE-11（对应 R-14）
Given 删除 GitNexus 后 workflow 缺少 graph provider
When 维护者准备补一个新 provider 或 provider-neutral graph workflow
Then 该补充不会进入本期删除范围
And 必须另起需求明确目标、contract、artifacts、consumers 和验证方式
```

```text
AE-12（对应 R-15）
Given 发布包含本删除
When 用户阅读 CHANGELOG 或 release notes
Then 能看到这是 user-visible breaking change
And 明确知道 GitNexus setup、graph-bootstrap、GitNexus artifacts 和 GitNexus evidence path 已退役
```

```text
AE-13（对应 R-06, R-16）
Given `skills/spec-graph-bootstrap/` source directory 已删除
When 维护者扫描 active skills 和 templates
Then `spec-mcp-setup`、`using-spec-first`、`spec-plan`、`spec-code-review`、`spec-doc-review`、`spec-work`、`spec-debug`、`spec-brainstorm`、`spec-write-tasks` 均不再引用 graph-bootstrap handoff 或其产物路径
And 不存在 `.spec-first/graph/provider-status.json`、`.spec-first/graph/graph-facts.json`、`.spec-first/impact/bootstrap-impact-capabilities.json`、`.spec-first/workspace/gitnexus-readiness.json`、`Graph / GitNexus Evidence`、`review-pre-facts` 作为 active dependency
```

## Scope Boundaries

### 本期做

- 删除 GitNexus 在 install/setup/host config/warmup/detection/projection 中的 active provider 身份。
- 删除 GitNexus host instruction block 的 source 与 generation path，包括 checked-in `AGENTS.md` / `CLAUDE.md` 中的 managed block。
- 整目录删除当前 GitNexus-only `skills/spec-graph-bootstrap/` source skill，包括 `SKILL.md`、scripts、evals 和测试引用。
- 删除 `templates/claude/commands/spec/graph-bootstrap.md`，确保 source 不再生成 `spec-graph-bootstrap` runtime entry。
- 更新所有消费 graph-bootstrap 产物或 handoff 的 active skills，至少覆盖 `spec-mcp-setup`、`using-spec-first`、`spec-plan`、`spec-code-review`、`spec-doc-review`、`spec-work`、`spec-debug`、`spec-brainstorm`、`spec-write-tasks`。
- 删除或断开 GitNexus-only review-pre-facts helper 及其 active workflow consumption。
- 清理 active contracts、README、用户手册、workflow prose、tests、fixtures、benchmarks、package allowlist 中的 GitNexus current-state 叙述。
- 将旧 `.gitnexus/`、`.spec-first/providers/gitnexus/`、`.spec-first/workspace/gitnexus-readiness.json` 和 GitNexus graph facts 视为 retired residue，不再作为 current truth。
- 更新 CHANGELOG，标注 user-visible breaking change。

### 本期不做（Non-Goals）

- 不新增替代 graph provider、provider-neutral graph abstraction、graph readiness schema 或新的 evidence pipeline。
- 不把 ast-grep、Context7、browser tooling、shell commands 或其他非 GitNexus 工具一起删除。
- 不手改 generated runtime mirrors；source 更新后通过 `spec-first init` 或对应 source-owned generator 处理 runtime drift。
- 不删除用户全局环境中由用户自己管理、非 spec-first 管理的 GitNexus 配置；只能清理 spec-first managed entries 或给出 preview-first 提示。
- 不重写历史 CHANGELOG 事实。历史 PRD/plan/analysis docs 可作为 archive 保留，但不得继续被 README、workflow prose、contracts 或 package tests 当作 current behavior。

### 与其它模块/需求的关系

- `docs/plans/2026-06-02-001-refactor-remove-gitnexus-integration-plan.md` 已存在，但它是 implementation plan。若该计划与本文冲突，后续执行应先修订计划再进入 `spec-work`。
- 既有 GitNexus capability / intent routing PRD 和计划属于历史背景；本 PRD 的 remove delta supersedes 它们在 active implementation 上的 GitNexus 增强方向。
- 后续若要重建图谱能力，应从新的 brownfield PRD 开始，不复用本期删除任务夹带实现。

## Evidence And Assumptions

| 主张 | 类型 | 证据来源 / 为何是假设 | 需要谁确认 |
| --- | --- | --- | --- |
| 用户目标是彻底删除 GitNexus active integration | user-stated | 用户输入：“我要彻底删除gitnexus,从安装流程,使用流程,产物等等,全部彻底删除” | 已由用户声明 |
| 当前 setup registry 把 GitNexus 作为 required graph-provider | confirmed-source | `skills/spec-mcp-setup/mcp-tools.json` | 无 |
| 当前 CLI/init/host docs 会注入或暴露 GitNexus 指令 | confirmed-source | `src/cli/gitnexus-instruction-block.js`、`src/cli/commands/init.js`、`src/cli/index.js`、`AGENTS.md`、`CLAUDE.md` | 无 |
| 当前 graph-bootstrap 是 GitNexus-only active workflow surface | confirmed-source | `skills/spec-graph-bootstrap/`、`templates/claude/commands/spec/graph-bootstrap.md`、`skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` | 无 |
| 当前 review-pre-facts helper 是 GitNexus operation pipeline | confirmed-source | `src/cli/helpers/review-pre-facts/constants.js`、`query-plan.js`、`readiness.js` | 无 |
| 当前 docs/tests/package 中存在大量 active GitNexus expectations | confirmed-source | `README.md`、`README.zh-CN.md`、`docs/05-用户手册/**`、`docs/contracts/**`、`tests/**`、`package.json` | 无 |
| 本 PRD 不使用 GitNexus graph evidence | confirmed-source | `.spec-first/graph/graph-facts.json` 在当前 checkout 不存在，已降级为 direct source reads | 无 |
| 历史审计记录可保留，但不能作为 active behavior | assumption | 保留 changelog/历史档案能维护可追溯性；“彻底删除”按 active product surface 解释 | 若用户要求 literal zero historical text，需要单独确认历史档案销毁范围 |

## Decision Notes

- **删除边界 = active integration hard cut。** 本期目标不是弱化 GitNexus，也不是去品牌化，而是让 spec-first 安装后没有 GitNexus required tool、GitNexus host instruction、GitNexus workflow、GitNexus readiness artifact、GitNexus evidence path 或 GitNexus user guidance。
- **`spec-graph-bootstrap` 不保留空壳。** 当前 `skills/spec-graph-bootstrap/` 的 source、scripts、evals 和产物 contract 都是 GitNexus graph-provider readiness 的实现载体；删除 GitNexus 时必须删除该 skill source，并同步清理 consuming skills，而不是留下 provider-neutral 名字但没有真实能力的入口。
- **历史记录不等于 current contract。** `CHANGELOG.md` 和过往 PRD/plan/analysis 可记录历史，但 active README、用户手册、contracts、workflow prose、tests 和 package contents 不得再把 GitNexus 描述为当前能力。
- **删除不自动引入替代。** bounded direct source reads 是删除后的默认上下文路径；任何新 graph provider 或 provider-neutral graph workflow 都是后续独立需求。
- **Source-first runtime cleanup。** 不手改 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror；source/generator 清理完成后再通过 `spec-first init` 重新生成。

## Exception Handling

| 场景 | 系统表现 | 用户提示 | 是否可重试 | 是否产生业务副作用 |
| --- | --- | --- | --- | --- |
| 旧 runtime mirror 仍有 GitNexus block | 不把 runtime mirror 当 source；提示从 source 重新运行 init | “检测到旧 GitNexus runtime residue；从 source 重新生成 runtime” | 是 | 否 |
| 用户全局 MCP config 有自管 GitNexus | spec-first 不强删 user-owned config | “非 spec-first managed entry，需用户自行确认是否删除” | 是 | 否 |
| `.gitnexus/` 或 `.spec-first/providers/gitnexus/` 残留 | 不作为 current readiness；可 preview-first 清理 | “retired residue，不再参与 routing/evidence” | 是 | 否 |
| workflow 需要影响面判断但无 GitNexus | 使用 bounded direct reads、`rg`、ast-grep、git diff、tests/logs，并披露 limitation | “无 graph provider；本轮影响面基于直接证据” | 是 | 否 |
| active residual scan 命中 GitNexus | 若命中 active source/test/runtime/package，阻塞发布；若命中 archive/CHANGELOG/removal PRD，记录 allowlist | “区分 active surface 与 historical archive” | 是 | 否 |

## Release / Operation Readiness

| 项 | 状态 | Owner | 是否阻塞上线 |
| --- | --- | --- | --- |
| `CHANGELOG.md` 标记 breaking change | 待实施 | release owner | 是 |
| README / README.zh-CN 不再指向 GitNexus | 待实施 | docs owner | 是 |
| 用户手册 active path 不再包含 GitNexus | 待实施 | docs owner | 是 |
| `skills/spec-graph-bootstrap/` source directory 删除 | 待实施 | workflow owner | 是 |
| 消费 graph-bootstrap 产物的 active skills 全部更新 | 待实施 | workflow owner | 是 |
| `spec-first init` 重新生成后 runtime 无 GitNexus block | 待实施 | CLI owner | 是 |
| `npm run typecheck` | 待实施 | implementation owner | 是 |
| `npm run test:unit` | 待实施 | implementation owner | 是 |
| `npm run test:smoke` | 待实施 | implementation owner | 是 |
| `npm run build` tarball 无 GitNexus active assets | 待实施 | release owner | 是 |
| Active residual scan | 待实施 | reviewer / implementation owner | 是 |

## Readiness And Handoff

Readiness outcome: `ready-for-planning`.

Planning should not invent WHAT. It should consume these decided boundaries:

- delete GitNexus active integration across install, usage, artifacts, docs, tests, package and runtime generation;
- delete `skills/spec-graph-bootstrap/` as a source skill and update every active skill that consumes graph-bootstrap artifacts or handoff;
- preserve spec-first core workflow harness and bounded direct source evidence;
- do not introduce replacement graph provider in this increment;
- treat historical audit records as archive, not current contract;
- reconcile any existing plan against this PRD before work starts.

Closeout summary:

- sections included: Summary, Problem Frame, Current System Snapshot, Change Delta, Requirements, Acceptance Examples, Scope Boundaries, Evidence And Assumptions, Decision Notes, Exception Handling, Release / Operation Readiness, Readiness And Handoff
- requirement count: 16
- acceptance example count: 13
- priority distribution: P0 = 11, P1 = 5, P2 = 0
- NFR count: 0
- assumption count: 1
- outstanding question count: 0 blocking, 1 optional owner preference on literal historical-text purge
- uncovered requirements: none
- feature items without acceptance examples: none
- current-state claims without confirmed evidence: none material
