# spec-first 文档目录索引

本目录承载当前契约、架构决策、workflow 产物、验证证据与可复用经验。不要仅凭文件日期、目录名或历史结论判断其是否仍代表当前实现；涉及实现、行为或 source/runtime 边界时，必须回到当前 `skills/`、`src/cli/`、tests、`CHANGELOG.md` 与直接证据复核。

## Lifecycle 状态

| 状态 | 含义 | 使用方式 |
|---|---|---|
| current | 当前维护的契约、稳定知识或架构决策 | 可作为实现和审查输入；涉及代码行为时仍以当前 source 为准 |
| artifact | 一次 workflow 生成的 ideation、brainstorm、plan、task 或验证记录 | 是带日期的上下文证据，不自动等同于当前计划、已完成工作或已验证结果 |
| support | 版本、目录或展示辅助资料 | 用于定位和追溯，不独立定义工程 contract |

## 当前目录

| 路径 | 状态 | 当前用途 |
|---|---|---|
| `docs/05-用户手册/` | current | 当前 npm CLI 的用户入口、首次走查、workflow 与产物地图；从其 README 开始阅读 |
| `docs/10-prompt/结构化项目角色契约.md` | current | spec-first 第一性原理、使命、权威与不可越过边界；架构和治理判断的最高优先级基线 |
| `docs/contracts/` | current | workflow、artifact、provider、source/runtime、verification 与治理契约 |
| `docs/contracts/dual-host-governance/` | current | 双宿主治理的专用契约；从其 README 开始阅读 |
| `docs/adr/` | current | 已记录的架构决策及其背景、取舍和后果 |
| `docs/solutions/` | current | 已验证且可复用的工程经验；使用前检查适用条件与失效条件 |
| `docs/ideation/` | artifact | 想法探索记录；进入 brainstorm 或 plan 前确认选择方向与新鲜度 |
| `docs/brainstorms/` | artifact | requirements brief；进入 plan 或 work 前以当前事实复核 |
| `docs/plans/` | artifact | 实施计划；执行前确认 lifecycle、关联任务、代码状态和验证边界 |
| `docs/tasks/` | artifact | 派生 task pack；仅在其验证信息与当前计划仍一致时作为 work handoff |
| `docs/validation/` | artifact | 测试、审查和现场验证证据；按日期、输入版本、命令和 limitation 判读 |
| `docs/VERSION/` | support | 版本相关辅助资料 |
| `docs/catalog/` | support | 文档或资产目录资料 |
| `docs/assets/` | support | 文档使用的静态资产 |
| `docs/workflow-enhancement-proposals.md` | artifact | workflow 增强建议；不是已采纳 contract |
| `docs/workflow-skill-agent-map.md` | support | workflow、skill 与 agent 的导航映射；以当前 source 为准 |

## 阅读与引用边界

- 优先从 `docs/contracts/`、相关 ADR 和当前 source 开始；`README.md`、`CHANGELOG.md` 与 tests 用于核对用户入口、变更事实和可执行证据。
- 对 `ideation/`、`brainstorms/`、`plans/`、`tasks/` 和 `validation/` 中的单份产物，先检查生成日期、引用的 source revision、状态与限制；未确认 freshness 时只能作为 advisory input。
- 不把计划、任务、审查报告或对话中的“已完成”声明当作 outcome evidence。完成、修复和测试通过必须有可追溯的命令输出、日志或其他确认依据。
- Generated runtime assets 不属于 `docs/` 的 source-of-truth；不要从 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` 反向修正文档。

## 维护规则

- 新增或调整稳定 contract、ADR、用户入口或可复用 solution 时，更新本索引中的对应条目。
- 新增 workflow 产物时，写清生成日期、来源、证据路径、验证命令与已知限制；不要因文件位于某个目录而推定其仍 active。
- 目录迁移或清理后，同步移除失效路径和过期读取规则；历史材料若需保留，应放入明确的归档位置并说明其生命周期。
- 当前 source、contract、tests 与 `CHANGELOG.md` 的事实优先级高于任一历史文档或导航索引。
