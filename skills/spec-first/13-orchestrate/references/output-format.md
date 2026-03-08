# 编排输出格式

> Orchestrate Skill 的输出消息与格式模板

---

## 编排计划输出

### 标准格式

```markdown
📋 编排计划

Feature: {featureId}
当前阶段: {currentStage}

执行序列:
1. Batch 1: 前置校验
   - 加载 stage-state
   - 加载覆盖率数据
   - 检查 Gate 历史

2. Batch 2: Skill 执行
   - 调度: {targetSkill}
   - 预期产出: {artifacts}

3. Batch 3: verify 与推进
   - 执行 verify
   - Gate check
   - Stage advance

是否确认并开始执行？[Y/n]
```

---

## 检查点输出

### Batch 1 检查点

```markdown
## ✅ Batch 1 完成: 前置校验

已完成:
- ✅ Feature 定位成功
- ✅ stage-state.json 已加载
- ✅ 覆盖率数据已加载

阻塞项: (无)

➡️ 下一步: 进入 Batch 2 (Skill 执行)
```

---

### Batch 2 检查点

```markdown
## ✅ Batch 2 完成: Skill 执行

已完成:
- ✅ 调度 03-spec Skill
- ✅ spec.md 已生成
- ✅ FR 已注册到追溯矩阵

阻塞项: (无)

➡️ 下一步: 进入 Batch 3 (verify 与推进)
```

---

### Batch 3 检查点

```markdown
## ✅ Batch 3 完成: verify 与推进

已完成:
- ✅ verify 校验通过
- ✅ gate check PASS
- ✅ stage advance 成功

当前阶段: 02_design

orchestrate 执行完成。
```

---

## 阻塞输出

### Batch 阻塞

```markdown
## ❌ Batch 1 阻塞

阻塞原因:
- spec.md 不存在

💡 解决方案:
运行 /spec-first:spec 生成需求规格

orchestrate 已暂停，等待用户处理。
```

---

### 子 Skill 失败

```markdown
## ❌ 子 Skill 失败

Skill: 04-design
阶段: P5
错误: gate check 未通过

详细信息:
- C1 (Design Coverage): 0%
- 原因: 所有 FR 都无 DS 映射

orchestrate 已终止，已完成的产出物保留。
```

---

## 成功输出

```markdown
✅ orchestrate 执行完成

Feature: FSREQ-20260305-AUTH-001
起始阶段: 01_specify
当前阶段: 02_design

执行摘要:
- Batch 1: 前置校验 ✅
- Batch 2: 03-spec 执行 ✅
- Batch 3: verify 与推进 ✅

产出物:
- specs/FSREQ-20260305-AUTH-001/spec.md
- specs/FSREQ-20260305-AUTH-001/traceability-matrix.md

💡 下一步:
运行 /spec-first:design 开始技术设计
```

---

## 超限终止输出

```markdown
⚠️ orchestrate 超限终止

已执行: 50 次迭代
上限: 50 次（来自 config.yaml）

未完成 TASK:
- TASK-005: 实现支付接口
- TASK-006: 实现退款接口

💡 建议:
1. 检查阻塞原因
2. 调整 max_iterations 配置
3. 手动完成剩余 TASK
```

---

## 中断恢复输出

```markdown
🔄 检测到中断恢复

上次中断:
- 批次: Batch 2
- 未完成 TASK: TASK-003, TASK-004

恢复策略:
1. 优先恢复 in_progress 项
2. 按依赖拓扑拾取 pending 项

是否继续执行？[Y/n]
```


## 背景治理输出

当 orchestrate 检测到背景治理信号时，输出应包含：

```
background_status: blind
dependency_strength: L2
recommended_action: backfill-first
warning: 缺少足够背景输入，建议先执行 /spec-first:first 补齐 runtime 真源
```

当高依赖阶段叠加高风险信号时，应输出：

```
background_status: degraded
dependency_strength: L3
recommended_action: review-risk
risk_category: formal-design-review
risk_signals: 存在并行任务标记
warning: 背景输入不完整，且当前属于正式设计评审门槛，并存在高风险信号（存在并行任务标记），建议显式评估风险后再继续当前阶段
```

其中 `risk_category` 取值按阶段细分：
- `formal-design-review`：正式设计评审前
- `high-risk-implementation`：复杂实现 / 高风险改动
- `pre-release-verification`：上线前 / 高风险验证

当背景完整且仅为 `L1` 场景时，可输出：

```
background_status: full
dependency_strength: L1
recommended_action: proceed
```
