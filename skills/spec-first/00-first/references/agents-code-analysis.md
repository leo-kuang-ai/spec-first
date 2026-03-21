# 代码分析执行提示

> 这是按需补证据提示，不是主题规范正文。由 Skill 按执行流决定是否派发。

## 任务范围

- 只做代码库概览、架构关系、调用链补强
- 只服务当前 wave 的 runtime 真源 JSON 产出
- 不把 `docs/first/*.md` 当作真源，也不把长篇分析回灌主线程

## 输入证据

- 本轮 evidence pack（目录结构、入口文件、关键配置、依赖声明）
- Serena 可用时优先使用符号工具，`shared/summary.json` 与 `shared/context.json` 作为当前 wave 的共享起点
- import/export 与关键调用链线索（可用时优先符号引用与调用图）
- 已产出的 runtime 摘要（如 `.spec-first/runtime/first/summary.json`）作为上下文，不作为证据替代

## 输出约束

- 当前任务只负责补足当前 wave 所需证据，帮助生成 `structure-overview.json` 与 `critical-flows.json`
- 具体输出资产定义见 `references/structure-analysis.md`
- 不得把长篇分析回灌主线程

## 缺口标记

- 无法确认的边界/调用关系必须标注 `[待确认]`
- 不得把猜测写成确定事实
- 证据抽样与违规判定：`references/quality-assurance-rules.md`
