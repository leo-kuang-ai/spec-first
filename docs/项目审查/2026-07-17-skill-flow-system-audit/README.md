---
title: spec-first Skill 关联关系系统审查批次
doc_role: audit-index
review_date: 2026-07-17
status: review-complete
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
source_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
---

# spec-first Skill 关联关系系统审查

本批次只审查 Skill 之间的 route、handoff、caller、consumer、artifact authority、failure/return、stop condition 与 internal-helper 关系，不扩展为普通代码质量审查，也不在审查阶段修复 source/runtime。

## 结论

- **P0：0**
- **P1：11**
- **P2：13**
- **P3：3**
- **总体判断：** 主链 ownership 与 artifact canonicality 基本成立，但 runtime helper 可达性、dispatch/review mutation authority、task-pack consumer、commit authorization、knowledge promotion 和 current docs mapping 存在 load-bearing drift，不能判定为“关联关系全部正确”。

下一阶段只建议三个工作包：

1. 恢复 internal helper / LFG caller-target runtime reachability。
2. 统一 generic dispatch、code-review、dogfood、polish 的 dispatch/mutation/branch/commit/landing authority。
3. 校准 knowledge、config、task-pack/doc-review 与 artifact map 的 producer-consumer contract。

## 全量覆盖

| 项目 | 结果 |
| --- | --- |
| Governed node roster | 35/35：17 workflow、11 standalone、7 internal-only |
| Skill source files | 275/275：全部 `SKILL.md + references/**`，无抽查 |
| Planning 分区 | 102/102，missing/extra/duplicate = 0/0/0 |
| Execution 分区 | 85/85，missing/extra/duplicate = 0/0/0 |
| Sidepaths 分区 | 88/88，missing/extra/duplicate = 0/0/0 |
| Canonical mention pairs | 157/157；每对均区分真实 edge、reverse declaration、boundary/informational mention 或 drift；114 对确认、43 对至少一项语义漂移 |
| Direct supporting surfaces | 76/76：governance、contracts、producer/consumer、projection、focused tests 与用户地图逐文件登记 |
| Dispatch authority matrix | 35/35：18 个 package 会 generic dispatch，6 个完整继承 gate/fallback，12 个有缺口 |
| Deterministic validation | entrypoint lint 309 files、typecheck 180 files、25 focused suites / 223 tests、eval-fixtures 6 suites / 78 tests 全绿 |

冻结 manifest：

- Skill file manifest SHA-256：`933afb8ff0c3b8c4ee716c635e2c04179d03c60f91f71db7b12ce93a5bc10ffe`
- Cross-skill pair manifest SHA-256：`95e3708cd8297c810e6e2244ec377ccbd7d1ed5b94937fce5aace6ee7f4b85fe`

## 产物索引

| 文件 | 内容 |
| --- | --- |
| [review-report.md](review-report.md) | 综合结论、11 个 P1、P2/P3 deferred、三项最高杠杆动作 |
| [optimization-issues.md](optimization-issues.md) | 从主报告单独提取的 27 个优化问题清单，按 P1/P2/P3 分组 |
| [evidence/skill-graph.md](evidence/skill-graph.md) | 35 个节点 inventory、主链/side path 图、7 个 internal helper runtime reachability |
| [evidence/edge-ledger.md](evidence/edge-ledger.md) | 157 个 canonical mention pair 的逐对分类、高风险 edge 七问审查与 35/35 dispatch-authority matrix |
| [evidence/validation.md](evidence/validation.md) | 命令、确定性探针、语义场景、反证、claim ceiling 与未执行项 |
| [evidence/file-review-ledger-planning.md](evidence/file-review-ledger-planning.md) | planning 分区 102 文件逐文件台账 |
| [evidence/file-review-ledger-execution.md](evidence/file-review-ledger-execution.md) | execution/review/knowledge/internal helper 分区 85 文件逐文件台账 |
| [evidence/file-review-ledger-sidepaths.md](evidence/file-review-ledger-sidepaths.md) | runtime/QA/optimize/pov/sweep 等分区 88 文件逐文件台账 |
| [evidence/file-review-ledger-supporting.md](evidence/file-review-ledger-supporting.md) | governance/contracts/producer-consumer/projection/tests/用户地图支撑面逐文件台账 |

## 执行快照

- HEAD：`7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64`
- Branch：`leo-2026-07-16-plan-update`
- Package：`1.13.2`
- Origin：`docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md`
- Generated runtime mirror：未作为 source 读取或修改；只通过 source-owned projection plan 验证交付集合。
- 并行用户改动：保留，未覆盖；审查目录以外只会按仓库要求更新根审查索引与 Changelog。

## Claim ceiling

- current source + consumer：确认关系存在、缺失或漂移；
- focused deterministic tests：确认机械合同；
- current-source/fresh-source scenario：只证明受控 source-level 语义，不证明 host loader；
- Graphify / CodeGraph：只作 `provider_untrusted` 导航；
- 未证明真实宿主 invocation、外部服务、CI/merge/release 或 field outcome。

本目录是 review evidence。P1/P2/P3 只有在后续独立 plan、work、verification 与 closure trace 完成后才能关闭。
