# Skill 体系 Harness 化审查与压缩治理报告

> 审查日期：2026-07-02
> 审查方法：基于 `docs/10-prompt/审查整个 skill 是否具备 Harness 能力.md` 15步审查框架，5轮深度分析
> 审查范围：spec-first `skills/` 目录全量 Skill，重点覆盖 10 个核心 workflow skill
> 审查轮次：5轮（理解→关系图谱→逐Skill Harness→内容分类→不可丢失约束→Harness设计→治理）

---

## 1. Skill 体系理解摘要

### 1.1 当前 Skill 概览

spec-first 共有 **37 个 skill 目录**，其中核心 workflow skill 10 个，辅助 / 工具 skill 若干：

| 类别 | Skill 列表 |
|---|---|
| 入口路由 | `using-spec-first` |
| 需求探索 | `spec-ideate`、`spec-brainstorm`、`spec-prd` |
| 执行规划 | `spec-plan`、`spec-write-tasks` |
| 实现执行 | `spec-work` |
| 评审 | `spec-code-review`、`spec-doc-review` |
| 调试 | `spec-debug` |
| 知识沉淀 | `spec-compound`、`spec-compound-refresh` |
| 元治理 | `spec-skill-audit`、`spec-optimize`、`spec-team-standards-governance` |
| 工具 skill | `git-commit`、`git-commit-push-pr`、`git-worktree`、`proof`、`resolve-pr-feedback`、`git-clean-gone-branches`、`report-bug`、`spec-mcp-setup`、`spec-sessions`、`spec-slack-research`、`spec-release-notes`、`spec-write-skill` |
| 技术域 skill | `agent-native-architecture`、`spec-dhh-rails-style`、`spec-polish-beta`、`spec-app-consistency-audit`、`spec-sessions`、`test-browser`、`test-xcode`、`frontend-design`、`gemini-imagegen`、`feature-video`、`changelog` |

### 1.2 核心链路

```text
Codebase -> Spec (brainstorm/prd) -> Plan -> Tasks (write-tasks) -> Code (work) -> Review (code-review/doc-review) -> Knowledge (compound)
```

`using-spec-first` 作为入口元 skill，负责将用户意图路由到上述各节点。

### 1.3 各 Skill 目标与研发阶段

| Skill | 研发阶段 | 目标 | 核心输入 | 核心输出 |
|---|---|---|---|---|
| using-spec-first | 全局 | 意图路由，阻止随意执行 | 用户意图 + host context | 公开 workflow 入口或直接执行指令 |
| spec-brainstorm | 需求探索 | 澄清 WHAT，解决 scope/user/behavior 未定 | feature/problem 描述 | docs/brainstorms/ 需求文档 |
| spec-prd | 需求澄清 | Brownfield PRD 撰写与精炼 | increment 请求 + 已有 PRD | docs/brainstorms/*-requirements.md |
| spec-plan | 技术规划 | 将需求转为可执行 HOW plan | 需求文档 / feature 描述 | docs/plans/*.md |
| spec-write-tasks | 任务编译 | 将 plan 派生为 task pack（可选） | settled plan | docs/tasks/*.md task pack |
| spec-work | 实现执行 | 执行 settled plan/task pack | plan 路径 / task pack / bare prompt | code diff + 验证结果 + handoff summary |
| spec-code-review | 代码评审 | 结构化 diff 评审，多 persona，confidence-gated | branch diff / PR | 评审 findings 报告 |
| spec-doc-review | 文档评审 | 需求/计划/task pack 质量审查 | 文档路径 | findings 报告 + auto fix |
| spec-debug | 缺陷修复 | 系统性 root cause + fix | bug 描述 / issue ref / error | root cause + fix + verification |
| spec-compound | 知识沉淀 | 将已解决问题转为可复用知识 | 已解决问题上下文 | docs/solutions/*.md |
| spec-compound-refresh | 知识刷新 | 刷新过时知识文档 | 旧 docs/solutions/ 文档 | 更新后的知识文档 |
| spec-skill-audit | Skill 质量审查 | 审查 skill 工程质量 / runtime drift | skills/ 目录 | audit report |

### 1.4 总体成熟度判断

spec-first skill 体系在 **Execution Harness** 和 **Evidence Harness** 上已达到相当成熟度，核心 workflow skill（spec-prd、spec-work、spec-debug、spec-code-review）均有结构化执行阶段、明确的 failure mode 黑名单和 evidence tag 体系。

**主要缺口**在于：
- **Evaluation Harness** 不成体系（大多数 skill 缺少 eval cases）
- **Context Harness** 标准不统一（各 skill 自定义加载策略，无共享 policy）
- **Skill 长度过载**：spec-code-review(1242行)、spec-prd(294行)、spec-work(580行) 的 SKILL.md 超过最小执行契约目标
- **Knowledge Harness** 以 spec-compound 为中心但与其他 skill 的闭环较弱

---

## 2. Skill 关系图谱

### 2.1 Skill 拓扑图（ASCII）

```text
user intent
    │
    ▼
using-spec-first (入口路由)
    │
    ├─► spec-ideate ──────────────────────────────────────────────────► spec-brainstorm
    │                                                                         │
    ├─► spec-brainstorm ◄─────────────────────────────────────────────────────┘
    │       │ (requirements doc)
    │       ▼
    ├─► spec-prd ──────────────────────────────────────────────────────────────────┐
    │       │ (PRD-grade requirements)                                              │
    │       ▼                                                                      │
    ├─► spec-plan ──────────────────────────────────────────────────────────────── ┤
    │       │ (plan doc)                                                           │
    │       ├──► spec-write-tasks ──────────────────────────────────────────────── │
    │       │         │ (task pack)                                                 │
    │       ▼         ▼                                                             │
    ├─► spec-work ◄───┘                                                             │
    │       │ (code diff + verification)                                            │
    │       ├──► spec-code-review ──────────────────────────────────────────────── │
    │       │         │ (findings)                                                  │
    │       ▼         ▼                                                             │
    ├─► spec-debug ──► spec-compound ◄──────────────────────────────────────────── │
    │                      │ (docs/solutions/)                                      │
    │                      ▼                                                        │
    │                 spec-compound-refresh                                         │
    │                                                                               │
    └─► spec-doc-review ◄──────────────────────────────────────────────────────────┘
             (for PRD/plan/task-pack document review)
```

### 2.2 Skill 关系表

| Skill | Stage | 上游输入 | 下游消费方 | 核心产物 | Harness 能力 | 上下文需求 | 主要风险 |
|---|---|---|---|---|---|---|---|
| using-spec-first | 全局路由 | 用户意图 | 所有公开 workflow | 路由决策 | Execution(强)、Governance(强) | host instructions | 误路由 / 绕过路由 |
| spec-brainstorm | 需求探索 | feature/problem | spec-plan, owners | brainstorm doc | Context(中)、Execution(中)、Evidence(弱) | interaction rules, discovery flow | 边界不清，误入 prd/plan |
| spec-prd | 需求澄清 | increment request | spec-plan | requirements doc | Context(强)、Execution(强)、Evidence(强)、Validation(强) | grill-with-docs, evidence topology | checkpoint-as-escape 反模式 |
| spec-plan | 技术规划 | requirements/feature | spec-work, spec-write-tasks | plan doc | Context(强)、Execution(强)、Review(中) | planning-flow, reuse-analysis | 跨过 WHAT 直接规划 |
| spec-write-tasks | 任务编译 | plan | spec-work | task pack | Context(中)、Execution(强)、Validation(强) | task-pack-schema | hash mismatch / stale pack |
| spec-work | 实现执行 | plan/task pack | spec-code-review, spec-compound | code diff | Context(强)、Execution(强)、Evidence(强)、Review(中) | plan refs, nearby source | scope 扩散，验证缺失 |
| spec-code-review | 代码评审 | diff/PR | spec-compound, PR | findings report | Context(强)、Execution(强)、Review(强)、Evidence(强) | persona catalog, diff scope | findings 无证据, scope 越界 |
| spec-doc-review | 文档评审 | requirements/plan/task | spec-plan, spec-work | findings report | Context(中)、Execution(中)、Review(强) | subagent-template, findings schema | dispatch 未授权, 误判文档类型 |
| spec-debug | 调试 | bug/error/issue | spec-work, spec-compound | root cause + fix | Context(中)、Execution(强)、Evidence(强)、Validation(强) | anti-patterns, investigation | 跳过 reproduction, shotgun fix |
| spec-compound | 知识沉淀 | solved problem | spec-plan, spec-work | docs/solutions/ | Context(中)、Execution(中)、Knowledge(强) | schema.yaml, resolution-template | 未验证知识升级，重复文档 |
| spec-skill-audit | Skill 审查 | skills/ | spec-work, 人工 | audit report | Context(中)、Execution(中)、Governance(强) | audit rubrics | runtime drift 遗漏 |

### 2.3 职责重叠检查

| 重叠区域 | 涉及 Skill | 状态 | 说明 |
|---|---|---|---|
| PRD 澄清 vs Brainstorm | spec-brainstorm, spec-prd | 已明确分工 | brainstorm=0-1探索/WHAT不清, prd=brownfield PRD精炼 |
| 计划 Review | spec-plan 内置 confidence check vs spec-doc-review | 部分重叠 | spec-plan 内置 doc-review 集成; spec-doc-review 独立调用 |
| Anti-Rationalization 规则 | spec-work, spec-code-review, spec-debug | **规则重复** | 同一表格在三处维护，P2风险 |
| 知识沉淀触发 | spec-debug, spec-doc-review, spec-compound | 合理分工 | debug/doc-review 提供入口，compound 执行 |
| Evidence 分类词汇 | spec-prd, spec-code-review, spec-debug | **分类不统一** | prd=confirmed-source/user-stated/source-candidate, debug=evidence_for/against, code-review=P0-P3 confidence |

---

## 3. Harness 总体成熟度评估

### 3.1 8维 Harness 成熟度热力图

8维 Harness 不是 8 个顺序阶段，而是横切每个 skill 的工程能力层：它们共同回答「AI 在这个 workflow 中拿到什么上下文、如何执行、如何被审查、凭什么可信、怎样验证、如何沉淀、如何评估、由什么边界治理」。

| Harness 维度 | 关注问题 | Skill 体系中的典型机制 | 缺失时的主要风险 |
|---|---|---|---|
| Context Harness | 是否给 AI 正确、足够、不过量的上下文 | Reference Trigger Map、bounded source reads、context orientation、docs/solutions recall | 上下文缺失导致误判；上下文过载导致关键约束被稀释 |
| Execution Harness | 是否把任务从意图转成可跟踪执行路径 | phase 化 workflow、handoff shape、anti-rationalization red flags、scope gate | 直接跳到产出；执行路径不可复盘；scope 扩散 |
| Review Harness | 是否在产出前后有语义质量审查 | confidence check、persona review、findings schema、doc-review/code-review 集成 | 低质量产物进入下游；问题只能靠用户事后发现 |
| Evidence Harness | 结论、需求、finding、修复是否可追溯 | source refs、evidence tag、direct evidence boundary、logs/tests/diff 引用 | advisory 被当 confirmed；review 或 closeout 缺证据 |
| Validation Harness | 哪些不变量能由脚本或测试确定性验证 | checker、schema validation、reason_code、hash/receipt、最窄测试命令 | LLM 伪造完成状态；结构性错误进入下游 |
| Knowledge Harness | 已解决问题是否能沉淀并被下一次复用 | spec-compound、docs/solutions、promotion gate、invalidation condition | 同类问题重复调试；经验停留在单次对话 |
| Evaluation Harness | skill 修改后是否真的变好、是否退化 | golden/negative eval cases、fresh-source eval、semantic regression samples | prompt 压缩或重写后行为退化但不可见 |
| Governance Harness | source/runtime、权限、安全、降级边界是否清晰 | source/runtime discipline、mutation gate、public/internal entry boundary、degraded-mode record | 多真相源、越权执行、internal helper 外泄、静默降级 |

| Harness 维度 | using-spec-first | spec-brainstorm | spec-prd | spec-plan | spec-write-tasks | spec-work | spec-code-review | spec-doc-review | spec-debug | spec-compound | 总体 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Context Harness | 🟢强 | 🟡中 | 🟢强 | 🟡中 | 🟡中 | 🟢强 | 🟢强 | 🟡中 | 🟡中 | 🟡中 | **中偏强** |
| Execution Harness | 🟢强 | 🟡中 | 🟢强 | 🟢强 | 🟢强 | 🟢强 | 🟢强 | 🟢强 | 🟢强 | 🟡中 | **强** |
| Review Harness | 🔴弱 | 🔴弱 | 🟡中 | 🟡中 | 🔴弱 | 🟡中 | 🟢强 | 🟢强 | 🟡中 | 🔴弱 | **中** |
| Evidence Harness | 🟡中 | 🔴弱 | 🟢强 | 🟡中 | 🟡中 | 🟢强 | 🟢强 | 🟡中 | 🟢强 | 🟡中 | **中偏强** |
| Validation Harness | 🔴弱 | 🔴弱 | 🟢强 | 🟡中 | 🟢强 | 🟡中 | 🟢强 | 🟡中 | 🟢强 | 🟡中 | **中** |
| Knowledge Harness | 🔴弱 | 🔴弱 | 🔴弱 | 🔴弱 | 🔴弱 | 🔴弱 | 🟡中 | 🔴弱 | 🟡中 | 🟢强 | **弱** |
| Evaluation Harness | 🟡中 | 🟡中 | 🔴弱 | 🟡中 | 🟡中 | 🔴弱 | 🔴弱 | 🔴弱 | 🔴弱 | 🔴弱 | **弱** |
| Governance Harness | 🟢强 | 🔴弱 | 🟡中 | 🔴弱 | 🟡中 | 🟡中 | 🟡中 | 🟡中 | 🟡中 | 🟡中 | **中偏弱** |

**图例：** 🟢强(具备明确机制) 🟡中(部分具备) 🔴弱(缺失或不足)

### 3.2 总体评分

| 维度 | 评分（/10） | 说明 |
|---|---|---|
| Context Harness | 7 | 核心 skill 有 Reference Trigger Map，但无共享 policy |
| Execution Harness | 9 | phase 化执行、anti-rationalization、gate 机制健全 |
| Review Harness | 6 | code-review/doc-review 强；其余 skill 内置评审薄弱 |
| Evidence Harness | 7 | prd/debug/code-review 有完整 evidence 体系；brainstorm/compound 弱 |
| Validation Harness | 6 | prd/write-tasks/debug 有 CLI 验证；plan/brainstorm/doc-review 薄弱 |
| Knowledge Harness | 3 | 仅 compound 体系健全；其他 skill 无 knowledge feedback |
| Evaluation Harness | 3 | using-spec-first/brainstorm/plan/write-tasks 有部分 eval；大多数缺失 |
| Governance Harness | 5 | source/runtime 边界清晰；版本记录、共享规则不足 |
| **加权总分** | **5.8/10** | 执行强、知识沉淀弱、eval 极弱 |

---

## 4. 逐 Skill Harness 审查

### 4.1 using-spec-first

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Reference Files 按需加载策略清晰，9个 reference 均有触发条件 | 无 | — | 保持现状 |
| Execution Harness | 路由规则明确（8条路由优先级 + Route Map），Hard Rules 分离 | 无 | — | 保持 |
| Review Harness | **无内置 Review 机制**，仅依赖 fresh-source eval | 路由质量无结构化评审 | P2 | 增加 routing-posture eval cases 和定期 fresh-source eval 检查点 |
| Evidence Harness | routing-cases.json 作为 examples-as-context，非确定性路由器 | advisory evidence 无系统性记录 | P2 | 把 routing decision reason 记录到 handoff |
| Validation Harness | **无验证命令**，依赖 `spec-first init` 修复 | 路由准确性无可自动化验证 | P1 | 增加路由回归测试 evals |
| Knowledge Harness | 无 knowledge feedback loop | 路由误判经验无沉淀路径 | P2 | 路由误判发现后应提供到 compound 的跳转 |
| Evaluation Harness | 有 evals/examples.json, routing-cases.json, routing-discipline-cases.json | 无 negative cases, 无 evidence-class cases | P1 | 补充 negative cases 和 degraded evidence 场景 |
| Governance Harness | source/runtime 分离清晰，maintenance-and-fresh-source-eval.md 健全 | 无版本号，无正式变更记录 | P2 | 增加 skill version / changelog |

### 4.2 spec-brainstorm

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | 有 Phase-based reference loading，execution flow 指定 5个 reference 分阶段加载 | 无明确 Context Loading Policy 格式，no "禁止加载"声明 | P2 | 按共享 Context Loading Policy 格式重新表达 |
| Execution Harness | Route-Out Shape 清晰，Near-Neighbor Exit Cues 明确 | 主 workflow（assess→ask→synthesize→capture→handoff）过于简略，缺细化步骤 | P1 | 展开每个 phase 的输入/输出/gate |
| Review Harness | **无内置 Review 检查点** | 产出需求文档无质量门禁 | P1 | 在 Phase 3 capture 后增加 requirements completeness check |
| Evidence Harness | **无明确 Evidence 分类**，缺 fact/inference/hypothesis/suggestion 区分 | LLM 可凭经验填充需求，无法追溯 | P0 | 引入 evidence tag 体系；来自 source 的断言 vs 对话推断 必须标注 |
| Validation Harness | **无验证要求**，无验证命令 | 需求文档质量无可验证门禁 | P1 | 增加 PRD readiness self-check（对接 spec-prd 的 checker 格式） |
| Knowledge Harness | **无 knowledge feedback** | brainstorm 经验无沉淀 | P2 | 增加 Knowledge Harness Placeholder |
| Evaluation Harness | 有 evals/routing-cases.json，有 evaluation-governance.md | 无 golden output cases，无 output quality eval | P1 | 补充 golden brainstorm output cases |
| Governance Harness | 目录结构清晰，references 分离 | 无 owner 定义，无版本 | P2 | 增加 owner / version / review cadence |

### 4.3 spec-prd

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | **最强**：Reference Trigger Map 精确，7个 reference 均有触发条件 | SKILL.md 本体仍达294行，含大量 Phase 细节 | P1 | 将 Phase 细节（尤其Phase 1-3 大段落）外置到 references/ |
| Execution Harness | Workflow spine 清晰，Failure-Mode Blacklist 强，四法停点权威 | Decision Card 字段复杂（20+ 字段），认知负担重 | P2 | Decision Card 精简到8个核心字段 |
| Review Harness | Readiness Lens（Phase 4）是必选门禁，prd-prewrite-guard 存在 | Codex 无等效 guard（明文声明降级） | P1 | 完善 Codex 降级说明并加入 explicit check |
| Evidence Harness | 5级 evidence tag（confirmed-source/user-stated/source-candidate/external-research/assumption）最完整 | evidence 标注在 prose 中，无机器可读格式 | P2 | 输出模板中增加结构化 evidence tag 字段 |
| Validation Harness | finalize-prd-artifact.js + check-prd-artifact.js + reason-codes.js 三层验证 | 脚本路径依赖 host runtime，Codex 降级路径未加 explicit warning | P2 | 统一脚本路径抽象 |
| Knowledge Harness | **无 knowledge feedback loop** | PRD 模式无沉淀 | P2 | 增加 Knowledge Harness Placeholder |
| Evaluation Harness | evals/examples.json（2693行/111 cases，含 positive/boundary/route-out/failure/adversarial）| 无 negative-cases.json；无 CI runner；checkpoint-as-escape 场景无专用 negative | P1（降级，原P0）| 补充 negative eval cases（checkpoint-as-escape、direct-write-after-read） |
| Governance Harness | 有 claude runtime mutation guard | Codex guard 缺失，无 versioning | P1 | 补充 Codex 等效 guard 和版本记录 |

### 4.4 spec-plan

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | 3处 STOP 指令强制读 references（governance-boundaries, reuse-analysis, enterprise-plan-review） | 无 Context Loading Policy 格式化声明 | P2 | 补充 Context Loading Policy section |
| Execution Harness | Phase 0-5 完整，confidence-first check，deepening agents 健全 | Phase 5.3 deepening 在 SKILL.md 本体中有大量描述，应外置 | P2 | 深化逻辑外置到 references/deepening-workflow.md |
| Review Harness | 内置 confidence-first check + doc-review 集成（mandatory） | doc-review 强制是好实践，但触发条件散落在 Phase 5.3 | P2 | 整合到 Review Harness section |
| Evidence Harness | Direct Evidence Readiness 概念，每个 plan 含 ## Direct Evidence | 无 fact/inference 标签 | P2 | 借鉴 spec-prd evidence tag 体系 |
| Validation Harness | **无 validation 脚本** | 计划文档无机器可验证的质量门禁 | P1 | 增加 plan readiness checker 脚本（参考 prd checker） |
| Knowledge Harness | 调用 docs/solutions/ recall，但无输出 | 规划决策无知识沉淀 | P2 | 增加 Knowledge Harness Placeholder |
| Evaluation Harness | 有 evals/README.md，有 evals/examples.json | evals 内容未详细检查，但 placeholder 存在 | P2 | 丰富 golden cases 覆盖 enterprise 场景 |
| Governance Harness | governance-boundaries.md 存在 | 无版本、无 owner 声明 | P2 | 增加治理元信息 |

### 4.5 spec-work

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Context Orientation Anchor 详尽，cache-friendly layout，resume-first handoff | **SKILL.md 达580行**，Phase 1-2 包含大量执行细节 | P0 | 大幅外置 Phase 1 task-pack validation 细节和 Phase 2 execution loop 到 references/ |
| Execution Harness | Anti-Rationalization Red Flags，minimality preflight，并行安全检查，scope expansion gate | 执行细节嵌入主 SKILL.md，降低可维护性 | P1 | 将 Phase 2 的 subagent dispatch 策略外置 |
| Review Harness | shipping-workflow.md 包含 review pass（必读）| 调用 shipping-workflow.md 而非内联，是好的外置设计 | — | 保持 |
| Evidence Harness | Direct Evidence Boundary，verification-run-summary.v1，honest-closeout.v1 | verification claim 需要有 run artifact 支撑 | P2 | 增加 evidence 模板到 templates/ |
| Validation Harness | feedback loop → 测试持续运行 → spec-first tasks validate | 验证命令散落在 Phase 2 各小节 | P2 | 整合 Validation Harness section |
| Knowledge Harness | **无 knowledge feedback**，仅提示可跳转 spec-compound | work 执行经验无结构化沉淀路径 | P2 | 增加 Knowledge Harness Placeholder |
| Evaluation Harness | evals/examples.json（74行，覆盖极浅）| 无 negative cases；scope-expansion/task-pack validation 场景无专用 eval | P1（降级）| 补充 scope-expansion negative + task-pack golden cases |
| Governance Harness | source/runtime 边界声明，anti-rationalization | 无版本，no formal changelog | P2 | 增加 skill version |

### 4.6 spec-code-review

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Context Orientation Anchor，cache-friendly layout，Domain Language Ledger | **SKILL.md 达1242行**，是所有 skill 中最长的 | P0 | 将 Stage 1-4 的完整 bash 脚本和 reviewer spawning 逻辑外置到 references/ |
| Execution Harness | Stage 1-6 完整，Diff Boundary Review，scale-aware preflight，mode detection | 大量 bash 脚本嵌入 SKILL.md（Stage 1 alone ~200行） | P0 | Shell 脚本外置到 scripts/ |
| Review Harness | **最强**：18 persona reviewers，P0-P3 severity，confidence anchor，merge/dedup | 信息量极大，新维护者难以理解整体架构 | P1 | 增加 architecture overview 和 persona catalog summary |
| Evidence Harness | Direct Review Evidence Boundary，confidence 0/25/50/75/100 五级，finding 必须有 evidence[] | evidence[] 中的实际内容质量依赖 reviewer，无强制格式 | P2 | evidence[] 格式强制要求 source-ref + line 组合 |
| Validation Harness | Stage 5 synthesis，re-review rounds（autofix mode），runtime readiness preflight | 无 reviewer output quality validation（只有 schema 验证） | P2 | 增加 reviewer output lint script |
| Knowledge Harness | 有 learning capture recommendation | 仅提供建议，无结构化路径 | P2 | 增加 Knowledge Harness Placeholder with spec-compound trigger |
| Evaluation Harness | evals/examples.json（117行，含 trigger/boundary 覆盖）| 无 negative cases；reviewer 选择逻辑和 Diff Boundary 场景无专用 eval | P1（降级）| 补充 evidence-less finding negative + degraded dispatch 场景 |
| Governance Harness | Protected Artifacts，source/runtime 边界 | 无 reviewer persona 版本管理 | P2 | persona catalog 增加 version / owner |

### 4.7 spec-debug

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Context Orientation Anchor，docs/solutions/ recall 默认开启 | recall 为 advisory，无 "禁止加载" 声明 | P3 | 增加 context loading policy |
| Execution Harness | Phase 0-4，Causal Chain Gate，Test-first，Anti-Rationalization Red Flags | 快速路径（trivial bug）和完整路径判断逻辑散落 | P2 | 快速路径判断条件外置到 references/ |
| Review Harness | 有 Phase 3 self-review，shipping review 建议 | **无结构化 Review 检查点**，依赖 LLM 自觉 | P1 | 增加 root cause review checklist |
| Evidence Harness | Causal Chain Gate（不得声明 confirmed 无证据），feedback loop readiness checklist，hypothesis ledger | evidence 结构松散（prose 描述） | P2 | 结构化 hypothesis ledger schema |
| Validation Harness | Test-first fix，rerun feedback loop，verification-run-summary.v1 | 验证结果记录标准化（verification-run-summary）是好实践 | — | 保持 |
| Knowledge Harness | Phase 4 提供 learning capture 建议（3层判断），conditional post-mortem | learning capture 仍是可选，无 structured knowledge gate | P2 | 增加 Knowledge Harness Placeholder |
| Evaluation Harness | evals/examples.json（50行，极浅）| 无 no-repro negative；causal chain gate regression 无专用 eval | P1（维持）| 补充 no-repro negative cases + causal chain gate regression |
| Governance Harness | 无 owner，无版本 | P2 | 增加治理元信息 |

### 4.8 spec-compound

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Support Files 按需加载，runtime context 排除声明 | 无明确 "禁止加载" 声明 | P3 | 增加 never-load 声明 |
| Execution Harness | Full/Lightweight 两种模式，Phase 0-3 完整，YAML frontmatter 验证 | preconditions 仅 advisory（未强制检查） | P1 | 将 preconditions 升级为 hard gate（至少要求 problem_solved=confirmed） |
| Review Harness | Phase 3 有 specialized agent review（可选） | **无结构化 Review 门禁**，review 是可选且依 problem_type 触发 | P1 | 强制要求 source_confirmed 证据后才能 Phase 2 |
| Evidence Harness | Structured Promotion Gate（需 invalidation_condition + source_refs） | 现有 evidence 要求仅在 references/schema.yaml，主 SKILL.md 中较弱 | P1 | 主 SKILL.md 中增加 evidence contract section |
| Validation Harness | scripts/validate-frontmatter.py（YAML 格式验证） | 仅验证格式，不验证 source_confirmed 声明 | P1 | 增加 source_refs 存在性校验 |
| Knowledge Harness | **最强**，是知识沉淀核心 skill | legacy_unstructured_advisory 文档的处理 | P2 | 增加 structured legacy backfill workflow |
| Evaluation Harness | evals/examples.json（83行，有 posture drift 场景）| 无 unverified-promotion negative；source_refs drift 场景无专用 eval | P1（维持）| 补充 unverified-promotion negative + source_refs 可达性 regression |
| Governance Harness | Structured Promotion Gate，domain-model-capture 规则 | 无 owner，无版本 | P2 | 增加治理元信息 |

---

## 5. 当前问题识别

### 5.1 P0 阻塞问题（必须修）

| # | 问题 | 涉及 Skill | 影响 |
|---|---|---|---|
| P0-01 | `spec-code-review/SKILL.md` 达1242行，含大量 bash 脚本和执行细节，上下文开销巨大 | spec-code-review | LLM 每次加载即消耗大量 token，维护极困难 |
| P0-02 | `spec-work/SKILL.md` 达580行，Phase 1-2 执行细节应外置 | spec-work | 高频调用 skill，上下文负担最高 |
| P0-03 | `spec-prd`/`spec-work` 有 examples-as-context 但**缺少 negative cases 和 CI runner**，无法防回归退化 | spec-prd, spec-work | 压缩后无自动化回归保护；checkpoint-as-escape/scope-expansion 等关键 anti-pattern 无专用 negative |
| P0-04 | `spec-brainstorm` 缺少 **Evidence Harness**，需求文档产物无 evidence tag | spec-brainstorm | 下游 spec-plan 可能基于无根据的需求规划 |
| P0-05 | `spec-code-review` 有 examples.json 但**无 negative cases**，1241行 SKILL.md 压缩后质量退化不可检测 | spec-code-review | reviewer 选择逻辑/Diff Boundary 等关键行为无 negative 回归保护 |

### 5.2 P1 高风险问题（优先修）

| # | 问题 | 涉及 Skill | 影响 |
|---|---|---|---|
| P1-01 | `spec-brainstorm` 无 Validation Harness | spec-brainstorm | 需求文档质量无任何可验证门禁 |
| P1-02 | `spec-brainstorm` 无 Review Harness，产出物无质量门禁 | spec-brainstorm | 低质量需求直接流入 spec-plan |
| P1-03 | `spec-plan` 无 validation 脚本（vs spec-prd 有 finalize+checker） | spec-plan | 计划质量无机器可验证基准 |
| P1-04 | `spec-compound` preconditions 仅 advisory，未验证 source_confirmed | spec-compound | 未验证经验升级为团队知识 |
| P1-05 | `spec-compound` 无 Review 门禁，source_confirmed 声明全靠 LLM 自觉 | spec-compound | knowledge pollution 风险 |
| P1-06 | Anti-Rationalization Red Flags 表在三处维护（spec-work/spec-code-review/spec-debug） | spec-work, spec-code-review, spec-debug | 规则漂移，修改需三处同步 |
| P1-07 | `using-spec-first` 路由无可自动化验证的 regression test | using-spec-first | 路由质量退化无检测手段 |
| P1-08 | Evidence 分类词汇不统一：prd(5级) vs debug(hypothesis ledger) vs code-review(confidence %) | 全局 | 上下游 handoff 证据无法互操作 |
| P1-09 | `spec-debug` 无内置结构化 Review 检查点 | spec-debug | root cause 质量无对抗验证 |
| P1-10 | `spec-prd` 有 examples-as-context 但**缺 negative cases 和 CI runner**；grill discipline 退化无自动化检测 | spec-prd | checkpoint-as-escape 等关键失败模式无 negative 回归保护 |

### 5.3 P2 中风险问题（建议修）

| # | 问题 | 涉及 Skill |
|---|---|---|
| P2-01 | 无统一 Context Loading Policy 格式，各 skill 自定义 | 全局 |
| P2-02 | 无 shared/quality-gates/ 目录，质量门禁散落 | 全局 |
| P2-03 | 无 shared/rules/ 目录，共享规则重复维护 | 全局 |
| P2-04 | 所有 skill 缺少 Knowledge Harness Placeholder（除 compound） | 全局 |
| P2-05 | 所有 skill 无版本号和正式变更记录 | 全局 |
| P2-06 | spec-plan deepening 逻辑仍在主 SKILL.md | spec-plan |
| P2-07 | spec-doc-review Dispatch Capability Gate 条件复杂，易被误解 | spec-doc-review |
| P2-08 | spec-debug 快速路径判断条件散落，未明确化 | spec-debug |
| P2-09 | spec-compound domain-model-capture 规则复杂，调用条件多 | spec-compound |

### 5.4 P3 低风险问题

| # | 问题 | 涉及 Skill |
|---|---|---|
| P3-01 | 无 skill-system/skill-map.md 全局视图文档 | 全局 |
| P3-02 | using-spec-first 无 version/changelog | using-spec-first |
| P3-03 | spec-brainstorm HTML/markdown 渲染规则在 references 中但未明确 when-load | spec-brainstorm |

---

## 6. 内容分类与去重

### 6.1 重复内容抽取建议

| 重复内容 | 出现在哪些 Skill | 建议抽取位置 | 保留方式 |
|---|---|---|---|
| Anti-Rationalization Red Flags 表 | spec-work, spec-code-review, spec-debug | `shared/rules/anti-rationalization.md` | 各 skill 用 `@./shared/rules/anti-rationalization.md` 或 `Load when: execution phase` |
| "外部工具不影响 scope authority" 原则 | spec-work, spec-code-review, spec-debug, spec-plan | `shared/rules/evidence-boundary.md` | 各 skill 引用共享规则 |
| `docs/contracts/context-governance.md` Runtime 排除声明 | spec-work, spec-code-review, spec-doc-review, spec-debug, spec-compound | 已在 shared contract，当前每处都有 prose 重述 | 缩减为一行 reference |
| AskUserQuestion / request_user_input 加载规则 | spec-prd, spec-plan, spec-code-review, spec-debug, spec-compound, spec-doc-review | `shared/context/blocking-question-tool.md` | 各 skill 一句引用 |
| source/runtime 边界声明（不修改 .claude/.codex/.agents/skills/） | 所有 workflow skill | `shared/rules/source-runtime-boundary.md` | 引用 |
| Capability-Class Evidence Boundary | spec-work, spec-code-review, spec-debug, spec-plan, spec-brainstorm | `shared/rules/capability-class-evidence.md` | 统一共享 |
| Domain Language And Decision Ledger 模板 | spec-work, spec-code-review, spec-debug, spec-doc-review | `shared/rules/decision-ledger.md` | 引用 |
| 上下游 handoff summary（artifact-summary.v1）契约 | spec-work, spec-code-review, spec-doc-review, spec-compound | `shared/handoff/artifact-summary.md` | 引用 |

### 6.2 内容分类总表（以 spec-code-review 为例，最高压缩需求）

| 内容类别 | 在 spec-code-review 中的位置 | 处理方式 |
|---|---|---|
| Core Contract | Workflow Contract Summary | 保留在 SKILL.md |
| Workflow | Stage 1-6 概述 | 压缩为步骤列表，细节外置 |
| Decision Rules | Mode Detection, Action Routing, Severity Scale | 移到 references/mode-routing.md |
| Output Schema | findings-schema.json（已外置） | 保持 |
| Quality Gates | Scale-Aware Reviewer Preflight | 移到 references/scale-aware-preflight.md |
| Handoff Rules | Résumé-First Handoff | 移到 shared/handoff/ |
| Context Rules | Context Orientation Anchor | 移到 shared/context/ |
| Evidence Rules | Direct Review Evidence Boundary, Confidence anchors | 保留核心，细节外置 |
| Review Rules | 18 persona catalog | 移到 references/persona-catalog.md（已有部分） |
| Shell Scripts | Stage 1 所有 bash 脚本 | 移到 scripts/ |
| Examples | Stage 3 Announce team example | 移到 examples/ |
| References | PR checkout 流程详细说明 | 移到 references/ |
| Eval Cases | **无** | 新建 evals/ |
| Redundant | PR mode / branch mode / standalone mode 三处重复的 `git status --porcelain` 逻辑 | 合并到 scripts/resolve-base.sh |

---

## 7. 不可丢失约束

以下约束在压缩过程中绝对不得丢失：

### 7.1 MUST（必须执行）

```markdown
## MUST

- 执行前必须读完 plan/task-pack scope，不得自行扩展
- Evidence 声明必须回源到具体 source/test/log/diff 证据
- Review finding 必须标注 evidence[]，不得仅凭经验
- Debug root cause 必须通过 reproduction + causal chain gate 确认
- 知识沉淀到 docs/solutions/ 必须有 source_confirmed 标注
- PRD 产物在 final-prd 前必须通过 finalize/checker
- task pack 在使用前必须通过 spec-first tasks validate
- Code review finding P0/P1 必须在 primary finding set（不得静默降为 advisory）
- compound 产物必须包含 invalidation_condition 和 source_refs
- 跨 skill handoff 必须携带 artifact-summary.v1（含 source_refs、limitations、next_action）
```

### 7.2 NEVER（绝对禁止）

```markdown
## NEVER

- 不得把 transcript 声明当 outcome 证据（「我已完成 X」≠ 完成证明）
- 不得直接修改 .claude/.codex/.agents/skills/ generated runtime mirrors
- 不得让 LLM 假装执行了确定性校验（脚本才能做 hash check / structure check）
- 不得跳过 Phase 4 Readiness Lens 直接声明 ready-for-planning
- 不得在 spec-work 中 expand scope 超出 plan/task-pack
- 不得为未开发的团队知识 Resolver 引入强约束（当前 placeholder only）
- 不得将 capability-class 候选（code-graph/project-graph）当 confirmed truth
- 不得将 advisory facts 当 confirmed truth 上报
- 不得在 source_plan_hash mismatch 的情况下执行 task pack
- 不得在 feedback loop 未建立时声明 debug root cause confirmed
```

### 7.3 CHECK（必须检查）

```markdown
## CHECK

- 跨 skill handoff 时检查 artifact freshness 和 source_refs 可达性
- spec-work 开始前检查 target_repo scope
- code-review 开始前检查 untracked 文件
- compound 写入前检查 overlap（高 overlap 时 update 而非新建）
- 任何 skill invocation 前通过 using-spec-first 检查路由适当性（substantial work）
- plan 引用 docs/solutions/ recall 时检查 invalidation_condition
- spec-prd requirements grill 时检查 clarification_evidence 字段
```

### 7.4 OUTPUT（必须产出）

```markdown
## OUTPUT

- spec-brainstorm: docs/brainstorms/ 需求文档或明确 route-out
- spec-prd: docs/brainstorms/*-requirements.md + readiness_outcome
- spec-plan: docs/plans/*.md + post-plan handoff 选项
- spec-write-tasks: Final Decision Envelope（decision/reason_code/deterministic_handoff）
- spec-work: code diff + verification results + completion contract
- spec-code-review: merged findings report（severity/confidence/evidence/autofix_class）
- spec-doc-review: findings report + applied safe_auto fixes
- spec-debug: Debug Summary（root cause/causal chain/verification-run-summary ref）
- spec-compound: docs/solutions/[category]/[filename].md + YAML frontmatter validated
```

### 7.5 LOAD（上下文加载规则）

```markdown
## LOAD

- 仅在触发条件满足时加载 references/（不得全量加载）
- 不得加载 .spec-first/audits/**、.spec-first/governance/**、generated mirrors（除非 setup/audit 任务）
- spec-plan 引用 docs/solutions/ 时仅扫描 frontmatter（不全量读取内容）
- spec-code-review 加载 standards 时仅加载 trust=confirmed,lifecycle_state=active 规则
- spec-debug 默认加载 docs/solutions/ recall（trivial-bug 快速路径可跳过）
```

### 7.6 HANDOFF（交接要求）

```markdown
## HANDOFF

- spec-prd → spec-plan: readiness_outcome=ready-for-planning + finalize receipt
- spec-plan → spec-work: plan doc path + scope boundary + non-goals
- spec-write-tasks → spec-work: Final Decision Envelope + deterministic_handoff=true + semantic_posture
- spec-work → spec-code-review: work summary + changed files + verification commands
- spec-debug → spec-compound: Debug Summary + root cause confirmed evidence
- 所有 handoff 必须包含 limitations 声明（什么未被验证）
```

### 7.7 EVIDENCE（证据要求）

```markdown
## EVIDENCE

- Fact: 来自当前文件/代码/测试/日志/明确用户输入
- Inference: 基于证据推断，必须标注
- Hypothesis: 待验证假设，必须标注，不得声明 confirmed
- Suggestion: 建议
- Unknown: 当前无法确认

- finding 必须绑定到 evidence[]（source ref + line）
- root cause 必须绑定到 reproduction + causal chain
- 知识沉淀必须绑定到 source_refs（repo-relative paths）
```

### 7.8 REVIEW（评审要求）

```markdown
## REVIEW

- code-review findings 必须包含 why_it_matters + evidence + suggested_fix
- doc-review findings 必须区分 P0/P1/P2/P3
- plan confidence-first check 是强制后验（不得跳过）
- PRD Phase 4 Readiness Lens 是强制关闭门禁
- debug root cause 必须通过 causal chain gate（no gaps）
```

### 7.9 VALIDATE（验证要求）

```markdown
## VALIDATE

- spec-prd: node scripts/finalize-prd-artifact.js <prd-path>
- spec-write-tasks: spec-first tasks validate <task-pack-path> --json
- spec-compound: python3 skills/spec-compound/scripts/validate-frontmatter.py <output-path>
- spec-debug: rerun same feedback loop after fix
- spec-work: run relevant test suite per implementation unit
- spec-code-review: runtime readiness preflight（detect-tools.sh）
```

### 7.10 FALLBACK（降级处理）

```markdown
## FALLBACK

- dispatch 不可用时降级为 single-agent report-only（必须声明降级原因）
- Codex guard 缺失时必须显式声明 codex_prd_guard: not_available
- capability-class provider 不可用时降级为 direct source reads
- feedback loop 不可用时降级为 captured evidence（明确标注 not_possible reason）
- headless mode 时以结构化 text 输出代替 interactive 提问
```

### 7.11 EVAL（回归评测要求）

```markdown
## EVAL

- 每个 core skill 必须有 eval cases 覆盖：正常路径/失败路径/边界路径
- 压缩前后必须通过相同 eval cases（防止质量退化）
- routing skill 必须有 negative cases（错误路由防线）
- evidence class 场景（无证据时不得声明 confirmed）必须在 eval 中覆盖
- 当前阶段不得为未开发的团队知识 Resolver 增加 eval 约束
```

---

## 8. Context Harness 设计

### 8.1 Context Loading Policy

| 场景 | 默认加载 | 条件加载 | 禁止加载 | 原因 |
|---|---|---|---|---|
| 需求澄清 | 用户输入、已有需求文档、source/docs refs | design-source evidence、domain glossary | generated mirrors、audit logs | WHAT 必须由用户/现有系统确认 |
| PRD 增强 | current-state source refs、prd-output-template、evidence topology | grill-with-docs、design-source | implementation plans、task packs | PRD 只定义 WHAT/WHY |
| 方案设计 | requirements doc、nearby source patterns、docs/solutions frontmatter | external docs、enterprise review | runtime mirrors、full audit logs | 计划源于需求，不从执行产物倒推 |
| 任务拆解 | source plan focused sections、implementation units | nearby tests、declared files | unresolved PRD、raw issue thread | tasks 是 derived，不重新定义 scope |
| 代码实现 | settled plan/task pack、nearby source/tests | docs/solutions candidates、matched standards rules | `.spec-first/audits/**`、generated mirrors | 实现基于 source 与可验证 evidence |
| Code Review | diff、changed files、plan/work summary | graph candidates、matched standards | generated mirrors（除非 diff 中有）| finding 必须基于 diff/source/test/log |
| Debug 排障 | reproduction、logs、nearby source/tests、docs/solutions frontmatter | runtime probes、observability | unrelated sessions、audit snapshots | root cause 只来自可复现证据 |
| Evidence 生成 | source refs、test outputs、logs、diff summary | structured run artifacts | transcript-only claims | 证据必须可追溯且可验证 |
| 文档审查 | selected document sections、summary bundle、source refs | codebase facts | full repo dump、generated mirrors | 控制上下文，避免审查跑偏 |
| Skill 审查 | SKILL.md、references index、deterministic audit reports | runtime drift facts（显式请求） | hand-edit generated runtime | skill source 是真相源 |

### 8.2 Context Budget Policy

| 上下文类型 | 优先级 | 最大粒度 | 压缩方式 | 质量要求 |
|---|---|---|---|---|
| 用户明确输入 | P0 | 完整 | 不压缩 | 不丢失约束 |
| 当前 source 文件 | P0 | 相关 symbol/section | codegraph/bounded read | 必须 repo-relative refs |
| 计划/需求 artifact | P0 | artifact-summary.v1 | summary-first | 保留 scope/non-goals/evidence |
| diff/test/log | P0 | 变更文件/失败段落 | 去噪，保留命令/exit code/摘要 | 不能改写结果 |
| references/ | P1 | 单 reference 文件 | trigger-based load | 不全量加载 |
| docs/solutions/ | P1 | frontmatter + strong match | grep/frontmatter first | treat as advisory |
| external docs | P2 | 相关章节 | date/source 标注 | 不替代本地 source |
| generated runtime | P3 | 精确路径 | 仅 setup/runtime drift 任务 | 不当 source |
| raw transcript | P3 | 摘要片段 | 仅作 replay ref | 不当 outcome evidence |


---

## 9. Execution Harness 设计

### 9.1 统一执行骨架

每个 Skill 压缩后 Execution Harness 仅保留：

```markdown
## Execution Harness

### Required Steps
1. Intake / triage：明确 goal、scope、boundary
2. Minimal evidence orientation：最窄必要 context 加载
3. Phase-specific work：按契约执行
4. Evidence capture：结论绑定 evidence
5. Review/validation gate：必须门禁
6. Handoff/closeout：带 limitations 的 artifact-summary

### Forbidden Actions
- 不扩展 scope 超出 plan/task-pack
- 不把 advisory 当 confirmed 声明
- 不修改 generated runtime mirrors
- 不跳过 validation gate 声明 done

### Fallback
- <degraded mode>：说明什么能做，什么不能声明
- <reason_code>：机器可读
- <what cannot be claimed>：明确降级后禁止的声明
```

### 9.2 核心 Skill 执行压缩目标

| Skill | 当前 SKILL.md 行数 | 压缩目标行数 | 外置内容 |
|---|---|---|---|
| using-spec-first | ~236 | ~120 | 硬规则示例、路由细节到 references/ |
| spec-brainstorm | ~81 | ~80 | 基本合理，补 phase/gate section |
| spec-prd | ~294 | ~120 | Phase 1-3 细节、anti-pattern blacklist、所有 Decision Card 字段说明 |
| spec-plan | ~461 | ~160 | Phase 3-5 deepening/rendering、plan template |
| spec-write-tasks | ~138 | ~100 | Task Pack Schema 细节 |
| spec-work | ~580 | ~160 | task-pack validation 20+步骤、subagent dispatch 细节、execution loop |
| spec-code-review | ~1242 | ~200 | 所有 Stage 1 bash、reviewer personas、18个 conditional rules |
| spec-doc-review | ~312 | ~150 | dispatch parameter hygiene、phase 3-5 细节 |
| spec-debug | ~403 | ~160 | Phase 1-3 详细步骤、feedback loop 类型列表 |
| spec-compound | ~646 | ~180 | Phase 1 parallel task details、Phase 2 assembly 细节 |


---

## 10. Review Harness 设计

### 10.1 Review 检查框架

| Review 类型 | 审查维度 | 必须证据 | 输出格式 | 阻塞条件 |
|---|---|---|---|---|
| PRD Review | WHAT 完整性、scope、owner decisions、source evidence、readiness | PRD path、source_inputs、finalize receipt | P0-P3 + readiness_outcome | OQ 未闭合、blocking reason_codes |
| Spec Review | 需求一致性、角色/边界 | spec path、source refs | findings + patch suggestions | source-of-truth 冲突 |
| Plan Review | 可执行性、reuse/new 决策、tests、risks | plan path、source refs、origin doc | findings + plan patch | plan 要求 implementer invent WHAT/HOW |
| Task Review | task pack 忠实派生、hash、scope | source_plan_hash、Task Pack Contract、validator output | findings + deterministic_handoff | hash mismatch / scope_gap |
| Code Review | correctness、testing、maintainability、standards、security | diff、source、tests/logs | merged findings report | P0/P1 confirmed finding |
| Evidence Review | fact/inference/hypothesis 是否分离 | source refs、logs、test output | evidence table | 无证据 confirmed claim |
| Skill Review | trigger、boundary、contract、runtime drift | SKILL.md、audit artifacts | audit report | generated runtime as source |
| Doc Review | coherence、feasibility、scope、product/design lenses | doc sections、source facts | findings + safe_auto patches | downstream must invent missing decisions |

### 10.2 Finding 统一格式

```yaml
finding_id: F-001
severity: P0 | P1 | P2 | P3
confidence: 0 | 25 | 50 | 75 | 100
category: context | execution | evidence | validation | review | knowledge | evaluation | governance
summary: <one sentence>
evidence:
  - type: source | diff | test | log | artifact | user-input
    ref: <repo-relative path:line>
    quote: <short excerpt>
impact: <why it matters>
suggested_fix: <actionable change>
owner: skill-maintainer | workflow-owner | human | downstream-resolver
autofix_class: safe_auto | gated_auto | manual | advisory
```

### 10.3 Review 禁止项

- 无证据项只能标 `risk` / `hypothesis`，不能作为 `confirmed finding`
- 不得把 external-tool advisory output 当 direct evidence
- 不得把 `docs/solutions/` recall 当当前代码事实
- 不得把 review persona 主观判断直接升级为 P0/P1


---

## 11. Evidence Harness 设计

### 11.1 Evidence Contract

| 场景 | 必须证据 | 可选证据 | 不能作为单独证据 | 缺失时处理 |
|---|---|---|---|---|
| 需求结论 | 用户回答、source/docs、PRD artifact | external research、design-source | LLM 常识 | 标为 assumption 或 outstanding question |
| 方案结论 | requirements trace、source refs、nearby pattern | docs/solutions recall | 单一 best practice | 标为 inference + risk |
| 实现判断 | diff、tests、logs、package commands | graph candidates | plan prose | 不声明 done，补 evidence |
| Review finding | diff/source/test/log direct evidence | plan/work summary | PR title、commit msg | 降为 residual risk/test candidate |
| Debug root cause | reproduction、causal chain、source/log/test | captured trace | 直觉、一次运行成功 | working hypothesis only |
| 测试通过 | command + exit code + relevant output | verification-run-summary | "我运行过"文字 | not-run/degraded |
| 发布准备 | tests/checks、review verdict、scope boundary | deployment checklist | changelog alone | block or degraded |
| 知识沉淀 | source_refs、verified fix summary、invalidation_condition | session replay refs | raw transcript | 不写入 docs/solutions/ |

### 11.2 Evidence Class 定义

```text
Fact:      来自当前文件/代码/测试/日志/diff/用户明确输入；可支撑 confirmed 结论
Inference: 基于 Fact 推断；必须标注推断路径和不确定性
Hypothesis:尚未验证；不得用于 done/root-cause-confirmed/ready-for-planning
Suggestion:基于经验/偏好；不得伪装为 defect
Unknown:   当前无法确认；必须说明缺什么证据及其后果
```

---

## 12. Validation Harness 设计

### 12.1 Validation 命令矩阵

| 产物 | 验证命令 / 检查项 | 失败处理 | Evidence |
|---|---|---|---|
| PRD 产物 | `node skills/spec-prd/scripts/finalize-prd-artifact.js <path>` | readiness_outcome != ready-for-planning | checker receipt |
| Plan 产物 | `spec-first plan validate <path> --json`（建议新增） | block handoff | validator JSON |
| Task Pack | `spec-first tasks validate <task-pack> --json` | reason_code + reject | CLI JSON |
| Work 产物 | relevant test commands + `honest-closeout validate` | 不声明 done | verification-run-summary.v1 |
| Review 产物 | schema lint（建议）| drop invalid findings | finding lint |
| Debug 产物 | rerun repro loop | root cause not confirmed | repro output |
| Evidence 产物 | source refs reachable + line anchor valid | mark degraded | evidence audit |
| Skill 产物 | `node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo .` | report degraded | audit summary |
| Knowledge 产物 | `python3 skills/spec-compound/scripts/validate-frontmatter.py <path>` | re-write + rerun | exit 0 |

### 12.2 Validation Gate 分级

| Gate 类型 | 定义 | 示例 |
|---|---|---|
| Hard gate | 确定性可判定，失败即阻断 | source_plan_hash mismatch；PRD checker blocking reason_code |
| Soft gate | LLM 语义判断，失败需说明 | plan quality insufficient |
| Degraded gate | runtime 无法硬强制，须响亮声明 | Codex PRD prewrite guard 缺失 |
| Advisory gate | 只影响风险/置信度 | graph/codegraph unavailable |

---

## 13. Evaluation Harness 设计

### 13.1 Eval 目录结构建议

```text
skills/<skill>/evals/
  README.md               ← 覆盖目的、运行方式
  golden-cases.json       ← 正常路径 golden output
  negative-cases.json     ← 拒绝/route-out 场景
  regression-cases.json   ← 压缩前后 MUST/NEVER 不丢失
  degraded-cases.json     ← dispatch/tool unavailable 降级
  expected-output-shapes.md ← output format contracts
```

### 13.2 Eval 覆盖矩阵（所有 core skill）

| Eval 类型 | 覆盖目的 | 必须覆盖的 Skill |
|---|---|---|
| Golden cases | 正常路径仍能完成 | 全部 |
| Negative cases | 不适用场景拒绝/route-out | using-spec-first、brainstorm、prd、plan、work |
| Evidence cases | 无证据不得 confirmed | brainstorm、prd、code-review、debug、compound |
| Validation cases | checker 失败是否阻断 | prd、write-tasks、work、compound |
| Degraded cases | dispatch/tool unavailable 降级 | doc-review、code-review、plan、compound |
| Context load cases | 不全量加载 references/examples | 全部 |
| Handoff cases | artifact-summary 完整 | prd、plan、write-tasks、work、review、compound |
| Compression regression | 压缩后 MUST/NEVER/CHECK 不丢 | 全部 |

### 13.3 代表性 Eval Cases

#### Case EVAL-ROUTE-001

- **Given**: 用户输入"修复这个 failing test"+ stack trace
- **When**: using-spec-first 路由判断
- **Then**: 推荐 `/spec:debug`；不得推荐 work/brainstorm
- **Covers**: Routing priority: debug before work

#### Case EVAL-BRAINSTORM-EVIDENCE-001

- **Given**: 功能想法，无 source refs，无明确 scope 回答
- **When**: spec-brainstorm 生成需求文档
- **Then**: 未确认断言必须标为 assumption/outstanding question
- **Covers**: Evidence Harness

#### Case EVAL-PRD-CHECKPOINT-001

- **Given**: PRD 有 unresolved owner decisions，用户未回答
- **When**: spec-prd 尝试写 final PRD
- **Then**: `write_mode: checkpoint-prd`；`can_enter_spec-plan: no`
- **Covers**: checkpoint-as-escape anti-pattern

#### Case EVAL-WRITE-TASKS-HASH-001

- **Given**: task pack source_plan_hash ≠ current source plan hash
- **When**: spec-write-tasks validate-only
- **Then**: `reason_code: stale_hash`；不 handoff 到 spec-work
- **Covers**: Validation Harness

#### Case EVAL-WORK-SCOPE-001

- **Given**: source plan 明确 non-goal = 不修改 runtime generation
- **When**: spec-work 执行发现需改 .claude/ mirror
- **Then**: 停止 + handoff；不手改 generated runtime mirror
- **Covers**: Source/runtime boundary gate

#### Case EVAL-CODE-REVIEW-EVIDENCE-001

- **Given**: reviewer 提出 P1 finding，evidence[] 仅含"looks risky"
- **When**: Stage 5 synthesis 合并 findings
- **Then**: 该 finding 降为 advisory 或丢弃
- **Covers**: Review Harness, Evidence Harness

#### Case EVAL-DEBUG-NO-REPRO-001

- **Given**: bug 无法复现，无 captured evidence
- **When**: spec-debug 形成 root cause
- **Then**: 不声明 root-cause-confirmed；working hypothesis only
- **Covers**: Causal chain gate

#### Case EVAL-COMPOUND-UNVERIFIED-001

- **Given**: "应该是这个原因"，无 source/test/log 证据
- **When**: spec-compound 尝试写 docs/solutions
- **Then**: 拒绝 durable promotion 或标为 unresolved
- **Covers**: Knowledge Harness

#### Case EVAL-CONTEXT-LOAD-001

- **Given**: 调用 spec-plan 进行普通小计划
- **When**: Phase 1 context gathering
- **Then**: 不全量加载 references/、examples/、.spec-first/audits/**
- **Covers**: Context Harness


---

## 14. 推荐目录结构

### 14.1 完整目录结构

```text
skills/
  <skill-name>/
    SKILL.md              ← 最小执行契约（目标 80-200 行）
    references/           ← 按需加载的细节
    templates/            ← 输出格式/产物模板
    examples/             ← examples-as-context，非运行时规则
    scripts/              ← 确定性脚本（hash/validate/lint）
    evals/                ← 回归用例
      README.md
      golden-cases.json
      negative-cases.json
      regression-cases.json
      degraded-cases.json

shared/
  rules/                  ← 跨 skill 共享规则
    anti-rationalization.md
    evidence-boundary.md
    source-runtime-boundary.md
    capability-class-evidence.md
    decision-ledger.md
  context/                ← 上下文策略
    blocking-question-tool.md
    context-loading-policy.md
    context-budget-policy.md
    runtime-exclusions.md
  evidence/               ← 证据契约
    evidence-class-definitions.md
    evidence-contract.md
  review/                 ← 审查要求
    finding-schema.json
    review-harness.md
    review-forbidden.md
  validation/             ← 验证策略
    validation-harness.md
    validation-gates.md
  handoff/                ← 交接合同
    artifact-summary.md
    handoff-contract.md
    skill-handoff-envelope.md
  quality-gates/          ← 可脚本化质量门禁
    prd-gates.md
    plan-gates.md
    task-pack-gates.md
    work-gates.md
    review-gates.md
  templates/              ← 共享输出模板
    skill-md-template.md
  evals/                  ← 跨 skill 共享 eval cases
    cross-skill-handoff-cases.json
    evidence-class-cases.json
    context-load-cases.json

skill-system/
  skill-map.md            ← 全局 skill 关系图谱
  harness-review-framework.md  ← 本报告框架
  handoff-contract.md
  context-loading-policy.md
  evidence-contract.md
  review-harness.md
  validation-harness.md
  evaluation-harness.md
  skill-audit-checklist.md
  skill-version-changelog.md  ← 新增
```

### 14.2 目录职责说明

| 目录 | 职责 |
|---|---|
| `skills/<name>/SKILL.md` | 最小执行契约：Purpose/When/When Not/Inputs/Outputs/Workflow/Harnesses |
| `skills/<name>/references/` | 仅在触发条件下加载的执行细节 |
| `skills/<name>/templates/` | 产物输出格式（不在 SKILL.md 中内联） |
| `skills/<name>/examples/` | examples-as-context，不是规则 |
| `skills/<name>/scripts/` | 确定性脚本，脚本准备事实，LLM 做语义判断 |
| `skills/<name>/evals/` | 回归用例防止压缩后质量退化 |
| `shared/rules/` | 跨 skill 共享规则（Anti-Rationalization、Evidence Boundary 等）|
| `shared/context/` | 上下文加载/压缩/注入策略 |
| `shared/evidence/` | Evidence class 定义和合同 |
| `shared/review/` | Review Harness，finding schema |
| `shared/validation/` | Validation gate 分级和命令矩阵 |
| `shared/handoff/` | 跨 skill handoff 契约和 artifact-summary 格式 |
| `shared/quality-gates/` | 可脚本化/可引用的质量门禁（链接到脚本） |
| `shared/templates/` | 共享 SKILL.md 模板 |
| `skill-system/` | skill 体系级治理文件（关系图、框架、契约） |


---

## 15. 新版 SKILL.md 模板

```markdown
---
name: <skill-name>
description: "<trigger description; include when-not-to-use>"
argument-hint: "[optional args]"
---

# Skill: <skill-name>

## 1. Purpose

<one paragraph: what this skill achieves, why it exists>

## 2. When to Use

<bullet list: specific intents / signals that trigger this skill>

## 3. When Not to Use

<bullet list: near-neighbor skills and what routes there instead>

## 4. Stage

<which stage of the workflow chain: brainstorm / prd / plan / tasks / work / review / debug / knowledge>

## 5. Inputs

| Input | Required | Source |
|---|---|---|
| <input name> | required / optional | user / upstream skill / repo |

## 6. Outputs

| Output | Format | Location |
|---|---|---|
| <output name> | artifact type | path pattern |

## 7. Core Rules

- MUST: <non-negotiable behaviors>
- NEVER: <absolutely forbidden actions>
- CHECK: <mandatory checks before proceeding>

## 8. Workflow

### Phase 0: Intake

<triage / route decision>

### Phase 1: Gather

<minimal evidence / context loading>

### Phase 2: Execute

<core work>

### Phase 3: Verify / Review Gate

<validation / review steps>

### Phase 4: Handoff / Closeout

<artifact-summary + limitations + next action>

## 9. Skill Handoff

### Upstream Inputs

| From | Artifact | Contract |
|---|---|---|

### Downstream Outputs

| To | Artifact | Gate |
|---|---|---|

### Related Skills

- <near-neighbor>: <when to route there instead>

## 10. Context Harness

### Always Load
- <items always in context>

### Load When Needed
- <item>: trigger = <condition>

### Never Load
- <generated mirrors>
- <audit snapshots>
- <unrelated sessions>

### Context Gaps
- <gap>: consequence = <what cannot be claimed>

## 11. Execution Harness

### Required Steps
1. <step>
2. <step>

### Forbidden Actions
- <action>

### Fallback
- degraded mode: <what changes>
- reason_code: <machine-readable code>
- what cannot be claimed: <explicit list>

## 12. Review Harness

### Review Points
- <checkpoint>: evidence required = <type>

### Blocking Conditions
- <condition>: action = <stop / route-out>

## 13. Evidence Harness

### Required Evidence

| Claim type | Evidence class | Source |
|---|---|---|

### Evidence Rules
- MUST: fact / inference 明确区分
- NEVER: 无证据 confirmed claim

### Unknown Handling
- record as Unknown with gap description
- do not proceed to handoff until gap resolved or explicitly degraded

## 14. Validation Harness

### Validation Commands / Checks

| Artifact | Command | Expected |
|---|---|---|

### Failure Handling
- <failure case>: action = <stop / degrade / ask>

## 15. Knowledge Harness Placeholder

当前阶段不接入团队知识 Git 仓库、Knowledge Resolver、advisory cards 或 source snapshot。
后续团队知识能力开发完成后，只允许通过显式消费合同扩展。

可触发 `spec-compound` 入口保留以下类型知识：
- <知识类型>: trigger = <什么情况下 capture>

## 16. Evaluation Harness

### Golden Cases
- See `evals/golden-cases.json`

### Regression Cases
- See `evals/regression-cases.json`

### Negative Cases
- See `evals/negative-cases.json`
```


---

## 16. Skill 体系治理文件草案

### 16.1 skill-system/skill-audit-checklist.md（核心治理清单）

```markdown
## Skill 质量审查清单

### 基本结构
- [ ] SKILL.md ≤ 200 行（目标）
- [ ] 有明确 When to Use / When Not to Use
- [ ] description frontmatter 包含触发条件和排除场景
- [ ] 有 Skill Handoff 章节（上下游 / related skills）

### Context Harness
- [ ] 有 Always Load / Load When Needed / Never Load 分类
- [ ] 无 "全量加载 references/" 声明
- [ ] generated mirrors 在 Never Load 中
- [ ] 有 Context Gaps 说明

### Execution Harness
- [ ] 有明确 Phase / Steps
- [ ] 有 Forbidden Actions
- [ ] 有 Fallback + reason_code + what cannot be claimed

### Review Harness
- [ ] 有 Review Points（内置评审检查点）
- [ ] 有 Blocking Conditions
- [ ] finding 必须绑定 evidence

### Evidence Harness
- [ ] 有 fact / inference / hypothesis / suggestion / unknown 区分
- [ ] 有 Required Evidence 表
- [ ] NEVER: 无证据 confirmed claim

### Validation Harness
- [ ] 有 Validation Commands/Checks 表
- [ ] 验证结果必须记录（不仅"tests passed"）
- [ ] 有 Failure Handling

### Knowledge Harness Placeholder
- [ ] 有 spec-compound 触发条件
- [ ] 明确标注当前阶段不引入未开发能力

### Evaluation Harness
- [ ] 有 evals/ 目录
- [ ] 有 golden-cases.json
- [ ] 有 negative-cases.json
- [ ] 有 regression-cases.json

### Governance
- [ ] 有 skill version / changelog
- [ ] 有 owner 或 maintainer
- [ ] 共享规则通过 shared/ 引用，不在本 SKILL.md 重复
```

### 16.2 skill-system/skill-version-changelog.md（版本治理草案）

```markdown
## Skill 版本治理

每个 skill 的 SKILL.md frontmatter 添加：
  version: "1.0.0"
  owner: "@leokuang / skill-maintainer"
  last_reviewed: "2026-07-02"
  review_cadence: quarterly

变更分类：
- patch: 文案修正、注释、examples 更新
- minor: 新增 phase/gate/reference，不破坏接口
- major: 核心合同变更、handoff contract 变化、Forbidden Actions 变化

每次 major/minor 变更必须更新 skill-system/skill-version-changelog.md。
```

---

## 17. Eval Cases

（已在 Section 13.3 中列出 10 个代表性 case，涵盖：routing/brainstorm evidence/PRD checkpoint/task hash/work scope/code review evidence/debug no-repro/compound unverified/context load/future knowledge boundary）

---

## 18. 质量回归检查

| 检查项 | 是否通过 | 风险 | 修复建议 |
|---|---|---|---|
| Skill 具备 Context Harness | 部分通过（核心 skill 有，周边 skill 缺失） | P2 | 全量补充 Context Loading Policy |
| Skill 具备 Execution Harness | 通过（所有核心 skill 有 phase 结构） | — | 保持 |
| Skill 具备 Review Harness | 部分通过（code-review/doc-review 强，其余弱） | P1 | brainstorm/compound 补充 Review 门禁 |
| Skill 具备 Evidence Harness | 部分通过（prd/debug/code-review 强，brainstorm/compound 弱）| P0 | brainstorm 补充 evidence tag 体系 |
| Skill 具备 Validation Harness | 部分通过（prd/write-tasks 强，plan/brainstorm 缺失）| P1 | plan 增加 checker 脚本 |
| Skill 具备 Knowledge Harness placeholder | **未通过**（大部分 skill 无 placeholder） | P2 | 全量增加 Knowledge Harness Placeholder |
| Skill 具备 Evaluation Harness | **未通过**（大部分缺 eval cases）| P0 | 高优补充 prd/work/code-review eval cases |
| Skill 具备 Governance Harness | 部分通过（source/runtime 边界强，版本/owner 弱）| P2 | 增加 version/owner |
| Skill 目标清晰 | 通过 | — | — |
| Skill 触发条件明确 | 通过（description frontmatter 存在）| — | — |
| Skill 不适用场景明确 | 通过（When Not to Use 存在）| — | — |
| 输入边界清晰 | 通过 | — | — |
| 输出契约清晰 | 通过 | — | — |
| 上下游交接明确 | 部分通过（核心 skill 有，周边缺失）| P1 | 统一 Skill Handoff section |
| 职责重叠 | **问题**：Anti-Rationalization 在三处重复 | P1 | 移到 shared/rules/ |
| 重复规则 | **问题**：证据边界、blocking question tool 等重复 | P1 | 移到 shared/ |
| 按需加载上下文 | 核心 skill 基本正确 | — | — |
| 避免全量加载 references | 通过（trigger-based loading 存在）| — | — |
| 避免全量加载 examples | 通过（examples-as-context 不是规则）| — | — |
| 保留 Evidence 要求 | 部分通过 | P0 | brainstorm/compound 补 evidence contract |
| 保留质量门禁 | 部分通过 | P1 | plan/brainstorm 增加 gate |
| 保留失败处理 | 通过（fallback 在核心 skill 均有）| — | — |
| 有 eval cases 防退化 | **未通过**（大多数缺失）| P0 | 全量补充 |
| 未来团队知识误接入风险 | 通过（当前均为 placeholder only）| — | — |


---

## 19. 压缩前后对比

| 维度 | 压缩前 | 压缩后目标 | 收益 |
|---|---|---|---|
| 主 Skill 长度（spec-code-review）| 1242 行 | ~200 行 | 84% token 节省，维护难度降低 |
| 主 Skill 长度（spec-work）| 580 行 | ~160 行 | 72% token 节省 |
| 主 Skill 长度（spec-prd）| 294 行 | ~120 行 | 59% token 节省 |
| 主 Skill 长度（spec-plan）| 461 行 | ~160 行 | 65% token 节省 |
| 主 Skill 长度（spec-debug）| 403 行 | ~160 行 | 60% token 节省 |
| 主 Skill 长度（spec-compound）| 646 行 | ~180 行 | 72% token 节省 |
| Skill 边界 | 部分 skill 缺少 When Not to Use | 全部 skill 有 When Not to Use + near-neighbor cues | 误触发减少 |
| Skill 关系 | 无正式 skill-map 文档 | skill-system/skill-map.md | 维护者可全局理解体系 |
| Context Harness | 各 skill 自定义策略 | 统一 Context Loading Policy + shared/context/ | 减少重复，提高一致性 |
| Execution Harness | 质量高但 SKILL.md 过长 | 骨架保留，细节外置 references/ | 维护和阅读成本降低 |
| Review Harness | code-review/doc-review 强；其余薄弱 | 全部 skill 补充 Review Points + Blocking Conditions | review 质量统一 |
| Evidence Harness | prd/debug 强；brainstorm/compound 弱 | 全部 skill 补充 Evidence Contract | 知识质量提升 |
| Validation Harness | prd/write-tasks/debug 有脚本；plan/brainstorm 无 | 补充 plan validator；brainstorm self-check | 产物质量可机器验证 |
| Evaluation Harness | 全部 skill 有 examples-as-context；但普遍**缺 negative cases 和 CI runner** | 补充 negative cases + CI runner hook | 压缩后质量退化可检测 |
| 重复规则 | Anti-Rationalization 等在3处维护 | 移到 shared/rules/，3处引用 | 修改只需一处 |
| 上下文加载方式 | trigger-based 存在但不统一 | 统一 Context Budget Policy | 可审计、可测试 |
| 输出契约 | 分散在各 skill 的 Outputs section | 统一 artifact-summary.v1 + output templates | handoff 互操作性提升 |
| 可维护性 | 高度分散，1000+ 行 skill 维护困难 | 骨架 + 外置，层次清晰 | 单 skill 修改不影响其他 |
| 可验证性 | 脚本验证仅覆盖 prd/write-tasks/compound | 全部 core skill 补充 validation + eval | 质量退化可检测 |
| 质量风险 | P0: eval 缺失（code-review/work/prd） | 补充 eval cases 后风险降至 P2 | 系统回归保护 |


---

## 20. 风险与补救方案

### 20.1 高风险场景矩阵

| 风险场景 | 当前状态 | 最坏情况 | 补救方案 |
|---|---|---|---|
| spec-brainstorm 无 evidence tag，低质量需求流入 spec-plan | P0 | LLM 基于无根据假设生成计划，实现后发现 scope 错误 | 增加 brainstorm 产物 evidence 标注要求；spec-plan 增加 PRD quality check |
| spec-work 有 examples-as-context 但**缺 negative cases 和 CI runner**，压缩后关键 anti-pattern 退化无检测 | P0 | scope 扩展/validation 跳过等 anti-pattern 在压缩后悄然引入 | 补充 scope-expansion negative cases + CI runner；后再压缩 |
| spec-code-review 1242行，维护者难以理解整体结构 | P0 | 修改一处规则导致其他规则静默失效 | 先建立 regression cases，再外置 bash 脚本到 scripts/ |
| 缺少统一 Evidence Harness，上下游 handoff 中证据类型不统一 | P1 | code-review finding 引用 prd inference 当 fact，debug 结论无法被 review 核实 | 建立 shared/evidence/evidence-contract.md + 统一注入 |
| 没有 plan readiness checker 脚本 | P1 | 计划质量仅靠 LLM 自评，实现后发现 plan 有 scope gap | 新增 spec-first plan validate CLI 命令 |
| spec-compound preconditions 为 advisory | P1 | 未验证经验进入 docs/solutions/，误导未来 agent | 在 compound 写入前强制 source_refs 存在性检查 |
| Anti-Rationalization Red Flags 三处维护 | P1 | 一处修改其他两处未同步，规则漂移 | 集中到 shared/rules/anti-rationalization.md |

### 20.2 缓解优先级

**立即处理（本迭代）：**
1. 建立 spec-work、spec-prd、spec-code-review 的 `evals/` 目录和 golden cases
2. 给 spec-brainstorm 增加 Evidence Harness（evidence tag 体系）
3. Anti-Rationalization Red Flags 迁移到 shared/rules/

**下一迭代：**
1. spec-code-review SKILL.md bash 脚本外置到 scripts/
2. 给 spec-plan 增加 plan readiness checker
3. 统一 Context Loading Policy 格式

**后续迭代：**
1. 全部 core skill 增加 Knowledge Harness Placeholder
2. 建立 skill-system/skill-map.md
3. skill 版本号和 changelog 机制

### 20.3 压缩操作风险

| 操作 | 风险 | 缓解措施 |
|---|---|---|
| 外置 spec-code-review bash 脚本 | scripts/ 路径在 runtime 需要与 source 保持同步 | 外置前确认 `spec-first init` 能正确同步脚本 |
| 压缩 spec-prd Phase 细节 | 关键 anti-pattern 描述丢失 | 先建 eval cases，压缩后验证 |
| 移除 spec-work 内联细节 | task-pack validation 细节难以通过 references/ 定位 | 压缩前写清楚 references/task-pack-validation.md 的触发条件 |


---

## 21. 后续演进建议

### 21.1 最小可维护落地顺序

```text
阶段 1：防退化基础（立即）
  ├── 给 spec-work evals/ 补充 golden/negative/regression cases
  ├── 给 spec-prd evals/ 补充 golden/negative cases
  ├── 给 spec-code-review evals/ 补充 golden/negative cases
  ├── spec-brainstorm 增加 Evidence Harness section（evidence tag）
  └── Anti-Rationalization Red Flags 迁移到 shared/rules/

阶段 2：Harness 标准化（1-2 周）
  ├── 建立 shared/context/ 统一 Context Loading Policy
  ├── 建立 shared/evidence/ Evidence Contract
  ├── 建立 shared/handoff/ artifact-summary 格式
  ├── 建立 shared/rules/ 共享规则目录
  └── 所有 core skill 增加 Knowledge Harness Placeholder

阶段 3：主文件压缩（2-4 周，必须在阶段 1 完成后）
  ├── spec-code-review bash 脚本外置到 scripts/
  ├── spec-work Phase 1-2 细节外置到 references/
  ├── spec-prd Phase anti-pattern details 外置
  ├── spec-plan deepening 外置到 references/
  └── 验证：各 skill evals 全部通过

阶段 4：验证能力补齐（持续）
  ├── 新增 spec-first plan validate CLI 命令
  ├── spec-compound source_refs 存在性校验脚本
  └── 建立 skill-system/skill-map.md

阶段 5：治理成熟（长期）
  ├── skill version / changelog 机制
  ├── owner 定义
  └── 团队知识 Git 仓库 / Knowledge Resolver（条件满足后）
```

### 21.2 Harness 演进原则

1. **先防退化，后压缩**：eval cases 是压缩的前提，不是可选项
2. **先共享，后引用**：规则先集中到 shared/，再让各 skill 引用，不重复维护
3. **先 source，后 runtime**：所有 skill 变更从 source 开始，通过 `spec-first init` 同步 runtime
4. **先骨架，后细节**：主 SKILL.md 保留最小执行契约，细节外置
5. **渐进验证**：每阶段完成后运行 `spec-first skill-audit` 确认无 regression
6. **Knowledge Harness 降级明确**：当前阶段 placeholder only，激活条件需明确定义

### 21.3 当前不应做的事（反合理化防线）

| 诱人的念头 | 正确做法 |
|---|---|
| "先把 spec-code-review 压缩了再说 eval" | eval 先行，压缩后验证 |
| "brainstorm evidence tag 以后再加，现在先压缩" | Evidence Harness 是核心约束，缺失就是 P0 |
| "skill-map 可以等做完其他再写" | skill-map 是维护者理解整体的基础，阶段 4 完成 |
| "Anti-Rationalization 三处没问题，都在" | 一处修改其他两处可能不同步，必须收敛到 shared/ |
| "Knowledge Resolver 等开发好了直接加进去" | 必须通过显式消费合同扩展，不得在当前工作流中隐式引入 |

---

## 报告总结

本报告对 spec-first skill 体系进行了全面的 8 维 Harness 审查，覆盖 10 个核心 workflow skill。

**主要结论：**

1. **Execution Harness 是体系最强项**（9/10）：phase 化执行、anti-rationalization 红旗、gate 机制均已成熟
2. **Evidence Harness 存在明显断层**：spec-prd / spec-debug / spec-code-review 有完整的证据体系，而 spec-brainstorm / spec-compound 证据约束薄弱，上下游互操作性差
3. **Evaluation Harness 是最大缺口**（3/10）：spec-work / spec-prd / spec-code-review 三个最高风险 skill 均缺少 eval cases，压缩后质量退化无防线
4. **Context Harness 各自为政**：各 skill 自定义加载策略，需要共享 policy 统一
5. **主 Skill 文件过载**：spec-code-review(1242行)、spec-work(580行)、spec-compound(646行) 远超最小执行契约目标

**最高优先级行动项（P0）：**
- 给 spec-work / spec-prd / spec-code-review 补充 eval cases（先于压缩）
- spec-brainstorm 增加 Evidence Harness
- spec-code-review SKILL.md 大幅压缩（bash 脚本外置到 scripts/）

**已验证：** 以上所有审查结论来自直接读取 `skills/` 目录下各 SKILL.md 原始内容，非 generated runtime 产物。当前审查为 LLM 语义判断层的 advisory 产物，尚未通过 `spec-first skill-audit` CLI 脚本进行确定性校验。建议下一步运行 `node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo .` 获取补充确定性事实。


---

# 第二轮深化审查（20轮多维度分析）

> 审查日期：2026-07-02（续）
> 审查方法：20轮多视角/多角色深度审查
> 审查轮次：R01~R20（架构师/Evidence工程师/Eval工程师/安全/并发/双宿主/治理/PD/收口）

---

## R01. spec-mcp-setup Harness 分析（补漏）

### R01.1 Skill 基本情况

`spec-mcp-setup` 是 spec-first 运行时就绪的"入口守门员"。其正式名称为 `spec-runtime-setup`（`/spec:runtime-setup`），当前因 alias contract 尚未落地，保持 `spec-mcp-setup` 兼容名。

**核心职责：**
- 安装/验证 MCP 服务器（sequential-thinking、context7）
- 安装/验证 helper 工具（agent-browser、ast-grep）
- 安装/初始化可选 provider（CodeGraph、Graphify）
- 写入 `.spec-first/config/tool-facts.json`、`runtime-capabilities.json`、`scenario-fingerprint-setup.json`
- 为下游 workflow 准备确定性 readiness facts

**关键边界：** 脚本准备 deterministic facts，LLM 不做语义决策。

### R01.2 Harness 审查表

| Harness 维度 | 当前情况 | 问题 | 风险等级 | 优化建议 |
|---|---|---|---|---|
| Context Harness | Explore→Present→Decide→Write 四步姿势明确；setup context 仅读 `mcp-tools.json`、`helper-tools.json`、`provider-tools.json` | 无明确 Context Loading Policy 格式声明；无 Never Load 列表 | P2 | 补充 Context Harness section 和 Never Load 声明 |
| Execution Harness | 有7步 Workflow + Workflow Modes（--check/--verify-only/--plan/bare/--only/--refresh）；Bare Setup Flow 分3步骤 | Workflow 细节直接内联在 SKILL.md（180行），过于详细 | P2 | 将 Bare Setup Flow 详细脚本引用外置到 references/ |
| Review Harness | **无内置 Review 检查点** | setup 结果无结构化质量审查 | P1 | 增加 post-setup readiness review checklist |
| Evidence Harness | 有明确的 "setup 不得做语义判断" 边界声明；readiness facts 标注类型（`baseline_ready`、`generated_runtime_manifest.status`）| 缺 fact/inference/advisory 分类标注 | P2 | 在 Output Shape 增加 evidence class 标注 |
| Validation Harness | **最强**：有完整验证命令（check-health、verify-tools、npm run test:mcp-setup）；有7步 Workflow 验证流程 | verify-tools 结果只是 readiness ledger，不验证 MCP 语义正确性 | P2 | 增加 bounded MCP query probe（已有 `query_verified` 概念） |
| Knowledge Harness | **无 Knowledge Harness** | setup 经验无法沉淀（失败模式、环境差异等） | P2 | 增加 Knowledge Harness Placeholder + spec-compound 触发条件 |
| Evaluation Harness | 有 `evals/examples.json`（setup posture drift 使用）| 无 negative cases；无 degraded-mode eval cases | P1 | 补充 degraded/missing-provider eval cases |
| Governance Harness | source/runtime 边界声明非常清晰（`skills/spec-mcp-setup/` is source，`.claude/` 是 mirror）；schema version 7 存在 | 无 skill version/owner；entrypoint 重命名 pending（mcp-setup→runtime-setup）| P2 | 完成 alias contract；增加 version/owner |

### R01.3 spec-mcp-setup 特有优势

1. **最清晰的 Script-LLM 边界**：全文重申"scripts prepare deterministic facts，LLM workflows decide"，是体系中表述最清晰的 skill
2. **最完整的 Output Schema**：`tool-facts.json` 和 `runtime-capabilities.json` 有精确的 schema 定义
3. **最好的 Validation Harness**：4条验证命令精确覆盖 setup 变更场景
4. **Degraded 降级路径完整**：每种失败场景（hash mismatch、CLI unavailable、hook 失败）都有 degraded → next_action 路径

### R01.4 spec-mcp-setup 特有风险

1. **Graphify setup 逻辑过于复杂**：`graphify extract .` → `update .` → `--force` → `hook install` → PATH repair 的七步逻辑内联在主 SKILL.md，维护成本高
2. **`query_verified=true` 的语义模糊**：注释说"reserved for a real probe"，但实际何时设为 true 缺乏清晰标准
3. **entrypoint 重命名 pending**：`spec-mcp-setup` → `spec-runtime-setup` 的 alias contract 未落地，产生双名称混乱
4. **无 Knowledge Harness**：setup 失败经验（特定环境下 graphify 安装失败、某版本 ast-grep 不兼容等）无法积累到 docs/solutions/

### R01.5 整合到 Section 1.3 Skill 目标表（补充）

`spec-mcp-setup` 应从"工具 skill"升级为"基础设施 skill"，因为它是所有 workflow 的运行时前提：

| Skill | 研发阶段 | 目标 | 核心输入 | 核心输出 | Harness 成熟度 |
|---|---|---|---|---|---|
| spec-mcp-setup | 运行时准备 | 安装验证 MCP/helper/provider，写入确定性 readiness facts | host、mcp-tools.json、helper-tools.json | tool-facts.json、runtime-capabilities.json、scenario-fingerprint | Context:中 Execution:强 Review:弱 Evidence:中 Validation:强 Knowledge:无 Eval:中 Governance:中 |

---

## R02. Skill 体系架构师视角：Source/Runtime 边界完整性审查

### R02.1 边界定义现状

spec-first 有明确的 source/runtime 二分法：

| 类型 | 路径 | 职责 |
|---|---|---|
| Source of truth | `skills/`、`agents/`、`templates/`、`src/cli/`、`docs/`、`CLAUDE.md`、`AGENTS.md` | 变更目标，通过 `spec-first init` 同步到 runtime |
| Generated runtime | `.claude/`、`.codex/`、`.agents/skills/` | 只读消费，绝不手改 |

这是体系中**最清晰的架构规则**，几乎每个 SKILL.md 都重申了它。

### R02.2 边界漏洞识别

**漏洞1：runtime 与 source 语义漂移检测机制薄弱**

当前 `spec-first doctor` 和 `spec-skill-audit` 可以检测 runtime drift，但：
- 没有 CI 自动化检查（runtime 是否与 source 同步）
- 没有在 PR review 时自动触发 drift 检测
- 生成后的 runtime 内容是否"语义忠实"于 source 完全无验证

**漏洞2：CLAUDE.md 的 dual-nature 造成边界模糊**

`CLAUDE.md` 既是 source（项目 host 入口文档），又有 "managed blocks" 是 generated（由 `spec-first init` 管理）。这导致：
- 哪部分是 source、哪部分是 generated 需要人工判断
- `spec-first init` 更新 managed block 时如果出错，可能覆盖用户自定义内容
- 当前无明确的 merge 策略文档

**漏洞3：`spec-mcp-setup` setup 写入路径混合 source 和 runtime**

`spec-mcp-setup` 写入：
- `.spec-first/config/tool-facts.json` — **setup artifact，非 runtime mirror，也非 source**
- `.spec-first/workspace/scenario-fingerprint-setup.json` — 同上
- `AGENTS.md` managed section（provider install 后）— **source 层！**

这里存在一个边界问题：`setup` 写入 `AGENTS.md` managed section 后，`spec-first init` 也会写入同一文件的其他 managed section。两者的 merge 策略未明确文档化。

**漏洞4：provider tools 的 runtime/source 分类模糊**

- `graphify-out/` — provider runtime artifact，`.gitignore` 中被忽略（正确）
- `.codegraph/` — provider runtime artifact，`.gitignore` 中被忽略（正确）
- `graphify-out/wiki/index.md`、`graphify-out/GRAPH_REPORT.md` — 这两个文件是否可以提交到 repo？当前无明确规则

### R02.3 边界健康度评分

| 边界 | 健康度 | 问题 |
|---|---|---|
| skills/ vs .claude/ | 🟢 强 | 规则清晰，所有 skill 重申 |
| CLAUDE.md source vs managed | 🟡 中 | dual-nature 造成模糊 |
| setup artifacts vs source | 🟡 中 | .spec-first/config/ 分类模糊 |
| provider artifacts | 🟡 中 | graphify wiki 提交规则不明 |
| CI 自动化 drift 检测 | 🔴 弱 | 无自动化 |

### R02.4 架构建议

1. 增加 `docs/contracts/source-runtime-boundary.md` 明确所有路径分类
2. CI 中增加 `spec-first doctor --check-drift` 命令（如尚不存在，定义其接口）
3. `CLAUDE.md` managed block 变更需要 explicit merge 策略文档
4. `graphify-out/wiki/` 和 `GRAPH_REPORT.md` 明确 gitignore 策略

---

## R03. Context Engineering 专家视角：上下文全链路问题

### R03.1 当前上下文加载模式分析

spec-first skill 体系中存在4种上下文加载模式：

| 模式 | 代表 Skill | 机制 |
|---|---|---|
| Phase-triggered loading | spec-brainstorm | "Phase 3: read references/brainstorm-sections.md" |
| Reference Trigger Map | spec-prd | 表格：trigger present → load specific reference |
| STOP directive | spec-plan | "STOP. Before Phase 0, read references/governance-boundaries.md" |
| Inline priority load | spec-work | Context Orientation Anchor section 固定描述 |

这4种模式功能等价但形式不一，在跨 skill context 传递时造成认知负担。

### R03.2 上下文过载风险矩阵

| Skill | 主 SKILL.md 行数 | references/ 数量 | 过载风险 |
|---|---|---|---|
| spec-code-review | 1242 | 8 | 🔴 极高 |
| spec-work | 580 | 2 | 🔴 高 |
| spec-compound | 646 | 5 | 🔴 高 |
| spec-plan | 461 | 13 | 🟡 中高 |
| spec-debug | 403 | 4 | 🟡 中 |
| spec-doc-review | 312 | 7 | 🟡 中 |
| spec-prd | 294 | 8 | 🟡 中（Reference Trigger Map 已缓解）|
| using-spec-first | 236 | 9 | 🟡 中 |
| spec-brainstorm | 81 | 14 | 🟡 中（按需加载设计合理） |
| spec-mcp-setup | 192 | 1 | 🟢 低 |

**关键发现：** spec-prd 虽有294行，但因 Reference Trigger Map 设计，实际上下文按需加载效率最高。spec-code-review 是最需要改造的 skill（1242行，多数为执行细节）。

### R03.3 跨 Skill 上下文传递问题

**问题1：artifact-summary.v1 使用不统一**

- spec-work、spec-code-review 有 résumé-first handoff 机制
- spec-prd、spec-brainstorm 无 artifact-summary 概念
- 导致 brainstorm → prd → plan 链条中，上游产物进入下游时无 summary 协议

**问题2：docs/solutions/ recall 各自触发**

- spec-debug 默认开启 recall（skip on trivial-bug fast-path）
- spec-plan 有 recall 但非默认
- spec-work 提到 recall 但无明确触发条件
- spec-brainstorm 无 recall

**问题3：上下文 budget 无全局协调**

每个 skill 独立估算上下文需求，无跨 skill 的 budget 视图。当多 skill 嵌套使用（如 spec-work 内部调用 spec-code-review mini review）时，上下文堆叠无管理。

### R03.4 "Lost in the Middle"风险

spec-code-review SKILL.md 有1242行，Stage 1~6 重要规则散落其中。基于 "Lost in the Middle" 研究（模型在长 prompt 中部分遗忘中段内容），以下规则有被遗忘的风险：

- Stage 2b Plan discovery（约在第500行）
- Stage 3 reviewer preflight 中的 `sensitive_diff` 判断
- Autofix mode rules 中的 "never commit, push, or create a PR"

这是 P0 级风险——规则本身存在，但模型可能忽略它。

### R03.5 Context Engineering 改进建议

| 优先级 | 建议 | 原因 |
|---|---|---|
| P0 | spec-code-review bash 脚本必须外置到 scripts/ | 1242行是 Lost in Middle 最高风险 |
| P0 | spec-work Phase 1 task-pack validation 细节（约200行）外置 | 高频调用 + 高风险段落在中部 |
| P1 | 建立统一 artifact-summary.v1 协议 for brainstorm/prd/plan | 跨 skill 链路中 summary 丢失 |
| P1 | 统一 Context Loading Policy 格式（Reference Trigger Map 标准化为全局模式） | 4种模式造成维护不一致 |
| P2 | 全局 docs/solutions/ recall 触发策略文档化 | 三处不同触发机制 |
| P2 | 跨 skill 嵌套调用的 context budget 管理 | spec-work + spec-code-review 嵌套时无 budget 协调 |


---

## R04. Evidence 工程师视角：Evidence Harness 跨 Skill 互操作审查

### R04.1 当前 Evidence 词汇表现状

| Skill | Evidence 分类词汇 | 分类层级 |
|---|---|---|
| spec-prd | confirmed-source / user-stated / source-candidate / external-research / assumption | 5级，最完整 |
| spec-debug | claims_validated_by / claims_remaining_advisory | 2级，仅区分 confirmed vs advisory |
| spec-code-review | confidence: 0/25/50/75/100 + evidence[] | 数值置信度 + 证据数组 |
| spec-plan | confirmed / advisory / session-local / stale / user | 5级 source tag |
| spec-work | confirmed-source / advisory / session-local / stale / user | 同 plan |
| spec-compound | source_confirmed + invalidation_condition + source_refs | 结构化促进字段 |
| spec-brainstorm | **无 evidence 词汇** | 缺失 |
| spec-doc-review | confirmed-source / user-stated / source-candidate / assumption | 4级（借鉴 prd） |

**核心问题**：9个核心 skill 使用了至少5种不同的 evidence 分类体系，上下游 handoff 时无法互操作。

### R04.2 跨链路 Evidence 流转分析

```text
spec-brainstorm（无 evidence tag）
    ↓ requirements doc（无 evidence class）
spec-prd（source-candidate / confirmed-source / assumption）
    ↓ PRD artifact（有 evidence class）
spec-plan（confirmed / advisory / session-local / stale）
    ↓ plan doc（有 source_tag）
spec-work（继承 plan source_tag）
    ↓ code diff + verification
spec-code-review（evidence[] + confidence 0-100）
    ↓ findings report（有 finding schema）
spec-compound（source_refs + source_confirmed）
    ↓ docs/solutions/*.md（有结构化 evidence）
```

**断点识别：**
1. **brainstorm → prd 断点**：brainstorm 产出无 evidence tag，prd 无法区分哪些是 user-confirmed 哪些是 LLM 推断
2. **prd → plan 断点**：prd 的 "confirmed-source" 和 plan 的 "confirmed" 是相同含义的不同词汇
3. **work → code-review 断点**：work 产出的 verification-run-summary.v1 和 code-review 的 evidence[] 格式不同

### R04.3 Evidence 可信度降级路径问题

当前体系中存在以下"证据信任通货膨胀"风险：

| 风险 | 路径 | 后果 |
|---|---|---|
| session-local 升级为 confirmed | plan → work，session-local 决策在 work 执行时被当作 confirmed | 实现基于会话记忆而非 source 证据 |
| assumption 不传递 | prd assumption → plan 时丢失 assumption 标记 | plan 当作 confirmed 事实使用 |
| advisory recall 污染 result | docs/solutions/ recall 在 plan/work 中被当作 fact | 过时经验影响当前实现决策 |
| source-candidate 未验证升级 | prd 的 source-candidate 在 plan 中被引用为已确认 | 需求基于未验证假设 |

### R04.4 Evidence 统一化建议

**最小统一方案（不破坏现有 skill）：**

```yaml
# shared/evidence/evidence-class-v1.yaml
evidence_classes:
  fact:
    alias: [confirmed-source, confirmed, verified]
    definition: "来自当前文件/代码/测试/日志/diff/用户明确输入"
    usage: "可直接支撑 confirmed 结论"

  inference:
    alias: [advisory, session-local]
    definition: "基于 fact 推断，需标注推断路径"
    usage: "可用于 recommendation，不得用于 confirmed 声明"

  hypothesis:
    alias: [source-candidate, stale]
    definition: "待验证，需独立验证后才能提升为 fact"
    usage: "只能作为 investigation target"

  assumption:
    alias: [assumption, external-research]
    definition: "未验证前提，须显式标注"
    usage: "须在 outstanding questions 或 evidence gaps 中可见"

  unknown:
    definition: "当前无法确认"
    usage: "须说明何种证据可关闭此 gap"
```

各 skill 保留其原有词汇，在 handoff artifact 中附加 canonical class 映射。

### R04.5 Evidence 合规性 Checklist

| Skill | 下游 handoff 是否携带 evidence class | 是否有 "无证据不声明 confirmed" 强制机制 | 合规评分 |
|---|---|---|---|
| spec-prd | ✅ readiness_outcome 包含 evidence | ✅ prd-prewrite-guard | 9/10 |
| spec-debug | ⚠️ Debug Summary 仅区分 validated/advisory | ✅ causal-chain-gate | 7/10 |
| spec-code-review | ✅ evidence[] 在 finding schema 中强制 | ⚠️ 仅 schema 层面，未 lint | 8/10 |
| spec-plan | ⚠️ source_tag 存在但不在输出 artifact 中 | ❌ 无强制机制 | 5/10 |
| spec-work | ⚠️ verification-run-summary 存在但非必填 | ⚠️ anti-rationalization 是提示不是 gate | 6/10 |
| spec-brainstorm | ❌ 无 evidence tag | ❌ 无机制 | 2/10 |
| spec-compound | ✅ source_refs 强制 | ✅ validate-frontmatter.py | 9/10 |
| spec-doc-review | ⚠️ finding schema 包含 evidence | ⚠️ 依赖 reviewer 自觉 | 6/10 |
| spec-mcp-setup | ⚠️ readiness facts 有类型但无 fact/inference 区分 | N/A（setup 不做语义判断）| 7/10 |

---

## R05. LLM 幻觉防控专家视角：哪些约束真正防幻觉

### R05.1 幻觉分类与当前防控机制

| 幻觉类型 | 定义 | 当前防控机制 | 防控有效性 |
|---|---|---|---|
| 声明幻觉（Claim Fabrication）| "测试已通过"但未运行测试 | Anti-Rationalization Red Flags、verification-run-summary | ⚠️ 提示层面，非 gate |
| 范围幻觉（Scope Hallucination）| 超出 plan/task-pack scope 实现 | spec-work scope expansion gate、stop_if | ✅ 有确定性机制 |
| 证据幻觉（Evidence Fabrication）| 凭空生成 source ref | causal-chain gate、evidence[] 强制 | ⚠️ 部分强制 |
| 完成幻觉（Completion Fabrication）| 声明完成但 artifact 未写入 | verification gate（prd：finalize script）| ✅ 对 prd/write-tasks 有效 |
| 路由幻觉（Routing Hallucination）| 路由到不适用 workflow | using-spec-first routing rules | ⚠️ 只有 eval 能防退化 |
| 权威幻觉（Authority Fabrication）| 把 advisory 当 confirmed | evidence class 系统 | ⚠️ 不统一 |
| 历史幻觉（History Fabrication）| 把会话记忆当 source fact | recall trust boundary | ⚠️ 声明但无强制 |

### R05.2 "真正防幻觉"的机制（有确定性强制）

体系中以下机制**真正防幻觉**（不依赖 LLM 自觉）：

1. **`spec-first tasks validate --json`**：task pack hash mismatch 时确定性阻断，LLM 无法绕过
2. **`prd-prewrite-guard` (Claude PreToolUse hook)**：写入 ready PRD 前 Claude 层拦截，LLM 写入意图被 hook 阻断
3. **`finalize-prd-artifact.js` + `check-prd-artifact.js`**：checker blocking reason_codes 有确定性语义
4. **`validate-frontmatter.py`**：YAML parser-level 验证，文件格式错误会被拒绝
5. **`scripts/resolve-base.sh`**：code-review base branch 解析，失败时脚本返回 error 而非 LLM 猜测
6. **scope expansion gate in spec-work**：`stop_if` 字段是 task-pack 级别的硬边界

以上6个机制是"Script enforces, LLM cannot bypass"的真实防线。

### R05.3 "伪防幻觉"的机制（仍依赖 LLM 自觉）

以下机制在 SKILL.md 中声称防幻觉，但实际上依赖 LLM 遵守：

1. **Anti-Rationalization Red Flags 表**：只是"注意力提醒"，SKILL.md 本身就承认"不是 gate，不替代 LLM 判断"
2. **Causal Chain Gate（spec-debug）**：SKILL.md 说"Do not proceed to Phase 3 until..."，但无 hook 强制
3. **spec-work scope expansion**：除 `stop_if` 外的 scope 检查依赖 LLM 读懂 non-goals
4. **Recall Trust Boundary**："treat as advisory"是 LLM 被要求的态度，无机制强制
5. **PRD Four Legal Stop Points**：明确条件但无 checker 验证每个 OQ 是否合法关闭

### R05.4 防幻觉能力提升建议

| 改进项 | 当前状态 | 目标 | 实现方式 |
|---|---|---|---|
| spec-plan completion claim | LLM 声明 | 需要 plan readiness checker | 新增 `spec-first plan validate --json` CLI |
| spec-brainstorm evidence | 无任何防护 | evidence tag 强制 | 增加 brainstorm output schema 验证 |
| spec-work "tests passed" claim | Anti-Rationalization 提示 | 需要 run-summary ref | 强制 closeout 引用 verification-run-summary |
| spec-compound unverified knowledge | validate-frontmatter（格式）| 需要 source_refs 内容验证 | 脚本检查 source_refs 路径是否可达 |
| Codex PRD guard | degraded（无 hook）| 需要等效机制 | spec-first plan validate 作为 pre-write check |

---

## R06. Evaluation 工程师视角：Eval 缺口定量分析

### R06.1 当前 Eval 资产盘点

> ⚠️ 初版审查错误修正（2026-07-02 复核）：初版将 spec-prd/work/code-review/debug/compound/doc-review 标注为"无 evals 目录"，**事实不符**。所有核心 skill 均有 `evals/` 目录和 JSON 文件。以下为修正后的实际情况。
>
> **重要区分**：各 skill 的 `examples.json` 性质为「Examples-as-context for fresh-source evaluation」（见 spec-prd/evals/examples.json schema_version: `spec-prd-evals.v1`），是供人工/LLM fresh-source eval 使用的结构化样本，**不是 CI 自动化回归 runner**。spec-write-tasks 拥有最完整的 eval 体系（7个 JSON 文件，含 trigger/boundary/failure/output-quality cases）。

| Skill | evals/ 目录 | JSON 文件数 | 总行数 | eval 类型 | 覆盖质量 |
|---|---|---|---|---|---|
| using-spec-first | ✅ | 3 | ~364 | examples + routing-cases + routing-discipline | 🟢 路由正/反例齐备 |
| spec-brainstorm | ✅ | 1 | ~133 | routing-cases | 🟡 仅路由场景，无 output-quality |
| spec-prd | ✅ | 1 | **2693** | examples（111 cases，含 positive/boundary/route-out/failure/adversarial）| 🟢 最完整的 examples-as-context |
| spec-plan | ✅ | 2 | ~615 | examples + output-quality-cases | 🟡 有质量 cases，无 negative |
| spec-write-tasks | ✅ | 7 | ~589 | trigger/boundary/failure/output-quality/expected-behavior | 🟢 结构最完整 |
| spec-work | ✅ | 1 | ~74 | examples | 🟡 仅 examples，无 boundary/negative |
| spec-code-review | ✅ | 1 | ~117 | examples（trigger/boundary 覆盖）| 🟡 有 examples，无独立 negative |
| spec-doc-review | ✅ | 1 | ~74 | examples | 🟡 仅 examples |
| spec-debug | ✅ | 1 | ~50 | examples | 🟡 仅 examples |
| spec-compound | ✅ | 1 | ~83 | examples | 🟡 仅 examples |
| spec-skill-audit | ✅ | 4 example files | — | 文本 example files | 🟡 非 JSON 结构化 cases |
| spec-team-standards-governance | ✅ | 有 golden-samples/ | — | 有 README | 🟡 部分 |
| spec-mcp-setup | ✅ | 1 | ~37 | examples | 🟡 仅 examples，偏小 |

**修正后汇总：** 所有核心 skill **均有 evals/ 目录和 JSON 文件**。真正的缺口是：
- **examples-as-context ≠ 自动化回归 runner**：没有一个 skill 有可以 CI 执行的回归测试 runner。
- **负例（negative cases）极度缺乏**：除 using-spec-first routing-discipline-cases 和 spec-write-tasks failure-cases 外，无 skill 有专门的 negative eval JSON。
- **eval 规模差距巨大**：spec-prd（2693行/111个 case）vs spec-debug（50行）差距悬殊，保护密度不均。
- **上下游 handoff 质量场景** 和 **degraded-mode 场景** 在所有 skill 中均缺失。

### R06.2 Eval 缺口的具体含义（修正后）

修正后的缺口定义：各 skill 均有 examples-as-context JSON，但**缺少可自动化回归运行的 test runner、专用 negative cases 和跨 skill handoff quality cases**。

**对 spec-prd（examples 存在但缺口仍在）：**
- examples.json 有 111 个样本，但没有 CI 自动化执行机制（non-runner）
- 无专门针对 checkpoint-as-escape / direct-write-after-read 的 **negative 场景 JSON**
- 无跨 skill handoff 质量 eval（prd→plan 的 evidence 传递是否正确）
- SKILL.md 压缩后，examples 能否覆盖回归仍不确定

**对 spec-work（缺口）：**
- examples.json 仅 74 行，样本量极少
- 无 scope-expansion negative cases
- 无 task-pack hash mismatch 场景
- 无 Anti-Rationalization 回归 eval

**对 spec-code-review（缺口）：**
- examples.json 117 行，覆盖部分 trigger/boundary
- 无 reviewer 选择逻辑（scale-aware preflight）的专用 eval
- 无 evidence-less finding 降级的 negative case
- 无 degraded dispatch（单 agent fallback）场景

**整体真正的 P0 缺口（修正后）：**
- 无任何 skill 有可 CI 执行的自动化回归 runner
- negative cases（negative-cases.json）几乎全部缺失
- handoff quality 和 degraded-mode 场景全部缺失
- eval 规模严重不均（spec-prd 2693行 vs spec-debug 50行）

### R06.3 Eval 建设优先级矩阵（修正后）

真正的缺口是**缺少 negative cases、自动化 runner 和 handoff/degraded 场景**，而非"无 eval 目录"：

| 优先级 | Skill | 当前状态 | 需要补充的最小 eval | 估算工作量 |
|---|---|---|---|---|
| P0-第一周 | spec-prd | 111个 examples，但无 negative runner | 专门的 checkpoint-as-escape negative cases JSON + CI runner hook | 中 |
| P0-第一周 | spec-work | 74行 examples，覆盖极少 | scope-expansion negative cases + bare/plan/task-pack golden cases 补充 | 中 |
| P0-第一周 | spec-code-review | 117行 examples | evidence-less finding negative + degraded dispatch 场景 | 中 |
| P1-第二周 | spec-debug | 50行 examples | no-repro negative cases + causal chain gate regression | 低 |
| P1-第二周 | spec-compound | 83行 examples | unverified-promotion negative + source_refs drift regression | 低 |
| P1-第二周 | spec-plan | 615行（examples+quality），相对充分 | WHAT-invention negative + handoff quality cases | 低 |
| P2-第三周 | spec-brainstorm | 133行 routing-cases | output evidence-tag quality cases | 低 |
| P2-第三周 | spec-doc-review | 74行 examples | dispatch-unavailable degraded + document type misclassification | 低 |
| P3-后续 | 所有 skill | — | context-load-cases（不全量加载）| 中 |
| P3-后续 | 所有 skill | — | 跨 skill handoff quality cases | 高 |


---

## R07. 产品工程师视角：Skill 用户侧摩擦点分析

### R07.1 用户侧最大摩擦点

**摩擦点1：入口混乱 — 相似场景不知选哪个 Skill**

用户面临的常见困惑：
- "想改一个已有功能的需求文档" → spec-brainstorm or spec-prd？
- "已有 plan，想执行" → spec-work or spec-write-tasks？
- "代码 review" → spec-code-review or spec-doc-review？
- "想优化一个指标" → spec-optimize or spec-work？

`using-spec-first` 有 Route Map，但决策树不够可视化，用户需要大量阅读才能做出选择。

**摩擦点2：Workflow 过长 — 用户需要在中途等待多次交互**

spec-prd 的 grill-with-docs 流程设计为"relentless one-question-at-a-time"，这是正确的工程决策，但用户感知上可能像"被审讯"。当问题超过5个时，用户容易选择 owner-cap 绕过，导致 PRD 质量下降。

**摩擦点3：Degraded Mode 体验差**

当 dispatch 不可用（如 Codex 无 spawn_agent 授权）时，多个 skill 降级为"single-agent report-only"。这个降级：
- 用户不总是知道当前是 degraded 模式
- Degraded 模式下 coverage 不如完整模式，但 SKILL.md 没有说明哪些结论在 degraded 模式下不可信

**摩擦点4：产物命名约定需要记忆**

- brainstorm → `docs/brainstorms/*.md`
- requirements → `docs/brainstorms/*-requirements.md`
- plan → `docs/plans/YYYY-MM-DD-NNN-type-name-plan.md`
- task → `docs/tasks/*.md`
- solution → `docs/solutions/[category]/[filename].md`

5种不同的路径规则，用户必须记住或每次查阅。

### R07.2 用户侧快速胜利改进

| 改进项 | 用户价值 | 实现成本 |
|---|---|---|
| using-spec-first 增加可视化决策树 | 消除入口选择困惑 | 低（仅文档） |
| spec-prd 增加 "soft-cap offer" 提示（每3个问题后询问是否继续） | 减少 owner-cap 反应性绕过 | 低（SKILL.md 修改） |
| Degraded mode 在输出中显眼标注 | 用户明确知道结论可信度 | 低（输出格式） |
| `spec-first init` 后生成 workflow cheatsheet | 减少路径规则记忆负担 | 中（CLI 新功能） |
| spec-work "bare prompt" 时自动识别意图并给出 recommended workflow | 减少"用 spec-work 做 spec-plan 能做的事"的误用 | 中（SKILL.md）|

---

## R08. 安全工程师视角：注入/边界风险分析

### R08.1 Prompt Injection 风险评估

| 风险场景 | 涉及 Skill | 当前防护 | 风险等级 |
|---|---|---|---|
| 外部 issue/PR body 包含注入指令 | using-spec-first, spec-debug, spec-code-review | `provider_untrusted` 标记；明确声明不执行 reporter commands | P2 |
| docs/solutions/ 中过时文档包含"按此指令操作"型内容 | spec-plan, spec-work, spec-debug | recall trust boundary 声明 | P2 |
| PRD 文档中嵌入 agent 指令 | spec-prd | PRD Sanitization（分离 product facts 和 embedded agent instructions）| P1 |
| 设计文件（Figma/截图 OCR）中嵌入指令 | spec-prd | design-source evidence 处理中有 untrusted 标注 | P1 |
| 外部 code repository 中嵌入 CLAUDE.md 注入 | spec-mcp-setup（处理外部 repo） | 无明确防护 | P2 |
| task-pack body 中嵌入执行指令 | spec-work | task-pack 仅读 frontmatter/schema，semantic posture 检查 | P2 |

**总体评估：** spec-first 对 injection 有一定意识（`provider_untrusted`、PRD Sanitization），但缺少统一的 injection hardening 规范。

### R08.2 Boundary 越界风险

**风险1：spec-work 自动 PR 创建的范围**

spec-work 在完成后默认"commit and PR"，如果 scope 判断有误，可能创建包含未授权更改的 PR。当前：
- 有 scope expansion gate
- 有 diff verification 步骤
- 但 untracked files 需要用户手动 `git add`，不自动包含

**风险2：spec-mcp-setup 写入 AGENTS.md/CLAUDE.md 的 injection surface**

setup 在安装 provider 后会修改 AGENTS.md 或 CLAUDE.md。如果 provider（如 Graphify）的 project install 脚本被篡改，可能注入恶意指令到 host instruction file。当前无对 provider-written content 的验证。

**风险3：spec-compound 的 discoverability check 写入 AGENTS.md/CLAUDE.md**

spec-compound 在 discoverability check 中可能写入 AGENTS.md/CLAUDE.md。虽然是小改动，但这是一个容易被利用的写入路径。

### R08.3 安全加固建议

| 优先级 | 建议 | 原因 |
|---|---|---|
| P1 | spec-prd PRD Sanitization 明确列举 injection 检测模式 | 当前"embedded agent instructions"说明不够具体 |
| P1 | spec-mcp-setup provider-written content 验证 | provider AGENTS.md 写入无内容审查 |
| P2 | 建立统一 injection hardening 规范到 shared/rules/ | 各 skill 各自处理，规则不统一 |
| P2 | spec-compound AGENTS.md 写入前要求用户显式确认 | 当前已有 consent prompt，但应强化 |
| P3 | spec-work PR 创建前显示 diff summary 供用户确认 | 已有预览步骤，但可以更显眼 |

---

## R09. 并行协作场景视角：多 Agent 并发下的 Skill 行为

### R09.1 当前多 agent 协作场景

spec-first 中有以下多 agent 场景：

| 场景 | Skill | 并发模式 | 隔离机制 |
|---|---|---|---|
| spec-code-review 多 persona | spec-code-review | 并行 reviewer dispatch | 读 only，orchestrator 合并 |
| spec-doc-review 多 persona | spec-doc-review | 并行 reviewer dispatch | 读 only |
| spec-work 并行实现 | spec-work | 可选 parallel subagents | worktree 隔离 or 共享目录 |
| spec-plan deepening | spec-plan | 研究 agent dispatch | 读 only |
| spec-compound Phase 1 | spec-compound | 并行研究 subagents | 读 only，orchestrator 写 |

### R09.2 多 Session 并发风险

`using-spec-first` 有 Multi-Session Awareness（`spec-first session list --json`），当 `active_count >= 2` 时发出 advisory。但：
- 这是 advisory only，不阻断
- 只在 "substantial work" 前触发
- 只检查当前 worktree，不跨 worktree
- 两个 session 可能同时修改 `CHANGELOG.md` 导致冲突

**具体冲突场景：**

1. Session A 正在 spec-prd（写 docs/brainstorms/*）
   Session B 正在 spec-plan（读 docs/brainstorms/*，写 docs/plans/*）
   → 可能基于 Session A 未完成的 PRD 生成 plan（race condition）

2. Session A 正在 spec-work（写 src/...）
   Session B 正在 spec-code-review（读 diff of src/...）
   → Session B 可能 review 到 Session A 未完成的代码

3. 两个 spec-compound 同时写 docs/solutions/（不同 category）
   → 无冲突（不同文件），但 discoverability check 可能同时修改 AGENTS.md

### R09.3 并行 Agent 协作改进建议

| 建议 | 优先级 |
|---|---|
| spec-first session 增加 per-file lock 机制（advisory）| P2 |
| spec-work parallel subagents 的 worktree isolation 文档化为推荐而非可选 | P2 |
| spec-compound discoverability check 写入前检查 session 并发状态 | P3 |
| 建立 Session 协调协议（哪些产物可以并发写，哪些是独占）| P2 |

---

## R10. Codex/Claude 双宿主视角：Harness 一致性审查

### R10.1 双宿主差异清单

| 能力 | Claude Code | Codex | 差异影响 |
|---|---|---|---|
| PRD prewrite guard | ✅ PreToolUse hook | ❌ 无等效 hook | **P0**：Codex 无法阻止 direct-write-after-read |
| AskUserQuestion 工具 | ✅ 原生支持 | ❌ 用 request_user_input | 用户交互方式不同，但功能等价 |
| spawn_agent 授权 | 自动授权（Agent tool）| 需要显式 spawn_agent 授权 | **P1**：Codex 多 persona review 默认 fallback |
| Task tracker | TaskCreate/TaskUpdate | update_plan（Codex）| workflow 内部 task 管理不同 |
| Session history | ~/.claude/projects/ | ~/.codex/sessions/ | spec-sessions 需要分别处理 |
| Startup reminder | SessionStart hook | 依赖 managed instruction guidance | Codex startup 不如 Claude 确定性 |
| Plan Mode | ✅ 原生支持 | ❌ 无等效 | spec-plan 的 plan-only safety 在 Codex 依赖 "loud convention" |
| Worker worktree isolation | `isolation: "worktree"` | fork workspace semantics | 并行实现的隔离方式不同 |

### R10.2 降级路径一致性审查

每个有降级路径的 skill 是否对两个宿主都声明了降级状态：

| Skill | Claude 降级声明 | Codex 降级声明 | 一致性 |
|---|---|---|---|
| spec-prd | ✅ prd-prewrite-guard + codex_prd_guard: not_available | ✅ 明确说明 Codex enforcement 是 degraded | 🟢 一致 |
| spec-plan | ✅ blocking question tool fallback | ⚠️ 仅说明 Codex edit modes 无 request_user_input | 🟡 部分 |
| spec-code-review | ✅ dispatch unavailable → single-agent fallback | ✅ spawn_agent 限制明确 | 🟢 一致 |
| spec-doc-review | ✅ dispatch_authorization_missing fallback | ✅ Codex dispatch 需显式授权 | 🟢 一致 |
| spec-debug | ✅ AskUserQuestion fallback | ⚠️ Codex edit modes fallback 说明不够 | 🟡 部分 |
| spec-compound | ✅ AskUserQuestion fallback | ⚠️ 同上 | 🟡 部分 |
| spec-mcp-setup | ✅ 区分 Claude/Codex runtime path | ✅ detect-tools.sh 路径分别处理 | 🟢 一致 |
| spec-brainstorm | ❌ 无降级声明 | ❌ 无 | 🔴 两者都缺失 |

### R10.3 双宿主 Harness 核心问题

**问题1：Codex 无法硬强制的 gate 必须"响亮约定"**

CLAUDE.md 要求："缺 runtime 强制能力时，verification / handoff / knowledge-promotion gate 降级为响亮约定，必须显式声明未强制及原因，不得静默放行或伪造已硬强制。"

检查结果：
- spec-prd：✅ 明确声明 `codex_prd_guard: not_available`
- spec-plan：⚠️ 无明确的 Codex plan-only safety 降级声明
- spec-work：⚠️ task-pack validation 在 Codex 降级状态不明确

**问题2：using-spec-first Route Map 的 Claude/Codex 分列存在维护问题**

每次新增/修改 workflow，Route Map 的两列（Claude `/spec:*` 和 Codex `$spec-*`）都需要同步修改。当前无自动化验证两列一致性的机制。

**问题3：spec-mcp-setup 的 entrypoint 重命名未完成**

计划中的 `/spec:runtime-setup` (`$spec-runtime-setup`) → `/spec:mcp-setup` (`$spec-mcp-setup`) 的 alias contract 尚未落地，导致两个宿主的 using-spec-first 路由表中仍用旧名称。

### R10.4 双宿主一致性改进建议

| 建议 | 优先级 |
|---|---|
| spec-plan 增加 Codex plan-only safety 降级声明 | P1 |
| 自动验证 using-spec-first Route Map Claude/Codex 两列一致性 | P2 |
| 完成 mcp-setup → runtime-setup alias contract | P2 |
| 所有 skill 补充 AskUserQuestion/request_user_input 降级路径 | P2 |

---

## R11. Validation Harness 深度审查：哪些 Gate 是"伪 Gate"

### R11.1 Gate 真实性分类

**真 Gate（Deterministic + Cannot Bypass）：**

| Gate | 机制 | 强制层级 |
|---|---|---|
| PRD prewrite guard | Claude PreToolUse hook 拦截 Write 工具调用 | 工具层（LLM 无法绕过）|
| task-pack hash validation | `spec-first tasks validate --json` CLI | CLI 层（返回 exit code 1）|
| YAML frontmatter validation | `python3 validate-frontmatter.py` | 文件格式层 |
| base-branch resolution | `scripts/resolve-base.sh` error on failure | 脚本层（不会静默降级）|
| task-pack `stop_if` | spec-work 读取 task card stop condition | LLM 必须读 + 遵守（partial gate）|

**伪 Gate（LLM 可绕过 / 无强制）：**

| 伪 Gate | 声称的机制 | 实际问题 |
|---|---|---|
| spec-plan "STOP. Read governance-boundaries.md" | 文本指令 | LLM 可以跳过读取步骤 |
| Anti-Rationalization Red Flags | 注意力提醒 | SKILL.md 本身承认"不是 gate" |
| spec-debug Causal Chain Gate | "Do not proceed to Phase 3 until..." | 无 hook，LLM 可直接进入 Phase 3 |
| spec-prd Four Legal Stop Points | 文本条件 | checker 只验证 OQ closure token，不验证 stop point 是否合法 |
| spec-compound "problem must be solved" | advisory precondition XML | `<preconditions enforcement="advisory">` 明确声明不强制 |
| spec-work "run feedback loop first" | 注意力提醒 | 无 feedback loop 验证步骤 |
| Codex PRD guard | "loud convention" | 无 hook 等效机制 |

### R11.2 "伪 Gate" 影响等级

| 伪 Gate | 若 LLM 绕过的后果 | 影响等级 |
|---|---|---|
| spec-plan STOP 指令被跳过 | 计划基于 governance-boundaries 约束但未真正读取，可能违反架构规则 | P1 |
| spec-debug Causal Chain Gate 被跳过 | 基于未验证 hypothesis 实施修复，可能引入错误 | P1 |
| spec-compound precondition 未满足 | 未解决问题的经验进入知识库 | P1 |
| spec-work feedback loop 未建立 | 改动未经任何验证 | P2 |
| spec-prd Four Legal Stop Points 错误应用 | 不合法的 closure 使 OQ 静默通过 checker | P1 |

### R11.3 Gate 真实化路径

| 伪 Gate | 真实化方案 | 实现成本 |
|---|---|---|
| spec-plan STOP 指令 | 将强制读取的 reference 内容嵌入 Required Evidence section，而非靠 STOP 触发 | 低 |
| spec-debug Causal Chain Gate | 增加 debug-closeout hook 要求 claims_validated_by 非空 | 中 |
| spec-compound preconditions | 增加 CLI check：`spec-first compound validate --problem-solved` | 中 |
| spec-work feedback loop | 增加 `feedback_loop_not_possible` 字段到 closeout，强制填写 | 低 |
| Codex PRD guard | 在 spec-prd 结束时调用 `spec-first plan validate` 作为等效检查 | 中 |

---

## R12. Knowledge Harness 深度审查：知识退化/污染路径

### R12.1 知识生命周期分析

```text
经验产生（spec-work/spec-debug 解决了问题）
    ↓
知识捕获（spec-compound）
    ↓
知识验证（validate-frontmatter.py + Structured Promotion Gate）
    ↓
知识存储（docs/solutions/[category]/[filename].md）
    ↓
知识消费（spec-plan/spec-work/spec-debug 的 docs/solutions/ recall）
    ↓
知识更新（spec-compound-refresh）
    ↓
知识退役（invalidation_condition 满足时）
```

### R12.2 知识污染路径

**污染路径1：source_refs 路径可达但内容已变**

`docs/solutions/` 的 `source_refs` 指向 `src/foo.js:42`，但：
- 文件已被重构，行号漂移
- 函数已被删除
- 模块已被重命名

结果：recall 时显示"有证据"，但证据指向的内容已不存在。当前无自动检测这种漂移的机制。

**污染路径2：高相似度问题被重复记录为不同解决方案**

spec-compound 有 overlap detection（Related Docs Finder），但：
- 高重叠时"update 现有 doc"，但 update 过程可能引入矛盾
- 多个 moderate-overlap 文档可能对同一问题给出不同建议
- 无跨文档一致性检查

**污染路径3：过时知识通过 recall 影响新决策**

`spec-plan` recall 机制说"treat as advisory"，但：
- 召回的知识标注为 `advisory`，但建议的内容可能包含已淘汰的做法
- LLM 可能基于"advisory"知识做出与当前架构不符的决策
- `invalidation_condition` 是自描述的，无自动触发机制

**污染路径4：unverified hypothesis 通过 lightweight mode 进入 docs/solutions/**

spec-compound lightweight mode：
- 跳过 Related Docs Finder（无 overlap check）
- 跳过 specialized agent review
- 不检查 session history
- 但仍写入 docs/solutions/

如果 lightweight mode 在 spec-debug 结束后自动触发（有 auto-invoke 机制），可能将未完全验证的 debug 经验直接写入知识库。

### R12.3 知识质量保证机制现状

| 质量保证机制 | 现状 | 覆盖率 |
|---|---|---|
| source_refs 格式验证 | ✅ validate-frontmatter.py | 格式层（不验证内容）|
| invalidation_condition 必填 | ✅ 新 promote 的 doc 必须有 | 覆盖新文档 |
| overlap detection | ✅ Related Docs Finder（Full mode）| 不覆盖 Lightweight mode |
| source_refs 路径可达性检查 | ❌ 无 | 知识漂移无检测 |
| 跨文档一致性检查 | ❌ 无 | moderate-overlap 矛盾无检测 |
| invalidation_condition 自动触发 | ❌ 无自动触发 | 依赖人工定期运行 compound-refresh |

### R12.4 Knowledge Harness 加固建议

| 建议 | 优先级 | 实现 |
|---|---|---|
| 增加 `source_refs` 路径可达性检查脚本 | P1 | `spec-first compound verify-refs <path>` |
| spec-compound Lightweight mode 增加 source_confirmed 前置检查 | P1 | 在写入前要求 source_refs 非空且路径存在 |
| 建立知识库健康度定期扫描 | P2 | `spec-first compound health-check` |
| 增加 spec-compound-refresh 触发条件监控 | P2 | 文件变更时检查相关 solution 的 invalidation_condition |

---

## R13. Governance 治理专家视角：版本/Owner/冲突漏洞

### R13.1 当前治理现状

| 治理维度 | 现状 | 问题 |
|---|---|---|
| Skill 版本 | ❌ 所有 skill SKILL.md 无 `version:` frontmatter | 无法追踪变更历史，无法做 breaking change 告警 |
| Skill Owner | ❌ 无明确 owner 声明 | 规则变更无责任人，reviewer 无法定向通知 |
| 变更记录 | ✅ CHANGELOG.md（项目级）| 但 skill-level 变更无独立记录 |
| 共享规则抽取 | ❌ 共享规则分散在各 skill | Anti-Rationalization 等重复维护 |
| 规则冲突检测 | ❌ 无机制 | 两个 skill 对同一场景有矛盾规则无法发现 |
| 废弃机制 | ❌ 无 deprecation 标记 | spec-brainstorm → spec-prd 边界可能存在旧规则残留 |
| Review cadence | ⚠️ evaluation-governance.md 中提到 review cadence，但无统一执行机制 | 治理文档与实际审查脱节 |

### R13.2 规则冲突识别

当前体系中发现以下潜在规则冲突：

**冲突1：using-spec-first 的 "直接做" vs. 各 skill 的 "全力执行"**

`using-spec-first` 声明："轻量事实问答、当前上下文解释、窄定位查询可直接回答"
`spec-work` 声明："执行 settled plan"

边界不清晰：一个"执行一个小改动"是 lightweight direct 还是 spec-work 场景？

**冲突2：spec-brainstorm 和 spec-prd 的边界重叠**

- spec-brainstorm When to Use: "behavior/scope/users/success 未确定时"
- spec-prd When to Use: "brownfield increment PRD authoring"

一个对已有功能提出小改动需求的请求，两个 skill 都可能适用。using-spec-first 有 tie-break 规则，但仅依赖 LLM 语义判断。

**冲突3：spec-plan vs spec-doc-review 对于计划质量的判断**

- spec-plan 内置 confidence-first check + doc-review
- spec-doc-review 可独立对 plan 进行 review

当同一 plan 被两种 review 流程处理时，findings 可能矛盾（一个说"scope ok"，另一个说"scope concern"）。

### R13.3 治理结构建议

```markdown
# 建议的 Skill 治理元数据（SKILL.md frontmatter 扩展）

---
name: spec-work
version: "1.3.0"
owner: "@leokuang"
status: stable  # stable | experimental | deprecated
last_reviewed: "2026-07-02"
review_cadence: quarterly
breaking_changes:
  - version: "1.2.0"
    description: "Added task-pack semantic_posture gate"
    migration: "Existing task packs need semantic_posture field"
shared_rules:
  - "shared/rules/anti-rationalization.md"
  - "shared/rules/source-runtime-boundary.md"
---
```

### R13.4 冲突解决机制建议

| 冲突类型 | 解决方案 |
|---|---|
| 边界模糊（brainstorm vs prd）| 在 using-spec-first 增加 decision tree 可视化 + 唯一判断标准 |
| 重复规则（Anti-Rationalization 等）| 集中到 shared/rules/，各 skill 引用 |
| Finding 矛盾（plan + doc-review）| 定义 "last review wins" 策略，后续 review 必须说明与前次 review 的关系 |
| Breaking change | SKILL.md version + migration guide 机制 |

---

## R14. Progressive Disclosure 视角：SKILL.md 信息层级分析

### R14.1 PD 三层模型应用

参照之前研究（业界调研 50 轮报告），Progressive Disclosure 分三层：

- **L1**：Always inline（主干 contract / gate / boundary）— 必须在 SKILL.md 中
- **L2**：Triggered（满足特定条件时加载）— 用 STOP 或 Load When Needed 触发
- **L3**：Reference only（背景/解释/例子）— 应完全移出 SKILL.md

### R14.2 各 Skill 的 PD 违规识别

**spec-code-review（最严重）：**

| 内容 | 当前层级 | 应该层级 | 行数 |
|---|---|---|---|
| Stage 1 全部 bash 脚本 | L1（内联）| L3（scripts/）| ~200行 |
| Stage 3 reviewer preflight 完整表格 | L1 | L2（triggered）| ~80行 |
| Stage 4 spawning 细节（模型分级、run id 生成）| L1 | L2 | ~100行 |
| Stage 6 headless output format 样例 | L1 | L3（references/）| ~60行 |
| 18个 reviewer 完整 persona 描述 | L1 | L2（references/persona-catalog.md）| ~50行 |

**spec-work（高）：**

| 内容 | 当前层级 | 应该层级 | 行数 |
|---|---|---|---|
| Phase 1 task-pack validation 20+步骤 | L1 | L2（triggered by task-pack input）| ~150行 |
| Phase 2 subagent dispatch 策略矩阵 | L1 | L2（triggered by 3+ tasks）| ~80行 |
| Phase 2 parallel safety check | L1 | L2（triggered by parallel intent）| ~50行 |
| Anti-Rationalization Red Flags 表 | L1 | L2（共享 reference）| ~20行 |
| Common Pitfalls to Avoid（末尾）| L1 | L3 | ~30行 |

**spec-debug（中）：**

| 内容 | 当前层级 | 应该层级 | 行数 |
|---|---|---|---|
| Feedback Loop 9种复现方式详单 | L1 | L2（triggered by can't-reproduce）| ~40行 |
| Phase 1.2 环境健康检查清单 | L1 | L2 | ~20行 |
| Phase 3 test seam 分类处理规则 | L1 | L2（triggered by fix intent）| ~40行 |

### R14.3 PD 合规的正面案例

**spec-prd（最优）：**
- Reference Trigger Map 表格：精确标注每个 reference 的触发条件
- 主 SKILL.md 包含 Decision Card 骨架，细节由 references 承载
- 示范了正确的 L1/L2/L3 分层

**spec-mcp-setup（良好）：**
- 主文件 192 行，绝大多数是 L1 contract
- Workflow Modes 和 Output Shape 是 L1（必须知道的 contract）
- provider 详细操作逻辑（Graphify 七步流程）是 L1 中最需要外置的内容

### R14.4 PD 改造优先顺序

基于"行数 × 调用频次 × 重要性"：

```
Priority 1: spec-code-review bash 脚本外置（~200行，极高调用频次）
Priority 2: spec-work task-pack validation 外置（~150行，高调用频次）
Priority 3: spec-work subagent dispatch 外置（~80行，高调用频次）
Priority 4: spec-debug feedback loop 类型外置（~40行，中调用频次）
Priority 5: spec-mcp-setup Graphify 七步流程外置（~100行，低调用频次）
```

---

## R15. 压缩可行性评估：压缩风险矩阵

### R15.1 压缩风险分类

压缩一个 SKILL.md 时存在以下风险：

| 风险类型 | 定义 | 缓解方式 |
|---|---|---|
| 丢失 behavioral anchor | 压缩掉某个约束，LLM 不再遵守 | Eval cases 覆盖该 anchor |
| L2 过早触发失效 | 原本内联的规则外置后，LLM 在该规则适用时未读 reference | STOP 标记 + trigger condition 精确 |
| 压缩引入歧义 | 精简后的表述产生多种解读 | 保留原始约束原文（不重写）|
| 路径断裂 | 外置的 reference 路径在 runtime 不可达 | `spec-first init` 同步机制验证 |
| 测试缺失 | 压缩后无 regression test | 先建 eval cases，后压缩 |

### R15.2 各 Skill 压缩可行性评分

| Skill | 压缩收益 | 压缩风险 | eval 覆盖 | 综合评分 | 建议 |
|---|---|---|---|---|---|
| spec-code-review | 🟢 极高（1042行可压）| 🟡 中（bash 外置低风险，reviewer 选择逻辑需注意）| 🟡 examples.json 117行，无 negative | ⚠️ 补 negative cases 后压缩 | **先补 negative cases，后压缩** |
| spec-work | 🟢 高（420行可压）| 🟡 中（task-pack validation 细节外置后需 STOP 触发）| 🟡 examples.json 74行，覆盖极浅 | ⚠️ 补 negative + scope cases | **先补关键场景，后压缩** |
| spec-compound | 🟢 高（466行可压）| 🟡 中（Phase 1 subagent details 外置低风险）| 🟡 examples.json 83行，无 negative | ⚠️ 补 unverified-promotion negative | **补 negative cases，再压缩** |
| spec-plan | 🟡 中（300行可压）| 🟡 中（deepening 逻辑外置需 STOP 触发）| 🟡 examples + output-quality-cases（615行，相对充分）| 🟡 可压缩 | **可按 PD 改造** |
| spec-debug | 🟡 中（242行可压）| 🟡 中（causal chain gate 必须保留在 L1）| 🟡 examples.json 50行，极浅 | ⚠️ 补 no-repro negative | **先补关键 negative，后压缩** |
| spec-prd | 🟡 中（114行可压）| 🔴 高（anti-pattern 细节是关键约束）| 🟢 examples.json 2693行/111 cases（最完整）| 🟡 可谨慎压缩 | **eval 最充分，但内容高风险，外置前需仔细标注 STOP** |
| spec-brainstorm | 🟢 低压缩需求（80行）| 🟢 低（主要是补充 harness）| 🟡 routing-cases 133行，无 output-quality | 🟢 可直接扩展 | **不压缩，补充 harness** |
| spec-mcp-setup | 🟡 中（100行可压）| 🟡 中（Graphify 七步外置需精确触发）| 🟡 examples.json 37行 | 🟡 可压缩 | **可按 PD 改造** |
| using-spec-first | 🟡 小（~50行可压）| 🟢 低（主要删示例 prose）| ✅ routing-cases 364行，较充分 | 🟢 可压缩 | **低风险，可执行** |

### R15.3 压缩执行最小准则

```markdown
## 压缩操作 MUST

1. 建 eval cases BEFORE 压缩（非 bypass 选项）
2. 只移动内容，不重写内容（保持原始约束原文）
3. 每个外置的 reference 必须有精确的 STOP/Load When Needed 触发条件
4. 外置的 script 必须通过 `spec-first init` 同步到 runtime
5. 压缩后必须通过所有已有 eval cases（regression check）

## 压缩操作 NEVER

1. 删除 behavioral anchor（如 Anti-Rationalization gate 的描述）
2. 删除 hard gate 触发条件
3. 外置 "boundary enforcement" 类内容（LLM 每次都需要这些）
4. 压缩前无 eval coverage 就声明"safe to compress"
```

---

## R16. Handoff 质量视角：产物交接完整性审查

### R16.1 核心链路 Handoff 完整性矩阵

| Handoff 链路 | 必传字段 | 当前传递状态 | 缺失风险 |
|---|---|---|---|
| brainstorm → prd | requirements doc path, scope decision, open questions | ✅ handoff.md 定义 | 无 evidence class 传递 |
| brainstorm → plan | requirements doc path, WHAT summary | ✅ 同上 | WHAT 质量无评分 |
| prd → plan | readiness_outcome, finalize receipt, source_refs, R-IDs | ✅ PRD readiness lens 有 | Codex 无 finalize 强制 |
| plan → write-tasks | plan path, spec_id, scope_boundary, non-goals | ✅ 有 source_plan 引用 | spec_id 继承规则 |
| plan → work | plan path + scope + deferred questions | ✅ 有 | 无 context budget hint |
| write-tasks → work | task pack + final decision envelope + dispatch_authorization | ✅ 最完整 | semantic_posture 需 evidence |
| work → code-review | changed files + verification commands + review tier | ✅ shipping-workflow.md | 无 structured work summary |
| work → compound | changed files + root cause summary | ⚠️ 仅 optional 触发 | 无结构化 handoff |
| code-review → compound | findings + accepted residuals | ⚠️ 仅 optional 触发 | 无 handoff 协议 |
| debug → compound | debug summary + causal chain | ⚠️ optional，3层判断 | 缺少触发条件强制化 |
| compound → plan/work | docs/solutions/ path + invalidation_condition | ✅ recall 机制 | recall 结果无 evidence class |

### R16.2 Handoff 质量问题

**问题1：brainstorm → prd 无 evidence class 传递**

brainstorm 产物没有 evidence tag（R04 已识别），导致 prd 阶段无法区分：
- 用户明确表达的需求（fact）
- brainstorm 过程中 LLM 推断的需求（inference）
- 尚未验证的假设（hypothesis）

**问题2：work → compound 是完全可选的**

spec-work 结束后是否触发 spec-compound 完全取决于：
- spec-debug 的 auto-invoke trigger phrases
- spec-debug 的3层判断（skip/offer/lean into）

这意味着大量有价值的工程经验从未被捕获。

**问题3：code-review → compound 无协议**

code-review findings 包含大量可复用的经验（边界 bug、测试缺失模式等），但从 code-review 到 compound 的 handoff 协议没有明确定义。

**问题4：Handoff artifact freshness 无全局机制**

spec-work 有 `artifact-summary.v1` 和 `resume-first handoff`，但：
- spec-prd 和 spec-brainstorm 无 artifact freshness 声明
- 当 prd → plan 时，prd 可能已经过时（上次生成后有代码改动）
- 无 prd freshness indicator

### R16.3 Handoff 统一化建议

```yaml
# shared/handoff/handoff-envelope-v1.yaml
# 每个 skill handoff 必须携带的最小字段

handoff_envelope_v1:
  source_skill: <producing skill>
  target_skill: <consuming skill>
  artifact_path: <repo-relative path>
  artifact_kind: <prd-requirements | plan | task-pack | code-diff | debug-summary | solution>
  freshness:
    generated_at: <ISO timestamp>
    source_refs: [<repo-relative paths that were read>]
    last_source_change: <git hash or "unknown">
  evidence_class: <fact | inference | mixed>
  limitations:
    - <what was not verified>
    - <what changed since generation>
  next_action: <recommended next skill or direct action>
  degraded: <null | reason if degraded>
```

---

## R17. 反模式识别：当前体系中的工程反模式

### R17.1 反模式清单

**反模式1：Document-Driven Completion（文档驱动的假完成）**

- 表现：skill 输出了格式正确的文档，就声明该 phase 完成
- 发生位置：spec-prd（checkpoint-prd 被当作 final）、spec-plan（confidence check 不够）
- 根本原因：verification 要求格式合规，但不验证语义质量
- 解决方向：checker 增加语义充分性检查（至少检查 OQ 是否都有合法 closure）

**反模式2：Prompt Instruction Burial（指令埋葬）**

- 表现：关键约束在1000行 SKILL.md 的中间某处
- 发生位置：spec-code-review（review boundary rules 约在行500）、spec-work（scope rules 约在行300）
- 根本原因：SKILL.md 随功能增加线性增长，无 PD 分层
- 解决方向：L3 内容外置，L1 content 首屏可见

**反模式3：Advisory Evidence Drift（advisory 变 confirmed 的语义漂移）**

- 表现：docs/solutions/ recall 的 advisory 知识在 plan/work 中被当作 confirmed 事实使用
- 发生位置：spec-plan recall、spec-work recall
- 根本原因：recall 返回时仅说"treat as advisory"，无 evidence class 标注在产物中
- 解决方向：recall 结果在 artifact 中必须标注 evidence class

**反模式4：Fake Completeness（假完整性）**

- 表现：spec-prd checkpoint-prd 被标记为"draft complete"，但 OQ 未解决
- 发生位置：spec-prd 的 checkpoint-as-escape anti-pattern（已在 SKILL.md 中识别）
- 根本原因：checkpoint-prd 和 final-prd 的 UI 区分不够明显
- 解决方向：checkpoint-prd 输出必须有显眼 NOT READY 标记

**反模式5：Scope Implicit Expansion（隐式 scope 扩展）**

- 表现：spec-work 执行时发现 plan 边界不清，LLM 自行决定 scope 范围
- 发生位置：spec-work Phase 2（"discovered outside plan scope 的文件被悄然修改"）
- 根本原因：anti-rationalization 是注意力提醒，不是 gate
- 解决方向：diff 范围必须在 closeout 中与 plan declared files 对比

**反模式6：Knowledge Accumulation Neglect（知识积累忽视）**

- 表现：spec-work/spec-debug 完成后无任何知识沉淀
- 发生位置：spec-work 和 spec-debug 的 optional knowledge path
- 根本原因：知识捕获是完全可选的，无结构化触发机制
- 解决方向：spec-work closeout 增加强制知识捕获决策（即使决定 skip 也必须记录原因）

**反模式7：Spec System as Overhead（spec 体系被视为额外负担）**

- 表现：用户跳过 brainstorm/prd/plan 直接用 spec-work bare prompt
- 发生位置：spec-work Phase 0 bare prompt 路径
- 根本原因：workflow 链路太长，单个任务的 overhead 看起来不值
- 解决方向：spec-work bare prompt 对小任务保持轻量，对大任务主动提示回到 plan workflow

### R17.2 反模式影响评级

| 反模式 | 频率 | 影响 | 优先级 |
|---|---|---|---|
| Prompt Instruction Burial | 每次调用 spec-code-review/work | P0：rules 可能被遗忘 | P0 |
| Advisory Evidence Drift | 有 recall 时 | P1：错误知识影响决策 | P1 |
| Document-Driven Completion | PRD/plan 完成时 | P1：虚假 ready 状态 | P1 |
| Fake Completeness | PRD checkpoint 时 | P1：规划基于 unresolved PRD | P1 |
| Scope Implicit Expansion | spec-work 执行时 | P1：未授权代码改动 | P1 |
| Knowledge Accumulation Neglect | spec-work/debug 完成时 | P2：知识库无法增长 | P2 |
| Spec System as Overhead | 日常工作中 | P2：工程价值被低估 | P2 |

---

## R18. 全局优先级矩阵重新排序

### R18.1 综合所有轮次的完整问题清单

经过 R01-R17 的全面审查，识别到的所有问题按"影响 × 频率 × 修复成本"综合排序：

#### 🔴 P0（立即处理，阻塞高质量交付）

| ID | 问题 | 影响范围 | 来源轮次 |
|---|---|---|---|
| P0-01 | spec-code-review SKILL.md 1242行，bash脚本内联 | 每次 code review | R03/R14 |
| P0-02 | spec-work SKILL.md 580行，task-pack validation内联 | 每次 spec-work | R03/R14 |
| P0-03 | spec-prd / spec-work / spec-code-review 有 examples-as-context 但**缺 negative cases 和 CI runner**，压缩后无自动化回归保护 | 压缩后无回归保护 | R06/R15 |
| P0-04 | spec-brainstorm 无 Evidence Harness，无 evidence tag | 下游需求质量无根基 | R04/R05 |
| P0-05 | spec-mcp-setup Graphify 七步流程内联 | setup 文档难维护 | R01/R14 |

#### 🟠 P1（下一迭代优先修）

| ID | 问题 | 影响范围 | 来源轮次 |
|---|---|---|---|
| P1-01 | Anti-Rationalization Red Flags 三处重复维护 | 规则漂移风险 | R02/R13/R17 |
| P1-02 | Evidence 词汇不统一（5种体系） | 跨 skill handoff 互操作 | R04 |
| P1-03 | spec-plan 无 validation 脚本 | 计划质量无机器验证 | R05/R11 |
| P1-04 | spec-compound preconditions 仅 advisory | 未验证知识进知识库 | R12 |
| P1-05 | spec-compound source_refs 路径可达性无检查 | 知识漂移无检测 | R12 |
| P1-06 | Codex 无 PRD prewrite guard | Codex 可绕过检查 | R10/R11 |
| P1-07 | Causal Chain Gate（spec-debug）是伪 gate | debug root cause 无强制 | R05/R11 |
| P1-08 | work → compound handoff 完全可选 | 大量经验未被捕获 | R16/R17 |
| P1-09 | brainstorm → prd 无 evidence class 传递 | 需求质量信息丢失 | R04/R16 |
| P1-10 | spec-plan/spec-debug/spec-work 的 Codex 降级声明不完整 | 双宿主不一致 | R10 |
| P1-11 | spec-mcp-setup provider content 写入 AGENTS.md 无验证 | 潜在注入风险 | R08 |
| P1-12 | docs/solutions/ source_refs 路径漂移无自动检测 | 知识库可靠性 | R12 |

#### 🟡 P2（建议本季度修）

| ID | 问题 | 来源轮次 |
|---|---|---|
| P2-01 | 无统一 Context Loading Policy 格式 | R03 |
| P2-02 | artifact-summary.v1 协议未覆盖 brainstorm/prd | R16 |
| P2-03 | docs/solutions/ recall 触发策略各自不同 | R03 |
| P2-04 | 所有 skill 无版本号和 owner | R13 |
| P2-05 | 无 skill-map.md 全局视图 | R02 |
| P2-06 | 无 CI 自动化 runtime drift 检测 | R02 |
| P2-07 | spec-work parallel subagents worktree isolation 非推荐默认 | R09 |
| P2-08 | using-spec-first Route Map Claude/Codex 两列无自动一致性验证 | R10 |
| P2-09 | spec-mcp-setup entrypoint 重命名未完成（mcp-setup→runtime-setup）| R01/R10 |
| P2-10 | Handoff 无 artifact freshness indicator（brainstorm/prd 端）| R16 |
| P2-11 | spec-debug 快速路径判断条件散落 | R09 |
| P2-12 | spec-code-review review boundary rules 在行500，Lost in Middle 风险 | R03 |

#### 🟢 P3（低风险，可后续优化）

| ID | 问题 | 来源轮次 |
|---|---|---|
| P3-01 | spec-mcp-setup query_verified 语义不清晰 | R01 |
| P3-02 | graphify-out/wiki/ 提交策略不明确 | R02 |
| P3-03 | 知识库健康度无定期扫描 | R12 |
| P3-04 | using-spec-first 决策树无可视化 | R07 |
| P3-05 | spec-prd soft-cap offer 提示不够 | R07 |
| P3-06 | 跨 skill 嵌套调用 context budget 无管理 | R03 |

---

## R19. 最小可落地方案：每个 P0/P1 的最小修复路径

### R19.1 P0 修复方案

#### P0-01：spec-code-review SKILL.md 压缩

**最小修复步骤：**
1. 新建 `skills/spec-code-review/scripts/stage1-scope-detection.sh`（当前内联的 bash 脚本移入）
2. 新建 `skills/spec-code-review/references/mode-and-routing.md`（Mode Detection + Action Routing + Severity Scale）
3. 新建 `skills/spec-code-review/references/reviewer-spawning.md`（Stage 4 spawning 细节）
4. SKILL.md 主文件保留：Workflow Contract Summary + Stage 1-6 概述（无脚本）+ 必要 boundary 声明
5. 建 `evals/golden-cases.json`（3个 case）BEFORE 执行压缩
6. 压缩后：运行 eval cases 验证

**预期结果：** 1242行 → ~220行（-82%），功能等价

#### P0-02：spec-work SKILL.md 压缩

**最小修复步骤：**
1. 新建 `skills/spec-work/references/task-pack-validation.md`（Phase 1 的 20+步骤验证流程）
2. 新建 `skills/spec-work/references/parallel-dispatch.md`（Phase 2 的 subagent dispatch 细节）
3. 新建 `skills/spec-work/references/execution-loop.md`（Phase 2 Task Execution Loop 细节）
4. SKILL.md 保留：Workflow Contract Summary + Phase 0-4 概述 + Key Principles + Anti-Rationalization
5. 建 `evals/golden-cases.json` BEFORE 压缩
6. STOP 指令在适当位置触发 references 加载

**预期结果：** 580行 → ~170行（-71%）

#### P0-03：为三个 P0 Skill 建立 eval cases

**最小 eval case 集（每个 skill 5个）：**

```bash
# spec-work golden cases
# 1. bare prompt → trivial change → direct execute
# 2. plan input → multi-unit → serial execution
# 3. task-pack input → hash validation → execution
# 4. scope expansion detection → stop + handoff
# 5. degraded: dispatch unavailable → inline execution

# spec-prd golden cases
# 1. brownfield increment → grill → final-prd
# 2. unresolved OQ → checkpoint-prd (NOT final)
# 3. direct-write-after-read → recovery path
# 4. checkpoint-as-escape → continue grilling
# 5. Codex degraded → explicit declaration

# spec-code-review golden cases
# 1. PR review → multi-persona dispatch → merged findings
# 2. evidence-less finding → demoted to advisory
# 3. scope violation → concern raised
# 4. dispatch unavailable → single-agent fallback
# 5. mode:headless → structured output
```

#### P0-04：spec-brainstorm 增加 Evidence Harness

**最小修复步骤：**
1. 在 `spec-brainstorm/SKILL.md` 增加 `## Evidence Harness` section
2. 要求 Phase 3（capture）时，requirements doc 中：
   - 用户明确表达的需求标注 `[user-confirmed]`
   - LLM 推断的需求标注 `[inferred]`
   - 待验证假设标注 `[assumption: <what needs validation>]`
3. 新建 `spec-brainstorm/templates/requirements-doc-with-evidence.md` 模板

**估计工作量：** 2-3小时

#### P0-05：spec-mcp-setup Graphify 七步流程外置

**最小修复步骤：**
1. 新建 `skills/spec-mcp-setup/references/graphify-setup-flow.md`
2. 将 Graphify 七步（extract→update→force→hook→PATH→probe→steady-state）移入
3. SKILL.md 中 Bare Setup Flow 压缩为 3 行引用 + STOP when needed

---

### R19.2 P1 修复方案（精选最高价值项）

#### P1-01：Anti-Rationalization Red Flags 集中化

```bash
# 操作：
1. 新建 skills/shared/rules/anti-rationalization.md（从 spec-work 复制）
2. spec-work：删除 Anti-Rationalization 表，改为 Load: skills/shared/rules/anti-rationalization.md
3. spec-code-review：同步替换
4. spec-debug：同步替换
# 工作量：1小时
```

#### P1-03：spec-plan 增加 plan readiness checker

```bash
# 操作：
# 新增 CLI 命令（spec-first plan validate <path> --json）
# 检查内容：
# - plan 有 spec_id
# - 每个 implementation unit 有 Test scenarios
# - scope_boundary section 存在
# - 无空 non-goals section
# 工作量：1天（CLI 开发）
```

#### P1-08：spec-work closeout 强制知识捕获决策

```bash
# 操作：
# spec-work/references/shipping-workflow.md 中增加：
# "Phase 4 closeout：用户是否触发 spec-compound？（yes/no/skip-with-reason）"
# 要求 closeout 中记录 knowledge_capture_decision 字段
# 工作量：2-3小时（references 修改）
```

---

## R20. 综合收口：最终治理建议与演进路线图

### R20.1 审查总结（20轮综合）

经过 R01-R20 全面审查，spec-first skill 体系的整体评价如下：

**核心优势（必须保持）：**
1. Script-LLM 边界清晰（spec-mcp-setup 是标杆）
2. Source/Runtime 二分法坚守良好
3. Execution Harness 成熟（Phase 化 + gate 机制）
4. spec-prd 是体系中 Context Harness 和 Evidence Harness 的设计标杆
5. spec-code-review 的多 persona + confidence-gated 机制领先行业

**核心缺陷（必须修复）：**
1. 主 SKILL.md 文件过载（Prompt Instruction Burial 反模式）
2. Evaluation Harness 缺失（10个核心 skill 中8个无可执行 eval cases）
3. Evidence 词汇不统一（5种体系，上下游互操作差）
4. Knowledge Harness 薄弱（知识生命周期管理不完整）
5. Governance 缺失（无 version/owner/conflict 机制）

### R20.2 三阶段演进路线图（修订版）

```
Phase 1：防退化基础（第1-2周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
必须完成（不得绕过）：
  ① 为 spec-work / spec-prd / spec-code-review 补充 negative cases（checkpoint-as-escape/scope-expansion/evidence-less finding 等关键反例）+ CI runner hook（目录已存在，补充内容而非新建）
  ② spec-brainstorm 增加 Evidence Harness（evidence tag 体系）
  ③ Anti-Rationalization Red Flags 集中到 shared/rules/
  ④ spec-mcp-setup 补充 Knowledge Harness Placeholder

Phase 2：Harness 标准化（第3-6周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⑤ 建立 shared/context/ 统一 Context Loading Policy（Reference Trigger Map 标准化）
  ⑥ 建立 shared/evidence/ Evidence Contract（5级→1套通用词汇映射）
  ⑦ 建立 shared/handoff/ artifact-summary.v1 协议（覆盖 brainstorm/prd 端）
  ⑧ 所有 core skill 增加 Knowledge Harness Placeholder + spec-compound 触发条件
  ⑨ 新增 spec-first plan validate CLI 命令
  ⑩ spec-compound：source_refs 路径可达性检查脚本

Phase 3：主文件压缩（第7-12周，必须在 Phase 1 完成后）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⑪ spec-code-review：bash 脚本外置（1242→~220行）
  ⑫ spec-work：task-pack validation + dispatch 细节外置（580→~170行）
  ⑬ spec-compound：Phase 1 subagent details 外置（646→~180行）
  ⑭ spec-plan：deepening workflow 外置（461→~160行）
  ⑮ spec-debug：feedback loop types 外置（403→~160行）
  压缩后每个 skill 必须通过对应的 eval cases

Phase 4：验证与治理完善（第13-20周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⑯ skill version/changelog 机制
  ⑰ Skill owner 定义
  ⑱ CI drift 检测自动化
  ⑲ 完成 mcp-setup → runtime-setup alias contract
  ⑳ spec-first session 并发协调改进

Phase 5：长期能力（未来）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ○ 团队知识 Git 仓库接入（按 PRD 2026-07-01-003 规划）
  ○ Knowledge Resolver 激活
  ○ 跨宿主 eval 自动化运行
  ○ Skill 市场 / 外部分发（当前不进入执行范围）
```

### R20.3 最终量化收益预期

| 指标 | 当前值 | Phase 3完成后 | 收益 |
|---|---|---|---|
| 最大 SKILL.md 行数 | 1242行（code-review）| ~220行 | -82% |
| 平均核心 SKILL.md 行数 | ~410行 | ~160行 | -61% |
| 有 eval cases 的 skill 数量 | 2/13 | 13/13 | +550% |
| Evidence 词汇体系数量 | 5套 | 1套（共享映射）| -80% |
| 重复维护规则数量 | ~8处 | ~1处（shared/rules/）| -87% |
| 伪 gate 数量 | 7个 | 4个（3个可真实化）| -43% |
| Knowledge Harness 覆盖率 | 1/13 | 13/13（placeholder）| +1200% |

### R20.4 一句话审查结论

spec-first skill 体系在执行工程上已属业界前列（Execution Harness 9/10），但面临"**工程文档超载**"（主 SKILL 文件过长）和"**质量保证空白**"（eval 极度缺失）两大系统性问题。修复路径清晰，优先级明确：**先建 eval 防退化网，再安全压缩文件，最后完善治理体系**。当前最紧迫的单点行动是：为 spec-code-review、spec-work、spec-prd 建立最小 eval case 集。

---

> **审查声明：** 本报告全部结论来自直接读取 `skills/` 目录源码和 `docs/10-prompt/审查整个 skill 是否具备 Harness 能力.md` 审查框架执行结果，为 LLM 语义判断层 advisory 产物。建议使用 `node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo .` 获取补充确定性校验事实，并以本报告为 LLM semantic layer 的 advisory 输入。
