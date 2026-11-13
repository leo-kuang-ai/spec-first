看过了现有的 `STRATEGY.md`（LedgerFlow 的定位文档，2026-08-01 更新）。这件事我得按 spec-strategy 的边界拦一下，不能直接写进去。

**STRATEGY.md 是锚点文档，不是计划。** 它只回答“产品是什么、为谁、怎么赢”（现在的五个小节）；feature 清单和带日期的排期一旦写入，它就会从策略漂移成项目计划，这正是这个 skill 明确要防的。它对此有明确分工：

- **8 个 feature 本身** → 归 `spec-brainstorm`（功能方案工作流，它会以 STRATEGY.md 为上游输入）
- **带时间的排期（一行一个带日期）** → 归 issue tracker（GitHub Issues、飞书任务等），这是排期的唯一归属地

另外，我手上也没有这 8 个 feature 的清单——仓库和对话里都没有出现，我不能替你编造。

可以这么继续，选一个：

1. 把 8 个 feature 清单发我，我帮你在 issue tracker 里逐条建好、标上 2027 Q1 的时间
2. 把清单交给 `spec-brainstorm` 先过功能方案，排期随后落到 tracker
3. 如果你确实想在 STRATEGY.md 留痕，我可以加一条**粗粒度**的 Milestones 小节（比如“2027 Q1：自动导入 + 智能分类主打能力上线”这个级别）——但不会是 8 行带日期的排期表
