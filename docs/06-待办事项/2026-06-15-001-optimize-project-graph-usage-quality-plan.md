# project-graph 使用质量层最终优化方案

- **日期**: 2026-06-15
- **类型**: 治理优化 / 中型
- **状态**: 已完成
- **审查结论**: 方案方向成立,但只做使用质量层收口,不重做协议层或 provider 层
- **source_refs**:
  - `docs/contracts/project-graph-consumption.md`
  - `docs/contracts/knowledge/knowledge-harness.md`
  - `docs/contracts/workflows/spec-id-traceability.md`
  - `docs/contracts/workflows/review-closure-traceability.md`
  - `docs/10-prompt/结构化项目角色契约.md`
  - `docs/12-bug分析/2026-06-10-spec-first-graphify-collaboration-analysis.md`
  - `skills/spec-mcp-setup/scripts/install-helpers.sh`
  - `skills/spec-mcp-setup/scripts/install-helpers.ps1`
  - `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs`

---

## 结论

值得做,但最终方案必须收窄为:不接管 Graphify,不改 provider 能力,不新增 project-graph 协议,不重做 workflow 覆盖。只优化 spec-first 如何消费候选能力:

1. P0 修正 `## graphify` host 指令里的硬路由措辞。
2. P1 做一次性 relay 诊断,找出偏航发生在 project-graph、code-graph/rg 还是 source confirmation。
3. P2 只按诊断结果补 anchor,主理由是 traceability / discoverability,不是 Graphify 召回玄学。
4. P3 不做常驻 benchmark suite,只留下单独评估入口。

---

## 审查裁决

### 保留

- 三层接力模型: `project-graph` 给候选范围,`code-graph`/`rg` 缩小代码面,source/tests/logs/docs 确认事实。
- provider 不接管原则: Graphify 和 CodeGraph 都是 `provider_untrusted` advisory navigation,不是结论证据。
- 80/20 落地:先修误导性指令和一次性诊断,不引入新平台、新 schema 或常驻回归套件。

### 否决

- 否决新增第二份 project-graph 协议。`docs/contracts/project-graph-consumption.md` 已是唯一消费合同。
- 否决重新给 7 个 workflow 补 coverage。`spec-work`、`spec-prd`、`spec-brainstorm`、`spec-ideate`、`spec-plan`、`spec-debug`、`spec-code-review` 已引用合同。
- 否决把 `query` 命中率当主指标。`query` 是弱 orientation;Graphify 的价值标准是是否缩小下一步 read,不是是否直接回答。
- 否决常驻 CI benchmark。provider 召回正确性很难用确定性脚本判定,用 LLM 自评会违反角色契约中"不要伪造确定性校验"的边界。

### 修正

- `CLAUDE.md` / `AGENTS.md` 不是 generated runtime mirror;它们是 checked-in host entry docs / source slices。P0 不能写成"改完跑 `spec-first init` 重生即可"——核查 `src/cli/` 后确认 `init` 链路不处理 `## graphify` 段,该段由 `install-helpers.{sh,ps1}` normalize 路径(经 `spec-first update` / `spec-mcp-setup`)维护。
- `docs/solutions/**` 的 `source_refs` / `invalidation_condition` 归 `docs/contracts/knowledge/knowledge-harness.md` 和 `skills/spec-compound/references/schema.yaml`,不归 `spec-id-traceability.md`。
- `docs/solutions/` 不是 graph/relay 沉淀为零。已有 `docs/solutions/tooling-decisions/graphify-query-explain-reliability-2026-06-12.md`;P1 只有发现新的可复用模式时才新增或更新 solution。

---

## 事实基线

1. **协议层已完备。** `project-graph-consumption.v1` 已定义 Capability Vocabulary、Readiness Gate、Trust Tiers、Relay Chain、Recording Rules。它明确说 relay 是 trust-elevation direction,不是 call-priority order。
2. **当前真实缺口是使用质量。** repo 根 `## graphify` 段仍有 `Use Graphify first only...` 文案,容易被读成硬路由,和合同中"reading source first is always valid"存在张力。
3. **setup 侧已有机械事实。** Graphify readiness 已包含 `query_verified`、`readiness_status`、lifecycle bits 和 renderer next action。本方案不新增 readiness lifecycle。
4. **`query` 的局限已被 runtime 文案承认。** `provider-readiness-renderer.cjs` 已提示 `query` 是 unscored BFS / weak orientation,code navigation 优先 `explain` / `path`。
5. **本次核查也暴露召回偏弱。** 对本题运行 Graphify query 主要召回了 `AGENTS.md` / `CLAUDE.md` / boundary 节点,没有直接召回目标待办文档和相关合同。这只能作为 `provider_untrusted` 偏航样例,最终结论仍来自 direct source reads。此结论与既有 `docs/solutions/tooling-decisions/graphify-query-explain-reliability-2026-06-12.md` 一致,P1 预期确认既有 solution 而非推翻它。
6. **`## graphify` 段不经 `spec-first init` 刷新。** 核查 `src/cli/`,`init` 链路无任何 `normalize_graphify` / `## graphify` 处理;该段只由 `skills/spec-mcp-setup/scripts/install-helpers.{sh,ps1}` 的 normalize 路径维护,经 `spec-first update` / `spec-mcp-setup` 触发。这把 P0 的 refresh path 从悬念变为定论(实施时仍建议 grep 复核一次)。

---

## Goals

- 让 host 指令与 `project-graph-consumption.md` 的 trust-elevation 口径一致,消除 "first" 的硬调用顺序读感。
- 用一次性诊断产物回答"哪一层偏航":Graphify 候选、CodeGraph/rg 缩面、还是 source confirmation。
- 只在 P1 证明有缺口时补 anchor,且 anchor 必须有 traceability / discoverability 的独立收益。
- 让 closeout / plan / solution 消费链能清楚区分 `provider_untrusted` 和 confirmed direct evidence。

## Non-Goals

- 不改 Graphify provider、不 fork、不包装成 spec-first 自有 provider。
- 不让 Graphify / CodeGraph 输出成为 confirmed evidence。
- 不新增 graph-specific evidence schema。
- 不把 workflow 路由写成固定状态图或硬优先级表。
- 不把一次性诊断脚手架常驻到 CI。
- 不为召回率人工堆关键词、堆 alias 或批量污染文档 prose。

---

## 边界

| 维度 | 最终边界 |
| --- | --- |
| Project-graph 消费合同 | `docs/contracts/project-graph-consumption.md` 是唯一真相源;本方案默认不改,除非发现合同自身措辞不清 |
| Graphify host 指令模板 | `skills/spec-mcp-setup/scripts/install-helpers.sh` 与 `install-helpers.ps1` 中的 render / normalize 逻辑是 P0 主要 source |
| Checked-in host docs | `CLAUDE.md` / `AGENTS.md` 是 source entry docs / dogfood surface,不是 `.claude/` / `.codex/` runtime mirror;其 `## graphify` 段由 install-helpers normalize 路径维护,不经 `spec-first init` 刷新 |
| Generated runtime mirrors | `.claude/`、`.codex/`、`.agents/skills/` 不手改 |
| Provider readiness | `provider-readiness-renderer.cjs` 当前只作为已存在事实和提示来源;P0/P1 默认不改 readiness status 计算 |
| Script-owned facts | CLI 可产出 installed/configured/artifact/query_verified/readiness_status/exit code/log path 等事实 |
| LLM-owned judgment | 是否查询 provider、采用哪个候选、是否回源确认、偏航原因分类 |
| CodeGraph 协作 | CodeGraph 用于 tactic-level call graph / symbol / source snippet / impact candidates;结论仍需 source/test/log/doc 确认 |
| Knowledge anchor | `docs/solutions/**` structured recall 属 Knowledge Harness 和 `spec-compound` schema |
| Review anchor | `referenced_reviews[].addresses_findings` 属 review-closure traceability |

---

## 最终优化方案

### P0 - 修正 Graphify host 指令措辞

**目标**:把硬路由读感改成 exploration-tier orientation。

建议把:

```md
Use Graphify first only for architecture relationships...
```

改成类似:

```md
Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `graphify-out/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid.
```

保留并强化这些点:

- simple factual Q&A、single-document edit、already-scoped reads 仍直接 source / `rg`。
- `query` 只是 broad orientation;当已有概念或关系名时,优先考虑 `explain` / `path`。
- 输出仍是 candidate subgraph,不是 confirmed evidence。

实施落点:

- `skills/spec-mcp-setup/scripts/install-helpers.sh`
- `skills/spec-mcp-setup/scripts/install-helpers.ps1`
- `CLAUDE.md` / `AGENTS.md` 的 checked-in `## graphify` 段,经 install-helpers normalize 路径同步

测试落点:

- `tests/unit/project-graph-consumption-contracts.test.js`:pin 住 relay 不是 call priority、source-first valid。
- `tests/unit/mcp-setup.sh`:pin Bash rendered section 不再含旧句。
- `tests/unit/mcp-setup-powershell-contracts.test.js`:pin PowerShell rendered section 不再含旧句。
- 如现有断言读取 checked-in host docs,同步改为断言 absence of `Use Graphify first only` 与 presence of `exploration-tier` / `reading source first is always valid`。

注意:`spec-first init` 不刷新 `## graphify` 段(已核查 `src/cli/`,见事实基线第 6 条)。该段由 `install-helpers.{sh,ps1}` 的 normalize 路径维护,经 `spec-first update` / `spec-mcp-setup` 触发。实施者应改 `.sh` / `.ps1` 模板,用 setup helper / normalize path 的 focused 测试证明输出正确,再按 source/runtime 边界同步 checked-in dogfood docs;落地前 grep 复核 init 链路确无 graphify 处理。

### P1 - 一次性 relay diagnostic artifact

**目标**:回答"Graphify/codegraph/rg/source 接力哪里失真",不是建立长期评分系统。

建议产物:

```text
docs/validation/project-graph/2026-06-15-relay-diagnostic.md   # 新建目录,P1 执行时 mkdir
```

样例规模:12-20 条即可,覆盖三类:

- docs/plans / docs/06-待办事项 召回:未完成 plan、verification closeout、review closure。
- 架构定位:provider readiness、source/runtime boundary、project-graph consumption。
- 代码影响面:verification-run-summary、spec-work-run-artifact、init i18n、Graphify instruction rendering。

每条记录最小字段:

- `case_id`
- `question`
- `provider_readiness_snapshot`:只记录必要状态,不复制大 artifact
- `project_graph_attempt`:命令形态和候选摘要,标 `provider_untrusted`
- `code_graph_or_rg_narrowing`:候选是否缩面
- `confirmed_evidence`:source/tests/logs/docs 路径
- `outcome`:helpful / noisy / miss / unavailable / stale
- `deviation_stage`:project-graph / code-graph / rg / source-confirmation / none
- `anchor_candidate`:是否暴露出可补 anchor 的文档字段或术语
- `limitations`

判定方式:

- 人工语义判断,但必须有 source/test/doc 确认路径。
- 不使用 LLM 自评分当 gate。
- 不要求 Graphify 直接命中最终文件;只判断它是否显著缩小下一步 search/read。

沉淀规则:

- 诊断 artifact 默认留在 `docs/validation/project-graph/`。
- 若发现新的可复用操作模式,优先更新既有 `docs/solutions/tooling-decisions/graphify-query-explain-reliability-2026-06-12.md`;只有模式确实不同才新增 solution。
- 该既有 solution 当前是 `legacy_unstructured_advisory`(缺结构化字段,见 `knowledge-harness.md`)。若 P1 确认其结论,最自然的产出是给它回填 `domain` / `pattern` / `invalidation_condition` / `source_refs`——同时满足 P1 沉淀与 Knowledge Harness 的 backfill 要求。
- 新增或更新 solution 时遵守 Knowledge Harness:必须有 `source_refs` 和 `invalidation_condition`,并说明 recall 只是 advisory candidate。

### P2 - 按诊断结果补 anchor

**目标**:提升 traceability / discoverability,Graphify 召回改善只是附带收益。

触发条件:只有 P1 明确指出某类 artifact 因缺少稳定 anchor 反复 miss/noisy,才做。

可补方向:

- Plan / task chain:`spec_id`、`origin`、`status`、`superseded_by` 等归 `spec-id-traceability.md` 和 plan taxonomy。
- Review closure:review/audit origin plan 必须带 `referenced_reviews[].addresses_findings` 或 `deferred_findings`,归 `review-closure-traceability.md`。
- Solution recall:`source_refs`、`invalidation_condition`、`domain`、`pattern`、`rejected_alternatives`、`applicable_versions`,归 Knowledge Harness 和 `spec-compound` schema。
- Host instruction anchor:只补能减少误路由的短句,不堆 Graphify 专用关键词。

优先级:

1. 先补生成/写作指引。
2. 再补现有 validator 中已经有 deterministic 边界的校验。
3. 最后才考虑新增校验,且只校验可确定事实,不校验"召回是否变好"。

### P3 - 不做常驻 benchmark suite

P1 完成后只写一条结论注记:

- 若偏航是偶发、样例少、provider 行为不稳定:不做常驻评测。
- 若偏航高频且有清晰人工 golden:另开独立 opt-in 方案评估,不进入核心路径。
- 不默认复用 `docs/contracts/quality-gates/ai-dev-benchmark-fixture.schema.json`。该 schema 面向 workflow 端到端 fixture;provider 召回质量大概率是 misfit,除非后续评审证明字段语义真的匹配。

---

## 审查方案

### P0 审查

- 检查 `.sh` / `.ps1` rendered section 是否语义一致。
- 检查旧硬路由句完全消失。
- 检查新句同时表达 `exploration-tier`、`reading source first is always valid`、`provider_untrusted`。
- 检查 `CLAUDE.md` / `AGENTS.md` 是否只同步 checked-in source surface,没有手改 generated runtime mirrors。

### P1 审查

- 每个 case 必须有 confirmed source/test/doc path,否则只能记为 limitation。
- Graphify / CodeGraph 候选必须标为 advisory。
- 偏航分类必须指出阶段,不能只写"召回不好"。
- 诊断结论只能产出 anchor 修正清单或 no-action 结论,不能直接变成常驻 gate。

### P2 审查

- 每个 anchor 改动必须能说明所属合同:Spec ID、Review Closure、Knowledge Harness 或 host instruction。
- 不得新增第二真相源。
- 不得为了 Graphify embedding 人工污染正文。
- 如果新增 validator,必须只验证 deterministic 字段存在/格式,不验证语义覆盖完整性。

---

## 最小落地顺序

1. **P0 先做。** 这是低成本且已由合同直接证明的误导性措辞修正。
2. **P1 再做。** 用一次性诊断确认真实偏航点,并形成 anchor 修正清单。
3. **P2 条件执行。** 只处理 P1 证明的 anchor 缺口,每项绑定现有合同。
4. **P3 只留决策。** 默认不做常驻 benchmark;若 P1 反证,另开独立方案。

---

## 风险与反模式

- **重复造协议**:任何新建 `project-graph-*` 消费合同的动作都应停止,先改现有合同。
- **误用 `spec-first init`**:`init` 不刷新 Graphify 段(已核查 `src/cli/`);修复落点是 `install-helpers.{sh,ps1}` 的 normalize 路径,经 `spec-first update` / `spec-mcp-setup` 生效。
- **手改 runtime mirror**:`.claude/`、`.codex/`、`.agents/skills/` 不作为修复落点。
- **常驻诊断腐烂**:一次性诊断脚手架不得进入 CI。
- **provider 输出升格**:Graphify / CodeGraph 候选不得直接进入 finding/root-cause/merge-ready 结论。
- **anchor 污染正文**:不能为了搜索召回把文档写成关键词堆。

---

## 成功标准

- repo 内只有一份 project-graph 消费合同。
- `## graphify` 指令不再暗示 Graphify 必须 first。
- P1 artifact 能说明具体偏航阶段,而不是泛泛抱怨召回差。
- P2 anchor 改动即使完全不提升 Graphify 召回,也能凭 traceability / discoverability 独立成立。
- closeout / review / plan 中能区分 `provider_untrusted` 与 direct confirmed evidence。

---

## 验证状态

本方案更新前已做 direct source 核查:

- 读取 `docs/contracts/project-graph-consumption.md`,确认 Relay Chain / Trust Tiers / Recording Rules 已覆盖三层接力。
- 读取 Knowledge Harness、Spec ID Traceability、Review Closure Traceability,校正 P2 anchor ownership。
- 读取 `install-helpers.sh` / `install-helpers.ps1`,确认旧硬路由句存在于 Graphify instruction render/normalize surface。
- 读取 `provider-readiness-renderer.cjs`,确认 `query` weak orientation 文案已存在。
- 核查 `src/cli/`,确认 `spec-first init` 链路不处理 `## graphify` 段,refresh path 锁定为 install-helpers normalize。
- 核对 `knowledge-harness.md` 与 `spec-compound/references/schema.yaml`,确认 P2 字段归属与既有 06-12 solution 的 `legacy_unstructured_advisory` 状态。
- 运行 Graphify query 作为 advisory orientation,结果主要召回 host instruction / boundary 节点,未作为结论证据。

未执行实现测试,因为本文档是优化方案审查与更新,不是 P0-P2 的 implementation run。

## Completion Evidence

- **完成时间**: 2026-06-15 01:42:15
- **实现范围**: P0 已修正 `CLAUDE.md` / `AGENTS.md` 与 `skills/spec-mcp-setup/scripts/install-helpers.{sh,ps1}` 的 Graphify host 指令措辞；P1 已新增 `docs/validation/project-graph/2026-06-15-relay-diagnostic.md`；P2 已按诊断结果回填既有 Graphify solution 的 structured recall anchor；P3 明确不做常驻 benchmark suite。
- **验证**: `npm run typecheck`、`npm run test:mcp-setup`、focused Jest、`npm run test:smoke`、`npm run test:integration`、`git diff --check` 均通过；`npm run test:unit` 已尝试，剩余失败集中在 init 输出本地化断言，属当前分支既有非本计划触达面；结构化 closeout 已写入 `.spec-first/workflows/spec-work/spec-first/2026-06-15-project-graph-usage-quality/run.json`。
- **Review**: `spec-code-review` 因 Codex 未显式授权 reviewer subagents/personas，按 single-agent report-only fallback 做只读 diff/source review；发现并修正 P1 诊断文档中的本机绝对路径固化问题，修后无本计划阻断 findings。
- **Generated runtime**: 未手改 `.claude/`、`.codex/` 或 `.agents/skills/` runtime mirrors；Graphify 段刷新路径仍是 `install-helpers.{sh,ps1}` normalize。
