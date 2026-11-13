# AI 辅助企业既有系统研发：审查需求补充调研

- 调研与访问日期：2026-11-01。
- 目的：为[研发链路 Skill 审查需求](2026-11-01-development-skills-review-requirements.md)补充专业能力基准，重点面向既有系统的持续演进。
- 证据性质：外部资料的有界阅读与本地源码定向核对；不是 19 项 Skill 全量审查，也不是实际行为评测。

## 1. 结论与适用边界

企业研发需要把新需求放回已有业务、架构、模块和运行约束中理解。AI 的关键价值是加快调查、设计、实现与反馈；能生成代码并不代表能正确选择变更位置、复用边界或验证方法。

本轮应强化三条线：从业务结果到实现和验证的可追溯关系；从当前系统到增量变更的架构适配；从一次执行到修复、总结、知识和跨会话恢复的证据连续性。以下要求是对来源的项目化综合，不是任何一家机构对 spec-first 的认证。

## 2. 已读取的外部资料

下列资料为访问日在线版本；页面未在本轮提取稳定版本号时不编造版本。只将实际读取章节作为依据，不声称通读其全部链接或所有示例。正式逐项审查引用时应重新核验相关章节的新鲜度。

| 编号 | 来源与读取范围 | 原文支持的实践 | 本项目适配与限制 |
|---|---|---|---|
| R1 | [Patterns of Legacy Displacement](https://martinfowler.com/articles/patterns-legacy-displacement/)，Martin Fowler 网站；阅读 Legacy Replacement Treadmill、Understand the outcomes、Decide how to break the problem、交付与案例的相关部分 | 先理解业务结果与现有系统，寻找业务和技术接缝，以增量方式交付；技术替换本身不是业务目标 | 用于架构适配、切片与兼容审查。来源侧重现代化改造，不能推导每次功能开发都需要微服务、平台替换或组织变革 |
| R2 | [What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)，Google Engineering Practices；Design、Functionality、Complexity、Tests、Context、Documentation | 审查设计与系统融合、功能正确性、复杂度、测试有效性；测试也需要审查，应能在代码错误时失败 | 用于设计、实现、自测和代码审查。不照搬 Google 内部工具或将其规则直接设为项目强制规范 |
| R3 | [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)，Ham Vocke / Martin Fowler 网站；The Test Pyramid、Unit tests、Mocking and Stubbing、What to Test、Test Structure | 使用不同粒度的测试；针对可观察行为而非内部实现结构；权衡测试替身、反馈速度和维护成本 | 不强制测试比例、每类每函数测试或 100% 覆盖；语言和示例框架仅为示例。本轮未通读文章后续全部实现示例 |
| R4 | [Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)，Google SRE；复盘目标、触发条件、无责文化、审查与知识共享 | 记录影响、原因、缓解、预防行动；关注系统原因，复盘需审阅并促进复用；选择与影响相称的复盘时机 | 将方法适配到重要研发问题，不要求每个小缺陷写事故报告；不外推 Google 运行效果到本项目 |
| R5 | [Best practices for using GitHub Copilot to work on tasks](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)，GitHub Docs；Making sure your issues are well-scoped、Choosing the right type of tasks、Researching/planning/iterating、Adding custom instructions | 明确任务与验收条件，先研究仓库再规划，提供构建测试知识；复杂领域和关键任务需要更审慎的分工 | 属于具体产品建议，不能推导所有模型的能力上限或强制同样委派方式；不把自动提交/PR 行为带入本地授权 |
| R6 | [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)，Anthropic Engineering；有效上下文、按需检索、Compaction、Structured note-taking、Sub-agent architectures | 维护最小充分上下文、按需取证，压缩时保留架构决策和未解决问题，以持久笔记维持长任务连续性 | 支持交接审查，但摘要仍需当前源码核对；不保证恢复后的正确性，不默认启动多 Agent，也不要求复制厂商内部实现 |

访问限制：首次 fetch 对 GitHub 页面读取失败，随后通过 HTTP 读取成功。Anthropic 的 `effective-harnesses-for-long-running-agents` 页面先遇连接错误，后返回 HTTP 403，未作为证据；改用已成功读取的 R6。未核验的 SWEBOK、OWASP、NIST SSDF、DORA、SPACE 仍只是后续候选资料，不能因在需求中出现就标为完成。

### 2.1 第二轮补充资料（2026-11-01）

第二轮针对第一轮未覆盖的四类问题补充来源：AI 对既有系统研发的实际收益与风险、不兼容变更与隐式合同、测试有效性、AI 特有的安全与授权风险。读取方式与第一轮相同，只把实际读到的部分作为依据。

| 编号 | 来源与读取范围 | 原文支持的实践或发现 | 本项目适配与限制 |
|---|---|---|---|
| R7 | [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)，METR，2025-07-10；读取 Motivation、Methodology、Core Result 及“不提供证据的结论”表 | 16 名资深开发者在自己熟悉的大型开源仓库中处理 246 个真实 issue，随机分配是否允许使用 AI。允许使用时平均耗时多 19%，而开发者事后仍自评提速约 20% | 说明在成熟大型代码库里，自我感知不能当作收益证据。原文明确不能外推到多数开发者、其他场景或未来模型，本项目只用它支持“效能主张需要实测”，不用它否定 AI 价值 |
| R8 | [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)，Google Cloud 博客，2025-09；读取全文 | 约 5,000 名从业者的调查显示，AI 放大团队已有的长处和问题。AI 采用与交付吞吐正相关，与交付稳定性仍负相关；自动化测试、版本控制和快速反馈不足时，变更量增加会带来不稳定 | 团队级相关性研究，不能证明单个 Skill 的效果，也不能用于评价个人。完整报告 PDF 未能通过 fetch 读取，七项 AI 能力的具体内容未核验 |
| R9 | [Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)，Martin Fowler bliki；读取全文 | 不兼容的接口变更分为扩展、迁移、收缩三个阶段，旧消费者在迁移期继续可用，每个阶段都可以单独发布 | 适用于有多个或外部消费者的接口、schema、事件格式。仓库内单一调用者的私有函数可以直接修改，不要求套用三阶段 |
| R10 | [Hyrum's Law](https://www.hyrumslaw.com/)，Hyrum Wright；读取全文 | 消费者足够多时，系统所有可观察行为都会被依赖，包括合同未承诺的性能、顺序、错误文本等，形成隐式接口 | 支持“现有行为即事实合同”的影响面分析。不等于所有行为都必须保持，是否改变需要业务 owner 决定并处理受影响消费者 |
| R11 | [Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)，Michael Nygard，2011-11-15；读取全文 | 用短小的决策记录保留背景、决策、状态和全部后果（含负面后果），被推翻的决策标记为 superseded 而非删除；目的是让后来者避免盲目接受或盲目推翻旧决策 | 支持方案设计中记录取舍与被否定方案，以及消费既有决策记录。不要求本项目或用户项目引入固定 ADR 目录或格式 |
| R12 | [Software Engineering at Google, Ch.11 Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html)，Winters 等，O'Reilly 2020 在线版；读取 Test Size、Test Scope、Beyoncé Rule、A Note on Code Coverage、The Pitfalls of a Large Test Suite | 区分测试规模（资源与确定性约束）和测试范围（被验证代码的多少）；测试应密封、确定、一眼可懂，避免条件和循环；覆盖率只说明代码被执行，不说明结果被检查；滥用 mock 造成脆弱测试；在可行时保留真实依赖 | 80/15/5 比例是 Google 自身经验值，原文也说明各团队应按架构调整，本项目不采用固定比例 |
| R13 | [State of Mutation Testing at Google](https://research.google/pubs/state-of-mutation-testing-at-google/)，Ivanković 等，ICSE SEIP 2018；仅读取摘要 | 变异测试通过注入小缺陷衡量测试能否发现错误；Google 采用基于 diff 的概率方法降低成本，并在代码审查中呈现结果 | 支持“测试应在实现错误时失败”的可操作检验。正文未读；不要求项目引入变异测试工具，人工构造一个合理错误实现也可作为高风险变更的轻量替代 |
| R14 | [We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs](https://arxiv.org/abs/2406.10279)，Spracklen 等，arXiv v3 2025-03-02，USENIX Security 2025；仅读取摘要 | 16 个模型生成的 57.6 万个代码样本中，商业模型平均至少 5.2%、开源模型至少 21.7% 的包推荐是不存在的包，构成供应链攻击面 | 支持“AI 引入新依赖必须核实存在性与来源”。比例针对研究使用的模型和提示集，不能直接套用到当前模型 |
| R15 | [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)，OWASP GenAI Security Project；读取定义、间接注入、缓解措施与示例场景 | 网站、文件等外部内容中的指令可能改变模型行为；缓解包括最小权限、高风险动作人工批准、隔离并标识外部内容 | 适用于 Skill 读取 PR 评论、issue、网页、仓库文件的场景。原文承认没有万无一失的防护，本项目只要求识别和限制，不要求实现过滤系统 |
| R16 | [LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)，OWASP GenAI Security Project；读取定义、根因和前半部分缓解措施（页面截断） | 过度代理的根因是功能、权限或自主性超出所需；建议限制可调用扩展和功能、避免开放式扩展、高影响动作需独立确认 | 用于检查 Skill 是否把副作用限制在授权范围内。后半部分缓解措施未读取 |

第二轮访问限制：DORA 2025 完整报告和 DORA AI Capabilities Model 均为 PDF，fetch 工具不支持，只读取了公告博客；NIST SP 800-218 仅读取了 CSRC 摘要页，具体实践条目未核验，仍是候选；SWEBOK、SPACE 本轮未检索。R13、R14 只读摘要，不能引用其正文细节。

### 2.2 第三轮：模型厂商的 Skill 与提示工程指引（2026-11-01）

第三轮回答一个问题：模型能力在快速变化，厂商对“怎样写 Skill 和指令”的建议发生了什么变化，这些变化对审查有什么影响。只读取 Anthropic、OpenAI 官方文档和开放标准，不采用第三方博客的转述。厂商指引描述的是厂商自己的模型，结论只能作为审查线索，不自动成为本项目规则。

| 编号 | 来源与读取范围 | 原文支持的建议或观察 | 本项目适配与限制 |
|---|---|---|---|
| R17 | [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)，Anthropic Claude Platform Docs；读取全文 | 默认假设模型已经很聪明，只写它不知道的内容；按任务的脆弱程度选择高、中、低自由度；SKILL.md 正文建议少于 500 行，引用只保持一层深，长引用文件加目录；避免时效信息，术语一致；脆弱操作用脚本，脚本自己处理错误；先建评测再写正文，先测无 Skill 的基线，至少三个评测场景，并用所有目标模型测试；观察模型实际怎样浏览 Skill 文件 | 页面面向 Claude，但大部分原则与 R23–R25 一致。500 行和一层引用是厂商经验值，审查时用于发现风险，不作为硬门槛 |
| R18 | [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)，Anthropic；读取模型差异总表、上下文与动机、长程状态管理、自主与安全平衡、子代理编排、过度工程、只为通过测试、迁移注意事项 | 页面覆盖到 Claude Fable 5.1、Opus 5.5、Sonnet 5.5、Haiku 5.5 等当前模型。说明指令背后的原因有助于模型泛化；4.6 以后的模型对系统提示更敏感，为旧模型写的 “CRITICAL/MUST” 和“拿不准就用某工具”会导致过度触发；长任务用结构化状态文件、进度笔记和 git 记录状态；模型可能过度工程或只追求测试通过 | 只读了上述章节，未逐一读取 Sonnet 5.5、Haiku 5.5、Fable 5.1 的专页 |
| R19 | [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)，Anthropic；读取全文 | 模型会主动自我验证，提示中显式的验证步骤（包括“用子代理验证”）会造成过度验证，删除后质量不降；模型可能扩大任务范围；审查提示写“只报高严重度”会被字面执行而少报，建议先报全再单独过滤；委派子代理更积极，需要说明何时值得委派或设置确定性上限；要求输出推理过程的提示、Skill 或工具描述可能被拒绝 | 对 spec-code-review、spec-doc-review 的“只报高置信”类过滤指令和各 Skill 的验证步骤有直接影响 |
| R20 | [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)，Anthropic；读取全文 | 为旧模型写的 Skill 常常过于规定步骤，可能降低输出质量，建议审视并删除；长任务中要求模型按实际工具结果核对进度声明，在 Anthropic 测试中几乎消除了虚构状态报告；需要写明行为边界，防止未请求的动作；独立的新上下文验证者比自我批评效果好；显示剩余上下文计数会诱发提前交接或缩减工作；说明请求背后的原因 | 支持“减法”审查、进度声明取证、交接触发条件和独立复核。Fable 5 是最高能力档模型，其他档位模型可能仍需要更多指导（见 R17 多模型测试） |
| R21 | [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)，Anthropic；读取全文 | 无人值守运行中，以文本结束的回合是进度报告，不是任务完成；建议用清单跟踪未完成项，自动续跑两到三次后停止；用带随机 ID 的标签标记用户粘贴的外部文本以抵御间接注入；在多应用任务中先查阅相关来源再动手，同时把不可信内容挡在被搜索的记录之外；去掉“回答前认真思考”的指令可降低延迟且质量无明显下降，思考深度由 effort 参数控制 | 对 spec-lfg 的无人值守编排、spec-resolve-pr-feedback 的外部文本处理有直接影响 |
| R22 | [Using GPT-6](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)，OpenAI API Docs（URL 仍为 gpt-5p6，页面标题为 Using GPT-6）；读取模型族介绍、GPT-6 Astra 行为、Initiative and follow-through、Instruction following、Personality and writing style、Subagent delegation、Testing and verification，以及参数迁移的前半部分 | GPT-6 Astra 对 Skill 和 AGENTS.md 中的指令更敏感，官方建议审计模型能读到的 Skill 文件；Skill 中不清楚或互相冲突的指导可能让模型提前停住；建议明确用户指令优先于 Skill，并在 Skill 导致暂停或偏离时，让模型指出具体 SKILL.md 和引用的那条指令；模型更倾向于提问，建议先完成已授权的工作、把需要批准的事项做成具体可审的结果，可逆、只读操作不需要批准；小改动可能测试过度；可能委派过少 | OpenAI 对“偏向行动”的建议与本项目的副作用授权边界需要取舍：可逆、本地、只读的动作不应额外加审批，不可逆或外部动作仍需确认。后半部分迁移说明未读 |
| R23 | [Build skills](https://learn.chatgpt.com/docs/build-skills)，OpenAI（ChatGPT 与 Codex）；读取全文 | Skill 基于开放 Agent Skills 标准；Codex 初始技能列表默认最多占上下文窗口 2%，上下文未知时为 8,000 字符，Skill 多时先缩短描述，再省略部分 Skill；因此描述要把关键用途和触发词放在前面；`agents/openai.yaml` 可设置 `allow_implicit_invocation: false`，只允许显式调用；每个 Skill 只做一件事，除非需要确定性行为，否则优先用指令而非脚本 | 支持描述可发现性预算和内部辅助 Skill 的调用策略审查 |
| R24 | [skill-creator SKILL.md](https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/skill-creator/SKILL.md)，openai/codex 仓库 main 分支，访问日版本，未固定 commit；读取全文 | 假设模型已有能力，只写会改变其决策的内容；Skill 不得扩大任务、修改无关配置或暗示额外外部动作的授权；不要把个别例子、过去的失败或个人偏好变成通用规则；具体程度与风险匹配，只在正确性、安全、权限或真正脆弱的流程上使用固定步骤和绝对措辞；区分硬性要求与可选建议；不重复其他地方已强制的策略；测试应验证可观察行为，避免只匹配措辞、标题或正则；独立前向测试时不要把预期答案或已有结论交给评估者 | main 分支内容可能变化，正式引用前应重新读取并记录 commit |
| R25 | [Agent Skills Specification](https://agentskills.io/specification)，开放标准；读取全文 | name、description 必填，description 最多 1,024 字符；可选 `compatibility` 描述环境要求，`allowed-tools` 为实验字段；正文建议少于约 5,000 token、500 行；引用保持一层深 | 用于核对跨宿主可移植性。`allowed-tools` 各宿主支持不一，不能当作已强制的权限边界 |

### 2.3 第四轮：Skill 行为评测工具（2026-11-01）

第四轮回答：审查执行方案只用 `skill-up` 做行为评测和基线对照，是否有局限。

| 编号 | 来源与读取范围 | 原文支持的做法 | 本项目适配与限制 |
|---|---|---|---|
| R26 | [Improving skill-creator: Test, measure, and refine Agent Skills](https://claude.com/resources/articles/improving-skill-creator-test-measure-and-refine-agent-skills)，Anthropic；读取全文 | 把 Skill 分为提升能力型和记录流程偏好型：前者可能随模型变强而不再必要，评测能显示这一点；后者价值取决于对实际流程的忠实度。benchmark 模式记录通过率、耗时和 token；比较 agent 在不知道哪组是哪组的情况下做 A/B 评判；另有触发描述调优 | 支持按类型解读基线结果和盲评对比（执行方案 D5、D7）。skill-creator 本身是 Claude 生态工具，不替代 `skill-up` |
| R27 | [Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills)，OpenAI Developers；读取全文 | 先定义成功标准，分结果、过程、风格、效率四类；用 `codex exec --json` 的事件流做确定性检查（执行的命令、产生的文件），再用 `--output-schema` 做结构化 rubric 评分；10–20 条提示即可，须包含不该触发的反例 | 支持先审用例、补过程类检查和反例（执行方案 D6） |
| R28 | [Test Agent Skills](https://www.promptfoo.dev/docs/guides/test-agent-skills/)，promptfoo 文档；读取全文 | 同一套测试可运行 Claude Agent SDK、Codex SDK、OpenCode；`skill-used` / `not-skill-used` 断言验证路由；可断言执行轨迹，附带成本与延迟检查 | 作为 S20 路由评测的备选（执行方案 D5）。未在本机安装或试运行 |
| R29 | [Inspect SWE](https://meridianlabs-ai.github.io/inspect_swe/)，Meridian Labs；读取概览 | 在 Docker 沙箱中运行 Claude Code、Codex CLI、Gemini CLI、OpenCode 等，代理其模型调用，因此同一外壳可换模型，并提供 token、时间上限与 transcript | 可区分外壳差异与模型差异，暂缓采用；需要 Docker 与 API 密钥。未试运行 |
| R30 | [SkillsBench](https://arxiv.org/abs/2602.12670)，Li 等，arXiv v4 2026-06-14；仅读取摘要 | 87 个任务、18 种模型与外壳组合，有无 Skill 成对对比、确定性验证器判定；加 Skill 后平均通过率从 33.9% 提高到 50.5%；不超过三个模块的聚焦型 Skill 好于大而全的组合 | 支持成对对照加确定性判定的设计，也为需求第 3.9 节“增量知识”提供外部证据。任务不是研发链路，不能外推到本项目 |

另外了解了 [Harbor](https://github.com/harbor-framework/harbor)（Terminal-Bench 官方评测框架，容器内大规模并行运行各种 agent），规模超出本次需要，不采用，不作为依据。Coder Eval、Braintrust、LangSmith 未读取。

本机 `skill-up` 0.12.0 的能力依据是其附带说明（`~/.agents/skills/skill-upper/` 的 SKILL.md 与 references）：引擎支持 claude_code / codex / qodercli，`--baseline` 输出有无 Skill 两组到 `benchmark.json`，`environment.type` 支持 none / opensandbox / docker，判定支持 rule_based（含 `tool_called`、`tool_not_called_in_turn`）、script 与 agent_judge。以上为文档声明，未实际运行验证。

第三轮访问限制：未读取 Anthropic 研究文章 Equipping agents for the real world with Agent Skills、Fable 5.1 / Sonnet 5.5 / Haiku 5.5 专页、GPT-6 Astra 模型页，以及 arXiv 2607.25032（第三方研究）。R22 页面超出单次读取长度，参数迁移后半部分未读。第三方博客关于 Opus 5、Fable 5 的转述只用于定位官方页面，没有作为依据。

## 3. 当前源码的定向核对

以下只确认这些文本要求存在，未证明模型能稳定执行。正文与脚本的完整覆盖留待逐项审查。

| 本地来源 | 本轮读取的内容 | 对需求补充的影响 |
|---|---|---|
| `skills/spec-work/references/implementation-quality.md` | Current-Source Capability Inventory、Four-Posture Recheck 及职责边界 | 已有 reuse / extend / compose / new 判断；后续检查是否找对模块 owner、理解语义和合同，而不是再复制一套复用流程 |
| `skills/spec-work/references/feedback-and-tests.md` | Smallest Feedback Loop、Vertical Slices、Proof / Characterization、Test Design Quality、Risk-Triggered Proof、Scenario Completeness、System-Wide Check、Preserve proof through cleanup | 已有可观察反馈、行为断言、跨层验证与最终树复跑要求；应验证其充分性和上下游消费，不能只检查关键词 |
| `skills/spec-handoff/SKILL.md` | Create、Resume 与权限边界 | 已区分摘要、跨会话交接和当前任务继续；需要检验恢复后能否识别过期事实和遗漏的本地状态 |
| `skills/spec-compound/SKILL.md` | Preconditions And Mode | 已限制只沉淀已验证、不可轻易从代码恢复的经验；应区分完成总结、任务交接与长期知识 |

读取内容版本（记录的是本轮实际读取文件的当前内容，仍需在正式审查时重新核对）：

| 路径 | SHA-256 |
|---|---|
| `skills/spec-work/references/implementation-quality.md` | `408e18f00b691df6e9ecb75f64a44f342c3ec5b3541a78af14fc784800e6e45e` |
| `skills/spec-work/references/feedback-and-tests.md` | `71adda968968fcff7c10d3748dc2adcca8f36cca0d0787cdd4046158169f4b2a` |
| `skills/spec-handoff/SKILL.md` | `4bc4a2e1da3aa5caa1e547c9f9d59410099823fa315c77f56c8e71ac7a5b6d6c` |
| `skills/spec-compound/SKILL.md` | `02da78aefef12b96966fc4dd7e9fedd48d29ab5bbc9f03d57f1f6f6127852cca` |

### 3.1 第三轮的本地确定性事实（线索）

2026-11-01 在 commit `fe81bae9` 上用 shell 命令统计。此时 `skills/` 工作树含其他任务的未提交修改（`skills/_shared/`、`skills/autoresearch/` 等），以下数字未绑定内容 hash，只能作为审查线索，正式审查时必须重新取数并绑定版本。

| 事实 | 观察 | 对审查的提示 |
|---|---|---|
| SKILL.md 行数 | 20 个审查对象均少于 500 行，最长为 `spec-runtime-setup` 380 行、`spec-debug` 368 行、`spec-prd` 345 行 | 入口长度不是主要风险，重点看 references |
| references 体量 | `spec-plan` 的 references 下 Markdown 合计约 5,651 行，`spec-prd` 约 3,404 行，`spec-code-review` 约 3,335 行 | 需要判断其中多少是模型不知道的项目知识，多少是通用工程常识 |
| 嵌套引用 | `spec-plan` 有 11 个、`spec-work` 有 10 个、`spec-code-review` 有 7 个 reference 文件又引用其他 Markdown 文件 | R17 指出二级引用可能只被部分读取；需检查关键门禁是否放在二级以下 |
| 描述总长 | 38 个 source skill 的 description 行合计约 12,613 字符 | 超过 R23 所述 Codex 在上下文未知时的 8,000 字符初始列表预算；实际预算取决于模型上下文窗口，需在 Codex 中确认是否发生缩短或省略 |
| 强制措辞 | 英文 MUST/NEVER/ALWAYS/CRITICAL 在 SKILL.md 中很少（`spec-lfg` 4 处、`spec-plan` 1 处）；中文“必须/禁止/不得/严禁”在 `spec-runtime-setup` SKILL.md 中出现 49 次，`spec-prd` 7 次 | 计数不说明好坏，需逐条判断是否属于真正的硬约束 |
| 推理外显措辞 | 在 20 个对象的 SKILL.md 与 references 中未匹配到 “show reasoning”“think step by step”“<thinking>” 等英文表达 | 中文表达（例如“写出推理过程”）和 personas、模板中的“推理”字段未检查 |
| 内部辅助的调用策略 | `spec-commit`、`spec-commit-push-pr`、`spec-worktree` 源码中没有显式调用策略字段；在本次 Kiro 会话的技能列表中，三者带描述出现在可隐式选择的列表里 | 需检查宿主是否可能在没有调用方授权的情况下隐式选中这些内部辅助 |

## 4. 应转化为审查要求的关键判断

- 需求理解：区分业务意图、当前行为、期望增量和未知事项。源码说明系统如何运行，不能独自决定业务应该如何运行。（R1、R5）
- 拆分：按可验证结果和真实依赖拆分，避免仅按文件或技术层分工；允许必要的共享合同先行，但尽早形成贯穿调用链的反馈。（R1；本地 Work）
- 技术方案：先定位当前模块职责、数据流和消费者，再判断复用、扩展、组合或新建；同时检查接口、数据和部署版本共存的兼容风险。（R1、R2；本地 Work）
- 单测：从需求和不变量独立形成断言，避免 AI 将错误实现复制进预期结果；应能识别合理的错误实现，而非只让当前实现变绿。（R2、R3；本地 Work）
- 自测：从用户或调用者入口走真实链路，包括非 UI 服务、CLI、批处理和数据流程；与单测、集成测试按覆盖边界区分，不重复计数。（R2、R3；项目化推导）
- 修复：核验复现与因果链，修复后复跑原问题及相关回归；总结导致遗漏的系统条件，而非只记录改了哪行。（R2、R4；本地 Debug 定向线索）
- 总结与沉淀：当前任务报告说明已做、证据、限制和剩余事项；长期知识必须进一步证明可复用性、适用范围和失效条件。（R4；本地 Compound）
- 多对话交接：保留目标、决策理由、未解决问题和证据位置；下一会话核验当前状态，不能将上一会话的自然语言完成声明当事实。（R6；本地 Handoff）

第二轮补充的判断：

- 现有行为即事实合同：需求和方案要识别消费者实际依赖的可观察行为，而不只看文档承诺；“保持旧行为”还是“修正旧缺陷”要由业务 owner 决定，AI 不能自行选择。（R10、R1）
- 不兼容变更要按消费者情况排序：有外部或多个消费者时，按扩展、迁移、收缩拆分任务，每一步都可以单独发布和回退；只有单一内部调用者时直接修改。（R9）
- 决策要留下理由和后果：方案记录被否定的候选与负面后果，后来者据此判断旧决策是否仍成立；不强制固定文档格式。（R11）
- 测试强度要能被检验：覆盖率、测试数量和绿灯都不说明断言有效；高风险变更可以用变异测试或人工构造合理错误实现，确认测试会失败。测试本身也要被审查。（R12、R13、R2）
- AI 放大已有的工程体系：吞吐增加而测试与反馈不足时，稳定性会下降。Skill 的价值应体现在加强安全网，而不只是加快产出。（R8）
- 效能主张需要实测：资深开发者在熟悉的大型仓库中，自评提速与实测减速可以同时出现。Skill 的收益主张不能依赖模型或用户自评。（R7）
- AI 特有的安全风险：新依赖可能是不存在的幻觉包；PR 评论、issue、网页和仓库文件里的指令可能被误当授权；工具权限超出需要会放大错误后果。（R14、R15、R16）

第三轮补充的判断：

- 两家厂商的建议方向一致：模型能力越强，Skill 越应该只写模型不知道的内容（项目事实、不变量、边界、验证方法），通用工程方法和步骤化“教学”的价值在下降，甚至可能降低质量。（R17、R20、R24）
- 指令遵循更强、更字面。为旧模型写的强调措辞、反偷懒提示、显式验证步骤和“只报高严重度”类过滤，在新模型上会造成过度触发、过度验证、过度提问或少报。措辞错误和规则冲突的影响被放大。（R18、R19、R22）
- 自主运行时间更长，风险从“做不完”转向“越界、虚构进度、在不该停的地方停或在该停的地方不停”。边界、停止条件、进度取证和授权分级更重要。（R20、R21、R22）
- 子代理和自我验证正在成为模型和宿主的原生能力，但不同模型的倾向相反（Claude 新模型委派更积极，GPT-6 Astra 委派偏少）。Skill 应说明何时值得委派、何时需要独立验证，不应重建宿主已有的能力，也不应依赖某一模型的倾向。（R19、R20、R22）
- 模型更新很快（Opus 5 到 5.5、GPT-6 族都在一年内出现），Skill 必须能在多个模型和宿主上成立，并有重新评估的触发条件。厂商都要求用目标模型实测，并先测无 Skill 的基线。（R17、R22、R23）
- 可发现性受预算约束：Skill 数量增加时，宿主会缩短或省略描述。描述需要前置用途和触发词，内部辅助需要明确调用策略。（R23、R25）

## 5. 本轮完成边界

已完成四轮有界资料调研（R1–R30）、定向源码核对及审查需求补充。第二轮未重新核对本地源码；第三轮只采集了第 3.1 节的统计线索，未阅读 Skill 正文。第 3 节的 SHA-256 版本记录仍只对应第一轮读取。未完成 19 项逐项审查、全量引用阅读、真实宿主试验或企业任务效果评估。来源中的实践需要通过各 Skill 的具体场景验证后，才能形成能力结论。
