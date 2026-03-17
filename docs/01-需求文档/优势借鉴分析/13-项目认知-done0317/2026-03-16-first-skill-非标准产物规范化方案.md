---
title: First Skill 非标准产物规范化方案
date: 2026-03-16
author: Claude
status: proposal
version: 1.0
parent: ./2026-03-15-first-skill-项目认知编译器优化方案.md
---

# First Skill 非标准产物规范化方案

> 目标：将 `tech-stack.md`、`api-docs.md`、`domain-model.md` 纳入 Runtime 体系，保持 `codebase-overview.md` 为 Quick 模式直接生成。

---

## 一、背景分析

### 1.1 当前问题

| 产物 | 生成方式 | Runtime 支持 | 问题 |
|------|----------|-------------|------|
| `tech-stack.md` | Agent A 直接生成 | ⚠️ 部分（`steering.tech.stack` 存在但未投影） | 无法追踪状态、无专用投影 |
| `api-docs.md` | Agent B 直接生成 | ❌ | 无法被 `code/verify` 消费 |
| `codebase-overview.md` | Agent C 直接生成 | ❌ | 仅人类导航用途，可保持现状 |
| `domain-model.md` | Agent D 直接生成 | ⚠️ 部分（`summary.dataModels` 存在但未投影） | 结构化不足 |

### 1.2 分层决策

| 产物 | 处理方式 | 理由 |
|------|----------|------|
| `tech-stack.md` | **纳入 Runtime** | `spec/design` 需要知道技术约束，`steering.json` 已有基础 |
| `api-docs.md` | **纳入 Runtime** | `code/verify` 需要验证 API 契约 |
| `codebase-overview.md` | **保持 Quick 模式** | 主要是人类导航用途，无程序化消费需求 |
| `domain-model.md` | **纳入 Runtime** | 与 `summary.dataModels` 可合并投影 |

---

## 二、方案设计

### 2.1 tech-stack.md → steering.json 投影

**现状**：`FirstSteering.tech.stack` 已存在，但未投影到 `tech-stack.md`

**改造**：
1. 扩展 `FirstSteering.tech` 结构化程度
2. 在 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` 中添加 `tech-stack.md` 映射
3. 在 `first-doc-projection.ts` 中添加投影逻辑

```typescript
// 扩展 FirstSteering.tech
interface FirstSteering {
  // ...existing fields...
  tech: {
    stack: string[];
    stackDetails?: {
      name: string;
      version?: string;
      purpose: string;
      configFiles?: string[];
    }[];
    constraints: string[];
    forbiddenPatterns: string[];
  };
}
```

### 2.2 api-docs.md → 新增 api-contracts.json

**现状**：无 Runtime 支持，Agent B 直接生成 markdown

**改造**：
1. 新增 `FirstApiContracts` 接口
2. 在 `FIRST_RUNTIME_ARTIFACTS` 中添加 `api-contracts.json`
3. 在 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` 中添加 `api-docs.md` 映射
4. 新增 `first-api-contracts.ts` 生成模块

```typescript
interface FirstApiContracts {
  generatedAt: string;
  endpoints: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: string;
    sourceFile: string;
    line: number;
    description?: string;
    parameters?: {
      name: string;
      type: string;
      required: boolean;
    }[];
    responseBody?: string;
  }[];
  openApiSpec?: string; // 可选：生成 OpenAPI spec 路径
}
```

### 2.3 domain-model.md → summary.json 投影

**现状**：`FirstRuntimeSummary.dataModels` 存在但结构简单

**改造**：
1. 扩展 `FirstRuntimeSummary.dataModels` 结构化程度
2. 在 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP['summary.json']` 中添加 `domain-model.md`
3. 在 `first-doc-projection.ts` 中添加投影逻辑

```typescript
interface FirstRuntimeSummary {
  // ...existing fields...
  dataModels: string[]; // 保持兼容
  dataModelDetails?: {
    name: string;
    type: 'entity' | 'valueObject' | 'aggregate' | 'service';
    fields?: {
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }[];
    relationships?: {
      target: string;
      type: 'hasOne' | 'hasMany' | 'belongsTo';
    }[];
    sourceFile?: string;
  }[];
}
```

### 2.4 codebase-overview.md → 保持 Quick 模式

**理由**：
- 主要是人类导航用途（"从哪里开始读代码"）
- 无后续 skill 声明需要程序化消费
- Quick 模式追求速度，直接生成更合适

**改进**：
- 在 `docs/first/README.md` 中明确标注为 **Quick/Legacy Doc**
- 添加说明："此文档为 Quick 模式直接生成，不受 Runtime 真源自动刷新保障"

---

## 三、任务拆解

| ID | 任务 | 修改范围 | 预估 |
|----|------|----------|------|
| N01 | 扩展 `FirstSteering.tech` 结构 | `first-runtime-types.ts` | 0.5d |
| N02 | 添加 `tech-stack.md` 投影映射 | `first-artifact-mapping.ts`, `first-doc-projection.ts` | 0.5d |
| N03 | 新增 `FirstApiContracts` 类型 | `first-runtime-types.ts` | 0.5d |
| N04 | 新增 `api-contracts.json` 生成逻辑 | `first-api-contracts.ts` (新), `first-bootstrap.ts` | 1.5d |
| N05 | 添加 `api-docs.md` 投影逻辑 | `first-artifact-mapping.ts`, `first-doc-projection.ts` | 0.5d |
| N06 | 扩展 `FirstRuntimeSummary.dataModelDetails` | `first-runtime-types.ts` | 0.5d |
| N07 | 添加 `domain-model.md` 投影映射 | `first-artifact-mapping.ts`, `first-doc-projection.ts` | 0.5d |
| N08 | 更新 `docs/first/README.md` 边界说明 | `first-doc-projection.ts` | 0.5d |
| N09 | 更新 `index.json` schema | `first-runtime-types.ts`, `first-runtime-store.ts` | 0.5d |
| N10 | 更新 `context-resolver` 消费逻辑 | `context-resolver.ts` | 0.5d |
| N11 | 补充测试用例 | `tests/unit/first-*.test.ts` | 1d |
| N12 | 更新 SKILL.md 文档 | `skills/spec-first/00-first/SKILL.md` | 0.5d |

**总计预估**：7d

---

## 四、执行顺序

```
Phase 1: 类型定义 (N01, N03, N06, N09)
    ↓
Phase 2: 生成逻辑 (N04)
    ↓
Phase 3: 投影映射 (N02, N05, N07, N08)
    ↓
Phase 4: 消费集成 (N10)
    ↓
Phase 5: 测试与文档 (N11, N12)
```

---

## 五、依赖关系

```
N01 ──┐
N03 ──┼── N04 ──┬── N02 ──┐
N06 ──┤         │         ├── N10 ── N11
N09 ──┘         ├── N05 ──┤
                │         ├── N12
                └── N07 ──┴── N08
```

---

## 六、验收标准

### 6.1 tech-stack.md

- [ ] `steering.json` 包含结构化的技术栈信息
- [ ] `docs/first/tech-stack.md` 由 Runtime 投影生成
- [ ] `index.json` 记录 `steering.json` 健康状态

### 6.2 api-docs.md

- [ ] 新增 `api-contracts.json` Runtime 资产
- [ ] `docs/first/api-docs.md` 由 Runtime 投影生成
- [ ] `code/verify` skill 可消费 `api-contracts` 切片

### 6.3 domain-model.md

- [ ] `summary.json` 包含结构化的领域模型信息
- [ ] `docs/first/domain-model.md` 由 Runtime 投影生成

### 6.4 codebase-overview.md

- [ ] 保持 Quick 模式直接生成
- [ ] `README.md` 明确标注为 Legacy Doc

### 6.5 整体验收

- [ ] `CANONICAL_PROJECTION_DOCS` 包含新增文档
- [ ] `--check-health` 覆盖新增 Runtime 资产
- [ ] 所有测试通过

---

## 七、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| `api-contracts.json` schema 复杂 | 生成逻辑复杂度高 | 先做最小子集，后续迭代扩展 |
| 现有 `api-docs.md` 用户习惯 | 投影格式变化 | 保持 markdown 格式兼容，只改变数据来源 |
| `steering.json` 字段冲突 | 向后兼容问题 | 新增字段为 optional，保持现有字段不变 |

---

## 八、明确不做

- 不一次性迁移所有 Quick 模式产物
- 不改变 Quick 模式的执行速度（Quick 模式仍可直接生成部分文档）
- 不引入复杂的 API 参数类型推断（后续迭代）
