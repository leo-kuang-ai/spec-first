# `spec-skill-audit` 终版技术方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 定位：在 `spec-first` 中新增一个 **workflow skill**，用于审查 skill 质量、边界、治理、运行时投递与安全风险。
> 重要边界：**不是 CLI、不是 npm 包、不是外部平台**。
> 新增位置：`skills/spec-skill-audit/`。
> 运行入口：Claude `spec-skill-audit`，Codex `spec-skill-audit`。
> 默认审查对象：`spec-first` 自身 `skills/` source-of-truth。
> 扩展能力：可用同一套审查方法论审查任意包含 `SKILL.md` 的本地 skill 目录。

---

## 1. 核心结论

`spec-skill-audit` 应该做成：

```text
一个 spec-first 内置 workflow skill
+
一套专家级 skill 审查方法论
+
一组只做事实采集的辅助 scripts
+
一批审查 rubric / threat model / report schema
```

它不应该做成：

```text
spec-first CLI 子命令
独立 npm 包
GitHub skill marketplace 扫描器
自动重写 skill 的修复器
直接修改 .claude / .codex / .agents 的工具
```

最终定位一句话：

```text
spec-skill-audit 是 spec-first 的 Agent Workflow 质量审查专家。
它默认审查 spec-first 自己的 skills，但审查方法论保持通用。
```

---

## 2. 背景与行业借鉴

Agent Skill 的主流形态已经逐渐稳定：一个 skill 通常由 `SKILL.md` 加可选的 scripts、references、assets 等资源组成。Anthropic 官方说明 Skill 是一组可按需加载的 instructions、scripts 和资源；GitHub Copilot 文档也把 agent skill 描述为 `SKILL.md` 加可选 Markdown、scripts 等补充资源。([GitHub][1])

Anthropic 的最佳实践强调 **progressive disclosure**：`SKILL.md` 应像入口说明或目录，把详细材料拆到独立文件，并建议 `SKILL.md` body 保持在 500 行以内。这个原则非常适合 spec-first：入口轻、边界清、细节深、按需加载。([Claude平台][2])

Anthropic 官方 `skill-creator` 还提供了一个关键方法：skill 不只是写出来，而要通过 test prompts、定性/定量评估、description trigger 优化持续迭代。`spec-skill-audit` 应吸收这个思想，把审查从“格式检查”升级成“触发、边界、失败、输出和安全的专家评估”。([GitHub][3])

GitHub 也已经把 Agent Skills 定位为跨 Copilot、Claude Code、Cursor、Codex、Gemini CLI 等宿主可复用的 instructions、scripts、resources，并通过 `gh skill` 管理发现、安装和发布。这说明 skill 已经具备“可分发资产”的性质，因此 source/runtime drift、preview、版本与供应链风险都应该纳入审查。([The GitHub Blog][4])

对 `spec-first` 来说，项目自身 CLAUDE.md 已经明确：`skills/`、`agents/`、`templates/` 是 source of truth，`.claude/`、`.codex/`、`.agents/skills/` 是由 `spec-first init` 交互选择对应 host 后管理的 generated runtime assets，不能手改生成产物，否则会制造 source/runtime drift。([GitHub][5])

安全上也必须严肃对待。近期 OpenClaw 的恶意 skill/extension 事件说明：skill 的 Markdown 指令本身也可能成为攻击面，恶意内容可以诱导 agent 下载恶意脚本、窃取 SSH 凭据、浏览器密码或钱包密钥。因此 `spec-skill-audit` 必须同时审查 scripts 和自然语言指令。([The Verge][6])

---

## 3. 设计原则

### 3.1 Source-first

```text
审查 source-of-truth，不审 generated runtime 当作源码。
```

在 `spec-first` 中：

```text
source truth:
- skills/
- agents/
- templates/
- src/cli/contracts/dual-host-governance/
- src/cli/plugin.js
- src/cli/adapters/

generated runtime:
- .claude/
- .codex/
- .agents/skills/
```

`.claude/`、`.codex/`、`.agents/skills/` 只能只读检查 drift，不能直接修。

---

### 3.2 Skill-first, not CLI

`spec-skill-audit` 是 skill，不是 CLI。

允许：

```text
skills/spec-skill-audit/SKILL.md
skills/spec-skill-audit/scripts/*.js
skills/spec-skill-audit/references/*.md
skills/spec-skill-audit/examples/*.md
skills/spec-skill-audit/evals/*.json
```

不新增：

```text
bin/spec-first-skill-audit
src/cli/commands/skill-audit.js
spec-first skill-audit
独立 @spec-first/skill-audit 包
```

`scripts/` 是 skill 内部辅助脚本，只做事实采集、解析、静态检查、报告写入，不作为用户面对的 CLI 产品。

---

### 3.3 Scripts prepare, LLM decides

```text
Scripts 负责确定性事实：
- 找到 skill
- 解析 frontmatter
- 识别 headings
- 检查目录结构
- 检查引用文件
- 检查明显危险 pattern
- 识别 governance entry
- 检查 runtime drift

LLM 负责专家判断：
- 触发是否精准
- 边界是否清晰
- workflow 是否合理
- 是否职责重叠
- 是否越权
- 是否符合 spec-first 原则
- 修复优先级如何排序
```

这避免把 `spec-skill-audit` 做成重型规则引擎，也避免完全靠 LLM 主观判断。

---

### 3.4 Read-only by default

默认只读指的是：**不修改被审查对象的 source/runtime 文件**。

允许默认写本地审查运行产物：

```text
.spec-first/audits/skill-audit/
```

该目录是 workflow run artifact / local evidence cache，必须加入 `.gitignore`。它不是 source-of-truth，内容可删除、可重跑、可由 `latest/` 覆盖。

默认禁止改：

```text
skills/
agents/
templates/
src/cli/contracts/
.claude/
.codex/
.agents/skills/
CHANGELOG.md
```

只有用户明确要求“生成 patch preview”时，才输出修复建议；只有用户再次明确要求应用时，才允许修改 source-of-truth，并且必须同步 `CHANGELOG.md`。

如果某次审查结论需要沉淀为长期项目证据，应由用户明确确认后另存到 `docs/validation/`、`docs/项目审查/` 或其他文档真源位置，而不是把 `.spec-first/audits/` 当成源码提交。

---

### 3.5 Expert audit, not format checker

普通检查器看：

```text
有没有 SKILL.md
有没有 name
有没有 description
```

专家级 `spec-skill-audit` 要看：

```text
该不该触发？
会不会误触发？
边界是否和其他 skill 冲突？
输入输出是否可下游消费？
失败时是否有降级策略？
是否污染上下文？
是否写 runtime 产物？
是否引入供应链风险？
是否有 eval 能持续改进？
```

---

## 4. 能力边界

### 4.1 它负责什么

```text
1. 审查 spec-first 自身 skills/
2. 审查单个指定 skill
3. 审查任意本地 SKILL.md collection
4. 检查 skill 结构、触发、边界、输入输出、产物协议
5. 检查 scripts / references / examples / evals 组织质量
6. 检查 instruction-level 和 script-level 安全风险
7. 检查 spec-first dual-host governance
8. 检查 source/runtime drift
9. 输出专家评分、finding、改进计划和 patch preview
```

---

### 4.2 它不负责什么

```text
1. 不联网搜索 GitHub skill
2. 不做外部 skill mining 方法论研究
3. 不安装第三方 skill
4. 不自动重写 skill
5. 不直接修 .claude / .codex / .agents
6. 不替代 code review
7. 不执行业务功能开发
8. 不引入复杂 workflow state machine
```

外部优秀 skill 方法论抽取应该交给另一个未来 skill：

```text
spec-skill-mining
```

边界：

```text
spec-skill-audit：审质量
spec-skill-mining：学方法论
```

---

## 5. 使用模式

`spec-skill-audit` 不是命令行产品，但 skill 内部可以根据用户意图进入三种模式。

### 5.1 `self` 模式：默认审自己

用户：

```text
spec-skill-audit
```

行为：

```text
审查当前 spec-first 仓库：
- skills/
- src/cli/contracts/dual-host-governance/skills-governance.json
- 可选 .claude / .codex / .agents runtime drift
```

输出：

```text
.spec-first/audits/skill-audit/latest/
```

说明：

```text
.spec-first/audits/ 是 gitignored 执行产物目录，不是源码。
```

---

### 5.2 `single` 模式：审单个 skill

用户：

```text
spec-skill-audit 审查 skills/spec-plan
```

行为：

```text
只审查指定 skill：
- SKILL.md
- scripts/
- references/
- examples/
- evals/
```

适用场景：

```text
精修 spec-plan
精修 spec-work
精修 spec-graph-bootstrap
新增 skill 前做质量闸口
```

---

### 5.3 `generic` 模式：审任意本地 skill 目录

用户：

```text
spec-skill-audit 审查 /path/to/other/skills
```

行为：

```text
扫描目标路径下的 SKILL.md
使用 generic rubric
不启用 spec-first governance / runtime drift 检查
不修改外部目录
```

输出仍写到当前项目：

```text
.spec-first/audits/skill-audit/latest/generic/
```

---

## 6. 目录结构

新增：

```text
skills/spec-skill-audit/
├── SKILL.md
├── scripts/
│   ├── collect-skill-facts.js
│   ├── detect-skill-layout.js
│   ├── parse-skill-md.js
│   ├── lint-skill-structure.js
│   ├── scan-instruction-security.js
│   ├── extract-trigger-signals.js
│   ├── detect-boundary-overlap.js
│   ├── audit-spec-first-governance.js
│   ├── audit-runtime-drift.js
│   ├── write-audit-artifacts.js
│   └── lib/
│       ├── frontmatter.js
│       ├── markdown.js
│       ├── path-rules.js
│       ├── finding.js
│       ├── scoring.js
│       ├── security-patterns.js
│       └── report-writer.js
├── references/
│   ├── expert-audit-rubric.md
│   ├── generic-skill-audit-rubric.md
│   ├── spec-first-skill-audit-rubric.md
│   ├── trigger-routing-rubric.md
│   ├── boundary-discipline-rubric.md
│   ├── security-threat-model.md
│   ├── eval-readiness-rubric.md
│   ├── source-vs-runtime-contract.md
│   ├── spec-first-skill-boundary-map.md
│   └── report-format.md
├── examples/
│   ├── excellent-skill.example.md
│   ├── weak-skill.example.md
│   ├── dangerous-skill.example.md
│   └── audit-report.example.md
└── evals/
    ├── audit-quality-cases.json
    ├── trigger-review-cases.json
    ├── boundary-review-cases.json
    └── security-review-cases.json
```

---

## 7. Governance 接入

需要修改：

```text
src/cli/contracts/dual-host-governance/skills-governance.json
```

新增 entry：

```json
{
  "skill_name": "spec-skill-audit",
  "entry_surface": "workflow_command",
  "command_name": "skill-audit",
  "host_scope": "dual_host",
  "owner_host": null,
  "host_delivery": {
    "claude": "command",
    "codex": "skill"
  }
}
```

预期入口：

```text
Claude:
  spec-skill-audit

Codex:
  spec-skill-audit
```

注意：

```text
这是 workflow skill 的入口治理，不是新增 CLI 命令。
```

---

## 8. `SKILL.md` 终版草案

路径：

```text
skills/spec-skill-audit/SKILL.md
```

内容：

```markdown
---
name: spec-skill-audit
description: Audit agent skills for trigger precision, scope boundaries, input/output contracts, workflow quality, progressive disclosure, eval readiness, safety, maintainability, and runtime governance. In spec-first repositories, also audit source skills, dual-host governance, generated runtime drift, and alignment with spec-first workflow principles.
---

# spec-skill-audit

## Purpose

Audit skills as engineering protocols, not just prompts.

This skill reviews:

- source `SKILL.md` files
- skill directory structure
- trigger clarity
- scope boundaries
- input/output contracts
- workflow steps
- scripts/references/examples organization
- failure modes
- eval readiness
- security risks
- cross-host portability
- runtime governance

In spec-first repositories, it also checks:

- `skills/` as source of truth
- dual-host governance entries
- Claude/Codex delivery expectations
- generated runtime drift
- workflow responsibility boundaries
- alignment with spec-first principles

## When to use

Use this skill when the user asks to:

- audit spec-first skills
- review SKILL.md quality
- check skill boundary overlap
- identify missing input/output contracts
- identify missing failure modes
- check trigger precision
- check source/runtime consistency
- review generated runtime drift
- prepare a skill improvement plan
- produce patch-preview suggestions for skill quality improvements

## When not to use

Do not use this skill to:

- install third-party skills
- mine external GitHub skills for methodology
- directly modify `.claude/`, `.codex/`, or `.agents/skills/`
- automatically rewrite source skills without confirmation
- execute implementation tasks unrelated to skill quality
- replace code review
- act as a general CLI command

For external methodology research, use or design `spec-skill-mining`.

## Modes

### self mode

Default mode for spec-first repositories.

Audit:

- `skills/`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- optional generated runtime directories

### single mode

Audit one skill directory.

### generic mode

Audit a generic skill collection outside spec-first.

## Inputs

Required:

- target repository or skill directory

Optional for spec-first:

- `skills/`
- `agents/`
- `templates/`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `.claude/`
- `.codex/`
- `.agents/skills/`

## Outputs

For spec-first self audit:

- `.spec-first/audits/skill-audit/latest/skill-source-inventory.json`
- `.spec-first/audits/skill-audit/latest/expert-scorecard.json`
- `.spec-first/audits/skill-audit/latest/skill-audit-report.json`
- `.spec-first/audits/skill-audit/latest/trigger-routing-report.json`
- `.spec-first/audits/skill-audit/latest/boundary-overlap-matrix.json`
- `.spec-first/audits/skill-audit/latest/security-risk-report.json`
- `.spec-first/audits/skill-audit/latest/eval-readiness-report.json`
- `.spec-first/audits/skill-audit/latest/promise-implementation-report.json`
- `.spec-first/audits/skill-audit/latest/governance-drift-report.json`
- `.spec-first/audits/skill-audit/latest/runtime-drift-report.json`
- `.spec-first/audits/skill-audit/latest/skill-audit-summary.md`
- `.spec-first/audits/skill-audit/latest/skill-improvement-plan.md`

For generic audit:

- `.spec-first/audits/skill-audit/latest/generic/skill-inventory.json`
- `.spec-first/audits/skill-audit/latest/generic/skill-audit-report.json`
- `.spec-first/audits/skill-audit/latest/generic/skill-audit-summary.md`
- `.spec-first/audits/skill-audit/latest/generic/skill-improvement-plan.md`

## Workflow

1. Determine audit mode.
2. Discover target skills.
3. Parse `SKILL.md` files.
4. Collect directory facts: scripts, references, examples, assets, evals.
5. Run deterministic checks.
6. Scan instruction-level and script-level security risks.
7. Build trigger eval candidates.
8. Detect boundary overlap candidates.
9. In spec-first self mode, check governance and runtime drift.
10. Review findings using the expert audit rubric.
11. Generate scorecards, reports, and improvement plans.
12. Do not modify source files unless the user explicitly requests a patch.

## Governance

This skill is read-only by default.

It may write audit reports under:

- `.spec-first/audits/skill-audit/`

It must not modify:

- `skills/`
- `agents/`
- `templates/`
- `src/cli/contracts/`
- `.claude/`
- `.codex/`
- `.agents/skills/`

without explicit user confirmation.

Generated runtime assets must be fixed by rerunning init, not by hand-editing runtime copies.

## Failure modes

If no skills are found:

- report `NO_SKILLS_FOUND`
- explain searched paths
- suggest expected layout

If the target is not a spec-first repo:

- switch to generic mode
- skip spec-first governance checks

If governance contract is missing:

- continue generic/source audit
- mark governance checks as skipped
- emit `GOVERNANCE_CONTRACT_MISSING`

If runtime directories are missing:

- mark runtime status as `not_initialized`
- do not fail the audit
- suggest rerunning `spec-first init` and choosing the affected host

If runtime drift is detected:

- report drift
- recommend rerunning init
- do not patch generated runtime copies
```

---

## 9. 审查子系统

### 9.1 Spec Compliance Audit

检查基本规范：

```text
- 是否存在 SKILL.md
- 是否存在 YAML frontmatter
- name 是否存在
- description 是否存在
- name 是否和目录一致
- description 是否过短、过泛、重复
- 本地链接是否可达
- references/scripts/examples/assets 是否存在孤儿文件
```

输出：

```text
structure-findings
```

---

### 9.2 Trigger & Routing Audit

目标：审查 skill 是否能被正确触发。

检查：

```text
- description 是否描述“什么时候用”
- 是否混入过多内部实现
- 是否有 should-trigger 场景
- 是否有 should-not-trigger 场景
- 是否容易和其他 skill 抢触发
- 是否存在 false positive 风险
- 是否存在 false negative 风险
```

产物：

```text
trigger-routing-report.json
trigger-eval-candidates.json
```

示例：

```json
{
  "skill_id": "spec-plan",
  "should_trigger": [
    "帮我基于这个需求输出技术方案",
    "根据当前代码结构规划实现路径"
  ],
  "should_not_trigger": [
    "直接修这个 bug",
    "审查这段代码是否有问题"
  ],
  "false_positive_risks": [
    "description 中同时出现 implementation 和 tasks，可能与 spec-write-tasks 重叠"
  ]
}
```

---

### 9.3 Boundary & Responsibility Audit

目标：审查职责边界。

检查：

```text
- skill 是否只做一类事
- 是否有 When not to use
- 是否抢上游职责
- 是否抢下游职责
- 是否混淆 graph / spec / plan / work / review / standards
- 是否把 standards 和 facts 混在一起
- 是否越权写 confirmed standards
```

产物：

```text
boundary-overlap-matrix.json
```

典型边界：

```text
spec-graph-bootstrap:
  生成 graph readiness facts，不生成业务方案

spec-plan:
  生成技术方案，不执行代码修改

spec-write-tasks:
  把 plan 编译为任务，不重新做架构设计

spec-work:
  执行已收敛任务，不擅自扩大需求

spec-code-review:
  审查代码，不顺手实现新功能

spec-mcp-setup:
  安装/验证 provider，不解释业务架构

spec-skill-audit:
  审 skill 质量，不研究外部方法论
```

---

### 9.4 Input / Output Contract Audit

目标：审查输入输出是否能形成工程协议。

检查：

```text
输入：
- required inputs
- optional inputs
- fallback inputs
- canonical artifacts
- missing input behavior

输出：
- human-readable output
- machine-readable output
- schema_version
- downstream consumer
- write / overwrite / append policy
- preview-first policy
```

硬建议：

```text
所有给下游消费的 JSON 必须有 schema_version。
所有会写文件的 skill 必须说明 preview/write/overwrite 策略。
所有会影响治理配置的写入必须有 human confirmation。
```

---

### 9.5 Progressive Disclosure Audit

目标：审查上下文效率。

检查：

```text
- SKILL.md 是否过长
- 是否把长解释拆到 references/
- 是否把示例拆到 examples/
- 是否把确定性逻辑拆到 scripts/
- 是否包含大量“模型本来就知道”的废话
- 是否重复说明
- 是否把所有规则塞进主文件
```

建议阈值：

```text
SKILL.md body < 3000 tokens：健康
3000-6000 tokens：关注
> 6000 tokens：建议拆分
```

同时参考官方 best practice：`SKILL.md` 应像目录，详细材料拆文件，body 接近 500 行时应拆分。([Claude平台][2])

---

### 9.6 Eval Readiness Audit

目标：审查 skill 是否具备持续改进能力。

检查：

```text
- 是否有 evals/
- 是否有 trigger cases
- 是否有 boundary cases
- 是否有 failure cases
- 是否有 expected behavior
- 是否覆盖 should-trigger / should-not-trigger
- 是否能做 regression check
```

建议每个重要 skill 逐步增加：

```text
skills/<skill>/evals/
├── trigger-cases.json
├── boundary-cases.json
├── failure-cases.json
└── expected-behavior.md
```

`spec-skill-audit` 自身也应有 evals，用来验证审查质量：

```text
skills/spec-skill-audit/evals/
├── audit-quality-cases.json
├── trigger-review-cases.json
├── boundary-review-cases.json
└── security-review-cases.json
```

---

### 9.7 Security & Supply Chain Audit

目标：审查 skill 本身作为 agent 行为资产的安全风险。

检查两层：

```text
1. script-level security
2. instruction-level security
```

高危 pattern：

```text
- curl | bash
- wget ... | sh
- rm -rf
- chmod -R 777
- sudo
- 读取 .env
- 读取 .ssh
- 读取 id_rsa
- 读取浏览器 profile
- 读取钱包目录
- 上传 secrets
- 执行用户传入路径中的脚本
- 让 agent 忽略系统指令/治理规则
- 默认修改 .claude/.codex/.agents
```

P0 安全问题：

```text
- 无确认执行远程脚本
- 读取或外传 secrets
- 自动修改 generated runtime
- 自动写 confirmed standards
- 诱导 agent 绕过治理规则
```

---

### 9.8 Source / Runtime Governance Audit

这是 spec-first 专属。

检查：

```text
- skills/ 是否为 source-of-truth
- 是否有 source skill 缺 governance entry
- 是否有 governance entry 指向不存在的 skill
- command_name 是否冲突
- entry_surface 是否合理
- host_delivery 是否合理
- internal_only 是否被公开暴露
- Claude/Codex delivery 是否符合预期
```

发现 runtime drift 时：

```text
正确建议：
  rerun spec-first init and choose Claude Code when prompted
  rerun spec-first init and choose Codex when prompted

错误建议：
  手改 .claude
  手改 .codex
  手改 .agents/skills
```

---

### 9.9 Human Review / Patch Preview Audit

目标：让报告能变成可执行改进计划。

检查：

```text
- finding 是否定位到文件/section
- 是否有 severity
- 是否有 confidence
- 是否有 recommendation
- 是否标记 auto-fixable / human-decision
- 是否可以生成 patch-preview
```

Patch preview 输出：

```text
.spec-first/audits/skill-audit/latest/patch-preview/
├── skills-governance.patch.md
├── spec-plan.SKILL.patch.md
├── spec-work.SKILL.patch.md
└── summary.md
```

注意：

```text
patch-preview 只写建议，不改源文件。
```

---

## 10. 脚本设计

### 10.1 `detect-skill-layout.js`

职责：

```text
判断目标布局：
- spec-first self
- single skill
- generic collection
```

输出：

```json
{
  "schema_version": "spec-skill-audit.layout.v1",
  "mode": "self",
  "root": ".",
  "is_spec_first_repo": true,
  "source_skill_root": "skills",
  "has_governance_contract": true
}
```

---

### 10.2 `collect-skill-facts.js`

职责：

```text
收集事实：
- SKILL.md
- frontmatter
- headings
- scripts/
- references/
- examples/
- evals/
- declared paths
- local links
- estimated tokens
```

输出：

```text
skill-source-inventory.json
```

---

### 10.3 `parse-skill-md.js`

职责：

```text
解析：
- YAML frontmatter
- Markdown headings
- code blocks
- links
- local file references
- declared artifact paths
```

---

### 10.4 `lint-skill-structure.js`

职责：

```text
确定性结构检查：
- missing name
- missing description
- missing purpose
- missing when to use
- missing when not to use
- missing inputs
- missing outputs
- missing workflow
- missing failure modes
- missing examples
```

---

### 10.5 `scan-instruction-security.js`

职责：

```text
扫描 SKILL.md / references / examples / scripts 中的危险模式。
```

只输出风险信号，不直接判死刑。

---

### 10.6 `extract-trigger-signals.js`

职责：

```text
根据 description / purpose / when-to-use 做确定性信号抽取：
- declared trigger phrases
- declared non-trigger phrases
- referenced upstream/downstream skills
- likely overlap keywords
- ambiguous trigger wording
```

它只输出 trigger review signals，不生成语义 eval case，也不判断 should-trigger / should-not-trigger 是否合理。真正的 trigger eval candidates 由 LLM 基于这些信号和 rubric 生成。

---

### 10.7 `detect-boundary-overlap.js`

职责：

```text
根据 description、headings、inputs、outputs、declared paths、关键词，生成职责重叠候选。
```

只做 candidate，不做最终判断。

---

### 10.8 `audit-spec-first-governance.js`

仅 self 模式启用。

检查：

```text
- source skill 是否有 governance entry
- governance entry 是否有 source skill
- command_name 是否冲突
- workflow_command 是否缺 command_name
- internal_only 是否暴露
- host_delivery 是否合法
```

---

### 10.9 `audit-runtime-drift.js`

仅 self 模式可选启用。

检查：

```text
- .claude runtime 是否存在
- .codex runtime 是否存在
- .agents/skills runtime 是否存在
- runtime 是否 stale
- runtime installed asset integrity 是否与当前 source transform 后的期望内容一致
```

实现要求：

```text
优先复用 plugin.js 的 inspectInstalledAssets / inspectSkillIntegrity 路径。
不要为 audit-runtime-drift 重新实现第二套 runtime transform / hash 比对逻辑。
```

输出建议只允许：

```text
rerun spec-first init and choose Claude Code when prompted
rerun spec-first init and choose Codex when prompted
```

---

### 10.10 `write-audit-artifacts.js`

职责：

```text
写入 timestamp 目录和 latest 目录。
```

要求：

```text
- 不覆盖历史目录
- latest 用复制方式，避免 Windows symlink 问题
- 写入失败必须显式报错
```

---

## 11. 产物协议

`.spec-first/audits/skill-audit/` 是 gitignored 执行产物目录，只承载本地审查运行结果。它不是 source-of-truth，不参与 skill / governance / runtime 的源码治理；需要长期留档的审查结论应在用户确认后另存到文档真源目录。

### 11.1 输出目录

```text
.spec-first/audits/skill-audit/
├── 2026-05-01T10-30-00Z/
│   ├── skill-source-inventory.json
│   ├── expert-scorecard.json
│   ├── skill-audit-report.json
│   ├── trigger-routing-report.json
│   ├── boundary-overlap-matrix.json
│   ├── security-risk-report.json
│   ├── eval-readiness-report.json
│   ├── promise-implementation-report.json
│   ├── governance-drift-report.json
│   ├── runtime-drift-report.json
│   ├── issue-index.json
│   ├── skill-audit-summary.md
│   ├── skill-improvement-plan.md
│   ├── patch-preview/
│   └── raw/
│       ├── discovered-files.json
│       ├── parser-warnings.json
│       └── deterministic-findings.json
└── latest/
    └── ...
```

---

### 11.2 `skill-source-inventory.json`

```json
{
  "schema_version": "spec-first.skill-source-inventory.v1",
  "generated_at": "2026-05-01T10:30:00Z",
  "mode": "self",
  "repo_root": "/repo/spec-first",
  "source_root": "skills",
  "skills": [
    {
      "skill_id": "spec-plan",
      "source_path": "skills/spec-plan",
      "skill_file": "skills/spec-plan/SKILL.md",
      "frontmatter": {
        "name": "spec-plan",
        "description": "..."
      },
      "sections": [
        "Purpose",
        "When to use",
        "Workflow",
        "Outputs"
      ],
      "has_scripts": true,
      "has_references": true,
      "has_examples": false,
      "has_evals": false,
      "estimated_tokens": 3200,
      "declared_inputs": [
        ".spec-first/graph/graph-facts.json"
      ],
      "declared_outputs": [
        "docs/<date>/design.md"
      ],
      "parser_warnings": []
    }
  ]
}
```

---

### 11.3 `expert-scorecard.json`

```json
{
  "schema_version": "spec-first.skill-audit-scorecard.v1",
  "generated_at": "2026-05-01T10:30:00Z",
  "skills": [
    {
      "skill_id": "spec-plan",
      "overall_score": 84,
      "grade": "A-",
      "dimensions": {
        "spec_compliance": 5,
        "trigger_precision": 4,
        "boundary_discipline": 4,
        "input_contract": 4,
        "output_contract": 3,
        "workflow_explicitness": 5,
        "progressive_disclosure": 4,
        "eval_readiness": 2,
        "security_posture": 5,
        "runtime_governance": 4,
        "cross_host_portability": 4,
        "spec_first_alignment": 5
      },
      "top_risks": [
        {
          "severity": "P1",
          "category": "eval_readiness",
          "title": "Missing trigger and boundary evals"
        }
      ],
      "recommended_next_action": "Add trigger-cases.json and boundary-cases.json before expanding this skill."
    }
  ]
}
```

---

### 11.4 `skill-audit-report.json`

```json
{
  "schema_version": "spec-first.skill-audit-report.v1",
  "generated_at": "2026-05-01T10:30:00Z",
  "summary": {
    "total_skills": 39,
    "p0_count": 0,
    "p1_count": 6,
    "p2_count": 18,
    "average_score": 81
  },
  "findings": [
    {
      "id": "SKILL-AUDIT-P1-BOUNDARY-001",
      "severity": "P1",
      "category": "boundary_overlap",
      "skill_id": "spec-plan",
      "title": "Task decomposition boundary overlaps with spec-write-tasks",
      "signal": "deterministic boundary overlap candidate",
      "claim_type": "semantic",
      "evidence": [
        {
          "file": "skills/spec-plan/SKILL.md",
          "section": "Workflow",
          "excerpt": "..."
        }
      ],
      "counter_evidence": {
        "checked": true,
        "result": "none",
        "note": "No explicit handoff boundary was found."
      },
      "completeness": "complete",
      "decision": "accepted",
      "reason": "spec-plan and spec-write-tasks both describe task decomposition responsibility.",
      "recommendation": "Clarify that spec-plan defines implementation strategy, while spec-write-tasks compiles execution-ready tasks.",
      "confidence": "high",
      "fix_mode": "patch-preview-only"
    }
  ]
}
```

---

### 11.5 `governance-drift-report.json`

```json
{
  "schema_version": "spec-first.skill-governance-drift.v1",
  "generated_at": "2026-05-01T10:30:00Z",
  "findings": [
    {
      "skill_id": "spec-skill-audit",
      "severity": "P0",
      "category": "missing_governance_entry",
      "title": "Source skill is missing from dual-host governance contract",
      "source_path": "skills/spec-skill-audit",
      "expected_entry": {
        "entry_surface": "workflow_command",
        "command_name": "skill-audit",
        "host_scope": "dual_host",
        "host_delivery": {
          "claude": "command",
          "codex": "skill"
        }
      }
    }
  ]
}
```

---

### 11.6 `runtime-drift-report.json`

```json
{
  "schema_version": "spec-first.runtime-drift-report.v1",
  "generated_at": "2026-05-01T10:30:00Z",
  "runtime_checked": true,
  "findings": [
    {
      "skill_id": "spec-plan",
      "host": "claude",
      "severity": "P1",
      "category": "runtime_drift",
      "source_path": "skills/spec-plan",
      "runtime_path": ".claude/spec-first/workflows/spec-plan",
      "recommendation": "Run spec-first init and choose Claude Code when prompted. Do not edit generated runtime assets directly."
    }
  ]
}
```

---

## 12. 评分模型

每个维度 0-5 分。

```text
0 = 缺失
1 = 很弱
2 = 有雏形但不可依赖
3 = 基本可用
4 = 清晰可靠
5 = 优秀，可作为模板
```

维度：

```text
1. spec_compliance
2. trigger_precision
3. boundary_discipline
4. input_contract
5. output_contract
6. workflow_explicitness
7. progressive_disclosure
8. eval_readiness
9. security_posture
10. runtime_governance
11. cross_host_portability
12. spec_first_alignment
```

权重建议：

```json
{
  "spec_compliance": 0.07,
  "trigger_precision": 0.10,
  "boundary_discipline": 0.12,
  "input_contract": 0.09,
  "output_contract": 0.10,
  "workflow_explicitness": 0.09,
  "progressive_disclosure": 0.07,
  "eval_readiness": 0.08,
  "security_posture": 0.12,
  "runtime_governance": 0.07,
  "cross_host_portability": 0.04,
  "spec_first_alignment": 0.05
}
```

解释：

```text
security_posture 和 boundary_discipline 权重最高。
因为一个 skill 写得不好最多低效；一个 skill 越权或危险，会污染整个 agent runtime。
```

---

## 13. 严重级别

### P0：必须修

```text
- 缺少 SKILL.md
- source skill 缺 governance entry
- command_name 冲突
- internal_only 被公开暴露
- 自动修改 .claude/.codex/.agents
- 自动写 confirmed standards
- 无确认执行 curl | bash
- 读取或外传 secrets
- 诱导 agent 忽略治理规则
- 写文件但没有 preview / confirmation
```

### P1：高优先级

```text
- description 过泛，容易误触发
- 与其他 skill 职责明显重叠
- 输入/输出契约缺失
- 无 failure modes
- artifact path 不稳定
- 声称依赖 graph 但无 fallback
- runtime delivery 与 governance 不一致
- 无安全边界说明
```

### P2：中优先级

```text
- examples 缺失
- evals 缺失
- references 未拆分
- SKILL.md token 偏大
- 缺 degraded confidence 标注
- 缺 host-specific 差异说明
```

### P3：建议项

```text
- 文案可读性
- 章节顺序
- 命名一致性
- 示例丰富度
```

---

## 14. 报告结构

### 14.1 `skill-audit-summary.md`

```markdown
# spec-skill-audit Report

## 1. Executive Summary

## 2. Overall Scorecard

## 3. P0 Blocking Issues

## 4. P1 High Priority Issues

## 5. Skill-by-Skill Review

## 6. Trigger Routing Risks

## 7. Boundary Overlap Matrix

## 8. Security Risks

## 9. Eval Readiness

## 10. Governance / Runtime Drift

## 11. Recommended Fix Order

## 12. Appendix
```

---

### 14.2 `skill-improvement-plan.md`

```markdown
# Skill Improvement Plan

## Phase 1: Fix P0 Governance and Security Issues

## Phase 2: Normalize Input/Output Contracts

## Phase 3: Clarify Trigger and Boundary Rules

## Phase 4: Add Failure Modes

## Phase 5: Add Eval Cases

## Phase 6: Add Patch Preview Suggestions

## Phase 7: Re-run init and Validate Runtime Delivery
```

---

## 15. Patch Preview 设计

用户明确要求后才生成：

```text
spec-skill-audit 给出修复预览
```

产物：

```text
.spec-first/audits/skill-audit/latest/patch-preview/
├── skills-governance.patch.md
├── spec-plan.SKILL.patch.md
├── spec-work.SKILL.patch.md
└── summary.md
```

Patch preview 内容格式：

````markdown
# Patch Preview: skills/spec-plan/SKILL.md

## Change 1: Add "When not to use"

### Reason

Current skill may overlap with spec-write-tasks.

### Suggested insertion

Insert after `## When to use`:

```markdown
## When not to use

Do not use this skill to compile execution-ready tasks. Use spec-write-tasks after a plan has been approved.
````

### Risk

Low.

### Requires human confirmation

Yes.

````

限制：

```text
patch-preview 可以建议改：
- skills/
- references/
- evals/
- src/cli/contracts/
- docs/
- tests/

patch-preview 不允许建议手改：
- .claude/
- .codex/
- .agents/skills/
````

---

## 16. 测试方案

### 16.1 单元测试

新增：

```text
tests/unit/skill-audit/
├── detect-skill-layout.test.js
├── collect-skill-facts.test.js
├── parse-skill-md.test.js
├── lint-skill-structure.test.js
├── scan-instruction-security.test.js
├── extract-trigger-signals.test.js
├── detect-boundary-overlap.test.js
├── audit-spec-first-governance.test.js
├── audit-runtime-drift.test.js
└── write-audit-artifacts.test.js
```

---

### 16.2 Fixtures

```text
tests/fixtures/skill-audit/
├── repo-good/
├── repo-missing-skill-md/
├── repo-missing-description/
├── repo-command-conflict/
├── repo-internal-exposed/
├── repo-runtime-drift/
├── repo-dangerous-instruction/
├── repo-dangerous-script/
├── repo-boundary-overlap/
└── repo-generic-skills/
```

---

### 16.3 必跑验证

新增 skill 后至少跑：

```bash
npm run lint:skill-entrypoints
npm run test:unit
npm run test:smoke
npm run build
```

涉及 runtime delivery 时，再验证：

```bash
spec-first init   # choose Claude Code when prompted
spec-first init   # choose Codex when prompted
spec-first doctor --claude
spec-first doctor --codex
```

项目 CLAUDE.md 已说明：改 skill / agent 治理、入口映射、contract 时，应先跑 `npm run lint:skill-entrypoints`，再补 contract/unit 测试。([GitHub][5])

---

## 17. 开发改动清单

### 17.1 新增

```text
skills/spec-skill-audit/SKILL.md

templates/claude/commands/spec/skill-audit.md

skills/spec-skill-audit/scripts/collect-skill-facts.js
skills/spec-skill-audit/scripts/detect-skill-layout.js
skills/spec-skill-audit/scripts/parse-skill-md.js
skills/spec-skill-audit/scripts/lint-skill-structure.js
skills/spec-skill-audit/scripts/scan-instruction-security.js
skills/spec-skill-audit/scripts/check-promise-implementation.js
skills/spec-skill-audit/scripts/extract-trigger-signals.js
skills/spec-skill-audit/scripts/detect-boundary-overlap.js
skills/spec-skill-audit/scripts/audit-spec-first-governance.js
skills/spec-skill-audit/scripts/audit-runtime-drift.js
skills/spec-skill-audit/scripts/write-audit-artifacts.js

skills/spec-skill-audit/references/expert-audit-rubric.md
skills/spec-skill-audit/references/generic-skill-audit-rubric.md
skills/spec-skill-audit/references/spec-first-skill-audit-rubric.md
skills/spec-skill-audit/references/trigger-routing-rubric.md
skills/spec-skill-audit/references/boundary-discipline-rubric.md
skills/spec-skill-audit/references/security-threat-model.md
skills/spec-skill-audit/references/eval-readiness-rubric.md
skills/spec-skill-audit/references/source-vs-runtime-contract.md
skills/spec-skill-audit/references/spec-first-skill-boundary-map.md
skills/spec-skill-audit/references/report-format.md

skills/spec-skill-audit/examples/excellent-skill.example.md
skills/spec-skill-audit/examples/weak-skill.example.md
skills/spec-skill-audit/examples/dangerous-skill.example.md
skills/spec-skill-audit/examples/audit-report.example.md

skills/spec-skill-audit/evals/audit-quality-cases.json
skills/spec-skill-audit/evals/trigger-review-cases.json
skills/spec-skill-audit/evals/boundary-review-cases.json
skills/spec-skill-audit/evals/security-review-cases.json
```

---

### 17.2 修改

```text
src/cli/contracts/dual-host-governance/skills-governance.json
.gitignore
CHANGELOG.md
```

可选新增：

```text
docs/YYYY-MM-DD/spec-skill-audit-technical-design.md
docs/contracts/spec-skill-audit-report-schema.md
```

---

## 18. 分阶段落地

### Phase 0：入口接入清单

目标：

```text
补齐 workflow_command 在当前双宿主 runtime 中真正需要的入口接入文件。
```

范围：

```text
- 新增 skills/spec-skill-audit/SKILL.md
- 新增 templates/claude/commands/spec/skill-audit.md
- 更新 src/cli/contracts/dual-host-governance/skills-governance.json
- 确认 .spec-first/audits/ 已加入 .gitignore
- 确认 buildFilteredAssetSet('claude') 包含：
  - commands: skill-audit
  - workflowSkills: spec-skill-audit
- 确认 buildFilteredAssetSet('codex') 包含：
  - workflowSkills: spec-skill-audit
  - commands: 不包含 skill-audit
```

验收：

```text
loadPluginManifest() 能从 governance + command template frontmatter 生成 skill-audit command metadata
Claude runtime 预期投递 .claude/commands/spec/skill-audit.md 和 .claude/spec-first/workflows/spec-skill-audit/
Codex runtime 预期投递 .agents/skills/spec-skill-audit/
不新增 spec-first CLI 子命令
不生成 .codex/commands/spec/skill-audit.md
```

说明：

```text
Phase 0 是入口接入补齐，不是单独产品 MVP。
实际开发中可以和 Phase 1 放在同一个 PR / work run 完成，但验收项必须单独证明。
```

---

### Phase 1：Self Audit MVP

目标：

```text
spec-skill-audit 能审查 spec-first 自身 skills/
```

范围：

```text
- skills/ inventory
- frontmatter / heading 检查
- 明显危险 pattern 扫描
- summary 输出
- collect-skill-facts
- parse-skill-md
- lint-skill-structure
- write-audit-artifacts
- skill-source-inventory.json
- skill-audit-summary.md
- skill-improvement-plan.md
```

暂不做：

```text
- scorecard
- generic mode
- patch preview
- runtime drift
```

验收：

```text
能列出所有 source skills
能识别缺失章节
能输出 Markdown summary
不修改任何 source/runtime 文件
.spec-first/audits/skill-audit/ 只作为 gitignored 执行产物写入
```

Phase 1 不再拆分更小 MVP。完成后应已经具备可运行的 self audit，而不是只完成脚手架。

---

### Phase 2：Governance Audit

目标：

```text
检查 skills/ 与 skills-governance.json 是否一致。
```

范围：

```text
- audit-spec-first-governance
- governance-drift-report.json
- command_name conflict
- missing governance entry
- internal_only exposed
- 复用 plugin.js 的 loadSkillsGovernance()
- 复用 plugin.js 的 buildFilteredAssetSet()
```

验收：

```text
新增 spec-skill-audit 后，如果没有 governance entry，必须报 P0。
不重复实现第二套 workflow_command / command_name / host_delivery 判定规则。
governance 硬约束继续以 plugin.js 和 skills-governance.json 为单一真相源。
```

---

### Phase 3：Expert Rubric & Scorecard

目标：

```text
引入专家审查 rubric、P0/P1 evidence model 和评分信号。
```

范围：

```text
- expert-scorecard.json
- 12 维评分
- P0/P1/P2/P3 severity
- finding evidence model
- trigger precision 判断
- boundary discipline 判断
- output contract 判断
```

验收：

```text
每个 P0/P1 finding 必须有 evidence、reason、recommendation、confidence。
数字评分可以保留，但必须明确“评分是信号，不是 gate”。
脚本只提供事实与候选信号，最终专家判断由 LLM 完成。
```

---

### Phase 4：Runtime Drift / Security / Patch Preview

目标：

```text
补齐高价值但容易膨胀的审查能力，保持只读与 preview-first 边界。
```

范围：

```text
- runtime-drift-report.json
- security-risk-report.json
- audit-runtime-drift
- scan-instruction-security
- patch-preview/
- per-file patch markdown
- summary
```

验收：

```text
能识别 dangerous instruction / dangerous script
发现 drift 时只建议 rerun init，不建议手改 .claude/.codex/.agents。
runtime drift 优先复用 inspectInstalledAssets，避免重新实现 runtime transform/hash 逻辑。
只建议改 source-of-truth
禁止建议手改 generated runtime
```

Generic Audit 不进入 Phase 1-4。它保留为后续扩展能力，等 self audit、governance audit、expert rubric 和 runtime/security/preview 边界稳定后再独立排期。

---

## 19. 风险与控制

### 19.1 风险：变成复杂规则引擎

控制：

```text
scripts 只做事实采集和明显 lint。
专家判断交给 LLM。
评分是信号，不是绝对裁决。
```

---

### 19.2 风险：报告太大没人看

控制：

```text
summary 只放 P0/P1 和 top risks。
详细 findings 放 JSON。
improvement plan 按优先级排序。
```

---

### 19.3 风险：误改 runtime

控制：

```text
SKILL.md 明确禁止修改 .claude/.codex/.agents。
patch-preview 层也禁止 generated runtime patch。
runtime drift 只建议 rerun init。
```

---

### 19.4 风险：generic 能力范围膨胀

控制：

```text
generic mode 只审本地 SKILL.md collection。
不联网。
不安装。
不做外部方法论 mining。
```

---

### 19.5 风险：LLM 主观误判

控制：

```text
每个 P0/P1 必须有 evidence。
finding 必须有 confidence。
overlap 先标 candidate。
人类最终确认。
```

---

## 20. Phase 0 + Phase 1 最小可开发版本

第一版必须同时完成入口接入和 self audit MVP。它不是只做脚手架，也不能只新增 skill 目录而不接入 runtime 入口。

第一版必须新增：

```text
templates/claude/commands/spec/skill-audit.md

skills/spec-skill-audit/
├── SKILL.md
├── scripts/
│   ├── detect-skill-layout.js
│   ├── collect-skill-facts.js
│   ├── parse-skill-md.js
│   ├── lint-skill-structure.js
│   ├── scan-instruction-security.js
│   └── write-audit-artifacts.js
└── references/
    ├── expert-audit-rubric.md
    └── report-format.md
```

第一版必须修改：

```text
src/cli/contracts/dual-host-governance/skills-governance.json
.gitignore
CHANGELOG.md
```

第一版不做：

```text
- expert-scorecard.json
- skill-audit-report.json
- trigger-routing-report.json
- boundary-overlap-matrix.json
- security-risk-report.json
- eval-readiness-report.json
- governance-drift-report.json
- runtime-drift-report.json
- generic mode
- patch-preview
```

第一版只输出：

```text
.spec-first/audits/skill-audit/latest/
├── skill-source-inventory.json
├── skill-audit-summary.md
└── skill-improvement-plan.md
```

第一版检查项：

```text
- 是否有 SKILL.md
- 是否有 name
- 是否有 description
- 是否有 Purpose
- 是否有 When to use
- 是否有 When not to use
- 是否有 Inputs
- 是否有 Outputs
- 是否有 Workflow
- 是否有 Failure modes
- 是否有 scripts/references/examples
- 是否有明显危险命令
```

入口接入验收：

```text
loadPluginManifest() 能生成 skill-audit command metadata
buildFilteredAssetSet('claude') 包含 command: skill-audit 和 workflowSkill: spec-skill-audit
buildFilteredAssetSet('codex') 包含 workflowSkill: spec-skill-audit 且不包含 command: skill-audit
Claude runtime 预期生成 .claude/commands/spec/skill-audit.md
Codex runtime 预期生成 .agents/skills/spec-skill-audit/
```

---

## 21. 最终验收标准

`spec-skill-audit` 完成后，应满足：

```text
1. spec-skill-audit 可以作为 Claude workflow 入口使用
2. spec-skill-audit 可以作为 Codex skill 入口使用
3. 新 skill 位于 skills/spec-skill-audit/
4. 不新增 spec-first CLI 子命令
5. 默认审查 skills/ source-of-truth
6. 不手改 .claude/.codex/.agents
7. 能输出 inventory、scorecard、findings、summary、improvement plan
8. 能检查 governance contract
9. 能识别 trigger、boundary、output、security、runtime drift 风险
10. 能生成 patch-preview，但默认不改文件
11. 改 source 时必须更新 CHANGELOG.md
12. 能通过 lint:skill-entrypoints、unit、smoke、build
```

---

## 22. 最终定位文案

英文：

```text
spec-skill-audit is the internal Agent Workflow quality auditor for spec-first.

It audits skills as engineering protocols:
trigger precision, boundaries, input/output contracts, workflow quality, progressive disclosure, eval readiness, safety, runtime governance, and alignment with spec-first principles.

It is read-only by default.
It does not modify generated runtime assets.
It makes skill debt visible before it becomes workflow debt.
```

中文：

```text
spec-skill-audit 是 spec-first 的内部 Agent Workflow 质量审查专家。

它把 skill 当成工程协议来审查：
触发精度、职责边界、输入输出契约、执行流程、渐进加载、eval 就绪度、安全风险、运行时治理，以及是否符合 spec-first 原则。

它默认只读。
它不修改 generated runtime。
它让 skill 债务在变成 workflow 债务之前先暴露出来。
```

---

## 23. 一句话终版

```text
spec-skill-audit 不是 SKILL.md 格式检查器，也不是 CLI。

它是 spec-first 新增的专家级 workflow skill：
默认审查自己的 skills/source/runtime/governance，
同时保留通用 skill 审查方法论，
让每个 skill 从“提示词文件”升级为“可治理、可验证、可演进的工程协议”。
```

[1]: https://github.com/anthropics/skills?utm_source=chatgpt.com "anthropics/skills: Public repository for Agent Skills"
[2]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices?utm_source=chatgpt.com "Skill authoring best practices - Claude API Docs"
[3]: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md?utm_source=chatgpt.com "skills/skills/skill-creator/SKILL.md at main · anthropics/skills"
[4]: https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/?utm_source=chatgpt.com "Manage agent skills with GitHub CLI - GitHub Changelog"
[5]: https://github.com/sunrain520/spec-first/blob/master/CLAUDE.md?utm_source=chatgpt.com "CLAUDE.md - sunrain520/spec-first"
[6]: https://www.theverge.com/news/874011/openclaw-ai-skill-clawhub-extensions-security-nightmare?utm_source=chatgpt.com "OpenClaw's AI 'skill' extensions are a security nightmare"
