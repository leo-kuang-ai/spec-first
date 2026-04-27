# Claude Code 上下文频繁 compact 根因分析与彻底解决方案

Created: 2026-04-27
Author: leokuang
Status: diagnosis-complete / solution-proposed

## 1. 结论摘要

当前在 `spec-first` 仓库中使用 Claude Code CLI 时，上下文很快打满并频繁 compact，根因不是单个 `CLAUDE.md` 过长，也不是 Claude Code 2.1.119 本身异常，而是 `spec-first` 的 Claude runtime 资产设计把完整 workflow prompt 直接内联进 `/spec:*` slash command 文件，再叠加 `SessionStart` 在 `compact` 后重复注入，形成了一个高上下文占用、可被自动 compact 放大的闭环。

高置信根因链：

1. `src/cli/adapters/claude.js` 在渲染 Claude command 时，将 command template frontmatter 与 `skills/spec-*/SKILL.md` 的完整正文合并。
2. 生成后的 `.claude/commands/spec/*.md` 不是入口 wrapper，而是完整 workflow prompt；`.claude/commands/spec` 总量约 `484 KB / 7255 lines`。
3. Claude Code 执行 `/spec:plan` 等 command 时，完整 command body 会以 `user` message 进入 transcript。实测 `/spec:plan` 单次注入约 `52 KB` 文本。
4. `.claude/settings.json` 的 `SessionStart` matcher 包含 `compact`，每次自动 compact 后会再次调用 `.claude/hooks/session-start` 并注入 `additionalContext`。
5. 大 workflow prompt、代码读取、CRG 输出、subagent 输出、用户要求生成长文档等内容叠加，使会话很快达到 `167k-199k+` tokens，然后自动 compact；compact 后又重新注入入口上下文，形成循环。

彻底解决不能靠“删 workflow 内容”或“让 prompt 变笨”。正确方向是：

- command 层瘦身：slash command 只作为入口，不承载完整认知负载。
- workflow 层按需加载：保留完整 workflow 能力，但按阶段、按模式加载。
- hook 层止血：从 `SessionStart` matcher 移除 `compact`，避免 compact 后重复注入。
- 预算层治理：让 `doctor` 和 contract tests 检查 context budget，而不仅检查文件是否存在、是否 drift。
- 语义保真：用 parity map、contract tests 和 fresh-source eval 证明能力没有降级。

## 2. 问题现象

用户反馈：进入 Claude Code CLI 后，上下文很快打满，然后频繁 compact。

该现象在本机 transcript 中可复现为：

- 多个 spec-first 会话出现多次 `Conversation compacted`。
- compact 触发前 `preTokens` 常见在 `167k-199k`。
- 同一会话中可出现 5-7 次自动 compact。
- compact 后继续出现 `SessionStart:compact` hook 和 `hook_additional_context`。

这说明问题不是单次偶发，而是运行时上下文经济性设计存在系统性缺口。

## 3. 证据链

### 3.1 静态 runtime 体量

当前 `.claude/commands/spec` 体量：

| 文件 | 行数 | 字节数 |
| --- | ---: | ---: |
| `.claude/commands/spec/code-review.md` | 872 | 78430 |
| `.claude/commands/spec/plan.md` | 881 | 57093 |
| `.claude/commands/spec/compound-refresh.md` | 679 | 48851 |
| `.claude/commands/spec/work-beta.md` | 469 | 38902 |
| `.claude/commands/spec/ideate.md` | 344 | 36722 |
| `.claude/commands/spec/optimize.md` | 658 | 35438 |
| `.claude/commands/spec/work.md` | 412 | 34444 |
| `.claude/commands/spec/compound.md` | 545 | 33534 |
| `.claude/commands/spec` total | 7255 | 484111 |

当前 `.claude` 下 markdown runtime 总量约 `874 KB / 13639 lines`。其中 command 文件是最大头，agents/skills 也有约 `390 KB`。

### 3.2 command 生成逻辑证明完整 skill 被内联

`src/cli/plugin.js` 读取 command template 和 skill source：

```js
function renderRuntimeCommandContent(command, adapter) {
  const templateContent = readBundledCommandTemplate(command.name);
  const skillContent = readBundledSkillSource(command.skill);
  return adapter.renderCommandContent(command, templateContent, {
    commandName: command.name,
    skillName: command.skill,
    skillContent,
  });
}
```

`src/cli/adapters/claude.js` 将 template frontmatter 与 skill body 合并：

```js
renderCommandContent(_command, templateContent, context = {}) {
  if (typeof context.skillContent !== 'string') {
    return this.transformSkillContent(templateContent, context);
  }

  const { frontmatter } = splitMarkdownFrontmatter(templateContent);
  const { body } = splitMarkdownFrontmatter(context.skillContent);
  const merged = frontmatter
    ? `${frontmatter}\n\n${body}`
    : body;

  return this.transformSkillContent(merged, context);
}
```

因此，`templates/claude/commands/spec/plan.md` 虽然只有 metadata 和说明，但 runtime `.claude/commands/spec/plan.md` 会变成完整 `skills/spec-plan/SKILL.md` 正文。

### 3.3 transcript 证明 command body 实际进入上下文

本机 Claude Code 版本：

```text
2.1.119 (Claude Code)
```

在 transcript `~/.claude/projects/-Users-kuang-xiaobu-spec-first/6f76183f-919b-4e7d-9b31-44c3868cba3c.jsonl` 中：

| 行号 | 类型 | 证据 |
| ---: | --- | --- |
| 109 | `user` | `/spec:plan` 的完整 `# Create Technical Plan` prompt 进入 message，文本约 `52432` 字符 |
| 115 | `system compact_boundary` | 自动 compact，`preTokens=191087`，`postTokens=23628` |
| 124 | `attachment hook_success` | `SessionStart:compact` 被调用 |
| 125 | `attachment hook_additional_context` | compact 后注入 `additionalContext`，约 `937` 字符 |

这证明大 command body 不是“仅磁盘文件较大”的静态风险，而是至少在 slash command 执行时真实进入模型上下文。

### 3.4 compact 后重复注入已被历史设计文档预判

`docs/plans/2026-04-17-using-spec-first-technical-design.md` 中已经写明：

- `SessionStart` 在 matcher 命中时调用 hook。
- `once: true` 对 settings 下 hook 被忽略。
- 在 `startup|resume|clear|compact` 下，`/clear` 或自动 compact 后会重新注入。
- 官方不保证跨 `clear/compact` 去重。
- 如果未来观测到上下文膨胀，降级手段是从 matcher 中移除 `compact`。

现在用户遇到的正是该设计风险的实际发生。

### 3.5 多会话统计

抽样 spec-first transcript：

| session | compact 次数 | max preTokens | hook additionalContext 次数 | hook 注入总字符 |
| --- | ---: | ---: | ---: | ---: |
| `6f76183f...` | 6 | 191087 | 7 | 6559 |
| `7449996e...` | 7 | 199029 | 8 | 36944 |
| `0ddb21ed...` | 5 | 197230 | 9 | 41634 |
| `bff7c5ec...` | 5 | 175265 | 6 | 27708 |
| `d1655ec0...` | 5 | 184355 | 6 | 29262 |

近期 hook 注入已降到约 937 字符/次，但历史会话中曾有约 4.6 KB/次的 `using-spec-first` 全文注入版本。也就是说，即使当前 hook 已经比旧版本轻，`compact` matcher 仍然会制造重复注入；真正的大头则是 workflow command 正文和后续工具输出。

## 4. 根因分层

### 4.1 P0 根因：slash command 承载完整 workflow prompt

Claude command 层本应负责：

- 暴露 `/spec:*` 入口。
- 接收 `$ARGUMENTS`。
- 给模型一个最小执行入口。

当前实际负责：

- 暴露入口。
- 承载完整 workflow 说明。
- 承载 mode detection、quality bar、phase details、agent dispatch rules、output schema、handoff rules。

这导致入口层与认知层混在一起。每次用户触发 workflow，整个 workflow prompt 一次性进入上下文。

### 4.2 P1 放大器：`SessionStart` 订阅了 `compact`

`src/cli/claude-settings.js` 当前：

```js
const SESSION_START_MATCHER = 'startup|resume|clear|compact';
```

这会在自动 compact 后再次注入 hook context。单次注入现在不算大，但在频繁 compact 的会话里会重复发生，而且旧版本更重。

更重要的是，这会制造错误的系统反馈：compact 本应释放上下文，但 compact 后立刻又注入一份治理上下文。虽然当前注入较小，但它说明设计上没有把 compact 作为“上下文经济事件”处理。

### 4.3 P1 放大器：工作流本身是高上下文场景

`spec-plan`、`spec-code-review`、`spec-work` 的工作方式天然会读取大量信息：

- 仓库结构与局部源码。
- 历史方案和项目规范。
- CRG 查询输出。
- subagent 或 reviewer 输出。
- 计划、评审、任务包等长文档。

这类 workflow 需要上下文，但当前做法在“开始执行之前”已经把完整流程说明注入了一大块。它消耗的是底噪预算，不是任务必要事实预算。

### 4.4 P2 系统缺口：doctor 不检查 context budget

当前 `doctor --claude --json` 能检查：

- runtime asset 是否存在。
- state 是否记录了 commands、skills、agents。
- drift 是否存在。
- host readiness 是否通过。

但它不检查：

- 单个 command 文件大小。
- command 总量。
- hook additionalContext 预算。
- `.claude/agents` 和 `.claude/skills` runtime 预算。
- transcript 中 command prompt 是否过大。
- compact 次数是否异常。

所以当前 runtime 可以在“资产健康”上通过，同时在“上下文经济性”上失败。

## 5. 为什么不能用“降智式”方案

这里的目标不是简单减少 token，而是在不损失 workflow 能力的前提下，减少默认进入上下文的内容。

以下方案不合格：

1. 直接删除 `spec-plan` / `spec-code-review` / `spec-work` 的 quality bar、mode rules、handoff rules。
2. 把 workflow prompt 粗暴总结成一页，丢失边界、例外、验收和失败处理。
3. 让模型凭记忆执行 workflow，而不是读取当前磁盘 source-of-truth。
4. 把复杂判断改成脚本状态机，违背 `Light contract / Explicit boundaries / Let the LLM decide`。
5. 把所有 workflow 强制走一个统一 orchestrator，造成中心化 gate 和职责混杂。
6. 只移除 `compact` matcher 就宣布根治，忽略 command 内联大 prompt 的主因。

“不能降智”的工程定义：

- 语义内容不丢：现有 workflow 的关键规则、边界、质量标准、异常路径必须可达。
- 加载时机改变：从启动/入口时全量加载，改成执行时按需加载。
- 判断主体不变：LLM 仍负责语义判断，脚本只做确定性渲染、校验、预算统计和文件定位。
- 单一真相源不破坏：workflow source 仍在 `skills/`，runtime 由 `spec-first init --claude` 生成。
- 能力可验证：用测试和 fresh-source eval 验证新 runtime 没有丢掉关键行为。

## 6. 彻底解决方案

### 6.1 目标架构

将 Claude runtime 拆成四层：

```text
templates/claude/commands/spec/*.md
  只定义 slash command metadata 和极薄入口指令

skills/spec-*/SKILL.md
  source-of-truth workflow 入口、核心原则、阶段索引、关键边界

skills/spec-*/references/*.md
  phase-level / mode-level / schema-level 详细规则，按需加载

.claude/spec-first/workflows/<skill>/**
  init 生成的受管 runtime workflow assets，供 Claude command 按需读取
```

Claude command 不再内联完整 skill body，而是生成类似：

```md
---
description: "Run the Spec-First planning workflow"
argument-hint: "[requirements doc path or topic]"
---

# Spec-First Plan

Read `.claude/spec-first/workflows/spec-plan/SKILL.md` and execute that workflow with:

<arguments>
$ARGUMENTS
</arguments>

Load referenced phase files only when the workflow reaches that phase or when the current decision depends on them.
```

这不是让 workflow 变弱，而是改变加载策略：

- slash command message 从 50-80 KB 降到约 0.5-1.5 KB。
- workflow 入口仍可读到完整规则索引。
- 详细规则按 phase/mode 加载。
- 大型 workflow 的完整能力仍在 runtime 文件中，不靠模型记忆。

### 6.2 `SessionStart` 止血策略

把 `SESSION_START_MATCHER` 从：

```text
startup|resume|clear|compact
```

改为：

```text
startup|resume|clear
```

理由：

- `startup` 保证新会话入口治理存在。
- `resume` 保证恢复会话仍有入口治理。
- `clear` 保证用户主动清空后仍有入口治理。
- `compact` 是自动上下文压缩事件，不应再次注入治理上下文。

这一步是低风险止血，但不是最终根治。它解决重复注入放大器，不能解决 `/spec:*` command body 过大的主因。

### 6.3 workflow source 的保真拆分

对大型 workflow 不要删内容，而是做保真拆分：

```text
skills/spec-plan/SKILL.md
  - mission
  - current year note
  - direct invocation contract
  - argument handling
  - CRG anchor summary
  - phase index
  - quality bar summary
  - references loading contract

skills/spec-plan/references/phase-0-scope.md
skills/spec-plan/references/phase-1-research.md
skills/spec-plan/references/phase-2-design.md
skills/spec-plan/references/phase-5-deepening.md
skills/spec-plan/references/output-template.md
```

`SKILL.md` 保留“如何决策”和“何时加载”的核心说明；references 保留详细规则、模板、边界和异常处理。

关键原则：

- 不删除 capability，只移动 capability。
- 不把 LLM 决策变成脚本流程。
- 不让脚本判断“这个需求复杂不复杂”；LLM 判断，脚本只提供可读材料。
- 每个移动出去的 section 都要有 parity map。

### 6.4 runtime 生成策略

`spec-first init --claude` 应生成：

```text
.claude/commands/spec/plan.md
.claude/spec-first/workflows/spec-plan/SKILL.md
.claude/spec-first/workflows/spec-plan/references/phase-0-scope.md
.claude/spec-first/workflows/spec-plan/references/phase-1-research.md
...
```

`state.json` 应从当前：

```json
{
  "commands": 20,
  "standaloneSkills": 4,
  "workflowSkills": 0,
  "agents": 51
}
```

演进为能表达：

```json
{
  "commands": 20,
  "standaloneSkills": 4,
  "workflowSkills": 20,
  "workflowSupportFiles":  N,
  "agents": 51
}
```

这里的 `workflowSkills` 不是新增用户入口，而是 Claude command 的受管 workflow backing assets。

### 6.5 `doctor` 增加 context budget gates

新增只读预算检查：

| 检查项 | warning | fail |
| --- | ---: | ---: |
| 单个 `.claude/commands/spec/*.md` | > 4 KB | > 8 KB |
| `.claude/commands/spec` 总量 | > 50 KB | > 100 KB |
| `SessionStart` additionalContext 估算 | > 2 KB | > 4 KB |
| `.claude/skills/using-spec-first/SKILL.md` | > 12 KB | > 20 KB |
| 单个 workflow entry `SKILL.md` | > 20 KB | > 40 KB |
| 单个 phase/reference 文件 | > 24 KB | > 48 KB |

阈值不是为了限制思考能力，而是为了限制“默认加载内容”。详细 references 可以存在，但必须按需加载。

### 6.6 transcript regression harness

新增可选诊断命令或测试 helper：

```bash
spec-first doctor --claude --context-budget
spec-first doctor --claude --transcript-budget --session <jsonl>
```

建议输出：

- 最近 N 个 Claude session 的 compact 次数。
- 每次 compact 的 `preTokens` / `postTokens`。
- `SessionStart:compact` 是否存在。
- `/spec:*` command message 最大字符数。
- hook additionalContext 最大字符数。

这属于确定性事实统计，应由脚本做；是否接受风险、如何重构 workflow，仍由 LLM 和人判断。

## 7. 分阶段实施计划

### M0：建立 characterization baseline

目标：先锁定当前行为，避免修复时误判。

改动范围：

- 新增 unit tests 统计 runtime command size。
- 新增 fixture 或脚本覆盖 `SessionStart` matcher。
- 新增 transcript parser helper，可对本机 jsonl 做只读统计。

验收信号：

- 测试能证明当前 `.claude/commands/spec/plan.md` 是 full-body runtime。
- 测试能证明当前 matcher 包含 `compact`。
- 诊断脚本能输出 command body、hook context、compact count 的统计。

### M1：移除 `compact` matcher

目标：先切断 compact 后重复注入。

改动范围：

- `src/cli/claude-settings.js`
- `tests/unit/claude-settings.test.js`
- 相关 fixture/snapshot
- `CHANGELOG.md`

验收信号：

- `renderManagedSessionStartHookUpsert()` 生成 `startup|resume|clear`。
- `spec-first init --claude` 后 `.claude/settings.json` 不再包含 `compact`。
- `doctor --claude` 仍通过 managed hook 检查。

风险：

- 自动 compact 后不再重新注入 bootstrap。如果 compact summary 丢掉入口治理，模型可能少一次提醒。

为什么不算降智：

- `CLAUDE.md` 与 startup/resume/clear 仍提供入口治理。
- 用户主动 `/clear` 后仍会注入。
- 自动 compact 是上下文预算事件，不应强制重复注入治理文本。

### M2：Claude command 改为 thin wrapper

目标：解决主因，让 slash command 不再承载完整 workflow prompt。

改动范围：

- `src/cli/adapters/claude.js`
- `src/cli/plugin.js`
- `templates/claude/commands/spec/*.md`
- runtime integrity checks
- `.claude/spec-first/state.json` schema / state writer
- smoke tests

设计要点：

- `renderCommandContent()` 对 Claude workflow command 不再合并完整 skill body。
- 完整 workflow skill 渲染到 `.claude/spec-first/workflows/<skill>/SKILL.md`。
- command wrapper 指向该 runtime workflow file。
- integrity check 同时检查 command wrapper 和 workflow backing asset。

验收信号：

- 单个 `.claude/commands/spec/*.md` 小于 4 KB。
- `.claude/commands/spec` 总量小于 50 KB。
- `.claude/spec-first/workflows/spec-plan/SKILL.md` 存在且内容与 source skill transform 后一致。
- `/spec:plan` 仍能启动规划流程。

为什么不算降智：

- 完整 workflow 没有删除，只是从 command body 移到受管 workflow asset。
- command 明确要求读取该 workflow source。
- runtime integrity 继续保证 source/runtime 一致。

### M3：大型 workflow 做 progressive disclosure

目标：进一步减少执行中一次性加载的 workflow prompt，同时保留完整能力。

优先对象：

1. `spec-code-review`
2. `spec-plan`
3. `spec-compound-refresh`
4. `spec-work-beta`
5. `spec-work`

改动方式：

- `SKILL.md` 保留入口、原则、phase index、加载策略。
- phase/mode/schema/template 细节移到 `references/*.md`。
- 在 `SKILL.md` 中明确：“进入对应 phase 或需要该 mode 时读取对应 reference”。

验收信号：

- `SKILL.md` entry 文件控制在 8-16 KB。
- 每个 reference 文件有明确触发条件。
- 旧 workflow 的关键标题和规则能在 parity map 中找到新位置。
- fresh-source eval 证明典型任务不会遗漏关键步骤。

为什么不算降智：

- 不删除复杂规则。
- 将规则按使用时机分层。
- LLM 仍能在需要时读取完整细节。

### M4：加入 context budget doctor

目标：避免问题复发。

改动范围：

- doctor 检查模块
- JSON 输出 schema
- tests/unit 或 tests/smoke

新增 warning 示例：

```text
WARNING .claude/commands/spec/plan.md exceeds command budget: 57093 bytes > 4096 bytes.
```

新增 fail 示例：

```text
FAIL .claude/settings.json SessionStart matcher includes compact; this can reinject context after automatic compaction.
```

注意：是否 fail `compact` 可以分阶段。M1 后可直接 fail；迁移期可先 warning。

### M5：语义保真验证

目标：防止“瘦身”变成“降智”。

验证方法：

1. Section parity test
   维护每个大型 workflow 的 section map，例如：

   ```json
   {
     "spec-plan": {
       "CRG Planning Anchor": "SKILL.md",
       "Plan Quality Bar": "SKILL.md",
       "Phase 5.3 Deepening": "references/deepening.md",
       "Output Template": "references/output-template.md"
     }
   }
   ```

2. Contract tests
   检查关键短语、关键 mode、关键边界仍存在于 source/runtime。

3. Fresh-source eval
   把当前磁盘 source 注入 fresh generic agent，让它评估新 runtime 是否会在典型任务中遗漏：
   - CRG anchor
   - AskUserQuestion 使用规则
   - report-only/headless/autofix mode
   - plan 输出路径和 repo-relative path
   - review findings 合并和 safe_auto 边界

4. Dogfood transcript check
   用 `/spec:plan` 和 `/spec:code-review` 真实跑一小轮，确认：
   - slash command message 不再注入 50KB+ prompt。
   - workflow 仍能读取受管 workflow source。
   - compact 次数下降。

## 8. 不同方案对比

| 方案 | 解决主因 | 不降智 | 风险 | 结论 |
| --- | --- | --- | --- | --- |
| 只删 `compact` matcher | 否 | 是 | 低 | 必做止血，不是根治 |
| 直接删 workflow prompt 内容 | 是 | 否 | 高 | 不接受 |
| command thin wrapper + full workflow backing asset | 部分 | 是 | 中 | M2 必做 |
| progressive disclosure + parity tests | 是 | 是 | 中 | M3 根治 |
| 脚本 orchestrator 状态机 | 部分 | 否 | 高 | 不符合项目哲学 |
| doctor context budget + transcript regression | 防复发 | 是 | 低 | M4/M5 必做 |

## 9. 推荐实施顺序

推荐按以下顺序推进：

1. M0 先补 characterization tests，锁住现状。
2. M1 移除 `compact` matcher，立即减少重复注入。
3. M2 改 Claude command 为 thin wrapper，并生成 workflow backing assets。
4. M4 增加 context budget doctor，防止 runtime 再膨胀。
5. M3 逐个拆大型 workflow，先 `spec-plan` 和 `spec-code-review`。
6. M5 做语义保真验证和 dogfood transcript check。

不要先做 M3 再做 M2。原因是 M2 解决最明确的结构性问题；M3 是更深的 prompt architecture 改造，应该在 command 层瘦身后逐步推进。

## 10. 关键文件清单

需要重点修改：

- `src/cli/adapters/claude.js`
- `src/cli/plugin.js`
- `src/cli/claude-settings.js`
- `templates/claude/commands/spec/*.md`
- `templates/claude/hooks/session-start`
- `skills/spec-plan/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-compound-refresh/SKILL.md`
- `tests/unit/claude-settings.test.js`
- `tests/unit/*contract*.test.js`
- `tests/smoke/cli.sh`

需要新增或扩展：

- context budget unit tests
- runtime workflow asset integrity tests
- transcript budget helper tests
- workflow section parity fixtures

## 11. 验收门槛

彻底解决后应满足：

1. `.claude/settings.json` 的 `SessionStart` matcher 不包含 `compact`。
2. `.claude/commands/spec` 总量小于 50 KB。
3. 任意 `.claude/commands/spec/*.md` 小于 4 KB，最多允许少数兼容期文件小于 8 KB。
4. `/spec:plan` transcript 中 command message 不再出现完整 `# Create Technical Plan` 50KB+ 正文。
5. `.claude/spec-first/workflows/<skill>/SKILL.md` 或等价 backing asset 存在，并由 `doctor` 校验。
6. `doctor --claude` 能报告 context budget。
7. `spec-plan` 和 `spec-code-review` 的关键能力通过 parity tests 和 fresh-source eval。
8. dogfood 会话中，同等任务的 compact 次数显著下降；如果仍 compact，主要原因应是任务读取和生成内容本身，而不是 runtime 入口 prompt。

## 12. 边界判断

确定性脚本应负责：

- runtime 文件渲染。
- command wrapper 生成。
- workflow backing assets 复制和 transform。
- integrity/drift/context budget 检查。
- transcript jsonl 统计。
- section parity 的机械校验。

LLM 应负责：

- 判断任务是否进入 workflow。
- 判断当前 phase 需要加载哪些 reference。
- 解释 CRG evidence 和源码事实。
- 生成计划、评审、修复建议。
- 在语义冲突时向用户提出决策问题。

不应引入：

- 中心化 workflow gate 状态机。
- 脚本判断复杂需求属于哪个 phase。
- 强制所有 workflow 按固定状态转移执行。
- 通过删规则换 token 的“优化”。

## 13. 最终判断

这次问题的本质是：`spec-first` 已经从少量轻 workflow 演化到大型 AI coding workflow 系统，但 Claude runtime 仍沿用“command body 承载完整 workflow”的早期交付方式。随着 `spec-plan`、`spec-code-review`、`spec-work` 等 prompt 变复杂，入口层开始吞掉大量上下文预算。

彻底解决不是压缩智能，而是重建加载边界：

- 入口轻。
- 规则全。
- 细节按需。
- 预算可测。
- 语义可验。

这与 `spec-first` 的核心哲学一致：脚本做确定性执行和校验，LLM 做语义判断；通过更好的输入边界提升质量，而不是用状态机替代判断，也不是用删减 prompt 换取表面速度。
