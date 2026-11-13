# 文档归档重组方案

**日期**：2026-11-03  
**目的**：将一级目录下的 20+ 个文档合理归档，提升可维护性和可读性

---

## 📋 当前问题

### 问题 1：文档过多，难以导航
- 一级目录下有 20+ 个 Markdown 文件
- 主文档、审查报告、修正文档混在一起
- 新人难以快速找到入口

### 问题 2：文档类型混杂
- 核心方案文档（00-11）
- 审查报告（REVIEW、PLAN-REVIEW 等）
- 元文档（README、CHANGELOG 等）
- 临时文档（CORRECTIONS、ANALYSIS 等）

### 问题 3：缺少层次结构
- 所有文档平铺在一级目录
- 无法体现"主线"和"支线"的区别
- 历史版本和当前版本混杂

---

## 🎯 归档原则

### 原则 1：三层结构
```
根目录/
├── 核心文档（主线，必读）
├── reviews/（审查报告，参考）
└── archive/（已废弃/历史）
```

### 原则 2：保持稳定的入口
```
README.md         → 总入口（不变）
00-*.md           → 核心序号文档（不变）
CHANGELOG.md      → 变更记录（不变）
```

### 原则 3：最小惊讶原则
- 保持关键文档的路径稳定
- 移动时创建软链接（如果必要）
- 更新所有引用

---

## 📁 建议的目录结构

```
2026-11-03-skill-optimization-initiative/
│
├── README.md                          # 总入口（不动）
├── CHANGELOG.md                       # 变更记录（新建）
│
├── 00-goals-and-success-criteria.md  # 核心文档（不动）
├── 01-v4-workflow-driven-approach.md
├── 02-execution-checklist.md
├── 02-execution-quick-reference.md
├── 03-optimization-candidates.md
├── 04-dev-lifecycle-full-analysis.md
├── 05-optimization-dimensions-with-trends.md
├── 06-mainline-baseline.md
├── 07-progress-tracking.md
├── 08-skill-contract-protocol.md
├── 09-implementation-roadmap.md
├── 10-large-requirement-strategy.md
├── 11-large-scale-skill-upgrade.md
│
├── reviews/                           # 审查报告目录（新建）
│   ├── README.md                      # 审查报告索引
│   ├── 01-document-review.md          # ← REVIEW-REPORT.md
│   ├── 02-plan-review.md              # ← PLAN-REVIEW.md
│   ├── 03-plan-optimization.md        # ← PLAN-OPTIMIZATION.md
│   ├── 04-harness-expert-review.md    # ← HARNESS-EXPERT-REVIEW.md
│   ├── 05-completeness-review.md      # ← 12-final-completeness-review.md
│   ├── 06-final-conclusion.md         # ← FINAL-REVIEW-CONCLUSION.md
│   └── corrections/                   # 修正文档子目录
│       ├── corrections-summary.md     # ← CORRECTIONS-SUMMARY.md
│       ├── conclusion-analysis.md     # ← FINAL-REVIEW-CONCLUSION-ANALYSIS.md
│       └── README.md
│
├── evidence/                          # 证据目录（不动）
│   ├── checks.json
│   ├── mainline-contract-tests.log
│   └── source-baseline.json
│
├── phase0-results/                    # Phase 0 结果（不动）
│   └── examples/
│       └── README.md
│
└── archive/                           # 历史归档（已存在）
    ├── README.md
    ├── merged-2026-11-03/
    ├── 02-phase0-execution-guide.md
    ├── 05-goals-and-standards.md
    ├── 07-skill-execution-ledger.md
    ├── QUICK-START.md
    ├── o01-execution-guide.md
    ├── v1-official-practices.md
    └── v2-pragmatic.md
```

---

## 📊 文档分类明细

### 第一类：核心文档（根目录，12 个）

**保持在根目录**：
```
00-goals-and-success-criteria.md       目标与标准
01-v4-workflow-driven-approach.md      v4 方法论
02-execution-checklist.md              执行清单
02-execution-quick-reference.md        快速参考
03-optimization-candidates.md          候选清单
04-dev-lifecycle-full-analysis.md      流程分析
05-optimization-dimensions-with-trends.md  优化维度
06-mainline-baseline.md                主链路基线
07-progress-tracking.md                进度跟踪
08-skill-contract-protocol.md          Contract/Protocol
09-implementation-roadmap.md           实施路线图
10-large-requirement-strategy.md       超大需求策略
11-large-scale-skill-upgrade.md        Skill 升级方案
```

**理由**：
- 这些是主线内容，应该直接可见
- 保持序号连续性（00-11）
- 避免移动后破坏现有引用

---

### 第二类：审查报告（移入 reviews/，7 个）

**移入 reviews/ 并重命名**：
```yaml
移动计划:
  - from: REVIEW-REPORT.md
    to: reviews/01-document-review.md
  
  - from: PLAN-REVIEW.md
    to: reviews/02-plan-review.md
  
  - from: PLAN-OPTIMIZATION.md
    to: reviews/03-plan-optimization.md
  
  - from: HARNESS-EXPERT-REVIEW.md
    to: reviews/04-harness-expert-review.md
  
  - from: 12-final-completeness-review.md
    to: reviews/05-completeness-review.md
  
  - from: FINAL-REVIEW-CONCLUSION.md
    to: reviews/06-final-conclusion.md
  
  - from: MERGE-COMPLETE-REPORT.md
    to: reviews/07-merge-report.md
  
  - from: RENAME-REPORT.md
    to: reviews/08-rename-report.md
```

**理由**：
- 审查报告是"关于方案的"，非方案本身
- 集中管理便于查找
- 序号化便于理解审查顺序

---

### 第三类：修正文档（移入 reviews/corrections/，2 个）

**移入 reviews/corrections/**：
```yaml
移动计划:
  - from: CORRECTIONS-SUMMARY.md
    to: reviews/corrections/corrections-summary.md
  
  - from: FINAL-REVIEW-CONCLUSION-ANALYSIS.md
    to: reviews/corrections/conclusion-analysis.md
```

**理由**：
- 这是审查报告的延伸（修正建议）
- 避免根目录文件过多

---

### 第四类：元文档（根目录，2 个）

**保持在根目录**：
```
README.md         # 总入口（已存在）
CHANGELOG.md      # 变更记录（需新建）
```

---

### 第五类：支持目录（不动，3 个）

**保持原位置**：
```
evidence/         # 证据文件
phase0-results/   # Phase 0 结果
archive/          # 历史归档
```

---

## 🔧 执行步骤

### 步骤 1：创建目录结构（5 分钟）

```bash
cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative

# 创建 reviews 目录和子目录
mkdir -p reviews/corrections

# 创建索引文件
touch reviews/README.md
touch reviews/corrections/README.md
```

---

### 步骤 2：移动审查报告（10 分钟）

```bash
# 移动并重命名审查报告
git mv REVIEW-REPORT.md reviews/01-document-review.md
git mv PLAN-REVIEW.md reviews/02-plan-review.md
git mv PLAN-OPTIMIZATION.md reviews/03-plan-optimization.md
git mv HARNESS-EXPERT-REVIEW.md reviews/04-harness-expert-review.md
git mv 12-final-completeness-review.md reviews/05-completeness-review.md
git mv FINAL-REVIEW-CONCLUSION.md reviews/06-final-conclusion.md
git mv MERGE-COMPLETE-REPORT.md reviews/07-merge-report.md
git mv RENAME-REPORT.md reviews/08-rename-report.md

# 移动修正文档
git mv CORRECTIONS-SUMMARY.md reviews/corrections/corrections-summary.md
git mv FINAL-REVIEW-CONCLUSION-ANALYSIS.md reviews/corrections/conclusion-analysis.md
```

---

### 步骤 3：创建 reviews/README.md（5 分钟）

```markdown
# 审查报告目录

本目录包含对 Skill 优化项目方案的各轮审查报告。

## 📋 审查时间线

1. **01-document-review.md** - 文档逻辑一致性审查（10/10）
2. **02-plan-review.md** - 方案整体审查（8.3/10）
3. **03-plan-optimization.md** - 方案优化建议（ROI +40%）
4. **04-harness-expert-review.md** - Harness 专家视角（9.6/10）
5. **05-completeness-review.md** - 完整性终审（8.7/10）
6. **06-final-conclusion.md** - 最终审查结论（项目负责人视角）
7. **07-merge-report.md** - 文档合并报告
8. **08-rename-report.md** - 文档重命名报告

## 📂 corrections/ 子目录

包含基于审查发现的修正文档：
- corrections-summary.md - 修正总结
- conclusion-analysis.md - 最终结论的批判性分析

## 🎯 关键结论

- 方法论完整性：9.6/10（Harness 专家评价）
- 整体方案：8.3/10（优秀）
- 主要建议：移除假设收益数字，Phase 0 重点是确定基线
```

---

### 步骤 4：更新 README.md（10 分钟）

在根目录 README.md 中增加：
```markdown
## 📂 目录结构

### 核心文档（必读）
- 00-11：主线文档（目标、方法、执行、实施）
- README.md：本文件（项目入口）

### 审查报告（参考）
- reviews/：各轮审查报告和修正建议
- 详见 [reviews/README.md](reviews/README.md)

### 支持目录
- evidence/：证据文件（源码基线、测试记录）
- phase0-results/：Phase 0 执行结果
- archive/：历史文档归档
```

---

### 步骤 5：更新内部引用（15 分钟）

**需要更新引用的文档**：
```bash
# 查找所有引用了被移动文档的文件
grep -r "REVIEW-REPORT.md" *.md
grep -r "PLAN-REVIEW.md" *.md
grep -r "HARNESS-EXPERT-REVIEW.md" *.md
# ... 等等

# 更新引用
# 例如：REVIEW-REPORT.md → reviews/01-document-review.md
```

---

### 步骤 6：创建 CHANGELOG.md（10 分钟）

```markdown
# 变更记录

## 2026-11-03 - 文档重组

### 目录结构变更
- 创建 reviews/ 目录，集中管理审查报告
- 创建 reviews/corrections/ 子目录，存放修正文档
- 保持核心文档（00-11）在根目录

### 移动的文档
- REVIEW-REPORT.md → reviews/01-document-review.md
- PLAN-REVIEW.md → reviews/02-plan-review.md
- PLAN-OPTIMIZATION.md → reviews/03-plan-optimization.md
- HARNESS-EXPERT-REVIEW.md → reviews/04-harness-expert-review.md
- 12-final-completeness-review.md → reviews/05-completeness-review.md
- FINAL-REVIEW-CONCLUSION.md → reviews/06-final-conclusion.md
- MERGE-COMPLETE-REPORT.md → reviews/07-merge-report.md
- RENAME-REPORT.md → reviews/08-rename-report.md
- CORRECTIONS-SUMMARY.md → reviews/corrections/corrections-summary.md
- FINAL-REVIEW-CONCLUSION-ANALYSIS.md → reviews/corrections/conclusion-analysis.md

### 新增的文档
- CHANGELOG.md（本文件）
- reviews/README.md
- reviews/corrections/README.md

### 理由
- 根目录从 20+ 个文件减少到 15 个
- 主线文档清晰可见
- 审查报告集中管理
- 提升项目可维护性
```

---

### 步骤 7：验证完整性（5 分钟）

```bash
# 验证所有文件都正确移动
ls -la reviews/
ls -la reviews/corrections/

# 验证根目录文件数量
ls -la *.md | wc -l  # 应该是 15 个左右

# 验证 Git 状态
git status
```

---

## 📊 重组前后对比

### 重组前（根目录）
```
20+ 个 Markdown 文件混杂
├── 00-11.md（核心文档）
├── REVIEW-*.md（审查报告）
├── PLAN-*.md（方案文档/审查）
├── HARNESS-*.md（审查）
├── FINAL-*.md（结论/分析）
├── CORRECTIONS-*.md（修正）
└── ... 等等

问题：
- 难以区分主线和支线
- 新人不知道从哪里开始
- 文件过多，查找困难
```

### 重组后（分层结构）
```
根目录：15 个文件
├── README.md（入口）
├── CHANGELOG.md（变更记录）
├── 00-11.md（核心文档，12 个）
│
reviews/：10 个文件
├── README.md
├── 01-08.md（审查报告，8 个）
└── corrections/
    ├── README.md
    └── 2 个修正文档

优点：
- 主线清晰（00-11 连续）
- 审查报告集中
- 层次分明
- 易于导航
```

---

## ✅ 完成标准

重组完成后应满足：

1. **根目录清晰**
   - [ ] 只有 15 个左右的 Markdown 文件
   - [ ] 00-11 核心文档连续可见
   - [ ] README.md 和 CHANGELOG.md 在顶部

2. **审查报告集中**
   - [ ] reviews/ 目录包含 8 个审查报告
   - [ ] reviews/corrections/ 包含 2 个修正文档
   - [ ] 都有 README.md 索引

3. **引用完整**
   - [ ] 所有内部引用都已更新
   - [ ] Git 历史保持完整（git mv）
   - [ ] 无损坏的链接

4. **可维护性**
   - [ ] CHANGELOG.md 记录了变更
   - [ ] 新增了必要的 README.md
   - [ ] 目录结构合理

---

## 🎯 预期收益

1. **降低认知负荷**
   - 根目录文件减少 25%
   - 主线文档一目了然

2. **提升可维护性**
   - 审查报告集中管理
   - 历史变更可追溯

3. **改善用户体验**
   - 新人容易找到入口（README → 00-11）
   - 想看审查报告时知道去 reviews/

4. **为未来扩展做准备**
   - Phase 0 执行后，结果放在 phase0-results/
   - Phase 1 执行后，结果可以放在 phase1-results/
   - 新的审查报告放在 reviews/

---

**文档完成日期**：2026-11-03  
**预计执行时间**：1 小时  
**状态**：待执行
