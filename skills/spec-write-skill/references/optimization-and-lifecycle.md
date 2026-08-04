# Optimization And Feedback Handoff

**trigger_condition：** primary intent 是 measurable optimization，或收到 field feedback/transcript/issue。**must_read：** 必须读完后才可判断 `spec-optimize` handoff 或 feedback-to-regression。**fallback_if_unread：** 按普通 revise 处理；不得声称优化 handoff 已完成或反馈可进入 regression。**eval_case：** `primary-metric-optimization-handoff` 和 `feedback-unreproduced-observation` 触发；普通 source revise 不触发。

没有 authoring patch、且主要目标是 measured optimization 时，保持既有 near-neighbor：`base_operation=null`、`effect=not-entered`，handoff `spec-optimize`。普通明确 revise 仍由本 workflow 单一 owner 完成，禁止 authoring → optimize → authoring 循环。

handoff 至少携带 source snapshot、mutable/immutable scope、trigger evidence、baseline、protected behavior、treatment、controlled variables、metric、budget、stop condition、rollback、invalidation 和 owner-contract limitations。当前 `spec-optimize` 无法持久表达 treatment arms、paired comparison 或 rollback/invalidation 时，closeout 只能写 `execution_mode=manual_observation` 与 `not promotable`；这是非持久 prose label，绝不写入 `spec-optimize` YAML `execution.mode`，也不建设旁路 experiment database/runner。

feedback 必须先按 route、behavior、tool、target 或 project failure 分类。只有最小脱敏复现、用户确认 expected behavior、并授权 eval-source mutation 后才成为 regression；无法复现的反馈保持 observation。post-write eval 或 payload smoke 失败时保留可审查 diff，阻断完成声明，给出修正或 rollback preview，不自动晋级 durable knowledge。
