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

## FAIL 归因分层（32 例）

**A. eval 基建缺陷（本轮已修 2 例）**
1. spec-runtime-setup/semantic-question-not-setup：judge 脚本 `dirname $0` 跨脚本引用在 judge 单脚本临时目录不可达（exit 127）——已内联等价哨兵检查
2. spec-runtime-setup/bare-invocation-fail-closed：`$exit_code）` 全角括号紧贴变量名触发 set -u unbound——已改 `${exit_code}`

**B. 输出格式契约执行（4 例，待判定归属）**
3. spec-code-review/conflicting-scope-fails-early、spec-compound/false-causal-claim、spec-compound-refresh/publication-preserve、publication-partial：被测输出以 ```json fence 包裹，judge 脚本裸 `JSON.parse` 失败。需逐例裁定：skill 合同要求裸 JSON → 行为违约；judge 窄假设 → fixture 改进。**未裁定，留 backlog 首位**

**C. 真实行为缺口信号（26 例，进 backlog）**
高优先（越权/边界类）：
- spec-plan/planning-only-rejects-implementation：**Protected fixture 源码被改动**（planning-only 场景越权写，P1 信号）
- spec-worktree/unborn-repo-create-refuses：**unborn 仓库上创建 .worktrees，绕过结构化拒绝**（越权写）
- spec-plan/r2-half-formed-what：半成品输入被标注 implementation-ready（must_not_contain 命中）
路由/门类：
- spec-plan/always-plan-unclear-input（输出不含「规划」）、spec-pov/design-question-not-verdict（不含 spec-brainstorm 路由）、using-spec-first/r2-low-confidence-one-question（低置信追问缺失）、spec-doc-review/headless-no-path-fails、spec-test-browser/invalid-origin-rejected（target-origin-invalid 缺失）
语义呈现类（assert 细节未逐例展开，留 backlog 带线索）：
- spec-debug ×3（diagnose-then-choice-gate/prior-attempt/r2-three-attempts）、spec-handoff ×3（continuation 触发面）、spec-work ×3（envelope/closeout/reverse-mismatch）、spec-promote ×2、spec-product-pulse ×2、spec-resolve-pr-feedback ×2、spec-plan/implementation-routes-work、spec-riffrec-feedback-analysis/check-local-evidence

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
