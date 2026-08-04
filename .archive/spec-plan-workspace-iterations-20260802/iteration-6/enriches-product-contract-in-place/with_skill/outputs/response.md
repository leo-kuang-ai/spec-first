已将计划原地深化为 implementation-ready 产物：

[docs/plans/2026-07-31-001-feat-order-import-plan.md](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-2652027086/docs/plans/2026-07-31-001-feat-order-import-plan.md)

完成情况：

- 补齐 Planning Contract、接口契约、高层设计、风险边界、Implementation Units、Verification Contract 和 Definition of Done。
- Product Contract 区域逐字节保持不变，写入前后 SHA-256 均为 `507b30618998e8b2bdea483c7bde2c4b94f5104deef794a55cfc89783f8a82ce`。
- 完成 Standard/高风险置信度深化，明确重试预算、幂等许可、错误透传、最终失败与人工恢复。
- 文档审查采用降级 producer self-review：`review_status: degraded`，`reason_code: spec_doc_review_capability_unavailable`，`independent_review: not_run`；应用 2 项确定性修正，独立审阅专属发现计数未知。
- 未运行测试，未修改实现代码；确定性结构、路径和 diff 检查通过。

控制权现已交还 pipeline caller。
