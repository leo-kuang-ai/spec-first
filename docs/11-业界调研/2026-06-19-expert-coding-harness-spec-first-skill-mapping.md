# Expert-Coding-Harness 到 spec-first 的 Skill 节点映射补充报告

日期：2026-06-19
角色：Spec-First Evolution Architect
外部源码：`/Users/kuang/xiaobu/Expert-Coding-Harness`
目标仓库：`/Users/kuang/xiaobu/spec-first`
范围：外部仓库只读源码分析；输出 spec-first skill 节点能力映射与补充建议；不修改外部仓库，不修改 generated runtime mirrors。

## 0. 结论先行

`Expert-Coding-Harness`（下称 ECH）不是一个像 `spec-first` 这样的 Node.js CLI / runtime generation harness。它的核心形态是 **25 个中文 skills + Claude/Cursor hooks + Cursor always-on rules**，更接近“AI coding 方法库”和“宿主行为提醒层”。

对 `spec-first` 的正确吸收方式不是批量导入 25 个新 public workflow，也不是把 ECH hooks 变成跨宿主事实源，而是把其中较成熟的 **方法 rubric、任务交接纪律、专项审查维度和长任务上下文记忆模式** 映射到既有节点：

| 优先级 | 建议 | 对应 spec-first 节点 | 判断 |
| --- | --- | --- | --- |
| P0（假设，落地前先验证痛点） | 强化 `spec-work` 的 task handoff 质量：完整任务文本、源文件路径、验收条件、验证命令必须传给 fresh worker / reviewer | `spec-work`、`spec-write-tasks` | ECH `subagent-driven-development` 与 `writing-plans` 的最高价值点。但 §6 证据显示 spec-write-tasks 已有 `context_refs`/`review_gate`/`review_focus`、spec-work 已有 handoff 纪律；**P0 优先级须先绑 spec-first 侧失败交接实例，否则边际收益仅是 prose 加固**（见 Deferred A5/§14） |
| P0（条件门，非全仓硬序） | 强化 review 顺序：**当存在 derived task/plan spec 时**先规格符合性、再代码质量；spec-less debug/refactor 走风险优先 fallback；reviewer 不应只看 diff 美观 | `spec-code-review`、`spec-work` | ECH SDD 的 implementer -> spec reviewer -> code quality reviewer 顺序值得吸收，但其前提是“每个任务皆 spec-derived”，须写成条件门而非无条件序（见 Deferred F7） |
| P0 | 评估 `spec-task-handoff-reviewer`（plan/task/work 交接就绪度，本轮唯一“新增 agent”候选，先验证痛点再落地）；`spec-agent-tool-security-reviewer` **不新增**，先作 `spec-agent-native-reviewer` + `spec-security-reviewer` 交叉 lens（A3 裁定） | `spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`retired-skill-review` | A1/A2/A3 裁定后 agent 净增上限为 1（51 → 52）；安全能力以扩展威胁清单落到交叉 lens，重叠取舍见 §6.2 |
| P1 | 把安全审计、前端审查、API 设计、AI Agent 安全做成 code-review / plan 的专项 rubric 或 persona，而不是新增默认 workflow | `spec-code-review`、`spec-plan`、`retired-skill-review` | ECH 专项 skill 细，但多数是 checklist，不应扩大 public surface |
| P1 | config-protection（exit 2 阻断）作为确定性-gate 吸收点：这是项目“Scripts prepare facts”哲学最认可的资产，**从 P2 重排为 P1**（host-binding 是实现细节，非否决理由） | `spec-mcp-setup`、未来 host hook governance | allowlist/override 须 source-controlled + 人类可写 + AI 不可写 + override 需人工 commit；host-specific 落地前先独立核验 hook 源码（见 §8/§11 Phase 5 与 Deferred A6） |
| P1 | 借鉴 `source-reading-analyst` 的报告模板：源码事实、调用路径、Mermaid 图、风险和改造建议分栏 | `spec-plan`、`spec-debug`、`spec-repo-research-analyst` | 适合作为架构分析输出格式，不应替代 direct source evidence；落到扩 `spec-repo-research-analyst` 输出格式（A1 裁定，不新增 source-map agent） |
| P1 | 借鉴 `debug-expert` 的 hypothesis ledger / minimal repro 语言 | `spec-debug` | 与现有 debug workflow 同向，可作为 prose 加固 |
| P2 | 研究其余 hooks 的 deterministic warning 边界（sensitive file warning、format/typecheck helper） | `spec-mcp-setup`、未来 host hook governance | 只能作为可选 host readiness / warning，不应成为 semantic authority；post-edit 静默写视为写完整性风险 |
| 不采纳 | 根目录 `task_plan.md/findings.md/progress.md` 作为全仓第二真相源 | `spec-work`、`spec-sessions` | 与 spec-first repo-backed artifacts 和 source/runtime 边界冲突；只能借鉴“长任务 ledger”概念 |
| 不采纳 | 导入 `caveman`、`grill-me` 等交互风格 skill | 无 | 它们是交互模式，不是 spec-first 工程闭环节点能力 |

最终判断：ECH 对 spec-first 的补充价值集中在 **行为纪律和专项 rubric**，runtime 架构层的确定性 gate（config-protection 一类）作为 P1 候选。`spec-first` 已覆盖 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 主链路，后续应选择性吸收高信噪比规则，而不是制造 skill **或 agent** 数量膨胀——本轮 A1/A2/A3 裁定后 agent 净增上限为 1（见 §6.2-cost）。

> **两点 caveat 须随结论传递，不得只留在 §13/Deferred：**
> 1. **身份偏差**：本报告作者角色是 “Spec-First Evolution Architect”，spec-first 自身即 runtime harness。“ECH 价值在 method 而非 runtime” 的切分可能是身份驱动而非证据驱动——ECH 最确定、可测试的资产恰是 runtime 层 hooks。已据此把 config-protection 从 P2 重排为 P1；其余 hooks 优先级如再调整，应做一次 falsification（“若 spec-first 不是 runtime harness，此切分是否仍成立？”）。
> 2. **证据基线未复核**：全部 P0/P1 裁决锚定 ECH 外部 `file:line`，§13 承认未逐条复核。本报告是“源码级”分析，但结论的源码基线未独立确认——实现前须回源核验 ~5 条 load-bearing 引用（见 §14 末行）。这是“confident conclusions on unconfirmed premises”的风险，凡依赖未核引用的结论默认按“假设，落地前回源”处理。

## 1. 证据边界

| 类别 | 已核验源码 | 结论用途 |
| --- | --- | --- |
| 外部 README | `Expert-Coding-Harness/README.md` | 确认 25 skills、Claude/Cursor hooks、Cursor rules 的项目定位 |
| 外部 skills | `Expert-Coding-Harness/skills/*/SKILL.md` | 提取 workflow skill、domain checklist、hard gate、统一契约形态 |
| 外部 hooks | `Expert-Coding-Harness/hooks/hooks.json`、`scripts/hooks/*.js`、`scripts/lib/*.js` | 区分 warning hook、blocking hook、post-edit helper、session/cost/planning 文件 hook |
| 外部 rules | `Expert-Coding-Harness/.cursor/rules/*.md` | 判断其为宿主 always-on style/governance hints，不是 durable source-of-truth contract |
| 目标 skills | `spec-first/skills/*/SKILL.md` | 建立现有 public workflow / standalone skill 节点映射 |
| 目标 agents | `spec-first/agents/*.agent.md` | 判断专项 reviewer / researcher 是否已有可承接节点 |
| 项目角色契约 | `docs/10-prompt/结构化项目角色契约.md` | 校准 Light contract、Explicit boundaries、Scripts prepare facts / LLM decides |

限制：

| 限制 | 处理方式 |
| --- | --- |
| 外部仓库没有可用 `graphify-out/graph.json` | 采用 bounded direct source reads，不把 graph 输出作为证据 |
| 本仓 `graphify-out/graph.json` 存在，但本次 query 只返回 `skills-governance` schema 附近窄子图 | 记录为 `provider_untrusted / low utility`；spec-first 关系判断仍以 `skills/**/SKILL.md`、`agents/*.agent.md`、角色契约和 direct `rg` 为准 |
| ECH skills 多数是 prompt prose，不是可运行 schema | 映射为 rubric / advisory pattern，不当作 confirmed behavior |
| ECH hooks 面向 Claude/Cursor，未证明跨 Codex 等宿主一致 | 只作为 host-specific candidate，不进入 spec-first core contract |
| 本报告为 docs-only | 不修改 source skills，不更新 runtime mirror，不声称已完成行为落地 |

## 2. 源码拓扑与交付模型

| 维度 | 源码事实 | 证据 | 对 spec-first 的判断 |
| --- | --- | --- | --- |
| 仓库形态 | ECH 没有 `package.json`，不是 Node CLI 包；共有 340 个非 `.git` 文件 | `find`/`package.json` 回源核验；`README.md:41-64` 描述 `.cursor/`、`hooks/`、`scripts/` | 不应按 CLI harness 方式集成；只能把方法资产映射到现有 workflow nodes |
| Skill 源 | 顶层 `skills/` 有 25 个 skill 目录 | `README.md:1-39` 列 25 个 skill；`find skills -maxdepth 1` 回源计数为 25 | 顶层 `skills/` 是本报告主要分析对象 |
| Cursor 交付镜像 | `.cursor/skills/` 也包含全部 25 个技能 | `README.md:47-55` 明确 `.cursor/skills/` 内容与 `skills/` 一致 | ECH 采用“source 与宿主交付镜像同仓并存”的形态；spec-first 不应照搬到 generated runtime source |
| Claude hooks | `hooks/hooks.json` 配置 Claude Code `PreToolUse`、`PostToolUse`、`Stop`、`SessionStart`、`PreCompact` | `hooks/hooks.json:1-110` | 可作为 host hook pattern 参考，但不能变成 spec-first 跨宿主 contract |
| Cursor hooks | `.cursor/hooks.json` 配置 15 类事件；`.cursor/hooks/` 是适配层 | `.cursor/hooks.json:1-133`；`README.md:47-49` | ECH 的 Cursor 集成更重，spec-first 若借鉴应只吸收 deterministic helper 思路 |
| Hook 实现 | `scripts/hooks/` 有 17 个 JS 脚本，`scripts/lib/` 有 6 个工具库文件 | `find scripts/hooks scripts/lib` 回源计数 | scripts 多数只产 warning/format/check facts；符合“scripts prepare facts”但不应做语义判断 |
| Cursor rules | `.cursor/rules/` 有 24 个 always-on / language-specific rule 文件 | `README.md:66-83`；`find .cursor/rules` 回源计数 | rules 是常驻提示层，不是 repo artifact contract；可吸收为 reviewer lens |
| 参考库密度 | `code-security-audit` 有 32 个 references 文件，是 ECH 最重知识库 | `skills/code-security-audit/SKILL.md:190-227`；`find skills/code-security-audit/references` | 适合 optional security deep-dive；不适合作为默认 review 成本 |

## 3. ECH 总体能力库存

| 能力面 | 源码位置 | 核心机制 | 强度 | 对 spec-first 的含义 |
| --- | --- | --- | --- | --- |
| 25 个 skills | `skills/*/SKILL.md` | 覆盖 brainstorm、PRD、计划、TDD、debug、review、安全、前端、API、架构、handoff 等 | 高：覆盖面广 | 作为映射候选；不应逐个变成 public workflow |
| 统一契约 skill | `brainstorming`、`code-review-expert`、`code-security-audit`、`debug-expert`、`subagent-driven-development`、`writing-plans` | `Inputs / Outputs / Gates / Handoffs` | 中高：契约清楚但仍是 prose | 可借鉴到 spec-first task/artifact quality rubric |
| hard gate | 7 个 skill 共 9 处 `<HARD-GATE>`；`debug-expert`、`tdd-master` 各 2 处 | 禁止跳过设计批准、源码读取、RED 验证、修复验证等 | 中：多数靠模型遵守 | 只吸收适合 light contract 的语义门禁；不要硬编码业务判断 |
| 安全审计知识库 | `code-security-audit/references/**` | 五阶段审计、污点追踪、攻击链、架构图模板 | 高：资料最丰富 | 可作为未来 `spec-code-review` security deep-dive persona / optional mode |
| 文件化长任务记忆 | `planning-with-files/**` + hooks | `task_plan.md/findings.md/progress.md` 高频注入和 stop 提醒 | 中：实用但侵入 source truth | 借鉴 ledger 纪律，不采用根目录三文件作为第二真相源 |
| Hooks | `hooks/hooks.json`、`scripts/hooks/*.js` | secret/sensitive/config/format/typecheck/session/cost/planning | 中：deterministic helper | 可作为 runtime readiness 参考，不替代 spec-first source/runtime contract |
| Cursor rules | `.cursor/rules/*.md` | always-on coding/security/testing/style rules | 中低：宿主绑定强 | 可借鉴规则内容，不复制成 spec-first 常驻注入 |

## 4. 源码级证据摘要

| 能力/结论 | ECH 证据 | 解释 |
| --- | --- | --- |
| 项目自定位为生产级 AI Agent 技能集 | `README.md:1-8` | README 首屏直接定义为覆盖代码审查、安全审计、TDD、PRD、计划、子代理、架构、调试、前端等的技能集 |
| 25 skill 覆盖面完整 | `README.md:13-39` | 表格列出 25 个 skill、触发方式与安装命令；这也是 ECH public surface |
| ECH 交付模式是“克隆即用配置体系” | `README.md:41-64` | `.cursor/`、`hooks/`、`scripts/` 同仓交付；与 spec-first source/runtime mirror 边界不同 |
| Cursor rules 是 always-on | `README.md:66-83`；`.cursor/rules/common-development-workflow.md:1-4` | 规则文件 frontmatter `alwaysApply: true`，应视为宿主提示层 |
| `writing-plans` 强调零上下文执行者 | `skills/writing-plans/SKILL.md:8` | 计划必须写明路径、命令、完整代码块与预期输出，是 P0 task quality 借鉴点 |
| `writing-plans` 有可执行计划 gate | `skills/writing-plans/SKILL.md:19-30`、`:128-147` | 禁止占位词、要求路径/命令/预期输出、自检规格覆盖和占位扫描 |
| `subagent-driven-development` 的核心是完整任务文本 + 双审查顺序 | `skills/subagent-driven-development/SKILL.md:8`、`:16-27`、`:45-53`、`:92-99` | 主会话读计划一次，粘贴任务全文；审查顺序为规格符合性再代码质量，不能用实现者自述替代独立审查 |
| `code-security-audit` 要求 Source-to-Sink 证据链 | `skills/code-security-audit/SKILL.md:8-22`、`:28-35`、`:113-127`、`:173-186` | 这是安全审计最值得吸收的证据纪律；但成本高，适合 optional deep-dive |
| `planning-with-files` 采用根三文件持久记忆 | `skills/planning-with-files/SKILL.md:9-22`、`:33-60` | 2-action rule 和 read-before-decide 有价值；根目录 `task_plan.md` 高频注入与 spec-first source truth 冲突 |
| `source-reading-analyst` 是只读源码分析模板 | `skills/source-reading-analyst/SKILL.md:8-12`、`:41-67`、`:220-228` | 可吸收证据表/调用图/report template；不能替代 spec-first 回源确认 |
| Claude hook 中只有 config protection 明确阻断 | `hooks/hooks.json:4-24`；`scripts/hooks/config-protection.js:1-13`、`:81-104`、`:132-134` | exit 2 阻断修改 eslint/prettier/biome 等配置；其他常见 hook 多为 warning/pass-through |
| 格式化和 typecheck hook 是非阻断 post-edit helper | `scripts/hooks/post-edit-format.js:1-18`、`:95-108`；`scripts/hooks/post-edit-typecheck.js:1-8`、`:62-90` | 格式化可能 silent write，typecheck 输出相关错误但最终 exit 0；spec-first 应保持 preview-first |
| secret / sensitive hook 是 warning-only | `scripts/hooks/check-secrets.js:1-13`、`:57-65`；`scripts/hooks/warn-sensitive-file.js:1-13`、`:55-56` | 不能把“未报警”当作安全通过 |
| Cursor planning hooks 会把计划注入 prompt | `.cursor/hooks.json:1-24`；`scripts/hooks/planning-with-files-user-prompt-submit.js:1-13`、`:32-47` | 对长任务有用，但把 `task_plan.md` 变成高频上下文源；spec-first 需避免第二真相源 |

## 5. ECH Skill 到 spec-first 节点完整映射

| ECH skill | 类型 | ECH 源码信号 | 当前 spec-first 对应节点 | 覆盖状态 | 建议补充 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- |
| `brainstorming` | Workflow | 有统一契约和 `<HARD-GATE>`；设计未确认前不实现 | `spec-brainstorm`、`spec-ideate` | 基本覆盖 | 可借鉴“候选方案对比 + 用户确认 + 设计文档自检”语言，但不新增 workflow | P1 |
| `prd-engineer` | Workflow | `<HARD-GATE>`；访谈驱动 PRD / issue 拆解 | `spec-prd` | 基本覆盖 | 可检查 `spec-prd` 是否已有最小访谈轮次、open questions、验收标准自检 | P1 |
| `writing-plans` | Workflow | 统一契约；计划面向零上下文执行者；包含路径、命令、TDD 粒度 | `spec-plan`、`spec-write-tasks` | 覆盖但可加强 | 把“zero-context executor / no placeholders / full paths / verification commands”作为 task-pack 质量 rubric | P0 |
| `subagent-driven-development` | Workflow | 统一契约；fresh subagent；implementer -> spec reviewer -> code quality reviewer | `spec-work`、`spec-code-review` | 部分覆盖 | 强化 full task text handoff、spec compliance before code quality、fresh-source reviewer 纪律 | P0 |
| `tdd-master` | Workflow / method | `<HARD-GATE>`；必须先看到因正确原因失败的测试；RED-GREEN-REFACTOR | `spec-work` | 部分覆盖 | 仅对明确 TDD slice 增加“先验证 RED”严格模式；不要求所有任务 TDD 化 | P1 |
| `debug-expert` | Workflow | 统一契约；两个 `<HARD-GATE>`；要求最小复现、假设、实际验证 | `spec-debug` | 基本覆盖 | 补强 hypothesis ledger、minimal repro、verification-before-fixed 的措辞 | P1 |
| `code-review-expert` | Review | 统一契约；SOLID、安全、性能、边界条件、删除代码检查 | `spec-code-review` | 基本覆盖 | 抽取 refactor/delete-code/SOLID checklist 作为 reviewer rubric，不改 schema | P1 |
| `code-security-audit` | Review / security | 统一契约；五阶段审计；污点追踪、攻击链、10 维安全面 | `spec-code-review`、`retired-skill-review` | 部分覆盖 | 做 security deep-dive optional mode 或专项 persona；敏感面触发，不默认全量跑 | P1 |
| `source-reading-analyst` | Research / architecture | `<HARD-GATE>`；只读源码；报告含 Mermaid、调用关系、改造建议 | `spec-plan`、`spec-debug`、`agent-native-architecture` | 部分覆盖 | 借鉴报告模板和图表选型；重要结论仍需 source/test/log 回源确认 | P1 |
| `architecture-advisor` | Architecture | 新系统 / 既有架构优化，输出 Mermaid 和路线图 | `spec-plan`、`agent-native-architecture`、`spec-code-review` | 部分覆盖 | 可吸收“现状图 -> 目标图 -> 分阶段路线图”格式 | P2 |
| `improve-codebase-architecture` | Architecture | 深模块 / 浅模块识别，改善可测试性和 AI 可导航性 | `spec-plan`、`spec-code-review`、`spec-compound` | 部分覆盖 | 适合转成 architecture smell rubric 和 durable knowledge 候选 | P2 |
| `skill-smith` | Meta-skill | skill 创建反模式、触发描述、结构建议 | `skill-creator`、`retired-skill-review` | 基本覆盖 | 可对照补 trigger precision / anti-pattern 示例；不替代现有 skill governance | P2 |
| `docs-lookup` | Tool-use method | Context7 resolve 后 query；避免 API 幻觉 | `openai-docs`、Context7 工具使用、`spec-mcp-setup` | 部分覆盖 | 保持“官方 docs / primary source 优先”，并标记 provider_untrusted/advisory | P1 |
| `planning-with-files` | Long-task memory | `task_plan.md/findings.md/progress.md`；hooks 注入/回读/提醒 | `spec-work`、`spec-sessions`、run artifacts | 概念覆盖，形态冲突 | 借鉴“每 2 次探索写 ledger / 决策前回读目标”；不采用根三文件为 source truth | P2 |
| `handoff` | Handoff | 结构化会话交接 | `spec-work` closeout、`spec-sessions` | 基本覆盖 | 可吸收“当前状态 / 已试过 / 剩余风险 / 下一步”字段作为 closeout 补充 | P2 |
| `prototype` | Prototype | 一次性原型验证，完成后清理 | `spec-polish-beta`、`spec-plan` | 部分覆盖 | 可加入原型 cleanup / discard rule；避免 prototype 演变成 source 负债 | P2 |
| `frontend-code-review` | Domain review | React/Vue/Next/TS；功能、性能、安全、可维护性 | `spec-code-review`、`frontend-design` | 部分覆盖 | 作为 frontend reviewer profile / selector rubric | P1 |
| `frontend-performance-optimization` | Domain optimize | Web Vitals、加载、运行时、bundle | `spec-optimize`、`test-browser`、`frontend-design` | 部分覆盖 | 用指标驱动而非 checklist 驱动；接入 browser/perf evidence 时再落地 | P1 |
| `react-best-practices` | Domain checklist | React/Next 组件、Hooks、状态、性能 | `frontend-design`、`spec-code-review` | 部分覆盖 | 只作为 React checklist，不新增 workflow | P2 |
| `api-design` | Domain checklist | REST/GraphQL、版本、错误处理，行数最多 | `spec-prd`、`spec-plan`、`spec-code-review` | 部分覆盖 | 抽取 API contract / error model / versioning rubric；不做独立默认 skill | P2 |
| `ai-agent-security` | Domain security | prompt injection、tool abuse、权限越界 | `agent-native-architecture`、`retired-skill-review`、`spec-code-review` | 部分覆盖 | 对 agent/tool/MCP 变更启用专项安全 checklist | P1 |
| `interview-knowledge-track` | Knowledge / interview | 面试知识拆分、主题检索、经历绑定 | 无核心对应；可旁路到 knowledge | 低相关 | 不纳入 spec-first coding workflow；若做知识产品再评估 | 不采纳 |
| `llm-wiki-interview` | Knowledge / interview | Raw/Wiki/Index 面试知识库 | 无核心对应 | 低相关 | 不纳入当前 skill 节点 | 不采纳 |
| `grill-me` | Interaction mode | 深度追问，每次一个问题 | `spec-brainstorm` 可吸收局部 | 轻量覆盖 | 作为提问风格可选，不做节点 | 不采纳 |
| `caveman` | Interaction mode | 极简通信模式，削减 token | 无 | 无需覆盖 | 与当前中文治理输出标准冲突，不纳入 | 不采纳 |

### 5.1 逐 Skill 的 workflow/agent 裁决

裁决规则：凡是改进的是任务交接、计划质量、验证顺序、证据格式或 closeout 字段，优先优化既有 skill/workflow prose；凡是需要独立专业判断且已有 reviewer 能承接，优先完善现有 agent/persona rubric；只有当现有 agent 没有清晰职责、选择信号稳定、输出能进入既有 schema 时才考虑新增 agent。本轮没有发现必须新增 public skill 的情况；可评估的新增 agent 也应是 conditional reviewer / analyst，供既有 `spec-*` skill 节点调用，而不是新的用户入口。

| ECH skill | 关键源码信号 | spec-first 对应 | workflow 优化？ | agent 节点判断 | 裁决 |
| --- | --- | --- | --- | --- | --- |
| `brainstorming` | `<HARD-GATE>` + 设计确认前不实现；输出经确认的设计文档 | `spec-brainstorm`、`spec-ideate`、`spec-doc-review` | 是，补方案对比、自检、确认前不实施的 prose | 不新增；文档审查 persona 已能承接 | 优化 workflow |
| `prd-engineer` | PRD/issue 拆解，强调访谈和验收标准 | `spec-prd` | 是，补 open questions、acceptance criteria、non-goals 自检 | 不新增；产品/范围判断仍由 PRD workflow | 优化 workflow |
| `writing-plans` | 面向零上下文执行者，要求路径、命令、预期输出、无占位 | `spec-plan`、`spec-write-tasks` | 是，P0；强化 task-pack 质量 rubric 和 `context_refs` 粒度 | 可与 SDD 合并成 `spec-task-handoff-reviewer` 候选；不是 public skill | 优化 workflow + 评估 conditional agent |
| `subagent-driven-development` | full task text、fresh worker、规格符合性审查先于代码质量审查 | `spec-work`、`spec-code-review` | 是，P0；强化 handoff payload 和 review order | 可为 `spec-task-handoff-reviewer` 提供 review order / fresh-worker lens；复用现有 reviewer/persona catalog | 优化 workflow + 评估 conditional agent |
| `tdd-master` | RED-GREEN-REFACTOR，必须实际看到 RED/GREEN 输出 | `spec-work` | 是，仅对明确 TDD / bug slice 启用 stricter RED 语言 | 不新增；测试判断由 work/debug + testing reviewer 承接 | 条件优化 workflow |
| `debug-expert` | 最小复现、假设清单、修复前后验证门 | `spec-debug` | 是，补 hypothesis ledger / minimal repro 措辞 | 不新增；现有 debug 输出已含 root cause / verification | 优化 workflow |
| `code-review-expert` | SOLID、安全、性能、边界条件、删除代码检查 | `spec-code-review` | 是，作为 reviewer rubric 素材 | 不新增；默认 core + conditional personas 已覆盖大部分面向 | 优化 review rubric |
| `code-security-audit` | 五阶段审计、Source-to-Sink、攻击链、安全控制矩阵 references | `spec-code-review`、`retired-skill-review` | 是，作为 optional deep-dive 入口/选择规则 | 优先完善 `spec-security-reviewer` / `spec-security-sentinel` rubric；多次需要完整深审后再新增 `spec-security-deep-dive-reviewer` | 完善现有 agent/rubric，保留新增候选 |
| `source-reading-analyst` | 只读源码、入口/调用链/数据流、报告含图与改造建议 | `spec-plan`、`spec-debug`、`spec-repo-research-analyst` | 是，借鉴 evidence table / call path / diagram 选型 | A1 裁定：**不新增 `spec-source-map-analyst`**，扩 `spec-repo-research-analyst` 输出格式（其 scope 已覆盖 entry/call-path/data-flow/impact） | 扩既有 analyst，不新增 agent |
| `architecture-advisor` | 现状图、目标图、技术方案和路线图 | `spec-plan`、`agent-native-architecture` | 是，补架构计划输出形态 | 不新增；`spec-architecture-strategist` 已是更合适的判断角色 | 优化 workflow |
| `improve-codebase-architecture` | 浅模块/深模块、可测试性、AI 可导航性 | `spec-plan`、`spec-code-review`、`spec-compound` | 是，作为 architecture smell / durable learning 素材 | 不新增；maintainability/simplicity/architecture reviewer 可覆盖 | 优化 rubric |
| `skill-smith` | skill 架构、触发描述、reference 组织反模式 | `retired-skill-review`、`skill-creator` | 是，补 trigger precision / progressive disclosure 示例 | 不新增；当前 skill-review 是合适入口 | 优化 skill-review rubric |
| `docs-lookup` | Context7 resolve -> query，避免 API 幻觉和敏感信息外发 | `openai-docs`、Context7 使用纪律、`spec-mcp-setup` | 是，强化 provider advisory / primary-source 语言 | 不新增；工具使用规则由 workflow 和 host docs 承接 | 优化 workflow/tool-use guidance |
| `planning-with-files` | `task_plan.md/findings.md/progress.md`、2-action rule、read-before-decide | `spec-work`、`spec-sessions`、run artifacts | 只吸收 ledger 纪律；拒绝根三文件 source truth | 不新增；session/history 能承接 resume，artifact 承接 closeout | 局部借鉴，形态不采纳 |
| `handoff` | 会话交接摘要 | `spec-work` closeout、`spec-sessions` | 是，补 closeout 字段：当前状态、已试过、剩余风险、下一步 | 不新增；现有 session historian 足够 | 优化 workflow |
| `prototype` | 一次性原型验证，完成后删除/丢弃 | `spec-polish-beta`、`spec-plan` | 是，补 prototype cleanup / discard rule | 不新增；不需要专项 reviewer | 优化 workflow |
| `frontend-code-review` | React/Vue/Next/TS，功能、性能、安全、可维护性 | `spec-code-review`、`frontend-design` | 是，作为 selector/rubric | 暂不新增通用 frontend reviewer；先组合 `kieran-typescript`、`julik-frontend-races`、design/security/perf reviewers；组合成本反复过高时再评估 `spec-frontend-quality-reviewer` | 完善现有 agent 组合，保留低优先级候选 |
| `frontend-performance-optimization` | Web Vitals、加载、运行时、bundle | `spec-optimize`、`test-browser`、`spec-code-review` | 是，强调指标驱动和 browser/perf evidence | 仅在有 Lighthouse/Web Vitals/bundle/browser trace 证据时评估 `spec-web-performance-reviewer`；`spec-performance-reviewer` 可先扩展触发 | 完善现有 agent/rubric，保留低优先级候选 |
| `react-best-practices` | React/Next Hooks、组件、状态、性能 checklist | `frontend-design`、`spec-code-review` | 是，作为 React lens | 不新增；TypeScript/frontend/design reviewers 可承接 | 优化 rubric |
| `api-design` | REST 资源、状态码、分页、错误、版本、rate limit | `spec-prd`、`spec-plan`、`spec-code-review` | 是，补 API contract / error model / versioning rubric | A2 裁定：**不新增 `spec-api-design-lens-reviewer`**，把 plan/PRD 阶段 API 设计审查作为 `spec-api-contract-reviewer` 的阶段边界扩展（避免双 API owner 无 tiebreaker） | 扩既有 reviewer，不新增 agent |
| `ai-agent-security` | Prompt injection、tool abuse、权限越界、敏感信息保护 | `agent-native-architecture`、`retired-skill-review`、`spec-code-review` | 是，补 agent/tool/MCP 安全 checklist | P0 候选 `spec-agent-tool-security-reviewer`；也可先扩 `spec-agent-native-reviewer` + security reviewer 交叉 lens | 完善现有 agent/rubric + 评估 conditional agent |
| `interview-knowledge-track` | 面试知识拆分、主题检索、经历绑定 | 无核心对应 | 否 | 不新增；偏个人知识产品，不服务当前工程闭环 | 不采纳 |
| `llm-wiki-interview` | Raw/Wiki/Index 面试知识库 | 无核心对应 | 否 | 不新增；与 spec-first coding harness 弱相关 | 不采纳 |
| `grill-me` | 每次一个问题的强追问交互模式 | `spec-brainstorm` 可局部吸收 | 只作为提问风格素材 | 不新增；不是稳定工程 artifact 节点 | 不采纳为节点 |
| `caveman` | 极简通信风格，削减 token | 无 | 否 | 不新增；与本仓中文治理输出和证据说明要求冲突 | 不采纳 |

## 6. spec-first 现有承接证据

| spec-first 能力 | 源码证据 | 对 ECH 的吸收边界 |
| --- | --- | --- |
| 核心链路已经存在 | `docs/10-prompt/结构化项目角色契约.md` 定义 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` | ECH 不是补链路空白，而是补局部质量纪律 |
| `spec-work` 已有 direct evidence boundary 和最小反馈回路 | `skills/spec-work/SKILL.md:77-120` | 可补 task handoff 细节；不需要引入 ECH 的三文件状态机 |
| `spec-work` 已有 subagent / worktree / serial-parallel 执行纪律 | `skills/spec-work/SKILL.md:340-370` | 可吸收“完整任务文本”和“先规格后质量审查”；不复制 ECH 共享目录禁止并行规则为绝对规则 |
| `spec-write-tasks` 明确 task pack 是 derived artifact | `skills/spec-write-tasks/SKILL.md:49-83` | 直接反证 ECH `task_plan.md` 不应成为 spec-first 第二 source-of-truth |
| `spec-write-tasks` 已有 `context_refs`、`review_gate`、`review_focus` | `skills/spec-write-tasks/SKILL.md:315-346` | ECH 的 zero-context task quality 可落到现有字段语义，不新增 schema 字段 |
| `spec-code-review` 已有 security/performance/api personas | `skills/spec-code-review/references/persona-catalog.md:31-40` | ECH 的 security/API/perf/frontend 能做 persona/rubric 增强，不应默认新 workflow |
| `spec-code-review` reviewer 输出已有 JSON schema 与 confidence anchors | `skills/spec-code-review/references/subagent-template.md:20-55` | ECH checklist 若接入 review，必须转成 schema-compatible findings，而不是自由文本 |
| `spec-debug` 已有 root cause、hypothesis ledger、repro feedback loop | `skills/spec-debug/SKILL.md:61-78`、`:126-130` | ECH `debug-expert` 只需做措辞强化或 eval 参照，不是缺失能力 |
| `retired-skill-review` 已覆盖 trigger precision、scope、runtime governance | `skills/retired-skill-review/SKILL.md:2-3`、`:80-100` | ECH `skill-smith` 只适合作为对照样例 |

### 6.1 Agent 节点承接盘点

本轮重点问题不是“有没有 agent 名称”，而是“专项判断是否已有稳定 owner、选择信号和输出契约”。对 ECH 里的专项 domain skill，当前更合理的是完善现有 agent/persona rubric，或优化对应 public workflow 的 prose（即 §5.1 标记为“优化 workflow”的条目），而不是新增平行 agent；唯一例外是跨 plan/task/work 的 handoff/execution-readiness 这种通用语义缺口，适合做成 conditional reviewer。术语澄清：`agent-native-architecture` 是 skill 节点，`spec-agent-native-reviewer` 是独立 reviewer agent（动作 parity 审查），二者相关但不是同一实体。

| ECH 专项能力 | spec-first 现有 agent / persona | 覆盖判断 | 建议 |
| --- | --- | --- | --- |
| 安全审计 / Source-to-Sink | `spec-security-reviewer`、`spec-security-sentinel`、`spec-adversarial-reviewer` | 有 owner，但 ECH 的 source-to-sink、攻击链和安全控制矩阵更深 | 先补 optional deep-dive rubric 和选择条件；若实际 review 多次需要完整审计，再计划新增 security deep-dive agent |
| API 设计 / 版本 / 错误模型 | `spec-api-contract-reviewer` | owner 清晰，persona catalog 已按 route/schema/exported signatures 触发 | 不新增 agent；把 ECH `api-design` 的 error envelope、pagination、versioning 作为 rubric 候选 |
| 前端代码审查 | `spec-kieran-typescript-reviewer`、`spec-julik-frontend-races-reviewer`、`spec-design-implementation-reviewer`、`spec-performance-reviewer`、`spec-security-reviewer` | 覆盖是组合式的，不是单一“frontend reviewer” | 先补 selector 说明：前端 diff 按风险组合派发；仅当组合缺口反复出现才新增 general frontend reviewer |
| 前端性能优化 | `spec-performance-reviewer`、`test-browser` skill、`spec-optimize` | 指标入口存在，但 Web Vitals/browser evidence 触发可更明确 | 放进 `spec-optimize` / browser evidence 路径，不做 checklist-only agent |
| AI Agent 安全 | `spec-agent-native-reviewer`、`spec-security-reviewer`、`agent-native-architecture` | action parity/primitive tools 有 owner；prompt injection/tool abuse 交叉风险需补 rubric | 优先完善 agent-native + security 交叉 lens，不新增 `ai-agent-security` clone |
| 源码阅读 / 架构走读 | `spec-repo-research-analyst`、`spec-architecture-strategist`、`spec-adversarial-document-reviewer` | owner 清晰；ECH 报告模板可改进输出质量 | 补 evidence table / call path / diagram guidance；不新增 source-reading agent |
| Skill 设计质量 | `retired-skill-review`、`skill-creator` | owner 清晰，且 spec-first 有 source/runtime governance 特化 | 吸收 ECH `skill-smith` 反模式示例；不新增 meta-skill |

### 6.2 可封装为 spec-first agent 的候选能力

这里的“封装成 agent”不是把 ECH skill 原样复制成 public workflow，而是把需要独立专业判断、可由既有 skill 节点按条件调用的能力，做成 `agents/*.agent.md` 下的 conditional reviewer / analyst。选择标准是：触发信号稳定、输入边界可控、输出能进入现有 review/doc-review/handoff schema、只产判断不写 runtime、关键结论可回源确认。

> 2026-06-20 second-review 裁决：A1/A2/A3 的 extend-vs-new 已在本表内裁定（不再只留在 Deferred 区）。裁决后，7 个候选里只有 `spec-task-handoff-reviewer` 是“明确新增 agent”候选；其余全部转为“扩现有 agent / 交叉 lens / 暂不新增”，使本轮 agent 净增上限从 7 收敛到 1（51 → 52，而非 51 → 58）。这是对 §0 反膨胀前提向 agent catalog 轴的对齐，见 §6.2-cost。

| 优先级 | 候选 / 处置 | ECH 来源 | 供哪些 spec-first skill 节点使用 | 判断能力 | 推荐裁决（已裁定） |
| --- | --- | --- | --- | --- | --- |
| P0 | `spec-task-handoff-reviewer`（或 `spec-execution-readiness-reviewer`）——**唯一明确新增候选** | `writing-plans` + `subagent-driven-development` | `spec-plan`、`spec-write-tasks`、`spec-work`、`spec-doc-review` | 判断 plan/task/handoff 是否足够给 fresh worker 执行：路径、上下文、验收、验证命令、`stop_if`、`review_focus`、review order 是否明确 | 新增评估；这是跨 plan/tasks/work 的独立语义质量判断，不应只靠执行者自检。**先验证 spec-first 侧痛点**（见 §0 P0 锚定说明）再决定是否落地 |
| P0 | `spec-agent-tool-security-reviewer` → **不新增，先作交叉 lens**（A3 裁定） | `ai-agent-security` | `retired-skill-review`、`spec-code-review`、`agent-native-architecture`、`spec-plan` | 威胁面：prompt injection、tool abuse、MCP/tool 权限越界、secret 暴露、source/runtime mirror 边界、human-only auth/security exception，外加 **provider/MCP 输出当指令注入、planning/ledger 文件注入、供应链/vendored 依赖（`vendor/`）、runtime mirror 篡改、经外部 provider 调用的数据外发**；并以 **“check-secrets 无告警 ≠ 安全通过”** 为硬约束 | A3 裁定：与 `spec-agent-native-reviewer`（已 owns tool/MCP/system-prompt + human-only auth exception）边界重叠，**先作 `spec-agent-native-reviewer` + `spec-security-reviewer` 的交叉 lens**；scope 先按左列补齐再实施，重复出现且交叉 lens 无法承接时才评估独立 agent |
| P1 | `spec-security-deep-dive-reviewer` → **先扩现有 deep mode** | `code-security-audit` | `spec-code-review`、`retired-skill-review` | Source-to-Sink、攻击链、auth/public endpoint/secrets/tool execution deep audit；输出 exploit path、control gap、source refs | 先扩现有 `spec-security-reviewer` / `spec-security-sentinel` deep mode；当完整深审需求反复出现再新增 |
| P1 | ~~`spec-api-design-lens-reviewer`~~ → **删候选，扩 `spec-api-contract-reviewer`**（A2 裁定） | `api-design` | `spec-prd`、`spec-plan`、`spec-doc-review`、`spec-code-review` | 在 PRD/plan 阶段审 API resource model、error envelope、pagination、versioning、rate limit、compatibility | A2 裁定：与 `spec-api-contract-reviewer`（已接 route/schema/interface/versioning）重叠，**不新增 owner**；把 plan/PRD 阶段 API 设计审查作为 `spec-api-contract-reviewer` 的阶段边界扩展（contract-reviewer 兼管无代码 artifact 的设计 lens） |
| P1 | ~~`spec-source-map-analyst`~~ → **删候选，扩 `spec-repo-research-analyst`**（A1 裁定） | `source-reading-analyst` | `spec-plan`、`spec-debug`、`spec-code-review` | bounded source map、entry points、call path、data flow、impact surface、risk refs | A1 裁定：`spec-repo-research-analyst` 的 `architecture`/`patterns` scope 已覆盖 entry points/call path/data flow/impact surface，**不新增 owner**；改为给它补 ECH 的 evidence-table / call-path / diagram 输出格式 |
| P2 | `spec-frontend-quality-reviewer` → **暂不新增，先组合** | `frontend-code-review` + `react-best-practices` | `spec-code-review`、`frontend-design`、`spec-polish-beta` | 汇总 React/Next/Vue/TS component、state、hook、race、UX implementation、accessibility、security/perf selector 信号 | 暂不新增；先组合 `spec-kieran-typescript-reviewer`、`spec-julik-frontend-races-reviewer`、`spec-design-implementation-reviewer`、`spec-performance-reviewer`、`spec-security-reviewer` |
| P2 | `spec-web-performance-reviewer` → **不做无指标 agent** | `frontend-performance-optimization` | `spec-optimize`、`spec-code-review`、`test-browser` | 只在有 Web Vitals、Lighthouse、bundle、browser trace 或 runtime profiling 证据时判断性能瓶颈和实验方向 | 不做无指标 checklist agent；若落地，应由 `spec-optimize` 或 browser evidence 路径触发 |

**§6.2-cost：agent catalog 增长也是一条膨胀轴。** 每个新增 agent 是长期维护承诺：prose drift、fresh-source eval、双宿主生成、contract tests、orchestrator selection 负担。因此“扩既有 persona”默认优于“新增 agent”，仅当 (a) 现有 agent 没有清晰职责、(b) 选择信号稳定且非现有 trigger 子集、(c) 输出能进入既有 schema、(d) 判断是现有 reviewer 结构上无法做出的 三条同时成立时才新增。本阈值与 §0 对 skill 数量膨胀的约束对称适用。

### 6.3 不应封装为 agent 的能力

| ECH 能力 | 不 agent 化原因 | 正确去向 |
| --- | --- | --- |
| `debug-expert` | root cause、hypothesis ledger、minimal repro 是 workflow 执行纪律，不是独立 reviewer 缺口 | 优化 `spec-debug` prose / eval fixture |
| `tdd-master` | RED/GREEN 是 execution posture；默认 agent 化会把所有任务误推向 TDD | 作为 `spec-work` / `spec-debug` 的条件执行模式 |
| `brainstorming` / `prd-engineer` / `writing-plans` 主体 | 它们定义 WHAT/HOW artifact 生产流程；拆成 agent 会弱化 public workflow owner | 强化 `spec-brainstorm`、`spec-prd`、`spec-plan`、`spec-write-tasks`，只把 handoff readiness 单独评估为 candidate agent |
| `planning-with-files` / `handoff` | 根三文件和会话交接是 artifact/session 形态，不是专业判断角色 | 借鉴 ledger / closeout 字段，交给 `spec-work`、`spec-sessions`、run artifacts |
| `docs-lookup` | 是工具使用纪律和 primary-source 约束，不应让 agent 代替 deterministic provider readiness | 保持在 `openai-docs`、Context7 使用规则、`spec-mcp-setup` readiness / degraded mode |
| `skill-smith` | spec-first 已有 `retired-skill-review` 与 `skill-creator` owner；新增 meta-agent 会制造治理重叠 | 吸收 trigger precision、progressive disclosure、anti-pattern 示例 |
| `grill-me` / `caveman` / 面试知识类 | 交互风格或个人知识产品，不服务当前 AI coding harness 主链路 | 不纳入核心；最多作为非默认写作风格参考 |

## 7. 按 spec-first 节点的补充建议

| spec-first 节点 | 当前职责 | ECH 可补充能力 | 建议集成方式 | 不做什么 |
| --- | --- | --- | --- | --- |
| `spec-brainstorm` | 需求澄清、方案探索 | `brainstorming` 的方案对比、批准前不实现、自检清单 | 补 prose rubric：每个候选方案要有 tradeoff、风险、open questions | 不新增 `brainstorming` clone |
| `spec-prd` | PRD-grade requirements | `prd-engineer` 的访谈驱动和 issue 拆解 | 对 PRD 输出检查 open questions、acceptance criteria、non-goals | 不强制固定访谈轮次 |
| `spec-plan` | 实施计划 | `writing-plans` 的 zero-context executor、`architecture-advisor` 的现状/目标/路线图 | 在计划质量标准里补“完整路径、命令、停止条件、验收证据” | 不新增复杂 plan schema |
| `spec-write-tasks` | 任务包生成 | ECH 任务要小、可执行、含验证命令 | 复用现有 `context_refs` / `stop_if` / `review_focus`，补写作 rubric | 不新增 task-pack 字段 |
| `spec-work` | 执行实现 | `subagent-driven-development` 的 full task text handoff、TDD slice、handoff | 补 P0 交接纪律和 review 顺序；TDD 只在明确 slice 启用 | 不把所有任务改成强 TDD |
| `spec-debug` | 根因定位和修复 | `debug-expert` 的 hypothesis ledger、minimal repro、fix 验证门 | 补强语言和 checklist；保持现有 direct evidence / regression test 纪律 | 不让模型编造 repro 或 verification |
| `spec-code-review` | 代码审查 | review/security/frontend/API/agent-security 多类 checklist | 作为 persona selector 或 reviewer rubric；安全审计可 optional deep-dive | 不默认每次跑大型安全审计 |
| `spec-doc-review` | 文档审查 | `source-reading-analyst` 报告结构 | 仅借鉴 evidence table / claims table 输出形态 | 不把 Mermaid 变成文档审查硬要求 |
| `retired-skill-review` | skill/agent 审计 | `skill-smith`、`ai-agent-security` | 补 trigger precision、tool permission、安全边界 rubric | 不让外部 skill style 覆盖 spec-first governance |
| `spec-mcp-setup` | runtime readiness | `docs-lookup` / hooks readiness 思路 | 对 Context7/Graphify 等 provider 维持 readiness facts + degraded mode | 不把 provider 输出当 truth |
| `spec-compound` | 知识沉淀 | `improve-codebase-architecture` 的模式沉淀、debug/review 经验 | 好的架构 smell / TDD / security lesson 可沉淀为 `best_practice` / `convention` | 不把 ECH checklist 全量塞入 solutions |
| `spec-sessions` | 历史会话检索 | `handoff`、session-start/end hooks | 长任务 closeout 和 resume 可参考 handoff 字段 | 不采用 `~/.claude` session state 为 source truth |
| `spec-optimize` | 指标优化 | `frontend-performance-optimization` 的 Web Vitals / bundle 指标 | 指标驱动优化实验；配合 browser/perf evidence | 不做无指标性能 checklist |
| `frontend-design` | 前端设计/实现 | `react-best-practices`、`frontend-code-review` | 补 React/Next/Vue checklist 或 reviewer lens | 不替代实际 browser 验证 |
| `agent-native-architecture`（skill 节点）；安全审查落到 `spec-agent-native-reviewer` + `spec-security-reviewer` 交叉 lens（agent） | agent/tool 架构判断 | `ai-agent-security`、`architecture-advisor` | 在 skill prose 补架构判断措辞；**prompt injection/tool abuse/权限边界等安全 checklist 补到交叉 lens 这两个 reviewer agent，而非 skill 本身**（术语区分见 §6.1 注） | 不把安全 checklist 写成硬编码专家系统 |

## 8. Hooks 与 runtime 行为映射

| ECH hook / script | 事件/触发 | 行为 | 风险边界 | spec-first 处理建议 |
| --- | --- | --- | --- | --- |
| `check-secrets.js` | Stop / beforeSubmitPrompt | 扫描 secret patterns，warning-only，exit 0 | 正则可能误报/漏报；不应声称安全通过 | 可作为 optional warning；最终安全结论仍归 review/test |
| `warn-sensitive-file.js` | PreToolUse Read | 读取 `.env/.key/.pem` 等敏感文件前警告 | warning-only；宿主绑定 | 可参考到 source-reading safety reminder |
| `config-protection.js` | PreToolUse Edit | 修改 eslint/prettier 等配置时 exit 2 阻断 | blocking hook 影响 mutation；需明确 allowlist/override | 若采纳，必须 source-owned policy + 双宿主 contract，不直接复制 |
| `post-edit-format.js` | PostToolUse Edit | 检测 Biome/Prettier 后格式化 | hidden write 风险；可能改用户未预期文件 | spec-first 应保持 preview-first；格式化只在明确验证/修复路径中运行 |
| `post-edit-typecheck.js` | PostToolUse Edit | TS/TSX 编辑后运行 `tsc --noEmit` 并摘录相关行 | 非阻断；可能慢 | 可借鉴为 validation helper，不做默认 silent gate |
| `check-console-log.js` / `post-edit-checks.js` | Stop / post edit | 提醒遗留 `console.log` | 语言/场景特异 | 可作为 review checklist，不做核心 gate |
| `session-start.js` | SessionStart | 注入最近会话摘要、包管理器、项目类型 | `~/.claude` 状态不是 repo truth | spec-first 已有 session/context 边界；只借鉴摘要字段 |
| `session-end.js` / `session-end-marker.js` | Stop | 写 session summary | 外部状态易漂移 | 交给 `spec-sessions` 或 workflow artifacts，不作为 source |
| `pre-compact.js` | PreCompact | 压缩前保存状态 | 宿主事件绑定 | 可作为 host-specific runtime idea，不进入 core |
| `cost-tracker.js` | Stop | 写 `~/.claude/metrics/costs.jsonl` | 成本估算不是工程事实 | P2 可研究 optional run ledger |
| `planning-with-files-*` | UserPromptSubmit / PreToolUse / PostToolUse / Stop | 注入/回读/提醒；均 exit 0、reminder-only、非阻断（无真正 blocking gate） | 根三文件会成为第二真相源；外部内容注入有 prompt injection 风险 | 拒绝根三文件 source-of-truth 格式，但保留“目标回读 + 长任务进度 ledger”概念，落到 run artifacts |

## 9. Cursor Rules 映射

| Rule 类别 | 源码范围 | 主要内容 | spec-first 可借鉴点 | 不采用理由 |
| --- | --- | --- | --- | --- |
| common coding/security/testing/workflow/git | `.cursor/rules/common-*.md` | 编码风格、安全、测试、工作流、Git、agents、patterns、performance | 可作为 code-review / work checklist 素材 | always-on rules 宿主绑定强，且容易变成常驻上下文膨胀 |
| TypeScript rules | `.cursor/rules/typescript-*.md` | TS/JS 风格、hooks、patterns、安全、testing | 可映射到 TS reviewer lens | spec-first 不能让语言 rules 覆盖仓库本地约定 |
| Python rules | `.cursor/rules/python-*.md` | PEP8、pytest、ruff、bandit 等 | 可映射到 Python reviewer lens | 同上 |
| Go rules | `.cursor/rules/golang-*.md` | gofmt、表驱动测试、gosec 等 | 可映射到 Go reviewer lens | 同上 |

判断：ECH rules 是“宿主提示层”，不是 `spec-first` 的 source-of-truth。若后续吸收，应进入 reviewer persona / project standards lens，而不是 SessionStart 常驻注入。

## 10. 外部 Skill 结构附录

| ECH skill | 行数 | 结构信号 | 集成强度 | 备注 |
| --- | ---: | --- | --- | --- |
| `grill-me` | 18 | 极短交互模式 | 低 | 不纳入 |
| `llm-wiki-interview` | 35 | 面试知识库流程 | 低 | 与 coding workflow 弱相关 |
| `prototype` | 35 | 一次性验证 | 中 | 可补 prototype cleanup |
| `handoff` | 36 | 会话交接 | 中 | 可补 closeout 字段 |
| `caveman` | 37 | 交互风格 | 低 | 不纳入 |
| `planning-with-files` | 61 | 三文件记忆 + hooks | 中 | 借鉴 ledger，不复制 source truth |
| `improve-codebase-architecture` | 66 | 架构改善 checklist | 中 | 架构 smell rubric |
| `docs-lookup` | 94 | Context7 docs | 中 | provider advisory |
| `interview-knowledge-track` | 110 | 面试知识追踪 | 低 | 不纳入 |
| `frontend-code-review` | 120 | 前端 review | 中 | reviewer profile |
| `react-best-practices` | 129 | React checklist | 中低 | frontend lens |
| `subagent-driven-development` | 131 | 统一契约 + fresh subagents | 高 | P0 吸收 task handoff / review order |
| `brainstorming` | 142 | 统一契约 + hard gate | 中 | 补 brainstorm rubric |
| `prd-engineer` | 142 | hard gate + PRD | 中 | 补 PRD self-check |
| `frontend-performance-optimization` | 144 | 性能优化 | 中 | 指标驱动吸收 |
| `code-review-expert` | 165 | 统一契约 + hard gate | 中高 | review rubric |
| `architecture-advisor` | 169 | 架构图和路线图 | 中 | plan / architecture lens |
| `writing-plans` | 176 | 统一契约 | 高 | P0 吸收 task quality rubric |
| `skill-smith` | 192 | skill 创建 | 中 | skill-review nuance |
| `tdd-master` | 204 | hard gate + RED/GREEN | 中高 | optional strict TDD |
| `debug-expert` | 224 | 统一契约 + hard gates | 中高 | debug rubric |
| `code-security-audit` | 227 | 统一契约 + references | 高 | optional security deep-dive |
| `source-reading-analyst` | 252 | hard gate + Mermaid report | 中高 | source analysis template |
| `ai-agent-security` | 399 | agent 安全 checklist | 中 | agent/tool security lens |
| `api-design` | 523 | API design checklist | 中 | API contract rubric |

## 11. 建议落地顺序

> 边界声明：Phase 0 是本 docs-only 报告自身范围；Phase 1–5 改 `agents/`、`skills/`、contract tests 等 source，超出本报告范围，需独立 narrow plan（见 §14）后再执行。每个**新增 agent** 的 phase 都必须包含以下 gate：①把 agent 名登记进 `src/cli/contracts/dual-host-governance/agents-governance.json` 的 `standalone_agents`，或被某个 skill/template/src 以名引用，否则 `tests/unit/agents-governance-contracts.test.js` 的 orphan-detection 会失败；②源文件落地并测试通过后运行 `spec-first init` 再生，并核对 Claude/Codex 两侧 runtime mirror；③fresh-source eval 按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 执行并记录 passed/concerns/not_run；④**若该 agent 作为 conditional reviewer 被 `spec-code-review` 或其他 skill 按条件调用，必须同步更新对应 selector 文档（如 `skills/spec-code-review/references/persona-catalog.md`）并写明 trigger**，否则 agent 落地后 orphan-detection 虽通过、但 orchestrator 永不派发，成为“通过 CI 却空转”的死文件。
>
> 此外，所有改 `agents/` 或 `skills/` source 的 phase（含扩既有 agent / 改 skill prose，而非仅“新增 agent”）都必须：⑤按仓库格式更新 `CHANGELOG.md`（项目 CLAUDE.md 硬策略：缺 changelog 记录拒绝生成 source 变更）；⑥对任何“补 prose rubric”的改动，明确**落点（目标 section + 所 displace 的既有文本）**，并以 fresh-source eval 的 before/after 行为对照证明净中性或正向后才算“吸收完成”——`spec-code-review/SKILL.md` 已 1140 行，加 rubric 可能稀释既有信号，“skill 已过大”是 stop 条件而非脚注。**A1/A2/A3 裁定后（见 §6.2），本轮唯一“新增 agent”候选是 `spec-task-handoff-reviewer`；其余 phase 均为“扩既有 agent / 交叉 lens / 改 prose”，走 gate ⑤⑥ 而非 ①②③④。**

| 阶段 | 目标 | 最小改动面 | 验证方式 |
| --- | --- | --- | --- |
| Phase 0 | 保留本报告为映射证据 | `docs/11-业界调研/` + `CHANGELOG.md` | `git diff --check`、文档关键段落回读 |
| Phase 1a | 先验证 spec-first 侧痛点，再决定是否新增 `spec-task-handoff-reviewer`（本轮唯一“新增 agent”候选） | `agents/`、`skills/spec-plan`、`skills/spec-write-tasks`、`skills/spec-work`、相关 contract tests、`CHANGELOG.md` | **先收集 spec-first 侧失败交接/漏审实例或指标（无实例则标“假设，落地前先验证”，不得仅以“ECH 强调”为由排 P0）**；再做 gate ①②③④（含 `spec-doc-review`/`spec-code-review` selector wiring）+ gate ⑤⑥ + task-pack / plan fixture；确认不会变成新 public skill |
| Phase 1b | `spec-agent-tool-security-reviewer` **不新增**：先作 `spec-agent-native-reviewer` + `spec-security-reviewer` 交叉 lens（A3 裁定） | `skills/retired-skill-review`、`skills/spec-code-review`、`agents/spec-agent-native-reviewer`、`agents/spec-security-reviewer`、`agent-native-architecture` 相关 docs/tests、`CHANGELOG.md` | agent/tool/runtime 变更 fixture + 扩展威胁清单 checklist：prompt-injection、tool-abuse、security-boundary，**外加 provider/MCP-output-as-instruction、planning/ledger 文件注入、供应链/vendored deps、runtime-mirror 篡改、provider 调用数据外发**；硬约束 **“check-secrets 无告警 ≠ 安全通过”**；**ECH rubric/references 文本并入任何 reviewer prompt 前须经人工审查嵌入式指令注入**；走 gate ⑤⑥（扩既有 agent，非新增） |
| Phase 2 | 安全深审 optional mode | 先扩 `spec-security-reviewer` / `spec-security-sentinel`；必要时再新增 `spec-security-deep-dive-reviewer` | security fixture + source-to-sink evidence review；扩既有走 gate ⑤⑥，新增才走 ①②③④ |
| Phase 3 | API / source-map lens **扩既有 owner（A1/A2 裁定，不新增 agent）** | 扩 `spec-api-contract-reviewer`（接管 plan/PRD 阶段 API 设计 lens）；扩 `spec-repo-research-analyst`（补 evidence-table / call-path / diagram 输出格式） | PRD/plan/doc-review fixture + source refs / call-path evidence；走 gate ⑤⑥ |
| Phase 4 | 前端 / Web perf agent 仅按证据触发 | 先组合现有 frontend/design/perf/security reviewers；有指标证据后再评估 `spec-web-performance-reviewer` | browser trace / Web Vitals / bundle evidence；禁止 checklist-only |
| Phase 5 | hooks / runtime readiness 研究 | `spec-mcp-setup` 或 host hook governance docs | **先独立核验 ECH hook 源码真实行为（不以本报告未复核的描述为安全属性，§13 已记一次描述偏差）**；blocking-hook 的 allowlist/override 必须 source-controlled + 人类可写 + AI 工具不可写 + override 需人工 commit；post-edit 静默写视为写完整性风险（非仅 UX），commit-eligible 前须人工 diff 审查；再双宿主 dry-run，避免 hidden writes |

## 12. 反模式清单

| 反模式 | 为什么不做 | 正确方向 |
| --- | --- | --- |
| 把 ECH 25 个 skills 全部复制进 `skills/` | 扩大 public surface，稀释 workflow 入口治理，制造维护负担 | 映射到既有节点和 reviewer rubric |
| 把 Cursor rules 直接变成 spec-first 常驻规则 | 宿主绑定、上下文膨胀、与 repo-local 约定冲突 | 只吸收为 checklist / persona lens |
| 引入根目录 `task_plan.md` 作为强制状态 | 第二真相源，与 artifact/source 边界冲突 | 使用 workflow artifacts / closeout / `spec-sessions` |
| 默认启用 post-edit format/typecheck hook | hidden write / hidden cost / 用户意图不透明 | preview-first，验证命令显式执行 |
| 用 hooks 做语义判断 | 脚本只能产 deterministic facts，不应做架构/业务判断 | scripts prepare facts, LLM decides |
| 把 Context7/Graphify/外部 docs 当 truth | provider 输出可能过时或不完整 | provider_untrusted，关键结论回源确认 |
| 把 TDD 设为所有任务硬要求 | 许多 docs/config/探索任务不适用 | 只对明确 TDD slice 启用 RED gate |

## 13. 完成度审计

| 用户要求 | 当前证据 | 状态 |
| --- | --- | --- |
| 深度分析 `/Users/kuang/xiaobu/Expert-Coding-Harness` | 本报告覆盖 README、25 个顶层 skill、17 个 hook 脚本、6 个 hook lib、24 个 Cursor rules、Claude/Cursor hook 配置、关键 references | 已满足 |
| 做源码级分析 | 报告含外部源码路径与行号证据；区分 README 宣称、SKILL.md prose、hook 实现、rules frontmatter、脚本退出码 | 已满足（外部 SKILL.md/hook 行号未逐条复核；§8 planning hooks 的“未完成门禁”已在本轮修正为 exit 0 reminder-only） |
| 逐个 ECH skill 审查并找 spec-first 对应功能 | §5 覆盖 25 个 skill；§5.1 对每个 skill 给出 workflow/agent 裁决；§10 保留行数和结构信号 | 已分析（裁决依赖的外部行号引用未独立复核） |
| 补充到当前 spec-first skill 节点能力 | 映射到 `spec-work`、`spec-write-tasks`、`spec-code-review`、`spec-debug`、`spec-plan`、`spec-prd`、`retired-skill-review`、`spec-mcp-setup` 等节点，并给出 P0/P1/P2 顺序 | 已满足 |
| 思考是优化 skill workflow 还是新增/完善 agent | §5.1 给出逐 skill 裁决；§6.1 给出现有 agent owner 盘点；§6.2 给出可封装为 conditional agent 的 P0/P1/P2 候选；§6.3 列出不应 agent 化的能力 | 已满足 |
| 回答“哪些能力可以封装成 agent 给 spec-first skill 节点使用” | §6.2 给出 7 个候选；第二轮 doc-review 已按 A1/A2/A3 裁定收敛：唯一“新增 agent”候选为 `spec-task-handoff-reviewer`（且须先验证痛点），security/API/source-map 全转为扩既有 owner 或交叉 lens | 已满足且已裁决（裁决账本见 Deferred 区 second-review 状态说明；agent 净增上限为 1） |
| 表格内容输出 | 报告主体以表格为主：能力库存、证据摘要、skill 映射、节点补充、hooks、rules、结构附录、落地顺序、反模式、完成度审计 | 已满足 |
| 写入本地文档 | 文档路径为 `docs/11-业界调研/2026-06-19-expert-coding-harness-spec-first-skill-mapping.md` | 已满足 |
| 遵守 spec-first source/runtime 边界 | 只修改 `docs/11-业界调研/` 与 `CHANGELOG.md`；不修改外部仓库，不修改 `.claude/`、`.codex/`、`.agents/skills/` | 已满足 |
| 二轮 doc-review 一致性（正文 vs Deferred 无双真相源） | 第二轮 6-persona 审查发现附录与正文互相矛盾；已按用户裁决把结论并入正文，Deferred 区改为裁决账本（A1-A10/F1/F3/F7 标 RESOLVED，F5/F6 标 OPEN） | 已满足（正文为唯一真相源） |
| 证据基线回源核验 | ~5 条 load-bearing ECH 外部引用（SDD review-order、writing-plans zero-context、code-security-audit source-to-sink、config-protection exit-2、planning hooks exit-0）仍未独立复核 | **未满足（遗留实现前 narrow plan，已在 §0 caveat 2 / §14 末行声明）** |

## 14. 最终映射结论

| 结论 | 说明 |
| --- | --- |
| ECH 最高价值不是 runtime，而是方法纪律（**注意识别身份偏差**） | `writing-plans`、`subagent-driven-development`、`debug-expert`、`code-security-audit`、`source-reading-analyst` 的方法可吸收。但“method 而非 runtime”这一切分可能受 spec-first 自身“runtime harness”身份影响：ECH 最确定、最可测试的资产恰是其 runtime 层（hooks），却被本报告排到最低优先级。这条结论的 hooks 优先级应以 ECH 证据而非 spec-first 自我形象重新校准（见 §0 config-protection 重排说明与 Deferred A6） |
| spec-first 不缺 workflow 名称，缺少部分 task/review 细节硬度 | P0 是“补 task handoff / zero-context executor / spec-compliance review order”，但 §6 证据显示 spec-work 已有 handoff 纪律、spec-write-tasks 已有相关字段；**P0 必须先绑 spec-first 侧痛点实例，否则边际收益仅是已覆盖节点上的 prose 加固**。review-order 须写成条件门（仅当存在 derived task/plan spec 时 spec-compliance-first；spec-less debug/refactor 走风险优先 fallback），不作为全仓硬序 |
| 可 agent 化能力应成为 conditional reviewer / analyst，但 agent catalog 增长同受反膨胀约束 | A1/A2/A3 裁定后，本轮唯一“新增 agent”候选是 `spec-task-handoff-reviewer`（51 → 52）；security/API/source-map 全部转为扩既有 owner 或交叉 lens（见 §6.2 与 §6.2-cost 阈值）。不把“conditional agent”当作绕过 no-new-workflow 规则的免费出口 |
| 专项 domain skills 应先复用现有 reviewer lens | frontend / API / AI-agent-security / security-audit 优先扩现有 persona/rubric；只有 §6.2-cost 四条同时成立时才新增 agent |
| Hooks 是确定性 gate 候选，不止 warning/readiness | config-protection（exit 2 阻断）是项目“Scripts prepare facts”哲学最认可的吸收点，应作 P1 确定性-gate 候选（见 §0/§8）；blocking hook 的 allowlist/override 必须 source-controlled + 人类可写 + AI 不可写 + override 需人工 commit；post-edit 静默写视为写完整性风险 |
| 长任务记忆要 repo artifact 化，而不是根三文件全局化 | 借鉴 ledger，不复制 `task_plan.md/findings.md/progress.md` 形态 |
| 核心机制（prose-rubric → behavior）须带验证门 | 每条 rubric 吸收要说明落点与所 displace 文本，并经 fresh-source eval before/after 行为对照后才算完成；目标 skill 已过大时“skill 已大”是 stop 条件 |
| 证据基线有未复核风险 | 全部 P0/P1 裁决锚定 ECH `file:line`，§13 承认外部行号未逐条复核；§0/§14 结论须继承该 caveat，载入实现前先回源核验 ~5 条 load-bearing 引用（SDD review-order、writing-plans zero-context gate、code-security-audit source-to-sink、config-protection exit-2、planning hooks exit-0） |

本报告建议后续如果进入实现，应优先起一份窄 plan：**“ECH P0 task handoff 评估 + agent/tool security 交叉 lens”**。该 plan 应：(1) 先用 spec-first 侧失败实例验证 P0 痛点是否真实存在、再决定 `spec-task-handoff-reviewer` 是否落地（含 `spec-work` / `spec-write-tasks` / `spec-doc-review` 调用 prose、selector wiring、contract tests）；(2) `spec-agent-tool-security-reviewer` 不作独立 agent，先以扩展威胁清单（含 provider-output-as-instruction / 供应链 / 数据外发 / “无告警≠通过”）落到 `spec-agent-native-reviewer` + `spec-security-reviewer` 交叉 lens；(3) 实现前回源核验上述 ~5 条外部引用。三项都不新增 public skill、不引入新 schema、不修改 runtime mirror；agent 净增上限为 1。

## Deferred / Open Questions

> **2026-06-20 second-review 状态说明（重要）：** 第一轮（below, “From 2026-06-20 review”）原本把建议解留在本区、未改正文，导致**附录与正文互为第二真相源**——这恰是本报告反对 ECH 5 次的反模式，也触发角色契约 `docs/10-prompt/结构化项目角色契约.md:165`“导致多真相源必须重构”。第二轮 doc-review 已按用户裁决把结论并入正文，本区改为**裁决账本**：每条标 RESOLVED（并指向正文落点）或 OPEN（仍待裁决）。正文为唯一真相源；本区仅记 provenance 与未决项。
>
> **A1（source-map-analyst 重复）→ RESOLVED**：删候选，扩 `spec-repo-research-analyst` 输出格式。已并入 §6.2 表、§11 Phase 3、§14、§0。
> **A2（api-design-lens 重叠）→ RESOLVED**：删候选，扩 `spec-api-contract-reviewer` 阶段边界。已并入 §6.2 表、§11 Phase 3、§14。
> **A3（agent-tool-security 边界）→ RESOLVED**：不新增，先作 `spec-agent-native-reviewer`+`spec-security-reviewer` 交叉 lens。已并入 §6.2 表、§11 Phase 1b、§0、§14。
> **A4（反膨胀只管 skill 不管 agent）→ RESOLVED**：新增 §6.2-cost 阈值，agent 净增上限收敛到 1。已并入 §6.2、§0 收尾、§14。
> **A5（P0 锚定 ECH 而非 spec-first 痛点）→ RESOLVED**：§0 两个 P0 标“假设，落地前先验证痛点”，§11 Phase 1a 要求先收集失败实例。
> **A6（config-protection 被低估为 P2）→ RESOLVED**：重排为 P1 确定性-gate；§0/§8/§11 Phase 5/§14 已补 allowlist 人类可写、源码核验等护栏。
> **A7（prose-rubric 吸收缺验证门）→ RESOLVED**：§11 gate ⑥ + §14 要求落点+displace 说明 + fresh-source before/after eval。
> **A8/A9/A10（安全 reviewer scope 缺威胁与护栏）→ RESOLVED**：§6.2 表 scope 已补 provider-output-as-instruction / ledger 注入 / 供应链 / runtime-mirror 篡改 / 数据外发 + “check-secrets 无告警≠通过”硬约束 + ECH rubric 并入 prompt 前人工审查；§11 Phase 1b 同步。
> **F1（证据基线未复核）→ RESOLVED（caveat 传递）**：§0 caveat 2 + §14 末行列出 ~5 条须回源的 load-bearing 引用。
> **F3（身份偏差）→ RESOLVED（caveat 传递）**：§0 caveat 1 + §14 “识别身份偏差”行。
> **F5（survivorship bias）→ OPEN**：报告只把 ECH 映射到 spec-first，未反向用 ECH 的 9 个 `<HARD-GATE>` 当失败模式测 spec-first 是否真能防住。建议解：后续 narrow plan 加一次 reverse 失败模式审计 + spec-first 侧 do-nothing baseline；本报告范围内不补。
> **F6（caveman/grill-me 按表现层而非能力否决）→ OPEN（P3）**：caveman 的能力是“预算下上下文压缩”、grill-me 的是“对抗式单线追问”，被以“中文治理输出冲突/提问风格”否决，混淆能力与呈现。建议解：以能力语言重述否决理由；低优先级，可后续修订。
> **F7（review-order 全仓硬序风险）→ RESOLVED**：§0 第二个 P0 与 §14 改为条件门（仅 spec-derived 时 spec-compliance-first，spec-less 走 fallback）。
>
> 仍 OPEN：F5、F6（及第一轮原文如下保留作 provenance）。

### From 2026-06-20 review (round 1, provenance)

> 来源：6-persona spec-doc-review（coherence / feasibility / product-lens / scope-guardian / adversarial / security-lens）。机械修正已直接并入正文（§0、§6.1、§8、§11、§13）。下列为第一轮原始记录，其裁决状态见上方 second-review 账本；正文已据账本修订，以下文字仅作 provenance 保留。

- **`spec-source-map-analyst` 与既有 `spec-repo-research-analyst` 重复** — §6.2 (P1, feasibility/scope-guardian/adversarial, confidence-first 75)

  已回源核验：`spec-repo-research-analyst` 的 architecture/patterns scope 已覆盖 entry points、call path、data flow、impact surface，与新候选能力清单重合；§6.1 也写了“owner 清晰”。若按 §11 Phase 3 新建该 agent，spec-plan/spec-debug 的 orchestrator 将面对两个触发重叠的源码定向 owner，无原则性取舍依据。建议解：删除该新增候选，改为给 `spec-repo-research-analyst` 补 ECH 的 evidence-table/call-path/diagram 输出格式。

  <!-- dedup-key: section="62" title="specsourcemapanalyst 与既有 specreporesearchanalyst 重复" evidence="specreporesearchanalyst 的 architecturepatterns scope 已覆盖 entry points call path data flow impact surface" -->

- **`spec-api-design-lens-reviewer` 与 `spec-api-contract-reviewer` 重叠未裁决** — §6.2 (P1, feasibility/scope-guardian, confidence-first 75)

  persona-catalog 已把 `spec-api-contract-reviewer` 接到 route/schema/interface/versioning，与新候选在 plan/PRD 阶段的 API 设计审查重叠。文档点了“避免两个 API owner”却未解决；若两者都实现，API 相关 finding 会被拆到两个 agent、无 tiebreaker，产生重复或冲突结论。建议解：写死阶段边界（contract-reviewer 仅 code diff、design-lens 仅 plan/PRD 无代码 artifact 时），或直接扩 contract-reviewer 并删候选。

  <!-- dedup-key: section="62" title="specapidesignlensreviewer 与 specapicontractreviewer 重叠未裁决" evidence="personacatalog 已把 specapicontractreviewer 接到 routeschemainterfaceversioning 与新候选在 planprd 阶段重叠" -->

- **`spec-agent-tool-security-reviewer` 与 `spec-agent-native-reviewer` 边界未画** — §6.2 (P1, feasibility, confidence-first 75)

  `spec-agent-native-reviewer` 已 owns human-only auth/security exception 与 tool/MCP/system-prompt 审查，正是新候选目标域。文档给了“或先作为交叉 lens”但未裁决；无边界即建会在每个 agent/tool diff 上触发重叠、产生冗余或矛盾 finding。建议解：先定 extend-vs-new，再把非重叠 trigger 写进两个 agent 描述与 persona-catalog。

  <!-- dedup-key: section="62" title="specagenttoolsecurityreviewer 与 specagentnativereviewer 边界未画" evidence="specagentnativereviewer 已 owns humanonly authsecurity exception 与 toolmcpsystemprompt 审查正是新候选目标域" -->

- **反膨胀论调把 workflow 增长换成 agent 增长** — §6.2/§0/§14 (P1, product-lens, confidence-first 75)

  文档核心前提是避免 skill 数量膨胀，却对 ~51 个既有 agent 提出评估 7 个净新增；每个新 agent 都是长期维护承诺（prose drift、fresh-source eval、双宿主生成、contract tests）并加重 orchestrator 选择负担，而文档从未把 agent catalog 增长当成一条膨胀轴。建议解：补一条成本说明，并给出“扩既有 persona 何时优于新增 agent”的阈值，让 agent 增长与 workflow 增长同受反膨胀标准约束。

  <!-- dedup-key: section="62 0 14" title="反膨胀论调把 workflow 增长换成 agent 增长" evidence="文档核心前提是避免 skill 数量膨胀却对 51 个既有 agent 提出评估 7 个净新增" -->

- **P0 锚定在 ECH 强调点而非 spec-first 痛点** — §0/§14 (P1, product-lens, confidence-first 75)

  两个 P0（task-handoff 质量、规格先于代码质量的 review 顺序）以“ECH SDD/writing-plans 最高价值点”为由排序，而非 spec-first 用户实际痛点；§6 证据显示 spec-work 已有 handoff 纪律、spec-write-tasks 已有相关字段，边际收益可能只是在已覆盖节点上做 prose 加固。建议解：把每个 P0 绑到 spec-first 侧证据（失败交接实例/漏审实例/指标），否则标“假设，落地前先验证”。

  <!-- dedup-key: section="0 14" title="p0 锚定在 ech 强调点而非 specfirst 痛点" evidence="两个 p0 以 ech sddwritingplans 最高价值点为由排序而非 specfirst 用户实际痛点" -->

- **config-protection 等确定性 gate 被低估为 P2-optional** — §0/§8/§14 (P1, adversarial, confidence-first 75)

  已回源：角色契约 `:95` 列出确定性 gate 类别“防止 silent write、防止跨边界误操作”，正是 config-protection.js（exit 2 阻断）所做；CLAUDE.md `:170` 又确认 script 资产不受 prose 会话缓存影响。这是项目自身哲学最认可的“Scripts prepare facts”吸收点，却被降级到 P2。建议解：重排为 P1 确定性-gate 候选，显式映射到角色契约 gate 类别，host-binding 视为实现细节而非否决理由。

  <!-- dedup-key: section="0 8 14" title="configprotection 等确定性 gate 被低估为 p2optional" evidence="角色契约 95 列出确定性 gate 类别防止 silent write防止跨边界误操作正是 configprotectionjs exit 2 阻断所做" -->

- **核心机制“prose rubric 吸收”缺验证门** — §0/§5.1/§7 (P1, adversarial, confidence-first 75)

  整套 P0/P1 都押在“补 prose rubric 能改变行为”上，但无任何行为验证证据，且目标 skill 已很大（spec-code-review 1140 行），加 rubric 可能稀释而非加强；CLAUDE.md 也警告 prose 改动受会话缓存影响、需 fresh-source eval 验证。建议解：每条 rubric 吸收都要求 (a) 说明落点与所 displace 内容；(b) 经 fresh-source eval 验证后才算吸收。

  <!-- dedup-key: section="0 51 7" title="核心机制 prose rubric 吸收缺验证门" evidence="整套 p0p1 都押在补 prose rubric 能改变行为上但无任何行为验证证据且目标 skill 已很大" -->

- **拟建安全 reviewer 漏掉 MCP/provider 输出当指令注入** — §6.2 (P0, security-lens, confidence-first 100)

  `spec-agent-tool-security-reviewer` scope 列了 prompt injection 等，却没列“MCP/provider（Context7/Graphify/planning 文件）返回内容被下游 reviewer 当指令解析”这一类——而 §12 自己已标这些为 provider_untrusted。若不显式纳入，未来该 agent 不会检查嵌入 provider 输出的 reviewer prompt 是否可被操纵。建议解：把“MCP/provider-output-as-instruction 注入”作为显式威胁类别补入 §6.2，要求审查任何嵌入外部内容的 workflow 输入是否进入 reviewer prompt。

  <!-- dedup-key: section="62" title="拟建安全 reviewer 漏掉 mcpprovider 输出当指令注入" evidence="specagenttoolsecurityreviewer scope 列了 prompt injection 等却没列 mcpprovider 返回内容被下游 reviewer 当指令解析" -->

- **secret-scan 是 warning-only，须明令“未报警 ≠ 通过”** — §8/§6.2 (P0, security-lens, confidence-first 100)

  文档已指出 check-secrets 是 warning-only 且“不能把未报警当安全通过”，但未把它变成对任何采纳方/拟建 reviewer 的硬要求。拟建安全 reviewer 是 hook 输出的自然消费者，若收到绿灯可能隐式当成已通过的 gate。建议解：在 §6.2 该 agent scope 与 §11 Phase 1b 验证标准里明确——不得把 check-secrets 无告警视为安全通过，必须独立做 secret 暴露审查。

  <!-- dedup-key: section="8 62" title="secretscan 是 warningonly 须明令未报警 不等于 通过" evidence="文档已指出 checksecrets 是 warningonly 且不能把未报警当安全通过但未把它变成硬要求" -->

- **拟建安全 reviewer scope 仍缺多类威胁与护栏** — §6.2/§8 (P1, security-lens, confidence-first 75)

  除上述两条外，`spec-agent-tool-security-reviewer`/`spec-security-deep-dive-reviewer` scope 还缺：planning/ledger 文件注入（§8 已标 prompt injection 风险）；供应链/vendored 依赖（`vendor/`）与 MCP 包完整性；runtime mirror 篡改（drift 检测应作为安全检查而非仅一致性）；经外部 provider 调用的数据外发（§5.1 docs-lookup 已点“敏感信息外发”）；blocking-hook 的 allowlist/override 作为权限边界应限人类可写；安全深审 default-off 的 trigger 须可审计、静默跳过记 reason_code。建议解：把以上作为该 agent 的显式威胁清单/操作护栏补入 §6.2——这也印证 A3：先把 scope 定义清楚再决定建不建。

  <!-- dedup-key: section="62 8" title="拟建安全 reviewer scope 仍缺多类威胁与护栏" evidence="specagenttoolsecurityreviewer specsecuritydeepdivereviewer scope 还缺 planningledger 文件注入 供应链 vendored 依赖 runtime mirror 篡改 数据外发" -->
