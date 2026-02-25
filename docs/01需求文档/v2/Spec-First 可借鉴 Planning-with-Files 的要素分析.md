# Spec-First 可借鉴 Planning-with-Files 的要素分析

> **版本**: v1.0 | **日期**: 2026-02-25 | **作者**: Leo (况雨平)
> **输入**: Planning-with-Files v2.10.0 + Spec-First v7.1 可行性评估
> **目标**: 识别 Planning-with-Files 中可直接借鉴到 Spec-First 的机制，映射到 v7.1 的 Gap/Risk，给出落地建议

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. PreToolUse Hook 注意力操控](#1-pretooluse-hook-注意力操控)
  - [2. 文件系统即外部记忆（Context = RAM, Filesystem = Disk）](#2-文件系统即外部记忆context--ram-filesystem--disk)
  - [3. 2-Action Rule 强制持久化](#3-2-action-rule-强制持久化)
  - [4. Stop Hook 完成度守门](#4-stop-hook-完成度守门)
  - [5. 3-Strike Error Protocol](#5-3-strike-error-protocol)
  - [6. 5-Question Reboot Test](#6-5-question-reboot-test)
  - [7. Session Recovery 自动恢复](#7-session-recovery-自动恢复)
  - [8. KV-Cache 优化原则](#8-kv-cache-优化原则)
- [总结映射表](#总结映射表)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议](#落地建议)
- [参考资料](#参考资料)

---

## 核心结论

**Planning-with-Files 的最大价值在于"上下文工程"（Context Engineering）——它不关心流程治理，只关心一件事：如何让 AI 在长任务中不丢失目标、不遗忘发现、不重复错误。**

这恰好补齐了 Spec-First 的一个盲区：Spec-First 在"流程应该怎么走"上极其完备（8+2 阶段 + Gate + GL），但在"AI 执行流程时如何保持注意力聚焦"上缺少机制。Planning-with-Files 提供的是**注意力层面的工程手段**，而非流程层面的规范。

两者的互补关系：

| 维度 | Planning-with-Files | Spec-First v7.1 | 互补关系 |
|------|-------------------|------------------|----------|
| 关注层面 | AI 注意力管理 + 上下文持久化 | 研发流程治理 + 质量门禁 | **正交互补** |
| 流程完整性 | 无（只有 3-7 个自由 Phase） | 8+2 阶段 + Gate + GL | Spec-First 远超 |
| 追踪与度量 | 无 ID 体系、无覆盖率 | 八类 ID + C1-C9 + H1 | Spec-First 远超 |
| 注意力操控 | 极强（PreToolUse Hook + 2-Action Rule） | 弱（无 Hook 级注意力刷新） | **PwF 远超** |
| 上下文恢复 | 自动检测 + catchup 脚本 | catchup skill + 三文件 | PwF 更自动化 |
| 错误追踪 | 文件级（Errors Encountered 表） | JSONL 级（gate-history） | 各有侧重 |
| 平台覆盖 | 15+ IDE | Claude Code 为主 | PwF 更广 |

---

## 项目对比概览

### Planning-with-Files（v2.10.0）

- **定位**: Manus 风格的文件化上下文工程框架，解决 AI Agent 长任务中的注意力衰减问题
- **核心理念**: Context Window = RAM（易失、有限），Filesystem = Disk（持久、无限）
- **灵感来源**: Manus（2025.12 被 Meta 以 $2B 收购）的上下文工程六原则
- **3-File Pattern**: `task_plan.md`（阶段追踪）+ `findings.md`（发现存储）+ `progress.md`（会话日志）
- **Hook 系统**: PreToolUse（注意力刷新）+ PostToolUse（进度提醒）+ Stop（完成度守门）
- **平台支持**: 15+ IDE（Claude Code / Cursor / Gemini CLI / Kiro / Continue / Codex 等）
- **技术栈**: Markdown + Bash/PowerShell + Python（session-catchup）

### Spec-First（v7.1）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **运行态三文件**: `task_plan.md` + `findings.md` + `progress.md`（与 PwF 命名一致，但用途更偏流程追踪）
- **Hook 系统**: 双层 Hook（AI Runtime + Git/CI），但无 PreToolUse 级注意力操控
- **平台支持**: Claude Code 为主

---

## 可借鉴要素详析

### 1. PreToolUse Hook 注意力操控

**对应 PwF 机制**: PreToolUse Hook — 在每次 Write/Edit/Bash/Read 操作前自动读取 `task_plan.md` 前 30 行

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定）+ Gap 4（Skill 联调一致性）

#### PwF 做法

```yaml
PreToolUse:
  - matcher: "Write|Edit|Bash|Read|Glob|Grep"
    hooks:
      - type: command
        command: "cat task_plan.md 2>/dev/null | head -30 || true"
```

原理（Manus Principle 4 — Manipulate Attention Through Recitation）：

```
上下文开头: [原始目标 — 距离远，已被遗忘]
...50+ 次工具调用...
上下文末尾: [刚刚读取的 task_plan.md — 获得注意力！]
```

AI 模型存在"lost in the middle"效应：上下文中间的信息容易被忽略，而开头和末尾的信息获得最多注意力。通过在每次工具调用前自动读取计划文件，目标和当前阶段被推到注意力窗口的末尾，从而保持聚焦。

#### Spec-First 当前状态

Spec-First 有 `/spec-first:catchup` 用于恢复上下文，但这是**一次性的主动操作**。在 04 Implement 阶段执行多个 TASK 时，随着工具调用次数增加，AI 对当前 TASK 的 AC、traces、约束条件的注意力会逐渐衰减。没有机制在每次代码操作前自动刷新"我正在做什么、验收标准是什么"。

#### 落地建议

在 `/spec-first:code` 的 Hook 配置中加入 PreToolUse 注意力刷新：

```yaml
PreToolUse:
  - matcher: "Write|Edit|Bash"
    hooks:
      - type: command
        command: |
          # 读取当前 TASK 的关键上下文
          if [ -f task_plan.md ]; then
            echo "=== 当前 TASK 上下文 ==="
            head -30 task_plan.md
          fi
```

刷新内容应包含：
- 当前 TASK ID + 标题
- 关联的 FR/NFR traces
- AC（验收标准）
- 当前阶段状态

这是**成本最低、效果最直接**的借鉴项：一个 Hook 配置，零代码改动，立即生效。

---

### 2. 文件系统即外部记忆（Context = RAM, Filesystem = Disk）

**对应 PwF 机制**: Manus Principle 3 — Filesystem as External Memory

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定导致重复劳动）

#### PwF 做法

核心公式：

```
Context Window = RAM（易失、有限）
Filesystem = Disk（持久、无限）

→ 任何重要的东西都写入磁盘。
```

PwF 将这个原则具体化为 Read vs Write 决策矩阵：

| 场景 | 动作 | 原因 |
|------|------|------|
| 刚写完一个文件 | 不要读 | 内容还在上下文中 |
| 查看了图片/PDF | 立即写 findings | 多模态内容 → 文本，防止丢失 |
| 浏览器返回数据 | 写入文件 | 截图不持久 |
| 开始新阶段 | 读计划/findings | 如果上下文过时则重新定向 |
| 发生错误 | 读相关文件 | 需要当前状态来修复 |
| 间隔后恢复 | 读所有计划文件 | 恢复状态 |

关键约束：**压缩必须可恢复** — 即使丢弃了网页内容，也要保留 URL；即使丢弃了文档内容，也要保留文件路径。永远不丢失指向完整数据的指针。

#### Spec-First 当前状态

Spec-First 已有运行态三文件（`task_plan.md/findings.md/progress.md`），但更偏向"流程追踪"而非"注意力管理"。可行性评估中 Context Pack 的设计（control < 2KB + references 按需读取）已体现了类似思想，但缺少 PwF 这样明确的 Read/Write 决策矩阵。

#### 落地建议

1. 在 `/spec-first:code` skill 中嵌入 Read/Write 决策矩阵，指导 AI 何时读、何时写运行态文件
2. 强化"压缩可恢复"原则：Context Pack 中丢弃的内容必须保留引用路径（文件路径、ID、URL）
3. 将 PwF 的"任何重要的东西都写入磁盘"原则应用到 findings.md：研究发现、技术决策、API 响应样本等必须持久化

---

### 3. 2-Action Rule 强制持久化

**对应 PwF 机制**: Critical Rule #2 — "After every 2 view/browser/search operations, IMMEDIATELY save key findings to text files."

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定）+ 04 Implement 阶段信息丢失

#### PwF 做法

```
2-Action Rule:
每执行 2 次浏览/搜索/查看操作后，
必须立即将关键发现写入文本文件。
```

这条规则的核心洞察：**多模态信息（图片、PDF、浏览器截图）在上下文压缩时会被丢弃**。如果 AI 查看了一张架构图、读了一个 PDF 文档，但没有将关键信息转化为文本写入 `findings.md`，那么一旦上下文被压缩，这些信息就永久丢失了。

2-Action Rule 是一个简单但有效的节奏约束：不允许连续做 3 次以上的"只读"操作而不持久化发现。

#### Spec-First 当前状态

Spec-First 在 01 Specify 和 02 Design 阶段会产生大量研究活动（竞品分析、技术调研、API 文档阅读），但没有强制的"研究 → 持久化"节奏约束。AI 可能连续读取多个文件、浏览多个网页，最终只在脑中（上下文中）保留模糊印象，而不写入 `findings.md`。

#### 落地建议

1. 在 `/spec-first:research` 和 `/spec-first:spec` skill 中嵌入 2-Action Rule：
   - 每执行 2 次 Read/WebFetch/WebSearch 操作后，必须更新 `findings.md`
   - 多模态内容（图片、PDF）必须在查看后立即转化为文本摘要写入文件
2. 在 `/spec-first:code` 中应用变体：每完成 2 个文件的修改后，更新 `progress.md` 中的进度记录
3. 配套反合理化条目："我记得刚才看到的内容" → 上下文会被压缩，记忆不可靠，写入文件

---

### 4. Stop Hook 完成度守门

**对应 PwF 机制**: Stop Hook — 在 AI 尝试结束会话时自动检查 `task_plan.md` 中所有 Phase 的完成状态

**解决 Spec-First 问题**: Risk 2（Gate 缺口导致误放行）+ Gap 1（GateEngine 自动条件解析未闭合）

#### PwF 做法

PwF 在 Stop Hook 中运行 `check-complete.sh` 脚本：

```bash
# 统计 task_plan.md 中的阶段状态
TOTAL=$(grep -c "### Phase" "$PLAN_FILE")
COMPLETE=$(grep -cF "**Status:** complete" "$PLAN_FILE")
IN_PROGRESS=$(grep -cF "**Status:** in_progress" "$PLAN_FILE")
PENDING=$(grep -cF "**Status:** pending" "$PLAN_FILE")

if [ "$COMPLETE" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    echo "ALL PHASES COMPLETE ($COMPLETE/$TOTAL)"
else
    echo "Task in progress ($COMPLETE/$TOTAL phases complete)"
    echo "$IN_PROGRESS phase(s) still in progress."
    echo "$PENDING phase(s) pending."
fi
```

当 AI 试图结束对话时，Stop Hook 自动报告："3/7 阶段完成，2 个进行中，2 个待开始"。AI 看到这个输出后，会意识到任务未完成，继续工作而非提前收工。

关键设计：**脚本始终 exit 0**（不阻断），但通过输出信息影响 AI 的决策。这是一种"软守门"——不强制阻止，而是让 AI 自己看到证据后做出正确判断。

#### Spec-First 当前状态

Spec-First 有 Gate 机制用于阶段推进校验，但 Gate 是**主动调用**的（`spec-first gate check`）。如果 AI 在 04 Implement 阶段执行完几个 TASK 后认为"差不多了"就尝试结束，没有自动机制提醒"还有 3 个 TASK 未完成"。

#### 落地建议

1. 在 `/spec-first:code` 和 `/spec-first:orchestrate` 的 Stop Hook 中加入完成度检查：
   - 自动读取 `task_plan.md` 中 TASK 的完成状态
   - 输出："TASK 完成 X/Y，未完成：TASK-003、TASK-005"
2. 在阶段推进场景中，Stop Hook 可额外检查 Gate 条件是否满足
3. 与 Superpowers 的"证据铁律"结合：Stop Hook 输出就是"完成度证据"，AI 不能忽视

---

### 5. 3-Strike Error Protocol

**对应 PwF 机制**: 3-Strike Error Protocol + Critical Rule #5（Log ALL Errors）+ Critical Rule #6（Never Repeat Failures）

**解决 Spec-First 问题**: 04 Implement / 05 Verify 阶段的错误处理质量

#### PwF 做法

```
ATTEMPT 1: Diagnose & Fix
  → 仔细阅读错误信息
  → 识别根因
  → 应用针对性修复

ATTEMPT 2: Alternative Approach
  → 同样的错误？换一种方法
  → 不同的工具？不同的库？
  → 绝不重复完全相同的失败操作

ATTEMPT 3: Broader Rethink
  → 质疑假设
  → 搜索解决方案
  → 考虑更新计划

AFTER 3 FAILURES: Escalate to User
  → 解释你尝试了什么
  → 分享具体错误
  → 请求指导
```

配套的错误日志表（嵌入 `task_plan.md`）：

```markdown
## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default config |
| API timeout | 2 | Added retry logic |
```

核心铁律：`if action_failed: next_action != same_action` — 追踪你尝试过的方法，变异你的方式。

#### Spec-First 当前状态

Spec-First 的 `gate-history.jsonl` 记录了 Gate 校验的历史结果，但在 TASK 执行层面缺少结构化的错误追踪。AI 在 `/spec-first:code` 执行中遇到编译错误或测试失败时，可能反复尝试相同的修复方式，没有"3 次失败后升级"的硬规则。

#### 落地建议

1. 在 `/spec-first:code` skill 中嵌入 3-Strike Protocol：
   - 同一错误修复 3 次失败 → 停止，向人类报告，请求指导
   - 每次修复尝试必须与前一次不同（`next_action != same_action`）
2. 在 `progress.md` 中维护错误追踪表：记录错误、尝试次数、解决方案
3. 与 Superpowers 的"系统化调试"结合：3-Strike 是升级阈值，系统化调试是每次尝试的方法论
