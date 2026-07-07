# spec-first 文档目录索引

本目录同时承载用户文档、开发者文档、历史设计输入、执行产物和审查报告。阅读文档时先看本索引的 lifecycle 状态，不要仅凭文件日期或目录名判断某份文档是否代表当前 source of truth。

## Lifecycle 状态

| 状态 | 含义 | 使用方式 |
|---|---|---|
| current | 当前维护的 source-of-truth 或用户入口 | 可作为实现、审查和 README 链接依据 |
| active-artifact | workflow 近期生成的需求、计划、任务、审查或验证产物 | 可作为本次上下文证据；执行前仍需验证 freshness |
| historical-input | 历史方案、调研、迁移记录或阶段性审查 | 只能作为背景输入；不能覆盖当前代码和 source-of-truth |
| archived | 明确归档或备份内容 | 只用于追溯，不作为当前设计依据 |
| external-reference | 业界材料、文章草稿或对比分析 | 只提供启发，不代表项目 contract |

## Source Of Truth

| 路径 | 状态 | 当前用途 |
|---|---|---|
| `docs/05-用户手册/` | current | 用户使用手册、workflow 入口、产物目录和首次走查 |
| `docs/contracts/` | current | schema、quality gate、workflow contract 与 verifier contract |
| `docs/contracts/workflows/self-reflection-capability-upgrade.md` | current | 自我审视、CUD、最佳实践 intake、plan/review/compound handoff 和 30-cycle loop 的轻量 contract |
| `docs/contracts/workflows/skill-agent-quality-governance.md` | current | skill / agent 质量治理的薄契约、执行边界语言和例外说明 |
| `docs/10-prompt/结构化项目角色契约.md` | current | spec-first 演化判断和 source/runtime 边界基线 |
| `docs/2026-05-04/project-audit/` | active-artifact | 当前系统级审查报告与修复阶段证据 |
| `docs/ideation/` | active-artifact | ideation artifact；进入 brainstorm 前需要确认 freshness 和所选方向 |
| `docs/brainstorms/` | active-artifact | requirements brief；进入 plan/work 前需要确认 freshness |
| `docs/plans/` | active-artifact | implementation plan；执行前以当前代码和 task-pack validation 复核 |
| `docs/tasks/` | active-artifact | derived task pack；必须通过 task-pack validator 后才能作为 work handoff |
| `docs/validation/` | active-artifact | 验证报告和历史审查证据；按报告日期和引用代码状态判断有效性 |
| `docs/solutions/` | current | 已沉淀的可复用工程经验和问题解法 |

## Historical And Reference Areas

| 路径 | 状态 | 读取边界 |
|---|---|---|
| `docs/00-版本路线/` | historical-input | 只作路线背景；当前版本事实以 `CHANGELOG.md` 和 `package.json` 为准 |
| `docs/01-需求分析/` | historical-input | 早期需求和能力拆分背景；当前 workflow contract 以 `skills/`、`src/cli/`、`docs/contracts/` 为准 |
| `docs/02-架构设计/` | historical-input | 架构设计和迁移方案集合；引用前必须核对当前代码和角色契约 |
| `docs/03-实施方案/` | historical-input | 早期实施记录；不代表当前 task-pack handoff |
| `docs/06-待办事项/` | historical-input | 历史待办；不作为当前优先级来源 |
| `docs/07-经验总结/` | historical-input | 经验记录；稳定知识应沉淀到 `docs/solutions/` |
| `docs/08-版本更新/` | historical-input | 版本说明材料；正式变更事实以 `CHANGELOG.md` 为准 |
| `docs/11-业界调研/` | external-reference | AI Coding Harness、SDD、spec-first 演进路线和团队采纳阻力调研；目录 README 给出阅读顺序、当前三项优先增强点和回源核验边界 |
| `../spec-first-doc/业界学习/` | external-reference | 外部实践材料和映射分析；只作启发和对照 |
| `docs/11-文章系列/` | external-reference | 对外文章与素材，不作为工程 contract |
| `docs/12-loop分析/` | historical-input | workflow loop 分析背景，不覆盖当前 skill source |
| `docs/10-prompt/历史快照/审查方法-历史/` | historical-input | 历史审查/审计 prompt 快照（全面项目审查、项目审查、审查 agent/skill/token）；需结合对应 audit artifact 判读，不代表当前 runtime contract |
| `docs/10-prompt/历史快照/角色治理演化-历史/` | historical-input | 历史角色/治理/自我进化 prompt 快照，是 `结构化项目角色契约.md` 的前身谱系；不代表当前 runtime contract |
| `docs/10-prompt/系统性项目审查方法.md` | current | 系统性项目审查方法论基线（怎么编排/取证/收口一次项目级审查） |
| `docs/2026-04-22-full-audit/` | historical-input | 旧全量审查快照；当前结论以最新审查报告和代码为准 |
| `docs/archive/` | archived | 备份和归档内容，只用于追溯 |
| `docs/项目介绍/` | historical-input | 项目介绍和 CRG 旧方案材料；当前上下文证据边界以 direct source reads、`skills/`、`src/cli/`、`docs/contracts/` 与用户手册为准 |
| `docs/项目审查/` | historical-input | 旧审查材料；引用前必须核对当前代码 |
| `../spec-first-doc/业界学习/04-能力映射/` | external-reference | 业界与 CE 对比材料，不代表当前 implementation contract |

## Legacy CRG / ECC 搜索边界

如果搜索命中 `src/crg`、`spec-first crg`、`graph.db`、`CRG Stage-0`、`ECC` 或旧的 bootstrap-compiler 路径，默认先按 `historical-input` 处理，不要直接当作当前实现、CLI 或 graph readiness contract。

先按本索引的 lifecycle 表判读搜索命中的历史语境，再回到下方当前 source-of-truth 列表复核。单篇历史文档即使正文很具体，也不能覆盖当前 source、contract 或 generated runtime 治理规则。

当前上下文与证据主线以这些 source 和 contract 为准：

- setup facts：`spec-mcp-setup`、`.spec-first/config/runtime-capabilities.json`
- direct evidence：bounded source reads、`rg`、ast-grep、git diff、tests/logs、用户提供证据
- workflow source：`skills/spec-plan/SKILL.md`、`skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`
- 用户入口与产物边界：`docs/05-用户手册/04-workflows-artifacts-map.md`

高频历史命中文档的读取规则：

- `docs/validation/2026-04-26-spec-first-engineering-deep-audit-report.md` 描述的是 2026-04-26 当时的 CRG implementation，不代表当前 provider 架构。
- `docs/02-架构设计/*CRG*`、`docs/项目介绍/crg/` 和 `docs/项目介绍/*CRG*` 是历史方案输入；引用其中的 `src/crg`、`spec-first crg` 或 `graph.db` 前必须先核对当前代码、用户手册和 `CHANGELOG.md`。
- `ECC` 相关 App audit 文档只有在当前 `skills/spec-app-consistency-audit/`、`agents/` 或 tests 仍有对应 source evidence 时，才可作为当前实现依据；否则按历史设计输入处理。

## 维护规则

- 新增当前契约、用户入口或 source-of-truth 文档时，把它放入上方 `Source Of Truth` 表。
- 新增一次性审查、需求、计划、任务或验证产物时，默认标为 `active-artifact`，并在文档内写清楚生成日期、证据路径和验证命令。
- 历史方案不要直接删除或移动，除非有明确迁移任务；需要废弃时优先在索引或文档顶部标注 `historical-input` / `archived`。
- 代码、`skills/`、`src/cli/`、`docs/contracts/` 与 `CHANGELOG.md` 的事实优先级高于历史设计文档。
- Generated runtime assets 不属于 `docs/` source-of-truth；不要从 `.claude/`、`.codex/`、`.agents/skills/` 反向修正文档。
