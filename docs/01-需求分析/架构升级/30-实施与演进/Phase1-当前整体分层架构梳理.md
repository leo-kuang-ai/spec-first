# Phase 1 当前整体分层架构梳理

> 基于当前仓库代码与《整体方案-目标架构与三阶段实施》整理。
> 目标不是描述“理想终局”，而是明确“Phase 1 完成后，系统现在实际如何分层、各层边界在哪里、还有哪些未完成部分”。

---

## 1. 结论先行

当前项目已经形成一条可运行的 **Phase 1 最小闭环**，主路径可以概括为：

> `CLI / Templates -> 项目内运行时实例 -> task compiler -> task contract -> dispatch/runtime hooks -> completion state`

如果结合仓库代码看整体分层，最合适的理解方式不是只看 `.spec-first/`，而是区分两个平面：

1. **框架生产平面**  
   `packages/cli` 负责把模板、平台适配器、初始化/升级逻辑生产到用户项目。

2. **项目运行时平面**  
   仓库根目录下的 `.spec-first/`、`.claude/`、任务目录、hooks、agent 定义共同构成真正执行任务的运行时。

在这个基础上，Phase 1 已经把主方案中的核心链路真正落到了代码里：

1. `task_store.py` 成为 task contract 的实际编译入口
2. `task.json` 开始承载 `workflow_type + next_action + decision_hints`
3. `dispatch` 继续只按 `next_action` 调度
4. `inject-subagent-context.py`、`ralph-loop.py` 开始消费 task-level contract

但也必须明确两个现实：

1. **Evidence 还没有正式建模**，当前仍然以 `status/current_phase/pr_url` 等状态字段为主
2. **模板源代码已经出现 Phase 2 痕迹**，但还没有完全收敛成新的稳定主路径

---

## 2. 整体结构：两个平面

```text
Plane A: 框架生产平面
  packages/cli/
    ├── src/cli, src/commands
    ├── src/configurators
    ├── src/templates
    └── src/migrations
          ↓ init / update
Plane B: 项目运行时平面
  .spec-first/
    ├── workflow.md / config.yaml / tasks / workspace / spec
    └── scripts/
  .claude/
    ├── agents/
    └── hooks/
          ↓ 共同驱动
  .spec-first/tasks/<task>/
    ├── prd.md / info.md / *.jsonl
    └── task.json
```

这两个平面的关系是：

1. `packages/cli` 是 **框架源码与分发层**
2. 根目录 `.spec-first/`、`.claude/` 是 **当前 spec-first 项目自身正在 dogfood 的运行时实例**
3. 对“当前 Phase 1 已完成什么”的判断，应以 **根目录运行时主路径** 为准
4. 对“未来如何对外发布/升级”的判断，则要看 `packages/cli/src/templates/*`

### 2.1 ASCII 总览图

```text
                         +----------------------------------+
                         |         packages/cli             |
                         |  CLI / configurators / templates |
                         +----------------+-----------------+
                                          |
                                          | init / update
                                          v
+-------------------------------------------------------------------------+
|                           project runtime                               |
|                                                                         |
|  +---------------------------+     +----------------------------------+ |
|  |      .spec-first/         |     |            .claude/              | |
|  | workflow / spec / tasks   |<--->| agents / hooks / settings        | |
|  | workspace / scripts       |     | dispatch + runtime hooks         | |
|  +-------------+-------------+     +----------------+-----------------+ |
|                |                                    |                   |
|                | current task / task.json           | subagent calls    |
|                v                                    v                   |
|      +-------------------------+        +-----------------------------+  |
|      | .spec-first/tasks/<x>/  |        | implement / check / finish |  |
|      | prd / info / *.jsonl    |        | create-pr execution        |  |
|      | task.json               |        +-----------------------------+  |
|      +-------------------------+                                          |
+-------------------------------------------------------------------------+
```

---

## 3. Plane A：框架生产平面

### 3.1 CLI 入口层

核心文件：

- `packages/cli/src/cli/index.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/update.ts`

职责：

1. 提供 `init` / `update` 命令入口
2. 管理全局开发者身份、版本检查、升级入口
3. 决定哪些模板和平台配置会被写入项目

这一层不参与任务执行，只负责 **把 workflow runtime 安装进项目**。

### 3.2 平台配置层

核心文件：

- `packages/cli/src/configurators/index.ts`
- `packages/cli/src/configurators/workflow.ts`
- `packages/cli/src/configurators/*.ts`

职责：

1. 把平台看成注册表中的配置项
2. 复制 `spec-first` 核心目录
3. 复制 Claude/Cursor/Codex 等平台特定命令、hook、skill、agent 定义
4. 为 `update` 提供模板收集与受管路径识别能力

这层的关键价值是：**把同一套 runtime contract 投递到不同 AI 平台外壳中**。

### 3.3 模板资产层

核心文件：

- `packages/cli/src/templates/spec-first/index.ts`
- `packages/cli/src/templates/extract.ts`
- `packages/cli/src/templates/*`
- `packages/cli/scripts/copy-templates.js`

职责：

1. 维护通用模板，而不是直接复用 spec-first 项目自己的运行时目录
2. 把脚本、hooks、agents、markdown 模板作为可分发资产暴露
3. 支撑 `init` / `update` 的模板对比和复制

这里很关键的一点是：

> `packages/cli/src/templates/*` 才是“对外分发模板真相”；根目录 `.spec-first/` 更像当前项目自己的运行时实例。

---

## 4. Plane B：项目运行时平面

这一平面才是 Phase 1 架构落地的主体。结合主方案，当前可以理解为六层半。

### 4.0 ASCII 分层关系图

```text
上游输入
  |
  v
+-------------------------------+
| Layer 0 Intent / Spec         |
| workflow.md / spec / prd      |
| info / *.jsonl                |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 1 Policy / Topology     |
| task.py --workflow            |
| workflow_templates.py         |
| dispatch pure dispatcher rule |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 2 Compilation           |
| task_store.py                 |
| task_context.py               |
| plan.py reuse cmd_create()    |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 3 Runtime Contract      |
| task.json                     |
| workflow_type                 |
| next_action                   |
| decision_hints                |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 4 Orchestration         |
| current_task.py               |
| start.py / dispatch / phase   |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 5 Enforcement           |
| inject-subagent-context.py    |
| ralph-loop.py                 |
| create_pr.py                  |
+---------------+---------------+
                |
                v
+-------------------------------+
| Layer 6 Completion (transient)|
| status / current_phase /      |
| pr_url / verify / markers     |
+-------------------------------+
```

### 4.1 Layer 0：Intent / Spec 输入层

核心载体：

- `.spec-first/workflow.md`
- `.spec-first/spec/**`
- `.spec-first/tasks/<task>/prd.md`
- `.spec-first/tasks/<task>/info.md`
- `.spec-first/tasks/<task>/*.jsonl`

职责：

1. 表达项目级规范、任务需求、技术设计、上下文选择
2. 为后续 compiler 和 runtime 提供上游输入

当前状态：

1. 这层已经完整存在
2. 但它本身不参与执行调度
3. 运行时真正消费的核心 truth 不是这些原始文档，而是它们编译后的 `task.json`

### 4.2 Layer 1：Policy / Topology 定义层

核心文件：

- `.spec-first/scripts/task.py`
- `.spec-first/scripts/common/workflow_templates.py`
- `.claude/agents/dispatch.md`

职责：

1. 定义允许的 topology
2. 暴露 create-time 输入参数
3. 约束 dispatch 的职责边界

当前 Phase 1 主路径的真实边界是：

1. CLI 只正式开放 `default / quick-fix / docs-only`
2. `dispatch` 被建模为 pure dispatcher，只读取 `task.json.next_action`
3. topology 与 policy 开始分离，但 `workflow_templates.py` 里仍保留了 `with-tdd / with-review / debug / research` 等历史/过渡定义

因此这一层的结论是：

> **Phase 1 的主执行边界已经收敛，但 topology registry 本身还没有完全清理到目标态。**

### 4.3 Layer 2：Compilation / Task Compiler 层

核心文件：

- `.spec-first/scripts/common/task_store.py`
- `.spec-first/scripts/common/task_context.py`
- `.spec-first/scripts/multi_agent/plan.py`

职责：

1. 创建任务目录
2. 生成 `task.json`
3. 根据 workflow 生成 `next_action`
4. 生成默认 `decision_hints`
5. 初始化 implement/check/debug 的 JSONL 上下文

这是当前仓库里最接近主方案“Compiler”定义的一层，也是 Phase 1 最重要的收口点。

当前已经落地的事实：

1. `cmd_create()` 会写入 `workflow_type`
2. `cmd_create()` 会根据 workflow 编译 `next_action`
3. `cmd_create()` 会写入默认 `decision_hints`
4. `plan.py` 仍然复用 `cmd_create()`，没有另起一套 task 写入逻辑

这意味着：

> **`task_store.py` 事实上已经是当前系统的统一 contract producer。**

### 4.4 Layer 3：Runtime Contract 层

核心载体：

- `.spec-first/tasks/<task>/task.json`
- `.spec-first/scripts/common/types.py`

当前 task contract 的关键字段包括：

```json
{
  "current_phase": 0,
  "next_action": [...],
  "workflow_type": "default",
  "decision_hints": {
    "implement": {"mode": "standard"},
    "check": {"verify_commands": ["pnpm lint", "pnpm typecheck"]}
  },
  "status": "planning",
  "pr_url": null
}
```

职责：

1. 承载编译后的 topology truth
2. 承载最小 policy contract
3. 承载 phase 状态和完成状态

当前结论：

1. `task.json` 已经从“普通元数据文件”变成“运行时 contract”
2. runtime hooks 的主消费对象已经开始转向 `task.json`
3. 但 `evidence` 仍只是预留字段，没有形成正式 consumer/producer 闭环

### 4.5 Layer 4：Runtime Orchestration 层

核心文件：

- `.spec-first/scripts/multi_agent/start.py`
- `.claude/agents/dispatch.md`
- `.spec-first/scripts/common/phase.py`
- `.spec-first/scripts/current_task.py`
- `.spec-first/scripts/common/tasks.py`
- `.spec-first/scripts/multi_agent/status_display.py`

职责：

1. 激活当前任务
2. 创建 worktree 和 agent 运行环境
3. 按 `next_action` 顺序调度 phase
4. 维护 phase/state 的读模型和展示

这里的关键设计已经符合主方案要求：

1. `dispatch` 不推导 policy
2. `dispatch` 不重新理解 spec
3. `dispatch` 只关心当前 task 和 `next_action`
4. `phase.py` 把 phase 读写逻辑集中化

因此当前可以把这一层概括成：

> **Orchestration 只负责“按 contract 驱动流水线”，不负责“生成 contract”。**

### 4.6 Layer 5：Runtime Enforcement 层

核心文件：

- `.claude/hooks/inject-subagent-context.py`
- `.claude/hooks/ralph-loop.py`
- `.spec-first/scripts/multi_agent/create_pr.py`

职责：

1. 在 subagent 调用前注入上下文和最小 phase policy
2. 在 check 停止前执行 verify gate
3. 在最终阶段执行 PR 创建和完成状态落盘

当前 Phase 1 的关键落地：

1. `inject-subagent-context.py` 已从 `task.json.decision_hints` 读取 implement/check 提示
2. `ralph-loop.py` 已优先读取 `task.json.decision_hints.check.verify_commands`
3. `create_pr.py` 会把任务推进到 `create-pr` 对应 phase，并更新 `status/pr_url`

但与主方案目标相比，还有两个差异：

1. policy 注入标题目前是 `## Task-Level Policy`，而不是目标文档建议的统一 `## Phase Policy`
2. 注入内容还是“把 dict 直接展开成 bullet”，还没有收敛成更硬、更短的 canonical policy rendering

也就是说：

> **consumer 已经存在，但 policy rendering 还处在最小可用态，不是最终规范态。**

### 4.7 Layer 6：Completion / Evidence 过渡层

当前实际使用的完成性信息来自：

- `task.json.status`
- `task.json.current_phase`
- `task.json.pr_url`
- `ralph-loop` 的 verify 结果
- completion markers
- session / PR / spec 更新等外围产物

这层当前的状态非常明确：

1. 系统已经不是纯口头完成，而是有 runtime gate
2. 但还没有统一 `evidence` schema
3. 仍然偏“状态驱动 + 局部验证驱动”，还不是完整“证据驱动”

所以它现在更准确的说法是：

> **Phase 1 已经具备 completion enforcement，但还没有正式进入 Phase 3 的 evidence architecture。**

---

## 5. 当前主路径如何跑通

当前 Phase 1 的真实主路径如下：

```text
task.py create
  -> common/task_store.py
  -> workflow_templates.py
  -> 生成 task.json(workflow_type/next_action/decision_hints)

task.py init-context
  -> common/task_context.py
  -> 生成 implement.jsonl / check.jsonl / debug.jsonl

multi_agent/start.py
  -> 设置 worktree / current task
  -> 启动 dispatch agent

dispatch
  -> 读取 task.json.next_action
  -> 依次调用 implement / check / finish / create-pr

inject-subagent-context.py
  -> 注入 spec/prd/info/jsonl
  -> 注入 decision_hints
  -> 推进 current_phase

ralph-loop.py
  -> 优先执行 check.verify_commands
  -> 失败则阻止 check 停止

create_pr.py
  -> 创建 PR
  -> 更新 status/pr_url/current_phase
```

这条链路已经满足了主方案中 Phase 1 的核心要求：

1. contract 有 producer
2. contract 有 runtime consumer
3. dispatch 没有反向长成策略引擎

### 5.1 ASCII 执行链路图

```text
User / Plan Input
      |
      v
task.py create
      |
      v
task_store.py
  |- read workflow_type
  |- compile next_action
  `- write decision_hints
      |
      v
task.json  <------------------------------+
      |                                   |
      | init-context                      | phase/status update
      v                                   |
task_context.py                           |
  |- implement.jsonl                      |
  |- check.jsonl                          |
  `- debug.jsonl                          |
      |                                   |
      +-------------------+               |
                          |               |
                          v               |
                    start.py              |
                      |                   |
                      v                   |
                   dispatch               |
                      |                   |
          +-----------+-----------+       |
          |           |           |       |
          v           v           v       |
      implement     check      create-pr -+
          |           |
          |           +--> ralph-loop.py
          |                |- read verify_commands
          |                `- block stop if failed
          |
          `--> inject-subagent-context.py
               |- inject prd/spec/jsonl
               |- inject decision_hints
               `- update current_phase
```

---

## 6. 对照主方案：哪些已经完成，哪些还没完成

### 6.1 已完成部分

1. `task_store.py` 已承担统一编译入口职责
2. `task.json` 已具备 `workflow_type + next_action + decision_hints`
3. `task.py create` 已开放 `--workflow`
4. `types.py` 已补充 Phase 1 相关字段
5. `inject-subagent-context.py` 已开始消费 task-level policy
6. `ralph-loop.py` 已把 task-level verify contract 放到 repo-level verify 之前
7. `dispatch` 仍保持“纯调度”定位

### 6.2 尚未完成或仍处过渡态的部分

1. `workflow_templates.py` 还保留超出 Phase 1 主边界的历史 topology
2. `decision_hints` 的渲染格式还没有完全标准化
3. `verify_commands` 仍是 producer 内硬编码默认值，不是 repo-aware compiler
4. `evidence` 还没有正式 producer / consumer
5. `finish` 和 `debug` 还没有独立 policy schema

### 6.3 当前最需要警惕的混淆点

1. 不要把 `workflow_templates.py` 里仍存在的历史定义，当成当前稳定支持能力
2. 不要把 `evidence: null` 误判为“证据层已经落地”
3. 不要把模板源码中的零散 Phase 2 改动，当成根目录运行时已经完成的事实

---

## 7. 当前一个重要现实：模板源代码已出现 Phase 2 痕迹

从仓库现状看，Phase 2 已经开始进入模板源码，但尚未形成完整闭环。

最典型的例子是：

1. `packages/cli/src/templates/spec-first/scripts/common/task_store.py` 已出现 `PRESET_ENHANCEMENTS`、`PRESET_WORKFLOW_MAPPING`
2. 但 `packages/cli/src/templates/spec-first/scripts/task.py` 还没有同步暴露 `--preset`
3. 根目录运行时主路径仍然以 Phase 1 能力为准

因此当前最准确的架构判断是：

> **运行时主系统已经完成 Phase 1；模板生产链路正在向 Phase 2 过渡，但还没有完全收敛。**

这也是为什么当前梳理整体架构时，需要把“稳定主路径”和“演进中模板侧代码”明确分层。

---

## 8. 建议的当前口径

如果要对外或对内描述“现在 spec-first 的整体分层架构”，建议统一使用下面这套说法：

### 8.1 一句话版

spec-first 当前是一个“**CLI 模板生产层 + 项目内 contract runtime 层**”的双平面系统；其中运行时主链路已经完成 Phase 1，核心收敛点是 `task_store.py -> task.json -> hooks/runtime enforcement`。

### 8.2 分层版

1. **框架生产层**  
   `packages/cli` 负责初始化、升级、模板分发、平台适配。

2. **输入层**  
   `workflow.md/spec/prd/info/jsonl` 提供 intent、规则和任务上下文。

3. **编译层**  
   `task_store.py`、`task_context.py` 把输入编译成 runtime-friendly task contract。

4. **契约层**  
   `task.json` 承载 `workflow_type + next_action + decision_hints + state`。

5. **调度层**  
   `start.py + dispatch + phase.py` 负责按 contract 推进流水线。

6. **执行约束层**  
   `inject-subagent-context.py + ralph-loop.py + create_pr.py` 负责 policy 注入、verify gate、终端动作。

7. **完成性层**  
   当前以 `status/current_phase/pr_url/verify` 为主，正式 evidence schema 留到 Phase 3。

---

## 9. 最终判断

结合主方案与当前代码，当前项目的整体架构已经从“脚本集合”进入了“**最小 contract 驱动 runtime**”阶段。

Phase 1 真正完成的，不是多了几个字段，而是完成了三件更重要的事：

1. **把 task 创建从写文件提升为编译 contract**
2. **把运行时判断从 repo-level 默认规则推进到 task-level contract**
3. **把 dispatch 的职责压回纯调度，避免继续膨胀成策略引擎**

因此，当前最合理的架构结论不是“系统已经到终局”，而是：

> **Phase 1 闭环已经成立；Phase 2 应继续沿“preset 增强 policy、而不是扩张 topology”的方向前进；Phase 3 才进入 evidence 正式建模。**
