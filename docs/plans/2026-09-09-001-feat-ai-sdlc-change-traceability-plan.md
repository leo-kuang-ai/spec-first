---
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: docs/adr/0003-spec-first-ai-enhanced-sdlc-harness-boundary.md
origin: docs/strategic-review/2026-09-05-next-phase-capability-strategy.md
spec_id: 2026-09-09-001-ai-sdlc-change-traceability
status: active
execution: code
---

# AI-enhanced SDLC 首个纵向切片：变更交付追踪

## Goal Capsule

- **objective**: 让 reviewer 能从一次 PR 描述快速重建“为什么改、改了什么、凭什么可用、还有什么未验证”，贯通需求/计划、任务、代码、验证和 review residuals。
- **user**: 负责真实变更的研发人员、reviewer、QA 和后续接手者。
- **scope**: 现有 `spec-commit-push-pr` 的 PR 描述生成与说明文档；只消费已有 artifact 和验证结果，不新增中央状态库或完整 ALM 集成。
- **success**: 有 plan、task pack、验证摘要和 review residuals 的变更，PR 描述能生成稀疏且可回源的追踪信息；缺少某类输入时明确显示未知或未提供，不补造编号和通过结论。
- **largest risk**: 把 PR 描述变成第二套需求或状态真相，或把路径存在、测试通过和 review 自报包装成完整 SDLC 结果。

## Product Contract

### R1. 变更追踪信息必须以已有权威为源

PR 描述可以引用 `spec_id`、`origin`、`source_plan`、U-ID、task_id、verification-run-summary 和 review residuals，但不得改写其语义或生成缺失的身份。source plan 仍拥有 scope、acceptance、architecture 和 non-goals；task pack 仍是 derived artifact。

### R2. 汇总必须区分事实、判断和未验证项

描述中分别呈现：

- 变更目标和范围：来自 plan/requirements；
- 实际修改：来自最终 diff 或 caller 提供的变更事实；
- 验证结果：只引用实际运行的命令和其状态；
- review residuals：保留 unresolved、deferred、accepted 等原状态；
- 外部发布或生产状态：若没有直接证据，标记为未提供，不得默认为已部署或运行健康。

### R3. 追踪是稀疏的，不是全量模板

只有会帮助 reviewer 重建决策和证据的链接、ID、结果和限制才进入 PR 描述。低风险且无对应 artifact 的变更可以省略该段，不强制所有 PR 创建完整 SDLC 文档链。

### R4. 保持现有授权边界

生成描述继续是非变异操作；commit、push、创建或修改 PR 仍分别需要既有授权。该切片不新增外部写入、自动合并、部署、回滚或生产操作权限。

### R5. 声明上限必须可见

PR 描述最多证明当前变更的计划关联、实现范围、已运行验证和 review 状态。它不能单独证明业务验收、生产部署成功、SLO 达标或现场收益。

## Planning Contract

- **canonical source**: `skills/spec-commit-push-pr/references/pr-description-writing.md`。
- **workflow owner**: `spec-commit-push-pr`；不改变 `spec-work`、`spec-code-review` 或 `verification-run-summary` 的 producer ownership。
- **consumer**: PR reviewer、任务 owner、QA 和后续接手者。
- **integration style**: 在现有 PR 描述组装阶段增加一个可选的 `Change trace` 信息块；不新增 CLI 子命令、数据库、通用 schema 或强制状态机。
- **fallback**: 无 plan、task pack、验证摘要或 review finding 时，描述继续生成，明确缺失项；无法解析或 freshness 不足时引用路径并标注 limitation，不猜测当前状态。
- **freshness**: 生成描述前后沿用现有 commit range、最终 diff、source plan 和 task pack freshness 规则；代码或计划在取证后变化时，重新读取并放弃旧汇总。

## Implementation Units

### U1. 定义变更追踪信息块的最小内容

- **files**: `skills/spec-commit-push-pr/references/pr-description-writing.md`
- **approach**: 在现有描述组装规则中定义可选信息块，按“目标/范围、计划与任务引用、验证结果、review residuals、限制”组织；只使用 caller 已解析的事实，不要求重新构造全量 artifact。
- **acceptance**:
  - 有 plan 和 U-ID 时能引用原始路径与 ID；
  - 有 task pack 时能引用 `task_id` 和 source plan，不把 task pack 当 source of truth；
  - 有验证摘要时只列实际 `passed`、`failed`、`not-run`、`degraded` 及原因；
  - 有 residuals 时保留其状态和 owner；
  - 缺失输入时显示未提供/未知，不生成伪造结论；
  - 低风险无 artifact 变更可以不输出该块。
- **stop_if**: 需要新增状态枚举、中央 registry、自动抓取外部项目管理或部署系统，或无法保持现有 description-only 非变异边界。

### U2. 补齐 PR 描述生成的调用上下文约定

- **files**: `skills/spec-commit-push-pr/SKILL.md`, `skills/spec-commit-push-pr/references/pr-description-writing.md`
- **approach**: 明确描述生成阶段可消费的 plan/task/verification/review 输入及其 authority，要求在 source 变化或 evidence stale 时重新取证；不让 helper 自行读取或修改不属于 caller scope 的文件。
- **acceptance**:
  - full workflow、description-only 和 existing-PR rewrite 均遵守同一信息块边界；
  - description-only 仍不修改 git 或 PR；
  - 现有 commit、push、landing authorization 规则不变；
  - 缺少上游 artifact 时仍能生成诚实的降级描述。
- **stop_if**: 需要改变授权语义、PR mutation 流程或现有 mode 分支。

### U3. 建立三类描述 fixture 与回归检查

- **files**: `skills/spec-commit-push-pr/evals/`, `tests/unit/`（具体文件由实现前按现有 fixture 结构确定）
- **approach**: 复用现有 `spec-commit-push-pr` eval harness，增加有完整链、部分链和无链三类输入；同时检查 description-only 不变异和敏感信息不进入描述。
- **acceptance**:
  - 完整链 fixture 能保留 plan/task/verification/review 的可回源引用；
  - 部分链 fixture 将缺失和未验证状态逐项披露；
  - 无链 fixture 不强制生成空模板；
  - stale source plan 或 task pack 不会被描述当作 current truth；
  - 已有 `spec-commit-push-pr` eval 回归通过。
- **stop_if**: 测试只能断言固定文案、无法验证 authority/freshness/claim ceiling，或 fixture 需要伪造生产结果。

### U4. 形成一次真实本地变更的交付验证

- **files**: `docs/validation/` 下新增一次 run-local 验证记录（具体路径由执行时生成）
- **approach**: 选择一个已有 implementation-ready plan 的小型真实变更，在不 push、不创建 PR 的条件下生成 description-only 输出；由 reviewer 按描述重建目标、范围、验证和 residuals，并记录无法重建的字段。
- **acceptance**:
  - reviewer 能从描述回到 source plan、最终 diff 和实际验证日志；
  - 测试通过不会被描述成业务或生产验收通过；
  - 未运行、失败、过期或缺失证据均保留；
  - 发现的信息块增加了无效阅读负担时，记录为负向结果并调整或撤回该块。
- **stop_if**: 只能使用自检或模型自报，无法提供最终 diff/命令日志/source plan 的直接证据。

## Verification Contract

| 层级 | 检查 | 通过标准 |
| --- | --- | --- |
| 静态 | source 文档与权限边界 | 新规则只位于 `spec-commit-push-pr` owning source；没有新增 mutation、状态库或外部系统 owner |
| 契约 | fixture/eval | 完整链、部分链、无链和 stale 输入均按 R1-R5 处理；description-only 保持非变异 |
| 回归 | 现有 skill eval 与相关 Jest | 既有授权、PR 模式、描述生成和敏感信息约束不回归 |
| 真实任务 | 本地 description-only run | reviewer 可按最终 diff、source plan、验证日志和 residuals 回源；未验证边界清晰 |

## Definition of Done

- U1-U3 的 source、fixture 和回归检查完成；
- U4 有一份可回源的本地验证记录；
- `git diff --check` 和相关测试通过；
- 文档或测试不把“PR 描述生成”表述成部署、生产运维或完整 AI-DLC 能力；
- 若真实验证显示信息块增加的阅读成本高于追踪收益，则保留负向结论并停止扩展。

## Non-goals

- 不新增 `change_id` 中央 registry；
- 不重构 `spec_id`、task pack、verification-run-summary 或 review finding schema；
- 不自动读取或同步 Jira、GitHub Projects、CI/CD、监控和事故系统；
- 不创建 dashboard、发布门禁、自动合并、部署或回滚能力；
- 不以一次本地验证宣称 field outcome 或完整 SDLC 收益。

## Dependencies And Follow-up

- 依赖当前 `spec-commit-push-pr` 的 commit range、diff、plan 和 PR context 解析能力；
- 依赖现有 `spec_id` 与 task pack freshness 合同；
- 依赖 `verification-run-summary` 和 review finding 的现有 producer 输出；
- 若 U4 证明 reviewer 仍需跨多个 artifact 手工拼接，再单独评估是否需要只读的变更摘要工具；该工具必须经过 consumer、ownership、freshness 和 field evidence 评估后立项。

