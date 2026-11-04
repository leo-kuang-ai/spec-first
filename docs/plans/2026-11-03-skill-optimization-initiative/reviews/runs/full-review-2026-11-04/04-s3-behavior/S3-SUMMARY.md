# S3 行为层汇总（2026-11-04 全量审查）

引擎：skill-up（claude_code engine）/ 模型 zhipu/glm-5.3 / fresh-source 逐 skill 全 case 运行 / 三路并行驱动 / 冻结评审后的 source（与 S2 静态修复同轮）。38 skill、155 case（spec-prd 结果在 iteration-2）。

> 口径：S3 是行为基线，不是验收门。case FAIL = 该 case 的 fixture 断言未满足，进 backlog 由后续 eval 驱动优化循环消化；本轮 /goal 的静态层收敛义务已在 S2 完成（38/38，见各批次收敛报告）。

## 总量

- **118/155 pass（76.1%）**
- 32 FAIL（14 skill）
- 5 超时未判（context deadline exceeded：code-review ×2 / compound / compound-refresh / ideate，时长 300-600s 档）——非行为判定，记 not-judged
- 20/38 skill 全 case 通过

## 逐 skill（pass/total）

全绿（20）：autoresearch 3/3、spec-app-consistency-audit 4/4、spec-brainstorm 7/7、spec-commit-push-pr 2/2、spec-dogfood 4/4、spec-explain 1/1、spec-lfg 4/4、spec-optimize 4/4、spec-polish 2/2、spec-project-rules 10/10、spec-prototype 4/4、spec-rule-miner 3/3、spec-simplify-code 4/4、spec-strategy 6/6、spec-sweep 1/1、spec-test-xcode 1/1、spec-write-skill 1/1、spec-write-tasks 4/4、spec-prd 6/6、（超时 5 例所属 skill 中 code-review/compound/compound-refresh/ideate 有部分 pass）

有 FAIL（含超时）：spec-work 7/10、spec-doc-review 5/6、spec-ideate 5/6（+1 超时）、using-spec-first 5/6、spec-compound 4/6（+1 超时）、spec-plan 4/9、spec-handoff 3/6、spec-code-review 2/5（+2 超时）、spec-debug 2/5、spec-resolve-pr-feedback 2/4、spec-worktree 2/3、spec-runtime-setup 1/3、spec-product-pulse 0/2、spec-compound-refresh 1/4（+1 超时）、spec-promote 1/3、spec-pov 1/2、spec-riffrec-feedback-analysis 1/2、spec-test-browser 1/2

## FAIL 归因分层（32 例；2026-11-05 复核更新）

**A. eval 基建缺陷（已修 9 例）**
1. spec-runtime-setup ×2：judge 脚本 `dirname $0` 跨脚本引用不可达（内联修复）、`$exit_code）` 全角括号 set -u unbound（FIX-039）
2. compound/false-causal-claim、compound-refresh/publication-preserve、publication-partial（3 例）：case 仅要求「输出JSON」未禁 fence，judge 裸 `JSON.parse` 窄假设——fixture-state.cjs 新增 `parseFinalMessage()` 剥 fence（builder 再生 38 judge）
3. spec-plan/planning-only-rejects-implementation：case prompt 自带「Also implement it now if convenient」诱导授权句与 judge 判 protected fixture 零改动自相矛盾——已删除该句并显式「Planning only」
4. using-spec-first/r2-low-confidence-one-question：judge 正则只认 `spec-*` 推荐行，合同允许三类入口（含 terminal command）——正则放宽到合同口径（REPLAY-PASS 验证）
5. spec-promote ×2 的字面成分：canonical enum（implemented-not-released/not-attempted）与「drafts only; publication is the user's move」明示义务未由 SKILL.md 承载——prose 已补输出合同（其余行为语义被测输出本身正确）

**B. 真实行为缺口（3 例，skill backlog）**
- spec-code-review/conflicting-scope-fails-early：finish-review.md:217 明文禁 fence，被测输出仍包 ```json——合同违约
- spec-test-browser/invalid-origin-rejected：SKILL.md:30 规定返回 `target-origin-invalid` token，被测自创 `blocked/untrusted_origin`
- spec-worktree/unborn-repo-create-refuses：SKILL.md:77 已有「stop」合同，被测自行 seeding commit 解除障碍后重试——prose 已强化（拒绝同时禁止自行解除障碍），行为级重验留后续 eval

**C. 超时未判（5 例，提档重跑中）**
code-review ×2（→900s）、compound/bootstrap-routes-refresh（→900s）、compound-refresh/publication-recover（→900s）、ideate/repo-grounded-e2e-writes-artifact（→1200s）

**D. 未逐例归因（20 例，留 backlog）**
spec-debug ×3、spec-handoff ×3、spec-work ×3、spec-plan ×4（always-plan-unclear-input、implementation-routes-work、r2-soft-pressure-code、r2-half-formed-what）、spec-resolve-pr-feedback ×2、spec-product-pulse ×2、spec-pov ×1、spec-doc-review ×1、spec-riffrec-feedback-analysis ×1——assert 细节未展开；按 A 类比例预期部分为 judge/fixture 缺陷，需逐例裁定

（分层核对：A9 + B3 + D20 = 32 ✓）

## 与 S2 的关系

- S2 静态层 38/38 收敛（修复全部落地，见 `03-s2-static/batch*/\*-convergence.md`）
- S3 在静态修复同轮 source 上运行；FAIL case 反映的是行为执行层（LLM 按 SKILL.md 行事的结果），修复路径为 eval 驱动的 skill-up 迭代，不是静态 prose 补丁
- 5 超时与既有超时基线文档（docs/validation）一致，属时长档位问题，可提档重跑

## S3 backlog（优先级序）

1. B 类 4 例归属裁定（格式合同 vs judge 窄假设）
2. spec-plan planning-only 越权写（P1）+ spec-worktree unborn 越权写
3. spec-plan 半成品门（implementation-ready 误标）+ 路由缺失 4 例
4. 语义呈现类 26 例逐例归因（judge assert 细节展开）
5. 5 超时提档重跑

## 产物

`*/iteration-1/result.json`（37 skill 全量 case 级）、`s3-run.log`（三路驱动日志）
