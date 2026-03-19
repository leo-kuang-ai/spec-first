# 平台文档映射配置

> 定义不同端类型如何影响 `first` 的分析重点。
> 当前正式 contract 为单一标准模式：正式文档全集固定，端类型影响**内容侧重点**与**条件型能力适用性**，不再裁剪正式文档集合。

## 1. 正式文档全集

### 基础文档（固定 9 个）

- `README.md`
- `summary.md`
- `steering.md`
- `conventions.md`
- `critical-flows.md`
- `entry-guide.md`
- `api-docs.md`
- `codebase-overview.md`
- `domain-model.md`

### 正式专题文档（固定 4 个）

- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `development-guidelines.md`

### 条件型文档（按状态产出）

- `database-er.md`

## 2. 端类型影响规则

| 端类型 | 强调内容 | 条件型能力 |
|--------|----------|------------|
| backend | API、领域模型、数据库、调用链 | 常见适用 |
| frontend | 代码结构、架构、外部依赖、开发规范 | 通常不适用 |
| mobile | 架构、外部 SDK、本地环境、领域模型 | 仅本地数据库场景适用 |
| cross-platform | 平台边界、桥接层、依赖差异 | 视项目实现而定 |
| desktop | 进程边界、系统依赖、本地环境 | 视项目实现而定 |
| monorepo | 根级概览 + 子包结构 + 入口导航 | 按子包实际情况判断 |
| mixed | 前后端边界、集成点、关键流 | 后端部分可能适用 |

## 3. 内容侧重点

### backend

- `api-docs.md` 以接口面、鉴权、响应结构为重点
- `domain-model.md` 以实体、状态、规则为重点
- `call-graph.md` 以请求链路、服务链路为重点

### frontend

- `codebase-overview.md` 以页面、组件、状态管理为重点
- `architecture.md` 以前端架构模式与边界为重点
- `external-deps.md` 以 UI 库、SDK、CDN / BFF 依赖为重点

### mobile / cross-platform / desktop

- `architecture.md` 关注平台层、桥接层、进程边界
- `development-guidelines.md` 同时关注平台特定规范与本地环境配置

## 4. 条件型能力判定

`database-er.md` 不是按端类型硬编码启用，而是由 `database-schema.json` 的状态决定：

- `healthy` → 产出 `database-er.md`
- `not_applicable` → 不产出
- `degraded` → 不产出正式文档，仅记录告警

## 5. 降级策略

- 无法识别端类型时，仍产出正式文档全集
- 未确定的内容以 `[待确认]` 标注
- 不得因为端类型识别失败而裁剪正式文档 contract
