# 06-task skill 优化方案

更新时间：2026-03-15  
审查对象：[`skills/spec-first/06-task`](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task)  
审查方式：全目录逐文件审查，并对照当前实现真理源、初始化模板与现有测试

## 审查范围

本次覆盖以下文档：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md)
- [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md)
- [task-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-checklist.md)

同时对照以下实现侧文件：

- [init.ts](/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts)
- [parser.ts](/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts)
- [trace.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/trace.ts)
- [condition-registry.ts](/Users/kuang/xiaobu/spec-first/src/core/gate-engine/condition-registry.ts)
- [status-mapper.ts](/Users/kuang/xiaobu/spec-first/src/shared/status-mapper.ts)
- [hard-gate.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts)
- [task-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/task-skill-docs.test.ts)
- [plan-artifact-structure.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/plan-artifact-structure.test.ts)

## 文档关系图

```text
                    +----------------------+
                    | 06-task / SKILL.md   |
                    | 主流程 / 规则 / 交接 |
                    +----------+-----------+
                               |
                +--------------+--------------+
                |                             |
                v                             v
      +----------------------+     +----------------------+
      | task-template.md     |     | task-checklist.md    |
      | task_plan 标准结构   |     | 拆解质量自检清单     |
      +----------+-----------+     +----------+-----------+
                 |                              |
                 v                              v
      +----------------------+     +----------------------+
      | init.ts              |     | 人工输出前自检       |
      | 初始 task_plan 模板  |     | 与 review checklist  |
      +----------+-----------+     +----------------------+
                 |
                 v
      +----------------------+     +----------------------+
      | parser.ts            |<--->| status-mapper.ts     |
      | 任务表格字段解析     |     | 状态别名归一         |
      +----------+-----------+     +----------------------+
                 |
                 v
      +----------------------+     +----------------------+
      | trace.ts             |     | condition-registry.ts|
      | C3/C8 追溯校验       |     | 03_plan Gate 条件    |
      +----------------------+     +----------------------+
```

## 总体结论

`06-task` 的问题和 `07-code` 不一样。它不是 reference 太理想化，而是主文档和系统其他模块已经发生了明显漂移。

当前状态可以概括为：

- `task-template.md` 和 [`init.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts) 已经对齐到较新的 `task_plan.md` 结构
- 但 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 仍保留较多旧格式、旧状态集、旧成功标准
- `task-checklist.md` 质量不错，但有少量“被写成硬约束、实际上缺少实现承接”的项

结论收敛为：

- 主文档需要一次结构性收敛
- reference 文档只需要局部校正
- 当前最严重的不是缺内容，而是“同一 skill 内部已经出现双模板、双状态、双口径”

## 高优先级问题

### 1. 主文档的任务表结构已经落后于真实模板

问题：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 里的示例表头仍是：
  - `Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态`
- 但 [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md) 和 [`init.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts) 的真实模板已经是：
  - `Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态`

影响：

- agent 先读主文档时会采用旧表结构
- 生成的 `task_plan.md` 容易缺少“验证命令”列
- 这会直接削弱后续 `/spec-first:code` 的 TDD 输入质量

最佳优化：

- 统一以 [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md) 和 [`init.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts) 为真理源
- 把主文档所有任务表示例、成功标准、字段说明全部改成含“验证命令”的版本

### 2. `03_plan` 的成功标准仍写成 `C3 > 0%`，与当前 Gate 口径冲突

问题：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 当前写的是：
  - `metrics coverage C3 (Task Coverage) > 0%`
- 但 [`condition-registry.ts`](/Users/kuang/xiaobu/spec-first/src/core/gate-engine/condition-registry.ts) 对 `03_plan` 的 Gate 条件是：
  - `G-PLAN-01: C3 = 100%`
- [`trace.ts`](/Users/kuang/xiaobu/spec-first/src/cli/commands/trace.ts) 也以 `C3 < 100%` 视为不完整

影响：

- skill 告诉 agent “有一点 TASK 覆盖就算成功”
- Gate 却要求全部 FR 都有 TASK 映射
- 这是直接的规范冲突

最佳优化：

- 主文档里的成功标准改成：
  - `C3 = 100%`
  - `trace validate` / `matrix check` 通过
- 不再保留 `> 0%` 这类旧口径

### 3. 任务状态枚举在主文档、模板、解析器之间不一致

当前三套口径：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md)
  - `planned | in_progress | complete | verified`
- [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md)
  - `todo | in_progress | blocked | verified | done`
- [`parser.ts`](/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts)
  - 归一到 `pending | in_progress | complete | blocked`
- [`status-mapper.ts`](/Users/kuang/xiaobu/spec-first/src/shared/status-mapper.ts)
  - 还支持 `planned / pending / todo / done / complete / verified` 等大量别名

影响：

- 文档层没有单一 canonical status
- agent 容易在不同文档里选不同状态词
- 后续解析、看板、Gate 虽能做容错，但会放大文档漂移

最佳优化：

- 为 `task_plan.md` 明确一套“文档层 canonical 状态”
- 其他状态词只作为兼容别名写在附录，不再在主示例里混用
- 建议优先和 `init.ts` 当前骨架保持一致

## 中优先级问题

### 4. 主文档仍残留旧命令与旧流程痕迹

现状：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 的步骤类型和示例里仍出现：
  - `npm test auth.test.ts`
  - `curl http://localhost:3000/api/login`
  - `git commit`
- 当前仓库的统一命令体系已经以 `pnpm` 为主

影响：

- 任务规划阶段会把旧命令直接固化进 `task_plan.md`
- 后续执行阶段要么重写命令，要么沿用错误命令

最佳优化：

- 把 task skill 中所有示例命令统一收敛到当前仓库真实命令风格
- 优先写“最小验证命令”，不要在 task 阶段强塞泛化运行命令

### 5. 用户故事与并行标记被写成强规则，但当前实现承接较弱

现状：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 和 [task-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-checklist.md) 强调：
  - `[US#]` 用户故事映射
  - `[P]` 可并行标记
- 但当前解析器 [`parser.ts`](/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts) 并不解析这些字段
- [`hard-gate.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts) 只对 `[P]` 做高风险扫描，不形成完整语义

影响：

- 文档把这两项写成“必须”，但运行时并没有完整结构化消费
- 更像协作约定，而不是强约束

最佳优化：

- 在主文档中把 `[US#]`、`[P]` 重新定位为“推荐标记”
- 除非后续补结构化解析，否则不要继续写成硬门禁

### 6. `task-checklist.md` 有少量“理想化硬约束”

现状：

- 检查清单要求：
  - 所有 DS 都有 TASK 映射
  - 设计中的所有接口和数据模型都有任务
  - 每个 TASK 都必须标记所属用户故事

这些方向本身是对的，但当前系统的强校验真理源主要还是：

- FR -> TASK 的 C3
- TASK 合规率 C8

影响：

- checklist 里部分条目比当前 runtime/Gate 更严格
- 容易让 agent 把“建议项”误当“已被系统强制要求”

最佳优化：

- 把 checklist 拆成：
  - 必查硬约束
  - 推荐增强项
- 用户故事标记、关键路径识别、端到端故事交付这类项放到“推荐增强项”

## 低优先级问题

### 7. 主文档过长，且章节存在重复

主要重复点：

- 粒度原则在“Bite-Sized Task Granularity”“When to Stop and Ask”“Review Checklist”里重复出现
- 中断恢复、Error Log、Decision Log、Operation Types 都属于执行补充信息，但在主文档占比过高

优化建议：

- `SKILL.md` 只保留：
  - 触发条件
  - 真理源
  - 核心流程
  - 字段规范
  - 成功标准
  - 模板引用
- Error/Decision/Operation Types 更适合移到 `references/`

### 8. `last_updated` 和版本信息明显滞后

现状：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 仍是 `version: 1.2.0`
- `last_updated: 2026-03-05`

但仓库里和它相关的模板、初始化骨架、测试结构已经继续演进。

优化建议：

- 下一轮实际修正文档时，同步升级版本
- changelog 要明确记录：
  - 任务表结构对齐
  - C3 口径修正
  - 状态枚举统一

## 逐文件结论

### [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md)

状态：`需要结构性收敛`

优点：

- 任务拆解理念完整
- 背景输入、阶段校验、handoff、中断恢复都考虑到了
- 现有测试关心的背景契约已经写明

问题：

- 旧模板、旧状态、旧 C3 口径仍在
- 主文档比 reference 更旧
- 部分增强性约束写得过硬

结论：

- 这是本轮最需要优先整改的文件

### [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md)

状态：`已基本对齐`

优点：

- 和 [`init.ts`](/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts) 的 skeleton 基本一致
- 已把“验证命令”前置到任务结构中
- 可执行性明显优于主文档里的旧示例

小问题：

- 状态枚举仍与主文档不一致
- 示例验证命令格式还可以再统一到当前仓库最稳的写法

结论：

- 保留为主真理源之一，主文档应向它靠拢

### [task-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-checklist.md)

状态：`可用，但建议分层`

优点：

- 覆盖了完整性、粒度、依赖、验收、可执行性
- 作为人工 review checklist 很有效

问题：

- 少数增强项和当前系统硬门禁混在一起

结论：

- 不需要重写，只需要把“必查”和“增强项”分层

## 推荐整改顺序

### 批次 1

- 重写 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md) 的任务结构、成功标准和状态约定

### 批次 2

- 对齐 [task-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-template.md) 的状态口径和验证命令示例

### 批次 3

- 把 [task-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/references/task-checklist.md) 拆成“硬约束 / 增强项”

### 批次 4

- 迁移主文档中的 Error Log / Decision Log / Operation Types 到新的 reference，压缩主文档长度

## 最终结论

`06-task` 当前不是“不可用”，而是“主文档落后于模板和实现”。  
最优策略不是继续给它加新规则，而是先把以下三件事统一掉：

1. `task_plan.md` 的 canonical 表结构
2. `03_plan` 的成功口径
3. `task_plan.md` 的 canonical 状态集

做完这三件事，`06-task` 的质量会明显上一个台阶，其余优化都属于次级收益。

## 验证建议

建议在真正整改时至少回归：

```bash
pnpm vitest run tests/unit/task-skill-docs.test.ts tests/unit/plan-artifact-structure.test.ts
```

本次审查是只读复审，未修改 skill 文件。  
