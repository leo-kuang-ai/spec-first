# Spec-First 全面审查报告 - first skill 流程审查

**审查时间**: 2026-03-17
**审查范围**: first skill 及其在整个 spec-first 流程中的集成
**审查目标**: 代码质量、架构设计、文档使用、最佳实践

---

## 执行摘要

本次审查从 first skill 为起点，深度审查了代码实现、架构设计，以及其他 skills 如何使用 first skill 生成的文档。

### 关键发现

**优势**：
- ✅ Runtime 分层模型设计优秀，真源与投影分离
- ✅ 代码质量良好，错误处理完善
- ✅ 模块职责清晰，符合单一职责原则
- ✅ 其他 skills 的引用场景合理，角色定制推荐设计优秀

**问题**：
- 🔴 **架构偏差**：SKILL.md 描述使用 Agent 并行执行，但实际代码是同步调用
- 🟡 **模式感知缺失**：其他 skills 没有区分 quick/deep 模式
- 🟡 **硬编码依赖**：文档路径硬编码，缺少常量引用
- 🟡 **存在性检查缺失**：推荐文档前没有检查文件是否存在

### 风险评估

| 风险 | 等级 | 影响 | 建议优先级 |
|------|------|------|-----------|
| SKILL.md 与实现不一致 | 🟡 中 | AI 误解、未来重构困难 | P0 |
| 模式感知缺失 | 🟡 中 | 用户体验问题 | P0 |
| 硬编码路径 | 🟢 低 | 维护性差 | P1 |
| 存在性检查缺失 | 🟢 低 | 用户体验问题 | P1 |

---

## 1. Phase 1A: 代码质量审查

### 1.1 核心发现

**优点**：
- ✅ 模块职责清晰（19 个 first-* 模块）
- ✅ 错误处理完善（降级策略、明确的 ExitCode）
- ✅ 类型安全（完整的 TypeScript 类型定义）
- ✅ 健康检查机制完善

**改进建议**：
- 提取长条件判断为独立函数（如 `isRuntimeHealthy`）
- 拆分过长的函数（如 `detectTechStack`）
- 添加 JSDoc 注释
- 配置化硬编码限制值

### 1.2 详细报告

参见：`.full-review/phase-1a-code-quality.md`

---

## 2. Phase 1B: 架构审查

### 2.1 核心发现

**优点**：
- ✅ Runtime 分层模型设计优秀
- ✅ 健康状态管理完善
- ✅ 模块集成清晰，无循环依赖

**关键问题**：
- 🔴 **架构偏差**：SKILL.md 描述使用 Agent 并行执行，但实际代码是同步调用生成函数

**影响分析**：
```
SKILL.md 描述：
  Agent A → tech-stack.md
  Agent B → api-docs.md (并行)
  Agent C → codebase-overview.md (并行)

实际实现：
  buildFirstSummary() → summary.json
  buildRoleViews() → role-views.json
  buildFirstConventions() → conventions.json
  (同步调用，无 Agent 派发)
```

### 2.2 详细报告

参见：`.full-review/phase-1b-architecture.md`

---

## 3. Phase 3: 集成审查

### 3.1 核心发现

**引用统计**：
- onboarding skill: 6 处引用
- init skill: 2 处引用
- plan skill: 1 处引用

**优点**：
- ✅ 引用场景合理，符合各 skill 职责
- ✅ 角色定制推荐设计优秀（onboarding）
- ✅ 降级策略完善

**问题**：
- 🟡 **模式感知缺失**：没有区分 quick/deep 模式
  - onboarding 推荐 `call-graph.md`（仅 deep 模式）
  - 用户运行 quick 模式后，文档不存在
- 🟡 **硬编码路径**：`docs/first/*.md` 硬编码
- 🟡 **存在性检查缺失**：没有检查文档是否存在

### 3.2 详细报告

参见：`.full-review/phase-3-integration.md`

---

## 4. 关键问题深度分析

### 4.1 问题 1：SKILL.md 与实现不一致

**问题描述**：
- SKILL.md（第 103-128 行）定义了 Agent 分配策略
- 实际代码直接调用生成函数，没有 Agent 派发逻辑

**根因分析**：
1. **可能原因 1**：SKILL.md 是规划文档，尚未实现
2. **可能原因 2**：SKILL.md 是给 AI 看的指令，实际实现不同
3. **可能原因 3**：曾经有 Agent 实现，后来简化了但文档未更新

**影响评估**：
- 🟡 **对 AI 的影响**：AI 读取 SKILL.md 后会误以为有 Agent 并行执行
- 🟡 **对开发者的影响**：新开发者会困惑实际实现与文档不符
- 🟡 **对未来重构的影响**：如果要实现真正的 Agent 并行，需要大量重构

**建议方案**：

**方案 A（推荐）**：更新 SKILL.md 以反映实际实现
```markdown
## 执行流程

P0: 定位与校验
P1: 技术栈识别
P2: 产物生成（同步调用生成函数）
  - buildFirstSummary() → summary.json
  - buildRoleViews() → role-views.json
  - ...
P3: 文档投影（从 runtime 生成 docs/first/）
```

**方案 B**：实现 SKILL.md 描述的 Agent 并行执行
- 需要重构 `first-bootstrap.ts`
- 实现 Agent 派发机制
- 工作量较大，建议评估收益

### 4.2 问题 2：模式感知缺失

**问题描述**：
- first skill 支持 quick/deep 两种模式
- quick 模式生成 5-6 个文档
- deep 模式生成 10-11 个文档
- 其他 skills 引用文档时没有区分模式

**失败场景**：
```
1. 用户运行 /spec-first:first (默认 quick 模式)
2. 生成 5-6 个文档，不包括 call-graph.md
3. 用户运行 /spec-first:onboarding，选择"架构师"角色
4. onboarding 推荐阅读 docs/first/call-graph.md
5. 文档不存在，推荐失效 ❌
```

**建议方案**：

**方案 A（推荐）**：添加模式感知
```typescript
// onboarding skill
const firstIndex = readFirstRuntimeIndex(projectRoot);
const mode = firstIndex?.summary?.mode ?? 'quick';

const architectDocs = [
  'docs/first/architecture.md',
  ...(mode === 'deep' ? ['docs/first/call-graph.md'] : [])
].filter(path => existsSync(join(projectRoot, path)));
```

**方案 B**：添加存在性检查 + 提示
```markdown
### 架构师
- docs/first/architecture.md - 架构设计
- docs/first/call-graph.md - 调用链分析 [需要 deep 模式]

💡 如果文档不存在，运行：/spec-first:first --deep
```

---

## 5. 改进建议路线图

### P0（高优先级，1-2 周）

1. **对齐 SKILL.md 与实现**
   - 任务：更新 SKILL.md 以反映实际实现
   - 负责人：架构师
   - 工作量：2-4 小时

2. **添加模式感知**
   - 任务：onboarding skill 检查 first runtime index，识别模式
   - 负责人：开发者
   - 工作量：4-8 小时

3. **添加存在性检查**
   - 任务：推荐文档前检查文件是否存在
   - 负责人：开发者
   - 工作量：2-4 小时

### P1（中优先级，2-4 周）

4. **使用常量引用**
   - 任务：从 `first-artifact-mapping.ts` 导入常量
   - 负责人：开发者
   - 工作量：4-8 小时

5. **提取长函数**
   - 任务：拆分 `detectTechStack` 等长函数
   - 负责人：开发者
   - 工作量：4-8 小时

### P2（低优先级，1-2 月）

6. **添加 JSDoc 注释**
   - 任务：为公开 API 添加 JSDoc
   - 负责人：开发者
   - 工作量：8-16 小时

7. **补充测试覆盖**
   - 任务：验证测试覆盖率，补充边界条件测试
   - 负责人：测试工程师
   - 工作量：16-32 小时

---

## 6. 最佳实践推荐

### 6.1 文档引用最佳实践

**DO（推荐）**：
```typescript
// 使用常量
import { CANONICAL_PROJECTION_DOCS } from '../first-artifact-mapping.js';

// 检查存在性
const docs = CANONICAL_PROJECTION_DOCS.filter(path =>
  existsSync(join(projectRoot, path))
);

// 检查模式
const index = readFirstRuntimeIndex(projectRoot);
const mode = index?.summary?.mode ?? 'quick';
```

**DON'T（不推荐）**：
```typescript
// 硬编码路径
const docs = ['docs/first/architecture.md', 'docs/first/call-graph.md'];

// 不检查存在性
console.log('请阅读 docs/first/call-graph.md');
```

### 6.2 SKILL.md 编写最佳实践

**DO（推荐）**：
- 描述实际实现，而不是理想规划
- 如果是规划文档，明确标注 `[PLANNED]`
- 保持文档与代码同步

**DON'T（不推荐）**：
- 描述未实现的功能
- 文档与代码不一致

---

## 7. 结论

### 7.1 整体评价

first skill 的实现质量良好，架构设计优秀，但存在一些文档与实现不一致的问题。其他 skills 对 first skill 生成文档的使用场景合理，但缺少模式感知和存在性检查。

**评分**：
- 代码质量：8/10
- 架构设计：8/10
- 文档一致性：6/10
- 集成质量：7/10
- **综合评分：7.25/10**

### 7.2 下一步行动

1. ✅ 审查完成，生成报告
2. ⏭️ 与团队讨论关键问题
3. ⏭️ 制定改进计划
4. ⏭️ 执行 P0 优先级任务

---

## 附录

### A. 审查文件清单

- `.full-review/phase-1a-code-quality.md` - 代码质量审查
- `.full-review/phase-1b-architecture.md` - 架构审查
- `.full-review/phase-3-integration.md` - 集成审查
- `.full-review/phase-4-comprehensive-report.md` - 综合报告（本文件）

### B. 审查方法

- 代码静态分析
- 文档交叉验证
- 引用关系追踪
- 最佳实践对比

### C. 审查工具

- Serena（代码符号搜索）
- Grep（模式搜索）
- Read（文件读取）
