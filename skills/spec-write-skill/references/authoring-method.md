# Authoring Method

本 reference 是 `spec-write-skill` 的资格判断与写作方法边界：先确认是否值得写成 skill，再收敛意图、扫描可复用 pattern、识别反模式。`yao-meta-skill` 只作为来源背景；不要引入完整 SkillOps 平台、全量 IR、registry、reports 或 cross-packager。

## Contents

- §1 Qualification
- §2 Intent Dialogue
- §2.2 Evidence Matrix Readiness
- §2.5 Skill Creator Compatibility
- §3 Reference Scan
- §3.5 Branch And Pointer Design
- §4 Authoring Discipline
- §5 Anti-Pattern Families

## 1. Qualification

先判断是否值得写成 skill。至少满足一项，才继续进入 source authoring：

- 会被重复使用，且重复场景能被一句 recurring job 描述。
- 近邻请求容易误触发，需要可维护的 trigger/boundary contract。
- 确定性脚本、eval 或 package-local reference 能减少重复劳动。
- 双宿主、治理、可移植或 source/runtime 边界很重要。

以下请求默认不创建 skill：

- 一次性回答、一次性 prompt、单次文案或单次解释。
- 只要求解释、总结、翻译、整理当前材料含义。
- 只要求把内容导出为文档、README、报告、幻灯片或 release note。
- 只是在构思未来可能的 skill，明确说“不创建文件”或“先讨论”。
- 普通代码 review、debug、plan/work 执行、安装第三方 skill。

输出姿态：

- `do-not-create-skill`：明确不应写 skill，并说明更小的 durable surface 或直接回答方式。
- `near-neighbor`：推荐 `spec-skill-audit`、`spec-doc-review`、`spec-work` 等更合适入口。
- `authoring-brief`：只有重复任务、目标输出和排除边界足够清晰时才进入写作。

## 2. Intent Dialogue

用户目标模糊时，只问会改变 package 设计的 2-3 个问题。不要用长表单开场。

优先澄清：

- 这个 skill 要接住哪类重复工作？
- 用户实际会给它什么输入？
- 它完成后必须交回什么输出？
- 哪些近邻请求不应该触发？
- 更看重速度、一致性、审计性、可移植、治理，还是本地风格适配？

意图澄清完成后，应得到：

- one-sentence capability
- real inputs
- required outputs
- exclusions
- at least one should-trigger example prompt
- at least one near-neighbor or should-not-trigger example prompt
- suggested mode: `new-skill` / `revise-skill` / `migrate-skill` / `audit-remediation` / `package-readiness`
- quality tier: `scaffold` / `production` / `library` / `governed`
- first eval target

如果重复任务、目标输出或排除边界仍不清，不要用更多 references/scripts 弥补；继续问最小 follow-up。

## 2.2 Evidence Matrix Readiness

中型、高风险或不可逆 skill 改动先列轻量 Evidence Matrix，不新增 schema：`candidate`、`protected_behavior`、`evidence`、`implementation_permission`。只有 `implementation_permission: ready` 才删除承重文本、迁移 hard boundary 或重写 entry surface；`candidate` 只允许可逆补充，`blocked` 先补证据或降级为建议。

## 2.5 Skill Creator Compatibility

把官方 `skill-creator` 规则改写成 spec-first source 规则：

- skill 名称使用 kebab-case，目录名、frontmatter `name`、治理记录和 runtime catalog 必须一致。
- `SKILL.md` frontmatter 只放 `name` 和 `description`；触发条件必须写在 `description`，不要把 “when to use” 只放进正文。
- 不创建 README、安装指南、历史说明或空资源目录来显得完整；只有当前 recurring job 需要的 `references/`、`scripts/`、`assets/`、`evals/` 才进入 package。
- 在 spec-first repo 中新增 skill 时，source 位置是 `skills/<name>/`，不是默认写入个人 `$CODEX_HOME/skills`；全局安装只属于明确的分发/安装任务。
- `scripts/` 只承接确定性、重复、容易手写错的逻辑；新增脚本必须有实际运行证据。
- 复杂或高风险 skill 需要 forward-testing 时，只传 raw artifact 和用户形态请求，不泄漏预期答案、诊断或 intended fix。

## 3. Reference Scan

需要借鉴时，按顺序短扫：

1. external benchmark：公开高质量 skill、官方文档或已验证方法。
2. user source：用户给的历史 prompt、workflow、transcript、docs、notes。
3. local fit：当前仓库相邻 skill、治理记录、tests、runtime catalog。

只借鉴满足以下条件的 pattern：

- recurrence：能覆盖重复任务，不是一次性技巧。
- generativity：能帮助生成新的正确行为，而不是复制固定措辞。
- distinctiveness：与当前 skill 已有能力不同。
- boundary clarity：能减少误触发、越权或 source/runtime 混淆。

明确记录不借鉴什么：完整 SkillOps 平台、装饰性 reports、未请求 adapters、未验证 public claims、照搬外部 wording。

外部 benchmark 只能提供 pattern，不能直接提供 spec-first entry surface。迁移前先重判：

- invocation：它在原宿主里靠什么触发，spec-first 中应落到 `workflow_command`、`standalone_skill` 还是 `internal_only`。
- information hierarchy：哪些内容是所有 branch 必读，哪些只属于某个 branch，应下沉到 `references/`。
- steering：哪些 wording 真正改变触发、completion criterion、legwork 或 handoff。
- pruning：哪些句子只是解释背景、重复原文身份或模型默认行为。

如果 local fit 后只能保留外部措辞而不能产生新的 spec-first 行为，不要借鉴。

## 3.5 Branch And Pointer Design

写 source 前先列 branch，再分配资源。常见 branch 包括 `new-skill`、`revise-skill`、`migrate-skill`、`audit-remediation`、`package-readiness`；只有输入、步骤、输出或验证不同，才算真实 branch。

对每个 branch 判断：

- 必走步骤是否需要留在 `SKILL.md`。
- 条件细节是否可下沉到 `references/`。
- context pointer 是否说明“何时读取”和“读完用于什么判断”。
- must-have reference 是否被弱 pointer 隐藏；若是，先 sharpen wording，仍不可靠才 inline。
- 是否需要 eval 记录 positive、negative/near-neighbor、boundary、failure 或 expected behavior。

不要用“多建一个 reference”掩盖 branch 不清，也不要用“全部 inline”逃避 pointer wording 设计。

## 4. Authoring Discipline

每个新增指令、文件、脚本、eval 或治理规则，都必须追溯到用户真实 recurring job。

- 不基于猜测目标扩大 package。
- 不添加 speculative feature、通用配置旋钮或空目录。
- 改现有 skill 时只动直接服务本次目标的文件。
- 每个 meaningful change 绑定一种检查：route evidence、sample run、resource-boundary check、governance check、package smoke 或 reviewer note。
- 暂不可验证的想法进入 next-step candidate，不进 baseline。
- 改 prose 时做 sentence-level no-op pruning：逐句问它是否改变触发、读取、写入、判断、验证或 handoff；没有改变就删除，不优先润色。
- 写 completion criterion 时同时检查 clarity 和 demand；只有动作名、没有 done signal 的句子不算完成条件。

## 5. Anti-Pattern Families

本表是 eval 覆盖族清单：资格/边界类（`one-off-vs-reusable`、`explain-not-package`、`document-export-vs-agent-skill`、`future-outline-vs-build`、`audit-not-authoring`、`runtime-mirror-patch`）语义见 §1 Qualification 与 `evals/trigger-cases.json` 的 `reason_code`；写作质量类（弱 pointer、模糊 completion criterion、over-split、no-op）语义框架见 [Skill Quality Vocabulary](skill-quality-vocabulary.md)。维护 eval 时优先覆盖这些失败族：

- `one-off-vs-reusable`：把一次性回答误做成 skill package。
- `explain-not-package`：把解释/总结请求误当成 skill 创建。
- `document-export-vs-agent-skill`：把文档导出/整理误当成 agent skill。
- `future-outline-vs-build`：用户只要未来构思，却提前写 source。
- `audit-not-authoring`：只要审计 finding，却直接改 source。
- `runtime-mirror-patch`：把 generated runtime mirror 当 source 修。
- `weak-context-pointer`：must-have reference 被弱 pointer 隐藏，导致 agent 不稳定读取。
- `over-split-granularity`：没有独立触发或 sequence 风险，却为了模块化新增 skill。
- `vague-completion-criterion`：步骤只有动作名，没有清晰和有要求的完成条件。
- `leading-word-no-op`：把弱口号当 leading word，实际不改变行为。
