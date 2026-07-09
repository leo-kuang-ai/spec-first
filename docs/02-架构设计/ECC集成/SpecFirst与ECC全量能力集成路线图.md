# spec-first × ECC 全量能力集成路线图

## 0. 文档定位

校准结论：**CONDITIONAL PASS，仅作为 V1 重叠治理之后的长期路线图参考**。

当前开发基准不是本文档，而是 `ECCAgent重叠治理V1技术方案.md`。

本文档只回答一个后置问题：当 `ECCAgent重叠治理V1技术方案.md` 完成 agent inventory、ECC overlap matrix、agent packs、registry、router、finding schema、synthesis 和 node quality gates 后，如何继续把 ECC 作为长期能力来源进行全量评估、分层治理和按需启用。

本文档不替代 V1，也不替代 `docs/10-prompt/结构化项目角色契约.md`。优先级如下：

```text
1. docs/10-prompt/结构化项目角色契约.md
2. docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md
3. 本文档：SpecFirst与ECC全量能力集成路线图.md
4. docs/02-架构设计/ECC集成/ECC专家能力整合技术方案.md
5. docs/02-架构设计/ECC集成/SpecFirst集成ECC技术方案.md
```

所有“全量”表述均指：

```text
全量盘点
全量评估
分层治理
按需启用
质量门禁
```

不表示：

```text
一次性安装 ECC 全部 assets
批量导入 ecc-* skills
新增 ecc-* agents
新增 /ecc:* 或 $ecc-* 入口
接入 ECC hooks
```

代码一致性审查结论：**CONDITIONAL PASS**。本文描述的是 V1 之后的长期路线，不表示当前 `spec-first` 已经支持 capability pack、递归 skill source index、pack-aware state、pack-aware doctor/clean、agent filtering、agent registry、finding schema 或 synthesis runtime。

准确性校验日期：2026-05-05。已对照 `/Users/kuang/xiaobu/spec-first` 与当前 ECC 仓库确认：ECC 仍为 182 个 `skills/*/SKILL.md`、48 个 `agents/*.md`、68 个 `commands/*.md`；`spec-first` 当前为 42 个 source skills、51 个 bundled agents、21 个 Claude command templates，且仍未实现本文描述的 capability pack、递归 skill source index、pack-aware lifecycle 与 agent filtering。因此本文定位应保持为 MVP 之后路线图，而非当前可执行实现说明。

本次校准新增约束：ECC 集成质量必须通过 `ECCAgent重叠治理V1技术方案.md` 的 node quality matrix、quality gates 和 pilot 场景验证。没有可观察节点质量增益的能力，不进入核心路径。

---

## 1. 代码事实依据

### 1.1 spec-first 事实依据

从 `/Users/kuang/xiaobu/spec-first` 源码可确认：

| 事实 | 代码/文件依据 | 含义 |
|---|---|---|
| spec-first 是 CLI runtime 生成器 | `src/cli/commands/init.js` | `init --claude|--codex` 负责生成宿主 runtime assets |
| asset 生成由 plugin 层治理 | `src/cli/plugin.js` | commands / skills / agents 都通过 manifest/filter/sync 进入 runtime |
| skill delivery 有治理 contract | `src/cli/contracts/dual-host-governance/skills-governance.json` | workflow_command / standalone_skill / internal_only 的宿主交付由 contract 管 |
| Claude command 是模板 + workflow skill 合成 | `templates/claude/commands/spec/*.md` + `skills/spec-*/SKILL.md` | command 是入口，skill 是 workflow 主体 |
| Claude runtime 路径固定 | `src/cli/adapters/claude.js` | `.claude/commands/spec`、`.claude/skills`、`.claude/spec-first/workflows`、`.claude/agents` |
| Codex runtime 路径固定 | `src/cli/adapters/codex.js` | `.agents/skills`、`.codex/agents` |
| 当前 agents 全量同步 | `src/cli/plugin.js` 的 `listBundledAgents()` / `syncAgents()` | 接 ECC agents 前必须先做 agent filtering/governance |
| 当前 skill 扫描默认一级目录 | `src/cli/plugin.js` 的 `listSkillDirectoryNames()` | 接 `skills/ecc/*` 前必须改成递归扫描 `skills/**/SKILL.md` |
| 当前 internal skill 下发有 JS 常量限制 | `AGENT_FACING_INTERNAL_SKILLS` | 不能长期靠 JS 常量作为能力名单 |
| 当前 init 不支持 `--with-ecc` | `src/cli/commands/init.js` | capability pack 启用入口仍需新增 |
| 当前 governance schema 不接受 capability 字段 | `skills-governance.schema.json` | `capability_pack` / `capability_role` 需要 schema 与 loader 同步扩展 |
| 当前 state 不保留 `capabilityPacks` | `src/cli/state.js` | pack-aware doctor/clean 前必须先持久化 pack 状态 |
| 当前 agent 重名检查不足 | `src/cli/commands/init.js` | 后续接 ECC agents 前必须检查 frontmatter `name` 唯一性 |
| 项目哲学是轻 contract、明确边界、LLM 决策 | `docs/10-prompt/结构化项目角色契约.md` | 脚本只做确定性准备，不能替 LLM 做语义路由 |
| 当前 ECC 开发基准是重叠治理 V1 | `docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md` | 先治理已有 51 个 spec-first agents，再吸收 ECC checklist / rubric / failure mode |

### 1.2 ECC 事实依据

从当前 `everything-claude-code` 源码可确认：

| 类型 | 数量 | 依据 | 说明 |
|---|---:|---|---|
| Skills | 182 | `skills/*/SKILL.md` | 大量工程、语言、测试、安全、前端、媒体、业务运营技能 |
| Agents | 48 | `agents/*.md` | review / build / planning / docs / e2e / performance 等子代理 |
| Commands | 68 | `commands/*.md` | 插件模式下是 `/everything-claude-code:*` 命令 |
| Commands 导出 | 68 | `.claude-plugin/plugin.json` 的 `commands: ["./commands/"]` | ECC commands 是用户入口，不适合混入 `spec-*` |
| Skills 导出 | 182 | `.claude-plugin/plugin.json` 的 `skills: ["./skills/"]` | ECC skills 可作为能力来源 |
| Agents 发现 | 48 | `.claude-plugin/PLUGIN_SCHEMA_NOTES.md` | agents 不在 manifest 中声明，按目录约定发现 |

---

## 2. 总体集成原则

全量集成不是“一次全装”，也不是“按 ECC 原目录导入”。它必须先经过 V1 的 overlap governance：

```text
ECC source evidence
  -> inventory
  -> overlap matrix
  -> agent packs
  -> registry
  -> router
  -> finding schema
  -> synthesis
  -> node quality pilots
  -> optional capability packs
```

原则：

| 原则 | 说明 |
|---|---|
| 不以导入为默认动作 | ECC assets 默认是能力样本，不是 runtime asset |
| 不导入 ECC commands | ECC commands 是第二套入口，只作为流程参考，不作为 runtime command 下发 |
| 不导入 ECC hooks | hooks 会改变全局行为；本文不把 hooks 纳入路线图默认路径 |
| skills 先做 rubric extraction | ECC skills 先提取 checklist / rubric / failure mode，增强现有 spec-first workflow / agent |
| agents 先做 overlap matrix | direct_match 增强现有 `spec-*` agent，missing 才可能进入 optional lens，不能平铺新增 |
| canonical id 优先于 `ecc-*` 文件名 | `ecc-*` 可作为 origin alias 或 provider namespace，不应替代 spec-first 产品化专家名 |
| domain packs 独立 | 医疗、媒体、运营、投资等领域能力只能显式启用，不能污染核心工程路径 |
| 脚本扫描，不做语义裁判 | 脚本只产生 inventory / schema / drift facts；LLM / Skill 做语义选择和 synthesis |
| Node quality first | 每个能力必须说明提升哪个 spec-first 节点质量，否则不进入核心路径 |

---

## 3. 目标最终架构

```text
spec-first
  docs/02-架构设计/ECC集成/
    ECC技能清单.md
    ECC斜杠命令清单.md
    ECC子代理清单.md
    ECCAgent重叠治理V1技术方案.md
    SpecFirst与ECC全量能力集成路线图.md

  docs/02-架构设计/ECC集成/generated/        # future, source evidence artifacts
    current-agent-inventory.json
    ecc-agent-overlap-matrix.json
    agent-packs.json
    agent-registry.json

  agents/
    spec-security-reviewer.agent.md
    spec-performance-reviewer.agent.md

  src/cli/contracts/
    agent-registry/                   # future, after V1 docs artifacts stabilize
      agent-registry.schema.json
      finding.schema.json
      routing-policy.schema.json

  src/cli/
    agent-router/                     # future, only after policy pilots
    capability-providers/             # future, provider layer after pack lifecycle proves stable
```

runtime 原则：

```text
默认 init:
  不生成 ECC runtime asset

启用 optional pack:
  必须 pack-gated
  必须 doctor-able
  必须 clean-able
  必须 source-attributed
  必须可降级为 checklist/reference

agent:
  先增强现有 spec-first agents
  不默认生成 ecc-* agent
  future optional agent 必须经过 registry / finding schema / synthesis gates
```

---

## 4. 全量能力分层策略

### 4.1 集成分层

| 层级 | 决策 | 说明 |
|---|---|---|
| P0 | V1 立即治理 | inventory、overlap matrix、packs、registry、finding schema、synthesis、node quality gates |
| P1 | rubric extraction | 从 ECC skills 提取 checklist / failure mode，增强现有 spec-first workflow / agents |
| P2 | optional lens pack | 通过 pilot 证明质量增益后，显式启用少量 reference/lens |
| P3 | 技术栈/治理包 | 按项目技术栈或优化场景显式启用 |
| P4 | 可选领域包 | 医疗、媒体、运营、投资等领域能力 |
| P5 | 条件 agent 包 | 完成 agent governance 后评估少量真正 missing 的 agents |
| 不集成 | 永不导入 runtime | commands、hooks、默认全量 agents、高重复/高风险 assets |
| 待评估 | 需要逐项读正文 | 没有明确增量或风险未知 |

### 4.2 能力包设计

| Pack | 内容类型 | 默认启用 | 说明 |
|---|---|---|---|
| `agent-overlap-governance` | inventory / overlap / registry | 是，作为 docs/source 产物 | 当前优先级最高 |
| `engineering-rubric-extraction` | API/security/testing/data/a11y checklist | 否 | 先增强现有 workflow，不生成 runtime |
| `optional-core-lens` | 少量 reference/lens | 否 | 必须通过 pilot quality gates |
| `optional-review-lens` | 安全/API/DB/测试/无障碍 review lens | 否 | 增强 `spec-code-review`，不接 agents |
| `optional-debug-ui-lens` | click path / browser / a11y lens | 否 | 增强 `spec-debug` / `spec-polish-beta` |
| `optional-techstack-python` | Python patterns/testing | 否 | 按项目技术栈启用 |
| `optional-techstack-go` | Go patterns/testing | 否 | 按项目技术栈启用 |
| `optional-techstack-rust` | Rust patterns/testing | 否 | 按项目技术栈启用 |
| `optional-domain-healthcare` | 医疗/合规 skills | 否 | 领域包 |
| `optional-domain-media` | 视频/媒体 skills | 否 | 领域包 |
| `optional-domain-ops` | 业务运营 skills | 否 | 领域包 |

---

## 5. Skills 全量集成决策表

> 校准说明：下表基于 `skills/*/SKILL.md` 的名称和描述做第一轮归类。表中的“P0 候选”“P1 候选”等旧标签只能解释为 **rubric / checklist 候选优先级**，不能解释为 runtime 导入决策。任何 ECC skill 进入 spec-first 前，必须先经过 `ECCAgent重叠治理V1技术方案.md` 的 source evidence gate、overlap gate、context gate、finding gate 和 node quality pilot。默认动作是“提取方法论增强现有 workflow / agent”，不是创建 `skills/ecc/*`。

| ECC Skill | 决策 | 集成形态 | 备注 |
|---|---|---|---|
| `accessibility` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `agent-eval` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `agent-harness-construction` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `agent-introspection-debugging` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `agent-payment-x402` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `agent-sort` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `agentic-engineering` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `ai-first-engineering` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `ai-regression-testing` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `android-clean-architecture` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `api-connector-builder` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `api-design` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `architecture-decision-records` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `article-writing` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `automation-audit-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `autonomous-agent-harness` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `autonomous-loops` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `backend-patterns` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `benchmark` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `blueprint` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `brand-voice` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `browser-qa` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `bun-runtime` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `canary-watch` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `carrier-relationship-management` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `ck` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `claude-devfleet` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `click-path-audit` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `clickhouse-io` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `code-tour` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `codebase-onboarding` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `coding-standards` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `compose-multiplatform-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `configure-ecc` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `connections-optimizer` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `content-engine` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `content-hash-cache-pattern` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `context-budget` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `continuous-agent-loop` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `continuous-learning` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `continuous-learning-v2` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `cost-aware-llm-pipeline` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `council` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `cpp-coding-standards` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `cpp-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `crosspost` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `csharp-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `customer-billing-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `customs-trade-compliance` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `dart-flutter-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `dashboard-builder` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `data-scraper-agent` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `database-migrations` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `deep-research` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `defi-amm-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `deployment-patterns` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `design-system` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `django-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `django-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `django-tdd` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `django-verification` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `dmux-workflows` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `docker-patterns` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `documentation-lookup` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `dotnet-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `e2e-testing` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `ecc-tools-cost-audit` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `email-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `energy-procurement` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `enterprise-agent-ops` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `eval-harness` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `evm-token-decimals` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `exa-search` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `fal-ai-media` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `finance-billing-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `flutter-dart-code-review` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `foundation-models-on-device` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `frontend-patterns` | P1 候选 | internal reference/lens | 有价值但与 spec-first 现有安全/前端/浏览器/设计能力有重叠，需提炼差异化内容 |
| `frontend-slides` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `gan-style-harness` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `gateguard` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `git-workflow` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `github-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `golang-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `golang-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `google-workspace-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `healthcare-cdss-patterns` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `healthcare-emr-patterns` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `healthcare-eval-harness` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `healthcare-phi-compliance` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `hermes-imports` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `hexagonal-architecture` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `hipaa-compliance` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `hookify-rules` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `inventory-demand-planning` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `investor-materials` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `investor-outreach` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `iterative-retrieval` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `java-coding-standards` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `jira-integration` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `jpa-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `knowledge-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `kotlin-coroutines-flows` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `kotlin-exposed-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `kotlin-ktor-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `kotlin-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `kotlin-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `laravel-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `laravel-plugin-discovery` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `laravel-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `laravel-tdd` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `laravel-verification` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `lead-intelligence` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `liquid-glass-design` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `llm-trading-agent-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `logistics-exception-management` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `manim-video` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `market-research` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `mcp-server-patterns` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `messages-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `nanoclaw-repl` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `nestjs-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `nextjs-turbopack` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `nodejs-keccak256` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `nutrient-document-processing` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `nuxt4-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `openclaw-persona-forge` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `opensource-pipeline` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `perl-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `perl-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `perl-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `plankton-code-quality` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `postgres-patterns` | P0 候选 | internal reference/lens | 核心 rubric 候选，需语义清洗后先增强现有 workflow / agent，不直接生成 runtime |
| `product-capability` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `product-lens` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `production-scheduling` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `project-flow-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `prompt-optimizer` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `python-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `python-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `pytorch-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `quality-nonconformance` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `ralphinho-rfc-pipeline` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `regex-vs-llm-structured-text` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `remotion-video-creation` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `repo-scan` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `research-ops` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `returns-reverse-logistics` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `rules-distill` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `rust-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `rust-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `safety-guard` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `santa-method` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `search-first` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `security-bounty-hunter` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `security-review` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `security-scan` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `seo` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `skill-comply` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `skill-stocktake` | P2 候选 | optimization/eval pack | 适合 spec-optimize 或 spec-first 自身演化，不进入 core engineering MVP |
| `social-graph-ranker` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `springboot-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `springboot-security` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `springboot-tdd` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `springboot-verification` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `strategic-compact` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `swift-actor-persistence` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `swift-concurrency-6-2` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `swift-protocol-di-testing` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `swiftui-patterns` | P2 可选技术栈包 | language/framework pack | 按项目技术栈显式启用，不进入默认 pack |
| `tdd-workflow` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `team-builder` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `terminal-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `token-budget-advisor` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `ui-demo` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `unified-notifications-ops` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `verification-loop` | P1 候选 | reference only | 可能有检查清单价值，但需先与 spec-first 同类能力去重 |
| `video-editing` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `videodb` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |
| `visa-doc-translate` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `workspace-surface-audit` | 待评估 | manual review | 需要逐项读正文判断是否有增量 |
| `x-api` | P3 可选领域包 | domain pack | 领域价值明确但不适合作为默认工程核心能力 |

---

## 6. Agents 全量集成决策表

> 校准说明：ECC agents 不能在当前阶段直接导入。下表只能作为 ECC 侧 overlap matrix 输入，不是 optional agent backlog。所有 agent 能力必须先与当前 51 个 spec-first source agents 对齐：`direct_match` 增强现有 `spec-*` agent，`partial_match` 做 canonical id 泛化，`spec_first_native` 不被 ECC 覆盖，`style_profile` 只能显式启用，`missing_in_spec_first` 才可能进入 optional lens/reference。任何真正的 agent runtime 接入都依赖 registry、router、finding schema、synthesis、fresh-source eval 和 read-only/no-verdict 约束。

| ECC Agent | 决策 | 集成形态 | 备注 |
|---|---|---|---|
| `a11y-architect` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `architect` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `build-error-resolver` | P2 条件候选 | overlap candidate | 有明确增量，但必须先完成 agent governance、read-only/schema/no-verdict 适配 |
| `chief-of-staff` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `code-architect` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `code-explorer` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `code-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `code-simplifier` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `comment-analyzer` | P2 条件候选 | overlap candidate | 有明确增量，但必须先完成 agent governance、read-only/schema/no-verdict 适配 |
| `conversation-analyzer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `cpp-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `cpp-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `csharp-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `dart-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `database-reviewer` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `doc-updater` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `docs-lookup` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `e2e-runner` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `flutter-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `gan-evaluator` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `gan-generator` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `gan-planner` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `go-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `go-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `harness-optimizer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `healthcare-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `java-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `java-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `kotlin-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `kotlin-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `loop-operator` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `opensource-forker` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `opensource-packager` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `opensource-sanitizer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `performance-optimizer` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `planner` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `pr-test-analyzer` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `python-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `pytorch-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `refactor-cleaner` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `rust-build-resolver` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `rust-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `security-reviewer` | 不进 MVP | do not import now | 与 spec-first 现有 agent 高重复或权限风险高 |
| `seo-specialist` | 待评估 | manual review | 需要读取正文判断是否可转成 spec-first persona |
| `silent-failure-hunter` | P2 条件候选 | overlap candidate | 有明确增量，但必须先完成 agent governance、read-only/schema/no-verdict 适配 |
| `tdd-guide` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |
| `type-design-analyzer` | P2 条件候选 | overlap candidate | 有明确增量，但必须先完成 agent governance、read-only/schema/no-verdict 适配 |
| `typescript-reviewer` | P3 待评估 | overlap candidate | 可能有技术栈特化价值，但需按项目技术栈和 spec-first persona 缺口评估 |

---

## 7. Commands 全量集成决策表

结论：ECC commands **全部不进入 spec-first runtime**。

原因：

- ECC commands 是 `/everything-claude-code:*` 用户入口。
- spec-first 用户入口必须保持 `spec-*` / `spec-*`。
- ECC command 内部流程可作为设计参考，但不能直接下发。

| ECC Command | 决策 | 集成形态 | 备注 |
|---|---|---|---|
| `aside` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `auto-update` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `build-fix` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `checkpoint` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `code-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `cpp-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `cpp-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `cpp-test` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `evolve` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `feature-dev` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `flutter-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `flutter-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `flutter-test` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `gan-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `gan-design` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `go-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `go-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `go-test` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `gradle-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `harness-audit` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `hookify` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `hookify-configure` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `hookify-help` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `hookify-list` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `instinct-export` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `instinct-import` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `instinct-status` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `jira` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `kotlin-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `kotlin-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `kotlin-test` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `learn` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `learn-eval` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `loop-start` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `loop-status` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `model-route` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `multi-backend` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `multi-execute` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `multi-frontend` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `multi-plan` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `multi-workflow` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `plan` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `pm2` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `projects` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `promote` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prp-commit` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prp-implement` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prp-plan` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prp-pr` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prp-prd` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `prune` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `python-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `quality-gate` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `refactor-clean` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `resume-session` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `review-pr` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `rust-build` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `rust-review` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `rust-test` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `santa-loop` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `save-session` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `sessions` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `setup-pm` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `skill-create` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `skill-health` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `test-coverage` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `update-codemaps` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |
| `update-docs` | 不集成 | reference only | ECC command 是另一套用户入口；不导入 runtime，仅可阅读其流程提炼为 spec-first skill/reference |

---

## 8. 分阶段执行规划

### Phase 0：冻结 V1 治理基线

目标：先完成治理事实，不改 runtime。

产物：

```text
docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md
docs/02-架构设计/ECC集成/ECC技能清单.md
docs/02-架构设计/ECC集成/ECC斜杠命令清单.md
docs/02-架构设计/ECC集成/ECC子代理清单.md
```

验收：

```text
明确 ECC 182 skills / 68 commands / 48 agents 的 source evidence
明确当前 spec-first 42 source skills / 51 source agents / 21 Claude command templates
明确本文档不替代 V1，不作为当前实现计划
```

### Phase 1：Agent Inventory 与 ECC Overlap Matrix

目标：把当前 spec-first 专家团队与 ECC agent 能力做去重治理。

产物：

```text
current-agent-inventory.md
current-agent-inventory.json
ecc-agent-overlap-matrix.md
ecc-agent-overlap-matrix.json
agent-packs.md
agent-packs.json
```

验收：

```text
direct_match 不新增 agent
partial_match 有 canonical_id / origin_aliases
spec_first_native 不被 ECC 覆盖
style_profile 不进入默认 P0/P1
missing_in_spec_first 只能作为 optional lens/reference 候选
```

### Phase 2：Registry、Router、Finding 与 Synthesis

目标：让专家团队可治理、可路由、可证据绑定、可合成。

产物：

```text
agent-registry.json
routing-policy.md
context-pack schema
finding schema
synthesis policy
```

验收：

```text
每个 selected agent 有 reason / priority / evidence_budget
每个 finding 有 evidence / confidence / not_reviewed
Skill Synthesis 记录 adopt / reject / downgrade
最终 verdict 仍属于 spec-first Skill
```

### Phase 3：Node Quality Pilot

目标：证明 ECC 能力确实提升 spec-first 各节点质量。

Pilot：

```text
code-review pilot
plan pilot
doc-review pilot
skill-review pilot
```

验收：

```text
router_selected_count 不超过 workflow 上限
finding_evidence_rate 可审查
finding_dedupe / rejection / severity adjustment 有记录
node_artifact_delta 能说明 plan / review / tasks 的质量增益
stale graph 场景会降级 confidence
```

### Phase 4：ECC Skill Rubric Extraction

目标：从 ECC skills 提取 checklist / rubric / failure mode，先增强现有 spec-first workflow / agents。

候选来源：

```text
api-design
security-review
database-migrations
accessibility
click-path-audit
mcp-server-patterns
testing / verification / e2e 相关 skills
```

输出形态：

```text
更新现有 spec-first agent prompt 的 rubric
更新 spec-code-review / spec-plan / spec-doc-review references
生成 optional lens 草案
```

不做：

```text
不批量创建 skills/ecc/*
不生成 ECC runtime assets
不接 commands / hooks / agents
```

### Phase 5：Optional Lens Pack Lifecycle

前置条件：

```text
Phase 3 pilot 证明质量增益
Phase 4 rubric extraction 完成去重
doctor / clean / state 有 pack-aware 设计
runtime delivery 有 pack-gated contract
```

目标：只对少量高价值 lens 做显式 opt-in。

验收：

```text
default init 不生成 ECC asset
显式启用后生成 managed optional lens
doctor 能发现 missing / drifted / stale / residual
clean 只清理 managed optional lens，不删用户文件
```

### Phase 6：Tech Stack / Domain Optional Packs

目标：把语言、框架、领域能力保持在 optional 层。

边界：

```text
按项目技术栈显式启用
领域能力显式 opt-in
不进入 core engineering baseline
不写 confirmed standards
```

### Phase 7：Optional Agent Runtime

前置条件：

```text
agent registry schema 已落地
finding schema 已落地
synthesis policy 已在 code-review / plan / doc-review dogfood
fresh-source eval 可执行
read-only/no-verdict/forbidden-actions contract 可验证
```

目标：只考虑真正 `missing_in_spec_first` 且通过 pilot 的少量专家能力。

原则：

```text
优先增强现有 spec-* agent
缺口能力优先 optional lens
agent runtime 是最后手段
不默认生成 ecc-* agent
```

### Phase 8：Provider 化

当以上 pack 稳定后，再抽象：

```text
integrations/ecc/manifest.json
src/cli/capability-providers/ecc.js
```

并更新：

```text
package.json files
release smoke tests
tarball contents tests
provider manifest schema
```

---

## 9. 不集成清单

| 类型 | 不集成内容 | 理由 |
|---|---|---|
| Commands | `commands/*.md` 全部不进入 runtime | 第二套用户入口，与 `spec-*` 冲突 |
| Hooks | `hooks/*` 默认不集成 | 会改变全局工具行为和 managed runtime |
| Agents | 大多数 ECC agents 不进 MVP | 当前 spec-first 已有丰富 reviewer/persona，且 agent governance 未完成 |
| Full ECC plugin | 不整包安装 | 资产过大、边界不清、上下文膨胀 |
| Runtime 嵌套 skills | 不生成 `.claude/skills/ecc/api-design` | 增加 discovery / doctor / clean / path rewrite 复杂度 |
| 强制语义路由 | 不让脚本按任务类型自动启用 lens | 语义判断属于 LLM |
| 原样复制 ECC skill | 不允许 | 必须语义清洗、去 command/hook/agent 强制调用 |

---

## 10. 质量门禁

| Gate | 要求 |
|---|---|
| Source evidence | ECC 清单与 `/Users/kuang/xiaobu/everything-claude-code` source 可追溯；冲突时以 source 为准并标记清单 stale |
| Overlap | direct_match 不新增 agent；native 不被 ECC 覆盖；profile 不进默认路由 |
| Naming | canonical id 产品化，个人名只留在 origin_aliases |
| Router | selected agents 必须有 reason / priority / evidence_budget，并遵守 workflow 上限 |
| Context | 只给 selected experts 构造 context pack，不加载 ECC 全量文本 |
| Finding | finding 必须包含 severity / confidence / evidence / recommendation / not_reviewed |
| Synthesis | final verdict 只能由 Skill 输出，必须说明 adopt / reject / downgrade |
| Node quality | pilot 必须证明对应 spec-first 节点有产物质量增益 |
| Entry | 不新增 `/ecc:*`、`/everything-claude-code:*`、`$ecc-*` |
| Commands | ECC commands 全部不下发 |
| Hooks | ECC hooks 不进入默认路线图 |
| Agents | 默认不导入 agents；optional agent 必须后置到 registry / finding / synthesis 之后 |
| Runtime | default init 不生成 ECC asset；optional pack 必须 pack-gated |
| State | optional pack 状态可持久化、可清理 |
| Doctor | 能检测 enabled pack missing / drifted / stale / residual |
| Clean | 只删除 managed ECC assets，不删用户自定义文件 |
| Source attribution | 每个 ECC-derived asset 记录 source_project/source_version/source_path/transform_notes |
| Workflow | ECC lens 只提供输入，最终 verdict 属于 spec-first workflow |
| Fresh-source eval | agent / skill prose 变更后必须验证当前磁盘 source，不能依赖会话缓存 |

---

## 11. 最终建议

全量集成路线不是“把 ECC 全部搬进 spec-first”，而是：

```text
先完成 V1 重叠治理
再提取 ECC rubric / checklist / failure modes
先增强现有 spec-first agents 和 workflows
再通过 pilot 证明节点质量增益
再考虑 optional lens pack
最后才评估少量真正缺口 agents
永不接 commands
不接默认 hooks
领域能力全部 opt-in
```

推荐路线：

```text
Phase 0: 冻结 V1 治理基线与 ECC source evidence
Phase 1: 生成 spec-first agent inventory 与 ECC overlap matrix
Phase 2: 建立 registry / router / finding / synthesis policy
Phase 3: 跑 code-review / plan / doc-review / skill-review quality pilots
Phase 4: 从 ECC skills 提取 rubric，增强现有 workflow / agents
Phase 5: optional lens pack lifecycle
Phase 6: tech stack / domain optional packs
Phase 7: optional agent runtime
Phase 8: provider 化
```

一句话：

```text
全量集成不是全量安装，而是全量评估、分层治理、按需启用。
```
