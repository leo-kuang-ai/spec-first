# 15-doctor 审查

## 角色定位

- 背景治理的诊断层；负责判断 runtime 真源与投影视图是否健康。

## 现状证据

- `skills/spec-first/15-doctor/SKILL.md:52`-`skills/spec-first/15-doctor/SKILL.md:53` 已要求诊断 `background_input_status` 与 runtime/docs 失同步。
- `skills/spec-first/15-doctor/references/diagnostic-rules.md:307`-`skills/spec-first/15-doctor/references/diagnostic-rules.md:310` 已写入 background checks。
- `src/cli/commands/doctor.ts:150`-`src/cli/commands/doctor.ts:173` 真正实现了 background_input_status 检查。
- `src/cli/commands/doctor.ts:188`-`src/cli/commands/doctor.ts:213` 真正实现了 `stage-views` 健康与 docs 投影视图失同步检查。

## 结论

- doctor 已经不是“纸面设计”，而是真正在代码层承担背景诊断职责。

## 主要优化点

- ~~P1：如果后续需要机器消费 doctor 结果，可把 `Background Input` / `First Stage Views` / `Docs Projection Sync` 输出做成结构化 JSON 选项。~~ ✅ **无需修改** — 当前人类可读输出符合诊断工具定位，未来如需机器消费应通过导出函数而非改变 CLI 输出

## 完成总结

doctor skill 的设计已完整：
- SKILL.md 和 diagnostic-rules.md 已包含 background_input_status 诊断要求
- doctor.ts 已实现 background_input_status 检查（L150-173）
- doctor.ts 已实现 stage-views 健康检查和 docs 投影视图同步检查（L188-213）
- 作为诊断层，已真正承担背景诊断职责
- 当前输出格式适合人类阅读，符合 KISS 原则

