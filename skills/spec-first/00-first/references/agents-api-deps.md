# API 与外部依赖执行提示

> 这是增强路径提示，不是主题规范正文。只在 CLI 输出证据不足时补 API 接口契约或外部依赖证据。

## 适用场景

- `api-docs.md` 缺少正式接口契约
- `external-deps.md` 缺少第三方服务、外部系统或关键依赖证据

## 对应 runtime 资产

- `api-contracts.json`
- `summary.json`

## 最小执行责任

### B：API 接口契约补强

- 只提取项目正式对外接口契约
- 把事实写入 `api-contracts.json`
- `docs/first/api-docs.md` 只投影接口清单、请求规范、响应规范、鉴权要求、错误语义和证据

### C1：外部依赖补强

- 只提取第三方服务、外部边界和关键依赖线索
- 汇总到 `summary.json` 或相关 runtime 资产
- `docs/first/external-deps.md` 只投影已确认事实

## 工具与降级

- 有符号分析能力时，可用符号定位 route、handler、DTO、auth guard、异常映射
- 无符号分析能力时，退化到路由注册、控制器、装饰器、配置和依赖声明扫描
- 无法确认的接口字段或外部边界必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
