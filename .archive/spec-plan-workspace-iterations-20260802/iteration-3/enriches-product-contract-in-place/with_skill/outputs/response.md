已将计划原地深化为 implementation-ready：

[docs/plans/2026-07-31-001-feat-order-import-plan.md](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-2656197784/docs/plans/2026-07-31-001-feat-order-import-plan.md)

完成情况：

- 补齐 Planning Contract、技术设计、接口契约、风险与回滚、U1/U2 Implementation Units、Verification Contract 和 Definition of Done。
- Product Contract 标记区与 baseline 字节一致，SHA-256 保持不变。
- 置信度检查通过，重放安全、重试预算、失败终止、CLI 兼容和验证闭环均已覆盖。
- 文档审查以降级模式完成：后续 model invocation 已禁用，因此独立 `spec-doc-review` 未运行（`review_status: degraded`，`reason_code: spec_doc_review_capability_unavailable`，独立审查计数未知）；生产者自审应用了 1 个确定性修复，补齐 Product Contract Summary。
- 静态路径、元数据、章节、U-ID 唯一性和 diff 检查通过。
- Git 受控差异仅包含目标计划文件；未修改实现代码，未运行测试，也未调用子代理或访问外部资料。

控制权现已交还 pipeline caller。
