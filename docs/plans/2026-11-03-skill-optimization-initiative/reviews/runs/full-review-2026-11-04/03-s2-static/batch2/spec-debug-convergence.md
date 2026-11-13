# spec-debug 收敛报告（批次2）

**K=3**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2 备用 provider，第 3 次尝试成功：hst-2 loop-guard 1 次 + 乾行 524 一次） / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 13/18、多数 5/18（全部 → pass）、全分歧 0（免仲裁）

## 最终逐项裁决：18/18 pass（B02 核心事实成立进 Findings 已修）

- **R2 B02 lone fail 的核心 sub-claim 采纳并已修**：SKILL.md:92 列出 `org/repo#123` 可解析形态，但抓取指令只有 `gh issue view <number>`（默认解析到当前仓）——跨仓 issue 引用会抓错仓或失败。已补 `--repo <org/repo>` 指引 + 「bare `<number>` resolves against the current repo and would fetch the wrong issue」警示（无测试锁定，改后全文一致）
- **R3 B05 lone fail（workflow 中断恢复）不采纳为静态失败，记 dissent 留观**：运行级失败隔离经 R1/R2 双确认完备（Phase 回退、evidence chain、claim_limitations）；R3 要求的「workflow 自身被中断后的 durable progress state / resume 指引」是跨会话能力设计取舍——spec-debug 的状态即调查证据链本身（可从 artifacts 重建），与 spec-work B05 tracker sub-claim 同类，合并记档
- **R2 D07（回归资产漂移）→ S3**：既往尝试 Judge 过度限制合法调查（conversation-checks.cjs:19）+ diagnose-then-choice-gate.yaml:9 缺 Judge 必需准备步骤——eval 层资产与合同漂移，S3 行为层一并核

## 合并 Findings 与处置

**已修（本轮）**
1. B02：跨仓 issue 抓取补 `--repo` 指引（SKILL.md:92）

**S3 backlog**
2. R2 D07：conversation-checks.cjs 合法调查过限 + 诊断 case 准备步骤缺失
3. R3 B05 附带：claim_limitations 枚举完整性（B06 深挖发现不完整）

**留观**
4. R3 B05：workflow 级中断恢复机制（设计取舍：证据链即状态；若未来加 resume 需与 spec-handoff 对齐）

## 结论

- **spec-debug 静态层：18/18 pass**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-debug-R1-glm53.md / -R2-sol-v3.md（ai-qianxing2） / -R3-kimi.md
