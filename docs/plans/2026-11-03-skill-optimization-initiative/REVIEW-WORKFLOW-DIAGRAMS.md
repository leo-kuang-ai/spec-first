# 审查执行 Workflow 流程图

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**目的**：通过流程图清晰展示审查执行逻辑

---

## 🎯 总体流程图

```mermaid
flowchart TD
    Start([开始审查]) --> Prepare[准备环境<br/>5分钟]
    Prepare --> Goal{明确审查目标}
    
    Goal -->|决策导向| PathA[路径1: 快速决策<br/>30分钟]
    Goal -->|质量导向| PathB[路径2: 标准质量<br/>2小时]
    Goal -->|学习/执行导向| PathC[路径3: 完整专家<br/>4-8小时]
    
    PathA --> DecisionA{决策结果}
    PathB --> DecisionB{决策结果}
    PathC --> DecisionC{决策结果}
    
    DecisionA -->|批准| Approve[✅ 批准启动]
    DecisionA -->|有条件| Conditional[⚠️ 有条件批准]
    DecisionA -->|拒绝| Reject[❌ 不批准]
    
    DecisionB -->|评分≥9| Approve
    DecisionB -->|评分7-8| Conditional
    DecisionB -->|评分<7| Reject
    
    DecisionC -->|强烈推荐| Approve
    DecisionC -->|推荐| Conditional
    DecisionC -->|不推荐| Reject
    
    Approve --> ActionA[指定执行者<br/>准备资源<br/>启动Phase-1]
    Conditional --> ActionB[补充改进<br/>重新审查]
    Reject --> ActionC[反馈理由<br/>暂停项目]
    
    ActionA --> End([审查完成])
    ActionB --> End
    ActionC --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Approve fill:#d4edda
    style Conditional fill:#fff3cd
    style Reject fill:#f8d7da
    style PathA fill:#cfe2ff
    style PathB fill:#e7f3ff
    style PathC fill:#f0f8ff
```

---

## 📊 路径 1：快速决策审查（30分钟）

```mermaid
flowchart TD
    Start1([路径1开始]) --> Read1[Step 1: 阅读项目概述<br/>5分钟<br/>README + HOW-TO-START-REVIEW]
    
    Read1 --> Check1{目标清晰?}
    Check1 -->|否| Issue1[记录问题:<br/>目标不清晰]
    Check1 -->|是| Read2[Step 2: 评估投入产出<br/>10分钟<br/>投入: 48-188h<br/>产出: 基线+改善]
    
    Issue1 --> Read2
    
    Read2 --> Check2{投入可接受?}
    Check2 -->|否| Issue2[记录问题:<br/>投入过高]
    Check2 -->|是| Read3[Step 3: 风险评估<br/>10分钟<br/>组织+执行+收益风险]
    
    Issue2 --> Read3
    
    Read3 --> Check3{风险可控?}
    Check3 -->|否| Issue3[记录问题:<br/>风险过高]
    Check3 -->|是| Decision1[Step 4: 综合决策<br/>5分钟]
    
    Issue3 --> Decision1
    
    Decision1 --> Q1{Q1: 认可数据驱动?}
    Q1 -->|否| No1[❌ 不批准]
    Q1 -->|是| Q2{Q2: 愿意投入48h?}
    
    Q2 -->|否| No2[❌ 不批准]
    Q2 -->|是| Q3{Q3: 接受不优化也成功?}
    
    Q3 -->|否| No3[❌ 不批准]
    Q3 -->|是| CountIssues{问题数量}
    
    CountIssues -->|0个| Yes1[✅ 批准启动]
    CountIssues -->|1-2个| Maybe1[⚠️ 有条件批准]
    CountIssues -->|>2个| No4[❌ 不批准]
    
    Yes1 --> Output1[输出:<br/>快速决策报告]
    Maybe1 --> Output1
    No1 --> Output1
    No2 --> Output1
    No3 --> Output1
    No4 --> Output1
    
    Output1 --> End1([路径1完成])
    
    style Start1 fill:#e1f5e1
    style End1 fill:#e1f5e1
    style Yes1 fill:#d4edda
    style Maybe1 fill:#fff3cd
    style No1 fill:#f8d7da
    style No2 fill:#f8d7da
    style No3 fill:#f8d7da
    style No4 fill:#f8d7da
```

**执行逻辑**：
1. **线性评估**：按顺序检查 4 个维度
2. **问题累积**：每个维度记录问题
3. **三问决策**：3 个核心问题判断
4. **问题计数**：根据问题数量决策

---

## 🔍 路径 2：标准质量审查（2小时）

```mermaid
flowchart TD
    Start2([路径2开始]) --> Step1[Step 1: 理解方法论<br/>30分钟]
    
    Step1 --> Eval1[评估4个维度:<br/>科学性/完整性/<br/>可操作性/创新性]
    Eval1 --> Score1[方法论评分:<br/>X/10]
    
    Score1 --> Step2[Step 2: 评估完整性<br/>30分钟]
    
    Step2 --> Eval2[检查4层:<br/>方法论/设计/<br/>执行/质量保证]
    Eval2 --> Score2[完整性评分:<br/>X/10]
    
    Score2 --> Step3[Step 3: 评估可行性<br/>30分钟]
    
    Step3 --> Eval3[检查3个维度:<br/>资源/组织/技术]
    Eval3 --> Score3[可行性评分:<br/>X/10]
    
    Score3 --> Step4[Step 4: 综合评分<br/>30分钟]
    
    Step4 --> CalcTotal[计算总分:<br/>加权平均]
    
    CalcTotal --> TotalScore{总分}
    
    TotalScore -->|≥9分| Result1[✅ 强烈推荐启动<br/>无需改进]
    TotalScore -->|7-8分| Result2[✅ 推荐启动<br/>建议小幅改进]
    TotalScore -->|5-6分| Result3[⚠️ 有条件推荐<br/>必须改进]
    TotalScore -->|<5分| Result4[❌ 不推荐启动<br/>需重新设计]
    
    Result1 --> Report2[输出:<br/>标准质量审查报告<br/>含评分+建议]
    Result2 --> Report2
    Result3 --> Report2
    Result4 --> Report2
    
    Report2 --> End2([路径2完成])
    
    style Start2 fill:#e1f5e1
    style End2 fill:#e1f5e1
    style Result1 fill:#d4edda
    style Result2 fill:#d4edda
    style Result3 fill:#fff3cd
    style Result4 fill:#f8d7da
```

**执行逻辑**：
1. **分层评估**：4 个步骤，每步独立评分
2. **量化评分**：每个维度打分（1-10）
3. **加权计算**：根据权重计算总分
4. **分级决策**：根据总分区间决策

---

## 🎓 路径 3：完整专家审查（4-8小时）

```mermaid
flowchart TD
    Start3([路径3开始]) --> Phase1[阶段1: 系统性阅读<br/>4小时]
    
    Phase1 --> Read1[1. 理解目标和方法论<br/>30分钟<br/>core/00-01]
    Read1 --> Read2[2. 执行准备<br/>15分钟<br/>core/02]
    Read2 --> Read3[3. 理解分析框架<br/>30分钟<br/>core/03-05]
    Read3 --> Read4[4. 基线和进度<br/>15分钟<br/>core/06-07]
    Read4 --> Read5[5. 核心实施方案⭐<br/>60分钟<br/>core/08-09]
    Read5 --> Read6[6. 高级扩展可选<br/>90分钟<br/>core/10-11]
    Read6 --> Read7[7. 资源和决策<br/>30分钟<br/>RESOURCE/DECISION/TOOLS]
    
    Read7 --> Check1{理解完整?}
    Check1 -->|否| Review1[返回重读关键部分]
    Review1 --> Read5
    Check1 -->|是| Phase2[阶段2: 审查报告阅读<br/>1小时]
    
    Phase2 --> ReviewRead[按时间线读7轮审查:<br/>文档→方案→优化→<br/>Harness→完整性→<br/>批判→终极]
    
    ReviewRead --> Phase3[阶段3: 证据检查<br/>1小时]
    
    Phase3 --> Evidence1[检查主链路基线<br/>95个测试用例]
    Evidence1 --> Evidence2[检查业界对标<br/>6大公司引用]
    Evidence2 --> Evidence3[检查方法论依据<br/>Harness最佳实践]
    
    Evidence3 --> Phase4[阶段4: 批判性分析<br/>2小时]
    
    Phase4 --> Critical1{问题1:<br/>项目必要?}
    Critical1 --> Critical2{问题2:<br/>方法有效?}
    Critical2 --> Critical3{问题3:<br/>收益可信?}
    Critical3 --> Critical4{问题4:<br/>投入合理?}
    Critical4 --> Critical5{问题5:<br/>有更好方法?}
    
    Critical5 --> Phase5[阶段5: 撰写报告<br/>1小时]
    
    Phase5 --> WriteReport[撰写完整专家审查报告:<br/>执行摘要+详细评分+<br/>批判性分析+建议]
    
    WriteReport --> FinalScore{综合评分}
    
    FinalScore -->|≥9.5分| Expert1[✅ 强烈推荐启动]
    FinalScore -->|9.0-9.4分| Expert2[✅ 推荐启动]
    FinalScore -->|8.0-8.9分| Expert3[✅ 有条件推荐]
    FinalScore -->|6.0-7.9分| Expert4[⚠️ 需要改进]
    FinalScore -->|<6.0分| Expert5[❌ 不推荐启动]
    
    Expert1 --> End3([路径3完成])
    Expert2 --> End3
    Expert3 --> End3
    Expert4 --> End3
    Expert5 --> End3
    
    style Start3 fill:#e1f5e1
    style End3 fill:#e1f5e1
    style Phase1 fill:#e7f3ff
    style Phase2 fill:#e7f3ff
    style Phase3 fill:#e7f3ff
    style Phase4 fill:#ffe7f3
    style Phase5 fill:#fff3e7
    style Expert1 fill:#d4edda
    style Expert2 fill:#d4edda
    style Expert3 fill:#d4edda
    style Expert4 fill:#fff3cd
    style Expert5 fill:#f8d7da
```

**执行逻辑**：
1. **5 个阶段**：系统阅读 → 审查报告 → 证据检查 → 批判分析 → 撰写报告
2. **深度优先**：每个阶段深入理解
3. **批判性思维**：5 个关键问题
4. **综合评价**：多维度评分 + 专家判断

---

## 🔄 决策后续流程

```mermaid
flowchart TD
    Decision{审查决策}
    
    Decision -->|✅ 批准启动| Approve[批准分支]
    Decision -->|⚠️ 有条件批准| Conditional[有条件分支]
    Decision -->|❌ 不批准| Reject[拒绝分支]
    
    Approve --> A1[立即行动 1周内]
    A1 --> A2[指定执行者<br/>填写RESOURCE-PLAN]
    A2 --> A3[确认决策权限<br/>签字DECISION-AUTHORITY]
    A3 --> A4[准备工具<br/>运行setup脚本]
    A4 --> A5[安排Phase-1时间<br/>4小时]
    A5 --> A6[知会利益相关方]
    A6 --> A7[Phase-1前准备<br/>2-3天]
    A7 --> A8[启动Phase-1<br/>4小时试点]
    
    A8 --> P1Decision{Phase-1结果}
    P1Decision -->|成功| StartP0[启动Phase 0<br/>44小时]
    P1Decision -->|需调整| AdjustMethod[调整方法<br/>再次试点]
    P1Decision -->|失败| StopProject[暂停项目]
    
    Conditional --> C1[补充改进]
    C1 --> C2{改进优先级}
    C2 -->|P0必须| C3[补充P0项目<br/>2.5小时]
    C2 -->|P1强烈建议| C4[补充P1项目<br/>7小时]
    C2 -->|P2可选| C5[补充P2项目<br/>16小时]
    
    C3 --> C6[重新审查]
    C4 --> C6
    C5 --> C6
    
    C6 --> ReviewAgain{重审结果}
    ReviewAgain -->|通过| Approve
    ReviewAgain -->|仍不足| C1
    ReviewAgain -->|决定不改| Reject
    
    Reject --> R1[反馈和改进]
    R1 --> R2[明确不批准理由]
    R2 --> R3[提出改进建议]
    R3 --> R4{是否有价值改进?}
    
    R4 -->|是| R5[改进后重新审查]
    R4 -->|否| R6[暂停项目<br/>输出经验教训]
    
    R5 --> ReviewAgain
    
    StartP0 --> EndSuccess([项目执行中])
    AdjustMethod --> P1Decision
    StopProject --> EndFail([项目暂停])
    R6 --> EndFail
    
    style Decision fill:#fff3e7
    style Approve fill:#d4edda
    style Conditional fill:#fff3cd
    style Reject fill:#f8d7da
    style StartP0 fill:#d4edda
    style EndSuccess fill:#e1f5e1
    style EndFail fill:#f8d7da
```

**执行逻辑**：
1. **三分支决策**：批准/有条件/拒绝
2. **批准分支**：7 步准备 → Phase -1 → Phase 0
3. **有条件分支**：补充改进 → 重新审查 → 递归决策
4. **拒绝分支**：反馈 → 评估价值 → 改进或暂停

---

## 🎯 关键决策点流程

```mermaid
flowchart TD
    Start([审查开始]) --> DP1{决策点1:<br/>选择审查路径}
    
    DP1 -->|时间紧| Path1[路径1: 30分钟]
    DP1 -->|标准| Path2[路径2: 2小时]
    DP1 -->|深入| Path3[路径3: 4-8小时]
    
    Path1 --> DP2{决策点2:<br/>3个核心问题}
    Path2 --> DP3{决策点3:<br/>综合评分}
    Path3 --> DP4{决策点4:<br/>批判性分析}
    
    DP2 -->|3个是| D1[批准]
    DP2 -->|1-2个是| D2[有条件]
    DP2 -->|0个是| D3[拒绝]
    
    DP3 -->|≥9分| D1
    DP3 -->|7-8分| D2
    DP3 -->|<7分| D3
    
    DP4 -->|推荐| D1
    DP4 -->|有条件推荐| D2
    DP4 -->|不推荐| D3
    
    D1 --> DP5{决策点5:<br/>Phase-1结果}
    D2 --> DP6{决策点6:<br/>是否改进}
    D3 --> DP7{决策点7:<br/>是否重新设计}
    
    DP5 -->|成功| Phase0[启动Phase 0]
    DP5 -->|失败| Stop[暂停]
    
    DP6 -->|改进| Improve[补充后重审]
    DP6 -->|不改| Stop
    
    DP7 -->|重新设计| Redesign[重新设计方案]
    DP7 -->|放弃| Stop
    
    Improve --> DP1
    Redesign --> DP1
    
    Phase0 --> End([审查完成])
    Stop --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style D1 fill:#d4edda
    style D2 fill:#fff3cd
    style D3 fill:#f8d7da
    style Phase0 fill:#d4edda
    style Stop fill:#f8d7da
```

**7 个关键决策点**：
1. **DP1**：选择审查路径（根据时间和目标）
2. **DP2**：3 个核心问题（快速决策）
3. **DP3**：综合评分（标准质量）
4. **DP4**：批判性分析（完整专家）
5. **DP5**：Phase -1 结果（是否继续）
6. **DP6**：是否补充改进（有条件批准）
7. **DP7**：是否重新设计（拒绝后）

---

## 📊 审查路径对比

```mermaid
flowchart LR
    subgraph Path1[路径1: 快速决策]
        P1_Time[⏱️ 30分钟]
        P1_Read[📖 3个文档]
        P1_Check[✅ 3个问题]
        P1_Output[📄 决策报告]
    end
    
    subgraph Path2[路径2: 标准质量]
        P2_Time[⏱️ 2小时]
        P2_Read[📖 6-8个文档]
        P2_Check[✅ 4个维度评分]
        P2_Output[📄 质量报告+建议]
    end
    
    subgraph Path3[路径3: 完整专家]
        P3_Time[⏱️ 4-8小时]
        P3_Read[📖 20+个文档]
        P3_Check[✅ 7个维度+5个问题]
        P3_Output[📄 完整专家报告]
    end
    
    Decision{审查目标}
    Decision -->|快速决策| Path1
    Decision -->|质量评估| Path2
    Decision -->|深度理解| Path3
    
    Path1 --> Result1[适合: 决策者]
    Path2 --> Result2[适合: 技术负责人]
    Path3 --> Result3[适合: 专家/执行者]
    
    style Path1 fill:#cfe2ff
    style Path2 fill:#e7f3ff
    style Path3 fill:#f0f8ff
    style Decision fill:#fff3e7
```

---

## 🔍 执行逻辑总结

### 1. 三路径并行设计

**设计理念**：
- 不同角色有不同需求
- 时间投入和产出匹配
- 质量标准一致（都能做出正确决策）

**路径特点**：
| 路径 | 时间 | 深度 | 适用场景 | 输出质量 |
|---|---|---|---|---|
| 路径1 | 30分钟 | 浅 | 快速决策 | 决策准确 |
| 路径2 | 2小时 | 中 | 质量评估 | 全面客观 |
| 路径3 | 4-8小时 | 深 | 深度理解 | 专家级 |

---

### 2. 分阶段评估机制

**阶段设计**：
```
准备阶段 → 评估阶段 → 决策阶段 → 执行阶段
    ↓           ↓           ↓           ↓
  明确目标   收集数据   做出判断   采取行动
```

**每个阶段**：
- 有明确的输入和输出
- 有检查点验证完成度
- 可以回溯到上一阶段

---

### 3. 量化决策机制

**量化标准**：
- 路径1：3 个二元问题（是/否）
- 路径2：4 个维度评分（1-10）
- 路径3：7 个维度评分 + 5 个批判性问题

**决策规则**：
```
路径1: 3个"是" → 批准
路径2: ≥9分 → 强烈推荐
路径3: 综合判断（评分+批判性分析）
```

---

### 4. 递归改进机制

**改进循环**：
```
审查 → 发现问题 → 补充改进 → 重新审查
  ↑                                    ↓
  └────────────── 循环直到通过 ──────────┘
```

**终止条件**：
- 通过审查（批准启动）
- 决定不改进（暂停项目）
- 改进 3 次仍不通过（放弃）

---

### 5. 风险控制机制

**多层防护**：
1. **审查层**：3 种路径，多维度评估
2. **决策层**：量化标准，减少主观性
3. **执行层**：Phase -1 试点验证
4. **反馈层**：可以暂停、调整、重新审查

**止损机制**：
- 审查阶段：评分过低直接拒绝
- 改进阶段：评估改进价值，可放弃
- 执行阶段：Phase -1 失败可暂停

---

## ✅ 使用建议

### 选择路径的决策树

```mermaid
flowchart TD
    Start([需要审查]) --> Q1{我的角色是?}
    
    Q1 -->|决策者/管理层| Q2{有多少时间?}
    Q1 -->|技术负责人| Path2[选路径2<br/>标准质量审查]
    Q1 -->|专家/执行者| Path3[选路径3<br/>完整专家审查]
    
    Q2 -->|<1小时| Path1[选路径1<br/>快速决策审查]
    Q2 -->|≥1小时| Path2
    
    Path1 --> Action1[30分钟审查<br/>快速决策]
    Path2 --> Action2[2小时审查<br/>全面评估]
    Path3 --> Action3[4-8小时审查<br/>深度理解]
    
    Action1 --> Result{决策}
    Action2 --> Result
    Action3 --> Result
    
    Result -->|不确定| Upgrade[升级到更深路径]
    Result -->|明确| Done([审查完成])
    
    Upgrade --> Path2
    Upgrade --> Path3
    
    style Start fill:#e1f5e1
    style Done fill:#e1f5e1
    style Path1 fill:#cfe2ff
    style Path2 fill:#e7f3ff
    style Path3 fill:#f0f8ff
```

---

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**工具**：Mermaid 流程图  
**配合文档**：REVIEW-EXECUTION-WORKFLOW.md
