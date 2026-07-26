---
title: spec-first Skill 流转系统审查 2026-07-26 增量刷新报告
doc_role: audit-report
review_date: 2026-07-26
status: review-complete-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/README.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# 审查报告：Skill 流转系统 2026-07-26 增量刷新

## 结论先行

对上一校准点 `27baf79f` 之后的两个提交（`af53aacb` 整改批次 + `d939ee3c` docs 同步）做增量审查后：

- **P0：0。P1：1（新增 SF-28）。P2：0。P3：7（新增）。REGRESSED 历史 finding：0。**
- delta 的主体方向是**授权模型收紧与 declared 化**：doc-review 写权改为 producer token 驱动（默认 report-only）、compound-refresh headless 不再自动 commit/PR、deployment-verification 双 gate、internal delivery 第二事实源删除、9 个 public workflow 补齐 Contract Summary、3 个 CI workflow 把既有确定性校验升级为 PR 硬 gate。这些变更与关系不变量（尤其「Review 默认 report-only」「mutation/commit/landing 分别授权」）一致，且两侧 producer/consumer 对齐、有 focused tests 锁定。
- **唯一 P1（SF-28）**：新增的 LFG step 6.5 working-tree fingerprint gate 以 source-checkout 路径 `skills/spec-work/scripts/working-tree-fingerprint.cjs` 引用跨 skill helper，五宿主投射均携带该字面路径且无宿主解析规则；目标仓（init 安装、无 skills/ 源码）中路径不可解析，helper failure 按合同 = `final-verification-stale` 硬停。**LFG 旗舰自主管道在所有非源码仓将确定性终止于最后一道 gate**（失败方向安全，但功能不可用），且这是 07-18 已修复 bug 类（U8/U13 source-checkout 路径依赖）在新代码上的同类再现——修复模式（SF-18 的 package-local byte-parity 投射，或 shipping-workflow 的 SKILL_DIR 解析规则）在仓库内已有现成先例。
- 17 项落在 delta 变更面内的历史已关闭 finding 逐项复核全部 INTACT，其中 SF-01、SF-04、SF-24 为强化方向。

## 证据等级

确定性地板全绿（lint 313 files、typecheck 187 files、eval-fixtures 78 tests、delta 契约 22 suites/236 tests、五宿主投射 integration 21 tests）；6 类语义场景以 fresh-source evaluation 执行（隔离上下文 + 当前磁盘 source），S4 独立复证 SF-28 全机制。未执行真实宿主 loader/sandbox init 复证/field outcome（`loader_unverified`）。完整命令、场景记录、反证与 claim ceiling 见 [evidence/validation.md](evidence/validation.md)。

## Finding 队列

### P1

- **SF-28**：LFG 6.5 跨 skill helper 引用在五宿主投射下不可解析（完整合同见 [evidence/edge-ledger.md](evidence/edge-ledger.md)）。推荐姿态：**修复（extend existing owner）**——按 SF-18 先例把 helper byte-parity 投射进 spec-lfg package，或按 shipping-workflow.md:94 先例改为宿主 Skill root 解析规则；契约测试从子串断言升级为引用形态断言。

### P3（附录队列，合同见 edge-ledger）

| ID | 摘要 | 姿态 |
| --- | --- | --- |
| SF-29 | fingerprint 字段在 non-behavior 返回上的 producer/consumer 不对称 | 随 SF-28 同包 wording 修复 |
| SF-30 | fingerprint helper 无结构化降级 reason；`final-verification-stale` 无书面恢复/重入路径；shipping Step 5.1 未提捕获时点 | 随 SF-28 同包 wording 修复 |
| SF-31 | 6.5 相等 gate 隐式依赖 managed .gitignore 块，失败诊断不指向根因 | 随 SF-28 同包 wording 修复 |
| SF-32 | source-command 退役命名空间被归类为「spec-first generated runtime assets」但无 generator | 归属口径二选一成文 |
| SF-33 | run-test-suite.cjs 模块加载期读 tests/ 目录进入发布包 | 最小修补或裁决成文 |
| SF-34 | README 双语仍以格式驱动措辞描述 review mutation 模型 | 并入既定 README 叙事重写工作 |
| SF-35 | progress-like readiness guard 只嵌在 unified-contract 分支：无 contract 声明 + `artifact_readiness: active` 的计划直接进入 code lifecycle | 最小 intake guard 扩展或显式豁免成文 |

## 决策姿态（角色契约 taxonomy）

| 对象 | 姿态 |
| --- | --- |
| LFG 6.5 fingerprint gate 机制本身 | **Adopt**（真实关闭 stale-evidence 缺口，subtraction test 不通过删除项） |
| SF-28 引用形态 | **修复**，复用 SF-18 / SKILL_DIR 既有先例，不新建 resolver 机制 |
| doc-review token 驱动写权模型 | **Adopt**（不变量 7 的正确落地，caller 全量对齐已核验） |
| compound-refresh 三元授权 | **Adopt**（与全局授权模型同型收敛） |
| CI enforcement 升级 | **Adopt**（确定性强制点上移，producer 有测试锁定；branch-protection consumer 侧留待远端验证） |
| S2/S3/S6 wording 两读 | **Defer**（记录为 observations，不扩队列） |

## 下一阶段（最多 3 项）

1. **A1 — SF-28 修复包**（含 SF-29/SF-30/SF-31 同 gate wording 随修）。owner：后续独立 plan/work；closure：LFG 全部 fingerprint 引用在五宿主投射下可解析 + source parity/projection 契约测试；invalidation：宿主 loader 级跨 skill 路径重写证据。
2. **A2 — host-level 复证**：修复后在临时 sandbox `spec-first init` 的目标仓验证 6.5 gate 可运行（路径存在、helper 输出、gitignore 块依赖），把关闭证据从 projection 升级到 sandbox host-level。
3. **A3 — intake/文档小包**：SF-35 的 progress-like guard 最小扩展（或显式豁免成文）+ SF-34 并入已立项的 README 首屏叙事重写（2026-07-26 战略报告 P0-3），SF-32/SF-33 随批处置。

## 不做清单

- 不为脚本路径解析新建 runtime routing registry 或中心 resolver。
- 不移除或降级 6.5 verification freshness gate。
- 不重扫 07-18 冻结的 165 pair 全量（增量分母已冻结并披露）。
- 不把 S2/S3/S6 的 wording 两读升级为 P 队列项。
- 本轮审查不修任何 source（审查完成 ≠ 整改授权；finding 经独立 plan/work/verification 闭环后才能关闭）。
