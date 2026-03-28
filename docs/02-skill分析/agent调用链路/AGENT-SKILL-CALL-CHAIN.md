# Agent 到 Skill 的调用链路

这份文档基于 `spec-first` 的最新代码，梳理“用户请求如何进入 agent，再由 agent 触发 skill 或技能等价物”的完整链路。

先给结论：

- 入口不是 skill，而是 `/spec:*` 命令和 task 工作流
- `spec:start` 负责把任务分流到 `brainstorm` 或 `Task Workflow`
- `dispatch` 是纯调度 agent，只负责按 phase 调用 `implement` / `check` / `debug`
- skill 在这个项目里主要有两种角色
  - 平台可加载的模板文件
  - 把外部能力整合进 `.spec-first/spec/` 的规范输入源
- 真正的 skill 自动选择不在仓库里做打分或排序，而是交给目标平台的运行时机制

## 为什么要分清这条链路

`spec-first` 同时管理：

- 命令层
- agent 层
- skill 模板层
- 平台配置层
- 任务与规范层

如果不拆开，很容易把下面几件事混为一谈：

- 谁负责接入口令
- 谁负责拆任务
- 谁负责执行代码
- 谁负责生成 skill 文件
- 谁负责运行时自动启用 skill

这份文档把它们分开。

## 总览

```text
用户请求
  |
  v
/spec:start
  |
  +--> 简单任务 -> 直接进入 Task Workflow
  |
  +--> 复杂任务 -> /spec:brainstorm -> 生成 task/prd
  |
  v
Task Workflow
  |
  v
dispatch agent
  |
  +--> implement subagent
  +--> check subagent
  +--> debug subagent
  |
  v
platform skill layer
  |
  +--> Codex: .agents/skills + .codex/skills
  +--> Antigravity: .agent/workflows
  +--> Kiro/Qoder: 各自目录
  |
  v
skill/工作流消费
  |
  +--> 直接执行脚本
  +--> 更新 .spec-first/spec/
  +--> 作为平台运行时候选项
```

## 第一层：命令到任务入口

### `spec:start`

`spec:start` 是整个工作流的入口。它不直接决定 skill，而是先判断任务复杂度，再决定是走 brainstorm 还是直接进入任务执行。

`start.md` 明确要求：

- 先读 `.spec-first/workflow.md`
- 再执行 `get_context.py`
- 再读 spec 索引
- 然后根据任务类型分类
- 复杂任务走 `Brainstorm -> Task Workflow`

文件：

- [packages/cli/src/templates/claude/commands/spec/start.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/start.md#L1)

### `spec:brainstorm`

复杂任务进入 brainstorm 后，会先建 task，再写 `prd.md`，然后逐步收敛需求。

这个命令的核心原则是：

- task-first
- action before asking
- one question per message
- research-first

文件：

- [packages/cli/src/templates/claude/commands/spec/brainstorm.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/brainstorm.md#L1)

### `current-task`

`current-task` 不是新建任务，而是读写当前 task pointer。

它只做两件事：

- `list`：读取当前活跃任务
- `switch`：切换 `.spec-first/.current-task`

文件：

- [packages/cli/src/templates/claude/commands/spec/current-task.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/current-task.md#L1)

## 第二层：任务到 Agent

`spec-first` 的任务执行不是单个 agent 直做，而是由 dispatcher 驱动多 agent 流程。

### `dispatch` 是纯调度器

`dispatch` 的定义非常明确：它只负责按 phase 调 subagent 和脚本，不直接读 spec，不做复杂决策。

关键约束：

- 只负责按顺序调用子 agent
- 不直接读取 spec/requirements
- 通过 hook 注入上下文
- 只需要简单命令触发 subagent

执行链长这样：

```text
.spec-first/.current-task
  -> task.json
  -> next_action
  -> implement / check / debug
  -> 结果回写任务状态
```

文件：

- [packages/cli/src/templates/claude/agents/dispatch.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/dispatch.md#L1)

### `implement` agent

`implement` 负责真正写代码。它会先读：

- `.spec-first/workflow.md`
- `.spec-first/spec/`
- task 的 `prd.md`
- task 的 `info.md`

然后按规范实现功能，并在最后运行 lint / typecheck。

文件：

- [packages/cli/src/templates/claude/agents/implement.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/implement.md#L1)

### `check` agent

`check` 负责自检和修复。它会读取 diff，检查规范符合性，然后直接修复问题，不只是报告问题。

文件：

- [packages/cli/src/templates/claude/agents/check.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/check.md#L1)

## 第三层：Skill 在项目里的两种角色

在 `spec-first` 里，skill 不是单一语义。它有两种不同作用。

### 角色 A：平台可加载模板

这类 skill 是给具体 AI 平台准备的文件模板。

当前代码把平台能力统一放在 `AI_TOOLS` 注册表中：

- `codex` 支持 shared agent skills
- `antigravity` 使用 workflow 目录
- `kiro`、`qoder` 也有各自的 skill 目录

文件：

- [packages/cli/src/types/ai-tools.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/types/ai-tools.ts#L1)

### 角色 B：项目规范的输入源

`integrate-skill` 这类能力不是直接执行 skill，而是把外部 skill 转成项目自己的规范文档。

它会：

- 读取 `.agents/skills/<skill-name>/SKILL.md`
- 分析 skill 的最佳实践
- 写入 `.spec-first/spec/{target}/doc.md`
- 在 `.spec-first/spec/{target}/examples/skills/<skill-name>/` 写示例

这条链路的本质是：

```text
external skill
  -> project guideline
  -> reusable spec
```

文件：

- [packages/cli/src/templates/codex/skills/integrate-skill/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/integrate-skill/SKILL.md#L1)

## 第四层：平台注册和模板落盘

### 平台注册

`packages/cli/src/configurators/index.ts` 是平台 registry。

它把：

- `AI_TOOLS` 里的平台元数据
- 对应的 `configure` 函数
- 对应的模板收集函数

统一到一张表里。

对于 skill 相关内容，这里能看到最关键的映射：

- Codex 读取 `.agents/skills/<name>/SKILL.md`
- Codex 读取 `.codex/skills/<name>/SKILL.md`
- Antigravity 读取 `.agent/workflows/<name>.md`

文件：

- [packages/cli/src/configurators/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/index.ts#L1)

### Codex 的落盘链路

Codex 的配置函数会把模板写到两个层次：

- shared skills -> `.agents/skills/<skill>/SKILL.md`
- Codex-specific skills -> `.codex/skills/<skill>/SKILL.md`

它还会写：

- `.codex/agents/<agent>.toml`
- `.codex/hooks/*`
- `.codex/hooks.json`
- `.codex/config.toml`

这说明 Codex 在这个仓库里是唯一明确支持 shared skills 的平台。

文件：

- [packages/cli/src/configurators/codex.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/codex.ts#L1)
- [packages/cli/src/templates/codex/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/index.ts#L1)

### Antigravity 的落盘链路

Antigravity 没有单独的 skill runtime 目录语义，它是把 Codex skill 内容适配成 workflow 内容，再写到：

- `.agent/workflows/<workflow>.md`

这意味着它的“skill”在实现上已经变成 workflow 模板。

文件：

- [packages/cli/src/templates/antigravity/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/antigravity/index.ts#L1)
- [packages/cli/src/configurators/antigravity.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/antigravity.ts#L1)

## 第五层：具体 skill 的实际用途

### `current-task`

`current-task` 是最典型的“技能包装脚本”。

它只做两件事：

- `list`：读取当前活跃任务
- `switch`：切换 `.spec-first/.current-task`

它的价值不是复杂推理，而是把 task pointer 管理成一个稳定的可调用能力。

文件：

- [packages/cli/src/templates/codex/skills/current-task/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/current-task/SKILL.md#L1)

### `create-command`

`create-command` 会生成新的 Codex skill 文件。

这条链路说明：

```text
user intent
  -> create-command skill
  -> .agents/skills/<skill-name>/SKILL.md
```

它是“skill 生成 skill”的能力。

文件：

- [packages/cli/src/templates/codex/skills/create-command/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/create-command/SKILL.md#L1)

### Claude 中如何驱动子任务分解

`/spec:brainstorm` 本身**没有** `--parent` 参数。子任务分解发生在 brainstorm 的执行过程中，由 AI 在 Step 8 调用 task 脚本完成。

#### 方式 1：新建子任务

```bash
CHILD1=$(python3 ./.spec-first/scripts/task.py create "Child task 1" --slug child1 --parent "$TASK_DIR")
CHILD2=$(python3 ./.spec-first/scripts/task.py create "Child task 2" --slug child2 --parent "$TASK_DIR")
```

#### 方式 2：绑定已有任务

```bash
python3 ./.spec-first/scripts/task.py add-subtask "$TASK_DIR" "$CHILD_DIR"
```

#### 驱动顺序

```text
/spec:brainstorm
  -> 发现任务过大 / 可拆分
  -> 在 PRD 中继续收敛需求
  -> Step 8 子任务分解
  -> 调用 task.py create --parent 或 add-subtask
```

#### 结论

- `brainstorm` 负责发现任务是否需要拆分
- `task.py create --parent` / `add-subtask` 负责真正创建或挂接子任务
- 子任务分解是 **brainstorm 执行过程中的动作**，不是命令参数

## ASCII 版完整链路

```text
┌────────────────────────┐
│ 用户输入 /spec:start    │
└─────────────┬──────────┘
              │
              v
┌────────────────────────┐
│ 任务分类               │
│ - 简单任务             │
│ - 复杂任务             │
└─────────────┬──────────┘
              │
      ┌───────┴────────┐
      │                │
      v                v
┌──────────────┐  ┌──────────────────┐
│ 直接进工作流 │  │ /spec:brainstorm │
└──────┬───────┘  └───────┬──────────┘
       │                  │
       v                  v
┌────────────────────────────────────┐
│ 创建 task / prd / info             │
└───────────────────┬────────────────┘
                    │
                    v
            ┌────────────────┐
            │ dispatch agent │
            └───────┬────────┘
                    │
        ┌───────────┼───────────┐
        v           v           v
┌────────────┐ ┌──────────┐ ┌──────────┐
│ implement  │ │  check   │ │ debug    │
└─────┬──────┘ └────┬─────┘ └────┬─────┘
      │             │            │
      v             v            v
┌────────────────────────────────────┐
│ 修改代码 / 自检 / 修复             │
└───────────────────┬────────────────┘
                    │
                    v
         ┌─────────────────────────┐
         │ 平台 skill / workflow 层 │
         └────────────┬────────────┘
                      │
      ┌───────────────┼────────────────┐
      │               │                │
      v               v                v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Codex       │ │ Antigravity  │ │ Kiro/Qoder   │
│ .agents/...  │ │ .agent/...   │ │ 各自目录      │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 两条核心链路

### 1. 运行时链路

```text
用户请求
  -> /spec:start
  -> task 分类
  -> brainstorm 或 task workflow
  -> dispatch agent
  -> implement / check / debug
  -> skill/template 消费
  -> 平台运行时加载
```

### 2. 安装/落盘链路

```text
安装请求
  -> AI_TOOLS
  -> configurators/index.ts
  -> configureCodex / configureAntigravity / ...
  -> 目标目录
  -> .agents/skills / .codex/skills / .agent/workflows
```

## 这个仓库里没有什么

仓库里没有一个很明显的本地源码文件，负责：

- 按相关度给 skill 打分
- 在运行时给 skill 排序
- 用自定义启发式引擎挑选 skill

仓库提供的是：

- skill 包
- 平台元数据
- 命令和 agent 的引用关系
- 安装时的目录映射规则

真正的自动选择逻辑在平台 runtime 里。

## 维护规则

当你新增或修改 agent / skill 时，通常要同步这些地方：

1. 如果 agent 角色变了，更新 `packages/cli/src/templates/claude/agents/*.md`
2. 如果 workflow 变了，更新 `packages/cli/src/templates/codex/skills/<name>/SKILL.md`
3. 如果需要 Codex 支持，把 skill 镜像到 `.agents/skills/<name>/`
4. 如果希望更好地被平台发现，补全平台侧元数据或描述字段
5. 如果 slash command 有变化，更新对应的 command 模板
6. 如果安装目录布局变化，更新 `packages/cli/src/types/ai-tools.ts` 和 `packages/cli/src/configurators/index.ts`

## 关键文件

- [packages/cli/src/templates/claude/commands/spec/start.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/start.md)
- [packages/cli/src/templates/claude/commands/spec/brainstorm.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/brainstorm.md)
- [packages/cli/src/templates/claude/commands/spec/current-task.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/commands/spec/current-task.md)
- [packages/cli/src/templates/claude/agents/dispatch.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/dispatch.md)
- [packages/cli/src/templates/claude/agents/implement.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/implement.md)

## ECC vs 当前项目 vs 推荐集成链路

### 差异对照

| 维度 | ECC 链路 | 当前项目 | 推荐集成方式 |
|---|---|---|---|
| 入口 | `command -> agent` | `/spec:start -> task workflow` | 保持当前入口，不改命令体系 |
| 执行单元 | `agent -> skill` | `workflow -> subagent(agent)` | 让 `agent` 继续负责执行，新增 skill bundle 注入 |
| skill 选择 | harness/runtime 隐式激活 | 主要靠 phase / hook / 固定模板 | 在任务创建期做轻量 profile 解析 |
| 选择真源 | skill 元数据 + runtime 发现 | `current_phase + decision_hints` | `skill-profiles.json + selected_skills` |
| 可观测性 | 元数据 + runtime 行为 | `explain` / task.json / hook 日志 | 保留 `explain`，只做只读说明 |
| 复杂度 | 运行时更灵活 | 编排更稳定 | 只把灵活性前移到任务创建期 |

### 当前项目为什么没有 ECC 那种灵活性

当前项目的链路偏“工作流驱动”，所以：

- `implement / check / debug` 的节点是先验确定的
- skill 目前主要是平台模板或规范输入，不是统一的运行时激活对象
- 运行时没有一个仓库级的 skill 评分器或调度器

这意味着它更稳定，但也更死板。

### 最小集成方式

如果只想集成 ECC 里的“灵活 skill 选择”，不要引入运行时评分器，而是加一个任务创建期的解析层：

```text
task create
  -> 读取 dev_type / task_mode / action
  -> 查 skill-profiles.json
  -> 写入 selected_skills
  -> implement / check agent 启动
  -> hook 注入对应 skill
```

这样可以保留当前项目的稳定 workflow，同时得到 ECC 式的“按场景选 skill”能力。

### 什么时候需要进一步增强

只有当你满足下面条件时，才值得往 ECC 那种 runtime 灵活度继续靠：

- skill 数量明显增多
- 同一节点经常要组合多个 skill
- 场景上下文会显著影响 skill 组合
- 团队愿意接受更复杂的规则引擎

在这些条件不满足时，推荐继续停留在“任务创建期解析 + hook 注入”的层次。
- [packages/cli/src/templates/claude/agents/check.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/agents/check.md)
- [packages/cli/src/types/ai-tools.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/types/ai-tools.ts)
- [packages/cli/src/configurators/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/index.ts)
- [packages/cli/src/configurators/codex.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/codex.ts)
- [packages/cli/src/configurators/antigravity.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/configurators/antigravity.ts)
- [packages/cli/src/templates/codex/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/index.ts)
- [packages/cli/src/templates/antigravity/index.ts](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/antigravity/index.ts)
- [packages/cli/src/templates/codex/skills/current-task/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/current-task/SKILL.md)
- [packages/cli/src/templates/codex/skills/create-command/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/create-command/SKILL.md)
- [packages/cli/src/templates/codex/skills/integrate-skill/SKILL.md](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/codex/skills/integrate-skill/SKILL.md)

## 一句话总结

`spec-first` 里的 agent 到 skill 调用链，本质上是由命令、agent、模板和平台注册表拼出来的：

- 命令先把任务导入 workflow
- agent 再按 phase 调 subagent
- skill 提供模板能力或规范输入源
- configurator 把模板落到目标平台目录
- 平台 runtime 决定最终如何激活和消费 skill

如果要改变“某类任务最终用哪个 skill”，通常要改的是 skill 模板、agent 引用和平台配置，而不是在仓库里加一个新的本地运行时选择器。

---

## 当前 spec-first 的真实执行流程

这里把当前 `spec-first` 从需求到开发结束的实际流程单独收口，避免把“方法论流程”和“实现链路”混在一起。

### Claude 主线

```text
用户需求
  -> /spec:start
  -> 任务分类：简单 / 复杂
  -> /spec:brainstorm（复杂任务才强制）
  -> 创建 task directory + prd.md
  -> 研究代码库 / 配置 implement.jsonl / check.jsonl / debug.jsonl
  -> 激活当前任务
  -> dispatch
  -> implement agent
  -> check agent
  -> /spec:finish-work
  -> create-pr
```

### Multi-Agent Pipeline 主线

```text
plan.py
  -> 创建 task directory
  -> 启动 plan agent
  -> 产出完整 task directory（prd.md + context jsonl）
  -> start.py
  -> 启动 dispatch agent
  -> 按 next_action 依次执行 implement / check / debug / finish / create-pr
```

### 关键产物与职责

- `prd.md`：需求/规格文档
- `implement.jsonl`：implement 阶段上下文
- `check.jsonl`：check 阶段上下文
- `debug.jsonl`：debug 阶段上下文
- `task.json`：任务状态、next_action、当前阶段
- `/spec:finish-work`：提交前收口检查
- `create-pr`：最终提交、push、建 Draft PR

### 一句话总结

`spec-first` 的流程不是“PRD 直接进代码”，而是：

```text
需求 -> PRD/spec -> task directory -> context files -> agent 执行 -> check -> finish-work -> PR
```

---

## brainstorm / plan / tasks 的边界

这三个阶段经常被混在一起，这里单独收口。

| 阶段 | 当前是否存在独立节点 | 主要输入 | 主要产物 | 是否生成文档 | 是否直接进入执行 |
| --- | --- | --- | --- | --- | --- |
| `brainstorm` | 是，命令层节点 | 模糊需求、用户约束、repo 现状 | `prd.md`（持续更新） | 是，主要生成 PRD/spec | 否，先收敛需求 |
| `plan` | 是，`plan.py` + `plan` agent | 已确认的 PRD、任务类型、代码库上下文 | `task.json`、`implement.jsonl`、`check.jsonl`、`debug.jsonl` | 是，但重点是 task directory 和上下文文件，不是独立技术方案文档 | 间接进入，先准备执行上下文 |
| `tasks` | 否，当前没有独立 `/spec:tasks` 节点 | 技术方案 / PRD / 上下文 | 当前实现里折叠进 task directory、`next_action`、context files | 否，任务拆分结果体现在目录结构里 | 否，任务拆分后才进入 implement/check |

### 结论

- `brainstorm` 会生成文档，主要是 `prd.md`
- `plan` 会生成/整理任务目录和上下文文件，重点不是独立技术方案文档
- `tasks` 在当前 `spec-first` 里不是独立节点，任务拆分被折叠进 task directory 结构里

### 什么时候应该拆子任务

| 判断项 | 需要拆分的信号 |
| --- | --- |
| 复杂度 | 任务明显复杂，不是单文件/单步骤小改动 |
| 独立性 | 能拆成多个彼此独立的 work item |
| 可验证性 | 每个子项都能单独验证 |
| 边界清晰 | 每个子项有明确输入/输出/完成标准 |
| 依赖关系 | 子项之间不是强耦合顺序依赖 |
| PR 粒度 | 拆开后自然能形成多个小 PR |
| 上下文保持 | 拆开后不会丢失整体目标和验收标准 |

### 不建议拆分的情况

- 只是一个任务但实现步骤多
- 子步骤必须严格串行，拆开后意义不大
- 拆分会让整体上下文变碎，反而降低质量

### 实际判断口径

如果 brainstorm 过程中能自然写出：

- `PR1 / PR2 / PR3`
- 或者多个互相独立的 task directory

那通常就说明应该拆子任务了。

### Claude 链路所有 command / agent 产物总表

| 节点 | 类型 | 主要职责 | 主要产物 | 关键文件 / 入口 |
| --- | --- | --- | --- | --- |
| `spec:start` | 命令 | 初始化会话、读取上下文、分类任务 | 会话上下文、任务分类结果 | `packages/cli/src/templates/claude/commands/spec/start.md` |
| `spec:brainstorm` | 命令 | 收敛需求、补歧义、形成 PRD/spec | `prd.md` | `packages/cli/src/templates/claude/commands/spec/brainstorm.md` |
| `plan` | agent / pipeline | 把需求整理成可执行 task directory | `task.json`、`implement.jsonl`、`check.jsonl`、`debug.jsonl` | `packages/cli/src/templates/claude/agents/plan.md`、`.spec-first/scripts/multi_agent/plan.py` |
| `dispatch` | agent | 纯调度，按 `next_action` 叫子 agent | 子 agent 调度结果 | `packages/cli/src/templates/claude/agents/dispatch.md` |
| `implement` | agent | 实现代码 | 代码变更、补充测试 | `packages/cli/src/templates/claude/agents/implement.md` |
| `check` | agent | 验证和修复 | 修复后的代码、验证结果 | `packages/cli/src/templates/claude/agents/check.md` |
| `debug` | agent | 修复特定问题 | 修复后的代码、debug 结果 | `packages/cli/src/templates/claude/agents/debug.md` |
| `finish-work` | 命令 | 提交前收口检查 | 检查结果、更新建议 | `packages/cli/src/templates/claude/commands/spec/finish-work.md` |
| `create-pr` | 脚本动作 | 提交、push、建 Draft PR | PR URL、任务完成状态 | `packages/cli/src/templates/claude/agents/dispatch.md`（触发约定）、`.spec-first/scripts/multi_agent/create_pr.py` |
