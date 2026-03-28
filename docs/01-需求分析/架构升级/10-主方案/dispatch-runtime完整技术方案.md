# Dispatch / Runtime 完整技术方案

> **版本**: 1.0 | **日期**: 2026-03-26
> 目标：将 spec-first 多 Agent 流水线从“依赖 prompt 传达决策”升级为“依赖结构化 task policy + runtime enforcement 执行决策”。

---

## 1. 方案概述

本方案基于当前项目代码实现与以下分析文档收敛而来：

- [dispatch-runtime最佳实践方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime最佳实践方案.md)
- [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
- [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)

核心目标：

1. 建立统一的 `decision_hints` 结构化契约
2. 将决策生产前移到 task creation / plan
3. 将决策执行下沉到 runtime hooks
4. 保持 `dispatch` 纯调度，不承担复杂策略推导
5. 让 check 阶段测试要求成为硬门控，而不是软提示
6. 保证多平台语义一致
7. 保证旧任务可回退，不要求破坏式迁移

一句话总结：

> 用 `task.json.decision_hints` 统一表达 phase policy，用 runtime hooks 执行 policy，让 `dispatch` 保持纯调度。

本方案还有一个额外约束：

> 不过度设计，不脱离目标。只结构化关键少数、必须可执行、必须跨平台一致的决策。

---

## 2. 背景与问题

### 2.1 当前系统的关键事实

当前系统中：

- `dispatch` 是纯调度器，只按 `task.json.next_action` 调用 subagent
- `inject-subagent-context.py` 负责 phase 推进和上下文注入
- `ralph-loop.py` 负责 check 阶段的 stop gate
- `task_store.py` 和 `task_context.py` 负责生成任务元数据和 jsonl 上下文

这意味着真正有“系统约束力”的层不在 `dispatch`，而在：

- `task.json`
- context injection hook
- check loop hook
- 共享 runtime 脚本

### 2.2 当前缺口

当前主要问题：

1. TDD、测试层级、跨层检查、debug 修复策略缺乏统一结构化表达
2. 决策主要停留在 prompt 和文档层，缺少 runtime 可执行约束
3. 不同平台容易各自演化，导致行为漂移
4. 默认策略没有统一生产源，容易退化为 Agent 临场判断

### 2.3 当前方案误区

过去的设计倾向于：

- 让 `dispatch` 读取文档
- 让 `dispatch` 根据 hints 拼 prompt
- 让 subagent“按提示”做对事情

这不是最佳实践，因为：

- prompt 不是硬门控
- `dispatch` 不是系统控制面
- 多平台同步成本高
- `ralph-loop.py` 才是 check 阶段真正的 gate

### 2.4 从 superpowers 借什么，不借什么

`/Users/kuang/xiaobu/superpowers` 的核心做法是 **skill-first harness**：

- 用 `using-superpowers` 作为入口总控
- 用 `test-driven-development`、`verification-before-completion` 等 skill 写死铁律
- 重点约束工作方法，而不是构建 task-level 结构化 runtime policy

它的优点是：

- 简单
- 强流程约束
- 容易跨平台迁移

它的局限是：

- 关键约束主要靠 agent 遵守 skill 文本
- 没有 task-level policy contract
- 没有把 check gate 与 phase policy 做程序化绑定

因此，spec-first 不应照搬 superpowers 的实现形态，而应借鉴它的理念：

1. 只约束关键少数
2. 铁律要硬
3. 证据优先于声称
4. 把 LLM 自主性保留在执行层

---

## 3. 方案目标

本方案希望实现：

1. **决策可机读**
   所有关键决策必须落在结构化元数据中

2. **执行可强制**
   关键验证规则必须由 runtime 执行，而不是仅靠 prompt 提醒

3. **边界清晰**
   `dispatch` 保持纯调度，复杂策略不放回调度层

4. **多平台一致**
   统一 schema 和语义，各平台允许不同实现细节

5. **平滑迁移**
   新旧任务可并存，保留 fallback 机制

---

## 4. 非目标

本方案不做以下事情：

1. 不重构整个多 Agent pipeline
2. 不让 finish 阶段变成重门控阶段
3. 不在本阶段引入新的独立 test phase
4. 不把 `dispatch.md` 演化成复杂脚本引擎

---

## 5. 设计原则

### 5.1 Policy 与 Enforcement 分离

文档和 schema 负责定义规则，runtime 负责执行规则。

### 5.2 Dispatch 保持纯调度

`dispatch` 只负责：

- 读取 `next_action`
- 启动对应 phase

不负责：

- 推导 TDD 策略
- 推导 verify 命令
- 成为唯一决策中心

### 5.3 决策必须机读

任何关键决策不能只存在于：

- 文本描述
- prompt 模板
- 文档建议

必须最终落到 `task.json.decision_hints` 中。

### 5.4 默认值必须有唯一生产源

默认值应由：

- `task_store.py`
- `plan` phase

生产，而不是由 runtime 现场猜测。

### 5.5 关键 gate 必须可执行

例如 check 是否真正跑测试，必须落成 runtime 可执行命令，而不是只写“建议跑 unit + integration”。

### 5.6 不过度设计

`decision_hints` 不应变成：

- 第二份 PRD
- 全知调度中心
- 覆盖所有局部判断的巨型 schema

它只应该承载：

1. 高风险且必须一致的决策
2. runtime 能直接消费的决策
3. 多平台必须共享语义的决策

### 5.7 LLM 自主决策边界

LLM 的自主决策应主要存在于：

- `plan`：细化 task policy
- `implement/check/debug/finish`：在 policy 边界内自主执行

LLM 的自主决策不应主要存在于：

- `task.json`
- `dispatch`
- runtime hooks

职责划分如下：

| 层 | 主要职责 | 是否允许 LLM 自主决策 |
|----|----------|------------------------|
| `task.json.decision_hints` | 保存最小必要 policy contract | 否 |
| `dispatch` | phase 调度 | 极少 |
| runtime hooks | enforcement | 否 |
| phase agents | 边界内执行优化 | 是 |

---

## 6. 目标架构

推荐采用四层结构。

### 6.0 终局架构总图

从终局目标出发，系统应稳定收敛为四层：

1. **Workflow Topology**
   只回答“有哪些 phase、顺序如何”
2. **Phase Policy**
   只回答“每个 phase 的关键约束是什么”
3. **Runtime Enforcement**
   只回答“哪些约束必须被系统执行和阻止绕过”
4. **LLM Autonomy**
   只回答“在既定边界内，agent 如何自主完成任务”

总图如下：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           终局架构（以终为始）                              │
└─────────────────────────────────────────────────────────────────────────────┘

用户需求
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Workflow Topology                                                  │
│ 载体: task.json.next_action / workflow type                                 │
│ 责任: 定义 phase 顺序和存在性                                               │
│ 只管: implement → check → finish → create-pr                                │
│ 不管: TDD 强度 / 测试命令 / debug 策略 / 局部实现                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Phase Policy                                                       │
│ 载体: task.json.decision_hints                                              │
│ 责任: 定义 phase 的最小关键约束                                             │
│ 只管: implement.mode / check.verify_commands / cross_layer_required         │
│ 不管: 具体代码怎么写 / 具体修复路径 / 完整 prompt 文本                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Runtime Enforcement                                                │
│ 载体: inject-subagent-context.py / ralph-loop.py                            │
│ 责任: 注入 policy、执行 gate、阻止绕过                                      │
│ 只管: 读取 hints、执行 verify_commands、更新 current_phase                  │
│ 不管: 自主推理需求 / 发明新流程 / 取代 agent 执行                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: LLM Autonomy                                                       │
│ 载体: plan / implement / check / debug / finish                             │
│ 责任: 在既定边界内自主完成任务                                              │
│ 只管: 设计细化、代码实现、问题定位、局部权衡                                 │
│ 不管: 改写系统 contract / 绕过 gate / 重新定义 phase 语义                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.0.1 四层边界表

| 层 | 核心问题 | 推荐载体 | 可以变化的内容 | 不应承担的内容 |
|----|----------|----------|----------------|----------------|
| Workflow Topology | 有哪些 phase、顺序如何 | `next_action` | 少量模板切换 | 测试策略、TDD 细节、修复策略 |
| Phase Policy | 每个 phase 的关键约束是什么 | `decision_hints` | 最小 contract 覆写 | 具体执行步骤、完整上下文 |
| Runtime Enforcement | 哪些约束必须由系统执行 | hooks / plugin | 平台实现细节 | 高层需求推理、复杂业务判断 |
| LLM Autonomy | 如何在边界内完成任务 | phase agents | 具体实现与局部 tradeoff | 改写 contract、绕过 gate |

### 6.0.2 最小落地原则

如果从终局架构倒推第一阶段实现，最小落地点应是：

1. `next_action` 只做最小流程拓扑配置化
2. `decision_hints` 只保留最关键 3 个字段
3. `ralph-loop.py` 只先执行 `check.verify_commands`
4. `dispatch` 不引入 gate engine

这四条是控制复杂度的底线。

### Layer 1: Task Policy Layer

载体：

- `task.json`

职责：

- 保存 `decision_hints`
- 保存 phase policy 的最终结构化表达

### Layer 2: Policy Generation Layer

载体：

- `task_store.py`
- `plan` agent
- `task_context.py`

职责：

- 生成默认 hints
- 根据需求、任务类型和 research 覆写 hints
- 让上下文与策略保持一致

### Layer 3: Runtime Enforcement Layer

载体：

- `inject-subagent-context.py`
- `ralph-loop.py`
- OpenCode plugin/runtime

职责：

- 将 policy 注入到 subagent prompt
- 执行验证命令
- 阻止不满足 gate 的 phase 结束

### Layer 4: Prompt / UX Layer

载体：

- `dispatch.md`
- `implement.md`
- `check.md`
- `phase-decision-guide.md`

职责：

- 向 agent 和维护者解释规则
- 提供行为参考
- 不能作为唯一执行来源

### 架构图

```text
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: task.json                                          │
│ decision_hints / verify policy / cross-layer requirements   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: Policy Generation                                   │
│ task_store.py / plan / task_context.py                       │
│ 生成默认值、补全 task metadata、产出 jsonl 上下文             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Runtime Enforcement                                 │
│ inject-subagent-context.py / ralph-loop.py / opencode plugin │
│ 注入 hints、执行 verify、阻止不满足约束的 phase 结束         │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 4: Prompt / UX                                         │
│ dispatch.md / implement.md / check.md / policy docs          │
│ 解释规则，辅助执行，但不是唯一控制面                         │
└──────────────────────────────────────────────────────────────┘
```

### 6.1 修改前后架构对比

#### 修改前

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         当前架构（修改前）                           │
└──────────────────────────────────────────────────────────────────────┘

用户请求
   │
   ▼
dispatch
   │
   ├── 读取 task.json.next_action
   ├── 读取文档/提示
   └── 根据 prompt 调用 subagent
         │
         ├── implement  ← 依赖 prompt 理解 TDD / 测试策略
         ├── check      ← 依赖 prompt 理解是否跑测试
         ├── debug      ← 依赖 prompt 理解修复策略
         └── finish

check 结束时：
   ralph-loop.py
      ├── 读 worktree.yaml verify
      └── 否则回退 completion markers

问题：
- 决策主要停留在 prompt
- task 没有统一结构化 policy
- check gate 与 phase 策略脱节
- dispatch 承担了过多“解释型”职责
```

#### 修改后

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         目标架构（修改后）                           │
└──────────────────────────────────────────────────────────────────────┘

用户请求
   │
   ▼
task_store.py / plan
   │
   ├── 生成 task.json
   └── 写入 decision_hints
         │
         ▼
dispatch
   │
   ├── 只读取 next_action
   └── 只负责调度 phase
         │
         ▼
inject-subagent-context.py
   │
   ├── 读取 decision_hints
   ├── 注入 implement/check/debug/finish policy
   └── 自动推进 current_phase
         │
         ├── implement
         ├── check
         ├── debug
         └── finish

check 结束时：
   ralph-loop.py
      ├── 优先读 decision_hints.check.verify_commands
      ├── 回退 worktree.yaml verify
      └── 再回退 completion markers

收益：
- 决策进入 task metadata
- 执行进入 runtime
- check gate 与 phase policy 对齐
- dispatch 回归纯调度
```

### 6.2 优势对比表

| 维度 | 修改前 | 修改后 | 改进点 |
|------|--------|--------|--------|
| 决策载体 | prompt / 文档 | `task.json.decision_hints` | 决策机读化 |
| 默认值来源 | 运行时隐式推断 | `task_store.py` / `plan` | 默认值可预测 |
| dispatch 职责 | 调度 + 解释型决策 | 纯调度 | 边界更清晰 |
| implement 策略注入 | 靠 dispatch 文本传达 | hook 注入 phase policy | 平台一致性更高 |
| check 测试策略 | 软提示 | `verify_commands` 硬门控 | 真正可执行 |
| cross-layer 策略 | 文档建议 | 结构化字段 + runtime 消费 | 规则更稳定 |
| debug 修复策略 | prompt 临场发挥 | 结构化 `fix_strategy` | 可控性更强 |
| 多平台维护 | 模板各自演化 | 共享 schema + runtime 语义 | 漂移更少 |
| 旧任务兼容 | 依赖现状行为 | schema + fallback 共存 | 迁移风险更低 |
| 工程可审计性 | 低 | 高 | task policy 可追踪 |

---

## 7. 数据模型

统一在 `task.json` 中新增 `decision_hints`。

### 7.0 推荐最小落地范围

如果以“不过度设计”为前提，第一阶段建议只落这 3 类字段：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended"
    },
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    }
  }
}
```

原因：

1. `implement.mode` 决定实现策略强度
2. `check.verify_commands` 是真正的硬门控字段
3. `check.cross_layer_required` 是最稳定、最有价值的额外语义

以下字段建议作为第二阶段扩展，而不是首批强制落地：

- `implement.test_layers`
- `implement.must_show_red_green`
- `debug.*`
- `finish.*`

### 7.1 推荐结构

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended",
      "test_layers": ["unit"],
      "must_show_red_green": false
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit"],
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    },
    "debug": {
      "fix_strategy": "minimal_safe_fix",
      "prefer_test_reproduction": true,
      "analysis_depth": "shallow"
    },
    "finish": {
      "update_spec_expected": false,
      "record_session_expected": false
    }
  }
}
```

### 7.2 字段要点

#### `implement.mode`

允许值：

- `direct`
- `tdd_recommended`
- `tdd_required`

说明：

- 比 `use_tdd: true/false` 更有表达力
- 能区分“推荐 TDD”和“强制 TDD”

#### `implement.test_layers`

说明：

- 表达 implement 阶段建议优先覆盖的测试层
- 主要供 prompt 注入与规则说明使用

#### `implement.must_show_red_green`

说明：

- 只有在高风险修复或严格 TDD 场景下才建议为 `true`

#### `check.verify_commands`

说明：

- 这是 check 阶段最重要的 enforcement 字段
- runtime 应直接执行它
- 不再依赖从 `test_layers` 临时推导命令

#### `check.cross_layer_required`

说明：

- 是否必须进行跨层一致性检查

#### `debug.fix_strategy`

允许值：

- `minimal_safe_fix`
- `reproduce_then_fix`
- `trace_cross_layer_then_fix`

#### `finish.*`

说明：

- 当前更偏提示字段，不建议做重门控

完整 schema 见：

- [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)

---

## 8. 默认策略

### 8.0 最小默认策略

第一阶段推荐默认值：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended"
    },
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    }
  }
}
```

### 8.1 推荐默认值

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended",
      "test_layers": ["unit"],
      "must_show_red_green": false
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit"],
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    },
    "debug": {
      "fix_strategy": "minimal_safe_fix",
      "prefer_test_reproduction": true,
      "analysis_depth": "shallow"
    },
    "finish": {
      "update_spec_expected": false,
      "record_session_expected": false
    }
  }
}
```

### 8.2 场景化覆盖

#### API / service 变更

```json
{
  "implement": {
    "mode": "tdd_recommended",
    "test_layers": ["unit", "integration"]
  },
  "check": {
    "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
    "cross_layer_required": true
  }
}
```

#### DB / schema 变更

```json
{
  "implement": {
    "mode": "tdd_recommended",
    "test_layers": ["integration"]
  },
  "check": {
    "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
    "cross_layer_required": true
  },
  "debug": {
    "fix_strategy": "trace_cross_layer_then_fix"
  }
}
```

#### UI-only 变更

```json
{
  "implement": {
    "mode": "direct",
    "test_layers": ["snapshot"]
  },
  "check": {
    "verify_commands": ["pnpm lint", "pnpm typecheck"],
    "cross_layer_required": false
  }
}
```

#### bug fix

```json
{
  "implement": {
    "mode": "tdd_required",
    "test_layers": ["unit"],
    "must_show_red_green": true
  },
  "debug": {
    "fix_strategy": "reproduce_then_fix",
    "prefer_test_reproduction": true,
    "analysis_depth": "deep"
  }
}
```

规则语义见：

- [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)

---

## 9. 各组件职责重划

## 9.1 `dispatch`

保留职责：

- 读取 `.spec-first/.current-task`
- 读取 `task.json.next_action`
- 启动 implement/check/debug/finish

不再承担：

- TDD 策略推导
- test layer 到命令的映射
- 主决策树逻辑

## 9.2 `task_store.py`

新增职责：

- 为新任务写入默认 `decision_hints`

原因：

- 它已是 task 元数据的主生产者
- 最适合成为默认值唯一生产源

## 9.3 `plan` agent

新增职责：

- 根据需求和 research 结果覆盖默认 hints
- 为特定任务设置更精确的 verify policy

例如：

- 推断是否需要 `cross_layer_required`
- 推断是否使用 `tdd_required`
- 推断 `verify_commands`

## 9.4 `task_context.py`

新增职责：

- 根据 hints 调整默认 jsonl
- 决定是否注入 `check-cross-layer`
- 未来可按 `test_layers` 补充测试相关上下文

## 9.5 `inject-subagent-context.py`

新增职责：

- 读取 `task.json.decision_hints`
- 将 implement/check/debug/finish 的 phase policy 注入 prompt

推荐注入格式：

```text
Phase Policy:
- mode = tdd_recommended
- test_layers = ["unit", "integration"]
- cross_layer_required = true
```

## 9.6 `ralph-loop.py`

新增职责：

- 优先读取 `task.json.decision_hints.check.verify_commands`
- 执行这些命令
- 失败时阻止 check 结束

这是整个方案的关键 enforcement 落点。

---

## 10. 运行时执行流

### Step 1: 创建 task

`task_store.py` 生成：

- `next_action`
- `current_phase`
- 默认 `decision_hints`

### Step 2: plan 细化策略

`plan` 根据需求和 research：

- 覆盖默认 hints
- 写入任务级 `verify_commands`
- 标记 `cross_layer_required`

### Step 3: init-context

`task_context.py` 根据 hints 生成：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

### Step 4: dispatch 调度

`dispatch` 按 `next_action` 启动 phase，不承担复杂决策。

### Step 5: hook 注入 policy

`inject-subagent-context.py` 在 implement/check/debug/finish 调用前注入 phase policy。

### Step 6: check 硬门控

`ralph-loop.py` 执行 `verify_commands`。

### Step 7: finish 收尾

`finish` 继续负责：

- requirements 对照
- spec sync 判断
- PR 前确认

不承担完整测试策略推导。

---

## 11. Check Gate 设计

check gate 必须从“文本提示”升级为“runtime enforcement”。

推荐优先级：

```text
task.json.decision_hints.check.verify_commands
  > .spec-first/worktree.yaml verify
  > completion markers
```

含义：

1. 新任务优先使用 task-level verify policy
2. 老任务仍可使用 `worktree.yaml`
3. 更老任务仍可退化到 completion markers

这是整个方案最关键的落地点。

---

## 12. 为什么不让 dispatch 做主决策

不建议让 `dispatch` 承担主决策，原因如下：

1. `dispatch` 不是系统 gate
2. 现有关键状态推进已下沉到 hook
3. prompt 决策不能保证执行
4. 多平台同步多个 dispatch 模板成本高
5. `ralph-loop.py` 才是真正影响 check stop 的 runtime 控制面

因此最优策略是：

- 文档定义 policy
- task 保存 policy
- runtime 执行 policy
- dispatch 只转发 phase

---

## 13. 多平台一致性策略

统一语义，不强求统一实现细节。

### 必须统一的部分

- `decision_hints` 字段名
- 枚举值
- fallback 顺序
- `verify_commands` 语义
- `cross_layer_required` 语义

### 平台实现

- Claude / iFlow：Python hooks
- OpenCode：plugin/runtime
- 其他平台：先对齐文档和 schema，再逐步接入 runtime

---

## 14. 向后兼容

旧任务没有 `decision_hints` 时：

1. prompt 注入回退到 runtime 默认值
2. check gate 回退到 `worktree.yaml verify`
3. 再回退到 completion markers

迁移原则：

- 新任务自动使用新 schema
- 旧任务无需批量改写
- 新旧任务可同时运行

---

## 15. 风险与防御

### 风险 1：`decision_hints` 过度复杂

防御：

- 控制字段数量
- 优先保留 runtime 可消费字段
- 避免深层嵌套

### 风险 2：plan 推导错误

防御：

- 允许 hints 被人工修正
- 保留安全默认值
- 保持 fallback

### 风险 3：多平台漂移

防御：

- 先统一 schema
- 再按平台适配实现
- 将核心语义收敛在共享文档和共享脚本

### 风险 4：TDD 被形式化执行

防御：

- 只在 `tdd_required` 场景要求强证据
- `tdd_recommended` 不做重门控
- 将强约束聚焦在 `check.verify_commands`

---

## 16. 分阶段实施

## Phase 0: 文档与契约定稿

交付物：

- 本文档
- `phase-decision-guide.md`
- `decision-hints-schema.md`

## Phase 1: 数据模型落地

改动点：

- `task_store.py`
- task JSON 类型定义

工作内容：

- 新任务默认写入 `decision_hints`

## Phase 2: plan 策略生成

改动点：

- `plan` agent 模板

工作内容：

- 基于需求与 research 覆写默认 hints

## Phase 3: prompt 注入落地

改动点：

- `inject-subagent-context.py`
- OpenCode 对应 plugin

工作内容：

- 读取并注入 phase policy

## Phase 4: check gate 落地

改动点：

- `ralph-loop.py`

工作内容：

- 执行 `task.json.decision_hints.check.verify_commands`

## Phase 5: 上下文生成收口

改动点：

- `task_context.py`

工作内容：

- 让 jsonl 上下文和 hints 保持一致

## Phase 6: 文档模板收口

改动点：

- `dispatch.md`
- `implement.md`
- `check.md`
- 各平台模板

工作内容：

- 调整文案，使其描述 runtime policy，而不是主导 policy

---

## 17. 需要修改的核心文件

建议优先关注：

- [task_store.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_store.py)
- [task_context.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_context.py)
- [dispatch.md](/Users/kuang/xiaobu/spec-first/.claude/agents/dispatch.md)
- [inject-subagent-context.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/inject-subagent-context.py)
- [ralph-loop.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/ralph-loop.py)

文档基线：

- [dispatch-runtime最佳实践方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime最佳实践方案.md)
- [phase-decision-guide.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/phase-decision-guide.md)
- [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)

---

## 18. 最终结论

完整技术方案可以浓缩为一句话：

> 用 `task.json.decision_hints` 统一表达 phase policy，用 `inject-subagent-context.py` 和 `ralph-loop.py` 执行这些 policy，让 `dispatch` 保持纯调度，从而把 spec-first 的多 Agent 流水线升级为“结构化决策 + runtime 强约束”的工程系统。

这个方案的优势在于：

1. 与现有代码边界一致
2. 测试策略可真正落成硬门控
3. 多平台更容易保持一致
4. 兼容旧任务，不要求一次性破坏式重构
5. 不把 schema 设计成过重的中央控制面
