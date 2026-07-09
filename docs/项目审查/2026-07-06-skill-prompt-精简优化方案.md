---
doc_role: optimization-plan
review_date: 2026-07-06
reviewer: leokuang (Kiro session)
relates_to:
  - docs/项目审查/2026-07-06-真实状态与提升优先级.md
  - docs/10-prompt/结构化项目角色契约.md
  - scripts/lint-skill-entrypoints.config.json
  - /Users/kuang/xiaobu/spec-first-doc/claw/2026-07-04/AI-Skill-Token优化-spec-first借鉴/2026-07-04-ai-skill-token-optimization-spec-first-integration-report.md
limitations: |
  基于当前 worktree 的 skill 源文件、lint 配置、contract 测试直接取证。
  行数/字数为实测。未运行真实宿主内 workflow 验证精简后的语义行为，语义等价性判断为待验证。
  2026-07-04 外部报告作为 advisory 业界依据和方案输入，不替代 spec-first 源码、测试和 source/runtime 边界。
---

# Skill Prompt 精简优化方案（2026-07-06）

## 0. 结论先行

spec-first 的 38 个 skill 共 10,628 行 prompt，其中最重的 `spec-code-review`（1,241 行 / 18,388 词）在每次 review 调用时全量注入 LLM context。**项目内已有一个经过 contract 测试验证的精简模式——`spec-plan` 的 "STOP. Before X, read references/Y.md" 惰性引用模式**。本方案的核心是：把这个已验证模式推广到其余重型 skill，而不是发明新机制。

- **Goals**：降低主 SKILL.md 每次注入的 token 量；把只在特定阶段/条件触发的 prose 移到按需加载的 references；保持语义等价。
- **Non-goals**：不改变 workflow 行为语义；不删除治理边界（只是移位置）；不新增 skill/agent；不改 CLI。

结合 2026-07-04 的 Skill Token 优化报告后，本方案需要从单一的“正文瘦身”升级为两层治理：

- **Activation index 层**：frontmatter `description`、触发边界、排除边界、route collision，决定 skill 是否被加载。这是常驻上下文税。
- **Active body 层**：被触发后的 `SKILL.md` spine、STOP trigger、references、scripts、templates，决定执行时的上下文预算和行为可靠性。

当前正式实施计划仍应先做 `spec-work` / `spec-code-review` 的正文瘦身样板；但 closeout 和后续 wave-2 不能只报告主文件行数，还必须报告 index token / route audit 是否改善。

---

## 1. 问题量化（实测数据）

### 1.1 Skill 体量分布

| Skill | 行数 | 是否已用 reference 模式 |
|---|---|---|
| `spec-code-review` | 1,241 | 否（references/ 存在但主文件仍臃肿） |
| `spec-optimize` | 737 | 部分 |
| `spec-compound-refresh` | 717 | 部分 |
| `spec-compound` | 646 | 部分 |
| `spec-work` | 579 | references/ 存在但利用不足 |
| `spec-plan` | 460 | **是（已完成，13 个 reference 文件）** |
| **38 skill 合计** | **10,628** | — |

### 1.2 跨 skill 重复的样板治理段落

同一段治理 prose 在多个 skill 中几乎逐字重复：

| 样板段落 | 出现在几个 skill |
|---|---|
| `Scenario Capability` | 20 |
| `Examples As Context` | 11 |
| `Runtime Context Exclusion` | 6 |
| `Capability-Class Evidence Boundary` | 6 |
| `Domain Language And Decision Ledger` | 4 |
| `Summary-First Handoff` | 3 |
| `Anti-Rationalization Red Flags` | 3 |
| `Context Orientation Anchor` | 3 |
| `Cache-Friendly Context Layout` | 2 |

`Runtime Context Exclusion` 尤其浪费：它逐字列出全部 generated mirror 路径（`.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/**`、`.kiro/**`、`.qoder/**`...），而这份清单本身已经是 `docs/contracts/context-governance.md` 的内容。等于把一份 contract 抄进 6 个 skill。

### 1.3 单个 skill 内的样板占比

`spec-code-review`：
- 总计 18,388 词
- 治理样板段落（第 55-131 行，含 Examples As Context / Context Orientation / Domain Language / Feedback Loop / Anti-Rationalization / Runtime Context Exclusion / Cache-Friendly / Summary-First / Direct Evidence / Diff Boundary / Capability-Class）= **1,433 词**
- 这些段落 80% 的普通 review 不触发，却每次注入

---

## 2. 已验证的精简模式（spec-plan）

`spec-plan`（460 行）已经把治理边界移出主文件，主文件用**惰性引用锚点**指向 reference：

```markdown
**STOP. Before broad context gathering, domain interpretation, upstream artifact
intake, or optional capability consumption, read
`skills/spec-plan/references/governance-boundaries.md`.** This runtime-copied
reference carries the planning governance boundaries for context orientation,
decision ledgers, runtime mirror exclusion, summary-first handoff, recall trust,
and optional capability evidence. Do not duplicate those boundaries in this spine.
```

对应的 reference 文件（实测存在）：

```
skills/spec-plan/references/
  governance-boundaries.md   (8.3 KB — 吸收了 Runtime Context Exclusion / Summary-First / Recall Trust / Capability-Class)
  planning-flow.md           (29 KB — Phase 0/1 全流程，只在进入时加载)
  deepening-workflow.md      (20 KB — 只在需要 deepen 时加载)
  enterprise-plan-review.md  (7 KB — 只在命中 enterprise 触发时加载)
  plan-template.md / plan-sections.md / plan-handoff.md ...
```

**关键证据**：`tests/unit/spec-plan-contracts.test.js` 已经断言这个结构，且断言 runtime 生成后 reference 被正确投射：

```js
expect(claudeRuntimeSkill).toContain('read `.claude/spec-first/workflows/spec-plan/references/governance-boundaries.md`');
expect(claudeRuntimeReference).toContain('## Capability-Class Evidence Boundary');
```

说明这个模式：① 已被采纳 ② 有 contract 测试守护 ③ runtime 投射正确。可以安全推广。

---

## 3. 精简的三种手法

### 手法 A：共享治理段落下沉到 reference（最高杠杆）

把 `Runtime Context Exclusion`、`Capability-Class Evidence Boundary`、`Summary-First Handoff`、`Cache-Friendly Context Layout`、`Direct Evidence Boundary` 这类跨 skill 重复的段落，抽成每个 skill 的 `references/governance-boundaries.md`，主文件只留一个 STOP 锚点。

- 影响 skill：`spec-code-review`、`spec-work`、`spec-compound`、`spec-compound-refresh`、`spec-optimize`、`spec-doc-review`
- 预期：每个重型 skill 主文件减 800-1,400 词

**边界**：`Runtime Context Exclusion` 的路径清单不应逐字重抄——reference 里只需一句 "遵循 `docs/contracts/context-governance.md` 的默认排除清单" + 本 skill 特有的例外。清单的 source of truth 是 contract，不是 skill。

### 手法 B：阶段性 prose 移到 phase reference（惰性加载）

只在特定 phase 才需要的详细步骤，移到 phase reference，主文件用 STOP 锚点。

- `spec-code-review`：`Reviewers` / `How to Run` / `Quality Gates` / `Language-Aware Conditionals` / `Fallback` 这些只在实际 dispatch 阶段需要，可下沉到 `references/dispatch-flow.md`（persona-catalog.md 已存在，可扩展）
- `spec-work`：Phase 1 的 task-pack validation 详细决策树（见手法 C）、`Minimality + Architecture Fit Preflight`、`Feedback Loop And Vertical Slices` 可下沉

### 手法 C：确定性校验逻辑改为引用 CLI 输出（同时精简 + 兑现哲学）

`spec-work/SKILL.md` Phase 1 用 ~40 行 prose 手写描述 task-pack 校验决策树：

```
- confirm type: task-pack, generated_by, status: derived, mode: derived
- read spec_id ... if mismatch reject
- confirm source_plan_hash is concrete sha256:<64-hex>
- compare hash using spec-first tasks validate
- reject draft/transient/missing-source/spec-id-mismatch/...
```

**实测证据**：`src/cli/task-pack.js` 的 `validateTaskPack()` 已经确定性地做了全部这些检查（spec_id 匹配、hash 比对、contract 结构、wave 依赖、file overlap、runtime mirror 检测、secret-denied path），并通过 `spec-first tasks validate <path> --json` 返回 `deterministic_handoff: true/false` 和 `reason_code`。

主文件的 40 行 prose 是在**用自然语言重新叙述脚本已经确定性执行的逻辑**。精简为：

```markdown
Run `spec-first tasks validate <task-pack-path> --json`.
Proceed only if `deterministic_handoff` is true.
If false, read `reason_code` and stop with the handoff envelope;
do not repair task-pack JSON in the executor.
```

这同时兑现角色契约的 "scripts enforce deterministic invariants; LLM decides above that floor"——校验是脚本的活，SKILL 只做"拿到结果后怎么办"的语义判断。

**注意**：这不改变实际调用（SKILL 本来就调 `spec-first tasks validate`），只是删掉 prose 里对校验规则的重复叙述。

---

## 4. 落地顺序（按 ROI 与风险）

| 步骤 | 动作 | 目标 skill | 风险 | 验证 |
|---|---|---|---|---|
| 1 | 手法 C：task-pack 校验 prose → CLI 引用 | `spec-work` | 低（不改调用，只删叙述） | `spec-first tasks validate` 行为不变；`spec-work` eval fixtures |
| 2 | 手法 A：共享治理段落 → `governance-boundaries.md` | `spec-code-review` | 中（需同步 contract test） | 复用 spec-plan 的 contract test 模式，断言 runtime 投射 |
| 3 | 手法 B：dispatch 阶段 prose 下沉 | `spec-code-review` | 中 | fresh-source eval 验证 review 行为等价 |
| 4 | 手法 A + B 推广 | `spec-work`、`spec-compound`、`spec-optimize` | 中 | 逐个 skill 的 contract/eval |
| 5 | 抽公共 `context-governance` 引用，消除 6 处路径清单重复 | 全部含该段的 skill | 低 | context-governance-contracts.test.js |

**先做 1 和 2**：步骤 1 风险最低（纯删冗余叙述），步骤 2 有现成的 spec-plan 模式可套。跑通这两个，验证 not-run 比例和 review 质量无退化后，再推广。

### 4.1 结合 Skill Token 报告后的顺序修正

外部报告提醒的重点是：Skill 体系扩张后，最先吃掉上下文的不一定是 `SKILL.md` 正文，而是启动和路由阶段的索引层。因此落地时建议把“测量”前置，但不把“结构化新 contract”前置：

| 补强步骤 | 动作 | 是否阻塞当前 pilot | 理由 |
|---|---|---|---|
| 0A | 做 Skill Index Audit：统计核心 skill description 字符/词数、是否含负向边界、相邻 skill 重叠词 | 不阻塞 | 只产 advisory facts，可作为 before baseline |
| 0B | 建 Route Collision 样例集：覆盖 plan/work/review/compound/debug/optimize 的常见误触发请求 | 不阻塞 | 先观察误触发，不凭感觉压缩 description |
| 0C | 给 pilot closeout 增加 index 指标：description delta、route audit 结果、误触发/漏触发限制 | 阻塞 closeout 表达，不阻塞正文瘦身 | 防止只报行数，忽略路由质量 |
| 后续 | 评估核心 skill description 压缩候选 | 需 route audit 后执行 | 当前描述虽然长，但已经承载 `Do not use` 边界，不能盲目删 |

这意味着：`spec-work` task-pack CLI downshift 仍是第一刀；`spec-code-review` governance 下沉仍是第二刀。Skill index 治理作为测量和后续描述优化，不抢第一刀的实现顺序。

---

## 5. 必须遵守的约束

1. **contract 测试先行**：spec-plan 的 reference 结构有 `spec-plan-contracts.test.js` 守护。每个被精简的 skill 必须有对应断言：主文件含 STOP 锚点、reference 含被移出的段落、runtime 投射正确。否则 runtime drift 无人发现。
2. **runtime 投射验证**：reference 文件必须被 `spec-first init` 正确投射到 `.claude/spec-first/workflows/<skill>/references/` 和 `.agents/skills/<skill>/references/`。改完 source 后用 `spec-first init` 重新生成，不手改 generated mirror。
3. **语义等价是待验证项**：精简后必须用 fresh-source eval（把精简后的 SKILL 源文件注入全新 subagent）验证 workflow 行为未漂移，不能只靠"读起来一样"。
4. **STOP 锚点不能省触发条件**：spec-plan 的锚点明确写了"before X, read Y"——X 是触发时机。移动 prose 时必须保留触发时机，否则 LLM 不知道何时该加载 reference。
5. **不把强制性边界变成可选**：治理边界移到 reference 是改变"何时加载"，不是改变"是否遵守"。STOP 锚点用 `**STOP. ... read ...**` 的强指令语气，与 spec-plan 一致。

---

## 6. 预期收益（保守估计）

| 指标 | 当前 | 精简后（目标） |
|---|---|---|
| `spec-code-review` 主文件 | 1,241 行 | ~300-400 行 + 惰性 references |
| `spec-work` 主文件 | 579 行 | ~200 行 + 惰性 references |
| 每次普通 review 注入的治理样板 | ~1,433 词 | ~100 词（STOP 锚点） |
| task-pack 校验 prose | ~40 行叙述 | ~5 行 CLI 引用 |
| not-run 比例（当前 35%） | 待观测 | 预期下降（LLM 被冗余约束困住的情况减少） |
| 核心 skill description | `spec-plan` 451 chars / 63 words，`spec-debug` 449 / 68，`spec-optimize` 549 / 69，`spec-doc-review` 533 / 69 | 先建立 route audit，再压缩高风险描述 |
| route collision | 未系统记录 | 20 条以上典型请求命中正确率作为后续目标 |

核心收益不是"文件变短"这个数字本身，而是：
- **LLM 每次调用有更多 context 预算分给用户的实际代码**
- **主文件更接近 workflow 骨架，可读性和可维护性提升**
- **真正兑现 deterministic floor 哲学（校验归脚本）**
- **减少错误 skill 被提前加载造成的 route pollution**

---

## 7. 与竞品的对照

| 框架 | 单 skill 典型体量 | 加载策略 |
|---|---|---|
| Superpowers | 50-100 行 | 每 skill 只做一件事 |
| Claude Agent Skills 标准 | 主文件精简 + supporting files 按需 | progressive disclosure |
| spec-first 现状 | 平均 280 行，最重 1,241 行 | 主文件全量注入 |
| spec-first spec-plan（已优化） | 460 行主文件 + 13 惰性 reference | **已符合 progressive disclosure** |

spec-first 的 progressive disclosure 机制（references/ + runtime 投射）已经存在且被 spec-plan 验证。差的只是把这个模式贯彻到其余重型 skill。

---

## 8. 一句话结论

> 不需要发明新机制。`spec-plan` 已经跑通了 "spine + 惰性 reference" 模式并有 contract 测试守护。把这个模式推广到 `spec-code-review` 和 `spec-work`，并把 task-pack 校验的 prose 叙述替换为对 `spec-first tasks validate` 的引用——这就是最高杠杆、最低风险的 skill prompt 精简路径。

结合 Skill Token 报告后的补充结论：

> 先把被触发后的正文变轻，再把触发前的索引变准。正文瘦身解决“加载后太重”，route/index 治理解决“本不该加载却被加载”。二者共同服务 Context YAGNI，而不是为了追求更低行数牺牲工程边界。

---

## 9. 业界最佳实践（外部依据）

本方案的方向与 Anthropic 官方及主流实现的公开最佳实践一致，非个人偏好。以下为外部依据，均已改写以符合内容许可要求。

### 9.1 三级渐进式披露（Progressive Disclosure）

这是 [Anthropic 官方 Agent Skills 设计](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)的基础架构，被 Claude Code、Codex、[Mistral Work](https://docs.mistral.ai/vibe/work/skills)、[Microsoft Agent Framework](https://devblogs.microsoft.com/agent-framework/give-your-agents-domain-expertise-with-agent-skills-in-microsoft-agent-framework/)、LangChain deepagents 等广泛采用：

| 层级 | 内容 | 加载时机 | Token 成本 |
|---|---|---|---|
| L1 Metadata | frontmatter 的 `name` + `description` | 会话启动全部预加载 | ~100 tokens/skill |
| L2 Body | SKILL.md 正文 | 仅当请求匹配该 skill | 中 |
| L3 Resources | references / scripts | 仅执行到需要时 | 按需 |

据 [codewithseb 分析](https://www.codewithseb.com/blog/claude-code-skills-reusable-ai-workflows-guide)，未激活 skill 时该架构可带来约 98% token 节省；[另一案例](https://www.mejba.me/agent-skills-advanced-claude-code)记录 token 成本从约 47,000 降到约 3,200。

### 9.2 具体规则（多来源佐证）

- **SKILL.md 正文控制在 500 行以内。** Anthropic 官方与 [Trail of Bits](https://trailofbits.com/skills/designing-workflow-skills/) 均明确此上限；正文只放每次调用都需要的东西——原则、路由、快速参考、链接，正文 token 预算约 5,000。
- **一个 skill 只做一件事，紧扉界定范围。** 见 [skywork 最佳实践总结](https://skywork.ai/blog/ai-bot/claude-skills-ultimate-guide-8/)：紧扉界定范围、写明确激活描述、用渐进式披露、串联小 skill、生产监控。
- **Metadata-only 生存测试。** [Generative Programmer 分析](https://open.substack.com/pub/generativeprogrammer/p/skill-authoring-patterns-from-anthropics)：启动时只看到 name+description，活不过这轮的 skill 永不被调用；描述用于发现，正文用于流程。
- **引用文件只下沉一层（one-level-deep）。**
- **解释"为什么"而不是堆 ALWAYS/NEVER 大写指令。** 见 [wmedia 总结的 Anthropic 五规则](https://wmedia.es/en/tips/claude-code-create-skills-anthropic-rules)。
- **用 eval 对照 no-skill baseline 迭代**，而不是主观判断"读起来更好"。
- **单体化是最常见失败。** [一篇实战复盘](https://medium.com/@hsnckdnmm/i-built-a-skill-with-claude-it-ignored-anthropics-documentation-439696b91a8a)指出：单体长 skill 中，agent 单次通读会把描述长度误当优先级，混在 prose 里的强制项被淹没；修复方式正是回到三级渐进式披露。

### 9.3 spec-first 现状对照

| 最佳实践 | spec-first 现状 | 差距 |
|---|---|---|
| SKILL.md < 500 行 | `spec-code-review` 1,241 行、`spec-work` 579 行 | 超标 |
| 正文只放每次都需要的 | 大量条件性/防御性 prose 常驻正文 | 超标 |
| 三级渐进式披露 | 机制已具备（references/ + runtime 投射） | 部分 skill 未用 |
| 一层引用 | `spec-plan` references/ 为一层 | 符合 |
| 用 eval 对照 baseline | 有 eval fixtures + fresh-source eval | 机制在场 |
| 描述用于发现 | frontmatter description 完整 | 符合 |

**结论**：`spec-plan`（460 行主文件 + 13 个惰性 reference + STOP 锚点）恰好就是业界推荐的三级渐进式披露标准实现；`spec-code-review`（1,241 行）明显违反 Anthropic 官方 500 行上限，属典型单体化反模式。本方案是把已在 `spec-plan` 跑通的标准做法，贯彻到其余超 500 行的重型 skill。

（本章外部内容均为改写摘要，用于佐证方向；spec-first 的实现真相源仍以仓库 source、tests 和 source/runtime 边界为准。）

---

## 10. 进一步技术方案补强：索引/路由治理

2026-07-04 Skill Token 报告最有价值的补充，不是把 `SKILL.md` 再压短一点，而是指出一个更早发生的成本：**skill 还没被触发时，description 和 route index 已经在消耗上下文并影响路由判断**。

因此，prompt 精简应拆成两个互补目标：

| 层 | 目标 | 当前方案覆盖 | 需要补强 |
|---|---|---|---|
| Activation index | 让 agent 准确判断是否加载某个 skill | 初步提到 Metadata-only，但未落到 audit | description-as-router、trigger/exclude、route collision、index token baseline |
| Active body | skill 触发后只加载必要执行上下文 | 已覆盖 spine + STOP trigger + references + deterministic CLI floor | 继续执行 `spec-work` / `spec-code-review` pilot |
| Conditional resources | 复杂细节按需读取 | 已覆盖 references/scripts/templates | 继续验证 runtime projection 和 loader behavior |

### 10.1 当前 source 事实

对核心 skill frontmatter 的直接读取显示，当前 description 并不短：

| Skill | 当前 description 体量 | 判断 |
|---|---:|---|
| `spec-plan` | 451 chars / 63 words | 有排除边界，但承担了小型路由说明书职责 |
| `spec-work` | 322 chars / 47 words | 边界相对清楚，仍可作为压缩候选 |
| `spec-code-review` | 282 chars / 32 words | 已接近可接受，但需 route collision 验证 |
| `spec-compound` | 303 chars / 36 words | 边界清楚，压缩收益较低 |
| `spec-debug` | 449 chars / 68 words | 同义触发词较多，误触发和 index tax 风险都高 |
| `spec-optimize` | 549 chars / 69 words | 描述混入了执行说明，优先进入 index audit |
| `spec-doc-review` | 533 chars / 69 words | 包含调度 fallback 说明，需判断哪些必须留在路由层 |
| `retired-skill-review` | 433 chars / 53 words | 主题广，容易与 write-skill / doc-review / code-review 重叠 |

这说明现有问题不只是 `spec-code-review/SKILL.md` 正文过长。即使正文成功下沉，路由层仍可能继续付出常驻 token tax，并造成相邻 workflow 误触发。

### 10.2 外部建议的采纳边界

| 外部建议 | 采纳方式 | 边界 |
|---|---|---|
| Description is Router, not Manual | 采纳。description 只表达触发、排除、定位，不放执行步骤和长 fallback | 先在 audit rubric 和 route audit 中落地，不立即机械改全量 skill |
| Trigger + Exclude | 采纳。核心 skill 必须能说明 should trigger / should not trigger | 目前不新增 `exclude_intents` frontmatter 字段，先保留在 description / When Not To Use / audit facts |
| 30 words / 中文 50 字 | 作为 advisory budget | 不作为硬 gate。现有 `retired-skill-review` 还会把过短描述判为 under-specified |
| Token Audit + Route Audit | 采纳为 P0 measurement | audit 输出 advisory facts，LLM 判断语义充分性 |
| L0/L1/L2 分层索引 | 不作为 spec-first 自建能力 | 当前 `using-spec-first` route map 已是事实上的 L0；宿主拥有 skill discovery，不新增第二套 route truth source |
| 语义路由 / Skill 联邦 | 明确 deferred / host-owned | 当前 38 个 skill 未到必须引入向量 registry 的规模，过早做会重建宿主能力 |
| 新 Skill Index Contract | 暂不采纳为新正式 contract | 先扩展 `retired-skill-review` authoring lens；只有 audit 数据证明重复问题后再评估 contract 化 |

关键边界：`exclude_intents` 是好概念，但直接新增 frontmatter 字段会制造未被 generator、lint、host runtime 明确定义的元数据。当前项目已有测试明确强调部分 skill authoring 只期望 `name` / `description`，且现有脚本已经从 description、When To Use、When Not To Use 提取 trigger signals。更小的做法是先改善这些已有字段和评估脚本，而不是新增 schema。

### 10.3 新增的最小落地单元

在正式 implementation plan 中，可把以下内容作为当前 U1-U8 的补强，而不是替换原顺序：

| 单元 | 目标 | 产物 | 验证 |
|---|---|---|---|
| U0A Skill Index Baseline | 建立核心 skill 路由层 before 数据 | 表格：description chars/words、负向边界、相邻 workflow 引用、top overlap terms | 直接脚本统计 + `extract-trigger-signals` 类 deterministic facts |
| U0B Route Collision Fixtures | 建 20 条用户意图样例，覆盖应触发和不应触发 | eval fixtures 或 audit case docs | LLM/read-only eval 判断命中是否合理，脚本只提供样例和实际文本 |
| U7+ Audit Lens 扩展 | 把正文瘦身经验和 index 治理经验沉淀到 `retired-skill-review` | `skill-authoring-quality.md` 增加 route-index lens | contract test 断言 rubric 不变成 auto-rewriter |
| U8+ Outcome Bundle 扩展 | closeout 同时报告 body 与 index 收益 | line-count delta、context-room delta、description delta、route audit limitations | final closeout 不只报行数 |

建议 U0A/U0B 可以先随 pilot 实现前执行一次，作为 baseline；但不应阻塞 `spec-work` 的 task-pack CLI downshift，因为后者已经有明确 source evidence 和低耦合实施路径。

### 10.4 Route audit 样例集的最低覆盖

Route audit 不需要一开始做复杂语义路由。先用覆盖相邻 workflow 的小样例集，验证 description 压缩没有牺牲召回和排除能力：

| 用户意图 | 应触发 | 不应触发 |
|---|---|---|
| “把这个 PRD 拆成可执行技术方案” | `spec-plan` | `spec-work`, `spec-code-review` |
| “按这个计划开始改代码并跑验证” | `spec-work` | `spec-plan`, `spec-compound` |
| “审查这个 plan 是否可执行” | `spec-doc-review` | `spec-plan`, `spec-code-review` |
| “看这个 diff 有没有 P0/P1 风险” | `spec-code-review` | `spec-work`, `spec-doc-review` |
| “这个测试为什么失败，找根因并修” | `spec-debug` | `spec-code-review`, `spec-plan` |
| “把刚解决的问题沉淀成 reusable learning” | `spec-compound` | `spec-work`, `spec-doc-review` |
| “优化 prompt 质量，用指标迭代” | `spec-optimize` | `spec-plan`, `spec-work` |
| “审计这个 skill 的触发边界和 progressive disclosure” | `retired-skill-review` | `spec-write-skill`, `spec-doc-review` |

目标不是证明模型永远不会误判，而是让每次 description 改动都有 before/after 对照：减少误触发不能以漏掉核心触发为代价。

### 10.5 候选 description 改写方向

以下只是候选，不应直接改 source；实际落地必须先跑 route audit，再按 host runtime 投射结果验证：

| Skill | 候选方向 |
|---|---|
| `spec-plan` | `Create HOW plans for settled goals or PRDs. Exclude implementation, code review, task-pack compilation, unresolved WHAT, and runtime repair.` |
| `spec-work` | `Execute settled plans or validated task packs in-repo. Exclude unresolved WHAT/HOW, stale handoffs, scope expansion, and generated-runtime hand edits.` |
| `spec-code-review` | `Review diffs, PRs, or branches for defects and plan fit. Exclude implementation, requirements/plan review, unresolved planning, and PR creation.` |
| `spec-compound` | `Promote verified solved problems into reusable knowledge. Exclude active debugging, unresolved hypotheses, one-off summaries, and stale-learning refresh.` |
| `spec-debug` | `Find root causes and fix failing behavior. Trigger on errors, failing tests, regressions, stack traces, or issue repros; exclude review-only requests.` |
| `spec-optimize` | `Run metric-driven optimization loops for measurable outcomes. Exclude ordinary planning, one-shot implementation, and unmeasured subjective polish.` |

这些候选体现 “trigger + exclude + positioning”，但刻意不塞入完整执行方法。执行步骤仍留在 body / references。

### 10.6 成功指标的修正

原方案的成功指标偏向正文体量，需要补上 index 与 route 质量：

| 指标类型 | 指标 | 说明 |
|---|---|---|
| Body budget | `SKILL.md` line-count / word-count delta | advisory，不作唯一 gate |
| Context room | 普通任务默认加载文本减少量 | 反映给用户代码和证据的预算是否增加 |
| Index budget | description chars/words，总 index tokens | 反映常驻 token tax |
| Route precision | route collision 样例误触发下降 | 防止压缩后加载错 workflow |
| Route recall | 核心触发样例不能下降 | 防止 description 过短导致漏触发 |
| Safety retention | source/runtime、mutation、verification、handoff 边界仍可被触发读取 | 真正 completion gate |

因此，最终 closeout 应报告两组事实：正文瘦身是否让 active skill 变轻，索引治理是否让 activation 更准。缺少 route audit 时，只能声明正文瘦身已验证，不能声称 Skill Token 优化整体完成。

---

## 11. L1 路由层 token 税（补充维度）

来源：`spec-first-doc/claw/2026-07-04/AI-Skill-Token优化-spec-first借鉴/2026-07-04-ai-skill-token-optimization-spec-first-integration-report.md`（外部借鉴报告，已改写摘要）。

本方案前文聚焦 **L2 body 瘦身**（SKILL.md 正文过长）。这一章补上一个正交维度：**L1 routing 层的 description 索引税**。两者不是同一个问题。

### 11.1 两个正交的 token 轴

| | L2 body（前文） | L1 routing（本章） |
|---|---|---|
| 针对 | SKILL.md 正文（如 1,241 行） | frontmatter description 索引 |
| 成本性质 | 条件税：仅 skill 触发时付 | **无条件税：每次对话都付** |
| 影响 | 触发后挤压用户代码 context | 对话开始即占座位 |
| 解法 | 渐进式披露（body → references） | description 路由器化 + exclude + token 预算 |

### 11.2 实测数据

| 常驻加载项 | 数量 | description 词数 | 估算 token |
|---|---|---|---|
| Skills | 89（spec-first 38 + 其他） | 3,361 / 均 37 | ~4,369 |
| Agents | 51 | 1,428 | ~1,856 |
| 合计常驻 | 140 | 4,789 | **~6,200** |

对照报告规模表，当前约占 200K 窗口 3%（介于 50-skill/2.5% 与 100-skill/5% 之间）。尚未危险，但 spec-first 是持续扩张体系，此税只增不减。

实测发现：38 个 skill 中 27 个已有 exclude intent（"Do not use for..."），spec-first 在这点上领先报告的 P0-3 建议。超长 description 的真正 offender 是 `proof`（149 词）、`git-commit-push-pr`（119 词）、`spec-slack-research`（84 词）——把功能说明写进了 description。

### 11.3 关键 ownership 边界：L0/语义路由是宿主的地盘

**spec-first 的 skill 由宿主（Claude Code/Codex/Kiro...）加载，不是 spec-first 自己加载。** `src/cli/plugin.js` 只负责把 skill 投射到 `.claude/skills/`、`.agents/skills/` 等目录；何时加载哪个 description、是否懒加载、是否语义路由，**由宿主决定**。

因此报告的建议必须按 ownership 拆开：

| 报告建议 | 拥有者 | spec-first 能做 |
|---|---|---|
| description 压缩 | spec-first source | ✅ |
| exclude_intents / negative boundary prose | spec-first source | ✅（已 27/38 以 `Do not use...` 等形式表达） |
| description token audit | spec-first source | ✅ |
| L0/L1 分层懒加载 | **宿主** | ❌ 重建 host skill discovery |
| 语义向量路由 registry | **宿主** | ❌ 重建 host skill matching |
| Skill 联邦 | **宿主** | ❌ 重建 host 架构 |

这直接呼应角色契约"宿主 primitive 正在商品化，不要重建宿主即将免费提供的能力"。**明确拒绝**报告的 P1（L0 域索引）与 P2（语义路由/联邦）——spec-first 自建就是造轮子。

### 11.4 报告 P0-1 与 4.2 的内部冲突：对 spec-first 选 exclude

报告 P0-1 要求 description 压到 30 词 / 50 字，但 4.2 又说 spec-first 需要"触发 + 排除"。对 spec-first 这两条冲突：

- spec-first 有 `spec-plan / spec-work / spec-code-review / spec-doc-review / spec-compound` 五个边界相邻 workflow
- 报告举例"review 这份计划"会同时命中 `spec-code-review` 和 `spec-doc-review`——spec-first 的碰撞面比报告假设更严重（报告只知一个 review skill，spec-first 有两个）
- 为凑 30 词砍掉 exclude intent，恰恰砍掉防误触发的关键

**Resolution**：对 spec-first，预算单位不是裸 30 词，而是"trigger + exclude + 定位三段各自最短"。exclude intent 是值得付的 token（报告原则 #10：误触发比漏触发更伤）。要压的是把功能说明写进 description 的长 offender，不是砍 workflow 的 exclude 边界。

### 11.5 统一 token hygiene 模型（带 ownership 边界）

```
L0 语义/域路由     → 宿主拥有，spec-first 不重建
L1 description     → spec-first 拥有：压缩冗长 offender + 保留 exclude + token 预算 lint
L2 SKILL.md body   → spec-first 拥有：渐进式披露（1-9 章）
L3 references      → spec-first 拥有：按需加载
```

### 11.6 本章给 plan 补的三件遗漏事项

1. **L1 description 审计单元**：现有 plan 只做 L2 body。补一个单元审计并压缩超长 description（proof/git-commit-push-pr/spec-slack-research），**保留 exclude intent**，不砍 workflow 边界。
2. **新增 skill 的系统级治理**（报告原则 #11）：扩展 `lint-skill-entrypoints` / `retired-skill-review`，新增/改 skill 时检查 description 长度、是否有 exclude、是否与现有 skill 高重叠。这是"新增 skill 是体系变更，不是孤立文件"。
3. **route collision 测试集**：plan/work/review/doc-review/compound 边界相邻，误触发真实存在。建 eval fixture：20 条典型请求断言命中正确 workflow。这比 body 行数更能证明"精简没破坏路由"。

**边界重申**：不建 L0 域索引引擎，不建语义向量 registry——宿主职责，重建即反模式。
