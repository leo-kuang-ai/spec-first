# 2026-10-31 文档目录命名迁移

本记录承接同日的 [目录整理](./2026-10-31-docs-organization.md)。当前命名约定见 [文档总入口](../../README.md)。

## 目标与边界

统一主目录的小写英文命名及方法论历史谱系；保持中文正文文件名、角色契约原则、现行 workflow 语义与证据可信边界。只在现行入口、文档、源码和路径消费测试中更新引用；不把目录改名扩大为能力实现或历史完成声明。

## 目录映射

| 原目录 | 当前目录 |
|---|---|
| `docs/05-用户手册/` | `docs/user-guide/` |
| `docs/10-prompt/` | `docs/methodology/` |
| `docs/10-prompt/历史快照/` | `docs/methodology/history/` |
| `docs/10-prompt/历史快照/审查方法-历史/` | `docs/methodology/history/review-methods/` |
| `docs/10-prompt/历史快照/角色治理演化-历史/` | `docs/methodology/history/role-governance/` |
| `docs/VERSION/` | `docs/releases/` |
| `docs/项目审查/` | `docs/project-reviews/` |
| `docs/strategic-review/` | `docs/strategic-reviews/` |
| `docs/archive/backups/10-prompt/` | `docs/archive/backups/methodology/` |

## 消费者与历史兼容

- `CLAUDE.md` 指向新的角色契约位置，通过 `npm run sync:instructions -- --write` 派生 `AGENTS.md`，不手改其生成治理区。
- README、用户手册、现行方法论、contracts、solutions 和 active 计划更新现行引用；doctor 恢复指引与实际读取文档的现有测试同步新路径。
- 方法论历史正文、带日期的审查/战略/版本历史正文、已完成或取代计划、验证 payload、fixture、历史 CHANGELOG 以及图谱/wiki 快照保留当时语境。历史引用按此记录映射追溯，不提供旧路径别名或第二份 canonical。
- `tests/unit/git-quoted-path-decoding.test.js` 中的旧目录字符串是临时仓库输入，未读取本项目文档，保留其 Git 路径解码用例。
- 不直接修改 generated runtime mirrors，不运行 init 或刷新图谱。此次变更不修改 Skill 行为资产；已安装或缓存的宿主上下文、旧图谱/wiki 可能继续显示旧路径，须以当前 source 和本迁移表为准。本记录不声明真实宿主重新加载已验证。
- 既有验证包保留名称；新专题遵循日期前缀约定。`docs/plans/*.md` 保持现行 CLI 的平铺边界。

## 文件级映射与完整性

以下迁移前 SHA-256 从写入前工作区读取。现行导航文件允许同步路径与命名说明，因此列出迁移后 SHA-256；历史正文、备份与角色契约正文要求字节保持不变。

| 原路径 | 当前文件 | 迁移前 SHA-256 | 迁移后 SHA-256 |
|---|---|---|---|
| `docs/05-用户手册/01-快速开始.md` | [docs/user-guide/01-快速开始.md](../../user-guide/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md) | `4bdcd065607d096ba0cce6164dac445c327f04cd6bab885452534131ab35de73` | `4bdcd065607d096ba0cce6164dac445c327f04cd6bab885452534131ab35de73` |
| `docs/05-用户手册/02-核心概念.md` | [docs/user-guide/02-核心概念.md](../../user-guide/02-%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5.md) | `c49326399d97e4d4e71b70f417318fd94c99fbd6575a9ff652ba92379cd67de7` | `c49326399d97e4d4e71b70f417318fd94c99fbd6575a9ff652ba92379cd67de7` |
| `docs/05-用户手册/03-完整示例.md` | [docs/user-guide/03-完整示例.md](../../user-guide/03-%E5%AE%8C%E6%95%B4%E7%A4%BA%E4%BE%8B.md) | `07c1d8a88accb6816802e7d08e1e6536aea370b5c810cd63453521d8bf7f2fec` | `07c1d8a88accb6816802e7d08e1e6536aea370b5c810cd63453521d8bf7f2fec` |
| `docs/05-用户手册/04-workflows-artifacts-map.md` | [docs/user-guide/04-workflows-artifacts-map.md](../../user-guide/04-workflows-artifacts-map.md) | `f5cc457e10ebe8a53a6c7468c4430f8270ff233af71465c063b005219c176400` | `f5cc457e10ebe8a53a6c7468c4430f8270ff233af71465c063b005219c176400` |
| `docs/05-用户手册/04-常见问题.md` | [docs/user-guide/04-常见问题.md](../../user-guide/04-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98.md) | `bf974a54c8f98c05d00f1325c07373de49b318c1739196ed99a4c924370588b1` | `d2ac19e533b4c68ec5eff90d6fb84167297e29a1bc3c5c5f13a2e12bf43533ab` |
| `docs/05-用户手册/05-最佳实践.md` | [docs/user-guide/05-最佳实践.md](../../user-guide/05-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5.md) | `0baec946e5f21b66378292be15c437d24fd413788123771e2f80898545558e09` | `0baec946e5f21b66378292be15c437d24fd413788123771e2f80898545558e09` |
| `docs/05-用户手册/06-本地源码安装.md` | [docs/user-guide/06-本地源码安装.md](../../user-guide/06-%E6%9C%AC%E5%9C%B0%E6%BA%90%E7%A0%81%E5%AE%89%E8%A3%85.md) | `dced57bed20913a74a91b660e29fa40c4ab0909cc1b474620b0c7db489d58b8b` | `dced57bed20913a74a91b660e29fa40c4ab0909cc1b474620b0c7db489d58b8b` |
| `docs/05-用户手册/07-内部培训使用讲稿.md` | [docs/user-guide/07-内部培训使用讲稿.md](../../user-guide/07-%E5%86%85%E9%83%A8%E5%9F%B9%E8%AE%AD%E4%BD%BF%E7%94%A8%E8%AE%B2%E7%A8%BF.md) | `5923ecdf908f199a75af724caf55159a957dbe01ab33f143df77d9f2957acd5c` | `f4c05f4d449b53dc7af09ce2c84d6352b0a5c83c66f31af58a314c582090b483` |
| `docs/05-用户手册/08-三种开发模式.md` | [docs/user-guide/08-三种开发模式.md](../../user-guide/08-%E4%B8%89%E7%A7%8D%E5%BC%80%E5%8F%91%E6%A8%A1%E5%BC%8F.md) | `849e7f869a9c5ea6e420ff961e66a8a51a768a60f67e0b295480a7ca1b421541` | `849e7f869a9c5ea6e420ff961e66a8a51a768a60f67e0b295480a7ca1b421541` |
| `docs/05-用户手册/09-首次工作流走查.md` | [docs/user-guide/09-首次工作流走查.md](../../user-guide/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md) | `6bb2ef22c3a4b641946bff8761e584ca460700814201fea68d27d6ba7709a466` | `6bb2ef22c3a4b641946bff8761e584ca460700814201fea68d27d6ba7709a466` |
| `docs/05-用户手册/10-产物目录.md` | [docs/user-guide/10-产物目录.md](../../user-guide/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md) | `11523bf7966476ebd922e15a9f74384877215dd8d9246476aa5a61b44e9b80b0` | `11523bf7966476ebd922e15a9f74384877215dd8d9246476aa5a61b44e9b80b0` |
| `docs/05-用户手册/12-gitignore参考.md` | [docs/user-guide/12-gitignore参考.md](../../user-guide/12-gitignore%E5%8F%82%E8%80%83.md) | `3fe1dd0c3823906fff53b29fff0547d58464b280f5fd391256777d3718e7c4d5` | `3fe1dd0c3823906fff53b29fff0547d58464b280f5fd391256777d3718e7c4d5` |
| `docs/05-用户手册/20-研发场景与降级路径.md` | [docs/user-guide/20-研发场景与降级路径.md](../../user-guide/20-%E7%A0%94%E5%8F%91%E5%9C%BA%E6%99%AF%E4%B8%8E%E9%99%8D%E7%BA%A7%E8%B7%AF%E5%BE%84.md) | `dac8ea23bd99e89b3b28d78739acee201973ec0c3d10119e71cae89615a1f31a` | `dac8ea23bd99e89b3b28d78739acee201973ec0c3d10119e71cae89615a1f31a` |
| `docs/05-用户手册/21-OpenSpec与spec-first阶段适用性对比.md` | [docs/user-guide/21-OpenSpec与spec-first阶段适用性对比.md](../../user-guide/21-OpenSpec%E4%B8%8Espec-first%E9%98%B6%E6%AE%B5%E9%80%82%E7%94%A8%E6%80%A7%E5%AF%B9%E6%AF%94.md) | `264de1227a8d21e986e320488d94262e0acb08e606f9d9ae9d8f829b03397eeb` | `264de1227a8d21e986e320488d94262e0acb08e606f9d9ae9d8f829b03397eeb` |
| `docs/05-用户手册/22-PRD需求文档质量增强流程.md` | [docs/user-guide/22-PRD需求文档质量增强流程.md](../../user-guide/22-PRD%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3%E8%B4%A8%E9%87%8F%E5%A2%9E%E5%BC%BA%E6%B5%81%E7%A8%8B.md) | `772e68f9393f8fc5c1f256f86130e6dff82e5a401a2255ea20ae0e76b2110e2f` | `772e68f9393f8fc5c1f256f86130e6dff82e5a401a2255ea20ae0e76b2110e2f` |
| `docs/05-用户手册/23-spec-prd当前执行逻辑.md` | [docs/user-guide/23-spec-prd当前执行逻辑.md](../../user-guide/23-spec-prd%E5%BD%93%E5%89%8D%E6%89%A7%E8%A1%8C%E9%80%BB%E8%BE%91.md) | `ed5b505ec232828a7f1462092d92a026d887b02c7c367e682dde3b3914727f86` | `ed5b505ec232828a7f1462092d92a026d887b02c7c367e682dde3b3914727f86` |
| `docs/05-用户手册/24-公开入口与Skill目录.md` | [docs/user-guide/24-公开入口与Skill目录.md](../../user-guide/24-%E5%85%AC%E5%BC%80%E5%85%A5%E5%8F%A3%E4%B8%8ESkill%E7%9B%AE%E5%BD%95.md) | `d83dfa92ce91e349623f8d7d5cefb727fc321700c4569beeed687cb771858810` | `d83dfa92ce91e349623f8d7d5cefb727fc321700c4569beeed687cb771858810` |
| `docs/05-用户手册/README.md` | [docs/user-guide/README.md](../../user-guide/README.md) | `640c2d4a43f25e3825f2d28745f05570b2dd360a6f70de820793475fc0df5c65` | `640c2d4a43f25e3825f2d28745f05570b2dd360a6f70de820793475fc0df5c65` |
| `docs/10-prompt/AI-Coding-Harness演化方法论.md` | [docs/methodology/AI-Coding-Harness演化方法论.md](../../methodology/AI-Coding-Harness%E6%BC%94%E5%8C%96%E6%96%B9%E6%B3%95%E8%AE%BA.md) | `1c67b1bb644448ac009008951f353052d90582e7ea2d38a174fec81d66ec0c44` | `1c67b1bb644448ac009008951f353052d90582e7ea2d38a174fec81d66ec0c44` |
| `docs/10-prompt/CE与spec-first-Skill核对与选择性吸收方法论.md` | [docs/methodology/CE与spec-first-Skill核对与选择性吸收方法论.md](../../methodology/CE%E4%B8%8Espec-first-Skill%E6%A0%B8%E5%AF%B9%E4%B8%8E%E9%80%89%E6%8B%A9%E6%80%A7%E5%90%B8%E6%94%B6%E6%96%B9%E6%B3%95%E8%AE%BA.md) | `960c70f50869ff6762812b5ef733dbe654fce9f5c1d874eb050bbd7ab8e6467b` | `960c70f50869ff6762812b5ef733dbe654fce9f5c1d874eb050bbd7ab8e6467b` |
| `docs/10-prompt/GPT-5.6提示工程方法论.md` | [docs/methodology/GPT-5.6提示工程方法论.md](../../methodology/GPT-5.6%E6%8F%90%E7%A4%BA%E5%B7%A5%E7%A8%8B%E6%96%B9%E6%B3%95%E8%AE%BA.md) | `947ef96b6a935231ac08c22825c2d2ae873466ba95b727077da3231c2fbaea74` | `947ef96b6a935231ac08c22825c2d2ae873466ba95b727077da3231c2fbaea74` |
| `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md` | [docs/methodology/Ponytail思想指导spec-first-Skill优化.md](../../methodology/Ponytail%E6%80%9D%E6%83%B3%E6%8C%87%E5%AF%BCspec-first-Skill%E4%BC%98%E5%8C%96.md) | `a48de4b4d1c75127ba521b0457f984905f122ea2687ed1a18348ad5d3bd791f0` | `65b641fa0f98098e1fe8f1fc1906f2526fc6a8882c8766339015354f30811586` |
| `docs/10-prompt/README.md` | [docs/methodology/README.md](../../methodology/README.md) | `c4ad6a2466f8d3aba35673de2156d2b43a82f6529a28a20d8f7dc142c1b66eb7` | `c52c8a2c09086a280fcf19b64310ca3b591be1b4c0a8bed235e2e2ac1ff58669` |
| `docs/10-prompt/skill-prompt-设计与优化方法论-v2.md` | [docs/methodology/skill-prompt-设计与优化方法论-v2.md](../../methodology/skill-prompt-%E8%AE%BE%E8%AE%A1%E4%B8%8E%E4%BC%98%E5%8C%96%E6%96%B9%E6%B3%95%E8%AE%BA-v2.md) | `d3f6c4868a9e39fd1e45c9cbbdcccd22199b050aec2571d3809eae911bb6dd4c` | `3785dff3c627fa0a7f50df56c5bfcc8bf548e4dc4bbfb83c113609c9f907e146` |
| `docs/10-prompt/skill-prompt-设计与优化方法论-通用版.md` | [docs/methodology/skill-prompt-设计与优化方法论-通用版.md](../../methodology/skill-prompt-%E8%AE%BE%E8%AE%A1%E4%B8%8E%E4%BC%98%E5%8C%96%E6%96%B9%E6%B3%95%E8%AE%BA-%E9%80%9A%E7%94%A8%E7%89%88.md) | `f98e7d9d1758f58bbc733aeaa583343134fee478209a8c478941485aba5d9edd` | `f98e7d9d1758f58bbc733aeaa583343134fee478209a8c478941485aba5d9edd` |
| `docs/10-prompt/spec-first-skill-prompt压缩优化组合方法论.md` | [docs/methodology/spec-first-skill-prompt压缩优化组合方法论.md](../../methodology/spec-first-skill-prompt%E5%8E%8B%E7%BC%A9%E4%BC%98%E5%8C%96%E7%BB%84%E5%90%88%E6%96%B9%E6%B3%95%E8%AE%BA.md) | `334a8b408fdd920d4f1a70e46083d803244e2b6ffd5e76741b655cf4759d1f62` | `84970f51971b2b2d3b60256a4e363b410d4ce62e12667ea1e70ae2483fcdd0e1` |
| `docs/10-prompt/spec-first代码审查方案.md` | [docs/methodology/spec-first代码审查方案.md](../../methodology/spec-first%E4%BB%A3%E7%A0%81%E5%AE%A1%E6%9F%A5%E6%96%B9%E6%A1%88.md) | `742c42afc26cf7ac0453b565dd930117bea740a0913ab87852b8981228c68bf7` | `4c9463e675d8732db48aed8e0333724871f63d5c3fb8019a0bb572ae542ee821` |
| `docs/10-prompt/兼容性审查.md` | [docs/methodology/兼容性审查.md](../../methodology/%E5%85%BC%E5%AE%B9%E6%80%A7%E5%AE%A1%E6%9F%A5.md) | `0c33d47f0edf12bda30d6ba02629fdf75df3d704b0403e7b406fac6ff8635acb` | `1f69fffd511469780bb098701888bf7e6baca5b18ec207f1cc549570c92da7b2` |
| `docs/10-prompt/历史快照/README.md` | [docs/methodology/history/README.md](../../methodology/history/README.md) | `f5394e893fefab7234948ecff0f0801ef7270469cfed81868ae3884b8e485eca` | `94882ce5be923c710a2b7a2dfb619a313d071750fbc5354e01ac81f1d53ef007` |
| `docs/10-prompt/历史快照/审查方法-历史/README.md` | [docs/methodology/history/review-methods/README.md](../../methodology/history/review-methods/README.md) | `960c319dd5380337aaada52ae5858a7333813ef36e8399b2f5376193f15b5230` | `960c319dd5380337aaada52ae5858a7333813ef36e8399b2f5376193f15b5230` |
| `docs/10-prompt/历史快照/审查方法-历史/全面项目审查.md` | [docs/methodology/history/review-methods/全面项目审查.md](../../methodology/history/review-methods/%E5%85%A8%E9%9D%A2%E9%A1%B9%E7%9B%AE%E5%AE%A1%E6%9F%A5.md) | `2ff885eafa6d17e6fb1977fca5f1bcd0b931243ff8468d46f82172b683f4df14` | `2ff885eafa6d17e6fb1977fca5f1bcd0b931243ff8468d46f82172b683f4df14` |
| `docs/10-prompt/历史快照/审查方法-历史/审查agent.md` | [docs/methodology/history/review-methods/审查agent.md](../../methodology/history/review-methods/%E5%AE%A1%E6%9F%A5agent.md) | `0015a7000d6f68321a67b9086d3566b53b300b0a7c77ba32fd751b4fb1454ae1` | `0015a7000d6f68321a67b9086d3566b53b300b0a7c77ba32fd751b4fb1454ae1` |
| `docs/10-prompt/历史快照/审查方法-历史/审查skill.md` | [docs/methodology/history/review-methods/审查skill.md](../../methodology/history/review-methods/%E5%AE%A1%E6%9F%A5skill.md) | `2659bb8bbcb204e8ea57e8b79fd5fb94c50ef5c7556c3bbd7725fac128c6ad44` | `2659bb8bbcb204e8ea57e8b79fd5fb94c50ef5c7556c3bbd7725fac128c6ad44` |
| `docs/10-prompt/历史快照/审查方法-历史/审查token.md` | [docs/methodology/history/review-methods/审查token.md](../../methodology/history/review-methods/%E5%AE%A1%E6%9F%A5token.md) | `77eb689c231a98b1821fe7efb122014b9e2771845c870ac3be4a7cc6fdb5ae91` | `77eb689c231a98b1821fe7efb122014b9e2771845c870ac3be4a7cc6fdb5ae91` |
| `docs/10-prompt/历史快照/审查方法-历史/项目审查.md` | [docs/methodology/history/review-methods/项目审查.md](../../methodology/history/review-methods/%E9%A1%B9%E7%9B%AE%E5%AE%A1%E6%9F%A5.md) | `b7319bbd256f763e50b23172fe347b2f6d90b93cace12be7a46cb5aa1b55f1bb` | `b7319bbd256f763e50b23172fe347b2f6d90b93cace12be7a46cb5aa1b55f1bb` |
| `docs/10-prompt/历史快照/角色治理演化-历史/README.md` | [docs/methodology/history/role-governance/README.md](../../methodology/history/role-governance/README.md) | `70103aaf4ca9be5cef0f616e9224edfc1843d1290cfb713c12b82ffce811113f` | `70103aaf4ca9be5cef0f616e9224edfc1843d1290cfb713c12b82ffce811113f` |
| `docs/10-prompt/历史快照/角色治理演化-历史/自我进化.md` | [docs/methodology/history/role-governance/自我进化.md](../../methodology/history/role-governance/%E8%87%AA%E6%88%91%E8%BF%9B%E5%8C%96.md) | `993cca6126280226a319e4dae9f93979d2216509eae4b8ab513c911fd4640837` | `993cca6126280226a319e4dae9f93979d2216509eae4b8ab513c911fd4640837` |
| `docs/10-prompt/历史快照/角色治理演化-历史/项目owner角色.md` | [docs/methodology/history/role-governance/项目owner角色.md](../../methodology/history/role-governance/%E9%A1%B9%E7%9B%AEowner%E8%A7%92%E8%89%B2.md) | `d8c9849cd5bd99d2b7fb37eed69377b2da595d9c7779344af20521a19cb697a4` | `d8c9849cd5bd99d2b7fb37eed69377b2da595d9c7779344af20521a19cb697a4` |
| `docs/10-prompt/历史快照/角色治理演化-历史/项目治理-agent.md` | [docs/methodology/history/role-governance/项目治理-agent.md](../../methodology/history/role-governance/%E9%A1%B9%E7%9B%AE%E6%B2%BB%E7%90%86-agent.md) | `ad86388501befacdd0afadcc35665beffff34be7355eee6f290eaf6c6842b214` | `ad86388501befacdd0afadcc35665beffff34be7355eee6f290eaf6c6842b214` |
| `docs/10-prompt/历史快照/角色治理演化-历史/项目治理.md` | [docs/methodology/history/role-governance/项目治理.md](../../methodology/history/role-governance/%E9%A1%B9%E7%9B%AE%E6%B2%BB%E7%90%86.md) | `8a6b60a233d15f3c3f8f295465fe9dcc2882d8b4bad322b330a193b702423125` | `8a6b60a233d15f3c3f8f295465fe9dcc2882d8b4bad322b330a193b702423125` |
| `docs/10-prompt/历史快照/角色治理演化-历史/项目角色.md` | [docs/methodology/history/role-governance/项目角色.md](../../methodology/history/role-governance/%E9%A1%B9%E7%9B%AE%E8%A7%92%E8%89%B2.md) | `798d873167878538cf1892d408e8588841fe1220ff3e44c6fb3af040ece62961` | `798d873167878538cf1892d408e8588841fe1220ff3e44c6fb3af040ece62961` |
| `docs/10-prompt/审查整个 skill 是否具备 Harness 能力.md` | [docs/methodology/审查整个 skill 是否具备 Harness 能力.md](../../methodology/%E5%AE%A1%E6%9F%A5%E6%95%B4%E4%B8%AA%20skill%20%E6%98%AF%E5%90%A6%E5%85%B7%E5%A4%87%20Harness%20%E8%83%BD%E5%8A%9B.md) | `71223d56bb2f2747af52da847286c42a38d5f8996a6138983b32aa0a0f6d61da` | `71223d56bb2f2747af52da847286c42a38d5f8996a6138983b32aa0a0f6d61da` |
| `docs/10-prompt/当前分支与远程master-Skill能力审计提示词.md` | [docs/methodology/当前分支与远程master-Skill能力审计提示词.md](../../methodology/%E5%BD%93%E5%89%8D%E5%88%86%E6%94%AF%E4%B8%8E%E8%BF%9C%E7%A8%8Bmaster-Skill%E8%83%BD%E5%8A%9B%E5%AE%A1%E8%AE%A1%E6%8F%90%E7%A4%BA%E8%AF%8D.md) | `d319098579baa2b9c8a9fd0921c50d731def479233f851a8627d9f506d28d7b3` | `fdb4c04f354fd3400251a8e6c5e8015da4053f61b46504f8ecbfd3baf997608c` |
| `docs/10-prompt/系统性项目审查方法.md` | [docs/methodology/系统性项目审查方法.md](../../methodology/%E7%B3%BB%E7%BB%9F%E6%80%A7%E9%A1%B9%E7%9B%AE%E5%AE%A1%E6%9F%A5%E6%96%B9%E6%B3%95.md) | `3ff6f408112fdfca15ab44b8b565aeb46266d72d5603ca7697f1cc6599a959cc` | `6b54dc0efa6dea4ebe706893dce467a71e6f5985771433c5df27a1a4b4ddc01f` |
| `docs/10-prompt/结构化项目角色契约.md` | [docs/methodology/结构化项目角色契约.md](../../methodology/%E7%BB%93%E6%9E%84%E5%8C%96%E9%A1%B9%E7%9B%AE%E8%A7%92%E8%89%B2%E5%A5%91%E7%BA%A6.md) | `447e66b751639a36afb455380159f3b800c4a48b1189b304bed92a53a0ba0738` | `447e66b751639a36afb455380159f3b800c4a48b1189b304bed92a53a0ba0738` |
| `docs/10-prompt/项目整体审查.md` | [docs/methodology/项目整体审查.md](../../methodology/%E9%A1%B9%E7%9B%AE%E6%95%B4%E4%BD%93%E5%AE%A1%E6%9F%A5.md) | `8b59df95b5d0c4ef33ba074aafb2b3ab936b8efdd518c3da626cf12e05412ca8` | `8b59df95b5d0c4ef33ba074aafb2b3ab936b8efdd518c3da626cf12e05412ca8` |
| `docs/10-prompt/项目负责人工作契约.md` | [docs/methodology/项目负责人工作契约.md](../../methodology/%E9%A1%B9%E7%9B%AE%E8%B4%9F%E8%B4%A3%E4%BA%BA%E5%B7%A5%E4%BD%9C%E5%A5%91%E7%BA%A6.md) | `35f5e18e450d492e309602fc7acbc7e7e2f8b76b632a1f1ec9a1614183dafe7a` | `c6c167d48a88764d044050c7ef0d3ea53bd46f54bfeddeb0fb617bfc0e9c7974` |
| `docs/VERSION/2026-05-11-1.8.2.md` | [docs/releases/2026-05-11-1.8.2.md](../../releases/2026-05-11-1.8.2.md) | `d72f3b5fa2bf61beee3a651af5b643e3956d6c02465809fbfb048db6232622c2` | `d72f3b5fa2bf61beee3a651af5b643e3956d6c02465809fbfb048db6232622c2` |
| `docs/VERSION/2026-06-02-1.10.0.md` | [docs/releases/2026-06-02-1.10.0.md](../../releases/2026-06-02-1.10.0.md) | `1ab30fc7c9c8f9edb3080fd2f03a170766ec0b30b4385ffe3f36ceea00e773dd` | `1ab30fc7c9c8f9edb3080fd2f03a170766ec0b30b4385ffe3f36ceea00e773dd` |
| `docs/VERSION/2026-06-15-1.11.0.md` | [docs/releases/2026-06-15-1.11.0.md](../../releases/2026-06-15-1.11.0.md) | `18fb42f1c34d377437c4aebd32775890b8928b1bdbcd513265a1ce2854f55a35` | `18fb42f1c34d377437c4aebd32775890b8928b1bdbcd513265a1ce2854f55a35` |
| `docs/VERSION/2026-06-17-1.11.4.md` | [docs/releases/2026-06-17-1.11.4.md](../../releases/2026-06-17-1.11.4.md) | `b20455013bdf8794cc9ad5ca5cab10d1f99ce401cdc611e901e7dba1b0ce4904` | `b20455013bdf8794cc9ad5ca5cab10d1f99ce401cdc611e901e7dba1b0ce4904` |
| `docs/VERSION/2026-06-23-1.11.5.md` | [docs/releases/2026-06-23-1.11.5.md](../../releases/2026-06-23-1.11.5.md) | `e63b1a8c5fb6737d1b56c79c581c66fcc93f8e11e74c00e2fb7d86b311a1c2ea` | `e63b1a8c5fb6737d1b56c79c581c66fcc93f8e11e74c00e2fb7d86b311a1c2ea` |
| `docs/VERSION/2026-06-25-1.12.0.md` | [docs/releases/2026-06-25-1.12.0.md](../../releases/2026-06-25-1.12.0.md) | `3b80b4d4dfbec170978ea19106bbd70b9fbd69740f790c24338ba08731889fc7` | `3b80b4d4dfbec170978ea19106bbd70b9fbd69740f790c24338ba08731889fc7` |
| `docs/VERSION/2026-07-02-1.12.1.md` | [docs/releases/2026-07-02-1.12.1.md](../../releases/2026-07-02-1.12.1.md) | `1df156d1a112e62ed6062e2ee2e79adf8e97ff40203867cc0c1d07ca81a8cee5` | `1df156d1a112e62ed6062e2ee2e79adf8e97ff40203867cc0c1d07ca81a8cee5` |
| `docs/VERSION/2026-07-05-branch-multi-host-preview.md` | [docs/releases/2026-07-05-branch-multi-host-preview.md](../../releases/2026-07-05-branch-multi-host-preview.md) | `d80edfd931836e0bcff8839ec60807c9db57b5d42876af3f242a0cf2692dce72` | `d80edfd931836e0bcff8839ec60807c9db57b5d42876af3f242a0cf2692dce72` |
| `docs/VERSION/2026-07-06-1.13.1.md` | [docs/releases/2026-07-06-1.13.1.md](../../releases/2026-07-06-1.13.1.md) | `b64593165be90ecbec20a70e680e448e6a1d1c965537f1140bbc6b0d3ba8a08e` | `b64593165be90ecbec20a70e680e448e6a1d1c965537f1140bbc6b0d3ba8a08e` |
| `docs/VERSION/2026-08-11-1.15.0.md` | [docs/releases/2026-08-11-1.15.0.md](../../releases/2026-08-11-1.15.0.md) | `40a9ce15543932e7009332b121c25f1d615cc008b4eee7f17d8ee374281330d9` | `40a9ce15543932e7009332b121c25f1d615cc008b4eee7f17d8ee374281330d9` |
| `docs/VERSION/2026-08-16-1.15.1.md` | [docs/releases/2026-08-16-1.15.1.md](../../releases/2026-08-16-1.15.1.md) | `9d0a8a6ca87f07936daf4d9e8b1f5563ae3cae8aec5634973f9ee23b2e18f666` | `9d0a8a6ca87f07936daf4d9e8b1f5563ae3cae8aec5634973f9ee23b2e18f666` |
| `docs/VERSION/README.md` | [docs/releases/README.md](../../releases/README.md) | `5acee4978b1deab0b4334c70b70587fe8d4a437fe19dbc66fc1bae4d66c28abe` | `5acee4978b1deab0b4334c70b70587fe8d4a437fe19dbc66fc1bae4d66c28abe` |
| `docs/archive/backups/10-prompt/Ponytail思想指导spec-first-Skill优化.md.backup-20260820-161301` | [docs/archive/backups/methodology/Ponytail思想指导spec-first-Skill优化.md.backup-20260820-161301](../backups/methodology/Ponytail%E6%80%9D%E6%83%B3%E6%8C%87%E5%AF%BCspec-first-Skill%E4%BC%98%E5%8C%96.md.backup-20260820-161301) | `5da1e1f443c556d4a736f06580603bbf1abd36a3d42e4d65b15dc633e8a6bd74` | `5da1e1f443c556d4a736f06580603bbf1abd36a3d42e4d65b15dc633e8a6bd74` |
| `docs/archive/backups/10-prompt/Ponytail思想指导spec-first-Skill优化.md.bak2` | [docs/archive/backups/methodology/Ponytail思想指导spec-first-Skill优化.md.bak2](../backups/methodology/Ponytail%E6%80%9D%E6%83%B3%E6%8C%87%E5%AF%BCspec-first-Skill%E4%BC%98%E5%8C%96.md.bak2) | `c85f3323faf7c44c708cd65ee8d070e9bb768158ad1165967929e021ce038b35` | `c85f3323faf7c44c708cd65ee8d070e9bb768158ad1165967929e021ce038b35` |
| `docs/archive/backups/10-prompt/README.md` | [docs/archive/backups/methodology/README.md](../backups/methodology/README.md) | `39d4c3a9d41f1be09632a535d5144599240457b92307c9d4bb243cf86c659271` | `29b31983faef18a813ef69c81bc08be3c128b379d67df823ca9afdfae4d38f57` |
| `docs/strategic-review/2026-08-02-ai-landscape-analysis.md` | [docs/strategic-reviews/2026-08-02-ai-landscape-analysis.md](../../strategic-reviews/2026-08-02-ai-landscape-analysis.md) | `ed0ace3c3a202f0f4c15f5c1e0da5d3a508671488780bac512bcf3883aec35e4` | `ed0ace3c3a202f0f4c15f5c1e0da5d3a508671488780bac512bcf3883aec35e4` |
| `docs/strategic-review/2026-08-02-executive-summary.md` | [docs/strategic-reviews/2026-08-02-executive-summary.md](../../strategic-reviews/2026-08-02-executive-summary.md) | `9be6aa7e41870c73fef793da44aa9140c1a97b58bf0be0f6ae2e08055da79717` | `9be6aa7e41870c73fef793da44aa9140c1a97b58bf0be0f6ae2e08055da79717` |
| `docs/strategic-review/2026-08-02-implementation-plan.md` | [docs/strategic-reviews/2026-08-02-implementation-plan.md](../../strategic-reviews/2026-08-02-implementation-plan.md) | `0aad867c05d591de6a3bf5e2ff925ae04039c0d3726130845cb56f39d9ba05ec` | `0aad867c05d591de6a3bf5e2ff925ae04039c0d3726130845cb56f39d9ba05ec` |
| `docs/strategic-review/2026-08-02-project-quality-assessment.md` | [docs/strategic-reviews/2026-08-02-project-quality-assessment.md](../../strategic-reviews/2026-08-02-project-quality-assessment.md) | `f6cb146e57a7160d3df37bd4f80d29872786ae00823b8750ae2962a658170c7a` | `f6cb146e57a7160d3df37bd4f80d29872786ae00823b8750ae2962a658170c7a` |
| `docs/strategic-review/2026-08-02-solution-roadmap.md` | [docs/strategic-reviews/2026-08-02-solution-roadmap.md](../../strategic-reviews/2026-08-02-solution-roadmap.md) | `f0cb403841f8336af5912c5bc48eb26aba81b615c8c144002fbebc0d13cdee6c` | `f0cb403841f8336af5912c5bc48eb26aba81b615c8c144002fbebc0d13cdee6c` |
| `docs/strategic-review/2026-08-11-external-engineering-skill-capability-mapping.md` | [docs/strategic-reviews/2026-08-11-external-engineering-skill-capability-mapping.md](../../strategic-reviews/2026-08-11-external-engineering-skill-capability-mapping.md) | `e8a91fc6d7c154eee0d4c602f8fc79e1659157e0a482ebf2248dd1de4e7e69eb` | `e8a91fc6d7c154eee0d4c602f8fc79e1659157e0a482ebf2248dd1de4e7e69eb` |
| `docs/strategic-review/2026-09-05-gpt6-astra-instruction-optimization-plan.md` | [docs/strategic-reviews/2026-09-05-gpt6-astra-instruction-optimization-plan.md](../../strategic-reviews/2026-09-05-gpt6-astra-instruction-optimization-plan.md) | `1a040086b997cc7ce9afb2483e3be73494cda7a6a00710becfc0773171fa90ff` | `1a040086b997cc7ce9afb2483e3be73494cda7a6a00710becfc0773171fa90ff` |
| `docs/strategic-review/2026-09-05-harness-research-sources.md` | [docs/strategic-reviews/2026-09-05-harness-research-sources.md](../../strategic-reviews/2026-09-05-harness-research-sources.md) | `acca905fc2d53516b420a110ca5094ce5d3b3f0fdcd69b82d7bd9f3c461e1cd0` | `acca905fc2d53516b420a110ca5094ce5d3b3f0fdcd69b82d7bd9f3c461e1cd0` |
| `docs/strategic-review/2026-09-05-next-phase-capability-strategy.md` | [docs/strategic-reviews/2026-09-05-next-phase-capability-strategy.md](../../strategic-reviews/2026-09-05-next-phase-capability-strategy.md) | `5b80d0059567e930789b8f984e6e9562354a44cd79c7d9fd31e506252f68a106` | `5b80d0059567e930789b8f984e6e9562354a44cd79c7d9fd31e506252f68a106` |
| `docs/strategic-review/README.md` | [docs/strategic-reviews/README.md](../../strategic-reviews/README.md) | `15f9c42176dbdd4d462165e5b2aee037c09f242257d66b99b50d730444f02690` | `2c80cb6eaf5d33d2b6086f1090af10d213a44dd71e84998022cbf260022aebad` |
| `docs/项目审查/2026-07-06-skill-prompt-精简优化方案.md` | [docs/project-reviews/2026-07-06-skill-prompt-精简优化方案.md](../../project-reviews/2026-07-06-skill-prompt-%E7%B2%BE%E7%AE%80%E4%BC%98%E5%8C%96%E6%96%B9%E6%A1%88.md) | `9ce102681a2860a6bb48a9e223547c2720b855823d497c58a9983674266f19d1` | `9ce102681a2860a6bb48a9e223547c2720b855823d497c58a9983674266f19d1` |
| `docs/项目审查/2026-07-06-真实状态与提升优先级.md` | [docs/project-reviews/2026-07-06-真实状态与提升优先级.md](../../project-reviews/2026-07-06-%E7%9C%9F%E5%AE%9E%E7%8A%B6%E6%80%81%E4%B8%8E%E6%8F%90%E5%8D%87%E4%BC%98%E5%85%88%E7%BA%A7.md) | `9bffdf8c06af72842e6040cf9fa1986424d97a0327610af62ee870e026f01afb` | `9bffdf8c06af72842e6040cf9fa1986424d97a0327610af62ee870e026f01afb` |
| `docs/项目审查/README.md` | [docs/project-reviews/README.md](../../project-reviews/README.md) | `73f8e1f66ef1fa3fe1cb462088c74fde16557de573c367059dfdedcc25918714` | `73f8e1f66ef1fa3fe1cb462088c74fde16557de573c367059dfdedcc25918714` |

## 验证记录

- 迁移前六个现有测试套件通过（52 tests），指令同步检查通过。
- 迁移后 11 个现有套件、95 tests 通过，覆盖角色契约读取、用户手册读取、Git 路径解码、计划 taxonomy、doctor 输出与 continuation、指令派生、CHANGELOG 连续性。未新增复述改名实现的测试。
- 首轮误将 doctor integration 用例写为 tests/unit/doctor-continuation.test.js，该项因 ENOENT 未启动；八个有效套件的 71 tests 通过。纠正为 tests/integration/doctor-continuation.test.js 后完成上述 11 套件验证，不将输入错误算作通过。
- `npm run sync:instructions`、`node --check src/cli/commands/doctor.js`、`bash -n scripts/verify-with-gate.sh` 与本批 `git diff --check` 通过。
- 75 个迁移文件均可定位，旧目录不再存在，主目录命名及 README 覆盖检查通过。角色契约正文、未做引用更新的迁移文件逐字节保持不变。
- 当前导航与改动 Markdown 检查 1,682 个相对链接，未发现迁移新增断链。三处原有断链保留：方法论 companion 引用的 2026-07-14 审查报告已不在仓库；npm-skill-template-ownership.md 两处引用的外部模板目录未在仓库保留。不据此宣称全仓库链接健康，也不自动制造缺失材料。
- 现行源码和测试中的旧目录引用已迁移；Git quoted-path 测试中的旧字符串是独立 fixture 输入，保留不影响项目文档消费者。冻结历史引用通过本记录追溯。
- 变更为命名与引用迁移，进行了 inline 差异复核，未分派独立 reviewer；未运行全量测试、init、真实宿主重新加载或发布流程。预存在工作区的其他改动保留，不提交、不推送。

## 验证命令与结果范围

```bash
npx jest --runInBand --runTestsByPath \
  tests/unit/project-role-contract.test.js \
  tests/unit/gitignore-policy.test.js \
  tests/unit/init-workspace-contract.test.js \
  tests/unit/spec-work-run-artifact-contract.test.js \
  tests/unit/mcp-setup-contracts.test.js \
  tests/unit/plan-status-taxonomy.test.js \
  tests/unit/git-quoted-path-decoding.test.js \
  tests/integration/doctor-continuation.test.js \
  tests/unit/doctor-output.test.js \
  tests/unit/sync-instruction-files.test.js \
  tests/unit/changelog-continuity.test.js
npm run sync:instructions
node --check src/cli/commands/doctor.js
bash -n scripts/verify-with-gate.sh
```

链接与完整性检查按迁移前清单比对路径和 hash，区分原有缺失与本次新增断链。这些检查仅证明本次目录与路径消费者范围，不证明宿主缓存已更新、真实模型行为或现场收益。

## 结构化证据收口

本次本地运行标识为 `docs-naming-20261031-r4c7ixpk`。六项检查的 summary 保存在 `.spec-first/workflows/spec-work/spec-first/docs-naming-20261031-r4c7ixpk/verification-run-summary.json`，日志在同 run 的 `logs/`，`honest-closeout.json` 对已转录检查给出 `overall: verified`。该结果只校验当前声明与本地证据的一致性，不等于独立 provider 或现场结果确认。

内部 `spec-work-run-artifact write` 在写入 run.json 前返回 `security-rejected`：changed_files 中的 `docs/methodology/history/review-methods/审查token.md` 命中现有 secret-denied 路径规则。本任务没有删掉该路径来绕过规则，也未修改安全规则；`run_artifact_path: null`，保留 summary、日志、原始错误和本迁移记录。命名交付物已落盘且相关检查通过，但不声明内部 run.json 已生成。此限制只影响该内部运行归档，不改变已迁移文档和已有检查结果。
