# using-spec-first 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/AGENTS.md](/Users/kuang/xiaobu/compound-engineering-plugin/AGENTS.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文读CE source authoring/runtime、自包含、lean grounding和验证规则，不作为本地执行授权 |
| [@dependency/docs/contracts/context-governance.md](/Users/kuang/xiaobu/spec-first/docs/contracts/context-governance.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；首次截断61–76补读，按需上下文/source-runtime区别 |
| [@dependency/docs/contracts/dual-host-governance/README.md](/Users/kuang/xiaobu/spec-first/docs/contracts/dual-host-governance/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文读取source入口与runtime delivery区别；35数量陈旧不作为当前事实 |
| [@dependency/docs/contracts/project-graph-consumption.md](/Users/kuang/xiaobu/spec-first/docs/contracts/project-graph-consumption.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；首次截断80–127补读，direct-source合法/advisory不抬权 |
| [@dependency/docs/contracts/workflows/worker-dispatch-capability.md](/Users/kuang/xiaobu/spec-first/docs/contracts/workflows/worker-dispatch-capability.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 复用simplify已完整读取同hash；本项核对入口dispatch边界 |
| — | [@dependency/skills/ce-brainstorm/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-brainstorm/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 相邻WHAT/轻量/caller-return入口全文审读，非整包完成 |
| — | [@dependency/skills/ce-debug/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用simplify完整同hash入口读取，失败优先IO边界 |
| — | [@dependency/skills/ce-ideate/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 相邻0-1/已有想法入口全文审读，非整包完成 |
| — | [@dependency/skills/lfg/references/stage-routing.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/stage-routing.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文审读stage模型carrier及产品输入分离，不搬进入口 |
| [@dependency/src/cli/adapters/index.js](/Users/kuang/xiaobu/spec-first/src/cli/adapters/index.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对getSupportedPlatforms真实owner；不宣称8个adapter实现已读 |
| [@dependency/src/cli/contracts/dual-host-governance/skills-governance.json](/Users/kuang/xiaobu/spec-first/src/cli/contracts/dual-host-governance/skills-governance.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对全部record及public/internal分类；排除项仅菜单记录不审Skill |
| [@dependency/src/cli/contracts/dual-host-governance/skills-governance.schema.json](/Users/kuang/xiaobu/spec-first/src/cli/contracts/dual-host-governance/skills-governance.schema.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对枚举/schema；不是语义路由oracle |
| [@dependency/tests/unit/using-spec-first-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/using-spec-first-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文读取并执行11 tests通过，仅source合同 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/SKILL.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 本地独立轻量入口；source包含执行连续性，已安装runtime不同不得覆盖source判断 |
| [evals/cases/direct-lane-simple-howto.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/direct-lane-simple-howto.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/cases/failure-priority-single-entry.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/failure-priority-single-entry.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/cases/r2-low-confidence-one-question.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/r2-low-confidence-one-question.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/cases/recommendation-only-format.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/recommendation-only-format.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/cases/route-failure-to-spec-debug.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/route-failure-to-spec-debug.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/cases/route-vague-idea-to-spec-brainstorm.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/cases/route-vague-idea-to-spec-brainstorm.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部eval case/config全文审读，目标词检查不等于语义选择/真实执行覆盖 |
| [evals/fixtures/scripts/check-r2-asks.sh](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/fixtures/scripts/check-r2-asks.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 三问真实exit0；关键词不证明最多一问，需结果导向eval |
| [references/conditional-routing-boundaries.md](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/references/conditional-routing-boundaries.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 完整核对授权/graph/source/runtime/context；包外docs投射解析留待全局consumer检查 |
| [references/public-route-map.md](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/references/public-route-map.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部公开入口与internal边界核对；意图路由不等于模型/harness carrier |
