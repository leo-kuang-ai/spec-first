# First 产物消费指南

> 本文档指导后续 skill（如 `/spec-first:code`）如何高效消费 first 生成的产物。

## 1. 产物结构

first 生成的产物分为两类:

### 1.1 runtime/ (机器消费)

| 产物 | 路径 | 用途 | 消费场景 |
|-----|------|------|---------|
| `index.json` | `.spec-first/runtime/first/` | 产物索引 | 判断上下文是否存在 |
| `structure-overview.json` | `.spec-first/runtime/first/` | 代码结构 | 代码实现、代码结构分析 |
| `api-contracts.json` | `.spec-first/runtime/first/` | API 和依赖 | API 开发、依赖分析 |
| `database-schema.json` | `.spec-first/runtime/first/` | 数据库结构 | 数据库相关开发 |
| `domain-model.json` | `.spec-first/runtime/first/` | 领域模型 | 领域建模、业务逻辑开发 |
| `conventions.json` | `.spec-first/runtime/first/` | 规范约定 | 编码规范、开发环境设置 |

### 1.2 docs/ (人类消费)

| 产物 | 路径 | 用途 | 目标读者 |
|-----|------|------|---------|
| `README.md` | `docs/first/` | 项目认知总览 | 新成员 onboarding |
| `call-graph.md` | `docs/first/` | 调用关系图 | 系统架构理解 |
| `entry-guide.md` | `docs/first/` | 入口指南 | 快速上手 |

> **注意**: `docs/first/*.md` 不参与上下文注入，仅作为人类阅读产物。

## 2. 消费决策

### 2.1 上下文加载策略

后续 skill 执行时,按以下顺序判断需要加载哪些上下文:

```
┌─────────────────────────────────────────────────────────┐
│  判断条件                              │ 加载的产物                                │
├─────────────────────────────────────────────────────────┤
│ 上下文存在?                            │ runtime/first/index.json            │
│ 代码结构分析相关?                       │ runtime/first/structure-overview.json │
│ API/依赖相关?                           │ runtime/first/api-contracts.json    │
│ 数据库相关?                             │ runtime/first/database-schema.json  │
│ 领域模型相关?                           │ runtime/first/domain-model.json     │
│ 规范约定相关?                           │ runtime/first/conventions.json      │
└─────────────────────────────────────────────────────────┘
```

**加载顺序**:
1. **必须先读**: `index.json` (判断上下文是否存在)
2. **按需加载**: 根据任务需要选择加载

### 2.2 粒度控制

| 加载粒度 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|-------|
| 全量加载 | 不确定需要什么 | 信息不会遗漏 | 可能加载过多不必要内容 |
| 按需加载 | 明确需要特定产物 | 精准,高效 | 需要判断逻辑 |
| 入口加载 | 快速了解项目 | 快速上手 | 可能不够深入 |

**推荐策略**: **默认按需加载**, 除非:
- 不确定需要什么 → 全量加载 `index.json` 和 `structure-overview.json`
- 快速概览 → 加载 `docs/first/summary.md` 和 `entry-guide.md`

### 2.3 缺失处理

| 情况 | 处理方式 |
|------|---------|
| 产物不存在 | 提示用户执行 `/spec-first:first` 生成 |
| 产物不完整 | 根据已有产物继续工作,提示可能存在的缺口 |
| 无法确定 | 回退到更基础的产物或询问用户 |

## 3. 刷新策略

| 触发条件 | 动作 | 影响 |
|---------|------|------|
| 项目大重构 | 重新执行 `first` | 全量更新所有产物 |
| 小范围变更 | 只更新相关产物 | 增量更新 |
| 不确定变更范围 | 重新执行 `first` | 确保完整性 |
| 上下文过期 | 执行 `catchup` | 快速恢复上下文 |

**判断标准**:
- `package.json` 最后修改时间
- `src/` 目录结构变化
- 关键配置文件变化

## 4. 使用示例

### 示例 1: 代码实现
```markdown
需要实现一个新功能:
1. 读取 runtime/first/structure-overview.json 了解模块结构
2. 读取 runtime/first/domain-model.json 了解业务概念
3. 开始实现
```

### 示例 2: Bug 修复
```markdown
需要修复一个 bug:
1. 读取 docs/first/call-graph.md 了解调用关系
2. 读取 docs/first/critical-flows.md 了解关键流程
3. 定位问题
```

### 示例 3: API 开发
```markdown
需要新增一个 API:
1. 读取 runtime/first/api-contracts.json 了解现有 API
2. 读取 runtime/first/conventions.json 了解编码规范
3. 设计并实现 API
```

## 5. 注意事项

1. **不要全量加载**: 除非必要,只加载需要的产物
2. **优先 runtime**: runtime 是机器真源,docs 是人类阅读产物
3. **保持新鲜**: 项目变更后及时刷新相关产物
4. **反馈缺口**: 发现产物不完整或有误时,及时反馈
