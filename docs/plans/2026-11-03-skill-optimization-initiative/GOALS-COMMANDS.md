# 目标查看命令

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**目的**：快速查看和理解项目目标

---

## 🎯 快速查看所有目标

### 查看完整目标文档

```bash
# 进入项目目录
cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative

# 查看完整目标和成功标准
cat core/00-goals-and-success-criteria.md

# 只看目标部分（前100行）
head -100 core/00-goals-and-success-criteria.md

# 只看执行摘要
head -50 core/00-goals-and-success-criteria.md
```

---

## 📋 提取核心目标

### 主目标

```bash
# 提取主目标
grep -A 5 "## 主目标" core/00-goals-and-success-criteria.md
```

**输出**：
```
## 主目标

评估当前 Skill 体系质量，基于数据决定是否需要优化

**不是**：预设"必须优化"
**而是**：让数据告诉我们该做什么
```

---

### Phase 0 的三大目标

```bash
# 提取 Phase 0 三大目标
grep -A 20 "## Phase 0 的三大目标" core/00-goals-and-success-criteria.md
```

**输出**：
```
## Phase 0 的三大目标

### 目标 1：确定真实基线（最重要）⭐
测量当前 Skill 体系的真实表现

### 目标 2：判断是否需要优化
基于基线数据，决定是否启动 Phase 1

### 目标 3：如果需要，确定优化什么
识别需要优化的 Skill 和具体问题
```

---

### 成功标准

```bash
# 提取 Layer 3 成功标准
grep -A 10 "Layer 3.*端到端" core/00-goals-and-success-criteria.md
```

**输出**：
```
Layer 3: 端到端质量
  - 端到端正确率 >90%
  - 端到端返工率 <10%
  - 用户介入次数 <3 次/任务
```

---

## 🔍 查看具体阶段目标

### Phase -1 目标（试点）

```bash
# 查看 Phase -1 目标
grep -A 10 "Phase -1" core/09-implementation-roadmap.md | head -15
```

**快速查看**：
```bash
echo "Phase -1 目标："
echo "1. 验证追踪方法可行性"
echo "2. 评估数据质量"
echo "3. 决定是否继续 Phase 0"
echo "投入：4 小时"
```

---

### Phase 0 目标（数据收集）

```bash
# 查看 Phase 0 目标
grep -A 15 "## Phase 0" core/09-implementation-roadmap.md | head -20
```

**快速查看**：
```bash
echo "Phase 0 目标："
echo "1. 追踪 11 个真实任务"
echo "2. 确定当前质量基线"
echo "3. 识别高频问题"
echo "4. 归因分析（4 类根因）"
echo "5. 给出数据驱动的建议"
echo "投入：44 小时"
```

---

### Phase 0.5 目标（深度解读）

```bash
# 查看 Phase 0.5 目标
grep -A 15 "## 目标" core/12-phase05-skill-deep-dive.md | head -20
```

**快速查看**：
```bash
echo "Phase 0.5 目标："
echo "1. 验证 Phase 0 归因准确性"
echo "2. 找到真正的根本原因"
echo "3. 设计精准的优化方案"
echo "投入：16-24 小时"
echo "价值：归因准确性 6/10 → 9/10"
```

---

### Phase 1 目标（执行优化）

```bash
# 查看 Phase 1 目标
grep -A 10 "Phase 1" core/09-implementation-roadmap.md | grep -A 5 "目标"
```

**快速查看**：
```bash
echo "Phase 1 目标："
echo "1. 执行 Phase 0.5 设计的优化方案"
echo "2. 改善相对基线 ≥30%"
echo "3. A/B 测试验证效果"
echo "4. 无关键指标下降"
echo "投入：78-140 小时"
```

---

## 📊 4 种退出条件

```bash
# 提取 4 种退出条件
grep -A 30 "4 种退出条件" core/00-goals-and-success-criteria.md
```

**快速查看**：
```bash
cat << 'EXIT'
4 种退出条件（Phase 0 后的决策）：

1. ✅ 质量已达标，无需 Phase 1
   - 返工率 <15%
   - 正确率 >90%
   - 用户介入 <3 次
   → 这也是成功！

2. ✅ 启动 Phase 1 优化 Skill
   - 发现明确问题
   - 归因为 Skill 问题 ≥50%
   - ROI >1
   → 执行优化

3. ⚠️ 调整方向，不优化 Skill
   - 问题不在 Skill
   - 归因为模型能力/外部因素
   → 改进其他方面

4. ❌ 暂停项目
   - 成本 > 收益
   - 或其他原因
   → 输出经验教训
EXIT
```

---

## 🎯 成功的定义

```bash
# 查看成功定义
cat << 'SUCCESS'
什么算成功？

Phase 0 成功 = 确定了基线 + 给出数据驱动的建议
  - 即使建议"不需要优化"也是成功
  - 数据驱动决策本身就是价值

Phase 1 成功 = 相对基线改善 ≥30%
  - 返工率降低 ≥30%
  - 或正确率提升 ≥30%
  - 或用户介入减少 ≥30%
  - 且无关键指标下降

项目成功 = Phase 0 成功 OR (Phase 0 + Phase 1 成功)
  - 不预设必须执行到 Phase 1
  - 不预设必须优化
  - 让数据说话
SUCCESS
```

---

## 📈 量化指标速查

```bash
# 创建指标速查卡
cat << 'METRICS'
=== 核心量化指标 ===

Layer 3（端到端）：
✓ 端到端正确率 >90%
✓ 端到端返工率 <10%
✓ 用户介入次数 <3 次/任务

Phase 0 数据收集：
✓ 追踪任务数：11 个
✓ 模式识别度：≥60%
✓ 归因一致性：≥50%

Phase 1 启动条件（5个全满足）：
✓ 返工率 ≥20%
✓ Skill 问题占比 ≥50%
✓ 影响面 ≥4/11 任务
✓ 预期改善 ≥30%
✓ ROI >1

Phase 1 验收标准：
✓ 相对基线改善 ≥30%
✓ 单元测试通过率 100%
✓ A/B 测试 B 组显著优于 A 组
METRICS
```

---

## 🔄 目标演变历史

```bash
# 查看目标的修正历史
cat << 'HISTORY'
目标演变历史：

v1.0（初始版本）：
❌ 问题：预设必须优化
❌ 问题：假设基线返工率 73%
❌ 问题：承诺绝对改善幅度

v2.0（修正后，当前）：
✅ 修正：Phase 0 目标改为"确定基线"
✅ 修正：不预设必须优化
✅ 修正：承诺相对改善 ≥30%
✅ 修正：4 种退出条件明确

查看详细修正：
cat reviews/corrections/corrections-summary.md
HISTORY
```

---

## 💡 目标理解检查

```bash
# 自我检查：是否理解目标
cat << 'CHECK'
理解检查清单：

[ ] 1. 主目标是"评估质量+数据驱动决策"，不是"必须优化"
[ ] 2. Phase 0 最重要目标是"确定基线"
[ ] 3. "不需要优化"也是成功结果
[ ] 4. 有 4 种退出条件，不只是"启动 Phase 1"
[ ] 5. Phase 1 只有在满足 5 个条件时才启动
[ ] 6. 成功标准是"相对基线改善"，不是绝对数字
[ ] 7. 端到端质量 > 单个 Skill 性能

全部理解 → 可以开始执行
有疑问 → 重新阅读 core/00-goals-and-success-criteria.md
CHECK
```

---

## 🚀 快速启动命令（基于目标）

```bash
# 基于理解的目标，开始执行

# Step 1: 确认理解目标
echo "我理解项目目标是："
echo "1. 评估质量（不是必须优化）✓"
echo "2. 数据驱动决策（不是主观判断）✓"
echo "3. 确定基线（不是假设基线）✓"
echo ""

# Step 2: 启动 Phase -1
echo "准备启动 Phase -1 试点（4小时）"
echo "目标：验证追踪方法可行性"
echo ""
echo "执行命令："
echo "cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative"
echo "cat EXECUTION-COMMANDS.md | grep -A 50 'Phase -1'"
```

---

## 📖 相关文档快速访问

```bash
# 查看所有相关文档
cat << 'DOCS'
目标相关文档：

核心文档：
- core/00-goals-and-success-criteria.md （目标和标准）
- core/09-implementation-roadmap.md （实施路线图）
- core/12-phase05-skill-deep-dive.md （Phase 0.5 目标）

决策文档：
- core/DECISION-RULES.md （量化决策规则）
- core/DECISION-AUTHORITY.md （决策权限）

修正文档：
- reviews/corrections/corrections-summary.md （目标修正）
- reviews/corrections/conclusion-analysis.md （批判性分析）

快速访问：
cat core/00-goals-and-success-criteria.md  # 完整目标
head -100 core/00-goals-and-success-criteria.md  # 快速浏览
grep "目标" core/*.md  # 搜索所有目标
DOCS
```

---

## 🎯 目标可视化

```bash
# 生成目标层次图
cat << 'VISUAL'
目标层次结构：

总目标：评估质量 + 数据驱动决策
    │
    ├─ Phase -1 目标（4h）
    │   └─ 验证方法可行性
    │
    ├─ Phase 0 目标（44h）⭐ 核心
    │   ├─ 目标1: 确定真实基线
    │   ├─ 目标2: 判断是否需要优化
    │   └─ 目标3: 确定优化什么
    │
    ├─ Phase 0.5 目标（16-24h）✨ 新增
    │   ├─ 验证归因准确性
    │   ├─ 深度理解根本原因
    │   └─ 设计精准方案
    │
    └─ Phase 1 目标（78-140h，条件性）
        ├─ 执行优化方案
        ├─ 相对基线改善 ≥30%
        └─ A/B 测试验证

成功标准：
  Layer 3: 端到端正确率 >90%, 返工率 <10%
  Layer 2: 阶段衔接顺畅
  Layer 1: 单个 Skill 符合 Contract

退出条件：4 种（见上文）
VISUAL
```

---

## ⚡ 一键查看所有目标

```bash
# 创建一键查看脚本
cat > view-all-goals.sh << 'SCRIPT'
#!/bin/bash

echo "=========================================="
echo "   Skill 优化项目 - 目标总览"
echo "=========================================="
echo ""

echo "📍 主目标："
echo "评估当前 Skill 体系质量，基于数据决定是否需要优化"
echo ""

echo "🎯 Phase -1 目标（4h）："
echo "• 验证追踪方法可行性"
echo ""

echo "🎯 Phase 0 目标（44h）："
echo "• 确定真实基线（最重要）"
echo "• 判断是否需要优化"
echo "• 确定优化什么"
echo ""

echo "🎯 Phase 0.5 目标（16-24h）："
echo "• 验证 Phase 0 归因准确性"
echo "• 深度理解根本原因"
echo "• 设计精准优化方案"
echo ""

echo "🎯 Phase 1 目标（78-140h，条件性）："
echo "• 执行优化方案"
echo "• 相对基线改善 ≥30%"
echo "• A/B 测试验证"
echo ""

echo "✅ 成功标准："
echo "• 端到端正确率 >90%"
echo "• 端到端返工率 <10%"
echo "• 用户介入 <3 次/任务"
echo ""

echo "🚪 4 种退出条件："
echo "1. 质量已达标（无需 Phase 1）✅"
echo "2. 启动 Phase 1 优化 ✅"
echo "3. 调整方向（不优化 Skill）⚠️"
echo "4. 暂停项目 ❌"
echo ""

echo "=========================================="
echo "详细内容："
echo "cat core/00-goals-and-success-criteria.md"
echo "=========================================="
SCRIPT

chmod +x view-all-goals.sh
./view-all-goals.sh
```

---

## 📝 保存常用命令

```bash
# 添加到 bash 别名
cat >> ~/.bashrc << 'ALIAS'

# Skill 优化项目快捷命令
alias skill-cd='cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative'
alias skill-goals='cat /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/core/00-goals-and-success-criteria.md'
alias skill-status='cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative && ./check-status.sh'
alias skill-help='cat /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/EXECUTION-COMMANDS.md | less'
ALIAS

# 重新加载
source ~/.bashrc

# 使用
# skill-cd      # 快速进入项目目录
# skill-goals   # 快速查看目标
# skill-status  # 快速查看状态
# skill-help    # 快速查看命令帮助
```

---

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**使用说明**：复制命令查看项目目标和成功标准  
**核心文档**：core/00-goals-and-success-criteria.md
