# S5 真实消费者与 E33 接续验证

类型：advisory。工具事实、完整输入、实际退出码、session、保护文件哈希、必要产物原文及原始记录 SHA-256 见 [结构化证据](s5-consumer-journey.json)。本批 owner 为当前 Codex，语义判定是内联回源复核，无本批独立 reviewer。

## 结果与证据

三次模型 CLI 调用全部正常结束、无超时。本批复用上一轮通过 source init 生成 runtime 的两个隔离临时仓库，不修改主开发仓 runtime。F13/help 为新会话；E33 恢复上一轮超时 session。没有跨批覆盖日志、合并成功率或删除失败尝试。

| 场景 | 实际观察 | 判定边界 |
| --- | --- | --- |
| F13 历史计划补完 | Codex 从 completed 旧计划回源，创建带 origin 的 active 后继，仅覆盖剩余 U2；生成双视角串行计划审阅，回读新计划及 source hash，重新 intake；原检查 F13_FAIL/exit 1，修改 f13.txt 后 F13_PASS/exit 0，收尾 verified 后仅将后继改为 completed | 266.525 秒，一次合成场景的后继生产与实施通过；旧计划、已完成 result.txt、两个 verifier、保护文件五项哈希不变。审阅为同模型内串行，不是独立审阅；不覆盖任务包、后继复用或来源冲突全部分支 |
| S5.4 CLI help 消费 | Claude 新会话实际读取两个 --help，执行检查和哈希校验，记录 summary，honest-closeout 返回 verified | 155.976 秒，单次会话内完成；首次 reason_code 冲突后自纠正，不能称首次写入无错误；日志由模型转录，父执行 owner 已复跑脚本并核验哈希 |
| E33 模型驱动原生 goal | 恢复此前 Codex 测试 session，模型真实 create_goal、get_goal(active)、执行检查与保护哈希、update_goal(complete)、get_goal(complete) | 49.127 秒，无超时；原生 goal 计量为 16,383 tokens/23 秒，非整轮 tokens/墙钟。模型驱动生命周期样本通过，保留前轮 120 秒超时；不等于 Astra 三组受保护行为完成 |

E33 的 `exec --json` 仅公开 shell 事件和模型结语，没有公开原生 goal 回执。本批额外定向读取该 session 的本机 rollout，按 call_id 保存 7 组实际工具调用与输出（其中 4 组 goal 调用），核实回执 threadId 相同、active→complete，执行检查位于完成操作之前。没有以模型结语代替工具证据，也没有用前轮无模型 turn 的 app-server smoke 替代本轮结果。

## 本次修复及摩擦

Claude 将 not-run 示例改成 passed 时保留了 `reason_code: schedulable`，writer 正确拒绝；随后按实际执行改为 `executed`，成功写入。根因是帮助没有解释原因字段与执行状态的特殊约束。当前 helper 和合同补清：reason_code 是具体字符串而非固定枚举，schedulable/missing_dependency 仅用于 not-run，实际执行须同步更新原因。保持原校验器和 not-run 示例，不放宽验证门。

追加说明后两个 CLI 套件共 31 tests 通过；本批模型运行发生于说明追加之前，不将其升级为追加说明后的效果复测。既有状态冲突反例仍通过，实际 CLI 帮助已回读确认。

另保留两项有界观察：Claude 的两条复合 shell 命令被宿主白名单拒绝，模型使用已获准单条命令继续；F13 调用未要求生成的 spec-work-run-artifact 帮助两次返回 exit 2，最终记录 no-trigger-matched。后者没有阻断本次无任务包、无延期项的单文件交付，暂不扩展该 producer；真实必需消费者因此失败时由其 owner 再处理。

## 完成范围与剩余

F13 本场景与 E33 原生生命周期已从“未观察到实际执行”推进到可回源的真实模型样本；S5.4 证据收尾已在一个新会话完成。没有同条件对照，不能从本批时长推断帮助修复带来提效。

- S2/S3：Codex 请求及宿主报告 gpt-6-astra，custom provider 的响应模型身份仍未独立核实；Claude message 为 glm-5.3。目标模型身份和完整 pair-specific 准入、A/A、三组受保护行为仍缺，不能拼接本批合成样本。
- S4：现有两宿主旅程及一类任务内部对照保留；复杂任务、完整多 workflow 旅程和外部收益未验证。
- S5：F13 其余边界仍以此前合同和 fresh-source 审查为证；S5.1/3/5 继续按原触发条件暂缓，不新增无直接瓶颈证据的改造。
- S6：OPT-10 的同环境消融及 OPT-11 另一真实任务中的知识消费仍未完成；没有符合条件的现成比较或消费者，不制造假数据关闭。OPT-12 本批状态同步已处理。
- X1：个人安装层属于独立仓外范围，本批未写入。

本报告不表示整体方案全量开发与验收完成。源码、宿主或模型身份变化时重新评估上述样本的适用性，旧结果保留为历史观察。
