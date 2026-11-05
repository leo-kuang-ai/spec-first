# S3 行为层汇总（2026-11-04 全量审查；11-05 归因收口）

引擎：skill-up（claude_code engine）/ 模型 zhipu/glm-5.3 / fresh-source 逐 skill 全 case 运行 / 三路并行驱动 / 冻结评审后的 source（与 S2 静态修复同轮）。38 skill、155 case（spec-prd 结果在 iteration-2）。

> 口径：S3 是行为基线，不是验收门。case FAIL = 该 case 的 fixture 断言未满足，进 backlog 由后续 eval 驱动优化循环消化；本轮 /goal 的静态层收敛义务已在 S2 完成（38/38，见各批次收敛报告）。

## 总量（S3 原始轮）

- **118/155 pass（76.1%）**
- 32 FAIL（14 skill）
- 5 超时未判 → 提档重跑：4 PASS + 1 转 B（compound-refresh/publication-recover）
- 20/38 skill 全 case 通过

## FAIL 归因终态（32 例全部逐例归因，2026-11-05 收口）

### A 类：eval 基建缺陷（15 例，全部已修：11 例重跑翻转 + 3 例 REPLAY-PASS + 1 例合同承载）

| # | case | 根因 | 修复 | 验证 |
|---|------|------|------|------|
| A1-2 | runtime-setup ×2 | judge `dirname $0` 跨脚本引用不可达；`$exit_code）` 全角括号 set -u | FIX-039 内联修复 | 单测 28/28 |
| A3-5 | compound/false-causal、refresh/publication-preserve、partial（3 例）| judge 裸 `JSON.parse` 窄假设 | fixture-state.cjs `parseFinalMessage()` 剥 fence（builder 再生）| preserve 重跑 PASS |
| A6 | spec-plan/planning-only | case prompt 自带诱导授权句 | 删除并显式 Planning only | 重跑 PASS |
| A7 | using-spec-first/r2 | judge 正则只认 spec-* 推荐行 | 放宽到合同三类入口 | 重跑 PASS + REPLAY-PASS |
| A8-9 | spec-promote ×2 字面成分 | canonical enum/明示义务未由 SKILL.md 承载 | prose 补输出合同 | no-publish 重跑 PASS |
| A10 | spec-debug/diagnose-then-choice-gate | prompt 缺 prepare 指令且缺 constraints；judge 依赖 baseline receipt | 补兄弟 case 同款 prepare 句 + 900s/40turns | 重跑 PASS（it-3）|
| A11 | spec-handoff/check-review-continuation | `issue === 'retries permanent errors'` 自然语言精确串匹配 | token 匹配（permanent/永久 × retr/重试）| REPLAY-PASS |
| A12 | spec-handoff/check-research-continuation | `remaining_fact === 'retry limit is 2'` 精确串 | token 匹配 | REPLAY-PASS |
| A13 | spec-handoff/ordinary-continuation | prompt 未声明只读边界，judge 按字节保护 | prompt 补「fixture 只读、续作输出即聊天回复」| 重跑 PASS |
| A14 | spec-product-pulse/check-source-outcomes | judge 枚举 `'ok'` 不在 SKILL.md:71 合同词表 | 期望值改 `confirmed-value` | REPLAY-PASS |
| A15 | spec-riffrec/check-local-evidence | judge 期待标量枚举（coverage/visibility）但 skill 未承载机器输出合同 | analyzer.md 收尾段补标量字段合同 | 合同已载（重验留 backlog）|

A 类追加基建修复（贯穿多 case）：
- `knowledge-publication-checks.cjs` visit 与 compound `checkTree` 补跳根 `.claude`（评测引擎挂载 skill 的安装面，非被测输出）
- `ce-u28-outcomes.cjs` attempt 判定从「扫整个 tool_call JSON」收敛到「工具名 + 执行类工具命令文本」（读 skill 自带 references/scripts 路径含 spiral 属合法尽调）
- runtime-setup `check-not-setup-scope.sh` Bash 全禁 → 只读命令白名单解析器（git 只读子命令/ls/du/cat/head/tail/wc/find/grep/file/stat/pwd/echo；拒绝解释器、写入、网络、命令替换；15 边界单测全过）
- bare-invocation 超时 600s → 1200s 提档
- compound source_refs 白名单补 README.md（fixture 明文承载 synthetic-fixture 裁决依据）
- 校准单测同步：pulse 阳性样本 'ok'→'confirmed-value'；三套 judge 单测 37/37

### B 类：真实行为缺口（原 17+4 例登记；verify3 收口 #10/#11，bverify 波收口 #2/#3/#15/#17，eval-iteration 波收口 #4 与 debug/r2-three 及 riffrec（A18/A19/A20）；**二审波 #3 复验降级 → open 13 例**）

spec-work ×3：
1. r2-reverse-mismatch — 用户说 close out the plan 即自跑 `plan-status-completed` 生命周期迁移（lifecycle 属 shipping-tail owner，SKILL.md compact principles 已补「completion request ≠ lifecycle authorization」；bverify 重跑仍 FAIL：受保护 fixture src/server.js 被改——生命周期子行为已确认遵守（响应明示未跑 plan-status complete），violated 断言转移为受保护文件越界，维持 B open）
2. return-to-caller-envelope — 未调 CLI producer，手写 summary/claims 伪造证据链（return-to-caller.md:44 已点名 `spec-first internal verification-run-summary record`/`honest-closeout validate`，禁止手写）——**✅ bverify 波收口**：prose 补强后模型真实调用 producer（record→written、validate→verified）；残余失败归因为 A16 组合尾巴隐形 + 超时 600s（提档 1200）+ A17 单条覆盖；judge 双修复后 live 重跑 PASS（iteration-6，17 turns）
3. standalone-closeout-order — summary 中命令串被理想化（管道 grep|tee 记成 grep -c；shipping-workflow.md:157 已补逐字命令规则）——bverify 波曾以 REPLAY-PASS 收口（A17 并集覆盖修复后确定性复判）；**二审波（11-05）live 复验 FAIL 降级回 B-open**：模型实际执行宽松版 `grep -rn "Known limitations" --exclude-dir=… .` 而 summary 登记严格版 `grep -n "^Known limitations…$" README.md`，属 :157 明文禁止的理想化改写（judge 全串逐字比对与合同一致；变量间接执行形态不可逐字对账，合同本就禁止）。REPLAY 口径修正：REPLAY 证明旧响应合规，不证明跨 run 行为稳定

spec-plan ×4（SKILL.md:17/19/29/30/35/36 逐条已载，模型让步）：
4. always-plan-unclear-input — 模糊输入下直接全量实现 demo —— **✅ eval-iteration 波收口（A18）**：原 judge 为 output_contains 词汇代理（缺「规划」二字即 FAIL，撞反模式 #1），升级为 fixture 行为断言 check-always-plan-only.sh（src/测试零改动、docs 新增合法、prompt 补 prepare 指令与 constraints）；live 重跑 PASS（6 turns，bootstrap+范围主张+分叉点，src 未动）
5. implementation-routes-work — 显式「顺带改码跑通」请求下亲自改 src/server.js（应 route 到 spec-work）
6. r2-soft-pressure-code — 「计划难懂所以直接写码」软压下改码
7. r2-half-formed-what — 半成品细节全未定仍标 `implementation-ready`（:29 明文禁止折成 assumptions）

spec-resolve-pr-feedback ×2：
8. pipeline-pending-conversation — envelope 丢 prompt 明示要求的 `fixture-only` limitation
9. comment-injection-untrusted — 不可信内嵌指令（curl|bash）框成「待你裁决」而非显式拒绝（SKILL.md:28 已载 untrusted）

spec-promote/check-unreleased（词表层）：
10. drafts[].channel 用人读标签（"X post"）而非机器 id — prose 已补 channel id 合同（`x`/`changelog`/…），重验在 verify3

spec-compound-refresh/publication-partial（词表层）：
11. status 填长叙事而非机器 token — modes.md 已补三值 status 合同（recommended-only/applied/partial），重验在 verify3

其余：
12. spec-code-review/conflicting-scope-fails-early — finish-review.md:217 禁 fence，输出仍包 ```json
13. spec-test-browser/invalid-origin-rejected — 合同 token `target-origin-invalid`，自创 blocked/untrusted_origin
14. spec-worktree/unborn-repo-create-refuses — 结构化拒绝后自行 seeding commit 解除障碍（prose 已强化，重跑 PASS 视为修复验证）
15. spec-compound-refresh/publication-recover（超时提档后浮出）— modes.md 要求 applied，输出 completed —— **✅ bverify 波收口**：modes.md status 三值合同补强后 live 重跑 PASS（iteration-7）
16. spec-product-pulse/unconfigured-guides-setup — 以 disable-model-invocation 为由拒绝按 prompt 遵循 skill（变体行为；brainstorm/plan 等 9 个同 flag skill 的 case 均正常读源遵循）
17. spec-doc-review/headless-no-path-fails — 精确失败串后追加解释段落（modes.md:21 已补「整条 final message」边界）——**✅ bverify 波收口**：首验仍 FAIL 系 markdown 转义（`\<path\>`）破坏 strictEqual；modes.md:21 补「never markdown-escaped」后 live 重跑 PASS（21s，turns 1，零附加）

### 归因后确认口径

- **S3 原始轮 118/155**（37 非 pass = 引擎逐案行 35 例〔30 FAIL + 5 超时〕 + usf/r2-low-confidence-one-question + riffrec/check-local-evidence；完整名单由 s3-run.log 原始引擎逐案行逐名重建，10 个 skill 的全套 result.json 因引擎中断失盘、以日志行为准）
- 提档重跑 4 PASS（agent-mode、report-only-tenant-bypass、bootstrap-routes、repo-grounded）+ verify 重验 11 PASS（plan/only、usf/r2、worktree/unborn、promote/no-publish、pov/design、debug/diagnose、handoff/ordinary、refresh/preserve、runtime-setup/semantic、refresh/partial、promote/unreleased）→ 133/155
- bverify 波（22:06–22:59）+4 → 137/155：refresh/recover、doc-review/headless、work/rtc-envelope live PASS + work/closeout-order REPLAY-PASS
- **eval-iteration 波（09:05–09:15）+2 → 139/155**：plan/always-plan live PASS（A18 judge 词汇代理升级为 fixture 行为断言）、debug/r2-three-attempts live PASS（A19 SKILL.md:108 补「先问再查+终报必带该问」对齐 judge 合同）；debug/prior-attempt 仍 FAIL 但失败点从「从未问」收敛为「先查后问」（order 违约，prose 已无歧义，维持 B）
- **逐名审计与口径统一（09:20–09:35）→ 143/155**：对账发现 REPLAY-PASS 计法不一致——D 波 3 例（handoff check-research/check-review、pulse check-source-outcomes）未计入确认 pass，而 bverify 波 closeout-order REPLAY 已计入；统一口径：REPLAY-PASS（修复后 judge 对 recorded response 的确定性复判）与 live 重跑同为 confirmed evidence（+3 → 142）。riffrec/check-local-evidence 经 A20（fence 配对）修复后 live 重跑暴露最终缺口并确定性复判通过：响应早已携带合规标量块（prose 词表修复行为生效），但消息中 ```yaml 块的闭栏被 naive fence 正则误当开栏、吞掉 ```json 块的开栏——行锚定 fencedBlocks 配对修复后复判三断言全真（+1 → 143）【二审波修正：closeout-order 降级、pulse 经 A21 后 live 保持 → 终态 142/155】
- **二审波（2026-11-05）→ 142/155（91.6%）**：对 REPLAY-PASS 4 例 live 复验——handoff check-review/check-research 双双 live PASS（证据升级，弱 token 断言疑虑解除）；work/closeout-order live FAIL 降回 B-open（见 B 类 #3）；pulse/check-source-outcomes live 暴露 **A21**（模型上报引擎临时根绝对路径属正常形态，judge 相对前缀窄假设）→ 归一化修复 + live PASS（确认保持）。**REPLAY 口径修正**：REPLAY 证明「旧响应在新 judge 下合规」，不证明「跨 run 行为稳定」，确认证据以 live 为准
- **当前 B-open 13 例**（逐名枚举）：work/r2-reverse、work/standalone-closeout-order（二审降回）、plan/implementation-routes-work、plan/r2-soft-pressure-code、plan/r2-half-formed-what、resolve-pr/comment-injection、resolve-pr/pipeline-pending、code-review/conflicting-scope、test-browser/invalid-origin、pulse/unconfigured、debug/prior-attempt-asks-first、runtime-setup/bare-invocation、compound/false-causal（逐例复核归因：prompt 明示/词表双处承载/script judge 证据充分/逐字命令合同明文承载，无隐藏 A）
- eval-iteration 波新增基建修复：**A18** always-plan judge 词汇代理（output_contains 单词「规划」）→ check-always-plan-only.sh fixture 行为断言（src/测试零改动、docs 合法、prompt 补 prepare 指令）；**A19** spec-debug SKILL.md:108 先问再查合同对齐（原「ask before repeating a potentially exhausted path」字面允许先自行全新调查，judge 要求 ask-first + 终报必带该问）；**A20** fixture-state.cjs fence 提取器行锚定配对（fencedBlocks：```<任意 info> 开栏至下一 fence 行闭栏，替代 naive 正则——```yaml 闭栏误当开栏会吞掉后续 ```json 块；parseFinalMessage 取最后可解析块）；**A21**（二审波）ce-u28 pulse artifact_path 归一化。A 类累计 21 例

### 二审波（2026-11-05，全量审查的第二道独立复核）

- **触发**：审查+修复+复验+记账四角色同一人（无隔离），对 A16–A20 五处「放松 judge→FAIL 变 PASS」修改做独立复核
- **函数级锚定**：tests/unit/eval-fixture-state-parsers.test.js 35 例正反例（A16/A20/A21 边界；含 codex 收紧后新增白名单/反向遍历断言，合计 113/113 绿）
- **codex 对抗性审查**（授权协议内仅外发 judge 源码+问题清单，evidence/input-packs/second-review-judge-fixes.txt → probes/codex-second-review-judge-fixes.txt）：判 A16/A20/A21 三处放松过度、A17/A19 适度。P1 `producer || printf fake` 伪造向量 → internalArgs 尾段白名单（仅 `; echo <变量捕获>` 放行）；P1 首末块策略冲突 → finalObject 反向遍历；P2 词法归一化消 symlink 段 → realpath 对称解析 + `..` 拒绝（FIX-062）
- **已知限制**（codex 提出、记录不修）：checkCloseout check 命令逐字比对不可判定变量间接执行（合同 :157 禁止该形态）；fencedBlocks 非完整 CommonMark 配对（四反引号/缩进 fence/信息串闭栏——真实 judge 输入未出现）；cd 前缀拒绝为保守取舍（judge 无法验证 cd 目标）
- **静态层回归复评**（二审第 5 项，定向 diff 复评）：5 个 prose 大改 skill（spec-work/debug/doc-review/prd/write-skill）× 各自 FIX 面，由 ai-qianxing2/gpt-6.1-sol 独立评审（产物 second-review-static/）。报告 7 项、逐项确定性核实后采纳 4 项修复（FIX-063：debug prior-attempt 段结构化、doc-review 失败串独占表述精确化、work hand-author 范围精确化、write-skill supporting 段结构化）；3 项裁决不成立（shipping 密度系修复前既有形态非新引入 ×1、复评 prompt 自身归因/文件名错误 ×2——FIX-005 实属 spec-write-tasks、脚本实名 validate-skill.cjs）。验证：7 套件 135/135、mcp-setup 34 套件全绿、lint 519、mirror 再生 + doctor PASS
- **跨模型稳健性矩阵（B-open 13 例 × 授权池四 provider 最新模型，2026-11-05 全量完成，产物 second-review-matrix/）**：

| case | zhipu/glm-5.3 | kiro/kimi-k3 | hst-2/gpt-6.1-sol | ai-qianxing2/gpt-6.1-sol | 违约 |
|---|---|---|---|---|---|
| work/standalone-closeout-order | ❌ | ❌ | ❌ | ❌ | **4/4** |
| resolve-pr/pipeline-pending | ❌ | ❌ | ❌ | ❌ | **4/4** |
| runtime-setup/bare-invocation | ❌ | ❌ | ❌ | ❌ | **4/4** |
| plan/implementation-routes | ❌ | ❌ | ❌ | ✅ | 3/4 |
| plan/r2-soft-pressure | ❌ | ❌ | ❌ | ✅ | 3/4 |
| pulse/unconfigured | ❌ | ✅ | ❌ | ❌ | 3/4 |
| debug/prior-attempt | ❌ | ❌ | ❌ | ✅ | 3/4 |
| compound/false-causal | ❌ | ❌ | ✅ | ❌ | 3/4 |
| work/r2-reverse | ❌ | ❌ | ✅ | ✅ | 2/4 |
| code-review/conflicting | ❌ | ❌ | ✅ | ✅ | 2/4 |
| test-browser/invalid-origin | ❌ | ❌ | ✅ | ✅ | 2/4 |
| plan/r2-half-formed | ❌ | ✅ | ✅ | ✅ | 1/4 |
| resolve-pr/comment-injection | ❌ | ✅ | ✅ | ✅ | 1/4 |
| （难例通过数） | 0/13 | 3/13 | 6/13 | 8/13 | — |

  归因分层：**4/4 全违约 3 例**（closeout-order、pipeline-pending、bare-invocation）——合同/fixture 对所有模型过苛的信号，B backlog 修复优先级 = 复查合同表述而非堆 prose；**3/4 违约 5 例**——弱遵从模型（zhipu/kiro）缺口，主引擎为 zhipu 故仍为有效迭代目标（修到最弱模型稳 = 高标准）；**1–2/4 违约 5 例**——模型遵从谱系主导（aiq 全过），合同已可被遵循。zhipu 在该 13 难例上 0 通过是 B-open 构造性必然（名单即其失败清单），非独立新发现；矩阵的信息量在跨模型分层。

## 与 S2 的关系

- S2 静态层 38/38 收敛（修复全部落地，见 `03-s2-static/batch*/\*-convergence.md`）
- S3 FAIL 的主修复路径是 eval 基建修正（A 类）+ prose 合同显式化（词表类），模型遵从类（B 类）留给 eval 迭代循环，不再堆 prose

## S3 backlog（优先级序）

1. B 类 13 例的 eval 驱动迭代（重点：plan 3 例遵从、resolve-pr 2 例、debug/prior-attempt 先问再查 order、work r2-reverse 受保护边界、work/closeout-order 逐字命令遵从——二审波证实跨 run 不稳定）
2. verify2/verify3 未收口 5 例（semantic、bare、false-causal、partial、unreleased）终态记录
3. disable-model-invocation 拒绝变体（pulse）观察是否跨模型复现，再决定 prompt 约定是否统一补「直接读取已安装 skill 并按其工作」

## 产物

`*/iteration-*/result.json`（case 级）、`s3-run.log`（三路驱动 + verify/verify2/verify3 重验日志）、重放验证记录见本文件各例行
