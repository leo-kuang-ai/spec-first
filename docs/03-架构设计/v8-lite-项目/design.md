# v8-lite 项目设计文档

> **创建日期**: 2026-03-27
> **状态**: Draft
> **目标**: 为 spec-first 引入智能 Skill 选择能力

---

## 1. 项目目标

### 核心问题
当前 spec-first 无法根据任务类型自动选择合适的 skill，导致：
- 每次都需要手动配置 skill
- 不同任务类型（backend/frontend/debug）无法自动适配
- 缺少可观测性，不知道当前使用了哪些 skill

### 解决方案
实现最小化的 skill 自动选择机制：
- 根据 `dev_type + task_mode + action` 自动查表选择 skill
- 新增 `explain` 命令提供可观测性
- 保持向后兼容，零破坏性改动

### 成功标准
- [ ] 创建任务时自动生成 `selected_skills` 字段
- [ ] `explain` 命令能显示当前 action 和对应 skills
- [ ] Hook 能正确注入 skill 内容
- [ ] 现有任务继续正常工作

---

## 2. 架构设计

### 2.1 核心组件

```
┌─────────────────────────────────────────────────────────┐
│ Task Creation (task_store.py)                          │
│ - 读取 skill-profiles.json                             │
│ - 调用 skill_resolver.resolve_skills()                 │
│ - 生成 selected_skills 字段                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ task.json                                               │
│ {                                                       │
│   "task_mode": "debug",                                 │
│   "selected_skills": {                                  │
│     "implement": ["before-dev", "systematic-debugging"],│
│     "check": ["check", "finish-work"]                   │
│   }                                                     │
│ }                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ explain 命令     │    │ Hook 注入            │
│ (task.py)        │    │ (inject-subagent-    │
│                  │    │  context.py)         │
│ 显示当前 action  │    │                      │
│ 和 skills        │    │ 读取 selected_skills │
│                  │    │ 注入 skill 内容      │
└──────────────────┘    └──────────────────────┘
```

### 2.2 数据流

```
1. 用户创建任务
   ↓
2. task_store.py 读取 skill-profiles.json
   ↓
3. skill_resolver.resolve_skills(dev_type, task_mode, action)
   ↓
4. 写入 task.json.selected_skills
   ↓
5a. 用户运行 explain → 显示当前 skills
5b. Hook 触发 → 注入对应 skill 内容
```

### 2.3 查表逻辑

**优先级**（从高到低）：
1. `{dev_type}-{task_mode}-{action}` - 精确匹配
2. `{dev_type}-*-{action}` - dev_type 匹配
3. `*-{task_mode}-{action}` - task_mode 匹配
4. `*-*-{action}` - action 匹配
5. `defaults.{action}` - 默认值

**示例**：
```python
# backend + debug + implement
keys = [
    "backend-debug-implement",  # 优先
    "backend-*-implement",
    "*-debug-implement",
    "*-*-implement",
    defaults["implement"]       # 兜底
]
```

---

## 3. 技术方案

### 3.1 新增文件

#### skill_resolver.py (~50 行)
```python
# .spec-first/scripts/common/skill_resolver.py

def resolve_skills(
    dev_type: str | None,
    task_mode: str,
    action: str,
    config_path: Path
) -> list[str]:
    """根据任务属性解析 skill 列表"""
    # 读取配置
    # 构建查找键
    # 按优先级查找
    # 返回 skill 列表
```

#### skill-profiles.json (配置文件)
```json
{
  "profiles": {
    "backend-debug-implement": ["before-dev", "systematic-debugging"],
    "backend-default-implement": ["before-dev", "backend-patterns"],
    "*-*-check": ["check", "finish-work"]
  },
  "defaults": {
    "implement": ["before-dev"],
    "check": ["check"]
  }
}
```

### 3.2 修改文件

#### task_store.py (~20 行改动)
在 `cmd_create()` 中：
1. 新增 `task_mode` 参数解析
2. 调用 `resolve_skills()` 为每个 action 解析 skills
3. 在 task_data 中添加 `task_mode` 和 `selected_skills` 字段

#### task.py (~80 行新增)
新增 `cmd_explain()` 函数：
1. 读取当前任务的 task.json
2. 显示当前 action
3. 显示对应的 selected_skills
4. 格式化输出

#### inject-subagent-context.py (~30 行改动)
新增 `inject_skills_for_action()` 函数：
1. 读取 task.json.selected_skills
2. 根据当前 action 获取 skill 列表
3. 读取对应的 skill 文件内容
4. 拼接返回

---

## 4. task.json 结构变更

### 4.1 新增字段

```json
{
  "id": "fix-login-bug",
  "workflow_type": "default",
  "current_phase": 0,
  "next_action": [
    {"action": "implement"},
    {"action": "check"}
  ],
  "decision_hints": {...},

  // 新增字段
  "task_mode": "debug",
  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"]
  }
}
```

### 4.2 向后兼容

- 保留所有现有字段
- `task_mode` 默认值为 "default"
- `selected_skills` 为空时使用默认 skill
- 现有任务无需迁移

---

## 5. 实施计划

### Phase 1: 核心功能（2 天）
**目标**: 实现 skill 自动选择

**任务**:
1. 创建 `skill_resolver.py`
2. 创建 `skill-profiles.json`
3. 修改 `task_store.py` 集成 resolver
4. 添加 `--task-mode` CLI 参数

**验收**:
- 创建任务后 task.json 包含 `selected_skills`
- 不同 dev_type/task_mode 生成不同 skills

### Phase 2: 可观测性（1 天）
**目标**: 实现 explain 命令

**任务**:
1. 在 `task.py` 中实现 `cmd_explain()`
2. 添加 CLI 子命令注册
3. 测试输出格式

**验收**:
- `python3 ./.spec-first/scripts/task.py explain` 正确显示
- 显示当前 action 和对应 skills

### Phase 3: Hook 集成（1 天）
**目标**: Hook 自动注入 skill

**任务**:
1. 修改 `inject-subagent-context.py`
2. 实现 skill 内容读取和拼接
3. 测试注入功能

**验收**:
- Hook 正确读取 selected_skills
- Skill 内容正确注入到 agent context

### Phase 4: 测试和文档（1 天）
**目标**: 质量保证

**任务**:
1. 端到端测试
2. 更新用户文档
3. 添加示例配置

**验收**:
- 所有测试通过
- 文档完整

---

## 6. 风险评估

### 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 配置文件格式错误 | 低 | 添加 JSON schema 验证 |
| Hook 注入失败 | 低 | 保留原有逻辑作为回退 |
| 向后兼容问题 | 低 | 充分测试现有任务 |

### 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 用户不理解 task_mode | 低 | 提供默认值和文档 |
| 自动选择不符预期 | 中 | 支持手动编辑 task.json |

---

## 7. 后续扩展

### 可选增强（不在当前范围）

1. **智能决策增强**
   - 根据任务上下文（文件数、关键词）动态添加 skills
   - 实现 enhancement_rules 机制

2. **Skill 依赖管理**
   - 定义 skill 之间的依赖关系
   - 自动解决冲突

3. **平台特定配置**
   - 为不同平台（Claude/Codex/Kiro）生成不同配置

---

## 8. 总结

### 核心优势
1. **极简** - 只需 ~180 行新代码
2. **零破坏** - 完全向后兼容
3. **实用** - 解决实际痛点
4. **可扩展** - 后续可叠加增强

### 实施原则
1. **最小可用** - Phase 1 即可独立使用
2. **渐进增强** - Phase 2-4 可选实施
3. **质量优先** - 每个 Phase 都有明确验收标准

---

**文档版本**: 1.0
**最后更新**: 2026-03-27
**维护者**: spec-first 团队
