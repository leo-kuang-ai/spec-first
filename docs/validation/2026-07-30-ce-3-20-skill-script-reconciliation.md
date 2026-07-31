---
artifact_type: confirmed-reconciliation-ledger
upstream_range: 7f86be9d02679adeb93951587dee40de42c5bf82..1fac0442ee16996913dd0843a063ac279d2c32f4
---

# CE 3.20 Skill/Script Reconciliation

该摘要由 `scripts/check-ce-upstream-reconciliation.cjs --refresh --ce-repo <path>` 从固定 Git objects、逐文件审计和当前 Skill source 机械生成。语义裁决仍由逐文件审计与计划拥有。

## 上游区间

- 全部路径：422
- 实施目标：237（Skill 215 + CLI/runtime 19 + 支撑 3）
- evidence-only：185
- CE Skill：29（直接 counterpart 25/201 文件；无直接 counterpart 4/14 文件）
- 脚本：47（Skill-local 46 + root development 1）
- 删除 repo profile cache 脚本：9

## 当前 Source Inventory

- canonical Skill：35
- package 文件：554
- manifest SHA-256：`2ccd1a0e9636e796163397149b84d3ccb9f27e7339db4c38d806cc07104210fc`
- HEAD skills tree：`d3763c70d60b724da1f3b5f87f2431394ab17ec8`

详细逐路径事实见 `docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.json` 与 `docs/validation/2026-07-30-current-skill-package-inventory.json`。
