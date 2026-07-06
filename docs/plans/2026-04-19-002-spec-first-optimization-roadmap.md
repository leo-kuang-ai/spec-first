---
title: spec-first 工程化优化技术方案
created: 2026-04-19
status: superseded
owner: engineering
scope: CLI治理、Stage-0决策输入、workflow资产一致性、测试体系、DevEx
principle: 轻 contract + 明确边界 + 让 LLM 决策
origin: 工程负责人视角深度审查
superseded_at: 2026-05-12
superseded_by: docs/validation/2026-05-12-plan-lifecycle-cleanup.md
---

# spec-first 工程化优化技术方案

## 收口记录

2026-05-12 lifecycle cleanup 复核后，本 roadmap 状态从 `draft` 校准为 `superseded`。它仍保留为历史方向材料，但不再作为当前待执行计划。其主要主题已经被后续 graph readiness compiler、workspace graph router、doctor/runtime runnability、runtime tool boundary、dual-host governance、workflow quality、release/package evidence 和 graph evidence governance 等更具体计划拆分承接；其中早期 Stage-0/context-routing/CRG runtime 路径已被当前外部 provider 与 source/runtime 边界取代。

## 1. 背景与问题定义

`spec-first` 当前已经不是单纯 prompt pack，而是一个面向 Claude Code / Codex 的 AI Coding Workflow 工程化系统。它包含：

- CLI 安装、同步、清理、诊断能力
- Claude / Codex 双宿主 adapter
- workflow command、skill、agent、template 资产分发
- dual-host governance contract
- developer identity、language policy、instruction bootstrap
- CRG 图索引与 AST/SQLite 分析能力
- Stage-0 graph bootstrap 与 context-routing 决策输入层
- `verification_summary`、`verifier_dispatch`、`verification_gate_state` 等验证输入结构

本方案的目标不是把系统改造成重状态机，也不是把 LLM 的决策空间收窄成固定流程树，而是强化它作为 **LLM 决策输入平台** 的工程可信度。

核心优化方向：

> 让每个 workflow 在进入 ideate / brainstorm / plan / work / review / compound 前，拿到更真实、更可追溯、更低漂移、更清楚降级语义的输入，同时保持流程轻量、边界清晰、可维护。

## 2. 目标

### 2.1 产品目标

1. 降低用户对 `complete`、`healthy`、`L0` 等状态的误解。
2. 让 `doctor` 输出明确区分：
   - 安装是否完整
   - runtime asset 是否同步
   - host readiness 是否满足
   - workflow 是否真的可运行
3. 让 Stage-0 决策输入具备稳定、可消费的质量信号：
   - `provenance`
   - `freshness`
   - `confidence`
   - `fallback_reason`
   - `coverage_gaps`
   - `data_quality`
   - `generated_from`
4. 降低 `skills/`、`docs/10-prompt/skills/`、runtime copies、README、templates 之间的漂移风险。
5. 提升 graph-bootstrap、plan、work、review 之间的数据闭环质量，但不引入重编排状态机。

### 2.2 工程目标

1. 收紧 Stage-0 L0/L1/L2/L3 语义。
2. 拆分 `doctor` 的健康检查模型。
3. 增加资产一致性测试与版本一致性测试。
4. 增强 `init` / `clean` 的安全预览与边界保护。
5. 增加真实宿主或模拟宿主层面的 smoke coverage。
6. 保持现有 CLI、adapter、governance contract 的兼容性。

## 3. 非目标

本方案不做以下事情：

1. 不把 workflow 改造成强状态机。
2. 不让 CLI 强制替 LLM 决定下一步执行路径。
3. 不把 `verification_gate_state` 变成审批流。
4. 不让 `doctor` 自动执行所有 workflow。
5. 不把 prompt/skill 文本全部迁移成代码 DSL。
6. 不引入大型 orchestration engine。
7. 不把 CRG 或 Stage-0 产物伪装成事实绝对正确的证明。

## 4. 设计原则

### 4.1 轻 contract

contract 应该定义：

- 结构
- 字段语义
- 质量等级
- 降级原因
- 可选与必需边界
- 下游消费方式

contract 不应该定义：

- 强制执行树
- 多状态审批流程
- LLM 必须按某个固定分支行动
- 隐式自动化策略

### 4.2 明确边界

每个结构只回答自己的问题：

| 结构 | 只回答什么 |
|---|---|
| `artifact-manifest.json` | 产物是否生成、来自哪些输入、质量等级是什么 |
| `minimal-context/*.json` | 当前阶段优先给 LLM 的最小上下文是什么 |
| `context-routing.json` | 不同 stage 应选择哪些上下文 |
| `freshness.json` | 输入和产物是否可能过期 |
| `verification_summary` | 当前变化建议验证什么 |
| `verifier_dispatch` | 哪些 verifier 候选可用、哪些被 blocker 阻断 |
| `verification_gate_state` | 当前验证证据账本状态 |
| `doctor` | 当前安装/runtime/host readiness 检查结果 |
| `skill` | workflow 意图、顺序、人工/LLM执行规则 |

### 4.3 让 LLM 决策

LLM 应该拿到更好的事实、风险、验证建议和 fallback 信号，然后自行判断：

- 是否需要补读源码
- 是否应该降级信任 Stage-0 输出
- 是否需要运行额外测试
- 是否应该要求用户确认
- 是否可以进入 work/review/compound

系统不应该通过过度硬编码来替代 LLM 的工程判断。

## 5. 当前问题清单

### P1-1：Stage-0 `complete` 与事实可信度边界不够硬

当前 graph-bootstrap 会生成 `artifact-manifest.json`，其中 `status: complete` 表示产物装配完成。但事实质量还依赖 `data_quality`、`provenance`、`confidence` 等字段。

问题是下游容易把 `complete` 或 `L0` 误解成“事实高可信”。

当前风险：

- `partial` 质量可能仍被 evaluator 判为 L0。
- 默认 docs skeleton 与 analyzer-backed facts 混合后，用户不容易区分。
- `minimal-context` 存在不等于它足够可信。

### P1-2：`doctor` 输出容易被误解为 workflow 运行健康

当前 `doctor` 更偏安装检查：

- Node / Git / plugin manifest
- CRG native module
- state 文件
- runtime files
- commands / skills / agents 是否存在

它不能完整证明：

- Claude / Codex 宿主真的会加载 runtime asset
- MCP server 能连接
- `spec-*` 或 `spec-*` workflow 真能完成执行
- Stage-0 context 能被 skill 正确消费

### P1-3：workflow gate 多为 prompt soft contract

`brainstorm`、`plan`、`work`、`review` 等流程在 skill 文本中有明确要求，但很多 gate 没有 CLI hard enforcement。

这不是天然缺陷，因为本项目追求轻 contract。但需要避免用户误以为这些 gate 是系统强制执行。

### P1-4：多处资产镜像存在漂移风险

当前存在多类相关资产：

- `skills/`
- `docs/10-prompt/skills/`
- `templates/claude/commands/spec/`
- `.claude/` runtime copy
- `.agents/skills/` runtime copy
- README 中英文说明
- dual-host governance contract
- plugin manifest

如果缺少一致性测试，重命名、删除、入口调整时容易出现残留。

### P2-1：`init` 职责偏重

`init` 同时处理：

- 参数解析
- manifest/governance 加载
- developer identity
- previous state
- legacy state
- obsolete asset removal
- command namespace prune
- asset sync
- settings validation
- session hook
- language policy
- instruction bootstrap
- changelog bootstrap
- state 写入

后续维护和回归定位成本较高。

### P2-2：`clean` / namespace prune 需要更强预览语义

清理逻辑基于 managed state，整体方向正确。但用户如果在 managed namespace 下手动放文件，仍可能被清理或覆盖。

需要更清楚地区分：

- state-tracked deletion
- managed namespace prune
- runtime generated cleanup
- user-owned file untouched

## 6. 目标架构

### 6.1 优化后的分层

```text
CLI entry
  bin/spec-first.js
    -> cli commands
    -> crg router

CLI command layer
  init
  doctor
  clean
  stage0-context

Governance layer
  plugin manifest
  skills-governance.json
  version consistency
  source/mirror consistency

Adapter layer
  claude adapter
  codex adapter

Runtime asset sync layer
  command templates
  skills
  workflow skills
  agents
  instruction files
  session hooks

Stage-0 decision-input layer
  bootstrap compiler
  artifact manifest
  minimal context
  freshness
  context routing
  verification profile

Context consumption layer
  evaluator
  loader
  verification summary
  verifier dispatch
  verification evidence
  verification gate state
  telemetry

Workflow asset layer
  ideate
  brainstorm
  plan
  work
  review
  compound
  graph-bootstrap
  mcp-setup

Testing layer
  unit
  smoke
  integration
  e2e CRG
  asset consistency
  host simulation
```

### 6.2 状态语义重定义

#### `artifact-manifest.status`

只表示产物生成状态：

| status | 语义 |
|---|---|
| `in_progress` | bootstrap 正在写入或上次未完成 |
| `complete` | 固定产物已写出 |
| `failed` | 产物写入失败 |

不得表示事实可信。

#### `artifact-manifest.data_quality`

表示事实输入质量：

| data_quality | 语义 | evaluator 建议 |
|---|---|---|
| `fact-backed` | 有 analyzer-backed modules 和 entrypoints | 可进入 L0 |
| `partial` | 有部分事实，但关键字段缺失 | 最高 L1 |
| `empty` | 无有效事实 | L2/L3 |
| `sample-backed` | 来自 sample/fixture/default generator | 最高 L2 |
| `skeletal` | 只有默认骨架或路径存在 | 最高 L2 |
| `mixed` | 部分 analyzer-backed，部分 skeletal/sample | 最高 L1 |

#### `minimal-context.provenance`

表示该 context 主要来源：

| provenance | 语义 |
|---|---|
| `fact-inventory` | 来自真实仓库事实抽取 |
| `crg-graph` | 来自 CRG graph |
| `filesystem-inference` | 来自文件系统启发式推断 |
| `default-skeleton` | 默认骨架 |
| `sample-generator` | sample generator |
| `mixed` | 多来源混合 |

#### `confidence`

| confidence | 语义 |
|---|---|
| `high` | 关键字段来自真实分析且有测试面 |
| `medium` | 有部分事实，但覆盖不足 |
| `low` | 主要来自 fallback / skeleton / heuristic |

## 7. 实施方案

## Phase 1：收紧 Stage-0 决策输入语义

### 7.1 修改 evaluator L0 判定

涉及文件：

- `src/context-routing/evaluator.js`
- `src/bootstrap-compiler/compile-routing.js`
- `src/bootstrap-compiler/compile-minimal-context.js`
- `tests/unit/context-routing*.test.js`
- `tests/e2e/spec-graph-bootstrap-mainline.sh`

当前问题：

```text
manifest.status == complete
routing exists
minimal context exists
data_quality != empty
=> 可能 L0
```

目标逻辑：

```text
L0:
  manifest.status == complete
  data_quality == fact-backed
  minimal-context exists
  minimal-context.confidence in high|medium
  freshness not stale

L1:
  data_quality == partial|mixed
  or confidence == medium with coverage gaps
  or freshness stale but assets readable

L2:
  data_quality == sample-backed|skeletal|empty
  or routing missing
  or minimal-context missing

L3:
  context/control plane missing
  or JSON parse failure
  or manifest absent/incomplete
```

输出新增字段：

```json
{
  "level": "L1",
  "fallback_reason": "data_quality_partial",
  "data_quality": "partial",
  "confidence": "medium",
  "coverage_gaps": ["entrypoints_missing"],
  "decision_input_quality": {
    "facts": "partial",
    "routing": "available",
    "freshness": "healthy",
    "human_docs": "mixed"
  }
}
```

验收标准：

- `partial` 不再返回 L0。
- `sample-backed` 和 `skeletal` 永不返回 L0。
- `fallback_reason` 能解释降级原因。
- 现有 graph-bootstrap mainline fixture 仍能在真实最小 Git + source repo 下返回 L0。
- 空 repo / docs-only repo 必须降级。

### 7.2 扩展 manifest data quality

涉及文件：

- `src/bootstrap-compiler/compile-routing.js`
- `src/bootstrap-compiler/sample-generator.js`
- `docs/contracts/spec-graph-bootstrap/`
- `tests/contracts/*`

新增枚举：

```text
fact-backed
partial
mixed
empty
sample-backed
skeletal
```

判定规则：

- 有真实 modules + entrypoints + test surface：`fact-backed`
- 有 modules 或 entrypoints，但缺关键事实：`partial`
- 同时存在 analyzer-backed 与 default skeleton：`mixed`
- 无 facts：`empty`
- 明确 sample generator：`sample-backed`
- 只有默认 docs：`skeletal`

验收标准：

- schema 约束覆盖新增枚举。
- sample generator 不再伪装成 fact-backed。
- human docs 能标注生成来源。

### 7.3 为 minimal-context 增加 coverage gaps

涉及文件：

- `src/bootstrap-compiler/compile-minimal-context.js`
- `src/context-routing/verification-summary.js`
- `tests/unit/stage0-context*.test.js`

新增字段：

```json
{
  "coverage_gaps": [
    {
      "field": "entrypoints",
      "reason": "empty",
      "impact": "plan may miss public API boundaries"
    }
  ]
}
```

验收标准：

- 缺少 entrypoints 时，plan context 明确暴露 gap。
- 缺少 test surface 时，work/review context 明确暴露 gap。
- LLM 不需要猜测 context 是否完整。

## Phase 2：重构 doctor 输出模型

### 8.1 doctor 分层

涉及文件：

- `src/cli/commands/doctor.js`
- `tests/smoke/cli.sh`
- `tests/unit/doctor*.test.js`
- `README.md`
- `README.zh-CN.md`

目标输出层级：

```text
Install Health
  - CLI executable
  - package version
  - plugin manifest
  - governance contract

Runtime Asset Health
  - commands
  - skills
  - workflow skills
  - agents
  - state file
  - instruction bootstrap

Host Readiness
  - Claude/Codex expected paths
  - settings / config file
  - session hook
  - MCP readiness marker

Decision Input Health
  - graph-bootstrap control plane
  - context-routing
  - artifact-manifest
  - minimal-context
  - freshness
  - data_quality

Workflow Runnability
  - not verified
  - simulated
  - verified
```

重要语义：

- `doctor` 默认不应声称 workflow runnable。
- 如果没有真实执行宿主 workflow，输出 `workflow_runnability: not_verified`。
- 如果只检查文件存在，输出必须叫 `asset_present`，不能叫 `healthy`。

示例 JSON：

```json
{
  "install_health": "pass",
  "runtime_asset_health": "pass",
  "host_readiness": "warn",
  "decision_input_health": "degraded",
  "workflow_runnability": "not_verified",
  "warnings": [
    {
      "code": "stage0-data-quality-partial",
      "message": "Stage-0 artifacts exist but are not fact-backed."
    }
  ]
}
```

验收标准：

- `doctor` 人类输出和 JSON 输出都区分这些层。
- smoke tests 更新断言。
- README 不再把 doctor 描述成完整运行健康证明。

### 8.2 增加 `doctor --json`

如果当前已有 JSON 输出则标准化；如果没有，新增稳定 JSON contract。

用途：

- CI 检查
- release smoke
- host simulation
- LLM 可消费诊断输入

验收标准：

- JSON schema 稳定。
- human output 变化不影响自动化测试。

## Phase 3：资产一致性与治理测试

### 9.1 source/mirror consistency test

涉及文件：

- `tests/unit/asset-consistency.test.js`
- `skills/`
- `docs/10-prompt/skills/`

检查内容：

1. `skills/<name>/SKILL.md` 与 `docs/10-prompt/skills/<name>/SKILL.md` 是否同步。
2. 允许的差异必须显式声明。
3. retired workflow 名称不得出现。
4. command-backed workflow 必须在 plugin manifest 和 governance 中一致。
5. standalone skill 不得被 README 写成 slash command。

验收标准：

- 修改 skill 但忘记 mirror 时测试失败。
- 删除/重命名 workflow 后旧入口残留会失败。
- dual-host entrypoint 错误会失败。

### 9.2 manifest / package version consistency

涉及文件：

- `package.json`
- `.claude-plugin/plugin.json`
- `src/cli/plugin.js`
- `tests/unit/plugin-version.test.js`

规则：

- package version 与 plugin manifest version 必须一致，或 manifest 明确声明它是 plugin schema version 而不是 package version。
- 如果允许不一致，README 和 release docs 必须解释。

建议：

优先统一版本，降低发布心智成本。

验收标准：

- `npm test` 能捕获版本漂移。
- release 前不靠人工记忆。

### 9.3 retired token guard

已有 legacy bootstrap workflow 清理需求，应把 guard 常态化。

涉及文件：

- `tests/unit/retired-entrypoints.test.js`
- `tests/smoke/cli.sh`

规则：

- retired workflow 名称不能出现在 source assets、README、templates、docs mirror。
- 测试中如需表达 retired token，必须动态拼接，避免测试自身污染搜索结果。

验收标准：

- legacy bootstrap skill 名称、Claude 旧入口、Codex 旧入口不再回归。
- 新 retired workflow 可以追加到列表。

## Phase 4：init / clean 安全性优化

### 10.1 增加 install plan

涉及文件：

- `src/cli/commands/init.js`
- `src/cli/state.js`
- `src/cli/plugin.js`
- `tests/unit/init-plan.test.js`

新增内部结构：

```js
{
  platform: 'claude',
  writes: [],
  overwrites: [],
  removes: [],
  prunes: [],
  warnings: []
}
```

职责：

- 在真正写文件前生成 plan。
- 默认仍执行 apply。
- `--dry-run` 只输出 plan，不写入。

验收标准：

- `spec-first init --claude --dry-run` 不产生文件变化。
- 输出列出将写入、覆盖、删除、prune 的路径。
- tests 验证 dry-run 幂等。

### 10.2 clean 增加 dry-run 与 managed boundary

涉及文件：

- `src/cli/commands/clean.js`
- `src/cli/state.js`
- `tests/unit/clean-plan.test.js`
- `tests/smoke/cli.sh`

新增命令：

```bash
spec-first clean --claude --dry-run
spec-first clean --codex --dry-run
```

输出：

```text
Would remove state-tracked assets:
- .claude/commands/spec/plan.md
- .claude/spec-first/workflows/spec-plan

Would remove runtime files:
- .claude/spec-first/state.json

Would keep user-owned files:
- ...
```

验收标准：

- dry-run 不删除文件。
- clean 不越过 projectRoot。
- managed namespace prune 有明确输出。

## Phase 5：workflow 决策输入接入强化

### 11.1 plan/work/review 统一消费 Stage-0 contract

涉及文件：

- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `docs/10-prompt/skills/*`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-review-contracts.test.js`

统一规则：

1. 优先读取 `spec-first stage0-context --format json`。
2. 使用 evaluator 输出为真源。
3. 明确区分：
   - `selected_assets`
   - `fallback_reason`
   - `level`
   - `skipped_rules`
   - `verification_summary`
   - `verifier_dispatch`
   - `verification_evidence`
   - `verification_gate_state`
4. 不把 `verification_gate_state` 当成执行过 verifier 的证明。
5. 不把 repo baseline verification 自动升级成本次改动必跑项。

验收标准：

- 三个 skill 文本对这些字段的解释一致。
- contract tests 覆盖关键字段。
- docs mirror 同步。

### 11.2 增加 workflow telemetry quality record

涉及文件：

- `src/context-routing/telemetry.js`
- `src/cli/commands/stage0-context.js`
- `tests/unit/telemetry*.test.js`

目标：

每次 stage0-context 输出时记录：

```json
{
  "workflow": "spec-plan",
  "stage": "plan",
  "level": "L1",
  "data_quality": "partial",
  "fallback_reason": "entrypoints_missing",
  "selected_asset_count": 4,
  "verification_summary_source": "repo-baseline",
  "created_at": "..."
}
```

验收标准：

- telemetry 不驱动流程，只记录事实。
- 记录失败不阻塞主 workflow。
- 可用于后续 compound / quality feedback。

## Phase 6：测试体系升级

### 12.1 新增高价值测试矩阵

| 测试 | 类型 | 目标 |
|---|---|---|
| `asset-consistency.test.js` | unit | 防 skill/mirror/manifest 漂移 |
| `stage0-quality-levels.test.js` | unit | 验证 L0/L1/L2/L3 语义 |
| `doctor-json-contract.test.js` | unit | 锁定 doctor JSON |
| `init-dry-run.test.js` | unit | 防 dry-run 写文件 |
| `clean-dry-run.test.js` | unit | 防误删 |
| `host-runtime-simulation.sh` | smoke | 模拟 Claude/Codex runtime asset 是否可发现 |
| `graph-bootstrap-quality-fixtures.sh` | e2e | 空 repo、docs-only repo、minimal source repo、full repo 质量等级 |

### 12.2 fixture 设计

新增 fixture：

```text
tests/fixtures/repos/
  empty-repo/
  docs-only-repo/
  minimal-node-cli/
  node-cli-with-tests/
  mixed-generated-context/
```

每类期望：

| fixture | expected level | expected data_quality |
|---|---|---|
| empty-repo | L2/L3 | empty |
| docs-only-repo | L2 | skeletal |
| minimal-node-cli | L1/L0，取决于 entrypoints/test | partial 或 fact-backed |
| node-cli-with-tests | L0 | fact-backed |
| mixed-generated-context | L1 | mixed |

验收标准：

- graph-bootstrap 不再只证明“能生成文件”。
- 测试能证明“质量等级符合事实”。

## 13. 文档与用户心智更新

涉及文件：

- `README.md`
- `README.zh-CN.md`
- `docs/contracts/dual-host-governance/README.md`
- `docs/08-版本更新/README.md`
- `docs/10-prompt/skills/`

更新原则：

1. 明确 `spec-first` 是 AI workflow / decision-input platform，不是自动代码生成器。
2. 明确 doctor 的层级语义。
3. 明确 graph-bootstrap 的产物质量等级。
4. 明确 `skills/` 是 source of truth，runtime copy 是生成物。
5. 明确 Claude entrypoint 和 Codex entrypoint 的差异。
6. 明确 workflow gate 是 soft contract，除 CLI/schema/test 明确 enforce 的部分外，不宣称硬约束。

README 增加说明：

```text
spec-first improves AI coding quality primarily by improving decision input:
- structured requirements/plans/reviews
- graph-informed Stage-0 context
- risk signals
- verification recommendations
- freshness and fallback signals
- host-specific runtime asset governance

It does not replace tests, code review, or engineering judgment.
```

中文 README 增加说明：

```text
spec-first 的核心增益不是让 AI “照流程表演”，而是把上下文、风险、验证建议、置信度、回退原因结构化给 LLM，让它更容易做对工程判断。
```

## 14. 迁移与兼容策略

### 14.1 CLI 兼容

保持现有命令不变：

```bash
spec-first init --claude
spec-first init --codex
spec-first doctor --claude
spec-first doctor --codex
spec-first clean --claude
spec-first clean --codex
spec-first stage0-context --stage plan --workflow spec-plan --format json
```

新增参数保持向后兼容：

```bash
spec-first init --claude --dry-run
spec-first clean --claude --dry-run
spec-first doctor --claude --json
```

### 14.2 Stage-0 contract 兼容

新增字段不得破坏旧消费者：

- 新字段可选。
- evaluator 对旧 manifest 做兼容降级。
- 缺少新字段时不抛错，输出 `fallback_reason: legacy_manifest_missing_quality_fields`。

### 14.3 Runtime asset 兼容

- 不改变 Claude/Codex 现有安装路径。
- 不恢复 retired legacy bootstrap workflow。
- graph-bootstrap 继续作为唯一 bootstrap workflow entrypoint。

## 15. 验证计划

### 15.1 必跑命令

```bash
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:e2e:crg
```

### 15.2 新增验证命令

```bash
node --test tests/unit/asset-consistency.test.js
node --test tests/unit/stage0-quality-levels.test.js
node --test tests/unit/doctor-json-contract.test.js
bash tests/e2e/graph-bootstrap-quality-fixtures.sh
bash tests/smoke/host-runtime-simulation.sh
```

### 15.3 手工验证点

1. `spec-first init --claude --dry-run` 不写文件。
2. `spec-first clean --codex --dry-run` 不删文件。
3. 空 repo 执行 graph-bootstrap 不返回 L0。
4. source + tests repo 执行 graph-bootstrap 返回 L0。
5. `doctor --json` 明确输出 `workflow_runnability: not_verified`，除非真实执行验证。
6. README 中不再出现 retired bootstrap entrypoint。
7. docs mirror 与 skills source 一致。

## 16. 分阶段交付计划

### 16.1 第一阶段：质量等级收紧

目标：解决最关键的决策输入失真风险。

实施单元：

1. 修改 `compile-routing` data quality 枚举。
2. 修改 `compile-minimal-context` coverage gaps。
3. 修改 evaluator L0/L1/L2/L3 判定。
4. 增加 quality fixture tests。
5. 更新 graph-bootstrap docs contract。

完成信号：

- `partial` 不再 L0。
- `sample-backed` / `skeletal` 永不 L0。
- stage0-context 输出包含明确 `data_quality` 和 `fallback_reason`。

### 16.2 第二阶段：doctor 语义重构

目标：降低 DevEx 误导。

实施单元：

1. 增加 doctor JSON contract。
2. 分层输出 install/runtime/host/decision/workflow。
3. 更新 smoke tests。
4. 更新 README 中英文。

完成信号：

- 用户能看懂 doctor 绿灯代表什么、不代表什么。
- CI 可消费 doctor JSON。
- workflow runnability 不再被隐式声称。

### 16.3 第三阶段：资产一致性治理

目标：降低长期维护风险。

实施单元：

1. 增加 skill mirror consistency。
2. 增加 plugin/package version consistency。
3. 增加 retired token guard。
4. 把旧 bootstrap 名称 guard 常态化。

完成信号：

- 修改 skill 忘记 mirror 会失败。
- 重命名 workflow 后旧入口残留会失败。
- release 前能捕获版本漂移。

### 16.4 第四阶段：init/clean 安全增强

目标：降低 runtime 文件误删/覆盖心智成本。

实施单元：

1. 引入 install plan。
2. 增加 `init --dry-run`。
3. 增加 `clean --dry-run`。
4. 输出 managed/user-owned 边界。

完成信号：

- 用户能在执行前看到将写、覆盖、删除什么。
- dry-run 有测试保证。
- managed namespace prune 有清晰解释。

### 16.5 第五阶段：host simulation 与 workflow evidence

目标：让测试更接近真实使用。

实施单元：

1. 增加 host runtime simulation。
2. 增加 graph-bootstrap quality fixture E2E。
3. 标准化 workflow telemetry。
4. 让 compound 可消费质量反馈，但不自动触发 refresh。

完成信号：

- 测试不只证明文件存在，也证明质量等级和宿主路径可发现。
- telemetry 是事实账本，不是流程控制器。

## 17. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 收紧 L0 导致现有 fixture 失败 | 短期测试维护成本 | 调整 fixture，让测试表达真实仓库质量 |
| doctor 输出变化影响用户脚本 | 兼容性风险 | 新增 JSON contract，human output 逐步迁移 |
| data_quality 新枚举影响旧消费者 | 降级逻辑变化 | 旧 manifest 缺字段时使用 legacy fallback |
| mirror consistency test 太严格 | 文档维护负担 | 允许显式差异白名单 |
| dry-run plan 与真实 apply 不一致 | 用户不信任 | plan 与 apply 共用同一内部数据结构 |
| host simulation 不等于真实 Claude/Codex | 覆盖有限 | 输出中标注 simulation，不宣称真实运行通过 |

## 18. 成功指标

### 18.1 工程指标

- `npm run test:unit` 通过。
- `npm run test:smoke` 通过。
- `npm run test:integration` 通过。
- `npm run test:e2e:crg` 通过。
- 新增 asset consistency tests 通过。
- 新增 Stage-0 quality fixture tests 通过。

### 18.2 决策输入质量指标

- Stage-0 输出中 100% 包含 `data_quality`。
- 降级场景 100% 包含 `fallback_reason`。
- `minimal-context` 至少包含 `provenance`、`confidence`、`coverage_gaps`。
- `doctor --json` 能明确区分 install/runtime/host/decision/workflow。
- `verification_summary`、`verifier_dispatch`、`verification_gate_state` 保持独立结构，不互相吞并。

### 18.3 用户心智指标

- README 明确说明：
  - 什么是 hard enforcement
  - 什么是 soft workflow contract
  - doctor 证明什么
  - graph-bootstrap 产物质量如何判断
- legacy bootstrap 入口不再出现。
- 用户能通过 dry-run 理解 init/clean 的文件影响。

## 19. 推荐实施顺序

优先级从高到低：

1. Stage-0 L0/L1/L2/L3 收紧。
2. `doctor --json` 与分层健康输出。
3. asset consistency + retired token guard。
4. `init --dry-run` / `clean --dry-run`。
5. host runtime simulation。
6. workflow telemetry quality record。
7. README 和 docs contract 全面同步。

理由：

- 先修“决策输入可信度”，这是项目核心价值。
- 再修“用户心智误导”，避免 doctor/complete 被误读。
- 然后修“长期漂移”，降低维护成本。
- 最后增强宿主模拟和 telemetry，扩大可推广性。

## 20. 最终目标状态

优化完成后，`spec-first` 应达到以下状态：

1. 它仍然是轻 contract 系统，不是重编排器。
2. LLM 能拿到更可信的输入，而不是更多仪式化流程。
3. 用户能明确知道：
   - 哪些由代码 enforce
   - 哪些由 schema/test enforce
   - 哪些只是 workflow prompt contract
   - 哪些依赖宿主和人工执行
4. Stage-0 产物不再只证明“文件存在”，而能表达事实质量。
5. `doctor` 不再制造虚假的运行健康感。
6. 双宿主资产治理更稳，不容易发生 README / skill / template / runtime 漂移。
7. 项目成熟度从“团队试点”推进到“可推广的工程规范平台”。

## 21. 结论

本优化方案的核心不是加强自动化编排，而是加强 **LLM 决策输入质量**。

最重要的工程判断是：

> spec-first 不应该用强状态机替代 LLM 判断，而应该让 LLM 更容易拿到真实、稳定、可追溯、可降级的工程事实。

因此，优先投入应放在：

1. Stage-0 事实质量分级。
2. doctor 健康语义分层。
3. workflow asset 一致性治理。
4. verification evidence 账本化。
5. dry-run 与安全清理边界。

完成这些后，`spec-first` 会从“有较强工程资产的 workflow harness”进一步变成“可推广的 AI Coding 决策输入与治理平台”。
