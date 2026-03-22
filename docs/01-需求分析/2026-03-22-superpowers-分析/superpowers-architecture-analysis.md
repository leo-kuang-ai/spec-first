# superpowers 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/superpowers`
版本基线：`package.json` 中版本 `5.0.4`
分支基线：`main`

## 1. 项目一句话定义

`superpowers` 不是单纯的 skill 仓库，而是一套“让 coding agent 被强制拉回软件工程流程”的工作流框架。

它由四部分组成：

1. 一组带强约束的 `SKILL.md` 流程技能。
2. 一个会在 `SessionStart` 注入 `using-superpowers` 的 hook 机制。
3. 面向 Claude Code、Cursor、Codex、OpenCode、Gemini 的多宿主安装与适配层。
4. 一套专门验证“技能是否真的会被触发、会不会按规则执行”的测试体系。

可以把它理解为：

```text
             superpowers
                  |
   +--------------+---------------+-----------------+
   |                              |                 |
Skill 工作流层                 Session 注入层      多宿主适配与测试层
   |                              |                 |
设计/计划/调试/实现/评审         强制先学会用 skill   安装、hooks、测试、验证
   |                              |                 |
让 agent 按流程工作               防止跳过流程         让不同平台都能遵守同一方法
```

## 2. 顶层目录结构

```text
superpowers/
├── README.md                         项目定位、安装方式、基本工作流
├── package.json                      版本与插件主入口声明
├── skills/                           核心技能库
├── hooks/                            SessionStart 注入逻辑与平台配置
├── commands/                         旧命令兼容层（已弃用，导向 skill）
├── tests/                            skill triggering / integration / platform tests
├── docs/                             Codex/OpenCode 文档、测试说明、设计与计划
├── .codex/                           Codex 安装说明
├── .claude-plugin / .cursor-plugin   插件打包与宿主适配产物
├── .opencode/                        OpenCode 插件入口
└── agents/                           子代理提示词等辅助资源
```

核心判断：

- `skills/` 是项目的核心资产，但不是全部。
- `hooks/` 决定了这个系统能否在新会话开始时“先把技能纪律注入进去”。
- `tests/` 在这里不是附属品，而是关键工程部件，因为它验证的是“agent 是否真的按 skill 工作”。
- `commands/` 的存在说明项目经历过从“命令入口”向“skill 入口”的演进。

### 2.1 全量 skill 功能表

| Skill | 类别 | 主要功能 | 典型输入 | 典型输出 | 附属资源 |
| --- | --- | --- | --- | --- | --- |
| `using-superpowers` | 元技能 | 在会话一开始强制建立“先检查 skill 再行动”的纪律，定义技能优先级和平台适配规则 | 任意新会话 | skill 使用规则、触发纪律 | `references/codex-tools.md` 等 |
| `brainstorming` | 设计规划 | 在任何创意型工作前先完成设计澄清、方案比较、分段审批、写 design doc，并转入计划阶段 | 新功能想法、需求、行为修改请求 | design doc、批准后的设计 | `visual-companion.md`、`scripts/`、review prompt |
| `writing-plans` | 设计规划 | 把批准后的设计拆成可执行、2-5 分钟粒度的实现计划 | 设计文档、需求规格 | `docs/superpowers/plans/...` 计划文件 | `plan-document-reviewer-prompt.md` |
| `executing-plans` | 执行协作 | 在单独会话中按现成计划逐步执行并在完成后进入收尾技能 | 计划文件 | 执行后的代码与验证结果 | 无 |
| `subagent-driven-development` | 执行协作 | 在当前会话中按任务分派新子代理，每个任务后做规格审查和代码质量审查 | 计划文件、独立任务 | 子代理实现结果、两阶段 review | 多个 reviewer / implementer prompt |
| `dispatching-parallel-agents` | 执行协作 | 当存在多个独立问题域时并行调度多个 agent | 多个独立 bug / 子任务 | 并行调查或实现结果 | 无 |
| `test-driven-development` | 实现约束 | 强制 RED-GREEN-REFACTOR，要求先看到测试失败再写生产代码 | feature、bugfix、重构 | 测试先行的实现过程 | `testing-anti-patterns.md` |
| `systematic-debugging` | 调试约束 | 强制先做根因调查，再谈修复，避免拍脑袋补丁 | bug、测试失败、性能问题 | 根因分析、验证过的修复方向 | 多篇调试参考文档、`find-polluter.sh` |
| `verification-before-completion` | 验证约束 | 在宣称完成之前，必须重新运行验证命令并基于结果发言 | 即将宣称“完成 / 修好 / 通过” | 带证据的完成声明 | 无 |
| `requesting-code-review` | 协作约束 | 在关键节点请求专门 reviewer 子代理做代码审查 | 刚完成的任务、feature diff | 审查结论、问题列表 | `code-reviewer.md` |
| `receiving-code-review` | 协作约束 | 收到 review 后，先验证反馈是否技术成立，再实施 | code review comments | 技术性回应与后续修正 | 无 |
| `using-git-worktrees` | 环境隔离 | 为新功能或计划执行创建隔离 worktree 并验证安全性 | feature 开发开始前 | 独立 worktree 与分支 | 无 |
| `finishing-a-development-branch` | 收尾发布 | 在测试通过后，引导用户选择 merge / PR / 保留 / 丢弃，并清理工作树 | 实现已完成的分支 | merge/PR/cleanup 决策与执行 | 无 |
| `writing-skills` | 元技能 | 用 TDD 思维创建和验证新的 skill 文档及其压力测试 | 新 skill 想法、现有 skill 修改 | 新 skill、测试场景、改进后的文档 | 多篇最佳实践和渲染脚本 |

## 3. 核心设计思想

### 3.1 把“先做流程再做代码”写成硬约束

`superpowers` 的核心思想不是“给 agent 更多技巧”，而是“先用流程约束它，防止它直接动手”。

README 里明确的主流程是：

```text
brainstorming
  -> using-git-worktrees
  -> writing-plans
  -> subagent-driven-development / executing-plans
  -> test-driven-development
  -> requesting-code-review
  -> finishing-a-development-branch
```

结果是：

- feature 开发先过设计门。
- 设计批准后再写计划。
- 计划完成后再进入实现。
- 实现过程中还要继续受 TDD、review、verification 约束。

### 3.2 核心不是单个 skill，而是 `using-superpowers`

这个项目和普通 skill 仓库的关键差异在于：它有一个“技能纪律注入器”。

`using-superpowers/SKILL.md` 的作用不是做某个具体任务，而是规定：

- 只要有 1% 可能该用 skill，就必须调用 skill。
- 先检查 skill，再做任何回复或行动。
- 用户指令优先于 skill。
- 不同平台要做工具映射。

这让整个系统不再是“技能目录”，而是“技能驱动方法论”。

### 3.3 skill 不只是建议，而是带 gate 的流程规则

多个关键 skill 都用了非常强的措辞和硬门槛：

- `brainstorming`：设计未批准前禁止进入实现。
- `test-driven-development`：没有 failing test 就不能写生产代码。
- `systematic-debugging`：没有 root cause 就不能提修复。
- `verification-before-completion`：没有 fresh evidence 就不能声称完成。

这说明 superpowers 的核心设计不是“best practice 提示”，而是“流程性禁令 + 下一步动作”。

### 3.4 子代理不是附属能力，而是一级能力

`subagent-driven-development`、`dispatching-parallel-agents`、`requesting-code-review` 都把 subagent 当作常规工具，而不是高级可选项。

其设计原则是：

- 主会话负责协调。
- 子代理负责隔离上下文、执行单个任务或单个 review 角色。
- review prompt 和 implementer prompt 要显式构造，而不是把主会话历史全量继承过去。

因此这个系统天然偏向“多代理工作流”。

## 4. 项目运行主链路

### 4.1 安装链路

README 显示项目支持多宿主：

- Claude Code 官方 marketplace
- Claude Code 第三方 marketplace
- Cursor marketplace
- Codex 原生 skill discovery
- OpenCode
- Gemini CLI

以 Codex 为例，`.codex/INSTALL.md` 采用的是：

```text
git clone repo
  -> ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
  -> 重启 Codex
```

设计含义：

- 对支持原生 skill discovery 的平台，`skills/` 直接就是交付物。
- 对插件型平台，则通过插件目录和 hooks 完成接入。
- 安装层已经被设计成“多宿主发布系统”，而不只是一个仓库。

### 4.2 会话启动链路

这是项目最关键的运行链路之一。

Claude Code 的 `hooks/hooks.json` 中定义：

```text
SessionStart
  -> run-hook.cmd session-start
  -> hooks/session-start
  -> 读取 using-superpowers/SKILL.md
  -> 注入 additionalContext
```

`hooks/session-start` 实际做的事包括：

- 定位 plugin 根目录
- 检查旧版自定义 skills 路径并生成警告
- 读取 `skills/using-superpowers/SKILL.md`
- 将其内容 escape 后塞进 JSON
- 针对 Claude / Cursor 输出不同字段

也就是说：

```text
新会话启动
  -> 平台 hook 运行
  -> using-superpowers 全文被注入上下文
  -> agent 从第一条消息开始就被要求先检查 skill
```

这一步决定了 superpowers 不只是“可选 skill 包”，而是“会话开场即生效的方法约束层”。

### 4.3 实现执行链路

典型 feature 流程可写成：

```text
用户提出要做某个功能
  -> brainstorming 澄清并写 design doc
  -> using-git-worktrees 创建隔离工作区
  -> writing-plans 写详细计划
  -> subagent-driven-development 或 executing-plans 开始实现
  -> test-driven-development 限制写代码方式
  -> requesting-code-review 审查结果
  -> verification-before-completion 验证证据
  -> finishing-a-development-branch 决定 merge / PR / cleanup
```

与 `skills` 仓库相比，这里不只是“某个 skill 自己闭环”，而是多个 skill 在一个大闭环中被有序串联。

### 4.4 命令兼容链路

`commands/brainstorm.md`、`commands/execute-plan.md` 等文件都写着：

- 旧命令已弃用
- 引导用户改用对应的 superpowers skill

这说明项目在迁移：

- 过去：以命令为主要入口
- 现在：以 skill 为主要入口

命令层只保留兼容性与升级提示，不再是核心能力。

## 5. 会话流程自动化

### 5.1 这是一个“跨 skill 的大流程自动化”

和 `/Users/kuang/xiaobu/skills` 那种“每个 skill 各自推进一轮会话”不同，`superpowers` 更像一个跨多个 skill 的自动状态机。

它的抽象是：

```text
SessionStart 注入 using-superpowers
  -> 判断当前任务属于设计 / 调试 / 实现 / 收尾哪一阶段
  -> 强制激活对应 skill
  -> skill 完成后把工作移交给下一个 skill
  -> 直到整个开发分支完成
```

因此它的自动化不只是“skill 驱动”，还是“skill 之间的阶段接力”。

### 5.2 自动化阶段表

| 阶段 | 代表 skill | 自动化动作 | 人工介入点 | 产物 |
| --- | --- | --- | --- | --- |
| 会话引导 | `using-superpowers` | 在新会话注入技能纪律，要求先做 skill 检查 | 无或极少 | 技能使用规则生效 |
| 设计澄清 | `brainstorming` | 探索上下文、追问需求、比较方案、分段审批、写 spec | 审批设计、回答问题 | design doc |
| 环境隔离 | `using-git-worktrees` | 建立 worktree、选目录、检查安全条件 | 决定目录或确认策略 | 独立工作空间 |
| 任务拆解 | `writing-plans` | 把设计文档转成细粒度计划和验证步骤 | 审阅计划 | implementation plan |
| 任务执行 | `subagent-driven-development` / `executing-plans` | 分发实现任务、推进 Todo、执行计划步骤 | 决定采用哪种执行模式 | 已实现任务 |
| 实现约束 | `test-driven-development` | 强制先写 failing test，再写最小实现 | 仅在例外情况下请求豁免 | 测试先行代码 |
| 调试约束 | `systematic-debugging` | 先找根因，再设计修复 | 根因不清时与人确认 | 根因分析 |
| 审查协作 | `requesting-code-review` / `receiving-code-review` | 派 reviewer、接收反馈、验证反馈有效性 | 对争议意见作取舍 | review 结果与修复 |
| 完成验证 | `verification-before-completion` | 重新跑验证命令，阻止空口声称完成 | 无 | 带证据的完成结论 |
| 分支收尾 | `finishing-a-development-branch` | 跑测试、给 merge/PR/cleanup 选项、执行选项 | 选择集成方式 | 合并或清理结果 |

### 5.3 每个 skill 的自动化会话形态

| Skill | 自动化会话形态 |
| --- | --- |
| `using-superpowers` | 会话启动 -> 注入技能规则 -> 后续所有行为先做 skill check |
| `brainstorming` | 探索上下文 -> 逐个澄清 -> 提方案 -> 分段审批 -> 写 design doc -> spec review -> 转入 planning |
| `writing-plans` | 读取 spec -> 锁定文件结构 -> 拆成极细任务 -> 保存计划 -> 引导选择执行模式 |
| `executing-plans` | 读取计划 -> 批判性检查 -> 按顺序执行 -> 完成后调用 finishing skill |
| `subagent-driven-development` | 每个任务派 fresh subagent -> 自审 -> spec review -> code review -> 再进入下一任务 |
| `dispatching-parallel-agents` | 识别独立问题域 -> 一域一 agent 并发推进 -> 主会话负责汇总 |
| `test-driven-development` | 一次只允许一个 RED-GREEN cycle -> 没看到失败就回退重来 |
| `systematic-debugging` | 先调查 -> 再分析 -> 再假设 -> 最后才实现修复 |
| `verification-before-completion` | 识别 claim -> 运行完整验证命令 -> 基于输出决定能否宣称完成 |
| `requesting-code-review` | 抽取 base/head 范围 -> 派 reviewer -> 收回 findings -> 阻止问题扩散 |
| `receiving-code-review` | 先理解反馈 -> 去代码库验证 -> 决定采纳或技术性反驳 -> 再实施 |
| `using-git-worktrees` | 选择目录 -> 检查安全条件 -> 建新 worktree -> 准备隔离开发环境 |
| `finishing-a-development-branch` | 跑测试 -> 识别基线分支 -> 给用户清晰选项 -> 执行 merge/PR/cleanup |
| `writing-skills` | 先跑无 skill baseline -> 观察失败模式 -> 写 skill -> 跑压力测试 -> 修 skill |

## 6. hooks、脚本与命令层逻辑

### 6.1 hooks 是“强制开场白”机制

`hooks/session-start` 是整个项目最关键的脚本之一。

它的作用不是业务逻辑，而是：

- 在每个新会话开始时把 `using-superpowers` 整体塞进上下文
- 根据平台输出不同 JSON 字段
- 处理旧版自定义技能目录警告

本质上，这是一个“方法论注入器”。

### 6.2 brainstorming server 是少量运行时之一

`skills/brainstorming/scripts/server.cjs` 提供了一个轻量本地服务器：

- HTTP 提供最新 brainstorm screen
- WebSocket 接收用户点击/选择事件
- 自动把 helper.js 注入页面
- 监听文件变化
- 维护客户端集合
- 30 分钟空闲超时

这说明 superpowers 虽然总体偏文档驱动，但在“视觉化 brainstorming”这一个点上有真实运行时。

### 6.3 调试脚本是窄而实用的辅助工具

`skills/systematic-debugging/find-polluter.sh` 的功能是：

- 逐个运行测试文件
- 检查某个目标文件/目录是否被污染
- 找到导致状态污染的测试用例

这类脚本都很克制：

- 只解决一个高频、确定性问题
- 不引入大框架
- 服务于 skill，而不是取代 skill

### 6.4 commands 只是弃用兼容层

`commands/*.md` 不再提供完整功能，只做：

- 告诉用户该命令已弃用
- 引导改用相应 skill

这进一步证明 skill 才是第一入口。

## 7. 测试与可验证性

这是 superpowers 和普通 skill 仓库差异最大的部分之一。

### 7.1 测试对象不是程序输出，而是“agent 行为”

`tests/claude-code/README.md` 明确说明：

- 用 headless `claude -p` 跑真实会话
- 验证 skill 是否加载
- 验证 agent 是否按预期顺序做事
- 对复杂 skill 还要验证端到端结果

因此测试的对象包括：

- trigger 是否触发
- skill 内容是否被遵守
- 子代理工作流是否成立
- 最终代码是否真的工作

### 7.2 测试分层明显

从 `tests/` 看，至少有这些层次：

- `tests/skill-triggering/`：验证技能是否会被触发
- `tests/explicit-skill-requests/`：验证明确点名 skill 时的行为
- `tests/claude-code/`：验证真实会话与 integration workflow
- `tests/opencode/`：验证平台适配
- `tests/brainstorm-server/`：验证轻运行时脚本
- `tests/subagent-driven-dev/`：验证子代理开发流程

这意味着 superpowers 把“prompt/skill 是否有效”当成可测试工程对象，而不是手工体验问题。

## 8. 项目最关键的工程取舍

### 8.1 选择“纪律注入”而不是“自由提示”

最重要的取舍是：它不相信 agent 会自觉遵守流程，所以用 `using-superpowers` + `SessionStart hook` 在会话起点强制注入纪律。

### 8.2 选择“跨 skill 编排”而不是“单 skill 闭环”

与普通 skill 集合不同，它真正卖的是完整开发工作流：

- 设计
- 计划
- 实现
- 调试
- review
- 验证
- 收尾

每个 skill 只是大流程中的一个 stage。

### 8.3 选择“少量必要脚本 + 强文档规则”

superpowers 没有做成一个重型 daemon 系统，但也不完全停留在纯文档层。

它的策略是：

- 大多数逻辑用 skill 规则表达
- 少量关键点用 hook 或小脚本固化
- 再用自动化测试验证这些规则有没有真正生效

### 8.4 选择“多宿主适配”而不是单平台深耕

项目明显在做平台扩展：

- Claude
- Cursor
- Codex
- OpenCode
- Gemini

这让它更像“通用 agent workflow framework”，而不只是某个单一产品的插件。

## 9. 如何理解整个项目

如果用一句更工程化的话总结：

```text
superpowers = 技能纪律注入器
            + 阶段化软件工程 skill 库
            + 多代理执行与审查方法
            + 多宿主安装/适配层
            + 验证 agent 行为的测试体系
```

如果用组织结构来理解：

```text
用户
 |
 +--> 会话纪律层: using-superpowers
 |
 +--> 设计负责人: brainstorming
 |
 +--> 计划负责人: writing-plans
 |
 +--> 执行负责人: executing-plans / subagent-driven-development
 |
 +--> 工程纪律: test-driven-development / systematic-debugging
 |
 +--> 审查负责人: requesting-code-review / receiving-code-review
 |
 +--> 环境与收尾: using-git-worktrees / verification-before-completion / finishing-a-development-branch
 |
 +--> 元能力: writing-skills / dispatching-parallel-agents
```

## 10. 结论

这个仓库的真正价值不在“有一堆 skill”，而在它把 agent 开发过程变成了一个可注入、可迁移、可测试的软件工程方法系统：

- 有会话启动注入。
- 有跨阶段流程编排。
- 有强约束技能门槛。
- 有多代理协作方法。
- 有多平台安装适配。
- 有针对 agent 行为本身的自动化测试。

所以从本质上说：

- `skills` 更像“高质量 workflow 素材库”。
- `superpowers` 更像“面向 coding agent 的软件工程流程框架”。
- `gstack` 则比它再往前一步，更接近“带浏览器运行时的软件工程操作系统”。
