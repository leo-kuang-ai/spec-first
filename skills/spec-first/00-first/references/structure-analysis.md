# 代码结构分析主题

> **当前正式 contract**：单一标准模式 runtime-first。
> 本文档描述代码结构相关的分析主题与证据来源。正式真源是 `structure-overview.json`；`codebase-overview.md`、`architecture.md`、`call-graph.md` 都只是阅读输出。
> 执行提示见 `references/agents-code-analysis.md`，两者分工不同。

## 1. 主题划分

为便于理解，保留历史标签：

- **A1**：代码库概览
- **A2**：架构关系
- **A3**：调用链提示

这些标签仅表示分析主题，不代表运行时必须派发的真实 Agent。

## 2. 正式输出

### runtime truth

- `structure-overview.json`

### docs outputs

- `docs/first/codebase-overview.md`
- `docs/first/architecture.md`
- `docs/first/call-graph.md`

## 3. 证据来源

- 目录结构与模块边界
- 入口文件与命令入口
- import / export 关系
- 配置文件与构建入口
- 关键流程文件与测试钩子

## 4. 最低要求

### A1：代码库概览

必须回答：
- 项目主要模块有哪些
- 入口点在哪里
- 从哪里开始阅读

### A2：架构关系

必须回答：
- 模块边界如何划分
- 关键依赖方向是什么
- 哪些层不能反向依赖

### A3：调用链提示

必须回答：
- 关键入口如何进入核心逻辑
- 哪些点属于高扩散风险
- 哪些变更容易影响多模块

## 5. 输出约束

- 不得直接把分析结果当作 Markdown 真源写出
- 所有结论先进入 `structure-overview.json`
- `architecture.md` 与 `call-graph.md` 只能展开已确认事实，不得新增事实
- Markdown 默认使用中文，路径、命令、代码标识符保留英文

## 6. 降级策略

- 缺少符号分析时，允许退化为目录/入口/依赖线索分析
- 无法确认的边界必须标注 `[待确认]`
- 不得因为证据不足而伪造架构图或调用链

## 7. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
