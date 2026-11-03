# 执行命令手册

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**目的**：提供可直接复制执行的命令，快速启动项目

---

## 🚀 快速启动（5分钟）

### 1. 进入项目目录

```bash
# 进入项目根目录
cd /Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative

# 验证位置
pwd
# 预期输出：/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative

# 查看文档结构
ls -la
```

---

### 2. 阅读核心文档（3分钟）

```bash
# 阅读项目概述
cat README.md | head -50

# 阅读快速开始指南
cat HOW-TO-START-REVIEW.md | head -50

# 阅读执行清单
cat core/02-execution-quick-reference.md
```

---

### 3. 检查环境准备

```bash
# 检查 Git
git --version
# 预期输出：git version 2.x.x

# 检查 GitHub CLI（如果使用 GitHub）
gh --version
# 预期输出：gh version 2.x.x

# 检查 Python（用于自动化脚本）
python3 --version
# 预期输出：Python 3.x.x

# 检查 YAML 工具（可选）
yamllint --version || echo "yamllint 未安装，可选工具"
```

---

## 📋 Phase -1：试点验证（4小时）

### Step 1: 准备工作目录（5分钟）

```bash
# 创建工作目录
mkdir -p phase0-results/task-flow-traces
mkdir -p phase0-results/decisions

# 验证目录
ls -la phase0-results/
```

---

### Step 2: 选择试点任务（30分钟）

```bash
# 查看最近的 Git 历史
git log --since="2 months ago" --oneline --all | head -30

# 查看最近的 PR（GitHub）
gh pr list --state merged --limit 30

# 查看最近的 PR（GitLab）
glab mr list --merged --per-page 30

# 查看最近的分支
git branch -a --sort=-committerdate | head -20
```

**选择标准**：
- 完整的任务（有明确开始和结束）
- 中等复杂度（不要太简单或太复杂）
- 有 Git 历史和 PR 记录

**记录选择**：
```bash
# 创建任务选择记录
cat > phase0-results/pilot-task-selection.md << 'PILOT'
# Phase -1 试点任务选择

## 选择的任务
- 任务描述：[填写]
- PR 链接：[填写]
- 完成日期：[填写]
- 选择理由：[填写]

## 预期验证点
1. 能否从 Git 历史重建任务流程？
2. 能否识别 Skill 使用情况？
3. 能否记录阻力点？
4. 追踪耗时是否在 4 小时内？
PILOT
```

---

### Step 3: 执行试点追踪（2-3小时）

```bash
# 复制追踪模板
cp phase0-results/examples/task-trace-example-good.yaml \
   phase0-results/task-flow-traces/pilot-task-01.yaml

# 用编辑器打开
code phase0-results/task-flow-traces/pilot-task-01.yaml
# 或
vim phase0-results/task-flow-traces/pilot-task-01.yaml
```

**追踪过程中的命令**：

```bash
# 查看任务相关的提交
git log --oneline --grep="[任务关键词]" --since="2 months ago"

# 查看特定 PR 的详细信息
gh pr view [PR号] --comments

# 查看提交的详细变更
git show [commit-hash]

# 查看文件的修改历史
git log --follow -p -- [文件路径]

# 查看 PR 的讨论
gh pr view [PR号] --json comments --jq '.comments[] | {author: .author.login, body: .body}'
```

---

### Step 4: 评估可行性（30分钟）

```bash
# 创建评估报告
cat > phase0-results/phase-1-pilot-report.md << 'REPORT'
# Phase -1 试点评估报告

**执行者**：[姓名]
**执行日期**：[YYYY-MM-DD]
**实际耗时**：[X] 小时

## 可行性评估

### 1. 追踪方法可行性
- [ ] ✅ 可行 / [ ] ⚠️ 需要调整 / [ ] ❌ 不可行
- 理由：[填写]

### 2. 数据质量
- 追溯到的关键节点：[X]%
- 数据完整度：[好/中/差]
- 理由：[填写]

### 3. 时间投入
- 计划：4 小时
- 实际：[X] 小时
- Phase 0 (11个任务) 预估：[X] 小时

### 4. 发现的问题
1. [问题1]
2. [问题2]

### 5. 建议的调整
1. [调整1]
2. [调整2]

## 决策

- [ ] ✅ 继续 Phase 0（方法可行）
- [ ] ⚠️ 调整后继续（需要改进方法）
- [ ] ❌ 暂停项目（方法不可行）

**签字**：[执行者] - [日期]
REPORT

# 用编辑器打开填写
code phase0-results/phase-1-pilot-report.md
```

---

### Step 5: 提交评估报告

```bash
# 添加到 Git
git add phase0-results/

# 提交
git commit -m "完成 Phase -1 试点验证

- 追踪任务：[任务描述]
- 实际耗时：[X]h
- 可行性：[可行/需调整/不可行]
- 主要发现：[简述]"

# 推送（可选）
git push origin [your-branch]
```

---

## 📊 Phase 0：数据收集（44小时）

### 前置条件检查

```bash
# 确认 Phase -1 通过
if [ -f "phase0-results/phase-1-pilot-report.md" ]; then
    echo "✅ Phase -1 报告存在"
    grep "继续 Phase 0" phase0-results/phase-1-pilot-report.md && \
        echo "✅ 可以启动 Phase 0" || \
        echo "❌ Phase -1 未通过，不能启动 Phase 0"
else
    echo "❌ 请先完成 Phase -1"
fi
```

---

### Step 1: 准备 Phase 0（1小时）

```bash
# 安装必要工具
./scripts/setup-phase0-tools.sh

# 如果脚本不存在，手动安装
# macOS
brew install gh yamllint

# Ubuntu/Debian
sudo apt-get install gh yamllint

# 验证安装
gh --version
yamllint --version
```

---

### Step 2: 选择 11 个任务（2小时）

```bash
# 创建任务选择记录
cat > phase0-results/task-selection.md << 'TASKS'
# Phase 0 任务选择记录

## 选择标准
- 时间范围：最近 1-2 个月
- 任务类型分布：
  - 小功能开发：3 个
  - 跨模块需求：2 个
  - 缺陷修复：2 个
  - PR 反馈处理：2 个
  - 跨会话续做：2 个

## 选择的任务

### 任务 1: [简述]
- PR: [链接]
- 完成日期: [YYYY-MM-DD]
- 类型: 小功能开发
- 选择理由: [填写]

### 任务 2: [简述]
...

### 任务 11: [简述]
...
TASKS

# 打开编辑
code phase0-results/task-selection.md

# 使用 Git/PR 命令辅助选择
# 按日期查看任务
git log --since="2 months ago" --pretty=format:"%h - %s (%cr)" --no-merges | head -50

# 按 PR 查看
gh pr list --state merged --limit 50 --json number,title,mergedAt,url

# 导出到文件方便查看
gh pr list --state merged --limit 50 --json number,title,mergedAt,url > phase0-results/recent-prs.json
```

---

### Step 3: 追踪任务（36小时，核心工作）

#### 3.1 批量创建追踪文件

```bash
# 创建 11 个追踪文件
for i in {01..11}; do
    cp phase0-results/examples/task-trace-example-good.yaml \
       phase0-results/task-flow-traces/task-$i.yaml
    echo "创建 task-$i.yaml"
done

# 验证
ls -la phase0-results/task-flow-traces/
# 应该看到 task-01.yaml 到 task-11.yaml
```

---

#### 3.2 追踪单个任务（3-4小时/任务）

**任务 1 示例**：

```bash
# === 回顾性追踪（历史任务）===

# 1. 找到任务相关的 PR
gh pr view [PR号] --json number,title,body,mergedAt,url

# 2. 查看 PR 的所有提交
gh pr view [PR号] --json commits --jq '.commits[] | {sha: .oid, message: .messageHeadline}'

# 3. 查看 PR 讨论（识别阻力点）
gh pr view [PR号] --json comments --jq '.commits[] | {sha: .oid, message: .messageHeadline}'

# 4. 查看具体提交的变更
git show [commit-hash] --stat
git show [commit-hash] -- [特定文件]

# 5. 识别返工（查找修复提交）
git log --oneline --grep="fix" --grep="修复" [PR的分支范围]

# 6. 打开追踪文件填写
code phase0-results/task-flow-traces/task-01.yaml

# 7. 验证 YAML 格式
yamllint phase0-results/task-flow-traces/task-01.yaml
```

---

#### 3.3 追踪进度记录

```bash
# 创建进度跟踪文件
cat > phase0-results/PROGRESS.md << 'PROGRESS'
# Phase 0 追踪进度

**开始日期**：[YYYY-MM-DD]
**预计完成**：[YYYY-MM-DD]

## 进度概览
- [ ] task-01: [任务简述]
- [ ] task-02: [任务简述]
- [ ] task-03: [任务简述]
- [ ] task-04: [任务简述]
- [ ] task-05: [任务简述]
- [ ] task-06: [任务简述]
- [ ] task-07: [任务简述]
- [ ] task-08: [任务简述]
- [ ] task-09: [任务简述]
- [ ] task-10: [任务简述]
- [ ] task-11: [任务简述]

## 当前状态
**已完成**：[X]/11
**当前任务**：task-[X]
**预计剩余时间**：[X]h

## 初步发现（持续更新）
- 高频问题1：[描述] - 出现在 [X] 个任务
- 高频问题2：[描述] - 出现在 [X] 个任务

## 下一步
- [ ] 完成 task-[X]
- [ ] 开始 task-[X+1]
PROGRESS

# 每完成一个任务就更新
code phase0-results/PROGRESS.md
```

---

#### 3.4 中期检查（Week 1 结束）

```bash
# Week 1 结束后（完成 5-8 个任务）
cat > phase0-results/week1-checkpoint.md << 'WEEK1'
# Week 1 中期检查

**日期**：[YYYY-MM-DD]
**已完成任务**：[X]/11

## 模式识别度
- 重复出现的问题：[X] 个
- 重复率：[X]%
- 评估：✅ ≥60% / ⚠️ 40-60% / ❌ <40%

## 归因一致性
- 主要归因类别：[Skill问题/模型能力/外部因素/工具链]
- 占比：[X]%
- 评估：✅ ≥50% / ⚠️ 40-50% / ❌ <40%

## 决策
- [ ] ✅ 继续（模式明确）
- [ ] ⚠️ 扩大样本（需要更多数据）
- [ ] ❌ 停止（无明确模式）

**签字**：[执行者] - [日期]
WEEK1

code phase0-results/week1-checkpoint.md
```

---

### Step 4: 数据分析（6小时）

#### 4.1 运行分析脚本

```bash
# 统计分析
python3 scripts/analyze-phase0.py phase0-results/task-flow-traces/

# 如果脚本不存在，手动统计
# 统计返工率
grep -r "correct: false" phase0-results/task-flow-traces/ | wc -l

# 统计阻力点
grep -r "friction_points:" phase0-results/task-flow-traces/ -A 5

# 导出统计结果
python3 scripts/analyze-phase0.py phase0-results/task-flow-traces/ \
    > phase0-results/phase0-statistics.txt
```

---

#### 4.2 Contract/Protocol 检查

```bash
# 验证 Contract 合规性
for file in phase0-results/task-flow-traces/task-*.yaml; do
    echo "验证 $file"
    python3 scripts/validate-contract.py "$file"
done

# 汇总结果
python3 scripts/validate-contract.py phase0-results/task-flow-traces/*.yaml \
    > phase0-results/contract-check-results.txt
```

---

#### 4.3 生成图表（可选）

```bash
# 如果有 matplotlib
python3 << 'PLOT'
import matplotlib.pyplot as plt
import yaml

# 读取数据（示例）
# ...生成图表代码...

plt.savefig('phase0-results/charts/rework-rate.png')
PLOT
```

---

### Step 5: 撰写 Phase 0 报告（4小时）

```bash
# 复制报告模板
cp phase0-results/REPORT-TEMPLATE.md \
   phase0-results/phase0-final-report.md

# 打开编辑
code phase0-results/phase0-final-report.md

# 填写报告的同时，运行验证
# 验证数据一致性
python3 scripts/validate-phase0-report.py phase0-results/phase0-final-report.md

# 检查报告完整性
grep -c "\\[ \\]" phase0-results/phase0-final-report.md
# 如果输出 >0，说明有未完成的检查清单项
```

---

### Step 6: 提交 Phase 0 成果

```bash
# 添加所有 Phase 0 文件
git add phase0-results/

# 提交
git commit -m "完成 Phase 0 数据收集与分析

- 追踪任务数：11
- 端到端返工率：[X]%
- 主要问题：[简述Top 3]
- 归因：Skill问题 [X]%, 模型能力 [X]%, 外部因素 [X]%, 工具链 [X]%
- 决策建议：[启动Phase1 / 质量已达标 / 调整方向 / 暂停]

详见：phase0-results/phase0-final-report.md"

# 推送
git push origin [your-branch]
```

---

## 🔍 Phase 0.5：Skill 深度解读（16-24小时）

### 前置条件

```bash
# 确认 Phase 0 建议启动 Phase 1
grep "启动 Phase 1" phase0-results/phase0-final-report.md && \
    echo "✅ 需要启动 Phase 0.5" || \
    echo "❌ 不需要 Phase 0.5"

# 确定需要深度解读的 Skill
cat > phase0-results/phase05-skill-list.md << 'SKILLS'
# Phase 0.5 深度解读 Skill 清单

根据 Phase 0 发现，需要深度解读以下 Skill：

## Skill 1: [名称]
- 高频问题：[描述]
- 出现频率：[X]/11 任务
- Phase 0 归因：[类别]

## Skill 2: [名称]
- ...

## Skill 3: [名称（如果有）]
- ...
SKILLS

code phase0-results/phase05-skill-list.md
```

---

### Step 1: 获取 Skill 源码

```bash
# 假设 Skill 在项目中
# 查找 Skill 位置
find . -name "*skill*" -type d

# 或从文档查找
grep -r "skill 源码位置" core/06-mainline-baseline.md

# 如果是独立仓库
git clone [skill-repo-url] phase0-results/skills-source/

# 进入 Skill 目录
cd phase0-results/skills-source/[skill-name]

# 查看文件结构
tree -L 3
# 或
ls -la
```

---

### Step 2: 深度解读 Skill 1（8小时）

```bash
# 创建分析文档
mkdir -p phase0-results/phase05-analysis
cat > phase0-results/phase05-analysis/skill-1-analysis.md << 'SKILL1'
# Skill 1 深度分析报告

**Skill 名称**：[名称]
**分析者**：[姓名]
**分析日期**：[YYYY-MM-DD]
**耗时**：[X] 小时

---

## Step 1: 源码全面阅读（4h）

### 文件结构
[列出主要文件]

### 主要逻辑流程
[绘制流程图或描述]

### 关键代码段
[列出与 Phase 0 问题相关的代码]

---

## Step 2: 设计意图理解（2h）

### 为什么这样设计？
[分析]

### 设计权衡
[列出]

### Contract vs 实现
[对比]

---

## Step 3: 问题根因深挖（2h）

### 问题1: [Phase 0 发现]
- 根本原因：[分析]
- 相关代码：[位置]

### Phase 0 归因验证
- Phase 0 归因：[描述]
- 验证结果：✅ 准确 / ⚠️ 需修正 / ❌ 错误
- 修正后归因：[如果需要]

---

## Step 4: 优化方案设计（2h）

### 方案 A: [名称]
- 描述：[详细]
- 改动：[具体代码改动]
- 预期效果：[量化]
- 投入：[X]h
- 风险：[评估]

### 推荐方案
[选择并说明]

---

**完成签字**：[分析者] - [日期]
SKILL1

code phase0-results/phase05-analysis/skill-1-analysis.md
```

**阅读源码的命令**：

```bash
# 在 Skill 源码目录中

# 查看主文件
cat [main_file.py] | less

# 统计代码行数
wc -l *.py

# 搜索关键函数
grep -rn "def " . | grep -v "__pycache__"

# 查看函数调用关系（需要工具）
# 可以用 VSCode 的 "Go to Definition" 功能

# 查看 Git 历史（理解设计演变）
git log --oneline --all | head -20
git log -p [file_path] | less
```

---

### Step 3: 重复 Skill 2 和 Skill 3

```bash
# 复制模板
cp phase0-results/phase05-analysis/skill-1-analysis.md \
   phase0-results/phase05-analysis/skill-2-analysis.md

# 编辑
code phase0-results/phase05-analysis/skill-2-analysis.md

# 对于 Skill 3（如果有）
cp phase0-results/phase05-analysis/skill-1-analysis.md \
   phase0-results/phase05-analysis/skill-3-analysis.md
code phase0-results/phase05-analysis/skill-3-analysis.md
```

---

### Step 4: 撰写 Phase 0.5 汇总报告（2小时）

```bash
# 创建汇总报告
cat > phase0-results/phase05-summary-report.md << 'PHASE05'
# Phase 0.5 深度解读汇总报告

**执行者**：[姓名]
**执行时间**：[开始] 至 [结束]
**实际投入**：[X] 小时

---

## 执行摘要

### 深度解读的 Skill
1. [Skill 1]（[X]h）
2. [Skill 2]（[X]h）
3. [Skill 3]（[X]h，如果有）

### 核心发现
[列出 Top 3]

### 归因修正
- Phase 0 归因准确率：[X]%
- 需要修正的归因：[列出]

---

## Phase 1 执行计划

### 优先级排序
1. [优化项1]（P0，[X]h）
2. [优化项2]（P1，[X]h）
3. ...

### 总投入估算
- 最小：[X]h（只做 P0）
- 标准：[X]h（P0 + P1）
- 最大：[X]h（全部）

---

## 决策建议

基于 Phase 0.5 深度分析：
- [ ] ✅ 强烈推荐启动 Phase 1
- [ ] ⚠️ 有条件推荐（条件：[列出]）
- [ ] ❌ 不推荐启动（理由：[说明]）

---

**签字**：[执行者] - [日期]
**审查**：[技术负责人] - [日期]
PHASE05

code phase0-results/phase05-summary-report.md
```

---

### Step 5: 提交 Phase 0.5 成果

```bash
# 添加文件
git add phase0-results/phase05-analysis/
git add phase0-results/phase05-summary-report.md

# 提交
git commit -m "完成 Phase 0.5 Skill 深度解读

- 深度解读 Skill：[列出]
- 归因验证：[X] 个归因修正
- Phase 1 方案：[简述]
- 决策建议：[启动/有条件/不启动]

详见：phase0-results/phase05-summary-report.md"

# 推送
git push origin [your-branch]
```

---

## 🚀 Phase 1：执行优化（78-140小时）

### 前置条件

```bash
# 确认 Phase 0.5 批准启动 Phase 1
grep "推荐启动 Phase 1" phase0-results/phase05-summary-report.md && \
    echo "✅ 可以启动 Phase 1" || \
    echo "❌ Phase 0.5 未批准启动 Phase 1"

# 技术负责人和 CTO 签字确认
grep "审查.*签字" phase0-results/phase05-summary-report.md || \
    echo "⚠️ 需要技术负责人审查签字"
```

---

### Step 1: 准备 Phase 1（1周）

```bash
# 创建 Phase 1 工作目录
mkdir -p phase1-results/optimizations
mkdir -p phase1-results/tests
mkdir -p phase1-results/ab-comparison

# 确定执行者和资源
cat > phase1-results/phase1-execution-plan.md << 'PLAN'
# Phase 1 执行计划

## 资源配置
- Skill 优化：[执行者姓名]
- 时间安排：[开始日期] 至 [结束日期]
- 每日投入：[X] 小时

## 优化项清单（来自 Phase 0.5）
1. [优化项1]（P0，[X]h）
2. [优化项2]（P1，[X]h）
3. ...

## 周计划
- Week 1: [任务]
- Week 2: [任务]
- ...

## 验收标准
- [ ] 单元测试通过
- [ ] A/B 测试改善 ≥30%
- [ ] 无关键指标下降
PLAN

code phase1-results/phase1-execution-plan.md
```

---

### Step 2: 执行优化（具体根据 Phase 0.5 方案）

```bash
# 这里的命令取决于具体的优化方案
# 示例：修复 spec-prd 边界条件问题

# 1. 创建特性分支
git checkout -b phase1-fix-spec-prd-boundaries

# 2. 修改代码（根据 Phase 0.5 设计）
# 在IDE中编辑源码

# 3. 运行测试
pytest tests/test_spec_prd.py -v

# 4. 提交变更
git add .
git commit -m "fix(spec-prd): 修复边界条件缺失问题

根据 Phase 0.5 分析，调用 analyze_boundaries()
预期效果：边界条件缺失率从 55% 降到 <10%

相关文档：phase0-results/phase05-analysis/skill-1-analysis.md"

# 5. 推送
git push origin phase1-fix-spec-prd-boundaries
```

---

### Step 3: A/B 测试（2-4周）

```bash
# 选择测试任务
cat > phase1-results/ab-test-tasks.md << 'ABTEST'
# A/B 测试任务清单

## 测试任务（5-10个）
1. [任务描述]
2. [任务描述]
...

## 对比维度
- 边界条件完整性
- 返工率
- 端到端正确率
- 用户介入次数

## 测试方法
- A 组：使用原 Skill
- B 组：使用优化后 Skill
ABTEST

# 执行 A/B 测试（需要人工或自动化）
# 记录结果
cat > phase1-results/ab-test-results.md << 'RESULTS'
# A/B 测试结果

## 任务 1
- A 组（原Skill）：[结果]
- B 组（优化后）：[结果]
- 改善：[X]%

## 任务 2
...

## 汇总
- 平均改善：[X]%
- 达标情况：✅ ≥30% / ❌ <30%
RESULTS

code phase1-results/ab-test-results.md
```

---

### Step 4: 提交 Phase 1 成果

```bash
# 最终提交
git add phase1-results/
git commit -m "完成 Phase 1 Skill 优化

- 优化 Skill：[列出]
- 主要改进：[简述]
- A/B 测试结果：改善 [X]%
- 验收状态：✅ 通过 / ⚠️ 部分通过

详见：phase1-results/phase1-final-report.md"

git push origin phase1-fix-spec-prd-boundaries

# 创建 PR
gh pr create \
    --title "Phase 1: Skill 优化" \
    --body "$(cat phase1-results/phase1-final-report.md)" \
    --base main
```

---

## 🔧 辅助命令和工具

### 检查项目状态

```bash
# 检查当前阶段
cat > check-status.sh << 'STATUS'
#!/bin/bash
echo "=== 项目状态检查 ==="
echo ""

if [ -f "phase0-results/phase-1-pilot-report.md" ]; then
    echo "✅ Phase -1 已完成"
else
    echo "❌ Phase -1 未完成"
fi

if [ -f "phase0-results/phase0-final-report.md" ]; then
    echo "✅ Phase 0 已完成"
else
    echo "⏳ Phase 0 进行中或未开始"
fi

if [ -f "phase0-results/phase05-summary-report.md" ]; then
    echo "✅ Phase 0.5 已完成"
else
    echo "⏳ Phase 0.5 进行中或未开始"
fi

if [ -d "phase1-results" ]; then
    echo "✅ Phase 1 已开始"
else
    echo "⏳ Phase 1 未开始"
fi

echo ""
echo "=== Git 状态 ==="
git status --short
STATUS

chmod +x check-status.sh
./check-status.sh
```

---

### 一键生成统计报告

```bash
# 创建统计脚本
cat > generate-stats.sh << 'STATS'
#!/bin/bash
echo "=== Phase 0 统计报告 ==="
echo ""

echo "追踪任务数："
ls phase0-results/task-flow-traces/task-*.yaml 2>/dev/null | wc -l

echo ""
echo "返工任务数："
grep -c "correct: false" phase0-results/task-flow-traces/*.yaml 2>/dev/null || echo "0"

echo ""
echo "高频问题（出现≥6次）："
# 这里需要更复杂的统计逻辑
STATS

chmod +x generate-stats.sh
./generate-stats.sh
```

---

## 📞 遇到问题怎么办？

### 常见问题排查

```bash
# 问题1：Git 命令找不到
which git || echo "请安装 Git"

# 问题2：权限不足
# 检查文件权限
ls -la phase0-results/

# 修复权限
chmod -R u+rwX phase0-results/

# 问题3：YAML 格式错误
# 验证所有 YAML
for file in phase0-results/task-flow-traces/*.yaml; do
    yamllint "$file" || echo "错误文件: $file"
done

# 问题4：脚本不存在
# 检查脚本目录
ls -la scripts/

# 如果不存在，需要创建（见 phase0-results/TOOLS-SETUP.md）
```

---

### 获取帮助

```bash
# 查看文档
cat HOW-TO-START-REVIEW.md
cat core/02-execution-quick-reference.md
cat core/02-execution-checklist.md

# 查看示例
ls -la phase0-results/examples/
cat phase0-results/examples/task-trace-example-good.yaml

# 搜索关键字
grep -r "某个关键词" core/ reviews/
```

---

## ✅ 快速检查清单

```bash
# 创建检查清单
cat > quick-checklist.md << 'CHECK'
# 快速检查清单

## Phase -1 前
- [ ] 环境工具已安装（Git, gh, yamllint）
- [ ] 文档已阅读（README, HOW-TO-START-REVIEW）
- [ ] 工作目录已创建
- [ ] 已选择试点任务

## Phase 0 前
- [ ] Phase -1 通过
- [ ] 11 个任务已选择
- [ ] 追踪模板已准备
- [ ] 时间已预留（2周）

## Phase 0.5 前
- [ ] Phase 0 建议启动 Phase 1
- [ ] 已确定需要深度解读的 Skill
- [ ] 已获取 Skill 源码
- [ ] 时间已预留（2-3天连续）

## Phase 1 前
- [ ] Phase 0.5 批准启动
- [ ] 技术负责人已审查签字
- [ ] 资源已确认
- [ ] Phase 1 计划已制定
CHECK

cat quick-checklist.md
```

---

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**使用说明**：复制命令直接执行，根据实际情况调整参数  
**更新维护**：遇到问题请更新此文档
