# Spec-First 可借鉴 Oh-My-OpenCode 的要素分析

> **版本**: v1.1 | **日期**: 2026-02-25 | **作者**: AI Analysis
> **输入**: Oh-My-OpenCode v3.8.5 + Spec-First v7.1 可行性评估
> **目标**: 识别 Oh-My-OpenCode 中可直接借鉴到 Spec-First 的机制，映射到 v7.1 的 Gap/Risk，给出落地建议

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. Hash 锚定编辑（Hashline Edit）](#1-hash-锚定编辑hashline-edit)
  - [2. 动态 Prompt 组装（Dynamic Agent Prompt Building）](#2-动态-prompt-组装dynamic-agent-prompt-building)
  - [3. 类别化模型委派（Category-Based Delegation）](#3-类别化模型委派category-based-delegation)
  - [4. Todo 续航执行器（Todo Continuation Enforcer）](#4-todo-续航执行器todo-continuation-enforcer)
  - [5. AI 注释质量检查（Comment Checker / Slop Detection）](#5-ai-注释质量检查comment-checker--slop-detection)
  - [6. 安全 Hook 创建模式（Safe Hook Creation）](#6-安全-hook-创建模式safe-hook-creation)
  - [7. 双重完成检测（Dual Completion Detection）](#7-双重完成检测dual-completion-detection)
  - [8. 层级化 AGENTS.md 自动生成](#8-层级化-agentsmd-自动生成)
  - [9. Skill 内嵌 MCP 生命周期管理](#9-skill-内嵌-mcp-生命周期管理)
  - [10. 意图门控（IntentGate）](#10-意图门控intentgate)
  - [11. 自迭代开发循环（Ralph Loop）](#11-自迭代开发循环ralph-loop)
  - [12. 分层 Hook 架构（五层职责）](#12-分层-hook-架构五层职责)
- [总结映射表](#总结映射表)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议](#落地建议)

---

## 核心结论

**Oh-My-OpenCode（OmO）的最大价值在于"多模型编排工程"与"AI 执行可靠性工程"——它不关心流程治理，只关心一件事：如何让多个 AI Agent 在真实编码场景中稳定、高效、不出错地协作。**

这恰好补齐了 Spec-First 的两个盲区：
1. **编辑可靠性**：Spec-First 依赖 AI 原生编辑能力，缺少对"编辑腐蚀"（stale-line corruption）的防御机制
2. **多 Agent 编排成熟度**：Spec-First 有 Skill 框架但缺少生产级的 Agent 调度、续航、完成检测机制

两者的互补关系：

| 维度 | Oh-My-OpenCode | Spec-First v7.1 | 互补关系 |
|------|---------------|------------------|----------|
| 定位 | 多模型 AI 开发工具链（Harness） | 规范驱动研发流程引擎 | **正交互补** |
| 流程完整性 | 无阶段概念，自由编排 | 8+2 阶段 + Gate + GL | Spec-First 远超 |
| 追踪与度量 | 无 ID 体系、无覆盖率 | Feature+FR/DS/TASK/TC/RFC + C1-C9 + H1 | Spec-First 远超 |
| 编辑可靠性 | 极强（Hashline 哈希锚定） | 弱（依赖宿主原生编辑） | **OmO 远超** |
| 多 Agent 编排 | 极强（11 Agent + 类别委派 + 续航） | 有框架但联调未完成（Gap 4） | **OmO 远超** |
| Hook 工程 | 极强（46 Hook，五层职责；createHooks 为 3-tier 组合） | 三类 Hook（AI Runtime + Session + Git） | OmO 更成熟 |
| 模型适配 | 极强（多模型 + 类别抽象 + 降级链） | 单模型为主 | OmO 更灵活 |
| Prompt 工程 | 动态组装（元数据驱动） | 静态 SKILL.md 模板 | OmO 更先进 |
| 平台覆盖 | OpenCode（兼容 Claude Code） | Claude Code + Codex（双宿主） | 各有侧重 |

---

## 项目对比概览

### Oh-My-OpenCode（v3.8.5）

- **定位**: OpenCode 的 batteries-included 插件，将其变为多模型、多 Agent 的 AI 开发工具链
- **作者**: YeonGyu Kim (@code-yeongyu) | **协议**: SUL-1.0
- **核心理念**: 没有单一 LLM 能统治一切，未来是编排所有模型；用 Hash 锚定消灭编辑腐蚀
- **规模**: ~1208 TypeScript 文件（全仓口径），~148k LOC（全仓 `.ts` 口径）
- **11 个 Agent**: 3 主 Agent（Sisyphus/Hephaestus/Atlas）+ 8 子 Agent（Oracle/Librarian/Explore 等）
- **26 个 Tool**: LSP 6 + AST-Grep + Hashline Edit + Background + Agent + Skill + Session + Task
- **46 个 Hook**: Session 23 + Tool-Guard 10 + Transform 4 + Continuation 7 + Skill 2
- **技术栈**: TypeScript + Bun + Zod v4 + AST-Grep + MCP SDK + Commander

### Spec-First（v7.1）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **8+2 阶段**: Init → Specify → Design → Plan → Implement → Verify → Wrap-up → Release → done/cancelled
- **19 个 Skill**: 阶段 10 + 编排 3 + 辅助 6
- **技术栈**: TypeScript CLI + Markdown Skills + YAML Front Matter + Handlebars 模板

---

## 可借鉴要素详析

### 1. Hash 锚定编辑（Hashline Edit）

**对应 OmO 机制**: Hashline Edit Tool — 每行附加 2 字符内容哈希，编辑时校验哈希一致性

**解决 Spec-First 问题**: Gap 4（Skill 联调一致性）+ 通用编辑可靠性

#### OmO 做法

OmO 的 Hashline 是其最核心的创新。当 Agent 读取文件时，每行被标记为：

```
42#VK| function hello() {
43#3P| return "world";
```

`#VK` 和 `#3P` 是该行内容的 2 字符哈希。当 Agent 发起编辑时，系统校验哈希：
- **哈希匹配** → 编辑执行
- **哈希不匹配** → 文件已被修改，编辑被拒绝，Agent 必须重新读取

这个机制的效果极其显著：据 OmO 文档，仅靠更换编辑工具，Grok Code Fast 1 的成功率从 **6.7% 跃升至 68.3%**。

#### Spec-First 现状

Spec-First 完全依赖宿主（Claude Code / Codex）的原生编辑能力。在 `04_implement` 阶段，`code` skill 生成代码时没有任何编辑完整性校验。当多个 TASK 并行修改同一文件时，存在"编辑腐蚀"风险。

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在 `code` skill 的 P4_WRITE 阶段引入文件指纹校验 |
| **具体做法** | P2_GENERATE 时记录目标文件的行级哈希快照；P4_WRITE 前比对快照，不一致则回退到 P2 重新生成 |
| **复杂度** | 中 — 需要新增 `file-fingerprint` 模块，约 200-300 LOC |
| **风险** | 低 — 纯增量机制，不影响现有流程 |

---

### 2. 动态 Prompt 组装（Dynamic Agent Prompt Building）

**对应 OmO 机制**: `dynamic-agent-prompt-builder.ts` — 从 Agent 元数据动态组装 Prompt，而非静态模板

**解决 Spec-First 问题**: Gap 3（Skill Prompt 维护成本高）+ Risk 2（Skill 间上下文不一致）

#### OmO 做法

OmO 的 Sisyphus（主编排 Agent）的 Prompt 不是写死的。它从以下元数据动态组装：

```typescript
interface AgentPromptMetadata {
  categories: string[];           // 能力类别
  costClassification: string;     // 成本等级
  delegationTriggers: string[];   // 何时委派给此 Agent
  useConditions: string[];        // 适用条件
  avoidConditions: string[];      // 不适用条件
}
```

组装过程：
1. 扫描所有已启用的 Agent，提取元数据
2. 自动生成**委派决策表**（哪个任务交给哪个 Agent）
3. 自动生成**工具选择表**（哪个场景用哪个工具）
4. 自动生成**关键触发器**（何时切换 Agent）

**核心优势**：新增一个 Agent 或 Tool，编排器的 Prompt 自动更新，零维护成本。

#### Spec-First 现状

Spec-First 的 19 个 SKILL.md 是静态 Markdown 文件。`orchestrate` skill 的编排逻辑硬编码了 skill 名称和阶段映射。新增 skill 需要手动更新 `AGENTS.md` 和 `orchestrate` 的 SKILL.md。

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 为每个 SKILL.md 增加结构化 YAML Front Matter 元数据，`orchestrate` skill 运行时动态读取 |
| **具体做法** | 在 SKILL.md 的 YAML 头部新增 `triggers`、`stage_affinity`、`cost`、`dependencies` 字段；`orchestrate` 的 P1_CONTEXT 阶段扫描所有 skill 元数据，动态生成编排决策表 |
| **复杂度** | 低 — 主要是 YAML 字段定义 + orchestrate skill 模板化 |
| **风险** | 低 — 向后兼容，缺少元数据的 skill 使用默认值 |

---

### 3. 类别化模型委派（Category-Based Delegation）

**对应 OmO 机制**: 8 个内置类别（visual-engineering / deep / quick / ultrabrain 等）+ 模型解析管线

**解决 Spec-First 问题**: Risk 5（单模型依赖）+ 未来多模型扩展

#### OmO 做法

Sisyphus 不直接选择模型，而是选择一个**能力类别**：

```
用户请求 → Sisyphus 判断任务类型 → 选择类别（如 "deep"）
                                          ↓
                              模型解析管线（3 步）
                              override → category-default → provider-fallback → system-default
                                          ↓
                              实际模型（如 Claude Opus / GPT-5.3 Codex）
```

每个类别可配置：
```jsonc
{
  "categories": {
    "deep": {
      "model": "claude-opus-4-6",
      "temperature": 0.3,
      "variant": "standard"
    },
    "quick": {
      "model": "claude-haiku-4-5",
      "temperature": 0.5
    }
  }
}
```

**核心优势**：
- Agent 逻辑与模型选择解耦 — 换模型不改代码
- 自动降级 — 首选模型不可用时沿降级链切换
- 用户可按项目/全局覆盖类别-模型映射

#### Spec-First 现状

Spec-First 不管理模型选择，完全依赖宿主（Claude Code）的模型。`config.yaml` 中没有模型相关配置。当需要不同能力等级的 AI（如 `research` 需要深度推理，`status` 只需快速响应）时，无法差异化。

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 在 `config.yaml` 中新增 `models` 段，为 skill 类别定义模型偏好 |
| **具体做法** | 定义 3 个类别：`deep`（research/design）、`standard`（spec/code/test）、`quick`（status/sync/feature-*）；Context Pack 中注入模型建议，由宿主决定是否采纳 |
| **复杂度** | 低 — 仅配置层变更，不涉及运行时模型切换 |
| **风险** | 低 — 建议性质，宿主可忽略 |

---

### 4. Todo 续航执行器（Todo Continuation Enforcer）

**对应 OmO 机制**: `todo-continuation-enforcer` Hook + `unstable-agent-babysitter` Hook

**解决 Spec-First 问题**: Gap 4（Skill 联调一致性）+ Risk 3（AI 中途放弃任务）

#### OmO 做法

OmO 有两个互补的续航机制：

**Todo Continuation Enforcer**：当 Agent 进入空闲状态但 Todo 列表中仍有未完成项时，系统自动注入续航指令，将 Agent "拽回"继续工作。不是简单的重试，而是带上下文的续航——告诉 Agent "你还有 X 个任务未完成，当前进度是 Y"。

**Unstable Agent Babysitter**：监控 Agent 的失败模式。如果一个 Agent 连续失败（如编辑被拒、命令报错），babysitter 介入：
- 分析失败原因
- 尝试替代策略
- 必要时切换到其他 Agent

两者配合形成"不放弃"的执行纪律：Agent 不会因为遇到困难就停下来等用户干预。

#### Spec-First 现状

Spec-First 的 `orchestrate` skill 有 plan → skill → verify → advance 的编排循环，但：
- 单个 skill 内部如果 AI 中途放弃（如 `code` skill 在 P2_GENERATE 阶段遇到复杂逻辑后停止），没有续航机制
- `catchup` skill 是被动恢复（需要新 session 触发），不是主动续航
- 没有失败模式检测和自动策略切换

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 在 Phase Machine（P0-P5）中增加续航检测逻辑 |
| **具体做法** | P4_WRITE 完成后检查 TASK 列表中是否有剩余 in-progress 项；如有，自动回到 P0_LOCATE 定位下一个 TASK，而非等待用户再次调用 `/spec-first:code` |
| **复杂度** | 中 — 需要修改 phase-machine.ts 的状态转移逻辑 |
| **风险** | 中 — 需要设置最大续航次数（建议 ≤10），防止无限循环 |

---

### 5. AI 注释质量检查（Comment Checker / Slop Detection）

**对应 OmO 机制**: `comment-checker` Hook — 自动拒绝 AI 生成的低质量注释模式

**解决 Spec-First 问题**: Gap 2（代码质量门禁粒度不足）+ Risk 1（AI 生成代码质量不可控）

#### OmO 做法

OmO 内置了一个 `@code-yeongyu/comment-checker` 包，作为 Tool-Guard Hook 运行。它在每次文件写入后自动扫描，拒绝以下 AI 典型"注释废话"（slop）：

- `// TODO: implement this` — 占位符注释
- `// This function does X` — 重复函数名的无意义注释
- `// Added for Y` — 解释"为什么加了这行"的变更日志式注释
- `// Handle edge case` — 模糊的伪注释

被拒绝后，Agent 必须：要么删除注释（代码应自解释），要么写出真正有价值的注释（解释 *why* 而非 *what*）。

**目标**：让 AI 生成的代码读起来像资深工程师写的，而非 AI 生成的。

#### Spec-First 现状

Spec-First 的 `code-review` skill 有 4 维审查（SOLID、安全、性能、测试），但：
- 审查发生在代码生成**之后**，是事后检查而非实时拦截
- 没有针对 AI 特有的"注释废话"模式的检测
- `references/` 目录下的 checklist 是通用工程规范，缺少 AI 代码特征识别

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在 `code` skill 的 P4_WRITE 阶段增加 AI slop 检测 |
| **具体做法** | 新增 `ai-slop-patterns.yaml` 配置文件，定义 AI 典型废话模式（正则）；P4_WRITE 后扫描变更文件，命中则回退到 P2 要求 Agent 修正 |
| **复杂度** | 低 — 纯模式匹配，约 100-150 LOC |
| **风险** | 低 — 误报可通过 `config.yaml` 中的白名单排除 |

---

### 6. 安全 Hook 创建模式（Safe Hook Creation）

**对应 OmO 机制**: `safeCreateHook()` 包装器 — 单个 Hook 异常不会崩溃整个插件

**解决 Spec-First 问题**: Risk 6（Hook 链脆弱性）

#### OmO 做法

OmO 的 46 个 Hook 全部通过 `safeCreateHook()` 工厂函数创建：

```typescript
// 伪代码示意
function safeCreateHook(factory: () => Hook): Hook | null {
  try {
    return factory();
  } catch (error) {
    logger.warn(`Hook creation failed: ${error.message}`);
    return null; // 跳过此 Hook，不影响其他 Hook
  }
}
```

**核心原则**：Hook 链是"尽力而为"的，任何单点故障都被隔离。46 个 Hook 中即使有 5 个创建失败，剩余 41 个仍正常运行。

这在生产环境中至关重要——用户的环境千差万别，某些 Hook 依赖的外部工具（如 Tmux）可能不存在。

#### Spec-First 现状

Spec-First 的 Hook 系统（`session-hook.ts` + Git hooks）没有错误隔离：
- `session-start.js` 如果抛异常，整个 session 初始化失败
- Git hooks（`pre-push.sh`）如果执行出错，会阻塞 push 操作
- 没有 Hook 级别的 try-catch 包装

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 为所有 Hook 入口增加 try-catch 包装 |
| **具体做法** | `session-hook.ts` 中每个 Hook 注册点用 `safeguard()` 包装；Git hooks 中增加 `set +e` 和错误降级逻辑（失败时 warn 而非 exit 1） |
| **复杂度** | 极低 — 约 30-50 LOC 的包装函数 |
| **风险** | 极低 — 纯防御性增强 |

---

### 7. 双重完成检测（Dual Completion Detection）

**对应 OmO 机制**: Background Agent 的 Session Idle + Stability Detection 双重判定

**解决 Spec-First 问题**: Gap 4（Skill 联调一致性）+ Risk 3（任务完成判定不准确）

#### OmO 做法

OmO 的后台任务不会因为 Agent "暂时沉默"就被判定为完成。它使用双重检测：

1. **Session Idle 事件**：Agent 停止输出（必要条件，但不充分）
2. **Stability Detection**：消息计数在 10 秒内跨 3 次以上轮询保持不变（充分条件）

只有两个条件同时满足，任务才被标记为完成。

**为什么需要双重检测**：AI Agent 在思考复杂问题时可能有 5-8 秒的"沉默期"（等待工具返回、内部推理等）。单靠 idle 检测会导致大量"假完成"——Agent 还在工作，系统却认为它结束了。

#### Spec-First 现状

Spec-First 的 Phase Machine 使用单一信号判定阶段完成：
- P5_SIDE_EFFECT 执行完毕 → skill 完成
- `orchestrate` 的 verify 步骤通过 → 阶段完成

但在实际运行中，AI 可能在 P2_GENERATE 阶段产出不完整内容后"假完成"（输出停止但内容不完整），`orchestrate` 无法区分"真完成"和"假完成"。

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在 Phase Machine 的 P4→P5 转换中增加完整性校验 |
| **具体做法** | P4_WRITE 完成后，检查产出物是否满足最低完整性标准（如：文件非空、关键标记存在、字数 > 阈值）；不满足则标记为"疑似假完成"，回退到 P2 |
| **复杂度** | 中 — 需要为每种 skill 定义完整性标准 |
| **风险** | 低 — 误判时用户可手动确认跳过 |

---

### 8. 层级化 AGENTS.md 自动生成

**对应 OmO 机制**: `/init-deep` 命令 — 在项目树的每个重要目录自动生成 AGENTS.md 上下文文件

**解决 Spec-First 问题**: Gap 1（AI 对项目结构理解不足）+ Risk 2（跨 Skill 上下文断裂）

#### OmO 做法

OmO 通过 `/init-deep` 命令，递归扫描项目目录树，在每个包含重要代码的目录下生成一个 `AGENTS.md` 文件。这些文件：

- **自动生成**：基于目录内的文件类型、导出符号、依赖关系自动撰写
- **层级化**：根目录的 AGENTS.md 是总索引，子目录的 AGENTS.md 提供局部上下文
- **Agent 可消费**：格式专为 AI Agent 优化，包含"这个目录做什么"、"关键文件"、"依赖关系"等结构化信息
- **自动注入**：`context-injector` 特性在 Agent 进入某个目录时，自动将该目录的 AGENTS.md 注入上下文

**效果**：Agent 在任何目录下工作时，都有即时可用的局部上下文，不需要从头探索。

#### Spec-First 现状

Spec-First 有一个全局 `AGENTS.md`（在 `skills/spec-first/` 下），但：
- 只有一个文件，没有层级化
- 内容是手动维护的 CLI 参考和 Skill 映射表
- 不包含项目代码结构信息
- 没有自动注入机制——Agent 需要被明确指示去读取

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 在 `init` skill 中增加项目结构扫描，生成层级化上下文文件 |
| **具体做法** | `00_init` 阶段扫描项目 `src/` 目录，为每个核心模块目录生成 `_context.md`；`code` skill 的 P1_CONTEXT 阶段自动加载当前 TASK 涉及目录的 `_context.md` |
| **复杂度** | 中 — 需要目录扫描 + 模板生成，约 300-400 LOC |
| **风险** | 低 — 生成的文件可被 .gitignore 排除 |

---

### 9. Skill 内嵌 MCP 生命周期管理

**对应 OmO 机制**: `SkillMcpManager` — Skill 自带 MCP Server，按需启动、用完销毁

**解决 Spec-First 问题**: Gap 5（MCP 依赖管理碎片化）+ Risk 7（MCP 资源泄漏）

#### OmO 做法

OmO 的 Skill 不仅是 Prompt 模板，还可以携带自己的 MCP Server。生命周期由 `SkillMcpManager` 统一管理：

```
Skill 被调用
  → 解析 SKILL.md 中的 MCP 声明（YAML Front Matter）
  → 检查 MCP Server 是否已运行
  → 未运行 → 启动（stdio 或 HTTP）
  → Skill 执行完毕
  → 检查是否有其他 Skill 依赖此 MCP
  → 无依赖 → 销毁 MCP Server
```

**核心优势**：
- **按需加载**：不预启动所有 MCP，节省资源和上下文窗口
- **作用域隔离**：每个 Skill 的 MCP 工具不会污染其他 Skill 的上下文
- **自动清理**：Skill 结束后 MCP 被回收，无资源泄漏

#### Spec-First 现状

Spec-First 的 MCP 依赖（sequential-thinking、context7、serena、fetch、playwright-mcp）是全局配置的：
- 在 `~/.claude/settings.json` 或 `~/.config/claude-code/mcp.json` 中静态声明
- 所有 MCP 在 session 启动时全部加载，无论当前 skill 是否需要
- `doctor` skill 检查 MCP 可用性，但不管理生命周期

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 在 SKILL.md 中声明 MCP 依赖，Context Pack 中标注当前阶段所需 MCP |
| **具体做法** | 每个 SKILL.md 的 YAML 头部新增 `required_mcps` 字段；`orchestrate` 在切换 skill 时，Context Pack 中注入"当前 skill 需要 X MCP"的提示，引导宿主按需加载 |
| **复杂度** | 低 — 声明式，不涉及实际 MCP 生命周期管理（由宿主负责） |
| **风险** | 极低 — 纯信息性增强 |

---

### 10. 意图门控（IntentGate）

**对应 OmO 机制**: IntentGate — 在分类或执行前先分析用户真实意图，防止字面误解

**解决 Spec-First 问题**: Risk 4（AI 误解用户指令导致流程偏离）

#### OmO 做法

IntentGate 是 OmO 的一个前置分析层。当用户输入一条指令时，系统不会立即按字面意思执行，而是先判断"用户真正想要什么"：

```
用户输入: "删掉这个测试"
  ↓
IntentGate 分析:
  - 字面意图: 删除测试文件
  - 可能真实意图: 跳过失败的测试 / 重写测试 / 标记为 skip
  ↓
如果存在歧义 → 向用户确认
如果意图明确 → 直接执行
```

**核心价值**：防止 AI 的"过度服从"——用户说"删掉"，AI 就真的删了，但用户可能只是想暂时禁用。

#### Spec-First 现状

Spec-First 的 Confirm Policy（auto / assisted / strict）控制的是"是否需要用户确认"，但不分析意图：
- `auto` 模式下，AI 按字面意思执行，无意图分析
- `strict` 模式下，每步都确认，但确认的是"要不要做"而非"你是不是想做这个"
- 没有歧义检测机制

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P3（远期） |
| **落地方式** | 在 `orchestrate` skill 的 P0_LOCATE 阶段增加意图澄清步骤 |
| **具体做法** | 当用户指令与当前阶段不匹配时（如在 `01_specify` 阶段要求写代码），触发意图确认而非直接拒绝 |
| **复杂度** | 低 — Prompt 层面的增强，约 50-100 行 SKILL.md 修改 |
| **风险** | 极低 — 仅在检测到歧义时触发，不影响正常流程 |

---

### 11. 自迭代开发循环（Ralph Loop）

**对应 OmO 机制**: `/ralph-loop` / `/ulw-loop` — Agent 自驱动迭代直到发出 `<promise>DONE</promise>` 或达到上限

**解决 Spec-First 问题**: Gap 4（Skill 联调一致性）+ Risk 8（长任务需要多次手动触发）

#### OmO 做法

Ralph Loop 是 OmO 的自迭代执行引擎：

```
启动 /ralph-loop
  → Agent 执行一轮工作
  → 检查输出中是否包含 <promise>DONE</promise>
  → 未完成 → 持久化状态到 .sisyphus/ralph-loop.local.md
  → 自动启动下一轮（带完整上下文恢复）
  → 重复直到 DONE 或达到 max_iterations（默认 100）
```

**关键设计**：
- **崩溃恢复**：每轮结束后状态持久化，session 崩溃后可从断点恢复
- **显式完成信号**：不靠 idle 检测，而是要求 Agent 主动声明完成
- **迭代上限**：防止无限循环，默认 100 轮

#### Spec-First 现状

Spec-First 的 `orchestrate` skill 有编排循环，但：
- 每个 skill 调用是单次的——`/spec-first:code` 执行一个 TASK 后停止
- 用户需要反复调用 `/spec-first:orchestrate` 来推进多个 TASK
- 没有"自动迭代直到所有 TASK 完成"的模式
- `catchup` 提供崩溃恢复，但不提供自动续航

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P1（近期） |
| **落地方式** | 为 `orchestrate` skill 增加 `--auto` 模式 |
| **具体做法** | `orchestrate --auto` 进入自迭代模式：完成一个 TASK 后自动检查剩余 TASK，有则继续，无则推进到下一阶段；每轮迭代后更新 `stage-state.json`（崩溃恢复点）；设置 `max_iterations`（默认 20，可配置） |
| **复杂度** | 中 — 需要在 orchestrate skill 中增加循环控制逻辑 |
| **风险** | 中 — 需要与 Confirm Policy 配合，`strict` 模式下每轮仍需确认 |

---

### 12. 分层 Hook 架构（五层职责）

**对应 OmO 机制**: Session Hook（23）+ Tool-Guard Hook（10）+ Transform Hook（4）+ Continuation Hook（7）+ Skill Hook（2）

**解决 Spec-First 问题**: Gap 6（Hook 体系单薄）+ Risk 6（Hook 链脆弱性）

#### OmO 做法

OmO 将 46 个 Hook 分为 5 个职责层，每层关注不同的切面：

| 层 | 数量 | 职责 | 典型 Hook |
|----|------|------|-----------|
| Session | 23 | 会话生命周期、上下文注入、模型降级 | rules-injection, readme-injection, session-recovery |
| Tool-Guard | 10 | 工具执行前后的拦截与增强 | file-guard, hashline-enhancer, edit-error-recovery |
| Transform | 4 | 上下文变换、压缩、窗口监控 | preemptive-compaction, context-window-monitor |
| Continuation | 7 | 续航执行、停止守卫、后台通知 | todo-continuation-enforcer, stop-continuation-guard |
| Skill | 2 | Skill 级别的提醒与自动触发 | category-skill-reminder, auto-slash-command |

**核心优势**：
- **关注点分离**：每层 Hook 只处理一类问题，互不干扰
- **可选择性禁用**：通过 `config.disabled` 数组可精确禁用某个 Hook
- **组合式创建**：`createHooks()` 工厂按层组装，层间有明确的执行顺序

#### Spec-First 现状

Spec-First 的 Hook 体系相对简单：
- **AI Runtime Hook**：`session-start.js`（启动 stage viewer）、`session-end.js`
- **Git Hook**：`prepare-commit-msg.sh`、`commit-msg.sh`、`pre-push.sh`、`pre-commit.sh`
- 没有 Tool-Guard 层（无法拦截/增强工具调用）
- 没有 Continuation 层（无法自动续航）
- 没有 Transform 层（无法做上下文压缩/窗口监控）

#### 借鉴建议

| 项目 | 内容 |
|------|------|
| **优先级** | P2（中期） |
| **落地方式** | 将现有 Hook 重构为分层架构，逐步增加新层 |
| **具体做法** | Phase 1: 将现有 Hook 归类为 Session 层和 Git 层；Phase 2: 新增 Continuation 层（续航执行器）；Phase 3: 新增 Transform 层（上下文预算监控，与现有 context-slicing 集成） |
| **复杂度** | 高 — 需要重构 `tool-integration/` 模块，约 500-800 LOC |
| **风险** | 中 — 需要确保分层后的执行顺序与现有行为一致 |

---

## 总结映射表

| # | OmO 机制 | Spec-First Gap/Risk | 优先级 | 复杂度 | 落地层 |
|---|---------|---------------------|--------|--------|--------|
| 1 | Hashline Edit（哈希锚定编辑） | 编辑可靠性 | P2 | 中 | Phase Machine |
| 2 | Dynamic Prompt Building（动态 Prompt） | Gap 3 + Risk 2 | **P1** | 低 | SKILL.md + orchestrate |
| 3 | Category-Based Delegation（类别委派） | Risk 5 | P3 | 低 | config.yaml |
| 4 | Todo Continuation Enforcer（续航执行器） | Gap 4 + Risk 3 | **P1** | 中 | Phase Machine |
| 5 | Comment Checker（注释质量检查） | Gap 2 + Risk 1 | P2 | 低 | code skill |
| 6 | Safe Hook Creation（安全 Hook） | Risk 6 | **P1** | 极低 | tool-integration |
| 7 | Dual Completion Detection（双重完成检测） | Gap 4 + Risk 3 | P2 | 中 | Phase Machine |
| 8 | Hierarchical AGENTS.md（层级上下文） | Gap 1 + Risk 2 | P2 | 中 | init skill |
| 9 | Skill-Embedded MCP（内嵌 MCP） | Gap 5 + Risk 7 | P3 | 低 | SKILL.md |
| 10 | IntentGate（意图门控） | Risk 4 | P3 | 低 | orchestrate skill |
| 11 | Ralph Loop（自迭代循环） | Gap 4 + Risk 8 | **P1** | 中 | orchestrate skill |
| 12 | 分层 Hook 架构（五层职责） | Gap 6 + Risk 6 | P2 | 高 | tool-integration |

---

## 不适用 / 无需借鉴的部分

以下 OmO 机制对 Spec-First 不适用或已有更好的替代方案：

| OmO 机制 | 不借鉴原因 |
|---------|-----------|
| **多模型运行时切换** | Spec-First 定位为流程引擎，不应承担模型调度职责；模型选择应由宿主（Claude Code / Codex）负责 |
| **Tmux 子代理** | 交互式终端管理超出 Spec-First 的职责边界；Spec-First 的 skill 是声明式的，不需要持久终端会话 |
| **AST-Grep 集成** | Spec-First 不直接操作代码 AST，代码编辑由宿主的原生工具完成 |
| **LSP 工具集** | 同上，LSP 能力由宿主提供，Spec-First 不应重复实现 |
| **Background Agent 并发队列** | Spec-First 的 TASK 是顺序执行的（有依赖关系），FIFO 并发队列与其执行模型不匹配 |
| **11 Agent 体系** | Spec-First 的 19 Skill 已覆盖所有阶段需求，不需要引入独立 Agent 角色；Skill 比 Agent 更轻量、更可控 |
| **Claude Code 兼容层** | Spec-First 原生支持 Claude Code，不需要兼容层 |
| **平台二进制编译** | Spec-First 通过 npm 分发，不需要 Bun compile 的平台二进制 |
| **Zod v4 配置校验** | Spec-First 的 `config-schema.ts` 已有完善的校验逻辑，迁移到 Zod 收益不大 |

---

## 落地建议

### 第一阶段：P1 快速收益（1-2 周）

聚焦 4 个低复杂度、高收益的机制，立即提升 Spec-First 的执行可靠性：

**1. 安全 Hook 创建（要素 6）** — 最小改动，最大防御
- 为 `session-start.js`、`session-end.js` 增加 try-catch 包装
- Git hooks 增加 `set +e` 降级逻辑
- 预计工作量：0.5 天

**2. 动态 Prompt 组装（要素 2）** — 降低 Skill 维护成本
- 为 19 个 SKILL.md 增加结构化元数据（`triggers`、`stage_affinity`、`cost`、`dependencies`）
- 修改 `orchestrate` skill 的 P1_CONTEXT 阶段，动态读取元数据生成编排表
- 预计工作量：2-3 天

**3. Todo 续航执行器（要素 4）** — 解决 AI 中途放弃问题
- 修改 `phase-machine.ts`，P4_WRITE 后检查剩余 TASK
- 增加 `max_continuation`（默认 10）配置项
- 预计工作量：2 天

**4. 自迭代循环（要素 11）** — 解决多 TASK 需反复手动触发问题
- 为 `orchestrate` skill 增加 `--auto` 模式
- 每轮迭代后更新 `stage-state.json` 作为恢复点
- 预计工作量：2-3 天

### 第二阶段：P2 核心增强（3-4 周）

聚焦编辑可靠性和 Hook 体系升级：

**5. Hash 锚定编辑（要素 1）** — 消灭编辑腐蚀
- 新增 `file-fingerprint` 模块
- 集成到 `code` skill 的 P2→P4 流程
- 预计工作量：3-4 天

**6. AI 注释质量检查（要素 5）** — 提升代码质量
- 新增 `ai-slop-patterns.yaml`
- 集成到 `code` skill 的 P4_WRITE 后置检查
- 预计工作量：1-2 天

**7. 双重完成检测（要素 7）** — 消灭假完成
- 为每种 skill 定义最低完整性标准
- 集成到 Phase Machine 的 P4→P5 转换
- 预计工作量：2-3 天

**8. 层级化上下文生成（要素 8）** — 提升 AI 项目理解
- `init` skill 增加项目结构扫描
- `code` skill 的 P1_CONTEXT 自动加载局部上下文
- 预计工作量：3-4 天

**9. 分层 Hook 架构（要素 12）** — Hook 体系现代化
- 分三步重构：归类 → 增加 Continuation 层 → 增加 Transform 层
- 预计工作量：5-7 天

### 第三阶段：P3 远期演进（按需）

以下机制在当前版本中以声明式/配置式方式预埋，待生态成熟后激活：

- **类别化模型委派（要素 3）**：`config.yaml` 中预留 `models` 段
- **Skill 内嵌 MCP（要素 9）**：SKILL.md 中预留 `required_mcps` 字段
- **意图门控（要素 10）**：`orchestrate` skill 中增加阶段-指令匹配检测

---

## 附录：OmO 项目关键数据

| 指标 | 数值 |
|------|------|
| 版本 | v3.8.5 |
| 数据基线 | v3.8.5-7-g15519b95（dev） |
| 源文件数 | ~1,208 个 TypeScript 文件（全仓口径） |
| 代码量 | ~148,000 LOC（全仓 `.ts` 口径） |
| Agent 数 | 11（3 主 + 8 子） |
| Tool 数 | 26 |
| Hook 数 | 46（5 层） |
| 内置 Skill 数 | 6 |
| 内置 MCP 数 | 3 |
| 配置 Schema 文件 | 22+ |
| 平台支持 | 11 个编译目标 |
| 运行时 | Bun（非 Node.js） |
| 许可证 | SUL-1.0 |

---

> **结论**：OmO 与 Spec-First 是**正交互补**的关系。OmO 擅长"让 AI 稳定地写代码"，Spec-First 擅长"让 AI 按规范写代码"。借鉴 OmO 的执行可靠性工程（续航、完成检测、Hash 锚定、安全 Hook），可以显著提升 Spec-First 从"规范完备"到"交付可靠"的最后一公里。
