# spec-kit / Superpowers / spec-first 项目驱动支持度对比

## 结论

三者都支持“从需求到实现”的开发链路，但支持层级不同：

- `spec-kit`：原生支持项目驱动，最接近“项目级 PRD -> 技术方案 -> tasks -> implement”的模式。
- `Superpowers`：支持项目驱动式流程，但更偏“技能驱动的规范执行”，不是项目管理系统。
- `spec-first`：当前更偏单任务 / task directory 驱动，项目级拆分能力较弱。

如果以“先梳理完整需求，再生成技术方案，再拆分任务列表，再逐个执行”为目标，`spec-kit` 最接近该模式，`Superpowers` 次之，`spec-first` 目前最弱。

---

## 1. spec-kit

### 支持方式

`spec-kit` 的主链路是：

```text
specify -> clarify -> plan -> tasks -> implement
```

它明确提供了：

- `/speckit.specify`：把需求整理成结构化 spec
- `/speckit.clarify`：补全歧义
- `/speckit.plan`：生成实现计划
- `/speckit.tasks`：把 plan 拆成可执行任务列表
- `/speckit.implement`：按任务执行

### 对项目驱动的支持

`spec-kit` 原生支持：

- 项目级 spec
- 项目级 plan
- 项目级 tasks
- 任务并行标记 `[P]`
- 从 plan 直接生成执行型 tasks.md

### 适用场景

- 大型功能
- 需要完整规格、技术方案、任务拆分的项目
- 希望先规划后执行的团队协作流程

---

## 2. Superpowers

### 支持方式

`Superpowers` 的主链路是：

```text
brainstorming -> writing-plans -> subagent-driven-development / executing-plans
```

它强调：

- 先通过 brainstorming 收敛 spec
- 再通过 writing-plans 写实施计划
- 再通过 subagent-driven-development 执行计划
- 每个任务单独 review

### 对项目驱动的支持

`Superpowers` 支持把复杂需求拆成 sub-projects：

- 如果 spec 覆盖多个独立子系统，brainstorming 阶段应拆成多个 sub-project specs
- 每个 sub-project 都有自己的 spec → plan → implementation cycle

### 特点

- 更像“技能系统 + 执行规范”
- 强调 TDD、subagent、review、worktree
- 关注“怎么执行好”，不是“怎么管理项目资产”

### 适用场景

- 需要严格执行计划
- 需要分任务 subagent 执行
- 需要高质量 review 和 TDD

---

## 3. spec-first

### 当前支持方式

`spec-first` 当前更偏任务目录驱动：

```text
/spec:start -> /spec:brainstorm -> task directory -> dispatch -> implement/check -> finish-work -> create-pr
```

它的特征是：

- `brainstorm` 产出 `prd.md`
- `plan` 产出 task directory 和上下文文件
- `tasks` 不是独立节点
- `info.md` 不是强制自动产物
- 主执行单元是 task directory，而不是项目级 tasks.md

### 对项目驱动的支持

支持度较弱：

- 有任务层层级
- 有父子任务关系
- 但没有 `spec-kit` 那种项目级 `tasks.md`
- 也没有 `Superpowers` 那种把复杂项目主动拆成多个 sub-project specs 的标准流程

### 适用场景

- 单个任务推进
- 任务目录驱动的开发
- 已有主流程内快速执行

---

## 4. 对比表

| 维度 | spec-kit | Superpowers | spec-first |
|---|---|---|---|
| 是否原生支持项目驱动 | 是 | 部分支持 | 否 / 较弱 |
| 是否有项目级 spec | 是 | 是 | 当前偏 task 级 PRD |
| 是否有独立 tasks 阶段 | 是 | 以 plan 任务为主 | 否 |
| 是否有 plan -> tasks 明确拆分 | 是 | 是（写计划后执行） | 不明显 |
| 是否强调 sub-project 拆分 | 是 | 是 | 有父子 task，但不是主模型 |
| 是否强调 subagent 执行 | 不是核心 | 是 | 部分支持 |
| 是否更接近“大需求 -> 完整规划 -> 执行” | 是 | 中等 | 否 |

---

## 5. 推荐结论

如果你的目标是：

```text
大需求
  -> 完整 PRD
  -> 技术方案
  -> 任务拆分
  -> 逐个执行
```

那么：

- **首选参考 `spec-kit`**：流程最完整，项目驱动最强
- **参考 `Superpowers`**：补足技能驱动、subagent、TDD、review 机制
- **`spec-first` 作为执行系统参考**：适合把流程落到 Claude / hook / task directory 上，但不是项目级规划骨架

## 6. 一句话总结

- `spec-kit`：定流程，偏项目驱动
- `Superpowers`：定技能，偏规范执行
- `spec-first`：定执行，偏单任务推进
