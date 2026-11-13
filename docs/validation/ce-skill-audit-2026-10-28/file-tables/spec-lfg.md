# spec-lfg 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| [@dependency/skills/spec-work/references/return-to-caller.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/references/return-to-caller.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接producer/机制测试；边界和运行证据见笔记 |
| [@dependency/skills/spec-work/references/tracker-defer.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/references/tracker-defer.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 与本项已全文读取包内projection字节相同，hash复核后复用全文记录 |
| [@dependency/skills/spec-work/scripts/working-tree-fingerprint.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-work/scripts/working-tree-fingerprint.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 与本项已全文读取包内projection字节相同，hash复核后复用全文记录 |
| [@dependency/tests/unit/spec-lfg-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-lfg-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接producer/机制测试；边界和运行证据见笔记 |
| [@dependency/tests/unit/spec-lfg-pr-watch-state.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-lfg-pr-watch-state.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接producer/机制测试；边界和运行证据见笔记 |
| [@dependency/tests/unit/spec-work-lfg-recovery-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-work-lfg-recovery-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接producer/机制测试；边界和运行证据见笔记 |
| [@dependency/tests/unit/spec-work-working-tree-fingerprint.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-work-working-tree-fingerprint.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接producer/机制测试；边界和运行证据见笔记 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/cases/explicit-request-starts-plan.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/cases/explicit-request-starts-plan.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/cases/implicit-request-blocks.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/cases/implicit-request-blocks.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/cases/r2-pipeline-hint-no-name.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/cases/r2-pipeline-hint-no-name.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/cases/ready-code-not-authorization.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/cases/ready-code-not-authorization.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/repos/mini-ledger/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/repos/mini-ledger/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/repos/mini-ledger/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/scripts/asks-a-question.sh](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/asks-a-question.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/scripts/check-no-side-effects.sh](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-no-side-effects.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/scripts/check-r2-confirm-first.sh](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-r2-confirm-first.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [evals/fixtures/scripts/check-starts-pipeline.sh](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/evals/fixtures/scripts/check-starts-pipeline.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| — | [references/debug-return.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/debug-return.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| — | [references/intake.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/intake.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/next-work-handoff.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/next-work-handoff.md) | [references/next-work-handoff.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/next-work-handoff.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/plan-brief.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/plan-brief.md) | [references/plan-brief.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/plan-brief.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/pr-watch-loop.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/pr-watch-loop.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/review-followup.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/review-followup.md) | [references/review-followup.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/review-followup.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/shipping-tail.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/shipping-tail.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| — | [references/shipping.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/shipping.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/stage-routing.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/stage-routing.md) | [references/stage-routing.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/stage-routing.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/task-visibility.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/task-visibility.md) | [references/task-visibility.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/task-visibility.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/tracker-defer.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/tracker-defer.md) | [references/tracker-defer.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/tracker-defer.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [references/work-return.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/work-return.md) | [references/work-return.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/work-return.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [scripts/pr-watch-state.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/scripts/pr-watch-state.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
| [scripts/working-tree-fingerprint.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/scripts/working-tree-fingerprint.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 双方包全文审读；路由/决策/验证/残余/发布/恢复与watch边界裁定见逐项笔记 |
