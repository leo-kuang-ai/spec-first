路由判定完成，结论如下：

## 判定：不运行 spec-ideate，此请求路由到 `spec-brainstorm`

**依据**：`spec-ideate` 的 Phase 0 有一道在任何工作开始之前运行的 refine-vs-generate 门（`references/scope-gates.md:5`）：

> 用户已持有一个想法、要求细化/收敛/定范围/变成需求 → 这是 `spec-brainstorm` 的工作，不是 ideation：停止并指向 `spec-brainstorm`；不得在本工作流内运行 brainstorm 式提问或需求收敛。

你的请求正是这种情况——方向已定（站会汇总工具）、用户与成功标准已想清楚、目标是变成可执行计划。这属于**收敛**，不属于**候选方向生成与评估**（spec-ideate 只回答"有哪些值得探索的想法"）。

## 正确的流转链

| 工作流 | 回答的问题 | 对你的适用性 |
|---|---|---|
| spec-ideate | 哪些方向值得探索？ | ❌ 方向已选，跳过 |
| **spec-brainstorm** | 选定的想法到底意味着什么？ | ✅ **下一跳**：把想法精确化为 requirements-only 的统一计划（写入 `docs/plans/`） |
| spec-plan | 应该怎么建？ | ✅ brainstorm 之后再进入 |

## 本沙箱的实际情况

已确认 `.claude/skills/` 下只安装了 `spec-ideate`，`spec-brainstorm` 和 `spec-plan` 不在可用 skill 列表中，我在此处无法调用它们。按 skill 契约，我也不会用 ideation 凑数（它明确不产出需求或计划），也不会越权在 ideation 里替你做需求收敛。

**下一步**：在安装了 `spec-brainstorm` 的环境中用它继续（之后接 `spec-plan`）。本次路由判定到此结束，未派发任何 grounding 或生成工作。
