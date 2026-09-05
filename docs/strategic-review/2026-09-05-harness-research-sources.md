# AI Coding Harness 调研来源与证据边界

- 调研日期：2026-09-05，Asia/Shanghai。
- 用途：支撑[下一阶段能力战略建议](./2026-09-05-next-phase-capability-strategy.md)，不构成外部实验的独立复现。
- 证据类型：官方实践、论文结果、研究机构观察、项目源码分别记录；以下 23 项均在本轮实际读取原站正文或论文页面。
- 版本纪律：论文固定到实际读取的 arXiv 版本；持续更新的产品文档以读取日为准，未确认发布日期的不补写日期。
- 检索方式：Context7 定位官方资料，原站正文核实；通过 OpenAI 文档索引、Anthropic 工程目录、METR sitemap 与论文引用继续发现来源。Google 搜索页因 robots 限制未读取，未作为证据。
- 阅读深度：“正文重点章节”表示读取方法、结果或局限等相关章节，不表示逐页检查全部附录。未执行论文代码或重新运行付费模型实验。

## OpenAI 官方资料

### O1

**[Codex Best Practices](https://developers.openai.com/codex/learn/best-practices)**。持续更新文档；已读取正文。

- 核心事实：任务输入明确 Goal、Context、Constraints、Done when；AGENTS.md 保持短而准确；反复出现的工作形成 Skill；稳定后才自动化；给 Agent 测试、验证与审查能力。
- 对项目的含义：保持意图与验收连接；默认输入聚焦任务；以重复摩擦决定是否增加常驻指令。
- 边界：厂商实践建议，不证明所有项目均因增加 AGENTS.md 或 Skill 而提效。该 URL 的 `.md` 变体本轮返回 404，引用实际成功读取的 HTML 页面。

### O2

**[Codex as a Platform: Build on the Open Agent Harness](https://developers.openai.com/blog/codex-as-a-platform)**。官方工程文章；已读取 Markdown 正文。

- 核心事实：Codex harness 提供 agent loop、对话状态、流式事件、工具调用、sandbox 与 approval；`exec`、SDK、app-server 面向不同集成需求。
- 对项目的含义：spec-first 应拥有项目语境、工程契约、结果证据与长期知识；执行与会话基础设施优先复用宿主。
- 边界：文章中的产品案例与指标为厂商报告；本研究不将其视作 spec-first 的相对收益，也不据此要求改造为 app-server 应用。

### O3

**[Run Long Horizon Tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)**。官方实验文章；已读取正文。

- 核心事实：以 GPT-5.3-Codex 进行约 25 小时实验；作者强调外置 spec、plan、执行说明、状态记录以及里程碑验证，并明确结果并非 production-ready。
- 对项目的含义：长任务价值来自目标稳定、反馈、可恢复状态和可审阅结果；运行时长与代码量只是活动指标。
- 边界：单个设计工具实验；不能把 25 小时、约 13M token 或约 30k 行代码解释为真实团队吞吐提升。

### O4

**[Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills)**。官方方法文章；已读取正文重点章节。

- 核心事实：评测包含 outcome、process、style、efficiency；记录 trace 与 artifacts；用确定性检查和经过校准的 rubric；触发测试覆盖显式、隐式与负例。
- 对项目的含义：现有 Skill eval 是可复用基础，但应把执行后的正确结果、误触发成本与用户完成任务放在同一评测视野。
- 边界：10-20 个提示适合早期回归发现，不能据此宣称统计意义上的普遍收益。示例安装路径与命令不是本项目 source/runtime 的权威。

### O5

**[Shell + Skills + Compaction](https://developers.openai.com/blog/skills-shell-tips)**。官方工程文章；已读取正文重点章节。

- 核心事实：Skill 提供按需加载的过程知识；description、负例和内置模板影响触发；shell 执行动作，compaction 支持长运行；网络与工具权限需要受控。
- 对项目的含义：将场景模板放在 Skill 内部按需加载，减少常驻说明；技能与外部工具的组合保留精确授权边界。
- 边界：Glean 案例属于企业任务的局部厂商报告；不直接迁移其中的准确率或延迟收益。

### O6

**[Custom Instructions with AGENTS.md](https://developers.openai.com/codex/agent-configuration/agents-md)**。持续更新文档；已读取 Markdown 正文。

- 核心事实：全局与项目目录链共同组成指令输入；有 override、fallback 与字节预算；官方建议核实实际加载来源。
- 对项目的含义：对照实验必须记录实际加载的指令与配置；只不追加目标 Skill，不足以证明没有其他项目指导。
- 边界：这是 Codex 的加载语义，不能代替 Claude 的加载证据；本项目 Claude 基线疑点仍来自本地 runner 与原始输出。

## Anthropic 官方资料

### A1

**[Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)**。持续更新文档；已读取正文与 Markdown 重点章节。

- 核心事实：提供可执行验证；CLAUDE.md 保留 Agent 无法从代码推断的信息；条件知识放入 Skill；通过 hooks 与 sandbox 等机制减少依赖 prose 的约束；需要时引入新上下文审查。
- 对项目的含义：语言约定、脚本 gate、宿主实际强制能力要分开；不是所有任务都需要同样长的计划或审查流程。
- 边界：官方页面同时说明 Stop hook 在连续 8 次阻断后可被宿主结束机制覆盖；具体出口强度必须按版本核实，不能从“有 hook”外推为永不绕过。

### A2

**[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)**。2025-11-26，官方实验；已读取正文。

- 核心事实：initializer 与 coding 阶段、feature list、增量实现、进度记录、Git 和端到端验证，针对跨上下文失忆和过早宣布完成。
- 对项目的含义：结构化 handoff 与可执行验收有实际问题来源。
- 边界：全栈应用演示中的做法；不能照搬为所有任务强制 feature list、固定步骤或自动提交。

### A3

**[Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)**。2026-03-24，官方实验；已读取正文及结尾。

- 核心事实：planner、generator、evaluator 分工改善应用完整度；评估器仍需人工校准；升级模型后逐项移除 context reset、sprint 等结构，保留仍有价值的规划与评估。
- 成本证据：一个 Opus 4.5 示例中 solo 为 20 分钟/$9，完整 harness 为 6 小时/$200；质量与范围也不同，不能当作等范围效率比较。
- 对项目的含义：每个补偿机制都对应模型或环境的某个缺口，应随版本和任务变化重新消融；独立 QA 在能力边界之外更值得投入。
- 边界：有限应用实验和作者评估，不是多 Agent 的通用因果结论；“GAN-inspired”描述生成与评估分工，并非对模型进行 GAN 训练。

### A4

**[Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)**。2025-09-29，官方方法文章；已读取正文。

- 核心事实：追求最小充分的高信号上下文；即时检索、轻量路径引用、渐进披露、压缩与结构化笔记；过度具体的分支指令和过度空泛的提示均有成本。
- 对项目的含义：现有 context-bundle 与 summary-first 方向相符；下一步需要衡量检索是否改变决策、是否减少重建上下文的工作。
- 边界：不意味着始终少读文件、不需要索引，或对所有模型都采用相同压缩策略。

### A5

**[Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)**。2026-01-09，官方方法文章；已读取正文重点章节。

- 核心事实：transcript 与 environment outcome 分离；代码、模型与人工 grader 各自承担不同判断；关注多次运行稳定性、隔离、正负例与人工校准。
- 对项目的含义：必须同时检查最终仓库状态、业务行为与副作用，不能只检查是否输出入口名或完成声明。
- 边界：`pass@k` 关注至少成功一次，`pass^k` 关注全部成功；两者不能混报为同一种可靠性。

### A6

**[Quantifying Infrastructure Noise in Agentic Coding Evals](https://www.anthropic.com/engineering/infrastructure-noise)**。2026-02-05，官方实验；已读取正文。

- 核心事实：在其 Terminal-Bench 2.0 实验中，资源配置极端条件之间可产生 6 个百分点的差异；CPU、内存、并发与时间限制均可能影响评测。
- 对项目的含义：网关错误、未执行、任务失败应分别报告；比较实验固定配置，预先定义重试与缺失处理。
- 边界：6 个百分点是该实验的结果，不是所有 benchmark 的噪声常数，也不能成为忽略小收益的统一门槛。

## 论文

### P1

**[SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793v3)**。v3：2024-11-11；已读取摘要与版本信息。

- 结论：工具接口、文件编辑、导航与执行反馈会影响 Agent 表现。
- 用途：支持优先改善 Agent 可操作的环境与反馈，而不仅是增加文字指导。
- 局限：历史模型与 SWE-bench/HumanEvalFix 任务；不采用其旧排行榜数值比较当前宿主。

### P2

**[Agentless: Demystifying LLM-based Software Engineering Agents](https://arxiv.org/abs/2407.01489v2)**。v2：2024-10-29；已读取摘要与版本信息。

- 结论：在当时的 SWE-bench Lite 任务上，定位、修复、验证三阶段的简单方案是有竞争力的基线。
- 用途：复杂 agent 编排必须与简单可执行基线比较。
- 局限：不支持将所有工程工作硬编码成三阶段，也不支持“自主 Agent 无用”的结论。

### P3

**[Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988v2)**。v2：2026-06-23；已读取摘要、正文实验设计、结果与局限。

- 范围：SWE-bench Lite 300 个任务，加 CTXbench 12 个 Python 仓库的 138 个任务；四种模型/Agent 组合。
- 结论：上下文文件未普遍产生显著任务成功率提升，平均推理成本增加超过 20%；开发者文件比模型生成文件更好，但不等于比无文件显著更好。
- 重要细节：成本增加与指令驱动的额外探索、测试有关，不能单纯解释成“文本越长越差”；去掉其他文档后，上下文文件的作用发生变化。
- 用途：减少重复仓库概览，保留项目特有约束，按任务评测常驻指导。
- 局限：主要衡量 Python 任务解决率；安全、代码效率等不在该研究的完整评价范围。不能据此取消授权与可靠性边界。

### P4

**[SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks](https://arxiv.org/abs/2602.12670v4)**。v4：2026-06-14；已读取摘要、正文方法、结果与局限。

- 范围：87 个任务、8 个领域、18 个模型/harness 配置；固定任务上的 no-Skills 与 curated-Skills 对照。
- 结论：宏平均通过率由 33.9% 升至 50.5%，提高 16.6 个百分点；少量聚焦模块优于大而全的包；收益随任务和配置变化。
- 重要细节：论文构建流程筛掉了两组无可测差异的低信号任务；聚焦程度与收益的观察不是对任意模块数的随机因果实验。
- 用途：支持专业过程知识与可执行资源的价值试验，不支持以 Skill 数量衡量竞争力。
- 局限：筛选后的终端/container 任务，不代表所有用户任务的平均收益；缺少更强的等长上下文对照；自生成 Skill 的较弱结果混有内容、发现与执行干扰，不能简化为“AI 永远不能写 Skill”。

### P5

**[Towards a Science of Scaling Agent Systems](https://arxiv.org/abs/2512.08296v3)**。v3：2026-04-08；已读取摘要及正文相关实验说明。

- 范围：260 个配置、6 个 benchmark、5 类架构、3 个模型家族。
- 结论：可分解任务与顺序任务对多 Agent 的反应不同；协调有成本；单 Agent 基线越强，部分协调收益越小。
- 用途：按任务依赖、冲突面和独立信息收益决定是否并行，先比较单 Agent 与最小分工。
- 局限：跨域实验，非 spec-first 现场数据；论文预测模型的解释力有限，不能从一个分数硬编码是否派发 Agent。

### P6

**[Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models](https://arxiv.org/abs/2510.04618v3)**。v3：2026-03-29，页面标注 ICLR 2026；已读取摘要、方法与讨论/局限。

- 结论：增量条目更新、反思与整理可以减少反复整体压缩造成的知识丢失；在其 Agent 与金融任务上有改善。
- 用途：把经验更新做成有来源的局部变更，保留有效细节，评估后续任务复用。
- 局限：依赖 Reflector 的判断质量；效果不能直接外推为代码库长期学习收益；不复制其自动记忆写入与自评计数作为本项目知识真值。

### P7

**[Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089v2)**。v2：2025-07-25；已读取摘要与版本信息，并补读 M1 后续研究。

- 范围：16 名熟悉项目的开发者、246 个任务，2025 年初工具条件的随机对照研究。
- 结论：该条件下完成时间增加 19%，开发者主观上却估计提速。
- 用途：不能用“感觉更快”替代人工时间与完成结果度量。
- 局限：旧模型、特定熟练度与成熟仓库；不作为 2026 年工具减速的证据，必须结合 M1。

## 研究更新与业界实践

### M1

**[METR: Uplift Study Update](https://metr.org/blog/2026-02-24-uplift-update/)**。2026-02-24；已读取正文。

- 事实：后续 57 名开发者、143 个仓库、800 多个任务的数据受参与者选择、任务选择、报酬变化与并发计时影响。
- 作者判断：早期 2026 年可能比早期 2025 年更提效，但数据只能弱支持增益大小。
- 用途：固定任务收益与真实采用分开观测；记录退出、遗漏与并发人工时间，防止套用旧结论。

### M2

**[METR: Many SWE-bench-Passing PRs Would Not Be Merged](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)**。2026-03-10；已读取方法、结果与局限。

- 范围：4 名维护者、3 个仓库、296 个 AI PR，并用 47 个历史人类 PR 校准评审噪声。
- 结论：经校准，约一半测试通过的 AI PR 不会被维护者接受；展示了测试判分与真实接受之间的差距。
- 用途：将维护者接受、缺陷与审查成本纳入 spec-first 验证。
- 局限：主要是 2024-2025 年模型，Agent 没有按评审意见迭代的机会；不是当前所有 Agent 的拒绝率，也不是不能改进的能力上限。

### M3

**[METR: Task Substitution and AI Uplift](https://metr.org/blog/2026-05-08-task-substitution-and-uplift/)**。2026-05-08；已读取正文。

- 结论：旧任务提速、新任务提速、价值增长不是同一指标；在其简化假设下有次序关系，但现实可能不满足前提。
- 用途：既评估原有研发任务是否更高效，也单独确认新增工作是否有真实 consumer 和业务价值。
- 局限：经济分析与定义框架，不是 spec-first 提效比例的实验估计。

### I1

**[Cursor: Scaling Long-Running Autonomous Coding](https://cursor.com/blog/scaling-agents)**。厂商实验文章；已读取正文，未独立核验示例仓库。

- 事实：平权共享状态与锁曾形成瓶颈；planner/worker 分工有所改善；去掉部分 integrator 复杂性；部分大型迁移仍待仔细审查。
- 用途：并发数量不是吞吐；应观测锁、冲突、集成和审查瓶颈。
- 局限：大规模资源实验，成本与完整质量对照不足；代码量、周级运行和 CI 通过不证明生产级完整交付。

## 对项目证据的回源

| 编号 | 当前来源 | 本轮确认范围 | 不能支持的外推 |
| --- | --- | --- | --- |
| L1 | [角色契约](../10-prompt/结构化项目角色契约.md)、[演化方法论](../10-prompt/AI-Coding-Harness演化方法论.md) | 定位、使命、事实/判断/授权与演化边界 | 不证明价值已兑现 |
| L2 | [README](../../README.md)、[宿主注册](../../src/cli/adapters/index.js) | 使用链路与八宿主注册 | 不证明八宿主所有能力等价或均已实测 |
| L3 | [验证摘要源码](../../src/cli/helpers/verification-run-summary.js)、[收尾源码](../../src/cli/helpers/honest-closeout.js)及对应合同 | 结构一致性、路径与引用检查机制存在 | 不证明 recorder 拥有独立进程级观察或语义正确性 |
| L4 | [上下文包](../../src/cli/helpers/context-bundle.js)、[Knowledge Harness](../contracts/knowledge/knowledge-harness.md) | 路径/预算、召回与知识晋升边界存在 | 不证明知识复用提高真实任务收益 |
| L5 | [Skill 总结报告](../validation/skill-evals/2026-09-03-full-suite-summary.md)、[路由报告](../validation/skill-evals/2026-09-02-entry-routing-and-static-audit.md) | 既有评测报告与最新工作树记录 | 历史报告不等于当前 source 全量回归已通过 |
| L6 | [路由重判 JSON](../validation/skill-evals/routing-audit-20260902/rescored-20260905-baseline10.json) | 本轮重新汇总：Claude 220/220；Codex 184/186，有 34 次环境错误，`p-code-review` 无有效样本 | 数值基于既有重判标签，未独立重判 440 份原始输出；不能宣称 Codex 全类别覆盖 |
| L7 | [8 月行为门报告](../../benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md)、[runner](../../benchmarks/agentic/run.py)、[baseline 原始结果](../../benchmarks/agentic/runs/20260820-185556/safe-path__baseline__sonnet__0/_claude.json) | runner 保留项目配置、工作区位于仓库内且限制执行；一份 baseline 输出引用项目 Changelog 要求 | 不足以确认零项目指导隔离，不支持完整 harness 已无用；未复核全量实验与加载链 |
| L8 | [field protocol](../validation/ce-localization/field-validation/protocol.json)、[field results](../validation/ce-localization/field-validation/results.json)、[promotion ledger](../validation/ce-localization/knowledge-promotion/promotion-ledger.json) | 本轮读取的这条验证链仍为 not-run/空结果 | 不表示仓库中所有局部实测不存在 |
| L9 | [Pi 实测记录](../validation/2026-09-05-pi-host-live-verification.md) | skills 发现与 trust 验证记录；模型中介调用和 AGENTS 注入未 live | 不等于跨宿主完整业务旅程通过 |
| L10 | [8 月旧路线图](./2026-08-02-solution-roadmap.md) | 存在旧候选方案；当前 README 已有 quickstart | 不能重新把 quickstart 视为缺失，也不继承未重新验证的 30 分钟/5 分钟指标 |

本轮读取到的工作树 HEAD 为 `bb17c7e10f3423e278c2da322cedf9a536e11464`。路由相关资料、两个单测和 CHANGELOG 存在既有未提交变更，L5/L6 对应当前磁盘快照，不代表发布状态。
