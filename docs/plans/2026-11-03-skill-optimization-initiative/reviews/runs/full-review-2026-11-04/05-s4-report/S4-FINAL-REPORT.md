# 全量审查总报告（2026-11-04 run，终稿 2026-11-05）

> 状态：**静态层全部收敛、修复全部落地；行为层为基线而非验收门（归因+二审+B-open 消化两波后确认 147/155 = 94.8%，B-open 8 例留 eval 驱动迭代）**。本报告不宣称「完整审查通过」。

## 执行概览

| 阶段 | 范围 | 状态 |
|---|---|---|
| S0/S1 | 登记、方案、试点（spec-plan/spec-code-review K=3） | 完成 |
| S2 静态 | 38 skill × 18 维 × K=2/3 分层盲评 + L1 仲裁 + 修复 | **完成：38/38 收敛** |
| S3 行为 | 38 skill × 155 case（skill-up fresh-source，zhipu/glm-5.3） | **基线+归因+逐名审计+二审+B-open 消化两波：原始 118/155 → 确认 147/155（94.8%）**；37 非 pass 全部逐例归因（A 类 eval 基建 26 例全修复验证、B 类真实行为缺口 8 例 backlog（归因闭环：合同可遵循、无隐藏 A）；二审波：REPLAY live 复验修正口径、codex 对抗审收紧 3 处、跨模型矩阵 13 例 × 4 provider——3 例全模型违约经 FIX-064 深挖全部消化：2 例藏 A 合同承载缺口 + 1 例 judge 结构缺陷），见 04-s3-behavior/S3-SUMMARY.md |
| 修复落地 | FIX-001..060 | **全部 landed**（见 fix-ledger 对账） |

评审者：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2 备用）/ R3 kiro/kimi-k3（批次1 K=3）/ L1 仲裁 hst-2/gpt-6-astra。冻结 worktree 5b59293b，修复落主仓。

## 四层证据

1. **盲评原文**：`03-s2-static/batch*/`（38 skill × R1/R2/R3 逐维表）
2. **矩阵与仲裁**：matrix.py 逐维一致率 + 17 份 L1 仲裁裁决（`*-L1-astra.md`）
3. **收敛报告**：38 份 `*-convergence.md`（每 skill 最终逐维结论 + 修复对照 + backlog）
4. **行为基线**：`04-s3-behavior/*/iteration-*/result.json`（case 级）+ `S3-SUMMARY.md`

## Agreement 汇总（S2）

- 全一致满分 skill：3（compound 系、dogfood 等 18/18 ×3）
- 免仲裁 skill（无 pass/fail 分歧）：24/38
- 经 L1 仲裁：14/38（batch3 ×2、batch4 ×11、batch5 ×1）
- 确定性收敛（分歧梯子第一级，无需 L1）：spec-commit（R1 fail 断言 grep+源读全证实后直接修复）
- 口径分歧（na/pass、pass/not-verified scope note）不触发仲裁，逐份记录于收敛报告

## 仲裁台账摘要

- L1 裁决 fail 且采纳修复：write-skill（D04/B02/X02→FIX-022）、audit（9 项→FIX-037）、test-browser（3 项→FIX-035）、autoresearch（→FIX-036）、批次4 其余 9 skill（→FIX-023..033）
- L1 裁决 fail 不成立（R2 断言被证伪）：spec-sweep B02（源码已有规范化规则）
- L1 建议判 80/20 留观：test-browser 内部总预算调优（确定性恢复缺口已由 pending-receipt 关闭）

## 修复台账摘要（静态层 FIX-001..039；行为层 FIX-040..060 见 S3 节与 ledger）

批次1（001..010 详见 ledger）：spec-plan/runtime-maintenance 引用、prd D05 复述密度、write-tasks 假护栏复活、work run.json 断链、commit-push-pr 保留清单等；批次2（011..014）：Python>=3.10 全仓护栏、provider-readiness 字段合同等；批次3（015..021）+022；批次4/5+audit/autoresearch（023..039）。**全部有窄验证（合同/单元测试绿）**，验证记录见 ledger。

## S3 行为基线（非验收门）

- 原始 118/155（20/38 skill 全 case 通过）→ 逐名审计 143/155 → 二审波 142/155 → B-open 消化第一波 145/155 → **B-open 消化第二波 147/155（94.8%）**（bverify +4、eval-iteration +2、REPLAY 统一 +3、riffrec fence +1；二审 closeout-order 降级 −1、pulse A21 +0；B-open 消化：第一波 closeout-order/pipeline-pending/bare-invocation 三例 4/4 全违约深挖翻转，第二波 pulse/unconfigured〔disable-model-invocation 拒绝变体跨模型证实→SKILL.md flag 语义澄清〕+ compound/false-causal〔source_refs 白名单补被裁决对象〕，zhipu live PASS ×5）
- 全部 37 非 pass 逐例归因：A 类 eval 基建 21 例（judge 窄假设/prompt-judge 失配/词表未承载/引擎挂载面/只读 Bash 白名单/组合尾巴隐形 A16/judge 严于 CLI 合同 A17/词汇代理 judge A18/合同未承载 order A19/fence 配对 A20/绝对路径窄假设 A21，全部修复并经 live 验证）；B 类真实行为缺口 13 例 open backlog（plan 遵从 ×3、resolve-pr ×2、work 受保护边界 + 逐字命令、debug 先问再查 order、code-review fence、test-browser token、pulse 拒绝变体、bare fail-closed、false-causal 脚手架引用——合同均已承载，留 eval 驱动迭代；跨模型矩阵显示其中 3 例全模型违约，优先复查合同/fixture 表述）
- 修复登记 FIX-001..062；judge 相关单测 113/113（含 fixture-state 函数级锚定 35 例）；runtime mirror 再生、test:mcp-setup（34 套件/773 测试）与 doctor 复验绿
- 5 超时（300-600s 档）可提档重跑

## 诚实边界

- 静态层「收敛」= 18 维逐项 pass（含仲裁修复后），不等于行为正确性——后者由 S3 基线与后续 eval 驱动迭代承担
- S3 的 B-open 已消化两波（13→8：三例 4/4 全违约〔合同/fixture/judge 层〕+ pulse flag 变体 + false-causal 白名单；剩余 8 例归因闭环——矩阵 ≥1 provider 通过证明合同可遵循、无隐藏 A，缺口为弱遵从模型执行保真度，属后续 eval 驱动循环）
- spec-prd R1 #5/#6 低频 P3 维持 deferred；留观清单见 fix-ledger
- 模型收益未外推：本轮不宣称团队/模型级收益
- runtime mirror 再生统一在收尾执行（spec-first init）

## 产物索引

- `00-launch`…`02-s1-pilot`：登记与试点
- `03-s2-static/batch{1..5}/`：盲评原文、L1、收敛报告、matrix.py
- `04-s3-behavior/`：38 skill result.json + S3-SUMMARY.md
- `05-s4-report/`：本报告
- `06-fixes/fix-ledger.md`：FIX-001..060 对账
- `evidence/`：codex 外发授权与落盘审计
