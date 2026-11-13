# spec-plan Prompt 适配可观测性 Probe v1

状态：`not-run`。本 Probe 先确认宿主是否能提供足够证据，不修改 Skill。

## 必须确认的事实

| 事实 | 通过条件 | 不可用时的结论 |
| --- | --- | --- |
| source identity | 每次读取绑定 path、hash、时间和截断状态 | 不得判断重复读取 |
| read payload | 能记录实际返回文本或明确 unavailable | 不得把 bytes/4 当真实 token |
| context residency | 能证明内容仍在当前上下文，或明确 unknown | unknown 走保守重读 |
| model/host identity | model ID、host version、effort 可绑定到 run | 不合并样本 |
| usage/cost | request token、cache、费用或明确 proxy | 报 unavailable，不填零 |
| artifact/consumer | 输出路径、hash、关键字段和 replay 结果可回源 | 不宣称能力等价 |

## Probe 负例

- 读取成功但内容截断；
- hash 未变但上下文发生压缩；
- read history 存在但当前 residency unknown；
- 429、timeout、代理换模型；
- A/B 运行顺序未记录；
- 输出存在但 handoff 或 consumer replay 失败。

## 准入结果

`ready` 仅表示测量事实可采集；`partial` 表示只能做质量评测，不能做完整成本结论；`blocked` 表示不可安全进入 C1。Probe 本身不证明 Prompt 有收益。
