# API 与外部依赖分析

> 本文档合并了执行提示与主题规范,提供完整的 API 接口与依赖分析视图。

## 1. 主题划分

- **API-SPEC**: 正式 API 接口规范提取
- **API-SUMMARY**: 按入口面聚合的最小规范摘要
- **DEPENDENCY-REF**: 外部依赖仅作为关联项引用,不在本文展开

这些标签仅表示分析主题,不代表运行时必须派发的真实 Agent。
本文只覆盖已确认的正式对外接口；内部 helper、临时调试入口、未确认端点不纳入 API 规范正文。

## 2. 正式输出

### runtime truth
- `api-contracts.json`
- `summary.json`
- `steering.json`
- `conventions.json`

### docs outputs
- `docs/first/api-docs.md`

### 关联文档
- `docs/first/external-deps.md`
- `references/platform-document-mapping.md`

## 3. 任务范围

- 只做正式 API 契约与外部依赖边界补强,沉淀到 runtime 真源
- 只提取已确认正式接口的规范摘要,不做全量接口盘点
- 不把 `docs/first/*.md` 当作真源,也不反向用 docs 修正 runtime

## 4. 输入证据

- 本轮 evidence pack(route/command 注册、handler/controller/adapter、配置、依赖声明)
- Serena 可用时优先使用符号工具,先读 `shared/summary.json` 和 `shared/context.json` 再补接口与依赖证据
- 可选补充:DTO、auth guard、异常映射、OpenAPI/Swagger 文件、SDK/客户端封装

## 5. API 规范提取要求

对每个已确认的正式对外接口,必须提取:
- 对外接口类型(CLI / HTTP / RPC / GraphQL / other)
- 入口或 handler
- 请求 / 响应规范
- 鉴权要求
- 错误语义
- 证据来源

约束:
- `api-docs.md` 只服务"项目 API 接口规范",不承载外部依赖、外部服务或泛化集成说明
- 真源层以结构化字段为主,目标是提炼规范摘要,不是生成全量接口目录
- 先按公开入口面聚合,再补充 canonical 接口规范；不要把同一入口的重复实现拆成多条文档记录
- 不得把内部实现细节误判为正式接口

## 6. 外部依赖引用边界

- `external-deps.md` 只接收已确认 runtime 事实的引用,不在本文展开清单
- 外部依赖、第三方服务与平台边界的细化规则,以 `references/platform-document-mapping.md` 为准
- 缺少证据时必须标注 `[待确认]`

## 7. 输出约束

- 当前任务只负责补足当前 wave 所需证据,帮助生成 `api-contracts.json`、`summary.json`、`steering.json`、`conventions.json`
- runtime 事实必须先确认并进入正式 runtime 资产
- docs 只能基于已确认事实展开,不得反向定义真源
- `api-docs.md` 和 `external-deps.md` 默认中文输出
- 命令、接口路径、字段名、包名保持英文原文
- 不得把长篇分析回灌主线程

## 8. 缺口标记

- 无法确认的接口字段或外部边界必须标注 `[待确认]`
- 不得伪造接口契约或依赖关系补洞

## 9. 降级策略

- 无法提取细粒度接口时,至少产出按入口面聚合的最小规范摘要
- 不得为了"列全"而引入未确认接口清单；缺口统一标注 `[待确认]`
- 无法识别外部服务时,允许只在关联文档中记录已确认依赖声明与风险提示
- 不得臆造接口示例、鉴权方式或外部服务用途

## 10. 质量门禁引用

- 通用证据格式、抽样验证与违规判定统一遵循 `references/quality-assurance-rules.md`
