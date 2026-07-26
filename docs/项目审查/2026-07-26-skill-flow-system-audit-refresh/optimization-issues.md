---
title: Skill 关联关系当前需要优化的问题清单（2026-07-26 批次）
doc_role: audit-issue-list
review_date: 2026-07-26
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-26-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/optimization-issues.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# Skill 关联关系当前需要优化的问题清单

本清单从同批次 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。完整 finding 合同（claim、证据、反证、closure/invalidation condition）见 [evidence/edge-ledger.md](evidence/edge-ledger.md)。

## 当前整改状态

SF-28～SF-35 已在当前工作树完成 source-first 整改和验证，逐项 source refs、sandbox 五宿主证据、SF-35 补充 finding contract 与 claim ceiling 见 [remediation-execution-record.md](remediation-execution-record.md)。下列队列继续保留为原审查快照，不应再被当作当前 open queue；当前改动尚未获得 commit/push/PR 授权。

上一批次（07-18）关闭的 P0-P3 经本轮 delta 复核 **0 项 REGRESSED**，不重开；internal delivery 的唯一真源仍是 `skills-governance.json`（本 delta 删除了 `DELIVERED_INTERNAL_SKILLS` 硬编码第二来源并有逐平台等价测试锁定）。

## P1：优先优化

- **SF-28 — LFG step 6.5 跨 skill helper 引用在五宿主投射下不可解析。** `skills/spec-lfg/SKILL.md:116` 以 source-checkout 路径引用 `working-tree-fingerprint.cjs`，五宿主投射（`.claude`/`.agents`/`.cursor`/`.kiro`/`.qoder` 的 spec-lfg 包）均携带字面路径且无解析规则；目标仓中 helper 实际位于各宿主 spec-work runtime root。helper failure 按合同 = `final-verification-stale` 硬停，LFG 全管道在非源码仓确定性终止于最后一道 gate。修复模式已有先例：SF-18 的 package-local byte-parity 投射，或 `shipping-workflow.md:94` 的 SKILL_DIR 解析规则；契约测试需从子串断言升级为引用形态断言（`tests/unit/spec-lfg-contracts.test.js:116`）。

## P2：第二批优化

无。

## P3：文案与低风险合同修正

- **SF-29** — fingerprint 在 non-behavior 返回上的 producer/consumer 不对称（spec-work 仅 behavior-bearing 硬性要求；LFG step 2/6.5 无豁免）。随 SF-28 同包处理。
- **SF-30** — helper 不可用无结构化 reason；`final-verification-stale` 无书面恢复/重入路径；shipping Step 5.1 未提 fingerprint 捕获时点。随 SF-28 同包处理。
- **SF-31** — 6.5 相等 gate 隐式依赖 managed .gitignore 块（`.spec-first/workflows/` ignore），失败诊断不指向根因。随 SF-28 同包处理。
- **SF-32** — `.agents/skills/source-command-spec-*/` 被归类为「spec-first generated runtime assets」但仓库内无 generator 产出该路径；归属口径需二选一成文。
- **SF-33** — `scripts/run-test-suite.cjs:42-47` 模块加载期 `readdirSync(tests/integration)`，该文件入 npm 发布包但 tests/ 不入包；安装态 require 加载期 ENOENT。
- **SF-34** — README.md:172 / README.zh-CN.md:171 仍以格式驱动措辞描述 review mutation（「Markdown review may apply safe writes」）；delta 后写权由 producer token 驱动、普通 review 默认 report-only。并入既定 README 叙事重写。
- **SF-35** — spec-work Phase 0 的 progress-like readiness guard 只嵌在 `artifact_contract: spec-unified-plan/v1` 分支内：无 contract 声明 + `artifact_readiness: active` 的计划按 legacy 兼容路径直接进入 code lifecycle（fresh-source 场景 S3 发现）。最小 guard 扩展或显式豁免成文。

## 建议工作包

1. **SF-28 修复包**（P1 + SF-29/30/31 同 gate wording）：单一 plan/work 闭环，closure = 五宿主投射可解析 + 契约测试升级。
2. **host-level 复证**：修复后 sandbox `spec-first init` 目标仓验证 6.5 gate 端到端可运行，关闭证据升级到 sandbox host-level。
3. **intake/文档小包**：SF-35 guard 扩展 + SF-34 并入 README 重写 + SF-32/SF-33 随批。
