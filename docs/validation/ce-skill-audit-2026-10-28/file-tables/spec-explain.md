# spec-explain 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/tests/skills/ce-explain-behavior-trace.test.ts](/Users/kuang/xiaobu/compound-engineering-plugin/tests/skills/ce-explain-behavior-trace.test.ts) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| — | [@dependency/tests/skills/ce-explain-relocated-invariants.test.ts](/Users/kuang/xiaobu/compound-engineering-plugin/tests/skills/ce-explain-relocated-invariants.test.ts) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| — | [@dependency/tests/skills/ce-explain-routing.test.ts](/Users/kuang/xiaobu/compound-engineering-plugin/tests/skills/ce-explain-routing.test.ts) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| [@dependency/tests/unit/fresh-repo-grounding-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/fresh-repo-grounding-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| [@dependency/tests/unit/private-scratch-migration-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/private-scratch-migration-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| [@dependency/tests/unit/specialized-skill-calibration-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/specialized-skill-calibration-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接解释合同；静态断言不证明模型/host行为 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/cases/simple-qa-not-triggered.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/cases/simple-qa-not-triggered.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/fixtures/repos/mini-ledger/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/fixtures/repos/mini-ledger/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/fixtures/repos/mini-ledger/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/fixtures/scripts/asks-a-question.sh](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/fixtures/scripts/asks-a-question.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [evals/fixtures/scripts/check-simple-qa.sh](/Users/kuang/xiaobu/spec-first/skills/spec-explain/evals/fixtures/scripts/check-simple-qa.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| — | [references/agents/behavior-trace-scout.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/agents/behavior-trace-scout.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/agents/work-recap-scout.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/agents/work-recap-scout.md) | [references/agents/work-recap-scout.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/agents/work-recap-scout.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/check-in.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/check-in.md) | [references/check-in.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/check-in.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/destinations.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/destinations.md) | [references/destinations.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/destinations.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/explainer-html.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/explainer-html.md) | [references/explainer-html.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/explainer-html.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/explainer-markdown.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/explainer-markdown.md) | [references/explainer-markdown.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/explainer-markdown.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/intake.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/intake.md) | [references/intake.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/intake.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
| [references/orchestration.md](/Users/kuang/xiaobu/spec-first/skills/spec-explain/references/orchestration.md) | [references/orchestration.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/references/orchestration.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对；行为trace、caller、token、教学及交付边界的裁定见逐项笔记 |
