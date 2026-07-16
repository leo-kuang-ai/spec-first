# Spec-First 吸收 Agent Skills 能力的对标分析

> **文档类型：外部能力调研与 Spec-First 演化建议。** 本文以 `spec-first` 的使命、当前 source skill、workflow contract 和证据治理为基准，逐项审查 `addyosmani/agent-skills` 的 24 个 Skill，回答哪些内容值得吸收、应集成到哪里，以及是否需要新增公共 Skill。本文不把 `agent-skills` 作为目标产品，也不授权直接复制、安装或投射外部 Skill。

> **分析日期：** 2026-07-16
>
> **Spec-First HEAD 基线：** `a2f37c6075d35d4f686371bca4fb20c31275e142`，分支 `leo-2026-07-14-write-skill`，35 个 source Skill 目录
>
> **Spec-First working-tree 补充：** `skills/spec-plan/SKILL.md` 等文件有未提交修改，`skills/spec-plan/references/high-risk-plan-lens.md` 等文件尚未跟踪；这些内容只作为 `working-tree advisory`，不冒充上述 commit 已确认能力
>
> **Agent Skills 快照：** `98967c45a42b88d6b8fb3a88b7ff6273920763d6`，tag `0.6.4`，24 个 Skill
> **证据边界：** 两个仓库当前工作树均有未提交内容；`agent-skills` 还存在冲突中的根级文件。本文将 `HEAD confirmed` 与 `working-tree advisory` 分开，只有可在声明 revision 回放的 source 才算基线确认；未提交 source 只能说明正在演化的候选能力。静态源码结论不等于真实宿主 field outcome。

## 结论先行

对 `spec-first` 最有价值的不是把 24 个外部 Skill 再复制一套，而是吸收其中更成熟的通用软件工程知识，并嵌入 `spec-first` 已经存在的 intent → plan → work → review → evidence → knowledge 闭环。

本轮结论：

- 24 个 Agent Skill 均能找到 `spec-first` 承载点，其中 14 个承载闭环较强、10 个承载分散或不完整；
- 14/10 只描述 **入口与承载覆盖**，不代表领域内容或 evidence/verification 已达到同等成熟度；
- 当前建议 **新增 0 个公共 Skill**；
- 当前建议建设 **4 类条件能力**：新增 3 个 skill-local reference，扩展 1 个现有 high-risk lens；
- 当前建议新增 **1 个内部条件 reviewer persona**：通用 frontend/accessibility reviewer；它不是用户入口；
- `spec-observability`、`spec-security-audit`、`spec-migration` 只作为有条件的未来候选，不进入当前 catalog；
- 不直接安装或 vendoring `agent-skills` 的 Skill 文件，所有采纳内容都应按 `spec-first` 的 source-first、provider-neutral、light contract 和 eval 规则重新表达。

一句话概括：

> `spec-first` 应借鉴 `agent-skills` 的工程实践密度，但不能退化成 prompt/agent collection；先把高价值知识放进现有闭环，只有独立意图、独立产物、独立消费者和可验证完成标准同时成立时，才新增公共 Skill。

## 1. 分析目标与非目标

### 1.1 目标

本文回答四个问题：

1. `spec-first` 已有对应能力时，Agent Skill 的内容和逻辑还有哪些值得借鉴？
2. `spec-first` 没有直接对应公共 Skill 时，应该新增入口，还是并入现有 workflow？
3. 具体应该落到 principle、reference、persona/lens、workflow 还是 public Skill 哪一层？
4. 如何用可验证、可维护的分阶段路线吸收，而不破坏当前路由和治理边界？

### 1.2 非目标

- 不评价哪个项目“更高级”；
- 不按 Skill 数量做一一追平；
- 不在本报告中直接修改任何 Skill source；
- 不把 Agent Skills 中的固定技术栈、固定时间估算、固定文件数或固定宿主工具写成 `spec-first` 的通用合同；
- 不把通用工程 checklist 自动升级为强制 gate；
- 不把内部 helper 或 persona 暴露为用户入口。

## 2. 判断基准

### 2.1 Spec-First 的第一性原理

本报告以 [项目角色契约](../10-prompt/结构化项目角色契约.md) 为最高判断基准：

- 代码不再稀缺，可信变更仍然稀缺；
- 事实、语义判断和副作用授权必须分开；
- 信任只能覆盖证据直接支持的 claim；
- Host primitive 会商品化，长期价值应留在 intent、evidence、governance 和可失效 knowledge；
- scripts 强制确定性地板，LLM 判断语义充分性；
- gate exits，不 gate thinking；
- source-first，generated runtime 不是编辑真相源；
- light contract + explicit boundaries，优先最小 durable mechanism。

因此，外部 Skill 是否“内容很好”不是新增入口的充分条件。它还必须回答：谁调用、产生什么、谁消费、如何验证、失败如何降级、由谁维护。

### 2.2 五层集成模型

所有可借鉴内容按下列层级放置：

```text
工程原则
  ↓
条件 reference / checklist
  ↓
persona / reviewer lens
  ↓
现有 public workflow
  ↓
新的 public Skill（最后选择）
```

越靠下，常驻路由、维护、eval、handoff 和用户认知成本越高。能在上层解决的问题，不应直接新增公共 Skill。

### 2.3 新增公共 Skill 的六项门槛

只有同时满足以下条件，才建议 `Build`：

1. **独立用户意图**：用户能稳定表达这一需求，而不是某个 workflow 的一个步骤；
2. **独立 artifact**：输出不是普通 plan、code diff、review finding 或 knowledge doc 的同义物；
3. **独立 consumer**：有明确下游人或 workflow 使用该产物；
4. **独立完成标准**：能定义可验证的 done，不以“给了建议”结束；
5. **路由可分离**：与 `spec-plan`、`spec-work`、`spec-debug`、`spec-code-review` 等入口的正负例可稳定区分；
6. **维护 owner 与 eval**：有人维护内容、触发、失败模式和真实案例。

### 2.4 决策术语

| 决策 | 含义 |
| --- | --- |
| `Adopt` | 把原则或步骤吸收到现有 source workflow/reference/persona |
| `Wrap` | 保留宿主/provider 边界，用当前可用能力实现，不绑定外部工具 |
| `Build` | 新建独立公共 Skill |
| `Defer` | 暂不建设，等待真实频率、artifact 和 consumer 证据 |
| `Reject` | 明确不采用固定规则、重复入口或不符合治理的机制 |

## 3. 两个项目的能力形态差异

| 维度 | Agent Skills | Spec-First | 对标含义 |
| --- | --- | --- | --- |
| 产品形态 | Markdown-first 高级工程实践包 | Repo-backed AI Coding Harness | 吸收内容，不复制产品形态 |
| 入口模型 | 生命周期映射，可组合多个 Skill | 一次一个当前入口，显式 handoff | 不恢复默认自动链式执行 |
| 产物 | 以代码、测试、文档和最终回复为主 | PRD、plan、tasks、review、proof、knowledge 等显式连接 | 外部实践应落入已有 artifact |
| 证据 | Skill 内验证步骤和 checklist | claim-matched evidence、readiness、degraded reason、consumer receipt | 借鉴内容必须接受现有证据治理 |
| 多 Agent | persona + command orchestration | 显式授权、条件 dispatch、fallback、merge/dedup | 不因外部内容默认扩大 dispatch |
| 工程知识 | API、安全、CI、迁移、可观测性覆盖广 | workflow、证据、知识生命周期更强 | 主要互补区在领域工程知识 |
| 宿主适配 | 轻量安装与多工具说明 | source → 多宿主 runtime projection | 不复制 provider/tool 假设 |
| 验证 | catalog/command/trigger eval | unit/smoke/integration/contract/fresh-source eval | 采纳后需补当前仓 eval，而非只做 prose |

Agent Skills 当前静态验证事实：

```text
validate-skills.js: 24/24 通过
validate-commands.js: 8/8 通过
run-evals.js: 124 checks 通过
trigger rank-1: 86%（65/76）
```

这些结果只能证明其当前结构和 fixture 基线，不证明真实项目中的行为质量；同样，本文的源码对标也不能替代 `spec-first` 后续 fresh-source eval 和 field adoption。

### 3.1 可复现证据状态

本文使用以下 authority：

| 证据组 | 状态 | 用途与限制 |
| --- | --- | --- |
| `docs/10-prompt/结构化项目角色契约.md`、`using-spec-first`、`spec-prd`、`spec-work`、`spec-debug`、`spec-code-review`、`spec-test-browser`、`spec-optimize`、`spec-simplify-code` | `HEAD confirmed` | 可在 Spec-First commit `a2f37c...` 回放，用于确认现有入口、合同和主要闭环 |
| `skills/spec-plan/SKILL.md` 及其本轮未提交修改 | `mixed: HEAD + working-tree advisory` | HEAD 内容可确认；未提交的 high-risk、evidence、ownership 增强只作为候选演化证据 |
| `skills/spec-plan/references/high-risk-plan-lens.md`、`planning-evidence-boundaries.md`、`skills/spec-plan/evals/` | `working-tree advisory` | 当前工作树可读，但不属于声明的 HEAD；不能据此声称已发布或已被干净 checkout 消费 |
| `skills/spec-code-review/references/personas/`、`skills/spec-debug/references/investigation-techniques.md` | `HEAD confirmed` | 用于确认 API、安全、测试、可靠性、迁移和诊断支点 |
| Agent Skills 24 个 `SKILL.md` | `pinned external source` | 使用 commit `98967c...` 的固定链接；本地冲突中的根级 `AGENTS.md`、`.gitignore` 不作为能力证据 |

本报告实际使用的 working-tree advisory hash：

| Path | Git state | SHA-256 |
| --- | --- | --- |
| `skills/spec-plan/SKILL.md` | modified | `b01be2c81ce90503b74078bf91e44924fed7b74bd00731b062cba07f866d03d3` |
| `skills/spec-plan/references/high-risk-plan-lens.md` | untracked | `b6c77a2d4747c58ba9161ef580f8a3ee249baece031b422d6683c93a931f5751` |
| `skills/spec-plan/references/planning-evidence-boundaries.md` | untracked | `ea4f5ef4c9932b77c5e002d44ae61ffcc20a1d1bdad03dadc21fc5a7100a8b26` |
| `skills/spec-plan/evals/examples.json` | untracked | `7b03ca63c9d6c23af32fa3c8f7e3558d8b1eece3e7a8d93ddaa22fbae7af2fb3` |
| `skills/spec-plan/evals/output-quality-cases.json` | untracked | `81991f31f961183b985f3be0005de211edd83844fd71d3e609d3099dc07ba232` |

关键复核命令：

```bash
git -C /Users/kuang/xiaobu/spec-first rev-parse HEAD
git -C /Users/kuang/xiaobu/spec-first status --short -- skills/spec-plan
git -C /Users/kuang/xiaobu/spec-first ls-tree --name-only HEAD \
  skills/spec-plan/references/high-risk-plan-lens.md

node /Users/kuang/xiaobu/agent-skills/scripts/validate-skills.js
node /Users/kuang/xiaobu/agent-skills/scripts/validate-commands.js
node /Users/kuang/xiaobu/agent-skills/scripts/run-evals.js
```

后文没有特别标注时，“已有能力”表示 `HEAD confirmed`。依赖未提交 `spec-plan` source 的判断会明确标为 `working-tree advisory`；实施前必须以实际合入后的 HEAD 重新生成 evidence manifest。

## 4. 24 个 Skill 全量映射与决策

矩阵分开判断三类覆盖：

- **承载覆盖**：是否已有明确入口、workflow owner 和下游闭环；14/10 只统计这一列；
- **内容覆盖**：Agent Skill 中的领域工程知识是否已被 `spec-first` 明确表达；
- **证据闭环**：适用场景是否有 verification、review、eval 或可回源完成证据；
- **强**表示该维度已有明确机制，**部分**表示已有支点但仍需补强，**无**表示当前 source 没有可识别承载点。

外部能力的处置使用 `Adopt / Wrap / Build / Defer / Reject`；本地 source 资产是否新增则使用 `reuse / extend / compose / new`，两套术语分别回答“吸收什么”和“由谁实现”，不能混用。

| # | Agent Skill | Spec-First 当前对应 | 承载 | 内容 | 证据 | 最值得借鉴 | 建议落点 | 处置 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [`using-agent-skills`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/using-agent-skills/SKILL.md) | [`using-spec-first`](../../skills/using-spec-first/SKILL.md) | 强 | 强 | 强 | lifecycle visual、confusion/assumption、push back | 入口说明与示例 | `Adopt`，不新增 |
| 2 | [`interview-me`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/interview-me/SKILL.md) | `spec-brainstorm`、`spec-prd` | 部分 | 部分 | 部分 | guess-attached question、want/should-want、意图复述 | brainstorm/prd 澄清策略 | `Adopt`，不新增 |
| 3 | [`idea-refine`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/idea-refine/SKILL.md) | `spec-ideate`、`spec-brainstorm` | 强 | 强 | 部分 | How Might We、5–8 个变体、价值/可行性/差异化、Not Doing | ideate/brainstorm 输出压缩 | `Adopt`，不新增 |
| 4 | [`spec-driven-development`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/spec-driven-development/SKILL.md) | `spec-brainstorm`、[`spec-prd`](../../skills/spec-prd/SKILL.md)、[`spec-plan`](../../skills/spec-plan/SKILL.md) | 强 | 强 | 强 | 轻量 spec、Always/Ask First/Never、living spec | PRD 边界词汇、plan bootstrap | `Adopt`，不新增 |
| 5 | [`planning-and-task-breakdown`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/planning-and-task-breakdown/SKILL.md) | `spec-plan`、`spec-write-tasks` | 强 | 强 | 强 | dependency graph、vertical/risk-first slice、acceptance/verification/files | plan units、task-pack | `Adopt`，不新增 |
| 6 | [`incremental-implementation`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/incremental-implementation/SKILL.md) | [`spec-work`](../../skills/spec-work/SKILL.md) | 强 | 强 | 强 | vertical/contract-first/risk-first、安全默认、rollback-friendly | work execution reference | `Adopt`，不新增 |
| 7 | [`test-driven-development`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/test-driven-development/SKILL.md) | `spec-work`、[`spec-debug`](../../skills/spec-debug/SKILL.md)、testing reviewer | 部分 | 部分 | 部分 | RED/GREEN/REFACTOR、DAMP、state over interaction、test doubles | plan verification、work reference、reviewer | `Adopt`，不新增 |
| 8 | [`debugging-and-error-recovery`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/debugging-and-error-recovery/SKILL.md) | `spec-debug` | 强 | 强 | 强 | stop-line、reproduce/localize/reduce、untrusted error output | debug 主干与 investigation reference | `Adopt`，不新增 |
| 9 | [`code-review-and-quality`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/code-review-and-quality/SKILL.md) | [`spec-code-review`](../../skills/spec-code-review/SKILL.md) | 强 | 强 | 强 | 五轴底座、structural remedy、tests-first、净健康度 | maintainability/testing persona | `Adopt`，不新增 |
| 10 | [`browser-testing-with-devtools`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/browser-testing-with-devtools/SKILL.md) | [`spec-test-browser`](../../skills/spec-test-browser/SKILL.md)、`spec-dogfood`、`spec-polish` | 强 | 强 | 强 | profile isolation、untrusted page data、read-only JS、完整 runtime coverage | browser capability contract | `Wrap + Adopt`，不绑定 provider |
| 11 | [`performance-optimization`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/performance-optimization/SKILL.md) | [`spec-optimize`](../../skills/spec-optimize/SKILL.md)、performance personas | 部分 | 部分 | 强 | measure → identify → fix → verify → guard、RUM、budgets | plan/work/review/browser reference | `Adopt`，不新增 |
| 12 | [`code-simplification`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/code-simplification/SKILL.md) | [`spec-simplify-code`](../../skills/spec-simplify-code/SKILL.md) | 强 | 强 | 强 | Chesterton’s Fence、近期改动、测试不改、清晰度不等于行数 | simplify 与 maintainability | `Adopt`，不新增 |
| 13 | [`git-workflow-and-versioning`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/git-workflow-and-versioning/SKILL.md) | `spec-work`、`spec-commit`、`spec-commit-push-pr`、`spec-worktree` | 强 | 强 | 强 | save point、提交边界、明确未触及内容 | work/commit handoff | `Adopt`，不新增 |
| 14 | [`shipping-and-launch`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/shipping-and-launch/SKILL.md) | work shipping tail、commit/PR、browser/polish、release notes | 强 | 部分 | 强 | flag 生命周期、staged rollout、阈值、on-call questions | shipping、deployment verification | `Adopt`，不新增 |
| 15 | [`context-engineering`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/context-engineering/SKILL.md) | `using-spec-first`、`spec-runtime-setup`、repo profile/evidence contracts | 强 | 强 | 强 | context hierarchy、freshness、必要上下文、显式 assumptions | entry governance、repo grounding | `Adopt`，不新增 |
| 16 | [`source-driven-development`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/source-driven-development/SKILL.md) | plan/compound docs researchers、source-first policy | 强 | 强 | 强 | version、official source、conflict、citation、UNVERIFIED | researcher invocation contract | `Adopt`，不新增 |
| 17 | [`doubt-driven-development`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/doubt-driven-development/SKILL.md) | adversarial review、doc review、fresh-source eval、confidence gate | 强 | 强 | 强 | CLAIM → EXTRACT → DOUBT → RECONCILE → STOP、最小 reviewer context | adversarial/fresh-source contract | `Adopt`，不新增 |
| 18 | [`api-and-interface-design`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/api-and-interface-design/SKILL.md) | architecture strategist、API contract reviewer、PRD compatibility | 部分 | 部分 | 部分 | Hyrum、One-Version、contract-first、additive evolution、error semantics | PRD + plan lens + reviewer | `Adopt`，不新增 |
| 19 | [`frontend-ui-engineering`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/frontend-ui-engineering/SKILL.md) | polish/test-browser/dogfood/app audit、frontend race reviewer | 部分 | 部分 | 部分 | composition、state hierarchy、tokens、WCAG、完整 UI states | plan/work reference + internal reviewer | `Adopt`，不新增 |
| 20 | [`security-and-hardening`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/security-and-hardening/SKILL.md) | security sentinel、security reviewer；high-risk lens 为 working-tree advisory | 部分 | 部分 | 部分 | threat model、trust boundary、abuse case、LLM output untrusted、reachability | PRD/plan/work/review spine | `Adopt`；审计入口 `Defer` |
| 21 | [`ci-cd-and-automation`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/ci-cd-and-automation/SKILL.md) | deployment verification、silent-pass review、shipping tail | 部分 | 部分 | 部分 | gate order/fidelity、preview、flag、staged rollout、rollback | high-risk lens + work/review | `Adopt`，不新增 |
| 22 | [`deprecation-and-migration`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/deprecation-and-migration/SKILL.md) | data migration planner/reviewer、rollback、expand/contract | 部分 | 部分 | 部分 | replacement-first、consumer inventory、Strangler/Adapter、zero-use | PRD consumer/sunset + plan lens | `Adopt`；迁移入口 `Defer` |
| 23 | [`documentation-and-adrs`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/documentation-and-adrs/SKILL.md) | plan decision notes、PRD decision ledger、`spec-compound`、release notes | 部分 | 部分 | 部分 | why/alternatives/consequences、ADR lifecycle、supersession | plan/compound decision record | `Adopt`，不新增 |
| 24 | [`observability-and-instrumentation`](https://github.com/addyosmani/agent-skills/blob/98967c45a42b88d6b8fb3a88b7ff6273920763d6/skills/observability-and-instrumentation/SKILL.md) | deployment verification、debug instrumentation、shipping metrics；high-risk lens 为 advisory | 部分 | 部分 | 部分 | on-call questions、signals、correlation、RED/USE、cardinality、alert validation | high-risk lens + work/debug/review/shipping | `Adopt`；独立入口 `Defer` |

汇总：

| 承载覆盖 | 数量 | 处理原则 |
| --- | ---: | --- |
| 强对应 | 14 | 深化现有 source，不新增同义入口 |
| 部分覆盖 | 10 | 补条件 reference/persona/lens，先验证采用 |
| 完全无承载点 | 0 | 当前没有必须从零 Build 的公共 workflow |

该汇总不统计内容或证据成熟度。即使承载为“强”，如 shipping、ideation，也可能存在明确的内容或 field-evidence 缺口；后续优先级以三列共同判断，不能只看 14/10。

## 5. 已有强对应能力的深度比较

### 5.1 入口路由：`using-agent-skills` → `using-spec-first`

Agent Skills 的优势是生命周期图非常易懂，并把 simplicity、scope、assumption、push back 放在入口层。`using-spec-first` 的优势是路由边界更成熟：

- Direct Lane 与 workflow lane 分离；
- immediate intent 优先于关键词；
- 一次只选择一个公共入口；
- 已在 workflow 或 bounded worker 中时不重新路由；
- helper 不暴露为 public entrypoint；
- 入口授权不自动等于 subagent、外部数据或副作用授权。

建议只吸收两点：

1. 为新用户保留一张极简 lifecycle 导航图，但明确它是地图，不是自动串行状态机；
2. 在 Direct Lane 和需求 intake 中更明确地写出“当前假设”“存在的混乱”“为什么需要 push back”。

不采用：

- “任意任务只要有 1% 可能匹配就必须先加载 Skill”这类无差别强制；
- 每个请求默认跑完整 DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP；
- 把 meta-skill 变成长期持有执行权的 orchestrator。

### 5.2 需求发现：`interview-me`、`idea-refine`、`spec-driven-development`

`spec-ideate`、`spec-brainstorm`、`spec-prd` 已覆盖从发散、协作澄清到 brownfield PRD readiness 的完整路径，能力深度高于单个外部 Skill。仍值得借鉴：

- **guess-attached question**：提问时带上当前推测，用户能更快纠偏；
- **want vs should want**：区分用户实际目标与模板化需求；
- **How Might We**：把问题改写成可探索的机会；
- **Not Doing**：在早期压住范围蔓延；
- **Always / Ask First / Never**：将权限和行为边界写成容易理解的业务语言；
- **轻量 spec path**：低复杂度任务不应被迫进入完整 PRD。

不采用：

- 把“95% confidence”作为可验证事实；这是主观读数，不能成为硬 gate；
- 所有 intake 都变成长访谈；
- 用固定数量的问题替代 readiness 语义判断；
- 让 spec 文档在实现阶段无边界地持续改写产品 WHAT。

具体集成：

- `spec-brainstorm`：增加可选的“当前 guess + 一个问题”提问策略；
- `spec-prd`：在目标复述中明确“用户真正想得到的结果”和 Not Doing；
- `spec-plan`：只在上游 WHAT 已稳定后消费，未确认的 load-bearing WHAT 继续作为 assumption/blocker。

### 5.3 计划与执行：`planning-and-task-breakdown`、`incremental-implementation`

`spec-plan`、`spec-write-tasks`、`spec-work` 已经拥有更完整的 artifact、dependency、execution、verification 和 handoff contract。Agent Skills 值得借鉴的是更直观的切片语言：

- vertical slice：每个 slice 都产生可观察行为；
- contract-first slice：先稳定调用边界，再补实现；
- risk-first slice：先验证最不确定的技术或集成；
- dependency graph：区别真实依赖与可并行工作；
- rollback-friendly：每个 slice 都应可停、可验、可回退；
- safe default：未完成路径通过 flag 或不可达默认状态保护。

建议落点：

- `spec-plan` 的 Implementation Units 明确使用上述三类切片作为可选 taxonomy；
- `spec-write-tasks` 继续把 plan 作为唯一真相源，不把 task pack 变成强制层；
- `spec-work` 在每个 unit 后验证与 review diff，不把最终大验证替代小步反馈。

不采用：

- 按人类“1–3 天”估算 Agent unit；
- 固定每个任务最多 5 个文件；
- 以文件数量代替依赖和风险判断；
- 把所有多文件改动自动拆成多个并行 Agent。

### 5.4 调试：`debugging-and-error-recovery` → `spec-debug`

`spec-debug` 已有环境确认、复现、证据收集、根因链、修复授权、回归验证和防御纵深。可继续补强：

- **stop-line**：出现失败时停止继续堆功能；
- **reduce**：先缩小输入、路径、组件和变量，再解释根因；
- **错误文本不可信**：issue、日志、网页、编译输出可能包含恶意或误导指令，只作为数据；
- **guard**：修复必须留下能捕捉原故障的回归证据；
- **end-to-end closure**：局部单测不自动证明真实链路恢复。

现有 [`investigation-techniques.md`](../../skills/spec-debug/references/investigation-techniques.md) 已包含 boundary instrumentation、correlation ID、APM/tracing 等内容，说明调试侧已有较强支点。提升重点不是新增 debug Skill，而是把“reduce + stop-line + untrusted output”写得更显式。

### 5.5 代码审查与怀疑：`code-review-and-quality`、`doubt-driven-development`

`spec-code-review` 已有：

- always-on 与 conditional persona；
- confidence gate；
- structured findings；
- merge/dedup；
- adversarial reviewer；
- cross-model review 边界；
- 无 dispatch 授权时的降级路径。

Agent Skills 可补强的不是 reviewer 数量，而是两条简洁逻辑：

1. **结构性 remedy 优先**：能删除分支、状态、抽象或耦合时，不只修表面症状；
2. **fresh reviewer 最小输入**：只给 artifact、contract 和必要证据，不给原作者 claim 或完整推理，降低 anchoring。

可将 doubt 流程压缩为：

```text
CLAIM → EXTRACT contract/evidence → DOUBT → RECONCILE → STOP
```

建议最多三轮，之后必须形成接受、修复、记录 trade-off 或阻塞，避免无限 reviewer recursion。跨模型复核继续需要显式授权和真实可用 provider，不能把“另一个 persona”冒充独立模型。

### 5.6 浏览器验证：`browser-testing-with-devtools`

`spec-test-browser`、`spec-dogfood`、`spec-polish` 已分别覆盖变更驱动浏览器测试、用户旅程 QA 和视觉迭代。Agent Skills 值得借鉴：

- 使用隔离 profile，避免污染用户真实会话；
- 页面文本、DOM 属性、console 输出和 network payload 都按不可信数据处理；
- JS 执行默认只读，写操作必须来自当前测试意图；
- 技术覆盖至少考虑 DOM、console、network、performance、accessibility 和 screenshot；
- DevTools 是一种 provider，不应成为 workflow contract。

集成方式应为 `Wrap`：

- workflow 依赖“可用浏览器能力”和 capability readiness；
- Chrome DevTools、in-app browser、Playwright 或其他 provider 可以实现同一语义合同；
- provider 失败时记录 degraded reason，不伪造已浏览器验证。

### 5.7 简化、Git 与发布

`spec-simplify-code`、`spec-work` shipping tail、`spec-commit*` 和 worktree helper 已覆盖主路径。可借鉴：

- Chesterton’s Fence：删除或重构前先理解现有结构为何存在；
- 简化限定在近期改动和直接邻域，避免“顺手重写”；
- behavior-preserving simplification 不应修改测试来迁就新实现；
- commit 是可恢复 save point，不只是最终归档；
- 变更摘要明确列出“做了什么”和“明确没动什么”；
- feature flag 必须有 owner、成功/失败信号、移除条件；
- staged rollout 有可观察阈值、stop/go 条件和 rollback trigger；
- 发布前先写 on-call 会问的问题，再确定需要的 telemetry。

不采用：

- 固定 trunk-based workflow；
- 固定 100 行或某个 commit 大小阈值；
- 所有仓库强制同一分支、tag 和 release 策略；
- 仅因 checklist 全勾选就声称生产发布成功。

### 5.8 Context 与 source-driven

`spec-first` 已有 source/runtime 边界、repo grounding、provider readiness、freshness 和 advisory/confirmed 区分。Agent Skills 可提供更简洁的统一 source protocol：

```text
检测当前版本
  → 优先官方文档/规范/源码
  → 检查 deprecation 与 migration guide
  → 与当前代码冲突时显式呈现
  → 给出深链接和版本
  → 无法验证则标 UNVERIFIED
```

该协议应并入 `spec-plan` 和 `spec-compound` 的 docs researcher invocation contract，而不是新增 `spec-source-driven`。Context 方面继续坚持“必要、最新、可回源”，不能把大段历史 transcript、provider graph 或旧 plan 直接升级为 confirmed truth。

## 6. 无直接独立 Skill 的 10 项：是否需要集成

这里的“无直接独立 Skill”不等于完全没有能力，而是没有一个公共入口完整承载 Agent Skill 的领域知识。

### 6.1 `interview-me`：并入需求 workflow，不新增 intake Skill

现有承载点：

- `spec-brainstorm` 负责协作澄清和需求成形；
- `spec-prd` 负责 brownfield PRD create/refine/validate；
- `using-spec-first` 负责入口选择。

真实缺口只是提问体验，不是新的 artifact。应 `Adopt` guess-attached question、intent restatement 和 explicit out-of-scope；不应 `Build` `spec-interview`。

### 6.2 `test-driven-development`：补测试设计 reference，不新增 TDD 入口

当前强项：

- `spec-work` 有执行期反馈环；
- `spec-debug` 有 test-first 修复纪律；
- code review 的 testing persona 会找行为变化和测试缺口。

当前缺口：

- RED/GREEN/REFACTOR 的执行证据边界不够集中；
- 缺少 DAMP、state over interaction、test double hierarchy 等测试设计原则；
- 缺少“何时 characterization test 优先”的统一说明。

建议：

- 在 `spec-plan` Verification Contract 中增加按 claim 选择 test level；
- 新增内部 `spec-work/references/test-design-and-slicing.md`；
- 扩展 testing reviewer，识别 interaction-heavy mocks 和假绿色；
- 明确没有观察到 RED 时不能声称完成 TDD 历史。

不新增 `spec-tdd`，因为它是 `spec-work`/`spec-debug` 的执行策略，不是独立用户 artifact。

### 6.3 `performance-optimization`：战术性能知识并入现有优化闭环

`spec-optimize` 是通用、指标驱动、多实验优化 workflow，不等于前后端性能指南；plan/review 已有 performance persona。缺口在战术知识：

- Core Web Vitals、bundle/image/cache；
- N+1、查询计划、pagination/streaming；
- synthetic 与 RUM；
- performance budget 和 regression guard。

建议把这些作为条件 reference，被 `spec-plan`、`spec-work`、`spec-code-review` 和 `spec-test-browser` 按需读取。`spec-optimize` 继续负责实验协议，不应塞入所有性能 checklist；也不新增 `spec-performance`。

### 6.4 `api-and-interface-design`：新增 interface/evolution lens，不新增公共入口

现有证据：

- [`api-contract-reviewer.md`](../../skills/spec-code-review/references/personas/api-contract-reviewer.md) 已检查 breaking changes、versioning、error shape、sentinel semantics 和兼容类型变化；
- `spec-plan` 已要求覆盖 API/schema/event contract、compatibility、rollback 和 verification；
- `spec-prd` 已承载产品行为、验收和兼容性 WHAT。

真实缺口：

- 设计期没有集中表达 Hyrum’s Law、One-Version Rule、contract-first；
- 缺少一致错误语义、只在外部边界验证、输入/输出类型分离；
- pagination、PATCH、discriminated union、branded ID 等实用模式尚未形成条件 reference；
- 一般 API deprecation 与消费者迁移不够完整。

建议：

- `spec-prd`：公共接口变更时要求 consumer、兼容窗口、sunset 和 acceptance；
- `spec-plan`：新增 `interface-and-evolution-lens.md`；
- `spec-code-review`：扩展 API contract persona，加入 consumer tracing、additive evolution 和 one-version checks；
- `spec-compound`：记录长期有效的接口决策与迁移经验。

不新增 `spec-api-design`：API 设计最终仍产生 PRD/plan/code/review 现有 artifact。

### 6.5 `frontend-ui-engineering`：补实施期工程 discipline

现有证据：

- `spec-polish` 负责浏览器中的共同视觉迭代；
- `spec-test-browser` 与 `spec-dogfood` 负责运行时验证和用户旅程；
- `spec-app-consistency-audit` 覆盖移动 App 的 PRD/Figma/source 一致性；
- code review 有 frontend race 和 Swift/iOS reviewer。

真实缺口：

- 通用 Web 前端的 composition、data/presentation separation、状态层级和 design token 没有集中 contract；
- 通用 accessibility reviewer 缺失；
- loading/error/empty/permission/offline/retry 等状态覆盖不稳定；
- responsive、keyboard、focus、ARIA、contrast 目前主要靠具体 workflow 临场判断。

建议：

- `spec-plan`：新增 `frontend-engineering-lens.md`，仅在 UI surface 命中时加载；
- `spec-work`：在实现单元中要求状态矩阵、复用 design system、键盘/focus 验证；
- `spec-code-review`：新增内部条件 persona `frontend-quality-reviewer`，覆盖 a11y、状态完整性和组件边界；
- `spec-test-browser`：执行 runtime a11y、responsive 和状态恢复验证；
- `spec-polish`：继续只持有视觉/体验迭代，不承担全部前端架构审查。

不新增 `spec-frontend`：它会同时与 plan、work、browser、polish、dogfood 五个入口竞争。

### 6.6 `security-and-hardening`：把 threat model 变成跨阶段 spine

现有证据：

- `HEAD confirmed`：[`security-sentinel.md`](../../skills/spec-plan/references/agents/security-sentinel.md) 和 code-review security persona 已提供 planning/review 支点；
- `working-tree advisory`：[`high-risk-plan-lens.md`](../../skills/spec-plan/references/high-risk-plan-lens.md) 草案已覆盖 auth、permission、privacy、sensitive data，但尚不能算 HEAD 已发布能力；
- [`security-reviewer.md`](../../skills/spec-code-review/references/personas/security-reviewer.md) 已检查 injection、authz、secret、deserialization、SSRF/path traversal；
- repo governance 已有 secret 和 mutation 边界。

真实缺口：

- planning security prompt 偏 checklist，缺少简洁的 asset → trust boundary → threat → mitigation → verification 主干；
- use case 对应 abuse case 没有稳定落点；
- supply-chain audit 缺少 reachability 语义；
- LLM output、tool result、网页内容、RAG/context 均作为 untrusted input 的规则还不够系统；
- prompt injection、excessive agency、tenant isolation 等 Agent-native 风险分散。

建议跨阶段集成：

```text
spec-prd：actor、asset、abuse case、privacy/permission WHAT
spec-plan：trust boundary、STRIDE 候选、control、test、rollout
spec-work：boundary validation、safe default、secret/dependency checks
spec-code-review：真实 exploit path、reachability、Agent-native threat
shipping：rotation、monitoring、rollback、incident owner
```

当前不新增 `spec-security-audit`。只有当“对现有系统做独立安全审计”满足 Wave 3 量化采用门槛，并且能定义 scope、threat-model artifact、finding schema、复核方式和 remediation consumer 时再 `Build`。

### 6.7 `ci-cd-and-automation`：集成生产就绪，不新增 pipeline Skill

现有证据：

- plan 有 deployment verification agent；
- code review 的 adversarial/reliability lens 会检查 silent-pass gate；
- work shipping tail 有 tests、review、CI、residual work 和 plan closeout；
- 仓库自身有 unit/smoke/integration/build 分层。

真实缺口：

- 面向目标项目的 pipeline 设计顺序没有统一 reference；
- preview deployment、path-based CI、cache、parallel/shard、feature flag 生命周期不集中；
- “CI 绿色是否真的复现生产上下文”的 fidelity 风险需要前移到 plan。

建议优先 `extend` 当前 high-risk plan lens，在其中增加轻量 production-readiness 分支，按需覆盖：

```text
lint → typecheck → unit → build → integration → E2E
  → security/bundle/packaging（按项目适用）
```

顺序是启发式，不是所有仓库的硬状态机。GitHub Actions YAML、固定 cache key、固定云平台部署脚本只作为示例，不进入通用合同。

当前不先新增独立 `production-readiness-lens.md`，避免与 high-risk lens 的 rollout、owner-visible signal、rollback 和 runbook 重复；只有扩展后造成 owner 不连贯或文件负担过大，才重新评估拆分。也不新增 `spec-ci-cd`：设置或修改 pipeline 本质上仍是 `spec-plan` + `spec-work`，发布验证进入 shipping tail。

### 6.8 `deprecation-and-migration`：从数据迁移扩展到消费者迁移

现有证据：

- [`data-migration-reviewer.md`](../../skills/spec-plan/references/agents/data-migration-reviewer.md) 已覆盖 expand/contract、backfill、dual-write、deploy window、rollback 和 verification SQL；
- code review 有同域 reviewer 和 deployment verification；
- `working-tree advisory` high-risk lens 要求 compatibility/rollback window；HEAD 基线仍主要依赖 data-migration specialist 和 plan 通用兼容/回滚要求。

真实缺口：

- API、feature、module、event 和系统替换的通用 deprecation 生命周期不完整；
- 缺少 replacement-first、consumer inventory、compulsory/advisory 迁移分类；
- 缺少 zero-use evidence 和 zombie code owner；
- Strangler、Adapter、Feature Flag 的选择条件未集中。

建议：

- `spec-prd`：明确消费者、替代路径、sunset 条件和对外行为；
- `spec-plan` 的 interface/evolution lens：使用 expand → dual-run/backfill → switch → contract；
- `spec-code-review`：API contract persona 检查 deprecated surface、consumer 和 removal evidence；
- `spec-compound`：沉淀迁移过程中发现的兼容模式和失效条件。

当前不新增 `spec-migration`。只有当迁移满足 Wave 3 量化采用门槛，成为跨版本、跨团队、跨发布窗口的长期 artifact，且有证据表明普通 plan 无法承担其生命周期时再评估。

### 6.9 `documentation-and-adrs`：条件化 decision record，不强制 ADR 目录

现有证据：

- PRD 有 domain language 和 decision ledger；
- plan 会记录 KTD、trade-off、rejected alternative 和 consequence；
- `spec-compound` 记录已解决问题、验证和可失效 knowledge；
- repo `CHANGELOG.md` 和发布相关文档记录版本变化。

真实缺口：

- proposed/accepted/superseded/deprecated 的决策生命周期没有统一表达；
- 何时需要长期 ADR、何时 plan decision note 已足够，边界不够显式；
- 旧决策应被 supersede 而不是删除的规则可补强。

建议：

- 只有不可逆、跨组件、真实 trade-off、未来维护者可能无法从代码恢复 why 时，才建议项目自己的 ADR；
- 默认把决策放在 canonical plan 或现有项目 decision system；
- `spec-compound` 可引用 ADR，但不要把 ADR 和 solved-problem knowledge 混为一体；
- 不强制创建 `docs/decisions/`，不新增 `spec-adr`。

### 6.10 `observability-and-instrumentation`：当前最明显的内容缺口

现有支点：

- `working-tree advisory` high-risk plan lens 会要求 observable signal、monitoring/alerting、runbook；
- deployment verification 会要求 metrics、logs、dashboard、alert threshold；
- debug investigation reference 已覆盖 correlation ID、error tracker、APM 和 distributed trace；
- shipping tail 会列出部署后 metrics/dashboard。

但这些内容主要服务 migration/debug/launch，尚未形成“设计可观察系统”的统一工程协议。最值得吸收：

- 先列出 on-call 需要回答的问题；
- metrics 回答“发生了什么”，traces 回答“在哪里”，logs 回答“为什么”；
- structured event logging 和 correlation/trace ID；
- RED/USE 作为候选方法，不作为所有系统硬模板；
- cardinality 和敏感数据控制；
- symptom-based、actionable alert；
- 每个 alert 有 owner、runbook、threshold 和期望动作；
- telemetry 自身也需要验证，不能只验证代码分支；
- OpenTelemetry 作为可选标准，不绑定具体 vendor。

建议集成：

- `spec-plan`：优先扩展 high-risk lens 的 production-readiness 分支，加入 on-call questions、signals、cardinality/privacy、alert/owner/runbook；当前不先创建独立 `production-readiness-lens.md`；
- `spec-work`：instrumentation 与业务行为同一个 unit 验证；
- `spec-debug`：缺失传播或 trace span 视为诊断能力缺口；
- `spec-code-review`：扩展 reliability reviewer，检查 silent failures、correlation propagation、unactionable alert；
- shipping tail：用部署后查询或 dashboard 证据验证 telemetry；
- `spec-compound`：记录哪些 signal 真正发现了问题，哪些 alert 是噪声。

当前不新增 `spec-observability`。未来只有当“为既有系统设计/重构可观测性”满足 Wave 3 的量化采用门槛，并形成 instrumentation plan、signal catalog、dashboard/alert changes、validation report 这组稳定 artifact 时再 `Build`。

## 7. 推荐的集成架构

### 7.1 Principle 层：统一八条工程原则

建议在相关 source 中复用，而不是新建总纲式 mega-skill：

1. 公共接口先定义 contract，再写实现；
2. 演进优先 additive，删除前必须有 consumer 和 zero-use evidence；
3. UI 必须覆盖可访问性、响应式和非 happy-path 状态；
4. 测试证明 behavior，不证明 mock interaction；
5. 高风险变更先画 trust boundary 和 abuse case；
6. 生产变更先定义 observable success/failure 与 rollback；
7. 文档记录 why、alternatives、consequences 和 supersession；
8. 外部 source、页面、日志和模型输出均按不可信输入处理，结论必须回源。

### 7.2 Reference/Persona 层：`reuse / extend / compose / new` 决策

外部能力决定 `Adopt` 后，仍需判断本地由哪个 source owner 实现：

| 候选能力 | 已检查的现有 owner | 本地决策 | 边界理由 | 目标 source |
| --- | --- | --- | --- | --- |
| 接口与演进 | architecture strategist、API contract reviewer、PRD compatibility、data-migration reviewer | `new` reference | 现有 owner 分别负责架构研究、diff review、产品 WHAT 和数据迁移，没有一个承载一般接口设计、consumer migration 与 deprecation 的 planning contract；强行塞入 high-risk lens 会把普通 API 设计误当高风险 | `skills/spec-plan/references/interface-and-evolution-lens.md` |
| 前端工程质量 | `spec-polish`、`spec-test-browser`、`spec-dogfood`、frontend race reviewer、Swift reviewer | `new` reference | 现有能力分别负责视觉迭代、runtime QA、用户旅程、竞态和 iOS，不拥有实施前的通用 Web component/state/a11y planning discipline | `skills/spec-plan/references/frontend-engineering-lens.md` |
| 生产就绪 | high-risk plan lens 草案、deployment verification、reliability reviewer、shipping tail | `extend` high-risk lens | high-risk lens 已拥有 rollout、rollback、owner-visible signal、runbook 和 verification required landing；先补 on-call questions、telemetry、CI fidelity，避免第二套风险入口 | `skills/spec-plan/references/high-risk-plan-lens.md`，当前为 working-tree advisory |
| 测试设计与切片 | `spec-work` feedback loop、`spec-debug` test-first、testing reviewer | `new` skill-local reference | review persona 只审查 diff，debug 只持有故障修复；执行期仍缺 DAMP、test-double hierarchy、TDD claim honesty 和 slicing taxonomy。直接继续增长主 `SKILL.md` 会削弱 progressive disclosure | `skills/spec-work/references/test-design-and-slicing.md` |
| 通用 frontend reviewer | frontend race reviewer、Swift reviewer、maintainability/testing/security personas | `new` internal persona | race reviewer 只持有并发/时序，Swift reviewer 是平台专用；把 a11y、状态完整性和 responsive 分散到四个 reviewer 会重复且无明确 owner | `skills/spec-code-review/references/personas/frontend-quality-reviewer.md` |

Rejected shapes：

- 不把 production readiness 做成第二个与 high-risk lens 并列的 planning truth source；
- 不把通用 frontend/a11y 塞入 race reviewer 或 Swift reviewer；
- 不让 API reviewer 反向持有 plan-time 设计；
- 不复制同一 reference 给多个 Skill；跨 Skill 只传播最小合同或明确的 handoff 字段。

以上路径都是 **skill-local ownership**，不是跨 Skill import。`spec-prd`、`spec-code-review`、`spec-debug`、`spec-test-browser` 和 shipping tail 在自己的 source 或 persona 中承载所需最小条款；如确需字节级重复合同，必须指定 canonical owner 并增加 parity test。

### 7.3 Persona/lens 层

建议扩展：

- `api-contract-reviewer`：Hyrum、consumer trace、additive evolution、deprecation removal evidence；
- `security-reviewer`：Agent-native trust boundary、prompt/tool output、dependency reachability；
- `testing-reviewer`：DAMP、state vs interaction、test double hierarchy、TDD claim honesty；
- `reliability-reviewer`：correlation propagation、silent failure、telemetry/alert actionability；
- `deployment-verification-agent`：保持风险数据部署的现有 scope；通用高风险发布只复用其 checklist 思路，由 production-readiness lens、reliability reviewer 和 shipping tail 分别持有，不扩大该 persona 的 ownership。

建议新增一个内部条件 persona：

- `frontend-quality-reviewer`：只在通用 Web UI、组件、表单、状态和样式行为命中时启用，检查 accessibility、状态完整性、responsive 和组件/data 边界。

该 persona 不应成为 public Skill，也不应仅因出现 `.tsx`/`.vue` 文件就自动激活；需由 diff 语义判断：

- **启用**：新增或修改用户可见交互、表单、导航、异步状态、组件公共行为、responsive 或 accessibility contract；
- **不启用**：纯类型、构建配置、测试 fixture、无行为的文案/样式 token 更新、backend-only diff；
- **ownership**：frontend-quality 持有 a11y、状态完整性、responsive 和 presentation/data boundary；race reviewer 持有 timing/concurrency，testing reviewer 持有测试充分性，security reviewer 持有 unsafe rendering 与 exploit path；
- **输出**：继续使用现有 findings schema、confidence gate 和 merge/dedup，不建立第二套 finding contract；
- **成本控制**：只有语义 gate 命中才加入 roster，并用 backend-only、docs-only、CSS-token-only negative fixtures 保护触发边界。

### 7.4 Workflow 层的 ownership

| Workflow | 应持有的新增内容 |
| --- | --- |
| `spec-brainstorm` / `spec-prd` | guess-attached questions、Not Doing、actor/abuse case、public consumer/sunset WHAT |
| `spec-plan` | interface/evolution、frontend、production-readiness 条件 lens；test level 与 rollout proof |
| `spec-write-tasks` | 保持 derived-only；传播适用 lens 的 unit、verification 和 stop condition |
| `spec-work` | slicing taxonomy、test-design discipline、instrumentation 与行为同验 |
| `spec-debug` | stop-line、reduce、untrusted error output、correlation/tracing gap |
| `spec-code-review` | 扩展 API/security/testing/reliability，新增内部 frontend-quality |
| `spec-test-browser` | profile isolation、provider-neutral runtime、a11y/responsive/state recovery |
| shipping tail | feature flag lifecycle、CI fidelity、rollout threshold、telemetry proof |
| `spec-compound` | ADR 引用、迁移经验、有效/无效 telemetry、可失效知识 |

### 7.5 Public Skill 层：当前不新增

| 候选 | 当前决策 | 重新评估条件 |
| --- | --- | --- |
| `spec-api-design` | Reject | API 设计产生独立于 plan 的稳定 artifact 和 consumer |
| `spec-frontend` | Reject | 能与 plan/work/browser/polish 明确分离，且路由 fixture 稳定 |
| `spec-tdd` | Reject | 测试驱动成为独立产物而非执行策略 |
| `spec-ci-cd` | Reject | pipeline 管理出现独立生命周期，而非普通 plan/work |
| `spec-adr` | Reject | 项目明确选择统一 ADR system，且有维护和 supersession consumer |
| `spec-security-audit` | Defer | 满足 Wave 3 量化采用门槛，并有稳定 threat-model/finding artifact、复核和 remediation consumer |
| `spec-migration` | Defer | 满足 Wave 3 门槛，且跨版本/团队长期 migration lifecycle 确实超出普通 plan 能力 |
| `spec-observability` | Defer | 满足 Wave 3 门槛，并形成独立 instrumentation redesign、signal catalog 和验证报告 |

## 8. 分阶段实施路线

### Wave 0：冻结可复现基线

- 生成本报告使用的 evidence manifest：path、HEAD/working-tree 状态、revision/hash、用于支持的判断；
- 以 HEAD source 重新核对 24 项承载映射；working-tree advisory 不计入已发布能力；
- 为 10 个部分承载项各准备至少 2 个 signature prompt、2 个 negative-owner prompt；
- 收集 API 演进、UI/a11y、安全、CI、迁移、可观测性各至少 1 个真实或 file-backed case；
- 记录 `using-spec-first` 当前只有结构/合同测试，behavioral route precision baseline 为 `not-established`，不得借用 Agent Skills 的 86%；
- 不改 public catalog。

完成信号：

- 14/10 可从 evidence manifest 回放；
- 每个建议都能指出 current owner、consumer 和 source state；
- route baseline 的计算方法、case set 和结果文件已定义；
- 没有仅因外部 Skill 存在就创建入口。

### Wave 1：按能力纵向落地 source + eval

每个 slice 必须同时包含 source、trigger、negative boundary、contract test、fresh-source eval 和 review；不能先合入 prose、下一 Wave 再补行为证据。

1. **Production readiness slice**
   - 先确认 working-tree high-risk lens 是否进入当前实施分支；
   - `extend` high-risk lens 的 on-call questions、telemetry、CI fidelity、rollout proof；
   - 同步增加 high-risk output-quality fixture、轻量任务 negative fixture、focused contract test 和 fresh-source sample。
2. **Interface/evolution slice**
   - 新增 `interface-and-evolution-lens.md`；
   - 同步覆盖 additive change、breaking change、consumer migration、internal-only API negative case；
   - 验证普通 API planning 不被误升级为 enterprise/high-risk ceremony。
3. **Test-design/slicing slice**
   - 新增 `spec-work` skill-local reference；
   - 同步覆盖 TDD claim honesty、characterization fallback、interaction-heavy mock、docs-only no-TDD negative case；
   - 验证 source 与 feedback-loop contract 一起生效。
4. **Frontend-engineering slice**
   - 新增 plan-time frontend reference；
   - 同步覆盖 UI state matrix、keyboard/focus、responsive，以及 backend-only/design-polish-only negative cases；
   - 验证不抢占 `spec-polish`、`spec-test-browser`、`spec-dogfood` ownership。

每个 slice 完成时执行最窄的 unit/contract test、`npm run lint:skill-entrypoints` 和 fresh-source eval；失败的 slice 不进入下一个。

### Wave 2：Reviewer 与跨能力回归

Reviewer 也按纵向 slice 落地：

- `frontend-quality-reviewer` + persona catalog gate + findings-schema compatibility + 3 类 negative fixture + fresh-source review；
- API reviewer 的 consumer/additive/deprecation evidence + 对 internal refactor 的 negative fixture；
- security reviewer 的 Agent-native trust boundary/reachability + 无真实 exploit path 的 suppression case；
- testing reviewer 的 DAMP/state-vs-interaction/TDD honesty + test-style preference suppression；
- reliability reviewer 的 correlation/telemetry/actionable alert + pure-function negative case；
- browser provider-neutral/profile-isolation/untrusted-page-data source + contract test + runtime/fresh-source evidence。

Wave 2 最后运行跨能力 regression：同一请求最多激活必要 lens，frontend/security/testing/reliability findings 不重复 ownership，dispatch 不可用时 inline fallback 不冒充独立 reviewer。

### Wave 3：用量化采用数据决定是否 Build

以下是本提案的初始 go/no-go 门槛，不是全项目永久硬规则；owner 可用真实采用数据修订，但必须记录原因。候选公共 Skill 只有同时满足才进入 PRD：

- 滚动 90 天内至少 5 次合格的独立用户意图，来自至少 3 个不同 repo；
- 至少 2 次有证据表明现有 `spec-plan`/`spec-work`/`spec-code-review` 承载不足，产生重复手工 workaround 或缺失 artifact；
- 候选独立 artifact 被明确 downstream consumer 实际消费至少 3 次；
- 至少 3 个 signature prompt、3 个 negative-owner prompt 能稳定区分现有入口；
- 没有引入 P0/P1 route regression，且有 owner、failure modes、maintenance/eval plan。

不满足任一条件时继续 `Defer`，优先扩展现有 workflow，不因主观“高频”或名称完整性新增 public Skill。

## 9. 验收指标

### 9.1 路由

- 当前 confirmed baseline 是结构合同而非行为精度：`tests/unit/using-spec-first-contracts.test.js` 检查 Direct Lane、单入口、public roster、exit gates 和 internal-only 隐藏；
- 当前 behavioral route precision：`not-established`；在建立 signature/negative corpus 前，不使用“不下降”或百分比 claim；
- source Skill 目录总数在 Wave 1/2 保持 35，public catalog 不因对标自动新增入口；
- `using-spec-first` 仍一次选择一个入口；
- 新增 reference 不成为用户显式入口；
- internal persona 不出现在 public workflow catalog；
- 每个受影响 route/lens 至少有 2 个 signature、2 个 negative-owner case；
- 报告 top-1 owner、Direct Lane false-positive、错误 public-route、错误 lens 激活和 `dispatch_authorization_missing` fallback；
- baseline 与 after 使用同一 case set、同一 fresh source 和同一判分规则，结果写入 `docs/validation/`，不借用 Agent Skills 的 86%。

建议的确定性检查入口：

```bash
npx jest --runTestsByPath \
  tests/unit/using-spec-first-contracts.test.js \
  --runInBand

npm run lint:skill-entrypoints
```

这些命令证明结构合同和入口治理，不证明模型行为；语义变化仍需按 [`fresh-source-eval-checklist.md`](../contracts/workflows/fresh-source-eval-checklist.md) 记录 fresh-source evidence 或明确 not-run reason。

### 9.2 计划质量

适用场景下，plan 必须能回答：

- API：消费者是谁、什么兼容窗口、如何验证旧客户端；
- UI：loading/error/empty/permission/retry、keyboard/focus、responsive 如何验证；
- 安全：asset、trust boundary、abuse case、control、test；
- CI：gate 是否复现真实 build/deploy 上下文；
- 迁移：replacement、consumer、dual-run、cutover、zero-use、rollback；
- 可观测性：on-call question、signal、threshold、owner、runbook、telemetry proof。

### 9.3 执行与审查

- 没有实际 RED 证据时不声称完成 TDD；
- review finding 包含可回源 path/line/behavior evidence；
- security finding 有可解释 attack path 或明确 degraded uncertainty；
- performance 优化有 baseline、after measurement 和 guard；
- browser 测试说明真实 provider、profile、页面状态和未覆盖项；
- deployment/telemetry 结论有实际查询、日志、dashboard 或 not-run reason。

### 9.4 维护成本

- 主 `SKILL.md` 不因领域 checklist 无限制增长；
- reference 由触发条件直接链接，不形成孤儿文档；
- scripts 只校验确定性结构，不判断 threat model、API 设计或可观测性是否充分；
- 所有 source 变更在同一纵向 slice 中同时具备聚焦 unit/contract test、positive/negative fixture 和 fresh-source eval 状态；
- generated runtime 通过正式生成流程更新，不手改 mirror。

### 9.5 用户价值

- 高风险问题在 plan 阶段被明确，而不是发布后才发现；
- review 能发现通用 Web a11y 和状态缺口；
- API/feature 删除有消费者和 zero-use 证据；
- on-call 能从 signal 还原真实失败；
- 小任务启动成本不增加；
- 用户不需要记忆更多近义 public Skill。

## 10. 风险与反模式

### 10.1 直接复制外部 Skill

风险：

- 将外部路径、工具、风格和假设带入 source；
- 与现有 workflow 重复；
- 无法进入当前 artifact/evidence/handoff；
- 更新来源和本地演化难以治理。

正确做法是提取可验证原则，按本项目 contract 重写。

### 10.2 Skill 数量驱动

“Agent Skills 有某个名字，所以 Spec-First 也要有”是错误推理。公共入口增加会提高 description 常驻成本、路由碰撞、用户选择成本和多宿主投射面。

### 10.3 Checklist 变成伪确定性

勾选 OWASP、WCAG、RED/USE 或 test pyramid，不自动证明安全、可访问、可观察或测试充分。脚本可以确认字段存在，LLM/human 必须判断语义，真实行为要靠对应证据。

### 10.4 把所有工作升级为高风险流程

API、UI、安全、可观测性 lens 只在语义 trigger 命中时加载。静态文案、小型内部重构和无生产面的任务保持轻量。

### 10.5 Vendor 和技术栈泄漏

GitHub Actions、Chrome DevTools、OpenTelemetry、Rails SQL 和具体云平台都是示例或 provider，不是通用 workflow contract。

### 10.6 多 Agent 数量冒充独立性

同模型、共享上下文或无真实 dispatch 的多个 persona 不是自动的独立证据。必须报告真实执行形态，并由 orchestrator 合并、去重和验证。

### 10.7 固定阈值替代判断

不采用固定 95% confidence、100 行 diff、5 个文件、1–3 天任务、所有告警统一阈值等规则。阈值只能来自项目 SLO、风险、数据和当前 contract。

### 10.8 把 ADR、solution 和 release note 混为一体

- ADR：为什么选择某个长期架构决策；
- solution：某个已解决问题的症状、根因、修复、验证和失效边界；
- release note：用户或维护者需要知道的版本变化。

三者可以互相引用，但不能互相替代。

## 11. 最终决策

### 11.1 对 Skill 内容

批准吸收：

- 入口层的 assumption/confusion/push-back 表达；
- 需求层的 guess-attached question、Not Doing、Always/Ask/Never；
- 计划/执行层的 vertical、contract-first、risk-first slicing；
- 测试设计的 RED/GREEN 证据边界、DAMP、state over interaction；
- 调试的 stop-line、reduce、untrusted output；
- review 的 structural remedy 和 fresh reviewer 最小上下文；
- API 的 Hyrum、One-Version、additive evolution；
- UI 的 component/state/a11y/responsive discipline；
- 安全的 threat-model spine 和 Agent-native untrusted boundary；
- CI 的 gate fidelity、preview、flag、staged rollout；
- 迁移的 replacement-first、consumer、zero-use；
- 可观测性的 on-call questions、correlation、RED/USE、actionable alert；
- ADR lifecycle 和 supersession；
- context/source 的 version、official source、conflict、UNVERIFIED 协议。

明确不采用：

- 固定宿主、固定工具、固定技术栈示例作为强合同；
- 固定时间、文件数、行数和主观 confidence gate；
- 默认全生命周期自动串联；
- 默认自动多 Agent；
- 直接 vendoring 外部 Skill；
- 仅为名称对齐新增公共 Skill。

### 11.2 对是否新增 Skill

当前决策是：

```text
直接引入 Agent Skills 的公共 Skill：0
新增 Spec-First 公共 Skill：0
新增 skill-local reference：3 个
扩展现有 high-risk lens：1 个
新增内部条件 reviewer persona：1 个
未来候选公共 Skill：3 个，全部 Defer
```

这一结论不是保守地“不做”，而是按 `spec-first` 的价值位置做正确分层：让工程知识进入已有可信变更闭环，同时不增加不必要的入口和状态。

## 附录 A：建议落地的源码位置

| 实施波次 | Source 位置 | 建议变更 |
| --- | --- | --- |
| Wave 0 | `docs/14-agent-skills/`、`docs/validation/` | evidence manifest、HEAD/advisory 分层、route behavior baseline |
| Wave 1 | `skills/spec-plan/references/high-risk-plan-lens.md` | 先完成/adopt 当前 working-tree draft，再 `extend` production readiness；不创建第二个并列 truth source |
| Wave 1 | `skills/spec-plan/references/interface-and-evolution-lens.md` | `new`：接口设计、consumer、compatibility、deprecation、migration planning contract |
| Wave 1 | `skills/spec-plan/references/frontend-engineering-lens.md` | `new`：component/state/a11y/responsive planning discipline |
| Wave 1 | `skills/spec-work/references/test-design-and-slicing.md` | `new`：TDD evidence、test doubles、vertical/risk-first slicing |
| Wave 2 | `skills/spec-code-review/references/personas/api-contract-reviewer.md` | consumer、additive evolution、deprecation evidence |
| Wave 2 | `skills/spec-code-review/references/personas/security-reviewer.md` | Agent-native trust boundary、dependency reachability |
| Wave 2 | `skills/spec-code-review/references/personas/testing-reviewer.md` | DAMP、state vs interaction、TDD claim honesty |
| Wave 2 | `skills/spec-code-review/references/personas/reliability-reviewer.md` | correlation propagation、telemetry、alert actionability |
| Wave 2 | `skills/spec-code-review/references/personas/frontend-quality-reviewer.md` | `new` internal conditional reviewer |
| Wave 2 | `skills/spec-code-review/references/persona-catalog.md` | frontend-quality 语义 gate、ownership 和负向边界 |
| Wave 2 | `skills/spec-test-browser/SKILL.md` | provider-neutral、profile isolation、untrusted page data |
| Wave 2 | `skills/spec-prd/` | consumer/sunset、abuse case、Not Doing 条件字段 |
| Wave 2 | `skills/spec-debug/references/investigation-techniques.md` | stop-line/reduce 与 instrumentation gap |
| Wave 2 | `skills/spec-compound/` | ADR supersession、有效/无效 signal 与迁移 learning |

## 附录 B：未来公共 Skill 的进入条件

| 候选 | 独立意图 | 必需 artifact | 必需 consumer | 必需验证 |
| --- | --- | --- | --- | --- |
| `spec-security-audit` | 审查既有系统的安全态势 | threat model + findings + remediation map | security owner / plan / work | attack-path 复核、工具证据、误报处理 |
| `spec-migration` | 管理跨版本/团队长期迁移 | migration lifecycle + consumer inventory + cutover/retirement evidence | 多团队 owner / release | compatibility、dual-run、zero-use、rollback |
| `spec-observability` | 设计或重构系统可观测性 | signal catalog + instrumentation plan + dashboards/alerts + validation | on-call / SRE / work | telemetry 真实产生、关联、阈值和 actionability |

在这些条件没有被真实使用证据证明前，现有 `spec-prd`、`spec-plan`、`spec-work`、`spec-debug`、`spec-code-review` 和 shipping tail 已是更低成本、更清晰的承载方式。

## 附录 C：24 项映射证据索引

本索引用于回放矩阵中的“Spec-First 当前对应”。`HEAD confirmed` 可在声明 commit 回放；`mixed` 表示同时参考 HEAD 与明确标注的 working-tree advisory。

| # | Agent Skill | Spec-First source refs | Authority |
| --- | --- | --- | --- |
| 1 | `using-agent-skills` | `skills/using-spec-first/SKILL.md`；`references/public-route-map.md` | HEAD confirmed |
| 2 | `interview-me` | `skills/spec-brainstorm/SKILL.md`；`skills/spec-prd/SKILL.md` | HEAD confirmed |
| 3 | `idea-refine` | `skills/spec-ideate/SKILL.md`；`skills/spec-brainstorm/SKILL.md` | HEAD confirmed |
| 4 | `spec-driven-development` | `skills/spec-brainstorm/SKILL.md`；`skills/spec-prd/SKILL.md`；`skills/spec-plan/SKILL.md@HEAD` | HEAD confirmed |
| 5 | `planning-and-task-breakdown` | `skills/spec-plan/SKILL.md@HEAD`；`skills/spec-write-tasks/SKILL.md` | HEAD confirmed |
| 6 | `incremental-implementation` | `skills/spec-work/SKILL.md`；`skills/spec-work/references/execution-engines.md` | HEAD confirmed |
| 7 | `test-driven-development` | `skills/spec-work/SKILL.md`；`skills/spec-debug/SKILL.md`；`skills/spec-code-review/references/personas/testing-reviewer.md` | HEAD confirmed |
| 8 | `debugging-and-error-recovery` | `skills/spec-debug/SKILL.md`；`skills/spec-debug/references/investigation-techniques.md` | HEAD confirmed |
| 9 | `code-review-and-quality` | `skills/spec-code-review/SKILL.md`；`skills/spec-code-review/references/persona-catalog.md` | HEAD confirmed |
| 10 | `browser-testing-with-devtools` | `skills/spec-test-browser/SKILL.md`；`skills/spec-dogfood/SKILL.md`；`skills/spec-polish/SKILL.md` | HEAD confirmed |
| 11 | `performance-optimization` | `skills/spec-optimize/SKILL.md`；`skills/spec-plan/references/agents/performance-oracle.md`；`skills/spec-code-review/references/personas/performance-reviewer.md` | HEAD confirmed |
| 12 | `code-simplification` | `skills/spec-simplify-code/SKILL.md`；`skills/spec-code-review/references/personas/maintainability-reviewer.md` | HEAD confirmed |
| 13 | `git-workflow-and-versioning` | `skills/spec-work/SKILL.md`；`skills/spec-commit/SKILL.md`；`skills/spec-commit-push-pr/SKILL.md`；`skills/spec-worktree/SKILL.md` | HEAD confirmed |
| 14 | `shipping-and-launch` | `skills/spec-work/references/shipping-workflow.md`；`skills/spec-commit-push-pr/SKILL.md`；`CHANGELOG.md@HEAD` | HEAD confirmed |
| 15 | `context-engineering` | `skills/using-spec-first/SKILL.md`；`skills/spec-runtime-setup/SKILL.md`；`skills/spec-plan/references/repo-profile-cache.md` | HEAD confirmed |
| 16 | `source-driven-development` | `skills/spec-plan/references/agents/best-practices-researcher.md`；`skills/spec-compound/references/agents/framework-docs-researcher.md` | HEAD confirmed |
| 17 | `doubt-driven-development` | `skills/spec-doc-review/SKILL.md`；`skills/spec-code-review/references/personas/adversarial-reviewer.md`；`docs/contracts/workflows/fresh-source-eval-checklist.md` | HEAD confirmed |
| 18 | `api-and-interface-design` | `skills/spec-plan/references/agents/architecture-strategist.md@HEAD`；`skills/spec-code-review/references/personas/api-contract-reviewer.md`；`skills/spec-prd/SKILL.md` | HEAD confirmed |
| 19 | `frontend-ui-engineering` | `skills/spec-polish/SKILL.md`；`skills/spec-test-browser/SKILL.md`；`skills/spec-dogfood/SKILL.md`；`skills/spec-app-consistency-audit/SKILL.md`；`skills/spec-code-review/references/personas/julik-frontend-races-reviewer.md` | HEAD confirmed |
| 20 | `security-and-hardening` | `skills/spec-plan/references/agents/security-sentinel.md`；`skills/spec-code-review/references/personas/security-reviewer.md`；`skills/spec-plan/references/high-risk-plan-lens.md` | mixed；high-risk lens 为 working-tree advisory |
| 21 | `ci-cd-and-automation` | `skills/spec-plan/references/agents/deployment-verification-agent.md`；`skills/spec-code-review/references/personas/adversarial-reviewer.md`；`skills/spec-code-review/references/personas/reliability-reviewer.md`；`skills/spec-work/references/shipping-workflow.md` | HEAD confirmed |
| 22 | `deprecation-and-migration` | `skills/spec-plan/references/agents/data-migration-reviewer.md`；`skills/spec-code-review/references/personas/data-migration-reviewer.md`；`skills/spec-plan/references/high-risk-plan-lens.md` | mixed；high-risk lens 为 working-tree advisory |
| 23 | `documentation-and-adrs` | `skills/spec-prd/references/domain-language-and-decision-ledger.md`；`skills/spec-compound/SKILL.md`；`CHANGELOG.md@HEAD` | HEAD confirmed |
| 24 | `observability-and-instrumentation` | `skills/spec-plan/references/agents/deployment-verification-agent.md`；`skills/spec-debug/references/investigation-techniques.md`；`skills/spec-work/references/shipping-workflow.md`；`skills/spec-plan/references/high-risk-plan-lens.md` | mixed；high-risk lens 为 working-tree advisory |

实施前的 evidence manifest 应为每个 source ref 补充 content hash；本附录只给出当前可读路径和 authority，不把路径存在等同于语义已经满足。
