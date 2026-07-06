---
doc_role: optimization-plan
review_date: 2026-07-06
reviewer: leokuang (Kiro session)
relates_to:
  - docs/项目审查/2026-07-06-真实状态与提升优先级.md
  - docs/10-prompt/结构化项目角色契约.md
  - scripts/lint-skill-entrypoints.config.json
limitations: |
  基于当前 worktree 的 skill 源文件、lint 配置、contract 测试直接取证。
  行数/字数为实测。未运行真实宿主内 workflow 验证精简后的语义行为，语义等价性判断为待验证。
---

# Skill Prompt 精简优化方案（2026-07-06）

## 0. 结论先行

spec-first 的 38 个 skill 共 10,628 行 prompt，其中最重的 `spec-code-review`（1,241 行 / 18,388 词）在每次 review 调用时全量注入 LLM context。**项目内已有一个经过 contract 测试验证的精简模式——`spec-plan` 的 "STOP. Before X, read references/Y.md" 惰性引用模式**。本方案的核心是：把这个已验证模式推广到其余重型 skill，而不是发明新机制。

- **Goals**：降低主 SKILL.md 每次注入的 token 量；把只在特定阶段/条件触发的 prose 移到按需加载的 references；保持语义等价。
- **Non-goals**：不改变 workflow 行为语义；不删除治理边界（只是移位置）；不新增 skill/agent；不改 CLI。

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

核心收益不是"文件变短"这个数字本身，而是：
- **LLM 每次调用有更多 context 预算分给用户的实际代码**
- **主文件更接近 workflow 骨架，可读性和可维护性提升**
- **真正兑现 deterministic floor 哲学（校验归脚本）**

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
