# 文档归档重组方案 V2 - 进一步分层

**日期**：2026-11-03  
**版本**：V2（更彻底的分层）  
**目的**：将核心文档（00-11）也归档到 core/ 目录，实现完全的分层结构

---

## 🎯 V2 目标结构

```
2026-11-03-skill-optimization-initiative/
│
├── README.md                          # 总入口（唯一保留在根目录）
│
├── core/                              # 核心方案文档（新建）
│   ├── README.md                      # 核心文档导航
│   ├── 00-goals-and-success-criteria.md
│   ├── 01-v4-workflow-driven-approach.md
│   ├── 02-execution-checklist.md
│   ├── 02-execution-quick-reference.md
│   ├── 03-optimization-candidates.md
│   ├── 04-dev-lifecycle-full-analysis.md
│   ├── 05-optimization-dimensions-with-trends.md
│   ├── 06-mainline-baseline.md
│   ├── 07-progress-tracking.md
│   ├── 08-skill-contract-protocol.md
│   ├── 09-implementation-roadmap.md
│   ├── 10-large-requirement-strategy.md
│   └── 11-large-scale-skill-upgrade.md
│
├── reviews/                           # 审查报告（已完成）
│   ├── README.md
│   ├── 01-08.md（8 个审查报告）
│   └── corrections/
│       ├── README.md
│       └── 2 个修正文档
│
├── evidence/                          # 证据文件（不动）
├── phase0-results/                    # Phase 0 结果（不动）
├── archive/                           # 历史归档（不动）
│
└── docs/                              # 元文档（新建，可选）
    ├── REORGANIZATION-PLAN.md         # 重组方案 V1
    └── REORGANIZATION-V2.md           # 本文档
```

---

## 📋 V2 变更内容

### 变更 1：创建 core/ 目录

**移动文档**（13 个）：
```bash
00-goals-and-success-criteria.md       → core/00-goals-and-success-criteria.md
01-v4-workflow-driven-approach.md      → core/01-v4-workflow-driven-approach.md
02-execution-checklist.md              → core/02-execution-checklist.md
02-execution-quick-reference.md        → core/02-execution-quick-reference.md
03-optimization-candidates.md          → core/03-optimization-candidates.md
04-dev-lifecycle-full-analysis.md      → core/04-dev-lifecycle-full-analysis.md
05-optimization-dimensions-with-trends.md → core/05-optimization-dimensions-with-trends.md
06-mainline-baseline.md                → core/06-mainline-baseline.md
07-progress-tracking.md                → core/07-progress-tracking.md
08-skill-contract-protocol.md          → core/08-skill-contract-protocol.md
09-implementation-roadmap.md           → core/09-implementation-roadmap.md
10-large-requirement-strategy.md       → core/10-large-requirement-strategy.md
11-large-scale-skill-upgrade.md        → core/11-large-scale-skill-upgrade.md
```

---

### 变更 2：创建 core/README.md（导航文档）

**内容结构**：
```markdown
# 核心方案文档

本目录包含 Skill 优化项目的核心方案文档。

## 📚 阅读顺序（建议）

### 第一步：理解目标和方法论（30 分钟）
1. **00-goals-and-success-criteria.md** - 项目目标和成功标准
2. **01-v4-workflow-driven-approach.md** - v4 方法论

### 第二步：执行准备（15 分钟）
3. **02-execution-quick-reference.md** - 快速参考卡（5 分钟上手）
4. **02-execution-checklist.md** - 完整执行清单

### 第三步：理解分析框架（30 分钟）
5. **03-optimization-candidates.md** - 优化候选清单
6. **04-dev-lifecycle-full-analysis.md** - 研发流程分析
7. **05-optimization-dimensions-with-trends.md** - 8 大优化维度

### 第四步：基线和进度（15 分钟）
8. **06-mainline-baseline.md** - 主链路基线
9. **07-progress-tracking.md** - 进度跟踪

### 第五步：核心实施方案（60 分钟）
10. **08-skill-contract-protocol.md** - Skill Contract 和 Protocol 定义（P0 关键）
11. **09-implementation-roadmap.md** - 完整实施路线图（11 周计划）

### 第六步：高级扩展（可选，90 分钟）
12. **10-large-requirement-strategy.md** - 超大需求处理策略
13. **11-large-scale-skill-upgrade.md** - 业界最佳实践对标与升级方案

## 🚀 快速启动路径

**如果只有 30 分钟**：
- 读 00（目标）
- 读 02-quick-reference（快速参考）
- 读 09（实施路线图）

**如果有 2 小时**：
- 按顺序读 00-09（核心 10 个文档）

**完整理解（4 小时）**：
- 读完所有 13 个文档
```

---

### 变更 3：简化根目录

**根目录只保留**：
```
README.md                  # 总入口（唯一必读）
```

**可选保留**（元文档，1-2 个）：
```
CHANGELOG.md               # 变更记录（如果创建）
```

---

## 🔧 执行步骤（V2）

### 步骤 1：创建 core/ 目录（1 分钟）

```bash
cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative
mkdir -p core
```

---

### 步骤 2：移动核心文档（5 分钟）

```bash
# 移动所有核心文档到 core/
git mv 00-goals-and-success-criteria.md core/
git mv 01-v4-workflow-driven-approach.md core/
git mv 02-execution-checklist.md core/
git mv 02-execution-quick-reference.md core/
git mv 03-optimization-candidates.md core/
git mv 04-dev-lifecycle-full-analysis.md core/
git mv 05-optimization-dimensions-with-trends.md core/
git mv 06-mainline-baseline.md core/
git mv 07-progress-tracking.md core/
git mv 08-skill-contract-protocol.md core/
git mv 09-implementation-roadmap.md core/
git mv 10-large-requirement-strategy.md core/
git mv 11-large-scale-skill-upgrade.md core/
```

---

### 步骤 3：创建 core/README.md（10 分钟）

见上方"变更 2"的内容

---

### 步骤 4：更新根目录 README.md（10 分钟）

```markdown
# Skill 优化项目 - 数据驱动的 Skill 体系改进

**项目目标**：评估当前 Skill 体系质量，基于数据决定是否需要优化

---

## 🚀 快速开始

### 新人入口（3 步）

1. **理解目标**（5 分钟）
   - 读 [core/00-goals-and-success-criteria.md](core/00-goals-and-success-criteria.md)

2. **快速上手**（5 分钟）
   - 读 [core/02-execution-quick-reference.md](core/02-execution-quick-reference.md)

3. **开始执行**
   - Phase -1（试点验证）：4 小时
   - Phase 0（数据收集）：44 小时
   - Phase 1（优化实施）：基于 Phase 0 结果决定

---

## 📂 目录结构

### [core/](core/) - 核心方案文档
13 个核心文档（00-11 序号文档 + 快速参考）

**必读文档**：
- 00：项目目标和成功标准
- 02-quick-reference：快速参考卡
- 08：Skill Contract 和 Protocol 定义（P0 关键）
- 09：完整实施路线图

**详细导航**：见 [core/README.md](core/README.md)

---

### [reviews/](reviews/) - 审查报告
8 轮审查报告 + 修正建议

**核心结论**：
- 方法论评分：9.6/10（Harness 最佳实践）
- 整体评分：8.3/10（优秀，已修正假设收益问题）
- 可启动状态：是

**详细审查**：见 [reviews/README.md](reviews/README.md)

---

### 其他目录
- evidence/：证据文件（源码基线、测试记录）
- phase0-results/：Phase 0 执行结果（待生成）
- archive/：历史文档归档

---

## 🎯 关键原则（修正后）

1. **Phase 0 真正目标**：
   - ✅ 确定真实基线（最重要）
   - ✅ 判断是否需要优化
   - ✅ 如果需要，优化什么

2. **成功定义**：
   - ✅ 发现"不需要优化"也是成功
   - ✅ 数据驱动决策 > 预设方向

3. **收益评估**：
   - ✅ 相对改善 ≥30%（相对基线）
   - ❌ 不承诺绝对数字（基线未知）

---

## 📊 项目状态

- **方案完成度**：100%（18+ 个文档）
- **审查完成度**：100%（8 轮审查）
- **修正完成度**：80%（核心概念已修正，部分文档待更新）
- **可启动状态**：✅ 是

---

## 📞 需要帮助？

1. **快速问题**：先看 [core/02-execution-quick-reference.md](core/02-execution-quick-reference.md)
2. **方法论问题**：看 [core/01-v4-workflow-driven-approach.md](core/01-v4-workflow-driven-approach.md)
3. **审查结论**：看 [reviews/README.md](reviews/README.md)

---

**最后更新**：2026-11-03  
**文档版本**：V2（核心文档归档到 core/）  
**总体评分**：8.3/10（优秀）
```

---

### 步骤 5：可选 - 移动元文档到 docs/（5 分钟）

```bash
# 如果想进一步清理，可以把元文档也归档
mkdir -p docs
git mv REORGANIZATION-PLAN.md docs/
git mv REORGANIZATION-V2.md docs/

# 创建 docs/README.md
echo "# 元文档

本目录包含项目管理和重组相关的元文档。

- REORGANIZATION-PLAN.md：V1 重组方案（reviews/ 目录）
- REORGANIZATION-V2.md：V2 重组方案（core/ 目录）
" > docs/README.md
```

---

## 📊 V1 vs V2 对比

### V1 结构（当前）
```
根目录/（15 个文件）
├── README.md
├── 00-11.md（13 个核心文档）
├── REORGANIZATION-PLAN.md
│
reviews/（9 个文件）
├── 01-08.md（8 个审查报告）
└── corrections/（3 个文件）
```

**问题**：
- 根目录仍有 15 个文件（略多）
- 核心文档和元文档混杂

---

### V2 结构（建议）
```
根目录/（1 个文件）
├── README.md（唯一入口）
│
core/（14 个文件）
├── README.md（导航）
└── 00-11.md（13 个核心文档）
│
reviews/（9 个文件）
├── README.md
├── 01-08.md（8 个审查报告）
└── corrections/（3 个文件）
│
docs/（可选，3 个文件）
├── README.md
└── 2 个重组方案
```

**优点**：
- ✅ 根目录极简（1 个文件）
- ✅ 完全的分层结构
- ✅ 清晰的职责分离
- ✅ 易于扩展（Phase 0/1 结果有独立目录）

---

## ✅ V2 优势

### 1. 根目录极简
- 只有 1 个 README.md
- 一眼看清项目结构
- 降低新人困惑

### 2. 逻辑清晰
```
core/       → 方案本身（怎么做）
reviews/    → 方案评审（做得如何）
evidence/   → 证据文件（依据是什么）
phase0-results/ → 执行结果（Phase 0）
archive/    → 历史归档（过去的版本）
docs/       → 元文档（关于项目的文档）
```

### 3. 可扩展性好
```
未来可以增加：
phase1-results/  → Phase 1 执行结果
phase2-results/  → Phase 2（如果有）
experiments/     → 实验性方案
```

### 4. 符合最佳实践
- 类似 monorepo 结构（packages/ 类似 core/）
- 类似软件项目（src/ 类似 core/，tests/ 类似 reviews/）
- 职责单一，易于维护

---

## 🤔 是否应该执行 V2？

### 赞成（推荐）

**理由 1**：根目录更清爽
- 1 个文件 vs 15 个文件
- 减少 93% 的文件数量

**理由 2**：结构更合理
- core/ 是主线（方案本身）
- reviews/ 是支线（对方案的评审）
- 职责清晰

**理由 3**：为未来做准备
- Phase 0/1 执行后，有清晰的结果目录
- 不会和方案文档混杂

---

### 反对

**理由 1**：多了一层目录
- 访问核心文档需要进入 core/
- 路径变长（但只多一层）

**理由 2**：引用需要更新
- 内部引用路径需要更新
- 外部引用（如果有）需要更新

---

### 建议

**推荐执行 V2**，因为：
1. 长期收益 > 短期成本
2. 现在是最佳时机（项目刚完成，尚未广泛引用）
3. 提升可维护性和可读性

---

## 🚀 执行决策

**选择 1**：执行 V2（推荐）
- 时间：30 分钟
- 收益：根目录极简，结构清晰
- 成本：需要更新内部引用

**选择 2**：保持 V1
- 时间：0
- 收益：无需改动
- 成本：根目录仍有 15 个文件

**选择 3**：折衷方案
- 只移动部分核心文档（如 10-11 扩展文档）
- 保留 00-09 在根目录
- 折衷效果

---

**文档完成日期**：2026-11-03  
**状态**：方案设计完成，待决策  
**建议**：执行 V2，时间 30 分钟
