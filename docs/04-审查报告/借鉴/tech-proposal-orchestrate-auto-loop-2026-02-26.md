# Spec-First 技术方案（独立版）：Ralph Loop / `orchestrate --auto`

- 日期：2026-02-26
- 目标：为 Spec-First 增加可恢复的自迭代执行能力，减少多 TASK 场景下的人工反复触发
- 适用范围：`/spec-first:orchestrate` 主编排路径

---

## 1. 问题定义

当前编排是“单次触发”模型：

1. 一次执行后结束，无法持续推进剩余任务。
2. 多 TASK 场景需要用户重复触发。
3. 中断恢复有 `catchup`，但没有“自动续航执行”。

结论：缺少 Ralph Loop 对应的“自动迭代 + 持久化恢复 + 上限保护”闭环。

---

## 2. 方案目标

实现 `orchestrate --auto`（或等价的 skill 参数模式），满足：

1. 自动串行推进可执行 TASK。
2. 每轮持久化 checkpoint，可恢复。
3. 达到 `max_iterations` 自动停止，防止死循环。
4. 与 Hard-Gate / Confirm Policy / Gate 检查兼容。

---

## 3. MVP 方案（推荐先落地）

### 3.1 新增运行态文件

`specs/{featureId}/orchestrate-auto-state.json`

建议字段：

```json
{
  "featureId": "FSREQ-...",
  "status": "running",
  "iteration": 0,
  "maxIterations": 20,
  "currentTaskId": "TASK-...",
  "lastCheckpointAt": "2026-02-26T00:00:00.000Z",
  "haltReason": ""
}
```

### 3.2 迭代主循环

```text
加载 feature + hard-gate
  -> 加载/初始化 todo-state
  -> 读取 maxIterations
  -> while 未超上限
       - pickReadyTodos(maxParallel=1)
       - 无可执行项 => done
       - 执行单轮任务（复用 orchestrate 现有步骤）
       - 写 task 状态与 checkpoint
       - advance iteration
  -> 若仍未完成 => halted(max_iterations)
```

### 3.3 停止条件

1. 所有任务完成：`done`
2. 出现阻塞：`halted(blocked)`
3. 达到上限：`halted(max_iterations)`

### 3.4 恢复策略

1. 默认读取 `orchestrate-auto-state.json` + `todo-state.json`
2. `--resume` 强制从断点恢复
3. `catchup` 增加 auto-loop 状态摘要

---

## 4. 兼容与约束

### 4.1 Confirm Policy

1. `strict`：每轮关键写入前仍需确认；拒绝则暂停自动循环。
2. `assisted/auto`：按既有策略执行。

### 4.2 Hard-Gate

每轮执行前调用 `evaluateSkillHardGate('orchestrate', projectRoot)`：

1. `BLOCKED`：立即停止，写入 `haltReason`
2. `PASS/WARN`：继续

### 4.3 质量证据链

1. 每轮完成后最小校验（任务级）
2. 阶段推进前仍走完整 verify 证据链

---

## 5. 配置建议

最小配置沿用现有：

```yaml
runtime:
  max_iterations: 20
```

可选后续扩展：

```yaml
runtime:
  auto_orchestrate:
    stop_on_blocked: true
    checkpoint_file: orchestrate-auto-state.json
```

---

## 6. 风险与控制

1. 风险：无限循环
- 控制：`max_iterations` 硬上限 + halted 原因记录

2. 风险：假完成
- 控制：后续增强“完成检测”规则（MVP 暂不引入复杂判定）

3. 风险：中途异常导致状态不一致
- 控制：每轮前后都写 checkpoint，异常保留现场可恢复

---

## 7. 实施拆解

### Phase A（MVP）

1. 增加 `--auto/--resume` 参数入口
2. 接入 `todo-runner` 串行循环
3. 新增 `orchestrate-auto-state.json`
4. 打通 `halted/done` 输出

### Phase B（增强）

1. 连续无进展检测
2. 假完成检测
3. 更细粒度错误分类与自动降级

---

## 8. 验收标准

1. 单次触发可自动推进多个 TASK。
2. 中断后可恢复继续。
3. 达到上限可安全停止并输出未完成摘要。
4. 关键测试通过（建议新增）：
- `orchestrate-auto-loop` 正常路径
- `resume` 恢复路径
- `max_iterations` 停止路径
- `blocked` 停止路径

---

## 9. 价值结论

该方案优先补齐“执行可靠性”短板，价值明确：

1. 减少人工反复触发
2. 提升长链路任务完成率
3. 提供可恢复、可审计的自动执行闭环

建议：按 MVP 先落地，再迭代增强。
