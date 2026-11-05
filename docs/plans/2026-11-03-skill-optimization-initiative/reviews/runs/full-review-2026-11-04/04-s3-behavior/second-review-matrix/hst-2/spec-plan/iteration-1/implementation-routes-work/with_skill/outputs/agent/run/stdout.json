已完成：`GET /entries` 支持按 `?month=YYYY-MM` 筛选，按 UTC 月份匹配；省略参数时保留原有完整列表，无效月份返回 JSON 格式的 HTTP 400。

- 计划：[2026-11-05-001-feat-entry-month-filter-plan.md](/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-1412274340/docs/plans/2026-11-05-001-feat-entry-month-filter-plan.md)
- 实现：`src/server.js`；新增 `test/server.test.js`
- 验证：`node --test test/server.test.js`，3 项通过；启动服务后通过 HTTP 检查了新增记录、月份筛选、无效月份和未筛选请求。测试服务已停止。
- 按要求未创建任务提交或执行落地操作。准备脚本已运行一次，并捕获基线。
- 限制：环境未提供 `spec-work` 或 `spec-doc-review` 技能，因此实现由我直接完成；计划仅做了生产者自审，未进行独立文档审查。`git diff --check` 无格式问题；结束时的 `lsof` 未发现仍在监听 3000 端口的服务。
