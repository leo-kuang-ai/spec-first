# 代码分析执行提示

> 这是按需补证据提示，不是主题规范正文。
> 由 Skill 按执行流决定是否派发，不由 CLI 判断是否触发。

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
- 产出 `structure-overview.json` 所需的结构化事实
- 同时补齐 `docs/first/codebase-overview.md` 所需的阅读材料

### A2：架构关系补强

- 补模块依赖方向、层次边界、关键协作关系
- 事实仍归并到 `structure-overview.json`
- `docs/first/architecture.md` 只能展开已确认事实，不得额外发明结构边界

### A3：调用链补强

- 补关键入口、主调用路径、高扩散风险
- 事实写入 `critical-flows.json`
- `docs/first/call-graph.md` 只负责表达已确认链路

## 工具与降级

- 有符号分析能力时，可优先用符号概览和引用关系补证据
- 无符号分析能力时，退化到目录、入口、import/export 和配置线索分析
- 无法确认的边界或调用关系必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
