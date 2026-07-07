你现在位于入门指南中的「第一次工作流走查：从需求到仓库产物」页面，本页只做一件事：带你用一个很小的需求，从安装后的宿主会话一路走到仓库里可检查的需求、计划、任务、代码变更、评审与知识沉淀产物；如果你还没有完成安装和初始化，请先阅读[安装、环境检查与宿主初始化](4-an-zhuang-huan-jing-jian-cha-yu-su-zhu-chu-shi-hua)，如果你想查所有入口的选择规则，请继续读[工作流入口速查与任务路由](6-gong-zuo-liu-ru-kou-su-cha-yu-ren-wu-lu-you)。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L3-L10), [README.zh-CN.md](README.zh-CN.md#L36-L45)

## 架构假设与验证结论

本页的工作假设是：`spec-first` 不是把 AI 开发变成一个固定状态机，而是让每一步都把上下文写成下一步能读取的仓库产物；脚本负责安装、校验、路径和确定性事实，LLM 负责需求判断、范围取舍、计划拆分和实现决策。源码和文档验证后，这个假设成立：`spec-brainstorm` 产出 `docs/brainstorms/`，`spec-plan` 产出计划，`spec-write-tasks` 可选地产出 `docs/tasks/`，`spec-work` 执行范围内改动，`spec-code-review` 做合并前审查，`spec-compound` 将已解决问题沉淀到 `docs/solutions/`。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L9-L10), [spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L9-L37), [spec-plan/SKILL.md](skills/spec-plan/SKILL.md#L8-L15), [spec-write-tasks/SKILL.md](skills/spec-write-tasks/SKILL.md#L6-L15), [spec-work/SKILL.md](skills/spec-work/SKILL.md#L11-L47), [spec-code-review/SKILL.md](skills/spec-code-review/SKILL.md#L11-L43), [spec-compound/SKILL.md](skills/spec-compound/SKILL.md#L10-L48)

下面这张图先给你一个全局视角：左边是人输入的需求，右边是仓库里逐步留下的 durable artifacts；注意 `spec-mcp-setup` 是准备环境事实，不替代后面的需求、计划或实现判断。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L46-L67), [spec-mcp-setup/SKILL.md](skills/spec-mcp-setup/SKILL.md#L11-L24)

```mermaid
flowchart LR
  A["一句需求<br/>Improve onboarding for first-time CLI users"] --> B["spec-brainstorm<br/>澄清 WHAT"]
  B --> B1["docs/brainstorms/*-requirements.md"]
  B1 --> C["spec-plan<br/>设计 HOW"]
  C --> C1["docs/plans/*-plan.md"]
  C1 --> D{"计划是否较大？"}
  D -- "小计划" --> E["spec-work<br/>执行最小可验证改动"]
  D -- "多模块/多阶段" --> F["spec-write-tasks<br/>派生 task pack"]
  F --> F1["docs/tasks/*-tasks.md"]
  F1 --> E
  E --> E1["代码/文档 diff<br/>验证记录<br/>残余风险"]
  E1 --> G["spec-code-review<br/>合并前审查"]
  G --> H{"经验值得复用？"}
  H -- "是" --> I["spec-compound"]
  I --> I1["docs/solutions/**/*"]
  H -- "否" --> J["结束本次走查"]
```

这条链路的关键不是“每个需求必须跑完所有节点”，而是“每个阶段都只在自己有价值时出现”：需求不清楚先 brainstorm，需求清楚再 plan，计划太大才 write-tasks，范围明确才 work，准备合并才 review，经验可复用才 compound。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L68-L168), [spec-write-tasks/SKILL.md](skills/spec-write-tasks/SKILL.md#L18-L37)

## 本次示例需求

本页使用的最小需求是 `Improve onboarding for first-time CLI users`。它足够小，适合第一次体验；同时它又不是“改一个错别字”，所以能展示从需求成型到实现计划的完整上下文传递。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L3-L8)

| 开始前：会话里的模糊输入 | 走查后：仓库里的可检查产物 |
| --- | --- |
| `Improve onboarding for first-time CLI users` | `docs/brainstorms/*-requirements.md` 记录用户、问题、范围、成功标准 |
| “应该怎么做？” | `docs/plans/*-plan.md` 记录实施目标、非目标、文件区域、风险、验证方式 |
| “这个计划有点大” | `docs/tasks/*-tasks.md` 可选地记录 source plan、hash、task graph、wave 和验证信号 |
| “已经改完了” | 源码或文档 diff、测试/检查命令、验证记录、残余风险说明 |
| “这个经验以后还会用到” | `docs/solutions/` 下的可复用经验文档 |

这张对照表来自用户手册对 brainstorm、plan、task pack、work 和 compound 产物的描述；它的用途是帮初学者理解“AI 回答”如何变成“仓库轨迹”。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L76-L90), [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L100-L124), [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L134-L168)

## 第 0 步：确认 CLI 和宿主 runtime 已准备好

第一次使用、换宿主、升级后重建 runtime assets，或者 MCP/helper 环境变化时，先在目标项目根目录安装 CLI、运行 `spec-first doctor`，再运行 `spec-first init` 生成当前宿主的 runtime assets；初始化后需要重启宿主或新开会话，因为后续 `spec-*` 入口是在 Claude Code、Codex、Cursor、Kiro 或 Qoder 这类宿主会话里运行，不是 shell 命令。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L11-L45), [README.zh-CN.md](README.zh-CN.md#L47-L93)

```bash
npm install -g spec-first
spec-first doctor
spec-first init
```

`doctor` 会检查 Node.js 和 Git 等基础条件，Node.js 低于 20 会报错，Git 不可用也会报错；初始化支持 Claude Code、Codex、Cursor、Kiro 和 Qoder，源码中的初始化选项和适配器列表也验证了这些宿主是当前支持面。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L146), [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113), [src/cli/adapters/index.js](src/cli/adapters/index.js#L1-L12)

| 检查项 | 你要做什么 | 通过后的信号 |
| --- | --- | --- |
| CLI 安装 | `npm install -g spec-first` | 可以运行 `spec-first doctor` |
| 环境检查 | `spec-first doctor` | 没有阻断性错误 |
| 宿主初始化 | `spec-first init` | 生成对应宿主 runtime assets |
| 宿主加载 | 重启宿主或新开会话 | 宿主中可调用 `spec-*` workflow |
| helper/MCP 准备 | 宿主中运行 `spec-mcp-setup` | baseline ready 后可进入业务 workflow |

表中的流程来自快速开始和首次走查文档；`spec-mcp-setup` 的契约说明它用于 host runtime setup、MCP setup、helper-tool readiness 和 project-local setup fact refresh，而不是普通规划、实现、审查或调试入口。Sources: [README.zh-CN.md](README.zh-CN.md#L47-L111), [spec-mcp-setup/SKILL.md](skills/spec-mcp-setup/SKILL.md#L11-L21)

## 第 1 步：用 brainstorm 把一句话变成需求 brief

进入新的宿主会话后，从 `spec-brainstorm` 开始，因为这一步负责澄清 **WHAT**：用户是谁、卡在哪里、本轮必须解决什么、哪些想法不在范围内、成功标准是什么，以及后续 planning 需要注意哪些边界。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L68-L90), [spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L9-L37)

```text
spec-brainstorm "Improve onboarding for first-time CLI users"
```

第一次 brainstorm 通常会写入类似 `docs/brainstorms/2026-05-01-001-cli-onboarding-requirements.md` 的文档；如果这些内容还不清楚，应继续对话澄清，而不是急着进入实现。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L76-L90)

## 第 2 步：用 plan 把需求变成工程方案

当 requirements brief 已经稳定后，运行 `spec-plan`；这一阶段负责定义 **HOW**，把需求转成可评审、可执行的工程决策上下文，但它仍然是 planning-only：在交接前不应实现代码、不应运行实现 workflow，也不应声称实现已经开始。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L92-L115), [spec-plan/SKILL.md](skills/spec-plan/SKILL.md#L20-L27)

```text
spec-plan
```

一个好的 plan 至少说明实施目标和非目标、需要修改或新增的大致文件区域、依赖关系和风险点、验证方式，以及哪些问题留到 implementation-time 决策；源码中的 plan 质量标准也要求计划包含问题框架、范围边界、需求追踪、文件路径、测试场景、决策理由、依赖和 sequencing。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L100-L115), [spec-plan/SKILL.md](skills/spec-plan/SKILL.md#L106-L120)

## 第 3 步：只在计划较大时编译 task pack

如果 plan 很小，可以直接进入 `spec-work`；如果 plan 涉及多个模块、多个阶段，或者需要多人/多 agent 交接，再使用 `spec-write-tasks` 把 settled source plan 编译成 derived task pack。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L116-L124), [spec-write-tasks/SKILL.md](skills/spec-write-tasks/SKILL.md#L18-L37)

```text
spec-write-tasks
```

task pack 的价值是确定性 handoff：它可以记录 source plan、hash、task graph、wave 和验证信号；但它不是新的需求真相源，不能改变 scope、验收标准、非目标、repo ownership 或产品决策。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L116-L124), [spec-write-tasks/SKILL.md](skills/spec-write-tasks/SKILL.md#L56-L66)

## 第 4 步：用 work 执行最小可验证改动

当 plan 或 task pack 已经可执行后，运行 `spec-work`；它会读取当前请求、plan 或 task pack、项目指令、相关源码和测试，然后在当前 repo scope 内做最小可验证改动。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L126-L142), [spec-work/SKILL.md](skills/spec-work/SKILL.md#L11-L47)

```text
spec-work
```

`spec-work` 的输出通常体现为代码或文档 diff、对应测试或检查命令、验证记录和残余风险说明；它不应该通过修改 generated runtime copies 绕过 source truth，涉及 skill、agent、template 或 CLI 的变更应改源码资产，再按需要用 `spec-first init` 重建 runtime。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L134-L142), [spec-work/SKILL.md](skills/spec-work/SKILL.md#L83-L95)

## 第 5 步：合并前 review，解决后 compound

准备合并前运行 `spec-code-review`，它的重点是 bug、行为回归、测试缺口和残余风险；它会从 diff、计划、任务、work 产物、源码、测试和日志中建立审查上下文，而不是为改动写表扬稿。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L143-L160), [spec-code-review/SKILL.md](skills/spec-code-review/SKILL.md#L13-L43)

```text
spec-code-review
```

当一个问题被稳定解决，并且经验值得复用时，再运行 `spec-compound`；它会把刚解决的问题整理成 `docs/solutions/` 下的团队知识，但不适用于仍在调试中的问题、未解决假设、一次性摘要或强制完成门禁。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L161-L168), [spec-compound/SKILL.md](skills/spec-compound/SKILL.md#L16-L48)

```text
spec-compound
```

## 你会在仓库里看到什么

本次走查的长期协作文档层主要在 `docs/brainstorms/`、`docs/plans/`、`docs/tasks/` 和 `docs/solutions/`；这些目录分别对应需求成型、实施规划、任务交接和知识沉淀。Sources: [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L25-L35), [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L36-L52)

```text
docs/
  brainstorms/   requirements briefs 与研发侧 clarified requirements
  plans/         可评审、可执行的 implementation plans
  tasks/         从 plan 派生的 executable handoff
  solutions/     已解决问题的可复用工程经验

.spec-first/
  config/        setup-owned machine facts
  workspace/     parent workspace advisory summaries
  workflows/     work run evidence 与 verification evidence
```

`.spec-first/config/` 保存 setup-owned machine facts，`.spec-first/workspace/` 是父 workspace 的 advisory summary，`.spec-first/workflows/spec-work/...` 可保存 work closeout evidence；这些执行产物不能替代 child repo 的源码、git diff、tests/logs 或 bounded direct source reads。Sources: [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L9-L18), [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L53-L64), [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L83-L111)

## 常见判断速查

| 当前情况 | 推荐入口 | 原因 |
| --- | --- | --- |
| 只有一句想法，还没定义成功标准 | `spec-brainstorm` | 先提升需求输入质量 |
| 需求已清楚，但不知道怎么落地 | `spec-plan` | 先把工程路径变成可评审计划 |
| plan 很大，需要交接或分阶段执行 | `spec-write-tasks` | 派生 task pack，降低执行风险和上下文负担 |
| 已有 plan 或 task pack | `spec-work` | 直接执行最小可验证改动 |
| 准备合并，想确认风险 | `spec-code-review` | 检查 bug、回归、测试缺口和残余风险 |
| 经验值得复用 | `spec-compound` | 写入 `docs/solutions/` 供后续复用 |

这张表基于首次走查中的常见判断，并结合 `spec-write-tasks`、`spec-code-review` 与 `spec-compound` 的使用契约补齐了“计划较大”“合并前审查”和“知识沉淀”的入口边界。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L169-L180), [spec-write-tasks/SKILL.md](skills/spec-write-tasks/SKILL.md#L18-L37), [spec-code-review/SKILL.md](skills/spec-code-review/SKILL.md#L13-L43), [spec-compound/SKILL.md](skills/spec-compound/SKILL.md#L18-L37)

## 关键边界：不要把 runtime 副本当源码改

初学者最容易犯的错误，是看到 `.claude/`、`.codex/`、`.agents/skills/` 或其他宿主目录后直接修改它们；首次走查明确指出，这些是 generated runtime assets，不是 source truth，`skills/`、`agents/`、`templates/` 和 `src/cli/` 才是 spec-first 自身能力的源码真相源。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L181-L188), [spec-mcp-setup/SKILL.md](skills/spec-mcp-setup/SKILL.md#L34-L39)

另一个边界是：脚本输出的是确定性事实，LLM 在这些事实之上做语义判断；代码图谱或 provider readiness 只能作为 advisory 导航候选，当前代码事实仍应回到 direct source reads、`rg`、ast-grep、git diff、tests/logs 和用户提供证据。Sources: [09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L58-L67), [spec-work/SKILL.md](skills/spec-work/SKILL.md#L128-L135), [spec-code-review/SKILL.md](skills/spec-code-review/SKILL.md#L101-L106)

## 下一步阅读路线

如果你刚跑完第一次走查，下一页建议读[工作流入口速查与任务路由](6-gong-zuo-liu-ru-kou-su-cha-yu-ren-wu-lu-you)，用它判断日常任务该从 `spec-brainstorm`、`spec-prd`、`spec-plan`、`spec-work`、`spec-debug` 还是 review 入口开始；随后读[产物目录与可检查工程轨迹](7-chan-wu-mu-lu-yu-ke-jian-cha-gong-cheng-gui-ji)，理解每个目录由谁生成、谁读取、哪些能提交、哪些只是本地执行证据。Sources: [README.zh-CN.md](README.zh-CN.md#L113-L123), [04-workflows-artifacts-map.md](docs/05-用户手册/04-workflows-artifacts-map.md#L1-L18)

如果你还没初始化多宿主，回到[安装、环境检查与宿主初始化](4-an-zhuang-huan-jing-jian-cha-yu-su-zhu-chu-shi-hua)；如果你已经准备在 Claude Code、Codex、Cursor、Kiro 或 Qoder 之间切换，再读[多宿主使用指南：Claude Code、Codex、Cursor、Kiro 与 Qoder](8-duo-su-zhu-shi-yong-zhi-nan-claude-code-codex-cursor-kiro-yu-qoder)。Sources: [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113), [src/cli/adapters/index.js](src/cli/adapters/index.js#L1-L12)