# spec-debug 能力融合审查

状态：`source_review_complete`。双方31包内文件/2375行全部全文读；长入口、双方investigation-techniques分段，截断部分补读；CE anti-patterns与已全文本地文件cmp一致后复用。直接共享verification/honest-closeout两份合同、两份schema、1124行helper实现、本地三份debug测试、LFG真实watch intake全文核对。

## 研发意图

双方以触发→状态变化→症状的因果链为核心，用独立预测、最小复现、一次一个假设和失败失效避免猜修。本地加上source/target/dirty边界、持续任务授权、唯一browser owner、真实命令记录和caller-owned local-only返回；CE最新有更明确的复现完成定义、性能归因、无测试seam时防伪测试、proof-test传递与知识去重。这些能力应按本地证据链适配。

| 研发能力 / 场景 | 双方源码事实与本地增强 | 融合裁定与最小建议 | 验证、成本与限制 |
| --- | --- | --- | --- |
| 复现完成定义 | CE investigate:29要求命名、重复可运行且已在原症状失败的check；本地入口有reproduce/anti-rationalization与structured original reproducer，但Phase1没同样明确的红色仪器定义 | **优先窄化吸收。** 给原症状check稳定标识、失败依据、重跑方式；cannot reproduce保留captured evidence/hypothesis边界 | 不用“source有可疑行”代替红环；也不排除可回源replacement evidence；小确定错误保留fast path |
| 性能故障 | CE investigate要求先读Performance Regressions，techniques明确baseline→profile/per-stage归因→同测复验/bisect；本地defense尾部只有numeric baseline短句，techniques缺此专节且入口未触发读取 | **建议集成。** slow/timeout信号在既有Phase1加载短性能段，稳定输入/环境和数字，归因再修 | 与spec-optimize分工：已异常的性能先诊断，正常系统相对优化另归optimize；本轮不重复测产品性能 |
| 无合适测试seam | CE fix:9明确不能给真实触发链建测试时不写shallow test，保留missing seam并用原复现check；本地fix:8–11没有同等exception且通篇要求chosen regression | **建议适配。** 缺test seam只免伪测试，不免原症状验证；记录why、替代可重跑check、coverage gap与是否需后续seam | required/not-run仍阻verified，不能把“CI以后会测”升级成本地通过；不要硬造新test file或无价值assert |
| proof-test连续保护 | CE post-fix-handoff把bug regression path作为proof-test传simplify；本地tail只给fix-owned scope，未明确传proof-test | **优先集成。** 使用已存在的实际regression文件路径/案例和原check，不复制测试；simplify owner保护proof而非冻结生产实现 | 与simplify逐项结论一致；本地callee未接proof-test前只能明确protected boundary，不虚构已支持token |
| 既有测试/意图 | 双方优先现有tests、加强overmock，deliberate expectation reversal视divergent；本地先读current instructions/test style | **已有等价/更强，保留。** 不以变绿为由更新正确预期；最小修复后再做已授权结构性预防 | CE defense去重复犯错意图本地已融合，且窄化非默认抽象，不需要重复新增治理 |
| dirty tree归因 | CE默认stash -u，准确恢复本run对象但称消失即cause；本地优先archive/isolated comparison、等价环境、消失只implicate状态 | **保留本地增强。** 不导回自动stash或“WIP已证明根因”；bisect也须在隔离/可恢复环境中 | 双方techniques仍直接示例git bisect且解释非zero即bad；真实git bisect中125是skip，建议补这一重要工具语义和checkout保护 |
| 假设质量/异常定位 | 双方assumption verified/assumed、competing explanation、observed values、boundary instrumentation、observer effect、条件等待等 | **多数等价，保留。** 多subsystem仅是调查线索不能直接证明设计错误；单次alone通过也不能confirmed order pollution | 后两句双方共有强断言，建议降成hypothesis+随机seed/前驱对照证据；避免把启发式升级事实 |
| scope、授权与browser | 本地source owner/target、dirty重叠保护、repair持续而不含commit/landing；CE默认ship/PR、自由browser | **保留本地增强。** 不导回默认提交/外发；browser origin由caller授权，直接副作用和运行权限分开 | local techniques“Port detection...fallback3000”仍与同段caller-supplied exact origin相冲突，应删该隐式origin推导，交caller核提供 |
| caller return与恢复 | 本地pipeline-return只fix+verified envelope，不commit/push，保留完整needs-human来源；CE另分pipeline推送与return-to-caller提交 | **保留本地单owner。** LFG pr-watch明确接fixed-not-pushed/legacy fixed时核root/paths/check证据并重走final verification | 已核真实forward+intake，不只反向claim；CE trajectory“迁移一次非振荡/排除外部变化”可窄化吸收为caller已有循环证据的判断提示，不新增状态机 |
| 不可复现与完成 | 本地普通closeout命令证据、原repro/regression缺失不能verified；pipeline envelope可返回working-hypothesis/needs-human | **保留严格claim上限。** fix.md“让caller CI stand as verification”不能被解释为尚未运行CI已通过，需统一为pending evidence | helper只校check结果一致性/日志路径/known-secret patterns，未执行命令、更未判断因果/语义；overall verified只证明所提交claim一致，不证明所有必测被穷举 |
| 知识何时值得保存 | CE post-fix最后的counterfactual：丢掉learning后能否从code/tests/types/comments恢复；本地主要one-sentence、3+locations/共享错误假设 | **建议吸收反事实价值检验。** 保留本地completion checkpoint，无PR前置，不因3次重复或一行可写就自动capture | downstream compound仍需verified/reusable/invalidation；不新增自动docs或默认push，用户已授权该artifact才能执行对应副作用 |
| eval证据 | 本地诊断judge冻结三个fixture/hash/index，修复judge真实loopback测400、存活、合法数据和no commit；prior-attempt judge仍仅message词表 | **保留真实结果校准并补缺口。** 加原始全角问号正例、已有attempt列表无需重复问的case、调用顺序trace与pipeline no-mutation边界 | 三suite20tests通过；实际“你已经试过哪三种办法？”两judge均exit1，见debug-question-judge-probes。词表不证明先问、只字节hash也不证明诊断正确 |

## 接口与验证

`verification-run-summary`实现会新建workflow-local不可覆盖summary、校验status/ran/exit/log组合并扫描日志已知secret模式；`honest-closeout`验证validation refs与全run聚合，不让passed子集隐藏failed/not-run。impact/review refs检查存在/contained regular file而不读语义，knowledge refs只限docs/solutions；不应把这些机械检查称语义充分或真实收益。读schema metadata中producer-available=false也不能覆盖真实helper与CLI事实。

本轮实际运行`debug-contract-tests.json/log`：3 suites / 20 tests通过，含隔离HTTP Judge正反校准。`debug-question-judge-probes.json`只验证两脚本的全角问句误拒。没有执行模型debug eval、真实业务修复、browser或外部tracker操作。共享helper的深层通用依赖未在本项递归审完，其本项直接接口已核，整体代码审查/全局合同闭环仍待后续owner项完成。

优先顺序：补复现仪器/性能归因和无seam诚实路径→proof-test链→清理隐式port与CI未来验证措辞→结果eval与知识价值。report-only，产品未改。
