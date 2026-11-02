# 22 项 Skill 业界实践对照终检

日期：2026-11-02。类型：公开来源核验 + 本地源码分析映射；不是模型行为评测。仅写此证据文件，不修改研究原文、主报告或被审对象。阅读了研究第 2.2 节 R17–R25 记录，并对 R17、R24、R25 重新取回原始页面；R2/R4/R6 复用本轮主审于 2026-11-01 的共享核验，明确区分来源。

## 核验结论与范围选择

可完成本次 22 项“至少一条已核验实践、适用条件、源码映射与采用建议”的有界对照；不能据此把未测 Skill 判为行为有效。无需重取全部 R17–R25：本轮判断依赖的是风险匹配、必要上下文、可观察验证与开放格式等稳定原则，三份现时原文已覆盖；R18–R22 的特定模型行为和 R23 的宿主预算数字只保留历史调研状态，不进入现时能力或缺陷结论。

| 来源 | 本次读取与现时支持 | 适用限制 |
|---|---|---|
| [R17 Anthropic Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | 2026-11-02 fetch 成功；分段读完工具返回正文（约 29,602 字符，含工具来源前缀）。Core principles 的 Concise is key / Set appropriate degrees of freedom / Test with all models；Skill structure 的描述与渐进披露；Evaluation and iteration 的无 Skill 基线、三场景、实际使用与独立实例；Advanced 的显式错误、可验证中间产物、运行环境与依赖。 | fetch 简化文本省略了部分网页示例代码，未把缺失示例算已读。500 行、一层引用是作者指引，不能只按超限判缺陷；页面列出的 Claude 环境限制不能外推本项目全部宿主。 |
| [R24 OpenAI skill-creator 源文](https://raw.githubusercontent.com/openai/codex/main/codex-rs/skills/src/assets/samples/skill-creator/SKILL.md) | 2026-11-02 fetch 成功，返回纯文本完整阅读。Core Principles 支持只写能改变决策的知识、保留用户范围、风险匹配、明确发现边界；Validate and Iterate 支持可观察行为而非措辞匹配；Independent Forward-Testing 支持不给评估者预期答案或旧结论。 | main 可变；查询 GitHub commits API 被 fetch 的 robots 检查拒绝（403），本次未取得 commit，不能写成 commit-pinned。返回正文从 `---` 起 SHA-256：`6656e54755638e8efcf275a472b9672eaa8a9a1b9e59dc210e275b03b59e1e66`，该摘要绑定返回文本，不替代原文件备份或 commit。 |
| [R25 Agent Skills Specification](https://agentskills.io/specification) | 2026-11-02 fetch 成功，工具返回全文已读。Frontmatter：name/description 必填，description 最多 1024 字符；compatibility 可选；allowed-tools experimental。Progressive disclosure / File references：按需读资源、正文建议 <5000 token / 500 行、一层引用。 | 开放格式不是语义质量证明；allowed-tools 明言宿主支持可变，不构成统一权限强制。网页示例代码有抽取缺失，结论只引用可见规范正文。 |
| [R2 Google code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html) | 本轮主审 2026-11-01 重读，证据在 `resume-core-analysis.md`“共享来源”；Design / Functionality / Tests / Context 支持系统融合、行为正确性、断言有效性与完整上下文。 | 本子任务没有再次 fetch，明确复用共享核验；不把 Google 审查组织模式或 Git 命令当通用规定。 |
| [R4 Google SRE Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) | 本轮主审 2026-11-01 重读，`resume-core-analysis.md` 与 `resume-knowledge.md` 可追溯；根因、影响、行动、审阅共享与按影响选择复盘。 | 不把事故复盘成本施加给每个小改动，不证明本项目已经改善故障率。 |
| [R6 Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 本轮主审 2026-11-01 fetch 并共享 Compaction / Structured note-taking 核验，见 `resume-knowledge.md` S14；支持持久笔记保留决定、未解决事项与下一步。 | 是 context 管理建议，不授权 handoff 内嵌命令，也不证明跨会话恢复成功率。 |

R24 的一个必要细化：当前 UI Metadata and Invocation Policy / Create or Update 明确默认允许自动发现；不能仅因为动作敏感或需要批准就推断 explicit-only，真正副作用前才管授权，既有调用策略应保留。项目已经明确的内部 helper 角色仍由项目合同约束；“所有敏感 Skill 都应禁隐式”不是该来源支持的建议。R17“一层引用”与 R24“从相关资源链接、按模式读取”也不完全一致，因此本次以关键引用是否可发现、必要阅读是否闭合判质量，不机械统一目录层级。

## 每项实践映射

以下源码路径均相对仓库根；详细读源记录、静态反例和适用前提沿用各组证据。外部原则用于比较已有方法，不作为凭空新增必备能力的理由。每一行至少有一条已现时核验或本轮共享核验的实践。

| 项目 | 核验实践与对应能力 | 本地映射与适用条件 | 采用建议及判断边界 |
|---|---|---|---|
| S00 spec-runtime-setup | R17 Advanced：显式错误、依赖就绪、可验证中间产物；R24 风险匹配 | `skills/spec-runtime-setup/SKILL.md`、mode-policy、facts、host-config；需要区分 read-only 与获授权安装 | 保留脚本处理确定性边界与失败降级；真实宿主未跑不提升就绪结论。见 S00 analysis 与 final-S00 两份补审。 |
| S01 spec-ideate | R24 开放任务给结果和决策依据，避免固定流程过度扩张 | `skills/spec-ideate/SKILL.md` 与 grounding/decomposition；问题尚需发散时 | 保留 grounded 机会与取舍；六视角是否值成本需要场景证据，不按厂商一句原则直接删除。见 resume-upstream。 |
| S02 spec-brainstorm | R24 Preserve user intent / Ask clarifying questions only when missing information matters | `skills/spec-brainstorm/SKILL.md`、synthesis-summary；WHAT 尚有实质缺口时 | 保留产品选择与理由；已授权、可推断事项的重复确认作待验证候选，不伪造用户批准。见 resume-upstream。 |
| S03 spec-prd | R17 可验证中间输出；R24 结构校验不证明决策充分性 | `skills/spec-prd/SKILL.md`、check/finalize 文档出口；generic/CLI/Mixed 覆盖 | 保留结构事实与语义 closure 分层，不能由 schema 绿灯声明所有 surface 的产品正确性。见 resume-upstream。 |
| S04 spec-plan | R17 按脆弱度选择自由度、先基线再补指导；R24 不以 Skill 增加授权 | `skills/spec-plan/references/intake.md`、synthesis-summary、planning-evidence-boundaries | 保留真实业务缺口澄清与 source refs；固定 WHAT 后检验不必要等待。历史产出损失不自动等于过度询问。见 resume-upstream 与 S04 analysis。 |
| S05 spec-write-tasks | R17 plan-validate-execute 的机器可验中间产物 | `skills/spec-write-tasks/SKILL.md`、`src/cli/task-pack.js`、Work intake consumer | 保留计划身份、任务依赖和消费者验证；脚本验证身份而非替模型拆任务。见 resume-upstream。 |
| S06 spec-work | R2 Design / Tests：符合系统、测试在错误实现上应失败 | `skills/spec-work/SKILL.md`、execute/validation 与 task intake | 保留原任务及集成证据；评价可运行结果，不以文件清单或测试数量替代。GLM 未触发的行为覆盖仍不足。见 resume-core-analysis。 |
| S07 spec-code-review | R2 Context / Tests / Complexity：看上下文、审测试、避免过度设计 | `skills/spec-code-review/SKILL.md`、intent/diff-scope/testing persona | 保留高可信发现与 coverage；漏报/过滤效果需要有区分力场景，不能由小 diff 饱和裁决精简。见 resume-core-analysis。 |
| S08 spec-compound | R4 原因、影响、预防行动、审阅共享 | `skills/spec-compound/SKILL.md`、grounding-validation/promotion | 仅在已验证解法可复用时沉淀，保留适用与失效条件；不把每个 bug 强制事故复盘。见 resume-knowledge。 |
| S09 spec-doc-review | R24 风险匹配、可观察验证、不扩用户范围 | `skills/spec-doc-review/SKILL.md`、walkthrough/bulk-preview/defer | 只读审查和写入分开；修改后重核影响、失败不计 applied，保持真实权限边界。见 resume-specialists。 |
| S10 spec-debug | R4 根因与预防行动；R2 测试有效性 | `skills/spec-debug/SKILL.md`、fix/verification | 保留原场景复跑与普通同根核查；深复盘按影响触发，不把“三处”解释成禁止同根修复。见 resume-core-analysis。 |
| S11 spec-test-browser | R17 运行环境不可假设；R24 真实可观察行为验证 | `skills/spec-test-browser/SKILL.md`、run-context/conformance scripts | 保留 exact-origin 实测准入与正/负对照；help 声明和 fixture 不证明真实浏览器隔离。见 resume-specialists。 |
| S12 spec-test-xcode | R2 Functionality / Tests；R17 测目标环境 | `skills/spec-test-xcode/SKILL.md` 的构建、运行与证据路径 | 保留真实 simulator/build 结果；未运行 Xcode 明说未测，不以 Markdown 代替平台能力。见 resume-specialists。 |
| S13 spec-resolve-pr-feedback | R2 Context / Tests；R24 用户范围与外部动作授权 | `skills/spec-resolve-pr-feedback/SKILL.md`、full-mode/pipeline-return | 评论只是待判断来源；修复须回源验证，未知外部写先读回；push endpoint 合同差距另测。见 resume-knowledge。 |
| S14 spec-handoff | R6 Compaction / Structured note-taking | `skills/spec-handoff/SKILL.md`、resume/create、handoff writer | 保留 pointer-first、freshness、剩余事项与限制；恢复上下文不等于执行授权。见 resume-knowledge。 |
| S15 spec-compound-refresh | R4 审阅共享与防复发行动；R24 不从单次失败推广通用规则 | `skills/spec-compound-refresh/SKILL.md`、维护分类与 promotion | 保留独有理由与已验证知识，unverifiable 不等于 false；评测需语义反例，不只 scope 词匹配。见 resume-knowledge。 |
| S16 spec-lfg | R17 复杂工作反馈循环；R24 重试与外部副作用停止条件 | `skills/spec-lfg/SKILL.md` 与 pipeline 出口 | 保留阶段证据与失败交还 owner，避免重复批准与静默外发；真实整链未跑。见 resume-specialists。 |
| S17 spec-commit | R24 风险匹配与用户范围；R17 脆弱操作精确指导 | `skills/spec-commit/SKILL.md` 精确暂存与默认分支规则 | 保留 Git 出口不变量，内部调用策略依项目合同；历史有提交请求不能重新定性越权。见 static-S16-S19、resume-specialists。 |
| S18 spec-commit-push-pr | R24 外部动作须有范围授权、结果要可观察 | `skills/spec-commit-push-pr/SKILL.md` 的 ref/endpoint 与 landing 证据 | 保留单一目标、明确 refspec、未知结果先核实；这些具体算法来自本地合同，不声称厂商直接规定。见 static-S16-S19。 |
| S19 spec-worktree | R24 独立测试隔离工作区、保护无关状态 | `skills/spec-worktree/SKILL.md`、worktree-manager.sh | 保留 checkout 身份、显式 env copy 与日志脱敏；平台行为需要平台验证，不从脚本可读推断 Windows 通过。见 resume-specialists。 |
| S20 using-spec-first | R17 描述用于发现与触发；R24 cheap and precise discovery；R25 元数据规范 | `skills/using-spec-first/SKILL.md`、public-route-map | 保留一个 owner 与活跃流程不重路由；触发质量需行为评测，不把描述长度当路由结果。见 S20 analysis。 |
| S21 spec-simplify-code | R2 Complexity / Tests；R24 避免只过测试、按风险验证 | `skills/spec-simplify-code/SKILL.md`、test-value/balance persona | 保留语义等价与 proof 保护；全项目验证成本是候选，缺基线不能直接删检查。见 resume-knowledge。 |

## 历史来源保留与不外推

R18–R22 仅沿用研究记录的 2026-11-01 阅读范围；本次没有重新确认其模型名、版本、参数或行为变化。不能据此宣称模型已内化方法、删验证不降质量、某模型天然委派过多/过少。R23 的 2% / 8000 字符预算、缩短与省略机制也没有本次新鲜验证，不用于断言当前 Codex 已截断本项目 Skill 列表。真正需要针对这些论断定稿实施时，应重取对应官方原文并绑定版本及本项目行为证据；这不阻塞上表基于已核验稳定原则的有界对照。

本次未新增模型调用，未运行测试，未安装工具；对公开文档的获取不产生模型有效性或真实企业研发收益证据。现时对照没有取消 S06/S07 行为补证，也不自动授权删减或重写任何 Skill。

## 本地共享证据版本绑定

摘要绑定本次引用内容，不替代各组的逐文件阅读清单；主报告未作为本表能力结论来源。

| 路径 | SHA-256 |
|---|---|
| `docs/project-reviews/2026-11-01-ai-assisted-brownfield-research.md` | `a0c3fe876bbdcf157097f8517e532a371dca80f483c71d15ab1f5865c4b1cf15` |
| `docs/project-reviews/evidence/resume-upstream.md` | `12fa3b18c3129216031ad7f7b04e4a3480dcf2f1c402a0fffdb3e2fa76f8f580` |
| `docs/project-reviews/evidence/resume-core-analysis.md` | `cccadd779b4dc11b89dd27c352de4f5b4ea9e3852ed9813bd65f8ecc4c61c18f` |
| `docs/project-reviews/evidence/resume-knowledge.md` | `7ec1235d28a230e7e2d20adff5102e5d277e01e36b50670c8099c01eb409d593` |
| `docs/project-reviews/evidence/resume-specialists.md` | `ff306fa16cfc50973603d71f2b8d72fb1926604a87e1f35b3bfc1d47d03938da` |
| `docs/project-reviews/evidence/static-S16-S19.md` | `e3844daae618ed13b9d4725ee5188ee50db22f314098bd448a713fbd47187b4a` |
| `docs/project-reviews/evidence/S00-spec-runtime-setup/analysis.md` | `3b778d3d670f3d76c8369831c1eda75c5d90756502c92cbd23a5a40dd11de23c` |
| `docs/project-reviews/evidence/S04-spec-plan/analysis.md` | `8a695f7ef2a769b14ff2f7af1e4ece1f764b7f9adac98196a0fae212affdad27` |
| `docs/project-reviews/evidence/S20-using-spec-first/analysis.md` | `09fd76b47116f6cd75744f2a57002fef51f1038e9e1ea560d6ea0d8972fe1155` |
