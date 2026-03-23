# spec-first 迁移优先级表

> 来源：`get-shit-done` 的工作流分析与迁移清单。
>
> 目标：不是把 GSD 全部搬进 `spec-first`，而是按“价值最大、改造最稳、最符合当前代码”的顺序，筛出可以优先迁移的设计模式。
>
> 结论先行：
> - **优先迁移的是机制，不是命令表面**
> - **先迁移主链分层，再迁移缓冲层，再迁移并行与归档能力**
> - **不建议迁移整套 ceremony 和全量命令集**

## 1. 迁移优先级总表

| 优先级 | 可借鉴点 | GSD 依据 | spec-first 落点 | 迁移建议 | 价值 / 风险 |
|---|---|---|---|---|---|
| P0 | 文件即真相源 | `PROJECT.md` / `REQUIREMENTS.md` / `ROADMAP.md` / `STATE.md` 都是落盘文件 | `spec.md` / `design.md` / `task_plan.md` / `findings.md` / `stage-state.json` | 先保持并强化，不要让对话成为唯一记忆 | 价值最高，风险最低 |
| P0 | 主链与旁路分层 | 主链与 `todo` / `quick` / `workstream` 明确分离 | 主链 `Feature -> REQ -> FR -> DS -> TASK -> TC`，旁路 `Defect / RFC / EX / quick capture` | 立即继续收敛主链，不把旁路拉进执行契约 | 降低复杂度，防止关系图失控 |
| P0 | 需求 / 阶段 / 计划 / 版本分层 | `REQ -> Phase -> PLAN -> SUMMARY -> Milestone` | `REQ -> FR -> DS -> TASK -> TC`，外加 `stage gate` 与 release 节点 | 直接借鉴分层思想，不照搬命名 | 对 traceability 最有帮助 |
| P0 | 摘要与归档分离 | `STATE.md` / `SUMMARY.md` / `MILESTONES.md` 分层 | `findings.md` / `archive/` / `stage-state.json` / `gate-history.jsonl` | 继续保持“当前态”与“历史态”分离 | 便于审查、回溯、归档 |
| P0 | 临时想法缓冲层 | `note` / `todo` 先接住零散想法 | `findings` / `parking lot` / `Defect` / `RFC` | 立即迁移成一个轻量缓冲层 | 减少流程中断 |
| P1 | wave 化并行执行 | `execute-phase` 按 `wave` 并行 | `06-task` / `07-code` / `12-verify` 可按批次推进 | 可以借鉴，但要以现有任务依赖为前提 | 提升吞吐，需注意依赖顺序 |
| P1 | 每个执行器使用 fresh context | GSD 在执行阶段会隔离上下文 | `spec-first` 的 stage skill / task 执行器 | 建议在并行任务和大范围变更时采用 | 降低上下文污染 |
| P1 | 追踪表显式化 | `REQUIREMENTS.md` 的 traceability table | `MatrixRow` / `document-links` / `task_plan traces` | 继续强化“可追踪”，不要只靠口头约定 | 对质量控制非常关键 |
| P1 | 阶段可插入修复 | `Phase 2.1`、`Phase 3.1` 这类插入式阶段 | `feature -> stage -> gate` 的插入修复机制 | 只在必要时启用，避免阶段编号过度碎片化 | 对返工/修复很有用 |
| P2 | Quick Task 命名空间 | `quick_id` 的快速任务目录 | `spec-first` 的轻量修复/临时任务 | 借鉴思路，不一定照搬目录名 | 适合低成本小改动 |
| P2 | Workstream / Workspace 隔离 | 并行工作空间 / workstream | 现有 worktree / feature workspace | 在多任务并发时可继续强化 | 适合并行开发与隔离 |
| P2 | 讨论阶段的收敛机制 | `discuss-phase` 先收敛灰区 | `spec-review` / `focus-requirements` / `orchestrate` | 可作为需求收敛手段借鉴 | 能减少后续返工 |
| P2 | milestone 版本归档 | `complete-milestone` 收尾归档 | `archive` / release handoff | 可借鉴归档动作，但不必照搬版本命名 | 适合阶段性交付 |
| P3 | `todo` / `note` 工作流 | 先收集再落地 | 临时观察 / backlog / parking lot | 只借鉴“先接住”原则 | 低风险，低收益 |
| P3 | 全量 ceremony | 讨论、规划、执行、验证、归档的完整命令海 | `spec-first` 已经有自己的 stage skills | 不建议整套搬运 | 复杂度高，收益边际小 |
| P3 | 命令数量本身 | GSD 的大量命令与快捷入口 | `spec-first` 的 skill / CLI 列表 | 不建议优先复制命令表面 | 容易引入维护负担 |

## 2. 最值得直接借鉴的 6 个机制

### 2.1 文件即真相源

GSD 把状态写进文件，而不是只留在对话里。

`spec-first` 的对应做法已经存在，但还可以继续收紧：

- `spec.md` 作为需求真相源
- `design.md` 作为设计真相源
- `task_plan.md` 作为任务真相源
- `findings.md` 作为运行态真相源
- `stage-state.json` / `gate-history.jsonl` 作为过程真相源

### 2.2 主链与旁路分层

GSD 的主链简单，旁路清楚。

`spec-first` 应继续维持：

```text
主链：
Feature -> REQ -> FR -> DS -> TASK -> TC

旁路：
Defect / RFC / EX / quick capture / parking lot
```

### 2.3 需求 / 阶段 / 计划 / 版本分层

GSD 的核心价值不是命名，而是层级。

`spec-first` 可直接借鉴：

- `REQ` 负责需求项
- `FR` 负责功能需求
- `DS` 负责设计约束
- `TASK` 负责执行切片
- `TC` 负责测试追踪

### 2.4 wave 化并行执行

GSD 允许在同一阶段内按 `wave` 并行。

`spec-first` 可以借鉴到：

- 独立 TASK 并行推进
- 只对有依赖的任务串行
- 大改造分批验证

### 2.5 摘要与归档分离

不要把运行噪音塞进正式文档。

`spec-first` 可以继续保持：

- 当前态：`findings.md` / `stage-state.json`
- 长期态：`spec.md` / `design.md` / `task_plan.md`
- 历史态：`archive/` / `release handoff`

### 2.6 临时想法先进入缓冲层

先接住，再判断是否升级为正式需求、缺陷或 RFC。

这条在 `spec-first` 里尤其重要，因为它可以：

- 减少上下文丢失
- 避免主流程中断
- 避免把边界问题直接污染主文档

## 3. spec-first 的落地建议

### 3.1 第一批：直接迁移

建议先迁移这些机制：

1. 文件即真相源
2. 主链与旁路分层
3. 需求 / 阶段 / 计划 / 版本分层
4. 摘要与归档分离
5. 临时想法缓冲层

这些机制已经和 `spec-first` 当前代码与文档的方向一致，风险最小。

### 3.2 第二批：条件迁移

建议在并行开发和大范围改造时再增强：

1. wave 化并行执行
2. fresh context 隔离
3. 追踪表显式化
4. 插入式阶段

这些机制有价值，但依赖当前项目是否已经有足够稳定的任务分解和验证边界。

### 3.3 第三批：按需迁移

只在确实需要时再考虑：

1. quick task 命名空间
2. workstream / workspace 隔离
3. 讨论阶段收敛机制
4. milestone 归档动作

这些机制适合特定场景，不需要一开始就全量引入。

## 4. 不建议迁移的部分

### 4.1 命令数量本身

GSD 的命令很多，但 `spec-first` 不需要先复制命令海。

### 4.2 全量 ceremony

把讨论、规划、执行、归档全部照搬，会显著增加使用负担。

### 4.3 目录与命名的逐字复制

应迁移“分层思想”，不必迁移“字面结构”。

## 5. 最终建议

如果把 GSD 作为参考，`spec-first` 的迁移顺序应该是：

```text
P0: 主链 / 真相源 / 旁路分层 / 缓冲层
P1: wave 并行 / fresh context / traceability / 插入式阶段
P2: quick task / workstream / milestone / 讨论收敛
P3: 命令表面 / 全量 ceremony
```

这条顺序的原则很简单：

- 先迁移机制
- 再迁移流程
- 最后才考虑命令与外壳

如果只做一件事，先做 **P0**。
