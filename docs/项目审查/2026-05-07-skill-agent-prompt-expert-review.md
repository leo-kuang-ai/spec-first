# Skills 与 Agents 三方 Prompt 专家会审报告

日期：2026-05-07  
审查对象：`skills/` 下 42 个 source skills，`agents/` 下 51 个 source agents  
审查方式：确定性审计事实 + Google / ChatGPT / Anthropic 三个 prompt 专家视角语义复核  
真相源边界：只审 source assets，不把 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror 当作 source truth  

## 1. 结论

本轮没有发现需要立即停用整个 skill/agent 系统的 P0 问题。整体方向符合 `spec-first` 项目目标：用 skill 承载 workflow node，用 agent 承载专业判断，围绕 `Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 建立可治理的 AI coding 闭环。

但从顶尖 prompt 工程标准看，当前最大风险不是“prompt 不够聪明”，而是 **contract、eval、safety 和输出可组合性不均匀**：

- 高流量 public workflows 大多还没有最小 eval fixtures。21 个 `workflow_command` 中只有 `spec-graph-bootstrap` 为 ready，`retired-skill-review` 为 partial，其余 19 个 missing。
- 部分执行型 skill 存在高风险默认行为：`git-worktree` 默认复制 `.env*`，`spec-work-beta` 成功 batch commit 时会 stage 所有未跟踪文件。
- reviewer 类 agents 的 JSON / severity / confidence 体系明显强于 researcher、strategist、writer、manual deep-dive 类 agents，后者缺少统一的证据、限制、输出形状要求。
- `spec-work` / `spec-work-beta`、`spec-plan`、`spec-code-review` 等核心 skill 很强，但长文档密度过高，容易让宿主模型遗漏后置规则。需要通过 progressive disclosure、contract tests 和 shared reference 机制降低 drift。

建议优先做 **最小 durable 修复**：不要大规模重写全部 prompt；先建立 `Skill Minimum Contract v1`、`Agent Output Contract v1`、`High-risk Execution Safety Contract v1` 三个薄契约，并只把 public workflows 和高风险 internal helpers 纳入第一批治理。

## 2. 外部 Prompt 基准

外部资料只用于校准 prompt 工程判断，不替代项目角色契约。

- Google Gemini prompt strategies：强调清晰任务、上下文、示例、约束和输出格式，适合作为 skill I/O contract 与 few-shot eval 的校准来源。参考：https://ai.google.dev/gemini-api/docs/prompting-strategies
- OpenAI Prompt Optimizer / prompt guidance：强调对目标、约束、工具使用、结构化输出和迭代评估的显式化，适合作为 public workflow prompt contract 的校准来源。参考：https://platform.openai.com/docs/guides/prompt-optimizer
- Anthropic Claude prompt engineering 与 eval guidance：强调清晰直接、成功标准、示例、工具边界、失败模式和 eval-first。参考：https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices 与 https://platform.claude.com/docs/en/test-and-evaluate/define-success

三方共识：高质量 prompt 系统不是把规则写得更多，而是让每个规则都有明确触发边界、输入、输出、失败行为、证据要求和可回归验证。

## 3. 审查方法

确定性事实：

- 执行：`node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo .`
- 产物：`.spec-first/audits/skill-review/latest/`
- source skills：42
- source agents：51
- governance records：42
- governance findings：0
- deterministic P0：0
- deterministic P1：195，主要是结构章节缺失信号，不直接等同真实 P1
- deterministic P2：117，主要是 eval / failure / structure 信号
- security scan：P0=0，P1=56，P3=43，需语义复核，不能按关键词直接定罪

语义复核规则：

- 脚本输出只作为 signal。
- P1/P2 必须有 source 证据、反证检查、影响解释和最小修复建议。
- 不要求所有 skill 机械补齐同一套章节；只要求风险与职责匹配。
- 对轻量 read-only skill，缺 checklist 不自动升级。
- 对写文件、执行 shell、调度 agent、runtime repair、commit/push 类 skill，提高 contract 和 eval 要求。

## 4. 三堂会审结论

### 4.1 Google Prompt 专家视角

关注点：任务清晰度、示例覆盖、上下文分层、输出格式、工具/多模态行为稳定性。

结论：

- `spec-brainstorm`、`spec-plan`、`spec-code-review`、`spec-doc-review` 的 workflow 思维成熟，已经明显优于普通 prompt collection。
- 主要短板是 eval examples 不足。当前很多 skill 有大量规则，但缺少“应该触发 / 不应触发 / 缺输入 / 失败 fallback / 正确输出”样例，导致 prompt 改动后很难知道是否退化。
- 对于超过 300 行的 skill，应把稳定规则拆到 references，并在主 `SKILL.md` 保留入口、边界、必须读取的 reference 时机和 done signal。

Google 侧建议：

1. 为 public workflows 建立 trigger/boundary/failure/expected-behavior 四类 eval fixture。
2. 每个高风险 workflow 的主 prompt 保持短入口 + 按阶段读取 reference。
3. 用 3 到 5 个典型 examples 验证 route，不靠描述长短判断 prompt 好坏。

### 4.2 ChatGPT / OpenAI Prompt 专家视角

关注点：清晰目标、结构化输出、工具调用边界、eval loop、prompt optimizer 可操作性。

结论：

- reviewer agents 中一批已经有很好的 findings schema、severity、confidence anchor 和 JSON 输出，尤其适合下游合并、dedup、autofix。
- researcher / strategist / writer 类 agents 的输出契约偏松，有些虽然能给好答案，但不稳定，不利于被 workflow 自动消费。
- `spec-work-beta` 的 delegation prompt 已有 XML 结构、result JSON 和 rollback table，但 commit 阶段 staging 范围过宽，破坏了“结构化 prompt -> bounded diff”的闭环。

OpenAI 侧建议：

1. 把 agent 输出分为三种模板：`findings-json`、`research-digest`、`writer-output`，不要强行一个 schema 解决全部问题。
2. 对需要下游消费的 agent，必须输出 evidence、limitations、confidence 或 source freshness。
3. 对执行型 workflow，所有 mutating step 都必须能从输入 contract 追踪到实际 file set。

### 4.3 Anthropic Prompt 专家视角

关注点：清晰直接、成功标准、失败模式、安全边界、工具授权、long-context 可用性。

结论：

- 项目级角色契约非常清楚：`Scripts prepare, LLM decides`、source/runtime 边界、Light contract 都是正确方向。
- 当前问题是部分 skill 把“授权、步骤、异常、输出、后续 handoff”混在长文本中，长上下文下容易出现漏读。
- 多 agent 调度边界总体在变好：`spec-doc-review` 明确 dispatch gate 和 fallback；但部分 internal helpers 仍保留陈旧调用文本或 typo，说明 source prompt 之间缺少 drift check。

Anthropic 侧建议：

1. 每个写入或 shell-heavy skill 必须显式说明 failure modes 和 stop conditions。
2. 不要让 agent “猜测自己已执行 deterministic check”；脚本 facts 和 LLM judgment 必须分开报告。
3. 对 subagent 工作流，主 orchestrator 保留 ownership，leaf agent 只返回 bounded evidence。

## 5. 内容质量会审

本节刻意不评价“有没有标准标题”，而评价内容本身是否会让 agent 做出更好的工程判断。

### 5.1 按 spec-first 主链路看内容质量

| 链路节点 | 相关 skills / agents | 内容质量判断 | 主要风险 |
|---|---|---|---|
| Codebase | `spec-repo-research-analyst`、`spec-learnings-researcher`、`spec-sessions` | 能把本地事实、历史学习和会话知识带入后续 workflow，方向正确 | 历史/会话资料容易过期；需要 freshness 和 relevance 标注 |
| Graph | `spec-mcp-setup`、`spec-graph-bootstrap`、`spec-standards` | `graph-bootstrap` 是当前最成熟的 contract 模板，清楚区分 provider readiness、compiled facts 和 live MCP evidence | `standards` 容易从事实编译滑向“规则系统”；必须继续守住 preview-first 和 confirmed-only |
| Spec | `spec-brainstorm`、`spec-ideate`、product / scope / adversarial doc reviewers | 产品质量意识强，能防止“直接写代码但目标不清” | 问题探针过密时会让轻量需求变成流程负担；需要更明确的 stop heuristic |
| Plan | `spec-plan`、`spec-doc-review`、repo/framework researchers | 计划内容强调 traceability、scope boundaries、test scenarios 和 implementation-time unknowns，符合高质量交付 | `spec-plan` 过长，且覆盖非软件计划，核心 AI coding harness 目标被稀释 |
| Tasks | `spec-write-tasks` | 内容非常贴近工程执行：从 plan 派生 task-pack，不二次发明 scope，是好的中间层 | 需要推广成 task-pack contract 的正例，并防止 executor 偷读 free-form task cards |
| Code | `spec-work`、`spec-work-beta`、`spec-debug`、`spec-optimize` | 方向是“完成特性 + 持续验证 + 不扩 scope”，是对 AI coding 一次性对话的有效治理 | `Start Fast`、`Simplify as You Go` 如果缺边界，可能鼓励过度自信或无关清理 |
| Review | `spec-code-review`、`spec-doc-review`、大量 reviewer agents | 当前内容最强区域。anchored confidence、false-positive suppression、autofix_class、dedup 都很成熟 | reviewer 数量和长规则会带来 orchestration 成本；需要用 eval 证明高价值，而不是靠角色数量证明严谨 |
| Knowledge | `spec-compound`、`spec-compound-refresh`、`spec-release-notes` | 能把修复、review 和经验沉淀为可复用知识，符合项目目标 | refresh 规则复杂，容易让知识库治理本身变成负担 |

### 5.2 应保留的内容优势

- `spec-first` 最强的内容资产是 **workflow thinking**：从需求、计划、任务、执行、审查到知识沉淀，已不是普通 prompt collection。
- `spec-doc-review` 与 `spec-code-review` 的 anchored confidence 体系是高质量核心资产。它明确区分“我看到了问题”和“我能证明它会影响下游”，这比普通 review prompt 可靠。
- `spec-graph-bootstrap`、`spec-write-tasks` 已经体现了正确范式：轻 contract、明确输入输出、失败模式和 eval fixtures。它们应成为其他 workflow 的模板。
- `spec-web-researcher` 的内容质量高：它区分 recency 与 authority、要求 convergence、处理 untrusted web input，并限制 token budget。它应成为 researcher agents 的模板源。
- `spec-project-standards-reviewer` 内容方向很对：只执行项目明确写下的标准，不发明通用最佳实践。这非常贴合 `Explicit boundaries`。

### 5.3 内容层面的真实短板

#### C1：部分 internal skills 是“通用助手资产”，与 spec-first 核心目标关系弱

例子：

- `changelog` 的语气是“witty and enthusiastic product marketer”，含 fun fact / Discord posting 等内容，和本仓库“默认中文、工程治理、精简输出”的项目基线不完全一致。
- `proof`、`lfg`、`gemini-imagegen`、`feature-video` 更像可选工具技能，不是 spec-first 主链路节点。
- `frontend-design` 内容强，但属于通用 frontend 能力。应通过 `spec-work` 的 UI 场景触发，而不是变成所有项目默认中心能力。

判断：

这些不一定要删除，但应明确为 internal optional capability 或未来 plugin，而不是核心 workflow source 的同等优先级成员。否则项目容易从 workflow harness 漂移成 agent/skill collection。

#### C2：`spec-brainstorm` 和 `spec-plan` 内容质量高，但有过度流程化风险

证据：

- `spec-brainstorm` 对 evidence gap、specificity gap、counterfactual gap、attachment gap、durability gap 的设计很强，能显著提高需求质量。
- `spec-plan` 对 origin document、requirements carry-forward、task-pack handoff、test scenarios、scope boundaries 的要求很完整。

问题：

- 对轻量任务，过密探针会把用户已经清楚的需求拖入流程。
- `spec-plan` 同时支持软件计划、旅行、学习计划等通用规划，内容边界超出 spec-first 作为 AI coding harness 的核心目标。

建议：

- 保留这些产品/计划质量要求，但把“轻量跳过条件”和“软件项目优先”写得更硬。
- 通用规划能力应保持 secondary，不应影响核心工程 workflow 的可读性和 eval 优先级。

#### C3：`Start Fast` 与“不要假设”的张力需要内容级调和

证据：

- `spec-work` 强调 “Start Fast, Execute Faster”。
- 项目级准则强调 “不要假设。不要隐藏困惑。呈现权衡。”

判断：

这不是格式问题，而是执行人格冲突。好的 executor 应该快，但不能把未解决的产品/架构问题当成实现细节吞掉。

建议：

- 将 `Start Fast` 改为“快速建立可验证成功标准后执行”。
- 对 scope、target repo、source-of-truth、data migration、auth/security、runtime generation 等 red flags，明确禁止快进。

#### C4：`Simplify as You Go` 内容容易越界

证据：

- `spec-work` 要求每完成一组 implementation units 后 review simplification opportunities。
- 项目级准则要求精准修改，不做无关重构。

判断：

简化是对的，但在 AI agent 执行中，“顺手简化”很容易变成无关 refactor，尤其是 subagent 并行后看到局部重复。

建议：

- 明确只简化“由本次改动引入或直接暴露、且位于本次文件 ownership 内”的复杂度。
- 对既有复杂代码，只记录为 follow-up，不在执行中扩大 scope。

#### C5：`spec-best-practices-researcher` 的 source authority 层级需要调整

证据：

- 该 agent 写到 skill-based guidance 是 highest authority。
- 但它也用于 external API / service / framework best practices，并要求 deprecation check。

判断：

本地 skill 对项目约定有高权威；对外部 API、SDK、法规、模型、价格、平台能力，官方最新文档应高于本地 skill。否则会把陈旧 skill 误当当前 truth。

建议：

- 改成双层 authority：
  - project convention：项目 standards / skills 优先；
  - external facts：official docs / primary sources 优先，本地 skills 只能作为待验证经验。

#### C6：部分 agents 内容偏通用专家模板，未充分贴合 spec-first

例子：

- `spec-architecture-strategist` 强调 SOLID、microservice boundaries、generic scalability，但没有显式审 `source/runtime`、workflow node、artifact consumer、provider boundary。
- `spec-data-integrity-guardian` 和 `spec-security-sentinel` 更像通用审查员，缺少 anchored confidence 与 false-positive suppression。
- `spec-code-simplicity-reviewer` 的 “ruthlessly simplify / analyze every line” 内容容易鼓励风格化洁癖，和“精准修改”有张力。

建议：

- 对 retained generic agents 做 spec-first alignment pass。
- 对已经有结构化 successor 的 legacy agent，标记为 manual deep-dive 或 internal optional，不让它们进入核心 review 默认路径。

#### C7：Research 能力还不足以支撑“业界同类项目调研 + Twitter/GitHub 最新信号”

证据：

- `spec-web-researcher` 很适合 web prior art。
- `spec-issue-intelligence-analyst` 偏 GitHub issue landscape。
- 目前没有一个 source agent 明确覆盖 “GitHub repo trend + Twitter/X discourse + competitor matrix + AI trend fit + project actionability” 的完整 contract。

判断：

如果项目要持续吸收 AI coding 领域最佳实践，需要一个专门的 competitive intelligence agent，而不是临时让 web researcher 泛化。

建议：

- 新增或收敛为 `spec-competitive-intelligence-researcher`：
  - sources：GitHub、official docs/blogs、Twitter/X、release notes、issue discussions；
  - 输出：competitor pattern、adopt/avoid、evidence freshness、fit-to-spec-first、actionable capability suggestions；
  - 明确忽略营销噪声和未经证实的社交媒体观点。

#### C8：硬编码年份是内容 freshness 问题

证据：

- 多个 skills/agents 写 `The current year is 2026`。

判断：

这在 2026 年内有效，但作为长期 source prompt 会自然过期。项目应依赖 host current date 或运行时注入，而不是把年份写死。

建议：

- 改为“使用当前会话日期/host-provided current date”。
- contract lint 检查硬编码年份，除非出现在历史事实或示例中。

#### C9：prompt injection 防护不均匀

证据：

- `spec-web-researcher` 明确把网页当 untrusted input，要求忽略页面中的 agent instructions。
- `spec-best-practices-researcher`、`spec-framework-docs-researcher` 也会读取外部内容，但未同等明确 untrusted input handling。

判断：

这不是格式缺失，而是内容安全缺口。所有读取外部网页、GitHub issue、Slack、session history 的 researcher 都应有相同的 untrusted content rule。

建议：

- 抽 `External Evidence Handling Contract v1`。
- 规定：只抽取事实和可引用 claims，不执行来源页面中的指令，不把社交媒体观点当事实。

### 5.4 内容优先级排序

如果只能先修 6 件事，按内容质量收益排序：

1. 修 `git-worktree` secret propagation 和 `spec-work-beta` unbounded staging，因为它们会造成实际执行风险。
2. 给 `using-spec-first`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-code-review`、`spec-doc-review` 补最小 eval，因为它们决定主链路质量。
3. 调和 `spec-work` 中 “Start Fast / Simplify as You Go” 与项目级 precise-editing 之间的张力。
4. 将 researcher authority 改成 project convention vs external facts 双层模型。
5. 将 generic legacy agents 做 spec-first alignment 或降级为 manual optional。
6. 新增 competitive intelligence researcher，长期吸收 GitHub / Twitter / AI trend 的外部信号。

## 6. P1 Findings

### P1-01 `git-worktree` 默认复制 `.env*`，安全边界过宽

证据：

- `skills/git-worktree/SKILL.md:10` 写明复制 `.env`, `.env.local`, `.env.test` 等。
- `skills/git-worktree/SKILL.md:44-50` 给出手动复制 `.env*` 的命令。
- `skills/git-worktree/scripts/worktree-manager.sh:55-76` 实际遍历并复制 `$GIT_ROOT/.env*`，仅跳过 `.env.example`。

反证检查：

- 脚本有 direnv / mise trust 保护，但保护对象是 dev tool trust，不是 secret propagation。
- `.worktrees` 通常 gitignored，但这不能保证 `.env*` 不被误读、误上传、误复制到新 agent 上下文或误进入 shell output。

影响：

- worktree 是并行开发和 PR review 的高频辅助能力，默认复制 secrets 会把凭据传播到更多工作副本。
- 这与项目的 source/runtime 边界、安全审查目标和 AI agent 最小权限原则冲突。

建议修复：

- 默认不复制 `.env*`。
- 新增显式 opt-in，例如 `--copy-env`，并在 skill 中要求用户确认。
- 如果确实要复制，使用 allowlist，例如 `.env.local.example` 或项目显式声明的 non-secret dev env 文件。
- 输出中不要打印敏感文件名以外的内容；不要读取 secret 内容。

### P1-02 `spec-work-beta` Codex delegation 成功后 staging 范围过宽

证据：

- `skills/spec-work-beta/references/codex-delegation-workflow.md:299-307` rollback 被限定到 batch file paths，这是好的。
- `skills/spec-work-beta/references/codex-delegation-workflow.md:308-313` commit 成功路径使用 `git add $(git diff --name-only HEAD; git ls-files --others --exclude-standard)`，会 stage 当前 checkout 所有 modified 和 untracked 文件。

反证检查：

- delegation prompt 在 `constraints` 中要求限制修改范围，但 agent 执行和 shell commit 之间没有强制 file-set gate。
- 如果用户本地已有 unrelated untracked 文件，成功 batch 会把它们一起纳入提交。

影响：

- 破坏 spec-first 的 “每一行修改可追溯到任务请求” 目标。
- 破坏父 orchestrator ownership，容易提交用户未授权文件。

建议修复：

- commit 成功路径只 stage batch 的 combined Files list。
- commit 前运行 `git diff --name-only` 和 `git ls-files --others --exclude-standard`，如果出现 batch file set 外的路径，停止并要求 orchestrator 判定。
- 对 result JSON 的 `files_modified` 与实际 diff 做交叉验证。

### P1-03 Public workflows 缺少最低 eval 覆盖，prompt 退化不可验证

证据：

- `eval-readiness-report.json` 显示 42 个 skill 中 39 missing、2 ready、1 partial。
- 21 个 `workflow_command` 中，只有 `spec-graph-bootstrap` ready，`retired-skill-review` partial，其余 19 个 missing。
- missing 范围包括 `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-mcp-setup`、`spec-update` 等核心入口。

反证检查：

- 多个核心 skill 的人工设计质量很高，缺 eval 不代表当前行为一定错。
- 但没有 eval 就无法稳定判断后续 prompt 修改是否破坏触发、边界、fallback 或输出 contract。

影响：

- 这是 prompt 系统的工程质量短板。项目目标是可治理、可验证、可复用，缺 eval 会把 review 变成一次性人工信心。

建议修复：

- 第一批只覆盖 8 个最高价值入口：`using-spec-first`、`spec-brainstorm`、`spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-mcp-setup`。
- 每个入口只需要 4 类 fixture：trigger cases、boundary cases、failure cases、expected behavior。
- 不要求复杂 eval runner；先用 JSON fixtures + contract lint，后续再接 LLM-as-judge。

### P1-04 高风险执行 skill 缺统一 mutation boundary

证据：

- `git-worktree` 会写 `.gitignore`、创建 worktree、复制 env、trust dev tools。
- `spec-work` / `spec-work-beta` 会进入 commit、review、shipping flow。
- `spec-mcp-setup` / `spec-update` 会安装、初始化或修复 runtime。
- `test-browser` / `spec-polish-beta` 涉及 browser/server/截图类运行态验证。

反证检查：

- 多个 skill 内部已经有局部保护，例如 dispatch fallback、runtime 不手改、report-only 模式。
- 问题不是完全没有安全规则，而是不同 skill 的 mutation boundary 分散且命名不一致。

影响：

- 运行时如果宿主模型漏读局部段落，会把危险行为当成普通步骤执行。
- 下游 review 很难用一个固定 checklist 判断某个 skill 是否可安全执行。

建议修复：

- 定义 `High-risk Execution Safety Contract v1`，只包含 6 项：writes、shell/network、secrets、git staging/commit、external service、rollback/stop condition。
- 先覆盖 `git-worktree`、`spec-work-beta`、`spec-mcp-setup`、`spec-update`、`test-browser`。

## 7. P2 Findings

### P2-01 `spec-work` 与 `spec-work-beta` parity drift

证据：

- `spec-work-beta` 有 “Frontend Design Guidance” 阶段：`skills/spec-work-beta/SKILL.md:433-440`。
- `spec-work` 对应位置仍是 Figma 后直接 Track Progress：`skills/spec-work/SKILL.md:369-383`。
- 两者都承担 execution workflow，但 beta 多出一段 UI 质量守护。

影响：

- 用户不启用 beta 时，UI 类任务可能缺少相同的 frontend-design 触发。
- 两份长 workflow 并行维护，容易继续产生 drift。

建议：

- 将 shared execution phases 抽到 reference 或生成校验中。
- beta 只保留 delegation delta，不复制整份稳定 workflow。

### P2-02 `gemini-imagegen` prose 与 executable scripts 漂移

证据：

- `skills/gemini-imagegen/SKILL.md:14-22` 要求默认 `gemini-3-pro-image-preview`。
- `skills/gemini-imagegen/scripts/generate_image.py:28` 和 `:96-99` 默认仍是 `gemini-2.5-flash-image`。
- `skills/gemini-imagegen/SKILL.md:197-204` 强调默认 JPEG / `.jpg`，但 `scripts/generate_image.py:6-11` 示例仍用 `output.png`。

影响：

- agent 读 skill 和调用脚本会得到不同默认行为。
- 这是典型 source prompt 与 helper script contract drift。

建议：

- 统一默认模型和输出扩展名。
- 加一条 script smoke test，验证 `--help` 默认描述与 `SKILL.md` 关键 defaults 一致。

### P2-03 `agent-native-audit` 存在陈旧调用方式和文本错误

证据：

- `skills/agent-native-audit/SKILL.md:31-35` 要求调用 `/agent-native-architecture` 并选择 option 7 加载 action parity，但 core principles 中 option 7 是 Capability Discovery，Action Parity 是 1。
- `skills/agent-native-audit/SKILL.md:118` 有 `SHARED WORKSPASpec-First` 文本拼接错误。

影响：

- internal helper 虽非 public workflow，但会污染 agent-native 审查结果。
- 这说明 reference 链路缺少基本 prompt source lint。

建议：

- 修正 option 编号与文本 typo。
- 为 internal helper 增加最小 prompt lint：命令名、option 编号、section heading、拼接异常。

### P2-04 Long-form skill 的 progressive disclosure 不稳定

证据：

- 超过 300 行的 skill 有 18 个：`spec-plan` 960 行、`spec-code-review` 921 行、`spec-compound-refresh` 695 行、`spec-optimize` 687 行、`spec-mcp-setup` 630 行等。
- 多个长 skill 已经使用 references，这是正确方向，但主文档仍承担过多 routing、rules、edge cases。

影响：

- 长上下文下后置规则容易被模型漏读。
- 修改一处 prompt 时，人工 review 成本高，drift 难发现。

建议：

- 主 `SKILL.md` 保留：Purpose、Trigger、Non-trigger、Inputs、Outputs、Workflow skeleton、Failure Modes、References。
- 复杂细节按阶段延迟读取，且每个阶段有明确 “STOP, read reference X”。

### P2-05 Agent 输出 contract 分层不够

证据：

- `spec-ankane-readme-writer` 基本是自由写作 prompt，没有 evidence、output schema、limitations。
- `spec-architecture-strategist` 有结构化分析段落，但没有文件证据、置信、限制说明。
- 多数 code-review personas 已经强制 JSON findings，明显更可组合。

影响：

- writer / researcher / strategist 结果难以被 workflow 稳定消费。
- 下游 synthesis 很难区分事实、判断、假设、建议。

建议：

- 不要把所有 agent 都改成 findings JSON。
- 建三类模板：
  - reviewer：JSON findings + severity + confidence + evidence
  - researcher：research value + claims + sources + limitations + freshness
  - writer/strategist：output artifact + assumptions + checks performed + open risks

### P2-06 Boundary overlap 需要语义白名单，不需要机械合并

候选重叠：

- `spec-work` vs `spec-work-beta`：真实重叠，属于 stable/beta parity 问题。
- `spec-brainstorm` vs `spec-plan`：边界基本清晰，WHAT/HOW 已显式区分，保留即可。
- `spec-code-review` vs `spec-doc-review`：边界基本清晰，代码 diff vs 文档 artifact，保留即可。
- `spec-graph-bootstrap` vs `spec-standards`：有上下游关系，需通过 artifact consumer contract 管理，不应合并。
- `git-commit` vs `git-commit-push-pr`：意图相邻，建议补 non-trigger boundary。

建议：

- 在 audit 规则中增加 `accepted_overlap` 白名单和 reason，避免每次报同样候选。

### P2-07 Research agents 的实时性和来源纪律需要统一

证据：

- `spec-web-researcher` 已有 source quality、recency、untrusted input handling，是强模板。
- `spec-best-practices-researcher`、`spec-framework-docs-researcher` 已有 deprecation check 和 source preference。
- 但不同 researcher 对 source freshness、GitHub/Twitter/official docs 优先级、引用格式的约束不完全一致。

影响：

- 对 AI 快速演化方向的判断可能出现来源不一致。
- 用户要求最新竞品或行业调研时，agent 输出难以横向比较。

建议：

- 抽一个 `Research Evidence Contract v1`：source type、date checked、authority tier、claim freshness、uncertainty。
- 让 `spec-web-researcher` 成为 researcher 模板源。

### P2-08 Prompt source lint 缺少“文本级漂移”检查

证据：

- `agent-native-audit` typo。
- `gemini-imagegen` default drift。
- `spec-work` / beta numbering与阶段差异。

影响：

- 这类问题不是运行测试必然能发现，但会直接影响 agent 行为。

建议：

- 增加轻量 lint：重复编号、陈旧 slash command、option 引用与 heading 不一致、default model drift、runtime/source 禁止路径。

## 8. 逐项 Skill 覆盖 Ledger

说明：score 是 deterministic signal，不是质量分数；`missing eval` 不等于 skill 不可用。

| Skill | Surface | Score signal | Eval | Lines | 会审结论 |
|---|---:|---:|---:|---:|---|
| agent-native-architecture | internal_only | 57 | missing | 437 | 补 eval fixtures 和最小 I/O/failure contract |
| agent-native-audit | internal_only | 63 | missing | 283 | P2：option 文案/编号和 typo 需修 |
| changelog | internal_only | 62 | missing | 145 | 补 eval fixtures 和最小 I/O/failure contract |
| feature-video | internal_only | 62 | missing | 187 | 补 eval fixtures 和最小 I/O/failure contract |
| frontend-design | internal_only | 64 | missing | 259 | 补 eval fixtures 和最小 I/O/failure contract |
| gemini-imagegen | internal_only | 63 | missing | 238 | P2：prose 与 scripts 默认模型/扩展名漂移 |
| git-clean-gone-branches | internal_only | 67 | missing | 64 | 补 eval fixtures 和最小 I/O/failure contract |
| git-commit | internal_only | 61 | missing | 112 | 补 eval fixtures 和最小 I/O/failure contract |
| git-commit-push-pr | internal_only | 60 | missing | 235 | 补 eval fixtures 和最小 I/O/failure contract |
| git-worktree | internal_only | 56 | missing | 82 | P1：`.env*` 复制需 opt-in/allowlist |
| lfg | internal_only | 63 | missing | 71 | 补 eval fixtures 和最小 I/O/failure contract |
| proof | internal_only | 62 | missing | 316 | 补 eval fixtures 和最小 I/O/failure contract |
| report-bug | internal_only | 60 | missing | 160 | 补 eval fixtures 和最小 I/O/failure contract |
| resolve-pr-feedback | internal_only | 59 | missing | 430 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-app-consistency-audit | workflow_command/app-consistency-audit | 77 | missing | 302 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-brainstorm | workflow_command/brainstorm | 56 | missing | 235 | P2：强但需 trigger/boundary eval |
| spec-code-review | workflow_command/code-review | 59 | missing | 921 | P2：强但需 eval fixtures |
| spec-compound | workflow_command/compound | 63 | missing | 544 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-compound-refresh | workflow_command/compound-refresh | 58 | missing | 695 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-debug | workflow_command/debug | 63 | missing | 242 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-dhh-rails-style | internal_only | 64 | missing | 186 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-doc-review | workflow_command/doc-review | 62 | missing | 197 | P2：强但需 eval fixtures |
| spec-graph-bootstrap | workflow_command/graph-bootstrap | 83 | ready | 304 | 保持，作为 eval-ready 模板 |
| spec-ideate | workflow_command/ideate | 58 | missing | 352 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-mcp-setup | workflow_command/mcp-setup | 71 | missing | 630 | P2：高风险 setup 需 failure/security eval |
| spec-optimize | workflow_command/optimize | 54 | missing | 687 | P2：实验循环需 artifact/done/eval contract |
| spec-plan | workflow_command/plan | 59 | missing | 960 | P2：强但过长，需 progressive disclosure/evals |
| spec-polish-beta | workflow_command/polish-beta | 57 | missing | 92 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-release-notes | workflow_command/release-notes | 64 | missing | 175 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-session-extract | internal_only | 66 | missing | 63 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-session-inventory | internal_only | 63 | missing | 67 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-sessions | workflow_command/sessions | 72 | missing | 32 | 补 eval fixtures 和最小 I/O/failure contract |
| retired-skill-review | workflow_command/skill-review | 86 | partial | 209 | 保持，补 failure/expected eval |
| spec-slack-research | workflow_command/slack-research | 71 | missing | 42 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-standards | workflow_command/standards | 62 | missing | 416 | 补 eval fixtures 和最小 I/O/failure contract |
| spec-update | workflow_command/update | 63 | missing | 253 | P2：runtime repair 需 eval |
| spec-work | workflow_command/work | 53 | missing | 432 | P2：stable/beta parity 与 I/O contract |
| spec-work-beta | workflow_command/work-beta | 53 | missing | 503 | P1：delegation staging + beta/stable parity |
| spec-write-tasks | standalone_skill | 84 | ready | 368 | 保持，作为 eval-ready 模板 |
| test-browser | internal_only | 56 | missing | 361 | P2：shell/browser 权限边界需 output/failure contract |
| test-xcode | internal_only | 63 | missing | 209 | 补 eval fixtures 和最小 I/O/failure contract |
| using-spec-first | standalone_skill | 58 | missing | 301 | P2：meta 入口需 trigger eval |

## 9. 逐项 Agent 覆盖 Ledger

说明：下表里的“补”是结构化输出和证据纪律建议，不代表该 agent 当前不可用。

| Agent | Lines | 输出形态信号 | Evidence | Confidence | Severity | 会审结论 |
|---|---:|---|---:|---:|---:|---|
| spec-adversarial-document-reviewer | 92 | freeform | Y | Y | N | 补输出形状 |
| spec-adversarial-reviewer | 112 | JSON findings | Y | Y | Y | OK |
| spec-agent-native-reviewer | 182 | structured | Y | Y | Y | OK |
| spec-ankane-readme-writer | 51 | freeform | N | N | N | 补输出/证据契约 |
| spec-api-contract-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-architecture-strategist | 54 | structured | N | N | N | 补证据要求 |
| spec-best-practices-researcher | 119 | structured | Y | N | N | OK，建议补 freshness |
| spec-cli-agent-readiness-reviewer | 418 | structured | Y | N | Y | 补置信/门槛 |
| spec-cli-readiness-reviewer | 74 | JSON findings | Y | Y | Y | OK |
| spec-code-simplicity-reviewer | 88 | structured | Y | N | N | 补置信/门槛 |
| spec-coherence-reviewer | 58 | freeform | Y | Y | N | 补输出形状 |
| spec-correctness-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-data-integrity-guardian | 72 | freeform | Y | N | Y | 补置信/门槛 |
| spec-data-migration-expert | 99 | structured | Y | N | N | OK，建议补 assumptions |
| spec-data-migrations-reviewer | 57 | JSON findings | Y | Y | Y | OK |
| spec-deployment-verification-agent | 161 | structured | N | N | Y | 补证据要求 |
| spec-design-implementation-reviewer | 94 | freeform | Y | N | N | 补置信/门槛 |
| spec-design-iterator | 198 | structured | Y | N | Y | OK |
| spec-design-lens-reviewer | 49 | freeform | Y | Y | N | 补输出形状 |
| spec-dhh-rails-reviewer | 50 | JSON findings | Y | Y | Y | OK |
| spec-feasibility-reviewer | 45 | freeform | Y | Y | N | 补输出形状 |
| spec-figma-design-sync | 173 | structured | N | N | Y | 补证据要求 |
| spec-framework-docs-researcher | 97 | structured | Y | N | Y | OK，建议补 source freshness |
| spec-git-history-analyzer | 48 | freeform | N | N | N | 补输出/证据契约 |
| spec-issue-intelligence-analyst | 213 | structured | Y | Y | Y | OK |
| spec-julik-frontend-races-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-kieran-python-reviewer | 51 | JSON findings | Y | Y | Y | OK |
| spec-kieran-rails-reviewer | 51 | JSON findings | N | Y | Y | 补证据要求 |
| spec-kieran-typescript-reviewer | 51 | JSON findings | Y | Y | Y | OK |
| spec-learnings-researcher | 255 | structured | Y | Y | Y | OK |
| spec-maintainability-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-pattern-recognition-specialist | 59 | structured | N | N | Y | 补证据要求 |
| spec-performance-oracle | 112 | structured | Y | N | Y | OK，建议补 confidence |
| spec-performance-reviewer | 55 | JSON findings | Y | Y | Y | OK |
| spec-pr-comment-resolver | 179 | structured | Y | Y | N | OK |
| spec-previous-comments-reviewer | 69 | JSON findings | Y | Y | Y | OK |
| spec-product-lens-reviewer | 73 | freeform | Y | Y | Y | 补输出形状 |
| spec-project-standards-reviewer | 87 | JSON findings | Y | Y | Y | OK |
| spec-reliability-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-repo-research-analyst | 260 | structured | Y | N | N | OK，建议补 limitations |
| spec-schema-drift-detector | 143 | structured | N | N | N | 补置信/门槛 |
| spec-scope-guardian-reviewer | 57 | freeform | Y | Y | Y | 补输出形状 |
| spec-security-lens-reviewer | 41 | freeform | Y | Y | N | 补输出形状 |
| spec-security-reviewer | 55 | JSON findings | Y | Y | Y | OK |
| spec-security-sentinel | 95 | structured | Y | N | Y | OK，建议补 confidence |
| spec-session-historian | 183 | structured | Y | Y | N | OK |
| spec-slack-researcher | 151 | structured | Y | N | N | OK，建议补 freshness |
| spec-spec-flow-analyzer | 88 | structured | N | N | Y | 补证据要求 |
| spec-swift-ios-reviewer | 108 | JSON findings | Y | Y | Y | OK |
| spec-testing-reviewer | 53 | JSON findings | Y | Y | Y | OK |
| spec-web-researcher | 134 | structured | Y | N | N | OK，作为 researcher 模板源 |

## 10. 三个当前急需升级的能力

### 10.1 Prompt Contract 与 Eval Harness

目标：让 skill/agent 修改可回归，而不是靠人工感觉。

最小落地：

- `skills/<skill>/evals/trigger-cases.json`
- `skills/<skill>/evals/boundary-cases.json`
- `skills/<skill>/evals/failure-cases.json`
- `skills/<skill>/evals/expected-behavior-cases.json`
- 新增 lint 命令检查 eval 文件存在、schema 合法、public workflow 覆盖率。

第一批覆盖：`using-spec-first`、`spec-brainstorm`、`spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-mcp-setup`。

### 10.2 Safe Execution Boundary

目标：让写文件、shell、git、secrets、external service 的边界可以被 prompt、脚本和 review 同时看见。

最小落地：

- 高风险 skill 在 `SKILL.md` 中声明 mutation profile。
- contract lint 检查是否声明 writes、shell/network、secrets、git staging、rollback、stop condition。
- 修复 `git-worktree` 默认复制 `.env*` 和 `spec-work-beta` unbounded staging。

### 10.3 Agent Output Contract Registry

目标：让不同 agent 的输出可以被 orchestrator 稳定消费，同时保留不同角色的表达自由。

最小落地：

- `reviewer-findings-json`：用于 code/doc reviewer。
- `research-digest`：用于 web、framework、best-practices、Slack、session research。
- `writer-strategist-output`：用于 README writer、architecture strategist、design iterator。
- 每类 contract 只规定必须有的字段，不强迫所有 agent 使用同一 schema。

## 11. 修复路线图

### Phase A：立即修复高风险执行边界

1. `git-worktree`：默认不复制 `.env*`，改成显式 opt-in。
2. `spec-work-beta`：commit path 只 stage batch file set，并验证实际 diff。
3. `agent-native-audit`：修 option 编号和 `SHARED WORKSPASpec-First` typo。
4. `gemini-imagegen`：统一 prose 与 scripts 默认模型、输出扩展名。

验证：

- `npm run typecheck`
- 相关 shell/script unit tests
- `npm run lint:skill-entrypoints`
- `node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo .`

### Phase B：建立最小 contract

1. 新增 `Skill Minimum Contract v1` 文档。
2. 新增 `High-risk Execution Safety Contract v1` 文档。
3. 给第一批 8 个 public/high-value workflows 补 eval fixtures。
4. 给 researcher / writer / strategist agents 补输出 contract。

验证：

- 新增 contract lint。
- skill-review summary 中 public workflow eval missing 数下降。

### Phase C：治理 drift 和持续质量

1. 增加 prompt source lint：重复编号、陈旧 slash command、option 引用、default drift、forbidden runtime edits。
2. 增加 accepted overlap 白名单，减少重复噪声。
3. 将 `spec-work` / `spec-work-beta` shared phases 收敛为 shared reference 或 generator check。

## 12. 不建议做的事

- 不建议一次性机械补齐所有 42 个 skill 的同一套长章节。
- 不建议把所有 agent 强行改成 findings JSON。
- 不建议把 `spec-first` 做成重状态机或复杂规则引擎。
- 不建议把 external best-practice 当成项目 source of truth。
- 不建议手改 generated runtime assets 来“修 prompt 行为”。

## 13. 最终判断

当前 skill/agent 体系的战略方向正确，最值得保留的是：workflow node 与专业 agent 分离、source/runtime 边界清楚、LLM 与 scripts 职责分开、review 与 knowledge 沉淀串联成闭环。

下一阶段质量提升不应靠“更长 prompt”，而应靠三个薄机制：

1. 最小 prompt contract。
2. 可回归 eval fixtures。
3. 高风险执行边界。

这三个机制能直接服务项目目标：让 AI coding 从一次性对话，进一步走向可治理、可验证、可复用、可沉淀的工程闭环。
