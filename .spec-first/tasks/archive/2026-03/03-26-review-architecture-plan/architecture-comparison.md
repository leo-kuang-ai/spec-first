# 架构版本对比：v1.0 (备份) vs v2.0 (当前)

> **对比日期**: 2026-03-26
> **对比目的**: 识别两个版本的关键差异，评估架构演进的合理性

---

## 1. 核心差异总览

| 维度 | v1.0 (备份) | v2.0 (当前) | 评价 |
|------|------------|------------|------|
| 架构层数 | 4 层 | 6 层 | v2.0 更细粒度 |
| 核心理念 | Harness Engineering 骨架 | Compiler + Contract + Enforcement | v2.0 更工程化 |
| Layer 命名 | Workflow/Policy/Runtime/LLM | Intent/Policy/Compilation/Contract/Runtime/Evidence | v2.0 更清晰 |
| 编译层 | 无独立层 | Layer 2 (Compilation) | ✅ v2.0 补充了关键层 |
| Evidence | 未提及 | Layer 5 (Evidence) | ✅ v2.0 引入证据驱动 |

---

## 2. 架构层次对比

### v1.0 的四层架构

```
Layer 1: Workflow Topology (next_action, workflow_type)
   ↓
Layer 2: Phase Policy (decision_hints)
   ↓
Layer 3: Runtime Enforcement (hooks)
   ↓
Layer 4: LLM Autonomy (plan/implement/check/debug/finish)
```

**特点**:
- 简洁，只有 4 层
- 强调 "LLM 自主性保留在执行层"
- 没有独立的编译层
- 没有 evidence 层

### v2.0 的六层架构

```
Layer 0: Intent/Spec (prd.md, 任务说明)
   ↓
Layer 1: Policy/Capability (workflow 能力定义)
   ↓
Layer 2: Compilation (task_store.py → compiler)
   ↓
Layer 3: Runtime Contract (task.json)
   ↓
Layer 4: Runtime Enforcement (dispatch, hooks)
   ↓
Layer 5: Evidence/Completion (verify 结果)
```

**特点**:
- 更细粒度，6 层
- 强调 "Compiler + Contract + Enforcement"
- 新增 Layer 0 (Intent) 和 Layer 2 (Compilation)
- 新增 Layer 5 (Evidence)

---

## 3. 关键差异分析

### 差异 1: 是否有独立的编译层

**v1.0**: 没有独立的编译层
- workflow_type 只是 "输入标签"
- 编译逻辑隐含在 task creation 中

**v2.0**: 有独立的 Layer 2 (Compilation)
- 明确 task_store.py 是编译器
- 负责将 intent + policy 编译为 contract

**评价**: ✅ v2.0 更合理
- 编译是关键职责，应该有独立层
- 避免编译逻辑分散在多处

---

### 差异 2: Evidence 层的引入

**v1.0**: 没有 evidence 层
- 完成判定主要依赖状态 (current_phase)
- verify 结果是隐式的

**v2.0**: 新增 Layer 5 (Evidence)
- 从状态驱动转向证据驱动
- 明确提出 "最终判定任务完成，应该越来越依赖 evidence"

**评价**: ✅ v2.0 更先进
- 证据驱动是正确的演进方向
- 但推迟到 Phase 3 有返工风险 (已在审查报告中指出)

---

### 差异 3: Layer 0 (Intent) 的显式化

**v1.0**: 没有 Layer 0
- 用户需求直接进入 Workflow Topology

**v2.0**: 新增 Layer 0 (Intent/Spec)
- 明确 prd.md 和任务说明是独立层
- 定义任务要解决什么问题

**评价**: ✅ v2.0 更完整
- Intent 是架构的起点，应该显式化
- 有助于理解整个数据流

---

### 差异 4: 核心理念的变化

**v1.0**: "Harness Engineering 骨架"
- 强调最小但稳定的骨架
- 强调 LLM 自主性保留在执行层

**v2.0**: "Compiler + Contract + Enforcement"
- 强调编译、契约、执行的分离
- 更工程化的表达

**评价**: ✅ v2.0 更清晰
- "Compiler + Contract + Enforcement" 更容易理解
- 更符合软件工程的常见模式

---

## 4. 设计原则对比

### v1.0 的 6 条原则

1. dispatch 保持纯调度
2. next_action 只负责 workflow topology
3. decision_hints 只负责最小 phase policy
4. runtime hooks 负责 enforcement
5. LLM 自主性只保留在执行层
6. 不过度设计

### v2.0 的核心结论

> Spec / Policy -> Task Compiler -> Task Contract -> Runtime Enforcement -> Evidence

**对比**:
- v1.0 更强调 "什么不该做"
- v2.0 更强调 "数据流向"
- 两者本质一致，表达方式不同

---

## 5. 关键问题：哪个版本更好？

### v1.0 的优势

1. **更简洁** - 4 层比 6 层更容易理解
2. **强调自主性** - 明确 "LLM 自主性保留在执行层"
3. **原则清晰** - 6 条设计原则很明确

### v2.0 的优势

1. **更完整** - 补充了编译层和 evidence 层
2. **更工程化** - "Compiler + Contract + Enforcement" 更专业
3. **更细粒度** - 6 层架构职责更清晰
4. **引入证据驱动** - 这是正确的演进方向

### 结论

**v2.0 是 v1.0 的改进版**，主要改进点：
1. ✅ 补充了编译层 (Layer 2)
2. ✅ 引入了 evidence 层 (Layer 5)
3. ✅ 显式化了 Intent 层 (Layer 0)
4. ✅ 更工程化的表达

**但 v2.0 也引入了新问题**：
1. ⚠️ 6 层比 4 层更复杂
2. ⚠️ Layer 1/2 边界需要进一步明确 (已在审查报告中指出)
3. ⚠️ evidence 推迟到 Phase 3 有返工风险

---

## 6. 最终建议

### 建议 1: 采用 v2.0，但简化为 5 层

**问题**: v2.0 的 6 层过于细粒度，Layer 0 和 Layer 1 可以合并。

**建议的 5 层架构**:
```
Layer 1: Intent & Policy (prd.md + workflow 能力定义)
   ↓
Layer 2: Compilation (task_store.py)
   ↓
Layer 3: Runtime Contract (task.json)
   ↓
Layer 4: Runtime Enforcement (hooks)
   ↓
Layer 5: Evidence (verify 结果)
```

**理由**:
- Intent 和 Policy 都是上游输入，可以合并
- 5 层比 6 层更简洁，比 4 层更完整

---

### 建议 2: 保留 v1.0 的设计原则

v1.0 的 6 条原则非常清晰，建议在 v2.0 中保留：

1. ✅ dispatch 保持纯调度
2. ✅ next_action 只负责 workflow topology
3. ✅ decision_hints 只负责最小 phase policy
4. ✅ runtime hooks 负责 enforcement
5. ✅ LLM 自主性只保留在执行层
6. ✅ 不过度设计

**价值**: 这些原则是防止系统失控的关键约束。

---

### 建议 3: 在 Phase 1 预留 evidence 字段

v2.0 将 evidence 推迟到 Phase 3，但应该在 Phase 1 就预留字段：

```python
class TaskData(TypedDict, total=False):
    # ... existing fields ...
    workflow_type: str
    decision_hints: dict
    evidence: dict | None  # Phase 1 预留，Phase 3 实现
```

**理由**: 避免 Phase 3 时需要破坏性变更。

---

### 建议 4: 明确 Layer 2 的编译逻辑边界

v2.0 提出了编译层，但没有明确编译逻辑应该有多复杂。

**建议**: Phase 1 的编译逻辑应该是简单映射：
```python
def compile_task_contract(workflow_type: str) -> dict:
    # 1. 获取 topology
    workflow = get_workflow(workflow_type)

    # 2. 生成 next_action
    next_action = get_next_action_from_workflow(workflow)

    # 3. 生成默认 decision_hints
    decision_hints = generate_default_hints(workflow_type)

    return {
        "workflow_type": workflow_type,
        "next_action": next_action,
        "decision_hints": decision_hints
    }
```

Phase 2 再增加 preset 的编译逻辑。

---

## 7. 总结

### 版本选择

**推荐**: 采用 v2.0，但做以下调整：
1. 简化为 5 层（合并 Layer 0 和 Layer 1）
2. 保留 v1.0 的 6 条设计原则
3. 在 Phase 1 预留 evidence 字段
4. 明确 Layer 2 的编译逻辑边界

### 关键差异

| 维度 | v1.0 | v2.0 | 推荐 |
|------|------|------|------|
| 层数 | 4 层 | 6 层 | 5 层 |
| 编译层 | 无 | 有 | 有 |
| Evidence | 无 | 有 | 有（Phase 1 预留）|
| 设计原则 | 6 条明确 | 隐含 | 显式保留 |

### 核心价值

v2.0 相比 v1.0 的核心价值：
1. ✅ 补充了编译层 - 避免编译逻辑分散
2. ✅ 引入了 evidence - 从状态驱动转向证据驱动
3. ✅ 更工程化的表达 - "Compiler + Contract + Enforcement"

**结论**: v2.0 是正确的演进方向，但需要结合 v1.0 的简洁性和原则性。

