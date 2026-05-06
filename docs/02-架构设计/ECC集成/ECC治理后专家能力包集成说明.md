# ECC 治理后专家能力包集成说明

> 适用范围：说明 ECC 的 48 个 agents、182 个 skills、68 个 commands 在 spec-first 中最终如何被吸收、治理、启用和验证。
>
> 准绳文档：`docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md`
>
> 结论：最终集成对象不是 ECC 原始文件，而是治理后的 spec-first expert capability packs。

## 1. 最终结论

ECC 集成不按“导入多少 agent / skill / command”衡量。

最终开发口径是：

```text
ECC 48 agents、182 skills、68 commands 全部进入治理视野；
默认 runtime 直接导入数量为 0；
真正进入 spec-first 的，是经过 overlap、rubric extraction、registry preview、router candidate、context pack、finding compatibility 和 synthesis gate 治理后的专家能力包。
```

这意味着：

| ECC 资产 | 数量 | 直接导入 runtime | 最终集成方式 |
| --- | ---: | ---: | --- |
| Agents | 48 | 0 | 进入 overlap matrix，提取专家判断方法，增强现有 `spec-*` agents 或转为 optional lens |
| Skills | 182 | 0 | 进入 rubric extraction matrix，提取 checklist、failure mode、evidence question |
| Slash commands | 68 | 0 | 仅作为 workflow idea / trigger surface 参考，不新增第二套命令入口 |

最终结果不是：

```text
spec-first/agents 里多出 48 个 ECC agent
spec-first/skills 里多出 182 个 ECC skill
templates/commands 里多出 68 个 ECC command
```

而是：

```text
spec-first 现有 workflow 在正确节点按需获得更强专家判断；
每个专家能力都有来源、边界、触发条件、证据要求和降级策略；
Skill 仍是最终裁判，ECC 不成为第二套 runtime authority。
```

## 2. Source 与 Runtime 边界

### 2.1 Source-of-truth

本说明文档与 V1 方案同属 docs source：

```text
docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md
docs/02-架构设计/ECC集成/ECC治理后专家能力包集成说明.md
docs/02-架构设计/ECC集成/ECC技能清单.md
docs/02-架构设计/ECC集成/ECC斜杠命令清单.md
docs/02-架构设计/ECC集成/ECC子代理清单.md
```

V2 已新增 agent registry source contracts：

```text
src/cli/contracts/agent-registry/agent-registry.schema.json
src/cli/contracts/agent-registry/agent-packs.schema.json
src/cli/contracts/agent-registry/routing-policy.schema.json
src/cli/contracts/agent-registry/finding.schema.json
```

这些 schema 是 source contract，只验证治理预览产物的机器可读形状和边界；它们不表示 capability pack 已进入 runtime delivery。

V3 已新增 router candidate source contracts 与本地预览脚本：

```text
src/cli/contracts/agent-registry/router-candidate-input.schema.json
src/cli/contracts/agent-registry/router-candidate-output.schema.json
scripts/route-ecc-agent-candidates.js
tests/unit/ecc-router-candidate-contracts.test.js
```

V3 脚本只读取治理预览产物并输出 advisory `candidate_agents`。它不输出 `selected_agents`，不写 runtime mirror，不新增 ECC command / skill / agent 入口，也不把脚本升级为最终专家裁判。

V4 已新增 Finding Core projection source contract 与本地预览脚本：

```text
src/cli/contracts/agent-registry/finding-core.schema.json
scripts/project-ecc-finding-core.js
tests/unit/ecc-finding-core-contracts.test.js
```

V4 脚本只读取 `spec-code-review` / `spec-doc-review` workflow-native reviewer JSON，并投影为只读 Finding Core compatibility view。它不替换 native finding schema，不改 reviewer prompt，不写 runtime mirror，也不输出最终 review verdict。

V5 已新增 Skill Synthesis brief source contract 与本地预览脚本：

```text
src/cli/contracts/agent-registry/synthesis-brief.schema.json
scripts/prepare-ecc-synthesis-brief.js
tests/unit/ecc-synthesis-brief-contracts.test.js
```

V5 脚本只读取 V4 Finding Core projection，并可选读取 V3 router candidate facts，输出只读 synthesis briefing facts。它只提供 merge candidate、rank bucket、degraded / pre-existing / verification-required 等提示，不输出最终 verdict，不采纳或拒绝 finding，不写 runtime mirror，也不修改 reviewer prompt。

V6 已新增 Graph-aware Expert brief source contract 与本地预览脚本：

```text
src/cli/contracts/agent-registry/graph-expert-brief.schema.json
scripts/prepare-ecc-graph-expert-brief.js
tests/unit/ecc-graph-expert-brief-contracts.test.js
```

V6 脚本只读取 `.spec-first/graph/graph-facts.json`、`.spec-first/graph/provider-status.json`、`.spec-first/impact/bootstrap-impact-capabilities.json`，并可选读取 V3 router candidate facts，输出只读 graph evidence-use briefing facts。它只提供 graph readiness、provider readiness、capability summary、confidence ceiling、required disclosures、fallback guidance 和 allowed graph artifact use，不调用 provider 命令，不写 `.spec-first/graph/*`，不输出 `selected_agents`、`final_verdict` 或 semantic impact conclusion。

V6 的集成效果是让 Architecture & Contract、Engineering Quality、Repo Research、API Contract、Testing 等研发专家能力包在消费 graph facts 时统一遵守 freshness 和 degraded-mode 边界：

```text
fresh graph -> 可作为 bounded evidence
degraded graph -> 必须披露并降低 confidence
stale / dirty graph -> 只能 orientation_only
missing / blocked graph -> 不得做 graph-backed impact claim
```

V7 已新增 Standards-aware Expert brief source contract 与本地预览脚本：

```text
src/cli/contracts/agent-registry/standards-expert-brief.schema.json
scripts/prepare-ecc-standards-expert-brief.js
tests/unit/ecc-standards-expert-brief-contracts.test.js
```

V7 脚本只读取 `.spec-first/standards/*`、`.spec-first/specs/repo-profile.yaml` 和 `skills/spec-standards/scripts/validate-artifacts.js` 的 validator 结果，并可选读取 V3 router candidate facts，输出只读 standards evidence-use briefing facts。它只提供 standards artifact status、validator trust level、candidate consumption mode、confidence ceiling、required disclosures、fallback guidance、allowed standards artifact use 和 forbidden claims，不运行 `spec-standards`，不写 `.spec-first/standards/*`，不修改 repo-profile，不输出 `selected_agents`、`final_verdict`、`confirmed_standards_write` 或 `repo_profile_writeback`。

V7 的集成效果是让 Governance、Architecture & Contract、Engineering Quality、Document Quality、Skill Audit 等研发专家能力包在消费项目规范时统一遵守 preview-first 和 trust-level 边界：

```text
trusted + confirmed -> 可作为 hard context
trusted + observed/imported/suggested -> 仍只能 advisory
degraded / stale -> 全部 standards candidate 降级为 advisory
missing / invalid -> 不得形成 standards-backed hard constraint
conflict / deprecated / drifted -> 只能作为 risk context
unknown -> 只能作为 question context
```

V8 已新增 Optional Pack brief source contract 与本地预览脚本：

```text
src/cli/contracts/agent-registry/optional-pack-brief.schema.json
scripts/prepare-ecc-optional-pack-brief.js
tests/unit/ecc-optional-pack-brief-contracts.test.js
```

V8 脚本只读取治理预览中的 `agent-registry.json`、`agent-packs.json`，并可选读取 V3 router candidate facts，输出只读 optional pack activation/evidence-use briefing facts。它只提供 optional pack 是否 workflow-allowed、是否显式启用、router 是否只给出 eligible、connector evidence type 是否满足、allowed use、confidence ceiling、max severity、required disclosures 和 forbidden claims，不写 runtime activation，不查询 Slack / issues / Figma，不输出 `selected_agents` 或 `final_verdict`，也不生成 `/ecc:*` 或 `$ecc-*`。

V8 的集成效果是让 Team Context、External Design、Style Profile 等插件化能力保持“可插拔但不默认污染 baseline”：

```text
router candidate -> eligible，不等于 activated
explicit enable + connector evidence -> connector_evidence_context
explicit enable + missing connector evidence -> reference_only
style profile -> style_advisory，max severity 只能是 note
default workflow -> optional pack disabled
runtime delivery -> none_in_v1
```

ECC 侧证据 source：

```text
/Users/kuang/xiaobu/everything-claude-code/agents/*.md
/Users/kuang/xiaobu/everything-claude-code/skills/*/SKILL.md
/Users/kuang/xiaobu/everything-claude-code/commands/*.md
```

如果清单文档与 ECC source 文件冲突，以 ECC source 当前文件为准，清单需要重新生成或标记 stale。

### 2.2 Generated runtime

以下路径仍是 generated runtime，不是 V1 的手工修改目标：

```text
.claude/
.codex/
.agents/skills/
```

V1 不手改 generated runtime。未来如果能力包要进入 runtime，必须通过 source generator、pack-aware state、doctor、clean 和 `spec-first init --claude|--codex` 生成。

## 3. 集成对象定义

### 3.1 Capability Provider

能力来源。ECC 是 provider 之一，但不是 runtime 主体。

```text
provider:
  id: ecc
  role: capability sample source
  authority: advisory
```

未来 provider 可以包括：

```text
spec-first-native
ecc
company-internal
community
project-local
```

### 3.2 Capability Pack

能力包是治理后的交付单元，不等于 ECC 原始目录。

一个 capability pack 可以包含：

```text
agent enhancement
rubric reference
optional lens
style profile
future optional agent
workflow adapter
```

V1 中 capability pack 只作为 preview artifact，不直接生成 runtime asset。

### 3.3 Capability Entry

能力包中的单项能力。

每个 entry 必须说明：

```text
source
target_surface
quality_node
adoption_action
trigger_signals
required_evidence
fallback_mode
not_adopted_reason
```

禁止没有来源、没有 target、没有 evidence policy 的 prompt 片段直接进入 agent。

### 3.4 Capability Execution Plane

借鉴 ECC 在 Codex 中的执行逻辑，并同步映射到当前已支持的 Claude / Codex 双宿主，spec-first 的专家能力包必须分清六个执行平面：

| 执行平面 | Claude | Codex | 统一职责 |
| --- | --- | --- | --- |
| Governance Plane | `CLAUDE.md` + `AGENTS.md` managed blocks | `AGENTS.md` | 入口治理、语言、source/runtime、workflow 选择边界 |
| Workflow Plane | `.claude/skills` generated mirror | `.agents/skills` generated mirror / plugin skills | 执行可重复 workflow，source-of-truth 仍是 `skills/*/SKILL.md` |
| Tool Plane | Claude settings / MCP / hooks / permissions | `.codex/config.toml` / MCP / profiles | 提供工具、权限、readiness 和 deterministic facts |
| Expert Role Plane | `.claude/agents` + `Agent` / `Task` | `.codex/agents` + `spawn_agent` | 承载专家判断角色，不决定最终 workflow verdict |
| Command / Prompt Plane | Claude slash commands 是原生命令面 | commands 主要降级为 prompt/reference | ECC commands 不导入，只做 command idea matrix |
| Runtime State Plane | `.claude/`, `.agents/skills/` | `.codex/`, `.agents/skills/` | 只承接 source generator 输出，不能反向成为 source-of-truth |

因此，capability pack 不是一个“更大的 agent 文件”，而是挂在这些执行平面上的受治理能力声明。

## 4. 最终能力包清单

### 4.1 P0 Core Capability Packs

P0 是主 workflow 的核心专家能力。它们可以进入默认候选池，但仍由 Skill 根据当前任务语义最终选择。

| Pack | 目标节点 | ECC 能力吸收 | spec-first target |
| --- | --- | --- | --- |
| Product & Scope Pack | Spec / Brainstorm / Doc Review | product-lens、council、product-capability 类方法论 | `spec-product-lens-reviewer`, `spec-scope-guardian-reviewer`, `spec-spec-flow-analyzer` |
| Document Quality Pack | Doc Review / Plan | adversarial review、feasibility、scope、security lens rubric | `spec-coherence-reviewer`, `spec-feasibility-reviewer`, `spec-adversarial-document-reviewer`, `spec-security-lens-reviewer` |
| Engineering Quality Pack | Code Review / Debug | code-reviewer、silent-failure、testing、simplicity、maintainability rubric | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-maintainability-reviewer`, `spec-reliability-reviewer`, `spec-code-simplicity-reviewer` |
| Architecture & Contract Pack | Plan / Code Review | architect、planner、code-architect、api-design、code-tour、repo-scan | `spec-architecture-strategist`, `spec-api-contract-reviewer`, `spec-repo-research-analyst`, `spec-git-history-analyzer` |
| Governance Pack | Skill Audit / Update / Compound | context-budget、skill-stocktake、skill-comply、mcp-server-patterns、agent-harness-construction | `spec-agent-native-reviewer`, `spec-cli-readiness-reviewer`, `spec-cli-agent-readiness-reviewer`, `spec-project-standards-reviewer`, `spec-learnings-researcher` |

### 4.2 P1 Conditional Capability Packs

P1 只在风险、文件类型、技术栈或用户明确目标触发时进入候选池。

| Pack | 触发信号 | ECC 能力吸收 | spec-first target |
| --- | --- | --- | --- |
| Security Deep Pack | auth、token、permission、PII、external input、payment、secret | `security-review`, `security-scan`, `safety-guard`, `security-reviewer` | `spec-security-reviewer`, `spec-security-sentinel` |
| Data Pack | DB、migration、SQL、production data、ETL、schema drift | `database-migrations`, `postgres-patterns`, `clickhouse-io`, `database-reviewer` | `spec-data-integrity-guardian`, `spec-data-migrations-reviewer`, `spec-data-migration-expert` |
| Performance Pack | slow query、cache、loop、render、I/O、bundle、memory | `performance-optimizer`, `benchmark`, performance sections from stack skills | `spec-performance-reviewer`, `spec-performance-oracle` |
| Frontend / App Pack | UI state、browser flow、design fidelity、accessibility、iOS/KMP | `accessibility`, `browser-qa`, `click-path-audit`, `design-system`, `frontend-patterns`, `a11y-architect` | `spec-design-lens-reviewer`, `spec-design-implementation-reviewer`, `frontend-async-race-expert`, `spec-swift-ios-reviewer` |
| Language Pack | `.ts`, `.tsx`, `.py`, Rails, Java, Go, Rust, Kotlin, Flutter 等 | language reviewers、language testing、language patterns | canonical language experts and future stack optional entries |
| Research Pack | 新框架、不确定 API、用户明确研究、文档 freshness 风险 | `documentation-lookup`, `search-first`, `deep-research`, `docs-lookup` | `spec-framework-docs-researcher`, `spec-best-practices-researcher`, `spec-web-researcher` |

### 4.3 P2 Optional Capability Packs

P2 是可插拔能力，必须显式启用或由 pilot 证明价值后再进入受控触发。

| Pack | ECC 能力吸收 | 默认策略 |
| --- | --- | --- |
| Build Resolver Pack | `build-error-resolver`, `go-build-resolver`, `rust-build-resolver`, `kotlin-build-resolver`, `java-build-resolver`, `dart-build-resolver`, `pytorch-build-resolver` | 默认 checklist/reference，未来按技术栈 opt-in |
| Agent Ops / Eval Pack | `agent-eval`, `eval-harness`, `skill-comply`, `skill-stocktake`, `context-budget`, `agentic-engineering`, `autonomous-loops` | 服务 `spec-optimize` 与 `spec-skill-audit`，不进入普通 code-review |
| MCP / Tooling Pack | `mcp-server-patterns`, `agent-harness-construction`, `enterprise-agent-ops`, `cost-aware-llm-pipeline` | 服务 harness/runtime/governance 设计，不成为用户任务默认专家 |
| Open Source Release Pack | `opensource-packager`, `opensource-forker`, `opensource-sanitizer`, open-source pipeline skills | 显式 opt-in，默认不碰 repo 发布面 |

### 4.4 Excluded Domain References 与 P3 Style / Experimental Packs

当前集成聚焦研发领域。业务运营、媒体增长、金融、物流、医疗、web3 等 ECC domain skills 不进入 V1 专家能力包，不进入 router 候选，不进入 runtime delivery 规划。

这类能力只保留为 inventory/reference，不能被包装成默认或可选研发专家能力。未来如果 spec-first 要服务某个明确行业交付场景，必须另开独立计划重新定义目标、证据、风险、合规和验收边界。

| Pack | 示例 | 默认策略 |
| --- | --- | --- |
| Excluded Domain Reference | healthcare、HIPAA、finance、logistics、customs、energy、inventory、production scheduling、web3 | 当前不集成；只保留清单和外部参考，不进入 capability pack |
| Excluded Media / Growth Reference | article、content-engine、video、SEO、social graph、investor materials | 当前不集成；不进入 spec-first 工程 workflow |
| Style Profile Pack | DHH Rails、README style、brand voice | 显式启用，finding 不得产生 blocker |
| Experimental Harness Pack | GAN harness、loop operator、multi-agent orchestration | 仅作为 `spec-optimize` 或研究参考 |

## 5. ECC Agents 的最终处理

48 个 ECC agents 不按文件导入。最终按能力去向处理。

### 5.1 增强现有 spec-first 专家

| ECC agents | 目标 |
| --- | --- |
| `architect`, `planner`, `code-architect` | 增强 `spec-architecture-strategist` 与 `spec-plan` 的 evidence-aware planning rubric |
| `code-reviewer`, `pr-test-analyzer`, `tdd-guide` | 增强 `spec-code-review` 的 testing/correctness finding 质量 |
| `security-reviewer` | 增强 `spec-security-reviewer` 与 `spec-security-lens-reviewer` |
| `database-reviewer` | 增强 data / migration experts |
| `performance-optimizer` | 增强 performance experts |
| `code-simplifier`, `refactor-cleaner` | 增强 simplicity / maintainability experts |
| `docs-lookup`, `code-explorer` | 增强 repo research / framework docs / graph-aware research |

### 5.2 转为条件或 optional lens

| ECC agents | 处理 |
| --- | --- |
| `silent-failure-hunter` | 转为 reliability/correctness optional lens，优先用于 debug 和 high-risk review |
| `type-design-analyzer` | 转为 language/type invariant lens，优先用于 TS/Rust/Kotlin 等类型边界强场景 |
| `comment-analyzer` | 转为 documentation drift lens，不进入默认 P0 |
| `a11y-architect` | 转为 accessibility lens，服务 app audit、design review、frontend review |
| `e2e-runner` | 转为 E2E validation capability，服务 polish/app audit/code-review evidence |

### 5.3 不进入核心路径

| ECC agents | 原因 |
| --- | --- |
| `chief-of-staff` | 个人运营场景，不服务核心 `Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` |
| `seo-specialist` | 媒体增长能力，不属于当前研发能力包集成范围 |
| `healthcare-reviewer` | 医疗合规领域能力，不属于当前研发能力包集成范围 |
| `opensource-packager`, `opensource-forker`, `opensource-sanitizer` | 发布面风险高，必须显式启用 |
| `gan-generator`, `gan-evaluator`, `gan-planner` | 实验 harness，不进入默认研发 workflow |
| `harness-optimizer`, `loop-operator`, `conversation-analyzer` | 只作为 agent ops / skill audit 参考 |

## 6. ECC Skills 的最终处理

182 个 ECC skills 的价值主要是方法论提炼，不是创建 182 个 spec-first skills。

### 6.1 首批 P0 Rubric Extraction

首批只提取高频、高价值、能直接提升 spec-first 节点质量的内容：

```text
security-review
security-scan
safety-guard
api-design
database-migrations
postgres-patterns
tdd-workflow
e2e-testing
verification-loop
ai-regression-testing
accessibility
click-path-audit
browser-qa
design-system
backend-patterns
frontend-patterns
code-tour
codebase-onboarding
mcp-server-patterns
context-budget
skill-stocktake
skill-comply
```

这些 skill 的吸收方式是：

```text
read source
extract checklist / failure mode / evidence question
dedupe against current spec-first agent or workflow
write rubric extraction matrix
only then enhance existing target surface
```

### 6.2 P1 技术栈能力

以下不进入默认核心，但可作为条件增强：

```text
python-patterns
python-testing
django-patterns
django-security
django-tdd
java-coding-standards
springboot-patterns
springboot-security
golang-patterns
golang-testing
rust-patterns
rust-testing
kotlin-patterns
kotlin-testing
flutter-dart-code-review
dart-flutter-patterns
swiftui-patterns
swift-concurrency-6-2
dotnet-patterns
csharp-testing
nestjs-patterns
docker-patterns
deployment-patterns
```

处理策略：

```text
不批量放进 prompt
不默认调所有语言专家
按 changed_files / project stack / risk signal 进入候选
provider stale 或证据不足时降级为 checklist reference
```

### 6.3 当前不集成的领域能力

业务运营、媒体增长、金融、物流、医疗、web3 等 skill 当前不集成。

原因是当前 ECC 集成目标聚焦研发领域：

```text
Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

这类领域能力不进入：

```text
任何 capability pack
router candidate pool
agent prompt enhancement
rubric extraction 首批样本
runtime delivery roadmap
```

只允许保留为：

```text
inventory fact
external reference
future independent proposal input
```

未来如需重新评估，必须满足：

```text
明确的行业研发目标
独立 plan / review
合规和责任边界
项目 confirmed standards 不被覆盖
不会污染核心研发 workflow
```

## 7. ECC Commands 的最终处理

68 个 ECC slash commands 全部不导入。

原因：

```text
spec-first 已有 public workflow 入口；
新增 /ecc:* 或原始 ECC commands 会形成第二套入口；
命令入口会绕过 spec-first 的 source/runtime、workflow、artifact 和 synthesis 边界。
```

只保留命令思想映射：

| ECC command | spec-first 消费方式 |
| --- | --- |
| `/code-review`, `/review-pr`, `/quality-gate`, `/test-coverage` | 参考到 `$spec-code-review` 的 reviewer routing、finding、coverage gate |
| `/plan`, `/multi-plan`, `/feature-dev`, `/prp-plan`, `/prp-implement` | 参考到 `$spec-brainstorm`, `$spec-plan`, `spec-write-tasks`, `$spec-work` |
| `/build-fix`, `/go-build`, `/rust-build`, `/kotlin-build`, `/flutter-build`, `/gradle-build` | 参考到 `$spec-debug` 和 `$spec-work` 的 build failure handling |
| `/harness-audit`, `/skill-health`, `/learn-eval` | 参考到 `$spec-skill-audit` 与 `$spec-optimize` |
| `/update-docs`, `/update-codemaps`, `/learn` | 参考到 `$spec-standards` 与 `$spec-compound` |
| `/hookify*`, `/jira`, `/pm2`, `/model-route`, `/setup-pm` | 不进入核心，未来最多作为 optional tooling provider 参考 |

后续可生成 `ecc-command-idea-matrix`，但它只能用于 reference：

```text
可以记录 command idea -> spec-first workflow 的映射
可以标注 enhance_existing_workflow / reference_only / rejected
不允许生成 /ecc:*、$ecc-* 或 runtime command registry
不把 Codex prompt 文件视为 slash command parity
不把 Claude slash command 能力误推广为 ECC command 导入许可
```

## 8. Workflow 节点落地效果

| spec-first 节点 | 集成后的效果 | 不允许的退化 |
| --- | --- | --- |
| Codebase | repo research 能更快识别真实模块边界、历史原因和复用候选 | 不把 stale graph 或猜测当成事实 |
| Graph | architecture/API/testing experts 消费 graph facts 与 readiness status | graph 不可用时不输出高置信影响面 |
| Spec / Brainstorm | product、scope、flow lens 帮助明确用户、场景、边界、反目标 | 不过早进入架构实现 |
| Doc Review | coherence、feasibility、scope、安全方案 lens 提前发现矛盾和不可落地假设 | 不用专家数量替代审查质量 |
| Plan | architecture、repo、API、data、安全、simplicity experts 让关键决策带证据 | 不凭 ECC best practice 覆盖本仓库事实 |
| Tasks | testing、API contract、deployment verification experts 让任务包更可执行、可验证 | 不重新设计 plan 或扩大 scope |
| Work | 最多 1-2 个相关专家补上下文，减少卡点和过度设计 | 不把 work 变成现场重规划 |
| Debug | correctness、reliability、history、data/security experts 帮助定位根因和回归测试 | 不跳过重现和证据链 |
| Code Review | findings 更准确、更少重复、severity 更可解释 | agent 不输出最终 merge verdict |
| App Audit | 产品、流程、设计、API、i18n、analytics 一致性审查更完整 | 缺证据时不允许 full-pass |
| Skill Audit | 防止 skill/agent 越权、重复、上下文膨胀和 runtime drift | 不依赖当前会话缓存验证新 prompt |
| Compound / Knowledge | 有效 finding 可转为 standards candidate 或 learning | 不 silent write confirmed standards |

## 9. Activation Policy

### 9.1 默认策略

```text
P0 core packs:
  可进入默认候选池
  仍由 Skill 最终选择

P1 conditional packs:
  文件、风险、技术栈或用户目标触发
  无证据时降级

P2 optional packs:
  默认 disabled
  pilot 或显式启用后使用

Excluded domain references:
  当前不集成
  不进入 router 候选
  不生成 runtime asset

P3 style / experimental packs:
  默认 disabled
  用户显式启用
  不能产生 blocker
```

### 9.2 显式调用与隐式候选

借鉴 ECC 的 Codex 使用逻辑，并同步适配 Claude / Codex 双宿主，重要工作必须优先使用显式 workflow 或显式能力启用：

```text
显式 spec-first workflow（Claude: /spec:*；Codex: $spec-*） > 显式 capability pack enablement > router implicit candidate
```

隐式触发只能产生候选事实：

```text
changed_files / risk_signals / provider metadata -> candidate_agents
```

它不能直接：

```text
选择 selected_agents
执行 agent
写 durable artifact
写 confirmed standards
生成 runtime asset
```

### 9.3 Router 边界

Router 只能输出：

```json
{
  "candidate_agents": [],
  "reason_code": "",
  "budget_hint": "",
  "degraded_mode": {}
}
```

Router 不输出最终 `selected_agents`。

最终选择属于 Skill / LLM：

```text
读取 candidate facts
结合用户目标、workflow contract、风险和证据
选择有限专家
构造最小 context pack
合成 findings
输出最终产物
```

### 9.4 Host Compatibility 与 Source Freshness

每个 capability pack preview 必须声明 Claude / Codex 双宿主支持度：

```json
{
  "host_support": {
    "claude": "supported",
    "codex": "supported",
    "fallback": "reference_only",
    "unsupported_reason_code": null
  }
}
```

每个来自 ECC 的采纳项必须声明 source freshness：

```json
{
  "source_file": "/Users/kuang/xiaobu/everything-claude-code/skills/security-review/SKILL.md",
  "source_revision": "unknown_until_generated",
  "loaded_from": "provider_source",
  "runtime_cached": false,
  "freshness": "current_source_read"
}
```

host 不支持 dispatch、runtime 不可用、provider stale 或 source freshness 不足时，只能降级为 checklist/reference。

### 9.5 Context 边界

禁止把 ECC skills / agents 全量放入上下文。

每个专家只拿：

```text
当前 workflow 必需输入
相关 diff / doc section / plan excerpt
必要 graph / standards / tests evidence
对应 rubric excerpt
not_reviewed disclosure
```

## 10. 验收标准

能力包只有满足以下条件，才能从 reference 进入增强或 optional runtime 规划：

| Gate | 标准 |
| --- | --- |
| Source Evidence Gate | 能追溯到 ECC source 与当前 spec-first source |
| Overlap Gate | direct_match 不新增 agent，native 不被 ECC 覆盖，profile 不进默认路由 |
| Rubric Extraction Gate | 每条采纳项有 source、target、quality_node、dedupe、adoption_action |
| Workflow Compatibility Gate | 不覆盖现有 persona catalog、workflow schema、headless output、synthesis contract |
| Finding Evidence Gate | finding 有 evidence、confidence、recommendation、not_reviewed 或 native 等价字段 |
| Synthesis Gate | 最终 verdict 只能由 Skill 输出 |
| Opt-in Gate | 研发向 optional pack、style profile 必须显式启用；excluded domain references 不进入 capability pack |
| Host Compatibility Gate | 每个 pack 声明 Claude / Codex 支持度、fallback 和 unsupported reason |
| Source Freshness Gate | 每个 ECC 采纳项声明 source file、revision、loaded_from、freshness 和 runtime_cached |
| Command Idea Gate | ECC commands 只进入 idea matrix，不进入 command registry 或 runtime command surface |
| Runtime Merge Gate | 未来 runtime delivery 必须 managed marker merge、add-only config merge、preview-first |
| Runtime Gate | 未显式启用 capability pack 时不得生成 ECC runtime asset |
| Doctor/Clean Gate | 未来 runtime delivery 必须可诊断、可清理、可降级 |

## 11. 最小落地顺序

本地再生成 G0-G6.5 preview artifacts 使用：

```bash
npm run docs:ecc-governance
```

该命令只更新 `docs/02-架构设计/ECC集成/generated/` 下的治理预览产物，不写 generated runtime，不新增 ECC command / agent / skill runtime 入口。

推荐顺序：

```text
G0: 扫描 spec-first 当前 agents，生成 current inventory
G1: 扫描 ECC agents，生成 overlap matrix
G1.5: 从 ECC skills 提取 rubric extraction matrix
G1.6: 从 ECC commands 提取 command idea matrix，不生成命令入口
G2: 定义 P0/P1/P2 capability packs、P3 style/experimental packs 与 excluded domain references
G3: 建立 registry preview 和 host compatibility metadata，不作为 source-of-truth
G4: 建立 router candidate facts，不让脚本输出 selected_agents
G5: 建立 finding compatibility view，不替换 workflow-native schema
G6: 改造 synthesis policy，让 Skill 做 merge/dedupe/rank/adopt/reject
G6.5: 建立 runtime merge policy preview，约束 marker merge 和 add-only config merge
G7: 通过 pilot 验证 code-review / plan / doc-review 节点质量增益
G8: 再决定是否把少数 optional lens 升级为 runtime capability
G9: 若进入 runtime，补 pack-aware init / doctor / clean / state
```

V2 当前完成项：

```text
V2: 将 agent-registry / agent-packs / routing-policy / finding compatibility 预览产物升级为 source schema contract
验证:
  tests/unit/ecc-agent-registry-contracts.test.js
边界:
  不改 generated runtime
  不新增 ECC command surface
  不让 router 输出 selected_agents
  不替换 workflow-native finding schema
```

V3 当前完成项：

```text
V3: 将 router candidate policy 升级为可执行的候选事实预览脚本和输入/输出 schema
产物:
  src/cli/contracts/agent-registry/router-candidate-input.schema.json
  src/cli/contracts/agent-registry/router-candidate-output.schema.json
  scripts/route-ecc-agent-candidates.js
  tests/unit/ecc-router-candidate-contracts.test.js
验证:
  npx jest tests/unit/ecc-router-candidate-contracts.test.js tests/unit/ecc-agent-registry-contracts.test.js --runInBand
边界:
  输出 candidate_agents，不输出 selected_agents
  输出 requires_skill_decision: true
  只消费 docs/02-架构设计/ECC集成/generated/ 下的治理预览产物
  不改 generated runtime
  不新增 ECC command surface
  不替换 workflow-native reviewer catalog
```

V4 当前完成项：

```text
V4: 将 code-review / doc-review native findings 只读投影为 Finding Core compatibility view
产物:
  src/cli/contracts/agent-registry/finding-core.schema.json
  scripts/project-ecc-finding-core.js
  tests/unit/ecc-finding-core-contracts.test.js
验证:
  npx jest tests/unit/ecc-finding-core-contracts.test.js tests/unit/ecc-agent-registry-contracts.test.js --runInBand
  npm run typecheck
边界:
  workflow-native schema wins
  输出 finding_core，不输出 final_verdict
  保留 code-review 的 autofix_class / owner / requires_verification / pre_existing
  保留 doc-review 的 finding_type / deferred_questions
  severity_display / confidence_display 只是 compatibility labels
  不改 generated runtime
  不新增 ECC command surface
  不修改 reviewer prompt
```

V5 当前完成项：

```text
V5: 将 Finding Core projections 组织成 Skill Synthesis brief facts
产物:
  src/cli/contracts/agent-registry/synthesis-brief.schema.json
  scripts/prepare-ecc-synthesis-brief.js
  tests/unit/ecc-synthesis-brief-contracts.test.js
验证:
  npx jest tests/unit/ecc-synthesis-brief-contracts.test.js tests/unit/ecc-finding-core-contracts.test.js tests/unit/ecc-router-candidate-contracts.test.js --runInBand
  npm run typecheck
边界:
  输出 synthesis brief，不输出 final_verdict
  输出 candidate merge/rank/degraded hints，不输出 adopt/reject/downgrade 结论
  可消费 router candidates，但仍不输出 selected_agents
  Skill 必须填充 synthesis_decision_slots
  不改 generated runtime
  不新增 ECC command surface
  不修改 reviewer prompt
```

## 12. 最终效果

按本口径完成后，spec-first 会获得以下效果：

```text
专家能力更强，但专家数量不膨胀；
workflow 节点质量提升，但入口不分裂；
ECC 最佳实践被吸收，但不会覆盖项目事实；
每个专家建议都有 evidence / confidence / not_reviewed；
Skill 仍是最终裁判，agent 不越权；
可选能力能显式启用、禁用、降级和未来清理；
长期经验能沉淀为 standards candidate 或 learning，而不是散落在对话里。
```

最终原则：

```text
ECC 不是要被安装进 spec-first；
ECC 是用于校准和增强 spec-first 专家体系的能力样本库。

最终集成的是治理后的专家能力包，
不是 ECC 原始 agents、skills、commands 的 runtime 镜像。
```
