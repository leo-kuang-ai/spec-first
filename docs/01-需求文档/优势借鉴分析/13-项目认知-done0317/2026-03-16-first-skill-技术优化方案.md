---
title: First Skill 技术优化方案
date: 2026-03-16
author: Claude
status: proposal
version: 1.0
parent: ./2026-03-16-first-skill-完整性一致性合理性审查报告.md
---

# First Skill 技术优化方案

## 一、问题诊断

### 1.1 根本矛盾

```
┌─────────────────────────────────────────────────────────────────────┐
│  SKILL.md 定义                        实际实现                       │
│  ─────────────                       ──────────                      │
│  Agent 派发模式                      TypeScript 脚本直接生成          │
│  8 个 Agent 并行                     bootstrapFirstRuntime()         │
│  波次依赖执行                         单函数顺序执行                  │
│  证据提取框架                         无（仅静态检测）                 │
│  15 个产物                           9 个 Runtime + 12 个投影         │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                         严重脱节！                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 当前实现分析

| 组件 | 实现方式 | 代码位置 |
|------|----------|----------|
| Runtime 生成 | TypeScript 脚本 | `first-bootstrap.ts:322` |
| Docs 投影 | 模板渲染 | `first-doc-projection.ts` |
| Agent 派发 | **未实现** | N/A |
| 证据提取 | **未实现** | N/A |

### 1.3 技术债务清单

| ID | 债务 | 影响 | 优先级 |
|----|------|------|--------|
| D1 | `modules.json` 孤儿文件 | 状态追踪失效 | P0 |
| D2 | SKILL.md 与实现脱节 | 文档误导 | P0 |
| D3 | 4 个 Legacy 产物无 Runtime | 架构不一致 | P1 |
| D4 | 6 个 Deep 产物未实现 | 功能缺失 | P2 |
| D5 | Agent 派发框架未实现 | 深度分析缺失 | P3 |

---

## 二、最佳实践方案

### 2.1 设计原则

| 原则 | 说明 | 决策 |
|------|------|------|
| **Runtime First** | 真源在 JSON，Docs 是投影 | ✅ 保持 |
| **Script for Speed** | 脚本生成保证快速、确定 | ✅ 保持 |
| **Agent for Depth** | Agent 派发提供深度分析 | ✅ 可选增强 |
| **Evidence Required** | deep 模式需要证据支撑 | ✅ 增强层实现 |
| **Incremental Update** | 增量更新，避免全量重生成 | ✅ 保持 |

### 2.2 推荐方案：混合架构（Hybrid Architecture）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          First Skill 混合架构                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 1: Runtime Truth (TypeScript Script)                       │   │
│  │                                                                  │   │
│  │ bootstrapFirstRuntime()                                          │   │
│  │   ├── buildFirstSummary()      → summary.json                    │   │
│  │   ├── buildRoleViews()         → role-views.json                 │   │
│  │   ├── buildStageViews()        → stage-views.json                │   │
│  │   ├── buildSteering()          → steering.json                   │   │
│  │   ├── buildConventions()       → conventions.json                │   │
│  │   ├── buildCriticalFlows()     → critical-flows.json             │   │
│  │   ├── buildChangeMap()         → change-map.json                 │   │
│  │   ├── buildEntryGuide()        → entry-guide.json                │   │
│  │   ├── buildRebootGuide()       → reboot-guide.json               │   │
│  │   ├── [NEW] buildModules()     → modules.json ★                  │   │
│  │   ├── [NEW] buildApiContracts()→ api-contracts.json ★            │   │
│  │   └── [NEW] buildDomainModels()→ domain-models.json ★            │   │
│  │                                                                  │   │
│  │ 特点：快速、确定、无 LLM 成本、幂等                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼ 投影                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 2: Docs Projection (Template Rendering)                    │   │
│  │                                                                  │   │
│  │ refreshFirstDocsFromRuntime()                                    │   │
│  │   ├── README.md ← 聚合                                           │   │
│  │   ├── summary.md ← summary.json                                  │   │
│  │   ├── role-views.md ← role-views.json                            │   │
│  │   ├── stage-views.md ← stage-views.json                          │   │
│  │   ├── steering.md ← steering.json                                │   │
│  │   ├── conventions.md ← conventions.json                          │   │
│  │   ├── critical-flows.md ← critical-flows.json                    │   │
│  │   ├── change-map.md ← change-map.json                            │   │
│  │   ├── entry-guide.md ← entry-guide.json                          │   │
│  │   ├── reboot-guide.md ← reboot-guide.json                        │   │
│  │   ├── common-playbooks.md ← 多源派生                              │   │
│  │   ├── known-risks-and-traps.md ← 多源派生                         │   │
│  │   ├── [NEW] api-contracts.md ← api-contracts.json ★              │   │
│  │   └── [NEW] domain-models.md ← domain-models.json ★              │   │
│  │                                                                  │   │
│  │ 特点：从 Runtime 投影，保持一致性                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼ 增强（可选）                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 3: Agent Enhancement (Optional, Deep Mode Only)            │   │
│  │                                                                  │   │
│  │ enhanceFirstRuntime()                                            │   │
│  │   ├── Agent CodeAnalyzer   → conventions.evidence[]              │   │
│  │   ├── Agent ApiExtractor   → api-contracts.endpoints[]           │   │
│  │   ├── Agent DomainAnalyzer → domain-models.entities[]            │   │
│  │   └── Agent FlowAnalyzer   → critical-flows.evidence[]           │   │
│  │                                                                  │   │
│  │ 特点：深度分析、证据提取、LLM 增强                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 方案对比

| 维度 | 方案 A（纯脚本） | 方案 B（纯 Agent） | **方案 C（混合）** |
|------|------------------|-------------------|-------------------|
| 执行速度 | ⚡ 极快 | 🐢 慢 | ⚡ 快（脚本）+ 🐢 可选（Agent） |
| LLM 成本 | 💰 无 | 💰💰💰 高 | 💰 基础无 + 可选成本 |
| 分析深度 | 📊 中等 | 📊📊📊 深 | 📊 中等 + 可选深度 |
| 确定性 | ✅ 100% | ❌ 不确定 | ✅ 100% + 可选增强 |
| 维护成本 | 🟢 低 | 🔴 高 | 🟡 中等 |
| 证据支撑 | ❌ 无 | ✅ 有 | 可选 |

**结论**：方案 C（混合架构）是最佳实践。

---

## 三、实施计划

### Phase 1: 收敛与清理（P0，1-2 天）

#### 任务清单

| ID | 任务 | 修改范围 | 验收标准 |
|----|------|----------|----------|
| P1-1 | 纳入 `modules.json` 到 Runtime 体系 | `first-artifact-mapping.ts`, `first-runtime-store.ts` | `FIRST_RUNTIME_ARTIFACTS` 包含 `modules.json` |
| P1-2 | 同步 SKILL.md 产物清单 | `SKILL.md` | 产物清单与实际一致 |
| P1-3 | 清理无效映射 | `first-artifact-mapping.ts` | `PREFIX_FILE_TO_ARTIFACT_MAP` 无孤儿引用 |
| P1-4 | 标注 Legacy 产物 | `docs/first/README.md` | Legacy 产物明确标注 |

#### 代码修改

```typescript
// first-artifact-mapping.ts
export const FIRST_RUNTIME_ARTIFACTS = [
  'summary.json',
  'role-views.json',
  'stage-views.json',
  'steering.json',
  'conventions.json',
  'critical-flows.json',
  'change-map.json',
  'entry-guide.json',
  'reboot-guide.json',
  'modules.json',  // ★ 新增
] as const;
```

### Phase 2: 扩展 Runtime 资产（P1，3-5 天）

#### 新增资产设计

**api-contracts.json**
```typescript
interface FirstApiContracts {
  generatedAt: string;
  framework: string;  // express, koa, nestjs, fastapi, spring, etc.
  baseUrl: string;
  auth: {
    type: 'jwt' | 'session' | 'oauth2' | 'api-key' | 'none';
    header?: string;
    sourceFile?: string;
  };
  responseFormat: {
    wrapper: string;  // { code, data, message }
    sourceFile?: string;
  };
  errorCodes: {
    code: number;
    name: string;
    description?: string;
    sourceFile?: string;
  }[];
  pagination: {
    style: 'offset-limit' | 'page-size' | 'cursor' | 'none';
    params?: string[];
    sourceFile?: string;
  };
  endpoints: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: string;
    sourceFile: string;
    line: number;
  }[];
}
```

**domain-models.json**
```typescript
interface FirstDomainModels {
  generatedAt: string;
  ormType?: 'typeorm' | 'prisma' | 'django' | 'sqlalchemy' | 'gorm' | 'none';
  entities: {
    name: string;
    type: 'aggregate' | 'entity' | 'value-object';
    sourceFile?: string;
    fields: {
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }[];
    relationships?: {
      target: string;
      type: 'one-to-one' | 'one-to-many' | 'many-to-many';
      sourceFile?: string;
    }[];
  }[];
  enums: {
    name: string;
    values: string[];
    sourceFile?: string;
  }[];
  services: {
    name: string;
    methods: string[];
    sourceFile?: string;
  }[];
}
```

#### 任务清单

| ID | 任务 | 修改范围 |
|----|------|----------|
| P2-1 | 定义 `FirstApiContracts` 类型 | `first-runtime-types.ts` |
| P2-2 | 实现 `buildApiContracts()` | `first-api-contracts.ts`（新建） |
| P2-3 | 定义 `FirstDomainModels` 类型 | `first-runtime-types.ts` |
| P2-4 | 实现 `buildDomainModels()` | `first-domain-models.ts`（新建） |
| P2-5 | 更新 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` | `first-artifact-mapping.ts` |
| P2-6 | 实现投影逻辑 | `first-doc-projection.ts` |

### Phase 3: Agent 增强框架（P2，1-2 周）

#### 增强架构设计

```typescript
// first-enhancement.ts
interface FirstEnhancementOptions {
  mode: 'quick' | 'deep';
  enhanceApiContracts?: boolean;
  enhanceDomainModels?: boolean;
  enhanceConventions?: boolean;
  enhanceCriticalFlows?: boolean;
}

interface FirstEnhancementResult {
  enhanced: string[];  // 被增强的资产列表
  evidence: {
    assetId: string;
    evidenceType: 'code' | 'config' | 'test';
    location: string;
    snippet: string;
  }[];
}

async function enhanceFirstRuntime(
  projectRoot: string,
  options: FirstEnhancementOptions
): Promise<FirstEnhancementResult> {
  // 仅 deep 模式执行增强
  if (options.mode !== 'deep') {
    return { enhanced: [], evidence: [] };
  }

  const results: FirstEnhancementResult = { enhanced: [], evidence: [] };

  // 派发增强 Agent（可选）
  if (options.enhanceApiContracts) {
    const apiEvidence = await dispatchAgent('ApiExtractor', projectRoot);
    results.evidence.push(...apiEvidence);
    results.enhanced.push('api-contracts.json');
  }

  // ... 其他增强

  return results;
}
```

#### Agent 规格简化

| Agent | 输入 | 输出 | 触发条件 |
|-------|------|------|----------|
| ApiExtractor | `api-contracts.json`（基础） | `endpoints[]` + 证据 | `--deep --enhance-api` |
| DomainAnalyzer | `domain-models.json`（基础） | `entities[]` + 证据 | `--deep --enhance-domain` |
| CodeAnalyzer | `conventions.json`（基础） | `evidence[]` | `--deep --enhance-conventions` |
| FlowAnalyzer | `critical-flows.json`（基础） | `evidence[]` | `--deep --enhance-flows` |

### Phase 4: Legacy 产物迁移（P3，按需）

#### 迁移策略

| Legacy 产物 | 目标 Runtime | 迁移方式 |
|-------------|--------------|----------|
| `tech-stack.md` | `steering.json` | 合并到 `tech.stack` |
| `api-docs.md` | `api-contracts.json` | 替换为投影 |
| `codebase-overview.md` | `summary.json` | 合并到 `project` |
| `domain-model.md` | `domain-models.json` | 替换为投影 |

---

## 四、SKILL.md 更新方案

### 4.1 产物清单更新

```markdown
## 产物清单

### Runtime Truth（.spec-first/runtime/first/）

| 资产 | 说明 | 模式 |
|------|------|------|
| `index.json` | 索引与健康状态 | quick + deep |
| `summary.json` | 项目摘要 | quick + deep |
| `role-views.json` | 角色视角 | quick + deep |
| `stage-views.json` | 阶段视角 | quick + deep |
| `steering.json` | 导向信息 | quick + deep |
| `conventions.json` | 规范 | deep |
| `critical-flows.json` | 关键链路 | deep |
| `change-map.json` | 变更导航 | deep |
| `entry-guide.json` | 入口指引 | deep |
| `reboot-guide.json` | 恢复入口 | deep |
| `modules.json` | 模块清单 | deep |
| `api-contracts.json` | API 规范 | deep |
| `domain-models.json` | 领域模型 | deep |

### Docs Projection（docs/first/）

| 文档 | Runtime 源 | 模式 |
|------|-----------|------|
| `README.md` | 聚合 | quick + deep |
| `summary.md` | summary.json | quick + deep |
| `role-views.md` | role-views.json | quick + deep |
| `stage-views.md` | stage-views.json | quick + deep |
| `steering.md` | steering.json | quick + deep |
| `conventions.md` | conventions.json | deep |
| `critical-flows.md` | critical-flows.json | deep |
| `change-map.md` | change-map.json | deep |
| `entry-guide.md` | entry-guide.json | deep |
| `reboot-guide.md` | reboot-guide.json | deep |
| `common-playbooks.md` | 多源派生 | deep |
| `known-risks-and-traps.md` | 多源派生 | deep |
| `api-contracts.md` | api-contracts.json | deep |
| `domain-models.md` | domain-models.json | deep |

### Legacy 产物（历史残留，不推荐维护）

| 文档 | 状态 | 建议 |
|------|------|------|
| `tech-stack.md` | Legacy | 信息已合并到 steering.md |
| `api-docs.md` | Legacy | 替换为 api-contracts.md |
| `codebase-overview.md` | Legacy | 信息已合并到 summary.md |
| `domain-model.md` | Legacy | 替换为 domain-models.md |
```

### 4.2 执行流程更新

```markdown
## 执行流程

### 架构说明

First Skill 采用 **Runtime → Docs 投影架构**：

1. **Runtime Truth 生成**：TypeScript 脚本快速生成 JSON 真源
2. **Docs 投影渲染**：从 Runtime 投影生成 Markdown 文档
3. **Agent 增强（可选）**：deep 模式可派发 Agent 进行深度分析

### 流程图

```
spec-first first [--deep]
        │
        ▼
┌─────────────────────────────┐
│ bootstrapFirstRuntime()     │
│ 脚本生成 Runtime JSON       │
│ quick: 5 个 | deep: 13 个   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ refreshFirstDocsFromRuntime()│
│ 投影生成 Markdown Docs      │
│ quick: 4 个 | deep: 14 个   │
└─────────────┬───────────────┘
              │
              ▼ (deep 模式可选)
┌─────────────────────────────┐
│ enhanceFirstRuntime()       │
│ Agent 深度分析 + 证据提取   │
└─────────────────────────────┘
```
```

---

## 五、验收标准

### 5.1 Phase 1 验收

- [ ] `modules.json` 在 `FIRST_RUNTIME_ARTIFACTS` 中
- [ ] `index.json` 追踪 `modules.json`
- [ ] SKILL.md 产物清单与实际一致
- [ ] 无孤儿映射引用

### 5.2 Phase 2 验收

- [ ] `api-contracts.json` 生成正常
- [ ] `domain-models.json` 生成正常
- [ ] 对应投影文档存在
- [ ] 测试覆盖率 ≥80%

### 5.3 Phase 3 验收

- [ ] `--deep --enhance-*` 参数生效
- [ ] Agent 派发正常
- [ ] 证据写入对应 Runtime 资产

---

## 六、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Agent 派发超时 | 中 | 产物不完整 | 降级到脚本生成，标注 `[Agent 超时，使用基础版本]` |
| LLM 成本过高 | 中 | 用户体验差 | 默认不启用 Agent 增强，需显式参数 |
| Legacy 产物依赖 | 低 | 迁移阻力 | 保留 Legacy 产物，标注"不推荐维护" |

---

## 七、总结

| 维度 | 当前状态 | 优化后 |
|------|----------|--------|
| Runtime 资产 | 9 个（1 个孤儿） | 13 个（全部追踪） |
| Docs 投影 | 12 个 + 4 个 Legacy | 14 个（Legacy 标注） |
| 架构一致性 | 50% | 100% |
| SKILL.md 准确性 | 30% | 100% |
| Deep 模式能力 | 无 | 脚本 + 可选 Agent |

**核心改进**：
1. 消除孤儿文件，确保 100% 追踪
2. SKILL.md 与实现 100% 一致
3. 扩展 Runtime 覆盖 API 和领域模型
4. Agent 增强作为可选能力，不影响基础功能
