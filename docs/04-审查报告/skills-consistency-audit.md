# Skills 全链路数据流转一致性审查

> 系统性审查 spec-first skills 的数据流转、状态管理、产物依赖关系

---

## 审查维度

### 1. 阶段流转链
### 2. 产物依赖链
### 3. 追溯关系链
### 4. 状态同步链
### 5. Feature 定位一致性

---

## 1. 阶段流转链审查

### 标准流程

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
```

### Skills 映射关系

| 阶段 | Skill | 前置阶段 | 后续阶段 | 状态检查 |
|------|-------|---------|---------|---------|
| 00_init | 01-init | - | 01_specify | ✅ |
| 01_specify | 03-spec | 00_init | 02_design | ✅ |
| 02_design | 04-design | 01_specify | 03_plan | ✅ |
| 03_plan | 06-task | 02_design | 04_implement | ✅ |
| 04_implement | 07-code | 03_plan | 05_verify | ✅ |
| 05_verify | 09-test | 04_implement | 06_wrap_up | ✅ |
| 06_wrap_up | 10-archive | 05_verify | 07_release | ✅ |

### 潜在问题

**问题 1**: 阶段编号不连续
- 文件系统: `00_init, 01_specify, 02_design, 03_plan, 04_implement, 05_verify, 06_wrap_up, 07_release, 08_done`
- Skills 编号: `01-init, 03-spec, 04-design, 06-task, 07-code, 09-test, 10-archive`
- **不一致**: Skill 编号与阶段编号不对应

**影响**: 可能造成理解混淆，但不影响功能

---

## 2. 产物依赖链审查

### 核心产物流转

```
init → stage-state.json, constitution.md, traceability-matrix.md, findings.md, task_plan.md
  ↓
spec → spec.md, FR (写入 matrix)
  ↓
design → design.md, DS (写入 matrix), contracts/*.yaml
  ↓
task → task_plan.md (更新), TASK (写入 matrix)
  ↓
code → 代码文件, TASK 状态更新
  ↓
test → TC (写入 matrix), 测试文件
  ↓
archive → 归档文档
```

### 依赖关系检查

| Skill | 读取产物 | 写入产物 | 依赖检查 |
|-------|---------|---------|---------|
| 01-init | docs/first/* | stage-state.json, constitution.md, matrix.md, findings.md | ✅ 检查 docs/first/ |
| 03-spec | constitution.md, matrix.md | spec.md, FR | ❓ 未明确检查 constitution.md |
| 04-design | spec.md, constitution.md, matrix.md | design.md, DS | ✅ HARD-GATE 检查 spec.md |
| 06-task | spec.md, design.md, matrix.md | task_plan.md, TASK | ❓ 未明确检查 design.md |
| 07-code | task_plan.md, design.md | 代码文件 | ❓ 未明确检查 task_plan.md |
| 09-test | spec.md, task_plan.md | TC, 测试文件 | ❓ 未明确检查依赖 |

### 潜在问题

**问题 2**: 部分 skills 缺少前置产物检查
- 03-spec 未检查 constitution.md 是否存在
- 06-task 未检查 design.md 是否存在
- 07-code 未检查 task_plan.md 是否存在

**影响**: 可能在缺少前置产物时执行失败

---

## 3. 追溯关系链审查

### 标准追溯链

```
REQ-PRD-* → FR-* → DS-* → TASK-* → TC-*
```

### Skills 追溯操作

| Skill | 创建 ID | 建立追溯 | 验证追溯 |
|-------|---------|---------|---------|
| 03-spec | FR | FR → REQ-PRD | ❓ |
| 04-design | DS | DS → FR | ✅ P5 coverage check |
| 06-task | TASK | TASK → DS | ❓ |
| 09-test | TC | TC → FR/TASK | ❓ |

### 潜在问题

**问题 3**: 追溯验证不完整
- 03-spec 未验证 FR → REQ-PRD 追溯
- 06-task 未验证 TASK → DS 追溯
- 09-test 未验证 TC → FR/TASK 追溯

**影响**: 可能出现追溯链断裂

---

## 4. 状态同步链审查

### 状态文件

| 文件 | 更新者 | 读取者 | 同步时机 |
|------|--------|--------|---------|
| .spec-first/current | init, feature-switch | 所有 skills | Feature 切换时 |
| stage-state.json | stage advance | 所有 skills | 阶段推进时 |
| traceability-matrix.md | spec, design, task, test | analyze, verify | ID 注册时 |
| findings.md | 所有 skills | catchup, plan | 关键动作后 |

### 潜在问题

**问题 4**: findings.md 更新规则不统一
- 部分 skills 明确"每 2 个关键动作后更新"
- 部分 skills 未明确更新时机

**影响**: findings.md 可能不完整

---

## 5. Feature 定位一致性审查

### 已优化 Skills（11个）

✅ 统一三级优先级：显式参数 > .spec-first/current > 交互式

| Skill | 版本 | 定位规则 |
|-------|------|---------|
| 20-spec-review | v1.1.0 | ✅ |
| 04-design | v1.1.0 | ✅ |
| 06-task | v1.2.0 | ✅ |
| 07-code | v1.1.0 | ✅ |
| 09-test | v1.1.0 | ✅ |
| 12-verify | v1.1.0 | ✅ |
| 05-research | v1.4.0 | ✅ |
| 08-code-review | v1.1.0 | ✅ |
| 10-archive | v1.1.0 | ✅ |
| 21-analyze | v1.1.0 | ✅ |
| 13-orchestrate | v1.1.0 | ✅ |
| 16-sync | v1.1.0 | ✅ |

### 特殊处理

| Skill | 状态 | 原因 |
|-------|------|------|
| 01-init | 不需要 | 创建 Feature，不读取 current |
| 02-catchup | 已有 | P0 明确读取 .spec-first/current |
| 11-plan | 保持现状 | 支持多 Feature 规划 |
| 03-spec | ❓ 待检查 | 核心 workflow skill |

### 潜在问题

**问题 5**: 03-spec 未在优化列表中
- 03-spec 是核心 workflow skill
- 应该支持自动 Feature 定位

**影响**: 不一致的用户体验

---

## 待深入审查项

1. ✅ 03-spec 的 Feature 定位逻辑
2. ✅ 前置产物检查的完整性
3. ✅ 追溯验证的完整性
4. ✅ findings.md 更新规则统一性
5. ✅ CLI 命令参数一致性
