# Dispatch / Runtime 最佳实践方案

> 目标：为 spec-first 的多 Agent 流水线建立“可机读、可执行、可迁移”的决策机制，避免把关键工程约束停留在 `dispatch` prompt 层。

---

## 1. 执行摘要

基于当前项目代码实现，`docs/01-需求分析/架构升级/dispatch-de决策集成方案.md` 提出的方向是正确的：

- 希望把 TDD、测试层级、跨层检查等隐式判断显式化
- 希望降低“靠 Agent 自觉判断”的不稳定性
- 希望借鉴 Superpowers 的 Harness Engineering 思想

但原方案的主要落点不是最佳实践。

原方案把复杂度主要放在：

- `dispatch.md`
- 新增 `phase-decision-guide.md`
- 由 `dispatch` 读取 `task.json.decision_hints` 后再拼 prompt

这在 spec-first 当前架构里不是最稳的控制点。当前系统中，真正具有“系统级约束力”的层并不是 `dispatch`，而是：

- `task.json` / 任务上下文生成器
- `inject-subagent-context.py`
- `ralph-loop.py`
- 多平台模板共享的 runtime 脚本

因此，最佳实践不是“让 dispatch 变聪明”，而是：

1. **让 plan / task creation 产出结构化决策**
2. **让 hook/runtime 执行这些决策**
3. **让 dispatch 保持纯调度**
4. **让文档定义 policy，而不是承担 execution engine**

一句话总结：

> 决策应该存放在 `task metadata`，执行应该发生在 `runtime hooks`，而不是停留在 `dispatch` 的自然语言 prompt 中。

---

## 2. 当前实现的真实控制面

在提出新方案前，先明确当前代码里“谁真正控制行为”。

### 2.1 `dispatch` 的真实职责

当前 `dispatch` 明确定义为纯调度器：

- 只按 phase 顺序调用 subagent
- 不直接读取 spec/requirements
- 复杂逻辑不应放在自身

参考：

- [dispatch.md](/Users/kuang/xiaobu/spec-first/.claude/agents/dispatch.md)

关键事实：

- `dispatch` 只知道 `task.json.next_action`
- `implement/check/debug/finish` 的 prompt 基本是固定模板
- `dispatch` 本身不是系统级 gate

### 2.2 phase 推进不靠 `dispatch`

当前 `current_phase` 的推进已经下沉到 hook：

- `inject-subagent-context.py` 会在调用 implement/check 时自动更新 `task.json.current_phase`

参考：

- [inject-subagent-context.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/inject-subagent-context.py)

这说明项目已经在实践一个重要原则：

> 不把关键状态迁移交给 agent 记忆或 prompt 遵循，而是交给 runtime enforcement。

### 2.3 implement/check 的上下文不靠 `dispatch` 组装

当前 subagent 真正收到的上下文，也不是 `dispatch` 自己拼出来的，而是 hook 在调用前统一注入：

- implement：`implement.jsonl + prd.md + info.md`
- check：`check.jsonl + prd.md`
- finish：`finish-work.md + update-spec.md + prd.md`

也就是说：

> 当前项目真正的“行为塑形层”在 context injection hook，不在 dispatch 文本。

### 2.4 check 的硬门控在 `ralph-loop.py`

当前 check 能否结束，不由 `dispatch` 决定，而由 `ralph-loop.py` 决定：

- 优先读取 `.spec-first/worktree.yaml` 的 `verify`
- 若未配置，则退化为 completion markers
- 不通过则阻止 check 结束

参考：

- [ralph-loop.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/ralph-loop.py)
- [worktree.yaml](/Users/kuang/xiaobu/spec-first/.spec-first/worktree.yaml)

因此，任何“测试是否必须执行”的最佳实践方案，最终都必须进入 `ralph-loop.py` 的可执行逻辑，否则只是软提示。

### 2.5 task 元数据默认值的生产者

当前任务默认结构由脚本生成，而不是由 agent 自由发挥：

- `task_store.py` 生成 `task.json`
- `task_context.py` 生成 `implement/check/debug.jsonl`

参考：

- [task_store.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_store.py)
- [task_context.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_context.py)

这意味着：

> 如果要引入 `decision_hints`，最佳生产者应该是 task creation / plan 流程，而不是 dispatch 运行时临时推断。

---

## 3. 对原方案的架构判断

## 3.1 原方案做对了什么

原方案的优点：

1. 正确识别了当前系统缺少显式决策层
2. 正确识别了 TDD / test layer / cross-layer check 不应再靠即兴判断
3. 正确试图引入结构化 `decision_hints`
4. 正确强调了“文档化规则优于模型猜测”

这些判断是成立的。

## 3.2 原方案的核心偏差

原方案最大问题不是“想法不对”，而是“落点不对”。

它把关键能力建设在：

- `dispatch.md` 读取 hints
- `dispatch` 按 hints 改写 prompt
- 新增 `phase-decision-guide.md`

这会带来四个问题。

### 问题 1：关键约束仍然只是 prompt，不是 system enforcement

例如：

- `check` 跑不跑测试
- 跑哪些测试层
- 是否必须展示 RED -> GREEN 证据

如果只写进 `dispatch` prompt，而 `ralph-loop.py` 不感知这些信息，系统仍然不能保证执行。

这不符合工程系统的最佳实践。

### 问题 2：违反当前“复杂逻辑下沉到 hook/runtime”的演化方向

现有代码已经把以下关键能力下沉到了 runtime：

- phase 更新
- 上下文注入
- finish/check 分流
- check 阻塞循环

如果再把决策逻辑拉回 `dispatch`，就会让职责边界重新变糊。

### 问题 3：默认值没有生产闭环

原方案定义了：

```json
{
  "decision_hints": {
    "implement": {
      "use_tdd": true,
      "test_layers": ["unit"]
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit"]
    }
  }
}
```

但没有清晰规定：

- 谁来生成这些默认值
- 在什么阶段写入 `task.json`
- 多平台如何保持一致

这会导致 hints 仍然靠 agent 运行时猜。

### 问题 4：同步面估计不足

真正要落地此能力，需要同步改动的不只是 `dispatch.md` 和 command 文档，还包括：

- `task_store.py`
- `plan` agent 模板
- `task_context.py`
- `inject-subagent-context.py`
- `ralph-loop.py`
- OpenCode 对应插件/runtime
- 各平台模板

如果只改文档和 dispatch 模板，最终会出现“文档先进、runtime 落后”的漂移。

---

## 4. 最佳实践设计原则

新方案采用以下原则。

### 4.1 Policy 和 Enforcement 分离

文档负责：

- 定义决策模型
- 定义默认规则
- 定义场景选择原则

runtime 负责：

- 读取结构化 hints
- 强制执行验证命令
- 阻止不满足约束的 phase 结束

### 4.2 纯调度与执行约束分离

`dispatch` 应继续保持：

- 读 `next_action`
- 启动相应 subagent
- 不承担业务决策树

这是当前项目最重要的边界之一，不应破坏。

### 4.3 决策必须机读

决策不能只存在于：

- 自然语言说明
- prompt 中的临时拼接
- 文档里的推荐条款

必须落到 `task.json` 或其他统一结构化元数据中。

### 4.4 默认值必须有唯一生产源

每一个 task 如果没有明确自定义配置，也必须有稳定默认值。

默认值生产者应是：

- task creation
- plan phase

而不是 dispatch。

### 4.5 多平台共享同一语义模型

不同平台允许实现不同，但决策语义必须相同。

例如：

- `check.verify_commands`
- `implement.mode`
- `cross_layer.required`

这些字段的语义必须跨 Claude / iFlow / OpenCode 一致。

---

## 5. 推荐目标架构

推荐采用四层结构。

### Layer 1: Task Policy Layer

载体：

- `task.json`

职责：

- 保存本任务的结构化决策
- 保存可被 runtime 消费的 phase hints

### Layer 2: Policy Generation Layer

载体：

- `task_store.py`
- `plan` agent
- `task_context.py`

职责：

- 生成默认 `decision_hints`
- 根据任务类型细化 phase 策略
- 为 implement/check/debug 准备上下文

### Layer 3: Runtime Enforcement Layer

载体：

- `inject-subagent-context.py`
- `ralph-loop.py`
- OpenCode 对应 plugin/runtime

职责：

- 把 hints 注入 subagent prompt
- 按 hints 运行验证命令
- 阻止不满足验证条件的 phase 结束

### Layer 4: Prompt / UX Layer

载体：

- `dispatch.md`
- `implement.md`
- `check.md`
- `phase-decision-guide.md`

职责：

- 给 agent 可理解的解释
- 帮助用户和维护者理解规则
- 不能作为唯一执行机制

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

---

## 6. 推荐的数据模型

推荐在 `task.json` 中新增 `decision_hints` 字段，并收敛为“runtime-friendly schema”。

### 6.1 推荐结构

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
      "prefer_test_reproduction": true
    }
  }
}
```

### 6.2 字段设计说明

#### `implement.mode`

建议枚举值：

- `direct`
- `tdd_recommended`
- `tdd_required`

原因：

- 比布尔型 `use_tdd` 更可扩展
- 能区分“推荐”和“强制”

#### `implement.test_layers`

用于表达 implement 阶段优先覆盖的测试层级：

- `unit`
- `integration`
- `e2e`
- `snapshot`

注意：

这只是 implement 阶段的目标，不等于 gate。

真正 gate 要看 `check.verify_commands`。

#### `check.verify_commands`

这是最关键字段。

示例：

```json
["pnpm lint", "pnpm typecheck", "pnpm test"]
```

这是 runtime 最容易消费、最可执行、最稳定的形式。

相比只存 `test_layers`，`verify_commands` 更接近执行层，避免不同平台自行推导命令。

#### `check.cross_layer_required`

布尔型即可。

用于控制：

- 是否必须注入 `check-cross-layer`
- 是否必须进行跨层数据流审查

#### `debug.fix_strategy`

建议枚举值：

- `minimal_safe_fix`
- `reproduce_then_fix`
- `trace_cross_layer_then_fix`

让 debug 也从“自由发挥”变成“受控修复”。

---

## 7. 推荐默认决策策略

默认策略必须由系统生成，不应依赖 dispatch 现场判断。

### 7.1 基础默认值

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
      "prefer_test_reproduction": true
    }
  }
}
```

### 7.2 按任务类型细化

#### 后端功能 / API 变更

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

#### 数据库 / schema 变更

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
    "prefer_test_reproduction": true
  }
}
```

---

## 8. 各层职责重划

## 8.1 `dispatch`

### 保留职责

- 读取 `.spec-first/.current-task`
- 读取 `task.json.next_action`
- 按顺序启动 subagent

### 不应承担的职责

- 不应自行推断 TDD 策略
- 不应负责 test layer 到具体命令的映射
- 不应成为唯一决策中心

### 推荐修改

只做轻量增强：

- 允许在 prompt 中附带一句“runtime will inject phase policy”
- 不写复杂 jq 分支
- 不把 `dispatch.md` 变成脚本解释器

### 原因

这能保持 [dispatch.md](/Users/kuang/xiaobu/spec-first/.claude/agents/dispatch.md) 的 pure dispatcher 边界。

## 8.2 `task_store.py`

### 新职责

- 创建 task 时写入基础 `decision_hints`

### 推荐原因

这是默认值唯一生产源的最佳位置之一。

它已经负责：

- `current_phase`
- `next_action`
- `meta`

新增 `decision_hints` 在语义上自然。

## 8.3 `plan` agent

### 新职责

- 在创建任务目录后，根据需求和 research 结果，覆盖默认 `decision_hints`

例如：

- 推断是否需要 cross-layer check
- 推断是 `tdd_recommended` 还是 `tdd_required`
- 推断 `verify_commands`

### 原因

这一步最接近需求语义，适合做 task-specific policy refinement。

## 8.4 `task_context.py`

### 新职责

- 根据 `decision_hints` 调整 `check.jsonl` / `debug.jsonl`
- 决定是否默认加入 `check-cross-layer`
- 决定是否添加 testing 相关文档引用

### 原因

它已经是上下文初始化器，天然适合让 context 和 policy 保持一致。

## 8.5 `inject-subagent-context.py`

### 新职责

- 读取 `task.json.decision_hints`
- 在构建 implement/check/debug prompt 时注入结构化 phase policy

示例：

```text
Phase Policy:
- implement.mode = tdd_recommended
- implement.test_layers = ["unit"]
- must_show_red_green = false
```

### 原因

这比让 `dispatch` 在自然语言里手工拼 prompt 更稳定，因为：

- 同一平台只有一个注入点
- 上下文与 policy 在一个 runtime 内聚
- 更接近真正执行点

## 8.6 `ralph-loop.py`

### 新职责

- 优先读取 task-level `decision_hints.check.verify_commands`
- 若不存在，再 fallback 到 `worktree.yaml.verify`
- 若仍不存在，再 fallback 到 completion markers

### 推荐优先级

```text
task.json.decision_hints.check.verify_commands
  > .spec-first/worktree.yaml verify
  > completion markers
```

### 原因

这是让“测试策略”真正变成硬门控的关键一步。

没有这一步，所有测试决策都只是软提示。

---

## 9. 推荐执行流

### Step 1: 创建 task

`task_store.py` 生成：

- `next_action`
- `current_phase`
- 默认 `decision_hints`

### Step 2: plan 补全策略

`plan` agent 根据需求和 research 输出：

- 覆盖 `decision_hints`
- 写入特定任务的 `verify_commands`
- 标记 `cross_layer_required`

### Step 3: init-context 生成上下文

`task_context.py` 根据 `decision_hints` 初始化：

- `implement.jsonl`
- `check.jsonl`
- `debug.jsonl`

### Step 4: dispatch 启动 phase

`dispatch` 仍然只按 `next_action` 调度。

### Step 5: hook 注入 phase policy

`inject-subagent-context.py` 读取 `decision_hints`，把策略注入 implement/check/debug prompt。

### Step 6: check 阶段硬门控

`ralph-loop.py` 读取 `verify_commands` 真正执行验证命令。

### Step 7: finish 阶段保持轻量

`finish` 继续作为：

- 最终 requirements 对照
- spec sync 检查
- PR 前确认

不承担完整测试决策推导。

---

## 10. 为什么这比“dispatch 读取 hints”更好

| 维度 | 原方案 | 本方案 |
|------|--------|--------|
| 决策落点 | dispatch 文档 | task metadata |
| 执行落点 | dispatch prompt | hook/runtime |
| 默认值来源 | 隐式 | task creation / plan |
| 测试门控 | 软提示 | `ralph-loop` 硬门控 |
| 多平台一致性 | 低 | 高 |
| 维护成本 | 高，模板分散 | 中，runtime 集中 |
| 可靠性 | 中 | 高 |

本方案的核心优势不是“更复杂”，而是：

> 把决策信息放到了系统真正会执行的地方。

---

## 11. 分阶段实施方案

为避免一次性重构过大，建议分四期。

## Phase 0: 文档定稿

交付物：

- 本文档
- `decision_hints` schema 说明文档

目标：

- 统一团队认知
- 避免后续改到一半又改变方向

## Phase 1: 数据模型落地

改动点：

- `task_store.py`
- `plan` agent 模板
- task JSON 类型定义

工作内容：

- 给新任务默认写入 `decision_hints`
- plan 支持覆盖 hints

目标：

- 先让 policy 可机读

## Phase 2: Prompt 注入落地

改动点：

- `inject-subagent-context.py`
- OpenCode 对应 plugin

工作内容：

- implement/check/debug prompt 自动附带 phase policy

目标：

- 让 subagent 真正感知结构化决策

## Phase 3: 验证门控落地

改动点：

- `ralph-loop.py`

工作内容：

- 支持 `task.json.decision_hints.check.verify_commands`
- 完成 task-level verify > worktree-level verify > markers 的三级 fallback

目标：

- 让测试策略成为硬门控

## Phase 4: 文档与模板收口

改动点：

- `dispatch.md`
- `implement.md`
- `check.md`
- `phase-decision-guide.md` 或替代 policy 文档
- 各平台模板同步

工作内容：

- 简化 dispatch 文本
- 让 agent 文档描述 runtime policy 的存在
- 统一平台文档表达

目标：

- 文档与 runtime 对齐

---

## 12. 向后兼容策略

必须兼容旧任务目录。

### 12.1 兼容规则

如果旧 task 没有 `decision_hints`：

1. `inject-subagent-context.py` 使用内置默认值
2. `ralph-loop.py` 回退到 `worktree.yaml.verify`
3. 再回退到 completion markers

### 12.2 迁移原则

- 不要求一次性批量迁移所有历史 `task.json`
- 新任务自动生成新结构
- 旧任务按 fallback 逻辑继续工作

### 12.3 回滚策略

如果新机制有问题：

- 保留 `dispatch` 的原始调度能力
- 禁用 task-level verify 读取
- 恢复到 `worktree.yaml.verify` + completion markers

这样可以安全回滚，不影响现有多 agent 主流程。

---

## 13. 风险与防御

## 风险 1：`decision_hints` 过度复杂

防御：

- 控制字段数量
- 优先保留 runtime 可直接消费的字段
- 避免嵌套过深

## 风险 2：plan 推导错误

防御：

- 允许 hints 被人工编辑
- 给 runtime 设置安全默认值
- 保持 fallback

## 风险 3：多平台实现漂移

防御：

- 先统一 schema
- 再按平台分别实现 adapter
- 将核心语义放在共享脚本和共享文档中

## 风险 4：TDD 被形式化执行

防御：

- 只有 `tdd_required` 时才要求 RED/GREEN 证据
- `tdd_recommended` 不做重门控
- 把强制门槛聚焦在 check 的 verify 上，而不是 implement 的表演性流程

---

## 14. 最终建议

最终建议非常明确：

### 不建议原样采用的部分

- 不建议把主要复杂度放在 `dispatch.md`
- 不建议让 `dispatch` 成为 phase 决策中心
- 不建议仅通过 prompt 传递测试策略

### 建议采用的部分

- 保留 `decision_hints` 思路
- 保留“显式化规则”目标
- 保留 policy 文档作为解释层

### 强烈建议重构的部分

- 将决策的生产放到 `task creation / plan`
- 将决策的执行放到 `inject-subagent-context.py + ralph-loop.py`
- 将 `dispatch` 收敛为纯调度层

---

## 15. 推荐结论

如果从“Google 级别的工程系统设计”视角给结论：

> 原方案是一个正确方向上的中间方案，但不是 spec-first 当前代码结构下的最佳实践。

最佳实践应该是：

> **Task Policy 驱动 + Runtime Enforcement 执行 + Dispatch 保持纯调度 + 文档只定义规则不承载执行。**

这个方案的价值在于：

1. 与现有代码边界一致
2. 多平台更容易保持一致
3. 测试策略可以真正落成硬门控
4. 兼容旧任务，不需要一次性破坏式重构

---

## 16. 后续实施建议

建议下一步按以下顺序推进：

1. 先补一份 `decision_hints` schema 文档
2. 再修改 `task_store.py` 和 `plan`，让新任务产出 hints
3. 再改 `inject-subagent-context.py`
4. 最后改 `ralph-loop.py` 和模板文档

不要反过来先改 `dispatch.md`。

否则会再次落入“文档先进、runtime 落后”的陷阱。
