# spec-runtime-setup 收敛报告（批次2 wave B）

**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 15/18、多数 3/18、全分歧 0（免仲裁）

## 最终逐项裁决：17/18 pass + 1 D05 fail（采纳并已修复）

- **D05 fail（R2+R3 多数）采纳**：密度问题真实可定位（:54 单段 2106 字符；:165/169/171 三段各 15+ 约束，安全规则埋段中）。**FIX-011 已修**：提取 `references/provider-readiness.md`（字段清单 + provenance/receipt 机器合同，指明 repo canonical `docs/contracts/provider-readiness.md`），SKILL.md:54 压缩为决策规则 + 指针（2106→1209）。验证：mcp-setup/runtime-setup 5 套 165/165 + lint 519 全绿
- **D08 多数 pass**：R2 fail 为载量/审计成本框架——静态层标准（承诺存在+内部一致+可定位）下不构成失败（S1 先例）；记 dissent
- **B02 多数 pass**：R2 的 `--verify-only` 口径冲突 claim 经全文对读不成立——矩阵行「普通 --verify-only → installation」与收窄句「无 `--only` 且无 `--requirement-workspace` 时默认 installation」及 artifact 行三处完全一致，R2 将「普通」误读为无条件
- R3 深挖确认 B05 失败面全部闭环（repair-loop 上限 2 + 同因短路 + process-tree SIGTERM/SIGKILL + SIGINT 集成测试 + lease 双锁不按年龄抢占）

## 合并 Findings 与处置

**已修（本轮）**
1. FIX-011（D05）：provider-readiness 字段合同提取 + 入口压缩
2. F5（P3·D01）：:153 历史日期「2026-09-13 起」撤出合同叙述，只保留现行语义

**留观（P2 复述类，R1 F1/F2/F3）**
3. 入口命名句近逐字重复（:9 vs :141）；bare 语义 ≥5 处复述 + partial scope 7 处——当前全部一致，无破裂；密度收敛建议与 :165-171 长段一并排入后续批次（涉及大段重写，风险收益比暂不划算）
4. F3：`references/supported-mcp-tools.md` 未挂接 SKILL.md 入口读路径（独有操作性内容仅脚本强制兜底）——挂接需验证按需加载路径，留观
5. F4（P3）：codegraph 在 registry tools[]/providers[] 双表面登记口径未在 prose 解释
6. R3 P3：hook `verified-external` 判定细则只存在于 SKILL.md:171 长段

**S3 backlog**
7. eval 未覆盖 `--repair-host-config` 行为路径（静态层有单测兜底）

## 结论

- **spec-runtime-setup 静态层：17/18 pass + D05 fail（已修复）**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-runtime-setup-R1-glm53.md / -R2-sol.md / -R3-kimi.md
