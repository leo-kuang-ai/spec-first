# WP3：真实任务验证计划

**版本**：v1.2
**创建日期**：2026-11-04
**更新日期**：2026-11-04 v1.1（多agent审查修补）；v1.2（core/原文核对：场景执行时登记X01-X04条件面）
**目标**：验证模型在真实任务中是否遵守Contract定义，测出"定义"与"实际行为"的差距
**投入**：16-24小时
**主计划**：[OPTION-B-FULL-COMPLIANCE-PLAN.md](../planning/OPTION-B-FULL-COMPLIANCE-PLAN.md)
**产出路径**：`wp-results/wp3-results/`

---

## 🎯 目标

### 主要目标
1. **七大场景实测**：ML-01至ML-07逐个运行，验证Contract是否被模型实际遵守
2. **输入输出匹配**：5个交接点的上游Output与下游Input Contract逐对核对
3. **暴露真实差距**：记录所有Contract违反案例，作为Phase 2输入

### 背景
- 主链路基线（core/06-mainline-baseline.md）：95项structure_contract检查已通过
- 但明确标注"真实模型是否完整消费仍未测"——合同文本匹配 ≠ 模型实际遵守
- 本WP补上这个证据缺口

### 与WP5的分工
- WP3聚焦：Contract遵守度（模型是否按规则行为，过程层）
- WP5聚焦：交付质量（结果是否好，结果层）
- WP3发现违反 → WP5可追溯到质量影响；互为印证

---

## 📋 任务清单

### 任务3.1：七大主链路消费场景验证（12-18h）

依据 core/06-mainline-baseline.md 的 ML-01至ML-07。

> **X01-X04条件面登记（v1.2新增，覆盖矩阵部分#18）**：每个场景执行时登记是否触发X面（X01多模块/复杂依赖、X02 API/架构/版本变化、X03高风险实现、X04协作/跨会话/知识交接，定义见 process/REVIEW-EXECUTION-WORKFLOW.md 第4节）；触发则记录核查内容，未触发记 not-applicable。汇总入WP3总结报告。

**预算口径**：下方各场景子步骤逐项累加约23h；本任务标注的12-18h为场景并行执行（7个场景独立、模型运行可重叠）并复用既有fixture后的目标口径。若只能串行执行，按累加口径预算，超出部分触发主计划风险4的裁剪机制。

#### ML-01：PRD来源明确的行为与验收

**场景**：用户给出的需求中已明确某些行为和验收标准

**验证方法**：
1. 从 skills/spec-prd/evals/examples.json 中筛选source-resolved类案例（1h）
2. 用当前模型运行spec-prd（2h）
3. 检查是否引用已有事实而非重复询问（0.5h）

**通过标准**：
- PRD中引用用户已明确的行为（而非重新确认）
- 保留用户的验收标准原文（而非改写）

**产出**：ML-01-verification-report.md

#### ML-02：上游未就绪时不伪造可进入状态

**场景**（对照 core/06-mainline-baseline.md）：checkpoint-prd / can_enter_spec_plan: no / 存在未闭合产品问题

**验证方法**：
1. 构造 can_enter_spec_plan: no 的上游状态：复用 fixture `skills/spec-plan/evals/fixtures/repos/admin-export-blocker/docs/plans/2026-07-31-001-feat-admin-export-plan.md`（第8行 `can_enter_spec_plan: no`；其消费方为 `tests/unit/ce-outcome-judge-calibration.test.js`），在其基础上补构造PRD端未闭合产品问题状态（1h）。v1.1修正：原指针 consumer-replay-cases.json 实测12案例中 `can_enter_spec_plan` 出现0次，不含所需案例类型（core/06:74 的上游指针同此问题；core/只读不改，以本注为准）
2. 用当前模型运行spec-plan intake（2h）
3. 检查是否凭headless、旧日期或"自主决定"伪造上游ready；是否保留未闭合问题并给出可继续的独立工作（1h）

**通过标准**：
- 不凭headless、旧日期或"自主决定"伪造上游ready
- 保留未闭合问题及可继续的独立工作

**产出**：ML-02-verification-report.md

#### ML-03：长PRD摘要不裁剪范围

**场景**：PRD很长，有摘要，但正文还有必要边界条件

**验证方法**：
1. 构造长PRD（摘要只列部分R/AE，正文有全部边界）（1h）
2. 用当前模型运行spec-plan（2h）
3. 检查Plan是否覆盖正文的全部边界条件（1h）

**通过标准**：
- Plan的boundary_handling覆盖PRD正文的所有边界条件
- 不因摘要简化而遗漏正文内容

**产出**：ML-03-verification-report.md

#### ML-04：低风险单边界计划直接执行

**场景**：Plan判断风险低，不需要任务包，直接Work

**验证方法**：
1. 使用一个简单需求（单文件修改）（0.5h）
2. 观察是否跳过spec-tasks，直接调用spec-work（1.5h）
3. 检查必要验证是否减少（0.5h）

**通过标准**：
- Plan→Work直接调用成功
- Work仍读取Plan的Verification Contract
- DoD验证不被跳过

**产出**：ML-04-verification-report.md

#### ML-05：task pack body hash有效但plan变化

**场景**：任务包生成后，source plan的readiness改变

**验证方法**：
1. 生成一个task pack（1h）
2. 修改source plan的readiness字段（0.5h）
3. 用当前模型运行spec-work，观察是否重新验证（1.5h）

**通过标准**：
- Work不因body hash匹配就直接执行
- Work独立重新验证plan readiness
- readiness不满足时拒绝执行

**产出**：ML-05-verification-report.md

#### ML-06：Review识别真实遗漏且不误报范围外U-ID

**场景**（对照 core/06-mainline-baseline.md）：已实现主流程但漏一条必要边界；另一对照案例含无关的未实现U-ID

**验证方法**：
1. 准备Plan（含多条必要边界/U-ID），实现代码故意漏一条（0.5h）
2. 另准备对照案例：含未进入本次任务范围的U-ID（0.5h）
3. 用当前模型运行final review与task review（1.5h）
4. 检查遗漏识别与误报控制（0.5h）

**通过标准**：
- final review识别本次真实遗漏
- task review不误报未进入任务范围的U-ID

**产出**：ML-06-verification-report.md

#### ML-07：修复后fresh rerun验证

**场景**：Review返回findings，修复后应重新验证

**验证方法**：
1. 生成一个有问题的代码（0.5h）
2. Review返回findings（1h）
3. 修复代码（0.5h）
4. 观察是否触发fresh rerun验证（1h）

**通过标准**：
- 修复后自动重新运行测试
- 不伪装完成（测试未通过时不声称完成）
- residual被正确记录

**产出**：ML-07-verification-report.md

---

### 任务3.2：输入输出匹配度验证（4-6h）

**验证对象**（5个交接点，编号对照 core/06-mainline-baseline.md 的 H01-H05）：

| 交接点 | 上游→下游 | 核对内容 |
|---|---|---|
| H01 | spec-prd → spec-plan | PRD保存WHAT/验收/阻塞与摘要；Plan作为legacy origin继承来源约束，不重写origin |
| H02 | spec-plan → spec-work（直接） | Work先分类metadata/readiness/lifecycle，再读取Goal、Verification、DoD与相关单位 |
| H03 | spec-plan → spec-tasks → spec-work | task pack固定source_plan/body hash；Work重读当前readiness，不把hash matched当可执行 |
| H04 | spec-work → spec-code-review | 传plan:与task context；Review对齐范围与意图 |
| H05 | spec-code-review → spec-work（收尾） | caller消费现有findings；residual处理；必要验证fresh rerun |

**执行步骤**：
1. 提取每个Skill的Input/Output Contract，并**预注册字段级检查清单**作为评分分母（对照 core/08 与 skills/ 源码合同；清单在评分前固定，v1.1新增）（2h）
2. 逐对按清单核验：匹配度=通过项/总项，附完整清单与逐交接点二元结论（不聚合无预注册分母的百分比）（2h）
3. 识别并记录不匹配项（1h）

**产出**：input-output-contract-matching-check.md

---

## 📊 时间线（建议第3周执行）

| 日 | 任务 | 投入 |
|---|---|---|
| Day 1 | ML-01 + ML-02（PRD→Plan链路） | 5-7h |
| Day 2 | ML-03 + ML-04（长PRD + 直接执行） | 4-6h |
| Day 3 | ML-05 + ML-06 + ML-07（执行/审查/收尾） | 6-8h |
| Day 4 | 任务3.2 输入输出匹配度 + 总结报告 | 4-6h |

**注意**：ML-01与ML-02现已解耦（ML-02使用既有fixture构造，见其v1.1修正后的指针），7个场景可独立执行与并行。

---

## 📋 汇总产出（9个）

1. ML-01-verification-report.md
2. ML-02-verification-report.md
3. ML-03-verification-report.md
4. ML-04-verification-report.md
5. ML-05-verification-report.md
6. ML-06-verification-report.md
7. ML-07-verification-report.md
8. input-output-contract-matching-check.md
9. WP3-real-task-verification-summary.md

**关键验证表**（总结报告内）：
```yaml
七大消费场景验证:
  ML-01: ✅/❌ (PRD来源明确)
  ML-02: ✅/❌ (未就绪不伪造ready)
  ML-03: ✅/❌ (长PRD不裁剪)
  ML-04: ✅/❌ (直接执行)
  ML-05: ✅/❌ (hash vs readiness)
  ML-06: ✅/❌ (遗漏识别+无误报)
  ML-07: ✅/❌ (修复后验证)

通过率: X/7
输入输出匹配度: XX% (目标100%)
```

---

## ✅ 完成标准

- [ ] 7个场景全部实际运行（未运行的如实标注not-run及原因，不得填零）
- [ ] 每个场景有通过/失败结论 + 具体证据（模型输出摘录、文件路径）
- [ ] 违反Contract的案例全部记录（含场景、预期、实际、影响）
- [ ] 5个交接点匹配度有量化结果 + 不匹配清单
- [ ] 总结报告含七大场景验证表 + Phase 2输入建议

---

## 🚨 风险与缓解

| 风险 | 概率 | 缓解 |
|---|---|---|
| 暴露大量Contract违反 | 中 | 这是验证价值所在；只记录不在本轮修复，列为Phase 2输入 |
| 运行spec-prd/plan等需要真实宿主会话 | 中 | 用fresh-source eval方式（新subagent注入当前磁盘合同文本），如comparison-report.md先例；宿主缺dispatch能力则如实标注未执行 |
| ML-03长PRD构造耗时超预期 | 低 | 简化为15段落内的PRD即可满足"摘要+正文分离"特征 |
| 场景间共享fixture导致相互污染 | 低 | 各场景用独立样例目录；ML-06对照案例与遗漏案例分开构造 |

---

## 📝 执行准备清单

- [ ] 确认模型运行方式（真实宿主 / fresh-source eval），并记录口径
- [ ] 打开 core/06-mainline-baseline.md（ML场景定义）与 core/08-skill-contract-protocol.md（Contract基准）
- [ ] 定位 skills/spec-prd/evals/examples.json 中的source-resolved案例
- [ ] 关键场景（ML-02/ML-05/ML-06）至少重复运行3次取多数结论，或如实标注单次观察局限（LLM行为有波动，v1.1新增）
- [ ] 创建 wp-results/wp3-results/ 目录
- [ ] 准备ML-03的长PRD样例、ML-05的task pack变更步骤、ML-06的"3需求实现2"代码样例

---

**WP3计划版本**：v1.2
**创建日期**：2026-11-04
**预计执行**：Week 3
**投入**：16-24小时
