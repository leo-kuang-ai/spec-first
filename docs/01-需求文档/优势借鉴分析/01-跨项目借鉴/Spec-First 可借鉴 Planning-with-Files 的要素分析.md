# Spec-First 可借鉴 Planning-with-Files 的要素分析

> **版本**: v1.2 | **日期**: 2026-02-25 | **作者**: Leo (况雨平)
> **输入**: Planning-with-Files v2.16.0 + Spec-First v7.1 可行性评估
> **目标**: 识别 Planning-with-Files 中可直接借鉴到 Spec-First 的机制，映射到 v7.1 的 Gap/Risk，给出落地建议
> **变更说明**: 修正作者名（OthmanAdi）、调整 Stop Hook 优先级为 P0、补充 Prompt-based Hooks 与 Claude Code Plan Mode 协同分析

---

## 目录

- [核心结论](#核心结论)
- [项目对比概览](#项目对比概览)
- [版本差异重标（v2.10.0 → v2.16.0）](#版本差异重标v2100--v2160)
- [可借鉴要素详析](#可借鉴要素详析)
  - [1. PreToolUse Hook 注意力操控](#1-pretooluse-hook-注意力操控)
  - [2. 文件系统即外部记忆（Context = RAM, Filesystem = Disk）](#2-文件系统即外部记忆context--ram-filesystem--disk)
  - [3. 2-Action Rule 强制持久化](#3-2-action-rule-强制持久化)
  - [4. Stop Hook 完成度守门](#4-stop-hook-完成度守门) ⬆️ 优先级调整为 P0
  - [5. 3-Strike Error Protocol](#5-3-strike-error-protocol)
  - [6. 5-Question Reboot Test](#6-5-question-reboot-test)
  - [7. Session Recovery 自动恢复](#7-session-recovery-自动恢复) ⬆️ 优先级调整为 P1
  - [8. KV-Cache 优化原则](#8-kv-cache-优化原则)
  - [9. PostToolUse Hook 进度同步](#9-posttooluse-hook-进度同步) 🆕 新增
  - [10. Context Reduction 分层压缩](#10-context-reduction-分层压缩) 🆕 新增
  - [11. 与 Claude Code Plan Mode 协同](#11-与-claude-code-plan-mode-协同) 🆕 新增
- [总结映射表（更新）](#总结映射表更新)
- [不适用 / 无需借鉴的部分](#不适用--无需借鉴的部分)
- [落地建议（更新）](#落地建议更新)
- [参考资料（修正）](#参考资料修正)

---

## 核心结论

**Planning-with-Files 的最大价值在于"上下文工程"（Context Engineering）——它不关心流程治理，只关心一件事：如何让 AI 在长任务中不丢失目标、不遗忘发现、不重复错误。**

这恰好补齐了 Spec-First 的一个盲区：Spec-First 在"流程应该怎么走"上极其完备（8+2 阶段 + Gate + GL），但在"AI 执行流程时如何保持注意力聚焦"上缺少机制。Planning-with-Files 提供的是**注意力层面的工程手段**，而非流程层面的规范。

两者的互补关系：

| 维度 | Planning-with-Files | Spec-First v7.1 | 互补关系 |
|------|-------------------|------------------|----------|
| 关注层面 | AI 注意力管理 + 上下文持久化 | 研发流程治理 + 质量门禁 | **正交互补** |
| 流程完整性 | 无（只有 3-7 个自由 Phase） | 8+2 阶段 + Gate + GL | Spec-First 远超 |
| 追踪与度量 | 无 ID 体系、无覆盖率 | Feature+FR/DS/TASK/TC/RFC + C1-C9 + H1 | Spec-First 远超 |
| 注意力操控 | 极强（PreToolUse Hook + 2-Action Rule） | 弱（无 Hook 级注意力刷新） | **PwF 远超** |
| 上下文恢复 | 自动检测 + catchup 脚本 | catchup skill + 三文件 | PwF 更自动化 |
| 错误追踪 | 文件级（Errors Encountered 表） | JSONL 级（gate-history） | 各有侧重 |
| 平台覆盖 | 15+ IDE | Claude Code + Codex（双宿主） | PwF 更广 |

---

## 项目对比概览

### Planning-with-Files（v2.16.0）

- **定位**: Manus 风格的文件化上下文工程框架，解决 AI Agent 长任务中的注意力衰减问题
- **作者**: [OthmanAdi](https://github.com/OthmanAdi) — ⚠️ 早期版本曾错误引用为 "abzhaw"
- **仓库**: https://github.com/OthmanAdi/planning-with-files
- **核心理念**: Context Window = RAM（易失、有限），Filesystem = Disk（持久、无限）
- **灵感来源**: Manus（2025.12 被 Meta 以 $2B 收购）的上下文工程六原则
- **3-File Pattern**: `task_plan.md`（阶段追踪）+ `findings.md`（发现存储）+ `progress.md`（会话日志）
- **Hook 系统**: PreToolUse（注意力刷新）+ PostToolUse（进度提醒）+ Stop（完成度守门）
- **平台支持**: 15+ IDE（Claude Code / Cursor / Gemini CLI / Kiro / Continue / Codex / GitHub Copilot 等）
- **技术栈**: Markdown + Bash/PowerShell + Hooks（JSON 配置）
- **近期演进**:
  - v2.11: 新增 `/plan` 命令
  - v2.15: 新增 `/plan:status` 快速进度检查
  - v2.15.1: 修复 Session catchup 误报问题
  - v2.16: 新增 GitHub Copilot hooks 支持

### Spec-First（v7.1）

- **定位**: 规范驱动研发流程引擎（Skill 编排 + CLI 执行）
- **核心理念**: 先规范、再生成、后验证；Gate 驱动生成（GDG）
- **运行态三文件**: `task_plan.md` + `findings.md` + `stage-state.json`（与 PwF 命名相似，但用途更偏流程追踪）
- **Hook 系统**: 三类 Hook（AI Runtime + Session + Git），但无统一注意力刷新策略
- **平台支持**: Claude Code + Codex（双宿主）

---

## 版本差异重标（v2.10.0 → v2.16.0）

| 维度 | v2.10.0（历史基线） | v2.16.0（当前口径） | 对本文结论影响 |
|------|---------------------|--------------------|----------------|
| 覆盖平台 | 新增 Kiro 支持 | 扩展至 15 平台，含 GitHub Copilot | **增强**“跨平台适配能力强”判断 |
| 命令可用性 | `/planning-with-files:start` 为主 | 增加 `/plan` 与 `/plan:status` | 强化“可操作性/可观测性” |
| Session Recovery | 初版能力可用 | 误报修复（v2.15.1），稳定性提升 | “可借鉴”优先级维持，落地风险下降 |
| Hook 兼容性 | 基础 Hook 机制 | 多平台 hook 脚本与配置持续完善 | 更适合作为 Spec-First 的 Hook 参考样板 |
| OpenCode 恢复细节 | 文档层面支持 | `session-catchup.py` 对 OpenCode 仍提示手动兜底 | 需在文档中保留“能力边界”说明 |

> 结论：本文在机制层面的 8 项借鉴保持成立；v2.16.0 主要是**成熟度与覆盖范围提升**，并不改变核心借鉴方向。

---

## 可借鉴要素详析

### 1. PreToolUse Hook 注意力操控

**对应 PwF 机制**: PreToolUse Hook — 在每次 Write/Edit/Bash/Read 操作前自动读取当前 Feature 的 `task_plan.md` 前 30 行

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定）+ Gap 4（Skill 联调一致性）

#### PwF 做法

```yaml
PreToolUse:
  - matcher: "Write|Edit|Bash|Read|Glob|Grep"
    hooks:
      - type: command
        command: 'FEAT=$(head -1 .spec-first/current 2>/dev/null); [ -n "$FEAT" ] && head -30 "specs/$FEAT/task_plan.md" 2>/dev/null || true'
```

原理（Manus Principle 4 — Manipulate Attention Through Recitation）：

```
上下文开头: [原始目标 — 距离远，已被遗忘]
...50+ 次工具调用...
上下文末尾: [刚刚读取的 specs/$FEAT/task_plan.md — 获得注意力！]
```

AI 模型存在"lost in the middle"效应：上下文中间的信息容易被忽略，而开头和末尾的信息获得最多注意力。通过在每次工具调用前自动读取计划文件，目标和当前阶段被推到注意力窗口的末尾，从而保持聚焦。

#### Spec-First 当前状态

Spec-First 有 `/spec-first:catchup` 用于恢复上下文，但这是**一次性的主动操作**。在 04 Implement 阶段执行多个 TASK 时，随着工具调用次数增加，AI 对当前 TASK 的 AC、traces、约束条件的注意力会逐渐衰减。没有机制在每次代码操作前自动刷新"我正在做什么、验收标准是什么"。

#### 落地建议

在 `/spec-first:code` 的 Hook 配置中加入 PreToolUse 注意力刷新：

```yaml
PreToolUse:
  - matcher: "Write|Edit|Create|Bash"
    hooks:
      - type: command
        command: |
          # 读取当前 Feature 的关键上下文（与现有 gate check 串联，不替换）
          FEAT=$(head -1 .spec-first/current 2>/dev/null)
          if [ -n "$FEAT" ] && [ -f "specs/$FEAT/task_plan.md" ]; then
            echo "=== 当前 TASK 上下文 ==="
            head -30 "specs/$FEAT/task_plan.md"
          fi
```

刷新内容应包含：
- 当前 TASK ID + 标题
- 关联的 FR/DS/TASK traces
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

Spec-First 已有运行态三文件（`task_plan.md/findings.md/stage-state.json`），但更偏向"流程追踪"而非"注意力管理"。可行性评估中 Context Pack 的设计（control < 2KB + references 按需读取）已体现了类似思想，但缺少 PwF 这样明确的 Read/Write 决策矩阵。

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
2. 在 `/spec-first:code` 中应用变体：每完成 2 个文件的修改后，更新 `stage-state.json` 中的进度记录
3. 配套反合理化条目："我记得刚才看到的内容" → 上下文会被压缩，记忆不可靠，写入文件

---

### 4. Stop Hook 完成度守门 ⬆️ 优先级调整为 P0

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
    exit 0  # 允许停止
else
    # 输出 followup_message 触发自动继续
    echo "{\"followup_message\": \"[planning-with-files] Task incomplete ($COMPLETE/$TOTAL phases done). Read task_plan.md and continue working on the remaining phases.\"}"
fi
```

**v2.16.0 实际代码验证**：PwF 使用 `followup_message` 机制实现自动继续，而不只是输出提示。当 AI 试图结束对话时：
- 如果所有阶段完成 → 允许停止
- 如果有未完成阶段 → 输出 followup_message，AI 会自动继续工作

关键设计：**脚本始终 exit 0**（不阻断），但通过 `followup_message` 影响宿主行为。这是一种"软守门"——让 AI 自己看到证据后做出正确判断。

#### Spec-First 当前状态

Spec-First 有 Gate 机制用于阶段推进校验，但 Gate 是**主动调用**的（`spec-first gate check`）。如果 AI 在 04 Implement 阶段执行完几个 TASK 后认为"差不多了"就尝试结束，没有自动机制提醒"还有 3 个 TASK 未完成"。

#### 落地建议（P0 优先级）

1. **Prompt-based Stop Hook**（推荐）：
```json
{
  "Stop": [{
    "matcher": "*",
    "hooks": [{
      "type": "prompt",
      "prompt": "检查 task_plan.md 中的 TASK 完成状态。如果有未完成的 TASK，输出未完成的 TASK ID 列表并继续工作。"
    }]
  }]
}
```

2. **Command-based Stop Hook**（备选）：
```yaml
Stop:
  - matcher: "*"
    hooks:
      - type: command
        command: |
          FEAT=$(head -1 .spec-first/current 2>/dev/null)
          if [ -n "$FEAT" ] && [ -f "specs/$FEAT/task_plan.md" ]; then
            COMPLETE=$(grep -c "Status.*complete" "specs/$FEAT/task_plan.md" || echo 0)
            TOTAL=$(grep -c "TASK-" "specs/$FEAT/task_plan.md" || echo 0)
            if [ "$COMPLETE" -lt "$TOTAL" ]; then
              echo "⚠️ TASK 未完成: $COMPLETE/$TOTAL"
            fi
          fi
```

3. 与 Superpowers 的"证据铁律"结合：Stop Hook 输出就是"完成度证据"，AI 不能忽视

**优先级调整理由**：Stop Hook 直接防止"提前收工"问题，与 Spec-First 的 Gate 机制高度契合，且实现成本低、效果明显，应优先实施。

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
2. 在 `stage-state.json` 中维护错误追踪表：记录错误、尝试次数、解决方案
3. 与 Superpowers 的"系统化调试"结合：3-Strike 是升级阈值，系统化调试是每次尝试的方法论

---

### 6. 5-Question Reboot Test

**对应 PwF 机制**: 5-Question Reboot Test — 上下文健康度的快速自检

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定）+ `/spec-first:catchup` 的恢复质量校验

#### PwF 做法

PwF 定义了 5 个问题作为上下文健康度的试金石：

| 问题 | 答案来源 |
|------|----------|
| 我在哪里？（Where am I?） | `task_plan.md` 中的当前阶段 |
| 我要去哪里？（Where am I going?） | 剩余阶段列表 |
| 目标是什么？（What's the goal?） | 计划中的目标声明 |
| 我学到了什么？（What have I learned?） | `findings.md` |
| 我做了什么？（What have I done?） | `stage-state.json` |

如果 AI 能回答这 5 个问题，说明上下文管理是健康的。如果任何一个问题答不上来，说明需要重新读取对应的计划文件。

这个测试的价值在于：**它把"上下文是否充分"从主观感觉变成了可检验的客观标准**。

#### Spec-First 当前状态

`/spec-first:catchup` 通过读取运行态三文件恢复上下文，但恢复后没有校验机制确认"恢复是否充分"。AI 可能读了文件但遗漏了关键信息，或者三文件本身不完整（上次会话没有及时更新）。

#### 落地建议

1. 在 `/spec-first:catchup` 的恢复流程末尾加入 5-Question 自检，适配 Spec-First 语境：

| 问题 | 答案来源 | Spec-First 映射 |
|------|----------|-----------------|
| 当前 Feature 是什么？ | `task_plan.md` 头部 | Feature ID + 标题 |
| 当前阶段是什么？ | `task_plan.md` 阶段状态 | 8+2 阶段中的哪一个 |
| 当前 TASK 是什么？ | `task_plan.md` TASK 列表 | TASK ID + AC |
| 已有哪些发现/决策？ | `findings.md` | 技术决策、ADR、调研结论 |
| 已完成哪些工作？ | `stage-state.json` | 已完成 TASK + 验证结果 |

2. 如果任何问题无法回答 → 标记恢复不完整，提示 AI 补充读取对应文件
3. 将此自检作为 catchup 的"出口条件"：5 个问题全部可答 → 恢复完成；否则 → 继续补充

---

### 7. Session Recovery 自动恢复 ⬆️ 优先级调整为 P1

**对应 PwF 机制**: Session Catchup — 在进入任务前检测未同步上下文并输出恢复建议

**解决 Spec-First 问题**: Risk 3（上下文恢复不稳定导致重复劳动）

#### PwF 做法（v2.16.0 口径）

PwF 通过 Skill 启动阶段的 “FIRST: Check for Previous Session” 指令触发恢复逻辑：

```
1. 扫描所有历史会话文件（.jsonl）
2. 找到最近一次更新 planning 文件的位置
3. 从该位置开始，收集所有后续的未同步消息
4. 输出 catchup 报告：
   - 上次更新了哪个 planning 文件
   - 跨越了几个会话
   - 未同步的消息数量
   - 消息摘要（用户指令 + AI 操作）
5. 推荐操作：git diff → 读 planning 文件 → 更新 → 继续
```

关键设计：
- **跨会话扫描**：不只看上一个会话，而是扫描所有历史会话，找到真正的”最后同步点”
- **启动前触发**：通过 SKILL.md 的 “FIRST: Check for Previous Session” 指令，在开始工作前执行
- **增量恢复**：只展示未同步的部分，不重复已知信息
- **v2.15.1 改进**：修复了 Session catchup 误报问题，稳定性提升

#### Spec-First 当前状态

Spec-First 已有 `/spec-first:catchup` skill，通过读取运行态三文件恢复上下文。但这是一个**被动的、需要人工触发的**操作。如果用户忘记调用 catchup 就直接开始工作，AI 会在缺少上下文的情况下执行，导致重复分析或遗漏追踪链。

可行性评估中 Risk 3 明确指出：”M5 漂移导致 catchup/context 不稳定，AI 重复分析与遗漏追踪链”。

#### 落地建议（P1 优先级）

1. **SessionStart Hook 自动检测**：
```json
{
  “SessionStart”: [{
    “matcher”: “*”,
    “hooks”: [{
      “type”: “prompt”,
      “prompt”: “检查 .spec-first/current 是否非空。如果存在未完成的 Feature，提示用户执行 /spec-first:catchup 恢复上下文。”
    }]
  }]
}
```

2. 借鉴 PwF 的跨会话扫描思路：检测上次会话是否正常结束（stage-state.json 最后一条记录是否为”会话结束”），若非正常结束则标记为”需要恢复”

3. 将 catchup 的恢复结果与 5-Question Reboot Test（要素 6）结合：恢复后自检，确认上下文充分

**优先级调整理由**：v2.15.1 修复了误报问题，稳定性提升，落地风险下降。与 Stop Hook（P0）配合，形成完整的会话生命周期管理。

---

### 8. KV-Cache 优化原则

**对应 PwF 机制**: Manus Principle 1（Design Around KV-Cache）+ Principle 2（Mask, Don't Remove）

**解决 Spec-First 问题**: 运行效率优化（成本与延迟）

#### PwF 做法

Manus 的生产数据显示：

```
缓存 Token: $0.30/MTok vs 未缓存 Token: $3/MTok
→ 10 倍成本差异！
平均每个任务 ~50 次工具调用，输入输出 Token 比 ~100:1
```

KV-Cache 优化的核心原则：

1. **保持 Prompt 前缀稳定**：单个 Token 的变化就会使缓存失效。因此系统提示中不放时间戳、不放动态内容
2. **Mask, Don't Remove**：不要动态移除工具定义（会破坏缓存），而是用 logit masking 禁用不需要的工具
3. **Append-Only 上下文**：上下文只追加不修改，使用确定性序列化，最大化缓存命中率
4. **一致的 Action 前缀**：工具名使用统一前缀（如 `browser_`、`shell_`、`file_`），便于批量 masking

#### Spec-First 当前状态

Spec-First 当前支持 Claude Code + Codex，KV-Cache 管理主要由宿主运行时负责。但 Spec-First 的 skill 设计和 Context Pack 构建方式会间接影响缓存效率：
- 如果 skill 注入的系统提示每次都不同（如包含动态时间戳、随机 ID），会降低缓存命中率
- 如果 Context Pack 的序列化顺序不确定，也会影响缓存

#### 落地建议

1. **Skill 注入稳定性**：确保 skill 的系统提示部分是静态的，动态内容（当前 TASK ID、阶段状态）放在用户消息或工具输出中，而非系统提示中
2. **Context Pack 确定性序列化**：Context Pack 的 control 段和 references 段使用固定顺序输出，避免每次构建时字段顺序变化
3. **这是 P2 优化项**：在功能正确性（P0/P1）确保后，再关注运行效率优化

---

### 9. PostToolUse Hook 进度同步 🆕

**对应 PwF 机制**: PostToolUse Hook — 在每次文件修改后提醒更新计划状态

**解决 Spec-First 问题**: 防止计划与实际进度脱节

#### PwF 做法

```bash
# .cursor/hooks/post-tool-use.sh
echo "[planning-with-files] File updated. If this completes a phase, update task_plan.md status."
```

每次 Write/Edit 操作后，自动输出提醒，让 AI 意识到可能需要更新计划状态。

#### Spec-First 当前状态

Spec-First 的 `stage-state.json` 更新由 skill 流程驱动，但在长时间会话中，AI 可能完成多个 TASK 后忘记同步状态到 `task_plan.md`。

#### 落地建议（P2 优先级）

1. **Prompt-based PostToolUse Hook**（推荐）：
```json
{
  "PostToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "prompt",
      "prompt": "如果此次修改完成了一个 TASK 或 AC，检查是否需要更新 task_plan.md 中的完成状态。"
    }]
  }]
}
```

2. 与 Stop Hook 配合：PostToolUse 提醒更新，Stop Hook 检查完成度，形成双重保障

---

### 10. Context Reduction 分层压缩 🆕

**对应 PwF 机制**: Manus Context Reduction 策略 — Compaction + Summarization

**解决 Spec-First 问题**: 上下文压缩时的信息保留策略

#### PwF 做法

```
Tool calls have TWO representations:
├── FULL: Raw tool content (stored in filesystem)
└── COMPACT: Reference/file path only

RULES:
- Apply compaction to STALE (older) tool results
- Keep RECENT results FULL (to guide next decision)
```

当压缩达到收益递减点时，使用摘要对象替代完整内容。

#### Spec-First 当前状态

Spec-First 的 Context Pack 设计已有"control < 2KB + references 按需读取"的类似思想，但缺少明确的分层压缩策略。

#### 落地建议（P2 优先级）

1. **定义分层压缩规则**：
   - 最近 5 次工具调用：保留完整内容
   - 5-20 次调用：保留关键信息 + 文件路径引用
   - 20+ 次调用：仅保留摘要（做了什么、结果如何）

2. **压缩可恢复原则**：即使丢弃内容，也要保留 ID、URL、文件路径等"指针"

3. 在 Context Pack 构建逻辑中实现分层压缩

---

### 11. 与 Claude Code Plan Mode 协同 🆕

**对应 Claude Code 功能**: v2.1+ 内置的 Plan Mode（`/plan` 命令、EnterPlanMode）

**解决 Spec-First 问题**: 规划阶段的强制"先调研、后实施"

#### Claude Code Plan Mode 机制

- `/plan` 命令进入计划模式，强制在编码前完成探索和设计
- 支持 `ExitPlanMode` 提交计划并获得批准后才开始编码
- 内置 AskUserQuestion 支持澄清需求和确认方案

#### 与 PwF 的关系

| 维度 | Claude Code Plan Mode | Planning-with-Files |
|------|---------------------|-------------------|
| 触发方式 | 内置命令（`/plan`） | 自动检测复杂任务 |
| 规划存储 | 内存/会话上下文 | 文件系统（task_plan.md） |
| 持久化 | 会话内有效 | 跨会话持久 |
| 审批流程 | 内置 ExitPlanMode | 无强制审批 |

#### Spec-First 协同建议（P1 优先级）

1. **双模式协同**：
   - 初始架构设计：使用 Claude Code Plan Mode 做快速探索
   - 长期执行追踪：使用 PwF 风格的文件做持久化追踪

2. **Plan Mode 输出对接**：
   - 将 Plan Mode 的探索结果自动写入 Spec-First 的 `findings.md`
   - 将 Plan Mode 的计划转换为 Spec-First 的 TASK 结构

3. **Skill 层集成**：
   - 在 `/spec-first:spec` 和 `/spec-first:design` 中推荐使用 Plan Mode
   - Plan Mode 完成后自动触发 Spec-First 的规范生成流程

---

## 总结映射表（更新）

| # | PwF 机制 | 映射到 Spec-First 位置 | 解决的 Gap/Risk | 优先级 |
|---|---------|----------------------|----------------|--------|
| 1 | PreToolUse Hook 注意力操控 | `/spec-first:code` Hook 配置 | Risk 3 + Gap 4 | **P0** |
| 2 | 文件系统即外部记忆（Read/Write 决策矩阵） | `/spec-first:code` + Context Pack | Risk 3: 上下文不稳定 | **P0** |
| 3 | 2-Action Rule 强制持久化 | `/spec-first:research` + `/spec-first:spec` | Risk 3: 信息丢失 | P1 |
| 4 | Stop Hook 完成度守门 ⬆️ | `/spec-first:code` + `/spec-first:orchestrate` Stop Hook | Risk 2 + Gap 1: Gate 可信度 | **P0** |
| 5 | 3-Strike Error Protocol | `/spec-first:code` 异常处理路径 | 04/05 阶段错误处理质量 | P1 |
| 6 | 5-Question Reboot Test | `/spec-first:catchup` 恢复校验 | Risk 3: 恢复质量 | P1 |
| 7 | Session Recovery 自动恢复 ⬆️ | SessionStart Hook + `/spec-first:catchup` | Risk 3: 恢复自动化 | **P1** |
| 8 | KV-Cache 优化原则 | Skill 注入 + Context Pack 序列化 | 运行效率（成本/延迟） | P2 |
| 9 | PostToolUse Hook 进度同步 🆕 | `/spec-first:code` PostToolUse Hook | 计划与进度脱节 | P2 |
| 10 | Context Reduction 分层压缩 🆕 | Context Pack 构建逻辑 | 上下文压缩信息丢失 | P2 |
| 11 | 与 Claude Code Plan Mode 协同 🆕 | `/spec-first:spec` + `/spec-first:design` | 规划阶段质量 | P1 |

> **优先级调整说明**：
> - Stop Hook（要素 4）：从 P1 调整为 **P0**，直接防止"提前收工"，与 Gate 机制高度契合
> - Session Recovery（要素 7）：从 P2 调整为 **P1**，v2.15.1 修复误报后稳定性提升，与 Stop Hook 配合形成完整会话管理
> - Plan Mode 协同（要素 11）：新增 **P1**，与 Spec-First 的规划阶段高度契合，可提升架构设计质量

---

## 不适用 / 无需借鉴的部分

以下 PwF 机制在 Spec-First 中已有更好的替代方案，无需借鉴：

| PwF 机制 | 不借鉴原因 | Spec-First 已有替代 |
|---------|-----------|-------------------|
| 3-File Pattern（task_plan/findings/progress） | PwF 的三文件是自由格式 Markdown | Spec-First 已有 task_plan.md + findings.md + stage-state.json，且有 YAML Front Matter + ID 体系，结构化程度更高 |
| Phase 自由定义（3-7 个 Phase） | PwF 允许 AI 自由定义阶段 | Spec-First 的 8+2 阶段是固定的、有 Gate 守卫的，流程治理更严格 |
| 多 IDE 适配（15+ IDE） | PwF 为每个 IDE 维护独立配置 | Spec-First 已覆盖 Claude Code + Codex；更多宿主适配仍是 P2+ 优先级 |
| TodoWrite 替代（Anti-Pattern） | PwF 明确反对用 TodoWrite 做持久化 | Spec-First 不依赖 TodoWrite，已用文件系统做持久化 |
| Single-Action Execution | PwF 遵循 Manus 的"每轮一个工具调用" | Claude Code 支持并行工具调用，Spec-First 无需限制为单动作 |

> **注意**：PostToolUse Hook 在 v1.1 版本中被标记为"不适用"，但在 v1.2 中重新评估为可借鉴（要素 9，P2 优先级），因为 Spec-First 的 skill 流程驱动不能完全覆盖所有场景。

---

## 落地建议（更新）

### 实施路径（对齐可行性评估行动清单）

```text
Week 1-2 (P0):  PreToolUse Hook + Stop Hook + Read/Write 决策矩阵
                 ↓ 三个核心注意力管理机制，零代码改动，立即生效
Week 3-4 (P1):  2-Action Rule + Session Recovery + 3-Strike + 5-Question + Plan Mode 协同
                 ↓ 注意力持久化 + 自动恢复 + 错误处理 + 恢复校验 + 规划协同
Week 5-8 (P2):  PostToolUse + Context Reduction + KV-Cache 优化
                 ↓ 进度同步 + 压缩策略 + 运行效率提升
```

### P0 具体行动项

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 在 `/spec-first:code` 的 Hook 配置中加入 PreToolUse 注意力刷新 | 1 个 Hook 配置 | 0.5 天 | AI 在每次代码操作前自动刷新当前 TASK 上下文，防止注意力衰减 |
| 2 | 在 `/spec-first:code` 和 `/spec-first:orchestrate` 的 Stop Hook 中加入完成度检查 ⬆️ | 2 个 Hook 配置 | 0.5 天 | AI 结束会话前自动看到 TASK 完成度，防止提前收工 |
| 3 | 在 `/spec-first:code` skill 中嵌入 Read/Write 决策矩阵 | 1 个 skill 文件 | 0.5 天 | AI 知道何时读、何时写运行态文件，减少信息丢失 |

### P1 补充行动项

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 在 `/spec-first:research` 和 `/spec-first:spec` 中嵌入 2-Action Rule | 2 个 skill 文件 | 0.5 天 | 研究阶段信息强制持久化，防止多模态内容丢失 |
| 2 | 在 SessionStart Hook 中加入自动检测逻辑 ⬆️ | 1 个 Hook 配置 | 0.5 天 | 会话启动时自动提示恢复上下文 |
| 3 | 在 `/spec-first:code` 中嵌入 3-Strike Error Protocol | 1 个 skill 文件 | 0.5 天 | 错误处理有章可循，3 次失败后升级而非死循环 |
| 4 | 在 `/spec-first:catchup` 中加入 5-Question Reboot Test | 1 个 skill 文件 | 0.5 天 | 恢复质量可校验，不再依赖主观判断 |
| 5 | 在 `/spec-first:spec` 和 `/spec-first:design` 中集成 Plan Mode 协同 🆕 | 2 个 skill 文件 | 1 天 | 规划阶段使用 Plan Mode 做探索，结果自动写入 findings.md |

### P2 补充行动项 🆕

| # | 行动项 | 改动范围 | 工作量 | 预期效果 |
|---|--------|---------|--------|---------|
| 1 | 在 `/spec-first:code` 的 PostToolUse Hook 中加入进度提醒 | 1 个 Hook 配置 | 0.5 天 | 文件修改后提醒更新计划状态 |
| 2 | 在 Context Pack 构建逻辑中实现分层压缩 | Context Pack 代码 | 1 天 | 上下文压缩时保留关键信息指针 |
| 3 | Skill 注入稳定性检查 + Context Pack 确定性序列化 | Skill 系统 | 1 天 | 提升 KV-Cache 命中率 |

### 实施原则

1. **注意力层补齐，不改流程层**：PwF 的借鉴核心是"上下文工程"，不涉及 Spec-First 的 8+2 阶段流程变更。所有改动都是在现有 skill 中追加注意力管理机制
2. **Prompt-based Hooks 优先**：Claude Code v2.1+ 支持 `type: "prompt"` 的自然语言验证，比 command-based 更灵活，应作为首选方案
3. **渐进验证**：先在 `/spec-first:code`（最高频 skill）上验证 PreToolUse Hook 效果，再推广到其他 skill
4. **与 Superpowers 借鉴协同**：PwF 的注意力工程 + Superpowers 的行为约束 = 完整的 AI 执行纪律体系

### 与可行性评估行动清单的对齐

| 可行性评估行动项 | 本文对应借鉴要素 | 协同关系 |
|----------------|----------------|---------|
| P0 #3: 跑通 Daily Path 端到端 | 要素 1（PreToolUse Hook）+ 要素 2（Read/Write 矩阵） | Daily Path 试点中同步验证注意力刷新效果 |
| P0 #4: Gate 证据化输出 | 要素 4（Stop Hook 完成度守门）⬆️ | Stop Hook 提供完成度证据，与 Gate 形成双重守门 |
| P1 #6: M3 Gate 自动条件解析 | 要素 4（Stop Hook） | Gate 自动化闭合前，Stop Hook 作为轻量级守门补充 |
| P1 #8: 19 个 Skill 联调验收 | 要素 3（2-Action Rule）+ 要素 5（3-Strike） | 联调时同步验证持久化规则与错误处理协议 |
| Risk 3: 上下文恢复不稳定 | 要素 6（5-Question）+ 要素 7（Session Recovery）⬆️ | 直接提升 catchup 的恢复质量与自动化程度 |
| P2 #11: Gate/SCA/Skill 回归测试集 | 要素 1-11 全部 | 回归测试应覆盖"AI 是否遵循注意力管理规则"的场景 |

---

## 参考资料（修正）

| 来源 | 路径/链接 | 用途 |
|------|----------|------|
| Planning-with-Files 项目 | https://github.com/OthmanAdi/planning-with-files (v2.16.0) | 本文分析对象（当前口径）⚠️ 修正作者名 |
| PwF plugin.json | `/Users/kuang/xiaobu/planning-with-files/.claude-plugin/plugin.json` | 版本与元数据验证 |
| PwF hooks.json | `/Users/kuang/xiaobu/planning-with-files/.cursor/hooks.json` | Hook 配置参考 |
| PwF reference.md | `/Users/kuang/xiaobu/planning-with-files/.cursor/skills/planning-with-files/reference.md` | Manus 六原则 + 三策略详解 |
| PwF task_plan 模板 | `/Users/kuang/xiaobu/planning-with-files/.cursor/skills/planning-with-files/templates/task_plan.md` | 3-File Pattern 模板参考 |
| PwF findings 模板 | `/Users/kuang/xiaobu/planning-with-files/.cursor/skills/planning-with-files/templates/findings.md` | 2-Action Rule 与持久化约束参考 |
| PwF pre-tool-use.sh | `/Users/kuang/xiaobu/planning-with-files/.cursor/hooks/pre-tool-use.sh` | PreToolUse Hook 实现参考 |
| PwF stop.sh | `/Users/kuang/xiaobu/planning-with-files/.cursor/hooks/stop.sh` | Stop Hook 完成度检查实现参考 |
| PwF post-tool-use.sh | `/Users/kuang/xiaobu/planning-with-files/.cursor/hooks/post-tool-use.sh` | PostToolUse Hook 提醒参考 |
| Manus Context Engineering | https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus | Manus 官方上下文工程文档 |
| Claude Code Hooks 文档 | https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/hook-development | Prompt-based Hooks 参考文档 |
| Claude Code Plan Mode | https://context7.com/anthropics/claude-code | EnterPlanMode 与规划工作流参考 |
| Spec-First v7.1 可行性评估 | `docs/01需求文档/v2/可行性评估.md` | Gap/Risk 映射依据 |
| Spec-First 可借鉴 Superpowers 分析 | `docs/01需求文档/v2/Spec-First 可借鉴 Superpowers 的要素分析.md` | 协同借鉴参考 |

---

## 版本更新记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-02-25 | 初版发布（基于 v2.10.0 分析） |
| v1.1 | 2026-02-25 | 切换到 v2.16.0 口径，重标版本差异 |
| v1.2 | 2026-02-25 | ⚠️ **修正作者名**（OthmanAdi，非 abzhaw）<br>⬆️ Stop Hook 优先级调整为 P0<br>⬆️ Session Recovery 优先级调整为 P1<br>➕ 新增 PostToolUse Hook（要素 9）<br>➕ 新增 Context Reduction（要素 10）<br>➕ 新增与 Claude Code Plan Mode 协同（要素 11）<br>➕ 补充 Prompt-based Hooks 推荐 |

---

> **文档状态**: v1.2（作者名已修正，优先级已调整，新要素已补充） | 待 Leo 审核后纳入 v7.1 行动清单
