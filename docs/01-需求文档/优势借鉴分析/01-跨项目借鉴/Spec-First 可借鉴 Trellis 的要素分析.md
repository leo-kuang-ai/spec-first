# Spec-First 可借鉴 Trellis 的要素分析

> **版本**: v1.4 | **日期**: 2026-03-01 | **作者**: Claude (AI)
> **输入**: Trellis v0.3.0 + Spec-First v0.5.45 可行性评估 + 源码/文档深度分析
> **目标**: 识别 Trellis 中可借鉴到 Spec-First 的机制，映射到 v0.5.45 的 Gap/Risk，给出落地建议

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. Code-Spec vs Guide 分离设计](#1-code-spec-vs-guide-分离设计)
  - [2. JSONL 分层上下文注入](#2-jsonl-分层上下文注入)
  - [3. Break-the-Loop 调试闭环](#3-break-the-loop-调试闭环)
  - [4. Cross-Layer Check 多维度验证](#4-cross-layer-check-多维度验证)
  - [5. Brainstorm 九步流程](#5-brainstorm-九步流程)
  - [6. 任务复杂度分类机制](#6-任务复杂度分类机制)
  - [7. Code-Spec 深度规则](#7-code-spec-深度规则)
  - [8. trellis-meta vs trellis-local 分离](#8-trellis-meta-vs-trellis-local-分离)
  - [9. Onboard 新人引导机制](#9-onboard-新人引导机制)
- [总结映射表](#总结映射表)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议](#落地建议)
- [与 Superpowers 借鉴的协同](#与-superpowers-借鉴的协同)

---

## 核心结论

**Trellis 的最大价值不在流程设计（Spec-First 的 8+2 阶段已更完备），而在"规范分层设计"和"上下文注入机制"的精细工程。**

Trellis 深刻理解 AI 会"忘记"规范，并通过 JSONL 分层注入 + Hook 自动化确保规范总是被加载。它也明确区分了"告诉 AI 如何实现"（Code-Spec）和"帮助 AI 思考什么"（Guide），避免了规范定位不清的问题。

这恰好是 Spec-First 从"规范完备"走向"执行可靠"最需要补齐的一环。

| 维度 | Trellis | Spec-First v0.5.45 | 互补关系 |
|------|---------|------------------|----------|
| 流程完整性 | 轻量（start → brainstorm → implement → check → finish） | 重量级（8+2 阶段 + Gate + GL） | Spec-First 更强 |
| 追踪与度量 | 无 ID 体系、简单任务目录 | Feature+FR/DS/TASK/TC/RFC + C1-C9 + H1 | Spec-First 更强 |
| 规范分层 | Code-Spec vs Guide 分离清晰 | 未明确区分 | **Trellis 更强** |
| 上下文注入 | JSONL 分层注入 + Hook 自动化 | 已有 Hook 自动注入与 context-pack，缺少任务级声明式分层模型 | **Trellis 可补强** |
| 调试闭环 | Break-loop + 强制更新 spec | 已有调试守卫与缺陷/RFC治理，缺少独立 break-loop 专项命令模板 | **Trellis 可补强** |
| 需求发现 | 九步 Brainstorm 流程（Task-first） | 已有结构化澄清与动态提问规则 | 借鉴节奏与分流 |
| 新人引导 | Onboard 命令（完整引导） | 已有 `/spec-first:first` 深度认知，缺少轻量入门命令 | **Trellis 可借鉴** |
| 跨层检查 | Cross-Layer Check 多维度 | 已有 `analyze` + SCA 跨产物一致性，缺少实现期跨层检查模板 | **Trellis 可借鉴** |

---

## 项目对比概览

### Trellis（v0.3.0）

- **定位**: AI 辅助开发工作流的 CLI 工具包，通过"强制上下文注入"将 AI 助手转变为结构化的开发伙伴
- **核心理念**: Specs Injected, Not Remembered（规范注入而非记忆）
- **16 个命令**: start, brainstorm, parallel, finish-work, record-session, break-loop, update-spec, check-frontend, check-backend, check-cross-layer, before-frontend-dev, before-backend-dev, onboard, create-command, integrate-skill, improve-ut
- **技术栈**: TypeScript CLI + Python Scripts + Markdown Skills + JSONL 上下文

### Spec-First（v0.5.45）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **8+2 阶段**: Init → Specify → Design → Plan → Implement → Verify → Wrap-up → Release → done/cancelled
- **22 个 Skill**: `00-first` 到 `21-analyze`（另含 `AGENTS.md`/`README.md`/`SHARED.md`）
- **技术栈**: TypeScript CLI + Markdown Skills + YAML Front Matter + JSONL 运行数据

---

## 可借鉴要素详析

### 1. Code-Spec vs Guide 分离设计

**对应 Trellis 机制**: `.trellis/spec/` 目录结构 + `update-spec` 命令中的分类规则

**解决 Spec-First 问题**: 规范定位不清，执行规范与指导规范混淆

#### Trellis 做法

Trellis 明确区分了两类规范：

| 类型 | 位置 | 目的 | 内容风格 |
|------|------|------|---------|
| **Code-Spec** | `backend/*.md`, `frontend/*.md` | 告诉 AI "如何安全实现" | 签名、契约、矩阵、用例、测试点 |
| **Guide** | `guides/*.md` | 帮助 AI "思考什么" | 检查清单、问题、指向 spec 的指针 |

**决策规则**：

```text
问自己：
- "这是如何写代码" → 放入 backend/ 或 frontend/
- "这是写之前要考虑什么" → 放入 guides/
```

**错误示例**：

| 学习内容 | 错误位置 | 正确位置 |
|----------|---------|----------|
| "使用 reconfigure() 而非 TextIOWrapper 处理 Windows stdout" | ❌ guides/cross-platform-thinking-guide.md | ✅ backend/script-conventions.md |
| "编写跨平台代码时记得检查编码" | ❌ backend/script-conventions.md | ✅ guides/cross-platform-thinking-guide.md |

#### Spec-First 当前状态

Spec-First 的规范体系（`docs/02技术方案/`、`skills/spec-first/`）没有明确区分"可执行契约"和"思维指南"。这导致：
- Skill 中混杂了执行步骤和思考提示
- AI 可能忽略关键的执行规范
- 规范更新时不知道应该更新哪类文档

#### 落地建议

1. **制定 Code-Spec vs Guide 分离规范**：
   - Code-Spec: 可执行契约，包含签名、字段、验证规则、用例
   - Guide: 思维检查清单，包含问题、提示、指向 Code-Spec 的引用

2. **整理现有 Skill 和规范文档**：
   - 审查 22 个 Skill，区分"执行步骤"和"思考提示"
   - 将执行步骤提取为 Code-Spec
   - 将思考提示整理为 Guide

3. **在 Skill 评审清单中加入分类检查项**

---

### 2. JSONL 分层上下文注入

**对应 Trellis 机制**: `inject-subagent-context.py` Hook + 任务目录中的 JSONL 文件

**解决 Spec-First 问题**: 缺少任务级、阶段级声明式分层注入模型（而非“完全靠记忆”）

#### Trellis 做法

每个任务目录包含三个 JSONL 文件：

```
.trellis/tasks/{task-name}/
├── implement.jsonl     # 实现阶段需要的 spec
├── check.jsonl         # 检查阶段需要的 spec
└── debug.jsonl         # 调试阶段需要的 spec
```

JSONL 文件格式：

```json
{"file": ".trellis/spec/backend/database-guidelines.md", "reason": "DB operations required"}
{"file": ".trellis/spec/backend/error-handling.md", "reason": "Error handling patterns"}
```

**注入流程**：

1. `PreToolUse:Task` Hook 触发
2. 读取 `.trellis/.current-task` 获取当前任务
3. 根据子代理类型（implement/check/debug）读取对应的 JSONL
4. 将 JSONL 中列出的文件内容注入到子代理上下文

**关键设计**：
- **分层注入**：不同阶段接收不同的 spec
- **按需加载**：只加载与当前任务相关的规范
- **自动化**：Hook 自动执行，不依赖 AI 记住

#### Spec-First 当前状态

Spec-First 已有 Hook 自动化和 context-pack 机制（`PreToolUse/PostToolUse/Stop`、`task-context.sh`），并非完全依赖 AI 记忆；当前差距主要在：
- 缺少“任务级 JSONL 清单”这种声明式精确注入模型
- 分层粒度仍偏“阶段/流程级”，未细化到任务 `implement/check/debug` 的显式清单
- 缺少对“注入清单完整性”的专门校验

#### 落地建议

1. **在现有 Hook 基础上扩展 JSONL 分层上下文注入机制**：
   - 在 Feature 目录中创建 `implement.jsonl`、`check.jsonl`、`debug.jsonl`
   - 根据阶段自动加载对应的规范文件

2. **扩展 context-pack 支持分层**：
   - 当前 context-pack 是单一结构
   - 扩展为按阶段划分的上下文包

3. **在 skill-runtime 中增加注入触发器**：
   - 阶段进入时自动加载对应的 JSONL
   - 子代理启动时自动注入上下文

---

### 3. Break-the-Loop 调试闭环

**对应 Trellis 机制**: `/trellis:break-loop` 命令

**解决 Spec-First 问题**: 缺少统一的 break-loop 专项沉淀模板

#### Trellis 做法

`/trellis:break-loop` 是调试完成后的深度分析框架：

**五维度分析**：

| 维度 | 内容 |
|------|------|
| **1. 根因分类** | A. Missing Spec / B. Cross-Layer Contract / C. Change Propagation Failure / D. Test Coverage Gap / E. Implicit Assumption |
| **2. 修复失败原因** | Surface Fix / Incomplete Scope / Tool Limitation / Mental Model |
| **3. 预防机制** | Documentation / Architecture / Compile-time / Runtime / Test Coverage / Code Review |
| **4. 系统性扩展** | Similar Issues / Design Flaw / Process Flaw / Knowledge Gap |
| **5. 知识捕获** | 更新 spec/guides、创建 issue、创建 feature ticket |

**核心哲学**：

> **调试的价值不在于修复 bug，而在于让这类 bug 不再发生。**
>
> 30 分钟的分析可以节省 30 小时的未来调试。

**强制行动**：

```markdown
> **IMPORTANT**: After completing the analysis above, you MUST immediately:
> 1. Update spec/guides - Don't just list TODOs, actually update the relevant files
> 2. Sync templates - After updating `.trellis/spec/`, sync to templates
> 3. Commit the spec updates
>
> **The analysis is worthless if it stays in chat. The value is in the updated specs.**
```

#### Spec-First 当前状态

Spec-First 目前没有独立的 break-loop 命令，但并非“无调试方法”：
- `spec-first:code` 已包含根因调查、模式分析、假设验证、3-Strike 升级等结构化调试守卫
- 已有缺陷/RFC 等知识沉淀路径
- 当前差距是“调试完成后强制反思并回写规范”的独立标准动作模板

#### 落地建议

1. **创建 `/spec-first:break-loop` skill**：

```markdown
# Break-the-Loop - 深度缺陷分析

## 分析框架

### 1. 根因分类
| 类别 | 特征 | 示例 |
|------|------|------|
| A. 规范缺失 | 没有文档说明如何做 | 新功能没有检查清单 |
| B. 跨层契约问题 | 层间接口不清晰 | API 返回格式与预期不符 |
| C. 变更传播失败 | 改了一处，漏了其他 | 函数签名变了，调用点没更新 |
| D. 测试覆盖缺口 | 单元测试通过，集成失败 | 单独工作正常，组合后失败 |
| E. 隐式假设 | 代码依赖未记录的假设 | 时间戳秒 vs 毫秒 |

### 2-5. [其他维度...]

## 强制行动
> 分析完成后，必须立即更新相关的 spec 文档。
> **停留在聊天中的分析毫无价值，价值在于更新的规范。**
```

2. **在 `/spec-first:code` 的异常处理路径中引用此 skill**

---

### 4. Cross-Layer Check 多维度验证

**对应 Trellis 机制**: `/trellis:check-cross-layer` 命令

**解决 Spec-First 问题**: 实现阶段缺少专门的跨层变更检查模板

#### Trellis 做法

`/trellis:check-cross-layer` 是一个后实现安全网，包含多维度检查：

| 维度 | 触发条件 | 检查项 |
|------|---------|--------|
| **A. 跨层数据流** | 3+ 层变更 | 读流程、写流程、类型传递、错误传播、加载状态 |
| **B. 代码复用** | 修改常量/配置 | 搜索定义数、共享常量、使用点更新 |
| **B2. 新工具函数** | 创建新函数 | 搜索相似函数、扩展 vs 创建、位置选择 |
| **B3. 批量修改后** | 批量修改 | 所有相似模式检查、遗漏点、抽象建议 |
| **C. 导入/依赖路径** | 创建新文件 | 相对 vs 绝对路径、循环依赖、模块组织 |
| **D. 同层一致性** | 修改显示逻辑 | 相同概念搜索、一致性检查、共享配置 |

**常见问题速查表**：

| 问题 | 根因 | 预防 |
|------|------|------|
| 改了一处，漏了其他 | 没搜索影响范围 | 改之前 grep |
| 数据在某层丢失 | 没检查数据流 | 从源头到目的地追踪 |
| 类型/模式不匹配 | 跨层类型不一致 | 使用共享类型定义 |

#### Spec-First 当前状态

Spec-First 已有 `spec-first analyze` + SCA（跨产物一致性分析）能力，但偏“文档与追踪一致性”。对实现期跨层代码变更（数据流、传播范围、同层一致性）仍可补充专用模板。跨层变更仍可能：
- 数据流不完整
- 类型在各层不一致
- 修改传播不完整

#### 落地建议

1. **创建 `/spec-first:cross-check` skill（作为 `analyze/SCA` 的补充，不替代）**

2. **在 Gate 引擎中加入跨层检查触发器**：
   - 当变更涉及 3+ 模块时触发
   - 当变更涉及 API + Service + DB 时触发

---

### 5. Brainstorm 九步流程

**对应 Trellis 机制**: `/trellis:brainstorm` 命令

**解决 Spec-First 问题**: 需求发现阶段可进一步提升“任务先落地 + 单轮一问 + 研究优先”的执行节奏

#### Trellis 做法

Trellis 的 Brainstorm 是一个精心设计的九步流程（Step 0-8）：

| 步骤 | 名称 | 关键活动 |
|------|------|---------|
| **0** | 确保任务存在 | 总是先创建任务目录，不等待完美理解 |
| **1** | 自动上下文 | 在问问题前先收集信息（代码、文档、配置） |
| **2** | 复杂度分类 | Trivial / Simple / Moderate / Complex |
| **3** | 问题门禁 | 只问 Blocking 或 Preference 问题 |
| **4** | 研究优先 | 技术选择必须先研究再提议 |
| **5** | 扩展扫描 | 发散思考（未来演进、相关场景、失败/边缘） |
| **6** | Q&A 循环 | 收敛（一次一问、更新 PRD、勾选 AC） |
| **7** | 提出方案 | 2-3 个可行方案 + ADR-lite |
| **8** | 最终确认 | 完整需求摘要 + 实施计划 |

**核心原则**：

| 原则 | 描述 |
|------|------|
| **Task-first** | 立即创建任务，用临时标题也行 |
| **Action before asking** | 能从代码/文档推导就不问 |
| **One question per message** | 不用问题列表淹没用户 |
| **Research-first** | 技术选择先研究再提议 |
| **Diverge → Converge** | 先发散，后收敛 |

**反模式**：

```markdown
## Anti-Patterns (Hard Avoid)
- Asking user for code/context that can be derived from repo
- Asking user to choose before presenting concrete options
- Meta questions about whether to research
- Staying narrowly on initial request without considering evolution/edges
- Letting brainstorming drift without updating PRD
```

#### Spec-First 当前状态

Spec-First 的 `/spec-first:spec` 已具备结构化歧义消解、`[NEEDS CLARIFICATION]`、动态问题生成和轮次约束。当前可借鉴点在于：
- 将 Trellis 的 Task-first 节奏前置到更早动作
- 强化“一次一问”在高不确定需求下的默认策略
- 把复杂度分流与 brainstorm 深度绑定得更直观

#### 落地建议

1. **在 `/spec-first:spec` 中引入九步流程**（可精简为 5-6 步适配）

2. **加入复杂度分类机制**（用于选择澄清深度，不绕过治理）：
   - Trivial → 轻量澄清后进入标准流程
   - Simple → 快速确认后实现
   - Moderate → 轻量 brainstorm
   - Complex → 完整 brainstorm

3. **加入反合理化表**：

| AI 的借口 | 封堵 |
|-----------|------|
| "需求很清楚，不需要澄清" | 你认为清楚 ≠ 无歧义，检查 NEEDS CLARIFICATION |
| "我先问用户一些问题" | 能从代码推导就不问，先做自动上下文 |

---

### 6. 任务复杂度分类机制

**对应 Trellis 机制**: `/trellis:start` 中的任务分类

**解决 Spec-First 问题**: 任务分流不明确

#### Trellis 做法

```markdown
## Task Classification

| Type | Criteria | Workflow |
|------|----------|----------|
| **Question** | User asks about code, architecture | Answer directly |
| **Trivial Fix** | Typo, comment, single-line change | Direct Edit |
| **Simple Task** | Clear goal, 1-2 files, well-defined | Quick confirm → Implement |
| **Complex Task** | Vague goal, multiple files, architectural | **Brainstorm → Task Workflow** |

### Decision Rule
> **If in doubt, use Brainstorm + Task Workflow.**
```

**分类信号**：

**Trivial/Simple 指标**：
- 用户指定了确切的文件和变更
- "修复 X 中的拼写错误"
- "在组件 Z 中添加字段 Y"
- 已有明确的验收标准

**Complex 指标**：
- "我想添加一个功能..."
- "你能帮我改进..."
- 涉及多个区域或系统
- 没有明确的实现路径
- 用户似乎不确定方法

#### Spec-First 当前状态

Spec-First 的 `/spec-first:orchestrate` 已有编排能力，但复杂度分类尚未显式标准化为统一决策表：
- 复杂度信号与执行深度映射可进一步显式化
- 复杂度分流与澄清策略的绑定可进一步统一

#### 落地建议

1. **在 `/spec-first:orchestrate` 中加入复杂度分类**

2. **根据复杂度选择不同的执行深度（Gate 不跳过）**：
   - Trivial → 标准 Gate + 最小证据集
   - Simple → 标准 Gate + 轻量澄清
   - Moderate → 标准 Gate + 结构化 Brainstorm
   - Complex → 标准 Gate + 深度 Brainstorm + 人工检查点

---

### 7. Code-Spec 深度规则

**对应 Trellis 机制**: `update-spec` 命令中的强制深度要求

**解决 Spec-First 问题**: Infra/跨层变更规范深度不足

#### Trellis 做法

对于涉及 infra 或跨层契约的变更，Trellis 强制要求 Code-Spec 深度：

**触发条件**：
- 新/变更的命令或 API 签名
- 跨层请求/响应契约变更
- 数据库模式/迁移变更
- 基础设施集成（存储、队列、缓存、密钥、环境变量）

**强制输出（7 个部分）**：

```markdown
## Scenario: <name>

### 1. Scope / Trigger
- Trigger: <why this requires code-spec depth>

### 2. Signatures
- Backend command/API/DB signature(s)

### 3. Contracts
- Request fields (name, type, constraints)
- Response fields (name, type, constraints)
- Environment keys (required/optional)

### 4. Validation & Error Matrix
- <condition> -> <error>

### 5. Good/Base/Bad Cases
- Good: ...
- Base: ...
- Bad: ...

### 6. Tests Required
- Unit/Integration/E2E with assertion points

### 7. Wrong vs Correct
#### Wrong
...
#### Correct
...
```

#### Spec-First 当前状态

Spec-First 的 Gate 引擎检查阶段条件，但没有：
- 对 infra/跨层变更的深度规范要求
- 强制的输出格式

#### 落地建议

1. **在 Gate 引擎中加入 Code-Spec 深度触发器**

2. **对触发的变更，要求完整的 7 部分规范**

3. **在 `/spec-first:design` skill 中加入 Code-Spec 深度模板**

---

### 8. trellis-meta vs trellis-local 分离

**对应 Trellis 机制**: Meta-skill 和 Local-skill 分离设计

**解决 Spec-First 问题**: 升级时定制保留问题

#### Trellis 做法

Trellis 使用两层 skill 结构：

```
~/.claude/skills/
└── trellis-meta/              # 原始文档 - 不修改

project/.claude/skills/
└── trellis-local/             # 项目级定制 - 记录所有修改
```

**分离原则**：
- 用户可能有多个项目，各有不同的定制
- 每个项目的 `trellis-local` 记录自己的修改
- meta-skill 保持干净，作为原始参考
- 升级时：比较 meta-skill 与新版本，保留 local 定制

**Local skill 结构**：

```markdown
# Trellis Local - [PROJECT_NAME]

## Base Version
Trellis version: X.X.X
Date initialized: YYYY-MM-DD

## Customizations

### Commands Added
(none yet)

### Agents Modified
(none yet)

### Hooks Changed
(none yet)

## Changelog

### YYYY-MM-DD
- Initial setup
```

#### Spec-First 当前状态

Spec-First 的 Skill 在 `skills/spec-first/` 中，没有：
- 原始版本与定制版本的分离
- 定制记录机制

#### 落地建议

1. **考虑引入 spec-first-meta 和 spec-first-local 分离**

2. **在升级机制中保留 local 定制**

---

### 9. Onboard 新人引导机制

**对应 Trellis 机制**: `/trellis:onboard` 命令

**解决 Spec-First 问题**: 缺少“轻量命令式”新人引导入口（相对现有深度认知能力）

#### Trellis 做法

`/trellis:onboard` 是一个完整的引导系统，包含三个部分：

**PART 1: Core Concepts**
- 解释为什么存在（三大挑战）
- 命令深度解读

**PART 2: Real-World Examples**
- 5 个真实工作流示例
- 每个步骤解释：PRINCIPLE / WHAT HAPPENS / IF SKIPPED

**PART 3: Customize Guidelines**
- 检查指南是否为空模板
- 引导填充项目特定内容

**三大挑战解释**：

| 挑战 | 问题 | 解决 |
|------|------|------|
| AI 无记忆 | 每次会话从零开始 | workspace 系统捕获历史 |
| AI 通用知识非项目知识 | 写通用代码而非项目风格 | spec/ 目录注入项目规范 |
| AI 上下文窗口有限 | 会话中规范被挤出 | check-* 命令重新验证 |

#### Spec-First 当前状态

Spec-First 已有 `/spec-first:first` 可生成系统化认知文档，但偏“深度分析型”。当前可补的是：
- 增加轻量 onboarding 命令，面向首次接入的 10-15 分钟快速上手
- 将核心概念、阶段路径、常见误区从“深度文档”抽成“快速路线图”

#### 落地建议

1. **创建 `/spec-first:onboard` skill**

2. **包含**：
   - Spec-First 核心理念解释
   - 阶段流程图解
   - 3-5 个真实工作流示例
   - 指南检查与填充引导

---

## 总结映射表

| # | Trellis 机制 | 映射到 Spec-First 位置 | 解决的 Gap/Risk | 优先级 |
|---|-------------|----------------------|----------------|--------|
| 1 | Code-Spec vs Guide 分离 | 全部 Skill 和规范文档 | 规范定位不清，执行与指导混淆 | **P0** |
| 2 | JSONL 分层上下文注入 | skill-runtime + ai-orchestrator | 任务级声明式分层注入不足 | **P0** |
| 3 | Break-the-Loop 调试闭环 | 新增 /spec-first:break-loop | 缺少 break-loop 专项沉淀模板 | P1 |
| 4 | Cross-Layer Check 多维度 | 新增 /spec-first:cross-check | 实现期跨层检查模板不足 | P1 |
| 5 | Brainstorm 九步流程 | /spec-first:spec | Task-first 与复杂度分流节奏可增强 | P1 |
| 6 | 任务复杂度分类 | /spec-first:orchestrate | 任务分流不明确 | P1 |
| 7 | Code-Spec 深度规则 | Gate 引擎 | Infra/跨层变更规范深度不足 | P1 |
| 8 | trellis-meta vs local 分离 | Skill 版本管理 | 升级时定制保留问题 | P2 |
| 9 | Onboard 新人引导 | 新增 /spec-first:onboard（轻量） | 深度认知强、轻量入门弱 | P2 |

---

## 不适用 / 无需借鉴的部分

以下 Trellis 机制在 Spec-First 中已有更好的替代方案，无需借鉴：

| Trellis 机制 | 不借鉴原因 | Spec-First 已有替代 |
|-------------|-----------|-------------------|
| Workspace 系统 | Trellis 的 workspace 是简单的日志记录 | Spec-First 有更完整的 Feature + 追踪矩阵体系（C1-C9） |
| Task 系统 | Trellis 的任务是简单目录 + task.json | Spec-First 有 TASK ID 体系、依赖调度、阶段状态机 |
| Multi-Agent Pipeline | Trellis 的 Multi-Agent 是 worktree + 脚本 | Spec-First 已有 orchestrate 和 subagent 框架 |
| Workflow.md 单文档 | Trellis 依赖单一 workflow.md | Spec-First 有 CLAUDE.md + 22 个 Skill + 技术方案文档 |
| 轻量阶段流程 | Trellis 只有 5 个阶段 | Spec-First 有 8+2 阶段 + Gate + GL，更完备 |

---

## 落地建议

### 实施路径

```text
Week 1-2 (P0):  Code-Spec vs Guide 分离 + JSONL 注入机制
                 ↓ 最小改动，建立核心基础设施
Week 3-4 (P1):  Break-Loop + Cross-Check + Brainstorm 流程 + 任务分类 + Code-Spec 深度
                 ↓ 流程完善，质量闭环
Week 5-6 (P2):  Onboard 引导 + Meta/Local 分离
                 ↓ 可选优化，提升体验
```

### P0 具体行动项

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 制定 Code-Spec vs Guide 分离规范并整理现有文档 | 全部规范文档 | 2 天 | 规范定位清晰，AI 知道何时用什么 |
| 2 | 在现有 Hook 上扩展 JSONL 分层上下文注入 | skill-runtime + hooks | 2 天 | 任务上下文注入更精确、可声明、可校验 |

### P1 具体行动项

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 创建 /spec-first:break-loop skill | 新增 skill | 1 天 | 调试后知识沉淀 |
| 2 | 创建 /spec-first:cross-check skill | 新增 skill | 1 天 | 跨层变更专门检查 |
| 3 | 在 /spec-first:spec 中引入九步 Brainstorm 流程 | 1 个 skill 文件 | 1 天 | 需求发现更结构化 |
| 4 | 实现任务复杂度分类机制 | orchestrate skill | 1 天 | 任务分流更明确 |
| 5 | 在 Gate 引擎中增加 Code-Spec 深度规则 | gate-engine | 1 天 | Infra/跨层变更规范深度保证 |

---

## 与 Superpowers 借鉴的协同

Trellis 和 Superpowers 可以从两个维度协同提升 Spec-First：

| 维度 | Superpowers 贡献 | Trellis 贡献 |
|------|-----------------|-------------|
| **AI 行为约束** | 反合理化设计、证据优先、Spirit vs Letter | Code-Spec vs Guide 分离 |
| **上下文基础设施** | Session Hook 决策树、Graphviz 流程图 | JSONL 分层注入、Hook 自动化 |
| **流程质量闭环** | 两阶段审查、批量检查点 | Break-Loop、Cross-Layer Check |
| **需求发现** | Brainstorm HARD-GATE | Brainstorm 九步流程 |

**协同效应**：

```text
Superpowers 告诉 AI："不要跳过这些步骤，即使你觉得可以"
    +
Trellis 告诉 AI："这是你需要的规范，自动加载好了"
    =
AI 既有约束又有上下文，执行更可靠
```

---

## 参考资料

| 来源 | 路径 | 用途 |
|------|------|------|
| Trellis 项目 | /Users/kuang/xiaobu/Trellis | 本文分析对象 |
| trellis-meta skill | /Users/kuang/xiaobu/Trellis/.claude/skills/trellis-meta/SKILL.md | 架构设计参考 |
| start.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/start.md | 任务分类与工作流参考 |
| brainstorm.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/brainstorm.md | 九步需求发现流程参考 |
| break-loop.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/break-loop.md | 调试闭环参考 |
| check-cross-layer.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/check-cross-layer.md | 跨层检查参考 |
| update-spec.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/update-spec.md | Code-Spec 深度规则参考 |
| finish-work.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/finish-work.md | 完成检查清单参考 |
| onboard.md | /Users/kuang/xiaobu/Trellis/.claude/commands/trellis/onboard.md | 新人引导参考 |
| workflow.md | /Users/kuang/xiaobu/Trellis/.trellis/workflow.md | 整体工作流参考 |
| cross-layer-thinking-guide.md | /Users/kuang/xiaobu/Trellis/.trellis/spec/guides/cross-layer-thinking-guide.md | 思维指南示例 |
| Superpowers 借鉴分析 | docs/01-需求文档/优势借鉴分析/01-跨项目借鉴/Spec-First 可借鉴 Superpowers 的要素分析.md | 协同参考 |

---

## 版本更新记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.4 | 2026-03-01 | 三维审查后修正：统一 Brainstorm 为九步流程（5 处）；修正 JSONL 字段名 path→file；修正 Trellis 参考路径为可复现绝对路径 |
| v1.3 | 2026-03-01 | 移除"AI 永不提交"原则（项目需要 AI 提交能力）；修正 Brainstorm 为九步流程；更新要素编号 3-9 |
| v1.2 | 2026-03-01 | 多 Agent 审查报告整合，校正实施工时估算 |
| v1.1 | 2026-03-01 | 校正版本基线（Trellis 0.3.0 / Spec-First 0.5.45）；修正对 Hook/Spec/Gate/Analyze/First 的误判；更新 22 Skills 与引用路径 |
| v1.0 | 2026-02-28 | 初版发布（10 项要素分析 + 映射表 + 落地建议 + Superpowers 协同） |

---

> **文档状态**: v1.4 | 三维审查完成，9 项可借鉴要素，已修正事实错误
