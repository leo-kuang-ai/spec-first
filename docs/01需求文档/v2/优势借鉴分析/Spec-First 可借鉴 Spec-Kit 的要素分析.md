# Spec-First 可借鉴 Spec-Kit 的要素分析

> **版本**: v1.1 | **日期**: 2026-02-25 | **作者**: AI Analysis
> **输入**: Spec Kit (GitHub) + Spec Kit V-Model Extension + Spec-First v7.1 可行性评估
> **目标**: 识别 Spec-Kit 中可直接借鉴到 Spec-First 的机制，映射到 v7.1 的 Gap/Risk，给出落地建议

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. "英语单元测试"式 Checklist（Unit Tests for English）](#1-英语单元测试式-checklistunit-tests-for-english)
  - [2. Constitution 语义化版本管理](#2-constitution-语义化版本管理)
  - [3. 结构化歧义消解（Clarify Command）](#3-结构化歧义消解clarify-command)
  - [4. 跨产物一致性分析（Analyze Command）](#4-跨产物一致性分析analyze-command)
  - [5. 模板驱动的 LLM 行为约束](#5-模板驱动的-llm-行为约束)
  - [6. 用户故事组织的任务分解](#6-用户故事组织的任务分解)
  - [7. Agent 无关架构（18+ Agent 支持）](#7-agent-无关架构18-agent-支持)
  - [8. V-Model 四层配对追踪体系](#8-v-model-四层配对追踪体系)
  - [9. 扩展系统（Extension System）](#9-扩展系统extension-system)
  - [10. Agent 上下文自动同步](#10-agent-上下文自动同步)
  - [11. Handoff 接力机制](#11-handoff-接力机制)
  - [12. 前缀匹配的 Feature 目录定位](#12-前缀匹配的-feature-目录定位)
- [总结映射表](#总结映射表)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议](#落地建议)

---

## 核心结论

**Spec-Kit 的最大价值在于"规范质量工程"——它不只关心流程是否走完，更关心每一步产出的规范文档本身是否高质量、无歧义、可追踪。**

这恰好补齐了 Spec-First 的一个关键盲区：Spec-First 在"流程应该怎么走"上极其完备（8+2 阶段 + Gate + GL），但在"规范文档本身的质量如何保证"上缺少系统性机制。Spec-Kit 提供的是**规范层面的质量工程手段**，而非流程层面的治理。

两者是同一赛道的不同侧重：

| 维度 | Spec-Kit (GitHub) | Spec-First v7.1 | 互补关系 |
|------|-------------------|------------------|----------|
| 定位 | 规范驱动开发工具包（SDD） | 规范驱动研发流程引擎 | **同赛道，侧重不同** |
| 流程完整性 | 轻量（6 步线性管线） | 重量级（8+2 阶段 + Gate + GL） | Spec-First 远超 |
| 追踪与度量 | 基础（FR/SC/T 三级 ID） | 极强（Feature+FR/DS/TASK/TC/RFC + C1-C9 + H1） | Spec-First 远超 |
| 规范质量验证 | 极强（Checklist + Clarify + Analyze） | 弱（Gate 检查产物存在性，不检查质量） | **Spec-Kit 远超** |
| Constitution 治理 | 极强（语义版本 + 合规门禁） | 有但简单（静态 constitution.md） | **Spec-Kit 更成熟** |
| Agent 覆盖 | 极强（18+ Agent，含 generic 模式） | 中等（Claude Code + Codex，缺 generic） | **Spec-Kit 远超** |
| V-Model 追踪 | 极强（四层配对 + 四矩阵） | 无 | **Spec-Kit 独有** |
| 扩展机制 | 有（Extension System，RFC 文档与实现并行演进） | 无 | Spec-Kit 领先 |
| 执行纪律 | 弱（无续航、无完成检测） | 有框架（Phase Machine） | Spec-First 更强 |
| 变更管理 | 无（无 RFC/Defect 机制） | 强（RFC + Defect + Impact Analysis） | Spec-First 远超 |

---

## 项目对比概览

### Spec-Kit（GitHub）

- **定位**: 规范驱动开发（SDD）工具包，将自然语言需求转化为可执行规范和工作代码
- **维护方**: GitHub（方法论受 John Lam 工作影响） | **协议**: MIT
- **核心理念**: "The Power Inversion"——规范不服务于代码，代码服务于规范；PRD 不是指南，是生成源
- **8 个命令**: constitution → specify → clarify → plan → tasks → analyze → implement → checklist
- **18+ Agent 支持**: Claude Code / Gemini CLI / Cursor / Copilot / Codex / Windsurf / Kilo 等
- **技术栈**: Python CLI（Typer + Rich）+ Markdown 命令 + Bash/PowerShell 脚本 + 模板系统
- **V-Model 扩展**: 社区扩展包，四层配对追踪（REQ↔ATP, SYS↔STP, ARCH↔ITP, MOD↔UTP）

### Spec-First（v7.1）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **8+2 阶段**: Init → Specify → Design → Plan → Implement → Verify → Wrap-up → Release → done/cancelled
- **19 个 Skill**: 阶段 10 + 编排 3 + 辅助 6
- **技术栈**: TypeScript CLI + Markdown Skills + YAML Front Matter + Handlebars 模板

---

## 可借鉴要素详析

### 1. "英语单元测试"式 Checklist（Unit Tests for English）

**对应 Spec-Kit 机制**: `/speckit.checklist` 命令 — 为需求文档生成质量验证清单，验证的是"需求写得好不好"而非"代码跑得对不对"

**解决 Spec-First 问题**: Gap 2（规范文档质量无保障）+ Risk 1（AI 生成的 spec 看似完整实则模糊）

#### Spec-Kit 做法

Spec-Kit 将 Checklist 定义为**"英语的单元测试"**——测试的对象不是代码，而是需求文档本身。

**允许的检查项**（测试需求质量）：
```markdown
- [ ] CHK001 视觉层级需求是否为所有卡片类型定义了具体尺寸？ [Spec SS 3.2]
- [ ] CHK002 "突出显示"是否量化为具体的尺寸/定位参数？ [Gap]
- [ ] CHK003 悬停状态需求在所有交互元素间是否一致？ [Spec SS 4.1]
```

**禁止的检查项**（这些是实现测试，不属于 Checklist）：
```markdown
- [ ] 验证按钮点击是否正确  ← 禁止
- [ ] 测试错误处理是否工作  ← 禁止
- [ ] 确认 API 返回 200     ← 禁止
```

**关键规则**：
- 每个 Checklist 文件独立存储在 `checklists/` 目录，按领域命名（`ux.md`、`api.md`、`security.md`）
- 80%+ 检查项必须包含追踪引用（`[Spec SS X.Y]`、`[Gap]`、`[Ambiguity]`）
- 每个 Checklist 软上限 40 项
- `/speckit.implement` 执行前**强制检查所有 Checklist**——有未完成项则停止，需用户批准才能继续

#### Spec-First 现状

Spec-First 的 Gate 系统检查的是**产物是否存在**（spec.md 存在 → C1 通过），而非**产物质量是否达标**：
- `01_specify` 的 Gate 条件：spec.md 存在 + FR ID 已注册 → 通过
- 没有检查 spec.md 中的需求是否完整、是否有歧义、是否可测试
- `code-review` skill 审查代码质量，但没有对应的"spec-review"机制
- 追踪矩阵检查覆盖率（C1-C9），但不检查被覆盖的需求本身是否高质量

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 新增 `spec-review` skill，在 `01_specify` → `02_design` 的 Gate 中增加质量维度 |
| **具体做法** | 1) 新增 `spec-review` skill，按 Spec-Kit 的 10 类检查维度（完整性、清晰度、一致性、可测量性、覆盖度）生成 Checklist；2) Gate 条件新增 C10（Spec Quality Score），要求 ≥ 80% 检查项通过 |
| **复杂度** | 中 — 新增 1 个 skill + Gate 条件扩展，约 200-300 LOC |
| **风险** | 低 — 纯增量机制，不影响现有 Gate 逻辑 |

---

### 2. Constitution 语义化版本管理

**对应 Spec-Kit 机制**: `/speckit.constitution` 命令 — 项目宪法的语义版本控制 + 修订审计 + 合规门禁

**解决 Spec-First 问题**: Risk 2（Constitution 变更无追踪）+ Gap 7（项目原则漂移无感知）

#### Spec-Kit 做法

Spec-Kit 将 Constitution 视为项目的"建筑 DNA"，在命令模板中内置语义版本治理与一致性传播检查；下方修订日志表属于推荐实践（非默认必选字段）：

```markdown
# Project Constitution
**Version**: 2.1.1
**Ratified**: 2026-01-15
**Last Amended**: 2026-02-20

## Article 1: Library-First
Every feature starts as a standalone library...

## Amendment Log
| Version | Date | Article | Change | Rationale |
|---------|------|---------|--------|-----------|
| 2.1.1   | 2026-02-20 | Art.7 | 放宽 max projects 从 3 到 5 | 微服务拆分需要 |
| 2.1.0   | 2026-02-01 | Art.9 | 新增 Integration-First 条款 | 团队共识 |
```

**版本规则**：
- MAJOR：删除或根本性修改条款
- MINOR：新增条款或实质性修改
- PATCH：措辞澄清、格式调整

**合规门禁**：`/speckit.plan` 执行时自动检查设计方案是否违反 Constitution 条款，违反项必须在"Complexity Tracking"表中给出理由。

#### Spec-First 现状

Spec-First 在 `00_init` 阶段生成 `constitution.md`，但：
- 没有版本号，无法追踪变更历史
- 缺少结构化修订记录，不知道何时、为何修改了原则
- Gate 系统不检查 Constitution 合规性——设计方案可以悄悄违反项目原则
- 多个 Feature 共享同一个 Constitution，但没有变更传播机制

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 为 `constitution.md` 增加版本头 + 结构化修订记录；Gate 增加合规检查 |
| **具体做法** | 1) `constitution.md` 模板增加 `version`、`ratified`、`last_amended` 字段，并补充 `amendment history` 章节（推荐）；2) `02_design` 的 Gate 新增 C11（Constitution Compliance），检查 design.md 是否引用了 Constitution 条款 |
| **复杂度** | 低 — 模板修改 + Gate 条件扩展 |
| **风险** | 极低 — 向后兼容，旧 Constitution 视为 v1.0.0 |

---

### 3. 结构化歧义消解（Clarify Command）

**对应 Spec-Kit 机制**: `/speckit.clarify` — 10 类歧义分类法 + 最多 5 轮顺序提问 + 答案即时回写 spec

**解决 Spec-First 问题**: Gap 8（spec 中的歧义无系统性消解流程）+ Risk 1（AI 对模糊需求做假设而非提问）

#### Spec-Kit 做法

Spec-Kit 的 `/speckit.clarify` 不是自由提问，而是按**10 类歧义分类法**系统性扫描：

| # | 类别 | 典型歧义 |
|---|------|---------|
| 1 | 功能范围 | "支持导出"——导出什么格式？哪些数据？ |
| 2 | 数据模型 | "用户信息"——包含哪些字段？ |
| 3 | UX 流程 | "简单的注册流程"——几步？需要邮箱验证吗？ |
| 4 | 非功能属性 | "高性能"——具体延迟/吞吐量指标？ |
| 5 | 集成 | "对接支付"——哪个支付网关？ |
| 6 | 边界情况 | "处理异常"——哪些异常？如何处理？ |
| 7 | 约束 | "兼容主流浏览器"——具体哪些？版本？ |
| 8 | 术语 | "活跃用户"——定义是什么？ |
| 9 | 完成信号 | "功能完成"——验收标准是什么？ |
| 10 | 其他 | 不属于以上类别的歧义 |

**关键规则**：
- 最多 5 轮提问（防止无限追问）
- 每轮顺序提问（不一次性抛出所有问题）
- 每个问题附带推荐答案（降低用户决策负担）
- 答案**即时回写**到 spec.md 的对应章节（不是单独存储）
- 所有 Q&A 记录在 `## Clarifications` 章节，按 `### Session YYYY-MM-DD` 分组

#### Spec-First 现状

Spec-First 的 `spec` skill 在 P3_CONFIRM 阶段有用户确认，但：
- 没有系统性的歧义扫描——AI 自行判断哪些需要澄清
- 没有歧义分类法——遗漏哪类歧义完全靠 AI 的"直觉"
- 澄清结果不回写 spec.md——存在 findings.md 中，与 spec 脱节
- 没有提问轮次限制——可能过度追问或不够追问

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 在 `spec` skill 的 P2_GENERATE 和 P3_CONFIRM 之间插入歧义扫描步骤 |
| **具体做法** | 1) 定义 10 类歧义分类法（可复用 Spec-Kit 的分类）；2) P2 完成后按分类法扫描 spec.md，标记 `[NEEDS CLARIFICATION]`（最多 3 个）；3) P3 阶段逐一向用户确认，答案即时回写 spec.md |
| **复杂度** | 低 — 主要是 SKILL.md 的 Prompt 增强，约 100-150 行 |
| **风险** | 极低 — 纯增量，不影响现有 P0-P5 流程 |

---

### 4. 跨产物一致性分析（Analyze Command）

**对应 Spec-Kit 机制**: `/speckit.analyze` — 只读的跨产物一致性检查，6 类检测 + 4 级严重度

**解决 Spec-First 问题**: Gap 9（产物间一致性无自动检测）+ Risk 9（spec/design/task 三者脱节）

#### Spec-Kit 做法

`/speckit.analyze` 是一个**只读**的分析命令，不修改任何文件，只产出诊断报告。它执行 6 类检测：

| # | 检测类型 | 检测内容 |
|---|---------|---------|
| 1 | 重复检测 | spec/plan/tasks 中是否有语义重复的需求 |
| 2 | 歧义检测 | 是否存在模糊措辞（"适当的"、"合理的"、"等等"） |
| 3 | 欠规范检测 | 需求是否缺少可测量的验收标准 |
| 4 | Constitution 对齐 | 设计方案是否违反项目宪法条款 |
| 5 | 覆盖缺口 | 哪些需求没有对应的 task |
| 6 | 不一致检测 | spec 中说 A，plan 中说 B 的矛盾 |

每个发现标注 4 级严重度：`CRITICAL` / `HIGH` / `MEDIUM` / `LOW`，最多 50 个发现（超出部分汇总）。

#### Spec-First 现状

Spec-First 的追踪矩阵检查覆盖率（C1-C9），但：
- 只检查"有没有"（FR 是否有对应 DS），不检查"对不对"（DS 是否与 FR 一致）
- 没有语义级别的一致性检测——spec 说"支持 3 种格式"，design 只设计了 2 种，不会被发现
- `sync` skill 同步矩阵状态，但不做内容一致性分析

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 新增 `analyze` skill，在 `03_plan` Gate 前自动运行 |
| **具体做法** | 1) 新增只读 `analyze` skill，扫描 spec.md + design.md + task_plan.md 的语义一致性；2) 产出 `analysis-report.md`，按严重度排序；3) CRITICAL 级发现阻塞 Gate 推进 |
| **复杂度** | 中 — 新增 1 个 skill，约 200 行 SKILL.md |
| **风险** | 低 — 只读操作，不修改任何产物 |

---

### 5. 模板驱动的 LLM 行为约束

**对应 Spec-Kit 机制**: 模板系统中的显式约束指令 — "Focus on WHAT, avoid HOW" + 强制不确定性标记 + 自我修正上限

**解决 Spec-First 问题**: Risk 1（AI 在 spec 阶段过早引入实现细节）+ Risk 10（AI 对不确定内容编造而非标记）

#### Spec-Kit 做法

Spec-Kit 的模板不只是结构骨架，更是**LLM 行为约束器**。三个核心约束机制：

**约束 1：WHAT/HOW 分离**
```markdown
<!-- spec-template.md -->
Focus on WHAT the feature does and WHY it matters.
Do NOT include implementation details, technology choices, or HOW it will be built.
```
在 specify 阶段，AI 被明确禁止讨论技术方案。这防止了 LLM 最常见的失败模式：在需求阶段就开始设计数据库表结构。

**约束 2：强制不确定性标记**
```markdown
Mark unclear areas with [NEEDS CLARIFICATION] (maximum 3).
Prioritize: scope > security > UX > technical
```
AI 被要求**主动标记自己不确定的地方**，而非编造看似合理的内容。上限 3 个防止 AI 过度标记。

**约束 3：自我修正上限**
```markdown
Maximum 3 iterations of self-correction before presenting to user.
```
防止 AI 陷入无限自我修正循环。

#### Spec-First 现状

Spec-First 的 SKILL.md 有阶段指令，但缺少显式的 LLM 行为约束：
- `spec` skill 没有明确禁止 AI 在需求阶段讨论技术方案
- 没有强制不确定性标记机制——AI 倾向于编造完整内容而非标记不确定
- Phase Machine 的修订上限（max 5 rounds）控制的是用户-AI 交互轮次，不是 AI 自我修正

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 在 `spec`、`design`、`task` 三个核心 skill 的 SKILL.md 中增加显式约束指令 |
| **具体做法** | 1) `spec` skill 增加 "WHAT not HOW" 约束；2) 所有生成类 skill 增加 `[NEEDS CLARIFICATION]` 标记机制（上限 3）；3) P2_GENERATE 增加自我修正上限（max 3 iterations） |
| **复杂度** | 极低 — 纯 Prompt 修改，每个 skill 约 20-30 行 |
| **风险** | 极低 — 不涉及代码变更 |

---

### 6. 用户故事组织的任务分解

**对应 Spec-Kit 机制**: `/speckit.tasks` — 按用户故事（而非技术层）组织任务，支持 `[P]` 并行标记和 `[US#]` 故事标签

**解决 Spec-First 问题**: Gap 10（TASK 缺少并行性标注）+ Risk 11（任务按技术层组织导致无法独立交付）

#### Spec-Kit 做法

Spec-Kit 的任务分解以**用户故事**为组织单元，而非技术层：

```markdown
## Phase 3: User Stories

### US1 — Photo Album Management (P1)
- [X] T005 [P] [US1] Create Album model in src/models/album.py
- [X] T006 [P] [US1] Implement album CRUD API in src/api/albums.py
- [ ] T007 [US1] Add drag-and-drop reorder in src/components/AlbumGrid.vue

### US2 — Photo Tile Preview (P2)
- [ ] T008 [P] [US2] Create Photo model in src/models/photo.py
- [ ] T009 [US2] Implement tile layout in src/components/PhotoTile.vue
```

**关键标记**：
- `[P]` — 可并行执行（不依赖其他任务）
- `[US#]` — 所属用户故事（可独立交付和测试）
- Phase 分组 — Setup → Foundational → User Stories (P1/P2/P3) → Polish

**核心优势**：每个 US 是一个可独立交付的 MVP 增量，而非"先做完所有后端再做前端"。

#### Spec-First 现状

Spec-First 的 `task` skill 生成 TASK 条目，但：
- TASK 按 FR 映射组织，不按用户故事组织
- 没有并行性标记——所有 TASK 默认顺序执行
- 没有 Phase 分组——缺少 Setup/Foundational/Polish 的阶段划分

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在 `task` skill 的 SKILL.md 中增加并行标记和故事分组规则 |
| **具体做法** | 1) TASK 条目增加 `[P]` 并行标记；2) task_plan.md 按 Phase 分组；3) `orchestrate --auto` 模式识别 `[P]` 标记，并行调度可并行 TASK |
| **复杂度** | 低 — SKILL.md Prompt 修改 + task_plan.md 格式扩展 |
| **风险** | 低 — 向后兼容，无 `[P]` 标记的 TASK 默认顺序执行 |

---

### 7. Agent 无关架构（18+ Agent 支持）

**对应 Spec-Kit 机制**: `AGENT_CONFIG` 字典 + `--ai generic` 模式 + 多格式命令文件生成

**解决 Spec-First 问题**: Risk 5（单宿主依赖）+ Gap 11（无法在 Cursor/Gemini/Copilot 等环境使用）

#### Spec-Kit 做法

Spec-Kit 通过一个统一的 `AGENT_CONFIG` 字典支持 18+ AI 编码 Agent：

```python
AGENT_CONFIG = {
    "claude": {"folder": ".claude/commands", "requires_cli": True},
    "gemini": {"folder": ".gemini/commands", "format": "toml"},
    "cursor": {"folder": ".cursor/commands", "format": "markdown"},
    "copilot": {"folder": ".github/copilot/commands", "format": "chat-mode"},
    "generic": {"folder": "{custom}", "requires_cli": False},
    # ... 18+ agents
}
```

**核心设计**：
- 同一套命令逻辑，按 Agent 格式自动转换（Markdown / TOML / Chat Mode）
- `--ai generic --ai-commands-dir <path>` 支持任意未知 Agent
- `update-agent-context.sh` 自动检测已配置的 Agent，同步更新所有 Agent 的上下文文件
- 手动添加的内容通过 `<!-- MANUAL ADDITIONS -->` 标记保护，不被覆盖

#### Spec-First 现状

Spec-First 已支持 Claude Code + Codex，但仍缺 generic 抽象：
- 安装路径由 `detectHostPaths` 动态探测（支持环境变量覆盖），默认落到 `~/.claude` / `~/.codex`
- 命令/Skill 产物仍以 Claude/Codex 两种宿主格式为主
- 没有 generic 模式支持任意 Agent

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 抽象 Agent 配置层，支持多 Agent 安装 |
| **具体做法** | 1) 新增 `agent-config.ts`，定义各 Agent 的目录结构和命令格式；2) 在 `spec-first setup` 增加 `--host`（或等价参数）声明目标 Agent；3) SKILL.md 保持不变（Markdown 是最大公约数），安装脚本负责格式转换 |
| **复杂度** | 中 — 约 300-400 LOC 的 Agent 适配层 |
| **风险** | 低 — 不影响现有 Claude Code 用户 |

---

### 8. V-Model 四层配对追踪体系

**对应 Spec-Kit 机制**: V-Model Extension Pack — 四层设计/测试配对 + 四矩阵双向追踪 + IEEE/ISO 合规

**解决 Spec-First 问题**: Gap 12（追踪矩阵只有单层映射）+ Risk 12（设计层级间的追踪断裂）

#### Spec-Kit V-Model 做法

V-Model Extension 定义了**四层配对**的设计-测试对称结构：

```
需求分析 (REQ-NNN)  ←→  验收测试 (ATP-NNN-X / SCN-NNN-X#)    矩阵 A
系统设计 (SYS-NNN)  ←→  系统测试 (STP-NNN-X / STS-NNN-X#)    矩阵 B
架构设计 (ARCH-NNN) ←→  集成测试 (ITP-NNN-X / ITS-NNN-X#)    矩阵 C
模块设计 (MOD-NNN)  ←→  单元测试 (UTP-NNN-X / UTS-NNN-X#)    矩阵 D
```

每层都有独立的**双向追踪矩阵**：
- **正向追踪**（设计 → 测试）：检测未测试的设计元素
- **反向追踪**（测试 → 设计）：检测孤立的测试用例

四矩阵渐进构建：阶段 3 构建矩阵 A，阶段 6 构建 A+B，阶段 9 构建 A+B+C，阶段 12 构建完整 A+B+C+D。

#### Spec-First 现状

Spec-First 的追踪矩阵是**单层扁平结构**：
- FR → DS → TASK → TC 是线性链，不区分系统/架构/模块层级
- 没有设计-测试的对称配对概念
- C1（Design Coverage）只检查 FR→DS 映射，不检查 DS 内部的层级覆盖

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 作为 Layer 2 平台规则的可选扩展 |
| **具体做法** | 1) 新增 `layer2/v-model.yaml` 平台规则，定义四层 ID 体系和配对关系；2) 追踪矩阵引擎增加多层支持；3) 仅在 `mode=N` + `size=L` 的 Feature 中启用 |
| **复杂度** | 高 — 需要扩展 trace-engine，约 500-800 LOC |
| **风险** | 中 — 仅作为可选扩展，不影响默认流程 |

---

### 9. 扩展系统（Extension System）

**对应 Spec-Kit 机制**: Extension System（RFC 起步，已有实现）— 第三方扩展包 + 生命周期钩子 + 命名空间隔离

**解决 Spec-First 问题**: Gap 13（无法让社区贡献方法论扩展）+ Risk 13（核心膨胀风险）

#### Spec-Kit 做法

Spec-Kit 已具备可用的模块化扩展架构骨架（仍在快速演进）：

```yaml
# extension.yml
name: v-model
version: 1.0.0
commands:
  - speckit.v-model.requirements
  - speckit.v-model.system-design
hooks:
  - event: after_tasks
    command: speckit.v-model.trace
    optional: false
```

**核心设计**：
- 扩展安装到 `.specify/extensions/` 目录
- 命令命名空间隔离：`speckit.{ext-id}.{cmd}`
- 生命周期钩子：`after_tasks`、`after_implement` 等
- 社区扩展目录：V-Model、Cleanup 等已有实例

#### Spec-First 现状

Spec-First 的 Layer 2 平台规则（`layer2/*.yaml`）提供了一定的可扩展性，但：
- Layer 2 只能扩展 Gate 条件和交付物，不能新增 Skill 或命令
- 没有社区贡献机制——所有扩展必须内置
- 核心 19 个 Skill 全部打包在一起，无法按需加载

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 将 Layer 2 升级为完整的扩展系统 |
| **具体做法** | 1) 定义扩展清单格式（`extension.yaml`）；2) 扩展可包含：额外 Skill + Layer 2 规则 + 生命周期钩子；3) 安装到 `.spec-first/extensions/` |
| **复杂度** | 高 — 需要设计扩展加载器和命名空间隔离 |
| **风险** | 中 — 需要仔细设计 API 边界，避免扩展破坏核心流程 |

---

### 10. Agent 上下文自动同步

**对应 Spec-Kit 机制**: `update-agent-context.sh` — 从 plan.md 提取技术栈，自动更新所有 Agent 上下文文件

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定）+ Gap 14（Agent 上下文与项目状态脱节）

#### Spec-Kit 做法

每次 `/speckit.plan` 执行后，`update-agent-context.sh` 自动：

1. 解析 plan.md，提取技术栈（语言、框架、数据库、项目类型）
2. 生成语言特定的构建/测试命令
3. 更新所有已配置 Agent 的上下文文件（CLAUDE.md、GEMINI.md 等）
4. 保护手动添加的内容（`<!-- MANUAL ADDITIONS START/END -->` 标记区间不被覆盖）

**核心价值**：Agent 的上下文文件始终反映项目最新状态，无需手动维护。

#### Spec-First 现状

Spec-First 的 Context Pack 系统（`context-pack.ts`）在每次 skill 调用时动态构建上下文，但：
- 不更新持久化的 Agent 上下文文件
- 没有从 design.md 自动提取技术栈的机制
- 新 session 启动时依赖 `catchup` skill 恢复上下文，而非读取持久化文件

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | `design` skill 的 P5_SIDE_EFFECT 阶段自动更新 Agent 上下文文件 |
| **具体做法** | 1) 从 design.md 提取技术栈信息；2) 更新 `.claude/CLAUDE.md`（或对应 Agent 文件）中的项目上下文段；3) 使用标记区间保护手动内容 |
| **复杂度** | 低 — 约 150-200 LOC 的脚本 |
| **风险** | 极低 — 纯增量，不影响现有 Context Pack 机制 |

---

### 11. Handoff 接力机制

**对应 Spec-Kit 机制**: 命令 YAML 中的 `handoffs` 字段 — 完成当前命令后自动建议下一步操作

**解决 Spec-First 问题**: Gap 15（skill 间缺少自动衔接提示）+ Risk 14（用户不知道下一步该调用哪个 skill）

#### Spec-Kit 做法

每个命令的 YAML 头部声明完成后的"接力"建议：

```yaml
# specify.md
handoffs:
  - label: Clarify Requirements
    agent: speckit.clarify
    prompt: Scan for ambiguities
    send: true
  - label: Create Plan
    agent: speckit.plan
    prompt: Create technical plan
    send: true
```

在支持 Handoff UI 的 Agent 中（如 Copilot Chat Mode），完成 `/speckit.specify` 后会自动显示"Clarify Requirements"和"Create Plan"按钮，用户一键即可进入下一步。

#### Spec-First 现状

Spec-First 的 `orchestrate` skill 自动编排 plan → skill → verify → advance，但：
- 单独调用 skill 时（如 `/spec-first:spec`），完成后没有下一步提示
- 用户需要记住阶段顺序和对应 skill 名称
- `AGENTS.md` 中有阶段-skill 映射表，但需要用户主动查阅

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在每个 skill 的 P5_SIDE_EFFECT 阶段输出下一步建议 |
| **具体做法** | 1) 每个 SKILL.md 末尾增加 `## Next Steps` 段，声明完成后的建议操作；2) P5 阶段自动输出"建议下一步：/spec-first:XXX" |
| **复杂度** | 极低 — 纯 SKILL.md 修改 |
| **风险** | 极低 — 信息性输出，不影响流程 |

---

### 12. 前缀匹配的 Feature 目录定位

**对应 Spec-Kit 机制**: `common.sh` 中的数字前缀匹配 — `004-*` 而非精确分支名匹配

**解决 Spec-First 问题**: Risk 15（Feature 目录定位脆弱）

#### Spec-Kit 做法

Spec-Kit 的 `common.sh` 使用**数字前缀匹配**定位 Feature 目录：

```bash
# 从分支名 "004-photo-albums" 提取前缀 "004"
# 然后在 specs/ 下匹配 "004-*" 目录
FEATURE_DIR=$(find specs/ -maxdepth 1 -name "${PREFIX}-*" -type d)
```

**优势**：
- 多个分支可以共享同一个 spec 目录（如 `004-photo-albums` 和 `004-photo-albums-fix`）
- 支持 `SPECIFY_FEATURE` 环境变量覆盖（非 Git 环境也能工作）
- 分支重命名不影响 spec 目录定位

#### Spec-First 现状

Spec-First 使用 `featureId`（如 `FSREQ-20260209-AUTH-001`）精确匹配 `specs/` 下的目录：
- `.spec-first/current` 文件存储当前 Feature ID
- `feature.ts` 通过精确路径 `specs/{featureId}/` 定位
- 如果 ID 或目录名有任何不匹配，定位失败

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 增加模糊匹配降级策略 |
| **具体做法** | `feature.ts` 的目录定位增加降级链：精确匹配 → 前缀匹配 → 环境变量覆盖 |
| **复杂度** | 极低 — 约 20-30 LOC |
| **风险** | 极低 — 精确匹配优先，降级仅在精确匹配失败时触发 |

---

## 总结映射表

| # | Spec-Kit 机制 | Spec-First Gap/Risk | 优先级 | 复杂度 | 落地层 |
|---|-------------|---------------------|--------|--------|--------|
| 1 | "英语单元测试"式 Checklist | Gap 2 + Risk 1 | **P1** | 中 | 新增 spec-review skill |
| 2 | Constitution 语义版本管理 | Risk 2 + Gap 7 | P2 | 低 | constitution 模板 + Gate |
| 3 | 结构化歧义消解（Clarify） | Gap 8 + Risk 1 | **P1** | 低 | spec skill Prompt |
| 4 | 跨产物一致性分析（Analyze） | Gap 9 + Risk 9 | P2 | 中 | 新增 analyze skill |
| 5 | 模板驱动 LLM 行为约束 | Risk 1 + Risk 10 | **P1** | 极低 | 核心 SKILL.md Prompt |
| 6 | 用户故事组织的任务分解 | Gap 10 + Risk 11 | P2 | 低 | task skill Prompt |
| 7 | Agent 无关架构（18+ Agent） | Risk 5 + Gap 11 | P2 | 中 | 新增 agent-config 层 |
| 8 | V-Model 四层配对追踪 | Gap 12 + Risk 12 | P3 | 高 | Layer 2 扩展 |
| 9 | 扩展系统（Extension System） | Gap 13 + Risk 13 | P3 | 高 | 架构层 |
| 10 | Agent 上下文自动同步 | Risk 3 + Gap 14 | P2 | 低 | design skill 副作用 |
| 11 | Handoff 接力机制 | Gap 15 + Risk 14 | P2 | 极低 | SKILL.md 末尾 |
| 12 | 前缀匹配 Feature 定位 | Risk 15 | P3 | 极低 | feature.ts |

---

## 不适用 / 无需借鉴的部分

以下 Spec-Kit 机制对 Spec-First 不适用或已有更好的替代方案：

| Spec-Kit 机制 | 不借鉴原因 |
|--------------|-----------|
| **Python CLI（Typer + Rich）** | Spec-First 已有成熟的 TypeScript CLI，迁移无收益 |
| **Bash/PowerShell 双脚本** | Spec-First 通过 TypeScript 跨平台，不需要维护两套脚本 |
| **`/speckit.taskstoissues`** | Spec-First 的 TASK 体系比 GitHub Issues 更丰富（有状态机、追踪矩阵），转 Issue 会丢失信息 |
| **线性 6 步管线** | Spec-First 的 8+2 阶段 + Gate 远比 Spec-Kit 的线性管线完备，无需降级 |
| **无 Gate 的自由推进** | Spec-Kit 没有 Gate 门禁，阶段推进靠用户自觉；Spec-First 的 Gate 系统是核心优势 |
| **无变更管理** | Spec-Kit 没有 RFC/Defect 机制；Spec-First 的 change-mgr 模块已覆盖 |
| **无覆盖率度量** | Spec-Kit 没有 C1-C9 覆盖率体系；Spec-First 的 trace-engine 已覆盖 |
| **无健康评分** | Spec-Kit 没有 H1 健康评分；Spec-First 的 metrics-engine 已覆盖 |
| **`SPECIFY_FEATURE` 环境变量** | Spec-First 的 `.spec-first/current` 文件 + `feature-switch` skill 已提供更好的 Feature 切换机制 |

---

## 落地建议

### 第一阶段：P1 快速收益（1-2 周）

聚焦 3 个低复杂度、高收益的机制，立即提升 Spec-First 的规范质量保障能力：

**1. 模板驱动 LLM 行为约束（要素 5）** — 最小改动，最大防御
- 在 `spec` skill 增加 "WHAT not HOW" 约束
- 所有生成类 skill 增加 `[NEEDS CLARIFICATION]` 标记机制
- P2_GENERATE 增加自我修正上限（max 3）
- 预计工作量：1 天

**2. 结构化歧义消解（要素 3）** — 从根源提升 spec 质量
- 定义 10 类歧义分类法
- `spec` skill 的 P2→P3 之间插入歧义扫描
- 答案即时回写 spec.md
- 预计工作量：1-2 天

**3. "英语单元测试"式 Checklist（要素 1）** — 补齐规范质量门禁
- 新增 `spec-review` skill
- Gate 条件新增 C10（Spec Quality Score）
- 预计工作量：2-3 天

### 第二阶段：P2 核心增强（3-4 周）

聚焦跨产物一致性和多 Agent 支持：

**4. 跨产物一致性分析（要素 4）** — 检测 spec/design/task 脱节
- 新增只读 `analyze` skill
- CRITICAL 级发现阻塞 Gate
- 预计工作量：2-3 天

**5. Constitution 语义版本管理（要素 2）** — 追踪原则演进
- constitution.md 增加版本头 + 修订日志
- Gate 增加 Constitution Compliance 检查
- 预计工作量：1-2 天

**6. 用户故事组织的任务分解（要素 6）** — 支持并行和独立交付
- TASK 增加 `[P]` 并行标记
- task_plan.md 按 Phase 分组
- 预计工作量：1 天

**7. Agent 无关架构（要素 7）** — 扩大用户覆盖面
- 新增 agent-config 适配层
- 在 `spec-first setup` 增加 `--host`（或等价参数）
- 预计工作量：3-4 天

**8. Agent 上下文自动同步（要素 10）** — 保持上下文新鲜
- design skill 的 P5 阶段自动更新 Agent 上下文文件
- 预计工作量：1-2 天

**9. Handoff 接力机制（要素 11）** — 降低用户学习成本
- 每个 SKILL.md 末尾增加 Next Steps 建议
- 预计工作量：0.5 天

### 第三阶段：P3 远期演进（按需）

以下机制在当前版本中预埋接口，待生态成熟后激活：

- **V-Model 四层配对追踪（要素 8）**：作为 `layer2/v-model.yaml` 可选扩展，仅 `mode=N` + `size=L` 启用
- **扩展系统（要素 9）**：将 Layer 2 升级为完整扩展架构，支持社区贡献
- **前缀匹配 Feature 定位（要素 12）**：`feature.ts` 增加降级匹配链

---

## 附录：Spec-Kit 项目关键数据

| 指标 | 数值 |
|------|------|
| 核心命令 | 8 个（+ 1 工具命令） |
| 支持 Agent | 18+（含 generic 模式） |
| 模板文件 | 6 个核心模板 |
| Shell 脚本 | 5 × 2（Bash + PowerShell） |
| V-Model 扩展命令 | 12 步工作流 |
| V-Model ID 类型 | 16 种（4 层 × 4 类型） |
| 追踪矩阵 | 4 个（A/B/C/D） |
| 歧义分类 | 10 类 |
| Checklist 追踪率要求 | ≥ 80% |
| 许可证 | MIT |

---

> **结论**：Spec-Kit 与 Spec-First 是**同赛道、不同侧重**的关系。Spec-Kit 擅长"让规范文档本身高质量"（Checklist 验证需求质量、Clarify 消解歧义、Analyze 检测一致性），Spec-First 擅长"让流程执行有纪律"（Gate 门禁、覆盖率度量、变更管理）。借鉴 Spec-Kit 的规范质量工程（"英语单元测试"、结构化歧义消解、LLM 行为约束），可以显著提升 Spec-First 从"流程完备"到"规范高质量"的关键一环——**好的流程 + 差的规范 = 差的交付**。
