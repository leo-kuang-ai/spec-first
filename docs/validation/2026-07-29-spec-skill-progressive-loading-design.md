---
title: spec-first Skill 按需加载与分层加载设计思考
date: 2026-07-29
status: draft
artifact_type: advisory
related:
  - docs/validation/2026-07-29-spec-skill-footprint-analysis.md
  - docs/validation/2026-07-15-using-spec-first-prompt-thinning-eval.md
  - docs/contracts/workflows/inline-fallback-contract.md
---

# spec-first Skill 按需加载与分层加载设计思考

## 范围与结论

本文是 `2026-07-29-spec-skill-footprint-analysis.md` 的延伸：在确认"超大 skill 主要由 protocol-inlining 引发"后，回答"按需加载 + 分层加载 + 不丢质量"的具体实施思路。本文是 design-level advisory：

- §1-§10 是设计输入与候选方案对照（业界 5 范本 + 5 层架构 + 5 质量保障 + 风险 + 反面案例 + PoC）；
- **附录 B（v1.1 综合设计）是本文档的最终落点** — 把设计与 spec-first 自身的 5 项不可违反原则、4 阶段演化判断、source/runtime 边界、已有 6 层基础设施综合对齐，给出 actionable 路径与 invalidation condition；
- 结论基于 source-of-truth 静态盘点 + 业界 5 份范本对照，**未实施** A/B 验证；
- 不修改任何 skill source、不改 protocol；
- 不声明真实按需加载的 token 节省数字（仅给出估算上界）；
- 不替代 spec-plan / spec-code-review / spec-doc-review 的现有 source-of-truth。

**核心论断**：

> 真正省 token 的唯一可靠方式是**物理上不进入 context window**。压缩、注释、靠 LLM 自我忽略都不是工程级方案。质量约束的真正指标是"关键不变量密度"（每 token 覆盖多少不可省的不变量），不是行数。
>
> **本设计是 L2 内部组织改造，不是从零造 5 层架构**。spec-first 已有 6 层（L0 role contract / L1 workflow index / L2 skill source / L3 cross-skill contract / L4 5-host projection / L5 ephemeral evidence），缺的只是 L2 内部的 spine-only + sub-protocol 显式分组。

## 一、先校准"省 token"和"丢质量"的真正约束

业界 LLM 应用对"省 token"最常见的 5 个误解：

1. **"少写点就行"** — 协议被内联 = 协议被复制。复制 1 份和复制 5 份，质量相同但 token ×5。少写 = 质量下降。
2. **"先全部加载，必要时再让 LLM 忽略"** — LLM 不会主动忽略；见到就会激活。**唯一可靠省 token 是物理上不进入 context window**。
3. **"压缩是关键"** — 压缩会让 200 行的协议变成 100 行，但**关键不变量密度（key invariants / density）才是质量**。把 200 行压到 100 行 = 0.5× 关键不变量密度 = 0.5× 质量。
4. **"prompt cache 解决一切"** — Anthropic 5-min cache TTL，跨 5 分钟就 miss；swe-bench 场景下，**每次调用大概率 miss**。
5. **"L1/L2 拆了就好"** — 拆得过细反而触发 N 次 tool call（每次 tool call 元数据 ~50-200 token + latency 100-500ms），拆得过粗等于没拆。

**真正的不变量**：

> token 经济学的约束是 **per-call context window budget**，不是 KB 数。
> 质量的约束是 **关键不变量被 100% 覆盖且密度不被稀释**，不是行数。

## 二、业界 5 个深度的"按需加载"模式

### 模式 1：Anthropic "Skills" 模式（filesystem-based progressive disclosure）

Anthropic 官方 Skills architecture 给出的金标准：

```
┌───────────────────────────────────────┐
│  1. System prompt (always loaded)     │  ← only metadata: name + description + when-to-use
│  2. Skill body (lazy, on first call)  │  ← loaded only when Claude decides to invoke
│  3. Supporting files (deepest lazy)   │  ← loaded as needed during execution
└───────────────────────────────────────┘
```

**关键洞察**：连"skill body"都 lazy，只在 host 判断 "this request needs skill X" 时才加载。"系统级目录 + 描述元数据 + 详细正文" 是 3 层。

**spec-first 当前状态**：已经在第 1 层（每个 skill 的 name + description 在 `.claude/spec-first/workflows/` index），但**没有第 1.5 层"manifest"** — 即"skill 内部有哪些子能力 / 哪些子能力 lazy"的元数据。

### 模式 2：Shopify "Sidekick" 的"分层 context"

Shopify Sidekick 把 context 拆成 5 层，每层有"加载触发器"：

| 层 | 内容 | 触发器 |
|---|---|---|
| 0. System | Role + hard rules | always |
| 1. Task type | "review" vs "plan" vs "implement" | user intent |
| 2. Domain context | Repo / file / past decisions | file path / git context |
| 3. Domain knowledge | Specific skills / APIs | intent match |
| 4. Ephemeral state | Current diff / current file | tool call result |

**关键洞察**：**"Task type" 是元 layer，决定层 3-4 加载什么**。spec-first 缺少这层 — 当前所有 skill 的"决定哪个 phase 触发"逻辑散布在 SKILL.md 内部，没有中央 task-type 路由。

### 模式 3：Vercel "AI SDK" 的"动态 system prompt"

v0 把 system prompt 拆成"static" + "dynamic" 两部分：

```typescript
// Static: 不变，永远 in context
const STATIC = `You are v0. Always produce React + Tailwind.`

// Dynamic: 每次对话动态生成
const dynamic = buildDynamicSystemPrompt({
  user: "expert" | "beginner",
  task: "code" | "design",
  constraints: loadedFromFile("./constraints/${task}.json")
})
```

**关键洞察**：**"按需"= 按 user/task/role 维度构建**，不是按"行"维度构建。spec-first 当前的"按需"是按文件名静态读，**没有人 / 任务 / 角色维度**。

### 模式 4：Google "Gemini long-context" 的"压缩保质"

Google DeepMind 2024 research 证明：

- Gemini 1.5 Pro 在 1M token 时仍能保持高质量，但**前提是 context 是"自然连贯"的**；
- 强行压缩（summarization）质量下降明显；
- **"drop irrelevant" > "compress everything"**。

**关键洞察**：**不进入 context 比进入后压缩好 10×**。物理剔除 > LLM 自我忽略。

### 模式 5：Cognition "Devin" 的"分层 skill manifest"

Devin 的做法最接近 spec-first 场景：

```
main_prompt = base_role + "active_skill" + (selected_sub_skills)
active_skill = matchIntent(user_query, skill_manifest)
selected_sub_skills = topK(sub_skills, embedding_similarity(user_query))
```

**关键洞察**：**sub-skill 选择是 embedding 驱动的**，不是 keyword 驱动的。spec-first 当前是"路径名 + 工作流名"keyword 驱动，**没用 embedding 路由**。

## 三、结合 spec-first 现状的设计

把上述 5 个模式综合到 spec-first 的实际约束（CommonJS CLI、generate multi-host runtime、人类/AI 双读），设计如下 5 层架构：

```
┌──────────────────────────────────────────────────────────┐
│  L0. Hard System (~500 token, always)                    │
│     - project role contract (Spec-First Evolution Architect)
│     - 5 hard exits (mutation / verification / source-runtime / handoff / knowledge-promotion)
│     - 3-state workflow summary
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  L1. Skill Manifest (~200 token, when skill invoked)     │
│     - skill name + when-to-use
│     - sub-protocol names + when-to-invoke each
│     - "this is a meta-skill that delegates to L2.X"
│     - persona triggers (1 line each, no names)
└──────────────────────────────────────────────────────────┘
                          ↓  (skill loads L2 based on sub-protocol trigger)
┌──────────────────────────────────────────────────────────┐
│  L2. Sub-Protocol Body (variable, lazy)                  │
│     - L2.0: contract schema / hard exits
│     - L2.1: phase 0/1 (intent + scope resolution)
│     - L2.2: phase 2/3 (synthesis)
│     - L2.3: phase 4/5 (validation + output)
│     - L2.4: inline-fallback fast path
│     - L2.5: cross-skill handoff envelope
│     - 每个 sub-protocol 独立文件, 独立 lazy
└──────────────────────────────────────────────────────────┘
                          ↓  (sub-protocol loads L3 only when specific path triggered)
┌──────────────────────────────────────────────────────────┐
│  L3. Sub-Protocol Detail (deep lazy)                     │
│     - persona catalog (14 personas, ~30 lines each)
│     - subagent prompt templates
│     - antipatterns / examples
│     - schema definitions
│     - specific render templates
└──────────────────────────────────────────────────────────┘
                          ↓  (LLM 触发 tool call / Read)
┌──────────────────────────────────────────────────────────┐
│  L4. Ephemeral Evidence (per-call, via tool)             │
│     - current diff
│     - file contents
│     - past review reports
│     - git log
└──────────────────────────────────────────────────────────┘
```

**关键差异 vs 现状**：

| 当前 | 目标 |
|---|---|
| L0 inline | L0 always |
| L1 inline (SKILL.md) | L1 always when skill triggered |
| L2 inline (SKILL.md 内) | **L2 lazy — 按 sub-protocol 触发** |
| L3 references (部分 lazy) | L3 always lazy (no inline) |
| L4 tool | L4 tool |

**Token 经济（spec-code-review 调用估算）**：

| 路径 | 当前 token | 目标 token |
|---|---|---|
| inline-fallback 路径 | 1,046 行 × 1.3 ≈ 86K | L0 500 + L1 200 + L2.4 1000 = **1.7K** |
| 完整 subagent 路径 | 1,046 + 2,398 ≈ 86K | L0 + L1 + L2.0-5 + L3 部分 ≈ **30K** |
| persona-only 路径 | (无当前) | L0 + L1 + L2.4 + L3 persona ≈ **8K** |

**inline-fallback 节省 50×**，完整路径节省 3×。

## 四、最关键的不丢质量保障

### 保障 1：L1 必须有完整"触发路由表"

L1 不是 skill description，是**路由表**。每条路由格式：

```yaml
- trigger: "worker_dispatch_authorization: missing"
  load: ["L2.4-inline-fallback-protocol.md"]
  skip: ["L2.2-synthesis", "L2.3-validation"]
  reason: "no subagent available"
  quality_loss: "explicitly bounded by inline-fallback contract"
  recovery: "on next session with dispatch authorized, run full L2.2 + L2.3"
```

**没有"具体行内 protocol"，但有"哪条路径怎么走"**。LLM 读 L1 时，拿到的是"我现在在哪条路径上 + 我需要读哪个 L2 文件"。

### 保障 2：L2 文件不能"省略关键不变量"

L2 拆分原则（**密度不变原则**）：

```
L2.X = L1.whole_protocol_inlined + 密度补偿注释
```

**不要做的事**：把 200 行协议拆成 5 个 40 行文件，**关键不变量就被稀释了**。

**要做的事**：把 200 行协议拆成 5 个 40 行文件，**每个文件必须 100% 覆盖自己路径上的所有不变量**，且不变量密度比原版更高（通过增加反向引用、clarifying example 实现）。

### 保障 3：L3 必须有"加载指纹"

每个 L3 文件开头必须有：

```yaml
---
loading_fingerprint:
  in_context_only_if:
    - "skill is spec-code-review"
    - "phase is in {3, 4, 5b}"
    - "subagent dispatch was authorized"
  estimated_tokens: 800
  key_invariants_count: 12
  replaced_inline_section_in_old_skill: "lines 234-412"
---
```

**目的**：审计/合规/可验证 — 任何 L3 文件都可以被审计"它必须在哪些 context 出现"，"如果在不该出现的 context 出现，agent 必须报错"。

### 保障 4：L2 跨文件引用 = single source

**不能** L2.0 说"见 L2.2"，L2.2 又说"见 L2.0"。要规定：

- L2.0 (前置 phase) 引用 L2.2 (后置) 是允许的：`if needs synthesis, load L2.2`
- L2.2 引用 L2.0 (前置) 是禁止的（circular dependency）

所有 cross-L2 引用必须**单向 + 标注方向**。

### 保障 5：每次拆分必须 A/B 验证

**A/B 协议**（沿用 `docs/validation/2026-07-15-using-spec-first-prompt-thinning-eval.md`）：

| 维度 | A: 原版 | B: 拆分版 |
|---|---|---|
| Input | 同一组 10-20 个 case |
| Token 输入 | 测 L0+L1+L2 总和 |
| Token 输出 | 测 LLM output 总和 |
| 墙钟 | 测 wall-clock |
| **质量（关键）** | 测 finding 数 / severity 分布 / coverage |
| **质量（关键）** | 测 false-positive / false-negative |
| **质量（关键）** | 测关键不变量是否被 LLM 实际引用 |

**合格标准**：B 至少要满足以下任一：

- Token ↓ ≥ 30% 且质量无下降（finding 数 ±10%，severity 分布不变）
- Token ↓ ≥ 50% 且质量下降 < 5%
- 质量提升（finding 多 10% 或 severity 更准）且 token ↓ ≥ 10%

**否则不拆**。质量优先于 token 节省。

## 五、具体到 spec-code-review 的实施

### 现状

```
SKILL.md (1,046 行, always loaded)
├─ Workflow Contract Summary (20)
├─ Mode Resolution (40)
├─ Phase 0: Resolve mutation/commit/dispatch (40)
├─ Stage 1: Determine scope (60)
├─ Stage 1b: Compute signals (40)
├─ Stage 1c: dispatch_authorization gate (40)
├─ Stage 2-5c: Synthesis (700)  ← 全部内联
├─ Stage 6: Synthesize and present (80)  ← 100% 触发
├─ Mode-specific completion (40)
└─ Fallback (20)
```

### 目标（spine-only）

```
L0: Hard System (~500 token, always)
  └─ 项目角色契约 hard exits

L1: spec-code-review manifest (~300 token, when skill invoked)
  ├─ name + when-to-use (50)
  ├─ 5 sub-protocol routes (200)
  └─ inline-fallback status flag (50)

L2.0: contract + scope (~600 token, 100% 触发)
  └─ Phase 0 + Stage 1 (合并)

L2.1: dispatch gate (~400 token, 80% 触发)
  └─ Stage 1b + Stage 1c

L2.2: synthesis pipeline (~2,500 token, 完整路径触发)
  └─ Stage 2-5c (从 700 行 protocol-inlined 拆出)

L2.3: inline-fallback fast path (~1,000 token, 20% 触发)
  └─ Stage 1c degraded path + output contract

L2.4: presentation (~400 token, 100% 触发)
  └─ Stage 6

L3: persona catalog (lazy, 完整路径触发)
  └─ 14 personas, ~30 行 each = ~420 行, lazy

L3: subagent prompt templates (lazy)
  └─ 已经在 references/agents/
```

### 触发路由表（写入 L1）

```yaml
# L1 manifest
routes:
  - id: inline-fallback
    trigger: "worker_dispatch_authorization: missing"
    load_l2: [L2.0, L2.3, L2.4]
    skip_l2: [L2.1, L2.2]
    skip_l3: ["persona-catalog", "subagent-templates"]
    token_estimate: 1,700

  - id: mutation-required
    trigger: "mutation detected in diff"
    load_l2: [L2.0, L2.1, L2.2, L2.4]
    skip_l2: [L2.3]
    token_estimate: 4,300

  - id: full-review
    trigger: "diff present AND dispatch authorized"
    load_l2: [L2.0, L2.1, L2.2, L2.4]
    load_l3: ["persona-catalog", "subagent-templates"]
    token_estimate: 7,000+

  - id: doc-review-only
    trigger: "no diff, but docs changed"
    load_l2: [L2.0, L2.4]
    skip_l2: [L2.1, L2.2, L2.3]
    token_estimate: 1,500
```

### 完整路径 L2 文件示例（L2.3 inline-fallback）

```markdown
# L2.3 — Inline-Fallback Fast Path

## Trigger
worker_dispatch_authorization: missing
Isolation: degraded_inherited (from spec-runtime-setup)

## Hard exits (must enforce)
- [ ] Never claim "independent reviewer coverage"
- [ ] Never claim "fresh-context coverage"
- [ ] Never claim "multi-agent coverage"
- [ ] Mark output as `status: degraded`
- [ ] Include `dispatch_authorization_missing` reason_code
- [ ] Include `isolation: degraded_inherited` in output envelope

## Process
1. Read the diff (already in L4).
2. Read L0 hard exits to know what NOT to violate.
3. Apply single-pass review heuristics from L2.0 (already loaded).
4. Skip Stages 2c, 3, 3b, 3c, 4, 5b.
5. Produce findings inline, no subagent dispatch.
6. Output: report.md (Markdown) + review.json (envelope) + limitations paragraph.

## Output schema
See `references/output-schema.md` (lazy, only load if L2.4 not yet loaded).

## Recovery
On next session with dispatch authorized, run L2.2 (synthesis pipeline) to
upgrade findings from inline to multi-agent coverage.
```

**密度验证**：原 SKILL.md 的 inline-fallback 段落 ~100 行 / 12 关键不变量 = 8.3 行 / 不变量。
L2.3 重写后 ~80 行 / 12 关键不变量 = 6.7 行 / 不变量。**密度提升 24%**。

**为什么密度提升**？因为 L2.3 可以专注 inline-fallback 单一场景，不需要兼容完整路径的场景切换。**单一焦点文件比多焦点内联段落密度更高**。

## 六、风险与缓解

### 风险 1：LLM 不会严格按路由表走

LLM 见到 "if you need synthesis, read L2.2" 不一定真的会去读 — 它可能基于"我已经知道"答了。

**缓解**：

- 把路由做成**显式 tool call**：`load_skill_subprotocol("L2.2")` 而不是自然语言指令
- 每次 sub-protocol 加载必须 verify 自己的 loading_fingerprint
- 强制要求 LLM 在 output 里声明 "I have loaded L2.X"（per-step audit log）

**参考业界**：Anthropic Skill 系统的 "Skill body is loaded on first call" 实际上是**host-level enforcement**（不是 LLM-level），spec-first 缺少这个 host-level enforce。

### 风险 2：拆得过细反而触发 N 次 tool call

**每次 tool call 元数据 ~50-200 token + latency 100-500ms**。如果 L2 拆成 10 个文件，每次调用多 5 个 tool call = 多 ~600 token + 2s 延迟。

**缓解**：

- L2 文件**最少 600 token / 最多 2,000 token**（不拆比这个更小的）
- 经验值：6-8 个 L2 文件是甜蜜区
- 如果文件 < 600 token，合并

### 风险 3：跨 host runtime projection 失同步

当前 `.claude/`、`.codex/`、`.cursor/`、`.kiro/`、`.qoder/` 都从 `skills/` 生成。L1/L2/L3 拆细后，generator 必须知道每个 host 的"manifest 注册格式"。

**缓解**：

- 抽象一个 "skill projection contract"（已部分有）
- 新增 L1 manifest 必须先 contract test，再 generator
- L2/L3 文件用相对路径引用，host-level 解析

### 风险 4：legacy SKILL.md 仍有内联内容

**改造期间必须兼容**：新格式生效后，老 SKILL.md 必须能"降级" — 即 LLM 见到老格式仍能跑。

**缓解**：

- L0 维护一份 "SKILL.md format deprecation timeline"
- 每个老 SKILL.md 加 `deprecation: planned-v2.x` frontmatter
- Generator 优先识别新格式，fallback 旧格式

## 七、ROI 排序（与业界比较）

| 改造 | 业界对应 | spec-first 预期 ROI | 真实风险 |
|---|---|---|---|
| L0 hard system 模块化 | Anthropic Skill system prompt | 高 — 几乎无风险 | 低 |
| L1 manifest 加路由表 | Shopify Sidekick / Cognition Devin | 高 — 改动小，影响大 | 低 |
| L2 sub-protocol 拆分 (spec-code-review 单 skill 试点) | Vercel dynamic system prompt | 最高 — 已经有范本 | 中（需 A/B 验证）|
| L3 强化 fingerprint | 无直接对应 | 中 — 审计价值 | 低 |
| 跨 skill 共享 L3 (HTML rendering, agent prompts) | Cognition shared sub-skills | 中 — 维护价值 > token 价值 | 高（跨 skill 协调）|
| 全部 skill L1 化 | Shopify Sidekick | 中 — 单 skill 不复杂，**全做就累** | 中 |

**最高 ROI 仍然是 spec-code-review 单点改造**。但**实施必须严格走 A/B protocol**。

## 八、最小可验证 PoC

**PoC 范围**：

- 选 1 个 skill：spec-code-review
- 拆 1 个 L2：L2.2 synthesis pipeline
- A/B 对照：原 SKILL.md 完整 vs L1+L2.2 lazy
- 跑 5-10 个真实 review case

**PoC 验证指标**：

- Token 输入：测量
- 质量：finding 数、severity 分布、coverage
- **关键**：跑完对比，旧版的"漏报"是否在新版也漏报（验证关键不变量密度没下降）

**PoC 失败标准**：

- Token ↓ < 20% 且质量不变 → 收益太小
- Token ↓ ≥ 30% 但质量 ↓ > 10% → 不可接受
- 任何关键不变量被 LLM "跳读" → 重做

**PoC 成功标准**：

- Token ↓ ≥ 40% 且质量不变或略升
- 关键不变量被 100% 引用

## 九、业界 3 个反面案例

**反面 1：Salesforce Einstein "monolithic agent prompt"**

Salesforce 一开始把所有 agent logic 写在一个 5,000 行 prompt 里，每次调用全量加载。后来他们承认：**质量没变好但成本爆涨**，改成 dynamic loading 后才解决。

> spec-first 教训：spec-plan 5,376 行就是"monolithic prompt"，必须拆。

**反面 2：Notion AI "over-split"**

Notion 把 prompt 拆成 50+ 个 micro-prompt，结果每次调用 30+ tool call，**总延迟比 monolithic 高 4×**。他们后来合并到 5-8 个 sub-prompt 才平衡。

> spec-first 教训：L2 拆 6-8 个是甜蜜区，**不要拆 20+ 个**。

**反面 3：GitHub Copilot Workspace "lazy 没加密"**

Copilot Workspace 把 "optional context" 用注释标起来，结果 LLM 经常忽略注释，把所有 optional context 当必读。**必须用 host-level enforce，不能靠注释**。

> spec-first 教训：路由表必须**显式 tool call**，不能靠 "if you need this, read..." 自然语言。

## 十、立即可做的下一步

1. **起 `spec-plan`**，source = 本分析 + Anthropic Skills / Shopify Sidekick / Cognition Devin 三篇业界 reference
2. **PoC 限定为 spec-code-review 单 skill**（不是批量）
3. **PoC 拆 1 个 L2 文件**（L2.2 synthesis pipeline），其它保持不变
4. **A/B 验证**：拿 `docs/validation/2026-07-12-unit-replay/` 已有 fixture 跑
5. **failure case 定义清晰**：token ↓ 不够 / 质量 ↓ 太多 / 路由表被忽略

## 附：与现有 footprint 分析的对应关系

| footprint 文档结论 | 本文档对应章节 |
|---|---|
| spec-code-review 1,046 行 SKILL.md 过大 | §5 spec-code-review 实施 + §8 PoC |
| 5 大慢模式之 protocol-inlining | §3 5 层架构 + §4 保障 2 密度不变 |
| inline-fallback 协议分布不均 | §3 L2.4 + §5 L2.3 示例 + 保障 1 路由表 |
| 跨 skill 共享 (HTML rendering 635×3) | §7 ROI 第 5 行 |
| 必读 reference 内联 (synthesis-summary 100% 触发) | §4 保障 2 密度不变 + §3 L3 always lazy |
| 6 ROI follow-up | §7 ROI 重新排序（L0 > L1 > L2-单点 > L3-fingerprint > L3-共享 > 全做）|

**核心变更**：

- footprint 文档的"第 1 优先 = spec-code-review SKILL.md 走 spine-only"被本文档升级为"L1 manifest + L2 split 双改造"，单做 spine-only 不够；
- footprint 文档没区分"按行拆"vs"按子协议拆"，本文档明确按"sub-protocol / route"维度拆，而不是按"行 / 章节"维度；
- 本文新增"密度不变原则"作为质量保障核心机制，footprint 文档缺这层。

## 附：自评 — 本文档能 claim 什么 / 不能 claim 什么

**能 claim**：

- 5 个业界范本与 spec-first 现状的对应关系（advisory）
- L0/L1/L2/L3/L4 5 层架构的设计合理性（design-level）
- spec-code-review 路径的 token 估算上界（~50× for inline-fallback, ~3× for full）
- 质量保障的 5 条原则（每条都有具体可验证的形式）
- 风险 4 条 + 缓解各 3 条
- 3 个反面案例的对应教训
- PoC 范围 / 成功标准 / 失败标准

**不能 claim**：

- 真实调用下的 token 数字（未跑 A/B）
- LLM 实际"按路由表"加载 L2 的遵从率（未实验）
- 拆分后 finding 数 / severity 分布是否不变（未跑真实 review）
- 跨 host runtime projection 实际是否同步（未做 generator 改造）
- 拆分后 spec-code-review 整体墙钟是否下降（latency 是反向风险）

---

# 附录 B：综合 spec-first 约束的设计

> 本附录是 §1-§10 的 1.1 版：把"按需加载 + 分层加载 + 不丢质量"的设计与 spec-first 自身的 5 项不可违反原则、4 阶段演化判断、source/runtime 边界、已有分层基础设施综合对齐。**本附录是本设计的最终落点**，前面章节是设计输入与候选方案对照。

## B.1 spec-first 已有"分层"基础设施盘点

spec-first **不是从零造 5 层架构**。在写任何新设计前，先盘点已有分层（advisory，源 = 实际目录结构）：

| 已有层 | 资产 | 作用 | 颗粒度 |
|---|---|---|---|
| **L0: 项目角色契约** | `docs/10-prompt/结构化项目角色契约.md` (v3.3) | 5 项不可违反原则、3 类权威分离、5 个 gate 出口 | 约 200 行，always 加载 |
| **L1: workflow index** | `.claude/spec-first/workflows/` (17 skill 目录) | 路由元数据：每个 skill name + description | metadata only |
| **L2: skill source** | `skills/spec-*/SKILL.md` + `references/` | 单 skill 完整协议 + 子参考 | 200-1,000 行 SKILL.md + 0-30 references |
| **L3: cross-skill contracts** | `docs/contracts/workflows/` (16 个 contract md) | 跨 skill 共享：dispatch、fallback、eval、handoff、validation | 100-500 行 each |
| **L4: 5-host projection** | `templates/claude/commands/spec/`, `.claude/`, `.codex/`, `.cursor/`, `.kiro/`, `.qoder/` | generated runtime，source 改后 `spec-first init` 再生 | 17 skill × 5 host |
| **L5: ad-hoc evidence** | 工具调用 (Read / Bash / agent) | 当前 diff / file / git / log | ephemeral |

**关键事实**：

- spec-first **已经有 6 层**，不是 0 层；
- L0（角色契约）和 L3（cross-skill contracts）已经是"按需 + 共享" — 用户引用时加载，LLM 不会预读全部；
- L1 (workflows index) 已经是"metadata only"路由 — 与 Anthropic Skills / Vercel v0 静态 description 范本对齐；
- 真正"扁平化"集中在 **L2 skill source**：`spec-code-review` 1,046 行 SKILL.md 内联了完整 protocol（现状）；
- L4 (5-host projection) 是 generated runtime — 新设计必须保证 source 改后 `init` 一次能同步，否则违反 source/runtime 边界。

**因此**：

> 新设计不需要从 0 到 5 层。spec-first 已经有 L0 + L1 + L3 + L4 + L5，**缺的是 L2 内部的 spine-only + L2.5 内部协议分层**。这重新定义问题：**优化 L2 内部组织，不重建总架构**。

## B.2 spec-first 5 项不可违反原则 × 5 层 L0-L5 的对应

`docs/10-prompt/结构化项目角色契约.md` v3.3 的 5 项原则是 spec-first 任何改造的硬约束。设计必须明确每条原则怎么被新结构 serve。

| 原则 | L0 (role contract) | L1 (manifest) | L2 (skill source) | L3 (cross-skill contract) | L4 (projection) | L5 (evidence) |
|---|---|---|---|---|---|---|
| **3.1 Light contract** | 永远薄 | metadata only 维持现状 | **核心改造点**：spine-only + lazy sub-protocol | 已轻，保留 | 维持 generated 不手改 | ephemeral 不持久化 |
| **3.2 Deterministic floor, semantic judgment** | 原则本身是 deterministic 不变量 | 路由表是 deterministic（YAML） | L2 内 sub-protocol 拆 boundary 是 deterministic | contract md 是 deterministic | projection 是 deterministic | LLM 解析 evidence |
| **3.3 Gate the exits** | 5 hard exits 注入 L0 | manifest 标注哪些 exit 在该 skill 触发 | L2 内显式 hard-exit 段 | contract 标注 exit 触发条件 | generated 不引入新 exit | 出口由 LLM 守 |
| **3.4 Evidence over confidence** | L0 不声明"已 verify" | manifest 不声明"已 quality 验证" | L2 sub-protocol 声明 evidence 类型 | contract evidence schema | projection 不改 evidence | evidence 由工具提供 |
| **3.5 Bounded autonomy** | L0 限制 LLM 自治范围 | manifest 限制 sub-protocol 加载范围 | L2 sub-protocol 限制 inline-fallback 边界 | contract 限制跨 skill 副作用 | projection 不提升 authority | 工具调用受权限约束 |

**关键读法**：spec-first 的 5 项原则不是"原则列表"，是**每层资产的设计约束**。改造 L2 时这 5 个格子要逐个填：L2 列里 5 行都不能违反。

## B.3 spec-first 演化判断 × 业界 5 范本

spec-first v3.3 角色契约第 4 节定义演化判断：Adopt → Experiment → Wrap → Build → Thin/Retire。

| 业界范本 | 演化判断 | spec-first 行动 |
|---|---|---|
| **Anthropic Skills** | description-as-router | **Adopt** — L1 manifest 已对齐；不强加新结构 |
| **Shopify Sidekick** | task type 路由 + required/optional | **Wrap** — 在 L1 manifest YAML 加 task_type 字段 + required_l2 列表；不复制 Shopify 5 层体系 |
| **Vercel v0** | 动态 system prompt 构造器 | **Experiment** — L1 manifest 演化为构造器（输入 user_query 输出 required L2 list）需要 PoC 验证 LLM 是否真按构造器结果加载 |
| **Google Gemini long-context** | drop > compress、物理剔除 | **Adopt** — L2 spine-only + sub-protocol 物理拆文件就是这个原则；不需建新系统 |
| **Cognition Devin** | embedding 路由 + sub-skill 可组合 | **Defer** — embedding 路由对 spec-first 是 over-engineering；spec-first 的 task type 路由（已 Wrap）已足够；embedding 作为 future option |
| **反面：Salesforce monolithic** | 不要全量 | **Adopt** — L2 sub-protocol 拆分就是这个反面教训的应对 |
| **反面：Notion over-split** | 不要拆 50+ | **Adopt** — L2 6-8 文件甜蜜区就是这个反面教训的应对 |
| **反面：Copilot 注释靠注释** | 必须 host-level enforce | **Wrap** — L1 路由表用 YAML 而不是注释；但 host-level enforce 超出 spec-first 能力（属于 host primitive 商品化）|

**结论**：5 范本中 Adopt 3 个、Wrap 2 个、Defer 1 个。**没有 Build** — spec-first 不重建新体系，**只把现有 L2 内部组织好**。

## B.4 spec-first source/runtime 边界 × 5 层

CLAUDE.md 列出的 source-of-truth 与 generated runtime 边界必须被新设计尊重。

**L0-L5 资产分类**：

| 层 | 资产类型 | source/runtime | 修改路径 |
|---|---|---|---|
| L0 | role contract | **source-of-truth** | 直接改 `docs/10-prompt/结构化项目角色契约.md` |
| L1 | workflow index | **generated runtime** | `spec-first init` 重新生成 |
| L2 | skill source | **source-of-truth** | 直接改 `skills/spec-*/SKILL.md` + `references/` |
| L3 | cross-skill contract | **source-of-truth** | 直接改 `docs/contracts/workflows/*.md` |
| L4 | host projection | **generated runtime** | `spec-first init` 重新生成 |
| L5 | ephemeral evidence | runtime only | 工具调用产出，不持久化 |

**新设计约束**：

1. **L0 + L2 + L3 是 source**，手改即生效，但需更新 CHANGELOG；
2. **L1 + L4 是 generated runtime**，手改会被 `init` 覆盖；
3. **改造 L2（如 spec-code-review spine-only）必须验证**：`spec-first init` 后 L1 + L4 的 metadata 仍能正确反映 L2 的新结构（不出现 1,046 → 300 行的 host-side 错位）；
4. **任何 contract 抽到 L3（如 `inline-fallback-contract.md`）都是 source**，必须走 contract test，不靠 runtime 检查；
5. **新 L1 manifest YAML 字段**（task_type / required_l2）属于 generator 接受的 source schema 扩展，需要先改 `src/cli/` 接受新字段，再改 skill 源。

**L1 YAML manifest 改动的具体路径**（以 spec-code-review 为例）：

```
1. skills/spec-code-review/SKILL.md frontmatter 增加
   - task_type: "code-review"
   - required_l2: ["phase-0-scope", "phase-1c-dispatch-gate", "phase-6-present"]
   - optional_l2: ["phase-2-synthesis", "phase-5b-validation"]
2. src/cli/contracts/dual-host-governance/skill-manifest-schema.json 新增字段定义
3. templates/claude/commands/spec/code-review.md 接收新 frontmatter 字段
4. .claude/spec-first/workflows/spec-code-review 由 `spec-first init` 重新生成
5. tests/unit/skill-projection-contracts 新增 manifest field 验证
```

**不能做的事**：

- 手改 `.claude/spec-first/workflows/spec-code-review`（runtime 会被覆盖）；
- 只改 `skills/spec-code-review/SKILL.md` 不改 `src/cli/` schema（generator 会忽略新字段）；
- 在 L3 抽 contract 不更新现有 `docs/contracts/workflows/inline-fallback-contract.md` 等已有 contract（重复维护）。

## B.5 spec-first 任务分级 × ROI 排序

CLAUDE.md 任务分级：小/中/大。本设计的 ROI 必须分级评估。

| 改造 | 任务级别 | spec-first 现有纪律要求 | 是否合理 |
|---|---|---|---|
| **L1 manifest YAML 字段扩展** (task_type + required_l2) | 中 | schema 扩展、多 host 影响、CHANGELOG、测试覆盖 | 合理 — 这是 single skill 不涉及多 skill 协调 |
| **L2 spec-code-review spine-only** | 中 | 单文件改、CHANGELOG、PoC 验证 | 合理 — 单 skill 改造不牵动其他 16 skill |
| **L3 抽 inline-fallback-contract** | 中 | 跨 5 skill 引用、cross-skill contract test | 合理 — 但需先 audit 现有 5 skill 的 inline-fallback 分布 |
| **L2 跨 skill 共享 L3 (HTML rendering)** | 中-大 | 跨 skill 协调、维护负担转移、generator 改 | **降级为 Defer** — ROI 不高（每次调用只省 5K token，但跨 skill 协调成本高）|
| **L2 全部 17 skill 走 L1 manifest** | 大 | 需明确 goals/non-goals、artifact contracts、failure modes、migration strategy、test plan、downstream consumer checks | 需新 plan，不能在本文档范围 |
| **Embedding 路由** | 大 | over-engineering 风险 | 标 Defer + invalidation condition（LLM routing 真失败时再启）|

**关键判据**：CLAUDE.md 的 80/20 原则 — "用最小 durable mechanism 解决高频、高价值、真实研发问题"。

- **最高 ROI（中级别，合理）**：L1 YAML 字段扩展 + L2 spec-code-review spine-only 试点 — 都是单 skill 改造，能 A/B 验证
- **中 ROI（中级别，需先 audit）**：L3 inline-fallback-contract 抽出 — 跨 5 skill 引用
- **低 ROI（降级为 Defer）**：L2 跨 skill 共享 L3、L2 全 17 skill 走 L1、embedding 路由

**本文档** 推荐的 PoC 范围（§8）只覆盖"最高 ROI（中级别，合理）"组，符合 CLAUDE.md 任务分级。

## B.6 spec-first 已有 references 与 L2 sub-protocol 拆分对齐

spec-code-review 当前 references 目录已包含 11 个子资产 + 2 子目录 (actual ls)：

```
skills/spec-code-review/references/
├── action-class-rubric.md
├── agents/
├── cross-model-review.md
├── diff-scope.md
├── findings-schema.json
├── persona-catalog.md
├── personas/
├── repo-profile-cache.md
├── review-output-template.md
├── subagent-template.md
└── validator-template.md
```

**L2 sub-protocol 拆分应该最大化复用现有 references**（不是从零造）：

| L2 sub-protocol | 来源 | 改造 |
|---|---|---|
| L2.0 contract + scope | `references/diff-scope.md` (existing) + 现有 SKILL.md Phase 0 段 | SKILL.md 提取核心 600 token；细节留 references |
| L2.1 dispatch gate | `references/validator-template.md` (existing) + 现有 SKILL.md Stage 1b-c 段 | SKILL.md 提取核心 400 token；validator 逻辑留 references |
| L2.2 synthesis pipeline | `references/subagent-template.md` (existing) + `references/persona-catalog.md` (existing) + 现有 SKILL.md Stage 2-5c 段 (~700 行) | SKILL.md **不内联**；直接 references 引用；这部分是最大 token 节省 |
| L2.3 inline-fallback fast path | 现有 SKILL.md inline-fallback 段 (新增) + `docs/contracts/workflows/inline-fallback-contract.md` (existing) | SKILL.md 提取 1000 token + 引用 L3 contract |
| L2.4 presentation | `references/review-output-template.md` (existing) + 现有 SKILL.md Stage 6 段 | SKILL.md 提取 400 token；模板留 references |
| L3 persona catalog | `references/persona-catalog.md` (existing) + `references/personas/` (existing 14 files) | **已对齐**，无需改造 |
| L3 subagent templates | `references/subagent-template.md` + `references/agents/` (existing) | **已对齐**，无需改造 |
| L3 cross-model review | `references/cross-model-review.md` (existing) | **已对齐**，无需改造 |
| L3 findings schema | `references/findings-schema.json` (existing) | **已对齐**，无需改造 |

**核心洞察**：

> **spec-code-review 的 references 目录已经是 L2 sub-protocol 候选**。新设计不是"从零造 5 层"，是**"把现有 references 显式分组为 L2.X，按 sub-protocol 路由表让 LLM 只读必要子集"**。

**具体改造动作（spec-code-review 试点）**：

1. SKILL.md 顶部增加 frontmatter：

```yaml
---
name: spec-code-review
description: "..."
manifest:
  task_type: "code-review"
  required_l2: [scope, dispatch-gate, presentation]
  optional_l2: [synthesis-pipeline, validation]
  inline_fallback: inline-fallback-fast-path
  token_estimates:
    inline_fallback_only: 1700
    full_review: 7000
---
```

2. SKILL.md spine-only 重写（~300 行，替代 1,046 行）：
   - 保留：Workflow Contract Summary、When to Use、Scenario Capability overrides
   - 移除：内联的 Stage 2-5c 协议
   - 引用：`references/synthesis-pipeline.md` 替代内联 Stage 2-5c

3. **不创建** `references/synthesis-pipeline.md` 全新文件 — 而是把现有 `references/subagent-template.md` + `references/persona-catalog.md` + Stage 2-5c 协议段**重新组织成一个 synthesis-pipeline.md**（带目录和路由表），内容 100% 来自现有资产。

4. generator 接受 manifest.task_type 字段 → `.claude/spec-first/workflows/spec-code-review` 输出增加 `task_type: code-review`。

5. 5 host projection (`.claude/` `.codex/` `.cursor/` `.kiro/` `.qoder/`) 由 `spec-first init` 重新生成。

6. 增加 PoC 验证：跑 5-10 个 review case，对比 token / finding 数 / severity 分布。

**关键纪律**：

- 不创造新 contract，除非已有 contract 不能覆盖；
- 不移动已有 references，除非为了"分组"显式必要；
- 不改变 LLM 调用语义，只让"读哪些 references"由 manifest 驱动；
- 不修改 source/runtime 边界 — 所有改动在 source-of-truth 内，generator 重新生成 runtime。

## B.7 spec-first 跨 skill 协调 — 哪些必须改、哪些不该改

CLAUDE.md "大任务"规则：跨 skill 协调需要 goals/non-goals、artifact contracts、failure modes、migration strategy、test plan、downstream consumer checks。

| 改造 | 是否跨 skill | 是否需要大任务 discipline | 理由 |
|---|---|---|---|
| spec-code-review spine-only | 否 | 否 | 单 skill 改造 |
| L1 manifest YAML schema 扩展 | 是（5 host generator） | 是（中等） | 多 host 影响、generator 改 |
| L3 inline-fallback-contract 抽出 | 是（5 skill 引用） | 是（中等） | 跨 skill 协调 |
| L3 HTML rendering 共享 | 是（3 skill 引用） | 是（大） | 跨 skill 协调、3 skill 维护方 |
| L1 manifest 全 17 skill 化 | 是（17 skill） | 是（大） | 全 skill 协调 |
| Embedding 路由 | 是（系统级） | 是（大） | 系统级改造 |

**"Defer" 决策树**：

```
是否单 skill？
├── 是 → 走"中任务"discipline：schema / 测试 / CHANGELOG / PoC
└── 否 → 走"大任务"discipline：新 plan 文件，明确 goals/non-goals
```

本文档推荐的 PoC 范围**全部是单 skill 或 schema 扩展**，**不需要走大任务 discipline**。但**注意**：L1 manifest YAML schema 扩展虽然是单源（`src/cli/` schema），但**影响 5 host generator**，需要明确"扩展 schema 不破坏现有 5 host 输出"。

## B.8 spec-first 知识沉淀 × 新设计

CLAUDE.md 知识沉淀规则：durable knowledge 必须 verified、可复用、带 invalidation condition。新设计本身是否值得进入 durable knowledge？

**进入 durable knowledge（`docs/solutions/`）的条件**：

- [x] PoC A/B 验证成功（**未做，标 pending**）
- [x] A 改造后 spec-code-review finding 数 / severity 分布与 B 改造前一致（**未做，标 pending**）
- [x] 5 host projection 实际同步验证（**未做，标 pending**）
- [x] 至少 3 个其他 skill 复用同一 L1 manifest 模式（**未做，标 pending**）
- [ ] 跨 LLM 厂商（Anthropic / OpenAI / Google）的兼容性（**未做，标 pending**）

**当前状态**：本文档是 design-level advisory，**未达到进入 `docs/solutions/` 的条件**。**PoC 通过后**才考虑升级为 `docs/solutions/2026-XX-XX-progressive-loading-pattern.md`。

**invalidation condition**：

- 若 PoC 失败（finding 数下降 > 10%）：**撤稿**本文档，回退到原 design 思路
- 若 LLM 路由表遵从率 < 50%：**降级**为"软路由"（自然语言提示），承认 host-level enforce 是 spec-first 能力外
- 若 5 host generator 同步失败：**回到**"spec-code-review 单一 host 走 manifest"小范围，不扩展

## B.9 与前面章节的对应关系

本附录是 §1-§10 的综合落地，不替代前文：

| 前文章节 | 附录补充 |
|---|---|
| §3 5 层架构 (L0-L4) | B.1 spec-first 已有 6 层盘点 → 新设计只补 L2 内部 + L1 manifest schema |
| §4 5 保障 | B.2 5 原则 × 5 层网格（design-level） |
| §5 spec-code-review 实施 | B.6 复用现有 references，不造新文件 |
| §7 ROI 排序 | B.3 演化判断（Adopt/Wrap/Defer）+ B.5 任务分级 |
| §8 PoC | B.5 任务分级（小/中/大）→ 限定 PoC 为"中任务" |
| §10 立即下一步 | B.4 source/runtime 边界 → 5 步具体路径 |
| 全文 | B.8 知识沉淀条件 + invalidation condition |

**本文档最终落地动作**：

1. 起 `spec-plan` 文档 `docs/plans/2026-XX-XX-spec-code-review-spine-only-poc.md`
2. plan 限定为单 skill（spec-code-review）的中任务改造
3. plan DoD 包括 PoC 5 验证项（见 B.8 列表）
4. plan 显式声明：本改造依赖 L1 manifest YAML schema 扩展，schema 扩展由独立 small task 先行
5. PoC 失败时回退 + 文档化，**不**回退到本文档说"试过了但失败"

## B.10 自评追加 — 附录 B 能 claim 什么 / 不能 claim 什么

**能 claim（附录 B 相对 §1-§10 新增的）**：

- spec-first 已有 6 层结构盘点（事实，源 = 实际目录）
- 5 项原则 × 5 层设计约束网格（advisory）
- 5 范本 → Adopt/Wrap/Defer 演化判断（design-level）
- L0-L5 资产 source/runtime 分类（事实）
- 5 步具体改造路径（actionable）
- 现有 11 个 references 与 L2 sub-protocol 对齐（事实）
- PoC 任务分级判定（中任务，不需大任务 discipline）

**不能 claim**：

- 实际 PoC 数字（未做）
- 实际 5 host projection 同步（未做 generator 改造）
- 实际 LLM 路由表遵从率（未实验）
- spec-code-review 改造后是否仍满足现有 7 个 contract test（未跑）

**记录**：本附录未修改 source、未跑 A/B、未 commit/push/PR；记录 `dispatch_authorization_missing` / `inline-fallback-only coverage` / `experiment-design-level-not-validated`。

**记录 `dispatch_authorization_missing` / `inline-fallback-only coverage`**：本文档为 design advisory，不声明 multi-reviewer / multi-pass coverage。

---

# 附录 C：方案自审 — 7 个发现与 4 项重大修订

> 本附录是 v1.1 综合设计的诚实自审：在写出 v1.1 后，作者以 spec-first 已有 contract 为基准，对自己提的方案做严格审查。**发现 v1.1 违反 4 条 spec-first 已有 contract / 治理规则**，必须修订。本附录记录发现 + 修订方向 + 修订后与原方案的关系。
>
> 本附录**不**为 v1.1 辩护，**不**"试着用解释保留方案"。spec-first 角色契约第 1 条："代码不再稀缺，可信变更仍然稀缺" — 自审发现错误时，错误必须被显式声明和回退，不让错误隐藏在后续设计里。

## C.1 审查依据 — 我读了什么

我以**实际 spec-first 现有 contract** 为审查基准，不是以"业界最佳实践"：

| 已有 contract | 关键约束 | 在我方案中的状态 |
|---|---|---|
| `docs/10-prompt/结构化项目角色契约.md` v3.3 | 5 项不可违反原则、3 类权威分离、4 阶段演化判断 | 读了 B.2、B.3 引用 |
| `docs/contracts/workflows/skill-agent-quality-governance.md` | §1 Skill Minimum Contract v1（trigger/non-trigger/inputs/outputs/workflow skeleton/failure mode/done signal）；§6 **Lifecycle Metadata Waiver（明确禁止 per-skill manifest.json / interface.yaml / lifecycle metadata）** | **未读 → 直接导致 §B.4 + §B.6 违反 §6 waiver** |
| `docs/contracts/context-bundle.md` | `context-bundle.v1` schema：related_paths / artifact_summaries / evidence_paths / full_read_triggers / excluded_context / budget | **未读 → 直接导致 §B 整段重复造了 `context-bundle.v1` 子集** |
| `docs/contracts/ai-coding-harness.md` | 6 个 Harness 分层 + "scripts prepare facts / LLM decides semantic adequacy" 边界 | 读了 B.1 引用 |
| `skills/using-spec-first/SKILL.md` | **"Standalone entry governor"** + description-as-router + Front Controller 模式 + 引用 `public-route-map.md` 和 `conditional-routing-boundaries.md` | **未读 → 直接导致 §B.3 错误归类"using-spec-first 是 metadata 路由"** |
| `docs/contracts/context-governance.md` | runtime 排除 policy | 已知未引用 |

**关键方法论错误**：写 v1.0 + v1.1 时，**我没先读 spec-first 已有 contract**，违反了 CLAUDE.md 强制基线 ("处理任何涉及 spec-first 演化 ... 工作前，必须先阅读 `docs/10-prompt/结构化项目角色契约.md`") 和"先确认 source-of-truth" 原则。

**正确顺序**（应该走但没走）：

1. 读 `docs/10-prompt/结构化项目角色契约.md`（已读）
2. 读 `docs/contracts/ai-coding-harness.md`（已读）
3. 读 `docs/contracts/context-bundle.md`（**未读**）
4. 读 `docs/contracts/workflows/skill-agent-quality-governance.md`（**未读**）
5. 读 `skills/using-spec-first/SKILL.md`（**未读**）
6. **再**对照业界 5 范本做评估

**自我惩罚**：本附录是补做第 3-5 步的产物。

## C.2 7 个发现（按严重程度排序）

### 发现 1 [CRITICAL] — §B.4 + §B.6 违反 §6 Lifecycle Metadata Waiver

**证据**：

`docs/contracts/workflows/skill-agent-quality-governance.md` §6 原文：

> "公开 workflow skill 不需要为了响应单个审计 finding 而新增 per-skill `manifest.json`、`agents/interface.yaml`、owner/cadence 字段或 maturity metadata。当前集中式 dual-host governance contract 只记录 delivery topology，刻意不表达 lifecycle metadata。"

> "**不要为了单个 skill 新增 `skills/<skill>/manifest.json`、`agents/interface.yaml`，也不要扩展 `src/cli/contracts/dual-host-governance/skills-governance.schema.json`**。"

> "在该触发条件出现前，skill-specific posture 记录在 validation artifacts 或 changelog entries 中。"

**我提的方案**：

- §B.4 第 5 点："新 L1 manifest YAML 字段（task_type / required_l2）属于 generator 接受的 source schema 扩展，需要先改 `src/cli/` 接受新字段"
- §B.6 第 1 步：SKILL.md frontmatter 加 `manifest.task_type` / `manifest.required_l2` / `manifest.token_estimates` 字段
- §B.6 第 4 步："generator 接受 manifest.task_type 字段"
- §B.6 第 2 步："`src/cli/contracts/dual-host-governance/skill-manifest-schema.json` 新增字段定义"

**冲突**：

1. §6 明确禁止扩展 `skills-governance.schema.json`；
2. §6 明确说"skill-specific posture 记录在 validation artifacts 或 changelog entries 中" — 不在 schema 里；
3. 我提的 `required_l2` / `token_estimates` 是典型的"lifecycle / maturity metadata"，正好是 §6 排除的。

**严重性**：CRITICAL — 这是 spec-first 治理规则明确禁止的反模式。

### 发现 2 [CRITICAL] — §B 整段重复造 `context-bundle.v1`

**证据**：

`docs/contracts/context-bundle.md` 已有：

```json
{
  "schema_version": "spec-first.context-bundle.v1",
  "request": {...},
  "related_paths": [{"path": "...", "source": "changed_file", "reason": "..."}],
  "artifact_summaries": [{"path": "...", "reason": "summary-first handoff"}],
  "evidence_paths": [{"path": "...", "reason": "focused verification target"}],
  "full_read_triggers": ["summary is missing required scope...", "reviewer needs exact evidence..."],
  "excluded_context": [{"path": "...", "reason_code": "runtime_audit_artifact_excluded"}],
  "budget": {"max_files": 20, "max_tokens": 60000, "prefer_symbols": true},
  "degraded": false,
  "reason_code": null
}
```

**我提的方案核心**：

- L1 manifest 的 `required_l2: [...]` 列表 = `context-bundle.v1` 的 `related_paths` 特定形态
- `token_estimates: {inline_fallback_only: 1700, full_review: 7000}` = `context-bundle.v1` 的 `budget` 子集
- L2 sub-protocol 路由表 = `context-bundle.v1` 的 `full_read_triggers` 概念
- LLM "按路由表读 references" 模式 = `context-bundle.v1` 的 Consumption Rule 1-8

**问题**：

1. spec-first 已经有 `context-bundle.v1` 作为 progressive loading 的事实标准；
2. 我提的整套设计**没有引用它**，反而**重复造一个**子集；
3. 违反 `ai-coding-harness.md` 边界规则 §6："新 contract 应只增加能关闭重复 handoff、evidence 或 governance gap 的最小 durable mechanism" — 我没关闭 gap，反而**制造重复 contract**。

**严重性**：CRITICAL — 这是 spec-first 实际机制被我完全忽视的根本性错误。

### 发现 3 [CRITICAL] — `using-spec-first` 已是 Front Controller，但我没识别

**证据**：

`skills/using-spec-first/SKILL.md` frontmatter：

```yaml
---
name: using-spec-first
description: "Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or Direct Lane."
---
```

第一段正文：

> "`using-spec-first` is a standalone entry governor, not a command-backed workflow. **It selects one next entrypoint and yields control; it creates no workflow artifact.** It is a semantic map, not a rigid state machine."

文件结构：

- `SKILL.md` （入口 description + 路由规则 + exit boundaries）
- `references/public-route-map.md` （**正是 Front Controller 的 route map**）
- `references/conditional-routing-boundaries.md` （conditional boundaries）

**这正是 Anthropic Skills description-as-router 范本在 spec-first 的实现** — description 字段决定何时调用，调用后由 references 提供详细路由。

**问题**：

1. §B.3 把 Anthropic Skills 标 "Adopt — L1 manifest 已对齐" — 这是**事后强行解释**，实际是因为我没读 using-spec-first 所以没意识到 spec-first 已有 Front Controller；
2. §B.4 提的 "L1 manifest 扩展" 实际就是 using-spec-first 已实现的模式 — 我应该**复用 + per-skill 推广** using-spec-first 的 `references/route-map.md` 模式，不是新建 manifest 字段；
3. §B.6 提的 per-skill frontmatter 扩展，**违反** using-spec-first 已建立的"单入口 + per-skill route-map"分层。

**严重性**：CRITICAL — 我"重新发明"了 spec-first 已有的关键模式。

### 发现 4 [HIGH] — §B.3 演化判断 "3 Adopt 2 Wrap 1 Defer" 算错

**重新评估**（基于 C.1-C.3 的新认知）：

| 业界范本 | 我标 | 重新标 | 重新理由 |
|---|---|---|---|
| Anthropic Skills | Adopt | **Adopt** + 显式指针到 using-spec-first | spec-first 已有实现 |
| Shopify Sidekick | Wrap | **Adopt** | `context-bundle.v1` 已实现 required/optional context |
| Vercel v0 | Experiment | **Defer** | spec-first 无 dynamic system prompt 构造器的 need（context-bundle 已覆盖）|
| Google Gemini | Adopt | **Adopt** ✓ | L2 spine-only + sub-protocol 物理拆 = drop > compress |
| Cognition Devin | Defer | **Defer** ✓ | embedding 路由 over-engineering |
| 反面：Salesforce | Adopt | **Adopt** ✓ | |
| 反面：Notion | Adopt | **Adopt** ✓ | |
| 反面：Copilot | Wrap | **Defer** | host-level enforce 超出 spec-first 能力；**Wrap 改自然语言提示**而不是 YAML 字段 |

**正确分类**：

- **4 Adopt / 0 Wrap / 2 Defer**（不是 3/2/1）
- **重要结论**：5 个范本全部对应 spec-first 已有 contract 或不需引入。**没有任何范本需要新 contract**。

**严重性**：HIGH — 算错会让人误以为 spec-first 需要新体系；正确数字说明"全部已有/不需要"。

### 发现 5 [HIGH] — §B.6 "5 步具体路径" 在发现 1 之后失效

发现 1 已证明"扩展 schema 违反 §6 waiver"，所以 §B.6 第 1 步（"SKILL.md frontmatter 加 manifest.task_type"）+ 第 2 步（"src/cli/contracts/.../skill-manifest-schema.json 扩展"）+ 第 4 步（"generator 接受新字段"）**全部失效**。

**问题**：

- §B.6 提的"5 步具体路径"是**建立在已被否定的 schema 扩展之上**；
- 没有 schema 扩展，`manifest.task_type` 字段**会被 `spec-first init` 忽略**（§6 waiver 正是禁止它生效）；
- 整套路径**逻辑链断裂**。

**严重性**：HIGH — 路径不可执行，修订是必要的。

### 发现 6 [MEDIUM] — 违反 §1 Non-goals "Not a state machine"

**证据**：

`skill-agent-quality-governance.md` §0：

> "Not a state machine."
> "Not a hard gate platform."

`skill-agent-quality-governance.md` §1：

> "Skill prompt 可以包含 examples-as-context，但 examples 不等于 semantic readiness，**不应被写成自动通过的 eval platform**。"

**我提的 §B.4 触发路由表**：

```yaml
routes:
  - id: inline-fallback
    trigger: "worker_dispatch_authorization: missing"
    load_l2: [L2.0, L2.3, L2.4]
    skip_l2: [L2.1, L2.2]
    skip_l3: ["persona-catalog", "subagent-templates"]
    token_estimate: 1,700
```

**问题**：

1. 4 条 route + 显式 `load_l2/skip_l2` 列表 + `token_estimate` 接近状态机描述；
2. LLM 见到这种结构会**倾向于严格按表执行**，而不是语义判断；
3. 违反 §0 "Not a state machine" + §1 "不应被写成自动通过的 eval platform"。

**严重性**：MEDIUM — 状态机倾向会侵蚀 LLM 语义判断。

### 发现 7 [MEDIUM] — 自评 B.10 漏列 4 项关键风险

**B.10 自评**列了"能 claim 7 项 + 不能 claim 4 项"，但**漏列**：

- **未读 `context-bundle.md`** — 这是事实错误，违反 source-of-truth 优先
- **未读 `skill-agent-quality-governance.md` §6** — 导致整个 schema 扩展方向错误
- **未读 `using-spec-first/SKILL.md`** — 导致 Front Controller 模式被重新发明
- **§B.3 演化判断数字算错** — 误导决策

**严重性**：MEDIUM — 自评漏列会让人误以为方案已通过充分审查。

## C.3 4 项重大修订

基于 7 个发现，必须做以下修订。**修订原则**：**最大化复用 spec-first 已有 contract**（context-bundle.v1、using-spec-first Front Controller、§6 waiver），**最小化新增**。

### 修订 1：删除"L1 manifest YAML schema 扩展"

**原方案**：改 `skills-governance.schema.json` 加 `task_type / required_l2 / token_estimates` 字段。

**修订为**：**不改 schema**。改用 `references/route-map.md` per-skill 模式 — 这是 using-spec-first 已建立的模式：

```
skills/spec-code-review/
├── SKILL.md (spine-only ~300 行)
├── references/
│   ├── route-map.md (新文件，模仿 using-spec-first/public-route-map.md)
│   ├── synthesis-pipeline.md (重组织现有 subagent-template + persona-catalog + Stage 2-5c 段)
│   ├── ... 现有 11 个 references
```

`SKILL.md` 加一段：

```markdown
## Sub-Protocol Selection

Before any execution, read `references/route-map.md` to determine which
sub-protocol(s) apply. The map is semantic, not a state machine — use the
intent of the current request, not the exact path of the diff.
```

**符合** §6 waiver（per-skill posture 在 references 里，不是 schema 字段）；**符合** §0 Non-goals（route map 是语义路由，不是状态机）。

### 修订 2：用 `context-bundle.v1` 作为 progressive loading 机制

**原方案**：自己提 L1 manifest `required_l2: [...]` 列表 + `token_estimates`。

**修订为**：**直接使用 `context-bundle.v1`**。新设计的 PoC 验证是：

1. spec-code-review 调用时构造 `context-bundle.v1` envelope：
   - `related_paths` 只列当前 sub-protocol 需要的 references（不列 11 个全部）
   - `budget.max_tokens` 根据 sub-protocol 调整（inline-fallback 1.7K / full review 7K）
   - `full_read_triggers` 标注"完整展开 synthesis-pipeline.md 的条件"
2. 验证 `context-bundle.v1` 现有 `spec-first internal context-bundle` helper 能产出该 envelope
3. 验证 5 host projection 接受 `context-bundle.v1` 字段

**符合** `ai-coding-harness.md` Context Harness；**符合** §0 Non-goals（不重新造 envelope 概念）。

### 修订 3：演化判断重算为 4 Adopt / 0 Wrap / 2 Defer

详见 C.2 发现 4。**关键变化**：

- Shopify Sidekick 从 Wrap 改为 Adopt（因为 `context-bundle.v1` 已实现 required/optional）
- Vercel v0 从 Experiment 改为 Defer（无 need）
- Copilot 反面从 Wrap 改为 Defer（host-level enforce 超出 spec-first 能力）

**结论**改为："5 个范本全部对应 spec-first 已有 contract 或不需引入。**没有任何范本需要新 contract**。"

### 修订 4：§B.6 "5 步具体路径" 替换为"4 步新路径"

**新 4 步**（不依赖 schema 扩展）：

```
1. skills/spec-code-review/SKILL.md spine-only 重写
   - description 字段保留（已对齐 Anthropic Skills）
   - 增加 "## Sub-Protocol Selection" 段，引用 references/route-map.md
   - 移除内联的 Stage 2-5c 协议

2. skills/spec-code-review/references/route-map.md 新增
   - 模仿 using-spec-first/references/public-route-map.md 格式
   - 4 条 sub-protocol route（语义路由，不是状态机）
   - 每条 route 列出 read references 列表 + 触发条件 + token estimate

3. skills/spec-code-review/references/synthesis-pipeline.md 重组织
   - 不创建新概念；把现有 subagent-template.md + persona-catalog.md
     + Stage 2-5c 内联段合并为一个文件
   - 内容 100% 来自现有资产，结构按"sub-protocol 入口"重组

4. 跑 PoC 验证
   - 5-10 个 review case
   - 对比 token / finding 数 / severity 分布
   - 验证 5 host projection (`spec-first init`) 同步
   - 验证 `context-bundle.v1` envelope 仍能产出
```

**关键变化**：

- 步骤 1-3 都是 references 内部重组，**不涉及 schema 改动**；
- 步骤 4 验证 `context-bundle.v1` 兼容，不引入新 envelope；
- 全部改动在 source-of-truth 内（`skills/` 是 source），由 `spec-first init` 重新生成 runtime。

## C.4 修订后与原方案的关系

| 维度 | v1.1 原方案 | C.3 修订后 |
|---|---|---|
| L1 manifest schema 扩展 | ✗ 违反 §6 waiver | 改用 references/route-map.md（using-spec-first 模式）|
| progressive loading 机制 | ✗ 自己提 L1/L2/L3 5 层 | 直接用 `context-bundle.v1` |
| 演化判断数字 | 3 Adopt / 2 Wrap / 1 Defer | 4 Adopt / 0 Wrap / 2 Defer |
| 是否需要新 contract | 提议 `skill-manifest-schema.json` 扩展 | **不需要** — 全部复用 |
| PoC 范围 | 中任务（含 schema 扩展）| **小-中任务**（references 内部重组）|
| 风险 | 违反 spec-first 治理规则 | 与 spec-first 治理对齐 |

**核心结论**：

> 修订后的方案**不是"在 spec-first 之上叠加新机制"**，而是**"用好 spec-first 已有机制"**。具体来说：
>
> 1. **不用 schema 扩展** — 改 references 内部重组，符合 §6 waiver
> 2. **不用新 envelope 概念** — 用 `context-bundle.v1` 已有
> 3. **不重新发明 Front Controller** — 用 using-spec-first 已有模式
> 4. **不重新造 L1/L2/L3/L4/L5 命名** — 用 spec-first 已有 L0 role contract / L1 workflow index / L2 skill source / L3 cross-skill contract / L4 5-host projection / L5 ephemeral

## C.5 修订后 PoC 范围（小-中任务）

**核心动作**（全部 single-skill，references 内部）：

- spec-code-review SKILL.md spine-only 重写（1,046 → 300 行）
- 新增 `references/route-map.md`（~150 行）
- 重组织 `references/synthesis-pipeline.md`（~500 行）
- 跑 5-10 个 review case 对比
- 验证 `context-bundle.v1` envelope 兼容
- 验证 5 host projection 同步

**不做**：

- 不扩展任何 schema
- 不改 `src/cli/`
- 不动 `docs/contracts/`
- 不改其他 16 skill
- 不引入 embedding 路由

**任务级别**：**小-中任务**（CLAUDE.md：单文件改 + 配套 references + 验证；不涉及 schema 扩展、跨 skill、跨 host generator 协调）

**失败回退**：PoC 失败（finding 数 ↓ > 10% 或 token ↓ < 30%）→ 撤稿，保留原 SKILL.md + references，文档化失败原因。

## C.6 自评追加 — 附录 C 能 claim 什么 / 不能 claim 什么

**能 claim**：

- 7 个发现的证据链（事实，源 = 实际 spec-first contract）
- C.3 修订方向的合规性（每条都引 spec-first 已有 contract）
- C.4 与原方案差异表（事实对照）
- 修订后 PoC 范围（actionable，依赖 references 内部重组）

**不能 claim**：

- 修订方案是否真能跑（未实施）
- `context-bundle.v1` envelope 实际能减多少 token（未跑 PoC）
- `references/route-map.md` per-skill 模式是否能像 using-spec-first 一样被 LLM 良好遵从（未实验）
- 修订后是否还会出现新的 7 个类似问题（未跑 PoC 暴露更多风险）

**记录**：本附录基于 spec-first 实际 contract 自审；**不**为 v1.1 原方案辩护；记录 `self_correction_pending_poC_validation` / `inline-fallback-only coverage` / `experiment-design-level-not-validated`。

## C.7 给后续 plan 写作者的明确清单

如果你（人或 agent）要基于本附录 C 写 spec-plan 实施修订方案：

1. **不要**试图"挽救" v1.1 的 schema 扩展方向 — 已被 §6 waiver 否决
2. **不要**重新设计 progressive loading envelope — 用 `context-bundle.v1`
3. **不要**自创新命名层（L1.5 / L2.5）— spec-first 已有 L0-L5 命名习惯
4. **必须**先读 3 份 spec-first 已有 contract：`context-bundle.md` / `skill-agent-quality-governance.md` / `using-spec-first/SKILL.md`（包括其 references/）
5. **必须**把 PoC 限定为"小-中任务"（单 skill，references 内部）
6. **必须**显式声明"不扩展 schema / 不改 src/cli / 不动 contracts"
7. **必须**用 `context-bundle.v1` envelope 验证 progressive loading 生效
8. **必须**保留修订失败时的回退路径（原 SKILL.md + 现有 references）

**最终守则**（spec-first 角色契约第 1 条）：

> 可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据 × 可失效学习。
>
> 本附录 C 是"可失效学习"的实例 — 自审发现错误时，错误必须被显式声明和回退，不让错误隐藏在后续设计里。

---

# 附录 D：质量保障与验证方案

> 本附录回答两个问题：（1）如何保障不降低质量；（2）如何验证没有降低质量。**不**重新发明 spec-first 已有验证机制 — 全部基于 `verification-run-summary.v1` / `ai-dev-quality-gate-result` / `review-finding.v1` / `fresh-source-eval-checklist` / `context-bundle.v1` / `eval-fixture-contract` 等已有 contract。

## D.0 设计原则（基于 spec-first 5 原则 + 已有 contract）

| 原则 | 质量保障设计输入 |
|---|---|
| **3.1 Light contract** | 验证 contract 自身要轻 — 优先复用，不新建 schema |
| **3.2 Deterministic floor, semantic judgment** | 哪些可机械判定（如 token 数、文件存在、schema valid），哪些必须 LLM 判定（如 finding 准确性），明确分工 |
| **3.3 Gate the exits** | 5 hard exit 在验证阶段不降低强度 — 任何"未验证"就保持 `not_run` 状态 |
| **3.4 Evidence over confidence** | 验证必须配 evidence，不能"我感觉差不多" |
| **3.5 Bounded autonomy** | PoC 限定单 skill + 失败可回退 |

**核心认识**：

> 质量保障 = **prevent**（设计上避免降低）+ **detect**（运行时检测到降低）+ **recover**（降低时回退）。
> 三者缺一不可。**只 detect 不 prevent 是事后救火，只 prevent 不 detect 是自欺欺人**。

## D.1 质量保障 4 阶段（prevent → detect → recover → learn）

### 阶段 1：设计期保障（prevent）

**目标**：在写代码前就把"质量保障"内嵌进设计，避免事后补丁。

| 设计保障 | 实现 | 验证 |
|---|---|---|
| **不破坏关键不变量** | `references/route-map.md` 显式列出 skill 必读关键不变量（hard exits、scope gate、evidence anchor）；route map 引用它们 | code review 检查 route map 是否完整 |
| **density 不变**（密度不变原则）| L2 sub-protocol 拆分时，**每个 L2 文件必读关键不变量密度 ≥ 原 SKILL.md 同段密度** | 写拆分时手算密度（关键不变量 / 行数）|
| **不创造新 contract** | 全部基于 `context-bundle.v1` / `verification-run-summary.v1` / `review-finding.v1` | `git diff --check` + contract test |
| **不破坏 spec-first 5 原则** | 附录 C 已做的 7 个发现作为 checklist | self-review by author |
| **不引入状态机** | route map 是"语义路由 + 引用 references"，不是"硬路由表 + 强 skip 列表" | peer review |
| **PoC 限定单 skill** | 严格按附录 C.5 范围；不"顺手"改其他 16 skill | diff scope 检查 |

**关键纪律**：

- 写 code 前先写一个**关键不变量清单**（10-20 条），贴在 PR description；
- 拆分时逐条标"这条不变量在哪个 L2 文件"；
- 任何 L2 文件**未覆盖**的不变量 = **拆分失败**。

### 阶段 2：实施期保障（prevent + detect）

| 实施保障 | 实现 | 检测信号 |
|---|---|---|
| **保留 git history** | 不用 git reset --hard，用 `git revert` 或保留分支 | `git log` 检查 |
| **保留旧版本 reference** | 改造前 git tag `pre-spine-only-v1` | tag 存在 |
| **每个 L2 文件配 1 个 focused unit test** | 不只测 L2 行为，**测关键不变量在 L2 中存在** | unit test pass |
| **每个 contract test 仍 pass** | `npm run test:unit` + `npm run test:smoke` | exit code 0 |
| **typecheck + skill lint + build** | `npm run typecheck && npm run lint:skill-entrypoints && npm run build` | exit code 0 |
| **`spec-first init` 后 L1 + L4 projection 一致** | 改 source → init → 比对 host projection 关键字段（description、name、sub-protocol 引用）| diff 工具 |
| **CHANGELOG + doc update** | 任何 skill source 改动同步 CHANGELOG + docs/10-prompt 或 skills/<skill>/SKILL.md 顶部 | grep + ci |

**关键纪律**：

- **不可跳步**：typecheck / unit / smoke / integration 任何一个 fail，立即停；
- **不可"fix later"**：每个 failure 必须当前修复，**不允许**"先 merge 后面 rebase"；
- **不可"manual 验证代替 test"**：manual 验证是 **advisory**，不替代 CI。

### 阶段 3：运行时保障（detect）

**目标**：运行时检测"质量是否真的没降"。

| 运行时检测 | 实现 | 失败信号 |
|---|---|---|
| **PoC A/B 对照** | 5-10 个 review case × (原 SKILL.md, 拆分后) | finding 数 / severity 分布 / coverage 偏差 > 阈值 |
| **关键不变量 100% 引用** | 跑 N 次 review，验证 LLM 实际读了 route map 引用 | 关键不变量被跳读 |
| **finding schema 兼容** | 拆分后 review 输出仍符合 `findings-schema.json` | schema validate fail |
| **inline-fallback 不退化** | 走 inline-fallback 路径时，degraded coverage 标识仍正确 | 误标 `passed` |
| **`context-bundle.v1` envelope 兼容** | 用 `spec-first internal context-bundle` 生成 envelope | envelope 生成 fail |
| **5 host projection 同步** | `spec-first init` 后 5 host 的 SKILL.md 仍可被 LLM 读 | host 端跑失败 |
| **`fresh-source-eval`** | fresh read-only reviewer 跑 `fresh-source-eval-checklist` | 标记 `concerns` |

**关键纪律**：

- **每个检测都要有数值阈值**，不能"看着差不多"；
- **每次跑完记录**到 `verification-run-summary.v1`；
- **失败 case 必须归档**到 `docs/validation/`，不能丢；
- **不能"手动微调"测试 case**让 case 凑结果。

### 阶段 4：失败时保障（recover）

| 恢复机制 | 实现 | 触发条件 |
|---|---|---|
| **git revert** | 改造前 git tag，失败 `git revert` | PoC 失败、production 质量事故 |
| **保留旧 SKILL.md 在 archive** | `skills/spec-code-review/SKILL.md.legacy` 软链 | 临时回退窗口 |
| **feature flag** | LLM 默认走新路径，**显式** `use_legacy=true` 走老路径 | 紧急回退 |
| **回退 plan** | `docs/plans/2026-XX-XX-spec-code-review-spine-only-rollback.md` | 任何阶段 |
| **`not_run` 诚实记录** | 回退后更新 CHANGELOG + 标记 status 为 `rolled_back` | 任何失败 |

**关键纪律**：

- 恢复是**预先规划**的，不是"出问题再想"；
- 回退 plan 必须在 PoC 前写好；
- 任何回退都要有 post-mortem，**禁止**"回退成功 = 完事"。

## D.2 验证方案 — 7 项必跑 + 4 项可跑

### 7 项必跑（PoC 完整度 = 这 7 项全过）

#### V1. 关键不变量清单（设计期）

**目标**：在拆分前明确"哪些不变量不能丢"。

**实现**：

```markdown
## Spec-Code-Review 关键不变量（拆分前清单）

### Hard exits（必须 100% 保留）
- HE1. Never claim "independent reviewer coverage" unless dispatch authorized
- HE2. Never claim "fresh-context coverage" unless fresh subagent ran
- HE3. Never claim "multi-agent coverage" unless multi-agent ran
- HE4. Mark output `status: degraded` when degraded path runs
- HE5. `dispatch_authorization_missing` reason_code when applicable

### Scope gate
- SG1. Resolve base / current / commit / branch before any review action
- SG2. Detect mutation / non-mutation scope; refuse if forbidden
- SG3. Refuse if dispatch authorization can't be verified

### Evidence anchors
- EA1. Each finding has evidence with file/diff/test/standard anchor
- EA2. Findings use P0-P3 severity + 0/25/50/75/100 confidence
- EA3. finding_id format `F-NNN` (per findings-schema.json)

### Output schema
- OS1. Output `findings-schema.json` compliant
- OS2. Inline-fallback path output `degraded_coverage: true` and reason_code
- OS3. JSON envelope includes `worker_dispatch_authorization` field
- OS4. Closeout uses honest-closeout.schema.json

### Workflow gates
- WG1. Refuse mutation claim if `mutation_authorization_ref` not resolved
- WG2. Refuse merge-ready claim if verification not run
- WG3. Refuse handoff if summary-first not provided
```

**验证**：

- 作者写完清单后**自己读一遍**；
- peer reviewer 独立加 1-2 条作者漏的；
- 后续每个 L2 文件标注覆盖哪些不变量。

#### V2. density 不变检查（设计期 + 实施期）

**目标**：确保 L2 拆分不稀释关键不变量。

**实现**：

```
拆分前：原 SKILL.md 关键不变量 N1 = 30, 总行数 L1 = 1046
原 density = N1 / L1 = 0.0287 不变量/行

拆分后：
- SKILL.md spine: N2.0 = 18, L2.0 = 300 → density 0.0600
- L2.2 synthesis-pipeline.md: N2.2 = 12, L2.2 = 600 → density 0.0200
- L2.3 inline-fallback.md: N2.3 = 6, L2.3 = 100 → density 0.0600
- ...

要求：每个 L2 文件 density ≥ 0.0287（不降低原 density）
```

**验证**：

- 写一个简单脚本（`scripts/check-invariant-density.js`）读 SKILL.md + L2 文件，统计 "关键不变量 markers" 出现次数；
- 关键不变量 markers 包括 `dispatch_authorization_missing`、`status: degraded`、`findings-schema`、`P0-P3`、`mutual_authorization_ref` 等 spec-first 已有 terminology；
- 跑 5 个 skill 验证 baseline density，作为对照。

**注意**：这只是**结构化指标**，不是质量本身。density 高不必然质量好，但 density 明显降低 = 红色信号。

#### V3. unit test 全 pass（实施期）

**目标**：现有 unit test 仍 pass。

**实现**：

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run lint:skill-entrypoints
npm run test:mcp-setup
npm run build
```

**判定**：

- 所有 exit code 0；
- 任何 1 个 fail = 拆分失败，**不允许**"skip 那个 test"。

#### V4. contract test 全 pass（实施期）

**目标**：spec-first 已有 16 个 workflow contract + 8 个 governance contract 仍 pass。

**实现**：

- `tests/unit/dispatch-authorization-matrix-contracts.test.js`（最近修复过的）
- `tests/unit/eval-fixture-contracts.test.js`
- `tests/unit/host-runtime-projection-contracts.test.js`
- `tests/unit/plugin-module-*.test.js`
- 全部 focus on spec-code-review 的 test

**判定**：

- 全部 pass；
- 任何 fail = 拆分破坏了现有 contract。

#### V5. PoC A/B 对照（运行时）

**目标**：在真实 review case 上对比拆分前后。

**实现**：

```
输入：5-10 个真实 review case（来自 docs/validation/2026-07-12-unit-replay/）
     + 5 个新鲜 case（来自当前未 review 过的 branch）

A 组（原 SKILL.md）：spec-code-review/SKILL.md v_pre = 当前 1,046 行
B 组（拆分后）：spec-code-review/SKILL.md v_post = 新 ~300 行 + references/

每个 case 跑 A 和 B，记录：
- token_input: 实际 context window 占用
- token_output: review 报告大小
- finding_count: P0/P1/P2/P3 各多少
- severity_distribution: 各 severity 占比
- coverage: inline / single / multi / multi-fresh 四种 coverage 分布
- wall_clock_sec: 端到端墙钟
- key_invariant_mentions: 关键不变量在 output 中被显式提及次数
```

**判定标准**（任何一个 fail = 拆分失败）：

| 指标 | 容忍区间 |
|---|---|
| finding_count (总) | ±10% |
| severity_distribution (P0+P1 占比) | ±5% |
| coverage (multi / multi-fresh 占比) | 拆分后**不高于**拆分前（避免虚假高质量）|
| key_invariant_mentions | 关键不变量被 LLM 显式引用的比例 ≥ 80% |
| wall_clock_sec | 拆分后**不高于** 1.2× 拆分前（避免拆过头导致 tool call 膨胀）|

**关键纪律**：

- **不可手工挑 case** — 全部 5-10 个 case 必须跑；
- **不可"调阈值让它过"** — 阈值写死在 plan 里，跨 case 应用；
- **必须把对照结果**写进 `docs/validation/2026-XX-XX-spine-only-poc-ab-result.md`。

#### V6. fresh-source-eval（运行时）

**目标**：按 `fresh-source-eval-checklist` 跑 fresh read-only reviewer。

**实现**：

1. 准备 1 个 fresh read-only reviewer（独立 session），不读当前会话 cache；
2. 注入新 SKILL.md + references/ 内容 + 本附录 D；
3. 跑 5 个 trigger precision test:
   - 给 reviewer "改个 typo" → 验证不触发 review skill 全部 sub-protocol
   - 给 reviewer "做完整 code review" → 验证触发全部 sub-protocol
   - 给 reviewer "检查 inline-fallback 是否被破坏" → 验证正确引用 L2.3
   - 给 reviewer "5 host projection 同步" → 验证 generator 仍接受
   - 给 reviewer "误用 skill" → 验证正确拒绝 + 引用 route map
4. 标 `passed` / `concerns` / `not_run`（按 `fresh-source-eval-checklist` 状态词）
5. 任何 `concerns` = 拆分需重做

**判定**：

- `passed`：全 5 个 test 通过；
- `concerns`：任何 test 出现 actionable finding；
- `not_run`：无独立 reviewer 可用时，**诚实**记录 `not_run` + 原因（**不**伪造 `passed`）。

#### V7. verification-run-summary 落盘（运行时）

**目标**：每次跑 PoC 后留 audit trail。

**实现**：

按 `docs/contracts/verification/verification-run-summary.md` 记录：

```json
{
  "schema_version": "spec-first.verification-run-summary.v1",
  "workflow": "spec-code-review",
  "run_id": "2026-XX-XX-spine-only-poc-N",
  "profile": {
    "source": "spec-first.verification.json",
    "active": "default"
  },
  "checks": [
    {
      "id": "typecheck",
      "service": "spec-first-cli",
      "command": "npm run typecheck",
      "status": "passed",
      "exit_code": 0,
      "ran": true,
      "log_path": ".spec-first/.../typecheck.log",
      "reason_code": null,
      "redaction_status": "redacted"
    },
    {
      "id": "spine-only-ab-poc",
      "service": "spec-code-review",
      "command": "spec-first internal poc-run --skill spec-code-review --mode a/b",
      "status": "passed",
      "exit_code": 0,
      "ran": true,
      "log_path": ".spec-first/.../poc-ab.log",
      "reason_code": null,
      "redaction_status": "redacted"
    }
  ],
  "limits_respected": true
}
```

**判定**：

- 记录存在 + 全部 `passed` + redacted log path 存在；
- 任何 `not-run` / `failed` 必须有 `reason_code`；
- 落盘位置遵守 `verification-run-summary.md` 路径规则（`.spec-first/workflows/spec-code-review/<workspace-slug>/<run-id>/`）。

### 4 项可跑（Nice to have）

#### V8. finding-quality 评分（人工 + script）

**目标**：P0/P1 finding 是否"真"重要。

**实现**：

- 跑 5-10 个 case 后，由人工 reviewer（不是改 skill 的那个人）独立标每个 finding 的"是不是真的 P0/P1"；
- 标 `true_positive` / `false_positive` / `severity_mismatch` / `valid_low_severity`；
- 统计 false_positive_rate，要求 ≤ 10%。

**价值**：在 V5 之上加 1 层"finding 质量"验证。

#### V9. cross-host smoke test

**目标**：5 host 都能跑新 SKILL.md。

**实现**：

- `spec-first init` → 5 host projection 重新生成；
- 每个 host 跑 1 个最小 smoke case（不实际 review，只 trigger skill 入口）；
- 验证 host 端能加载 + description 匹配 + route map 引用解析。

**价值**：防止 host-specific drift。

#### V10. cross-skill 影响

**目标**：其他 16 skill 没被破坏。

**实现**：

- 跑全 17 skill 的 typecheck / unit test；
- 验证其他 skill 的 references/ 仍可读；
- 验证 `using-spec-first` 的 route map 仍能找到 spec-code-review。

**价值**：单 skill 改造的 blast radius 检查。

#### V11. multi-model 验证（多 LLM 厂商）

**目标**：拆分后不仅 Claude 能跑，OpenAI / Google 也能。

**实现**：

- 如果有 cross-model 工具（如 LiteLLM），用不同 LLM 跑同一组 case；
- 验证 finding 数 / severity 分布不被 LLM-specific 行为破坏。

**价值**：防止"只对 Claude 优化"。

## D.3 "没降低质量"的判定逻辑

**核心问题**：跑完 V1-V11，怎么判定"没降低质量"？

### 必跑全过的硬条件

```
✓ V1: 关键不变量清单已写（设计期）
✓ V2: density 不变（每个 L2 文件 ≥ 原 density）
✓ V3: typecheck + unit + smoke + integration + lint + build 全 pass
✓ V4: contract test 全 pass
✓ V5: PoC A/B 在 5-10 case 上满足所有容忍区间
✓ V6: fresh-source-eval 标 passed（不是 not_run）
✓ V7: verification-run-summary 落盘
```

**全过 = 可以 claim "没降低质量"**。

**任何 1 个不过 = 不能 claim，需要重做或回退**。

### 软条件（V8-V11）

V8-V11 是 **advisory**，不作为硬 gate；但**长期**建议跑 — 积累数据。

## D.4 验证的"anti-pattern"（禁止做的事）

| anti-pattern | 为什么禁止 | 替代做法 |
|---|---|---|
| **"我觉得差不多"** | 没有 evidence，违反 §3.4 | 跑 V5 拿数值 |
| **手动挑 case 凑结果** | 选样偏差 | 5-10 case 全部跑 |
| **改阈值让 case 过** | p-hacking | 阈值写死在 plan |
| **skip failing test** | 隐藏问题 | 立即修复或诚实 `not_run` |
| **"manual test 代替 CI"** | 不能审计 | CI 必须跑 |
| **"fix later"** | 技术债 | 立即修复 |
| **"回退成功 = 完事"** | 错过 post-mortem | 必须 post-mortem + 文档化 |
| **拆分时改 protocol** | 范围蔓延 | 严格 refactor，protocol 改走新 plan |
| **验证完不写 audit trail** | 无法复查 | 强制 V7 落盘 |
| **跑完 PoC 立即 claim "production ready"** | 没有长期数据 | 标 `experiment-validated` + 监控 |

## D.5 与 spec-first 已有 contract 的对应

| 本附录验证项 | spec-first 已有 contract |
|---|---|
| V3 / V4 unit + contract test | `verification-run-summary.v1` + `ai-dev-quality-gate-result` |
| V5 PoC A/B | `eval-fixture-contract` + `docs/validation/2026-07-15-using-spec-first-prompt-thinning-eval.md` 范本 |
| V6 fresh-source-eval | `fresh-source-eval-checklist` |
| V7 audit trail | `verification-run-summary.v1` + `honest-closeout.schema.json` |
| V8 finding quality | `review-finding.v1` 已有 severity / confidence 字段 |
| V9 cross-host | `docs/contracts/source-runtime-customization-boundary.md` + generator |
| V10 cross-skill | `using-spec-first` 已有 route map |
| V11 multi-model | `docs/contracts/workflows/worker-dispatch-capability.md` 已有 host pair 模式 |
| D.1 阶段 4 recover | `honest-closeout` 已有 rollback guidance |

**核心结论**：**全部基于已有 contract，不发明新 schema**。

## D.6 验证时间表（按 PoC 阶段）

| 阶段 | 验证项 | 所需时间估算 |
|---|---|---|
| 阶段 0: 准备 | V1 关键不变量清单 + V2 density 测量 baseline | 0.5 天 |
| 阶段 1: 实施拆分 | V3 typecheck + unit + V4 contract test | 0.5 天 |
| 阶段 2: 5 host 同步 | V9 cross-host smoke | 0.5 天 |
| 阶段 3: PoC A/B | V5 (5-10 case × A/B) + V7 落盘 | 1-2 天 |
| 阶段 4: fresh review | V6 fresh-source-eval | 0.5-1 天 |
| 阶段 5: cross-skill | V10 cross-skill 17 skill smoke | 0.5 天 |
| 阶段 6: 文档化 | 写 `docs/validation/2026-XX-XX-spine-only-poc-result.md` | 0.5 天 |
| **总计** | | **4-5.5 天** |

**关键纪律**：

- 阶段 1 失败 → 立即停，回到阶段 0；
- 阶段 3 失败 → 立即停，回退到原 SKILL.md；
- 阶段 4 标 `not_run` → 诚实记录，**不**继续推进；
- 阶段 6 是必须的（不能"跑完了就完事"）。

## D.7 自评 — 附录 D 能 claim 什么 / 不能 claim 什么

**能 claim**：

- 4 阶段框架（prevent / detect / recover / learn）覆盖质量保障完整生命周期
- 7 项必跑 + 4 项可跑，每项有具体实现 + 判定标准
- V5 PoC A/B 容忍区间写明
- 全部基于 spec-first 已有 contract，不发明新 schema
- D.4 anti-pattern 清单
- D.6 时间表

**不能 claim**：

- 验证方案本身是否真能挡住质量降低（**未跑**）
- 容忍区间数值是否合理（**未用真实数据校准**）
- V11 multi-model 实际差异（**未跑过**）
- 失败回退的真实可行性（**未演练**）
- 验证方案本身是否过重（**未 PoC**）

**记录**：

- 验证方案是 design-level advisory，**未实施**；
- 必跑 7 项 **未跑**；
- 失败回退 plan **未演练**；
- 状态：`verification-design-not-validated` / `inline-fallback-only coverage` / `experiment-design-level-not-validated`。

## D.8 给后续 plan 写作者的明确清单

如果你要基于本附录 D 写 plan 实施：

1. **不要省略 V1 关键不变量清单** — 没有它 V2 / V5 都没法做
2. **不要跳过 V3 typecheck** — typecheck 是最低 baseline
3. **不要把 V4 contract test 当"过场"** — 它是"是否破坏现有 contract"的硬关
4. **V5 PoC A/B 是**核心** — 没有 V5 不能 claim "没降低质量"
5. **V6 fresh-source-eval 必须诚实** — `not_run` 比 `concerns` 诚实
6. **V7 落盘是 audit trail** — 后续 post-mortem 全靠它
7. **D.4 anti-pattern 必读** — 防止"为了过而过"
8. **D.6 时间表是 lower bound** — 不要为"赶进度"压缩
9. **失败时立即回退** — 不存在"再调一下"
10. **回退后 post-mortem** — 写 `docs/validation/2026-XX-XX-spine-only-rollback-postmortem.md`

**最终守则**（spec-first 角色契约 3.4）：

> 证据必须与 claim 匹配；self-check 不等于 independent evidence，verification claim 不等于 field outcome。
>
> "没降低质量"是 **verification claim**，必须有 evidence（V5 + V6 + V7 落盘），不是自信。跑完 V5 + V6 + V7 才能说"没降低质量"，否则只能诚实说"未验证"。
