# `spec-write-tasks` Skill 任务质量优化技术方案

> 文档角色：`spec-write-tasks` 质量增强方案 / task pack 生成质量改进设计
>
> 日期：`2026-04-26`
>
> 范围：审查 `skills/spec-write-tasks` 的现有 skill 内容，定义提升 task pack / task card 质量的优化方向、结构调整、质量规则、参考文档拆分和落地顺序
>
> 参考基线：[spec-write-tasks 技术方案](./2026-04-26-spec-write-tasks-技术方案.md)

## 1. 结论先行

当前 `spec-write-tasks` 的定位是正确的：它是 `spec-plan` 与 `spec-work` 之间的**可选派生任务编译层**，用于把较大的 settled plan 压缩为更适合执行的 task pack。

但当前 skill 的主要问题是：它已经定义了 task pack 的结构，却还没有充分定义**什么是高质量 task**。

因此，本次优化不应重写工作流，也不应新增 `spec-write-tasks` 这样的 command-backed workflow，而应聚焦三件事：

1. 在 `SKILL.md` 中补强 task 生成流程：先判断 plan 是否 task-ready，再按稳定算法编译 task，最后做质量自检。
2. 在 schema 参考中补强 task card 字段质量标准，而不是只列字段名。
3. 新增独立 `task-quality-guide.md`，集中承载粒度、traceability、done signal、context refs、stop signal 和好坏示例。

最终目标是让 `spec-write-tasks` 不只是“能输出任务列表”，而是稳定输出 `spec-work` 可以直接消费的、低上下文、边界清晰、可验证、可重建的 task pack。

---

## 2. 当前状态评估

### 2.1 已经做对的部分

当前 `skills/spec-write-tasks/SKILL.md` 已经具备几个关键优点：

- 明确 `spec-plan` 是唯一技术方案真相源。
- 明确 task pack 是 derived artifact，不是第二份 plan。
- 保留 plan -> work 与 plan -> tasks -> work 两条路径。
- 强调 `source_plan` 与 `source_plan_hash`，避免 stale tasks 静默执行。
- 已经引入 foundation-first、story-first、unit-first 三类拆分视角。
- 已经要求每个 task card 包含 `context_refs`、`entry_hint`、`done_signal`、`stop_if`。
- 已经把脚本 lint 限定在确定性边界内，避免脚本模拟语义拆分。

这些设计与 `spec-first` 的项目哲学一致：

- Light contract
- Explicit boundaries
- Let the LLM decide
- Deterministic execution belongs to scripts
- Semantic analysis belongs to LLM
- Scripts prepare, LLM decides

因此，本方案不建议推翻现有定位。

### 2.2 当前主要缺口

当前缺口不在“字段是否齐全”，而在“字段如何写才算高质量”。

具体表现为：

| 缺口 | 影响 |
| --- | --- |
| 缺少 task-ready 判断 | plan 信息不足时可能硬拆任务，导致任务脑补 scope |
| 缺少显式编译算法 | 不同 agent 可能按不同口径拆分 task |
| 缺少质量自检清单 | task pack 写完后没有稳定的输出门槛 |
| 缺少 traceability matrix | requirement / unit / task 覆盖关系不够可审查 |
| 缺少 task 粒度标准 | 容易过碎或过大 |
| 缺少 done signal 质量标准 | “完成”可能不可观察、不可验证 |
| 缺少 context refs 质量标准 | 执行者仍需重新读大 plan |
| 缺少 stop_if 质量标准 | 执行阶段可能继续扩 scope |
| 缺少好坏示例 | agent 知道要写哪些字段，但不知道坏味道是什么 |

---

## 3. 优化目标

### 3.1 必须达到

- 提升 task pack 对 `spec-work` 的可消费性。
- 降低大 plan 进入执行阶段时的上下文压力。
- 让每个 task 都能追踪回 plan 中的 requirement、implementation unit、acceptance ref 或来源章节。
- 让每个 task 都有明确的文件边界、测试焦点、完成信号和停止信号。
- 让 task pack 保持派生性，不新增 plan 未声明的范围、验收标准或技术决策。
- 保留小任务直接进入 `spec-work` 的轻路径。

### 3.2 明确不做

- 不新增 `spec-write-tasks` command-backed workflow。
- 不把 `spec-write-tasks` 变成 mandatory stage。
- 不把 task pack 变成进度数据库。
- 不让脚本判断 task 拆得是否合理。
- 不让 task pack 包含 shell 命令流水线、commit 顺序或执行状态。
- 不把 `spec-work` 改成只能消费 task pack。

---

## 4. 推荐目标结构

建议将 `skills/spec-write-tasks` 调整为：

```text
skills/spec-write-tasks/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── task-pack-schema.md
    └── task-quality-guide.md
```

职责划分：

| 文件 | 职责 |
| --- | --- |
| `SKILL.md` | 入口级工作方式、何时用、何时跳过、编译流程、输出前质量自检 |
| `task-pack-schema.md` | task pack 的格式、frontmatter、正文结构、字段定义 |
| `task-quality-guide.md` | task 质量标准、粒度指南、traceability、done signal、stop_if、好坏示例 |
| `agents/openai.yaml` | 宿主展示名、默认 prompt、隐式调用策略 |

---

## 5. `SKILL.md` 优化方案

### 5.1 新增 Task-ready Check

当前 skill 会读取 settled plan 并生成 task pack，但应在生成前先判断 source plan 是否足够 task-ready。

建议新增：

```md
## Task-ready Check

生成 task pack 前，先判断 source plan 是否已经 task-ready。

必须具备：

- 明确的 scope boundaries
- 可追踪的 requirements、acceptance refs 或等价来源
- 足够清楚的 implementation units、story slices 或文件边界
- 可执行的 verification / test scenarios
- 没有未解决的关键产品、架构或 contract 决策

如果 plan 缺少 task 编译所需的信息，不要编造 task。输出缺失项，并建议回到 `spec-plan` 补齐。

只有当缺失项明确属于 implementation-time unknowns 时，才可以继续生成 task pack，并把对应风险写入相关 task 的 `risk_note` 和 `stop_if`。
```

价值：

- 防止 task pack 补脑 plan 没有做的决策。
- 保持 task pack 的派生性。
- 让 `spec-write-tasks` 成为执行压缩器，而不是二次规划器。

### 5.2 新增 Compilation Algorithm

当前 skill 有工作方式和切分原则，但缺少一套明确顺序。建议新增轻量编译算法。

```md
## Compilation Algorithm

1. Extract source anchors
   - 列出 requirements、scope boundaries、implementation units、files、verification、deferred unknowns。

2. Identify foundations
   - 找出共享 schema、contract、adapter、fixture、test helper、CLI surface。

3. Identify executable slices
   - 判断每个 unit 应保持为一个 task、拆成多个 story tasks，或与相邻 unit 合并。

4. Build dependency graph
   - 只记录真实产出依赖，不用 dependencies 表达偏好的顺序。

5. Assign waves
   - 同 wave 内避免共享文件；共享文件必须串行化或标注 overlap。

6. Write task cards
   - 每个 task 写清 goal、files、context_refs、test_focus、done_signal、stop_if。

7. Run quality pass
   - 检查 traceability、scope、granularity、dependency、verification 和 consumption readiness。
```

关键点：

- 这是 LLM 的语义工作流程，不是脚本状态机。
- 它约束分析顺序，不硬编码拆分结果。
- 它能让不同 agent 生成 task pack 时保持口径稳定。

### 5.3 新增 Quality Pass Before Output

建议在输出要求前增加强制自检：

```md
## Quality Pass Before Output

输出 task pack 前必须自检：

- 每个 task 都能追踪到 source unit、requirement 或 plan section
- 每个 requirement 都被至少一个 task 覆盖，除非它是 non-goal
- 没有 task 新增 plan 未声明 scope
- 没有 task 把 deferred/non-goal 变成目标
- 没有 task 大到需要内部再拆
- 没有 task 小到不能独立验证
- dependencies 表示真实依赖，不是人为排序
- 同 wave task 不存在未标注 file overlap
- 每个 task 有具体 test_focus 和可观察 done_signal
- 每个 task 有能阻止 scope creep 的 stop_if
```

这一步是提升 task 质量的核心。它不需要脚本执行，也不需要新状态机，只是要求 LLM 在生成前做一次结构化审查。

### 5.4 调整输出结构

当前输出结构是：

```md
- Overview
- Task Graph
- Execution Waves
- Task Cards
- Validation Notes
- Regeneration Rules
```

建议调整为：

```md
- Overview
- Source Summary
- Traceability Matrix
- Task Graph
- Execution Waves
- Task Cards
- Validation Notes
- Regeneration Rules
```

新增两个部分：

| 部分 | 价值 |
| --- | --- |
| `Source Summary` | 用很短篇幅记录 task pack 从 plan 中消费了哪些 source anchors |
| `Traceability Matrix` | 明确 requirement / source unit / task / validation 的覆盖关系 |

注意：`Source Summary` 不能复述 plan，只能摘要 task pack 用到的锚点。

---

## 6. `task-pack-schema.md` 优化方案

### 6.1 增加 Traceability Matrix 结构

建议在 schema 中新增：

```md
## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1 | R1, AE1 | T001, T002 | unit tests + smoke path |
```

规则：

- 每个 source unit 或 requirement 至少应出现一次。
- 如果某个 requirement 不产生 task，需要说明它是 non-goal、already satisfied，还是 deferred。
- Validation 只写验证焦点，不写 shell 命令流水线。

### 6.2 强化 Task Card 字段质量

当前 schema 已列出字段。建议补充每个关键字段的质量判断。

#### `goal`

好的 goal：

- 一句话描述可交付结果。
- 不混合无关目标。
- 不写成执行步骤。

坏味道：

- “更新相关文件”
- “实现所有逻辑”
- “处理剩余工作”

#### `files`

好的 files：

- 使用 repo-relative path。
- 尽量收敛到 task 允许触达的文件集合。
- 对新增文件可写预期路径或目录。

坏味道：

- `src/**`
- `所有相关文件`
- 绝对路径

#### `context_refs`

好的 context_refs：

- 指向 task 必读的 plan 章节、contract、research、代码模式或 schema。
- 数量少而准。
- 能让执行者少读无关上下文。

坏味道：

- 只写整份 plan。
- 塞入所有参考文件。
- 引用与 task 无关的背景材料。

#### `done_signal`

好的 done_signal：

- 可被测试、diff、CLI 输出、文档结构或 review 明确观察。
- 与 task 的目标一一对应。
- 不依赖主观判断。

坏味道：

- “代码写完”
- “看起来正常”
- “逻辑完善”

#### `stop_if`

好的 stop_if：

- 明确触发停止的越界条件。
- 与 plan scope boundary 相关。
- 能阻止执行阶段扩 scope。

坏味道：

- “遇到问题就停”
- “如果不确定”
- 空泛地说“scope 变化”

### 6.3 增加粒度指南

建议新增：

```md
## Granularity Guide

一个 task 通常应该满足：

- 可以在不理解整份 plan 的情况下起手
- 主要触达一组相关文件
- 有一个主验证目标
- 完成后能解除某个依赖或交付一个独立 slice
- 不需要在 task 内部再创建 5 个以上子任务才能执行

应该拆分：

- 同时触达多个不相关模块
- 同时修改 contract、implementation、docs、tests 且不能形成一个小闭环
- 有多个独立验证点
- 一部分可以并行，一部分必须串行

应该合并：

- 拆开后每个 task 都太小，无法独立验证
- 同一文件上的连续小改动
- 实现和对应测试构成一个自然闭环
```

---

## 7. 新增 `task-quality-guide.md`

### 7.1 新增原因

`SKILL.md` 应保持入口简洁，`task-pack-schema.md` 应保持 schema 清晰。详细的质量判断、坏味道和示例如果全部塞进这两个文件，会让主 skill 过重。

因此建议新增：

```text
skills/spec-write-tasks/references/task-quality-guide.md
```

### 7.2 建议内容结构

```md
# Task Quality Guide

## 1. Quality Bar

## 2. Task-ready Source Plan

## 3. Traceability Rules

## 4. Granularity Rules

## 5. Dependency and Wave Rules

## 6. Context Compression Rules

## 7. Done Signal Rules

## 8. Stop Signal Rules

## 9. Bad Smells

## 10. Examples
```

### 7.3 Quality Bar

建议定义：

```md
A task is high quality when an executor can:

1. understand why it exists,
2. know exactly which source plan anchors it derives from,
3. identify the files it is allowed to touch,
4. verify completion without inventing new acceptance criteria,
5. know when to stop instead of expanding scope.
```

中文说明可写为：

高质量 task 的判断标准不是“字段填满”，而是执行者能否在低上下文下安全起手，并在不扩 scope 的前提下完成一个可验证闭环。

### 7.4 Bad Smells

建议列出：

| Bad smell | 为什么危险 | 修正方式 |
| --- | --- | --- |
| Task 复述 plan 段落 | 没有压缩上下文 | 改成 source anchor + execution slice |
| Task goal 包含多个无关动词 | 粒度过大 | 按验证点或文件边界拆分 |
| dependencies 表示“我想先做” | 伪依赖会降低并行性 | 只保留真实产出依赖 |
| files 使用宽泛 glob | 执行边界失效 | 收敛到具体路径或目录 |
| done_signal 主观 | 无法验收 | 改成测试、diff、CLI、文档结构或 review signal |
| stop_if 空泛 | 无法阻止 scope creep | 写具体越界条件 |
| context_refs 过多 | 没有压缩上下文 | 只保留 task 必读材料 |

### 7.5 好坏示例

#### 好示例

```md
- T002
  source_unit: U2
  goal: 让 `spec-work` 在输入 task pack path 时优先读取 Task Graph 和 Execution Waves
  dependencies: [T001]
  files:
    - skills/spec-work/SKILL.md
    - skills/spec-work-beta/SKILL.md
  requirement_refs:
    - R3
  context_refs:
    - docs/plans/example-plan.md#Implementation-Units
    - docs/tasks/example-tasks.md#Execution-Waves
  entry_hint: 先对照 `spec-work` 的 Phase 1 输入分类和 task pack 分支
  test_focus: task pack path 被识别为 work document，且不会绕过执行期代码读取
  done_signal: `spec-work` 文档明确 task pack 优先消费规则，并保留 plan fallback
  parallelizable: false
  risk_note: 如果把 task pack 写成唯一入口，会破坏小任务直达路径
  stop_if: 需要新增 `spec-write-tasks` 命令或移除 plan direct-to-work 路径
  wave: 2
```

为什么好：

- goal 是一个可交付行为。
- files 边界清楚。
- done_signal 可 review。
- stop_if 能保护架构边界。
- 没有写成 shell 步骤。

#### 坏示例

```md
- T002
  goal: 完善 spec-work 支持 tasks
  dependencies: []
  files:
    - skills/**
  context_refs:
    - docs/plans/example-plan.md
  test_focus: 测试相关逻辑
  done_signal: 功能正常
  stop_if: 遇到问题
```

为什么坏：

- goal 太泛。
- files 边界过宽。
- context_refs 没有压缩。
- test_focus 不可执行。
- done_signal 不可观察。
- stop_if 无法阻止越界。

---

## 8. `agents/openai.yaml` 优化方案

当前默认 prompt：

```yaml
default_prompt: "Use the spec-write-tasks standalone skill to split a settled plan into a derived task pack for spec-work."
```

建议改为：

```yaml
interface:
  display_name: "Write Tasks"
  short_description: "Compile settled plans into optional derived task packs for spec-work."
  default_prompt: "Use the spec-write-tasks standalone skill to split a settled plan into a derived task pack for spec-work when the plan is large, dependency-heavy, or benefits from explicit execution waves."

policy:
  allow_implicit_invocation: true
```

理由：

- `spec-work` 容易被误解为变量或旧式入口。
- Claude workflow 入口应是 `spec-work`。
- `spec-write-tasks` 是 standalone skill，不是 command-backed workflow。
- 默认 prompt 应强调 optional、large plan、dependency-heavy、execution waves，而不是暗示所有 plan 都要拆 tasks。

---

## 9. 与 `spec-plan` / `spec-work` 的关系

### 9.1 与 `spec-plan`

`spec-plan` 负责做技术决策，`spec-write-tasks` 只负责任务编译。

如果在 task-ready check 中发现：

- scope boundary 不清楚
- requirement 不可追踪
- verification 缺失
- implementation units 缺少可执行边界
- 仍有关键架构或 product blocker

正确动作是回到 `spec-plan` 补齐，而不是在 task pack 中补脑。

### 9.2 与 `spec-work`

`spec-work` 消费 task pack 时，task pack 应提供：

- 更低上下文的执行切片
- 明确 waves
- 明确 task dependencies
- 明确 files
- 明确 verification focus
- 明确 stop signals

但 `spec-work` 仍然必须读取相关代码、发现测试、识别执行期事实。task pack 不是替代执行判断的脚本。

---

## 10. 落地顺序

### P1：文档与 prompt 质量补强

修改：

- `skills/spec-write-tasks/SKILL.md`
- `skills/spec-write-tasks/references/task-pack-schema.md`
- `skills/spec-write-tasks/agents/openai.yaml`

新增：

- `skills/spec-write-tasks/references/task-quality-guide.md`

目标：

- 明确 task-ready check。
- 明确 compilation algorithm。
- 明确 quality pass。
- 明确字段质量标准。
- 修正 `spec-work` 口径。

### P2：生成质量验证

通过真实 plan 试生成 task pack，检查：

- requirement 是否全部覆盖。
- task 是否没有新增 scope。
- context refs 是否明显少于原 plan。
- waves 是否真实反映依赖和文件 overlap。
- done_signal 是否可观察。
- stop_if 是否具体。

### P3：确定性 lint 增强

后续可以再补脚本，但只做确定性检查：

- frontmatter 字段完整。
- `source_plan` 存在。
- `source_plan_hash` 格式正确。
- `task_id` 唯一。
- dependencies 指向存在 task。
- files 使用 repo-relative path。
- 同 wave file overlap 被标注或降级。

不做语义 lint，不判断 task 是否拆得合理。

---

## 11. 验证建议

本次如果只落地文档与 skill prompt，建议验证：

```bash
npm run lint:skill-entrypoints
```

如果修改了 task pack schema 或 `spec-work` 消费文案，建议补充：

```bash
npm run test:unit
```

若只是新增本技术方案文档，则主要验证是：

- 文档路径正确。
- `CHANGELOG.md` 已同步记录。
- 文档不引入与 `docs/10-prompt/项目角色.md` 冲突的强状态机、强 gate、第二真相源叙述。

---

## 12. 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 质量规则过多导致 skill 变重 | 入口难读，调用成本上升 | 把详细规则放入 `task-quality-guide.md` |
| Task-ready check 变成审批 gate | 违背 optional derived layer 定位 | 只用于判断是否可安全编译，不阻止 plan -> work |
| Compilation algorithm 被理解成脚本状态机 | 违背 LLM 决策边界 | 明确它是语义分析顺序，不是 deterministic automation |
| Traceability matrix 复述 plan | 上下文没有下降 | 只记录 source -> task -> validation 映射 |
| done_signal 被写成测试命令清单 | task pack 变执行脚本 | 只写可观察完成信号，不写 shell choreography |
| stop_if 过度泛化 | 无法阻止 scope creep | 要求写具体越界条件 |
| 新增 guide 后与 schema 重复 | 双处维护成本 | schema 写字段定义，guide 写质量判断和示例 |

---

## 13. 最终建议

建议按以下顺序实施：

1. 在 `SKILL.md` 增加 `Task-ready Check`、`Compilation Algorithm`、`Quality Pass Before Output`。
2. 在 `task-pack-schema.md` 增加 `Traceability Matrix`、字段质量标准和粒度指南入口。
3. 新增 `task-quality-guide.md`，承载详细质量规则、坏味道和好坏示例。
4. 修改 `agents/openai.yaml`，把 `spec-work` 改成 `spec-work`，并强调 large / dependency-heavy / execution waves 触发条件。
5. 用一个真实大 plan 试生成 task pack，人工 review task pack 是否降低上下文、保持派生性、覆盖 requirements、具备可验证 done signals。

这条路线能在不改变主链路、不新增强状态、不扩展执行器职责的前提下，显著提升 `spec-write-tasks` 创建 task 的质量。
