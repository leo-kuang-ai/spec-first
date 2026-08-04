---
date: "2026-07-02"
artifact_kind: review-report
review_target: docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md
review_mode: single-agent-report-only
dispatch_boundary: dispatch_authorization_missing
rounds: 50
status: complete
---

# Team Knowledge Git Init 50 轮深度审查报告

## 结论

目标需求文档已经从 `checkpoint-prd` 推进到 `ready-for-planning`。本轮审查后的确定性证据如下：

- `node skills/spec-prd/scripts/finalize-prd-artifact.js docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md --inputs-from-frontmatter --verify-receipt`
  - `verified: true`
  - `can_enter_spec_plan: yes`
  - `ready_receipt_current: true`
  - `reason_codes: []`
- `node skills/spec-prd/scripts/check-prd-artifact.js docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md --inputs-from-frontmatter`
  - core sections 全部存在
  - `blocking_reason_codes: []`
  - `ready_receipt_current: true`
  - OQ 12 条全部 closed，`open_oq_without_owner_closure_count: 0`

本轮没有使用 Codex subagent/persona dispatch。原因是当前用户目标虽要求深度审查，但没有显式授权 `subagents` / `personas` / delegated review；按 `spec-doc-review` 和 `using-spec-first` 的 Codex dispatch 边界，采用单代理 report-only 审查。

## 调研与证据边界

| source | tag | 用途 | 限制 |
| --- | --- | --- | --- |
| `docs/10-prompt/结构化项目角色契约.md` | confirmed-source | 判断团队知识能力是否服务 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 闭环 | 角色契约是演化判断基线，不替代具体需求验收 |
| `docs/contracts/knowledge/knowledge-harness.md` | confirmed-source | 校准 file-first、recall-as-advisory、verified promotion 边界 | 不实现团队 Git 知识 resolver |
| `docs/contracts/team-standards.md` | confirmed-source | 校准 shared standard 的 enum、promotion、hard context 边界 | 项目标准与团队共享经验的 runtime 消费仍需后续实现 |
| `docs/adr/0001-init-owns-limited-user-language-sync.md` | confirmed-source | 确认 init 原有 user-global 与 zero-network 边界 | 已被 ADR 0002 显式扩展 |
| `docs/adr/0002-init-team-knowledge-network-access.md` | confirmed-source | 确认 opt-in team knowledge clone 和 registry 写入授权 | 只授权显式 opt-in，不授权静默 pull/update |
| `docs/brainstorms/2026-06-19-001-docs-solutions-recall-activation-layer-requirements.md` | confirmed-source | 对账 team Git resolver 与项目 `docs/solutions/**` 召回路径 | 该文解决项目内 recall wiring，不解决外部团队知识 Git 仓 |
| Anthropic Claude Code Memory docs (`https://code.claude.com/docs/en/memory`) | external-research | 校准团队共享指令/项目 memory 的边界 | 外部文档只作行业参照，不成为 spec-first confirmed source |
| OpenAI Codex official docs URLs (`https://developers.openai.com/codex/cli/`) | external-research-degraded | 校准 Codex / `AGENTS.md` 方向；本地 curl 返回 403 | 不把不可读取页面当 confirmed evidence；以本仓 `AGENTS.md` 和 Codex runtime 指令为执行边界 |

## 50 轮审查记录

| 轮次 | 审查镜头 | 发现 / 判断 | 需求文档优化落点 |
| --- | --- | --- | --- |
| R01 | Mission fit | 团队知识能力必须服务 Knowledge Harness，而不是做泛知识平台。 | §1、§22 明确 spec-first 交付接入机制，不拥有团队知识内容。 |
| R02 | Source-of-truth | 团队知识正文不应进入 npm 包或业务项目复制件。 | §2、§8、R69/R70 保持 team Git 仓为 source-of-truth，项目只提交 `sources.yaml`。 |
| R03 | Canonical layout | `standards/` + `experiences/` 双顶层会制造双真相源。 | §1、§6、§10 固定 `catalog.yaml` + `packs/` + `taxonomy/` + `schemas/`。 |
| R04 | Workflow order | 先定义知识库内容模型，再定义 resolver，再定义 init；不能倒置。 | §3.1 强化 Team Knowledge First Principle。 |
| R05 | Init authorization | init 联网 clone 超出 ADR 0001，必须单独授权。 | §7 F1、§19 绑定 `docs/adr/0002-init-team-knowledge-network-access.md`。 |
| R06 | Network security | Git URL 协议和 host 确认必须进入需求层，不留给实现猜测。 | §7 F1、§15 第16–19条限制 https/ssh、拒绝明文/本地协议。 |
| R07 | User-global boundary | 用户级 registry 可以存本机路径，但项目 Git 不能。 | §8、R12–R18 明确 registry 与 `sources.yaml` 字段边界。 |
| R08 | Non-interactive safety | `spec-first init -y` 不能默认联网。 | R5、ADR 0002 Boundaries 保持显式参数才允许非交互加载。 |
| R09 | Atomicity | clone 或 schema 校验失败后不能留下半成品项目配置。 | R20/R21、AE4 明确 atomic write 与 failure no-op。 |
| R10 | Existing config | 已有 `sources.yaml` 时 init 不应自动 pull 或改写 ref。 | F2、R22–R26 保持 ensure-only，不自动推进知识仓。 |
| R11 | Shared-latest semantics | `resolved_commit` 不是远端最新证明，也不是项目 lock。 | §13.3、R43/R44 加强 source snapshot 语义。 |
| R12 | Reproducibility | review/debug 对复现敏感，shared-latest 必须有提示。 | §13.3 增加审计敏感场景可 pin tag/commit 的提示。 |
| R13 | Advisory trust | cards 只能是风险提醒、checklist 或 hypothesis。 | K8、K13、R38/R39/R61/R64 保持 advisory-first。 |
| R14 | Scope shaping | advisory card 被提升为实现单元/测试场景时必须有当前项目证据。 | K13、R49 增加 `derived-from-advisory-card` 和当前证据要求。 |
| R15 | Prompt injection | 经验卡正文是 untrusted data，不能与 host/system 指令同权。 | §15 第12–15条增加 fenced data boundary 与 injection-risk 降级。 |
| R16 | Team/project separation | 团队公共知识不能接管项目 `docs/solutions/**`。 | §12、§13 范围限定、§14 两路并行召回。 |
| R17 | Existing learning path | Knowledge Intake Resolver 只处理 team Git source，不能替代 `spec-learnings-researcher`。 | §13、R55 明确 resolver 范围限定。 |
| R18 | Project standards precedence | 项目 confirmed standards 优先于共享经验。 | §12 消费优先级保留当前证据和项目标准优先。 |
| R19 | Shared standards risk | v1 若同时做 adoption/hard enforce 会扩大过快。 | §9.2、§11.4、§20、§21 将 adoption 子系统整体 defer 到 v2。 |
| R20 | Canonical enum compatibility | `confirmed_after_adoption`、`enforcement: hard`、`severity: must` 不符合 team-standards enum。 | OQ-CF1/CF4/CF8 通过 defer 和 enum 对账闭合。 |
| R21 | Conflict handling | shared standard 与 project standard 冲突不能自动裁决。 | R65/R66 保留 conflict/source refs/owner next action。 |
| R22 | Card granularity | 经验卡必须小颗粒、高信号、可过滤，不能是长 Wiki。 | K7、K11、§10 cards layout 保持七问和 taxonomy 过滤。 |
| R23 | Lifecycle quality | 没有 owner/source_refs/invalidation_condition 的 active card 会污染团队知识。 | K5/K10、R31 明确 active 最小字段。 |
| R24 | Taxonomy discipline | 每张卡自行发明分类会破坏少量召回。 | K6/K11、§13.1 约束 stage/surface/domain/trigger。 |
| R25 | Resolver input | workflow 必须先构造任务画像，至少包含 stage。 | §13.1、R45–R47 明确输入合同。 |
| R26 | Resolver output | included/excluded/source_snapshot/conflicts 都需要机器可消费字段。 | §13.2、R42/R43 强化输出合同。 |
| R27 | Inferred-field transparency | 推断画像导致排除候选时必须可见。 | §13.1、R42 增加 `excluded_by_inferred_field`。 |
| R28 | Context budget | 默认最多 5 张 cards、硬上限 10，防止知识上下文挤占主任务。 | F3、F4、R41、§15 默认限制保留。 |
| R29 | Workflow admission | `using-spec-first` 不读取团队知识，避免路由受历史经验污染。 | §14、R48、AE9 明确不读取。 |
| R30 | PRD scope | `$spec-prd` v1 不自动读取团队知识，避免 cards 发明产品需求。 | §14 workflow 表明确暂不接入 PRD。 |
| R31 | Plan consumption | `$spec-plan` 可以用 cards 形成风险/验证重点，但必须保留 advisory 来源。 | §14、R49、AE6 明确 plan 消费规则。 |
| R32 | Work consumption | `$spec-work` 只把 cards 作为开发前/完成前 checklist。 | §14、R50 保持 checklist 边界。 |
| R33 | Code review consumption | `$spec-code-review` 的 finding 必须回到 diff/source/test/log。 | §14、R51、AE10 保持 evidence gate。 |
| R34 | Debug consumption | `$spec-debug` root cause 必须由复现、日志、源码或测试确认。 | §14、R52、AE11 保持 root-cause proof。 |
| R35 | Write-tasks scope | `$spec-write-tasks` 不能重新扩大 plan 已定 scope。 | §14、R53 保持只消费 plan 已选 cards。 |
| R36 | Compound boundary | `$spec-compound` 只能产出 card 草稿或 contribution 建议，不直接写团队仓。 | §14、R54 保持 promotion 不越界。 |
| R37 | Business knowledge | 业务流程、领域 wiki、项目画像不应默认共享加载。 | §3、K3、Non-goals、AE15 明确当前项目证据优先。 |
| R38 | Security surface | resolver 必须忽略 symlink/submodule/binary/large/path traversal。 | §15、R71–R81 保留安全读取边界。 |
| R39 | Package hygiene | spec-first npm 包不得打包真实团队知识内容。 | R69/R70 明确只交付 schema、模板、resolver、校验器和 workflow 合同。 |
| R40 | Success criteria | 成功标准要证明知识库治理和 AI 消费边界，而不是平台愿景。 | §18 保持 18 条 v1 成功标准。 |
| R41 | Slice 0 validation | 在建设 resolver/init/schema 前，先验证卡片确实改善 workflow 输出。 | §21 Slice 0 加入前置 gate。 |
| R42 | Implementation slices | 后续计划必须能按 contract/schema/init/resolver/workflow 分片执行。 | §21 Slice 1–6 保持最小落地顺序。 |
| R43 | v2 defer clarity | Deferred to v2 不是永久排除，必须有清晰边界。 | §20、§21 Slice 7 记录 adoption 子系统 defer 范围。 |
| R44 | Diagrams | Mermaid 图应解释 source/registry/resolver/workflow/晋升关系。 | §23.1–§23.6 覆盖 init、resolver、两路召回、card 消费、晋升链路。 |
| R45 | PRD structure | 原文缺少 machine-locatable `Change Delta`、`Scope Boundaries`、`Evidence And Assumptions`。 | 本轮补 `Change Delta`，并给 Non-goals/Dependencies 加 section id。 |
| R46 | OQ closure machine shape | 原 OQ closure 是散文，final-ready 下会触发 `open_oq_without_owner_closure`。 | 本轮把 12 条 OQ 改为 `source-resolved` + repo-relative evidence refs。 |
| R47 | Readiness consistency | frontmatter `checkpoint-prd/can_enter=no` 与正文“无 blocker”矛盾。 | 本轮改为 `write_mode: final-prd`、`can_enter_spec_plan: yes`、`preflight_sweep_closure: closed`。 |
| R48 | Source input hygiene | `source_inputs` 不应包含 PRD 自身，否则 receipt hash 自引用 stale。 | 本轮移除 PRD 自身，加入 ADR 0002，重新 finalize 并 verify。 |
| R49 | Official-tool alignment | Claude/Codex 官方资料支持 checked-in team guidance + memory/context 边界，但不能替代 repo source。 | 报告记录 external-research 边界；需求仍以本仓 role/contract/ADR 为 confirmed source。 |
| R50 | Planning handoff | 最终出口必须有 script-owned receipt，而不是模型自称 ready。 | 本轮执行 finalize + verify-receipt，验证 `verified=true`、`reason_codes=[]`。 |

## 第 51 轮：Progressive Disclosure Consumption Review

**审查镜头：** Progressive Disclosure 方法论下的 planning 可消费性。

**Finding PD-01（P2 / maintainability / high confidence）：** 当前 PRD 已具备 `ready-for-planning` 的确定性 receipt，但正文约 1490 行，且 §13-§23 同时包含 resolver contract、workflow consumption、安全边界、需求清单、acceptance examples、implementation slices 和 Mermaid flows。若下游 `$spec-plan` 没有明确分层消费规则，容易出现两类退化：一是全量读取导致上下文预算被示例和图示挤占；二是只读摘要后漏掉 advisory/confirmed、source snapshot、安全读取、v2 defer 等不可下沉的主线约束。

**证据：**

- `docs/brainstorms/2026-07-01-003-team-knowledge-git-init-requirements.md` 当前约 1490 行，§13-§23 是高密度 planning 输入。
- `docs/brainstorms/2026-06-12-002-context-injection-progressive-disclosure-requirements.md` 将方向定义为“最小常驻锚点 + 按需 source 展开 + summary-first handoff”。
- `docs/11-业界调研/spec-first-skills-优化方案-50轮深度审查报告.md` 第 011-014 轮明确 Progressive Disclosure 不是简单拆文件，而是让模型在正确时刻看到正确粒度的信息，并保留 L0-L3 主线合同、压力点提醒和不可下沉约束。
- `skills/retired-skill-review/SKILL.md` 的 Progressive Disclosure Checks 将长例子、重复 rubrics、provider 细节、长 checklist 视为优化信号，但不是自动改写命令。

**判断：** 该问题不推翻 PRD ready 结论，也不要求把 PRD 拆成多份 truth source。正确落点是在同一 PRD 中追加一个轻量 `Progressive Disclosure / Planning Consumption Contract`，明确下游 planner 的 minimum handoff slice、按 slice 展开的 must-read sections、示例块边界和 coverage reporting requirement。

**已采纳落点：** PRD 新增 §24，要求 `$spec-plan` 先读 frontmatter、Summary、Change Delta、Non-goals、Key Decisions、Success Criteria、Slice 0-6 和 §24，再按 Slice 0 / canonical contract / schema / init / resolver / workflow / v2 adoption / security 等 focus 展开对应章节；同时明确 JSON/YAML/Mermaid 示例不是 implementation source，任何实现输入必须回链 K/R/AE、Key Decision、Security Boundary 或 Deferred to Planning anchor。

**Residual risk：** §24 是 LLM-owned consumption contract，不是脚本硬 gate。后续 `$spec-plan` 仍需在 Direct Evidence / Coverage 中显式记录已读切片和未读 limitations，不能仅凭 §24 存在就声称 full PRD coverage。

## 剩余风险

- `placeholder_or_todo_present` 仍有 11 条 advisory finding，主要来自示例 YAML / Mermaid / 模板中的占位符语义；checker 未将其列为 blocking。planning 时如要把示例转成实现输入，应逐条确认哪些是示例、哪些是 contract。
- OpenAI Codex developer docs 在本地 curl 下返回 403，本报告没有把该外部页面内容作为 confirmed evidence。Codex 行为边界以本会话 developer 指令、根 `AGENTS.md` 和仓库 contracts 为准。
- §21 Slice 0 是 implementation 前的实证 gate，不阻塞 PRD planning，但后续计划必须把它作为 Slice 1–6 的前置验证任务。

## Handoff

下游 `$spec-plan` 可消费当前 PRD，前提是保留以下 planning constraints：

1. 先计划 Slice 0 验证，不直接建设完整 resolver/init/schema。
2. v1 只自动召回 `experience-cards`；shared standard adoption / hard context 仍属 v2。
3. 所有 team Git cards 都是 advisory；任何 plan/work/review/debug 结论必须回当前项目 source/test/log/doc 或人工确认。
4. 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors；后续 runtime projection 通过 `spec-first init`。
