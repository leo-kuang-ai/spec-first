# spec-commit 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/skills/ce-dogfood/references/phases.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-dogfood/references/phases.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| — | [@dependency/skills/ce-polish/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-polish/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/skills/spec-commit-push-pr/references/branch-creation.md](/Users/kuang/xiaobu/spec-first/skills/spec-commit-push-pr/references/branch-creation.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/skills/spec-commit-push-pr/references/commit-and-push.md](/Users/kuang/xiaobu/spec-first/skills/spec-commit-push-pr/references/commit-and-push.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/skills/spec-dogfood/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-dogfood/SKILL.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/skills/spec-dogfood/references/phases.md](/Users/kuang/xiaobu/spec-first/skills/spec-dogfood/references/phases.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/skills/spec-polish/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-polish/SKILL.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/tests/unit/ce-localization-round-1-remediation-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/ce-localization-round-1-remediation-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/tests/unit/spec-commit-push-pr-context-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-commit-push-pr-context-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [@dependency/tests/unit/spec-commit-scope-regression.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-commit-scope-regression.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已全文核对本项提交调用、授权和验证接口；不替代该 owner 全包审查 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-commit/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 核心提交能力等价；保留本地 internal/授权/mixed-file 保护，建议复用 native 消息写入、exclude 与 U-ID |
| [evals/cases/fresh-tree-logical-grouping.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/cases/fresh-tree-logical-grouping.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/cases/no-auth-stops-before-staging.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/cases/no-auth-stops-before-staging.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/fixtures/repos/mini-ledger/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/fixtures/repos/mini-ledger/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/fixtures/repos/mini-ledger/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/fixtures/repos/mini-ledger/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/fixtures/repos/mini-ledger/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/fixtures/repos/mini-ledger/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 包内文件全文已读；eval 配置、2 个 case 与全部 fixtures 已核对，当前 judge 不能证明全部行为 |
| [evals/fixtures/scripts/check-auth-gate.sh](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/fixtures/scripts/check-auth-gate.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已隔离复现：没有新增 commit 但已经 stage 仍通过；需核对 index |
| [evals/fixtures/scripts/check-logical-grouping.sh](/Users/kuang/xiaobu/spec-first/skills/spec-commit/evals/fixtures/scripts/check-logical-grouping.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 已隔离复现：没有提交也没有分组的消息仍通过；需真实 outcome |
