---
name: focus-requirements
version: 1.0.0
description: |
  面向已有项目增量需求的 owner 范围收敛工具。
  读取一份较大的、已经审过的需求，再结合当前工作区上下文，
  把它收敛成当前 owner 或 side 可执行的聚焦 PRD。
  产出一份真正的源需求文档，以及两份给下游 /plan-ceo-review
  和 /plan-eng-review 使用的薄型交接摘要。
  适用于用户已经有审过的需求文档、知道当前 owner 边界，
  且相关仓库已经准备在工作区中的场景。
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---
<!-- 基于 SKILL.md 生成的中文副本 - 不要直接修改原始版本 -->

## 前言（先执行）

**语言**：默认中文回复；技术术语和代码标识符保持英文原文。

```bash
_UPD=$(~/.claude/skills/spec-first/bin/spec-first-update-check 2>/dev/null || .claude/skills/spec-first/bin/spec-first-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.spec-first/sessions
touch ~/.spec-first/sessions/"$PPID"
_SESSIONS=$(find ~/.spec-first/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.spec-first/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/spec-first/bin/spec-first-config get spec-first_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.claude/skills/spec-first/bin/spec-first-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.spec-first/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.claude/skills/spec-first/bin/spec-first-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.spec-first/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
    mkdir -p ~/.spec-first/analytics
    echo '{"skill":"focus-requirements","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.spec-first/analytics/skill-usage.jsonl 2>/dev/null || true
    _PENDING=$(~/.claude/skills/spec-first/bin/spec-first-pending-check 2>/dev/null || true)
    [ -n "$_PENDING" ] && ~/.claude/skills/spec-first/bin/spec-first-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true
```

如果 `PROACTIVE` 为 `"false"`，不要主动推荐 spec-first 技能，只在用户明确要求时再调用。
用户已经选择关闭主动建议。

如果输出出现 `UPGRADE_AVAILABLE <old> <new>`：读取 `~/.claude/skills/spec-first/spec-first-upgrade/SKILL.md`，并按其中的 “Inline upgrade flow” 执行（如果配置允许则自动升级，否则用 `AskUserQuestion` 提供 4 个选项，拒绝时写入 snooze 状态）。
如果输出出现 `JUST_UPGRADED <from> <to>`：告诉用户 `Running spec-first v{to} (just updated!)`，然后继续。

如果 `LAKE_INTRO` 是 `no`：在继续前，先介绍 Completeness Principle。
告诉用户：`spec-first 遵循 **Boil the Lake** 原则 —— 当 AI 让边际成本接近于零时，始终把事情做完整。阅读更多：https://garryslist.org/posts/boil-the-ocean`
然后询问是否要用默认浏览器打开这篇文章：

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.spec-first/.completeness-intro-seen
```

只有在用户同意时才运行 `open`。`touch` 总是要执行，用来标记已看过。这只会发生一次。

如果 `TEL_PROMPTED` 是 `no` 且 `LAKE_INTRO` 是 `yes`：在完成 lake intro 后，再询问用户是否开启 telemetry。使用 `AskUserQuestion`：

> Help spec-first get better! Community mode shares usage data (which skills you use, how long
> they take, crash info) with a stable device ID so we can track trends and fix bugs faster.
> No code, file paths, or repo names are ever sent.
> Change anytime with `spec-first-config set telemetry off`.

选项：
- A) Help spec-first get better!（推荐）
- B) No thanks

如果选 A：运行 `~/.claude/skills/spec-first/bin/spec-first-config set telemetry community`

如果选 B：再问一个 `AskUserQuestion`：

> How about anonymous mode? We just learn that *someone* used spec-first — no unique ID,
> no way to connect sessions. Just a counter that helps us know if anyone's out there.

选项：
- A) Sure, anonymous is fine
- B) No thanks, fully off

如果 B→A：运行 `~/.claude/skills/spec-first/bin/spec-first-config set telemetry anonymous`
如果 B→B：运行 `~/.claude/skills/spec-first/bin/spec-first-config set telemetry off`

始终运行：
```bash
touch ~/.spec-first/.telemetry-prompted
```

这只会发生一次。如果 `TEL_PROMPTED` 是 `yes`，则完全跳过。

## AskUserQuestion 格式

**对每次 `AskUserQuestion` 调用，都必须始终遵循以下结构：**
1. **重新对齐上下文**：说明项目、当前分支（必须使用前言打印出的 `_BRANCH` 值，而不是对话历史或 `git status` 里的分支）、以及当前计划/任务。1-2 句即可。
2. **简化说明**：用一个 16 岁聪明人也能理解的方式解释问题。不要直接写内部函数名、不要堆内部术语、不要暴露实现细节。说清它“做什么”，不要说它“叫什么”。
3. **给出建议**：`RECOMMENDATION: Choose [X] because [one-line reason]`。始终优先选择更完整的方案，而不是捷径（见 Completeness Principle）。每个选项都要附带 `Completeness: X/10`。参考：10 = 完整实现（所有边界情况、完整覆盖），7 = 覆盖主流程但跳过一些边角，3 = 留下大量工作到后续。若两个选项都在 8 分以上，选更高的；如果有任一项 ≤5，要明确标出来。
4. **列出选项**：用字母选项形式：`A) ... B) ... C) ...`。如果某个选项会带来额外工作量，要同时写出两种尺度：`(human: ~X / CC: ~Y)`

假设用户已经 20 分钟没看这个窗口，而且代码也没打开。若你需要先读源码才能理解自己的解释，那说明问题已经太复杂了。

每个子技能都可以在这个基础上增加额外格式要求。

## 完整性原则 - Boil the Lake

AI 辅助编码让“多做一点”的边际成本几乎为零。当你呈现选项时：

- 如果选项 A 是完整实现（全部对齐、覆盖所有边界情况、100% 测试覆盖），而选项 B 只是为了省一点工夫的捷径，那么**永远推荐 A**。80 行和 150 行之间的差异，在 CC+spec-first 的语境里通常没有意义。
- **Lake vs. ocean**：如果是可以“煮开”的 lake，就把它做完整，比如一个模块的 100% 测试覆盖、完整特性实现、所有错误路径、完整边界情况。如果是 ocean，比如重写整个系统、给你无法控制的依赖加功能、跨季度的平台迁移，那就别假装能一次性做完。lake 要尽量做满；ocean 应该明确标出范围外。
- **估算工作量时**，永远同时给出人类团队时间和 CC+spec-first 时间。压缩比因任务类型而异，可参考：

| 任务类型 | 人类团队 | CC+spec-first | 压缩比 |
|-----------|----------|---------------|--------|
| 样板 / 脚手架 | 2 天 | 15 分钟 | ~100x |
| 写测试 | 1 天 | 15 分钟 | ~50x |
| 功能实现 | 1 周 | 30 分钟 | ~30x |
| Bug 修复 + 回归测试 | 4 小时 | 15 分钟 | ~20x |
| 架构 / 设计 | 2 天 | 4 小时 | ~5x |
| 调研 / 探索 | 1 天 | 3 小时 | ~3x |

这个原则适用于测试覆盖、错误处理、文档、边界情况和功能完整性。不要为了“省时间”跳过最后 10%；在 AI 语境里，那 10% 往往只要几秒。

**反模式 - 不要这样做：**
- 错误示例：`选 B，因为它覆盖了 90% 的价值，而且代码更少。`（如果 A 只多 70 行，就选 A。）
- 错误示例：`我们可以跳过边界情况处理，省点时间。`（用 CC 做边界处理通常只要几分钟。）
- 错误示例：`测试覆盖可以放到后续 PR。`（测试是最便宜、最该一次做完的部分。）
- 错误示例：只给人类团队时间：`这要两周。`（应该说：`2 周人类时间 / ~1 小时 CC`。）

## 先搜索，再构建

在构建基础设施、不熟悉的模式，或者运行时可能已经内置了相关能力的东西之前，**先搜索。**完整哲学请阅读 `~/.claude/skills/spec-first/ETHOS.md`。

**三层知识：**
- **第一层**（久经考验、已在发行版中）。不要重复造轮子。但检查成本几乎为零，而且偶尔质疑“常识”往往能带来突破。
- **第二层**（新鲜且流行，要去搜索）。但要保持怀疑：人类很容易被热潮带偏。搜索结果只是思考的输入，不是答案。
- **第三层**（第一性原理，优先级最高）。从具体问题中推导出的原始观察，是最有价值的。

**Eureka 时刻**：当第一性原理推理发现常规做法是错的，要明确说出来：
`EUREKA: Everyone does X because [assumption]. But [evidence] shows this is wrong. Y is better because [reasoning].`

记录 Eureka 时刻：
```bash
jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg skill "SKILL_NAME" --arg branch "$(git branch --show-current 2>/dev/null)" --arg insight "ONE_LINE_SUMMARY" '{ts:$ts,skill:$skill,branch:$branch,insight:$insight}' >> ~/.spec-first/analytics/eureka.jsonl 2>/dev/null || true
```
把 `SKILL_NAME` 和 `ONE_LINE_SUMMARY` 替换掉。这个命令是内联运行的，不要中断流程。

**WebSearch 回退**：如果 WebSearch 不可用，就跳过搜索步骤，并注明：`Search unavailable — proceeding with in-distribution knowledge only.`

## Contributor 模式

如果 `_CONTRIB` 是 `true`：你处于 **contributor mode**。你既是 spec-first 使用者，也在帮助它变得更好。

**在每个主要工作步骤结束时**（不是每条命令后），都要回顾你使用的 spec-first 工具。给体验打分 0 到 10。如果不是 10，要想清楚原因。如果有明显且可行动的 bug，或者有一个有价值、值得分享的改进点，那就提交 field report。也许维护者会因此改进它！

**校准 - 这就是标准**：例如，过去 `$B js "await fetch(...)"` 会因为 `SyntaxError: await is only valid in async functions` 而失败，因为 spec-first 没有把表达式包进 async 上下文。这个问题很小，但输入是合理的，而 spec-first 本该处理好它——这类问题值得上报。比这还不重要的，就忽略。

**不值得上报：**用户自己的应用 bug、访问用户站点时的网络错误、认证失败、用户自己的 JS 逻辑错误。

**要上报时**：把下面内容写到 `~/.spec-first/contributor-logs/{slug}.md`，并且 **所有章节都要保留**（不要截断，要写到 Date/Version footer）：

```
# {Title}

Hey spec-first team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what spec-first should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {spec-first version} | **Skill:** /{skill}
```

Slug 规则：小写、连字符、最长 60 字符，例如 `browse-js-no-await`。如果文件已经存在就跳过。每个会话最多 3 份报告。内联写入后继续，不要停止流程。告诉用户：`Filed spec-first field report: {title}`

## 完成状态协议

完成一个技能工作流时，只能用以下状态之一：
- `DONE`
- `DONE_WITH_CONCERNS`
- `BLOCKED`
- `NEEDS_CONTEXT`

### `DONE`
- owner 边界清晰
- 三个固定输出都已经写好
- 五个成功标准都满足

### `DONE_WITH_CONCERNS`
- 输出可供下游审查使用
- 仍然存在少量 open questions
- 这些问题不会破坏 owner 边界

### `NEEDS_CONTEXT`
- 信息不足
- 但工作流前置条件基本已具备

### `BLOCKED`
- 工作区还没准备好
- owner 实际上没有定义
- 或者该需求仍处于前置定位阶段，而不是收敛阶段

## 最终响应格式

始终以以下内容结尾：
- 完成状态
- 一段简短说明，概括当前收敛后的 owner 范围

# /focus-requirements

把一份较大的、已经审过的需求，收敛成一个 owner 范围的 PRD。你的任务是锁定当前 owner 的边界，而不是再写一份全局 PRD，也不是设计技术方案。

## 适用场景

这个技能主要适用于：
- 已有项目中的增量需求

如果满足下面前置条件，也可以用于新项目或混合型需求：
- owner 边界已经明确
- 受影响的仓库已经知道
- 工作区已经准备好

如果用户要从零创建源需求，不要把他们导向 `/spec`（这个仓库里没有 `/spec` 技能）。先用 `/brainstorm` 创建初始需求/设计文档，然后带着已经审过的源需求回来做收敛。

如果这些条件不成立，就以 `BLOCKED` 结束。

### 视觉证据规则

如果审过的源需求里包含截图、红线图、示意图，或其他标注图片：
- 把图片当作一手源材料，而不是装饰附件。
- 压缩文本需求之前，先读截图。
- 提取屏幕里可见的精确标签、数字、UI 状态和标注文本。
- 找出所有标注的变化点，说明改什么、改哪里，以及它是重命名、文案更新、布局变化、状态变化，还是全新行为。
- 如果有多张图，要对比出当前状态和目标状态。
- 如果图片里有流程图、旅程图、状态机或过程图，要在输出里重建成 ASCII 图，而不是只用文字转述。
- 保留节点标签、分支条件、起止状态和转移顺序。能用 ASCII 箭头和方框就尽量用。
- 如果图片暗示了文本没有写明的需求，要把它作为候选需求提出来，并标明它是从视觉证据推断出的。
- 如果图片无法安全辨认、含糊不清、或分辨率太低，就以 `NEEDS_CONTEXT` 结束，并指出缺少哪一项视觉细节。

## 非目标

不要做这些事：
- 设计架构或 API
- 拆解实现任务
- 估算工作量
- 协调跨 owner 执行
- 悄悄补全缺失的业务规则
- 在下面固定输出之外再创建第二份真源

## 成功标准

只有以下所有条件都满足，这个技能才算成功：

1. `Owner Scope` 清晰
2. `In Scope / Out of Scope` 清晰
3. `Dependencies` 与已拥有范围分离
4. `Acceptance Criteria` 能由当前 owner 验证
5. `Open Questions` 明确且诚实

在不满足上述标准时就直接生成文件，不算成功。

## 必需输入

直接收敛模式需要三个输入都具备：
- 已审过的源需求文档
- 当前 owner 或 side 标识
- 当前工作区里的项目列表

可选但有帮助的输入：
- 历史模块文档
- 之前的 PRD
- 术语说明
- 业务规则澄清

如果必需输入只有部分存在，但还不足以判断边界，就用 `NEEDS_CONTEXT`。

如果工作区或 owner 边界实际上还没准备好，就用 `BLOCKED`。

## 固定输出

只写这三个项目文件：
- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

这三个文件就是这个技能的全部输出面。

模板来源在这里：
- `focus-requirements/templates/focus-requirements.md`
- `focus-requirements/templates/side-requirements.md`
- `focus-requirements/templates/handoff-summary.md`

参考示例在这里：
- `focus-requirements/examples/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/source-requirement.md`
- `focus-requirements/examples/incremental-checkout-coupon/docs/requirements/focus-requirements.md`
- `focus-requirements/examples/incremental-checkout-coupon/handoff/side-requirements.md`
- `focus-requirements/examples/incremental-checkout-coupon/handoff/handoff-summary.md`
- `focus-requirements/examples/simple-profile-copy-update/README.md`
- `focus-requirements/examples/simple-profile-copy-update/source-requirement.md`
- `focus-requirements/examples/simple-profile-copy-update/docs/requirements/focus-requirements.md`
- `focus-requirements/examples/simple-profile-copy-update/handoff/side-requirements.md`
- `focus-requirements/examples/simple-profile-copy-update/handoff/handoff-summary.md`
- `focus-requirements/examples/ambiguity-confirmation/README.md`
- `focus-requirements/examples/ambiguity-confirmation/source-requirement.md`
- `focus-requirements/examples/ambiguity-confirmation/question-sequence.md`
- `focus-requirements/examples/ambiguity-confirmation/resolved-focus-requirements.md`

## 工作流

### 第 0 步：确认前置条件

在开始收敛之前，先确认：
- 有一份已经审过的源需求文档
- 当前 owner 或 side 已经命名
- 相关仓库已经在工作区中
- 当前任务是需求聚焦，而不是架构设计

如果信息缺失，但整体流程形态是对的，就用 `NEEDS_CONTEXT`。

如果前置准备还没完成，就用 `BLOCKED`。

### 第 1 步：读取需求与工作区

读取：
- 已审过的源需求
- 当前工作区项目列表
- 只读那些对定义当前 owner 边界真正有帮助的模块文档

在开始起草之前，先抽取：
- `Candidate In Scope`
- `Candidate Out of Scope`
- `Dependencies`
- `Ambiguities`
- 如果有截图或标注图片，抽取 `Visual Evidence Notes`
- 如果源需求里有流程图或过程图，抽取 `ASCII Diagram Draft`

不要把模糊项悄悄当成事实。

### 第 2 步：优先直接收敛

默认行为是直接收敛。如果边界已经足够清楚，就不要多问。

只有当下面所有信息都能从输入中明确看出来时，才允许直接收敛：
- 哪个模块、页面、域或流程片段由谁负责
- 哪些主要需求项属于这个 owner
- 这个 owner 的完成边界长什么样

### 第 3 步：只有在必要时才进入确认模式

只有在出现下面任一歧义触发器时，才问后续问题：
- `Owner Boundary Ambiguity`
- `Dependency Ownership Ambiguity`
- `Acceptance Boundary Ambiguity`

需要确认时：
- 先解决最重要的歧义
- 用最少轮次把问题安全推进下去
- 如果两个聚焦问题就够了，就不要跑固定访谈脚本

确认优先级如下：
1. owner 边界
2. 需求归属和依赖
3. 验收边界

非功能约束和普通 open questions 通常应该写进文档，而不是拿来阻塞或过度访谈。

### 第 4 步：写真正的源 PRD

从 `focus-requirements/templates/focus-requirements.md` 开始填。

写 `docs/requirements/focus-requirements.md`，且只包含以下章节：
- `Background`
- `Owner Scope`
- `In Scope`
- `Out of Scope`
- `Relevant Flows`
- `Dependencies`
- `Acceptance Criteria`
- `Non-Functional Constraints`
- `Assumptions`
- `Open Questions`

文档要保持 owner 范围，不要回退成全局需求重写。

当源需求包含截图或标注图片时，要确保 `Background`、`Relevant Flows`、`Acceptance Criteria` 和 `Open Questions` 用纯文本把视觉证据带过去，而不是丢掉。
当截图里包含流程/过程图时，要把 ASCII 版本放进 `Relevant Flows`，或者放到最相关的 PRD 区段中。

### 第 5 步：写两个薄型交接摘要

从 `focus-requirements/templates/side-requirements.md` 开始。

写 `handoff/side-requirements.md`，只包含：
- `Owner Scope`
- `In Scope`
- `Out of Scope`
- `Dependencies`

从 `focus-requirements/templates/handoff-summary.md` 开始。

写 `handoff/handoff-summary.md`，只包含：
- `Requirement Summary`
- `Key Acceptance Criteria`
- `Open Questions`
- `Recommended Next Step`

推荐的下一步通常是：
- `/plan-ceo-review`
- 然后 `/plan-eng-review`

### 第 6 步：完成前自检

结束前，确认以下内容：
- PRD 不是源需求的简单缩写
- 其他 owner 的工作没有混入当前 owner 范围
- `Out of Scope` 是具体的
- `Dependencies` 没有混进 owner 范围
- `Acceptance Criteria` 可以由当前 owner 验证
- 未解决项被诚实列出
- 截图 / 图片证据已经翻译成明确文字
- 不确定的视觉理解有明确标注，没有瞎猜

如果任一检查失败，先修改，再结束。

## 完成状态协议

只能使用以下之一：
- `DONE`
- `DONE_WITH_CONCERNS`
- `NEEDS_CONTEXT`
- `BLOCKED`

### `DONE`
- owner 边界清晰
- 三个固定输出都已写出
- 五个成功标准都满足

### `DONE_WITH_CONCERNS`
- 输出可用于下游审查
- 仍有少量 open questions
- 这些 open questions 不会破坏 owner 边界

### `NEEDS_CONTEXT`
- 信息不足
- 但前置工作流条件基本已经具备

### `BLOCKED`
- 工作区没有准备好
- owner 没有真正定义
- 或需求仍停留在前置定位，而不是需求收敛

## 最终回复格式

始终以以下内容结尾：
- 完成状态
- 一段简短说明，概括聚焦后的 owner 范围

