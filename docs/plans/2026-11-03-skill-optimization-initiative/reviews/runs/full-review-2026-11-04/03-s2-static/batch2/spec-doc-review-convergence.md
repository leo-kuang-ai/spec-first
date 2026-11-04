# spec-doc-review 收敛报告（批次2 wave B）

**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 18/18（100%，全量审查迄今唯一满分一致）

## 最终逐项裁决：18/18 pass

- 无任何多数 fail / 全分歧；R3 评价「授权、失败隔离与审查质量机制为本仓最完整一档」
- R3 B05 深挖四个失败面全部闭环：dispatch 双 reviewer 失效 → 等价 inline → `review_status: incomplete` + 抑制 clean verdict；写失败三选项路径；写前重读 + mtime 检测；peer bounded waits + reap

## 合并 Findings 与处置

**已修（本轮）**
1. R1 F3（P3）：references/modes.md:25 示例使用已弃用别名 `mode:headless` → 改为 `mode:non-interactive`（正文仍保留别名声明与宽容语义，仅示例不再示范弃用形）

**留观**
2. R1 F1（P3）：dispatch.md:17 vs :52 model tiering 规则重复两处——当前一致，该文件无测试锁 tier 细则，未来调整需双改
3. R1 F2（P3）：SKILL.md:74 重复 :46 的 dispatch 读取指令——纯冗余
4. R3 #1（P3）：`fixes_applied`/`applied_fixes` 在 JSON finding 级粒度过宽（synthesis-and-presentation.md:246）
5. R3 #2（P3·现状可辩护）：peer-job-runner.py 100KB 单文件——三 skill 字节一致副本由 parity test 锁定，关键不变量有测试覆盖

**S3 backlog**
6. R3 #3：eval 覆盖集中在入口与只读不变量（6 case），walkthrough/bulk-preview/multi-round 交互路径未覆盖

## 结论

- **spec-doc-review 静态层：18/18 pass（全一致）**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-doc-review-R1-glm53.md / -R2-sol.md / -R3-kimi.md
