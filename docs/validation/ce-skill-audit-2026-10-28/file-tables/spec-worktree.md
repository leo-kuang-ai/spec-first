# spec-worktree 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| [@dependency/skills/spec-dogfood/references/phases.md](/Users/kuang/xiaobu/spec-first/skills/spec-dogfood/references/phases.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接caller/ref/隔离边界，不等于所属Skill整包审完 |
| [@dependency/skills/spec-work/references/execution-engines.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/references/execution-engines.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接caller/ref/隔离边界，不等于所属Skill整包审完 |
| [@dependency/skills/spec-work/references/execution-strategy.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/references/execution-strategy.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接caller/ref/隔离边界，不等于所属Skill整包审完 |
| [@dependency/tests/unit/spec-worktree-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-worktree-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文核对直接caller/ref/隔离边界，不等于所属Skill整包审完 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/cases/governed-caller-create-worktree.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/cases/governed-caller-create-worktree.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/cases/not-git-repo-fails-closed.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/cases/not-git-repo-fails-closed.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/cases/unborn-repo-create-refuses.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/cases/unborn-repo-create-refuses.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app-nogit/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app-nogit/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app-nogit/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app-nogit/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app-nogit/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app-nogit/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app/README.md](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app/README.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app/package.json](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app/package.json) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app/prepare-worktree-fixture.sh](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app/prepare-worktree-fixture.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/repos/plain-app/src/server.js](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/repos/plain-app/src/server.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/scripts/check-create-worktree.sh](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-create-worktree.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/scripts/check-not-git-refuses.sh](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-not-git-refuses.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [evals/fixtures/scripts/check-unborn-refuses.sh](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/evals/fixtures/scripts/check-unborn-refuses.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
| [scripts/worktree-manager.sh](/Users/kuang/xiaobu/spec-first/skills/spec-worktree/scripts/worktree-manager.sh) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全部全文核对；隔离能力/native/PR、env/trust及实际脚本复现裁定见笔记 |
