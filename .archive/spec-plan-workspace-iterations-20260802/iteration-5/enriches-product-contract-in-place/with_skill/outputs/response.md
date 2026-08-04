已将计划原地深化为 `implementation-ready`：

[docs/plans/2026-07-31-001-feat-order-import-plan.md](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-843018374/docs/plans/2026-07-31-001-feat-order-import-plan.md)

- 补齐 Planning Contract、接口契约、显式假设、技术设计、Implementation Units、Verification Contract 和 Definition of Done。
- 置信度检查加强了重试幂等性、最终失败恢复、发布门禁和回滚边界。
- 文档审查状态：`degraded`；原因是后续 model invocation 已禁用，`independent_review: not_run`。有界生产者自审应用了 2 项修正；独立 reviewer 专属计数保持未知。
- 元数据、章节、相对路径、Product Contract 保留和 diff 格式检查通过。
- 仅修改了指定计划文件；未运行测试、未修改实现代码、未调用子代理或访问外部资料。

控制权已交还 pipeline caller。
