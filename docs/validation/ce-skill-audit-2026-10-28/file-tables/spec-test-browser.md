# spec-test-browser 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/docs/guides/README.md](/Users/kuang/xiaobu/compound-engineering-plugin/docs/guides/README.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | guide index全文，仅作为文档consumer不提升为source权威 |
| — | [@dependency/docs/guides/ce-test-browser.md](/Users/kuang/xiaobu/compound-engineering-plugin/docs/guides/ce-test-browser.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 测试直接消费guide全文，与CE入口相符 |
| [@dependency/scripts/run-test-suite.cjs](/Users/kuang/xiaobu/spec-first/scripts/run-test-suite.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 退役test表及runner全文 |
| [@dependency/skills/spec-lfg/references/stage-routing.md](/Users/kuang/xiaobu/spec-first/skills/spec-lfg/references/stage-routing.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 真实forward+intake与browser gate全文 |
| — | [@dependency/tests/ce-test-browser-driver-policy.test.ts](/Users/kuang/xiaobu/compound-engineering-plugin/tests/ce-test-browser-driver-policy.test.ts) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | driver policy静态及port脚本fixture全文 |
| [@dependency/tests/helpers/lfg-contract.js](/Users/kuang/xiaobu/spec-first/tests/helpers/lfg-contract.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 测试拼接helper全文 |
| [@dependency/tests/unit/spec-test-browser-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-test-browser-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 1078行完整审读，mock seam不能代替真实browser |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [evals/capability-cases.json](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/evals/capability-cases.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [evals/cases/invalid-origin-rejected.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/evals/cases/invalid-origin-rejected.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [evals/cases/missing-origin-not-run.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/evals/cases/missing-origin-not-run.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| — | [references/agent-browser-driver.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/references/agent-browser-driver.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [references/pipeline-orchestration.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/references/pipeline-orchestration.md) | [references/pipeline-orchestration.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/references/pipeline-orchestration.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [references/route-and-report.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/references/route-and-report.md) | [references/route-and-report.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/references/route-and-report.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [scripts/agent-browser-exact-origin-conformance.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/scripts/agent-browser-exact-origin-conformance.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| [scripts/agent-browser-run-context.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-test-browser/scripts/agent-browser-run-context.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
| — | [scripts/resolve-port.sh](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/scripts/resolve-port.sh) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文审读；独占owner与CE driver意图比较详见笔记，vitals和producer cleanup机械反例已留证 |
