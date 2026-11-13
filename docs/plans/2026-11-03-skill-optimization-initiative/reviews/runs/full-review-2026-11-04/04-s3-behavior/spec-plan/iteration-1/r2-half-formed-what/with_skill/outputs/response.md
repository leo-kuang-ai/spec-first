全部就绪：Interface Contracts 表（6 行同构）合规保留，H2 注册表完整，`plan-handoff.md` 已在交付步骤重读。最终检查通过（计划边界未破——未写任何实现代码、未跑测试）。

---

## 交付

**计划已写入** `/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-862771205/docs/plans/2026-11-04-001-feat-incentive-system-plan.md`（`artifact_readiness: implementation-ready`，`execution: code`）

**计划核心**——细节由我在你的授权下代填，全部标注为可推翻的显式假设（`### Assumptions`）：

- **MVP 形态**：每笔记账得基础分 10；每日首笔推进连击、连击 ≥3 天当日首笔 +5 加成；积分只增不减；数值集中在规则常量表，改数字不动架构
- **接口**：新增只读 `GET /rewards`（积分/连击/最近明细）；现有两个接口行为不变
- **4 个实施单元**：U1 服务可测化（零依赖 `node:test`，Node v22 已确认）→ U2 激励模块（纯函数+注入日期，可测跨日）→ U3 挂钩+接口 → U4 README；U1/U2 可并行
- **验证**：`npm test`（characterization 回归 + 计分单元 + 集成），5 个验收示例全部映射到具体测试场景

**审查状态（如实报告）**：文档审查降级——仅完成 producer 自审（`review_status: degraded`，`reason_code: spec_doc_review_capability_unavailable`），**独立审查未运行**（本环境无 `spec-doc-review` 技能，子代理派发亦未获授权）；自审应用 1 处机械修正（2 行命令表改项目符号），确定性结构检查全部通过，无已知遗留发现。

**主要限制**：
- 最大未证实风险是 AS1/AS2（激励形态=积分+连击）——这是代填假设，无法由测试证明，只能由你确认或推翻
- README 称"五个字段"与代码（`amount`/`note`）不一致，计划以源码为准（AS5）
- 本仓无既有测试/CI，测试基建本身是交付物的一部分

**可选下一步**（无需现在选择）：
1. **`/spec-work`**（推荐）——按计划直接开工实现
2. 若想先重定产品形态（比如你其实想要兑换商城、徽章体系）——`/spec-brainstorm` 值得更深的 WHAT 探讨，或直接告诉我改哪条假设，我修订计划
3. 只调整激励数值——告诉我数字，改 KTD6 常量即可
