# spec-prd 评审（R1）

**评审对象**：`skills/spec-prd/`（worktree 5b59293b，只读静态审查 + 代表性消费者抽样）
**读取范围**：SKILL.md（347 行全读）、9 个 references 全读、4 个 scripts 全读（含 reason-codes.js）、`assets/templates/00-generic.md`、`70-large-requirement-index.md`、`overlays/securities.md` 头部、evals 清单与 3 个 case 抽样、`skills/spec-plan/references/intake.md`（H01 消费侧）、`templates/claude/hooks/prd-{prewrite,readiness}-guard` 关键行、消费者测试 19 个中 9 个的导入与用例名。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-prd/SKILL.md:208,210,212-224; references/prd-readiness-lens.md:47-61 | 每条硬约束都能回指真实失败（232726/231339 checkpoint 逃逸、2026-06-28 读后直写），黑名单逐条带 observable trigger 与 recovery，未发现无依据的补丁式约束 |
| D02 | pass | references/evidence-and-topology.md:113-127,169-183; references/domain-language-and-decision-ledger.md:39-53; assets/overlays/securities.md:1-15 | 编码了拓扑精度风险表、按拓扑分型的 owner question ladder、术语治理两条纪律、证券 overlay（带"示例须确认"边界）等真实领域知识；脚本/LLM 职责在 reason-codes.js:1-11 与 SKILL.md:283 显式分工 |
| D03 | pass | scripts/check-prd-artifact.js:1603-1607; scripts/finalize-prd-artifact.js:434-441; scripts/lib/reason-codes.js:15-54; templates/claude/hooks/prd-readiness-guard:52,60 | 验证门由确定性脚本拥有（exit code 由 `should_block_closeout` 驱动），blocking 码单一真相源，prose 只复述且被 freeze/parity 测试锁定；宿主强制差异诚实降级（SKILL.md:25,277-281），实际加载阻断留待版本绑定运行证据——该边界由 skill 自身声明，静态层承诺一致 |
| D04 | pass | skills/spec-plan/references/intake.md:42-46,68-82; SKILL.md:57-59,279; tests/unit/spec-prd-plan-handoff-contracts.test.js:16-31 | PRD→Plan 边真实存在：spec-plan 按 legacy origin 全量继承 problem frame/actors/AE/OQ（含 blocking vs deferred），检查 `checkpoint-prd`/`can_enter_spec_plan`/Handoff Slice；receipt 双方一致约定为 optional 诊断而非消费者硬门 |
| D05 | pass | SKILL.md:200-210（Canonical 单一真相源）; references 各文件以指针引用未复述四元组 | 关键规则可定位、内部一致；但存在 4 处可维护性残余（见 Findings 1-4），均为 P3 不构成 fail |
| D06 | pass | SKILL.md:70-76,23,277-281; references/product-analysis-lite.md:1-7; evals/contract-reset-protocol.md（三臂/fresh-session/model profile 冻结） | 能力假设显式（blocking tool 缺失的三级降级梯）、宿主强制矩阵诚实标注 degraded、Lite 为 opt-in 评估分支而非自然语言推断激活；未因单模型执行降格 |
| D07 | pass | references/prd-readiness-lens.md:47-61; SKILL.md:212-224; references/grill-with-docs-integration.md:143-156; evals/cases/*.yaml | 问题→修订→复验链成文（observed failure → 反模式 → checker 码 → eval 回归 case）；知识晋升 candidate-only 且强制 invalidation condition + real consumer |
| D08 | pass | SKILL.md:122-134（Reference Trigger Map）,136-158（Template Trigger Map）,23; references/prd-readiness-lens.md:35; references/prd-output-template.md:548-550 | 按需加载双层触发图 + "core pack 恒跑、条件 pack 按触发"的 prompt economy 规则 + 脚本先播种确定性计数避免 LLM 重算；Lite 单 Brief 压缩三视图 |
| B01 | pass | SKILL.md:3-4（正负触发路由）,232-233; evals/cases/zero-one-routes-to-brainstorm.yaml, skillup/cases/r2-bugfix-routes-out.yaml | 正向触发、相似入口负例（0-1→brainstorm、fix→spec-debug 点名路由）、helper 不暴露为公共入口（SKILL.md:66-68）均有源码与 eval 覆盖 |
| B02 | pass | SKILL.md:29-59,164-168,174-196; references/prd-output-template.md:23-43 | 入口/reference/script/template/consumer 五层一致（frontmatter 契约、Decision Card 字段与 checker 解析逐一对得上）；推断性标注（Qoder unverified）未伪装 owner 决策 |
| B03 | pass | SKILL.md:168（输入不可信）,239（validate report-only）,224（禁 runtime mirror patch）; evals/cases/injection-in-input-untrusted.yaml | 材料内嵌指令不产生授权（有注入 eval case），validate 不落盘不修复，无 commit/push 面，Lite 保持单一人类确认入口 |
| B04 | pass | SKILL.md:224; templates/claude/hooks/prd-prewrite-guard, prd-readiness-guard; tests/unit/spec-prd-hook-contracts.test.js:134,345 | 真相源 `skills/spec-prd/**` 明确，hook 经 templates 投射且有 Claude/Qoder parity 测试，"无确认硬强制的宿主描述为 degraded"有测试锁定；不手改镜像 |
| B05 | pass | SKILL.md:72-76,293-295,344; scripts/finalize-prd-artifact.js:157-172; templates/claude/hooks/prd-readiness-guard:67-73 | 工具缺失/超时/降级/重复执行（原子写 + hash receipt）/中断恢复（checkpoint+resume-prd）各有明确处理；finalize 无法运行时禁止声称 ready 并降级 |
| B06 | pass | SKILL.md:325-347; references/prd-output-template.md:525-550; check-prd-artifact.js:1420-1457 | Phase 4 强制门、closeout 清单（含 finding count/reason_codes/receipt/readiness_outcome）、doc-review 三触发信号（SKILL.md:331）、LLM-owned 行与脚本计数显式分离 |
| X01 | pass | SKILL.md:237,321; assets/templates/70-large-requirement-index.md; references/large-input-checkpoint.md; references/prd-output-template.md:455-479,563-593 | 超大需求有 owner 确认拆分、Feature Slices、Map-Reduce checkpoint 写入与 resume 纪律，且拆分不做 packet infrastructure |
| X02 | pass | references/evidence-and-topology.md:126,140-163; scripts/check-prd-artifact.js:1609; tests/unit/spec-prd-finding-schema-freeze.test.js | contract-change 拓扑 + Producer/Consumer + SoT Resolution + negative space 覆盖接口变化；自身 schema 三处版本化且 freeze 测试锁定；prose 32+4 码与 BLOCKING_REASON_CODES 36 项经核对无漂移 |
| X03 | pass | references/prd-output-template.md:398; assets/overlays/securities.md:7-15; assets/templates/00-generic.md:205-215,300-308,246 | regulated 档语义、证券 overlay 确认前置、会签/数据合规/回滚感知等高风险面齐备；负面验收（Negative Acceptance）与"不虚构目标值"规则在位 |
| X04 | pass | SKILL.md:289; references/prd-output-template.md:434-447; SKILL.md:236（resume 保 spec_id/IDs）; references/grill-with-docs-integration.md:143-156 | Handoff Context Slice、Owner Decision Trace 逐 OQ 绑定、resume 保 ID、知识 candidate 带 freshness/invalidation，跨会话交接字段完整 |

## Findings

1. **[P3·D05/D08] 悬空枚举值 `ai-executable-product-clarification`**
   - 位置：`skills/spec-prd/SKILL.md:181`
   - 后果：该 `clarification_profile` 值在全 skill（含 references、scripts、tests 抽样）仅此一处出现，无定义、无触发条件、无消费者；执行模型只能猜语义或忽略，字段形同虚设。
   - 最小修复：删除该值，或在 SKILL.md 一句话定义其适用输入形态。

2. **[P3·D05] `can_enter_spec-plan`（连字符）与 `can_enter_spec_plan`（下划线）混用**
   - 位置：连字符见 `SKILL.md:94,120,206,223,275,291`；下划线见 `SKILL.md:25,341`、`references/prd-output-template.md:275`；checker 用 `can_enter_spec[-_]?plan` 双收（`scripts/check-prd-artifact.js:1153`）。
   - 后果：功能不断（正则兼容），但"两种拼写等价"未在任何文档声明，读者/维护者可能当成两个字段；prewrite-guard 提示文案（`templates/claude/hooks/prd-prewrite-guard:102,108`）只用下划线，进一步强化了不一致观感。
   - 最小修复：SKILL.md 统一为下划线，或在 Decision Card 字段表处注明双拼写等价及兼容原因。

3. **[P3·D05/D07] Canonical 停止点规则在 SKILL.md 内部 6+ 处复述**
   - 位置：`SKILL.md:91,198,204-206,267,275`（"relentless by default… stop only at a legal stop point"重复展开）；references 侧合规（如 `evidence-and-topology.md:183`、`domain-language…:91` 仅指针引用）。
   - 后果：本次核对未发现语义漂移，但未来修订任一处而漏改其余会产生真实矛盾；也抬高阅读成本。
   - 最小修复：主文件内非 Canonical 位置收敛为"按 Canonical 执行 + 一句该场景差异"。

4. **[P3·D05] 超长单段损害可审计性**
   - 位置：`SKILL.md:269`（Phase 1 Requirement Analysis Gate 段，约 600 词单段，混合触发、最小映射 12 字段、6 个 gate、阻断后果）；`SKILL.md:341`（约 450 词，混合 finalize 用法、hook 契约、hash 政策、本地化锚点）。
   - 后果：定位单条规则（如"design inventory 哪些项 block final-prd"）需整段重读；对 Stop-hook 循环修复场景尤其贵。
   - 最小修复：按"触发→最小映射→阻断后果"拆为列表；不改变语义。

5. **[P3·D03] source 类 disposition 的证据列位置未文档化**
   - 位置：`SKILL.md:283` 只说需要 "a checkable ref"；checker 实际只扫 OQ 行的 `prd_write_target` 与 `recommended_default` 两格（`scripts/check-prd-artifact.js:785-789`），而 `prd_write_target` 通常是节名（不形似 ref），证据事实上只能放最后一格；remediation hint（:1431）也未指明位置。
   - 后果：模型把 ref 写进 question 或写目标格会被 `open_oq_without_owner_closure` 阻断，需试错一轮才发现正确落点。
   - 最小修复：在 SKILL.md 剃刀段或模板 OQ 表头注一句"source 类证据写入 recommended_default/deferred_reason 列"。

6. **[P3·D04 观察] spec-plan 将 spec-prd 产物定位为 legacy origin，spec-prd 文档未登记该口径**
   - 位置：`skills/spec-plan/references/intake.md:42-46`（"A current `spec-prd` artifact is consumed as the legacy shape… Do not add a future `product_contract_source: spec-prd` unified origin"）vs `SKILL.md:57-59`（列 spec-plan 为 Downstream Consumer，未提及 legacy 降级）；该安排已被 `tests/unit/spec-prd-plan-handoff-contracts.test.js:16` 显式接受。
   - 后果：非功能缺陷（消费边真实且被测试锁定），但"主链路·需求定义"的读者会误以为 PRD 是 plan 的第一优先 product contract 来源，而 spec-plan 的首选发现序是 spec-brainstorm unified plan。
   - 最小修复：在 SKILL.md Downstream Consumers 或项目主链路文档登记"spec-plan 以 legacy shape 消费 PRD"的既定口径；保持现状亦成立。

## 主责深挖面发现（D01-D05 + D08）

- **D01（去补丁化）**：约束普遍带设计依据——四停止点的"非停止理由"清单明确列出四个伪停止话术（SKILL.md:204）正是对 232726/231339 失败模式的对症封堵；Lite 用 exact token 激活防自然语言误触发（SKILL.md:23,235）。未发现过时或互相矛盾的约束；唯一"过度指导"嫌疑是停止点规则的高频复述（Finding 3），属冗余而非矛盾。
- **D02（领域知识）**：最强的部分是拓扑分型知识（10 种拓扑各自的 "PRD precision risk"，evidence-and-topology.md:115-127）与按拓扑分型的 owner 提问梯（:172-183）——这是"plan 会 invent 什么"的领域经验结晶，不是流程口号；证券 overlay 全程带"行业示例须 source/用户确认"边界，防止模板知识冒充项目事实。模型/脚本分工在 reason-codes.js 注释、checker 头注、finalize exit-code 语义三处一致。
- **D03（验证门）**：深挖了 checker→finalize→Stop hook 链条的闭环：check-only 下 final intent 无 receipt 会阻断（finalize:189-194）与 SKILL.md:25 声明一致；checkpoint 是合法 non-ready 出口（`can_closeout=true, can_finalize=false`，finalize:225-236）且注释解释了为何 ask-owner-first 不享受该豁免；receipt hash 先剥离 machine 字段再计算（check-prd-artifact.js:250-271），保证重复 finalize 幂等。静态层无缺口；残余见 Finding 5（证据列落点）。
- **D04（衔接）**：除逐项表证据外，核对了字段级继承：spec-plan 要求保留 blocking/deferred 区分的 OQ（intake.md:81）、检查 `can_enter_spec_plan: no` 类用户控制信号（intake.md:82,133）——与 spec-prd 的 checkpoint 契约严丝合缝。见 Finding 6 的拓扑口径观察。
- **D05（紧凑性）**：四条 P3（Findings 1-4），无正确性问题；Canonical 单一真相源 + references 指针化的纪律执行良好，问题集中在主文件内部的重复与长段。
- **D08（上下文效率）**：双层 Trigger Map 与 references 各自的 "Load this reference only when…" 头部逐一对得上（9/9 一致）；模板按需组合（每 run 只读 00-generic + 1 个 primary surface）；Lite 把三张并行分析图压成单 Brief。反向问题即 Finding 3/4：SKILL.md 自身的重复在多次 Stop-hook 往返中会被反复重读，是效率的净损失面。

## 未读文件

- `assets/templates/10-app.md`、`20-admin.md`、`30-backend.md`、`40-h5-pc.md`、`50-cli-devtool.md`、`60-mixed.md`——理由：正文骨架资产，组合规则已由 Trigger Map 与 `spec-prd-template-assets.test.js` 锁定；未覆盖后果：surface 模板内部与 00-generic 的局部措辞冲突可能漏检。
- `evals/` 的执行器与治理文件（`run-evals.js`、`run-contract-reset-arm.js`、`prepare-contract-reset-evidence.js`、`lib/*`、`examples.json`、`contract-reset-candidate.patch`、`evaluation-governance.md`、fixtures/repos 正文）——理由：本轮聚焦 skill 源码与消费者契约；未覆盖后果：eval 基础设施自身缺陷不在本轮结论内，D06/D07 的行为层证据采信源码内成文记录。
- 19 个消费者测试中 10 个未打开（如 `command-resource-path-rewrite`、`dispatch-authorization-matrix-contracts`、`requirements-language-promotion-contracts`、两个 contract-reset integration）——理由：抽样已确认消费者锚定真实源码；未覆盖后果：这些测试锁定的个别 prose 字符串断言未逐条核对。
- `docs/contracts/workflows/mutation-enforcement.md`、`scenario-capability-matrix.md` 全文——理由：仅作被引用合同确认存在；未覆盖后果：宿主强制能力与场景能力矩阵的细节采信 SKILL.md 转述，未独立复核。
- `src/cli/` 中 hook 投射实现（`claude-settings.js`、`qoder-settings.js`、adapters）——理由：以 templates + parity 测试作投射证据；未覆盖后果：多宿主生成逻辑的边角（如 ZCode/Pi）未逐一验证。

## 结论一句话

spec-prd 静态层 18 项全数 pass、无 fail：确定性验证门（checker/finalizer/hook 闭环）、经验驱动的反模式封堵与双层按需加载机制内部一致且逐条可定位，残余为 5 项 P3 可维护性问题（悬空枚举、拼写混用、规则复述、超长段落、证据列落点未文档化）加 1 项跨工作流拓扑口径观察，均不阻断，行为层兑现仍需按已登记的 eval/fresh-source 路径另行取证。
