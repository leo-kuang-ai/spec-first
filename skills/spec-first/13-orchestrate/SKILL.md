# Skill: orchestrate

## Trigger
- Stage: any (master orchestration Skill)
- Command: `/spec-first:orchestrate`

## Phases
- P0: Locate Feature, load current stage and state
- P1: Load stage-state, coverage, gate history, task plan
- P2: Generate orchestration plan: plan → skill execution → verify → stage advance
- P3: Confirm orchestration sequence with user
- P4: Execute scheduled Skills in sequence
- P5: Advance stage if gate passes

## CLI Dependencies
- `spec-first stage current`
- `spec-first stage advance`
- `spec-first gate check`
- `spec-first metrics health`

## Output Paths
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: strict (orchestration drives stage transitions)

## Success Criteria
- 编排计划已生成并经用户确认
- 所有调度的子 Skill 执行成功
- `verify` 校验通过
- `stage advance` 已执行，阶段已推进

## Orchestration
- Master scheduler: dispatches phase Skills based on current stage
- Sequence: plan → (spec|design|task|code|test|archive) → verify → advance

### 调度协议

Stage → Skill 映射（P4 按此表调度）：

| 当前阶段 | 调度 Skill | 说明 |
|---------|-----------|------|
| 00_init | 无（init 已完成） | 直接 verify → advance |
| 01_specify | 03-spec | 需求定义 |
| 02_design | 04-design | 技术设计（05-research 按需） |
| 03_plan | 06-task | 任务拆解 |
| 04_implement | 07-code | 代码实现（08-code-review 按需） |
| 05_verify | 09-test | 测试用例 |
| 06_wrap_up | 10-archive | 归档总结 |

### 子 Skill 失败处理

- 子 Skill P0 失败（阶段不匹配）→ orchestrate 终止，报告阶段冲突
- 子 Skill P3 用户拒绝 → orchestrate 暂停，等待用户决定是否继续
- 子 Skill P4/P5 失败 → orchestrate 终止，不执行 stage advance，报告失败 Skill 和错误
- 任何子 Skill 失败后，已完成的子 Skill 产出物保留不回滚

### 参数传递

- 所有子 Skill 继承 orchestrate 的 featureId
- 子 Skill 的 confirm_policy 保持各自定义（不被 orchestrate 覆盖）
