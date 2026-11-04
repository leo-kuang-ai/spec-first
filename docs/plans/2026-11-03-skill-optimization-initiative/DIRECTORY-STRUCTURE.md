# 目录结构说明

**项目**：2026-11-03 Skill优化项目  
**版本**：v1.6  
**更新日期**：2026-11-04

---

## 📁 目录结构

```
2026-11-03-skill-optimization-initiative/
├── README.md                           # 项目总览
├── DIRECTORY-STRUCTURE.md              # 本文档
│
├── core/                               # 核心方法论与标准（12份，内容只读）
│   ├── 00-goals-and-success-criteria.md
│   ├── 01-v4-workflow-driven-approach.md
│   ├── 08-skill-contract-protocol.md
│   ├── 12-phase05-skill-deep-dive.md
│   └── ...（09/10/11/DECISION-AUTHORITY/RESOURCE-PLAN 已归档至 archive/）
│
├── planning/                           # 执行计划（主入口）
│   ├── OPTION-B-FULL-COMPLIANCE-PLAN.md    # ⭐ 主执行计划 v3.5（v2主链路批次）
│   └── ...
│
├── analysis/                           # 分析报告
│   ├── CORE-REVIEW-DIMENSIONS-COVERAGE.md  # 覆盖度分析（v1.3口径：53项/40%）
│   ├── MULTI-AGENT-PLAN-REVIEW-2026-11-04.md # 多agent方案审查沉淀
│   ├── SKILL-SIMPLIFICATION-ANALYSIS.md    # Skill精简分析
│   └── ...
│
├── wp-plans/                           # 工作包详细计划（WP1/3/4/5独立计划，WP2已删除）
│   ├── WP1-SOURCE-CODE-DEEP-DIVE-PLAN.md        # WP1源码深度审查
│   ├── WP3-REAL-TASK-VERIFICATION-PLAN.md       # WP3真实任务验证
│   ├── WP4-UNCOVERED-DIMENSIONS-PLAN.md         # WP4未覆盖维度补充
│   ├── WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md  # WP5交付质量评估
│   └── WP5-TOKEN-COST-MEASUREMENT-PLAN.md       # WP5旧版（存档，已被交付质量版取代）
│
├── execution/                          # 执行指令（历史）
│   ├── AUTONOMOUS-EXECUTION-INSTRUCTIONS.md
│   ├── EXECUTION-COMMANDS.md
│   └── ...
│
├── process/                            # 流程方法（历史）
│   ├── REVIEW-EXECUTION-WORKFLOW.md
│   ├── HOW-TO-START-REVIEW.md
│   └── ...
│
├── summary/                            # 总结验证
│   ├── PROJECT-FINAL-SUMMARY.md
│   ├── REVIEW-TASKS-VERIFICATION.md
│   └── ...
│
├── reviews/                            # 历史审查报告
│   ├── 01-document-review.md
│   ├── 02-plan-review.md
│   └── ...
│
├── phase0-results/                     # Phase 0结果
│   ├── autonomous-optimization-plan.md
│   ├── phase0-final-report.md
│   └── ...
│
├── archive/                            # 历史归档（v1/v2实践、旧执行指南、core未执行设计等）
│   └── ...
│
├── docs/                               # 项目专项文档（多模型评审指南等）
│   └── ...
│
└── evidence/                           # 证据与数据
    └── ...

```

---

## 🎯 关键入口文档

### 1. 开始执行（现在）
**入口**：`planning/OPTION-B-FULL-COMPLIANCE-PLAN.md` v3.5
- 选项B完整达标执行计划
- 60-86h（路径A）/ 70-102h（路径B）+ 汇总4-6h，4-5周
- 4个工作包：WP1/3/4/5（wp-plans/为唯一执行真相源）

### 2. WP5详细执行
**入口**：`wp-plans/WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md`  
- Skill交付质量评估
- 10-15h（阶段1）+ 10-16h（阶段2条件，决策点1经owner确认后触发）

### 2b. WP1/3/4独立计划
**入口**：`wp-plans/` 下 WP1/WP3/WP4 对应 `*-PLAN.md`
- WP1源码深度审查（24-32h，Week 1-2）
- WP3真实任务验证（16-24h，Week 3）
- WP4未覆盖维度补充（10-15h，Week 4）

### 3. 理解当前状态
**入口**：`analysis/CORE-REVIEW-DIMENSIONS-COVERAGE.md`  
- Core审查维度覆盖度分析
- 当前40%覆盖（21/53，v1.3口径，core/05原文八维+v2检查面+超大需求适配），目标52完全+1显式降级（差距矩阵31条闭合）

### 4. Skill精简背景
**入口**：`analysis/SKILL-SIMPLIFICATION-ANALYSIS.md`  
- Skill是否太长？是否符合最佳实践？
- Token成本测量建议

### 5. 项目总结
**入口**：`summary/PROJECT-FINAL-SUMMARY.md`  
- 当前项目完成状态
- Phase 0 + Phase 1成果

---

## 📋 目录规范

### planning/ - 执行计划
**用途**：存放主执行计划和子计划  
**命名**：`[PROJECT-NAME]-PLAN.md` 或 `OPTION-X-PLAN.md`  
**示例**：
- `OPTION-B-FULL-COMPLIANCE-PLAN.md` ⭐ 主计划
- `OPTION-A-MINIMAL-PLAN.md`（如果有）
- `OPTION-C-CUSTOM-PLAN.md`（如果有）

### analysis/ - 分析报告
**用途**：存放分析、对比、评估报告  
**命名**：`[TOPIC]-ANALYSIS.md` 或 `[TOPIC]-COVERAGE.md`  
**示例**：
- `CORE-REVIEW-DIMENSIONS-COVERAGE.md`
- `SKILL-SIMPLIFICATION-ANALYSIS.md`
- `TOKEN-COST-ANALYSIS.md`（未来）

### wp-plans/ - 工作包详细计划
**用途**：存放WP1-WPX的详细执行计划  
**命名**：`WP[N]-[NAME]-PLAN.md`  
**示例**：
- `WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md`
- `WP1-SOURCE-CODE-DEEP-DIVE-PLAN.md`
- `WP3-REAL-TASK-VERIFICATION-PLAN.md`
- `WP4-UNCOVERED-DIMENSIONS-PLAN.md`

### wp-results/ - 工作包执行结果（未来）
**用途**：存放WP执行过程中的产出  
**命名**：`wp[N]-results/`目录  
**示例**：
```
wp1-results/
  spec-work/
    spec-work-source-reading-notes.md
    spec-work-flow-diagram.mermaid
    ...
  spec-code-review/
    ...
  WP1-source-code-deep-dive-summary.md
```

### core/ - 核心方法论（只读）
**用途**：存放项目方法论、标准、验收标准  
**规则**：内容只读，不修改；结构性归档（移出未执行设计）仅经 owner 授权执行并记录于演进记录（2026-11-04 执行一次：5 份 → archive/，现存 12 份）  
**命名**：编号前缀 `00-` 到 `12-`

### execution/ - 执行指令（历史）
**用途**：存放自主执行指令、命令清单  
**状态**：历史文档，已归档  
**规则**：不新增，只参考

### process/ - 流程方法（历史）
**用途**：存放审查流程、迭代模板  
**状态**：历史文档，已归档  
**规则**：不新增，只参考

### summary/ - 总结验证
**用途**：存放项目总结、验证报告、完成清单  
**命名**：`PROJECT-[TYPE]-SUMMARY.md` 或 `[TOPIC]-VERIFICATION.md`  
**示例**：
- `PROJECT-FINAL-SUMMARY.md`
- `REVIEW-TASKS-VERIFICATION.md`
- `WORKFLOW-COMPLETION-STATUS.md`

### reviews/ - 历史审查报告
**用途**：存放已完成的审查报告  
**状态**：历史文档，已归档  
**规则**：不新增，只参考

### phase0-results/ - Phase 0结果
**用途**：存放Phase 0的所有产出  
**状态**：历史文档，已归档  
**规则**：不修改，只参考

### evidence/ - 证据与数据
**用途**：存放原始数据、测试结果、Contract检查等  
**命名**：按类型组织子目录

---

## 🚀 文档创建规范

### 新建执行计划
位置：`planning/`  
命名：`[NAME]-PLAN.md`  
模板：包含目标、投入、时间线、交付物、完成标准

### 新建分析报告
位置：`analysis/`  
命名：`[TOPIC]-ANALYSIS.md`  
模板：包含背景、方法、数据、结论、建议

### 新建WP计划
位置：`wp-plans/`  
命名：`WP[N]-[NAME]-PLAN.md`  
模板：包含目标、任务列表、执行步骤、产出、完成标准

### 新建WP结果
位置：`wp-results/wp[N]-results/`  
命名：按WP计划中定义的产出命名  
规则：每个WP一个子目录

### 新建总结报告
位置：`summary/`  
命名：`[NAME]-SUMMARY.md` 或 `[TOPIC]-VERIFICATION.md`  
模板：包含执行概览、关键发现、数据表、结论、建议

---

## 📝 路径引用规范

### 相对路径
从当前文档所在位置引用其他文档。

**示例**（从`planning/OPTION-B-FULL-COMPLIANCE-PLAN.md`引用）：
```markdown
- **WP5详细计划**：../wp-plans/WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md
- **分析报告**：../analysis/CORE-REVIEW-DIMENSIONS-COVERAGE.md
- **总结**：../summary/PROJECT-FINAL-SUMMARY.md
```

**示例**（从`wp-plans/WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md`引用）：
```markdown
- **主计划**：../planning/OPTION-B-FULL-COMPLIANCE-PLAN.md
- **Core方法**：../core/12-phase05-skill-deep-dive.md
```

### 绝对路径（仅在必要时）
从项目根目录引用：
```markdown
docs/plans/2026-11-03-skill-optimization-initiative/planning/OPTION-B-FULL-COMPLIANCE-PLAN.md
```

---

## 🔄 目录演进记录

### v1.6（2026-11-04）
- Owner 裁定 core/10/11 关注面纳入主动审查：主计划 v3.5 + 覆盖分析 v1.3（分母52→53，差距30→31，WP4 3→4项）+ WP4计划 v1.2（新增任务4.4 超大需求适配质量审查，投入8-12h→10-15h）；总投入 60-86/70-102h，交付物 44-49 个

### v1.5（2026-11-04）
- owner 授权归档 core/ 中 5 份未执行/未采纳的事前设计（09/10/11/DECISION-AUTHORITY/RESOURCE-PLAN）→ `archive/`；core/ 现存 12 份（08 保留：prose 层 Contract 要素仍为 WP1/WP3 基准）
- 同步更新：process/REVIEW-EXECUTION-WORKFLOW.md 第2节 5 处链接；主计划与覆盖分析中「core/10/11」提法加归档注；core/README 目录数与三节导航；core/07 执行台账断链修复（archive/ → ../archive/）
- 新增 analysis/CORE-METHODOLOGY-REVIEW-2026-11-04.md（core 方法论整体评估结论存档）

### v1.4（2026-11-04）
- core/原文核对修补同步：主计划升至 v3.4（定位=REVIEW-EXECUTION-WORKFLOW v2主链路批次）；覆盖口径 47%→40%（v1.2：52项账目，八维按core/05原文重记）；WP计划 WP1/WP3/WP5 升至 v1.2、WP4 升至 v1.1（维度改源 B05/B06/D07）

### v1.3（2026-11-04）
- 多agent方案审查修补同步：主计划引用升至 v3.3；覆盖口径 38%→47%（v1.1计数规则）；WP计划 WP1/WP3/WP5 升至 v1.1；analysis/ 增补 MULTI-AGENT-PLAN-REVIEW-2026-11-04.md

### v1.2（2026-11-04）
- 主计划版本引用同步至 v3.2（WP章节瘦身为概要+指针，wp-plans/为唯一执行真相源）

### v1.1（2026-11-04）
- 主计划版本引用同步至 v3.1；修正"WP1-5均有独立计划"为 WP1/3/4/5
- 目录树补充 archive/ 与 docs/；wp-results 示例命名对齐 WP1计划产出名

### v1.0（2026-11-04）
- 创建规范目录结构
- 移动5个一级文档到对应目录：
  - `OPTION-B-FULL-COMPLIANCE-PLAN.md` → `planning/`
  - `CORE-REVIEW-DIMENSIONS-COVERAGE.md` → `analysis/`
  - `SKILL-SIMPLIFICATION-ANALYSIS.md` → `analysis/`
  - `WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md` → `wp-plans/`
  - `WP5-TOKEN-COST-MEASUREMENT-PLAN.md` → `wp-plans/`（存档）
- 更新所有文档中的路径引用

---

## 📌 快速导航

**我想开始执行**：`planning/OPTION-B-FULL-COMPLIANCE-PLAN.md`  
**我想了解WP5**：`wp-plans/WP5-DELIVERY-QUALITY-ASSESSMENT-PLAN.md`  
**我想看覆盖度**：`analysis/CORE-REVIEW-DIMENSIONS-COVERAGE.md`  
**我想看总结**：`summary/PROJECT-FINAL-SUMMARY.md`  
**我想看方法论**：`core/README.md`

---

**文档版本**：v1.6  
**创建日期**：2026-11-04  
**维护者**：项目执行团队
