规划完成，按 pipeline 模式交还控制权。

## 交付摘要

**计划路径**:`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-2970426410/docs/plans/2026-11-07-001-feat-order-importer-retry-plan.md`(仓库相对:`docs/plans/2026-11-07-001-feat-order-importer-retry-plan.md`)

**计划内容**:`importOrders` 就地扩展有界重试(姿态 `extend`,不新建模块)——总计最多 3 次尝试(含首次)；仅瞬时网络错误(errno 白名单 + `transient === true` 标记，default-deny)重试；校验类及其他错误立即原样传播；预算耗尽传播最后一次原始错误；不加 console 输出、返回契约不变、现有测试不改即过。1 个实施单元(含 11 条测试场景，映射 AE1–AE5),验证命令为仓库原生 `node --test tests/*.test.js`。5 条推断(如“3 次总尝试”口径、“保留 CLI 输出”在无 CLI fixture 中的解释)全部落在 `### Assumptions` 并标注失效条件。

**审查状态(降级 envelope)**:
- `review_source: producer-self-review`,`review_status: degraded`,`independent_review: not_run`
- `reason_code: dispatch_authorization_missing`(调用方禁止委派，未探测能力；仅完成 producer 自审，独立审查未运行)
- `mutation_policy: markdown-write`(producer-owned apply-fixes),**已应用 2 处修正**:① KTD3 errno 集合移除 `ENOTFOUND`(永久性 DNS 失败，与其自身 default-deny 原则冲突)；② 补充 KTD6 sync-throw 归一化的测试场景
- 剩余:0 个待定修正、0 个决策、1 条 FYI(errno 集合对真实网络栈的覆盖完备性未经真实 socket 验证，已记录于 Verification Contract blind-spot 行);P0/P1 = 0
- 置信度检查通过，无需加深；确定性检查全部通过(元数据、稳定标题、纯 ID 前缀、仓库相对路径、无 HTML 混排)

**限制**：独立文档审查未运行(无派派授权)；外部研究按调用方显式约束跳过；计划证据限于 fixture 内直读源码(基线 `c7ee85d`)。

**边界确认**：仅新增 `docs/plans/` 文档；未改 `src/`、`tests/`,未运行应用测试，未创建任何任务提交(git 仅有准备脚本产生的基线提交 `c7ee85d`,工作树仅新增未跟踪的 `docs/`)。实施所有权在调用方，实施未开始。
