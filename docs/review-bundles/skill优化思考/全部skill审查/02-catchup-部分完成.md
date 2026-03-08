# 02-catchup 审查

## 角色定位

- 会话恢复辅助 skill；不生成背景，但应恢复“当前背景是否可靠”。

## 现状证据

- `skills/spec-first/02-catchup/SKILL.md:96`-`skills/spec-first/02-catchup/SKILL.md:165` 定义了 6 段式恢复报告。
- `skills/spec-first/02-catchup/SKILL.md:174`-`skills/spec-first/02-catchup/SKILL.md:233` 的 5 问重启测试覆盖任务、阻塞、下一步。
- 但文档里没有 `background_input_status`、runtime 真源健康、docs 投影同步状态。

## 结论

- 恢复流程扎实，但还停留在“业务/任务恢复”，没有恢复“背景质量”。

## 主要优化点

- ~~P1：在恢复报告里增加 `background_input_status`~~ ✅ **已完成** (v0.5.121) — 从 stage-state.json 读取并显示
- P1：增加 `stage-views` 健康状态、docs 投影视图是否漂移 ⏸️ **待后续优化**
- P2：统一证据格式 ⏸️ **待后续优化**

