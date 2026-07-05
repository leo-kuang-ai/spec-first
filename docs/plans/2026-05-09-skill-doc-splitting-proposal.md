---
title: "技术方案：精简 Skill 文档，分离核心流程与参考细节"
type: archive
status: superseded
created: 2026-05-09
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# 技术方案：精简 Skill 文档，分离核心流程与参考细节

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

Created: 2026-05-09

## 问题陈述

当前 5 个 skill 的 SKILL.md 超过 600 行：

| Skill | 行数 | 已有 references/ |
|-------|------|-----------------|
| spec-code-review | 958 | 9 个文件 |
| spec-optimize | 686 | 7 个文件 |
| spec-plan | 672 | 6 个文件 |
| spec-mcp-setup | 645 | 2 个文件 |
| spec-compound-refresh | 630 | 3 个文件 |

全部 40 个 skill 合计 12,053 行，平均约 301 行/skill。超长 SKILL.md 带来三个问题：

1. **单次执行 prompt 过长**：Claude Code 和 Codex 在用户调用 skill 时（`spec-xxx`）加载完整 SKILL.md 作为执行 prompt。大量边界条件和子阶段描述占用 context window，核心意图被稀释。注意：skill 是按需加载而非会话启动时全部加载，所以收益体现在"每次调用时 LLM 需要处理的 prompt 长度减少"，而非"启动时 token 节省"
2. **执行精度下降**：关键判断点淹没在细节中，LLM 更容易遗漏核心流程步骤
3. **维护成本高**：单文件 960 行的 prose 难以 review、难以定位变更影响面

## 现有基础设施

项目已有成熟的 `references/` 模式：

- **23 个 skill** 已使用 `references/` 子目录存放详细内容
- **加载机制**：SKILL.md 中通过 `read \`references/xxx.md\`` 指令按需加载
- **运行时同步**：`src/cli/plugin.js` 的 `copyDirectoryWithTransform()` 递归复制整个 skill 目录（含 references/）到宿主 runtime。Claude 的 standalone/internal skills 位于 `.claude/skills/`，command-backed workflow skill copies 位于 `.claude/spec-first/workflows/`；Codex 的 workflow、standalone 和 internal skills 位于 `.agents/skills/`
- **无需代码改动**：references/ 文件自动包含在 runtime generation 中
- **治理无冲突**：`lint-skill-entrypoints.js` 不限制子目录结构

## 设计原则

1. **SKILL.md 是入口和路由器**，不是完整规范。保留核心流程骨架、关键判断点、phase 间路由逻辑
2. **references/ 是按需加载的详细规范**。只在执行到对应 phase 时才读取
3. **拆分粒度按"执行时机"划分**，不按"主题"划分。同一 phase 内的内容保持在一个 reference 文件中
4. **保持向后兼容**：不改变 skill 的外部行为，只改变内部组织方式
5. **渐进式迁移**：按优先级逐个 skill 处理，每次迁移后验证 runtime generation 正确
6. **路由判断不外推**：决定后续所有行为的判断点（phase 路由、mode detection、domain classification）必须保留在 SKILL.md 内联，不能为追求行数目标而推到 reference 文件中。只有判断完成后的详细执行步骤才适合提取

## 目标行数

| 类别 | 目标 | 说明 |
|------|------|------|
| SKILL.md（复杂 workflow skill） | 300-450 行 | 含完整路由逻辑和核心约束 |
| SKILL.md（中等 skill） | 150-300 行 | 含完整执行流程骨架 |
| 单个 reference 文件 | 50-250 行 | 不低于 50 行（避免过度拆分） |

阈值说明：
- **迁移触发线**：600 行。超过此行数的 skill 应进行拆分
- **监控预警线**：500 行。CI 中对超过此行数的 SKILL.md 发出 WARN，提醒关注但不强制迁移

## 拆分策略

### 通用拆分模式

SKILL.md 保留：
- YAML frontmatter
- 一段话的 Introduction / When to Use
- Context Orientation Anchor（精简到 3-5 行核心规则）
- Phase 概览表（表格形式，每 phase 一行）
- 每个 Phase 的入口判断逻辑和路由规则（5-15 行）
- Phase 间的 handoff 条件
- 关键约束和 anti-pattern（不超过 10 条）

提取到 references/：
- Phase 内部的详细执行步骤
- 边界条件和 fallback 逻辑
- 子阶段的完整规范
- 模板和 schema
- 示例和 pattern catalog
- 工具集成的详细配置

### 拆分边界判断规则

在决定某段内容是保留在 SKILL.md 还是提取到 reference 时，使用以下判断规则：

| 内容类型 | 保留/提取 | 理由 |
|----------|-----------|------|
| Phase 路由判断（domain classification、depth assessment） | **保留** | 决定后续所有行为，不能延迟加载 |
| Mode detection 核心约束（如 headless 不切换 checkout） | **保留** | 在 Stage 1 之前就需要，影响全局行为 |
| Phase 概览表和 handoff 条件 | **保留** | LLM 需要全局视图来规划执行 |
| 关键 anti-pattern（不超过 10 条） | **保留** | 高频违反的规则必须始终可见 |
| Phase 内部的详细执行步骤 | **提取** | 只在执行到该 phase 时才需要 |
| 边界条件和 fallback 逻辑 | **提取** | 条件触发，非每次执行都需要 |
| Shell 脚本和命令序列 | **提取** | 占行数多，执行时才需要 |
| 模板、schema、pattern catalog | **提取** | 参考性内容，按需查阅 |

### 具体拆分方案

#### spec-plan（672 → ~400 行）

当前 SKILL.md 已经引用了 5 个 reference 文件，但 Phase 0（Resume/Source/Scope）和 Phase 1（Gather Context）仍然完整内联。

**保留在 SKILL.md 的路由判断（不可提取）：**
- Phase 0.1 resume intent detection（deepen fast path 判断）
- Phase 0.1b domain classification（software vs non-software 路由）
- Phase 0.4 planning bootstrap 的复杂度评估和 handoff 判断
- Phase 0.6 depth assessment（Lightweight/Standard/Deep）
- Phase 0.7 solo-mode scope summary 的触发条件（4 个 guard）
- Phase 1.2 external research 的 skip/proceed 判断逻辑

**新增提取（只提取路由判断完成后的详细执行步骤）：**

| 提取内容 | 目标文件 | 预估行数 |
|----------|----------|----------|
| Phase 0.2-0.5 requirements doc 查找、source doc 消费、blocking question 处理 | `references/scope-and-resume.md` | ~150 |
| Phase 1.1/1.3/1.4 研究 agent 调度细节、整合规范、Slack context 规则 | `references/research-dispatch.md` | ~150 |
| Phase 1.1a Graph Readiness 完整规范（artifact 检查、MCP fallback、plan block 模板） | `references/graph-readiness.md` | ~80 |
| Phase 4 Plan Structure 模板和格式规范（frontmatter、implementation unit 格式） | `references/plan-structure.md` | ~100 |

SKILL.md 保留的骨架：

```markdown
---
frontmatter...
---
# Create Technical Plan
[Introduction: 10 行]

## Core Principles [8 条，每条 1 行]

## Workflow Overview
| Phase | Purpose | Reference |
|-------|---------|-----------|
| 0 | Resume, Source, Scope | inline routing + `references/scope-and-resume.md` |
| 1 | Gather Context | inline decisions + `references/research-dispatch.md` |
| 2-4 | Structure Plan | inline + `references/plan-structure.md` |
| 5 | Review & Handoff | `references/plan-handoff.md` |

## Phase 0: Resume, Source, and Scope
[0.1 resume intent detection: 15 行 — 内联]
[0.1b domain classification: 10 行 — 内联]
[0.4 complexity assessment + handoff: 15 行 — 内联]
[0.6 depth assessment: 8 行 — 内联]
[0.7 solo-mode trigger guards: 5 行 — 内联]
**For Phase 0.2-0.5 execution (requirements doc, source doc, blocking questions),
read `references/scope-and-resume.md`.**

## Phase 1: Gather Context
[1.2 external research skip/proceed decision: 20 行 — 内联]
**For research agent dispatch and consolidation, read `references/research-dispatch.md`.**
**For graph readiness evaluation, read `references/graph-readiness.md`.**

## Phases 2-4: Structure the Plan
[核心规则: 50 行 — 内联]
**For plan document template and format, read `references/plan-structure.md`.**

## Phase 5: Final Review and Handoff
[Gate 判断：15 行 — 内联]
**Load `references/plan-handoff.md` for execution.**
```

#### spec-code-review（958 → ~350 行）

当前已有 9 个 reference 文件，但 Mode Detection、Severity Scale、Reviewer Selection、Stage 1-6 的大量内容仍然内联。

**保留在 SKILL.md 的路由判断（不可提取）：**
- Mode Detection 表格（4 种 mode 的触发条件）
- 每种 mode 的核心约束（各 1-2 行）：
  - headless: 不切换 checkout、不交互、单 pass
  - report-only: 不写文件、不切换 checkout
  - autofix: 不交互、只 safe_auto、不 commit
  - interactive: pre-load question tool
- Argument Parsing 表格
- Severity Scale 表格
- Reviewer 选择表格（always-on + conditional）
- Quick Review Short-Circuit 判断逻辑
- Conflicting mode flags 处理

**新增提取（只提取判断完成后的详细执行规范）：**

| 提取内容 | 目标文件 | 预估行数 |
|----------|----------|----------|
| 每种 mode 的完整规则（error envelope 格式、bounded re-review、residual work 格式等） | `references/mode-rules.md` | ~150 |
| Stage 1 scope detection 完整 shell 脚本（PR/branch/standalone 三条路径） | `references/diff-scope.md`（已存在，扩充） | ~200 |
| After-Review routing 完整选项树（Step 2 的 A/B/C/D 分支、fixer dispatch、failure handling） | `references/after-review-routing.md` | ~120 |

SKILL.md 保留的骨架：

```markdown
---
frontmatter...
---
# Code Review
[Introduction + When to Use: 15 行]

## Argument Parsing [表格: 10 行]

## Mode Detection
| Mode | When | Core constraint |
[4 行表格 + 每种 mode 1-2 行核心约束 = 20 行 — 内联]
**For full mode rules (error envelopes, re-review bounds, residual formats),
read `references/mode-rules.md`.**

## Severity Scale [表格: 10 行]
## Action Routing [表格 + 路由规则: 15 行]
## Reviewers [always-on + conditional 表格: 40 行]

## How to Run
### Stage 1: Determine scope
[入口判断 + base: fast path: 20 行 — 内联]
**For full scope detection (PR checkout, branch detection, shell scripts),
read `references/diff-scope.md`.**

### Stage 2: Intent and context [20 行 — 内联]
### Stage 3: Select and dispatch reviewers [30 行 — 内联]
### Stage 4-5: Merge, deduplicate, present [30 行 — 内联]
### Stage 6: After-Review routing
[路由表格 + 触发条件: 15 行 — 内联]
**For routing option tree and fixer dispatch, read `references/after-review-routing.md`.**
```

#### spec-compound-refresh（630 → ~300 行）

| 提取内容 | 目标文件 | 预估行数 |
|----------|----------|----------|
| 完整的 refresh pipeline 步骤 | `references/refresh-pipeline.md` | ~200 |
| YAML schema 规则和验证逻辑 | `references/yaml-schema.md`（已存在，扩充） | ~100 |

#### spec-optimize（686 → ~300 行）

| 提取内容 | 目标文件 | 预估行数 |
|----------|----------|----------|
| Experiment execution 完整流程 | `references/experiment-execution.md` | ~200 |
| Judge prompt 构建和评估逻辑 | `references/judge-evaluation.md` | ~100 |

#### spec-mcp-setup（645 → ~300 行）

| 提取内容 | 目标文件 | 预估行数 |
|----------|----------|----------|
| 各 MCP tool 的详细配置和验证步骤 | `references/tool-verification.md` | ~200 |
| Troubleshooting 和 fallback 逻辑 | `references/troubleshooting.md` | ~100 |

## SKILL.md 中的引用模式

统一使用以下两种引用模式：

### 模式 A：延迟加载（推荐）

用于执行到特定 phase 时才需要的详细内容：

```markdown
**STOP. Before executing Phase X, read `references/xxx.md`.**
The [具体内容列表] all live there.
```

这是项目已有的成熟模式（spec-plan、spec-brainstorm、spec-work 均使用）。

### 模式 B：条件加载

用于只在特定条件下才需要的内容：

```markdown
If [condition], read `references/xxx.md` and follow that workflow instead.
```

已有示例：`spec-plan` 的 universal-planning.md 路由。

### 不使用的模式

- ❌ 不在 SKILL.md 开头一次性列出所有 reference 文件
- ❌ 不使用 `#include` 或其他预处理指令（不存在此机制）
- ❌ 不把 reference 文件当作独立 skill（它们没有 frontmatter，不可独立调用）

## Reference 文件内部结构规范

每个 reference 文件必须遵循以下模板：

```markdown
<!-- Context: Loaded by {skill-name}/SKILL.md during {Phase/Stage}. -->
<!-- Prerequisite: {前置条件，如 "Phase 0 routing completed, mode determined"}. -->
<!-- Returns to: {执行完后回到 SKILL.md 的哪个位置}. -->

# {描述性标题}

{详细内容...}
```

规则：
- 前 3 行 HTML 注释提供 context anchor，帮助 LLM 理解当前执行位置
- `Context` 说明谁加载了这个文件、在什么时机
- `Prerequisite` 说明执行到这里时哪些状态已经确定
- `Returns to` 说明执行完后应该回到 SKILL.md 的哪个 phase/stage 继续
- 文件内容不重复 SKILL.md 中已有的路由判断逻辑
- 文件内容可以引用同目录下的其他 reference 文件（但避免循环引用）

## 迁移步骤

### 每个 Skill 的迁移流程

1. **分析当前结构**：标记每段内容的"执行时机"（启动时 / Phase N 时 / 条件触发时）
2. **划分保留 vs 提取**：启动时必须的内容保留；Phase 内详细步骤提取
3. **创建 reference 文件**：将提取内容写入 `references/` 下的新文件
4. **更新 SKILL.md**：用引用指令替换被提取的内容，保留 1-2 行摘要说明该 reference 的职责
5. **验证 runtime generation**：运行 `spec-first init --claude` 确认文件正确复制
6. **验证 lint**：运行 `npm run lint:skill-entrypoints` 确认无治理违规
7. **验证行为**：在新会话中调用该 skill，确认核心流程不受影响

### 优先级排序

| 优先级 | Skill | 理由 |
|--------|-------|------|
| P0 | spec-code-review | 当前最长（958 行），已有 9 个 reference 文件证明模式成熟 |
| P0 | spec-plan | 使用频率最高，已有 reference 模式可扩展，仍超过 600 行 |
| P1 | spec-optimize | 686 行，实验流程可清晰分离 |
| P1 | spec-compound-refresh | 630 行，相对独立，迁移风险低 |
| P2 | spec-mcp-setup | 645 行，工具配置内容天然适合提取 |

## 验证策略

### 自动化验证

```bash
# 1. Runtime generation 完整性
spec-first init --claude --dry-run
spec-first init --codex --dry-run

# 2. Skill 治理
npm run lint:skill-entrypoints

# 3. 行数检查（可加入 CI）
find skills -name "SKILL.md" -exec wc -l {} \; | awk '$1 > 500 {print "WARN: " $0}'
```

### 手动验证

- 在新 Claude Code 会话中调用迁移后的 skill，确认：
  - 核心流程正常执行
  - reference 文件在需要时被正确读取
  - 不出现"找不到文件"错误
- 在 Codex 中重复上述验证

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM 不读取 reference 文件 | 跳过详细步骤 | 使用 **STOP** 强指令模式；保留关键判断点在 SKILL.md；reference 文件开头的 context anchor 提供执行位置感知 |
| 拆分后上下文断裂 | LLM 在 reference 中丢失全局状态 | 每个 reference 文件开头包含 context/prerequisite/returns-to 三行 anchor |
| Runtime 复制遗漏 | reference 文件未到达宿主 | 迁移后必须验证 `spec-first init --dry-run`；CI 中增加 reference 文件存在性检查 |
| 过度拆分 | 频繁文件切换降低效率 | 单个 reference 不低于 50 行；同 phase 内容不拆分 |
| 路由判断被误提取 | LLM 需要先读 reference 才能做路由决策，增加延迟和遗漏风险 | 设计原则第 6 条明确禁止；拆分边界判断规则表格提供具体指导 |
| 迁移后执行质量下降 | 某个 skill 的核心流程出现回归 | 依赖当前工作分支和提交历史回滚；可选 tag 只用于大型迁移批次，不作为默认强制步骤 |

## 回滚策略

每个 skill 迁移前：
1. 确认当前工作分支、diff scope 和最新提交点，确保迁移只触碰该 skill 的 source、reference、tests 和必要文档
2. 迁移后进入验证期，期间在实际工作中使用迁移后的 skill
3. 如果验证期内发现执行质量明显下降（LLM 频繁跳过 reference、核心流程出错）：
   - 用 git 提交历史或分支差异回滚对应 `skills/{skill-name}/`、tests 与文档改动
   - 重新运行 `spec-first init --claude|--codex` 恢复 runtime projection
4. 对跨多个大型 skill 的迁移批次，可以在开始前创建临时 tag 作为额外定位点；单 skill 迁移不强制打 tag

## 不做的事情

- 不改变 `src/cli/plugin.js` 的复制逻辑（已满足需求）
- 不引入新的文件格式或预处理机制
- 不改变 skill 的外部调用接口
- 不改变 `lint-skill-entrypoints` 的治理规则
- 不一次性迁移所有 skill（渐进式，按优先级）
- 不对 600 行以下的 skill 做拆分（收益不足以覆盖迁移成本）

## 预期收益

| 指标 | 当前 | 目标 |
|------|------|------|
| 最大 SKILL.md 行数 | 958 | ≤450 |
| 超 600 行的 skill 数 | 5 | 0 |
| 单次调用时 prompt 长度（top-5 skill 平均） | ~780 行全量加载 | ~350 行骨架 + 按需加载 reference（减少初始 prompt 约 55%） |
| 核心流程可见性 | 淹没在细节中 | 一屏可见完整 phase 路由和关键判断点 |
| 变更影响面定位 | 需要在 960 行中搜索 | reference 文件按职责隔离，变更范围明确 |

## 实施工作量估算

| 阶段 | 工作量 | 产出 |
|------|--------|------|
| spec-plan 迁移 | 4-5 小时 | 4 个新 reference 文件 + SKILL.md 精简 + 验证 |
| spec-code-review 迁移 | 4-5 小时 | 2-3 个新 reference 文件 + SKILL.md 精简 + 验证 |
| spec-compound-refresh 迁移 | 2-3 小时 | 1-2 个新 reference 文件 + 验证 |
| spec-optimize 迁移 | 2-3 小时 | 1-2 个新 reference 文件 + 验证 |
| spec-mcp-setup 迁移 | 2-3 小时 | 2 个新 reference 文件 + 验证 |
| CI 行数检查脚本 | 1 小时 | 监控预警自动化 |

总计约 15-20 小时，可分 3-4 个 session 完成。

注：P0 skill（spec-plan、spec-code-review）工作量较大，因为它们的路由逻辑复杂，需要仔细判断每段内容是保留还是提取，且验证需要在新会话中完整跑一遍 workflow 确认无回归。
