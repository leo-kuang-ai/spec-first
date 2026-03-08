# 01-init 审查

## 角色定位

- Governor；负责把 `00-first` 的背景健康状态写进 Feature 运行态。

## 现状证据

- `skills/spec-first/01-init/SKILL.md:22`-`skills/spec-first/01-init/SKILL.md:37` 要求 `summary.json`、`role-views.json`、`stage-views.json` 全部存在。
- `src/core/process-engine/init.ts:583`-`src/core/process-engine/init.ts:605` 真实实现了 `full / degraded / blind` 判定。
- `src/core/process-engine/init.ts:620` 把 `backgroundInputStatus` 写入 `stage-state.json`；`src/cli/commands/init.ts:342` 会把它打印到 CLI 输出。
- `tests/unit/init.test.ts:113`-`tests/unit/init.test.ts:133` 与 `tests/unit/init-runtime-readiness.test.ts:1`-`tests/unit/init-runtime-readiness.test.ts:94` 已覆盖三态。

## 结论

- 这是当前仓库里“文档、代码、单测三位一体”最完整的 skill 之一。

## 主要优化点

- ~~P1：把 `detectBackgroundInputStatus()` 抽成共享能力~~ ✅ **已完成** (v0.5.120) — 提取至 first-context.ts，供其他 skill 复用

