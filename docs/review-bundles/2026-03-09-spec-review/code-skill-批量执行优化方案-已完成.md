# Code Skill 批量执行优化方案

> **版本**: 2.2.0
> **日期**: 2026-03-09
> **状态**: 设计+执行指南
> **作者**: Claude (Opus 4.6)
> **核心变更**: 批量模式为默认 + 精简配置 + 分离格式定义

---

## 一、问题与方案

### 1.1 核心问题

**用户期望**：`/spec-first:code` 自动完成所有 TASK
**实际行为**：只完成一个 TASK，需手动继续

**关键洞察**：单 TASK 是实现细节，不应暴露给用户

### 1.2 解决方案

**批量模式为默认行为**

**核心机制**：
1. 依赖图解析 + 拓扑排序分层
2. 逐层执行，层内并发（通过 Agent tool）
3. 失败率控制（> 50% 停止）

### 1.3 触发条件

**自动批量执行**：
- 用户执行 `/spec-first:code` 且 task_plan.md 中有多个 todo 状态的 TASK
- orchestrate 调度到 code skill 时

**单任务模式**（降级）：
- 用户明确指定 `task-id` 参数
- 只有单个 TASK 需要执行

---

## 二、技术设计

### 2.1 依赖关系解析

**拓扑排序分层**：
```
Layer 0: 无依赖的 TASK
Layer 1: 仅依赖 Layer 0 的 TASK
Layer N: 仅依赖 Layer 0~N-1 的 TASK
```

**示例**：
```yaml
TASK-VIS-001: depends_on: []
TASK-INT-001: depends_on: [TASK-VIS-001]
TASK-VIZ-001: depends_on: [TASK-VIS-001]
TASK-LAY-001: depends_on: [TASK-VIS-001]

# 分层结果
Layer 0: [TASK-VIS-001]
Layer 1: [TASK-INT-001, TASK-VIZ-001, TASK-LAY-001]  # 并发
```

### 2.2 并发执行机制

**通过 Agent tool 实现真正并发**：
```javascript
// 对 Layer 1 的每个 TASK
Agent({
  subagent_type: "implement",
  prompt: "执行 TASK-INT-001，上下文：见 references/context-pack-schema.yaml",
  run_in_background: true
});
```

**上下文隔离**（每个 subagent < 2KB）：
- ✅ 当前 TASK + 关联 FR/DS + constitution
- ❌ 其他 TASK 日志、无关 spec/design

**上下文包格式**：见 `references/context-pack-schema.yaml`

### 2.3 失败处理

**失败率控制**：
- 当前层完成后评估失败率
- 失败率 > 50%: 停止
- 失败率 ≤ 50%: 继续，跳过失败 TASK 的下游

---

## 三、执行流程（检查清单格式）

### P0: 解析依赖

- [ ] 读取 task_plan.md，提取所有 todo 状态的 TASK
- [ ] 构建依赖图（邻接表）
- [ ] 检测循环依赖（如有则报错并终止）
- [ ] 拓扑排序分层
- [ ] 输出分层结果供用户确认

### P1: 逐层执行

对每一层（Layer 0, 1, 2...）：

- [ ] 识别就绪的 TASK（depends_on 已满足）
- [ ] 限制并发数（从 config.yaml 读取 max_parallel，默认 2）
- [ ] 为每个 TASK 启动 subagent：
  - 打包上下文（< 2KB）：见 references/context-pack-schema.yaml
  - 设置 run_in_background: true
  - 传递 TDD 守卫要求
- [ ] 等待当前层所有 subagent 完成
- [ ] 收集执行结果（成功/失败）
- [ ] 计算失败率 = 失败数 / 总数
- [ ] 如果失败率 > 50%: 停止并生成报告（见 references/report-template.md）
- [ ] 否则：继续下一层

### P2: 结果汇总

- [ ] 统计总体成功/失败/跳过数
- [ ] 更新所有 TASK 状态到 task_plan.md
- [ ] 生成执行报告（见 references/report-template.md）

---

## 四、实施路径

### 阶段 1：串行执行 + 依赖解析（1 周）

**目标**：验证 AI 自主循环可靠性

**关键任务**：
- 依赖图解析 + 拓扑排序分层
- 串行执行（不并发）
- 循环依赖检测

**验收**：能正确解析依赖并串行执行所有 TASK

### 阶段 2：失败处理 + 进度追踪（1 周）

**目标**：完善用户体验

**关键任务**：
- 失败率控制（> 50% 停止）
- 进度追踪显示
- 执行报告生成

**验收**：失败率控制生效，报告格式规范

### 阶段 3：并发支持（1 周）

**目标**：提升执行效率

**关键任务**：
- Agent tool 集成（run_in_background）
- 上下文隔离和打包（< 2KB）
- 并发数限制（max_parallel）

**验收**：同层 TASK 能并发执行，上下文包符合限制

---

## 五、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI 自主循环不可靠 | 高 | 检查清单格式 + 强制检查点 |
| 上下文包过大 | 中 | 严格 2KB 限制 + 测试验证 |
| API 限流 | 中 | max_parallel=2 + 指数退避 |
| 循环依赖 | 高 | 启动前检测 + 报错阻断 |

**降级策略**：
```
批量并发模式（理想）
  ↓ API 限流
批量串行模式（降级）
  ↓ 仍失败
手动逐个执行（兜底）
```

---

## 附录

### A. 参考文件

- `references/context-pack-schema.yaml` - 上下文包格式定义
- `references/report-template.md` - 执行报告模板
- `config.yaml` - 运行时配置（max_parallel, stop_on_failure_rate 等）

---
