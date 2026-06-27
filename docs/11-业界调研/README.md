# 业界调研阅读指南

本目录收集 2026-06-19 至 2026-06-21 围绕 AI Coding Harness、SDD、spec-first 演进路线、存量项目阶段适配与团队采纳阻力的 10 篇调研文章。

这些文档是架构启发和路线判断输入，不是当前工程 contract。引用其中结论前，先回到当前 source-of-truth 复核：`docs/10-prompt/结构化项目角色契约.md`、`skills/`、`src/cli/`、`docs/contracts/`、`README.md` 和 `CHANGELOG.md`。

## 先读结论

按这些文章和 2026-06-21 当前 worktree 的源码复核，当前 `spec-first` 最急需增强的不是更多 agent、更多 public workflow、也不是立刻引入完整 OpenSpec-style Delta 系统，而是先把已有工程治理能力兑现成可复查、可回放、可外部验证的证据闭环。

前三个增强点建议排序如下：

| 排序 | 急需增强点 | 最小落点 | 为什么现在做 |
| --- | --- | --- | --- |
| 1 | Evidence Quality Loop：PRD / plan / task 的 artifact 质量和语义质量证明 | PRD live/replay semantic evidence、artifact quality checklist、少量 eval fixtures/replay report | 调研最终报告把 P0 排为 Artifact Quality + Honest Closeout + Eval Loop；当前已有 checker 和 fixture，但它们主要证明结构，不证明 live 语义输出质量。 |
| 2 | Closeout / verification 跨 workflow producer integration | 扩展 `honest-closeout` claim、扩大 `verification-run-summary` 和 run artifact 消费面、输出 replay proof | 当前防 cherry-pick 机制强，但 claim 类型和 workflow 覆盖仍窄；已有 31 个 run.json、33 个 verification summary，可直接进入实证消费阶段。 |
| 3 | P-friction 用户摩擦实证审计 + Work context activation | 先用真实 run evidence 审计摩擦，再决定 task-pack-default / review-inline / graph-primary；同时评估 `spec-work` 默认召回 `docs/solutions/` | 角色契约把可采纳性 / 外部可验证性列为一等目标；P-friction 启动条件已满足，且 debug 已默认召回知识而 work 仍未默认激活。 |

`Behavior Contract + Delta` 长期杠杆仍高，但当前应放在 P1：它新增 source-of-truth 表面、回退成本高，且需要 P0 证据闭环和真实痛点证据先稳定。

## 推荐阅读顺序

| 顺序 | 文档 | 先读原因 | 读完后要带走什么 |
| --- | --- | --- | --- |
| 1 | [2026-06-19-spec-first-进化提升最终综合报告.md](./2026-06-19-spec-first-进化提升最终综合报告.md) | 先看最终收敛判断：P0 是 Artifact Quality + Honest Closeout + Eval Loop，Behavior Contract + Delta 降为 P1 乘数项。它会校准其他文章里更激进的 Delta-first 表述。 | 当前优先级不是“新建大系统”，而是扩展已有 `honest-closeout.v1`、`verification-run-summary.v1`、eval fixtures 和 run evidence。 |
| 2 | [2026-06-20-ai-coding-team-adoption-and-spec-first-gap-research.md](./2026-06-20-ai-coding-team-adoption-and-spec-first-gap-research.md) | 再看团队采纳和需求开发短板。它更新了 6/19 之后的 current-source evidence，强调不要把机制就位误写成效果已证明。 | P0 应包含 PRD live semantic evidence、P-friction 审计和 replay reports；不要宣传“自动提效”或“质量已证明”。 |
| 3 | [2026-06-19-sdd-ai-coding-harness-benchmark.md](./2026-06-19-sdd-ai-coding-harness-benchmark.md) | 建立横向行业地图：Superpowers、Spec Kit、OpenSpec、GSD、BMAD、scale-engine 等项目分别强在哪里。 | 对标不是全抄；要吸收可验证机制，并放进 spec-first 的 source/runtime 和 Scripts prepare / LLM decides 边界。 |
| 4 | [2026-06-19-spec-first-架构对标分析-业界-sdd-工具全景对比与提升路线.md](./2026-06-19-spec-first-架构对标分析-业界-sdd-工具全景对比与提升路线.md) | 聚焦四个核心对标项目，理解状态治理、架构约束、上下文工程、熵管理、工作流编排五维缺口。 | Delta 和 durable progress ledger 是有价值机制，但不能替代当前 workflow 的轻合同判断。 |
| 5 | [2026-06-19-openspec-vs-spec-first-源码级深度对比分析.md](./2026-06-19-openspec-vs-spec-first-源码级深度对比分析.md) | 深读 OpenSpec 的 filesystem-as-state-machine、Spec Delta 和 archive/apply 机制。 | OpenSpec 的强项是行为变更可累积；spec-first 的强项是信任模型和证据降级。借鉴时要保留后者。 |
| 6 | [2026-06-19-spec-first-最大杠杆点-活契约层与-delta-累积演进.md](./2026-06-19-spec-first-最大杠杆点-活契约层与-delta-累积演进.md) | 理解“被开发系统行为真相单源”为什么是高杠杆项。注意它是输入论证，不是最终 P0 排序。 | Behavior Contract + Delta 是后续乘数项；进入实现前先证明 P0 evidence loop 和用户痛点。 |
| 7 | [2026-06-19-expert-coding-harness-spec-first-skill-mapping.md](./2026-06-19-expert-coding-harness-spec-first-skill-mapping.md) | 需要吸收外部 skill / hook / rubric 时再读。重点是映射到既有 workflow 节点，而不是扩更多 public workflow。 | 可吸收 task handoff、review order、agent/tool security lens；新增 agent 必须先有 spec-first 侧失败实例或评估证据。 |
| 8 | [2026-06-19-ponytail-yagni-spec-first-skill-source-integration-plan.md.md](./2026-06-19-ponytail-yagni-spec-first-skill-source-integration-plan.md.md) | 需要最小实现、YAGNI、code-simplicity、Ponytail 方法论时读。 | 最小必要性治理是专项增强，不应挤掉证据闭环、P-friction 和 PRD 质量证明主线。 |
| 9 | [2026-06-21-spec-first-综合优先级建议-源码级深度解读.md](./2026-06-21-spec-first-综合优先级建议-源码级深度解读.md) | 前 8 篇的源码级复核收口；本 README §0「三个急需增强点」的出处。明确多处缺口已部分闭合（spec-debug 默认扫 docs/solutions、spec-plan PRD handoff entropy check），把建议从「新增」降级为「扩既有表面」。 | P0-A~P0-D + P1-A~F 优先级总表；config-protection 须改写为既有 secret-deny-patterns + mutation gate；自动 scorecard settled out-of-scope 但可重开；P0-C 须有能否决「加默认」类 P1 的权力。 |
| 10 | [2026-06-21-openspec-spec-first-存量项目规范初始化与阶段适配报告.md](./2026-06-21-openspec-spec-first-存量项目规范初始化与阶段适配报告.md) | 回答 OpenSpec 是否只适合 0-1、spec-first 处于什么阶段、历史存量如何初始化。 | OpenSpec 擅长增量 delta 治理但缺历史 baseline 初始化；spec-first 是 1-10 brownfield harness，缺「当前能力行为真相」层；推荐 capability inventory → baseline evidence → reviewed current capability spec 的 docs-first governed proposal（非可发布 skill）。 |

## 按目的跳读

| 目的 | 建议读法 |
| --- | --- |
| 只想知道当前演进优先级 | 读顺序 1、2 和 9，再看本 README 的“三个急需增强点”。 |
| 复核行业对标证据链 | 读顺序 3、4，再按需要进入 5、7、8、10。 |
| 研究 behavior contract / Delta | 读顺序 5、6、10，然后回到顺序 1 和 9 看最终优先级修正。 |
| 改进 skill / agent / review rubric | 读顺序 7，再回到当前 `skills/`、`agents/` 和 `src/cli/contracts/dual-host-governance/skills-governance.json` 复核现状。 |
| 改进最小实现纪律 | 读顺序 8、9，再回到 `spec-plan`、`spec-work`、`spec-code-review` source 判断是否已有承接点。 |

## 三个急需增强点

### 1. Evidence Quality Loop：先证明 artifact 质量

调研依据：

- 最终综合报告明确把 P0 排为 Artifact Quality + Honest Closeout + Eval Loop，并把 Behavior Contract + Delta 放到 P1。
- 6/20 采纳缺口报告进一步收敛为：PRD live semantic eval、P-friction 审计、artifact quality + honest closeout + verification replay 优先。

当前源码现状：

- `spec-prd` 已有 deterministic checker、examples-as-context 和 focused contract tests，但 `skills/spec-prd/references/evaluation-governance.md` 明确说这些不是 provider-backed model execution，也不能替代 blind output review / reviewer-scored evidence。
- `docs/contracts/workflows/eval-fixture-contract.md` 明确 `coverage_tags` 只是结构覆盖，不证明 semantic quality。
- `docs/validation/spec-prd/` 有 fresh-source eval 和 not_run 记录，但这仍不是稳定的 live/replay PRD output quality proof。

最小落地：

1. 给 PRD / plan / task / review 产物补一个轻量 artifact quality checklist，不做复杂全局 schema。
2. 为 PRD 选 3-5 个真实 brownfield 场景做 replay：输入、输出、deterministic facts、reviewer/human adjudication 分开记录。
3. 把 eval fixtures 用作结构回归，不把它们宣传成语义质量评分。

非目标：

- 不做自动语义评分平台。
- 不让脚本判断 PRD 是否“ready-for-planning”；脚本只准备事实，LLM / reviewer 做语义裁决。
- 不因为 PRD checker 能抓低质量结构，就宣称 PRD 生成质量已经被证明。

### 2. Closeout / verification：把“机制存在”升级成跨 workflow 证据闭环

调研依据：

- 最终综合报告把 Honest Closeout Producer Integration 列为 P0，并建议新增 `artifact_quality`、`contract_sync`、`contract_coverage` 等 claim。
- SDD benchmark 也指出 structured runtime contract 仍窄，`honest-closeout` 类信任模型尚未成为普遍 workflow producer integration。

当前源码现状：

- `src/cli/helpers/honest-closeout.js` 的 `CLAIM_TYPES` 当前只有 `validation`、`impact_surface`、`review`、`knowledge_promotion`。
- `src/cli/helpers/honest-closeout.js` 已对 `passed` validation claim 做聚合防 cherry-pick：run summary 总体不是 passed 时会降级为 `run-summary-checks-uncovered`。
- `src/cli/helpers/verification-run-summary.js` 只允许 `spec-work`、`spec-debug`、`spec-code-review` 三个 workflow。
- `src/cli/helpers/spec-work-run-artifact.js` 的 producer 仍固定服务 `spec-work` closeout，源码注释也说明若未来接 debug/review run artifact，需要同步放宽硬编码。
- 当前本地 `.spec-first/workflows` 有 42 个 `run.json`、45 个 `verification-run-summary.json`、12 个 `honest-closeout.json`；claim 统计仍集中在 validation/review/knowledge/impact，没有 artifact quality 或 contract coverage。

最小落地：

1. 先扩 `honest-closeout.schema.json`、`CLAIM_TYPES`、dispatch 和 tests，新增 `artifact_quality`，coverage 类 claim 先 report-only。
2. 把 `verification-run-summary` 的 consumer 从完成声明扩展到 doc-review / PRD / plan / task quality report，但先不做硬 gate。
3. 用现有 31 条 run evidence 输出一份 replay validation report，回答：哪些 claim 有证据、哪些 not-run、哪些 workflow 没有 producer。

非目标：

- 不把 closeout 变成新的中心 workflow engine。
- 不把 review / PRD / plan 的语义判断脚本化。
- 不引入与现有 verdict 不兼容的新枚举；沿用 `consistent | degraded | unsupported`。

### 3. P-friction + Work context activation：先证明用户摩擦，再排后续增强

调研依据：

- 角色契约把“可采纳性 / 可外部验证性 / 表达可信度”列为一等守护结果。
- 6/20 采纳缺口报告指出，团队落地阻力集中在 trust、oversight、verification、ROI，而不是代码生成能力本身。
- `docs/06-待办事项/2026-06-15-002-未完成技术方案清单与执行顺序.md` 已写明 P-friction 启动条件满足，当时 run.json 样本 25 条 >= 10，且它应决定 task-pack-default、graph-primary、review-inline 的后续优先级。

当前源码现状：

- 当前本地 run evidence 已增长到 42 条 `run.json`，其中 `workflow_integrated=true` 为 39 条（`false` 3 条），已足够做第一轮摩擦审计。
- `skills/spec-debug/SKILL.md` 已默认扫描 `docs/solutions/` frontmatter 作为 debugging orientation source。
- `skills/spec-work/SKILL.md` 只有 recall trust boundary：当 learnings 被携带或召回时如何信任它；没有像 debug 那样默认激活 `docs/solutions/` recall。

最小落地：

1. 先产出 P-friction 审计报告：用真实 `run.json`、verification summary、session evidence 分类摩擦点。
2. 只根据 P-friction finding 决定是否推进 task-pack-default、review-inline、graph-primary，不再凭架构直觉排序。
3. 若摩擦集中在重复踩坑、上下文遗忘或项目约定未召回，再给 `spec-work` 增加 default-on / skip-on-trivial 的 `docs/solutions/` orientation scan，并保持 advisory + 回源确认边界。

非目标：

- 不把 P-friction 变成直接修复清单；它先是审计，不是 implementation plan。
- 不把 Graphify / provider graph 升级为 truth；它只能是 advisory navigation。
- 不把所有 work 都强制走重 review 或重 task-pack。

## 为什么这些不进前三

| 候选 | 为什么重要 | 为什么不是当前前三 |
| --- | --- | --- |
| Behavior Contract + Delta | 解决被开发系统行为真相单源缺失，是长期乘数项。 | 新增 source-of-truth 表面和 parser/apply/archive 机制，回退成本高；最终综合报告和 6/20 报告都要求先有 P0 证据闭环和真实痛点证据。 |
| 新增更多 agents / skills | 可补专项判断，例如 handoff reviewer、agent/tool security lens、web performance lens。 | 当前 51 agents / 多 workflow 已足够复杂；ECH 报告也要求先绑定 spec-first 侧失败实例，不能只因外部 harness 有某 skill 就新增入口。 |
| Ponytail / YAGNI / code simplicity | 能改善最小实现纪律，避免过度设计。 | 这是专项治理增强；除非 P-friction 证明 overbuild 是高频摩擦，否则不应挤掉证据质量和采纳实证。 |
| Graphify primary evidence | 可帮助导航大型代码关系。 | 本次查询仍召回泛节点，导航价值低；项目图输出必须保持 `provider_untrusted`，关键结论要回源到 source/test/log/doc evidence。 |

## 使用边界

- 这些文章可作为 `inference` 和 `external-reference`，不能直接当成 current contract。
- 文章中的远端项目状态、外部趋势和本仓能力描述有时间点限制；做实现前必须用当前 worktree 重新核验。
- 同一日多篇文章多数来自同一作者的连续分析，收敛性不能被当成独立多源证据。
- 若后续文章改变本目录的最终优先级，应同步更新本 README，并在新文章中写明 supersede / complement 关系。

## 本次复核记录

本 README 的排序基于 2026-06-21 的只读复核，篇数、日期范围与 run evidence 计数于 2026-06-28 重新校正（新增 2 篇 2026-06-21 文档纳入阅读顺序）：

- 已读本目录 10 篇调研文章和 `docs/10-prompt/结构化项目角色契约.md`。
- 已核 `honest-closeout`、`verification-run-summary`、`spec-work-run-artifact`、`spec-prd` evaluation governance、eval fixture contract、P-friction backlog、`spec-work` / `spec-debug` recall 边界。
- 已统计当前 `.spec-first/workflows`：42 个 `run.json`、45 个 `verification-run-summary.json`、12 个 `honest-closeout.json`。
- Graphify 已尝试作为导航候选，但结果偏泛化，只作为 low-utility advisory；结论来自 direct source reads 和 deterministic file statistics。
