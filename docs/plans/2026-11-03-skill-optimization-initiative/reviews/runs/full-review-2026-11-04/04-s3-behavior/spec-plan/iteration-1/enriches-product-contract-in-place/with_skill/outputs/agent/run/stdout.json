管道模式收尾完成。按授权边界，未做任何任务提交，实现源码与测试零改动。

## 规划产物已返回

**计划路径**:`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-3704931644/docs/plans/2026-07-31-001-feat-order-import-plan.md`

**产物状态**:`spec-unified-plan/v1`,`artifact_readiness: requirements-only → implementation-ready`(就地丰富),`execution: code`,`status: active`。

**产品权威保留**:Product Contract 区域(918 字节)经 SHA-256 对比机械验证**字节级不变**;所有规划新增内容(Planning Contract、Implementation Units、Verification Contract、Definition of Done)均在该区域之外，WHAT/HOW 边界以 `Product Contract unchanged (byte-preserved upstream source slice)` 显式标注。

**计划要点**:
- 6 条 KTD:重试预算语义(初始 1 次 + ≤3 次重试 = ≤4 总调用)、默认拒绝的错误分类(仅 8 个已知 Node 瞬时网络错误码可重试,天然满足 R2)、失败可见性保持(终态原样重抛)、指数退避 + 可注入 sleep、不新增本地校验、架构姿态 extend
- Interface Contracts(evolution/additive)+ 重试判定流程图
- 4 条显式假设(As-1..As-4,headless 运行的推断均如实标注)+ 1 条非阻塞 Open Question(OQ-1:R1 耗尽语义待产品确认)
- 2 个实现单元,14 个具名测试场景(AE1/AE2/F1 均有 Covers 对应),3 项风险(含模糊超时重复写入这一已知限制)
- Verification Contract:`npm test`,含命令盲区声明

**审查状态(如实报告)**:置信检查通过(无薄弱章节，两项强制深化覆盖条件均未触发)。文档审查为**降级出口**——调用方禁止委派(`reason_code: dispatch_authorization_missing`),仅完成 producer 自审一轮(`review_source: producer-self-review`,`review_status: degraded`,`independent_review: not_run`,`fixes_applied: 0`),自审无发现项；独立审查覆盖范围未知，保留为限制。

**未证实事项**:真实 client 错误形态(As-4)、CLI 层输出兼容(fixture 无 CLI 入口,As-2)、模糊超时重复写入风险(RK-1)——均已在计划内标注，单测无法证明。
