# API 与外部依赖分析主题

> **当前正式 contract**：单一标准模式 runtime-first。
> 本文档描述 API 与外部依赖的分析主题。正式真源以 `api-contracts.json`、`summary.json`、`steering.json`、`conventions.json` 为准。

## 1. 主题划分

- **B**：接口面识别
- **C1**：外部依赖与第三方服务识别

这些标签仅表示分析主题，不代表运行时必须派发的真实 Agent。

## 2. 正式输出

### runtime truth

- `api-contracts.json`
- `summary.json`
- `steering.json`
- `conventions.json`

### docs outputs

- `docs/first/api-docs.md`
- `docs/first/external-deps.md`

## 3. API 分析要求

必须识别：
- 对外接口类型（CLI / HTTP / RPC / GraphQL / other）
- 入口或 handler
- 请求 / 响应规范
- 鉴权要求
- 错误语义
- 证据来源

约束：
- `api-docs.md` 只服务“项目 API 接口规范”，不承载外部依赖、外部服务或泛化集成说明
- 真源层以结构化字段为主，不要求产出长篇接口说明
- 不得把内部实现细节误判为正式接口

## 4. 外部依赖分析要求

必须识别：
- 关键第三方库
- 外部服务或平台
- 集成边界
- 依赖升级或替换的风险点

约束：
- `external-deps.md` 只能展开已确认 runtime 事实，不得成为旁路清单
- 缺少证据时必须标注 `[待确认]`

## 5. 输出约束

- runtime 事实必须先确认并进入正式 runtime 资产
- docs 只能基于已确认事实展开，不得反向定义真源
- `api-docs.md` 和 `external-deps.md` 默认中文输出
- 命令、接口路径、字段名、包名保持英文原文

## 6. 降级策略

- 无法提取细粒度接口时，至少产出最小接口面摘要
- 无法识别外部服务时，允许只输出依赖声明与风险提示
- 不得臆造接口示例、鉴权方式或外部服务用途

## 7. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
