# 代码结构分析

> 本文档合并了执行提示与主题规范,提供完整的代码结构分析视图。

## 1. 主题划分

为便于理解,保留历史标签:
- **A1**: 代码库概览
- **A2**: 架构关系
- **A3**: 调用链提示

这些标签仅表示分析主题,不代表运行时必须派发的真实 Agent。

## 2. 正式输出

### runtime truth
- `structure-overview.json`

### docs outputs
- `docs/first/codebase-overview.md`
- `docs/first/architecture.md`
- `docs/first/call-graph.md`

## 3. 任务范围

- 只做代码库概览、架构关系、调用链补强
- 只服务当前 wave 的 runtime 真源 JSON 产出
- 不把 `docs/first/*.md` 当作真源,也不把长篇分析回灌主线程

## 4. 输入证据

- 本轮 evidence pack(目录结构、入口文件、关键配置、依赖声明)
- Serena 可用时优先使用符号工具,`shared/summary.json` 与 `shared/context.json` 作为当前 wave 的共享起点
- import/export 与关键调用链线索(可用时优先符号引用与调用图)
- 已产出的 runtime 摘要(如 `.spec-first/runtime/first/summary.json`)作为上下文,不作为证据替代

## 5. 证据来源

- 目录结构与模块边界
- 入口文件与命令入口
- import / export 关系
- 配置文件与构建入口
- 关键流程文件与测试钩子

## 6. 分析要求

### A1: 代码库概览

必须回答:
- 项目主要模块有哪些
- 入口点在哪里
- 从哪里开始阅读

### A2: 架构关系

必须回答:
- 模块边界如何划分
- 关键依赖方向是什么
- 哪些层不能反向依赖

### A3: 调用链提示

必须回答:
- 关键入口如何进入核心逻辑
- 哪些点属于高扩散风险
- 哪些变更容易影响多模块

## 7. 输出约束

- 当前任务只负责补足当前 wave 所需证据,帮助生成 `structure-overview.json` 与 `critical-flows.json`
- 不得直接把分析结果当作 Markdown 真源写出
- 所有结论先进入 `structure-overview.json`
- `architecture.md` 与 `call-graph.md` 只能展开已确认事实,不得新增事实
- Markdown 默认中文输出,路径、命令、代码标识符保留英文
- 不得把长篇分析回灌主线程

## 8. 缺口标记

- 无法确认的边界/调用关系必须标注 `[待确认]`
- 不得把猜测写成确定事实

## 9. 降级策略

- 缺少符号分析时,允许退化为目录/入口/依赖线索分析
- 无法确认的边界必须标注 `[待确认]`
- 不得因为证据不足而伪造架构图或调用链

## 10. 质量门禁引用

- 通用证据格式、抽样验证与违规判定统一遵循 `references/quality-assurance-rules.md`
