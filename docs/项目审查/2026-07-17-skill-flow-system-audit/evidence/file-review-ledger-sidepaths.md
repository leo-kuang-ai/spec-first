---
title: Skill 关系逐文件审查台账（分区 C）
date: 2026-07-17
status: complete-for-assigned-partition
scope: 13 个 governed Skill package 的 SKILL.md 与 references/**
review_mode: current-source-inline-full-read
claim_ceiling: source-declared relationship review
start_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
final_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
source_snapshot_stable: true
---

# Skill 关系逐文件审查台账（分区 C）

## 1. 审查边界与方法

- 本台账只审查 Skill 之间的 route、handoff、caller、consumer、artifact authority、failure/return/stop 与 internal-helper 关系；不做普通代码质量审查。
- 覆盖 13 个 package 下全部 SKILL.md 与 references/**，逐文件完整读取，不以 grep、CodeGraph 或摘要替代原文。CodeGraph 仅用于候选导航；所有判断均回到当前 source。
- 本分区未读取 generated runtime mirror，也未修改 Skill、CLI、contract、测试、现有审查报告或 CHANGELOG。
- 关系判断中的“对端待总账核验”表示本文件已确认 source 侧声明，但目标 Skill 的 intake/consumer 需由其他分区回源后才能升级为 observed。
- 当前文件集合在完成逐读后冻结：88 个文件、8784 行；manifest SHA-256 为 b3c28e16e57b36b6dd32b726145f0aed9fa11e9fb4fbb9eec319ed26ccbe1861。
- 跨分区收口修正：fresh-source 场景后完成 35/35 package dispatch-authority 对账；app-audit、explain、optimize、pov、riffrec、simplify-code、sweep 的 generic worker gate/fallback 缺口统一见 SF-27 与 [edge-ledger.md §9](edge-ledger.md)。本修正只补 authority 交叉裁决，不改变 88/88 逐文件分母与其他判定。

判断标签：

- 正确：本 package 内的 trigger、payload、authority、failure/stop 自洽。
- 正确（对端待总账核验）：source 侧关系清晰，但目标 Skill consumer 需跨分区确认。
- 候选 SP-Cxx：存在可能影响关联正确性的 current-source 证据，必须结合对端 source/contract 与反证后裁决。
- 无跨 Skill 关系：文件只承载本 Skill 内部格式、schema、persona 或工具规则。

## 2. 逐文件登记

### 2.1 spec-app-consistency-audit（6/6）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-app-consistency-audit/SKILL.md | App PRD、Figma、源码一致性静态审计入口与总合同。 | 近邻路由到 spec-code-review、spec-prd、spec-polish、spec-write-skill；from:code-review 表示 caller；可建议 spec-plan、spec-code-review、spec-polish、spec-compound，但禁止自动运行。 | 审计产物只提供静态证据；product source、runtime mirror、durable standards 不归本 Skill 修改；交给 code review 的 issue 必须带 code_review_handoff。 | mode 冲突、headless 缺 base、Figma 仅引用、输入不可读或证据不足时 fail/degrade；默认不启动 runtime；follow-up 只建议后返回。 | 正确（对端待总账核验）。近邻与权限边界明确，未隐式串联。关键行 19、41-43、75-81、95-99、109-117、199、213、273-277。 |
| skills/spec-app-consistency-audit/references/ecc-source-lock.json | 锁定 ECC 外部来源、吸收范围和被删除权限。 | 不形成公开 Skill route；约束 app-audit 内部 prompts，不把外部 agent 能力暴露成独立入口。 | ECC 仅为 skill-local read-only lens；明确移除 write、repair、build、cleanup、final verdict 等权限。 | 任一来源只可提供 checklist/lens；不能获得最终裁决或 mutation authority。 | 无跨 Skill route；authority 关系正确。关键行 8-26、41-49、63-72、84-94、187-194、217-232、244-267。 |
| skills/spec-app-consistency-audit/references/headless-runner.md | 说明 deterministic runner、artifact 生命周期与 issue_synthesis_status。 | parent caller 可在 raw issues staged 后消费；不直接调用其他 Skill。 | scripts/tests 是 runner 行为 source；latest-summary 只是 pointer；LLM/human 才提供语义 issue。 | unsupported mode、缺 base、issue status/input 不匹配与 subprocess 失败均返回具体 reason；失败仍尽量输出 envelope。 | 无新增跨 Skill edge；对 code-review caller 的返回事实保持低 authority。关键行 3-9、13-24、26-41、45-58、74-83、85-95。 |
| skills/spec-app-consistency-audit/references/mode-output-contract.md | 细化 mode、scope、Figma materialization、output 与 issue contract。 | mode:headless 明确服务 spec-code-review 等 parent workflow；from:code-review 要求 summary-first handoff。 | code_review_handoff 是送入 spec-code-review 的必需字段；app-audit 不产生 safe_auto；report-only 严格零写入。 | 多 mode、headless 无 diff scope、Figma 仅 reference、extractor 只能写文件等情况 fail/degrade；不远程抓取。 | 正确（对端待总账核验）。caller token、payload 与降级路径明确。关键行 12-25、38-51、88-95、124-126、155-157、181-202。 |
| skills/spec-app-consistency-audit/references/pilot-validation.md | v0.2 前人工 pilot 记录格式。 | 无 Skill route；结果供 app-audit readiness 决策，不触发下游。 | 人工确认后的 pilot facts 才有权进入 readiness；不是脚本生成真相。 | 缺 pilot 时 ready_for_v0_2 必须 false；readiness 不是中心状态机。 | 无跨 Skill 关系。关键行 3、12-19、50-58。 |
| skills/spec-app-consistency-audit/references/report-format.md | Report Writer 的报告章节合同。 | 报告可被人、code review 或 runtime validation planning 消费，但不声明自动 handoff。 | findings 必须携带证据字段；writeback 仅 preview；回归只给建议，不直接新增测试。 | no-evidence 不得写成通过；rule-pack-only issue 必须降级或拒绝。 | 无新增 edge；consumer-facing authority 正确。关键行 3-13、27-40。 |

### 2.2 spec-dogfood（3/3）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-dogfood/SKILL.md | diff-scoped、hands-off 浏览器 dogfood 编排器。 | 排除 spec-polish、spec-test-browser、spec-code-review、spec-plan；缺 browser 时回 spec-runtime-setup；隔离委托 spec-worktree；复杂根因交 spec-debug；提交交 spec-commit；学习交 spec-compound；larger fix 交 spec-work；报告供 code-review/PR 流程消费。 | dogfood report 是 resume source；worktree helper 拥有隔离 mechanics；debug 拥有复杂根因；compound 只接可复用学习。 | trunk 无 diff、dirty checkout、helper/server 不可用时停止；外部交互与产品/架构歧义进入 terminal blocked；所有场景必须 pass/fixed/skipped/blocked 才收敛。 | 候选 SP-C01：line 29 的“requested or appropriate”、line 74/210 的默认 commit step 可能把 dogfood invocation/修复授权等同 commit authorization。其余 helper 分工清晰。关键行 20、29、35-38、53、57-64、86-90、197、203-218、224。 |
| skills/spec-dogfood/references/dogfood-report-template.md | durable dogfood checkpoint 与最终报告 shape。 | Learnings 可喂给 spec-compound；其余无 Skill route。 | 报告是 resume source of truth，记录 flow、matrix、fix commit、human decisions 与 suite result；不替代测试本身。 | Pending/Blocked 状态防止伪完成；final status 必须带 suite 结果与 caveat。 | 正确；仅 spec-compound 是可选后续，不自动触发。关键行 3-6、31-39、41-49、65-77、79-81。 |
| skills/spec-dogfood/references/test-matrix-taxonomy.md | 从 diff/flow 生成浏览器测试矩阵的维度。 | 无跨 Skill edge；由 spec-dogfood 内部消费。 | 仅定义测试覆盖候选，不拥有 branch readiness verdict。 | 只选择与 diff 有关维度；完整 journey 而非孤立 widget。 | 无跨 Skill 关系。关键行 1-15、17-49、51-62。 |

### 2.3 spec-explain（9/9）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-explain/SKILL.md | 面向当前用户的 concept/diff/idea/recap 教学 artifact 编排。 | idea 不替代 spec-brainstorm/spec-ideate；改进发现经用户接受后可调用 spec-ideate、spec-simplify-code；spec-polish 只能提示用户自行运行；verdict 属于 spec-pov；repo memory 属于 spec-compound；Markdown 可发布到 spec-proof。 | explainer 只教人，不是 repo docs、verdict 或 durable knowledge；scout 只抽取，主会话负责解释与纠正；run-dir artifact 在 destination 前已存在。 | bare invocation 必问；empty recap 停止且不写 artifact；无外部工具则标记 unverified；无 subagent 时 inline；destination 失败保留 local path；用户拒绝 check-in 后不再追问。 | 正确。所有自动 Skill 调用都要求用户先接受，polish 的 user-invoked-only 边界也明确。关键行 17、25-30、36-38、57-63、66-72、80-94、96-101。 |
| skills/spec-explain/references/agents/repo-profiler.md | cache miss 时生成问题无关 repo profile 的 scout persona。 | 被 explain 及其他 repo-grounding Skill 的同构 cache flow 消费；本身不是 Skill route。 | 只产出 agnostic JSON，不含问题特定事实、solutions 枚举或子目录规则。 | 缺项用 null/empty；禁止扩展到 caller-specific evidence。 | 无公开 Skill edge；共享 persona 当前与 optimize/pov 副本字节一致。关键行 1-5、7-19、21-31。 |
| skills/spec-explain/references/agents/work-recap-scout.md | 抽取指定窗口的 git/PR/docs 证据。 | 仅返回 spec-explain orchestrator；无其他 Skill handoff。 | 只 extract/quote，不解释、排序或形成 verdict；evidence file 有 SHA/file refs。 | PR 接口不可用只记录 unavailable；空窗口返回空并停止。 | 无跨 Skill 关系。关键行 1-3、7-15、17-23。 |
| skills/spec-explain/references/check-in.md | active recall、predict-then-reveal 与 exercise stop contract。 | 无其他 Skill route。 | 用户 prediction 与 correction 留在 session，不写入 artifact。 | decline 终止本轮 check-in；diff reveal 必须等用户回答；exercise 数量完成后停止。 | 无跨 Skill 关系。关键行 3-11、13-20、22-33。 |
| skills/spec-explain/references/destinations.md | artifact surface、local、Proof、Thinkroom 的目标子流程。 | Markdown output 可调用 internal helper spec-proof；其他 destination 由可用能力决定。 | run-dir file 始终 canonical；发布是 re-emission/one-way copy，不反向改写源 artifact。 | publish/Thinkroom 失败回退 local；Proof 重试一次；未检测能力不展示。 | 正确。spec-proof 是由公开 Skill 有条件调用的 internal helper，且有明确 payload/fallback。关键行 3-16、18-26、28-30。 |
| skills/spec-explain/references/explainer-html.md | HTML artifact rendering contract。 | 无跨 Skill edge。 | 单文件、visible metadata、display-only；不是 plan artifact。 | post-compose audit 检查 external URL、metadata、visual prose equivalent 和 standalone open。 | 无跨 Skill 关系。关键行 3-11、13-25、27-36。 |
| skills/spec-explain/references/explainer-markdown.md | Markdown artifact rendering contract。 | output:md 使 artifact 可被 spec-proof destination 消费，但本文件不触发调用。 | frontmatter 是 metadata authority；repo-relative refs；display-only。 | 不允许 HTML、交互式 quiz；内容仍需 prose equivalent。 | 正确；仅提供可消费格式。关键行 3-10、12-30。 |
| skills/spec-explain/references/intake.md | concept/diff/idea/recap 分类与 token 冲突规则。 | 只决定 spec-explain 内部分支；idea 与 diff 边界不调用其他 Skill。 | explicit token 高于 inference；不把 topic 自动变为 diff。 | diff 与 since 冲突时询问；未知 output 降级为 HTML；无法解析 change 则 concept。 | 无跨 Skill edge。关键行 3-18、20-31。 |
| skills/spec-explain/references/repo-profile-cache.md | 三个 repo-grounding Skill 共用的 cache contract。 | explain/optimize/pov 各自消费本地副本；不是跨 Skill runtime import。 | cache 只保存 agnostic facts；question-specific、solutions 与 area instructions 必须 fresh；cache 是优化非正确性依赖。 | HIT/MISS/NO-CACHE；helper 调用失败按 NO-CACHE inline derive；dirty input 使 cache invalid。 | 正确。三份 cache 与 repo-profiler 当前 SHA-256 完全一致，并由 parity test 约束。关键行 3-5、17-23、25-55、57-63。 |

### 2.4 spec-optimize（12/12）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-optimize/SKILL.md | 度量驱动的 bounded experiment loop。 | 缺 metric 时可路由 plan/work/debug；结果声明由 spec-work、reviewers、人消费；收尾可执行 spec-code-review、spec-compound，或由用户选择 Create PR/继续。 | approved spec + measured results 决定 winner；experiment log 是单机 resume source；scout/provider facts 仅诊断；review report-only，修复由 optimize caller 自己筛选执行。 | admission/budget/baseline gates；dispatch 不可用声称 serial fallback；每实验写后验证；budget/plateau/target/manual stop 收敛；错误实验记录后继续。 | 候选 SP-C04：line 43 声明 spec-work 为 downstream consumer，但 Phase 4 没有明确 spec-work trigger、payload 或 failure return，关系可能只是泛化 consumer。spec-code-review/compound 的用户选择与 caller-owned fix 边界正确。关键行 19-43、87-115、121-180、193-220、278-300、414-434、514-590、652-680、720-744。 |
| skills/spec-optimize/references/agents/learnings-researcher.md | 从 docs/solutions 等知识库筛选适用历史学习。 | 隐式消费 spec-compound/其他知识 producer 产物；输出回 optimize，不自动调用 compound-refresh。 | 过去 learning 是 candidate；与当前 source 冲突必须显式标记，不能覆盖 current evidence。 | 无匹配返回明确 absence；先检索再完整读 shortlist；最多 5 项。 | 正确。知识消费 authority 受限，未形成自动 knowledge loop。关键行 1-16、18-28、60-68、151-168、216-247。 |
| skills/spec-optimize/references/agents/repo-profiler.md | cache miss 的 agnostic repo profile persona。 | 被 optimize cache flow 消费；与 explain/pov 同构。 | 只产 agnostic JSON。 | 缺项为空，不做 question-specific research。 | 无公开 Skill edge；副本字节一致。关键行 1-5、7-19、21-31。 |
| skills/spec-optimize/references/agents/repo-research-analyst.md | 大/陌生 scope 的可选 repo research persona。 | optimize 可选 dispatch；输出只回 optimize hypothesis generation。 | cached profile 提供 agnostic grounding；persona 只补 patterns/issues/templates 等 caller-specific evidence。 | scoped invocation 只运行指定 phase；无 cached profile 时才做最小 baseline；只返回会改变 plan 的 findings。 | 无其他 Skill route。关键行 5-31、37-47、70-89、135-147、177-193、239-257。 |
| skills/spec-optimize/references/example-hard-spec.yaml | objective metric 的 first-run spec 示例。 | 无跨 Skill edge。 | measurement command、mutable/immutable scope 和 budget 是 run authority。 | serial、1 并发、4 iterations、1 hour、degenerate gates 限制 run。 | 无跨 Skill 关系。关键行 7-18、23-45、51-64。 |
| skills/spec-optimize/references/example-judge-spec.yaml | qualitative metric 的 judge spec 示例。 | 无跨 Skill edge。 | rubric/scoring/cost cap 决定 judge authority，不由 experiment worker 修改。 | gates 先行、judge cost cap 5、serial first-run。 | 无跨 Skill 关系。关键行 7-40、42-59、65-78。 |
| skills/spec-optimize/references/experiment-log-schema.yaml | experiment durable state 与 outcome transition schema。 | spec-optimize orchestrator/worker/result consumer 共用；不对其他 Skill 暴露控制权。 | log 是单机 run state authority；只有 kept/runner_up_kept 对应 optimization branch commit。 | measured 是唯一非终态；error/timeout/degenerate/reverted 等终态；deferred 在 wrap-up 回用户。 | 无新增 Skill edge；state/commit authority 清晰。关键行 1-22、28-115、121-158、203-217、223-257。 |
| skills/spec-optimize/references/experiment-prompt-template.md | 单实验 worker handoff payload。 | orchestrator → generic worker，不是 Skill 调用。 | worker 只能改 mutable scope；不测量、不 commit；orchestrator 拥有 measurement/selection/integration。 | 需要未批准依赖时停止；越 immutable/out-of-scope 禁止。 | 无跨 Skill route；worker authority 正确。关键行 3、10-13、26-45、53-64、69-89。 |
| skills/spec-optimize/references/judge-prompt-template.md | batched LLM judge output contract。 | orchestrator → judge subagent；无 Skill handoff。 | rubric 与 immutable harness 决定评分字段；judge 只返回 JSON，orchestrator 聚合。 | every item required；ambiguous 必须标记；无 prose。 | 无跨 Skill 关系。关键行 3-10、16-50、53-91、94-110。 |
| skills/spec-optimize/references/optimize-spec-schema.yaml | optimization spec canonical schema 与 validation rules。 | spec-optimize 唯一直接 consumer；不路由其他 Skill。 | spec fields 拥有 metric、scope、budget、backend 选择；user approval 才能放宽高 throughput/uncapped spend。 | 无 degenerate gate、measurement、scope 或 finite stopping 则 invalid；高风险设置需明确批准。 | 无跨 Skill 关系。关键行 1-8、14-176、178-253、259-371、377-394。 |
| skills/spec-optimize/references/repo-profile-cache.md | optimize 使用的共享 agnostic profile cache。 | 与 explain/pov 副本同构；不进行跨 package import。 | cache 非 correctness authority；question-specific 必须 fresh。 | HIT/MISS/NO-CACHE，失败 inline derive。 | 正确；三份副本当前 hash 相同且有 parity test。关键行 3-5、17-23、25-55、57-63。 |
| skills/spec-optimize/references/usage-guide.md | 面向用户的使用边界与 kickoff 示例。 | ordinary obvious work 不应进入 optimize；未直接命名替代 Skill。 | guide 只解释意图，真正 run authority 仍在 spec/schema。 | 无 repeatable harness、假搜索空间或成本过高时不使用。 | 无新增 edge；与 SKILL admission 一致。关键行 3-11、13-45、47-75、77-127。 |

### 2.5 spec-polish（12/12）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-polish/SKILL.md | 用户协作式 dev-server + browser UI/UX polish loop。 | agent-browser 缺失时回 spec-runtime-setup；deeper implementation 声称交给 spec-work；release/review 消费 branch changes；未委托 spec-worktree，而是自行 probe/check out branch。 | 用户反馈拥有 polish 目标；source edits 属于当前 branch；browser helper 只提供观察，不决定产品方向。 | main/master、server/port/browser 失败或反馈需要上游产品决策时停止/询问；用户说 done 时结束。 | 候选 SP-C01：line 24、27、114 把“用户说 done”直接映射为 commit，未单独确认 commit authorization。候选 SP-C02：line 40 自行 checkout，仅“probe worktree”，与 dogfood 明确委托 spec-worktree 的 owner 模式不一致。关键行 14-36、38-43、94-114。 |
| skills/spec-polish/references/dev-server-astro.md | Astro detection/start/port/stub recipe。 | 仅被 spec-polish project-type route 消费。 | package manager/port 来自 project files；不拥有跨 Skill authority。 | 无 config 时用 defaults；常见 gotcha 只影响 start/probe。 | 无跨 Skill 关系。关键行 1-9、10-34、36-58。 |
| skills/spec-polish/references/dev-server-detection.md | dev-server port deterministic probe order。 | 提及 spec-test-browser 使用同一“不 grep instruction files”原则，但无调用。 | config/.env/project scripts 是 port facts；自然语言 instruction 只在已加载且明确时 advisory。 | 每层无命中进入下一层，最终 framework default。 | 正确；与 spec-test-browser 是共享约定，不是 handoff。关键行 3-16、18-30、32-40。 |
| skills/spec-polish/references/dev-server-next.md | Next.js start/port/stub recipe。 | 仅由 polish 内部 route 消费。 | lockfile/package scripts 决定 command。 | monorepo 需 launch cwd；env 自动加载。 | 无跨 Skill关系。关键行 1-34、36-60。 |
| skills/spec-polish/references/dev-server-nuxt.md | Nuxt start/port/stub recipe。 | 仅由 polish 内部 route 消费。 | config/lockfile 决定 command/port。 | port auto-increment 等 gotcha 由 polish reclaim/probe 处理。 | 无跨 Skill 关系。关键行 1-34、36-58。 |
| skills/spec-polish/references/dev-server-procfile.md | Procfile/Overmind/Foreman recipe。 | 仅由 polish 内部 route 消费。 | Procfile.dev web line 是 start/port authority。 | overmind/foreman 都缺失则询问用户；多 web process 要用户写 launch config。 | 无跨 Skill 关系。关键行 1-24、26-35、37-59。 |
| skills/spec-polish/references/dev-server-rails.md | Rails/bin-dev recipe。 | 仅由 polish 内部 route 消费。 | bin/dev、Procfile.dev、puma/env 决定 command/port。 | Bundler、SSL、overmind gotcha 可降级为人工 URL/start 指示。 | 无跨 Skill 关系。关键行 1-26、28-52。 |
| skills/spec-polish/references/dev-server-remix.md | Classic Remix recipe 与 Vite 边界。 | 仅由 polish 内部 route 消费。 | remix/vite config 决定类型与端口。 | v1 watcher 无 server、Vite mode 改走 vite recipe。 | 无跨 Skill 关系。关键行 1-34、36-58。 |
| skills/spec-polish/references/dev-server-sveltekit.md | SvelteKit/Vite recipe。 | 仅由 polish 内部 route 消费。 | svelte config 比 generic Vite signal 优先。 | adapter 不影响 dev；按 Vite port/probe 降级。 | 无跨 Skill 关系。关键行 1-34、36-58。 |
| skills/spec-polish/references/dev-server-vite.md | Generic Vite recipe。 | 仅由 polish 内部 route 消费。 | vite config、package script、env 决定 command/port。 | strictPort/HMR/devcontainer gotcha 通过 probe 或 launch config 处理。 | 无跨 Skill 关系。关键行 1-27、29-48。 |
| skills/spec-polish/references/ide-detection.md | IDE browser handoff capability detection。 | 无 Skill route；把 URL 交给 IDE/user。 | env signal 只决定 convenience handoff，不证明 IDE/browser readiness。 | 检测失败永不 fatal，打印 URL 后继续。 | 无跨 Skill 关系。关键行 3-14、16-29、31-47。 |
| skills/spec-polish/references/launch-json-schema.md | .claude/launch.json subset 与 stubs。 | spec-polish 是 consumer；无其他 Skill handoff。 | user-authored launch config 优先于 auto-detect；文件只描述 dev server。 | multiple config 需按 name 选择；缺字段回 auto-detect/ask。 | 无跨 Skill edge。关键行 1-36、166-177。 |

### 2.6 spec-pov（11/11）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-pov/SKILL.md | 对外部候选给出 project-grounded、two-floor 的 graded verdict。 | open field/criteria 不明路由 spec-ideate/spec-brainstorm；Adopt → spec-plan 或 brainstorm；Trial → spec-work；Hold/Reject 无 handoff；用户选择后可调用 computed next skill；decision history 可调用 spec-compound mode:headless；full report 可经 spec-proof 发布。 | project facts 与 verified external facts 分桶；conversation claims 不算 grounding；scouts 只收集，主会话裁决。 | 任一 floor 失败返回 Hold subtype；warm invocation 只 guest verdict 后归还控制；缺 capability 降低/阻断外部 floor，不得编造。 | 正确（对端待总账核验）。主要 handoff 有 grade、条件和 verified facts，而非裸路径。候选 SP-C03 见 boundaries 的 neutral explainer 路由。关键行 15-17、37-52、54-89、95-121。 |
| skills/spec-pov/references/agents/external-evidence-researcher.md | 外部证据抓取与 entailment 检查 persona。 | 结果只回 spec-pov；无 Skill route。 | verified URL/date 才能进入 external floor；researcher 不推荐。 | search/fetch 均不可用时精确返回 unavailable 并停止。 | 无跨 Skill 关系。关键行 3-7、9-24。 |
| skills/spec-pov/references/agents/precedent-activity-scout.md | 本地 decision record + tracker/PR precedent 抽取。 | 隐式消费 spec-compound 等写入 docs/solutions 的 decision records；返回 pov。 | issue claim 是 reported signal；local docs/PR prose 提供 precedent，不形成 verdict。 | tracker 不可用只跳过对应部分；local-doc pass 始终执行；约 15 reads。 | 正确。知识消费不会把历史声称升级为当前事实。关键行 3-15、17-21。 |
| skills/spec-pov/references/agents/project-grounding-scout.md | incumbent/absence、touchpoint、fit 与 pain 的 project floor 证据。 | 结果只回 spec-pov。 | manifest/call-site/current source 证明 project fact；scout 不推荐。 | net-new 不能因空结果直接 Hold，需记录检索范围 + integration point；证据薄则少写。 | 无跨 Skill route；authority 正确。关键行 3-19、21-32。 |
| skills/spec-pov/references/agents/repo-profiler.md | cache miss 的 agnostic repo profile persona。 | pov cache consumer；与 explain/optimize 同构。 | 只存 project-wide agnostic facts。 | 缺项为空；禁止 topic-specific evidence。 | 无公开 Skill edge；副本字节一致。关键行 1-5、7-19、21-31。 |
| skills/spec-pov/references/boundaries.md | POV near-neighbor route map 与 selection escape hatch。 | options → spec-ideate；chosen idea scope → spec-brainstorm；build → spec-plan；actual failure → spec-debug；company direction → spec-strategy；unbounded selection 可回 ideate/brainstorm 后 rerun pov。neutral explainer 当前写 general research/direct。 | POV 只拥有 external-input verdict，不拥有 options、requirements、implementation 或 diagnosis。 | field 无法 bounded/criteria 不清时 Hold 并 route out；无 local material 时停止索要 context。 | 候选 SP-C03：line 13 把 neutral explainer 路由到 generic research/direct，而现有 spec-explain 明确拥有 neutral teaching；可能造成 reverse-route 不对称。反证：若用户只要轻量事实，Direct Lane 比制作 explainer artifact 更合适。关键行 3-18、20-33。 |
| skills/spec-pov/references/intake.md | subject/intent frame gate。 | explainer intent 退出 POV；未直接指定 spec-explain。 | orientation 不是 grounding；frame 只决定 scouts 问什么。 | 最多一个澄清问题；bare link 不可 fetch 时问用户；explainer 不强造 verdict。 | 与 SP-C03 同一候选；其余 route guard 正确。关键行 3-15、17-35、37-39。 |
| skills/spec-pov/references/invocation.md | warm/cold provenance 与 guest-output contract。 | warm POV 完成后 hand control back，不推下游 Skill/capture。 | conversation 只提供问题和 hypotheses，不满足 project/external floor。 | ambiguous warm 进 frame gate；完成 verdict 后停止。 | 正确，防止 warm invocation 劫持主 workflow。关键行 3-23、25-42。 |
| skills/spec-pov/references/method.md | two-floor gate、grade vocabulary 与 verdict schema。 | Handoff 字段必须给 recommended next skill，但具体选择由 SKILL Phase 4 计算。 | verified project/external facts分别拥有 floor；conversation claims 不计。 | floor fail 只能 Hold；Tier 1/2/3 控制工作量；Reject/Not-our-problem 是终态。 | 正确。Handoff 是建议，不自动授予下一 Skill 的 mutation authority。关键行 3-24、26-44、46-53。 |
| skills/spec-pov/references/repo-profile-cache.md | pov 使用的共享 agnostic profile cache。 | 与 explain/optimize 同构；无跨 package runtime import。 | cache 不是 verdict evidence；touchpoint/prior decision 等必须 fresh。 | cache failure inline derive；dirty profile input invalidates。 | 正确；当前三份副本一致且 parity test 存在。关键行 3-5、17-23、25-63。 |
| skills/spec-pov/references/report.md | opt-in full write-up 与 share 路径。 | Markdown/throwaway copy 可交 internal spec-proof；Markdown report 也可作为 brainstorm/plan 输入。 | compact verdict 是默认 deliverable；report 只是扩展展示，dossier 仍不直接粘贴。 | publishing 不可用时 local file 为终态。 | 正确。spec-proof 仅有用户 opt-in report 后调用。关键行 3-20、22-28。 |

### 2.7 spec-product-pulse（3/3）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-product-pulse/SKILL.md | 按窗口读取产品 signals 并生成单页 pulse report。 | 消费 spec-strategy 产生的 STRATEGY.md seed；缺 strategy 时提示可先跑 spec-strategy；source connector setup 只建议独立 MCP/connector flow；scheduling 交 host primitive，不 inline。 | STRATEGY.md 拥有 key metrics；config.local 拥有机器本地 source mapping；外部 sources 只读；report 不拥有阈值/alert 真相。 | first-run config 缺失进 interview；invalid window 询问；DB 必须 read-only；schedule 必须确认；不自动改变产品或外部系统。 | 正确。spec-strategy → pulse 是只读 artifact consumption，不反向修改 strategy。关键行 17-25、39-47、51-80、84-116、118-166、168-178。 |
| skills/spec-product-pulse/references/interview.md | first-run SMART metric、source mapping、read-only DB 与 schedule 配置。 | 读取 strategy seeds；MCP 发现/连接是独立 flow；schedule 交可用 primitive。 | 用户决定 canonical source per metric；STRATEGY.md 继续拥有 metric 名单；config 仅保存 local routing，不存 credentials。 | 一轮 pushback 后 needs-review；未 instrumented metric 必须 pending 或 excluded；read-write DB 必须拒绝；无 schedule 可正常结束。 | 正确。没有把 setup/tool availability 提升为产品 metric authority。关键行 3-20、35-88、92-167、171-221、225-260。 |
| skills/spec-product-pulse/references/report-template.md | pulse report literal shape 与 strategy metric source resolution。 | 由 product-pulse 消费；无后续 Skill route。 | current/prior source numbers决定内容；无 data 必须明确标记；不设置阈值。 | source 缺失删除对应行/section；post-write checklist 后返回 headlines/path。 | 无跨 Skill edge。关键行 3-19、21-65、67-88。 |

### 2.8 spec-promote（2/2）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-promote/SKILL.md | 从 shipped context 生成 launch/promotion drafts。 | 无 spec workflow 自动 handoff；可选 Spiral CLI 是外部 enhancement。 | user description 优先，其次 PR/diff/changelog/commits；输出只是 draft，绝不 post/publish/schedule/commit/PR。 | 无法确认 shipped 内容时问一个问题；Spiral absent/unauthed/error 均 fallback direct drafting，始终产出 drafts。 | 正确。Skill 关联面保持 terminal draft，不越权进入发布/提交。关键行 10-16、27-40、42-68、70-93、118-129。 |
| skills/spec-promote/references/spiral-cli.md | Spiral detect/login/opt-out/write/fallback 细则。 | 提到 spec-first setup 作为共享 gitignore canonical setup，但不调用其他 Skill。 | Spiral 仅提供 voice-matched drafts；local opt-out 是机器本地 convenience；用户/API key 不进入 agent。 | setup decline 记 opt-out；login/install 失败不记 opt-out并 fallback；write 非 JSON/空 draft 静默 direct drafting。 | 无跨 Skill route；外部 capability 失败不会阻断主 Skill。关键行 3-18、20-72、74-109、111-147。 |

### 2.9 spec-riffrec-feedback-analysis（5/5）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-riffrec-feedback-analysis/SKILL.md | Riffrec/音视频/笔记 feedback 的 setup、quick、extensive 路由。 | extensive 条件下进入 spec-brainstorm；quick 结束为 bug report；setup 只说明安装。 | raw/media local-only；text artifacts 可在脱敏后持久化；requirements kickoff 只是 brainstorm input，不是 confirmed product contract。 | ambiguous 先看时长/event count，再问；quick 不污染 repo；extensive 用户只要提取/分析时可终止自动 brainstorm。 | 正确（对端待总账核验）。extensive handoff 有明确 payload、原始 manifest、确认问题与例外。关键行 8-18、20-37。 |
| skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md | 多问题录制的完整 artifact set、source mapping 与 brainstorm handoff。 | analyzer → requirements-kickoff/source-materials → spec-brainstorm；brainstorm 首问用户确认，之后才可进入 planning。 | observed/inferred/requirements 分离；source mapping 仅 suspected surface；spec-brainstorm 产出 durable requirements-only plan。 | 用户明确只要 artifacts 可在分析后停；无法 mapping 保留 unknown；不丢低优先级 signal。 | 正确。自动 handoff 由 extensive intent 触发且在 brainstorm 内恢复用户确认，不把 analyzer inference 当产品事实。关键行 3-18、20-43、45-56、58-90、92-120。 |
| skills/spec-riffrec-feedback-analysis/references/install-riffrec.md | Riffrec 安装/采集说明。 | 安装后用户再次调用本 Skill，再进 quick/extensive；不调用 runtime setup/work。 | 外部 README 是 install command source；本 Skill 不复制易漂移命令。 | setup path 无 recording，不运行 analyzer；等待用户带 zip 返回。 | 正确，terminal setup 指导清晰。关键行 3-14、16-27。 |
| skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md | 单问题短录制的临时分析与 bug report。 | suggested next step 可为 spec-debug；明确禁止自动 spec-brainstorm；发现多问题时切 extensive。 | chat bug report 是默认输出；source mapping 仅 obvious 时附 likely surface。 | temp artifact；只有用户要求才写文件；多问题停止 quick 并重跑 extensive。 | 正确。debug 只是建议，quick 不跨越 requirements authority。关键行 3-20、22-45。 |
| skills/spec-riffrec-feedback-analysis/references/spec-first-feedback-format.md | feedback finding 与 kickoff input 格式。 | Next Steps 明确进入 spec-brainstorm；不直接进入 plan/work。 | moment/screenshot 是 evidence；requirements 描述 WHAT；kickoff 不是 unified durable plan。 | 未证视觉 intent 必须标 inference；不写绝对 local path。 | 正确。handoff altitude 与 authority 匹配。关键行 3-16、18-109、111-116。 |

### 2.10 spec-rule-miner（3/3）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-rule-miner/SKILL.md | 从真实项目源码挖掘 AI coding rules，并 preview 后写 canonical rules/pointers。 | current diff 质量 → spec-code-review；实现/修复 → spec-work；spec-first source Skill 修改 → spec-write-skill；runtime drift → spec-first init command。 | current target source evidence 决定规则；provider graph 只 candidate；docs/ai/project-rules.md 是 full rules authority，AGENTS/CLAUDE 默认 pointer。 | target 不明、无源码、unsupported tool、旧无 marker、证据冲突/不足时停止或 limitation；refresh 无实质变化不写。 | 正确。近邻 route 与 source/runtime 分工清晰，不把 rule mining 变 code review/work。关键行 8-21、23-44、46-63、65-73。 |
| skills/spec-rule-miner/references/pattern-categories.md | 规则证据类别、采样与 provider candidate 边界。 | code/project graph 仅 capability-class 候选；不可用时 direct source/rg/ast-grep，未要求先跑 runtime setup。 | 每条规则仍由 source/test/config/现有规则确认；graph 不证明 frequency/association。 | candidate stale/unknown/失败时直接 fallback；不从本 Skill refresh/index/repair。 | 正确。provider 与 runtime setup owner 边界未倒置。关键行 3-15、17-25、27-69。 |
| skills/spec-rule-miner/references/write-targets.md | canonical rules、pointer、inline host target 与 merge规则。 | 无其他 Skill 调用；runtime projection 仍由 spec-first init。 | docs/ai/project-rules.md 是 canonical；AGENTS/CLAUDE/Qoder pointer，Cursor inline 可复制 full rules；generated mirrors 禁写。 | markers 不明/疑似 legacy 时询问；no-op 不写；unsupported host target 拒绝。 | 正确。source/pointer/runtime authority 唯一。关键行 3-18、20-37、39-56。 |

### 2.11 spec-runtime-setup（3/3）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-runtime-setup/SKILL.md | 五宿主 required runtime/MCP/helper/provider setup 与 readiness facts 公开入口。 | facts 供 using-spec-first、plan/work/review/debug/human 消费；agent-browser 等缺失 workflow 可回此入口；setup 后仅建议 spec-rule-miner，禁止自动调用；config 公开 sweep、pulse、promote、ideate 等 consumer。 | setup-registry 是 package source；setup.cjs 独占 host config/facts mutation；provider output 仅 advisory；local config 不是 team policy。 | host pin/target/path/secret/conflict fail closed；subset 只 partial；required item 未 ready 则 action-required；普通 direct-evidence workflow 不被 setup blocker 绑架。 | 候选 SP-C05（与总报告 F-02 同一事实）：line 126 仍称 plan_output/brainstorm_output reserved，和当前实际 consumer 漂移。其余 setup → rule-miner/advisory 与 downstream evidence authority 正确。关键行 9-23、30-65、67-115、117-136、138-178、241-265、303-347。 |
| skills/spec-runtime-setup/references/config-template.yaml | config.local.example 中 active/reserved consumer 注释。 | active 指向 spec-sweep、spec-product-pulse、spec-promote、spec-ideate；plan/brainstorm 标成 reserved。 | template 只暴露/protect keys，不拥有 workflow 行为。 | 所有值 optional；invalid 按 consumer fallback；注释不激活。 | 候选 SP-C05。关键行 14-30、32-57、59-68、70-94。 |
| skills/spec-runtime-setup/references/supported-mcp-tools.md | 当前 registry 工具、host target、helper 与 handoff 摘要。 | readiness 后回 plan/work/review/debug/docs 等用户意图 workflow；不自动串联。 | registry 是 machine source；tool facts 不是 semantic evidence。 | action-required 需修复重跑；parent ambiguity 要显式 child；subset 不等于 full ready。 | 正确。handoff 是 next-action summary，不授权下游 completion claim。关键行 3-20、21-45、47-53。 |

### 2.12 spec-sweep（10/10）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-sweep/SKILL.md | 多来源 feedback ingest/ack/media/fix verification/rolling plan 编排。 | config 来自 runtime-setup template/自身 interview；media 用本地 analyzer persona；最终显式 handoff spec-lfg docs/plans/feedback-sweep-plan.md；不自动调用 lfg。 | sweep-state.py 是 lifecycle state 唯一 writer；state 是 item truth；rolling plan 是 requirements-only derived view；source writes 只来自 standing-approved config。 | lease/circuit breaker/ack readback/source unavailable/media 三次失败/merge evidence/plan rotation 等都有 stop/degrade；headless decision 进 outstanding questions。 | 正确（spec-lfg 对端 intake 待总账核验）。requirements-only plan 与 handoff path 明确；需确认 spec-lfg 会先 planning enrich 而非直接 work。候选 SP-C06 涉及 duplicated analyzer。关键行 17-36、40-61、63-131、134-153。 |
| skills/spec-sweep/references/agents/media-analyzer.md | sweep 内 media → bug-shaped scratch finding persona。 | 明确禁止调用其他 Skills；使用 spec-sweep 共置 analyze_riffrec_zip.py，而非进入 spec-riffrec-feedback-analysis。 | analyzer candidate 不是结论；persona 读 frames/transcript，orchestrator 决定 plan/state；只允许一个 scratch write。 | sensitive 时禁外部 transcription；main fix 不明写 unclear；不得改 project/branch/commit/PR。 | 候选 SP-C06：与 spec-riffrec-feedback-analysis 持有同名同字节 analyzer，但无显式 cross-package owner/parity contract；当前 hash 相同是强反证。关键行 3-26、28-38、40-53。 |
| skills/spec-sweep/references/interview.md | first-run source/actions/standing approval/state topology/schedule 配置。 | schedule 交 host primitive；config 被 spec-sweep 和 runtime setup template识别；无其他 Skill 调用。 | user 对每 source 的 approved=true 是后续 ack/closeout standing authority；state location/shared branch 由用户选。 | headless 禁 setup；每 source 一次授权；email 强制 readonly；无 source 不能继续；schedule decline 不阻断。 | 正确。source-side write 与未来 run authority被显式记录；committed/shared topology 也在 setup 时说明。关键行 3-16、20-81、85-115、119-166、170-192。 |
| skills/spec-sweep/references/model-tiers.md | source/media subagent tier 与无 subagent fallback。 | generic subagent，不是 Skill route；无 primitive 时 orchestrator inline。 | ceiling judgment 留主会话；subagent 输出受 budget/cap。 | model override 不可用继承；subagent 不可用 inline，不阻断 sweep。 | 正确。failure return 完整。关键行 3-9。 |
| skills/spec-sweep/references/plan-template.md | feedback-sweep requirements-only unified plan shape 与 reconciliation owner。 | 计划最终供 spec-lfg handoff；本模板本身不执行。 | state file 是 item lifecycle authority；plan 是 requirements-only product contract view；human-notes 人拥有。 | unrelated/不同 frontmatter 的同名文件先 archive；closed/source_gone 从 open region drain；R-ID 稳定。 | 正确（对端待总账核验）。关键行 3-18、20-55、57-63。 |
| skills/spec-sweep/references/sources/email.md | experimental email read-only connector persona。 | 返回 spec-sweep orchestrator；无其他 Skill route。 | connector 只映射 facts；state engine 决定 ack/cursor；mailbox 无 write。 | 无 read tool 跳过；无 ack primitive 全部 ack_deferred；永不发送/回复/移动。 | 无跨 Skill edge；authority 正确。关键行 1-18、20-38、40-57。 |
| skills/spec-sweep/references/sources/github-issues.md | GitHub Issues connector persona。 | 返回 spec-sweep；无其他 Skill route。 | config 决定唯一 label write；connector 不决定 handled/merged/cursor。 | read unavailable 跳过；write unavailable readonly ingest；不 post/close issue。 | 无跨 Skill edge；authority 正确。关键行 1-24、26-45、47-59。 |
| skills/spec-sweep/references/sources/slack.md | Slack connector persona。 | 返回 spec-sweep；无其他 Skill route。 | config + bot identity 决定 ack/closeout reaction；state engine 拥有 cursor。 | read unavailable 跳过；write unavailable ack_deferred；不发消息/DM。 | 无跨 Skill edge；authority 正确。关键行 1-25、27-47、49-61。 |
| skills/spec-sweep/references/state-schema.md | canonical state、lease、status、evidence 与 engine status contract。 | 被 spec-sweep orchestrator/connectors/analyzer 消费；不对 spec-lfg 赋 lifecycle authority。 | engine 是唯一 writer；closed 必须有 fix_ref、merge SHA、verified_at；unknown fields/status preserved。 | validate 自动 downgrade under-evidenced closed；lease lost 停写；CORRUPT 拒绝覆盖；operational status exit 0 + status word。 | 正确。state/plan/lfg authority 分层清楚。关键行 3-7、33-55、57-105、107-174、176-211。 |
| skills/spec-sweep/references/subagent-template.md | media analyzer 的 bounded worker packet。 | 明确“do not invoke other skills”；回 orchestrator compact pointer。 | worker 只写一个 scratch artifact；orchestrator 读并决定。 | 禁 project edit/branch/commit/push/PR；sensitive 禁 quote。 | 与 SP-C06 同一候选；作为 isolation contract 本身正确。关键行 3-47、50-60。 |

### 2.13 spec-write-skill（9/9）

| 文件 | 职责 | Skill route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 关系判断与关键行 |
| --- | --- | --- | --- | --- | --- |
| skills/spec-write-skill/SKILL.md | 创建/修改/migrate project-owned Skill，或 validate-only readiness。 | 纯安装/import → skill-installer；ordinary review/debug/plan/work 是 near-neighbor；measurable optimization 可 handoff spec-optimize；runtime catalog/init 由 generator/command；audit-remediation 只接受用户已接受 finding。 | 单 repo canonical Skill source 唯一；validate-only 零执行零写；generated runtime/catalog 不是 source。 | source owner/containment/authorization 不清即 blocked；unknown package 不执行；缺 atomic conditional patch 不写；semantic evidence不足不完成。 | 正确。near-neighbor、installer、optimize 与 generator 的 ownership 分离明确。关键行 3、10-15、22-39、41-53。 |
| skills/spec-write-skill/references/authoring-method.md | qualification、source/effect resolution 与 portable core 方法。 | code work/review/installer/runtime maintenance 只做 near-neighbor route；behavior contract按需；不自动进入 optimize。 | target repo/source owner/operation/effect/modifier 决定 authoring authority；one concept one owner。 | one-off/near-neighbor not-entered；owner不明 preview-only/blocked；validate-only 不升级 apply。 | 正确。关键行 3-30、34-49、51-90、92-129。 |
| skills/spec-write-skill/references/authoring-workbench.md | apply 前 Design Brief、capability map、eval/topology 与 preview binding。 | 无其他 Skill调用；向 delivery gate 传 manifest/evidence。 | human/LLM semantic envelope 与 private deterministic manifest 分离；host 必须重新确认 mutation。 | Tier A 仅机械 change；无 atomic conditional patch 即 not-ready；partial failure只给 rollback preview。 | 无跨 Skill edge；mutation/handoff authority 正确。关键行 3-21、23-40。 |
| skills/spec-write-skill/references/behavior-contract-design.md | prose/persona/agentic Skill 的行为合同设计。 | handoff 是每个分支必须定义的行为项，但不指定固定 Skill。 | source/data/instruction/authority 分离；scripts 不替代 semantic judgment。 | 每分支需 done/failure behavior；hard fail无法修则 degrade/block；stop conditions 必须有 evidence。 | 无具体跨 Skill edge；作为关系设计约束正确。关键行 3-17、19-33、35-55、57-75。 |
| skills/spec-write-skill/references/delivery-gates.md | mechanical、preview、risk-triggered、five-axis readiness 与 closeout。 | spec-first project runtime 交 spec-first init；catalog 交 generator；无其他 Skill自动调用。 | bundled/official trusted validator 才可执行；runtime mirror/catalog 不拥有 source；fresh semantic 与 structural 分级。 | fail/incomplete/not-run/degraded 必须如实；无 atomic patch 不 apply；外部 validator 不运行。 | 正确。关键行 3-23、25-60、62-93。 |
| skills/spec-write-skill/references/evaluation-design.md | shape-aware pre-patch semantic baseline。 | measured optimization 或 feedback handoff 的前置 evidence owner；本身不调用其他 Skill。 | native eval owner优先；feedback 先 advisory，需复现/确认/授权才进 regression。 | 未读只能 structural-only；无 runner 不声称 semantic baseline。 | 正确。关键行 3-18。 |
| skills/spec-write-skill/references/optimization-and-lifecycle.md | spec-write-skill → spec-optimize 的条件 handoff。 | 主要目标是 measured optimization 且无 authoring patch时，not-entered 并 handoff spec-optimize；禁止 authoring→optimize→authoring loop。 | handoff 需 source snapshot、scope、baseline、metric、budget、stop、rollback、invalidation；若 optimize schema无法承载，明确 manual_observation/not promotable。 | feedback未复现不晋级 regression；post-write eval fail 阻断完成；不自动进 durable knowledge。 | 正确。该 edge 主动暴露 target 能力缺口，避免伪造 handoff closure。关键行 3-9。 |
| skills/spec-write-skill/references/project-profiles.md | project governance/source/runtime conditional profile。 | spec-first source/governance → catalog generator → init projection；非 spec-first 不引入本项目机制。 | project rules和canonical source优先；runtime仅验证/drift；一次 invocation一个 target。 | owner找不到 preview-only；多 repo/candidate 不 batch apply。 | 正确。关键行 3-14、16-31、33-39。 |
| skills/spec-write-skill/references/target-profiles.md | portable floor 与 Codex/other host delta evidence。 | target metadata 不形成其他 Skill route；真实 invocation/init/publish 需独立授权。 | Codex sidecar只影响 Codex invocation policy，不是 execution safety或portable truth。 | 无 target evidence readiness degraded；payload smoke 不证明真实 invocation/host parity。 | 无跨 Skill edge；host authority 正确。关键行 3-13、15-47、49-58。 |

## 3. 候选 Findings 与反证

### SP-C01：Dogfood/Polish 把 loop 结束或修复动作隐式升级为 commit authority

- 候选严重度：P1。
- Edge：spec-dogfood → spec-commit；spec-polish → terminal commit。
- Current source：
  - spec-dogfood/SKILL.md:29 将 commit 描述为“requested or appropriate”，74 与 210 把每个 fix commit 写入默认 loop。
  - spec-polish/SKILL.md:24、27、114 把用户说“done”直接映射为 commit。
- 可能损害：用户只授权 browser QA/polish 或说“结束”，却得到不可回滚的历史 mutation；也可能把 user-owned dirty work带入提交。
- 反证：
  - 两个 Skill 都是 user-invoked，且 description 明示会 fix；dogfood 的 report 明确记录 commit，polish output 也预告 commit。
  - spec-sweep 的 committed/shared topology 通过 first-run interview获得持久授权，说明项目允许某些 workflow 把 commit 作为显式产品合同；若 dogfood/polish 也有同等上游授权/tests，本 finding 可撤销。
- 最小姿态：Wrap。把 mutation authorization、commit authorization、landing authorization 分开；没有 commit authority 时留下 verified diff/commit candidate。
- Closure：两条 Skill 均在 commit 前有可观察的独立授权判断，且 tests 锁定“done ≠ commit authorization”或明确证明 invocation 已构成 commit contract。
- Invalidation：全局当前 contract 明确把这两个 user-invoked Skill 的 invocation/finish signal 定义为 commit authorization，并由 route/runtime tests 覆盖。

### SP-C02：spec-polish 重复承担 branch/worktree mechanics

- 候选严重度：P1/P2（取决于 spec-worktree 对端合同）。
- Edge：spec-polish → branch checkout；缺少 spec-polish → spec-worktree。
- Current source：spec-polish/SKILL.md:38-43 仅说 probe existing worktrees 后 checkout；spec-dogfood/SKILL.md:87-89 则明确把 detection、creation、already-checked-out verdict 交给 spec-worktree。
- 可能损害：相邻 UI workflow 对 dirty tree、existing worktree、PR/fork ref 的处理分叉，产生第二 owner。
- 反证：Polish 的目标可能始终是当前 checkout 的轻量协作，且 line 40 已要求先 probe；若对端 spec-worktree 只服务 hands-off isolation，而 polish 不需要隔离，则无需强行复用。
- 最小姿态：先对端核验，再决定 Adopt 当前简化或 Wrap internal helper。
- Closure：明确 polish 的 checkout contract、dirty-overlap 行为与为何不用/如何调用 spec-worktree，并有 focused route test。
- Invalidation：spec-worktree source 明确排除 spec-polish 场景，且 polish 当前 probe/check-out 行为已由 tests 证明等价安全。

### SP-C03：spec-pov 的 neutral explainer reverse route 未指向 spec-explain

- 候选严重度：P2。
- Edge：spec-pov → general research/direct，而非 spec-explain。
- Current source：spec-pov/references/boundaries.md:13、intake.md:25/31；spec-explain/SKILL.md:98 反向声明 verdict 属于 spec-pov。
- 可能损害：从错误入口退出时绕过已有的专属 teaching artifact/check-in 入口，route map 双向不一致。
- 反证：用户只问一个轻量事实时 Direct Lane 更便宜；spec-explain 会创建 artifact，未必适合所有 neutral question。
- 最小姿态：Extend 判据而非强制替换：需要教学 artifact/retention 时 spec-explain；轻量事实 direct。
- Closure：pov boundary、using-spec-first route map 与 spec-explain trigger 使用同一判据并有 near-neighbor fixture。
- Invalidation：route map 已明确规定 neutral explainer 从 pov 必须 Direct Lane，且 spec-explain 仅能由用户直接点名。

### SP-C04：spec-optimize 声明 spec-work consumer，但没有稳定 handoff

- 候选严重度：P2。
- Edge：spec-optimize → spec-work。
- Current source：spec-optimize/SKILL.md:41-43 声明 downstream consumer；Phase 4:720-744 的实际选项只有 code review、compound、Create PR、continue、done。
- 可能损害：关系图把 spec-work 记为 confirmed consumer，但没有 trigger、payload、authority 或 failure-return，可成为不可验证的纸面 edge。
- 反证：spec-work 可能只把 optimization branch/diff 当作后续实现输入，不要求显式 Phase 4 菜单；对端 source 可能声明 consume experiment results。
- 最小姿态：Thin 不真实 consumer，或补最小 handoff payload。
- Closure：对端 spec-work 有明确 optimize artifact/branch consumer，或 optimize 删除泛化 consumer 声明。
- Invalidation：spec-work 当前 source/test 已明确读取 optimize result/log/branch handoff。

### SP-C05：Runtime Setup 对 plan_output/brainstorm_output 的 consumer 状态已漂移

- 候选严重度：P1；与总报告候选 F-02 相同，不应重复计数。
- Edge：spec-runtime-setup config template → spec-plan/spec-brainstorm rendering consumers。
- Current source：
  - spec-runtime-setup/SKILL.md:117-126 把 plan_output/brainstorm_output 标为 reserved。
  - references/config-template.yaml:59-68 重复同一 reserved 声明。
  - 其他分区已观察到 spec-plan/spec-brainstorm 当前实际读取这两个 key；focused test 仍锁定 reserved 文案。
- 可能损害：setup 给出错误的 consumer graph，用户修改 key 后实际行为与配置说明相反；测试绿灯反而固化 drift。
- 反证：若 plan/brainstorm 的读取只在未合入/experimental branch、或不属于 current source，则 reserved 仍正确；需总账以当前 consumer source 再确认。
- 最小姿态：Extend current consumer catalog/template/test，不改变 setup authority。
- Closure：setup source、config template、consumer parser 与 focused tests 对 active/reserved 状态一致。
- Invalidation：当前 plan/brainstorm source 不再读取这些 keys，或读取被明确标成 dormant且无运行路径。

### SP-C06：Sweep 与 Riffrec Skill 之间存在未显式治理的 analyzer 复制关系

- 候选严重度：P2。
- Edge：spec-sweep media path 与 spec-riffrec-feedback-analysis 共用 analyze_riffrec_zip.py 语义，但 sweep 明确禁止调用其他 Skill。
- Current source：
  - spec-sweep/references/agents/media-analyzer.md:15-24 使用 sweep 共置 analyzer；50-53 禁其他 Skill。
  - spec-riffrec-feedback-analysis/SKILL.md:26-35 声明同名 analyzer 为所有非 setup path 的入口。
  - 两个脚本当前 SHA-256 均为 9af356ed4f991eea230fa39f3878a64ab7c8064f7a396adfc424db27fd0a3761，cmp exit 0。
  - repo-profile cache 的三份复制有 repo-profile-cache-parity.test.js；本次检索未发现 analyzer parity test。
- 可能损害：未来只修一份 analyzer，sweep 与直接 Riffrec 分析对同一 bundle 产生不同 transcript/frame/failure behavior。
- 反证：当前两份完全一致；sweep 必须避免 Riffrec extensive path 自动进入 brainstorm，package-local copy可能是五宿主投射/隔离的必要机制。
- 最小姿态：Wrap 为显式 source-sync/parity test；不要求 sweep 调用完整 Riffrec Skill。
- Closure：明确 canonical analyzer owner，并用 deterministic parity/generation test 保证两个 runtime carrier 同源。
- Invalidation：generator 已保证两份均从同一 source 生成，且现有 tests 已覆盖双向 parity，只是本分区检索未发现。

## 4. 已确认正确或暂不升级的关键关系

- spec-app-consistency-audit → spec-code-review：headless caller token、code_review_handoff、safe_auto 禁止和 degraded envelope 均明确；只待 code-review consumer 分区确认。
- spec-dogfood → spec-worktree/spec-debug/spec-compound/spec-runtime-setup：触发与失败返回清晰；仅 commit authorization 单独保留候选。
- spec-explain → spec-ideate/spec-simplify-code/spec-polish/spec-pov/spec-compound/spec-proof：前两者需用户接受、polish user-invoked-only、proof 有 local fallback，未发现自动串联。
- spec-pov → spec-plan/spec-brainstorm/spec-work/spec-compound：grade 与 payload 决定 handoff，Hold/Reject 无 handoff，warm invocation 归还控制。
- spec-riffrec-feedback-analysis → spec-brainstorm：extensive path 携带 requirements-kickoff 与 source-materials，brainstorm 首先恢复用户确认；quick path明确不 handoff。
- spec-runtime-setup → spec-rule-miner：仅 advisory suggestion，禁止自动调用或把 rule output算 setup readiness。
- spec-sweep → spec-lfg：source 侧明确输出 requirements-only rolling plan和 path；是否正确取决于 spec-lfg intake 是否先完成 plan enrichment，暂不升级 finding。
- spec-write-skill → spec-optimize：handoff 只在 measured optimization 且无 authoring patch时发生，并明确当前 optimize schema不足时 not promotable，避免循环和伪 closure。

## 5. Manifest 对账

### 5.1 按 package

| Package | Expected | Actual | Missing | Extra |
| --- | ---: | ---: | ---: | ---: |
| spec-app-consistency-audit | 6 | 6 | 0 | 0 |
| spec-dogfood | 3 | 3 | 0 | 0 |
| spec-explain | 9 | 9 | 0 | 0 |
| spec-optimize | 12 | 12 | 0 | 0 |
| spec-polish | 12 | 12 | 0 | 0 |
| spec-pov | 11 | 11 | 0 | 0 |
| spec-product-pulse | 3 | 3 | 0 | 0 |
| spec-promote | 2 | 2 | 0 | 0 |
| spec-riffrec-feedback-analysis | 5 | 5 | 0 | 0 |
| spec-rule-miner | 3 | 3 | 0 | 0 |
| spec-runtime-setup | 3 | 3 | 0 | 0 |
| spec-sweep | 10 | 10 | 0 | 0 |
| spec-write-skill | 9 | 9 | 0 | 0 |
| **Total** | **88** | **88** | **0** | **0** |

### 5.2 文件类型与读取量

| 类型 | 数量 |
| --- | ---: |
| Markdown | 82 |
| YAML | 5 |
| JSON | 1 |
| **Total** | **88** |

- 总行数：8784。
- Missing：无。
- Extra：无。
- 每个 manifest path 均在上方逐文件表中出现一次。
- 完整 path manifest SHA-256：b3c28e16e57b36b6dd32b726145f0aed9fa11e9fb4fbb9eec319ed26ccbe1861。
- 逐文件 SHA-256 清单摘要 SHA-256：3ba89af8c0c0e31574be8b88d828e0ba27f1ddc4e652d08716957a0db9c77b62。

## 6. Claim limitations

- 本台账证明的是 assigned source package 的 declared/current-source 关系，不证明 clean-session host loader、真实 Skill invocation、field outcome 或外部服务可用性。
- 对端 Skill intake/consumer 标成“待总账核验”的关系，不在本分区单独升级 confirmed observed。
- 本轮没有修复任何 finding，也没有执行 source/runtime mutation、commit、push 或 plan lifecycle closeout。
- 审查期间仓库存在并行 dirty work；本分区只写本文件，未触碰并行文件。
