# 编排规则

> Orchestrate Skill 的批次执行与状态机规则

---

## 批量执行与检查点

### 三批次模型

**Batch 1: 前置校验**
- 定位 Feature
- 加载 stage-state
- 加载覆盖率、Gate 历史
- 检查点：前置条件是否满足

**Batch 2: Skill 执行**
- 调度目标 Skill（spec/design/task/code/archive）
- 执行 Skill P0-P5
- 检查点：Skill 执行结果

**Batch 3: verify 与推进**
- 执行 verify
- Gate check
- 推进决策（PASS/FAIL）
- 检查点：是否可推进阶段

---

### 检查点输出

**格式**:
```markdown
## Batch N 检查点

✅ 已完成:
- 项目 1
- 项目 2

❌ 阻塞项:
- 阻塞原因 1
- 阻塞原因 2

➡️ 下一批入口条件:
- 条件 1
- 条件 2
```

---

### 阻塞处理

**规则**: 任一批次出现阻塞时，必须暂停并上报

**禁止**: "带病推进"

**示例**:
```
❌ Batch 1 阻塞

阻塞原因: spec.md 不存在

💡 解决方案:
运行 /spec-first:spec 生成需求规格

orchestrate 已暂停，等待用户处理。
```

---

## Todo 状态机

### 状态流转

```
pending → in_progress → done
            ↓
          blocked
```

**状态说明**:
- `pending`: 等待依赖满足
- `in_progress`: 正在执行
- `done`: 已完成（legacy: `complete`/`verified`）
- `blocked`: 遇到阻塞

---

### 自动拾取规则

**触发**: 依赖全部满足时

**优先级**:
1. 恢复 `in_progress` 项
2. 按依赖拓扑拾取 `pending` 项

---

### 终止条件

**正常结束**: 所有 TASK 达到 `done`

**超限终止**: 达到 `max_iterations`（来自 `config.yaml`）

**持久化**: `specs/{featureId}/todo-state.json`

---

## 并行语义

**`[P]` 标记**: 任务可并行调度

**规则**:
- 依赖满足时可并行
- 每个 TASK 独立证据链
- 每个 TASK 独立验收

**示例**:
```
TASK-001: 实现登录接口
TASK-002: [P] 实现注册接口
TASK-003: [P] 实现找回密码接口
```

---

## 上下文裁剪

### Fresh Context Per Task

**提供**:
- 当前 TASK 全文
- 关联的 FR/NFR
- 相关 DS/API

**不提供**:
- 前一个 TASK 的执行日志
- 其他 TASK 的调试信息
- 无关的 spec/design 章节
- 已完成 TASK 的代码 diff

**控制**: 每个 TASK 上下文包 < 2KB

---

## 证据铁律

**规则**: 阶段推进前必须执行证据链

**步骤**:
1. 执行 `spec-first gate check <featureId>`
2. 执行 `spec-first matrix check`
3. 执行 `spec-first metrics coverage`
4. 明确读取并报告退出码
5. 仅当证据为本次会话新鲜执行结果时，才允许 `stage advance`

---

## 反合理化守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "先把后续批次跑完再统一看" | 无检查点就不可审计，必须批次收口后再继续 |
| "这个阻塞先忽略，后面一起修" | 阻塞项不清零不得推进批次 |
| "只要大方向没问题就能 advance" | `stage advance` 只能基于证据铁律，不接受方向性判断 |

---

## 文件系统即外部记忆

**规则**: 每完成 2 个关键动作后，必须更新 `findings.md`

**关键动作**:
- 批次执行
- 检查点判定
- 阻塞处置

**最小落盘**:
- 当前批次
- 已完成项
- 阻塞项
- 下一批入口条件

**中断前必须写入**:
- 当前批次
- 未完成 TASK
- 恢复入口命令


## 背景状态与依赖强度
- `full`: 存在并成功读取匹配背景
- `degraded`: 存在部分背景，但所需 runtime 资产或 docs 输出不完整
- `blind`: 缺少足够背景输入
- `L1`: 推荐
- `L2`: 强烈推荐
- `L3`: 事实门槛；仅当 `02_design / 04_implement / 05_verify` 检测到高风险信号时触发
- 高风险信号复用 `hard-gate` 评估：并行任务标记、跨目录变更、核心模块变更
- `risk_category` 与阶段绑定：`02_design -> formal-design-review`、`04_implement -> high-risk-implementation`、`05_verify -> pre-release-verification`
- `blind` + `L2/L3` 时，优先动作必须是 `backfill-first`
- 检测到高风险信号时，运行时上下文追加 `risk_category` 与 `risk_signals`
