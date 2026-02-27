---
name: "spec-first:code"
description: "定位进行中的 TASK 并执行代码实现"
version: 1.0.0
last_updated: 2026-02-27
changelog: Initial version with standardized metadata
---

# Skill: code

按 TASK 规格实现代码，自动关联追踪链路。

## 字面即精神原则

**Violating the letter of these rules is violating the spirit of these rules.**

### 字面即精神反合理化表

| AI 的借口 | 封堵 |
|-----------|------|
| "我理解核心思想，可以灵活执行" | 字面规则的违反就是精神的违反，不存在灵活变通 |
| "这是精神而非仪式" | 仪式（字面规则）是精神的体现，跳过仪式就是违背精神 |
| "实质重于形式" | 在流程守卫上，形式（字面规则）= 实质（精神） |
| "具体情况具体分析" | 规则已考虑常见情况，例外需明确讨论而非自行变通 |

## 反合理化守卫

当你产生以下念头时，立即停止并回到流程：

| AI 的借口 | 封堵 |
|-----------|------|
| "这个改动太小，不需要走 code-review" | 小改动也有回归风险，review 耗时 < 2 分钟 |
| "我已经手动检查过了" | 手动检查 != 自动校验证据 |
| "先写完再补测试" | 事后测试证明不了什么，测试应与改动配套 |
| "这只是重构，不影响功能" | 重构不改行为 != 重构不引入 bug |
| "快速修一下，之后再调查" | 快速修复掩盖根因，系统化调试更快 |
| "我看到问题了，让我直接修" | 看到症状 != 理解根因 |
| "同时改多处，一起测试" | 无法隔离哪个改动有效，会引入新 bug |
| "再试一次修复"（已失败 2+ 次） | 3 次失败 = 架构问题，停止修复并升级 |
| "我记得刚才看到的内容" | 上下文会被压缩，记忆不可靠，重要信息必须落盘 |

## 上下文持久化规则

Context Window = RAM（易失、有限），Filesystem = Disk（持久、可恢复）。

压缩必须可恢复：即使丢弃内容，也要保留 URL / 文件路径 / ID 指针。

### Read/Write 决策矩阵

| 场景 | 决策 | 原因 |
|------|------|------|
| 刚写完一个文件 | 不立即重读 | 内容仍在当前上下文，可减少无效 I/O |
| 开始新 TASK | 先读 `task_plan.md` 与 `findings.md` | 重新定向上下文 |
| 浏览器/MCP 返回结果 | 立即写入 `findings.md` | 外部数据不持久 |
| 查看图片/PDF/网页 | 先摘要后写盘 | 多模态内容易在压缩时丢失 |
| 发生错误或测试失败 | 先读相关文件与最近变更 | 修复前必须确认当前状态 |
| 长间隔后恢复工作 | 读运行态文件再操作 | 防止基于旧记忆做错误修改 |

## 2-Action Rule（P1-04）

- 每连续完成 2 个关键动作（读外部信息、改代码、跑验证）后，必须把结论写入 `findings.md`
- 若中断会话，至少留下：当前 TASK、阻塞点、下一步命令
- 未落盘的信息一律视为不可靠上下文

## Worktree First（P1-16）

以下高风险操作默认建议在独立 worktree 中执行：
- 大范围重构（跨目录、多模块）
- 可能影响发布分支稳定性的变更
- 需要并行验证多个修复方案的变更

最小建议流程：
1. `git worktree add ../worktree-<TASK-ID> <branch>`
2. 在独立 worktree 中实现与验证
3. 验证通过后再合并回主工作区

## 调试流程（测试失败时）

铁律：NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

| 阶段 | 关键活动 | 成功标准 |
|------|---------|---------|
| 1. 根因调查 | 读错误、复现、检查近期变更、追踪数据流 | 理解 WHAT 与 WHY |
| 2. 模式分析 | 找到可工作的类似实现并对比差异 | 差异点可定位 |
| 3. 假设验证 | 单一假设、最小实验、一次只改一个变量 | 假设被确认或被否定 |
| 4. 实现修复 | 先失败测试，再单一修复，再全量验证 | 问题关闭且无回归 |

硬规则：同类修复失败 3 次后必须停止并升级到架构审查。

## 3-Strike Error Protocol（P1-05）

- 同类错误连续失败 3 次后，禁止继续“再试一次”
- 必须升级到架构审查或方案重设计
- 升级动作与结论必须写入 `findings.md`

## 触发条件
- 阶段: 04_implement
- Command: `/spec-first:code`

## HARD-GATE 入口守卫（P1-19）

<HARD-GATE>
NO code changes until prerequisites are verified.

进入 code 前必须满足：
- 当前阶段为 `04_implement`
- 当前 Feature 存在 `design.md`
- `task_plan.md` 至少有 1 条 `in_progress` TASK

任一前置条件失败即停止：返回阻断原因，不得继续写代码。
</HARD-GATE>

## 执行阶段
- P0: 定位 Feature，校验阶段为 04_implement，从 task_plan.md 定位当前进行中的 TASK
- P1: 加载 TASK 上下文、关联的 FR/DS、constitution 约束
- P2: 按规格约束生成实现代码
- P3: 与用户确认代码变更（diff 预览，必须包含固定字段）
- P4: 写入代码文件，更新 task_plan.md 中 TASK 状态
- P5: 自动注入 traces trailer，更新 findings.md

## P3 diff 预览模板（固定字段）

- 变更文件清单（新增/修改/删除）
- 每个文件的关联 TASK/FR/DS
- 风险标注（行为变更、兼容性、回滚点）
- 拟执行验证命令列表

## CLI 依赖
- `spec-first commit`
- `spec-first matrix update`
- `spec-first ai context`

## 输出路径
- 源代码文件（按 TASK 规格）
- `specs/{featureId}/task_plan.md`

## 确认策略
- 推荐: strict（Mode N）/ assisted（Mode I）

## 成功标准
- 代码文件已写入，符合 TASK 规格和 DS 约束
- `task_plan.md` 中对应 TASK 状态更新为 `complete` 或 `verified`
- `spec-first commit` 已执行，traces trailer 已注入

## 示例（P2 输出格式）

```markdown
### TASK-AUTH-002: 短信发送 API

**文件**: `src/api/auth/sms/send-otp.ts`
**变更摘要**: 新增 POST /api/auth/sms/send-otp 端点
**关联**: FR-AUTH-001 → DS-AUTH-001
**代码**:
（展示完整实现代码，用户确认后写入）
```
