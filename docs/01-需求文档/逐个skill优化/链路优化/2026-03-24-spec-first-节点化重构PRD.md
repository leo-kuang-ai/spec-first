# spec-first 节点化重构 PRD

> 日期：2026-03-24
>
> 状态：Draft
>
> 目标：将当前 `spec-first` 从“ID + matrix + gate 驱动的强治理流程”重构为“8+2 节点状态机 + skill 本地闭环 + orchestrate 轻量准入”的弱耦合流程系统。

---

## 1. 背景

当前 `spec-first` 的流程能力建立在以下几组机制之上：

- 阶段状态机：`00_init -> 07_release -> 08_done / 09_cancelled`
- Gate 体系：`precondition / stage-gate / hard-gate / release-gate / confirm-policy`
- 文档关联：`document-links.yaml`
- ID 体系：`Feature / REQ / FR / DS / TASK / TC / RFC ...`
- 关联矩阵与 trace 投影
- Skill 阶段准入与阶段推进强绑定

该设计在“强治理、强追踪、强流程控制”场景下有一定完整性，但当前项目仍处于开发期，产品目标已经发生变化：

- 不再追求全链路 traceability
- 不再追求通过 gate 体系强约束各阶段流转
- 更强调各 skill 的独立可用性、功能内聚和自主闭环
- 更强调流程节点进度记录，而不是 ID 关系治理

因此，当前系统的复杂度和维护成本已经偏离目标，形成明显的设计负担。

---

## 2. 当前问题

### 2.1 设计重心偏离

当前实现把大量精力投入在以下能力：

- 文档之间的显式引用关系
- 不同产物中的 ID 关联
- trace 矩阵和投影
- gate 层级与命名治理
- skill 的阶段准入与强阻断

这些能力解决的是“流程治理问题”，而不是“节点工作完成问题”。

### 2.2 Skill 无法真正独立使用

当前 skill 的运行被这些条件影响：

- 当前阶段必须匹配
- 上游文档必须存在
- 某些 gate 条件必须通过
- 某些文档引用和 trace 关系必须完整

结果是：

- skill 更像流程节点执行器，而不是独立能力模块
- 用户无法轻量地单独调用某个 skill 来补写、修订、重做某一阶段产物
- 编排与执行耦合过深

### 2.3 文档被 ID 和治理语义污染

当前文档产物包含过多流程治理痕迹，例如：

- REQ / FR / DS / TASK / TC 等产物 ID
- 文档间显式关联关系
- 过程中的矩阵、trace、coverage 语义
- 为 gate 服务的结构性字段

结果是：

- 文档更像控制面输入，而不是对人可读的交付物
- 用户维护成本高
- 文档结构受 runtime 约束，而不是受业务表达需要约束

### 2.4 流程推进成本过高

当前从一个阶段进入下一个阶段需要综合判断：

- 依赖检查
- gate 检查
- trace 覆盖
- 文档引用
- 历史状态
- 豁免、告警、例外

这使“推进一个节点”变成了“通过一套治理系统”，不符合当前项目阶段需要。

---

## 3. 产品目标

本次重构的目标是：

1. 去掉全流程文档中的 ID 关联
2. 去掉产物 ID
3. 去掉流程之间的 gate
4. 去掉各阶段文档产物中的 ID 关系
5. 去掉过程中的 ID 关联矩阵
6. 保留需求执行 `8+2` 流程
7. 保留节点进度记录、节点完成记录和节点流转
8. 使各个 skill 能够独立使用
9. 把跨节点控制收敛到 orchestrate 的轻量准入检查
10. 把每个节点的完成标准收敛到 skill 自己的 checklist

---

## 4. 非目标

本次重构明确不做以下事情：

- 不做向下兼容
- 不保留旧版 ID / matrix / gate 模型
- 不继续维护 `document-links.yaml` 这类显式关联机制
- 不保留 traceability 作为核心产品能力
- 不保留“gate pass 才能 advance”的推进语义
- 不尝试同时兼容旧文档和新文档格式

---

## 5. 设计原则

### 5.1 Skill 功能内聚

每个 skill 只对自己的节点负责，不对全流程治理负责。

### 5.2 文档以人读为主

文档首先服务于表达、协作和交付，不再优先服务于 runtime 的追踪与治理。

### 5.3 状态机只负责流转

状态机只定义合法顺序，不定义质量门禁。

### 5.4 编排只做轻量准入

orchestrate 只判断“能否进入下一节点”，不做复杂治理裁决。

### 5.5 节点完成由 skill 自证

每个节点是否完成，由该节点 skill 的本地 checklist 决定。

### 5.6 不再以 ID 作为流程骨架

新流程骨架应是：

- 节点
- 文档
- 状态
- 摘要

而不是：

- ID
- 引用图
- matrix
- gate taxonomy

---

## 6. 目标流程模型

### 6.1 保留 8+2 节点流转

保留以下流程节点：

- `00_init`
- `01_specify`
- `02_design`
- `03_plan`
- `04_implement`
- `05_verify`
- `06_wrap_up`
- `07_release`
- `08_done`
- `09_cancelled`

其中：

- `00_init` 到 `07_release` 为 8 个主节点
- `08_done` 和 `09_cancelled` 为 2 个终态节点

### 6.2 新流转语义

旧语义：

- `gate pass -> stage advance`

新语义：

- `node checklist complete -> transition allowed`

也就是说，节点推进的核心判断从“是否通过 gate”改为“本节点是否完成”。

### 6.3 Skill 与流程解耦

新模型下：

- skill 可以单独运行
- skill 可以用于创建、补写、修订、重做某节点内容
- skill 不再被跨阶段 gate 强阻断
- flow 模式下的推进检查由 orchestrate 负责

---

## 7. 目标职责分层

## 7.1 第一层：Skill 本节点闭环

每个 skill 负责：

1. 读取本节点最小输入
2. 生成或更新本节点产物
3. 执行本节点 checklist
4. 写入本节点摘要
5. 更新本节点状态

### 7.1.1 Skill Checklist 的边界

skill checklist 只检查本节点内部事实，例如：

- 文档存在
- 文档非空
- 必要章节齐全
- 内容达到本节点最小完成标准
- 本节点摘要已生成
- 本节点状态可以标记为 `done`

skill checklist 不再检查：

- 上游下游 ID 对齐
- FR / DS / TASK / TC trace
- matrix 完整性
- 文档显式引用关系
- 跨节点依赖关系
- 全局 gate 是否通过

### 7.1.2 Skill 独立运行要求

每个 skill 应支持以下两种模式：

- `flow mode`：在编排链路中执行
- `standalone mode`：独立调用，用于补写、修订、重做

在 standalone mode 下：

- 不要求当前节点一定是主流程当前节点
- 不要求全流程前置条件完整
- 只要求该 skill 的最小输入存在

### 7.1.3 Skill Checklist 结果模型

建议将 skill 完成检查建模为独立结果，而不是 gate 结果：

```ts
interface SkillChecklistResult {
  skillName: string;
  stage: Stage;
  checks: ChecklistItem[];
  overallStatus: 'complete' | 'partial' | 'empty';
  canMarkDone: boolean;
}

interface ChecklistItem {
  id: string;
  description: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
}
```

这里的语义是：

- `complete`：本节点 checklist 已达到完成标准
- `partial`：已有有效产出，但尚未达到完成标准
- `empty`：尚未形成有效本节点产物
- `canMarkDone=true`：运行后允许把本节点状态更新为 `done`

### 7.1.4 Skill Checklist 的执行方式

Skill 的执行流程应改成：

1. 加载 skill，不做阶段硬阻断
2. 注入本节点运行时上下文
3. 执行 skill 产出或修订动作
4. 执行完成后运行 checklist 评估
5. 将 checklist 摘要写入运行态，并输出建议状态

这意味着：

- 即使 `spec.md` 不存在，`spec` skill 也应能运行，因为它本身就可能是创建入口
- 即使当前不在该节点，standalone mode 也应允许用户补写或修订该节点文档
- skill 负责回答“本节点完成得怎么样”，而不是“当前是否允许进入这个节点”
- checklist 的执行者是 skill runtime
- checklist 结果写入运行态摘要，不写入文档正文
- skill 可以输出 `suggestedStatus`，但不直接决定主流程状态

### 7.1.5 Skill Checklist 示例

例如 `01_specify` 节点可以定义如下 checklist：

```ts
const SPEC_CHECKLIST = {
  requiredChecks: [
    { id: 'spec.md-exists', description: 'spec.md 文件存在' },
    { id: 'spec.md-non-empty', description: 'spec.md 非空（>100字符）' },
    { id: 'spec.md-has-background', description: '包含背景章节' },
    { id: 'spec.md-has-goals', description: '包含目标章节' },
    { id: 'spec.md-has-scope', description: '包含范围章节' },
  ],
  optionalChecks: [
    { id: 'spec.md-has-personas', description: '包含用户画像' },
    { id: 'spec.md-has-scenarios', description: '包含关键场景' },
  ],
};
```

类似地，后续每个阶段都应有自己的最小 checklist 定义，供 skill 在运行后做自评估。

### 7.1.6 各阶段 Checklist 基线

为避免每个 skill 各自发明“完成标准”，P0 需要明确 `00_init ~ 07_release` 的最小 checklist 基线。

建议定义如下：

```ts
const STAGE_CHECKLISTS: Record<Stage, ChecklistDefinition> = {
  '00_init': {
    requiredChecks: [
      { id: 'feature-dir-exists', description: 'feature 目录存在' },
      { id: 'runtime-state-initialized', description: '运行态状态已初始化' },
      { id: 'base-docs-created', description: '基础文档骨架已创建' },
    ],
  },
  '01_specify': {
    requiredChecks: [
      { id: 'spec-md-exists', description: 'spec.md 文件存在' },
      { id: 'spec-md-non-empty', description: 'spec.md 非空' },
      { id: 'spec-has-background', description: '包含背景' },
      { id: 'spec-has-goals', description: '包含目标' },
      { id: 'spec-has-scope', description: '包含范围' },
    ],
  },
  '02_design': {
    requiredChecks: [
      { id: 'design-md-exists', description: 'design.md 文件存在' },
      { id: 'design-md-non-empty', description: 'design.md 非空' },
      { id: 'design-has-architecture', description: '包含方案结构' },
      { id: 'design-has-dataflow', description: '包含数据流或交互流' },
      { id: 'design-has-risks', description: '包含风险与权衡' },
    ],
  },
  '03_plan': {
    requiredChecks: [
      { id: 'task-plan-exists', description: 'task_plan.md 文件存在' },
      { id: 'task-overview-table-exists', description: '包含汇总任务表格' },
      { id: 'task-statuses-valid', description: '任务状态字段合法' },
      { id: 'plan-has-sequencing', description: '包含执行顺序或任务分组说明' },
    ],
  },
  '04_implement': {
    requiredChecks: [
      { id: 'task-progress-updated', description: 'task_plan.md 中至少一个任务状态已更新' },
      { id: 'findings-has-impl-notes', description: 'findings.md 包含实现说明段' },
    ],
  },
  '05_verify': {
    requiredChecks: [
      { id: 'verify-md-exists', description: 'verify.md 文件存在' },
      { id: 'verify-has-scope', description: '包含验证范围' },
      { id: 'verify-has-method', description: '包含验证方法' },
      { id: 'verify-has-result', description: '包含验证结果' },
      { id: 'verify-has-risks', description: '包含未覆盖风险' },
    ],
  },
  '06_wrap_up': {
    requiredChecks: [
      { id: 'wrap-up-md-exists', description: 'wrap_up.md 文件存在' },
      { id: 'wrap-up-has-summary', description: '包含最终交付摘要' },
      { id: 'wrap-up-has-open-issues', description: '包含剩余问题' },
      { id: 'wrap-up-has-next-steps', description: '包含后续建议' },
    ],
  },
  '07_release': {
    requiredChecks: [
      { id: 'release-md-exists', description: 'release.md 文件存在' },
      { id: 'release-has-content', description: '包含发布内容' },
      { id: 'release-has-risks', description: '包含风险说明' },
      { id: 'release-has-decision', description: '包含发布结论' },
    ],
  },
};
```

约束如下：

- 这些 checklist 只定义最小完成标准
- 不引入质量深审
- 不引入跨阶段 trace
- 不引入 gate 概念

## 7.2 第二层：Orchestrate 轻量准入

orchestrate 负责：

1. 判断当前节点
2. 决定下一节点
3. 执行跨节点 readiness-check
4. 在可推进时触发 transition

### 7.2.1 Readiness-Check 的定义

readiness-check 只回答一个问题：

> 当前是否适合进入下一个节点？

它只检查以下内容：

- 上一个节点是否已完成
- 目标节点所需最小产物是否存在
- 当前是否已有活跃中的节点工作
- 当前 feature 是否处于终态

### 7.2.2 Readiness-Check 不做什么

它不做：

- 深度质量评审
- 文档全文语义交叉校验
- ID / matrix / trace 检查
- gate 结果计算
- 持久化 gate-history

### 7.2.3 编排与 Skill 的关系

编排 Agent 约束流程推进，但不限制 skill 独立使用。

具体表现为：

- 用户可以独立调用某个 skill 修复节点内容
- 只有当用户走 orchestrate / transition 时，才进行 readiness-check

### 7.2.4 Readiness-Check 结果模型

建议将编排层准入检查建模为独立结果：

```ts
interface ReadinessCheckResult {
  decision: 'READY_TO_WORK' | 'READY_TO_ADVANCE' | 'BLOCKED';
  currentStage: Stage;
  targetStage: Stage;
  checks: {
    previousNodeComplete: boolean;
    requiredArtifactsExist: boolean;
    noActiveWork: boolean;
    notTerminal: boolean;
    warnings: string[];
  };
}
```

这一定义强调：

- readiness-check 只服务于编排层
- 它判断的是“能否推进”
- 它不判断“skill 能否运行”
- `decision` 是最终决策真相源，布尔检查项只是决策依据
- `targetStage` 语义固定如下：
  - `READY_TO_WORK`：等于 `currentStage`
  - `READY_TO_ADVANCE`：等于下一节点
  - `BLOCKED`：等于期望推进的目标节点

### 7.2.5 Readiness-Check 的最小产物要求

为避免实现歧义，应为每个目标节点定义固定的最小产物要求：

```ts
const STAGE_ARTIFACT_REQUIREMENTS: Record<Stage, string[]> = {
  '01_specify': [],
  '02_design': ['spec.md'],
  '03_plan': ['spec.md', 'design.md'],
  '04_implement': ['spec.md', 'design.md', 'task_plan.md'],
  '05_verify': ['spec.md', 'design.md', 'task_plan.md'],
  '06_wrap_up': ['spec.md', 'design.md', 'task_plan.md', 'verify.md'],
  '07_release': ['spec.md', 'design.md', 'task_plan.md', 'verify.md', 'wrap_up.md'],
  '08_done': [],
  '09_cancelled': [],
};
```

该表的作用是：

- 作为 orchestrate 判断是否可推进的唯一产物依据
- 替代旧的 document-links / gate / trace 推进条件
- 给实现和测试提供稳定契约

### 7.2.6 编排层的决策输出

建议编排层输出以下三类决策，而不是返回复杂 gate 状态：

- `READY_TO_WORK`
- `READY_TO_ADVANCE`
- `BLOCKED`

其中：

- `READY_TO_WORK`：允许在当前节点继续工作
- `READY_TO_ADVANCE`：允许推进到下一节点
- `BLOCKED`：列出阻塞原因，提示先补齐缺失项

## 7.3 第三层：Safety Guard

安全机制必须与流程治理彻底分离。

当前 `hard-gate.ts` 混合了三类职责：

- 阶段匹配检查
- 产物存在检查
- 安全机制检查

重构后应拆分为：

- 阶段匹配和跨节点推进检查：归入 orchestrate readiness-check
- 节点产物完成检查：归入 skill checklist
- 安全机制：独立抽出为 `Safety Guard`

### 7.3.1 Safety Guard 的职责

Safety Guard 只负责识别风险并输出警告或建议，不再承担阶段阻断职责。

建议模型如下：

```ts
interface SafetyAssessment {
  level: 'safe' | 'warning' | 'dangerous';
  signals: string[];
  recommendedActions?: string[];
}
```

### 7.3.2 Safety Guard 的检查范围

Safety Guard 可保留并继续演进以下能力：

- 保护分支检测
- Worktree First 建议
- 高风险改动识别
- 核心模块改动提醒
- 未提交变更提醒

例如：

- 当前在保护分支
- 涉及核心模块
- 跨多个目录的大范围修改
- 存在未提交变更

### 7.3.3 Safety Guard 的输出方式

Safety Guard 在 skill 加载时注入 notice，不抛出流程阻断异常。

也就是说：

- 它可以提示用户“当前操作风险较高”
- 它可以建议使用 worktree
- 它可以建议用户考虑使用 worktree 或显式标记 `[WORKTREE-CONFIRMED]`
- 但用户可以选择忽略并继续执行
- 但它不再承担“因为阶段不匹配而禁止 skill 运行”的职责

这一定义要与流程 gate 明确切开，避免安全保护再次演化为流程治理。

### 7.3.4 Safety Guard 检查项清单

P0.5 建议固定以下检查项：

```ts
const SAFETY_CHECKS = [
  'protected-branch',
  'high-risk-changes',
  'core-module-changes',
  'uncommitted-changes',
];
```

说明：

- `concurrent-work` 不放入 Safety Guard
- 并发冲突属于 orchestrate readiness-check 的 warning 范畴
- Safety Guard 只负责操作风险，不负责流程协调

---

## 8. 目标状态模型

## 8.1 需要保留的状态能力

系统仍需要记录：

- 当前节点
- 各节点状态
- 节点开始时间
- 节点完成时间
- 节点摘要
- 当前活跃节点
- 下一节点建议

## 8.2 建议状态结构

建议将状态模型收敛为节点进度模型，而不是 gate 模型。

建议每个节点只保留以下 canonical 状态：

- `todo`
- `in_progress`
- `done`
- `blocked`
- `skipped`

建议 Feature 级保留：

- `currentStage`
- `terminal`
- `updatedAt`

### 8.2.1 运行态单一真相源

节点状态的单一真相源应为运行态状态文件，而不是文档正文。

因此：

- `currentStage`、节点状态、终态标记只存运行态
- 文档正文只保留面向人的摘要和说明
- `task_plan.md` 中不再重复写 `stage_status`
- `status / orchestrate / transition` 一律以运行态为准

### 8.2.2 节点状态定义

| 状态 | 含义 |
|---|---|
| `todo` | 尚未开始 |
| `in_progress` | 当前正在处理 |
| `done` | 本节点 checklist 已完成 |
| `blocked` | 节点执行被业务或环境问题阻塞 |
| `skipped` | 节点被显式跳过 |

### 8.2.3 状态结构 Schema

P0 需要明确运行态 Schema，避免各模块读写不同结构。

建议定义：

```ts
interface NodeState {
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  checklistStatus?: 'complete' | 'partial' | 'empty';
  canMarkDone?: boolean;
}

interface FeatureState {
  featureId: string;
  currentStage: Stage;
  terminal: boolean;
  nodes: Partial<Record<Stage, NodeState>>;
  createdAt: string;
  updatedAt: string;
}
```

约束：

- 运行态只保留必要摘要，不内嵌完整大对象
- `summary` 是节点级摘要
- `checklistStatus` 与 `canMarkDone` 用于支撑 skill runtime 和 orchestrate
- Feature 级摘要通过 `nodes[currentStage]?.summary` 派生，不单独存储

### 8.2.4 不再保留的治理状态

不再需要这些状态语义：

- `awaiting_review`
- `review_failed`
- `ready_to_advance`
- `advanced`
- 基于 gate 的阻断状态

### 8.2.5 节点状态与流转规则

为避免 stage machine、orchestrate、skill 各自解释状态，需明确以下规则：

1. `done` 才表示该节点已经完成，可作为主链推进依据
2. `skipped` 表示该节点被显式跳过，但是否允许推进必须由 orchestrate 明确决策
3. `blocked` 不允许自动推进，必须先解除阻塞或显式取消
4. `in_progress` 表示当前节点正在处理，不等同于可推进
5. `todo` 表示尚未开始，不可作为上游已完成依据

进一步约束：

- `currentStage` 的推进只能由 `transition` 或 orchestrate 驱动
- standalone mode 下运行 skill，不自动推进 `currentStage`
- standalone mode 可以更新节点文档和 checklist 结果，但不直接改变主流程顺序
- standalone mode 不能把非 `currentStage` 的节点正式写为 `done`
- 只有在 flow mode 且 readiness-check 通过后，才能把 `currentStage` 移动到下一节点

### 8.2.6 `skipped` 的使用边界

`skipped` 不是默认主路径状态，只能在以下场景使用：

- 某节点被产品或项目策略显式豁免
- 某节点当前不适用
- 用户明确确认跳过该节点

因此：

- `skipped` 不能被普通 skill 自动写入
- `skipped` 必须由 orchestrate 或显式 transition 写入
- orchestrate 必须记录跳过原因摘要

### 8.2.7 `09_cancelled` 规则

`09_cancelled` 需要作为明确终态定义，而不是隐含行为。

规则如下：

- 任何非终态节点都可以取消
- 取消只能通过 orchestrate 或显式 transition 执行
- 取消必须记录原因摘要
- 取消后 `terminal=true`
- 取消后不再允许 flow 模式推进
- 取消后仍允许 standalone mode 读取或修订文档，但不恢复主流程

### 8.2.8 状态更新责任

状态写入职责应固定为：

- skill：更新本节点 `checklistStatus`、`canMarkDone`、节点摘要，并输出 `suggestedStatus`
- orchestrate：更新 `nodes[stage].status`、`currentStage`、执行 transition、写入节点推进记录
- status：只读取和展示，不修改状态

这样可以避免“skill 一边独立运行，一边偷偷推进主流程”的隐式行为。

### 8.2.9 两层进度视图

系统需要明确区分两类进度：

1. 节点级进度
2. 文档内部任务级进度

其中：

- 节点级进度：表示 `03_plan` 这个阶段本身是否处于 `todo / in_progress / done / blocked / skipped`
- 文档内部任务级进度：表示 `task_plan.md` 中每个任务条目的执行状态

两者关系是：

- 节点级进度是主流程状态
- 任务级进度是节点内部执行视图
- 任务级进度可以变化多次
- 节点级进度只在 checklist 达成时才进入 `done`

例如：

- `03_plan` 节点可以是 `in_progress`
- 同时 `task_plan.md` 内部已有部分任务是 `done`
- 只有当 `03_plan` 的 checklist 达成时，节点级状态才会更新为 `done`

### 8.2.10 `blocked` 状态解除规则

`blocked` 表示节点工作被业务、环境或依赖问题中断，不等同于节点完成。

需要区分两层 `blocked`：

- 任务级 `blocked`：写在 `task_plan.md` 的任务表格中，表示某个任务条目被阻塞
- 节点级 `blocked`：写在运行态 `NodeState.status` 中，表示整个节点当前无法继续收敛

两者关系如下：

- 任务级 `blocked` 不自动等于节点级 `blocked`
- 只有当阻塞已经影响整个节点继续推进时，orchestrate 或显式 `transition` 才将节点写为 `blocked`

规则如下：

- `blocked` 只能由 orchestrate 或显式 `transition` 解除
- 解除时必须记录解除原因摘要
- `blocked` 解除后统一回到 `in_progress`
- `blocked` 不能直接转为 `done`

如果阻塞解除后节点实际上已经满足完成条件，仍需重新执行本节点 checklist，再按正常完成流程写入 `done`。

对于 `03_plan` 这类带任务表格的节点，还需要区分“任务解阻”和“节点解阻”：

- 任务解阻：通过更新 `task_plan.md` 中对应任务行完成，将任务状态从 `blocked` 改为 `todo / in_progress / done`
- 节点解阻：仍由 orchestrate 或显式 `transition` 写回运行态，将节点状态从 `blocked` 改为 `in_progress`

只有当关键阻塞已经解除，且整个节点可以继续收敛时，才应解除节点级 `blocked`。

用户引导职责如下：

- `status`：展示当前阻塞摘要、受影响节点或任务、建议下一步动作
- `orchestrate`：在 `BLOCKED` 场景下输出恢复执行步骤
- `skill`：只暴露本节点事实和 checklist 结果，不负责流程恢复引导

### 8.2.11 前置节点状态与推进规则

为避免 orchestrate 对前置节点状态做不同解释，前置节点状态与推进决策统一如下：

| 前置节点状态 | 编排决策 | 说明 |
|---|---|---|
| `done` | `READY_TO_ADVANCE` | 正常推进 |
| `skipped` | `READY_TO_ADVANCE` | 仅当 skip reason 已记录，且该状态由 orchestrate / transition 显式写入 |
| `blocked` | `BLOCKED` | 必须先解除阻塞 |
| `in_progress` | `BLOCKED` | 必须先完成当前节点 |
| `todo` | `BLOCKED` | 必须先开始并完成当前节点 |

这一定义不新增新的 readiness 决策枚举。

用户确认“跳过某节点”的动作，发生在将节点写为 `skipped` 的那一刻，而不是在后续每次推进时重复确认。

---

## 9. 目标文档产物模型

## 9.1 文档产物保留

建议保留以下主要文档：

- `spec.md`
- `design.md`
- `task_plan.md`
- `verify.md`
- `wrap_up.md`
- `release.md`
- `findings.md`

## 9.2 文档产物改造原则

所有文档产物都要去掉以下内容：

- 产物 ID
- REQ / FR / DS / TASK / TC 显式关联编号
- 跨文档引用要求
- matrix / trace 表达
- 为 gate 服务的字段

保留以下内容：

- 本阶段目标
- 关键决策
- 核心内容
- 输出摘要
- 风险说明
- 下一步建议

## 9.3 各阶段文档期望

### `01_specify`

输出：

- `spec.md`

内容关注：

- 背景
- 用户问题
- 目标
- 范围
- 非目标
- 关键场景
- 验收标准

不再要求：

- REQ / FR 编号
- FR 列表 ID 化
- trace 关系

### `02_design`

输出：

- `design.md`

内容关注：

- 方案结构
- 模块职责
- 数据流
- 异常处理
- 风险与权衡

不再要求：

- DS 编号
- DS 与 FR 的显式映射

### `03_plan`

输出：

- `task_plan.md`

内容关注：

- 任务分组
- 执行顺序
- 并行机会
- 关键风险
- 验证安排

不再要求：

- TASK ID
- TASK trace
- DS/TASK 映射矩阵

### `03_plan` 的状态跟进方式

去掉 `TASK ID` 之后，`task_plan.md` 不再承担任务级追踪主键角色，而是通过任务条目的顺序和完成状态跟进执行进度。

建议在 `task_plan.md` 顶部维护一个汇总任务表格，作为任务级执行进展的唯一主视图。

为了支持：

- 已完成 / 未完成跟进
- 当前执行项识别
- 执行恢复
- 完成比例统计
- 阻塞项暴露

建议 `task_plan.md` 采用面向执行的条目结构，例如：

```md
| title | status | summary | next_step |
|---|---|---|---|
| 初始化工程与上下文 | done | 已完成基础目录与依赖准备 | - |
| 重构 API 接口 | in_progress | 正在收口响应结构 | 完成响应模型与调用方适配 |
| 冒烟验证 | todo | 待接口改造完成后执行 | 编写并执行冒烟脚本 |
```

其核心原则是：

- 汇总任务表格是任务进展的唯一主视图
- 通过 `done / in_progress / todo / blocked` 等状态跟进任务
- 不再使用 `TASK-*` 作为计划项身份
- 不要求计划项参与任何跨文档 trace
- 不要求维护任务级依赖矩阵

### `03_plan` 的进度责任边界

`03_plan` 需要明确区分两类进度来源：

- 任务级进度：由 `task_plan.md` 汇总任务表格维护
- 节点级进度：由运行态 `NodeState` 维护

因此：

- 任务表格中某些任务已 `done`，不代表 `03_plan` 节点已经 `done`
- `03_plan` 节点进入 `done`，必须以节点 checklist 达成为准
- `status` 展示节点级状态时应读取运行态
- `status` 展示任务级进度时再读取任务表格摘要

推荐表格列：

- `title`：任务标题，必填
- `status`：`todo / in_progress / done / blocked`，必填
- `summary`：当前进展摘要
- `next_step`：下一步动作

按需可加：

- `owner`
- `notes`

如果运行时需要识别“当前执行项”，应优先基于：

1. 文档中唯一的 `in_progress` 项
2. 任务条目的自然顺序
3. 必要时结合标题文本做轻量定位

而不是重新引入任务 ID 体系。

为降低歧义，还需增加两个硬约束：

- 同一时刻最多只能有一个 `in_progress` 项
- 同一张表内 `title` 必须唯一

### `03_plan` 任务表格强制 Schema

P0 需要把汇总任务表格定义为固定 Schema，避免后续解析分叉。

建议定义：

```ts
interface TaskPlanRow {
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  summary?: string;
  next_step?: string;
  owner?: string;
  notes?: string;
}

const TASK_TABLE_CONSTRAINTS = {
  requiredColumns: ['title', 'status'],
  statusEnum: ['todo', 'in_progress', 'done', 'blocked'],
  uniqueInprogress: true,
  uniqueTitle: true,
};
```

约束如下：

- `title` 与 `status` 为必填 canonical 列
- 其他列为推荐或附加列
- `status` 必须使用严格枚举
- 同一时刻最多一个 `in_progress`
- 同一张表内 `title` 必须唯一

### `03_plan` 的定位变化

`task_plan.md` 从“trace 投影载体”改为“执行计划与进度载体”：

- 面向执行
- 面向恢复
- 面向状态统计
- 不再面向全链路追踪

推荐结构：

1. 顶部：汇总任务表格
2. 中部：任务分组、顺序、风险、验证安排
3. 底部：必要的补充说明或执行备注

因此，`03_plan` 的主要目标是给 `04_implement / 05_verify` 提供可执行切片，而不是维护 TASK 级主链关系。

### `04_implement`

输出：

- `findings.md` 中的实现说明段
- `task_plan.md` 中更新后的任务进度

内容关注：

- 做了什么
- 为什么这么做
- 哪些风险已消除

canonical 落点：

- `findings.md#implementation`：实现说明
- `task_plan.md#task-overview`：任务进度更新

### `05_verify`

输出：

- `verify.md`

内容关注：

- 验证范围
- 验证方法
- 验证结果
- 未覆盖风险

不再要求：

- TC ID
- 覆盖率矩阵按 ID 回填

### `06_wrap_up`

输出：

- `wrap_up.md`

内容关注：

- 最终交付摘要
- 剩余问题
- 后续建议

### `07_release`

输出：

- `release.md`

内容关注：

- 发布内容
- 风险说明
- 发布结论

---

## 10. 目标命令与运行时模型

## 10.1 Stage Machine

保留：

- 合法节点顺序
- 终态判断
- 节点推进
- 取消流程

新增约束：

- `currentStage` 只能由 transition 修改
- transition 只认节点状态和 readiness-check，不认 gate 结果
- transition 不读取 trace / matrix / document-links
- standalone skill 调用不能绕过 transition 直接推进主流程

移除：

- 阶段推进前 gate 评估
- gate 失败阻断
- gate history
- 基于 gate 的 warning / waiver 语义

## 10.2 Skill Runtime

保留：

- skill 上下文装配
- feature / stage 解析
- 文档读写
- 状态更新

移除：

- hard-gate 作为流程准入强阻断入口
- confirm-policy 与 gate 绑定语义
- 依赖 trace 的输入投影

新增：

- skill checklist 上下文注入
- skill checklist 结果评估
- safety notice 注入

### 10.2.1 Dispatcher 重构方向

`dispatcher` 的职责建议重构为：

1. 加载 skill 模板
2. 注入 Safety Guard notice
3. 注入 Skill Checklist 上下文
4. 仅在编排模式下注入 readiness-check notice

建议的运行顺序：

```ts
loadSkill(skillPath, { projectRoot, featureId, mode }) {
  // 1. Safety Guard（警告，不承担流程阻断）
  // 2. Skill Checklist 上下文（不阻断）
  // 3. Readiness-Check（仅 orchestrate 且 mode=flow）
}
```

这意味着 `evaluateSkillHardGate` 的旧 BLOCKED 逻辑不再作为主路径存在。

## 10.3 Orchestrate

保留：

- 当前节点判断
- 下一步建议
- readiness-check
- transition 调度

移除：

- 编排层深度治理角色
- 跨节点质量裁决
- 复杂 gate 合成

新增：

- readiness-check 结果输出
- 当前节点与目标节点的准入判断
- `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED` 决策模型

## 10.4 Status

保留：

- 节点总览
- 当前节点
- 完成比例
- 阻塞状态
- 最近更新

移除：

- matrix 视图
- gate 历史视图
- 基于 ID 的追踪统计

## 10.5 CLI 命令收敛

因为本次重构不考虑向下兼容，CLI 不做“旧命令兼容层”，而是直接收敛为新语义。

建议补充命令收敛表：

| 旧命令 | 决策 | 新命令/替代行为 | 说明 |
|---|---|---|---|
| `spec-first gate check` | 删除 | 无 | gate 体系退场，能力由 `skill checklist + readiness-check` 替代 |
| `spec-first id generate` | 删除 | 无 | 去 ID 后不再保留 |
| `spec-first stage advance` | 替换 | `spec-first transition` | 主流程推进统一改为 transition 语义 |
| `spec-first metrics` | 删除或并入 `status` | `spec-first status` | 若只保留节点完成度与当前状态统计，应并入 `status` |
| `spec-first trace validate` | 删除 | 无 | 不再保留 trace 主路径能力 |
| `spec-first links validate` | 删除 | 无 | `document-links.yaml` 退场 |

CLI 改造约束：

- 不保留 gate / ID / matrix / trace 术语作为主命令入口
- `status / orchestrate / transition` 使用节点化术语重新组织输出
- 帮助文档、错误提示、示例命令与运行时语义同步切换

---

## 11. 需要删除或重构的旧能力

本次重构后，应删除或整体退场的能力包括：

1. ID taxonomy 作为流程主骨架
2. trace-context / relationship-graph 主路径依赖
3. 文档内 ID 关联
4. `document-links.yaml`
5. gate taxonomy
6. gate evaluator
7. gate history
8. waiver / exception 围绕 FR 的主流程语义
9. task_plan 中依赖 trace 的结构
10. 任何以 matrix 为核心的流程判断
11. `hard-gate` 中混杂的阶段阻断逻辑

同时需要保留但应独立重构的能力：

- 高风险改动识别
- 保护分支提醒
- Worktree First 安全建议

---

## 12. 迁移策略

因为当前仍在开发阶段，本次采用直接切换策略，不考虑向下兼容。

### 12.1 迁移原则

- 直接定义新模型
- 直接删除旧模型
- 文档与 runtime 同步切换
- Skill 文案与 CLI 语义同步切换

### 12.2 迁移顺序建议

#### Phase 1: 模型重定义

- 重定义 8+2 状态模型
- 重定义节点状态结构
- 重定义 skill / orchestrate 职责边界
- 移除 gate 相关术语

#### Phase 2: 文档产物瘦身

- 重写各阶段文档模板
- 去掉所有 ID / trace / matrix 语义
- 去掉跨文档显式引用要求

#### Phase 3a: Runtime Foundation

- 重写 stage advance 逻辑为 transition
- 收敛 stage machine 为“只负责合法流转”
- 保留 `stage-state.json` 文件名，但内容 Schema 直接切换为 `FeatureState`
- 不提供旧 `stage-state.json` 到新 Schema 的运行时兼容

#### Phase 3b: Skill Runtime Refactor

- skill 改为本节点 checklist 驱动
- 从 `hard-gate.ts` 中拆出 `safety-guard.ts`
- 为 dispatcher 注入 checklist / safety 两类 notice
- skill 只输出 checklist 结果、节点摘要、`suggestedStatus`

#### Phase 3c: Orchestrate Refactor 与旧能力退场

- orchestrate 改为 readiness-check 驱动
- 删除 gate evaluator 接入
- 删除 document-links 依赖
- 删除 trace / relationship-graph 作为主路径依赖
- 为 dispatcher 注入 readiness notice
- 如仓库内 fixture 或示例数据需要刷新，可使用一次性内部刷新脚本，但不作为正式产品能力

#### Phase 4: CLI 与状态展示切换

- 重写 `status`
- 重写 `orchestrate`
- 重写 `stage` 相关命令
- 引入 `transition` 作为唯一节点推进命令
- 删除 gate / ID / trace / links / metrics 相关 CLI 主命令入口
- 清理用户文案中的 gate / ID / matrix 术语

#### Phase 5: 测试重建

测试重建应按“删除 / 重写 / 新增”三类推进，而不是仅做局部修补。

删除：

- 围绕 gate evaluator 的测试
- 围绕 trace / relationship-graph / matrix 的测试
- 围绕 `document-links.yaml` 主路径能力的测试
- 围绕 ID taxonomy / artifact ID 的测试

重写：

- `status` 的节点概览与摘要展示测试
- `orchestrate` 的决策输出测试
- `stage advance` 到 `transition` 的流转测试
- skill runtime 的上下文注入与结果回写测试
- `task_plan.md` 表格解析与约束测试

新增：

- `skill checklist` 评估测试
- `readiness-check` 决策测试
- `safety-guard` notice 测试
- `FeatureState` Schema 读写测试
- `00_init -> 08_done / 09_cancelled` 的 8+2 节点流转 E2E
- standalone mode 与 flow mode 的行为差异测试

主验收路径：

- 用 8+2 节点流转作为主 E2E 验收路径
- 验证 `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED` 三类编排决策
- 验证 standalone skill 可独立运行，但不会绕过 transition 推进主流程

#### Phase 6: 文档质量收口

- 清理文档中的旧术语，统一为 `skill / orchestrate / transition / readiness-check / safety-guard`
- 增加 Glossary，集中定义关键术语
- 增加 ADR 引用，说明为何采用三层分离而不是两层
- 对代码示例、状态结构、命令表、测试目标做一次术语和语义一致性校对

### 12.3 状态文件切换策略

本次不做状态文件向下兼容迁移，直接采用“保留文件名、切换内容 Schema”的策略。

具体原则：

- 保留 `stage-state.json` 文件路径，避免额外引入文件迁移复杂度
- 将其内容 Schema 直接切换为新的 `FeatureState`
- 不在 runtime 中兼容旧 `history / stageStatus / gateHistory` 结构
- 不提供面向用户的迁移脚本
- 如需刷新仓库内 fixture、示例状态文件或测试样本，可使用一次性内部脚本完成

这样可以避免把旧模型继续带入新 runtime，符合“开发阶段直接切换、不做向下兼容”的原则

### 12.4 测试迁移策略

测试迁移不按“兼容旧测试”处理，而按“按新模型重建覆盖面”处理。

覆盖目标应明确为：

- 节点级：节点状态、合法流转、终态判断
- skill 级：各阶段 checklist 最小完成标准
- 编排级：`READY_TO_WORK / READY_TO_ADVANCE / BLOCKED`
- 安全级：Safety Guard 只提示不阻断
- 文档级：`task_plan.md` 表格 Schema 可解析
- E2E：主流程 happy path、standalone 修订、blocked / skipped / cancelled 分支

---

## 13. 成功标准

本次重构完成后，应满足以下标准：

### 13.1 Skill 独立性

- 任意阶段 skill 可独立调用
- skill 不因跨节点 gate 失败而不可运行
- skill 只依赖本节点最小输入

### 13.2 流程简化

- 主流程中不再存在 gate 概念
- 主流程中不再存在 ID 矩阵概念
- 主流程中不再存在文档显式引用关系

### 13.3 文档可维护性

- 各阶段文档可直接人工阅读和维护
- 文档结构不再被 ID 体系主导
- 文档内容不再围绕 traceability 组织

### 13.4 状态可信

- 每个节点都能独立记录 `todo / in_progress / done / blocked / skipped`
- 当前节点清晰
- 完成进度清晰
- 下一步建议清晰
- standalone skill 执行不会隐式推进主流程
- `task_plan` 可通过条目状态支撑恢复、统计和阻塞定位

### 13.5 编排清晰

- orchestrate 只做 readiness-check
- transition 只做流转
- skill 只做节点闭环

---

## 14. 验收标准

### 14.1 用户体验验收

1. 用户可以单独调用任一节点 skill，而不被 gate 阻断
2. 用户可以查看当前 feature 的节点状态总览
3. 用户可以从当前节点推进到下一个节点，而不需要通过复杂治理规则
4. 用户可以直接阅读各阶段文档，而无需理解 ID 和矩阵体系

### 14.2 运行时验收

1. 系统仅保留 8+2 合法流转
2. 节点推进由 checklist 完成状态驱动
3. orchestrate 只做轻量 readiness-check
4. 不再生成 gate-history
5. 不再要求 document-links.yaml
6. 不再要求 trace matrix
7. standalone mode 不会自动修改 `currentStage`
8. `task_plan.md` 通过条目状态而不是全局 `TASK ID` 跟进进度

### 14.3 文档验收

1. `spec.md / design.md / task_plan.md / verify.md / wrap_up.md / release.md` 中不再包含流程性 ID 关系
2. 不再出现 FR/DS/TASK/TC 显式 trace 语义
3. 对外文案不再使用 gate 作为主流程术语

---

## 15. 风险与决策

## 15.1 风险

### 风险一：过度简化导致节点质量下降

应对：

- 保留 skill 本地 checklist
- 用 checklist 替代 gate，而不是完全取消检查

### 风险二：编排重新膨胀成新 gate 系统

应对：

- 明确 orchestrate 只做 readiness-check
- 不允许其做深度质量评审
- 不持久化复杂治理历史

### 风险三：状态模型继续混入旧治理语义

应对：

- 统一 canonical 状态
- 删除 review / gate 导向状态

## 15.2 关键决策

1. 不保留向下兼容
2. 不保留 gate 作为主流程术语和机制
3. 不保留 ID / matrix 作为流程骨架
4. 保留 8+2 节点顺序
5. 采用“三层分离”模型：
   - skill = 本节点 checklist
   - orchestrate = 跨节点 readiness-check
   - safety-guard = 风险提醒与操作建议
6. 安全机制独立存在：
   - 不再混入流程 gate

---

## 16. 后续实施建议

PRD 确认后，下一步应立即拆成实施计划，至少覆盖以下工作包：

1. 状态模型重构
2. stage / orchestrate runtime 重构
3. skill 文档与模板重写
4. 文档产物结构瘦身
5. CLI 术语与交互改写
6. 测试体系重建
7. `hard-gate` 拆分为 `skill-checklist / readiness-check / safety-guard`

---

## 17. 一句话目标定义

将 `spec-first` 从“围绕 ID、matrix、gate 运转的强治理流程系统”，重构为“围绕 8+2 节点状态、skill 本地闭环和 orchestrate 轻量准入运转的弱耦合流程系统”。

---

## 18. Glossary

为避免术语漂移，本 PRD 统一使用以下词汇：

| 术语 | 定义 |
|---|---|
| `skill` | 面向单一节点的能力模块，负责本节点产物生成、checklist 评估和节点摘要输出 |
| `checklist` | skill 内部的最小完成标准检查，只判断“本节点是否完成” |
| `orchestrate` | 编排层入口，负责判断当前节点、下一步建议与是否可推进 |
| `readiness-check` | 编排层的轻量准入检查，只判断“是否适合进入目标节点” |
| `transition` | 主流程节点推进动作，只负责合法流转，不承担质量裁决 |
| `safety-guard` | 独立的安全提醒层，只输出风险 notice 和操作建议，不阻断流程 |
| `FeatureState` | 运行态单一真相源，记录 `currentStage`、节点状态和终态标记 |
| `NodeState` | 单个节点的运行态状态，包含 `status / summary / checklistStatus / canMarkDone` |
| standalone mode | skill 独立运行模式，可修订文档和 checklist 结果，但不推进主流程 |
| flow mode | 受 orchestrate / transition 管理的主流程模式 |

## 19. ADR 引用

### ADR-001：采用三层分离，而不是两层

决策：

- 采用 `skill checklist + orchestrate readiness-check + safety-guard` 三层模型
- 不采用“skill + orchestrate”两层模型

原因：

- 本节点完成标准与跨节点准入是两类问题，必须分离
- 安全提醒与流程推进也不是同一类问题，若混入 skill 或 orchestrate，容易重新长回 gate
- 三层分离后，`skill` 负责“能做什么”，`orchestrate` 负责“该不该推进”，`safety-guard` 负责“这次操作是否有风险”

取舍：

- 三层模型比两层多一个概念，但边界更稳定
- 代价是需要维护一份独立的 safety notice 逻辑
- 收益是避免 skill/runtime/orchestrate 再次混层，降低后续复杂度回潮风险
