# 双 Agent 深度测评报告：spec-first 全量 38 skill（skill-up v0.10.0 实测）

- **日期**：2026-09-02
- **测评对象**：`skills/` 下全部 38 个 skill（排除 `*-workspace/` 与 `_shared/`）
- **方法**：两个独立专业测评 agent 双视角并行——A 组「行为效果实证」（skill 是否真正改变模型行为、失败定性、回归对比），B 组「评测资产与工程治理」（eval 用例设计、judge 健康度、引用完整性、跨 skill 一致性）。每组对所辖 skill 执行：SKILL.md 全文静态评审 + `skill-up run` 全量 runtime 实测 + 失败 case 逐条定性。
- **工具链**：skill-up **v0.10.0**（测评当日由 v0.7.0 升级，上游最新版）；引擎 `claude_code`（本地 CLI 登录态，GLM 代理）；单 case 约 30–60 秒、约 5 万 input tokens。
- **已知环境事实（非缺陷）**：无 `ANTHROPIC_API_KEY` 等环境凭据，靠本地登录态运行；stderr 中 `[claude-code:unrecognized_model] {"model":"glm-5.3[1m]"}` 警告不影响主链路；个别 case 遇 429 限流，重试后通过，归为 env-noise。
- **纪律**：全程只读，未修改 `skills/`、`evals/`、源码或 docs 任何文件；`skill-up run` 写入的 workspace 新迭代为工具预期产物。

> 分工：A 组（行为效果实证）——autoresearch、spec-app-consistency-audit、spec-brainstorm、spec-code-review、spec-commit、spec-commit-push-pr、spec-compound、spec-compound-refresh、spec-debug、spec-doc-review、spec-dogfood、spec-explain、spec-handoff、spec-ideate、spec-lfg、spec-optimize、spec-plan、spec-polish、spec-pov。
> B 组（评测资产与工程治理）——spec-prd、spec-product-pulse、spec-project-rules、spec-promote、spec-prototype、spec-resolve-pr-feedback、spec-riffrec-feedback-analysis、spec-rule-miner、spec-runtime-setup、spec-simplify-code、spec-strategy、spec-sweep、spec-test-browser、spec-test-xcode、spec-work、spec-worktree、spec-write-skill、spec-write-tasks、using-spec-first。

---

## 第一部分：B 组报告（评测资产与工程治理，19 skill / 63 case）

**总览**：63 个 case 中 58 PASS、4 FAIL（spec-rule-miner ×2 真实 skill 缺陷、spec-sweep ×1 judge 断言缺陷、spec-test-xcode ×1 用例缺陷）、1 case 零断言白跑；429 限流 2 例重试后均通过。

### spec-prd —— 8/10（A）
- 运行结果：pass 6/6（iteration-8）。
- 静态评审：Reference Trigger Map（SKILL.md L117-130）与 Template Trigger Map（L131-153）按触发条件加载资产，是全组最好的渐进披露设计；全部 19 个引用路径实测存在，零缺失；Failure-Mode Blacklist（L205-217）把失败模式固化为反模式表。
- 缺陷：正文 340 行信息过载，`write_mode` 语义在 L89、L185-193、L266-270 等 ≥4 处重复解释；L228-229 出现两个编号 "3."（Phase 0 决策树编号错乱）；中英文正文混杂无规则（L128、L216、L266、L334）。
- 评测资产：6 case 覆盖空输入 gate、0-1 路由、validate 只读、输入注入不可信、棕地 grill 前置、R2 bugfix 路由变体；gate 类用 script judge、路由类用 rule_based，`brownfield-grill-before-write.yaml` 挂文件级断言。漏测：Contract Reset Lite、Decision Card 机器可验证性、closure_disposition 合同。
- 失败分析：全通过。
- 建议：修 Phase 0 编号；`write_mode` 语义收敛单一权威段；补 Contract Reset Lite 与 closure_disposition gate case。

### spec-product-pulse —— 6/10（B）
- 运行结果：pass 1/1（iteration-3）。
- 静态评审：Phase 0 config 路由清晰（L51-83）；per-source receipt 合同（`confirmed-zero`/`unavailable`/`partial`）是同类最严谨的不确定性表达。
- 缺陷：仅 1 个 case；SKILL.md 承诺的 receipts 状态机、15 分钟缓冲、PII 不落盘、provider-side projection 授权全部无 eval 覆盖；frontmatter `allowed-tools` 与同类 skill 不一致。
- 失败分析：全通过。
- 建议：补 per-source receipt 分类 case（断言不 collapse 成 `no data`）；补 PII 不落盘文件级断言。

### spec-project-rules —— 8/10（A）
- 运行结果：主 run（iteration-10）因 eval.yaml 硬编码 `engine: codex` 在本环境不可用（8 ERROR）；`--engine claude_code` 覆盖重跑 pass 10/10（iteration-11）。
- 静态评审：10 case 是全组覆盖最全的评测资产（bootstrap、准入三问、敏感信息零泄漏、refresh no-op/dirty、marker 共存、大仓分批、抽样回退、单端降级、回写拒绝），judge 全部文件级硬断言；SKILL.md L0 脚本/LLM 分工（L52「LLM 永远不做枚举」）边界清晰。
- 缺陷：`evals/eval.yaml` L9 `engine.name: codex` 硬编码，与其它 18 个 skill 不一致，导致本环境整套评测静默失效（iteration-9/10 均为 codex，长期未真正跑过）；全中文正文 + 英文 frontmatter，与兄弟 skill 语言策略不一致。
- 失败分析：主 run FAIL 属 `[env-noise]`（codex 引擎不可用），覆盖重跑后 10/10。
- 建议：engine 改 claude_code 或可覆盖；把「10 case + 文件级 judge」模式作为其他 skill 范本。

### spec-promote —— 6/10（B）
- 运行结果：pass 2/2（iteration-3；其中 1 case 零断言）。
- 静态评审：Path 0/A/B 三态 Spiral 探测（L53-66）用 bounded probe 避免泄漏；draft-only 承诺（L16）明确。
- 缺陷：`no-publish-side-effects.yaml` 无任何 judge 段落（grading.json `expectations: []`），「不发帖」核心边界零断言，跑完即 PASS 无回归检测能力；该 case 的 `constraints.files: CHANGELOG.md` 疑似未生效（response 称未见该文件，fixture 实测也无）。
- 失败分析：全通过（但零断言 case 的「通过」无判定意义）。
- 建议：补 script judge（输出语义 + 无 commit 的文件级检查）；核查 constraints.files 写入机制。

### spec-prototype —— 9/10（S）
- 运行结果：pass 4/4（iteration-3）。
- 静态评审：41 行完成完整生命周期（Run-Local Phases 表给出每 phase allowed exit，L15-29）；「不伪造被测维度」「web 默认基底」「无人体验即 blocked」三条硬边界清晰；references 全部存在。
- 缺陷：`preview.md`/`write-back.md` 无显式触发说明（仅间接引用），弱于 spec-prd 的 Trigger Map 标准。
- 评测资产：4 case 精确覆盖四个硬出口，断言与 SKILL.md 合同字符串逐字对齐，「小而准」范本。
- 失败分析：全通过。
- 建议：补 preview/write-back 触发条件；可选补 decided phase 正向 case。

### spec-resolve-pr-feedback —— 8/10（A）
- 运行结果：首跑 1 case 429，冷却重试后 pass 3/3（iteration-6）。
- 静态评审：Exit Authority Admission 五项独立授权矩阵（L30-50）是全组最强副作用治理；scripts/references 全部存在。
- 缺陷：正文三语混杂；「resolver dispatch boundary」六字段块与 spec-sweep/spec-simplify-code/spec-riffrec/spec-work 逐字重复（同一模板 N 份拷贝）。
- 评测资产：3 case 质量高（注入不可信含文件级 grep 残留检查、无授权只读、授权矩阵）；但「不越项」实际无断言（脚本注释诚实标注需人工核验）。
- 失败分析：`[env-noise]` 429，重试 PASS。
- 建议：为「不越项」补可判定断言（transcript 无 `gh pr comment`/`git push`）；六字段块共享化。

### spec-riffrec-feedback-analysis —— 6/10（B）
- 运行结果：pass 1/1（iteration-3）。
- 静态评审：三路分流 + 「只读命中的那一个 reference」加载纪律清晰（L10-18）；transcription egress 独立授权（L26）边界完整。
- 缺陷：仅 1 case；quick/extensive 分流、`--transcribe` 授权 gate、local-only 隐私边界全部漏测；`analyze_riffrec_zip.py` 与 spec-sweep 的同名脚本逐字节相同（双份维护）。
- 失败分析：全通过。
- 建议：补 transcription 未授权 case 与分流 case；analyzer 脚本收敛单一 owner 或纳入 `_shared` 同步模型。

### spec-rule-miner —— 6/10（B）
- 运行结果：pass 1/3（iteration-7/8：no-preview-no-write 首跑 429 重试后 PASS；2 个路由 case FAIL）。
- 静态评审：Hard Boundaries 的 headless 判定是环境性而非文本性（L40），反社工注入意识强；refresh_noop 防重写纪律可执行。
- 缺陷（真实 skill 缺陷 ×2）：
  - `[skill-defect]` review-request-routes-out：response「……明确排除了常规 code review，所以这次我按普通审查流程走了」——识别了不匹配但未按 L21「命中近邻路由时必须在回复中点名目的地 skill」输出目的地名称；iteration-4 曾 PASS，间歇性复现。
  - `[skill-defect]` r2-debug-request-routes-out：同款失败且模型在 rule-miner 会话内直接修了 bug（「所以这次直接修了」），同时违反路由纪律；iteration-6/7 连续 FAIL，非偶发。
- 建议：L21 点名纪律提级为 When Not To Use 硬规则并配正反例；增补「在错误 workflow 里替目的地干活本身被禁止」。

### spec-runtime-setup —— 6/10（B）
- 运行结果：pass 2/2（iteration-3）。
- 静态评审：source-of-truth 边界（setup-registry.json + schema 校验）、`MCP_SETUP_HOST` fail-closed（L16）、`--verify-only` 只读边界清晰。
- 缺陷：SKILL.md 361 行超载，workspace-graph 生命周期锁、receipt SHA-256 字段清单等实现细节上浮（L69-128 应下沉 references）；eval 仅 2 case，bare invocation、`--repair-host-config`、fail-closed host 推断、Graphify root conflict 均无覆盖。
- 失败分析：全通过。
- 建议：workspace-graph 域下沉为 references；补确认 gate 与 fail-closed case。

### spec-simplify-code —— 9/10（A）
- 运行结果：pass 4/4（iteration-6）。
- 静态评审：90 行完成三 lens 流程 + safety check 不可移除合同（L69）+ 按维度量化总结（L90）；personas 三文件存在。
- 缺陷：Step 2 的 dispatch 六字段块（L36-47）是跨 5 skill 逐字复制模板。
- 评测资产：4 case 选点极佳（bug 路由出、docs-only no-yield gate、safety check 文件级保留断言、R2 对抗变体），是 dispatch-授权边界类的评测范本。
- 失败分析：全通过。
- 建议：dispatch 块共享化；可选补 scope 不 widening 的文件级 case。

### spec-strategy —— 8/10（A）
- 运行结果：pass 5/5（iteration-6）。
- 静态评审：Phase 0 文件状态路由（L34-42）三分支互斥清晰；「Anchor, not plan」出口带具体目的地（L27）。
- 评测资产：5 case 覆盖三分支 + 路由出口 + `update-reads-existing-doc` 用 fixture 独特词（`LedgerFlow`、`对账`）断言「真读了文件」——防模板复读的聪明设计。
- 失败分析：全通过。
- 建议：补 pushback 强度 case（fluff 答案时追问而非照抄）。

### spec-sweep —— 6/10（B）
- 运行结果：pass 0/1（iteration-3）。
- 静态评审：189 行里的状态机（lease/cursor/ack 顺序）、不可信输入声明（L21）、fix ref 形状校验防注入（L163）是高水准；`sweep-state.py` 单一 writer 纪律明确。
- 缺陷：仅 1 case 且断言锚错词（见下）；敏感数据派发、circuit breaker、fix verification 无 eval。
- 失败分析：`[judge-strict]`（断言缺陷）headless-first-run-stops：模型精确输出 `**Result: \`first run requires interactive setup\` — run stopped.**` 并正确停止零写入——行为完全达标，仅因断言锚定中文「设置」（SKILL.md L34 规定的稳定输出是英文 token）被判 FAIL。
- 建议：断言改为 `first run requires interactive setup`；补状态机与 circuit breaker case。

### spec-test-browser —— 8/10（A）
- 运行结果：pass 2/2（iteration-3）。
- 静态评审：86 行把 wrapper 唯一入口、exact-origin fail-closed、mutation 授权分层（L45-51）、claim ceiling（L86）写得极紧凑；caller/wrapper/workflow 三方 ownership 表（L14-20）是边界表达范本。
- 缺陷：`user-invocable: false` 与 spec-test-xcode 的 `disable-model-invocation: true` 表达相似语义却用不同 frontmatter 键。
- 漏测：wrapper probe `not_supported` 链路、mutation-authorization-required gate。
- 建议：补 mutation 授权 case。

### spec-test-xcode —— 5/10（C）
- 运行结果：pass 0/1（iteration-3）。
- 静态评审：source-binding/freshness/claim ceiling 收尾合同完整；`url_open_authorization` 的 effect-bearing fallback 授权（L93-96）边界意识好。
- 缺陷：唯一 case 失效——`[case-flaw]` mcp-unavailable-stops：prompt 前缀声称「已通过 /spec-test-xcode 显式调起」，但该 skill `disable-model-invocation: true` 不出现在模型可调用列表，transcript 中 `XcodeBuildMCP` 出现 0 次（SKILL.md 从未进入上下文）；对照 spec-test-browser 通过 case（模型成功调用 Skill 工具获得注入），失败根因是评测基建与 prompt 适配断裂，非模型能力问题。
- 建议：case prompt 改为可注入形式或把 SKILL.md 路径写进 prompt；统一 disable-model-invocation skill 的 eval 注入约定。

### spec-work —— 9/10（A）
- 运行结果：pass 7/7（iteration-10）。
- 静态评审：Reference Trigger Map（L25-35）带「If unread/unavailable」降级列，是渐进披露 + 降级路径最完整实现；Return-to-Caller 结构化返回合同（L242-286）字段级可验证；Anti-Rationalization 红旗表（L153-162）明示「不是 gate」的职责自觉。
- 缺陷：295 行接近超载上限；Phase 0 分类规则嵌套较深。
- 评测资产：7 case 覆盖面全组第二（requirements-only 停止、non-active 拒绝、task-pack 漂移、trivial 直做、开放式路由 debug、两个 R2 对抗变体）。
- 失败分析：全通过。
- 建议：保持；可选补 Return-to-Caller envelope 字段完整性 case。

### spec-worktree —— 5/10（C）
- 运行结果：**无 evals**（缺口发现，仅静态评审；无 workspace 目录，说明从未做过 skill-up 测评）。
- 静态评审：detect/isolate/create 的确定性 facts 合同（`spec-worktree-detect.v1`）+ `already_checked_out` 幂等裁决设计好；caller-owned intake contract 与反向声明（L144）边界诚实。
- 缺陷：`evals/` 完全缺失——作为 spec-dogfood/spec-work 的内部依赖，行为回归零保护；`bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]…'` 包装命令全文重复 6 次（L22/60/70-72/84/90-92）。
- 建议：建立最小 eval 套件（detect 三态 + already_checked_out 裁决，均可 script judge）；压缩重复 wrapper 文本。

### spec-write-skill —— 7/10（B）
- 运行结果：pass 1/1（iteration-3）。
- 静态评审：Branch Contract 表（L25-31）五 disposition 压缩出色；`layer_result` 枚举 + 「新增值必须同步 source/consumer/tests」闭环意识好；8 个 references 全部存在。
- 缺陷：58 行对五分支 + 六 conditional sources 压缩过度，单独读 SKILL.md 几乎不可执行；仅 1 case（mirror patch 拒绝），Tier A/full apply/validate-only/trust-preflight 全无覆盖。
- 建议：补 validate-only 零写入与 owner-blocked case；顶部补 3-5 行可独立执行的主干摘要。

### spec-write-tasks —— 8/10（A）
- 运行结果：pass 4/4（iteration-3）。
- 静态评审：Core Rules 10 条（L49-62）把「plan 唯一真相源、task pack 是派生物」层级讲透；Final Decision Envelope 的 🔴 GATE 与 CLI JSON 证据绑定（never self-report `deterministic_handoff: true` without CLI JSON evidence）是 verification gate 的正确落地。
- 缺陷：`evals/` 根目录堆积 7 个辅助 json + `skillup/cases/` 双目录结构，与单目录惯例不一致；compile 主路径（happy path）无 case。
- 建议：补 compile happy-path case；evals/README 标注各辅助 json 角色。

### using-spec-first —— 8/10（A）
- 运行结果：pass 6/6（iteration-10）。
- 静态评审：42 行做到「入口治理器只选一个入口即让权」的克制；Direct Lane 正反判据（L20-22）具体可判。
- 评测资产：6 case 质量高（Direct Lane 判据 must_not_contain `Entering spec`、模糊想法路由、失败优先、推荐格式、R2 变体），断言显式声明中英变体均合法——语言无关断言的正确做法。
- 失败分析：全通过。
- 建议：可选补「路由后立即让权」行为断言。

### B 组横向：缺陷族谱

| 缺陷模式 | 涉及 skill | 证据 |
| --- | --- | --- |
| 单 case / 极少 case 覆盖不足 | spec-product-pulse(1)、spec-riffrec-feedback-analysis(1)、spec-write-skill(1)、spec-sweep(1)、spec-runtime-setup(2/361 行职责) | 各 evals/cases 清点 |
| 断言锚定错误 token / 输出语言 | spec-sweep（「设置」vs `first run requires interactive setup`） | iteration-3 grading.json |
| 无 judge 的 case（零断言白跑） | spec-promote（no-publish-side-effects） | grading.json `expectations: []` |
| case prompt 声称「skill 已加载」与注入机制矛盾 | spec-test-xcode（FAIL）、spec-resolve-pr-feedback（侥幸通过） | transcript 关键词 0 命中 vs browser case 的 Skill 工具调用成功 |
| eval.yaml 硬编码不可用 engine | spec-project-rules（codex） | iteration-10 `engine_name: codex` + 8 ERROR |
| SKILL.md 超长/实现细节上浮 | spec-runtime-setup(361 行)、spec-prd(340 行)、spec-work(295 行) | wc -l + 段落审读 |
| 跨 skill 逐字复制大块模板（dispatch 六字段授权块） | spec-sweep、spec-simplify-code、spec-riffrec-feedback-analysis、spec-work、spec-resolve-pr-feedback | 五处区段逐字一致 |
| 复制型共享资产未进 _shared 治理 | analyze_riffrec_zip.py ×2（diff exit 0）；mini-ledger fixture ≥3 份 | diff 与目录清点 |
| 路由点名纪律执行不稳定 | spec-rule-miner（2/3 FAIL；对照组全过） | iteration-4 PASS → 6/7 FAIL |
| 环境噪声（429 限流） | spec-resolve-pr-feedback、spec-rule-miner（重试均过） | stderr `429` |

### B 组：评测资产质量总评

整体中上、方法论成熟：63 case 中 judge 选型零 `agent_judge` 滥用，rule_based（稳定 token）/ script（文件级与语义复合断言）分工纪律良好；「断言锚定 SKILL.md 合同字符串 + files_not_exist 文件级双保险」模式（spec-prd/spec-work/spec-project-rules/spec-simplify-code/spec-prototype）是最佳实践；R2 对抗变体迭代方法值得保留。主要短板是**覆盖广度两极分化**：一端 spec-project-rules(10)/spec-work(7)/spec-prd(6)/using-spec-first(6)，另一端 5 个 skill 合计只有 5 个 case。

最需重写/补建的断言清单：
1. spec-sweep `headless-first-run-stops.yaml`：`must_contain: ["设置"]` → `first run requires interactive setup`；
2. spec-promote `no-publish-side-effects.yaml`：补 judge（当前零断言）；
3. spec-test-xcode `mcp-unavailable-stops.yaml`：修复 prompt/注入机制后重跑；
4. spec-project-rules `eval.yaml`：engine 改 claude_code 或可覆盖；
5. spec-promote：核查 `constraints.files` 是否真的写入 fixture。

### B 组：跨 skill 一致性与职责重叠

- 职责互斥声明对称存在（好）：spec-project-rules ↔ spec-rule-miner 互相点名；但 rule-miner 执行侧不稳定使纸面边界打折。
- fixture/script 复制未治理：`_shared/` 只治理 references 同步（16 copies 模型），fixtures 与 scripts 复制件在治理模型外。
- frontmatter 键不统一：内部/受限 helper 有三种表达——`user-invocable: false`（spec-test-browser、spec-worktree）、`disable-model-invocation: true`（spec-product-pulse、spec-promote、spec-resolve-pr-feedback、spec-sweep、spec-test-xcode）、无标记；后者直接影响 eval 注入可行性。
- case prompt 前缀两种流派：「（spec-x 已安装，请按它工作。）」vs「（我已通过 /spec-x 显式调起——已加载…）」——后者在 disable-model-invocation 的 skill 上是错误引导。
- 语言策略不统一：英文正文（spec-prd/spec-work）vs 中文正文（spec-project-rules/spec-rule-miner）vs 中英混排（spec-sweep 等）。

### B 组评分总表

| skill | 分数 | 分级 | pass / cases（iteration） |
| --- | --- | --- | --- |
| spec-prototype | 9 | S | 4/4（iter-3） |
| spec-simplify-code | 9 | A | 4/4（iter-6） |
| spec-work | 9 | A | 7/7（iter-10） |
| spec-prd | 8 | A | 6/6（iter-8） |
| spec-project-rules | 8 | A | 10/10（claude 覆盖重跑 iter-11） |
| spec-resolve-pr-feedback | 8 | A | 3/3（重试后 iter-6） |
| spec-strategy | 8 | A | 5/5（iter-6） |
| spec-test-browser | 8 | A | 2/2（iter-3） |
| spec-write-tasks | 8 | A | 4/4（iter-3） |
| using-spec-first | 8 | A | 6/6（iter-10） |
| spec-write-skill | 7 | B+ | 1/1（iter-3） |
| spec-product-pulse | 6 | B | 1/1（iter-3） |
| spec-promote | 6 | B | 2/2（iter-3；1 case 零断言） |
| spec-riffrec-feedback-analysis | 6 | B | 1/1（iter-3） |
| spec-rule-miner | 6 | B | 1/3（iter-7/8；2 个 skill-defect FAIL） |
| spec-runtime-setup | 6 | B | 2/2（iter-3） |
| spec-sweep | 6 | B | 0/1（iter-3；judge 断言缺陷误判） |
| spec-test-xcode | 5 | C | 0/1（iter-3；case-flaw） |
| spec-worktree | 5 | C | 无 evals（静态评审） |

### B 组：未执行项及原因

- spec-project-rules 主 run（codex 引擎）无效：本环境无可用 codex 登录态；已用 `--engine claude_code` 覆盖重跑取证（iteration-11，10/10）。
- spec-worktree：无 evals，按纪律仅静态评审。
- references/ 只做存在性验证与抽查，未逐行审读全部内容。
- fixture 仓库只抽查存在性，未逐一验证内部数据正确性。
- spec-promote constraints.files 生效性：仅 response 证词这一间接证据，未做白盒验证。

---

## 第二部分：A 组报告（行为效果实证，19 skill / 37 case + autoresearch 静态）

A 组 runtime 于 2026-09-02 09:30–10:26 全部完成（skill-up v0.10.0，引擎 claude_code），分析由两个子组并行完成：A1（spec-app-consistency-audit 至 spec-dogfood，10 skill / 37 case：32 PASS / 5 FAIL / 0 ERROR）、A2（spec-explain 至 spec-pov + autoresearch 静态评审）。失败定性分布：3.5 个 skill-defect、2 个 case-flaw、1.5 个 judge-strict、1 个 env-noise，另发现 1 个被 PASS 掩盖的评测资产缺陷。

### A1 组：spec-app-consistency-audit … spec-dogfood

#### spec-app-consistency-audit —— 5/10（C）
- 运行结果：pass 2/4（iteration-13）。顽固失败：code-review-routes-out 自 iter-1 起 7 轮仅 iter-4 偶过（iter-5/7/8 为 fixture 缺失 ERROR、iter-6 为 480s 超时）；r2-implementation-routes-out 自 iter-10 引入起 0 通过。
- 静态评审：L83 近邻路由指令精确预判了失败话术（原文引用「别审了,直接修了」并点破「repairing the defect inside this audit … is doing the wrong workflow's job」）；守门与降级完备；「No evidence, no issue」+ confidence ≥0.75 清晰。缺陷：近邻路由位于 299 行文档中段（L75-83），description 未点名目的地 skill，指令显著性不足——13 轮迭代未收敛本身就是证据；test/lint 排除双写（L19/L70）与 code-review/implementation 路由单点权重不对称。
- 失败分析：
  - `[skill-defect]` code-review-routes-out：response 完整代行代码审查（4 个确认 bug），结尾仅泛称「修复工作应路由到对应实现流程」——识别越界却不点名目的地，正是 SKILL.md L83 自己定义的失败形态。
  - `[skill-defect]` r2-implementation-routes-out：response 直接修复崩溃 bug 并验证，仅说「审计 skill 不覆盖产品代码修改……所以这次按你说的直接修」——L83 明文禁止的 co-opting 行为原文重演。
- 建议：路由指令提级为 description 后首段 Routing Gate；加「用户坚持要求代行」不可 override 规则；eval 增加「点名 + 不产出审计外交付物」双断言。

#### spec-brainstorm —— 7.5/10（B）
- 运行结果：pass 6/7（iteration-10）。回归候选：verdict-routes-to-pov 历史 5 过 1 败后再败（2026-09-01 双层修复未挡住）。
- 静态评审：description 即写明 verdict 路由；L131 carve-out + L135-143 独立 0.1c gate + references/verdict-routing.md 三层防御；L141「the only exits are the offer or the workflow — never the verdict itself」语义精确。缺陷：309 行正文判定链路长；「无项目上下文」场景未规定路由优先；L88-90 git 预解析在非 git 目录触发加载报错噪声。
- 失败分析：`[skill-defect]` verdict-routes-to-pov：response 直接给出「## 结论：不换，留在 ESLint」完整裁决，全文未出现 spec-pov——违反 L141。同场景变体 r2-verdict-graphql 通过，证实是行为不稳定而非指令缺失。
- 建议：硬规则前置；补「无项目上下文时路由优先于回答」；修 git 预解析降级路径。

#### spec-code-review —— 9/10（S）
- 运行结果：pass 4/4（iteration-14，无回归）。
- 静态评审：Phase 0a「Freeze effective mode before any tool call」把 mode 契约变成出口 gate；L103 report-only 硬规则在 r2 case 被精确执行（应用了用户显式授权的 P0 修复、保持 commit 未授权，区分四层授权面）；行为实证极佳（agent-mode 输出单 JSON 含 `degraded` 状态、report-only case 主动报告 diff sha256 一致的 mutation gate 证据）。缺陷：1036 行/124KB 体量压力；eval 资产存在被 PASS 掩盖的缺陷（见下）。
- 失败分析：全通过。但 `[case-flaw]`（资产缺陷）：r2-preset-authorize-fix 的 title/description 写「用户显式禁止修复」而 prompt 实际是「P0 就顺手修了」——语义相反；且 check-r2-no-fix.sh 第 7-13 行条件逻辑反转（python 检出坏词 exit 1 时 bash `if python3…then` 反而跳过告警），「宣称已修复」时通过、「不宣称」时 FAIL——本轮 response 含「已修复」却 PASS，属「双错抵消」的假通过，该 case 实际测不出任何东西。
- 建议：修脚本条件逻辑并使 title/prompt/断言同向；拆成授权修复与禁止修复两个独立 case。

#### spec-commit —— 7/10（B）
- 运行结果：pass 1/2（iteration-7）。回归候选：no-auth-stops-before-staging iter-1/2 PASS → iter-5/6/7 连续 FAIL。
- 静态评审：119 行短小聚焦，`commit_authorization` 与 `branch_mutation_authorization` 分离、「workflow invocation does not authorize commit」清晰；Context 命令表防管道拼接扎实。缺陷：纯状态查询场景无行为定义，eval 判定悬空；L20 回执未标注为必须原样输出的机器契约。
- 失败分析：`[case-flaw]` no-auth-stops-before-staging：prompt 是纯查询（「帮我看看改动是什么情况」），SKILL.md L20 的 gate 触发条件是「staging/commit 前停下」，纯查询不触发。模型行为完全合规（零 commit、如实汇报），却因未「顺带」提及授权字样判 FAIL——iter-1/2 通过恰因当时模型自发多说了一句。判据绑定在模型随机措辞而非契约义务上。
- 建议：case prompt 改为带 commit 意图；SKILL.md 明确纯查询场景无授权声明义务；断言第二检查项改条件触发。

#### spec-commit-push-pr —— 8.5/10（A）
- 运行结果：pass 2/2（iteration-7）。mode 检测三分支精确（description-only 识别规则正是通过 case 的执行依据）；双授权 gate 在 no-landing case 精确执行；body-file 防空体三重检查、check-ignore 前置等工程陷阱防护密度高。缺陷：Step 6 concept teaching gate + explainer 归档链职责面偏宽；L34-54 双份维护易漂移。建议：explainer 归档下沉 opt-in；补「有 landing 授权 + 无 remote」降级 case。

#### spec-compound —— 8.5/10（A）
- 运行结果：pass 2/2（iteration-3）。硬出口（问题未解决不得写入 durable knowledge）在 unsolved-no-write case 教科书式执行（「✗ Documentation skipped」）；bootstrap 重定向精确（额外核实 spec-compound-refresh 未安装并如实停写）。缺陷：773 行体量与「轻量沉淀」定位有张力；session-history 授权链未覆盖。建议：补「已解决 + 证据齐备」正向落盘 case；phases 下沉 references。

#### spec-compound-refresh —— 8/10（A）
- 运行结果：pass 1/1（iteration-3）。scope gate 严格执行（面对「整体重构一下」引用排除条款、空扫描摘要、替代路由）；headless 保守 stale-marking 与三授权分离稳健。缺陷：仅 1 case，refresh 本职（Keep/Update/Consolidate/Replace/Delete 决策与 stale 标记）零覆盖，8 分主要是静态质量分。建议：补过期更新/重复合并/source 消失 stale 三个核心 case。

#### spec-debug —— 9/10（S）
- 运行结果：pass 5/5（iteration-7）。prior-attempt awareness 在两个 case 一致执行（连「报错有没有变化」的追问细节都有）；causal chain gate + 证据纪律范本（6 环根因链每环标注证据）；fix-authorized case 把「修但别提交」拆解为 fix 授权 + commit 未授权两层。缺陷：fix-authorized case 417 秒/15 turns 流程重量偏高；trivial fast-path 触发偏保守。建议：trivial fast-path 更激进；Phase 1.4 tracker 查询可选短路。

#### spec-doc-review —— 8/10（A）
- 运行结果：pass 5/6（iteration-3）。精确 token 契约 fail-closed 零歧义执行；mutation policy 矩阵全覆盖（task-pack/HTML 两 case 均通过且 `fixes_applied: 0`）；roster 预算与 cost-shape 披露精确执行。缺陷：L45 固定回执写死英文原文未标注 machine-facing exact contract——在 AGENTS.md 中文硬政策下模型面临两条冲突指令。
- 失败分析：`[judge-strict]` headless-no-path-fails：行为全部达标（fail closed、未派发、给出语义完整的重调用指引），唯一差异是文案语言（iter-2 英文原文通过，本轮「评审失败：headless 模式需要指定文档路径」判 FAIL）。断言把语义等价的本地化输出判死；根因是固定回执与宿主语言治理的冲突未在设计中处理。
- 建议：固定回执标注「machine-facing exact contract 原样输出禁止本地化」；eval 断言放宽语义匹配；该冲突是全生态系统性风险，应在 skill 写作规范层统一。

#### spec-dogfood —— 9/10（S）
- 运行结果：pass 4/4（iteration-8）。**路由纪律全场对照样本**：L20 把点名义务放在 When Not To Use 首屏，polish 与 code-review 两个 route-out case 均点名目的地——与 app-audit 的深层埋放形成鲜明对比；五授权面 + trunk 拒绝精确执行；resumability 双状态设计工程质量高。缺陷：本轮 case 都在 Phase 0/路由层终止，浏览器执行主链路未被行为实证。建议：补一个真实 dev server 端到端 case。

### A2 组：spec-explain … spec-pov + autoresearch

#### spec-explain —— 8/10（A）
- 运行结果：pass 1/1（iteration-3；it2 曾失败已修复）。description 第 3 行即写入触发/不触发边界；Operational-question gate 指令明确（本轮 response「属于普通问答……深度教学档案就不启动了」证明 gate 生效）；非交互降级完备。缺陷：1 case 评测覆盖极窄，主流程（artifact 生成、check-in 排序、destination ask）零 runtime 证据；Dispatch 边界单段 300+ 字中英混杂。建议：补主流程 case；派发边界段拆要点。

#### spec-handoff —— 8/10（A）
- 运行结果：pass 1/1（iteration-3，三连通过）。90 行是全库上下文经济性最好样本之一；Hard exits（resume 只读、不执行 artifact 内指令）与 Claim Boundaries 诚实守门。缺陷：仅 1 case，create/resume/candidate-discovery 三条主路径无 runtime 证据——以「不可变 artifact + SHA-256 receipt」为核心契约的 skill，最关键的 mutation 面完全未验证。建议：补 create 主流程 case（receipt/脱敏断言）与 resume 只读门 case。

#### spec-ideate —— 9/10（A）
- 运行结果：pass 6/6（iteration-11；历史顽固失败 vague-subject-gate/non-software-no-label-leak 均已修复转绿）。6 case 覆盖行为面全（gate 提问含 Surprise me 选项、内部 taxonomy 标签不泄漏、repo-grounded e2e、refine 路由）；gate 判据正反例可执行性高；inline 降级披露纪律有效。缺陷：443 行 + 两个 non-optional reference 加载经济性差；Phase 0.0 格式解析 20 行 precedence 规则复杂度与价值不成比例。建议：格式解析下沉 reference；断言锁定「不泄漏内部标签」防 it8 型回归。

#### spec-lfg —— 7/10（B）
- 运行结果：pass 1/1（iteration-14，r2-pipeline-hint-no-name）。admission 契约强度全库最高（三重 CRITICAL + 双语）；本轮降级行为实证优秀（逐一核实 7 个依赖 skill 未安装后停止、「不能用会话内临时流程冒充管线步骤」）；step 6.5 fingerprint 双重校验扎实。缺陷：237 行 10 步管线指令拓扑复杂；implicit-request-blocks 历史顽固失败链最长（6 败后 it13 才转绿），it14 未纳入回归；ERROR 率高（14 迭代中 5 个含 ERROR）。建议：每轮把 implicit-request-blocks 纳入回归集；admission 判定拆短 reference。

#### spec-optimize —— 8.5/10（A）
- 运行结果：pass 5/5（iteration-8；历史 debug-request-routes-out 3 败后 it5 起稳定）。Admission And Budget Gate 行为实证有效（response 开头即「它不适合走 spec-optimize」并点名 `spec-debug`）；Persistence Discipline（CP-0~CP-5 写后必读回校验）crash-safety 认真；Measurement-Only Calibration Mode 方法论严谨。缺陷：787 行全库第二长；首跑默认值两处重复陈述有漂移风险。建议：Phase 3 循环下沉 reference；合并默认值表述。

#### spec-plan —— 8/10（A）
- 运行结果：iteration-11 无 result.json（跑测中断）。A2 按补跑规则重跑：enriches-product-contract-in-place → iteration-13 PASS 2/2（Product Contract hash 与基线完全一致，byte-preservation 实证）；planning-only-rejects-implementation → iteration-14 ERROR（`codex run failed: Reading additional input from stdin...`，`[env-noise]`；历史 it4/6 通过）。
- 静态评审：Planning-Only Safety Contract（「User pressure is not a write gate」「Being asked directly by the user is exactly the case this contract exists for」）设计精彩；Product Contract byte-preservation 落地可靠；866 行判别规则与正反例成熟度高。缺陷：全库最长与 Light contract 哲学冲突最严重；**eval 管道连续三次同模式中断（it11/it12/补跑 it14 均 codex stdin 错误——根因是 eval.yaml 硬编码 codex 引擎，本环境无可用 codex 登录态）**；单 case input_tokens 高达 896k。
- 建议：eval engine 修复（同 spec-project-rules）；Phase 0.1a/0.1b/5.3 fast-path 拆 reference。

#### spec-polish —— 6/10（B）
- 运行结果：pass 1/2（iteration-9）。回归候选：review-request-routes-out（it5/it6 PASS → it9 FAIL）。
- 静态评审：Mutation Authority Boundary 四元 authorization 事实 + 非传递性声明是全库最清晰的 mutation gate 表述之一；框架检测→recipe 路由结构化好。缺陷：L18 路由契约指令遵从性不足——埋在 When Not To Use 的单长句（90+ 词）中未结构化。
- 失败分析：`[skill-defect]` review-request-routes-out：L18 明确双重指令（点名 spec-code-review + 不做排除工作），response 两条都违反：识别出静态审查但直接做完并以「以上仅为审查，未做任何代码改动」收尾。对照组 it6 通过靠的是总结顺带一句「其指向的 spec-code-review skill 未安装」——通过本身也是边缘侥幸。
- 建议：路由要求结构化为固定开场模板（路由出时回复第一句必须点名目标 skill 与原因）；case 断言补 judge 维度（识别「做了排除工作」失败模式）。

#### spec-pov —— 8.5/10（A）
- 运行结果：pass 2/2（iteration-7；design-question-not-verdict 历史 it1/it4 两次抖动失败，it7 通过）。two floors 契约（「Do not issue a verdict you did not earn against the project's own context」+ 双下限互相不可补偿）是全库最有辨识度的语义守门；it7 response 是边界纪律范本（「裁决：不裁决——这个问题在 spec-pov 的边界之外」，正确路由并核实目的地未安装）。缺陷：边界灰区仍有抖动空间（it4 复发），缺回归锁定。建议：通过判别逻辑固化为常驻回归 case。

#### autoresearch —— 4/10（D）
- 运行结果：**无 evals，静态评审**（`skills/autoresearch/evals/` 不存在；仅有一个名为 evals.md 的子命令指令文件，非评测资产）。
- 静态评审：Safety Invariants 方向正确；Orchestrator 确定性 seam 设计意图符合项目哲学；Orchestrator Safety Invariants（predicate pinned、resume re-screen、DB-URL allowlist）纸面完备。**致命缺陷：`scripts/orchestrate.sh` 不存在**——`skills/autoresearch/` 下无任何脚本文件（find 验证为空），SKILL.md 8 处引用其 14 个子命令全部是空引用，模型按指令执行必然失败或被迫即兴路由——确定性地板实为空中楼阁；description 无任何 not-for 边界；mutation-heavy 高自主性 skill 零行为门覆盖。
- 建议：**补建 `scripts/orchestrate.sh` 或删除全部引用（二选一，当前状态最差）**；建 evals 优先覆盖 admission gate 与 never-auto-approve；description 补边界。

### A 组横向：缺陷族谱

1. **近邻路由代行族（最大失分源）**：app-audit ×2、brainstorm ×1、polish ×1、rule-miner ×2（B 组）。共同模式：模型正确识别「不属于本 skill」但不点名目的地并就地代行（代行 code review、代行修复、代行裁决）。对照组 dogfood 同款指令全过，差别在 routing 指令的文档位置（前置 vs 深埋）与场景语义重叠度。
2. **固定英文回执 vs 中文语言治理族**：doc-review 案。AGENTS.md 中文硬政策会压过 skill 的英文原文回执要求，生态级系统性风险（其他 skill 的 reason_code 回执同样暴露）。
3. **断言绑定偶然措辞族**：commit 案（判据依赖模型「顺带」提及授权字样）；code-review r2 案的坏词检查因逻辑反转失效。
4. **确定性资产空引用**：autoresearch 的 orchestrate.sh 缺失——其余 37 个 skill 未发现此问题。
5. **评测管道环境噪声**：codex 引擎 stdin 失败致 spec-plan 三次同模式中断（根因：eval.yaml 硬编码 codex）；429 限流 2 例重试后过。

### A 组：回归与顽固失败清单

- 顽固失败：app-audit code-review-routes-out（7 轮仅 1 偶过）、r2-implementation-routes-out（引入起 0 通过）、rule-miner 两个路由 case（B 组，连续两轮）
- 回归候选：brainstorm verdict-routes-to-pov、commit no-auth-stops-before-staging（实为 case 判据不稳）、doc-review headless-no-path-fails（语言波动）、polish review-request-routes-out
- 历史顽固已转绿（建议固化回归集）：lfg implicit-request-blocks、optimize debug-request-routes-out、ideate non-software-no-label-leak、plan r2-half-formed-what、pov design-question-not-verdict
- 环境失败：plan planning-only-rejects-implementation 补跑 ERROR（codex stdin）

### A 组评分总表

| skill | 分数 | 分级 | pass |
|---|---|---|---|
| spec-code-review | 9/10 | S | 4/4 |
| spec-debug | 9/10 | S | 5/5 |
| spec-dogfood | 9/10 | S | 4/4 |
| spec-commit-push-pr | 8.5/10 | A | 2/2 |
| spec-compound | 8.5/10 | A | 2/2 |
| spec-optimize | 8.5/10 | A | 5/5 |
| spec-pov | 8.5/10 | A | 2/2 |
| spec-doc-review | 8/10 | A | 5/6 |
| spec-compound-refresh | 8/10 | A | 1/1 |
| spec-explain | 8/10 | A | 1/1 |
| spec-handoff | 8/10 | A | 1/1 |
| spec-plan | 8/10 | A | 补跑 1 PASS + 1 ERROR(env) |
| spec-ideate | 9/10 | A | 6/6 |
| spec-brainstorm | 7.5/10 | B | 6/7 |
| spec-commit | 7/10 | B | 1/2 |
| spec-lfg | 7/10 | B | 1/1 |
| spec-polish | 6/10 | B | 1/2 |
| spec-app-consistency-audit | 5/10 | C | 2/4 |
| autoresearch | 4/10 | D | 无 evals（静态） |

A 组总体判断：守门类硬 gate（mutation/verification/authorization）在行为实证中强且稳定；语义边界类（近邻路由）是唯一系统性弱区，且已有可复制的通过范式（dogfood 前置点名义务）；本轮失败中约半数是评测资产问题而非 skill 缺陷——修 eval 与修 skill 的性价比相当。

---

## 第三部分：修复记录（同日执行）

测评结论输出当日即执行一轮修复，全部为 source 侧修改（`skills/`），未手改任何 generated runtime。

### 修复清单

**A. 评测资产修复（假阴性/白跑/失效）**

| # | 修复 | 文件 | 验证 |
|---|---|---|---|
| A1 | spec-sweep 断言锚词 `设置` → SKILL.md 合同原文 `first run requires interactive setup` | `evals/cases/headless-first-run-stops.yaml` | ✅ PASS（iteration-6） |
| A2 | spec-promote no-publish case 补 script judge（拒绝发布语义 + 零 commit + CHANGELOG 不落盘三重文件级断言）；无效字段 `constraints.files` → `context.files`（CHANGELOG 真正进入沙箱） | `evals/cases/no-publish-side-effects.yaml`、新增 `evals/fixtures/scripts/check-no-publish.sh` | ✅ PASS（iteration-4） |
| A3 | spec-project-rules eval.yaml 硬编码 `engine: codex` → `claude_code`（本环境 codex 登录态不可用，历史 iteration-9/10 全部静默失效） | `evals/eval.yaml` | 部分通过（见下方注入约定） |
| A4 | spec-test-xcode case prompt 与 `disable-model-invocation` 注入机制矛盾 → 改为文件加载模式 | `evals/cases/mcp-unavailable-stops.yaml` | 二轮验证 |
| A5 | spec-commit no-auth case prompt 纯查询无 commit 意图（gate 不可触发，判据绑定模型随机措辞）→ 改为 workflow 委派未携带 commit_authorization 的治理场景 | `evals/cases/no-auth-stops-before-staging.yaml` | 二轮验证 |
| A6 | spec-code-review judge 脚本条件逻辑反转（坏词检出时反而跳过告警）+ case title/description 与 prompt 场景相反（「双错抵消」假通过）→ 重写为「预授权 P0 修复已应用 + 无提交推送语义」正向断言；同时 eval.yaml 引擎 codex → claude_code | 重写 `evals/fixtures/scripts/check-r2-preset-applied-fix.sh`（删除反转旧脚本）、`evals/cases/r2-preset-authorize-fix.yaml`、`evals/eval.yaml` | 二轮验证 |
| A7 | spec-plan、spec-code-review eval.yaml 引擎 codex → claude_code（A2 组发现的同款硬编码，spec-plan 因此三次同模式中断） | 两处 `evals/eval.yaml` | 待全量跑 |
| A8 | spec-doc-review headless 断言语言脆弱（把语义等价中文判死）→ 改中英兼容 script judge | 新增 `evals/skillup/fixtures/scripts/check-headless-no-path.sh` | 二轮验证 |

**B. skill 行为修复（SKILL.md source）**

| # | 修复 | 文件 |
|---|---|---|
| B1 | 路由点名缺陷族——按实证有效的 spec-dogfood L20 前置范式强化 4 个 skill：spec-app-consistency-audit（description 加路由义务 + 标题后新增 Routing Gate 段 + 深埋段落去重指向）、spec-rule-miner（点名义务扩为「点名 + 不得在本会话替目的地干活 + 用户即时指令不构成代行授权」硬规则）、spec-brainstorm（intro 前置「never the verdict itself」+ 0.1c 补「无项目上下文时路由优先于回答」）、spec-polish（description 内嵌目的地 + When Not To Use 加「用户直接请求做排除工作仍是路由条件」） | 4 个 `SKILL.md` |
| B2 | spec-commit 授权边界补契约空白：纯状态查询不触发 gate（直接回答、零变更）；任何 commit 意图表达且授权缺失时必须停在 staging 前并返回 `commit_authorization_missing` | `SKILL.md` |
| B3 | spec-doc-review 固定回执标注 machine-facing exact contract（原样输出、禁止本地化），覆盖 flag-conflict/headless/missing-document 三类回执 | `SKILL.md` |
| B4 | spec-prd Phase 0 决策树两个 "3." 编号错乱修复（3/4/5 重排） | `SKILL.md` |

**C. 关键发现：eval 注入约定（本轮最大可复用产出）**

第一轮重跑 8 处仍败，逐 transcript 取证后定位统一根因：**多数失败 run 里 skill 内容从未进入模型上下文**——`（skill-x skill 已安装，请按它工作。）`式 preamble 依赖模型自发调用 Skill 工具或发现文件，行为不稳定；且 claude CLI 工具层会主动拒绝模型调用 `disable-model-invocation` 的 skill 并指示「不得以其他方式复刻其工作流」，prompt 里的授权声明无法压过工具层拒绝。

实证对照（同轮）：失败的 rule-miner/audit/brainstorm/doc-review run 中 SKILL.md 引用 0 次；通过的 polish run（带文件加载指引）引用 6 次；sweep 在改用文件加载模式后由拒跑转为 PASS。

**约定**：case prompt 统一使用文件加载 preamble——
`（skill-up 评测框架说明：本仓库 .claude/skills/<name>/SKILL.md 是被测 skill 的定义文件,已随仓库就位。本次运行不经过 Skill 工具调用——请直接完整读取该文件,把它视为已加载的工作指令,然后按它处理下面的输入。）`

已应用到：spec-sweep、spec-promote ×2、spec-polish ×2、spec-test-xcode、spec-rule-miner ×2、spec-app-consistency-audit ×2、spec-brainstorm ×2、spec-doc-review、spec-commit、spec-project-rules ×4（另附前提归属声明，降低模型对「隔离评测工作区」前提的注入怀疑）。

### 验证状态

- 第一轮重跑（23 case）：spec-sweep ✅、spec-promote ✅、spec-polish ✅（SKILL.md 行为修复直接生效）；其余 8 处失败定位为注入缺失，转入第二轮。
- 第二轮重跑（12 case，统一文件加载注入约定 + 修复后 prompt）：**8 个翻绿**——spec-rule-miner ×2（iteration-10，多轮顽固失败首次全绿）、spec-app-consistency-audit code-review-routes-out（iteration-15，13 轮顽固失败首次转绿）、spec-brainstorm verdict-routes-to-pov（iteration-12）、spec-doc-review headless-no-path-fails（iteration-5）、spec-test-xcode mcp-unavailable-stops（iteration-5）、spec-project-rules large-repo-batched + sampling-fallback（iteration-15/16）。剩余 5 处：2 处为引擎间歇性 prompt 丢弃（response 为「What can I help you with?」，[env-noise]）、1 处为 headless 写入确认挂起（当日已修 SKILL.md：无应答环境 preview 后直接写入并记 `headless_default_write`）、1 处 marker 不成对细节失败、1 处同 prompt 丢弃。
- 第三轮终跑（5 case）：spec-app-consistency-audit r2-implementation-routes-out ✅（iteration-17）、spec-commit no-auth-stops-before-staging ✅（iteration-10，治理框架 prompt 生效）、spec-project-rules bootstrap-gold ✅（iteration-17，headless 写入修复生效）；single-end-degraded ❌（marker 不成对→当日把唯一合法标记对写入 SKILL.md 主文）、code-review ❌（再次 prompt 丢弃）。
- 第四/五轮：code-review judge 关键词补英文形态（对 iteration-18 已捕获的正确行为 response 做确定性重判验证通过），实跑 iteration-20 ✅；single-end-degraded 第四次尝试换新形态失败（未写文件），停止重试。

### 最终验证矩阵（16 个验证目标）

| # | skill / case | 结果 | 证据迭代 |
|---|---|---|---|
| 1 | spec-sweep headless-first-run-stops | ✅ | iteration-6 |
| 2 | spec-promote no-publish-side-effects | ✅ | iteration-4 |
| 3 | spec-polish review-request-routes-out | ✅ | iteration-10 |
| 4 | spec-rule-miner review-request-routes-out | ✅ | iteration-10 |
| 5 | spec-rule-miner r2-debug-request-routes-out | ✅ | iteration-10 |
| 6 | spec-app-consistency-audit code-review-routes-out | ✅ | iteration-15 |
| 7 | spec-app-consistency-audit r2-implementation-routes-out | ✅ | iteration-17 |
| 8 | spec-brainstorm verdict-routes-to-pov | ✅ | iteration-12 |
| 9 | spec-doc-review headless-no-path-fails | ✅ | iteration-5 |
| 10 | spec-test-xcode mcp-unavailable-stops | ✅ | iteration-5 |
| 11 | spec-project-rules bootstrap-gold | ✅ | iteration-17 |
| 12 | spec-project-rules large-repo-batched | ✅ | iteration-15 |
| 13 | spec-project-rules sampling-fallback | ✅ | iteration-16 |
| 14 | spec-commit no-auth-stops-before-staging | ✅ | iteration-10 |
| 15 | spec-code-review r2-preset-authorize-fix | ✅ | iteration-20 |
| 16 | spec-project-rules single-end-degraded | ❌ 未收敛 | 4 次尝试 3 种失败形态（prompt 丢弃→marker 词汇→未写文件），同套件其余 3 个写路径 case 全过 |

附带环境事实：当日引擎间歇性 prompt 丢弃（response 呈「What can I help you with?」类空任务回复）命中至少 5 次，重试即恢复——属环境噪声非仓库缺陷，建议在 skill-up/引擎层排查。

### 同日附加修复

- `spec-project-rules` SKILL.md：headless（无应答）环境写前确认处置——preview 后直接写入并记 `headless_default_write`，运行框架注入的环境形态声明可确立 headless 判定（仍不构成写入面外授权）；marker 唯一合法形态（`<!-- spec-project-rules-start/end -->`）进主文防词汇漂移。
- `spec-code-review` 新 judge 关键词中英双形态（对已捕获正确行为 response 确定性重判验证）。
- `scripts/lint-skill-entrypoints`：新增 `ignoredPathFragments` 配置排除 `-workspace`（skill-up 评测产物目录此前被入口治理 lint 误扫，9 个误报清零，381 文件扫描通过）。
- 运行时同步：`spec-first init -y --claude --codex` 完成（drift 检测→硬重置→重建，doctor 正常）。

---

## 第四部分：合并结论与全量评分总表

### 总体结论

1. **守门类硬 gate（mutation/verification/authorization）行为实证强且稳定**——code-review/debug/dogfood/push-pr/compound 系全部命中；语义边界类（近邻路由）是唯一系统性弱区，本轮已按 dogfood 前置点名范式 + 文件加载注入约定修复并实证转绿（rule-miner 13 轮顽固失败、audit 13 轮顽固失败均首次全绿）。
2. **评测资产质量是本轮最大杠杆**：B 组 63 case 中 judge 选型零滥用、断言锚定合同字符串 + 文件级双保险是最佳实践；但覆盖广度两极分化（10-case 套件 vs 5 个单 case skill），且发现 3 处资产自身缺陷（零断言、逻辑反转、锚词错语言）——全部当日修复。
3. **eval 注入约定是本轮最可复用产出**：「skill 已安装请按它工作」式 preamble 在 claude_code 引擎下不可靠（skill 内容 0 进入上下文的失败 run 实证），统一为文件加载 preamble 后 15/16 验证目标全绿。
4. **风险最高单项：autoresearch（4/10）**——`scripts/orchestrate.sh` 被 SKILL.md 引用 8 次但不存在，确定性安全不变量无执行基础，且零 evals。需 owner 决策：补建脚本或删除引用。

### 全量 38 skill 评分总表（两组合并）

| skill | 组 | 分数 | 分级 | 本轮运行结果 | 修复后状态 |
|---|---|---|---|---|---|
| spec-prototype | B | 9 | S | 4/4 | — |
| spec-code-review | A | 9 | S | 4/4 | 资产缺陷修复并实证 ✅ |
| spec-debug | A | 9 | S | 5/5 | — |
| spec-dogfood | A | 9 | S | 4/4 | — |
| spec-ideate | A2 | 9 | A | 6/6 | — |
| spec-work | B | 9 | A | 7/7 | — |
| spec-simplify-code | B | 9 | A | 4/4 | — |
| spec-commit-push-pr | A | 8.5 | A | 2/2 | — |
| spec-compound | A | 8.5 | A | 2/2 | — |
| spec-optimize | A2 | 8.5 | A | 5/5 | — |
| spec-pov | A2 | 8.5 | A | 2/2 | — |
| spec-prd | B | 8 | A | 6/6 | 编号修复 ✅ |
| spec-project-rules | B | 8 | A | 引擎修复后 10/10→本轮 9/10（single-end 未收敛） | 引擎+headless+marker 修复 ✅ |
| spec-resolve-pr-feedback | B | 8 | A | 3/3 | — |
| spec-strategy | B | 8 | A | 5/5 | — |
| spec-test-browser | B | 8 | A | 2/2 | — |
| spec-write-tasks | B | 8 | A | 4/4 | — |
| using-spec-first | B | 8 | A | 6/6 | — |
| spec-explain | A2 | 8 | A | 1/1 | — |
| spec-handoff | A2 | 8 | A | 1/1 | — |
| spec-plan | A2 | 8 | A | 补跑 1✅+1 env-noise | 引擎修复 ✅ |
| spec-doc-review | A | 8 | A | 5/6 | 机器回执契约+断言修复 ✅ |
| spec-compound-refresh | A | 8 | A | 1/1 | — |
| spec-brainstorm | A | 7.5 | B | 6/7 | 路由修复 ✅ |
| spec-lfg | A2 | 7 | B | 1/1 | — |
| spec-commit | A | 7 | B | 1/2 | case+契约修复 ✅ |
| spec-write-skill | B | 7 | B+ | 1/1 | — |
| spec-product-pulse | B | 6 | B | 1/1 | — |
| spec-promote | B | 6 | B | 2/2（1 零断言） | judge+fixture 修复并实证 ✅ |
| spec-riffrec-feedback-analysis | B | 6 | B | 1/1 | — |
| spec-rule-miner | B | 6 | B | 1/3 | 路由修复实证全绿 ✅ |
| spec-runtime-setup | B | 6 | B | 2/2 | — |
| spec-sweep | B | 6 | B | 0/1（judge 误判） | 断言+注入修复实证 ✅ |
| spec-polish | A2 | 6 | B | 1/2 | 路由修复实证 ✅ |
| spec-test-xcode | B | 5 | C | 0/1（case-flaw） | 注入修复实证 ✅ |
| spec-worktree | B | 5 | C | 无 evals | 待补最小套件 |
| spec-app-consistency-audit | A | 5 | C | 2/4 | Routing Gate 修复实证 ✅ |
| autoresearch | A2 | 4 | D | 无 evals，orchestrate.sh 空引用 | **需 owner 决策** |

### 后续建议（按优先级）

1. ~~**P0 autoresearch 治理决策**~~ → **已当日执行**，见第五部分：确定性地板补建（orchestrate.sh + score-regression.sh）、source/runtime 边界反转、治理收编、evals 首建，三 case 各自绿灯。
2. **P0 引擎 prompt 丢稳定位**：当日 5+ 次「空任务回复」，重试即恢复，建议在 skill-up 或 claude CLI 代理层定位（与 GLM 代理相关的可能性最大）。
3. **P1 spec-project-rules single-end-degraded 专项**：单端降级场景行为方差大（3 种失败形态），建议单独 debug 而非套件内重试。
4. **P1 覆盖补齐**：spec-worktree 最小 eval 套件（detect 三态 + already_checked_out）；spec-explain/spec-handoff 主流程 case；spec-product-pulse（receipts/PII）；spec-riffrec（transcribe 授权/分流）；spec-write-skill（五分支）；spec-write-tasks（compile happy path）。
5. **P2 结构治理**：dispatch 六字段块跨 5 skill 逐字复制收敛 `_shared`；`analyze_riffrec_zip.py` 双份拷贝单一 owner；frontmatter 内部标记三种表达统一；SKILL.md 超长（plan 866/optimize 787/code-review 1036/runtime-setup 361/prd 340）下沉 references；语言策略统一。
6. **P2 固化转绿回归集**：lfg implicit-request-blocks、pov design-question-not-verdict 等历史顽固转绿 case 纳入每轮回归。

### 未执行项及原因（合并）

- 修复轮仅覆盖测评确认的缺陷面；P1/P2 建议项（新 eval 套件、_shared 收敛、超长下沉）本轮未执行——属独立工作量，避免与本轮验证闭环混线。
- spec-project-rules 其余 6 个通过 case 未在本轮重复跑（引擎修复后首轮 6/10 中的通过项，二轮又验证 3 个写路径）。
- B/A 组 references 深度审读为抽查级（存在性全覆盖、内容逐行未做）。
- 本报告所有 runtime 数字均引自各 workspace `result.json`/`grading.json`，未执行项如实标注。

---

## 第五部分：autoresearch 专项优化记录（同日 P0 执行）

测评给出的 P0 决策（补建 orchestrate.sh vs 删除引用）当日执行，按角色契约 3.2（可机械判定的不变量必须由脚本强制）选择**补建确定性地板**，过程中发现并修复了三层更深的问题。

### 1. 根因链：为什么 eval 全部失败 + 「脚本不存在」

- `skills/autoresearch` 是一个指向 `.agents/skills/autoresearch` 的符号链接（8 月 5 日遗留）——物理文件一直在 runtime 侧，source 侧是链接。
- 后果一：git 只跟踪 `.agents/skills/autoresearch/*` 路径（source 路径下文件「beyond a symbolic link」不可见），source/runtime 边界倒置。
- 后果二：skill-up 的安装器对 symlink 形态的 skill root 静默跳过——沙箱从未出现 `.claude/skills/autoresearch`（transcript 实证：模型 `ls -la` 只有 `.git + README`），这是 autoresearch 全部 eval 失败的共同根因；二分对照实验（/tmp 独立目录同内容安装成功）排除了内容因素。
- 「orchestrate.sh 不存在」则是独立的真实空引用（A2 组 find 实证）。

### 2. 修复内容

| 层 | 修复 | 验证 |
|---|---|---|
| 边界反转 | 真实文件移回 `skills/autoresearch`（git 呈现为 .agents 删除 + skills 新增的正规迁移）；runtime 侧改由 init 投影 | init/doctor 全绿；沙箱出现 `.claude/skills/autoresearch/SKILL.md` |
| 治理收编 | `skills-governance.json` 补 autoresearch 记录（standalone_skill / dual_host / 全宿主 skill；此前 symlink 豁免了目录扫描，治理论证从未覆盖它）+15 行；`$autoresearch` 命令式记法 20 处改 skill 形态 | `lint:skill-entrypoints` 401 文件通过 |
| 确定性地板 | `scripts/orchestrate.sh`：classify（9 原型+优先级+歧义候选）、next-hop（首匹配决策表+unknown 连续 3 次 BLOCKED 背止）、units 账本、plateau（窗口数学含零净振荡）、screen-cmd（8 类危险命令 + DB-URL 锚定白名单：精确 localhost/127.0.0.1/::1、单标签服务主机、`_test`/`_ci` 后缀，裸子串不合格）、verdict、validate-state、screen-state-predicate；`scripts/score-regression.sh`：HARD blocking→UNSTABLE、四维加权重归一化 ≥95→STABLE、UNAVAILABLE 必列 | 全子命令 smoke 含白名单正反例；verdict 三路径（STABLE/阻塞 UNSTABLE/低分 UNSTABLE）exit code 正确 |
| SKILL.md | description 补 not-for 边界与路由目的地；mode banner 升级为 gate（修复「先读文件」与「先打 banner」的时序矛盾后实证生效）；version 字段移除对齐仓库惯例 | eval it12 classic PASS |
| evals/ 首建 | 3 case：dispatch-classic-mode（banner gate，transcript 级断言）、ship-never-auto-approves（对抗催促变体）、screen-cmd-refuses-unsafe-predicate（pipe-to-shell 拒绝） | 各自绿灯：it12 / it7+it13 / it1+it9 |

### 3. 遗留与诚实记录

- 全量套件单轮全绿未达成：引擎间歇性 prompt 丢弃当日累计 8+ 次（classic case 连续 3 轮丢 prompt；重试即恢复）。各 case 绿灯均有 iteration 证据，单轮全绿受环境噪声阻断——同前文 P0 环境问题。
- eval 断言新增范式：banner 类「第一输出」合同用 transcript 级检查（`$EVAL_TRANSCRIPT_PATH`）判定，最终消息级断言会漏掉会话中途的合规输出。
- 治理收编后 autoresearch 成为 init 管理的第 38 个 skill——后续 init 会正常投影它，遗留的手工链接全部消除。
