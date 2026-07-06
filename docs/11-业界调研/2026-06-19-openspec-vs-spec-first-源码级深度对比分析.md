# OpenSpec vs spec-first 深度对比分析报告（v2 · 源码级）

> **分析对象**：OpenSpec（Fission-AI，YC 孵化）vs spec-first（sunrain520）
> **分析方法**：文档调研 + **仓库源码级拆解**（clone 双仓库，读 schema/CLI/skill/validator 实现）+ 社区实践调研 + 多轮推演
> **报告立场**：以 spec-first 为"被评估方"，重点回答"spec-first 需要向 OpenSpec 借鉴哪些提升点"，同时客观呈现 spec-first 自身护城河，避免单向褒贬。
> **v2 升级点**：新增源码级实现对比、规模量化、Filesystem-as-State-Machine 深度洞察、真实 skill/agent 内容拆解、适配器架构对比、社区实践反馈。

## 0. 执行摘要（TL;DR）

OpenSpec 与 spec-first 同属 SDD（Spec-Driven Development）谱系，但走了两条截然不同的路线。源码级拆解后，二者的本质分歧比文档表面更深刻：

|  | OpenSpec | spec-first |
| --- | --- | --- |
| **一句话定位** | 轻量、无依赖的**行为契约状态机**（filesystem-as-state-machine） | 面向 Claude Code/Codex 的 **AI Coding Harness**（工程线束） |
| **核心抽象** | Spec（活契约）+ Change（Delta 增量）+ Archive（原子合并） | Artifact Trail（产物链）+ Source/Runtime/Provider 边界 |
| **架构隐喻** | **"Git for behavior"**——specs/ 是 main 分支，changes/ 是 feature 分支，delta 是 diff，archive 是 merge | **"Scripts prepare, LLM decides"**——脚本备事实，LLM 做语义判断，证据留仓库 |
| **信任模型** | AI 在 fluid actions 中自由产出 artifact；validate 做格式校验 | 合约化信任：honest closeout 降级 unsupported claim，防 cherry-pick |
| **规模（源码实测）** | 34,814 行 TS + 27 适配器 + 5,590 行文档 | 19,378 行 JS + **51 agents + 37 skills + 32,363 行 skill 文档** + 67 文档目录 |
| **重量** | 轻（无 API key、无 MCP、universal、U 盘可携） | 重（harness 级，多 workflow/合约/开发模式/hooks 治理） |

### 核心结论（源码级验证后强化）

spec-first 在**工程治理深度**上明显领先——其 honest closeout 实现的**防 cherry-pick 机制**（evaluateValidationClaim 强制 passed 断言反映 run summary 全量聚合真相）、51 个专业 agent、compound learning 的 structured promotion gate，都是 OpenSpec 完全没有的。

但 spec-first 存在一个**结构性缺口**：它把 requirements/plan 做成了"一次性文档"，缺少 OpenSpec 那种**"行为契约作为活体、Delta 作为变更一等公民、归档即原子合并"**的累积演进能力。源码证实：spec-first 的 docs/brainstorms/ 产出独立文档，无 delta 语法、无合并机制、compound 只沉淀 learnings 不合并 requirements——**知识闭环在契约层是断的**。

而 OpenSpec 的 specs-apply.ts 实现了一套严谨的 delta 合并引擎：RENAMED→REMOVED→MODIFIED→ADDED 顺序处理、跨段冲突检测（MODIFIED vs REMOVED vs ADDED）、新 spec 只允许 ADDED、Zod schema 预校验——这是 spec-first 值得借鉴的成熟工程实现。

### spec-first 最该向 OpenSpec 借鉴的 3 件事（按优先级，源码级验证）

1. **【P0】引入 Spec Delta 增量机制**——让 requirements 成为可累积演进的活契约。OpenSpec 的 specs-apply.ts + requirement-blocks.ts parser 提供了可直接参考的合并引擎实现。
1. **【P1】引入 Schema 驱动的可声明工作流**——OpenSpec 的 schema.yaml（artifacts + requires + template + instruction）比 spec-first 的 skills-governance.json（仅分发治理）更完整地定义了工作流本身。
1. **【P1】引入行为契约层 + RFC 2119 / GIVEN-WHEN-THEN 规范语法**——补齐"可测试、可机器判读"的规范表达，与 spec-first 已有的 verification 合约打通。

## 1. 对象界定与背景

### 1.1 为什么是这两个对象

二者都是 2025–2026 年活跃的、面向 AI 编码助手的 SDD 工具，且都**原生集成 Claude Code**，受众重叠度高。OpenSpec 自称"The most loved spec framework"（50k stars，YC 孵化），spec-first 定位为"AI Coding Harness"（双宿主 Claude Code + Codex）。

> 注：本报告中的"spec-first"特指 sunrain520/spec-first 项目，而非泛指的"规范优先"方法论。

### 1.2 二者的根本分歧点（源码级确认）

二者对"spec 是什么"的回答不同，这决定了后续所有差异：

- **OpenSpec**：Spec = **系统当前应如何运作的行为契约**（描述 WHAT，不描述 HOW）。源码中 specs/ 是"事实源"（main 分支），changes/ 是"隔离工作区"（feature 分支）。Spec 是一个**持续累积、随变更原子合并**的活文档。创始人 Tabish Bidiwale 的诊断：*"Generating code is now cheap. Correctability is still expensive."*
- **spec-first**：Spec 更接近**一次性的 requirements/plan 产物**，服务于"把判断留在仓库里"。源码中 docs/brainstorms/、docs/plans/ 是独立文档，无 delta 语法、无合并机制。compound 只沉淀 learnings，不沉淀/合并 requirements。

这个分歧是全文分析的锚点。

## 2. OpenSpec 深度拆解（源码级）

### 2.1 架构哲学：Filesystem-as-State-Machine

源码证实了 OpenSpec 的核心设计——**两个目录承载整个模型**：

```
openspec/
├── specs/               # 事实源 = main 分支（当前系统行为）
│   └── auth/spec.md
└── changes/             # 隔离工作区 = feature 分支
    ├── add-2fa/         # 一个提案 = 一个独立文件夹
    │   ├── proposal.md  # WHY + WHAT
    │   ├── design.md    # HOW
    │   ├── tasks.md     # STEPS
    │   └── specs/auth/spec.md  # Delta = diff
    └── archive/         # 不可变历史 = git log
        └── 2026-01-24-add-2fa/
```

**与 Git 的精确类比**（源码验证）：

| Git 概念 | OpenSpec 等价物 | 源码实现 |
| --- | --- | --- |
| main 分支 | openspec/specs/ | specs-apply.ts 的 mainSpecsDir |
| Feature 分支 | openspec/changes/<feature>/ | archive.ts 的 changeDir |
| Diff | Spec delta（ADDED/MODIFIED/REMOVED） | requirement-blocks.ts 的 parseDeltaSpec |
| Merge | /opsx:archive | buildUpdatedSpec + writeUpdatedSpec |
| Git log | changes/archive/ | moveDirectory(changeDir, archivePath) |
| Pre-commit hook | openspec validate | validator.ts（Zod schema） |

> **源码洞察**：OpenSpec 实际上是一个**基于 content-addressed store 的工作流引擎，由 filesystem 完成寻址**。整个方法论存在于目录结构中，CLI/命令/AI 集成只是其上的接口。删掉 node_modules 里的每个 JS 文件，仍拥有完整的 SDD 代码库。

### 2.2 流程：Actions, Not Phases

workflows.md 明确哲学：**"行动而非阶段"**——命令是"你能做的事"，而非"你被困住的阶段"。依赖是**促进器（enabler）而非门控（gate）**，可跳过。

两套 profile（config.yaml 的 profile 字段控制）：

- **core（默认快速路径）**：/opsx:propose → /opsx:apply → /opsx:sync → /opsx:archive
- **expanded（完整）**：增加 new / continue / ff / verify / bulk-archive / onboard / explore

典型模式：**Quick Feature**（new→ff→apply→verify→archive）、**Exploratory**（explore→new→continue）、**Parallel Changes**（多 change 并行 + bulk-archive 冲突检测）。

### 2.3 规范：Spec Delta 是灵魂（源码级实现）

**Spec Delta 三段式语法**（schemas/spec-driven/schema.yaml 的 instruction 逐字规范）：

```
## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST support TOTP-based 2FA.
#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements
### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

## REMOVED Requirements
### Requirement: Remember Me
**Reason**: Replaced by 2FA.
**Migration**: Use /api/v2/auth.
```

**Delta 合并引擎实现**（src/core/specs-apply.ts，源码级拆解）：

1. **解析**：parseDeltaSpec(changeContent) 将 delta 解析为 {added, modified, removed, renamed} 四个数组
1. **去重校验**：每个段内 requirement name 去重（addedNames/modifiedNames/removedNamesSet/renamedFromSet），重复抛 ERROR
1. **跨段冲突检测**（源码 L163-193）：
  - MODIFIED ∩ REMOVED → conflict
  - MODIFIED ∩ ADDED → conflict
  - ADDED ∩ REMOVED → conflict
  - RENAMED 的 FROM 不能出现在 MODIFIED（MODIFIED 必须引用 NEW header）
  - RENAMED 的 TO 不能与 ADDED 碰撞
1. **合并顺序**（源码 L244）：RENAMED → REMOVED → MODIFIED → ADDED
1. **新 spec 约束**：target 不存在时，只允许 ADDED；MODIFIED/REMOVED/REMOVED 需要现有 spec
1. **预校验 + 原子写**：所有 update 先 buildUpdatedSpec 验证通过，再批量 writeUpdatedSpec；任一失败则 "Aborted. No files were changed."
1. **结构校验**：findMainSpecStructureIssues 检查主 spec 结构合法性，Validator.validateSpecContent 用 Zod schema 校验合并后内容

> **源码洞察**：这套合并引擎是**确定性操作**（ADDED 追加 / MODIFIED 替换 / REMOVED 删除 / RENAMED 改名），完全由脚本执行——这恰好符合 spec-first 的 "scripts prepare" 原则，是二者融合的技术基础。

### 2.4 规范语法特性（源码验证）

| 特性 | 作用 | 源码位置 |
| --- | --- | --- |
| **RFC 2119 关键词**（MUST/SHALL/SHOULD/MAY） | 精确表达需求强度，可机器判读 | schema.yaml instruction: "Use SHALL/MUST for normative requirements" |
| **GIVEN/WHEN/THEN 场景** | 结构化、天然可测试 | schema.yaml: "Scenarios MUST use exactly 4 hashtags (####)" |
| **渐进式严格度** | Lite spec（默认）vs Full spec（跨团队/API/安全） | concepts.md |
| **行为契约 vs 实现分离** | spec 只写可观察行为 | schema.yaml: "implementation details belong in design.md" |

**关键约束**（源码）：scenario 必须用 4 个 #（#### Scenario:），用 3 个或 bullet 会"silently fail"；每个 requirement MUST 至少一个 scenario；MODIFIED 必须包含完整更新内容（partial content 会在 archive 时丢细节）。

### 2.5 验证：Zod Schema + 三维度一致性

**格式验证**（src/core/validation/validator.ts）：

- 用 **Zod schema**（SpecSchema/ChangeSchema）做强类型结构校验
- applySpecRules 应用业务规则（如 MIN_PURPOSE_LENGTH、MAX_REQUIREMENT_TEXT_LENGTH）
- validateChangeDeltaSpecs 专门校验 delta 格式

**实现一致性验证**（/opsx:verify，三维度）：

| 维度 | 校验内容 |
| --- | --- |
| **Completeness** | tasks 全勾选、requirements 有对应代码、scenarios 有覆盖 |
| **Correctness** | 实现匹配 spec 意图、边缘情况处理、错误状态匹配 |
| **Coherence** | design 决策在代码结构中体现、命名一致性 |

> **注意**：verify **不阻断** archive，只提示问题。这与 spec-first 的 honest closeout 形成对比——后者会**降级** unsupported claim。

### 2.6 Skill / 定制：Schema 驱动（源码级）

三级定制（docs/customization.md + schemas/ 实际文件）：

1. **Project Config**（config.yaml）：schema（默认 schema）+ context（技术栈注入）+ rules（per-artifact 规则）
1. **Custom Schemas**（openspec/schemas/<name>/schema.yaml）：用 YAML 声明 artifact 序列与依赖
1. **Global Overrides**：~/.local/share/openspec/schemas/

**schema.yaml 实际结构**（schemas/spec-driven/schema.yaml，154 行）：

```
name: spec-driven
version: 1
description: Default OpenSpec workflow - proposal → specs → design → tasks
artifacts:
  - id: proposal
    generates: proposal.md
    template: proposal.md
    instruction: |    # 注入 AI 的指令（含 WHY/WHAT/Impact 段落要求）
      Create the proposal document that establishes WHY...
    requires: []      # 依赖是促进器，非门控
  - id: specs
    generates: "specs/**/*.md"   # 支持 glob
    template: spec.md
    instruction: |
      Create specification files that define WHAT...
      Delta operations: ADDED / MODIFIED / REMOVED / RENAMED
    requires: [proposal]
  - id: design
    requires: [proposal]
  - id: tasks
    requires: [specs, design]
apply:
  requires: [tasks]
  tracks: tasks.md    # apply 阶段追踪 tasks.md 的 checkbox
  instruction: |
    Read context files, work through pending tasks, mark complete as you go.
```

**schema 命令族**：openspec schema fork（复制现有 schema）/ init（从零创建）/ validate（校验语法+模板+无循环依赖）/ which（解析来源）。

**社区 schema**：如 superpowers-bridge（集成 obra/superpowers 执行 skill + evidence-first retrospective artifact）。

### 2.7 AI 集成：27 适配器（源码级）

src/core/command-generation/adapters/ 下 **27 个适配器**（实测），每个实现 ToolCommandAdapter 接口：

```
// adapters/claude.ts 示例（56 行，纯格式转换）
export const claudeAdapter: ToolCommandAdapter = {
  toolId: 'claude',
  getFilePath(commandId: string): string {
    return path.join('.claude', 'commands', 'opsx', `${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---\nname: ${escapeYamlValue(content.name)}\n...`;  // 生成 YAML frontmatter
  },
};
```

适配器是**纯格式转换层**——把统一的 CommandContent 转成各工具的 frontmatter 格式。CommandAdapterRegistry 统一注册，openspec init --tools claude,cursor 按需生成。

> **源码洞察**：OpenSpec 的适配器是"薄"的——只管命令文件格式，不管 hooks、不管 runtime drift、不管 agent name 重写。这与 spec-first 的"厚"适配器形成对比。

## 3. spec-first 深度拆解（源码级）

### 3.1 哲学：Scripts Prepare, LLM Decides

> **脚本准备事实，LLM 做语义判断，证据留在你的仓库里。**

核心诊断：AI coding 最大问题不是 agent 不会写代码，而是**关键判断只停留在聊天窗口里**。spec-first 把 requirements/PRD/plans/task packs/work evidence/debug notes/reviews/learnings 作为**持久 artifact** 留在仓库。

**三层工程概念**（spec-first 独有的抽象高度，CONCEPTS.md + 核心概念文档）：

| 层 | 关注 | OpenSpec 对应 |
| --- | --- | --- |
| Prompt Engineering | 如何发出更清晰的指令 | 有（instruction 字段） |
| Context Engineering | 模型能看到什么信息、如何组织 | 部分（config.yaml context） |
| **Harness Engineering** | 整个系统如何运行：约束、反馈回路、工作流控制、持续改进 | **无** |

### 3.2 流程：五阶段闭环 + Supporting Workflows

**五阶段主链路**：Brainstorm → Plan → Work → Review → Compound

更完整的工程闭环：Codebase → Graph → Spec → Plan → Tasks → Code → Review → Knowledge

**入口矩阵**（templates/claude/commands/spec/ 下 18 个命令模板，实测）：

| 阶段 | Claude 入口 | Codex 入口 | 产出位置 |
| --- | --- | --- | --- |
| 前置 | spec-mcp-setup spec-ideate spec-brainstorm spec-prd spec-doc-review | spec-* | docs/ideation/ docs/brainstorms/ |
| 计划 | spec-plan + write-tasks skill | spec-plan | docs/plans/ docs/tasks/ |
| 执行 | spec-work spec-debug spec-optimize spec-polish-beta | spec-* | 代码 + .spec-first/workflows/spec-work/ |
| 评审 | spec-code-review spec-app-consistency-audit | spec-* | review artifacts |
| 沉淀 | spec-compound spec-compound-refresh spec-sessions spec-skill-audit | spec-* | docs/solutions/ |

> **关键**：这些入口**不是刚性状态机**，脚本准备 deterministic facts，LLM 根据目标/证据/scope/风险决定下一步。

### 3.3 规范：Artifact Trail（源码级，缺口确认）

```
docs/
├── ideation/        # ranked idea candidates（advisory，可丢弃）
├── brainstorms/     # requirements briefs / PRD-grade requirements
├── plans/           # 可评审、可执行的 implementation plans
├── tasks/           # 结构化 handoff 用 derived task packs
└── solutions/       # 解决问题后沉淀的 reusable learnings
```

**源码确认的结构性缺口**：

- 这些是**独立文档**，没有"主契约累积"概念，没有"delta 增量"，没有"归档合并"
- spec-brainstorm 的 SKILL.md（294 行）产出 docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md，是一次性 requirements document
- spec-compound 的 SKILL.md（630 行）只沉淀 learnings 到 docs/solutions/，**不回写/合并 requirements**
- 知识闭环在契约层断裂：compound 沉淀了"怎么解决问题"，却不沉淀"系统行为契约演进了什么"

### 3.4 验证：合约化信任模型（源码级，护城河确认）

这是 spec-first 最强、OpenSpec 完全没有的部分。源码级拆解 honest-closeout.js（370 行）：

**Trust Model**：

| 角色 | 职责 | 源码实现 |
| --- | --- | --- |
| 脚本 | install/validate/generate/clean/hash/report facts | honest-closeout.js validateHonestCloseout() |
| LLM | requirements framing/scope/tradeoffs/judgment/review | skill 中的语义判断指令 |

**Honest Closeout 核心机制**（源码 L177-227，evaluateClaim）：

四种 claim 类型：validation / impact_surface / review / knowledge_promotion

**防 cherry-pick 机制**（源码 L213-220，关键发现）：

```
if (claim.asserted_status === 'passed') {
  // 防 cherry-pick: passed 断言必须反映 run summary 全部 check 的聚合真相,
  // 不能只引用通过的子集而隐藏未覆盖的 not-run/failed/degraded check。
  const aggregate = aggregateRunSummaryStatus(context.runSummary);
  if (aggregate !== 'passed') {
    return withVerdict(claim, 'degraded', 'run-summary-checks-uncovered');
  }
  ...
}
```

**裁决层级**（源码 L316-326）：

- unsupported：证据缺失/不匹配（最高优先级，overall 即 unsupported）
- degraded：证据存在但不足以 verified closeout
- verified（consistent）：所有 claim 证据一致

**Verification Run Summary 合约**（spec-first.verification.json 实测）：

```
{
  "schema_version": "verification-profile.v1",
  "profiles": {
    "default": {
      "services": ["spec-first"],
      "checks": ["typecheck", "unit", "smoke", "integration"]
    }
  },
  "stacks": {
    "node": {
      "detect": ["package.json"],
      "commands": {
        "typecheck": "npm run typecheck",
        "unit": "npm run test:unit"
      },
      "required_tools": { "typecheck": ["node", "npm"] }
    }
  }
}
```

check status 边界：passed（ran=true+exit=0+有日志）/ failed（ran=true+非零+有日志）/ not-run（ran=false+具体 reason_code）/ degraded（证据不足）。**Helpers 不安装工具、不重跑命令、不推断 exit code、不把 dry-run 提升为 passed**。

### 3.5 Compound Learning：知识沉淀（源码级，深度远超预期）

spec-compound/SKILL.md（630 行）揭示了远比文档丰富的实现：

**Full Mode 并行 subagent 架构**：

- **Context Analyzer**：提取对话历史，读 schema 分类（bug/knowledge track），生成 YAML frontmatter skeleton
- **Solution Extractor**：按 track 输出不同结构（bug: Problem/Symptoms/What Didn't Work/Solution/Why/Prevention；knowledge: Context/Guidance/Why/When/Examples）
- **Related Docs Finder**：grep-first 过滤，5 维度 overlap 评估（problem/root cause/solution/files/prevention），High/Moderate/Low 分级
- **Session History Enrichment**：跨 Claude Code/Codex session 搜索（foreground，因读 ~/.claude/projects/）

**Structured Promotion Gate**（源码 L93-97）：

- 新 promoted solution 必须含 invalidation_condition + source_refs
- 可选 domain/pattern/rejected_alternatives/applicable_versions
- "Only a source-confirmed, verified learning may enter durable docs/solutions/"
- legacy docs 标记 legacy_unstructured_advisory

**Discoverability Check**（源码 L360-394）：检查 AGENTS.md/CLAUDE.md 是否能让 agent 发现 docs/solutions/，不能则建议最小编辑（非强制）。

**Vocabulary Capture**：CONCEPTS.md 存在时更新术语表（advisory，不 bootstrap）。

### 3.6 Source/Runtime/Provider 边界（源码级，双宿主统一 source）

src/cli/adapters/ 下 2 个适配器（claude.js 395 行、codex.js），实现 PlatformAdapter 接口：

```
source assets (skills/ agents/ templates/ src/cli/)
  → spec-first init → host runtime assets
  → workflow artifacts (docs/)
```

**dual-host-governance 合约**（skills-governance.json，声明式 JSON）：

```
{
  "skill_name": "spec-doc-review",
  "entry_surface": "workflow_command",  // 或 internal_only
  "host_scope": "dual_host",
  "host_delivery": {
    "claude": "command",   // .claude/commands/spec/
    "codex": "skill"       // .agents/skills/
  }
}
```

**spec-first 适配器比 OpenSpec"厚"得多**（源码对比）：

| 能力 | OpenSpec 适配器 | spec-first 适配器 |
| --- | --- | --- |
| 格式转换 | ✅ YAML frontmatter | ✅ frontmatter + body merge |
| Hooks 管理 | ❌ | ✅ session-start + spec-plan-guard |
| Runtime drift 检测 | ❌ | ✅ inspectRuntimeFiles 检测 canonical name/Task ref 漂移 |
| Agent name 重写 | ❌ | ✅ rewriteCanonicalAgentNamesForSkills |
| Managed hook 校验 | ❌ | ✅ 检测 drifted/missing/non-executable |
| Path 重写 | ❌ | ✅ rewriteSourceSkillRuntimePaths |

> **源码洞察**：spec-first 的 skills-governance.json 是**分发治理 schema**（声明 skill 如何分发到各宿主），但**不是工作流定义 schema**——它不声明 artifact 序列、依赖、template。这正是它该向 OpenSpec 的 schema.yaml 借鉴之处。

### 3.7 51 个专业 Agent（源码级，第一版严重低估）

agents/ 下 **51 个** .agent.md 文件（实测），远超第一版认知。分类：

| 类别 | 代表 agent | 职责 |
| --- | --- | --- |
| **评审** | spec-correctness-reviewer, spec-coherence-reviewer, spec-feasibility-reviewer, spec-scope-guardian-reviewer | 正确性/连贯性/可行性/scope 守护 |
| **安全** | spec-security-reviewer, spec-security-sentinel, spec-security-lens-reviewer | 多角度安全审查 |
| **性能** | spec-performance-oracle, spec-performance-reviewer | 性能分析 |
| **数据** | spec-data-integrity-guardian, spec-data-migration-expert, spec-schema-drift-detector | 数据完整性/迁移/schema 漂移 |
| **栈专属** | spec-kieran-rails-reviewer, spec-kieran-python-reviewer, spec-kieran-typescript-reviewer, spec-swift-ios-reviewer, spec-dhh-rails-reviewer | 各语言/框架 best practice |
| **研究** | spec-repo-research-analyst, spec-web-researcher, spec-best-practices-researcher, spec-framework-docs-researcher, spec-learnings-researcher, spec-slack-researcher | 多源研究 |
| **设计** | spec-architecture-strategist, spec-design-iterator, spec-figma-design-sync | 架构/设计迭代 |
| **对抗** | spec-adversarial-reviewer, spec-adversarial-document-reviewer | 对抗性审查 |

> **源码洞察**：这 51 个 agent 是 spec-first 的"执行肌肉"——compound 的 Phase 3 会按 problem_type 自动触发（如 performance_issue → spec-performance-oracle，security_issue → spec-security-sentinel）。OpenSpec 没有这种专业 agent 生态。

### 3.8 三种开发模式（源码级确认）

| 模式 | 形态 | 源码处理 |
| --- | --- | --- |
| 单仓单项目 | 一个 repo 一个应用 | .spec-first/* 以当前 repo 为边界 |
| 单仓多模块 | monorepo / 多 module | .spec-first 只放 repo root，不按 module 分裂 |
| 多仓工作区 | 父目录下多个独立 Git 工程 | 父 workspace 只写 advisory summary；--repo <child> 收窄；--all-repos 显式等价 |

关键区分：**"dirty-advisory / stale evidence" 与 "query unavailable" 是两件事**——dirty worktree 下的证据可能降级为 stale/advisory 但仍可用，不强制用户先 commit。

## 4. 多维度对比矩阵（源码级量化）

| 维度 | OpenSpec | spec-first | 谁更强 | 源码证据 |
| --- | --- | --- | --- | --- |
| **核心抽象** | Spec 契约 + Delta 增量 | Artifact Trail + Source/Runtime 边界 | 各有所长 | specs-apply.ts vs adapters/ |
| **规范演进** | Delta 合并累积，spec 是活契约 | 独立文档，无累积合并 | **OpenSpec** | parseDeltaSpec + buildUpdatedSpec |
| **规范语法** | RFC 2119 + GIVEN/WHEN/THEN | 自由格式 requirements | **OpenSpec** | schema.yaml instruction |
| **合并引擎** | RENAMED→REMOVED→MODIFIED→ADDED + 跨段冲突检测 | 无 | **OpenSpec** | specs-apply.ts L244 |
| **可测试性** | 场景天然可测试（spec 即 eval） | 依赖 verification 合约 | OpenSpec（表达）/ spec-first（执行） | schema.yaml vs verification.json |
| **工作流灵活性** | Actions not phases，可跳过 artifact | 入口丰富但相对线性 | OpenSpec（跳过）/ spec-first（覆盖面） | workflows.md |
| **可定制性** | Schema 驱动，可 fork/校验/社区分发 | governance.json 仅分发治理 | **OpenSpec** | schema.yaml vs skills-governance.json |
| **信任模型** | 无明确边界 | Scripts prepare/LLM decides + 合约 | **spec-first** | honest-closeout.js |
| **验证诚实度** | verify 三维度（不降级 claim） | Honest Closeout（降级 + 防 cherry-pick） | **spec-first** | evaluateClaim L213-220 |
| **知识沉淀** | 归档 change（历史参考） | Compound Learning（可复用 learnings + promotion gate） | **spec-first** | spec-compound/SKILL.md |
| **专业 Agent** | 无 | 51 个专业 agent | **spec-first** | agents/*.md |
| **多宿主** | 27 适配器（per-tool 薄转换） | 双宿主统一 source（厚适配器 + drift 检测） | spec-first（架构更干净） | adapters/claude.ts vs claude.js |
| **工程模型** | 单一项目视角 | 三种开发模式（含多仓 workspace） | **spec-first** | 三种开发模式.md |
| **垂直能力** | 通用 | App Consistency Audit 等专用 workflow | **spec-first** | spec-app-consistency-audit |
| **渐进严格度** | Lite/Full 按风险分级 | 统一重量 | **OpenSpec** | concepts.md |
| **并行冲突检测** | bulk-archive 检测 spec 冲突 | 多仓并行但无契约冲突检测 | **OpenSpec** | workflows.md bulk-archive |
| **上手成本** | 轻（无 API key/MCP） | 重（harness setup、mcp-setup） | **OpenSpec** | openspec init vs spec-first init |
| **上下文策略** | Load-on-demand（hot/warm/cold tier） | bounded direct source reads | OpenSpec（分层）/ spec-first（实时） | profectuslab 分析 |
| **Brownfield** | retrofit 模式（描述性→规范性两遍） | 原生支持（三种开发模式） | 各有所长 | OpenSpec retrofit docs |

**代码规模实测**：

|  | OpenSpec | spec-first |
| --- | --- | --- |
| CLI 源码 | 34,814 行 TypeScript | 19,378 行 JavaScript |
| 文档 | 5,590 行（11 个 .md） | 67 个目录（需求/架构/实施/手册/经验） |
| Skill 内容 | 无独立 skill | **32,363 行** skill markdown |
| Agent | 无 | **51 个** .agent.md |
| Skill | 无 | **37 个** |
| 适配器 | **27 个** | 2 个（claude/codex） |
| Schema | 2 个内置 + 可自定义 | governance.json（分发） |

**一句话**：OpenSpec 在"规范表达与演进"上更成熟（delta 合并引擎是工程级实现），spec-first 在"工程治理与信任"上更深（honest closeout + 51 agent + compound）。二者互补性极强。

## 5. spec-first 需要借鉴的提升点（多轮推演，源码级落地）

> 方法：每个借鉴点做三轮推演——①差距识别（源码证据）②适配评估（能否融入 spec-first 的 trust model）③落地建议（参考 OpenSpec 源码实现）。

### 【P0】借鉴点 1：引入 Spec Delta 增量机制

**① 差距识别（源码证据）**

源码确认 spec-first 的 requirements 是**一次性文档**：

- spec-brainstorm/SKILL.md L13: "the durable output of this workflow is a **requirements document**"
- docs/brainstorms/ 产出 YYYY-MM-DD-<topic>-requirements.md，独立存在
- spec-compound/SKILL.md L12: "creating structured documentation in docs/solutions/"——只沉淀 learnings
- 无 parseDeltaSpec、无 buildUpdatedSpec、无 ADDED/MODIFIED/REMOVED 语法

后果：

- 下次会话要理解"系统当前行为契约"，得从零读历史 plan 拼凑，无单一权威活契约
- 多次需求迭代后，requirements 散落多个 docs/brainstorms/*.md，无法回答"auth 模块现在的完整契约"
- compound 沉淀了"怎么解决问题"，却不沉淀"契约演进了什么"——**知识闭环在契约层断裂**

OpenSpec 的 specs-apply.ts 提供了成熟的合并引擎：RENAMED→REMOVED→MODIFIED→ADDED 顺序、跨段冲突检测、Zod 预校验、原子写。

**② 适配评估（源码级契合度）**

高度契合 spec-first 的 trust model，源码级验证：

- Delta 的"合并"是**确定性操作**（buildUpdatedSpec 是纯函数式：ADDED 追加/MODIFIED 替换/REMOVED 删除/RENAMED 改名）→ 完美符合 "scripts prepare"，可由 spec-first 的 CLI 执行
- Delta 的"语义判断"（这段需求是 ADDED 还是 MODIFIED？影响哪个契约？）由 LLM 完成 → 符合 "LLM decides"，放在 skill instruction 中
- Honest closeout 可扩展：archive 时若 delta 与主 spec 冲突/无法干净合并，应降级为 degraded（run-summary-checks-uncovered 模式）而非强行标记 merged
- 与 compound 联动：compound 的职责扩展为**契约合并的诚实收尾**

**③ 落地建议（参考 OpenSpec 源码）**

- 在 docs/ 下新增 contracts/<domain>/spec.md（主行为契约，累积），类比 OpenSpec 的 openspec/specs/
- spec-brainstorm/spec-prd 产出改为**契约 delta**：## ADDED/MODIFIED/REMOVED Requirements，参考 schemas/spec-driven/schema.yaml 的 specs instruction
- 新增 spec-sync（或扩展 compound）：CLI 执行确定性合并（移植 specs-apply.ts 的 buildUpdatedSpec 逻辑到 JS），LLM 判断冲突，产出 contract-sync-summary（类比 verification-run-summary，记录 merged/conflict/degraded）
- 移植 OpenSpec 的**跨段冲突检测**到 honest-closeout.js：MODIFIED ∩ REMOVED 等冲突标记 unsupported
- 多仓模式下，每个 child repo 一套 contracts/，父 workspace 仅 advisory

> 这是 spec-first 补齐"契约层知识闭环"的关键一跃。OpenSpec 的 specs-apply.ts（160+ 行合并逻辑）+ requirement-blocks.ts（delta parser）提供了可直接参考的实现。

### 【P1】借鉴点 2：引入 Schema 驱动的可声明工作流

**① 差距识别（源码证据）**

源码对比发现 spec-first 的 skills-governance.json 是**分发治理 schema**，不是**工作流定义 schema**：

```
// spec-first 的 governance.json（只管分发）
{
  "skill_name": "spec-doc-review",
  "entry_surface": "workflow_command",
  "host_delivery": { "claude": "command", "codex": "skill" }
}
# OpenSpec 的 schema.yaml（定义工作流本身）
artifacts:
  - id: proposal
    generates: proposal.md
    template: proposal.md
    instruction: |
      Create the proposal...
    requires: []
  - id: specs
    requires: [proposal]   # 声明依赖
apply:
  requires: [tasks]
  tracks: tasks.md
```

spec-first 的工作流是**固定在 source skills 中的**——团队无法声明"我们要 research-first 工作流"或"加一个 retrospective artifact"。要改流程只能直接改 source skills，门槛高、不可校验、不可社区分发。

**② 适配评估**

spec-first 的 source/runtime 分离反而**更适合**做 schema 驱动：

- schema 作为 source asset，spec-first init 按 schema 生成对应 host runtime skills → 天然契合现有"source → init → runtime"管线
- schema validate 可作为 spec-first doctor 的检查项，符合"脚本校验、LLM 判断"
- 社区 schema 可让 spec-first 复用其垂直 workflow（app-audit 等）作为可分发包

**③ 落地建议（参考 OpenSpec 源码）**

- 引入 schemas/<name>/schema.yaml：声明 workflow 的 artifact 序列、依赖、对应 skill、instruction，参考 schemas/spec-driven/schema.yaml 结构
- spec-first init 按 selected schema 生成 runtime skills（而非全量生成所有入口）
- 新增 spec-first schema fork/init/validate/which 命令族，对齐 OpenSpec 的 src/commands/schema.ts
- 默认提供 core（轻量五阶段）和 full（含 supporting workflows）两个 profile
- 与借鉴点 1 联动：schema 可声明 delta-merge artifact，让契约演进成为可选 workflow 段
- 保留 skills-governance.json 做分发治理，与 schema.yaml（工作流定义）分工

### 【P1】借鉴点 3：引入行为契约层 + RFC 2119 / GIVEN-WHEN-THEN 规范语法

**① 差距识别（源码证据）**

源码确认 spec-first 的 requirements 是**自由格式**：

- spec-brainstorm/SKILL.md 的 references/requirements-capture.md 是 canonical markdown template，但无 RFC 2119、无 GIVEN/WHEN/THEN 强制
- references/brainstorm-sections.md 定义内容契约（user-facing behavior/goals/non-goals/risks），但是散文式
- 与 spec-first 自己的 spec-first.verification.json 体系脱节——requirements 不直接派生 verification checks

OpenSpec 用 RFC 2119 + GIVEN/WHEN/THEN + 明确的 spec(契约)/design(实现)/proposal(意图) 三层。schema.yaml 强制 "Use SHALL/MUST for normative requirements"、"Scenarios MUST use exactly 4 hashtags"。

**② 适配评估**

与 spec-first 高度兼容且能**放大其现有优势**：

- GIVEN/WHEN/THEN 场景可直接作为 spec-first.verification.json 的候选 check 来源——规范语法与验证合约打通
- RFC 2119 关键词让 spec-code-review 有可机器对照依据（MUST 是否满足？SHOULD 是否有 documented exception？）
- 行为契约层独立后，plan 才能真正聚焦"实现决策"

**③ 落地建议（参考 OpenSpec 源码）**

- 在契约层（借鉴点 1 的 contracts/）强制 RFC 2119 关键词 + GIVEN/WHEN/THEN 场景，参考 schema.yaml 的 specs instruction
- spec-plan 时从契约场景自动派生候选 verification checks，写入 spec-first.verification.json——**让规范直接驱动验证**
- spec-code-review 增加"MUST 覆盖率"维度：每个 MUST 是否有对应实现+测试，对照 honest closeout 降级未覆盖项
- 保留 spec-first 自由格式 requirements 用于 ideation/brainstorm（探索阶段不强制结构），只在"升格为契约"时强制语法
- 移植 OpenSpec 的"scenario 必须 4 个 #"等格式约束到 schema validate

### 【P2】借鉴点 4：引入 Verify 的结构化一致性校验维度

**① 差距识别**

spec-first 的 spec-code-review 偏语义 + verification-run-summary 记录 check 结果，但缺少 OpenSpec /opsx:verify 那种**对照 artifact 的三维度一致性校验**（Completeness/Correctness/Coherence）。

**② 适配评估**

完美契合：Completeness/Coherence 的"对照"是确定性事实收集（脚本），Correctness 的"意图匹配"是语义判断（LLM）。可融入 verification-run-summary 作为新 check 类别。spec-first 的 51 个 agent（如 spec-coherence-reviewer、spec-correctness-reviewer）天然支持 Correctness/Coherence 维度。

**③ 落地建议**

- spec-code-review 扩展三维度输出，对照 contracts/（契约）+ plans/ + tasks/
- 复用现有 agent：spec-correctness-reviewer（Correctness）、spec-coherence-reviewer（Coherence）、新增 Completeness check（脚本统计 tasks 全勾选 + requirements 有对应代码）
- 新增 coherence check 类别：design.md 的 ### Decision: 是否在代码中体现，未体现项降级为 degraded（honest closeout）

### 【P2】借鉴点 5：引入并行变更的契约冲突检测

**① 差距识别**

spec-first 支持多仓并行、session advisory 提升可见性，但**没有"行为契约层面的冲突检测"**。OpenSpec 的 bulk-archive 检测多个 change 触及同一 spec，按实现顺序合并。

**② 适配评估**

契合：delta 合并冲突检测是确定性操作（脚本比对 ADDED/MODIFIED/REMOVED 作用域），冲突解决是语义判断（LLM）。OpenSpec 的 specs-apply.ts L163-193 跨段冲突检测可直接移植。

**③ 落地建议**

- 借鉴点 1 的 spec:sync 在多任务并行时执行 delta 作用域冲突检测
- 冲突项标记 conflict（类比 degraded），要求 LLM/人介入，不自动合并
- session advisory 扩展：并行的两个 session 若 delta 作用域重叠，advisory 提示

### 【P2】借鉴点 6：引入渐进式严格度（按风险分级）

**① 差距识别**

spec-first 是**统一重量**工作流——小修小补和大重构走一样重的流程。OpenSpec 的 Lite/Full 分级让团队按风险调节（跨团队/API/安全/迁移 → Full）。

**② 适配评估**

契合 schema 驱动（借鉴点 2）：严格度本质是不同 schema profile。

**③ 落地建议**

- spec-first init --profile lite|full，或在 schema 中声明 risk-gates
- 高风险触发条件（API 契约变更/跨 repo/安全/迁移）自动升级到 full，由脚本检测（prepare）+ LLM 确认（decide）

### 【P3】借鉴点 7：引入 Load-on-Demand 上下文分层

**① 差距识别**

spec-first 用 bounded direct source reads（实时读源码），OpenSpec 有明确的上下文分层：hot tier（tasks.md ~50 行）/ warm tier（被引用 spec ~100 行/个）/ cold tier（按需加载）。前者更准确但 token 成本高，后者更经济。

**② 适配评估**

spec-first 的 compound learnings 已是某种 cold tier，但缺分层策略。可借鉴但需平衡实时性。

**③ 落地建议**

- 引入契约层后，contracts/<domain>/spec.md 作为 warm tier（~100 行/个），docs/solutions/ 作为 cold tier
- skill 入口明确声明上下文加载策略（hot/warm/cold），减少不必要的全量读取

## 6. 客观呈现：spec-first 的护城河（源码级验证，OpenSpec 反而可学习）

为避免单向褒贬，源码级确认 spec-first 在以下方面**领先 OpenSpec**，这些是借鉴时**应保留而非丢弃**的根基：

| spec-first 护城河 | 源码证据 | OpenSpec 的对应短板 |
| --- | --- | --- |
| **Scripts prepare/LLM decides 信任模型** | honest-closeout.js 全文 | OpenSpec 无明确信任边界，AI 自由产出 artifact |
| **Honest Closeout + 防 cherry-pick** | evaluateClaim L213-220 强制聚合真相 | OpenSpec verify 只提示不阻断，不降级 claim |
| **Verification Run Summary 合约化** | spec-first.verification.json + verification-run-summary | OpenSpec 验证是 LLM 对话式，无结构化 check 记录 |
| **Compound Learning + Promotion Gate** | spec-compound/SKILL.md 630 行，invalidation_condition+source_refs | OpenSpec 只归档 change 历史，不沉淀可复用 learnings |
| **51 个专业 Agent 生态** | agents/*.md 51 个文件 | OpenSpec 无专业 agent |
| **Source/Runtime/Provider 边界** | adapters/claude.js 395 行 + drift 检测 | OpenSpec 27 适配器是薄转换，无 drift 治理 |
| **Harness Engineering 三层概念** | CONCEPTS.md | OpenSpec 停留在 spec 层，无 context/harness 层抽象 |
| **三种开发模式（多仓 workspace）** | 08-三种开发模式.md | OpenSpec 无多仓/monorepo 治理 |
| **垂直 workflow（App Consistency Audit）** | spec-app-consistency-audit/ | OpenSpec 纯通用 |
| **Skill Audit（source skill 治理）** | spec-skill-audit/ | OpenSpec 无 skill 自审机制 |
| **Discoverability Check** | compound Phase 2.5 检查 AGENTS.md | OpenSpec 无此机制 |

**关键提醒（源码级）**：spec-first 在借鉴 OpenSpec 的规范演进机制时，**必须把这些建在自己的 trust model 之上**——Delta 合并用脚本执行（移植 specs-apply.ts 逻辑）、冲突用 LLM 判断、合并结果走 honest-closeout.js 的降级机制。否则会背离自身"工程治理"核心定位，变成"第二个 OpenSpec"而非"更强的 spec-first"。

## 7. 借鉴路线图（建议实施顺序，源码级可操作性）

```
Phase 1（契约层补齐）—— 参考 OpenSpec specs-apply.ts + requirement-blocks.ts
  ├─ P0-1: 引入 contracts/ 主契约 + Delta 增量语法
  │        移植 parseDeltaSpec + buildUpdatedSpec 到 spec-first CLI
  ├─ P1-3: RFC 2119 + GIVEN/WHEN/THEN 规范语法
  │        参考 schema.yaml 的 specs instruction
  └─ 联动: spec-plan 从契约场景派生 verification checks
           写入 spec-first.verification.json

Phase 2（工作流可声明化）—— 参考 OpenSpec schema.yaml + commands/schema.ts
  ├─ P1-2: Schema 驱动工作流（schema.yaml + fork/validate）
  │        与现有 skills-governance.json 分工
  ├─ P2-6: 渐进式严格度（lite/full profile）
  └─ 联动: Delta 合并作为 schema 中的可选 artifact 段

Phase 3（治理深化）—— 融入 spec-first 现有 honest-closeout + 51 agents
  ├─ P2-4: Verify 三维度一致性校验
  │        复用 spec-correctness-reviewer / spec-coherence-reviewer
  ├─ P2-5: 并行契约冲突检测
  │        移植 specs-apply.ts L163-193 跨段冲突检测
  └─ P3-7: Load-on-Demand 上下文分层
```

每个 Phase 都**不破坏** spec-first 现有 trust model，而是在其之上叠加"契约演进"能力。Phase 1 的实现可直接参考 OpenSpec 的 specs-apply.ts（160+ 行）和 requirement-blocks.ts，移植成本可控。

## 8. 社区实践与生态洞察

### 8.1 OpenSpec 的市场定位与反馈

- **YC 孵化**，创始人 Tabish Bidiwale，50k stars，v1.3.1（2026-04）
- 核心论点：*"Generating code is now cheap. Correctness is still expensive."* 瓶颈不是模型能力，而是**到达合格 spec、跨会话保持稳定、隔离并发变更、无污染合并回事实源**
- **Brownfield 是关键差异化**：*"Brownfield is where the work actually is."* 支持 retrofit（第一遍描述性 specs → 第二遍人工转规范性）
- **Spec 即 Eval**：GIVEN/WHEN/THEN 场景天然 eval-shaped，可 scrape specs/ 树作为测试用例
- 已知失败模式：高度视觉/动画工作不适配；研究阶段代码 spec 后置更佳；廉价模型产生浅薄 specs（需 Opus 4.7 / Codex 5.5）

### 8.2 spec-first 的市场定位与反馈

- 定位明确：**不是通用 agent marketplace，不是 standalone app**，而是给已有 Claude Code/Codex 会话加可治理工程闭环
- 核心论点：*"AI coding is not a prompt problem — it is a workflow problem."*
- 双宿主统一 source 是核心卖点：一套 source assets 同时生成 Claude spec-* 和 Codex spec-*
- 社区讨论聚焦于其"重"——harness setup 成本高，但治理深度是其价值锚点

### 8.3 生态碎片化警告

2026 年 SDD 生态碎片化严重：SpecKit/Kiro/BMAD/Antigravity/Tessl/OpenSpec/spec-first 不互操作。社区共识：**选一个，commit**。这也意味着二者融合（spec-first 借鉴 OpenSpec 的 delta 机制）能让 spec-first 成为更完整的选择，而非让用户在"规范演进"和"工程治理"间二选一。

## 9. 结论

源码级拆解后，OpenSpec 和 spec-first 代表 SDD 的两种范式，且互补性比第一版认知更强：

- **OpenSpec**：以"规范契约"为中心，轻量、可演进、可定制，胜在**规范表达与累积演进**。其 specs-apply.ts 的 delta 合并引擎是工程级成熟实现，schema.yaml 的工作流声明能力是 spec-first 所缺。
- **spec-first**：以"工程治理"为中心，重信任模型、重知识闭环、重多场景，胜在**工程纪律与信任诚实**。其 honest-closeout.js 的防 cherry-pick 机制、51 个专业 agent、compound 的 structured promotion gate，都是 OpenSpec 完全没有的。

spec-first 不需要变成 OpenSpec，但它**确实存在一个源码级确认的结构性缺口**：requirements 作为"一次性文档"而非"可累积演进的活契约"。这个缺口导致它的知识闭环在契约层断裂——compound 沉淀了 learnings，却没有沉淀/合并 requirements。

**最高优先级的借鉴是 Spec Delta 机制**，且它能在 spec-first 现有 trust model 上干净落地（脚本合并 / LLM 判断 / honest closeout 降级）。OpenSpec 的 specs-apply.ts + requirement-blocks.ts 提供了可直接参考的实现。补齐这一环后，spec-first 将同时拥有"工程治理深度"和"规范演进能力"，形成对 OpenSpec 的范式超越，而非简单追赶——因为它在信任模型、agent 生态、知识沉淀上的护城河是 OpenSpec 短期无法复制的。

其余借鉴（schema 驱动、规范语法、verify 维度、冲突检测、严格度分级、上下文分层）均为增量增强，可按路线图分阶段引入，每个都有 OpenSpec 源码可参考。

## 附录 A：核心概念对照表（源码级）

| 概念 | OpenSpec | spec-first | 源码位置 |
| --- | --- | --- | --- |
| 行为契约 | specs/<domain>/spec.md（活契约） | 无明确对应（散在 brainstorms/） | specs-apply.ts |
| 变更单元 | changes/<name>/（含 delta） | docs/plans/ + docs/tasks/（独立文档） | archive.ts |
| 增量表达 | Spec Delta（ADDED/MODIFIED/REMOVED/RENAMED） | 无 | requirement-blocks.ts |
| 归档/合并 | archive 时 delta 合并进主 spec | 无合并；compound 沉淀 learnings | specs-apply.ts L244 |
| 需求强度 | RFC 2119（MUST/SHALL/SHOULD/MAY） | 无 | schema.yaml |
| 场景格式 | GIVEN/WHEN/THEN（4 个 #） | 自由格式 acceptance examples | schema.yaml |
| 技术方案 | design.md（Architecture Decisions） | plan 内含技术决策 | schema.yaml |
| 任务清单 | tasks.md（层级编号 checkbox） | docs/tasks/ task pack | schema.yaml |
| 验证 | /opsx:verify 三维度（Zod schema） | verification-run-summary 合约 + honest closeout | validator.ts / honest-closeout.js |
| 工作流定义 | schema.yaml（可声明/校验/分发） | governance.json（仅分发） | schemas/ / skills-governance.json |
| 信任边界 | 无明确 | Scripts prepare / LLM decides | honest-closeout.js |
| 专业 Agent | 无 | 51 个 | agents/*.md |
| 多宿主 | 27 适配器（薄） | Source/Runtime 分离（厚 + drift） | adapters/ |
| 多仓治理 | 无 | 三种开发模式 | 08-三种开发模式.md |
| 知识沉淀 | 归档 change 历史 | Compound Learning + promotion gate | spec-compound/SKILL.md |
| 上下文策略 | Load-on-demand（hot/warm/cold） | bounded direct source reads | - |

## 附录 B：源码规模实测

|  | OpenSpec | spec-first |
| --- | --- | --- |
| CLI 源码 | 34,814 行 TypeScript | 19,378 行 JavaScript |
| 文档 | 5,590 行（11 .md） | 67 目录（需求/架构/实施/手册/经验） |
| Skill 内容 | 无独立 skill | 32,363 行 skill markdown |
| Agent | 无 | 51 个 .agent.md |
| Skill | 无 | 37 个 |
| 适配器 | 27 个 | 2 个（claude/codex） |
| Schema | 2 内置 + 可自定义 | governance.json（分发） |
| 验证 | Zod schema + 3 维度 verify | verification-run-summary + honest closeout（防 cherry-pick） |

## 附录 C：信息来源

**源码级**（clone 仓库实测）：

- OpenSpec：schemas/spec-driven/schema.yaml、src/core/specs-apply.ts、src/core/archive.ts、src/core/validation/validator.ts、src/core/command-generation/adapters/claude.ts、docs/concepts.md、docs/workflows.md、docs/customization.md
- spec-first：skills/spec-brainstorm/SKILL.md、skills/spec-compound/SKILL.md、src/cli/helpers/honest-closeout.js、src/cli/adapters/claude.js、src/cli/contracts/dual-host-governance/skills-governance.json、spec-first.verification.json、docs/05-用户手册/02-核心概念.md、docs/05-用户手册/08-三种开发模式.md、agents/*.md（51 个）

**社区调研**：

- OpenSpec in 2026: The Operating System for Spec-Driven Development（Filesystem-as-State-Machine 深度洞察）
- spec-first GitHub / spec-first.cn
- LINUX DO 社区讨论
- AI 规范驱动开发三剑客对比
