# API 与外部依赖执行提示

> 这是按需补证据提示，不是主题规范正文。由 Skill 按执行流决定是否派发。

## 任务范围

- 只做正式 API 契约与外部依赖边界补强，沉淀到 runtime 真源
- 不把 `docs/first/*.md` 当作真源，也不反向用 docs 修正 runtime

## 输入证据

- 本轮 evidence pack（route/command 注册、handler/controller/adapter、配置、依赖声明）
- 可选补充：DTO、auth guard、异常映射、OpenAPI/Swagger 文件、SDK/客户端封装

## 输出资产

- `api-contracts.json`
- `summary.json`

## 缺口标记

- 无法确认的接口字段或外部边界必须标注 `[待确认]`
- 不得伪造接口契约或依赖关系补洞
- 证据抽样与违规判定：`references/quality-assurance-rules.md`
