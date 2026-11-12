全部确定性检查通过（frontmatter 完整、注册表 H2/H3 齐全、无绝对路径/HTML/粗体 ID/流程残留）。按 pipeline 例外收尾：5.3.9 最终检查通过（仅新增 `docs/plans/` 文档，规划边界完好，未触碰 `src/`、未运行应用测试、未提交），5.4 跳过交互菜单，返回 caller。

---

## 规划完成，控制权交还 caller

**计划路径**：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-1887938778/docs/plans/2026-11-07-001-feat-order-importer-retries-plan.md`（`artifact_readiness: implementation-ready`，`execution: code`，`status: active`）

**计划要点**
- 架构姿态 `extend`：在 `src/order-importer.js` 的 `importOrders` 内原地加有界重试循环，不新建包装层、不改导出签名、无新依赖（KTD1）
- 至多 3 次 `send` 总尝试（初次 + 至多 2 次重试，KTD2）；仅 `error.code` 属于瞬时网络码允许集才重试，默认拒绝——校验类及其余一切失败立即原样传播（KTD3/KTD5）；重试间不插延迟（KTD4，退避列为 follow-up）
- 2 个实施单元：U1 重试循环 + 7 条测试场景；U2 输出保持加固（R5：零新增 stdout/stderr、返回值语义不变）
- 6 条推断假设（headless 未确认下注）记录于 `### Assumptions`，含"三次尝试=3 次总数"的语义解释与失效条件；最大未证实风险为瞬时码集合无法对照真实 client（fixture 无网络层）

**置信检查**：通过——Standard 深度、低风险画像，全部决策可溯源至 fixture 源码与 caller 约束，无需加深。

**文档审查状态（降级，如实报告）**：caller 禁止 delegate/下游调用，故未探测审查能力，独立 `spec-doc-review` 未运行。仅完成 producer 自审：
- `review_source: producer-self-review`，`review_status: degraded`，`reason_code: dispatch_authorization_missing`，`independent_review: not_run`
- `mutation_policy: markdown-write`（producer 所有）；`fixes_applied: 0`（确定性结构检查全部通过）
- 已知 findings：0 P0/P1，2 条 FYI（瞬时码集合可随生产证据微调、异步化影响已由 A5 承接）；限制：独立审查覆盖面未知

**边界**：仅规划——未改实现代码、未运行应用测试、未做任何 task commit（工作区仅新增上述计划文件，未提交）。实施与提交所有权在 caller。
