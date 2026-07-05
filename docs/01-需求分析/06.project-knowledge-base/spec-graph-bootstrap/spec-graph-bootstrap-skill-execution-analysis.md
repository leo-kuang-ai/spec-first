# spec-graph-bootstrap 执行逻辑分析

> 分析对象：`skills/spec-graph-bootstrap/SKILL.md`
> 参考实现：`skills/spec-graph-bootstrap/references/prd-template.md`、`skills/spec-graph-bootstrap/references/database-prd-template.md`
> 辅助参照：`templates/claude/commands/spec/graph-bootstrap.md`、`docs/02-架构设计/03-agent-workflow-patterns.md`、`docs/05-用户手册/02-核心概念.md`

本文聚焦 `spec-graph-bootstrap` 的**执行逻辑**：它如何从命令入口进入，如何做宿主就绪检查，如何分析项目，如何生成任务合同，如何并行执行 worker，以及失败时怎么恢复。

---

## 1. 一句话结论

`spec-graph-bootstrap` 不是一个“生成文档的单一 prompt”，而是一套**Stage-0 上下文编排协议**。

它的核心不是写 Markdown，而是把一次 bootstrap 拆成：

1. 宿主就绪检查
2. 项目分析与模式探测
3. PRD 任务合同生成
4. 多 worker 并行产出
5. 备份、汇总与恢复

最终把目标项目的上下文沉淀为 `docs/contexts/<slug>/` 下的长期资产。

---

## 2. 总体执行路径

### 2.1 入口层

`templates/claude/commands/spec/graph-bootstrap.md` 只是命令入口，它不负责真正的分析逻辑，只负责把执行权交给 `skills/spec-graph-bootstrap/SKILL.md`。

这意味着：

- 命令模板是入口
- `SKILL.md` 是主契约
- 实际执行逻辑全部以 skill 文件为准

### 2.2 ASCII 流程图

```text
┌────────────────────────────────────────────────────┐
│  spec-graph-bootstrap 或 spec-graph-bootstrap                │
└──────────────────────────────┬─────────────────────┘
                               │
                               v
┌────────────────────────────────────────────────────┐
│ Host Readiness Gate                                │
│ 1) 检查 ~/.claude/spec-first/host-setup.json       │
│ 2) 探测 MCP 工具是否可调用                         │
└──────────────────────────────┬─────────────────────┘
                 ┌─────────────┴─────────────┐
                 │                           │
                 v                           v
        ⛔ NOT_SETUP /                    ⛔ SETUP_DONE_NOT_RESTARTED /
        直接停止                          直接停止
                 │
                 v
┌────────────────────────────────────────────────────┐
│ Phase 1: Analyze the Target Repository             │
│ - 解析 slug                                         │
│ - 必要时做备份                                      │
│ - 并行探测 Serena / GitNexus / ABCoder             │
│ - 识别 layer 与 MySQL 配置                          │
└──────────────────────────────┬─────────────────────┘
                               │
                               v
┌────────────────────────────────────────────────────┐
│ Phase 2: Create PRD Task Contracts                 │
│ - 固定任务 + 条件任务                              │
│ - 为每个任务写独立 prd.md                          │
└──────────────────────────────┬─────────────────────┘
                               │
                               v
┌────────────────────────────────────────────────────┐
│ Phase 3: Execute Worker Subagents                  │
│ - worker 并行执行                                  │
│ - 严格文件所有权                                   │
│ - 主控最后汇总 README.md                           │
└──────────────────────────────┬─────────────────────┘
                               │
                               v
┌────────────────────────────────────────────────────┐
│ 输出 docs/contexts/<slug>/                          │
│ + 成功则删除备份                                    │
│ + 失败则按恢复策略处理                              │
└────────────────────────────────────────────────────┘
```

---

## 3. 阶段拆解

### 3.1 宿主就绪门禁

这一步不是分析项目，而是先确认运行环境是否已经完成 MCP 准备。

门禁有两个状态：

| 状态 | 判定条件 | 行为 |
|------|----------|------|
| `NOT_SETUP` | `~/.claude/spec-first/host-setup.json` 不存在，或 `setup_success != true` | 直接停止，提示先跑 `spec-mcp-setup` |
| `SETUP_DONE_NOT_RESTARTED` | 配置文件存在，但 MCP 工具探针失败 | 直接停止，提示重启 Claude Code |
| `READY` | 文件存在且 MCP 探针成功 | 进入 Phase 1 |

这里的关键点是：

- 不允许静默降级
- 不允许跳过门禁继续执行
- 两种阻断都必须给出“原因 / 操作 / 完成后下一步”

### 3.2 Phase 1: 项目分析

Phase 1 是整个 skill 的核心，它负责把“这个仓库是什么样”分析清楚，再把结果转成后续 worker 能消费的上下文。

#### 3.2.1 Context slug 选择

slug 选择遵循固定优先级：

1. 用户显式传入且满足 `[a-z0-9-]+`
2. 复用目标项目内已有 `docs/contexts/*/README.md` 的 `<!-- spec-graph-bootstrap -->` 标记
3. 退回到目标项目根目录名并转成 kebab-case

这一段有两个设计重点：

- 永远不因为 slug 冲突而阻塞
- 只要能自动推导，就不要求用户确认

#### 3.2.2 备份策略

如果 `docs/contexts/<slug>/` 已经存在，bootstrap 会先备份到：

```text
.context/spec-first/bootstrap/<slug>/backup_<ISO-timestamp>/
```

然后再进入写入阶段。

备份策略的目的不是“多留一份文件”，而是保证重跑时不会静默覆盖旧上下文。

#### 3.2.3 并行探测分析能力

Phase 1.3 的探测逻辑是 **all-settled** 风格：

- Serena probe
- GitNexus probe
- ABCoder probe

三者并行跑，互不取消。

这带来两个结果：

- 能尽快判断当前项目能用哪些工具
- 不会因为一个工具失败就放弃其他工具的结果

#### 工具选择逻辑

| 模式 | 条件 | 可用工具 |
|------|------|----------|
| Full | `gitnexus.ready && abcoder.ready` | GitNexus + ABCoder |
| Enhanced | `serena.ready || abcoder.ready` | Serena，或 Serena + ABCoder |
| Basic | 全部探针失败 | `Read` / `Grep` / `Glob` |

这里的关键不是“哪个工具最好”，而是“工具能用多少就用多少”。

#### 3.2.4 层与数据库识别

Phase 1 还负责两类结构识别：

- layer 检测：frontend / backend / mobile / desktop / cli / shared / data
- MySQL 配置检测：从 env、ORM 配置、框架配置中找连接信息

数据库识别只处理 MySQL MVP，其他数据库类型仅记录不处理。

MySQL 连接验证进一步分层：

| 级别 | 说明 |
|------|------|
| Level 1 | MCP MySQL 可用，且 `SELECT DATABASE()` 与项目配置一致 |
| Level 2 | MCP 不可用或不匹配，但 CLI `mysql` 可连 |
| Level 3 | MCP/CLI 都不行，只能从 ORM 推断 |

### 3.3 Phase 2: 生成任务合同

`spec-graph-bootstrap` 的任务合同不是口头说明，而是写入 `.context/spec-first/bootstrap/<slug>/tasks/<task-id>/prd.md` 的正式 PRD。

这正对应 `docs/02-架构设计/03-agent-workflow-patterns.md` 里总结的模式：

- PRD Task Contract
- File Ownership Boundary
- Conditional Generation
- Multi-Level Degradation
- Failure Recovery

#### 任务类型

固定任务：

- `summary-context`
- `architecture-context`
- `pitfalls-context`

条件任务：

- `frontend-context`
- `backend-context`
- `mobile-context`
- `desktop-context`
- `cli-context`
- `shared-context`
- `data-context`
- `guides-context`
- `database-context`（仅 MySQL 验证通过时）

### 3.4 Phase 3: 并行执行 worker

Phase 3 的目标不是让主控继续“自己写文件”，而是把文件写入责任转交给 worker。

worker 的约束很硬：

- 只能读自己的 `prd.md`
- 只能写自己被分配的文件
- 不能改源代码
- 不能跑 git 命令

### 3.5 汇总与恢复

所有 worker 完成后，由 orchestrator 统一写 `docs/contexts/<slug>/README.md`。

README 的职责是：

- 提供导航入口
- 标注生成时间
- 列出实际生成的文件
- 说明这是静态上下文，不会自动跟随代码变化

恢复逻辑如下：

```text
已有 docs/contexts/<slug>/
        │
        v
  先备份到 .context/spec-first/bootstrap/<slug>/backup_<timestamp>/
        │
        v
  Phase 3 写入 worker 产物
        │
        ├── 全部成功 -> 删除备份
        │
        ├── summary-context 失败 -> 全量恢复备份并停止
        │
        └── 其他 worker 失败 -> 保留已成功产物，README 标注缺失项
```

---

## 4. 关键决策点

### 4.1 不阻塞 slug

slug 永远自动推导，不等待人工确认。这保证 bootstrap 可以批量运行，不被交互式确认卡死。

### 4.2 不把工具不可用当成整体失败

Full / Enhanced / Basic 是降级关系，不是成败关系。能拿到多少可靠上下文，就产出多少。

### 4.3 不让 worker 共享写权限

文件所有权边界是整个工作流的安全底座。它把“谁能改什么”从口头约定变成了可审查的文件列表。

### 4.4 不让旧上下文被静默覆盖

R20 备份策略和 Phase 3 的恢复策略，确保重跑 bootstrap 不会悄悄把已有文档弄丢。

---

## 5. 输出物与边界

### 5.1 永久产物

最终要落到目标项目里的，是：

```text
docs/contexts/<slug>/
```

典型内容包括：

- `README.md`
- `00-summary.md`
- `architecture/*.md`
- `pitfalls/index.md`
- `layers/<layer>/index.md`
- `database/*.md`（条件生成）

### 5.2 临时控制面

执行期临时产物放在：

```text
.context/spec-first/bootstrap/<slug>/
```

这里面包含：

- worker PRD
- 备份目录
- 临时调度状态

这部分不属于长期知识库。

---

## 6. 可复用模式

`spec-graph-bootstrap` 的执行逻辑，实质上已经沉淀出一组可以复用的 workflow 模式：

1. `PRD Task Contract`：先写合同，再执行
2. `File Ownership Boundary`：用文件边界约束并行协作
3. `Conditional Generation`：有证据才生成
4. `Multi-Level Degradation`：工具不足时逐级降级
5. `Failure Recovery`：先备份，再写入，再决定恢复还是保留

这些模式不是装饰性的说明，而是决定它能否稳定运行的执行骨架。

---

## 7. 风险与注意事项

### 7.1 宿主依赖风险

如果用户忘了执行 `spec-mcp-setup` 或没重启 Claude Code，bootstrap 会在门禁阶段直接停掉。

### 7.2 目标项目污染风险

分析时必须排除 `docs/contexts/`，否则历史 bootstrap 结果会污染当前项目分析。

### 7.3 数据库误判风险

数据库检测只处理 MySQL，且必须先做连接一致性校验。不能把“有 MCP 服务”误判成“已连到项目数据库”。

### 7.4 失败恢复风险

summary-context 是恢复分界点：

- 它失败，说明基础上下文都没建成，必须全量回滚
- 其他任务失败，说明局部上下文可保留，没必要把成功结果一起丢掉

---

## 8. 总结

`spec-graph-bootstrap` 的执行逻辑可以概括为：

> 先验证宿主，再分析项目；先写任务合同，再并行执行；先备份，再落盘；成功后删备份，失败时按责任边界恢复。

这使它不是一个一次性的生成器，而是一个能在真实项目里反复运行、并且能稳定沉淀上下文资产的 Stage-0 编排工作流。
