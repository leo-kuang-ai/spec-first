# WP1：源码深度审查计划

**版本**：v1.3
**创建日期**：2026-11-04
**更新日期**：2026-11-04 v1.1（多agent审查修补）；v1.2（core/原文核对：阅读/设计清单并入D01/D02/B01/B04检查面）；v1.3（评审团裁决：新增八维本体rubric D01+D05+D08 逐Skill判定节）
**目标**：逐个Skill深度阅读源码，理解设计意图，验证归因准确性，核对Contract实现
**投入**：26-35小时
**预算口径**：各任务子步骤累加约31-35.5h；v1.3新增八维rubric +0.5-1h/Skill（累加约33-38.5h）；26-35h为复用既有 phase05-analysis 增量深读后的目标口径（节省抵扣独立reviewer复核的新增时间）；只能全量深读时按累加口径执行并触发主计划风险4裁剪机制。
**主计划**：[OPTION-B-FULL-COMPLIANCE-PLAN.md](../planning/OPTION-B-FULL-COMPLIANCE-PLAN.md)
**产出路径**：`wp-results/wp1-results/`（按 Skill 分子目录）

---

## 🎯 目标

### 主要目标
1. **源码全面阅读**：4个主链路Skill的源码全部读过，理解核心逻辑
2. **设计意图理解**：理解为什么这样设计、权衡是什么、已知限制
3. **归因验证**：验证Phase 0/Phase 1的归因是否准确，有误则修正
4. **Contract实现核对**：对照 08-skill-contract-protocol.md 逐项验证源码实现

### 对应core/验收标准（12-phase05-skill-deep-dive.md）
- [ ] 源码已全面阅读（主要文件全部阅读 + 理解核心逻辑 + 绘制流程图）
- [ ] 设计意图已理解（设计原因 + 权衡 + 已知限制）
- [ ] Phase 0 归因已验证（对比源码验证 + 修正 + 找到真正根因）
- [ ] 优化方案已设计（可操作 + 预期效果 + 风险 + 验证方法）

### 范围

| Skill | Phase 0.5状态（v1.1更新） | 本轮任务 |
|---|---|---|
| spec-plan | ✅ 已完成 | 不重复深读，仅引用既有分析 |
| spec-work | ⚠️ phase05-analysis有浅层分析，深度未达标 | 任务1.1（先diff既有分析，再增量深读） |
| spec-code-review | ⚠️ phase05-analysis有浅层分析，深度未达标 | 任务1.2（先diff既有分析，再增量深读） |
| spec-commit-push-pr | ⚠️ phase05-analysis有浅层分析，深度未达标 | 任务1.3（先diff既有分析，再增量深读） |
| spec-prd | ⚠️ phase05-analysis有浅层分析 | 任务1.4（仅Contract验证，不做全量深读） |

---

## 📋 任务清单

> **既有产物复用（v1.1新增）**：`phase0-results/phase05-analysis/` 已存在 spec-work / spec-code-review / spec-commit-push-pr / spec-prd 四份分析（2026-11-04，合同文件阅读+清点+归因对照）。各任务 Step 1 先 diff 对应既有分析，确认其覆盖与深度后再定增量深读范围；不采信处记录理由。Layer 1 三项判定（指令清晰度/必要性/完整性）适用于任务1.1/1.2/1.3 的阅读清单与 reading-notes 模板。

### 任务1.1：spec-work 源码深度审查（8-10h）

#### Step 1: 源码全面阅读（4h）

**文件清单**（实际结构，2026-11-04核验）：
```bash
skills/spec-work/
├── SKILL.md                          # Skill定义
├── evals/                            # 评测资产
├── references/                       # 按需加载的深度内容
│   ├── agents/                       # Agent定义
│   ├── execution-strategy.md         # 执行策略（P-WORK-3 Isolation advisory所在）
│   ├── implementation-loop.md        # 实施循环
│   ├── feedback-and-tests.md         # 反馈与测试（Test Discovery所在）
│   ├── input-triage.md               # 输入分诊（metadata/readiness/lifecycle）
│   └── ...（return-to-caller.md、review-findings-followup.md等）
└── scripts/
```

**阅读检查清单**：
- [ ] SKILL.md主prompt全文阅读
- [ ] 理解触发条件和执行流程
- [ ] 理解输入期望（Plan的Goal/Verification/DoD）
- [ ] 理解输出承诺（实现代码+测试+residual记录）
- [ ] 识别关键逻辑分支
- [ ] 绘制执行流程图
- [ ] Layer 1三项判定：指令清晰度（无歧义/无矛盾）、必要性（每步骤有明确目的）、完整性（关键验证点未遗漏）
- [ ] core/05 D01核查：约束是否过时/相互矛盾/过度指导（v1.2新增，覆盖矩阵部分#17）
- [ ] core/05 八维本体rubric：按05原文检查单对SKILL.md逐维pass/fail——D01强制约束密度（「你必须…」式条款计数）、D05紧凑性（长度阈值/枚举字段密度）、D08上下文利用（按需加载/Trigger Map结构）（v1.3新增，owner采纳评审团裁决；判定记入source-reading-notes的rubric节，覆盖矩阵部分#17扩展+#19）
- [ ] core/05 D02核查：是否提供业务约束/已知反模式/决策依据，而非流程控制（v1.2新增，覆盖矩阵未覆盖#9）
- [ ] B01/B04检查面：正向触发与相似入口负例、helper暴露；source-of-truth与runtime mirror边界登记（v1.2新增，覆盖矩阵未覆盖#10）

**产出**：
- spec-work-source-reading-notes.md（4-5页）
- spec-work-flow-diagram.mermaid

#### Step 2: 设计意图理解（2h）

**理解维度**：
- 为什么Work要先读metadata/readiness/lifecycle？
- 为什么要区分有Plan的Work和无Plan的Work？
- DoD和Verification Contract的设计权衡是什么？
- 为什么不强制所有Work都运行测试？
- residual记录的设计目的是什么？

**产出**：
- spec-work-design-rationale.md（2-3页）

#### Step 3: 问题根因深挖（2-3h）

**验证Phase 0/Phase 1的归因**：

Phase 1优化了3个spec-work相关问题（语义标签对照 final-optimization-report.md 修正）：
- P-WORK-1（commit 119f9b3e）：Test Discovery 缺"按触碰面反查管辖套件"类别 → 修复为增第3步按断言目标反查（rg touched-path tests/）+ shipping check 来源枚举
- P-WORK-2（commit 5ec3f8bc）：shipping check 选择缺 release 治理套件类别 → 修复为补 test:release:governance 具体命令
- P-WORK-3（commit 10970193）：worktree 隔离无提示 → 修复为 execution-strategy 增 Isolation advisory（spec-worktree 选项提示，非门禁）

**深挖问题**：
1. 对比Phase 1优化前后的源码diff（git log/show 对应提交）
2. 验证问题是否真的存在于优化前源码中
3. 验证修复文本落位与合同测试锁定（行为层效果由WP3与自然任务验证，本步不claim行为改善）
4. 检查是否有误判或遗漏

**产出**：
- spec-work-root-cause-verification.md（3-4页）
  - 每个问题的源码证据（行号定位）
  - evidence-tier 标注（text-confirmed / behavior-unverified）
  - 归因准确性评分（1-10，advisory；由 fresh-source 独立 reviewer 复核，引用 docs/contracts/workflows/fresh-source-eval-checklist.md）
  - 修正建议（如有）
  - 产出头部标 provenance（生成会话/日期/口径/limitations）

#### Step 4: Contract实现验证（2h）

**验证spec-work Output Contract**（对照 core/08-skill-contract-protocol.md）：
- [ ] 实现所有acceptance_conditions
- [ ] 运行测试验证
- [ ] 记录未完成项（residual）

**验证方法**：
1. 在SKILL.md中搜索"acceptance"/"verification"/"DoD"
2. 检查是否有明确指令要求读取这些内容
3. 检查是否有明确指令要求逐项实现
4. 检查是否有明确指令要求记录未完成项

**产出**：
- spec-work-contract-implementation-check.md（2-3页）
  - 每个Contract要求的实现位置（行号）
  - 实现充分性评分（1-10）
  - 缺失项清单

#### 任务1.1总产出（5个）
- [ ] spec-work-source-reading-notes.md
- [ ] spec-work-flow-diagram.mermaid
- [ ] spec-work-design-rationale.md
- [ ] spec-work-root-cause-verification.md
- [ ] spec-work-contract-implementation-check.md

---

### 任务1.2：spec-code-review 源码深度审查（8-10h）

#### Step 1: 源码全面阅读（4h）

**阅读检查清单**：
- [ ] SKILL.md主prompt全文阅读
- [ ] 理解触发条件（有Plan vs 无Plan）
- [ ] 理解输入期望（plan context / task context / diff）
- [ ] 理解输出承诺（findings结构化输出）
- [ ] 理解审查维度（correctness/completeness/quality）
- [ ] 识别审查深度控制逻辑
- [ ] 绘制执行流程图
- [ ] Layer 1三项判定：指令清晰度（无歧义/无矛盾）、必要性（每步骤有明确目的）、完整性（关键验证点未遗漏）
- [ ] core/05 D01核查：约束是否过时/相互矛盾/过度指导（v1.2新增，覆盖矩阵部分#17）
- [ ] core/05 八维本体rubric：按05原文检查单对SKILL.md逐维pass/fail——D01强制约束密度（「你必须…」式条款计数）、D05紧凑性（长度阈值/枚举字段密度）、D08上下文利用（按需加载/Trigger Map结构）（v1.3新增，owner采纳评审团裁决；判定记入source-reading-notes的rubric节，覆盖矩阵部分#17扩展+#19）
- [ ] core/05 D02核查：是否提供业务约束/已知反模式/决策依据，而非流程控制（v1.2新增，覆盖矩阵未覆盖#9）
- [ ] B01/B04检查面：正向触发与相似入口负例、helper暴露；source-of-truth与runtime mirror边界登记（v1.2新增，覆盖矩阵未覆盖#10）

**产出**：
- spec-code-review-source-reading-notes.md（4-5页）
- spec-code-review-flow-diagram.mermaid

#### Step 2: 设计意图理解（2h）

**理解维度**：
- 为什么Review需要区分有Plan和无Plan？
- 为什么Review要接收task context？
- 审查维度（correctness/completeness/quality）的权衡是什么？
- 为什么Review是只读的（不授权修复）？
- findings结构化输出的设计目的？
- 为什么需要"需求完整性核对"？

**产出**：
- spec-code-review-design-rationale.md（2-3页）

#### Step 3: 问题根因深挖（2-3h）

**验证Phase 1归因**：

Phase 1优化了1个spec-code-review问题（语义标签对照 final-optimization-report.md 修正）：
- P-CR-1（commit 5089f13a）：Coverage 缺 governing contract-suite 披露 → 修复为增 Governing contract-suite disclosure（run/not-run 披露，不改 verdict）

**深挖问题**：
1. 对比优化前后的源码diff
2. 验证问题是否真的存在
3. 检查优化是否真的改善了覆盖披露
4. 检查是否有其他未发现的问题

**特别关注**：
- D07维度（审查视角按变更类型调整）当前完全未审查
- 需要验证spec-code-review是否有按变更类型调整审查策略的能力
- 注意：行为验证中P-CR-1未获直接评测（comparison-report.md 已如实标注），本步骤需补上这个证据缺口

**产出**：
- spec-code-review-root-cause-verification.md（3-4页）

#### Step 4: Contract实现验证（2h）

**验证spec-code-review Output Contract**（对照 core/08-skill-contract-protocol.md）：
- [ ] findings有具体location（文件:行号）
- [ ] 每个finding有改进建议
- [ ] severity评级合理（P0/P1/P2）

**验证方法**：
1. 在SKILL.md中搜索"finding"/"location"/"severity"
2. 检查是否有明确指令要求包含这些信息
3. 检查findings的结构化输出格式定义

**产出**：
- spec-code-review-contract-implementation-check.md（2-3页）

#### 任务1.2总产出（5个）
- [ ] spec-code-review-source-reading-notes.md
- [ ] spec-code-review-flow-diagram.mermaid
- [ ] spec-code-review-design-rationale.md
- [ ] spec-code-review-root-cause-verification.md
- [ ] spec-code-review-contract-implementation-check.md

---

### 任务1.3：spec-commit-push-pr 源码深度审查（6-8h）

#### Step 1: 源码全面阅读（3h）

**阅读检查清单**：
- [ ] SKILL.md主prompt全文阅读
- [ ] 理解触发条件
- [ ] 理解输入期望（工作目录状态、变更内容）
- [ ] 理解输出承诺（commit、push、PR创建）
- [ ] 理解commit message规范
- [ ] 理解PR描述生成逻辑
- [ ] 绘制执行流程图
- [ ] Layer 1三项判定：指令清晰度（无歧义/无矛盾）、必要性（每步骤有明确目的）、完整性（关键验证点未遗漏）
- [ ] core/05 D01核查：约束是否过时/相互矛盾/过度指导（v1.2新增，覆盖矩阵部分#17）
- [ ] core/05 八维本体rubric：按05原文检查单对SKILL.md逐维pass/fail——D01强制约束密度（「你必须…」式条款计数）、D05紧凑性（长度阈值/枚举字段密度）、D08上下文利用（按需加载/Trigger Map结构）（v1.3新增，owner采纳评审团裁决；判定记入source-reading-notes的rubric节，覆盖矩阵部分#17扩展+#19）
- [ ] core/05 D02核查：是否提供业务约束/已知反模式/决策依据，而非流程控制（v1.2新增，覆盖矩阵未覆盖#9）
- [ ] B01/B04检查面：正向触发与相似入口负例、helper暴露；source-of-truth与runtime mirror边界登记（v1.2新增，覆盖矩阵未覆盖#10）

**产出**：
- spec-commit-push-pr-source-reading-notes.md（3-4页）
- spec-commit-push-pr-flow-diagram.mermaid

#### Step 2: 设计意图理解（1.5h）

**理解维度**：
- 为什么commit/push/PR合并在一个Skill？
- commit message的设计规范是什么？
- PR描述的生成策略是什么？
- 为什么需要关联Plan/Task context？

**产出**：
- spec-commit-push-pr-design-rationale.md（1-2页）

#### Step 3: 问题根因深挖（1.5-2h）

**验证Phase 1归因**：

Phase 1优化了1个spec-commit-push-pr问题（语义标签对照 final-optimization-report.md 修正）：
- P-CPPR-1（commit c66da291）：publishing gate 缺 release 面机械触发类别 → 修复为增 Release-surface reconciliation + release_governance_status 披露

**深挖问题**：
1. 对比优化前后的源码diff
2. 验证根因是否真实
3. 检查优化是否真的改善了release面触发与披露质量

**产出**：
- spec-commit-push-pr-root-cause-verification.md（2-3页）

#### Step 4: Contract实现验证（1h）

**验证spec-commit-push-pr Contract**（v1.1修正：core/08-skill-contract-protocol.md:256-289 实际定义了本Skill的Input/Output Contract，原「未明确定义」表述有误）：
- [ ] 输入门：review_result.overall_status 必须是 approved 才进入 publishing
- [ ] pr_body 必含：实现的需求、验收条件、测试证据
- [ ] commit message是否有明确格式要求
- [ ] 是否有验证门确保信息完整（缺失处区分诚实降级与真实缺口）

**产出**：
- spec-commit-push-pr-contract-implementation-check.md（1-2页）

#### 任务1.3总产出（5个）
- [ ] spec-commit-push-pr-source-reading-notes.md
- [ ] spec-commit-push-pr-flow-diagram.mermaid
- [ ] spec-commit-push-pr-design-rationale.md
- [ ] spec-commit-push-pr-root-cause-verification.md
- [ ] spec-commit-push-pr-contract-implementation-check.md

---

### 任务1.4：补充spec-prd Contract实现验证（2-4h）

**背景**：spec-prd未在Phase 1优化（零证据问题，Phase 1结论），但core/要求验证其Contract实现。

#### 验证spec-prd Output Contract（2-3h）

根据 core/08-skill-contract-protocol.md，spec-prd必须：
- [ ] functional_requirements至少1项
- [ ] 每项至少1个acceptance_criteria
- [ ] boundary_conditions至少3项（空输入、单条、多条）
- [ ] out_of_scope明确

**验证方法**：
1. 读取skills/spec-prd/SKILL.md
2. 搜索"functional_requirements"/"acceptance_criteria"/"boundary_conditions"/"out_of_scope"
3. 检查是否有明确指令要求生成这些内容
4. 检查是否有输出验证门

**产出**：
- spec-prd-contract-implementation-check.md（2-3页）

#### 验证spec-plan Output Contract（0.5-1h，v1.1新增——覆盖分析v1.1未覆盖#5归属此处）

根据 core/08-skill-contract-protocol.md，spec-plan必须：
- [ ] tech_stack中config必须具体
- [ ] acceptance_conditions数量≥PRD中FR数量
- [ ] boundary_handling覆盖PRD所有边界

产出并入 spec-prd-contract-implementation-check.md 附录；结论回填主计划Contract验证表「spec-plan: X/3」。

#### 验证输出验证门机制（1h）

检查是否有：
- [ ] 自动化验证门脚本
- [ ] Retry机制
- [ ] Human escalation逻辑

**产出**：
- validation-gate-mechanism-check.md（1-2页）

#### 任务1.4总产出（2个）
- [ ] spec-prd-contract-implementation-check.md
- [ ] validation-gate-mechanism-check.md

---

## 📊 时间线（建议第1-2周执行）

| 日 | 任务 | 投入 |
|---|---|---|
| Week1 Day1-2 | 任务1.1 spec-work（Step 1-4） | 8-10h |
| Week1 Day3 | 任务1.4 spec-prd Contract验证 | 2-4h |
| Week1 Day4 | WP5阶段1启动（并行） | — |
| Week2 Day1-2 | 任务1.2 spec-code-review（Step 1-4） | 8-10h |
| Week2 Day3 | 任务1.3 spec-commit-push-pr（Step 1-4） | 6-8h |
| Week2 Day4 | WP1总结报告 | 1-2h |

---

## 📋 汇总产出（18个）

**15个Skill深读文档**（3 Skill × 5文档）+ **2个spec-prd验证** + **1个总结**：

1. spec-work-source-reading-notes.md
2. spec-work-flow-diagram.mermaid
3. spec-work-design-rationale.md
4. spec-work-root-cause-verification.md
5. spec-work-contract-implementation-check.md
6. spec-code-review-source-reading-notes.md
7. spec-code-review-flow-diagram.mermaid
8. spec-code-review-design-rationale.md
9. spec-code-review-root-cause-verification.md
10. spec-code-review-contract-implementation-check.md
11. spec-commit-push-pr-source-reading-notes.md
12. spec-commit-push-pr-flow-diagram.mermaid
13. spec-commit-push-pr-design-rationale.md
14. spec-commit-push-pr-root-cause-verification.md
15. spec-commit-push-pr-contract-implementation-check.md
16. spec-prd-contract-implementation-check.md
17. validation-gate-mechanism-check.md
18. WP1-source-code-deep-dive-summary.md

**产出目录**：`wp-results/wp1-results/<skill-name>/`

---

## ✅ 完成标准

- [ ] 3个Skill源码理解深度≥8/10（有源码阅读笔记佐证）
- [ ] 每个Skill有流程图（mermaid）
- [ ] Phase 1的5个优化项（P-WORK-1/2/3、P-CR-1、P-CPPR-1）全部有源码级归因验证结论
- [ ] spec-prd Contract 4项 + spec-plan Contract 3项（v1.1新增）+ 验证门机制有行号级核对结果
- [ ] 每个Contract检查有实现充分性评分（1-10）
- [ ] 18个文档全部归位到 wp-results/wp1-results/
- [ ] 归因如有修正，已同步记录到总结报告并通知主计划

---

## 🚨 风险与缓解

| 风险 | 概率 | 缓解 |
|---|---|---|
| 源码理解难度超预期，时间+10-20% | 中 | 优先读SKILL.md主prompt；允许部分Skill深度降级并如实标注 |
| references/文件量大，4h读不完 | 中 | 分层：先主文件+核心reference，次要文件略读并标注 |
| 归因验证发现Phase 1优化有误判 | 低 | 如实记录，不掩饰；误判≥2项或复核结论与Phase 1声明冲突时，暂停WP5阶段2候选流程，升级owner仲裁 |
| spec-prd深读范围争议 | 低 | 本轮只做Contract验证（任务1.4定义），不做全量深读 |

---

## 📝 执行准备清单

- [ ] 确认可访问 skills/ 源码目录
- [ ] 准备Phase 1优化提交号用于diff对比：5个属本WP范围（119f9b3e/5ec3f8bc/10970193/c66da291/5089f13a）；5865e27b为spec-plan优化（SP-1），不在本WP diff复核范围，仅供VT-02证据对照
- [ ] 创建 wp-results/wp1-results/ 目录结构
- [ ] 准备mermaid绘图格式模板
- [ ] 打开 core/08-skill-contract-protocol.md 作为Contract对照基准

---

**WP1计划版本**：v1.3
**创建日期**：2026-11-04
**预计执行**：Week 1-2
**投入**：26-35小时
