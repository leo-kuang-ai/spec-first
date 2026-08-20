---
artifact_type: confirmed-reconciliation-ledger
upstream_range: 1fac0442ee16996913dd0843a063ac279d2c32f4..bbf995a444de9c7f8294fcd15ffa7332cd5f6418
---

# CE 3.20 Skill/Script Reconciliation

该摘要由 `scripts/check-ce-upstream-reconciliation.cjs --refresh --ce-repo <path>` 从固定 Git objects、逐文件审计和当前 Skill source 机械生成。语义裁决仍由逐文件审计与计划拥有。

## 上游区间

- 全部路径：185
- 实施目标：180（Skill 175 + CLI/runtime 4 + 支撑 1）
- evidence-only：5
- CE Skill：30（直接 counterpart 28/158 文件；无直接 counterpart 2/17 文件）
- 脚本：44（Skill-local 44 + root development 1）
- 删除 repo profile cache 脚本：0

## 当前 Source Inventory

- canonical Skill：36
- package 文件：566
- manifest SHA-256：`0a6fb416c49001abf2fa63b3c12066f204802dddf59957c831b2f7ef1ce9502f`
- HEAD skills tree：`17df58486a3845a0eb2b6ae64cf7f18ce21fc8ff`

详细逐路径事实见 `/Users/kuang/xiaobu/spec-first/docs/validation/2026-08-19-ce-post-3-20-reconciliation.json` 与 `/Users/kuang/xiaobu/spec-first/docs/validation/2026-08-19-current-skill-package-inventory.json`。
