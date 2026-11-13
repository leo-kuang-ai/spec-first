# S17 暂存前边界与内部调用策略

2026-11-02；基线e4695f6d0。默认分支检查提前至入口，仍由Step 4执行授权后的分支操作；不新增脚本语义决策。四内部helper的source增加agents/openai.yaml，policy.allow_implicit_invocation=false由既有递归生成携带，不手改runtime、不新增框架。其他宿主是否消费该字段未证实；Cursor既有disable-model-invocation保留。

plugin完整20项测试通过（终端记录）；落盘证据为6项commit测试及聚焦多宿主projection测试。真实临时Git测试验证提交argv、-F字面消息及无关暂存内容保留，不证明模型会在main暂存前停止。独立fresh-source复核通过；真实Codex隐式选择与三次main行为复测未运行，F-S17-01/X-02行为效果仍待验证。

扩展检查发现S20入口6433字节超过5800的既有测试门槛，HEAD source同为6433，不是本项修改造成；expanded-failure.txt保留失败。该前序回归由当前owner接续单独修复，不能宣称全套检查通过。structured closeout只覆盖本项列出的窄检查。
