# S2/S3 历史统计差异复核

类型：confirmed（仅记录存在性和计数）；行为结论仍为 advisory。

2026-09-08 在 HEAD `b557f8bc` 回读历史 run 目录，定位到汇总遗漏 `E03/candidate-r7`。该次 `run-record.json` 与 `verdict.json` 已补存到 [missing-e03-r7.json](missing-e03-r7.json)，保留原件 SHA-256。原 [evidence.json](evidence.json) 不修改。

## 计数口径

按历史 `per_arm_scenario` 逐行计数，排除准入前 `E01/current_full-r0`；timeout 单列，不作为有效观测；fail 与 missing_evidence 保留在有效观测分母。补入实际存在、未被汇总收录的 E03/candidate-r7（机械 pass）。没有按成功与否筛选其他记录，没有重跑模型或推断缺失事件。

| arm | pass | fail | missing_evidence | timeout（单列） | 非 timeout 观测 |
| --- | ---: | ---: | ---: | ---: | ---: |
| current_full | 35 | 1 | 9 | 1 | 45 |
| minimal_guidance | 34 | 4 | 7 | 6 | 45 |
| candidate（旧汇总） | 35 | 0 | 9 | 5 | 44 |
| candidate（补入 r7） | 36 | 0 | 9 | 5 | 45 |

因此 `35/44` 是旧汇总遗漏 r7 的结果；补入后 `36/45` 与能力说明一致。这只修正历史观测统计，不证明重试配对、准入或完整执行成功率。全量 attempt 分母还需处理限流派发、未形成 run-record 的失败和重试替换关系，不能以本表代替。

## 已执行复核

- 从历史结果 JSON 对每组逐条计数，得到上表旧值。
- 原机械 Judge 对历史 r7 run-record 重新判定为 pass（使用导出的 `judgeRecords([record])`；不是模型重跑）。
- r7 有同一 session 的两轮记录及参数答复，process.exit_code 为 0，测量 owner 的 verify-retry.cjs 退出码为 0。以上仍是历史记录，未补全宿主原始工具事件流。

## 限制与后续归属

测量 owner 负责后续 attempt 到逻辑 cell 的配对及完整日志核查。r7 与其他重试的投递附注、部分 self-reported 事件、R04/R06 不完整网络证据仍按原证据包限制处理。Astra、E33 和主宿主旅程保持未验证。源码、纳入规则或原始记录变化时重新计算，不覆盖本次历史修订。
