# WP5：Token成本基线测量与Skill精简评估

**版本**：v1.0  
**创建日期**：2026-11-04  
**目标**：测量实际Token成本，数据驱动决策是否精简Skill  
**投入**：18-28小时  
**纳入**：选项B完整审查范围

---

## 🎯 目标

### 主要目标
1. **建立Token成本基线**：测量每个Skill的实际调用成本
2. **识别优化机会**：找出高成本、高频率的Skill
3. **计算ROI**：预估精简后的收益
4. **数据驱动决策**：基于数据决定是否精简

### 次要目标
5. 识别重复读取模式
6. 评估惰性加载效果
7. 为O01-O12计划提供数据支撑

---

## 📋 两阶段执行

### 阶段1：Token成本基线测量（8-12h）
**目标**：获得硬数据  
**产出**：成本基线报告 + ROI优先级

### 阶段2：条件性精简执行（10-16h）
**条件**：阶段1发现ROI>2的Skill  
**产出**：精简后的Skill + 实测效果

---

## 📦 阶段1：Token成本基线测量

### 任务1.1：调用频率统计

**投入**：3-4小时

#### 数据源

**方法A：Git历史分析**（推荐）
```bash
# 统计最近3个月的Skill调用
git log --since="3 months ago" --all --grep="spec-prd\|spec-plan\|spec-work" \
  --pretty=format:"%h %ad %s" --date=short > skill-usage.log

# 分析提交消息中的Skill模式
grep -E "spec-[a-z-]+" skill-usage.log | \
  sed 's/.*\(spec-[a-z-]*\).*/\1/' | \
  sort | uniq -c | sort -rn > skill-frequency.txt
```

**方法B：Claude会话历史**（如果可访问）
```bash
# 从.claude/sessions/或项目记录中提取
# 注意：需要用户授权访问历史会话
```

**方法C：用户访谈**（补充）
- 询问用户最常用的工作流
- 典型任务类型分布
- 每周/月任务量估算

#### 执行步骤

1. 提取最近3个月Git历史（1h）
   ```bash
   cd /Users/kuang/xiaobu/spec-first
   git log --since="2026-08-04" --all --oneline > recent-commits.log
   ```

2. 识别Skill调用模式（1h）
   - 从commit message中提取Skill名称
   - 从PR描述中提取工作流
   - 统计每个Skill出现频次

3. 构建调用频率表（0.5h）
   ```yaml
   skill_frequency:
     spec-prd: X次/月
     spec-plan: Y次/月
     spec-work: Z次/月
     ...
   ```

4. 用户访谈验证（0.5h）
   - 向用户确认典型工作流
   - 调整频率估算

5. 生成频率报告（1h）

#### 产出

**skill-call-frequency-report.md**：
```yaml
统计周期: 2026-08-04 至 2026-11-04（3个月）
数据来源: Git历史 + 用户访谈

调用频率（次/月）:
  spec-prd: 15次
  spec-plan: 18次
  spec-work: 25次
  spec-code-review: 30次
  spec-debug: 12次
  spec-commit-push-pr: 25次
  ...

高频Skill（>20次/月）:
  1. spec-code-review: 30次
  2. spec-work: 25次
  3. spec-commit-push-pr: 25次
  4. spec-plan: 18次
```

---

### 任务1.2：Token消耗测量

**投入**：3-4小时

#### 测量方法

**静态测量**（必须，2h）：
```bash
# 计算每个Skill主文件的Token数
for skill in skills/spec-*/SKILL.md; do
  name=$(basename $(dirname $skill))
  
  # 使用tiktoken或近似算法
  words=$(wc -w < "$skill")
  tokens=$((words * 4 / 3))  # 近似：1 token ≈ 0.75 words
  
  echo "$name: $words words ≈ $tokens tokens"
done > skill-token-count.txt
```

**动态测量**（可选，2h）：
- 如果有API访问：查询实际Claude API调用的token使用
- 如果无API访问：使用静态近似值

#### 执行步骤

1. 静态Token计数（1h）
   ```bash
   cd /Users/kuang/xiaobu/spec-first
   
   # 主文件Token数
   for skill in skills/spec-*/SKILL.md; do
     name=$(basename $(dirname $skill))
     words=$(wc -w < "$skill")
     tokens=$((words * 4 / 3))
     echo "$name,$words,$tokens"
   done > skill-main-tokens.csv
   
   # references/ Token数
   for skill in skills/spec-*/references/*.md; do
     if [ -f "$skill" ]; then
       name=$(basename $(dirname $(dirname $skill)))
       ref=$(basename $skill)
       words=$(wc -w < "$skill")
       tokens=$((words * 4 / 3))
       echo "$name,$ref,$words,$tokens"
     fi
   done > skill-reference-tokens.csv
   ```

2. 计算总Token消耗（1h）
   ```python
   # 每次调用的Token消耗 = 主文件 + 实际加载的references
   # 需要分析每个Skill的加载逻辑
   ```

3. 识别重复读取（0.5h）
   - 检查是否有重复样板
   - 统计样板Token占比

4. 生成Token消耗报告（0.5h）

#### 产出

**skill-token-consumption-report.md**：
```yaml
Token消耗（每次调用）:
  spec-prd:
    主文件: 11,200 tokens
    典型references加载: 2,000 tokens
    总计: 13,200 tokens
    
  spec-plan:
    主文件: 3,400 tokens
    典型references加载: 5,000 tokens
    总计: 8,400 tokens
    
  spec-work:
    主文件: 2,400 tokens
    典型references加载: 1,000 tokens
    总计: 3,400 tokens
    
  ...

高Token Skill（>10,000 tokens/次）:
  1. spec-prd: 13,200 tokens
  2. spec-debug: 7,200 tokens
  3. spec-runtime-setup: 6,800 tokens
```

---

### 任务1.3：成本计算与ROI分析

**投入**：2-3小时

#### 成本计算公式

```yaml
月Token成本 = 调用频率 × 每次Token消耗

优化潜力 = 当前Token消耗 × 可精简比例

月节省Token = 调用频率 × 优化潜力

ROI = 月节省Token × Token单价 / 精简投入小时 / 工程师时薪
```

#### Token定价

```yaml
Claude Opus 5.5定价（2026-11-04）:
  Input: $15 / 1M tokens
  Output: $75 / 1M tokens
  
假设Input/Output比例: 8:2
平均成本: ($15×0.8 + $75×0.2) / 1M = $27 / 1M tokens
```

#### 执行步骤

1. 计算月Token成本（1h）
   ```python
   import pandas as pd
   
   # 加载频率和消耗数据
   frequency = pd.read_csv('skill-frequency.csv')
   consumption = pd.read_csv('skill-token-consumption.csv')
   
   # 合并计算
   cost = frequency.merge(consumption, on='skill')
   cost['monthly_tokens'] = cost['frequency'] * cost['tokens_per_call']
   cost['monthly_cost_usd'] = cost['monthly_tokens'] / 1_000_000 * 27
   
   # 排序
   cost.sort_values('monthly_cost_usd', ascending=False)
   ```

2. 估算精简潜力（0.5h）
   ```yaml
   精简比例假设:
     已精简Skill（spec-plan/work/code-review）: 0%（已优化）
     未精简Skill: 60%（基于历史数据）
     
   spec-prd精简潜力:
     当前: 13,200 tokens
     精简后估算: 5,280 tokens（60%精简）
     节省: 7,920 tokens/次
   ```

3. 计算ROI（0.5h）
   ```yaml
   spec-prd精简ROI:
     月调用: 15次
     月节省: 15 × 7,920 = 118,800 tokens
     月节省成本: $3.21
     年节省成本: $38.52
     
     精简投入: 6小时
     工程师时薪: $100/h（假设）
     精简成本: $600
     
     ROI = $38.52 / $600 = 0.064（6.4%）
     回本周期: 15.6年
   ```

4. 生成ROI优先级（1h）

#### 产出

**token-cost-roi-analysis.md**：
```yaml
成本排序（月Token消耗）:
  1. spec-code-review: 102,000 tokens/月 ($2.75/月)
  2. spec-work: 85,000 tokens/月 ($2.30/月)
  3. spec-prd: 198,000 tokens/月 ($5.35/月)
  ...

ROI排序（考虑频率×潜力）:
  1. spec-prd: ROI=0.064, 回本15.6年 ⚠️
  2. spec-debug: ROI=0.042, 回本23.8年 ⚠️
  3. spec-runtime-setup: ROI=0.028, 回本35.7年 ❌
  ...

结论:
  ⚠️ 所有Skill的精简ROI均<1
  ❌ 纯Token成本角度：不建议精简
  ⚠️ 需要考虑其他收益：维护性、可读性
```

---

### 任务1.4：重复样板识别

**投入**：2-3小时

#### 识别目标

根据历史数据（2026-07-06），已知重复样板：
- Runtime Context Exclusion（6个Skill）
- Scenario Capability（20个Skill）
- Examples As Context（11个Skill）
- Capability-Class Evidence Boundary（6个Skill）
- Domain Language And Decision Ledger（4个Skill）

#### 执行步骤

1. 提取所有Skill的公共段落（1.5h）
   ```bash
   # 使用diff工具识别重复内容
   for skill1 in skills/spec-*/SKILL.md; do
     for skill2 in skills/spec-*/SKILL.md; do
       if [ "$skill1" != "$skill2" ]; then
         diff -u "$skill1" "$skill2" | grep "^-" | grep -v "^---"
       fi
     done
   done > repeated-sections.txt
   ```

2. 统计重复样板的Token占比（1h）
   ```python
   # 计算每个样板的Token数
   # 统计出现频率
   # 计算总浪费Token
   ```

3. 计算样板集中化收益（0.5h）
   ```yaml
   Runtime Context Exclusion样板:
     Token数: 300 tokens
     出现在: 6个Skill
     总浪费: 1,800 tokens（如果全部改为引用，节省1,500 tokens）
     
   如果集中到references/governance-boundaries.md:
     每次仍需加载: 300 tokens
     节省: 0 tokens（❌ 无节省）
     
   结论: 样板集中化不节省Token，只改善维护性
   ```

#### 产出

**repeated-boilerplate-analysis.md**：
```yaml
重复样板统计:
  Runtime Context Exclusion:
    出现次数: 6
    Token数: 300
    总Token: 1,800
    集中化后节省: 0 tokens（仍需加载）
    
  Scenario Capability:
    出现次数: 20
    Token数: 150
    总Token: 3,000
    集中化后节省: 0 tokens
    
  ...

结论:
  ✅ 样板集中化改善维护性
  ❌ 不节省Token成本（仍需加载）
  ⚠️ 除非采用"按需加载"策略
```

---

### 任务1.5：汇总基线报告

**投入**：1-2小时

#### 综合所有数据

整合任务1.1-1.4的结果，生成最终基线报告。

#### 产出

**WP5-token-cost-baseline-report.md**（主报告）：

```yaml
# Token成本基线报告

执行日期: 2026-11-04
统计周期: 2026-08-04 至 2026-11-04（3个月）

## 关键发现

### 发现1: 月Token成本较低
总月Token消耗: ~2,000,000 tokens
总月成本: ~$54
年成本: ~$648

结论: Token成本不是主要痛点

### 发现2: 精简ROI极低
最高ROI Skill: spec-prd, ROI=0.064
回本周期: 15.6年

结论: 纯Token成本角度不建议精简

### 发现3: 样板集中化不节省Token
重复样板: 9类，共8,000 tokens
集中化后节省: 0 tokens（仍需加载）

结论: 样板集中化只改善维护性，不节省成本

## 数据表

### 表1: Skill调用频率
| Skill | 月调用次数 | 排名 |
|---|---|---|
| spec-code-review | 30 | 1 |
| spec-work | 25 | 2 |
| spec-commit-push-pr | 25 | 2 |
| spec-plan | 18 | 4 |
| spec-prd | 15 | 5 |
| spec-debug | 12 | 6 |
| ... | ... | ... |

### 表2: Skill Token消耗
| Skill | 主文件Token | References Token | 总Token/次 |
|---|---|---|---|
| spec-prd | 11,200 | 2,000 | 13,200 |
| spec-debug | 7,200 | 0 | 7,200 |
| spec-runtime-setup | 6,800 | 400 | 7,200 |
| spec-plan | 3,400 | 5,000 | 8,400 |
| spec-work | 2,400 | 1,000 | 3,400 |
| spec-code-review | 1,500 | 0 | 1,500 |
| ... | ... | ... | ... |

### 表3: 月Token成本
| Skill | 月Token消耗 | 月成本($) | 年成本($) | 排名 |
|---|---|---|---|---|
| spec-prd | 198,000 | 5.35 | 64.20 | 1 |
| spec-code-review | 102,000 | 2.75 | 33.00 | 2 |
| spec-work | 85,000 | 2.30 | 27.60 | 3 |
| spec-plan | 151,200 | 4.08 | 48.96 | 4 |
| spec-debug | 86,400 | 2.33 | 27.96 | 5 |
| ... | ... | ... | ... | ... |
| **总计** | **2,000,000** | **54.00** | **648.00** | - |

### 表4: 精简ROI分析
| Skill | 可精简比例 | 月节省Token | 年节省($) | 精简投入(h) | ROI | 回本周期(年) |
|---|---|---|---|---|---|---|
| spec-prd | 60% | 118,800 | 38.52 | 6 | 0.064 | 15.6 |
| spec-debug | 60% | 51,840 | 16.80 | 6 | 0.028 | 35.7 |
| spec-runtime-setup | 40% | 20,160 | 6.53 | 4 | 0.016 | 61.3 |
| ... | ... | ... | ... | ... | ... | ... |

## 结论与建议

### 核心结论
1. ❌ Token成本不是主要问题（年成本$648）
2. ❌ 精简ROI极低（最高0.064，回本15年）
3. ⚠️ 但可能有其他收益（维护性、可读性）

### 决策建议
- 不建议：纯为Token成本而精简
- 建议：如果为维护性而精简，考虑以下Skill
  1. spec-prd（8409词，最长，难维护）
  2. spec-debug（5399词，复杂逻辑多）
  3. spec-runtime-setup（5137词，配置密集）

### 进入阶段2的条件
⚠️ 纯Token成本角度：不建议进入阶段2

但如果考虑其他收益（维护性），可以考虑：
- 精简spec-prd（改善可读性，投入6h）
- 消除重复样板（改善维护性，投入4h）
```

---

## 📦 阶段2：条件性精简执行

### 触发条件

**不触发的情况**（终止WP5）：
- ROI<0.5的所有Skill
- 用户明确不关心维护性改善
- Token成本可接受（<$100/月）

**触发的情况**（继续阶段2）：
- 用户明确要求改善维护性
- 某个Skill极难维护（>5000词）
- 为建立方法论（复用到未来Skill）

### 假设触发，继续阶段2

---

### 任务2.1：spec-prd精简（条件执行）

**投入**：6-8小时  
**触发条件**：用户确认要改善spec-prd维护性

#### 精简策略

复用spec-plan惰性引用模式：

1. **保留主文件**（估算2000词）：
   - 核心流程spine
   - 触发条件
   - 基本职责描述

2. **移出到references/**：
   - `governance-boundaries.md`（治理边界）
   - `domain-templates/*.md`（领域模板）
   - `prd-sections.md`（PRD章节定义）
   - `examples/*.md`（示例）

#### 执行步骤

1. 阅读spec-prd源码（2h）
   ```bash
   cd /Users/kuang/xiaobu/spec-first
   vi skills/spec-prd/SKILL.md
   ```

2. 识别可移出内容（1h）
   - 治理样板（Runtime Context Exclusion等）
   - 领域知识（特定行业模板）
   - 详细示例
   - 次要流程

3. 创建references/结构（1h）
   ```bash
   mkdir -p skills/spec-prd/references/domain-templates
   mkdir -p skills/spec-prd/references/examples
   ```

4. 移出内容到references/（2h）
   ```markdown
   # skills/spec-prd/SKILL.md（精简后）
   
   **STOP. Before domain interpretation or detailed requirements gathering,
   read `skills/spec-prd/references/governance-boundaries.md`.**
   
   **STOP. For domain-specific templates, read 
   `skills/spec-prd/references/domain-templates/{domain}.md`.**
   ```

5. Contract测试验证（1h）
   ```bash
   npm run test:unit -- spec-prd
   ```

6. 对比前后Token数（0.5h）

#### 产出

- spec-prd精简后的源码
- references/目录结构
- Contract测试通过证明
- 前后Token对比报告

---

### 任务2.2：重复样板消除（条件执行）

**投入**：4-6小时  
**触发条件**：用户确认要改善整体维护性

#### 策略

创建全局governance文件，所有Skill引用：

```bash
skills/shared/governance-boundaries.md
```

每个Skill改为：
```markdown
**STOP. Before any work, read 
`skills/shared/governance-boundaries.md` for project-wide governance.**
```

#### 执行步骤

1. 创建shared/目录（0.5h）
   ```bash
   mkdir -p skills/shared
   ```

2. 提取公共样板（2h）
   - Runtime Context Exclusion
   - Scenario Capability
   - Examples As Context
   - Capability-Class Evidence Boundary
   - 其他公共治理段落

3. 批量替换Skill引用（2h）
   ```bash
   for skill in skills/spec-*/SKILL.md; do
     # 删除旧样板
     # 添加STOP引用
   done
   ```

4. 全量Contract测试（1h）
   ```bash
   npm test
   ```

#### 产出

- skills/shared/governance-boundaries.md
- 修改的Skill列表
- Contract测试通过证明

---

### 任务2.3：实测效果验证（条件执行）

**投入**：2-3小时  
**触发条件**：阶段2任何任务执行后

#### 验证维度

1. **Token节省**（1h）
   - 重新测量精简后的Token消耗
   - 对比基线数据
   - 计算实际节省

2. **维护性改善**（定性）（0.5h）
   - 主文件是否更易读？
   - 定位问题是否更快？
   - 修改是否更安全？

3. **Contract验证**（0.5h）
   - 所有Contract测试通过
   - 无行为回归

#### 产出

**skill-simplification-effect-report.md**：
```yaml
精简效果:
  spec-prd:
    前: 13,200 tokens/次
    后: 5,280 tokens/次
    节省: 7,920 tokens/次（60%）
    
    月调用: 15次
    月节省: 118,800 tokens
    月节省成本: $3.21
    
  维护性改善:
    主文件: 8409词 → 2000词（76%精简）
    可读性: 显著改善
    定位速度: 提升~3倍
    
  Contract验证:
    测试通过: ✅ 100%
    行为回归: 0
```

---

## 📊 整体时间线

### 如果不触发阶段2（最小路径）

**总投入**：8-12小时

```
Week 1:
  Day 1-2: 任务1.1-1.2（调用频率+Token测量）（6-8h）
  Day 3: 任务1.3-1.4（ROI分析+样板识别）（4-6h）
  Day 4: 任务1.5（汇总报告）（1-2h）
  
  → 决策点：是否进入阶段2？
  → 如果否：WP5完成
```

### 如果触发阶段2（完整路径）

**总投入**：18-28小时

```
Week 1:
  阶段1同上（8-12h）
  
  → 决策点：用户确认进入阶段2
  
Week 2:
  Day 1-2: 任务2.1（spec-prd精简）（6-8h）
  Day 3: 任务2.2（样板消除）（4-6h）
  Day 4: 任务2.3（效果验证）（2-3h）
```

---

## 📋 交付物清单

### 阶段1必须交付（8个）

1. skill-call-frequency-report.md
2. skill-token-consumption-report.md
3. token-cost-roi-analysis.md
4. repeated-boilerplate-analysis.md
5. WP5-token-cost-baseline-report.md（主报告）
6. skill-frequency.csv（数据）
7. skill-token-consumption.csv（数据）
8. token-cost-roi-table.csv（数据）

### 阶段2条件交付（5个）

9. spec-prd精简后的源码（如果执行2.1）
10. spec-prd/references/目录结构（如果执行2.1）
11. skills/shared/governance-boundaries.md（如果执行2.2）
12. skill-simplification-effect-report.md（如果执行2.3）
13. WP5-final-summary.md（阶段2总结）

---

## ✅ 完成标准

### 阶段1完成标准

- [ ] 所有38个Skill的调用频率已统计
- [ ] 所有38个Skill的Token消耗已测量
- [ ] ROI分析表已生成
- [ ] 重复样板已识别
- [ ] 基线报告已完成
- [ ] 用户已做出进入/不进入阶段2的决策

### 阶段2完成标准（如果触发）

- [ ] 至少1个Skill完成精简
- [ ] Contract测试100%通过
- [ ] 实测Token节省已验证
- [ ] 维护性改善已评估
- [ ] 效果报告已完成

---

## 🎯 与选项B其他WP的关系

### 整合到选项B

**WP5是独立工作包，与WP1-4并行或串行执行**

#### 并行执行（推荐）
- Week 1-2: WP1（源码审查）+ WP5阶段1（Token测量）
- Week 3: WP3（真实验证）+ WP5阶段2（条件精简）
- Week 4: WP4（未覆盖维度）+ WP5汇总

**优点**：时间紧凑  
**缺点**：需要更多并行能力

#### 串行执行
- Week 1-4: WP1-4（原计划）
- Week 5: WP5阶段1（Token测量）
- Week 6: WP5阶段2（条件精简，如果触发）

**优点**：专注，风险低  
**缺点**：总时间延长1-2周

### 更新选项B总投入

**原投入**：56-80小时  
**加上WP5最小**：64-92小时  
**加上WP5完整**：74-108小时

---

## 🚨 风险与缓解

### 风险1：Token成本数据难以获取

**影响**：无法精确测量实际调用的Token  
**概率**：中  
**缓解**：
- 使用静态近似（words × 4/3）
- 使用Git历史推断
- 明确标注数据局限性

### 风险2：ROI极低，用户失望

**影响**：投入8-12h但结论是"不建议精简"  
**概率**：高  
**缓解**：
- 提前设定预期：主要目标是"获得数据"
- 强调维护性收益（非Token成本）
- 数据本身有价值（支撑未来决策）

### 风险3：精简导致行为回归

**影响**：Contract测试失败，需要回滚  
**概率**：低（spec-plan已验证可行）  
**缓解**：
- 使用隔离worktree
- 充分Contract测试
- 保留回滚路径

---

## 📝 执行准备清单

### 开始阶段1前

- [ ] 确认有Git历史访问权限
- [ ] 准备Token计数工具
- [ ] 确认用户可以接受"不建议精简"的结论
- [ ] 准备Python/数据分析环境

### 阶段1结束决策点

- [ ] 基线报告已完成
- [ ] 用户已阅读报告
- [ ] 用户明确决策：进入/不进入阶段2
- [ ] 如果进入，确认具体精简哪些Skill

### 开始阶段2前（如果触发）

- [ ] 创建隔离worktree
- [ ] 准备Contract测试环境
- [ ] 确认用户授权修改Skill源码

---

**WP5版本**：v1.0  
**创建日期**：2026-11-04  
**预计启动**：与WP1并行或WP4后  
**阶段1预计完成**：启动后1周  
**阶段2预计完成**：启动后2周（如果触发）
