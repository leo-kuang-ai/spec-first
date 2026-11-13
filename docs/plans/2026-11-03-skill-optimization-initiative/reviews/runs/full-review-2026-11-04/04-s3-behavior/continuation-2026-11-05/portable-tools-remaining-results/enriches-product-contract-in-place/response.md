全部复验通过：稳定标题各出现一次（Product Contract 标题仅来自保留区）、加粗 ID 仅剩保留区内的上游字节、字节保留 OK，且仅计划文件被修改（`src/`、`tests/` 未触碰，规划边界完好）。

---

## 交付（pipeline 模式，返回 caller）

**计划产物**：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-2364091386/docs/plans/2026-07-31-001-feat-order-import-plan.md`（仓库相对路径：`docs/plans/2026-07-31-001-feat-order-import-plan.md`，就地富化，未新建文件）

**元数据**：`artifact_readiness: implementation-ready`（自 `requirements-only` 提升）、`artifact_contract: spec-unified-plan/v1`、`execution: code`、`status: active`（保留）、新增必需字段 `title`/`type: feat`/`date: 2026-07-31`。

**产品权威保留**：Product Contract 区域（R1–R3、A1、F1、AE1–AE2、Scope Boundaries）经 `cmp` 两次验证与基线**逐字节一致**（918 字节）；Planning Contract 首行已标注 `Product Contract unchanged (byte-preserved upstream source slice)`。

**规划增量**（全部落在保留区之外）：Goal Capsule 补全为实施向首屏；5 条 KTD（白名单分类+默认不重试、上限=初次+3 次重试共 4 次调用、无重试间隔、输出兼容落在函数契约——当前树无 CLI 入口文件、extend 架构姿态）；4 条带来源/影响/失效条件的 Assumptions（headless 推断，未标为用户确认）；Implementation Scope Boundaries 与 Evidence & Limitations；单实施单元 U1（`src/order-importer.js` + `tests/order-importer.test.js`，6 个测试场景，直接覆盖 AE1/AE2）；Verification Contract（`npm test`，含盲区行）与 Definition of Done。无产品阻塞：R1 字面可实施，未发明任何产品行为。

**评审状态（降级，如实报告）**：仅完成 producer 自审，独立审查未运行。caller 禁止委派，故未探测评审能力（`reason_code: dispatch_authorization_missing`，envelope：`review_source: producer-self-review` / `review_status: degraded` / `independent_review: not_run` / `mutation_policy: markdown-write`）。自审应用 **2 处修正**（标记外重复的 `## Product Contract` 标题、DoD 中的加粗 U-ID），剩余 **1 条 FYI**（`Covers R1.` 前缀是对 AE/F 链接约定的刻意泛化，用于钉住耗尽边界，保留），producer 视角 **0 个 P0/P1**；独立评审才可发现的计数未知，不以 0 冒充。置信检查通过，未触发深化（无 `deepened` 字段）。

**限制**：外部研究与 worker 委派均未授权（`dispatch_authorization_missing`，inline 串行直读）；`docs/solutions/` 不存在；仓库内无真实网络客户端，错误分类法仅能经注入形态测试验证（已在计划盲区行声明）。

**边界遵守**：未修改实现、未运行应用测试、未委派、未读取 fixture 之外内容、未创建任务 commit（仅基线提交 `a38f342` 由准备脚本生成）。控制权交还 caller，由 caller 决定下一步（如 `spec-work` 执行）。
