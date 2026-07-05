---
title: "Using-Spec-First 技术方案文档"
type: archive
status: superseded
created: 2026-04-17
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Using-Spec-First 技术方案文档

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> **Status:** 设计思考稿（design rationale）
> **Authority:** 当前执行权威为 `2026-04-17-using-spec-first-host-split-integration-plan.md`；本文档承担"方案对比 + 设计原则推导 + 反模式拒绝"的解释性职责，不是实施计划。
> **Relationship:** 本文档与 host-split-integration-plan 在 §1/§2/§5 大量重叠。重叠部分的**字面 contract（资产路径、marker 名、state 字段、验收项）以 host-split-integration-plan 为准**；本文档聚焦"为什么选这个形态而不是那个"。若二者出现硬冲突，以 host-split-integration-plan 为准并回填修正本文档。
> **Scope:** 本文档描述的"Phase 1 新建"大多在 host-split-integration-plan 层面已完成（skill 本体、governance、runtime 安装、contract tests）。本文档内出现的"Create"措辞应读作"设计意图"，对应实现状态见 §1.4 仓库现状审计。

**Goal:** 为 `spec-first` 设计一个基于 `using-superpowers` 思路、但适配当前双宿主产品面与项目级安装模型的 `using-spec-first` 能力，使 `spec-first` 成为 Claude Code / Codex 会话进入 substantial work 前的默认治理层与统一流量入口：用户不再需要记忆 `spec-*` 或 `spec-*` 矩阵，而是先由 `using-spec-first` 接管入口、完成 workflow 分诊，再把请求路由到正确能力。

**Architecture:** 推荐采用“统一 skill 核心 + 双宿主 instruction bootstrap + Claude 专属 SessionStart 增强”的混合方案。`using-spec-first` 本体作为 `standalone_skill` 同时投递到 Claude 与 Codex；先用 repo-root 指令文件注入实现双宿主稳定生效，再在 Claude 上按官方 project hooks 契约增加会话启动自动注入；Codex 在缺乏已验证 session hook 契约前，不做自动 hook，对外仍以 skill 发现与 `AGENTS.md` bootstrap 为主。

**Tech Stack:** Node.js CommonJS, Markdown skill contracts, `CLAUDE.md` / `AGENTS.md` managed blocks, Claude Code project hooks (`.claude/settings.json` + `.claude/hooks/`), dual-host governance contract, Jest + shell smoke tests

---

## 1. 背景与代码事实

### 1.1 `using-superpowers` 的真实作用机制

`using-superpowers` 并不是一个普通“可选提示词”，而是一条会话级行为链。结合源项目 `/Users/kuang/xiaobu/superpowers` 的真实实现，可确认如下事实：

1. `hooks/hooks.json` 在 `SessionStart` 上注册 hook，matcher 为 `startup|clear|compact`，并显式配置 `async: false`。
2. `hooks/session-start` 在会话启动时读取 `skills/using-superpowers/SKILL.md` 全文，而不是摘要版片段。
3. hook 脚本会包一层 introduction wrapper，再把完整 skill 内容写入会话上下文。
4. 输出格式按宿主切换：
   - Claude Code：`hookSpecificOutput.additionalContext`
   - 其他兼容宿主：`additionalContext` 或 `additional_context`
5. `hooks/run-hook.cmd` 是 polyglot wrapper，核心目标是跨 Windows / macOS / Linux 调起同一个 extensionless hook 脚本。
6. `skills/using-superpowers/SKILL.md` 自身再用非常强的规则要求模型：任何响应前先判断 skill；只要有 1% 可能适用就必须调用 skill。
7. 它还显式规定：`using-superpowers` 已经通过 session context 加载，后续不要再用 Read 重读自己，而要对其他技能使用 `Skill` tool。
8. 由于它把 process skills 放在优先级前面，尤其把 brainstorming 设为默认前置，很多“准备开始做事”的请求都会先进入设计与澄清流程。

这说明，上游方案的核心不是“有一个 skill 文件”，而是“有一个会话启动注入器，把该 skill 变成会话默认行为约束”，而且这套约束强度的一半来自 skill 正文本身，另一半来自 hook 注入链路。

同时也能看出三个**不能直接照搬**的点：

1. `using-superpowers` 的 1% 强制 skill 纪律是“技能平台总入口”范式，`spec-first` 则是“workflow router”范式，目标不同。
2. 上游 hook 输出兼容多个宿主字段，是插件分发模型下的产物；`spec-first` 当前只需要收敛到项目级 Claude hook 契约。
3. 上游默认把 process discipline 放在前面，容易把任务先导向 brainstorming；这正是本方案要避免机械继承的部分。

### 1.1.1 从上游实现提炼出的设计原则

结合 `superpowers/hooks/session-start`、`superpowers/hooks/run-hook.cmd` 与 `skills/using-superpowers/SKILL.md`，本方案应继承以下原则：

1. **skill 正文是真规则，hook 只是注入器。**
2. **hook 输出要宿主感知，但不要为了兼容性发明多余契约。**
3. **跨平台执行入口是运行时可靠性问题，应优先复用宿主官方 shell 契约，必要时再引入 wrapper。**
4. **会话级 bootstrap 的真实效果，取决于“启动就注入”而不是“文件安装到位”。**
5. **若不希望继承上游行为偏差，必须在 skill 正文中明确写出不同的路由口径，而不是只改文档说明。**

### 1.1.2 对 `spec-first` 的直接启示

对 `using-spec-first` 而言，上游实现给出的直接启示是：

1. Phase 1 只能提供“instruction 级提醒”，不能等价替代 `SessionStart` 注入体验。
2. 若做 Claude Phase 2，就应像上游一样由 hook 读取运行时 `SKILL.md` 真源，而不是把规则复制到脚本里。
3. 是否需要 `run-hook.cmd` 这类 wrapper，取决于最终选定的 Claude hook 执行策略；它是工程取舍，不应先于官方 shell 契约被当成既定前提。
4. 但 `using-spec-first` 绝不能继承 `using-superpowers` 的“有 1% 可能就必须调用 skill”的全局技能总闸门，否则会错误放大 workflow 介入范围。
5. 上游强调“不要再次读取自己”的经验也值得继承：一旦 `using-spec-first` 通过 SessionStart 注入，就不应再引导系统重复读取同一个 skill 文件来完成 bootstrap。

### 1.2 `spec-first` 当前的真实架构

当前仓库已经有以下代码事实：

1. 用户可见 workflow 产品面已经固定：
   - Claude Code: `spec-*`
   - Codex: `spec-*`
2. workflow skill 与 standalone skill 由 `src/cli/contracts/dual-host-governance/skills-governance.json` 治理。
3. `spec-first init` 当前只会同步三类核心运行时资产：
   - commands
   - skills / workflowSkills
   - agents / agentSupportFiles
4. repo-root instruction file 已经有成熟写入链路：
   - Claude 写 `CLAUDE.md`
   - Codex 写 `AGENTS.md`
   - 由 `src/cli/lang-policy.js` 管理幂等 block
5. 目前没有 hook 运行时同步主链：
   - `src/cli/plugin.js` 不处理 hook 资产
   - `src/cli/state.js` 不追踪 hook 文件
   - `doctor / clean / init` 都不检查或移除 hook
6. 当前仓库是“项目级 runtime 资产安装器”，不是“像 superpowers 一样的宿主插件本体”。

### 1.3 官方宿主能力边界

已核对的宿主能力边界如下：

1. Claude Code 官方文档已公开 project hooks 机制，可通过项目内 `.claude/settings.json` 配置 `SessionStart` hook，并可引用项目目录下的 hook 脚本。
2. 在本次审阅的 OpenAI 官方 Codex 文档中，没有找到与 Claude `SessionStart` project hook 对等的稳定官方能力说明。
3. Codex 当前在本仓内的稳定集成面，仍然是：
   - `.agents/skills/`
   - `.codex/agents/`
   - `AGENTS.md`

因此，Claude 的”自动注入”可以按官方能力做，Codex 则必须先走非 hook 路线，避免凭猜测发明不存在的平台契约。

### 1.3.1 Claude Code 官方 SessionStart 契约（已核对）

以下事实来自 `https://code.claude.com/docs/en/hooks`，是本方案 Phase 2 能落地的必要前提：

1. **matcher 合法值：** 官方 SessionStart 支持 `startup | resume | clear | compact` 四值，`|` 分隔。选择哪几个是**设计决定**，不是事实问题。
2. **env var：** `$CLAUDE_PROJECT_DIR` 是官方公开的项目根变量，写法 `”$CLAUDE_PROJECT_DIR”/.claude/hooks/<script>`（官方示例即此写法，引号只包住变量本身以处理空格）。
3. **shell 字段：** command hook 支持 `shell: “bash”`（默认）或 `shell: “powershell”`。`shell: “powershell”` 直接在 Windows 用 PowerShell 执行命令，**不需要 `.cmd` polyglot wrapper 即可跨平台**。
4. **执行频次：** `SessionStart` 在每次 matcher 命中时触发一次 hook，对应事件由 matcher 值决定（`startup` 是新会话启动，`resume` 是会话恢复，`clear` 是 `/clear` 后，`compact` 是上下文压缩后）。`once: true` 字段只在 skill frontmatter 中生效，settings 里被忽略，因此 settings.json 配置下每次 matcher 命中都会重新注入 `additionalContext`。
5. **位置：** 项目级 hook 的真源是 `.claude/settings.json`（可提交到 repo）或 `.claude/settings.local.json`（gitignored）；plugin 模型的 `hooks/hooks.json` 只在 plugin 被启用时生效，与本方案不适用。

这些事实使本方案可以**脱离源项目 `run-hook.cmd` polyglot wrapper 的照搬**：官方 `shell: “powershell”` 已经提供了跨平台能力。是否仍保留 `.cmd` wrapper，是可选的工程取舍，不是跨平台必需品。

### 1.4 仓库现状审计（截至本文档当前提交）

| 层 | 资产 | 现状 | 归属 Phase |
| --- | --- | --- | --- |
| 真源 | `skills/using-spec-first/SKILL.md` | 已存在（英文撰写，93 行） | Phase 1 已完成 |
| 真源镜像 | `docs/10-prompt/skills/using-spec-first/SKILL.md` | 已存在 | Phase 1 已完成 |
| 治理 | `skills-governance.json` 中 `using-spec-first` 条目 | 已登记 `dual_host + standalone_skill` | Phase 1 已完成 |
| 运行时安装 | `.claude/skills/using-spec-first/` + `.agents/skills/using-spec-first/` | 已由现有 `syncBundledAssets` 管线安装 | Phase 1 已完成 |
| Runtime contract 测试 | `tests/unit/using-spec-first-runtime-contracts.test.js` | 已存在并通过 | Phase 1 已完成 |
| Bootstrap block | `CLAUDE.md` / `AGENTS.md` 中 `spec-first:bootstrap` 区块 | 未落地 | Phase 1b 待建 |
| Instruction bootstrap 生成器 | `src/cli/instruction-bootstrap.js` | 未落地 | Phase 1b 待建 |
| Claude hook 文件 | `templates/claude/hooks/session-start` | 未落地 | Phase 2 待建 |
| Claude hook wrapper | `templates/claude/hooks/run-hook.cmd`（可选） | 未落地；若采用官方 `shell` 字段可免除 | Phase 2 待建 |
| Claude settings merge | `src/cli/claude-settings.js` + `.claude/settings.json` 受管 matcher | 未落地 | Phase 2 待建 |
| state.hooks / state.settings.managedMatchers | state schema 扩展 | 未落地 | 后续可选加固项 |
| doctor/clean 扩展 | 对 bootstrap/hook/matcher 的诊断与清理 | 未落地 | Phase 1b + Phase 2 待建 |

**读法：** 本文档 §5.10 所列 “Create” 项目中，仅 “Phase 1b / Phase 2 待建” 行才是真的新建；”Phase 1 已完成” 行应读作”现状校验”，不应再次 create。

**工程解读：** 本文档描述的是目标态与设计边界，不等于“首轮实现必须一次性把所有控制面做完”。从当前仓库成熟度看，更稳妥的落地顺序应是：先补齐双宿主 bootstrap，再补 Claude SessionStart 最小闭环，最后再根据真实 drift/清理需求决定 state / doctor / clean 的细化粒度。

## 2. 设计目标

`using-spec-first` 需要满足以下目标：

1. 不照搬 `using-superpowers` 的“万物先 brainstorming”，而是改为“所有 substantial work 先进入 `using-spec-first`，再按 spec-first 工作流路由”。
2. 让 `spec-first` 从“用户主动调用的 workflow 集合”升级为“会话默认治理层与统一入口”。
3. 保持双宿主一致的逻辑核心，但承认宿主自动化能力不完全对称。
4. 不破坏现有双宿主治理：
   - 不能给 Codex 发明 `spec-*`
   - 不能把 standalone skill 写成 command
5. 优先复用现有 `init / doctor / clean / state / instruction file` 主链，而不是引入一套旁路安装系统。
6. 让用户无需记忆整个 workflow 矩阵，也无需自行判断首个 `spec-*` 或 `spec-*` 入口；入口接管由 `using-spec-first` 完成。
7. 保持可回滚、可审计、可测试，不把行为绑死在不可见的魔法配置里。
8. 形成机械可执行的闭环：任何运行时状态都能被 `init / doctor / clean` 解释、修复或清理。
9. 把“文件存在”与“行为正确”分开建模，确保验收既覆盖物理资产，也覆盖路由语义与宿主行为。
10. 明确接管对象是“workflow 分诊权”，而不是把所有任务统一导向 `spec-brainstorm`。

## 3. 非目标

本方案不包含以下目标：

1. 不在本轮为 Codex 设计未经验证的 session-start hook 兼容层。
2. 不把 `using-spec-first` 做成新的 `spec-using` 或 `spec-using` workflow command。
3. 不在本轮重构现有 13 个 workflow skill 的正文，只做路由层与激活层设计。
4. 不把 `lang-policy.js` 直接塞满所有 bootstrap 逻辑，避免语言治理与流程路由耦合。
5. 不引入第二套 skill 分类矩阵，继续以现有 `skills-governance.json` 为 skill 真源。

## 4. 方案对比

### 方案 A：只新增 `using-spec-first` standalone skill，不做自动激活

**做法**

1. 新增 `skills/using-spec-first/SKILL.md`
2. 加入 governance + docs mirror + contract tests
3. 用户需要在对话中显式触发或被上层指令提及

**优点**

1. 实现成本最低
2. 不需要改 `init / state / doctor / clean`
3. 没有宿主差异问题

**缺点**

1. 无法复现 `using-superpowers` 的核心价值
2. 仍高度依赖用户记忆和主动触发
3. 很难改变“直接开始写代码，不先走 workflow”的默认行为

**结论**

只适合作为最小占坑版本，不适合作为正式目标态。

### 方案 B：统一 skill 核心 + instruction bootstrap + Claude SessionStart 增强

**做法**

1. `using-spec-first` 作为双宿主 standalone skill 落地
2. 通过 `CLAUDE.md` / `AGENTS.md` managed block 提供稳定 bootstrap
3. Claude 再叠加 project-level `SessionStart` hook 做自动注入增强
4. Codex 先不做 hook，只保留 skill + `AGENTS.md`

**优点**

1. 逻辑核心双宿主统一
2. 自动激活能力只落在有官方契约的 Claude 上，风险可控
3. 立即复用现有 instruction file 管理主链
4. 路由强度可逐步升级，便于分阶段 rollout

**缺点**

1. Claude / Codex 的激活强度不完全一致
2. 需要新增 instruction bootstrap block 与 Claude hook 支撑代码
3. 需要处理 `.claude/settings.json` 的安全 merge

**结论**

推荐方案。它最接近 `using-superpowers` 的真实价值，同时尊重 `spec-first` 当前产品面和宿主能力边界。实现上应按“先 bootstrap、后 Claude 注入增强、最后再做控制面加固”的顺序推进，而不是首轮一次性拉满全部 runtime 基础设施。

### 方案 C：双宿主都做完整自动 hook 注入

**做法**

1. 统一新增 hook 资产管线
2. Claude / Codex 都在会话启动时自动注入 `using-spec-first`

**优点**

1. 体验最统一
2. 产品叙事最简单

**缺点**

1. 当前没有已验证的 Codex 官方 session hook 契约
2. 很容易为了“看起来对称”而堆出大量 speculative 兼容代码
3. 会把当前计划从“新增 skill + 路由 bootstrap”扩展成“跨宿主 runtime 基础设施工程”

**结论**

当前不推荐。除非后续拿到明确的 Codex 官方 hook 能力证明，否则应避免进入这条路径。

## 5. 推荐方案详解

### 5.1 核心定位

`using-spec-first` 应被定义为：

1. **类型：** `standalone_skill`
2. **作用：** `spec-first` 的会话级入口治理器（entry governor）与 workflow router / bootstrap contract
3. **不是：**
   - workflow command
   - brainstorming 替身
   - 脱离 `spec-first` 体系的新项目规则中心

它的职责不是执行具体工作，而是**先接管 substantial work 的入口解释权**，再把会话尽早路由到正确的现有能力：

1. 先判断这次请求是否应进入 `spec-first`
2. 若应进入，则决定进入哪个 workflow
3. 若不应进入，允许直接回答或执行普通任务

也就是说，`using-spec-first` 接管的是**入口分诊权**，而不是“亲自完成所有工作”。

它随后把会话路由到正确的现有能力：

1. `spec-ideate`
2. `spec-brainstorm`
3. `spec-plan`
4. `spec-work`
5. `spec-debug`
6. `spec-code-review`
7. `spec-compound`
8. `spec-graph-bootstrap`
9. `spec-graph-bootstrap`
10. `spec-mcp-setup`
11. `spec-sessions`
12. `spec-setup`
13. `spec-update`

#### 5.1.0.1 目标态用户体验

从产品体验看，目标态不是“用户知道该用哪个 `spec-*`”，而是：

1. 用户只需表达目标、问题或上下文。
2. 系统先经过 `using-spec-first` 进行统一分诊。
3. 正确 workflow 被自动激活或被优先引导。
4. 用户无需记忆命令矩阵，也无需先学会这套流程才能获得流程收益。

这才是“`spec-first` 成为默认治理层”的真正含义。

#### 5.1.1 与 `using-superpowers` 的关键差异

`using-superpowers` 的核心口径是“先检查 skill，process skill 优先，默认强制设计 discipline”。结合上游真实实现，本方案必须明确区分“应继承什么”和“必须拒绝什么”。

`using-spec-first` 应改成以下口径：

1. **先检查是否应该进入 `spec-first` 工作流**
2. **优先判断任务属于哪一类 workflow，而不是一律先 brainstorming**
3. **只有产品/范围不清、需要定义 WHAT 时，才进入 `spec-brainstorm`**
4. **如果用户已经给出明确计划输入，应优先去 `spec-plan` / `spec-work` / `spec-debug` / `spec-code-review`**
5. **简单直接问答、不涉及 workflow 收益的请求，不强行路由**

换句话说，它是 `workflow-first`，不是 `brainstorming-first`。

可继承的上游经验：

1. 会话级 skill 需要通过 SessionStart 才能真正成为默认行为约束。
2. hook 应读取运行时 `SKILL.md` 真源，而不是复制一份规则到脚本里。
3. 跨平台执行入口需要明确设计，但应优先采用宿主公开能力；wrapper 只有在官方 shell 契约不足以覆盖目标平台时才值得引入。
4. 已通过 SessionStart 注入的 skill，不应再被系统重复读取自身完成 bootstrap。

必须拒绝继承的上游行为：

1. 不继承“有 1% 可能适用就必须调用 skill”的全局技能总闸门。
2. 不继承“process skill 永远优先于其他路径”的通用规则。
3. 不把 `using-spec-first` 设计成 `spec-first` 生态的唯一总入口，导致普通任务也被强制 workflow 化。
4. 不为了追求宿主对称，仿造上游多平台 hook 输出兼容层去覆盖当前没有官方契约的 Codex 能力。

这四条应直接写入 skill 正文约束与 contract tests，而不是只保留在设计说明里。

### 5.2 Skill 正文合同

`skills/using-spec-first/SKILL.md` 建议包含以下核心结构：

1. **定位说明**
   - 这是 `spec-first` 的会话级 workflow bootstrap skill
   - 目标不是替用户做 brainstorming，而是接管 substantial work 的入口分诊
2. **强规则**
   - 在任何 substantial action 之前，先判断是否有匹配的 `spec-first` workflow 或 standalone skill
   - 若明显属于 `spec-first` 受益范围，应先进入 `using-spec-first` 的路由判定
   - 若 workflow 明显适用，应先读取对应 `SKILL.md`
3. **路由模型**
   - 路由应按决策树表达，而不是任何任务都自顶向下线性匹配
   - 先判断是否应进入 `spec-first`
   - 再判断进入哪个 workflow
   - 不把 `spec-brainstorm` 设为统一默认前置
4. **宿主入口说明**
   - Claude: `spec-*`
   - Codex: `spec-*`
   - standalone skills 按 skill 表述，不写成 slash command
5. **负向约束**
   - 不得把 Codex 入口写成 `spec-*`
   - 不得把 `using-spec-first` 自己写成 command-backed workflow
   - 不得因为“只是简单问题”就跳过 workflow 判定
   - 不得把“有 1% 可能适用”改写成强制进入 `spec-first` workflow
   - 不得把 `spec-brainstorm` 写成默认前置步骤
6. **退出条件**
   - 如果没有 `spec-first` workflow 适用，允许直接回答或执行普通任务
7. **注入后行为说明**
   - 若本 skill 已通过 SessionStart 注入，不需要再次读取自身文件完成 bootstrap
   - 后续应把 `Skill` tool 用于其他 workflow/skill，而不是重复加载自己

这样写的目的，是把“借鉴 `using-superpowers` 的会话级注入方式”和“拒绝继承其全局 1% 技能纪律”同时固化到正文 contract 中，并把“入口治理”写成显式责任，而不是暗含在措辞里。

### 5.3 激活层设计

#### 5.3.0 生命周期分层：先定义目标态，再决定是否固化为 state schema

从设计上，`using-spec-first` 只需要三个**目标层级**就能表达清楚：

| 层级 | Claude | Codex | 设计含义 |
| --- | --- | --- | --- |
| `NotInstalled` | 无 runtime skill、无 bootstrap、无 hook | 无 runtime skill、无 bootstrap | 项目尚未接入 `using-spec-first` |
| `BootstrapReady` | runtime skill + `CLAUDE.md` bootstrap | runtime skill + `AGENTS.md` bootstrap | 已具备稳定入口提示，适合首轮落地 |
| `SessionStartReady` | `BootstrapReady` + Claude `SessionStart` hook/matcher | 不适用 | 获得接近 `using-superpowers` 的自动注入体验 |

说明：执行权威文档当前使用 `BootstrapInstalled / SessionStartInstalled` 作为实现态命名；本节使用 `*Ready` 只是强调目标层级和 rollout 顺序，不额外引入第三套强制状态字段。

在这个分层之上，`doctor` 可以继续输出 `partial`、`drifted`、`cleaned` 等诊断词汇；但这些词汇**不必在首轮就全部固化为 state schema**。更稳妥的实现策略是：

1. 先把 `NotInstalled -> BootstrapReady -> SessionStartReady` 这条主路径打通。
2. `doctor` 先能指出“缺什么”“哪一层没完成”，不要求首轮就精确建模所有漂移子类。
3. 只有当真实使用中出现高频 drift / clean 误删问题时，再把这些诊断词汇下沉为 `state.json` 的正式字段。

这样做的好处是：文档仍然保留完整的目标态判断，但不会把首轮实现误导成“必须先把完整控制面做完才能落地”。

##### 5.3.0.1 双宿主独立性

无论最终 state schema 细化到什么程度，都有两条不变约束：

1. **宿主独立演化：** `init --claude` 不得改变 Codex 侧状态；`init --codex` 不得改变 Claude 侧状态；`clean` 同理。
2. **健康态允许非对称：** `(SessionStartReady, NotInstalled)`、`(BootstrapReady, BootstrapReady)`、`(NotInstalled, BootstrapReady)` 都是合法组合。Codex 当前不存在与 Claude `SessionStartReady` 对等的健康态，这不是“不完整”，而是宿主能力边界的正常结果。

#### 5.3.1 术语约束：什么叫 substantial work

文中 `substantial action / substantial work / substantial task` 统一指以下任一行为：

1. 修改代码、文档、配置或生成运行时资产
2. 启动实现、调试、评审、计划、bootstrap、上下文采集等 workflow
3. 运行会改变项目状态或依赖工作流上下文的命令

以下情形不视为 substantial work：

1. 单纯回答事实性问答
2. 不涉及落地动作的轻量解释
3. 明确无需 workflow 收益的即时小问答

因此，bootstrap 与 `using-spec-first` skill 的要求都是：**在进入 substantial work 前先判定是否应进入 `spec-first` 路由；若只是轻量问答，可直接回答。**

#### 5.3.2 三层激活的职责边界

为避免 bootstrap、skill 正文、hook 注入各自演化出不同规则，三层职责固定如下：

1. **instruction bootstrap：** 只负责提示“本项目已安装 `using-spec-first`，进入 substantial work 前先做 workflow 判定”。
2. **`using-spec-first` skill：** 是唯一的路由规则真源，负责具体 workflow 判定、入口命名与负向约束。
3. **Claude SessionStart hook：** 只负责把已安装的 skill 内容注入新会话，提高命中率，不重新定义路由规则。

因此：

1. bootstrap block 不复制完整路由表，只引用该 skill 的职责。
2. hook 执行层不发明摘要版规则，只包装 `SKILL.md` 内容与最小介绍语。
3. 任何路由顺序、宿主入口、负向约束的变更，都必须先改 `skills/using-spec-first/SKILL.md`，再同步测试与镜像。

#### 5.3.3 路由判定模型：分叉决策树 + 多命中仲裁

“决策树”意味着**节点级分叉判定**，不是从上往下试一遍编号条目。下面用伪代码形式给出分叉结构，实际 skill 正文可继续用自然语言表达，但分叉语义必须等价于此：

```text
decide(request):
  # 分叉 0：是否进入 spec-first
  if not isSubstantialWork(request):
    return DIRECT_ANSWER          # 轻量问答、事实查询直接出口
  if isSelfReferentialSkillLoad(request):
    return NOOP                   # 已通过 SessionStart 注入，不重复加载自己

  # 分叉 1：环境面 vs 工作面（互斥，环境面优先）
  if isEnvironmentOrToolingSetup(request):
    if isMcpScoped(request):      return spec_mcp_setup
    else:                          return spec_setup
  if isRuntimeRefreshOrUpgrade(request):
    return spec_update

  # 分叉 2:检索 vs 生产（检索早于生产）
  if isHistoricalOrContextLookup(request):
    return spec_sessions

  # 分叉 3:问题定位 vs 新产出（bug 类早于计划/执行类）
  if hasExistingFailureOrBug(request):
    return spec_debug
  if isEvaluationOrReview(request):
    return spec_review            # 文档评审可进一步细化为 spec-doc-review

  # 分叉 4:知识建库 vs 代码生产
  if isContextBuildingGoal(request):
    return routeAmong(spec_graph_bootstrap, spec_graph_bootstrap, spec_compound)

  # 分叉 5:WHAT vs HOW vs DO
  scopeClarity = assessScopeClarity(request)
  match scopeClarity:
    case UNCLEAR_WHAT:      return spec_brainstorm_or_ideate
    case CLEAR_WHAT_NO_PLAN: return spec_plan
    case CLEAR_PLAN_OR_TASK: return spec_work

  return DIRECT_ANSWER            # 以上皆不命中，允许直接回答
```

**多命中仲裁规则**（分叉并非总是互斥，当以下冲突发生时按此裁定）：

| 冲突 | 裁定 | 理由 |
| --- | --- | --- |
| 既是 review 又涉及 bug | review 优先 | review 的产物会把 bug 转为待 fix 项，避免跳过审计环节 |
| 既要 bootstrap 又要 plan | 先 bootstrap 再 plan | plan 需要 context 作为输入 |
| 既像 debug 又像 work（已知 bug 修复） | bug 复现未达成前走 debug，复现/根因确认后再 work | 避免先写修复再补现场 |
| 既像 plan 又像 work（边想边做） | 若涉及 ≥3 文件或跨模块，走 plan；否则 work | 与 `spec-plan` deepening contract 一致 |
| 既像 setup 又像 work（新项目起步） | setup 优先 | 环境未就绪时 work 一定失败 |
| 既像 ideate 又像 brainstorm | 依 `spec-brainstorm` 与 `spec-ideate` 的现行职责划分，不在本 skill 中重定义 | 避免与下游 workflow contract 耦合 |

**两条强约束**（同 §5.1.1 反模式一致，此处作为分叉规则的不变量）：

1. `spec-brainstorm` **不是任何分叉的默认分支**，只在分叉 5 `UNCLEAR_WHAT` 才触达。
2. `spec-plan` / `spec-work` 在分叉 5 先于 `spec-brainstorm` 检查，只要 scopeClarity 达标就不绕行。

**可测性：** 上述分叉结构应转化为 `tests/unit/using-spec-first-contracts.test.js` 中的案例表——每条 `match` 分支对应 ≥1 个 fixture 请求，断言最终路由值。这把”文字决策树”变成”机械可验证 contract”。

推荐分三层激活：

### 第 1 层：双宿主 skill 本体

所有宿主都安装：

1. Claude: `.claude/skills/using-spec-first/`
2. Codex: `.agents/skills/using-spec-first/`

这层提供“能力本体”和手动 fallback。

### 第 2 层：双宿主 instruction bootstrap

通过 repo-root instruction file 注入一段稳定、幂等的 managed block：

1. Claude 写到 `CLAUDE.md`
2. Codex 写到 `AGENTS.md`

这段 block 的目标不是复制整个 `SKILL.md`，而是：

1. 告诉宿主当前项目已安装 `using-spec-first`
2. 在进入 substantial work 前，应先使用它完成 workflow 判断
3. 使用宿主正确的入口命名

这层的优势是：

1. 与现有 `lang-policy.js` 机制一致
2. 双宿主都能立刻生效
3. 不依赖宿主 hook 能力

### 第 3 层：Claude project hook 自动注入

在 Claude 上，再增加一层增强：

1. 在 `.claude/settings.json` 中登记 `SessionStart` hook
2. 调用项目内受管的 `session-start` hook 入口
3. `session-start` 读取项目内安装好的 `using-spec-first/SKILL.md`
4. 返回 `hookSpecificOutput.additionalContext`

这层的目标是把 `using-spec-first` 从“instruction 级提示”提升为“每次新会话都能拿到的强上下文注入”。

### 5.4 为什么不能直接照搬上游 `hooks/hooks.json`

这是本方案最重要的适配点。

上游 `superpowers` 是插件安装模型，因此可以：

1. 在插件根目录放 `hooks/hooks.json`
2. 由宿主插件系统读取该 hooks 清单
3. 再从插件目录内读取 `skills/using-superpowers/SKILL.md`

但当前 `spec-first` 是项目级 runtime 资产安装器，不是同类型插件宿主。直接复制 `hooks/hooks.json` 有三个问题：

1. 当前 `init` 不会把 repo 根的 `hooks/` 作为宿主插件能力注册出去
2. 当前运行时资产主要安装到项目内 `.claude/*` / `.agents/skills/*`
3. 项目级方案更自然的官方入口是 Claude 的 `.claude/settings.json` project hooks

因此本方案明确不采用“把上游插件 hooks 目录原样搬来”的方式，而是采用：

1. 统一 skill 仍然走现有 runtime sync 链
2. Claude 自动注入通过项目设置和项目 hook 脚本完成

### 5.5 Source-of-Truth 与运行时映射

建议的真源与运行时映射如下：

| 类别 | 真源 | Claude 运行时 | Codex 运行时 |
| --- | --- | --- | --- |
| `using-spec-first` skill | `skills/using-spec-first/` | `.claude/skills/using-spec-first/` | `.agents/skills/using-spec-first/` |
| docs mirror | `docs/10-prompt/skills/using-spec-first/` | 文档镜像，不直接执行 | 文档镜像，不直接执行 |
| instruction bootstrap | `src/cli/instruction-bootstrap.js` + block builder | `CLAUDE.md` | `AGENTS.md` |
| Claude hook script | `templates/claude/hooks/` | `.claude/hooks/` | 不安装 |
| Claude hook registration | `src/cli/claude-settings.js` 或等价 helper | `.claude/settings.json` | 不适用 |

补充约束：

1. `skills/using-spec-first/` 是路由语义的唯一真源；docs mirror 只是镜像，不得独立演化规则。
2. 运行时副本（`.claude/skills/*`、`.agents/skills/*`、`.claude/hooks/*`、`CLAUDE.md` managed block、`AGENTS.md` managed block、`.claude/settings.json` 托管 matcher）都不是人工维护面。
3. 用户手改运行时副本视为 drift：
   - `doctor` 负责发现并解释
   - `init` 负责收敛回真源
   - `clean` 只删除能确认属于 spec-first 管理的项
4. `doctor` 的判断基线永远是“真源 + 受管生成规则”，而不是“当前文件存在即可”。

为便于实现与测试，受管资产建议进一步按粒度建模：

| 资产 | 类型 | 真源/生成器 | 是否允许人工修改 | `doctor` 检查方式 | `clean` 删除方式 |
| --- | --- | --- | --- | --- | --- |
| `skills/using-spec-first/SKILL.md` 镜像到 runtime | 文件资产 | runtime sync | 否 | 路径存在 + 内容对齐 transform 结果 | 删除受管文件路径 |
| bootstrap block | 文本区块资产 | `buildBootstrapBlock(adapter)` | 否 | marker 存在 + 内容与生成器一致 | 删除 marker 区块 |
| `.claude/hooks/session-start` | 文件资产 | `templates/claude/hooks/session-start` | 否 | 文件存在 + 内容/执行入口匹配 | 删除受管文件路径 |
| `.claude/hooks/run-hook.cmd`（仅在采用 wrapper 方案时） | 文件资产 | `templates/claude/hooks/run-hook.cmd` | 否 | 文件存在 + 命令入口匹配 | 删除受管文件路径 |
| `.claude/settings.json` 中 SessionStart matcher | 配置资产 | `upsertSpecFirstSessionStartHook(...)` | 否 | hooks 路径、matcher、command 完整匹配 | 仅删除命中的受管 matcher |
| state 中 `hooks` 记录 | 状态资产 | `buildState/normalizeState` | 否 | schema + 路径集一致性 | 更新 state 并移除对应记录 |

这样做的目标是让“文件资产”和“配置资产”都能被明确诊断，而不是只靠路径存在性猜测系统状态。

#### 5.5.1 幂等与重复执行 contract

`init / doctor / clean` 必须遵循以下机械 contract：

1. **`init` 是收敛型操作**
   - 重复运行不产生重复 matcher、重复 block、重复 hook 文件副本。
   - 遇到 partial/drift 状态时，输出应收敛到目标健康态，而不是保留半修复状态。
2. **`doctor` 是纯诊断操作**
   - 不改文件、不自动修复，只给出缺口、漂移项和建议动作。
3. **`clean` 是最小破坏删除操作**
   - 只删除可确认属于 spec-first 托管的资产。
   - 不得因为清理 spec-first 而误删用户自定义 hooks、权限或无关文本。
4. **失败后可重入**
   - 任一中间步骤失败后，用户再次执行 `init`，应能从当前残留状态继续收敛，而不是要求先手工清场。
5. **阶段可判定**
   - Claude 能明确判断当前是“只完成 Phase 1”还是“已完成 Phase 2”；Codex 则只存在 Phase 1 健康态。

这意味着实现上应避免"先删后重建"的粗暴策略，优先使用结构化 upsert、内容级替换和受管边界识别。

##### 5.5.1.1 受管边界识别谓词（clean / doctor 共用）

为避免 `clean` 删到用户自定义 hook，或 `doctor` 错把用户 hook 当成 drift 的 spec-first 受管项，所有识别必须通过以下显式谓词，**禁止用"数组中第一个 SessionStart" / "matcher 字符串包含 spec-first" 之类的启发式匹配**：

| 资产 | 谓词 | edge case 处理 |
| --- | --- | --- |
| `.claude/settings.json` 中的 SessionStart hook | `isSpecFirstManagedHook(hook)`：`hook.type === "command"` 且 `hook.command` 经正则 `/(^|[^A-Za-z0-9_])\.claude\/hooks\/session-start(\s|"|$)/` 匹配 | 用户把 spec-first 路径 copy 到另一条 matcher 并修改命令 → **仍判为受管**（命令尾缀未变）；`clean` 会一起删除，这是正确行为，因为该 command 仍指向受管脚本 |
| 同一 matcher 内多条 hooks | 只删命中谓词的 hook 项，保留同 matcher 下其它 hook | 若删除后 hooks 数组为空，则一并移除 matcher；若 SessionStart 数组为空，则移除 SessionStart 键；若 hooks 对象为空，则移除 hooks 键 |
| 非受管 SessionStart hook | 不命中谓词 | `doctor` 显式忽略，不视为"未完成 Phase 2"；用户保留自定义 hook 的权利 |
| bootstrap block | marker pair 命中 `<!-- spec-first:bootstrap:start -->` 与 `<!-- spec-first:bootstrap:end -->` | 仅删除这对 marker 之间（含 marker 行）的内容，不动 `spec-first:lang` 等其它受管块 |
| hook 脚本文件 | 受管目标路径 + 模板内容比对 | 若内容不匹配 → `Drifted`（疑似手改）；首轮实现只要求 `doctor` 报告并由 `init` 回写，不额外引入 `clean --force` 接口 |

**重要的反面约束：** 不得以"是否位于 `.claude/hooks/` 目录"作为受管判据。用户可能在该目录下放自己的 hook。只有 state 记录过的路径才是受管路径。

### 5.6 Skill 治理分类

`using-spec-first` 应进入 `skills-governance.json`，推荐记录如下：

```json
{
  "skill_name": "using-spec-first",
  "entry_surface": "standalone_skill",
  "command_name": null,
  "host_scope": "dual_host",
  "owner_host": null,
  "host_delivery": {
    "claude": "skill",
    "codex": "skill"
  }
}
```

理由：

1. 它不是 manifest `commands` 中的 command-backed workflow
2. 它应该可在双宿主被发现
3. Claude 自动 hook 注入只是“激活增强层”，不改变它在治理上的 skill 类型

### 5.7 Instruction Bootstrap 设计

#### 5.7.1 不复用 `spec-first:lang` block

不建议把 `using-spec-first` 逻辑直接塞进 `<!-- spec-first:lang:start -->` block，原因是：

1. 语言治理与 workflow bootstrap 生命周期不同
2. 语言策略几乎总是稳定的，workflow bootstrap 会持续演进
3. 未来如果用户只想刷新语言块，不应影响路由块

建议新增第二组幂等 marker，例如：

```md
<!-- spec-first:bootstrap:start -->
... using-spec-first bootstrap content ...
<!-- spec-first:bootstrap:end -->
```

#### 5.7.2 写入链路

建议新增独立模块，例如：

1. `src/cli/instruction-bootstrap.js`
2. 导出：
   - `writeInstructionBootstrap(projectRoot, adapter)`
   - `applyManagedBootstrapBlock(existing, block)`
   - `buildBootstrapBlock(adapter)`

并在 `src/cli/commands/init.js` 中于 `writeLangPolicy(...)` 后调用。

#### 5.7.3 Bootstrap block 内容建议

block 内容不需要复制完整 skill，但需要明确：

1. 当前项目安装了 `using-spec-first`
2. 进入 substantial task 前优先使用该 skill 做 workflow 路由
3. Claude workflow 入口是 `spec-*`
4. Codex workflow 入口是 `spec-*`
5. standalone skills 仍按 skill 方式表述

### 5.8 Claude Hook 设计

本节所有设计选择都以 §1.3.1 坐实的官方 SessionStart 契约为事实基线。

#### 5.8.1 运行时文件

建议新增：

1. `templates/claude/hooks/session-start`（bash，带 `#!/usr/bin/env bash` 显式 shebang）
2. `templates/claude/hooks/session-start.ps1`（仅当后续决定强支持 Windows-native 时再引入）
3. `templates/claude/hooks/run-hook.cmd`（仅当官方 shell 契约不足以覆盖目标平台时才考虑）

职责划分：

1. `session-start` 只做一件事：读取安装后的 `.claude/skills/using-spec-first/SKILL.md`，按官方 JSON 输出格式注入当前会话。
2. `.ps1` 变体（如采用）承担 Windows 原生路径，不依赖 WSL/Git Bash。
3. `run-hook.cmd`（如采用）只是执行入口兼容层，不承担第二套路由语义。

##### 5.8.1.1 跨平台策略：两套可选方案，必须显式选定

源项目 `superpowers` 用的是 `run-hook.cmd` polyglot wrapper，这是**插件模型下的工程取舍**，不是官方必需。官方 `shell` 字段（`"bash"` 默认 / `"powershell"`）已经提供了原生跨平台能力。两种方案的权衡：

| 方案 | Windows 行为 | 配置复杂度 | 脚本形态 | 推荐场景 |
| --- | --- | --- | --- | --- |
| **A. 单 shell 脚本 + 官方 `shell: "bash"`** | 依赖 Git Bash / WSL 可用 | 最低（一条 matcher） | 只维护一份 bash | Windows 用户自带 bash 环境，或项目不打算强支持 Windows |
| **B. 双脚本 + 按平台写两个 matcher** | 用 `shell: "powershell"` 调 `.ps1` | 中等（需要按平台 upsert） | bash + powershell 各一份 | 需要零依赖支持原生 Windows |
| **C. polyglot `run-hook.cmd` 单脚本** | `.cmd` 文件头部走 batch，下半部分走 bash | 低（一条 matcher） | 一份诡异但统一的文件 | 强制对齐源项目口径 |

**本方案默认采用方案 A**，理由：

1. 当前 `spec-first` 的 smoke / integration 测试链路都在 bash 下，Windows 原生支持不是必须承诺。
2. 方案 B 的双 matcher upsert 会让 `claude-settings.js` merge 逻辑复杂度翻倍，与 §5.5.1 的"结构化 upsert"意图冲突。
3. 方案 C 依赖文件双重解释行为，调试成本高、可读性差。

若未来出现明确 Windows-native 支持需求，再升级到方案 B，并在 §5.10.3 新增 `session-start.ps1` 与按平台 matcher。

#### 5.8.2 Claude project settings merge

由于 Claude 官方 project hooks 使用 `.claude/settings.json`，因此需要新增 settings merge helper。

建议新增模块：

1. `src/cli/claude-settings.js`

职责：

1. 读取 `.claude/settings.json`
2. 幂等 upsert 一个 spec-first 管理的 `SessionStart` matcher
3. 保留用户现有 hooks / permissions / 其他 settings
4. 在 `clean --claude` 时只移除 spec-first 管理的那一项，不误删用户自定义 hooks

建议写入的 matcher 形态（官方写法，引号只包住变量名以处理空格）：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start"
          }
        ]
      }
    ]
  }
}
```

说明（每条对应一个可测 contract）：

1. **引号写法：** `"$CLAUDE_PROJECT_DIR"/...`，引号只包住变量名。这是 `https://code.claude.com/docs/en/hooks` 示例的标准写法，用于路径含空格时保持展开正确。不要写成 `"$CLAUDE_PROJECT_DIR/..."`。
2. **matcher 选择：** 采用 `startup|resume|clear|compact` 四值全覆盖，而不是源项目的 `startup|clear|compact`。加入 `resume` 的理由：会话恢复时用户预期仍能享有默认治理层；漏掉 `resume` 会导致 `claude --resume` 进来的会话无 workflow 分诊入口，与 §5.1.0.1 的用户体验目标冲突。
3. **`async: false` 不必显式写：** 官方默认即同步阻塞等待 hook 返回，与源项目显式写法等价。保留"不写"可以减少受管字段，降低 drift 噪声。
4. **管理归属识别：** 以 `command` 字符串中的 `.claude/hooks/session-start` 尾缀作为 spec-first 托管标记。`isSpecFirstManagedHook(hook)` 谓词：`hook.type === "command" && /(^|[^A-Za-z0-9_])\.claude\/hooks\/session-start(\s|"|$)/.test(hook.command)`。见 §5.5.1 edge case 讨论。
5. **append-or-upsert：** 如果项目已有 `SessionStart` matcher 数组，采用"按谓词 upsert"，不覆盖整个数组，不合并到其它 matcher 里。

##### 5.8.2.1 注入频次与上下文经济性

官方 SessionStart 在每次 matcher 命中时调用 hook，`once: true` 仅对 skill frontmatter 生效、settings 下被忽略。这意味着在 `startup|resume|clear|compact` 下，**会话内每触发一次 `/clear` 或自动 compact，就会重新注入一份 `SKILL.md`**。因此必须明确三件事：

1. **skill 长度预算：** `using-spec-first/SKILL.md` 当前 93 行（约 2 KB）。设计上要求该文件保持在 ≤150 行 / ≤4 KB，使单次注入 token 代价 ≤1.5k token，低于 `clear/compact` 事件的节省价值。超出上限时先精简 skill，不要让 hook 裁剪 skill。
2. **重复注入去重：** 官方并不保证跨 `clear/compact` 的上下文去重。本方案接受这次代价，换取"用户 `/clear` 之后仍然默认拿到 workflow 分诊"的体验。若未来观测到上下文膨胀问题，降级手段是从 matcher 中移除 `compact`。
3. **与 bootstrap block 的重叠：** `CLAUDE.md` 里已有 bootstrap block 会在每次加载 `CLAUDE.md` 时读入。hook 注入的 `additionalContext` 与 bootstrap block 内容**必须差异化**——bootstrap block 只做"提示 + 入口"（见 §5.7.3），不重复 skill 正文；hook 注入才负责带入 skill 正文全文。`doctor` 应检查二者的信息重叠度低于阈值（同一段规则文字不应同时出现在 bootstrap block 与 skill 正文中）。

#### 5.8.3 `session-start` 输出合同

`session-start` 应遵循 Claude hook 返回格式，返回：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "..."
  }
}
```

脚本内部逻辑建议：

1. 计算项目路径
2. 读取 `.claude/skills/using-spec-first/SKILL.md`
3. JSON escape
4. 包一层稳定的 introduction wrapper
5. 输出 JSON

为避免 hook 输出只能“看起来工作”，这里增加更具体的内容 contract：

1. `additionalContext` 必须包含稳定 introduction wrapper，明确说明这是由 `using-spec-first` SessionStart 注入的上下文。
2. wrapper 后拼接的主体内容以运行时 `SKILL.md` 为准，不在 hook 脚本内另写一套路由摘要。
3. wrapper 建议带上受管标识或版本提示，便于调试时判断注入来源。
4. 若未来存在宿主上下文长度限制，应优先裁剪 wrapper，不裁剪 skill 的关键规则段；若必须裁剪 skill 内容，需在文档中明确截断策略并补测试。

如果 skill 文件缺失：

1. 不中断用户会话
2. 返回空上下文或可诊断的最小提示
3. 由 `doctor --claude` 报告缺失

推荐把失败处理再细化为统一规则：

| 失败场景 | hook 行为 | `doctor` 行为 | `init` 修复动作 |
| --- | --- | --- | --- |
| skill 文件缺失 | 不阻断会话，返回空上下文或最小诊断语 | 报告 `using-spec-first` runtime skill 缺失 | 重新同步 runtime skill |
| hook 脚本存在但读取失败 | 不阻断会话，输出最小诊断语 | 报告 hook drift 或权限/路径异常 | 重新覆盖受管 hook 文件 |
| settings matcher 缺失 | 当前会话无自动注入 | 报告 Phase 2 未完成或配置漂移 | upsert 受管 matcher |
| matcher 存在但 command 路径不匹配 | 不假定可执行成功 | 报告 command drift | 重写为受管 command |
| bootstrap block 缺失但 skill 存在 | 无 instruction 级提示 | 报告 bootstrap drift | 重写 block |

该表的目的，是把“不中断用户会话”和“仍然可诊断、可收敛”同时纳入设计 contract。

#### 5.8.4 `doctor` 诊断口径

`doctor` 对 `using-spec-first` 的检查不应停留在“有没有这些文件”，而应至少覆盖：

1. runtime skill 是否存在，且内容与 transform 后真源一致
2. bootstrap managed block 是否存在，marker 是否成对闭合，内容是否与 builder 输出一致
3. Claude Phase 2 下：
   - `.claude/hooks/session-start` 是否存在
   - 若采用 wrapper 方案，`.claude/hooks/run-hook.cmd` 是否存在
   - `.claude/settings.json` 中是否存在命中受管 command 路径的 `SessionStart` matcher
4. state 中 `hooks` 记录是否与实际安装资产一致
5. 宿主入口文案是否未串宿主：
   - Claude 不出现 `spec-*` 作为主入口
   - Codex 不出现 `spec-*` 作为主入口

`doctor` 输出建议按以下分类：

1. **missing**：必需受管资产缺失
2. **drifted**：资产存在但内容或路径不符
3. **partial**：只完成部分阶段
4. **healthy**：与目标阶段 contract 一致

### 5.9 Codex 侧策略

Codex 侧当前不做 hook 自动注入，推荐策略是：

1. 安装 `using-spec-first` 到 `.agents/skills/using-spec-first/`
2. 在 `AGENTS.md` 写 bootstrap block
3. 保持现有 workflow 产品面：
   - `spec-plan`
   - `spec-work`
   - `spec-debug`
   - `spec-code-review`
   - 其他 `spec-*`

这样做的好处是：

1. 完全遵守当前双宿主治理 contract
2. 不需要伪造 `.codex/hooks` 或未知配置
3. 后续如 OpenAI 发布正式 session hook，再单独扩展 adapter 即可

另外补充一条边界：Codex 当前健康态只有 Phase 1，不存在“因为没有 hook 所以不完整”的错误判断。也就是说：

1. Codex 安装 skill + bootstrap 即可被判定为健康。
2. 只有在错误出现 `spec-*`、缺少 runtime skill、缺少 bootstrap block、镜像内容漂移时，才算 partial/drift。
3. 若未来引入官方 hook 能力，应作为新 phase 单独建模，而不是反向修改当前 Phase 1 健康定义。

### 5.10 代码改动面

> 本节**所有 `Create` 条目**都需要对照 §1.4 仓库现状审计表读：若对应资产已在 `Phase 1 已完成`，则这里的"Create"应读作"Verify（确认内容收敛，不重复生成）"；只有 `Phase 1b 待建` 与 `Phase 2 待建` 行才是真正新建。

#### 5.10.1 核心内容与治理（Phase 1 — 多数已落地，仅剩校验）

1. Verify: `skills/using-spec-first/SKILL.md`（已存在，§1.4 行 1）
2. Verify: `docs/10-prompt/skills/using-spec-first/SKILL.md`（已存在，§1.4 行 2）
3. Verify: `src/cli/contracts/dual-host-governance/skills-governance.json`（已登记，§1.4 行 3）
4. Optional docs:
   - `README.md`
   - `docs/05-用户手册/02-核心概念.md`
   - `docs/05-用户手册/04-常见问题.md`

#### 5.10.2 指令文件 bootstrap（Phase 1b — 待建）

1. Create: `src/cli/instruction-bootstrap.js`
2. Modify: `src/cli/commands/init.js`（在 `writeLangPolicy(...)` 之后追加 `writeInstructionBootstrap(...)` 调用）
3. Optional small refactor: 让 `lang-policy.js` 与 bootstrap 共用统一 marker 应用工具（同一个 `applyManagedBlock(source, marker, content)` 可重用于两个块）

#### 5.10.3 Claude hook 主链（Phase 2 — 待建）

按 §5.8.1.1 方案 A 落地：

1. Create: `templates/claude/hooks/session-start`（bash only，不创建 `.cmd` / `.ps1`）
2. **Skip** `templates/claude/hooks/run-hook.cmd`（方案 A 下不需要，除非后续升级到方案 B/C）
3. Create: `src/cli/claude-settings.js`
4. Modify: `src/cli/adapters/claude.js`（增加 hook 文件同步逻辑）
5. Modify: `src/cli/commands/init.js`（Phase 2 分支调用 claude-settings + hook 文件安装）
6. Modify: `src/cli/commands/doctor.js`（新增 bootstrap / hook / matcher 诊断）
7. Modify: `src/cli/commands/clean.js`（新增受管 hook 文件与 matcher 清理）
8. Optional future hardening: `src/cli/state.js`（仅当后续确认需要更细粒度的受管回溯时再扩展）

#### 5.10.4 检查与清理

如果后续实践证明 hook 资产必须纳入更细粒度的受管集合，再考虑新增 state 字段：

1. `hooks`

并同步更新：

1. `buildState`
2. `normalizeState`
3. `validateManagedStateShape`
4. `removeManagedAssets`
5. `removeObsoleteManagedAssets`
6. `hardResetManagedAssets`
7. `managed-state` unit tests

### 5.11 测试策略

#### 5.11.1 Skill contract tests

新增 `tests/unit/using-spec-first-contracts.test.js`，至少覆盖：

1. frontmatter 名称与描述存在
2. 正确区分 Claude `spec-*` 与 Codex `spec-*`
3. 不把 standalone skill 写成 command
4. 路由优先级明确是 workflow-first，而不是 brainstorming-first
5. Claude / Codex runtime transform 后名称与内容保持正确
6. skill 正文明确“接管入口分诊权”，而不是“统一先 brainstorm”
7. 注入后不重复读取自身的口径存在

#### 5.11.2 Instruction bootstrap tests

建议新增 shell/unit tests，覆盖：

1. block 首次写入
2. block 幂等替换
3. 与 `lang-policy` block 共存
4. 不破坏用户自定义内容
5. bootstrap 只做入口提示，不复制完整路由表

#### 5.11.3 Claude settings merge tests

建议新增 `tests/unit/claude-settings.test.js`，覆盖：

1. 空 settings 文件时创建 hooks 块
2. 现有 settings 中追加 spec-first matcher
3. 重复运行 init 不产生重复 matcher
4. clean 只删除 spec-first 管理的 matcher
5. 保留 unrelated hooks / permissions / 其他字段

#### 5.11.4 Managed state tests

若后续把 hook / matcher 精细回溯正式下沉到 `state.json`，再扩展 `tests/unit/managed-state-contracts.test.js`，覆盖：

1. `hooks` 字段是必填数组
2. 旧 state 无 `hooks` 时的 legacy 行为
3. remove / obsolete prune 对 hook 文件有效

#### 5.11.5 Smoke tests

扩展 `tests/smoke/cli.sh` 或新增 smoke：

1. `spec-first init --claude`
   - 安装 `.claude/skills/using-spec-first/`
   - 写入 `CLAUDE.md` bootstrap block
   - 写入/合并 `.claude/settings.json`
   - 安装 `.claude/hooks/*`
2. `spec-first init --codex`
   - 安装 `.agents/skills/using-spec-first/`
   - 写入 `AGENTS.md` bootstrap block
   - 不生成 `.codex/hooks`
   - 不写 Codex `spec-*`
3. `spec-first doctor --claude`
   - 能发现 hook 缺失/漂移
4. `spec-first clean --claude`
   - 能清理 hook 文件与受管 matcher

### 5.12 分阶段落地建议

#### Phase 1：双宿主 skill + instruction bootstrap

交付：

1. `using-spec-first` skill
2. governance entry
3. docs mirror
4. `CLAUDE.md` / `AGENTS.md` bootstrap block
5. skill contract tests + bootstrap tests

收益：

1. 立刻形成双宿主可用的默认 workflow 提示
2. 改动面小
3. 无 Claude settings merge 风险

**工程建议：** 首轮实现到这里就已经能验证 `using-spec-first` 是否真的提升入口命中率。若这一层的命中率和用户体验没有明显改善，不应直接把问题转嫁给 Phase 2，而应先回头收紧 skill 正文与 bootstrap 文案。

**Phase 1 命中率度量（建议作为后续评估 harness 或手工 benchmark 采集，而不是当前 smoke gate 的阻塞条件）：**

1. 定义命中率：在一组固定的 substantial work fixture 请求下（建议 ≥20 条，覆盖决策树所有分叉），统计 Claude / Codex 首轮回复中是否引用了正确 workflow 入口（`spec-*` / `spec-*`）或显式触发对应 skill。
2. 采集方法：需要单独的会话级评估 harness，或作为人工验证 / benchmark 流程执行；当前仓库的 shell smoke tests 只适合验证安装与文件落盘，不适合直接充当 assistant-response 采集器。
3. 判定阈值：Phase 1 目标命中率 ≥60%（不依赖 hook 注入）；若低于 40%，说明 bootstrap block 表达不足，应回到 §5.7.3 修订，而不是把问题推给 Phase 2。
4. 这项度量同时作为 Phase 2 ROI 的基线：Phase 2 命中率若相对 Phase 1 无显著提升，说明 hook 注入并未带来实际价值，应回头检查 skill 正文或 matcher 覆盖。

#### Phase 2：Claude SessionStart 自动注入

交付：

1. `.claude/hooks/*`
2. `.claude/settings.json` merge
3. 最小可用的 doctor/clean 扩展
4. Claude hook tests + smoke

收益：

1. 获得接近 `using-superpowers` 的真实体验
2. 只在官方支持的宿主上增强

**收敛原则：** Phase 2 的首轮目标是“让 Claude 新会话自动拿到 `using-spec-first`”，不是“同时做完所有精细化控制面”。`state` 扩展、漂移子类、深度 matcher 比较应按真实维护痛点逐步追加，而不是默认一次性上齐。

#### Phase 3：Codex hook 能力再评估

前提：

1. 获得明确、稳定、可文档化的 OpenAI 官方 hook/session bootstrap 契约

没有这个前提，不进入实现。

### 5.13 主要风险与缓解

#### 风险 1：`using-spec-first` 变成“所有请求都进 spec-brainstorm”

**缓解：**

1. Skill 正文里显式写 `workflow-first`
2. 路由设计改为决策树，而不是线性优先级表
3. contract test 断言不得出现“默认先 brainstorm 一切任务”的口径
4. 明确 `spec-plan` / `spec-work` 在输入已清晰时优先于 brainstorm

#### 风险 2：`.claude/settings.json` merge 破坏用户现有配置

**缓解：**

1. 使用结构化 parse + 精确 upsert
2. 以命令路径识别 spec-first 托管项
3. clean 时只移除该托管项
4. 单测覆盖 merge / update / remove
5. 不使用“整段覆盖 hooks 数组”这类粗暴写法

#### 风险 3：Codex 产品面被错误写成 `spec-*`

**缓解：**

1. `using-spec-first` contract tests
2. dual-host governance tests
3. docs grep negative guard
4. `doctor` 把宿主入口串写视为 drift，而不是文案小问题

#### 风险 4：instruction bootstrap 与 language policy 漂移冲突

**缓解：**

1. 使用独立 marker
2. 单独维护 builder / test
3. 不把两个 block 混成一个管理单元
4. `doctor` 检查 marker 成对闭合与内容级一致性

#### 风险 5：系统停留在 partial/drift 状态，用户无法判断如何修复

**缓解：**

1. 用生命周期状态机统一定义健康态、partial、drift
   - 首轮实现至少做到 `NotInstalled / BootstrapReady / SessionStartReady` 三层可判定
2. `doctor` 输出固定分类：`missing / partial / drifted / healthy`
3. `init` 明确定义为收敛动作，允许从中间失败态重入恢复
4. 为常见失败场景提供明确修复动作矩阵

## 6. 验收标准

满足以下条件时，可认为 `using-spec-first` 方案完成。

### 6.1 资产存在性验收

1. `spec-first init --claude` 后：
   - `.claude/skills/using-spec-first/SKILL.md` 存在，且**内容 hash 与 `skills/using-spec-first/SKILL.md` 经 Claude adapter transform 后的结果一致**（仅存在性不算通过）
   - `CLAUDE.md` 存在 `<!-- spec-first:bootstrap:start -->` / `<!-- spec-first:bootstrap:end -->` 成对 marker，且块内内容与 `buildBootstrapBlock("claude")` 输出字节级一致
   - Phase 2 完成后 `.claude/settings.json` 存在受管 `SessionStart` matcher，且 `isSpecFirstManagedHook(hook)` 谓词命中
   - Phase 2 完成后 `.claude/hooks/session-start` 存在；仅当采用 §5.8.1.1 方案 B 或 C 时 `.ps1` 或 `.cmd` 变体才应存在，采用方案 A 时不应出现
2. `spec-first init --codex` 后：
   - `.agents/skills/using-spec-first/SKILL.md` 存在，且内容与 Codex adapter transform 结果一致
   - `AGENTS.md` 存在 bootstrap marker 对，块内内容与 `buildBootstrapBlock("codex")` 一致
   - 不出现 `.codex/hooks`
   - 不出现 Codex `spec-*` 错误文案（入口命名错写 → drift）

### 6.2 语义正确性验收

1. `using-spec-first` skill 明确表达 `workflow-first`，且不把 `spec-brainstorm` 作为默认前置。
2. bootstrap block 只承担"先判定 workflow"的提示职责，不复制完整路由规则。
3. hook 注入内容以运行时 `SKILL.md` 为真源，不在 hook 脚本中另写一套路由摘要。
4. Claude 与 Codex 的入口文案不串宿主：
   - Claude 主入口为 `spec-*`
   - Codex 主入口为 `spec-*`
5. **语言策略一致性（与项目 `CLAUDE.md` `lang=zh` 对齐规则）：**
   - `using-spec-first/SKILL.md` 的自然语言正文**允许英文**，理由记录在本验收条的注释里：skill 的主要消费者是模型（SessionStart 注入上下文）而非终端用户，英文能显著降低指令跨语言歧义。这是对 lang policy 的**显式豁免**，不是遗漏。
   - 但 **bootstrap block 的用户可见文字必须中文**，因为该块直接出现在 `CLAUDE.md` / `AGENTS.md` 里供人阅读与审计。
   - `contract tests` 需分别断言：skill 正文语言约束（允许英文但不强制）、bootstrap block 语言约束（必须中文）。
   - 若后续决定把 skill 正文改为中文，必须同步在 governance 或本文档记录决策，不得静默翻译。

### 6.3 行为验收

1. `init` 可重复执行，且不会产生重复 matcher、重复 block、重复 hook 文件副本。
2. `doctor` 能区分：
   - 未安装
   - 只完成 Phase 1
   - 已完成 Claude Phase 2
   - partial
   - drifted
3. `clean` 能完整清理受管项且不伤及用户自定义配置。
4. 任一中间失败后，再次执行 `init` 能从残留状态收敛到目标健康态。

### 6.4 测试验收

1. governance、docs mirror、tests 与 source-of-truth 同步收口。
2. 新增或扩展的单测覆盖：
   - skill contract
   - bootstrap block
   - Claude settings merge
   - managed state `hooks`
   - `doctor/clean` 的受管边界
3. smoke tests 覆盖 Claude/Codex 双宿主安装差异，以及 Claude Phase 2 自动注入链。

### 6.5 失败恢复验收

1. skill 缺失、bootstrap 缺失、matcher 缺失、hook 文件缺失、command 路径漂移这五类常见失败，都能被 `doctor` 明确诊断。
2. 对上述失败场景，文档定义的修复动作能由 `init` 或 `clean + init` 收敛完成。
3. hook 读取失败不会阻断用户会话，但会留下可诊断信号。

只有当“存在性 + 语义 + 行为 + 测试 + 恢复”五类验收同时满足时，才能认为方案真正闭环，而不是仅完成文件铺设。

## 7. 推荐决策

推荐按以下顺序推进：

1. 先做 **Phase 1：双宿主 skill + instruction bootstrap**
2. 再做 **Phase 2：Claude SessionStart 自动注入**
3. 明确把 **Codex 自动 hook** 标记为“等待官方能力验证”，不提前实现

这样做的原因是：

1. 它保留了 `using-superpowers` 的核心思路：让 skill 变成会话默认行为约束
2. 它又没有误把 `spec-first` 当成同类型宿主插件去机械复刻 `hooks/hooks.json`
3. 它充分利用了当前仓库已经成熟的两条链路：
   - runtime skill sync
   - repo-root instruction file 管理
4. 它把真正高风险的新增点收敛在 Claude 官方 project hooks 这一条受支持路径上
5. 它通过分阶段闭环和受管资产契约，把“方向正确”提升为“可稳定执行”

如果只做一个最小且正确的版本，应先交付 Phase 1；如果要做“真正接近 using-superpowers 体验”的版本，再叠加 Phase 2。

### 7.1 推荐实施原则

1. 先把 `using-spec-first` 做成**唯一真源 + 双宿主 bootstrap**，确认路由语义稳定，再叠加 Claude hook 自动注入。
2. 所有实现都围绕 `init / doctor / clean / state` 主链收敛，避免再开旁路安装器。
3. 所有受管资产都必须能被 `doctor` 解释、被 `clean` 精确删除、被 `init` 幂等修复。
4. 任何“看起来更统一”的 Codex 自动化，若没有官方契约支撑，一律不进入当前实现范围。
5. 文档、测试、运行时生成规则三者必须同源演进，不允许 bootstrap、skill、hook 各说各话。

## 8. 附：实现判定清单（供开发时逐项对照）

1. 是否存在唯一的路由语义真源？
2. bootstrap 是否只做提醒，不重复定义规则？
3. hook 是否只做注入，不发明第二套路由逻辑？
4. Claude/Codex 是否分别保持正确入口命名？
5. `init` 是否可从 partial/drift 状态重入收敛？
6. `doctor` 是否能解释所有常见失败场景？
7. `clean` 是否只删受管项？
8. 验收是否覆盖存在性、语义、行为、测试、恢复五个维度？
9. 若去掉 Codex speculative hook，整套方案是否仍成立？
10. 若用户手改运行时副本，系统是否仍可被诊断并收敛？

这 10 条若有任一回答为“否”，说明方案仍未达到顶尖研发效能要求下的闭环标准。
