# 2026-10-31 文档目录整理记录

本次为本地目录与导航整理，不修改 CLI、Skill、契约 schema 或 generated runtime，也不声明历史计划的任务完成。

## 迁移范围与依据

- 18 份历史计划原文含 `status: superseded`；迁移前无未提交改动，未发现现行源码、测试、文档或 `.spec-first` workflow 记录中的文件名引用。保留旧状态与原文。
- 两份方法论备份移出当前基线入口，8 张品牌图片归入 `docs/assets/brand/`。
- 现行计划、任务、契约、项目审查路径及验证 payload 保持原位；其 README 提供用途和生命周期导航。
- 冻结验证快照、manifest、日志和历史 CHANGELOG 不重写。它们保留的旧路径是当时记录，需按下表追溯，不能当作当前直接可打开路径。
- 同一会话此前已将五份讲稿移入 `docs/archive/ppt-script-v4/`，本批只补目录说明。

## 路径与内容校验

下表 SHA-256 在移动前后逐文件比较一致。映射只记录历史到当前位置的关系，不是重定向或 runtime alias。

| 原路径 | 当前文件 | SHA-256 |
|---|---|---|
| `docs/plans/2026-04-13-001-crg-codebase-quality-optimization-plan.md` | [docs/archive/plans/2026/2026-04-13-001-crg-codebase-quality-optimization-plan.md](../plans/2026/2026-04-13-001-crg-codebase-quality-optimization-plan.md) | `1d92a10a7d95ccae767675d195807ef0d380df6143449be496a234eab3084fa1` |
| `docs/plans/2026-04-23-skills-system-review.md` | [docs/archive/plans/2026/2026-04-23-skills-system-review.md](../plans/2026/2026-04-23-skills-system-review.md) | `a46c6f9b56240daca92494672e8a5471bef3804fc0e24d717b9c7bad84d615be` |
| `docs/plans/2026-05-09-skill-doc-splitting-proposal.md` | [docs/archive/plans/2026/2026-05-09-skill-doc-splitting-proposal.md](../plans/2026/2026-05-09-skill-doc-splitting-proposal.md) | `59765be82d1a7ff3232a4a9e1dc8bb726ad2e2a667f988f2279401ce758587e3` |
| `docs/plans/2026-04-14-007-compound-post-sync-optimization-plan.md` | [docs/archive/plans/2026/2026-04-14-007-compound-post-sync-optimization-plan.md](../plans/2026/2026-04-14-007-compound-post-sync-optimization-plan.md) | `4aaa3d1d5f26738b3e1d1ae2a03f0d69d0d654a4e09e67915bc7b8b4361867f7` |
| `docs/plans/2026-05-22-003-feat-crg-impact-review-agent-plan.md` | [docs/archive/plans/2026/2026-05-22-003-feat-crg-impact-review-agent-plan.md](../plans/2026/2026-05-22-003-feat-crg-impact-review-agent-plan.md) | `f9e7673fd87edb4ece5875d23e63a6b4e900419f19bb3c75ac31cd5ba79148f7` |
| `docs/plans/2026-06-11-002-boundary-sections-draft.md` | [docs/archive/plans/2026/2026-06-11-002-boundary-sections-draft.md](../plans/2026/2026-06-11-002-boundary-sections-draft.md) | `b03d8c53ab52fdb579f6f13e03b9865ab2a2d0cbf451bde525127f41a560277c` |
| `docs/plans/2026-04-19-007-next-phase-runtime-contract-followup-plan.md` | [docs/archive/plans/2026/2026-04-19-007-next-phase-runtime-contract-followup-plan.md](../plans/2026/2026-04-19-007-next-phase-runtime-contract-followup-plan.md) | `d41f1996e56abfa73e2510dbbc59877c18df8dfc9b347ca4f70f182f57521b66` |
| `docs/plans/2026-04-15-005-crg-spec-graph-bootstrap-p4-endgame-implementation-plan.md` | [docs/archive/plans/2026/2026-04-15-005-crg-spec-graph-bootstrap-p4-endgame-implementation-plan.md](../plans/2026/2026-04-15-005-crg-spec-graph-bootstrap-p4-endgame-implementation-plan.md) | `3f19e2d45d8710d501f48c83ff0f21dda0d658d8454007ef3f9aa40a9101ff1e` |
| `docs/plans/2026-04-16-013-exact-same-skill-parity-implementation-plan.md` | [docs/archive/plans/2026/2026-04-16-013-exact-same-skill-parity-implementation-plan.md](../plans/2026/2026-04-16-013-exact-same-skill-parity-implementation-plan.md) | `8de8b1f08f382756e7ef2bcf91370a7c3dce6e8e1897f8a1df326e9831e92484` |
| `docs/plans/2026-04-16-015-dual-host-governance-runtime-contract-relocation-plan.md` | [docs/archive/plans/2026/2026-04-16-015-dual-host-governance-runtime-contract-relocation-plan.md](../plans/2026/2026-04-16-015-dual-host-governance-runtime-contract-relocation-plan.md) | `b552931bacf70bc11a9a4fe0cf4a280d3b410ebbd6a34d10db65c30105feb4d8` |
| `docs/plans/2026-04-15-001-spec-graph-bootstrap-goal-closure-optimization-plan.md` | [docs/archive/plans/2026/2026-04-15-001-spec-graph-bootstrap-goal-closure-optimization-plan.md](../plans/2026/2026-04-15-001-spec-graph-bootstrap-goal-closure-optimization-plan.md) | `7743c47b030c78d944ed7074a65c34db0b2ce8e6c8c1c438970b51b7c5f3bea7` |
| `docs/plans/2026-04-14-010-feat-spec-compound-hard-cut-consistency-plan.md` | [docs/archive/plans/2026/2026-04-14-010-feat-spec-compound-hard-cut-consistency-plan.md](../plans/2026/2026-04-14-010-feat-spec-compound-hard-cut-consistency-plan.md) | `080c9e2bab582d10a0aa317a49c2f33386569fafe85dc2027c4ca6d7d7df7acf` |
| `docs/plans/2026-04-15-003-crg-stage0-final-implementation-plan.md` | [docs/archive/plans/2026/2026-04-15-003-crg-stage0-final-implementation-plan.md](../plans/2026/2026-04-15-003-crg-stage0-final-implementation-plan.md) | `fa288472532a8ecd7485f2226b94c114db1b249729265df97b6c3bed5f4ebae0` |
| `docs/plans/2026-04-17-using-spec-first-technical-design.md` | [docs/archive/plans/2026/2026-04-17-using-spec-first-technical-design.md](../plans/2026/2026-04-17-using-spec-first-technical-design.md) | `eaae21cf558083a4acdc37336e50072d8190cf4181d832d7787e20a24e510ac2` |
| `docs/plans/2026-04-21-002-cli-only-database-routing-handoff-plan.md` | [docs/archive/plans/2026/2026-04-21-002-cli-only-database-routing-handoff-plan.md](../plans/2026/2026-04-21-002-cli-only-database-routing-handoff-plan.md) | `dab47ea6de2804f42053dceac7e3dccaa53d05a7c62e341a39b3becd2dba00f9` |
| `docs/plans/2026-04-21-001-refactor-bootstrap-database-evidence-contract-plan.md` | [docs/archive/plans/2026/2026-04-21-001-refactor-bootstrap-database-evidence-contract-plan.md](../plans/2026/2026-04-21-001-refactor-bootstrap-database-evidence-contract-plan.md) | `c31b253925f08bb1be9faadab1ab7ffb427b954f0b9cbdccb79df3b34c5ba5b6` |
| `docs/plans/2026-04-18-004-refactor-karpathy-guidelines-skill-decomposition-plan.md` | [docs/archive/plans/2026/2026-04-18-004-refactor-karpathy-guidelines-skill-decomposition-plan.md](../plans/2026/2026-04-18-004-refactor-karpathy-guidelines-skill-decomposition-plan.md) | `46ac4d67884e1db551953788ed241264ac3651734eb56ae4a5eb536fe381b63d` |
| `docs/plans/2026-04-19-006-next-top3-runtime-truth-plan.md` | [docs/archive/plans/2026/2026-04-19-006-next-top3-runtime-truth-plan.md](../plans/2026/2026-04-19-006-next-top3-runtime-truth-plan.md) | `952cc10c1cc73abd4c54a8558140bc9367d956c3fe9e32d6e95cfd035d2778f1` |
| `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md.bak2` | [docs/archive/backups/10-prompt/Ponytail思想指导spec-first-Skill优化.md.bak2](../backups/methodology/Ponytail%E6%80%9D%E6%83%B3%E6%8C%87%E5%AF%BCspec-first-Skill%E4%BC%98%E5%8C%96.md.bak2) | `c85f3323faf7c44c708cd65ee8d070e9bb768158ad1165967929e021ce038b35` |
| `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md.backup-20260820-161301` | [docs/archive/backups/10-prompt/Ponytail思想指导spec-first-Skill优化.md.backup-20260820-161301](../backups/methodology/Ponytail%E6%80%9D%E6%83%B3%E6%8C%87%E5%AF%BCspec-first-Skill%E4%BC%98%E5%8C%96.md.backup-20260820-161301) | `5da1e1f443c556d4a736f06580603bbf1abd36a3d42e4d65b15dc633e8a6bd74` |
| `docs/spec-first-logo-crops/01_main_logo_full.png` | [docs/assets/brand/01_main_logo_full.png](../../assets/brand/01_main_logo_full.png) | `764274bcfe3515053434616b65b21bebe1abc61b695059ca4292724dcb14c9ca` |
| `docs/spec-first-logo-crops/03_horizontal_logo_lockup.png` | [docs/assets/brand/03_horizontal_logo_lockup.png](../../assets/brand/03_horizontal_logo_lockup.png) | `86db829c34ea149d213127fd8402fc9438e7d9164e9e3a06aef53f6090c752a7` |
| `docs/spec-first-logo-crops/06_clearspace_and_minimum_size.png` | [docs/assets/brand/06_clearspace_and_minimum_size.png](../../assets/brand/06_clearspace_and_minimum_size.png) | `052c52ab2cf9ae84b17634a3edcfae2f82cde81cb7faaaaea20497de88384a1d` |
| `docs/spec-first-logo-crops/07_brand_applications.png` | [docs/assets/brand/07_brand_applications.png](../../assets/brand/07_brand_applications.png) | `d0fd5dc085878ed235afc495b997c11eaeec2b1255d363c4c53edc420e2c7d75` |
| `docs/spec-first-logo-crops/04_concept_and_construction.png` | [docs/assets/brand/04_concept_and_construction.png](../../assets/brand/04_concept_and_construction.png) | `a0907e900dc21ac805a3bb4e15c680239d04f74bf82ad3dcc456d22e153fd70a` |
| `docs/spec-first-logo-crops/02_logo_symbol.png` | [docs/assets/brand/02_logo_symbol.png](../../assets/brand/02_logo_symbol.png) | `1f81765dd13a5441ac8a6c675b8b0cc38d443187d11113ffee8e933e9b573ba6` |
| `docs/spec-first-logo-crops/08_brand_values_footer.png` | [docs/assets/brand/08_brand_values_footer.png](../../assets/brand/08_brand_values_footer.png) | `46630d62c1c929b49ed3d823823511b035b9f0e3b997a77880b070210c676a1d` |
| `docs/spec-first-logo-crops/05_logo_variants.png` | [docs/assets/brand/05_logo_variants.png](../../assets/brand/05_logo_variants.png) | `9ff98c86381a86ebab65cacdb1f563bc707571aeec8aa3585d41683147bddef6` |

## 保留原位的材料

其余计划通过 `docs/plans/README.md` 和 `history-index.md` 区分状态与历史。`completed`、`superseded` 等元数据只是筛选线索，仍有引用或未核验的材料不机械迁移；后续批次继续先检查真实 consumer 与未提交改动。

`docs/项目审查/` 仍由当前审查方法消费；`docs/10-prompt/结构化项目角色契约.md` 与 `docs/contracts/` 是稳定基线路径；验证项目中的 payload、原始日志、fixture 和已冻结快照不批量注入 README。

## 验证范围

本次检查迁移前后文件 hash、README 相对文件链接、约定组织目录入口覆盖、Git 差异和原有计划审计结果。验证只支持目录完整性、导航可达性与计划读取兼容性，不证明历史任务完成、真实宿主调用或现场收益。

## 本次检查结果与并发限制

- 28 份迁移文件逐文件 SHA-256 一致，原位置已迁出；没有覆写历史正文。
- 新增或完善 76 份 README，另新增计划历史索引与本记录；主目录、契约分类、知识分类、资产分类、归档分类及验证项目包根部均有 README。原始 payload、冻结快照与 fixture 内不机械补文件。
- 本次维护的 Markdown 相对文件链接可达；此检查不包含 Markdown anchor、外部 URL 或历史正文既有链接，不代表仓库全部链接已修复。
- `node bin/spec-first.js plans audit --json` 在整理前后均成功。原有 239 条可审计记录变为 235 条，减少的四条均属于本批已迁移计划；其他记录逐项一致。18 份迁移文档中，其余旧文档本就未被当前 CLI 分类为可审计计划。
- `git diff --check -- docs CHANGELOG.md` 通过。未运行完整测试链路：本批只涉及说明、索引和无正文改写的迁移，使用链接、hash 与 CLI 读取检查覆盖对应风险。
- 全目录 baseline 比对首次检测到下列八份写入范围外文件在执行期间变化，已原样保留、不覆盖、不回退。该观察不归因于本任务，也不声明全仓库或整棵 docs 树在并发工作下保持不变：

  - `docs/validation/ce-skill-optimization-2026-10-29/U29-scenario-results.json`
  - `docs/validation/ce-skill-optimization-2026-10-29/U29-scenario-results.md`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/execution-state.json`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/trial-index.json`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/execution-adjustments.md`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/coverage.md`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-trials/all34-disposition.json`
  - `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave2/trial-index.json`

本批为文档与目录整理，进行 inline 内容复核；未分派独立 reviewer，不声明独立审查或真实宿主验证。变更保留在本地工作区，未提交、未推送。

后续比对又观察到同专题的 `delivery-report.md` 变化；并发专题仍在更新，因此以上清单是时点观察而非完整变更归属账本。本次只验收明确写入范围与迁移文件，不等待或覆盖其他任务。

同日后续目录命名统一见 [命名迁移记录](./2026-10-31-docs-naming.md)。本记录的原路径列和内容 hash 保留当批语境，后续改名按迁移链追溯。
