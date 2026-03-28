# v8-lite 项目需求文档

> **版本**: 1.0
> **日期**: 2026-03-28
> **状态**: Draft
> **负责人**: spec-first 团队

---

## 1. 项目背景

### 1.1 当前问题

**核心痛点**：spec-first 无法根据任务类型自动选择合适的 skill，导致效率低下和配置繁琐。

**具体问题**：

1. **手动配置繁琐**
   - 每次创建任务都需要手动指定 skill
   - 不同任务类型（backend/frontend/debug）需要不同 skill
   - 容易配置错误，导致使用了不合适的 skill

2. **缺乏可观测性**
   - 不知道当前 action 使用了哪些 skill
   - 不知道 agent 会注入什么内容
   - 调试困难，无法快速定位问题

3. **重复劳动**
   - backend debug 任务总是需要 systematic-debugging skill
   - frontend 任务总是需要 frontend-patterns skill
   - 每次都要重复相同的配置

**具体场景**：

- **场景1**：创建 backend debug 任务
  - 期望：自动使用 systematic-debugging skill
  - 现状：需要手动配置 skill

- **场景2**：创建 frontend 任务
  - 期望：自动使用 frontend-patterns skill
  - 现状：需要手动配置 skill

- **场景3**：查看任务状态
  - 期望：能查看当前 action 和对应的 skills
  - 现状：无法查看，只能猜测

### 1.2 项目目标

**用最小改动，实现核心功能**：

1. ✅ 创建任务时自动选择 skill（核心）
2. ✅ 提供可观测性（explain 命令）
3. ✅ Hook 自动注入 skill 内容
4. ✅ 保持向后兼容（零破坏性）

**不做的事**（明确范围）：

- ❌ 不做复杂的 selector/capability 系统
- ❌ 不做平台泛化（只支持当前平台）
- ❌ 不做 LLM 决策层
- ❌ 不做完整的 evidence 记录（Phase 2 可选）
- ❌ 不做 Preset 快捷命令（Phase 3 可选）
- ❌ 不做质量门禁（Phase 4 可选）

### 1.3 目标用户

| 用户类型 | 使用场景 | 核心诉求 |
|---------|---------|---------|
| **开发者** | 创建和管理任务 | 自动选择 skill，减少配置 |
| **AI Agent** | 执行任务 | 获得正确的 skill 指导 |
| **团队负责人** | 审查和追踪 | 查看任务状态和配置 |

---

## 2. 核心需求

### 需求1: 自动 Skill 选择 ⭐ P0

**用户故事**：
> 作为开发者，我希望创建任务时自动选择合适的 skill，
> 这样我就不用每次手动配置了。

**功能描述**：

1. **输入参数**：
   - `dev_type`: backend / frontend / fullstack / None
   - `task_mode`: default / debug / tdd / docs
   - `action`: implement / check / finish / create-pr

2. **查表逻辑**：
   - 优先级：精确匹配 > 通配符匹配 > 默认值
   - 配置文件：`.spec-first/config/skill-profiles.json`

3. **输出结果**：
   - `selected_skills`: 每个动作对应的 skill 列表

**验收标准**：

- [ ] backend + debug + implement → ["before-dev", "systematic-debugging"]
- [ ] frontend + default + implement → ["before-dev", "frontend-patterns"]
- [ ] * + * + check → ["check", "finish-work"]
- [ ] task.json 包含 `selected_skills` 字段
- [ ] 配置文件不存在时使用默认值

**示例**：

```bash
# 创建任务
python3 ./.spec-first/scripts/task.py create "Fix login bug" \
  --dev-type backend \
  --task-mode debug

# task.json 自动生成
{
  "task_mode": "debug",
  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

---

### 需求2: Skill 可观测性 ⭐ P1

**用户故事**：
> 作为开发者，我希望查看当前任务使用了哪些 skill，
> 这样我就能知道 agent 会注入什么内容。

**功能描述**：

1. **explain 命令**：
   - 显示当前 action
   - 显示对应的 selected_skills
   - 显示后续 actions

2. **输出格式**：
   - 清晰易读的文本格式
   - 彩色高亮关键信息

**验收标准**：

- [ ] `explain` 命令可用
- [ ] 显示当前 action 名称
- [ ] 显示 selected_skills 列表
- [ ] 显示后续 actions
- [ ] 无 active task 时给出提示

**示例**：

```bash
python3 ./.spec-first/scripts/task.py explain

# 输出
Task: fix-login-bug
Status: in_progress
Workflow: default
Task Mode: debug

Current Action: implement
Selected Skills:
  - before-dev
  - systematic-debugging

Next Actions:
  1. check
  2. finish
  3. create-pr
```

---

### 需求3: Hook 自动注入 ⭐ P0

**用户故事**：
> 作为 AI Agent，我希望自动获得当前 action 对应的 skill 内容，
> 这样我就能按照 skill 的指导执行任务。

**功能描述**：

1. **Hook 读取**：
   - 读取 task.json 的 `selected_skills` 字段
   - 根据当前 action 获取 skill 列表

2. **内容注入**：
   - 读取对应的 skill 文件内容
   - 拼接成完整的 skill context
   - 注入到 agent prompt

**验收标准**：

- [ ] Hook 正确读取 selected_skills
- [ ] 根据当前 action 获取正确的 skill 列表
- [ ] Skill 文件不存在时优雅降级
- [ ] 多个 skill 内容正确拼接

**示例**：

```python
# Hook 逻辑
selected_skills = task_data["selected_skills"]
current_action = get_current_action(task_data)
skills = selected_skills[current_action]  # ["before-dev", "systematic-debugging"]

# 注入内容
for skill_id in skills:
    skill_content = read_skill_file(skill_id)
    inject_to_agent(skill_content)
```

---

## 3. 非功能性需求

### 3.1 性能要求

| 操作 | 性能要求 |
|------|---------|
| skill 解析 | < 10ms |
| explain 命令 | < 50ms |
| Hook 注入 | < 100ms |

### 3.2 兼容性要求

1. **向后兼容**
   - ✅ 现有 task.json 继续工作
   - ✅ 缺失字段使用默认值
   - ✅ 无需迁移现有任务

2. **平台兼容**
   - ✅ 支持 Python 3.8+
   - ✅ 支持 macOS / Linux / Windows

3. **配置兼容**
   - ✅ 配置文件不存在时使用硬编码默认值
   - ✅ 配置文件格式错误时给出明确提示

### 3.3 可维护性要求

1. **代码质量**
   - 新增代码 < 200 行
   - 无复杂抽象
   - 配置驱动，逻辑简单

2. **文档要求**
   - README 更新使用说明
   - 配置文件有注释
   - 代码有 docstring

3. **测试要求**
   - 核心逻辑有单元测试
   - 端到端流程有集成测试

---

## 4. 成功指标

### 4.1 定量指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|---------|
| selected_skills 生成率 | 100% | 所有新任务的 task.json 都包含 selected_skills |
| explain 命令使用率 | > 50% | 使用 explain 的任务 / 总任务数 |
| Bug 数量 | < 3 | 上线后 1 周内的 bug 数 |
| 代码覆盖率 | > 80% | 核心逻辑的测试覆盖率 |

### 4.2 定性指标

| 指标 | 衡量方式 |
|------|---------|
| 用户满意度 | 用户反馈 "很好用" / "一般" / "不好用" |
| 代码质量 | Code Review 一次通过率 > 80% |
| 学习成本 | 新用户 5 分钟内能理解并使用 |

---

## 5. 排期规划

### 5.1 Phase 1: 核心功能（必须）

**工期**: 2 天

**范围**：
- ✅ skill_resolver.py
- ✅ skill-profiles.json
- ✅ task_store.py 集成
- ✅ task.py explain 命令
- ✅ Hook 注入

**验收**：
- [ ] 创建任务自动生成 selected_skills
- [ ] explain 命令正确显示
- [ ] Hook 正确注入 skill 内容

### 5.2 Phase 2: Evidence 记录（可选）

**工期**: 1 天

**范围**：
- ✅ task.json 新增 evidence 字段
- ✅ check 完成后记录 verify_result
- ✅ finish 完成后记录 finish_note
- ✅ create-pr 完成后记录 release_note

**触发条件**：Phase 1 验证通过 + 用户反馈需要质量追溯

### 5.3 Phase 3: Preset 快捷命令（可选）

**工期**: 1 天

**范围**：
- ✅ presets.json 配置文件
- ✅ --preset CLI 参数
- ✅ preset 解析逻辑

**触发条件**：Phase 1 验证通过 + 用户反馈任务创建繁琐

### 5.4 Phase 4: 质量门禁（可选）

**工期**: 1 天

**范围**：
- ✅ check 门禁（verify_commands 不为空）
- ✅ finish 门禁（check 已完成）
- ✅ create-pr 门禁（finish_note 不为空）

**触发条件**：Phase 1 验证通过 + 用户反馈质量把控不足

---

## 6. 技术方案概览

### 6.1 核心设计

```
用户创建任务
    ↓
task_store.py 调用 skill_resolver
    ↓
skill_resolver 查表 skill-profiles.json
    ↓
生成 selected_skills 写入 task.json
    ↓
用户运行 explain → 显示 skills
Hook 触发 → 注入 skill 内容
```

### 6.2 查表优先级

```
1. backend-debug-implement (精确匹配)
2. backend-*-implement (dev_type 匹配)
3. *-debug-implement (task_mode 匹配)
4. *-*-implement (action 匹配)
5. defaults.implement (默认值)
```

### 6.3 配置示例

```json
{
  "profiles": {
    "backend-debug-implement": ["before-dev", "systematic-debugging"],
    "frontend-default-implement": ["before-dev", "frontend-patterns"],
    "*-*-check": ["check", "finish-work"]
  },
  "defaults": {
    "implement": ["before-dev"],
    "check": ["check"]
  }
}
```

---

## 7. 风险评估

### 7.1 技术风险

| 风险 | 等级 | 影响 | 缓解措施 |
|------|------|------|---------|
| skill-profiles.json 格式错误 | 低 | skill 选择失败 | 提供 JSON schema 验证 |
| 向后兼容问题 | 低 | 现有任务无法使用 | 充分测试现有任务 |
| Hook 注入失败 | 低 | agent 缺少 skill 指导 | 保留原有逻辑作为回退 |
| 性能问题 | 极低 | 响应缓慢 | 查表逻辑极简，性能无忧 |

### 7.2 业务风险

| 风险 | 等级 | 影响 | 缓解措施 |
|------|------|------|---------|
| 用户不理解 task_mode | 低 | 使用错误 | 提供默认值和文档 |
| 自动选择不符预期 | 中 | 效率降低 | 支持手动编辑 task.json |
| 功能使用率低 | 中 | ROI 不足 | Phase 1 后收集用户反馈 |

---

## 8. 验收清单

### 8.1 Phase 1 验收

**功能验收**：
- [ ] backend + debug 任务自动选择 systematic-debugging
- [ ] frontend + default 任务自动选择 frontend-patterns
- [ ] task.json 包含 selected_skills 字段
- [ ] explain 命令显示当前 action 和 skills
- [ ] Hook 正确注入 skill 内容

**质量验收**：
- [ ] 代码 Review 通过
- [ ] 单元测试覆盖率 > 80%
- [ ] 端到端测试通过
- [ ] 文档完整（README + 代码注释）

**兼容性验收**：
- [ ] 现有任务继续正常工作
- [ ] 缺失字段使用默认值
- [ ] 配置文件不存在时使用硬编码默认值

### 8.2 Phase 2-4 验收

（根据实际实施情况补充）

---

## 9. 附录

### 9.1 相关文档

- 技术方案：`v8-lite-最小裁剪版.md`
- 设计文档：`v8-lite-项目/design.md`
- 实施计划：`v8-lite-项目/plan.md`

### 9.2 参考资料

- Superpowers brainstorming skill
- Superpowers writing-plans skill
- spec-first 现有 task.json 结构

### 9.3 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| 1.0 | 2026-03-28 | 初始版本 |

---

**PRD 版本**: 1.0
**最后更新**: 2026-03-28
**维护者**: spec-first 团队
