# First Skill 重构技术方案 v2.0

> **版本**: v2.0.0  
> **日期**: 2026-03-17  
> **基于**: Runtime-First 架构 + SDD 最佳实践

---

## 一、方案合理性审查

### 1.1 原方案的主要问题

**问题 1：架构理解偏差**
- ❌ 原方案把 `docs/first/` 当成真理源
- ✅ 实际：`.spec-first/runtime/first/` (JSON) 才是真理源
- ✅ 实际：`docs/first/` 是投影层（人类可读视图）

**问题 2：过度设计 - 投影文档物理存储**
- ❌ 原方案设计了独立的投影文档存储在 `skills/.../references/`
- ⚠️ 问题：维护两份数据，容易不一致
- ✅ 改进：投影应该是运行时动态生成，或者复用现有的 references

**问题 3：复杂度过高 - 元数据和版本管理**
- ❌ 原方案设计了复杂的 YAML front matter、语义化版本、依赖追踪
- ⚠️ 问题：项目还在开发阶段，过早优化
- ✅ 改进：简化为基本的时间戳和状态标记

**问题 4：自动同步不现实**
- ❌ 原方案设计了自动识别代码变更并更新文档
- ⚠️ 问题：需要复杂的代码分析，实现成本高，准确率低
- ✅ 改进：半自动化，提供更新建议，由用户确认

**问题 5：缺少现有实现的调研**
- ❌ 原方案没有考虑现有的 Runtime-First 架构
- ⚠️ 问题：与现有实现冲突，无法平滑集成
- ✅ 改进：基于现有架构增量改进

### 1.2 现有架构的优势

**Runtime-First 三层模型**（已实现）：
```
代码库 → Runtime Truth (JSON) → Projection (Markdown)
         ↑ 真理源              ↑ 人类视图
```

**优势**：
1. **单一真理源**：JSON 结构化，易于程序处理和验证
2. **关注点分离**：机器层（JSON）+ 人类层（MD）
3. **可追溯性**：所有投影都可以追溯到 runtime truth
4. **可验证性**：JSON schema 可以自动校验完整性

**13 个 Runtime 资产**（已定义）：
- summary.json, role-views.json, stage-views.json, steering.json
- conventions.json, critical-flows.json, change-map.json
- entry-guide.json, reboot-guide.json, api-contracts.json
- structure-overview.json, domain-model.json, database-schema.json

---

## 二、基于最佳实践的改进方案

### 2.1 核心设计原则

**P1: 单一真理源（Single Source of Truth）**
- Runtime JSON 是唯一真理源
- 所有投影都从 runtime 派生
- 禁止手动编辑投影文档

**P2: 分层清晰（Clear Layering）**
```
Layer 1: 代码库（Code）
         ↓ 分析提取
Layer 2: Runtime Truth（JSON）← 唯一可编辑层
         ↓ 投影渲染
Layer 3: Projection Views（Markdown）← 只读
         ↓ 上下文注入
Layer 4: Skill Execution（AI Context）
```

**P3: 按需加载（Lazy Loading）**
- 不同 skill 加载不同的 runtime 资产子集
- 避免 token 浪费和上下文污染

**P4: 增量更新（Incremental Update）**
- 支持全量重建：`spec-first first init`
- 支持增量刷新：`spec-first first refresh`
- 支持单项更新：`spec-first first refresh --asset=domain-model`

**P5: 可观测性（Observability）**
- Runtime 健康度检查
- 投影一致性校验
- 新鲜度监控

**P6: 健壮降级（Graceful Degradation）**
- Runtime 缺失时不阻塞 skill 执行
- 提供友好提示和降级策略
- 支持部分可用

### 2.2 架构设计

#### 三层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   First Skill v2.0 架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Layer 1: Code Analysis（代码分析层）                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Analyzers:                                           │   │
│  │  - AST Parser (TypeScript/JavaScript)                │   │
│  │  - Dependency Graph (madge, npm ls)                  │   │
│  │  - Git History (commits, contributors)               │   │
│  │  - Config Parser (package.json, tsconfig.json)       │   │
│  │  - Database Schema (Prisma, TypeORM)                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ 提取                               │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Layer 2: Runtime Truth（真理源层）                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  .spec-first/runtime/first/                           │   │
│  │  ├── index.json              (索引 + 元数据)         │   │
│  │  ├── summary.json            (项目摘要)              │   │
│  │  ├── structure-overview.json (代码结构)              │   │
│  │  ├── domain-model.json       (领域模型)              │   │
│  │  ├── api-contracts.json      (API 契约)              │   │
│  │  ├── database-schema.json    (数据库 Schema)         │   │
│  │  ├── critical-flows.json     (关键流程)              │   │
│  │  ├── conventions.json        (开发规范)              │   │
│  │  ├── role-views.json         (角色视图)              │   │
│  │  ├── stage-views.json        (阶段视图)              │   │
│  │  ├── steering.json           (决策指南)              │   │
│  │  ├── entry-guide.json        (入口指南)              │   │
│  │  ├── reboot-guide.json       (重启指南)              │   │
│  │  └── change-map.json         (变更映射)              │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ 投影                               │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Layer 3: Projection Views（投影视图层）              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  docs/first/                                          │   │
│  │  ├── README.md                                        │   │
│  │  ├── codebase-overview.md                            │   │
│  │  ├── tech-stack.md                                   │   │
│  │  ├── architecture.md                                 │   │
│  │  ├── domain-model.md                                 │   │
│  │  ├── api-docs.md                                     │   │
│  │  ├── database-er.md          (条件型)                │   │
│  │  ├── external-deps.md                                │   │
│  │  ├── call-graph.md                                   │   │
│  │  ├── critical-flows.md                               │   │
│  │  ├── development-guidelines.md                       │   │
│  │  ├── local-setup.md                                  │   │
│  │  ├── entry-guide.md                                  │   │
│  │  ├── change-map.md                                   │   │
│  │  └── reboot-guide.md                                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ 上下文注入                         │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Layer 4: Skill Context（Skill 上下文层）             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Context Resolver:                                    │   │
│  │  - 根据 skill 类型选择 runtime 资产子集              │   │
│  │  - 动态加载并注入到 skill prompt                     │   │
│  │  - 支持降级策略（资产缺失时）                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Skill 上下文映射表

| Skill | Stage | 需要的 Runtime 资产 | 用途 |
|-------|-------|-------------------|------|
| spec | 01_specify | domain-model, api-contracts, structure-overview | 理解现有业务边界和 API |
| design | 02_design | architecture, conventions, database-schema, critical-flows | 了解架构约束和设计规范 |
| task | 03_plan | structure-overview, conventions, critical-flows, entry-guide | 理解代码结构和开发规范 |
| code | 04_implement | conventions, entry-guide, critical-flows | 编码规范和关键流程 |
| test | 05_verify | conventions, critical-flows | 测试策略和关键场景 |
| review | 06_wrap_up | change-map, critical-flows | 变更影响分析 |
| release | 07_release | reboot-guide, change-map | 发布流程和变更说明 |
| catchup | 任意 | summary, role-views, stage-views | 快速恢复上下文 |

**设计要点**：
- 每个 skill 只加载必要的资产，避免 token 浪费
- 资产以 JSON 格式注入，保持结构化
- 支持按需扩展：skill 可以在执行中请求更多资产

### 2.4 文档同步机制

**问题**：如何在需求完成后（07/08 阶段）更新 first 文档？

**方案**：半自动化 + 人工确认

```
┌─────────────────────────────────────────────────────────┐
│ 文档同步流程（07_release / 08_done 阶段触发）           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. 变更检测                                             │
│     ├─ git diff 分析本次需求的文件变更                  │
│     ├─ 识别变更类型：新增/修改/删除                     │
│     └─ 映射到受影响的 runtime 资产                      │
│                                                           │
│  2. 更新建议生成                                         │
│     ├─ 新增 API → 建议更新 api-contracts.json          │
│     ├─ 新增领域概念 → 建议更新 domain-model.json       │
│     ├─ 架构变更 → 建议更新 architecture (runtime)       │
│     ├─ 新增关键流程 → 建议更新 critical-flows.json     │
│     └─ 依赖变更 → 建议更新 summary.json                 │
│                                                           │
│  3. 用户确认                                             │
│     ├─ CLI 展示建议清单                                  │
│     ├─ 用户选择需要更新的资产                           │
│     └─ 用户可以跳过或延后                               │
│                                                           │
│  4. 辅助更新                                             │
│     ├─ 打开对应的 JSON 文件                             │
│     ├─ 提供更新模板和示例                               │
│     ├─ 用户手动编辑 JSON                                │
│     └─ 自动校验 JSON schema                             │
│                                                           │
│  5. 重新投影                                             │
│     ├─ 更新 runtime truth 后                            │
│     ├─ 自动重新生成 Markdown 投影                       │
│     └─ 更新 index.json 的时间戳                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**CLI 命令**：
```bash
# 在 07/08 阶段执行
spec-first first sync --feature <featureId>

# 输出示例：
# 📊 检测到本次需求的变更：
#   - 新增文件: src/core/new-module.ts
#   - 修改文件: src/shared/types.ts (新增 3 个类型)
#   - 修改文件: package.json (新增依赖 zod)
#
# 💡 建议更新以下 runtime 资产：
#   [1] api-contracts.json - 新增 3 个 API 接口
#   [2] domain-model.json - 新增 NewModule 领域概念
#   [3] summary.json - 更新依赖列表
#
# ❓ 是否现在更新？(y/n/later)
```

**实现要点**：
- 不要试图自动更新，而是提供智能建议
- 用户确认后，打开编辑器让用户手动修改 JSON
- 提供 JSON schema 校验，确保格式正确
- 更新后自动重新生成 Markdown 投影

### 2.5 健壮性保障

**场景 1：Runtime 完全缺失**
```typescript
// first-context.ts
export async function loadFirstContext(skillName: string): Promise<FirstContext | null> {
  const runtimePath = '.spec-first/runtime/first';
  
  if (!fs.existsSync(runtimePath)) {
    console.warn('⚠️  First runtime 未初始化，建议运行: spec-first first init');
    return null; // 返回 null，不阻塞
  }
  
  // 加载对应的资产...
}
```

**场景 2：部分资产缺失**
```typescript
// 加载资产时使用 Optional
const context: FirstContext = {
  domainModel: await loadAsset('domain-model.json').catch(() => null),
  apiContracts: await loadAsset('api-contracts.json').catch(() => null),
  // ...
};

// 在 skill prompt 中条件渲染
{{#if firstContext.domainModel}}
## 领域模型
{{firstContext.domainModel}}
{{else}}
⚠️ 领域模型未生成，建议运行 `spec-first first refresh --asset=domain-model`
{{/if}}
```

**场景 3：资产过期**
```typescript
// index.json 中记录时间戳
{
  "version": "2.0.0",
  "lastUpdated": "2026-03-17T10:30:00Z",
  "assets": {
    "domain-model": {
      "status": "healthy",
      "lastUpdated": "2026-03-17T10:30:00Z"
    },
    "api-contracts": {
      "status": "stale", // 超过 7 天未更新
      "lastUpdated": "2026-03-10T08:00:00Z"
    }
  }
}

// 加载时检查新鲜度
if (asset.status === 'stale') {
  console.warn(`⚠️  ${assetName} 已过期，建议刷新`);
}
```

### 2.6 SDD 最佳实践的具体体现

**1. 文档即规范（Documentation as Specification）**

Runtime JSON 不仅是文档，更是规范：
- API contracts 定义了接口契约
- Domain model 定义了领域边界
- Conventions 定义了开发规范

**实现**：
- 在 gate-engine 中增加 first 文档完整性检查
- 在 02_design 阶段，要求 design.md 必须符合 conventions.json
- 在 04_implement 阶段，要求代码必须符合 api-contracts.json

**2. 可追溯性（Traceability）**

每个实现都能追溯到 first 文档：
```
Feature → Spec → Design → Task → Code → First Runtime
```

**实现**：
- 在 trace-engine 中支持 first 文档的追溯查询
- 命令：`spec-first id search --type first --name domain-model`
- 输出：哪些 Feature 修改了 domain-model.json

**3. 自动化校验（Automated Validation）**

Runtime JSON 可以被自动校验：
- JSON schema 校验格式
- Linter 规则校验一致性
- Gate 检查完整性

**实现**：
```typescript
// validators/first-runtime-validator.ts
export function validateFirstRuntime(): ValidationResult {
  const errors: string[] = [];
  
  // 1. 检查必需资产是否存在
  const requiredAssets = ['summary', 'domain-model', 'api-contracts'];
  for (const asset of requiredAssets) {
    if (!fs.existsSync(`.spec-first/runtime/first/${asset}.json`)) {
      errors.push(`缺少必需资产: ${asset}.json`);
    }
  }
  
  // 2. 检查 JSON schema
  for (const asset of getAllAssets()) {
    const valid = validateSchema(asset);
    if (!valid) {
      errors.push(`${asset} 格式错误`);
    }
  }
  
  // 3. 检查一致性
  // 例如：api-contracts 中的类型必须在 domain-model 中定义
  
  return { valid: errors.length === 0, errors };
}
```

**4. 持续演进（Continuous Evolution）**

文档随项目演进：
- 每次需求完成后更新
- 版本化管理
- 可追溯历史

**实现**：
- index.json 记录版本号和更新历史
- Git 管理 runtime JSON 文件
- 提供 `spec-first first history` 查看演进历史

---

## 三、实施计划

### 3.1 Phase 1: 核心重构（P0）

**目标**：建立 Runtime-First 架构的核心能力

**任务**：
1. ✅ 保留现有的 13 个 runtime 资产定义
2. ✅ 保留现有的投影渲染机制
3. 🔧 增强 first-context.ts：实现按需加载
4. 🔧 增强 context-resolver.ts：实现 skill 上下文映射
5. 🔧 修改各 skill 的 SKILL.md：使用条件渲染

**验收标准**：
- 每个 skill 只加载必要的 runtime 资产
- Runtime 缺失时不阻塞 skill 执行
- 所有测试通过

### 3.2 Phase 2: 文档同步（P1）

**目标**：实现半自动化的文档同步机制

**任务**：
1. 实现变更检测：分析 git diff
2. 实现更新建议生成：映射变更到资产
3. 实现 CLI 命令：`spec-first first sync`
4. 实现 JSON 编辑辅助：模板和校验
5. 集成到 07/08 阶段的 gate 检查

**验收标准**：
- 能够检测代码变更并生成更新建议
- 用户可以方便地更新 runtime JSON
- 更新后自动重新生成投影

### 3.3 Phase 3: 可观测性（P2）

**目标**：提供文档健康度监控

**任务**：
1. 实现 index.json 元数据管理
2. 实现新鲜度检查
3. 实现完整性校验
4. 实现 CLI 命令：`spec-first first status`
5. 集成到 metrics-engine

**验收标准**：
- 可以查看每个资产的状态和新鲜度
- 可以检测资产缺失和过期
- 提供健康度评分

### 3.4 Phase 4: SDD 增强（P3）

**目标**：深化 SDD 最佳实践

**任务**：
1. 实现 first 文档的追溯查询
2. 实现 gate 检查中的 first 文档校验
3. 实现 linter 规则：代码符合 conventions
4. 实现历史查询：`spec-first first history`
5. 完善文档和示例

**验收标准**：
- 可以追溯每个 Feature 对 first 文档的修改
- Gate 检查能够验证文档完整性
- 提供完整的使用文档

---

## 四、关键决策记录

### 4.1 为什么选择 Runtime-First 而不是 Markdown-First？

**决策**：Runtime JSON 作为真理源，Markdown 作为投影

**理由**：
1. **结构化**：JSON 易于程序处理、验证、查询
2. **可追溯**：JSON 可以记录元数据、版本、依赖
3. **关注点分离**：机器层和人类层分离
4. **单一真理源**：避免多份数据不一致

**代价**：
- 用户不能直接编辑 Markdown
- 需要维护投影渲染逻辑

**权衡**：收益大于代价

### 4.2 为什么选择半自动化同步而不是全自动？

**决策**：提供更新建议，由用户确认和编辑

**理由**：
1. **准确性**：代码分析无法 100% 准确识别语义变更
2. **灵活性**：用户可以决定是否更新、如何更新
3. **可控性**：避免自动化错误导致文档污染
4. **学习成本**：用户在编辑过程中理解文档结构

**代价**：
- 需要用户手动操作
- 可能被用户忽略

**权衡**：准确性和可控性更重要

### 4.3 为什么不物理存储投影文档？

**决策**：投影文档动态生成，或者复用现有的 references

**理由**：
1. **单一真理源**：避免两份数据不一致
2. **维护成本**：减少需要维护的文件数量
3. **灵活性**：可以根据需要动态调整投影内容

**代价**：
- 每次需要时都要生成，可能有性能开销

**权衡**：一致性比性能更重要，且性能开销可接受

---

## 五、总结

### 5.1 核心改进

1. **架构对齐**：基于现有的 Runtime-First 架构，而不是重新设计
2. **简化设计**：去除过度设计（复杂元数据、物理投影存储）
3. **务实方案**：半自动化同步，而不是不现实的全自动
4. **健壮降级**：资产缺失时不阻塞，提供友好提示
5. **SDD 深化**：具体的可追溯、可验证、可演进机制

### 5.2 与原方案的对比

| 维度 | 原方案 | 改进方案 |
|------|--------|---------|
| 真理源 | docs/first/ (MD) | .spec-first/runtime/first/ (JSON) |
| 投影存储 | 物理存储 | 动态生成或复用 references |
| 元数据 | 复杂的 YAML front matter | 简化的 index.json |
| 同步机制 | 全自动 | 半自动化 + 人工确认 |
| 版本管理 | 语义化版本 | 简化的时间戳 |
| 与现有实现 | 冲突 | 对齐并增强 |

### 5.3 下一步行动

1. **评审方案**：与团队讨论，确认技术路线
2. **原型验证**：实现 Phase 1 的核心功能，验证可行性
3. **迭代开发**：按 Phase 1-4 逐步实施
4. **持续优化**：根据使用反馈持续改进

---

**附录：参考资料**

- 现有实现：`skills/spec-first/00-first/SKILL.md`
- Runtime 资产：`.spec-first/runtime/first/`
- 投影文档：`docs/first/`
- 相关模块：`src/core/skill-runtime/first-*.ts`
