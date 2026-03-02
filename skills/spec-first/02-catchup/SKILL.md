---
name: "spec-first:catchup"
description: "定位当前 Feature 并恢复上下文"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: catchup

恢复会话上下文，生成恢复报告帮助快速续接工作。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:catchup`

## 执行阶段
- P0: 从 `.spec-first/current` 定位当前 Feature
- P1: 加载 `stage-state.json`、`task_plan.md`、`findings.md`
- P2: 生成 6 步恢复报告（阶段、任务、发现、缺失文件、风险、建议）
- P3: 执行 5-Question Reboot Test，验证恢复质量
- P4: 将恢复结果写入 findings.md
- P5: 无副作用

## 5-Question Reboot Test（P1-06）

恢复输出必须回答以下 5 个问题：
1. 当前 Feature 与阶段是什么？
2. 当前 in_progress TASK 是什么？
3. 上次中断前最后一个有效结论是什么？
4. 当前最大阻塞是什么？
5. 下一步最小可执行命令是什么？

若任一问题无法回答，必须明确标记信息缺口并给出补齐动作。

## CLI 依赖
- `spec-first ai catchup`
- `spec-first stage current <featureId>`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: assisted（恢复摘要写入 findings.md）

## 成功标准
- 6 步恢复报告已生成（阶段、任务、发现、缺失文件、风险、建议）
- 5-Question Reboot Test 已逐项回答或标记缺口
- 用户确认后恢复摘要已追加到 `findings.md`
