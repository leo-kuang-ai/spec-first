# spec-compound 收敛报告（批次2）

**K=3**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2 备用 provider，hst-2 主通道 3/3 触发 magpie loop-guard 后重跑） / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 14/18、多数 4/18（全部 → pass）、全分歧 0（免仲裁）

## 最终逐项裁决：18/18 pass（B05 事实成立进 Findings 已修）

- **R2 B05 fail 的核心事实采纳**：`run-python.sh` 版本护栏只验 `major == 3`，而 payload（validate-frontmatter.py:305 `int | None` 运行时求值、`list[str]` 签名，无 `from __future__`）真实下限 ≥3.10——护栏验证不了实际需求，macOS CLT python3.9 会「过检后崩」。**FIX-012 已修**：全仓 12 脚本 ×2 处统一 `>= (3, 10)`（同型护栏波及 autoresearch/spec-code-review/spec-compound-refresh/spec-doc-review/spec-optimize/spec-pov/spec-sweep/spec-riffrec），契约测试加断言锁定下限；11/11 契约测试 + wrapper 实跑绿
- **R2 B03 fail 不成立**：research.md:135 `gh issue list --search` 检索的是当前 repo 自己的租户（用户自己的 gh auth），同信任域常规操作，非跨域外发；记 dissent
- **R3 X01 not-applicable**：单篇沉淀职责，不编排多模块——范围判断成立

## 合并 Findings 与处置

**已修（本轮）**
1. FIX-012（B05）：Python 运行时护栏 14 处统一抬到 `>= (3, 10)` + 契约断言

**S3 backlog**
2. R2 B06：正向发布判据 check-solution-published.sh 仅检查单字符串存活、不检查候选要求——eval 判据强度
3. R2 D07：既往尝试 Judge（conversation-checks.cjs:19）过度限制合法调查 + 诊断 case 缺 Judge 必需准备步骤——回归资产与合同漂移

**留观**
4. R2 B06 附带：eval fixtures 判据与 SKILL 承诺的完整核对（S3 一并）

## 结论

- **spec-compound 静态层：18/18 pass**（附 1 项跨 9 skill 的护栏事实已修）
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-compound-R1-glm53.md / -R2-sol-v2.md（ai-qianxing2） / -R3-kimi.md
