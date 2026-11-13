# spec-code-review ↔ ce-code-review 全量源码审查

状态：双方包内全部文本、直接合同/测试与shipping消费者已逐段审读。生成 `.pyc` 单列为非source缓存。源码审查完成，不代表优化实施、独立审查或真实模型/宿主收益。

## 意图与融合裁定

双方都以缺陷、测试与标准为审查目标。spec-first增加跨宿主授权、immutable PR身份、任务归属快照、finding验证三态与下游closure；这些增强有明确研发消费者，不能以CE更短或可运行为由回退。

| 能力 | 双方源码依据与理解 | 裁定与建议 |
| --- | --- | --- |
| 范围与证据树 | local `scope.md`、`review-scope.py`、`pr-head-ref.py`固定host/repo/head/base、NUL路径与任务自有untracked；CE偏向origin分支。local `select-and-route.md:82`仍从workspace枚举标准 | 保留local快照和身份绑定；remote标准、unchanged callers也应从同一reviewed revision发现和读取。吸收CE symbol/AST/text证据分级与absence必须穷尽的提示，不把provider结果当结论 |
| depth与roster | CE `select-and-route.md`按语义风险lite/focused/full，core correctness，其余按域；local固定六个always-on，tiny要求1..39且无uncounted，文档/schema full | CE条件roster值得质量优先的受控对照；不能机械搬200阈值。明确用户全量约束始终覆盖成本优化；本轮无抽查 |
| 标准权威 | CE指定CODING_STANDARDS优先且不叠instruction；local支持AGENTS/CLAUDE scoped governance | 可借指定criteria定位，不静默降权项目治理。具体冲突按owner权威解释 |
| finish owner与输入 | local `finish-review.md`已有完整constraints/plan/roster/settlement/peer输入，单owner串行；CE拆分finish leaf | 保留local，不增加leaf重启或重复peer。CE合并、settlement和direct-dependency处理后重跑mechanics可窄吸收 |
| validator | local逐项独立验证、常规cap15且所有P0/P1保留；三态与protected-source重核。CE批量cap8 | 保留可信度边界；批量验证仅作成本实验，不能用共识代替source。Stage6新补计划遗漏应先回到验证、编号和action路由，不能绕过Stage5 |
| inline fallback | local缺dispatch一律Not ready，degraded亦禁止apply；work shipping存在manual/native fallback | 区分用户/调用者明确要求独立gate与一般owner review。缺独立覆盖仅限制对应claim，不能无条件推导整个研发不可用；尚无真实模型阻塞结果 |
| 下游修复 | LFG显式禁止unresolved/rejected；work `review-findings-followup.md`主要信任producer过滤 | 建议work增加validation_status防御并对齐green-but-unverifiable话术。这是consumer韧性缺口，不称正常producer必然泄漏 |
| persona条目 | CE reliability具体finally/defer/using错误路径释放；testing强调确定性、隔离、顺序；migration明确expand→migrate→contract；maintainability列数据局部性气味 | 窄补这些具体研发检查；保留local DAMP/fidelity/RED历史边界、前端/API/telemetry证据增强。气味是候选，不能自动升缺陷 |
| 错误泛化 | 双方千行阈值自动P1/100、无agent integration最高严重度、Swift闭包/SwiftUI推断过宽 | 不因双方一致就采用。必须有产品activation、实际retain path、依赖图与行为后果。保留local security禁止为过门把anchor50提升P0的规则 |
| cross-model | local adapter/runner明确拒绝无authenticated producer，当前dormant；CE ACP/acpx0.21.0具deadline/retry/reap等，但default allow空仍可能外发，Grok大diff no-fs仍有原生write | 保留local准入；不借CE可运行性降低egress或write边界。仅可借生命周期诊断、partial终止记录、可选cost；未知token不填0，stage elapsed之和不冒充wall time |
| 例子一致性 | 双方output example有early-return taste75、P0却Ready with fixes、actionable漏#2/#4；pre_existing去留说明与JSON不一致 | 规则/模板/示例一起收敛；这是源码漂移，不冒充已观测模型错误 |

## 已复现的确定性缺口

完整输入、stdout/stderr、exit与临时fixture过程见上级 `code-review-source-probes.json`。

1. local `scripts/findings-mechanics.py:219` 对任意P0豁免置信度门。P0/confidence0/无first_evidence仍进入primary；合同要求P0例外为anchor50+。CE同样存在，不能原样搬入。
2. P2/confidence0附 `settled_conflict:true` 也进入primary；schema未定义该field，helper未验证其类型/证据。settlement不能单凭truthy值提升缺陷可信度。仅证实helper，未声称最终validator也放行。
3. fingerprint将路径lowercase。synthetic `src/A.js` 与 `src/a.js` 同line/title被合为1条。两方共同问题；本机只做synthetic输入，未创建真实双文件或证明macOS文件系统行为。
4. `evals/fixtures/scripts/check-r2-preset-applied-fix.sh`只验证话术、HEAD未变和diff hash变化。隔离副本prepare后仅追加注释、保留tenant-bypass；final message写“已修复”，judge exit0，而真实 `node --test test/orders.test.js` exit1。证明judge假阳性，不证明真实模型曾这样操作。

## 验证与边界

现有6个Jest suite、87个test全部通过，结果保存在 `code-review-tests.json` 与 `.log`；不覆盖上述4类反例。未调用peer、外部连接器、真实host或模型，未派独立reviewer，未实施产品修复。本次产物只描述source结构、确定性局部行为与融合判断。

最小顺序：先修helper门槛/字段/路径身份和修复judge → 统一末轮mechanics/Stage6验证及consumer三态 → 窄补persona与remote标准树 → 再对条件depth/批量validator做真实研发质量与成本对照。跨模型准入与真实模型效果另行验证，不能由本轮通过数外推。
