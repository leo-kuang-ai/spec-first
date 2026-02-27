---
name: "spec-first:orchestrate"
description: "定位 Feature 并加载当前状态执行编排"
version: 1.0.0
last_updated: 2026-02-27
changelog: Initial version with standardized metadata
---

# Skill: orchestrate

编排调度器，驱动 plan -> skill -> verify -> advance 全流程。

## 触发条件
- 阶段: 任意（主编排 Skill）
- Command: `/spec-first:orchestrate`

## 文件系统即外部记忆（统一约束）

- 每完成 2 个关键动作（批次执行、检查点判定、阻塞处置）后，必须更新 `findings.md`。
- 每个批次结束必须落盘：已完成项、阻塞项、下一批入口条件。
- 中断前至少写入：当前批次、未完成 TASK、恢复入口命令。

## 编排流程决策图（Superpowers P1-2）

```dot
digraph orchestrate_flow {
  rankdir=TB;
  node [shape=box];

  Start [label="开始 orchestrate"];
  Start -> Batch1 [label="定位 Feature"];

  subgraph cluster_batch1 {
    label="Batch 1: 前置校验";
    Batch1 [label="前置校验与上下文准备"];
    Batch1 -> Checkpoint1 [label="完成"];
    Checkpoint1 [label="检查点: 已完成项/阻塞项"];
  }

  Checkpoint1 -> Batch2 [label="无阻塞"];
  Checkpoint1 -> Pause1 [label="有阻塞"];

  Pause1 [label="暂停并上报"];
  Pause1 -> End [label="等待用户处理"];

  subgraph cluster_batch2 {
    label="Batch 2: Skill 执行";
    Batch2 [label="调度目标 Skill"];
    Batch2 -> SkillExec [label="skill=spec/design/task/code"];
    SkillExec [label="执行 Skill P0-P5"];
    SkillExec -> Checkpoint2 [label="完成"];
    Checkpoint2 [label="检查点: 执行结果"];
  }

  Checkpoint2 -> Batch3 [label="成功"];
  Checkpoint2 -> Pause2 [label="失败"];

  Pause2 [label="暂停并上报"];
  Pause2 -> End;

  subgraph cluster_batch3 {
    label="Batch 3: verify 与推进";
    Batch3 [label="执行 verify"];
    Batch3 -> AdvanceDecision [label="verify 完成"];
    AdvanceDecision [label="推进决策"];
  }

  AdvanceDecision -> StageAdvance [label="PASS/PASS_WITH_WAIVER"];
  AdvanceDecision -> Replan [label="FAIL"];

  Replan [label="返回修复"];
  Replan -> Batch2;

  StageAdvance [label="stage advance"];
  StageAdvance -> Done [label="阶段推进成功"];

  Done [label="完成"];
  End [label="结束"];
}
```

## 执行阶段
- P0: 定位 Feature，加载当前阶段与状态
- P1: 加载 stage-state、覆盖率、Gate 历史、任务计划
- P2: 生成编排计划：plan -> skill 执行 -> verify -> stage advance
- P3: 与用户确认编排序列
- P4: 按序执行调度的子 Skill
- P5: Gate 通过后推进阶段

## 证据铁律（阶段推进）

在声明“阶段可推进”前，必须遵循 verify 的五步证据铁律：
- 先执行 `spec-first gate check <featureId>` 与必要的 `matrix/coverage` 命令
- 明确读取并报告退出码
- 仅当证据为本次会话新鲜执行结果时，才允许进入 `stage advance`

## 上下文裁剪规则（Fresh Context Per Task）

为每个 TASK 启动全新的 subagent 时，只提供：
1. 当前 TASK 全文（从 `task_plan.md` 提取）
2. 仅与当前 TASK traces 关联的 FR/NFR
3. 必要的设计上下文（相关 DS/API）

不传递：
- 前一个 TASK 的完整执行日志
- 其他 TASK 的调试信息
- 无关的 spec/design 章节
- 已完成 TASK 的代码 diff 与中间产物

Context Pack control：每个 TASK 的上下文包建议控制在 2KB 以内。

## `[P]` 并行语义

- `[P]` 表示任务在依赖满足时可并行调度
- `[P]` 是调度语义，不依赖 `orchestrate --auto`
- 即使并行调度，每个 TASK 仍需独立证据链与独立验收

## Todo 续航状态机（P1-10）

TASK 执行由 `todo-runner` 驱动，状态流转如下：

- `pending` → `in_progress`：依赖全部满足时自动拾取
- `in_progress` → `complete`：TASK 验收通过
- `in_progress` → `blocked`：遇到阻塞，暂停并上报
- 中断恢复：重启后优先恢复 `in_progress` 项，再按依赖拓扑拾取 `pending` 项

终止条件：
- 所有 TASK 达到 `complete`/`verified` → 正常结束
- 达到 `max_iterations`（来自 `config.yaml` 的 `runtime.max_iterations`）→ 自动 halt 并输出未完成摘要
- 持久化文件：`specs/{featureId}/todo-state.json`，支持跨会话恢复

## 批量执行与检查点（P1-13）

- 编排必须按批次执行，不允许无限串行推进：
  - Batch 1：前置校验与上下文准备
  - Batch 2：目标阶段 Skill 执行
  - Batch 3：verify 与推进决策
- 每个批次结束必须输出检查点：
  - 已完成项
  - 阻塞项
  - 下一批入口条件
- 任一批次出现阻塞时，必须暂停并上报，不得“带病推进”

### 编排反合理化守卫

| AI 的借口 | 封堵 |
|-----------|------|
| \"先把后续批次跑完再统一看\" | 无检查点就不可审计，必须批次收口后再继续 |
| \"这个阻塞先忽略，后面一起修\" | 阻塞项不清零不得推进批次 |
| \"只要大方向没问题就能 advance\" | `stage advance` 只能基于证据铁律，不接受方向性判断 |

## CLI 依赖
- `spec-first stage current`
- `spec-first stage advance`
- `spec-first gate check`
- `spec-first metrics health`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: strict（编排驱动阶段转换）

## 成功标准
- 编排计划已生成并经用户确认
- 所有调度的子 Skill 执行成功
- `verify` 校验通过且证据链完整
- `stage advance` 已执行，阶段已推进

## 编排规则
- 主调度器：根据当前阶段分派对应 Skill
- 序列：plan -> (spec|design|task|code|test|archive) -> verify -> advance

### 调度协议

Stage -> Skill 映射（P4 按此表调度）：

| 当前阶段 | 调度 Skill | 说明 |
|---------|-----------|------|
| 00_init | 无（init 已完成） | 直接 verify -> advance |
| 01_specify | 03-spec | 需求定义 |
| 02_design | 04-design | 技术设计（05-research 按需） |
| 03_plan | 06-task | 任务拆解 |
| 04_implement | 07-code | 代码实现（08-code-review 按需） |
| 05_verify | 09-test | 测试用例 |
| 06_wrap_up | 10-archive | 归档总结 |

### 子 Skill 失败处理

- 子 Skill P0 失败（阶段不匹配）-> orchestrate 终止，报告阶段冲突
- 子 Skill P3 用户拒绝 -> orchestrate 暂停，等待用户决定是否继续
- 子 Skill P4/P5 失败 -> orchestrate 终止，不执行 stage advance，报告失败 Skill 和错误
- 任何子 Skill 失败后，已完成的子 Skill 产出物保留不回滚

### 参数传递

- 所有子 Skill 继承 orchestrate 的 featureId
- 子 Skill 的 confirm_policy 保持各自定义（不被 orchestrate 覆盖）
