# Spec-First v8-lite - 轻量增强方案

> **版本**: 8-lite.1
> **日期**: 2026-03-27
> **状态**: 推荐实施方案
> **定位**: 保留 v8 优点，去掉架构复杂度

---

## 1. 方案定位

### 问题

v8 完整方案虽然架构清晰，但存在以下问题：

1. **过度抽象** - workflow → action → selector → capability 四层推导
2. **改动过大** - task.json 结构大改，破坏性变更
3. **维护成本高** - 新增 3300+ 行代码，14+ 个文件
4. **收益不明显** - 大部分功能当前架构已支持

### v8-lite 的目标

**用最小改动，获得最大实用价值**

- ✅ 保留 v8 的 UX 增强（Preset、explain）
- ✅ 保留 v8 的质量门禁思想
- ✅ 保留 v8 的证据记录
- ❌ 去掉复杂的 selector/capability 层
- ❌ 去掉 workflow 推导逻辑
- ❌ 去掉平台分层消费

---

## 2. 核心设计原则

### 2.1 直接存储，不推导

**v8 方案**：
```json
{
  "workflow": {"steps": [...], "current_step": 0},
  "selector": {"current": null}
}
// 需要推导：workflow.steps[current_step] → action → selector
```

**v8-lite 方案**：
```json
{
  "workflow_type": "default",
  "current_action": "implement"  // 直接存储
}
// 直接读取，无需推导
```

### 2.2 重命名，不重构

**v8 方案**：删除 `decision_hints`，新增 `action_config`

**v8-lite 方案**：`decision_hints` 重命名为 `action_config`，保持结构

### 2.3 增强，不替换

**v8 方案**：引入全新的 capability 系统

**v8-lite 方案**：在现有基础上增加 preset 和 explain

---

## 3. 改动内容

### 改动 1：优化 task.json 字段（最小改动）

#### 3.1 字段变更

| 操作 | 字段 | 说明 |
|------|------|------|
| **重命名** | `decision_hints` → `action_config` | 语义更清晰 |
| **新增** | `evidence` | 记录执行证据 |
| **保留** | `current_phase` | 兼容现有逻辑 |
| **保留** | `next_action` | 兼容现有逻辑 |
| **保留** | `workflow_type` | 已有字段 |

#### 3.2 新 task.json 结构

```json
{
  "id": "fix-login-bug",
  "title": "Fix login bug",
  "status": "planning",
  "dev_type": "backend",
  "package": "api",
  "priority": "P1",

  "workflow_type": "default",
  "current_phase": 0,
  "next_action": [
    {"action": "implement"},
    {"action": "check"},
    {"action": "finish"},
    {"action": "create-pr"}
  ],

  "action_config": {
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck"]
    }
  },

  "evidence": {
    "verify_result": {
      "commands": ["pnpm lint", "pnpm typecheck"],
      "status": "passed",
      "timestamp": "2026-03-27T12:00:00Z"
    },
    "finish_note": "",
    "release_note": ""
  },

  "creator": "kuang",
  "assignee": "kuang",
  "createdAt": "2026-03-27",
  "branch": null,
  "commit": null,
  "pr_url": null,
  "meta": {}
}
```

#### 3.3 迁移策略

**向后兼容**：
- 保留 `decision_hints` 字段，同时支持 `action_config`
- 读取时优先使用 `action_config`，回退到 `decision_hints`
- 写入时同时更新两个字段（过渡期）

```python
# 兼容读取
def get_action_config(task_data: dict) -> dict:
    return task_data.get("action_config") or task_data.get("decision_hints", {})
```

---

### 改动 2：增加 Preset 快捷命令

#### 3.4 Preset 定义

**文件位置**：`.spec-first/config/presets.json`

```json
{
  "presets": {
    "quick-fix": {
      "workflow_type": "quick-fix",
      "description": "快速修复、typo、文案修改"
    },
    "feature-dev": {
      "workflow_type": "default",
      "description": "标准功能开发"
    },
    "bug-debug": {
      "workflow_type": "default",
      "description": "复杂 bug 调试"
    },
    "docs-update": {
      "workflow_type": "docs-only",
      "description": "文档更新"
    }
  }
}
```

#### 3.5 使用方式

```bash
# 使用 preset 创建任务
spec-first task create "Fix login bug" --preset bug-debug

# 等价于
spec-first task create "Fix login bug" --workflow default
```

#### 3.6 实现要点

- Preset 只是命令行参数的批量设置
- 不引入新的配置层
- 不参与运行时逻辑

---

### 改动 3：增加 explain 命令

#### 3.7 命令功能

显示当前任务的执行状态和配置来源

```bash
$ spec-first task explain

Current Task: fix-login-bug
Status: in_progress
Workflow: default

Current Action: implement
Next Actions:
  1. check
  2. finish
  3. create-pr

Action Config:
  check.verify_commands:
    - pnpm lint
    - pnpm typecheck
  Source: workflow default profile

Evidence:
  verify_result: not_run
  finish_note: empty
  release_note: empty

To customize:
  $ spec-first task update --workflow <type>
  $ spec-first task update --package <path>
```

#### 3.8 实现要点

- 读取 task.json 并格式化输出
- 显示配置来源（默认 profile / 用户覆写）
- 提示下一步操作

---

## 4. 实现范围

### 4.1 文件改动清单

| 文件 | 改动类型 | 代码量 |
|------|---------|--------|
| `.spec-first/scripts/common/task_store.py` | 修改 | ~50 行 |
| `.spec-first/scripts/task.py` | 新增命令 | ~100 行 |
| `.spec-first/config/presets.json` | 新增 | 1 个文件 |
| `packages/cli/src/commands/init.ts` | 模板更新 | ~50 行 |
| 测试文件 | 新增 | ~250 行 |

**总计**：~450 行代码，3 个新文件

### 4.2 实施步骤

#### Step 1: 更新 task.json 模板（1 天）

1. 修改 `cmd_create()` 生成逻辑
2. 添加 `action_config` 和 `evidence` 字段
3. 保持向后兼容

#### Step 2: 实现 Preset 系统（1 天）

1. 创建 `presets.json` 配置文件
2. 在 `task.py` 中添加 `--preset` 参数解析
3. 展开 preset 到标准参数

#### Step 3: 实现 explain 命令（1 天）

1. 添加 `cmd_explain()` 函数
2. 格式化输出当前任务状态
3. 显示配置来源和下一步提示

#### Step 4: 更新平台模板（1 天）

1. 更新 Claude/iFlow hook 读取 `action_config`
2. 更新 Codex/Kiro skill 读取 `action_config`
3. 保持向后兼容（同时支持 `decision_hints`）

#### Step 5: 测试和文档（1 天）

1. 单元测试
2. 集成测试
3. 更新用户文档

**总工期**：5 天

---

## 5. 质量门禁（轻量版）

### 5.1 关键动作节点

保留 v8 的质量门禁思想，但简化实现：

| Action | 门禁条件 | 实现方式 |
|--------|---------|---------|
| `implement` | 无 | 直接执行 |
| `check` | verify_commands 不为空 | hook 检查 |
| `finish` | check 已通过 | hook 检查 evidence |
| `create-pr` | finish_note 不为空 | hook 检查 evidence |

### 5.2 实现方式

在现有 hook 中添加简单检查：

```python
# .claude/hooks/before-check.py
def check_gate(task_data: dict) -> bool:
    action_config = task_data.get("action_config", {})
    verify_commands = action_config.get("check", {}).get("verify_commands", [])

    if not verify_commands:
        print("Error: check.verify_commands is empty")
        return False

    return True
```

**无需**：
- 复杂的 selector 系统
- capability registry
- 多层推导逻辑

---

## 6. 证据记录（轻量版）

### 6.1 evidence 结构

```json
{
  "evidence": {
    "verify_result": {
      "commands": ["pnpm lint", "pnpm typecheck"],
      "status": "passed",
      "timestamp": "2026-03-27T12:00:00Z",
      "output": ""
    },
    "finish_note": "Implemented login bug fix, all tests pass",
    "release_note": "Fix: resolve login timeout issue"
  }
}
```

### 6.2 写入时机

- `check` 完成后写入 `verify_result`
- `finish` 完成后写入 `finish_note`
- `create-pr` 完成后写入 `release_note`

### 6.3 实现方式

在 hook 中直接写入 task.json：

```python
# .claude/hooks/after-check.py
def record_verify_result(task_json_path: Path, result: dict):
    data = read_json(task_json_path)
    if not data.get("evidence"):
        data["evidence"] = {}

    data["evidence"]["verify_result"] = result
    write_json(task_json_path, data)
```

---

## 7. 对比分析

### 7.1 功能对比

| 功能 | v8 完整方案 | v8-lite | 当前方案 |
|------|------------|---------|---------|
| Preset 快捷命令 | ✅ | ✅ | ❌ |
| explain 命令 | ✅ | ✅ | ❌ |
| 质量门禁 | ✅ 复杂 | ✅ 简单 | ❌ |
| 证据记录 | ✅ | ✅ | ❌ |
| 多角色支持 | ✅ | ✅ | ✅ |
| 向后兼容 | ❌ | ✅ | ✅ |

### 7.2 复杂度对比

| 维度 | v8 完整方案 | v8-lite | 当前方案 |
|------|------------|---------|---------|
| 新增代码 | ~3300 行 | ~450 行 | 0 行 |
| 新增文件 | 14+ 个 | 3 个 | 0 个 |
| 新增概念 | 4 层抽象 | 0 层 | 0 层 |
| 破坏性变更 | 高 | 低 | 无 |
| 学习成本 | 高 | 低 | 低 |
| 维护成本 | 高 | 低 | 低 |

### 7.3 收益对比

| 收益点 | v8 完整方案 | v8-lite | 说明 |
|--------|------------|---------|------|
| UX 提升 | ⭐⭐⭐ | ⭐⭐⭐ | Preset 和 explain 都有 |
| 质量提升 | ⭐⭐⭐ | ⭐⭐ | 门禁简化但够用 |
| 可维护性 | ⭐⭐ | ⭐⭐⭐ | 简单架构更易维护 |
| 可扩展性 | ⭐⭐⭐ | ⭐⭐ | 够用即可 |
| 实施风险 | ⭐ | ⭐⭐⭐ | 改动小，风险低 |

---

## 8. 为什么 v8-lite 更好

### 8.1 实用主义

**v8 的问题**：为了"理论上的灵活性"引入复杂架构

**v8-lite 的优势**：只解决实际问题

- ✅ Preset 解决"创建任务参数多"的问题
- ✅ explain 解决"不知道当前状态"的问题
- ✅ evidence 解决"执行结果不可追溯"的问题
- ✅ 门禁解决"质量不可控"的问题

### 8.2 渐进式改进

**v8 的问题**：一次性大改造，风险高

**v8-lite 的优势**：分步实施，随时可停

1. 先实施 Preset（独立功能）
2. 再实施 explain（独立功能）
3. 最后实施 evidence（可选）

每一步都是独立的，可以单独上线验证。

### 8.3 向后兼容

**v8 的问题**：破坏性变更，现有任务需迁移

**v8-lite 的优势**：完全兼容

- 同时支持 `decision_hints` 和 `action_config`
- 现有任务无需迁移
- 新任务自动使用新字段

---

## 9. 实施建议

### 9.1 推荐顺序

#### Phase 1: Preset 系统（优先级 P0）

**收益**：立即提升 UX
**风险**：低（独立功能）
**工期**：1 天

#### Phase 2: explain 命令（优先级 P1）

**收益**：提升可观测性
**风险**：低（只读功能）
**工期**：1 天

#### Phase 3: evidence 记录（优先级 P2）

**收益**：提升质量追溯
**风险**：中（需要 hook 改造）
**工期**：2 天

#### Phase 4: 质量门禁（优先级 P2）

**收益**：提升执行质量
**风险**：中（可能阻塞流程）
**工期**：1 天

### 9.2 验收标准

#### Phase 1 验收

- [ ] `--preset` 参数可用
- [ ] 4 个默认 preset 可用
- [ ] preset 正确展开为标准参数

#### Phase 2 验收

- [ ] `explain` 命令可用
- [ ] 显示当前 action 和配置
- [ ] 显示下一步提示

#### Phase 3 验收

- [ ] `evidence` 字段正确写入
- [ ] check 结果可追溯
- [ ] finish/release note 可查看

#### Phase 4 验收

- [ ] check 门禁生效
- [ ] finish 门禁生效
- [ ] create-pr 门禁生效

---

## 10. 风险评估

### 10.1 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 向后兼容问题 | 低 | 同时支持新旧字段 |
| hook 改造失败 | 低 | 保留原有逻辑 |
| 门禁过严阻塞 | 中 | 提供 bypass 选项 |

### 10.2 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 用户学习成本 | 低 | 功能可选，不强制 |
| 现有流程中断 | 低 | 完全向后兼容 |
| 推广困难 | 低 | 渐进式推广 |

---

## 11. 总结

### 11.1 核心优势

1. **最小改动** - 只改 450 行代码
2. **最大收益** - UX、质量、可观测性全面提升
3. **最低风险** - 向后兼容，渐进式实施
4. **最易维护** - 无复杂抽象，逻辑直接

### 11.2 一句话总结

**v8-lite 用 15% 的改动，获得 80% 的收益。**

---

## 12. 附录

### 12.1 代码示例

#### 示例 1: Preset 解析

```python
def resolve_preset(preset_name: str) -> dict:
    """Resolve preset to standard parameters."""
    presets = load_presets()
    preset = presets.get(preset_name)

    if not preset:
        raise ValueError(f"Unknown preset: {preset_name}")

    return {
        "workflow_type": preset.get("workflow_type", "default")
    }
```

#### 示例 2: explain 命令

```python
def cmd_explain(args: argparse.Namespace) -> int:
    """Show current task status and config."""
    task_data = load_current_task()

    print(f"Current Task: {task_data['id']}")
    print(f"Status: {task_data['status']}")
    print(f"Workflow: {task_data['workflow_type']}")
    print()

    current_phase = task_data['current_phase']
    next_action = task_data['next_action']

    if current_phase < len(next_action):
        current = next_action[current_phase]
        print(f"Current Action: {current['action']}")
        print("Next Actions:")
        for i in range(current_phase + 1, len(next_action)):
            print(f"  {i - current_phase}. {next_action[i]['action']}")

    print()
    print("Action Config:")
    action_config = get_action_config(task_data)
    for action, config in action_config.items():
        print(f"  {action}:")
        for key, value in config.items():
            print(f"    {key}: {value}")

    return 0
```

#### 示例 3: 质量门禁

```python
def check_gate(task_data: dict) -> bool:
    """Check if task can proceed to check action."""
    action_config = get_action_config(task_data)
    check_config = action_config.get("check", {})
    verify_commands = check_config.get("verify_commands", [])

    if not verify_commands:
        print("Error: check.verify_commands is empty")
        print("Please configure verify commands first:")
        print("  $ spec-first task update --verify-commands 'pnpm lint,pnpm typecheck'")
        return False

    return True
```

---

**文档版本**: 8-lite.1
**最后更新**: 2026-03-27
**维护者**: spec-first 团队
