# spec-test-browser 能力融合审查

状态：`source_review_complete`。双方14包内文件/2280行全部全文阅读；本地wrapper1346行分四段，conformance268行完整读。直接本地1078行unit、test helper、test-suite runner、LFG stage-routing；CE driver-policy测试和对应guide/index均全文读。复用前次consumer-tests中本项unit通过的证据，不重复同source测试。

## 定位

CE是用户可用、host-native优先的浏览器检查，pipeline还启动server。本地改为internal唯一browser owner，caller负责server，以exact-origin、私有run、严格action和synthetic值为执行地板。比较应保留这些研发安全与证据增强，按真实能力吸收CE可观察和自适应检查的价值。

| 研发能力 / 场景 | 双方源码事实与本地增强 | 融合裁定与最小建议 | 验证 / 限制 |
| --- | --- | --- | --- |
| 差分到route | CE入口硬编码main；本地route reference按实际PR base/head及repo base，要求不丢unreachable route | **保留本地更强实现。** pattern只是起点，共享component影响须读源码，不能按扩展名断言不适用 | LFG stage-routing按changed user-visible flow判断applicability，与owner一致；无真实业务route验证 |
| host-native driver | CE按能力优先native，fallback agent-browser，初始化后不混driver；本地固定wrapper/conformance | **有条件吸收。** 宿主若可提供同等request-time origin、隔离/cleanup、私有证据和effect边界，由唯一owner适配其native primitive | 不把“宿主内置”当权限或请求约束证明；当前没有相同保证，不能简单删除wrapper或增加旁路 |
| 可见性/观察 | CE unattended不等hidden、native可见非阻塞，CLI手动问headed；本地所有调用无headed选择 | **按需实验。** 若获支持且不破坏隔离，可把可见性作为owner内部能力而非反复阻塞提问 | 需真实host/provider行为证据，不能由源码判断可见成本和收益 |
| 当下状态驱动交互 | CE每次snapshot后选locator并检查结果；本地不可变整run plan、ref/role/label/testid/text allowlist，明确不能express则记gap | **优先吸收闭环意图。** 先研究owner内保留同一隔离session的有界observe→validated next step；保留hash/新鲜状态和effect前置 | 当前先写完整plan无法预知新snapshot refs；准备第二run会新session，不能称完全自适应；不建议直接开放argv/eval |
| origin与effect | 本地scalar origin严格loopback、计划拒绝credential/literal，能力需producer，effect由LLM判断；CE只local URL和approved driver | **保留本地增强。** raw duplicate token仍是loud convention，非script gate；origin不能证明server source身份 | 单元测试mock probe/runner不是浏览器安全证明；capability-cases只说明合同，不是可执行host eval |
| first-open顺序 | wrapper PAGE_CONTEXT_ACTIONS不含vitals；validateStep允许vitals route，buildActionArgs实际传URL | **需修正确定性顺序。** 允许viewport等无页面设置，但vitals导航/测量应在首个open成功后 | `browser-source-probes.json`真实调用wrapper验证接受vitals→open，fake runner顺序为vitals/open且open失败。仅机械/序列反例，无真实vitals网络调用；P2候选 |
| conformance cleanup | producer finally中await close但不检查结果，随后删除runRoot，result passed只看positive/negative/hits | **建议补cleanup独立receipt并阻断泄漏claim。** 保留failed close证据和最小恢复信息，不能删除唯一诊断再报干净 | 隔离fake binary让close固定exit9，其余受控response，producer仍exit0/status passed；证明producer忽略cleanup，非真实provider通过。P2候选 |
| 能力探针可靠性 | 本地realpath/hash/size与run前再查、9场景positive+negative、禁止provider自证；CE installed core文档匹配工具版本 | **已有更强地板。** 可吸收“CLI缺失/launch失败分开”给准确reason；不按help marker强称ready | hash仅入口binary不等transitive provider依赖身份；conformance为本轮有限场景，不能推导所有环境/任意页面全安全 |
| 私有证据和清理 | 本地new leaf0700/文件0600、wx预留raw、每步重核plan、close仅session/namespace；CE截图无同等封装 | **保留。** cleanup当前用PATH command而run用identity path，后续可绑定同一运行binary降低工具变动时误清理风险 | 没有真实PATH变动复现，不作为已证缺陷；Windows icacls用fake runner，不算Windows权限保证 |
| 测试/报告 | 本地Fail不得变Skip、缺origin not_run、cleanup独立阻塞、限scope claim；CE failure选择skip会覆盖失败语义 | **保留本地报告。** 补真实fresh-source零调用trace与至少一个有界正向flow；a11y当前只是snapshot别称完整无障碍audit | eval仅output_contains reason，不能证明未读scripts/未启动server；本项已读所有source，无真实host/browser eval |
| 服务器与生命周期 | CE resolve-port/start/free scan；本地完全caller-owned，LFG只forward显式origin不启动 | **保留本地ownership。** server readiness、源码身份由caller证明，owner报告仅当前origin观察 | 不重新导入退役runtime profile/managed server；dogfood复用listener归其caller问题，不混淆为browser origin失败 |

## 最小落地顺序

先修vitals顺序和conformance cleanup证据，再评估自适应交互的最小owner内接口；native可见driver只有等价能力证据后实验。保留source/runtime、effect、exact-origin与caller-owned server。probe在workflow和run分别执行且无cache，可能每个scenario重复重型conformance；先测真实成本再考虑run-local freshness复用，不能为性能静默删除能力门槛。

本项仅source比较与隔离机械探针完成，无产品源码修复、runtime刷新、独立审查或真实宿主验证。`browser-source-probes.json`明确记录in-process seam和fake binary，不能当producer/provider真实conformance通过。
