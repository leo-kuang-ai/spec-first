# 06-task 审查

## 角色定位

- 计划阶段主 skill；负责把 spec/design 收敛成可执行 TASK。

## 现状证据

- `skills/spec-first/06-task/SKILL.md:96`-`skills/spec-first/06-task/SKILL.md:192` 已定义细粒度任务拆解、标准任务格式与执行检查。
- `skills/spec-first/06-task/references/task-template.md` 已要求“TDD 时第一步必须是 RED 证据”。
- 当前文档没有 `background_input_status` 或阶段背景输入说明。

## 结论

- 任务拆解纪律清晰，但“任务从什么背景收敛出来”还没有被显式建模。

## 主要优化点

- ~~P1（推断性建议）：为 task skill 增加最小背景契约：`spec.md + design.md + traceability-matrix.md + backgroundInputStatus`。~~ ✅ **已完成** (v0.5.124) — 显式声明背景输入契约，自动注入 backgroundInputStatus
- ~~P1：不要急着新增 `plan-view`；先把最小背景合同写清楚，避免 producer 过度扩张。~~ ✅ **已遵循** — 未新增 plan-view，仅声明最小背景契约

