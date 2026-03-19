# Implementation Plan Review: First Context Dynamic Injection

> 审查时间: 2026-03-12
> 文档: `docs/plans/2026-03-12-first-context-dynamic-injection-implementation-plan.md`

## 审查结论

**总体评价**: ✅ 实施计划已经修正为更合理的入口优先顺序

**核心问题**:
- 现已先做 `skill render` 与宿主入口切换
- resolver 与 dispatcher 迁移后置
- 整体顺序已符合“先解决主要矛盾，再做内部收敛”

---

## 详细审查

### 1. 任务顺序 ✅ 已调整

**实施计划顺序**:
1. Task 1: Add `spec-first skill render`
2. Task 2: Switch Host Registration
3. Task 3: Add Context Resolver
4. Task 4: Route Dispatcher Through Resolver

结论：

- 现在的顺序已经合理。
- 先入口、后内部收敛，符合 V1 目标。

### 2. Context Resolver 设计 ✅ 已收敛到 V1

修复后，计划中的 resolver 字段已经调整为 V1：

```typescript
- source
- backgroundInputStatus
- stageViewSummary
- roleViewSummary
- firstSummaryLite
- missingAssets
- recommendedAction
```

结论：

- 当前计划已从“偏完整模型”收敛到 V1。
- 后续实现时仍应避免扩回完整项目画像接口。

### 3. Task 3-4 实现 ✅ 正确

**Task 3**: `spec-first skill render` 命令实现合理
**Task 4**: 宿主入口切换逻辑清晰

**优点**:
- TDD 流程完整
- 测试覆盖充分
- 实现步骤清晰

### 4. 验证任务 ✅ 已存在

实现计划已包含：

- Task 5: `backgroundInputStatus` 同步
- Task 6: full verification（targeted tests + `pnpm test` + `pnpm typecheck`）

这里不需要再补“是否有验证”，而是建议把真实宿主入口回归作为验证重点前置。

---

## 修正建议

### 最小化实施顺序

**Phase 1（必须）**: 修复宿主入口

1. **Task 1**: Add `spec-first skill render`
   - 新增 CLI 命令
   - 调用 `dispatcher.loadSkill()`
   - ~50 行代码

2. **Task 2**: Switch Host Registration
   - 修改 `renderCommandFile()`
   - 调用 `spec-first skill render`
   - ~30 行代码

3. **Task 3**: E2E 验证
   - 真实宿主调用测试
   - 验证 runtime notice 生效

**Phase 2（可选）**: 内部优化

4. **Task 4**: Add Context Resolver（简化版）
   - 仅 4 个字段
   - ~50 行代码

5. **Task 5**: Route Dispatcher
   - 使用 resolver
   - ~30 行代码

---

## 总结

**实施计划质量**: 5/10

**主要关注点**:
1. ✅ 任务顺序已修正
2. ✅ Context Resolver 已收敛到 V1
3. ✅ 验证任务已存在，后续重点是把宿主入口回归真正跑起来

**建议**:
1. 按当前顺序推进实现
2. 不要在编码阶段再次膨胀 resolver 字段
3. 执行时优先验证真实宿主入口链路

**预估工作量**（修正后）:
- Phase 1（必须）: 入口打通，1-2 天
- Phase 2（必须）: resolver + dispatcher 收口，约 1 天
- 总计: 2-4 天
