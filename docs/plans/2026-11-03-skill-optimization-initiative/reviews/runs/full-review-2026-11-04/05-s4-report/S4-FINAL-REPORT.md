# 全量审查总报告（2026-11-04 run，终稿 2026-11-05）

> 状态：**静态层全部收敛；行为层为基线而非验收门，FIX-068 第三波的 8 例主模型复跑 7 PASS、1 FAIL，历史计数已由误记的 153/155 勘误为 154/155（99.4%），1 例 B-open 进入后续修复复验**。本报告不宣称「完整审查通过」。

> 2026-11-06 追加：请求形状确认两例无 Glob/Grep，原授权 FAIL 保留。降级自审单句候选两例 0 PASS、2 FAIL、0 ERROR（780890 ms、225315 tokens），局部语义信号未闭合验证缺口，已撤回新增句，不推进完整十例。最新 dry-run profile 为 preserve/no-op，但仍有 managed reset；隔离生成退出 0、六份普通文件投射逐字一致，不代表真实宿主同步。见 [续作诊断与结果](../04-s3-behavior/continuation-2026-11-05/self-review-followup-2026-11-06.md)。

> 2026-11-07 最新对账（11-06 实验）：能力提示对照 **2 PASS、1 ERROR**（1237375 ms、245359 tokens），仅改临时输入；research 示例候选 **1 PASS**（336683 ms、81133 tokens），仍有 Chat brief 误分档和执行 owner 可用性推断越界。机械通过不升级为语义通过，也不改变历史 **154/155**。research 仅作为表达纠错保留，完整十例与真实 runtime 同步未执行；上一段隔离投射针对已撤回的 handoff 候选，不能作为最终源码部署证明。详见 [能力提示与契约面结果](../04-s3-behavior/continuation-2026-11-05/capability-control-2026-11-06.md)。

> 2026-11-07 正式用例能力适配验证已结束：**2 PASS、0 FAIL、0 ERROR**（833561 ms、236709 tokens），两例均仅一次准备 shell、均交付 Durable。9 项原始证据 SHA 相符；计划仍存在测试替代路径、未知事实否定推断与 readiness 语义缺口。只接受用例能力适配，不接受整体行为修复，历史 154/155 不变，无后台运行；完整十例与真实 runtime 未执行。见 [本轮裁决](../04-s3-behavior/continuation-2026-11-05/portable-tools-2026-11-07.md)。

> 最新：同一冻结版本两批十例 **8 PASS、2 FAIL、0 ERROR**。产品阻塞与 WHAT 未定两项仍有语义违规；intake bootstrap 授权 owner 单点化候选两例已2 PASS（350308 ms、107571 tokens），语义复核未复现两项违规；该候选其余8例已6 PASS/2 FAIL，全套仍8 PASS/2 FAIL/0 ERROR（2885728 ms、827012 tokens）；blocked非法JSON/绝对路径、soft-pressure实际改源码，整体未验收，无后台运行。尚未验收，历史154/155不变，见 [归因及候选](../04-s3-behavior/continuation-2026-11-05/bootstrap-owner-2026-11-07.md)。

## 执行概览

| 阶段 | 范围 | 状态 |
|---|---|---|
| S0/S1 | 登记、方案、试点（spec-plan/spec-code-review K=3） | 完成 |
| S2 静态 | 38 skill × 18 维 × K=2/3 分层盲评 + L1 仲裁 + 修复 | **完成：38/38 收敛** |
| S3 行为 | 38 skill × 155 case（skill-up fresh-source，zhipu/glm-5.3） | **基线+归因+二审+三波 B-open 消化：原始 118/155 → FIX-068 后 154/155（99.4%）**；37 非 pass 全部逐例归因（A 类 eval 基建 26 例全修复验证、第三波后 B 类真实行为缺口 1 例 backlog：plan/implementation-routes planning-only 越界；其余 7 例第三波重跑翻绿）；二审波：REPLAY live 复验修正口径、codex 对抗审收紧 3 处、跨模型矩阵 13 例 × 4 provider——3 例全模型违约经 FIX-064 深挖全部消化：2 例藏 A 合同承载缺口 + 1 例 judge 结构缺陷，见 04-s3-behavior/S3-SUMMARY.md |
| 收尾三波 | 复查（FIX-066）+ 跨模型复验（FIX-067）+ 藏 A 复扫（FIX-067 续） | **完成**：FIX-064 系复查者本人所写，按二审原则对 4/4 全违约三例合同表述做自查+ai-qianxing2 独立评审双路复查（采纳 5 修 prose/judge、登记不修 2）；5 个翻转 case × 其余三 provider 复验（bare-invocation 原 4/4 全违约→**4/4 全过**、false-causal 3/3 过，5 FAIL 格全为真 B 维持）；B-open 8 例已录制 FAIL transcript 用新 judge 确定性复扫（REPLAY 9 格+fixture-driven 3 格 live 重跑，真 B 维持 ×5、翻绿 ×1〔非主口径〕、无材料 ×1 如实登记）——**归因证据全部升级，无藏 A 残留** |
| 历史修复落地 | FIX-001..068 | **此前均已 landed**；本次续作的工作树修复与报告勘误尚未提交，不并入旧结论（见 fix-ledger） |
| 剩余项续作 | FIX-069 | PRD #5 合并列解析已修、#6 有条件 deferred；规划复验依次 FAIL、ERROR、FAIL，第三轮实际先读全局投射再改码，不能沿用首轮归因。最新 canonical／goal 分支与补漏后评测校准的 20 套 335 项通过。独立审查确认旧 judge 两项 P2，已将修订正反两例限定为 planner-return；**修订两例 live 已结束：0 PASS、2 FAIL、0 ERROR，与历史分数分开，真实 runtime 未再生**。caller 额外 ls；blocked 返回绝对计划路径且另有 ls/echo 越界。再次复核发现的 blocked 搜索／加载 owner 漏检已由 4 项红测复现并窄修复，generated judge 已再生、24 项专用校准全绿。验证执行、证据归档与报告对账完成，不关闭行为未验收项。随后澄清 caller 路径协议优先级并补调研工具授权边界，工具边界版本相关回归 20 套 337/337。同套两例对照已结束：旧版 0 PASS、2 FAIL，候选 1 PASS、1 FAIL，均 0 ERROR；候选 blocked 已读取新边界仍额外运行目录 shell（含 ls/echo，退出码 1）。四例约 31.3 分钟、423503 tokens，证据已归档；独立语义复核并回源确认工具边界无新冲突，caller 机械 PASS 的计划仍有 POST 范围冲突、测试数据构造缺口及验收例/readiness 不一致，不登记语义通过。未启动完整十例回归，shell 越界仍 open，候选不作为已验证修复。随后仅补终审测试状态可构造性，追加三套 50/50、lint 519、builder/diff 通过，fresh-source 四片段语义校验完成，追加候选同模型两例串行 live 已结束：0 PASS、2 FAIL、0 ERROR，925681 ms、220976 tokens；配对轨迹确认 shell 越界，计划仍有验证接缝/降级及兼容性表述缺口，未验收。证据已归档，停止无变化重跑，不以旧 337 项冒充本次整轮通过；见续作证据索引 |

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

- 原始 118/155（20/38 skill 全 case 通过）→ 逐名审计 143/155 → 二审波 142/155 → B-open 消化第一波 145/155 → **B-open 消化第二波 147/155 → 第三波 154/155（99.4%）**（bverify +4、eval-iteration +2、REPLAY 统一 +3、riffrec fence +1；二审 closeout-order 降级 −1、pulse A21 +0；消化第一波三例 4/4 全违约深挖翻转、第二波 pulse flag+false-causal 白名单、第三波 eval 驱动迭代首轮——8 例 zhipu 整轮重跑 7 例翻绿〔合同修复延迟生效+run 方差，soft-pressure 复跑 PASS 为方差实例〕，B-open 8→1）；复查/复验/复扫三波（FIX-066/067）计数不变——复查属合同质量修复、复验/复扫属稳健性与归因证据升级（跨模型格终态：bare-invocation 4/4 全过、false-causal 3/3 复验全过、closeout-order 与 pipeline-pending 各 3/4；5 FAIL 格 + 复扫 5 格真 B 维持全部逐格读 transcript 确认，与原归因一致、跨 run 稳定）
- 全部 37 非 pass 逐例归因：A 类 eval 基建 26 例（judge 窄假设/prompt-judge 失配/词表未承载/引擎挂载面/只读 Bash 白名单/组合尾巴隐形 A16/judge 严于 CLI 合同 A17/词汇代理 judge A18/合同未承载 order A19/fence 配对 A20/绝对路径窄假设 A21/EVAL_EXIT_CODE 结构性不可满足 A25 等，全部修复并经 live 验证）；B 类在 FIX-068 前尚有 8 例 open，经第三波主模型 live 重跑 7 例翻绿，仅 plan/implementation-routes-work 保留为当前 B-open；一次 PASS 不证明跨 run 或跨模型稳定
- 修复登记 FIX-001..068；judge 相关单测 113/113→含复扫波后 parsers+outcome-judges+校准 101/101（fixture-state 函数级锚定）；runtime mirror 再生、test:mcp-setup（34 套件/773 测试）与 doctor 复验绿
- 5 超时（300-600s 档）可提档重跑

## 诚实边界

- 静态层「收敛」= 18 维逐项 pass（含仲裁修复后），不等于行为正确性——后者由 S3 基线与后续 eval 驱动迭代承担
- S3 的 B-open 先经两波从 13→8；FIX-067 复验/复扫升级这 8 例当时的归因证据，但非全部跨模型稳定结论。FIX-068 第三波再按 zhipu 最新 live 结果从 8→1。plan/implementation-routes-work 的历史 B-open 标签保留，但本次第三轮出现“先读全局投射再改码”的新形态，源身份与零改动 judge 的适用性须分别复核，不再用一条“自行改码”解释所有运行。既有跨模型 FAIL（如 hst-2 pulse 拒绝、kiro 手写 artifact）仍属局限，不因 zhipu 单次 PASS 而抹除。
- 复验波 judge 修复（checkCloseout 段级匹配+重定向剥离、bare-invocation 词表/汇报断言）均由真实失败形态驱动、白名单化收窄，并保留全部既有伪造向量拒绝；judge 词表两次被 live 抓回的教训（词表必须按被镜像 CLI 源码承载）已沉淀 memory #21/#22/#23
- comment-injection 的 zhipu 原违约格无录制 transcript（矩阵只存 kiro/hst-2/aiq），当时无法再复判旧格；FIX-068 后续已取得该 case 的 zhipu 新一轮 live PASS，仅证明这次运行合规
- spec-prd R1 #5：已在 canonical 模板指明来源引用首选 `recommended_default/deferred_reason`，并修正 checker 对该合并列名原本不识别的确定性缺陷（`PRD write target` 兼容行为不变）；R1 #6：维持 deferred，当前消费方已按 legacy 形态兼容 PRD，只有可回源的误路由/交接丢失或获批 origin 迁移时重评（先更新消费方合同）。legacy 不是质量降级；详见 fix-ledger 留观条目
- 模型收益未外推：本轮不宣称团队/模型级收益
- runtime：此前波次的 mirror 再生与 doctor 通过只覆盖当时源码。本次 FIX-069 未执行真实 `spec-first init`；八宿主 dry-run 显示 managed hard reset 与用户级 developer profile 覆写，需先批准这些具体副作用。不得把本次 source/test 通过描述为 runtime 已同步或已验证。

## 产物索引

- `00-launch`…`02-s1-pilot`：登记与试点
- `03-s2-static/batch{1..5}/`：盲评原文、L1、收敛报告、matrix.py
- `04-s3-behavior/`：38 skill result.json + S3-SUMMARY.md + second-review-matrix/（跨模型矩阵与复验产物）+ [continuation-2026-11-05/README.md](../04-s3-behavior/continuation-2026-11-05/README.md)（FIX-068 计数勘误的八份结果、规划单例续作证据及限制）
- `05-s4-report/`：本报告
- `06-fixes/fix-ledger.md`：FIX-001..068 历史对账及 FIX-069 未提交续作
- `evidence/`：codex/aiq 外发授权与落盘审计（input-packs/ + probes/）
