已将计划原地深化为 `implementation-ready`：

[docs/plans/2026-07-31-001-feat-order-import-plan.md](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-4260126626/docs/plans/2026-07-31-001-feat-order-import-plan.md)

完成情况：

- Product Contract 保持逐字节不变，SHA-256 仍为 `507b30618998e8b2bdea483c7bde2c4b94f5104deef794a55cfc89783f8a82ce`。
- 置信度深化补强了接口契约、幂等边界、重试预算、系统影响、运维门禁、回滚策略、实施单元及具体测试场景。
- 文档审查状态：`degraded`，原因为 `spec_doc_review_capability_unavailable`；独立模型审查未运行，reviewer-only 发现数量及 P0/P1 覆盖未知。
- 降级自审应用了 2 类确定性修正，并通过元数据、章节、路径、U-ID、Markdown 和 Product Contract 完整性检查。
- tracked diff 仅包含该计划文件；未修改实现代码、未运行测试、未访问外部资料、未调用子代理。

现将控制权交还 pipeline caller。
