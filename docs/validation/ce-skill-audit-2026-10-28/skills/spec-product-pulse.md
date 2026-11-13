# spec-product-pulse 能力融合审查

状态：`source_review_complete`。双方20个包内文件/1231行全部全文审读；本地interview截断部分85–205已单独补齐，CE interview1–145及146–260分段全文读。直接strategy consumer合同与专门pulse测试全文核对。

## 定位与融合判断

双方都把产品使用、用户获得价值、系统性能接回研发反馈，不是发布日志或报警系统。本地已在CE基础上增强逐source证据、隐私最小化、固定artifact owner与宿主中立；本项没有发现应整块新增的CE研发能力，优先收敛既有合同中的不一致。

| 能力 / 研发场景 | 双方源码事实 | 融合裁定与最小建议 | 验证、成本与限制 |
| --- | --- | --- | --- |
| 从战略到可测量信号 | 双方interview1–6区分engagement/value/conversion、SMART、一信号一canonical source、pending/excluded，不将无埋点丢失 | **已有等价能力，保留。** 本地strategy-source集中复读当前文件、source优先级与显式legacy delegation，比CE分散setup/report清楚 | 不为parity添加另一个strategy parser；strategy不由pulse反向修改 |
| 单页反馈与查询负载 | 双方15min buffer、等窗delta、analytics/tracing/payments并行、DB serial且只读、30–40行 | **已有等价能力。** 保留cheap/indexed query和DB显式开关；缺source保持边界，不把单页约束当作删失败receipt理由 | 无线上DB/analytics调用，本项不证明负载和指标准确性 |
| 失败不伪造零 | CE report无值写no data且可删无数据行；本地run每source receipt，confirmed-zero仅成功测量数值0，区分denied/partial/not-run | **保留本地增强，禁止回退。** 建议模板Allowed states列表与入口/run统一：report前部及footer漏not-run，末尾checklist又允许 | 这是同一包内可证实歧义；纯文本，无实际provider hard enforcement；应增加失败/空结果/分页截断behavior eval |
| 质量评分前的内容边界 | CE仅要求saved report不含PII；本地run与interview先披露context处理、provider侧去直接身份和无关字段、不可投射则not-run，不在入context后假装补救 | **保留本地增强。** 不导入原始conversation采样路径 | 真实provider是否能投射未测，prose合同不等于隐私已验证 |
| 评分尺度 | 双方run仍“normal默认4–5，全部5又too loose”，interview要求5/3区分、可复核note | **不照搬CE已继承的分布偏好。** 候选按用户定义锚点评分，允许真实全5，记录样本局限，不能强迫分布 | 当前config只存dimension而未给scoring note显式稳定key，setup采集的note下一轮未必可恢复；先明确最小保存/消费位置再考虑扩展 |
| metric source默认路由 | 双方interview要求只对偏离class default者存override，例如revenue默认payments；config/report却统一未映射者fallback analytics | **双方共有矛盾，建议本地收敛。** 用明确per-metric canonical映射消除推断；或在现有语义层统一class default，不脚本硬编码业务优先级 | 触发：revenue metric在Stripe、analytics PostHog且未显式override，报告可能读错source。可用双source fixture验证，不需要连真实账号 |
| 配置与artifact边界 | CE双层config和可配docs_root；本地machine-local单文件、固定docs/pulse-reports，保留非pulse keys | **保留本地设计。** 不因CE可配就引入双层cascade/新root，跨宿主不能假设用户源码docs为输出root | local config是否gitignored需真实检查；未授权修改此项目配置 |
| performance与schedule | CE interview允许top3/skip latency但schema不存且末段写不配置；schedule interview与入口的owner也不同；本地固定top5/三percentile，pulse_schedule可持续保存且host scheduling handoff | **本地已修等价源矛盾，保留。** 不导入CE customization或强制schedule skill；用户明确manual后不得反复nag | 本地hourly被识别为schedule关键词但非pulse_schedule枚举，宜明确仅ad-hoc提示，不静默写非法值 |
| capability适配 | 双方interview6.1硬点名search_mcp_registry/suggest_connectors，本地入口其他部分已capability matched | **建议本地补可用工具分支。** 当前host没有这两个名字时检查实际capability并选CLI/API/manual，不假调用或强制安装 | CE无更好现成实现，属于本地已有host-neutral原则延伸；不扩大setup外写权限 |
| eval和持续反馈 | 本地唯一case只用问句judge证明未配置时提问；不证明无空报告、只读、失败分层、source selection和privacy gate | **建议先补结果回归**，复用现有receipt语义，不新增中央数据仓库/调度系统 | static tests检查措辞，真实source/query/quality收益均未验证；无独立validator |

## 直接检查与限制

全文读`tests/unit/spec-product-pulse-contracts.test.js`、`spec-strategy-contracts.test.js`；specialized校准测试已全文并同hash复用。双方没有包内执行query的程序，provider动作和语义是LLM责任；不能因为source说read-only就声称DB权限已硬强制。本项没有运行任何产品数据工具或调度/外写。后续先统一metric routing和receipt枚举，再补实际结果eval；CE可复用的指标访谈核心已经存在，不以新增功能数量衡量融合。`validation_status: unresolved`。
