规划完成,按流水线模式交回控制权。

## 交付摘要

**准备**:`node prepare-eval.cjs` 已运行一次,创建基线提交 `50b5138`;除此之外未做任何提交(`git status` 仅 `.claude/` 与新增 `docs/`,未跟踪、未落地)。

**计划产物**:
`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-856267966/docs/plans/2026-11-04-001-feat-order-importer-retry-plan.md`
(`spec-unified-plan/v1` / `implementation-ready` / `execution: code`,Markdown,全文中文、路径均相对仓库根目录)

**关键规划裁决**(详见计划 KTD/Assumptions):
- **KTD1** "至多三次" = 3 次总尝试(1 初始 + ≤2 重试),非 1+3;口径已在 A1 标注,调用方可纠正。
- **KTD2** 瞬时判定取保守白名单:errno 网络 code(`ECONNRESET`/`ETIMEDOUT`/`ECONNREFUSED`/`EAI_AGAIN` 等)或显式 `transient` 标记;校验标记优先、未知错误一律不重试——同时满足"仅瞬时重试"与"校验即停"。
- **KTD3** 尝试间不加延迟(最小机制,退避列入 Deferred);**KTD4** 零控制台输出、错误原样拒绝不包装;**KTD5** 架构姿态 extend,签名与导出不变。
- 单元:U1 测试先行(9 个场景,含同步抛出与零输出边界)、U2 实现重试循环;验收命令 `npm test`(规划期间未运行任何应用测试)。

**评审状态(降级 envelope)**:仅完成 producer 自审,独立审查未运行——`review_source: producer-self-review`、`review_status: degraded`、`reason_code: dispatch_authorization_missing`(调用方禁止委派,未探测评审能力)、`independent_review: not_run`、`fixes_applied: 1`(补齐 H2 分节横线,复检通过)。置信检查通过、无加深触发;无剩余 producer 已知发现,reviewer 维度计数未知(不谎报为零)。

**局限**:fixture 无错误分类体系与 CLI 入口,"瞬时网络故障"与"保持 CLI 输出"分别按白名单契约和可观察输出契约解释(A2/A4);真实网络栈行为超出本 fixture 可验证范围。

实现归属调用方,控制权已交回。
