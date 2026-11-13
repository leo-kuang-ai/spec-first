spec-plan 全流程已走完，交付如下。

---

## 交付摘要

**计划已写入**：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-3290516558/docs/plans/2026-11-07-001-feat-ledger-usability-improvements-plan.md`（`spec-unified-plan/v1`，`implementation-ready`，`execution: code`，`status: active`）

**内容一览**：围绕 README 自列的三个粗糙点——R1–R2 录入省事且健壮（默认值+校验，顺带修掉“坏 JSON 打崩进程”和“存入 undefined”两个实际缺陷）、R3–R4 分类与过滤、R5 汇总视图、R6–R7 统一 JSON 响应与 README 同步；5 个实现单元（U1 可测试骨架 → U2 校验 → U3 分类 → U4 汇总 → U5 文档）、6 条 KTD、接口演进契约表；保持零依赖（`node:test`）与纯内存形态；三个范围 call-out（自由分类/纯内存/无 UI）均以 Assumptions 显式留痕，可随时推翻。

**审查状态（降级 envelope）**：Doc review 仅完成 producer 自审，独立审查未运行（`reason_code: spec_doc_review_capability_unavailable`——本宿主未安装 `spec-doc-review`）；`fixes_applied: 3`（2 处 H2 分隔线 + 1 处标点空格）；剩余 0 proposed fix / 0 decision / 1 FYI（README「五个字段」与代码实际两字段的表述差异，已在计划 Evidence & Limitations 中披露处理）；无 P0/P1。置信检查通过，无需加深。

**交接状态：阻塞（实施未开始）**。你本轮授权了“让 demo 更好用”（含实施意图），但按 spec-plan 契约我不能自行转入编码，而本宿主核实无可用执行路径：`spec-work` 未安装（项目级仅有 spec-plan，用户级无 spec-*，亦无可加载的 canonical 执行 owner 源码）、本会话无已在运行的执行 caller、宿主无 goal 创建接口。恢复路径二选一：

1. **安装 spec-work**（来自安装 spec-plan 的同一来源）后以计划路径启动。给未来执行者的 fallback 提示词：*按 `<上述计划路径>` 实施至 Definition of Done；先扫标题而非通读全文，依次读 Goal Capsule → 按依赖序执行 U1–U5（连同各自引用的 R/KTD）→ 跑 Verification Contract 的 `npm test` 门禁并满足各单元测试场景；进度在计划文件之外跟踪；遇真正阻塞（改变范围或与计划矛盾）时停下说明，而非自行猜测。*
2. **你下一轮明确指示我按该计划直接实施**——那将是一条新的执行指令，我作为你点名的执行者开始改代码。

另外：遵守本轮约束，除 `prepare-eval.cjs` 生成的基线提交外未做任何 commit；当前工作区仅新增计划文件。
