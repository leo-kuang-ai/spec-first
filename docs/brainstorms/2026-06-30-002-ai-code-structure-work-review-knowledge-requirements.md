---
spec_id: 2026-06-30-002-ai-code-structure-work-review-knowledge
artifact_kind: prd-requirements
target_surface: workflow-skill-runtime
status: checkpoint
evidence_grade: mixed
created: 2026-06-30
source_inputs: []
readiness_verified_by:
readiness_verified_at:
readiness_checker_schema:
readiness_finding_count:
readiness_blocking_count:
readiness_prd_hash:
readiness_inputs_hash:
---

# AI 生成代码结构护栏需求分析报告：spec-work / spec-code-review / docs/solutions 优化

## Summary（文档概要）

本文基于外部文章《两条原则，让AI写出让人省心的代码》的本地结构化材料，结合当前 `spec-first` 的 `spec-work`、`spec-code-review`、`docs/solutions/` 与 Knowledge Harness source，提出一组面向 AI Coding 结构质量的 workflow 优化需求。核心结论是：`CMP`（组合方法模式）与 `SLAP`（抽象层次一致性原则）不应被引入为机械 lint 或硬状态机，而应成为 `spec-work` 的结构先行执行姿态、`spec-code-review` 的结构优先评审 lens，以及 `docs/solutions/` 中可召回、可回源、可失效的团队工程知识。

## Problem Frame

AI Coding 的速度优势会放大既有结构模式。当前 `spec-first` 已经具备反馈回路、垂直切片、结构性 maintainability reviewer、知识召回和知识沉淀机制，但 `CMP / SLAP` 这类“先组织代码意图，再填实现细节”的结构护栏尚未被显式写入执行、评审和知识三段链路。

如果不补这层轻量约束，风险不是代码一定不能跑，而是：

- `spec-work` 在实现阶段仍可能直接填满局部细节，入口方法缺少叙事结构。
- `spec-code-review` 已能发现复杂度与抽象债，但可能把“主流程叙事失真 / 抽象层混杂”当成普通 maintainability 建议，而不是 AI 生成代码的第一轮结构风险。
- `docs/solutions/` 已能沉淀 verified learning，但尚无可召回的项目级“AI 生成代码结构护栏”知识资产，后续 agent 需要反复重新理解同一原则。

本报告的目标是把文章原则翻译成符合 `spec-first` 的 Light contract：脚本准备可量化事实，LLM / reviewer 判断语义结构是否成立；不把风格原则硬编码成脚本裁决。

## Current System Snapshot

| surface | current behavior | evidence | implication |
| --- | --- | --- | --- |
| `spec-work` | 已要求先建立最小反馈回路、按垂直切片执行、持续测试、阶段性简化，并在 shipping 阶段进入必需 review。 | confirmed-source: `skills/spec-work/SKILL.md` `Feedback Loop And Vertical Slices`、`Simplify as You Go`、`references/shipping-workflow.md` | 执行质量已有骨架，但“结构先行 / 主流程骨架先行”还不是显式执行姿态。 |
| `spec-work` 任务 intake | 已从 plan/task-pack 读取 scope、patterns、verification、review_gate，不允许静默扩 scope。 | confirmed-source: `skills/spec-work/SKILL.md` Phase 1 task-pack checks | 适合把结构预览绑定到既有 task/unit，而不是新增独立 artifact。 |
| `spec-code-review` | 默认 core 包含 `spec-maintainability-reviewer` 和 `spec-learnings-researcher`；review 产出结构化 findings、Coverage、residual status。 | confirmed-source: `skills/spec-code-review/SKILL.md` Reviewers / Stage 6 | 评审链路已有结构质量入口和知识召回入口。 |
| maintainability reviewer | 已关注结构质量、复杂度删除、薄 wrapper、错误层级、文件过长、抽象债、类型边界。 | confirmed-source: `agents/spec-maintainability-reviewer.agent.md` | 与 CMP/SLAP 高度相容，但未显式检查“入口方法叙事”和“同方法抽象层一致”。 |
| `docs/solutions/` | `spec-compound` 将 verified learning 写入 `docs/solutions/`，新 promoted solution 需 `source_refs` 和 `invalidation_condition`；召回保持 advisory。 | confirmed-source: `skills/spec-compound/SKILL.md`、`docs/contracts/knowledge/knowledge-harness.md`、`agents/spec-learnings-researcher.agent.md` | 可以沉淀 CMP/SLAP 作为项目知识，但必须来源于已验证实践，而不是直接把外部文章当 confirmed team standard。 |
| Knowledge Harness | L4 recall 是 advisory candidate，必须回源到 source/test/doc 或人工 reviewer 才能升为 confirmed。 | confirmed-source: `docs/contracts/knowledge/knowledge-harness.md` | 文章原则只能成为需求输入或 advisory learning source，不能直接成为硬规则。 |

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| Work implementation posture | 反馈回路与垂直切片显式；结构组织原则隐式。 | 对非平凡行为代码加入“结构预览 / 主流程骨架先行 / 抽象层一致性复查”的轻量步骤。 | extend | confirmed-source: `skills/spec-work/SKILL.md`；external-research: article note |
| Code review lens | maintainability reviewer 查复杂度、抽象债和薄 wrapper。 | 第一轮结构评审显式覆盖入口叙事、抽象层混杂、伪抽象、异常/校验细节冲散主流程。 | extend | confirmed-source: `agents/spec-maintainability-reviewer.agent.md` |
| Knowledge reuse | `docs/solutions/` 支持 verified learning recall，但无 CMP/SLAP 项目级结构护栏学习。 | 在真实落地或 review 发现后沉淀一篇结构化 learning，并让 recall 能按 code-implementation / abstraction-debt / AI-generated-code 命中。 | add | confirmed-source: `skills/spec-compound/SKILL.md` |
| Automation boundary | 脚本可记录 verification / artifacts / resource advisory。 | 只用脚本收集可量化结构信号，不让脚本判定 CMP/SLAP 是否语义成立。 | policy-change | confirmed-source: `docs/10-prompt/结构化项目角色契约.md` |

## Requirement Analysis Gate

| field | analysis |
| --- | --- |
| input_inventory | repo 外文章材料、本仓库 `spec-work` / `spec-code-review` / `spec-compound` / `docs/solutions` / Knowledge Harness source、相关 tests。 |
| source_authority_order | 仓库 source 与 contract > deterministic command/test facts > 本地文章材料 > Graphify/codegraph advisory navigation。 |
| target_surface_anchor | `skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`、`agents/spec-maintainability-reviewer.agent.md`、`docs/solutions/**` / `spec-compound`。 |
| current_state_summary | 执行、评审、知识机制已存在，但缺一条贯穿三段的“AI 生成代码结构护栏”显式路径。 |
| change_delta | extend `spec-work` 和 `spec-code-review`，add 一个 verified learning 候选路径；不新增 public workflow。 |
| module_map | workflow prose、reviewer persona prose、contract tests、future solution doc。 |
| open_decisions | 实现时精确改哪些 prose anchors、是否调整 maintainability demotion 例外、是否立即沉淀 solution doc 需要由 planning/work 基于 diff 决定。 |
| design_coverage | 不涉及 UI / design source。 |
| api_coverage | 不涉及 CLI/API schema；若后续新增 fields 或 run artifact 字段，需要另行做 contract-change。 |
| risk_to_prd_write_target | 见 Requirements、Acceptance Examples、Scope Boundaries、Planning Recheck。 |
| source-backed no-question reason | 需求目标来自用户明确请求与当前 source 证据，未发现必须先问 owner 才能决定 WHAT 的缺口；实现 HOW 留给后续 planning。 |

## Mapping Diagram（映射图）

```mermaid
flowchart LR
  A[Article input: CMP + SLAP] --> B[spec-work: structure-first execution posture]
  A --> C[spec-code-review: structure-first review lens]
  A --> D[docs/solutions: verified reusable learning]

  B --> E[Implementation preview: main flow + semantic helpers]
  B --> F[Slice review: abstraction-level consistency]
  C --> G[Maintainability finding: narrative / level / pseudo abstraction]
  C --> H[Learning capture recommendation]
  D --> I[Recall as advisory candidate]

  I --> J[Source/test/doc confirmation before reuse]
```

图已经承载三段映射关系；正文只解释需求、边界与验收，不重复展开每条箭头。

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | `spec-work` 对非平凡行为代码应加入轻量“结构预览”步骤：在编辑前用当前 task/unit 的 source scope 写清主入口、主流程步骤、哪些细节会下沉，以及不应新增的伪抽象。 | external-research: article note; confirmed-source: `skills/spec-work/SKILL.md` 已有 feedback-loop / vertical slice，可承接此步骤。 |
| R-02 | P0 | 结构预览必须是 run-local / closeout-level 信号，默认不新增持久 artifact；只有长任务、handoff、review/compound 触发时才进入现有 summary / run artifact。 | confirmed-source: `skills/spec-work/SKILL.md` Summary-First Handoff 与 Run Artifact Boundary。 |
| R-03 | P0 | `spec-work` 的实现指导应鼓励“先形成主流程骨架，再填局部实现”，但必须保留“不是机械拆方法”的边界：只有具备独立语义、稳定命名、变化理由、测试价值或复用价值时才抽取。 | external-research: article note; role-contract: Light contract。 |
| R-04 | P0 | `spec-work` 的 `Simplify as You Go` 应显式包含 CMP/SLAP 复查：入口是否像目录、同一方法是否混合业务步骤/校验/装配/IO/异常包装等不同层级、异常处理是否冲散主流程。 | confirmed-source: `skills/spec-work/SKILL.md` 当前已有简化阶段，但未列此结构 lens。 |
| R-05 | P1 | `spec-work` closeout / work-to-review handoff 在相关时应记录结构证据：主要入口、拆出的语义 helper、保留/拒绝的抽象、验证命令与限制。对应 AE-01 / AE-03。 | confirmed-source: Summary-First Handoff；supports downstream `spec-code-review`。 |
| R-06 | P0 | `spec-code-review` 的 maintainability lens 应显式把“入口叙事能力、抽象层一致性、伪抽象、异常/校验细节冲散主流程”作为结构优先检查项。 | confirmed-source: `agents/spec-maintainability-reviewer.agent.md`; external-research: article note。 |
| R-07 | P0 | `spec-code-review` 不应把所有 CMP/SLAP 问题降级为风格建议；当结构问题影响主入口理解、后续变更成本或测试可写性，finding 应带具体 reframe / suggested_fix，并按现有 confidence gate 定级。 | confirmed-source: `skills/spec-code-review/SKILL.md` confidence gate 与 demotion rules；`agents/spec-maintainability-reviewer.agent.md` concrete reframe 要求。 |
| R-08 | P1 | `spec-code-review` 的报告或 Coverage 在适用时应说明结构评审覆盖状态：已检查主流程叙事 / 抽象层一致性，或因 diff 类型不适用而跳过。对应 AE-04。 | confirmed-source: Stage 6 Coverage 机制。 |
| R-09 | P1 | 当 review 中出现可复用结构教训时，只给出 `spec-compound` 捕获建议，不在 review 中自动写 `docs/solutions/`。对应 AE-06。 | confirmed-source: `skills/spec-code-review/SKILL.md` Learning Capture Recommendation；`spec-compound` promotion gate。 |
| R-10 | P0 | `docs/solutions/` 后续应沉淀一篇 verified knowledge-track learning（`problem_type` 取 `best_practice` 或 `convention`，具体值由 `spec-compound` schema 的 `problem_type` enum 决定；schema 无独立 `category` 字段），描述 AI 生成代码中的 CMP/SLAP 结构护栏、适用条件、反例、失效条件和 source refs。 | confirmed-source: `skills/spec-compound/SKILL.md` structured promotion gate。 |
| R-11 | P0 | 该 learning 必须标注 `source_refs` 和 `invalidation_condition`；文章观点只能作为 external/advisory input，最终可复用结论必须由本仓库 source、review finding、测试或人工确认支撑。 | confirmed-source: `docs/contracts/knowledge/knowledge-harness.md` Recall Trust Boundary。 |
| R-12 | P1 | `spec-learnings-researcher` 召回该 learning 时，应以 advisory candidate 输出，并提示后续 `spec-work` / `spec-code-review` 回源确认；不把 learning 当作 hard coding standard。 | confirmed-source: `agents/spec-learnings-researcher.agent.md`。 |
| R-13 | P0 | 不新增脚本去判定“是否符合 CMP/SLAP”；可选脚本只能提供方法长度、文件行数、复杂度、wrapper 数量、helper 命名等 deterministic facts，由 reviewer 判断语义结构。 | role-contract: scripts prepare facts, LLM decides semantic adequacy。 |
| R-14 | P1 | 实施阶段修改 workflow prose / agent prose 时，必须补 contract tests 锁住关键 anchors，并按 agent/skill prose 规则做 fresh-source eval 或记录无法执行原因。对应 AE-01 / AE-04。 | confirmed-source: AGENTS.md Agent 与 Skill 变更验证规则；现有 tests pattern。 |

## Acceptance Examples

AE-01（对应 R-01/R-03/R-05/R-14）
Given `spec-work` 执行一个新增 service / workflow handler / CLI behavior 的非平凡任务
When 进入首次编辑前
Then agent 应先形成 run-local 结构预览：主入口要表达的业务步骤、下沉细节的语义边界、明确不新增的伪抽象，并在必要时把预览带入 review handoff。

AE-02（对应 R-02/R-13）
Given 一个两行文案修复或 docs-only 改动
When `spec-work` 执行
Then 不应强制生成结构预览 artifact，也不应运行任何 CMP/SLAP 结构脚本；只做适合 docs/config 的 diff-shape 或 contract check。

AE-03（对应 R-04/R-05）
Given 一个完成的行为切片包含入口方法、校验、数据装配、持久化和异常处理
When `spec-work` 进入阶段性 simplification
Then agent 应复查这些语句是否处于同一抽象层；若不一致，应优先通过语义 helper 或结构重排恢复主流程叙事，而不是只消除重复。

AE-04（对应 R-06/R-07/R-08/R-14）
Given diff 新增一个可运行但入口方法混入字段拼接、异常文案、底层调用和业务步骤的实现
When `spec-code-review` 运行 maintainability lens
Then reviewer 应将其作为结构风险评审，并在 finding 中给出具体 reframe，例如保留入口业务步骤、下沉校验/装配/IO/异常细节。

AE-05（对应 R-03/R-07）
Given diff 把三行局部逻辑拆成多个 `Helper` / `Processor` 但没有独立语义或复用价值
When review 评估 CMP/SLAP
Then reviewer 不应奖励“拆了方法”本身，而应指出这是伪抽象或复杂度搬家。

AE-06（对应 R-09/R-10/R-11/R-12）
Given `docs/solutions/` 中已有 CMP/SLAP learning
When `spec-learnings-researcher` 在后续 work/review 中召回它
Then 输出必须标为 structured recall candidate 或 legacy advisory，并携带 `source_refs` / `invalidation_condition`；下游使用前必须回源确认。

AE-07（对应 R-13）
Given 工具报告某个方法超过长度阈值
When reviewer 形成最终 finding
Then 长度只能作为证据线索；是否违反 CMP/SLAP 必须由 reviewer 结合主流程叙事、语义边界和实际变更成本判断。

## Scope Boundaries

### In Scope

- `spec-work` 的执行姿态与 handoff prose 优化。
- `spec-code-review` 的 maintainability / structural review lens 优化。
- `docs/solutions/` 中未来结构护栏 learning 的 promoted shape 与 recall 边界。
- 聚焦 contract tests / prose anchors / fresh-source eval 要求。
- 把文章原则映射为 project-local workflow requirements。

### Out Of Scope

- 新增 public workflow、agent type、中心化流程引擎或硬状态机。
- 引入默认 AST linter 来自动判定 CMP/SLAP 语义通过。
- 把文章原文直接升级为 confirmed team standard。
- 为所有语言/框架建立完整代码风格手册。
- 修改 generated runtime mirrors（`.claude/**`、`.codex/**`、`.agents/skills/**`）。
- 在本需求报告中直接实现 skill / agent / test 变更。

## Change Topology

Primary topology: workflow-change

Why this topology matters:

- 影响 `spec-work` 的执行流程提示、`spec-code-review` 的评审 lens、`docs/solutions/` 的知识捕获与召回。
- 不改变 public entrypoint，也不改变 schema/API；因此不应升级为重型 contract-change。
- 关键风险是把结构原则误做成 hard gate、或反过来只写成“代码风格建议”而不影响 AI 生成代码的执行与评审顺序。

## Surface Map

| surface | current behavior | owner/source | artifact/contract | consumer | delta | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `spec-work` skill | 执行、反馈回路、垂直切片、简化和 review handoff。 | source | `skills/spec-work/SKILL.md` | worker / future review | extend structure-first posture | confirmed-source |
| `spec-code-review` skill | review scope、reviewer selection、merge/dedup、Coverage、learning capture recommendation。 | source | `skills/spec-code-review/SKILL.md` | human reviewer / spec-work shipping | extend structure-first review reporting | confirmed-source |
| maintainability reviewer | 结构质量、复杂度删除、抽象债。 | source | `agents/spec-maintainability-reviewer.agent.md` | `spec-code-review` | add explicit CMP/SLAP lens | confirmed-source |
| `docs/solutions/` | verified learning store。 | source | `skills/spec-compound/references/schema.yaml` | plan/work/review/debug recall | add future structure learning | confirmed-source |
| tests | contract anchors for workflow/agent prose。 | source | `tests/unit/*contracts.test.js` | maintainers | add/update focused assertions | confirmed-source |

## Producer / Artifact / Consumer

| producer | artifact/schema/path | freshness/authority | consumers | change effect | evidence |
| --- | --- | --- | --- | --- | --- |
| `spec-work` | work closeout / optional run artifact / review handoff | current run, source-scoped | `spec-code-review`, human reviewer, `spec-compound` | add structure evidence only when relevant | confirmed-source: `skills/spec-work/SKILL.md` |
| `spec-code-review` | findings report / Coverage / Learning Capture Recommendation | session-scoped review, findings source-confirmed | `spec-work` shipping, PR, human reviewer, `spec-compound` | make structural findings more explicit | confirmed-source: `skills/spec-code-review/SKILL.md` |
| `spec-compound` | one `docs/solutions/**` learning doc | durable but advisory until recalled and re-confirmed | plan/work/review/debug/humans | capture structure learning after verified use | confirmed-source: `skills/spec-compound/SKILL.md` |

## Source-Of-Truth Resolution

| item | current source-of-truth | target source-of-truth | generated mirrors / non-authoritative refs | conflict rule |
| --- | --- | --- | --- | --- |
| workflow behavior | `skills/spec-work/SKILL.md`, `skills/spec-code-review/SKILL.md` | same source files | `.claude/**`, `.codex/**`, `.agents/skills/**` are generated | modify source, then project runtime through `spec-first init` only when implementation requires it |
| reviewer behavior | `agents/spec-maintainability-reviewer.agent.md` and review references | same | runtime agent mirrors generated | source wins |
| reusable learning | `docs/solutions/**` via `spec-compound` schema | future verified learning doc | article note is external advisory | learning must carry source refs and invalidation condition |
| article input | repo外本地材料 + original URL metadata | evidence row / external advisory | not repo source truth | do not treat as confirmed team standard without project confirmation |

## Goals / Success Metrics

| goal | observable signal | baseline / note |
| --- | --- | --- |
| 结构先行进入执行热路径 | `spec-work` prose 明确要求非平凡行为代码的结构预览 / 主流程骨架先行。 | 当前已有反馈回路，但没有 CMP/SLAP anchor。 |
| 结构优先进入 review 热路径 | maintainability reviewer 或 review workflow 明确检查入口叙事、抽象层一致、伪抽象。 | 当前 reviewer 已查复杂度与抽象债。 |
| 知识可复用而不越权 | 新 learning 使用 `source_refs` / `invalidation_condition`，召回时保持 advisory。 | Knowledge Harness 已定义边界。 |
| 不增加过重 ceremony | docs-only / trivial changes 不触发结构预览 artifact 或硬 gate。 | 验收 AE-02。 |
| 可验证不漂移 | contract tests 锁住关键 prose anchors；fresh-source eval 或未执行原因被记录。 | 现有 tests 模式可复用。 |

## Negative Acceptance

NA-01
Given 后续实现采用 CMP/SLAP
When 编写脚本或 checker
Then 脚本不得输出“CMP/SLAP 通过/失败”这类语义裁决，只能输出 line count、complexity、method count、wrapper count 等 deterministic facts。

NA-02
Given 一个短小清晰的函数没有拆分
When review 运行
Then 不得因为“没有拆方法”而报 finding；CMP 是为了提升主流程叙事，不是强制 extraction。

NA-03
Given 一个 docs-only 或 config-only diff
When `spec-work` / `spec-code-review` 运行
Then 不得引入结构预览 ceremony、代码结构 finding 或无关 learning capture 建议。

NA-04
Given 外部文章提出工程原则
When 写入 `docs/solutions/`
Then 不得直接把文章观点作为 verified project learning；必须结合本仓库 source/review/test 证据。

NA-05
Given source 与 generated runtime mirror 不一致
When 实现这些需求
Then 不得手改 generated mirrors 来“刷新”行为。

## Evidence And Assumptions

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 文章主张 CMP/SLAP 能约束 AI 生成代码结构风险。 | external-research | `/Users/kuang/xiaobu/spec-first-doc/业界学习/01-外部文章/ai-coding范式/2026-04-11-两条原则，让AI写出让人省心的代码.md`; original URL metadata: `https://mp.weixin.qq.com/s/tgxT4-J0FsNCD2r2G31GIA` | 本地文件声明为结构化阅读笔记，不是全文转载；完整原文未作为 repo source truth。 |
| `spec-work` 已有 feedback-loop / vertical-slice / simplify / review-required 基础。 | confirmed-source | `skills/spec-work/SKILL.md`; `skills/spec-work/references/shipping-workflow.md` | 可承接结构先行要求。 |
| `spec-code-review` 已有 maintainability reviewer、confidence gate、learning recall/capture。 | confirmed-source | `skills/spec-code-review/SKILL.md`; `agents/spec-maintainability-reviewer.agent.md` | 可在现有 lens 上扩展，无需新 reviewer。 |
| `docs/solutions/` 只能沉淀 verified learning，recall 是 advisory candidate。 | confirmed-source | `skills/spec-compound/SKILL.md`; `docs/contracts/knowledge/knowledge-harness.md`; `agents/spec-learnings-researcher.agent.md` | 阻止外部文章直接成为 hard context。 |
| Graphify query 可帮助导航 work/review/solutions 关系。 | source-candidate | `graphify query` 本轮输出 | 已用 direct source reads 确认重要结论；Graphify 不作为 confirmed source。 |
| 不需要新增 public workflow。 | assumption | role contract + source fit | 当前需求可由 existing work/review/compound 链路承载。 |

## Planning Recheck

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
| 原始微信公众号全文可访问性 | 本地文件是结构化阅读笔记，不是全文；若后续要逐句引用文章，需要重新核验原文。 | 引用原文长段或将外部原则写成 team standard 前 | no，当前需求只使用文章原则作为 advisory 输入 |
| `spec-work` 精确 prose 落点 | 本报告定义 WHAT，不指定具体段落 patch。 | 实施 plan / work 前 | no |
| `spec-code-review` demotion 是否需改 | 可能只需加强 persona 让结构 finding 带 concrete fix，而非改 Stage 5 demotion。 | 实施 plan 前 | no |
| 是否立即创建 `docs/solutions` learning | `spec-compound` 要求 recently solved / verified learning；当前是需求分析，不是已落地经验。 | 真实实现或 review 形成可复用经验后 | no |
| Fresh-source eval 能否执行 | skill/agent prose 改动后需验证；Codex dispatch 授权可能影响 subagent eval。 | source prose 实现后 closeout 前 | no，planning 不需先执行；implementation closeout 前必须执行或记录 degraded reason |

## Outstanding Questions

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-01 | 后续 verified learning 的 `problem_type` 取 `best_practice`、`convention` 还是 `architecture_pattern`？ | Requirements R-10 | not-needed | no | implementation-only-how-pushdown | no | route-out | 由 `spec-compound` 依据 `problem_type` enum 和真实证据分类；不影响本轮 WHAT。 |
| OQ-02 | maintainability demotion 是否需要 workflow 级例外？ | Requirements R-07 | not-needed | no | implementation-only-how-pushdown | no | route-out | 优先通过 reviewer 产出 concrete fix 避免被 advisory demotion；若实测不够再改 Stage 5。 |

## Decision Notes

| question | recommended_answer | source_tag | chosen_answer | consequence | deferred_reason |
| --- | --- | --- | --- | --- | --- |
| CMP/SLAP 应成为 hard gate 还是 semantic lens？ | semantic lens；脚本只准备 facts。 | confirmed-source | semantic lens | 符合角色契约，避免脚本裁决语义结构。 | none |
| 是否新增 public workflow？ | 不新增。 | confirmed-source | 不新增 | 复用 work/review/compound 三段链路，降低入口复杂度。 | none |
| 是否立即写 `docs/solutions` learning？ | 暂不在本报告中写，等真实落地或 review 形成 verified evidence。 | confirmed-source | 延后到 `spec-compound` | 避免把外部文章直接 promoted 为 durable knowledge。 | 需要 source/review/test 证据。 |
| 正文是否复述图表内容？ | 不复述，正文只写图表承载不了的结论、边界、风险、验收。 | user-stated | 采用 | 提高报告信噪比。 | none |

## Implementation Order Recommendation

1. 更新 `agents/spec-maintainability-reviewer.agent.md`：加入 CMP/SLAP 结构检查项、伪抽象边界和 concrete reframe 示例。
2. 更新 `skills/spec-work/SKILL.md`：在 Feedback Loop / Execute / Simplify / Handoff 附近加入结构预览与结构复查，保持 run-local，不新增默认 artifact。
3. 更新 `skills/spec-code-review/SKILL.md` 或相关 reference：让 Stage 6 / Coverage 能表达结构评审覆盖状态，并确保 Learning Capture Recommendation 能识别重复结构问题。
4. 补 `tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-code-review-contracts.test.js` 的 prose anchor 断言。
5. 运行最窄验证；如果改了 runtime projection 相关 source，再执行 dry-run 或 `spec-first init` 相关验证。
6. 在实际落地并经 review 后，运行 `$spec-compound` 捕获 verified CMP/SLAP learning；若已有相关 learning，再用 `$spec-compound-refresh` 合并或刷新。

## Validation Plan

- `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/knowledge-harness-contracts.test.js --runInBand`
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `git diff --check -- skills/spec-work/SKILL.md skills/spec-code-review/SKILL.md agents/spec-maintainability-reviewer.agent.md tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js CHANGELOG.md`
- 实施阶段修改 skill / agent prose 时：执行 fresh-source eval；无法执行时记录 `dispatch_authorization_missing` 或具体 degraded reason。
- 实施阶段创建 `docs/solutions` learning 时：从 `skills/spec-compound/` 运行 `python3 scripts/validate-frontmatter.py $OUTPUT_PATH`，并确认 frontmatter 含 `source_refs` / `invalidation_condition`。

## Readiness Self-Check

write_mode: checkpoint-prd
clarification_evidence: source-proven-no-ask
preflight_sweep_closure: closed
decision_card_highest_risk_gap: 把 CMP/SLAP 误做成硬 gate，或降级成无执行影响的风格建议。
decision_card_next_action: checkpoint-prd
decision_card_why_no_invention: 本报告已定义 work/review/knowledge 三段 WHAT、边界、验收与非目标；implementation HOW 保留给后续 plan/work。
design_source_coverage: not-needed
readiness_verified_by:
readiness_checker_schema:
readiness_prd_hash:
readiness_inputs_hash:
first_unclosed_owner_question: 是否接受 DQ-01 的 Problem Frame 前提为 advisory 并据此调权（详见 Deferred / Open Questions），再由 $spec-prd 重新 finalize？
recommended default: 先扩展 maintainability reviewer 与 spec-work run-local 结构预览，不新增 public workflow 或 hard checker。
can_enter_spec_plan: no
readiness_outcome: revise-prd
why_not: 上一次 finalize receipt(readiness_verified_at 2026-06-29T18:53)写入后正文被 doc-review 二次修订(见 CHANGELOG 2026-06-30 02:53)，PRD 内容 hash 已漂移(stored 56dbfcdd… vs current b96734cd…)，receipt 未重新写入即 stale。本会话(code-review)非该产物作者，不代为断定 readiness；降级为非 ready checkpoint，保留全部需求，待 $spec-prd 重新 grill / finalize。

## Deferred / Open Questions

### From 2026-06-30 doc-review

以下为多 persona 评审收敛出的范围/前提/优先级判断项，留待 planning 决策（均不阻断进入 spec-plan，但 plan 应显式回应）：

- **DQ-01（前提强度，product-lens/adversarial 收敛）**：Problem Frame 的论证是 hypothetical（「速度会放大既有模式」）且自承 do-nothing 代价轻。若仓库内无真实信号（复发 review finding、本仓库脏入口方法、维护者痛点），plan 应考虑先以 opt-in advisory learning 起步，用真实 review finding 拉动其余，而非在弱证据上压改两个热路径面。补一行 evidence 引用，或显式接受前提为 advisory 并据此调权。
- **DQ-02（R-01 热路径 ceremony，product-lens）**：R-01 把「编辑前结构预览」设为非平凡代码的强制步，与项目「gate the exits, not the thinking」+ 80/20 + 反 ceremony 哲学张力。plan 决定是否把 R-01 改为 worker 可按需应用的 advisory 提醒（gate 在 review/handoff 出口），而非强制思考前置步。
- **DQ-03（R-06/R-07 与既有 reviewer 重叠，product-lens）**：maintainability reviewer 已覆盖薄 wrapper、伪/过早抽象、complexity-moved、抽象债。真正新 delta 仅「入口方法叙事 + 同方法抽象层一致」两点。plan 应把 review-lens 需求收窄到这两点的句级扩展，去掉复述既有覆盖的措辞，并量化新 lens 比现有多抓什么。
- **DQ-04（R-07 防线未触及真正 gate，adversarial/feasibility 收敛）**：R-07 靠「concrete reframe 躲过 advisory demotion」，但抑制发生在文档未触及的两条轴——maintainability anchor-50「suppress unless P1」与 confidence gate「suppress below 75」。「入口是否叙事/抽象层是否混」是 anchor-50 判断题，诚实打 50 即被压（除非 P1）。plan 须决定：persona 级 concrete-reframe 是否足够，还是 OQ-02 的 Stage 5 demotion / 结构 finding anchor 例外确需改动；否则 highest_risk_gap 半开。
- **DQ-05（度量测不出失败，adversarial）**：Goals/Success Metrics 全部是「prose 写了没」，无法检出文档点名的最高风险（prose ritualize 成 token）。plan 应补至少一个可能返回负面的行为信号——如对植入的混层 diff 做 before/after fresh-source eval，验证 reviewer 现在会 reframe 而非 demote；区分「prose merged」（output）与「behavior changed」（outcome）。
- **DQ-06（优先级膨胀，product-lens/scope-guardian）**：9/14 标 P0，多条 P0 是边界守则（R-02/R-11/R-13）而非核心交付。plan 应把 P0 收敛到交付核心价值的 2-3 条（新 review-lens 检查），把边界/守则类降为「依赖核心落地的 P1 约束」。
- **DQ-07（R-10 优先级与延后决策矛盾，scope-guardian）**：R-10 标 P0 但三处显式延后到「真实落地/review 形成 verified evidence 后」。plan 应将 R-10 降为 deferred/P2 并标 `blocked-on: verified implementation+review evidence`，与文档自身延后决策一致，避免误排进本轮。
- **DQ-08（知识三需求复述既有契约，scope-guardian）**：R-09/R-11/R-12 rationale 全为 confirmed-source，描述已存在的不变量。plan 可考虑把它们从「需求」降为 R-10 下的既有约束引用，使 Requirements 表只保留真实 delta。
- **DQ-09（实施排序，adversarial）**：建议把最易回退的 review-lens（R-06/R-07）作为先行探针，spec-work 执行 posture（R-01/R-03/R-04）视 review finding 是否累积再决定，R-14 锁 contract-test anchor 留到 prose 证明价值后。recommended_default 已偏此方向，plan 应把分阶段作为显式决策。



Resolved before planning:
- 明确 CMP/SLAP 在 spec-first 中的定位：LLM-owned semantic lens，不是 script-owned hard gate。
- 明确三段落点：`spec-work` 结构先行、`spec-code-review` 结构优先评审、`docs/solutions` verified learning。
- 明确 source/runtime 边界：只改 source，不手改 generated mirrors。
- 明确知识边界：文章观点是 external/advisory input，durable knowledge 必须 source-confirmed。

Still carried:
- 原文全文如需逐句引用需重新核验。
- 精确 patch 落点、测试断言与 fresh-source eval 在 implementation plan/work 阶段处理。

planning_would_invent_what: no

sections included: Summary, Problem Frame, Current System Snapshot, Change Delta, Requirement Analysis Gate, Mapping Diagram, Requirements, Acceptance Examples, Scope Boundaries, Change Topology, Surface Map, Producer / Artifact / Consumer, Source-Of-Truth Resolution, Goals / Success Metrics, Negative Acceptance, Evidence And Assumptions, Planning Recheck, Outstanding Questions, Decision Notes, Implementation Order Recommendation, Validation Plan, Readiness Self-Check, Closeout Summary.
requirement count: 14
acceptance example count: 7
priority distribution: P0=9, P1=5
NFR count: 0
assumption count: 1
outstanding question count: 2 non-blocking implementation HOW pushdown items
planning recheck item count: 5
current-state claims without confirmed evidence: article interpretation remains external/advisory; repo behavior claims are confirmed from source reads.
