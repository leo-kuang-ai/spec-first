# spec-sweep 全量源码对照审查

状态：`source_review_complete`。双方34个文本资产共6422行已逐段读取，或以已全文审读且当前hash相同的资产复用；另1个pyc仅核类型/hash，不执行、不计文本全文。分析器复用上一项完整审查，其4个反例同样影响本地Sweep projection。逐文件见 [文件表](../file-tables/spec-sweep.md)。未读取真实Slack/Issues/邮件、未发ack、未提交/push，全部report-only。

## 意图、继承与融合裁定

Sweep连接反馈→需求→计划→实现→验证关闭，以持久item identity和cursor避免丢单/重复确认；它不是另一个执行总路由。状态脚本持有机械事实，LLM判断反馈意义、源码surface和产品决策。两方source personas把是否merged写成“脚本决定”不准确：脚本只检查字段，实际merge判断仍是orchestrator调用git/gh后的证据责任。

| 研发能力 | CE代码事实 | 本地现状与增强 | 裁定及最小建议 |
| --- | --- | --- | --- |
| 多源归一与恢复 | Slack own-identity reactions、GitHub label/timeline、email experimental；统一id/origin/body/media | 本地主流程完整继承，inline/serial可降级；source数据不能授权写入 | 能力已融合，保留；可吸收CE明确模式alias说明/简洁完成出口，当前主要需求是正确性而非更多connector |
| ack→read-back→state→cursor | 两方均按cursor顺序，读回确认再upsert/advance，source writes来自standing config | 本地新增明确不得越过ack-deferred gap；脚本仅存在性与monotonic，不证明ack | 保留本地增强；用source recorder验证相同item失败后后续不得越gap。不要把脚本existence check外推为源端确认强制 |
| 外写授权 | CE config standing approval覆盖指定reaction/label；shared状态默认commit/push协议 | 本地拆commit/branch mutation/landing与dispatch/sensitive/transcription；默认repo-local durable state永不stage | 保留本地独立边界，不迁回默认commit/共享state或临时state持久化。setup已捕获的明确授权持续有效，不逐轮重问 |
| 并发与lease | 两方single-writer lease、OS flock、atomic replace、过期保守reclaim、last_run可lease-agnostic写 | 核心机制同源，本地未补锁建立失败/Windows无锁的响亮降级；见SW-01/02 | 先兑现确定性floor，不能把OS锁失败静默变“单writer约定”；不需新中心状态机 |
| shared branch | 两方先push lease，最终commit/push发生在run-record/lease-release之前 | 本地加授权但继承顺序，远端最终仍可能保留held lease和旧last_run | 保留显式opt-in；需把成功release/record作为末次publication的一部分，并确认远端结果；失败保留可恢复状态，禁止提前声称repo-wide lease已释放 |
| 已修复判断 | CE PR view只读mergedAt/baseRefName，upsert却要求verified_merge_sha | 本地PR view补mergeCommit，明确repo/default branch identity与sha、read-back closeout | 本地增强正确；继续保留“merged≠语义已修该反馈”的证据限度；不可由body中的“已修”直接关闭 |
| 媒体反馈 | 两方scratch→analyzer→finding pointer，3次失败manual_stuck，scratch失败仍继续fix/cleanup | 本地独立外发事实和sensitive强制no-transcribe；包内projection同hash | 原能力已融合，修Riffrec的receipt/partial/事件事实缺口；template须增加egress授权槽，不能靠全局context假设worker得到 |
| rolling需求计划 | CE machine/human区域、stable R-ID、closed/source_gone drain、已有HOW应rotate | 本地补requirements-only元数据、固定docs/plans，仍仅双metadata判rotation | 保留owner区分；吸收CE对“含HOW就不可重写”的内容判别意图，防metadata过期误写；同日archive应唯一命名/禁止覆盖 |
| 计划到实现 | CE给lfg-ready requirements，LFG先plan | 本地Sweep模板source=spec-sweep，显式path可被Plan enrichment；LFG要求Plan返回implementation-ready code | 保留先Plan再Work；Plan intake开头却称“exactly two origins”，只列brainstorm/legacy，与explicit-path宽分支冲突，应明确Sweep显式输入可接受、自动发现不扩大。不得靠改producer身份冒充brainstorm |
| legacy恢复 | CE source-map只映cursor，items仍bare id | 本地import items复合key+source map、unsourced计数、未知字段/状态保留 | 本地实质修复保留；不能复制CE旧import覆盖。聚焦测试确认该增强，不证明全量运行 |
| 配置与宿主 | CE local→shared cascade、docs_root唯一shared配置，明确invocation随宿主渲染 | 本地统一config.local和固定docs/plans是有意设计；wrapper探测Python3 | 不整搬CE config/docs_root体系；只在真实团队共享来源需求出现时由本地config owner扩展。可补实际宿主 invocation提示，但不硬编码不存在的command |
| headless与产品决策 | CE无question primitive则headless，setup fail closed，产品决定defer | 本地保留；eval仅验证一句requires interactive setup | 结果eval补“零config/lease/source写”与普通已配置headless的正例；不要从一句输出推断未写 |

## 已执行隔离复现

[脚本](../sweep-boundary-probe.py) / [结果](../sweep-boundary-probe.json)。只操作自动清理的临时目录，不创建真实共享分支，不碰连接器。当前代码事实；未做Git历史归因，未独立validator。

| 编号 | 源码 / 合同 | 实际输出 | 影响与最小建议 |
| --- | --- | --- | --- |
| SW-01 P1候选 | `_run_locked`在open失败后直接handler；首次parent尚不存在 | `.lock`是目录仍OK且state_created=true；全新parent首次acquire也OK，lock_created=false | 互斥保证不成立，尚未复现真实lost update。先安全建立owner目录，再原子开锁；锁不可用应明确blocked/degraded且不做需要互斥的写，Windows用真实可用锁或显式不支持并发 |
| SW-02 P2 | `_run_locked`的open(lock_path,'w') | 临时`.lock`链接指向临时sentinel，lease-acquire OK，sentinel从KEEP变空 | 在flock之前已跟随链接截断；仅临时文件损失，不声称真实攻击。用不截断、no-follow、owner/type校验的锁文件，不把文件名后缀当安全边界 |
| SW-03 P2 | `write_state`重设schema_version=1；schema承诺future writer field-preserving | seed schema_version2，run-record OK后变1；future_field仍保留 | 未来reader失去版本语义。不能无声降版本；明确保留可兼容版本或拒绝未知版本，配forward/backward fixture |
| SW-04 P2 | `cmd_upsert_item`只merge；validate另一个命令才降级 | upsert closed无任何evidence先OK并持久closed；下次validate才fix_pending | 不能称closed证据已在每次写时强制；close时验证三字段的确定性形状，语义merge事实仍由owner证明，缺能力保持约定并披露 |

前三项两方均存在相同机制；本地增强没有改这层。SW-04 validate修复存在且真实生效，仍留下本轮close→plan drain之间的误关窗口。非空字段也不等于git/gh confirmed merge，不应通过脚本代替语义判断。

## 源码合同与边界候选

- shared final commit/push在record/release之前，两个文件的同一顺序都不能证明远端最终lease已释放。本轮未做remote fixture，不声称真实多机互斥已验证。
- `run.md`媒体阶段要求传egress fact，persona需要该输入；`subagent-template.md`却无相应slot，也没有receipt输出字段。应把事实来源/授权范围/receipt写入最小packet，缺字段保持no-transcribe，不能推定有权。普通dispatch仍不等于sensitive delegation。
- source personas称脚本决定already-ack/merged，实际engine不调用连接器/git。建议改成“orchestrator据直接证据判断、engine维护机械事实”，避免authority误归属。
- `load_state`只验证schema key存在，容器/版本类型和YAML orphan缩进可被宽松处理；schema却说无效文件CORRUPT。未知业务字段应保留，结构损坏应拒绝写，不需要扩大成复杂业务规则引擎。
- CE明确UTF-8读写并捕获UnicodeDecodeError，本地用locale默认编码且未捕获该错误；这是可窄化吸收的跨平台修补，需非UTF8 locale fixture，不用macOS通过证明Windows。
- Slack只抓in-range parent的thread replies，老parent上的新reply没有明确获取路径；大批量pagination/截断时的cursor策略仍需源工具事实。只作源码coverage风险，不声称已真实丢反馈。
- GitHub persona用repo scope或dry edit probe推写能力，token scope不证明具体repo label权限；例子缺显式-R/config target。建议只读readiness事实，实际外写返回值与read-back决定结果，禁止“探测权限”误写其它repo。
- `sensitive`仅删除body/quote，schema承认其它字段保留；不可宣传为通用PII清除。titles、URLs、media字段仍需最小化，source flag改变对历史项仅re-ingest才生效。
- `.lock`文件是持久存在的辅助文件，代码不unlink；schema称ephemeral更准确应指不入Git，而非进程后消失。删除已打开锁文件可能破坏互斥，不建议为了“清理”随意unlink。
- Sweep source marker只产生requirements，template没有`execution: code`或status；让Plan owner按真实语义补实施字段，不让Sweep提前伪装implementation-ready。是否要求requirements统一metadata由Plan全包项再核。

## 验证及建议顺序

聚焦现有测试2 suites / 6 tests通过，5项非Sweep测试按name过滤未运行；`sweep-tests.json/log`保留真实统计。legacy同id跨source/source_map/unsourced已覆盖；新增锁/版本/close反例不在既有绿色覆盖内。Riffrec 3 suites/19 tests与4个probe从canonical同hash复用，没有重复跑或假称Sweep现场验证。

本轮保护复核：297个baseline source hash全部一致。源码读取复用hash不代表语义自动通过，本文已逐职责裁定。

最小顺序：先修锁建立/锁文件路径与闭合证据floor；统一版本/UTF-8；明确shared publication尾部与media授权packet；再补connector recorder、计划rotation/稳定ID和完整源分页fixture。真实源端任务与多机运行仍未验证；不导入新controller、自动并行、默认push或第二反馈状态writer。
