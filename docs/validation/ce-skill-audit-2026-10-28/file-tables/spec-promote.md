# spec-promote 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/skills/ce-noslop/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-noslop/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用同hash已全文审读：共同写作owner，不复制整套word blacklist |
| — | [@dependency/skills/ce-noslop/references/patterns.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-noslop/references/patterns.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用同hash已全文审读：共同写作owner，不复制整套word blacklist |
| — | [@dependency/skills/ce-noslop/references/terminology.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-noslop/references/terminology.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用同hash已全文审读：共同写作owner，不复制整套word blacklist |
| [@dependency/tests/unit/ce-localization-round-1-remediation-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/ce-localization-round-1-remediation-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对auth和副作用语义合同；不是实际provider验证 |
| [@dependency/tests/unit/spec-promote-auth-probe.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-promote-auth-probe.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对auth和副作用语义合同；不是实际provider验证 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-promote/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-promote/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| — | [agents/openai.yaml](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-promote/agents/openai.yaml) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/cases/no-publish-side-effects.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/cases/no-publish-side-effects.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/cases/nothing-shipped-asks.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/cases/nothing-shipped-asks.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/repos/mini-ledger/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/repos/mini-ledger/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/fixtures/repos/mini-ledger/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/repos/mini-ledger/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/fixtures/scripts/asks-a-question.sh](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/asks-a-question.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [evals/fixtures/scripts/check-no-publish.sh](/Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/check-no-publish.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [references/spiral-cli.md](/Users/kuang/xiaobu/spec-first/skills/spec-promote/references/spiral-cli.md) | [references/spiral-cli.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-promote/references/spiral-cli.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
| [scripts/check-spiral-auth.cjs](/Users/kuang/xiaobu/spec-first/skills/spec-promote/scripts/check-spiral-auth.cjs) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对价值表达、草稿边界、provider readiness/egress及eval；裁定见逐项笔记 |
