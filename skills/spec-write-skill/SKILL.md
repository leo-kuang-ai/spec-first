---
name: spec-write-skill
description: 公开 workflow：编写、改写、迁移或按 audit findings 修复 spec-first source skill 时使用；先判断是否值得做成 skill，再更新 skills/NAME/SKILL.md 的触发、边界、I/O、渐进披露、resources/evals、治理和验证。不要用于一次性回答、解释/总结/翻译、只审计、文档导出、第三方安装、普通 spec-* workflow 执行，或手改 generated runtime mirrors。
---

# Spec Write Skill

`spec-write-skill` 是写 skill 的公开 workflow，统一入口是 `spec-write-skill`。它不是 `spec-skill-audit` 的替代品：本 workflow 只把明确目标转成 source patch。

## Purpose

把值得复用的 skill authoring 请求转成治理清晰、渐进披露、可验证的 spec-first source patch。

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
6. 设计信息层级：`SKILL.md` 放所有 branch 共用步骤和边界；条件细节放 `references/`，并写清 context pointer 何时读取；确定性重复操作放 `scripts/`；素材放 `assets/`；维护者验证放 `evals/`。空目录、装饰性 reports、弱 pointer、未引用资源不进 baseline。
7. 为写入、shell、runtime、delegate 或 handoff 步骤写可检查 completion criterion；同时检查 clarity(done/not done) 与 demand(需要多少 legwork)。读-only 轻 skill 可保持更轻。
8. 对新增或改写 prose 做 sentence-level no-op pruning：逐句判断是否改变触发、读取、写入、判断、验证或 handoff；不改变行为的句子优先删除，不用润色保留。
9. 更新 source-owned consumers：新增 skill 必须更新 `skills-governance.json`；用户可见或 catalog 变化要更新 runtime catalog、必要 docs/tests 和 `CHANGELOG.md`。
10. 按 [Delivery Gates](references/delivery-gates.md) 跑与 tier 匹配的最窄验证；可分发或复杂 skill 尽量跑官方 `quick_validate.py`、package smoke、fresh-source eval 或 forward-testing，并记录未执行原因。
11. 输出变更摘要、验证结果、generated runtime mirror 状态、residual risks 和必要下一步。

## References

- [Authoring Method](references/authoring-method.md)
- [Skill Quality Vocabulary](references/skill-quality-vocabulary.md)
- [Delivery Gates](references/delivery-gates.md)
