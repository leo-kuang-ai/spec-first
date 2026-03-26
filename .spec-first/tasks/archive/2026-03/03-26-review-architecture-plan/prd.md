# 深度审查：整体方案-目标架构与三阶段实施

## Goal

对 `docs/02-skill分析/整体方案-目标架构与三阶段实施.md` 进行深度技术审查，识别：
1. 架构设计的合理性和潜在风险
2. 三阶段实施计划的可行性
3. 与当前代码库的契合度
4. 需要补充或修正的关键细节

## What I already know

从文档中了解到的核心内容：

### 文档定位
- 这是 spec-first 系统重构的权威文档
- 目标是从"workflow engine"收敛为"compiler + contract + enforcement"的工程化 harness
- 定义了六层架构和三阶段实施路径

### 核心问题识别
1. 缺少统一编译入口（当前在 task_store.py 但职责不清）
2. workflow_templates.py 混杂了 topology 和 policy preset
3. runtime hooks 未真正消费 task-level policy
4. 过度依赖状态而非证据

### 目标架构（六层）
- Layer 0: Intent/Spec (prd.md, 任务说明)
- Layer 1: Policy/Capability (workflow 能力定义)
- Layer 2: Compilation (task_store.py → compiler)
- Layer 3: Runtime Contract (task.json)
- Layer 4: Runtime Enforcement (dispatch, hooks)
- Layer 5: Evidence/Completion (verify 结果)

### 三阶段计划
- Phase 1: 建立最小闭环（3种拓扑 + workflow_type + next_action + decision_hints）
- Phase 2: 增加 preset（with-tdd, debug）
- Phase 3: evidence 模型 + 扩展 schema

## Assumptions (temporary)

- 文档作者对当前代码库有深入了解
- Phase 1 的改造点都是可实施的
- 三阶段拆分能够避免系统失控

## Open Questions

### 架构层面
1. 六层架构中，Layer 2 (Compilation) 的边界是否清晰？是否会与 Layer 1 (Policy) 产生职责重叠？
2. evidence 模型（Layer 5）推迟到 Phase 3，会不会导致 Phase 1/2 的设计需要大幅返工？

### 实施层面
3. Phase 1 的 6 个改造步骤之间的依赖关系是什么？能否并行？
4. 向后兼容策略（fallback）的具体实现逻辑是什么？
5. Phase 2 将 debug 固定编译为 quick-fix，是否过于刚性？

### 代码库契合度
6. 当前 task_store.py 的实现是否已经具备成为 compiler 的基础？
7. inject-subagent-context.py 和 ralph-loop.py 改造的工作量有多大？
8. 现有的 workflow_templates.py 拆分后，是否会影响已有功能？

## Requirements (evolving)

审查输出应包括：

1. **架构合理性分析**
   - 六层边界是否清晰
   - 职责划分是否合理
   - 是否存在循环依赖或职责重叠

2. **实施可行性分析**
   - Phase 1 改造步骤的依赖关系图
   - 每个步骤的工作量估算（粗略）
   - 潜在的技术风险点

3. **代码库契合度分析**
   - 检查关键文件的当前实现
   - 评估改造的侵入性
   - 识别可能的破坏性变更

4. **补充建议**
   - 缺失的关键细节
   - 需要明确的设计决策
   - 风险缓解措施

## Acceptance Criteria

- [x] 完成六层架构的合理性分析
- [x] 绘制 Phase 1 改造步骤的依赖关系图
- [x] 检查至少 5 个关键文件的当前实现 (检查了 7 个)
- [x] 识别至少 3 个潜在风险点 (识别了 6 个)
- [x] 提出至少 5 条具体的补充建议 (提出了 7 条)
- [x] 输出结构化的审查报告

## Definition of Done

- 审查报告完整且结构清晰
- 所有关键问题都有明确的分析结论
- 补充建议具有可操作性
- 风险点有对应的缓解措施

## Out of Scope

- 不实施任何代码改造（仅审查）
- 不重写整份架构文档
- 不深入到每个函数的实现细节

## Technical Notes

### 需要检查的关键文件
- `.spec-first/scripts/common/task_store.py` - 当前的 task 创建逻辑
- `.spec-first/scripts/common/workflow_templates.py` - 当前的 workflow 模板
- `.spec-first/scripts/common/types.py` - 当前的类型定义
- `.claude/hooks/inject-subagent-context.py` - context 注入 hook
- `.claude/hooks/ralph-loop.py` - verify gate hook
- `.spec-first/scripts/multi_agent/plan.py` - plan 如何使用 task_store
- `.spec-first/scripts/multi_agent/dispatch.py` - dispatch 的当前职责

### 审查方法
1. 先理解文档的核心主张
2. 检查关键代码文件的当前实现
3. 评估改造的可行性和风险
4. 提出具体的补充建议
