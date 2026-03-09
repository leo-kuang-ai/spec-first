---
name: "spec-first:code"
description: "执行代码实现（自动批量执行所有 TASK）。支持依赖关系解析、并发执行、失败率控制。使用场景：完成 Feature 的所有 TASK 实现。"
version: 2.0.0
last_updated: 2026-03-09
changelog: |
  v2.0.0: 完全重写为批量模式，支持依赖解析、并发执行、失败率控制
  v1.1.0: 单 TASK 模式（已废弃）
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep, Agent"
---

# Skill: code (批量模式)

按 TASK 规格批量实现代码，自动关联追踪链路。

## Announce at Start

```
I'm using the code skill (batch mode) to implement all tasks for [Feature ID].
Detected [N] tasks across [M] layers.
```

## 触发条件

**自动批量执行**：
- 用户执行 `/spec-first:code` 且 task_plan.md 中有多个 todo 状态的 TASK
- orchestrate 调度到 code skill 时

**单任务模式**（降级）：
- 用户明确指定 `task-id` 参数
- 只有单个 TASK 需要执行

**Command**: `/spec-first:code [task-id]`

## 字面即精神原则

**Violating the letter of these rules is violating the spirit of these rules.**

批量模式不改变守卫原则，只改变执行方式。

### 反合理化守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "批量模式可以跳过某些检查" | 批量 = 多次单任务，每个守卫仍然生效 |
| "并发执行时可以放松 TDD" | TDD 守卫在每个 subagent 内部独立执行 |
| "失败率 < 50% 可以继续" | 失败率控制是最低线，不是目标 |
| "上下文包稍微超 2KB 没关系" | 2KB 是硬限制，超过会污染上下文窗口 |

## 三层守卫架构

### 第一层：全局入口守卫（P0 执行前）

- [ ] **HARD-GATE**：阶段 = 04_implement + design.md 存在 + 至少 1 个 todo TASK
- [ ] **循环依赖检测**：构建依赖图后检测，发现即阻断
- [ ] **TDD 预检**：统计缺少 RED 证据的 TASK，> 50% 则阻断
- [ ] **文件冲突检测**：分析同层 TASK 的 changeAreas，有重叠则降级串行
- [ ] **Worktree 建议**：批量执行属于高风险，建议 worktree 隔离

### 第二层：每个 TASK 独立守卫（subagent 内部）

- [ ] **TDD 强制守卫**：必须有 RED 证据或 WAIVER，否则标记 blocked
- [ ] **Simplicity First**：禁止预埋抽象、配置、扩展点
- [ ] **Surgical Changes**：只修改当前 TASK 直接需要的代码
- [ ] **3-Strike Protocol**：同类错误 3 次后升级到架构审查
- [ ] **上下文包大小**：< 2KB 限制

## 执行流程（检查清单格式）

### P0: 解析依赖与前置守卫

- [ ] 定位 Feature（优先读取 `.spec-first/current`）
- [ ] 校验阶段为 04_implement
- [ ] 校验 design.md 存在
- [ ] 读取 task_plan.md，提取所有 todo 状态的 TASK
- [ ] 如果只有 1 个 TASK 或指定 task-id：降级到单任务模式
- [ ] 构建依赖图（邻接表）
- [ ] 检测循环依赖（如有则报错并终止）
- [ ] 拓扑排序分层
- [ ] TDD 预检：统计缺少 RED 证据的 TASK，> 50% 则阻断
- [ ] 文件冲突检测：分析同层 TASK 的 changeAreas，有重叠则标记
- [ ] 输出执行计划（分层结果 + 并发/串行标记）
- [ ] 用户确认执行计划

### P1: 逐层执行

对每一层（Layer 0, 1, 2...）：

- [ ] 识别就绪的 TASK（depends_on 已满足）
- [ ] 检查依赖传递：Layer 0~N-1 的依赖是否都成功
- [ ] 读取 config.yaml 获取 max_parallel（默认 2）
- [ ] 检查当前层是否有文件冲突标记，有则强制串行
- [ ] 为每个 TASK 启动 subagent：
  - 打包上下文（< 2KB）：见 references/context-pack-schema.yaml
  - 设置 subagent_type: "implement"
  - 设置 run_in_background: true（并发）或 false（串行）
  - 传递 TDD 守卫要求
- [ ] 等待当前层所有 subagent 完成
- [ ] 收集执行结果（成功/失败/blocked）
- [ ] 计算失败率 = 失败数 / 总数
- [ ] 如果失败率 > 50%: 停止并生成报告
- [ ] 如果检测到 API 429 错误：降级为串行模式
- [ ] 写入 checkpoint（todo-state.json）
- [ ] 更新 findings.md（当前层结果）
- [ ] 继续下一层（如果未达到 max_layers）

## Subagent 上下文包规范

每个 subagent 接收的上下文必须 < 2KB，包含：

**必需信息**：
- 当前 TASK 完整定义（id, title, description, acceptance_criteria）
- 关联的 FR 摘要（仅相关段落，非全文）
- 关联的 DS 摘要（仅相关段落，非全文）
- Constitution 约束（仅适用于当前 TASK 类型的约束）
- TDD 要求（RED 证据或 WAIVER 要求）
- 依赖状态（"依赖 TASK-XXX 已完成"，不传递实现细节）

**禁止包含**：
- 其他 TASK 的执行日志
- 完整的 spec.md / design.md
- 前序 TASK 的代码 diff
- 无关的 FR/DS 章节

**格式定义**：见 `references/context-pack-schema.yaml`

## Subagent 执行协议

每个 subagent 必须遵循的流程：

1. **TDD 守卫检查**：验证 RED 证据或 WAIVER，否则返回 blocked
2. **加载上下文**：读取关联 FR/DS/Constitution
3. **生成代码**：按规格生成最小实现
4. **注入 traces**：在文件末尾添加 traces trailer
5. **运行测试**：验证 GREEN
6. **返回结果**：success/failure/blocked + 错误信息

## 失败处理与恢复

### 失败分类

| 失败类型 | 处理方式 | 影响范围 |
|---------|---------|---------|
| 前置守卫失败 | 立即阻断，不启动任何 TASK | 全局 |
| TDD 守卫失败 | 标记 blocked，跳过下游 TASK | 当前 TASK + 下游 |
| 代码生成失败 | 标记 blocked，记录失败原因 | 当前 TASK + 下游 |
| 层级失败率 > 50% | 停止后续层，生成报告 | 后续所有层 |

### 恢复策略

- 失败的 TASK 保持 todo 状态（便于重试）
- findings.md 记录失败原因和建议操作
- 用户修复后可以重新执行（自动跳过已完成 TASK）
- 成功的 TASK 不回滚

## 并发执行安全性

### 文件冲突检测

P0 阶段分析每个 TASK 的 likelyChangeAreas：
- 检测同层 TASK 是否有文件重叠
- 有重叠：标记该层为"强制串行"
- 无重叠：允许并发执行

### 状态更新串行化

- 每个 subagent 完成后，由主进程统一更新 task_plan.md
- 禁止 subagent 直接写入共享文件
- 使用原子写入避免竞争

### API 限流保护

- max_parallel 默认 2（保守策略）
- 检测到 429 错误：自动降级为串行
- 失败时指数退避重试（1s, 2s, 4s）

### 依赖传递保证

Layer N 执行前检查：
- Layer 0~N-1 的所有依赖是否成功
- 任一依赖失败：跳过该 TASK 及其下游

## 降级策略

```
批量并发模式（理想）
  ↓ 文件冲突检测到重叠
批量串行模式（降级 1）
  ↓ API 限流 429 错误
批量串行 + 指数退避（降级 2）
  ↓ 失败率 > 50%
停止并生成报告（兜底）
```

## 单任务模式（降级分支）

当满足以下条件时，自动降级到单任务模式：
- 只有 1 个 todo 状态的 TASK
- 用户明确指定 task-id 参数

## 配置参数

从 `config.yaml` 读取：

```yaml
runtime:
  code:
    max_parallel: 2  # 并发数限制
    stop_on_failure_rate: 0.5  # 失败率阈值
    context_pack_size: 2048  # 上下文包大小限制（字节）
    task_timeout_ms: 300000  # 单个 TASK 超时（5 分钟）
    max_layers: 10  # 最大层数限制
```

## CLI 依赖

- `spec-first stage current`
- `spec-first id next TC <abbr> --feature <featureId> --level <UT|IT|E2E|ST>`
- `spec-first matrix update <featureId> <tcId> --upstream <frId>`

## 输出路径

- 源代码文件（按 TASK 规格）
- `specs/{featureId}/task_plan.md`（批量更新）
- `specs/{featureId}/findings.md`（每层追加）
- `specs/{featureId}/todo-state.json`（checkpoint）
- `specs/{featureId}/batch-report.md`（执行报告）

## 确认策略

- 推荐: strict（批量执行属于高风险操作）

## 成功标准

- 所有 TASK 状态已更新（done/blocked）
- findings.md 记录每层执行结果
- todo-state.json 包含完整 checkpoint
- 执行报告已生成
- 无循环依赖
- 失败率 ≤ 50%

## 参考文件

- `references/context-pack-schema.yaml` - 上下文包格式
- `references/report-template.md` - 执行报告模板
- `references/tdd-guard.md` - TDD 守卫详细说明
- `references/traces-trailer.md` - Traces 注入规范

## 执行计划输出格式（P0 阶段）

```markdown
## 批量执行计划

**Feature**: {featureId}
**总 TASK 数**: {total}
**分层数**: {layers}
**预计并发**: {concurrentLayers} 层并发，{serialLayers} 层串行

### 分层详情

#### Layer 0（无依赖）
- TASK-VIS-001: 视觉层次优化 [并发]
  - 关联: FR-VIS-001, DS-VIS-001
  - 预计文件: src/components/layout.tsx
  - TDD 状态: ✅ RED 证据已存在

#### Layer 1（依赖 Layer 0）
- TASK-INT-001: 交互体验提升 [并发]
  - 依赖: TASK-VIS-001
  - 关联: FR-INT-001, DS-INT-001
  - 预计文件: src/components/button.tsx
  - TDD 状态: ✅ RED 证据已存在

- TASK-VIZ-001: 数据可视化增强 [串行 - 文件冲突]
  - 依赖: TASK-VIS-001
  - 关联: FR-VIZ-001, DS-VIZ-001
  - 预计文件: src/components/layout.tsx (冲突)
  - TDD 状态: ⚠️ 缺少 RED 证据

- TASK-LAY-001: 整体布局优化 [并发]
  - 依赖: TASK-VIS-001
  - 关联: FR-LAY-001, DS-LAY-001
  - 预计文件: src/pages/home.tsx
  - TDD 状态: ✅ RED 证据已存在

### 风险提示

- ⚠️ Layer 1 检测到文件冲突：TASK-VIZ-001 将串行执行
- ⚠️ 1 个 TASK 缺少 TDD 证据（< 50%，允许继续）
- ℹ️ 建议在 worktree 中执行（批量操作属于高风险）

### 配置

- max_parallel: 2
- stop_on_failure_rate: 0.5
- max_layers: 10
```

## 最佳实践

### 批量执行前准备

1. **补充 TDD 证据**：确保 > 50% TASK 有 RED 证据
2. **检查依赖关系**：确保 depends_on 字段正确
3. **使用 worktree**：批量操作建议隔离环境
4. **备份当前状态**：`git stash` 或提交当前工作

### 执行中监控

- 观察每层的失败率
- 检查 findings.md 的实时更新
- 注意 API 限流警告

### 执行后验证

- 检查执行报告（batch-report.md）
- 验证所有成功 TASK 的测试通过
- 审查失败 TASK 的错误信息
- 确认 traces trailer 已正确注入

## 常见问题

**Q: 批量执行中途失败，如何恢复？**
A: 重新执行 `/spec-first:code`，会自动跳过已完成的 TASK

**Q: 如何强制串行执行？**
A: 在 config.yaml 中设置 `max_parallel: 1`

**Q: 如何只执行单个 TASK？**
A: 使用 `/spec-first:code --task-id TASK-XXX`

**Q: 失败率刚好 50%，会停止吗？**
A: 不会，只有 > 50% 才停止

**Q: 如何查看详细的执行日志？**
A: 查看 `specs/{featureId}/findings.md` 和 `todo-state.json`

