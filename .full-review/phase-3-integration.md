# Phase 3: 集成审查 - 其他 skills 对 docs/first/ 的使用

**审查时间**: 2026-03-17
**审查范围**: 其他 skills 如何引用和使用 first skill 生成的文档
**审查重点**: 引用方式、使用场景、准确性、最佳实践

---

## 1. 引用概览

通过代码搜索，发现以下 skills 引用了 `docs/first/` 的文档：

| Skill | 引用文件 | 引用数量 | 引用类型 |
|-------|---------|---------|---------|
| **00-onboarding** | output-templates.md | 6 处 | 角色定制推荐 |
| **01-init** | prerequisites.md, output-format.md | 2 处 | 前置条件说明 |
| **11-plan** | risk-assessment.md | 1 处 | 风险缓解措施 |
| **00-first** | references/* | 20+ 处 | 自身参考文档 |

**总体评估**：
- ✅ 引用数量适中，没有过度依赖
- ✅ 引用场景合理，符合各 skill 的职责
- ⚠️ 需要深入分析引用的准确性和最佳实践

---

## 2. onboarding skill 的引用分析

### 2.1 引用场景

**文件**: `skills/spec-first/00-onboarding/references/output-templates.md`

**引用的文档**：
1. `docs/first/codebase-overview.md` - 代码结构概览
2. `docs/first/architecture.md` - 架构设计
3. `docs/first/domain-model.md` - 业务领域模型
4. `docs/first/api-docs.md` - API 接口规范
5. `docs/first/call-graph.md` - 调用链分析

### 2.2 使用方式

onboarding skill 根据用户角色推荐不同的文档：

```markdown
### 开发者
- docs/first/codebase-overview.md - 代码结构概览
- docs/first/architecture.md - 架构设计

### 产品经理
- docs/first/domain-model.md - 业务领域模型
- docs/first/api-docs.md - API 接口规范

### 测试工程师
- docs/first/api-docs.md - API 接口规范

### 架构师
- docs/first/architecture.md - 架构设计
- docs/first/call-graph.md - 调用链分析
```

### 2.3 合理性评估

**优点**：
- ✅ **角色定制合理**：不同角色推荐不同的文档，符合实际需求
- ✅ **文档选择准确**：
  - 开发者需要代码结构和架构 ✓
  - 产品经理需要业务模型和 API ✓
  - 测试工程师需要 API 规范 ✓
  - 架构师需要架构和调用链 ✓
- ✅ **降级策略完善**：当 first 资产不存在时，提示用户先运行 `/spec-first:first`

**潜在问题**：
- ⚠️ **文档存在性检查缺失**：没有检查文档是否真实存在
- ⚠️ **quick/deep 模式差异**：
  - `call-graph.md` 只在 deep 模式生成
  - 如果用户运行了 quick 模式，架构师推荐会失败
- ⚠️ **文档路径硬编码**：如果 first skill 改变输出路径，onboarding 会失效

### 2.4 改进建议

1. **添加文档存在性检查**：
   ```typescript
   const recommendedDocs = [
     'docs/first/architecture.md',
     'docs/first/call-graph.md'
   ].filter(path => existsSync(join(projectRoot, path)));
   ```

2. **区分 quick/deep 模式**：
   ```markdown
   ### 架构师
   - docs/first/architecture.md - 架构设计 [deep 模式]
   - docs/first/call-graph.md - 调用链分析 [deep 模式]

   💡 提示：运行 `/spec-first:first --deep` 生成完整文档
   ```

3. **使用常量而非硬编码路径**：
   ```typescript
   import { CANONICAL_PROJECTION_DOCS } from '../first-artifact-mapping.js';
   ```

---

## 3. init skill 的引用分析

### 3.1 引用场景

**文件**: `skills/spec-first/01-init/references/prerequisites.md`

**引用内容**（第 21 行）：
```markdown
- `docs/first/` 是投影视图层，可缺失或滞后
```

### 3.2 合理性评估

**优点**：
- ✅ **概念准确**：正确理解了 docs/first/ 是投影视图层
- ✅ **容错性说明**：明确指出可以缺失或滞后，不阻塞 init

**改进建议**：
- 建议补充说明：如果缺失，可以通过 `/spec-first:first` 生成

---

## 4. plan skill 的引用分析

### 4.1 引用场景

**文件**: `skills/spec-first/11-plan/references/risk-assessment.md`

**引用内容**（第 43-45 行）：
```markdown
| 项目目标不明确 | HIGH | 执行 `/spec-first:first` 生成项目认知 |
| 团队不熟悉规范 | LOW | 阅读 docs/first/ 中的文档 |
```

### 4.2 合理性评估

**优点**：
- ✅ **风险识别准确**：项目目标不明确确实是高风险
- ✅ **缓解措施合理**：生成项目认知文档是正确的应对方式
- ✅ **使用场景恰当**：在风险评估阶段引用 first skill

**潜在问题**：
- ⚠️ **缺少具体文档推荐**：只说"阅读 docs/first/ 中的文档"，没有指明具体哪些文档

### 4.3 改进建议

更具体的推荐：
```markdown
| 团队不熟悉规范 | LOW | 阅读 docs/first/codebase-overview.md 和 development-guidelines.md |
```

---

## 5. 跨 skill 一致性分析

### 5.1 文档路径一致性

**检查结果**：
- ✅ 所有 skills 使用相同的路径格式：`docs/first/*.md`
- ✅ 没有发现路径不一致的情况

### 5.2 文档名称一致性

**检查结果**：
- ✅ 文档名称与 first skill SKILL.md 定义一致
- ✅ 没有引用不存在的文档

### 5.3 模式感知（quick/deep）

**问题发现**：
- ❌ **缺少模式感知**：其他 skills 没有区分 quick/deep 模式
- ❌ **潜在失败场景**：
  - onboarding 推荐 `call-graph.md`（仅 deep 模式）
  - 用户运行了 quick 模式
  - 文档不存在，推荐失效

**影响评估**：
- 🟡 **中等影响**：不会导致系统崩溃，但用户体验不佳

---

## 6. 最佳实践符合度

### 6.1 符合的最佳实践

1. ✅ **单一真源原则**：所有 skills 都引用 docs/first/，而不是自己生成
2. ✅ **职责分离**：first skill 负责生成，其他 skills 负责使用
3. ✅ **降级策略**：onboarding skill 有完善的降级策略

### 6.2 违反的最佳实践

1. ❌ **硬编码依赖**：路径硬编码，缺少常量引用
2. ❌ **缺少存在性检查**：没有检查文档是否存在
3. ❌ **缺少模式感知**：没有区分 quick/deep 模式

---

## 7. 关键发现总结

### 7.1 优势

1. **引用合理**：所有引用都符合各 skill 的职责和使用场景
2. **角色定制**：onboarding skill 的角色定制推荐设计优秀
3. **降级策略**：有完善的降级策略，容错性好

### 7.2 问题

1. **模式感知缺失**：没有区分 quick/deep 模式，可能导致推荐失效
2. **硬编码路径**：路径硬编码，维护性差
3. **存在性检查缺失**：没有检查文档是否存在

### 7.3 风险评估

- 🟡 **中风险**：模式感知缺失可能导致用户体验问题
- 🟢 **低风险**：硬编码路径在短期内不会有问题
- 🟢 **低风险**：存在性检查缺失不会导致系统崩溃

---

## 8. 改进建议优先级

### P0（高优先级）

1. **添加模式感知**：
   - onboarding skill 检查 first runtime index，识别 quick/deep 模式
   - 根据模式调整推荐文档列表

2. **添加存在性检查**：
   - 推荐文档前检查文件是否存在
   - 如果不存在，提示用户运行 `/spec-first:first`

### P1（中优先级）

3. **使用常量引用**：
   - 从 `first-artifact-mapping.ts` 导入常量
   - 避免硬编码路径

### P2（低优先级）

4. **补充具体文档推荐**：
   - plan skill 的风险缓解措施更具体

---

## 9. 下一步行动

1. ✅ 完成 Phase 3 集成审查
2. ⏭️ Phase 4：生成综合审查报告
