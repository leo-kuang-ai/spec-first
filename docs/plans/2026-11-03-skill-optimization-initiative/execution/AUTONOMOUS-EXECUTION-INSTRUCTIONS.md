# 全量自主执行指令

**授权日期**：2026-11-03  
**执行模式**：方案C（监督式自主）  
**执行者**：GLM-5.3 @ zcode  
**监督者**：Claude Fable 5.1  
**授权人**：项目负责人

---

## 🚀 执行授权

**已授权**：✅ 全量自主执行优化

**执行参数**：
- 投入预算：100h（AI口径）
- ROI门槛：>1
- 监督级别：实时监督
- 执行速度：标准

---

## 📋 完整执行指令（给 GLM-5.3）

### 总体目标

深度审查所有主链路Skill，自主识别问题，自主决策优先级，自主执行优化，最大化改善返工率。

### 阶段1：全量深度审查（32h预算）

**任务**：依次深度解读 4 个 Skill

```
循环执行（spec-prd, spec-work, spec-code-review, spec-commit-push-pr）：

对每个 Skill：

1. 定位源码（2h）
   - 搜索 Skill 源码位置
   - 确认主要文件
   - 绘制文件结构图

2. 深度阅读（4h）
   - 逐文件阅读源码
   - 理解核心逻辑
   - 绘制流程图
   - 标注关键决策点

3. 对比分析（1h）
   - 查看此 Skill 在 Phase 0 中的问题
   - 对比 Contract 定义
   - 识别实现与 Contract 的差异

4. 问题识别（30min）
   - 列出所有发现的问题
   - 分类（Contract问题/实现bug/设计缺陷）
   - 评估频率和影响

5. 归因验证（30min）
   - 验证 Phase 0 的黑盒归因
   - 修正归因（如果需要）
   - 计算新的归因占比

6. 优化方案设计（2h）
   - 针对每个问题设计修复方案
   - 评估投入（小时数）
   - 评估预期效果
   - 计算 ROI

7. 输出报告（1h）
   - 创建 phase0-results/phase05-analysis/{skill}-analysis.md
   - 包含：问题清单、归因、方案、ROI

总计：约 8h/Skill × 4 = 32h
```

**输出物**：
```
phase0-results/phase05-analysis/
├── spec-prd-analysis.md
├── spec-work-analysis.md
├── spec-code-review-analysis.md
└── spec-commit-push-pr-analysis.md
```

---

### 阶段2：自主决策优先级（4h预算）

**任务**：收集所有问题，自主排序，分级

```
步骤：

1. 收集问题（1h）
   - 汇总 5 个 Skill 的所有问题（spec-plan已完成+新增4个）
   - 统一格式
   - 去重

2. 计算评分（2h）
   对每个问题计算综合评分：
   
   score = (
       frequency * 30% +      # 出现频率（0-10分）
       severity * 30% +       # 影响严重度（0-10分）
       fixability * 20% +     # 可修复性（0-10分，难度越低分越高）
       roi * 20%              # 预期ROI（归一化到0-10分）
   )
   
   frequency 计算：
   - 出现在 ≥50% 任务：10分
   - 出现在 30-50% 任务：7分
   - 出现在 10-30% 任务：5分
   - 出现在 <10% 任务：3分
   
   severity 计算：
   - 导致返工：10分
   - 导致用户介入：7分
   - 影响效率：5分
   - 轻微影响：3分
   
   fixability 计算：
   - ≤4h修复：10分
   - 4-8h修复：7分
   - 8-16h修复：5分
   - >16h修复：3分
   
   roi 计算：
   - ROI ≥3：10分
   - ROI 2-3：8分
   - ROI 1-2：6分
   - ROI 0.5-1：3分
   - ROI <0.5：0分

3. 排序和分级（30min）
   按 score 降序排序
   
   P0（必做）：score ≥ 8.0
   P1（强烈建议）：6.0 ≤ score < 8.0
   P2（可选）：4.0 ≤ score < 6.0
   P3（不做）：score < 4.0

4. 制定执行计划（30min）
   基于投入预算分配：
   - 累计 P0 投入
   - 如果 P0 投入 ≤ 40h → 加入 P1 直到总投入 ≤ 80h
   - 如果 P0 投入 > 80h → 只执行部分 P0，按score排序
   
   生成执行顺序（按score降序）
```

**输出物**：
```
phase0-results/autonomous-optimization-plan.md
包含：
- 所有问题清单（含评分）
- P0/P1/P2分级
- 执行顺序
- 预期总投入
- 预期总收益
- 预期ROI
```

---

### 阶段3：批量执行优化（20-80h预算）

**任务**：按优先级自动执行所有优化

```
循环执行（按 autonomous-optimization-plan.md 的顺序）：

对每个优化项：

1. 读取方案（10min）
   - 从分析报告读取优化方案
   - 确认需要修改的文件
   - 确认修改内容

2. 创建分支（5min）
   git checkout -b optimize-{skill}-{issue-id}

3. 执行修改（varies）
   - 修改 Skill 源码 / Contract / 测试
   - 按方案逐项修改
   - 保持代码风格一致

4. 自我验证（30min）
   - 运行相关测试
   - 检查 Contract 合规性
   - 验证修改是否符合预期
   
   如果验证失败：
     - 分析失败原因
     - 调整方案
     - 重试（最多3次）
     - 如果仍失败 → 记录失败 → 跳过此项

5. 提交变更（10min）
   git add .
   git commit -m "optimize({skill}): {issue-description}
   
   - 问题：{problem}
   - 方案：{solution}
   - 预期效果：{expected}
   - 投入：{hours}h
   - ROI：{roi}
   "

6. 记录进度（5min）
   更新 phase0-results/optimization-progress.md
   - 已完成项
   - 当前项
   - 剩余项
   - 累计投入
   - 预期收益

7. 检查预算（5min）
   如果累计投入 ≥ 80h：
     - 暂停执行
     - 生成中期报告
     - 请求人类决策：继续 / 停止

8. 进入下一项
```

**安全机制**：
```
每次修改前：
- ✅ 创建 Git 分支
- ✅ 记录修改意图

每次修改后：
- ✅ 运行测试
- ✅ 验证 Contract
- ✅ 检查副作用

失败处理：
- ✅ 自动回滚（git checkout -- .）
- ✅ 记录失败原因
- ✅ 调整方案重试
- ✅ 3次失败后跳过
```

**输出物**：
```
Git commits（每个优化一个）
phase0-results/optimization-progress.md
phase0-results/optimization-failures.md（如果有失败）
```

---

### 阶段4：持续验证（8-16h预算）

**任务**：验证优化效果

```
步骤：

1. 选择验证任务（1h）
   - 从最近任务中选择 5-10 个
   - 涵盖不同类型（功能开发、Bug修复、跨模块等）
   - 记录基线数据（如果有Phase 0数据更好）

2. 执行验证任务（10-20h，实际任务执行）
   - 使用优化后的 Skill 执行任务
   - 完整记录执行过程
   - 标注阻力点
   - 记录返工情况

3. 对比分析（2h）
   - 计算新的返工率
   - 对比 Phase 0 基线（66.7%）
   - 计算改善幅度
   - 分析改善原因

4. 评估ROI（1h）
   实际ROI = 实际收益 / 实际投入
   
   实际收益 = (基线返工率 - 新返工率) × 任务数 × 平均任务时间 × 团队规模 × 6个月
   实际投入 = 阶段1+2+3的实际时间

5. 生成最终报告（2h）
   phase0-results/final-optimization-report.md
   - 执行摘要
   - 优化项清单
   - 效果对比
   - ROI评估
   - 经验教训
   - 后续建议
```

**输出物**：
```
phase0-results/validation-tasks/（5-10个验证任务追踪）
phase0-results/final-optimization-report.md
```

---

## 🤖 自主决策规则

### 规则1：ROI门槛

```
if issue.roi < 1:
    skip_this_issue()
    log("跳过：ROI < 1")
```

### 规则2：投入上限

```
if cumulative_hours >= 80:
    pause_execution()
    generate_interim_report()
    request_human_decision()
```

### 规则3：连续失败

```
if consecutive_failures >= 3:
    pause_execution()
    report_problem_to_human()
```

### 规则4：Contract冲突

```
if conflicts_with_contract():
    stop_this_modification()
    report_to_human()
    request_guidance()
```

### 规则5：测试失败

```
if test_failed():
    attempt = 0
    while attempt < 3:
        analyze_failure()
        adjust_approach()
        retry()
        if test_passed():
            break
        attempt += 1
    if attempt >= 3:
        rollback()
        log_failure()
        skip_this_issue()
```

---

## 📊 监控和报告

### 实时进度报告

**位置**：phase0-results/execution-status.md

**内容**：
```yaml
当前阶段: [1/2/3/4]
当前任务: [具体任务描述]
已投入时间: [Xh / 100h]
完成进度: [X%]

阶段1进度:
  - spec-prd: ✅ 完成
  - spec-work: ⏳ 进行中
  - spec-code-review: ⏹️ 待开始
  - spec-commit-push-pr: ⏹️ 待开始

阶段2进度:
  - 问题收集: ⏹️ 待开始
  - 评分排序: ⏹️ 待开始
  - 分级决策: ⏹️ 待开始

识别的问题:
  - 总数: [X]
  - P0: [X]
  - P1: [X]
  - P2: [X]

已完成优化:
  - 数量: [X]
  - 投入: [Xh]
  - 成功: [X]
  - 失败: [X]

预期效果:
  - 返工率改善: [X%]
  - ROI: [X]

风险指标:
  - 连续失败: [X/3]
  - 预算使用: [X/100h]
  - 偏离预期: [是/否]

最后更新: [timestamp]
```

**更新频率**：每完成一个子任务

---

### 关键决策点通知

**何时通知**：
1. 累计投入达到 80h
2. 连续失败 3 次
3. 发现 Contract 冲突
4. ROI 计算结果 <1 的优化
5. 每个阶段完成时

**通知方式**：
- 更新 execution-status.md
- 标注 [需要人类决策]
- 说明具体情况
- 等待指令

---

## 🚦 执行控制

### 暂停条件

```
自动暂停（需要人类决策）：
- 累计投入 ≥ 80h
- 连续失败 ≥ 3 次
- Contract 冲突
- 预期 ROI < 0.5

人工暂停：
- 收到 "暂停" 指令
- 收到 Ctrl+C 信号
```

### 继续条件

```
自动继续：
- 正常流程
- 单次失败后调整重试
- ROI ≥ 1 的优化

需要批准后继续：
- 投入超过 80h
- ROI 0.5-1 的优化
- 从暂停恢复
```

### 终止条件

```
正常终止：
- 所有计划任务完成
- 验证报告生成完成

异常终止：
- 收到 "终止" 指令
- 不可恢复的错误
- 安全问题
```

---

## ✅ 开始执行

### 执行命令（给 GLM-5.3）

```
====== 全量自主优化执行指令 ======

授权：✅ 已授权
模式：方案C（监督式自主）
预算：100h（AI口径）
ROI门槛：>1

执行内容：
1. 阶段1：全量深度审查（32h）
   - spec-prd, spec-work, spec-code-review, spec-commit-push-pr
   - 输出：4个分析报告

2. 阶段2：自主决策（4h）
   - 收集所有问题
   - 计算评分排序
   - 分级 P0/P1/P2
   - 输出：optimization-plan.md

3. 阶段3：批量优化（20-80h）
   - 按优先级执行
   - 自动测试验证
   - 失败自动回滚
   - 输出：Git commits

4. 阶段4：验证（8-16h）
   - 5-10个新任务
   - 对比基线
   - 输出：最终报告

自主决策规则：
- ROI >1 → 执行
- ROI <1 → 跳过
- 投入 ≥80h → 暂停询问
- 连续失败3次 → 暂停询问
- Contract冲突 → 暂停询问

监控：
- 实时更新 execution-status.md
- 关键决策点通知
- 异常立即报告

参考文档：
- core/12-phase05-skill-deep-dive.md（方法论）
- phase0-results/phase05-summary-report.md（spec-plan示例）
- core/08-skill-contract-protocol.md（Contract定义）
- AUTONOMOUS-FULL-OPTIMIZATION-PLAN.md（完整方案）

开始执行。

遇到需要决策的情况立即暂停并通知。
======================================
```

---

**指令版本**：v1.0  
**生成日期**：2026-11-03  
**状态**：✅ 已授权，等待执行  
**监督者**：Claude Fable 5.1 将实时监控

---

## 📞 监督者信息

**Claude Fable 5.1 监督承诺**：

我将：
- ✅ 实时监控执行状态
- ✅ 异常时立即干预
- ✅ 关键决策点提醒
- ✅ 确保质量和ROI
- ✅ 防止过度优化
- ✅ 保护原有设计意图

我不会：
- ❌ 过度干预正常流程
- ❌ 替代GLM-5.3决策
- ❌ 改变授权参数

---

**准备就绪。等待 GLM-5.3 开始执行。**
