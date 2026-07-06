
---

# spec-first × ECC 专家能力整合技术方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 建议文件名：`docs/2026-05-04-ecc-agent-integration-final/TECHNICAL_PLAN.md`
> 文档定位：终态设计 + MVP 落地边界
> 核心目标：吸收 ECC 的专家能力，提升 spec-first 的专家团队能力，但不让 ECC 的 agent/command/hook 体系反向主导 spec-first。

---

## 0. 最终结论

**ECC 可以集成，但不能原样集成。**

最终不是：

```text
把 ECC agents / commands / hooks 搬进 spec-first
```

而是：

```text
spec-first 管流程
ECC 补能力
Graph 提供证据
Standards 定义边界
Router 选择专家
Synthesis 裁判结论
Artifacts 承接沉淀
```

更准确地说：

```text
ECC = 外部专家能力来源
spec-first = Workflow Harness + Evidence Router + Governance + Artifact Protocol
```

所以最终集成路线应该分成两层：

```text
MVP 层：
  ECC 作为 internal reference/lens capability pack
  不导入 ECC agents
  不导入 ECC commands
  不导入 ECC hooks
  不新增 /ecc:* 入口
  不改变 spec-first 主流程

终态层：
  建立 Expert Capability Layer
  支持 ECC / internal / company / community 专家能力统一注册
  支持动态路由、上下文预算、专家 finding、skill synthesis
  支持未来少量 ECC-derived agents 在治理完成后接入
```

一句话：

> **先把 ECC 变成 spec-first 的“专家镜片”，再逐步演进成可治理的专家能力来源，而不是把 ECC 变成第二套 spec-first。**

---

# 1. 整合指导思想

## 1.1 Skill owns workflow

spec-first 的核心不变：

```text
Skill = 工作流节点 / 编排者 / 裁判
Agent = 局部专家判断
Lens = 分析视角 / 评审维度
Tool = 事实查询 / 执行工具
Artifact = 证据 / 产物 / 知识沉淀
```

ECC 的能力只能进入：

```text
Lens
Expert
Reviewer
Researcher
Reference
```

不能变成新的 `spec-*` 主流程入口。

---

## 1.2 ECC provides expert judgment, not workflow authority

ECC 可以提供：

```text
正确性视角
安全视角
测试视角
架构视角
API contract 视角
scope guardian 视角
coherence 视角
design lens 视角
git history / repo research 视角
```

但不能负责：

```text
决定 workflow 阶段
写最终 plan
写最终 review verdict
修改 repo-profile.yaml
写长期标准
改变 runtime state
执行 destructive command
```

最终裁判权必须属于 spec-first Skill。

---

## 1.3 Scripts prepare, LLM decides

脚本负责确定性准备：

```text
扫描 assets
解析 registry
校验 schema
同步 runtime
生成 changed files / diff stats
读取 graph facts
读取 standards snippets
记录 routing 输入输出
```

LLM/Skill 负责语义判断：

```text
当前任务是否需要 security lens？
这个 plan 是否 scope creep？
这个 review 是否需要 API contract expert？
graph 不完整时哪些结论需要降置信度？
哪些专家意见应该采纳？
哪些应该降级为 advisory？
```

不要让脚本变成语义规则引擎。

---

## 1.4 Graph-first, project-guidance-aware, preview-first

ECC 专家能力必须优先消费 spec-first 已有证据：

```text
.spec-first/graph/graph-facts.json
.spec-first/graph/bootstrap-impact-capabilities.json
.spec-first/graph/reuse-candidates.json
.spec-first/graph/architecture-facts.json
.spec-first/config/provider-artifacts.json
.spec-first/config/runtime-capabilities.json
.spec-first/specs/repo-profile.yaml
docs/specs/<spec-id>/*
diff / changed files / test results
```

专家建议如果要变成长期规范，必须走：

```text
finding
  → project guidance proposal
  → preview
  → human confirmation
  → AGENTS.md / CLAUDE.md / docs/contracts
```

不能 silent write。

---

# 2. 目标与非目标

## 2.1 目标

| 目标                | 说明                                            |
| ----------------- | --------------------------------------------- |
| 吸收 ECC 专家能力       | 复用 ECC 成熟的工程 lens / reviewer 思路               |
| 保持 spec-first 主架构 | `spec-*` 入口、Skill 主流程、Artifacts 闭环不变         |
| 提升专家团队能力          | 让 brainstorm / plan / review / audit 不再是单视角判断 |
| 动态路由              | 按 workflow、文件、风险、技术栈、证据状态选择专家                 |
| 控制 token 成本       | 两阶段路由，先选专家，再构造最小上下文                           |
| 结构化输出             | 所有专家输出进入统一 finding schema                     |
| Skill synthesis   | 去重、定级、裁判、合并、落产物                               |
| 可治理 runtime       | 支持 doctor / clean / state / stale / drift     |
| 可演进               | 后续接入更多外部 agent framework                      |

---

## 2.2 非目标

| 非目标                             | 原因                                                       |
| ------------------------------- | -------------------------------------------------------- |
| 不导入 ECC commands                | 会形成第二套用户入口，与 `spec-*` 冲突                                |
| 不导入 ECC hooks                   | hooks 会改变宿主全局行为，风险太高                                     |
| MVP 不导入 ECC agents              | 当前 agent filtering/governance 未完成，容易泄漏                   |
| 不全量导入 ECC skills                | token 膨胀、资产污染、治理复杂                                       |
| 不把 ECC skills 原样复制              | 必须语义清洗，转成 spec-first lens/reference                      |
| 不让 ECC 修改 repo-profile          | 长期规范必须 preview-first + human-confirmed                   |
| 不默认启用所有专家                       | 专家越多不等于质量越高                                              |
| 不引入 hard rule engine            | 保持 Light contract、Explicit boundaries、Let the LLM decide |
| 不把 repo-profile 变 runtime state | repo-profile 只保存确认后的稳定标准                                 |

---

# 3. 终态架构

## 3.1 总体架构

```text
User Intent
  ↓
spec-first Skill
  brainstorm / doc-review / plan / write-tasks / work / review / audit
  ↓
Context & Evidence Builder
  spec / plan / tasks / diff / graph facts / standards / history / tests
  ↓
Capability Router
  workflow signals + file signals + risk signals + tech stack signals
  ↓
Selected Expert Lens / Agent
  ECC-derived / internal / company / community
  ↓
Expert Findings
  structured, evidence-bound, confidence-marked
  ↓
Skill Synthesis
  merge / dedupe / rank / downgrade / adopt / reject
  ↓
spec-first Artifacts
  Brainstorm / Design / Plan / Tasks / Review / Compound / Standards Preview
```

---

## 3.2 三层模型

```text
Workflow Layer
  - spec-brainstorm
  - spec-doc-review
  - spec-plan
  - spec-write-tasks
  - spec-work
  - spec-debug
  - spec-code-review
  - spec-app-consistency-audit
  - spec-compound
  - spec-skill-audit

Expert Capability Layer
  - capability registry
  - capability packs
  - source attribution
  - routing policy
  - context budget
  - finding schema
  - synthesis policy
  - fallback/degraded mode

Evidence Layer
  - graph facts
  - repo-profile
  - team standards
  - docs artifacts
  - diff facts
  - git history
  - PR comments
  - test results
  - app audit evidence
```

---

# 4. 最终架构边界

## 4.1 Source / Runtime / Confirmed 三边界

| 类型                  | 位置                                                                | 职责                         |
| ------------------- | ----------------------------------------------------------------- | -------------------------- |
| Source assets       | `skills/`, `agents/`, `docs/10-prompt/`, `src/cli/contracts/**`   | 能力源、prompt、contract、schema |
| Runtime assets      | `.claude/**`, `.agents/**`, `.codex/**`, `.spec-first/runtime/**` | 生成后的宿主运行资产、过程产物            |
| Confirmed standards | `.spec-first/specs/repo-profile.yaml`                             | 用户确认后的长期项目规范               |

关键原则：

```text
Source 描述能力
Runtime 记录过程
Confirmed 承接长期规范
```

不要把 routing 结果写入 repo-profile；不要把未确认专家建议写成项目规则。

---

## 4.2 Command / Skill / Agent 三边界

```text
Command = 用户入口
Skill = workflow 主体
Agent/Lens = workflow 内部专业能力
```

例如：

```text
spec-plan
  → skills/spec-plan/SKILL.md
  → 读取 capability registry
  → 选择 architecture / feasibility / simplicity lens
  → 合成最终 Plan.md
```

ECC 不新增：

```text
/ecc:*
/everything-claude-code:*
$ecc-*
```

---

# 5. MVP 收敛方案

## 5.1 MVP 只做什么

MVP 只做：

```text
显式 opt-in
少量 ECC-derived internal reference/lens skills
不导入 commands
不导入 hooks
不导入 agents
不新增用户入口
不改变主 workflow
不自动语义路由
```

MVP 目标不是“专家全量接入”，而是验证：

```text
ECC 能力能否被 spec-first 安全吸收为 lens
Lens 能否被 Skill 按需引用
引用后能否提升 plan/review/doc-review 质量
不会污染 runtime 和用户入口
```

---

## 5.2 MVP Pack

建议固定一个 MVP pack：

```text
CLI pack id: core-engineering
governance pack id: ecc-core-engineering
state provider: ecc
```

MVP 只包含 6 个 internal reference/lens skills：

```text
ecc-api-design
ecc-security-review-lite
ecc-testing-strategy
ecc-accessibility
ecc-debugging-patterns
ecc-mcp-server-patterns
```

其中：

| Lens                       | 优先服务 workflow                                |
| -------------------------- | -------------------------------------------- |
| `ecc-api-design`           | `spec-plan` / `spec-code-review`             |
| `ecc-security-review-lite` | `spec-plan` / `spec-code-review`             |
| `ecc-testing-strategy`     | `spec-write-tasks` / `spec-code-review`      |
| `ecc-accessibility`        | `spec-app-consistency-audit` / `spec-polish` |
| `ecc-debugging-patterns`   | `spec-debug`                                 |
| `ecc-mcp-server-patterns`  | `spec-mcp-setup` 可选参考                        |

MVP 不称这些为“Agent”，先称为：

```text
internal reference skill
lens skill
capability reference
```

---

## 5.3 MVP 用户入口

```bash
spec-first init --claude --with-ecc core-engineering
spec-first init --codex --with-ecc core-engineering
spec-first doctor
spec-first clean --managed
```

默认 init：

```bash
spec-first init --claude
```

不得生成任何 ECC runtime asset。

---

## 5.4 MVP 运行时行为

当用户未启用 ECC：

```text
spec-plan 不引用 ecc-*
spec-code-review 不引用 ecc-*
doctor 不报告 ECC 缺失
clean 不碰用户自定义 ecc-* 文件
```

当用户启用 ECC：

```text
runtime 生成 ecc-* internal lens
workflow 可以在需要时参考 lens
final verdict 仍由原 spec-first workflow 决定
doctor 能检查 missing / drifted / stale
clean 能清理 managed ECC assets
```

---

# 6. 终态专家能力包设计

MVP 之后，ECC 能力按包治理，而不是按单个 agent 随意散落。

## 6.1 P0 核心专家包

```text
Product & Scope Pack
  - product-lens-expert
  - scope-guardian-expert
  - spec-flow-expert

Document Quality Pack
  - coherence-expert
  - feasibility-expert
  - adversarial-doc-review-expert
  - security-plan-review-expert

Engineering Quality Pack
  - correctness-review-expert
  - maintainability-review-expert
  - testing-review-expert
  - reliability-review-expert
  - simplicity-expert

Architecture & Contract Pack
  - architecture-expert
  - api-contract-expert
  - repo-research-expert
  - git-history-expert

Governance Pack
  - project-standards-expert
  - knowledge-reuse-expert
```

---

## 6.2 P1 条件专家包

```text
Security Deep Pack
  - security-code-review-expert
  - security-deep-audit-expert

Performance Pack
  - performance-review-expert
  - performance-optimization-expert

Data Pack
  - data-integrity-expert
  - migration-safety-expert

Frontend/App Pack
  - design-lens-expert
  - design-implementation-expert
  - design-polish-expert
  - frontend-async-race-expert
  - ios-mobile-review-expert

Language Pack
  - typescript-expert
  - python-expert
  - rails-convention-expert

Research Pack
  - best-practices-research-expert
  - framework-docs-expert
  - external-research-expert
  - session-history-expert
```

---

## 6.3 P2/P3 可插拔包

```text
Team Context Pack
  - team-discussion-research-expert
  - issue-intelligence-expert

External Tool Pack
  - figma-sync-expert
  - pr-feedback-resolution-expert

Style Profile Pack
  - rails-style-profile-dhh
  - readme-style-profile-ankane

Domain Pack
  - healthcare-domain
  - media-domain
  - ops-domain
  - finance-domain
```

这些全部显式 opt-in，不进默认核心能力。

---

# 7. Asset 与 Capability Registry 设计

## 7.1 必须引入结构化资产身份

不能只用 `frontmatter.name` 作为全局 canonical id。

必须拆成：

```text
assetId
sourceRelativeDir
runtimeName
frontmatterName
sourceProject
sourceVersion
sourcePath
transformNotes
capabilityPack
capabilityRole
```

示例：

```json
{
  "assetId": "ecc.core-engineering.api-design",
  "sourceProject": "everything-claude-code",
  "sourceVersion": "pinned-commit-or-hash",
  "sourcePath": "skills/api-design/SKILL.md",
  "sourceRelativeDir": "skills/ecc/api-design",
  "frontmatterName": "ecc-api-design",
  "runtimeName": "ecc-api-design",
  "capabilityPack": "ecc-core-engineering",
  "capabilityRole": "internal_reference_lens",
  "transformNotes": [
    "removed command references",
    "removed direct agent invocation",
    "converted to spec-first lens output contract"
  ]
}
```

---

## 7.2 SkillSourceIndex

新增 `SkillSourceIndex`，递归扫描：

```text
skills/**/SKILL.md
```

输出结构：

```json
{
  "schema_version": "spec-first.skill-source-index.v1",
  "skills": [
    {
      "assetId": "ecc.core-engineering.api-design",
      "sourceRelativeDir": "skills/ecc/api-design",
      "frontmatterName": "ecc-api-design",
      "runtimeName": "ecc-api-design",
      "delivery": "internal_only",
      "capabilityPack": "ecc-core-engineering",
      "enabledByDefault": false
    }
  ]
}
```

所有 sync / dry-run / inspect / adapter rewrite / doctor / clean 都基于这个 index，不再假设 `skills/<skillName>/SKILL.md` 一级目录。

---

## 7.3 Capability Pack Manifest

建议新增：

```text
src/cli/contracts/capability-packs/ecc-packs.json
```

示例：

```json
{
  "schema_version": "spec-first.capability-packs.v1",
  "packs": [
    {
      "id": "ecc-core-engineering",
      "provider": "ecc",
      "cli_name": "core-engineering",
      "default_enabled": false,
      "status": "experimental",
      "assets": [
        "ecc.core-engineering.api-design",
        "ecc.core-engineering.security-review-lite",
        "ecc.core-engineering.testing-strategy",
        "ecc.core-engineering.accessibility",
        "ecc.core-engineering.debugging-patterns",
        "ecc.core-engineering.mcp-server-patterns"
      ],
      "forbidden_asset_types": [
        "command",
        "hook",
        "agent"
      ],
      "delivery": {
        "claude": "internal_skill",
        "codex": "internal_skill"
      }
    }
  ]
}
```

---

## 7.4 Agent Registry 终态 Schema

终态再引入：

```json
{
  "schema_version": "spec-first.agent-registry.v1",
  "agents": [
    {
      "id": "scope-guardian-expert",
      "display_name": "Scope Guardian Expert",
      "origin": {
        "source": "ecc-inspired",
        "ecc_agent": "ce-scope-guardian-reviewer"
      },
      "category": "document_review",
      "default_priority": "P0",
      "allowed_workflows": [
        "spec-brainstorm",
        "spec-doc-review",
        "spec-plan"
      ],
      "trigger_signals": [
        "large_scope",
        "multi_team",
        "premature_abstraction",
        "unclear_requirement_boundary"
      ],
      "required_inputs": [
        "user_request",
        "current_doc",
        "repo_profile"
      ],
      "forbidden_actions": [
        "write_files",
        "change_workflow_state",
        "modify_repo_profile"
      ],
      "output_schema": "spec-first.agent-finding.v1"
    }
  ]
}
```

但这个是 **Post-MVP**，不能作为 MVP 前置阻塞。

---

# 8. Routing 设计

## 8.1 两阶段路由

```text
Stage 1: Cheap Router
  输入：
    workflow
    user request
    file paths
    diff stats
    explicit flags
    risk keywords
  输出：
    candidate lenses / agents

Stage 2: Evidence Builder
  只为 selected capabilities 准备上下文
  不给未选择专家准备重上下文
```

这样避免：

```text
所有专家都加载
所有 standards 都加载
所有 graph facts 都加载
```

---

## 8.2 Router 输入

```json
{
  "workflow": "spec-code-review",
  "stage": "code_review",
  "spec_id": "2026-05-04-001",
  "user_request": "",
  "changed_files": [],
  "diff_summary": {},
  "risk_signals": [],
  "tech_stack_signals": [],
  "graph_readiness": {},
  "repo_profile": {},
  "team_standards": {},
  "available_capabilities": {},
  "artifact_paths": {}
}
```

---

## 8.3 Router 输出

```json
{
  "schema_version": "spec-first.capability-routing.v1",
  "workflow": "spec-code-review",
  "selected_capabilities": [
    {
      "id": "correctness-review-expert",
      "kind": "agent",
      "priority": "P0",
      "reason": "default_code_review_core",
      "evidence_budget": "medium",
      "required_inputs": [
        "diff",
        "changed_files",
        "plan"
      ]
    },
    {
      "id": "api-contract-expert",
      "kind": "agent",
      "priority": "P0",
      "reason": "api_schema_changed",
      "evidence_budget": "high",
      "required_inputs": [
        "diff",
        "api_files",
        "graph_callers"
      ]
    }
  ],
  "skipped_capabilities": [
    {
      "id": "ios-mobile-review-expert",
      "reason": "no_ios_or_mobile_files_changed"
    }
  ],
  "degraded_mode": {
    "enabled": false,
    "reason": null
  }
}
```

---

## 8.4 路由信号

### Workflow-based

| Workflow                     | 默认专家/镜片                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `spec-brainstorm`            | product、scope、flow                                       |
| `spec-doc-review`            | coherence、feasibility、scope、adversarial                  |
| `spec-plan`                  | architecture、repo research、feasibility、simplicity        |
| `spec-write-tasks`           | coherence、testing、architecture                           |
| `spec-work`                  | minimal，按需                                               |
| `spec-debug`                 | correctness、reliability、history                          |
| `spec-code-review`           | correctness、testing、maintainability、simplicity、standards |
| `spec-app-consistency-audit` | product、flow、design、app/mobile                           |
| `spec-compound`              | knowledge、pattern、standards                              |
| `spec-skill-audit`           | agent-native、coherence、simplicity、standards              |

### File-based

| 信号                                                 | 触发                                                 |
| -------------------------------------------------- | -------------------------------------------------- |
| `*.ts`, `*.tsx`                                    | `typescript-expert`                                |
| `*.py`                                             | `python-expert`                                    |
| `*.swift`, `ios/`, `xcodeproj`                     | `ios-mobile-review-expert`                         |
| `migration`, `schema`, `prisma`, `sql`             | `data-integrity-expert`, `migration-safety-expert` |
| `openapi`, `swagger`, `proto`, `dto`, `api`        | `api-contract-expert`                              |
| `auth`, `permission`, `token`, `session`, `crypto` | `security-code-review-expert`                      |
| `queue`, `job`, `retry`, `worker`                  | `reliability-review-expert`                        |
| `i18n`, `locale`, `translations`                   | `i18n-expert`                                      |
| `analytics`, `track`, `event`                      | `analytics-expert`                                 |
| `CLAUDE.md`, `AGENTS.md`, `repo-profile.yaml`      | `project-standards-expert`                         |
| `skills/**/SKILL.md`, `agents/**`                  | `agent-native-design-expert`, `skill-audit`        |

### Risk-based

| 风险                 | 触发                                                                            |
| ------------------ | ----------------------------------------------------------------------------- |
| 多端协作               | `api-contract-expert`, `spec-flow-expert`                                     |
| 多团队交付              | `scope-guardian-expert`, `coherence-expert`                                   |
| 生产数据变更             | `data-integrity-expert`, `deployment-readiness-expert`                        |
| 大规模重构              | `architecture-expert`, `git-history-expert`, `adversarial-code-review-expert` |
| 新技术栈               | `framework-docs-expert`, `best-practices-research-expert`                     |
| graph readiness 不足 | degraded mode + confidence 降级                                                 |
| 用户明确深审             | adversarial / security deep / performance                                     |

---

# 9. Context Pack 设计

每个专家拿到的是最小上下文包，而不是全仓库。

```json
{
  "schema_version": "spec-first.context-pack.v1",
  "capability_id": "architecture-expert",
  "workflow": "spec-plan",
  "task": "Review architecture feasibility and boundary risks.",
  "context": {
    "user_intent": "...",
    "requirement_summary": "...",
    "plan_summary": "...",
    "repo_profile_summary": "...",
    "graph_facts_summary": "...",
    "reuse_candidates_summary": "...",
    "known_constraints": "...",
    "open_questions": "..."
  },
  "boundaries": {
    "must_do": [
      "identify architecture risks",
      "identify boundary concerns",
      "mark uncertainty"
    ],
    "must_not_do": [
      "do not rewrite the full plan",
      "do not invent code facts",
      "do not make final decision",
      "do not modify repo-profile"
    ]
  },
  "expected_output": {
    "format": "spec-first.agent-finding.v1"
  }
}
```

---

# 10. Expert Finding 输出协议

所有专家统一输出：

```json
{
  "schema_version": "spec-first.agent-finding.v1",
  "agent": "correctness-review-expert",
  "workflow": "spec-code-review",
  "finding_id": "CR-001",
  "severity": "blocker",
  "confidence": "high",
  "category": "correctness",
  "title": "Retry state may be persisted before transaction commit",
  "evidence": [
    {
      "type": "file",
      "path": "src/jobs/retry.ts",
      "lines": "42-67"
    },
    {
      "type": "plan",
      "path": "docs/specs/.../Plan.md",
      "section": "Retry design"
    }
  ],
  "impact": "May create duplicate retries after process crash",
  "recommendation": "Persist retry state inside the same transaction or make retry operation idempotent",
  "suggested_tests": [
    "simulate crash between state write and transaction commit"
  ],
  "requires_human_decision": false
}
```

Severity：

```text
blocker = 必须修复
high    = 强烈建议修复
medium  = 应修复但不阻断
low     = 可选优化
note    = 观察项
```

Confidence：

```text
high    = 明确证据
medium  = 间接证据
low     = 推测性建议
unknown = 输入不足 / degraded mode
```

---

# 11. Skill Synthesis 规则

专家输出不是最终结论。

Skill 必须做：

```text
merge
dedupe
rank
downgrade
upgrade
adopt
reject
final verdict
```

## 11.1 合并

例如：

```text
security expert:
  新 API 缺鉴权

api contract expert:
  permission contract 未声明

project standards expert:
  违反 API governance

synthesis:
  合并为一个 blocker：新增 API 缺少权限合约与实现
```

---

## 11.2 去噪

删除：

```text
无证据建议
与当前 diff 无关建议
重复建议
越界流程建议
与 confirmed standards 冲突的建议
```

---

## 11.3 定级

最终 severity 由 Skill 决定。

```text
单个 agent high + 证据不足
  → medium + needs confirmation

correctness + testing + reliability 指向同一问题
  → blocker
```

---

## 11.4 优先级

冲突时优先级：

```text
1. 用户本次明确指令
2. repo-profile confirmed standards
3. pinned team standards
4. code facts / graph facts
5. docs / README / manifest
6. agent finding
7. external best practice
```

---

# 12. Skill 级集成方案

## 12.1 `spec-brainstorm`

目标：把模糊需求变成清晰问题空间。

接入：

```text
product-lens-expert
scope-guardian-expert
spec-flow-expert
external-research-expert
issue-intelligence-expert
```

输出增强：

```text
Problem framing
Users / scenarios
Assumptions
Scope boundaries
Multi-team impact
Open questions
Candidate specs
Evidence used
Agents invoked
```

---

## 12.2 `spec-doc-review`

目标：审查文档是否足够进入下一阶段。

接入：

```text
coherence-expert
feasibility-expert
scope-guardian-expert
security-plan-review-expert
adversarial-doc-review-expert
design-lens-expert
```

输出增强：

```text
Contradictions
Terminology drift
Missing assumptions
Feasibility risks
Scope creep risks
Security gaps
Required revisions
Optional suggestions
```

---

## 12.3 `spec-plan`

目标：把需求变成可执行技术方案。

接入：

```text
architecture-expert
repo-research-expert
git-history-expert
api-contract-expert
data-integrity-expert
security-plan-review-expert
feasibility-expert
simplicity-expert
framework-docs-expert
best-practices-research-expert
```

输出增强：

```text
Selected architecture
Alternatives considered
Rejected alternatives
Graph evidence
Reuse candidates
Integration points
API contract impact
Data impact
Security impact
Test strategy
Rollout strategy
Risks and mitigations
Agent findings summary
```

---

## 12.4 `spec-write-tasks`

目标：把 plan 编译成可执行任务包。

接入：

```text
coherence-expert
architecture-expert
api-contract-expert
testing-review-expert
scope-guardian-expert
deployment-readiness-expert
```

输出增强：

```text
Task groups
Execution order
Parallelizable tasks
Owner/team hints
Required context per task
Test commands
Review checkpoints
Depends-on / blocked-by
Rollback / release notes
```

---

## 12.5 `spec-work`

目标：执行 plan/tasks，不制造额外讨论。

接入要克制：

```text
repo-research-expert
framework-docs-expert
testing-review-expert
simplicity-expert
deployment-readiness-expert
```

限制：

```text
最多 1-2 个专家
只解决当前实现问题
不重写 plan
不扩大 scope
```

---

## 12.6 `spec-debug`

接入：

```text
correctness-review-expert
reliability-review-expert
git-history-expert
data-integrity-expert
frontend-async-race-expert
security-code-review-expert
framework-docs-expert
```

输出：

```text
Symptom
Reproduction
Suspected root cause
Evidence
Fix options
Selected fix
Regression tests
```

---

## 12.7 `spec-code-review`

默认 P0：

```text
correctness-review-expert
testing-review-expert
maintainability-review-expert
simplicity-expert
project-standards-expert
```

条件触发：

```text
security-code-review-expert
api-contract-expert
data-integrity-expert
migration-safety-expert
performance-review-expert
reliability-review-expert
typescript-expert
python-expert
ios-mobile-review-expert
frontend-async-race-expert
adversarial-code-review-expert
generated-artifact-drift-expert
```

输出：

```text
Executive summary
Blocking issues
High-risk issues
Non-blocking issues
Test gaps
Architecture concerns
Security concerns
Standards violations
Overengineering signals
Agent findings summary
Final verdict
```

---

## 12.8 `spec-app-consistency-audit`

接入：

```text
product-lens-expert
spec-flow-expert
design-lens-expert
design-implementation-expert
ios-mobile-review-expert
frontend-async-race-expert
api-contract-expert
analytics-expert
i18n-expert
industry-rule-expert
```

注意：

```text
analytics-expert / i18n-expert / industry-rule-expert
不一定来自 ECC，应作为 spec-first 自有专家补齐
```

---

## 12.9 `spec-compound`

接入：

```text
knowledge-reuse-expert
pattern-recognition-expert
git-history-expert
project-standards-expert
```

输出：

```text
Problem
Decision
Implementation pattern
Reusable checklist
Anti-pattern
Linked specs/plans/reviews
Standard candidates
```

---

## 12.10 `spec-skill-audit`

接入：

```text
agent-native-design-expert
project-standards-expert
coherence-expert
simplicity-expert
security-deep-audit-expert
cli-readiness-expert
pattern-recognition-expert
```

输出：

```text
Source skill quality
Runtime delivery drift
Prompt boundary issues
Agent routing issues
Security issues
Duplicated logic
Overengineering
Recommended patches
```

---

# 13. Standards 与团队规范集成

## 13.1 标准来源优先级

```text
1. 用户本次明确指令
2. repo-profile.yaml confirmed fields
3. pinned team standards
4. 项目 docs / README / CLAUDE.md / AGENTS.md
5. graph observed evidence
6. manifest/config inferred facts
7. agent suggestions
```

---

## 13.2 团队规范仓库结构

```text
team-standards/
  README.md
  global/
    engineering-principles.md
    code-review-policy.md
    changelog-policy.md
    security-baseline.md
  frontend/
    architecture.md
    api-contract.md
    component.md
    i18n.md
    analytics.md
  mobile/
    app-architecture.md
    kmp.md
    ios.md
    android.md
    analytics.md
  backend/
    api.md
    database.md
    migration.md
    reliability.md
    observability.md
  ai-coding/
    claude.md
    codex.md
    agents.md
    prompt-style.md
  index.yaml
```

---

## 13.3 `index.yaml`

```yaml
schema_version: team-standards-index.v1
standards:
  - id: global.changelog
    title: Changelog Governance
    path: global/changelog-policy.md
    applies_to:
      workflows:
        - spec-work
        - spec-code-review
      file_patterns:
        - "src/**"
        - "packages/**"
    severity: blocker

  - id: backend.database-migration
    title: Database Migration Safety
    path: backend/migration.md
    applies_to:
      file_patterns:
        - "**/migrations/**"
        - "**/*.sql"
    agents:
      - data-integrity-expert
      - migration-safety-expert
```

---

# 14. 多端、多团队、大需求支持

## 14.1 一个业务需求，一个 spec_id

不默认拆成多个 spec_id。

推荐：

```text
一个业务需求 = 一个 spec_id
多个团队交付 = 多个 workstream
每个 workstream 有 tasks / owner / contracts / verification
```

目录：

```text
docs/specs/2026-05-04-001-market-feature/
  Brainstorm.md
  PRD.normalized.md
  Design.md
  Plan.md
  Tasks.md

  workstreams/
    app/
      Tasks.md
      Review.md
    h5/
      Tasks.md
      Review.md
    admin/
      Tasks.md
      Review.md
    backend-core/
      Tasks.md
      Review.md
    backend-market/
      Tasks.md
      Review.md

  contracts/
    api-contract.md
    event-contract.md
    analytics-contract.md
    release-contract.md
```

---

## 14.2 多团队专家路由

| 场景           | 必选专家                                                          |
| ------------ | ------------------------------------------------------------- |
| 多端需求拆分       | `spec-flow-expert`, `api-contract-expert`, `coherence-expert` |
| 后端接口影响前端/App | `api-contract-expert`, `product-lens-expert`                  |
| 多团队任务拆分      | `scope-guardian-expert`, `architecture-expert`                |
| 埋点/数据看板      | `analytics-expert`, `api-contract-expert`                     |
| i18n         | `i18n-expert`, `design-lens-expert`                           |
| 发版风险         | `deployment-readiness-expert`, `reliability-review-expert`    |

---

# 15. 多仓模式支持

## 15.1 单仓单项目

```text
repo/
  .spec-first/
  src/
  docs/
```

使用当前 repo graph facts / standards / diff。

---

## 15.2 单仓多模块

```text
repo/
  .spec-first/
  apps/app/
  apps/admin/
  packages/core/
  services/api/
```

不在每个 module 建 `.spec-first`。Router 通过 module map 判断影响范围。

---

## 15.3 多仓工作区

```text
workspace/
  app-repo/
    .spec-first/
  h5-repo/
    .spec-first/
  backend-repo/
    .spec-first/
  workspace-summary/
```

父目录只做 advisory workspace summary，不拥有 child repo canonical artifacts。

---

# 16. Runtime 产物设计

```text
.spec-first/
  agent-routing/
    runs/
      <run-id>/
        routing-input.json
        routing-decision.json
        context-packs/
          <capability-id>.json
        agent-findings.jsonl
        synthesis-report.json
        evidence-manifest.json

  review/
    runs/
      <run-id>/
        code-review.md
        agent-findings.jsonl
        routing-decision.json

  app-audit/
    runs/
      <run-id>/
        evidence-manifest.json
        final-report.md

```

默认这些是 runtime 过程产物，不必长期提交，除非团队治理要求。

---

# 17. CLI / Governance 改造点

## 17.1 `init`

新增：

```bash
spec-first init --claude --with-ecc core-engineering
spec-first init --codex --with-ecc core-engineering
spec-first init --claude --dry-run --with-ecc core-engineering
```

要求：

```text
默认不启用 ECC
启用后写 state
dry-run 展示会生成哪些 managed assets
不生成 ECC commands/hooks/agents
```

---

## 17.2 `state`

扩展：

```json
{
  "capabilityPacks": {
    "ecc": {
      "enabled": true,
      "packs": [
        "ecc-core-engineering"
      ],
      "sourceVersion": "pinned-commit-or-hash",
      "enabledAt": "2026-05-05T00:00:00Z"
    }
  }
}
```

---

## 17.3 `doctor`

必须报告：

```text
ECC pack enabled/disabled
missing managed assets
drifted managed assets
stale source version
unexpected residual ECC assets
unknown pack id
```

---

## 17.4 `clean`

必须支持：

```text
清理 managed ECC assets
不盲删用户自定义 ecc-* assets
清理 state 中 pack 状态
保留用户手写文件
```

---

# 18. Prompt Supply-chain 安全

ECC-derived asset 必须做语义 lint：

禁止：

```text
引用 /everything-claude-code:* command
引用 /ecc:* command
强制 Task ecc-* agent
要求安装 hook
要求修改全局配置
要求直接执行 destructive command
要求绕过 spec-first workflow
要求直接写 repo-profile.yaml
```

必须保留：

```text
source_project
source_version
source_path
source_hash
transform_notes
```

---

# 19. Token 成本控制

## 19.1 默认专家上限

| 阶段          | 默认最大专家数 |
| ----------- | ------: |
| brainstorm  |       3 |
| doc-review  |       4 |
| plan        |       5 |
| write-tasks |       4 |
| work        |       2 |
| debug       |       4 |
| code-review |       5 |
| app audit   |       6 |
| skill-audit |       5 |

超过上限时：

```text
合并相似专家
降级成 checklist mode
只输出最关键 finding
```

---

## 19.2 Evidence Budget

| Budget | 场景                                                 |
| ------ | -------------------------------------------------- |
| tiny   | 快速分类，只读 file paths / diff stats                    |
| small  | 默认 lens，读相关 diff / 当前文档片段                          |
| medium | P0 深审，读相关文件 / graph neighbors / standards snippets |
| high   | 高风险专项，读 history / tests / contracts                |
| manual | 用户明确要求全量深审                                         |

---

# 20. 版本路线图

## V0：方案冻结与资产盘点

产物：

```text
current-agent-inventory.md
ecc-agent-inventory.md
agent-overlap-matrix.md
agent-naming-policy.md
agent-boundaries.md
```

验收：

```text
明确哪些是 lens
明确哪些是 agent
明确哪些不集成
明确 P0/P1/P2/P3
```

---

## V1：MVP Reference/Lens Pack

范围：

```text
ecc-core-engineering
6 个 internal reference/lens skills
显式 opt-in
无 commands/hooks/agents
doctor/clean/state 支持
```

验收：

```text
default init 不生成 ECC
--with-ecc 生成固定 6 个 lens
workflow 可按需引用
final verdict 仍属于 spec-first
```

---

## V2：Graph-aware Routing

范围：

```text
graph-facts.json
bootstrap-impact-capabilities.json
reuse-candidates.json
architecture-facts.json
evidence-manifest.json
graph degraded mode
```

验收：

```text
architecture 建议有 graph evidence
review 能说明影响面
graph 不可用时标注 confidence 降级
```

你上传的路线图里也把 V2 定为 Graph-aware Agent Routing，目标是让 agent 不只看文本，而是消费 graph readiness 和 code facts，并明确 graph 缺失时不能假装可用。

---

## V3：P1 条件专家包

范围：

```text
Security Deep Pack
Performance Pack
Data Pack
Frontend/App Pack
Language Pack
Research Pack
```

验收：

```text
TS/Python/iOS 自动按技术栈启用
migration 自动触发 data/migration 专家
App audit 覆盖设计/代码/路由/埋点/i18n
性能专家只在相关风险出现时启用
```

---

## V4：Standards Ingestion

范围：

```text
team standards git repo
repo-profile confirmed fields
standards preview
standards apply
project-standards-expert
```

验收：

```text
能导入团队规范仓库
能预览影响范围
能引用 standards snippets
不把规范全文塞进上下文
不静默写 repo-profile
```

---

## V5：多端 Workstream Orchestration

范围：

```text
single spec_id
multiple workstreams
contracts
team task packs
cross-team review
```

验收：

```text
一个 spec_id 承载多端需求
每个团队有独立任务包
跨团队接口、事件、埋点有 contract
最终 review 有全局合成结论
```

---

## V6：PR / CI / Release 集成

范围：

```text
PR comments
CI artifacts
test reports
release checklist
deployment readiness
```

验收：

```text
PR 评论进入 work/review
CI 失败进入 debug
release 前输出 Go/No-Go
PR 描述能追踪 spec/plan/tasks/review
```

---

## V7：多宿主 Runtime Delivery

范围：

```text
Claude
Codex
Cursor
future hosts
```

验收：

```text
同一套 capability 能投递到不同宿主
宿主不支持 subagent 时降级为 inline checklist
不会因某宿主能力不足阻断主流程
```

你上传的全量路线图里也明确了后续需要多宿主交付、host capability detection、fallback mode、runtime drift audit，终态目标是同一套专家能力可投递到 Claude / Codex / Cursor 等宿主。

---

## V8：Agent Governance Platform

终态能力：

```text
完整工程闭环
graph-aware evidence
团队规范仓库
多端多团队大需求
动态专家路由
PR / CI / Release
知识沉淀和复用
skill/agent 自审和演化
多宿主 runtime delivery
外部 agent framework 能力吸收
```

终态表达：

```text
Skill owns the workflow.
Agent owns the expert judgment.
Graph owns the evidence.
Standards own the boundary.
Synthesis owns the final decision.
Knowledge owns the compounding.
```

---

# 21. 测试策略

## 21.1 单元测试

| 对象                | 测试点                                         |
| ----------------- | ------------------------------------------- |
| SkillSourceIndex  | recursive scan、frontmatter name、runtimeName |
| capability pack   | pack id、asset list、unknown pack             |
| governance schema | capability_pack、capability_role             |
| state             | capabilityPacks read/write/normalize        |
| doctor            | missing/drifted/stale/residual              |
| clean             | managed-only cleanup                        |
| router            | workflow/file/risk signals                  |
| finding schema    | severity/confidence/evidence                |
| synthesis         | merge/dedupe/rank/downgrade                 |

---

## 21.2 Golden Tests

固定场景：

```text
TS API breaking change
Python data migration
iOS UI state issue
multi-team PRD
large refactor
security-sensitive diff
skill-audit on bad SKILL.md
default init no ECC
--with-ecc core-engineering
```

断言：

```text
selected capabilities 正确
skipped capabilities 合理
findings schema 合法
final report 有 evidence
degraded mode 正确披露
default init 不泄漏 ECC
doctor/clean 行为正确
```

---

## 21.3 E2E

```text
spec-brainstorm
  → spec-doc-review
  → spec-plan
  → spec-write-tasks
  → spec-work
  → spec-code-review
  → spec-compound
```

检查：

```text
产物完整
agent routing 可追踪
review 引用 plan/tasks
compound 沉淀最终经验
```

---

# 22. 风险矩阵

| 风险              | 表现                                | 解决方案                                 |
| --------------- | --------------------------------- | ------------------------------------ |
| token 暴涨        | 每次调用太多专家                          | 两阶段路由、专家上限、budget policy             |
| agent 噪音        | 输出重复、泛泛建议                         | finding schema、evidence、synthesis 去噪 |
| 架构污染            | ECC command/skill 反向主导 spec-first | 不导入 commands/hooks，ECC 只做 lens       |
| runtime 泄漏      | 未启用 ECC 仍生成 ecc-*                 | pack-gated delivery + doctor         |
| agent 越权        | agent 写文件、改状态                     | forbidden actions + skill-only write |
| graph 不可用       | 专家假装知道影响面                         | readiness 检查 + confidence 降级         |
| 标准冲突            | team standards 与 repo-profile 冲突  | source priority + conflict report    |
| 宿主差异            | Claude/Codex/Cursor 支持不同          | host capability detection + fallback |
| supply-chain 风险 | ECC 原文包含越权语义                      | source lock + semantic lint          |
| 过度设计            | 一上来做全量 provider                   | MVP 只做 6 个 lens                      |

这些风险与上传方案中的风险矩阵一致：重点风险包括 token 暴涨、agent 噪音、ECC 架构污染、外部工具依赖、标准冲突、graph 不可用、agent 越权和宿主差异。

---

# 23. 最小开发任务顺序

## Task 1：冻结技术方案文档

```text
docs/2026-05-04-ecc-agent-integration-final/
  TECHNICAL_PLAN.md
  MVP_SCOPE.md
  AGENT_MAPPING.md
  ROUTING_POLICY.md
  FINDINGS_SCHEMA.md
  SYNTHESIS_POLICY.md
  VERSION_ROADMAP.md
```

---

## Task 2：实现 SkillSourceIndex

```text
src/cli/skill-source-index.js
src/cli/skill-source-index.test.js
```

职责：

```text
递归扫描 skills/**/SKILL.md
读取 frontmatter
生成 assetId/runtimeName/sourceRelativeDir
检查 name 唯一性
支持 dry-run/inspect/sync/doctor/clean 复用
```

---

## Task 3：扩展 governance schema

```text
src/cli/contracts/dual-host-governance/skills-governance.schema.json
src/cli/contracts/capability-packs/ecc-packs.json
```

新增字段：

```text
capability_pack
capability_role
asset_id
source_project
source_version
source_path
transform_notes
```

---

## Task 4：新增 MVP ECC Lens Source

```text
skills/ecc/api-design/SKILL.md
skills/ecc/security-review-lite/SKILL.md
skills/ecc/testing-strategy/SKILL.md
skills/ecc/accessibility/SKILL.md
skills/ecc/debugging-patterns/SKILL.md
skills/ecc/mcp-server-patterns/SKILL.md
```

每个 lens 必须遵循统一输出：

```text
applicable: yes/no/partial
evidence:
top_risks:
suggested_changes:
not_reviewed:
verdict: none
```

注意：lens 不输出 final verdict。

---

## Task 5：改造 init

支持：

```text
--with-ecc core-engineering
--dry-run
help/usage 更新
state 写入
runtime asset filtering
```

---

## Task 6：改造 doctor / clean

doctor 检查：

```text
enabled/disabled
missing
drifted
stale
residual
unknown pack
```

clean 行为：

```text
只清理 managed ECC assets
不按 ecc-* 盲删
清理 pack state
```

---

## Task 7：接入 workflow reference gating

先改：

```text
spec-plan
spec-code-review
spec-debug
spec-app-consistency-audit
spec-mcp-setup
```

要求：

```text
只有 ECC pack enabled 时才允许引用 ecc-* lens
引用时必须 fallback
final verdict 仍属于原 workflow
```

---

## Task 8：补测试

```text
default init 不生成 ecc-*
--with-ecc 生成 6 个 lens
Codex / Claude dry-run 稳定
doctor 能发现 missing/drifted
clean 能清理 managed ECC assets
不生成 ECC commands/hooks/agents
reference gating 不泄漏
```

---

# 24. 最终验收标准

## 24.1 MVP 验收

```text
default init 不生成 ECC assets
--with-ecc core-engineering 显式启用
只生成 6 个 internal reference/lens skills
不导入 commands/hooks/agents
doctor/clean 支持 pack lifecycle
workflow 可按需引用 lens
lens 输出不包含 final verdict
final verdict 仍由 spec-first skill 决定
```

---

## 24.2 终态验收

```text
P0 experts 可被对应 skill 调用
P1 experts 能按风险和文件信号触发
每次调用都有 reason
每个 finding 有 evidence/confidence/severity
Skill synthesis 有采纳/拒绝/降级说明
Graph 不可用时不假装可用
Standards 写入必须 preview-first
多端 workstream 可被 plan/tasks/review 支持
多宿主 runtime 可降级
```

---

# 25. 最终推荐

最终采用这条路线：

```text
V1:
  ECC = opt-in internal reference/lens pack
  只接 6 个 core engineering lens
  不接 commands/hooks/agents

V2:
  接 graph-aware routing
  让 lens/expert 消费 graph facts / standards / diff

V3:
  接 P1 条件专家包
  按安全、性能、数据、前端、语言、研究分包启用

V4:
  接团队 standards ingestion
  形成 standards preview / apply / conflict report

V5:
  支持多端大需求 workstream orchestration

V6:
  接 PR / CI / Release

V7:
  做多宿主 runtime delivery

V8:
  形成 Agent Governance Platform for AI Engineering
```

最关键的一句话：

```text
不要把 ECC 当成第二套 workflow。
要把 ECC 当成 spec-first 专家能力层的第一个外部能力来源。
```

这版方案的最终落点是：

```text
spec-first 继续负责工程闭环；
ECC 只提供可治理、可裁剪、可验证的专家能力；
所有专家判断都必须被证据约束；
所有最终结论都必须由 Skill Synthesis 裁判；
所有长期规则都必须 preview-first；
所有 runtime 资产都必须 pack-gated、doctor-able、clean-able。
```

这样才真正实现你要的目标：

> **提升 spec-first 的专家团队能力，而不是堆更多 agent。**
