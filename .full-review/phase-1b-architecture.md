# Phase 1B: Architecture Review - first skill 架构设计

**审查时间**: 2026-03-17
**审查范围**: first skill 架构设计与模块集成
**审查重点**: Runtime 分层模型、Agent 并行策略、与其他模块的集成

---

## 1. Runtime 分层模型架构

### 1.1 设计理念

first skill 实现了**双层架构**，符合 Single Source of Truth 原则：

```
┌─────────────────────────────────────────────────────────┐
│  Layer 2: 文档投影层 (docs/first/)                      │
│  - 人类可读的 Markdown 文档                              │
│  - 从 Runtime 真源自动生成                               │
│  - 可以手动编辑（但会被覆盖）                            │
└─────────────────────────────────────────────────────────┘
                         ↑ 投影
                         │
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 机器真源层 (.spec-first/runtime/first/)       │
│  - JSON 格式的结构化数据                                 │
│  - 包含健康状态、版本、哈希等元数据                      │
│  - 唯一真源（Single Source of Truth）                   │
└─────────────────────────────────────────────────────────┘
```

**架构优势**：
- ✅ **真源唯一**：避免多源不一致问题
- ✅ **增量更新**：只更新变化的部分，提升性能
- ✅ **健康检查**：通过 index.json 追踪每个产物的健康状态
- ✅ **可恢复性**：文档丢失时可从 runtime 恢复

### 1.2 健康状态管理

**index.json 结构**：
```json
{
  "summary": { "healthy": true, "version": "1.0.0", "hash": "..." },
  "roleViews": { "healthy": true, ... },
  "stageViews": { "healthy": true, ... },
  ...
}
```

**健康检查逻辑**（first.ts 第 100-108 行）：
- 检查所有核心产物的 `healthy` 标志
- 如果全部健康 → 增量更新
- 如果任一不健康 → 重新 bootstrap

**改进建议**：
- ⚠️ 健康检查条件硬编码，建议提取为配置或函数

---

## 2. Agent 并行执行策略

### 2.1 SKILL.md 定义的 Agent 分配

根据 SKILL.md（第 103-128 行），first skill 定义了两种模式的 Agent 分配：

**quick 模式**（4-5 个 Agent）：
- Agent A: tech-stack.md（主线程直接生成）
- Agent B: api-docs.md
- Agent C: codebase-overview.md（简化版）
- Agent D: domain-model.md
- Agent E: database-er.md（条件派发）

**deep 模式**（8 个逻辑 Agent）：
- A1 → A2 → A3（代码分析链，有依赖关系）
- B, C1, C2（并行执行）
- D（条件派发）
- A4（等待 A2+B+D）

**架构评估**：
- ✅ 清晰的依赖关系定义
- ✅ 支持条件派发（如数据库检测）
- ⚠️ **关键问题**：SKILL.md 定义了 Agent 派发策略，但实际代码实现在哪里？

### 2.2 实际实现分析

从 `first-bootstrap.ts` 的代码来看：
- ❌ **未找到 Agent 派发逻辑**
- ✅ 找到了各个产物的生成函数（`buildRoleViews`, `buildFirstConventions` 等）
- ⚠️ **架构偏差**：SKILL.md 描述的是"派发 Agent 并行执行"，但实际实现是"直接调用生成函数"

**关键发现**：
- 🔴 **架构偏差**：SKILL.md 描述使用 Agent 并行执行，但实际代码是同步调用生成函数
- ⚠️ 这可能是文档与实现不一致的问题，需要进一步确认

---

## 3. 模块集成分析

### 3.1 与其他核心模块的集成

first skill 与以下模块有集成关系：

```
first skill
  ├── process-engine/init.ts        # Feature 初始化时检测 backgroundInputStatus
  ├── skill-runtime/dispatcher.ts   # Skill 分发时加载 first context
  └── skill-runtime/context-resolver.ts  # 其他 skills 引用 firstSummaryLite
```

**集成点分析**：

1. **init.ts 集成**（第 32 行）：
   ```typescript
   import { detectBackgroundInputStatus } from '../skill-runtime/first-context.js';
   ```
   - ✅ Feature 初始化时检测项目背景输入状态
   - ✅ 用于判断 Greenfield/Brownfield

2. **dispatcher.ts 集成**（第 642-662 行）：
   ```typescript
   const firstContext = {
     required: { summary: firstSummary },
     optional: {
       changeMap: firstChangeMap?.map(...),
       criticalFlows: firstCriticalFlows?.map(...),
       entryGuide: firstEntryGuide?.map(...)
     }
   };
   ```
   - ✅ orchestrate skill 使用 first context
   - ✅ 提供项目认知上下文

3. **context-resolver.ts 集成**（第 463-620 行）：
   - ✅ 多个 skills 通过 `firstSummaryLite` 获取项目摘要
   - ✅ 轻量级摘要，避免加载完整 first context

### 3.2 依赖关系图

```
docs/first/ (文档投影层)
    ↑
    │ 投影
    │
.spec-first/runtime/first/ (机器真源层)
    ↑
    │ 生成
    │
first-bootstrap.ts (Bootstrap 逻辑)
    ↑
    │ 调用
    │
first.ts (CLI 入口)
    ↑
    │ 使用
    │
其他 skills (spec, design, task, code, etc.)
```

**依赖方向**：
- ✅ 依赖方向清晰，自下而上
- ✅ 没有循环依赖
- ✅ first skill 作为基础设施，被其他 skills 依赖

---

## 4. 关键架构问题

### 4.1 SKILL.md 与实际实现的偏差

**问题描述**：
- SKILL.md 描述：使用多个 Agent 并行执行，生成不同的文档
- 实际实现：直接调用生成函数（`buildRoleViews`, `buildFirstConventions` 等）

**影响评估**：
- 🟡 **中等影响**：如果 SKILL.md 是给 AI 看的指令，实际代码不符合描述会导致 AI 误解
- 🟡 **中等影响**：如果未来要实现真正的 Agent 并行执行，需要重构

**建议**：
1. 确认 SKILL.md 的定位：是规划文档还是实现指南？
2. 如果是实现指南，需要更新 SKILL.md 以反映实际实现
3. 如果是规划文档，需要在代码中实现 Agent 并行执行

### 4.2 文档生成策略

**当前策略**：
- quick 模式：生成 5-6 个核心文档
- deep 模式：生成 10-11 个完整文档

**实际实现**：
- ❓ 未找到 quick/deep 模式的分支逻辑
- ❓ 所有文档似乎都会生成

**需要验证**：
- 实际代码是否实现了 quick/deep 模式的区分
- 如果没有，SKILL.md 的描述是否准确

---

## 5. 架构优势与改进建议

### 5.1 优势

1. **Runtime 分层模型**：设计优秀，真源与投影分离
2. **健康状态管理**：完善的健康检查机制
3. **模块化设计**：职责清晰，依赖关系合理
4. **增量更新**：避免全量重生成，提升性能

### 5.2 改进建议

1. **对齐 SKILL.md 与实现**：
   - 更新 SKILL.md 以反映实际实现
   - 或实现 SKILL.md 描述的 Agent 并行执行

2. **实现 quick/deep 模式**：
   - 如果尚未实现，需要添加模式分支逻辑
   - 如果已实现，需要在代码中明确标注

3. **文档完善**：
   - 添加架构设计文档
   - 说明 Runtime 分层模型的设计理念

---

## 6. 下一步行动

1. ✅ 完成 Phase 1A 和 1B
2. ⏭️ **Phase 3（重点）**：审查其他 skills 如何使用 docs/first/ 的文档
3. ⏭️ Phase 4：生成综合报告
