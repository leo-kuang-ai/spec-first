# S09 persona、task-pack 与综合依赖补审

日期：2026-11-02。HEAD：`1aa272a606710407e69b22d0452a34cd9b0d1f8f`。类型：源码事实为 confirmed，充分性与候选风险为 advisory。由已参与上游审查的 reviewer 承接主审遗漏依赖，继承主审摘要，不是盲评；未调用外部模型、未实际修改被审文档、未改被审 source。

**结论：指定的 persona/schema、task-pack lens 与综合条件引用已补读。** 常规文档及 task-pack 的权威、覆盖和写入边界有具体合同；不能以此声称真实审查质量、schema 实际执行或交互恢复已经验证。外部 peer 未启用，不把未执行 peer 的脚本实现计入行为证据。

## 核心目标与消费者核查

| 必要能力 | 本次依赖提供的机制 | 达成判断与边界 |
|---|---|---|
| 区分需求与计划的专业审查 | coherence 要求真实语义矛盾；feasibility 对 requirements 只审方向级致命冲突，实际已给 HOW 可审但不能据此提升 readiness；八份 persona 分工明确 | 设计条件充分；不得将需求尚未确定实施细节一概当缺陷 |
| 按实际风险覆盖且控制成本 | persona-selection 的 lite/standard/full 与条件激活；mandatory coherence/feasibility；无派发权限可 inline 且保留 coverage 降级 | 有成本控制路径；persona 数量不构成独立验证，多视角也不是多个模型 |
| 保护 source-plan 权威 | task-pack lens 先消费真实 CLI receipt，再读 current source plan；invalid 不 dispatch、不改判普通 plan；任务 JSON 优先于展示 prose | task pack 永远 report-only，producer 修派生任务、Plan 补源决策、Work 接执行；结构有效不等于语义充分 |
| 形成可行动且不重复的 findings | schema、shared confidence rubric、suggested-fix、why-it-matters 与 synthesis chain/contradiction/premise refs；同一个 correction 能解决两条才合并，保留 constituent 证据 | 机制具体；多人同意不能自动抬 confidence；schema 的 string shape 不等于理由充分，未审实际 validator 不主张其实现漏洞 |
| 中断恢复和避免重复写入 | multi-round、restatement suppression 与 walkthrough 区分用户已settle和预计Apply；R30要求实际读回；未知写入先查状态；bulk/Open Questions受mutation mode约束 | 预测撤销不是 durable suppression；新轮仍核查当前source。未实际跑写入和中断，仅静态充分性 |
| 独立审查身份可信 | cross-model-review/eval 要求实际 serving evidence；file-based receipt 不够时 degraded/unverified，并在启动前拒绝 | 未运行 peer；不得用模型名称或prompt声明独立性，脚本按未启用条件排除 |

## 候选问题及最小验证

以下 P2 只作待场景验证候选，不作为已确认的能力损害或定稿实施项。

| 编号 | 源码事实与影响 | 处置与可区分场景 |
|---|---|---|
| S09-D01，P2候选 | `personas/design-lens-reviewer.md:13` 用维度≤7/10作为 finding 门；:25 起 AI slop 列表与末尾视觉偏好例外，和同文件 suppress 无后果偏好的要求存在张力 | 将实际风险和后果置于主观总分之前。对照一个总分高但漏关键无障碍状态的方案，以及合理使用三列布局的方案；前者应报、后者不因风格报。未执行行为验证 |
| S09-D02，P2候选 | `subagent-template.md:52` 一概抑制 pre-existing issues 与 linter/typechecker/validator 可发现项；在审查已有完整文档而非diff时，可能漏掉仍阻断当前交付的旧问题；未实际运行validator时也不能假定其已覆盖 | 明确范围依文档审查目标，避免历史存在即免审。用旧的当前阻断矛盾与已真实被validator阻断的结构错误配对；不重复后者，但保留前者 |
| RS-S09-01，P3文案（复核既有发现，不新增编号） | `walkthrough.md:53` 仍称 synthesis 3.5b 为 `Skip > Defer > Apply` 固定tie-break；当前synthesis已经以证据选择Lead Recommended Action | 删除旧解释，消费者仍服从producer推荐；不按词序重算。源码漂移确定，真实错误决策未证明 |
| S09-D03，P3文案 | `bulk-preview.md:68` 把 low-confidence style preference 放Skipping示例，与shared rubric要求所有桶抑制不构成finding的偏好不一致 | 示例改为有实际证据但不采纳的finding；纯风格偏好不得被列为已审缺陷 |
| S09-D04，P2候选 | `task-pack-review-lens.md:57` 对human/machine mismatch固定定为P1/P0，未按具体影响分级 | 区分错误执行波次与无执行后果的展示差异；前者阻断，后者仍返producer但不机械升级。未行为验证 |

## 三类追加场景（静态推演）

1. 正常：current plan 已决策、valid task-pack receipt、两个mandatory lens完成；预期按任务source refs核对覆盖、真实依赖和验收，再返回唯一next owner。判据是source对应与coverage，不是review complete字样。当前合同可支撑，未执行。
2. 冲突：机器JSON与人类wave表冲突；必须以JSON为任务权威并返producer修正，不能直接改derived artifact。反例是返回passed仅因CLI验证成功；该行为不合格。严重度需按实际后果判断，参见S09-D04。
3. 中断：Apply预期解决了dependent finding，但实际写入失败或结果未知；dependent不得永久withdrawn，须读回、恢复unresolved或failure。判据是当前source与实际写结果；只在内存中标为applied不合格。

## 阅读覆盖与排除

本路完整阅读下列文件（含压缩前原文分片）；walkthrough 输出曾截断的215–245已于恢复后补读。主审已读SKILL、modes、document-intake、dispatch、rendering-floor、synthesis-and-presentation，不将这些共享阅读冒充本路完整重复读取。可复用的同版本共享证据见 `resume-specialists.md`。

- 选择与结构：persona-selection、findings-schema、subagent-template、task-pack-review-lens、persona-activation-matrix、subagent-confidence-rubric-detail、subagent-suggested-fix-advanced、subagent-why-it-matters-guide。
- 综合与恢复：synthesis-chain-linking、synthesis-contradictions、synthesis-multi-round、synthesis-premise-collapse、synthesis-restatement-suppression、bulk-preview、open-questions-defer、review-output-template、document-classification-signals、walkthrough。
- 外部peer合同：cross-model-review、cross-model-eval；未启动peer，执行脚本条件排除。未声称其运行实现通过。
- 全部八份persona：coherence、feasibility、adversarial-document、security-lens、design-lens、product-lens、scope-guardian、whole-doc reviewer。

本次不新建统一评分器、不删除出口门禁。行业映射沿用主审R2/R4的可审产物与独立验证原则，仍受主报告外部资料重新核验状态约束；不据此声称S09行业核验已全闭合。

## 所读文件完整字节 SHA-256

哈希只绑定版本，不代替阅读或行为验证。

| 文件 | SHA-256 |
|---|---|
| `skills/spec-doc-review/references/persona-selection.md` | `67d9a435a5d83b85804b19348bfe80912e5e63120e83c6f24ba5fedc8c82c8f4` |
| `skills/spec-doc-review/references/findings-schema.json` | `873f1eb2021ce89f81fb01ee5e9b5b452b6700917d604f616ecf9f999628b751` |
| `skills/spec-doc-review/references/subagent-template.md` | `bd5f231f32822f818e24180515be01cb086e696d400b034e7530fe54124e5086` |
| `skills/spec-doc-review/references/task-pack-review-lens.md` | `8a1db7a96f948d6be2f2c97c56556799d23f7da8c8c69181bf6562647bad55cf` |
| `skills/spec-doc-review/references/persona-activation-matrix.md` | `36eb50170eeafafe93554948dc5664a67c7619a36e93bad2ad1cc7cdafb647c9` |
| `skills/spec-doc-review/references/subagent-confidence-rubric-detail.md` | `51c4a55d2dc823e04b5afa3ec462e9c438d8fe098c84d8206f9a6d0ff946ffd2` |
| `skills/spec-doc-review/references/subagent-suggested-fix-advanced.md` | `4d3d83b04bf0741697e6f3a5f557c2baf7bcf1782447d0ce8869389d664de8ca` |
| `skills/spec-doc-review/references/subagent-why-it-matters-guide.md` | `5b6494fd421c23c13acb2fe67be523fc1a88fb771c0e9a7422dc2b94088e6b66` |
| `skills/spec-doc-review/references/synthesis-chain-linking.md` | `453728ea41289af93c5b501d4063d35fd453f380dbd76bb2feb9f599fabd8a80` |
| `skills/spec-doc-review/references/synthesis-contradictions.md` | `4daefe28325fca4941e1ad2f7492d40b21216ecfda469cb92fc6a84f5d8b5e3f` |
| `skills/spec-doc-review/references/synthesis-multi-round.md` | `c45604bbc400dc5aa53d2620ae3625c225bc20c271affb059ba0eb8686085def` |
| `skills/spec-doc-review/references/synthesis-premise-collapse.md` | `4079744b585f9ca7b108bcfb1cf802d5b3f110bb279c785c67d126f2ccf3c1ca` |
| `skills/spec-doc-review/references/synthesis-restatement-suppression.md` | `143651ce4480ebd04ffd3dba790183b17cc8d9188920867002fc874cfd1cbd98` |
| `skills/spec-doc-review/references/bulk-preview.md` | `34ae21804a085c9dafb5c26065a02a138da13f0815050f20714c0f390a77c2b2` |
| `skills/spec-doc-review/references/open-questions-defer.md` | `ff12069cd4536ce95d816056ae0292a8a0fecec9144b036c1b7e14e6151a693a` |
| `skills/spec-doc-review/references/review-output-template.md` | `74007b2264975fdc46d813ea9b007c57ff5ad830b87ad672d9f41c0fff482472` |
| `skills/spec-doc-review/references/document-classification-signals.md` | `1ed3912800202568bc81337d3ed33a4fb2be36643d933da9ae9e459d962c7cdf` |
| `skills/spec-doc-review/references/walkthrough.md` | `e947cb3f15aa78e91adb060c945a7a6b51d222ae2e8da0112eabac16f1e58ba6` |
| `skills/spec-doc-review/references/cross-model-review.md` | `26bac2cfa45ce9ce63853750b3fda13b14c8b0a248cb7755c7e7c21f0b737592` |
| `skills/spec-doc-review/references/cross-model-eval.md` | `6dc69f8ea8a2c9cec050489a19ebda7f4f312a00aea4321655f49fef28cb2ee3` |
| `skills/spec-doc-review/references/personas/adversarial-document-reviewer.md` | `24406e816c011770207ca9e92963215bf4b8026b6b426f548e9653a76868dbc5` |
| `skills/spec-doc-review/references/personas/coherence-reviewer.md` | `38fba97f4274d7413b138ed844ac2f5ae9ec073b60f1a40debbb122d5a7e2c9b` |
| `skills/spec-doc-review/references/personas/design-lens-reviewer.md` | `8ab743d6aaa596d2c0b97ef0949dc6b2ed53c87354ef4eeb701357ef598ef84e` |
| `skills/spec-doc-review/references/personas/feasibility-reviewer.md` | `3a5948f08f1860c8ce2b8f13d53b6d4121e1759386725d2396d733ca6f3e29d7` |
| `skills/spec-doc-review/references/personas/product-lens-reviewer.md` | `bf457abbee9230448560059faab030e22a000b52ca24c2d93fc16320a46a9637` |
| `skills/spec-doc-review/references/personas/scope-guardian-reviewer.md` | `52ee2041b400a63ebe5eb19e7cef3a19ca4cc25745cdb4df51bd968fb3dea45e` |
| `skills/spec-doc-review/references/personas/security-lens-reviewer.md` | `8ee54ce6ad97d87c7c959d6e0341701d462fffad7efb75c887df2fc7c337cd8a` |
| `skills/spec-doc-review/references/personas/whole-doc-reviewer.md` | `5768aec1aba35853a37585fe7ea2ae7808ae94d581c81a2e919599b5d21da2fe` |
