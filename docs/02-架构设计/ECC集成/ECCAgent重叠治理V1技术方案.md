# ECC Agent 重叠治理 V1 技术方案

> 状态：V1 技术方案
> 日期：2026-05-05
> 适用范围：spec-first 自身的 agent 专家体系治理、ECC 能力吸收、router / finding / synthesis 设计
> 上游输入：`docs/02-架构设计/ECC集成/ECC专家能力整合技术方案.md`、`docs/02-架构设计/ECC集成/ECC技能清单.md`、`docs/02-架构设计/ECC集成/ECC斜杠命令清单.md`、`docs/02-架构设计/ECC集成/ECC子代理清单.md`、`/Users/kuang/xiaobu/everything-claude-code` 与本次 ECC × spec-first Agent 重叠治理方案

---

## 0. 最终结论

V1 不再以“导入 ECC agents”为目标。

V1 的目标是：

```text
以 ECC 为能力样本，
对当前 spec-first 已有专家体系做去重、重命名、路由、证据绑定、输出协议和治理闭环。
```

当前 spec-first 已经具备较完整的专家资产。`agents/*.agent.md` 当前有 51 个 source agent，覆盖 correctness、testing、maintainability、security、architecture、API contract、scope、coherence、feasibility、repo research、git history、design、PR comments、CLI readiness、standards、session、Slack、Figma 等能力。

因此正确方向不是：

```text
新增一批 ecc-* agent
```

而是：

```text
ECC Agent 能力
  -> 对照当前 spec-first agents
  -> 判断重叠程度
  -> 提取更好的 checklist / rubric / failure mode
  -> 增强现有 spec-first agent
  -> 建立 registry / router / finding schema / synthesis
```

一句话：

```text
当前 spec-first 不缺更多 agent，
缺的是把已有专家变成一支可治理、可路由、可证据绑定、可合成、可沉淀的专家团队。
```

### 0.1 文档版本与交付边界

本文档标题中的 `V1` 是方案版本，不等于一次性交付范围。

为避免后续开发把“方案版本”“实施阶段”和“长期路线图”混在一起，本文使用三层命名：

```text
Document Version:
  V1 技术方案版本

Implementation Gates:
  G0-G6.5 当前可执行治理闭环

Future Roadmap:
  R1-R9 V1 之后的长期能力演进
```

当前开发基准是：

```text
先完成 G0-G3：
  G0 current source inventory
  G1 ECC overlap matrix
  G1.5 ECC rubric extraction matrix
  G1.6 ECC command idea matrix
  G2 agent packs preview
  G3 registry preview + drift policy

再进入 G4-G6.5：
  G4 router candidate facts
  G5 finding schema compatibility
  G6 skill synthesis pilot
  G6.5 host compatibility + runtime merge policy preview
```

V1 不要求一次性改完 runtime、CLI router、全部 agent prompt 或所有 workflow。任何扩大到 runtime delivery、pack lifecycle、agent filtering、doctor/clean 的工作，都必须等 G0-G6.5 pilot 证明节点质量增益后再进入 Future Roadmap。

截至 2026-05-06，V1-V9B pilot 已落地为 source contracts 与只读预览脚本：

```text
V1 governance preview:
  scripts/generate-ecc-governance-preview.js

V2 registry contracts:
  src/cli/contracts/agent-registry/*.schema.json

V3 router candidate facts:
  scripts/route-ecc-agent-candidates.js

V4 Finding Core compatibility projection:
  scripts/project-ecc-finding-core.js

V5 Skill Synthesis brief:
  scripts/prepare-ecc-synthesis-brief.js

V6 Graph-aware Expert brief:
  scripts/prepare-ecc-graph-expert-brief.js

V7 Standards-aware Expert brief:
  scripts/prepare-ecc-standards-expert-brief.js

V8 Optional Pack brief:
  scripts/prepare-ecc-optional-pack-brief.js

V9A Code-review pilot brief:
  scripts/prepare-ecc-code-review-pilot-brief.js

V9B Workflow pilot brief:
  scripts/prepare-ecc-workflow-pilot-brief.js
```

这些脚本均是 preview-first / read-only deterministic fact preparers，不新增 ECC runtime，不替 Skill 做最终专家选择、finding 裁判、影响面结论或 standards 写入。

---

## 1. Graph Readiness

- target_repo: `spec-first`
- status: `stale`
- source_revision: `dbf9bab1a871fc7aa6c790fe26b70eda10e0e0dc`
- current_revision: `fa49220c2442c86d6082b1480a6641d66000adaa`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: none recorded in stale artifact
- fallback_capabilities: bounded local repo reads, `rg`, direct source inspection
- runtime_mcp_evidence: GitNexus query attempted for agent governance concepts, returned no matching processes or definitions
- confidence: medium for local source inventory, low for compiled graph evidence freshness
- limitations: `.spec-first/graph/graph-facts.json` was generated on 2026-05-01 and does not match current `HEAD`; this V1 plan uses local source files as primary evidence and treats graph facts as stale advisory context only

---

## 2. ECC Source Evidence Baseline

V1 的 ECC 侧事实输入以本地 source 和已生成清单为准：

```text
ECC source root:
  /Users/kuang/xiaobu/everything-claude-code

ECC inventory docs:
  docs/02-架构设计/ECC集成/ECC技能清单.md
  docs/02-架构设计/ECC集成/ECC斜杠命令清单.md
  docs/02-架构设计/ECC集成/ECC子代理清单.md
```

当前已核对的 ECC source 数量：

| 类型 | 数量 | source 路径 | V1 用途 |
| --- | ---: | --- | --- |
| Skills | 182 | `/Users/kuang/xiaobu/everything-claude-code/skills/*/SKILL.md` | 作为 checklist、rubric、lens/reference 候选来源 |
| Slash commands | 68 | `/Users/kuang/xiaobu/everything-claude-code/commands/*.md` | 仅作为 workflow idea / trigger surface 参考，不导入 |
| Agents | 48 | `/Users/kuang/xiaobu/everything-claude-code/agents/*.md` | 作为 overlap matrix 的 ECC 侧专家样本 |

V1 对三类资产的处理边界：

```text
ECC skills:
  可提取方法论、checklist、failure modes
  可降级为 optional lens/reference
  不直接复制为 spec-first public workflow

ECC slash commands:
  不导入
  不新增 /ecc:*、/everything-claude-code:* 或 $ecc-* 入口
  只作为 spec-first 现有 workflow 覆盖度分析输入

ECC agents:
  不平铺新增
  先与 spec-first 现有 agents 做 direct / partial / native / profile / missing 判断
  direct_match 只能 enhance_existing，不能生成重复 agent
```

这批清单是 G0/G1 的 primary ECC evidence。若清单与 `/Users/kuang/xiaobu/everything-claude-code` source 冲突，以 source 当前文件为准，清单需要重新生成或标记 stale。

---

## 3. Source Of Truth 与 Runtime 边界

### 3.1 Source-of-truth

V1 方案相关 source-of-truth 是：

```text
agents/*.agent.md
skills/*/SKILL.md
docs/02-架构设计/ECC集成/*
docs/10-prompt/结构化项目角色契约.md
README.md
README.zh-CN.md
src/cli/contracts/**
CHANGELOG.md
```

本方案只定义 source 层治理，不要求立即生成 runtime。

### 3.2 Generated runtime

以下路径仍是 generated runtime，不作为 V1 修改目标：

```text
.claude/
.codex/
.agents/skills/
```

V1 不手改 runtime mirror。未来如果 agent registry 或 pack delivery 需要进入 runtime，必须通过 source generator 与 `spec-first init --claude|--codex` 产生。

### 3.3 Confirmed standards

`.spec-first/specs/repo-profile.yaml` 只承接用户确认后的长期规范。

ECC 或 agent finding 不能直接写入 repo-profile。任何长期规则必须走：

```text
agent finding
  -> standards candidate
  -> standards preview
  -> human confirmation
  -> repo-profile.yaml / standards index
```

### 3.4 Host dispatch 边界

V1 的 agent 治理必须兼容当前双宿主 dispatch 现实：

```text
Claude / Codex host 都支持 workflow-owned agent dispatch。
```

因此，`spec-doc-review`、`spec-code-review`、`spec-plan`、`spec-ideate`、`spec-work` 等 workflow 在进入自己文档化的 reviewer / researcher / worker phase 后，不应因为 host 是 Codex、或因为用户没有再次说“请使用多 agent”，自动降级为 single-agent fallback。

正确边界是 capability / safety gate，而不是二次授权 gate：

```text
direct workflow invocation
  -> authorizes documented dispatch phase
  -> select named agents by workflow capability gap and safety checks
  -> dispatch with bounded parallelism when host primitive exists
  -> fallback only when primitive unavailable, runtime cannot call it, user explicitly disables agents, or mutating safety check fails
```

Codex 的默认 dispatch primitive 是 `spawn_agent`；Claude Code 的默认 dispatch primitive 是 `Agent` / `Task`。两侧都必须遵守同一条治理规则：

- 不新增未命名 capability gap 的 agent；
- 不让脚本做专家选择、finding severity、review 结论等语义决策；
- 不手改 generated runtime mirrors；
- 不把 ECC agents 当成默认 agent pool；
- 不因 Codex host 而默认 inline reviewer / researcher / resolver。

因此，V1 后续改造 dispatch、router 或 pack 时，必须把“workflow 调用是否进入 documented reviewer phase”和“用户是否显式请求额外 subagent”分开处理。前者由 workflow contract 与 host capability gate 决定，后者只影响 workflow 之外的临时委派。

---

## 4. 问题框架

### 4.1 已有能力不是空白

当前 source agent 已覆盖大多数 ECC 可迁移专家领域：

```text
Engineering Quality:
  spec-correctness-reviewer
  spec-testing-reviewer
  spec-maintainability-reviewer
  spec-reliability-reviewer
  spec-code-simplicity-reviewer

Architecture & Contract:
  spec-architecture-strategist
  spec-api-contract-reviewer
  spec-repo-research-analyst
  spec-git-history-analyzer

Document Quality:
  spec-coherence-reviewer
  spec-feasibility-reviewer
  spec-scope-guardian-reviewer
  spec-adversarial-document-reviewer
  spec-security-lens-reviewer

Product & Flow:
  spec-product-lens-reviewer
  spec-spec-flow-analyzer
  spec-design-lens-reviewer

Governance:
  spec-project-standards-reviewer
  spec-agent-native-reviewer
  spec-cli-readiness-reviewer
  spec-cli-agent-readiness-reviewer
  spec-learnings-researcher
  spec-pattern-recognition-specialist

Conditional / Connector:
  spec-security-reviewer
  spec-security-sentinel
  spec-data-integrity-guardian
  spec-data-migrations-reviewer
  spec-data-migration-expert
  spec-performance-reviewer
  spec-performance-oracle
  spec-swift-ios-reviewer
  spec-framework-docs-researcher
  spec-best-practices-researcher
  spec-web-researcher
  spec-slack-researcher
  spec-session-historian
  spec-issue-intelligence-analyst
  spec-figma-design-sync
```

所以 V1 的核心问题不是“有没有专家”，而是：

```text
已有专家是否被正确注册？
是否被正确路由？
是否拿到正确上下文？
是否输出结构化 finding？
是否被 Skill 合成？
是否避免重复、越权和上下文膨胀？
```

### 4.2 平铺新增 ECC agent 的风险

如果直接复制 ECC agent，会产生：

```text
重复专家
重复审查
重复上下文
命名混乱
个人风格污染
router 难以选择
Skill Synthesis 噪音变大
code-review 变成多个专家同时发散
```

尤其要避免双轨命名：

```text
spec-correctness-reviewer
ecc-correctness-reviewer
ce-correctness-reviewer
```

这会让 source-of-truth 分裂，也会让后续 runtime delivery 和 doctor/clean 难以治理。

---

## 5. Goals 与 Non-goals

### 5.1 Goals

| Goal | 说明 |
| --- | --- |
| 盘点当前 agent | 生成 current inventory，明确 51 个 source agent 的职责、分类、工具和 workflow 触发语义 |
| 建立 ECC overlap matrix | 以 `ECC子代理清单.md` 与 ECC `agents/*.md` 为输入，识别 direct match、partial match、native、style profile、missing、deprecated candidate |
| 不新增重复 agent | direct match 必须增强现有 `spec-*` agent，不创建 `ecc-*` 影子专家 |
| 重组 agent packs | 从散装专家变成 P0/P1/P2 研发能力包，以及 P3 style / experimental references |
| 建立 registry metadata | 为每个 agent 记录 canonical id、source file、origin、allowed workflows、trigger signals、forbidden actions |
| 吸收 ECC skill 方法论 | 从 `ECC技能清单.md` 与 ECC `skills/*/SKILL.md` 提取 checklist / rubric / failure mode，不直接复制 skill |
| 建立 router policy | 让 Skill 可以基于 workflow、files、risk signals、available evidence 选择有限专家 |
| 建立 context pack | 每个专家只拿最小必要上下文，避免全量加载 |
| 建立 finding schema | 专家输出统一为可合成 finding |
| 建立 synthesis policy | 最终裁判权回到 Skill，支持 merge/dedupe/rank/downgrade/adopt/reject |
| 建立专家能力插件模型 | 将 ECC/internal/company/community 能力抽象为 capability provider / capability pack，支持显式启用、禁用、降级、doctor 和 clean |
| 保持 spec-first 主权 | ECC 是能力样本，不是第二套 workflow、command、hook 或 runtime authority |
| 兼容现有 workflow contract | 不替换当前 `spec-code-review` / `spec-doc-review` 的 persona catalog、finding schema、headless 输出和 synthesis 规则 |

### 5.2 Non-goals

| Non-goal | 原因 |
| --- | --- |
| 不导入 ECC commands | 会形成第二套用户入口 |
| 不导入 ECC hooks | hooks 会改变宿主全局行为，风险高 |
| V1 不新增 ECC agents | 当前问题是治理不足，不是专家数量不足 |
| V1 不批量导入 ECC skills | 182 个 skill 必须经过 pack / lens / optional profile 过滤 |
| V1 不改 runtime mirror | `.claude/`、`.codex/`、`.agents/skills/` 是 generated runtime |
| V1 不写 repo-profile | 专家建议不是 confirmed standards |
| V1 不实现完整 Agent Governance Platform | 先用 docs + schema + policy 收敛边界 |
| 不把 router 做成 hard rule engine | Scripts prepare, LLM decides |
| 不让 style profile 进入默认 P0/P1 | 风格型专家必须显式 opt-in |
| 不替换现有 review schema | 现有 code-review / doc-review schema 是当前 runtime contract，V1 只能做兼容层与增量 adapter |
| 不用 registry 覆盖 agent source | G0-G3 的 registry 是 preview snapshot，不是新的 source-of-truth |
| 不把 ECC 整包安装成 spec-first 插件 | 插件化对象是治理后的专家能力包，不是 ECC 原始 commands/hooks/agents/skills 全量 runtime |
| 不集成非研发领域 skill | 业务运营、媒体增长、金融、物流、医疗、web3 等只保留 inventory/reference，不进入 capability pack、router 或 runtime roadmap |

---

## 6. 核心架构

V1 采用五层模型：

```text
Agent Source Inventory
  读取 agents/*.agent.md，提取事实

Overlap Governance
  对照 ECC 能力，标注 direct / partial / native / profile / missing / deprecated

Agent Registry
  统一 canonical id、pack、priority、workflow、signals、inputs、forbidden actions

Router + Context Pack
  按 workflow / file / risk / evidence 选择有限专家，并构造最小上下文

Skill Synthesis
  合并 finding，裁判最终结论，写入 durable artifacts
```

职责边界：

```text
Script:
  scan files
  parse frontmatter
  validate schema
  produce inventory facts
  detect duplicate ids
  emit reason_code
  propose candidate agents from deterministic signals

LLM / Skill:
  classify overlap meaning
  decide whether ECC rubric improves current agent
  choose final selected experts from candidates
  judge finding severity
  synthesize final verdict
```

V1 遵循业界兼容性优先的治理实践：先保留现有 runtime contract，通过 adapter、preview artifact 和 pilot gate 做增量演进；只有当兼容层稳定且能证明节点质量增益后，才把 docs 级草案升级为 CLI contract 或 runtime 交付能力。

---

### 6.1 现有 Workflow Compatibility Baseline

V1 不能把已有 workflow 编排当成空白重写。进入任何 router、schema 或 synthesis 改造前，必须先把现有 workflow 的 reviewer / schema / output contract 纳入 compatibility baseline。

当前必须保留的基线包括：

| Workflow | 当前基线 | V1 处理 |
| --- | --- | --- |
| `spec-code-review` | `skills/spec-code-review/references/persona-catalog.md` 已定义 always-on、conditional、stack-specific、Spec-First conditional reviewer；`references/findings-schema.json` 已定义 P0-P3、confidence anchors、autofix routing 和 owner | V1 router 只能为现有 catalog 增加 registry metadata、候选解释和去噪指标，不能直接用“最多 5 个专家”覆盖现有 always-on 规则 |
| `spec-doc-review` | `skills/spec-doc-review/SKILL.md` 已定义 coherence / feasibility always-on、条件 persona、dispatch fallback 和 `references/findings-schema.json` | V1 finding compatibility 必须适配当前 doc-review schema，不替换 `safe_auto/gated_auto/manual` 与 deferred question 流程 |
| `spec-plan` | `skills/spec-plan/SKILL.md` 与 `references/deepening-workflow.md` 已定义 confidence-first deepening、section-to-agent mapping、graph freshness 和 plan synthesis | V1 只能补 registry / evidence metadata，不重写 plan deepening 的 section routing |

Compatibility Baseline 的规则：

```text
existing workflow contract wins
V1 registry is additive
V1 router produces candidates first
V1 finding core adapts to workflow-native schema
V1 synthesis policy must preserve current workflow output semantics
```

如果 V1 草案与现有 workflow source 冲突，优先修 V1 草案；只有明确做新的 workflow 变更计划、测试和 changelog 后，才能修改 workflow source。

---

### 6.2 业界实践对齐

V1 采用的工程治理实践不是“多加专家”，而是把专家能力纳入可演进 contract：

| 实践 | V1 落点 | 质量收益 |
| --- | --- | --- |
| Backward compatibility first | 不替换现有 review schema / persona catalog | 避免破坏已验证 workflow |
| Contract versioning | registry、router、context、finding core 都带 `schema_version` | 允许灰度升级和 downstream 校验 |
| Adapter pattern | Finding Core 只做 compatibility view | 统一汇总同时保留 native workflow 语义 |
| Provenance tracking | registry / context / rubric matrix 记录 source、revision、freshness | 防止 stale graph、过期清单和无来源规则进入结论 |
| Least privilege | agent forbidden actions + context budget | 降低越权写文件、改 standards、污染 runtime 风险 |
| Staged rollout | G0-G6.5 gate + pilot，再进入 Future Roadmap | 避免一次性 Agent Platform 过度设计 |
| Feature flag / opt-in | 研发向 P2 optional packs 与 style profile 显式启用 | 防止低频能力污染核心路径 |
| Human-in-the-loop standards | finding -> standards candidate -> preview -> human confirmation | 保证长期规范只承接 confirmed truth |
| Observability before automation | pilot 记录 router count、evidence rate、dedupe/reject rate | 先证明质量增益，再自动化 |
| Source-first runtime delivery | 只改 source，runtime 由 generator 产生 | 维护 Claude/Codex 双宿主边界 |

这些实践对应项目角色契约中的三个硬原则：

```text
Light contract:
  只定义最小可维护 schema 与 adapter，不做完整平台。

Explicit boundaries:
  区分 source、preview artifact、generated runtime、confirmed standards、advisory evidence。

Scripts prepare, LLM decides:
  脚本只产出 facts / candidates / reason_code，Skill 做最终语义选择和 synthesis。
```

### 6.3 专家能力插件模型

V1 的长期方向是 **专家能力插件化、插拔式集成**。这里的“插件”不是把 ECC 原始插件整包安装进 spec-first，而是把通过治理的专家能力封装成 spec-first 自己能理解、能审计、能启停、能降级的 capability pack。

核心对象：

```text
Capability Provider:
  能力来源，例如 spec-first-native、ecc-source、company-internal、community-pack。

Capability Pack:
  可插拔能力包，例如 engineering-rubric-pack、frontend-async-pack、security-deep-pack。

Capability Entry:
  pack 中的单项能力，可以是 agent enhancement、rubric reference、optional lens、style profile 或 future optional agent。

Extension Point:
  能力可挂载的位置，例如 spec-code-review reviewer selection、spec-plan deepening、spec-doc-review persona、spec-skill-audit。

Activation Policy:
  pack 是否默认禁用、项目显式启用、workflow 条件启用，或仅 manual deep review 启用。
```

插件化生命周期：

```text
discover:
  扫描 provider source，生成 source inventory facts。

classify:
  通过 overlap / rubric extraction 判断 direct、partial、native、profile、missing。

register-preview:
  写入 docs 级 registry preview，包含 source、version、trust、stale policy。

pilot:
  在 code-review / plan / doc-review / skill-audit 小样本验证节点质量增益。

enable:
  只有通过 gate 的 pack 才能被项目或 workflow 显式启用。

deliver:
  未来如需进入 runtime，必须通过 source generator、pack-aware state、doctor 和 clean。

disable / degrade:
  pack 可被关闭；缺证据、provider stale、connector 不可用时降级为 checklist/reference。
```

插件化能力必须满足：

| 要求 | 说明 |
| --- | --- |
| Pack-gated | 未启用 pack 不生成 runtime asset，不进入默认 agent pool |
| Source-attributed | 每个 capability entry 能追溯到 source file、revision 和 adoption reason |
| Workflow-compatible | 不覆盖现有 workflow-native schema、persona catalog 和 synthesis contract |
| Doctor-able | 能报告 enabled pack missing、stale、drifted、degraded、residual |
| Clean-able | 禁用 pack 后能清理 generated runtime residual，不影响 source |
| Degradable | provider 不可用或证据不足时降级为 advisory checklist/reference |
| Opt-in by default | 研发向 P2 optional pack、style profile、missing_in_spec_first 一律显式启用；非研发领域能力不进入 pack |
| No hidden authority | capability pack 不决定 workflow、不写 standards、不输出 final verdict |

当前代码事实边界：

```text
src/cli/plugin.js 当前已治理 commands / skills / agents 的基础 delivery。
src/cli/contracts/dual-host-governance/skills-governance.json 当前已治理 skill entry surface。
当前尚未支持 capability pack、pack-aware state、pack-aware doctor/clean、agent filtering。
```

因此，V1 只定义 capability plugin model 和 preview artifacts；实现 pack-aware runtime delivery 属于 R9 之后的 Future Roadmap，不能提前塞进 G0-G6.5。

### 6.4 Claude / Codex 双宿主执行逻辑可借鉴优化

`Codex安装后ECC执行逻辑分析.md` 说明 ECC 在 Codex 中不是后台 runtime，而是静态资产分层加载：`AGENTS.md` 管治理，skills 管动作，config 管工具与权限，agent roles 管角色，commands 在 Codex 中降级为 prompt/reference。

V1 只吸收这个执行模型，并同步映射到当前已支持的 Claude / Codex 双宿主；不吸收 ECC 的全局资产同步方式。

| 执行平面 | Codex 观察 | Claude 对应 | spec-first 统一口径 |
| --- | --- | --- | --- |
| Governance Plane | `AGENTS.md` | `CLAUDE.md` + `AGENTS.md` managed blocks | 管入口治理、语言、source/runtime、workflow 选择边界 |
| Workflow Plane | `.agents/skills` / plugin skills | `.claude/skills` / source `skills/` generated runtime | workflow source 仍是 `skills/*/SKILL.md` |
| Tool Plane | `.codex/config.toml`、MCP、profiles | Claude settings / MCP / hooks / permissions | scripts/tools 只产出 deterministic facts |
| Expert Role Plane | `.codex/agents` + `spawn_agent` | `.claude/agents` + `Agent` / `Task` | agent 是专家判断角色，不是 workflow authority |
| Command / Prompt Plane | `commands` 降级为 prompts/reference | Claude slash command 有原生命令面 | ECC commands 不导入；只做 command idea matrix |
| Runtime State Plane | `~/.codex` / project `.agents` generated mirror | `.claude` / `.agents/skills` generated mirror | runtime 由 source generator 产生，不反向成为 source |

| 优化点 | ECC 观察 | spec-first 落地 |
| --- | --- | --- |
| Capability Execution Plane | `AGENTS.md`、skills、config、agents、commands 各有执行职责 | 在 capability pack 中显式区分 governance、workflow、tool、role、command/prompt、runtime state 六层 |
| Explicit invocation first | `$skill-name` 显式调用比隐式触发稳定 | 显式 spec-first workflow（Claude: `/spec:*`；Codex: `$spec-*`）和显式能力启用优先；隐式 router 只能输出 advisory candidate |
| Host Compatibility Matrix | Codex target 会过滤不支持的模块，Claude / Codex dispatch primitive 不同 | 每个 pack 声明 Claude / Codex 支持度、fallback 与 unsupported reason |
| Runtime Merge Policy | Codex 全局同步采用 marker merge / add-only merge 保护用户配置；Claude 也有 managed blocks / generated runtime 边界 | 未来双宿主 runtime delivery 必须 managed marker merge、add-only config merge、preview-first |
| Source Freshness 与 Command Idea Matrix | commands 在 Codex 中不是 slash command parity，skills 来源可能是本地、全局或插件 | rubric extraction 记录 source freshness；ECC commands 只进入 idea matrix，不进入 command registry |

这些优化对应的硬边界：

```text
显式 workflow 优先于隐式触发
隐式 router 只给 candidate facts，不做 selected_agents
commands 只能 reference / idea extraction，不进入 runtime command surface
host 不支持时降级为 checklist/reference，不伪装成可执行能力
runtime 合并必须保护用户配置和 generated/source 边界
```

---

## 7. 重叠治理状态模型

### 7.1 overlap_status

```yaml
overlap_status:
  direct_match: ECC 与 spec-first 已有 agent 高度一致
  partial_match: 部分一致，需要合并、拆分或泛化命名
  spec_first_native: spec-first 自有能力，不应被 ECC 覆盖
  missing_in_spec_first: ECC 有、spec-first 暂无，先做 optional lens
  style_profile: 风格型能力，不进入默认核心
  deprecated_candidate: 建议废弃或合并的重复能力
```

### 7.2 integration_action

```yaml
integration_action:
  keep_as_is: 保留现状
  enhance_existing: 增强当前 spec-first agent
  merge: 多个现有 agent 合并治理
  split: 一个 agent 拆成多个职责
  rename_generic: 泛化 canonical id / runtime name
  optional_lens: 作为可选 lens/reference
  optional_profile: 作为可选风格 profile
  deprecated: 废弃或从默认路由中移除
```

### 7.3 priority

```yaml
priority:
  P0: 核心专家，进入主要 workflow router 候选
  P1: 条件专家，按风险、文件或技术栈触发
  P2: 可插拔专家，依赖 connector 或窄场景
  P3: 风格 profile 或高度特化能力
```

### 7.4 governance_state

```yaml
governance_state:
  inventory_only: 已盘点，未治理
  normalized: 已规范命名和元数据
  routable: 可被 Router 选择
  schema_validated: 输出符合 finding schema
  synthesis_ready: 可被 Skill Synthesis 合成
  deprecated: 已废弃
```

---

## 8. Agent Inventory Schema

V1 先以 docs 产物和 JSON fixture 表达 inventory，不直接进入 runtime state。

建议输出路径：

```text
docs/02-架构设计/ECC集成/generated/current-agent-inventory.json
docs/02-架构设计/ECC集成/generated/current-agent-inventory.md
```

Schema 草案：

```json
{
  "schema_version": "spec-first.agent-inventory.v1",
  "generated_at": "2026-05-05T00:00:00Z",
  "source": {
    "root": "agents",
    "pattern": "agents/*.agent.md"
  },
  "agents": [
    {
      "id": "spec-correctness-reviewer",
      "source_file": "agents/spec-correctness-reviewer.agent.md",
      "frontmatter_name": "spec-correctness-reviewer",
      "description": "Always-on code-review persona...",
      "tools_allowed": ["Read", "Grep", "Glob", "Bash"],
      "workflow_mentions": ["spec-code-review"],
      "risk_signals": ["runtime_code_changed", "behavior_change"],
      "forbidden_actions_present": false,
      "finding_schema_present": false
    }
  ]
}
```

V1 事实采集必须保持确定性：

```text
扫描文件
解析 frontmatter
读取 name / description / tools / model / color
提取显式 workflow 文本
检查是否存在 Required Output / forbidden actions / finding schema 段落
```

分类、重叠程度和集成动作属于 LLM 判断，不由脚本硬编码。

---

## 9. ECC Overlap Matrix Schema

建议输出路径：

```text
docs/02-架构设计/ECC集成/generated/ecc-agent-overlap-matrix.json
docs/02-架构设计/ECC集成/generated/ecc-agent-overlap-matrix.md
```

Schema 草案：

```json
{
  "schema_version": "spec-first.ecc-agent-overlap-matrix.v1",
  "entries": [
    {
      "ecc_agent": "ce-correctness-reviewer",
      "spec_first_agent": "spec-correctness-reviewer",
      "overlap_status": "direct_match",
      "integration_action": "enhance_existing",
      "priority": "P0",
      "confidence": "high",
      "reason": "Same review domain and role: correctness, logic errors, edge cases, regressions.",
      "migration_notes": [
        "Do not create new agent.",
        "Merge stronger ECC checklist into current spec-first agent.",
        "Add finding schema and forbidden actions before router default use."
      ]
    }
  ]
}
```

Matrix 必须支持以下断言：

```text
direct_match 不允许生成新 agent
style_profile 不允许进入默认 P0/P1
spec_first_native 不允许被 ECC 覆盖
missing_in_spec_first 默认只能 optional_lens
```

### 9.3 ECC Rubric Extraction Matrix

ECC skills 的主要价值不是复制 skill，而是提取更好的 checklist、rubric、failure mode 和 evidence question。V1 必须给这类吸收建立独立 artifact，避免后续改 agent prompt 时失去来源和采纳理由。

建议输出路径：

```text
docs/02-架构设计/ECC集成/generated/ecc-rubric-extraction-matrix.json
docs/02-架构设计/ECC集成/generated/ecc-rubric-extraction-matrix.md
```

Schema 草案：

```json
{
  "schema_version": "spec-first.ecc-rubric-extraction-matrix.v1",
  "entries": [
    {
      "ecc_skill": "api-design",
      "ecc_source_file": "/Users/kuang/xiaobu/everything-claude-code/skills/api-design/SKILL.md",
      "target_surface": "agents/spec-api-contract-reviewer.agent.md",
      "target_workflow": "spec-code-review",
      "quality_node": "Review",
      "rubric_type": "api_contract_failure_modes",
      "candidate_rubrics": [
        "request/response compatibility",
        "multi-client breakage",
        "versioning and rollout"
      ],
      "dedupe_against_existing": "partial",
      "adoption_action": "enhance_existing_agent",
      "confidence": "medium",
      "not_adopted_reason": null
    }
  ]
}
```

首批 rubric extraction 只覆盖高价值样本：

```text
security / auth
testing / coverage
api contract
data integrity / migrations
frontend async / UI state
architecture / repo research
```

182 个 ECC skills 不做一次性全量 prompt 注入。每个采纳项都必须说明它提升哪个 spec-first 节点质量、增强哪个现有 agent 或 workflow、是否与现有规则重复，以及为什么不直接生成 runtime asset。

---

## 10. 重叠处理策略

### 10.1 Direct Match

适用于：

```text
correctness
testing
maintainability
security
reliability
api contract
architecture
project standards
coherence
feasibility
product lens
scope guardian
repo research
git history
```

处理方式：

```text
不新增 ECC agent
保留 spec-* source 文件
对比 ECC prompt
提取更好的 checklist / rubric / failure modes
写入当前 spec-* agent
增加 registry metadata
接入 router / finding schema / synthesis
```

示例：

```yaml
ecc_agent: ce-correctness-reviewer
current_agent: spec-correctness-reviewer
overlap_status: direct_match
integration_action: enhance_existing
priority: P0
```

### 10.2 Partial Match

适用于带个人名、窄来源或边界不够产品化的能力：

| 当前 source agent | canonical_id | 处理 |
| --- | --- | --- |
| `spec-julik-frontend-races-reviewer` | `frontend-async-race-expert` | 泛化为前端异步竞态专家 |
| `spec-kieran-typescript-reviewer` | `typescript-expert` | 泛化为 TypeScript 专家 |
| `spec-kieran-python-reviewer` | `python-expert` | 泛化为 Python 专家 |
| `spec-kieran-rails-reviewer` | `rails-convention-expert` | Rails 项目条件启用 |
| `spec-schema-drift-detector` | `generated-artifact-drift-expert` | 泛化为 generated artifact drift 专家 |

处理规则：

```text
source_file 先保持不动
registry target_id 使用通用名
runtimeName 后续渐进统一
origin_aliases 记录历史来源
用户可见说明不展示个人名
```

### 10.3 Style Profile

适用于：

```text
spec-dhh-rails-reviewer
spec-ankane-readme-writer
```

处理方式：

```text
不进入默认专家包
不进入 P0/P1 Router
作为 optional style profile
用户显式启用才使用
style profile finding 不得产生 blocker
```

示例：

```yaml
id: rails-style-profile-dhh
priority: P3
default_enabled: false
integration_action: optional_profile
allowed_workflows:
  - spec-code-review
```

### 10.4 Spec-first Native

适用于 spec-first 自身差异化治理能力：

```text
spec-agent-native-reviewer
spec-cli-readiness-reviewer
spec-cli-agent-readiness-reviewer
spec-project-standards-reviewer
spec-learnings-researcher
spec-pattern-recognition-specialist
spec-previous-comments-reviewer
spec-pr-comment-resolver
```

处理方式：

```text
标注 spec_first_native
不映射 ECC
不允许被 ECC prompt 覆盖
接入 Governance Pack
服务 skill-audit / update / mcp-setup / code-review / compound
```

---

## 11. Agent Packs

V1 将现有 agent 重组为 packs，而不是继续暴露零散专家。

### 11.1 P0 Core Packs

| Pack | Agents | 默认服务 |
| --- | --- | --- |
| Product & Scope Pack | `spec-product-lens-reviewer`, `spec-scope-guardian-reviewer`, `spec-spec-flow-analyzer` | `spec-brainstorm`, `spec-doc-review`, `spec-plan` |
| Document Quality Pack | `spec-coherence-reviewer`, `spec-feasibility-reviewer`, `spec-adversarial-document-reviewer`, `spec-security-lens-reviewer` | `spec-doc-review`, `spec-plan` |
| Engineering Quality Pack | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-maintainability-reviewer`, `spec-reliability-reviewer`, `spec-code-simplicity-reviewer` | `spec-code-review`, `spec-debug` |
| Architecture & Contract Pack | `spec-architecture-strategist`, `spec-api-contract-reviewer`, `spec-repo-research-analyst`, `spec-git-history-analyzer` | `spec-plan`, `spec-code-review` |
| Governance Pack | `spec-project-standards-reviewer`, `spec-agent-native-reviewer`, `spec-cli-readiness-reviewer`, `spec-cli-agent-readiness-reviewer`, `spec-learnings-researcher` | `spec-skill-audit`, `spec-compound`, `spec-update`, `spec-code-review` |

### 11.2 P1 Conditional Packs

| Pack | Agents | 触发 |
| --- | --- | --- |
| Security Deep Pack | `spec-security-reviewer`, `spec-security-sentinel` | auth、token、permission、PII、external input |
| Data Pack | `spec-data-integrity-guardian`, `spec-data-migrations-reviewer`, `spec-data-migration-expert`, `spec-deployment-verification-agent` | DB、migration、SQL、data repair、production data |
| Performance Pack | `spec-performance-reviewer`, `spec-performance-oracle` | query、cache、loop、render、concurrency、I/O |
| Frontend/App Pack | `spec-design-lens-reviewer`, `spec-design-implementation-reviewer`, `spec-design-iterator`, `spec-swift-ios-reviewer`, `frontend-async-race-expert` | App、H5、iOS、KMP、UI state、design fidelity |
| Language Pack | `typescript-expert`, `python-expert`, `rails-convention-expert` | 文件类型或技术栈触发 |
| Research Pack | `spec-best-practices-researcher`, `spec-framework-docs-researcher`, `spec-web-researcher`, `spec-session-historian` | 新框架、不确定 API、用户明确研究、历史会话 |

### 11.3 P2 Optional 与 P3 Style / Experimental Packs

V1 当前聚焦研发能力包。业务运营、媒体增长、金融、物流、医疗、web3 等 ECC domain skills 不进入 P2 optional 或 P3 style / experimental packs，不进入 router 候选，不进入 runtime delivery 规划；只保留为 inventory/reference，未来如需行业化能力必须另开独立方案。

| Pack | Agents | 说明 |
| --- | --- | --- |
| Team Context Pack | `spec-slack-researcher`, `spec-issue-intelligence-analyst` | 依赖 Slack / issues connector，显式请求才启用 |
| External Design Pack | `spec-figma-design-sync` | 依赖 Figma evidence，不进入默认 baseline |
| Style Profile Pack | `rails-style-profile-dhh`, `readme-style-profile-ankane` | 用户显式启用，不能产生 blocker |

### 11.4 Capability Pack Contract

Agent Pack 是逻辑分组；Capability Pack 是未来可插拔交付单元。V1 的 pack 产物必须提前区分这两个概念，避免后续把所有逻辑分组都误投递到 runtime。

Capability Pack preview schema：

```json
{
  "schema_version": "spec-first.capability-pack-preview.v1",
  "id": "security-deep-pack",
  "provider": "spec-first-native-or-ecc-inspired",
  "status": "preview",
  "default_enabled": false,
  "activation": {
    "mode": "explicit_or_risk_triggered_after_pilot",
    "allowed_workflows": ["spec-code-review", "spec-plan"],
    "requires_human_enablement": true
  },
  "host_support": {
    "claude": "supported",
    "codex": "supported",
    "fallback": "reference_only",
    "unsupported_reason_code": null
  },
  "entries": [
    {
      "type": "agent_enhancement",
      "target": "agents/spec-security-reviewer.agent.md",
      "source": "ecc-rubric-extraction-matrix",
      "runtime_delivery": "none_in_v1",
      "source_freshness": {
        "source_file": "/Users/kuang/xiaobu/everything-claude-code/skills/security-review/SKILL.md",
        "source_revision": "unknown_until_generated",
        "loaded_from": "provider_source",
        "runtime_cached": false,
        "freshness": "current_source_read"
      }
    }
  ],
  "degradation": {
    "when_provider_stale": "checklist_reference_only",
    "when_connector_missing": "skip_with_reason",
    "when_schema_conflict": "disabled"
  },
  "runtime_merge_policy": {
    "instructions": "managed_marker_merge",
    "config": "add_only_merge",
    "commands": "idea_reference_only"
  },
  "lifecycle": {
    "doctor": "future",
    "clean": "future",
    "state": "future"
  }
}
```

V1 对 Capability Pack 的限制：

```text
只生成 preview artifact
不新增 init 参数
不写 pack-aware state
不改 doctor / clean
不生成 runtime asset
不把 optional pack 加入默认 agent pool
```

---

## 12. Agent Registry

### 12.1 Registry 位置

V1 建议先落 docs 级 artifact：

```text
docs/02-架构设计/ECC集成/generated/agent-registry.json
```

G0-G3 阶段的 registry 是 **preview snapshot**，不是新的 source-of-truth。

Source-of-truth 优先级：

```text
1. agents/*.agent.md
2. workflow-owned catalogs / schemas / references
   - skills/spec-code-review/references/persona-catalog.md
   - skills/spec-code-review/references/findings-schema.json
   - skills/spec-doc-review/references/findings-schema.json
   - skills/spec-plan/references/deepening-workflow.md
3. docs/10-prompt/结构化项目角色契约.md
4. generated registry preview
```

Registry preview 必须带 provenance：

```json
{
  "schema_version": "spec-first.agent-registry-preview.v1",
  "generated_at": "2026-05-05T00:00:00Z",
  "source_revision": "fa49220c2442c86d6082b1480a6641d66000adaa",
  "worktree_dirty": true,
  "generated_from": [
    "agents/*.agent.md",
    "skills/spec-code-review/references/persona-catalog.md",
    "skills/spec-doc-review/SKILL.md"
  ],
  "stale_policy": "stale_when_source_revision_or_relevant_source_hash_changes",
  "conflict_policy": "source_wins_registry_marked_stale"
}
```

如果 registry 与 agent source 或 workflow catalog 冲突，registry 标记 stale，不允许用 registry 覆盖 source。只有后续明确把 registry schema 升级到 `src/cli/contracts/**`，并补 drift tests、doctor output 和 migration plan 后，registry 才能成为 CLI contract。

进入 CLI contract 的时机是 V2 或 V3：

```text
src/cli/contracts/agent-registry/agent-registry.schema.json
src/cli/contracts/agent-registry/agent-packs.schema.json
src/cli/contracts/agent-registry/routing-policy.schema.json
src/cli/contracts/agent-registry/finding.schema.json
src/cli/contracts/agent-registry/router-candidate-input.schema.json
src/cli/contracts/agent-registry/router-candidate-output.schema.json
src/cli/contracts/agent-registry/finding-core.schema.json
src/cli/contracts/agent-registry/synthesis-brief.schema.json
```

### 12.2 Registry Entry

```json
{
  "id": "spec-api-contract-reviewer",
  "canonical_id": "api-contract-expert",
  "source_file": "agents/spec-api-contract-reviewer.agent.md",
  "origin": {
    "source": "spec-first-native-or-ecc-inspired",
    "ecc_agent": "ce-api-contract-reviewer",
    "source_confidence": "medium"
  },
  "classification": {
    "category": "architecture_contract",
    "pack": "architecture-contract-pack",
    "priority": "P0",
    "overlap_status": "direct_match",
    "integration_action": "enhance_existing",
    "governance_state": "inventory_only"
  },
  "workflow": {
    "allowed_workflows": [
      "spec-plan",
      "spec-code-review",
      "spec-app-consistency-audit"
    ],
    "forbidden_workflows": [
      "spec-compound"
    ]
  },
  "routing": {
    "trigger_signals": [
      "api_changed",
      "dto_changed",
      "openapi_changed",
      "multi_client_impact"
    ],
    "file_patterns": [
      "**/api/**",
      "**/*openapi*",
      "**/*swagger*",
      "**/*dto*",
      "**/*contract*"
    ],
    "risk_signals": [
      "api_contract",
      "breaking_change",
      "multi_client_impact"
    ]
  },
  "context": {
    "required_inputs": [
      "diff",
      "changed_files"
    ],
    "optional_inputs": [
      "plan",
      "graph_callers",
      "api_docs",
      "repo_profile"
    ],
    "max_context_budget": "medium"
  },
  "output": {
    "schema": "workflow-native-schema",
    "compatibility_view": "spec-first.finding-core.v1",
    "required_fields": [
      "severity",
      "confidence",
      "evidence",
      "recommendation_or_suggested_fix",
      "not_reviewed_or_native_residual_risk"
    ]
  },
  "forbidden_actions": [
    "write_files",
    "modify_repo_profile",
    "change_workflow_state",
    "run_destructive_command"
  ]
}
```

---

## 13. Router Policy

### 13.1 Router 职责

V1 Router 分为两层：

```text
Script-owned candidate facts:
  只产生确定性候选、reason_code、budget hint 和限制条件

Skill-owned selection:
  由当前 workflow 的 Skill / LLM 基于候选事实、用户意图、风险和现有 workflow contract 做最终选择
```

Script-owned candidate router 只做：

```text
读取 registry
读取 workflow
读取 changed files
读取 risk signals
读取 available evidence
给出 candidate_agents
解释选择理由
给出 budget hint
标记 degraded / stale / conflict
```

Script-owned candidate router 不做：

```text
最终选择 selected_agents
最终语义裁判
自动修改文件
自动写 repo-profile
替代 Skill Synthesis
把所有规则硬编码成状态机
```

后续文档或代码中如出现 `selected_agents`，必须说明它是 Skill-owned decision，而不是脚本输出的确定性结论。

### 13.2 Router 输入

```json
{
  "schema_version": "spec-first.agent-router-input.v1",
  "workflow": "spec-code-review",
  "stage": "code_review",
  "user_request": "",
  "spec_id": "2026-05-05-001",
  "changed_files": [
    "src/auth/session.ts",
    "src/api/user.ts",
    "CHANGELOG.md"
  ],
  "diff_summary": {
    "files_changed": 3,
    "insertions": 120,
    "deletions": 42
  },
  "risk_signals": [
    "auth",
    "api_contract",
    "runtime_code_changed"
  ],
  "available_evidence": {
    "graph_facts": true,
    "repo_profile": true,
    "plan": true,
    "tasks": false,
    "test_results": false
  }
}
```

### 13.3 Candidate Router 输出

```json
{
  "schema_version": "spec-first.agent-router-candidates.v1",
  "workflow": "spec-code-review",
  "candidate_agents": [
    {
      "id": "spec-correctness-reviewer",
      "reason": "runtime code changed",
      "reason_code": "runtime_code_changed",
      "priority": "P0",
      "evidence_budget": "medium"
    },
    {
      "id": "spec-security-reviewer",
      "reason": "auth/session related files changed",
      "reason_code": "auth_surface_changed",
      "priority": "P1",
      "evidence_budget": "high"
    },
    {
      "id": "spec-api-contract-reviewer",
      "reason": "api file changed",
      "reason_code": "api_surface_changed",
      "priority": "P0",
      "evidence_budget": "medium"
    },
    {
      "id": "spec-testing-reviewer",
      "reason": "runtime behavior changed and no test evidence provided",
      "reason_code": "behavior_changed_without_test_evidence",
      "priority": "P0",
      "evidence_budget": "small"
    }
  ],
  "excluded_by_policy": [
    {
      "id": "spec-swift-ios-reviewer",
      "reason": "no iOS/KMP/mobile files changed"
    }
  ],
  "degraded_mode": {
    "enabled": false,
    "reason": null
  }
}
```

Skill-owned selection envelope：

```json
{
  "schema_version": "spec-first.agent-selection.v1",
  "workflow": "spec-code-review",
  "selected_agents": [
    {
      "id": "spec-correctness-reviewer",
      "selected_by": "skill",
      "reason": "runtime code changed and existing code-review catalog keeps correctness always-on"
    }
  ],
  "selection_notes": [
    "Preserved current workflow persona catalog.",
    "Did not select style profile agents.",
    "Graph facts stale, so graph-dependent confidence must downgrade."
  ]
}
```

### 13.4 默认专家上限

这些上限是 **candidate / incremental expert budget**，不是覆盖现有 workflow always-on catalog 的硬限制。

| Workflow | 候选上限 | 说明 |
| --- | ---: | --- |
| `spec-brainstorm` | 3 | product、scope、flow |
| `spec-doc-review` | 4 | coherence、feasibility、scope、adversarial |
| `spec-plan` | 5 | architecture、repo、feasibility、simplicity、contract |
| `spec-write-tasks` | 4 | coherence、testing、dependency、deployment |
| `spec-work` | 2 | 执行阶段克制调用 |
| `spec-debug` | 4 | correctness、history、reliability、domain |
| `spec-code-review` | 5 | 增量候选最多 5 个，不覆盖现有 persona catalog |
| `spec-app-consistency-audit` | 6 | 产品、流程、设计、App、API、analytics/i18n |
| `spec-skill-audit` | 5 | prompt、workflow、runtime、security、simplicity |

若当前 workflow source 已经定义更具体的 dispatch catalog，以 workflow source 为准；V1 上限只用于控制 ECC-derived 增量候选、context pack 和 pilot 观察指标。

---

## 14. Context Pack

每个专家只拿自己需要的最小上下文，不拿全仓库。

```json
{
  "schema_version": "spec-first.context-pack.v1",
  "agent_id": "spec-api-contract-reviewer",
  "workflow": "spec-code-review",
  "task": "Review API contract impact for current diff.",
  "inputs": {
    "user_request": "...",
    "changed_files": [],
    "diff_excerpt": "..."
  },
  "evidence_items": [
    {
      "id": "diff.current",
      "type": "diff",
      "path": null,
      "source_revision": "fa49220c2442c86d6082b1480a6641d66000adaa",
      "freshness": "current",
      "trust_level": "primary",
      "reason_code": "current_worktree_diff",
      "allowed_use": "primary_evidence"
    },
    {
      "id": "graph.neighbors",
      "type": "graph",
      "path": ".spec-first/graph/graph-facts.json",
      "source_revision": "dbf9bab1a871fc7aa6c790fe26b70eda10e0e0dc",
      "freshness": "stale",
      "trust_level": "advisory",
      "reason_code": "source_revision_mismatch",
      "allowed_use": "orientation_only"
    },
    {
      "id": "standards.repo_profile",
      "type": "repo_profile",
      "path": ".spec-first/specs/repo-profile.yaml",
      "freshness": "current_if_validation_passed",
      "trust_level": "confirmed_or_degraded",
      "reason_code": "standards_validation_required",
      "allowed_use": "hard_criteria_only_when_confirmed"
    }
  ],
  "unavailable_evidence": {
    "test_results": "not provided",
    "runtime_execution": "not executed"
  },
  "boundaries": {
    "must_do": [
      "identify API compatibility risks",
      "check request/response contract consistency",
      "mark missing frontend/backend coordination"
    ],
    "must_not_do": [
      "do not rewrite the full plan",
      "do not invent API callers",
      "do not write files",
      "do not change repo-profile"
    ]
  },
  "output_schema": "workflow-native-schema-with-finding-core-adapter",
  "confidence_policy": "downgrade_when_evidence_missing"
}
```

Context Pack 的核心不是把更多材料塞给专家，而是把每份材料的 provenance、freshness、trust level 和 allowed use 说清楚。专家不得基于 `allowed_use=orientation_only` 的 stale graph 或 advisory standards 产出高置信 blocker；这类输入只能用于提出待验证问题或降低置信度。

Evidence budget：

| Budget | 输入 |
| --- | --- |
| tiny | paths、diff stats、risk signals |
| small | selected diff hunks、current doc section |
| medium | relevant files、plan excerpt、standards snippets、graph neighbors |
| high | history、tests、contracts、provider facts |
| manual | 用户明确要求全量深审 |

---

## 15. Finding Schema Compatibility

V1 不替换现有 workflow-native finding schema。

当前 source-of-truth：

| Workflow | Schema source | V1 策略 |
| --- | --- | --- |
| `spec-code-review` | `skills/spec-code-review/references/findings-schema.json` | 保留 P0/P1/P2/P3、confidence anchors、`autofix_class`、`owner`、`requires_verification`、`pre_existing` |
| `spec-doc-review` | `skills/spec-doc-review/references/findings-schema.json` | 保留 P0/P1/P2/P3、`finding_type`、`safe_auto/gated_auto/manual`、`deferred_questions` |
| `spec-plan` deepening | `skills/spec-plan/references/deepening-workflow.md` | 保留 section-scoped findings、accepted/rejected synthesis 和 plan-local integration 规则 |

V1 新增的是跨 workflow 的 **Finding Core compatibility view**，用于 synthesis、metrics 和未来 registry，不作为当前 reviewer 的强制输出替换。

Finding Core 字段：

```json
{
  "schema_version": "spec-first.finding-core.v1",
  "workflow": "spec-code-review",
  "agent_id": "spec-security-reviewer",
  "native_schema": "skills/spec-code-review/references/findings-schema.json",
  "native_finding_ref": "#7",
  "category": "security",
  "title": "Session refresh path lacks permission boundary evidence",
  "severity_native": "P1",
  "confidence_native": 75,
  "evidence": [
    {
      "type": "file",
      "path": "src/auth/session.ts",
      "lines": "40-72",
      "trust_level": "primary"
    }
  ],
  "impact": "May allow session refresh without explicit authorization checks.",
  "recommendation": "Add explicit permission boundary or document why existing middleware guarantees it.",
  "not_reviewed": [
    "runtime middleware behavior was not executed"
  ],
  "adapter_notes": [
    "Preserved code-review native severity and confidence anchors."
  ]
}
```

Compatibility mapping 只用于展示和跨 workflow 汇总，不反向改写 native schema：

| Native code/doc severity | Finding Core display | 说明 |
| --- | --- | --- |
| `P0` | `blocker` | 必须修，否则不能进入下一阶段 |
| `P1` | `high` | 明显质量、安全或交付风险 |
| `P2` | `medium` | 应修，但通常不阻断 |
| `P3` | `low/note` | 可选优化或观察项 |

| Native confidence | Finding Core display | 说明 |
| ---: | --- | --- |
| `100` | `high` | 代码、文档或 confirmed standards 直接证明 |
| `75` | `high` | 已双重核验，正常使用会触发 |
| `50` | `medium` | 已验证但影响较窄，或仅 P0 例外保留 |
| `25` | `low` | 推测性，默认不进入 actionable findings |
| `0` | `reject` | false positive 或 pre-existing，不应报告 |

Finding Core 的实现顺序：

```text
1. 保留 workflow-native schema
2. 为 pilot 抽取 read-only compatibility view
3. 在 synthesis metrics 中使用 compatibility view
4. pilot 通过后再考虑把 finding-core schema 放入 src/cli/contracts/**
```

任何“统一 schema”提案都必须先证明不会破坏现有 code-review/doc-review 的 headless output、autofix routing、validator、deferred questions 和 report presentation。

---

## 16. Skill Synthesis

### 16.1 合成职责

Skill Synthesis 必须做：

```text
merge: 合并重复 finding
dedupe: 去重
rank: 排序
downgrade: 降级证据不足 finding
upgrade: 多专家共振问题升级
reject: 拒绝越界建议
adopt: 采纳有效建议
summarize: 写入最终产物
```

Synthesis 必须消费 workflow-native schema，并可选择生成 Finding Core compatibility view 用于跨 workflow 汇总。它不得要求现有 reviewer 改用不兼容的新 schema，也不得丢弃 native schema 中的 `autofix_class`、`owner`、`requires_verification`、`finding_type`、`deferred_questions` 等 workflow-specific 字段。

### 16.2 冲突裁判优先级

```text
1. 用户本次明确指令
2. repo-profile confirmed standards
3. pinned team standards
4. code facts / graph facts
5. docs / README / manifest
6. agent finding
7. external best practice
```

### 16.3 合成示例

```text
spec-security-reviewer:
  high: 新 API 缺少权限边界

spec-api-contract-reviewer:
  medium: API contract 未声明 permission requirement

spec-project-standards-reviewer:
  blocker: 团队 API governance 要求所有写接口声明 permission contract

Skill Synthesis:
  blocker: 新增 API 缺少权限合约与实现证据
  reason:
    - security finding
    - api contract finding
    - confirmed standards
  required fix:
    - 补 permission contract
    - 补鉴权实现或证明已有 middleware 覆盖
    - 补回归测试
```

---

## 17. Skill 接入策略

### 17.1 `spec-code-review`

现有 compatibility baseline：

```text
spec-correctness-reviewer
spec-testing-reviewer
spec-maintainability-reviewer
spec-project-standards-reviewer
spec-agent-native-reviewer
spec-learnings-researcher
```

条件触发：

```text
auth/session/permission/token -> spec-security-reviewer
api/openapi/proto/dto -> spec-api-contract-reviewer
migration/sql/schema -> spec-data-migrations-reviewer
db/data/etl -> spec-data-integrity-guardian
query/cache/loop/render -> spec-performance-reviewer
queue/job/retry/network -> spec-reliability-reviewer
large/high-risk diff -> spec-adversarial-reviewer
cli/runtime/command -> spec-cli-readiness-reviewer
PR prior comments -> spec-previous-comments-reviewer
.ts/.tsx -> typescript-expert
.py -> python-expert
swift/ios/kmp -> spec-swift-ios-reviewer
schema drift/deployment -> spec-schema-drift-detector / spec-deployment-verification-agent
```

关键改造：

```text
1. 保留 persona-catalog.md 的 current reviewer selection
2. candidate router 只补 reason_code / evidence_budget / skipped rationale
3. 不用 V1 上限移除 current always-on reviewers
4. 每个 reviewer 继续输出 code-review native schema
5. Synthesis 生成 Finding Core compatibility view 用于 metrics
6. 输出每个 finding 的 evidence、confidence anchor、autofix_class 和 owner
```

### 17.2 `spec-plan`

默认候选：

```text
spec-architecture-strategist
spec-repo-research-analyst
spec-feasibility-reviewer
spec-code-simplicity-reviewer
```

条件触发：

```text
API / 多端 / 多团队 -> spec-api-contract-reviewer
历史模块改造 -> spec-git-history-analyzer
数据链路 -> spec-data-integrity-guardian
权限/安全 -> spec-security-lens-reviewer
新框架 -> spec-framework-docs-researcher
```

关键改造：

```text
1. plan 不脑补架构证据
2. repo-research 优先读 graph facts，graph stale 时必须降级
3. architecture finding 必须标注 evidence
4. simplicity finding 专门检查过度设计
5. final plan 增加 Expert Findings Summary
```

### 17.3 `spec-doc-review`

现有默认 reviewer：

```text
spec-coherence-reviewer
spec-feasibility-reviewer
spec-scope-guardian-reviewer
```

条件触发：

```text
高风险文档 -> spec-adversarial-document-reviewer
安全方案 -> spec-security-lens-reviewer
App/H5 体验 -> spec-design-lens-reviewer
```

关键改造：

```text
1. doc-review 保留当前 findings-schema.json 的 P0-P3 / autofix_class / finding_type
2. coherence 负责术语、矛盾、缺口
3. feasibility 负责落地风险
4. scope guardian 防 scope creep
5. adversarial 只在深审时启用
6. Finding Core 只作为 compatibility view，不替换 doc-review native schema
```

### 17.4 `spec-brainstorm`

默认候选：

```text
spec-product-lens-reviewer
spec-scope-guardian-reviewer
spec-spec-flow-analyzer
```

条件触发：

```text
竞品/开源/行业参考 -> spec-web-researcher
用户反馈/issues -> spec-issue-intelligence-analyst
团队讨论 -> spec-slack-researcher
```

关键改造：

```text
1. brainstorm 不做过早架构方案
2. product lens 负责价值和用户场景
3. scope guardian 负责边界
4. flow analyzer 负责用户流程和多端流程
```

### 17.5 `spec-write-tasks`

默认候选：

```text
spec-coherence-reviewer
spec-testing-reviewer
spec-architecture-strategist
spec-api-contract-reviewer
spec-deployment-verification-agent
```

关键改造：

```text
1. 不重新设计 plan
2. 只把 plan 编译成可执行任务
3. testing reviewer 负责生成测试任务
4. api-contract reviewer 负责接口联调任务
5. deployment verification 负责发布检查任务
```

### 17.6 `spec-skill-audit`

默认候选：

```text
spec-agent-native-reviewer
spec-project-standards-reviewer
spec-cli-readiness-reviewer
spec-cli-agent-readiness-reviewer
spec-code-simplicity-reviewer
spec-security-sentinel
```

关键改造：

```text
1. 审查 skill 是否职责膨胀
2. 审查 agent 是否越权
3. 审查 runtime delivery 是否漂移
4. 审查 prompt 是否引发上下文膨胀
5. 审查是否需要合并或废弃重复 agent
```

---

## 18. 质量保障与节点质量提升

ECC 集成的成功标准不是“导入多少能力”，而是提升 spec-first 每个 workflow 节点的产物质量，并且不破坏现有治理边界。

### 18.1 质量目标

V1 必须让 agent 专家团队在以下方面产生可观察增益：

| 质量目标 | 具体含义 | 主要机制 |
| --- | --- | --- |
| 更准的专家选择 | 每个 workflow 只调用与当前风险相关的专家 | registry + router reason + expert limit |
| 更强的证据绑定 | finding 必须指向文件、diff、plan、graph、standards 或明确 `not_reviewed` | context pack + finding schema |
| 更少的专家噪音 | 重复、泛泛、越界、无证据建议会被 synthesis 去噪 | Skill Synthesis |
| 更稳的流程边界 | agent 不决定 workflow、不写 repo-profile、不输出 final verdict | forbidden actions + Skill-only verdict |
| 更高的节点产物质量 | brainstorm、plan、tasks、work、review、compound 都有对应专家增强点 | node quality matrix |
| 更好的知识沉淀 | 可复用经验进入 compound / standards preview，而不是散落在对话里 | finding -> standards candidate -> preview-first |

### 18.2 Node Quality Matrix

| spec-first 节点 | ECC / expert 增强点 | 质量提升目标 | 不允许的退化 |
| --- | --- | --- | --- |
| Codebase | `spec-repo-research-analyst`, `spec-git-history-analyzer`, ECC code-tour / repo-scan 类方法论 | 更快识别真实模块边界、历史原因和复用候选 | 不得把 stale graph 或猜测当成事实 |
| Graph | graph-aware repo/API/architecture/testing experts | 让 plan/review 知道影响面、调用者和复用路径 | graph 不可用时不得输出高置信影响面 |
| Spec / Brainstorm | product、scope、flow lens，吸收 ECC product-lens / council 类 rubric | 明确用户、场景、边界、反目标和开放问题 | 不得过早进入架构实现 |
| Doc Review | coherence、feasibility、scope、adversarial、安全方案 lens | 在进入 plan 前消除矛盾、范围漂移和不可落地假设 | 不得用专家数量替代审查质量 |
| Plan | architecture、repo research、API、data、安全、simplicity experts | 每个关键技术决策有证据、替代方案、风险和测试策略 | 不得凭 ECC best practice 覆盖本仓库事实 |
| Tasks | testing、API contract、deployment verification experts | 任务包可执行、可验证、能暴露依赖和并行边界 | 不得重新设计 plan 或扩大 scope |
| Work | repo research、framework docs、testing、simplicity experts，最多 1-2 个 | 实现阶段按需补上下文，减少卡点和过度设计 | 不得把 work 变成现场重规划 |
| Debug | correctness、reliability、history、data/security experts | 更快定位根因、复现路径和回归测试 | 不得跳过重现和证据链 |
| Code Review | correctness、testing、maintainability、security、API/data/perf 条件专家 | findings 更准确、更少重复、severity 更可解释 | 不得让 agent 直接给最终 merge verdict |
| App Audit | product、flow、design、iOS/mobile、API、analytics/i18n experts | 产品、设计、代码、路由、埋点和 i18n 一致性更完整 | 不得在缺证据时给 full-pass |
| Skill Audit | agent-native、standards、CLI readiness、security、simplicity experts | 防止 skill/agent 越权、重复、上下文膨胀和 runtime drift | 不得依赖当前会话缓存验证新 prompt |
| Compound / Knowledge | learnings、pattern、standards experts | 把有效 finding 转为可复用经验或 standards candidate | 不得 silent write confirmed standards |

### 18.3 Quality Gates

V1 每个阶段必须通过对应 gate，失败时不得继续扩大 ECC 集成范围。

| Gate | 检查内容 | 失败处理 |
| --- | --- | --- |
| Source Evidence Gate | ECC 清单数量与 `/Users/kuang/xiaobu/everything-claude-code` source 可追溯 | 标记清单 stale，重新生成或回读 source |
| Workflow Compatibility Gate | V1 改造不得覆盖现有 persona catalog、workflow-native schema 或 headless/synthesis 输出 | 阻断该改造进入 prompt/runtime，先补 adapter |
| Overlap Gate | direct_match 不新增 agent，native 不被 ECC 覆盖，profile 不进默认路由 | 阻断该 entry 进入 registry |
| Rubric Extraction Gate | 每个 ECC skill 采纳项必须有 source、target、dedupe、quality_node 和 adoption_action | 不写入 agent prompt，只保留 candidate |
| Naming Gate | canonical_id 产品化，个人名只保留在 `origin_aliases` | 阻断 runtimeName 推广 |
| Router Gate | 每个 selected agent 必须有 reason、priority、budget，且不超过 workflow 上限 | 降级为 checklist mode 或减少专家 |
| Context Gate | 只给 selected experts 构造 context pack | 不加载全量 ECC skills / agents |
| Finding Compatibility Gate | 保留 workflow-native schema，并能生成 Finding Core compatibility view | 不更新 reviewer prompt，只补 adapter 草案 |
| Finding Evidence Gate | finding 必须有 severity、confidence、evidence、recommendation、not_reviewed 或 native 等价字段 | 降级为 advisory 或 reject |
| Synthesis Gate | 最终 verdict 只能由 Skill 输出，必须说明 adopt/reject/downgrade | 不写 durable final report |
| Standards Gate | standards 写入必须 preview-first + human confirmation | 只生成 standards candidate |
| Capability Plugin Gate | capability pack 必须 pack-gated、source-attributed、workflow-compatible、doctor-able/clean-able 设计明确 | 只能保留 preview，不进入 runtime |
| Opt-in Gate | 研发向 optional pack、style profile、missing_in_spec_first 能力必须显式启用；excluded domain references 不进入能力包 | 默认 disabled / checklist mode |
| Host Compatibility Gate | 每个 pack 声明 Claude / Codex 支持度、fallback 和 unsupported reason | host 不支持时降级为 checklist/reference |
| Source Freshness Gate | 每个 ECC 采纳项声明 source file、revision、loaded_from、freshness 和 runtime_cached | freshness 不足时只保留 candidate |
| Command Idea Gate | ECC commands 只进入 idea matrix，不进入 command registry 或 runtime command surface | 阻断 `/ecc:*`、`$ecc-*` 或 runtime command 生成 |
| Runtime Merge Gate | 未来 runtime delivery 必须 managed marker merge、add-only config merge、preview-first | 阻断 silent overwrite 用户配置或 generated runtime |
| Runtime Gate | 未显式启用 capability pack 时不得生成 ECC runtime asset | doctor 报告 residual / drift |
| Fresh-source Eval Gate | agent/skill prose 改动后必须用当前磁盘 source 做 fresh-source eval | 记录未执行原因，不能声称通过 |

### 18.4 质量度量

V1 不要求一开始建立完整指标平台，但必须在 pilot 中记录这些可人工审查的指标：

```text
router_selected_count:
  每次 workflow 选择了几个专家，是否超过上限

router_reason_coverage:
  candidate / selected / skipped 是否都有可解释 reason

finding_evidence_rate:
  findings 中包含明确 evidence 的比例

finding_dedupe_rate:
  synthesis 合并了多少重复 finding

finding_rejection_rate:
  synthesis 拒绝了多少越界 / 无证据 / 不相关建议

severity_adjustment_count:
  synthesis 升级、降级 severity 的次数和原因

node_artifact_delta:
  plan / review / tasks 相比无专家治理版本新增了哪些高价值证据、风险或测试场景

token_budget_observation:
  是否因为专家选择过多或 context pack 过大导致上下文膨胀
```

### 18.5 Pilot 场景

质量验证优先从小样本 dogfood 开始：

| Pilot | 输入 | 目标 |
| --- | --- | --- |
| Code-review pilot | 一组 auth/API/data/UI 代表性 diff | 验证 router、finding schema、synthesis 去噪和 severity 调整 |
| Plan pilot | 一个涉及 API + data + frontend 的计划文档 | 验证 architecture/repo/API/security/simplicity experts 是否提升 plan 证据质量 |
| Doc-review pilot | 一个多需求或高风险 PRD/plan | 验证 coherence/scope/feasibility/adversarial 是否减少进入 plan 的歧义 |
| Skill-audit pilot | 一个包含越权或上下文膨胀风险的 SKILL.md | 验证 agent-native/standards/security/simplicity 对系统自我治理的价值 |

Pilot 完成前，不进入：

```text
完整动态 router CLI
runtime delivery
P1/P2 大规模专家包
ECC-derived optional lens 批量生成
```

### 18.6 质量红线

以下情况视为集成失败，必须回滚或降级：

```text
新增重复专家而不是增强现有专家
ECC command/hook 进入 spec-first 默认入口
agent finding 没有 evidence 却影响 final verdict
style profile 输出 blocker
graph stale 仍被当作 primary evidence
router 为低风险任务选择重专家
context pack 把 ECC 全量 skill/agent 文本塞给专家
agent 修改 repo-profile 或 durable artifact
Skill Synthesis 只拼接专家长文，没有裁判和降噪
```

---

## 19. 命名治理

### 19.1 保留 source 文件

V1 不批量重命名 `agents/*.agent.md`。

推荐策略：

```text
source_file 保持不动
registry canonical_id 使用通用专家名
runtime_name 后续渐进统一
origin_aliases 记录历史来源
```

示例：

```yaml
source_file: agents/spec-kieran-typescript-reviewer.agent.md
canonical_id: typescript-expert
runtime_name: spec-typescript-expert
origin_aliases:
  - spec-kieran-typescript-reviewer
  - ce-kieran-typescript-reviewer
```

### 19.2 个人名处理

| 类型 | 处理 |
| --- | --- |
| 能力通用 | 泛化为技术专家 |
| 风格强 | 降级为 optional profile |
| 历史保留 | `origin_aliases` 记录来源 |
| runtime 展示 | 不展示个人名 |

---

## 20. 开发任务拆分

### G0-G6.5 本地生成命令

G0-G6.5 的 preview artifacts 由 source 脚本生成，不手写 runtime：

```bash
npm run docs:ecc-governance
```

该命令只写入：

```text
docs/02-架构设计/ECC集成/generated/
```

它不生成 `/ecc:*`、`$ecc-*`、`.claude/`、`.codex/`、`.agents/skills/` 或任何 runtime command registry entry。

### G0: 盘点当前 Agent

目标：

```text
生成当前 spec-first agents 的事实清单。
```

输入：

```text
agents/*.agent.md
```

输出：

```text
docs/02-架构设计/ECC集成/generated/current-agent-inventory.md
docs/02-架构设计/ECC集成/generated/current-agent-inventory.json
```

验证：

```text
agents 目录所有 .agent.md 都能被扫描
每个 agent 有唯一 id
每个 agent 能归入一个 pack 或明确 no-pack reason
个人名 agent 被标记为 rename_generic 或 style_profile
```

### G1: 建立 ECC Overlap Matrix

目标：

```text
把 ECC agent 与当前 spec-first agent 做一一对应。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/ecc-agent-overlap-matrix.md
docs/02-架构设计/ECC集成/generated/ecc-agent-overlap-matrix.json
```

验证：

```text
ECC P0 agent 必须有 spec-first 对应项或 missing reason
direct_match 不允许生成新 agent
style_profile 不允许进入默认 P0/P1
spec_first_native 不允许被 ECC 覆盖
```

### G1.5: 建立 ECC Rubric Extraction Matrix

目标：

```text
把 ECC skills 中可迁移的方法论、checklist 和 failure mode 映射到现有 spec-first agent / workflow。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/ecc-rubric-extraction-matrix.md
docs/02-架构设计/ECC集成/generated/ecc-rubric-extraction-matrix.json
```

验证：

```text
每个采纳项有 ecc_source_file、target_surface、quality_node、rubric_type
每个采纳项有 source_revision、loaded_from、freshness、runtime_cached
每个采纳项说明是否与现有规则重复
每个 rejected / deferred 项有 not_adopted_reason
首批只覆盖 security/testing/API/data/frontend/architecture 高价值样本
不把 182 个 ECC skills 文本全量注入 context pack
```

### G1.6: 建立 ECC Command Idea Matrix

目标：

```text
把 68 个 ECC commands 中的流程思想映射到现有 spec-first workflow，不生成新命令入口。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/ecc-command-idea-matrix.md
docs/02-架构设计/ECC集成/generated/ecc-command-idea-matrix.json
```

验证：

```text
每个 command idea 有 ecc_command、target_workflow、idea_type、adoption_action
adoption_action 只能是 enhance_existing_workflow、reference_only、rejected
不得生成 /ecc:*、$ecc-*、templates/commands/ecc-* 或 runtime command registry entry
Codex command prompts 只能作为 legacy command prompt reference，不视为 slash command parity
```

### G2: 重组 Agent Packs

目标：

```text
从散装 agent 变成专家包。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/agent-packs.md
docs/02-架构设计/ECC集成/generated/agent-packs.json
```

验证：

```text
每个 P0 agent 至少归入一个 pack
研发向 P2 optional pack 与 P3 style / experimental pack 默认不启用
excluded domain references 不进入能力包
style profile 不进入 core pack
```

### G3: 补 Agent Registry Metadata

目标：

```text
每个 agent 都有统一元数据。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/agent-registry.json
```

验证：

```text
每个 registry entry 有 source_file、canonical_id、pack、priority
每个 routable agent 有 allowed_workflows 和 forbidden_actions
每个 synthesis_ready agent 声明 output_schema
registry preview 有 source_revision、worktree_dirty、generated_from、stale_policy
registry 与 source 冲突时 source wins，registry 标记 stale
```

### G4: Router Candidate Facts

目标：

```text
让 workflow 能按需选择专家。
```

V1 先做文档策略，不写完整 CLI，不输出脚本级 `selected_agents`：

```text
1. Read Agent Registry
2. Identify risk signals
3. Emit candidate_agents with reason_code / budget_hint
4. Explain excluded_by_policy / degraded mode
5. Skill selects final agents
6. Build context pack for selected agents only
```

隐式 router 只能作为 advisory facts。任何由文件名、risk signal 或 provider metadata 触发的专家，都必须经过 Skill 语义裁判后才可成为 selected expert。

后续可进入代码：

```text
src/cli/agent-router/registry-loader.js
src/cli/agent-router/workflow-router.js
src/cli/agent-router/file-signal-router.js
src/cli/agent-router/risk-signal-router.js
src/cli/agent-router/budget-policy.js
src/cli/agent-router/route.js
```

### G5: Finding Schema Compatibility

目标：

```text
所有 Agent 输出可被合成，同时不破坏现有 workflow-native schema。
```

优先改造：

```text
skills/spec-code-review/references/findings-schema.json compatibility view
skills/spec-doc-review/references/findings-schema.json compatibility view
spec-code-review synthesis metrics
spec-doc-review synthesis metrics
plan deepening finding summary adapter
```

Agent prompt 修改必须后置到 adapter pilot 通过之后。确需更新时，末尾增加的是 native schema 约束，不是替换为新 schema：

```markdown
Required Output

Return findings using the workflow-native schema provided by the orchestrator.

Each finding must include:

- severity
- confidence
- title
- evidence
- impact
- recommendation
- not_reviewed

If this workflow already has a stricter schema, follow the stricter workflow-native schema.
```

### G6: Skill Synthesis

优先改造顺序：

```text
1. spec-code-review
2. spec-plan
3. spec-doc-review
4. spec-write-tasks
5. spec-skill-audit
6. spec-app-consistency-audit
7. spec-compound
```

原因：

```text
code-review 最容易验证专家合成价值
plan 最能体现 graph/evidence
doc-review 最能体现 scope/coherence
skill-audit 用来防止系统继续膨胀
```

### G6.5: Host Compatibility 与 Runtime Merge Policy Preview

目标：

```text
把 capability pack 的 Claude / Codex 支持度、fallback 和未来 runtime 合并策略写成 preview contract。
```

输出：

```text
docs/02-架构设计/ECC集成/generated/capability-host-compatibility.md
docs/02-架构设计/ECC集成/generated/capability-runtime-merge-policy.md
```

验证：

```text
每个 pack 声明 claude/codex 支持度和 unsupported_reason_code
host 不支持时只能 reference_only 或 checklist_only
未来写入 AGENTS.md / CLAUDE.md 必须 managed marker merge
未来写入 host config 必须 add-only merge + preview diff
不得 silent overwrite 用户配置或 generated runtime
```

---

## 21. 测试策略

### 21.1 Inventory 测试

```text
agents 目录所有 .agent.md 都能被扫描
每个 agent 有唯一 id
frontmatter name 与 source file 可追踪
每个 agent 能分类到 pack 或明确 no-pack reason
个人名 agent 被标记为 rename_generic 或 style_profile
```

### 21.2 Overlap Matrix 测试

```text
ECC P0 agent 必须有 spec-first 对应项或 missing reason
direct_match 不允许生成新 agent
style_profile 不允许进入默认 P0/P1
spec_first_native 不允许被 ECC 覆盖
```

### 21.3 Rubric Extraction 测试

```text
每个 ECC skill 采纳项必须有 source_file 和 target_surface
每个采纳项必须说明增强哪个 spec-first 节点
与现有 agent / workflow rubric 重复时必须标注 dedupe_against_existing
没有 evidence 的 rubric 不进入 agent prompt
首批 extraction 不超过高价值样本范围
```

### 21.4 Workflow Compatibility 测试

```text
spec-code-review 的 persona-catalog always-on reviewer 不被 V1 上限覆盖
spec-code-review 的 native findings-schema 字段不被 Finding Core 替换
spec-doc-review 的 native findings-schema 字段不被 Finding Core 替换
spec-plan deepening 的 section-to-agent mapping 不被 router policy 重写
registry preview 与 workflow catalog 冲突时 source wins
```

### 21.5 Router 测试

| 场景 | 预期专家 |
| --- | --- |
| 修改 `src/auth/session.ts` | security、correctness、testing |
| 修改 `openapi.yaml` | api-contract、testing |
| 修改 `migrations/*.sql` | migration-safety、data-integrity |
| 修改 `skills/spec-plan/SKILL.md` | agent-native、coherence、simplicity |
| 修改 `.tsx` UI 状态 | frontend-async-race、testing、design-lens |
| 普通 docs 修改 | coherence，最多再加 scope |
| 低风险 typo | 不调用重专家 |

### 21.6 Synthesis 测试

```text
多个 agent 指向同一问题时合并
证据不足 finding 降级
越界建议被拒绝
confirmed standards 可以提升 severity
style profile 不得产生 blocker
保留 native schema 的 autofix_class / owner / finding_type / deferred_questions
Finding Core compatibility view 不反向改写 native finding
```

### 21.7 Fresh-source eval

当修改 `agents/*.agent.md` 或 `skills/*/SKILL.md` prose 后，必须使用 fresh-source eval 检查当前磁盘 source，而不是依赖当前会话缓存的 agent/skill 定义。

检查清单参考：

```text
docs/contracts/workflows/fresh-source-eval-checklist.md
```

如果宿主缺少 dispatch primitive、runtime 无法调用，或用户显式禁用 helper agents，必须记录未执行原因，不能声称通过；不得把“没有二次授权确认”当作未执行原因。

### 21.8 Node Quality Gate 测试

```text
brainstorm pilot 能说明 product/scope/flow 专家的增益
plan pilot 中每个关键决策都有 evidence / risk / test strategy
code-review pilot 中每个 selected agent 都有 reason 和 budget
candidate router 不为脚本输出 selected_agents
findings 中无 evidence 的条目不能进入 blocking list
synthesis report 必须记录 adopt / reject / downgrade
style profile finding 不得产生 blocker
stale graph 场景必须触发 confidence 降级
low-risk typo 场景不得选择重专家
```

### 21.9 50+ 轮质量自审清单

本方案修订按质量优先执行以下 50+ 轮自审。每一轮都必须能映射到文档中的明确约束、gate、schema、artifact 或后续验证项。

| 轮次 | 审查问题 | 结论 |
| ---: | --- | --- |
| 1 | 是否仍把 ECC 当作导入对象 | 已收敛为能力样本和 rubric 来源 |
| 2 | 是否新增 `/ecc:*`、`$ecc-*` 或 ECC command 入口 | 明确禁止 |
| 3 | 是否默认导入 ECC hooks | 明确禁止 |
| 4 | 是否默认新增 ECC agents | direct_match 禁止新增 |
| 5 | 是否保留 spec-first workflow 主权 | Skill owns workflow 明确保留 |
| 6 | 是否遵守 Light contract | G0-G6.5 只做最小 schema / adapter / preview |
| 7 | 是否遵守 Scripts prepare, LLM decides | candidate router 与 Skill selection 已分层 |
| 8 | 是否把 router 做成规则引擎 | 脚本只输出 candidate facts |
| 9 | 是否让脚本输出最终 selected_agents | 已禁止 |
| 10 | 是否保留现有 code-review persona catalog | Compatibility baseline 已纳入 |
| 11 | 是否保留现有 doc-review schema | Finding compatibility 已纳入 |
| 12 | 是否保留 plan deepening section mapping | Compatibility baseline 已纳入 |
| 13 | 是否用新 schema 覆盖 native schema | 改为 Finding Core compatibility view |
| 14 | 是否保留 code-review `autofix_class` | Synthesis policy 明确保留 |
| 15 | 是否保留 code-review `owner` | Synthesis policy 明确保留 |
| 16 | 是否保留 doc-review `finding_type` | Synthesis policy 明确保留 |
| 17 | 是否保留 doc-review deferred questions | Synthesis policy 明确保留 |
| 18 | registry 是否成为第二真相源 | G0-G3 registry 定义为 preview snapshot |
| 19 | registry 是否有 source provenance | 增加 generated_from / revision / stale_policy |
| 20 | registry/source 冲突如何处理 | source wins，registry stale |
| 21 | context pack 是否携带 freshness | 增加 freshness 字段 |
| 22 | context pack 是否携带 trust_level | 增加 trust_level 字段 |
| 23 | context pack 是否定义 allowed_use | 增加 allowed_use 字段 |
| 24 | stale graph 是否可能产生高置信 finding | 限定为 orientation_only |
| 25 | confirmed standards 与 advisory findings 是否区分 | standards flow 与 trust_level 已区分 |
| 26 | ECC skills 吸收是否可追溯 | 新增 rubric extraction matrix |
| 27 | 182 个 ECC skills 是否会全量注入 prompt | 明确首批高价值样本，禁止全量注入 |
| 28 | direct_match 是否只增强现有 agent | overlap gate 已约束 |
| 29 | partial_match 是否处理个人名污染 | canonical_id / origin_aliases 已约束 |
| 30 | style profile 是否可能产生 blocker | 明确禁止 |
| 31 | spec_first_native 是否会被 ECC 覆盖 | native gate 已约束 |
| 32 | P0/P1/P2 与 P3 style / experimental 是否变成默认 runtime delivery | 保持 pack preview 与 opt-in 边界，excluded domain references 不进入 runtime delivery |
| 33 | code-review 默认上限是否覆盖 always-on reviewer | 改为增量候选上限 |
| 34 | host dispatch 是否因 Codex 默认降级 | 改为 capability / safety gate |
| 35 | runtime mirror 是否被手改 | 明确禁止 |
| 36 | runtime delivery 是否提前进入 V1 | Pilot 通过前禁止 |
| 37 | standards 是否 silent write | preview-first + human confirmation |
| 38 | evidence budget 是否防止 token 膨胀 | context budget 和 candidate cap 已定义 |
| 39 | synthesis 是否只是拼接专家长文 | 定义 merge/dedupe/rank/downgrade/reject/adopt |
| 40 | severity 是否可解释 | 保留 native confidence anchors 和 mapping |
| 41 | 无 evidence finding 是否能进 blocking | Finding Evidence Gate 降级或 reject |
| 42 | low-risk typo 是否触发重专家 | Router 测试覆盖 |
| 43 | pilot 是否覆盖 code-review | 已覆盖 |
| 44 | pilot 是否覆盖 plan | 已覆盖 |
| 45 | pilot 是否覆盖 doc-review | 已覆盖 |
| 46 | pilot 是否覆盖 skill-audit | 已覆盖 |
| 47 | roadmap 是否与 V1 交付混淆 | 改为 Document Version / G gates / R roadmap |
| 48 | 最小落地顺序是否包含 rubric extraction | 已加入 G1.5 |
| 49 | 专家能力是否支持插件化与插拔式集成 | 新增 capability provider / capability pack / activation lifecycle |
| 50 | 插件化是否会变成 ECC 整包安装 | 明确 provider source 只进 inventory/rubric，runtime delivery 必须 pack-gated |
| 51 | future plugin runtime 是否具备 doctor/clean/state 边界 | R9 与 Capability Plugin Gate 明确要求 |
| 52 | 验收标准是否覆盖 schema/registry/router/插件化关键风险 | 已补齐 |
| 53 | 最终原则是否仍指向项目目标 | 保持 Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge 的专家治理增强 |
| 54 | 业务运营、媒体增长、金融、物流、医疗、web3 是否被误列为 optional pack | 已收敛为 excluded domain references，不进入 capability pack、router 或 runtime roadmap |
| 55 | 顶部交付边界是否仍停留在旧 G0-G6 | 已统一为 G0-G6.5 当前可执行治理闭环 |
| 56 | Future Roadmap 是否仍停留在旧 R1-R7 | 已统一为 R1-R9 长期能力演进 |
| 57 | 当前开发基准是否遗漏 G1.5 rubric extraction | 已补入 G1.5 作为先期治理输入 |
| 58 | 当前开发基准是否遗漏 G1.6 command idea matrix | 已补入 G1.6，且明确不生成命令入口 |
| 59 | 当前开发基准是否遗漏 G6.5 host/runtime merge preview | 已补入 G6.5，并保持 preview-only |
| 60 | Staged rollout 是否仍引用旧 G0-G6 | 已统一为 G0-G6.5 gate + pilot |
| 61 | Runtime delivery 前置条件是否误写 R8 | 已收敛为 R9 之后才能进入 runtime capability |
| 62 | 显式 workflow 入口是否只写 Codex `$spec-*` | 已改为 Claude `/spec:*` 与 Codex `$spec-*` 双宿主口径 |
| 63 | 包集成说明是否同步双宿主显式入口 | 已同步为 `显式 spec-first workflow（Claude: /spec:*；Codex: $spec-*）` |
| 64 | source freshness schema 是否缺少 `freshness` 字段 | 已在 capability pack preview 示例中补齐 |
| 65 | source freshness 验证规则是否与 schema 示例一致 | 已统一 `source_file/source_revision/loaded_from/runtime_cached/freshness` 字段 |
| 66 | command idea matrix 是否可能被理解为 command registry | 已明确 adoption_action 只能是 enhance_existing_workflow / reference_only / rejected |
| 67 | Codex prompt 文件是否可能被误认为 slash command parity | 已明确只能作为 legacy command prompt reference |
| 68 | Claude 原生命令面是否会被误用为 ECC command 导入许可 | 包集成说明已明确禁止该推广 |
| 69 | Claude / Codex host compatibility 是否成为必填 contract | Capability Pack preview 与 Gate 均已要求 host_support |
| 70 | host unsupported 时是否会伪装成可执行能力 | 已限定为 reference_only / checklist_only 降级 |
| 71 | runtime merge 是否会 silent overwrite 用户配置 | Runtime Merge Gate 已要求 managed marker merge、add-only merge、preview-first |
| 72 | AGENTS.md / CLAUDE.md 写入策略是否同等覆盖 | G6.5 明确两者未来写入必须 managed marker merge |
| 73 | host config 写入是否有 add-only 和 preview diff | G6.5 已补 add-only merge + preview diff |
| 74 | capability execution plane 是否同时覆盖 Claude 与 Codex | 已扩展为双宿主六层执行平面 |
| 75 | generated runtime 是否可能反向成为 source | Execution Plane 与 Runtime Gate 均明确禁止 |
| 76 | 隐式 router 是否可能绕过 Skill 选择专家 | G4 与 Activation Policy 均声明 implicit candidate 仅 advisory |
| 77 | selected_agents 是否仍被脚本拥有 | 保持 Skill-owned decision，不由脚本输出 |
| 78 | G6.5 是否误入 runtime 实现范围 | 已定位为 preview contract，不改 runtime |
| 79 | package 说明与技术方案的 gate 顺序是否同步 | G1.6、G3 host metadata、G6.5 已同步 |
| 80 | excluded domain references 是否仍可能进入任何 capability pack | 包说明已改为不进入任何 capability pack |
| 81 | P3 style / experimental 是否和领域能力混淆 | 已拆分为 P3 style/experimental references 与 excluded domain references |
| 82 | source freshness 是否区分 provider source 与 runtime cache | 字段 `loaded_from` 与 `runtime_cached` 已保留 |
| 83 | 双宿主 dispatch primitive 差异是否影响 workflow 主权 | Host Compatibility Matrix 与 dispatch 边界已覆盖 |
| 84 | 本轮三项审查发现是否全部闭环 | 阶段边界、双宿主入口、source freshness 三项均已修复 |

---

## 22. 风险矩阵

| 风险 | 表现 | 缓解 |
| --- | --- | --- |
| 重复 agent | 同一能力多个专家同时输出 | overlap matrix + direct_match 不新增 |
| 命名污染 | kieran/dhh/ankane 等个人名进入产品主语义 | canonical_id 泛化，个人名放 origin_aliases |
| token 膨胀 | 每次 review 调 10+ agent | Router 上限 + evidence budget |
| 专家越权 | agent 写文件或改 repo-profile | forbidden_actions + Skill-only write |
| finding 不可合成 | 输出长文无法结构化 | workflow-native schema + Finding Core adapter |
| schema contract 冲突 | 新统一 schema 破坏现有 code-review/doc-review 输出 | workflow-native schema wins + Finding Core adapter |
| registry 多真相源 | registry 与 agent source 或 workflow catalog 漂移 | G0-G3 registry 仅 preview snapshot，source wins |
| graph 假证据 | graph 不可用还输出架构影响 | graph readiness + degraded mode |
| 规则硬编码 | Router 变复杂 rule engine | Scripts prepare, LLM decides |
| 终态过大 | 一次性做 Agent Platform | G0-G3 先做治理，不急 runtime |
| 破坏现有 workflow | 引入新入口或新命令 | 不新增 `/ecc:*`，保留 `/spec:*` 和 `$spec-*` |
| runtime 污染 | 未启用 capability 却生成 runtime asset | pack-gated delivery + doctor/clean |
| 插件整包污染 | 把 ECC 原始 plugin 当成 spec-first capability plugin 安装 | provider source 只进 inventory/rubric，runtime delivery 必须 pack-gated |
| 插拔不可逆 | 启用 optional pack 后无法清理 runtime residual | Future runtime delivery 必须 state-aware、doctor-able、clean-able |
| 能力无增益 | 集成后只是多输出长文，没有提升节点产物质量 | node quality matrix + pilot quality gates |

---

## 23. V1 验收标准

V1 完成时应满足：

```text
1. 有当前 51 个 source agent 的 inventory
2. 有 ECC overlap matrix
3. direct_match 明确不新增 agent
4. partial_match 有 canonical_id 和 origin_aliases
5. style profile 不进入默认 P0/P1
6. spec_first_native 不被 ECC 覆盖
7. P0/P1/P2 研发能力包、P3 style / experimental references 与 excluded domain references 定义完成
8. ECC rubric extraction matrix 草案完成
9. agent registry preview schema 草案完成，且明确 source wins / stale policy
10. router candidate facts schema 草案完成，且不让脚本输出最终 selected_agents
11. context pack schema 草案完成，包含 provenance / freshness / trust_level / allowed_use
12. finding schema compatibility 草案完成，保留 code-review / doc-review native schema
13. synthesis policy 完成，并说明 native schema 字段如何保留
14. code-review / plan / doc-review 的 compatibility 接入策略完成
15. capability pack preview contract 完成，明确 pack-gated / opt-in / degrade / future doctor-clean-state
16. node quality matrix 完成，并覆盖 brainstorm / plan / tasks / work / review / compound
17. quality gates 完成，能阻断重复、无证据、越权、stale graph、schema 冲突、registry 漂移、插件整包污染和 context 膨胀
18. pilot 场景完成，至少覆盖 code-review / plan / doc-review / skill-audit
19. 不修改 generated runtime
20. 不新增 ECC commands/hooks/agents
```

---

## 24. 路线图

### R1: Governance Preview

```text
目标：搞清楚当前有什么、ECC 重叠什么
产物：
  current-agent-inventory.md
  current-agent-inventory.json
  ecc-agent-overlap-matrix.md
  ecc-agent-overlap-matrix.json
  ecc-rubric-extraction-matrix.md
  ecc-rubric-extraction-matrix.json
  ecc-command-idea-matrix.md
  ecc-command-idea-matrix.json
  agent-packs.md
  agent-packs.json
```

### R2: Registry 与命名治理

```text
目标：让 agent 有身份、有来源、有边界
产物：
  src/cli/contracts/agent-registry/agent-registry.schema.json
  src/cli/contracts/agent-registry/agent-packs.schema.json
  src/cli/contracts/agent-registry/routing-policy.schema.json
  src/cli/contracts/agent-registry/finding.schema.json
  docs/02-架构设计/ECC集成/generated/agent-registry.json
  docs/02-架构设计/ECC集成/generated/agent-packs.json
  tests/unit/ecc-agent-registry-contracts.test.js
```

状态：已进入 V2 source contract。V2 只把 registry / packs / router candidate / finding compatibility 的机器可读形状升级为正式 contract，并让对应 generated artifacts 声明 `$schema`。V2 仍不交付 runtime capability pack，不修改 `.claude/`、`.codex/`、`.agents/skills/`，不新增 `/ecc:*` 或 `$ecc-*`。

V2 对 R3/R4 只做 schema 准备：`routing-policy.schema.json` 和 `finding.schema.json` 约束 preview artifact 形状，但不让脚本选择最终专家，也不替换 workflow-native finding schema。实际 workflow 接入仍属于 R3/R5。

### R3: Router Candidate Policy

```text
目标：让 skill 可以基于候选 facts 动态选择专家
产物：
  docs/02-架构设计/ECC集成/generated/router-candidate-policy.json
  docs/02-架构设计/ECC集成/generated/router-candidate-policy.md
  src/cli/contracts/agent-registry/router-candidate-input.schema.json
  src/cli/contracts/agent-registry/router-candidate-output.schema.json
  scripts/route-ecc-agent-candidates.js
  tests/unit/ecc-router-candidate-contracts.test.js
```

状态：已进入 V3 router candidate preview。V3 只把 `workflow`、`changed_files`、`risk_signals` 和现有 governance preview artifacts 投影为 advisory `candidate_agents`、`reason_code`、`budget_hint`、`excluded_by_policy` 和 `requires_skill_decision: true`。

V3 明确不输出 `selected_agents`、`final_verdict` 或 confirmed standards 写入字段；不修改 `.claude/`、`.codex/`、`.agents/skills/`；不新增 `/ecc:*` 或 `$ecc-*`；不替换 `spec-code-review`、`spec-plan`、`spec-doc-review` 等 workflow-native reviewer catalog。Skill 仍基于候选事实、用户意图、现有 workflow contract 和可用证据做最终专家选择与 synthesis。

当前 V3 验证覆盖：

```text
npx jest tests/unit/ecc-router-candidate-contracts.test.js tests/unit/ecc-agent-registry-contracts.test.js --runInBand
```

### R4: Finding Schema Compatibility

```text
目标：让专家输出可合成，同时保留 workflow-native schema
产物：
  src/cli/contracts/agent-registry/finding-core.schema.json
  scripts/project-ecc-finding-core.js
  tests/unit/ecc-finding-core-contracts.test.js
  native-schema-adapter notes
```

状态：已进入 V4 Finding Core projection。V4 只把 `spec-code-review` / `spec-doc-review` 的 workflow-native reviewer JSON 只读投影为 `spec-first.finding-core-projection.v1` compatibility view，用于后续 synthesis、metrics 和 pilot 观察。

V4 明确不替换 `skills/spec-code-review/references/findings-schema.json` 或 `skills/spec-doc-review/references/findings-schema.json`；不反向改写 native finding；不修改 reviewer prompt；不输出 `final_verdict`、`selected_agents` 或 confirmed standards 写入；不写 `.claude/`、`.codex/`、`.agents/skills/`。`severity_display` 与 `confidence_display` 只是 deterministic display labels，最终 blocking / accepted / rejected 仍由 Skill Synthesis 判断。

当前 V4 验证覆盖：

```text
npx jest tests/unit/ecc-finding-core-contracts.test.js tests/unit/ecc-agent-registry-contracts.test.js --runInBand
npm run typecheck
```

### R5: Skill Synthesis

```text
目标：让最终裁判回到 Skill
优先改：
  spec-code-review
  spec-plan
  spec-doc-review
产物：
  src/cli/contracts/agent-registry/synthesis-brief.schema.json
  scripts/prepare-ecc-synthesis-brief.js
  tests/unit/ecc-synthesis-brief-contracts.test.js
```

状态：已进入 V5 Skill Synthesis brief pilot。V5 消费 V4 `finding_core` compatibility view，并可选消费 V3 router candidate facts，输出 `spec-first.synthesis-brief.v1` 只读 briefing facts。该 brief 只提供 merge candidate、rank bucket、degraded / pre-existing / verification-required / missing-recommendation 等 synthesis hints，以及必须由 Skill 填写的 decision slots。

V5 明确不输出 `final_verdict`、`selected_agents`、confirmed standards 写入或最终 adopt / reject / downgrade 结论；不修改 `spec-code-review` / `spec-doc-review` reviewer prompt；不替换 workflow-native schema；不写 `.claude/`、`.codex/`、`.agents/skills/`。脚本负责确定性事实整理，Skill Synthesis 仍负责语义裁判。

当前 V5 验证覆盖：

```text
npx jest tests/unit/ecc-synthesis-brief-contracts.test.js tests/unit/ecc-finding-core-contracts.test.js tests/unit/ecc-router-candidate-contracts.test.js --runInBand
npm run typecheck
```

### R6: Graph-aware Experts

```text
目标：architecture/repo/api/reuse/testing 专家消费 graph facts
要求：
  graph 不可用时 confidence 降级
```

状态：已进入 V6 Graph-aware Expert brief pilot。V6 消费 canonical graph/readiness artifacts：

```text
.spec-first/graph/graph-facts.json
.spec-first/graph/provider-status.json
.spec-first/impact/bootstrap-impact-capabilities.json
```

并输出：

```text
src/cli/contracts/agent-registry/graph-expert-brief.schema.json
scripts/prepare-ecc-graph-expert-brief.js
tests/unit/ecc-graph-expert-brief-contracts.test.js
```

V6 只负责把 graph freshness、provider readiness、capability support、confidence ceiling、required disclosures、fallback guidance 和 allowed graph artifact use 编译成专家可读 briefing facts。

V6 明确不做：

```text
不调用 GitNexus / code-review-graph provider 命令
不写 .spec-first/graph/* 或 .spec-first/impact/*
不把 live MCP 成功回写为 query_ready=true
不输出 selected_agents
不输出 final_verdict
不输出 semantic impact conclusion
不修改 reviewer prompt
不修改 generated runtime mirror
```

V6 的关键降级规则：

| graph_readiness.status | 使用边界 | confidence ceiling |
| --- | --- | --- |
| `primary` | 可作为 bounded graph evidence，但仍需引用当前文件、diff 或 docs | `high` |
| `degraded-fallback` | 必须披露 degraded，local source / diff / tests 为主证据 | `medium` |
| `no-source` | 不做 GitNexus process routing 影响面声明 | `low` |
| `stale` | 只做 orientation，必须基于当前 source 复核 | `low` |
| `dirty-uncertain` | 只做 orientation，worktree fingerprint 不匹配必须披露 | `low` |
| `missing` / `blocked` | 不做 graph-backed impact claim | `unknown` |

这一步让 `spec-architecture-strategist`、`spec-repo-research-analyst`、`spec-api-contract-reviewer`、`spec-testing-reviewer`、`spec-correctness-reviewer`、`spec-code-simplicity-reviewer` 等专家在消费 graph facts 时有统一的 freshness 与证据使用边界，但最终语义判断仍由专家和 Skill Synthesis 完成。

### R7: Standards-aware Experts

```text
目标：project-standards-expert 消费 repo-profile / team standards
要求：
  standards 写入必须 preview-first
```

状态：已进入 V7 Standards-aware Expert brief pilot。V7 消费 `spec-standards` 生成的 standards artifacts：

```text
.spec-first/standards/project-shape.json
.spec-first/standards/standards-plan.json
.spec-first/standards/glue-map.json
.spec-first/standards/standards-candidates.json
.spec-first/standards/standards-preview.md
.spec-first/standards/standards-update-decision.json
.spec-first/standards/imported-standards.json
.spec-first/specs/repo-profile.yaml
```

并输出：

```text
src/cli/contracts/agent-registry/standards-expert-brief.schema.json
scripts/prepare-ecc-standards-expert-brief.js
tests/unit/ecc-standards-expert-brief-contracts.test.js
```

V7 只负责把 standards artifacts 是否存在、validator 结果、trust level、candidate status、allowed use、confidence ceiling、required disclosures、fallback guidance 和 forbidden claims 编译成专家可读 briefing facts。

V7 明确不做：

```text
不运行 spec-standards workflow
不写 .spec-first/standards/*
不修改 .spec-first/specs/repo-profile.yaml
不输出 selected_agents
不输出 final_verdict
不输出 confirmed_standards_write
不输出 repo_profile_writeback
不把 observed / imported / suggested candidate 当作 hard constraint
不替 Skill 判断标准是否采纳、废弃或提升 severity
不修改 reviewer prompt
不修改 generated runtime mirror
```

V7 的关键降级规则：

| standards_readiness.status | 使用边界 | confidence ceiling |
| --- | --- | --- |
| `trusted` | `confirmed` candidate 可作为 hard context；`observed` / `imported` / `suggested` 仍只作 advisory | `high` |
| `degraded` | validator 只以 degraded trust 通过，所有 candidate 包括 confirmed 都只能作 advisory | `medium` |
| `stale` | update decision 建议 refresh，现有 candidate 只能作 advisory | `low` |
| `missing` | candidates 或 preview 缺失，不得形成 standards-backed hard constraint | `unknown` |
| `invalid` | validator fail，不得基于 standards candidate 输出高置信 blocker | `unknown` |

这一步让 `spec-project-standards-reviewer`、`spec-architecture-strategist`、`spec-api-contract-reviewer`、`spec-testing-reviewer`、`spec-code-simplicity-reviewer`、`spec-correctness-reviewer`、`spec-security-reviewer`、`spec-coherence-reviewer`、`spec-feasibility-reviewer`、`spec-scope-guardian-reviewer`、`spec-agent-native-reviewer`、`spec-cli-readiness-reviewer`、`spec-cli-agent-readiness-reviewer`、`spec-security-sentinel` 等研发专家在消费 standards evidence 时统一遵守 preview-first、trust-level 和 advisory/hard 边界。最终是否把某条标准升级为 blocker、写入计划或沉淀为 confirmed standards，仍由 Skill Synthesis 与用户确认流程决定。

### R8: Optional Packs

```text
目标：Figma / Slack / issues / style profile 可插拔
要求：
  显式启用
  不进入 baseline
```

状态：已进入 V8 Optional Pack brief pilot。V8 消费治理预览中的 optional pack registry：

```text
docs/02-架构设计/ECC集成/generated/agent-registry.json
docs/02-架构设计/ECC集成/generated/agent-packs.json
```

并可选消费 V3 router candidate facts：

```text
src/cli/contracts/agent-registry/router-candidate-output.schema.json
```

输出：

```text
src/cli/contracts/agent-registry/optional-pack-brief.schema.json
scripts/prepare-ecc-optional-pack-brief.js
tests/unit/ecc-optional-pack-brief-contracts.test.js
```

V8 只负责把 P2/P3 optional pack 的显式启用请求、router 候选、connector evidence type、allowed use、activation state、confidence ceiling、max severity、required disclosures 和 forbidden claims 编译成专家可读 briefing facts。

V8 明确不做：

```text
不把 optional pack 加入 baseline
不写 runtime pack activation
不查询 Slack / issues / Figma 等外部 connector
不生成 /ecc:* 或 $ecc-* command
不输出 selected_agents
不输出 final_verdict
不把 router candidate 当作 activation
不让 style profile 产生 blocker 或 required fix
不修改 generated runtime mirror
```

V8 的关键启用规则：

| Pack | 默认状态 | 显式启用方式 | 证据要求 | 使用边界 |
| --- | --- | --- | --- | --- |
| `team-context-pack` | disabled | `--enable-pack team-context-pack`、显式 team/slack/issues 信号或指定 agent | `slack` / `issues` / `pr_comments` 至少一种 evidence type | 有证据时作为 connector evidence context；无证据时 reference-only |
| `external-design-pack` | disabled | `--enable-pack external-design-pack`、显式 Figma / external design 信号或指定 agent | `figma` evidence type | 有 Figma evidence 时作为 connector evidence context；无证据时 reference-only |
| `style-profile-pack` | disabled | `--enable-pack style-profile-pack`、显式 style profile 信号或指定 style agent | 无 connector 要求 | 只能 style advisory，max severity 为 `note` |

V8 将 “relevant” 与 “activated” 明确分开：router facts 可以让 optional pack 进入 `eligible`，但不能自动启用；只有显式 pack、显式 agent 或显式信号才能进入 `activated` 或 `activated_reference_only`。这保证插件化能力可插拔，但不会污染默认 workflow、不会扩大上下文预算，也不会把外部 connector 的缺失伪装成已验证事实。

### V9A: Code-review Pilot Brief

状态：已进入 V9A code-review workflow pilot。V9A 将 V3 / V6 / V7 / V8 的只读 projection facts 聚合成 `spec-code-review` 专用 briefing facts：

```text
src/cli/contracts/agent-registry/code-review-pilot-brief.schema.json
scripts/prepare-ecc-code-review-pilot-brief.js
tests/unit/ecc-code-review-pilot-brief-contracts.test.js
```

V9A 是真实 workflow source 的最小接入层：`skills/spec-code-review/SKILL.md` 在 Stage 1 diff scope 之后、Stage 3 reviewer selection 之前，可以读取该 brief 作为 advisory facts。

V9A 只负责把以下 facts 组合起来：

```text
router_candidate_facts
graph_expert_brief
standards_expert_brief
optional_pack_brief
reviewer_candidate_guidance
component_status
degraded_mode
```

V9A 明确不做：

```text
不输出 selected_agents
不输出 final_verdict
不替换 spec-code-review persona catalog
不替换 always-on reviewer 规则
不替换 code-review native findings schema
不激活 optional pack
不查询 Slack / issues / Figma connector
不调用 graph provider
不写 repo-profile
不写 .claude / .codex / .agents/skills runtime mirror
```

V9A 的 workflow 规则：

```text
brief ready -> Skill 可把 reviewer_candidate_guidance 作为候选解释、证据使用上限和 disclosure 输入
brief degraded -> Skill 继续按现有 reviewer selection 执行，并在 Coverage 披露 degraded reason
brief missing / script unavailable -> Skill 继续按现有 reviewer selection 执行
router candidate -> candidate only，不等于 selected reviewer
optional eligible -> activation candidate only，不等于 optional pack activated
```

这一步的价值不是“让 JS 自动选 reviewer”，而是把 ECC 治理后的专家能力包第一次接入真实 `spec-code-review` 节点：脚本准备边界清晰的 facts，Skill 根据现有 workflow contract、用户意图、diff、persona catalog 和可用证据做最终判断。

### V9B: Workflow Pilot Brief

状态：已进入 V9B workflow pilot completion。V9B 将 V9A 的真实 workflow 接入模式扩展到 V1 当前要求覆盖的剩余节点：

```text
spec-plan
spec-doc-review
spec-skill-audit
```

产物：

```text
src/cli/contracts/agent-registry/workflow-pilot-brief.schema.json
scripts/prepare-ecc-workflow-pilot-brief.js
tests/unit/ecc-workflow-pilot-brief-contracts.test.js
```

接入点：

```text
skills/spec-plan/SKILL.md
skills/spec-doc-review/SKILL.md
skills/spec-skill-audit/SKILL.md
```

V9B 只负责把 V3 / V6 / V7 / V8 中适用于当前 workflow 的 projection facts 聚合成 `spec-first.workflow-pilot-brief.v1`：

```text
router_candidate_facts
graph_expert_brief      # spec-plan / spec-doc-review
standards_expert_brief  # spec-plan / spec-doc-review / spec-skill-audit
optional_pack_brief     # spec-plan / spec-doc-review
expert_candidate_guidance
component_status
degraded_mode
```

`spec-skill-audit` 不使用 graph 或 optional-pack 组件；这些组件在 V9B 中以 `unsupported_for_workflow` 跳过，不构成 degraded failure。

V9B 明确不做：

```text
不输出 selected_agents
不输出 final_verdict
不替换 spec-plan research agent selection
不替换 spec-doc-review persona selection
不替换 spec-skill-audit expert rubric judgment
不替换 workflow-native synthesis
不激活 optional pack
不查询 Slack / issues / Figma connector
不调用 graph provider
不写 repo-profile
不写 .claude / .codex / .agents/skills runtime mirror
不新增 /ecc:* 或 $ecc-* command
```

V9B 完成后，V1 当前 pilot 覆盖达到：

| Workflow | Pilot 接入状态 | 使用方式 |
| --- | --- | --- |
| `spec-code-review` | V9A 已接入 | Stage 2c advisory facts，Stage 3 仍由 Skill 选 reviewer |
| `spec-plan` | V9B 已接入 | Phase 1 research 前 advisory facts，research agent 选择仍由 Skill 决定 |
| `spec-doc-review` | V9B 已接入 | Phase 1 文档分类后 advisory facts，conditional persona selection 仍由 Skill 决定 |
| `spec-skill-audit` | V9B 已接入 | deterministic fact collection 后 advisory facts，audit verdict 仍由 Skill 决定 |

这意味着 G7 pilot coverage 已完成到 source workflow 层：ECC 专家能力包已经作为治理后的 evidence-use/candidate-guidance 接入研发核心节点，但仍不是 runtime agent 自动安装、自动执行或 ECC 原始资产镜像。

### R9: Capability Plugin Runtime

```text
目标：把通过 G0-G6.5 和 pilot 的专家能力包升级为真正可插拔 runtime capability。
前置条件：
  capability pack preview contract 稳定
  pack-aware state 设计完成
  doctor / clean 能检测和清理 pack residual
  runtime delivery 通过 source generator 产生
  默认 init 不生成 optional pack asset
```

---

## 25. 最小落地顺序

推荐执行顺序：

```text
1. 生成当前 spec-first agent inventory
2. 生成 ECC overlap matrix
3. 生成 ECC rubric extraction matrix 高价值样本
4. 生成 ECC command idea matrix，只映射命令思想，不生成命令入口
5. 标注 direct / partial / native / profile / deprecated
6. 重组 P0/P1/P2 研发专家能力包，明确 P3 style / experimental references 与 excluded domain references
7. 建立 agent registry preview，并写清 source wins / stale policy
8. 给每个 agent 补 allowed_workflows / trigger_signals / forbidden_actions
9. 建立 Claude / Codex host compatibility metadata
10. 建立 router candidate facts，不让脚本输出最终 selected_agents
11. 建立 Finding Core compatibility view，保留 workflow-native schema
12. 建立 capability pack preview contract，明确插件化、插拔、降级和未来 doctor/clean/state 边界
13. 建立 runtime merge policy preview，约束 managed marker merge 和 add-only config merge
14. 改 code-review / plan / doc-review 的 synthesis pilot
15. 再考虑 optional ECC-derived lens 或新专家
```

V1 不应该先做：

```text
完整动态 router CLI
全量 agent prompt 重写
runtime generation 改造
ECC agent 导入
多宿主 delivery 平台
standards 自动写入
```

---

## 26. 最终原则

```text
Skill owns the workflow.
Agent owns local expert judgment.
Graph owns evidence when fresh.
Standards own confirmed boundaries.
Router selects bounded expertise.
Context Pack controls token cost.
Finding Schema makes judgment composable.
Skill Synthesis owns final verdict.
Knowledge owns compounding.
```

ECC 在 V1 中的定位是：

```text
能力样本库
专家方法论来源
review rubric 来源
failure mode 来源
checklist 来源
```

ECC 不是：

```text
第二套 command
第二套 skill taxonomy
第二套 agent runtime
第二套 hooks
第二套 workflow
```

最终开发方向应命名为：

```text
ECC-inspired Agent Overlap Governance
```

而不是：

```text
ECC Agent Import
```
