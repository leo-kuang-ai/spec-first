# Spec-First 可借鉴 Superpowers 的要素分析

> **版本**: v1.1 | **日期**: 2026-02-25 | **作者**: Leo (况雨平)
> **输入**: Superpowers v4.3.1 + Spec-First v7.1 可行性评估
> **目标**: 识别 Superpowers 中可直接借鉴到 Spec-First 的机制，映射到 v7.1 的 Gap/Risk，给出落地建议

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. 反合理化设计（Anti-Rationalization）](#1-反合理化设计anti-rationalization)
  - [2. 证据优先于声明（Evidence Before Claims）](#2-证据优先于声明evidence-before-claims)
  - [3. 批量执行 + 人工检查点（Batch + Checkpoint）](#3-批量执行--人工检查点batch--checkpoint)
  - [4. 两阶段审查（Spec Compliance → Code Quality）](#4-两阶段审查spec-compliance--code-quality)
  - [5. Session Hook 自动注入元技能](#5-session-hook-自动注入元技能)
  - [6. 新鲜上下文隔离（Fresh Context Per Task）](#6-新鲜上下文隔离fresh-context-per-task)
  - [7. 系统化调试流程（Systematic Debugging）](#7-系统化调试流程systematic-debugging)
  - [8. 描述陷阱防护（Description Trap）](#8-描述陷阱防护description-trap)
  - [9. 实施前隔离工作区（Worktree First）](#9-实施前隔离工作区worktree-first)
  - [10. Hook 跨平台稳健性（Hook Hardening）](#10-hook-跨平台稳健性hook-hardening)
- [总结映射表](#总结映射表)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议](#落地建议)

---

## 核心结论

**Superpowers 的最大价值不在流程设计（Spec-First 的 8+2 阶段已更完备），而在对 AI 行为的约束工程。**

它深刻理解 AI 会怎样"合理化"地跳过纪律，并用 Red Flags 表、Rationalization Tables、Iron Laws 系统性地封堵逃逸路径。这恰好是 Spec-First 从"规范完备"走向"交付可靠"最需要补齐的一环。

| 维度 | Superpowers | Spec-First v7.1 | 互补关系 |
|------|-------------|------------------|----------|
| 流程完整性 | 轻量（brainstorm→plan→execute→finish） | 重量级（8+2 阶段 + Gate + GL） | Spec-First 更强 |
| 追踪与度量 | 无 ID 体系、无覆盖率 | Feature+FR/DS/TASK/TC/RFC + C1-C9 + H1 | Spec-First 更强 |
| AI 行为约束 | 极强（反合理化 + 证据铁律 + Red Flags） | 弱（指令式 skill，缺乏逃逸封堵） | **Superpowers 更强** |
| 子代理编排 | 成熟（两阶段审查 + 新鲜上下文） | 有框架但联调未完成（Gap 4） | Superpowers 可借鉴 |
| 跨平台支持 | Claude Code / Cursor / Codex / OpenCode | Claude Code + Codex（双宿主） | Superpowers 更广 |

---

## 项目对比概览

### Superpowers（v4.3.1）

- **定位**: AI 编码助手的插件/技能框架，强制 AI 遵循纪律化开发流程
- **作者**: Jesse Vincent | **协议**: MIT
- **核心理念**: Skills 是强制的，不是建议；即使 1% 可能相关也必须加载
- **14 个技能**: 流程 7 + 质量 3 + 协作 3 + 元 1
- **技术栈**: Markdown（技能文档）+ JS/ES Modules（工具）+ Bash（钩子）
- **无 npm 依赖，纯文本驱动**

### Spec-First（v7.1）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **8+2 阶段**: Init → Specify → Design → Plan → Implement → Verify → Wrap-up → Release → done/cancelled
- **19 个 Skill**: 阶段 10 + 编排 3 + 辅助 6
- **技术栈**: TypeScript CLI + Markdown Skills + YAML Front Matter + JSONL 运行数据

---

## 可借鉴要素详析

### 1. 反合理化设计（Anti-Rationalization）

**对应 Superpowers 机制**: `using-superpowers` 元技能 + 各 skill 内置的 Red Flags 表与 Rationalization Prevention 表

**解决 Spec-First 问题**: Risk 4（迁移成本过高导致团队绕过流程）

#### Superpowers 做法

Superpowers 每个 skill 都内置两类防御表：

**Red Flags 表** — 当 AI 产生以下念头时，立即停止并回到流程：

| AI 的念头 | 现实 |
|-----------|------|
| "这只是个简单问题" | 问题也是任务，检查 skill |
| "我先需要更多上下文" | Skill 检查在澄清问题之前 |
| "让我先探索一下代码库" | Skill 告诉你如何探索，先检查 |
| "这不需要正式的 skill" | 如果 skill 存在，就使用它 |
| "这个 skill 太重了" | 简单的事情会变复杂，使用它 |
| "我先做这一件事" | 做任何事之前先检查 |

**Rationalization Prevention 表** — 针对 TDD skill 的示例：

| 借口 | 现实 |
|------|------|
| "太简单不需要测试" | 简单代码也会出错，测试只需 30 秒 |
| "我之后再测试" | 事后测试立即通过，什么都证明不了 |
| "删除 X 小时的工作太浪费" | 沉没成本谬误，保留未验证代码才是技术债 |
| "TDD 太教条了，我更务实" | TDD 本身就是务实的：比事后调试更快 |
| "先保留作参考，再写测试" | 你会适配它，那就是事后测试，删除就是删除 |

#### Spec-First 当前状态

Spec-First 的 skill 更偏"指令式"——告诉 AI 该做什么，但没有预防 AI 不做什么。例如 `/spec-first:verify` 告诉 AI 执行验证，但没有封堵"这个改动太小不需要 verify"的逃逸路径。

#### 落地建议

在以下关键 skill 中加入反合理化表：

**`/spec-first:code` 反合理化表**:

| AI 的借口 | 封堵 |
|-----------|------|
| "这个改动太小，不需要走 code-review" | 小改动也有回归风险，review 耗时 < 2 分钟 |
| "我已经手动检查过了" | 手动检查 ≠ 自动校验证据 |
| "先写完再补测试" | 事后测试证明不了什么，TDD 先行 |
| "这只是重构，不影响功能" | 重构不改行为 ≠ 重构不引入 bug |

**`/spec-first:verify` 反合理化表**:

| AI 的借口 | 封堵 |
|-----------|------|
| "Gate 已经人工确认过了" | 人工确认 ≠ 自动校验证据链 |
| "上一轮 verify 通过了，这次只改了一点" | 增量改动需要增量验证 |
| "测试全绿就够了" | 测试通过 ≠ 覆盖率达标 ≠ 合规率达标 |

**`/spec-first:spec` 反合理化表**:

| AI 的借口 | 封堵 |
|-----------|------|
| "需求很清楚，不需要澄清" | 你认为清楚 ≠ 无歧义，检查 NEEDS CLARIFICATION 项 |
| "AC 用自然语言就够了" | 自然语言 AC 无法自动转化为测试用例 |

---

### 2. 证据优先于声明（Evidence Before Claims）

**对应 Superpowers 机制**: `verification-before-completion` skill

**解决 Spec-First 问题**: Gap 1（M3 GateEngine 自动条件解析未闭合）+ Risk 2（Gate 缺口导致误放行）

#### Superpowers 做法

铁律（Iron Law）：

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

五步 Gate Function：

1. **IDENTIFY**: 什么命令能证明这个声明？
2. **RUN**: 执行完整命令（新鲜的、完整的）
3. **READ**: 完整输出，检查退出码，计数失败项
4. **VERIFY**: 输出是否确认了声明？
5. **ONLY THEN**: 发出声明

配套 Common Failures 表：

| 声明 | 需要的证据 | 不充分的证据 |
|------|-----------|-------------|
| 测试通过 | 测试命令输出: 0 failures | 上一次运行、"应该通过" |
| Linter 干净 | Linter 输出: 0 errors | 部分检查、外推 |
| 构建成功 | 构建命令: exit 0 | Linter 通过、日志看起来没问题 |
| Bug 已修复 | 测试原始症状: 通过 | 代码改了、假设修好了 |
| 需求满足 | 逐行检查清单 | 测试通过 |

#### Spec-First 当前状态

M3 GateEngine 自动条件解析未完全闭合，AI 可能"声称 Gate 通过"而没有实际执行 `spec-first gate check`。可行性评估已识别此风险为 🔴 高。

#### 落地建议

在 `/spec-first:verify` 和阶段推进相关 skill 中强制要求：**先执行 `spec-first gate check`，贴出完整输出，再声称阶段通过**。禁止使用 "should pass"、"looks good"、"已完成" 等无证据表述。

适配 Spec-First 的 Common Failures 表：

| 声明 | 需要的证据 | 不充分的证据 |
|------|-----------|-------------|
| Gate 通过 | `spec-first gate check` 输出: PASS | "我检查过了"、"应该没问题" |
| 覆盖率达标 | `spec-first metrics coverage` 输出: C1-C9 ≥ 阈值 | "所有 FR 都有对应 TASK" |
| 阶段可推进 | `spec-first verify full` 输出: 全部条件满足 | "上一轮通过了" |
| TASK 完成 | 测试命令输出 + code-review 通过 | "代码写完了" |
| Feature 可归档 | `spec-first gate check` + 矩阵闭环证据 | "所有 TASK 都标记完成了" |

在 Gate 输出中强制展示"判定证据链"（失败条目映射到具体 ID + 修复建议），与可行性评估 P0 行动项 #4 对齐。

---

### 3. 批量执行 + 人工检查点（Batch + Checkpoint）

**对应 Superpowers 机制**: `executing-plans` skill

**解决 Spec-First 问题**: 04 Implement 阶段节奏控制，对齐 `confirm_policy=strict`

#### Superpowers 做法

`executing-plans` 采用明确的批量 + 检查点节奏：

```
Step 1: 加载计划，批判性审查，有疑问先提出
Step 2: 执行批次（默认前 3 个任务）
Step 3: 报告（已实现内容 + 验证输出 + "Ready for feedback."）
Step 4: 根据反馈调整，执行下一批次
Step 5: 全部完成后，调用 finishing-a-development-branch skill
```

关键设计：
- **默认 3 个任务一批**，不是全部一口气执行
- 批次间**强制暂停等待反馈**，不自行继续
- 遇到阻塞**立即停止并求助**，不猜测

#### Spec-First 当前状态

`/spec-first:code` 是逐 TASK 执行，`/spec-first:orchestrate` 负责编排，但缺少明确的"批量 + 检查点"节奏定义。对于 Size M/L 的 Feature（多 TASK），人类容易失去对进度的掌控感。

#### 落地建议

1. 在 `/spec-first:orchestrate` 中引入 batch checkpoint 机制：
   - Size S: 每 2-3 个 TASK 暂停报告
   - Size M: 每 2 个 TASK 暂停报告
   - Size L: 每个 TASK 暂停报告
2. 每次暂停时输出：已完成 TASK 列表 + 验证结果 + 覆盖率变化 + 下一批次预览
3. 与 `confirm_policy=strict` 策略天然对齐：批次间的暂停就是 strict 确认点
4. 加入"遇到阻塞立即停止"规则：缺少依赖 → 停止；测试反复失败 → 停止；指令不清 → 停止；**不猜测，不强行推进**

---

### 4. 两阶段审查（Spec Compliance → Code Quality）

**对应 Superpowers 机制**: `subagent-driven-development` skill 的两阶段 review

**解决 Spec-First 问题**: 强化 `/spec-first:code-review` 审查效率与合规率

#### Superpowers 做法

每个 TASK 完成后，依次经过两个独立审查者：

```
实现者完成 + 自审
    ↓
Stage 1: Spec Compliance Reviewer（规格合规审查）
  - 独立读取实际代码（不信任实现者报告）
  - 检查：是否匹配 spec？是否多做了？是否少做了？
  - 不通过 → 实现者修复 → 重新审查
    ↓ 通过后才进入
Stage 2: Code Quality Reviewer（代码质量审查）
  - 检查：代码是否干净、可测试、可维护？
  - 不通过 → 实现者修复 → 重新审查
    ↓ 通过
标记 TASK 完成
```

关键设计：
- **Stage 1 不通过，不进入 Stage 2** — 在不合规的代码上做质量审查是浪费
- **审查者显式不信任实现者的自审报告** — 独立验证
- **审查循环直到通过** — 不接受"差不多就行"

#### Spec-First 当前状态

`/spec-first:code-review` 当前是 A/B 九维度一次性审查（准确性、性能、安全性、可维护性等），没有区分"合规性"和"质量"两个层次。

#### 落地建议

1. 将 code-review 拆为两轮：
   - **第一轮（合规审查）**: 对照 `spec.md` + `task_plan.md` 的 AC，逐条校验实现是否匹配
   - **第二轮（质量审查）**: 仅在合规通过后执行九维度质量审查
2. 第一轮不通过则不进入第二轮，节省审查资源
3. 这与可行性评估中"C7/C8/C9 未达 100% 时不讨论提速"的原则一致：先确保"做对了"，再确保"做好了"

---

### 5. Session Hook 自动注入元技能

**对应 Superpowers 机制**: `hooks/session-start` + `using-superpowers` 元技能 + Graphviz 决策流程图

**解决 Spec-First 问题**: Gap 4（Skill 体系"定义完成"与"联调完成"仍有差距）

#### Superpowers 做法

通过 `hooks/session-start` 在每次会话启动时自动注入 `using-superpowers` 元技能，包裹在 `<EXTREMELY_IMPORTANT>` 标签中。该元技能包含一个 Graphviz 决策流程图：

```
用户消息到达
    ↓
是否有 skill 可能适用？ ──(即使 1%)──→ 调用 Skill 工具
    │                                      ↓
    │                              宣布："使用 [skill] 来 [目的]"
    │                                      ↓
    │                              有检查清单？→ 创建 TodoWrite
    │                                      ↓
    │                              严格遵循 skill
    ↓ (绝对不适用)
直接响应
```

确保 AI **从第一条消息起就知道必须检查 skill**，而不是靠 AI 自行判断。

#### Spec-First 当前状态

Spec-First 已有类似机制（skill 体系 + hooks），但可行性评估 Gap 4 指出"19 个 Skill 定义完成与联调完成仍有差距"。当前 AI 在收到消息时，skill 路由依赖 AI 自行判断，缺少强制性的决策树。

#### 落地建议

1. 确保 session hook 注入的 bootstrap 内容包含 **skill 优先级路由表**
2. 路由表应覆盖常见意图到 skill 的映射：
   - "开始新 Feature" → `/spec-first:init`
   - "写需求" → `/spec-first:spec`
   - "设计" → `/spec-first:design`
   - "拆任务" → `/spec-first:task`
   - "写代码" → `/spec-first:code`
   - "审查" → `/spec-first:code-review`
   - "验证" → `/spec-first:verify`
   - "恢复上下文" → `/spec-first:catchup`
3. 加入 Superpowers 的"1% 规则"：即使只有 1% 可能相关，也必须先调用 skill 检查

---

### 6. 新鲜上下文隔离（Fresh Context Per Task）

**对应 Superpowers 机制**: `subagent-driven-development` 的 fresh subagent per task 模式

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定导致重复劳动）

#### Superpowers 做法

每个 TASK 启动全新的 subagent，由控制器（orchestrator）提供：
- TASK 全文（从计划中提取，不让 subagent 自己读文件）
- 必要的场景上下文（当前 TASK 在整体计划中的位置）
- 不传递前一个 TASK 的执行历史

优势：
- 无上下文污染（前一个 TASK 的错误假设不会传播）
- 控制器精确策展上下文（而非让 subagent 自己摸索）
- 并行安全（subagent 之间不干扰）

#### Spec-First 当前状态

Risk 3 指出 M5 漂移导致 `catchup/context` 不稳定，AI 重复分析与遗漏追踪链。运行态三文件（`task_plan.md/findings.md/stage-state.json`）是上下文连续性的最小集合，但在多 TASK 执行中，上下文膨胀仍是问题。

#### 落地建议

1. 对于 Size M/L 的多 TASK 执行，每个 TASK 的 subagent 只接收：
   - 当前 TASK 全文（从 `task_plan.md` 提取）
   - 相关 spec 片段（仅与当前 TASK traces 关联的 FR/NFR）
   - 必要的设计上下文（仅相关的 DS/API 定义）
2. 不传递前一个 TASK 的完整执行日志
3. 这与 Spec-First 的 Context Pack "control < 2KB + references 按需读取" 原则天然对齐

---

### 7. 系统化调试流程（Systematic Debugging）

**对应 Superpowers 机制**: `systematic-debugging` skill（四阶段根因分析）

**解决 Spec-First 问题**: 04 Implement / 05 Verify 阶段遇到问题时的调试质量

#### Superpowers 做法

铁律：

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

四阶段流程：

| 阶段 | 关键活动 | 成功标准 |
|------|---------|---------|
| 1. 根因调查 | 读错误信息、复现、检查近期变更、追踪数据流 | 理解 WHAT 和 WHY |
| 2. 模式分析 | 找到工作的类似代码、对比差异 | 识别差异点 |
| 3. 假设验证 | 形成单一假设、最小化测试、一次只改一个变量 | 假设确认或新假设 |
| 4. 实现修复 | 创建失败测试、实现单一修复、验证 | Bug 解决、测试通过 |

硬规则：**3 次修复失败 → 停止修复，质疑架构**

```
修复次数 < 3: 返回阶段 1，用新信息重新分析
修复次数 ≥ 3: 停止！这不是失败的假设，这是错误的架构
              → 与人类讨论后再继续
```

#### Spec-First 当前状态

Spec-First 当前没有专门的 debugging skill。在 04 Implement 和 05 Verify 阶段遇到测试失败或构建问题时，AI 的调试行为是无约束的——可能随机尝试修复、跳过根因分析、或在同一个错误方向上反复尝试。

#### 落地建议

1. 在 `/spec-first:code` 的异常处理路径中嵌入轻量级调试指导：
   - 测试失败 → 先读完整错误信息 → 复现 → 根因分析 → 再修复
   - 不允许在没有根因分析的情况下提交修复
2. 引入"3 次修复失败"硬规则：连续 3 次修复同一问题失败 → 停止，向人类报告，讨论是否需要调整设计
3. 配套反合理化表：

| AI 的借口 | 封堵 |
|-----------|------|
| "快速修一下，之后再调查" | 快速修复掩盖根因，系统化调试更快 |
| "我看到问题了，让我直接修" | 看到症状 ≠ 理解根因 |
| "同时改多处，一起测试" | 无法隔离哪个改动有效，会引入新 bug |
| "再试一次修复" (已失败 2+ 次) | 3 次失败 = 架构问题，停止修复，质疑设计 |

---

### 8. 描述陷阱防护（Description Trap）

**对应 Superpowers 机制**: `writing-skills` 中明确记录的 Description Trap 经验

**解决 Spec-First 问题**: Gap 4（Skill 定义完成但执行一致性不足）

#### Superpowers 做法

Superpowers 在 v4.0.0 迭代中明确发现：**若 skill 的 front matter `description` 写了流程摘要，模型会直接按描述执行，而不读完整 SKILL 正文**。  
因此约束为：`description` 只写触发条件（Use when X），不写流程步骤。

#### Spec-First 当前状态

Spec-First 当前多数 skill 的描述较短，方向是对的；但后续演进若把流程细节塞入 description，容易复现“看 description 不看正文”的偏差，导致阶段守卫、确认策略、证据链要求被绕过。

#### 落地建议

1. 制定 Skill 描述规范：**触发条件 only**，禁止在 description 中写执行流程、策略摘要、捷径提示
2. 在 Skill 评审清单中加入“Description Trap”检查项（P0）
3. 对 19 个 Skill 做一次 description 巡检，发现流程化描述立即收敛到正文

---

### 9. 实施前隔离工作区（Worktree First）

**对应 Superpowers 机制**: `executing-plans` 与 `subagent-driven-development` 将 `using-git-worktrees` 设为 REQUIRED

**解决 Spec-First 问题**: 实施阶段分支污染与误操作风险（尤其是多 TASK 连续执行时）

#### Superpowers 做法

Superpowers 在实现流中把 worktree 隔离前置为必需步骤：先进入隔离工作区，再执行计划与子代理编排，避免直接在主分支推进实现。

#### Spec-First 当前状态

Spec-First 已有阶段化流程与 Gate，但在 skill 层尚未把“隔离工作区”提升为统一前置守卫。团队执行时仍可能在主工作区直接开发，放大并发改动和回滚成本。

#### 落地建议

1. 在 `/spec-first:code`、`/spec-first:orchestrate` 增加“工作区安全前置检查”段
2. 明确默认策略：建议使用 feature 分支/worktree；若在主分支执行，必须显式确认
3. 把该项纳入 code 阶段反合理化表：禁止“先改再分支”

---

### 10. Hook 跨平台稳健性（Hook Hardening）

**对应 Superpowers 机制**: `session-start` + `run-hook.cmd` + 多版本跨平台修复（Windows/async/sync/polyglot wrapper）

**解决 Spec-First 问题**: 宿主注入链在不同 OS/终端环境下不稳定，导致首轮会话无法加载约束

#### Superpowers 做法

Superpowers 针对 Hook 注入做了持续硬化：  
- SessionStart 注入 `using-superpowers` 作为首轮上下文  
- 使用 polyglot wrapper 兼容 Windows 与 Unix  
- 针对 async/sync 时序问题按平台修正，降低“首条消息未注入”的概率

#### Spec-First 当前状态

Spec-First 已具备宿主配置与 hooks 能力，但在“跨平台时序/路径/解释器差异”方面的防御仍可加强。若 bootstrap 注入失效，skill 路由纪律会显著退化。

#### 落地建议

1. 为 session 级注入链补充跨平台回归用例（Linux/macOS/Windows）
2. 在 `doctor` 输出中增加“Session hook 可达性 + 首轮注入有效性”诊断项
3. 对 hooks 执行路径做 wrapper 化与降级策略（失败时提示、不中断主流程）

---

## 总结映射表

| # | Superpowers 机制 | 映射到 Spec-First 位置 | 解决的 Gap/Risk | 优先级 |
|---|-----------------|----------------------|----------------|--------|
| 1 | 反合理化设计（Red Flags + Rationalization Tables） | 各阶段 skill 内嵌 | Risk 4: 绕流程 | P0 |
| 2 | 证据优先于声明（Iron Law + Common Failures） | `/spec-first:verify` + Gate 流程 | Gap 1 + Risk 2: Gate 可信度 | P0 |
| 3 | 批量执行 + 检查点（Batch 3 + Checkpoint） | `/spec-first:orchestrate` | 04 阶段节奏控制 | P1 |
| 4 | 两阶段审查（Spec Compliance → Code Quality） | `/spec-first:code-review` | 审查效率与合规率 | P1 |
| 5 | Session Hook 决策树（元技能 + 1% 规则） | bootstrap + skill 路由 | Gap 4: Skill 联调一致性 | P1 |
| 6 | 新鲜上下文隔离（Fresh Context Per Task） | 多 TASK subagent 模式 | Risk 3: 上下文不稳定 | P2 |
| 7 | 系统化调试（四阶段 + 3 次失败硬规则） | `/spec-first:code` 异常路径 | 04/05 阶段调试质量 | P2 |
| 8 | Description Trap 防护（description 仅触发，不写流程） | 全部 Skill Front Matter 规范 | Gap 4: Skill 执行一致性 | P0 |
| 9 | Worktree First（实现前隔离工作区） | `/spec-first:code` + `/spec-first:orchestrate` 前置守卫 | 实施阶段误操作/分支污染风险 | P1 |
| 10 | Hook Hardening（跨平台 wrapper + 时序兜底） | setup/update/doctor + session 注入链 | 宿主注入链稳定性风险 | P1 |

---

## 不适用 / 无需借鉴的部分

以下 Superpowers 机制在 Spec-First 中已有更好的替代方案，无需借鉴：

| Superpowers 机制 | 不借鉴原因 | Spec-First 已有替代 |
|-----------------|-----------|-------------------|
| Brainstorming skill | Superpowers 的头脑风暴是轻量级的自由讨论 | Spec-First 01 Specify 阶段更结构化，有 Feature+FR/DS/TASK/TC/RFC 追踪 + AC + 矩阵 |
| Writing-plans skill | Superpowers 的计划是 Markdown 自由格式 | Spec-First 03 Plan 有 YAML Front Matter + 依赖/并行调度 + TASK ID 体系 |
| Using-git-worktrees skill | Superpowers 用 worktree 做隔离 | Spec-First 可按需使用，但不是核心流程依赖 |
| Finishing-a-development-branch skill | Superpowers 的分支收尾是 4 选项（merge/PR/keep/discard） | Spec-First 06 Wrap-up + 07 Release 更完整，有归档 + 复盘 + 矩阵闭环 |
| Writing-skills skill（TDD for skills） | Superpowers 用 TDD 方法论写新 skill | Spec-First 的 skill 体系已有自己的设计规范和联调验收流程 |
| 跨平台插件系统 | Superpowers 支持 Cursor/Codex/OpenCode | Spec-First 已覆盖 Claude Code + Codex；更多宿主（如 Cursor/OpenCode）仍是 P2+ 优先级 |

---

## 落地建议

### 实施路径（对齐可行性评估行动清单）

```text
Week 1-2 (P0):  反合理化表 + 证据铁律 → 嵌入 /spec-first:code、verify、spec skill
                 ↓ 最小改动，最大约束力提升
Week 3-4 (P1):  批量检查点 + 两阶段审查 + skill 路由表 → 升级 orchestrate、code-review
                 ↓ 流程节奏与审查质量提升
Week 5-8 (P2):  上下文隔离 + 调试流程 → 优化 subagent 模式、补充调试指导
                 ↓ 规模化执行稳定性提升
```

### P0 具体行动项

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 在 `/spec-first:code` skill 中加入反合理化表 | 1 个 skill 文件 | 0.5 天 | 封堵"跳过 review/测试"的逃逸路径 |
| 2 | 在 `/spec-first:verify` skill 中加入证据铁律 | 1 个 skill 文件 | 0.5 天 | Gate 声明必须附带执行证据 |
| 3 | 在 `/spec-first:spec` skill 中加入反合理化表 | 1 个 skill 文件 | 0.5 天 | 封堵"跳过澄清/AC 结构化"的逃逸路径 |
| 4 | 制定 Spec-First Common Failures 表 | 新增文档片段 | 0.5 天 | 统一"什么算证据、什么不算"的标准 |
| 5 | 建立 Skill description 规范（触发条件 only）并巡检 19 个 Skill | skill front matter | 0.5 天 | 避免 Description Trap 导致流程失真 |

### P1 补充行动项（v1.1 新增）

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 在 `/spec-first:code`、`/spec-first:orchestrate` 增加 Worktree First 前置守卫 | 2 个 skill + 1 个运行时检查 | 1 天 | 降低主分支误操作与并发污染风险 |
| 2 | 为 Session Hook 注入链补跨平台回归（含时序场景） | hooks/setup/update/doctor + 测试脚本 | 1-2 天 | 降低首轮注入失效概率，提升稳定性 |

### 实施原则

1. **最小侵入**: 借鉴的核心是在现有 skill 中追加约束段落（反合理化表、证据铁律），不改变 skill 的主流程结构
2. **渐进验证**: 先在 Daily Path（plan → code → code-review → verify）上验证效果，再推广到全阶段
3. **量化反馈**: 通过 v7.1 已有的 C7/C8/C9 合规率指标，量化"加入约束前后"的 AI 流程遵从率变化
4. **不追求完美**: Superpowers 的 14 个 skill 经过多版本迭代才达到当前成熟度，Spec-First 应先落地 P0 项，再根据实际效果迭代

### 与可行性评估行动清单的对齐

| 可行性评估行动项 | 本文对应借鉴要素 | 协同关系 |
|----------------|----------------|---------|
| P0 #3: 跑通 Daily Path 端到端 | 要素 1（反合理化）+ 要素 2（证据铁律） | 在 Daily Path 试点中同步验证约束效果 |
| P0 #3: 跑通 Daily Path 端到端 | 要素 8（Description Trap 防护） | 确保 skill 描述不抢夺流程控制权 |
| P0 #4: Gate 证据化输出 | 要素 2（证据优先于声明） | 直接落地 Common Failures 表 |
| P1 #8: 19 个 Skill 联调验收 | 要素 5（Session Hook 决策树） | 联调时同步验证 skill 路由一致性 |
| P1 #8: 19 个 Skill 联调验收 | 要素 8（Description Trap）+ 要素 9（Worktree First） | 同步检查描述规范与实施前隔离守卫 |
| P1 #6: M3 Gate 自动条件解析 | 要素 2（证据铁律） | Gate 自动化闭合前，证据铁律作为人工兜底补充 |
| P2 #11: Gate/SCA/Skill 回归测试集 | 要素 10（Hook Hardening） | 将跨平台 hook 注入稳定性纳入回归基线 |
| P2 #11: Gate/SCA/Skill 回归测试集 | 要素 1-7 全部 | 回归测试应覆盖"AI 是否遵循约束"的场景 |

---

## 参考资料

| 来源 | 路径/链接 | 用途 |
|------|----------|------|
| Superpowers 项目 | https://github.com/obra/superpowers (v4.3.1) | 本文分析对象 |
| Superpowers Release Notes | `superpowers/RELEASE-NOTES.md` | v4.x 机制演进依据（Description Trap / Hook Hardening / Two-stage Review） |
| using-superpowers skill | `superpowers/skills/using-superpowers/SKILL.md` | 反合理化设计参考 |
| verification-before-completion skill | `superpowers/skills/verification-before-completion/SKILL.md` | 证据铁律参考 |
| executing-plans skill | `superpowers/skills/executing-plans/SKILL.md` | 批量检查点参考 |
| subagent-driven-development skill | `superpowers/skills/subagent-driven-development/SKILL.md` | 两阶段审查 + 上下文隔离参考 |
| systematic-debugging skill | `superpowers/skills/systematic-debugging/SKILL.md` | 调试流程参考 |
| test-driven-development skill | `superpowers/skills/test-driven-development/SKILL.md` | TDD 反合理化表参考 |
| SessionStart Hook | `superpowers/hooks/session-start` + `superpowers/hooks/run-hook.cmd` + `superpowers/hooks/hooks.json` | 会话注入与跨平台兼容实现参考 |
| Spec-First v7.1 可行性评估 | `docs/01需求文档/v2/可行性评估.md` | Gap/Risk 映射依据 |

---

> **文档状态**: v1.1（补充 Description Trap / Worktree First / Hook Hardening） | 待 Leo 审核后纳入 v7.1 行动清单
