# Phase 1: 建立最小闭环 - Compiler + Contract + Enforcement

## Goal

建立 compiler + contract + enforcement 的基础架构，让系统从"写死的 workflow"转变为"编译后的 contract"。

## Requirements

基于 [整体方案 v2.1](../../../docs/01-需求分析/架构升级/10-主方案/整体方案-目标架构与三阶段实施.md) 实施 Phase 1。

### 核心改造

1. **task_store.py 成为编译器**
   - 接收 `--workflow` 参数
   - 编译 workflow_type → next_action
   - 生成默认 decision_hints

2. **task.json 增加字段**
   - workflow_type: "default" | "quick-fix" | "docs-only"
   - decision_hints: {implement, check}
   - evidence: null (预留)

3. **hooks 消费 contract**
   - inject-subagent-context.py 注入 decision_hints
   - ralph-loop.py 优先读取 task.json.decision_hints.check.verify_commands

## Acceptance Criteria

### Step 1: types.py
- [ ] TaskData 包含 workflow_type: str
- [ ] TaskData 包含 decision_hints: dict
- [ ] TaskData 包含 evidence: dict | None
- [ ] 类型检查通过

### Step 2: task_store.py
- [ ] cmd_create() 接受 --workflow 参数
- [ ] 无效的 workflow_type 会报错
- [ ] task.json 包含 workflow_type
- [ ] task.json 包含 next_action (从 workflow 生成)
- [ ] task.json 包含 decision_hints (默认值)

### Step 3: task.py
- [ ] CLI 支持 --workflow 参数
- [ ] 只允许 default/quick-fix/docs-only
- [ ] help 文档已更新

### Step 4: inject-subagent-context.py
- [ ] implement agent 收到 decision_hints.implement
- [ ] check agent 收到 decision_hints.check
- [ ] 缺少 decision_hints 时有 fallback

### Step 5: ralph-loop.py
- [ ] 优先读取 task.json.decision_hints.check.verify_commands
- [ ] Fallback 到 worktree.yaml
- [ ] 两处都没有时使用 completion markers

### 集成测试
- [ ] 创建新任务 (default workflow)
- [ ] 运行 implement → check 流程
- [ ] verify commands 被正确执行
- [ ] 验证 evidence 字段已预留

## Technical Approach

### 实施顺序

```
Step 1 (types.py) - 30 分钟
   ↓
Step 2 (task_store.py) - 3-4 小时
   ↓
Step 3 (task.py) - 30 分钟
   ↓
Step 4 (inject-subagent-context.py) ← 可并行 - 2-3 小时
Step 5 (ralph-loop.py)              ← 可并行 - 1-2 小时
   ↓
集成测试 - 1-2 小时
```

**总工作量**: 10-15 小时 (约 2 个工作日)

## Out of Scope

- Phase 2 preset (with-tdd, debug)
- Phase 3 evidence 实现
- 多平台统一
- 复杂的 workflow DSL

## Technical Notes

### Schema 定义

```typescript
interface DecisionHints {
  implement?: {
    mode: "standard";
  };
  check?: {
    verify_commands: string[];
  };
}
```

### 默认值

```python
DEFAULT_DECISION_HINTS = {
    "default": {
        "implement": {"mode": "standard"},
        "check": {"verify_commands": ["pnpm lint", "pnpm typecheck"]}
    },
    "quick-fix": {
        "implement": {"mode": "standard"},
        "check": {"verify_commands": ["pnpm lint"]}
    },
    "docs-only": {
        "implement": {"mode": "standard"},
        "check": {"verify_commands": ["pnpm lint"]}
    }
}
```

### 关键文件

- `.spec-first/scripts/common/types.py`
- `.spec-first/scripts/common/task_store.py`
- `.spec-first/scripts/task.py`
- `.claude/hooks/inject-subagent-context.py`
- `.claude/hooks/ralph-loop.py`
