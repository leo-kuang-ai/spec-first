# `using-spec-first` skill 优化建议

日期: 2026-06-20
目标 skill: `skills/using-spec-first`
方法: `$yao-meta-skill` + `spec-first` 角色契约
产物类型: 本地优化建议文档

## 结论

`using-spec-first` 当前质量已经较高，核心边界正确：它是 entry governor，不是 command-backed workflow；它允许轻量直答和小改动直接执行；它不把 `spec-*` workflow admission 等同于 Codex `spawn_agent` 授权；它坚持 source/runtime 边界和 public/internal entrypoint 边界。

最值得优化的不是继续增加路由规则，而是降低入口 prompt 的上下文重量、把重复使用后的质量证据变成可维护的评估面，并把治理元数据补齐到仓库现有体系中。换句话说，下一步应当是“减载 + 证据化 + 生命周期治理”，不是“更大路由表”。

优先级建议:

1. P1: 将 4,660 词的 `SKILL.md` 拆成 lean entrypoint + 按需 `references/`，保留测试钉住的核心短语与 bootstrap 子集。
2. P1: 为路由型 skill 建立 output-risk / routing-discipline 评估面，重点测“多意图冲突、自动串联诱导、internal helper 暴露诱导、dispatch 授权误解、轻量请求过度路由”。
3. P2: 把现有 `evals/examples.json` 与 `evals/routing-cases.json` 升级为更接近仓库 canonical eval fixture 的结构，或用 normalizer 明确纳入 readiness 评分。
4. P2: 为 `using-spec-first` 补生命周期治理信息：owner、review cadence、maturity、invalidation conditions、fresh-source eval cadence。
5. P3: 仅在语义规则稳定后增加轻量 deterministic validator；它只能校验 JSON shape、entrypoint 是否存在、source_refs 是否有效，不能模拟路由语义判断。

不建议做:

- 不要把 `using-spec-first` 变成中心化状态机或自动 router。
- 不要把 `$yao-meta-skill` 的 `manifest.json` / `agents/interface.yaml` 直接硬套进当前仓库，除非先有 repo-wide 采用决策。
- 不要把 eval workspace 放进 `skills/` 下；仓库会把它当作未注册 skill。
- 不要手改 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror。
- 不要新增默认 Graphify / setup / update 执行路径；entry governor 只能读取已存在事实，不能为了路由去改变状态。

## 2026-06-20 后续采纳状态

本节记录后续执行对本文建议的逐项处理，不改变原始审查证据的历史语境。

| 建议 | 状态 | 处理 |
| --- | --- | --- |
| 1. `SKILL.md` 收敛成 lean entrypoint | 部分采纳 | 先抽 `Scenario Fingerprint Routing` 到 `skills/using-spec-first/references/scenario-fingerprint-routing.md`，随后继续抽 `User Next-Step Guide Mode`、`Multi-Session Awareness`、`Codex Startup Reminder Boundary`、`Routing Red Flags` 到 references；`SKILL.md` 从原约 4,660 词降到 3,805 词。未做全量 9 文件拆分。 |
| 2. 增加 `output-risk-profile` | 已采纳 | 新增 `skills/using-spec-first/references/output-risk-profile.md`，列出 over-routing、dispatch-overreach、setup-hijack、automatic-chaining 等高风险输出失败。 |
| 3. 建立 routing-discipline output eval | 已采纳第一步 | 新增 canonical fixture `skills/using-spec-first/evals/routing-discipline-cases.json`；本轮只加结构化 cases 和 Jest normalizer 校验，未跑 provider/model with-skill vs baseline。 |
| 4. eval fixture 贴近 canonical contract | 部分采纳 | 新增 routing-discipline canonical fixture；保留 legacy `examples.json` 与 `routing-cases.json`，避免丢失现有本地字段和测试语义。 |
| 5. 补治理元数据 | 暂缓 | 未改 `skills-governance.json` schema；改用 `references/maintenance-and-fresh-source-eval.md` 记录 owner、review cadence、invalidation conditions。 |
| 6. 调整 frontmatter `description` | 暂缓 | 未运行 route-confusion holdout 前不改 trigger description，避免无证据 drift。 |
| 7. 新增 deterministic checks | 低成本采纳 | 未新增脚本；复用 `skills/spec-skill-audit/scripts/eval-fixture-normalizer.js` 在 Jest 中校验新 canonical fixture。 |
| 8. Review Studio | 暂缓 | 不引入 `reports/` 或 Review Studio surface；本轮用 focused Jest + source docs + changelog 作为证据。 |

本轮逐项判断后的剩余未优化项:

1. `Dispatch And Host Boundaries` 全文迁出: 暂缓。该段是 Codex dispatch 授权的高风险边界，当前 contract test 仍要求关键授权提醒存在于 runtime-transformed `SKILL.md`；迁出前需要先确认 runtime reference 读取链与 fresh-source 语义表现。
2. with-skill vs baseline model output eval: 暂缓。已补 8 个 canonical routing-discipline cases 和结构校验，但没有 provider/model runner 证据；不能声称输出质量已相对 baseline 提升。
3. `skills-governance.json` 生命周期 schema 扩展: 暂缓。单 skill 临时加 owner/cadence/maturity 会制造 repo-wide registry 形态漂移，需要先做全仓 schema 设计。
4. frontmatter `description` 改写: 暂缓。没有 route-confusion holdout 证明候选描述优于现状，贸然改会增加 skill discovery drift 风险。
5. legacy `examples.json` / `routing-cases.json` 全量迁移: 暂缓。它们仍承载本地字段和既有测试语义；先用新增 canonical fixture 承接新评估面。
6. Review Studio / `reports/output_quality_scorecard.md`: 暂缓。对本轮 source refactor 过重；大版本入口语义变更或发布级评审时再引入。

本轮 fresh-source eval 状态: `not_run`。原因: 当前 Codex 请求未显式授权 `subagents` / `personas` / delegated review；按 dispatch 边界不能自行启动多 persona 或 subagent eval。

## 输入证据

本次只读审视了以下 `file-backed fixture` / source:

| 类型 | `input_files` |
| --- | --- |
| 角色契约 | `docs/10-prompt/结构化项目角色契约.md` |
| 目标 skill | `skills/using-spec-first/SKILL.md` |
| 目标 eval | `skills/using-spec-first/evals/examples.json` |
| 目标 eval | `skills/using-spec-first/evals/routing-cases.json` |
| 目标 tests | `tests/unit/using-spec-first-contracts.test.js` |
| 目标 tests | `tests/unit/prompt-examples-contracts.test.js` |
| 目标 tests | `tests/unit/scenario-fingerprint-router-contracts.test.js` |
| 目标 tests | `tests/unit/spec-dispatch-boundary-contracts.test.js` |
| 质量治理 | `docs/contracts/workflows/skill-agent-quality-governance.md` |
| eval contract | `docs/contracts/workflows/eval-fixture-contract.md` |
| fresh-source eval | `docs/contracts/workflows/fresh-source-eval-checklist.md` |
| context governance | `docs/contracts/context-governance.md` |
| 既有 durable learning | `docs/solutions/workflow-issues/routing-skill-eval-methodology-2026-06-08.md` |
| governance registry | `src/cli/contracts/dual-host-governance/skills-governance.json` |
| `$yao-meta-skill` method | external skill `yao-meta-skill` (`SKILL.md`，安装于本机 agent skills 目录，非本仓 source) |
| `$yao-meta-skill` references | `skill-engineering-method.md`, `operating-modes.md`, `resource-boundaries.md`, `skill-ir-method.md`, `output-eval-method.md`, `review-studio-method.md`, `artifact-design-doctrine.md`, `governance.md`, `skillops-decision-policy.md`, `systems-thinking-doctrine.md`, `prompt-engineering-doctrine.md`, `gate-selection.md`, `authoring-discipline.md` |

原始审查限制:

- 未运行 fresh-source subagent eval；本次没有修改目标 skill source。
- 未运行 Jest；本次只新增 `think/` 本地建议文档。
- 未使用 generated runtime mirror 作为事实来源。
- 工作区已有其他未提交变更，本次建议不覆盖、不归因那些改动。

## 当前资产画像

当前 `skills/using-spec-first` 结构:

```text
skills/using-spec-first/
  SKILL.md
  evals/
    examples.json
    routing-cases.json
```

定量观察:

| 项 | 当前状态 | 判断 |
| --- | --- | --- |
| `SKILL.md` 体量 | 约 4,660 词 | 对入口 skill 偏重；超出 `$yao-meta-skill` production/library 初始 load 建议 |
| examples-as-context | 6 个 | 数量合理，覆盖 plan/doc-review/dispatch/parent workspace/lightweight |
| routing-cases | 10 个 | 数量达到当前测试上限，覆盖轻量直答、小改动、contract 改动、显式 route、dispatch fallback |
| `references/` | 无 | 主要优化机会 |
| `scripts/` | 无 | 当前合理；不要先加脚本模拟语义路由 |
| `reports/` | 无 | 可以先用 docs/validation 或外部 eval workspace，未必放进 skill source |
| governance registry | 仅 entry_surface / host_delivery | 缺 owner、review cadence、maturity 等生命周期信息 |
| contract tests | 较强 | 多处 `toContain` 钉住关键短语，后续 prose refactor 必须谨慎 |

当前优点:

- 入口边界准确：skill trigger 不等于 workflow admission。
- 轻量任务 direct outcome 规则清楚，避免 workflow-first 被误读成 brainstorm-first。
- self-work、source/runtime、dispatch、startup reminder、scenario fingerprint 等复杂边界都有明确 prose。
- 现有 tests 已覆盖多处历史易错点。
- 既有 durable learning 已定义 routing skill 的 with-skill vs baseline 评估方法。

当前不足:

- `SKILL.md` 同时承担 trigger、contract、完整 route map、dispatch policy、scenario fingerprint、multi-session、startup reminder、hard rules、red flags、evidence boundary 等职责；入口负载过高。
- eval fixture 主要是 examples/shape guard，尚未形成可重复的 with-skill vs baseline routing-discipline output eval。
- governance registry 没有表达该 skill 的实际重要性和复审节奏。
- 文案回归高度依赖字符串测试，说明关键语义没有完全抽象成更稳定的结构化 contract。
- 缺少 reviewer-facing output-risk profile；未来改动容易不知道最应该防哪类输出失败。

## `$yao-meta-skill` 模式判定

按 `$yao-meta-skill` operating modes，`using-spec-first` 不适合按 Scaffold 看待。

推荐分类: Library-lean / Governed-adjacent

理由:

- 它是全仓入口治理层，影响所有 public `spec-*` workflow 的进入方式。
- 路由错误会浪费时间，严重时会导致错误写入、错误 review admission、错误 runtime 修复路径。
- 它跨 Claude/Codex 双宿主，被 bootstrap、runtime projection、contract tests 和 governance registry 消费。
- 它不直接触碰外部服务或 secrets，因此不必立刻套完整 Governed release machinery。

治理边界映射:

| `$yao-meta-skill` 标签 | 当前证据 |
| --- | --- |
| `file-backed fixture` | `SKILL.md`、`evals/*.json`、Jest contract tests、docs/contracts |
| `input_files` | 见上方输入证据表 |
| `output contract` | 当前输出是 workflow entrypoint recommendation / guide-mode 三字段 / direct answer decision，不是文件 artifact |
| `rollback boundary` | source-first：回滚 `skills/using-spec-first/**`、bootstrap generator 或相关 tests；不要手改 runtime mirrors |
| `trust report` | `missing evidence`；当前没有独立 trust report，且暂不需要完整安全报告 |
| `reports/output_quality_scorecard.md` | `missing evidence`；路由型 output eval 可先在 docs/validation 或外部 workspace 产出 |

## `output contract`

`using-spec-first` 的输出不是文档、代码或 report，而是一个路由/执行 posture。建议显式把 output contract 写成下面四类，供 future eval 与 reviewer 使用。

| 输出类型 | 合格输出 |
| --- | --- |
| Public workflow admission | 当前 host 的一个 entrypoint + 一个具体理由，然后交给该 workflow |
| User Next-Step Guide Mode | `推荐入口` / `理由` / `下一步` 三字段，且不启动 workflow |
| Direct answer / bounded read | 明确不强行进入 workflow，必要时做窄事实读取 |
| Normal small execution | 仅用于清晰、单点、低风险改动，同时保留 CHANGELOG、窄验证、source/runtime 边界纪律 |

必须禁止的输出:

- 同时推荐多个 workflow 并自动串联。
- 把 standalone skill 写成 `spec-*` 或 `spec-*` entrypoint。
- 把 `spec-doc-review` admission 当作 Codex `spawn_agent` 授权。
- 因为 runtime evidence 缺失就无条件转 setup，覆盖用户明确的小目标。
- 为了生成 scenario fingerprint 主动运行 setup/init/clean。
- 让 bootstrap block 承担完整路由表职责。

## 核心优化建议

### 1. 把 `SKILL.md` 收敛成 lean entrypoint

当前 `SKILL.md` 太像“完整政策手册”。它作为 source-of-truth 可以详细，但作为每次触发需要读取的 skill prompt，负担偏重。

建议结构:

```text
skills/using-spec-first/
  SKILL.md
  references/
    routing-policy.md
    direct-outcomes-and-small-edits.md
    self-work-source-runtime.md
    dispatch-and-host-boundaries.md
    scenario-fingerprint-routing.md
    next-step-guide-mode.md
    startup-reminder-boundary.md
    maintenance-and-fresh-source-eval.md
    output-risk-profile.md
```

`SKILL.md` 保留:

- frontmatter `name` / `description`
- Contract Summary
- Source/runtime boundary summary
- “何时直接答 / 何时 route”的最小判断
- Routing Priority 摘要
- Route Map 的稳定入口索引
- References routing: 什么情况读取哪个 reference
- Hard Rules 的压缩版
- Exit Condition

迁出到 `references/`:

- Scenario Fingerprint Routing 全文
- Dispatch And Host Boundaries 全文
- Codex Startup Reminder Boundary 全文
- Multi-Session Awareness 全文
- Parent Workspace Direct Reads 细节
- User Next-Step Guide Mode 细节
- Routing Red Flags 表
- Artifact And Evidence Boundaries 细节

注意:

- `tests/unit/using-spec-first-contracts.test.js` 当前大量 `toContain` 检查在 `SKILL.md` 内找字符串。refactor 前需要先把 tests 迁移到“SKILL.md 或 references 中存在”的 helper，或者分批保留关键短语在 `SKILL.md`。
- 不要一次性重写全部 prose。先抽一个低风险长段，例如 Scenario Fingerprint 或 Startup Reminder，再跑 focused tests。
- 保留 `skills/using-spec-first/evals/*.json` 的引用在 `SKILL.md`，否则 `prompt-examples-contracts.test.js` 会失败。

### 2. 增加 `output-risk-profile`

建议新增 `skills/using-spec-first/references/output-risk-profile.md` 或 `docs/validation/using-spec-first/output-risk-profile.md`。

建议风险表:

| 风险 | 典型表现 | 防护 |
| --- | --- | --- |
| over-routing | 轻量问答、小范围定位也进入 workflow | direct outcome cases + guide-mode constraints |
| under-routing | prompt/workflow/contract 改动直接动手 | substantial-work examples + red flags |
| wrong host syntax | Codex 输出 `spec-*`，Claude 输出 `spec-*` | host entrypoint tests |
| dispatch overreach | workflow admission 被当作 subagent 授权 | dispatch-boundary cases |
| internal helper exposure | 推荐 `git-worktree` 等 helper 作为用户入口 | skill-entrypoint lint + routing cases |
| source/runtime violation | 修改 runtime mirror 或把 mirror 当 source | source/runtime boundary tests |
| setup hijack | setup evidence 缺失时覆盖用户明确目标 | scenario fingerprint cases |
| automatic chaining | 一步到位串联 plan -> work -> review | routing-discipline output eval |
| multi-repo unsafe write | 父目录直接写子仓库未知目标 | parent workspace cases |
| false evidence | 声称运行了 init/test/eval 但没有证据 | verification/fresh-source eval closeout fields |

这个 profile 的价值是让 future reviewer 先看“最可能坏在哪里”，而不是继续读完整 prose 猜风险。

### 3. 建立 routing-discipline output eval

既有 durable learning 已指出：清晰意图用例对强模型区分度低，真正有价值的是“多意图冲突 / 形态纪律”难例。

建议新增一组 output eval，关注 with-skill vs baseline 差异。

baseline 设计:

```text
baseline = 只给 public workflow 菜单，不给 routing policy
with-skill = 给当前磁盘 `skills/using-spec-first/SKILL.md` + 必要 references
```

推荐 case 类别:

| 类别 | 示例意图 | 期待 |
| --- | --- | --- |
| 自动串联诱导 | “一步到位，先计划再实现再 review” | 只选当前最合适 workflow，不自动串联 |
| 关键词诱导 | “debug 一下这个 PRD 是否能实现” | 按 artifact/意图，不按关键词 |
| standalone skill 混淆 | “用 spec-write-tasks workflow” | 说明 standalone，不造 `spec-write-tasks` |
| internal helper 暴露 | “用 git-worktree 作为入口” | 不把 helper 暴露为 public route |
| Codex dispatch 授权 | “spec-doc-review docs/x.md” | route 到 workflow，但 fallback: `dispatch_authorization_missing` |
| report-only 禁用 | “review，no agents” | 不 dispatch |
| parent workspace 写入 | “帮我改这个项目”但 cwd 是父目录 | 写前要求 `target_repo` |
| setup evidence 缺失 | runtime facts stale，但用户只问轻量 docs | 继续按 intent，不强制 setup |

建议最小实现:

- 先把 cases 放在 `evals/routing-discipline-cases.json`，使用仓库 `spec-first.workflow-eval-fixtures.v1` canonical shape 或用 normalizer 明确支持。
- 每类至少 1 个 public smoke case，另保留 holdout 不入常规 prompt。
- 不把 LLM judge 写成 CI hard gate；CI 只校验 fixture 结构、source_refs、coverage_tags。
- 真正 with-skill vs baseline 可以作为 release / PR review evidence，写入 `docs/validation/using-spec-first/YYYY-MM-DD-routing-output-eval.md`。

### 4. 让 eval fixture 更贴近仓库 canonical contract

当前 `examples.json` 是 `prompt-examples/v1`，`routing-cases.json` 是 `using-spec-first-routing-cases/v1`。这能被现有 tests 识别，但和 `docs/contracts/workflows/eval-fixture-contract.md` 的 canonical shape 不完全统一。

建议两种路径二选一:

1. 保持现有文件，更新 `skills/spec-skill-audit/scripts/eval-fixture-normalizer.js` 的解释文档或测试，确保 `routing-cases.json` 的 local fields 会被稳定归一。
2. 新增 canonical 文件，如 `evals/workflow-routing-fixtures.json`，逐步迁移后再考虑是否保留 legacy 文件。

不要做:

- 不要把 examples 伪装成 semantic readiness gate。
- 不要把 `routing-cases.json` 写成确定性路由器输入输出表。
- 不要为了追求统一 schema 删除现有高价值 local fields，例如 `dispatch_decision`、`fallback_reason`、`artifact_expected`。

### 5. 补治理元数据，但先遵守本仓库现有 registry

`$yao-meta-skill` 默认建议 `manifest.json`、`agents/interface.yaml`。当前 `spec-first` skill 体系没有这类文件；直接新增会制造第二治理源。

建议优先在现有 governance registry 或 docs contract 中扩展:

```json
{
  "skill_name": "using-spec-first",
  "entry_surface": "standalone_skill",
  "host_scope": "dual_host",
  "maturity_tier": "library",
  "owner": "spec-first maintainers",
  "review_cadence": "per-release",
  "risk_surface": ["workflow_admission", "source_runtime_boundary", "dispatch_boundary"],
  "fresh_source_eval_required": true
}
```

前提:

- 先设计 repo-wide schema extension，不只给一个 skill 临时加字段。
- downstream tests 更新 `skills-governance.json` schema expectations。
- `CHANGELOG.md` 必须记录，因为这是 source/contract 变化。

如果暂不扩展 registry，至少可以在 `references/maintenance-and-fresh-source-eval.md` 写明:

- owner: `spec-first maintainers`
- review cadence: 每次修改入口路由、host bootstrap、dispatch 边界、source/runtime policy、route map 时复审
- invalidation condition: 新增/退役 public workflow、新宿主入口语法变化、Codex dispatch contract 变化、bootstrap generation 变化、scenario fingerprint schema 变化

### 6. 将 `description` 微调为“触发 + 排除”并测试路由质量

当前 frontmatter description 已较清楚，但可以更明确地包含 direct outcome 排除，降低“任何 spec-first 仓库动作都触发”的误读。

候选描述:

```yaml
description: "Use in spec-first repos to decide whether a substantial request should enter one public spec-first workflow, or to answer which workflow/command to run next. Applies to risky edits, debug/review/plan/setup/update/optimization, architecture/prompt/workflow/contract/governance decisions, and durable knowledge changes; does not replace lightweight direct answers, bounded reads, or clearly scoped low-risk small edits."
```

风险:

- 描述变长会影响 skill discovery 的可读性。
- 如果宿主只用 description 做 route matching，过多 exclusions 可能降低召回。

建议:

- 不把这个作为第一改动。
- 先用 route confusion holdout 测现有 description 与候选 description。
- 如果没有明显改善，不改。既有 durable learning 已提醒：无增量的 prose PR 会引入 drift 风险。

### 7. 保持 scripts/tools 与 LLM 判断边界

可以新增 deterministic checks，但只做确定性事实:

可脚本化:

- `evals/*.json` schema / required fields / duplicate ids
- `expected_entrypoint` 是否存在于 route map 或 governance registry
- `source_refs[]` 是否 repo-relative 且不指向 generated mirrors / historical docs
- `coverage_tags[]` 是否来自允许集合
- `SKILL.md` 是否引用 eval files 与 references index
- bootstrap block 是否仍是核心子集而不是完整 route table

不可脚本化:

- 用户真实意图属于哪个 workflow
- 某个 review finding 是否成立
- HOW 是否足够 settled
- 是否需要 human owner
- route priority 在复杂对话中的最终判断

如果新增脚本，建议放在现有 tests/helpers 或 `skills/spec-skill-audit/scripts/` 的 normalizer 体系中，而不是 `skills/using-spec-first/scripts/`。原因是 `using-spec-first` 自身不该执行脚本；它是入口治理 prose + eval source。

### 8. Review Studio 只作为 release-facing 选项

`$yao-meta-skill` 的 Review Studio 对 production/library/governed 包很有价值，但对当前 `spec-first` 仓库，完整引入 `reports/review-studio.*` 可能过重。

建议:

- 普通小改动: 不跑 Review Studio，只跑 focused Jest + fresh-source eval status。
- 入口语义大改: 生成一次 `docs/validation/using-spec-first/YYYY-MM-DD-review.md`，包含 gate summary。
- 对外发布或大版本调整: 再考虑 `reports/output_quality_scorecard.md`、blind A/B pack、review waiver ledger。

Review Studio gate 可压缩为:

| Gate | 当前最小证据 |
| --- | --- |
| Intent Canvas | Contract Summary + route map |
| Trigger Lab | `examples.json` + route confusion holdout |
| Output Lab | with-skill vs baseline routing-discipline eval |
| Context Budget | `wc -w SKILL.md` + references split |
| Runtime Matrix | Claude/Codex transform tests |
| Trust Report | `missing evidence` unless scripts/permissions added |
| Registry Audit | `skills-governance.json` entry + lint |
| Release Notes | `CHANGELOG.md` compact entry |

## 建议落地顺序

### Phase 0: 不改 source 的准备

目标: 给后续改动建立客观基线。

行动:

1. 记录当前 `SKILL.md` word count、references count、eval case count。
2. 从 `routing-skill-eval-methodology-2026-06-08.md` 抽出当前 baseline 评估模板。
3. 在 `think/` 或仓库外准备候选 refactor outline，不写 source。

验证:

```bash
wc -w skills/using-spec-first/SKILL.md skills/using-spec-first/evals/*.json
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/prompt-examples-contracts.test.js --runInBand
```

### Phase 1: 先抽一个低风险 reference

目标: 验证 “lean SKILL.md + references” 不破坏入口语义和 tests。

候选:

- 抽 `Scenario Fingerprint Routing` 到 `references/scenario-fingerprint-routing.md`。
- `SKILL.md` 保留 5-8 行 summary + “when relevant, read reference”。
- 更新 tests 使其检查 source package，而不是只在 `SKILL.md` 找全文。

验证:

```bash
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/scenario-fingerprint-router-contracts.test.js --runInBand
npx jest tests/unit/prompt-examples-contracts.test.js --runInBand
git diff --check
```

### Phase 2: 添加 output-risk-profile

目标: 让 future modifications 有固定风险镜头。

行动:

- 新增 `references/output-risk-profile.md`。
- `SKILL.md` 在 “Examples As Context” 附近引用它。
- tests 只检查存在和被引用，不检查全文。

验证:

```bash
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/prompt-examples-contracts.test.js --runInBand
npm run lint:skill-entrypoints
```

### Phase 3: 增加 routing-discipline eval

目标: 证明改动提升的是 discipline 稳定性，而不是菜单认知。

行动:

- 新增 `evals/routing-discipline-cases.json`。
- 覆盖多意图冲突、串联诱导、internal helper 暴露、dispatch 授权、setup hijack。
- 用 canonical fixture 或 normalizer 兼容。

验证:

```bash
npm run test:eval-fixtures
npx jest tests/unit/prompt-examples-contracts.test.js --runInBand
```

如果运行 with-skill vs baseline:

```bash
# workspace 必须在 skills/ 外部，例如 /tmp
python3 -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name using-spec-first
```

### Phase 4: 治理元数据扩展

目标: 让该入口治理 skill 的生命周期可见。

行动:

- 先设计 `skills-governance.json` schema extension。
- 给 `using-spec-first` 补 owner、review cadence、maturity、risk_surface。
- 更新 dual-host governance tests。

验证:

```bash
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/lint-skill-entrypoints.test.js --runInBand
npm run lint:skill-entrypoints
```

### Phase 5: 大 refactor 或入口语义变化

目标: 将长文档系统性拆分，同时守住行为。

必须做:

- 按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 记录 fresh-source eval status。
- 如 Codex 未显式授权 subagents/personas/delegated review，记录 `fresh_source_eval: not_run` 与原因。
- 更新 `CHANGELOG.md`。
- 不手改 runtime mirrors；需要刷新时再用 `spec-first init` 并选择目标 host。

验证建议:

```bash
npm run typecheck
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/prompt-examples-contracts.test.js tests/unit/instruction-bootstrap.test.js tests/unit/scenario-fingerprint-router-contracts.test.js tests/unit/spec-dispatch-boundary-contracts.test.js --runInBand
npm run lint:skill-entrypoints
git diff --check
```

若 bootstrap / runtime projection 被改:

```bash
npx jest tests/unit/init-dry-run.test.js tests/unit/codex-session-start-hook.test.js tests/unit/claude-settings.test.js --runInBand
npm run test:smoke
```

## 建议的 reviewer checklist

每次改 `using-spec-first` 前后，reviewer 至少确认:

- 是否仍保留 `entry governor, not workflow` 边界。
- 是否仍允许 lightweight direct answer 和 clearly scoped low-risk small edits。
- 是否仍禁止 internal helper 作为 public entrypoint。
- 是否仍区分 skill trigger 与 public workflow admission。
- 是否仍区分 public workflow admission 与 Codex subagent dispatch authorization。
- 是否仍不自动串联多个 workflow。
- 是否仍不为 scenario fingerprint 主动运行 setup/init/clean。
- 是否仍不把 generated runtime mirrors 当 source。
- 是否仍按 Claude `spec-*`、Codex `spec-*` 输出当前 host entrypoint。
- 是否对 source 改动更新 `CHANGELOG.md`。
- 是否记录 fresh-source eval status 或 not-run reason。

## 反模式清单

这些改动即使看起来能“增强治理”，也应拒绝或降级:

1. 把 route map 改成脚本输出的最终裁决。
2. 给每个 intent 建 deterministic state machine。
3. 在 bootstrap block 复制完整 `SKILL.md` route table。
4. 让 `using-spec-first` 生成 plan、task、review 或 setup artifact。
5. 新增隐藏 `spec-next`、`spec-guide` 或 `spec-using-spec-first`。
6. 在没有 source validation 的情况下运行 `spec-first init` 并把 runtime mirror 当完成证据。
7. 为了满足 `$yao-meta-skill` 形态而增加空 `reports/`、`scripts/`、`manifest.json`。
8. 用一次 inline 自评声称 routing skill 质量提高。
9. 只用清晰关键词用例证明路由效果。
10. 把 `missing evidence` 写成“已通过”。

## 是否需要改 `CHANGELOG.md`

本次只新增 `think/` 本地建议文档，不修改项目 source-of-truth、skill、agent、template、CLI、docs contract 或 tests，因此本次不建议更新 `CHANGELOG.md`。

如果后续采纳本文任一 source 改动，则必须更新 `CHANGELOG.md`，尤其是:

- `skills/using-spec-first/SKILL.md`
- `skills/using-spec-first/references/**`
- `skills/using-spec-first/evals/**`
- `src/cli/contracts/dual-host-governance/**`
- `tests/unit/**`
- `src/cli/instruction-bootstrap.js`
- `CLAUDE.md` / `AGENTS.md` managed source slice

## 最小推荐下一步

最小可维护落地顺序:

1. 先不要改路由语义。
2. 新增 `references/output-risk-profile.md`，把最重要的失败模式显式化。
3. 把 `Scenario Fingerprint Routing` 抽到 reference，验证 tests 可承受 “SKILL.md lean + reference full policy”。
4. 增加 routing-discipline eval cases，优先覆盖多意图冲突和自动串联诱导。
5. 只有当 eval 或 reviewer 证明 description 有实际误触发/漏触发时，再改 frontmatter description。

这条路径符合 `Light contract + Explicit boundaries + Scripts prepare, LLM decides`：source 保持轻合同，tests/scripts 只守结构和证据，最终路由判断仍归 LLM。
