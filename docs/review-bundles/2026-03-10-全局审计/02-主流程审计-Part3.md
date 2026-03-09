# 主流程审计报告 - Part 3

## 三、阶段推进流程审计

### 3.1 advance 流程追踪

**入口**: `src/core/process-engine/advance.ts:107`

```
advance(featureId, projectRoot)
  ↓
loadState()  // 读取状态
  ↓
isTerminal() 检查
  ↓
nextStageInChain()  // 计算下一阶段
  ↓
checkDependencies()  // 依赖检查
  ↓
evaluateGate()  // 门禁校验
  ↓
更新 state.currentStage
  ↓
saveState()  // 保存状态
  ↓
syncAgentContextFromDesign()  // 同步上下文
```

### 3.2 状态更新原子性验证

**代码**: advance.ts:100, 157-171

```typescript
function saveState(featureId: string, root: string, state: StageState): void {
  writeJson(getStatePath(featureId, root), sanitizeStageState(state));  // ❌ 无锁
}

// advance 函数中
state.currentStage = to;
state.history.push(entry);
state.updatedAt = now;
saveState(featureId, projectRoot, state);  // ❌ 非原子
```

**结论**: ❌ 状态更新无锁保护

---

### 3.3 问题发现

#### 🔴 问题 6: advance 并发竞态

**场景**:
```
进程 A: loadState() → currentStage = 01_specify
进程 B: loadState() → currentStage = 01_specify
进程 A: advance → currentStage = 02_design
进程 B: advance → currentStage = 02_design
进程 A: saveState() → 写入 02_design
进程 B: saveState() → 覆盖，写入 02_design
```

**结果**: history 中可能缺少一次推进记录

**证据**: advance.ts:100 saveState 无锁

---

#### 🔴 问题 7: 矩阵状态未同步

**位置**: advance.ts:107-171

```typescript
export function advance(...): AdvanceResult {
  // ... 推进逻辑
  state.currentStage = to;
  saveState(featureId, projectRoot, state);
  // ❌ 未更新矩阵中 ID 的状态
}
```

**影响**:
- Stage 推进到 04_implement
- 矩阵中 TASK 状态仍为 Planned
- 应更新为 Implemented

**证据**: 全文搜索 updateMatrixRow，advance 中未调用

---

#### 🟠 问题 8: current 文件更新时机不明确

**搜索结果**: writeCurrentFeature 调用点
- init.ts:502 - Feature 初始化
- init.ts:574 - 恢复已存在 Feature
- init.ts:650 - commit 时更新
- init.ts:663 - commit 成功后更新

**缺失**: advance 时不更新 current 文件

**风险**: 如果用户切换 Feature 后执行 advance，current 指向错误

---

