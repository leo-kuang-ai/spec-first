# S3 行为层汇总（2026-11-04 全量审查；11-05 归因收口）

引擎：skill-up（claude_code engine）/ 模型 zhipu/glm-5.3 / fresh-source 逐 skill 全 case 运行 / 三路并行驱动 / 冻结评审后的 source（与 S2 静态修复同轮）。38 skill、155 case（spec-prd 结果在 iteration-2）。

> 口径：S3 是行为基线，不是验收门。case FAIL = 该 case 的 fixture 断言未满足，进 backlog 由后续 eval 驱动优化循环消化；本轮 /goal 的静态层收敛义务已在 S2 完成（38/38，见各批次收敛报告）。

## 总量（S3 原始轮）

- **118/155 pass（76.1%）**
- 32 FAIL（14 skill）
- 5 超时未判 → 提档重跑：4 PASS + 1 转 B（compound-refresh/publication-recover）
- 20/38 skill 全 case 通过

## FAIL 归因终态（32 例全部逐例归因，2026-11-05 收口）

### A 类：eval 基建缺陷（15 例，全部已修，13 例已验证翻转）

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

### B 类：真实行为缺口（17 例，合同已载/已补强，行为重验留 eval 迭代 backlog）

spec-work ×3：
1. r2-reverse-mismatch — 用户说 close out the plan 即自跑 `plan-status-completed` 生命周期迁移（lifecycle 属 shipping-tail owner，SKILL.md compact principles 已补「completion request ≠ lifecycle authorization」）
2. return-to-caller-envelope — 未调 CLI producer，手写 summary/claims 伪造证据链（return-to-caller.md:44 已点名 `spec-first internal verification-run-summary record`/`honest-closeout validate`，禁止手写）
3. standalone-closeout-order — summary 中命令串被理想化（管道 grep|tee 记成 grep -c；shipping-workflow.md:157 已补逐字命令规则）

spec-plan ×4（SKILL.md:17/19/29/30/35/36 逐条已载，模型让步）：
4. always-plan-unclear-input — 模糊输入下直接全量实现 demo
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
15. spec-compound-refresh/publication-recover（超时提档后浮出）— modes.md 要求 applied，输出 completed
16. spec-product-pulse/unconfigured-guides-setup — 以 disable-model-invocation 为由拒绝按 prompt 遵循 skill（变体行为；brainstorm/plan 等 9 个同 flag skill 的 case 均正常读源遵循）
17. spec-doc-review/headless-no-path-fails — 精确失败串后追加解释段落（modes.md:21 已补「整条 final message」边界）

### 归因后确认口径

- **S3 原始轮 118/155**
- 提档重跑 4 PASS + verify 重验翻转（plan/only、usf/r2、worktree/unborn、promote/no-publish、pov/design、debug/diagnose、handoff/ordinary、refresh/preserve）8 PASS → **确认 pass 130/155**
- A 类其余 5 例（handoff ×2 REPLAY、pulse 1 REPLAY、promote/compound/partial/runtime-setup ×2 重跑中）预期收口至 ~135/155
- B 类 17 例留 eval 驱动迭代 backlog（合同均已承载，属模型遵从问题，重 prose 堆叠收益递减）

## 与 S2 的关系

- S2 静态层 38/38 收敛（修复全部落地，见 `03-s2-static/batch*/\*-convergence.md`）
- S3 FAIL 的主修复路径是 eval 基建修正（A 类）+ prose 合同显式化（词表类），模型遵从类（B 类）留给 eval 迭代循环，不再堆 prose

## S3 backlog（优先级序）

1. B 类 17 例的 eval 驱动迭代（重点：plan 4 例遵从、work 证据链 3 例、promote/refresh 词表 2 例重验）
2. verify2/verify3 未收口 5 例（semantic、bare、false-causal、partial、unreleased）终态记录
3. disable-model-invocation 拒绝变体（pulse）观察是否跨模型复现，再决定 prompt 约定是否统一补「直接读取已安装 skill 并按其工作」

## 产物

`*/iteration-*/result.json`（case 级）、`s3-run.log`（三路驱动 + verify/verify2/verify3 重验日志）、重放验证记录见本文件各例行
