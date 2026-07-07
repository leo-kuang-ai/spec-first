---
name: spec-write-skill
description: 公开 workflow：编写、改写、迁移或按 audit findings 修复 spec-first source skill（skills/<name>/）时使用。不要用于一次性回答、解释/总结/翻译、只审计、文档导出、第三方安装、普通 spec-* workflow 执行，或手改 generated runtime mirrors。
---

# Spec Write Skill

`spec-write-skill` 接收明确、值得复用的 skill authoring 目标，并把它落到 `skills/<name>/` source patch。普通实现、调试、评审或文档导出走对应 `spec-*` workflow 或直接回答。

## Purpose

把值得复用的 skill authoring 请求转成 source-first patch：触发/边界清楚，资源按需渐进披露，验证与 generated runtime mirror 状态可交接。

## Contract Summary

### When To Use
新建/改写/迁移/修复 `skills/<skill-name>/` source skill 的触发、边界、I/O、资源、治理或验证。

### When Not To Use
一次性回答、解释/总结/翻译、只审计、文档导出、第三方安装、普通 review、普通实现/调试/评审 workflow 执行、generated mirror 修补。

### Inputs
用户目标、目标 skill、相邻 skill、repo 契约、`skills-governance.json`、audit findings、必要外部 skill 文本。

### Outputs
`do-not-create-skill`、near-neighbor route、source patch、治理/测试/docs 更新、验证状态和 residual risks。

### Artifacts
`skills/<skill-name>/SKILL.md`、必要 resources/evals、治理 JSON、runtime catalog、tests、CHANGELOG；generated mirrors 只由 `spec-first init` 投影。

### Failure Modes
复用价值/输出/近邻排除不清，entry surface 不清，source/runtime 混淆，audit finding 被自动改写。

### Workflow
先资格判断和意图澄清，再定 mode/tier/entry surface，写 patch，更新治理/测试/docs，跑匹配风险的 gate。

### Downstream Consumers
`spec-work`、`spec-skill-audit`、runtime catalog、skill 维护者和最终用户。

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Hard Boundaries

- Source of truth 是 `skills/`、`src/cli/contracts/dual-host-governance/skills-governance.json`、相关 docs/tests；不要手改 `.claude/`、`.codex/` 或 `.agents/skills/`。
- Durable source mutation 需要明确授权或 active source-edit workflow；否则先输出 patch plan / preview。
- 脚本或测试只证明确定性事实；LLM 判断触发语义、边界和质量风险。
- 外部 skill 必须重写 entry surface、source/runtime 边界、验证和治理口径。
- 不照搬 `yao-meta-skill` 的完整 SkillOps 平台；只借鉴资格判断、意图澄清、分级 gate、资源边界和反模式 eval。

## Quality Tiers

`scaffold` 只做 structure/source boundary；`production` 加 trigger/boundary eval；`library` 加 packaging/readiness evidence；`governed` 加 owner/review cadence/rollback boundary。细节见 [Authoring Method](references/authoring-method.md) 与 [Delivery Gates](references/delivery-gates.md)。

## Workflow

1. 资格判断：读 [Authoring Method](references/authoring-method.md)，确认 repeated use、reusable output contract、near-neighbor exclusions 和 non-goals；一次性/解释/文档导出/未来 outline 输出 `do-not-create-skill` 或 near-neighbor route。
2. 目标模糊时只问会改变 package 设计的 2-3 个问题；收敛 recurring job、real inputs、required outputs、exclusions、至少 1 个 should-trigger 示例、至少 1 个 near-neighbor 示例、quality tier 和 first eval target。
3. 明确模式、质量层级、目标 repo、目标 skill 名称和 entry surface：`workflow_command`、`standalone_skill` 或 `internal_only`。
4. 读取相邻 skill、治理记录和项目契约；新建/改写前读 [Skill Quality Vocabulary](references/skill-quality-vocabulary.md)。借鉴按 external benchmark -> user source -> local fit，只提炼 pattern，不复制 wording；必须先通过 local fit，不复制外部 invocation 假设。
5. 先列真实 branch，再写触发描述：描述是 trigger contract，不是摘要；每个 branch 只保留一个触发，包含正向意图、负向边界和近邻；先测试 route，再扩展目录。
6. 设计信息层级：先按 branch 分配资源，所有 branch 共用步骤和边界留在 `SKILL.md`，条件细节下沉 `references/` 并写清 context pointer 的读取条件；逐字资源放置映射（哪类内容放 `SKILL.md`/`references`/`scripts`/`assets`/`evals`）以 [Skill Quality Vocabulary](references/skill-quality-vocabulary.md) 的 Information Hierarchy 为概念 SSOT。空目录、装饰性 reports、弱 pointer、未引用资源不进 baseline。
7. 为写入、shell、runtime、delegate 或 handoff 步骤写可检查 completion criterion；同时检查 clarity(done/not done) 与 demand(需要多少 legwork)。读-only 轻 skill 可保持更轻。
8. 对新增或改写 prose 做 sentence-level no-op pruning：逐句判断是否改变触发、读取、写入、判断、验证或 handoff；不改变行为的句子优先删除，不用润色保留。
9. 更新 source-owned consumers：新增 skill 必须更新 `skills-governance.json`；用户可见或 catalog 变化要更新 runtime catalog、必要 docs/tests 和 `CHANGELOG.md`。
10. 按 [Delivery Gates](references/delivery-gates.md) 跑与 tier 匹配的最窄验证；目标 package 提供官方 `quick_validate.py` 时加跑。可分发或复杂 skill 尽量跑 package smoke、fresh-source eval 或 forward-testing，并记录未执行原因。
11. 输出变更摘要、验证结果、generated runtime mirror 状态、residual risks 和必要下一步。

## References

- [Authoring Method](references/authoring-method.md) — 资格判断、意图澄清、reference 扫描、authoring discipline 与反模式族；进入步 1-4、8 前读取。
- [Skill Quality Vocabulary](references/skill-quality-vocabulary.md) — 信息层级、触发/边界/steering/pruning 词表与失败模式定义；新建/改写和设计信息层级（步 4-8）时读取，是资源放置映射的概念 SSOT。
- [Delivery Gates](references/delivery-gates.md) — quality tier、资源边界准入、gate selection 与验证证据；定 tier 和跑验证（步 6、10）时读取。
