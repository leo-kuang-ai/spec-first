---
doc_role: review-report
authority: review-evidence
status: active-artifact
lifecycle: active-artifact
review_date: 2026-06-28
review_method: 10轮维度审查 + 并行只读 agent 取证 + 源码直读 + 脚本/测试验证
relates_to:
  - docs/plans/spec-first-refactor-plan.md
note: 本文是当前 review artifact；Round 原文保留取证时点，汇总区包含本次 closeout 状态。
---

# spec-first Skill 体系健壮性/稳定性/质量深度审查（10 轮）

- 审查日期：2026-06-28
- 审查者：Spec-First Evolution Architect（本会话）
- 审查范围：`skills/` 全部 37 个 skill 的工作流流程、节点 handoff、脚本健壮性、schema/contract/eval 纪律、source/runtime 边界、skill prose 质量、失败模式与降级、测试覆盖、跨 skill 一致性、知识沉淀闭环
- 审查方法：每轮聚焦一个维度，并行只读 agent 取证 + 源码直读 + 脚本/测试验证，逐轮追加本文件，最后汇总为完整优化建议报告
- 基线：`docs/10-prompt/结构化项目角色契约.md`、`CLAUDE.md`、`skills/using-spec-first/SKILL.md`

> 本文件按 10 轮追加；每轮含「取证范围 / 证据 / 发现 / 风险 / 优化点」。最终「汇总优化建议报告」附于末尾。

---

## Round 1：入口路由治理审查

### 取证范围
`skills/using-spec-first/SKILL.md`、`references/{routing-red-flags,scope-guards,dispatch-boundaries}.md`、`evals/{routing-cases,routing-discipline-cases,examples}.json`、`CLAUDE.md`/`AGENTS.md` bootstrap block、相关 contract 测试。

### 证据与发现

**A. 红旗/边界 prose 的 stale 与漏洞**
- `references/routing-red-flags.md` 红旗 helper 列表存在 stale/反转 skill 名（如 `bug-report` vs 真实 `report-bug`；`git-worktree` 标注 "internal-only" 但其 `skills/git-worktree/SKILL.md` 存在且 harness 列为可用 skill——内部/公开边界自相矛盾，留待 Round 9 复核）。
- "sensitive surfaces" 在红旗中未定义，是最大的合理化漏洞——LLM 可把任意改动判为"非 sensitive"绕过路由。
- `update`/`setup` 在红旗中被当作 route target，但 `update` 是终端命令 `spec-first update`，非 `/spec:*` 入口；命名混淆会让 LLM 误造入口。
- `SKILL.md` 内联抄写了 dispatch-admission 与 parent-workspace 文本，而对应 `references/*.md` 声称是唯一细节落点——false indirection，任一处改文另一处漂移且无测试守护。
- `SKILL.md:219` 的 Hard Rules 摘要无任何 contract test 守护。

**B. 路由 eval 覆盖稀疏（结构性 output-eval，非 runtime router）**
- 17 行 Route Map 中约 10 行零 fixture 覆盖：`ideate/brainstorm/optimize/polish-beta/compound/compound-refresh/release-notes/slack-research/sessions/app-consistency-audit/mcp-setup`。
- Routing Priority #2（safety/repair）与 #8（knowledge）整段未被 fixture 触达。
- 未覆盖的关键分支：跨宿主显式路由归一化（仅 prose-pinned `using-spec-first-contracts.test.js:140-141`）、multi-session `active_count>=2` 告知、scenario-fingerprint 分支、parent-workspace 只读 bounded reads、subagent non-reroute、`using-spec-first` 自身被当作 workflow 命名。
- `routing-cases.json` 缺顶层 `description`（隔离打开时易被误读为 state machine）；`source_refs` 缺 `dispatch-boundaries.md` 与 `spec-doc-review/SKILL.md`（dispatch/fallback case 的真实 authority）。
- `tests/unit/prompt-examples-contracts.test.js:107` 将 `cases.length <= 14` 设为硬上限——当前恰为 14，补 case 即静默破测；应先放宽至 breathing margin（如 `<= 24`）。

**C. Bootstrap block 忠实性：生成器有守、仓库盘面无守**
- 生成器侧守卫健全：`instruction-bootstrap.test.js` 限制行数 `<26/28`、`blockIds.size < skillIds.size`、`CURATED_CORE ⊆ block`、`sessions`/`release-notes` 显式缺席、双宿主前缀参数化无泄漏。
- 仓库盘面缺口（高杠杆）：
  1. `slack-research/skill-audit/app-consistency-audit/polish-beta` 四个被裁剪项**无缺席断言**——accretion 边界只守了一半，bootstrap 可静默纳入任一项仍过测。
  2. `CURATED_CORE` 在测试中硬编码，未从 `skills-governance.json` 派生；SKILL 新增高频入口时无人提示 bootstrap 漏纳。
  3. **无 repo-state faithfulness 测试**：`inspectInstructionBootstrap` helper 已存在，但仅对 temp dir 执行，从未对仓库自身 `CLAUDE.md`/`AGENTS.md` 断言 `status==='installed'`——checked-in block 的静默 prose drift 不会被 CI 捕获。这是单点最高杠杆修复。
- 两条 load-bearing 红旗被 bootstrap 内联丢弃且无测试守护：「task is vague → brainstorm/plan」与「run init/update now → route first」——前者恰是路由最该生效的 vague-WHAT 场景，后者对应 Hard Rule #10（no state-changing commands just because governor matched）。
- `scripts/lint-skill-entrypoints.config.json` `scanRoots:["skills"]` 不含 `CLAUDE.md`/`AGENTS.md`——bootstrap 内的 `/spec:using-spec-first` 别名泄漏绕过 standalone-command-entrypoint lint。

### 风险
- 「sensitive surfaces」未定义 + 红旗 skill 名反转 + `update` 当入口——三处叠加使入口路由在 LLM 语义层可被合理化绕过，而 eval 又恰好不覆盖这些分支，形成"漏洞无守"。
- 盘面 drift 无 CI 守护 → 任意人手改 `CLAUDE.md` bootstrap 行即与生成器输出背离，source/runtime 边界 silently 失效。

### 优化点（按杠杆降序）
1. **P0** 新增 repo-state faithfulness 测试：`inspectInstructionBootstrap(REPO_ROOT, claude/codex).status === 'installed'`，让 checked-in `CLAUDE.md`/`AGENTS.md` 与生成器输出 byte-faithful 对齐。helper 已就绪，仅缺断言。
2. **P0** 显式缺席集扩为 `{sessions, slack-research, skill-audit, app-consistency-audit, polish-beta, release-notes}`，闭合 accretion 边界。
3. **P1** `CURATED_CORE` 改由 `skills-governance.json` 派生（如 `bootstrap_anchor:true` 标记），消除硬编码漂移。
4. **P1** 补回两条 load-bearing 内联红旗（vague→brainstorm/plan、run-init-now→route first），或加测试断言其 intentional deferral 至 `routing-red-flags.md`。
5. **P1** 定义 "sensitive surfaces"（architecture/contract/governance/runtime-delivery/multi-file/auth/payments/data-mutation 等），写入 `scope-guards.md` 并加红旗词条。
6. **P2** 补 fixture：跨宿主归一化、subagent non-reroute、parent-workspace 只读、`using-spec-first` 被命名、multi-session 告知、scenario-fingerprint；并放宽 `<=14` 上限。
7. **P2** 加 meta-test：每条 Route Map 行至少有一个 fixture `expected_entrypoint` 匹配，使覆盖率机械可见。
8. **P2** 消除 `SKILL.md` 与 `references/*.md` 的内联重复（dispatch-admission/parent-workspace），改为单一落点 + 测试守引用。
9. **P2** `routing-cases.json` 补顶层 `description` 与完整 `source_refs`。
10. **P3** `lint-skill-entrypoints` scanRoots 增补 `CLAUDE.md`/`AGENTS.md`。

---

## Round 2：工作流链路节点 handoff

### 取证范围
`docs/10-prompt/结构化项目角色契约.md`、`docs/workflow-skill-agent-map.md`、`skills/{using-spec-first,spec-brainstorm,spec-prd,spec-plan,spec-write-tasks,spec-work,spec-code-review,spec-doc-review,spec-debug,spec-compound,spec-compound-refresh}/SKILL.md`、`.spec-first/audits/skill-audit/2026-06-28-deep-research-loop10/*`。

### 证据与发现

**A. 主链路总体完整，但 public map 出现 stale 入口**
- 角色契约明确核心链路为 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge`，且明确 `spec-first update/init/clean/doctor` 是终端 CLI，不是 `/spec:*` workflow。
- `skills-governance.json` 当前登记 37 个 skill：18 个 `workflow_command`、4 个 `standalone_skill`、15 个 `internal_only`；`governance-drift-report.json` 显示 source skill count 与 governance record count 均为 37，finding 0。
- `docs/workflow-skill-agent-map.md` 仍把 `/spec:update` / `spec-update` 列为 workflow，且 Codebase 行写 `/spec:update`；这与角色契约、README、`using-spec-first` Route Map 当前口径冲突。

**B. 节点 handoff 的 source-of-truth 边界基本清晰**
- `using-spec-first` 只做入口路由，不生成 plan/task/review artifact。
- `spec-plan` 到 `spec-write-tasks` 明确 plan 是 single source of truth，task pack 是派生产物。
- review 类 workflow 输出 findings，执行类 workflow 消费 plan/task/source/test 证据，knowledge 类 workflow 写 `docs/solutions/`。

**C. Handoff 风险主要来自 stale 辅助文档，而非 skill 主面**
- `docs/workflow-skill-agent-map.md` 既列出现有 public workflow，也混入已退役的 `/spec:update`，说明“人工维护全景表”缺少与治理 registry 的机械对齐。
- `docs/workflow-skill-agent-map.md` 的 “Codebase -> /spec:update” 会误导用户把 update 当 host workflow 调用，尤其与 Round 1 发现的 red-flag `update` 命名混淆叠加。

### 风险
- 入口面 stale 文档会绕过最核心的 source/runtime 边界：用户或 agent 可能寻找不存在的 `$spec-update` / `/spec:update`，或把 runtime refresh 当作 workflow artifact 产出。
- 当手写 workflow map 与 `skills-governance.json` 分离时，新增/删除 public workflow 后文档可能长期漂移。

### 优化点
1. **P0** 修正 `docs/workflow-skill-agent-map.md`：删除 `/spec:update` workflow 行；改为 “Runtime maintenance: terminal `spec-first update/init/doctor/clean`”。
2. **P1** 为 `docs/workflow-skill-agent-map.md` 增加生成或校验脚本：public workflow 列表从 `skills-governance.json` 派生，人工说明只保留用途/agent 调度。
3. **P1** 在 `using-spec-first` routing eval 中增加 “用户显式说 `$spec-update` / `/spec:update`” 的反例，期望输出终端 `spec-first update`，不造 workflow。
4. **P2** 给 plan/task/review/knowledge handoff 增加一份 compact contract index，列每个节点的 canonical artifact、producer、consumer、failure mode，避免信息散在多个 SKILL。

---

## Round 3：脚本健壮性审查

### 取证范围
`skills/spec-skill-audit/scripts/write-audit-artifacts.js`、`collect-skill-facts` 相关模块、`tests/unit/skill-audit-scripts.test.js`、本轮执行产物 `.spec-first/audits/skill-audit/2026-06-28-deep-research-loop10/`。

### 证据与发现

**A. 正面：脚本是事实采集器，不假装语义裁决**
- `write-audit-artifacts.js` 在 `runSelfAudit` 中收集 structure/security/trigger/boundary/eval/promise/governance/runtime 报告，然后统一写出 JSON 与 Markdown。
- `skill-audit-summary.md` 明确 “Scorecards are signals, not gates” 与 “LLM review decides semantic quality”。
- `promise-implementation-report.json`：documented options 6、implemented options 6、findings 0，说明 audit workflow 自身承诺与实现一致。

**B. 关键弱点：误报反证还停留在 LLM 手工层**
- P0 三条 `runtime_governance` 均是误报候选：
  - `skills/spec-compound/SKILL.md:85` 说明默认排除 generated mirrors。
  - `skills/spec-mcp-setup/SKILL.md:34` 明确 generated runtime mirrors 不是 source。
  - `provider-tools.json:56` 说明 provider-owned runtime/project output，且不 auto-add/commit/promote。
- `security-risk-report.json` 仍把这些“禁止/边界说明”升级成 P0/P1 候选，说明 scanner 缺少 negation/fixture/allowlist 分类。

**C. Markdown link checker 对模板占位符误报**
- `skill-audit-report.json` 报 `spec-release-notes` 4 个 broken local link。
- 源码证据是 `skills/spec-release-notes/SKILL.md` 中的模板占位：`[Full release notes ->]({url})`、`[v2.65.0]({older_url})`。
- 这些不是本地 Markdown 链接，应该被识别为 templated external URL placeholder。

### 风险
- 高严重度误报会让维护者忽视真正 P0，降低 audit artifact 的可采纳性。
- 误报需要 LLM 人工 triage，扩大每次 repo-wide audit 的成本。

### 优化点
1. **P0** 在 `scan-instruction-security` 增加 `prohibited_boundary_statement` / `fixture_or_guardrail` 反证分类：含 “not source / do not edit / excludes / must not” 的 generated-runtime 命中默认降级到 P3 或 rejected candidate。
2. **P1** Markdown link checker 忽略 `{url}`、`{older_url}` 等 template placeholder，或将其标记为 `templated_placeholder`。
3. **P1** `security-risk-report.json` 增加 `counter_evidence.status` 的脚本级初筛字段，减少 LLM 后处理负担。
4. **P2** audit summary 顶部区分 `confirmed_by_script`、`candidate_requires_llm_review`、`likely_false_positive` 三栏，不把 candidate P0/P1 混在 executive summary。

---

## Round 4：schema/contract/eval 纪律

### 取证范围
`.spec-first/audits/skill-audit/2026-06-28-deep-research-loop10/eval-readiness-report.json`、`skills/*/evals/*`、`tests/unit/eval-fixture-contracts.test.js`、`tests/unit/workflow-eval-readiness-contracts.test.js`、`docs/contracts/workflows/eval-fixture-contract.md`。

### 证据与发现

**A. Eval 基础设施已存在且有 contract test**
- `eval-fixture-contracts.test.js` 会扫描 `skills/*/evals/*.json`，验证 normalize、唯一 id、CI script `test:eval-fixtures`。
- `workflow-eval-readiness-contracts.test.js` 锁第一波 workflow eval readiness。
- `spec-prd`、`spec-write-tasks`、`using-spec-first` 的 eval 体系最成熟，覆盖 trigger/boundary/failure/expected behavior。

**B. 覆盖率不足：22/37 skill 无 eval**
- 本轮 `eval-readiness-report.json`：15 个 ready，22 个 missing。
- 缺失名单包括多个 public workflow：`spec-compound-refresh`、`spec-ideate`、`spec-mcp-setup`、`spec-optimize`、`spec-polish-beta`、`spec-release-notes`、`spec-sessions`、`spec-slack-research`。
- `spec-mcp-setup` 有 44 个 scripts，但 eval readiness missing；这类高副作用 setup workflow 缺语义/边界 eval 的风险高于普通 internal helper。

**C. Contract Summary 纪律不均衡**
- `skill-audit-report.json` 报 61 个 P1 missing-section 与 61 个 P2 missing-section，主要集中在 internal-only 或旧迁移 skill。
- 这些不是都应按 P1 处理；对 public workflow 和 state-changing standalone skill 应严格，对 lightweight internal helper 可接受。

### 风险
- 高风险 workflow 没有 eval fixture，会导致边界修复依赖人脑记忆，难以防回归。
- 一刀切 section lint 会制造噪声，反过来削弱真正 contract 缺失的信号。

### 优化点
1. **P0** 为 `spec-mcp-setup` 增加最小 eval：trigger、negative boundary、provider opt-in、runtime mirror 不手改、degraded setup facts。
2. **P1** 为 8 个缺 eval 的 public workflow 建立 “thin eval seed”：每个至少 4 个 case（positive trigger / negative trigger / failure input / expected output）。
3. **P1** section lint 按 `entry_surface` 分层：`workflow_command` 与 state-changing standalone 缺 `When Not To Use/Failure Modes/Outputs` 才 P1；`internal_only` 默认 P2/P3。
4. **P2** 将 `eval-readiness-report.json` 汇总接入 release continuity guard，先 advisory，达到阈值后再变 gate。

---

## Round 5：source/runtime 边界

### 取证范围
`docs/10-prompt/结构化项目角色契约.md`、`docs/contracts/context-governance.md`、`skills/spec-skill-audit/references/source-vs-runtime-contract.md`、`runtime-drift-report.json`、`skills/spec-mcp-setup/SKILL.md`。

### 证据与发现

**A. Source/runtime 边界在核心契约中清晰**
- 角色契约 §6 明确 source-of-truth：`skills/`、`agents/`、`templates/`、`src/cli/contracts/**`、`docs/`、`README*`、host entrance docs。
- generated runtime：`.claude/`、`.codex/`、`.agents/skills/`。
- `context-governance.md` 默认排除 `.spec-first/audits/**`、`.spec-first/governance/**` 与 generated mirrors。

**B. 本轮 runtime drift 存在但范围明确**
- `runtime-drift-report.json`：claude checked、codex checked，2 个 P1 findings，均为 `using-spec-first` runtime asset drift。
- 该 drift 与本轮前置修改 `skills/using-spec-first/SKILL.md` / bootstrap block 同步有关；修复路径应是 `spec-first init`，不是手改 mirror。

**C. Provider-owned output 与 spec-first source 的边界需要更强表述**
- `spec-mcp-setup/provider-tools.json` 描述 Graphify provider 可写 `.codex/skills/graphify/`、`.codex/hooks.json`、`AGENTS.md`、`.claude/skills/graphify/`、`CLAUDE.md`、`graphify-out/`、`.git/hooks/*`。
- 这不是 spec-first generated mirror source，但会触碰 checked-in host docs 的 `## graphify` 段；需要持续明确“provider-owned/project output”与 “spec-first managed bootstrap block” 的边界。

### 风险
- `using-spec-first` drift 会让当前 host runtime 行为与 source 审查结论不同步。
- provider setup 可写 host docs，如果缺 marker/normalization contract，容易与 spec-first managed block 互相覆盖。

### 优化点
1. **P0** 在完成本轮相关 source 修改后运行 `spec-first init -y --claude` 与 `spec-first init -y --codex`，刷新 `using-spec-first` runtime drift；若本轮只提交审查文档，可把 drift 标为待执行，不手改 mirror。
2. **P1** 为 runtime drift report 增加具体 source/runtime path 与 hash 摘要，而不只写 `using-spec-first`。
3. **P1** 为 provider-owned host doc section 建立 marker contract：spec-first managed bootstrap block 与 Graphify `## graphify` 段互不覆盖。
4. **P2** 在 `spec-mcp-setup` eval 中加入 provider output boundary case。

---

## Round 6：skill prose 质量与引用加载

### 取证范围
`wc -l skills/*/SKILL.md`、`skills/spec-skill-audit/references/skill-authoring-quality.md`、各 skill 的 `references/` / `evals/` / `scripts/` 分布。

### 证据与发现

**A. Progressive disclosure 已部分落地，但仍不均衡**
- 最大 `SKILL.md`：
  - `spec-code-review` 1141 行
  - `spec-optimize` 733 行
  - `spec-compound-refresh` 710 行
  - `spec-compound` 629 行
  - `spec-work` 550 行
  - `spec-plan` 454 行
- `using-spec-first` 已在前序工作中从大 prompt 收敛为功能地图 + references，当前 235 行，是正确方向。

**B. 长主面不一定错误，但高频 workflow 的长主面会增加触发方差**
- `spec-code-review` 是复杂 workflow，长主面有合理性；但 1141 行会让普通 review 每次加载过重，也更容易把 persona synthesis、classification、auto-fix policy 混成单一大面。
- `spec-optimize` / `spec-compound-refresh` 长度偏高且 eval missing，说明 prompt 复杂度没有对应回归 fixture 托底。

**C. 引用加载指针总体存在，但“何时读引用”不总是明确**
- 高质量样例：`using-spec-first` 的 Reference Files 列出每个 reference 的读取触发条件。
- 风险样例：部分旧 internal skill 没有 references/evals/scripts，仅靠长 description 或主面 prose 触发，后续维护时难区分 source truth 与示例材料。

### 风险
- 长主面 + 缺 eval 会导致同一 workflow 在不同宿主/不同上下文中输出方差高。
- 引用文件无读取条件会破坏 progressive disclosure，agent 可能过读或漏读。

### 优化点
1. **P1** 对 `spec-code-review` 做 “using-spec-first 式瘦身”：保留 contract、phase spine、reference index；把 synthesis/auto-fix/persona detail 下沉 references。
2. **P1** `spec-optimize`、`spec-compound-refresh` 先补 eval，再决定是否拆 reference，避免 prose 重排无验证。
3. **P2** 增加 `skill-authoring-quality` lint：`SKILL.md > 500 行 && eval missing` 提示 P1 candidate；`>500 行 && eval ready` 提示 P2 progressive-disclosure candidate。
4. **P2** 每个 reference pointer 必须说明 “read when ...”，否则报告 `reference_trigger_missing`。

---

## Round 7：失败模式与降级覆盖

### 取证范围
`skills/*/SKILL.md` 的 Failure Modes / Scenario Capability、`docs/contracts/workflows/scenario-capability-matrix.md`、`rule-maturity-observations.json`、`security-risk-report.json`。

### 证据与发现

**A. Scenario capability 已覆盖 public workflow**
- `rg "Scenario Capability"` 显示 public workflow 基本都声明默认矩阵。
- `spec-debug`、`spec-code-review`、`spec-work` 明确 high-risk overrides，符合 matrix 中“会写、会做 root-cause/review claim 的高风险 workflow”定义。

**B. Failure Modes 不均衡**
- audit 报 61 个 P2 missing Failure Modes，主要是旧 skill / internal helper。
- 对 read-only 或 internal-only skill 可接受；对 shell/write/runtime/setup 类 skill 不应接受。
- `spec-mcp-setup` 主面具备失败模式，但 eval missing 使降级路径没有 fixture 证明。

**C. Rule maturity 当前为空**
- `rule-maturity-observations.json`：status `empty`，rule_count 0，shadow_hit_count 0。
- 这不是失败，但说明“规则成熟度观测”还处于机制就位/无数据阶段，不能在报告中声称已有治理数据闭环。

### 风险
- 降级路径写在 prose 中但无 eval，会在模型压力下变成“好像知道但不会执行”。
- rule maturity 空状态如果不被清楚标注，会被误读为健康而不是“尚无观测”。

### 优化点
1. **P1** 高副作用 skill（setup、git、browser、xcode、commit/push/PR）必须有 Failure Modes 或明确 N/A，且至少一个 failure eval。
2. **P1** `rule-maturity-observations-empty` 在 summary 中应显示为 “no observations yet”，不得进入 pass/healthy 口径。
3. **P2** 在 Scenario Capability matrix 增加 workflow-owned “how to disclose degraded evidence” 小模板，降低各 skill 自写差异。
4. **P2** 将 high-risk overrides 的覆盖测试扩展到 `spec-mcp-setup` 的 runtime/setup 风险，至少 advisory 检查。

---

## Round 8：测试与 eval 覆盖

### 取证范围
`tests/unit/*skill*`、`tests/unit/*contract*`、`tests/unit/eval-fixture-contracts.test.js`、本轮已有 diff、`npm` scripts。

### 证据与发现

**A. Contract test 数量与覆盖面强**
- 当前仓库有大量 unit contract tests，覆盖 instruction bootstrap、using-spec-first contracts、eval fixture、runtime hook、workflow prose 等。
- Round 1 已有未提交改动增加外部 issue/PR bootstrap 断言，并同步 `CLAUDE.md` / `AGENTS.md` / `skills/using-spec-first/SKILL.md` / contract tests。

**B. Repo-state faithfulness 仍是最高杠杆缺口**
- Round 1 已指出 `instruction-bootstrap.test.js` 主要验证 generator temp dir，缺少 checked-in `CLAUDE.md`/`AGENTS.md` 与 generator 输出 byte-faithful 的 repo-state 测试。
- 本轮 `git diff` 显示 checked-in bootstrap block 被手动/同步修改；如果没有 repo-state test，未来漂移仍可能静默进入。

**C. Test/eval 覆盖不应只追数量**
- 37 个 skill 中 22 个缺 eval，但很多是 internal-only；更合理的优先级是 public workflow + state-changing helper。
- `spec-release-notes` link placeholder 误报和 P0 runtime governance 误报说明 test 还缺“误报反例 fixture”。

### 风险
- 没有 repo-state faithfulness test 时，source generator 正确不等于仓库入口文件正确。
- 没有 false-positive fixture 时，审查脚本会持续制造高严重度噪声。

### 优化点
1. **P0** 新增 checked-in host docs faithfulness test：`CLAUDE.md` / `AGENTS.md` managed block 必须等于 `buildBootstrapBlock(host, zh)` 投影。
2. **P1** 为 security scanner 增加 false-positive fixtures：禁止手改 runtime 的说明、template URL placeholder、secret redaction guardrail。
3. **P1** `test:eval-fixtures` 增加 public workflow coverage table 输出，区分 missing-by-entry-surface。
4. **P2** 建立 “first-wave eval coverage” 后续波次：setup/runtime、optimization、knowledge refresh、release/session/slack retrieval。

---

## Round 9：跨 skill 一致性与冗余

### 取证范围
`boundary-overlap-matrix.json`、`trigger-routing-report.json`、`skills-governance.json`、`docs/workflow-skill-agent-map.md`、`skills/using-spec-first/SKILL.md` Route Map。

### 证据与发现

**A. Boundary overlap 报告是候选信号，不是结论**
- `boundary-overlap-matrix.json` 产生 168 个 candidate。
- Top candidates 包括：
  - `spec-skill-audit` vs `spec-write-skill`
  - `spec-debug` vs `spec-work`
  - `spec-code-review` vs `spec-doc-review`
  - `spec-brainstorm` vs `spec-prd`
  - `spec-prd` vs `spec-write-tasks`
- 这些大多是相邻节点共享 vocabulary，不代表 ownership 冲突。

**B. 真正需要修的是用户入口和近邻触发消歧**
- `spec-brainstorm` vs `spec-prd`：WHAT discovery / brownfield PRD authoring 的 tie-break 已在 `using-spec-first` 写明，但 eval 覆盖仍可加强。
- `spec-debug` vs `spec-optimize`：性能回归“why slow” vs 指标优化“make faster”存在真实近邻，前序 spec-debug 文档已承认一条撞车场景。
- `spec-skill-audit` vs `spec-write-skill`：audit 不应自动 rewrite source；write-skill 才负责创建/改写 skill。这一点在 `spec-skill-audit` 主面清晰，但 boundary candidate 可提示补 negative eval。

**C. Internal-only 暴露边界仍需统一**
- `skills-governance.json` 将 `git-worktree` 标为 `internal_only`，但 skill 作为可用 skill 出现在 host skill 列表中；这不是必然错误，问题在于“internal-only”到底表示不作为 public workflow，还是不应被用户直接触发。
- Round 1 中 `routing-red-flags.md` 把 `git-worktree` 当 internal-only helper，需确保 prose 与实际 host discovery 语义一致。

### 风险
- 近邻 workflow 若只靠 prose tie-break，用户输入模糊时容易路由到错误所有者。
- “internal-only” 名称如果未定义清楚，会在 skill discovery 与 public workflow governance 之间制造误解。

### 优化点
1. **P1** 为 boundary-overlap top 5 pair 各补 2 个 negative eval：`brainstorm/prd`、`debug/optimize`、`skill-audit/write-skill`、`prd/write-tasks`、`code-review/doc-review`。
2. **P1** 在 governance schema 中拆分 `entry_surface` 与 `host_discoverability`：internal helper 可被 host 发现但不作为 public workflow。
3. **P2** `boundary-overlap-matrix` 输出按 pair 聚合，不要把全局 candidate 当 skill-level defect；并加入 `likely_shared_vocabulary_only` 分类。
4. **P2** 修正 `routing-red-flags.md` 中 stale/反转 skill 名与 internal-only 解释。

---

## Round 10：知识沉淀闭环

### 取证范围
`docs/solutions/**`、`skills/spec-compound/SKILL.md`、`skills/spec-compound-refresh/SKILL.md`、`docs/contracts/context-governance.md`、本轮新审查文档。

### 证据与发现

**A. 知识库机制已形成闭环**
- `spec-compound` 负责刚解决问题后的 durable lesson。
- `spec-compound-refresh` 负责刷新、合并、替换、删除漂移的 learning/pattern docs。
- `docs/contracts/context-governance.md` 明确普通 workflow summary-first 消费 `docs/solutions/`，不广播全量历史。

**B. 当前审查产物应留在 `docs/项目审查/`，暂不直接晋升 `docs/solutions/`**
- 本轮是体系审查与优化建议，不是“最近解决的单一问题”的 verified reusable solution。
- 可晋升的候选只有具体模式，例如 “security scanner false-positive triage pattern” 或 “bootstrap repo-state faithfulness test pattern”；需要等修复落地并验证后再 compound。

**C. 历史审查资产很多，需避免审查报告变成新的上下文负担**
- `docs/项目审查/` 下已有大量全量审查和详细审查报告。
- 本轮报告必须给出优先级与可执行切片，否则只会增加“又一份大报告”的检索成本。

### 风险
- 未验证建议直接进入 `docs/solutions/` 会违反 knowledge promotion gate。
- 审查报告若没有 owner/next slice，会变成长期 backlog 噪声。

### 优化点
1. **P1** 本报告只作为 review artifact；待 P0/P1 修复落地并通过验证后，再用 `$spec-compound` 提炼 1-3 篇 `docs/solutions/`。
2. **P1** 每条优化建议标注 source evidence、consumer、验证命令，便于后续 `$spec-work` 接手。
3. **P2** `spec-compound-refresh` 增加“审查报告候选是否可晋升 durable knowledge”的判定 eval。
4. **P2** 为 `docs/项目审查/README.md` 增加最新审查索引与 active recommendations 指针，减少历史报告检索成本。

---

## 汇总：完整优化建议报告

### 总体结论

> Closeout 状态：本汇总保留原始取证发现，同时标注本次 staged closeout 已处理的项。`docs/workflow-skill-agent-map.md` 中 `/spec:update` / `spec-update` workflow 暴露已修正为终端 `spec-first update` CLI 口径；checked-in `CLAUDE.md` / `AGENTS.md` bootstrap 与 generator 的中文 repo-state faithfulness 测试已补强。

`spec-first` 的 skill 体系已经具备较强的工程化骨架：37 个 source skill 均纳入 governance registry，public workflow / standalone / internal-only 有基本分层；source/runtime 边界、context exclusion、scenario capability、eval fixture contract、reviewer guard coverage 等关键治理面都已存在。当前主要问题不是“缺 workflow”，而是四类质量债：

1. **入口与公共文档漂移曾存在**：原始取证发现 `docs/workflow-skill-agent-map.md` 暴露 `/spec:update`，与当前 CLI-only update 口径冲突；本次 closeout 已修正该入口面，剩余工作是长期保持治理 registry / map 防漂移。
2. **确定性 audit 信号误报率高**：P0/P1 候选里存在明显反证，scanner 需要把 guardrail/prohibition/template placeholder 与真实风险分开。
3. **eval 覆盖不均衡**：15/37 ready，22/37 missing；高风险 public workflow 中 `spec-mcp-setup`、`spec-optimize`、`spec-compound-refresh` 等优先级高。
4. **bootstrap/runtime drift 防线已补强一层**：已有 generator tests，本次 closeout 已补 checked-in host docs 与 generator 的中文 repo-state faithfulness 断言；runtime `using-spec-first` drift 仍按 source-first 规则刷新，不手改 generated mirrors。

### 优先级路线图

#### P0：先消除会误导入口或误导严重性的缺口
1. **已闭环**：修正 `docs/workflow-skill-agent-map.md` 的 `/spec:update` / `spec-update` stale workflow 表述。
   - Evidence：角色契约 §5、README update 段、`using-spec-first` Route Map 均说明 update 是终端 CLI。
   - Consumer：用户、workflow 路由、release docs。
   - 验证：`rg -n "/spec:update|\\$spec-update|spec-update" docs/workflow-skill-agent-map.md skills/using-spec-first/SKILL.md README.md README.zh-CN.md` 只允许历史/明确 CLI 语境。
2. **已闭环**：新增 checked-in `CLAUDE.md` / `AGENTS.md` bootstrap 中文 faithfulness test。
   - Evidence：Round 1 已确认 generator 守得住，repo-state 原先未守。
   - Consumer：host entry docs、SessionStart injection。
   - 验证：聚焦 `tests/unit/instruction-bootstrap.test.js`。
3. **仍开放**：调整 security/runtime governance scanner，避免把“禁止手改 generated runtime”的说明报成 P0。
   - Evidence：`spec-compound:85`、`spec-mcp-setup:34`、`provider-tools.json:56` 均是反向说明。
   - Consumer：`spec-skill-audit` summary、release governance。
   - 验证：新增 false-positive fixture + `tests/unit/skill-audit-scripts.test.js`。

#### P1：补高风险 workflow 的语义回归网
4. 给 `spec-mcp-setup` 增加最小 eval seed。
   - 覆盖：provider opt-in、runtime mirror 不手改、Graphify provider output boundary、degraded readiness。
5. 给缺 eval 的 public workflow 建第二波 eval：`spec-compound-refresh`、`spec-ideate`、`spec-optimize`、`spec-polish-beta`、`spec-release-notes`、`spec-sessions`、`spec-slack-research`。
6. 为 top boundary pair 增 negative eval：`brainstorm/prd`、`debug/optimize`、`skill-audit/write-skill`、`prd/write-tasks`、`code-review/doc-review`。
7. 将 section lint 按 `entry_surface` 分层，避免 internal-only old skill 噪声淹没 public workflow 风险。

#### P2：降低长期维护成本
8. `docs/workflow-skill-agent-map.md` 改为从 `skills-governance.json` 生成 public workflow 列表，人工只写用途与 agent 调度。
9. `runtime-drift-report.json` 增加具体 source/runtime path、hash、host，使 drift 可直接定位。
10. 长主面治理：优先瘦身 `spec-code-review`，再处理 `spec-optimize` 与 `spec-compound-refresh`；瘦身前先补 eval。
11. `boundary-overlap-matrix` 增加 pair 聚合与 `shared_vocabulary_only` 反证分类。
12. `docs/项目审查/README.md` 增加最新审查报告索引与 active recommendations 指针。

### 建议执行顺序

1. **Slice A：入口与 bootstrap 防漂移**
   - 已改 `docs/workflow-skill-agent-map.md`。
   - 已加 checked-in bootstrap 中文 faithfulness test。
   - 运行 `npm run sync:instructions`、bootstrap/using-spec-first/changelog tests、`git diff --check`。

2. **Slice B：audit 脚本误报治理**
   - 修 security scanner negation/fixture 分类。
   - 修 templated URL placeholder link 误报。
   - 加 `skill-audit-scripts` fixtures。

3. **Slice C：高风险 eval seed**
   - 先补 `spec-mcp-setup`，再补 missing public workflow 第二波。
   - 扩展 `test:eval-fixtures` 覆盖表。

4. **Slice D：主面瘦身与知识沉淀**
   - 在 eval 保护下瘦身 `spec-code-review`。
   - 完成 P0/P1 修复后，用 `$spec-compound` 将“bootstrap faithfulness pattern”和“audit false-positive triage pattern”晋升到 `docs/solutions/`。

### 本轮验证证据

- 已读取角色契约：`docs/10-prompt/结构化项目角色契约.md`。
- 已按 `$spec-skill-audit` workflow 运行确定性采集：
  - `node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --runtime --run-id 2026-06-28-deep-research-loop10`
  - 产物：`.spec-first/audits/skill-audit/2026-06-28-deep-research-loop10/`
- 已检查多会话：`spec-first session list --json`，active_count 0。
- 已使用 Graphify 作为 advisory navigation：`graphify query "spec-first skills workflow handoff runtime governance eval readiness source runtime boundaries" --budget 2200`。
- 已用 source/test evidence 复核关键结论：`skills-governance.json` 37 条记录、`runtime-drift-report.json` 2 条 drift、`eval-readiness-report.json` 15 ready / 22 missing、`security-risk-report.json` P0/P1 误报反证、`docs/workflow-skill-agent-map.md` `/spec:update` stale。

### 明确未执行

- 未执行 `spec-first init` 刷新 runtime drift；本轮主要交付审查文档，且不手改 generated runtime mirrors。
- 未执行 fresh-source eval；本轮未修改 skill/agent prose 语义，只追加审查报告与 changelog。
- 未执行全量测试；写文档后应至少运行 changelog format 与 diff check。

---

## 附录：补充深度取证（源码级 handoff 与知识闭环）

> 本附录由本会话独立 subagent 直读源码补充，聚焦 Round 2 工作流链路 handoff 与 Round 10 知识闭环中**未被上文确定性 audit 覆盖**的源码级发现。证据均带 `file:line`，可与上文 P0/P1 路线图合并执行。

### A. Spec→Plan：路径合并让唯一确定性 gate 失去负载能力
- `skills/spec-plan/references/planning-flow.md:42-46` — Plan Phase 0.2 按 `docs/brainstorms/*-requirements.md` 的 **topic + 30 天 recency** 检索上游，**不按 `artifact_kind`** 过滤。
- `skills/spec-brainstorm/references/requirements-capture.md:286` 与 `skills/spec-prd/SKILL.md:18` — brainstorm 与 PRD **同写 `docs/brainstorms/*-requirements.md`**，仅 PRD 带 `artifact_kind: prd-requirements` 与 ready receipt。
- 后果：Plan 可通过同一条 intake 静默消费一份**未经确定性 gate 的 brainstorm 文档**，与一份已过 `check-prd-artifact.js` 的 PRD 无法区分——链路中唯一的确定性 gate 对 handoff 实际不具负载能力。
- **补充优化点（P0，合并入上文 P0-1 序列）**：`planning-flow.md:42-46` 增 `artifact_kind: prd-requirements` 过滤；非 PRD 命中要么路由回 PRD finalize，要么在 plan frontmatter 标 `origin_grade: brainstorm`，让下游 `spec-write-tasks`/`spec-work`/review 可见 WHAT 是否经脚本 gate。

### B. Tasks→Work：`semantic_posture` / `dispatch_authorization` 是 LLM 自报、两端不复验
- `skills/spec-write-tasks/SKILL.md:99-105` 声明 envelope 含 `reason_code/next_action/semantic_posture/dispatch_authorization`，但 `src/cli/task-pack.js:348-360,529-530` **只产出** `task_pack_validity` 与 `deterministic_handoff`——其余字段为 LLM 自报。
- `skills/spec-write-tasks/SKILL.md:104` 仅对 `deterministic_handoff: true` 有 "never self-report without CLI JSON evidence" 硬规则；`semantic_posture`（决定能否进 `spec-work-task-pack`）与 `dispatch_authorization`（决定能否链式进 doc-review）**两端均无 CLI 校验**。
- `skills/spec-work/SKILL.md:195-208` — Work 复验 identity/freshness/structure，但**不复验 `semantic_posture`**：一份 `unchecked-existing` 包可被模型标 `reviewed-existing` 而通过执行。
- `skills/spec-write-tasks/references/execution-handoff-contract.md:66-81` — 高风险→doc-review 的四前提是 prose-only；`dispatch_authorization: authorized` 可被 standalone 触发误设而静默链式。
- **补充优化点（P0）**：`task-pack.js` 扩展产出 `reason_code`（从 finding `code` 映射）与 `semantic_posture: unchecked` 默认值；Work 侧加 "非 `generated-this-run`/`reviewed-existing` 即拒执行" 检查，闭合该洞。

### C. Work plan-only 执行路径无新鲜度绑定、弱契约再派生
- `skills/spec-work/SKILL.md:289-303` — 输入为 plan（非 task pack）时，Work 从 plan body 自行派生 task list，**无 `source_plan_hash` 级绑定**；plan 被中途编辑则无新鲜度检查（task-pack 路径有，plan-only 无）。
- `skills/spec-plan/SKILL.md:36` 禁止 Plan 生成 task-pack state，而 Work plan-only 路径等价于以更弱契约（无 wave、无逐 task `stop_if`、无 hash 绑定）重新生成执行结构——**Plan/Work 边界自相矛盾**。
- `skills/spec-work/SKILL.md:158` — "Large" bare-prompt 路由允许用户覆盖 plan 建议而继续， sanctioned 的 plan-while-execute 漂移。
- **补充优化点（P1）**：plan-only 路径在 intake 记录 `plan_body_hash`，中途 plan body 变化即拒绝继续（对齐 task-pack `source_plan_hash`）。

### D. Review→Knowledge：doc-review 完全无 learning-capture，headless/autofix 静默丢弃
- `skills/spec-code-review/SKILL.md:852-857` — code-review Stage 6 item 8 "Learning Capture Recommendation" 被显式降级为 advisory，`report-only`/`autofix`/`headless` 模式下**完全抑制**——恰恰是流水线无人值守模式，已解决问题永不沉淀。
- `skills/spec-doc-review/SKILL.md:43` — doc-review 的 Downstream Consumers **未列 `spec-compound`**，全文无 learning-capture 步骤——最常发现可复用架构教训的 skill 反而零沉淀路径。**这是单一最大 dead-sediment 来源。**
- `skills/spec-code-review/SKILL.md:864` — Verdict 与是否捕获 learning 无依赖，merge 不受未沉淀阻塞。
- **补充优化点（P0，合并入上文知识闭环增强）**：为 `spec-doc-review` 增 Stage-6 等价 "Learning Capture Recommendation"；将 review→compound 至少作为 `downstream-resolver`/`human` 残留可执行项输出，使其在 headless/autofix 模式存活而非被静默丢弃。

### E. compound schema↔corpus 分歧与 validator 空转
- `skills/spec-compound/references/schema.yaml:71-90` — `component` enum 高度 Rails/app 专属（`rails_model`/`brief_system`/`email_processing`…），而 `docs/solutions/` 实际类目为 `architecture-patterns/conventions/developer-experience/tooling-decisions/workflow-issues`——schema 假设的 bug-track 类目目录（`build-errors/` 等）**在 corpus 中不存在**。
- `skills/spec-compound/SKILL.md:295` — `validate-frontmatter.py` 仅查 3 条 YAML-safety（delimiter/` #`/`: `），**不强制 required fields 或 enum**；"only a verified learning may enter durable docs"（`:95`）实际未被工具强制。
- `skills/spec-compound/SKILL.md:461` — lightweight 模式**跳过 overlap 检查**，显式制造重复 drift 风险并推迟到 `spec-compound-refresh`，但无任何机制调度该清理。
- `skills/spec-compound-refresh/SKILL.md:543` vs `:531` — Replace 删旧前跑 validator，但 Consolidate/Update 改 frontmatter 后**不跑 validator**——asymmetric，merge 可引入 parser-unsafe YAML。
- **补充优化点（P1）**：扩展 validator 强制 `required_fields` + enum；`component` 改 free-string + advisory enum（含 `skill/workflow/cli/agent/contract`）；Consolidate/Update 后同样跑 validator。

### F. 双轨召回 + 死沉淀
- `skills/spec-debug/SKILL.md:84` 用 flat frontmatter scan，而 plan/ideate/review 用 `spec-learnings-researcher` subagent——**两条召回机制**输出形态/排序/陈旧处理不同，debug 召回质量低于 review。
- `agents/spec-learnings-researcher.agent.md:272-276` 自述被 plan/code-review/optimize/ideate 调用，**未列 `spec-work` 与 `spec-debug`**，与 `spec-debug/SKILL.md:84` "默认消费 docs/solutions" 矛盾——prose 声明与 agent contract 不一致。
- `skills/spec-work/SKILL.md:112` 称 learning "recalled during execution (directly...)"，但 work body **无 dispatch 步骤**；standalone work 无 plan 时 recall 不强制。
- 死沉淀：bug-track 类 learning 若写入 recall agent 关键词形态不探的目录则永不被读；叠加 E 的 corpus 分歧，未来 bug-track learning 高概率死沉淀。
- **补充优化点（P1）**：统一召回机制（debug 也走 learnings-researcher 或统一 flat-scan 契约）；standalone work 加 "无 plan-provided learnings 则先 bounded frontmatter scan" 显式步骤；将 discoverability 维护从 compound 内移出至 `spec-first init`/hook，使其不依赖可选的 compound。

### G. PRD owner-answer fidelity 与 brainstorm gate 无确定性 backstop
- `skills/spec-prd/check-prd-artifact.js:461-478` — `traceRowBindsOq` 只查 referential 一致（OQ id/问题字串出现在 trace 行），**不查 owner 是否真的回答**；`SKILL.md:196` 承认 owner-answer fidelity 是 producer-side rule、checker 不强制——reversal anti-pattern 不可检测。
- `check-prd-artifact.js:451-453` — 仅要求 `chosen_answer` 非空，不要求 `owner_answer` 非空/non-`isEmptyish`——"trace 行存在但记录无答案" 的反转形状漏检。
- `skills/spec-brainstorm/references/requirements-capture.md:215-273` — brainstorm readiness gate **完全 LLM-judged**，无确定性预扫；PRD checker 已有的轻量检查（placeholder/TODO regex、`Resolve Before Planning` 段存在、`spec_id`、R-ID 格式）可移植。
- `skills/spec-brainstorm/references/handoff.md:27` — 允许把 `Resolve Before Planning` 项 convert 为 decision/assumption/Deferred 后再显示 Plan 选项，**转换未记入文档、不可查**——brainstorm 侧的 "checkpoint-as-escape" 同构漏洞。
- **补充优化点（P1）**：`check-prd-artifact.js` 对 `owner-*` disposition 要求 `owner_answer` 非空；为 brainstorm 加轻量确定性预扫（移植 PRD 模式），并把 convert 写入 `Outstanding Questions` 的 `closure_disposition` 后才允许 menu 重渲。

### 附录小结：对上文汇总报告的优先级补强
- **抬至 P0**：A（Spec→Plan `artifact_kind` 过滤）、B（`semantic_posture`/`dispatch_authorization` 两端复验）、D（doc-review learning-capture + headless 残留存活）。这三项直接决定确定性 gate 是否真正负载、可复用知识是否沉淀，是"健壮性/稳定性"的核心，应与上文 P0-1/P0-2/P0-3 同批执行。
- **抬至 P1**：C（plan-only `plan_body_hash`）、E（compound validator + schema/corpus 对齐）、F（统一召回 + standalone work recall 步骤）、G（PRD owner-answer + brainstorm 确定性预扫）。
- 执行切片建议在上文 Slice A 后插入 **Slice A'：handoff 确定性补强**（A/B/D 三项），因其在链路最弱处闭合，收益/成本比最高。

---

## 附录 B：最高杠杆 P0 逐项优化设计

> 本附录对上文「最高杠杆 P0（合并执行）」4 项逐个深度核实真实源码状态、诊断根因、给出优化设计。**核实结论：4 项中有 3 项主体前提失实（P0-1、P0-2 主体、P0-3 主体），仅 P0-4 全部成立。** Spec-First Evolution Architect 必须以可验证事实优先于模型猜测——不在错误前提上"优化"不存在的问题，对真缺口给方案，对误报给纠正。证据均带 `file:line`，可在仓库复验。

### P0-1 修正 `docs/workflow-skill-agent-map.md` 残留 `/spec:update` stale 入口

**真实状态：该问题不存在。**
- `grep -n "spec:update|spec-update|\$spec-update" docs/workflow-skill-agent-map.md` 返回空——当前盘面已无该 stale 入口。文件 mtime `Jun 28 06:25`，与并发审查会话同时段，推测 stale 已在该会话中被修正，或审查报告 Round 2 基于更早的瞬态状态。
- 上文汇总报告 P0-1、附录 A 未触及此项——此项**无需执行**。

**根因（为何会进入 P0 清单）**：审查报告把"曾观察到的 stale"当成"当前缺口"，未在写汇总前对盘面复验。这正是角色契约强调的"Advisory facts 不是 confirmed truth"——audit 产物是快照，汇总前必须对 source 复核。

**优化设计**：无需改 `docs/workflow-skill-agent-map.md`。真正值得做的是**防回归**（避免 stale 复发）：
- **Goals**：让 `docs/workflow-skill-agent-map.md` 的 public workflow 列表与 `skills-governance.json` 机械对齐，新增/退役 workflow 后文档不漂移。
- **Non-goals**：不把该文档改成全自动生成（人工用途/agent 调度说明需保留）。
- **方案**：新增一个轻量 contract test——解析 `docs/workflow-skill-agent-map.md` 中出现的 `/spec:<name>` / `$spec-<name>` token 集，断言其 ⊆ `skills-governance.json` 中 `kind=workflow_command` 的 entrypoint 集，且 `spec-first update/init/doctor/clean` 不被当作 `/spec:*`。失败即报 `workflow_map_stale_entrypoint`。
- **风险**：低。test 仅读两份 source，无副作用。
- **落地**：`tests/unit/workflow-skill-agent-map-contracts.test.js`，验证 `npm run test:unit`。
- **结论**：从 P0 清单**移除**（源已无 stale）；防回归 test 降为 **P2**。

### P0-2 新增 checked-in `CLAUDE.md`/`AGENTS.md` bootstrap faithfulness 测试

**真实状态：该测试已存在且为 byte-faithful。**
- `tests/unit/instruction-bootstrap.test.js:392-397` 已断言 `inspectInstructionBootstrap(REPO_ROOT, getAdapter('claude')).status === 'installed'` 与 codex 同。
- `src/cli/instruction-bootstrap.js:65-76` 的 `inspectInstructionBootstrap` 取盘面 actual block，与 `buildBootstrapBlock(adapter, 'zh'/'en')` **精确比较**（`expectedBlocks.includes(actual)`）——`status==='installed'` 当且仅当盘面 block 与生成器输出 byte-faithful。`drifted` 分支即 drift 检测。
- 即：checked-in `CLAUDE.md`/`AGENTS.md` 与生成器输出的 byte-faithful 对齐**已被 CI 守护**。Round 1 subagent 与并发审查报告 Round 8 的"无 repo-state byte-faithful 测试"结论**错误**——它们漏看了 `:392-397` 与 helper 的精确比较语义。

**根因（为何误报）**：subagent 在 `instruction-bootstrap.test.js:366-388` 看到 temp-dir 用例，未向下翻到 `:392-397` 的 REPO_ROOT 用例；且未读 `inspectInstructionBootstrap` 函数体确认 `installed` 即 byte-faithful。

**真实可优化点（细分，仍成立）**——这些是 Round 1 subagent 的其他发现，与"byte-faithful"无关：
1. 显式缺席集不完整：`instruction-bootstrap.test.js:512-513` 仅断言 `sessions`/`release-notes` 缺席，`slack-research/skill-audit/app-consistency-audit/polish-beta` 无缺席断言 → bootstrap 可静默纳入这 4 项仍过测。**P1**。
2. `CURATED_CORE` 在测试中硬编码，未从 `skills-governance.json` 派生 → SKILL 新增高频入口时无人提示 bootstrap 漏纳。**P1**。
3. 两条 load-bearing 红旗被 bootstrap 内联丢弃且无守：「vague→brainstorm/plan」「run-init-now→route first」。**P1**。

**优化设计**：
- **Goals**：闭合 accretion 边界（4 项缺席断言）；让 `CURATED_CORE` 随治理 registry 自动派生；补回或显式 deferral 两条红旗。
- **Non-goals**：不重写已 byte-faithful 的守卫主体（已正确）。
- **方案**：
  - 扩 `instruction-bootstrap.test.js` 显式缺席集为 `{sessions, slack-research, skill-audit, app-consistency-audit, polish-beta, release-notes}`。
  - 在 `skills-governance.json` 给高频入口加 `bootstrap_anchor: true`，测试从该字段派生 `CURATED_CORE`。
  - bootstrap 内联红旗补回两条，或在测试中断言其 intentional deferral 至 `references/routing-red-flags.md`。
- **风险**：改 `skills-governance.json` schema 需同步 governance-drift 守卫；中。
- **落地**：`tests/unit/instruction-bootstrap.test.js` + `skills-governance.json` + `src/cli/instruction-bootstrap.js`（若补红旗）；验证 `npx jest tests/unit/instruction-bootstrap.test.js tests/unit/using-spec-first-contracts.test.js`。
- **结论**：P0-2 主体（byte-faithful test）**已满足，移除**；3 条细分点降为 **P1**。

### P0-3 audit scanner 把"禁止手改 runtime"说明报成 P0

**真实状态：scanner 已有三层 negation + 6 个 false-positive fixtures，该误报已被处理。**
- `skills/spec-skill-audit/scripts/lib/security-patterns.js:90-121` `classifyPatternContext`：命中行含 `PROHIBITION_HINTS`（`do not/never/avoid/must not/will not/forbid` + 中文 `禁止/不要/不得/避免/不允许/只建议`）即降级 P3。
- `scan-instruction-security.js:69-83` `classifyFileContext`：`/references/`、`/evals/`、`/examples/` 路径强制 P3。
- `scan-instruction-security.js:85-100` `classifySectionContext`：`when not/do not/not to use` 标题降级 P3，但有 `hasExecutableExceptionCue`（`exception/except/unless/if the user insists/例外/除非`）保留原严重度——精确区分"禁止说明"与"禁止但带可执行例外"。
- `tests/unit/skill-audit-scripts.test.js:636-710,876-909` 已有 6 个 false-positive suppression fixtures，含 "hand-edit generated runtime mirrors" 行断言无 P0。
- 并发审查报告 Round 3"scanner 缺少 negation/fixture/allowlist 分类""误报反证停留在 LLM 手工层"结论**错误**——三层 negation 已机械落地，非 LLM 手工。

**真实残留（成立，但 P1 非 P0）**：
- Markdown link checker 对 `{url}`/`{older_url}` template placeholder 无感知 → `markdown.js:8` `LOCAL_LINK_PATTERN` 把 `{url}` 当本地路径，`fs.existsSync` 假，`lint-skill-structure.js:142-153` 报 P2 `broken_local_link`。`skills/spec-release-notes/SKILL.md` 的 `[Full release notes ->]({url})` 受影响。**P1**。

**优化设计**：
- **Goals**：消除 template placeholder 误报；不引入新分类层（三层已够）。
- **Non-goals**：不重构已健全的 severity 分类。
- **方案**：`markdown.js` `extractLocalLinks` 增 placeholder 跳过——链接目标匹配 `/^\{[a-z_]+\}$/` 或含 `{...}` template 段时，标记 `templated_placeholder: true` 并跳过 `exists` 判定（不进 broken 队列）。加 fixture：`[x]({url})` 不产 `broken_local_link`。
- **风险**：低。需确认不漏报真实本地路径误写。
- **落地**：`skills/spec-skill-audit/scripts/lib/markdown.js` + `tests/unit/skill-audit-scripts.test.js`；验证 `npx jest tests/unit/skill-audit-scripts.test.js`。
- **结论**：P0-3 主体（runtime governance P0 误报）**已满足，移除**；`{url}` placeholder 误报降为 **P1**。

### P0-4 handoff 确定性补强（Spec→Plan / Tasks→Work / Review→Knowledge）

**真实状态：3 子项全部成立。**

**核实证据**：
- Spec→Plan：`skills/spec-plan/references/planning-flow.md:42-46` 确认 Phase 0.2 按 topic + 30 天 recency 检索 `docs/brainstorms/*-requirements.md`，**无 `artifact_kind` 过滤**；brainstorm 与 PRD 同写该路径（仅 PRD 带 `artifact_kind: prd-requirements` + ready receipt）。✅ 成立
- Tasks→Work：`src/cli/task-pack.js` grep `semantic_posture|dispatch_authorization|reason_code|next_action` **返回空**；`deriveValidity`（`:348-357`）仅产 `valid/wrong-chain/stale/unverifiable/invalid`。`skills/spec-work/SKILL.md:195-210` Work 复验段确认只查 identity/freshness/structure，**不复验 `semantic_posture`**。✅ 成立
- Review→Knowledge：`grep "compound|learning|sediment|capture" skills/spec-doc-review/SKILL.md` **返回空**——doc-review 无 learning-capture。对照 `spec-code-review/SKILL.md:853-857` 已有完整三段式模板（Skip silently / Offer neutrally / Lean into）可移植。✅ 成立

#### P0-4a Spec→Plan 按 `artifact_kind` 过滤

**根因**：brainstorm 与 PRD 共享 `docs/brainstorms/*-requirements.md` 路径与 `*-requirements.md` 后缀，仅 PRD 带 `artifact_kind` 与 ready receipt。Plan 的 intake 按 topic+recency 检索，不区分两者 → 一份未经确定性 gate 的 brainstorm 文档可被当作 PRD-grade origin 静默消费，使链路唯一确定性 gate（`check-prd-artifact.js`）对 handoff 失去负载能力。

**优化设计**：
- **Goals**：让 Plan intake 区分 PRD-grade（过 gate）与 brainstorm-grade（未过 gate），下游可见 origin 等级。
- **Non-goals**：不禁止 Plan 消费 brainstorm 文档（直接入口合法）；不强制所有 origin 必须是 PRD。
- **方案**（推荐 A，轻量）：
  - A. `planning-flow.md:0.2` 增过滤优先级：若命中文档带 `artifact_kind: prd-requirements` 且 frontmatter 有 `readiness_verified_by: check-prd-artifact.js` + `status: ready-for-planning`，认作 PRD-grade origin；否则标 `origin_grade: brainstorm`，在 plan frontmatter 记录该等级。下游 `spec-write-tasks`/`spec-work`/review 可见 WHAT 是否经脚本 gate。
  - B（备选，重）：Plan intake 拒绝非 PRD-grade origin，强制路由回 PRD finalize。——违反"Plan 容忍直接入口"的现有契约，不推荐。
- **风险**：brainstorm 文档当前无 `artifact_kind` 字段，需确认 brainstorm skill 不写该字段（避免误判为 PRD）。中低。
- **落地**：`skills/spec-plan/references/planning-flow.md` + `skills/spec-plan/references/plan-template.md`（增 `origin_grade` 字段）；加 eval case：brainstorm-origin 与 PRD-origin 各一。验证 `npx jest tests/unit/spec-plan*.test.js` + eval。

#### P0-4b Tasks→Work `semantic_posture`/`dispatch_authorization` 两端复验

**根因**：envelope 声明（`spec-write-tasks/SKILL.md:99-105`）含 `reason_code/next_action/semantic_posture/dispatch_authorization`，但 CLI（`task-pack.js`）只产 `task_pack_validity`/`deterministic_handoff`，其余 LLM 自报；硬规则只守 `deterministic_handoff`。`semantic_posture`（决定能否进 `spec-work-task-pack`）与 `dispatch_authorization`（决定能否链式进 doc-review）两端无 CLI 校验 → `unchecked-existing` 包可被标 `reviewed-existing` 通过执行；standalone 触发可误设 `authorized` 静默链式。

**优化设计**：
- **Goals**：让 envelope 的 routing 字段从 LLM 自报变为 CLI 可证/可拒；Work 侧复验 `semantic_posture`。
- **Non-goals**：不要求 CLI 产 `dispatch_authorization`（依赖 host 能力，非 CLI 可判）——该项保留 LLM 判但加 Work 侧 cross-check。
- **方案**：
  1. `task-pack.js` 扩展产出：`reason_code` 从 finding `code` 映射（`task-pack-missing-spec-id→missing_spec_id`、`task-pack-wrong-chain→wrong_chain`、`task-pack-stale→stale_hash`、`task-pack-source-plan-*→source_plan_missing/invalid`、其余→`invalid_contract`）；`semantic_posture` 默认 `unchecked`（CLI 无法证明 reviewed，只产默认值，LLM 仅可上调至 `generated-this-run` 当本运行生成）。
  2. `spec-work/SKILL.md:195-210` 复验段增：`semantic_posture` 非 `generated-this-run`/`reviewed-existing` 即拒执行；`dispatch_authorization: authorized` 必须附带 doc-review outcome 字段才可信，否则降级为待授权。
  3. `spec-write-tasks/evals/boundary-cases.json` 增 deterministic assertion：high-risk 包不得在无 doc-review outcome 字段时携带 `dispatch_authorization: authorized`。
- **风险**：`reason_code` 映射需与 `SKILL.md:38` enum 对齐，且与 finding code 一一映射测试覆盖；中。改 envelope 字段需同步 `task-pack-schema.md` parity test。
- **落地**：`src/cli/task-pack.js` + `skills/spec-write-tasks/references/task-pack-schema.md` + `skills/spec-work/SKILL.md` + `evals/boundary-cases.json`；验证 `npx jest tests/unit/task-pack*.test.js tests/unit/spec-write-tasks*.test.js` + `spec-first tasks validate` e2e。

#### P0-4c doc-review 增 learning-capture

**根因**：`spec-doc-review/SKILL.md` Downstream Consumers 未列 `spec-compound`，全文无 learning-capture 步骤——最常发现可复用架构/需求教训的 skill 反而零沉淀路径。code-review 已有 Stage 6 item 8 完整三段式可移植。

**优化设计**：
- **Goals**：让 doc-review 在发现可复用教训时输出 learning-capture 建议；headless/autofix 模式下不静默丢弃（至少留一条 advisory 行或残留项）。
- **Non-goals**：不自动跑 `spec-compound`、不写 `docs/solutions/`（与 code-review 一致，保持 user's choice）。
- **方案**：
  1. `spec-doc-review/SKILL.md` Downstream Consumers 增 `spec-compound`。
  2. 移植 `spec-code-review:853-857` 三段式（Skip silently / Offer neutrally / Lean into）为 doc-review 的 review-output section；doc-review 的"可复用"门槛侧重架构决策/契约/边界教训（而非 code-review 的 finding 模式）。
  3. headless/autofix 模式：当 learning-worthy evidence 存在时，至少输出一条 advisory 行（对齐 code-review `:857`），而非完全静默——闭合"无人值守模式永不沉淀"。
- **风险**：doc-review 与 code-review 的 learning 门槛不同，需按 doc 语境裁剪三段式示例，避免照搬 code 语境。中低。
- **落地**：`skills/spec-doc-review/SKILL.md` + `evals/`（加 learning-capture trigger case）；验证 fresh-source eval（改了 skill prose 语义，必须 fresh-source eval，见 CLAUDE.md Agent/Skill 变更验证）。

#### P0-4 汇总
- **执行顺序**：4a（最轻、闭合唯一确定性 gate）→ 4c（移植成熟模板、低风险）→ 4b（改 CLI envelope + 双端复验、最高价值但最大改动）。
- **共同验证**：4a/4b 改 script 与 schema，按常规 contract test；4c 改 skill prose，**必须 fresh-source eval**（CLAUDE.md 硬要求）。
- **结论**：P0-4 三子项**全部成立，保留 P0**，是真正最高杠杆项。

### 附录 B 小结：P0 清单校正

| 原 P0 项 | 真实状态 | 处置 |
| --- | --- | --- |
| P0-1 map `/spec:update` stale | **已不存在**（盘面已无） | 移除；防回归 test 降 P2 |
| P0-2 bootstrap faithfulness test | **已存在且 byte-faithful**（`instruction-bootstrap.test.js:392-397` + `instruction-bootstrap.js:65-76`） | 移除主体；3 条细分点降 P1 |
| P0-3 audit scanner runtime 误报 | **已有三层 negation + 6 fixtures** | 移除主体；`{url}` placeholder 误报降 P1 |
| P0-4 handoff 确定性（a/b/c） | **三子项全部成立** | 保留 P0，按 4a→4c→4b 执行 |

**核心教训**：审查报告（含本会话前期 subagent 与并发会话 Round 3/8）在 P0-1/P0-2/P0-3 上基于过时状态或漏读源码，产出"优化不存在问题"的风险。Spec-First Evolution Architect 的纠正依据是 `file:line` 源码事实：`grep` 盘面、读 helper 函数体、读 test 断言语义——而非转述 audit 快照。后续 `$spec-work` 接手时，应先按本附录 B 校正后的清单执行，避免在已满足项上浪费工程量。

**真正待执行的 P0**：仅 P0-4（a/b/c）。其余降为 P1/P2 细分点见上文汇总报告与附录 A。
