# 知识与交接续审阅读清单

读取日期2026-11-01；HEAD `1aa272a606710407e69b22d0452a34cd9b0d1f8f`。目标五目录相对 `049e52744` 的 git diff 为空。表中SHA标识实际读取版本，不能恢复内容；正文按章节引用。所有shell reads退出正常；组合输出截断处已分别补读关键Phase文本，eval大输出保留部分状态。

## 覆盖与排除

- S08/S15一级Phase引用、schema、词汇规则及产物模板完整读；两套schema/yaml guide/template/concepts/validator以cmp确认字节相同后共享阅读。
- S14三个reference及380行writer完整读；S13五个一级reference、实际inline也必读的resolver prompt及全部五脚本完整读；S21三persona与test lens完整读，不能按仅派发worker排除。
- S08可选专家prompt未读：本次未提出其领域文档质量结论；session-historian及private-history scripts未审，已读session-history.md的授权/范围边界，但不证明该条件路径底层可靠。
- eval入口与所有case读过，仅评估其覆盖设计；没有运行或复用历史通过。长judge组合读取有截断，除明确完整项外不作为全文已审或行为通过；独立fixture实现不在本次静态skill结论范围。
- 源码发布的并发/原子性语义以promotion/publication与writer代码为依据；无真实写入/真实GitHub/API调用。

## 确定性统计

采集方法：Python `splitlines`计行、description行长度，references全体Markdown计行；数字只为定位成本，不判质量。

| Skill | 入口行数 | description字符数（含YAML行） | references Markdown行数 |
|---|---:|---:|---:|
| spec-compound | 61 | 300 | 1598 |
| spec-resolve-pr-feedback | 126 | 200 | 678 |
| spec-handoff | 99 | 413 | 108 |
| spec-compound-refresh | 164 | 348 | 1300 |
| spec-simplify-code | 108 | 213 | 53 |

## Source依赖清单

| 路径 | 类别/状态/作用或排除理由 | SHA-256 |
|---|---|---|
| `skills/spec-compound/SKILL.md` | 完整读：定位/权限/Phase/出口 | `02da78aefef12b96966fc4dd7e9fedd48d29ab5bbc9f03d57f1f6f6127852cca` |
| `skills/spec-compound/references/agents/best-practices-researcher.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `19c48a8741546888efae2bfd5798115eb5cdc1d2c4c098c9cd696017effef22c` |
| `skills/spec-compound/references/agents/data-integrity-guardian.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `db9cd2ee40e30bdf8b84bb6abaff03f61b44a04218875637a651a66cbf0d7900` |
| `skills/spec-compound/references/agents/framework-docs-researcher.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `8d336dfcfcf36f8b8e5eed1070932c7ffb1af48c9eb813b5c00a029cf32d4753` |
| `skills/spec-compound/references/agents/pattern-recognition-specialist.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `0d73822ccea06dd3e9a25e9e21e1908377cb9c5364b678b940fefef7f84c9580` |
| `skills/spec-compound/references/agents/performance-oracle.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `4566cd4eb9fbe7c5dc33d2f0424e25e0748b5b4552ffc617b7d3182e23ae7eb3` |
| `skills/spec-compound/references/agents/security-sentinel.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `398b2466bab3d96b1d2fc9beb484076380873c4c77f0ba0c57a96eddd5810fd3` |
| `skills/spec-compound/references/agents/session-historian.md` | 条件排除：专用领域/私有历史worker，本轮无相应领域结论，不执行授权派发 | `c90377c86e04ea79aa6e89c5f3be02f6b6cfefeeb3c5c51f895ae7258f035ef8` |
| `skills/spec-compound/references/assembly.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `e354d7c17e2e4bacf8e4eb24c57a77fe6301d0610e3ffe35aa0941e6124bc5e9` |
| `skills/spec-compound/references/concepts-vocabulary.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `76fc46b7966d11d70042a293626173c4f5394e7abd0555b4bb79d2f8d0d6a993` |
| `skills/spec-compound/references/enhancement.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `aea742e97f5f8aeeafccd38cc2091406fb2a1cdd3f728a2d1df4befb34176a08` |
| `skills/spec-compound/references/grounding-validation.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `92613636eb5e83df363038ec75630d11dcb1d5426e42172e50ae0daf329d9dbd` |
| `skills/spec-compound/references/lightweight.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `c1cef00d217c3859eb8a51731b5cb691fc1fbb320068d1d31c6bcc07836d8a70` |
| `skills/spec-compound/references/modes.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `dec899f88bd94094f71bd98ed3f5958e1631ff60435cc34b9e391ecf9576c80d` |
| `skills/spec-compound/references/promotion.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `b32a156e82bf6dc686134de23a5a1d7f6ee13883b354b2422dcdbb80e8e949b6` |
| `skills/spec-compound/references/refresh-and-discoverability.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `c87d6f61310f11e0bcf67c4671ea3cd278189a3c7d88628912a2c6424d661650` |
| `skills/spec-compound/references/report.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `fa2bcb90e21c8d0845570f070908bfea8f089c0b5b8f8a6d5ce0a42bdb83e4ed` |
| `skills/spec-compound/references/research.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `fabab6ca5623bf4b6b7bdaec4c7f88658fc346bc0bc468620aee0f97d62faf2e` |
| `skills/spec-compound/references/schema.yaml` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `a722ed392f9e06004df138d058254548d9089f83dcaaac1518dfdabe5b92acf3` |
| `skills/spec-compound/references/session-history.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `80604f4007672e3424d1a6cbc2bd45c5324d41ddd62cc14dde5eaf5383a7dd06` |
| `skills/spec-compound/references/yaml-schema.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `ba84ca667c0ef36930a83ee5a37a53afe7d3ef5f56a146428c97cfdcaa6a9074` |
| `skills/spec-compound/scripts/run-python.sh` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `ae5ff4417bb96ac45a8f2aee143dc0bea59fa69bf101968b543e22dd766ef7c9` |
| `skills/spec-compound/scripts/session-history/discover-sessions.sh` | 覆盖缺口：已读上层授权合同，未审底层私有历史提取；不宣称该路径可靠 | `2b00a0147dd33ab0c5d8beac5b2e92800e6de6ec955586861565edfb1b67abe4` |
| `skills/spec-compound/scripts/session-history/extract-errors.py` | 覆盖缺口：已读上层授权合同，未审底层私有历史提取；不宣称该路径可靠 | `4f4548383a25678a867554696af90de8c59f8cafecd1dfdb6aedec4dadf7b184` |
| `skills/spec-compound/scripts/session-history/extract-metadata.py` | 覆盖缺口：已读上层授权合同，未审底层私有历史提取；不宣称该路径可靠 | `63adae1483e2d7cd9e5f89d5d57cc28489f572ac746a0548cdc0e38854c02b49` |
| `skills/spec-compound/scripts/session-history/extract-skeleton.py` | 覆盖缺口：已读上层授权合同，未审底层私有历史提取；不宣称该路径可靠 | `2a718e2a547ac60649b4f7edcb52fa3bbad627dc818e233cf02cdd2be9c16f32` |
| `skills/spec-compound/scripts/validate-doc-claims.py` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `2b00789e7f82e20f65bdd692ff6a803724e246f691acd01ff83b75f0da045801` |
| `skills/spec-compound/scripts/validate-frontmatter.py` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `097dd8a84c70ab5888e115d30c63cd8f346fc59a0d835061409c8f9e95871dfb` |
| `skills/spec-compound/assets/resolution-template.md` | 完整读：合格产物和promotion字段；两套cmp相同 | `5497072f9386e7d96cd84e6b07363a0ba75078a074e2f529292e02da427dbac5` |
| `skills/spec-resolve-pr-feedback/SKILL.md` | 完整读：定位/权限/Phase/出口 | `594de7ca1be76c76a462c281879e4a0837f6e4c433d7949432e2f5e8a30c580d` |
| `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md` | 完整读：inline/worker实现与partial-return合同 | `03bbc260ffa2d759082e68eb1e781ca5c144717f1b238e1b3f95d3cd5f828ccc` |
| `skills/spec-resolve-pr-feedback/references/evaluation-rubric.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `720fc38d7d1ed33d4c2a0eedf7b9beab8859b28a815a1a7fa2f96703c14bfd8f` |
| `skills/spec-resolve-pr-feedback/references/full-mode.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `476a6e217223153f6fb1bc619f4efcd010d7a043831f64adb452a8c841b0ec71` |
| `skills/spec-resolve-pr-feedback/references/pipeline-mode.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `e790121a32bb422ba4fad14a5c1d8e9ed5a17a63052908df3d79cec2307c39c8` |
| `skills/spec-resolve-pr-feedback/references/pipeline-return.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `ed06222a0b69cfc34e7c5baa15db8b29886f8799ec1e8967599c08dc98e7d027` |
| `skills/spec-resolve-pr-feedback/references/targeted-mode.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `ddad6305be46328f817e8c10ef900a9b8f658019ad4eaa8eeec7ed48001d41d4` |
| `skills/spec-resolve-pr-feedback/scripts/get-pr-comments` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `e3d0831f4423fd19e25dd618b567fbeb87e6ad51798de19e359ae63a83e03f44` |
| `skills/spec-resolve-pr-feedback/scripts/get-thread-for-comment` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `5e43b7540c5bad2a35cbe9d053f31cc1fb2326e91d88320696a935620fb3fc05` |
| `skills/spec-resolve-pr-feedback/scripts/inspect-fix-publication.cjs` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `11b0320a5fc769e06dbbcc7f1df12d70a1816c0b5aad9968dfcb11dad4246ca2` |
| `skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `fef210173548e0ec98d7bc302cbaf5d92c910c6366f46376ceac16ca3191adba` |
| `skills/spec-resolve-pr-feedback/scripts/resolve-pr-thread` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `a2582a71110c49ad66e66c4954d0647d0ab0597838409e1f4896ac8f6b90d83f` |
| `skills/spec-handoff/SKILL.md` | 完整读：定位/权限/Phase/出口 | `4bc4a2e1da3aa5caa1e547c9f9d59410099823fa315c77f56c8e71ac7a5b6d6c` |
| `skills/spec-handoff/references/artifact-contract.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `57ad1f8fdb1587cf8b212e23fb0c069b2d51a01b36511a78378272471f934aa7` |
| `skills/spec-handoff/references/create.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `73f91ab6e0b167f3cfc9976ac0660a6da7bdbe9cc7b6e053ea229808c13e1018` |
| `skills/spec-handoff/references/resume.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `6e3b2b086fecb62e3f3e898d432ae9c2677c641d0bd9bf091889fc3e003e6137` |
| `skills/spec-handoff/scripts/handoff-artifact.cjs` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `7875e4d8a4350de177d6eb28af88af7bf0f97ebe12721330b5d0a0383dfbc21d` |
| `skills/spec-compound-refresh/SKILL.md` | 完整读：定位/权限/Phase/出口 | `b0a5dccac1b77e349fa4a99e0e83ea20857fbf992fa6fdd1d3aa5893db0b90e3` |
| `skills/spec-compound-refresh/references/classify.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `cde894ffe38853b58b537e427f427c4eabbc77e3ccb5ac089a4eb7126dbf3bca` |
| `skills/spec-compound-refresh/references/commit.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `ba75126b57298e91707e349f31182522c68a338de079366325a862c2f51b307c` |
| `skills/spec-compound-refresh/references/concepts-vocabulary.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `76fc46b7966d11d70042a293626173c4f5394e7abd0555b4bb79d2f8d0d6a993` |
| `skills/spec-compound-refresh/references/discoverability.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `2fd6b6f53fd98c85c918aac64388f0c270f32dca23c7aa728be1d28a26670a2e` |
| `skills/spec-compound-refresh/references/investigate.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `7df8cadd55728f6649415d78bd2270da06c8a7b73bdf0d4739dae692143b4788` |
| `skills/spec-compound-refresh/references/modes.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `fa297debc138f2943284cd88aabf02e30b96d3a7b268ecb913c5cbdcd8b81c4b` |
| `skills/spec-compound-refresh/references/per-action-flows.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `4e9cb3bac5d992f550cf77e82b9068f47a04318bc0edf1cbda8847e90ce61bf1` |
| `skills/spec-compound-refresh/references/publication.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `d070209006c0b93ad92cde99dc8c263314cd86c535d6a8aacfbe1d3775d3e0cc` |
| `skills/spec-compound-refresh/references/report.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `1108af6daf69e221bd27da21d7961bb05a111d3f984f64e463e8532d4e3408f7` |
| `skills/spec-compound-refresh/references/schema.yaml` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `a722ed392f9e06004df138d058254548d9089f83dcaaac1518dfdabe5b92acf3` |
| `skills/spec-compound-refresh/references/scope.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `952dcba67b9fceee15986c83313e6104587e20064902b343a9d2b4b4564ca08c` |
| `skills/spec-compound-refresh/references/vocabulary-refresh.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `e972a30527b4392518e37b1631858f887794b47ca1906351492cde2764747f43` |
| `skills/spec-compound-refresh/references/worth-audit.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `0706817d519fcedf1bb585fdbd80c634bc7aa8dd748383c90bc0acbbd0128958` |
| `skills/spec-compound-refresh/references/yaml-schema.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `ba84ca667c0ef36930a83ee5a37a53afe7d3ef5f56a146428c97cfdcaa6a9074` |
| `skills/spec-compound-refresh/scripts/run-python.sh` | 未展开：非本次判断必要直接依赖；不复用该资产的执行结论 | `ae5ff4417bb96ac45a8f2aee143dc0bea59fa69bf101968b543e22dd766ef7c9` |
| `skills/spec-compound-refresh/scripts/validate-doc-claims.py` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `2b00789e7f82e20f65bdd692ff6a803724e246f691acd01ff83b75f0da045801` |
| `skills/spec-compound-refresh/scripts/validate-frontmatter.py` | 完整读：确定性出口/只读事实；两套validator cmp相同 | `097dd8a84c70ab5888e115d30c63cd8f346fc59a0d835061409c8f9e95871dfb` |
| `skills/spec-compound-refresh/assets/resolution-template.md` | 完整读：合格产物和promotion字段；两套cmp相同 | `5497072f9386e7d96cd84e6b07363a0ba75078a074e2f529292e02da427dbac5` |
| `skills/spec-simplify-code/SKILL.md` | 完整读：定位/权限/Phase/出口 | `ed1f1b0d4c1926e8ff3a656cfc77f51de893a81f3ce5aa106ca355d9103b7320` |
| `skills/spec-simplify-code/references/personas/code-quality-reviewer.md` | 完整读：inline同样必读的三个评审lens | `7bdc8dfa97907a9754d6a2cff35477d987041d6d3b98cf809b6014d1e35708e3` |
| `skills/spec-simplify-code/references/personas/code-reuse-reviewer.md` | 完整读：inline同样必读的三个评审lens | `e8fac77c60edafecc4044c008c49069c4b1a508baaee369f4b8c6a7eb92655ee` |
| `skills/spec-simplify-code/references/personas/efficiency-reviewer.md` | 完整读：inline同样必读的三个评审lens | `82c1ad7d0b58ed1517ec8916d3c758833b4870e6e7d31039d42ac7efcacd4b08` |
| `skills/spec-simplify-code/references/test-value-lens.md` | 完整读：Phase或条件行为合同；S08/S15相同文件共享阅读 | `651c230a43c0fd639c3d9b69a9fd895d7a28bf35324dba7c4406aa043962ebc2` |

## 共享合同与真实消费者

| 路径/范围 | 状态与用途 | SHA-256 |
|---|---|---|
| `skills/spec-work/references/shipping-workflow.md` | 50–84：S21调用scope/proof/final-tree ownership；其余不展开 | `2092c0868ab6e271d841455f92d1c15d550c5b0f18fde5b28461a3f237ece8ac` |
| `skills/spec-work/references/feedback-and-tests.md` | 152–末尾：proof与test-only seam传递和最终树复跑 | `71adda968968fcff7c10d3748dc2adcca8f36cca0d0787cdd4046158169f4b2a` |
| `skills/spec-lfg/references/shipping-tail.md` | 52–末尾：S13返回、pending动作与S14 next-work授权 | `a43900ccebaaa65ec605efa1486c309a2e688990f49db1637d8c33cacc780e71` |
| `skills/spec-lfg/references/next-work-handoff.md` | 完整读：S14调用方选择/目标/验收区别 | `a3164be63fc57c568e04d9960f1d8b0d7c1c570488837f8023e027f8ba2d4de5` |
| `skills/spec-lfg/references/pr-watch-loop.md` | 48–76：S13 conversation completion/独立授权/重试事实 | `51da73ae3a84bfefc53ee0d7a6263e95a07d7f2fef723e8dc3345953a0a65c72` |
| `docs/project-reviews/2026-11-01-development-skills-review-requirements.md` | 3.1–3.9/4/5.2/6/7.2完整读；范围/标准 | `4415b828c0eba3867618237b5cc9bd82ad2f5ec2b952156f096a3836d62c0aa1` |
| `docs/project-reviews/2026-11-01-ai-assisted-brownfield-research.md` | R1–R30索引及限定章节说明已读；外部原文新鲜度共享主agent R2/R4/R6 2026-11-01读取 | `a0c3fe876bbdcf157097f8517e532a371dca80f483c71d15ab1f5865c4b1cf15` |

## 评测资产（未执行）

| 路径 | 状态 | SHA-256 |
|---|---|---|
| `skills/spec-compound/evals/eval.yaml` | 完整读配置/case；不是结果 | `444d5173a0f1d1ddd77d24113a66adadefcff41265469fcf720af2e16e3254b7` |
| `skills/spec-compound/evals/cases/bootstrap-routes-refresh.yaml` | 完整读配置/case；不是结果 | `6ec8874eb69d0ede0d8349dbd9b1739696e688813a7971653c79d4eaf8c2cc8a` |
| `skills/spec-compound/evals/cases/counterfactual-recoverable-no-write.yaml` | 完整读配置/case；不是结果 | `4aaa9c5a0bde9755c39c60a6b0d6b6caf6503bd59cb33575e38bf8fe952c6232` |
| `skills/spec-compound/evals/cases/headless-no-qualifying-no-complete.yaml` | 完整读配置/case；不是结果 | `9e56e0f9456c0d5b4050b5c7b002e5a582a79431675b0d29589edc1402f7e0b9` |
| `skills/spec-compound/evals/cases/positive-publish-produces-solution.yaml` | 完整读配置/case；不是结果 | `e9a0744359b2cf6f517c52616118856122e18dd7c221fe1950436f3413dfddf4` |
| `skills/spec-compound/evals/cases/unsolved-no-write.yaml` | 完整读配置/case；不是结果 | `c80875a26db48eddb721c4c91f41d15c8e1f2753d5364457b2917e7fd951a4f2` |
| `skills/spec-compound/evals/fixtures/scripts/check-counterfactual-no-write.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `05d882ec4758c76b6c35bc92dd2d740f4d2def65e2027a6ce87b328c8ef2fea6` |
| `skills/spec-compound/evals/fixtures/scripts/check-headless-no-complete.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `479b6cf5859194a8f13905ae2fb65fb7400499ca423076a1c1c8cbf8f914c5fe` |
| `skills/spec-compound/evals/fixtures/scripts/check-refuses-unsolved.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `357251c0055d0ff17295bd3c689600cec275be9f356d5a239427ce160f513df8` |
| `skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `0dfa96792ec5d581b49127b35e9329b07d4edb208fec7b79df1564b60d5369dc` |
| `skills/spec-resolve-pr-feedback/evals/eval.yaml` | 完整读配置/case；不是结果 | `5bf01022768aa554dc90dbb6ff8d14b6bc747e207a56ac0550816bc7e22f0b14` |
| `skills/spec-resolve-pr-feedback/evals/cases/comment-injection-untrusted.yaml` | 完整读配置/case；不是结果 | `8681376f0669f712a8d598bf7926c2b74fbeacea3878f716a1f94390dd25414c` |
| `skills/spec-resolve-pr-feedback/evals/cases/independent-authority-matrix.yaml` | 完整读配置/case；不是结果 | `b642d69851d4799d47898e1cbd38b3de19b9a92e1eab7cc8a7a0ccfe88b10fef` |
| `skills/spec-resolve-pr-feedback/evals/cases/no-fix-auth-readonly.yaml` | 完整读配置/case；不是结果 | `d503f2503f8dc256d7ba18cc2f8d0e5186b79d3dd89172957f1f32b4a41e54e2` |
| `skills/spec-resolve-pr-feedback/evals/cases/pipeline-pending-conversation.yaml` | 完整读配置/case；不是结果 | `db521b130e3d7abc8dd2ff9277435abc6253e322ba07a17dde54a0b4d9a8dfe9` |
| `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-authorized-fix.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `1ae98d4dafebd398344548b30617de3d0ac2784c80e4b4771193538c884e1df9` |
| `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-no-injection-exec.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `aac890dbe37e51649d5ae6f9fe0f43593b15df8b7e71408f0c8a7aa6f654b8a3` |
| `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-pipeline-pending.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `cafccd7cd38333dc06c01a4023349fe694a86acb4e92c3be4e8bab9c9bc6ae06` |
| `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-readonly.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `ddb8c29dcb8aa80ec382180e4de455ed0b19bb5e2095c96540e94f1a6f358b60` |
| `skills/spec-handoff/evals/eval.yaml` | 完整读配置/case；不是结果 | `8bb18da9e59e5113b04a563c73149b9665e7dae9528f6f0bd3ef2a9d9238ccb8` |
| `skills/spec-handoff/evals/cases/check-research-continuation.yaml` | 完整读配置/case；不是结果 | `1d3486cff17ddefc7c91a10fcf77b2cdf1c80ab3f626827e88c21259a3e883d9` |
| `skills/spec-handoff/evals/cases/check-review-continuation.yaml` | 完整读配置/case；不是结果 | `d3a7dd82bff2d808177c5d364c4ae6742b6a6f089f7a40384ec974f8b9f58b41` |
| `skills/spec-handoff/evals/cases/create-produces-gate-fields.yaml` | 完整读配置/case；不是结果 | `08e2cd1bf4bc9f1d5e3a2271e7cc5df57bcfcfd03ff89fcb57afcde09c3c37a5` |
| `skills/spec-handoff/evals/cases/ordinary-continuation-not-triggered.yaml` | 完整读配置/case；不是结果 | `8e722fe13101332d209b889ec20678e6491f02b4eb46770ef4e3c7b478e62621` |
| `skills/spec-handoff/evals/cases/resume-explicit-source-stops-without-acting.yaml` | 完整读配置/case；不是结果 | `d7c19a7e286cf4da999ce98ff45ed3836968091c82dace8779fd589c4dcc0da2` |
| `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml` | 完整读配置/case；不是结果 | `9916002df4acedff34f62be2530a89d586fa964da3e4d01a1bed66e8d22c5f07` |
| `skills/spec-handoff/evals/fixtures/scripts/check-continues-inline.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `d47d17ce4c967574cdbd81a7e88cfcb4e2d338e9e3845632dd4cb52d1871220d` |
| `skills/spec-handoff/evals/fixtures/scripts/check-create-artifact.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `3a9761fe952b6e00570581f3dd517778d165d4ec28180f45a67c91567ad1ba07` |
| `skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `62fc32aab2bfb1fde34c5e9736a978fccf29e300538a6be393f05378b92b0c4a` |
| `skills/spec-handoff/evals/fixtures/scripts/check-research-continuation.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `243dd25793eb03e27f7da4dd682bf2f632889bb0a71a80e7047a6084b2d3304e` |
| `skills/spec-handoff/evals/fixtures/scripts/check-resume-no-side-effects.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `62fc32aab2bfb1fde34c5e9736a978fccf29e300538a6be393f05378b92b0c4a` |
| `skills/spec-handoff/evals/fixtures/scripts/check-review-continuation.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `21daa2b01058bed34a9fb237f406dac28cf231d133819e4dc058a5cfbd600624` |
| `skills/spec-compound-refresh/evals/eval.yaml` | 完整读配置/case；不是结果 | `f1d2c3403d7b10aaab06d89da28e95aa94845e8f33d083f7c8f06031b5bba914` |
| `skills/spec-compound-refresh/evals/cases/non-solutions-scope-gated.yaml` | 完整读配置/case；不是结果 | `ce21b8e11aa5f3d50c1099b9e73d2211909533a0eccf6cd727ff6f5f818768ed` |
| `skills/spec-compound-refresh/evals/fixtures/scripts/check-scope-gate.sh` | 完整读断言；仅支持文中评测设计局限，不是行为通过 | `e91f7166296b7c91033f88855535c08862779cd5fb12270f689cd495268c38ce` |
| `skills/spec-simplify-code/evals/eval.yaml` | 完整读配置/case；不是结果 | `8b19cff8e16cdd55110b0e7198b9b1844bedc1c0ae672b77d57cedbd006966f9` |
| `skills/spec-simplify-code/evals/cases/bug-request-routes-debug.yaml` | 完整读配置/case；不是结果 | `8c5dd2ae80267c1838577c9144ae60f42c31f0efaca1e499af252a8bc103372e` |
| `skills/spec-simplify-code/evals/cases/docs-only-no-yield.yaml` | 完整读配置/case；不是结果 | `104e1aa428f760f82a897bd403a8a23c57f0b298a92f65aa965c201959979563` |
| `skills/spec-simplify-code/evals/cases/r2-elegant-refactor.yaml` | 完整读配置/case；不是结果 | `c6be4fae47b8ce6d39b524bab62b7b3d4dca3443882ff0d6056fa4ad7196f4f0` |
| `skills/spec-simplify-code/evals/cases/safety-check-preserved.yaml` | 完整读配置/case；不是结果 | `54f7e51a7a713d07fd839336834bb52274f4daa0d121dec8d5fa79ca23fdf327` |
| `skills/spec-simplify-code/evals/fixtures/scripts/check-no-yield-scope.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `2c549413333958fd6014f4bc0f43886274a23d19ad567631eed9c81ae56fe8ab` |
| `skills/spec-simplify-code/evals/fixtures/scripts/check-r2-safety-stays.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `937461da08d8d6103af59d5b8603d0001b56561a7085d18b2047d49dee5bb4ae` |
| `skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh` | 部分读取：组合输出截断，不主张完整覆盖 | `937461da08d8d6103af59d5b8603d0001b56561a7085d18b2047d49dee5bb4ae` |

## 补充真实消费者

`skills/spec-plan/references/planning-evidence-boundaries.md` 第1–44行已读：docs/solutions作为advisory需current source重核，消除了把published learning自动当永久confirmed事实的消费者误读；不是完整plan审查。SHA-256：`3147727567747f35055f3f64c2cadb345f1892019736524a3cf1e0710b0212f5`。
