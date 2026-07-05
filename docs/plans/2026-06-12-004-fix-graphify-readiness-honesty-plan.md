---
title: "fix: Graphify readiness 诚实性——query 语义引导与索引盲区沉淀"
type: fix
status: completed
date: 2026-06-12
spec_id: 2026-06-12-004-graphify-readiness-honesty
plan_depth: lightweight
---

# fix: Graphify readiness 诚实性——query 语义引导与索引盲区沉淀

## Summary

矫正 graphify readiness 的两处误导，**全程不修 provider**：(1) `provider-readiness-renderer.cjs` 的 query 探针 advisory（`query_verified=false` 分支）补一句能力引导——代码导航的可靠用法是 `explain`/`path`，`query` 仅弱定向（`query_verified` 证 CLI/artifact liveness，不证 query 召回可信）；(2) 把实测诊断（`query` 是无语义 BFS、种子被劫持；`explain`/`path` 可靠；`.cjs` 索引盲区）沉淀进 `docs/solutions/tooling-decisions/`，并记录 graphify 上游归位。份内边界明确：不修 graphify 检索算法/extractor（provider 内部），不加机械盲区检测（避免过度设计与告警疲劳），不碰 project-graph 消费协议（`docs/plans/2026-06-11-002-...`，独立挂起）。

这是 `docs/plans/2026-06-12-002-fix-graphify-runtime-visibility-plan.md`（已 completed，让 graphify 在 setup 中 runtime-visible）的**后续诚实性发现**：runtime-visible 之后，实测发现 readiness 信号本身仍不诚实。

---

## Problem Frame

实测（graphify v0.8.36，本仓库，2026-06-12）三命令能力分化：

- `query "<question>"` = **无语义 BFS**（`--help`：“BFS traversal of graph.json for a question”）。分词→匹配 label 选种子→BFS depth=2。种子被高频词/同名代码符号/自指节点劫持（`scripts`、`candidate()`、CLAUDE.md graphify 小节），召回不可信——实测四类查询零召回关键 docs/contracts 散文。
- `explain "X"` / `path "A" "B"` = **可靠**（精确节点 label 匹配含别名容错 / 图最短路径）。`explain "loadPluginManifest"`、`path "init.js" "doctor.js"` 均精确命中。
- `explain` 的失败仅因**索引盲区**：`.cjs` 不进图。确定性证据：`graph.json` 中 `.cjs` 出现 **0** 次、`.js` 出现 **10362** 次；5 个 `skills/spec-mcp-setup/scripts/*.cjs` 节点数全 **0**。graphify extractor 不处理 `.cjs` 扩展名。

由此 setup 侧两处不诚实：

1. probe 用 `query` 的 exit code 设 `query_verified`（`install-helpers.sh` 的 `probe_graphify_query_if_available`、ps1 孪生）。消费侧可能把 `query_verified=true` 误读为“query 召回可信”，而它只证 liveness（CLI+artifact 能执行命令）。renderer 的 `false` 分支文案已是 liveness 语义（“CLI/artifact usability”），但**没有任何地方告知可靠用法是 `explain`/`path`**。
2. `.cjs` 索引盲区完全未暴露——用户/LLM 用 `explain`/`path` 做代码导航时，不知道这些文件是盲区。

两个根因都在 **graphify CLI 内部**（检索算法、extractor 文件类型覆盖）。按 `docs/10-prompt/结构化项目角色契约.md`，spec-first 不拥有 provider 生命周期，不修 provider；mcp-setup 份内事 = **诚实暴露能力画像**（Scripts prepare facts）。

---

## Direct Evidence

- target_repo: `spec-first`
- source_refs:
  - `skills/spec-mcp-setup/scripts/install-helpers.sh`（`probe_graphify_query_if_available` 用 `query "spec-first setup readiness"` 设 `SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED`）
  - `skills/spec-mcp-setup/scripts/install-helpers.ps1`（ps1 孪生，同用 `query`）
  - `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs`（graphify `query_verified=false` advisory 分支，现文案含 “Graphify query probe has not confirmed CLI/artifact usability”）
  - `tests/unit/dependency-readiness-baseline.test.js`（:294 测试锁 `query_verified=false`→advisory、`=true`→无 advisory）
- current_revision: HEAD `5cf92508`（分支 `leo-2026-06-11-plan-update`）
- worktree_dirty: 是（存在与本计划无关的 modified/untracked，实现时不回滚）
- discovery_methods: 直接源码读取；`grep -c` 统计 `graph.json` 节点；实跑 graphify `query`/`explain`/`path`/`--help`（只读）
- tests_or_logs: graphify v0.8.36 实测输出（query 种子劫持、explain 命中/盲区、path 命中）；`graph.json` `.cjs`=0/`.js`=10362
- confidence: 高——能力分化与 `.cjs` 盲区均经确定性证据核实
- limitations: graphify CLI 在 `~/.local/bin` 不在 PATH；`graph.json` built_at_commit 在会话期间多次变动（`0921d016`→`8eeedbfb`），属活跃仓库正常；本会话对 renderer 行为以源码 + 测试核实，未跑 fresh-source eval（renderer 是脚本资产，不受会话缓存限制）

---

## Requirements

- R1. `provider-readiness-renderer.cjs` 的 graphify `query_verified=false` advisory 分支，在**保留**现有承重短语 “Graphify query probe has not confirmed CLI/artifact usability”（测试锚 `dependency-readiness-baseline.test.js:319`）的前提下，补一句能力引导：代码导航优先 `graphify explain`/`path`，`query` 仅弱定向。
- R2. 不在 `query_verified=true` 分支新增 advisory（保持 `dependency-readiness-baseline.test.js:335` 不回退；避免每次 verify 告警疲劳——同 built_at_commit 反模式）。
- R3. 新建 `docs/solutions/tooling-decisions/graphify-query-explain-reliability-2026-06-12.md` 沉淀诊断：`query` 无语义 BFS/种子劫持、`explain`/`path` 可靠、`.cjs` 索引盲区、mcp-setup 份内边界（不修 provider）、对 project-graph 消费协议的含义、graphify 上游归位（extractor 不处理 `.cjs`）。
- R4. 不修 graphify 检索算法/extractor、不让 `.cjs` 进图、不加机械索引盲区检测、不改 `provider-readiness` schema 字段集。
- R5. `CHANGELOG.md` 记录（user-visible：setup advisory 输出文案变化），developer profile=leokuang。
- R6. focused test：`dependency-readiness-baseline.test.js` 在现有 `query_verified=false` 用例补一条断言，验证新引导短语出现。

---

## Scope Boundaries

继承角色契约与实测边界：

- 不修 graphify `query` 算法、不让 `.cjs` 进图——根因在 provider 内部，归 graphify 上游（在 solution doc 记录）。
- 不加机械索引盲区检测（renderer 加“该进图文件清单”检测=脆 + 仓库特定知识泄漏 + 每次 verify 告警疲劳）。
- 不碰 project-graph 消费协议（`docs/plans/2026-06-11-002-feat-project-graph-consumption-protocol-plan.md`，已独立挂起，等召回质量改善）。
- 不改 `provider-readiness.v2` schema 字段集；`query_verified` fact 名/位不变（仅消费引导文案变化）。
- 不改 probe 探测命令（`query` 用于 liveness 探测无误；改 `explain`/`path` 需脆的稳定探测目标，收益低——见 D1）。

### Deferred to Follow-Up Work

- `query_verified` 的能力画像进入 project-graph 消费协议/skill 消费指引（随挂起的 2026-06-11-002 一起评估，本计划只在 renderer advisory 与 solution doc 落诚实信号）。
- graphify `.cjs` extractor 支持：上游 issue（非 spec-first 代码改动）。

---

## Implementation Units

### U1. renderer query 探针 advisory 文案矫正

- **Goal:** 在用户被提示“query 未验证”时，顺势告知可靠用法是 `explain`/`path`，消除“query_verified=true 即 query 召回可信”的潜在误读。
- **Requirements:** R1, R2, R6
- **Dependencies:** 无
- **Files:**
  - `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs`（graphify `query_verified=false` advisory 分支）
  - `tests/unit/dependency-readiness-baseline.test.js`（现有 :294 测试补断言）
- **Approach:** 在 `installed && artifact && provider.id === 'graphify' && !queryVerified` 分支的 next_action 文案中，保留 “Graphify query probe has not confirmed CLI/artifact usability” 关键短语后，追加能力引导（口径：代码导航优先 `graphify explain`/`path`；`query` 是无语义 BFS、仅弱定向）。**不动** `query_verified=true` 路径。renderer 是 Node 单点产出 advisory，sh/ps1 不各自渲染该文案——无双宿主 parity 改动。
- **Patterns to follow:** 现有 graphify next_actions 文案风格（`provider-readiness-renderer.cjs` 同分支既有条目）。
- **Test scenarios:**
  - `query_verified=false` → next_actions 含现有 “CLI/artifact usability” 短语**且**含新引导短语（如 `explain`/`path` 字样）。
  - `query_verified=true` → next_actions 仍**不含**该 advisory（回归保护，守 :335）。
- **Verification:** `npx jest tests/unit/dependency-readiness-baseline.test.js`

### U2. graphify 实用性诊断沉淀（docs/solutions）

- **Goal:** 把本轮实测诊断固化为可检索的工程知识，防止未来重复评估，并明确 graphify 上游归位。
- **Requirements:** R3, R4
- **Dependencies:** 无（可与 U1 并行）
- **Files:**
  - `docs/solutions/tooling-decisions/graphify-query-explain-reliability-2026-06-12.md`（新增）
- **Approach:** 按 `docs/solutions/` 现行格式写：问题（query/explain 实测分化）、根因（无语义 BFS 种子劫持 + `.cjs` extractor 盲区，确定性证据）、判断（graphify=代码导航工具，`explain`/`path` 可靠、`query` 弱定向、docs 散文导航放弃）、mcp-setup 份内边界（不修 provider，只诚实暴露）、对 project-graph 消费协议的含义（前提存疑→挂起）、上游归位（`.cjs` extractor）。可经 `spec-compound` 规范化产出。
- **Test scenarios:** Test expectation: none — 知识沉淀文档，无行为变更。
- **Verification:** 人工复核 doc 含上述要素 + `source_refs` 指向本计划 Direct Evidence。

### U3. CHANGELOG 与收尾

- **Goal:** 治理闭合：记录 user-visible advisory 文案变化，窄验证通过。
- **Requirements:** R5
- **Dependencies:** U1, U2
- **Files:** `CHANGELOG.md`
- **Approach:** 按仓库现行格式以 developer profile（leokuang）记录，标注 `(user-visible)`（setup advisory 输出文案变化）。renderer 是脚本资产、不受会话缓存限制，无需 fresh-source eval；无 SKILL prose 变更，无 runtime mirror 再生成需求。
- **Test scenarios:** Test expectation: none — 文档变更。
- **Verification:** `npm run test:mcp-setup` + `npx jest tests/unit/dependency-readiness-baseline.test.js`

---

## Key Technical Decisions

- **D1. 不改 probe 探测命令（保留 `query`）。** `query` 跑通即证明 CLI+artifact liveness，作为 liveness 探针无误。改用 `explain`/`path` 需要一个稳定存在的探测目标（脆，且 `.cjs` 等盲区使目标选择更不可靠），收益低于风险。修复点不在探测命令，在消费引导。
- **D2. 能力画像主要落文档 + `false` 分支一句引导，不在 `true` 分支告警。** `query_verified=true` 时 push advisory 会每次 verify 告警→疲劳（与已砍的 built_at_commit 陈旧检查同类反模式）。诚实信号放 solution doc（持久知识）+ 用户已被打断的 `false` 分支（顺势引导），不制造稳态噪声。
- **D3. `.cjs` 盲区上游归位，不在 renderer 加机械检测。** 机械检测需定义“该进图文件清单”（脆 + 把 spec-first 仓库特定知识塞进通用 renderer），且会产生稳态告警。`.cjs` extractor 覆盖是 graphify 局限，归上游；spec-first 只在 solution doc 如实记录。

---

## Risks

- **新引导短语过约束测试**：U1 在现有断言旁加新短语断言。缓解：先按断言写文案再跑窄测试；保留现有承重短语不动。
- **solution doc 与 plan 措辞漂移**：U2 引用本计划 Direct Evidence；以 `source_refs` 锚定，避免平行表述。
- **被误读为“修好了 query”**：本计划只暴露能力画像、不提升召回。缓解：Summary/Problem Frame/solution doc 均显式声明“不修 provider、query 仍不可信”。

---

## Sources

- 角色契约：`docs/10-prompt/结构化项目角色契约.md`（Scripts prepare/LLM decides；spec-first 不拥有 provider 生命周期；80/20）
- 相关 plan：`docs/plans/2026-06-12-002-fix-graphify-runtime-visibility-plan.md`（completed，本计划的前置——runtime-visible 之后的诚实性发现）
- 挂起 plan：`docs/plans/2026-06-11-002-feat-project-graph-consumption-protocol-plan.md`（project-graph 消费协议，等召回质量改善）
- 实测（只读，2026-06-12）：graphify v0.8.36 `query`/`explain`/`path`/`--help`；`graph.json` `.cjs`=0、`.js`=10362、5 个 `spec-mcp-setup/*.cjs` 节点=0
- 源码：`skills/spec-mcp-setup/scripts/{install-helpers.sh,install-helpers.ps1,provider-readiness-renderer.cjs}`、`tests/unit/dependency-readiness-baseline.test.js:294-335`
