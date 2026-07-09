# Ponytail / YAGNI 最小实现治理：spec-first 源码级集成修订方案

> 资料来源：微信文章《AI写的代码又长又烂？装上Ponytail，代码量直降80%，效率翻3倍！》
> 文章链接：https://mp.weixin.qq.com/s/SD7QC6P0t95NqYj1ClJhKg
> 本地源码：`/Users/kuang/xiaobu/ponytail`（`DietrichGebert/ponytail`，`main`，2026-06-19 `git pull -v` 已是最新）
> spec-first 源码：`/Users/kuang/xiaobu/spec-first`
> 修订日期：2026-06-19
> 修订角色：Spec-First Evolution Architect

---

## 0. 结论先行

Ponytail 对 spec-first 的价值不是“安装一个少写代码的插件”，也不是把 `claude --ponytail` 式 host 参数外包给外部工具。它真正可借鉴的是一组已经被源码和 benchmark 支撑的 **最小必要性治理机制**：

1. **写前决策梯子**：先问是否需要存在，再查标准库、原生平台能力、已安装依赖，最后才写最小可工作代码。
2. **安全边界**：少写代码不能删掉 trust-boundary validation、error handling、security、accessibility、必要校准和最小检查。
3. **会话级姿态注入**：Ponytail 通过 hooks / skills / commands 让规则持续在宿主中生效，而不是靠一次性提示词。
4. **可追踪捷径**：`ponytail:` comment + `/ponytail-debt` 把“刻意简化”变成带 ceiling / upgrade trigger 的债务台账。
5. **benchmark 约束表达**：它用真实 agentic sessions 证明“减少代码”不是目标本身，目标是减少过度实现且不牺牲安全。

对 spec-first 的正确吸收方式是：

```text
spec-plan
  -> 轻量 Minimal Implementation Contract，阻止计划阶段默认泛化
spec-work
  -> Minimality Preflight，写前优先复用 / 删除 / 配置 / 小改
spec-code-review
  -> code-simplicity reviewer 接入 structured JSON review pipeline
spec-write-tasks
  -> 复用现有 context_refs / stop_if / review_focus，不新增 task 字段
spec-compound
  -> 用现有 best_practice / convention + pattern + invalidation_condition 沉淀最小实现经验
retired-skill-review
  -> 仅补 rubric nuance，防 skill 自身诱导 broad generation
```

最终优先级：

| 优先级 | 主题 | 落地原则 |
| --- | --- | --- |
| P0 | `spec-code-simplicity-reviewer` 接入 `spec-code-review` | 已有 agent 语义贴合，但当前输出 Markdown，需改成 JSON findings 并进入 conditional selector |
| P0 | `spec-plan` + `spec-work` 最小实现边界 | 加轻量语义合同，不加机器 schema，不强制每个 plan 生成大段模板 |
| P1 | `spec-write-tasks` / `spec-compound` / `spec-optimize` | 全部复用既有 contract，除非真实需求证明必须扩 schema |
| P2 | `retired-skill-review` 反膨胀审计 nuance | 只补 rubric，不新建脚本规则引擎 |

关键取舍：

- **不引入 Ponytail npm 依赖**：Ponytail 是 posture / workflow discipline，不是 spec-first 的事实源。
- **不新建 public skill**：先复用 `spec-plan`、`spec-work`、`spec-code-review`、`spec-compound`。
- **不新增 task-pack 字段**：当前 task-pack 已有 validator allowlist 和 parity test；新增字段会从轻量 prompt 调整升级为 schema / validator / test 变更。
- **不把 LOC 当唯一指标**：spec-first 优化的是 `minimal necessary implementation`，不是 code golf。

---

## 1. 本次修订依据

### 1.1 Ponytail 源码证据

| 机制 | 源码证据 | 判断 |
| --- | --- | --- |
| 决策梯子 | `/Users/kuang/xiaobu/ponytail/README.md:80-93`，`skills/ponytail/SKILL.md:29-52` | 不是“少写”口号，而是存在性 / stdlib / native / dependency / one-line / minimum works 的有序 ladder |
| 安全例外 | `README.md:78-93`，`skills/ponytail/SKILL.md:77-93` | 明确不能删 validation、error handling、security、accessibility、硬件校准和最小检查 |
| 跨宿主交付 | `README.md:95-221` | 覆盖 Claude Code、Codex、Copilot、Pi、OpenCode、Gemini、Antigravity、CodeWhale、OpenClaw 等，不是单一 CLI |
| lifecycle hooks | `hooks/claude-codex-hooks.json:1-30` | SessionStart 和 UserPromptSubmit 两类 hook，带 5s timeout |
| 会话启动注入 | `hooks/ponytail-activate.js:24-43` | 默认 mode 解析、flag 写入、规则集输出 |
| mode tracking | `hooks/ponytail-mode-tracker.js:16-50` | `/ponytail` / `@ponytail` / `$ponytail` 命令改变会话 mode |
| instruction builder | `hooks/ponytail-instructions.js:71-85` | 从 `skills/ponytail/SKILL.md` 读取并按 mode 过滤，失败时回退内置规则 |
| commands | `README.md:210-221`，`commands/*.toml` | `/ponytail`、`/ponytail-review`、`/ponytail-audit`、`/ponytail-debt`、`/ponytail-gain` |
| debt ledger | `skills/ponytail/SKILL.md:51`，`skills/ponytail-debt/SKILL.md:11-38` | `ponytail:` comment 要写 ceiling 和 upgrade path，debt 命令收集无 trigger 风险 |
| benchmark | `README.md:49-63`，`benchmarks/results/2026-06-18-agentic.md:77-184` | 真实 Claude Code agentic sessions：12 个 feature task、6 个 safety task，报告 per-task 差异与安全率 |
| benchmark limitations | `benchmarks/results/2026-06-18-agentic.md:186-199` | 明确 one model、safety floor、n=4、timeout bug 等限制 |

### 1.2 spec-first 源码证据

| 机制 | 源码证据 | 对方案的影响 |
| --- | --- | --- |
| 角色契约 | `docs/10-prompt/结构化项目角色契约.md` | 必须保持 Light contract + Explicit boundaries + Scripts prepare, LLM decides |
| Plan artifact skeleton | `skills/spec-plan/references/plan-template.md:1-217`，`plan-sections.md:17-43` | Minimal Implementation Contract 不能只写进 `SKILL.md`，还要进入 plan skeleton / include-when-material 规则 |
| Work feedback loop | `skills/spec-work/SKILL.md:77-81` | `spec-work` 已有 smallest feedback loop，Minimality Preflight 应合并到现有入口，不新建 artifact |
| Work scope stop | `skills/spec-work/SKILL.md:168-170`，`:224-229` | 已有 “Do not expand scope in place”，Ponytail 只做具体化 |
| Work reuse patterns | `skills/spec-work/SKILL.md:463-469` | 已要求 follow existing patterns / grep similar implementations，可补 stdlib/native/dependency/reuse first |
| code-simplicity agent | `agents/spec-code-simplicity-reviewer.agent.md:1-95` | 语义贴合 YAGNI，但输出 Markdown `Simplification Analysis`，无法直接进入 code-review JSON pipeline |
| code-review schema | `skills/spec-code-review/references/findings-schema.json:1-139` | reviewer 必须返回 JSON，包含 severity、confidence anchor、autofix_class、owner、evidence 等 |
| code-review catalog | `skills/spec-code-review/SKILL.md:219-271`，`references/persona-catalog.md:1-70` | 当前 catalog 不含 `spec-code-simplicity-reviewer`，需同步 selector 和 catalog |
| task-pack fields | `src/cli/task-pack.js:13-38` | `REQUIRED_TASK_FIELDS` / `ALLOWED_TASK_FIELDS` 固定，不应随手新增 `minimality_refs` 等字段 |
| task-pack parity | `skills/spec-write-tasks/references/task-pack-schema.md:164-166`，`tests/unit/spec-write-tasks-contracts.test.js:193-223` | 新字段必须同步 schema / validator / tests；本方案建议不新增 |
| compound schema | `skills/spec-compound/references/schema.yaml:25-35`，`:48-68`，`:221-229` | `problem_type: knowledge` 无效；应使用 `best_practice` / `convention` + `pattern` + `invalidation_condition` |
| skill-review coverage | `skills/retired-skill-review/SKILL.md:83-87`，`references/expert-audit-rubric.md:35-44` | 已覆盖 progressive disclosure，Ponytail 启发只需补 broad generation nuance |
| thin CLI wrappers | `src/cli/skills.js:1-29`，`agents.js:1-19`，`spec-commands.js:1-12` | 不把 YAGNI 语义塞进 CLI wrapper |
| plugin manifest | `src/cli/plugin.js:112-147`，`src/cli/contracts/dual-host-governance/skills-governance.json` | 新增 public skill 才需要 governance + command template；本方案不建议 P0 新增 public skill |

---

## 2. Ponytail 不是“更短代码提示词”

### 2.1 Ponytail 的真实能力模型

源码显示 Ponytail 至少有六层机制：

```text
1. Rule ladder
   是否需要存在 -> stdlib -> native platform -> installed dependency -> one line -> minimum works

2. Safety guard
   validation / security / accessibility / error handling / calibration 不可被简化掉

3. Persistent session posture
   SessionStart 注入 + mode flag + status line / mode tracking

4. Command surface
   review / audit / debt / gain / help

5. Debt ledger
   ponytail: comment 记录 ceiling + upgrade path，debt 命令收敛成 ledger

6. Benchmark discipline
   用真实 agentic sessions 衡量 LOC/tokens/cost/time/safety，并公开 limitations
```

因此，早期说“Ponytail 是 prompt 注入，spec-first 是阶段合约”只说对了一半。更准确是：

```text
Ponytail = persistent posture + command surface + minimality rule ladder + debt ledger + benchmark discipline
spec-first = spec-driven workflow harness + source/runtime governance + evidence / review / knowledge loop
```

### 2.2 spec-first 应吸收的不是 runtime 注入形态

Ponytail 的 hooks / plugin 交付值得研究，但不应照搬到 spec-first 的核心路径：

- spec-first 的 current value 不在“给每个宿主再加一个总是活跃的提示词”，而在 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 的 evidence loop。
- `spec-first` 已有 source/runtime mirror 纪律。直接引入 Ponytail runtime 形态，会增加 host adapter / plugin / hook 维护面。
- Ponytail 规则不是 confirmed fact。它只能提供 posture，不能替代 plan、source reads、tests、review findings、honest closeout。
- 全局开关容易绕开 repo-local source truth。spec-first 应把最小实现判断写入 source-owned workflow/agent contract。

推荐吸收：

```text
吸收 ladder / safety guard / debt ledger / benchmark discipline；
不吸收 global runtime wrapper / host-level opaque switch。
```

---

## 3. 设计原则

### 3.1 Light Contract

Minimal Implementation Contract 是语义边界，不是脚本状态。第一版只做 Markdown guidance / plan section，不新增 JSON schema，不让脚本判断“是否过度设计”。

### 3.2 Explicit Boundaries

- Source truth：`skills/`、`agents/`、`docs/`、`src/cli/contracts/**`。
- Generated runtime：`.claude/`、`.codex/`、`.agents/skills/`，本方案不手改。
- Ponytail repo：研究输入，不是 spec-first 的 runtime dependency。
- task-pack JSON contract：已有 validator allowlist，本方案不扩字段。

### 3.3 Scripts Prepare, LLM Decides

脚本可以做：

- 检查 task-pack 是否有 unknown field；
- 校验 reviewer JSON schema；
- 记录 benchmark / eval 输出；
- 检查 docs/solutions frontmatter enum。

LLM / reviewer 判断：

- 当前抽象是否被真实 consumer 支撑；
- 复用现有模块是否比新增实现更清晰；
- 一行写法是否牺牲可读性或安全；
- 哪些 Ponytail-style shortcut 应沉淀为 durable knowledge。

---

## 4. 与 spec-first 主链路的映射

| Ponytail 机制 | spec-first 节点 | 集成方式 | 优先级 |
| --- | --- | --- | --- |
| Does this need to exist? | `spec-plan`, `spec-work`, `spec-code-review` | plan 说明 Required Now / Not Yet；work 写前查 scope；review 查无需求支撑代码 | P0 |
| Stdlib / native platform first | `spec-plan`, `spec-work` | plan / work 明确 reuse candidates，优先标准库、平台特性、现有依赖 | P0 |
| Installed dependency / project module reuse | `spec-plan`, `spec-work`, `spec-write-tasks` | 用 plan refs 与 task `context_refs` 指向复用候选 | P0/P1 |
| One line / shortest working diff | `spec-work`, `spec-code-review` | 只作为候选，不压过可读性、安全和框架结构 | P1 |
| Safety guard | `spec-code-review`, `spec-work` | reviewer “What not to flag” 和 verification loop 保留必要 guard | P0 |
| `ponytail:` shortcut ledger | `spec-compound`, docs/solutions | 映射为 `pattern` + `invalidation_condition` + `source_refs` | P1 |
| `/ponytail-review` / audit | `spec-code-review`, `spec-optimize` | review 查当前 diff；optimize 做显式度量驱动精简 | P1 |
| benchmark / gain | eval / validation docs | future eval 用真实任务测 overbuild reduction 与 false-positive | P2 |

---

## 5. P0-A：升级 `spec-code-simplicity-reviewer` 并接入 `spec-code-review`

### 5.1 当前问题

`agents/spec-code-simplicity-reviewer.agent.md` 已经高度贴合 YAGNI：

- specializing in minimalism and YAGNI；
- Analyze Every Line；
- Challenge Abstractions；
- Remove just-in-case code；
- 已有 `What you don't flag` 保护条款。

但它当前输出 Markdown：

```markdown
## Simplification Analysis
...
```

`spec-code-review` 的 reviewer pipeline 要求 JSON findings schema。字段包括：

```json
{
  "reviewer": "code-simplicity",
  "findings": [],
  "residual_risks": [],
  "testing_gaps": []
}
```

每个 finding 还必须符合 `skills/spec-code-review/references/findings-schema.json`：`severity`、`confidence`、`autofix_class`、`owner`、`requires_verification`、`evidence`、`pre_existing` 等。

### 5.2 改造范围

必须同步这些 source：

```text
agents/spec-code-simplicity-reviewer.agent.md
skills/spec-code-review/SKILL.md
skills/spec-code-review/references/persona-catalog.md
skills/spec-code-review/evals/examples.json
tests/unit/spec-code-review-contracts.test.js
```

不需要改：

```text
src/cli/skills.js
src/cli/agents.js
src/cli/spec-commands.js
```

### 5.3 推荐 reviewer 选择策略

不要把它简单加入所有 review 的默认核心队列，否则 review 成本会上升且与 maintainability 重叠。

推荐条件触发：

| 场景 | 是否调度 |
| --- | --- |
| low-risk tiny executable diff | 默认由 maintainability 覆盖，不额外调度 |
| diff 新增抽象层、interface、factory、mode flag、helper framework | 调度 code-simplicity |
| diff LOC 明显膨胀，且 plan scope 很窄 | 调度 code-simplicity |
| plan / task 明确带 Minimal Implementation Contract | 调度 code-simplicity |
| 用户显式要求 YAGNI / minimality review | 强制调度 code-simplicity |
| docs-only / config-only | 一般不调度，除非文档本身是 workflow/prompt 设计并诱导过度生成 |

### 5.4 severity 与 confidence 校准

| 情况 | Severity | Confidence |
| --- | --- | --- |
| diff 引入未被 plan/requirement 支撑的大型框架、插件层、通用系统 | P1 | 75/100，需能引用 plan/source evidence |
| 单消费者 interface、thin wrapper、future flag、未使用 extension point | P2 | 75，当 diff 和 consumer 搜索能确认 |
| 可以安全删除的 dead wrapper / unused branch | P2 或 P3 | 100，若机械可证 |
| 可读性不受影响的小幅精简机会 | P3 / advisory | 50/75，按 synthesis 可能进入 soft bucket |
| 仅基于风格偏好、无法证明当前不需要 | suppress | 25 或以下 |

### 5.5 必须保留的 false-positive guard

不能 flag：

- 有当前消费者或 public contract 的抽象；
- 框架/host runtime 要求的结构；
- test doubles、harness adapters、source/runtime boundary adapters；
- 为可读性展开的分支；
- spec-first workflow artifacts、plans、solutions、validation docs；
- 安全、权限、数据完整性、accessibility、trust-boundary validation；
- 用户或 plan 明确要求保留的结构。

---

## 6. P0-B：在 `spec-plan` 引入轻量 Minimal Implementation Contract

### 6.1 当前落点

不能只改 `skills/spec-plan/SKILL.md` 的原则段。真正影响计划产物的 source 包括：

```text
skills/spec-plan/SKILL.md
skills/spec-plan/references/plan-template.md
skills/spec-plan/references/plan-sections.md
tests/unit/spec-plan-contracts.test.js
skills/spec-plan/evals/examples.json
```

`plan-sections.md` 已有 `Hard Floor` 与 `Include When Material`。Minimal Implementation Contract 应进入 `Include When Material`，不是每个 plan 的硬必填大段。

### 6.2 推荐结构

第一版用 Markdown，且允许 compact。

```markdown
## Minimal Implementation Contract

- **Required now:** [当前 origin requirements 必须满足的最小行为 / artifact]
- **Reuse first:** [必须先检查的 stdlib / native platform / existing dependency / existing project code]
- **Not yet:** [本轮不建的 abstraction / compatibility layer / generalized framework / future mode]
- **Smallest verification loop:** [最窄 test / CLI / schema / docs check]
- **Escalation trigger:** [什么证据出现后才升级为更大抽象]
```

对于 lightweight plan，可压缩进 `Decision Brief` 或 `Scope Boundaries`：

```markdown
**Minimality boundary:** Required now is X; reuse Y before adding Z; defer abstraction A until second production consumer appears.
```

### 6.3 不做的事

- 不新增 JSON schema。
- 不要求 docs-only / research-only plan 生成空字段。
- 不把“能一行解决吗”写成强制 code style。
- 不让 plan 变成 implementation choreography。

---

## 7. P0-C：在 `spec-work` 增加 Minimality Preflight

### 7.1 当前落点

`spec-work` 已有：

- smallest feedback loop；
- do not expand scope in place；
- follow existing patterns；
- simplify as you go。

因此 Minimality Preflight 不是新 phase，不是新 artifact，而是补进 Phase 1 / Phase 2 的紧凑检查。

建议 source：

```text
skills/spec-work/SKILL.md
tests/unit/spec-work-contracts.test.js
skills/spec-work/evals/examples.json
```

### 7.2 推荐文案

```markdown
Before editing behavior-bearing source, run a compact minimality check against the active plan/task:

1. Is this change required by the active plan/task, requirement ref, acceptance ref, bug fix, or verification loop?
2. Can the need be met by deleting code, changing configuration, using the standard library, using a native platform feature, or reusing an existing dependency/module?
3. Would a new abstraction, mode flag, compatibility shim, or generalized helper serve current consumers, or only future possibility?
4. Can the same verification signal close a smaller vertical slice?
5. If the smallest viable implementation exceeds the plan/task boundary, stop and return to `spec-plan` or regenerate the task pack.

Record a compact closeout note only when the check changed the implementation approach, rejected an obvious overbuild, or left residual risk.
```

### 7.3 与现有规则的关系

Minimality Preflight 具体化已有 `Do not expand scope in place`，不替代：

- feedback loop；
- task-pack validation；
- source plan authority；
- tests/checks；
- final code review。

---

## 8. P1-A：`spec-write-tasks` 不新增字段，复用现有 task contract

### 8.1 为什么不能新增 `minimality_refs`

当前 task-pack 有 machine-readable `Task Pack Contract` JSON。`src/cli/task-pack.js` 明确 allowlist：

```text
task_id, dependencies, files, goal, test_focus, done_signal, wave, stop_if,
source_unit, requirement_refs, context_refs, entry_hint, parallelizable,
expected_side_effects, risk_note, notes, review_gate, review_focus,
handoff_owner, target_repo
```

新增：

```yaml
minimality_refs:
reuse_refs:
yagni_stop_if:
```

会触发 unknown field limitation，并且若要正式支持，必须同步：

```text
src/cli/task-pack.js
skills/spec-write-tasks/references/task-pack-schema.md
tests/unit/spec-write-tasks-contracts.test.js
tests/unit/task-pack-command.test.js
```

这违反本方案的 YAGNI 目标。

### 8.2 正确映射

| Minimality intent | 现有字段 |
| --- | --- |
| 指向 plan 的 Minimal Implementation Contract | `context_refs` |
| 指向复用候选文件 / pattern | `context_refs` |
| 实现若需要新抽象则停下 | `stop_if` |
| 复用/最小实现风险说明 | `risk_note` |
| 要求 final review 检查 YAGNI | `review_focus` |
| 高风险任务需要 mini review | `review_gate` |

示例：

```json
{
  "task_id": "T002",
  "source_unit": "U2",
  "requirement_refs": ["R3"],
  "goal": "Add the smallest behavior slice required by U2.",
  "files": ["src/example.js", "tests/example.test.js"],
  "context_refs": [
    "docs/plans/example-plan.md#Minimal-Implementation-Contract",
    "src/existing/helper.js"
  ],
  "test_focus": "Prove the required slice works without introducing the deferred abstraction.",
  "done_signal": "Focused test passes and no new public abstraction is added.",
  "risk_note": "Existing helper may cover most behavior; avoid a new framework unless source evidence disproves reuse.",
  "review_focus": "code-simplicity: check reuse-first and no future-facing abstraction.",
  "stop_if": "A new public abstraction, compatibility layer, or mode flag is needed but absent from the source plan.",
  "wave": 1,
  "dependencies": []
}
```

### 8.3 可改 source

如果要增强 task-pack guidance，只改 prose / examples：

```text
skills/spec-write-tasks/SKILL.md
skills/spec-write-tasks/references/task-quality-guide.md
```

除非明确决定扩字段，否则不改：

```text
src/cli/task-pack.js
skills/spec-write-tasks/references/task-pack-schema.md
```

---

## 9. P1-B：`spec-compound` 沉淀 minimal-implementation learning

### 9.1 当前 schema 已足够

不应新增：

```yaml
problem_type: knowledge
```

因为 `knowledge` 是 track 名，不是合法 enum。

当前可用 enum：

```yaml
problem_type: best_practice
# 或
problem_type: convention
```

当前 schema 已支持：

```yaml
domain: implementation-minimality
pattern: minimal-implementation
invalidation_condition: "A second production consumer appears, or public API compatibility requires the abstraction."
source_refs:
  - docs/plans/example-plan.md
  - agents/spec-code-simplicity-reviewer.agent.md
  - tests/example.test.js
```

注意：`invalidation_condition` 当前 schema 是 string，不是 array。

### 9.2 Ponytail debt ledger 的 spec-first 映射

Ponytail 的 `ponytail:` comment 机制可映射为 spec-first durable knowledge：

| Ponytail | spec-first |
| --- | --- |
| `ponytail:` comment | work closeout / review finding / docs/solutions source ref |
| ceiling | `invalidation_condition` 前半：当前简化的适用上限 |
| upgrade path | `invalidation_condition` 后半：何时升级 |
| `/ponytail-debt` ledger | `spec-compound` / `spec-compound-refresh` 维护的可复用 learning |
| no-trigger risk | 缺 `invalidation_condition` 的 knowledge 不应 promoted |

推荐 learning 示例：

```yaml
---
module: spec-first
date: 2026-06-19
problem_type: best_practice
component: development_workflow
severity: medium
domain: implementation-minimality
pattern: minimal-implementation
tags:
  - yagni
  - minimal-implementation
  - code-review
invalidation_condition: "A second production consumer appears, or the source plan explicitly requires a public extension point / compatibility layer."
source_refs:
  - agents/spec-code-simplicity-reviewer.agent.md
  - skills/spec-code-review/SKILL.md
---
```

### 9.3 可改 source

```text
skills/spec-compound/SKILL.md
skills/spec-compound/assets/resolution-template.md
skills/spec-compound/evals/examples.json
tests/unit/spec-compound-contracts.test.js
```

通常不需要改：

```text
skills/spec-compound/references/schema.yaml
skills/spec-compound/references/yaml-schema.md
```

---

## 10. P1-C：`spec-optimize` 做显式度量驱动减法

Ponytail 的日常策略是写前少做；`spec-optimize` 的职责应是对已存在膨胀代码做显式优化，而不是让日常 `spec-work` 顺手大重构。

适用场景：

```text
用户明确要求：
- 减少不必要代码
- 降低复杂度
- 缩小 bundle
- 降低 prompt/workflow 长度
- 提升 review 可读性或维护性
```

推荐 optimization spec：

```yaml
name: reduce-unnecessary-code
metric:
  primary:
    name: unnecessary_surface_loc
    direction: decrease
  gates:
    - command: npm test
      expectation: pass
    - command: npm run typecheck
      expectation: pass
guardrails:
  - do_not_remove_trust_boundary_validation
  - do_not_remove_tests_or_contract_artifacts
  - do_not_replace_readable_logic_with_code_golf
```

风险：

- LOC 只能是辅助指标；
- 必须保留 security / validation / accessibility；
- 必须跑 verification；
- 必须经 review 或用户确认处理 false positive。

---

## 11. P2：`retired-skill-review` 只补反膨胀 nuance

`retired-skill-review` 已经检查：

- trigger precision；
- scope boundaries；
- progressive disclosure；
- long examples；
- duplicate rubrics；
- provider-specific details；
- large checklists；
- operational reference material。

因此不需要新增脚本规则引擎。只需在 rubric / guidance 中补一条：

```markdown
Flag skills that encourage broad generation, speculative artifacts, unbounded implementation, or always-create-heavy-artifact behavior when a smaller bounded answer/workflow would satisfy the request.
```

可改：

```text
skills/retired-skill-review/SKILL.md
skills/retired-skill-review/references/expert-audit-rubric.md
tests/unit/skill-review-scripts.test.js
```

不建议改：

```text
skills/retired-skill-review/scripts/write-audit-artifacts.js
scripts/lint-skill-entrypoints.js
scripts/lint-skill-entrypoints.config.json
```

除非后续先定义出 deterministic signal，例如 entrypoint token budget、reference link count、main SKILL.md line threshold 等，并证明低误报。

---

## 12. 数据结构与 contract

### 12.1 Minimal Implementation Contract

第一版 canonical form 是 Markdown section。它是 LLM-owned semantic boundary，不是 script-owned deterministic fact。

```markdown
## Minimal Implementation Contract

- **Required now:** ...
- **Reuse first:** ...
- **Not yet:** ...
- **Smallest verification loop:** ...
- **Escalation trigger:** ...
```

### 12.2 Task-pack 不新增字段

通过现有字段表达：

```json
{
  "context_refs": ["docs/plans/example.md#Minimal-Implementation-Contract"],
  "risk_note": "Avoid new abstraction unless current source evidence disproves reuse.",
  "review_focus": "code-simplicity",
  "stop_if": "Need a new abstraction absent from source plan."
}
```

### 12.3 Compound learning 使用现有 schema

```yaml
problem_type: best_practice
domain: implementation-minimality
pattern: minimal-implementation
invalidation_condition: "A second production consumer appears."
source_refs:
  - docs/plans/example.md
  - skills/spec-code-review/SKILL.md
```

### 12.4 后续 JSON summary 触发条件

只有当 `spec-work-run-artifact` 或其他 deterministic consumer 真正需要结构化消费 minimality contract 时，才考虑新增 JSON summary：

```json
{
  "minimality_contract": {
    "required_now": [],
    "reuse_candidates": [],
    "not_yet": [],
    "smallest_verification_loop": [],
    "escalation_triggers": []
  }
}
```

P0 不做。

---

## 13. 分阶段实施顺序

### Phase 0：准备 eval 与源码证据

目标：不改 workflow 行为，先写能验证行为的例子。

1. 为 `spec-code-review/evals/examples.json` 增补 minimality / false-positive cases。
2. 收集 3-5 个真实或 synthetic diff：
   - 单消费者 interface；
   - 框架 adapter 不能误报；
   - test harness fixture 不能误删；
   - future flag 无当前 consumer；
   - plan 明确要求 extension point。
3. 确认 code-simplicity reviewer JSON schema 输出样例。

完成信号：即使不实现改动，也能说明新 reviewer 该报什么、不该报什么。

### Phase 1：接入 code-simplicity reviewer

目标：让当前 review pipeline 立刻获得 YAGNI  lens。

改：

```text
agents/spec-code-simplicity-reviewer.agent.md
skills/spec-code-review/SKILL.md
skills/spec-code-review/references/persona-catalog.md
tests/unit/spec-code-review-contracts.test.js
```

验证：

```bash
npm run lint
npm run typecheck
npx jest tests/unit/spec-code-review-contracts.test.js --runInBand
```

行为验证：

- reviewer 返回 JSON；
- low-risk tiny diff 不默认 fan-out；
- broad/generated-looking diff 会调度；
- false-positive guard 保留；
- findings 能过 synthesis confidence gate。

### Phase 2：plan/work 最小实现边界

目标：把写前判断前移到 plan/work，但保持轻合同。

改：

```text
skills/spec-plan/SKILL.md
skills/spec-plan/references/plan-template.md
skills/spec-plan/references/plan-sections.md
skills/spec-work/SKILL.md
tests/unit/spec-plan-contracts.test.js
tests/unit/spec-work-contracts.test.js
```

验证：

```bash
npm run lint
npm run typecheck
npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js --runInBand
```

行为验证：

- Standard/Deep plan 在 material 时出现 compact Minimal Implementation Contract；
- Lightweight plan 可省略或压缩；
- `spec-work` closeout 只在 preflight 影响实现时记录；
- 不新增 durable artifact。

### Phase 3：task-pack 与 compound 轻量承接

目标：让 task-pack / compound 承接最小实现边界，不扩 schema。

改：

```text
skills/spec-write-tasks/SKILL.md
skills/spec-write-tasks/references/task-quality-guide.md
skills/spec-compound/SKILL.md
skills/spec-compound/assets/resolution-template.md
tests/unit/spec-write-tasks-contracts.test.js
tests/unit/spec-compound-contracts.test.js
```

验证：

```bash
npx jest tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-compound-contracts.test.js --runInBand
```

行为验证：

- task-pack 使用 `context_refs` / `stop_if` / `review_focus`；
- 不出现 unknown task fields；
- compound 使用合法 `problem_type` enum；
- new promoted learning 带 `source_refs` 和 string `invalidation_condition`。

### Phase 4：optimize / skill-review 后续增强

目标：只在真实需求出现时再扩。

```text
spec-optimize：显式 metric-driven code reduction mode
retired-skill-review：rubric nuance，不新增脚本规则引擎
```

---

## 14. 测试与验收矩阵

| 改动面 | 最窄验证 |
| --- | --- |
| 只改本方案文档 | `git diff --check`，人工检查 source refs |
| code-simplicity reviewer 接入 | `npx jest tests/unit/spec-code-review-contracts.test.js --runInBand` + fresh-source eval |
| plan/work prompt 改造 | `npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js --runInBand` |
| task-pack prose 承接 | `npx jest tests/unit/spec-write-tasks-contracts.test.js --runInBand` |
| compound learning guidance | `npx jest tests/unit/spec-compound-contracts.test.js --runInBand` |
| skill-review nuance | `npx jest tests/unit/skill-review-scripts.test.js --runInBand` |
| 全局 source sanity | `npm run lint`、`npm run typecheck` |
| 发布前 | `npm test`、`npm run build` |

Fresh-source eval 要点：

- 不能依赖当前会话缓存的 agent/skill；
- 把当前磁盘 source 注入 fresh reviewer；
- 覆盖 false positive guard；
- 记录未执行原因，不能声称通过。

---

## 15. 风险与应对

### 15.1 把 YAGNI 误解成 code golf

应对：

- 文案统一使用 `minimal necessary implementation`；
- reviewer 明确 “readability-preserving expansion should not be collapsed only to reduce LOC”；
- security / validation / accessibility / data integrity 永不作为简化目标。

### 15.2 plan 文档膨胀

应对：

- `Minimal Implementation Contract` 进入 include-when-material；
- lightweight plan 可一句话；
- 不强制 docs-only / research-only plan 生成空 section。

### 15.3 task-pack schema creep

应对：

- 不新增 task fields；
- 用 `context_refs`、`risk_note`、`stop_if`、`review_focus`；
- 只有 deterministic consumer 真实需要时再扩 schema。

### 15.4 reviewer false positives

应对：

- confidence anchor 不到 75 的大多 suppress 或 soft bucket；
- `What you don't flag` 必须覆盖 framework / test harness / source-runtime adapters；
- plan 明确要求的 extension point 不能报 YAGNI。

### 15.5 benchmark 过度外推

应对：

- Ponytail benchmark 是有价值证据，但不是 spec-first 场景的 confirmed eval；
- spec-first 需要自己的 eval / replay；
- Ponytail 的 `-54% LOC` 不能直接作为 spec-first 成功指标。

---

## 16. 最终建议

如果只能做一个 P0，优先：

```text
升级 `agents/spec-code-simplicity-reviewer.agent.md`
并把它接入 `skills/spec-code-review` structured JSON pipeline。
```

理由：

- agent 已存在，语义贴合；
- 当前缺口明确：输出格式和 pipeline 接入；
- 作用面直接：写完后的过度抽象可以被 review 捕捉；
- false-positive guard 已有基础；
- 不新增 public skill、不新增 CLI、不新增 runtime dependency。

第二步再把最小实现边界前移到 `spec-plan` 和 `spec-work`。这两步形成最小闭环：

```text
Plan 少设计 -> Work 少新增 -> Review 少保留 -> Compound 下次少重复犯错
```

这才是 Ponytail 对 spec-first 的正确启发：不是“让 AI 永远写更短代码”，而是把“是否真的需要写”变成可审查、可验证、可复用、可沉淀的工程判断。
