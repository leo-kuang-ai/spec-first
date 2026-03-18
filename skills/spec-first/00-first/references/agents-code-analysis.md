# 代码分析执行提示

> 这是增强路径提示，不是主题规范正文。只在 CLI 输出证据不足时补当前缺失的结构、架构或调用链证据。

## 适用场景

- `codebase-overview.md` 证据不足
- `architecture.md` 缺少模块边界或依赖方向
- `call-graph.md` 缺少关键入口、高扩散点或高风险链路

## 对应 runtime 资产

- `structure-overview.json`
- `critical-flows.json`

## 最小执行责任

### A1：代码库概览补强

- 补模块边界、入口点、阅读顺序
- 先把事实写入 `structure-overview.json`
- 再由 projection 生成 `docs/first/codebase-overview.md`

### A2：架构关系补强

- 补模块依赖方向、层次边界、关键协作关系
- 事实仍归并到 `structure-overview.json`
- `docs/first/architecture.md` 只作为投影视图

### A3：调用链补强

- 补关键入口、主调用路径、高扩散风险
- 事实写入 `critical-flows.json`
- 再投影到 `docs/first/call-graph.md`

## 工具与降级

- 有符号分析能力时，可优先用符号概览和引用关系补证据
- 无符号分析能力时，退化到目录、入口、import/export 和配置线索分析
- 无法确认的边界或调用关系必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
