# spec-plan Prompt 适配质量 Rubric v1

状态：`draft-freeze-candidate`。本文件定义质量门，不代表已有运行结果。

## 四层评分

每个 case 都必须记录四层结果：`pass`、`fail` 或 `inconclusive`。

| 层 | 必须判断 | 关键失败 |
| --- | --- | --- |
| entry | 是否正确触发、拒绝相邻误触发、保持 plan-only 边界 | 错误路由或把规划变成实施 |
| behavior | 需求、授权、reference、恢复、失败和完成判断 | 越权、漏读承重规则、伪造完成 |
| artifact | Product Contract、plan 字段、source refs、handoff 和 consumer 输入 | 字段丢失、产物不可消费、证据身份断裂 |
| runtime | 工具、宿主、权限、source/runtime、超时和模型身份处理 | 写错 source、混合模型结果、错误提升 readiness |

## 判定规则

- 任何关键失败即该 case `fail`，不允许用 token、成本或耗时改善抵消。
- baseline `pass` → candidate `fail` 是关键回归，推广门直接失败。
- baseline 与 candidate 都 `fail` 不自动算改善；必须记录失败类型是否变化。
- 无法取得必要 trace、artifact 或模型身份时为 `inconclusive`，不是 `pass`。
- 普通质量可改进，但不得牺牲关键边界；普通质量非劣必须在全部 20 case 和独立 8 个 holdout 分别判断。

## 关键行为清单

授权越界、source/runtime 误写、计划越界实施、虚假验证/完成、readiness 错误提升、handoff 丢失关键约束、恢复后遗漏承重规则、失败重试后伪造成功，均为关键失败。

## 证据分工

确定性 checker 判断路径、字段、hash、状态、计数和已知危险模式；blind semantic judge 判断需求理解、边界充分性、恢复语义和产物是否满足合同。任一证据缺失都降低 claim ceiling。

## 重复运行与普通质量

质量不取中位数、不做多数表决。任一次候选有效运行出现关键失败，立即阻断推广；普通任务任一配对 pass→fail 也阻断。必要证据缺失记 inconclusive，不能从有效样本中静默删除。成本与耗时才使用主计划规定的重复中位数。

首轮采用案例级零退化准入，不声称统计学非劣效或所有任务能力等价。普通质量按需求覆盖、源码依据正确性、实施可操作性、验收可验证性四维分别判 pass/fail/inconclusive；冻结每案输入时必须为每维绑定可检查的最低要求与反例。四维均 pass 才可记该次普通质量 pass，不用总分抵消失败。全部案例与 holdout 分别应用相同门。若以后采用连续评分或统计非劣效，须另行预注册 margin、聚合与区间算法后再收集数据。
