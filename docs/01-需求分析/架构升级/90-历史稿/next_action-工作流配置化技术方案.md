# next_action 工作流配置化技术方案

> **版本**: v1.0  
> **状态**: 待实施  
> **破坏性变更**: 是（允许一次性迁移）

---

## 1. 背景与问题

### 1.1 当前实现

当前 `next_action` 在代码中是硬编码的固定 4 phase 流程：

```python
# task_store.py 第 165-170 行
"next_action": [
    {"phase": 1, "action": "implement"},
    {"phase": 2, "action": "check"},
    {"phase": 3, "action": "finish"},
    {"phase": 4, "action": "create-pr"},
]
```

### 1.2 核心问题

| 问题 | 说明 |
|------|------|
| 硬编码流程 | 所有任务使用相同 4 phase，无法定制 |
| 缺乏任务类型感知 | `dev_type` 只影响 specs，不影响流程 |
| 单一工作流假设 | 假设所有任务都需要 `create-pr` |
| 无门控机制 | phase 之间无强制验证，可绕过关键步骤 |

### 1.3 场景适配性分析

| 场景 | 当前适配性 | 理想流程 |
|------|------------|----------|
| 研发任务 | ✅ 好 | `implement → check → finish → create-pr` |
| Bug 修复 | ⚠️ 一般 | `debug-systematic → implement → check → create-pr` |
| 测试任务 | ⚠️ 一般 | `implement → check`（无 `finish/spec` 同步） |
| 文档任务 | ⚠️ 一般 | `implement → check`（无 `create-pr`） |
| 紧急修复 | ❌ 差 | `implement → check → create-pr`（快速流程） |
| 重构任务 | ⚠️ 一般 | `implement → check → review → finish → create-pr` |
| 探索性任务 | ❌ 差 | `research → brainstorm → implement → check` |

---

## 2. 设计目标

1. **零配置可用** - 默认工作流保持向后兼容
2. **可配置** - 支持项目级和任务级定制
3. **门控机制** - Phase 之间支持强制验证
4. **场景适配** - 预设多种工作流模板

---

## 3. 架构设计

### 3.1 三层配置体系

```text
┌─────────────────────────────────────────────────────┐
│ Layer 1: 硬编码默认值 (零配置可用)                  │
│ - DEFAULT_WORKFLOWS 字典                            │
│ - 7 种预设工作流模板                                │
└─────────────────────────────────────────────────────┘
                        ↓ 可覆盖
┌─────────────────────────────────────────────────────┐
│ Layer 2: config.yaml 项目级配置 (可选)              │
│ - workflows:                                        │
│     default: { ... }                                │
│     custom: { ... }                                 │
└─────────────────────────────────────────────────────┘
                        ↓ 可覆盖
┌─────────────────────────────────────────────────────┐
│ Layer 3: task.json 实例级配置 (任务级)              │
│ - workflow: { type: "with-tdd", phases: [...] }     │
└─────────────────────────────────────────────────────┘
```

### 3.2 核心数据结构

#### 3.2.1 工作流配置 Schema

```ts
// 工作流配置
interface WorkflowConfig {
  type: string;              // 工作流类型标识
  requires_tdd: boolean;     // 是否需要 TDD
  requires_review: boolean;  // 是否需要代码审查
  phases: PhaseConfig[];     // 阶段配置列表
}

// 单个阶段配置
interface PhaseConfig {
  phase: number;             // 阶段编号 (从 1 开始)
  action: string;            // 动作类型
  gate?: string;             // 前置门控 (可选)
  loop?: {                   // 循环配置 (可选)
    max: number;             // 最大循环次数
    gate: string;            // 循环退出条件
  };
}
```

#### 3.2.2 改进的 `task.json` 结构

```json
{
  "id": "add-workflow",
  "title": "Add workflow templates",
  "status": "planning",

  "workflow": {
    "type": "with-tdd",
    "requires_tdd": true,
    "requires_review": false,
    "phases": [
      {"phase": 1, "action": "tdd"},
      {"phase": 2, "action": "implement", "gate": "tests_written"},
      {"phase": 3, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
      {"phase": 4, "action": "finish", "gate": "spec_updated"},
      {"phase": 5, "action": "create-pr"}
    ]
  },

  "current_phase": 0,
  "next_action": []
}
```

说明：

- `workflow` 是新的配置化入口
- `next_action` 可保留作为兼容字段，或者作为运行时展开结果

---

## 4. 预设工作流模板

### 4.1 模板定义

| 模板名 | Phases | 适用场景 | 说明 |
|--------|--------|----------|------|
| `default` | `implement → check → finish → create-pr` | 常规研发 | 4 阶段标准流程 |
| `quick-fix` | `implement → check → create-pr` | 紧急修复 | 3 阶段快速流程，`check` 最多 3 次 |
| `with-tdd` | `tdd → implement → check → finish → create-pr` | 质量优先 | 5 阶段，含 TDD 门控 |
| `with-review` | `implement → check → review → finish → create-pr` | 团队协作 | 5 阶段，含代码审查 |
| `docs-only` | `implement → check` | 文档任务 | 2 阶段，无 PR |
| `debug` | `debug-systematic → implement → check → create-pr` | Bug 修复 | 4 阶段，含系统调试 |
| `research` | `research → brainstorm → implement → check` | 探索性任务 | 4 阶段，无 PR |

### 4.2 详细配置

```python
DEFAULT_WORKFLOWS = {
    "default": {
        "type": "default",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement"},
            {"phase": 2, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
            {"phase": 3, "action": "finish"},
            {"phase": 4, "action": "create-pr"},
        ],
    },

    "quick-fix": {
        "type": "quick-fix",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement"},
            {"phase": 2, "action": "check", "loop": {"max": 3, "gate": "lint_and_typecheck_pass"}},
            {"phase": 3, "action": "create-pr"},
        ],
    },

    "with-tdd": {
        "type": "with-tdd",
        "requires_tdd": True,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "tdd"},
            {"phase": 2, "action": "implement", "gate": "tests_written"},
            {"phase": 3, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
            {"phase": 4, "action": "finish", "gate": "spec_updated"},
            {"phase": 5, "action": "create-pr"},
        ],
    },

    "with-review": {
        "type": "with-review",
        "requires_tdd": False,
        "requires_review": True,
        "phases": [
            {"phase": 1, "action": "implement"},
            {"phase": 2, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
            {"phase": 3, "action": "review"},
            {"phase": 4, "action": "finish", "gate": "spec_updated"},
            {"phase": 5, "action": "create-pr"},
        ],
    },

    "docs-only": {
        "type": "docs-only",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement"},
            {"phase": 2, "action": "check", "loop": {"max": 3, "gate": "lint_pass"}},
        ],
    },

    "debug": {
        "type": "debug",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "debug-systematic"},
            {"phase": 2, "action": "implement", "gate": "root_cause_found"},
            {"phase": 3, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
            {"phase": 4, "action": "create-pr"},
        ],
    },

    "research": {
        "type": "research",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "research"},
            {"phase": 2, "action": "brainstorm"},
            {"phase": 3, "action": "implement"},
            {"phase": 4, "action": "check", "loop": {"max": 5, "gate": "lint_and_typecheck_pass"}},
        ],
    },
}
```

---

## 5. 门控机制设计

### 5.1 门控类型

| 门控名称 | 检查逻辑 | 使用场景 |
|----------|----------|----------|
| `tests_written` | 检查是否存在测试文件 | TDD 流程 |
| `lint_pass` | 运行 lint 检查通过 | check 阶段 |
| `lint_and_typecheck_pass` | `lint + typecheck` 都通过 | check 阶段 |
| `spec_updated` | 检查 spec 文件是否有更新 | finish 阶段 |
| `root_cause_found` | 检查 debug 记录是否包含根因 | debug 流程 |
| `review_approved` | 检查 PR 是否有批准 | review 阶段 |

### 5.2 门控检查函数

```python
# gate.py

def check_gate(gate_name: str, task_dir: Path) -> GateResult:
    """
    检查门控条件是否满足。

    Returns:
        GateResult(passed=True/False, message="...", details={})
    """
    gate_handlers = {
        "tests_written": check_tests_written,
        "lint_pass": check_lint_pass,
        "lint_and_typecheck_pass": check_lint_and_typecheck_pass,
        "spec_updated": check_spec_updated,
        "root_cause_found": check_root_cause_found,
        "review_approved": check_review_approved,
    }

    handler = gate_handlers.get(gate_name)
    if not handler:
        return GateResult(passed=False, message=f"Unknown gate: {gate_name}")

    return handler(task_dir)
```

### 5.3 门控在 dispatch 中的集成

```python
# dispatch.md 中的伪代码

for phase in next_action:
    if phase.get("gate"):
        result = check_gate(phase["gate"], task_dir)
        if not result.passed:
            print(f"Gate '{phase['gate']}' not passed: {result.message}")
            print("Options: 1) Fix issues 2) Skip gate 3) Abort")
            return

    execute_phase(phase["action"])
```

---

## 6. 文件修改清单

### 6.1 新增文件

| 文件路径 | 用途 |
|----------|------|
| `.spec-first/scripts/common/workflow_templates.py` | 工作流模板定义 |
| `.spec-first/scripts/common/gate.py` | 门控检查机制 |
| `.claude/commands/spec/debug-systematic.md` | 4 阶段调试 skill |
| `.claude/commands/spec/verification-gate.md` | 验证门控 skill |

### 6.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `.spec-first/scripts/common/task_store.py` | 添加 `--workflow` 参数支持 |
| `.spec-first/scripts/common/types.py` | 添加 `WorkflowConfig` 类型定义 |
| `.spec-first/scripts/task.py` | CLI 添加 `--workflow` 选项 |
| `.claude/agents/dispatch.md` | 添加门控检查逻辑 |
| `.claude/agents/implement.md` | 添加 TDD 模式支持 |

---

## 7. API 变更

### 7.1 CLI 命令变更

```bash
# 创建任务时指定工作流
python3 task.py create "Add feature" --workflow with-tdd

# 查看可用工作流
python3 task.py list-workflows

# 修改任务工作流
python3 task.py set-workflow <dir> <workflow-type>
```

### 7.2 `task.json` 字段变更

```diff
{
  "id": "add-feature",
  "title": "Add feature",
+ "workflow": {
+   "type": "default",
+   "requires_tdd": false,
+   "requires_review": false,
+   "phases": [...]
+ },
  "current_phase": 0,
  "next_action": [...]
}
```

---

## 8. 实施计划

### Phase 1: 配置化工作流 (P0) - 预计 2h

1. 创建 `workflow_templates.py`
2. 修改 `task_store.py` 支持 `--workflow`
3. 更新 `task.py` CLI
4. 编写单元测试

### Phase 2: 门控机制 (P0) - 预计 2h

1. 创建 `gate.py`
2. 实现基础门控检查函数
3. 修改 `dispatch.md` 集成门控
4. 编写单元测试

### Phase 3: 新增 Skills (P1) - 预计 3h

1. 创建 `debug-systematic.md` - 4 阶段系统调试
2. 创建 `verification-gate.md` - 验证门控
3. 更新文档

### Phase 4: TDD 集成 (P2) - 预计 2h

1. 修改 `implement.md` 支持 TDD 模式
2. 添加 `Red-Green-Refactor` 循环
3. 编写集成测试

---

## 9. 验证方案

### 9.1 单元测试

```bash
# 测试工作流模板
vitest run test/common/workflow_templates.test.ts

# 测试门控机制
vitest run test/common/gate.test.ts
```

### 9.2 集成测试

```bash
# 创建不同类型任务并验证
python3 task.py create "Feature" --workflow with-tdd
python3 task.py create "Fix bug" --workflow debug
python3 task.py create "Docs" --workflow docs-only

# 验证 next_action 正确生成
cat .spec-first/tasks/*/task.json | jq '.next_action'
```

### 9.3 端到端测试

```bash
# 完整工作流测试
pnpm test
```

---

## 10. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| ~~向后兼容性~~ | 不需要，允许破坏性变更 |
| 学习成本 | 提供 `--workflow` 自动补全和帮助文档 |
| 复杂度增加 | 保持零配置可用，高级功能可选 |
| 门控过于严格 | 提供跳过门控选项 |

---

## 11. 总结

### 11.1 改进前 vs 改进后

| 维度 | 改进前 | 改进后 |
|------|--------|--------|
| 简单性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐（保持零配置可用） |
| 通用性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐（支持所有场景） |
| 灵活性 | ⭐ | ⭐⭐⭐⭐（可配置模板） |
| 质量保障 | ⭐⭐ | ⭐⭐⭐⭐（添加门控机制） |

### 11.2 核心价值

1. **场景适配** - 不同类型任务使用不同工作流
2. **质量保障** - 门控机制防止跳过关键步骤
3. **可扩展** - 支持项目级和任务级定制
4. **零配置** - 默认行为保持不变
