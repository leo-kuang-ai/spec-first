完整性核验通过（哈希与运行前一致，未产生任何提交）。以下为验证报告。

---

# spec-prd 验证报告：`docs/brainstorms/2026-09-01-expense-export-requirements.md`

**结论：`readiness_outcome: revise-prd`** —— 该 PRD 是骨架级草稿，规划阶段将被迫发明多项 WHAT（编码、CSV 输出契约、空态/失败行为、异步边界、验收标准），不具备进入 `spec-plan` 的条件。

## 一、运行身份与边界

- `intent: validate`，`mutation_posture: report-only`；未写入、未运行写模式 finalize、未创建批评文件、未改动运行时镜像
- 完整性证据：运行前后 SHA-256 一致（`52b88776…40077b`）；git 工作区无新增改动；仅存在准备脚本创建的基线提交 `cf88c9e`（无任务提交）
- 输入侧：仓库中除该 PRD 外无任何实现源码或原始输入文件，`input_scan_status: no_inputs_declared`（已如实记录，输入侧设计源扫描未覆盖）

## 二、脚本侧事实（check-only，机器所有）

`finalize-prd-artifact.js --check-only` 结果 **blocked**：发现 **10 项（阻塞 5 项）**，`can_finalize: false`，`can_closeout: false`，无 ready receipt（`ready_receipt_present: false`，与 `status: draft` 一致）。

**阻塞 reason_codes：**

| reason_code | 含义 |
|---|---|
| `write_mode_undeclared` | 未声明 `write_mode` |
| `clarification_evidence_undeclared` | 未声明澄清证据 |
| `can_enter_spec_plan_undeclared` | 未声明能否进入规划 |
| `preflight_sweep_closure_absent` | 缺少需求分析门关闭声明 |
| `finalize_required` | 达到 ready 需生产者侧 finalize（本次仅报告） |

**结构性事实：** 核心章节缺失 5 项（Summary / Change Delta / Acceptance Examples / Scope Boundaries / Evidence And Assumptions，各对应一条 advisory `template_structure_hint`）；机器识别的有效需求行 **0**（REQ-1/REQ-2 为纯列表格式，无 ID 表行、无验收引用）；验收示例 **0**；OQ 共 2 条，其中 **1 条自声明 `blocks_planning=yes`**（OQ-1）。第 9 行 `placeholder_or_todo_present` 为 fixture 标记行的预期 advisory 噪声——**后续 refine 必须原样保留该标记**，不得为清零发现而删除。

## 三、语义诊断（LLM 所有，基于 Product Expert Lens）

**质量诊断：blockers。** 主要缺口按下游确认风险排序：

1. **OQ-1（编码 UTF-8 / UTF-8-BOM）**：真实 WHAT 级决定——直接改变导出文件的字节内容与 Excel 打开表现，属输出契约而非实现细节。当前无 closure disposition，自声明阻塞成立。
2. **CSV 输出契约完全未定义**（导出型需求的核心 WHAT）：列集合、表头行、日期/金额格式、文件名规则全部缺失。实现者席位判断：规划将被迫发明整个导出产物形态。
3. **OQ-2（10 万条异步）**：`blocks_planning=unknown` 不是合法 disposition。同步/异步、超时与大数据量行为是可观测行为与验收问题（触发 bulk/async NFR 约束），不能以"未知"带入规划。
4. **验收覆盖为零**：测试者席位对 REQ-1/REQ-2 找不到任何可断言信号（"selected month"的边界时区？空月份导出什么？失败时反馈？）。
5. **现状证据未标记**："entries page" 与月度数据模型在本 fixture 仓库中无实现源码可确认，仅为 user-stated；PRD 无 `Current System Snapshot` / 证据标签。
6. **范围边界与非目标缺失**：其他格式（XLSX）、非月度时间范围、权限/actor（本人数据？管理员？）均未声明。

## 四、优化建议（refine 预览，`original -> recommendation -> reason -> write target`）

1. OQ-1 开放且阻塞 → refine 中向 owner 逐题确认，推荐默认 **UTF-8-BOM**（Excel 兼容）并写入 Owner Decision Trace → 编码改变可观测产物字节 → `Acceptance Examples` + OQ closure 列
2. OQ-2 `unknown` → owner 二选一：v1 限定同步+数据量上限（NFR 边界），或异步列为 P1 → "unknown" 非法 disposition → `Scope Boundaries` / NFR
3. REQ-1/REQ-2 列表 → 重构为带稳定 ID + 验收引用的需求表 → 机器可识别、可追溯 → `Requirements`
4. 无验收 → 补充 AE：有数据月份导出、空月份、编码在 Excel 正确打开、仅含所选月条目 → 消除测试者席位缺口 → `Acceptance Examples`
5. 缺 5 个核心章节 → 补 Summary、Change Delta（语义为 `add`）、Scope Boundaries、Evidence And Assumptions → 消除规划发明空间 → 对应章节
6. 未标记现状 → "entries page"/月度数据标记为 user-stated，指向实现仓库后再升级 → 证据纪律 → `Evidence And Assumptions`
7. 四项声明缺失 → refine 完成分析后声明 `write_mode` / `clarification_evidence` / `can_enter_spec_plan` / `preflight_sweep_closure` + Decision Card 三字段，再走生产者 finalize → 解除机器阻塞 → `Readiness Self-Check`

## 五、交接熵检查

- **Resolved before planning**：无（工件完整性、spec_id、draft 姿态保持，但无已关闭的 WHAT 决定）
- **Still carried**：OQ-1（阻塞）、OQ-2（无 disposition）、5 个缺失章节、0 验收覆盖、未定义 CSV 契约、空态/失败/权限行为、未确认现状、4 项未声明声明
- **planning_would_invent_what: yes**

**下一步**：确认后将本报告作为 refine 运行的输入（refine 中逐题关闭 OQ-1/OQ-2 并重建章节结构）；本次按授权仅交付报告，未触碰工件。
