交接面确认。我已经掌握全部必需材料，现在产出评审报告。

# spec-commit-push-pr 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:24（description-only 跳过 Step 1 决策树的反过度指导条款）、pr-description-writing.md:11-18（restating the diff 是默认失败模式）、:159-169（concept 候选默认 absence、成本有界） | 规则均带对应的真实失败归因（stale base、fork 误配、diff 复述、过度教学），无过时约束迹象 |
| D02 | pass | commit-and-push.md:56（Co-authored-by 移植规则与中文项目惯例）、:58（publishing gate + release-surface reconciliation 挂本仓 `npm run test:release:governance`）、compose.md:21-26（`.spec-first/config.local.yaml` 本地合同） | 沉淀的是项目级真实约束（发布治理、署名、教学开关），非泛泛最佳实践 |
| D03 | pass | SKILL.md:14（双授权 stop gate)、commit-and-push.md:58（pre-push gate 停在外部写入前）、apply-and-handoff.md:77-79（create/edit 后 read-back 验证远端 title/body 与 head/base SHA) | 验证点明确且锚定确定性事实（exit code、远端回读），语义判断未被冒充为机械判定；但全部为 prose 约定，无脚本硬强制，测试仅做文本断言 |
| D04 | pass | SKILL.md:113-124（watch_handoff 结构）、spec-lfg/SKILL.md:68-77（授权四元组传入）、tests/unit/pipeline-mode-contracts.test.js:49-62（双向断言交接字段） | LFG→helper 授权交接与 helper→LFG watch_handoff 均有源码与 contract test 双向固定 |
| D05 | pass | SKILL.md 全文 133 行；pr-description-writing.md:389 行但分步清晰（Pre-A→H);SKILL.md:132 尾部一句"Read references/context.md before composing commit or PR text"与 :34 重复 | 整体紧凑可定位；唯一重复是 SKILL.md:132 残留句，属 P3 级冗余不判 fail |
| D06 | pass | SKILL.md:18（blocking question 工具按能力匹配、fallback 到 chat 显式声明）、branch-creation.md:50（blocking 工具不可用时等用户回复、绝不静默选择）、eval.yaml:5(engine claude_code 单引擎声明） | 能力假设显式、缺失时降级路径写明，未声称多模型能力 |
| D07 | pass | evals/cases/no-landing-auth-stops-before-push.yaml、description-only-non-mutating.yaml（两个入库行为 case,fixture+script judge 可复验）、branch-creation.md:5-10（两种失败模式驱动规则） | 存在失败→规则→可复验 case 的演化链；case 有 script judge 与 fixture hash 冻结 |
| D08 | pass | SKILL.md:34/78/91/101（各 Step 按需读取对应 reference，不要求一次全读）、pr-description-writing.md:3（"Loaded on demand…do not load earlier") | 按需加载纪律明确；SKILL.md:132 的重复读指令与该纪律轻微张力（同 D05 冗余） |
| B01 | pass | SKILL.md:4(user-invocable: false)、:14(internal-only helper,workflow invocation 不构成授权）、agents/openai.yaml:1-3(allow_implicit_invocation: false) | helper 身份、负向触发边界与隐式调用禁用三层固定 |
| B02 | pass | SKILL.md:24-28（三种 mode 判定与 pipeline 修饰符）、compose.md:21-26(config 读取与 active-key 规则）、tests/unit/pipeline-mode-contracts.test.js:10-17（入口声明与行为断言一致） | 入口、references、消费者测试三者一致；设计意图（value-first description）可定位 |
| B03 | pass | SKILL.md:14(commit/landing 双授权分离、缺哪个停在哪）、:16（不扩大 caller 文件范围）、commit-and-push.md:3-6(pipeline token/绿测试/分支均非授权）、apply-and-handoff.md:38（缺 archive 授权不阻断 PR) | 授权模型是全 skill 最强面：授权来源、范围、缺失行为逐项声明且被测试固定 |
| B04 | pass | agents/openai.yaml(host 投射资产）、compose.md:26（明确不导入上游 CE config cascade)、SKILL.md:44（不含 `/ce-explain` 等 CE 残留，由 pipeline-mode-contracts.test.js:44-46 负向断言） | source 边界清楚，上游分叉是有意声明并被负向测试固定 |
| B05 | fail | branch-creation.md:72-91(fetch failure fallback 完整）、commit-and-push.md:30-34（中断后检查 HEAD/父提交/index、禁止原子恢复声称）、apply-and-handoff.md:80（写结果未知先查 PR 状态再重试防重复创建）——机制存在；但 evals/cases/ 仅 2 个 case，全部覆盖"授权缺失停止"，无任何恢复/失败路径行为 case | 恢复机制源码存在且有文本 contract 断言，但"机制存在但未触发 vs 机制缺失"无法用现有 eval 区分：行为层零覆盖，文本断言不能证明触发，归因验证落空（见主责深挖） |
| B06 | pass | SKILL.md:111(needs-human residual 原样渲染返回、非空即决策交接非完成）、:126-128(fact-only handoff 声明）、apply-and-handoff.md:78-79(unknown 写结果不声称成功） | 完成声称纪律完整：诚实降级、不夸大、residual 不吞 |
| X01 | not-applicable | — | 本 helper 是单步落地动作，非多模块长任务编排；编排职责在 spec-lfg（其审查对象），此处不适用 |
| X02 | pass | SKILL.md:5(argument-hint 版本化）、compose.md:21-26(config.local.yaml active-key 规则含布尔语义与迁移声明"do not import the upstream CE config cascade") | 本地 config 合同的 key 语义、默认值、与上游分叉均写明 |
| X03 | pass | SKILL.md:30（不授权 merge/rebase/force-push)、commit-and-push.md:58-64（外发前 publishing gate + 单 endpoint + 非 force refspec)、apply-and-handoff.md:65-67（禁止 stdin/heredoc 传 body 的注入面控制） | 高风险动作（外部写、远端 mutation）的验证与禁做清单对账完整 |
| X04 | pass | SKILL.md:111-128(needs-human 完整字段原样传递、watch_handoff fact-only、不创建决策存储）、apply-and-handoff.md:95(pending feedback actions 原样携带、不 paste 原始 body、不推断 reply 授权） | 跨 workflow 交接的 summary/source refs/权限边界纪律齐备 |

## Findings

1. **P2 · B05 行为层零覆盖** — evals/cases/ 仅 2 个 case(no-landing-auth-stops-before-push.yaml、description-only-non-mutating.yaml)，均验证"无授权则停"。SKILL.md 与 references 中的失败恢复机制（branch-creation.md:72-91 fetch fallback、commit-and-push.md:30-34 中断恢复、apply-and-handoff.md:80 重复创建防护、context.md:27-30 未知状态阻断）无任何行为 eval；tests/unit 仅有文本断言与 2 个 git 层碰撞复现（spec-commit-push-pr-context-contracts.test.js:21-70、110-131)。后果：恢复规则回归（如 prose 被改弱）只能靠文本断言兜底，触发质量不可归因。最小修复：为 fetch-failure fallback 与 unknown-PR-state-blocks-mutation 各补一个 eval case（可复用现有 fixture 与 script judge 模式）;checkout-collision 的 git 层复现已在单测中，补标注即可。
2. **P3 · SKILL.md:132 冗余指令** — 尾部孤立句"Read `references/context.md` before composing commit or PR text"与 :34 的"Read references/context.md before Step 1"重复且位置脱节（置于 Step 8 之后）。后果：轻微误导读取时机，增加噪声。最小修复：删除或并入 Context 节。
3. **P3 · eval.yaml `environment: type: none`** — evals/eval.yaml:5。按 REVIEW-EXECUTION-WORKFLOW.md §7 纪律，非隔离 runtime 可能混入本机已安装 runtime 副本；eval 配置本身未声明防污染措施。后果：eval 通过不能干净归因到 source 版本。最小修复：在 eval 文档/报告中固定标注该限制，或迁移到隔离环境。
4. **P3 · description-only 模式的 Pre-A 依赖未显式化** — SKILL.md:24 说 description-only "Use the data from the Context section above"，但该模式跳过 Step 1，而 Context 节（:32-39）要求"Read references/context.md before Step 1"。字面上 description-only 用户可能读到矛盾指令（:24 让其跳过 Step 1 决策树，:34 的读取要求以 Step 1 为锚）。实际 :132 尾部句试图兜底（见 finding 2)，但表述含糊。后果：低，模型大概率仍读 context.md。最小修复：把 Context 节读取要求改为"before any mode's first probe"。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 结论：机制存在、触发未证。** 逐条核对：

- **工具缺失/网络失败**:branch-creation.md:72-91 有完整 fetch-failure fallback（检查 upstream→提问或停止），机制存在；无对应 eval case，文本断言无覆盖 → **存在但未触发证据**。
- **中断恢复**:commit-and-push.md:30-34 规定中断后检查 HEAD/父提交/已提交 tree/index，"An already-created intended commit must not be duplicated"且禁止"claim atomic recovery"；机制存在；无 eval → 同上。
- **重复执行/未知写结果**:apply-and-handoff.md:78-80 "If a write result is unknown, query the PR state before any retry to avoid duplicate creation"；机制存在；无 eval → 同上。
- **dirty overlap**:branch-creation.md:63-70 checkout 碰撞保留一切并 return blocked，有 git 层行为单测（spec-commit-push-pr-context-contracts.test.js:21-70 实际执行文档中恢复块并断言 snapshot 不变）→ **存在且有触发证据（唯一一条）**。
- **部分成功**:commit-and-push.md:68-69 push 失败保留本地 SHA 与 blocker、不声称远端已变；机制存在；spec-work-lfg-recovery-contracts.test.js:58-69 仅在 watch 侧有文本断言 → 存在但未触发证据。

归因验证：现有 2 个 eval case 的 judge(check-landing-gate.sh:197-204、check-desc-only.sh:197-204）都是 `checkFixture + rejectRecordedRemoteWrites`，证明的是"不越权"而非"会恢复"。因此当前证据无法区分「恢复机制在真实失败场景能触发」与「恢复机制是死文案」。这不是机制缺失（源码逐条存在且内部一致），是**触发证据缺口**，与 B05 fail 裁决一致。

**B06 结论：pass。** needs-human 交接（SKILL.md:111)、fact-only watch_handoff(:126-128)、unknown 不声称成功（apply-and-handoff.md:78-79)、发布状态披露（commit-and-push.md:58 release_governance_status unconfirmed 是 visible gap）构成完整的诚实交付链，且被 spec-work-lfg-recovery-contracts.test.js:38-56 文本固定。

## 未读文件

- `skills/spec-lfg/references/shipping-tail.md`（仅 grep 命中片段，未全文读）：理由——本评审对象是 helper 侧交接面，shipping-tail 属 spec-lfg 审查对象；后果——LFG 侧如何消费 watch_handoff 的完整性以 spec-lfg 评审为准，本评审对 H 类交接的结论限于 helper 侧承诺 + contract test 双向断言。
- `skills/spec-commit/SKILL.md`：理由——边界核对只需确认 commit helper 不重复拥有 push/PR 职责，已由 ce-upstream-skill-sync-contracts.test.js:39-45 间接覆盖；后果——spec-commit 与 spec-commit-push-pr 的职责接缝细节未独立深读。
- evals fixtures 中 `README.md`/`package.json`/`src/server.js`：理由——只是 hash 冻结的惰性 fixture 内容，与裁决无关；后果——无。

## 结论一句话

授权边界、交接纪律与恢复机制源码层完整且内部一致（B03/D03/D04 强），唯一实质缺口是恢复/失败路径的行为层零覆盖——机制存在但无任何 eval 证明其能触发，B05 判 fail，整体为有条件通过（补 2 个恢复 eval case 可关闭）。
